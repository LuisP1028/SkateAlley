/**
 * End-to-End Live Runtime & Mathematical Verification for functional_specification_068.md:
 * 1. Decoupled Steady Third-Person Follow Camera (WASD / Left-Stick Independence)
 * 2. Mobile Right-Side Analog Look Thumbstick (#mobile-right-thumbpad) + Multi-Touch Isolation + Zero Overlap
 * 3. Two-Stage Spring Arm Camera Collision System (Spine -> Shoulder Socket -> Eye Boom + Frustum Clamp + Head Guard)
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

function computeBoxOverlapArea(a, b) {
  if (!a || !b) return 0;
  const xOverlap = Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left));
  const yOverlap = Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top));
  return xOverlap * yOverlap;
}

async function runVerification() {
  console.log('================================================================');
  console.log('SPEC 068 CAMERA, MOBILE RIGHT LOOK STICK & SPRING ARM SUITE');
  console.log('================================================================');

  const browser = await chromium.launch({
    headless: true,
    args: ['--use-gl=angle', '--use-angle=metal'],
  });

  const pageErrors = [];
  const consoleErrors = [];

  try {
    const context = await browser.newContext({
      viewport: { width: 1280, height: 800 },
      deviceScaleFactor: 2.0,
    });
    const page = await context.newPage();

    page.on('pageerror', (err) => {
      console.error('  [Browser PageError]', err.message);
      pageErrors.push(err.message);
    });
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        const text = msg.text();
        // Ignore benign favicon 404 if any
        if (!text.includes('favicon')) {
          consoleErrors.push(text);
        }
      }
    });

    console.log('\n[Phase 1] Booting live browser against http://localhost:8080/index.html...');
    await page.goto('http://localhost:8080/index.html', {
      waitUntil: 'domcontentloaded',
      timeout: 30000,
    });
    await page.waitForFunction(
      () => window.__sandbox && window.__sandbox.ready && window.__sandbox.getActiveCharacter(),
      { timeout: 30000 }
    );

    await page.evaluate(() => {
      const sb = window.__sandbox;
      if (sb.skipSprayPaintIntro) sb.skipSprayPaintIntro();
      if (sb.director && sb.director.stopStartupPan) sb.director.stopStartupPan(true);
    });

    // -------------------------------------------------------------------------
    // Pillar 1: Decoupled Steady Third-Person Follow Camera (WASD / Left-Stick)
    // -------------------------------------------------------------------------
    console.log('\n[Phase 2] Verifying Pillar 1 — Decoupled Steady Third-Person Follow Camera...');
    const pillar1Report = await page.evaluate(() => {
      const sb = window.__sandbox;
      // Teleport character to open corridor center
      sb.teleportCharacterTo(0.0, sb.environment.floorY, 12.0, 0.0);
      const initialYaw = sb.cameraOrbit.yaw;
      const char = sb.getActiveCharacter();

      const runSegment = (keyCode, frames) => {
        for (const k of Object.keys(sb.keysPressed)) sb.keysPressed[k] = false;
        if (keyCode) sb.keysPressed[keyCode] = true;
        const startPos = { x: char.position.x, z: char.position.z };
        const startCharYaw = char.yaw;
        let maxCamYawDrift = 0.0;
        for (let i = 0; i < frames; i++) {
          sb.step(1 / 60);
          const drift = Math.abs(sb.cameraOrbit.yaw - initialYaw);
          if (drift > maxCamYawDrift) maxCamYawDrift = drift;
        }
        for (const k of Object.keys(sb.keysPressed)) sb.keysPressed[k] = false;
        return {
          keyCode,
          maxCamYawDrift,
          endCamYaw: sb.cameraOrbit.yaw,
          startCharYaw,
          endCharYaw: char.yaw,
          dx: char.position.x - startPos.x,
          dz: char.position.z - startPos.z,
        };
      };

      const segD = runSegment('KeyD', 45);
      const segA = runSegment('KeyA', 45);
      const segS = runSegment('KeyS', 45);
      const segW = runSegment('KeyW', 45);

      // Also test Left-Stick analog deflection (strafe right)
      sb.mobileTouch.setEnabled(true);
      sb.setThumbpadVector(1.0, 0.0);
      let maxStickCamYawDrift = 0.0;
      for (let i = 0; i < 45; i++) {
        sb.step(1 / 60);
        const drift = Math.abs(sb.cameraOrbit.yaw - initialYaw);
        if (drift > maxStickCamYawDrift) maxStickCamYawDrift = drift;
      }
      sb.resetThumbpad();

      return {
        initialYaw,
        segD,
        segA,
        segS,
        segW,
        maxStickCamYawDrift,
      };
    });

    assert.ok(
      pillar1Report.segD.maxCamYawDrift < 1e-6,
      `Expected 0.0 rad camera yaw drift during KeyD strafe, got ${pillar1Report.segD.maxCamYawDrift}`
    );
    assert.ok(
      pillar1Report.segA.maxCamYawDrift < 1e-6,
      `Expected 0.0 rad camera yaw drift during KeyA strafe, got ${pillar1Report.segA.maxCamYawDrift}`
    );
    assert.ok(
      pillar1Report.segS.maxCamYawDrift < 1e-6,
      `Expected 0.0 rad camera yaw drift during KeyS backpedal, got ${pillar1Report.segS.maxCamYawDrift}`
    );
    assert.ok(
      pillar1Report.segW.maxCamYawDrift < 1e-6,
      `Expected 0.0 rad camera yaw drift during KeyW forward walk, got ${pillar1Report.segW.maxCamYawDrift}`
    );
    assert.ok(
      pillar1Report.maxStickCamYawDrift < 1e-6,
      `Expected 0.0 rad camera yaw drift during Left-Stick deflection, got ${pillar1Report.maxStickCamYawDrift}`
    );
    assert.notEqual(
      pillar1Report.segD.startCharYaw,
      pillar1Report.segD.endCharYaw,
      'Expected character mesh yaw to rotate smoothly toward KeyD strafe heading while camera stays steady'
    );
    console.log(
      `  ✓ WASD & Left-Stick camera yaw drift = 0.000000 rad across KeyD/KeyA/KeyS/KeyW + Left-Stick (char rotated to ${pillar1Report.segD.endCharYaw.toFixed(3)} rad on KeyD).`
    );

    // -------------------------------------------------------------------------
    // Pillar 2: Mobile Right-Side Analog Look Thumbstick & Responsive Layout
    // -------------------------------------------------------------------------
    console.log('\n[Phase 3] Verifying Pillar 2 — Mobile Right-Side Look Thumbstick & Responsive Viewports...');

    const viewports = [
      { label: '375x667 (Mobile Portrait SE)', width: 375, height: 667 },
      { label: '390x844 (Mobile Portrait 14)', width: 390, height: 844 },
      { label: '844x390 (Mobile Landscape)', width: 844, height: 390 },
    ];

    for (const vp of viewports) {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.waitForTimeout(80);

      const layoutReport = await page.evaluate(() => {
        const sb = window.__sandbox;
        sb.mobileTouch.setEnabled(true);
        if (sb.mp3Player && typeof sb.mp3Player.setVisible === 'function') {
          sb.mp3Player.setVisible(true);
        }
        const rectOf = (id) => {
          const el = document.getElementById(id);
          if (!el) return null;
          const r = el.getBoundingClientRect();
          const style = window.getComputedStyle(el);
          return {
            left: r.left,
            top: r.top,
            right: r.right,
            bottom: r.bottom,
            width: r.width,
            height: r.height,
            display: style.display,
            visibility: style.visibility,
          };
        };
        return {
          leftPad: rectOf('mobile-left-thumbpad'),
          rightPad: rectOf('mobile-right-thumbpad'),
          actions: rectOf('mobile-touch-actions'),
          mp3Hud: rectOf('doom-tracks-mp3-hud'),
        };
      });

      assert.ok(layoutReport.rightPad, `Missing #mobile-right-thumbpad at ${vp.label}`);
      assert.ok(
        layoutReport.rightPad.width >= 96 && layoutReport.rightPad.height >= 96,
        `Expected #mobile-right-thumbpad size >= 96px at ${vp.label}, got ${layoutReport.rightPad.width}x${layoutReport.rightPad.height}`
      );
      assert.ok(
        layoutReport.rightPad.left >= 0 &&
          layoutReport.rightPad.top >= 0 &&
          layoutReport.rightPad.right <= vp.width &&
          layoutReport.rightPad.bottom <= vp.height,
        `#mobile-right-thumbpad out of viewport bounds at ${vp.label}: ${JSON.stringify(layoutReport.rightPad)}`
      );

      const overlapMp3 = computeBoxOverlapArea(layoutReport.rightPad, layoutReport.mp3Hud);
      const overlapLeft = computeBoxOverlapArea(layoutReport.rightPad, layoutReport.leftPad);
      const overlapActions = computeBoxOverlapArea(layoutReport.rightPad, layoutReport.actions);

      assert.equal(
        overlapMp3,
        0,
        `Expected 0 px² overlap between #mobile-right-thumbpad and #doom-tracks-mp3-hud at ${vp.label}, got ${overlapMp3}`
      );
      assert.equal(
        overlapLeft,
        0,
        `Expected 0 px² overlap between #mobile-right-thumbpad and #mobile-left-thumbpad at ${vp.label}, got ${overlapLeft}`
      );
      assert.equal(
        overlapActions,
        0,
        `Expected 0 px² overlap between #mobile-right-thumbpad and #mobile-touch-actions at ${vp.label}, got ${overlapActions}`
      );
      console.log(
        `  ✓ ${vp.label}: #mobile-right-thumbpad (${Math.round(layoutReport.rightPad.width)}x${Math.round(layoutReport.rightPad.height)}px) has 0 px² overlap with MP3 HUD, Left Stick, and Action Pills.`
      );
    }

    // Verify mp3-hud-hidden body class docking behavior
    const mp3DockingReport = await page.evaluate(() => {
      const sb = window.__sandbox;
      sb.mp3Player.setVisible(false);
      const hiddenClassPresent = document.body.classList.contains('mp3-hud-hidden');
      const rectWhenHidden = document.getElementById('mobile-right-thumbpad').getBoundingClientRect();
      sb.mp3Player.setVisible(true);
      const hiddenClassRemoved = !document.body.classList.contains('mp3-hud-hidden');
      const rectWhenVisible = document.getElementById('mobile-right-thumbpad').getBoundingClientRect();
      return {
        hiddenClassPresent,
        hiddenClassRemoved,
        bottomWhenHidden: window.innerHeight - rectWhenHidden.bottom,
        bottomWhenVisible: window.innerHeight - rectWhenVisible.bottom,
      };
    });
    assert.equal(mp3DockingReport.hiddenClassPresent, true, 'body.mp3-hud-hidden must be set when MP3 HUD is hidden');
    assert.equal(mp3DockingReport.hiddenClassRemoved, true, 'body.mp3-hud-hidden must be removed when MP3 HUD is visible');
    assert.ok(
      mp3DockingReport.bottomWhenHidden < mp3DockingReport.bottomWhenVisible,
      'Expected #mobile-right-thumbpad to dock closer to bottom edge when MP3 HUD is hidden'
    );
    console.log(
      `  ✓ MP3 HUD toggle docking verified (bottom offset ${Math.round(mp3DockingReport.bottomWhenVisible)}px when MP3 visible -> ${Math.round(mp3DockingReport.bottomWhenHidden)}px when hidden).`
    );

    // Verify Right-Stick Deadzone, Quadratic-Linear Velocity Curve, and Multi-Touch Pointer Isolation
    const thumbstickBehaviorReport = await page.evaluate(() => {
      const sb = window.__sandbox;
      sb.mobileTouch.setEnabled(true);
      sb.mobileTouch.reset();

      // 1. Deadzone check (< 0.12)
      sb.setLookThumbpadVector(0.08, -0.05);
      const deadzoneState = {
        lookX: sb.mobileTouch.lookX,
        lookY: sb.mobileTouch.lookY,
        yawRate: sb.mobileTouch.yawRateRadPerSec,
        pitchRate: sb.mobileTouch.pitchRateRadPerSec,
      };

      // 2. Full right deflection (nx = 1.0, ny = 0.0) -> yawRate = -2.4 rad/s
      sb.setLookThumbpadVector(1.0, 0.0);
      const fullRightState = {
        lookX: sb.mobileTouch.lookX,
        lookY: sb.mobileTouch.lookY,
        yawRate: sb.mobileTouch.yawRateRadPerSec,
        pitchRate: sb.mobileTouch.pitchRateRadPerSec,
      };

      // Step 30 frames (0.5s) and verify cameraOrbit.yaw changes by -1.2 rad
      const yawBefore = sb.cameraOrbit.yaw;
      for (let i = 0; i < 30; i++) {
        sb.step(1 / 60);
      }
      const yawAfter = sb.cameraOrbit.yaw;
      let deltaYaw = yawAfter - yawBefore;
      while (deltaYaw > Math.PI) deltaYaw -= Math.PI * 2;
      while (deltaYaw < -Math.PI) deltaYaw += Math.PI * 2;

      sb.resetLookThumbpad();

      // 2b. Full UP deflection (nx = 0.0, ny = 1.0) -> pitchRate = +1.5 rad/s (camera tilts UP)
      sb.cameraOrbit.pitch = 0.0;
      sb.setLookThumbpadVector(0.0, 1.0);
      const fullUpState = {
        pitchRate: sb.mobileTouch.pitchRateRadPerSec,
      };
      for (let i = 0; i < 12; i++) {
        sb.step(1 / 60);
      }
      const pitchAfterUp = sb.cameraOrbit.pitch;
      sb.resetLookThumbpad();

      // 2c. Full DOWN deflection (nx = 0.0, ny = -1.0) -> pitchRate = -1.5 rad/s (camera tilts DOWN)
      sb.cameraOrbit.pitch = 0.0;
      sb.setLookThumbpadVector(0.0, -1.0);
      const fullDownState = {
        pitchRate: sb.mobileTouch.pitchRateRadPerSec,
      };
      for (let i = 0; i < 12; i++) {
        sb.step(1 / 60);
      }
      const pitchAfterDown = sb.cameraOrbit.pitch;
      sb.resetLookThumbpad();

      // 2d. Mobile MENU button (#mobile-action-mode-btn) showcases the Cyber-Tactical Radial Menu
      const menuBtnEl = document.getElementById('mobile-action-mode-btn');
      const menuBtnLabel = menuBtnEl ? menuBtnEl.textContent.trim() : '';
      if (sb.radialMenu && sb.radialMenu.isOpen()) {
        sb.radialMenu.close();
      }
      menuBtnEl.dispatchEvent(
        new PointerEvent('pointerdown', {
          bubbles: true,
          cancelable: true,
          pointerId: 303,
          pointerType: 'touch',
        })
      );
      const radialOpenAfterTap = Boolean(sb.radialMenu && sb.radialMenu.isOpen());
      const menuBtnActiveWhenOpen = Boolean(menuBtnEl && menuBtnEl.classList.contains('active'));
      const radialBoundsOnMobile = sb.radialMenu ? sb.radialMenu.getRenderedBounds() : null;
      if (sb.radialMenu && sb.radialMenu.isOpen()) {
        sb.radialMenu.close();
      }

      // 3. Multi-touch pointer isolation via synthetic PointerEvents on #mobile-left-thumbpad and #mobile-right-thumbpad
      const leftEl = document.getElementById('mobile-left-thumbpad');
      const rightEl = document.getElementById('mobile-right-thumbpad');
      const leftRect = leftEl.getBoundingClientRect();
      const rightRect = rightEl.getBoundingClientRect();

      leftEl.dispatchEvent(
        new PointerEvent('pointerdown', {
          bubbles: true,
          cancelable: true,
          pointerId: 101,
          pointerType: 'touch',
          clientX: leftRect.left + leftRect.width * 0.5,
          clientY: leftRect.top + leftRect.height * 0.2,
        })
      );
      rightEl.dispatchEvent(
        new PointerEvent('pointerdown', {
          bubbles: true,
          cancelable: true,
          pointerId: 202,
          pointerType: 'touch',
          clientX: rightRect.left + rightRect.width * 0.85,
          clientY: rightRect.top + rightRect.height * 0.5,
        })
      );

      const bothActiveState = {
        movePointerId: sb.mobileTouch.pointerId,
        lookPointerId: sb.mobileTouch.lookThumbpadPointerId,
        moveMag: sb.mobileTouch.magnitude,
        lookMag: sb.mobileTouch.lookMagnitude,
        rightHasLookingClass: rightEl.classList.contains('looking'),
      };

      // Release ONLY left thumbstick (pointerId 101)
      leftEl.dispatchEvent(
        new PointerEvent('pointerup', {
          bubbles: true,
          cancelable: true,
          pointerId: 101,
          pointerType: 'touch',
        })
      );

      const afterLeftReleaseState = {
        movePointerId: sb.mobileTouch.pointerId,
        lookPointerId: sb.mobileTouch.lookThumbpadPointerId,
        moveMag: sb.mobileTouch.magnitude,
        lookMag: sb.mobileTouch.lookMagnitude,
        yawRate: sb.mobileTouch.yawRateRadPerSec,
        rightHasLookingClass: rightEl.classList.contains('looking'),
      };

      // Release right thumbstick (pointerId 202)
      rightEl.dispatchEvent(
        new PointerEvent('pointerup', {
          bubbles: true,
          cancelable: true,
          pointerId: 202,
          pointerType: 'touch',
        })
      );

      const afterBothReleaseState = {
        movePointerId: sb.mobileTouch.pointerId,
        lookPointerId: sb.mobileTouch.lookThumbpadPointerId,
        moveMag: sb.mobileTouch.magnitude,
        lookMag: sb.mobileTouch.lookMagnitude,
        yawRate: sb.mobileTouch.yawRateRadPerSec,
        rightHasLookingClass: rightEl.classList.contains('looking'),
      };

      return {
        deadzoneState,
        fullRightState,
        deltaYawHalfSec: deltaYaw,
        fullUpState,
        pitchAfterUp,
        fullDownState,
        pitchAfterDown,
        menuBtnLabel,
        radialOpenAfterTap,
        menuBtnActiveWhenOpen,
        radialBoundsOnMobile,
        bothActiveState,
        afterLeftReleaseState,
        afterBothReleaseState,
      };
    });

    assert.equal(thumbstickBehaviorReport.deadzoneState.yawRate, 0, 'Deadzone yawRate must be 0');
    assert.equal(thumbstickBehaviorReport.deadzoneState.pitchRate, 0, 'Deadzone pitchRate must be 0');
    assert.ok(
      Math.abs(thumbstickBehaviorReport.fullRightState.yawRate - -2.4) < 1e-4,
      `Expected full-right yawRate = -2.4 rad/s, got ${thumbstickBehaviorReport.fullRightState.yawRate}`
    );
    assert.ok(
      Math.abs(thumbstickBehaviorReport.deltaYawHalfSec - -1.2) < 0.03,
      `Expected 0.5s full-right look deflection to rotate camera yaw by -1.2 rad, got ${thumbstickBehaviorReport.deltaYawHalfSec}`
    );
    assert.ok(
      Math.abs(thumbstickBehaviorReport.fullUpState.pitchRate - 1.5) < 1e-4,
      `Expected full-up pitchRate = +1.5 rad/s, got ${thumbstickBehaviorReport.fullUpState.pitchRate}`
    );
    assert.ok(
      thumbstickBehaviorReport.pitchAfterUp > 0.25,
      `Expected pushing right stick UP to increase cameraOrbit.pitch (> 0.25 rad), got ${thumbstickBehaviorReport.pitchAfterUp}`
    );
    assert.ok(
      Math.abs(thumbstickBehaviorReport.fullDownState.pitchRate - -1.5) < 1e-4,
      `Expected full-down pitchRate = -1.5 rad/s, got ${thumbstickBehaviorReport.fullDownState.pitchRate}`
    );
    assert.ok(
      thumbstickBehaviorReport.pitchAfterDown < -0.25,
      `Expected pulling right stick DOWN to decrease cameraOrbit.pitch (< -0.25 rad), got ${thumbstickBehaviorReport.pitchAfterDown}`
    );
    assert.equal(thumbstickBehaviorReport.menuBtnLabel, 'MENU', 'Mobile #mobile-action-mode-btn must be labeled MENU');
    assert.equal(thumbstickBehaviorReport.radialOpenAfterTap, true, 'Tapping mobile MENU button must open radial menu');
    assert.equal(thumbstickBehaviorReport.menuBtnActiveWhenOpen, true, 'Mobile MENU button must have .active class when radial menu is open');
    assert.ok(
      thumbstickBehaviorReport.radialBoundsOnMobile &&
        thumbstickBehaviorReport.radialBoundsOnMobile.width >= 200 &&
        thumbstickBehaviorReport.radialBoundsOnMobile.left >= 8 &&
        thumbstickBehaviorReport.radialBoundsOnMobile.top >= 8 &&
        thumbstickBehaviorReport.radialBoundsOnMobile.right <=
          thumbstickBehaviorReport.radialBoundsOnMobile.viewportWidth - 8 &&
        thumbstickBehaviorReport.radialBoundsOnMobile.bottom <=
          thumbstickBehaviorReport.radialBoundsOnMobile.viewportHeight - 8,
      `Expected mobile radial menu to fit within viewport bounds, got ${JSON.stringify(thumbstickBehaviorReport.radialBoundsOnMobile)}`
    );
    assert.equal(thumbstickBehaviorReport.bothActiveState.movePointerId, 101);
    assert.equal(thumbstickBehaviorReport.bothActiveState.lookPointerId, 202);
    assert.ok(thumbstickBehaviorReport.bothActiveState.moveMag > 0.5);
    assert.ok(thumbstickBehaviorReport.bothActiveState.lookMag > 0.5);
    assert.equal(thumbstickBehaviorReport.bothActiveState.rightHasLookingClass, true);

    // Crucial multi-touch isolation invariant: releasing left stick must NOT reset right stick!
    assert.equal(thumbstickBehaviorReport.afterLeftReleaseState.movePointerId, null);
    assert.equal(thumbstickBehaviorReport.afterLeftReleaseState.moveMag, 0);
    assert.equal(thumbstickBehaviorReport.afterLeftReleaseState.lookPointerId, 202);
    assert.ok(thumbstickBehaviorReport.afterLeftReleaseState.lookMag > 0.5);
    assert.ok(Math.abs(thumbstickBehaviorReport.afterLeftReleaseState.yawRate) > 1.0);
    assert.equal(thumbstickBehaviorReport.afterLeftReleaseState.rightHasLookingClass, true);

    assert.equal(thumbstickBehaviorReport.afterBothReleaseState.lookPointerId, null);
    assert.equal(thumbstickBehaviorReport.afterBothReleaseState.lookMag, 0);
    assert.equal(thumbstickBehaviorReport.afterBothReleaseState.yawRate, 0);
    assert.equal(thumbstickBehaviorReport.afterBothReleaseState.rightHasLookingClass, false);
    console.log(
      '  ✓ Right Look Thumbstick deadzone (0.12), quadratic-linear velocity (-2.4 rad/s yaw, 1.5 rad/s pitch), and strict multi-touch pointer isolation verified.'
    );

    // -------------------------------------------------------------------------
    // Pillar 3: Two-Stage Spring Arm Camera Collision System & Wall Clearance
    // -------------------------------------------------------------------------
    console.log('\n[Phase 4] Verifying Pillar 3 — Two-Stage Spring Arm Camera Collision & Performance...');
    await page.setViewportSize({ width: 1280, height: 800 });

    const springArmReport = await page.evaluate(() => {
      const sb = window.__sandbox;
      const wallSegments = sb.environment.wallSegments;
      const char = sb.getActiveCharacter();

      // Test positions flush against Left Wall (X ≈ -1.62 inside alley corridor Z = +12.0) and Right Wall (X ≈ +1.62, Z = +12.0)
      const testWallCases = [
        { label: 'Left Wall Flush (Z=12m)', x: -2.0, z: 12.0 },
        { label: 'Right Wall Flush (Z=12m)', x: 2.0, z: 12.0 },
        { label: 'Narrow Corridor Pinch (Z=28m)', x: -1.9, z: 28.0 },
      ];

      let minPivotWallClearanceM = Infinity;
      let minEyeWallClearanceM = Infinity;
      let minHeadSeparationM = Infinity;
      let minForwardDot = 1.0;
      let totalSamples = 0;

      for (const tc of testWallCases) {
        // Place character and clamp character capsule against walls just as locomotion does
        sb.teleportCharacterTo(tc.x, sb.environment.floorY, tc.z, 0.0);
        // Step once with small move to resolve character capsule against wall
        sb.keysPressed.KeyA = tc.x < 0;
        sb.keysPressed.KeyD = tc.x > 0;
        for (let i = 0; i < 20; i++) sb.step(1 / 60);
        sb.keysPressed.KeyA = false;
        sb.keysPressed.KeyD = false;

        for (const pitch of [-0.35, 0.14, 0.65]) {
          for (let deg = 0; deg < 360; deg += 5) {
            const yaw = (deg * Math.PI) / 180;
            sb.cameraOrbit.userLookOverride = true;
            sb.cameraOrbit.isDragging = true;
            sb.cameraOrbit.yaw = Math.atan2(Math.sin(yaw), Math.cos(yaw));
            sb.cameraOrbit.pitch = pitch;

            // Step frame at this azimuth
            sb.step(1 / 60);
            sb.cameraOrbit.isDragging = false;

            const pivotClear = sb.cameraOrbit.pivotWallClearanceM;
            const eyeClear = sb.cameraOrbit.eyeWallClearanceM;
            const headSep = Math.hypot(
              sb.camera.position.x - char.position.x,
              sb.camera.position.z - char.position.z
            );

            // Check optical forward vector alignment with cameraOrbit yaw/pitch
            // Euler(pitch, yaw + Math.PI, 0, 'YXZ') maps camera -Z (optical forward) to (+sinY * cosP, +sinP, +cosY * cosP)
            const cosP = Math.cos(pitch);
            const sinP = Math.sin(pitch);
            const sinY = Math.sin(sb.cameraOrbit.yaw);
            const cosY = Math.cos(sb.cameraOrbit.yaw);
            const expFwdX = sinY * cosP;
            const expFwdY = sinP;
            const expFwdZ = cosY * cosP;

            const e = sb.camera.matrixWorld.elements;
            const actualFwdX = -e[8];
            const actualFwdY = -e[9];
            const actualFwdZ = -e[10];
            const dot = expFwdX * actualFwdX + expFwdY * actualFwdY + expFwdZ * actualFwdZ;

            if (pivotClear < minPivotWallClearanceM) minPivotWallClearanceM = pivotClear;
            if (eyeClear < minEyeWallClearanceM) minEyeWallClearanceM = eyeClear;
            if (headSep < minHeadSeparationM) minHeadSeparationM = headSep;
            if (dot < minForwardDot) minForwardDot = dot;
            totalSamples++;
          }
        }
      }

      // Benchmark 1,000 invocations of computeThirdPersonCameraPose(1/60)
      const benchIterations = 1000;
      const t0 = performance.now();
      for (let i = 0; i < benchIterations; i++) {
        sb.cameraOrbit.yaw = ((i * 5) % 360) * (Math.PI / 180);
        sb.computeThirdPersonCameraPose(1 / 60);
      }
      const elapsedMs = performance.now() - t0;
      const avgFrameMs = elapsedMs / benchIterations;

      return {
        totalSamples,
        minPivotWallClearanceM,
        minEyeWallClearanceM,
        minHeadSeparationM,
        minForwardDot,
        avgFrameMs,
        wallSegmentCount: wallSegments.length,
      };
    });

    console.log(
      `  ✓ Tested ${springArmReport.totalSamples} 360°×pitch wall-hug samples across ${springArmReport.wallSegmentCount} collider segments:`
    );
    console.log(`    - Min Stage-1 Shoulder Socket Wall Clearance : ${springArmReport.minPivotWallClearanceM.toFixed(4)} m (budget >= 0.2200 m)`);
    console.log(`    - Min Stage-2 Camera Eye Wall Clearance      : ${springArmReport.minEyeWallClearanceM.toFixed(4)} m (budget >= 0.2200 m)`);
    console.log(`    - Min Planar Character Head Separation       : ${springArmReport.minHeadSeparationM.toFixed(4)} m (budget >= 0.2500 m)`);
    console.log(`    - Min Optical Forward Ray Alignment Dot      : ${springArmReport.minForwardDot.toFixed(6)} (budget >= 0.9950)`);
    console.log(`    - Avg Two-Stage Spring Arm Solver Cost       : ${springArmReport.avgFrameMs.toFixed(4)} ms/frame (budget <= 0.0800 ms)`);

    assert.ok(
      springArmReport.minPivotWallClearanceM >= 0.22,
      `Expected minPivotWallClearanceM >= 0.22m, got ${springArmReport.minPivotWallClearanceM}`
    );
    assert.ok(
      springArmReport.minEyeWallClearanceM >= 0.22,
      `Expected minEyeWallClearanceM >= 0.22m, got ${springArmReport.minEyeWallClearanceM}`
    );
    assert.ok(
      springArmReport.minHeadSeparationM >= 0.25,
      `Expected minHeadSeparationM >= 0.25m, got ${springArmReport.minHeadSeparationM}`
    );
    assert.ok(
      springArmReport.minForwardDot >= 0.995,
      `Expected minForwardDot >= 0.995 (zero lookAt inversion), got ${springArmReport.minForwardDot}`
    );
    assert.ok(
      springArmReport.avgFrameMs <= 0.08,
      `Expected avgFrameMs <= 0.08ms, got ${springArmReport.avgFrameMs}`
    );

    assert.equal(pageErrors.length, 0, `Unexpected page errors: ${pageErrors.join('; ')}`);
    assert.equal(consoleErrors.length, 0, `Unexpected console errors: ${consoleErrors.join('; ')}`);

    console.log('\n================================================================');
    console.log('ALL SPEC 068 VERIFICATION CHECKS PASSED WITH ZERO ERRORS!');
    console.log('================================================================');
  } finally {
    await browser.close();
  }
}

runVerification().catch((err) => {
  console.error('\n❌ SPEC 068 VERIFICATION FAILURE:', err);
  process.exit(1);
});
