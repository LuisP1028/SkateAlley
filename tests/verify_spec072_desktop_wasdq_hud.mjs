/**
 * End-to-End Live WebGL & DOM Verification Suite for Functional Specification 072:
 * Screen-Agnostic Bottom-Right Desktop WASD + Q Navigation HUD,
 * Post-Dialogue Forced One-Time Key Intro, and Strict Mobile Analog-Stick Exclusivity.
 */

import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..');

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

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.glb': 'model/gltf-binary',
  '.gltf': 'model/gltf+json',
  '.hdr': 'application/octet-stream',
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
  '.ogg': 'audio/ogg',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.wasm': 'application/wasm',
};

function startStaticServer(rootDir) {
  return new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      try {
        const parsedUrl = new URL(req.url || '/', 'http://127.0.0.1');
        let relPath = decodeURIComponent(parsedUrl.pathname);
        if (relPath === '/') relPath = '/index.html';
        const safePath = path.normalize(path.join(rootDir, relPath));
        if (!safePath.startsWith(rootDir)) {
          res.writeHead(403);
          res.end('Forbidden');
          return;
        }
        if (!fs.existsSync(safePath) || fs.statSync(safePath).isDirectory()) {
          res.writeHead(404);
          res.end('Not found');
          return;
        }
        const stat = fs.statSync(safePath);
        const ext = path.extname(safePath).toLowerCase();
        const contentType = MIME_TYPES[ext] || 'application/octet-stream';
        const range = req.headers.range;
        if (range) {
          const match = /bytes=(\d*)-(\d*)/.exec(range);
          const start = match && match[1] ? parseInt(match[1], 10) : 0;
          const end = match && match[2] ? parseInt(match[2], 10) : stat.size - 1;
          const clampedStart = Math.min(start, Math.max(0, stat.size - 1));
          const clampedEnd = Math.min(end, Math.max(0, stat.size - 1));
          res.writeHead(206, {
            'Content-Range': `bytes ${clampedStart}-${clampedEnd}/${stat.size}`,
            'Accept-Ranges': 'bytes',
            'Content-Length': clampedEnd - clampedStart + 1,
            'Content-Type': contentType,
            'Cache-Control': 'no-store',
          });
          fs.createReadStream(safePath, { start: clampedStart, end: clampedEnd }).pipe(res);
          return;
        }
        res.writeHead(200, {
          'Content-Length': stat.size,
          'Accept-Ranges': 'bytes',
          'Content-Type': contentType,
          'Cache-Control': 'no-store',
        });
        fs.createReadStream(safePath).pipe(res);
      } catch (err) {
        res.writeHead(500);
        res.end(String(err));
      }
    });
    server.on('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const addr = server.address();
      resolve({
        server,
        baseUrl: `http://127.0.0.1:${addr.port}`,
      });
    });
  });
}

function rectOverlapArea(a, b) {
  if (!a || !b) return 0;
  const xOverlap = Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left));
  const yOverlap = Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top));
  return xOverlap * yOverlap;
}

const { chromium } = loadPlaywright();

async function advanceIntroToFinalCard(page) {
  await page.evaluate(() => {
    const sb = window.__sandbox;
    if (sb.skipSprayPaintIntro) sb.skipSprayPaintIntro();
    // Finish camera pan cleanly into Card 01 of dialogue-active
    if (sb.director && sb.director.cameraPanState && sb.director.cameraPanState.mode === 'playing') {
      const dur = Number(sb.director.cameraPanState.durationSec) || 5.0;
      sb.step(dur + 0.25);
    }
  });
  await page.waitForFunction(
    () =>
      window.__sandbox &&
      window.__sandbox.director &&
      window.__sandbox.director.introSequenceState.phase === 'dialogue-active',
    { timeout: 10000 }
  );

  // Step through Cards 01..06 via real clicks on #intro-dialogue-next-btn
  for (let guard = 0; guard < 10; guard++) {
    const onFinalQuestion = await page.evaluate(() => {
      const st = window.__sandbox.director.introSequenceState;
      const box = st.boxes[st.currentBoxIndex];
      return Boolean((box && box.requires_question_prompt) || st.currentBoxIndex + 1 >= st.boxes.length);
    });
    if (onFinalQuestion) break;
    await page.click('#intro-dialogue-next-btn');
    await page.evaluate(() => window.__sandbox.step(1 / 60));
  }
}

