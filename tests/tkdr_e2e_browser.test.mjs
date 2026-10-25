import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import test from 'node:test';

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

const { chromium } = loadPlaywright();
const TARGET_URL = process.env.TKDR_URL || 'http://127.0.0.1:3002/tkdr/';

test('Spec 057: Tekken Dark Resurrection (tkdr-recomp) standalone WebAssembly/WebGL2 browser E2E verification', async () => {
  const browser = await chromium.launch({
    headless: true,
    args: [
      '--enable-webgl',
      '--ignore-gpu-blocklist',
      '--use-gl=angle',
      '--autoplay-policy=no-user-gesture-required',
    ],
  });

  try {
    const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const page = await context.newPage();

    const pageErrors = [];
    page.on('pageerror', (err) => {
      pageErrors.push(String(err && err.message ? err.message : err));
    });

    const resp = await page.goto(TARGET_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
    assert.ok(resp, 'Navigation response must exist');
    assert.equal(resp.status(), 200, 'HTTP status must be 200');
    assert.equal(resp.headers()['cross-origin-opener-policy'], 'same-origin');
    assert.equal(resp.headers()['cross-origin-embedder-policy'], 'require-corp');

    await page.waitForFunction(
      () => {
        const st = window.__TKDR_STATUS__;
        return (
          st &&
          st.crossOriginIsolated === true &&
          st.runtimeReady === true &&
          st.isoReady === true &&
          st.ebootSha1 === 'b9a0e3292738a833f4f8077e3959c3a0652c42cd' &&
          st.recompiledFunctions === 13809 &&
          st.wasmCodeBytes === 23544922 &&
          st.started === true &&
          document.body.classList.contains('started') === true &&
          typeof window.Module === 'object' &&
          typeof window.Module._web_frames === 'function' &&
          window.Module._web_frames() > 60 &&
          typeof window.Module._web_time === 'function' &&
          window.Module._web_time() > 1.0
        );
      },
      { timeout: 45000, polling: 100 }
    );

    const telemetry = await page.evaluate(() => ({
      crossOriginIsolated: window.crossOriginIsolated,
      bodyStarted: document.body.classList.contains('started'),
      pickDisplay: document.getElementById('pick')?.style.display,
      status: window.__TKDR_STATUS__,
      webFrames: window.Module._web_frames(),
      webTime: window.Module._web_time(),
    }));

    assert.equal(telemetry.crossOriginIsolated, true);
    assert.equal(telemetry.bodyStarted, true);
    assert.equal(telemetry.pickDisplay, 'none');
    assert.equal(telemetry.status.ebootSha1, 'b9a0e3292738a833f4f8077e3959c3a0652c42cd');
    assert.equal(telemetry.status.recompiledFunctions, 13809);
    assert.equal(telemetry.status.wasmCodeBytes, 23544922);
    assert.equal(telemetry.status.started, true);
    assert.ok(telemetry.webFrames > 60, `Expected _web_frames() > 60, got ${telemetry.webFrames}`);
    assert.ok(telemetry.webTime > 1.0, `Expected _web_time() > 1.0, got ${telemetry.webTime}`);
    assert.deepEqual(telemetry.status.errors, []);
    assert.deepEqual(pageErrors, []);
  } finally {
    await browser.close();
  }
});
