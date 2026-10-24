import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import http from 'node:http';
import net from 'node:net';
import path from 'node:path';
import { after, before, describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '..');

function loadPlaywright() {
  const require = createRequire(import.meta.url);
  try {
    return require('playwright');
  } catch {
    const npxDir = '/Users/diesel/.npm/_npx';
    if (fs.existsSync(npxDir)) {
      const candidates = fs
        .readdirSync(npxDir)
        .map((d) => path.join(npxDir, d, 'node_modules', 'playwright'))
        .filter((p) => fs.existsSync(p));
      if (candidates.length > 0) {
        return require(candidates[candidates.length - 1]);
      }
    }
    throw new Error('Playwright package could not be resolved for E2E browser verification.');
  }
}

function getFreePort() {
  return new Promise((resolve, reject) => {
    const srv = net.createServer();
    srv.listen(0, '127.0.0.1', () => {
      const { port } = srv.address();
      srv.close(() => resolve(port));
    });
    srv.on('error', reject);
  });
}

function waitForHealth(baseUrl, timeoutMs = 12000) {
  const start = Date.now();
  return new Promise((resolve, reject) => {
    const poll = () => {
      http
        .get(`${baseUrl}/api/health`, (res) => {
          let body = '';
          res.on('data', (chunk) => (body += chunk));
          res.on('end', () => {
            if (res.statusCode === 200) {
              try {
                resolve(JSON.parse(body));
                return;
              } catch {
                // retry
              }
            }
            if (Date.now() - start > timeoutMs) {
              reject(new Error(`Health check timed out after ${timeoutMs}ms`));
            } else {
              setTimeout(poll, 100);
            }
          });
        })
        .on('error', () => {
          if (Date.now() - start > timeoutMs) {
            reject(new Error(`Server failed to start within ${timeoutMs}ms`));
          } else {
            setTimeout(poll, 100);
          }
        });
    };
    poll();
  });
}

