/**
 * holographic_sign.js - Intersecting 3D Holographic Typography Runtime System
 * Authoritative Specification: anim/LUIS_AI_ENGINEER_SIGN.md
 * Governing Tickets: ticket-001.md, ticket-003.md, ticket-004.md, ticket-005.md, ticket-006.md
 * Matrix: wayfinder/20261020T012826-709-gx7f/master_component_to_edit_matrix.md
 * Schemas: assets/20261020T012826-709-gx7f/plan-luis-sign-runtime-schema.json
 */

import * as THREE from 'three';

// ============================================================================
// 1. Authoritative 17-Node Manifest & Lookup Dictionaries (Ticket-001)
// ============================================================================

export const HOLO_SIGN_MANIFEST = Object.freeze([
  Object.freeze({
    index: 1,
    code: '01',
    nodeName: 'Node_01_L_LUIS_PEREZ',
    glyph: 'L',
    spatialRole: 'Horizontal Only',
    branch: 'LUIS_PEREZ',
    wordMembership: Object.freeze(['LUIS_PEREZ']),
    isSharedIntersection: false,
    gridCol: 1,
    gridRow: 0,
    position: Object.freeze([-3.825, 0.0, 0.0]),
  }),
  Object.freeze({
    index: 2,
    code: '02',
    nodeName: 'Node_02_U_LUIS_PEREZ',
    glyph: 'U',
    spatialRole: 'Horizontal Only',
    branch: 'LUIS_PEREZ',
    wordMembership: Object.freeze(['LUIS_PEREZ']),
    isSharedIntersection: false,
    gridCol: 2,
    gridRow: 0,
    position: Object.freeze([-2.975, 0.0, 0.0]),
  }),
  Object.freeze({
    index: 3,
    code: '03',
    nodeName: 'Node_03_I_SHARED_AI_LUIS_PEREZ',
    glyph: 'I',
    spatialRole: 'Shared Intersection',
    branch: 'SHARED_AI_LUIS_PEREZ',
    wordMembership: Object.freeze(['LUIS_PEREZ', 'AI']),
    isSharedIntersection: true,
    gridCol: 3,
    gridRow: 0,
    position: Object.freeze([-2.125, 0.0, 0.0]),
  }),
  Object.freeze({
    index: 4,
    code: '04',
    nodeName: 'Node_04_S_LUIS_PEREZ',
    glyph: 'S',
    spatialRole: 'Horizontal Only',
    branch: 'LUIS_PEREZ',
    wordMembership: Object.freeze(['LUIS_PEREZ']),
    isSharedIntersection: false,
    gridCol: 4,
    gridRow: 0,
    position: Object.freeze([-1.275, 0.0, 0.0]),
  }),
  Object.freeze({
    index: 5,
    code: '05',
    nodeName: 'Node_05_P_LUIS_PEREZ',
    glyph: 'P',
    spatialRole: 'Horizontal Only',
    branch: 'LUIS_PEREZ',
    wordMembership: Object.freeze(['LUIS_PEREZ']),
    isSharedIntersection: false,
    gridCol: 6,
    gridRow: 0,
    position: Object.freeze([0.425, 0.0, 0.0]),
  }),
  Object.freeze({
    index: 6,
    code: '06',
    nodeName: 'Node_06_E_SHARED_ENGINEER_LUIS_PEREZ',
    glyph: 'E',
    spatialRole: 'Shared Intersection',
    branch: 'SHARED_ENGINEER_LUIS_PEREZ',
    wordMembership: Object.freeze(['LUIS_PEREZ', 'ENGINEER']),
    isSharedIntersection: true,
    gridCol: 7,
    gridRow: 0,
    position: Object.freeze([1.275, 0.0, 0.0]),
  }),
  Object.freeze({
    index: 7,
    code: '07',
    nodeName: 'Node_07_R_LUIS_PEREZ',
    glyph: 'R',
    spatialRole: 'Horizontal Only',
    branch: 'LUIS_PEREZ',
    wordMembership: Object.freeze(['LUIS_PEREZ']),
    isSharedIntersection: false,
    gridCol: 8,
    gridRow: 0,
    position: Object.freeze([2.125, 0.0, 0.0]),
  }),
  Object.freeze({
    index: 8,
    code: '08',
    nodeName: 'Node_08_E_LUIS_PEREZ',
    glyph: 'E',
    spatialRole: 'Horizontal Only',
    branch: 'LUIS_PEREZ',
    wordMembership: Object.freeze(['LUIS_PEREZ']),
    isSharedIntersection: false,
    gridCol: 9,
    gridRow: 0,
    position: Object.freeze([2.975, 0.0, 0.0]),
  }),
  Object.freeze({
    index: 9,
    code: '09',
    nodeName: 'Node_09_Z_LUIS_PEREZ',
    glyph: 'Z',
    spatialRole: 'Horizontal Only',
    branch: 'LUIS_PEREZ',
    wordMembership: Object.freeze(['LUIS_PEREZ']),
    isSharedIntersection: false,
    gridCol: 10,
    gridRow: 0,
    position: Object.freeze([3.825, 0.0, 0.0]),
  }),
  Object.freeze({
    index: 10,
    code: '10',
    nodeName: 'Node_10_A_AI',
    glyph: 'A',
    spatialRole: 'Vertical Only',
    branch: 'AI',
    wordMembership: Object.freeze(['AI']),
    isSharedIntersection: false,
    gridCol: 3,
    gridRow: 1,
    position: Object.freeze([-2.125, 1.05, 0.0]),
  }),
  Object.freeze({
    index: 11,
    code: '11',
    nodeName: 'Node_11_N_ENGINEER',
    glyph: 'N',
    spatialRole: 'Vertical Only',
    branch: 'ENGINEER',
    wordMembership: Object.freeze(['ENGINEER']),
    isSharedIntersection: false,
    gridCol: 7,
    gridRow: -1,
    position: Object.freeze([1.275, -1.05, 0.0]),
  }),
  Object.freeze({
    index: 12,
    code: '12',
    nodeName: 'Node_12_G_ENGINEER',
    glyph: 'G',
    spatialRole: 'Vertical Only',
    branch: 'ENGINEER',
    wordMembership: Object.freeze(['ENGINEER']),
    isSharedIntersection: false,
    gridCol: 7,
    gridRow: -2,
    position: Object.freeze([1.275, -2.1, 0.0]),
  }),
  Object.freeze({
    index: 13,
    code: '13',
    nodeName: 'Node_13_I_ENGINEER',
    glyph: 'I',
    spatialRole: 'Vertical Only',
    branch: 'ENGINEER',
    wordMembership: Object.freeze(['ENGINEER']),
    isSharedIntersection: false,
    gridCol: 7,
    gridRow: -3,
    position: Object.freeze([1.275, -3.15, 0.0]),
  }),
  Object.freeze({
    index: 14,
    code: '14',
    nodeName: 'Node_14_N_ENGINEER',
    glyph: 'N',
    spatialRole: 'Vertical Only',
    branch: 'ENGINEER',
    wordMembership: Object.freeze(['ENGINEER']),
    isSharedIntersection: false,
    gridCol: 7,
    gridRow: -4,
    position: Object.freeze([1.275, -4.2, 0.0]),
  }),
  Object.freeze({
    index: 15,
    code: '15',
    nodeName: 'Node_15_E_ENGINEER',
    glyph: 'E',
    spatialRole: 'Vertical Only',
    branch: 'ENGINEER',
    wordMembership: Object.freeze(['ENGINEER']),
    isSharedIntersection: false,
    gridCol: 7,
    gridRow: -5,
    position: Object.freeze([1.275, -5.25, 0.0]),
  }),
  Object.freeze({
    index: 16,
    code: '16',
    nodeName: 'Node_16_E_ENGINEER',
    glyph: 'E',
    spatialRole: 'Vertical Only',
    branch: 'ENGINEER',
    wordMembership: Object.freeze(['ENGINEER']),
    isSharedIntersection: false,
    gridCol: 7,
    gridRow: -6,
    position: Object.freeze([1.275, -6.3, 0.0]),
  }),
  Object.freeze({
    index: 17,
    code: '17',
    nodeName: 'Node_17_R_ENGINEER',
    glyph: 'R',
    spatialRole: 'Vertical Only',
    branch: 'ENGINEER',
    wordMembership: Object.freeze(['ENGINEER']),
    isSharedIntersection: false,
    gridCol: 7,
    gridRow: -7,
    position: Object.freeze([1.275, -7.35, 0.0]),
  }),
]);

