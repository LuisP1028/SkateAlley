/**
 * Live Headless Chromium E2E Verification for functional_specification_048.md:
 * Back-Alley Watercolor Portal Screen-Mount-Styled Holographic Game Selector Pop-Up
 * & Cropped RGBA Game Logos (platodoom header, Skate 3, GTA, Zombies).
 */

import http from 'node:http';
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
    throw new Error('Playwright package could not be resolved for E2E browser verification.');
  }
}
const { chromium } = loadPlaywright();

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.wasm': 'application/wasm',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.glb': 'model/gltf-binary',
  '.mp3': 'audio/mpeg',
  '.mp4': 'video/mp4',
  '.ico': 'image/x-icon',
};

function startStaticServer(rootDir) {
  return new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      try {
        const parsed = new URL(req.url, 'http://127.0.0.1');
        let relPath = decodeURIComponent(parsed.pathname);
        let fsPath = path.join(rootDir, relPath);

        if (fs.existsSync(fsPath) && fs.statSync(fsPath).isDirectory()) {
          fsPath = path.join(fsPath, 'index.html');
        }

        if (!fs.existsSync(fsPath) || !fs.statSync(fsPath).isFile()) {
          res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
          res.end(`Not Found: ${relPath}`);
          return;
        }

        const ext = path.extname(fsPath).toLowerCase();
        const contentType = MIME_TYPES[ext] || 'application/octet-stream';
        res.writeHead(200, {
          'Content-Type': contentType,
          'Cache-Control': 'no-store',
        });
        fs.createReadStream(fsPath).pipe(res);
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end(String(err));
      }
    });

    server.on('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const addr = server.address();
      resolve({ server, baseUrl: `http://127.0.0.1:${addr.port}` });
    });
  });
}

