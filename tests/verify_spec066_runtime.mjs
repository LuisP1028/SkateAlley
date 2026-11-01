/**
 * End-to-End Live Runtime & Mathematical Verification for functional_specification_066.md:
 * Universal Crash-Prevention & Compute-Reduction Architecture.
 */

import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
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
    throw new Error('Playwright package could not be resolved for E2E verification.');
  }
}

const { chromium } = loadPlaywright();

async function runVerification() {
  console.log('================================================================');
  console.log('SPEC 066 RUNTIME REALITY VERIFICATION SUITE');
  console.log('================================================================');

  const browser = await chromium.launch({
    headless: true,
    args: ['--use-gl=angle', '--use-angle=metal'],
  });

  const pageErrors = [];
  const consoleWarnings = [];

  try {
    const context = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      deviceScaleFactor: 2.0, // High DPR device (retina) to test 1.25 clamp
    });
    const page = await context.newPage();

    page.on('pageerror', (err) => {
      console.error('  [Browser PageError]', err.message);
      pageErrors.push(err.message);
    });

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        const text = msg.text();
        // Ignore benign favicon or external font missing errors if any
        if (!text.includes('favicon') && !text.includes('404')) {
          console.error('  [Console Error]', text);
          pageErrors.push(text);
        }
      }
    });

    console.log('\n[Phase 1] Booting http://localhost:8080/index.html with DPR = 2.0...');
    await page.goto('http://localhost:8080/index.html', { waitUntil: 'domcontentloaded', timeout: 30000 });

    // Wait until __sandbox and __THREE_RENDERER__ are populated
    await page.waitForFunction(() => window.__sandbox && window.__THREE_RENDERER__, { timeout: 30000 });
    console.log('  ✓ App boot complete. Global __sandbox and __THREE_RENDERER__ attached.');

    // 1. Verify Renderer Pixel Ratio Cap
    const pixelRatio = await page.evaluate(() => window.__THREE_RENDERER__.getPixelRatio());
    console.log(`  ✓ Renderer getPixelRatio() under DPR=2.0: ${pixelRatio}`);
    assert.ok(pixelRatio <= 1.25, `Expected pixelRatio <= 1.25, got ${pixelRatio}`);

    // Test resize clamp
    await page.setViewportSize({ width: 1024, height: 768 });
    const resizedPixelRatio = await page.evaluate(() => window.__THREE_RENDERER__.getPixelRatio());
    assert.ok(resizedPixelRatio <= 1.25, `Expected resized pixelRatio <= 1.25, got ${resizedPixelRatio}`);
    console.log(`  ✓ Resize event preserves pixelRatio <= 1.25 (${resizedPixelRatio})`);

    // 2. Test Spray-Paint Intro Lifecycle & Teardown
    console.log('\n[Phase 2] Verifying Spray-Paint Intro Lifecycle & WebGL2 Teardown...');
    const initialSprayGl = await page.evaluate(() => Boolean(window.sprayPaintLoader && window.sprayPaintLoader.gl));
    console.log(`  ✓ SprayPaintLoader initialized with WebGL2: ${initialSprayGl}`);
    assert.equal(initialSprayGl, true, 'SprayPaintLoader should have WebGL2 context during intro');

    // Skip intro and verify teardown
    await page.evaluate(() => window.__sandbox.skipSprayPaintIntro());
    await page.waitForTimeout(600); // Allow hold delay & teardown

    const postSkipState = await page.evaluate(() => {
      const loader = window.sprayPaintLoader;
      return {
        glIsNull: loader.gl === null,
        renderedProgress: loader.getState().renderedProgress,
        stage: loader.getState().stage,
      };
    });
    console.log('  ✓ Post-skip spray loader state:', postSkipState);
    assert.equal(postSkipState.glIsNull, true, 'Spray-paint WebGL2 context should be released after intro');
    assert.ok(postSkipState.renderedProgress >= 0.999, 'Rendered progress should be complete (1.0)');

    // Test transparent replay re-initialization
    console.log('  Testing on-demand replay re-initialization...');
    await page.evaluate(() => window.__sandbox.replaySprayPaintIntro('deterministic'));
    await page.waitForTimeout(200);

    const replayGlRestored = await page.evaluate(() => Boolean(window.sprayPaintLoader.gl));
    console.log(`  ✓ Replay restored WebGL2 context: ${replayGlRestored}`);
    assert.equal(replayGlRestored, true, 'Replay should transparently restore WebGL2 context');

    // Test telemetry sampling during restored context
    const sample = await page.evaluate(() => window.sprayPaintLoader.sampleLogoRegionTelemetry(0.4, 0.4, 0.6, 0.6));
    assert.ok(sample !== null && sample.totalPixels > 0, 'sampleLogoRegionTelemetry should return valid pixel sample');
    console.log(`  ✓ Sampled logo telemetry: ${sample.totalPixels} pixels sampled`);

    // Skip again to leave clean 1-context state
    await page.evaluate(() => window.__sandbox.skipSprayPaintIntro());
    await page.waitForTimeout(600);
    const glTornDownAgain = await page.evaluate(() => window.sprayPaintLoader.gl === null);
    assert.equal(glTornDownAgain, true, 'Spray loader context should be torn down after replay skip');
    console.log('  ✓ Spray loader WebGL2 context torn down again cleanly.');

    // 3. Test MP3 HUD Lazy 3D Lifecycle & Offscreen Substrate Crop
    console.log('\n[Phase 3] Verifying MP3 HUD Lazy 3D Lifecycle & Offscreen Substrate Crop...');
    await page.waitForFunction(() => window.mp3Player && window.mp3Player.state && window.mp3Player.state.initialized, { timeout: 15000 });

    const defaultMp3State = await page.evaluate(() => {
      const mp3 = window.mp3Player;
      return {
        visible: mp3.visible,
        mounted3D: mp3.mounted3D,
        displayMode: mp3.displayMode,
        glbLoaded: mp3.glbLoaded,
      };
    });
    console.log('  ✓ Default MP3 HUD state:', defaultMp3State);
    assert.equal(defaultMp3State.mounted3D, false, 'MP3 HUD should be in 2D SCREEN_ONLY mode at startup');
    assert.equal(defaultMp3State.displayMode, 'SCREEN_ONLY', 'Display mode should be SCREEN_ONLY');
    assert.equal(defaultMp3State.glbLoaded, false, 'audiodevice_decimated.glb should not be loaded at startup');

    // Expand to 3D FULL_TAKEOVER
    console.log('  Expanding MP3 HUD to FULL_TAKEOVER...');
    await page.evaluate(() => window.mp3Player.expand());
    await page.waitForFunction(() => window.mp3Player.glbLoaded && window.mp3Player.mounted3D, { timeout: 15000 });

    const expandedMp3State = await page.evaluate(() => {
      const mp3 = window.mp3Player;
      return {
        mounted3D: mp3.mounted3D,
        glbLoaded: mp3.glbLoaded,
        triangleCount: mp3.triangleCount,
        hasScene3D: Boolean(mp3.scene3d),
      };
    });
    console.log('  ✓ Expanded 3D MP3 HUD state:', expandedMp3State);
    assert.equal(expandedMp3State.mounted3D, true, 'MP3 HUD should mount 3D on expand');
    assert.equal(expandedMp3State.glbLoaded, true, 'audiodevice_decimated.glb should be loaded after expand');
    assert.ok(expandedMp3State.triangleCount > 4000, `Expected MP3 triangleCount > 4000, got ${expandedMp3State.triangleCount}`);

    // Collapse back to 2D SCREEN_ONLY
    console.log('  Collapsing MP3 HUD back to SCREEN_ONLY...');
    await page.evaluate(() => window.mp3Player.collapse());
    await page.waitForFunction(() => window.mp3Player.displayMode === 'SCREEN_ONLY' && !window.mp3Player.mounted3D, { timeout: 10000 });

    const collapsedMp3State = await page.evaluate(() => {
      const mp3 = window.mp3Player;
      return {
        mounted3D: mp3.mounted3D,
        displayMode: mp3.displayMode,
        morphProgress: mp3.morphProgress,
      };
    });
    console.log('  ✓ Collapsed MP3 HUD state:', collapsedMp3State);
    assert.equal(collapsedMp3State.mounted3D, false, 'MP3 HUD should unmount 3D on collapse');
    assert.equal(collapsedMp3State.displayMode, 'SCREEN_ONLY', 'Display mode should return to SCREEN_ONLY');

    // 4. Test Corridor Subsystems & Draw Call Batching
    console.log('\n[Phase 4] Verifying Corridor Subsystems & Static Pipework Batching...');
    const corridorStatus = await page.evaluate(() => {
      const sb = window.__sandbox;
      const wallMounts = sb.wallMounts ? sb.wallMounts.length : 0;
      const holoTel = sb.hologramColumns ? sb.hologramColumns.getTelemetry() : null;
      const pipesTel = sb.alleyPipes ? sb.alleyPipes.getTelemetry() : null;
      const rootGroup = sb.alleyPipes ? sb.alleyPipes.rootGroup : null;

      let batchedPipeMeshes = 0;
      if (rootGroup) {
        rootGroup.traverse((obj) => {
          if (obj.isMesh && obj.name && obj.name.startsWith('AlleyMetalPipesBatchMesh')) {
            batchedPipeMeshes++;
          }
        });
      }

      return {
        wallMounts,
        activeHologramColumns: holoTel ? holoTel.activeStateCounts.active : 0,
        pipeTotalCount: pipesTel ? pipesTel.totalCount : 0,
        pipeLeftCount: pipesTel ? pipesTel.leftWallCount : 0,
        pipeRightCount: pipesTel ? pipesTel.rightWallCount : 0,
        pipeCrossCount: pipesTel ? pipesTel.crossWallCount : 0,
        pipeTotalTriangles: pipesTel ? pipesTel.totalTriangles : 0,
        batchedPipeMeshes,
      };
    });

    console.log('  ✓ Corridor status:', corridorStatus);
    assert.equal(corridorStatus.wallMounts, 7, 'Expected 7 wall screen mounts');
    assert.ok(corridorStatus.activeHologramColumns >= 15, `Expected >= 15 active hologram columns, got ${corridorStatus.activeHologramColumns}`);
    assert.equal(corridorStatus.pipeTotalCount, 15, 'Expected 15 metal pipe assemblies');
    assert.equal(corridorStatus.pipeLeftCount, 5, 'Expected 5 Left-wall pipe assemblies');
    assert.equal(corridorStatus.pipeRightCount, 5, 'Expected 5 Right-wall pipe assemblies');
    assert.equal(corridorStatus.pipeCrossCount, 5, 'Expected 5 Cross-wall pipe assemblies');
    assert.equal(corridorStatus.pipeTotalTriangles, 13669, `Expected 13669 pipe triangles, got ${corridorStatus.pipeTotalTriangles}`);
    assert.ok(corridorStatus.batchedPipeMeshes <= 3, `Expected <= 3 batched pipe meshes, got ${corridorStatus.batchedPipeMeshes}`);

    assert.equal(pageErrors.length, 0, `Page errors encountered: ${pageErrors.join('; ')}`);
    console.log('\n================================================================');
    console.log('ALL RUNTIME VERIFICATION CHECKS PASSED WITH ZERO ERRORS!');
    console.log('================================================================');
  } finally {
    await browser.close();
  }
}

runVerification().catch((err) => {
  console.error('\n❌ VERIFICATION FAILURE:', err);
  process.exit(1);
});
