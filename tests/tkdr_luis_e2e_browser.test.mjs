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

test('Spec 058 & 059: .glb-Agnostic Auto-Rigger, 36-Fighter Selector & Live WebGL2 GlrVtx Replacement E2E', async () => {
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

    const tap = async (code, hold = 220, wait = 450) => {
      await page.keyboard.down(code);
      await page.waitForTimeout(hold);
      await page.keyboard.up(code);
      await page.waitForTimeout(wait);
    };

    const navUrl = TARGET_URL.includes('?') ? `${TARGET_URL}&TIME_SCALE=4` : `${TARGET_URL}?TIME_SCALE=4`;
    const resp = await page.goto(navUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
    assert.ok(resp, 'Navigation response must exist');
    assert.equal(resp.status(), 200, 'HTTP status must be 200');

    // 1. Wait for TKDR WebAssembly runtime + Custom Fighter Registry + 3 .glb bundles to load
    await page.waitForFunction(
      () => {
        const st = window.__TKDR_STATUS__;
        const cf = window.__TKDR_CUSTOM_FIGHTERS__;
        return (
          st &&
          st.started === true &&
          st.luisFighter &&
          st.luisFighter.ready === true &&
          cf &&
          typeof cf.getState === 'function' &&
          cf.getState().rosterCount === 36 &&
          cf.getState().bundles.length >= 3 &&
          typeof window.Module === 'object' &&
          typeof window.Module._web_time === 'function' &&
          window.Module._web_time() > 13
        );
      },
      undefined,
      { timeout: 60000, polling: 100 }
    );

    // Verify UI panel and 36-fighter selector DOM
    const uiCheck = await page.evaluate(() => {
      const panel = document.getElementById('tkdr-fighter-rig-panel');
      const bSel = document.getElementById('tkdr-p1-bundle');
      const fSel = document.getElementById('tkdr-p1-fighter');
      return {
        panelExists: Boolean(panel),
        bundleOptionCount: bSel ? bSel.options.length : 0,
        fighterOptionCount: fSel ? fSel.options.length : 0,
        cfState: window.__TKDR_CUSTOM_FIGHTERS__.getState(),
      };
    });

    assert.equal(uiCheck.panelExists, true, 'Fighter rig panel must exist in DOM');
    assert.ok(uiCheck.bundleOptionCount >= 4, `Expected >= 4 bundle options (NONE + 3 bundles), got ${uiCheck.bundleOptionCount}`);
    assert.equal(uiCheck.fighterOptionCount, 36, 'Fighter selector must list all 36 Tekken fighters');
    assert.equal(uiCheck.cfState.rosterCount, 36);
    assert.ok(uiCheck.cfState.bundles.includes('luis_jin'));
    assert.ok(uiCheck.cfState.bundles.includes('nicotest_pau'));
    assert.ok(uiCheck.cfState.bundles.includes('hoodie_law'));

    // 2. Deterministically navigate through profile creation -> Main Menu -> Arcade Battle -> 3D Match
    await tap('KeyX'); // dismiss autosave notice
    await page.waitForFunction(() => window.Module._web_time() > 24, undefined, { timeout: 60000, polling: 100 });
    await tap('Enter'); // skip intro FMV
    await page.waitForFunction(() => window.Module._web_time() > 29, undefined, { timeout: 60000, polling: 100 });
    await tap('KeyX'); // Create a profile -> Player Name
    await page.waitForFunction(() => window.Module._web_time() > 33, undefined, { timeout: 60000, polling: 100 });

    await tap('KeyX'); // Type 'A'
    await tap('Enter'); // Move cursor to END
    await tap('KeyX'); // Confirm END -> opens "Proceed with this name? YES / NO"
    await page.waitForTimeout(1000);
    await tap('ArrowLeft'); // Move cursor from NO to YES
    await tap('KeyX'); // Confirm YES
    await page.waitForTimeout(2500);

    // Dismiss profile created / save prompt -> Title Screen -> Main Menu
    for (let i = 0; i < 5; i++) {
      await tap('KeyX', 200, 700);
    }
    await tap('Enter', 220, 1500);

    // Enter Arcade Battle -> Character Select -> Select Jin Kazama -> Stage / Match
    for (let i = 0; i < 5; i++) {
      await tap('KeyX', 200, 900);
    }
    await page.waitForFunction(
      () => {
        const lf = window.__TKDR_STATUS__?.luisFighter;
        return lf && lf.matched3dFrames >= 5 && lf.stockDrawsSuppressed >= 10;
      },
      undefined,
      { timeout: 25000, polling: 100 }
    );

    // 3. Verify Bundle 1: luis_jin (LUIS.glb -> Jin Kazama [JIN])
    const luisTel = await page.evaluate(() => window.__TKDR_STATUS__.luisFighter);
    assert.equal(luisTel.enabled, true);
    assert.equal(luisTel.ready, true);
    assert.equal(luisTel.activeBundleId, 'luis_jin');
    assert.equal(luisTel.targetFighterCode, 'JIN');
    assert.equal(luisTel.luisTrianglesRendered, 3398);
    assert.ok(luisTel.stockDrawsSuppressed >= 10, `Expected stockDrawsSuppressed >= 10, got ${luisTel.stockDrawsSuppressed}`);
    assert.ok(luisTel.lastSkinningMs <= 1.5, `Expected lastSkinningMs <= 1.5ms, got ${luisTel.lastSkinningMs}`);

    // Capture live 3D match screenshot with LUIS.glb replacing P1
    const screenshotPath = '/Users/diesel/.gemini/antigravity-cli/brain/5f3fb6d3-e166-48dc-9f30-7d5e4c713387/scratch/tkdr_luis_3d_match.png';
    fs.mkdirSync(path.dirname(screenshotPath), { recursive: true });
    await page.screenshot({ path: screenshotPath });

    // 4. Hot-swap live in-browser to Bundle 2: nicotest_pau (nicotest.glb -> Paul Phoenix [PAU])
    await page.evaluate(() => {
      window.__TKDR_CUSTOM_FIGHTERS__.setBinding('P1', 'nicotest_pau', 'PAU');
    });
    await page.waitForFunction(
      () => {
        const lf = window.__TKDR_STATUS__?.luisFighter;
        return lf && lf.activeBundleId === 'nicotest_pau' && lf.luisTrianglesRendered === 2400 && lf.stockDrawsSuppressed >= 10;
      },
      undefined,
      { timeout: 10000, polling: 50 }
    );
    const nicoTel = await page.evaluate(() => window.__TKDR_STATUS__.luisFighter);
    assert.equal(nicoTel.activeBundleId, 'nicotest_pau');
    assert.equal(nicoTel.targetFighterCode, 'PAU');
    assert.equal(nicoTel.luisTrianglesRendered, 2400);
    assert.ok(nicoTel.lastSkinningMs <= 1.5, `Expected nicotest_pau lastSkinningMs <= 1.5ms, got ${nicoTel.lastSkinningMs}`);

    // 5. Hot-swap live in-browser to Bundle 3: hoodie_law (character_hoodie.glb -> Marshall Law [LAW])
    await page.evaluate(() => {
      window.__TKDR_CUSTOM_FIGHTERS__.setBinding('P1', 'hoodie_law', 'LAW');
    });
    await page.waitForFunction(
      () => {
        const lf = window.__TKDR_STATUS__?.luisFighter;
        return lf && lf.activeBundleId === 'hoodie_law' && lf.luisTrianglesRendered === 2656 && lf.stockDrawsSuppressed >= 10;
      },
      undefined,
      { timeout: 10000, polling: 50 }
    );
    const hoodieTel = await page.evaluate(() => window.__TKDR_STATUS__.luisFighter);
    assert.equal(hoodieTel.activeBundleId, 'hoodie_law');
    assert.equal(hoodieTel.targetFighterCode, 'LAW');
    assert.equal(hoodieTel.luisTrianglesRendered, 2656);
    assert.ok(hoodieTel.lastSkinningMs <= 1.5, `Expected hoodie_law lastSkinningMs <= 1.5ms, got ${hoodieTel.lastSkinningMs}`);

    // Restore luis_jin default and verify zero runtime/page errors
    await page.evaluate(() => {
      window.__TKDR_CUSTOM_FIGHTERS__.setBinding('P1', 'luis_jin', 'JIN');
    });
    assert.deepEqual(pageErrors, []);
  } finally {
    await browser.close();
  }
});