const byIdMap = {};
for (const item of HOLO_SIGN_MANIFEST) {
  byIdMap[item.nodeName] = item;
  byIdMap[item.index] = item;
  byIdMap[String(item.index)] = item;
  byIdMap[item.code] = item;
  byIdMap[`Node_${item.code}`] = item;
}
export const HOLO_SIGN_BY_ID = Object.freeze(byIdMap);

export const HOLO_SIGN_WORD_BRANCHES = Object.freeze({
  LUIS_PEREZ: Object.freeze([1, 2, 3, 4, 5, 6, 7, 8, 9]),
  AI: Object.freeze([10, 3]),
  ENGINEER: Object.freeze([6, 11, 12, 13, 14, 15, 16, 17]),
  SHARED: Object.freeze([3, 6]),
});

export const HOLO_SIGN_FAULT_TYPES = Object.freeze([
  'micro_stutter',
  'brownout',
  'hard_dropout',
  'branch_cascade',
]);

export const HOLO_SIGN_GLITCH_TYPES = Object.freeze([
  'positional_snap_jitter',
  'parallax_decoupling',
  'chromatic_hue_split',
  'horizontal_slice_shear',
  'projection_surge',
]);

export const HOLO_SIGN_PROTECTION_MODES = Object.freeze([
  'stay_lit',
  'partial_dim',
  'unprotected',
]);

export const HOLO_SIGN_DEFAULT_PARAMS = Object.freeze({
  parallaxLayerCount: 3,
  minParallaxLayerCount: 1,
  maxParallaxLayerCount: 6,
  zLayerSpacing: 0.035,
  layerOpacityFalloff: 0.52,
  layerIntensityFalloff: 0.68,
  baseColorHex: '#00f0ff',
  secondaryColorHex: '#3b82f6',
  aberrationColorHex: '#ff2a85',
  emissiveIntensity: 1.85,
  baseOpacity: 0.94,
  scanlineDensity: 18.0,
  scanlineSpeed: 1.65,
  scanlineContrast: 0.24,
  humFrequency: 58.0,
  humAmplitude: 0.045,
  flickerFrequency: 1.2,
  glitchAmplitude: 1.0,
  sharedProtectionMode: 'stay_lit',
  sharedPartialDimFloor: 0.62,
  minReadabilityRatio: 0.8235,
  maxConcurrentFaultedNodes: 3,
});

// ============================================================================
// 2. Node Name Parser & Resolver (INV-FAILFAST-01)
// ============================================================================

const NODE_NAME_REGEX = /^Node_(0[1-9]|1[0-7])_([A-Z])_(LUIS_PEREZ|AI|ENGINEER|SHARED_AI_LUIS_PEREZ|SHARED_ENGINEER_LUIS_PEREZ|SHARED)$/;

export function parseHolographicSignNodeName(nodeName) {
  if (typeof nodeName !== 'string') {
    throw new Error(`Invalid holographic sign node name: expected string, got ${typeof nodeName}`);
  }
  const match = nodeName.match(NODE_NAME_REGEX);
  if (!match) {
    throw new Error(
      `Holographic sign node name '${nodeName}' does not conform to authoritative naming contract '^Node_(0[1-9]|1[0-7])_([A-Z])_(BRANCH)$'`
    );
  }
  const code = match[1];
  const index = parseInt(code, 10);
  const glyph = match[2];
  const branchToken = match[3];

  let wordMembership;
  if (index === 3) {
    wordMembership = ['LUIS_PEREZ', 'AI'];
  } else if (index === 6) {
    wordMembership = ['LUIS_PEREZ', 'ENGINEER'];
  } else if (index === 10) {
    wordMembership = ['AI'];
  } else if (index >= 11 && index <= 17) {
    wordMembership = ['ENGINEER'];
  } else {
    wordMembership = ['LUIS_PEREZ'];
  }

  return {
    index,
    code,
    nodeName,
    glyph,
    branch: branchToken,
    wordMembership,
    isSharedIntersection: index === 3 || index === 6,
  };
}

export function resolveHolographicSignNodeSpec(idOrCodeOrNameOrIndex) {
  if (idOrCodeOrNameOrIndex === null || idOrCodeOrNameOrIndex === undefined) {
    throw new Error('Cannot resolve null or undefined holographic sign node spec');
  }
  const found = HOLO_SIGN_BY_ID[idOrCodeOrNameOrIndex];
  if (found) {
    return found;
  }
  if (typeof idOrCodeOrNameOrIndex === 'string') {
    const parsed = parseHolographicSignNodeName(idOrCodeOrNameOrIndex);
    return HOLO_SIGN_BY_ID[parsed.index];
  }
  throw new Error(`Unknown holographic sign node identifier: ${idOrCodeOrNameOrIndex}`);
}

