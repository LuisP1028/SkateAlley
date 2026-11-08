/**
 * End-to-End Live WebGL & DOM Verification Suite for Functional Specification 070:
 * 1. Scene-Wide Boot-Up 3D Materialization & Glowing Bloom-Edge Dissolve System
 * 2. Screen-Agnostic Portfolio Perimeter HUD & Zero-Jitter Glyph Cipher Decode (Replacing Mobile Action Column)
 * 3. Revamped Dual Virtual Analog Sticks (Precision Telemetry Reticles, Vector Tether Line & Tabular Readouts)
 * 4. Aspect-Ratio Adaptive Dynamic Camera Follow-Offset Scaling (Boom Distance, LookAt Y-Offset, OTS X-Centering)
 */

import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
  console.log('========================================================================');
  console.log('SPEC 070: 3D MATERIALIZATION, PERIMETER HUD, ANALOG STICKS & DYNAMIC CAM');
  console.log('========================================================================');

  const browser = await chromium.launch({
    headless: true,
    args: ['--use-gl=angle', '--use-angle=metal'],
  });

  const pageErrors = [];
  const consoleErrors = [];

  try {
    const context = await browser.newContext({
      viewport: { width: 1920, height: 1080 },
      deviceScaleFactor: 1.5,
    });
    const page = await context.newPage();

    page.on('pageerror', (err) => {
      console.error('  [Browser PageError]', err.message);
      pageErrors.push(err.message);
    });
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        const text = msg.text();
        if (!text.includes('favicon')) {
          consoleErrors.push(text);
        }
      }
    });

    console.log('\n[Phase 1] Booting live browser against http://127.0.0.1:8080/index.html...');
    await page.goto('http://127.0.0.1:8080/index.html', {
      waitUntil: 'domcontentloaded',
      timeout: 30000,
    });
    await page.waitForFunction(
      () => window.__sandbox && window.__sandbox.ready && window.__sandbox.sceneMaterialization,
      { timeout: 30000 }
    );

    // -------------------------------------------------------------------------
    // Pillar 1: Scene-Wide Boot-Up 3D Materialization & Glowing Bloom-Edge Dissolve
    // -------------------------------------------------------------------------
    console.log('\n[Phase 2] Verifying Pillar 1 — Scene-Wide Boot-Up 3D Materialization & Glowing Bloom-Edge Dissolve...');
    const matReport = await page.evaluate(() => {
      const sb = window.__sandbox;
      if (sb.skipSprayPaintIntro) sb.skipSprayPaintIntro();

      // Trigger fresh boot materialization wave from p = 0.0
      const startState = sb.sceneMaterialization.playBootMaterialization({
        durationSec: 2.8,
        fromProgress: 0.0,
      });

      // Scrub to p = 0.45 (mid-dissolve frontier) and render
      sb.sceneMaterialization.setProgress(0.45);
      sb.step(1 / 60);
      const midState = sb.sceneMaterialization.getState();

      // Step through remaining duration to verify automatic resolution & quiescence
      sb.sceneMaterialization.playBootMaterialization({ durationSec: 1.0, fromProgress: 0.45 });
      for (let i = 0; i < 70; i++) {
        sb.step(1 / 60);
      }
      const resolvedState = sb.sceneMaterialization.getState();

      // Benchmark 60 steady-state frames post-resolution
      const t0 = performance.now();
      for (let i = 0; i < 60; i++) {
        sb.step(1 / 60);
      }
      const avgSteadyFrameMs = (performance.now() - t0) / 60;

      return {
        startState,
        midState,
        resolvedState,
        avgSteadyFrameMs,
      };
    });

    assert.ok(
      matReport.startState.registeredMaterialCount >= 25,
      `Expected >= 25 registered alley materials in sceneMaterialization, got ${matReport.startState.registeredMaterialCount}`
    );
    assert.ok(
      matReport.startState.registeredMeshCount >= 50,
      `Expected >= 50 registered alley meshes in sceneMaterialization, got ${matReport.startState.registeredMeshCount}`
    );
    assert.equal(matReport.midState.phase, 'materializing', 'Mid-wave phase must be materializing');
    assert.equal(matReport.midState.dissolveActiveUniform, 1.0, 'uDissolveActive must be 1.0 during materialization');
    assert.equal(matReport.midState.edgeColorHex.toLowerCase(), '#eb5a13', 'Glowing edge color must match #eb5a13');
    assert.equal(matReport.resolvedState.phase, 'resolved', 'Post-boot phase must transition to resolved');
    assert.equal(matReport.resolvedState.progress, 1.0, 'Post-boot progress must equal 1.0');
    assert.equal(
      matReport.resolvedState.dissolveActiveUniform,
      0.0,
      'uDissolveActive uniform must be 0.0 at p=1.0 for 0.0ms steady-state shader overhead'
    );
    assert.ok(
      matReport.avgSteadyFrameMs <= 16.6,
      `Expected steady-state frame time <= 16.6ms, got ${matReport.avgSteadyFrameMs.toFixed(2)}ms`
    );

    console.log(
      `  ✓ Registered ${matReport.startState.registeredMeshCount} meshes (${matReport.startState.registeredMaterialCount} materials) across Freeman Alley.`
    );
    console.log(
      `  ✓ Mid-wave (p=0.45) active with #eb5a13 HDR edge; post-boot (p=1.0) quiescent (uDissolveActive=0.0, avg frame=${matReport.avgSteadyFrameMs.toFixed(2)}ms).`
    );

    // -------------------------------------------------------------------------
    // Pillar 2: Screen-Agnostic Portfolio HUD & Zero-Jitter Glyph Cipher Decode
    // -------------------------------------------------------------------------
    console.log('\n[Phase 3] Verifying Pillar 2 — Screen-Agnostic Portfolio HUD & Zero-Jitter Cipher Decode...');
    const hudDecodeReport = await page.evaluate(() => {
      const sb = window.__sandbox;
      const hud = sb.portfolioHUD;

      const targetIds = [
        'portfolio-hud-brand',
        'portfolio-hud-stamp',
        'portfolio-hud-mode-pill',
        'mobile-action-interact-btn',
        'mobile-action-mode-btn',
        'portfolio-hud-chat-btn',
        'mobile-action-jump-btn',
        'portfolio-hud-tel-metrics',
      ];

      // Resolve all first to measure baseline resolved dimensions
      hud.resolveAllImmediate();
      const baselineRects = {};
      for (const id of targetIds) {
        const el = document.getElementById(id);
        const r = el.getBoundingClientRect();
        baselineRects[id] = { width: r.width, height: r.height, text: el.textContent };
      }

      // Trigger full 3-beat boot choreography
      hud.playBootChoreography();

      // Sample at t = 0ms (Dormant)
      const dormantRects = {};
      for (const id of targetIds) {
        const el = document.getElementById(id);
        const r = el.getBoundingClientRect();
        dormantRects[id] = {
          width: r.width,
          height: r.height,
          state: el.getAttribute('data-cipher-state'),
          ariaLabel: el.getAttribute('aria-label'),
        };
      }

      // Step 15 frames (~250ms -> Active Scramble across Beats 1-3)
      let observedHotChars = 0;
      for (let f = 0; f < 15; f++) {
        hud.update(1 / 60);
        observedHotChars += document.querySelectorAll('.hud-cipher-char.is-hot').length;
      }

      const scrambleRects = {};
      for (const id of targetIds) {
        const el = document.getElementById(id);
        const r = el.getBoundingClientRect();
        scrambleRects[id] = {
          width: r.width,
          height: r.height,
          state: el.getAttribute('data-cipher-state'),
        };
      }

      // Step 90 frames (~1,500ms -> All Resolved & Cleaned)
      for (let f = 0; f < 90; f++) {
        hud.update(1 / 60);
      }

      const resolvedRects = {};
      for (const id of targetIds) {
        const el = document.getElementById(id);
        const r = el.getBoundingClientRect();
        resolvedRects[id] = {
          width: r.width,
          height: r.height,
          state: el.getAttribute('data-cipher-state'),
          childElementCount: el.childElementCount,
          text: el.textContent,
        };
      }

      const rootStyle = window.getComputedStyle(document.getElementById('portfolio-perimeter-hud'));
      const navStyle = window.getComputedStyle(document.getElementById('mobile-touch-actions'));

      return {
        rootPointerEvents: rootStyle.pointerEvents,
        navPointerEvents: navStyle.pointerEvents,
        observedHotChars,
        baselineRects,
        dormantRects,
        scrambleRects,
        resolvedRects,
      };
    });

    assert.equal(
      hudDecodeReport.rootPointerEvents,
      'none',
      'Root #portfolio-perimeter-hud must have pointer-events: none'
    );
    assert.equal(
      hudDecodeReport.navPointerEvents,
      'auto',
      'Interactive #mobile-touch-actions bar must have pointer-events: auto'
    );
    assert.ok(
      hudDecodeReport.observedHotChars > 0,
      `Expected active hot scramble glyphs (.hud-cipher-char.is-hot) during decode wave, got ${hudDecodeReport.observedHotChars}`
    );

    let maxWidthDeltaPx = 0;
    let maxHeightDeltaPx = 0;
    for (const id of Object.keys(hudDecodeReport.baselineRects)) {
      const base = hudDecodeReport.baselineRects[id];
      const dorm = hudDecodeReport.dormantRects[id];
      const scram = hudDecodeReport.scrambleRects[id];
      const res = hudDecodeReport.resolvedRects[id];

      const dw = Math.max(
        Math.abs(dorm.width - base.width),
        Math.abs(scram.width - base.width),
        Math.abs(res.width - base.width)
      );
      const dh = Math.max(
        Math.abs(dorm.height - base.height),
        Math.abs(scram.height - base.height),
        Math.abs(res.height - base.height)
      );
      if (dw > maxWidthDeltaPx) maxWidthDeltaPx = dw;
      if (dh > maxHeightDeltaPx) maxHeightDeltaPx = dh;

      assert.equal(
        res.childElementCount,
        0,
        `Expected 0 temporary wrapper child spans in #${id} after resolve, got ${res.childElementCount}`
      );
      assert.equal(res.state, 'resolved', `Expected #${id} to finish in resolved state`);
    }

    assert.ok(
      maxWidthDeltaPx < 0.5 && maxHeightDeltaPx < 0.5,
      `Expected 0px layout jitter during glyph scramble, got dW=${maxWidthDeltaPx.toFixed(3)}px, dH=${maxHeightDeltaPx.toFixed(3)}px`
    );
    console.log(
      `  ✓ Zero-Jitter Cipher Decode verified across 8 HUD modules (max dW=${maxWidthDeltaPx.toFixed(3)}px, dH=${maxHeightDeltaPx.toFixed(3)}px, hot glyph samples=${hudDecodeReport.observedHotChars}, post-resolve DOM child spans=0).`
    );

    // -------------------------------------------------------------------------
    // Pillar 3 & Pillar 4: Mobile Portrait Layout, Revamped Analog Sticks & Dynamic Follow-Offset Scaling
    // -------------------------------------------------------------------------
    console.log('\n[Phase 4] Verifying Pillar 3 & Pillar 4 — Mobile Portrait HUD, Revamped Telemetry Sticks & Dynamic Camera Follow-Offsets...');

    // Measure desktop landscape (1920x1080, A = 1.778) camera offsets first
    const desktopCamState = await page.evaluate(() => {
      const sb = window.__sandbox;
      if (sb.director && sb.director.stopStartupPan) sb.director.stopStartupPan(true);
      sb.teleportCharacterTo(0.0, sb.environment.floorY, 12.0, 0.0);
      sb.step(1 / 60);
      return {
        aspect: sb.cameraOrbit.viewportAspect,
        portraitFactor: sb.cameraOrbit.portraitFactor,
        baseDist: sb.cameraOrbit.desiredDistance,
        effDist: sb.cameraOrbit.effectiveDesiredDistance,
        effPivotY: sb.cameraOrbit.effectivePivotHeightY,
        effShoulderX: sb.cameraOrbit.effectiveShoulderOffsetX,
      };
    });

    assert.equal(desktopCamState.portraitFactor, 0.0, 'Desktop 1920x1080 portraitFactor must be 0.0');
    assert.ok(
      Math.abs(desktopCamState.effDist - desktopCamState.baseDist) < 1e-5,
      'Desktop effectiveDesiredDistance must match base distance'
    );
    assert.ok(
      Math.abs(desktopCamState.effShoulderX) > 0.1,
      'Desktop ots_right preset must preserve non-zero shoulderOffsetX'
    );

    // Switch to Mobile Portrait (390x844, A = 0.462)
    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForTimeout(100);

    const portraitReport = await page.evaluate(() => {
      const sb = window.__sandbox;
      sb.mobileTouch.setEnabled(true);
      sb.teleportCharacterTo(0.0, sb.environment.floorY, 12.0, 0.0);
      sb.step(1 / 60);

      // Deflect left stick to sprint and right stick to orbit to test live vector tether & readouts
      sb.setThumbpadVector(0.55, 0.68);
      sb.setLookThumbpadVector(0.45, 0.55);

      const leftTether = document.getElementById('mobile-left-thumbpad-tether');
      const rightTether = document.getElementById('mobile-right-thumbpad-tether');
      const leftReadout = document.getElementById('mobile-left-thumbpad-readout');
      const rightReadout = document.getElementById('mobile-right-thumbpad-readout');
      const actionsRect = document.getElementById('mobile-touch-actions').getBoundingClientRect();
      const leftPadRect = document.getElementById('mobile-left-thumbpad').getBoundingClientRect();
      const rightPadRect = document.getElementById('mobile-right-thumbpad').getBoundingClientRect();

      // Project character head/spine screen Y to confirm character is framed in lower half/third
      const char = sb.getActiveCharacter();
      const charPelvisWorld = char.position.clone().add({ x: 0, y: 0.95, z: 0 });
      charPelvisWorld.project(sb.camera);
      const charScreenYFrac = (1.0 - charPelvisWorld.y) * 0.5;

      const state = {
        aspect: sb.cameraOrbit.viewportAspect,
        portraitFactor: sb.cameraOrbit.portraitFactor,
        baseDist: sb.cameraOrbit.desiredDistance,
        effDist: sb.cameraOrbit.effectiveDesiredDistance,
        distRatio: sb.cameraOrbit.effectiveDesiredDistance / sb.cameraOrbit.desiredDistance,
        effPivotY: sb.cameraOrbit.effectivePivotHeightY,
        effShoulderX: sb.cameraOrbit.effectiveShoulderOffsetX,
        charScreenYFrac,
        actionsTopY: actionsRect.top,
        actionsBottomY: actionsRect.bottom,
        leftPadLeft: leftPadRect.left,
        rightPadRight: rightPadRect.right,
        leftTetherX2: Number(leftTether.getAttribute('x2')),
        leftTetherY2: Number(leftTether.getAttribute('y2')),
        rightTetherX2: Number(rightTether.getAttribute('x2')),
        rightTetherY2: Number(rightTether.getAttribute('y2')),
        leftReadoutText: leftReadout ? leftReadout.textContent : '',
        rightReadoutText: rightReadout ? rightReadout.textContent : '',
      };

      sb.resetThumbpad();
      sb.resetLookThumbpad();
      return state;
    });

    assert.equal(portraitReport.portraitFactor, 1.0, 'Portrait 390x844 portraitFactor must be 1.0');
    assert.ok(
      portraitReport.distRatio >= 1.20 && portraitReport.distRatio <= 1.35,
      `Expected portrait boom pull-back ratio in [1.20, 1.35], got ${portraitReport.distRatio.toFixed(3)}`
    );
    assert.ok(
      portraitReport.effPivotY - desktopCamState.effPivotY >= 0.24,
      `Expected portrait lookAt Y-offset elevation >= +0.24m above desktop (${desktopCamState.effPivotY}m), got ${portraitReport.effPivotY.toFixed(3)}m`
    );
    assert.ok(
      Math.abs(portraitReport.effShoulderX) < 1e-4,
      `Expected portrait over-the-shoulder X-offset centered to 0.0m, got ${portraitReport.effShoulderX}`
    );
    assert.ok(
      portraitReport.actionsBottomY < 120,
      `Expected #mobile-touch-actions to reside in Top Perimeter HUD (bottomY < 120px), got ${portraitReport.actionsBottomY}px`
    );
    assert.ok(
      portraitReport.leftTetherX2 > 55 && portraitReport.leftTetherY2 < 45,
      `Expected left analog vector tether line to deflect toward knob, got (${portraitReport.leftTetherX2}, ${portraitReport.leftTetherY2})`
    );
    assert.ok(
      portraitReport.rightTetherX2 > 55 && portraitReport.rightTetherY2 < 45,
      `Expected right analog vector tether line to deflect toward knob, got (${portraitReport.rightTetherX2}, ${portraitReport.rightTetherY2})`
    );
    assert.ok(
      portraitReport.leftReadoutText.includes('SPRINT'),
      `Expected left analog tabular readout to report SPRINT, got "${portraitReport.leftReadoutText}"`
    );
    assert.ok(
      portraitReport.rightReadoutText.includes('ORBIT'),
      `Expected right analog tabular readout to report ORBIT, got "${portraitReport.rightReadoutText}"`
    );

    console.log(
      `  ✓ Portrait (390x844) Dynamic Camera Follow-Offsets verified: Boom=${portraitReport.effDist.toFixed(3)}m (+${((portraitReport.distRatio - 1) * 100).toFixed(0)}%), PivotY=${portraitReport.effPivotY.toFixed(3)}m (+${(portraitReport.effPivotY - desktopCamState.effPivotY).toFixed(2)}m), ShoulderX=${portraitReport.effShoulderX.toFixed(4)}m.`
    );
    console.log(
      `  ✓ Mobile HUD Navigation Bar docked at top (y=${Math.round(portraitReport.actionsTopY)}..${Math.round(portraitReport.actionsBottomY)}px); Revamped Telemetry Analog Sticks & Vector Tethers verified (${portraitReport.leftReadoutText} | ${portraitReport.rightReadoutText}).`
    );

    assert.equal(pageErrors.length, 0, `Unexpected page errors: ${pageErrors.join('; ')}`);
    assert.equal(consoleErrors.length, 0, `Unexpected console errors: ${consoleErrors.join('; ')}`);

    console.log('\n========================================================================');
    console.log('ALL SPEC 070 VERIFICATION CHECKS PASSED WITH ZERO ERRORS!');
    console.log('========================================================================');
  } finally {
    await browser.close();
  }
}

runVerification().catch((err) => {
  console.error('\n❌ SPEC 070 VERIFICATION FAILURE:', err);
  process.exit(1);
});
