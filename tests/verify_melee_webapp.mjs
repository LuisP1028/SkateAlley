#!/usr/bin/env node
/**
 * End-to-end live verification for the standalone Super Smash Bros. Melee
 * WebAssembly/WebGPU web application (/melee/) served by scripts/serve_skatealley.py.
 */
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import net from 'node:net';
import path from 'node:path';
import { createRequire } from 'node:module';

const REPO_ROOT = path.resolve(import.meta.dirname, '..');
const require = createRequire('/Users/diesel/.npm/_npx/9833c18b2d85bc59/node_modules/playwright/package.json');
const { chromium } = require('.');

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

async function waitForHealth(baseUrl, timeoutMs = 15000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(`${baseUrl}/api/health`);
      if (res.ok) return await res.json();
    } catch (_) {}
    await new Promise((r) => setTimeout(r, 150));
  }
  throw new Error(`Timed out waiting for ${baseUrl}/api/health`);
}

const port = await getFreePort();
const baseUrl = `http://127.0.0.1:${port}`;
const serverProc = spawn(
  '/opt/homebrew/bin/python3',
  [path.join(REPO_ROOT, 'scripts/serve_skatealley.py'), '--host', '127.0.0.1', '--port', String(port), '--dir', REPO_ROOT],
  { stdio: ['ignore', 'pipe', 'pipe'] }
);

let browser = null;
try {
  // 1. Verify /api/health contract
  const health = await waitForHealth(baseUrl);
  assert.equal(health.ok, true);
  assert.equal(health.melee_webapp, true, 'Expected melee_webapp: true in /api/health');
  assert.ok(health.components.includes('melee_webapp'), 'Expected melee_webapp in health.components');

  // 2. Verify COOP/COEP/CORP headers on /melee/ and /melee/melee_browser.wasm
  for (const route of ['/melee/', '/melee/melee_browser.wasm']) {
    const res = await fetch(`${baseUrl}${route}`, { method: 'HEAD' });
    assert.equal(res.status, 200, `Expected 200 on HEAD ${route}`);
    assert.equal(res.headers.get('cross-origin-opener-policy'), 'same-origin');
    assert.equal(res.headers.get('cross-origin-embedder-policy'), 'require-corp');
    assert.equal(res.headers.get('cross-origin-resource-policy'), 'same-origin');
  }

  // 3. Verify HTTP 206 Partial Content byte-range streaming on /melee/game.iso
  const headIso = await fetch(`${baseUrl}/melee/game.iso`, { method: 'HEAD' });
  assert.equal(headIso.status, 200);
  assert.equal(Number(headIso.headers.get('content-length')), 1459978240);
  assert.equal(headIso.headers.get('accept-ranges'), 'bytes');

  const rangeIso = await fetch(`${baseUrl}/melee/game.iso`, {
    headers: { Range: 'bytes=0-63' },
  });
  assert.equal(rangeIso.status, 206);
  assert.equal(rangeIso.headers.get('content-range'), 'bytes 0-63/1459978240');
  const hdrBytes = new Uint8Array(await rangeIso.arrayBuffer());
  assert.equal(hdrBytes.length, 64);
  assert.equal(String.fromCharCode(...hdrBytes.slice(0, 6)), 'GALE01');
  assert.equal(hdrBytes[7], 2, 'Expected normalized GALE01 revision byte 0x02 at offset 7');
  assert.deepEqual([...hdrBytes.slice(0x1c, 0x20)], [0xc2, 0x33, 0x9f, 0x3d]);

  // 4. Verify live browser auto-boot & 60 FPS WebGPU execution across title and vs-cpu4
  browser = await chromium.launch({
    headless: true,
    args: ['--enable-unsafe-webgpu', '--use-angle=metal'],
  });

  const report = {
    health: { ok: health.ok, melee_webapp: health.melee_webapp },
    scenes: {},
  };

  for (const testCase of [
    { name: 'title', query: '?MELEE_SEED=1&MELEE_SCENE_LOG=1', targetFrames: 180 },
    { name: 'vs-cpu4', query: '?MELEE_BOOT_SCENE=vs&MELEE_DEBUG_VS=cpu4&MELEE_SEED=1&MELEE_SCENE_LOG=1', targetFrames: 360 },
  ]) {
    const context = await browser.newContext({ viewport: { width: 960, height: 720 } });
    const page = await context.newPage();
    const pageErrors = [];
    page.on('pageerror', (err) => pageErrors.push(String(err.stack || err)));

    const t0 = Date.now();
    await page.goto(`${baseUrl}/melee/${testCase.query}`);
    await page.waitForFunction(
      (minFrames) => window.__MELEE_STATUS__ && window.__MELEE_STATUS__.frames >= minFrames,
      testCase.targetFrames,
      { timeout: 45000 }
    );
    const elapsedMs = Date.now() - t0;
    const status = await page.evaluate(() => window.__MELEE_STATUS__);

    assert.equal(pageErrors.length, 0, `Unexpected page errors in ${testCase.name}: ${pageErrors.join('\n')}`);
    assert.equal(status.crossOriginIsolated, true);
    assert.equal(status.webgpuAvailable, true);
    assert.equal(status.runtimeReady, true);
    assert.equal(status.discSource, 'http-range');
    assert.equal(status.discSize, 1459978240);
    assert.equal(status.started, true);
    assert.equal(status.lastError, null);
    assert.ok(status.fps >= 55.0, `Expected FPS >= 55.0 in ${testCase.name}, got ${status.fps}`);
    assert.ok(status.p99Ms <= 33.4, `Expected p99Ms <= 33.4 in ${testCase.name}, got ${status.p99Ms}`);
    if (testCase.name === 'vs-cpu4') {
      assert.ok(
        status.scenes.some((s) => s.startsWith('boot scene: game mode 14')),
        `Expected VS game mode 14 in ${testCase.name}, got ${JSON.stringify(status.scenes)}`
      );
    }

    report.scenes[testCase.name] = {
      elapsedMs,
      frames: status.frames,
      fps: status.fps,
      p99Ms: status.p99Ms,
      residentCacheBytes: status.residentCacheBytes,
      scenes: status.scenes,
    };
    await context.close();
  }

  console.log(JSON.stringify(report, null, 2));
} finally {
  if (browser) await browser.close();
  serverProc.kill('SIGTERM');
}
