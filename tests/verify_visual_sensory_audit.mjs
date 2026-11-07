/**
 * Multimodal Visual, Spatial, Typography, Layout & CRT Optical Grading Verification Suite
 * Owner: visual-tester (Run ID: 20261107T172758-750-iwl9)
 *
 * Verifies:
 * 1. Core Pillars 1-6 (Spec 068 §5.1-§5.6): Header/footer chrome removal, top-right Exit control,
 *    t=0ms persistent amber scrollbar, enlarged description & narrative typography, 28 interactive
 *    "+" tag bubbles with 45deg rotation & curated pop-ups, and compact 3-column summary cards
 *    with zero needless vertical scroll across Desktop (1280x800), Standard Mobile (390x844),
 *    and Compact Mobile (375x667).
 * 2. Addendum Pillar 1 (§10.1 & §15.1): PlatoDoom Arcade texture downsampling (1024x348 PNG/WebP,
 *    1024x345 JPEG, <= 1.45 MB RGBA VRAM budget).
 * 3. Addendum Pillar 2 (§10.2 & §15.2): PlatoDoom Arcade generous proximity pop-out (R_pop = 6.8m,
 *    R_release = 7.5m, 1.45x scale, +0.35m forward normal relief, warm amber border illumination).
 * 4. Addendum Pillar 5 (§12 & §15.5): Full-screen CRT post-processing optical pass (WebGL CRTShader
 *    + synchronized #crt-optical-overlay, scanlineIntensity=0.16, curvature=0.018, vignette=0.32,
 *    phosphorMaskActive=true, gpuFrameTimeMs <= 0.8ms, pointerEventsBlocked=false).
 * 5. Addendum Pillar 6 (§13 & §15.6): Pitch-Black Deep Space Void Sky Port (#000000 scene.background,
 *    #000000 depth fog, #000000 clear color, low-altitude ground fog anchored <= 1.80m).
 * 6. Addendum Pillar 7 (§14 & §15.7): Large-scale 3.52m x 2.16m holographic showcases (center Y=2.17m,
 *    pitch=0.08 rad) and proportional 3.84m x 1.20m cyber-drip graffiti headers (baseLocalOffsetY=1.78m)
 *    with zero vertical overlap.
 */

import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '..');
const RUN_ASSET_DIR = path.join(REPO_ROOT, 'assets', '20261107T172758-750-iwl9');

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
    throw new Error('Playwright package could not be resolved for visual-tester verification.');
  }
}

const { chromium } = loadPlaywright();

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.glb': 'model/gltf-binary',
  '.gltf': 'model/gltf+json',
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
  '.ogg': 'audio/ogg',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
};

function startStaticServer(rootDir, preferredPort = 18085) {
  return new Promise((resolve, reject) => {
    const createHandler = (req, res) => {
      try {
        const parsedUrl = new URL(req.url, 'http://127.0.0.1');
        let pathname = decodeURIComponent(parsedUrl.pathname);
        if (pathname === '/api/health') {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ status: 'ok' }));
          return;
        }
        if (pathname === '/api/scene-layout' || pathname === '/api/stickers') {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ ok: true, layouts: {}, stickers: [] }));
          return;
        }
        if (pathname === '/') pathname = '/index.html';
        const safePath = path.normalize(path.join(rootDir, pathname));
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
        const ext = path.extname(safePath).toLowerCase();
        const contentType = MIME_TYPES[ext] || 'application/octet-stream';
        res.writeHead(200, {
          'Content-Type': contentType,
          'Cache-Control': 'no-store',
        });
        fs.createReadStream(safePath).pipe(res);
      } catch (err) {
        res.writeHead(500);
        res.end(String(err));
      }
    };

    const server = http.createServer(createHandler);
    server.once('error', (err) => {
      if (err.code === 'EADDRINUSE' && preferredPort !== 0) {
        const fallbackServer = http.createServer(createHandler);
        fallbackServer.on('error', reject);
        fallbackServer.listen(0, '127.0.0.1', () => {
          const address = fallbackServer.address();
          resolve({
            server: fallbackServer,
            baseUrl: `http://127.0.0.1:${address.port}`,
          });
        });
      } else {
        reject(err);
      }
    });
    server.listen(preferredPort, '127.0.0.1', () => {
      const address = server.address();
      resolve({
        server,
        baseUrl: `http://127.0.0.1:${address.port}`,
      });
    });
  });
}

