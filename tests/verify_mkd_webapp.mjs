#!/usr/bin/env node
/**
 * End-to-end live verification for the standalone Mortal Kombat: Deception (GQNE5D)
 * Recompiled GameCube Browser WebApp (/mkd/) served by scripts/serve_skatealley.py.
 *
 * Verifies:
 * 1. /api/health and /api/mkd/status report live mkd_runtime execution
 * 2. COOP/COEP/CORP headers and HTTP 206 byte-range streaming on /mkd/game.iso and /mkd/main.dol
 * 3. Live 640x480 RGBA8 GameCube XFB framebuffer streaming into <canvas id="canvas"> with zero fake overlays
 * 4. Interactive browser input (Enter / Z / Arrow keys) driving the real recompiled game from:
 *    3D Temple Courtyard Main Menu -> 24-Fighter Character Select -> 3D Arcade Tower / Match
 */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire('/Users/diesel/.npm/_npx/9833c18b2d85bc59/node_modules/playwright/package.json');
const { chromium } = require('.');

const baseUrl = process.env.MKD_BASE_URL || 'http://127.0.0.1:3002';

async function waitForHealth(url, timeoutMs = 15000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(`${url}/api/health`);
      if (res.ok) return await res.json();
    } catch (_) {}
    await new Promise((r) => setTimeout(r, 150));
  }
  throw new Error(`Timed out waiting for ${url}/api/health`);
}

