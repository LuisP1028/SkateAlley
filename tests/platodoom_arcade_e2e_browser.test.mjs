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

describe('Spec 046 Live Playwright Browser E2E Verification: Unified PLATODOOM arcade Spray Intro & Credits', () => {
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

  it('1. 5-Pass progressive WebGL2 stencil reveal on platodoomarcade.jpeg (D -> O1 -> O2 -> M -> ARCADE) with zero cross-region bleed and zero white paper fringe', async () => {
    const context = await browser.newContext({ viewport: { width: 1280, height: 720 } });
    const page = await context.newPage();

    await page.goto(`${baseUrl}/nzportable/?autostart=0`, { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(
      () => window.__nzpSprayLoader && window.__nzpSprayLoader.getState().isReady === true,
      null,
      { timeout: 10000 }
    );

    const telemetry = await page.evaluate(() => {
      const loader = window.__nzpSprayLoader;
      loader.pause();

      // Scrub to end of Pass 0 (D: 0.20)
      loader.scrubTo(0.20);
      const at020 = {
        d: loader.sampleLogoRegionTelemetry(0.24, 0.15, 0.37, 0.62),
        o1: loader.sampleLogoRegionTelemetry(0.41, 0.15, 0.49, 0.60),
        arcade: loader.sampleLogoRegionTelemetry(0.38, 0.72, 0.66, 0.94),
      };

      // Scrub to end of Pass 3 (M: 0.78, just before ARCADE starts)
      loader.scrubTo(0.775);
      const at0775 = {
        d: loader.sampleLogoRegionTelemetry(0.24, 0.15, 0.37, 0.62),
        o1: loader.sampleLogoRegionTelemetry(0.41, 0.15, 0.49, 0.60),
        o2: loader.sampleLogoRegionTelemetry(0.52, 0.15, 0.59, 0.58),
        m: loader.sampleLogoRegionTelemetry(0.63, 0.15, 0.80, 0.60),
        arcade: loader.sampleLogoRegionTelemetry(0.38, 0.72, 0.66, 0.94),
      };

      // Scrub to full completion (ARCADE: 1.00)
      loader.scrubTo(1.0);
      const at100 = {
        state: loader.getState(),
        d: loader.sampleLogoRegionTelemetry(0.24, 0.15, 0.37, 0.62),
        o1: loader.sampleLogoRegionTelemetry(0.41, 0.15, 0.49, 0.60),
        o2: loader.sampleLogoRegionTelemetry(0.52, 0.15, 0.59, 0.58),
        m: loader.sampleLogoRegionTelemetry(0.63, 0.15, 0.80, 0.60),
        arcade: loader.sampleLogoRegionTelemetry(0.38, 0.72, 0.66, 0.94),
      };

      return { at020, at0775, at100 };
    });

    // At progress=0.20, D is painted, while O1 and ARCADE are still unrevealed (0 maroon pixels)
    assert.ok(telemetry.at020.d.maroonRatio > 0.20, `Expected D maroonRatio > 0.20 at p=0.20, got ${telemetry.at020.d.maroonRatio}`);
    assert.equal(telemetry.at020.o1.maroonPixels, 0, 'Expected 0 maroon pixels in O1 at p=0.20');
    assert.equal(telemetry.at020.arcade.maroonPixels, 0, 'Expected 0 maroon pixels in ARCADE at p=0.20');

    // At progress=0.775, D, O1, O2, M are painted, while ARCADE is still unrevealed
    assert.ok(telemetry.at0775.d.maroonRatio > 0.20);
    assert.ok(telemetry.at0775.o1.maroonRatio > 0.20);
    assert.ok(telemetry.at0775.o2.maroonRatio > 0.20);
    assert.ok(telemetry.at0775.m.maroonRatio > 0.20);
    assert.equal(telemetry.at0775.arcade.maroonPixels, 0, 'Expected 0 maroon pixels in ARCADE at p=0.775 before Pass 4');

    // At progress=1.00, all 5 regions including ARCADE are painted with 0 white paper fringe
    assert.equal(telemetry.at100.state.profile, 'platodoomarcade');
    assert.deepEqual(telemetry.at100.state.completedLetters, ['D', 'O1', 'O2', 'M', 'ARCADE']);
    assert.ok(telemetry.at100.arcade.maroonRatio > 0.12, `Expected ARCADE maroonRatio > 0.12 at p=1.00, got ${telemetry.at100.arcade.maroonRatio}`);
    assert.equal(telemetry.at100.d.whiteFringePixels, 0);
    assert.equal(telemetry.at100.arcade.whiteFringePixels, 0);

    await context.close();
  });

  it('2. Skate (/skate3_cleanroom/), Zombies (/nzportable/), and GTA (/revcdos/) remove legacy screens and position exact Decompilation Credit subtitles underneath "arcade"', async () => {
    const context = await browser.newContext({ viewport: { width: 1280, height: 720 } });
    const page = await context.newPage();

    const targets = [
      {
        url: `${baseUrl}/skate3_cleanroom/`,
        expectedCredit: 'Decompilation Credit: AndrewNakas',
        loaderGlobal: '__skateSprayLoader',
      },
      {
        url: `${baseUrl}/nzportable/?autostart=0`,
        expectedCredit: 'Decompilation Credit: NZPTeam',
        loaderGlobal: '__nzpSprayLoader',
      },
      {
        url: `${baseUrl}/revcdos/?autostart=0`,
        expectedCredit: 'Decompilation Credit: DOS.Zone Team',
        loaderGlobal: '__revcdosSprayLoader',
      },
    ];

    for (const target of targets) {
      await page.goto(target.url, { waitUntil: 'domcontentloaded' });
      await page.waitForFunction(
        (g) => Boolean(window[g] && window[g].getState().isReady === true),
        target.loaderGlobal,
        { timeout: 10000 }
      );

      const check = await page.evaluate((g) => {
        const loader = window[g];
        const state = loader.getState();
        const creditEl = document.getElementById('spray-paint-credit-subtitle');
        const creditRect = creditEl.getBoundingClientRect();
        const [normX, normY, normW, normH] = state.logoRect;
        const arcadeBottomY = (normY + 0.9611 * normH) * window.innerHeight;
        const arcadeCenterX = (normX + 0.5203 * normW) * window.innerWidth;
        const creditCenterX = creditRect.left + creditRect.width * 0.5;

        return {
          hasLegacySplash: Boolean(document.getElementById('splash')),
          hasLegacyStartContainer: Boolean(document.querySelector('.start-container')),
          hasLegacyIntroContainer: Boolean(document.querySelector('.intro-container')),
          hasLegacyClickToPlay: Boolean(document.getElementById('click-to-play-button')),
          profile: state.profile,
          creditText: creditEl?.textContent?.trim(),
          creditVisible: window.getComputedStyle(creditEl).display !== 'none' && Number(window.getComputedStyle(creditEl).opacity) > 0.5,
          creditTop: creditRect.top,
          arcadeBottomY,
          centerDeltaX: Math.abs(creditCenterX - arcadeCenterX),
        };
      }, target.loaderGlobal);

      assert.equal(check.hasLegacySplash, false, `Legacy #splash must be removed on ${target.url}`);
      assert.equal(check.hasLegacyStartContainer, false, `Legacy .start-container must be removed on ${target.url}`);
      assert.equal(check.hasLegacyIntroContainer, false, `Legacy .intro-container must be removed on ${target.url}`);
      assert.equal(check.hasLegacyClickToPlay, false, `Legacy #click-to-play-button must be removed on ${target.url}`);
      assert.equal(check.profile, 'platodoomarcade');
      assert.equal(check.creditText, target.expectedCredit);
      assert.equal(check.creditVisible, true);
      assert.ok(
        check.creditTop >= check.arcadeBottomY - 4,
        `Expected credit subtitle top (${check.creditTop}px) to sit underneath "arcade" bottom (${check.arcadeBottomY}px) on ${target.url}`
      );
      assert.ok(
        check.centerDeltaX <= 12,
        `Expected credit subtitle center X to align with "arcade" wordmark center within 12px, got delta=${check.centerDeltaX}px on ${target.url}`
      );
    }

    await context.close();
  });

  it('3. 3D Freeman Alley hub (/) preserves its existing "PLATO DOOM" (tags/1DOOMTAG.jpeg) spray-paint intro as-is', async () => {
    const context = await browser.newContext({ viewport: { width: 1280, height: 720 } });
    const page = await context.newPage();

    await page.goto(`${baseUrl}/`, { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(
      () => Boolean(window.sprayPaintLoader && window.sprayPaintLoader.getState().isReady === true),
      null,
      { timeout: 10000 }
    );

    const alleyCheck = await page.evaluate(() => {
      const loader = window.sprayPaintLoader;
      const state = loader.getState();
      return {
        logoSource: loader.logoSource,
        profile: state.profile,
        creditText: state.creditText,
        hasCreditSubtitle: Boolean(document.getElementById('spray-paint-credit-subtitle')),
      };
    });

    assert.equal(alleyCheck.logoSource, 'tags/1DOOMTAG.jpeg');
    assert.equal(alleyCheck.profile, '1doomtag');
    assert.equal(alleyCheck.creditText, '');
    assert.equal(alleyCheck.hasCreditSubtitle, false);

    await context.close();
  });
});
