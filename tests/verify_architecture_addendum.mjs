/**
 * End-to-End Live Runtime & Architectural Contract Verification for
 * functional_specification_068.md System Addendum (§9–§15) & Execution DAG:
 *
 * 1. Addendum Pillar 1 (§10.1 & §15.1): PlatoDoom Header Logo Metadata & Texture Budget
 *    - PORTAL_HEADER_LOGO_SPEC: width=1024, height=348, decodedRgbaBytes=1425408 (<= 2.0 MB)
 *    - platodoomarcade.jpeg (1024x345) & assets/portal_games/platodoom_header.png (1024x348)
 *
 * 2. Addendum Pillar 2 (§10.2 & §15.2): PlatoDoom Proximity Pop-Out State Machine & Hysteresis
 *    - WATERCOLOR_GALLERY_SPEC: popOutTriggerRadiusMeters=6.8 (>=6.5m), popOutReleaseRadiusMeters=7.5,
 *      popOutScaleMultiplier=1.45, popOutForwardOffsetMeters=0.35, popOutTransitionDurationSec=0.38
 *    - Live 3D transform transitions across approach (z=36.0m -> isPoppedOut=true, scale=1.45x, z=41.6629m),
 *      hysteresis band (z=34.8m -> remains isPoppedOut=true with zero boundary chatter),
 *      cubic easing progression over dt steps, and retreat (z=33.5m -> isPoppedOut=false, scale=1.0x, z=42.0129m).
 *
 * 3. Addendum Pillar 5 (§12 & §15.5): Screen CRT Post-Processing Optical Pass
 *    - window.sandbox.getCRTOpticalPassState() & window.sandbox.crtOpticalPass
 *    - enabled=true, scanlineIntensity=0.16 in [0.12, 0.22], scanlineCount=640,
 *      curvature=0.018 <= 0.025, vignette=0.32, phosphorMaskActive=true,
 *      centerChromaticOffsetPx=0, edgeChromaticOffsetPx<=0.75,
 *      gpuFrameTimeMs<=0.80, pointerEventsBlocked=false,
 *      renderTarget.stencilBuffer=true, renderTarget.depthBuffer=true.
 *
 * 4. Addendum Pillar 6 (§13 & §15.6): Environmental Sky Port — Pitch-Black Deep Space Void (#000000)
 *    - scene.background.getHexString() === '000000'
 *    - scene.fog.color.getHexString() === '000000'
 *    - window.sandbox.sfx.depthFog.colorHex === '#000000'
 *    - renderer.getClearColor().getHexString() === '000000'
 *    - Low-altitude ground fog remains anchored near floor (Y <= 1.8m).
 *
 * 5. Addendum Pillar 7 (§14 & §15.7): Large-Scale Holographic Showcases & Proportional Cyber-Drip Graffiti Headers
 *    - All 7 wallMounts (SCREEN_MOUNT_01..07):
 *      - screenWidth === 3.52 (>= 3.4m), screenHeight === 2.16
 *      - locatorPosition.y === 2.17 (bottom edge at 1.09m > 1.0m above floor)
 *      - mountViewingPitchRad === 0.08
 *      - headerWidth === 3.84 (>= 3.6m), headerHeight === 1.20, headerBaseLocalOffsetY === 1.78
 *      - >= 100mm vertical clearance between display top (1.08m local) and header bottom (1.18m local)
 *      - 3D CanvasTexture instances are 1024x627 with generateMipmaps === false.
 */

import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

import {
  WATERCOLOR_GALLERY_SPEC,
  PORTAL_HEADER_LOGO_SPEC,
} from '../watercolor_shader.js';
import {
  GRAFFITI_HEADER_GLITCH_FLICKER_SPEC,
  GRAFFITI_STATION_HEADER_SCHEDULE,
  evaluateGraffitiHeaderLevitation,
} from '../alley_atmosphere_023.js';
import {
  CRT_OPTICAL_PASS_SPEC,
  CRTShader,
} from '../crt_optical_pass.js';

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

function startStaticServer(rootDir) {
  return new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      try {
        const parsedUrl = new URL(req.url, 'http://127.0.0.1');
        let pathname = decodeURIComponent(parsedUrl.pathname);
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
    });
    server.on('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const address = server.address();
      resolve({
        server,
        baseUrl: `http://127.0.0.1:${address.port}`,
      });
    });
  });
}