async function runVerification() {
  console.log('========================================================================');
  console.log('SPEC 072: DESKTOP WASD+Q HUD, FORCED KEY INTRO & MOBILE XOR EXCLUSIVITY');
  console.log('========================================================================');

  const { server, baseUrl } = await startStaticServer(PROJECT_ROOT);
  const browser = await chromium.launch({
    headless: true,
    args: ['--use-gl=angle', '--use-angle=metal'],
  });

  const pageErrors = [];
  const consoleErrors = [];

  const attachErrorListeners = (page, label) => {
    page.on('pageerror', (err) => {
      console.error(`  [${label} PageError]`, err.message);
      pageErrors.push(`[${label}] ${err.message}`);
    });
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        const text = msg.text();
        const locUrl = (msg.location && msg.location().url) || '';
        const isOptionalBackendProbe404 =
          text.includes('404') &&
          (locUrl.includes('favicon') ||
            locUrl.includes('tunnel.json') ||
            locUrl.includes('/api/'));
        if (!text.includes('favicon') && !isOptionalBackendProbe404) {
          consoleErrors.push(`[${label}] ${text}${locUrl ? ` (${locUrl})` : ''}`);
        }
      }
    });
  };

  try {
    // =========================================================================
    // GATE 1 & 2 & 3: Desktop Pre-Dialogue Dormancy, Post-Dialogue Ignition,
    // CLS = 0.000, Multi-Aspect Geometry, and Forced 5-Key Calibration
    // =========================================================================
    console.log('\n[Gate 1] Verifying Desktop Pre-Dialogue Dormancy (pan-playing & Cards 01..07)...');
    const desktopContext = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      deviceScaleFactor: 2,
      hasTouch: false,
      isMobile: false,
    });
    const page = await desktopContext.newPage();
    attachErrorListeners(page, 'desktop-main');

    await page.goto(`${baseUrl}/index.html`, {
      waitUntil: 'domcontentloaded',
      timeout: 30000,
    });
    await page.waitForFunction(
      () => window.__sandbox && window.__sandbox.ready && window.__sandbox.portfolioHUD,
      { timeout: 30000 }
    );

    // Check dormancy during pan-playing
    const panDormancy = await page.evaluate(() => {
      const sb = window.__sandbox;
      if (sb.skipSprayPaintIntro) sb.skipSprayPaintIntro();
      sb.step(0.05);
      const hudCs = getComputedStyle(document.getElementById('portfolio-perimeter-hud'));
      const brCs = getComputedStyle(document.getElementById('portfolio-hud-desktop-controls'));
      const introCs = getComputedStyle(document.getElementById('desktop-wasdq-intro-overlay'));
      return {
        phase: sb.director.introSequenceState.phase,
        hudOpacity: hudCs.opacity,
        hudVisibility: hudCs.visibility,
        brOpacity: brCs.opacity,
        brVisibility: brCs.visibility,
        introOpacity: introCs.opacity,
        introVisibility: introCs.visibility,
        navState: sb.portfolioHUD.getDesktopNavState(),
      };
    });
    assert.equal(panDormancy.hudOpacity, '0', 'Perimeter HUD must be opacity 0 during pan-playing');
    assert.equal(panDormancy.brOpacity, '0', 'Desktop WASD+Q HUD must be opacity 0 during pan-playing');
    assert.equal(panDormancy.brVisibility, 'hidden', 'Desktop WASD+Q HUD must be hidden during pan-playing');
    assert.equal(panDormancy.introOpacity, '0', 'Forced Key Intro must be opacity 0 during pan-playing');
    assert.equal(panDormancy.introVisibility, 'hidden', 'Forced Key Intro must be hidden during pan-playing');
    assert.equal(panDormancy.navState.isMobileMode, false, '1440x900 desktop must not be in mobile mode');

    await advanceIntroToFinalCard(page);

    // Verify dormancy on Card 07 AND verify Q / W presses during dialogue do not leak
    await page.keyboard.press('KeyQ');
    await page.keyboard.press('KeyW');
    const card07Dormancy = await page.evaluate(() => {
      const sb = window.__sandbox;
      sb.step(1 / 60);
      const brCs = getComputedStyle(document.getElementById('portfolio-hud-desktop-controls'));
      const introCs = getComputedStyle(document.getElementById('desktop-wasdq-intro-overlay'));
      return {
        phase: sb.director.introSequenceState.phase,
        radialOpen: sb.radialMenu.isOpen(),
        brOpacity: brCs.opacity,
        brVisibility: brCs.visibility,
        introOpacity: introCs.opacity,
        introVisibility: introCs.visibility,
        navState: sb.portfolioHUD.getDesktopNavState(),
      };
    });
    assert.equal(card07Dormancy.phase, 'dialogue-active');
    assert.equal(card07Dormancy.radialOpen, false, 'Q must not open Radial Menu while startup dialogue is active');
    assert.equal(card07Dormancy.brVisibility, 'hidden');
    assert.equal(card07Dormancy.introVisibility, 'hidden');
    assert.equal(card07Dormancy.navState.completedCount, 0, 'Keys pressed during startup dialogue must not count');
    console.log('  [PASS] Pre-dialogue dormancy & input isolation verified across pan-playing and Cards 01..07.');

    // Gate 2: Click NO on Card 07 -> Post-Dialogue Desktop Ignition, CLS = 0.000 & Multi-Aspect Geometry
    console.log('\n[Gate 2] Verifying Post-Dialogue Ignition, Aesthetic Parity, CLS = 0.000 & Screen-Agnostic Layout...');
    await page.click('#intro-dialogue-no-btn');

    // Wait for stagger timers (95ms intro, 165ms bottom-right) to enter active flicker-on + scramble
    await page.waitForTimeout(210);
    const scrambleSnapshot = await page.evaluate(() => {
      const sb = window.__sandbox;
      sb.step(1 / 60);
      const rectOf = (id) => {
        const el = document.getElementById(id);
        const r = el.getBoundingClientRect();
        return { width: r.width, height: r.height, left: r.left, top: r.top, right: r.right, bottom: r.bottom };
      };
      return {
        navState: sb.portfolioHUD.getDesktopNavState(),
        hudState: sb.portfolioHUD.getState(),
        rects: {
          brControls: rectOf('portfolio-hud-desktop-controls'),
          introCard: rectOf('desktop-wasdq-intro-card'),
          brKeyW: rectOf('hud-br-key-w'),
          brKeyQ: rectOf('hud-br-key-q'),
          introKeyW: rectOf('hud-intro-key-w'),
          introCounter: rectOf('desktop-wasdq-intro-counter'),
        },
      };
    });

    assert.equal(scrambleSnapshot.navState.desktopIntroPhase, 'active', 'Key Intro must enter active phase immediately post-dialogue');
    assert.equal(scrambleSnapshot.navState.isGating, true, 'Key Intro must gate passive navigation immediately post-dialogue');
    assert.ok(scrambleSnapshot.navState.desktopControlsFlickerPlayedCount >= 1, 'Bottom-right WASD+Q HUD must play CRT Phosphor Flicker-On');
    assert.ok(scrambleSnapshot.navState.desktopIntroFlickerPlayedCount >= 1, 'Key Intro card must play CRT Phosphor Flicker-On');

    // Advance clock/frames so both flicker (530ms) and Cipher Decode (780ms) settle completely
    await page.waitForTimeout(650);
    const settledSnapshot = await page.evaluate(() => {
      const sb = window.__sandbox;
      for (let i = 0; i < 65; i++) sb.step(1 / 60);
      const rectOf = (id) => {
        const el = document.getElementById(id);
        const r = el.getBoundingClientRect();
        return { width: r.width, height: r.height, left: r.left, top: r.top, right: r.right, bottom: r.bottom };
      };
      const brEl = document.getElementById('portfolio-hud-desktop-controls');
      const introCardEl = document.getElementById('desktop-wasdq-intro-card');
      const navActionsEl = document.getElementById('mobile-touch-actions');
      const counterEl = document.getElementById('desktop-wasdq-intro-counter');
      const brCs = getComputedStyle(brEl);
      const introCs = getComputedStyle(introCardEl);
      const navCs = getComputedStyle(navActionsEl);
      const counterCs = getComputedStyle(counterEl);
      const mobileControlsCs = getComputedStyle(document.getElementById('mobile-touch-controls'));

      return {
        navState: sb.portfolioHUD.getDesktopNavState(),
        mobileControlsDisplay: mobileControlsCs.display,
        brOpacity: brCs.opacity,
        brVisibility: brCs.visibility,
        brBorderColor: brCs.borderTopColor,
        navBorderColor: navCs.borderTopColor,
        introOpacity: introCs.opacity,
        introVisibility: introCs.visibility,
        introBorderColor: introCs.borderTopColor,
        counterFontVariantNumeric: counterCs.fontVariantNumeric,
        promptText: document.getElementById('desktop-wasdq-intro-prompt').textContent,
        counterText: counterEl.textContent,
        brMoveText: document.getElementById('hud-br-move-label').textContent,
        brMenuText: document.getElementById('hud-br-menu-label').textContent,
        rects: {
          brControls: rectOf('portfolio-hud-desktop-controls'),
          introCard: rectOf('desktop-wasdq-intro-card'),
          brKeyW: rectOf('hud-br-key-w'),
          brKeyQ: rectOf('hud-br-key-q'),
          introKeyW: rectOf('hud-intro-key-w'),
          introCounter: rectOf('desktop-wasdq-intro-counter'),
          mp3Hud: rectOf('doom-tracks-mp3-hud'),
          topLeft: rectOf('portfolio-hud-top-left'),
          topCenter: rectOf('portfolio-hud-top-center'),
        },
      };
    });

    assert.equal(settledSnapshot.mobileControlsDisplay, 'none', 'Mobile analog sticks must remain display:none on desktop');
    assert.equal(settledSnapshot.brOpacity, '1');
    assert.equal(settledSnapshot.brVisibility, 'visible');
    assert.equal(settledSnapshot.introOpacity, '1');
    assert.equal(settledSnapshot.introVisibility, 'visible');
    assert.equal(settledSnapshot.navState.desktopControlsFlickerState, 'settled');
    assert.equal(settledSnapshot.navState.desktopIntroFlickerState, 'settled');
    assert.equal(settledSnapshot.promptText, 'CALIBRATE CONTROLS // PRESS EACH KEY');
    assert.equal(settledSnapshot.counterText, '00 / 05');
    assert.equal(settledSnapshot.brMoveText, 'MOVE');
    assert.equal(settledSnapshot.brMenuText, 'MENU');
    assert.ok(
      settledSnapshot.counterFontVariantNumeric.includes('tabular-nums'),
      `Counter must enforce tabular-nums, got ${settledSnapshot.counterFontVariantNumeric}`
    );

    // Zero-Jitter CLS = 0.000 verification (<= 0.5px width/height delta between scramble/flicker and settled)
    for (const key of ['brControls', 'introCard', 'brKeyW', 'brKeyQ', 'introKeyW', 'introCounter']) {
      const dw = Math.abs(settledSnapshot.rects[key].width - scrambleSnapshot.rects[key].width);
      const dh = Math.abs(settledSnapshot.rects[key].height - scrambleSnapshot.rects[key].height);
      assert.ok(
        dw <= 0.5 && dh <= 0.5,
        `Zero-jitter breach on ${key}: deltaWidth=${dw.toFixed(3)}px, deltaHeight=${dh.toFixed(3)}px`
      );
    }

    // Check screen-agnostic multi-aspect layout across 1440x900, 1280x720, 2560x1080, and 920x540
    const desktopViewports = [
      { width: 1280, height: 720 },
      { width: 2560, height: 1080 },
      { width: 920, height: 540 },
      { width: 1440, height: 900 },
    ];
    for (const vp of desktopViewports) {
      await page.setViewportSize(vp);
      await page.evaluate(() => window.__sandbox.step(1 / 60));
      const layout = await page.evaluate(() => {
        const rectOf = (id) => {
          const r = document.getElementById(id).getBoundingClientRect();
          return { width: r.width, height: r.height, left: r.left, top: r.top, right: r.right, bottom: r.bottom };
        };
        return {
          vw: window.innerWidth,
          vh: window.innerHeight,
          isMobile: window.__sandbox.portfolioHUD.getDesktopNavState().isMobileMode,
          br: rectOf('portfolio-hud-desktop-controls'),
          intro: rectOf('desktop-wasdq-intro-card'),
          mp3: rectOf('doom-tracks-mp3-hud'),
          topCenter: rectOf('portfolio-hud-top-center'),
          topLeft: rectOf('portfolio-hud-top-left'),
        };
      });
      assert.equal(layout.isMobile, false, `Desktop viewport ${vp.width}x${vp.height} must remain in desktop mode`);
      assert.ok(layout.br.left > layout.vw * 0.5, `WASD+Q HUD must sit in right half on ${vp.width}x${vp.height}`);
      assert.ok(layout.br.top > layout.vh * 0.5, `WASD+Q HUD must sit in bottom half on ${vp.width}x${vp.height}`);
      assert.ok(layout.br.right <= layout.vw - 10, `WASD+Q HUD must stay inside right safe margin on ${vp.width}x${vp.height}`);
      assert.ok(layout.br.bottom <= layout.vh - 10, `WASD+Q HUD must stay inside bottom safe margin on ${vp.width}x${vp.height}`);
      assert.equal(rectOverlapArea(layout.br, layout.mp3), 0, `0 overlap between WASD+Q HUD and MP3 HUD on ${vp.width}x${vp.height}`);
      assert.equal(rectOverlapArea(layout.br, layout.topCenter), 0, `0 overlap between WASD+Q HUD and top-center nav on ${vp.width}x${vp.height}`);
      assert.equal(rectOverlapArea(layout.br, layout.intro), 0, `0 overlap between WASD+Q HUD and Key Intro card on ${vp.width}x${vp.height}`);
      assert.equal(rectOverlapArea(layout.intro, layout.mp3), 0, `0 overlap between Key Intro card and MP3 HUD on ${vp.width}x${vp.height}`);
    }
    console.log('  [PASS] Post-dialogue ignition, CLS = 0.000, and 0 px² overlap verified across 1280x720, 1440x900, 2560x1080 & 920x540.');

    // =========================================================================
    // GATE 3: Forced One-Time WASD + Q Calibration & Order-Independent Completion
    // =========================================================================
    console.log('\n[Gate 3] Verifying Forced Gating, Radial Menu Coexistence, Locomotion & Order-Independent Completion...');

    // 3a. Verify passive wheel scroll, WORKS click, CHAT click, ArrowUp, and Cmd+W are gated/ignored
    await page.mouse.wheel(0, 520);
    await page.click('#mobile-action-interact-btn');
    await page.click('#portfolio-hud-chat-btn');
    await page.keyboard.press('ArrowUp');
    await page.keyboard.down('Meta');
    await page.keyboard.press('KeyW');
    await page.keyboard.up('Meta');

    const preCalibrationGateCheck = await page.evaluate(() => {
      const sb = window.__sandbox;
      sb.step(1 / 60);
      return {
        mode: sb.mode,
        scrollProgress: sb.scrollProgress,
        isDoomChatOpen: sb.isDoomChatOpen,
        hasNudgeClass: document.getElementById('desktop-wasdq-intro-card').classList.contains('gate-nudge'),
        navState: sb.portfolioHUD.getDesktopNavState(),
      };
    });
    assert.equal(preCalibrationGateCheck.mode, 'scroll', 'Passive scroll, ArrowUp, WORKS, and Meta+W must not exit scroll mode before WASD');
    assert.equal(preCalibrationGateCheck.scrollProgress, 0, 'Wheel scroll must remain locked at 0.0 during Key Intro gating');
    assert.equal(preCalibrationGateCheck.isDoomChatOpen, false, 'CHAT button must be gated during Key Intro');
    assert.equal(preCalibrationGateCheck.hasNudgeClass, true, 'Gated actions must pulse gate-nudge on Key Intro card');
    assert.equal(preCalibrationGateCheck.navState.completedCount, 0, 'Modifier shortcuts & arrows must leave completedCount at 0');

    // 3b. Press Q FIRST -> opens Radial Menu AND marks Q verified (1 / 5)
    await page.keyboard.press('KeyQ');
    const afterQ = await page.evaluate(() => {
      const sb = window.__sandbox;
      for (let i = 0; i < 25; i++) sb.step(1 / 60);
      const introCardRect = document.getElementById('desktop-wasdq-intro-card').getBoundingClientRect();
      const radialSvgEl = document.getElementById('cyber-radial-svg') || document.querySelector('#cyber-radial-menu-overlay svg');
      const radialRect = radialSvgEl ? radialSvgEl.getBoundingClientRect() : null;
      return {
        radialOpen: sb.radialMenu.isOpen(),
        navState: sb.portfolioHUD.getDesktopNavState(),
        counterText: document.getElementById('desktop-wasdq-intro-counter').textContent,
        introQVerified: document.getElementById('hud-intro-key-q').classList.contains('is-verified'),
        brQActivePill: document.getElementById('hud-br-key-q').classList.contains('active-pill'),
        introCardZIndex: getComputedStyle(document.getElementById('desktop-wasdq-intro-overlay')).zIndex,
        radialOverlayZIndex: getComputedStyle(document.getElementById('cyber-radial-menu-overlay')).zIndex,
        introCardRect: {
          left: introCardRect.left,
          top: introCardRect.top,
          right: introCardRect.right,
          bottom: introCardRect.bottom,
        },
        radialRect: radialRect
          ? { left: radialRect.left, top: radialRect.top, right: radialRect.right, bottom: radialRect.bottom }
          : null,
      };
    });
    assert.equal(afterQ.radialOpen, true, 'Pressing Q during Key Intro must open the Radial Menu');
    assert.equal(afterQ.navState.completedCount, 1, 'Pressing Q must verify Q (1/5)');
    assert.equal(afterQ.counterText, '01 / 05');
    assert.equal(afterQ.introQVerified, true);
    assert.equal(afterQ.brQActivePill, true, 'Bottom-right Q keycap must show active-pill while Radial Menu is open');
    assert.ok(
      Number(afterQ.introCardZIndex) > Number(afterQ.radialOverlayZIndex),
      `Key Intro overlay z-index (${afterQ.introCardZIndex}) must sit above Radial Menu overlay (${afterQ.radialOverlayZIndex})`
    );
    if (afterQ.radialRect) {
      assert.equal(
        rectOverlapArea(afterQ.introCardRect, afterQ.radialRect),
        0,
        'Key Intro card must not overlap the centered Radial Menu SVG wheel'
      );
    }

    // 3c. Press W while Radial Menu is open -> automatically closes Radial Menu, enters Free-Roam, moves Luis, marks W (2 / 5)
    const posBeforeW = await page.evaluate(() => {
      const ch = window.__sandbox.getActiveCharacter();
      return { x: ch.root.position.x, y: ch.root.position.y, z: ch.root.position.z };
    });

    await page.keyboard.down('KeyW');
    const duringWHold = await page.evaluate(() => {
      const sb = window.__sandbox;
      for (let i = 0; i < 20; i++) sb.step(1 / 60);
      const ch = sb.getActiveCharacter();
      return {
        radialOpen: sb.radialMenu.isOpen(),
        mode: sb.mode,
        brWActive: document.getElementById('hud-br-key-w').classList.contains('active-pill'),
        brQActive: document.getElementById('hud-br-key-q').classList.contains('active-pill'),
        pos: { x: ch.root.position.x, y: ch.root.position.y, z: ch.root.position.z },
        navState: sb.portfolioHUD.getDesktopNavState(),
      };
    });
    await page.keyboard.up('KeyW');
    const afterWUp = await page.evaluate(() => {
      window.__sandbox.step(1 / 60);
      return {
        brWActive: document.getElementById('hud-br-key-w').classList.contains('active-pill'),
        counterText: document.getElementById('desktop-wasdq-intro-counter').textContent,
      };
    });

    const distMovedW = Math.hypot(
      duringWHold.pos.x - posBeforeW.x,
      duringWHold.pos.z - posBeforeW.z
    );
    assert.equal(duringWHold.radialOpen, false, 'Pressing W while Radial Menu is open must automatically close Radial Menu');
    assert.equal(duringWHold.mode, 'freeroam', 'Pressing W must enter freeroam mode');
    assert.ok(distMovedW > 0.05, `Pressing W must physically move Luis in 3D space (moved ${distMovedW.toFixed(3)}m)`);
    assert.equal(duringWHold.brWActive, true, 'Bottom-right W keycap must highlight while W is held');
    assert.equal(duringWHold.brQActive, false, 'Bottom-right Q keycap must clear active-pill once Radial Menu closes');
    assert.equal(afterWUp.brWActive, false, 'Bottom-right W keycap must clear active-pill on keyup');
    assert.equal(duringWHold.navState.completedCount, 2);
    assert.equal(afterWUp.counterText, '02 / 05');

    // 3d. Idempotence check: press W again -> stays 02 / 05
    await page.keyboard.press('KeyW');
    const afterDuplicateW = await page.evaluate(() => {
      window.__sandbox.step(1 / 60);
      return window.__sandbox.portfolioHUD.getDesktopNavState();
    });
    assert.equal(afterDuplicateW.completedCount, 2, 'Duplicate W press must be idempotent (stays 2/5)');

    // 3e. Press A and S -> advances to 03 / 05 and 04 / 05; test window blur mid-hold!
    await page.keyboard.down('KeyA');
    const blurTest = await page.evaluate(() => {
      const sb = window.__sandbox;
      sb.step(1 / 60);
      const activeBeforeBlur = document.getElementById('hud-br-key-a').classList.contains('active-pill');
      window.dispatchEvent(new Event('blur'));
      sb.step(1 / 60);
      const activeAfterBlur = document.getElementById('hud-br-key-a').classList.contains('active-pill');
      return {
        activeBeforeBlur,
        activeAfterBlur,
        keyAPressedState: sb.keysPressed.KeyA,
        navState: sb.portfolioHUD.getDesktopNavState(),
      };
    });
    await page.keyboard.up('KeyA');
    assert.equal(blurTest.activeBeforeBlur, true);
    assert.equal(blurTest.activeAfterBlur, false, 'Window blur must clear stuck live key highlights');
    assert.equal(blurTest.keyAPressedState, false, 'Window blur must clear keysPressed.KeyA');
    assert.equal(blurTest.navState.completedCount, 3, 'Window blur must preserve verifiedKeys progress (3/5)');

    await page.keyboard.press('KeyS');
    const afterS = await page.evaluate(() => {
      for (let i = 0; i < 20; i++) window.__sandbox.step(1 / 60);
      return {
        navState: window.__sandbox.portfolioHUD.getDesktopNavState(),
        counterText: document.getElementById('desktop-wasdq-intro-counter').textContent,
      };
    });
    assert.equal(afterS.navState.completedCount, 4);
    assert.equal(afterS.navState.isGating, true, 'Must still gate at 4/5 keys');
    assert.equal(afterS.counterText, '04 / 05');

    // 3f. Complete the 5th key (D) by clicking the rendered #hud-intro-key-d keycap!
    const posBeforeDClick = await page.evaluate(() => {
      const ch = window.__sandbox.getActiveCharacter();
      return { x: ch.root.position.x, z: ch.root.position.z };
    });
    await page.click('#hud-intro-key-d');

    const immediateCompletion = await page.evaluate(() => {
      const sb = window.__sandbox;
      // Step 12 frames (~200ms) so directional step impulse moves Luis right & cipher decode advances
      for (let i = 0; i < 25; i++) sb.step(1 / 60);
      const ch = sb.getActiveCharacter();
      return {
        navState: sb.portfolioHUD.getDesktopNavState(),
        pos: { x: ch.root.position.x, z: ch.root.position.z },
        promptText: document.getElementById('desktop-wasdq-intro-prompt').textContent,
        counterText: document.getElementById('desktop-wasdq-intro-counter').textContent,
        bodyHasIntroGateClass: document.body.classList.contains('desktop-key-intro-active'),
      };
    });
    const distMovedDClick = Math.hypot(
      immediateCompletion.pos.x - posBeforeDClick.x,
      immediateCompletion.pos.z - posBeforeDClick.z
    );
    assert.equal(immediateCompletion.navState.completedCount, 5, 'Clicking #hud-intro-key-d must complete 5/5');
    assert.equal(immediateCompletion.navState.isGating, false, 'Input gating must release immediately (0ms delay) upon 5/5');
    assert.equal(immediateCompletion.bodyHasIntroGateClass, false);
    assert.ok(distMovedDClick > 0.02, `Pointer-clicking D keycap must trigger live rightward step impulse (moved ${distMovedDClick.toFixed(3)}m)`);
    assert.equal(immediateCompletion.promptText, 'NAVIGATION ONLINE // READY');
    assert.equal(immediateCompletion.counterText, '05 / 05');

    // Wait for 420ms hold + 265ms dissolve-out to finish
    await page.waitForTimeout(780);
    const postDissolve = await page.evaluate(() => {
      const sb = window.__sandbox;
      sb.step(1 / 60);
      const introOverlayCs = getComputedStyle(document.getElementById('desktop-wasdq-intro-overlay'));
      const brCs = getComputedStyle(document.getElementById('portfolio-hud-desktop-controls'));
      return {
        navState: sb.portfolioHUD.getDesktopNavState(),
        introVisibility: introOverlayCs.visibility,
        introOpacity: introOverlayCs.opacity,
        introPointerEvents: introOverlayCs.pointerEvents,
        brVisibility: brCs.visibility,
        brOpacity: brCs.opacity,
      };
    });
    assert.equal(postDissolve.navState.desktopIntroPhase, 'completed');
    assert.equal(postDissolve.introVisibility, 'hidden', 'Completed Key Intro overlay must dissolve out to visibility:hidden');
    assert.equal(postDissolve.introOpacity, '0');
    assert.equal(postDissolve.introPointerEvents, 'none');
    assert.equal(postDissolve.brVisibility, 'visible', 'Bottom-right WASD+Q HUD must remain visible after Key Intro completes');
    assert.equal(postDissolve.brOpacity, '1');

    // 3g. Verify WORKS button is now unlocked, suppresses bottom-right WASD+Q HUD during mount-focus,
    // and re-flickers WASD+Q HUD upon exiting WITHOUT re-opening the one-time Key Intro!
    const flickerCountBeforeWorks = postDissolve.navState.desktopControlsFlickerPlayedCount;
    await page.click('#mobile-action-interact-btn');
    const duringWorks = await page.evaluate(() => {
      const sb = window.__sandbox;
      sb.step(1 / 60);
      const brCs = getComputedStyle(document.getElementById('portfolio-hud-desktop-controls'));
      return {
        mode: sb.mode,
        brOpacity: brCs.opacity,
        brVisibility: brCs.visibility,
      };
    });
    assert.equal(duringWorks.mode, 'mount-focus', 'WORKS button must open Works Showcase once 5/5 calibration is complete');
    assert.equal(duringWorks.brVisibility, 'hidden', 'Bottom-right WASD+Q HUD must cleanly suppress during mount-focus showcase');

    await page.keyboard.press('Escape');
    await page.waitForTimeout(90);
    const afterWorksExit = await page.evaluate(() => {
      const sb = window.__sandbox;
      sb.step(1 / 60);
      return sb.portfolioHUD.getDesktopNavState();
    });
    assert.ok(
      afterWorksExit.desktopControlsFlickerPlayedCount > flickerCountBeforeWorks,
      'Exiting Works Showcase must re-trigger CRT Phosphor Flicker-On on bottom-right WASD+Q HUD'
    );
    assert.equal(
      afterWorksExit.desktopIntroPhase,
      'completed',
      'Exiting Works Showcase must NOT re-open the completed one-time Key Intro'
    );
    console.log('  [PASS] Forced 5-key gating, Q->W handoff, pointer fallback, blur recovery & post-intro unlock verified.');

    // =========================================================================
    // GATE 5B (on desktopContext): Bi-Directional Desktop <-> Mobile Resize Sync
    // =========================================================================
    console.log('\n[Gate 5A] Verifying Bi-Directional Desktop <-> Mobile Window Resize Synchronization...');
    await page.setViewportSize({ width: 800, height: 700 });
    await page.waitForTimeout(80);
    const narrowedToMobile = await page.evaluate(() => {
      window.__sandbox.step(1 / 60);
      return {
        isMobile: window.__sandbox.portfolioHUD.getDesktopNavState().isMobileMode,
        brDisplay: getComputedStyle(document.getElementById('portfolio-hud-desktop-controls')).display,
        touchDisplay: getComputedStyle(document.getElementById('mobile-touch-controls')).display,
      };
    });
    assert.equal(narrowedToMobile.isMobile, true, 'Narrowing viewport <= 900px must switch to mobile mode');
    assert.equal(narrowedToMobile.brDisplay, 'none', 'Desktop WASD+Q HUD must be display:none when narrowed to mobile');
    assert.equal(narrowedToMobile.touchDisplay, 'block', 'Mobile analog controls must display when narrowed to mobile');

    await page.setViewportSize({ width: 1440, height: 900 });
    await page.waitForTimeout(80);
    const widenedToDesktop = await page.evaluate(() => {
      window.__sandbox.step(1 / 60);
      return {
        isMobile: window.__sandbox.portfolioHUD.getDesktopNavState().isMobileMode,
        brDisplay: getComputedStyle(document.getElementById('portfolio-hud-desktop-controls')).display,
        brVisibility: getComputedStyle(document.getElementById('portfolio-hud-desktop-controls')).visibility,
        touchDisplay: getComputedStyle(document.getElementById('mobile-touch-controls')).display,
      };
    });
    assert.equal(widenedToDesktop.isMobile, false, 'Widening viewport back to 1440x900 must restore desktop mode');
    assert.equal(widenedToDesktop.touchDisplay, 'none', 'Mobile analog sticks must hide again when widened back to desktop');
    assert.notEqual(widenedToDesktop.brDisplay, 'none', 'Desktop WASD+Q HUD must restore when widened back to desktop');
    assert.equal(widenedToDesktop.brVisibility, 'visible');

    // Steady-state frame-time budget check on desktop
    const steadyFrameMs = await page.evaluate(() => {
      const sb = window.__sandbox;
      const t0 = performance.now();
      for (let i = 0; i < 60; i++) sb.step(1 / 60);
      return (performance.now() - t0) / 60;
    });
    assert.ok(steadyFrameMs <= 16.67, `Steady-state frame time must stay <= 16.67ms, got ${steadyFrameMs.toFixed(2)}ms`);
    console.log(`  [PASS] Bi-directional resize sync verified; steady-state step = ${steadyFrameMs.toFixed(2)}ms (<= 16.67ms).`);

    await desktopContext.close();

    // =========================================================================
    // GATE 4: Card 07 "YES" (DOOM_HEAD Chat) Deferral & Input Isolation
    // =========================================================================
    console.log('\n[Gate 4] Verifying Card 07 "YES" (DOOM_HEAD Chat) Deferral & Chat Input Isolation...');
    const chatContext = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      deviceScaleFactor: 1.5,
      hasTouch: false,
      isMobile: false,
    });
    const chatPage = await chatContext.newPage();
    attachErrorListeners(chatPage, 'desktop-chat');

    await chatPage.goto(`${baseUrl}/index.html`, {
      waitUntil: 'domcontentloaded',
      timeout: 30000,
    });
    await chatPage.waitForFunction(
      () => window.__sandbox && window.__sandbox.ready && window.__sandbox.portfolioHUD,
      { timeout: 30000 }
    );
    await advanceIntroToFinalCard(chatPage);

    await chatPage.click('#intro-dialogue-yes-btn');
    await chatPage.waitForTimeout(120);

    const duringDoomChat = await chatPage.evaluate(() => {
      window.__sandbox.step(1 / 60);
      const introCs = getComputedStyle(document.getElementById('desktop-wasdq-intro-overlay'));
      return {
        isDoomChatOpen: window.__sandbox.isDoomChatOpen,
        navState: window.__sandbox.portfolioHUD.getDesktopNavState(),
        introVisibility: introCs.visibility,
        introOpacity: introCs.opacity,
      };
    });
    assert.equal(duringDoomChat.isDoomChatOpen, true, 'Card 07 YES must open DOOM_HEAD chat');
    assert.equal(duringDoomChat.navState.desktopIntroPhase, 'deferred-doom-chat', 'Key Intro must defer while Card 07 DOOM_HEAD chat is open');
    assert.equal(duringDoomChat.navState.isGating, false);
    assert.equal(duringDoomChat.introVisibility, 'hidden', 'Key Intro overlay must stay hidden while DOOM_HEAD chat is open');

    // Focus #doom-chat-input and type "wasdq" -> must NOT count toward key calibration or open radial menu!
    await chatPage.focus('#doom-chat-input');
    await chatPage.keyboard.type('wasdq');
    const afterChatTyping = await chatPage.evaluate(() => {
      window.__sandbox.step(1 / 60);
      return {
        inputVal: document.getElementById('doom-chat-input').value,
        radialOpen: window.__sandbox.radialMenu.isOpen(),
        mode: window.__sandbox.mode,
        navState: window.__sandbox.portfolioHUD.getDesktopNavState(),
      };
    });
    assert.equal(afterChatTyping.inputVal, 'wasdq');
    assert.equal(afterChatTyping.radialOpen, false, 'Typing q in #doom-chat-input must not toggle Radial Menu');
    assert.equal(afterChatTyping.mode, 'scroll', 'Typing wasd in #doom-chat-input must not trigger locomotion');
    assert.equal(afterChatTyping.navState.completedCount, 0, 'Typing wasdq in #doom-chat-input must leave completedCount at 0');

    // Close DOOM_HEAD chat -> Key Intro must immediately launch at 00 / 05!
    await chatPage.click('#doom-close-chat-btn');
    await chatPage.waitForTimeout(90);
    const afterChatClose = await chatPage.evaluate(() => {
      for (let i = 0; i < 45; i++) window.__sandbox.step(1 / 60);
      const introCs = getComputedStyle(document.getElementById('desktop-wasdq-intro-overlay'));
      return {
        isDoomChatOpen: window.__sandbox.isDoomChatOpen,
        navState: window.__sandbox.portfolioHUD.getDesktopNavState(),
        introVisibility: introCs.visibility,
        counterText: document.getElementById('desktop-wasdq-intro-counter').textContent,
      };
    });
    assert.equal(afterChatClose.isDoomChatOpen, false);
    assert.equal(afterChatClose.navState.desktopIntroPhase, 'active', 'Closing DOOM_HEAD chat must immediately launch Key Intro');
    assert.equal(afterChatClose.navState.isGating, true);
    assert.equal(afterChatClose.navState.completedCount, 0);
    assert.equal(afterChatClose.introVisibility, 'visible');
    assert.equal(afterChatClose.counterText, '00 / 05');
    console.log('  [PASS] Card 07 "YES" DOOM_HEAD chat deferral, input isolation & immediate post-chat launch verified.');

    await chatContext.close();

    // =========================================================================
    // GATE 5B: Strict Mobile Mutual Exclusivity (390x844 Touch Device)
    // =========================================================================
    console.log('\n[Gate 5B] Verifying Strict Mobile Mutual Exclusivity (390x844 Touch Viewport — Solely Analog Sticks)...');
    const mobileContext = await browser.newContext({
      viewport: { width: 390, height: 844 },
      deviceScaleFactor: 3,
      hasTouch: true,
      isMobile: true,
      userAgent:
        'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1',
    });
    const mobilePage = await mobileContext.newPage();
    attachErrorListeners(mobilePage, 'mobile-touch');

    await mobilePage.goto(`${baseUrl}/index.html`, {
      waitUntil: 'domcontentloaded',
      timeout: 30000,
    });
    await mobilePage.waitForFunction(
      () => window.__sandbox && window.__sandbox.ready && window.__sandbox.portfolioHUD,
      { timeout: 30000 }
    );

    // Pre-dialogue check on mobile
    const mobilePreDialogue = await mobilePage.evaluate(() => {
      const sb = window.__sandbox;
      if (sb.skipSprayPaintIntro) sb.skipSprayPaintIntro();
      sb.step(0.05);
      return {
        isMobile: sb.portfolioHUD.getDesktopNavState().isMobileMode,
        brDisplay: getComputedStyle(document.getElementById('portfolio-hud-desktop-controls')).display,
        introDisplay: getComputedStyle(document.getElementById('desktop-wasdq-intro-overlay')).display,
        leftStickOpacity: getComputedStyle(document.getElementById('mobile-left-thumbpad')).opacity,
      };
    });
    assert.equal(mobilePreDialogue.isMobile, true);
    assert.equal(mobilePreDialogue.brDisplay, 'none', 'Desktop WASD+Q HUD must be display:none on mobile pre-dialogue');
    assert.equal(mobilePreDialogue.introDisplay, 'none', 'Desktop Key Intro must be display:none on mobile pre-dialogue');
    assert.equal(mobilePreDialogue.leftStickOpacity, '0', 'Analog sticks must stay dormant pre-dialogue on mobile');

    await advanceIntroToFinalCard(mobilePage);
    await mobilePage.click('#intro-dialogue-no-btn');
    await mobilePage.waitForTimeout(850);

    const mobilePostDialogue = await mobilePage.evaluate(() => {
      const sb = window.__sandbox;
      for (let i = 0; i < 40; i++) sb.step(1 / 60);
      const brCs = getComputedStyle(document.getElementById('portfolio-hud-desktop-controls'));
      const introCs = getComputedStyle(document.getElementById('desktop-wasdq-intro-overlay'));
      const touchCs = getComputedStyle(document.getElementById('mobile-touch-controls'));
      const leftCs = getComputedStyle(document.getElementById('mobile-left-thumbpad'));
      const rightCs = getComputedStyle(document.getElementById('mobile-right-thumbpad'));
      return {
        navState: sb.portfolioHUD.getDesktopNavState(),
        brDisplay: brCs.display,
        brVisibility: brCs.visibility,
        introDisplay: introCs.display,
        introVisibility: introCs.visibility,
        touchDisplay: touchCs.display,
        leftVisibility: leftCs.visibility,
        leftOpacity: leftCs.opacity,
        rightVisibility: rightCs.visibility,
        rightOpacity: rightCs.opacity,
      };
    });
    assert.equal(mobilePostDialogue.navState.isMobileMode, true);
    assert.equal(mobilePostDialogue.navState.isGating, false, 'Mobile must NEVER be gated by desktop WASD+Q intro');
    assert.equal(mobilePostDialogue.navState.desktopControlsFlickerPlayedCount, 0, 'Desktop WASD+Q HUD flicker must never run on mobile');
    assert.equal(mobilePostDialogue.navState.desktopIntroFlickerPlayedCount, 0, 'Desktop Key Intro flicker must never run on mobile');
    assert.equal(mobilePostDialogue.brDisplay, 'none', 'Desktop WASD+Q HUD must be display:none on mobile post-dialogue');
    assert.equal(mobilePostDialogue.introDisplay, 'none', 'Desktop Key Intro must be display:none on mobile post-dialogue');
    assert.equal(mobilePostDialogue.touchDisplay, 'block', 'Mobile touch controls must be display:block on mobile');
    assert.equal(mobilePostDialogue.leftVisibility, 'visible', 'Left MOVE analog stick must be visible post-dialogue on mobile');
    assert.ok(Number(mobilePostDialogue.leftOpacity) >= 0.5, `Left MOVE analog stick must settle to resting opacity (>=0.5), got ${mobilePostDialogue.leftOpacity}`);
    assert.equal(mobilePostDialogue.rightVisibility, 'visible', 'Right LOOK analog stick must be visible post-dialogue on mobile');
    assert.ok(Number(mobilePostDialogue.rightOpacity) >= 0.5, `Right LOOK analog stick must settle to resting opacity (>=0.5), got ${mobilePostDialogue.rightOpacity}`);
    console.log('  [PASS] Strict Mobile XOR Exclusivity verified: solely MOVE & LOOK analog sticks render; zero WASD/Q DOM or gating.');

    await mobileContext.close();

    assert.equal(pageErrors.length, 0, `Expected 0 page errors, got: ${pageErrors.join(' | ')}`);
    assert.equal(consoleErrors.length, 0, `Expected 0 console errors, got: ${consoleErrors.join(' | ')}`);

    console.log('\n========================================================================');
    console.log('ALL SPEC 072 LIVE RUNTIME GATES PASSED WITH ZERO ERRORS (CLS = 0.000)');
    console.log('========================================================================');
  } finally {
    await browser.close();
    await new Promise((resolve) => server.close(resolve));
  }
}

runVerification().catch((err) => {
  console.error('\n[FAIL] Spec 072 verification failed:', err);
  process.exit(1);
});
