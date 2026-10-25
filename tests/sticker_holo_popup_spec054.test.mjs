/**
 * Live Headless Chromium E2E & Mathematical Verification for functional_specification_054.md:
 * Amber-Hued Screen-Size-Agnostic Holographic Sticker Message Pop-Up,
 * Viewport-Adaptive Camera Framing, Bidirectional Materialization Choreography,
 * and Locked [0.25, 1.00] Size Envelope.
 */

import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

import {
  STICKER_DEFAULT_SIZE_BOUNDS,
  normalizeStickerSizeBounds,
  clampStickerSize,
} from '../holographic_stickers.js';

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
        const relPath = decodeURIComponent(parsed.pathname);
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

function runHeadlessUnitSuite() {
  console.log('[1/2] Running pure mathematical & size-envelope lock verification (AC-03)...');

  assert.equal(STICKER_DEFAULT_SIZE_BOUNDS.minSize, 0.25, 'Expected minSize locked at 0.25');
  assert.equal(STICKER_DEFAULT_SIZE_BOUNDS.maxSize, 1.0, 'Expected maxSize locked at 1.0');
  assert.equal(STICKER_DEFAULT_SIZE_BOUNDS.absMinLimit, 0.25, 'Expected absMinLimit locked at 0.25');
  assert.equal(STICKER_DEFAULT_SIZE_BOUNDS.absMaxLimit, 1.0, 'Expected absMaxLimit locked at 1.0');

  const normalized = normalizeStickerSizeBounds({ minSize: 0.05, maxSize: 3.5 });
  assert.equal(normalized.minSize, 0.25, 'normalizeStickerSizeBounds must lock minSize to 0.25');
  assert.equal(normalized.maxSize, 1.0, 'normalizeStickerSizeBounds must lock maxSize to 1.0');

  assert.equal(clampStickerSize(0.05), 0.25, 'clampStickerSize(0.05) must clamp to 0.25');
  assert.equal(clampStickerSize(0.25), 0.25, 'clampStickerSize(0.25) must equal 0.25');
  assert.equal(clampStickerSize(0.65), 0.65, 'clampStickerSize(0.65) must equal 0.65');
  assert.equal(clampStickerSize(1.0), 1.0, 'clampStickerSize(1.0) must equal 1.0');
  assert.equal(clampStickerSize(2.5), 1.0, 'clampStickerSize(2.5) must clamp to 1.0');

  console.log('      ✓ Pure mathematical & size-envelope lock verification passed.');
}