// ============================================================================
// 3. Crossword Spatial Topology Evaluator (Ticket-001)
// ============================================================================

export function computeCrosswordLayoutMatrix(options = {}) {
  const colPitch = options.colPitch ?? 0.85;
  const rowPitch = options.rowPitch ?? 1.05;
  const centerCol = options.centerCol ?? 5.5;
  const baselineY = options.baselineY ?? 0.0;

  const results = [];
  for (const item of HOLO_SIGN_MANIFEST) {
    const x = (item.gridCol - centerCol) * colPitch;
    const y = baselineY + item.gridRow * rowPitch;
    results.push({
      ...item,
      computedPosition: [x, y, 0.0],
      pitch: { colPitch, rowPitch },
    });
  }
  return results;
}

// ============================================================================
// 4. Parallax Depth Stack Expansion (Ticket-003, Ticket-005)
// ============================================================================

export function evaluateParallaxDepthStack(nodeSpec, params = HOLO_SIGN_DEFAULT_PARAMS, glitchState = null) {
  const count = Math.min(
    Math.max(params.parallaxLayerCount ?? HOLO_SIGN_DEFAULT_PARAMS.parallaxLayerCount, 1),
    6
  );
  const spacing = params.zLayerSpacing ?? HOLO_SIGN_DEFAULT_PARAMS.zLayerSpacing;
  const opFalloff = params.layerOpacityFalloff ?? HOLO_SIGN_DEFAULT_PARAMS.layerOpacityFalloff;
  const intFalloff = params.layerIntensityFalloff ?? HOLO_SIGN_DEFAULT_PARAMS.layerIntensityFalloff;

  const layers = [];

  // Foreground Primary Pane (Layer 0, Z = 0)
  layers.push({
    layerIndex: 0,
    isForeground: true,
    restingZ: 0.0,
    offset: { x: 0.0, y: 0.0, z: 0.0 },
    opacityScale: 1.0,
    intensityScale: 1.0,
    chromaticSplitWeight: 0.0,
  });

  // Trailing Echo Panes (Layers 1..N, Z < 0)
  for (let i = 1; i <= count; i++) {
    const restingZ = -i * spacing;
    const opScale = Math.pow(opFalloff, i);
    const intScale = Math.pow(intFalloff, i);

    let offsetX = 0.0;
    let offsetY = 0.0;
    let offsetZ = restingZ;
    let chromaticWeight = 0.0;

    if (glitchState && glitchState.type === 'parallax_decoupling') {
      const p = Math.max(0.0, Math.min(1.0, glitchState.progress ?? 0.0));
      const env = Math.sin(Math.PI * p);
      const fanOutX = (glitchState.fanOutX ?? 0.035) * (glitchState.directionX ?? 1.0);
      const fanOutY = (glitchState.fanOutY ?? 0.0) * (glitchState.directionY ?? 0.0);
      const kExpand = glitchState.kExpand ?? 2.1;

      offsetX = i * fanOutX * env;
      offsetY = i * fanOutY * env;
      offsetZ = restingZ * (1.0 + (kExpand - 1.0) * env);
      chromaticWeight = Math.min(1.0, (0.45 + 0.20 * i) * env);
    }

    layers.push({
      layerIndex: i,
      isForeground: false,
      restingZ,
      offset: { x: offsetX, y: offsetY, z: offsetZ },
      opacityScale: opScale,
      intensityScale: intScale,
      chromaticSplitWeight: chromaticWeight,
    });
  }

  return layers;
}

// ============================================================================
// 5. Baseline Holographic Optics Evaluator (CPU Mirror, Ticket-003)
// ============================================================================

export function evaluateBaselineHolographicOptics(sampleInput) {
  const ySign = sampleInput.ySign ?? 0.0;
  const time = sampleInput.time ?? 0.0;
  const layerIndex = sampleInput.layerIndex ?? 0;
  const chromaticWeight = sampleInput.chromaticWeight ?? 0.0;
  const flickerGain = sampleInput.flickerGain ?? 1.0;
  const surgeFactor = sampleInput.surgeFactor ?? 0.0;
  const params = { ...HOLO_SIGN_DEFAULT_PARAMS, ...(sampleInput.params || {}) };

  const speedMul = 1.0 + 2.2 * surgeFactor;
  const effectiveSpeed = params.scanlineSpeed * speedMul;

  // Scanline wave in unified sign space
  const scanPhase = 2.0 * Math.PI * (ySign * params.scanlineDensity - time * effectiveSpeed);
  const scanWave = 0.5 + 0.5 * Math.sin(scanPhase);

  // Rolling projection beam
  const beamPhase = ((((ySign * 0.12 - time * 0.25 * effectiveSpeed) % 1.0) + 1.0) % 1.0) - 0.5;
  const rollingBeam = Math.exp(-(beamPhase * beamPhase) / (2.0 * 0.08 * 0.08));

  const scanlineMod =
    (1.0 - params.scanlineContrast) +
    params.scanlineContrast * scanWave +
    0.18 * rollingBeam;

  // Electrical hum (58 Hz)
  const humFactor =
    1.0 +
    params.humAmplitude *
      (0.65 * Math.sin(2.0 * Math.PI * params.humFrequency * time) +
        0.35 * Math.cos(2.0 * Math.PI * 1.73 * params.humFrequency * time));

  // Color & Alpha
  const emissiveSurge = 1.0 + 0.55 * surgeFactor;
  const layerOpScale = layerIndex === 0 ? 1.0 : Math.pow(params.layerOpacityFalloff, layerIndex);
  const layerIntScale = layerIndex === 0 ? 1.0 : Math.pow(params.layerIntensityFalloff, layerIndex);

  const effectiveAlpha = Math.max(0.0, Math.min(1.0, params.baseOpacity * layerOpScale * flickerGain));
  const effectiveLuminance =
    params.emissiveIntensity *
    emissiveSurge *
    layerIntScale *
    scanlineMod *
    humFactor *
    flickerGain;

  return {
    scanlineMod,
    humFactor,
    effectiveAlpha,
    effectiveLuminance,
    chromaticWeight,
    layerIndex,
  };
}

// ============================================================================
// 6. Flicker Profiles & Shared Intersection Protection (Ticket-004)
// ============================================================================

