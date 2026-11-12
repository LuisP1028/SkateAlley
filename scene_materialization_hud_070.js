/**
 * Functional Specification 070:
 * 1. Scene-Wide Boot-Up 3D Materialization & Glowing Bloom-Edge Dissolve System
 *    (Wawa Sensei / THREE-CustomShaderMaterial paradigm adapted for Vanilla Three.js)
 * 2. Screen-Agnostic Portfolio Perimeter HUD & Zero-Jitter Glyph Materialization (Cipher Decode)
 * 3. Revamped Dual Virtual Analog Sticks (Precision Telemetry Reticles)
 * 4. Aspect-Ratio Adaptive Dynamic Camera Follow-Offset Scaling (dynamic_cam.md)
 */

import * as THREE from 'three';

// ============================================================================
// 1. Pillar 4: Aspect-Ratio Adaptive Dynamic Camera Follow-Offset Scaling (§7)
// ============================================================================
export const DYNAMIC_CAM_ASPECT_LANDSCAPE = 1.60;
export const DYNAMIC_CAM_ASPECT_PORTRAIT = 0.56;
export const DYNAMIC_CAM_BOOM_PULLBACK_FACTOR = 0.28; // +28% boom arm length on portrait (within [20%, 35%])
export const DYNAMIC_CAM_LOOKAT_Y_ELEVATION_M = 0.32; // +0.32m lookAt elevation above head on portrait

export function computePortraitAspectFactor(aspectRatio) {
  const aspect = Number.isFinite(aspectRatio) && aspectRatio > 0.05 ? aspectRatio : 16 / 9;
  const span = DYNAMIC_CAM_ASPECT_LANDSCAPE - DYNAMIC_CAM_ASPECT_PORTRAIT;
  const u = Math.max(0.0, Math.min(1.0, (DYNAMIC_CAM_ASPECT_LANDSCAPE - aspect) / span));
  return u * u * (3.0 - 2.0 * u);
}

export function evaluateDynamicCameraFollowOffsets(
  aspectRatio,
  baseDistance,
  basePivotHeightY,
  baseShoulderOffsetX
) {
  const tau = computePortraitAspectFactor(aspectRatio);
  const dBase = Number.isFinite(baseDistance) ? baseDistance : 1.85;
  const yBase = Number.isFinite(basePivotHeightY) ? basePivotHeightY : 1.48;
  const xBase = Number.isFinite(baseShoulderOffsetX) ? baseShoulderOffsetX : 0.36;

  const effectiveDesiredDistance = dBase * (1.0 + DYNAMIC_CAM_BOOM_PULLBACK_FACTOR * tau);
  const effectivePivotHeightY = yBase + DYNAMIC_CAM_LOOKAT_Y_ELEVATION_M * tau;
  const effectiveShoulderOffsetX = xBase * (1.0 - tau);

  return {
    aspectRatio: Number.isFinite(aspectRatio) && aspectRatio > 0.05 ? aspectRatio : 16 / 9,
    portraitFactor: tau,
    effectiveDesiredDistance,
    effectivePivotHeightY,
    effectiveShoulderOffsetX,
  };
}

// ============================================================================
// 2. Pillar 1: Scene-Wide Boot-Up 3D Materialization & Glowing Bloom-Edge Dissolve (§4)
// ============================================================================
const DISSOLVE_FRAGMENT_HEADER_GLSL = /* glsl */ `
varying vec3 vDissolveWorldPos;
uniform float uDissolveActive;
uniform float uDissolveProgress;
uniform float uDissolveThickness;
uniform vec3 uDissolveEdgeColor;
uniform float uDissolveEdgeIntensity;
uniform float uDissolveNoiseFreq;
uniform float uDissolveSpatialWeight;
uniform float uDissolveCorridorZMin;
uniform float uDissolveCorridorZMax;

vec4 _dissolvePermute(vec4 x) {
  return mod(((x * 34.0) + 1.0) * x, 289.0);
}
vec4 _dissolveTaylorInvSqrt(vec4 r) {
  return 1.79284291400159 - 0.85373472095314 * r;
}
float _dissolveSimplex3D(vec3 v) {
  const vec2 C = vec2(1.0 / 6.0, 1.0 / 3.0);
  const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
  vec3 i = floor(v + dot(v, C.yyy));
  vec3 x0 = v - i + dot(i, C.xxx);
  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min(g.xyz, l.zxy);
  vec3 i2 = max(g.xyz, l.zxy);
  vec3 x1 = x0 - i1 + C.xxx;
  vec3 x2 = x0 - i2 + C.yyy;
  vec3 x3 = x0 - D.yyy;
  i = mod(i, 289.0);
  vec4 p = _dissolvePermute(
    _dissolvePermute(
      _dissolvePermute(i.z + vec4(0.0, i1.z, i2.z, 1.0))
      + i.y + vec4(0.0, i1.y, i2.y, 1.0)
    )
    + i.x + vec4(0.0, i1.x, i2.x, 1.0)
  );
  float n_ = 1.0 / 7.0;
  vec3 ns = n_ * D.wyz - D.xzx;
  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_);
  vec4 x = x_ * ns.x + ns.yyyy;
  vec4 y = y_ * ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);
  vec4 b0 = vec4(x.xy, y.xy);
  vec4 b1 = vec4(x.zw, y.zw);
  vec4 s0 = floor(b0) * 2.0 + 1.0;
  vec4 s1 = floor(b1) * 2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));
  vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
  vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;
  vec3 p0 = vec3(a0.xy, h.x);
  vec3 p1 = vec3(a0.zw, h.y);
  vec3 p2 = vec3(a1.xy, h.z);
  vec3 p3 = vec3(a1.zw, h.w);
  vec4 norm = _dissolveTaylorInvSqrt(vec4(dot(p0, p0), dot(p1, p1), dot(p2, p2), dot(p3, p3)));
  p0 *= norm.x;
  p1 *= norm.y;
  p2 *= norm.z;
  p3 *= norm.w;
  vec4 m = max(0.6 - vec4(dot(x0, x0), dot(x1, x1), dot(x2, x2), dot(x3, x3)), 0.0);
  m = m * m;
  return 42.0 * dot(m * m, vec4(dot(p0, x0), dot(p1, x1), dot(p2, x2), dot(p3, x3)));
}

float _dissolveFbm3D(vec3 p) {
  float n1 = _dissolveSimplex3D(p);
  float n2 = _dissolveSimplex3D(p * 2.03 + vec3(13.7, -7.4, 5.2));
  float raw = n1 * 0.68 + n2 * 0.32;
  return clamp(raw * 0.5 + 0.5, 0.0, 1.0);
}
`;

const DISSOLVE_FRAGMENT_MAIN_TAIL_GLSL = /* glsl */ `
  if (uDissolveActive > 0.5 && uDissolveProgress < 0.9999) {
    if (uDissolveProgress <= 0.0001) {
      discard;
    }
    float _dNoise = _dissolveFbm3D(vDissolveWorldPos * uDissolveNoiseFreq);
    float _dZNorm = clamp(
      (vDissolveWorldPos.z - uDissolveCorridorZMin) / max(1.0, uDissolveCorridorZMax - uDissolveCorridorZMin),
      0.0,
      1.0
    );
    float _dYNorm = clamp(vDissolveWorldPos.y / 6.5, 0.0, 1.0);
    float _dSpatial = 1.0 - clamp(_dZNorm * 0.76 + _dYNorm * 0.24, 0.0, 1.0);
    float _dField = clamp(mix(_dNoise, _dSpatial, uDissolveSpatialWeight), 0.0, 1.0);
    float _dThresh = (1.0 + uDissolveThickness) * (1.0 - uDissolveProgress);
    if (_dField < _dThresh - uDissolveThickness) {
      discard;
    }
    if (_dField < _dThresh) {
      float _dEdgeU = 1.0 - clamp((_dThresh - _dField) / max(0.0001, uDissolveThickness), 0.0, 1.0);
      float _dRimMask = smoothstep(0.0, 0.42, _dEdgeU);
      vec3 _dHdrRim = uDissolveEdgeColor * uDissolveEdgeIntensity;
      gl_FragColor.rgb = mix(gl_FragColor.rgb, _dHdrRim, clamp(_dRimMask * 0.92, 0.0, 1.0)) + _dHdrRim * (_dRimMask * _dRimMask * 0.65);
      gl_FragColor.a = max(gl_FragColor.a, _dRimMask);
    }
  }
`;

function shouldSkipDissolveForObject(obj) {
  if (!obj) return true;
  let curr = obj;
  while (curr) {
    const name = String(curr.name || '');
    if (
      name === 'COLLIDERS' ||
      name.startsWith('COLLIDER_') ||
      name === 'HologramTransformControlsHelper' ||
      name.includes('HitProxy') ||
      name.includes('SelectionFrame') ||
      name.includes('DirectorHandle') ||
      name.includes('FrustumHelper')
    ) {
      return true;
    }
    curr = curr.parent;
  }
  return false;
}