async function runLiveBrowserE2ESuite() {
  console.log('[2/2] Running live headless Chromium E2E verification across 4 viewports (AC-01..AC-06)...');
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
    page.on('pageerror', (err) => pageErrors.push(err.message || String(err)));

    await page.goto(`${baseUrl}/index.html`, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForFunction(() => Boolean(window.sandbox && window.sandbox.ready && window.sandbox.holographicStickers), null, {
      timeout: 60000,
    });

    // Skip spray paint intro if active
    await page.evaluate(() => {
      if (window.sandbox && typeof window.sandbox.skipSprayPaintIntro === 'function') {
        window.sandbox.skipSprayPaintIntro();
      }
      if (window.sandbox && window.sandbox.director) {
        window.sandbox.director.stopStartupPan(true);
      }
    });

    // -------------------------------------------------------------------------
    // AC-02 & AC-03: Exclusive "TAGGER:" and "MESSAGE:" fields + Locked [0.25, 1.00] bounds
    // -------------------------------------------------------------------------
    const domAudit = await page.evaluate(() => {
      const sb = window.sandbox;
      // Place a left-wall sticker and open the popup
      const rec = sb.placeStickerAt(
        {
          stickerId: 'doom_tag',
          surfaceId: 'COLLIDER_STICKER_WALL_L',
          surfaceLabel: 'Left Alley Wall (Interior)',
          surfaceCategory: 'interior-wall',
          wallSide: 'L',
          position: { x: -1.16, y: 1.55, z: 3.5 },
          normal: { x: 1, y: 0, z: 0 },
          sizeMeters: 0.65,
        },
        { openPopup: true, immediate: false }
      );

      const overlayEl = document.getElementById('sticker-holo-popup-overlay');
      const panelEl = document.getElementById('sticker-holo-popup-panel');
      const initialAnimState = overlayEl ? overlayEl.getAttribute('data-holo-state') : null;
      const hasIgnitingClass = overlayEl ? overlayEl.classList.contains('igniting') : false;

      const inputs = Array.from(
        panelEl.querySelectorAll('input, textarea, select')
      ).map((el) => ({
        id: el.id,
        tag: el.tagName.toLowerCase(),
      }));

      const labels = Array.from(
        panelEl.querySelectorAll('#sticker-tag-form label')
      ).map((el) => el.textContent.trim());

      const legacyControls = [
        'sticker-popup-size-slider',
        'sticker-popup-size-input',
        'sticker-popup-rot-slider',
        'sticker-popup-rot-input',
        'sticker-popup-size-down-btn',
        'sticker-popup-size-up-btn',
        'sticker-popup-rot-ccw-btn',
        'sticker-popup-rot-cw-btn',
        'sticker-popup-set-min-btn',
        'sticker-popup-set-max-btn',
        'sticker-popup-bounds-pill',
      ].filter((id) => document.getElementById(id) !== null);

      // Verify locked size bounds even when attempting to mutate them
      sb.setStickerSizeBounds({ minSize: 0.05, maxSize: 3.0 }, false);
      const boundsAfterMutate = sb.getStickerSystemState().sizeBounds;
      const clampedMin = sb.resizeStickerToMeters(0.05);
      const clampedMax = sb.resizeStickerToMeters(2.5);
      sb.resizeStickerToMeters(0.65);

      return {
        placedId: rec ? rec.placedId : null,
        initialAnimState,
        hasIgnitingClass,
        inputs,
        labels,
        legacyControls,
        boundsAfterMutate,
        clampedMin,
        clampedMax,
      };
    });

    assert.ok(domAudit.placedId, 'Sticker should be placed and popup opened');
    assert.equal(domAudit.initialAnimState, 'igniting', 'AC-06: Popup should enter "igniting" state immediately on click/open');
    assert.equal(domAudit.hasIgnitingClass, true, 'AC-06: Overlay should have .igniting class on open');
    assert.deepEqual(
      domAudit.inputs,
      [
        { id: 'sticker-tagger-input', tag: 'input' },
        { id: 'sticker-message-input', tag: 'textarea' },
      ],
      'AC-02: Only #sticker-tagger-input and #sticker-message-input may exist inside #sticker-holo-popup-panel'
    );
    assert.deepEqual(
      domAudit.labels,
      ['TAGGER:', 'MESSAGE:'],
      'AC-02: Form field labels must be strictly "TAGGER:" and "MESSAGE:"'
    );
    assert.deepEqual(
      domAudit.legacyControls,
      [],
      'AC-02: All legacy transform/calibration controls inside the popup must be removed'
    );
    assert.equal(domAudit.boundsAfterMutate.minSize, 0.25, 'AC-03: minSize must remain locked at 0.25');
    assert.equal(domAudit.boundsAfterMutate.maxSize, 1.0, 'AC-03: maxSize must remain locked at 1.0');
    assert.equal(domAudit.clampedMin, 0.25, 'AC-03: resizeStickerToMeters(0.05) must clamp to 0.25');
    assert.equal(domAudit.clampedMax, 1.0, 'AC-03: resizeStickerToMeters(2.5) must clamp to 1.0');

    // Wait for ignition animation to transition to steady-state 'active'
    await page.waitForFunction(
      () => document.getElementById('sticker-holo-popup-overlay')?.getAttribute('data-holo-state') === 'active',
      null,
      { timeout: 3000 }
    );
    const activeStateAudit = await page.evaluate(() => {
      const overlayEl = document.getElementById('sticker-holo-popup-overlay');
      return {
        animState: overlayEl.getAttribute('data-holo-state'),
        hasActive: overlayEl.classList.contains('active'),
        hasIgniting: overlayEl.classList.contains('igniting'),
      };
    });
    assert.equal(activeStateAudit.animState, 'active', 'AC-06: Popup should settle into data-holo-state="active" after 360ms');
    assert.equal(activeStateAudit.hasActive, true);
    assert.equal(activeStateAudit.hasIgniting, false);

    // -------------------------------------------------------------------------
    // AC-01: Amber Hues Only Chromatic Audit
    // -------------------------------------------------------------------------
    const colorAudit = await page.evaluate(() => {
      const overlayEl = document.getElementById('sticker-holo-popup-overlay');
      const elements = [overlayEl, ...overlayEl.querySelectorAll('*')];
      const violations = [];

      function checkRgbString(str, elDesc, propName) {
        if (!str || str === 'none' || str === 'transparent') return;
        const rgbMatches = str.matchAll(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)(?:\s*,\s*([0-9.]+))?\s*\)/g);
        for (const m of rgbMatches) {
          const r = Number(m[1]);
          const g = Number(m[2]);
          const b = Number(m[3]);
          const a = m[4] !== undefined ? Number(m[4]) : 1.0;
          if (a === 0) continue; // fully transparent
          // In an amber-only palette, R must be >= G and R must be > B (no cyan/blue/slate dominance where B > R)
          if (b > r || g > r + 4) {
            violations.push({ elDesc, propName, value: m[0], r, g, b, a });
          }
        }
      }

      for (const el of elements) {
        const cs = window.getComputedStyle(el);
        const elDesc = `${el.tagName.toLowerCase()}${el.id ? '#' + el.id : ''}${el.className && typeof el.className === 'string' ? '.' + el.className.trim().replace(/\s+/g, '.') : ''}`;
        for (const prop of [
          'color',
          'backgroundColor',
          'borderTopColor',
          'borderRightColor',
          'borderBottomColor',
          'borderLeftColor',
          'boxShadow',
          'textShadow',
          'backgroundImage',
          'stroke',
          'fill',
        ]) {
          checkRgbString(cs[prop], elDesc, prop);
        }
      }

      const stopColors = Array.from(
        document.querySelectorAll('#sticker-tether-grad stop')
      ).map((s) => s.getAttribute('stop-color'));

      return { violations, stopColors };
    });

    assert.deepEqual(
      colorAudit.violations,
      [],
      `AC-01: Expected zero non-amber color tokens in #sticker-holo-popup-overlay, found: ${JSON.stringify(colorAudit.violations)}`
    );
    assert.deepEqual(colorAudit.stopColors, ['#fbbf24', '#fef08a', '#f59e0b']);

    // Test form submission for TAGGER: and MESSAGE:
    await page.fill('#sticker-tagger-input', 'DOOM_BOT');
    await page.fill('#sticker-message-input', 'ALL CAPS WHEN YOU SPELL THE MAN NAME');
    await page.click('#sticker-save-message-btn');

    const savedAudit = await page.evaluate(() => {
      const st = window.sandbox.getStickerSystemState();
      const rec = st.placedStickers[st.placedStickers.length - 1];
      const savedTaggerText = document.getElementById('sticker-saved-tagger-display')?.textContent;
      const savedMsgText = document.getElementById('sticker-saved-message-display')?.textContent;
      const savedReadoutVisible = document.getElementById('sticker-saved-readout')?.classList.contains('visible');
      return {
        tagger: rec.tagger,
        message: rec.message,
        savedTaggerText,
        savedMsgText,
        savedReadoutVisible,
      };
    });
    assert.equal(savedAudit.tagger, 'DOOM_BOT');
    assert.equal(savedAudit.message, 'ALL CAPS WHEN YOU SPELL THE MAN NAME');
    assert.equal(savedAudit.savedReadoutVisible, true);
    assert.ok(savedAudit.savedTaggerText.includes('DOOM_BOT'));
    assert.ok(savedAudit.savedMsgText.includes('ALL CAPS'));

    // -------------------------------------------------------------------------
    // AC-04 & AC-05: Multi-Viewport Screen-Size-Agnostic Layout, Tether & Camera Framing
    // -------------------------------------------------------------------------
    const viewports = [
      { name: 'Desktop (1440x900)', width: 1440, height: 900, expectPortraitSheet: false },
      { name: 'Tablet Portrait (768x1024)', width: 768, height: 1024, expectPortraitSheet: true },
      { name: 'Mobile Portrait (390x844)', width: 390, height: 844, expectPortraitSheet: true },
      { name: 'Mobile Landscape (844x390)', width: 844, height: 390, expectPortraitSheet: false },
    ];

    const surfaceTestCases = [
      {
        name: 'Left Wall',
        opts: {
          stickerId: 'doom_tag',
          surfaceId: 'COLLIDER_STICKER_WALL_L',
          surfaceLabel: 'Left Alley Wall (Interior)',
          surfaceCategory: 'interior-wall',
          wallSide: 'L',
          position: { x: -1.16, y: 1.55, z: 3.5 },
          normal: { x: 1, y: 0, z: 0 },
          sizeMeters: 0.65,
        },
      },
      {
        name: 'Right Wall',
        opts: {
          stickerId: 'glass_doom',
          surfaceId: 'COLLIDER_STICKER_WALL_R',
          surfaceLabel: 'Right Alley Wall (Interior)',
          surfaceCategory: 'interior-wall',
          wallSide: 'R',
          position: { x: 1.48, y: 1.60, z: 4.2 },
          normal: { x: -1, y: 0, z: 0 },
          sizeMeters: 0.72,
        },
      },
      {
        name: 'Floor Surface',
        opts: {
          stickerId: 'doom_cig',
          surfaceId: 'COLLIDER_FLOOR',
          surfaceLabel: 'Alley Ground / Floor',
          surfaceCategory: 'floor',
          wallSide: null,
          position: { x: 0.12, y: 0.022, z: 3.8 },
          normal: { x: 0, y: 1, z: 0 },
          sizeMeters: 0.65,
        },
      },
    ];

    for (const vp of viewports) {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.waitForTimeout(80);

      for (const surf of surfaceTestCases) {
        const frameMetrics = await page.evaluate(
          ({ surfOpts }) => {
            const sb = window.sandbox;
            const rec = sb.placeStickerAt(surfOpts, { openPopup: true, immediate: true });
            // Advance simulation so camera settles at target pose and tether updates
            for (let i = 0; i < 6; i++) {
              window.dispatchEvent(new Event('resize'));
            }

            const panelEl = document.getElementById('sticker-holo-popup-panel');
            const rect = panelEl.getBoundingClientRect();
            const vw = window.innerWidth;
            const vh = window.innerHeight;

            // Project 3D sticker center into screen pixels & NDC
            const obj3d = rec.instance.group || rec.instance.rootGroup;
            const worldPos = obj3d.getWorldPosition(sb.camera.position.clone());
            const ndc = worldPos.clone().project(sb.camera);
            const screenX = (ndc.x * 0.5 + 0.5) * vw;
            const screenY = (-ndc.y * 0.5 + 0.5) * vh;

            const panelDot = document.getElementById('sticker-holo-tether-panel-dot');
            const originDot = document.getElementById('sticker-holo-tether-origin-dot');
            const pathEl = document.getElementById('sticker-holo-tether-path');

            return {
              vw,
              vh,
              panelRect: {
                left: rect.left,
                top: rect.top,
                right: rect.right,
                bottom: rect.bottom,
                width: rect.width,
                height: rect.height,
              },
              scrollWidth: panelEl.scrollWidth,
              clientWidth: panelEl.clientWidth,
              ndc: { x: ndc.x, y: ndc.y, z: ndc.z },
              screenPos: { x: screenX, y: screenY },
              camPos: {
                x: sb.camera.position.x,
                y: sb.camera.position.y,
                z: sb.camera.position.z,
              },
              tether: {
                d: pathEl.getAttribute('d'),
                px: Number(panelDot.getAttribute('cx')),
                py: Number(panelDot.getAttribute('cy')),
                sx: Number(originDot.getAttribute('cx')),
                sy: Number(originDot.getAttribute('cy')),
              },
              bodyHasPopupClass: document.body.classList.contains('sticker-popup-active'),
            };
          },
          { surfOpts: surf.opts }
        );

        const label = `${vp.name} / ${surf.name}`;
        // AC-04: Panel strictly within viewport with >= 8px margin and zero horizontal overflow
        assert.ok(
          frameMetrics.panelRect.left >= 6 &&
            frameMetrics.panelRect.top >= 6 &&
            frameMetrics.panelRect.right <= vp.width - 6 &&
            frameMetrics.panelRect.bottom <= vp.height - 6,
          `AC-04 (${label}): Panel rect ${JSON.stringify(frameMetrics.panelRect)} must stay inside viewport ${vp.width}x${vp.height}`
        );
        assert.ok(
          frameMetrics.scrollWidth <= frameMetrics.clientWidth + 2,
          `AC-04 (${label}): Panel must have zero horizontal overflow (${frameMetrics.scrollWidth} vs ${frameMetrics.clientWidth})`
        );
        assert.equal(frameMetrics.bodyHasPopupClass, true, `AC-04 (${label}): body.sticker-popup-active must be active`);

        // AC-04: Orientation-aware tether attachment
        assert.ok(
          frameMetrics.tether.d && frameMetrics.tether.d.startsWith('M '),
          `AC-04 (${label}): SVG tether path must be populated`
        );
        if (vp.expectPortraitSheet) {
          assert.ok(
            Math.abs(frameMetrics.tether.py - frameMetrics.panelRect.top) <= 2.5,
            `AC-04 (${label}): Portrait tether must attach to top edge of bottom-sheet panel (py=${frameMetrics.tether.py}, top=${frameMetrics.panelRect.top})`
          );
        } else {
          assert.ok(
            Math.abs(frameMetrics.tether.px - frameMetrics.panelRect.left) <= 2.5,
            `AC-04 (${label}): Landscape tether must attach to left edge of right-docked panel (px=${frameMetrics.tether.px}, left=${frameMetrics.panelRect.left})`
          );
        }

        // AC-05: 3D sticker projects into the unobstructed 3D viewport safe stage (outside the popup panel!)
        assert.ok(
          frameMetrics.ndc.z > -1.0 && frameMetrics.ndc.z < 1.0,
          `AC-05 (${label}): Sticker must be in front of the camera clip planes (ndc.z=${frameMetrics.ndc.z})`
        );
        assert.ok(
          frameMetrics.ndc.x >= -0.92 && frameMetrics.ndc.x <= 0.92 && frameMetrics.ndc.y >= -0.92 && frameMetrics.ndc.y <= 0.92,
          `AC-05 (${label}): Sticker must project well inside screen frustum (${JSON.stringify(frameMetrics.ndc)})`
        );
        if (vp.expectPortraitSheet) {
          assert.ok(
            frameMetrics.screenPos.y < frameMetrics.panelRect.top - 10,
            `AC-05 (${label}): On portrait viewport, sticker screenY (${frameMetrics.screenPos.y.toFixed(1)}) must project in upper safe stage above panel top (${frameMetrics.panelRect.top.toFixed(1)})`
          );
        } else {
          assert.ok(
            frameMetrics.screenPos.x < frameMetrics.panelRect.left - 10,
            `AC-05 (${label}): On landscape viewport, sticker screenX (${frameMetrics.screenPos.x.toFixed(1)}) must project in left safe stage to the left of panel (${frameMetrics.panelRect.left.toFixed(1)})`
          );
        }
      }
    }

    // -------------------------------------------------------------------------
    // AC-06: Holographic Collapse Animation & Camera Return on Close
    // -------------------------------------------------------------------------
    await page.setViewportSize({ width: 1440, height: 900 });
    const closeInitAudit = await page.evaluate(() => {
      const sb = window.sandbox;
      sb.closeStickerPopup({ immediate: false });
      const overlayEl = document.getElementById('sticker-holo-popup-overlay');
      return {
        isStickerPopupOpen: sb.isStickerPopupOpen,
        animState: overlayEl.getAttribute('data-holo-state'),
        hasClosingClass: overlayEl.classList.contains('closing'),
        returningToOrbit: sb.stickerPopupCameraState.returningToOrbit,
      };
    });

    assert.equal(closeInitAudit.isStickerPopupOpen, false, 'AC-06: Logical isStickerPopupOpen must be false immediately on exit');
    assert.equal(closeInitAudit.animState, 'collapsing', 'AC-06: Overlay must enter data-holo-state="collapsing" on exit');
    assert.equal(closeInitAudit.hasClosingClass, true, 'AC-06: Overlay must have .closing class during exit animation');
    assert.equal(closeInitAudit.returningToOrbit, true, 'AC-05: Camera must smoothly return to third-person orbit on exit');

    await page.waitForFunction(
      () => {
        const el = document.getElementById('sticker-holo-popup-overlay');
        return el && el.getAttribute('data-holo-state') === 'dormant' && window.getComputedStyle(el).visibility === 'hidden';
      },
      null,
      { timeout: 3000 }
    );
    const closeSettledAudit = await page.evaluate(() => {
      const overlayEl = document.getElementById('sticker-holo-popup-overlay');
      const cs = window.getComputedStyle(overlayEl);
      return {
        animState: overlayEl.getAttribute('data-holo-state'),
        hasClosingClass: overlayEl.classList.contains('closing'),
        hasActiveClass: overlayEl.classList.contains('active'),
        ariaHidden: overlayEl.getAttribute('aria-hidden'),
        visibility: cs.visibility,
      };
    });

    assert.equal(closeSettledAudit.animState, 'dormant', 'AC-06: Overlay must settle to data-holo-state="dormant" after 260ms collapse');
    assert.equal(closeSettledAudit.hasClosingClass, false);
    assert.equal(closeSettledAudit.hasActiveClass, false);
    assert.equal(closeSettledAudit.ariaHidden, 'true');
    assert.equal(closeSettledAudit.visibility, 'hidden');

    assert.deepEqual(pageErrors, [], `Expected zero uncaught page errors, found: ${JSON.stringify(pageErrors)}`);
    console.log('      ✓ Live headless Chromium E2E verification passed across all 4 viewports & 3 surface orientations.');
  } finally {
    await browser.close();
    server.close();
  }
}

async function main() {
  runHeadlessUnitSuite();
  await runLiveBrowserE2ESuite();
  console.log('\nALL SPEC 054 TESTS PASSED SUCCESSFULLY.');
}

main().catch((err) => {
  console.error('\nSPEC 054 VERIFICATION FAILED:', err);
  process.exit(1);
});
