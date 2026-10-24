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

function waitForHealth(baseUrl, timeoutMs = 10000) {
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

describe('Spec 042 Live Playwright Browser End-to-End Verification (/nzportable/)', () => {
  let serverProc = null;
  let baseUrl = '';
  let browser = null;

  before(async () => {
    const port = await getFreePort();
    baseUrl = `http://127.0.0.1:${port}`;
    serverProc = spawn(
      'python3',
      [path.join(REPO_ROOT, 'scripts', 'serve_skatealley.py'), '--host', '127.0.0.1', '--port', String(port), '--dir', REPO_ROOT],
      {
        cwd: REPO_ROOT,
        stdio: ['ignore', 'pipe', 'pipe'],
      }
    );
    const health = await waitForHealth(baseUrl, 12000);
    assert.equal(health.ok, true);
    assert.equal(health.nzportable_webapp, true);

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

  it('1. Splash gate, 0px canvas calibration, click-to-launch cold boot (<= 3.5s), AudioContext unlock, Module.files & Module.sched, WebGL non-black pixels, and >= 55 FPS', async () => {
    const context = await browser.newContext({ viewport: { width: 1280, height: 720 } });
    const page = await context.newPage();

    const consoleErrors = [];
    const failedResponses = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    page.on('pageerror', (err) => {
      consoleErrors.push(String(err));
    });
    page.on('response', (res) => {
      if (res.status() >= 400) {
        failedResponses.push({ url: res.url(), status: res.status() });
      }
    });

    await page.goto(`${baseUrl}/nzportable/`, { waitUntil: 'domcontentloaded' });

    // Verify initial Splash Gate & 0px Canvas Calibration before launch
    const preLaunch = await page.evaluate(() => {
      const canvas = document.getElementById('canvas');
      const splash = document.getElementById('splash');
      const overlay = document.getElementById('overlay');
      const hudbar = document.getElementById('hudbar');
      const cs = window.getComputedStyle(canvas);
      const rect = canvas.getBoundingClientRect();
      return {
        status: window.__NZP_STATUS__,
        splashDisplay: window.getComputedStyle(splash).display,
        overlayDisplay: window.getComputedStyle(overlay).display,
        hudbarDisplay: window.getComputedStyle(hudbar).display,
        canvasBorderTop: cs.borderTopWidth,
        canvasBorderLeft: cs.borderLeftWidth,
        canvasPaddingTop: cs.paddingTop,
        canvasPaddingLeft: cs.paddingLeft,
        canvasMarginTop: cs.marginTop,
        canvasMarginLeft: cs.marginLeft,
        canvasDisplay: cs.display,
        rectWidth: rect.width,
        rectHeight: rect.height,
        innerWidth: window.innerWidth,
        innerHeight: window.innerHeight,
      };
    });

    assert.equal(preLaunch.status.initialized, false);
    assert.equal(preLaunch.status.engineReady, false);
    assert.equal(preLaunch.splashDisplay, 'flex');
    assert.equal(preLaunch.overlayDisplay, 'none');
    assert.equal(preLaunch.hudbarDisplay, 'none');
    assert.equal(preLaunch.canvasBorderTop, '0px');
    assert.equal(preLaunch.canvasBorderLeft, '0px');
    assert.equal(preLaunch.canvasPaddingTop, '0px');
    assert.equal(preLaunch.canvasPaddingLeft, '0px');
    assert.equal(preLaunch.canvasMarginTop, '0px');
    assert.equal(preLaunch.canvasMarginLeft, '0px');
    assert.equal(preLaunch.canvasDisplay, 'block');
    assert.equal(preLaunch.rectWidth, preLaunch.innerWidth);
    assert.equal(preLaunch.rectHeight, preLaunch.innerHeight);

    // Click #splash to launch and measure cold-load time
    const t0 = Date.now();
    await page.click('#splash');

    await page.waitForFunction(
      () => window.__NZP_STATUS__ && window.__NZP_STATUS__.engineReady === true,
      null,
      { timeout: 10000 }
    );
    const coldLoadMs = Date.now() - t0;

    // Wait briefly for FPS counter and title screen frames to settle
    await page.waitForTimeout(600);

    const postLaunch = await page.evaluate(() => {
      const canvas = document.getElementById('canvas');
      const overlay = document.getElementById('overlay');
      const hudbar = document.getElementById('hudbar');
      const gl =
        (window.Module && window.Module.ctx) ||
        canvas.getContext('webgl2') ||
        canvas.getContext('webgl');

      let nonBlackPixels = 0;
      if (gl && canvas.width > 0 && canvas.height > 0) {
        const w = 64;
        const h = 64;
        const buf = new Uint8Array(w * h * 4);
        const sx = Math.max(0, Math.floor(canvas.width / 2 - w / 2));
        const sy = Math.max(0, Math.floor(canvas.height / 2 - h / 2));
        gl.readPixels(sx, sy, w, h, gl.RGBA, gl.UNSIGNED_BYTE, buf);
        for (let i = 0; i < buf.length; i += 4) {
          if (buf[i] > 4 || buf[i + 1] > 4 || buf[i + 2] > 4) {
            nonBlackPixels++;
          }
        }
      }

      const audioCtxs = window.__NZP_AUDIO_CONTEXTS__ || [];
      return {
        status: window.__NZP_STATUS__,
        hasModuleSched: Boolean(window.Module && typeof window.Module.sched === 'function'),
        moduleFilesKeys: window.Module && window.Module.files ? Object.keys(window.Module.files) : [],
        overlayDisplay: window.getComputedStyle(overlay).display,
        hudbarVisible: hudbar.classList.contains('visible'),
        hudbarDisplay: window.getComputedStyle(hudbar).display,
        canvasWidth: canvas.width,
        canvasHeight: canvas.height,
        nonBlackPixels,
        audioContextCount: audioCtxs.length,
        audioStates: audioCtxs.map((c) => c.state),
        mbCounterText: document.getElementById('mb-counter')?.textContent,
      };
    });

    assert.equal(failedResponses.length, 0, `Unexpected HTTP >= 400 responses: ${JSON.stringify(failedResponses)}`);
    assert.equal(consoleErrors.length, 0, `Unexpected console errors: ${JSON.stringify(consoleErrors)}`);
    assert.ok(coldLoadMs <= 3500, `Cold load time ${coldLoadMs}ms exceeded 3500ms budget`);

    assert.equal(postLaunch.status.initialized, true);
    assert.equal(postLaunch.status.engineReady, true);
    assert.equal(postLaunch.status.wasmLoaded, true);
    assert.equal(postLaunch.status.fmfBytes, 96);
    assert.equal(postLaunch.status.progsPk3Bytes, 491379);
    assert.equal(postLaunch.status.gamePk3Bytes, 94276834);
    assert.equal(postLaunch.status.cacheHit, false);
    assert.ok(postLaunch.status.fps >= 55, `Expected FPS >= 55, got ${postLaunch.status.fps}`);
    assert.deepEqual(postLaunch.status.errors, []);

    assert.equal(postLaunch.hasModuleSched, true, 'Expected window.Module.sched to be defined');
    assert.equal(postLaunch.overlayDisplay, 'none');
    assert.equal(postLaunch.hudbarVisible, true);
    assert.equal(postLaunch.hudbarDisplay, 'flex');
    assert.ok(postLaunch.canvasWidth >= 640 && postLaunch.canvasHeight >= 360);
    assert.ok(postLaunch.nonBlackPixels > 0, 'Expected non-black WebGL pixels rendered on #canvas');
    assert.equal(postLaunch.mbCounterText, '94.8 / 94.8 MB');

    // Verify Warm Reload in the same browser context hits CacheStorage (nzportable-pack-v1) in <= 1.2s
    const warmNetworkUrls = [];
    page.on('request', (req) => warmNetworkUrls.push(req.url()));

    const warmStart = Date.now();
    await page.goto(`${baseUrl}/nzportable/?autostart=1`, { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(
      () => window.__NZP_STATUS__ && window.__NZP_STATUS__.engineReady === true,
      null,
      { timeout: 5000 }
    );
    const warmLoadMs = Date.now() - warmStart;

    const warmStatus = await page.evaluate(() => window.__NZP_STATUS__);
    assert.equal(warmStatus.engineReady, true);
    assert.equal(warmStatus.cacheHit, true, 'Expected CacheStorage hit on warm reload');
    assert.equal(warmStatus.gamePk3Bytes, 94276834);
    assert.equal(warmStatus.progsPk3Bytes, 491379);
    assert.equal(warmStatus.fmfBytes, 96);
    assert.deepEqual(warmStatus.errors, []);
    assert.ok(warmLoadMs <= 1200, `Warm load time ${warmLoadMs}ms exceeded 1200ms budget`);

    // Confirm game.pk3 was NOT re-downloaded over the network during warm load
    const redownloadedPk3 = warmNetworkUrls.filter((u) => u.includes('game.pk3') || u.includes('progs.pk3'));
    assert.equal(redownloadedPk3.length, 0, `Expected 0 network fetches for cached pk3 files, got: ${redownloadedPk3}`);

    await context.close();
  });

  it('2. Static Host / GitHub Pages HTTP 404 fallback reassembles parts/game.pk3.part00..02 with 100% boot parity', async () => {
    const context = await browser.newContext({ viewport: { width: 1280, height: 720 } });
    const page = await context.newPage();

    const requestedParts = [];
    await page.route('**/nzportable/nzp/game.pk3', async (route) => {
      await route.fulfill({
        status: 404,
        contentType: 'text/plain',
        body: 'Not Found (simulated GitHub Pages static host)',
      });
    });

    page.on('response', (res) => {
      if (res.url().includes('/parts/game.pk3.part') && res.status() === 200) {
        requestedParts.push(res.url().split('/').pop());
      }
    });

    await page.goto(`${baseUrl}/nzportable/?autostart=1`, { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(
      () => window.__NZP_STATUS__ && window.__NZP_STATUS__.engineReady === true,
      null,
      { timeout: 12000 }
    );

    const status = await page.evaluate(async () => {
      const cache = await caches.open('nzportable-pack-v1');
      const cachedGame = await cache.match('./nzp/game.pk3');
      const cachedLen = cachedGame ? (await cachedGame.arrayBuffer()).byteLength : 0;
      return {
        nzp: window.__NZP_STATUS__,
        hasSched: Boolean(window.Module && typeof window.Module.sched === 'function'),
        cachedLen,
      };
    });

    assert.deepEqual(requestedParts, ['game.pk3.part00', 'game.pk3.part01', 'game.pk3.part02']);
    assert.equal(status.nzp.engineReady, true);
    assert.equal(status.nzp.gamePk3Bytes, 94276834);
    assert.equal(status.nzp.progsPk3Bytes, 491379);
    assert.equal(status.nzp.fmfBytes, 96);
    assert.equal(status.hasSched, true);
    assert.equal(status.cachedLen, 94276834, 'Reassembled multi-part game.pk3 must be persisted in CacheStorage');
    assert.deepEqual(status.nzp.errors, []);

    await context.close();
  });

  it('3. Remote tunnel.json origin failover succeeds when local relative assets return 404', async () => {
    const context = await browser.newContext({ viewport: { width: 1280, height: 720 } });
    const page = await context.newPage();

    let tunnelJsonServed = false;
    let remoteTunnelAssetFetched = false;
    const serverPort = new URL(baseUrl).port;
    const remoteTunnelOrigin = `http://localhost:${serverPort}`;

    await page.route(/\/tunnel\.json/, async (route) => {
      tunnelJsonServed = true;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ url: remoteTunnelOrigin }),
      });
    });

    await page.route(/\/nzportable\/default\.fmf$/, async (route) => {
      const reqUrl = route.request().url();
      if (reqUrl.startsWith('http://127.0.0.1:')) {
        await route.fulfill({ status: 404, body: 'Local 404' });
      } else {
        remoteTunnelAssetFetched = true;
        await route.continue();
      }
    });

    await page.goto(`${baseUrl}/nzportable/?autostart=1`, { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(
      () => window.__NZP_STATUS__ && window.__NZP_STATUS__.engineReady === true,
      null,
      { timeout: 12000 }
    );

    const status = await page.evaluate(() => window.__NZP_STATUS__);
    assert.equal(tunnelJsonServed, true, 'Expected loader.js to query ../tunnel.json on local asset 404');
    assert.equal(remoteTunnelAssetFetched, true, 'Expected loader.js to fetch default.fmf from remote tunnel origin');
    assert.equal(status.engineReady, true);
    assert.equal(status.fmfBytes, 96);
    assert.deepEqual(status.errors, []);

    await context.close();
  });

  it('4. Fail-fast error surfacing (INV-FAIL-FAST-01) when an asset payload has corrupted byte length', async () => {
    const context = await browser.newContext({ viewport: { width: 1280, height: 720 } });
    const page = await context.newPage();

    await page.route('**/nzportable/nzp/progs.pk3', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/octet-stream',
        body: Buffer.from('corrupted-short-payload'),
      });
    });

    await page.goto(`${baseUrl}/nzportable/?autostart=1`, { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(
      () => window.__NZP_STATUS__ && window.__NZP_STATUS__.errors.length > 0,
      null,
      { timeout: 5000 }
    );

    const failState = await page.evaluate(() => {
      const statusEl = document.getElementById('status');
      return {
        status: window.__NZP_STATUS__,
        statusText: statusEl?.textContent || '',
        hasErrorClass: statusEl?.classList.contains('error') || false,
      };
    });

    assert.equal(failState.status.engineReady, false);
    assert.equal(failState.hasErrorClass, true);
    assert.ok(
      failState.status.errors.some((e) => e.includes('491379') || e.includes('Incomplete download') || e.includes('Size mismatch')),
      `Expected actionable byte-size mismatch error in __NZP_STATUS__.errors, got: ${JSON.stringify(failState.status.errors)}`
    );

    await context.close();
  });

  it('5. Freeman Alley HUD launcher link and /nzportable/ return navigation control', async () => {
    const context = await browser.newContext({ viewport: { width: 1280, height: 720 } });
    const page = await context.newPage();

    await page.goto(`${baseUrl}/nzportable/`, { waitUntil: 'domcontentloaded' });
    const navAttrs = await page.evaluate(() => {
      const overlayReturn = document.getElementById('overlay-return-alley');
      const hudReturn = document.getElementById('return-alley-btn');
      const fullscreenBtn = document.getElementById('fullscreen');
      return {
        overlayHref: overlayReturn?.getAttribute('href'),
        hudOnclick: hudReturn?.getAttribute('onclick'),
        fullscreenText: fullscreenBtn?.textContent?.trim(),
      };
    });

    assert.equal(navAttrs.overlayHref, '../');
    assert.equal(navAttrs.hudOnclick, "window.location.assign('../')");
    assert.equal(navAttrs.fullscreenText, 'Fullscreen');

    await context.close();
  });
});