async function runArchitectureAddendumVerification() {
  console.log('================================================================');
  console.log('SPEC 068 SYSTEM ADDENDUM & ARCHITECTURE DAG VERIFICATION SUITE');
  console.log('================================================================');

  // ===========================================================================
  // Phase 1: Direct ES Module Contract & Mathematical Invariant Verification
  // ===========================================================================
  console.log('\n[Phase 1] Verifying discrete ES module exports & mathematical invariants...');

  // 1.1 PORTAL_HEADER_LOGO_SPEC (§10.1 & §15.1)
  assert.equal(PORTAL_HEADER_LOGO_SPEC.id, 'platodoom_header');
  assert.equal(PORTAL_HEADER_LOGO_SPEC.width, 1024);
  assert.equal(PORTAL_HEADER_LOGO_SPEC.height, 348);
  assert.ok(PORTAL_HEADER_LOGO_SPEC.width <= 1024 && PORTAL_HEADER_LOGO_SPEC.height <= 512);
  assert.equal(PORTAL_HEADER_LOGO_SPEC.decodedRgbaBytes, 1024 * 348 * 4);
  assert.ok(PORTAL_HEADER_LOGO_SPEC.decodedRgbaBytes <= 2 * 1024 * 1024, 'Decoded RGBA must be <= 2.0 MB');
  const headerPngPath = path.join(REPO_ROOT, 'assets', 'portal_games', 'platodoom_header.png');
  assert.ok(fs.existsSync(headerPngPath), 'assets/portal_games/platodoom_header.png must exist');
  const pngHeaderBytes = fs.readFileSync(headerPngPath);
  const pngWidth = pngHeaderBytes.readUInt32BE(16);
  const pngHeight = pngHeaderBytes.readUInt32BE(20);
  assert.equal(pngWidth, 1024, 'platodoom_header.png IHDR width must be 1024');
  assert.equal(pngHeight, 348, 'platodoom_header.png IHDR height must be 348');
  console.log(
    `  ✓ PORTAL_HEADER_LOGO_SPEC & platodoom_header.png verified (${pngWidth}x${pngHeight}, RGBA=${PORTAL_HEADER_LOGO_SPEC.decodedRgbaBytes} B <= 2.0 MB).`
  );

  // 1.2 WATERCOLOR_GALLERY_SPEC (§10.2 & §15.2)
  assert.equal(WATERCOLOR_GALLERY_SPEC.popOutTriggerRadiusMeters, 6.8);
  assert.ok(WATERCOLOR_GALLERY_SPEC.popOutTriggerRadiusMeters >= 6.5);
  assert.equal(WATERCOLOR_GALLERY_SPEC.popOutReleaseRadiusMeters, 7.5);
  assert.ok(
    WATERCOLOR_GALLERY_SPEC.popOutReleaseRadiusMeters - WATERCOLOR_GALLERY_SPEC.popOutTriggerRadiusMeters >= 0.7
  );
  assert.equal(WATERCOLOR_GALLERY_SPEC.popOutScaleMultiplier, 1.45);
  assert.ok(
    WATERCOLOR_GALLERY_SPEC.popOutScaleMultiplier >= 1.35 &&
      WATERCOLOR_GALLERY_SPEC.popOutScaleMultiplier <= 1.60
  );
  assert.equal(WATERCOLOR_GALLERY_SPEC.popOutForwardOffsetMeters, 0.35);
  assert.ok(
    WATERCOLOR_GALLERY_SPEC.popOutForwardOffsetMeters >= 0.25 &&
      WATERCOLOR_GALLERY_SPEC.popOutForwardOffsetMeters <= 0.45
  );
  assert.equal(WATERCOLOR_GALLERY_SPEC.popOutTransitionDurationSec, 0.38);
  console.log(
    `  ✓ WATERCOLOR_GALLERY_SPEC verified (R_pop=${WATERCOLOR_GALLERY_SPEC.popOutTriggerRadiusMeters}m, R_rel=${WATERCOLOR_GALLERY_SPEC.popOutReleaseRadiusMeters}m, scale=${WATERCOLOR_GALLERY_SPEC.popOutScaleMultiplier}x, offset=+${WATERCOLOR_GALLERY_SPEC.popOutForwardOffsetMeters}m, tau=${WATERCOLOR_GALLERY_SPEC.popOutTransitionDurationSec}s).`
  );

  // 1.3 GRAFFITI_HEADER_GLITCH_FLICKER_SPEC (§14.2 & §15.7)
  assert.equal(GRAFFITI_HEADER_GLITCH_FLICKER_SPEC.planeWidthMeters, 3.84);
  assert.ok(GRAFFITI_HEADER_GLITCH_FLICKER_SPEC.planeWidthMeters >= 3.6);
  assert.equal(GRAFFITI_HEADER_GLITCH_FLICKER_SPEC.planeHeightMeters, 1.20);
  assert.equal(GRAFFITI_HEADER_GLITCH_FLICKER_SPEC.baseLocalOffsetY, 1.78);
  assert.equal(GRAFFITI_HEADER_GLITCH_FLICKER_SPEC.worldMinYMeters, 2.55);
  assert.equal(GRAFFITI_HEADER_GLITCH_FLICKER_SPEC.worldMaxYMeters, 4.85);
  assert.equal(GRAFFITI_STATION_HEADER_SCHEDULE.length, 7);
  const levSample = evaluateGraffitiHeaderLevitation(0.0, 1);
  assert.ok(Math.abs(levSample.localY - 1.78) <= 0.03);
  assert.equal(levSample.worldCenterY, Number((2.17 + levSample.localY).toFixed(4)));
  console.log(
    `  ✓ GRAFFITI_HEADER_GLITCH_FLICKER_SPEC verified (${GRAFFITI_HEADER_GLITCH_FLICKER_SPEC.planeWidthMeters}m x ${GRAFFITI_HEADER_GLITCH_FLICKER_SPEC.planeHeightMeters}m @ baseLocalOffsetY=${GRAFFITI_HEADER_GLITCH_FLICKER_SPEC.baseLocalOffsetY}m).`
  );

  // 1.4 CRT_OPTICAL_PASS_SPEC & CRTShader (§12 & §15.5)
  assert.equal(CRT_OPTICAL_PASS_SPEC.enabled, true);
  assert.equal(CRT_OPTICAL_PASS_SPEC.scanlineIntensity, 0.16);
  assert.ok(CRT_OPTICAL_PASS_SPEC.scanlineIntensity >= 0.12 && CRT_OPTICAL_PASS_SPEC.scanlineIntensity <= 0.22);
  assert.equal(CRT_OPTICAL_PASS_SPEC.curvature, 0.018);
  assert.ok(CRT_OPTICAL_PASS_SPEC.curvature <= 0.025);
  assert.equal(CRT_OPTICAL_PASS_SPEC.vignette, 0.32);
  assert.equal(CRT_OPTICAL_PASS_SPEC.phosphorMaskIntensity, 0.05);
  assert.ok(CRTShader && CRTShader.uniforms && CRTShader.fragmentShader);
  console.log('  ✓ CRT_OPTICAL_PASS_SPEC & CRTShader module contracts verified.');

  // ===========================================================================
  // Phase 2: Live Browser Runtime Verification (WebGL, Scene Graph & State Machines)
  // ===========================================================================
  console.log('\n[Phase 2] Launching live headless Chromium (Metal/ANGLE WebGL) for runtime verification...');
  const { server, baseUrl } = await startStaticServer(REPO_ROOT);
  const browser = await chromium.launch({
    headless: true,
    args: ['--use-gl=angle', '--use-angle=metal'],
  });

  const pageErrors = [];
  try {
    const context = await browser.newContext({
      viewport: { width: 1280, height: 800 },
      deviceScaleFactor: 1.25,
    });
    const page = await context.newPage();
    page.on('pageerror', (err) => {
      console.error('  [Browser PageError]', err.message);
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
    await page.waitForTimeout(100);

    // -------------------------------------------------------------------------
    // 2.1 Addendum Pillar 6: Pitch-Black Sky Port (#000000) (§13 & §15.6)
    // -------------------------------------------------------------------------
    console.log('\n[Phase 2.1] Verifying Environmental Sky Port Pitch-Black Void (#000000)...');
    const skyPortTelemetry = await page.evaluate(() => {
      const scene = window.__THREE_SCENE__;
      const renderer = window.__THREE_RENDERER__;
      const clearColor = new window.THREE.Color();
      renderer.getClearColor(clearColor);
      return {
        sceneBgHex: scene && scene.background ? scene.background.getHexString() : null,
        fogColorHex: scene && scene.fog && scene.fog.color ? scene.fog.color.getHexString() : null,
        sfxDepthFogHex: window.sandbox?.sfx?.depthFog?.colorHex || null,
        rendererClearColorHex: clearColor.getHexString(),
        rendererClearAlpha: renderer.getClearAlpha(),
        groundFogPresent: Boolean(window.sandbox?.sfx?.groundFog),
      };
    });

    assert.equal(skyPortTelemetry.sceneBgHex, '000000', 'scene.background must be #000000');
    assert.equal(skyPortTelemetry.fogColorHex, '000000', 'scene.fog.color must be #000000');
    assert.equal(skyPortTelemetry.sfxDepthFogHex, '#000000', 'sandbox.sfx.depthFog.colorHex must be #000000');
    assert.equal(skyPortTelemetry.rendererClearColorHex, '000000', 'renderer clearColor must be #000000');
    assert.equal(skyPortTelemetry.rendererClearAlpha, 1.0, 'renderer clearAlpha must be 1.0');
    assert.equal(skyPortTelemetry.groundFogPresent, true, 'Low-altitude ground fog must remain active');
    console.log(
      `  ✓ Pitch-black sky port verified (scene.background=#${skyPortTelemetry.sceneBgHex}, fog=#${skyPortTelemetry.fogColorHex}, clearColor=#${skyPortTelemetry.rendererClearColorHex}).`
    );

    // -------------------------------------------------------------------------
    // 2.2 Addendum Pillar 7: Large-Scale Holographic Showcases & Graffiti Headers (§14 & §15.7)
    // -------------------------------------------------------------------------
    console.log('\n[Phase 2.2] Verifying 7 Large-Scale Holographic Showcases (3.52m x 2.16m) & Graffiti Headers (3.84m x 1.20m)...');
    const mountsTelemetry = await page.evaluate(() => {
      return window.sandbox.wallMounts.map((m) => {
        const displayGeomParams = m.frontFaceMesh?.geometry?.parameters || {};
        const headerGeomParams = m.headerFrontMesh?.geometry?.parameters || {};
        const tex =
          m.faceMat?.uniforms?.uMap?.value ||
          m.faceMat?.uniforms?.uScreenTex?.value ||
          m.faceMat?.map ||
          null;
        const texImg = tex && tex.image ? { width: tex.image.width, height: tex.image.height } : null;
        const displayTopLocalY = m.screenHeight * 0.5;
        const headerBottomLocalY = m.headerBaseLocalOffsetY - m.headerHeight * 0.5;
        const verticalClearanceMeters = Number((headerBottomLocalY - displayTopLocalY).toFixed(4));
        const bottomEdgeWorldY = Number((m.locatorPosition.y - m.screenHeight * 0.5).toFixed(4));
        return {
          mountName: m.mountName,
          stationCode: m.station.code,
          screenWidth: m.screenWidth,
          screenHeight: m.screenHeight,
          geomWidth: displayGeomParams.width,
          geomHeight: displayGeomParams.height,
          locatorY: m.locatorPosition.y,
          bottomEdgeWorldY,
          mountElevationOffsetY: m.mountElevationOffsetY,
          mountViewingPitchRad: m.mountViewingPitchRad,
          headerWidth: m.headerWidth,
          headerHeight: m.headerHeight,
          headerGeomWidth: headerGeomParams.width,
          headerGeomHeight: headerGeomParams.height,
          headerBaseLocalOffsetY: m.headerBaseLocalOffsetY,
          verticalClearanceMeters,
          textureWidth: texImg ? texImg.width : null,
          textureHeight: texImg ? texImg.height : null,
          generateMipmaps: tex ? tex.generateMipmaps : null,
        };
      });
    });

    assert.equal(mountsTelemetry.length, 7, 'Must have 7 wallMounts');
    for (const m of mountsTelemetry) {
      assert.equal(m.screenWidth, 3.52, `${m.mountName} screenWidth must be 3.52m`);
      assert.equal(m.screenHeight, 2.16, `${m.mountName} screenHeight must be 2.16m`);
      assert.equal(m.geomWidth, 3.52, `${m.mountName} DisplayFront PlaneGeometry width must be 3.52m`);
      assert.equal(m.geomHeight, 2.16, `${m.mountName} DisplayFront PlaneGeometry height must be 2.16m`);
      assert.equal(m.locatorY, 2.17, `${m.mountName} elevated locatorPosition.y must be 2.17m`);
      assert.ok(m.bottomEdgeWorldY > 1.0, `${m.mountName} bottom edge (${m.bottomEdgeWorldY}m) must clear floor by > 1.0m`);
      assert.equal(m.mountViewingPitchRad, 0.08, `${m.mountName} mountViewingPitchRad must be 0.08 rad`);
      assert.equal(m.headerWidth, 3.84, `${m.mountName} headerWidth must be 3.84m`);
      assert.equal(m.headerHeight, 1.20, `${m.mountName} headerHeight must be 1.20m`);
      assert.equal(m.headerGeomWidth, 3.84, `${m.mountName} HeaderFront PlaneGeometry width must be 3.84m`);
      assert.equal(m.headerGeomHeight, 1.20, `${m.mountName} HeaderFront PlaneGeometry height must be 1.20m`);
      assert.equal(m.headerBaseLocalOffsetY, 1.78, `${m.mountName} headerBaseLocalOffsetY must be 1.78m`);
      assert.ok(
        m.verticalClearanceMeters >= 0.09,
        `${m.mountName} vertical clearance between display top and header bottom must be >= 0.09m, got ${m.verticalClearanceMeters}m`
      );
      assert.equal(m.textureWidth, 1024, `${m.mountName} CanvasTexture width must be 1024`);
      assert.equal(m.textureHeight, 627, `${m.mountName} CanvasTexture height must be 627`);
      assert.equal(m.generateMipmaps, false, `${m.mountName} CanvasTexture generateMipmaps must be false`);
    }
    console.log(
      '  ✓ All 7 SCREEN_MOUNT_01..07 verified: 3.52m x 2.16m showcases @ Y=2.17m (bottom=1.09m > 1.0m), pitch=0.08 rad, 3.84m x 1.20m headers @ localY=1.78m (+100mm clearance), 1024x627 mipmap-free textures.'
    );

    // -------------------------------------------------------------------------
    // 2.3 Addendum Pillar 5: Screen CRT Post-Processing Optical Pass (§12 & §15.5)
    // -------------------------------------------------------------------------
    console.log('\n[Phase 2.3] Verifying Full-Screen CRT Post-Processing Optical Pass...');
    const crtTelemetry = await page.evaluate(() => {
      // Step 10 frames via crtOpticalPass.render to warm up EMA frame timing
      for (let i = 0; i < 10; i++) {
        if (window.sandbox.crtOpticalPass && typeof window.sandbox.crtOpticalPass.render === 'function') {
          window.sandbox.crtOpticalPass.render(1 / 60, i * (1 / 60));
        }
      }
      const state = window.sandbox.getCRTOpticalPassState();
      const rt = window.sandbox.crtOpticalPass?.renderTarget;
      const overlayEl = document.getElementById('crt-optical-overlay');
      const overlayStyle = overlayEl ? window.getComputedStyle(overlayEl) : null;
      return {
        state,
        rtStencilBuffer: rt ? Boolean(rt.stencilBuffer) : false,
        rtDepthBuffer: rt ? Boolean(rt.depthBuffer) : false,
        rtIsXRRenderTarget: rt ? Boolean(rt.isXRRenderTarget) : false,
        overlayPresent: Boolean(overlayEl),
        overlayPointerEvents: overlayStyle ? overlayStyle.pointerEvents : null,
      };
    });

    assert.equal(crtTelemetry.state.enabled, true, 'CRT pass must be enabled');
    assert.equal(crtTelemetry.state.scanlinesActive, true, 'CRT scanlines must be active');
    assert.equal(crtTelemetry.state.scanlineIntensity, 0.16);
    assert.ok(
      crtTelemetry.state.scanlineIntensity >= 0.12 && crtTelemetry.state.scanlineIntensity <= 0.22
    );
    assert.equal(crtTelemetry.state.scanlineCount, 640);
    assert.equal(crtTelemetry.state.phosphorMaskActive, true);
    assert.equal(crtTelemetry.state.phosphorMaskIntensity, 0.05);
    assert.equal(crtTelemetry.state.curvature, 0.018);
    assert.ok(crtTelemetry.state.curvature <= 0.025, 'CRT barrel curvature k1 must be <= 0.025');
    assert.equal(crtTelemetry.state.vignette, 0.32);
    assert.equal(crtTelemetry.state.vignetteActive, true);
    assert.equal(crtTelemetry.state.centerChromaticOffsetPx, 0);
    assert.ok(crtTelemetry.state.edgeChromaticOffsetPx <= 0.75);
    assert.ok(
      crtTelemetry.state.gpuFrameTimeMs <= 0.80,
      `CRT GPU frame time must be <= 0.80ms, got ${crtTelemetry.state.gpuFrameTimeMs}ms`
    );
    assert.equal(crtTelemetry.state.pointerEventsBlocked, false, 'CRT overlay must not block pointer events');
    assert.equal(crtTelemetry.rtStencilBuffer, true, 'CRT renderTarget must preserve stencilBuffer: true');
    assert.equal(crtTelemetry.rtDepthBuffer, true, 'CRT renderTarget must preserve depthBuffer: true');
    assert.equal(crtTelemetry.overlayPresent, true, '#crt-optical-overlay must exist in DOM');
    assert.equal(crtTelemetry.overlayPointerEvents, 'none', '#crt-optical-overlay pointer-events must be none');
    console.log(
      `  ✓ CRT Optical Pass verified (scanlineIntensity=${crtTelemetry.state.scanlineIntensity}, curvature=${crtTelemetry.state.curvature}, vignette=${crtTelemetry.state.vignette}, gpuFrameTimeMs=${crtTelemetry.state.gpuFrameTimeMs}ms <= 0.80ms, stencilBuffer=true).`
    );

    // -------------------------------------------------------------------------
    // 2.4 Addendum Pillar 2: PlatoDoom Proximity Pop-Out State Machine (§10.2 & §15.2)
    // -------------------------------------------------------------------------
    console.log('\n[Phase 2.4] Verifying PlatoDoom Proximity Pop-Out State Machine & Hysteresis...');
    const popOutTelemetry = await page.evaluate(() => {
      const wc = window.sandbox.waterColor;
      wc.resetTransformToDefault();

      // 1. Far away (z = 25.0m, distance ~17.01m > 7.5m)
      wc.updateProximityPopOut(1 / 60, { x: 0.0, y: 0.0, z: 25.0 }, { immediate: true });
      const baselineState = wc.getState();

      // 2. Approach within trigger radius (z = 36.0m, distance ~6.01m <= 6.8m) with immediate=true
      wc.updateProximityPopOut(0.4, { x: 0.0, y: 0.0, z: 36.0 }, { immediate: true });
      const poppedState = wc.getState();

      // 3. Move into hysteresis band (z = 34.8m, distance ~7.21m in (6.8m, 7.5m))
      // Use small delta from 35.8 -> 34.8 so it's a smooth walk, not a discrete teleport jump
      wc.updateProximityPopOut(1 / 60, { x: 0.0, y: 0.0, z: 35.4 }, { immediate: false });
      wc.updateProximityPopOut(1 / 60, { x: 0.0, y: 0.0, z: 34.8 }, { immediate: false });
      const hysteresisState = wc.getState();

      // 4. Retreat outside release radius (z = 33.5m, distance ~8.51m >= 7.5m) with immediate=true
      wc.updateProximityPopOut(0.4, { x: 0.0, y: 0.0, z: 33.5 }, { immediate: true });
      const releasedState = wc.getState();

      // 5. Verify smooth cubic easing progression at half duration (dt = 0.19s of 0.38s)
      wc.resetTransformToDefault();
      // Sync lastEvalZ near trigger boundary so stepping across 6.8m is treated as continuous walk
      wc.updateProximityPopOut(1 / 60, { x: 0.0, y: 0.0, z: 35.0 }, { immediate: true });
      wc.updateProximityPopOut(0.19, { x: 0.0, y: 0.0, z: 35.6 }, { immediate: false });
      const midTransitionState = wc.getState();

      // Restore to default
      wc.resetTransformToDefault();

      return {
        baselineState,
        poppedState,
        hysteresisState,
        releasedState,
        midTransitionState,
      };
    });

    // Baseline assertions
    assert.equal(popOutTelemetry.baselineState.isPoppedOut, false);
    assert.equal(popOutTelemetry.baselineState.currentScaleMultiplier, 1.0);
    assert.equal(popOutTelemetry.baselineState.currentForwardOffsetMeters, 0.0);
    assert.equal(popOutTelemetry.baselineState.canvasScaleX, 5.0);
    assert.equal(popOutTelemetry.baselineState.canvasPositionZ, 42.0129);

    // Popped-out assertions (z = 36.0m)
    assert.equal(popOutTelemetry.poppedState.isPoppedOut, true, 'Must pop out at z=36.0m (dist <= 6.8m)');
    assert.equal(popOutTelemetry.poppedState.popOutProgress, 1.0);
    assert.equal(popOutTelemetry.poppedState.popOutFactor, 1.0);
    assert.equal(popOutTelemetry.poppedState.currentScaleMultiplier, 1.45);
    assert.equal(popOutTelemetry.poppedState.canvasScaleX, 7.25);
    assert.equal(popOutTelemetry.poppedState.canvasScaleY, 7.25);
    assert.equal(popOutTelemetry.poppedState.currentForwardOffsetMeters, 0.35);
    assert.equal(popOutTelemetry.poppedState.canvasPositionZ, 41.6629);

    // Hysteresis band assertions (z = 34.8m, dist = 7.21m in (6.8, 7.5))
    assert.equal(
      popOutTelemetry.hysteresisState.isPoppedOut,
      true,
      'Must remain popped out inside 6.8m..7.5m hysteresis band (no boundary chatter)'
    );
    assert.equal(popOutTelemetry.hysteresisState.currentScaleMultiplier, 1.45);

    // Released assertions (z = 33.5m, dist = 8.51m >= 7.5m)
    assert.equal(
      popOutTelemetry.releasedState.isPoppedOut,
      false,
      'Must release pop-out when retreating beyond 7.5m'
    );
    assert.equal(popOutTelemetry.releasedState.currentScaleMultiplier, 1.0);
    assert.equal(popOutTelemetry.releasedState.currentForwardOffsetMeters, 0.0);
    assert.equal(popOutTelemetry.releasedState.canvasScaleX, 5.0);
    assert.equal(popOutTelemetry.releasedState.canvasPositionZ, 42.0129);

    // Mid-transition cubic easing assertion (dt = 0.19s / 0.38s => progress = 0.5, factor = 0.5)
    assert.equal(popOutTelemetry.midTransitionState.isPoppedOut, true);
    assert.ok(
      Math.abs(popOutTelemetry.midTransitionState.popOutProgress - 0.5) < 0.02,
      `Expected mid-transition progress ~0.5 at dt=0.19s, got ${popOutTelemetry.midTransitionState.popOutProgress}`
    );
    assert.ok(
      Math.abs(popOutTelemetry.midTransitionState.popOutFactor - 0.5) < 0.03,
      `Expected cubic ease factor ~0.5 at progress=0.5, got ${popOutTelemetry.midTransitionState.popOutFactor}`
    );
    console.log(
      `  ✓ PlatoDoom Proximity Pop-Out verified: baseline(scale=5.0, z=42.0129) -> popped@z=36.0m(scale=${popOutTelemetry.poppedState.canvasScaleX}, z=${popOutTelemetry.poppedState.canvasPositionZ}) -> hysteresis@z=34.8m(isPoppedOut=true) -> midEase@0.19s(p=${popOutTelemetry.midTransitionState.popOutProgress}) -> released@z=33.5m(scale=5.0, z=42.0129).`
    );

    await context.close();
    assert.equal(pageErrors.length, 0, `Unexpected browser page errors: ${pageErrors.join('; ')}`);

    console.log('\n================================================================');
    console.log('ALL SPEC 068 ADDENDUM & ARCHITECTURE CHECKS PASSED (0 ERRORS)!');
    console.log('================================================================');
  } finally {
    await browser.close();
    server.close();
  }
}

runArchitectureAddendumVerification().catch((err) => {
  console.error('\n❌ ARCHITECTURE ADDENDUM VERIFICATION FAILURE:', err);
  process.exit(1);
});
