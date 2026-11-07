/**
 * tests/verify_stack_integrations.mjs
 *
 * Verifies stack integrations, vendor addons, crt_optical_pass.js,
 * browser importmap resolution, and live runtime WebGL contracts
 * for Functional Spec 068 & System Addendum (Run 20261107T172758-750-iwl9).
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

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.glb': 'model/gltf-binary',
  '.gltf': 'model/gltf+json',
  '.part': 'application/octet-stream',
  '.wasm': 'application/wasm',
  '.data': 'application/octet-stream',
  '.dff': 'application/octet-stream',
  '.txd': 'application/octet-stream',
  '.bmp': 'image/bmp',
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
  '.ogg': 'audio/ogg',
  '.webp': 'image/webp',
};

function startEphemeralStaticServer(rootDir) {
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
          'Access-Control-Allow-Origin': '*',
          'Cache-Control': 'no-store',
        });
        fs.createReadStream(safePath).pipe(res);
      } catch (err) {
        res.writeHead(500);
        res.end(String(err));
      }
    });
    server.on('error', reject);
    // Port 0 selects an ephemeral OS-assigned port to guarantee parallel test isolation
    server.listen(0, '127.0.0.1', () => {
      const address = server.address();
      resolve({
        server,
        baseUrl: `http://127.0.0.1:${address.port}`,
      });
    });
  });
}

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

async function runStackVerification() {
  console.log('================================================================');
  console.log('STACK, VENDOR & LIBRARY INTEGRATION VERIFICATION SUITE');
  console.log('================================================================');

  // ---------------------------------------------------------------------------
  // 1. Verify Three.js Core & Vendor Postprocessing Addons
  // ---------------------------------------------------------------------------
  console.log('\n[1] Verifying Three.js & Vendor Post-Processing Addons...');
  const three = await import('three');
  assert.ok(three.REVISION, 'three.REVISION must be defined');
  assert.equal(three.REVISION, '186', 'Three.js revision must be r186');
  console.log(`  ✓ Three.js revision: r${three.REVISION}`);

  const vendorPostprocessingDir = path.join(REPO_ROOT, 'vendor/three/examples/jsm/postprocessing');
  const vendorShadersDir = path.join(REPO_ROOT, 'vendor/three/examples/jsm/shaders');

  assert.ok(fs.existsSync(vendorPostprocessingDir), 'vendor postprocessing dir must exist');
  assert.ok(fs.existsSync(vendorShadersDir), 'vendor shaders dir must exist');

  const requiredVendorFiles = [
    'EffectComposer.js',
    'RenderPass.js',
    'ShaderPass.js',
    'Pass.js',
    'MaskPass.js',
    'OutputPass.js',
    'BloomPass.js',
    'FilmPass.js',
    'GlitchPass.js',
    'UnrealBloomPass.js',
  ];
  for (const file of requiredVendorFiles) {
    const p = path.join(vendorPostprocessingDir, file);
    assert.ok(fs.existsSync(p), `Missing vendor postprocessing file: ${file}`);
  }
  const requiredShaderFiles = [
    'CopyShader.js',
    'OutputShader.js',
    'FXAAShader.js',
    'FilmShader.js',
  ];
  for (const file of requiredShaderFiles) {
    const p = path.join(vendorShadersDir, file);
    assert.ok(fs.existsSync(p), `Missing vendor shader file: ${file}`);
  }
  console.log('  ✓ All required vendor postprocessing and shader files present in vendor/three/examples/jsm/');

  const { EffectComposer } = await import(path.join(vendorPostprocessingDir, 'EffectComposer.js'));
  const { RenderPass } = await import(path.join(vendorPostprocessingDir, 'RenderPass.js'));
  const { ShaderPass } = await import(path.join(vendorPostprocessingDir, 'ShaderPass.js'));
  const { CopyShader } = await import(path.join(vendorShadersDir, 'CopyShader.js'));

  assert.ok(typeof EffectComposer === 'function', 'EffectComposer must be a class/function');
  assert.ok(typeof RenderPass === 'function', 'RenderPass must be a class/function');
  assert.ok(typeof ShaderPass === 'function', 'ShaderPass must be a class/function');
  assert.ok(CopyShader && CopyShader.uniforms, 'CopyShader must be a valid shader definition');
  console.log('  ✓ EffectComposer, RenderPass, ShaderPass, and CopyShader imported successfully in Node');

  // ---------------------------------------------------------------------------
  // 2. Verify crt_optical_pass.js Contract & Invariants
  // ---------------------------------------------------------------------------
  console.log('\n[2] Verifying crt_optical_pass.js Contract...');
  const crtModule = await import(path.join(REPO_ROOT, 'crt_optical_pass.js'));
  const { CRT_OPTICAL_PASS_SPEC, CRTShader, buildCRTOpticalPassSystem } = crtModule;

  assert.ok(CRT_OPTICAL_PASS_SPEC, 'CRT_OPTICAL_PASS_SPEC must be exported');
  assert.equal(CRT_OPTICAL_PASS_SPEC.enabled, true, 'CRT pass must be enabled by default');
  assert.ok(
    CRT_OPTICAL_PASS_SPEC.scanlineIntensity >= 0.12 &&
      CRT_OPTICAL_PASS_SPEC.scanlineIntensity <= 0.22,
    `scanlineIntensity (${CRT_OPTICAL_PASS_SPEC.scanlineIntensity}) must be within [0.12, 0.22]`
  );
  assert.equal(CRT_OPTICAL_PASS_SPEC.scanlineCount, 640.0, 'scanlineCount must be 640.0');
  assert.ok(
    CRT_OPTICAL_PASS_SPEC.curvature <= 0.025,
    `barrel distortion curvature (${CRT_OPTICAL_PASS_SPEC.curvature}) must be <= 0.025 (2.5%)`
  );
  assert.equal(CRT_OPTICAL_PASS_SPEC.vignette, 0.32, 'vignette must be 0.32');
  assert.equal(CRT_OPTICAL_PASS_SPEC.phosphorMaskIntensity, 0.05, 'phosphorMaskIntensity must be 0.05');
  assert.equal(CRT_OPTICAL_PASS_SPEC.bloomHalationIntensity, 0.08, 'bloomHalationIntensity must be 0.08');
  assert.ok(
    CRT_OPTICAL_PASS_SPEC.refreshHumAmplitude < 0.015,
    `refreshHumAmplitude (${CRT_OPTICAL_PASS_SPEC.refreshHumAmplitude}) must be < 0.015 (1.5%)`
  );
  assert.ok(
    CRT_OPTICAL_PASS_SPEC.edgeChromaticOffsetPx <= 0.75,
    `edgeChromaticOffsetPx (${CRT_OPTICAL_PASS_SPEC.edgeChromaticOffsetPx}) must be <= 0.75`
  );
  assert.equal(CRT_OPTICAL_PASS_SPEC.maxDpr, 1.25, 'maxDpr must be capped at 1.25');
  assert.ok(
    CRT_OPTICAL_PASS_SPEC.maxGpuFrameBudgetMs <= 0.8,
    'maxGpuFrameBudgetMs must be <= 0.8ms'
  );

  assert.ok(CRTShader && CRTShader.uniforms, 'CRTShader and uniforms must be defined');
  assert.equal(CRTShader.name, 'SkateAlleyCRTShader');
  assert.ok(CRTShader.uniforms.tDiffuse, 'uniform tDiffuse must exist');
  assert.ok(CRTShader.uniforms.uTime, 'uniform uTime must exist');
  assert.ok(CRTShader.uniforms.uResolution, 'uniform uResolution must exist');
  assert.ok(CRTShader.uniforms.uScanlineIntensity, 'uniform uScanlineIntensity must exist');
  assert.ok(CRTShader.uniforms.uScanlineCount, 'uniform uScanlineCount must exist');
  assert.ok(CRTShader.uniforms.uCurvature, 'uniform uCurvature must exist');
  assert.ok(CRTShader.uniforms.uVignette, 'uniform uVignette must exist');
  assert.ok(CRTShader.uniforms.uPhosphorMaskIntensity, 'uniform uPhosphorMaskIntensity must exist');
  assert.ok(CRTShader.uniforms.uBloomIntensity, 'uniform uBloomIntensity must exist');
  assert.ok(CRTShader.uniforms.uRefreshHum, 'uniform uRefreshHum must exist');
  assert.ok(CRTShader.uniforms.uEdgeChromaticPx, 'uniform uEdgeChromaticPx must exist');
  assert.ok(typeof CRTShader.vertexShader === 'string' && CRTShader.vertexShader.length > 50);
  assert.ok(typeof CRTShader.fragmentShader === 'string' && CRTShader.fragmentShader.length > 100);

  // Test dummy initialization without DOM/renderer
  const dummySys = buildCRTOpticalPassSystem(null, null, null);
  const dummyState = dummySys.getState();
  assert.equal(typeof dummyState, 'object', 'getState() must return an object');
  assert.equal(dummyState.scanlineIntensity, CRT_OPTICAL_PASS_SPEC.scanlineIntensity);
  assert.equal(dummyState.curvature, CRT_OPTICAL_PASS_SPEC.curvature);
  assert.equal(dummyState.vignette, CRT_OPTICAL_PASS_SPEC.vignette);
  assert.equal(dummyState.pointerEventsBlocked, false, 'pointerEventsBlocked must be false');
  console.log('  ✓ crt_optical_pass.js adheres 100% to runtime contract & telemetry schemas');

  // ---------------------------------------------------------------------------
  // 3. Verify Sparse Worktree Assets
  // ---------------------------------------------------------------------------
  console.log('\n[3] Verifying Sparse Worktree Assets...');
  const hoodiePath = path.join(REPO_ROOT, 'character_hoodie.glb');
  assert.ok(fs.existsSync(hoodiePath), 'character_hoodie.glb must exist on disk');
  const hoodieStat = fs.statSync(hoodiePath);
  assert.ok(hoodieStat.size > 1000000, `character_hoodie.glb size (${hoodieStat.size}) is too small`);
  assert.equal(hoodieStat.size, 1357020, `character_hoodie.glb size is ${hoodieStat.size}`);
  console.log(`  ✓ character_hoodie.glb present and verified (${hoodieStat.size} bytes)`);

  const revcdosDir = path.join(REPO_ROOT, 'revcdos');
  assert.ok(fs.existsSync(revcdosDir), 'revcdos/ directory must exist');
  const revcdosRequired = [
    { file: 'index.html' },
    { file: 'game.js' },
    { file: 'index.js' },
    { file: 'vcbr/luis_player/player.dff', expectedSize: 292864 },
    { file: 'vcbr/luis_player/player.txd', expectedSize: 45056 },
    { file: 'vcbr/luis_player/player.bmp', expectedSize: 66612 },
  ];
  for (const item of revcdosRequired) {
    const p = path.join(revcdosDir, item.file);
    assert.ok(fs.existsSync(p), `Missing revcdos file: ${item.file}`);
    if (item.expectedSize) {
      const sz = fs.statSync(p).size;
      assert.equal(sz, item.expectedSize, `${item.file} size (${sz}) does not match expected (${item.expectedSize})`);
    }
  }
  console.log('  ✓ revcdos/ runtime & Luis player RenderWare assets present in worktree');

  const luisPartPath = path.join(REPO_ROOT, 'skate3_cleanroom/parts/char_luis.part');
  assert.ok(fs.existsSync(luisPartPath), 'char_luis.part must exist');
  const luisPartSize = fs.statSync(luisPartPath).size;
  assert.equal(luisPartSize, 9635969, `char_luis.part size (${luisPartSize}) must be 9,635,969 bytes`);
  console.log(`  ✓ skate3_cleanroom/parts/char_luis.part verified (${luisPartSize} bytes)`);

  // ---------------------------------------------------------------------------
  // 4. Live Browser & WebGL Integration Verification via Playwright
  // ---------------------------------------------------------------------------
  console.log('\n[4] Launching Live Headless Browser for WebGL & Importmap Verification...');
  const { server, baseUrl } = await startEphemeralStaticServer(REPO_ROOT);
  console.log(`  ✓ Ephemeral test static server listening at: ${baseUrl}`);

  const { chromium } = loadPlaywright();
  const browser = await chromium.launch({
    headless: true,
    args: ['--use-gl=angle', '--use-angle=metal', '--ignore-gpu-blocklist'],
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

    console.log(`  Navigating to ${baseUrl}/index.html...`);
    await page.goto(`${baseUrl}/index.html`, { waitUntil: 'domcontentloaded', timeout: 30000 });

    // Wait for 3D sandbox and scene initialization
    await page.waitForFunction(
      () => Boolean(window.sandbox && window.sandbox.ready && window.__THREE_SCENE__),
      { timeout: 35000 }
    );
    console.log('  ✓ Page loaded and 3D Sandbox runtime is ready');

    // 4.1 Test in-browser importmap resolution of Three.js vendor post-processing
    console.log('\n  [4.1] Testing Browser Importmap Specifiers ("three/addons/*")...');
    const importmapTest = await page.evaluate(async () => {
      try {
        const ecMod = await import('three/addons/postprocessing/EffectComposer.js');
        const rpMod = await import('three/addons/postprocessing/RenderPass.js');
        const spMod = await import('three/addons/postprocessing/ShaderPass.js');
        const csMod = await import('three/addons/shaders/CopyShader.js');
        return {
          ok: true,
          hasEffectComposer: typeof ecMod.EffectComposer === 'function',
          hasRenderPass: typeof rpMod.RenderPass === 'function',
          hasShaderPass: typeof spMod.ShaderPass === 'function',
          hasCopyShader: Boolean(csMod.CopyShader && csMod.CopyShader.uniforms),
        };
      } catch (err) {
        return { ok: false, error: String(err) };
      }
    });
    assert.ok(importmapTest.ok, `Browser importmap dynamic import failed: ${importmapTest.error}`);
    assert.equal(importmapTest.hasEffectComposer, true, 'EffectComposer must resolve in browser');
    assert.equal(importmapTest.hasRenderPass, true, 'RenderPass must resolve in browser');
    assert.equal(importmapTest.hasShaderPass, true, 'ShaderPass must resolve in browser');
    assert.equal(importmapTest.hasCopyShader, true, 'CopyShader must resolve in browser');
    console.log('  ✓ Browser importmap ("three/addons/*") resolves vendor postprocessing and shaders with 100% fidelity');

    // 4.2 Test Live In-Browser CRT Optical Pass State
    console.log('\n  [4.2] Testing Live In-Browser CRT Optical Pass Contract...');
    const crtTelemetry = await page.evaluate(() => {
      const crtState = window.sandbox.getCRTOpticalPassState?.();
      const crtSys = window.sandbox.crtOpticalPass;
      const overlayEl = document.getElementById('crt-optical-overlay');
      const overlayStyle = overlayEl ? window.getComputedStyle(overlayEl) : null;
      return {
        state: crtState,
        hasRenderTarget: Boolean(crtSys?.renderTarget),
        stencilBuffer: crtSys?.renderTarget?.stencilBuffer,
        depthBuffer: crtSys?.renderTarget?.depthBuffer,
        generateMipmaps: crtSys?.renderTarget?.texture?.generateMipmaps,
        overlay: {
          exists: Boolean(overlayEl),
          pointerEvents: overlayStyle?.pointerEvents,
          scanlineIntensity: overlayEl?.dataset?.crtScanlineIntensity,
          curvature: overlayEl?.dataset?.crtCurvature,
          vignette: overlayEl?.dataset?.crtVignette,
          phosphorMask: overlayEl?.dataset?.crtPhosphorMask,
        },
      };
    });

    const s = crtTelemetry.state;
    assert.ok(s, 'window.sandbox.getCRTOpticalPassState() must return an object');
    assert.equal(s.enabled, true, 'CRT pass state.enabled must be true');
    assert.equal(s.scanlinesActive, true, 'CRT pass scanlinesActive must be true');
    assert.ok(
      s.scanlineIntensity >= 0.12 && s.scanlineIntensity <= 0.22,
      `scanlineIntensity (${s.scanlineIntensity}) must be in [0.12, 0.22]`
    );
    assert.equal(s.scanlineCount, 640, 'scanlineCount must be 640');
    assert.equal(s.phosphorMaskActive, true, 'phosphorMaskActive must be true');
    assert.equal(s.phosphorMaskIntensity, 0.05, 'phosphorMaskIntensity must be 0.05');
    assert.ok(s.curvature <= 0.025, `curvature (${s.curvature}) must be <= 0.025`);
    assert.ok(s.barrelDistortionK1 <= 0.025, `barrelDistortionK1 (${s.barrelDistortionK1}) must be <= 0.025`);
    assert.equal(s.vignette, 0.32, 'vignette must be 0.32');
    assert.equal(s.vignetteActive, true, 'vignetteActive must be true');
    assert.equal(s.phosphorBloomActive, true, 'phosphorBloomActive must be true');
    assert.equal(s.centerChromaticOffsetPx, 0, 'centerChromaticOffsetPx must be 0 (zero dispersion in reading zone)');
    assert.ok(s.edgeChromaticOffsetPx <= 0.75, `edgeChromaticOffsetPx (${s.edgeChromaticOffsetPx}) must be <= 0.75`);
    assert.ok(s.gpuFrameTimeMs <= 0.80, `gpuFrameTimeMs (${s.gpuFrameTimeMs}ms) must be <= 0.80ms`);
    assert.equal(s.pointerEventsBlocked, false, 'pointerEventsBlocked must be false');
    console.log(`  ✓ CRT optical pass state verified: scanlines=${s.scanlineIntensity}, curvature=${s.curvature}, frameTime=${s.gpuFrameTimeMs}ms`);

    // 4.3 Test WebGL Render Target Stencil Buffer Preservation
    console.log('\n  [4.3] Testing WebGL Stencil & Depth Buffer Preservation...');
    assert.equal(crtTelemetry.hasRenderTarget, true, 'CRT optical pass must have a renderTarget');
    assert.equal(crtTelemetry.stencilBuffer, true, 'renderTarget.stencilBuffer must be true for character occlusion reject');
    assert.equal(crtTelemetry.depthBuffer, true, 'renderTarget.depthBuffer must be true');
    assert.equal(crtTelemetry.generateMipmaps, false, 'renderTarget.texture.generateMipmaps must be false');
    console.log('  ✓ WebGL renderTarget stencilBuffer=true, depthBuffer=true, generateMipmaps=false verified');

    // 4.4 Test DOM Optical Overlay Layer
    console.log('\n  [4.4] Testing DOM Optical Overlay Layer (#crt-optical-overlay)...');
    assert.equal(crtTelemetry.overlay.exists, true, '#crt-optical-overlay element must exist');
    assert.equal(crtTelemetry.overlay.pointerEvents, 'none', '#crt-optical-overlay must have pointer-events: none !important');
    assert.equal(crtTelemetry.overlay.scanlineIntensity, '0.16', 'overlay data-crt-scanline-intensity must be 0.16');
    assert.equal(crtTelemetry.overlay.curvature, '0.018', 'overlay data-crt-curvature must be 0.018');
    assert.equal(crtTelemetry.overlay.vignette, '0.32', 'overlay data-crt-vignette must be 0.32');
    assert.equal(crtTelemetry.overlay.phosphorMask, 'true', 'overlay data-crt-phosphor-mask must be true');
    console.log('  ✓ #crt-optical-overlay verified: pointer-events: none, synchronized dataset attributes');

    assert.equal(pageErrors.length, 0, `Uncaught page errors encountered: ${pageErrors.join('; ')}`);
    console.log('  ✓ Zero page errors or unhandled exceptions in browser');

  } finally {
    await browser.close();
    server.close();
    console.log('  ✓ Browser closed and test static server terminated cleanly');
  }

  console.log('\n================================================================');
  console.log('ALL STACK & LIBRARY INTEGRATIONS VERIFIED SUCCESSFULLY (100% PASS)');
  console.log('================================================================');
}

runStackVerification().catch((err) => {
  console.error('\n❌ STACK INTEGRATION VERIFICATION FAILURE:', err);
  process.exit(1);
});