describe('Spec 043 Live Playwright Browser End-to-End Verification (/revcdos/)', () => {
  let serverProc = null;
  let baseUrl = '';
  let browser = null;

  before(async () => {
    const port = await getFreePort();
    baseUrl = `http://127.0.0.1:${port}`;
    serverProc = spawn(
      'python3',
      [
        path.join(REPO_ROOT, 'scripts', 'serve_skatealley.py'),
        '--host',
        '127.0.0.1',
        '--port',
        String(port),
        '--dir',
        REPO_ROOT,
      ],
      {
        cwd: REPO_ROOT,
        stdio: ['ignore', 'pipe', 'pipe'],
      }
    );
    const health = await waitForHealth(baseUrl, 15000);
    assert.equal(health.ok, true);
    assert.equal(health.revcdos_webapp, true);

    const { chromium } = loadPlaywright();
    browser = await chromium.launch({
      headless: true,
      args: [
        '--enable-webgl',
        '--ignore-gpu-blocklist',
        '--use-gl=angle',
        '--autoplay-policy=no-user-gesture-required',
      ],
    });
  });

  after(async () => {
    if (browser) {
      await browser.close();
    }
    if (serverProc) {
      serverProc.kill('SIGTERM');
    }
  });

  it('1. Pre-enabled full-game ownership gate, zero dead CDN requests, engine boot (mainCalled === true), lowercase vcsky/fetched streaming, and CacheStorage warm reload', async () => {
    const context = await browser.newContext({ viewport: { width: 1280, height: 720 } });
    const page = await context.newPage();

    const networkUrls = [];
    const failedResponses = [];
    page.on('request', (req) => networkUrls.push(req.url()));
    page.on('response', (res) => {
      if (res.status() >= 400 && !res.url().includes('favicon.ico')) {
        failedResponses.push({ url: res.url(), status: res.status() });
      }
    });

    await page.goto(`${baseUrl}/revcdos/`, { waitUntil: 'domcontentloaded' });

    const prePlay = await page.evaluate(() => {
      const btn = document.getElementById('click-to-play-button');
      const disclaimer = document.getElementById('demo-off-disclaimer');
      const checkbox = document.getElementById('disclaimer-checkbox');
      const backBtn = document.getElementById('revcdos-back-to-alley-btn');
      return {
        status: window.__REVCDOS_STATUS__,
        haveOrigStorage: localStorage.getItem('vcsky.haveOriginalGame'),
        btnText: btn?.textContent?.trim(),
        btnDisabled: btn?.classList.contains('disabled'),
        disclaimerHidden: disclaimer?.hidden,
        disclaimerText: disclaimer?.textContent,
        checkboxChecked: checkbox?.checked,
        backBtnHref: backBtn?.getAttribute('href'),
        replacedSample: window.replaceFetch('https://cdn.dos.zone/vcsky/fetched/AUDIO/Water.MP3'),
      };
    });

    assert.equal(prePlay.status.haveOriginalGame, true);
    assert.equal(prePlay.haveOrigStorage, 'true');
    assert.equal(prePlay.btnText, 'Click to play');
    assert.equal(prePlay.btnDisabled, false);
    assert.equal(prePlay.disclaimerHidden, true);
    assert.equal(prePlay.disclaimerText, '');
    assert.equal(prePlay.checkboxChecked, true);
    assert.equal(prePlay.backBtnHref, '../');
    assert.equal(prePlay.replacedSample, 'vcsky/fetched/audio/water.mp3');

    // Launch game and wait for vc-sky-en-v6.data (135,355,111 B) + vc-sky-en-v6.wasm + Module.mainCalled
    await page.goto(`${baseUrl}/revcdos/?autostart=1&skip_intro=1`, { waitUntil: 'domcontentloaded' });

    await page.waitForFunction(
      () => window.__REVCDOS_STATUS__ && window.__REVCDOS_STATUS__.mainCalled === true,
      null,
      { timeout: 25000 }
    );

    // Wait briefly for initial on-demand vcsky/fetched XHRs and WebGL2 frames
    await page.waitForTimeout(1500);

    const postBoot = await page.evaluate(() => {
      const canvas = document.getElementById('canvas');
      const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
      let nonBlackPixels = 0;
      if (gl && canvas.width > 0 && canvas.height > 0) {
        const w = 64;
        const h = 64;
        const buf = new Uint8Array(w * h * 4);
        const sx = Math.max(0, Math.floor(canvas.width / 2 - w / 2));
        const sy = Math.max(0, Math.floor(canvas.height / 2 - h / 2));
        gl.readPixels(sx, sy, w, h, gl.RGBA, gl.UNSIGNED_BYTE, buf);
        for (let i = 0; i < buf.length; i += 4) {
          if (buf[i] > 2 || buf[i + 1] > 2 || buf[i + 2] > 2) {
            nonBlackPixels++;
          }
        }
      }
      const hasIni = Boolean(
        window.Module &&
          window.Module.FS &&
          window.Module.FS.analyzePath('/vc-assets/local/revc.ini').exists
      );
      return {
        status: window.__REVCDOS_STATUS__,
        hasIni,
        gameIsStarted: document.body.classList.contains('gameIsStarted'),
        canvasWidth: canvas.width,
        canvasHeight: canvas.height,
        nonBlackPixels,
      };
    });

    assert.equal(postBoot.status.haveOriginalGame, true);
    assert.equal(postBoot.status.dataLoadedBytes, 135355111);
    assert.equal(postBoot.status.wasmReady, true);
    assert.equal(postBoot.status.mainCalled, true);
    assert.ok(
      postBoot.status.fetchedAssetsCount > 0,
      `Expected on-demand vcsky/fetched assets to stream (fetchedAssetsCount > 0), got ${postBoot.status.fetchedAssetsCount}`
    );
    assert.equal(postBoot.status.failedFetchesCount, 0);
    assert.equal(postBoot.status.lastError, null);
    assert.equal(postBoot.hasIni, true);
    assert.equal(postBoot.gameIsStarted, true);
    assert.ok(postBoot.canvasWidth >= 640 && postBoot.canvasHeight >= 480);

    const deadCdnHits = networkUrls.filter(
      (u) => u.includes('cdn.dos.zone') || u.includes('folder.morgen.qzz.io')
    );
    assert.equal(deadCdnHits.length, 0, `Expected 0 dead CDN requests, got: ${JSON.stringify(deadCdnHits)}`);
    assert.equal(
      failedResponses.length,
      0,
      `Expected 0 HTTP >= 400 responses, got: ${JSON.stringify(failedResponses)}`
    );

    // Verify Warm Reload hits CacheStorage (revcdos-pack-v1)
    await page.goto(`${baseUrl}/revcdos/?autostart=1&skip_intro=1`, { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(
      () => window.__REVCDOS_STATUS__ && window.__REVCDOS_STATUS__.mainCalled === true,
      null,
      { timeout: 15000 }
    );
    const warmStatus = await page.evaluate(() => window.__REVCDOS_STATUS__);
    assert.equal(warmStatus.cacheHit, true);
    assert.equal(warmStatus.dataLoadedBytes, 135355111);
    assert.equal(warmStatus.mainCalled, true);
    assert.equal(warmStatus.failedFetchesCount, 0);

    await context.close();
  });

  it('2. Static Host / GitHub Pages HTTP 404 fallback reassembles parts/vc-sky-en-v6.data.part00..03', async () => {
    const context = await browser.newContext({ viewport: { width: 1280, height: 720 } });
    const page = await context.newPage();

    const requestedParts = [];
    await page.route('**/revcdos/vcbr/vc-sky-en-v6.data', async (route) => {
      await route.fulfill({
        status: 404,
        contentType: 'text/plain',
        body: 'Not Found (simulated static host)',
      });
    });

    page.on('response', (res) => {
      if (res.url().includes('/parts/vc-sky-en-v6.data.part') && res.status() === 200) {
        requestedParts.push(res.url().split('/').pop());
      }
    });

    await page.goto(`${baseUrl}/revcdos/?autostart=1&skip_intro=1`, { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(
      () => window.__REVCDOS_STATUS__ && window.__REVCDOS_STATUS__.mainCalled === true,
      null,
      { timeout: 25000 }
    );

    const status = await page.evaluate(() => window.__REVCDOS_STATUS__);
    assert.deepEqual(requestedParts, [
      'vc-sky-en-v6.data.part00',
      'vc-sky-en-v6.data.part01',
      'vc-sky-en-v6.data.part02',
      'vc-sky-en-v6.data.part03',
    ]);
    assert.equal(status.dataLoadedBytes, 135355111);
    assert.equal(status.wasmReady, true);
    assert.equal(status.mainCalled, true);
    assert.equal(status.failedFetchesCount, 0);

    await context.close();
  });
});