export function createSceneBootMaterializationSystem({
  scene,
  sandbox,
  defaultDurationSec = 2.8,
  edgeColorHex = '#eb5a13',
  edgeThickness = 0.085,
  edgeIntensity = 6.8,
} = {}) {
  const sharedUniforms = {
    uDissolveActive: { value: 0.0 },
    uDissolveProgress: { value: 1.0 },
    uDissolveThickness: { value: edgeThickness },
    uDissolveEdgeColor: { value: new THREE.Color(edgeColorHex) },
    uDissolveEdgeIntensity: { value: edgeIntensity },
    uDissolveNoiseFreq: { value: 0.85 },
    uDissolveSpatialWeight: { value: 0.28 },
    uDissolveCorridorZMin: { value: -2.0 },
    uDissolveCorridorZMax: { value: 58.0 },
  };

  const registeredMaterials = new Set();
  const registeredMeshes = new Set();
  const trackedLights = new Map();

  function patchCustomShaderMaterial(mat) {
    if (!mat || !mat.isShaderMaterial) return false;
    if (mat.userData && mat.userData._dissolvePatched070) return true;
    const vs = String(mat.vertexShader || '');
    const fs = String(mat.fragmentShader || '');
    if (!vs.includes('main') || !fs.includes('main')) return false;

    const lastVsBrace = vs.lastIndexOf('}');
    const lastFsBrace = fs.lastIndexOf('}');
    if (lastVsBrace === -1 || lastFsBrace === -1) return false;

    if (!mat.uniforms) mat.uniforms = {};
    Object.assign(mat.uniforms, sharedUniforms);

    if (!vs.includes('vDissolveWorldPos')) {
      const vsInject = /* glsl */ `
  vec4 _dissolveWp = modelMatrix * vec4(position, 1.0);
  #ifdef USE_INSTANCING
    _dissolveWp = modelMatrix * instanceMatrix * vec4(position, 1.0);
  #endif
  vDissolveWorldPos = _dissolveWp.xyz;
}
`;
      mat.vertexShader = `varying vec3 vDissolveWorldPos;\n${vs.slice(0, lastVsBrace)}\n${vsInject}`;
    }

    if (!fs.includes('uDissolveProgress')) {
      mat.fragmentShader = `${DISSOLVE_FRAGMENT_HEADER_GLSL}\n${fs.slice(0, lastFsBrace)}\n${DISSOLVE_FRAGMENT_MAIN_TAIL_GLSL}\n}`;
    }

    if (!mat.userData) mat.userData = {};
    mat.userData._dissolvePatched070 = true;
    mat.needsUpdate = true;
    return true;
  }

  function patchStandardMaterial(mat) {
    if (!mat || mat.isShaderMaterial) return false;
    if (mat.colorWrite === false) return false;
    if (mat.userData && mat.userData._dissolvePatched070) return true;

    const prevOnBeforeCompile = typeof mat.onBeforeCompile === 'function' ? mat.onBeforeCompile : null;
    const prevCacheKey =
      typeof mat.customProgramCacheKey === 'function' ? mat.customProgramCacheKey.bind(mat) : null;

    mat.onBeforeCompile = (shader, renderer) => {
      if (prevOnBeforeCompile) {
        prevOnBeforeCompile(shader, renderer);
      }
      Object.assign(shader.uniforms, sharedUniforms);

      if (!shader.vertexShader.includes('vDissolveWorldPos')) {
        shader.vertexShader = `varying vec3 vDissolveWorldPos;\n${shader.vertexShader}`;
        if (shader.vertexShader.includes('#include <project_vertex>')) {
          shader.vertexShader = shader.vertexShader.replace(
            '#include <project_vertex>',
            /* glsl */ `
#include <project_vertex>
vec4 _dissolveWp = modelMatrix * vec4(transformed, 1.0);
#ifdef USE_INSTANCING
  _dissolveWp = modelMatrix * instanceMatrix * vec4(transformed, 1.0);
#endif
vDissolveWorldPos = _dissolveWp.xyz;
`
          );
        }
      }

      if (!shader.fragmentShader.includes('uDissolveProgress')) {
        shader.fragmentShader = `${DISSOLVE_FRAGMENT_HEADER_GLSL}\n${shader.fragmentShader}`;
        if (shader.fragmentShader.includes('#include <tonemapping_fragment>')) {
          shader.fragmentShader = shader.fragmentShader.replace(
            '#include <tonemapping_fragment>',
            `${DISSOLVE_FRAGMENT_MAIN_TAIL_GLSL}\n#include <tonemapping_fragment>`
          );
        } else if (shader.fragmentShader.includes('#include <dithering_fragment>')) {
          shader.fragmentShader = shader.fragmentShader.replace(
            '#include <dithering_fragment>',
            `#include <dithering_fragment>\n${DISSOLVE_FRAGMENT_MAIN_TAIL_GLSL}`
          );
        } else {
          const lastBrace = shader.fragmentShader.lastIndexOf('}');
          if (lastBrace !== -1) {
            shader.fragmentShader = `${shader.fragmentShader.slice(0, lastBrace)}\n${DISSOLVE_FRAGMENT_MAIN_TAIL_GLSL}\n}`;
          }
        }
      }
    };

    mat.customProgramCacheKey = () => {
      const baseKey = prevCacheKey ? prevCacheKey() : '';
      return `${baseKey}_dissolve070_v1`;
    };

    if (!mat.userData) mat.userData = {};
    mat.userData._dissolvePatched070 = true;
    mat.needsUpdate = true;
    return true;
  }

  function registerSceneMaterials(rootObj = scene) {
    if (!rootObj || typeof rootObj.traverse !== 'function') return 0;
    let newlyRegistered = 0;

    rootObj.traverse((obj) => {
      if (shouldSkipDissolveForObject(obj)) return;

      if (obj.isLight && (obj.isPointLight || obj.isSpotLight)) {
        if (!trackedLights.has(obj) && Number.isFinite(obj.intensity) && obj.intensity > 0) {
          trackedLights.set(obj, obj.intensity);
        }
        return;
      }

      const isRenderable =
        obj.isMesh ||
        obj.isSkinnedMesh ||
        obj.isInstancedMesh ||
        obj.isLine ||
        obj.isLineSegments ||
        obj.isPoints;
      if (!isRenderable || !obj.material) return;

      const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
      let meshPatched = false;
      for (const m of mats) {
        if (!m || m.colorWrite === false) continue;
        const ok = m.isShaderMaterial ? patchCustomShaderMaterial(m) : patchStandardMaterial(m);
        if (ok) {
          meshPatched = true;
          if (!registeredMaterials.has(m)) {
            registeredMaterials.add(m);
            newlyRegistered++;
          }
        }
      }
      if (meshPatched) {
        registeredMeshes.add(obj);
      }
    });

    return newlyRegistered;
  }

  function syncLightIntensities(progress) {
    const p = Math.max(0.0, Math.min(1.0, Number(progress) || 0.0));
    const lightScale = p >= 0.999 ? 1.0 : Math.pow(p, 1.35);
    for (const [light, baseIntensity] of trackedLights.entries()) {
      if (light && Number.isFinite(baseIntensity)) {
        light.intensity = baseIntensity * lightScale;
      }
    }
  }

  const controller = {
    phase: 'idle',
    progress: 1.0,
    elapsedSec: 0.0,
    durationSec: defaultDurationSec,
    edgeColorHex,
    edgeThickness,
    edgeIntensity,
    uniforms: sharedUniforms,

    get registeredMaterialCount() {
      return registeredMaterials.size;
    },
    get registeredMeshCount() {
      return registeredMeshes.size;
    },
    get resolved() {
      return this.phase === 'resolved' || this.progress >= 0.9999;
    },

    registerSceneMaterials,

    getState() {
      return {
        phase: this.phase,
        progress: Number(this.progress.toFixed(4)),
        elapsedSec: Number(this.elapsedSec.toFixed(3)),
        durationSec: Number(this.durationSec.toFixed(3)),
        dissolveActiveUniform: sharedUniforms.uDissolveActive.value,
        edgeColorHex: `#${sharedUniforms.uDissolveEdgeColor.value.getHexString()}`,
        edgeThickness: sharedUniforms.uDissolveThickness.value,
        edgeIntensity: sharedUniforms.uDissolveEdgeIntensity.value,
        registeredMaterialCount: registeredMaterials.size,
        registeredMeshCount: registeredMeshes.size,
        resolved: this.resolved,
      };
    },

    setProgress(rawProgress) {
      registerSceneMaterials(scene);
      const p = Math.max(0.0, Math.min(1.0, Number(rawProgress)));
      this.progress = p;
      sharedUniforms.uDissolveProgress.value = p;
      if (p >= 0.9999) {
        this.progress = 1.0;
        sharedUniforms.uDissolveProgress.value = 1.0;
        sharedUniforms.uDissolveActive.value = 0.0;
        this.phase = 'resolved';
      } else {
        sharedUniforms.uDissolveActive.value = 1.0;
        this.phase = p <= 0.0001 && this.elapsedSec === 0.0 ? 'pre-boot' : 'materializing';
      }
      syncLightIntensities(this.progress);
      return this.getState();
    },

    stageForBoot() {
      registerSceneMaterials(scene);
      this.elapsedSec = 0.0;
      return this.setProgress(0.0);
    },

    playBootMaterialization({ durationSec = defaultDurationSec, fromProgress = 0.0 } = {}) {
      registerSceneMaterials(scene);
      const prefersReducedMotion =
        typeof window !== 'undefined' &&
        typeof window.matchMedia === 'function' &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (prefersReducedMotion) {
        return this.setProgress(1.0);
      }
      this.durationSec = Math.max(0.25, Number(durationSec) || defaultDurationSec);
      const startP = Math.max(0.0, Math.min(0.99, Number(fromProgress) || 0.0));
      this.elapsedSec = startP * this.durationSec;
      this.setProgress(startP);
      this.phase = 'materializing';
      return this.getState();
    },

    accelerateToResolved() {
      this.elapsedSec = this.durationSec;
      return this.setProgress(1.0);
    },

    update(dt) {
      if (this.phase !== 'materializing') return;
      const safeDt = Math.max(0.0, Math.min(0.1, Number(dt) || 0.0));
      this.elapsedSec += safeDt;
      const u = Math.max(0.0, Math.min(1.0, this.elapsedSec / Math.max(0.1, this.durationSec)));
      // Smooth cubic ease-out curve so foreground ignites briskly and corridor settles smoothly
      const eased = 1.0 - Math.pow(1.0 - u, 2.6);
      if (u >= 1.0) {
        this.setProgress(1.0);
      } else {
        this.setProgress(eased);
      }
    },
  };

  return controller;
}

// ============================================================================
// 3. Pillar 2: Glyph Materialization (Cipher Decode) & Portfolio Perimeter HUD (§5)
// ============================================================================
export const CIPHER_GLYPH_POOL = [
  '█',
  '▓',
  '▒',
  '░',
  '/',
  '\\',
  '|',
  '_',
  '+',
  '#',
  '0',
  '1',
  '<',
  '>',
];

function deterministicHash01(seedInt) {
  let x = (seedInt | 0) + 0x9e3779b9;
  x ^= x >>> 16;
  x = Math.imul(x, 0x85ebca6b);
  x ^= x >>> 13;
  x = Math.imul(x, 0xc2b2ae35);
  x ^= x >>> 16;
  return (x >>> 0) / 4294967295;
}

