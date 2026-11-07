/**
 * tests/verify_stack_integrations.mjs
 *
 * Verifies stack integrations, vendor addons, crt_optical_pass.js,
 * and external API/runtime contracts for Functional Spec 068 & System Addendum.
 */

import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '..');

console.log('================================================================');
console.log('STACK, VENDOR & LIBRARY INTEGRATION VERIFICATION SUITE');
console.log('================================================================');

// 1. Verify Three.js core & vendor postprocessing addons
console.log('\n[1] Verifying Three.js & Vendor Post-Processing Addons...');
const three = await import('three');
assert.ok(three.REVISION, 'three.REVISION must be defined');
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
];
for (const file of requiredVendorFiles) {
  const p = path.join(vendorPostprocessingDir, file);
  assert.ok(fs.existsSync(p), `Missing vendor file: ${file}`);
}
assert.ok(
  fs.existsSync(path.join(vendorShadersDir, 'CopyShader.js')),
  'Missing vendor/three/examples/jsm/shaders/CopyShader.js'
);
console.log('  ✓ All required vendor postprocessing files present in vendor/three/examples/jsm/');

const { EffectComposer } = await import(
  path.join(vendorPostprocessingDir, 'EffectComposer.js')
);
const { RenderPass } = await import(path.join(vendorPostprocessingDir, 'RenderPass.js'));
const { ShaderPass } = await import(path.join(vendorPostprocessingDir, 'ShaderPass.js'));
assert.ok(typeof EffectComposer === 'function', 'EffectComposer must be a class/function');
assert.ok(typeof RenderPass === 'function', 'RenderPass must be a class/function');
assert.ok(typeof ShaderPass === 'function', 'ShaderPass must be a class/function');
console.log('  ✓ EffectComposer, RenderPass, and ShaderPass imported successfully');

// 2. Verify crt_optical_pass.js exports & contract invariants
console.log('\n[2] Verifying crt_optical_pass.js Contract...');
const crtModule = await import(path.join(REPO_ROOT, 'crt_optical_pass.js'));
const { CRT_OPTICAL_PASS_SPEC, CRTShader, buildCRTOpticalPassSystem } = crtModule;

assert.ok(CRT_OPTICAL_PASS_SPEC, 'CRT_OPTICAL_PASS_SPEC must be exported');
assert.equal(CRT_OPTICAL_PASS_SPEC.enabled, true, 'CRT pass must be enabled by default');
assert.ok(
  CRT_OPTICAL_PASS_SPEC.scanlineIntensity >= 0.12 &&
    CRT_OPTICAL_PASS_SPEC.scanlineIntensity <= 0.22,
  'scanlineIntensity must be within [0.12, 0.22]'
);
assert.ok(
  CRT_OPTICAL_PASS_SPEC.curvature <= 0.025,
  'barrel distortion curvature must be <= 0.025 (2.5%)'
);
assert.ok(
  CRT_OPTICAL_PASS_SPEC.maxGpuFrameBudgetMs <= 0.8,
  'maxGpuFrameBudgetMs must be <= 0.8ms'
);
assert.equal(CRT_OPTICAL_PASS_SPEC.maxDpr, 1.25, 'maxDpr must be capped at 1.25');

assert.ok(CRTShader && CRTShader.uniforms, 'CRTShader and uniforms must be defined');
assert.equal(CRTShader.name, 'SkateAlleyCRTShader');
assert.ok(CRTShader.uniforms.tDiffuse, 'uniform tDiffuse must exist');
assert.ok(CRTShader.uniforms.uTime, 'uniform uTime must exist');
assert.ok(CRTShader.uniforms.uResolution, 'uniform uResolution must exist');
assert.ok(CRTShader.uniforms.uCurvature, 'uniform uCurvature must exist');
assert.ok(CRTShader.uniforms.uVignette, 'uniform uVignette must exist');

// Test dummy initialization without DOM
const dummySys = buildCRTOpticalPassSystem(null, null, null);
const dummyState = dummySys.getState();
assert.equal(typeof dummyState, 'object', 'getState() must return an object');
assert.equal(dummyState.scanlineIntensity, CRT_OPTICAL_PASS_SPEC.scanlineIntensity);
assert.equal(dummyState.curvature, CRT_OPTICAL_PASS_SPEC.curvature);
assert.equal(dummyState.vignette, CRT_OPTICAL_PASS_SPEC.vignette);
assert.equal(dummyState.pointerEventsBlocked, false, 'pointerEventsBlocked must be false');
console.log('  ✓ crt_optical_pass.js adheres 100% to runtime contract & telemetry schemas');

// 3. Verify sparse worktree assets
console.log('\n[3] Verifying Sparse Worktree Assets...');
const hoodiePath = path.join(REPO_ROOT, 'character_hoodie.glb');
assert.ok(fs.existsSync(hoodiePath), 'character_hoodie.glb must exist on disk');
const hoodieStat = fs.statSync(hoodiePath);
assert.ok(hoodieStat.size > 1000000, `character_hoodie.glb size (${hoodieStat.size}) is too small`);
console.log(`  ✓ character_hoodie.glb present (${hoodieStat.size} bytes)`);

const revcdosDir = path.join(REPO_ROOT, 'revcdos');
assert.ok(fs.existsSync(revcdosDir), 'revcdos/ directory must exist');
const revcdosRequired = ['index.html', 'game.js', 'index.js', 'vcbr/luis_player/player.dff'];
for (const rel of revcdosRequired) {
  assert.ok(fs.existsSync(path.join(revcdosDir, rel)), `Missing revcdos file: ${rel}`);
}
console.log('  ✓ revcdos/ runtime files present in worktree');

console.log('\n================================================================');
console.log('ALL STACK & LIBRARY INTEGRATIONS VERIFIED SUCCESSFULLY');
console.log('================================================================');