export function evaluateFlickerProfileAtTime(faultSpec, elapsedSec) {
  const duration = faultSpec.durationSec ?? 0.2;
  if (elapsedSec >= duration || duration <= 0) {
    return 1.0;
  }
  const p = Math.max(0.0, Math.min(1.0, elapsedSec / duration));

  switch (faultSpec.type) {
    case 'micro_stutter': {
      const toggleCount = faultSpec.toggleCount ?? 4;
      const lowGain = faultSpec.lowBrightness ?? 0.2;
      const cycle = Math.floor(p * 2 * toggleCount);
      return cycle % 2 === 1 ? lowGain : 1.0;
    }
    case 'brownout': {
      const dimGain = faultSpec.dimBrightness ?? 0.2;
      if (p < 0.05) {
        return 1.0 - (1.0 - dimGain) * (p / 0.05);
      }
      if (p > 0.95) {
        return dimGain + (1.0 - dimGain) * ((p - 0.95) / 0.05);
      }
      return dimGain;
    }
    case 'hard_dropout': {
      if (p < 0.78) {
        return 0.0;
      }
      // Re-ignition stutter across last 22%
      const sub = (p - 0.78) / 0.22;
      if (sub < 0.3) return 0.85;
      if (sub < 0.6) return 0.22;
      return 1.0;
    }
    case 'branch_cascade': {
      const branchLen = faultSpec.branchLength ?? 8;
      const glyphPos = faultSpec.glyphBranchIndex ?? 0;
      const w = 0.20;
      const pStart = (glyphPos / branchLen) * (1.0 - w);
      const pEnd = pStart + w;
      if (p >= pStart && p <= pEnd) {
        const sub = (p - pStart) / w;
        return 0.15 + 0.25 * Math.sin(Math.PI * sub);
      }
      return 1.0;
    }
    default:
      return 1.0;
  }
}

export function evaluateSharedIntersectionProtection(
  nodeIndex,
  rawFlickerGain,
  faultContext,
  protectionMode = 'stay_lit'
) {
  if (!HOLO_SIGN_PROTECTION_MODES.includes(protectionMode)) {
    throw new Error(
      `Invalid protection mode: '${protectionMode}'. Must be one of: ${HOLO_SIGN_PROTECTION_MODES.join(', ')}`
    );
  }

  // Only Node 3 (I) and Node 6 (E) are shared intersections
  if (nodeIndex !== 3 && nodeIndex !== 6) {
    return rawFlickerGain;
  }
  if (protectionMode === 'unprotected') {
    return rawFlickerGain;
  }

  const isVerticalTarget =
    faultContext &&
    (faultContext.targetBranch === 'AI' ||
      faultContext.targetBranch === 'ENGINEER' ||
      faultContext.isVerticalFault);

  if (isVerticalTarget) {
    if (protectionMode === 'stay_lit') {
      return 1.0;
    }
    if (protectionMode === 'partial_dim') {
      return Math.max(rawFlickerGain, 0.62);
    }
  }

  return rawFlickerGain;
}