export class GlyphDecodeController {
  constructor() {
    this.activeJobs = new Map();
    this.frameCounter = 0;
    this.completedBootCount = 0;
  }

  isReducedMotion() {
    return Boolean(
      typeof window !== 'undefined' &&
        typeof window.matchMedia === 'function' &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches
    );
  }

  decodeElement(
    el,
    {
      text = null,
      delayMs = 0,
      durationMs = null,
      frameStep = 3, // Throttled to update every 2–4 frames (hud.md §4.2)
      speedMultiplier = 1.0,
      onComplete = null,
    } = {}
  ) {
    if (!el) return null;

    // Clean up any existing job on this element first so rapid hover never leaks or shifts
    this.cancelJob(el, { restoreResolved: true });

    const finalString =
      typeof text === 'string'
        ? text
        : el.getAttribute('data-hud-canonical-text') || el.textContent || '';
    el.setAttribute('data-hud-canonical-text', finalString);
    el.setAttribute('aria-label', finalString);

    if (this.isReducedMotion() || finalString.length === 0) {
      el.textContent = finalString;
      el.removeAttribute('data-cipher-state');
      if (typeof onComplete === 'function') onComplete(el);
      return null;
    }

    // 1. Measure & Lock Resolved Bounding Box in Normal Flow (Zero-Jitter Rule: CLS === 0.000)
    el.textContent = finalString;
    const rect = el.getBoundingClientRect();
    const lockedWidthPx = rect.width;
    const lockedHeightPx = rect.height;

    const charCount = finalString.length;
    const baseDuration =
      durationMs !== null
        ? durationMs
        : charCount <= 8
          ? 360
          : Math.min(880, 420 + charCount * 14);
    const effectiveDurationMs = Math.max(140, baseDuration / Math.max(0.25, speedMultiplier));

    if (lockedWidthPx > 0 && lockedHeightPx > 0) {
      el.style.boxSizing = 'border-box';
      el.style.width = `${lockedWidthPx.toFixed(2)}px`;
      el.style.height = `${lockedHeightPx.toFixed(2)}px`;
      el.style.minWidth = `${lockedWidthPx.toFixed(2)}px`;
      el.style.maxWidth = `${lockedWidthPx.toFixed(2)}px`;
      el.style.minHeight = `${lockedHeightPx.toFixed(2)}px`;
      el.style.maxHeight = `${lockedHeightPx.toFixed(2)}px`;
    }
    el.classList.add('hud-cipher-locked');
    el.setAttribute('data-cipher-state', 'dormant');
    el.setAttribute('data-hud-decoding', 'true');

    // In-flow invisible layout anchor + absolute aria-hidden cipher stage (screen readers read aria-label)
    el.textContent = '';
    const baseSizerSpan = document.createElement('span');
    baseSizerSpan.className = 'hud-cipher-sizer';
    baseSizerSpan.setAttribute('aria-hidden', 'true');
    baseSizerSpan.textContent = finalString;

    const stageSpan = document.createElement('span');
    stageSpan.className = 'hud-cipher-stage';
    stageSpan.setAttribute('aria-hidden', 'true');

    const charMeta = [];
    for (let i = 0; i < charCount; i++) {
      const ch = finalString[i];
      const isWhitespace = ch === ' ' || ch === '\n' || ch === '\t';
      const cSpan = document.createElement('span');
      cSpan.className = isWhitespace ? 'hud-cipher-char is-space' : 'hud-cipher-char is-dormant';
      cSpan.textContent = ch;
      stageSpan.appendChild(cSpan);

      const uWave = charCount > 1 ? i / (charCount - 1) : 0.0;
      const variance = (deterministicHash01(i * 31 + charCount * 17) - 0.5) * 0.14;
      const startFrac = Math.max(0.0, Math.min(0.62, uWave * 0.52));
      const endFrac = Math.max(
        startFrac + 0.25,
        Math.min(1.0, 0.42 + uWave * 0.54 + variance)
      );

      charMeta.push({
        index: i,
        targetChar: ch,
        isWhitespace,
        span: cSpan,
        startFrac,
        endFrac,
        state: isWhitespace ? 'resolved' : 'dormant',
        lastSwapFrame: -999,
        glyphSeed: i * 97 + charCount * 13,
      });
    }

    el.appendChild(baseSizerSpan);
    el.appendChild(stageSpan);

    const job = {
      el,
      finalString,
      delayMs: Math.max(0, Number(delayMs) || 0),
      durationMs: effectiveDurationMs,
      elapsedMs: 0,
      startedAtNowMs: typeof performance !== 'undefined' ? performance.now() : null,
      frameStep: Math.max(2, Math.min(4, Math.round(frameStep))),
      lockedWidthPx,
      lockedHeightPx,
      charMeta,
      baseSizerSpan,
      stageSpan,
      onComplete,
    };

    this.activeJobs.set(el, job);
    return job;
  }

  cancelJob(el, { restoreResolved = true } = {}) {
    const job = this.activeJobs.get(el);
    if (!job) return;
    this.activeJobs.delete(el);
    if (restoreResolved && job.el) {
      this._finalizeElementDOM(job);
    }
  }

  _finalizeElementDOM(job) {
    const { el, finalString, onComplete } = job;
    if (!el) return;
    // DOM Cleanliness (hud.md §6): remove all temporary wrapper spans and inline locks
    el.innerHTML = '';
    el.textContent = finalString;
    el.style.boxSizing = '';
    el.style.width = '';
    el.style.height = '';
    el.style.minWidth = '';
    el.style.maxWidth = '';
    el.style.minHeight = '';
    el.style.maxHeight = '';
    el.classList.remove('hud-cipher-locked');
    el.setAttribute('data-cipher-state', 'resolved');
    el.removeAttribute('data-hud-decoding');
    this.completedBootCount++;
    if (typeof onComplete === 'function') {
      onComplete(el);
    }
  }

  resolveAllImmediate() {
    for (const job of Array.from(this.activeJobs.values())) {
      this.activeJobs.delete(job.el);
      this._finalizeElementDOM(job);
    }
  }

  step(dtSec) {
    if (this.activeJobs.size === 0) return;
    this.frameCounter++;
    const dtMs = Math.max(1.0, Math.min(100.0, (Number(dtSec) || 1 / 60) * 1000.0));
    const nowMs = typeof performance !== 'undefined' ? performance.now() : null;

    for (const [el, job] of Array.from(this.activeJobs.entries())) {
      const simElapsed = job.elapsedMs + dtMs;
      const wallElapsed =
        nowMs !== null && job.startedAtNowMs !== null ? Math.max(0, nowMs - job.startedAtNowMs) : 0;
      job.elapsedMs = Math.max(simElapsed, wallElapsed);
      if (job.elapsedMs < job.delayMs) {
        continue;
      }

      const activeElapsed = job.elapsedMs - job.delayMs;
      const progress = Math.max(0.0, Math.min(1.0, activeElapsed / job.durationMs));

      if (progress >= 1.0) {
        this.activeJobs.delete(el);
        this._finalizeElementDOM(job);
        continue;
      }

      if (el.getAttribute('data-cipher-state') !== 'scrambling') {
        el.setAttribute('data-cipher-state', 'scrambling');
      }

      for (let i = 0; i < job.charMeta.length; i++) {
        const cm = job.charMeta[i];
        if (cm.isWhitespace) continue;

        if (progress < cm.startFrac) {
          if (cm.state !== 'dormant') {
            cm.state = 'dormant';
            cm.span.className = 'hud-cipher-char is-dormant';
          }
        } else if (progress < cm.endFrac) {
          if (cm.state !== 'scrambling') {
            cm.state = 'scrambling';
            cm.span.className = 'hud-cipher-char is-hot';
          }
          // Throttled Frame-Stepped Scramble Rate: only swap glyph every 2–4 frames (hud.md §4.2)
          if (this.frameCounter - cm.lastSwapFrame >= job.frameStep) {
            cm.lastSwapFrame = this.frameCounter;
            cm.glyphSeed += 19;
            const poolIdx =
              Math.floor(deterministicHash01(cm.glyphSeed) * CIPHER_GLYPH_POOL.length) %
              CIPHER_GLYPH_POOL.length;
            cm.span.textContent = CIPHER_GLYPH_POOL[poolIdx];
          }
        } else if (cm.state !== 'resolved') {
          cm.state = 'resolved';
          cm.span.className = 'hud-cipher-char is-resolved';
          cm.span.textContent = cm.targetChar;
        }
      }
    }
  }
}

export const DESKTOP_REQUIRED_KEYS = Object.freeze(['W', 'A', 'S', 'D', 'Q']);

