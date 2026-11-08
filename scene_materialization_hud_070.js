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
      navModeBtn: document.getElementById('portfolio-hud-mode-pill'),
      navInteractBtn: document.getElementById('mobile-action-interact-btn'),
      navMenuBtn: document.getElementById('mobile-action-mode-btn'),
      navChatBtn: document.getElementById('portfolio-hud-chat-btn'),
      topRight: document.getElementById('portfolio-hud-top-right'),
      telMetrics: document.getElementById('portfolio-hud-tel-metrics'),
      telScroll: document.getElementById('portfolio-hud-tel-scroll'),
      touchControls: document.getElementById('mobile-touch-controls'),
      leftStick: document.getElementById('mobile-left-thumbpad'),
      rightStick: document.getElementById('mobile-right-thumbpad'),
      leftStickLabel: document.getElementById('mobile-left-thumbpad-label'),
      rightStickLabel: document.getElementById('mobile-right-thumbpad-label'),
    };
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
    bootChoreographyPlayed = false;
    if (els.root) {
      els.root.classList.remove('hud-materialized');
    }
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
  }

  function playBootChoreography({ force = false } = {}) {
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
    decodeController.decodeElement(els.telMetrics, {
      text: 'Frame: 02.4 ms, 60 FPS',
      delayMs: 50,
      durationMs: 740,
      frameStep: 3,
    });
    decodeController.decodeElement(els.telScroll, {
      text: sandbox && sandbox.mode === 'mount-focus' ? 'WORK 01/07' : '000% ALLEY',
      delayMs: 130,
      durationMs: 680,
      frameStep: 3,
    });

    const navItems = [
      {
        el: els.navModeBtn,
        text: sandbox && sandbox.mode === 'freeroam' ? 'ROAM' : 'SCROLL',
        delay: 75,
      },
      { el: els.navInteractBtn, text: 'WORKS', delay: 125 },
      { el: els.navMenuBtn, text: 'MENU', delay: 175 },
      { el: els.navChatBtn, text: 'CHAT', delay: 225 },
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

    // Spec 071 §6.2.1: Stagger mobile analog stick Phosphor Flicker-On 180ms–260ms after HUD decode begins
    triggerAnalogFlickerOn({ delayMs: 210, reason: 'post-dialogue' });
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

  function bindInteractions() {
    const els = getElements();
    if (!els.root || els.root.dataset.hudBound === 'true') return;
    els.root.dataset.hudBound = 'true';

    const interactiveNavBtns = [
      els.navModeBtn,
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

    // 1. SCROLL / ROAM Mode Toggle Pill (Hover + Click/Tap Cipher Decode)
    if (els.navModeBtn) {
      const handleModeActivate = (e) => {
        if (!shouldProcessActivation(els.navModeBtn, e.type)) return;
        e.preventDefault();
        e.stopPropagation();
        if (!sandbox || !sandbox.ready) return;
        if (sandbox.audio) sandbox.audio.unlock();
        if (sandbox.mode === 'mount-focus') {
          sandbox.exitMountFocusMode();
          const resolvedLabel = sandbox.mode === 'freeroam' ? 'ROAM' : 'SCROLL';
          triggerElementCipherDecode(els.navModeBtn, resolvedLabel);
          return;
        }
        if (sandbox.mode === 'freeroam') {
          sandbox.returnToScrollMode();
        } else {
          if (sandbox.director) {
            if (sandbox.director.cameraPanState.mode === 'playing') {
              sandbox.director.stopStartupPan();
            }
            if (sandbox.director.introSequenceState.phase === 'dialogue-active') {
              sandbox.director.completeIntroDialogue({ openDoomChat: false });
            } else {
              sandbox.director.introSequenceState.scrollLocked = false;
              sandbox.director.introSequenceState.phase = 'scrolling-alley';
            }
          }
          if (typeof sandbox.enterFreeRoam === 'function') {
            sandbox.enterFreeRoam();
          }
        }
        const resolvedLabel = sandbox.mode === 'freeroam' ? 'ROAM' : 'SCROLL';
        triggerElementCipherDecode(els.navModeBtn, resolvedLabel);
      };
      els.navModeBtn.addEventListener('pointerdown', handleModeActivate);
      els.navModeBtn.addEventListener('click', handleModeActivate);
    }

    // 2. WORKS (Full-Screen Horizontal Works Hologram Showcase) Button
    if (els.navInteractBtn) {
      const handleWorksActivate = (e) => {
        if (!shouldProcessActivation(els.navInteractBtn, e.type)) return;
        e.preventDefault();
        e.stopPropagation();
        if (!sandbox || !sandbox.ready) return;
        if (sandbox.audio) sandbox.audio.unlock();
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

    // 3. MENU (Cyber-Tactical Radial Menu) Button
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
        triggerElementCipherDecode(els.navMenuBtn, 'MENU');
      };
      els.navMenuBtn.addEventListener('pointerdown', handleMenuActivate);
      els.navMenuBtn.addEventListener('click', handleMenuActivate);
    }

    // 4. CHAT (DOOM_HEAD Terminal) Button
    if (els.navChatBtn) {
      const handleChatActivate = (e) => {
        if (!shouldProcessActivation(els.navChatBtn, e.type)) return;
        e.preventDefault();
        e.stopPropagation();
        if (!sandbox || !sandbox.ready) return;
        if (sandbox.audio) sandbox.audio.unlock();
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

    // Automatically trigger post-dialogue Cipher Decode & Analog Flicker-On the moment the intro dialogue concludes
    if (!bootChoreographyPlayed) {
      playBootChoreography({ force: true });
    }

    // Re-trigger analog stick Phosphor Flicker-On when returning from suppressed overlay (e.g. Works Showcase or DOOM Chat)
    const isSuppressedOverlay =
      typeof document !== 'undefined' &&
      document.body &&
      (document.body.classList.contains('mount-focus-mode') ||
        document.body.classList.contains('doom-chat-active') ||
        document.body.classList.contains('sticker-popup-active') ||
        document.body.classList.contains('mp3-takeover-active'));
    if (wasTouchControlsSuppressed && !isSuppressedOverlay && bootChoreographyPlayed) {
      triggerAnalogFlickerOn({ delayMs: 40, reason: 'overlay-return' });
    }
    wasTouchControlsSuppressed = Boolean(isSuppressedOverlay);

    decodeController.step(dtSec);

    const dtMs = Math.max(0.5, Math.min(100.0, (Number(dtSec) || 1 / 60) * 1000.0));
    lastFrameTimeMs = dtMs;
    smoothedFrameMs = smoothedFrameMs * 0.88 + dtMs * 0.12;
    const fps = Math.max(1, Math.min(240, Math.round(1000.0 / Math.max(1.0, smoothedFrameMs))));

    // Update live telemetry only when not actively scrambling that element
    if (els.telMetrics && !decodeController.activeJobs.has(els.telMetrics)) {
      const msStr = smoothedFrameMs.toFixed(1).padStart(4, '0');
      const fpsStr = String(fps).padStart(2, '0');
      const nextTel = `Frame: ${msStr} ms, ${fpsStr} FPS`;
      if (els.telMetrics.textContent !== nextTel) {
        els.telMetrics.textContent = nextTel;
        els.telMetrics.setAttribute('data-hud-canonical-text', nextTel);
      }
    }

    if (els.telScroll && !decodeController.activeJobs.has(els.telScroll) && sandbox) {
      let nextScroll;
      if (sandbox.mode === 'mount-focus' && sandbox.focusedMount && sandbox.focusedMount.station) {
        const stCode = String(sandbox.focusedMount.station.code || '01').padStart(2, '0');
        const totalWorks = Array.isArray(sandbox.wallMounts) ? String(sandbox.wallMounts.length).padStart(2, '0') : '07';
        nextScroll = `WORK ${stCode}/${totalWorks}`;
      } else {
        const pct = String(Math.round((Number(sandbox.scrollProgress) || 0) * 100)).padStart(3, '0');
        const modeTag = sandbox.mode === 'freeroam' ? 'ROAM ' : 'ALLEY';
        nextScroll = `${pct}% ${modeTag}`;
      }
      if (els.telScroll.textContent !== nextScroll) {
        els.telScroll.textContent = nextScroll;
        els.telScroll.setAttribute('data-hud-canonical-text', nextScroll);
      }
    }

    if (els.navModeBtn && !decodeController.activeJobs.has(els.navModeBtn) && sandbox) {
      const isFreeRoam = sandbox.mode === 'freeroam';
      const isWorksOpen = sandbox.mode === 'mount-focus';
      const targetModeLabel = isFreeRoam ? 'ROAM' : 'SCROLL';
      if (els.navModeBtn.textContent !== targetModeLabel) {
        els.navModeBtn.textContent = targetModeLabel;
        els.navModeBtn.setAttribute('data-hud-canonical-text', targetModeLabel);
      }
      els.navModeBtn.classList.toggle('active-pill', !isWorksOpen);
      els.navModeBtn.classList.toggle('is-roam', isFreeRoam);
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

    if (els.navChatBtn && !decodeController.activeJobs.has(els.navChatBtn)) {
      const isChatOpen =
        typeof document !== 'undefined' &&
        document.body &&
        document.body.classList.contains('doom-chat-active');
      els.navChatBtn.classList.toggle('active', isChatOpen);
      els.navChatBtn.classList.toggle('active-pill', isChatOpen);
    }
  }

  return {
    decodeController,
    get bootChoreographyPlayed() {
      return bootChoreographyPlayed;
    },
    get analogFlickerPlayedCount() {
      return analogFlickerPlayedCount;
    },
    isIntroSequenceHoldingHUD,
    bindInteractions,
    playBootChoreography,
    resetToDormantPreDialogueState,
    triggerElementCipherDecode,
    triggerAnalogFlickerOn,
    overrideAnalogFlickerOnTouch,
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
        lastAnalogFlickerReason,
        leftStickFlickerState: els.leftStick ? els.leftStick.getAttribute('data-flicker-state') : null,
        rightStickFlickerState: els.rightStick ? els.rightStick.getAttribute('data-flicker-state') : null,
        lastFrameTimeMs: Number(smoothedFrameMs.toFixed(2)),
        brandText: els.brand ? els.brand.textContent : null,
        rolesText: els.roles ? els.roles.textContent : null,
        metricsText: els.telMetrics ? els.telMetrics.textContent : null,
        modePillText: els.navModeBtn ? els.navModeBtn.textContent : null,
        worksPillText: els.navInteractBtn ? els.navInteractBtn.textContent : null,
      };
    },
  };
}