async function runTests() {
  const { server, baseUrl } = await startStaticServer(REPO_ROOT);
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
    const context = await browser.newContext({
      viewport: { width: 1440, height: 900 },
    });
    const page = await context.newPage();

    const pageErrors = [];
    page.on('pageerror', (err) => {
      pageErrors.push(err.message || String(err));
    });

    console.log('[1/7] Loading Freeman Alley 3D WebGL Sandbox...');
    await page.goto(`${baseUrl}/index.html`, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForFunction(
      () => Boolean(window.__SANDBOX__ && (window.__SANDBOX__.ready || window.__SANDBOX__.error)),
      null,
      { timeout: 45000 }
    );
    const initErr = await page.evaluate(() => window.__SANDBOX__?.error || null);
    if (initErr) {
      throw new Error(`Sandbox initialization failed with error: ${initErr}`);
    }

    // Skip intro spray loader & move to 100% Free-Roam near the back-alley watercolor portal
    await page.evaluate(() => {
      const sb = window.__SANDBOX__;
      if (sb.skipSprayPaintIntro) sb.skipSprayPaintIntro();
      const sprayOverlay = document.getElementById('spray-paint-loader-overlay');
      if (sprayOverlay) {
        sprayOverlay.classList.add('hidden');
        sprayOverlay.style.display = 'none';
      }
      const introOverlay = document.getElementById('intro-dialogue-overlay');
      if (introOverlay) {
        introOverlay.style.display = 'none';
      }
      sb.setScrollProgress(1.0);
    });

    // -------------------------------------------------------------------------
    // Spec 055 AC-01 & AC-02: Removal of 3D Click-to-Popup, Hover Leak Isolation,
    // Camera Orbit Continuity & Removal of Non-Walk Triggers
    // -------------------------------------------------------------------------
    console.log('[2/7] Verifying Spec 055 AC-01 & AC-02: 3D click/hover on watercolor shader never opens popup outside Edit Mode, camera drag works unobstructed, and non-walk shortcuts are removed...');
    const targetScreenCoords = await page.evaluate(() => {
      const sb = window.__SANDBOX__;
      const activeChar = sb.getActiveCharacter();
      const canvas = sb.renderer.domElement;

      if (sb.holoEditMode) sb.toggleHoloEditMode(false);
      if (sb.isPortalPopupOpen) sb.closePortalGameSelectorPopup({ immediate: true, silent: true });

      // Position player at Z = 39.8m facing the back-alley watercolor portal at Z = 42.6182m
      activeChar.position.set(0.13, sb.environment.floorY, 39.80);
      activeChar.root.position.copy(activeChar.position);
      sb.cameraOrbit.yaw = 0.0;
      sb.cameraOrbit.pitch = 0.05;
      sb.step(1 / 60);

      const rect = canvas.getBoundingClientRect();
      const clientX = Math.round(rect.left + rect.width * 0.64);
      const clientY = Math.round(rect.top + rect.height * 0.34);
      return {
        clientX,
        clientY,
      };
    });

    // 1. Move real pointer over the watercolor canvas and click it
    await page.mouse.move(targetScreenCoords.clientX, targetScreenCoords.clientY);
    const hoverCheck = await page.evaluate(() => ({
      hoveredAfterMove: window.__SANDBOX__.hoveredHoloColumnId,
      hasPointerHoverClass: document.body.classList.contains('mount-pointer-hover'),
    }));
    await page.mouse.click(targetScreenCoords.clientX, targetScreenCoords.clientY);
    const clickCheck = await page.evaluate(() => ({
      popupOpenAfterClick: window.__SANDBOX__.isPortalPopupOpen || window.__SANDBOX__.waterColor.isPopupOpen,
      popupCountAfterClick: window.__SANDBOX__.waterColor.popupOpenCount,
    }));

    // 2. Drag camera orbit starting directly over the watercolor canvas
    const yawBeforeDrag = await page.evaluate(() => window.__SANDBOX__.cameraOrbit.yaw);
    await page.mouse.move(targetScreenCoords.clientX, targetScreenCoords.clientY);
    await page.mouse.down();
    const isDraggingDuringOrbit = await page.evaluate(() => window.__SANDBOX__.cameraOrbit.isDragging);
    await page.mouse.move(targetScreenCoords.clientX + 90, targetScreenCoords.clientY, { steps: 4 });
    await page.mouse.up();
    const yawAfterDrag = await page.evaluate(() => {
      const sb = window.__SANDBOX__;
      const y = sb.cameraOrbit.yaw;
      sb.cameraOrbit.yaw = 0.0;
      sb.step(1 / 60);
      return y;
    });

    // 3. Verify non-walk triggers (removed HUD SkateRoom button & KeyE proximity outside portal) and Holo Edit Mode (KeyG)
    await page.evaluate(() => window.__SANDBOX__.toggleHoloEditMode(true));
    await page.mouse.click(targetScreenCoords.clientX, targetScreenCoords.clientY);
    const editAndKeyECheck = await page.evaluate(() => {
      const sb = window.__SANDBOX__;
      const activeChar = sb.getActiveCharacter();
      const selectedInEditMode = sb.selectedHoloColumnId;
      const popupOpenInEditMode = sb.isPortalPopupOpen || sb.waterColor.isPopupOpen;
      sb.toggleHoloEditMode(false);

      const hudSkateRoomBtnExists = Boolean(document.getElementById('hud-enter-skateroom-btn'));
      const nearPortalAt39_8 = sb.waterColor.isNearPortal(activeChar);
      sb.interactNearestWallMount();
      const popupOpenAfterKeyE = sb.isPortalPopupOpen || sb.waterColor.isPopupOpen;
      return {
        selectedInEditMode,
        popupOpenInEditMode,
        hudSkateRoomBtnExists,
        nearPortalAt39_8,
        popupOpenAfterKeyE,
      };
    });

    const ac01_02_spec055 = {
      ...hoverCheck,
      ...clickCheck,
      isDraggingDuringOrbit,
      yawDelta: Math.abs(yawAfterDrag - yawBeforeDrag),
      ...editAndKeyECheck,
    };

    assert.equal(ac01_02_spec055.hoveredAfterMove, null, 'Hovering watercolor shader outside edit mode must not set hoveredHoloColumnId');
    assert.equal(ac01_02_spec055.hasPointerHoverClass, false, 'Hovering watercolor shader outside edit mode must not set mount-pointer-hover');
    assert.equal(ac01_02_spec055.popupOpenAfterClick, false, 'Clicking watercolor shader in 3D scene must never open the portal popup');
    assert.equal(ac01_02_spec055.popupCountAfterClick, 0, 'popupOpenCount must remain 0 after 3D canvas clicks');
    assert.equal(ac01_02_spec055.isDraggingDuringOrbit, true, 'Pointerdown on watercolor shader must allow camera orbit drag');
    assert.ok(ac01_02_spec055.yawDelta > 0.1, `Expected camera orbit yaw to rotate during drag, got delta=${ac01_02_spec055.yawDelta}`);
    assert.equal(ac01_02_spec055.hudSkateRoomBtnExists, false, 'Legacy #hud-enter-skateroom-btn must be removed');
    assert.equal(ac01_02_spec055.nearPortalAt39_8, true, 'Player at Z=39.8m should be within near-portal radius');
    assert.equal(ac01_02_spec055.popupOpenAfterKeyE, false, 'Pressing KeyE near portal (without walking in) must not open popup');
    assert.equal(ac01_02_spec055.selectedInEditMode, 'watercolor_gallery', 'Holo Edit Mode must still allow selecting watercolor_gallery');
    assert.equal(ac01_02_spec055.popupOpenInEditMode, false, 'Selecting watercolor_gallery in Edit Mode must not open popup');

    // -------------------------------------------------------------------------
    // Spec 048 AC-01 & Spec 055 AC-03 & AC-04: Portal Walk-In Opens Pop-Up
    // (Replacing SkateRoom Auto-Launch) with Holographic Appear Animation
    // -------------------------------------------------------------------------
    console.log('[3/7] Verifying Spec 055 AC-03 & AC-04: Walking into watercolor portal opens popup (no SkateRoom auto-launch) and runs 3D holographic appear animation (opening -> open)...');
    const ac01 = await page.evaluate(() => {
      const sb = window.__SANDBOX__;
      const activeChar = sb.getActiveCharacter();
      // Place character just in front of portal at Z = 41.20m first
      activeChar.position.set(0.13, sb.environment.floorY, 41.20);
      activeChar.root.position.copy(activeChar.position);
      sb.step(1 / 60);

      const beforePopup = sb.waterColor.isPopupOpen;
      const beforeTeleport = sb.waterColor.isTeleporting;
      const stageEl = document.getElementById('portal-game-holo-stage');
      const winEl = document.getElementById('portal-game-holo-window');
      const beforeHoloState = winEl.getAttribute('data-holo-state');

      // Step character into the watercolor portal plane at Z = 42.6182m
      activeChar.position.set(0.1341, sb.environment.floorY, 42.6182);
      activeChar.root.position.copy(activeChar.position);
      const triggered = sb.waterColor.checkWalkThrough(activeChar);
      sb.step(1 / 60);

      const stageCs = window.getComputedStyle(stageEl);
      const winCs = window.getComputedStyle(winEl);
      const cards = Array.from(winEl.querySelectorAll('.portal-game-card'));

      return {
        beforePopup,
        beforeTeleport,
        beforeHoloState,
        triggered,
        afterPopup: sb.waterColor.isPopupOpen,
        isPortalPopupOpen: sb.isPortalPopupOpen,
        afterTeleport: sb.waterColor.isTeleporting,
        teleportCount: sb.waterColor.teleportCount,
        charState: activeChar.state,
        stageActive: stageEl ? stageEl.classList.contains('active') : false,
        winActive: winEl ? winEl.classList.contains('active') : false,
        openingHoloState: winEl.getAttribute('data-holo-state'),
        hasOpeningClass: winEl.classList.contains('holo-opening'),
        stagePerspective: stageCs.perspective,
        winAnimName: winCs.animationName,
        cardStaggerIndices: cards.map((c) => c.style.getPropertyValue('--card-stagger-idx').trim()),
        cardAnimNames: cards.map((c) => window.getComputedStyle(c).animationName),
        telText: document.getElementById('tel-watercolor')?.textContent || '',
      };
    });

    assert.equal(ac01.beforePopup, false);
    assert.equal(ac01.beforeTeleport, false);
    assert.equal(ac01.beforeHoloState, 'dormant');
    assert.equal(ac01.triggered, true, 'checkWalkThrough at Z=42.6182m must return true');
    assert.equal(ac01.afterPopup, true, 'waterColor.isPopupOpen must be true after walk-through');
    assert.equal(ac01.isPortalPopupOpen, true, 'sandbox.isPortalPopupOpen must be true');
    assert.equal(ac01.afterTeleport, false, 'waterColor.isTeleporting must remain false until a game is chosen');
    assert.equal(ac01.teleportCount, 0, 'teleportCount must remain 0 on portal walk-through');
    assert.equal(ac01.stageActive, true, '#portal-game-holo-stage must have .active class');
    assert.equal(ac01.winActive, true, '#portal-game-holo-window must have .active class');
    assert.equal(ac01.openingHoloState, 'opening', 'Popup must enter data-holo-state="opening" on walk-in');
    assert.equal(ac01.hasOpeningClass, true, 'Popup window must have .holo-opening class during appear animation');
    assert.equal(ac01.stagePerspective, '1200px', '#portal-game-holo-stage must establish 1200px 3D perspective');
    assert.ok(
      ac01.winAnimName.includes('holoPortalWindowMaterialize'),
      `Expected holoPortalWindowMaterialize keyframe on open, got ${ac01.winAnimName}`
    );
    assert.deepEqual(ac01.cardStaggerIndices, ['0', '1', '2'], 'Cards must have staggered --card-stagger-idx values');
    assert.ok(
      ac01.cardAnimNames.every((n) => n.includes('holoPortalCardMaterialize')),
      `Expected holoPortalCardMaterialize on cards during opening, got ${JSON.stringify(ac01.cardAnimNames)}`
    );
    assert.ok(ac01.telText.includes('PORTAL POPUP OPEN'), `Unexpected telemetry text: ${ac01.telText}`);

    // Wait for the 320ms holographic appear animation to settle into 'open'
    await page.waitForTimeout(360);
    const settledOpenState = await page.evaluate(() => {
      const stageEl = document.getElementById('portal-game-holo-stage');
      const winEl = document.getElementById('portal-game-holo-window');
      return {
        sandboxAnimState: window.__SANDBOX__.portalPopupAnimState,
        wcAnimState: window.__SANDBOX__.waterColor.popupAnimState,
        stageDataState: stageEl.getAttribute('data-holo-state'),
        winDataState: winEl.getAttribute('data-holo-state'),
        hasOpenClass: winEl.classList.contains('holo-open'),
        hasOpeningClass: winEl.classList.contains('holo-opening'),
      };
    });
    assert.equal(settledOpenState.sandboxAnimState, 'open');
    assert.equal(settledOpenState.wcAnimState, 'open');
    assert.equal(settledOpenState.stageDataState, 'open');
    assert.equal(settledOpenState.winDataState, 'open');
    assert.equal(settledOpenState.hasOpenClass, true);
    assert.equal(settledOpenState.hasOpeningClass, false);

    // -------------------------------------------------------------------------
    // AC-02 & AC-03: Screen-Mount Stylistic Parity & Cropped RGBA Logos
    // -------------------------------------------------------------------------
    console.log('[3/5] Verifying AC-02 & AC-03: Screen-Mount styling parity and cropped RGBA logos (corner alpha == 0)...');
    const ac02_03 = await page.evaluate(async () => {
      const winEl = document.getElementById('portal-game-holo-window');
      const cs = window.getComputedStyle(winEl);
      const topBar = winEl.querySelector('.holo-light-bar.top');
      const bottomBar = winEl.querySelector('.holo-light-bar.bottom');
      const corners = winEl.querySelectorAll('.holo-corner');
      const scanbeam = winEl.querySelector('.holo-scanbeam');

      const imgIds = [
        'portal-header-logo-img',
        'portal-game-logo-skate3',
        'portal-game-logo-gta',
        'portal-game-logo-zombies',
      ];
      const logoChecks = [];
      for (const id of imgIds) {
        const img = document.getElementById(id);
        if (!img) {
          logoChecks.push({ id, missing: true });
          continue;
        }
        if (!img.complete) {
          await new Promise((res, rej) => {
            img.addEventListener('load', res, { once: true });
            img.addEventListener('error', rej, { once: true });
          });
        }
        const w = img.naturalWidth;
        const h = img.naturalHeight;
        const cvs = document.createElement('canvas');
        cvs.width = w;
        cvs.height = h;
        const ctx = cvs.getContext('2d');
        ctx.drawImage(img, 0, 0);
        const tl = ctx.getImageData(0, 0, 1, 1).data[3];
        const tr = ctx.getImageData(w - 1, 0, 1, 1).data[3];
        const bl = ctx.getImageData(0, h - 1, 1, 1).data[3];
        const br = ctx.getImageData(w - 1, h - 1, 1, 1).data[3];
        const rect = img.getBoundingClientRect();
        logoChecks.push({
          id,
          src: img.getAttribute('src'),
          naturalWidth: w,
          naturalHeight: h,
          cornerAlphas: [tl, tr, bl, br],
          renderedWidth: rect.width,
          renderedHeight: rect.height,
        });
      }

      return {
        hasHoloWindowClass: winEl.classList.contains('holo-window'),
        hasMountFocusClass: winEl.classList.contains('mount-focus-active'),
        topBarIgnited: topBar ? topBar.classList.contains('ignited') : false,
        bottomBarIgnited: bottomBar ? bottomBar.classList.contains('ignited') : false,
        cornerCount: corners.length,
        hasScanbeam: Boolean(scanbeam),
        flickerGainVar: winEl.style.getPropertyValue('--holo-flicker-gain'),
        glitchShiftVar: winEl.style.getPropertyValue('--holo-glitch-shift-x'),
        borderColor: cs.borderTopColor,
        logoChecks,
      };
    });

    assert.equal(ac02_03.hasHoloWindowClass, true);
    assert.equal(ac02_03.hasMountFocusClass, true);
    assert.equal(ac02_03.topBarIgnited, true, 'Top .holo-light-bar must be .ignited');
    assert.equal(ac02_03.bottomBarIgnited, true, 'Bottom .holo-light-bar must be .ignited');
    assert.equal(ac02_03.cornerCount, 4, 'Must have 4 .holo-corner brackets');
    assert.equal(ac02_03.hasScanbeam, true, 'Must have .holo-scanbeam sweep');
    assert.ok(Number(ac02_03.flickerGainVar) > 0.5, `Expected live --holo-flicker-gain, got ${ac02_03.flickerGainVar}`);

    for (const chk of ac02_03.logoChecks) {
      assert.ok(!chk.missing, `Logo element #${chk.id} missing`);
      assert.ok(chk.naturalWidth > 200 && chk.naturalHeight > 100, `Logo #${chk.id} invalid dimensions`);
      assert.deepEqual(
        chk.cornerAlphas,
        [0, 0, 0, 0],
        `Logo #${chk.id} (${chk.src}) must have transparent corners [0,0,0,0], got ${JSON.stringify(chk.cornerAlphas)}`
      );
      assert.ok(chk.renderedWidth > 40 && chk.renderedHeight > 30, `Logo #${chk.id} must be visibly rendered`);
    }

    // Save live screenshot of open Portal Game Selector Pop-Up for visual inspection
    const screenshotPath = process.env.PORTAL_POPUP_SCREENSHOT_PATH;
    if (screenshotPath) {
      await page.screenshot({ path: screenshotPath });
      console.log(`  -> Saved live screenshot to ${screenshotPath}`);
    }

    // -------------------------------------------------------------------------
    // Spec 048 AC-05 & Spec 055 AC-05: Dismissal with Holographic Disappear
    // Choreography (closing -> dormant, ~240ms) & Spatial Re-Arm Hysteresis
    // -------------------------------------------------------------------------
    console.log('[5/7] Verifying Spec 055 AC-05: Dismissal via Esc runs holographic disappear animation (closing -> dormant) + 0.85m spatial hysteresis...');
    await page.keyboard.press('Escape');

    const closingPhaseCheck = await page.evaluate(() => {
      const sb = window.__SANDBOX__;
      const stageEl = document.getElementById('portal-game-holo-stage');
      const winEl = document.getElementById('portal-game-holo-window');
      const stageCs = window.getComputedStyle(stageEl);
      const winCs = window.getComputedStyle(winEl);
      return {
        isPortalPopupOpen: sb.isPortalPopupOpen,
        wcIsPopupOpen: sb.waterColor.isPopupOpen,
        disarmedWhileInside: sb.waterColor.walkThroughDisarmedUntilExit,
        sandboxAnimState: sb.portalPopupAnimState,
        wcAnimState: sb.waterColor.popupAnimState,
        stageDataState: stageEl.getAttribute('data-holo-state'),
        winDataState: winEl.getAttribute('data-holo-state'),
        hasClosingClass: winEl.classList.contains('holo-closing'),
        stagePointerEvents: stageCs.pointerEvents,
        stageVisibilityDuringClose: stageCs.visibility,
        winAnimName: winCs.animationName,
      };
    });

    assert.equal(closingPhaseCheck.isPortalPopupOpen, false, 'Logical isPortalPopupOpen must be false immediately on Esc');
    assert.equal(closingPhaseCheck.wcIsPopupOpen, false, 'Logical waterColor.isPopupOpen must be false immediately on Esc');
    assert.equal(closingPhaseCheck.disarmedWhileInside, true, 'walkThroughDisarmedUntilExit must be true immediately on Esc');
    assert.equal(closingPhaseCheck.sandboxAnimState, 'closing', 'sandbox.portalPopupAnimState must enter closing on Esc');
    assert.equal(closingPhaseCheck.wcAnimState, 'closing', 'waterColor.popupAnimState must enter closing on Esc');
    assert.equal(closingPhaseCheck.stageDataState, 'closing');
    assert.equal(closingPhaseCheck.winDataState, 'closing');
    assert.equal(closingPhaseCheck.hasClosingClass, true, '#portal-game-holo-window must have .holo-closing class');
    assert.equal(closingPhaseCheck.stagePointerEvents, 'none', '#portal-game-holo-stage must release pointer events immediately');
    assert.equal(closingPhaseCheck.stageVisibilityDuringClose, 'visible', '#portal-game-holo-stage must remain visible during 240ms collapse animation');
    assert.ok(
      closingPhaseCheck.winAnimName.includes('holoPortalWindowCollapse'),
      `Expected holoPortalWindowCollapse keyframe during closing, got ${closingPhaseCheck.winAnimName}`
    );

    // Wait for the 240ms holographic collapse animation to settle into 'dormant'
    await page.waitForTimeout(280);

    const ac05 = await page.evaluate(() => {
      const sb = window.__SANDBOX__;
      const activeChar = sb.getActiveCharacter();
      const stageEl = document.getElementById('portal-game-holo-stage');
      const winEl = document.getElementById('portal-game-holo-window');
      const stageCs = window.getComputedStyle(stageEl);

      const dormantAfterCollapse =
        sb.portalPopupAnimState === 'dormant' &&
        sb.waterColor.popupAnimState === 'dormant' &&
        stageEl.getAttribute('data-holo-state') === 'dormant' &&
        winEl.getAttribute('data-holo-state') === 'dormant' &&
        !winEl.classList.contains('holo-closing') &&
        stageCs.visibility === 'hidden' &&
        stageEl.getAttribute('aria-hidden') === 'true';

      const closedAfterEsc = !sb.isPortalPopupOpen && !sb.waterColor.isPopupOpen;
      const disarmedWhileInside = sb.waterColor.walkThroughDisarmedUntilExit;

      // Calling checkWalkThrough while still at Z = 42.6182m (|metricZ| = 0 <= 0.85m) must NOT re-open the popup
      const retriggeredInPlace = sb.waterColor.checkWalkThrough(activeChar);
      const stillClosedInPlace = !sb.waterColor.isPopupOpen;

      // Step character outside hysteresis band to Z = 41.20m (|metricZ| ~ 1.42m > 0.85m)
      activeChar.position.set(0.1341, sb.environment.floorY, 41.20);
      activeChar.root.position.copy(activeChar.position);
      sb.waterColor.checkWalkThrough(activeChar);
      const rearmedAfterSteppingBack = !sb.waterColor.walkThroughDisarmedUntilExit;

      // Walk back into portal at Z = 42.6182m -> must open popup again with 'opening' state
      activeChar.position.set(0.1341, sb.environment.floorY, 42.6182);
      activeChar.root.position.copy(activeChar.position);
      const reopenedOnSecondWalkIn = sb.waterColor.checkWalkThrough(activeChar);
      const reopenedAnimState = sb.portalPopupAnimState;

      return {
        dormantAfterCollapse,
        closedAfterEsc,
        disarmedWhileInside,
        retriggeredInPlace,
        stillClosedInPlace,
        rearmedAfterSteppingBack,
        reopenedOnSecondWalkIn,
        reopenedAnimState,
        isPopupOpenNow: sb.waterColor.isPopupOpen,
      };
    });

    assert.equal(ac05.dormantAfterCollapse, true, 'Popup must settle into dormant (visibility: hidden, aria-hidden="true") after 240ms collapse');
    assert.equal(ac05.closedAfterEsc, true, 'Pressing Escape must close the portal game selector popup');
    assert.equal(ac05.disarmedWhileInside, true, 'walkThroughDisarmedUntilExit must be true immediately after closing');
    assert.equal(ac05.retriggeredInPlace, false, 'checkWalkThrough must not re-trigger while still inside aperture');
    assert.equal(ac05.stillClosedInPlace, true, 'Popup must stay closed while standing in aperture after dismissal');
    assert.equal(ac05.rearmedAfterSteppingBack, true, 'Stepping outside |metricZ| > 0.85m must re-arm walkThroughDisarmedUntilExit');
    assert.equal(ac05.reopenedOnSecondWalkIn, true, 'Walking back into portal after re-arming must re-open popup');
    assert.equal(ac05.reopenedAnimState, 'opening', 'Re-walking into portal must trigger opening animation state');
    assert.equal(ac05.isPopupOpenNow, true);

    // Wait for second walk-in opening animation to settle before layout geometry checks
    await page.waitForTimeout(360);

    // -------------------------------------------------------------------------
    // AC-04: Interactive Game Selection & Routing for All 3 Games
    // -------------------------------------------------------------------------
    console.log('[5/5] Verifying AC-04: Interactive selection & launch URL routing for Skate 3, GTA, and Zombies...');
    const ac04 = await page.evaluate(() => {
      const sb = window.__SANDBOX__;
      const results = {};

      for (const gameId of ['skate3', 'gta', 'zombies']) {
        const sel = sb.selectPortalGame(gameId);
        const launched = sb.launchPortalGame(gameId, { navigate: false, force: true });
        const st = sb.waterColor.getState();
        results[gameId] = {
          selectedId: sel ? sel.id : null,
          launched,
          lastLaunchedGameId: st.lastLaunchedGameId,
          portalTargetUrl: st.portalTargetUrl,
          isTeleporting: st.isTeleporting,
        };
      }
      return results;
    });

    assert.equal(ac04.skate3.launched, true);
    assert.equal(ac04.skate3.lastLaunchedGameId, 'skate3');
    assert.equal(ac04.skate3.portalTargetUrl, './skate3_cleanroom/?char=luis');

    assert.equal(ac04.gta.launched, true);
    assert.equal(ac04.gta.lastLaunchedGameId, 'gta');
    assert.equal(ac04.gta.portalTargetUrl, './revcdos/');

    assert.equal(ac04.zombies.launched, true);
    assert.equal(ac04.zombies.lastLaunchedGameId, 'zombies');
    assert.equal(ac04.zombies.portalTargetUrl, './nzportable/');

    // -------------------------------------------------------------------------
    // Spec 053 AC-01, AC-02, AC-03 & AC-04: Minimalist Logo-Only Tiles,
    // Viewport-Agnostic Centering & N-Game Auto-Fitting Grid Packing
    // -------------------------------------------------------------------------
    console.log('[6/6] Verifying Spec 053: Minimalist logo-only cards, multi-viewport containment (1440x900, 768x1024, 390x844, 844x390), and N-game scaling (N=3,4,5,6,9)...');

    const minimalistCheck = await page.evaluate(() => {
      const winEl = document.getElementById('portal-game-holo-window');
      const cards = Array.from(winEl.querySelectorAll('#portal-game-cards-grid .portal-game-card'));
      return {
        cardCount: cards.length,
        cardsMinimalist: cards.every(
          (c) =>
            c.innerText.trim() === '' &&
            c.children.length === 1 &&
            c.firstElementChild &&
            c.firstElementChild.classList.contains('portal-game-logo-img')
        ),
        clutterCount: winEl.querySelectorAll(
          '.portal-game-card-title, .portal-game-card-desc, .portal-game-slot-pill, .portal-game-launch-btn, .holo-pip-btn, .portal-header-sub'
        ).length,
      };
    });
    assert.equal(minimalistCheck.cardCount, 3);
    assert.equal(minimalistCheck.cardsMinimalist, true, 'Every .portal-game-card must contain ONLY its .portal-game-logo-img with zero text');
    assert.equal(minimalistCheck.clutterCount, 0, 'Popup must contain zero title/desc/pill/launch-btn/pip clutter elements');

    const viewports = [
      { name: 'desktop-1440x900', width: 1440, height: 900 },
      { name: 'tablet-768x1024', width: 768, height: 1024 },
      { name: 'mobile-portrait-390x844', width: 390, height: 844 },
      { name: 'mobile-landscape-844x390', width: 844, height: 390 },
    ];

    for (const vp of viewports) {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      const vpMetrics = await page.evaluate(() => {
        const sb = window.__SANDBOX__;
        sb.openPortalGameSelectorPopup({ force: true, silent: true });
        const winEl = document.getElementById('portal-game-holo-window');
        const winRect = winEl.getBoundingClientRect();
        const cards = Array.from(winEl.querySelectorAll('#portal-game-cards-grid .portal-game-card'));
        const cardRects = cards.map((c) => {
          const r = c.getBoundingClientRect();
          const img = c.querySelector('.portal-game-logo-img');
          const ir = img.getBoundingClientRect();
          const natAr = img.naturalWidth / img.naturalHeight;
          const renAr = ir.width / ir.height;
          return {
            width: r.width,
            height: r.height,
            insideWin:
              r.left >= winRect.left - 1 &&
              r.right <= winRect.right + 1 &&
              r.top >= winRect.top - 1 &&
              r.bottom <= winRect.bottom + 1,
            arRelErr: Math.abs(renAr - natAr) / natAr,
          };
        });
        return {
          vpW: window.innerWidth,
          vpH: window.innerHeight,
          winRect: {
            left: winRect.left,
            right: winRect.right,
            top: winRect.top,
            bottom: winRect.bottom,
            width: winRect.width,
            height: winRect.height,
            centerX: winRect.left + winRect.width / 2,
          },
          scrollW: winEl.scrollWidth,
          clientW: winEl.clientWidth,
          scrollH: winEl.scrollHeight,
          clientH: winEl.clientHeight,
          cardRects,
        };
      });

      assert.ok(
        Math.abs(vpMetrics.winRect.centerX - vp.width / 2) <= 8,
        `${vp.name}: #portal-game-holo-window must be horizontally centered (centerX=${vpMetrics.winRect.centerX}, expected=${vp.width / 2})`
      );
      assert.ok(
        vpMetrics.winRect.left >= 8 &&
          vpMetrics.winRect.top >= 8 &&
          vpMetrics.winRect.right <= vp.width - 8 &&
          vpMetrics.winRect.bottom <= vp.height - 8,
        `${vp.name}: #portal-game-holo-window must fit inside viewport safe bounds: ${JSON.stringify(vpMetrics.winRect)}`
      );
      assert.ok(
        vpMetrics.scrollH <= vpMetrics.clientH + 1 && vpMetrics.scrollW <= vpMetrics.clientW + 1,
        `${vp.name}: #portal-game-holo-window must have zero internal scroll clipping (scroll=${vpMetrics.scrollW}x${vpMetrics.scrollH}, client=${vpMetrics.clientW}x${vpMetrics.clientH})`
      );
      for (const cr of vpMetrics.cardRects) {
        assert.equal(cr.insideWin, true, `${vp.name}: every logo tile must lie inside #portal-game-holo-window`);
        assert.ok(cr.arRelErr <= 0.025, `${vp.name}: logo aspect ratio error ${cr.arRelErr} exceeds 2.5%`);
      }
    }

    // Verify N-game scalability (N = 3, 4, 5, 6, 9) across Desktop (1440x900) and Mobile Portrait (390x844)
    for (const vp of [
      { name: 'desktop-1440x900', width: 1440, height: 900, minW: 110, minH: 85 },
      { name: 'mobile-portrait-390x844', width: 390, height: 844, minW: 56, minH: 44 },
    ]) {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      for (const nGames of [3, 4, 5, 6, 9]) {
        const scaleCheck = await page.evaluate((count) => {
          const sb = window.__SANDBOX__;
          const base = sb.PORTAL_GAME_CATALOG || sb.waterColor.availableGames;
          const synthetic = [];
          for (let i = 0; i < count; i++) {
            const template = base[i % 3];
            synthetic.push({
              ...template,
              id: i < 3 ? template.id : `game_extra_${i + 1}`,
              slot: i + 1,
              hotkey: String(i + 1),
              title: `${template.title} #${i + 1}`,
            });
          }
          sb.setPortalGameCatalog(synthetic);
          const winEl = document.getElementById('portal-game-holo-window');
          const winRect = winEl.getBoundingClientRect();
          const cards = Array.from(winEl.querySelectorAll('#portal-game-cards-grid .portal-game-card'));
          return {
            renderedCount: cards.length,
            layout: sb.portalGridLayout,
            scrollH: winEl.scrollHeight,
            clientH: winEl.clientHeight,
            scrollW: winEl.scrollWidth,
            clientW: winEl.clientWidth,
            winInsideViewport:
              winRect.left >= 8 &&
              winRect.top >= 8 &&
              winRect.right <= window.innerWidth - 8 &&
              winRect.bottom <= window.innerHeight - 8,
            allCardsInsideWin: cards.every((c) => {
              const r = c.getBoundingClientRect();
              return (
                r.left >= winRect.left - 1 &&
                r.right <= winRect.right + 1 &&
                r.top >= winRect.top - 1 &&
                r.bottom <= winRect.bottom + 1
              );
            }),
            minCardW: Math.min(...cards.map((c) => c.getBoundingClientRect().width)),
            minCardH: Math.min(...cards.map((c) => c.getBoundingClientRect().height)),
          };
        }, nGames);

        assert.equal(scaleCheck.renderedCount, nGames, `${vp.name} N=${nGames}: must render ${nGames} logo tiles`);
        assert.equal(scaleCheck.winInsideViewport, true, `${vp.name} N=${nGames}: window must stay inside viewport`);
        assert.equal(scaleCheck.allCardsInsideWin, true, `${vp.name} N=${nGames}: all ${nGames} cards must fit inside window`);
        assert.ok(
          scaleCheck.scrollH <= scaleCheck.clientH + 1 && scaleCheck.scrollW <= scaleCheck.clientW + 1,
          `${vp.name} N=${nGames}: must not overflow window (scroll=${scaleCheck.scrollW}x${scaleCheck.scrollH}, client=${scaleCheck.clientW}x${scaleCheck.clientH})`
        );
        assert.ok(
          scaleCheck.minCardW >= vp.minW && scaleCheck.minCardH >= vp.minH,
          `${vp.name} N=${nGames}: card dimensions (${scaleCheck.minCardW}x${scaleCheck.minCardH}) below minimum (${vp.minW}x${vp.minH})`
        );
      }
    }

    // Restore default 3-game catalog and desktop viewport
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.evaluate(() => {
      const sb = window.__SANDBOX__;
      sb.setPortalGameCatalog(null);
    });

    assert.equal(pageErrors.length, 0, `Unexpected page errors: ${pageErrors.join('; ')}`);
    console.log('ALL SPEC 048 & SPEC 053 E2E BROWSER CHECKS PASSED!');
  } finally {
    await browser.close();
    server.close();
  }
}

runTests().catch((err) => {
  console.error(err);
  process.exit(1);
});
