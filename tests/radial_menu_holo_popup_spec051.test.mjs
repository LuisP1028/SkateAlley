/**
 * Live Headless Chromium E2E & Mathematical Verification for functional_specification_051.md:
 * Holographic Pop-Up Materialization Choreography & Screen-Size-Agnostic Responsive Architecture
 * for the Cyber-Tactical 2D HUD Radial Menu.
 */

import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

import {
  FULL_CIRCLE,
  START_ANGLE,
  SLICE_FAN_DURATION_MS,
  SLICE_FAN_STAGGER_MS,
  SUBMENU_FAN_IN_DURATION_MS,
  HOLO_POPUP_OPEN_DURATION_MS,
  HOLO_POPUP_CLOSE_DURATION_MS,
  PRIMARY_CYBER_MENU_ITEMS,
  STICKER_RADIAL_MENU_ITEMS,
  DEFAULT_CYBER_MENU_ITEMS,
  computeRadialDimensions,
  computeSectorAngles,
  polarToCartesian,
  resolvePolarHitSector,
  renderRadialMenuSVGMarkup,
  RadialMenu,
} from '../radial_menu_hud.js';

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

function runHeadlessUnitSuite() {
  console.log('[1/2] Running pure mathematical & headless SVG verification...');

  const radii = computeRadialDimensions({ size: 680 });
  assert.equal(radii.size, 680);
  assert.equal(radii.radius, 340);
  assert.equal(radii.wedgeInnerRadius, 126);
  assert.equal(radii.outerRingOuterRadius, 340);

  // Verify scale-invariant polar hit-testing across arbitrary rendered diameters
  for (const renderedDiameter of [260, 280, 353.28, 414, 420, 680]) {
    const scaleFromVb = renderedDiameter / radii.size;

    // 1. Deadzone hit (0.18 * outerRadius)
    const deadPosVb = polarToCartesian(radii.wedgeInnerRadius * 0.65, -45);
    const deadHit = resolvePolarHitSector(
      deadPosVb.x * scaleFromVb,
      deadPosVb.y * scaleFromVb,
      6,
      radii,
      { width: renderedDiameter, height: renderedDiameter }
    );
    assert.equal(
      deadHit.zone,
      'deadzone',
      `Expected deadzone at renderedDiameter=${renderedDiameter}`
    );

    // 2. All 6 sector hits at payloadRadius (even near the inner edge r = 132 in viewBox units!)
    for (let idx = 0; idx < 6; idx++) {
      const angles = computeSectorAngles(idx, 6);
      // Test near inner wedge boundary (r_vb = 132, which is 68.6px on a 353px wheel - previously misclassified as deadzone!)
      const innerSectorPosVb = polarToCartesian(radii.wedgeInnerRadius + 8, angles.midDeg);
      const innerHit = resolvePolarHitSector(
        innerSectorPosVb.x * scaleFromVb,
        innerSectorPosVb.y * scaleFromVb,
        6,
        radii,
        renderedDiameter
      );
      assert.equal(
        innerHit.zone,
        'sector',
        `Expected sector zone near inner wedge at renderedDiameter=${renderedDiameter}, slice=${idx}`
      );
      assert.equal(innerHit.index, idx);

      // Test at payload centroid
      const midSectorPosVb = polarToCartesian(radii.payloadRadius, angles.midDeg);
      const midHit = resolvePolarHitSector(
        midSectorPosVb.x * scaleFromVb,
        midSectorPosVb.y * scaleFromVb,
        6,
        radii,
        renderedDiameter
      );
      assert.equal(midHit.zone, 'sector');
      assert.equal(midHit.index, idx);
    }

    // 3. Outside ring hit (1.12 * outerRadius)
    const outPosVb = polarToCartesian(radii.outerRingOuterRadius * 1.12, 30);
    const outHit = resolvePolarHitSector(
      outPosVb.x * scaleFromVb,
      outPosVb.y * scaleFromVb,
      6,
      radii,
      renderedDiameter
    );
    assert.equal(outHit.zone, 'outside');
  }

  // Verify Spec 052 & Spec 053 timing constants and primary 4-slice catalog
  assert.equal(SLICE_FAN_DURATION_MS, 420);
  assert.equal(SLICE_FAN_STAGGER_MS, 48);
  assert.equal(SUBMENU_FAN_IN_DURATION_MS, 200);
  assert.equal(HOLO_POPUP_OPEN_DURATION_MS, 660);
  assert.equal(HOLO_POPUP_CLOSE_DURATION_MS, 240);

  assert.equal(PRIMARY_CYBER_MENU_ITEMS.length, 4);
  assert.deepEqual(
    PRIMARY_CYBER_MENU_ITEMS.map((item) => item.key),
    ['mail', 'github', 'x', 'spraypaint']
  );
  assert.equal(DEFAULT_CYBER_MENU_ITEMS, PRIMARY_CYBER_MENU_ITEMS);
  assert.equal(PRIMARY_CYBER_MENU_ITEMS[3].submenuItems, STICKER_RADIAL_MENU_ITEMS);

  // Verify all 4 pre-baked transparent amber-orange primary emblem PNGs exist on disk (< 60 KB)
  for (const item of PRIMARY_CYBER_MENU_ITEMS) {
    const absPath = path.join(REPO_ROOT, item.emblemSrc);
    assert.ok(fs.existsSync(absPath), `Missing pre-baked primary emblem PNG: ${absPath}`);
    const stat = fs.statSync(absPath);
    assert.ok(stat.size > 1024 && stat.size <= 61440, `Unexpected size for ${item.emblemSrc}: ${stat.size}B`);
  }

  // Verify headless markup generation for 4-slice Main Menu & 6-slice Sticker Submenu (Spec 051, 052, 053)
  const mainEnteringMarkup = renderRadialMenuSVGMarkup({ activeIndex: null, entering: true });
  assert.ok(mainEnteringMarkup.includes('cyber-concentric-deploy'));
  assert.ok(mainEnteringMarkup.includes('cyber-holo-wheel-assembly'));
  assert.ok(mainEnteringMarkup.includes('stickers_build/main_menu/mail_thumb_amber.png'));
  assert.ok(mainEnteringMarkup.includes('stickers_build/main_menu/github_thumb_amber.png'));
  assert.ok(mainEnteringMarkup.includes('stickers_build/main_menu/x_thumb_amber.png'));
  assert.ok(mainEnteringMarkup.includes('stickers_build/main_menu/spraypaint_thumb_amber.png'));
  assert.ok(!mainEnteringMarkup.includes('skateboard'));
  assert.ok(mainEnteringMarkup.includes('--slice-fan-start-deg: -90.00deg'));
  assert.ok(mainEnteringMarkup.includes('--slice-fan-start-deg: -180.00deg'));
  assert.ok(mainEnteringMarkup.includes('--slice-fan-start-deg: -270.00deg'));
  assert.ok(mainEnteringMarkup.includes('--slice-counter-fan-start-deg: 270.00deg'));

  const enteringMarkup = renderRadialMenuSVGMarkup(
    { activeIndex: null, entering: true, submenuEntering: true, isSubmenu: true },
    { menuItems: STICKER_RADIAL_MENU_ITEMS }
  );
  assert.ok(enteringMarkup.includes('cyber-concentric-deploy'));
  assert.ok(enteringMarkup.includes('cyber-submenu-deploy'));
  assert.ok(!mainEnteringMarkup.includes('cyber-hub-micro-readout'));
  assert.ok(!enteringMarkup.includes('cyber-hub-micro-readout'));
  assert.ok(enteringMarkup.includes('x="-60.48"'));
  assert.ok(enteringMarkup.includes('y="-21.06"'));
  assert.ok(enteringMarkup.includes('width="120.96"'));
  assert.ok(enteringMarkup.includes('height="42.12"'));
  assert.ok(enteringMarkup.includes('cyber-holo-wheel-assembly'));
  assert.ok(enteringMarkup.includes('cyber-svg-scan-wave'));
  assert.ok(enteringMarkup.includes('cyber-svg-scanbeam'));
  assert.ok(enteringMarkup.includes('cyber-slice-hover-mover'));
  assert.ok(enteringMarkup.includes('cyber-sector-glass-sheen'));
  assert.ok(enteringMarkup.includes('cyber-glass-sheen-grad'));
  // Verify clockwise fan-out CSS custom properties for all 6 sticker submenu slices
  assert.ok(enteringMarkup.includes('--slice-fan-start-deg: -60.00deg'));
  assert.ok(enteringMarkup.includes('--slice-fan-start-deg: -120.00deg'));
  assert.ok(enteringMarkup.includes('--slice-fan-start-deg: -180.00deg'));
  assert.ok(enteringMarkup.includes('--slice-fan-start-deg: -240.00deg'));
  assert.ok(enteringMarkup.includes('--slice-fan-start-deg: -300.00deg'));
  assert.ok(enteringMarkup.includes('--slice-counter-fan-start-deg: 300.00deg'));
  assert.ok(enteringMarkup.includes('--slice-stagger-ms: 240ms'));
  // Verify low-alpha smoked-glass stops in SVG defs
  assert.ok(enteringMarkup.includes('stop-opacity="0.34"'));
  assert.ok(enteringMarkup.includes('stop-opacity="0.24"'));
  assert.ok(enteringMarkup.includes('stop-opacity="0.48"'));
  assert.ok(enteringMarkup.includes('stop-opacity="0.42"'));
  // Verify 100% amber-orange palette & pre-baked lightweight amber thumbnails (zero cyan #00D5FF)
  assert.ok(!enteringMarkup.toLowerCase().includes('00d5ff'));
  assert.ok(!enteringMarkup.includes('0, 213, 255'));
  assert.ok(enteringMarkup.includes('radial_thumb_amber.png'));
  assert.ok(enteringMarkup.includes('plato_doom_hub_amber.png'));
  assert.ok(!enteringMarkup.includes('filter="url(#cyber-amber-glow)"'));

  const hoverMarkup = RadialMenu({ activeIndex: 2, entering: false });
  assert.ok(!hoverMarkup.includes('cyber-concentric-deploy'));
  assert.ok(hoverMarkup.includes('cyber-holo-wheel-assembly'));
  assert.ok(hoverMarkup.includes('data-visual-state="hover"'));

  console.log('  ✓ Pure mathematical & headless SVG verification passed (Spec 051 + Spec 052 + Spec 053).');
}

