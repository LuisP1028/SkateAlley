/**
 * watercolor_shader.js
 *
 * "Water Color" Dynamic Shader & Interactive Viewport Implementation.
 * Governed by shader.md (§1–§5) and tickets ticket-001.md through ticket-005.md.
 */

import * as THREE from 'three';

// ============================================================================
// 1. Authoritative Pigment Palette & Baseline Constants (shader.md §1.1, §2.2, §4)
// ============================================================================

export const WATERCOLOR_PALETTE = {
  deepMaroonStr: '#5a0000',
  deepMaroonHex: 0x5a0000,
  deepMaroonRgb: [90 / 255, 0 / 255, 0 / 255],
  deepMaroonColor: new THREE.Color(0x5a0000),

  crimsonStr: '#c50000',
  crimsonHex: 0xc50000,
  crimsonRgb: [197 / 255, 0 / 255, 0 / 255],
  crimsonColor: new THREE.Color(0xc50000),

  vermilionStr: '#e82400',
  vermilionHex: 0xe82400,
  vermilionRgb: [232 / 255, 36 / 255, 0 / 255],
  vermilionColor: new THREE.Color(0xe82400),

  amberTransitionStr: '#8f3000',
  amberTransitionHex: 0x8f3000,
  amberTransitionRgb: [143 / 255, 48 / 255, 0 / 255],
  amberTransitionColor: new THREE.Color(0x8f3000),

  forestGreenTroughStr: '#053300',
  forestGreenTroughHex: 0x053300,
  forestGreenTroughRgb: [5 / 255, 51 / 255, 0 / 255],
  forestGreenTroughColor: new THREE.Color(0x053300),

  shadowTroughStr: '#041400',
  shadowTroughHex: 0x041400,
  shadowTroughRgb: [4 / 255, 20 / 255, 0 / 255],
  shadowTroughColor: new THREE.Color(0x041400),

  neonMagentaStr: '#fb12a4',
  neonMagentaHex: 0xfb12a4,
  neonMagentaRgb: [251 / 255, 18 / 255, 164 / 255],
  neonMagentaColor: new THREE.Color(0xfb12a4),

  neonVioletStr: '#f33eff',
  neonVioletHex: 0xf33eff,
  neonVioletRgb: [243 / 255, 62 / 255, 255 / 255],
  neonVioletColor: new THREE.Color(0xf33eff),

  vibrantVioletStr: '#9d1cff',
  vibrantVioletHex: 0x9d1cff,
  vibrantVioletRgb: [157 / 255, 28 / 255, 255 / 255],
  vibrantVioletColor: new THREE.Color(0x9d1cff),

  electricCobaltStr: '#003cff',
  electricCobaltHex: 0x003cff,
  electricCobaltRgb: [0 / 255, 60 / 255, 255 / 255],
  electricCobaltColor: new THREE.Color(0x003cff),
};

export const WATERCOLOR_DEFAULT_PARAMS = {
  division: 6,
  minDivision: 1,
  maxDivision: 12,
  stepDivision: 1,
  scale: 6,
  minScale: 1,
  maxScale: 12,
  stepScale: 1,
  aspectRatio: 506 / 958, // 0.5281837 (matches assets/watercolor_reference_1.png)
  canvasWidth: 1.68,      // meters in 3D gallery space
  canvasHeight: 3.18,     // meters in 3D gallery space (1.68 / 3.18 = 0.5283)
};

export const WATERCOLOR_GALLERY_SPEC = {
  id: 'watercolor-gallery-01',
  title: 'Water Color',
  anchorPosition: { x: 0.0, yRel: 1.72, z: 3.85 },
  canvasRotationEuler: { x: 0.0, y: -0.28, z: 0.0 }, // -16.04 deg yaw so canvas is viewed at a slight perspective angle
  focusCameraOffset: { x: -0.42, y: 0.04, z: -2.65 }, // perspective camera vantage looking toward anchorPosition
  focusLookAtOffset: { x: 0.08, y: 0.0, z: 0.0 },
  blackBackdropColorHex: 0x000000,
  wireframeWallColorHex: 0x94a3b8,
  wireframeFrameColorHex: 0xe2e8f0,
  activeBorderColorHex: 0xffffff,
};

/**
 * Pure helper returning percentage [0, 100] for slider fill bar and badge positioning.
 */
export function computeSliderFillPercent(value, min = 1, max = 12) {
  const num = Number(value);
  const clamped = Math.max(min, Math.min(max, Number.isFinite(num) ? num : min));
  return ((clamped - min) / (max - min)) * 100.0;
}

function smoothstep(edge0, edge1, x) {
  const t = Math.max(0.0, Math.min(1.0, (x - edge0) / (edge1 - edge0)));
  return t * t * (3.0 - 2.0 * t);
}

function mixChannels(a, b, t) {
  return a.map((val, i) => val * (1.0 - t) + b[i] * t);
}

// ============================================================================
// 2. Deterministic Domain-Warping & Chromatic Evaluators (Ticket 001 & 002)
// ============================================================================

/**
 * Pure deterministic CPU evaluator for domain warping, diagonal banding,
 * perpendicular serrated wave interference, harmonic DIVISION layering, and SCALE spatial zoom.
 */