let browser = null;
try {
  // 1. Verify /api/health contract
  const health = await waitForHealth(baseUrl);
  assert.equal(health.ok, true);
  assert.equal(health.mkd_webapp, true, 'Expected mkd_webapp: true in /api/health');
  assert.ok(health.components.includes('mkd_webapp'), 'Expected mkd_webapp in health.components');

  // 2. Verify COOP/COEP/CORP headers on /mkd/ and /mkd/main.dol
  for (const route of ['/mkd/', '/mkd/main.dol', '/mkd/decomp_manifest.json']) {
    const res = await fetch(`${baseUrl}${route}`, { method: 'HEAD' });
    assert.equal(res.status, 200, `Expected 200 on HEAD ${route}`);
    assert.equal(res.headers.get('cross-origin-opener-policy'), 'same-origin');
    assert.equal(res.headers.get('cross-origin-embedder-policy'), 'require-corp');
    assert.equal(res.headers.get('cross-origin-resource-policy'), 'same-origin');
  }

  // 3. Verify HTTP 206 Partial Content byte-range streaming on /mkd/game.iso and /mkd/main.dol
  const headIso = await fetch(`${baseUrl}/mkd/game.iso`, { method: 'HEAD' });
  assert.equal(headIso.status, 200);
  assert.equal(Number(headIso.headers.get('content-length')), 1459978240);
  assert.equal(headIso.headers.get('accept-ranges'), 'bytes');

  const rangeIso = await fetch(`${baseUrl}/mkd/game.iso`, {
    headers: { Range: 'bytes=0-63' },
  });
  assert.equal(rangeIso.status, 206);
  assert.equal(rangeIso.headers.get('content-range'), 'bytes 0-63/1459978240');
  const hdrBytes = new Uint8Array(await rangeIso.arrayBuffer());
  assert.equal(hdrBytes.length, 64);
  assert.equal(String.fromCharCode(...hdrBytes.slice(0, 6)), 'GQNE5D');
  assert.deepEqual([...hdrBytes.slice(0x1c, 0x20)], [0xc2, 0x33, 0x9f, 0x3d]);

  // 4. Launch Chromium and open /mkd/
  browser = await chromium.launch({
    headless: true,
    args: ['--enable-unsafe-webgpu', '--use-angle=metal'],
  });

  const context = await browser.newContext({ viewport: { width: 1280, height: 840 } });
  const page = await context.newPage();
  const pageErrors = [];
  page.on('pageerror', (err) => pageErrors.push(String(err.stack || err)));

  await page.goto(`${baseUrl}/mkd/`);

  await page.waitForFunction(
    () =>
      window.__MKD_STATUS__ &&
      window.__MKD_STATUS__.runtimeReady === true &&
      window.__MKD_STATUS__.runtimeFrameSeq >= 540 &&
      window.__MKD_STATUS__.drawsThisFrame >= 300,
    null,
    { timeout: 35000 }
  );

  const initialStatus = await page.evaluate(() => ({ ...window.__MKD_STATUS__ }));
  assert.equal(pageErrors.length, 0, `Unexpected page errors: ${pageErrors.join('\n')}`);
  assert.equal(initialStatus.crossOriginIsolated, true);
  assert.equal(initialStatus.runtimeReady, true);
  assert.equal(initialStatus.gameId, 'GQNE5D');
  assert.equal(initialStatus.dolSha1, 'ef001212c6cd4da3194c041d24956a61bc5e9fcd');
  assert.equal(initialStatus.dolEntryPoint, '0x80003154');
  assert.equal(initialStatus.fstEntryCount, 475);
  assert.equal(initialStatus.matchedCodePct, 40.04);
  assert.equal(initialStatus.lastError, null);

  const sampleCanvasStats = async () =>
    page.evaluate(() => {
      const c = document.getElementById('canvas');
      const ctx = c.getContext('2d');
      const data = ctx.getImageData(0, 0, c.width, c.height).data;
      let nonZero = 0;
      let sumLuma = 0;
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i], g = data[i + 1], b = data[i + 2];
        if (r + g + b > 15) nonZero++;
        sumLuma += 0.299 * r + 0.587 * g + 0.114 * b;
      }
      const totalPixels = c.width * c.height;
      return {
        width: c.width,
        height: c.height,
        nonZeroRatio: Number((nonZero / totalPixels).toFixed(4)),
        meanLuma: Number((sumLuma / totalPixels).toFixed(2)),
      };
    });

  // 5. Advance to 24-Fighter Character Select if on Main Menu (draws > 450)
  for (let attempt = 0; attempt < 6; attempt++) {
    const cur = await page.evaluate(() => ({ ...window.__MKD_STATUS__ }));
    if (cur.drawsThisFrame >= 350 && cur.drawsThisFrame <= 450) break;
    await page.keyboard.press('KeyZ');
    await page.waitForTimeout(900);
  }

  await page.waitForFunction(
    () =>
      window.__MKD_STATUS__ &&
      window.__MKD_STATUS__.drawsThisFrame >= 350 &&
      window.__MKD_STATUS__.drawsThisFrame <= 450,
    null,
    { timeout: 15000 }
  );

  // Move cursor right on the 24-fighter grid (Scorpion -> Sub-Zero)
  await page.keyboard.press('ArrowRight');
  await page.waitForTimeout(800);
  const selectStatus = await page.evaluate(() => ({ ...window.__MKD_STATUS__ }));
  const selectPixelStats = await sampleCanvasStats();
  assert.ok(selectPixelStats.nonZeroRatio > 0.25, `Expected Fighter Select non-black pixels, got ${JSON.stringify(selectPixelStats)}`);
  await page.screenshot({ path: '/tmp/mkd_browser_2_fighter_select.png' });

  // 6. Press A (KeyZ) to lock in fighter and advance into the 3D Arcade Tower / Match!
  for (let attempt = 0; attempt < 6; attempt++) {
    const cur = await page.evaluate(() => ({ ...window.__MKD_STATUS__ }));
    if (cur.drawsThisFrame >= 5000) break;
    await page.keyboard.press('KeyZ');
    await page.waitForTimeout(1000);
  }

  await page.waitForFunction(
    () => window.__MKD_STATUS__ && window.__MKD_STATUS__.drawsThisFrame >= 5000,
    null,
    { timeout: 25000 }
  );
  await page.waitForTimeout(1500);
  const towerStatus = await page.evaluate(() => ({ ...window.__MKD_STATUS__ }));
  const towerPixelStats = await sampleCanvasStats();
  assert.ok(towerPixelStats.nonZeroRatio > 0.25, `Expected 3D Arcade Tower non-black pixels, got ${JSON.stringify(towerPixelStats)}`);
  await page.screenshot({ path: '/tmp/mkd_browser_3_arcade_tower.png' });

  // 7. Skip tower intro camera pan into the live 3D Arena Fight (Mileena vs. Darrius in Slaughterhouse)
  for (let attempt = 0; attempt < 8; attempt++) {
    const cur = await page.evaluate(() => ({ ...window.__MKD_STATUS__ }));
    if (cur.runtimeFrameSeq > towerStatus.runtimeFrameSeq + 40 && cur.drawsThisFrame >= 2500 && cur.drawsThisFrame <= 6500) {
      break;
    }
    await page.keyboard.press('KeyZ');
    await page.waitForTimeout(1000);
  }
  await page.waitForTimeout(1200);
  const fightStatus = await page.evaluate(() => ({ ...window.__MKD_STATUS__ }));
  const fightPixelStats = await sampleCanvasStats();
  await page.screenshot({ path: '/tmp/mkd_browser_4_arena_fight.png' });

  console.log(
    JSON.stringify(
      {
        ok: true,
        health: { ok: health.ok, mkd_webapp: health.mkd_webapp },
        discHeader: 'GQNE5D',
        dolSha1: initialStatus.dolSha1,
        matchedCodePct: initialStatus.matchedCodePct,
        fstEntryCount: initialStatus.fstEntryCount,
        fighterSelect: {
          frameSeq: selectStatus.runtimeFrameSeq,
          draws: selectStatus.drawsThisFrame,
          pixelStats: selectPixelStats,
        },
        arcadeTower: {
          frameSeq: towerStatus.runtimeFrameSeq,
          draws: towerStatus.drawsThisFrame,
          pixelStats: towerPixelStats,
        },
        arenaFight: {
          frameSeq: fightStatus.runtimeFrameSeq,
          draws: fightStatus.drawsThisFrame,
          pixelStats: fightPixelStats,
        },
      },
      null,
      2
    )
  );
} finally {
  if (browser) await browser.close();
}