export function createPortfolioPerimeterHUD({ sandbox } = {}) {
  const decodeController = new GlyphDecodeController();
  let lastFrameTimeMs = 16.6;
  let smoothedFrameMs = 16.6;
  let bootChoreographyPlayed = false;
  let analogFlickerPlayedCount = 0;
  let lastAnalogFlickerReason = null;
  let analogStaggerTimer = null;
  let leftStickFlickerTimer = null;
  let rightStickFlickerTimer = null;
  let mp3StaggerTimer = null;
  let mp3FlickerTimer = null;
  let mp3FlickerPlayedCount = 0;
  let desktopControlsStaggerTimer = null;
  let desktopControlsFlickerTimer = null;
  let desktopControlsFlickerPlayedCount = 0;
  let desktopIntroStaggerTimer = null;
  let desktopIntroFlickerTimer = null;
  let desktopIntroResolveTimer = null;
  let desktopIntroDissolveTimer = null;
  let desktopIntroFlickerPlayedCount = 0;
  let desktopIntroPhase = 'dormant'; // 'dormant' | 'deferred-doom-chat' | 'active' | 'resolving' | 'completed'
  const verifiedKeys = new Set();
  const livePressedKeys = new Set();
  const pointerReleaseTimers = new Map();
  let wasTouchControlsSuppressed = false;
  const buttonPointerDownTimestamps = new WeakMap();

  function getElements() {
    if (typeof document === 'undefined') return {};
    return {
      root: document.getElementById('portfolio-perimeter-hud'),
      topLeft: document.getElementById('portfolio-hud-top-left'),
      brand: document.getElementById('portfolio-hud-brand'),
      roles: document.getElementById('portfolio-hud-roles'),
      navBar: document.getElementById('mobile-touch-actions'),
      navInteractBtn: document.getElementById('mobile-action-interact-btn'),
      navMenuBtn: document.getElementById('mobile-action-mode-btn'),
      navChatBtn: document.getElementById('portfolio-hud-chat-btn'),
      mp3Hud: document.getElementById('doom-tracks-mp3-hud'),
      desktopControls: document.getElementById('portfolio-hud-desktop-controls'),
      brKeyW: document.getElementById('hud-br-key-w'),
      brKeyA: document.getElementById('hud-br-key-a'),
      brKeyS: document.getElementById('hud-br-key-s'),
      brKeyD: document.getElementById('hud-br-key-d'),
      brKeyQ: document.getElementById('hud-br-key-q'),
      brMoveLabel: document.getElementById('hud-br-move-label'),
      brMenuLabel: document.getElementById('hud-br-menu-label'),
      desktopIntroOverlay: document.getElementById('desktop-wasdq-intro-overlay'),
      desktopIntroCard: document.getElementById('desktop-wasdq-intro-card'),
      desktopIntroPrompt: document.getElementById('desktop-wasdq-intro-prompt'),
      desktopIntroCounter: document.getElementById('desktop-wasdq-intro-counter'),
      desktopIntroMoveCaption: document.getElementById('desktop-wasdq-intro-move-caption'),
      desktopIntroMenuCaption: document.getElementById('desktop-wasdq-intro-menu-caption'),
      introKeyW: document.getElementById('hud-intro-key-w'),
      introKeyA: document.getElementById('hud-intro-key-a'),
      introKeyS: document.getElementById('hud-intro-key-s'),
      introKeyD: document.getElementById('hud-intro-key-d'),
      introKeyQ: document.getElementById('hud-intro-key-q'),
      touchControls: document.getElementById('mobile-touch-controls'),
      leftStick: document.getElementById('mobile-left-thumbpad'),
      rightStick: document.getElementById('mobile-right-thumbpad'),
      leftStickLabel: document.getElementById('mobile-left-thumbpad-label'),
      rightStickLabel: document.getElementById('mobile-right-thumbpad-label'),
    };
  }

  function isMobileModeActive() {
    if (typeof document !== 'undefined' && document.body && document.body.classList.contains('mobile-touch-enabled')) {
      return true;
    }
    return Boolean(sandbox && sandbox.mobileTouch && sandbox.mobileTouch.enabled);
  }

  function isDoomChatCurrentlyActive() {
    if (sandbox && sandbox.isDoomChatOpen) return true;
    return Boolean(
      typeof document !== 'undefined' &&
        document.body &&
        document.body.classList.contains('doom-chat-active')
    );
  }

  function isIntroSequenceHoldingHUD() {
    if (!sandbox || !sandbox.director) return false;
    if (sandbox.mode !== 'scroll') return false;
    const panMode = sandbox.director.cameraPanState ? sandbox.director.cameraPanState.mode : '';
    const introPhase = sandbox.director.introSequenceState
      ? sandbox.director.introSequenceState.phase
      : '';
    return (
      panMode === 'playing' ||
      introPhase === 'pan-playing' ||
      introPhase === 'dialogue-active'
    );
  }

  function isDesktopKeyIntroGating() {
    if (isMobileModeActive()) return false;
    if (isIntroSequenceHoldingHUD()) return false;
    if (isDoomChatCurrentlyActive()) return false;
    return desktopIntroPhase === 'active' && verifiedKeys.size < DESKTOP_REQUIRED_KEYS.length;
  }

  function syncBodyIntroGatingClass() {
    if (typeof document !== 'undefined' && document.body) {
      document.body.classList.toggle('desktop-key-intro-active', isDesktopKeyIntroGating());
    }
  }

  function pulseDesktopIntroGateNudge() {
    const els = getElements();
    if (!els.desktopIntroCard || !isDesktopKeyIntroGating()) return;
    els.desktopIntroCard.classList.remove('gate-nudge');
    void els.desktopIntroCard.offsetWidth;
    els.desktopIntroCard.classList.add('gate-nudge');
  }

  function clearAnalogFlickerTimers() {
    if (analogStaggerTimer !== null) {
      clearTimeout(analogStaggerTimer);
      analogStaggerTimer = null;
    }
    if (leftStickFlickerTimer !== null) {
      clearTimeout(leftStickFlickerTimer);
      leftStickFlickerTimer = null;
    }
    if (rightStickFlickerTimer !== null) {
      clearTimeout(rightStickFlickerTimer);
      rightStickFlickerTimer = null;
    }
  }

  function clearMp3FlickerTimers() {
    if (mp3StaggerTimer !== null) {
      clearTimeout(mp3StaggerTimer);
      mp3StaggerTimer = null;
    }
    if (mp3FlickerTimer !== null) {
      clearTimeout(mp3FlickerTimer);
      mp3FlickerTimer = null;
    }
  }

  function clearDesktopControlsTimers() {
    if (desktopControlsStaggerTimer !== null) {
      clearTimeout(desktopControlsStaggerTimer);
      desktopControlsStaggerTimer = null;
    }
    if (desktopControlsFlickerTimer !== null) {
      clearTimeout(desktopControlsFlickerTimer);
      desktopControlsFlickerTimer = null;
    }
  }

  function clearDesktopIntroTimers() {
    if (desktopIntroStaggerTimer !== null) {
      clearTimeout(desktopIntroStaggerTimer);
      desktopIntroStaggerTimer = null;
    }
    if (desktopIntroFlickerTimer !== null) {
      clearTimeout(desktopIntroFlickerTimer);
      desktopIntroFlickerTimer = null;
    }
    if (desktopIntroResolveTimer !== null) {
      clearTimeout(desktopIntroResolveTimer);
      desktopIntroResolveTimer = null;
    }
    if (desktopIntroDissolveTimer !== null) {
      clearTimeout(desktopIntroDissolveTimer);
      desktopIntroDissolveTimer = null;
    }
  }

  function clearPointerReleaseTimers() {
    for (const timer of pointerReleaseTimers.values()) {
      clearTimeout(timer);
    }
    pointerReleaseTimers.clear();
  }

  function getBrKeyMap(els) {
    return {
      W: els.brKeyW,
      A: els.brKeyA,
      S: els.brKeyS,
      D: els.brKeyD,
      Q: els.brKeyQ,
    };
  }

  function getIntroKeyMap(els) {
    return {
      W: els.introKeyW,
      A: els.introKeyA,
      S: els.introKeyS,
      D: els.introKeyD,
      Q: els.introKeyQ,
    };
  }

  function syncDesktopControlsHighlights() {
    const els = getElements();
    const brMap = getBrKeyMap(els);
    const isRadialOpen = Boolean(
      sandbox &&
        sandbox.radialMenu &&
        typeof sandbox.radialMenu.isOpen === 'function' &&
        sandbox.radialMenu.isOpen()
    );
    for (const k of DESKTOP_REQUIRED_KEYS) {
      const btn = brMap[k];
      if (!btn) continue;
      const active = k === 'Q' ? isRadialOpen || livePressedKeys.has('Q') : livePressedKeys.has(k);
      btn.classList.toggle('is-pressed', active);
      btn.classList.toggle('active-pill', active);
    }
  }

  function syncDesktopIntroDOM({ decodeCounter = false } = {}) {
    const els = getElements();
    if (!els.desktopIntroOverlay) return;
    els.desktopIntroOverlay.setAttribute('data-intro-phase', desktopIntroPhase);

    const introMap = getIntroKeyMap(els);
    for (const k of DESKTOP_REQUIRED_KEYS) {
      const btn = introMap[k];
      if (!btn) continue;
      const done = verifiedKeys.has(k);
      btn.classList.toggle('is-verified', done);
      btn.classList.toggle('active-pill', done);
      btn.setAttribute('aria-pressed', done ? 'true' : 'false');
    }

    const wasdComplete =
      verifiedKeys.has('W') &&
      verifiedKeys.has('A') &&
      verifiedKeys.has('S') &&
      verifiedKeys.has('D');
    if (els.desktopIntroMoveCaption) {
      els.desktopIntroMoveCaption.classList.toggle('is-group-complete', wasdComplete);
    }
    if (els.desktopIntroMenuCaption) {
      els.desktopIntroMenuCaption.classList.toggle('is-group-complete', verifiedKeys.has('Q'));
    }

    const counterStr = `${String(verifiedKeys.size).padStart(2, '0')} / 05`;
    if (els.desktopIntroCounter) {
      els.desktopIntroCounter.setAttribute('data-hud-canonical-text', counterStr);
      if (decodeCounter) {
        decodeController.decodeElement(els.desktopIntroCounter, {
          text: counterStr,
          delayMs: 0,
          durationMs: 240,
          frameStep: 2,
        });
      } else if (!decodeController.activeJobs.has(els.desktopIntroCounter)) {
        els.desktopIntroCounter.textContent = counterStr;
        els.desktopIntroCounter.setAttribute('aria-label', counterStr);
      }
    }

    syncBodyIntroGatingClass();
  }

  function triggerDesktopControlsFlickerOn({
    delayMs = 165,
    decodeText = false,
    reason = 'post-dialogue',
  } = {}) {
    const els = getElements();
    if (!els.desktopControls || isMobileModeActive()) return;

    clearDesktopControlsTimers();

    const startFlicker = () => {
      desktopControlsStaggerTimer = null;
      if (isIntroSequenceHoldingHUD() || isMobileModeActive()) return;
      const curEls = getElements();
      const ctrlEl = curEls.desktopControls;
      if (!ctrlEl) return;

      ctrlEl.classList.add('desktop-controls-materialized');
      ctrlEl.classList.remove('flicker-waiting', 'flicker-on');

      if (decodeText) {
        const decodeTargets = [
          { el: curEls.brKeyW, text: 'W', delay: 0, duration: 360 },
          { el: curEls.brKeyA, text: 'A', delay: 35, duration: 360 },
          { el: curEls.brKeyS, text: 'S', delay: 65, duration: 360 },
          { el: curEls.brKeyD, text: 'D', delay: 95, duration: 360 },
          { el: curEls.brKeyQ, text: 'Q', delay: 125, duration: 360 },
          { el: curEls.brMoveLabel, text: 'MOVE', delay: 60, duration: 520 },
          { el: curEls.brMenuLabel, text: 'MENU', delay: 130, duration: 520 },
        ];
        for (const item of decodeTargets) {
          if (item.el) {
            decodeController.decodeElement(item.el, {
              text: item.text,
              delayMs: item.delay,
              durationMs: item.duration,
              frameStep: 3,
            });
          }
        }
      }

      void ctrlEl.offsetWidth;
      ctrlEl.classList.add('flicker-on');
      ctrlEl.setAttribute('data-flicker-state', 'flicker-on');
      ctrlEl.setAttribute('data-flicker-reason', reason);
      desktopControlsFlickerPlayedCount++;
      syncDesktopControlsHighlights();

      desktopControlsFlickerTimer = setTimeout(() => {
        desktopControlsFlickerTimer = null;
        if (ctrlEl && ctrlEl.getAttribute('data-flicker-state') === 'flicker-on') {
          ctrlEl.classList.remove('flicker-on');
          ctrlEl.setAttribute('data-flicker-state', 'settled');
        }
      }, 530);
    };

    const waitMs = Math.max(0, Number(delayMs) || 0);
    if (waitMs <= 0) {
      startFlicker();
    } else {
      els.desktopControls.classList.add('desktop-controls-materialized', 'flicker-waiting');
      els.desktopControls.classList.remove('flicker-on');
      els.desktopControls.setAttribute('data-flicker-state', 'flicker-pending');
      desktopControlsStaggerTimer = setTimeout(startFlicker, waitMs);
    }
  }

  function startDesktopKeyIntro({ delayMs = 90, reason = 'post-dialogue' } = {}) {
    const els = getElements();
    if (!els.desktopIntroOverlay || !els.desktopIntroCard) return false;
    if (isMobileModeActive() || desktopIntroPhase === 'completed') return false;

    clearDesktopIntroTimers();
    desktopIntroPhase = 'active';
    els.desktopIntroOverlay.classList.add('intro-visible');
    els.desktopIntroOverlay.setAttribute('data-intro-phase', 'active');
    els.desktopIntroCard.classList.remove('is-resolving', 'dissolve-out', 'gate-nudge');
    syncDesktopIntroDOM({ decodeCounter: false });

    const igniteIntro = () => {
      desktopIntroStaggerTimer = null;
      if (isIntroSequenceHoldingHUD() || isMobileModeActive() || desktopIntroPhase !== 'active') {
        return;
      }
      if (isDoomChatCurrentlyActive()) {
        desktopIntroPhase = 'deferred-doom-chat';
        els.desktopIntroOverlay.classList.remove('intro-visible');
        els.desktopIntroOverlay.setAttribute('data-intro-phase', 'deferred-doom-chat');
        syncBodyIntroGatingClass();
        return;
      }

      const curEls = getElements();
      const cardEl = curEls.desktopIntroCard;
      if (!cardEl) return;

      cardEl.classList.remove('flicker-waiting', 'flicker-on');
      const counterStr = `${String(verifiedKeys.size).padStart(2, '0')} / 05`;

      const decodeBatch = [
        {
          el: curEls.desktopIntroPrompt,
          text: 'CALIBRATE CONTROLS // PRESS EACH KEY',
          delay: 0,
          duration: 740,
        },
        { el: curEls.desktopIntroCounter, text: counterStr, delay: 45, duration: 540 },
        { el: curEls.introKeyW, text: 'W', delay: 30, duration: 380 },
        { el: curEls.introKeyA, text: 'A', delay: 65, duration: 380 },
        { el: curEls.introKeyS, text: 'S', delay: 100, duration: 380 },
        { el: curEls.introKeyD, text: 'D', delay: 135, duration: 380 },
        { el: curEls.introKeyQ, text: 'Q', delay: 170, duration: 380 },
        { el: curEls.desktopIntroMoveCaption, text: 'MOVE ALLEY', delay: 95, duration: 640 },
        { el: curEls.desktopIntroMenuCaption, text: 'RADIAL MENU', delay: 155, duration: 640 },
      ];
      for (const item of decodeBatch) {
        if (item.el) {
          decodeController.decodeElement(item.el, {
            text: item.text,
            delayMs: item.delay,
            durationMs: item.duration,
            frameStep: 3,
          });
        }
      }

      void cardEl.offsetWidth;
      cardEl.classList.add('flicker-on');
      cardEl.setAttribute('data-flicker-state', 'flicker-on');
      cardEl.setAttribute('data-flicker-reason', reason);
      desktopIntroFlickerPlayedCount++;
      syncBodyIntroGatingClass();

      desktopIntroFlickerTimer = setTimeout(() => {
        desktopIntroFlickerTimer = null;
        if (cardEl && cardEl.getAttribute('data-flicker-state') === 'flicker-on') {
          cardEl.classList.remove('flicker-on');
          cardEl.setAttribute('data-flicker-state', 'settled');
        }
      }, 530);
    };

    const waitMs = Math.max(0, Number(delayMs) || 0);
    if (waitMs <= 0) {
      igniteIntro();
    } else {
      els.desktopIntroCard.classList.add('flicker-waiting');
      els.desktopIntroCard.classList.remove('flicker-on');
      els.desktopIntroCard.setAttribute('data-flicker-state', 'flicker-pending');
      desktopIntroStaggerTimer = setTimeout(igniteIntro, waitMs);
    }
    return true;
  }

  function completeDesktopKeyIntro() {
    const els = getElements();
    clearDesktopIntroTimers();
    desktopIntroPhase = 'resolving';
    syncBodyIntroGatingClass(); // Immediate 0ms input gate release (Spec 072 §6.3.4)

    if (els.desktopIntroOverlay) {
      els.desktopIntroOverlay.setAttribute('data-intro-phase', 'resolving');
    }
    if (els.desktopIntroCard) {
      els.desktopIntroCard.classList.remove('flicker-waiting', 'flicker-on', 'gate-nudge');
      els.desktopIntroCard.classList.add('is-resolving');
      els.desktopIntroCard.setAttribute('data-flicker-state', 'resolving');
    }
    if (els.desktopIntroPrompt) {
      decodeController.decodeElement(els.desktopIntroPrompt, {
        text: 'NAVIGATION ONLINE // READY',
        delayMs: 0,
        durationMs: 280,
        frameStep: 2,
      });
    }

    desktopIntroResolveTimer = setTimeout(() => {
      desktopIntroResolveTimer = null;
      const curEls = getElements();
      if (curEls.desktopIntroCard) {
        curEls.desktopIntroCard.classList.add('dissolve-out');
        curEls.desktopIntroCard.setAttribute('data-flicker-state', 'dissolving');
      }
      desktopIntroDissolveTimer = setTimeout(() => {
        desktopIntroDissolveTimer = null;
        desktopIntroPhase = 'completed';
        const finalEls = getElements();
        if (finalEls.desktopIntroOverlay) {
          finalEls.desktopIntroOverlay.classList.remove('intro-visible');
          finalEls.desktopIntroOverlay.setAttribute('data-intro-phase', 'completed');
        }
        if (finalEls.desktopIntroCard) {
          finalEls.desktopIntroCard.classList.remove('is-resolving', 'dissolve-out', 'flicker-on', 'flicker-waiting');
          finalEls.desktopIntroCard.setAttribute('data-flicker-state', 'completed');
        }
        const introCleanupTargets = [
          finalEls.desktopIntroPrompt,
          finalEls.desktopIntroCounter,
          finalEls.desktopIntroMoveCaption,
          finalEls.desktopIntroMenuCaption,
          finalEls.introKeyW,
          finalEls.introKeyA,
          finalEls.introKeyS,
          finalEls.introKeyD,
          finalEls.introKeyQ,
        ];
        for (const tEl of introCleanupTargets) {
          if (tEl) decodeController.cancelJob(tEl, { restoreResolved: true });
        }
        syncBodyIntroGatingClass();
      }, 265);
    }, 420);
  }

  function handleDesktopKeyActuation(
    rawKey,
    { source = 'keyboard', isDown = true, isRepeat = false } = {}
  ) {
    const key = String(rawKey || '').toUpperCase();
    if (!DESKTOP_REQUIRED_KEYS.includes(key)) return false;

    if (source === 'pointer') {
      const prevTimer = pointerReleaseTimers.get(key);
      if (prevTimer) clearTimeout(prevTimer);
      livePressedKeys.add(key);
      pointerReleaseTimers.set(
        key,
        setTimeout(() => {
          pointerReleaseTimers.delete(key);
          livePressedKeys.delete(key);
          syncDesktopControlsHighlights();
        }, 210)
      );
    } else if (isDown) {
      livePressedKeys.add(key);
    } else {
      livePressedKeys.delete(key);
    }

    syncDesktopControlsHighlights();

    if (!isDown) return false;
    if (isMobileModeActive() || isIntroSequenceHoldingHUD() || isDoomChatCurrentlyActive()) {
      return false;
    }

    const els = getElements();
    if (els.desktopControls && els.desktopControls.classList.contains('flicker-waiting')) {
      clearDesktopControlsTimers();
      els.desktopControls.classList.remove('flicker-waiting', 'flicker-on');
      els.desktopControls.setAttribute('data-flicker-state', 'settled');
    }

    if (desktopIntroPhase === 'active' && !verifiedKeys.has(key)) {
      if (els.desktopIntroCard && els.desktopIntroCard.classList.contains('flicker-waiting')) {
        clearDesktopIntroTimers();
        els.desktopIntroCard.classList.remove('flicker-waiting', 'flicker-on');
        els.desktopIntroCard.setAttribute('data-flicker-state', 'settled');
      }

      verifiedKeys.add(key);
      const introMap = getIntroKeyMap(els);
      const keyBtn = introMap[key];
      if (keyBtn) {
        keyBtn.classList.add('is-verified', 'active-pill');
        keyBtn.classList.remove('just-verified');
        void keyBtn.offsetWidth;
        keyBtn.classList.add('just-verified');
        keyBtn.setAttribute('aria-pressed', 'true');
        decodeController.decodeElement(keyBtn, {
          text: key,
          delayMs: 0,
          durationMs: 250,
          frameStep: 2,
        });
      }

      syncDesktopIntroDOM({ decodeCounter: false });

      if (verifiedKeys.size >= DESKTOP_REQUIRED_KEYS.length) {
        completeDesktopKeyIntro();
      }
      return true;
    }

    return false;
  }

  function clearLiveKeyHighlights() {
    clearPointerReleaseTimers();
    livePressedKeys.clear();
    syncDesktopControlsHighlights();
  }

  function onDeviceModeChanged(isMobile) {
    syncBodyIntroGatingClass();
    if (isMobile) {
      clearDesktopControlsTimers();
      clearLiveKeyHighlights();
      if (bootChoreographyPlayed && !isIntroSequenceHoldingHUD()) {
        const els = getElements();
        if (els.touchControls && !els.touchControls.classList.contains('analog-materialized')) {
          triggerAnalogFlickerOn({ delayMs: 40, reason: 'mobile-mode-enter' });
        }
      }
      return;
    }
    if (bootChoreographyPlayed && !isIntroSequenceHoldingHUD()) {
      const els = getElements();
      if (els.desktopControls && !els.desktopControls.classList.contains('desktop-controls-materialized')) {
        triggerDesktopControlsFlickerOn({ delayMs: 40, decodeText: true, reason: 'desktop-mode-enter' });
      }
      if (desktopIntroPhase === 'dormant' && verifiedKeys.size < DESKTOP_REQUIRED_KEYS.length) {
        if (isDoomChatCurrentlyActive()) {
          desktopIntroPhase = 'deferred-doom-chat';
        } else {
          startDesktopKeyIntro({ delayMs: 60, reason: 'desktop-mode-enter' });
        }
      }
      syncDesktopIntroDOM({ decodeCounter: false });
      syncDesktopControlsHighlights();
    }
  }

  function overrideMp3FlickerOnTouch() {
    const els = getElements();
    clearMp3FlickerTimers();
    if (els.mp3Hud) {
      els.mp3Hud.classList.add('mp3-materialized');
      els.mp3Hud.classList.remove('flicker-on', 'flicker-waiting');
      els.mp3Hud.setAttribute('data-flicker-state', 'active-override');
    }
  }

  function triggerMp3FlickerOn({ delayMs = 150, reason = 'post-dialogue' } = {}) {
    const els = getElements();
    if (!els.mp3Hud) return;

    clearMp3FlickerTimers();

    const startMp3Flicker = () => {
      mp3StaggerTimer = null;
      if (isIntroSequenceHoldingHUD()) return;
      const currentEls = getElements();
      const mp3El = currentEls.mp3Hud;
      if (!mp3El) return;
      mp3El.classList.add('mp3-materialized');
      mp3El.classList.remove('flicker-waiting', 'flicker-on');
      void mp3El.offsetWidth;
      mp3El.classList.add('flicker-on');
      mp3El.setAttribute('data-flicker-state', 'flicker-on');
      mp3El.setAttribute('data-flicker-reason', reason);
      mp3FlickerPlayedCount++;

      mp3FlickerTimer = setTimeout(() => {
        mp3FlickerTimer = null;
        if (mp3El && mp3El.getAttribute('data-flicker-state') === 'flicker-on') {
          mp3El.classList.remove('flicker-on');
          mp3El.setAttribute('data-flicker-state', 'settled');
        }
      }, 530);
    };

    const waitMs = Math.max(0, Number(delayMs) || 0);
    if (waitMs <= 0) {
      startMp3Flicker();
    } else {
      els.mp3Hud.classList.add('mp3-materialized');
      els.mp3Hud.classList.remove('flicker-on');
      els.mp3Hud.setAttribute('data-flicker-state', 'flicker-pending');
      mp3StaggerTimer = setTimeout(startMp3Flicker, waitMs);
    }
  }

  function overrideAnalogFlickerOnTouch(side = 'both') {
    const els = getElements();
    if (analogStaggerTimer !== null) {
      clearTimeout(analogStaggerTimer);
      analogStaggerTimer = null;
      if (els.touchControls) {
        els.touchControls.classList.add('analog-materialized');
      }
    }
    if (side === 'left' || side === 'both') {
      if (leftStickFlickerTimer !== null) {
        clearTimeout(leftStickFlickerTimer);
        leftStickFlickerTimer = null;
      }
      if (els.leftStick) {
        els.leftStick.classList.remove('flicker-on', 'flicker-waiting');
        els.leftStick.setAttribute('data-flicker-state', 'active-override');
      }
    }
    if (side === 'right' || side === 'both') {
      if (rightStickFlickerTimer !== null) {
        clearTimeout(rightStickFlickerTimer);
        rightStickFlickerTimer = null;
      }
      if (els.rightStick) {
        els.rightStick.classList.remove('flicker-on', 'flicker-waiting');
        els.rightStick.setAttribute('data-flicker-state', 'active-override');
      }
    }
  }

  function triggerAnalogFlickerOn({ delayMs = 210, reason = 'post-dialogue' } = {}) {
    const els = getElements();
    if (!els.touchControls || !els.leftStick || !els.rightStick) return;

    clearAnalogFlickerTimers();
    lastAnalogFlickerReason = reason;

    const startFlicker = () => {
      analogStaggerTimer = null;
      if (isIntroSequenceHoldingHUD()) return;
      els.touchControls.classList.add('analog-materialized');
      analogFlickerPlayedCount++;

      // Left stick leads right stick by 65ms (520ms keyframe duration each, Spec 071 §6.2.2)
      els.leftStick.classList.remove('flicker-waiting', 'flicker-on');
      void els.leftStick.offsetWidth;
      els.leftStick.classList.add('flicker-on');
      els.leftStick.setAttribute('data-flicker-state', 'flicker-on');

      els.rightStick.classList.remove('flicker-waiting', 'flicker-on');
      void els.rightStick.offsetWidth;
      els.rightStick.classList.add('flicker-on');
      els.rightStick.setAttribute('data-flicker-state', 'flicker-on');

      leftStickFlickerTimer = setTimeout(() => {
        leftStickFlickerTimer = null;
        if (els.leftStick && els.leftStick.getAttribute('data-flicker-state') === 'flicker-on') {
          els.leftStick.classList.remove('flicker-on');
          els.leftStick.setAttribute('data-flicker-state', 'settled');
        }
      }, 530);

      rightStickFlickerTimer = setTimeout(() => {
        rightStickFlickerTimer = null;
        if (els.rightStick && els.rightStick.getAttribute('data-flicker-state') === 'flicker-on') {
          els.rightStick.classList.remove('flicker-on');
          els.rightStick.setAttribute('data-flicker-state', 'settled');
        }
      }, 595);
    };

    const waitMs = Math.max(0, Number(delayMs) || 0);
    if (waitMs <= 0) {
      startFlicker();
    } else {
      els.leftStick.classList.add('flicker-waiting');
      els.rightStick.classList.add('flicker-waiting');
      els.leftStick.setAttribute('data-flicker-state', 'flicker-Pending');
      els.rightStick.setAttribute('data-flicker-state', 'flicker-Pending');
      analogStaggerTimer = setTimeout(startFlicker, waitMs);
    }
  }

  function resetToDormantPreDialogueState() {
    const els = getElements();
    decodeController.resolveAllImmediate();
    clearAnalogFlickerTimers();
    clearMp3FlickerTimers();
    clearDesktopControlsTimers();
    clearDesktopIntroTimers();
    clearPointerReleaseTimers();
    bootChoreographyPlayed = false;
    desktopIntroPhase = 'dormant';
    verifiedKeys.clear();
    livePressedKeys.clear();

    if (els.root) {
      els.root.classList.remove('hud-materialized');
    }
    if (els.mp3Hud) {
      els.mp3Hud.classList.remove('mp3-materialized', 'flicker-on', 'flicker-waiting');
      els.mp3Hud.setAttribute('data-flicker-state', 'dormant');
    }
    if (
      sandbox &&
      sandbox.mp3Player &&
      sandbox.mp3Player.playbackState === 'PLAYING' &&
      typeof sandbox.mp3Player.stop === 'function'
    ) {
      sandbox.mp3Player.stop();
    }
    if (els.desktopControls) {
      els.desktopControls.classList.remove(
        'desktop-controls-materialized',
        'flicker-on',
        'flicker-waiting'
      );
      els.desktopControls.setAttribute('data-flicker-state', 'dormant');
    }
    if (els.desktopIntroOverlay) {
      els.desktopIntroOverlay.classList.remove('intro-visible');
      els.desktopIntroOverlay.setAttribute('data-intro-phase', 'dormant');
    }
    if (els.desktopIntroCard) {
      els.desktopIntroCard.classList.remove(
        'flicker-on',
        'flicker-waiting',
        'is-resolving',
        'dissolve-out',
        'gate-nudge'
      );
      els.desktopIntroCard.setAttribute('data-flicker-state', 'dormant');
    }
    if (els.desktopIntroPrompt) {
      els.desktopIntroPrompt.textContent = 'CALIBRATE CONTROLS // PRESS EACH KEY';
      els.desktopIntroPrompt.setAttribute(
        'data-hud-canonical-text',
        'CALIBRATE CONTROLS // PRESS EACH KEY'
      );
      els.desktopIntroPrompt.setAttribute('aria-label', 'CALIBRATE CONTROLS // PRESS EACH KEY');
    }
    const introMap = getIntroKeyMap(els);
    for (const k of DESKTOP_REQUIRED_KEYS) {
      const btn = introMap[k];
      if (btn) {
        btn.classList.remove('is-verified', 'active-pill', 'just-verified');
        btn.setAttribute('aria-pressed', 'false');
      }
    }
    syncDesktopIntroDOM({ decodeCounter: false });
    syncDesktopControlsHighlights();

    if (els.touchControls) {
      els.touchControls.classList.remove('analog-materialized');
    }
    if (els.leftStick) {
      els.leftStick.classList.remove('flicker-on', 'flicker-waiting');
      els.leftStick.setAttribute('data-flicker-state', 'dormant');
    }
    if (els.rightStick) {
      els.rightStick.classList.remove('flicker-on', 'flicker-waiting');
      els.rightStick.setAttribute('data-flicker-state', 'dormant');
    }
    syncBodyIntroGatingClass();
  }

  function playBootChoreography({ force = false, deferKeyIntroForDoomChat = false } = {}) {
    const els = getElements();
    if (!els.root) return false;
    if (!force && isIntroSequenceHoldingHUD()) {
      return false;
    }

    bootChoreographyPlayed = true;
    els.root.classList.add('hud-materialized');
    if (typeof document !== 'undefined' && document.body) {
      document.body.classList.remove('intro-sequence-active');
    }

    // Spec 071 §5.1.2: 650ms <= T_decode <= 1100ms staggered post-dialogue Cipher Decode
    decodeController.decodeElement(els.brand, {
      text: 'LUIS // PLATODOOM',
      delayMs: 0,
      durationMs: 680,
      frameStep: 3,
    });
    decodeController.decodeElement(els.roles, {
      text: 'AI ENGINEERING | DATA ANALYTICS',
      delayMs: 110,
      durationMs: 780,
      frameStep: 3,
    });

    const navItems = [
      { el: els.navInteractBtn, text: 'WORKS', delay: 75 },
      { el: els.navMenuBtn, text: 'MENU', delay: 135 },
      { el: els.navChatBtn, text: 'CHAT', delay: 195 },
    ];
    for (const item of navItems) {
      if (item.el) {
        decodeController.decodeElement(item.el, {
          text: item.text,
          delayMs: item.delay,
          durationMs: 660,
          frameStep: 3,
        });
      }
    }

    triggerMp3FlickerOn({ delayMs: 150, reason: 'post-dialogue' });

    // Strict XOR Partition (Spec 072 §7): Mobile gets solely analog sticks; Desktop gets WASD+Q HUD & one-time Key Intro
    if (isMobileModeActive()) {
      triggerAnalogFlickerOn({ delayMs: 210, reason: 'post-dialogue' });
    } else {
      triggerDesktopControlsFlickerOn({
        delayMs: 165,
        decodeText: true,
        reason: 'post-dialogue',
      });
      if (desktopIntroPhase !== 'completed') {
        if (deferKeyIntroForDoomChat || isDoomChatCurrentlyActive()) {
          desktopIntroPhase = 'deferred-doom-chat';
          if (els.desktopIntroOverlay) {
            els.desktopIntroOverlay.classList.remove('intro-visible');
            els.desktopIntroOverlay.setAttribute('data-intro-phase', 'deferred-doom-chat');
          }
          syncBodyIntroGatingClass();
        } else {
          startDesktopKeyIntro({ delayMs: 95, reason: 'post-dialogue' });
        }
      }
    }

    // Start playing "SO INAGAWA - SELFLESS STATE" automatically on post-dialogue bootup
    if (sandbox && sandbox.mp3Player && typeof sandbox.mp3Player.play === 'function') {
      if (
        sandbox.mp3Player.currentTrackIndex !== 0 &&
        typeof sandbox.mp3Player.selectTrack === 'function'
      ) {
        sandbox.mp3Player.selectTrack(0, true);
      } else {
        sandbox.mp3Player.play();
      }
    }
    return true;
  }

  function triggerElementCipherDecode(el, explicitText = null) {
    if (!el) return null;
    const targetText =
      typeof explicitText === 'string' && explicitText.length > 0
        ? explicitText
        : el.getAttribute('data-hud-canonical-text') || el.textContent.trim();
    if (!targetText) return null;
    return decodeController.decodeElement(el, {
      text: targetText,
      delayMs: 0,
      durationMs: 360,
      speedMultiplier: 1.0,
      frameStep: 2,
    });
  }

  function shouldProcessActivation(btn, eventType) {
    const now = typeof performance !== 'undefined' ? performance.now() : Date.now();
    if (eventType === 'pointerdown') {
      buttonPointerDownTimestamps.set(btn, now);
      return true;
    }
    const lastDown = buttonPointerDownTimestamps.get(btn) || 0;
    if (now - lastDown < 450) {
      return false;
    }
    return true;
  }

  function bindDesktopKeyButton(btn, key) {
    if (!btn) return;
    btn.addEventListener('pointerenter', (e) => {
      if (e.pointerType === 'touch' || isMobileModeActive()) return;
      triggerElementCipherDecode(btn, key);
    });
    const onActivate = (e) => {
      if (!shouldProcessActivation(btn, e.type)) return;
      e.preventDefault();
      e.stopPropagation();
      if (!sandbox || !sandbox.ready || isMobileModeActive() || isIntroSequenceHoldingHUD()) {
        return;
      }
      if (sandbox.audio) sandbox.audio.unlock();

      if (key === 'Q') {
        if (sandbox.radialMenu) {
          sandbox.radialMenu.toggle();
        }
      } else if (typeof sandbox.triggerDirectionalStepImpulse === 'function') {
        sandbox.triggerDirectionalStepImpulse(key, { durationMs: 220 });
      }

      handleDesktopKeyActuation(key, { source: 'pointer', isDown: true });
      const curEls = getElements();
      const brBtn = getBrKeyMap(curEls)[key];
      if (brBtn && !decodeController.activeJobs.has(brBtn)) {
        triggerElementCipherDecode(brBtn, key);
      }
    };
    btn.addEventListener('pointerdown', onActivate);
    btn.addEventListener('click', onActivate);
  }

  function bindInteractions() {
    const els = getElements();
    if (!els.root || els.root.dataset.hudBound === 'true') return;
    els.root.dataset.hudBound = 'true';

    const interactiveNavBtns = [
      els.navInteractBtn,
      els.navMenuBtn,
      els.navChatBtn,
    ].filter(Boolean);

    // Spec 071 §5.2.1: Hover re-triggers localized Cipher Decode on ALL interactive HUD buttons (including active pills)
    for (const btn of interactiveNavBtns) {
      btn.addEventListener('pointerenter', (e) => {
        if (e.pointerType === 'touch') return;
        const currentLabel = btn.getAttribute('data-hud-canonical-text') || btn.textContent.trim();
        if (currentLabel) {
          triggerElementCipherDecode(btn, currentLabel);
        }
      });
    }

    // Top-Left Brand Identity Hover & Click Cipher Decode Re-Trigger (Spec 071 §5.2)
    if (els.topLeft) {
      const decodeBrandIdentity = () => {
        if (els.brand) {
          decodeController.decodeElement(els.brand, {
            text: 'LUIS // PLATODOOM',
            delayMs: 0,
            durationMs: 360,
            frameStep: 2,
          });
        }
        if (els.roles) {
          decodeController.decodeElement(els.roles, {
            text: 'AI ENGINEERING | DATA ANALYTICS',
            delayMs: 35,
            durationMs: 360,
            frameStep: 2,
          });
        }
      };
      els.topLeft.addEventListener('pointerenter', (e) => {
        if (e.pointerType === 'touch') return;
        decodeBrandIdentity();
      });
      els.topLeft.addEventListener('pointerdown', (e) => {
        e.stopPropagation();
        decodeBrandIdentity();
      });
    }

    // 1. WORKS (Full-Screen Works Hologram Showcase) Button — Gated while Forced Key Intro is active (Spec 072 §6.2.2)
    if (els.navInteractBtn) {
      const handleWorksActivate = (e) => {
        if (!shouldProcessActivation(els.navInteractBtn, e.type)) return;
        e.preventDefault();
        e.stopPropagation();
        if (!sandbox || !sandbox.ready) return;
        if (sandbox.audio) sandbox.audio.unlock();
        if (isDesktopKeyIntroGating()) {
          pulseDesktopIntroGateNudge();
          return;
        }
        if (typeof sandbox.toggleWorksShowcase === 'function') {
          sandbox.toggleWorksShowcase();
        } else if (sandbox.mode === 'mount-focus') {
          sandbox.exitMountFocusMode();
        } else {
          sandbox.focusWallMount('SCREEN_MOUNT_01');
        }
        triggerElementCipherDecode(els.navInteractBtn, 'WORKS');
      };
      els.navInteractBtn.addEventListener('pointerdown', handleWorksActivate);
      els.navInteractBtn.addEventListener('click', handleWorksActivate);
    }

    // 2. MENU (Cyber-Tactical Radial Menu) Button — Toggles menu & satisfies Q on desktop intro (Spec 072 §6.2.2)
    if (els.navMenuBtn) {
      const handleMenuActivate = (e) => {
        if (!shouldProcessActivation(els.navMenuBtn, e.type)) return;
        e.preventDefault();
        e.stopPropagation();
        if (!sandbox || !sandbox.ready) return;
        if (sandbox.audio) sandbox.audio.unlock();
        if (sandbox.radialMenu) {
          sandbox.radialMenu.toggle();
        }
        if (!isMobileModeActive()) {
          handleDesktopKeyActuation('Q', { source: 'pointer', isDown: true });
        }
        triggerElementCipherDecode(els.navMenuBtn, 'MENU');
      };
      els.navMenuBtn.addEventListener('pointerdown', handleMenuActivate);
      els.navMenuBtn.addEventListener('click', handleMenuActivate);
    }

    // 3. CHAT (DOOM_HEAD Terminal) Button — Gated while Forced Key Intro is active (Spec 072 §6.2.2)
    if (els.navChatBtn) {
      const handleChatActivate = (e) => {
        if (!shouldProcessActivation(els.navChatBtn, e.type)) return;
        e.preventDefault();
        e.stopPropagation();
        if (!sandbox || !sandbox.ready) return;
        if (sandbox.audio) sandbox.audio.unlock();
        if (isDesktopKeyIntroGating()) {
          pulseDesktopIntroGateNudge();
          return;
        }
        if (typeof sandbox.toggleDoomChat === 'function') {
          sandbox.toggleDoomChat();
        } else {
          const legacyChatBtn = document.getElementById('hud-open-doom-chat-btn');
          if (legacyChatBtn) legacyChatBtn.click();
        }
        triggerElementCipherDecode(els.navChatBtn, 'CHAT');
      };
      els.navChatBtn.addEventListener('pointerdown', handleChatActivate);
      els.navChatBtn.addEventListener('click', handleChatActivate);
    }

    // 4. Desktop Bottom-Right WASD + Q HUD & Forced Key Intro Keycaps (Spec 072 §5 & §6)
    const brMap = getBrKeyMap(els);
    const introMap = getIntroKeyMap(els);
    for (const k of DESKTOP_REQUIRED_KEYS) {
      bindDesktopKeyButton(brMap[k], k);
      bindDesktopKeyButton(introMap[k], k);
    }
    if (els.desktopControls) {
      els.desktopControls.addEventListener('pointerenter', (e) => {
        if (e.pointerType === 'touch' || isMobileModeActive()) return;
        if (els.brMoveLabel) triggerElementCipherDecode(els.brMoveLabel, 'MOVE');
        if (els.brMenuLabel) triggerElementCipherDecode(els.brMenuLabel, 'MENU');
      });
    }

    // Immediate Touch Override Safety on Mobile Analog Sticks (Spec 071 §6.2.3)
    if (els.leftStick) {
      els.leftStick.addEventListener(
        'pointerdown',
        () => {
          overrideAnalogFlickerOnTouch('left');
        },
        { passive: true }
      );
    }
    if (els.rightStick) {
      els.rightStick.addEventListener(
        'pointerdown',
        () => {
          overrideAnalogFlickerOnTouch('right');
        },
        { passive: true }
      );
    }
    if (els.mp3Hud) {
      els.mp3Hud.addEventListener(
        'pointerdown',
        () => {
          overrideMp3FlickerOnTouch();
        },
        { passive: true }
      );
    }
  }

  function update(dtSec) {
    const els = getElements();
    if (!els.root) return;

    const holdingForIntro = isIntroSequenceHoldingHUD();
    if (typeof document !== 'undefined' && document.body) {
      document.body.classList.toggle('intro-sequence-active', holdingForIntro);
    }

    if (holdingForIntro) {
      if (bootChoreographyPlayed || els.root.classList.contains('hud-materialized')) {
        resetToDormantPreDialogueState();
      }
      return;
    }

    // Automatically trigger post-dialogue Cipher Decode & Flicker-On the moment the intro dialogue concludes
    if (!bootChoreographyPlayed) {
      playBootChoreography({
        force: true,
        deferKeyIntroForDoomChat: isDoomChatCurrentlyActive(),
      });
    }

    // Card 07 "YES" (DOOM_HEAD Chat) deferral & immediate activation upon closing chat (Spec 072 §3.2)
    const chatOpenNow = isDoomChatCurrentlyActive();
    if (!isMobileModeActive()) {
      if (desktopIntroPhase === 'active' && chatOpenNow && verifiedKeys.size === 0) {
        clearDesktopIntroTimers();
        desktopIntroPhase = 'deferred-doom-chat';
        if (els.desktopIntroOverlay) {
          els.desktopIntroOverlay.classList.remove('intro-visible');
          els.desktopIntroOverlay.setAttribute('data-intro-phase', 'deferred-doom-chat');
        }
      } else if (desktopIntroPhase === 'deferred-doom-chat' && !chatOpenNow) {
        startDesktopKeyIntro({ delayMs: 30, reason: 'doom-chat-exit' });
      }
    }
    syncBodyIntroGatingClass();

    // Re-trigger Phosphor Flicker-On when returning from suppressed overlay (e.g. Works Showcase or DOOM Chat)
    const isSuppressedOverlay =
      typeof document !== 'undefined' &&
      document.body &&
      (document.body.classList.contains('mount-focus-mode') ||
        document.body.classList.contains('doom-chat-active') ||
        document.body.classList.contains('sticker-popup-active') ||
        document.body.classList.contains('mp3-takeover-active'));
    if (wasTouchControlsSuppressed && !isSuppressedOverlay && bootChoreographyPlayed) {
      triggerMp3FlickerOn({ delayMs: 30, reason: 'overlay-return' });
      if (isMobileModeActive()) {
        triggerAnalogFlickerOn({ delayMs: 40, reason: 'overlay-return' });
      } else {
        triggerDesktopControlsFlickerOn({
          delayMs: 35,
          decodeText: false,
          reason: 'overlay-return',
        });
      }
    }
    wasTouchControlsSuppressed = Boolean(isSuppressedOverlay);

    decodeController.step(dtSec);

    const dtMs = Math.max(0.5, Math.min(100.0, (Number(dtSec) || 1 / 60) * 1000.0));
    lastFrameTimeMs = dtMs;
    smoothedFrameMs = smoothedFrameMs * 0.88 + dtMs * 0.12;

    if (!isMobileModeActive()) {
      syncDesktopControlsHighlights();
    }

    if (els.navInteractBtn && !decodeController.activeJobs.has(els.navInteractBtn) && sandbox) {
      const isWorksOpen = sandbox.mode === 'mount-focus';
      if (els.navInteractBtn.textContent !== 'WORKS') {
        els.navInteractBtn.textContent = 'WORKS';
      }
      els.navInteractBtn.setAttribute('data-hud-canonical-text', 'WORKS');
      els.navInteractBtn.classList.toggle('active', isWorksOpen);
      els.navInteractBtn.classList.toggle('active-pill', isWorksOpen);
      els.navInteractBtn.classList.toggle(
        'highlight-mount',
        isWorksOpen || Boolean(sandbox.proximityMount)
      );
    }

    if (els.navMenuBtn && !decodeController.activeJobs.has(els.navMenuBtn) && sandbox) {
      const isRadialOpen = Boolean(
        sandbox.radialMenu &&
          typeof sandbox.radialMenu.isOpen === 'function' &&
          sandbox.radialMenu.isOpen()
      );
      els.navMenuBtn.classList.toggle('active', isRadialOpen);
      els.navMenuBtn.classList.toggle('active-pill', isRadialOpen);
    }

    if (els.navChatBtn && !decodeController.activeJobs.has(els.navChatBtn)) {
      const isChatOpen =
        typeof document !== 'undefined' &&
        document.body &&
        document.body.classList.contains('doom-chat-active');
      els.navChatBtn.classList.toggle('active', isChatOpen);
      els.navChatBtn.classList.toggle('active-pill', isChatOpen);
    }
  }

  function getDesktopNavState() {
    const els = getElements();
    return {
      isMobileMode: isMobileModeActive(),
      desktopControlsMaterialized: Boolean(
        els.desktopControls &&
          els.desktopControls.classList.contains('desktop-controls-materialized')
      ),
      desktopControlsFlickerState: els.desktopControls
        ? els.desktopControls.getAttribute('data-flicker-state')
        : null,
      desktopControlsFlickerPlayedCount,
      desktopIntroPhase,
      desktopIntroVisible: Boolean(
        els.desktopIntroOverlay && els.desktopIntroOverlay.classList.contains('intro-visible')
      ),
      desktopIntroFlickerState: els.desktopIntroCard
        ? els.desktopIntroCard.getAttribute('data-flicker-state')
        : null,
      desktopIntroFlickerPlayedCount,
      isGating: isDesktopKeyIntroGating(),
      verifiedKeys: Array.from(verifiedKeys),
      completedCount: verifiedKeys.size,
      requiredCount: DESKTOP_REQUIRED_KEYS.length,
      requiredKeys: [...DESKTOP_REQUIRED_KEYS],
      livePressedKeys: Array.from(livePressedKeys),
    };
  }

  return {
    decodeController,
    get bootChoreographyPlayed() {
      return bootChoreographyPlayed;
    },
    get analogFlickerPlayedCount() {
      return analogFlickerPlayedCount;
    },
    get mp3FlickerPlayedCount() {
      return mp3FlickerPlayedCount;
    },
    get desktopControlsFlickerPlayedCount() {
      return desktopControlsFlickerPlayedCount;
    },
    get desktopIntroFlickerPlayedCount() {
      return desktopIntroFlickerPlayedCount;
    },
    isIntroSequenceHoldingHUD,
    isDesktopKeyIntroGating,
    pulseDesktopIntroGateNudge,
    bindInteractions,
    playBootChoreography,
    resetToDormantPreDialogueState,
    triggerElementCipherDecode,
    triggerMp3FlickerOn,
    overrideMp3FlickerOnTouch,
    triggerAnalogFlickerOn,
    overrideAnalogFlickerOnTouch,
    triggerDesktopControlsFlickerOn,
    startDesktopKeyIntro,
    handleDesktopKeyActuation,
    clearLiveKeyHighlights,
    onDeviceModeChanged,
    getDesktopNavState,
    resolveAllImmediate: () => decodeController.resolveAllImmediate(),
    update,
    getState() {
      const els = getElements();
      return {
        bootChoreographyPlayed,
        holdingForIntro: isIntroSequenceHoldingHUD(),
        activeDecodeJobs: decodeController.activeJobs.size,
        completedDecodeCount: decodeController.completedBootCount,
        analogFlickerPlayedCount,
        mp3FlickerPlayedCount,
        desktopControlsFlickerPlayedCount,
        desktopIntroFlickerPlayedCount,
        lastAnalogFlickerReason,
        mp3FlickerState: els.mp3Hud ? els.mp3Hud.getAttribute('data-flicker-state') : null,
        desktopControlsFlickerState: els.desktopControls
          ? els.desktopControls.getAttribute('data-flicker-state')
          : null,
        desktopIntroPhase,
        desktopIntroFlickerState: els.desktopIntroCard
          ? els.desktopIntroCard.getAttribute('data-flicker-state')
          : null,
        isDesktopKeyIntroGating: isDesktopKeyIntroGating(),
        verifiedKeys: Array.from(verifiedKeys),
        completedKeyCount: verifiedKeys.size,
        leftStickFlickerState: els.leftStick ? els.leftStick.getAttribute('data-flicker-state') : null,
        rightStickFlickerState: els.rightStick ? els.rightStick.getAttribute('data-flicker-state') : null,
        lastFrameTimeMs: Number(smoothedFrameMs.toFixed(2)),
        brandText: els.brand ? els.brand.textContent : null,
        rolesText: els.roles ? els.roles.textContent : null,
        worksPillText: els.navInteractBtn ? els.navInteractBtn.textContent : null,
      };
    },
  };
}