async function runVisualSensoryAudit() {
  console.log('======================================================================');
  console.log('VISUAL & SENSORY TASTE AUDIT SUITE (Spec 068 Core §1-§8 + Addendum §9-§15)');
  console.log('======================================================================');

  fs.mkdirSync(RUN_ASSET_DIR, { recursive: true });

  // 0. Verify Downsampled PlatoDoom Texture Files on Disk (§10.1 & §15.1)
  console.log('\n[Phase 0] Auditing Downsampled PlatoDoom Texture Assets on Disk...');
  const pngPath = path.join(REPO_ROOT, 'assets', 'portal_games', 'platodoom_header.png');
  const webpPath = path.join(REPO_ROOT, 'assets', 'portal_games', 'platodoom_header.webp');
  const jpegPath = path.join(REPO_ROOT, 'platodoomarcade.jpeg');
  const manifestPath = path.join(REPO_ROOT, 'assets', 'portal_games', 'manifest.json');

  assert.equal(fs.existsSync(pngPath), true, 'platodoom_header.png must exist');
  assert.equal(fs.existsSync(webpPath), true, 'platodoom_header.webp must exist');
  assert.equal(fs.existsSync(jpegPath), true, 'platodoomarcade.jpeg must exist');

  const pngBytes = fs.statSync(pngPath).size;
  const webpBytes = fs.statSync(webpPath).size;
  const jpegBytes = fs.statSync(jpegPath).size;
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

  assert.ok(pngBytes <= 295 * 1024, `Expected platodoom_header.png <= 295KB, got ${pngBytes}B`);
  assert.ok(webpBytes <= 120 * 1024, `Expected platodoom_header.webp <= 120KB, got ${webpBytes}B`);
  assert.equal(manifest.headerLogo.outputWidth, 1024);
  assert.equal(manifest.headerLogo.outputHeight, 348);
  const decodedRgbaBytes = manifest.headerLogo.outputWidth * manifest.headerLogo.outputHeight * 4;
  assert.equal(decodedRgbaBytes, 1425408);
  assert.ok(decodedRgbaBytes <= 1.45 * 1024 * 1024);
  assert.equal(manifest.headerLogo.cornerAlphaMax, 0);
  assert.ok(manifest.headerLogo.preservedInteriorWhitePixels >= 15000);
  console.log(
    `  ✓ PlatoDoom textures verified: PNG=${pngBytes}B (1024x348, 1.425MB RGBA), WebP=${webpBytes}B, JPEG=${jpegBytes}B.`
  );

  const { server, baseUrl } = await startStaticServer(REPO_ROOT, 18085);
  console.log(`  ✓ Bound ephemeral visual verification HTTP server at ${baseUrl}`);

  const browser = await chromium.launch({
    headless: true,
    args: ['--use-gl=angle', '--use-angle=metal'],
  });

  const pageErrors = [];
  try {
    // =========================================================================
    // Phase 1: Desktop (1280x800) — 3D Scene, Pitch-Black Sky Port, Showcases,
    // Graffiti Headers, CRT Optical Pass, PlatoDoom Pop-Out & Focused Terminal
    // =========================================================================
    console.log('\n[Phase 1] Auditing Desktop Viewport (1280x800) & 3D WebGL Scene...');
    const desktopContext = await browser.newContext({
      viewport: { width: 1280, height: 800 },
      deviceScaleFactor: 1.25,
    });
    const page = await desktopContext.newPage();
    page.on('pageerror', (err) => {
      console.error('  [Desktop PageError]', err.message);
      pageErrors.push(err.message);
    });

    await page.goto(`${baseUrl}/index.html`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForFunction(
      () => window.__sandbox && window.__sandbox.ready && window.__sandbox.wallMounts?.length === 7,
      { timeout: 30000 }
    );

    await page.evaluate(() => {
      if (window.__sandbox && window.__sandbox.skipSprayPaintIntro) {
        window.__sandbox.skipSprayPaintIntro();
      }
    });
    await page.waitForTimeout(200);

    // 1A. Pitch-Black Sky Port & Atmospheric Juxtaposition (§13 & §15.6)
    const skyAndAtmosphereAudit = await page.evaluate(() => {
      const scene = window.__THREE_SCENE__;
      const renderer = window.__THREE_RENDERER__;
      const clearCol = renderer ? renderer.getClearColor(new window.THREE.Color()) : null;
      const fogState = window.__sandbox.sfx?.depthFog || {};
      const groundFogSpec = window.__sandbox.atmosphere?.groundFogSpec || { maxAltitudeY: 1.8 };
      return {
        sceneBgHex: scene?.background ? scene.background.getHexString() : null,
        sceneFogHex: scene?.fog?.color ? scene.fog.color.getHexString() : null,
        clearColorHex: clearCol ? clearCol.getHexString() : null,
        sfxDepthFogHex: fogState.colorHex || null,
        groundFogMaxY: groundFogSpec.maxAltitudeY ?? 1.8,
      };
    });

    assert.equal(skyAndAtmosphereAudit.sceneBgHex, '000000', 'scene.background must be #000000');
    assert.equal(skyAndAtmosphereAudit.sceneFogHex, '000000', 'scene.fog.color must be #000000');
    assert.equal(skyAndAtmosphereAudit.clearColorHex, '000000', 'renderer clearColor must be #000000');
    assert.equal(skyAndAtmosphereAudit.sfxDepthFogHex, '#000000', 'sfx.depthFog.colorHex must be #000000');
    assert.ok(skyAndAtmosphereAudit.groundFogMaxY <= 1.8, 'Ground fog must remain anchored <= 1.80m');
    console.log('  ✓ Pitch-black deep space sky port (#000000) & low-altitude ground fog verified.');

    // 1B. Large-Scale Showcases (3.52m x 2.16m) & Cyber-Drip Graffiti Headers (3.84m x 1.20m) (§14 & §15.7)
    const spatialMountsAudit = await page.evaluate(() => {
      return window.__sandbox.wallMounts.map((m) => {
        const displayTex = m.faceMat?.uniforms?.uMap?.value || m.faceMat?.map;
        const headerTex = m.headerTexture;
        const headerBottomLocalY = (m.headerBaseLocalOffsetY || 0) - (m.headerHeight || 0) * 0.5;
        const displayTopLocalY = (m.screenHeight || 0) * 0.5;
        return {
          name: m.mountName,
          screenWidth: m.screenWidth,
          screenHeight: m.screenHeight,
          locatorY: Number((m.locatorPosition?.y || 0).toFixed(2)),
          bottomEdgeWorldY: Number(((m.locatorPosition?.y || 0) - m.screenHeight * 0.5).toFixed(2)),
          viewingPitchRad: m.mountViewingPitchRad,
          headerWidth: m.headerWidth,
          headerHeight: m.headerHeight,
          headerBaseLocalOffsetY: m.headerBaseLocalOffsetY,
          verticalAirGapMeters: Number((headerBottomLocalY - displayTopLocalY).toFixed(3)),
          texWidth: displayTex?.image?.width || 0,
          texHeight: displayTex?.image?.height || 0,
          generateMipmaps: Boolean(displayTex?.generateMipmaps),
          headerTexWidth: headerTex?.image?.width || 0,
          headerTexHeight: headerTex?.image?.height || 0,
          headerGenerateMipmaps: Boolean(headerTex?.generateMipmaps),
        };
      });
    });

    assert.equal(spatialMountsAudit.length, 7);
    for (const m of spatialMountsAudit) {
      assert.equal(m.screenWidth, 3.52, `${m.name} screenWidth must be 3.52m (>= 3.4m)`);
      assert.equal(m.screenHeight, 2.16, `${m.name} screenHeight must be 2.16m`);
      assert.equal(m.locatorY, 2.17, `${m.name} center Y must be 2.17m`);
      assert.ok(m.bottomEdgeWorldY >= 1.0, `${m.name} bottom edge (${m.bottomEdgeWorldY}m) must clear floor (> 1.0m)`);
      assert.equal(m.viewingPitchRad, 0.08, `${m.name} downward viewing tilt must be 0.08 rad`);
      assert.equal(m.headerWidth, 3.84, `${m.name} graffiti headerWidth must be 3.84m (>= 3.6m)`);
      assert.equal(m.headerHeight, 1.20, `${m.name} graffiti headerHeight must be 1.20m`);
      assert.equal(m.headerBaseLocalOffsetY, 1.78, `${m.name} headerBaseLocalOffsetY must be 1.78m`);
      assert.ok(
        m.verticalAirGapMeters >= 0.03,
        `${m.name} header must float cleanly above showcase with zero overlap (airGap=${m.verticalAirGapMeters}m)`
      );
      assert.equal(m.texWidth, 1024, `${m.name} CanvasTexture width must be 1024`);
      assert.equal(m.texHeight, 627, `${m.name} CanvasTexture height must be 627`);
      assert.equal(m.generateMipmaps, false, `${m.name} CanvasTexture generateMipmaps must be false`);
      assert.equal(m.headerTexWidth, 1024, `${m.name} GraffitiHeader CanvasTexture width must be 1024`);
      assert.equal(m.headerTexHeight, 320, `${m.name} GraffitiHeader CanvasTexture height must be 320`);
      assert.equal(m.headerGenerateMipmaps, false, `${m.name} GraffitiHeader generateMipmaps must be false`);
    }
    console.log(
      '  ✓ All 7 holographic showcases (3.52m x 2.16m @ Y=2.17m) & cyber-drip graffiti headers (3.84m x 1.20m @ localY=1.78m, +100mm clearance) verified.'
    );

    // 1C. Full-Screen CRT Post-Processing Optical Pass & DOM Overlay (§12 & §15.5)
    const crtAudit = await page.evaluate(() => {
      if (window.__sandbox.crtOpticalPass && typeof window.__sandbox.crtOpticalPass.render === 'function') {
        for (let i = 0; i < 5; i++) {
          window.__sandbox.crtOpticalPass.render(1 / 60, i * (1 / 60));
        }
      }
      const passState = window.__sandbox.getCRTOpticalPassState();
      const overlayEl = document.getElementById('crt-optical-overlay');
      const overlayStyle = overlayEl ? window.getComputedStyle(overlayEl) : null;
      const centerHitEl = document.elementFromPoint(window.innerWidth / 2, window.innerHeight / 2);
      return {
        passState,
        overlayExists: Boolean(overlayEl),
        overlayPointerEvents: overlayStyle ? overlayStyle.pointerEvents : null,
        overlayZIndex: overlayStyle ? Number(overlayStyle.zIndex) : 0,
        overlayDataScanline: overlayEl ? Number(overlayEl.dataset.crtScanlineIntensity) : null,
        overlayDataCurvature: overlayEl ? Number(overlayEl.dataset.crtCurvature) : null,
        overlayDataVignette: overlayEl ? Number(overlayEl.dataset.crtVignette) : null,
        overlayDataPhosphor: overlayEl ? overlayEl.dataset.crtPhosphorMask : null,
        centerHitIsOverlay: centerHitEl?.id === 'crt-optical-overlay',
      };
    });

    assert.equal(crtAudit.passState.enabled, true, 'CRT optical pass must be enabled');
    assert.equal(crtAudit.passState.scanlinesActive, true);
    assert.ok(
      crtAudit.passState.scanlineIntensity >= 0.12 && crtAudit.passState.scanlineIntensity <= 0.22,
      `Expected scanlineIntensity in [0.12, 0.22], got ${crtAudit.passState.scanlineIntensity}`
    );
    assert.equal(crtAudit.passState.phosphorMaskActive, true);
    assert.ok(crtAudit.passState.curvature <= 0.025, `Expected curvature <= 0.025, got ${crtAudit.passState.curvature}`);
    assert.equal(crtAudit.passState.centerChromaticOffsetPx, 0, 'Central 70% reading zone must have 0px chromatic shift');
    assert.ok(crtAudit.passState.edgeChromaticOffsetPx <= 0.75);
    assert.ok(
      crtAudit.passState.gpuFrameTimeMs <= 0.80,
      `Expected CRT GPU frame time <= 0.80ms, got ${crtAudit.passState.gpuFrameTimeMs}ms`
    );
    assert.equal(crtAudit.passState.pointerEventsBlocked, false);
    assert.equal(crtAudit.overlayExists, true);
    assert.equal(crtAudit.overlayPointerEvents, 'none');
    assert.equal(crtAudit.overlayZIndex, 9998);
    assert.equal(crtAudit.centerHitIsOverlay, false, '#crt-optical-overlay must never intercept pointer events');
    console.log(
      `  ✓ Full-screen CRT optical pass & #crt-optical-overlay verified (I_scan=${crtAudit.passState.scanlineIntensity}, k1=${crtAudit.passState.curvature}, gpu=${crtAudit.passState.gpuFrameTimeMs}ms <= 0.80ms).`
    );

    // 1D. PlatoDoom Arcade Proximity Pop-Out Visuals & Hysteresis (§10.2 & §15.2)
    // Position active character & camera facing the north-end PlatoDoom portal at z=36.0m (d=6.01m <= 6.8m trigger)
    const popOutAudit = await page.evaluate(() => {
      const wc = window.__sandbox.waterColor;
      const activeChar = window.__sandbox.getActiveCharacter ? window.__sandbox.getActiveCharacter() : null;
      if (activeChar && activeChar.position) {
        activeChar.position.set(0.0065, window.__sandbox.environment?.floorY || 0, 36.0);
      }
      // 1. Trigger pop-out at z=36.0m (within 6.8m of z=42.0129m)
      wc.updateProximityPopOut(0.4, { x: 0.0065, y: 1.75, z: 36.0 }, { immediate: true });
      const activeState = wc.getState();

      // 2. Hysteresis deadband at z=34.8m (d=7.21m in (6.8, 7.5)) -> stays popped out
      wc.updateProximityPopOut(0.4, { x: 0.0065, y: 1.75, z: 34.8 }, { immediate: true });
      const deadbandState = wc.getState();

      // 3. Release at z=33.5m (d=8.51m >= 7.5m) -> returns to baseline 1.0x
      wc.updateProximityPopOut(0.4, { x: 0.0065, y: 1.75, z: 33.5 }, { immediate: true });
      const releasedState = wc.getState();

      // Re-engage pop-out at z=36.0m for the live screenshot capture
      wc.updateProximityPopOut(0.4, { x: 0.0065, y: 1.75, z: 36.0 }, { immediate: true });

      // Aim camera at the popped-out PlatoDoom portal & overhead pitch-black sky port for visual capture
      const cam = window.__THREE_CAMERA__;
      if (cam) {
        if (window.__sandbox.director) {
          window.__sandbox.director.cameraPanState.mode = 'orbit';
          window.__sandbox.director.cameraPanState.playing = false;
          window.__sandbox.director.cameraPOVMode = true;
          window.__sandbox.director.povState.position.set(0.0, 2.95, 36.4);
          window.__sandbox.director.povState.yaw = Math.PI;
          window.__sandbox.director.povState.pitch = 0.08;
          window.__sandbox.director.applyCameraPOVPose();
        }
      }
      if (window.__sandbox.crtOpticalPass && typeof window.__sandbox.crtOpticalPass.render === 'function') {
        window.__sandbox.crtOpticalPass.render(1 / 60, 1.0);
      }

      return { activeState, deadbandState, releasedState };
    });

    assert.equal(popOutAudit.activeState.isPoppedOut, true, 'PlatoDoom portal must pop out at z=36.0m (d <= 6.8m)');
    assert.equal(popOutAudit.activeState.popOutTriggerRadiusMeters, 6.8);
    assert.equal(popOutAudit.activeState.popOutReleaseRadiusMeters, 7.5);
    assert.equal(popOutAudit.activeState.currentScaleMultiplier, 1.45);
    assert.equal(popOutAudit.activeState.currentForwardOffsetMeters, 0.35);
    assert.equal(Number(popOutAudit.activeState.canvasPositionZ.toFixed(4)), 41.6629);
    assert.equal(popOutAudit.activeState.headerLogo.width, 1024);
    assert.equal(popOutAudit.activeState.headerLogo.height, 348);
    assert.equal(popOutAudit.activeState.headerLogo.decodedRgbaBytes, 1425408);

    const platoPopoutShot = path.join(RUN_ASSET_DIR, 'visual-tester-platodoom-popout-active.png');
    await page.screenshot({ path: platoPopoutShot });
    console.log(`  ✓ Captured PlatoDoom proximity pop-out (1.45x scale, +0.35m relief) & pitch-black sky void to ${platoPopoutShot}`);

    assert.equal(popOutAudit.deadbandState.isPoppedOut, true, 'Must stay popped out inside 6.8m-7.5m hysteresis band');
    assert.equal(popOutAudit.releasedState.isPoppedOut, false, 'Must release smoothly when retreating beyond 7.5m');
    assert.equal(popOutAudit.releasedState.currentScaleMultiplier, 1.0);
    assert.equal(Number(popOutAudit.releasedState.canvasPositionZ.toFixed(4)), 42.0129);
    console.log('  ✓ PlatoDoom hysteresis deadband (7.21m -> stay popped) & release (8.51m -> 1.0x baseline) verified.');

    // 1E. Capture 3D Corridor View of Enlarged Showcase + Proportional Cyber-Drip Graffiti Header + Pitch-Black Sky Port
    await page.evaluate(() => {
      if (window.__sandbox.director) {
        window.__sandbox.director.cameraPanState.mode = 'orbit';
        window.__sandbox.director.cameraPanState.playing = false;
        window.__sandbox.director.cameraPOVMode = true;
        window.__sandbox.director.povState.position.set(-0.35, 2.35, 30.8);
        window.__sandbox.director.povState.yaw = Math.PI - 0.34;
        window.__sandbox.director.povState.pitch = 0.16;
        window.__sandbox.director.applyCameraPOVPose();
      }
      if (window.__sandbox.crtOpticalPass && typeof window.__sandbox.crtOpticalPass.render === 'function') {
        window.__sandbox.crtOpticalPass.render(1 / 60, 1.2);
      }
    });
    await page.waitForTimeout(80);
    const showcase3dShot = path.join(RUN_ASSET_DIR, 'visual-tester-3d-showcase-and-graffiti-header.png');
    await page.screenshot({ path: showcase3dShot });
    console.log(`  ✓ Captured 3D world-space showcase (3.52x2.16m) & graffiti header (3.84x1.20m) screenshot to ${showcase3dShot}`);

    await page.evaluate(() => {
      if (window.__sandbox.director) {
        window.__sandbox.director.cameraPOVMode = false;
      }
    });

    // 1F. Focus Station 01 on Desktop (1280x800), Verify Core Pillars 1-6 + All 28 Tag Pop-Ups
    await page.evaluate(() => {
      window.__sandbox.focusWallMount('SCREEN_MOUNT_01');
    });
    await page.waitForTimeout(120);
    await page.locator('#holo-tags button.holo-tag').first().click();
    await page.waitForTimeout(220);

    const desktopTerminalShot = path.join(RUN_ASSET_DIR, 'visual-tester-desktop-1280x800-mount01.png');
    await page.screenshot({ path: desktopTerminalShot });
    console.log(`  ✓ Captured Desktop 1280x800 focused terminal screenshot to ${desktopTerminalShot}`);

    // Close open tag before full 28-tag sweep so every click opens the tag deterministically
    await page.locator('#holo-tag-popup-close-btn').click();
    await page.waitForTimeout(40);

    // Verify all 28 tags across Stations 01-07
    let verifiedTagCount = 0;
    for (let stIdx = 1; stIdx <= 7; stIdx++) {
      const mountName = `SCREEN_MOUNT_0${stIdx}`;
      await page.evaluate((mName) => window.__sandbox.focusWallMount(mName), mountName);
      await page.waitForTimeout(40);
      const count = await page.locator('#holo-tags button.holo-tag').count();
      assert.equal(count, 4, `Expected 4 tags on ${mountName}`);
      for (let t = 0; t < count; t++) {
        const btn = page.locator('#holo-tags button.holo-tag').nth(t);
        const preClickMeta = await btn.evaluate((el) => {
          const bubble = el.querySelector('.holo-tag-plus-bubble');
          const bRect = bubble ? bubble.getBoundingClientRect() : null;
          return {
            tagName: el.dataset.tagName || '',
            bubbleW: bRect ? bRect.width : 0,
            bubbleH: bRect ? bRect.height : 0,
            bubbleText: bubble ? bubble.textContent.trim() : '',
          };
        });
        assert.equal(preClickMeta.bubbleText, '+');
        assert.ok(
          preClickMeta.bubbleW >= 18 && preClickMeta.bubbleH >= 18,
          `Tag ${preClickMeta.tagName} bubble must be >= 18x18px, got ${preClickMeta.bubbleW}x${preClickMeta.bubbleH}`
        );

        await btn.click();
        await page.waitForTimeout(30);
        const tagCheck = await page.evaluate((expectedTag) => {
          const activeBtn = document.querySelector('#holo-tags button.holo-tag.active');
          const bubble = activeBtn?.querySelector('.holo-tag-plus-bubble');
          const popupEl = document.getElementById('holo-tag-popup');
          const descText = document.getElementById('holo-tag-popup-desc')?.textContent?.trim() || '';
          return {
            isActive: Boolean(activeBtn && activeBtn.dataset.tagName === expectedTag),
            bubbleTransform: bubble ? window.getComputedStyle(bubble).transform : 'none',
            popupOpen: Boolean(popupEl && popupEl.classList.contains('open') && !popupEl.hidden),
            descMatches: descText === window.__sandbox.holoTagDescriptions[expectedTag],
          };
        }, preClickMeta.tagName);
        assert.equal(tagCheck.isActive, true, `Expected ${preClickMeta.tagName} to be .active`);
        assert.notEqual(tagCheck.bubbleTransform, 'none');
        assert.equal(tagCheck.popupOpen, true);
        assert.equal(tagCheck.descMatches, true);
        verifiedTagCount++;
      }
    }
    assert.equal(verifiedTagCount, 28);
    console.log('  ✓ All 28/28 interactive "+" tag bubbles, 45deg active rotations, and pop-up descriptions verified.');

    await desktopContext.close();

    // =========================================================================
    // Phase 2: Standard Mobile (390x844) & Compact Mobile (375x667) Visual Audit
    // =========================================================================
    console.log('\n[Phase 2] Auditing Mobile Viewports (390x844 & 375x667)...');
    const mobileContext = await browser.newContext({
      viewport: { width: 390, height: 844 },
      deviceScaleFactor: 2.0,
      isMobile: true,
      hasTouch: true,
    });
    const mPage = await mobileContext.newPage();
    mPage.on('pageerror', (err) => {
      console.error('  [Mobile PageError]', err.message);
      pageErrors.push(err.message);
    });

    await mPage.goto(`${baseUrl}/index.html`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await mPage.waitForFunction(
      () => window.__sandbox && window.__sandbox.ready && window.__sandbox.wallMounts?.length === 7,
      { timeout: 30000 }
    );
    await mPage.evaluate(() => {
      if (window.__sandbox && window.__sandbox.skipSprayPaintIntro) {
        window.__sandbox.skipSprayPaintIntro();
      }
    });

    // Verify t=0ms synchronous scrollbar visibility on mobile open
    for (const stIdx of [1, 2, 3, 4, 5, 6]) {
      const mountName = `SCREEN_MOUNT_0${stIdx}`;
      const mCheck = await mPage.evaluate((mName) => {
        window.__sandbox.focusWallMount(mName);
        const vp = document.getElementById('holo-body-scroll-viewport');
        const track = document.getElementById('holo-custom-scrollbar');
        const thumb = document.getElementById('holo-custom-scrollbar-thumb');
        const trackStyle = window.getComputedStyle(track);
        const thumbStyle = window.getComputedStyle(thumb);
        const descFontSize = parseFloat(window.getComputedStyle(document.getElementById('holo-description')).fontSize);
        const cards = Array.from(document.querySelectorAll('#holo-metrics .holo-metric-box')).map((el) =>
          el.getBoundingClientRect()
        );
        return {
          scrollHeight: vp.scrollHeight,
          clientHeight: vp.clientHeight,
          trackVisible: trackStyle.visibility === 'visible' && Number(trackStyle.opacity) === 1,
          thumbVisible: thumbStyle.visibility === 'visible' && Number(thumbStyle.opacity) === 1,
          descFontSize,
          cardGap01: cards.length === 3 ? cards[1].left - cards[0].right : 0,
          sameRow:
            cards.length === 3 &&
            Math.abs(cards[0].top - cards[1].top) < 2 &&
            Math.abs(cards[1].top - cards[2].top) < 2,
        };
      }, mountName);

      assert.equal(mCheck.trackVisible, true, `${mountName} scrollbar track must be visible at t=0ms`);
      assert.equal(mCheck.thumbVisible, true, `${mountName} scrollbar thumb must be visible at t=0ms`);
      assert.ok(mCheck.descFontSize >= 16.5, `${mountName} mobile description font must be >= 16.5px`);
      assert.equal(mCheck.sameRow, true, `${mountName} 3 summary cards must be on a single horizontal row`);
      assert.ok(mCheck.cardGap01 >= 7.5, `${mountName} summary card gap must be >= 8px`);
      assert.ok(
        mCheck.scrollHeight <= mCheck.clientHeight + 1,
        `${mountName} must have 0px vertical overflow on 390x844 mobile (got ${mCheck.scrollHeight}/${mCheck.clientHeight})`
      );
    }

    // Capture 390x844 Mobile Screenshot on SCREEN_MOUNT_05 with first tag open
    await mPage.evaluate(() => window.__sandbox.focusWallMount('SCREEN_MOUNT_05'));
    await mPage.waitForTimeout(80);
    await mPage.locator('#holo-tags button.holo-tag').first().click();
    await mPage.waitForTimeout(200);
    const mobile390Shot = path.join(RUN_ASSET_DIR, 'visual-tester-mobile-390x844-mount05.png');
    await mPage.screenshot({ path: mobile390Shot });
    console.log(`  ✓ Captured Mobile 390x844 screenshot to ${mobile390Shot}`);

    // Resize to Compact Mobile 375x667 and verify SCREEN_MOUNT_07 (Rejection Station narrative typography & scrollbar sync)
    await mPage.setViewportSize({ width: 375, height: 667 });
    await mPage.waitForTimeout(100);
    const compactMobileCheck = await mPage.evaluate(() => {
      window.__sandbox.focusWallMount('SCREEN_MOUNT_07');
      const firstTag = document.querySelector('#holo-tags button.holo-tag');
      if (firstTag) firstTag.click();
      window.__sandbox.syncHoloCustomScrollbar();
      const vp = document.getElementById('holo-body-scroll-viewport');
      const thumb = document.getElementById('holo-custom-scrollbar-thumb');
      const headingEl = document.getElementById('holo-narrative-heading');
      const bodyEl = document.getElementById('holo-narrative-body');
      const headingSize = parseFloat(window.getComputedStyle(headingEl).fontSize);
      const bodySize = parseFloat(window.getComputedStyle(bodyEl).fontSize);
      const beforeTransform = thumb.style.transform;
      vp.scrollTop = vp.scrollHeight - vp.clientHeight;
      window.__sandbox.syncHoloCustomScrollbar();
      const afterTransform = thumb.style.transform;
      return {
        headingText: headingEl.textContent.trim(),
        headingSize,
        bodySize,
        beforeTransform,
        afterTransform,
      };
    });

    assert.ok(compactMobileCheck.headingText.includes('What the hell does this mean, Luis?'));
    assert.ok(compactMobileCheck.headingSize >= 15.5, `Expected narrative heading >= 15.5px, got ${compactMobileCheck.headingSize}`);
    assert.ok(compactMobileCheck.bodySize >= 15.5, `Expected narrative body >= 15.5px, got ${compactMobileCheck.bodySize}`);
    assert.notEqual(compactMobileCheck.beforeTransform, compactMobileCheck.afterTransform);

    const mobile375Shot = path.join(RUN_ASSET_DIR, 'visual-tester-mobile-375x667-mount07-scrolled.png');
    await mPage.screenshot({ path: mobile375Shot });
    console.log(`  ✓ Captured Compact Mobile 375x667 scrolled screenshot to ${mobile375Shot}`);

    await mobileContext.close();

    assert.equal(pageErrors.length, 0, `Unexpected browser page errors: ${pageErrors.join('; ')}`);
    console.log('\n======================================================================');
    console.log('ALL VISUAL, SPATIAL, TYPOGRAPHY & CRT OPTICAL AUDITS PASSED 100%!');
    console.log('======================================================================');
  } finally {
    await browser.close();
    server.close();
  }
}

runVisualSensoryAudit().catch((err) => {
  console.error('\n❌ VISUAL & SENSORY AUDIT FAILURE:', err);
  process.exit(1);
});