export function evaluateWaterColorField(u, v, timeSec = 0.0, division = 6.0, scale = 6.0) {
  const effDivision = Math.max(1.0, Math.min(16.0, Number(division) || 6.0));
  const effScale = Math.max(0.5, Math.min(24.0, Number(scale) || 6.0));
  const uTime = Number(timeSec) || 0.0;

  const zoom = effScale / 6.0;
  const centeredX = (u - 0.5) * zoom;
  const centeredY = (v - 0.5) * zoom;
  const px = centeredX + 0.5;
  const py = centeredY + 0.5;

  let qx = px;
  let qy = py;
  let serrAccum = 0.0;
  let lobeInterference = 0.0;

  for (let k = 1; k <= 12; k++) {
    const fk = k;
    const wk = Math.max(0.0, Math.min(1.0, effDivision - (fk - 1.0)));
    const freq = (1.15 + 0.62 * fk) * (0.75 + 0.25 * zoom);
    const phaseX = uTime * (0.32 + 0.07 * fk) + fk * 1.37;
    const phaseY = uTime * (0.27 + 0.06 * fk) + fk * 0.93;

    // Compounding sinusoidal domain warp
    const dx = Math.sin(qy * freq + qx * (0.55 * fk) + phaseX) / (0.85 + 0.55 * fk);
    const dy = Math.cos(qx * freq - qy * (0.48 * fk) - phaseY) / (0.85 + 0.55 * fk);
    qx += wk * 0.14 * dx;
    qy += wk * 0.14 * dy;

    // Secondary perpendicular serrated wave interference
    const perpArg = (qx * 0.65 - qy * 0.76) * (1.8 * fk) + Math.sin(qy * 2.4 * fk - phaseX) * 0.85 + phaseY;
    serrAccum += wk * (Math.sin(perpArg) / (0.70 + 0.45 * fk));

    // Harmonic lobe modulation
    lobeInterference += wk * (Math.cos(qx * (1.4 * fk) + qy * (0.9 * fk) - phaseX * 0.8) / fk);
  }

  // Diagonal Banding Structure
  const diagBase = (qx * 0.86 + (1.0 - qy) * 0.36) * (0.85 + 0.15 * zoom);
  const perpWave = serrAccum * (0.08 + 0.018 * effDivision);
  const bandCoord = diagBase + perpWave + 0.16 * Math.sin(uTime * 0.42 + qy * 1.8);

  // Harmonic contour sub-banding
  const harmonicFreq = (2.2 + 1.35 * effDivision) * (0.8 + 0.2 * zoom);
  const harmonicRipple = Math.sin(bandCoord * harmonicFreq - uTime * 0.65 + serrAccum * 0.55);
  const softSubdivision = 0.055 * (effDivision / 6.0) * smoothstep(-0.85, 0.85, harmonicRipple);

  // Upward wave lobe
  const lobeCenterU = 0.64 + 0.16 * Math.sin(uTime * 0.38);
  const lobeCrestHeight = 0.42 + 0.22 * Math.sin(uTime * 0.46 - 0.35)
    + (0.06 + 0.015 * effDivision) * Math.cos((qx - lobeCenterU) * (3.2 + 0.45 * effDivision) + uTime * 0.52)
    + 0.045 * serrAccum;
  const lobeDistX = (qx - lobeCenterU) / (0.24 + 0.10 * Math.sin(uTime * 0.35));
  const lobeProfile = lobeCrestHeight - 0.48 * lobeDistX * lobeDistX;
  const lobeMask = smoothstep((1.0 - py) - 0.22, (1.0 - py) + 0.18, lobeProfile + (1.0 - py) - 0.42);

  // Upper-right dark forest-green & shadow contrast trough
  const troughCenterU = 0.84 - 0.18 * Math.sin(uTime * 0.40);
  const troughCenterV = 0.86 + 0.06 * Math.cos(uTime * 0.34);
  const troughDeltaX = (qx - troughCenterU) / 0.28;
  const troughDeltaY = (qy - troughCenterV) / 0.36;
  const troughWave = Math.hypot(troughDeltaX, troughDeltaY) - 0.12 * serrAccum;
  const troughMask = 1.0 - smoothstep(0.18, 0.92, troughWave);

  return {
    qx,
    qy,
    diagBase,
    perpWave,
    bandCoord,
    harmonicRipple,
    softSubdivision,
    serrAccum,
    lobeInterference,
    lobeMask,
    troughMask,
    zoom,
    effDivision,
    effScale,
  };
}

/**
 * Pure deterministic CPU chromatic evaluator returning { r, g, b, hex, field }
 * matching the GLSL fragment shader exactly.
 */
export function evaluateWaterColorPixel(u, v, timeSec = 0.0, division = 6.0, scale = 6.0) {
  const field = evaluateWaterColorField(u, v, timeSec, division, scale);
  const uTime = Number(timeSec) || 0.0;

  // Base diagonal warm gradient
  const diagT = Math.max(0.0, Math.min(1.35, field.bandCoord + field.softSubdivision));
  const t0 = smoothstep(0.05, 0.35, diagT);
  const t1 = smoothstep(0.32, 0.65, diagT);
  const t2 = smoothstep(0.60, 1.05, diagT);

  let col = mixChannels(WATERCOLOR_PALETTE.deepMaroonRgb, WATERCOLOR_PALETTE.crimsonRgb, t0);
  col = mixChannels(col, WATERCOLOR_PALETTE.vermilionRgb, t1);
  col = mixChannels(col, WATERCOLOR_PALETTE.amberTransitionRgb, t2 * 0.7);

  // Temporal pigment cycling across neon magenta, neon violet, vibrant violet, and electric cobalt
  const bluePhase = Math.pow(Math.max(0.0, Math.sin((uTime - 3.8) * 0.48)), 2.0);
  const violetPhase = Math.pow(Math.max(0.0, Math.sin((uTime - 4.8) * 0.50)), 2.0);
  const phase2Factor = smoothstep(1.2, 2.6, uTime) * (1.0 - smoothstep(3.2, 4.4, uTime));

  let lobeCol = mixChannels(WATERCOLOR_PALETTE.neonMagentaRgb, WATERCOLOR_PALETTE.neonVioletRgb, phase2Factor);
  lobeCol = mixChannels(lobeCol, WATERCOLOR_PALETTE.vibrantVioletRgb, violetPhase);
  lobeCol = mixChannels(lobeCol, WATERCOLOR_PALETTE.electricCobaltRgb, bluePhase);

  // Modulate diagonal bands during blue / violet phases
  const bandWaveMod = smoothstep(0.2, 0.8, Math.sin(field.bandCoord * Math.PI + uTime * 0.3));
  col = mixChannels(col, WATERCOLOR_PALETTE.vibrantVioletRgb, violetPhase * bandWaveMod * 0.85);
  col = mixChannels(col, WATERCOLOR_PALETTE.electricCobaltRgb, bluePhase * (1.0 - bandWaveMod * 0.4) * 0.9);

  // Soft diffused blend with upward wave lobe
  col = mixChannels(col, lobeCol, field.lobeMask);

  // Dark contrast trough blend (deep forest green -> shadow trough)
  const troughCol = mixChannels(
    WATERCOLOR_PALETTE.forestGreenTroughRgb,
    WATERCOLOR_PALETTE.shadowTroughRgb,
    smoothstep(0.4, 0.85, field.troughMask)
  );
  col = mixChannels(col, troughCol, field.troughMask * 0.96);

  const rClamped = Math.max(0.0, Math.min(1.0, col[0]));
  const gClamped = Math.max(0.0, Math.min(1.0, col[1]));
  const bClamped = Math.max(0.0, Math.min(1.0, col[2]));

  const rByte = Math.round(rClamped * 255);
  const gByte = Math.round(gClamped * 255);
  const bByte = Math.round(bClamped * 255);
  const hex = '#' + [rByte, gByte, bByte].map((x) => x.toString(16).padStart(2, '0')).join('');

  return {
    r: rClamped,
    g: gClamped,
    b: bClamped,
    hex,
    field,
  };
}