async function runLiveBrowserSuite() {
  console.log('[2/2] Starting live Chromium E2E verification across 6 viewports...');
  const { server, baseUrl } = await startStaticServer(REPO_ROOT);
  const browser = await chromium.launch({ headless: true });

  try {
    const context = await browser.newContext({
      viewport: { width: 1366, height: 768 },
    });
    const page = await context.newPage();

    const pageErrors = [];
    page.on('pageerror', (err) => pageErrors.push(String(err)));

    await page.goto(`${baseUrl}/index.html`, { waitUntil: 'domcontentloaded', timeout: 60000 });

    // Wait for sandbox.radialMenu initialization
    await page.waitForFunction(
      () =>
        Boolean(
          window.sandbox &&
            window.sandbox.radialMenu &&
            typeof window.sandbox.radialMenu.open === 'function'
        ),
      { timeout: 45000 }
    );

    // Dismiss spray-paint intro and startup dialogue if active so pointer events reach HUD
    await page.evaluate(() => {
      const skipBtn = document.getElementById('spray-loader-skip-btn');
      if (skipBtn) skipBtn.click();
      const sprayOverlay = document.getElementById('spray-paint-loader-overlay');
      if (sprayOverlay) {
        sprayOverlay.classList.add('hidden');
        sprayOverlay.style.display = 'none';
      }
      const introOverlay = document.getElementById('intro-dialogue-overlay');
      if (introOverlay) {
        introOverlay.style.display = 'none';
      }
    });

    // 1. Verify 4-Slice Primary Menu (MAIL, GITHUB, X, SPRAYPAINT), Transparent Emblem Alpha,
    //    Clockwise Slice Fan-Out, Smoked-Glass Optics & 100% Persistent SVG DOM on Hover (Spec 051, 052, 053)
    const openTelemetry = await page.evaluate(async () => {
      const rm = window.sandbox.radialMenu;
      rm.close();
      await new Promise((r) => setTimeout(r, 260));

      const beforeState = rm.getState();
      rm.open();
      const immediateState = rm.getState();
      const overlayEl = document.getElementById('cyber-radial-menu-overlay');
      const stageEl = overlayEl.querySelector('.cyber-radial-holo-stage');
      const auraEl = overlayEl.querySelector('.cyber-radial-holo-aura');
      const smokedGlassEl = overlayEl.querySelector('.cyber-radial-smoked-glass');
      const ringsEl = overlayEl.querySelector('.cyber-radial-holo-projector-rings');
      const scanbeamEl = overlayEl.querySelector('.cyber-holo-scanbeam-bar');
      const svgEl = overlayEl.querySelector('.cyber-radial-svg');
      const sliceNodesBefore = Array.from(svgEl.querySelectorAll('.cyber-radial-slice'));

      const hasOpeningClassImmediate = overlayEl.classList.contains('holo-opening');
      const hasConcentricDeployImmediate = svgEl.classList.contains('cyber-concentric-deploy');

      // Inspect smoked-glass backdrop & per-slice fan-out custom properties
      const glassComputed = smokedGlassEl ? window.getComputedStyle(smokedGlassEl) : null;
      const backdropFilterCss = glassComputed
        ? glassComputed.backdropFilter || glassComputed.webkitBackdropFilter || ''
        : '';

      const sliceKeys = sliceNodesBefore.map((node) => node.getAttribute('data-slice-key'));
      const sliceFanProps = sliceNodesBefore.map((node) => ({
        fanStartDeg: node.style.getPropertyValue('--slice-fan-start-deg'),
        counterFanStartDeg: node.style.getPropertyValue('--slice-counter-fan-start-deg'),
        staggerMs: node.style.getPropertyValue('--slice-stagger-ms'),
        hoverTx: node.style.getPropertyValue('--slice-hover-tx'),
        hoverTy: node.style.getPropertyValue('--slice-hover-ty'),
      }));

      // Verify all 4 primary emblem PNGs decode in browser with alpha === 0 on all 4 corners
      const emblemAlphaChecks = [];
      for (const item of rm.getMenuItems()) {
        const img = new Image();
        img.src = item.emblemSrc;
        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = reject;
        });
        const c = document.createElement('canvas');
        c.width = img.naturalWidth;
        c.height = img.naturalHeight;
        const ctx = c.getContext('2d');
        ctx.drawImage(img, 0, 0);
        const w = c.width;
        const h = c.height;
        const corners = [
          ctx.getImageData(0, 0, 1, 1).data[3],
          ctx.getImageData(w - 1, 0, 1, 1).data[3],
          ctx.getImageData(0, h - 1, 1, 1).data[3],
          ctx.getImageData(w - 1, h - 1, 1, 1).data[3],
        ];
        emblemAlphaChecks.push({
          key: item.key,
          width: w,
          height: h,
          corners,
        });
      }

      // Wait for clockwise slice fan-out animation to settle (660ms)
      await new Promise((r) => setTimeout(r, 700));
      const settledState = rm.getState();
      const hasSettledClass = overlayEl.classList.contains('holo-settled');

      // Trigger hover updates across slices 0 -> 1 -> 2 and verify 100% DOM node identity preservation
      const visualStatesAtSlice2 = [];
      rm.setActiveIndex(0);
      rm.setActiveIndex(1);
      rm.setActiveIndex(2);
      const sliceNodesAt2 = Array.from(overlayEl.querySelectorAll('.cyber-radial-slice'));
      for (const sNode of sliceNodesAt2) {
        visualStatesAtSlice2.push(sNode.getAttribute('data-visual-state'));
      }
      const syncRingRotAt2 = overlayEl
        .querySelector('.cyber-hub-sync-ring')
        ?.getAttribute('transform');

      const afterHoverState = rm.getState();
      const svgAfterHover = overlayEl.querySelector('.cyber-radial-svg');
      const sliceNodesAfter = Array.from(svgAfterHover.querySelectorAll('.cyber-radial-slice'));

      const svgIdentityPreserved = svgAfterHover === svgEl;
      const allSliceNodesPreserved =
        sliceNodesBefore.length === 4 &&
        sliceNodesBefore.every((node, idx) => node === sliceNodesAfter[idx]);
      const stageNodePreserved = overlayEl.querySelector('.cyber-radial-holo-stage') === stageEl;

      return {
        beforeOpen: beforeState.open,
        immediateOpen: immediateState.open,
        immediatePhase: immediateState.animationPhase,
        activeMenuId: immediateState.activeMenuId,
        menuDepth: immediateState.menuDepth,
        hasOpeningClassImmediate,
        hasConcentricDeployImmediate,
        hasStageNodes: Boolean(stageEl && auraEl && smokedGlassEl && ringsEl && scanbeamEl && svgEl),
        backdropFilterCss,
        sliceKeys,
        sliceFanProps,
        emblemAlphaChecks,
        settledPhase: settledState.animationPhase,
        hasSettledClass,
        openCountAfterHovers: afterHoverState.openCount - beforeState.openCount,
        hoverUpdateCountDelta: afterHoverState.hoverUpdateCount - settledState.hoverUpdateCount,
        visualStatesAtSlice2,
        syncRingRotAt2,
        svgIdentityPreserved,
        allSliceNodesPreserved,
        stageNodePreserved,
      };
    });

    assert.equal(openTelemetry.beforeOpen, false);
    assert.equal(openTelemetry.immediateOpen, true);
    assert.equal(openTelemetry.immediatePhase, 'opening');
    assert.equal(openTelemetry.activeMenuId, 'main');
    assert.equal(openTelemetry.menuDepth, 0);
    assert.equal(openTelemetry.hasOpeningClassImmediate, true);
    assert.equal(openTelemetry.hasConcentricDeployImmediate, true);
    assert.equal(openTelemetry.hasStageNodes, true);
    assert.ok(
      openTelemetry.backdropFilterCss.includes('blur'),
      `Expected smoked-glass backdrop-filter blur, got: ${openTelemetry.backdropFilterCss}`
    );
    assert.deepEqual(openTelemetry.sliceKeys, ['mail', 'github', 'x', 'spraypaint']);
    assert.equal(openTelemetry.sliceFanProps.length, 4);
    assert.equal(openTelemetry.sliceFanProps[0].staggerMs, '0ms');
    assert.equal(openTelemetry.sliceFanProps[1].fanStartDeg, '-90.00deg');
    assert.equal(openTelemetry.sliceFanProps[1].counterFanStartDeg, '90.00deg');
    assert.equal(openTelemetry.sliceFanProps[1].staggerMs, '48ms');
    assert.equal(openTelemetry.sliceFanProps[3].fanStartDeg, '-270.00deg');
    assert.equal(openTelemetry.sliceFanProps[3].counterFanStartDeg, '270.00deg');
    assert.equal(openTelemetry.sliceFanProps[3].staggerMs, '144ms');
    for (const check of openTelemetry.emblemAlphaChecks) {
      assert.equal(check.width, 192);
      assert.equal(check.height, 192);
      assert.deepEqual(
        check.corners,
        [0, 0, 0, 0],
        `Expected transparent corners on ${check.key}, got ${JSON.stringify(check.corners)}`
      );
    }
    assert.equal(openTelemetry.settledPhase, 'open');
    assert.equal(openTelemetry.hasSettledClass, true);
    assert.equal(openTelemetry.openCountAfterHovers, 1, 'Hover updates must not increment openCount');
    assert.equal(openTelemetry.hoverUpdateCountDelta, 3);
    assert.deepEqual(openTelemetry.visualStatesAtSlice2, [
      'idle',
      'idle',
      'hover',
      'idle',
    ]);
    assert.equal(openTelemetry.syncRingRotAt2, 'rotate(90.00)');
    assert.equal(
      openTelemetry.svgIdentityPreserved,
      true,
      'SVG root node identity must be 100% preserved across hover updates'
    );
    assert.equal(
      openTelemetry.allSliceNodesPreserved,
      true,
      'All 4 <g class="cyber-radial-slice"> DOM nodes must be 100% preserved across hover updates'
    );
    assert.equal(
      openTelemetry.stageNodePreserved,
      true,
      'Persistent holographic stage wrapper must not be destroyed on hover re-render'
    );
    console.log(
      '  ✓ 4-Slice Primary Menu (MAIL, GITHUB, X, SPRAYPAINT), transparent RGBA emblems & persistent DOM verified.'
    );

    // 1b. Verify Two-Stage Submenu Fan-In -> Fan-Out Choreography (SPRAYPAINT -> 6-Slice Sticker Radial -> Hub Back)
    const submenuTelemetry = await page.evaluate(async () => {
      const rm = window.sandbox.radialMenu;
      const overlayEl = document.getElementById('cyber-radial-menu-overlay');
      const stageElBefore = overlayEl.querySelector('.cyber-radial-holo-stage');
      const smokedGlassBefore = overlayEl.querySelector('.cyber-radial-smoked-glass');

      // Select Slice 3 (SPRAYPAINT) on the 4-slice Main Menu
      rm.selectIndex(3);
      const foldingState = rm.getState();
      const svgDuringFold = overlayEl.querySelector('.cyber-radial-svg');
      const hasSubmenuFoldClass =
        svgDuringFold.classList.contains('cyber-fan-fold') &&
        svgDuringFold.classList.contains('cyber-submenu-fan-fold');

      // Wait 240ms (> SUBMENU_FAN_IN_DURATION_MS = 200ms) for Stage 2 Fan-Out to start
      await new Promise((r) => setTimeout(r, 240));
      const openingSubState = rm.getState();
      const svgDuringSubOpen = overlayEl.querySelector('.cyber-radial-svg');
      const hasSubmenuDeployClass =
        svgDuringSubOpen.classList.contains('cyber-concentric-deploy') &&
        svgDuringSubOpen.classList.contains('cyber-submenu-deploy');
      const subSliceKeys = Array.from(
        svgDuringSubOpen.querySelectorAll('.cyber-radial-slice')
      ).map((n) => n.getAttribute('data-slice-key'));
      const subReadoutText = overlayEl.querySelector('.holo-readout-text')?.textContent;
      const hubTextNodeCount = svgDuringSubOpen.querySelectorAll('.cyber-central-hub text').length;
      const hubEmblemImage = svgDuringSubOpen.querySelector('.cyber-hub-emblem-image');
      const hubEmblemAttrs = hubEmblemImage
        ? {
            x: Number(hubEmblemImage.getAttribute('x')),
            y: Number(hubEmblemImage.getAttribute('y')),
            width: Number(hubEmblemImage.getAttribute('width')),
            height: Number(hubEmblemImage.getAttribute('height')),
          }
        : null;

      // Wait 700ms for Sticker Submenu Fan-Out to settle
      await new Promise((r) => setTimeout(r, 700));
      const settledSubState = rm.getState();

      // Now click the central PLATO DOOM hub deadzone (cx, cy) to navigate back to the 4-slice Main Menu
      const bounds = rm.getRenderedBounds();
      overlayEl.dispatchEvent(
        new PointerEvent('pointerdown', {
          clientX: bounds.cx,
          clientY: bounds.cy,
          bubbles: true,
        })
      );
      const backFoldingState = rm.getState();
      await new Promise((r) => setTimeout(r, 240));
      const backOpeningState = rm.getState();
      await new Promise((r) => setTimeout(r, 620));
      const backSettledState = rm.getState();

      const stagePreservedAcrossSubmenu =
        overlayEl.querySelector('.cyber-radial-holo-stage') === stageElBefore &&
        overlayEl.querySelector('.cyber-radial-smoked-glass') === smokedGlassBefore;

      return {
        foldingPhase: foldingState.animationPhase,
        foldingOpen: foldingState.open,
        hasSubmenuFoldClass,
        openingSubPhase: openingSubState.animationPhase,
        openingSubMenuId: openingSubState.activeMenuId,
        openingSubDepth: openingSubState.menuDepth,
        openingSubItemCount: openingSubState.itemCount,
        hasSubmenuDeployClass,
        subSliceKeys,
        subReadoutText,
        hubTextNodeCount,
        hubEmblemAttrs,
        settledSubPhase: settledSubState.animationPhase,
        backFoldingPhase: backFoldingState.animationPhase,
        backOpeningMenuId: backOpeningState.activeMenuId,
        backOpeningDepth: backOpeningState.menuDepth,
        backSettledPhase: backSettledState.animationPhase,
        backSettledItemCount: backSettledState.itemCount,
        submenuTransitionCount: backSettledState.submenuTransitionCount,
        stagePreservedAcrossSubmenu,
      };
    });

    assert.equal(submenuTelemetry.foldingPhase, 'submenu-folding');
    assert.equal(submenuTelemetry.foldingOpen, true);
    assert.equal(submenuTelemetry.hasSubmenuFoldClass, true);
    assert.equal(submenuTelemetry.openingSubPhase, 'submenu-opening');
    assert.equal(submenuTelemetry.openingSubMenuId, 'stickers');
    assert.equal(submenuTelemetry.openingSubDepth, 1);
    assert.equal(submenuTelemetry.openingSubItemCount, 6);
    assert.equal(submenuTelemetry.hasSubmenuDeployClass, true);
    assert.deepEqual(submenuTelemetry.subSliceKeys, [
      'doom_tag',
      'glass_doom',
      'doom_cig',
      'doom_watch',
      'blueberry_tag',
      'eye_tag',
    ]);
    assert.ok(submenuTelemetry.subReadoutText.includes('STICKER MATRIX'));
    assert.equal(
      submenuTelemetry.hubTextNodeCount,
      0,
      'Central PLATO DOOM hub must contain zero <text> nodes beneath the logo'
    );
    assert.deepEqual(submenuTelemetry.hubEmblemAttrs, {
      x: -60.48,
      y: -21.06,
      width: 120.96,
      height: 42.12,
    });
    assert.ok(
      Math.hypot(
        submenuTelemetry.hubEmblemAttrs.width / 2,
        submenuTelemetry.hubEmblemAttrs.height / 2
      ) < 73.44,
      'PLATO DOOM hub logo corner radius must stay strictly inside the protractor tick ring (r = 73.44)'
    );
    assert.equal(submenuTelemetry.settledSubPhase, 'open');
    assert.equal(submenuTelemetry.backFoldingPhase, 'submenu-folding');
    assert.equal(submenuTelemetry.backOpeningMenuId, 'main');
    assert.equal(submenuTelemetry.backOpeningDepth, 0);
    assert.equal(submenuTelemetry.backSettledPhase, 'open');
    assert.equal(submenuTelemetry.backSettledItemCount, 4);
    assert.equal(submenuTelemetry.submenuTransitionCount, 2);
    assert.equal(submenuTelemetry.stagePreservedAcrossSubmenu, true);
    console.log(
      '  ✓ Two-stage Fan-In -> Fan-Out submenu choreography (SPRAYPAINT <-> 6-Slice Sticker Radial) verified.'
    );

    // 2. Verify Screen-Size-Agnostic Responsive Sizing Across 7 Viewports (Portrait & Landscape)
    const testViewports = [
      { name: 'Desktop FHD (1920x1080)', width: 1920, height: 1080, minD: 340, maxD: 425, maxHeightRatio: 0.50 },
      { name: 'Desktop WXGA+ (1440x900)', width: 1440, height: 900, minD: 340, maxD: 425, maxHeightRatio: 0.52 },
      { name: 'Laptop Standard (1366x768)', width: 1366, height: 768, minD: 310, maxD: 390, maxHeightRatio: 0.52 },
      { name: 'Tablet Portrait (768x1024)', width: 768, height: 1024, minD: 310, maxD: 390, maxHeightRatio: 0.45 },
      { name: 'Mobile Portrait (390x844)', width: 390, height: 844, minD: 250, maxD: 330, maxHeightRatio: 0.45 },
      { name: 'Mobile Landscape (844x390)', width: 844, height: 390, minD: 250, maxD: 310, maxHeightRatio: 0.78 },
      { name: 'Compact Mobile (320x568)', width: 320, height: 568, minD: 245, maxD: 280, maxHeightRatio: 0.52 },
    ];

    for (const vp of testViewports) {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.waitForTimeout(60);

      const bounds = await page.evaluate(() => {
        const rm = window.sandbox.radialMenu;
        if (!rm.isOpen()) rm.open();
        return rm.getRenderedBounds();
      });

      assert.ok(bounds, `Expected renderedBounds on viewport ${vp.name}`);
      assert.ok(
        bounds.aspectDriftPx <= 1.0,
        `Aspect ratio drift ${bounds.aspectDriftPx}px exceeds 1.0px on ${vp.name}`
      );
      assert.ok(
        bounds.width >= vp.minD && bounds.width <= vp.maxD,
        `Menu diameter ${bounds.width.toFixed(1)}px out of target [${vp.minD}, ${vp.maxD}] on ${vp.name}`
      );
      assert.ok(
        bounds.heightViewportRatio <= vp.maxHeightRatio,
        `Menu height ratio ${bounds.heightViewportRatio} exceeds ${vp.maxHeightRatio} on ${vp.name}`
      );
      assert.ok(
        bounds.left >= 8 && bounds.top >= 8 && bounds.right <= vp.width - 8 && bounds.bottom <= vp.height - 8,
        `Menu overflows viewport bounds on ${vp.name}: ${JSON.stringify(bounds)}`
      );
      console.log(
        `  ✓ ${vp.name}: ${bounds.width.toFixed(1)}×${bounds.height.toFixed(1)} px (${(bounds.heightViewportRatio * 100).toFixed(1)}% vh, ${(bounds.widthViewportRatio * 100).toFixed(1)}% vw)`
      );
    }

    // 3. Verify Live Pointer Hit-Testing Across All 4 Main Slices & All 6 Submenu Slices, Deadzone & Outside Ring on Mobile (390x844) & Laptop (1366x768)
    for (const vp of [
      { width: 390, height: 844, label: 'Mobile 390x844' },
      { width: 1366, height: 768, label: 'Laptop 1366x768' },
    ]) {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.waitForTimeout(60);

      const hitResults = await page.evaluate(async () => {
        const rm = window.sandbox.radialMenu;
        rm.close();
        await new Promise((r) => setTimeout(r, 260));
        rm.open();
        await new Promise((r) => setTimeout(r, 340));

        const overlay = document.getElementById('cyber-radial-menu-overlay');
        let bounds = rm.getRenderedBounds();
        let outerRadiusCss = bounds.width / 2;
        let innerWedgeRadiusCss = (126 / 680) * bounds.width;
        let sampleSectorRadiusCss = innerWedgeRadiusCss + 16; // Just inside inner wedge boundary!

        // Test all 4 Main Menu slices (0, 1, 2, 3)
        const mainHoveredIndices = [];
        for (let i = 0; i < 4; i++) {
          const angleDeg = -90 + i * 90;
          const rad = (angleDeg * Math.PI) / 180;
          const clientX = bounds.cx + Math.cos(rad) * sampleSectorRadiusCss;
          const clientY = bounds.cy + Math.sin(rad) * sampleSectorRadiusCss;
          overlay.dispatchEvent(
            new PointerEvent('pointermove', { clientX, clientY, bubbles: true })
          );
          mainHoveredIndices.push(rm.getActiveIndex());
        }

        // Click Slice 3 (SPRAYPAINT at 180 deg) to enter the 6-slice Sticker Submenu
        rm.selectIndex(3);
        await new Promise((r) => setTimeout(r, 320));

        bounds = rm.getRenderedBounds();
        outerRadiusCss = bounds.width / 2;
        innerWedgeRadiusCss = (126 / 680) * bounds.width;
        sampleSectorRadiusCss = innerWedgeRadiusCss + 16;

        const hoveredIndices = [];
        for (let i = 0; i < 6; i++) {
          const angleDeg = -90 + i * 60;
          const rad = (angleDeg * Math.PI) / 180;
          const clientX = bounds.cx + Math.cos(rad) * sampleSectorRadiusCss;
          const clientY = bounds.cy + Math.sin(rad) * sampleSectorRadiusCss;
          overlay.dispatchEvent(
            new PointerEvent('pointermove', { clientX, clientY, bubbles: true })
          );
          hoveredIndices.push(rm.getActiveIndex());
        }

        // Move into deadzone (center)
        overlay.dispatchEvent(
          new PointerEvent('pointermove', {
            clientX: bounds.cx,
            clientY: bounds.cy,
            bubbles: true,
          })
        );
        const deadzoneActiveIndex = rm.getActiveIndex();

        // Click outside the outer ring -> should dismiss menu via cancelDeadzone()
        overlay.dispatchEvent(
          new PointerEvent('pointerdown', {
            clientX: bounds.cx + outerRadiusCss * 1.18,
            clientY: bounds.cy,
            bubbles: true,
          })
        );
        const openAfterOutsideClick = rm.isOpen();
        const phaseAfterOutsideClick = rm.getState().animationPhase;

        return {
          mainHoveredIndices,
          hoveredIndices,
          deadzoneActiveIndex,
          openAfterOutsideClick,
          phaseAfterOutsideClick,
        };
      });

      assert.deepEqual(
        hitResults.mainHoveredIndices,
        [0, 1, 2, 3],
        `All 4 Main Menu slices must resolve accurately on ${vp.label}`
      );
      assert.deepEqual(
        hitResults.hoveredIndices,
        [0, 1, 2, 3, 4, 5],
        `All 6 Sticker Submenu slices must resolve accurately near inner wedge boundary on ${vp.label}`
      );
      assert.equal(hitResults.deadzoneActiveIndex, null);
      assert.equal(
        hitResults.openAfterOutsideClick,
        false,
        `Outside-ring click must dismiss radial menu on ${vp.label}`
      );
      assert.equal(hitResults.phaseAfterOutsideClick, 'closing');
      console.log(`  ✓ Live scale-invariant pointer hit-testing (4 Main + 6 Sticker slices) & outside dismissal passed on ${vp.label}.`);
    }

    // 4. Verify Opening Main Menu -> Clicking SPRAYPAINT -> Selecting a Sticker Triggers Selection Surge, Closes Menu & Enters Sticker Placement Mode
    const selectionResult = await page.evaluate(async () => {
      const rm = window.sandbox.radialMenu;
      await new Promise((r) => setTimeout(r, 260));
      rm.open();
      await new Promise((r) => setTimeout(r, 340));

      // Verify fresh open after closing from submenu reset to Root 4-slice Main Menu
      const resetMenuId = rm.getState().activeMenuId;
      const resetDepth = rm.getState().menuDepth;

      const overlay = document.getElementById('cyber-radial-menu-overlay');
      const bounds = rm.getRenderedBounds();
      const payloadRadiusCss = (231 / 680) * bounds.width;

      // Click Slice 3 (SPRAYPAINT at 180 deg / 9 o'clock) to enter Sticker Submenu
      const sprayRad = (180 * Math.PI) / 180;
      overlay.dispatchEvent(
        new PointerEvent('pointerdown', {
          clientX: bounds.cx + Math.cos(sprayRad) * payloadRadiusCss,
          clientY: bounds.cy + Math.sin(sprayRad) * payloadRadiusCss,
          bubbles: true,
        })
      );

      // Wait for Fan-In (200ms) + Fan-Out start (150ms)
      await new Promise((r) => setTimeout(r, 350));

      // Click slice 1 (GLASS DOOM at -30 deg) inside the Sticker Submenu
      const rad = (-30 * Math.PI) / 180;
      const clientX = bounds.cx + Math.cos(rad) * payloadRadiusCss;
      const clientY = bounds.cy + Math.sin(rad) * payloadRadiusCss;

      overlay.dispatchEvent(
        new PointerEvent('pointerdown', { clientX, clientY, bubbles: true })
      );
      const confirmingDuringSurge = rm.getState().confirmingIndex;

      // Wait for SELECTION_CONFIRM_DURATION_MS (260ms)
      await new Promise((r) => setTimeout(r, 300));
      const finalState = rm.getState();
      const placementActive =
        window.sandbox.holographicStickers &&
        window.sandbox.holographicStickers.isPlacementActive();

      return {
        resetMenuId,
        resetDepth,
        confirmingDuringSurge,
        openAfterConfirm: finalState.open,
        lastSelectedKey: finalState.lastSelectedItem?.key,
        telRadialText: document.getElementById('tel-radial')?.textContent,
        placementActive,
      };
    });

    assert.equal(selectionResult.resetMenuId, 'main');
    assert.equal(selectionResult.resetDepth, 0);
    assert.equal(selectionResult.confirmingDuringSurge, 1);
    assert.equal(selectionResult.openAfterConfirm, false);
    assert.equal(selectionResult.lastSelectedKey, 'glass_doom');
    assert.equal(selectionResult.telRadialText, 'GLASS DOOM');
    assert.equal(selectionResult.placementActive, true);
    console.log('  ✓ Live Main Menu -> SPRAYPAINT -> Sticker selection surge & Placement Mode transition verified.');

    assert.equal(pageErrors.length, 0, `Unexpected page errors: ${pageErrors.join('; ')}`);
  } finally {
    await browser.close();
    server.close();
  }
}

async function main() {
  runHeadlessUnitSuite();
  await runLiveBrowserSuite();
  console.log('\nALL SPEC 051 RADIAL MENU HOLOGRAPHIC POP-UP & RESPONSIVE SIZING GATES PASSED.');
}

main().catch((err) => {
  console.error('Spec 051 verification failed:', err);
  process.exit(1);
});