// PRNG: Deterministic Mulberry32
function createStochasticPRNG(seed = 123456789) {
  let s = seed >>> 0;
  return function () {
    s |= 0;
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function evaluateFlickerScheduler(signState, dt, prng = Math.random) {
  const params = signState.params;
  const nodes = signState.nodes;

  // 1. Advance existing active character faults
  let activeFaultedCount = 0;
  for (const node of nodes) {
    if (node.activeFault) {
      node.activeFault.elapsedSec += dt;
      if (node.activeFault.elapsedSec >= node.activeFault.durationSec) {
        node.activeFault = null;
        node.flickerGain = 1.0;
      } else {
        const rawGain = evaluateFlickerProfileAtTime(node.activeFault, node.activeFault.elapsedSec);
        node.flickerGain = evaluateSharedIntersectionProtection(
          node.index,
          rawGain,
          node.activeFault.context,
          params.sharedProtectionMode
        );
        if (node.flickerGain < 0.80) {
          activeFaultedCount++;
        }
      }
    } else {
      node.flickerGain = 1.0;
    }
  }

  // 2. Count resting bright nodes for 85/15 Readability Ratio
  const restingBrightCount = nodes.filter((n) => n.flickerGain >= 0.80 && !n.activeGlitch).length;
  signState.restingBrightCount = restingBrightCount;
  signState.readabilityRatio = restingBrightCount / nodes.length;

  // 3. Schedule new faults if cooldown has expired and readability budget allows
  const currentImpairedCount = nodes.filter((n) => n.flickerGain < 0.80 || n.activeGlitch !== null).length;

  signState.faultCooldownSec = (signState.faultCooldownSec ?? 1.0) - dt;
  if (
    signState.faultCooldownSec <= 0 &&
    currentImpairedCount < params.maxConcurrentFaultedNodes &&
    signState.readabilityRatio >= params.minReadabilityRatio
  ) {
    const budgetRemaining = Math.max(1, params.maxConcurrentFaultedNodes - currentImpairedCount);
    // Schedule fault: 70% isolated random letter, 30% targeted branch fault
    const roll = prng();
    if (roll < 0.7) {
      // Pick 1 to budgetRemaining random nodes
      const targetCount = Math.min(budgetRemaining, 1 + (prng() < 0.35 ? 1 : 0));
      const candidates = nodes.filter((n) => !n.activeFault && !n.activeGlitch);
      for (let k = 0; k < Math.min(targetCount, candidates.length); k++) {
        const pickIdx = Math.floor(prng() * candidates.length);
        const targetNode = candidates.splice(pickIdx, 1)[0];
        const fTypes = ['micro_stutter', 'brownout', 'hard_dropout'];
        const fType = fTypes[Math.floor(prng() * fTypes.length)];
        let dur = 0.15 + 0.35 * prng();
        if (fType === 'micro_stutter') dur = 0.08 + 0.17 * prng();
        else if (fType === 'brownout') dur = 0.3 + 0.6 * prng();
        else if (fType === 'hard_dropout') dur = 0.15 + 0.45 * prng();

        targetNode.activeFault = {
          type: fType,
          durationSec: dur,
          elapsedSec: 0.0,
          toggleCount: 3 + Math.floor(prng() * 4),
          lowBrightness: 0.12 + 0.15 * prng(),
          dimBrightness: 0.15 + 0.1 * prng(),
          context: { targetBranch: targetNode.branch, isVerticalFault: targetNode.branch !== 'LUIS_PEREZ' },
        };
      }
    } else {
      // Targeted branch fault
      const branches = ['AI', 'ENGINEER', 'LUIS_PEREZ'];
      const branch = branches[Math.floor(prng() * branches.length)];
      const branchIndices = HOLO_SIGN_WORD_BRANCHES[branch];
      const dur = 0.35 + 0.35 * prng();
      branchIndices.forEach((idx, pos) => {
        const node = nodes[idx - 1];
        if (node && !node.activeFault && !node.activeGlitch) {
          node.activeFault = {
            type: 'branch_cascade',
            durationSec: dur,
            elapsedSec: 0.0,
            branchLength: branchIndices.length,
            glyphBranchIndex: pos,
            context: { targetBranch: branch, isVerticalFault: branch !== 'LUIS_PEREZ' },
          };
        }
      });
    }

    // Set next cooldown
    signState.faultCooldownSec = (0.35 + 1.25 * prng()) / Math.max(0.1, params.flickerFrequency);
  }

  return {
    restingBrightCount,
    readabilityRatio: signState.readabilityRatio,
    activeFaultedCount,
  };
}

// ============================================================================
// 7. Spatial Glitches & Home-Transform Recovery (Ticket-005)
// ============================================================================

export function evaluateSpatialGlitch(signState, dt, prng = Math.random) {
  const params = signState.params;
  const nodes = signState.nodes;

  // 1. Advance Global Glitches
  if (signState.globalGlitch) {
    const gg = signState.globalGlitch;
    gg.elapsedSec += dt;
    if (gg.elapsedSec >= gg.durationSec) {
      signState.globalGlitch = null;
      // Reset global uniforms
      signState.sliceShearActive = 0.0;
      signState.sliceDisplacementX = 0.0;
      signState.surgeFactor = 0.0;
    } else {
      const p = gg.elapsedSec / gg.durationSec;
      if (gg.type === 'horizontal_slice_shear') {
        signState.sliceShearActive = 1.0;
        signState.sliceShearYMin = gg.yMin;
        signState.sliceShearYMax = gg.yMax;
        const env = Math.sin(Math.PI * p);
        signState.sliceDisplacementX = gg.displacementX * env * params.glitchAmplitude;
      } else if (gg.type === 'projection_surge') {
        const env = Math.sin(Math.PI * p);
        signState.surgeFactor = env * Math.min(1.5, params.glitchAmplitude);
      }
    }
  }

  // 2. Advance Local Character Glitches & Enforce Zero-Drift Home Transforms
  for (const node of nodes) {
    if (node.activeGlitch) {
      const lg = node.activeGlitch;
      lg.elapsedSec += dt;
      if (lg.elapsedSec >= lg.durationSec) {
        node.activeGlitch = null;
        // Strictly restore home transforms
        node.group.position.copy(node.homePosition);
        node.group.quaternion.copy(node.homeRotation);
        node.group.scale.copy(node.homeScale);
        for (const pane of node.panes) {
          pane.mesh.position.set(0.0, 0.0, pane.restingZ);
          if (pane.mesh.material && pane.mesh.material.uniforms) {
            pane.mesh.material.uniforms.uChromaticSplitWeight.value = 0.0;
          }
        }
      } else {
        const p = lg.elapsedSec / lg.durationSec;
        const env = Math.sin(Math.PI * p);

        if (lg.type === 'positional_snap_jitter') {
          node.group.position.x = node.homePosition.x + lg.jitterX * params.glitchAmplitude;
          node.group.position.y = node.homePosition.y + lg.jitterY * params.glitchAmplitude;
        } else if (lg.type === 'parallax_decoupling') {
          // Decouple trailing panes
          for (let i = 1; i < node.panes.length; i++) {
            const pane = node.panes[i];
            const fanX = i * lg.fanOutX * env * params.glitchAmplitude;
            const fanY = i * lg.fanOutY * env * params.glitchAmplitude;
            const zExp = pane.restingZ * (1.0 + (lg.kExpand - 1.0) * env);
            pane.mesh.position.set(fanX, fanY, zExp);
            if (pane.mesh.material && pane.mesh.material.uniforms) {
              pane.mesh.material.uniforms.uChromaticSplitWeight.value = Math.min(
                1.0,
                (0.45 + 0.2 * i) * env
              );
            }
          }
        }
      }
    }
  }

  // 3. Schedule occasional spatial glitches
  signState.glitchCooldownSec = (signState.glitchCooldownSec ?? 2.5) - dt;
  const currentImpaired = nodes.filter((n) => n.flickerGain < 0.80 || n.activeGlitch !== null).length;
  if (
    signState.glitchCooldownSec <= 0 &&
    params.glitchAmplitude > 0.01 &&
    currentImpaired < params.maxConcurrentFaultedNodes
  ) {
    const availableNodes = nodes.filter((n) => !n.activeGlitch && n.flickerGain >= 0.80);
    const roll = prng();
    if (roll < 0.45 && availableNodes.length > 0) {
      // Positional Snap Jitter on a random letter
      const pick = availableNodes[Math.floor(prng() * availableNodes.length)];
      if (!pick.activeGlitch) {
        pick.activeGlitch = {
          type: 'positional_snap_jitter',
          durationSec: 0.05 + 0.07 * prng(),
          elapsedSec: 0.0,
          jitterX: (prng() - 0.5) * 0.12,
          jitterY: (prng() - 0.5) * 0.08,
        };
      }
    } else if (roll < 0.75 && availableNodes.length > 0) {
      // Parallax Decoupling on a letter
      const pick = availableNodes[Math.floor(prng() * availableNodes.length)];
      if (!pick.activeGlitch) {
        pick.activeGlitch = {
          type: 'parallax_decoupling',
          durationSec: 0.12 + 0.14 * prng(),
          elapsedSec: 0.0,
          fanOutX: (prng() > 0.5 ? 1 : -1) * (0.025 + 0.035 * prng()),
          fanOutY: (prng() - 0.5) * 0.02,
          kExpand: 1.8 + 0.6 * prng(),
        };
      }
    } else if (roll < 0.92) {
      // Global Horizontal Slice Shear
      if (!signState.globalGlitch) {
        const bandH = 0.45 + 0.65 * prng();
        const yCenter = -6.5 + 7.5 * prng();
        signState.globalGlitch = {
          type: 'horizontal_slice_shear',
          durationSec: 0.06 + 0.08 * prng(),
          elapsedSec: 0.0,
          yMin: yCenter - bandH * 0.5,
          yMax: yCenter + bandH * 0.5,
          displacementX: (prng() > 0.5 ? 1 : -1) * (0.08 + 0.08 * prng()),
        };
      }
    } else {
      // Global Projection Surge
      if (!signState.globalGlitch) {
        signState.globalGlitch = {
          type: 'projection_surge',
          durationSec: 0.16 + 0.14 * prng(),
          elapsedSec: 0.0,
        };
      }
    }
    signState.glitchCooldownSec = (1.5 + 3.0 * prng()) / Math.max(0.2, params.glitchAmplitude);
  }
}

// ============================================================================
// 8. Holographic Shader Material (24 Uniforms, Ticket-003)
// ============================================================================

const VERTEX_SHADER = /* glsl */ `
  uniform float uSignOriginY;
  uniform float uNodeRestY;
  uniform float uSliceShearActive;
  uniform float uSliceShearYMin;
  uniform float uSliceShearYMax;
  uniform float uSliceDisplacementX;

  varying vec2 vUv;
  varying float vYSign;

  void main() {
    vUv = uv;
    vec3 pos = position;
    float ySign = uNodeRestY + pos.y - uSignOriginY;
    vYSign = ySign;

    if (uSliceShearActive > 0.5) {
      if (ySign >= uSliceShearYMin && ySign <= uSliceShearYMax) {
        pos.x += uSliceDisplacementX;
      }
    }

    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const FRAGMENT_SHADER = /* glsl */ `
  uniform float uHoloTime;
  uniform vec3 uPrimaryColor;
  uniform vec3 uSecondaryColor;
  uniform vec3 uAberrationColor;
  uniform float uEmissiveIntensity;
  uniform float uBaseOpacity;
  uniform float uLayerOpacityScale;
  uniform float uLayerIntensityScale;
  uniform float uLayerIndex;
  uniform float uTotalLayers;
  uniform float uChromaticSplitWeight;
  uniform float uScanlineDensity;
  uniform float uScanlineSpeed;
  uniform float uScanlineContrast;
  uniform float uHumFrequency;
  uniform float uHumAmplitude;
  uniform float uFlickerGain;
  uniform float uSurgeFactor;

  varying vec2 vUv;
  varying float vYSign;

  void main() {
    float t = uHoloTime;
    float speedMul = 1.0 + 2.2 * uSurgeFactor;
    float effectiveSpeed = uScanlineSpeed * speedMul;

    // Continuous horizontal scanlines in sign space
    float scanPhase = 6.2831853 * (vYSign * uScanlineDensity - t * effectiveSpeed);
    float scanWave = 0.5 + 0.5 * sin(scanPhase);

    // Wide rolling projection beam
    float beamPhase = fract(vYSign * 0.12 - t * 0.25 * effectiveSpeed) - 0.5;
    float rollingBeam = exp(-(beamPhase * beamPhase) / (2.0 * 0.08 * 0.08));

    float scanlineMod = (1.0 - uScanlineContrast) + uScanlineContrast * scanWave + 0.18 * rollingBeam;

    // Electrical hum (58 Hz)
    float hum = 1.0 + uHumAmplitude * (
      0.65 * sin(6.2831853 * uHumFrequency * t) +
      0.35 * cos(6.2831853 * 1.73 * uHumFrequency * t)
    );

    // Optical color distribution
    vec3 col = uPrimaryColor;
    if (uLayerIndex > 0.5) {
      // Trailing echo panes carry softer hue and chromatic split
      vec3 targetTint = (mod(uLayerIndex, 2.0) > 0.5) ? uAberrationColor : uSecondaryColor;
      col = mix(uSecondaryColor, targetTint, clamp(uChromaticSplitWeight, 0.0, 1.0));
    } else {
      // Primary foreground core carries crisp white-hot emissive center
      col = mix(col, vec3(1.0, 1.0, 1.0), 0.22);
    }

    float emissiveSurge = 1.0 + 0.55 * uSurgeFactor;
    float lum = uEmissiveIntensity * emissiveSurge * uLayerIntensityScale * scanlineMod * hum * uFlickerGain;
    vec3 finalColor = col * lum;

    float finalAlpha = uBaseOpacity * uLayerOpacityScale * uFlickerGain;
    finalAlpha = clamp(finalAlpha, 0.0, 1.0);

    if (finalAlpha < 0.001) {
      discard;
    }

    gl_FragColor = vec4(finalColor, finalAlpha);
  }
`;

export function createHolographicSignShaderMaterial(options = {}) {
  const p = { ...HOLO_SIGN_DEFAULT_PARAMS, ...(options.params || {}) };
  const layerIdx = options.layerIndex ?? 0;
  const nodeRestY = options.nodeRestY ?? 0.0;
  const layerOpScale = layerIdx === 0 ? 1.0 : Math.pow(p.layerOpacityFalloff, layerIdx);
  const layerIntScale = layerIdx === 0 ? 1.0 : Math.pow(p.layerIntensityFalloff, layerIdx);

  const uniforms = {
    uHoloTime: options.uTimeUniform || { value: 0.0 },
    uPrimaryColor: { value: new THREE.Color(p.baseColorHex) },
    uSecondaryColor: { value: new THREE.Color(p.secondaryColorHex) },
    uAberrationColor: { value: new THREE.Color(p.aberrationColorHex) },
    uEmissiveIntensity: { value: p.emissiveIntensity },
    uBaseOpacity: { value: p.baseOpacity },
    uLayerOpacityScale: { value: layerOpScale },
    uLayerIntensityScale: { value: layerIntScale },
    uLayerIndex: { value: Number(layerIdx) },
    uTotalLayers: { value: Number(1 + p.parallaxLayerCount) },
    uChromaticSplitWeight: { value: 0.0 },
    uScanlineDensity: { value: p.scanlineDensity },
    uScanlineSpeed: { value: p.scanlineSpeed },
    uScanlineContrast: { value: p.scanlineContrast },
    uHumFrequency: { value: p.humFrequency },
    uHumAmplitude: { value: p.humAmplitude },
    uFlickerGain: { value: 1.0 },
    uSignOriginY: { value: 0.0 },
    uNodeRestY: { value: nodeRestY },
    uSliceShearActive: { value: 0.0 },
    uSliceShearYMin: { value: 0.0 },
    uSliceShearYMax: { value: 0.0 },
    uSliceDisplacementX: { value: 0.0 },
    uSurgeFactor: { value: 0.0 },
  };

  const mat = new THREE.ShaderMaterial({
    uniforms,
    vertexShader: VERTEX_SHADER,
    fragmentShader: FRAGMENT_SHADER,
    transparent: true,
    depthWrite: false,
    depthTest: true,
    side: THREE.DoubleSide,
    blending: options.blending ?? THREE.AdditiveBlending,
  });

  return mat;
}

// ============================================================================
// 9. Runtime Sign Instance & System Builder (Ticket-003, Ticket-006)
// ============================================================================

export function createHolographicSignInstance(gltfOrScene, params = {}) {
  const mergedParams = { ...HOLO_SIGN_DEFAULT_PARAMS, ...params };
  const rootContainer = new THREE.Group();
  rootContainer.name = 'HolographicSignAssembly';

  // Build character controllers
  const nodeControllers = [];
  const nodeControllersById = {};

  for (let i = 0; i < HOLO_SIGN_MANIFEST.length; i++) {
    const spec = HOLO_SIGN_MANIFEST[i];
    let geom = null;

    // Look for GLB mesh primitive
    if (gltfOrScene) {
      const gltfObj = gltfOrScene.scene || gltfOrScene;
      const foundNode = gltfObj.getObjectByName(spec.nodeName);
      if (foundNode) {
        foundNode.traverse((child) => {
          if (child.isMesh && child.geometry && !geom) {
            geom = child.geometry.clone();
          }
        });
      }
    }

    // Headless or fallback planar geometry
    if (!geom) {
      geom = new THREE.PlaneGeometry(0.52, 0.78);
    }

    const charGroup = new THREE.Group();
    charGroup.name = spec.nodeName;
    charGroup.position.set(spec.position[0], spec.position[1], spec.position[2]);

    const homePos = Object.freeze(new THREE.Vector3(spec.position[0], spec.position[1], spec.position[2]));
    const homeRot = Object.freeze(new THREE.Quaternion(0, 0, 0, 1));
    const homeScl = Object.freeze(new THREE.Vector3(1, 1, 1));

    const panes = [];
    const layerConfigs = evaluateParallaxDepthStack(spec, mergedParams);

    for (const cfg of layerConfigs) {
      const mat = createHolographicSignShaderMaterial({
        params: mergedParams,
        layerIndex: cfg.layerIndex,
        nodeRestY: spec.position[1],
      });
      const mesh = new THREE.Mesh(geom, mat);
      mesh.name = `${spec.nodeName}_Pane_${cfg.layerIndex}`;
      mesh.position.set(cfg.offset.x, cfg.offset.y, cfg.offset.z);
      mesh.renderOrder = 130 + spec.index * 10 + cfg.layerIndex;
      charGroup.add(mesh);
      panes.push({
        layerIndex: cfg.layerIndex,
        restingZ: cfg.restingZ,
        mesh,
        material: mat,
      });
    }

    rootContainer.add(charGroup);

    const controller = {
      index: spec.index,
      code: spec.code,
      nodeName: spec.nodeName,
      glyph: spec.glyph,
      branch: spec.branch,
      wordMembership: spec.wordMembership,
      isSharedIntersection: spec.isSharedIntersection,
      gridCol: spec.gridCol,
      gridRow: spec.gridRow,
      homePosition: homePos,
      homeRotation: homeRot,
      homeScale: homeScl,
      group: charGroup,
      panes,
      activeFault: null,
      activeGlitch: null,
      flickerGain: 1.0,
    };

    nodeControllers.push(controller);
    nodeControllersById[spec.nodeName] = controller;
    nodeControllersById[spec.index] = controller;
    nodeControllersById[spec.code] = controller;
  }

  const signState = {
    params: mergedParams,
    nodes: nodeControllers,
    nodesById: nodeControllersById,
    container: rootContainer,
    globalGlitch: null,
    sliceShearActive: 0.0,
    sliceShearYMin: 0.0,
    sliceShearYMax: 0.0,
    sliceDisplacementX: 0.0,
    surgeFactor: 0.0,
    restingBrightCount: 17,
    readabilityRatio: 1.0,
    faultCooldownSec: 1.0,
    glitchCooldownSec: 2.0,
    prng: createStochasticPRNG(12345),
  };

  return {
    rootContainer,
    signState,
    nodeControllers,
    nodeControllersById,
  };
}

export function buildHolographicSignSystem(options = {}) {
  const rootGroup = options.rootGroup || new THREE.Group();
  const floorY = options.floorY ?? 0.04;
  const instance = createHolographicSignInstance(options.gltfOrScene, options.params);
  const state = instance.signState;

  // Freestanding vertical staging in Freeman Alley corridor
  rootGroup.position.set(0.0, floorY + 2.55, 6.8);
  rootGroup.scale.set(0.28, 0.28, 0.28);
  rootGroup.rotation.set(0.0, 0.0, 0.0);
  rootGroup.add(instance.rootContainer);

  function resetToHomeTransforms() {
    state.globalGlitch = null;
    state.sliceShearActive = 0.0;
    state.sliceDisplacementX = 0.0;
    state.surgeFactor = 0.0;
    for (const node of state.nodes) {
      node.activeFault = null;
      node.activeGlitch = null;
      node.flickerGain = 1.0;
      node.group.position.copy(node.homePosition);
      node.group.quaternion.copy(node.homeRotation);
      node.group.scale.copy(node.homeScale);
      for (const pane of node.panes) {
        pane.mesh.position.set(0.0, 0.0, pane.restingZ);
        if (pane.material && pane.material.uniforms) {
          pane.material.uniforms.uChromaticSplitWeight.value = 0.0;
          pane.material.uniforms.uFlickerGain.value = 1.0;
          pane.material.uniforms.uSliceShearActive.value = 0.0;
          pane.material.uniforms.uSliceDisplacementX.value = 0.0;
          pane.material.uniforms.uSurgeFactor.value = 0.0;
        }
      }
    }
  }

  function setParams(partialParams = {}) {
    Object.assign(state.params, partialParams);
    // If parallax layer count or spacing changed, update layer uniforms and resting Z
    for (const node of state.nodes) {
      for (let i = 0; i < node.panes.length; i++) {
        const pane = node.panes[i];
        pane.restingZ = -i * state.params.zLayerSpacing;
        pane.mesh.position.z = pane.restingZ;
        const mat = pane.material;
        if (mat && mat.uniforms) {
          mat.uniforms.uEmissiveIntensity.value = state.params.emissiveIntensity;
          mat.uniforms.uBaseOpacity.value = state.params.baseOpacity;
          mat.uniforms.uScanlineDensity.value = state.params.scanlineDensity;
          mat.uniforms.uScanlineSpeed.value = state.params.scanlineSpeed;
          mat.uniforms.uScanlineContrast.value = state.params.scanlineContrast;
          mat.uniforms.uHumFrequency.value = state.params.humFrequency;
          mat.uniforms.uHumAmplitude.value = state.params.humAmplitude;
          if (i > 0) {
            mat.uniforms.uLayerOpacityScale.value = Math.pow(state.params.layerOpacityFalloff, i);
            mat.uniforms.uLayerIntensityScale.value = Math.pow(state.params.layerIntensityFalloff, i);
          }
        }
      }
    }
  }

  function setProtectionMode(mode) {
    if (!HOLO_SIGN_PROTECTION_MODES.includes(mode)) {
      throw new Error(`Invalid protection mode: ${mode}`);
    }
    state.params.sharedProtectionMode = mode;
  }

  function triggerFault(target, faultType, opts = {}) {
    if (!HOLO_SIGN_FAULT_TYPES.includes(faultType)) {
      throw new Error(`Invalid fault type: ${faultType}`);
    }
    const dur = opts.durationSec ?? (faultType === 'micro_stutter' ? 0.15 : faultType === 'brownout' ? 0.5 : 0.35);

    if (target === 'ALL' || HOLO_SIGN_WORD_BRANCHES[target]) {
      const indices = target === 'ALL' ? state.nodes.map((n) => n.index) : HOLO_SIGN_WORD_BRANCHES[target];
      indices.forEach((idx, pos) => {
        const node = state.nodes[idx - 1];
        if (node) {
          node.activeFault = {
            type: faultType,
            durationSec: dur,
            elapsedSec: 0.0,
            toggleCount: 4,
            lowBrightness: 0.15,
            dimBrightness: 0.2,
            branchLength: indices.length,
            glyphBranchIndex: pos,
            context: { targetBranch: target, isVerticalFault: target !== 'LUIS_PEREZ' },
          };
        }
      });
    } else {
      const nodeSpec = resolveHolographicSignNodeSpec(target);
      const node = state.nodes[nodeSpec.index - 1];
      if (node) {
        node.activeFault = {
          type: faultType,
          durationSec: dur,
          elapsedSec: 0.0,
          toggleCount: 4,
          lowBrightness: 0.15,
          dimBrightness: 0.2,
          context: { targetBranch: node.branch, isVerticalFault: node.branch !== 'LUIS_PEREZ' },
        };
      }
    }
  }

  function triggerGlitch(target, glitchType, opts = {}) {
    if (!HOLO_SIGN_GLITCH_TYPES.includes(glitchType)) {
      throw new Error(`Invalid glitch type: ${glitchType}`);
    }

    if (glitchType === 'horizontal_slice_shear') {
      state.globalGlitch = {
        type: glitchType,
        durationSec: opts.durationSec ?? 0.1,
        elapsedSec: 0.0,
        yMin: opts.yMin ?? -3.5,
        yMax: opts.yMax ?? -1.5,
        displacementX: opts.displacementX ?? 0.14,
      };
    } else if (glitchType === 'projection_surge') {
      state.globalGlitch = {
        type: glitchType,
        durationSec: opts.durationSec ?? 0.22,
        elapsedSec: 0.0,
      };
    } else {
      // Local glitch
      const targetNodes =
        target === 'ALL'
          ? state.nodes
          : HOLO_SIGN_WORD_BRANCHES[target]
          ? HOLO_SIGN_WORD_BRANCHES[target].map((idx) => state.nodes[idx - 1])
          : [state.nodes[resolveHolographicSignNodeSpec(target).index - 1]];

      for (const node of targetNodes) {
        if (node) {
          node.activeGlitch = {
            type: glitchType,
            durationSec: opts.durationSec ?? (glitchType === 'positional_snap_jitter' ? 0.08 : 0.18),
            elapsedSec: 0.0,
            jitterX: opts.jitterX ?? 0.08,
            jitterY: opts.jitterY ?? 0.04,
            fanOutX: opts.fanOutX ?? 0.04,
            fanOutY: opts.fanOutY ?? 0.0,
            kExpand: opts.kExpand ?? 2.2,
          };
        }
      }
    }
  }

  function update(dt, elapsedTime, camera, activeChar) {
    const clampedDt = Math.max(0.0, Math.min(dt, 0.1));
    const timeVal = elapsedTime ?? (options.uTimeUniform ? options.uTimeUniform.value : 0.0);

    // Step state machines
    evaluateFlickerScheduler(state, clampedDt, state.prng);
    evaluateSpatialGlitch(state, clampedDt, state.prng);

    // Apply stencil reject if callback provided
    if (typeof options.applyStencilReject === 'function') {
      for (const node of state.nodes) {
        for (const pane of node.panes) {
          options.applyStencilReject(pane.material);
        }
      }
    }

    // Sync uniforms to all panes
    for (const node of state.nodes) {
      for (const pane of node.panes) {
        const uniforms = pane.material.uniforms;
        if (uniforms) {
          uniforms.uHoloTime.value = timeVal;
          uniforms.uFlickerGain.value = node.flickerGain;
          uniforms.uSliceShearActive.value = state.sliceShearActive;
          uniforms.uSliceShearYMin.value = state.sliceShearYMin;
          uniforms.uSliceShearYMax.value = state.sliceShearYMax;
          uniforms.uSliceDisplacementX.value = state.sliceDisplacementX;
          uniforms.uSurgeFactor.value = state.surgeFactor;
        }
      }
    }
  }

  function getTelemetry() {
    return {
      totalGlyphCount: state.nodes.length,
      restingBrightCount: state.restingBrightCount,
      readabilityRatio: state.readabilityRatio,
      sharedProtectionMode: state.params.sharedProtectionMode,
      activeFaultCount: state.nodes.filter((n) => n.activeFault !== null).length,
      activeGlitchCount: state.nodes.filter((n) => n.activeGlitch !== null).length,
      globalGlitchActive: state.globalGlitch !== null,
      parallaxLayers: state.params.parallaxLayerCount,
      zLayerSpacing: state.params.zLayerSpacing,
      flickerFrequency: state.params.flickerFrequency,
      glitchAmplitude: state.params.glitchAmplitude,
    };
  }

  return {
    rootGroup,
    nodes: state.nodes,
    nodesById: state.nodesById,
    totalGlyphCount: state.nodes.length,
    getNode(idOrIndex) {
      const spec = resolveHolographicSignNodeSpec(idOrIndex);
      return state.nodes[spec.index - 1] || null;
    },
    setParams,
    setProtectionMode,
    triggerFault,
    triggerGlitch,
    resetToHomeTransforms,
    update,
    getTelemetry,
  };
}