// ============================================================================
// 3. Unlit Self-Illuminated THREE.ShaderMaterial Factory (Ticket 002)
// ============================================================================

const WATERCOLOR_VERTEX_SHADER = `
varying vec2 vUv;
varying vec3 vLocalPos;

void main() {
  vUv = uv;
  vLocalPos = position;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const WATERCOLOR_FRAGMENT_SHADER = `
precision highp float;

uniform float uTime;
uniform float uDivision;
uniform float uScale;
uniform float uAspect;

uniform vec3 uDeepMaroon;
uniform vec3 uCrimson;
uniform vec3 uVermilion;
uniform vec3 uAmberTransition;
uniform vec3 uForestGreenTrough;
uniform vec3 uShadowTrough;
uniform vec3 uNeonMagenta;
uniform vec3 uNeonViolet;
uniform vec3 uVibrantViolet;
uniform vec3 uElectricCobalt;

varying vec2 vUv;
varying vec3 vLocalPos;

void main() {
  float effDivision = clamp(uDivision, 1.0, 16.0);
  float effScale = clamp(uScale, 0.5, 24.0);
  float zoom = effScale / 6.0;

  vec2 centered = (vUv - vec2(0.5, 0.5)) * zoom;
  vec2 p = centered + vec2(0.5, 0.5);

  vec2 q = p;
  float serrAccum = 0.0;
  float lobeInterference = 0.0;

  for (int k = 1; k <= 12; k++) {
    float fk = float(k);
    float wk = clamp(effDivision - (fk - 1.0), 0.0, 1.0);
    float freq = (1.15 + 0.62 * fk) * (0.75 + 0.25 * zoom);
    float phaseX = uTime * (0.32 + 0.07 * fk) + fk * 1.37;
    float phaseY = uTime * (0.27 + 0.06 * fk) + fk * 0.93;

    // Compounding sinusoidal domain warp
    float dx = sin(q.y * freq + q.x * (0.55 * fk) + phaseX) / (0.85 + 0.55 * fk);
    float dy = cos(q.x * freq - q.y * (0.48 * fk) - phaseY) / (0.85 + 0.55 * fk);
    q.x += wk * 0.14 * dx;
    q.y += wk * 0.14 * dy;

    // Secondary perpendicular serrated wave interference
    float perpArg = (q.x * 0.65 - q.y * 0.76) * (1.8 * fk) + sin(q.y * 2.4 * fk - phaseX) * 0.85 + phaseY;
    serrAccum += wk * (sin(perpArg) / (0.70 + 0.45 * fk));

    // Harmonic lobe modulation
    lobeInterference += wk * (cos(q.x * (1.4 * fk) + q.y * (0.9 * fk) - phaseX * 0.8) / fk);
  }

  // Diagonal Banding Structure
  float diagBase = (q.x * 0.86 + (1.0 - q.y) * 0.36) * (0.85 + 0.15 * zoom);
  float perpWave = serrAccum * (0.08 + 0.018 * effDivision);
  float bandCoord = diagBase + perpWave + 0.16 * sin(uTime * 0.42 + q.y * 1.8);

  // Harmonic contour sub-banding
  float harmonicFreq = (2.2 + 1.35 * effDivision) * (0.8 + 0.2 * zoom);
  float harmonicRipple = sin(bandCoord * harmonicFreq - uTime * 0.65 + serrAccum * 0.55);
  float softSubdivision = 0.055 * (effDivision / 6.0) * smoothstep(-0.85, 0.85, harmonicRipple);

  // Upward wave lobe
  float lobeCenterU = 0.64 + 0.16 * sin(uTime * 0.38);
  float lobeCrestHeight = 0.42 + 0.22 * sin(uTime * 0.46 - 0.35)
                        + (0.06 + 0.015 * effDivision) * cos((q.x - lobeCenterU) * (3.2 + 0.45 * effDivision) + uTime * 0.52)
                        + 0.045 * serrAccum;
  float lobeDistX = (q.x - lobeCenterU) / (0.24 + 0.10 * sin(uTime * 0.35));
  float lobeProfile = lobeCrestHeight - 0.48 * lobeDistX * lobeDistX;
  float lobeMask = smoothstep((1.0 - p.y) - 0.22, (1.0 - p.y) + 0.18, lobeProfile + (1.0 - p.y) - 0.42);

  // Upper-right dark forest-green & shadow contrast trough
  float troughCenterU = 0.84 - 0.18 * sin(uTime * 0.40);
  float troughCenterV = 0.86 + 0.06 * cos(uTime * 0.34);
  vec2 troughDelta = vec2((q.x - troughCenterU) / 0.28, (q.y - troughCenterV) / 0.36);
  float troughWave = length(troughDelta) - 0.12 * serrAccum;
  float troughMask = 1.0 - smoothstep(0.18, 0.92, troughWave);

  // Base diagonal warm gradient
  float diagT = clamp(bandCoord + softSubdivision, 0.0, 1.35);
  float t0 = smoothstep(0.05, 0.35, diagT);
  float t1 = smoothstep(0.32, 0.65, diagT);
  float t2 = smoothstep(0.60, 1.05, diagT);

  vec3 col = mix(uDeepMaroon, uCrimson, t0);
  col = mix(col, uVermilion, t1);
  col = mix(col, uAmberTransition, t2 * 0.7);

  // Temporal pigment cycling
  float bluePhase = pow(max(0.0, sin((uTime - 3.8) * 0.48)), 2.0);
  float violetPhase = pow(max(0.0, sin((uTime - 4.8) * 0.50)), 2.0);
  float phase2Factor = smoothstep(1.2, 2.6, uTime) * (1.0 - smoothstep(3.2, 4.4, uTime));

  vec3 lobeCol = mix(uNeonMagenta, uNeonViolet, phase2Factor);
  lobeCol = mix(lobeCol, uVibrantViolet, violetPhase);
  lobeCol = mix(lobeCol, uElectricCobalt, bluePhase);

  // Modulate diagonal bands
  float bandWaveMod = smoothstep(0.2, 0.8, sin(bandCoord * 3.14159265 + uTime * 0.3));
  col = mix(col, uVibrantViolet, violetPhase * bandWaveMod * 0.85);
  col = mix(col, uElectricCobalt, bluePhase * (1.0 - bandWaveMod * 0.4) * 0.9);

  // Blend lobe
  col = mix(col, lobeCol, lobeMask);

  // Blend trough
  vec3 troughCol = mix(uForestGreenTrough, uShadowTrough, smoothstep(0.4, 0.85, troughMask));
  col = mix(col, troughCol, troughMask * 0.96);

  gl_FragColor = vec4(col, 1.0);
}
`;

export function createWaterColorShaderMaterial(options = {}) {
  const division = options.division ?? WATERCOLOR_DEFAULT_PARAMS.division;
  const scale = options.scale ?? WATERCOLOR_DEFAULT_PARAMS.scale;
  const uTimeUniform = options.uTimeUniform ?? { value: 0.0 };

  const uniforms = {
    uTime: uTimeUniform,
    uDivision: { value: Number(division) },
    uScale: { value: Number(scale) },
    uAspect: { value: WATERCOLOR_DEFAULT_PARAMS.aspectRatio },
    uDeepMaroon: { value: WATERCOLOR_PALETTE.deepMaroonColor.clone() },
    uCrimson: { value: WATERCOLOR_PALETTE.crimsonColor.clone() },
    uVermilion: { value: WATERCOLOR_PALETTE.vermilionColor.clone() },
    uAmberTransition: { value: WATERCOLOR_PALETTE.amberTransitionColor.clone() },
    uForestGreenTrough: { value: WATERCOLOR_PALETTE.forestGreenTroughColor.clone() },
    uShadowTrough: { value: WATERCOLOR_PALETTE.shadowTroughColor.clone() },
    uNeonMagenta: { value: WATERCOLOR_PALETTE.neonMagentaColor.clone() },
    uNeonViolet: { value: WATERCOLOR_PALETTE.neonVioletColor.clone() },
    uVibrantViolet: { value: WATERCOLOR_PALETTE.vibrantVioletColor.clone() },
    uElectricCobalt: { value: WATERCOLOR_PALETTE.electricCobaltColor.clone() },
  };

  const material = new THREE.ShaderMaterial({
    vertexShader: WATERCOLOR_VERTEX_SHADER,
    fragmentShader: WATERCOLOR_FRAGMENT_SHADER,
    uniforms,
    transparent: false,
    depthTest: true,
    depthWrite: true,
    side: THREE.DoubleSide,
    fog: false,        // Unaffected by external scene fog (shader.md §5.1)
    toneMapped: false, // Unlit self-illumination maintaining chromatic vibrancy
    lights: false,
  });

  return material;
}

// ============================================================================
// 4. 3D Gallery Viewport & Minimalist Wireframe Environment Builder (Ticket 003)
// ============================================================================

export function buildWaterColorGallerySystem(options = {}) {
  const rootGroup = options.rootGroup || new THREE.Group();
  rootGroup.name = 'WaterColorGalleryRootGroup';
  rootGroup.renderOrder = 14;

  const floorY = typeof options.floorY === 'number' ? options.floorY : 0.0;
  const uTimeUniform = options.uTimeUniform || { value: 0.0 };

  let divisionVal = WATERCOLOR_DEFAULT_PARAMS.division;
  let scaleVal = WATERCOLOR_DEFAULT_PARAMS.scale;
  let isFocused = false;

  // 1. Primary Perspective Canvas Stage Group
  const canvasStageGroup = new THREE.Group();
  canvasStageGroup.name = 'WaterColorCanvasStageGroup';
  canvasStageGroup.position.set(
    WATERCOLOR_GALLERY_SPEC.anchorPosition.x,
    floorY + WATERCOLOR_GALLERY_SPEC.anchorPosition.yRel,
    WATERCOLOR_GALLERY_SPEC.anchorPosition.z
  );
  canvasStageGroup.rotation.set(
    WATERCOLOR_GALLERY_SPEC.canvasRotationEuler.x,
    WATERCOLOR_GALLERY_SPEC.canvasRotationEuler.y, // -0.28 rad (-16.04°)
    WATERCOLOR_GALLERY_SPEC.canvasRotationEuler.z
  );
  rootGroup.add(canvasStageGroup);

  // 2. Unlit Self-Illuminated Canvas Mesh
  const canvasGeo = new THREE.PlaneGeometry(
    WATERCOLOR_DEFAULT_PARAMS.canvasWidth,
    WATERCOLOR_DEFAULT_PARAMS.canvasHeight,
    1,
    1
  );
  const canvasMat = createWaterColorShaderMaterial({
    division: divisionVal,
    scale: scaleVal,
    uTimeUniform,
  });
  const canvasMesh = new THREE.Mesh(canvasGeo, canvasMat);
  canvasMesh.name = 'WaterColorCanvasMesh';
  canvasMesh.userData.isWaterColorCanvas = true;
  canvasMesh.userData.artworkId = WATERCOLOR_GALLERY_SPEC.id;
  canvasMesh.userData.title = WATERCOLOR_GALLERY_SPEC.title;
  canvasStageGroup.add(canvasMesh);

  // 3. Crisp White Frame Lines
  const frameGeo = new THREE.EdgesGeometry(
    new THREE.BoxGeometry(
      WATERCOLOR_DEFAULT_PARAMS.canvasWidth + 0.04,
      WATERCOLOR_DEFAULT_PARAMS.canvasHeight + 0.04,
      0.02
    )
  );
  const frameMat = new THREE.LineBasicMaterial({
    color: WATERCOLOR_GALLERY_SPEC.activeBorderColorHex,
    transparent: true,
    opacity: 0.88,
    fog: false,
    toneMapped: false,
  });
  const frameLines = new THREE.LineSegments(frameGeo, frameMat);
  frameLines.name = 'WaterColorCanvasFrameLines';
  canvasStageGroup.add(frameLines);

  // 4. Minimalist Wireframe Environment Group
  const wireframeEnvGroup = new THREE.Group();
  wireframeEnvGroup.name = 'WaterColorWireframeEnvGroup';
  wireframeEnvGroup.visible = Boolean(options.initialFocused);
  rootGroup.add(wireframeEnvGroup);

  // Pitch-black gallery enclosure
  const backdropGeo = new THREE.BoxGeometry(14.0, 8.5, 16.0);
  const backdropMat = new THREE.MeshBasicMaterial({
    color: WATERCOLOR_GALLERY_SPEC.blackBackdropColorHex,
    side: THREE.BackSide,
    fog: false,
    toneMapped: false,
    depthWrite: true,
  });
  const blackBackdropMesh = new THREE.Mesh(backdropGeo, backdropMat);
  blackBackdropMesh.name = 'WaterColorBlackBackdropMesh';
  blackBackdropMesh.position.set(0.0, floorY + 2.5, 3.85);
  blackBackdropMesh.visible = false;
  wireframeEnvGroup.add(blackBackdropMesh);

  // Architectural Wireframe Wall Planes
  const archLineMat = new THREE.LineBasicMaterial({
    color: WATERCOLOR_GALLERY_SPEC.wireframeWallColorHex,
    transparent: true,
    opacity: 0.28,
    fog: false,
    toneMapped: false,
  });

  function createWireframePlane(width, height, segW, segH) {
    const pts = [];
    const hw = width / 2;
    const hh = height / 2;
    for (let i = 0; i <= segW; i++) {
      const x = -hw + (i / segW) * width;
      pts.push(new THREE.Vector3(x, -hh, 0), new THREE.Vector3(x, hh, 0));
    }
    for (let j = 0; j <= segH; j++) {
      const y = -hh + (j / segH) * height;
      pts.push(new THREE.Vector3(-hw, y, 0), new THREE.Vector3(hw, y, 0));
    }
    const geom = new THREE.BufferGeometry().setFromPoints(pts);
    return new THREE.LineSegments(geom, archLineMat);
  }

  // Back Wall Wireframe
  const archWallBack = createWireframePlane(10.0, 6.0, 10, 6);
  archWallBack.name = 'ArchWall_Back';
  archWallBack.position.set(0.0, floorY + 3.0, 6.5);
  wireframeEnvGroup.add(archWallBack);

  // Left Wall Wireframe
  const archWallLeft = createWireframePlane(12.0, 6.0, 12, 6);
  archWallLeft.name = 'ArchWall_Left';
  archWallLeft.position.set(-4.5, floorY + 3.0, 2.0);
  archWallLeft.rotation.y = Math.PI / 2;
  wireframeEnvGroup.add(archWallLeft);

  // Right Wall Wireframe
  const archWallRight = createWireframePlane(12.0, 6.0, 12, 6);
  archWallRight.name = 'ArchWall_Right';
  archWallRight.position.set(4.5, floorY + 3.0, 2.0);
  archWallRight.rotation.y = -Math.PI / 2;
  wireframeEnvGroup.add(archWallRight);

  // Floor Grid Wireframe
  const archFloorGrid = createWireframePlane(10.0, 12.0, 10, 12);
  archFloorGrid.name = 'ArchFloor_Grid';
  archFloorGrid.position.set(0.0, floorY + 0.01, 2.0);
  archFloorGrid.rotation.x = Math.PI / 2;
  wireframeEnvGroup.add(archFloorGrid);

  // Neighboring Background Frames
  const neighborLineMat = new THREE.LineBasicMaterial({
    color: WATERCOLOR_GALLERY_SPEC.wireframeFrameColorHex,
    transparent: true,
    opacity: 0.34,
    fog: false,
    toneMapped: false,
  });

  const neighborSpecs = [
    { name: 'NeighborFrame_01', pos: [-2.35, floorY + 1.72, 4.2], rotY: 0.12, w: 1.4, h: 2.2 },
    { name: 'NeighborFrame_02', pos: [2.25, floorY + 1.72, 4.2], rotY: -0.15, w: 1.4, h: 2.2 },
    { name: 'NeighborFrame_03', pos: [-1.45, floorY + 1.72, 1.8], rotY: 0.25, w: 1.2, h: 1.8 },
    { name: 'NeighborFrame_04', pos: [1.65, floorY + 1.72, 1.8], rotY: -0.22, w: 1.2, h: 1.8 },
  ];

  neighborSpecs.forEach((spec) => {
    const geo = new THREE.EdgesGeometry(new THREE.PlaneGeometry(spec.w, spec.h));
    const lines = new THREE.LineSegments(geo, neighborLineMat);
    lines.name = spec.name;
    lines.position.set(spec.pos[0], spec.pos[1], spec.pos[2]);
    lines.rotation.y = spec.rotY;
    wireframeEnvGroup.add(lines);
  });

  const system = {
    rootGroup,
    canvasStageGroup,
    canvasMesh,
    frameLines,
    wireframeEnvGroup,
    blackBackdropMesh,
    raycastTargets: [canvasMesh],

    get division() {
      return divisionVal;
    },
    get scale() {
      return scaleVal;
    },
    get isFocused() {
      return isFocused;
    },

    setDivision(val) {
      const num = Number(val);
      const clamped = Math.max(
        WATERCOLOR_DEFAULT_PARAMS.minDivision,
        Math.min(WATERCOLOR_DEFAULT_PARAMS.maxDivision, Number.isFinite(num) ? num : WATERCOLOR_DEFAULT_PARAMS.division)
      );
      divisionVal = clamped;
      canvasMat.uniforms.uDivision.value = clamped;
      return clamped;
    },

    setScale(val) {
      const num = Number(val);
      const clamped = Math.max(
        WATERCOLOR_DEFAULT_PARAMS.minScale,
        Math.min(WATERCOLOR_DEFAULT_PARAMS.maxScale, Number.isFinite(num) ? num : WATERCOLOR_DEFAULT_PARAMS.scale)
      );
      scaleVal = clamped;
      canvasMat.uniforms.uScale.value = clamped;
      return clamped;
    },

    setFocused(focused) {
      isFocused = Boolean(focused);
      blackBackdropMesh.visible = isFocused;
      wireframeEnvGroup.visible = isFocused;
      return isFocused;
    },

    update(dt, timeSec) {
      if (typeof timeSec === 'number' && Number.isFinite(timeSec)) {
        uTimeUniform.value = timeSec;
      } else if (typeof dt === 'number' && Number.isFinite(dt)) {
        uTimeUniform.value += dt;
      }
    },

    getFocusCameraPose() {
      const anchor = WATERCOLOR_GALLERY_SPEC.anchorPosition;
      const camOff = WATERCOLOR_GALLERY_SPEC.focusCameraOffset;
      const lookOff = WATERCOLOR_GALLERY_SPEC.focusLookAtOffset;

      return {
        cameraPos: new THREE.Vector3(
          anchor.x + camOff.x,
          floorY + anchor.yRel + camOff.y,
          anchor.z + camOff.z
        ),
        lookAtPos: new THREE.Vector3(
          anchor.x + lookOff.x,
          floorY + anchor.yRel + lookOff.y,
          anchor.z + lookOff.z
        ),
      };
    },

    samplePixel(u, v, timeOverride = null) {
      const t = timeOverride !== null ? Number(timeOverride) : uTimeUniform.value;
      return evaluateWaterColorPixel(u, v, t, divisionVal, scaleVal);
    },

    getState() {
      return {
        title: WATERCOLOR_GALLERY_SPEC.title,
        id: WATERCOLOR_GALLERY_SPEC.id,
        division: divisionVal,
        scale: scaleVal,
        timeSec: uTimeUniform.value,
        isFocused,
        canvasRotationY: canvasStageGroup.rotation.y,
      };
    },
  };

  return system;
}

// ============================================================================
// Exclusive Skybox-Only "Water Color" Shader System (Spec 025 §5)
// ============================================================================

export const WATERCOLOR_SKYBOX_SPEC = Object.freeze({
  title: 'Water Color Skybox',
  id: 'watercolor-skybox-025',
  radius: 145.0,
  widthSegments: 48,
  heightSegments: 32,
  centerPosition: Object.freeze({ x: 0.0, y: 12.0, z: 22.0 }),
});

export function createWaterColorSkyboxMaterial({
  uTimeUniform,
  initialDivision = WATERCOLOR_DEFAULT_PARAMS.division,
  initialScale = WATERCOLOR_DEFAULT_PARAMS.scale,
  applyStencilReject = null,
} = {}) {
  const mat = new THREE.ShaderMaterial({
    name: 'WaterColorSkyboxShaderMaterial',
    uniforms: {
      uTime: uTimeUniform || { value: 0.0 },
      uDivision: { value: Number(initialDivision) },
      uScale: { value: Number(initialScale) },
      uAspect: { value: WATERCOLOR_DEFAULT_PARAMS.aspectRatio },
      uDeepMaroon: { value: WATERCOLOR_PALETTE.deepMaroonColor.clone() },
      uCrimson: { value: WATERCOLOR_PALETTE.crimsonColor.clone() },
      uVermilion: { value: WATERCOLOR_PALETTE.vermilionColor.clone() },
      uAmberTransition: { value: WATERCOLOR_PALETTE.amberTransitionColor.clone() },
      uForestGreenTrough: { value: WATERCOLOR_PALETTE.forestGreenTroughColor.clone() },
      uShadowTrough: { value: WATERCOLOR_PALETTE.shadowTroughColor.clone() },
      uNeonMagenta: { value: WATERCOLOR_PALETTE.neonMagentaColor.clone() },
      uNeonViolet: { value: WATERCOLOR_PALETTE.neonVioletColor.clone() },
      uVibrantViolet: { value: WATERCOLOR_PALETTE.vibrantVioletColor.clone() },
      uElectricCobalt: { value: WATERCOLOR_PALETTE.electricCobaltColor.clone() },
    },
    vertexShader: `
      varying vec2 vUv;
      varying vec3 vWorldDir;
      void main() {
        vUv = uv;
        vWorldDir = normalize(position);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      precision highp float;

      uniform float uTime;
      uniform float uDivision;
      uniform float uScale;
      uniform float uAspect;

      uniform vec3 uDeepMaroon;
      uniform vec3 uCrimson;
      uniform vec3 uVermilion;
      uniform vec3 uAmberTransition;
      uniform vec3 uForestGreenTrough;
      uniform vec3 uShadowTrough;
      uniform vec3 uNeonMagenta;
      uniform vec3 uNeonViolet;
      uniform vec3 uVibrantViolet;
      uniform vec3 uElectricCobalt;

      varying vec2 vUv;
      varying vec3 vWorldDir;

      void main() {
        vec3 dir = normalize(vWorldDir);
        // Seamless spherical direction projection onto [0, 1]^2 (zero longitude seam)
        vec2 sphereUv = vec2(
          clamp(0.5 + 0.36 * dir.x + 0.28 * dir.z, 0.0, 1.0),
          clamp(0.5 + 0.45 * dir.y, 0.0, 1.0)
        );

        float effDivision = clamp(uDivision, 1.0, 16.0);
        float effScale = clamp(uScale, 0.5, 24.0);
        float zoom = effScale / 6.0;

        vec2 centered = (sphereUv - vec2(0.5, 0.5)) * zoom;
        vec2 p = centered + vec2(0.5, 0.5);

        vec2 q = p;
        float serrAccum = 0.0;
        float lobeInterference = 0.0;

        for (int k = 1; k <= 12; k++) {
          float fk = float(k);
          float wk = clamp(effDivision - (fk - 1.0), 0.0, 1.0);
          float freq = (1.15 + 0.62 * fk) * (0.75 + 0.25 * zoom);
          float phaseX = uTime * (0.32 + 0.07 * fk) + fk * 1.37;
          float phaseY = uTime * (0.27 + 0.06 * fk) + fk * 0.93;

          float dx = sin(q.y * freq + q.x * (0.55 * fk) + phaseX) / (0.85 + 0.55 * fk);
          float dy = cos(q.x * freq - q.y * (0.48 * fk) - phaseY) / (0.85 + 0.55 * fk);
          q.x += wk * 0.14 * dx;
          q.y += wk * 0.14 * dy;

          float perpArg = (q.x * 0.65 - q.y * 0.76) * (1.8 * fk) + sin(q.y * 2.4 * fk - phaseX) * 0.85 + phaseY;
          serrAccum += wk * (sin(perpArg) / (0.70 + 0.45 * fk));

          lobeInterference += wk * (cos(q.x * (1.4 * fk) + q.y * (0.9 * fk) - phaseX * 0.8) / fk);
        }

        float diagBase = (q.x * 0.86 + (1.0 - q.y) * 0.36) * (0.85 + 0.15 * zoom);
        float perpWave = serrAccum * (0.08 + 0.018 * effDivision);
        float bandCoord = diagBase + perpWave + 0.16 * sin(uTime * 0.42 + q.y * 1.8);

        float harmonicFreq = (2.2 + 1.35 * effDivision) * (0.8 + 0.2 * zoom);
        float harmonicRipple = sin(bandCoord * harmonicFreq - uTime * 0.65 + serrAccum * 0.55);
        float softSubdivision = 0.055 * (effDivision / 6.0) * smoothstep(-0.85, 0.85, harmonicRipple);

        float lobeCenterU = 0.64 + 0.16 * sin(uTime * 0.38);
        float lobeCrestHeight = 0.42 + 0.22 * sin(uTime * 0.46 - 0.35)
                              + (0.06 + 0.015 * effDivision) * cos((q.x - lobeCenterU) * (3.2 + 0.45 * effDivision) + uTime * 0.52)
                              + 0.045 * serrAccum;
        float lobeDistX = (q.x - lobeCenterU) / (0.24 + 0.10 * sin(uTime * 0.35));
        float lobeProfile = lobeCrestHeight - 0.48 * lobeDistX * lobeDistX;
        float lobeMask = smoothstep((1.0 - p.y) - 0.22, (1.0 - p.y) + 0.18, lobeProfile + (1.0 - p.y) - 0.42);

        float troughCenterU = 0.84 - 0.18 * sin(uTime * 0.40);
        float troughCenterV = 0.86 + 0.06 * cos(uTime * 0.34);
        vec2 troughDelta = vec2((q.x - troughCenterU) / 0.28, (q.y - troughCenterV) / 0.36);
        float troughWave = length(troughDelta) - 0.12 * serrAccum;
        float troughMask = 1.0 - smoothstep(0.18, 0.92, troughWave);

        float diagT = clamp(bandCoord + softSubdivision, 0.0, 1.35);
        float t0 = smoothstep(0.05, 0.35, diagT);
        float t1 = smoothstep(0.32, 0.65, diagT);
        float t2 = smoothstep(0.60, 1.05, diagT);

        vec3 col = mix(uDeepMaroon, uCrimson, t0);
        col = mix(col, uVermilion, t1);
        col = mix(col, uAmberTransition, t2 * 0.7);

        float bluePhase = pow(max(0.0, sin((uTime - 3.8) * 0.48)), 2.0);
        float violetPhase = pow(max(0.0, sin((uTime - 4.8) * 0.50)), 2.0);
        float phase2Factor = smoothstep(1.2, 2.6, uTime) * (1.0 - smoothstep(3.2, 4.4, uTime));

        vec3 lobeCol = mix(uNeonMagenta, uNeonViolet, phase2Factor);
        lobeCol = mix(lobeCol, uVibrantViolet, violetPhase);
        lobeCol = mix(lobeCol, uElectricCobalt, bluePhase);

        float bandWaveMod = smoothstep(0.2, 0.8, sin(bandCoord * 3.14159265 + uTime * 0.3));
        col = mix(col, uVibrantViolet, violetPhase * bandWaveMod * 0.85);
        col = mix(col, uElectricCobalt, bluePhase * (1.0 - bandWaveMod * 0.4) * 0.9);

        col = mix(col, lobeCol, lobeMask);

        vec3 troughCol = mix(uForestGreenTrough, uShadowTrough, smoothstep(0.4, 0.85, troughMask));
        col = mix(col, troughCol, troughMask * 0.96);

        gl_FragColor = vec4(col, 1.0);
      }
    `,
    side: THREE.BackSide,
    depthTest: true,
    depthWrite: false,
    toneMapped: false,
    fog: false,
    lights: false,
  });

  if (typeof applyStencilReject === 'function') {
    applyStencilReject(mat);
  }

  return mat;
}

export function buildWaterColorSkyboxSystem({
  rootGroup,
  uTimeUniform = { value: 0.0 },
  applyStencilReject = null,
} = {}) {
  if (!rootGroup) {
    throw new Error('buildWaterColorSkyboxSystem requires a valid THREE.Group rootGroup.');
  }

  let divisionVal = WATERCOLOR_DEFAULT_PARAMS.division;
  let scaleVal = WATERCOLOR_DEFAULT_PARAMS.scale;

  rootGroup.name = 'WaterColorSkyboxGroup';
  rootGroup.position.set(
    WATERCOLOR_SKYBOX_SPEC.centerPosition.x,
    WATERCOLOR_SKYBOX_SPEC.centerPosition.y,
    WATERCOLOR_SKYBOX_SPEC.centerPosition.z
  );

  const skyboxGeom = new THREE.SphereGeometry(
    WATERCOLOR_SKYBOX_SPEC.radius,
    WATERCOLOR_SKYBOX_SPEC.widthSegments,
    WATERCOLOR_SKYBOX_SPEC.heightSegments
  );
  skyboxGeom.computeBoundingBox();
  skyboxGeom.computeBoundingSphere();

  const skyboxMat = createWaterColorSkyboxMaterial({
    uTimeUniform,
    initialDivision: divisionVal,
    initialScale: scaleVal,
    applyStencilReject,
  });

  const skyboxMesh = new THREE.Mesh(skyboxGeom, skyboxMat);
  skyboxMesh.name = 'SkyboxWaterColorMesh';
  skyboxMesh.renderOrder = 2;
  skyboxMesh.frustumCulled = false;
  skyboxMesh.raycast = () => {};
  skyboxMesh.userData.isWaterColorSkybox = true;
  rootGroup.add(skyboxMesh);

  rootGroup.updateMatrixWorld(true);

  const system = {
    id: WATERCOLOR_SKYBOX_SPEC.id,
    title: WATERCOLOR_SKYBOX_SPEC.title,
    isSkyboxOnly: true,
    isFocused: false,
    radius: WATERCOLOR_SKYBOX_SPEC.radius,
    rootGroup,
    skyboxMesh,
    skyboxMaterial: skyboxMat,
    material: skyboxMat,
    canvasMesh: null,
    canvasMaterial: skyboxMat,
    blackBackdropMesh: null,
    wireframeEnvGroup: null,
    raycastTargets: [],
    uTimeUniform,

    get division() {
      return divisionVal;
    },
    set division(val) {
      this.setDivision(val);
    },

    get scale() {
      return scaleVal;
    },
    set scale(val) {
      this.setScale(val);
    },

    setDivision(val) {
      const num = Math.round(Number(val));
      const clamped = Math.max(
        WATERCOLOR_DEFAULT_PARAMS.minDivision,
        Math.min(WATERCOLOR_DEFAULT_PARAMS.maxDivision, Number.isFinite(num) ? num : WATERCOLOR_DEFAULT_PARAMS.division)
      );
      divisionVal = clamped;
      skyboxMat.uniforms.uDivision.value = clamped;
      return clamped;
    },

    setScale(val) {
      const num = Math.round(Number(val));
      const clamped = Math.max(
        WATERCOLOR_DEFAULT_PARAMS.minScale,
        Math.min(WATERCOLOR_DEFAULT_PARAMS.maxScale, Number.isFinite(num) ? num : WATERCOLOR_DEFAULT_PARAMS.scale)
      );
      scaleVal = clamped;
      skyboxMat.uniforms.uScale.value = clamped;
      return clamped;
    },

    setFocused() {
      return false;
    },

    update(dt, timeSec) {
      if (typeof timeSec === 'number' && Number.isFinite(timeSec)) {
        uTimeUniform.value = timeSec;
      } else if (typeof dt === 'number' && Number.isFinite(dt)) {
        uTimeUniform.value += dt;
      }
    },

    samplePixel(u, v, timeOverride = null) {
      const t = timeOverride !== null ? Number(timeOverride) : uTimeUniform.value;
      return evaluateWaterColorPixel(u, v, t, divisionVal, scaleVal);
    },

    getState() {
      return {
        title: WATERCOLOR_SKYBOX_SPEC.title,
        id: WATERCOLOR_SKYBOX_SPEC.id,
        isSkyboxOnly: true,
        radius: WATERCOLOR_SKYBOX_SPEC.radius,
        division: divisionVal,
        scale: scaleVal,
        timeSec: uTimeUniform.value,
        isFocused: false,
      };
    },
  };

  return system;
}

