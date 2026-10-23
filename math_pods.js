import * as THREE from 'three';
import { createMathPodPopupManager } from './mathpod_popup.js?v=058';

// ============================================================================
// Authoritative Neon Dark Amber Palette Constants (math_pods.md §1)
// ============================================================================
export const HOLO_POD_PALETTE = {
  // Deep Smoked-Amber Core & Shadows
  coreDeepHex: 0x1a0a00,
  coreDeepStr: '#1a0a00',
  coreShadowHex: 0x2b1200,
  coreShadowStr: '#2b1200',

  // Mid-Tone Holographic Wireframes & Structural Grids
  midWireLowHex: 0xd95b00,
  midWireLowStr: '#d95b00',
  midWireHighHex: 0xf59e0b,
  midWireHighStr: '#f59e0b',

  // High-Intensity Emissive Amber-Gold Highlights & Pulses
  highEmissiveHex: 0xff9d00,
  highEmissiveStr: '#ff9d00',
  highPulseGoldHex: 0xffcc4d,
  highPulseGoldStr: '#ffcc4d',

  // THREE.Color singletons for efficient uniform pass-through
  coreDeep: new THREE.Color(0x1a0a00),
  coreShadow: new THREE.Color(0x2b1200),
  midWireLow: new THREE.Color(0xd95b00),
  midWireHigh: new THREE.Color(0xf59e0b),
  highEmissive: new THREE.Color(0xff9d00),
  highPulseGold: new THREE.Color(0xffcc4d),
};

// ============================================================================
// Authoritative Hologram Pod Staging Specifications (ticket-002.md §1)
// ============================================================================
export const HOLO_POD_SPECS = [
  {
    index: 1,
    id: 'pod-01-graph',
    code: 'POD-01',
    name: '3D Graph Theory Hologram',
    concept: 'graph-theory',
    defaultOffset: { x: 1.04, yRel: 0.9149, z: 6.5979 },
    cycleDuration: 10.0,
    phaseOffset: 0.0,
  },
  {
    index: 2,
    id: 'pod-02-matrix',
    code: 'POD-02',
    name: 'Matrix Rank Solver Hologram',
    concept: 'matrix-rank',
    defaultOffset: { x: 1.2786, yRel: 1.9576, z: 11.8503 },
    cycleDuration: 10.0,
    phaseOffset: 1.4,
  },
  {
    index: 3,
    id: 'pod-03-gradient',
    code: 'POD-03',
    name: 'Gradient Descent Hologram',
    concept: 'gradient-descent',
    defaultOffset: { x: -0.7782, yRel: 1.4727, z: 17.2003 },
    cycleDuration: 10.0,
    phaseOffset: 2.8,
  },
  {
    index: 4,
    id: 'pod-04-neural',
    code: 'POD-04',
    name: 'Neural Network Hologram',
    concept: 'neural-network',
    defaultOffset: { x: -0.1754, yRel: 1.4672, z: 22.397 },
    cycleDuration: 10.0,
    phaseOffset: 4.2,
  },
  {
    index: 5,
    id: 'pod-05-clustering',
    code: 'POD-05',
    name: 'Clustering Algorithm Hologram',
    concept: 'clustering',
    defaultOffset: { x: 0.4896, yRel: 2.5361, z: 27.8826 },
    cycleDuration: 10.0,
    phaseOffset: 5.6,
  },
  {
    index: 7,
    id: 'pod-07-poker',
    code: 'POD-07',
    name: 'Poker / Game Theory Hologram',
    concept: 'poker-game-theory',
    defaultOffset: { x: -0.3884, yRel: 1.7116, z: 34.6507 },
    cycleDuration: 10.0,
    phaseOffset: 8.4,
  },
];

// Corridor clamping bounds for 3D dragging
export const POD_DRAG_BOUNDS = {
  minX: -1.28,
  maxX: 1.28,
  minYRel: 0.65,
  maxYRel: 2.65,
  minZ: 1.50,
  maxZ: 43.50,
};

// ============================================================================
// Authoritative Spec 027 Walk-Through Holographic Glitch Specifications
// ============================================================================
export const WALK_THROUGH_GLITCH_SPEC = Object.freeze({
  outerRadiusMeters: 1.25,
  coreRadiusMeters: 0.58,
  outerVerticalHalfSpan: 1.35,
  coreVerticalHalfSpan: 0.95,
  characterTorsoOffsetY: 1.45,
  characterBodyMinYRel: 0.15,
  characterBodyMaxYRel: 2.00,
  characterRadiusMeters: 0.32,
  attackTimeConstantSec: 0.035,
  decayTimeConstantSec: 0.24,
  entryExitSpikeDurationSec: 0.18,
  coreStationaryMinIntensity: 0.82,
  activeGlitchThreshold: 0.15,
  audioCooldownSec: 0.85,
  baseClockRateHz: 34.0,
  sprintClockRateHz: 58.0,
  maxSliceOffsetMeters: 0.068,
  sprintSliceOffsetMeters: 0.092,
  maxVerticalJitterMeters: 0.015,
  corridorCharRangeZ: 100.0,
  corridorCamRangeZ: 100.0,
});

export function smoothstepDown(outerEdge, innerEdge, x) {
  const t = THREE.MathUtils.clamp((outerEdge - x) / Math.max(1e-6, outerEdge - innerEdge), 0.0, 1.0);
  return t * t * (3.0 - 2.0 * t);
}

// Module-scoped scratch vectors for zero heap allocations
const _scratchCompanionPos = new THREE.Vector3();

export function evaluatePodWalkThroughGlitch(pod, interactionState, dt = 1 / 60, timeSec = 0) {
  if (!pod.worldPos) {
    pod.worldPos = new THREE.Vector3();
  }
  if (pod.rootGroup) {
    pod.worldPos.copy(pod.rootGroup.position);
  }
  const podX = pod.worldPos.x;
  const podY = pod.worldPos.y;
  const podZ = pod.worldPos.z;

  let charPos = null;
  let charVel = null;
  let companionPos = null;

  if (interactionState) {
    charPos =
      interactionState.characterPosition ||
      interactionState.activeCharacter?.position ||
      interactionState.character?.position ||
      interactionState.position ||
      null;

    charVel =
      interactionState.characterVelocity ||
      interactionState.activeCharacter?.velocity ||
      interactionState.character?.velocity ||
      interactionState.velocity ||
      null;

    if (interactionState.companionPosition) {
      companionPos = interactionState.companionPosition;
    } else {
      const actChar =
        interactionState.activeCharacter ||
        interactionState.character ||
        (interactionState.position ? interactionState : null);
      if (actChar?.companionMesh && (actChar.id === 'hoodie' || !actChar.id || actChar.companionMesh.visible)) {
        if (typeof actChar.companionMesh.getWorldPosition === 'function') {
          companionPos = actChar.companionMesh.getWorldPosition(_scratchCompanionPos);
        } else if (actChar.companionMesh.position) {
          companionPos = actChar.companionMesh.position;
        }
      }
    }
  }

  let d_xz = Infinity;
  let deltaY = Infinity;

  if (charPos || companionPos) {
    let dXZChar = Infinity;
    let deltaYTorso = Infinity;
    if (charPos) {
      dXZChar = Math.hypot(podX - charPos.x, podZ - charPos.z);
      deltaYTorso = Math.abs(podY - (charPos.y + WALK_THROUGH_GLITCH_SPEC.characterTorsoOffsetY));
    }

    let dXZComp = Infinity;
    let deltaYComp = Infinity;
    if (companionPos) {
      dXZComp = Math.hypot(podX - companionPos.x, podZ - companionPos.z);
      deltaYComp = Math.abs(podY - companionPos.y);
    }

    if (dXZComp < dXZChar) {
      d_xz = dXZComp;
      deltaY = Math.min(deltaYTorso, deltaYComp);
    } else {
      d_xz = dXZChar;
      deltaY = deltaYTorso;
    }
  }

  // Locomotion speed calculation
  let v_xz = 0.0;
  if (charVel) {
    v_xz = Math.hypot(charVel.x, charVel.z);
  }
  if (charPos && typeof pod._lastCharX === 'number' && typeof pod._lastCharZ === 'number' && dt > 0) {
    const frameSpeed = Math.hypot(charPos.x - pod._lastCharX, charPos.z - pod._lastCharZ) / Math.max(dt, 1 / 120);
    v_xz = Math.max(v_xz, frameSpeed);
  }
  if (charPos) {
    pod._lastCharX = charPos.x;
    pod._lastCharZ = charPos.z;
  }
  const speedNorm = THREE.MathUtils.clamp(v_xz / 4.50, 0.0, 1.0);

  let targetGlitch = 0.0;
  let inOuterZone = false;
  let inCoreZone = false;

  const R_outer = WALK_THROUGH_GLITCH_SPEC.outerRadiusMeters;
  const R_core = WALK_THROUGH_GLITCH_SPEC.coreRadiusMeters;
  const halfSpanOuterY = WALK_THROUGH_GLITCH_SPEC.outerVerticalHalfSpan;
  const halfSpanCoreY = WALK_THROUGH_GLITCH_SPEC.coreVerticalHalfSpan;

  if (!Number.isFinite(d_xz) || d_xz > R_outer || deltaY > halfSpanOuterY) {
    // Zone 1 — Outside Containment Field
    inOuterZone = false;
    inCoreZone = false;
    targetGlitch = 0.0;
    pod.glitchSpikeRemainingSec = 0.0;
  } else if (d_xz > R_core) {
    // Zone 2 — Outer Holographic Fringe / Grazing Pass
    inOuterZone = true;
    inCoreZone = false;
    const prox = smoothstepDown(R_outer, R_core, d_xz);
    if (d_xz <= 0.82 && charPos && Math.abs(podZ - charPos.z) <= 0.45) {
      // Abreast of corridor pod centerline pass (e.g. Scroll-walk corridor pass)
      targetGlitch = Math.max(prox, 0.78 + 0.14 * speedNorm);
    } else {
      targetGlitch = prox * (0.85 + 0.15 * speedNorm);
    }
    if (pod._wasInCoreZone) {
      pod.glitchSpikeRemainingSec = WALK_THROUGH_GLITCH_SPEC.entryExitSpikeDurationSec;
    }
  } else {
    // Zone 3 — Core Walk-Through / Direct Body Intersection (d_xz <= R_core)
    if (deltaY <= halfSpanCoreY) {
      inOuterZone = true;
      inCoreZone = true;
      if (!pod._wasInCoreZone) {
        pod.glitchSpikeRemainingSec = WALK_THROUGH_GLITCH_SPEC.entryExitSpikeDurationSec;
      }
      const coreDepth = 1.0 - (d_xz / Math.max(1e-5, R_core));
      targetGlitch = Math.min(1.0, WALK_THROUGH_GLITCH_SPEC.coreStationaryMinIntensity + 0.10 * coreDepth + 0.12 * speedNorm);
    } else {
      inOuterZone = true;
      inCoreZone = false;
      targetGlitch = 0.35 * (1.0 - deltaY / halfSpanOuterY);
    }
  }

  const clampedDt = Math.max(0.0001, Math.min(dt, 0.1));
  if (pod.glitchSpikeRemainingSec > 0) {
    pod.glitchSpikeRemainingSec = Math.max(0.0, pod.glitchSpikeRemainingSec - clampedDt);
    targetGlitch = Math.max(targetGlitch, 1.0);
  }

  if (typeof pod.walkThroughGlitchIntensity !== 'number') {
    pod.walkThroughGlitchIntensity = 0.0;
  }

  // Attack vs Decay kinetics
  if (targetGlitch >= pod.walkThroughGlitchIntensity) {
    if (targetGlitch >= 0.75 || pod.glitchSpikeRemainingSec > 0) {
      pod.walkThroughGlitchIntensity = targetGlitch;
    } else {
      const alphaAttack = 1.0 - Math.exp(-clampedDt / WALK_THROUGH_GLITCH_SPEC.attackTimeConstantSec);
      pod.walkThroughGlitchIntensity += (targetGlitch - pod.walkThroughGlitchIntensity) * alphaAttack;
    }
  } else {
    const decayFactor = Math.exp(-clampedDt / WALK_THROUGH_GLITCH_SPEC.decayTimeConstantSec);
    pod.walkThroughGlitchIntensity = targetGlitch + (pod.walkThroughGlitchIntensity - targetGlitch) * decayFactor;
    if (targetGlitch === 0.0 && pod.walkThroughGlitchIntensity < 0.018) {
      pod.walkThroughGlitchIntensity = 0.0;
    }
  }
  pod.walkThroughGlitchIntensity = THREE.MathUtils.clamp(pod.walkThroughGlitchIntensity, 0.0, 1.0);

  pod.characterDistanceXZ = Number.isFinite(d_xz) ? Number(d_xz.toFixed(4)) : Infinity;
  pod.characterDeltaY = Number.isFinite(deltaY) ? Number(deltaY.toFixed(4)) : Infinity;
  pod.characterDistance = pod.characterDistanceXZ;
  pod.inOuterGlitchZone = inOuterZone;
  pod.inCoreGlitchZone = inCoreZone;

  const wasGlitching = pod.isWalkThroughGlitching || false;
  pod.isWalkThroughGlitching = pod.walkThroughGlitchIntensity > WALK_THROUGH_GLITCH_SPEC.activeGlitchThreshold;

  let triggeredAudio = false;
  if (!wasGlitching && pod.isWalkThroughGlitching) {
    pod.walkThroughGlitchCount = (pod.walkThroughGlitchCount || 0) + 1;
    triggeredAudio = true;
  }
  if (!pod._wasInCoreZone && inCoreZone) {
    triggeredAudio = true;
  }
  pod._wasInCoreZone = inCoreZone;

  pod.effectiveGlitchIntensity = THREE.MathUtils.clamp(
    Math.max(pod.walkThroughGlitchIntensity, pod.interferencePulse || 0.0),
    0.0,
    1.0
  );

  pod.glitchClockHz = Number((WALK_THROUGH_GLITCH_SPEC.baseClockRateHz + (WALK_THROUGH_GLITCH_SPEC.sprintClockRateHz - WALK_THROUGH_GLITCH_SPEC.baseClockRateHz) * speedNorm).toFixed(2));
  pod.maxSliceOffsetMeters = Number((WALK_THROUGH_GLITCH_SPEC.maxSliceOffsetMeters + (WALK_THROUGH_GLITCH_SPEC.sprintSliceOffsetMeters - WALK_THROUGH_GLITCH_SPEC.maxSliceOffsetMeters) * speedNorm).toFixed(4));

  if (pod.effectiveGlitchIntensity > 0.001) {
    const tick = Math.floor(timeSec * pod.glitchClockHz);
    const modVal = Math.abs(Math.sin(tick * 1.73 + (pod.index || 0) * 2.17));
    pod.currentSliceOffsetMeters = Number(
      (pod.effectiveGlitchIntensity * pod.maxSliceOffsetMeters * (0.58 + 0.42 * modVal)).toFixed(4)
    );
  } else {
    pod.currentSliceOffsetMeters = 0.0;
  }
  pod.glitchSliceOffset = pod.currentSliceOffsetMeters;
  pod.hasWalkThroughGlitchEffect = true;

  if (pod.telemetry) {
    pod.telemetry.hasWalkThroughGlitchEffect = true;
    pod.telemetry.walkThroughGlitchIntensity = pod.walkThroughGlitchIntensity;
    pod.telemetry.isWalkThroughGlitching = pod.isWalkThroughGlitching;
    pod.telemetry.characterDistance = pod.characterDistanceXZ;
    pod.telemetry.glitchSliceOffset = pod.currentSliceOffsetMeters;
    pod.telemetry.walkThroughGlitchCount = pod.walkThroughGlitchCount;
  }

  return {
    inOuterZone,
    inCoreZone,
    targetGlitch,
    walkThroughGlitchIntensity: pod.walkThroughGlitchIntensity,
    isWalkThroughGlitching: pod.isWalkThroughGlitching,
    effectiveGlitchIntensity: pod.effectiveGlitchIntensity,
    triggeredAudio,
  };
}

// Smoothstep helper
function smoothstep(min, max, value) {
  const x = Math.max(0.0, Math.min(1.0, (value - min) / (max - min)));
  return x * x * (3.0 - 2.0 * x);
}

// ============================================================================
// Deterministic 4-Stage State Machine Evaluator (ticket-002.md §3)
// ============================================================================
export function evaluatePodCycleState(timeSec, phaseOffset = 0.0, cycleDuration = 10.0, overrideProgress = null) {
  let cycleProgress;
  if (typeof overrideProgress === 'number' && !Number.isNaN(overrideProgress)) {
    cycleProgress = Math.max(0.0, Math.min(0.9999, overrideProgress));
  } else {
    const rawCycle = ((timeSec + phaseOffset) % cycleDuration + cycleDuration) % cycleDuration;
    cycleProgress = rawCycle / cycleDuration;
  }

  let stage = 'spawn';
  let stageProgress = 0.0;
  let uMaterializeAlpha = 1.0;
  let uClimaxFlash = 0.0;

  if (cycleProgress < 0.15) {
    // 1. spawn [0.00, 0.15)
    stage = 'spawn';
    stageProgress = cycleProgress / 0.15;
    uMaterializeAlpha = smoothstep(0.0, 1.0, stageProgress);
    uClimaxFlash = 0.0;
  } else if (cycleProgress < 0.72) {
    // 2. animate [0.15, 0.72)
    stage = 'animate';
    stageProgress = (cycleProgress - 0.15) / 0.57;
    uMaterializeAlpha = 1.0;
    uClimaxFlash = 0.0;
  } else if (cycleProgress < 0.88) {
    // 3. climax [0.72, 0.88)
    stage = 'climax';
    stageProgress = (cycleProgress - 0.72) / 0.16;
    uMaterializeAlpha = 1.0;
    uClimaxFlash = Math.sin(stageProgress * Math.PI);
  } else {
    // 4. dissolve [0.88, 1.00)
    stage = 'dissolve';
    stageProgress = (cycleProgress - 0.88) / 0.12;
    uMaterializeAlpha = 1.0 - 0.82 * smoothstep(0.0, 1.0, stageProgress);
    uClimaxFlash = 0.0;
  }

  return {
    cycleProgress,
    stage,
    stageProgress,
    uMaterializeAlpha,
    uClimaxFlash,
  };
}

// ============================================================================
// Holographic Shader Factories (ticket-001.md §4)
// ============================================================================

/**
 * Creates custom Hologram Surface ShaderMaterial with pod-local spatial scanlines,
 * view-dependent Fresnel rim glow, phase flicker, and Additive Blending.
 */
export function createPodHologramSurfaceMaterial(options = {}) {
  const {
    coreColor = HOLO_POD_PALETTE.coreDeep,
    midColor = HOLO_POD_PALETTE.midWireLow,
    highColor = HOLO_POD_PALETTE.highPulseGold,
    baseAlpha = 0.85,
    scanFrequency = 24.0,
    scanSpeed = 2.8,
    fresnelExponent = 2.2,
    podPhaseOffset = 0.0,
    side = THREE.FrontSide,
    applyStencilReject = null,
  } = options;

  const material = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0.0 },
      uPodPhaseOffset: { value: podPhaseOffset },
      uScanFrequency: { value: scanFrequency },
      uScanSpeed: { value: scanSpeed },
      uFresnelExponent: { value: fresnelExponent },
      uInterferenceBoost: { value: 0.0 },
      uPhaseJitter: { value: 0.0 },
      uInterference: { value: 0.0 },
      uWalkGlitch: { value: 0.0 },
      uGlitchClockHz: { value: 34.0 },
      uMaxSliceOffset: { value: 0.068 },
      uMaxVerticalJitter: { value: 0.015 },
      uMaterializeAlpha: { value: 1.0 },
      uClimaxFlash: { value: 0.0 },
      uBaseAlpha: { value: baseAlpha },
      uCoreColor: { value: new THREE.Color(coreColor) },
      uMidColor: { value: new THREE.Color(midColor) },
      uHighColor: { value: new THREE.Color(highColor) },
    },
    vertexShader: `
      uniform float uTime;
      uniform float uPodPhaseOffset;
      uniform float uInterferenceBoost;
      uniform float uPhaseJitter;
      uniform float uInterference;
      uniform float uWalkGlitch;
      uniform float uGlitchClockHz;
      uniform float uMaxSliceOffset;
      uniform float uMaxVerticalJitter;

      #ifdef USE_INSTANCING
      attribute vec4 aInstanceState;
      #endif

      varying vec3 vLocalPos;
      varying vec3 vWorldPos;
      varying vec3 vViewNormal;
      varying vec3 vViewDir;
      varying vec2 vUv;
      varying vec4 vInstanceState;

      void main() {
        vUv = uv;
        #ifdef USE_INSTANCING
        vInstanceState = aInstanceState;
        vec4 localPos4 = instanceMatrix * vec4(position, 1.0);
        vec3 transformedPos = localPos4.xyz;
        #else
        vInstanceState = vec4(0.0, 0.0, 1.0, 1.0);
        vec3 transformedPos = position;
        #endif

        vLocalPos = transformedPos;
        vec4 worldPos = modelMatrix * vec4(transformedPos, 1.0);

        float gEff = clamp(max(max(uInterference, uInterferenceBoost), uWalkGlitch), 0.0, 1.0);
        if (gEff > 0.001) {
          float glitchTick = floor(uTime * uGlitchClockHz);
          float bandDensity = mix(10.0, 16.0, gEff);
          float sliceBand = floor((worldPos.y + 4.0) * bandDensity + fract(glitchTick * 0.173));
          float sliceHashX = fract(sin(sliceBand * 127.1 + glitchTick * 311.7) * 43758.5453);
          float sliceHashZ = fract(sin(sliceBand * 269.5 + glitchTick * 183.3) * 43758.5453);
          float activeMask = step(0.26 - 0.14 * gEff, sliceHashX);
          float signedX = (sliceHashX * 2.0 - 1.0) * activeMask;
          float signedZ = (sliceHashZ * 2.0 - 1.0) * activeMask;
          worldPos.x += signedX * uMaxSliceOffset * gEff;
          worldPos.z += signedZ * (uMaxSliceOffset * 0.65) * gEff;
          float vJitterHash = fract(sin((sliceBand + 7.0) * 91.7 + glitchTick * 419.2) * 43758.5453);
          worldPos.y += (vJitterHash * 2.0 - 1.0) * uMaxVerticalJitter * gEff;
        }

        vWorldPos = worldPos.xyz;

        #ifdef USE_INSTANCING
        mat3 normalMatrixInst = mat3(modelViewMatrix * instanceMatrix);
        vViewNormal = normalize(normalMatrixInst * normal);
        #else
        vViewNormal = normalize(normalMatrix * normal);
        #endif

        vec4 mvPos = viewMatrix * worldPos;
        vViewDir = normalize(-mvPos.xyz);

        gl_Position = projectionMatrix * mvPos;
      }
    `,
    fragmentShader: `
      uniform float uTime;
      uniform float uPodPhaseOffset;
      uniform float uScanFrequency;
      uniform float uScanSpeed;
      uniform float uFresnelExponent;
      uniform float uInterferenceBoost;
      uniform float uPhaseJitter;
      uniform float uInterference;
      uniform float uWalkGlitch;
      uniform float uGlitchClockHz;
      uniform float uMaterializeAlpha;
      uniform float uClimaxFlash;
      uniform vec3 uCoreColor;
      uniform vec3 uMidColor;
      uniform vec3 uHighColor;
      uniform float uBaseAlpha;

      varying vec3 vLocalPos;
      varying vec3 vWorldPos;
      varying vec3 vViewNormal;
      varying vec3 vViewDir;
      varying vec2 vUv;
      varying vec4 vInstanceState;

      void main() {
        float gEff = clamp(max(max(uInterference, uInterferenceBoost), uWalkGlitch), 0.0, 1.0);
        float glitchTick = floor(uTime * uGlitchClockHz);
        float bandId = floor(vWorldPos.y * 14.0 + glitchTick * 0.31);
        float phaseJump = (fract(sin(bandId * 93.17 + glitchTick * 211.9) * 43758.5453) - 0.5) * 6.28318 * gEff;
        float activeScanFreq = mix(uScanFrequency, 235.0, gEff);
        float effScanSpeed = uScanSpeed * (1.0 + 2.2 * gEff);

        float baseScanBand = 0.5 + 0.5 * sin(vLocalPos.y * uScanFrequency - uTime * effScanSpeed + uPhaseJitter);
        float scanBand = mix(baseScanBand, 0.76 + 0.24 * sin(vWorldPos.y * activeScanFreq - uTime * (effScanSpeed * 2.0) + phaseJump + uPhaseJitter), gEff);
        float fineScan = 0.5 + 0.5 * sin(vLocalPos.y * (uScanFrequency * 3.5) - uTime * (effScanSpeed * 2.2));
        float microComb = 1.0 - (0.32 * gEff) * step(0.55, sin(vWorldPos.y * 255.0 + phaseJump * 1.7));
        scanBand *= microComb;

        float ndotv = clamp(abs(dot(normalize(vViewNormal), normalize(vViewDir))), 0.0, 1.0);
        float fresnel = pow(1.0 - ndotv, uFresnelExponent) * (1.0 + 1.25 * gEff);

        float hum = 0.92 + 0.08 * sin(uTime * 19.5 + vLocalPos.y * 11.0 + uPodPhaseOffset);
        float jitterFlicker = 1.0 - 0.18 * gEff * step(0.65, fract(sin(floor(uTime * 42.0) * 12.9898) * 43758.5453));

        float h1 = sin(uTime * 113.097);
        float h2 = sin(uTime * 270.177 + 1.13);
        float h3 = cos(uTime * 446.106 + 2.41);
        float harmonicWave = 0.5 + 0.5 * (0.45 * h1 + 0.35 * h2 + 0.20 * h3);
        float sputterGain = mix(1.0, mix(0.32, 1.68, harmonicWave), gEff);

        vec3 hotGold = vec3(1.0, 0.82, 0.40);          // #FFD166
        vec3 incandescentCore = vec3(1.0, 0.953, 0.769); // #FFF3C4

        vec3 col = mix(uCoreColor, uMidColor, clamp(fresnel * 0.75 + scanBand * 0.25, 0.0, 1.0));
        col = mix(col, uHighColor, clamp(pow(fresnel, 1.6) * 0.7 + uClimaxFlash * 0.9 + vInstanceState.x * 0.8, 0.0, 1.0));
        float overloadMix = clamp(gEff * (0.55 + 0.45 * fresnel), 0.0, 1.0);
        col = mix(col, hotGold, overloadMix * 0.65);
        col += incandescentCore * (fresnel * gEff * 0.85);
        col *= sputterGain;

        float alphaBase = (uBaseAlpha * (0.35 + 0.65 * fresnel) * (0.65 + 0.35 * scanBand) * (0.8 + 0.2 * fineScan) + uClimaxFlash * 0.6 + vInstanceState.x * 0.4)
                          * uMaterializeAlpha * hum * jitterFlicker * vInstanceState.w;
        float alphaFloor = mix(uBaseAlpha * 0.25, 0.24, gEff);
        float alpha = clamp(alphaBase * mix(1.0, 0.55 + 0.75 * harmonicWave, gEff), alphaFloor, 1.0);

        gl_FragColor = vec4(col * alpha, alpha);
      }
    `,
    transparent: true,
    depthTest: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side,
  });

  if (applyStencilReject) {
    applyStencilReject(material);
  }
  return material;
}

/**
 * Creates custom Hologram Line ShaderMaterial for LineSegments / LineLoop.
 */
export function createPodHologramLineMaterial(options = {}) {
  const {
    lineColor = HOLO_POD_PALETTE.midWireLow,
    pulseColor = HOLO_POD_PALETTE.highPulseGold,
    baseAlpha = 0.75,
    dashFrequency = 22.0,
    dashSpeed = 3.5,
    scanFrequency = 20.0,
    scanSpeed = 2.4,
    pulseSharpness = 48.0,
    podPhaseOffset = 0.0,
    applyStencilReject = null,
  } = options;

  const material = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0.0 },
      uPodPhaseOffset: { value: podPhaseOffset },
      uDashFrequency: { value: dashFrequency },
      uDashSpeed: { value: dashSpeed },
      uPulseProgress: { value: 0.0 },
      uPulseSharpness: { value: pulseSharpness },
      uScanFrequency: { value: scanFrequency },
      uScanSpeed: { value: scanSpeed },
      uInterferenceBoost: { value: 0.0 },
      uPhaseJitter: { value: 0.0 },
      uInterference: { value: 0.0 },
      uWalkGlitch: { value: 0.0 },
      uGlitchClockHz: { value: 34.0 },
      uMaxSliceOffset: { value: 0.068 },
      uMaxVerticalJitter: { value: 0.015 },
      uMaterializeAlpha: { value: 1.0 },
      uClimaxFlash: { value: 0.0 },
      uBaseAlpha: { value: baseAlpha },
      uLineColor: { value: new THREE.Color(lineColor) },
      uPulseColor: { value: new THREE.Color(pulseColor) },
    },
    vertexShader: `
      attribute vec4 aLineMetric;
      varying vec4 vLineMetric;
      varying vec3 vLocalPos;
      varying vec3 vWorldPos;

      uniform float uTime;
      uniform float uInterference;
      uniform float uInterferenceBoost;
      uniform float uWalkGlitch;
      uniform float uGlitchClockHz;
      uniform float uMaxSliceOffset;
      uniform float uMaxVerticalJitter;

      void main() {
        vLineMetric = aLineMetric;
        vLocalPos = position;
        vec4 worldPos = modelMatrix * vec4(position, 1.0);

        float gEff = clamp(max(max(uInterference, uInterferenceBoost), uWalkGlitch), 0.0, 1.0);
        if (gEff > 0.001) {
          float glitchTick = floor(uTime * uGlitchClockHz);
          float bandDensity = mix(10.0, 16.0, gEff);
          float sliceBand = floor((worldPos.y + 4.0) * bandDensity + fract(glitchTick * 0.173));
          float sliceHashX = fract(sin(sliceBand * 127.1 + glitchTick * 311.7) * 43758.5453);
          float sliceHashZ = fract(sin(sliceBand * 269.5 + glitchTick * 183.3) * 43758.5453);
          float activeMask = step(0.26 - 0.14 * gEff, sliceHashX);
          float signedX = (sliceHashX * 2.0 - 1.0) * activeMask;
          float signedZ = (sliceHashZ * 2.0 - 1.0) * activeMask;
          worldPos.x += signedX * uMaxSliceOffset * gEff;
          worldPos.z += signedZ * (uMaxSliceOffset * 0.65) * gEff;
          float vJitterHash = fract(sin((sliceBand + 7.0) * 91.7 + glitchTick * 419.2) * 43758.5453);
          worldPos.y += (vJitterHash * 2.0 - 1.0) * uMaxVerticalJitter * gEff;
        }

        vWorldPos = worldPos.xyz;
        gl_Position = projectionMatrix * viewMatrix * worldPos;
      }
    `,
    fragmentShader: `
      uniform float uTime;
      uniform float uPodPhaseOffset;
      uniform float uDashFrequency;
      uniform float uDashSpeed;
      uniform float uPulseProgress;
      uniform float uPulseSharpness;
      uniform float uScanFrequency;
      uniform float uScanSpeed;
      uniform float uInterferenceBoost;
      uniform float uPhaseJitter;
      uniform float uInterference;
      uniform float uWalkGlitch;
      uniform float uGlitchClockHz;
      uniform float uMaxSliceOffset;
      uniform float uMaxVerticalJitter;
      uniform float uMaterializeAlpha;
      uniform float uClimaxFlash;
      uniform vec3 uLineColor;
      uniform vec3 uPulseColor;
      uniform float uBaseAlpha;

      varying vec4 vLineMetric;
      varying vec3 vLocalPos;
      varying vec3 vWorldPos;

      void main() {
        float along = vLineMetric.x;
        float weight = vLineMetric.y > 0.0 ? vLineMetric.y : 1.0;
        float highlight = vLineMetric.z;

        float gEff = clamp(max(max(uInterference, uInterferenceBoost), uWalkGlitch), 0.0, 1.0);
        float glitchTick = floor(uTime * uGlitchClockHz);
        float bandId = floor(vWorldPos.y * 14.0 + glitchTick * 0.31);
        float phaseJump = (fract(sin(bandId * 93.17 + glitchTick * 211.9) * 43758.5453) - 0.5) * 6.28318 * gEff;

        float effDashSpeed = uDashSpeed * (1.0 + 2.2 * gEff);
        float dash = 0.5 + 0.5 * sin(along * uDashFrequency - uTime * effDashSpeed + vLineMetric.w);
        float pulse = exp(-uPulseSharpness * pow(fract(along - uPulseProgress), 2.0));

        float activeScanFreq = mix(uScanFrequency, 235.0, gEff);
        float effScanSpeed = uScanSpeed * (1.0 + 2.0 * gEff);
        float scan = 0.7 + 0.3 * sin(vWorldPos.y * activeScanFreq - uTime * effScanSpeed + phaseJump + uPhaseJitter);

        float hum = 0.92 + 0.08 * sin(uTime * 19.5 + vLocalPos.y * 11.0 + uPodPhaseOffset);
        float jitterFlicker = 1.0 - 0.18 * gEff * step(0.65, fract(sin(floor(uTime * 42.0) * 12.9898) * 43758.5453));

        float h1 = sin(uTime * 113.097);
        float h2 = sin(uTime * 270.177 + 1.13);
        float h3 = cos(uTime * 446.106 + 2.41);
        float harmonicWave = 0.5 + 0.5 * (0.45 * h1 + 0.35 * h2 + 0.20 * h3);
        float sputterGain = mix(1.0, mix(0.32, 1.68, harmonicWave), gEff);

        vec3 hotGold = vec3(1.0, 0.82, 0.40);          // #FFD166
        vec3 incandescentCore = vec3(1.0, 0.953, 0.769); // #FFF3C4

        vec3 col = mix(uLineColor, uPulseColor, clamp(pulse * 0.8 + highlight * 0.6 + uClimaxFlash * 0.7, 0.0, 1.0));
        col = mix(col, hotGold, gEff * 0.6);
        col += incandescentCore * (gEff * 0.5 * (pulse + highlight));
        col *= sputterGain;

        float alphaBase = (uBaseAlpha * (0.35 + 0.65 * dash) * scan + pulse * 0.75 + highlight * 0.5 + uClimaxFlash * 0.5)
                          * uMaterializeAlpha * hum * jitterFlicker * (0.4 + 0.6 * weight);
        float alphaFloor = mix(uBaseAlpha * 0.25, 0.22, gEff);
        float alpha = clamp(alphaBase * mix(1.0, 0.55 + 0.75 * harmonicWave, gEff), alphaFloor, 1.0);
        gl_FragColor = vec4(col * alpha, alpha);
      }
    `,
    transparent: true,
    depthTest: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });

  if (applyStencilReject) {
    applyStencilReject(material);
  }
  return material;
}

/**
 * Creates custom Smoked-Glass Core ShaderMaterial (#1a0a00 to #2b1200 translucent fill).
 */
export function createPodSmokedCoreMaterial(options = {}) {
  const {
    coreColor = HOLO_POD_PALETTE.coreDeep,
    opacity = 0.42,
    applyStencilReject = null,
  } = options;

  const material = new THREE.ShaderMaterial({
    uniforms: {
      uCoreColor: { value: new THREE.Color(coreColor) },
      uOpacity: { value: opacity },
      uMaterializeAlpha: { value: 1.0 },
      uTime: { value: 0.0 },
      uInterference: { value: 0.0 },
      uInterferenceBoost: { value: 0.0 },
      uWalkGlitch: { value: 0.0 },
      uGlitchClockHz: { value: 34.0 },
      uMaxSliceOffset: { value: 0.068 },
      uMaxVerticalJitter: { value: 0.015 },
    },
    vertexShader: `
      uniform float uTime;
      uniform float uInterference;
      uniform float uInterferenceBoost;
      uniform float uWalkGlitch;
      uniform float uGlitchClockHz;
      uniform float uMaxSliceOffset;
      uniform float uMaxVerticalJitter;

      varying vec3 vViewNormal;
      varying vec3 vViewDir;
      varying vec3 vLocalPos;
      varying vec3 vWorldPos;

      void main() {
        vLocalPos = position;
        vec4 worldPos = modelMatrix * vec4(position, 1.0);

        float gEff = clamp(max(max(uInterference, uInterferenceBoost), uWalkGlitch), 0.0, 1.0);
        if (gEff > 0.001) {
          float glitchTick = floor(uTime * uGlitchClockHz);
          float bandDensity = mix(10.0, 16.0, gEff);
          float sliceBand = floor((worldPos.y + 4.0) * bandDensity + fract(glitchTick * 0.173));
          float sliceHashX = fract(sin(sliceBand * 127.1 + glitchTick * 311.7) * 43758.5453);
          float sliceHashZ = fract(sin(sliceBand * 269.5 + glitchTick * 183.3) * 43758.5453);
          float activeMask = step(0.26 - 0.14 * gEff, sliceHashX);
          float signedX = (sliceHashX * 2.0 - 1.0) * activeMask;
          float signedZ = (sliceHashZ * 2.0 - 1.0) * activeMask;
          worldPos.x += signedX * uMaxSliceOffset * gEff;
          worldPos.z += signedZ * (uMaxSliceOffset * 0.65) * gEff;
          float vJitterHash = fract(sin((sliceBand + 7.0) * 91.7 + glitchTick * 419.2) * 43758.5453);
          worldPos.y += (vJitterHash * 2.0 - 1.0) * uMaxVerticalJitter * gEff;
        }

        vWorldPos = worldPos.xyz;
        vec4 mvPos = viewMatrix * worldPos;
        vViewNormal = normalize(normalMatrix * normal);
        vViewDir = normalize(-mvPos.xyz);
        gl_Position = projectionMatrix * mvPos;
      }
    `,
    fragmentShader: `
      uniform vec3 uCoreColor;
      uniform float uOpacity;
      uniform float uMaterializeAlpha;
      uniform float uTime;
      uniform float uInterference;
      uniform float uInterferenceBoost;
      uniform float uWalkGlitch;
      uniform float uGlitchClockHz;

      varying vec3 vViewNormal;
      varying vec3 vViewDir;
      varying vec3 vLocalPos;
      varying vec3 vWorldPos;

      void main() {
        float gEff = clamp(max(max(uInterference, uInterferenceBoost), uWalkGlitch), 0.0, 1.0);
        float ndotv = clamp(abs(dot(normalize(vViewNormal), normalize(vViewDir))), 0.0, 1.0);
        float rim = pow(1.0 - ndotv, 2.0) * (1.0 + 1.2 * gEff);

        float h1 = sin(uTime * 113.097);
        float h2 = sin(uTime * 270.177 + 1.13);
        float h3 = cos(uTime * 446.106 + 2.41);
        float harmonicWave = 0.5 + 0.5 * (0.45 * h1 + 0.35 * h2 + 0.20 * h3);
        float sputterGain = mix(1.0, mix(0.35, 1.65, harmonicWave), gEff);

        vec3 hotGold = vec3(1.0, 0.82, 0.40);
        vec3 col = mix(uCoreColor, hotGold, gEff * 0.45 * rim) * sputterGain;

        float alphaFloor = mix(uOpacity * 0.3, 0.20, gEff);
        float alpha = clamp(uOpacity * (0.6 + 0.4 * rim) * uMaterializeAlpha * mix(1.0, 0.6 + 0.6 * harmonicWave, gEff), alphaFloor, 1.0);
        gl_FragColor = vec4(col * alpha, alpha);
      }
    `,
    transparent: true,
    depthTest: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
  });

  if (applyStencilReject) {
    applyStencilReject(material);
  }
  return material;
}

/**
 * Creates Emitter Ring / Calibration Brackets and Diffused Volumetric Light Envelope (ticket-001.md §5).
 */
export function createPodEmitterAndAura(podId, radius = 0.38, applyStencilReject = null) {
  const emitterGroup = new THREE.Group();
  emitterGroup.name = `EmitterGroup_${podId}`;

  // 1. Lower wireframe emitter ring at local y = -0.38
  const lowerRingGeo = new THREE.RingGeometry(0.32, 0.36, 32);
  const lowerRingEdges = new THREE.EdgesGeometry(lowerRingGeo);
  const ringMetric = new Float32Array(lowerRingEdges.attributes.position.count * 4);
  for (let i = 0; i < lowerRingEdges.attributes.position.count; i++) {
    ringMetric[i * 4 + 0] = (i % 32) / 32.0;
    ringMetric[i * 4 + 1] = 1.0;
    ringMetric[i * 4 + 2] = 0.0;
    ringMetric[i * 4 + 3] = 0.0;
  }
  lowerRingEdges.setAttribute('aLineMetric', new THREE.BufferAttribute(ringMetric, 4));

  const ringMat = createPodHologramLineMaterial({
    lineColor: HOLO_POD_PALETTE.midWireLow,
    pulseColor: HOLO_POD_PALETTE.highPulseGold,
    baseAlpha: 0.70,
    dashFrequency: 16.0,
    dashSpeed: 2.0,
    applyStencilReject,
  });

  const lowerRingMesh = new THREE.LineSegments(lowerRingEdges, ringMat);
  lowerRingMesh.rotation.x = Math.PI / 2;
  lowerRingMesh.position.y = -0.38;
  emitterGroup.add(lowerRingMesh);

  // 4 Cardinal calibration bracket ticks at base
  const tickGeo = new THREE.BufferGeometry();
  const tickPositions = new Float32Array([
    -0.38, -0.38, 0,  -0.34, -0.38, 0,
     0.34, -0.38, 0,   0.38, -0.38, 0,
     0, -0.38, -0.38,  0, -0.38, -0.34,
     0, -0.38,  0.34,  0, -0.38,  0.38,
    // Upper calibration corner brackets at y = +0.38
    -0.28,  0.38, -0.28, -0.24,  0.38, -0.28,
     0.24,  0.38, -0.28,  0.28,  0.38, -0.28,
    -0.28,  0.38,  0.28, -0.24,  0.38,  0.28,
     0.24,  0.38,  0.28,  0.28,  0.38,  0.28,
  ]);
  const tickMetrics = new Float32Array(tickPositions.length / 3 * 4);
  for (let i = 0; i < tickPositions.length / 3; i++) {
    tickMetrics[i * 4 + 0] = (i % 2);
    tickMetrics[i * 4 + 1] = 1.0;
    tickMetrics[i * 4 + 2] = 0.5;
    tickMetrics[i * 4 + 3] = 0.0;
  }
  tickGeo.setAttribute('position', new THREE.BufferAttribute(tickPositions, 3));
  tickGeo.setAttribute('aLineMetric', new THREE.BufferAttribute(tickMetrics, 4));
  const tickMesh = new THREE.LineSegments(tickGeo, ringMat);
  emitterGroup.add(tickMesh);

  // 2. Diffused Volumetric Light Envelope (non-conical radial-ellipsoidal aura)
  const auraGeo = new THREE.SphereGeometry(0.56, 16, 12);
  const auraMat = new THREE.ShaderMaterial({
    uniforms: {
      uCoreColor: { value: new THREE.Color(HOLO_POD_PALETTE.highEmissive) },
      uOuterColor: { value: new THREE.Color(HOLO_POD_PALETTE.midWireLow) },
      uMaterializeAlpha: { value: 1.0 },
      uIntensity: { value: 0.85 },
      uTime: { value: 0.0 },
      uInterference: { value: 0.0 },
      uInterferenceBoost: { value: 0.0 },
      uWalkGlitch: { value: 0.0 },
      uGlitchClockHz: { value: 34.0 },
    },
    vertexShader: `
      varying vec3 vLocalPos;
      varying vec3 vViewNormal;
      varying vec3 vViewDir;

      void main() {
        vLocalPos = position;
        vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
        vViewNormal = normalize(normalMatrix * normal);
        vViewDir = normalize(-mvPos.xyz);
        gl_Position = projectionMatrix * mvPos;
      }
    `,
    fragmentShader: `
      uniform vec3 uCoreColor;
      uniform vec3 uOuterColor;
      uniform float uMaterializeAlpha;
      uniform float uIntensity;
      uniform float uTime;
      uniform float uInterference;
      uniform float uInterferenceBoost;
      uniform float uWalkGlitch;
      uniform float uGlitchClockHz;

      varying vec3 vLocalPos;
      varying vec3 vViewNormal;
      varying vec3 vViewDir;

      void main() {
        float r = length(vLocalPos) / 0.56;
        float falloff = exp(-2.85 * r * r);
        float edgeDim = smoothstep(1.0, 0.2, r);

        float gEff = clamp(max(max(uInterference, uInterferenceBoost), uWalkGlitch), 0.0, 1.0);
        float flutter = 1.0 + 0.48 * gEff * sin(uTime * 43.0);

        vec3 col = mix(uOuterColor, uCoreColor, falloff);
        float alpha = uIntensity * falloff * edgeDim * uMaterializeAlpha * 0.35 * flutter;
        gl_FragColor = vec4(col * alpha, alpha);
      }
    `,
    transparent: true,
    depthTest: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.BackSide,
  });

  if (applyStencilReject) {
    applyStencilReject(auraMat);
  }

  const auraMesh = new THREE.Mesh(auraGeo, auraMat);
  auraMesh.name = `Aura_${podId}`;
  auraMesh.scale.set(1.05, 0.95, 1.05);
  auraMesh.renderOrder = 11;
  auraMesh.raycast = () => {}; // non-interactive

  return {
    emitterGroup,
    auraMesh,
    ringMat,
    auraMat,
  };
}

// ============================================================================
// Procedural Hologram Text & Glyph Atlas Subsystem (ticket-003.md)
// ============================================================================

/**
 * Creates 1024x1024 HTML5 Canvas neon amber glyph atlas texture.
 * Divided into a 4x4 grid of 256x256 tiles.
 */
export function createHologramGlyphAtlas() {
  const width = 1024;
  const height = 1024;
  let canvas;
  let isHeadless = false;

  if (typeof document !== 'undefined' && document.createElement) {
    canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
  } else {
    isHeadless = true;
    // Headless mock canvas for Node.js test environment
    canvas = {
      width,
      height,
      getContext: () => ({
        clearRect: () => {},
        fillRect: () => {},
        beginPath: () => {},
        arc: () => {},
        stroke: () => {},
        fill: () => {},
        fillText: () => {},
        strokeText: () => {},
        measureText: () => ({ width: 40 }),
        createRadialGradient: () => ({ addColorStop: () => {} }),
        createLinearGradient: () => ({ addColorStop: () => {} }),
        setLineDash: () => {},
      }),
      addEventListener: () => {},
      removeEventListener: () => {},
    };
  }

  const ctx = canvas.getContext('2d');
  if (!isHeadless && ctx) {
    ctx.clearRect(0, 0, width, height);

    // Helper to draw tile content
    const tileSize = 256;
    const drawTile = (col, row, renderFn) => {
      ctx.save();
      ctx.translate(col * tileSize, row * tileSize);
      renderFn(ctx, tileSize);
      ctx.restore();
    };

    // Tile (0, 0): '0' Binary Glyph
    drawTile(0, 0, (c, s) => {
      c.textAlign = 'center';
      c.textBaseline = 'middle';
      c.font = 'bold 150px monospace';
      c.shadowColor = HOLO_POD_PALETTE.highEmissiveStr;
      c.shadowBlur = 18;
      c.fillStyle = HOLO_POD_PALETTE.highPulseGoldStr;
      c.fillText('0', s * 0.5, s * 0.52);
      c.strokeStyle = HOLO_POD_PALETTE.midWireHighStr;
      c.lineWidth = 4;
      c.strokeText('0', s * 0.5, s * 0.52);
    });

    // Tile (1, 0): '1' Binary Glyph
    drawTile(1, 0, (c, s) => {
      c.textAlign = 'center';
      c.textBaseline = 'middle';
      c.font = 'bold 150px monospace';
      c.shadowColor = HOLO_POD_PALETTE.highPulseGoldStr;
      c.shadowBlur = 24;
      c.fillStyle = '#ffffff';
      c.fillText('1', s * 0.5, s * 0.52);
      c.shadowColor = HOLO_POD_PALETTE.highEmissiveStr;
      c.shadowBlur = 12;
      c.fillStyle = HOLO_POD_PALETTE.highPulseGoldStr;
      c.fillText('1', s * 0.5, s * 0.52);
    });

    // 5 Poker Cards: A♠, K♥, Q♦, J♣, 10♠
    const pokerCards = [
      { col: 2, row: 0, rank: 'A', suit: '♠' },
      { col: 3, row: 0, rank: 'K', suit: '♥' },
      { col: 0, row: 1, rank: 'Q', suit: '♦' },
      { col: 1, row: 1, rank: 'J', suit: '♣' },
      { col: 2, row: 1, rank: '10', suit: '♠' },
    ];

    pokerCards.forEach(({ col, row, rank, suit }) => {
      drawTile(col, row, (c, s) => {
        // Border frame
        c.strokeStyle = HOLO_POD_PALETTE.midWireHighStr;
        c.lineWidth = 5;
        c.strokeRect(16, 16, s - 32, s - 32);

        // Reticle ticks
        c.strokeStyle = HOLO_POD_PALETTE.highPulseGoldStr;
        c.lineWidth = 2;
        c.beginPath();
        c.moveTo(s * 0.5 - 12, s * 0.5); c.lineTo(s * 0.5 + 12, s * 0.5);
        c.moveTo(s * 0.5, s * 0.5 - 12); c.lineTo(s * 0.5, s * 0.5 + 12);
        c.stroke();

        // Corner rank + suit
        c.font = 'bold 36px monospace';
        c.fillStyle = HOLO_POD_PALETTE.highPulseGoldStr;
        c.textAlign = 'left';
        c.fillText(`${rank}${suit}`, 28, 56);
        c.textAlign = 'right';
        c.fillText(`${rank}${suit}`, s - 28, s - 36);

        // Center Suit Emblem
        c.font = 'bold 84px serif';
        c.textAlign = 'center';
        c.textBaseline = 'middle';
        c.shadowColor = HOLO_POD_PALETTE.highEmissiveStr;
        c.shadowBlur = 18;
        c.fillText(suit, s * 0.5, s * 0.5);
      });
    });

    // Tile (3, 1): Anomaly Quarantine HUD Readout
    drawTile(3, 1, (c, s) => {
      c.strokeStyle = HOLO_POD_PALETTE.highPulseGoldStr;
      c.lineWidth = 4;
      c.strokeRect(20, 20, s - 40, s - 40);
      c.font = 'bold 22px monospace';
      c.fillStyle = HOLO_POD_PALETTE.highPulseGoldStr;
      c.textAlign = 'center';
      c.fillText('ANOMALY DETECTED', s * 0.5, 60);
      c.font = 'bold 32px monospace';
      c.fillText('Z > 3.8σ [LOCK]', s * 0.5, 115);
      c.font = '18px monospace';
      c.fillStyle = HOLO_POD_PALETTE.midWireHighStr;
      c.fillText('QUARANTINE ACTIVE', s * 0.5, 165);
      c.fillText('FREQ: 142.8 GHz', s * 0.5, 200);
    });

    // Tile (0, 2): Anomaly Purge Status Readout
    drawTile(0, 2, (c, s) => {
      c.strokeStyle = HOLO_POD_PALETTE.highPulseGoldStr;
      c.lineWidth = 4;
      c.strokeRect(20, 20, s - 40, s - 40);
      c.font = 'bold 24px monospace';
      c.fillStyle = HOLO_POD_PALETTE.highPulseGoldStr;
      c.textAlign = 'center';
      c.fillText('PURGE SEQUENCE', s * 0.5, 75);
      c.font = 'bold 36px monospace';
      c.fillText('STATUS: ACTIVE', s * 0.5, 135);
      c.font = '18px monospace';
      c.fillStyle = HOLO_POD_PALETTE.midWireLowStr;
      c.fillText('SPARK DISPERSAL: 100%', s * 0.5, 190);
    });

    // Tile (1, 2): Poker EV HUD Readout
    drawTile(1, 2, (c, s) => {
      c.strokeStyle = HOLO_POD_PALETTE.midWireHighStr;
      c.lineWidth = 3;
      c.strokeRect(16, 28, s - 32, s - 56);
      c.font = 'bold 22px monospace';
      c.fillStyle = HOLO_POD_PALETTE.midWireHighStr;
      c.textAlign = 'center';
      c.fillText('CFR GAME-THEORY HUD', s * 0.5, 70);
      c.font = 'bold 32px monospace';
      c.fillStyle = HOLO_POD_PALETTE.highPulseGoldStr;
      c.shadowColor = HOLO_POD_PALETTE.highEmissiveStr;
      c.shadowBlur = 14;
      c.fillText('EV: +4.82 BB', s * 0.5, 125);
      c.font = 'bold 20px monospace';
      c.fillStyle = '#ffffff';
      c.fillText('STRATEGY: RAISE ★', s * 0.5, 175);
    });

    // Decision-Tree Action Branch Labels: FOLD, CALL, RAISE ★
    const actionLabels = [
      { col: 2, row: 2, text: 'FOLD', sub: 'EV -1.00 BB' },
      { col: 3, row: 2, text: 'CALL', sub: 'EV +0.65 BB' },
      { col: 0, row: 3, text: 'RAISE ★', sub: 'EV +4.82 BB' },
    ];
    actionLabels.forEach(({ col, row, text, sub }) => {
      drawTile(col, row, (c, s) => {
        c.strokeStyle = HOLO_POD_PALETTE.midWireLowStr;
        c.lineWidth = 3;
        c.strokeRect(20, 40, s - 40, s - 80);
        c.font = 'bold 38px monospace';
        c.fillStyle = text.includes('★') ? HOLO_POD_PALETTE.highPulseGoldStr : HOLO_POD_PALETTE.midWireHighStr;
        c.textAlign = 'center';
        c.fillText(text, s * 0.5, s * 0.48);
        c.font = '20px monospace';
        c.fillStyle = HOLO_POD_PALETTE.midWireLowStr;
        c.fillText(sub, s * 0.5, s * 0.72);
      });
    });
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.anisotropy = 4;

  // Compute UV rects for 4x4 grid (uOffset, vOffset, uScale, vScale)
  // In Three.js CanvasTexture with flipY: true (default), row 0 is top of canvas -> vOffset = 0.75
  const getCellRect = (col, row) => {
    const uOffset = col * 0.25;
    const vOffset = (3 - row) * 0.25;
    return [uOffset, vOffset, 0.25, 0.25];
  };

  const cells = {
    zero: getCellRect(0, 0),
    one: getCellRect(1, 0),
    cardAceSpades: getCellRect(2, 0),
    cardKingHearts: getCellRect(3, 0),
    cardQueenDiamonds: getCellRect(0, 1),
    cardJackClubs: getCellRect(1, 1),
    cardTenSpades: getCellRect(2, 1),
    anomalyHUD: getCellRect(3, 1),
    anomalyPurge: getCellRect(0, 2),
    pokerEVHUD: getCellRect(1, 2),
    actionFold: getCellRect(2, 2),
    actionCall: getCellRect(3, 2),
    actionRaise: getCellRect(0, 3),
  };

  return {
    canvas,
    texture,
    cells,
    getCellRect,
  };
}

/**
 * Creates custom ShaderMaterial for glyph quads / InstancedMesh glyphs.
 */
export function createPodGlyphMaterial(options = {}) {
  const {
    atlasTexture,
    scanFrequency = 55.0,
    scanSpeed = 8.0,
    dimColor = HOLO_POD_PALETTE.midWireLow,
    bloomColor = HOLO_POD_PALETTE.highPulseGold,
    applyStencilReject = null,
  } = options;

  const material = new THREE.ShaderMaterial({
    uniforms: {
      uAtlasTexture: { value: atlasTexture },
      uTime: { value: 0.0 },
      uScanFrequency: { value: scanFrequency },
      uScanSpeed: { value: scanSpeed },
      uInterferenceBoost: { value: 0.0 },
      uInterference: { value: 0.0 },
      uWalkGlitch: { value: 0.0 },
      uGlitchClockHz: { value: 34.0 },
      uMaxSliceOffset: { value: 0.068 },
      uMaxVerticalJitter: { value: 0.015 },
      uMaterializeAlpha: { value: 1.0 },
      uClimaxFlash: { value: 0.0 },
      uDimColor: { value: new THREE.Color(dimColor) },
      uBloomColor: { value: new THREE.Color(bloomColor) },
      uUvRect: { value: new THREE.Vector4(0, 0, 1, 1) },
      uGlyphState: { value: new THREE.Vector4(0, 0, 1, 1) },
    },
    vertexShader: `
      #ifdef USE_INSTANCING
      attribute vec4 aUvRect;
      attribute vec4 aGlyphState;
      varying vec4 vGlyphState;
      #else
      uniform vec4 uUvRect;
      uniform vec4 uGlyphState;
      varying vec4 vGlyphState;
      #endif

      uniform float uTime;
      uniform float uInterference;
      uniform float uInterferenceBoost;
      uniform float uWalkGlitch;
      uniform float uGlitchClockHz;
      uniform float uMaxSliceOffset;
      uniform float uMaxVerticalJitter;

      varying vec2 vAtlasUv;
      varying vec3 vLocalPos;
      varying vec3 vWorldPos;

      void main() {
        #ifdef USE_INSTANCING
        vGlyphState = aGlyphState;
        vAtlasUv = aUvRect.xy + uv * aUvRect.zw;
        vec4 localPos4 = instanceMatrix * vec4(position, 1.0);
        vLocalPos = localPos4.xyz;
        vec4 worldPos = modelMatrix * localPos4;
        #else
        vGlyphState = uGlyphState;
        vAtlasUv = uUvRect.xy + uv * uUvRect.zw;
        vLocalPos = position;
        vec4 worldPos = modelMatrix * vec4(position, 1.0);
        #endif

        float gEff = clamp(max(max(uInterference, uInterferenceBoost), uWalkGlitch), 0.0, 1.0);
        if (gEff > 0.001) {
          float glitchTick = floor(uTime * uGlitchClockHz);
          float bandDensity = mix(10.0, 16.0, gEff);
          float sliceBand = floor((worldPos.y + 4.0) * bandDensity + fract(glitchTick * 0.173));
          float sliceHashX = fract(sin(sliceBand * 127.1 + glitchTick * 311.7) * 43758.5453);
          float sliceHashZ = fract(sin(sliceBand * 269.5 + glitchTick * 183.3) * 43758.5453);
          float activeMask = step(0.26 - 0.14 * gEff, sliceHashX);
          float signedX = (sliceHashX * 2.0 - 1.0) * activeMask;
          float signedZ = (sliceHashZ * 2.0 - 1.0) * activeMask;
          worldPos.x += signedX * uMaxSliceOffset * gEff;
          worldPos.z += signedZ * (uMaxSliceOffset * 0.65) * gEff;
          float vJitterHash = fract(sin((sliceBand + 7.0) * 91.7 + glitchTick * 419.2) * 43758.5453);
          worldPos.y += (vJitterHash * 2.0 - 1.0) * uMaxVerticalJitter * gEff;
        }

        vWorldPos = worldPos.xyz;
        gl_Position = projectionMatrix * viewMatrix * worldPos;
      }
    `,
    fragmentShader: `
      uniform sampler2D uAtlasTexture;
      uniform float uTime;
      uniform float uScanFrequency;
      uniform float uScanSpeed;
      uniform float uInterferenceBoost;
      uniform float uInterference;
      uniform float uWalkGlitch;
      uniform float uGlitchClockHz;
      uniform float uMaterializeAlpha;
      uniform float uClimaxFlash;
      uniform vec3 uDimColor;
      uniform vec3 uBloomColor;

      varying vec2 vAtlasUv;
      varying vec3 vLocalPos;
      varying vec3 vWorldPos;
      varying vec4 vGlyphState;

      void main() {
        float gEff = clamp(max(max(uInterference, uInterferenceBoost), uWalkGlitch), 0.0, 1.0);
        float glitchTick = floor(uTime * uGlitchClockHz);

        float uvTear = 0.0;
        if (gEff > 0.001) {
          float tearBand = floor(vAtlasUv.y * 32.0 + glitchTick * 0.41);
          float tearHash = fract(sin(tearBand * 173.3 + glitchTick * 281.9) * 43758.5453);
          uvTear = (tearHash * 2.0 - 1.0) * step(0.35, tearHash) * (0.015 + 0.050 * gEff);
        }
        vec2 sampleUv = vec2(vAtlasUv.x + uvTear, vAtlasUv.y);
        vec4 tex = texture2D(uAtlasTexture, sampleUv);

        float isHigh = vGlyphState.x;
        float isLocked = vGlyphState.y;
        float depthAtten = vGlyphState.z > 0.01 ? vGlyphState.z : 1.0;
        float alphaScale = vGlyphState.w > 0.01 ? vGlyphState.w : 1.0;

        float effScanSpeed = uScanSpeed * (1.0 + 2.2 * gEff);
        float scan = 0.65 + 0.35 * sin(vLocalPos.y * uScanFrequency - uTime * effScanSpeed);

        vec3 deepAmber = vec3(0.85, 0.357, 0.0);
        vec3 incandGold = vec3(1.0, 0.80, 0.30);

        vec3 tint = mix(uDimColor, uBloomColor, clamp(isHigh + isLocked * 0.7 + uClimaxFlash * 0.8, 0.0, 1.0));
        tint = mix(tint, mix(deepAmber, incandGold, 0.5 + 0.5 * sin(glitchTick)), gEff * 0.75);

        float h1 = sin(uTime * 113.097);
        float h2 = sin(uTime * 270.177 + 1.13);
        float h3 = cos(uTime * 446.106 + 2.41);
        float harmonicWave = 0.5 + 0.5 * (0.45 * h1 + 0.35 * h2 + 0.20 * h3);
        float sputterGain = mix(1.0, mix(0.35, 1.65, harmonicWave), gEff);

        vec3 col = tex.rgb * tint * (1.0 + 0.5 * isHigh + 0.8 * uClimaxFlash) * sputterGain;

        float alphaFloor = mix(0.20, 0.28, gEff);
        float alpha = clamp(tex.a * scan * depthAtten * alphaScale * uMaterializeAlpha * (0.8 + 0.2 * isHigh) * mix(1.0, 0.55 + 0.75 * harmonicWave, gEff), alphaFloor, 1.0);

        gl_FragColor = vec4(col * alpha, alpha);
      }
    `,
    transparent: true,
    depthTest: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
  });

  if (applyStencilReject) {
    applyStencilReject(material);
  }
  return material;
}

// ============================================================================
// POD 1: 3D Graph Theory Hologram (ticket-004.md §1)
// ============================================================================
export function buildGraphTheoryPod({ podSpec, floorY, applyStencilReject }) {
  const rootGroup = new THREE.Group();
  rootGroup.name = `PodGroup_${podSpec.id}`;
  rootGroup.position.set(podSpec.defaultOffset.x, floorY + podSpec.defaultOffset.yRel, podSpec.defaultOffset.z);

  const { emitterGroup, auraMesh, ringMat, auraMat } = createPodEmitterAndAura(podSpec.id, 0.38, applyStencilReject);
  rootGroup.add(emitterGroup);
  rootGroup.add(auraMesh);

  // Hit proxy for pointer raycasting
  const hitProxyMat = new THREE.MeshBasicMaterial({
    transparent: true,
    opacity: 0.0,
    depthWrite: false,
    depthTest: true,
    visible: false,
  });
  const hitProxyMesh = new THREE.Mesh(new THREE.SphereGeometry(0.56, 12, 10), hitProxyMat);
  hitProxyMesh.name = `HitProxy_${podSpec.id}`;
  hitProxyMesh.userData = { podId: podSpec.id, isMathPodProxy: true };
  rootGroup.add(hitProxyMesh);

  // 1. Spherical holographic coordinate cage (LineSegments)
  const cageSegments = [];
  const cageRadius = 0.38;
  const numCagePts = 32;
  // Equator + 2 meridians
  for (let i = 0; i < numCagePts; i++) {
    const a1 = (i / numCagePts) * Math.PI * 2;
    const a2 = ((i + 1) / numCagePts) * Math.PI * 2;
    // XZ ring
    cageSegments.push(Math.cos(a1) * cageRadius, 0, Math.sin(a1) * cageRadius);
    cageSegments.push(Math.cos(a2) * cageRadius, 0, Math.sin(a2) * cageRadius);
    // XY ring
    cageSegments.push(Math.cos(a1) * cageRadius, Math.sin(a1) * cageRadius, 0);
    cageSegments.push(Math.cos(a2) * cageRadius, Math.sin(a2) * cageRadius, 0);
    // YZ ring
    cageSegments.push(0, Math.cos(a1) * cageRadius, Math.sin(a1) * cageRadius);
    cageSegments.push(0, Math.cos(a2) * cageRadius, Math.sin(a2) * cageRadius);
  }
  const cageGeo = new THREE.BufferGeometry();
  cageGeo.setAttribute('position', new THREE.Float32BufferAttribute(cageSegments, 3));
  const cageMetrics = new Float32Array(cageSegments.length / 3 * 4);
  for (let i = 0; i < cageSegments.length / 3; i++) {
    cageMetrics[i * 4 + 0] = (i % 2);
    cageMetrics[i * 4 + 1] = 0.5;
    cageMetrics[i * 4 + 2] = 0.0;
    cageMetrics[i * 4 + 3] = 0.0;
  }
  cageGeo.setAttribute('aLineMetric', new THREE.BufferAttribute(cageMetrics, 4));
  const cageMat = createPodHologramLineMaterial({
    lineColor: HOLO_POD_PALETTE.midWireLow,
    baseAlpha: 0.38,
    dashFrequency: 14.0,
    applyStencilReject,
  });
  const cageMesh = new THREE.LineSegments(cageGeo, cageMat);
  rootGroup.add(cageMesh);

  // 2. 18 Graph nodes: icosahedral cloud positions
  const NODE_COUNT = 18;
  const cloudPositions = [];
  const phi = (1 + Math.sqrt(5)) / 2;
  const rawIco = [
    [-1,  phi, 0], [ 1,  phi, 0], [-1, -phi, 0], [ 1, -phi, 0],
    [ 0, -1,  phi], [ 0,  1,  phi], [ 0, -1, -phi], [ 0,  1, -phi],
    [ phi, 0, -1], [ phi, 0,  1], [-phi, 0, -1], [-phi, 0,  1],
  ];
  for (let i = 0; i < 12; i++) {
    const v = new THREE.Vector3(...rawIco[i]).normalize().multiplyScalar(0.26);
    cloudPositions.push(v);
  }
  // 6 inner-shell perturbed nodes
  const innerSeeds = [
    [0.12, 0.12, 0.10], [-0.12, -0.10, 0.12], [0.10, -0.12, -0.12],
    [-0.12, 0.14, -0.10], [0.0, 0.16, 0.0], [0.0, -0.16, 0.0],
  ];
  for (let i = 0; i < 6; i++) {
    cloudPositions.push(new THREE.Vector3(...innerSeeds[i]));
  }

  // Traversal path of 6 nodes
  const PATH_NODES = [0, 3, 7, 11, 14, 17];
  const collinearTargets = PATH_NODES.map((_, k) => new THREE.Vector3(-0.25 + k * 0.10, 0.22, 0.0));

  // Current node positions (animated)
  const currentPositions = cloudPositions.map(v => v.clone());

  // 3. Node Instanced Meshes
  const nodeCoreMat = createPodSmokedCoreMaterial({ coreColor: HOLO_POD_PALETTE.coreDeep, opacity: 0.5, applyStencilReject });
  const nodeCoreInstanced = new THREE.InstancedMesh(new THREE.SphereGeometry(0.018, 12, 10), nodeCoreMat, NODE_COUNT);

  const nodeShellMat = createPodHologramSurfaceMaterial({
    coreColor: HOLO_POD_PALETTE.coreShadow,
    midColor: HOLO_POD_PALETTE.midWireLow,
    highColor: HOLO_POD_PALETTE.highPulseGold,
    fresnelExponent: 2.3,
    applyStencilReject,
  });
  const nodeShellInstanced = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(0.032, 1), nodeShellMat, NODE_COUNT);
  const shellInstanceState = new Float32Array(NODE_COUNT * 4);
  for (let i = 0; i < NODE_COUNT; i++) {
    shellInstanceState[i * 4 + 0] = 0.0;
    shellInstanceState[i * 4 + 1] = 0.0;
    shellInstanceState[i * 4 + 2] = 1.0;
    shellInstanceState[i * 4 + 3] = 1.0;
  }
  nodeShellInstanced.geometry.setAttribute('aInstanceState', new THREE.BufferAttribute(shellInstanceState, 4));

  // Concentric ping rings for path nodes (6 rings)
  const pingMat = createPodHologramSurfaceMaterial({
    coreColor: HOLO_POD_PALETTE.highEmissive,
    midColor: HOLO_POD_PALETTE.highPulseGold,
    highColor: HOLO_POD_PALETTE.highPulseGold,
    baseAlpha: 0.95,
    applyStencilReject,
  });
  const pingRingInstanced = new THREE.InstancedMesh(new THREE.RingGeometry(0.028, 0.040, 20), pingMat, 6);
  const pingRingState = new Float32Array(6 * 4);
  pingRingInstanced.geometry.setAttribute('aInstanceState', new THREE.BufferAttribute(pingRingState, 4));

  // Afterimage ghosts (18 nodes * 3 slots = 54)
  const ghostMat = createPodHologramSurfaceMaterial({
    coreColor: HOLO_POD_PALETTE.coreDeep,
    midColor: HOLO_POD_PALETTE.midWireLow,
    highColor: HOLO_POD_PALETTE.highEmissive,
    baseAlpha: 0.35,
    applyStencilReject,
  });
  const ghostInstanced = new THREE.InstancedMesh(new THREE.SphereGeometry(0.022, 8, 6), ghostMat, 54);
  const ghostPositions = new Float32Array(54 * 3);

  rootGroup.add(nodeCoreInstanced);
  rootGroup.add(nodeShellInstanced);
  rootGroup.add(pingRingInstanced);
  rootGroup.add(ghostInstanced);

  // 4. Edges: 36 edges (dynamic BufferGeometry)
  const EDGE_COUNT = 36;
  const edgePairs = [
    // 5 path edges
    [0, 3], [3, 7], [7, 11], [11, 14], [14, 17],
  ];
  // Generate 31 neighbor edges deterministically
  for (let i = 0; i < NODE_COUNT; i++) {
    for (let j = i + 1; j < NODE_COUNT; j++) {
      if (edgePairs.length >= EDGE_COUNT) break;
      const d = cloudPositions[i].distanceTo(cloudPositions[j]);
      if (d < 0.28 && !edgePairs.some(([a, b]) => (a === i && b === j) || (a === j && b === i))) {
        edgePairs.push([i, j]);
      }
    }
    if (edgePairs.length >= EDGE_COUNT) break;
  }
  // Fill remaining if needed
  while (edgePairs.length < EDGE_COUNT) {
    edgePairs.push([edgePairs.length % NODE_COUNT, (edgePairs.length * 3 + 1) % NODE_COUNT]);
  }

  const edgePosBuffer = new Float32Array(EDGE_COUNT * 2 * 3);
  const edgeMetricBuffer = new Float32Array(EDGE_COUNT * 2 * 4);

  for (let e = 0; e < EDGE_COUNT; e++) {
    const isPath = e < 5;
    edgeMetricBuffer[e * 8 + 0] = 0.0;
    edgeMetricBuffer[e * 8 + 1] = isPath ? 1.0 : 0.45;
    edgeMetricBuffer[e * 8 + 2] = isPath ? 1.0 : 0.0;
    edgeMetricBuffer[e * 8 + 3] = e;

    edgeMetricBuffer[e * 8 + 4] = 1.0;
    edgeMetricBuffer[e * 8 + 5] = isPath ? 1.0 : 0.45;
    edgeMetricBuffer[e * 8 + 6] = isPath ? 1.0 : 0.0;
    edgeMetricBuffer[e * 8 + 7] = e;
  }

  const edgeGeo = new THREE.BufferGeometry();
  edgeGeo.setAttribute('position', new THREE.BufferAttribute(edgePosBuffer, 3).setUsage(THREE.DynamicDrawUsage));
  edgeGeo.setAttribute('aLineMetric', new THREE.BufferAttribute(edgeMetricBuffer, 4));

  const edgeMat = createPodHologramLineMaterial({
    lineColor: HOLO_POD_PALETTE.midWireLow,
    pulseColor: HOLO_POD_PALETTE.highPulseGold,
    baseAlpha: 0.85,
    dashFrequency: 18.0,
    dashSpeed: 3.2,
    applyStencilReject,
  });
  const edgeMesh = new THREE.LineSegments(edgeGeo, edgeMat);
  rootGroup.add(edgeMesh);

  // Per-node pull progress
  const pullProgress = new Float32Array(6);

  // Telemetry properties
  const telemetry = {
    extractedNodeCount: 0,
    collinearAlignmentFactor: 0.0,
    activePulseProgress: 0.0,
  };

  const dummy = new THREE.Object3D();

  function update(dt, timeSec, state) {
    const { stage, stageProgress, uMaterializeAlpha, uClimaxFlash } = state;

    // Evaluate state machine transitions
    let activePulse = 0.0;
    let extractedCount = 0;
    let collinearFactor = 0.0;

    if (stage === 'spawn') {
      for (let k = 0; k < 6; k++) pullProgress[k] = 0.0;
      extractedCount = 0;
      collinearFactor = 0.0;
      activePulse = 0.0;
    } else if (stage === 'animate') {
      activePulse = Math.min(1.0, stageProgress * 1.6);
      for (let k = 0; k < 6; k++) {
        const hitT = k / 5.0 * 0.55;
        if (stageProgress >= hitT) {
          const p = Math.min(1.0, (stageProgress - hitT) / 0.35);
          pullProgress[k] = smoothstep(0.0, 1.0, p);
        } else {
          pullProgress[k] = 0.0;
        }
      }
      extractedCount = pullProgress.filter(p => p > 0.85).length;
      collinearFactor = pullProgress.reduce((a, b) => a + b, 0) / 6.0;
    } else if (stage === 'climax') {
      for (let k = 0; k < 6; k++) pullProgress[k] = 1.0;
      extractedCount = 6;
      collinearFactor = 1.0;
      activePulse = 1.0;
    } else { // dissolve
      const p = 1.0 - stageProgress;
      for (let k = 0; k < 6; k++) pullProgress[k] = smoothstep(0.0, 1.0, p);
      extractedCount = pullProgress.filter(pr => pr > 0.85).length;
      collinearFactor = pullProgress.reduce((a, b) => a + b, 0) / 6.0;
      activePulse = 0.0;
    }

    telemetry.extractedNodeCount = extractedCount;
    telemetry.collinearAlignmentFactor = collinearFactor;
    telemetry.activePulseProgress = activePulse;

    // Update node positions
    for (let i = 0; i < NODE_COUNT; i++) {
      const pathIdx = PATH_NODES.indexOf(i);
      if (pathIdx !== -1) {
        const pr = pullProgress[pathIdx];
        currentPositions[i].lerpVectors(cloudPositions[i], collinearTargets[pathIdx], pr);
      } else {
        // Subtle organic float in chaotic cloud
        const driftY = Math.sin(timeSec * 1.5 + i) * 0.008;
        currentPositions[i].copy(cloudPositions[i]).y += driftY;
      }

      // Update instance matrices
      dummy.position.copy(currentPositions[i]);
      dummy.scale.setScalar(1.0 + 0.15 * Math.sin(timeSec * 2.0 + i));
      dummy.updateMatrix();
      nodeCoreInstanced.setMatrixAt(i, dummy.matrix);
      nodeShellInstanced.setMatrixAt(i, dummy.matrix);

      // Node shell hit flare
      const isPath = pathIdx !== -1;
      const flare = isPath ? (pullProgress[pathIdx] * 0.8 + uClimaxFlash * 0.9) : 0.0;
      shellInstanceState[i * 4 + 0] = flare;
      shellInstanceState[i * 4 + 1] = isPath ? 1.0 : 0.0;
      shellInstanceState[i * 4 + 2] = 1.0;
      shellInstanceState[i * 4 + 3] = uMaterializeAlpha;
    }
    nodeCoreInstanced.instanceMatrix.needsUpdate = true;
    nodeShellInstanced.instanceMatrix.needsUpdate = true;
    nodeShellInstanced.geometry.attributes.aInstanceState.needsUpdate = true;

    // Update concentric ping rings
    for (let k = 0; k < 6; k++) {
      const pIdx = PATH_NODES[k];
      dummy.position.copy(currentPositions[pIdx]);
      const pr = pullProgress[k];
      const pingScale = 0.6 + pr * 1.8;
      dummy.scale.set(pingScale, pingScale, pingScale);
      dummy.rotation.x = Math.PI / 2;
      dummy.updateMatrix();
      pingRingInstanced.setMatrixAt(k, dummy.matrix);
      pingRingState[k * 4 + 0] = pr;
      pingRingState[k * 4 + 3] = (1.0 - pr * 0.7) * uMaterializeAlpha;
    }
    pingRingInstanced.instanceMatrix.needsUpdate = true;
    pingRingInstanced.geometry.attributes.aInstanceState.needsUpdate = true;

    // Update afterimage ghosts (3 slots per node)
    for (let i = 0; i < NODE_COUNT; i++) {
      for (let s = 0; s < 3; s++) {
        const gIdx = i * 3 + s;
        dummy.position.copy(currentPositions[i]).addScalar((s + 1) * -0.005);
        const gScale = (0.72 - s * 0.22) * (1.0 - uClimaxFlash * 0.5);
        dummy.scale.setScalar(gScale);
        dummy.updateMatrix();
        ghostInstanced.setMatrixAt(gIdx, dummy.matrix);
      }
    }
    ghostInstanced.instanceMatrix.needsUpdate = true;

    // Update edge line positions in-place
    const posAttr = edgeGeo.attributes.position;
    for (let e = 0; e < EDGE_COUNT; e++) {
      const [n1, n2] = edgePairs[e];
      const p1 = currentPositions[n1];
      const p2 = currentPositions[n2];

      posAttr.setXYZ(e * 2 + 0, p1.x, p1.y, p1.z);
      posAttr.setXYZ(e * 2 + 1, p2.x, p2.y, p2.z);
    }
    posAttr.needsUpdate = true;

    // Update uniforms
    edgeMat.uniforms.uTime.value = timeSec;
    edgeMat.uniforms.uPulseProgress.value = activePulse;
    edgeMat.uniforms.uMaterializeAlpha.value = uMaterializeAlpha;
    edgeMat.uniforms.uClimaxFlash.value = uClimaxFlash;

    nodeShellMat.uniforms.uTime.value = timeSec;
    nodeShellMat.uniforms.uMaterializeAlpha.value = uMaterializeAlpha;
    nodeShellMat.uniforms.uClimaxFlash.value = uClimaxFlash;

    ringMat.uniforms.uTime.value = timeSec;
    ringMat.uniforms.uMaterializeAlpha.value = uMaterializeAlpha;
    ringMat.uniforms.uClimaxFlash.value = uClimaxFlash;

    auraMat.uniforms.uTime.value = timeSec;
    auraMat.uniforms.uMaterializeAlpha.value = uMaterializeAlpha;
  }

  return {
    rootGroup,
    hitProxyMesh,
    telemetry,
    materials: [nodeCoreMat, nodeShellMat, pingMat, ghostMat, cageMat, edgeMat, ringMat, auraMat],
    update,
  };
}

// ============================================================================
// POD 2: Matrix Rank Solver Hologram (ticket-004.md §2)
// ============================================================================
export function buildMatrixRankPod({ podSpec, floorY, glyphAtlas, applyStencilReject }) {
  const rootGroup = new THREE.Group();
  rootGroup.name = `PodGroup_${podSpec.id}`;
  rootGroup.position.set(podSpec.defaultOffset.x, floorY + podSpec.defaultOffset.yRel, podSpec.defaultOffset.z);

  const { emitterGroup, auraMesh, ringMat, auraMat } = createPodEmitterAndAura(podSpec.id, 0.38, applyStencilReject);
  rootGroup.add(emitterGroup);
  rootGroup.add(auraMesh);

  // Hit proxy
  const hitProxyMat = new THREE.MeshBasicMaterial({
    transparent: true,
    opacity: 0.0,
    depthWrite: false,
    depthTest: true,
    visible: false,
  });
  const hitProxyMesh = new THREE.Mesh(new THREE.SphereGeometry(0.56, 12, 10), hitProxyMat);
  hitProxyMesh.name = `HitProxy_${podSpec.id}`;
  hitProxyMesh.userData = { podId: podSpec.id, isMathPodProxy: true };
  rootGroup.add(hitProxyMesh);

  // 1. Outer wireframe calibration cube (0.52 x 0.52 x 0.52)
  const cubeEdges = new THREE.EdgesGeometry(new THREE.BoxGeometry(0.52, 0.52, 0.52));
  const cubeMetric = new Float32Array(cubeEdges.attributes.position.count * 4);
  for (let i = 0; i < cubeEdges.attributes.position.count; i++) {
    cubeMetric[i * 4 + 0] = (i % 2);
    cubeMetric[i * 4 + 1] = 0.8;
    cubeMetric[i * 4 + 2] = 0.0;
    cubeMetric[i * 4 + 3] = 0.0;
  }
  cubeEdges.setAttribute('aLineMetric', new THREE.BufferAttribute(cubeMetric, 4));
  const cubeMat = createPodHologramLineMaterial({
    lineColor: HOLO_POD_PALETTE.midWireLow,
    pulseColor: HOLO_POD_PALETTE.highPulseGold,
    baseAlpha: 0.70,
    dashFrequency: 18.0,
    applyStencilReject,
  });
  const cubeMesh = new THREE.LineSegments(cubeEdges, cubeMat);
  rootGroup.add(cubeMesh);

  // Expanding bounding-box shockwave wireframe cube
  const shockwaveEdges = new THREE.EdgesGeometry(new THREE.BoxGeometry(0.54, 0.54, 0.54));
  const shockMetric = new Float32Array(shockwaveEdges.attributes.position.count * 4);
  for (let i = 0; i < shockwaveEdges.attributes.position.count; i++) {
    shockMetric[i * 4 + 0] = (i % 2);
    shockMetric[i * 4 + 1] = 1.0;
    shockMetric[i * 4 + 2] = 1.0;
    shockMetric[i * 4 + 3] = 0.0;
  }
  shockwaveEdges.setAttribute('aLineMetric', new THREE.BufferAttribute(shockMetric, 4));
  const shockMat = createPodHologramLineMaterial({
    lineColor: HOLO_POD_PALETTE.highPulseGold,
    pulseColor: HOLO_POD_PALETTE.highPulseGold,
    baseAlpha: 0.95,
    applyStencilReject,
  });
  const shockMesh = new THREE.LineSegments(shockwaveEdges, shockMat);
  shockMesh.scale.setScalar(1.0);
  rootGroup.add(shockMesh);

  // 2. 4x4x4 = 64 Instanced Binary Glyphs
  const GLYPH_COUNT = 64;
  const glyphGeo = new THREE.PlaneGeometry(0.068, 0.068);
  const glyphMat = createPodGlyphMaterial({
    atlasTexture: glyphAtlas.texture,
    applyStencilReject,
  });
  const glyphInstanced = new THREE.InstancedMesh(glyphGeo, glyphMat, GLYPH_COUNT);

  const uvRectAttr = new Float32Array(GLYPH_COUNT * 4);
  const glyphStateAttr = new Float32Array(GLYPH_COUNT * 4);

  const gridSteps = [-0.165, -0.055, 0.055, 0.165];
  const dummy = new THREE.Object3D();

  // Grid coordinates map: index = row*16 + col*4 + depth
  // row r in 0..3 (y: +0.165 down to -0.165), col c in 0..3 (x), depth d in 0..3 (z)
  for (let r = 0; r < 4; r++) {
    const y = gridSteps[3 - r]; // row 0 at +0.165
    for (let c = 0; c < 4; c++) {
      const x = gridSteps[c];
      for (let d = 0; d < 4; d++) {
        const z = gridSteps[d];
        const idx = r * 16 + c * 4 + d;
        dummy.position.set(x, y, z);
        dummy.updateMatrix();
        glyphInstanced.setMatrixAt(idx, dummy.matrix);

        // Initial UV: '0'
        const uv = glyphAtlas.cells.zero;
        uvRectAttr[idx * 4 + 0] = uv[0];
        uvRectAttr[idx * 4 + 1] = uv[1];
        uvRectAttr[idx * 4 + 2] = uv[2];
        uvRectAttr[idx * 4 + 3] = uv[3];

        const depthAtten = 0.72 + 0.28 * ((z + 0.165) / 0.33);
        glyphStateAttr[idx * 4 + 0] = 0.0; // isOne
        glyphStateAttr[idx * 4 + 1] = 0.0; // isLocked
        glyphStateAttr[idx * 4 + 2] = depthAtten;
        glyphStateAttr[idx * 4 + 3] = 1.0;
      }
    }
  }
  glyphInstanced.instanceMatrix.needsUpdate = true;
  glyphGeo.setAttribute('aUvRect', new THREE.BufferAttribute(uvRectAttr, 4).setUsage(THREE.DynamicDrawUsage));
  glyphGeo.setAttribute('aGlyphState', new THREE.BufferAttribute(glyphStateAttr, 4).setUsage(THREE.DynamicDrawUsage));
  rootGroup.add(glyphInstanced);

  // 3. Planar laser scanner plane
  const scannerPlaneGroup = new THREE.Group();
  const scannerPlateGeo = new THREE.PlaneGeometry(0.50, 0.50);
  const scannerPlateMat = createPodHologramSurfaceMaterial({
    coreColor: HOLO_POD_PALETTE.coreShadow,
    midColor: HOLO_POD_PALETTE.highEmissive,
    highColor: HOLO_POD_PALETTE.highPulseGold,
    baseAlpha: 0.65,
    applyStencilReject,
  });
  const scannerPlate = new THREE.Mesh(scannerPlateGeo, scannerPlateMat);
  scannerPlate.rotation.x = Math.PI / 2;
  scannerPlaneGroup.add(scannerPlate);

  const scannerBorderEdges = new THREE.EdgesGeometry(scannerPlateGeo);
  const scanBMetric = new Float32Array(scannerBorderEdges.attributes.position.count * 4);
  for (let i = 0; i < scannerBorderEdges.attributes.position.count; i++) {
    scanBMetric[i * 4 + 0] = (i % 2);
    scanBMetric[i * 4 + 1] = 1.0;
    scanBMetric[i * 4 + 2] = 1.0;
    scanBMetric[i * 4 + 3] = 0.0;
  }
  scannerBorderEdges.setAttribute('aLineMetric', new THREE.BufferAttribute(scanBMetric, 4));
  const scannerBorder = new THREE.LineSegments(scannerBorderEdges, cubeMat);
  scannerBorder.rotation.x = Math.PI / 2;
  scannerPlaneGroup.add(scannerBorder);
  rootGroup.add(scannerPlaneGroup);

  // 4. 4 Horizontal row slice meshes (y in {+0.165, +0.055, -0.055, -0.165})
  const rowSliceMeshes = [];
  const rowSliceMats = [];
  const rowYCoords = [0.165, 0.055, -0.055, -0.165];
  for (let r = 0; r < 4; r++) {
    const sMat = createPodHologramSurfaceMaterial({
      coreColor: HOLO_POD_PALETTE.coreDeep,
      midColor: HOLO_POD_PALETTE.midWireHigh,
      highColor: HOLO_POD_PALETTE.highPulseGold,
      baseAlpha: 0.40,
      applyStencilReject,
    });
    rowSliceMats.push(sMat);
    const sMesh = new THREE.Mesh(new THREE.PlaneGeometry(0.48, 0.48), sMat);
    sMesh.rotation.x = Math.PI / 2;
    sMesh.position.y = rowYCoords[r];
    sMesh.visible = false;
    rootGroup.add(sMesh);
    rowSliceMeshes.push(sMesh);
  }

  const telemetry = {
    lockedRows: 0,
    scannerY: 0.22,
    isFullRank: false,
    shockwaveScale: 1.0,
  };

  function update(dt, timeSec, state) {
    const { stage, stageProgress, uMaterializeAlpha, uClimaxFlash } = state;

    let lockedRows = 0;
    let scannerY = 0.22;
    let shockScale = 1.0;

    if (stage === 'spawn') {
      lockedRows = 0;
      scannerY = 0.22;
    } else if (stage === 'animate') {
      scannerY = 0.22 - stageProgress * 0.44; // sweeps from +0.22 to -0.22
      if (stageProgress >= 0.22) lockedRows = 1;
      if (stageProgress >= 0.46) lockedRows = 2;
      if (stageProgress >= 0.70) lockedRows = 3;
      if (stageProgress >= 0.92) lockedRows = 4;
    } else if (stage === 'climax') {
      lockedRows = 4;
      scannerY = -0.22;
      shockScale = 1.0 + 0.48 * Math.sin(stageProgress * Math.PI);
    } else { // dissolve
      lockedRows = Math.floor((1.0 - stageProgress) * 4.0);
      scannerY = 0.22;
      shockScale = 1.0;
    }

    telemetry.lockedRows = lockedRows;
    telemetry.scannerY = scannerY;
    telemetry.isFullRank = (lockedRows === 4);
    telemetry.shockwaveScale = shockScale;

    scannerPlaneGroup.position.y = scannerY;
    shockMesh.scale.setScalar(shockScale);

    // Update row slice visibility & intensity
    for (let r = 0; r < 4; r++) {
      const isLocked = r < lockedRows;
      rowSliceMeshes[r].visible = isLocked;
      if (isLocked) {
        rowSliceMats[r].uniforms.uClimaxFlash.value = uClimaxFlash;
        rowSliceMats[r].uniforms.uMaterializeAlpha.value = uMaterializeAlpha;
      }
    }

    // Update 64 binary glyph UVs and states
    const uvZero = glyphAtlas.cells.zero;
    const uvOne = glyphAtlas.cells.one;

    for (let r = 0; r < 4; r++) {
      const isRowLocked = r < lockedRows;
      for (let c = 0; c < 4; c++) {
        for (let d = 0; d < 4; d++) {
          const idx = r * 16 + c * 4 + d;
          let isOne;
          if (isRowLocked) {
            // Identity/upper triangular full rank structure
            isOne = (r === c) || (d === 0 && r < c);
          } else {
            // Rapid procedural flickering
            const hash = Math.sin(timeSec * 32.0 + idx * 7.13);
            isOne = hash > 0.15;
          }

          const targetUv = isOne ? uvOne : uvZero;
          uvRectAttr[idx * 4 + 0] = targetUv[0];
          uvRectAttr[idx * 4 + 1] = targetUv[1];
          uvRectAttr[idx * 4 + 2] = targetUv[2];
          uvRectAttr[idx * 4 + 3] = targetUv[3];

          glyphStateAttr[idx * 4 + 0] = isOne ? 1.0 : 0.0;
          glyphStateAttr[idx * 4 + 1] = isRowLocked ? 1.0 : 0.0;
          glyphStateAttr[idx * 4 + 3] = uMaterializeAlpha;
        }
      }
    }
    glyphInstanced.geometry.attributes.aUvRect.needsUpdate = true;
    glyphInstanced.geometry.attributes.aGlyphState.needsUpdate = true;

    // Uniform updates
    glyphMat.uniforms.uTime.value = timeSec;
    glyphMat.uniforms.uMaterializeAlpha.value = uMaterializeAlpha;
    glyphMat.uniforms.uClimaxFlash.value = uClimaxFlash;

    cubeMat.uniforms.uTime.value = timeSec;
    cubeMat.uniforms.uMaterializeAlpha.value = uMaterializeAlpha;
    cubeMat.uniforms.uClimaxFlash.value = uClimaxFlash;

    shockMat.uniforms.uTime.value = timeSec;
    shockMat.uniforms.uMaterializeAlpha.value = uClimaxFlash;

    ringMat.uniforms.uTime.value = timeSec;
    ringMat.uniforms.uMaterializeAlpha.value = uMaterializeAlpha;

    auraMat.uniforms.uTime.value = timeSec;
    auraMat.uniforms.uMaterializeAlpha.value = uMaterializeAlpha;
  }

  return {
    rootGroup,
    hitProxyMesh,
    telemetry,
    materials: [cubeMat, shockMat, glyphMat, scannerPlateMat, ringMat, auraMat, ...rowSliceMats],
    update,
  };
}

// ============================================================================
// POD 3: Gradient Descent Hologram (ticket-005.md §1)
// ============================================================================
export function buildGradientDescentPod({ podSpec, floorY, applyStencilReject }) {
  const rootGroup = new THREE.Group();
  rootGroup.name = `PodGroup_${podSpec.id}`;
  rootGroup.position.set(podSpec.defaultOffset.x, floorY + podSpec.defaultOffset.yRel, podSpec.defaultOffset.z);

  const { emitterGroup, auraMesh, ringMat, auraMat } = createPodEmitterAndAura(podSpec.id, 0.38, applyStencilReject);
  rootGroup.add(emitterGroup);
  rootGroup.add(auraMesh);

  // Hit proxy
  const hitProxyMat = new THREE.MeshBasicMaterial({
    transparent: true,
    opacity: 0.0,
    depthWrite: false,
    depthTest: true,
    visible: false,
  });
  const hitProxyMesh = new THREE.Mesh(new THREE.SphereGeometry(0.56, 12, 10), hitProxyMat);
  hitProxyMesh.name = `HitProxy_${podSpec.id}`;
  hitProxyMesh.userData = { podId: podSpec.id, isMathPodProxy: true };
  rootGroup.add(hitProxyMesh);

  // 1. Hyperbolic Paraboloid Saddle Surface: y = 1.45*(x^2 - z^2) - 0.02
  const GRID_RES = 32;
  const saddleGeo = new THREE.BufferGeometry();
  const saddleVertices = [];
  const saddleNormals = [];
  const saddleUvs = [];
  const saddleIndices = [];

  for (let i = 0; i <= GRID_RES; i++) {
    const u = i / GRID_RES;
    const x = -0.34 + u * 0.68;
    for (let j = 0; j <= GRID_RES; j++) {
      const v = j / GRID_RES;
      const z = -0.34 + v * 0.68;
      const y = 1.45 * (x * x - z * z) - 0.02;

      saddleVertices.push(x, y, z);
      const nx = -2.90 * x;
      const ny = 1.0;
      const nz = 2.90 * z;
      const len = Math.hypot(nx, ny, nz);
      saddleNormals.push(nx / len, ny / len, nz / len);
      saddleUvs.push(u, v);
    }
  }

  for (let i = 0; i < GRID_RES; i++) {
    for (let j = 0; j < GRID_RES; j++) {
      const a = i * (GRID_RES + 1) + j;
      const b = (i + 1) * (GRID_RES + 1) + j;
      const c = (i + 1) * (GRID_RES + 1) + (j + 1);
      const d = i * (GRID_RES + 1) + (j + 1);
      saddleIndices.push(a, b, d);
      saddleIndices.push(b, c, d);
    }
  }

  saddleGeo.setAttribute('position', new THREE.Float32BufferAttribute(saddleVertices, 3));
  saddleGeo.setAttribute('normal', new THREE.Float32BufferAttribute(saddleNormals, 3));
  saddleGeo.setAttribute('uv', new THREE.Float32BufferAttribute(saddleUvs, 2));
  saddleGeo.setIndex(saddleIndices);

  const saddleMat = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0.0 },
      uCoreColor: { value: new THREE.Color(HOLO_POD_PALETTE.coreDeep) },
      uMidColor: { value: new THREE.Color(HOLO_POD_PALETTE.midWireLow) },
      uHighColor: { value: new THREE.Color(HOLO_POD_PALETTE.highPulseGold) },
      uTargetFlash: { value: 0.0 },
      uMaterializeAlpha: { value: 1.0 },
      uInterferenceBoost: { value: 0.0 },
      uInterference: { value: 0.0 },
      uWalkGlitch: { value: 0.0 },
      uGlitchClockHz: { value: 34.0 },
      uMaxSliceOffset: { value: 0.068 },
      uMaxVerticalJitter: { value: 0.015 },
    },
    vertexShader: `
      uniform float uTime;
      uniform float uInterference;
      uniform float uInterferenceBoost;
      uniform float uWalkGlitch;
      uniform float uGlitchClockHz;
      uniform float uMaxSliceOffset;
      uniform float uMaxVerticalJitter;

      varying vec3 vLocalPos;
      varying vec3 vWorldPos;
      varying vec3 vViewNormal;
      varying vec3 vViewDir;
      varying vec2 vUv;

      void main() {
        vUv = uv;
        vLocalPos = position;
        vec4 worldPos = modelMatrix * vec4(position, 1.0);

        float gEff = clamp(max(max(uInterference, uInterferenceBoost), uWalkGlitch), 0.0, 1.0);
        if (gEff > 0.001) {
          float glitchTick = floor(uTime * uGlitchClockHz);
          float bandDensity = mix(10.0, 16.0, gEff);
          float sliceBand = floor((worldPos.y + 4.0) * bandDensity + fract(glitchTick * 0.173));
          float sliceHashX = fract(sin(sliceBand * 127.1 + glitchTick * 311.7) * 43758.5453);
          float sliceHashZ = fract(sin(sliceBand * 269.5 + glitchTick * 183.3) * 43758.5453);
          float activeMask = step(0.26 - 0.14 * gEff, sliceHashX);
          float signedX = (sliceHashX * 2.0 - 1.0) * activeMask;
          float signedZ = (sliceHashZ * 2.0 - 1.0) * activeMask;
          worldPos.x += signedX * uMaxSliceOffset * gEff;
          worldPos.z += signedZ * (uMaxSliceOffset * 0.65) * gEff;
          float vJitterHash = fract(sin((sliceBand + 7.0) * 91.7 + glitchTick * 419.2) * 43758.5453);
          worldPos.y += (vJitterHash * 2.0 - 1.0) * uMaxVerticalJitter * gEff;
        }

        vWorldPos = worldPos.xyz;
        vec4 mvPos = viewMatrix * worldPos;
        vViewNormal = normalize(normalMatrix * normal);
        vViewDir = normalize(-mvPos.xyz);
        gl_Position = projectionMatrix * mvPos;
      }
    `,
    fragmentShader: `
      uniform float uTime;
      uniform vec3 uCoreColor;
      uniform vec3 uMidColor;
      uniform vec3 uHighColor;
      uniform float uTargetFlash;
      uniform float uMaterializeAlpha;
      uniform float uInterferenceBoost;
      uniform float uInterference;
      uniform float uWalkGlitch;
      uniform float uGlitchClockHz;

      varying vec3 vLocalPos;
      varying vec3 vWorldPos;
      varying vec3 vViewNormal;
      varying vec3 vViewDir;
      varying vec2 vUv;

      void main() {
        float gEff = clamp(max(max(uInterference, uInterferenceBoost), uWalkGlitch), 0.0, 1.0);
        float ndotv = clamp(abs(dot(normalize(vViewNormal), normalize(vViewDir))), 0.0, 1.0);
        float fresnel = pow(1.0 - ndotv, 2.0) * (1.0 + 1.25 * gEff);

        // Procedural contour rings
        float contour = smoothstep(0.84, 0.98, abs(sin(vLocalPos.y * 46.0)));
        // Topographic scanlines sweeping down gradient
        float topoScan = 0.5 + 0.5 * sin((vLocalPos.y - 0.5 * length(vLocalPos.xz)) * 28.0 + uTime * 5.0);

        float h1 = sin(uTime * 113.097);
        float h2 = sin(uTime * 270.177 + 1.13);
        float h3 = cos(uTime * 446.106 + 2.41);
        float harmonicWave = 0.5 + 0.5 * (0.45 * h1 + 0.35 * h2 + 0.20 * h3);
        float sputterGain = mix(1.0, mix(0.35, 1.65, harmonicWave), gEff);

        vec3 hotGold = vec3(1.0, 0.82, 0.40);
        vec3 col = mix(uCoreColor, uMidColor, contour * 0.7 + topoScan * 0.3);
        col = mix(col, uHighColor, fresnel * 0.6 + uTargetFlash * 0.85);
        col = mix(col, hotGold, gEff * 0.6 * fresnel);
        col *= sputterGain;

        float alphaBase = (0.35 + 0.45 * contour + 0.4 * fresnel + uTargetFlash * 0.6) * uMaterializeAlpha;
        float alphaFloor = mix(0.20, 0.25, gEff);
        float alpha = clamp(alphaBase * mix(1.0, 0.55 + 0.75 * harmonicWave, gEff), alphaFloor, 1.0);
        gl_FragColor = vec4(col * alpha, alpha);
      }
    `,
    transparent: true,
    depthTest: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
  });
  if (applyStencilReject) applyStencilReject(saddleMat);
  const saddleMesh = new THREE.Mesh(saddleGeo, saddleMat);
  rootGroup.add(saddleMesh);

  // Wireframe contour overlay
  const saddleWireEdges = new THREE.EdgesGeometry(saddleGeo);
  const wireMat = createPodHologramLineMaterial({
    lineColor: HOLO_POD_PALETTE.midWireLow,
    pulseColor: HOLO_POD_PALETTE.highPulseGold,
    baseAlpha: 0.45,
    applyStencilReject,
  });
  const wireMesh = new THREE.LineSegments(saddleWireEdges, wireMat);
  rootGroup.add(wireMesh);

  // 2. Minimum target beacon pillar at (0.0, -0.188, +0.32)
  const beaconGroup = new THREE.Group();
  beaconGroup.position.set(0.0, -0.188, 0.32);

  const pillarGeo = new THREE.CylinderGeometry(0.010, 0.010, 0.36, 12);
  const pillarMat = createPodHologramSurfaceMaterial({
    coreColor: HOLO_POD_PALETTE.highEmissive,
    midColor: HOLO_POD_PALETTE.highPulseGold,
    highColor: HOLO_POD_PALETTE.highPulseGold,
    baseAlpha: 0.90,
    applyStencilReject,
  });
  const pillarMesh = new THREE.Mesh(pillarGeo, pillarMat);
  pillarMesh.position.y = 0.18;
  beaconGroup.add(pillarMesh);

  // 3 Concentric base beacon rings
  for (let r = 0; r < 3; r++) {
    const ringRad = 0.024 + r * 0.018;
    const bRingGeo = new THREE.RingGeometry(ringRad, ringRad + 0.005, 20);
    const bRingMesh = new THREE.Mesh(bRingGeo, pillarMat);
    bRingMesh.rotation.x = Math.PI / 2;
    beaconGroup.add(bRingMesh);
  }
  rootGroup.add(beaconGroup);

  // 3. 3 Optimizer Orbs: SGD, Momentum, Adam
  const ORB_COUNT = 3;
  const orbCoreMat = createPodSmokedCoreMaterial({ coreColor: HOLO_POD_PALETTE.highEmissive, opacity: 0.8, applyStencilReject });
  const orbCoreInstanced = new THREE.InstancedMesh(new THREE.SphereGeometry(0.016, 12, 10), orbCoreMat, ORB_COUNT);

  const orbHaloMat = createPodHologramSurfaceMaterial({
    coreColor: HOLO_POD_PALETTE.highEmissive,
    midColor: HOLO_POD_PALETTE.highPulseGold,
    highColor: HOLO_POD_PALETTE.highPulseGold,
    baseAlpha: 0.95,
    applyStencilReject,
  });
  const orbHaloInstanced = new THREE.InstancedMesh(new THREE.SphereGeometry(0.028, 12, 10), orbHaloMat, ORB_COUNT);
  rootGroup.add(orbCoreInstanced);
  rootGroup.add(orbHaloInstanced);

  // 4. Pre-allocated Circular Ring Buffers for Ribbon Trails (Zero per-frame heap allocations)
  const TRAIL_CAPACITY = 36;
  const ribbonTrails = [];

  for (let o = 0; o < ORB_COUNT; o++) {
    const ringPoints = new Float32Array(TRAIL_CAPACITY * 3);
    const ribbonPositions = new Float32Array(TRAIL_CAPACITY * 2 * 3);
    const ribbonMetrics = new Float32Array(TRAIL_CAPACITY * 2 * 2);
    const ribbonIndices = new Uint16Array((TRAIL_CAPACITY - 1) * 6);

    for (let i = 0; i < TRAIL_CAPACITY; i++) {
      const u = i / (TRAIL_CAPACITY - 1);
      ribbonMetrics[i * 4 + 0] = u;
      ribbonMetrics[i * 4 + 1] = -1.0;
      ribbonMetrics[i * 4 + 2] = u;
      ribbonMetrics[i * 4 + 3] = 1.0;
    }

    for (let i = 0; i < TRAIL_CAPACITY - 1; i++) {
      const v0 = i * 2;
      const v1 = i * 2 + 1;
      const v2 = (i + 1) * 2;
      const v3 = (i + 1) * 2 + 1;
      ribbonIndices[i * 6 + 0] = v0;
      ribbonIndices[i * 6 + 1] = v1;
      ribbonIndices[i * 6 + 2] = v2;
      ribbonIndices[i * 6 + 3] = v1;
      ribbonIndices[i * 6 + 4] = v3;
      ribbonIndices[i * 6 + 5] = v2;
    }

    const rGeo = new THREE.BufferGeometry();
    rGeo.setAttribute('position', new THREE.BufferAttribute(ribbonPositions, 3).setUsage(THREE.DynamicDrawUsage));
    rGeo.setAttribute('aRibbonMetric', new THREE.BufferAttribute(ribbonMetrics, 2));
    rGeo.setIndex(new THREE.BufferAttribute(ribbonIndices, 1));

    const rMat = new THREE.ShaderMaterial({
      uniforms: {
        uColor1: { value: new THREE.Color(HOLO_POD_PALETTE.highEmissive) },
        uColor2: { value: new THREE.Color(HOLO_POD_PALETTE.highPulseGold) },
        uMaterializeAlpha: { value: 1.0 },
        uTime: { value: 0.0 },
        uInterference: { value: 0.0 },
        uInterferenceBoost: { value: 0.0 },
        uWalkGlitch: { value: 0.0 },
        uGlitchClockHz: { value: 34.0 },
        uMaxSliceOffset: { value: 0.068 },
        uMaxVerticalJitter: { value: 0.015 },
      },
      vertexShader: `
        attribute vec2 aRibbonMetric;
        varying vec2 vRibbonMetric;

        uniform float uTime;
        uniform float uInterference;
        uniform float uInterferenceBoost;
        uniform float uWalkGlitch;
        uniform float uGlitchClockHz;
        uniform float uMaxSliceOffset;
        uniform float uMaxVerticalJitter;

        void main() {
          vRibbonMetric = aRibbonMetric;
          vec4 worldPos = modelMatrix * vec4(position, 1.0);

          float gEff = clamp(max(max(uInterference, uInterferenceBoost), uWalkGlitch), 0.0, 1.0);
          if (gEff > 0.001) {
            float glitchTick = floor(uTime * uGlitchClockHz);
            float bandDensity = mix(10.0, 16.0, gEff);
            float sliceBand = floor((worldPos.y + 4.0) * bandDensity + fract(glitchTick * 0.173));
            float sliceHashX = fract(sin(sliceBand * 127.1 + glitchTick * 311.7) * 43758.5453);
            float sliceHashZ = fract(sin(sliceBand * 269.5 + glitchTick * 183.3) * 43758.5453);
            float activeMask = step(0.26 - 0.14 * gEff, sliceHashX);
            float signedX = (sliceHashX * 2.0 - 1.0) * activeMask;
            float signedZ = (sliceHashZ * 2.0 - 1.0) * activeMask;
            worldPos.x += signedX * uMaxSliceOffset * gEff;
            worldPos.z += signedZ * (uMaxSliceOffset * 0.65) * gEff;
            float vJitterHash = fract(sin((sliceBand + 7.0) * 91.7 + glitchTick * 419.2) * 43758.5453);
            worldPos.y += (vJitterHash * 2.0 - 1.0) * uMaxVerticalJitter * gEff;
          }

          gl_Position = projectionMatrix * viewMatrix * worldPos;
        }
      `,
      fragmentShader: `
        uniform vec3 uColor1;
        uniform vec3 uColor2;
        uniform float uMaterializeAlpha;
        uniform float uTime;
        uniform float uInterference;
        uniform float uInterferenceBoost;
        uniform float uWalkGlitch;
        uniform float uGlitchClockHz;

        varying vec2 vRibbonMetric;

        void main() {
          float gEff = clamp(max(max(uInterference, uInterferenceBoost), uWalkGlitch), 0.0, 1.0);
          float tailAge = vRibbonMetric.x;
          float fade = pow(1.0 - tailAge, 1.8);
          vec3 col = mix(uColor2, uColor1, tailAge);

          float h1 = sin(uTime * 113.097);
          float h2 = sin(uTime * 270.177 + 1.13);
          float h3 = cos(uTime * 446.106 + 2.41);
          float harmonicWave = 0.5 + 0.5 * (0.45 * h1 + 0.35 * h2 + 0.20 * h3);
          float sputterGain = mix(1.0, mix(0.35, 1.65, harmonicWave), gEff);

          vec3 hotGold = vec3(1.0, 0.82, 0.40);
          col = mix(col, hotGold, gEff * 0.5) * sputterGain;

          float alpha = fade * uMaterializeAlpha * 0.75 * mix(1.0, 0.55 + 0.75 * harmonicWave, gEff);
          gl_FragColor = vec4(col * alpha, alpha);
        }
      `,
      transparent: true,
      depthTest: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
    });
    if (applyStencilReject) applyStencilReject(rMat);

    const rMesh = new THREE.Mesh(rGeo, rMat);
    rootGroup.add(rMesh);

    ribbonTrails.push({
      ringPoints,
      ribbonPositions,
      headIndex: 0,
      validCount: 0,
      geo: rGeo,
      mat: rMat,
      mesh: rMesh,
    });
  }

  const dummy = new THREE.Object3D();
  const currentOrbPositions = [new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()];

  const telemetry = {
    adamDistanceToBeacon: 0.0,
    targetFlashIntensity: 0.0,
    optimizers: [
      { name: 'SGD', position: currentOrbPositions[0] },
      { name: 'Momentum', position: currentOrbPositions[1] },
      { name: 'Adam', position: currentOrbPositions[2] },
    ],
  };

  function update(dt, timeSec, state) {
    const { stage, stageProgress, uMaterializeAlpha, uClimaxFlash } = state;

    let sVal = 0.0;
    if (stage === 'spawn') {
      sVal = 0.0;
      for (const t of ribbonTrails) t.validCount = 0;
    } else if (stage === 'animate') {
      sVal = stageProgress;
    } else if (stage === 'climax') {
      sVal = 1.0;
    } else { // dissolve
      sVal = 1.0 - stageProgress * 0.5;
    }

    // Evaluate optimizer trajectories (ticket-005.md §1)
    // 0: SGD (wild oscillation)
    const xSgd = -0.30 * (1.0 - 0.85 * sVal) * Math.cos(16.5 * sVal);
    const zSgd = -0.06 + 0.38 * sVal;
    const ySgd = 1.45 * (xSgd * xSgd - zSgd * zSgd) - 0.02 + 0.025;
    currentOrbPositions[0].set(xSgd, ySgd, zSgd);

    // 1: Momentum (damped low-frequency overshoot)
    const xMom = 0.30 * Math.exp(-3.4 * sVal) * Math.cos(5.2 * sVal);
    const zMom = -0.08 + 0.40 * sVal;
    const yMom = 1.45 * (xMom * xMom - zMom * zMom) - 0.02 + 0.025;
    currentOrbPositions[1].set(xMom, yMom, zMom);

    // 2: Adam (smooth ravine descent straight to minimum beacon)
    const xAdam = -0.26 * Math.pow(1.0 - sVal, 2.4);
    const zAdam = -0.10 + 0.42 * (1.0 - Math.pow(1.0 - sVal, 1.5));
    const yAdam = 1.45 * (xAdam * xAdam - zAdam * zAdam) - 0.02 + 0.025;
    currentOrbPositions[2].set(xAdam, yAdam, zAdam);

    telemetry.adamDistanceToBeacon = currentOrbPositions[2].distanceTo(beaconGroup.position);
    telemetry.targetFlashIntensity = uClimaxFlash;

    // Update orb instances
    for (let o = 0; o < ORB_COUNT; o++) {
      dummy.position.copy(currentOrbPositions[o]);
      dummy.updateMatrix();
      orbCoreInstanced.setMatrixAt(o, dummy.matrix);
      orbHaloInstanced.setMatrixAt(o, dummy.matrix);

      // Update circular ring buffer for ribbon trail
      const t = ribbonTrails[o];
      const p = currentOrbPositions[o];
      t.ringPoints[t.headIndex * 3 + 0] = p.x;
      t.ringPoints[t.headIndex * 3 + 1] = p.y;
      t.ringPoints[t.headIndex * 3 + 2] = p.z;
      t.headIndex = (t.headIndex + 1) % TRAIL_CAPACITY;
      t.validCount = Math.min(TRAIL_CAPACITY, t.validCount + 1);

      // Populate ribbon position buffer in-place walking backwards from head
      const posArray = t.ribbonPositions;
      for (let i = 0; i < TRAIL_CAPACITY; i++) {
        const ringIdx = (t.headIndex - 1 - i + TRAIL_CAPACITY) % TRAIL_CAPACITY;
        const px = t.ringPoints[ringIdx * 3 + 0];
        const py = t.ringPoints[ringIdx * 3 + 1];
        const pz = t.ringPoints[ringIdx * 3 + 2];
        const halfWidth = 0.008 * (1.0 - i / TRAIL_CAPACITY);

        posArray[i * 6 + 0] = px - halfWidth;
        posArray[i * 6 + 1] = py;
        posArray[i * 6 + 2] = pz;

        posArray[i * 6 + 3] = px + halfWidth;
        posArray[i * 6 + 4] = py;
        posArray[i * 6 + 5] = pz;
      }
      t.geo.attributes.position.needsUpdate = true;
      t.mat.uniforms.uMaterializeAlpha.value = uMaterializeAlpha;
    }
    orbCoreInstanced.instanceMatrix.needsUpdate = true;
    orbHaloInstanced.instanceMatrix.needsUpdate = true;

    // Uniform updates
    saddleMat.uniforms.uTime.value = timeSec;
    saddleMat.uniforms.uTargetFlash.value = uClimaxFlash;
    saddleMat.uniforms.uMaterializeAlpha.value = uMaterializeAlpha;

    wireMat.uniforms.uTime.value = timeSec;
    wireMat.uniforms.uMaterializeAlpha.value = uMaterializeAlpha;

    pillarMat.uniforms.uTime.value = timeSec;
    pillarMat.uniforms.uClimaxFlash.value = uClimaxFlash;
    pillarMat.uniforms.uMaterializeAlpha.value = uMaterializeAlpha;

    ringMat.uniforms.uTime.value = timeSec;
    ringMat.uniforms.uMaterializeAlpha.value = uMaterializeAlpha;

    auraMat.uniforms.uTime.value = timeSec;
    auraMat.uniforms.uMaterializeAlpha.value = uMaterializeAlpha;
  }

  return {
    rootGroup,
    hitProxyMesh,
    telemetry,
    ribbonTrails,
    materials: [saddleMat, wireMat, pillarMat, orbCoreMat, orbHaloMat, ringMat, auraMat, ...ribbonTrails.map(t => t.mat)],
    update,
  };
}

// ============================================================================
// POD 4: Neural Network Hologram (ticket-005.md §2)
// ============================================================================
export function buildNeuralNetworkPod({ podSpec, floorY, applyStencilReject }) {
  const rootGroup = new THREE.Group();
  rootGroup.name = `PodGroup_${podSpec.id}`;
  rootGroup.position.set(podSpec.defaultOffset.x, floorY + podSpec.defaultOffset.yRel, podSpec.defaultOffset.z);

  const { emitterGroup, auraMesh, ringMat, auraMat } = createPodEmitterAndAura(podSpec.id, 0.38, applyStencilReject);
  rootGroup.add(emitterGroup);
  rootGroup.add(auraMesh);

  // Hit proxy
  const hitProxyMat = new THREE.MeshBasicMaterial({
    transparent: true,
    opacity: 0.0,
    depthWrite: false,
    depthTest: true,
    visible: false,
  });
  const hitProxyMesh = new THREE.Mesh(new THREE.SphereGeometry(0.56, 12, 10), hitProxyMat);
  hitProxyMesh.name = `HitProxy_${podSpec.id}`;
  hitProxyMesh.userData = { podId: podSpec.id, isMathPodProxy: true };
  rootGroup.add(hitProxyMesh);

  // 1. 3 Parallel Layered Holographic Projection Planes (z in {-0.24, 0.00, +0.24})
  const planeZCoords = [-0.24, 0.00, 0.24];
  const layerGlassMats = [];
  const layerBorderMats = [];

  for (let l = 0; l < 3; l++) {
    const glassMat = createPodHologramSurfaceMaterial({
      coreColor: HOLO_POD_PALETTE.coreDeep,
      midColor: HOLO_POD_PALETTE.midWireLow,
      highColor: HOLO_POD_PALETTE.highPulseGold,
      baseAlpha: 0.35,
      applyStencilReject,
    });
    layerGlassMats.push(glassMat);
    const glassMesh = new THREE.Mesh(new THREE.PlaneGeometry(0.44, 0.44), glassMat);
    glassMesh.position.z = planeZCoords[l];
    rootGroup.add(glassMesh);

    // Wireframe perimeter border
    const borderEdges = new THREE.EdgesGeometry(new THREE.BoxGeometry(0.44, 0.44, 0.005));
    const borderMat = createPodHologramLineMaterial({
      lineColor: HOLO_POD_PALETTE.midWireHigh,
      pulseColor: HOLO_POD_PALETTE.highPulseGold,
      baseAlpha: 0.65,
      applyStencilReject,
    });
    layerBorderMats.push(borderMat);
    const borderMesh = new THREE.LineSegments(borderEdges, borderMat);
    borderMesh.position.z = planeZCoords[l];
    rootGroup.add(borderMesh);
  }

  // 2. 29 Neurons (9 Input, 16 Hidden, 4 Output)
  const neuronPositions = [];
  // Input: 3x3 at z = -0.24
  for (let r = 0; r < 3; r++) {
    const y = -0.13 + r * 0.13;
    for (let c = 0; c < 3; c++) {
      const x = -0.13 + c * 0.13;
      neuronPositions.push(new THREE.Vector3(x, y, -0.24));
    }
  }
  // Hidden: 4x4 at z = 0.00
  const hiddenGrid = [-0.165, -0.055, 0.055, 0.165];
  for (let r = 0; r < 4; r++) {
    const y = hiddenGrid[r];
    for (let c = 0; c < 4; c++) {
      const x = hiddenGrid[c];
      neuronPositions.push(new THREE.Vector3(x, y, 0.00));
    }
  }
  // Output: 4 neurons at z = +0.24 (index 1 at y = +0.05 designated winning node)
  const outputYCoords = [0.15, 0.05, -0.05, -0.15];
  for (let i = 0; i < 4; i++) {
    neuronPositions.push(new THREE.Vector3(0.0, outputYCoords[i], 0.24));
  }

  const NEURON_COUNT = 29;
  const WINNING_NEURON_IDX = 26; // Index 9 + 16 + 1 = 26

  const neuronCoreMat = createPodSmokedCoreMaterial({ coreColor: HOLO_POD_PALETTE.coreDeep, opacity: 0.7, applyStencilReject });
  const neuronCoreInstanced = new THREE.InstancedMesh(new THREE.CapsuleGeometry(0.014, 0.012, 6, 12), neuronCoreMat, NEURON_COUNT);

  const neuronShellMat = createPodHologramSurfaceMaterial({
    coreColor: HOLO_POD_PALETTE.coreShadow,
    midColor: HOLO_POD_PALETTE.highEmissive,
    highColor: HOLO_POD_PALETTE.highPulseGold,
    baseAlpha: 0.90,
    applyStencilReject,
  });
  const neuronShellInstanced = new THREE.InstancedMesh(new THREE.SphereGeometry(0.025, 12, 10), neuronShellMat, NEURON_COUNT);
  const neuronStateAttr = new Float32Array(NEURON_COUNT * 4);
  neuronShellInstanced.geometry.setAttribute('aInstanceState', new THREE.BufferAttribute(neuronStateAttr, 4));

  // Hidden layer expanding scanline ripples (16 rings on Hidden plane z = 0.00)
  const rippleMat = createPodHologramSurfaceMaterial({
    coreColor: HOLO_POD_PALETTE.highEmissive,
    midColor: HOLO_POD_PALETTE.highPulseGold,
    highColor: HOLO_POD_PALETTE.highPulseGold,
    baseAlpha: 0.80,
    applyStencilReject,
  });
  const rippleInstanced = new THREE.InstancedMesh(new THREE.RingGeometry(0.024, 0.036, 20), rippleMat, 16);
  const rippleStateAttr = new Float32Array(16 * 4);
  rippleInstanced.geometry.setAttribute('aInstanceState', new THREE.BufferAttribute(rippleStateAttr, 4));

  const dummy = new THREE.Object3D();
  for (let i = 0; i < NEURON_COUNT; i++) {
    dummy.position.copy(neuronPositions[i]);
    dummy.updateMatrix();
    neuronCoreInstanced.setMatrixAt(i, dummy.matrix);
    neuronShellInstanced.setMatrixAt(i, dummy.matrix);
  }
  neuronCoreInstanced.instanceMatrix.needsUpdate = true;
  neuronShellInstanced.instanceMatrix.needsUpdate = true;
  rootGroup.add(neuronCoreInstanced);
  rootGroup.add(neuronShellInstanced);
  rootGroup.add(rippleInstanced);

  // Winning Output Target Lock Flare Reticle
  const reticleGroup = new THREE.Group();
  reticleGroup.position.set(0.0, 0.05, 0.24);
  const reticleRing = new THREE.Mesh(new THREE.RingGeometry(0.040, 0.046, 24), rippleMat);
  reticleGroup.add(reticleRing);
  rootGroup.add(reticleGroup);

  // 3. 208 Synapses: 9x16 + 16x4 = 208
  const SYNAPSE_COUNT = 9 * 16 + 16 * 4;
  const synapsePos = new Float32Array(SYNAPSE_COUNT * 2 * 3);
  const synapseMetric = new Float32Array(SYNAPSE_COUNT * 2 * 4);

  let synIdx = 0;
  // Layer 0: Input -> Hidden (144)
  for (let i = 0; i < 9; i++) {
    for (let h = 0; h < 16; h++) {
      const p1 = neuronPositions[i];
      const p2 = neuronPositions[9 + h];
      const weight = 0.25 + 0.75 * Math.abs(Math.sin(i * 3.1 + h * 7.7));
      const isWin = (i === 4 && (h === 5 || h === 6));

      synapsePos[synIdx * 6 + 0] = p1.x; synapsePos[synIdx * 6 + 1] = p1.y; synapsePos[synIdx * 6 + 2] = p1.z;
      synapsePos[synIdx * 6 + 3] = p2.x; synapsePos[synIdx * 6 + 4] = p2.y; synapsePos[synIdx * 6 + 5] = p2.z;

      synapseMetric[synIdx * 8 + 0] = 0.0;
      synapseMetric[synIdx * 8 + 1] = weight;
      synapseMetric[synIdx * 8 + 2] = 0.0; // layer 0
      synapseMetric[synIdx * 8 + 3] = isWin ? 1.0 : 0.0;

      synapseMetric[synIdx * 8 + 4] = 1.0;
      synapseMetric[synIdx * 8 + 5] = weight;
      synapseMetric[synIdx * 8 + 6] = 0.0;
      synapseMetric[synIdx * 8 + 7] = isWin ? 1.0 : 0.0;
      synIdx++;
    }
  }

  // Layer 1: Hidden -> Output (64)
  for (let h = 0; h < 16; h++) {
    for (let o = 0; o < 4; o++) {
      const p1 = neuronPositions[9 + h];
      const p2 = neuronPositions[25 + o];
      const weight = 0.25 + 0.75 * Math.abs(Math.cos(h * 2.3 + o * 5.1));
      const isWin = ((h === 5 || h === 6) && o === 1);

      synapsePos[synIdx * 6 + 0] = p1.x; synapsePos[synIdx * 6 + 1] = p1.y; synapsePos[synIdx * 6 + 2] = p1.z;
      synapsePos[synIdx * 6 + 3] = p2.x; synapsePos[synIdx * 6 + 4] = p2.y; synapsePos[synIdx * 6 + 5] = p2.z;

      synapseMetric[synIdx * 8 + 0] = 0.0;
      synapseMetric[synIdx * 8 + 1] = weight;
      synapseMetric[synIdx * 8 + 2] = 1.0; // layer 1
      synapseMetric[synIdx * 8 + 3] = isWin ? 1.0 : 0.0;

      synapseMetric[synIdx * 8 + 4] = 1.0;
      synapseMetric[synIdx * 8 + 5] = weight;
      synapseMetric[synIdx * 8 + 6] = 1.0;
      synapseMetric[synIdx * 8 + 7] = isWin ? 1.0 : 0.0;
      synIdx++;
    }
  }

  const synapseGeo = new THREE.BufferGeometry();
  synapseGeo.setAttribute('position', new THREE.BufferAttribute(synapsePos, 3));
  synapseGeo.setAttribute('aSynapseMetric', new THREE.BufferAttribute(synapseMetric, 4));

  const synapseMat = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0.0 },
      uWaveLayer0: { value: 0.0 },
      uWaveLayer1: { value: 0.0 },
      uClimaxFlash: { value: 0.0 },
      uMaterializeAlpha: { value: 1.0 },
      uInterference: { value: 0.0 },
      uInterferenceBoost: { value: 0.0 },
      uWalkGlitch: { value: 0.0 },
      uGlitchClockHz: { value: 34.0 },
      uMaxSliceOffset: { value: 0.068 },
      uMaxVerticalJitter: { value: 0.015 },
      uLineColor: { value: new THREE.Color(HOLO_POD_PALETTE.midWireLow) },
      uPulseColor: { value: new THREE.Color(HOLO_POD_PALETTE.highPulseGold) },
    },
    vertexShader: `
      attribute vec4 aSynapseMetric; // alongBeam, weight, layerIndex, isWin
      varying vec4 vSynapseMetric;
      varying vec3 vWorldPos;

      uniform float uTime;
      uniform float uInterference;
      uniform float uInterferenceBoost;
      uniform float uWalkGlitch;
      uniform float uGlitchClockHz;
      uniform float uMaxSliceOffset;
      uniform float uMaxVerticalJitter;

      void main() {
        vSynapseMetric = aSynapseMetric;
        vec4 worldPos = modelMatrix * vec4(position, 1.0);

        float gEff = clamp(max(max(uInterference, uInterferenceBoost), uWalkGlitch), 0.0, 1.0);
        if (gEff > 0.001) {
          float glitchTick = floor(uTime * uGlitchClockHz);
          float bandDensity = mix(10.0, 16.0, gEff);
          float sliceBand = floor((worldPos.y + 4.0) * bandDensity + fract(glitchTick * 0.173));
          float sliceHashX = fract(sin(sliceBand * 127.1 + glitchTick * 311.7) * 43758.5453);
          float sliceHashZ = fract(sin(sliceBand * 269.5 + glitchTick * 183.3) * 43758.5453);
          float activeMask = step(0.26 - 0.14 * gEff, sliceHashX);
          float signedX = (sliceHashX * 2.0 - 1.0) * activeMask;
          float signedZ = (sliceHashZ * 2.0 - 1.0) * activeMask;
          worldPos.x += signedX * uMaxSliceOffset * gEff;
          worldPos.z += signedZ * (uMaxSliceOffset * 0.65) * gEff;
          float vJitterHash = fract(sin((sliceBand + 7.0) * 91.7 + glitchTick * 419.2) * 43758.5453);
          worldPos.y += (vJitterHash * 2.0 - 1.0) * uMaxVerticalJitter * gEff;
        }

        vWorldPos = worldPos.xyz;
        gl_Position = projectionMatrix * viewMatrix * worldPos;
      }
    `,
    fragmentShader: `
      uniform float uTime;
      uniform float uWaveLayer0;
      uniform float uWaveLayer1;
      uniform float uClimaxFlash;
      uniform float uMaterializeAlpha;
      uniform float uInterference;
      uniform float uInterferenceBoost;
      uniform float uWalkGlitch;
      uniform float uGlitchClockHz;
      uniform vec3 uLineColor;
      uniform vec3 uPulseColor;

      varying vec4 vSynapseMetric;
      varying vec3 vWorldPos;

      void main() {
        float along = vSynapseMetric.x;
        float weight = vSynapseMetric.y;
        float layerIdx = vSynapseMetric.z;
        float isWin = vSynapseMetric.w;

        float gEff = clamp(max(max(uInterference, uInterferenceBoost), uWalkGlitch), 0.0, 1.0);
        float waveProg = (layerIdx < 0.5) ? uWaveLayer0 : uWaveLayer1;
        float pulse = exp(-50.0 * pow(along - waveProg, 2.0)) * weight;

        float h1 = sin(uTime * 113.097);
        float h2 = sin(uTime * 270.177 + 1.13);
        float h3 = cos(uTime * 446.106 + 2.41);
        float harmonicWave = 0.5 + 0.5 * (0.45 * h1 + 0.35 * h2 + 0.20 * h3);
        float sputterGain = mix(1.0, mix(0.35, 1.65, harmonicWave), gEff);

        vec3 hotGold = vec3(1.0, 0.82, 0.40);
        vec3 col = mix(uLineColor, uPulseColor, clamp(pulse * 0.9 + isWin * uClimaxFlash * 0.8, 0.0, 1.0));
        col = mix(col, hotGold, gEff * 0.5) * sputterGain;

        float alphaBase = (0.20 * weight + pulse * 0.85 + isWin * uClimaxFlash * 0.6) * uMaterializeAlpha;
        float alphaFloor = mix(0.12, 0.22, gEff);
        float alpha = clamp(alphaBase * mix(1.0, 0.55 + 0.75 * harmonicWave, gEff), alphaFloor, 1.0);

        gl_FragColor = vec4(col * alpha, alpha);
      }
    `,
    transparent: true,
    depthTest: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  if (applyStencilReject) applyStencilReject(synapseMat);

  const synapseMesh = new THREE.LineSegments(synapseGeo, synapseMat);
  rootGroup.add(synapseMesh);

  const telemetry = {
    waveLayer0: 0.0,
    waveLayer1: 0.0,
    winningNodeFlare: 0.0,
    activeHiddenRipples: 0,
  };

  function update(dt, timeSec, state) {
    const { stage, stageProgress, uMaterializeAlpha, uClimaxFlash } = state;

    let w0 = 0.0;
    let w1 = 0.0;
    let winFlare = 0.0;
    let activeRipples = 0;

    if (stage === 'spawn') {
      w0 = 0.0;
      w1 = 0.0;
      winFlare = 0.0;
    } else if (stage === 'animate') {
      // Sub-phase 1 (0.00..0.52): Wave 0 sweeps Input -> Hidden
      if (stageProgress < 0.52) {
        w0 = stageProgress / 0.52;
        w1 = 0.0;
        activeRipples = Math.floor(w0 * 16);
      } else {
        // Sub-phase 2 (0.48..1.00): Wave 1 sweeps Hidden -> Output
        w0 = 1.0;
        w1 = (stageProgress - 0.48) / 0.52;
        activeRipples = 16;
      }
    } else if (stage === 'climax') {
      w0 = 1.0;
      w1 = 1.0;
      winFlare = uClimaxFlash;
      activeRipples = 16;
    } else { // dissolve
      w0 = 0.0;
      w1 = 0.0;
      winFlare = 0.0;
      activeRipples = 0;
    }

    telemetry.waveLayer0 = w0;
    telemetry.waveLayer1 = w1;
    telemetry.winningNodeFlare = winFlare;
    telemetry.activeHiddenRipples = activeRipples;

    // Update hidden ripples
    for (let h = 0; h < 16; h++) {
      dummy.position.copy(neuronPositions[9 + h]);
      const isRippleActive = (h < activeRipples);
      const rScale = isRippleActive ? (0.8 + 0.4 * Math.sin(timeSec * 4.0 + h)) : 0.01;
      dummy.scale.set(rScale, rScale, rScale);
      dummy.updateMatrix();
      rippleInstanced.setMatrixAt(h, dummy.matrix);
      rippleStateAttr[h * 4 + 0] = isRippleActive ? 1.0 : 0.0;
      rippleStateAttr[h * 4 + 3] = isRippleActive ? uMaterializeAlpha : 0.0;
    }
    rippleInstanced.instanceMatrix.needsUpdate = true;
    rippleInstanced.geometry.attributes.aInstanceState.needsUpdate = true;

    // Update neuron flares
    for (let i = 0; i < NEURON_COUNT; i++) {
      let flare = 0.0;
      if (i < 9) { // input
        flare = 0.5 + 0.5 * Math.sin(timeSec * 3.0 + i);
      } else if (i < 25) { // hidden
        flare = (i - 9 < activeRipples) ? 0.8 : 0.1;
      } else if (i === WINNING_NEURON_IDX) { // winning node
        flare = (w1 >= 0.85) ? (0.8 + winFlare * 0.8) : 0.0;
      }
      neuronStateAttr[i * 4 + 0] = flare;
      neuronStateAttr[i * 4 + 1] = (i === WINNING_NEURON_IDX) ? 1.0 : 0.0;
      neuronStateAttr[i * 4 + 3] = uMaterializeAlpha;
    }
    neuronShellInstanced.geometry.attributes.aInstanceState.needsUpdate = true;

    // Reticle spin & scale
    reticleGroup.rotation.z = timeSec * 2.2;
    const rScale = 1.0 + winFlare * 0.6;
    reticleGroup.scale.set(rScale, rScale, rScale);

    // Uniform updates
    synapseMat.uniforms.uTime.value = timeSec;
    synapseMat.uniforms.uWaveLayer0.value = w0;
    synapseMat.uniforms.uWaveLayer1.value = w1;
    synapseMat.uniforms.uClimaxFlash.value = winFlare;
    synapseMat.uniforms.uMaterializeAlpha.value = uMaterializeAlpha;

    ringMat.uniforms.uTime.value = timeSec;
    ringMat.uniforms.uMaterializeAlpha.value = uMaterializeAlpha;

    auraMat.uniforms.uTime.value = timeSec;
    auraMat.uniforms.uMaterializeAlpha.value = uMaterializeAlpha;
  }

  return {
    rootGroup,
    hitProxyMesh,
    telemetry,
    materials: [neuronCoreMat, neuronShellMat, rippleMat, synapseMat, ringMat, auraMat, ...layerGlassMats, ...layerBorderMats],
    update,
  };
}

// ============================================================================
// POD 5: Clustering Algorithm Hologram (ticket-006.md §1)
// ============================================================================
export function buildClusteringPod({ podSpec, floorY, applyStencilReject }) {
  const rootGroup = new THREE.Group();
  rootGroup.name = `PodGroup_${podSpec.id}`;
  rootGroup.position.set(podSpec.defaultOffset.x, floorY + podSpec.defaultOffset.yRel, podSpec.defaultOffset.z);

  const { emitterGroup, auraMesh, ringMat, auraMat } = createPodEmitterAndAura(podSpec.id, 0.38, applyStencilReject);
  rootGroup.add(emitterGroup);
  rootGroup.add(auraMesh);

  // Hit proxy
  const hitProxyMat = new THREE.MeshBasicMaterial({
    transparent: true,
    opacity: 0.0,
    depthWrite: false,
    depthTest: true,
    visible: false,
  });
  const hitProxyMesh = new THREE.Mesh(new THREE.SphereGeometry(0.56, 12, 10), hitProxyMat);
  hitProxyMesh.name = `HitProxy_${podSpec.id}`;
  hitProxyMesh.userData = { podId: podSpec.id, isMathPodProxy: true };
  rootGroup.add(hitProxyMesh);

  // 1. Cylindrical containment cage (radius = 0.38m, height = 0.52m)
  const cageSegments = [];
  const CAGE_RADIUS = 0.38;
  const CAGE_HALF_H = 0.26;
  const numCagePts = 24;
  for (let i = 0; i < numCagePts; i++) {
    const a1 = (i / numCagePts) * Math.PI * 2;
    const a2 = ((i + 1) / numCagePts) * Math.PI * 2;
    // Top ring
    cageSegments.push(Math.cos(a1) * CAGE_RADIUS, CAGE_HALF_H, Math.sin(a1) * CAGE_RADIUS);
    cageSegments.push(Math.cos(a2) * CAGE_RADIUS, CAGE_HALF_H, Math.sin(a2) * CAGE_RADIUS);
    // Bottom ring
    cageSegments.push(Math.cos(a1) * CAGE_RADIUS, -CAGE_HALF_H, Math.sin(a1) * CAGE_RADIUS);
    cageSegments.push(Math.cos(a2) * CAGE_RADIUS, -CAGE_HALF_H, Math.sin(a2) * CAGE_RADIUS);
    // 8 vertical struts
    if (i % 3 === 0) {
      cageSegments.push(Math.cos(a1) * CAGE_RADIUS, -CAGE_HALF_H, Math.sin(a1) * CAGE_RADIUS);
      cageSegments.push(Math.cos(a1) * CAGE_RADIUS, CAGE_HALF_H, Math.sin(a1) * CAGE_RADIUS);
    }
  }
  const cageGeo = new THREE.BufferGeometry();
  cageGeo.setAttribute('position', new THREE.Float32BufferAttribute(cageSegments, 3));
  const cageMat = createPodHologramLineMaterial({
    lineColor: HOLO_POD_PALETTE.midWireLow,
    baseAlpha: 0.40,
    dashFrequency: 16.0,
    applyStencilReject,
  });
  const cageMesh = new THREE.LineSegments(cageGeo, cageMat);
  rootGroup.add(cageMesh);

  // 2. 3 Centroid Beacons at C0, C1, C2
  const targetCentroids = [
    new THREE.Vector3(-0.17, 0.08, -0.10),
    new THREE.Vector3(0.18, 0.04, -0.08),
    new THREE.Vector3(0.00, -0.11, 0.17),
  ];
  const currentCentroids = [new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()];

  const centroidBeacons = [];
  const beaconMat = createPodHologramSurfaceMaterial({
    coreColor: HOLO_POD_PALETTE.highEmissive,
    midColor: HOLO_POD_PALETTE.highPulseGold,
    highColor: HOLO_POD_PALETTE.highPulseGold,
    baseAlpha: 0.95,
    applyStencilReject,
  });

  for (let c = 0; c < 3; c++) {
    const bGroup = new THREE.Group();
    // Octahedron wireframe
    const octEdges = new THREE.EdgesGeometry(new THREE.OctahedronGeometry(0.038, 0));
    const octLines = new THREE.LineSegments(octEdges, cageMat);
    bGroup.add(octLines);

    // Dual-ring gimbal
    const gimbal1 = new THREE.Mesh(new THREE.RingGeometry(0.044, 0.050, 20), beaconMat);
    const gimbal2 = new THREE.Mesh(new THREE.RingGeometry(0.044, 0.050, 20), beaconMat);
    gimbal2.rotation.y = Math.PI / 2;
    bGroup.add(gimbal1);
    bGroup.add(gimbal2);

    // Sonar ripple ring
    const sonarRing = new THREE.Mesh(new THREE.RingGeometry(0.04, 0.055, 24), beaconMat);
    sonarRing.rotation.x = Math.PI / 2;
    bGroup.add(sonarRing);

    rootGroup.add(bGroup);
    centroidBeacons.push({ group: bGroup, octLines, gimbal1, gimbal2, sonarRing });
  }

  // Inter-centroid tether beam triangle
  const tetherPos = new Float32Array(3 * 2 * 3);
  const tetherGeo = new THREE.BufferGeometry();
  tetherGeo.setAttribute('position', new THREE.BufferAttribute(tetherPos, 3).setUsage(THREE.DynamicDrawUsage));
  const tetherMetric = new Float32Array(3 * 2 * 4);
  for (let i = 0; i < 6; i++) {
    tetherMetric[i * 4 + 0] = (i % 2);
    tetherMetric[i * 4 + 1] = 1.0;
    tetherMetric[i * 4 + 2] = 1.0;
    tetherMetric[i * 4 + 3] = 0.0;
  }
  tetherGeo.setAttribute('aLineMetric', new THREE.BufferAttribute(tetherMetric, 4));
  const tetherMat = createPodHologramLineMaterial({
    lineColor: HOLO_POD_PALETTE.highPulseGold,
    pulseColor: HOLO_POD_PALETTE.highPulseGold,
    baseAlpha: 0.90,
    dashFrequency: 16.0,
    dashSpeed: 4.0,
    applyStencilReject,
  });
  const tetherMesh = new THREE.LineSegments(tetherGeo, tetherMat);
  rootGroup.add(tetherMesh);

  // 3. 3 Fresnel Ellipsoid Containment Shells
  const clusterShells = [];
  for (let c = 0; c < 3; c++) {
    const sGroup = new THREE.Group();
    const coreMat = createPodSmokedCoreMaterial({ coreColor: HOLO_POD_PALETTE.coreDeep, opacity: 0.45, applyStencilReject });
    const coreMesh = new THREE.Mesh(new THREE.IcosahedronGeometry(1.0, 2), coreMat);

    const outerMat = createPodHologramSurfaceMaterial({
      coreColor: HOLO_POD_PALETTE.coreShadow,
      midColor: HOLO_POD_PALETTE.midWireLow,
      highColor: HOLO_POD_PALETTE.highPulseGold,
      baseAlpha: 0.65,
      fresnelExponent: 2.0,
      applyStencilReject,
    });
    const outerMesh = new THREE.Mesh(new THREE.IcosahedronGeometry(1.0, 2), outerMat);

    const wireEdges = new THREE.EdgesGeometry(new THREE.IcosahedronGeometry(1.0, 1));
    const wireMesh = new THREE.LineSegments(wireEdges, cageMat);

    sGroup.add(coreMesh);
    sGroup.add(outerMesh);
    sGroup.add(wireMesh);
    sGroup.scale.set(0.145, 0.115, 0.135);
    rootGroup.add(sGroup);
    clusterShells.push({ group: sGroup, coreMat, outerMat, outerMesh });
  }

  // 4. 120 Data particles (40 per cluster)
  const PARTICLE_COUNT = 120;
  const chaosPositions = new Float32Array(PARTICLE_COUNT * 3);
  const clusterPositions = new Float32Array(PARTICLE_COUNT * 3);
  const clusterIds = new Uint8Array(PARTICLE_COUNT);

  // Seed deterministic chaos positions & clustered offsets
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const cId = i % 3;
    clusterIds[i] = cId;

    // Chaos positions in sphere r = 0.28
    const r = 0.08 + Math.sqrt(Math.abs(Math.sin(i * 12.3))) * 0.22;
    const theta = Math.sin(i * 4.5) * Math.PI * 2;
    const phiAngle = Math.cos(i * 6.7) * Math.PI;
    chaosPositions[i * 3 + 0] = r * Math.sin(phiAngle) * Math.cos(theta);
    chaosPositions[i * 3 + 1] = r * Math.sin(phiAngle) * Math.sin(theta);
    chaosPositions[i * 3 + 2] = r * Math.cos(phiAngle);

    // Cluster positions around target centroid
    const cPos = targetCentroids[cId];
    const offX = Math.sin(i * 8.9) * 0.075;
    const offY = Math.cos(i * 5.3) * 0.055;
    const offZ = Math.sin(i * 11.1) * 0.065;
    clusterPositions[i * 3 + 0] = cPos.x + offX;
    clusterPositions[i * 3 + 1] = cPos.y + offY;
    clusterPositions[i * 3 + 2] = cPos.z + offZ;
  }

  const particleMat = createPodHologramSurfaceMaterial({
    coreColor: HOLO_POD_PALETTE.midWireLow,
    midColor: HOLO_POD_PALETTE.highEmissive,
    highColor: HOLO_POD_PALETTE.highPulseGold,
    baseAlpha: 0.85,
    applyStencilReject,
  });
  const particleInstanced = new THREE.InstancedMesh(new THREE.OctahedronGeometry(0.011, 0), particleMat, PARTICLE_COUNT);
  const particleStateAttr = new Float32Array(PARTICLE_COUNT * 4);
  particleInstanced.geometry.setAttribute('aInstanceState', new THREE.BufferAttribute(particleStateAttr, 4));
  rootGroup.add(particleInstanced);

  const dummy = new THREE.Object3D();
  const telemetry = {
    convergenceProgress: 0.0,
    tetherBeamIntensity: 0.0,
    activeClusters: 3,
  };

  function update(dt, timeSec, state) {
    const { stage, stageProgress, uMaterializeAlpha, uClimaxFlash } = state;

    let conv = 0.0;
    let sonarRad = 1.0;
    let tetherInt = 0.0;

    if (stage === 'spawn') {
      conv = 0.0;
      sonarRad = 1.0 + stageProgress * 2.5;
      tetherInt = 0.0;
      for (let c = 0; c < 3; c++) {
        // Centroids drop from y = +0.26
        const dropY = 0.26 * (1.0 - stageProgress) + targetCentroids[c].y * stageProgress;
        currentCentroids[c].copy(targetCentroids[c]).y = dropY;
      }
    } else if (stage === 'animate') {
      conv = stageProgress;
      sonarRad = 1.0;
      tetherInt = Math.max(0.0, (stageProgress - 0.5) / 0.5);
      for (let c = 0; c < 3; c++) currentCentroids[c].copy(targetCentroids[c]);
    } else if (stage === 'climax') {
      conv = 1.0;
      sonarRad = 1.0;
      tetherInt = 1.0;
      for (let c = 0; c < 3; c++) currentCentroids[c].copy(targetCentroids[c]);
    } else { // dissolve
      conv = 1.0 - stageProgress;
      sonarRad = 1.0;
      tetherInt = 0.0;
      for (let c = 0; c < 3; c++) currentCentroids[c].copy(targetCentroids[c]);
    }

    telemetry.convergenceProgress = conv;
    telemetry.tetherBeamIntensity = tetherInt;

    // Update centroids
    for (let c = 0; c < 3; c++) {
      const b = centroidBeacons[c];
      b.group.position.copy(currentCentroids[c]);
      b.group.rotation.y = timeSec * 1.8 + c * 2.0;
      b.sonarRing.scale.set(sonarRad, sonarRad, sonarRad);

      // Shells expand around centroids
      const s = clusterShells[c];
      s.group.position.copy(currentCentroids[c]);
      const sScale = Math.max(0.01, conv * (1.0 + uClimaxFlash * 0.2));
      s.group.scale.set(0.145 * sScale, 0.115 * sScale, 0.135 * sScale);
      s.outerMat.uniforms.uClimaxFlash.value = uClimaxFlash;
      s.outerMat.uniforms.uMaterializeAlpha.value = uMaterializeAlpha;
    }

    // Update tether beam triangle lines
    const tPos = tetherGeo.attributes.position;
    const c0 = currentCentroids[0];
    const c1 = currentCentroids[1];
    const c2 = currentCentroids[2];
    tPos.setXYZ(0, c0.x, c0.y, c0.z); tPos.setXYZ(1, c1.x, c1.y, c1.z);
    tPos.setXYZ(2, c1.x, c1.y, c1.z); tPos.setXYZ(3, c2.x, c2.y, c2.z);
    tPos.setXYZ(4, c2.x, c2.y, c2.z); tPos.setXYZ(5, c0.x, c0.y, c0.z);
    tPos.needsUpdate = true;
    tetherMat.uniforms.uMaterializeAlpha.value = tetherInt * uMaterializeAlpha;

    // Update 120 particles
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const chX = chaosPositions[i * 3 + 0];
      const chY = chaosPositions[i * 3 + 1];
      const chZ = chaosPositions[i * 3 + 2];

      const clX = clusterPositions[i * 3 + 0];
      const clY = clusterPositions[i * 3 + 1];
      const clZ = clusterPositions[i * 3 + 2];

      const curX = chX * (1.0 - conv) + clX * conv;
      const curY = chY * (1.0 - conv) + clY * conv;
      const curZ = chZ * (1.0 - conv) + clZ * conv;

      dummy.position.set(curX, curY, curZ);
      dummy.scale.setScalar(1.0 + 0.2 * Math.sin(timeSec * 3.0 + i));
      dummy.updateMatrix();
      particleInstanced.setMatrixAt(i, dummy.matrix);

      particleStateAttr[i * 4 + 0] = conv * 0.8 + uClimaxFlash * 0.8;
      particleStateAttr[i * 4 + 1] = clusterIds[i] / 2.0;
      particleStateAttr[i * 4 + 3] = uMaterializeAlpha;
    }
    particleInstanced.instanceMatrix.needsUpdate = true;
    particleInstanced.geometry.attributes.aInstanceState.needsUpdate = true;

    // Uniform updates
    particleMat.uniforms.uTime.value = timeSec;
    particleMat.uniforms.uMaterializeAlpha.value = uMaterializeAlpha;
    particleMat.uniforms.uClimaxFlash.value = uClimaxFlash;

    beaconMat.uniforms.uTime.value = timeSec;
    beaconMat.uniforms.uMaterializeAlpha.value = uMaterializeAlpha;

    ringMat.uniforms.uTime.value = timeSec;
    ringMat.uniforms.uMaterializeAlpha.value = uMaterializeAlpha;

    auraMat.uniforms.uTime.value = timeSec;
    auraMat.uniforms.uMaterializeAlpha.value = uMaterializeAlpha;
  }

  return {
    rootGroup,
    hitProxyMesh,
    telemetry,
    materials: [cageMat, beaconMat, tetherMat, particleMat, ringMat, auraMat, ...clusterShells.map(s => s.outerMat), ...clusterShells.map(s => s.coreMat)],
    update,
  };
}

// ============================================================================
// POD 6: Anomaly Detection Hologram (ticket-006.md §2)
// ============================================================================
export function buildAnomalyDetectionPod({ podSpec, floorY, glyphAtlas, applyStencilReject }) {
  const rootGroup = new THREE.Group();
  rootGroup.name = `PodGroup_${podSpec.id}`;
  rootGroup.position.set(podSpec.defaultOffset.x, floorY + podSpec.defaultOffset.yRel, podSpec.defaultOffset.z);

  const { emitterGroup, auraMesh, ringMat, auraMat } = createPodEmitterAndAura(podSpec.id, 0.38, applyStencilReject);
  rootGroup.add(emitterGroup);
  rootGroup.add(auraMesh);

  // Hit proxy
  const hitProxyMat = new THREE.MeshBasicMaterial({
    transparent: true,
    opacity: 0.0,
    depthWrite: false,
    depthTest: true,
    visible: false,
  });
  const hitProxyMesh = new THREE.Mesh(new THREE.SphereGeometry(0.56, 12, 10), hitProxyMat);
  hitProxyMesh.name = `HitProxy_${podSpec.id}`;
  hitProxyMesh.userData = { podId: podSpec.id, isMathPodProxy: true };
  rootGroup.add(hitProxyMesh);

  // 1. Rotating Cylindrical Scanner Ring & Inward Radial Laser Curtain
  const scannerRingGroup = new THREE.Group();
  const ringCylEdges = new THREE.EdgesGeometry(new THREE.CylinderGeometry(0.36, 0.36, 0.08, 24, 1, true));
  const ringCylMat = createPodHologramLineMaterial({
    lineColor: HOLO_POD_PALETTE.midWireHigh,
    pulseColor: HOLO_POD_PALETTE.highPulseGold,
    baseAlpha: 0.85,
    dashFrequency: 16.0,
    applyStencilReject,
  });
  const ringCylMesh = new THREE.LineSegments(ringCylEdges, ringCylMat);
  scannerRingGroup.add(ringCylMesh);

  // Radial Laser Curtain disc + 12 radial spokes
  const curtainDiscMat = createPodHologramSurfaceMaterial({
    coreColor: HOLO_POD_PALETTE.coreDeep,
    midColor: HOLO_POD_PALETTE.highEmissive,
    highColor: HOLO_POD_PALETTE.highPulseGold,
    baseAlpha: 0.50,
    applyStencilReject,
  });
  const curtainDisc = new THREE.Mesh(new THREE.RingGeometry(0.03, 0.355, 32, 2), curtainDiscMat);
  curtainDisc.rotation.x = Math.PI / 2;
  scannerRingGroup.add(curtainDisc);

  const spokeSegments = [];
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    spokeSegments.push(Math.cos(a) * 0.04, 0, Math.sin(a) * 0.04);
    spokeSegments.push(Math.cos(a) * 0.35, 0, Math.sin(a) * 0.35);
  }
  const spokeGeo = new THREE.BufferGeometry();
  spokeGeo.setAttribute('position', new THREE.Float32BufferAttribute(spokeSegments, 3));
  const spokeMesh = new THREE.LineSegments(spokeGeo, ringCylMat);
  scannerRingGroup.add(spokeMesh);
  rootGroup.add(scannerRingGroup);

  // 2. 96 Stream Particles (94 Normal + 2 Rogue Outliers)
  const PARTICLE_COUNT = 96;
  const particleMat = createPodHologramSurfaceMaterial({
    coreColor: HOLO_POD_PALETTE.midWireLow,
    midColor: HOLO_POD_PALETTE.highEmissive,
    highColor: HOLO_POD_PALETTE.highPulseGold,
    baseAlpha: 0.85,
    applyStencilReject,
  });
  const streamInstanced = new THREE.InstancedMesh(new THREE.SphereGeometry(0.012, 8, 6), particleMat, PARTICLE_COUNT);
  const streamStateAttr = new Float32Array(PARTICLE_COUNT * 4);
  streamInstanced.geometry.setAttribute('aInstanceState', new THREE.BufferAttribute(streamStateAttr, 4));
  rootGroup.add(streamInstanced);

  // Outlier target positions
  const outlierTargets = [
    new THREE.Vector3(-0.24, 0.08, 0.12),
    new THREE.Vector3(0.23, -0.06, -0.11),
  ];
  const currentOutlierPositions = [new THREE.Vector3(), new THREE.Vector3()];

  // 3. 2 3D HUD Reticles & Quarantine Cages
  const rogueUnits = [];
  for (let r = 0; r < 2; r++) {
    const uGroup = new THREE.Group();

    // Rotating corner brackets
    const bGeo = new THREE.BufferGeometry();
    const bPts = new Float32Array([
      -0.035,  0.035, 0,  -0.020,  0.035, 0,
      -0.035,  0.035, 0,  -0.035,  0.020, 0,
       0.035,  0.035, 0,   0.020,  0.035, 0,
       0.035,  0.035, 0,   0.035,  0.020, 0,
      -0.035, -0.035, 0,  -0.020, -0.035, 0,
      -0.035, -0.035, 0,  -0.035, -0.020, 0,
       0.035, -0.035, 0,   0.020, -0.035, 0,
       0.035, -0.035, 0,   0.035, -0.020, 0,
    ]);
    bGeo.setAttribute('position', new THREE.BufferAttribute(bPts, 3));
    const reticleLines = new THREE.LineSegments(bGeo, ringCylMat);
    uGroup.add(reticleLines);

    // Procedural HUD readout quad from glyph atlas
    const hudMat = createPodGlyphMaterial({ atlasTexture: glyphAtlas.texture, applyStencilReject });
    const hudQuad = new THREE.Mesh(new THREE.PlaneGeometry(0.12, 0.12), hudMat);
    hudQuad.position.set(0.08, 0.08, 0);
    const hudUv = glyphAtlas.cells.anomalyHUD;
    hudMat.uniforms.uUvRect.value.set(hudUv[0], hudUv[1], hudUv[2], hudUv[3]);
    uGroup.add(hudQuad);

    // Wireframe quarantine cages: Icosahedron + Box
    const cageIco = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.IcosahedronGeometry(0.052, 0)), ringCylMat);
    const cageBox = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(0.068, 0.068, 0.068)), ringCylMat);
    uGroup.add(cageIco);
    uGroup.add(cageBox);

    // Dashed lock-on tether line from ring origin to outlier
    const tetherGeo = new THREE.BufferGeometry();
    const tetherPts = new Float32Array([0, 0, 0, 0, 0, 0]);
    tetherGeo.setAttribute('position', new THREE.BufferAttribute(tetherPts, 3).setUsage(THREE.DynamicDrawUsage));
    const tetherLine = new THREE.LineSegments(tetherGeo, ringCylMat);
    rootGroup.add(tetherLine);

    uGroup.visible = false;
    rootGroup.add(uGroup);

    rogueUnits.push({
      group: uGroup,
      reticleLines,
      cageIco,
      cageBox,
      hudQuad,
      hudMat,
      tetherLine,
      tetherGeo,
    });
  }

  // 4. 32 Dispersing Holographic Vaporization Sparks (16 per outlier)
  const SPARK_COUNT = 32;
  const sparkMat = createPodHologramSurfaceMaterial({
    coreColor: HOLO_POD_PALETTE.highPulseGold,
    midColor: HOLO_POD_PALETTE.highPulseGold,
    highColor: HOLO_POD_PALETTE.highPulseGold,
    baseAlpha: 0.95,
    applyStencilReject,
  });
  const sparkInstanced = new THREE.InstancedMesh(new THREE.OctahedronGeometry(0.008, 0), sparkMat, SPARK_COUNT);
  const sparkDirs = new Float32Array(SPARK_COUNT * 3);
  for (let i = 0; i < SPARK_COUNT; i++) {
    const v = new THREE.Vector3(
      Math.sin(i * 3.7),
      Math.cos(i * 5.1),
      Math.sin(i * 7.3)
    ).normalize();
    sparkDirs[i * 3 + 0] = v.x;
    sparkDirs[i * 3 + 1] = v.y;
    sparkDirs[i * 3 + 2] = v.z;
  }
  rootGroup.add(sparkInstanced);

  const dummy = new THREE.Object3D();
  const telemetry = {
    isolatedCount: 0,
    scannerAngle: 0.0,
    purgeProgress: 0.0,
  };

  function update(dt, timeSec, state) {
    const { stage, stageProgress, uMaterializeAlpha, uClimaxFlash } = state;

    // Scanner ring continuous rotation at 1.6 rad/s
    scannerRingGroup.rotation.y = timeSec * 1.6;
    telemetry.scannerAngle = scannerRingGroup.rotation.y;

    let isolatedCount = 0;
    let purgeProgress = 0.0;
    let outlierEject = 0.0;

    if (stage === 'spawn') {
      isolatedCount = 0;
      purgeProgress = 0.0;
      outlierEject = 0.0;
    } else if (stage === 'animate') {
      outlierEject = Math.min(1.0, stageProgress / 0.45);
      isolatedCount = stageProgress >= 0.30 ? 2 : 0;
      purgeProgress = 0.0;
    } else if (stage === 'climax') {
      outlierEject = 1.0;
      isolatedCount = 2;
      purgeProgress = stageProgress;
    } else { // dissolve
      outlierEject = 0.0;
      isolatedCount = 0;
      purgeProgress = 1.0;
    }

    telemetry.isolatedCount = isolatedCount;
    telemetry.purgeProgress = purgeProgress;

    // Update 94 normal stream particles in harmonic helix (r <= 0.065m, y in [-0.32, +0.32])
    for (let i = 0; i < 94; i++) {
      const tNorm = ((timeSec * 0.4 + i / 94.0) % 1.0 + 1.0) % 1.0;
      const y = -0.32 + tNorm * 0.64;
      const helixAngle = tNorm * Math.PI * 8.0 + (i % 3) * (Math.PI * 2 / 3);
      const rHelix = 0.045 + 0.015 * Math.sin(tNorm * Math.PI * 4.0);
      const x = Math.cos(helixAngle) * rHelix;
      const z = Math.sin(helixAngle) * rHelix;

      dummy.position.set(x, y, z);
      dummy.scale.setScalar(1.0);
      dummy.updateMatrix();
      streamInstanced.setMatrixAt(i, dummy.matrix);

      streamStateAttr[i * 4 + 0] = 0.0;
      streamStateAttr[i * 4 + 3] = uMaterializeAlpha;
    }

    // 2 Rogue Outliers (i = 94, 95)
    for (let r = 0; r < 2; r++) {
      const idx = 94 + r;
      const basePos = new THREE.Vector3(0.02 * (r ? 1 : -1), 0.0, 0.02);
      currentOutlierPositions[r].lerpVectors(basePos, outlierTargets[r], outlierEject);

      const p = currentOutlierPositions[r];
      dummy.position.copy(p);
      const pScale = (purgeProgress > 0.0) ? (1.0 - purgeProgress) : 1.0;
      dummy.scale.setScalar(pScale * 1.5);
      dummy.updateMatrix();
      streamInstanced.setMatrixAt(idx, dummy.matrix);

      streamStateAttr[idx * 4 + 0] = 1.0; // High bloom
      streamStateAttr[idx * 4 + 3] = (1.0 - purgeProgress) * uMaterializeAlpha;

      // Update rogue HUD & cage
      const unit = rogueUnits[r];
      unit.group.visible = (isolatedCount > 0 && purgeProgress < 0.95);
      if (unit.group.visible) {
        unit.group.position.copy(p);
        unit.reticleLines.rotation.z = timeSec * 3.5;
        unit.cageIco.rotation.y = timeSec * 2.0;
        unit.cageBox.rotation.x = timeSec * 1.5;

        // Tether line update
        const tPos = unit.tetherGeo.attributes.position;
        tPos.setXYZ(0, 0, 0, 0);
        tPos.setXYZ(1, p.x, p.y, p.z);
        tPos.needsUpdate = true;
        unit.tetherLine.visible = true;

        unit.hudMat.uniforms.uMaterializeAlpha.value = uMaterializeAlpha;
        unit.hudMat.uniforms.uClimaxFlash.value = uClimaxFlash;
      } else {
        unit.tetherLine.visible = false;
      }
    }
    streamInstanced.instanceMatrix.needsUpdate = true;
    streamInstanced.geometry.attributes.aInstanceState.needsUpdate = true;

    // Update 32 vaporization sparks
    for (let s = 0; s < SPARK_COUNT; s++) {
      const outlierIdx = s < 16 ? 0 : 1;
      const origin = outlierTargets[outlierIdx];
      const dx = sparkDirs[s * 3 + 0];
      const dy = sparkDirs[s * 3 + 1];
      const dz = sparkDirs[s * 3 + 2];

      const sparkDist = purgeProgress * 0.16;
      dummy.position.set(origin.x + dx * sparkDist, origin.y + dy * sparkDist, origin.z + dz * sparkDist);
      const sparkScale = (purgeProgress > 0.0 && purgeProgress < 1.0) ? (1.0 - purgeProgress) * 1.4 : 0.001;
      dummy.scale.setScalar(sparkScale);
      dummy.updateMatrix();
      sparkInstanced.setMatrixAt(s, dummy.matrix);
    }
    sparkInstanced.instanceMatrix.needsUpdate = true;

    // Uniform updates
    particleMat.uniforms.uTime.value = timeSec;
    particleMat.uniforms.uMaterializeAlpha.value = uMaterializeAlpha;
    particleMat.uniforms.uClimaxFlash.value = uClimaxFlash;

    ringCylMat.uniforms.uTime.value = timeSec;
    ringCylMat.uniforms.uMaterializeAlpha.value = uMaterializeAlpha;

    curtainDiscMat.uniforms.uTime.value = timeSec;
    curtainDiscMat.uniforms.uMaterializeAlpha.value = uMaterializeAlpha;

    sparkMat.uniforms.uTime.value = timeSec;
    sparkMat.uniforms.uMaterializeAlpha.value = uMaterializeAlpha;

    ringMat.uniforms.uTime.value = timeSec;
    ringMat.uniforms.uMaterializeAlpha.value = uMaterializeAlpha;

    auraMat.uniforms.uTime.value = timeSec;
    auraMat.uniforms.uMaterializeAlpha.value = uMaterializeAlpha;
  }

  return {
    rootGroup,
    hitProxyMesh,
    telemetry,
    materials: [ringCylMat, curtainDiscMat, particleMat, sparkMat, ringMat, auraMat, ...rogueUnits.map(u => u.hudMat)],
    update,
  };
}

// ============================================================================
// POD 7: Poker / Game Theory Hologram (ticket-006.md §3)
// ============================================================================
export function buildPokerGameTheoryPod({ podSpec, floorY, glyphAtlas, applyStencilReject }) {
  const rootGroup = new THREE.Group();
  rootGroup.name = `PodGroup_${podSpec.id}`;
  rootGroup.position.set(podSpec.defaultOffset.x, floorY + podSpec.defaultOffset.yRel, podSpec.defaultOffset.z);

  const { emitterGroup, auraMesh, ringMat, auraMat } = createPodEmitterAndAura(podSpec.id, 0.38, applyStencilReject);
  rootGroup.add(emitterGroup);
  rootGroup.add(auraMesh);

  // Hit proxy
  const hitProxyMat = new THREE.MeshBasicMaterial({
    transparent: true,
    opacity: 0.0,
    depthWrite: false,
    depthTest: true,
    visible: false,
  });
  const hitProxyMesh = new THREE.Mesh(new THREE.SphereGeometry(0.56, 12, 10), hitProxyMat);
  hitProxyMesh.name = `HitProxy_${podSpec.id}`;
  hitProxyMesh.userData = { podId: podSpec.id, isMathPodProxy: true };
  rootGroup.add(hitProxyMesh);

  // 1. 5 Smoked-Glass Holographic Playing Cards in a 3D Arc
  const cardKeys = ['cardAceSpades', 'cardKingHearts', 'cardQueenDiamonds', 'cardJackClubs', 'cardTenSpades'];
  const cardGroups = [];
  const cardBodyMats = [];
  const cardFaceMats = [];
  const cardBorderMats = [];
  const cardScanBarMats = [];

  for (let k = 0; k < 5; k++) {
    const cGroup = new THREE.Group();
    const arcAngle = (k - 2) * 0.22;
    const targetX = Math.sin(arcAngle) * 0.34;
    const targetY = -0.11 + Math.cos(arcAngle) * 0.04 - 0.04;
    const targetZ = (1.0 - Math.cos(arcAngle)) * 0.18;
    const targetRotZ = -arcAngle * 0.45;

    cGroup.position.set(targetX, targetY, targetZ);
    cGroup.rotation.z = targetRotZ;

    // 1.1 Smoked-glass Fresnel body (0.092 x 0.134 x 0.004)
    const bodyMat = createPodSmokedCoreMaterial({ coreColor: HOLO_POD_PALETTE.coreDeep, opacity: 0.55, applyStencilReject });
    cardBodyMats.push(bodyMat);
    const bodyMesh = new THREE.Mesh(new THREE.BoxGeometry(0.092, 0.134, 0.004), bodyMat);
    cGroup.add(bodyMesh);

    // 1.2 Razor-sharp wireframe border
    const borderEdges = new THREE.EdgesGeometry(new THREE.BoxGeometry(0.094, 0.136, 0.005));
    const borderMat = createPodHologramLineMaterial({
      lineColor: HOLO_POD_PALETTE.highEmissive,
      pulseColor: HOLO_POD_PALETTE.highPulseGold,
      baseAlpha: 0.85,
      applyStencilReject,
    });
    cardBorderMats.push(borderMat);
    const borderMesh = new THREE.LineSegments(borderEdges, borderMat);
    cGroup.add(borderMesh);

    // 1.3 Card Face Quad with procedural glyphs
    const faceMat = createPodGlyphMaterial({ atlasTexture: glyphAtlas.texture, applyStencilReject });
    cardFaceMats.push(faceMat);
    const cardUv = glyphAtlas.cells[cardKeys[k]];
    faceMat.uniforms.uUvRect.value.set(cardUv[0], cardUv[1], cardUv[2], cardUv[3]);

    const faceMesh = new THREE.Mesh(new THREE.PlaneGeometry(0.086, 0.126), faceMat);
    faceMesh.position.z = 0.003;
    cGroup.add(faceMesh);

    // 1.4 Planar Flip Scanline Bar
    const scanBarMat = createPodHologramSurfaceMaterial({
      coreColor: HOLO_POD_PALETTE.highPulseGold,
      midColor: HOLO_POD_PALETTE.highPulseGold,
      highColor: HOLO_POD_PALETTE.highPulseGold,
      baseAlpha: 0.95,
      applyStencilReject,
    });
    cardScanBarMats.push(scanBarMat);
    const scanBar = new THREE.Mesh(new THREE.PlaneGeometry(0.096, 0.008), scanBarMat);
    scanBar.position.z = 0.004;
    cGroup.add(scanBar);

    rootGroup.add(cGroup);
    cardGroups.push({
      group: cGroup,
      targetPos: new THREE.Vector3(targetX, targetY, targetZ),
      targetRotZ,
      scanBar,
      faceMat,
      bodyMat,
      isFlipped: false,
    });
  }

  // 2. 3 Volumetric Probability / EV Bars (FOLD, CALL, RAISE) at base y = 0.05
  const evBarX = [-0.14, 0.00, 0.14];
  const evActions = ['actionFold', 'actionCall', 'actionRaise'];
  const evBars = [];

  for (let b = 0; b < 3; b++) {
    const bGroup = new THREE.Group();
    bGroup.position.set(evBarX[b], 0.05, -0.04);

    const barMat = createPodHologramSurfaceMaterial({
      coreColor: HOLO_POD_PALETTE.coreDeep,
      midColor: b === 2 ? HOLO_POD_PALETTE.highPulseGold : HOLO_POD_PALETTE.midWireLow,
      highColor: HOLO_POD_PALETTE.highPulseGold,
      baseAlpha: 0.70,
      applyStencilReject,
    });
    const barGeo = new THREE.BoxGeometry(0.038, 1.0, 0.024);
    barGeo.translate(0, 0.5, 0); // Pivot at base
    const barMesh = new THREE.Mesh(barGeo, barMat);
    bGroup.add(barMesh);

    // Wireframe cage
    const cageEdges = new THREE.EdgesGeometry(barGeo);
    const cageMat = createPodHologramLineMaterial({
      lineColor: b === 2 ? HOLO_POD_PALETTE.highPulseGold : HOLO_POD_PALETTE.midWireHigh,
      pulseColor: HOLO_POD_PALETTE.highPulseGold,
      baseAlpha: 0.85,
      applyStencilReject,
    });
    const cageMesh = new THREE.LineSegments(cageEdges, cageMat);
    bGroup.add(cageMesh);

    // Action Label Quad
    const labelMat = createPodGlyphMaterial({ atlasTexture: glyphAtlas.texture, applyStencilReject });
    const labelMesh = new THREE.Mesh(new THREE.PlaneGeometry(0.052, 0.052), labelMat);
    labelMesh.position.set(0, -0.028, 0.015);
    const uvRect = glyphAtlas.cells[evActions[b]];
    labelMat.uniforms.uUvRect.value.set(uvRect[0], uvRect[1], uvRect[2], uvRect[3]);
    bGroup.add(labelMesh);

    rootGroup.add(bGroup);
    evBars.push({ group: bGroup, barMesh, barMat, cageMesh, labelMat });
  }

  // 3. Branching 3D Wireframe CFR / Decision-Tree Node Graph
  // 9 nodes: root at (0, 0.30, 0), 3 street/action at y = +0.22, 5 leaf equity at y = +0.14
  const treeNodes = [
    new THREE.Vector3(0.0, 0.30, 0.0), // Root
    // 3 Action nodes
    new THREE.Vector3(-0.14, 0.22, -0.02),
    new THREE.Vector3(0.00, 0.22, -0.02),
    new THREE.Vector3(0.14, 0.22, -0.02), // RAISE
    // 5 Leaf nodes above cards
    new THREE.Vector3(-0.24, 0.14, 0.0),
    new THREE.Vector3(-0.12, 0.14, 0.0),
    new THREE.Vector3(0.00, 0.14, 0.0),
    new THREE.Vector3(0.12, 0.14, 0.0),
    new THREE.Vector3(0.24, 0.14, 0.0),  // Optimal river leaf
  ];

  const treeMat = createPodHologramSurfaceMaterial({
    coreColor: HOLO_POD_PALETTE.highEmissive,
    midColor: HOLO_POD_PALETTE.highPulseGold,
    highColor: HOLO_POD_PALETTE.highPulseGold,
    baseAlpha: 0.90,
    applyStencilReject,
  });
  const decisionNodeInstanced = new THREE.InstancedMesh(new THREE.OctahedronGeometry(0.014, 0), treeMat, 9);
  const dummy = new THREE.Object3D();
  for (let i = 0; i < 9; i++) {
    dummy.position.copy(treeNodes[i]);
    dummy.updateMatrix();
    decisionNodeInstanced.setMatrixAt(i, dummy.matrix);
  }
  decisionNodeInstanced.instanceMatrix.needsUpdate = true;
  rootGroup.add(decisionNodeInstanced);

  // 8 Branches: Root -> Action (3), Action -> Leaf (5)
  // Optimal path: 0 -> 3 (Raise) -> 8 (Leaf 4)
  const treeBranches = [
    [0, 1], [0, 2], [0, 3], // Root -> Action
    [1, 4], [2, 5], [2, 6], [3, 7], [3, 8], // Action -> Leaf
  ];
  const treeBranchPts = new Float32Array(8 * 2 * 3);
  const treeBranchMetrics = new Float32Array(8 * 2 * 4);
  for (let b = 0; b < 8; b++) {
    const [n1, n2] = treeBranches[b];
    const isOptimal = (n1 === 0 && n2 === 3) || (n1 === 3 && n2 === 8);
    treeBranchPts[b * 6 + 0] = treeNodes[n1].x; treeBranchPts[b * 6 + 1] = treeNodes[n1].y; treeBranchPts[b * 6 + 2] = treeNodes[n1].z;
    treeBranchPts[b * 6 + 3] = treeNodes[n2].x; treeBranchPts[b * 6 + 4] = treeNodes[n2].y; treeBranchPts[b * 6 + 5] = treeNodes[n2].z;

    treeBranchMetrics[b * 8 + 0] = 0.0;
    treeBranchMetrics[b * 8 + 1] = isOptimal ? 1.0 : 0.5;
    treeBranchMetrics[b * 8 + 2] = isOptimal ? 1.0 : 0.0;
    treeBranchMetrics[b * 8 + 3] = 0.0;

    treeBranchMetrics[b * 8 + 4] = 1.0;
    treeBranchMetrics[b * 8 + 5] = isOptimal ? 1.0 : 0.5;
    treeBranchMetrics[b * 8 + 6] = isOptimal ? 1.0 : 0.0;
    treeBranchMetrics[b * 8 + 7] = 0.0;
  }
  const treeBranchGeo = new THREE.BufferGeometry();
  treeBranchGeo.setAttribute('position', new THREE.BufferAttribute(treeBranchPts, 3));
  treeBranchGeo.setAttribute('aLineMetric', new THREE.BufferAttribute(treeBranchMetrics, 4));

  const treeBranchMat = createPodHologramLineMaterial({
    lineColor: HOLO_POD_PALETTE.midWireLow,
    pulseColor: HOLO_POD_PALETTE.highPulseGold,
    baseAlpha: 0.85,
    dashFrequency: 18.0,
    dashSpeed: 3.5,
    applyStencilReject,
  });
  const decisionTreeLines = new THREE.LineSegments(treeBranchGeo, treeBranchMat);
  rootGroup.add(decisionTreeLines);

  // Floating EV HUD banner quad (PlaneGeometry(0.26, 0.055) at (0, 0.34, 0))
  const evHudMat = createPodGlyphMaterial({ atlasTexture: glyphAtlas.texture, applyStencilReject });
  const evHudQuad = new THREE.Mesh(new THREE.PlaneGeometry(0.26, 0.055), evHudMat);
  evHudQuad.position.set(0.0, 0.34, 0.0);
  const evUv = glyphAtlas.cells.pokerEVHUD;
  evHudMat.uniforms.uUvRect.value.set(evUv[0], evUv[1], evUv[2], evUv[3]);
  rootGroup.add(evHudQuad);

  const telemetry = {
    dealtCardCount: 0,
    optimalPathFlare: 0.0,
    evValues: [0.04, 0.05, 0.05],
  };

  function update(dt, timeSec, state) {
    const { stage, stageProgress, uMaterializeAlpha, uClimaxFlash } = state;

    let dealtCount = 0;
    let optFlare = 0.0;
    let targetHeights = [0.04, 0.05, 0.05];

    if (stage === 'spawn') {
      dealtCount = 0;
      optFlare = 0.0;
      targetHeights = [0.04, 0.05, 0.05];
    } else if (stage === 'animate') {
      if (stageProgress < 0.40) {
        // Flop (cards 0..2)
        dealtCount = 3;
        targetHeights = [0.03, 0.08, 0.11];
      } else if (stageProgress < 0.72) {
        // Turn (card 3)
        dealtCount = 4;
        targetHeights = [0.02, 0.07, 0.14];
      } else {
        // River (card 4)
        dealtCount = 5;
        targetHeights = [0.015, 0.055, 0.185];
      }
      optFlare = dealtCount === 5 ? (stageProgress - 0.72) / 0.28 : 0.0;
    } else if (stage === 'climax') {
      dealtCount = 5;
      optFlare = 1.0;
      targetHeights = [0.015, 0.055, 0.185];
    } else { // dissolve
      dealtCount = 0;
      optFlare = 0.0;
      targetHeights = [0.04, 0.05, 0.05];
    }

    telemetry.dealtCardCount = dealtCount;
    telemetry.optimalPathFlare = optFlare;
    telemetry.evValues = targetHeights;

    // Update 5 cards
    for (let k = 0; k < 5; k++) {
      const card = cardGroups[k];
      const isFlipped = (k < dealtCount);
      card.isFlipped = isFlipped;

      // Card flip animation: rotY: Math.PI -> 0
      const targetRotY = isFlipped ? 0.0 : Math.PI;
      card.group.rotation.y = THREE.MathUtils.lerp(card.group.rotation.y, targetRotY, 0.2);

      // Card planar scan bar sweep: y from +0.067 down to -0.067
      const scanBarY = 0.067 - ((timeSec * 2.0 + k) % 1.0) * 0.134;
      card.scanBar.position.y = scanBarY;
      card.scanBar.visible = isFlipped && (uClimaxFlash > 0.1 || stage === 'animate');

      card.faceMat.uniforms.uMaterializeAlpha.value = uMaterializeAlpha;
      card.faceMat.uniforms.uClimaxFlash.value = uClimaxFlash;
    }

    // Update EV Bar heights
    for (let b = 0; b < 3; b++) {
      const bar = evBars[b];
      const curScaleY = bar.barMesh.scale.y;
      const nextScaleY = THREE.MathUtils.lerp(curScaleY, targetHeights[b], 0.15);
      bar.barMesh.scale.y = nextScaleY;
      bar.cageMesh.scale.y = nextScaleY;

      bar.barMat.uniforms.uClimaxFlash.value = (b === 2) ? uClimaxFlash : 0.0;
      bar.barMat.uniforms.uMaterializeAlpha.value = uMaterializeAlpha;
      bar.labelMat.uniforms.uMaterializeAlpha.value = uMaterializeAlpha;
    }

    // Optimal CFR path flare
    treeBranchMat.uniforms.uClimaxFlash.value = optFlare * uClimaxFlash;
    treeBranchMat.uniforms.uMaterializeAlpha.value = uMaterializeAlpha;
    treeBranchMat.uniforms.uTime.value = timeSec;

    evHudMat.uniforms.uMaterializeAlpha.value = uMaterializeAlpha;
    evHudMat.uniforms.uClimaxFlash.value = uClimaxFlash;

    ringMat.uniforms.uTime.value = timeSec;
    ringMat.uniforms.uMaterializeAlpha.value = uMaterializeAlpha;

    auraMat.uniforms.uTime.value = timeSec;
    auraMat.uniforms.uMaterializeAlpha.value = uMaterializeAlpha;
  }

  return {
    rootGroup,
    hitProxyMesh,
    telemetry,
    materials: [
      treeMat,
      treeBranchMat,
      evHudMat,
      ringMat,
      auraMat,
      ...cardBodyMats,
      ...cardFaceMats,
      ...cardBorderMats,
      ...cardScanBarMats,
      ...evBars.map((b) => b.barMat),
      ...evBars.map((b) => b.cageMesh.material),
      ...evBars.map((b) => b.labelMat),
    ],
    update,
  };
}

// ============================================================================
// Master Hologram Pods System Factory (ticket-001.md, ticket-002.md, ticket-007.md)
// ============================================================================
export function buildMathHologramPods(options = {}) {
  const {
    rootGroup = new THREE.Group(),
    floorY = 0.0,
    uTimeUniform = null,
    applyStencilReject = null,
    audio = null,
    getInteractionContext = null,
  } = options;

  const glyphAtlas = createHologramGlyphAtlas();

  const pods = [];
  const podsById = {};
  const raycastTargets = [];

  const tempVec = new THREE.Vector3();
  const hitPoint = new THREE.Vector3();
  const storageKey = options.storageKey || 'skatealley_mathpods_transforms_v1';

  // Instantiate all pods
  for (const spec of HOLO_POD_SPECS) {
    let podImpl;
    switch (spec.concept) {
      case 'graph-theory':
        podImpl = buildGraphTheoryPod({ podSpec: spec, floorY, applyStencilReject });
        break;
      case 'matrix-rank':
        podImpl = buildMatrixRankPod({ podSpec: spec, floorY, glyphAtlas, applyStencilReject });
        break;
      case 'gradient-descent':
        podImpl = buildGradientDescentPod({ podSpec: spec, floorY, applyStencilReject });
        break;
      case 'neural-network':
        podImpl = buildNeuralNetworkPod({ podSpec: spec, floorY, applyStencilReject });
        break;
      case 'clustering':
        podImpl = buildClusteringPod({ podSpec: spec, floorY, applyStencilReject });
        break;
      case 'anomaly-detection':
        podImpl = buildAnomalyDetectionPod({ podSpec: spec, floorY, glyphAtlas, applyStencilReject });
        break;
      case 'poker-game-theory':
        podImpl = buildPokerGameTheoryPod({ podSpec: spec, floorY, glyphAtlas, applyStencilReject });
        break;
      default:
        throw new Error(`Unknown pod concept: ${spec.concept}`);
    }

    const pod = {
      ...spec,
      rootGroup: podImpl.rootGroup,
      hitProxyMesh: podImpl.hitProxyMesh,
      telemetry: podImpl.telemetry || {},
      ribbonTrails: podImpl.ribbonTrails || null,
      materials: podImpl.materials || [],
      updateImpl: podImpl.update,
      worldPos: new THREE.Vector3().copy(podImpl.rootGroup.position),
      visible: true,
      inCorridorZone: true,

      // State machine overrides
      overrideCycleProgress: null,
      setCycleProgress(norm) {
        this.overrideCycleProgress = norm;
      },
      clearCycleProgress() {
        this.overrideCycleProgress = null;
      },

      // 3D Plane Dragging & Spring-Inertia Physics state (ticket-002.md §2)
      isDragging: false,
      dragPlane: new THREE.Plane(),
      dragGrabOffset: new THREE.Vector3(),
      dragTargetPos: new THREE.Vector3().copy(podImpl.rootGroup.position),
      anchorPos: new THREE.Vector3().copy(podImpl.rootGroup.position),
      velocity: new THREE.Vector3(),
      interferencePulse: 0.0,
      phaseJitter: 0.0,

      // Walk-Through Holographic Glitch state (Spec 027)
      hasWalkThroughGlitchEffect: true,
      walkThroughGlitchIntensity: 0.0,
      effectiveGlitchIntensity: 0.0,
      isWalkThroughGlitching: false,
      characterDistanceXZ: Infinity,
      characterDeltaY: Infinity,
      characterDistance: Infinity,
      glitchSliceOffset: 0.0,
      currentSliceOffsetMeters: 0.0,
      maxSliceOffsetMeters: WALK_THROUGH_GLITCH_SPEC.maxSliceOffsetMeters,
      glitchClockHz: WALK_THROUGH_GLITCH_SPEC.baseClockRateHz,
      inOuterGlitchZone: false,
      inCoreGlitchZone: false,
      walkThroughGlitchCount: 0,
      glitchSpikeRemainingSec: 0.0,
      lastGlitchAudioTimeSec: -Infinity,
      _wasInCoreZone: false,
      stageIndex: 0,
      stageName: 'SPAWN',
      cycleProgress: 0.0,
    };

    // Telemetry contract mirror on pod.telemetry
    pod.telemetry.hasWalkThroughGlitchEffect = true;
    pod.telemetry.walkThroughGlitchIntensity = 0.0;
    pod.telemetry.isWalkThroughGlitching = false;
    pod.telemetry.characterDistance = Infinity;
    pod.telemetry.glitchSliceOffset = 0.0;
    pod.telemetry.walkThroughGlitchCount = 0;

    pods.push(pod);
    podsById[spec.id] = pod;
    raycastTargets.push(podImpl.hitProxyMesh);
    rootGroup.add(podImpl.rootGroup);
  }

  function loadPodTransformsFromStorage() {
    if (typeof window === 'undefined' || !window.localStorage) return false;
    try {
      const raw = window.localStorage.getItem(storageKey);
      if (!raw) return false;
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== 'object') return false;
      for (const pod of pods) {
        const saved = parsed[pod.id];
        if (saved && typeof saved === 'object') {
          const x = Number.isFinite(saved.x) ? saved.x : pod.defaultOffset.x;
          const yRel = Number.isFinite(saved.yRel) ? saved.yRel : pod.defaultOffset.yRel;
          const z = Number.isFinite(saved.z) ? saved.z : pod.defaultOffset.z;
          pod.rootGroup.position.set(x, floorY + yRel, z);
          pod.anchorPos.copy(pod.rootGroup.position);
          pod.dragTargetPos.copy(pod.rootGroup.position);
          pod.worldPos.copy(pod.rootGroup.position);
        }
      }
      return true;
    } catch (err) {
      return false;
    }
  }

  function savePodTransformsToStorage() {
    if (typeof window === 'undefined' || !window.localStorage) return false;
    try {
      const payload = {};
      for (const pod of pods) {
        payload[pod.id] = {
          x: Number(pod.anchorPos.x.toFixed(4)),
          yRel: Number((pod.anchorPos.y - floorY).toFixed(4)),
          z: Number(pod.anchorPos.z.toFixed(4)),
        };
      }
      window.localStorage.setItem(storageKey, JSON.stringify(payload));
      return true;
    } catch (err) {
      return false;
    }
  }

  if (options.loadSavedTransforms !== false) {
    loadPodTransformsFromStorage();
  }

  const mathPodsSystem = {
    rootGroup,
    floorY,
    glyphAtlas,
    pods,
    podsById,
    raycastTargets,
    activeDragPodId: null,
    audio,
    getInteractionContext,
    interactionContext: null,

    // System-level Telemetry Contract (Spec 027 §6.2)
    count: pods.length,
    activeCount: pods.length,
    visiblePodCount: pods.length,
    walkThroughGlitchEnabled: true,
    outerGlitchRadiusMeters: WALK_THROUGH_GLITCH_SPEC.outerRadiusMeters,
    coreGlitchRadiusMeters: WALK_THROUGH_GLITCH_SPEC.coreRadiusMeters,
    activeGlitchingPodCount: 0,
    activeGlitchingPodIds: [],
    maxWalkThroughGlitchIntensity: 0.0,
    totalWalkThroughGlitchEvents: 0,

    getPod(idOrIndex) {
      if (typeof idOrIndex === 'string') {
        if (podsById[idOrIndex]) return podsById[idOrIndex];
        const byConcept = pods.find(p => p.concept === idOrIndex || p.code === idOrIndex);
        if (byConcept) return byConcept;
      }
      const idx = Number(idOrIndex);
      if (!Number.isNaN(idx)) {
        return pods.find(p => p.index === idx) || null;
      }
      return null;
    },

    updateCorridorVisibility(charZ = null, camZ = null) {
      this.rootGroup.visible = true;
      for (const pod of this.pods) {
        if (pod.rootGroup.userData && pod.rootGroup.userData.culledBySceneCutter) {
          pod.rootGroup.visible = false;
          pod.visible = false;
          pod.inCorridorZone = false;
          continue;
        }
        pod.rootGroup.visible = true;
        pod.visible = true;
        const podZ = pod.rootGroup.position.z;
        const inRange = (charZ === null && camZ === null) ||
          (charZ !== null && Math.abs(podZ - charZ) <= WALK_THROUGH_GLITCH_SPEC.corridorCharRangeZ) ||
          (camZ !== null && Math.abs(podZ - camZ) <= WALK_THROUGH_GLITCH_SPEC.corridorCamRangeZ) ||
          pod.isDragging || this.activeDragPodId === pod.id;
        pod.inCorridorZone = inRange;
        if (pod.detailMeshes && Array.isArray(pod.detailMeshes)) {
          for (const m of pod.detailMeshes) {
            m.visible = inRange;
          }
        }
      }
      this.visiblePodCount = this.pods.filter(p => p.rootGroup.visible).length;
      this.activeCount = this.visiblePodCount;
    },

    beginDrag(podId, worldRay, camera) {
      const pod = this.getPod(podId);
      if (!pod) return null;

      // Camera forward normal plane coplanar with pod root
      const planeNormal = camera.getWorldDirection(tempVec).negate();
      pod.dragPlane.setFromNormalAndCoplanarPoint(planeNormal, pod.rootGroup.position);

      if (worldRay && worldRay.intersectPlane(pod.dragPlane, hitPoint)) {
        pod.dragGrabOffset.subVectors(pod.rootGroup.position, hitPoint);
      } else {
        pod.dragGrabOffset.set(0, 0, 0);
      }

      pod.isDragging = true;
      pod.dragTargetPos.copy(pod.rootGroup.position);

      // Grab Holographic Interference Pulse
      pod.interferencePulse = 1.0;
      pod.phaseJitter = 1.35;
      this.activeDragPodId = pod.id;
      return pod;
    },

    updateDrag(worldRay) {
      if (!this.activeDragPodId) return;
      const pod = this.getPod(this.activeDragPodId);
      if (!pod || !pod.isDragging) return;

      if (worldRay.intersectPlane(pod.dragPlane, hitPoint)) {
        pod.dragTargetPos.copy(hitPoint).add(pod.dragGrabOffset);

        // Clamp to safe corridor bounds (ticket-002.md §2)
        pod.dragTargetPos.x = THREE.MathUtils.clamp(pod.dragTargetPos.x, POD_DRAG_BOUNDS.minX, POD_DRAG_BOUNDS.maxX);
        pod.dragTargetPos.y = THREE.MathUtils.clamp(
          pod.dragTargetPos.y,
          this.floorY + POD_DRAG_BOUNDS.minYRel,
          this.floorY + POD_DRAG_BOUNDS.maxYRel
        );
        pod.dragTargetPos.z = THREE.MathUtils.clamp(pod.dragTargetPos.z, POD_DRAG_BOUNDS.minZ, POD_DRAG_BOUNDS.maxZ);
      }
    },

    endDrag() {
      if (!this.activeDragPodId) return null;
      const pod = this.getPod(this.activeDragPodId);
      if (!pod) return null;

      pod.isDragging = false;
      // Project anchor slightly along velocity for inertial coast
      pod.anchorPos.copy(pod.rootGroup.position).addScaledVector(pod.velocity, 0.18);
      pod.anchorPos.x = THREE.MathUtils.clamp(pod.anchorPos.x, POD_DRAG_BOUNDS.minX, POD_DRAG_BOUNDS.maxX);
      pod.anchorPos.y = THREE.MathUtils.clamp(
        pod.anchorPos.y,
        this.floorY + POD_DRAG_BOUNDS.minYRel,
        this.floorY + POD_DRAG_BOUNDS.maxYRel
      );
      pod.anchorPos.z = THREE.MathUtils.clamp(pod.anchorPos.z, POD_DRAG_BOUNDS.minZ, POD_DRAG_BOUNDS.maxZ);

      // Release Holographic Interference Pulse
      pod.interferencePulse = 1.0;
      pod.phaseJitter = -1.35;

      this.activeDragPodId = null;
      savePodTransformsToStorage();
      return pod;
    },

    // Programmatic test helper methods
    dragPod(idOrIndex, targetWorldPos, dt = 1 / 60) {
      const pod = this.getPod(idOrIndex);
      if (!pod) return null;
      pod.isDragging = true;
      pod.dragTargetPos.copy(targetWorldPos);
      pod.interferencePulse = 1.0;
      pod.phaseJitter = 1.35;
      this.update(dt, uTimeUniform ? uTimeUniform.value : 0.0);
      return pod;
    },

    releasePod(idOrIndex) {
      const pod = this.getPod(idOrIndex);
      if (!pod) return null;
      pod.isDragging = false;
      pod.anchorPos.copy(pod.rootGroup.position).addScaledVector(pod.velocity, 0.18);
      pod.interferencePulse = 1.0;
      pod.phaseJitter = -1.35;
      if (this.activeDragPodId === pod.id) this.activeDragPodId = null;
      savePodTransformsToStorage();
      return pod;
    },

    triggerGlitch(podIdOrIndex, intensity = 1.0, durationSec = 0.18) {
      const pod = this.getPod(podIdOrIndex);
      if (!pod) return null;
      const clampedIntensity = THREE.MathUtils.clamp(intensity, 0.0, 1.0);
      pod.glitchSpikeRemainingSec = Math.max(0.05, durationSec);
      pod.walkThroughGlitchIntensity = clampedIntensity;
      pod.effectiveGlitchIntensity = Math.max(clampedIntensity, pod.interferencePulse || 0.0);
      pod.isWalkThroughGlitching = pod.walkThroughGlitchIntensity > WALK_THROUGH_GLITCH_SPEC.activeGlitchThreshold;
      pod.walkThroughGlitchCount = (pod.walkThroughGlitchCount || 0) + 1;
      pod.currentSliceOffsetMeters = Number((pod.effectiveGlitchIntensity * pod.maxSliceOffsetMeters).toFixed(4));
      pod.glitchSliceOffset = pod.currentSliceOffsetMeters;
      pod.telemetry.walkThroughGlitchIntensity = pod.walkThroughGlitchIntensity;
      pod.telemetry.isWalkThroughGlitching = pod.isWalkThroughGlitching;
      pod.telemetry.glitchSliceOffset = pod.glitchSliceOffset;
      pod.telemetry.walkThroughGlitchCount = pod.walkThroughGlitchCount;

      for (const mat of pod.materials) {
        if (mat && mat.uniforms) {
          if (mat.uniforms.uInterference) mat.uniforms.uInterference.value = pod.effectiveGlitchIntensity;
          if (mat.uniforms.uInterferenceBoost) mat.uniforms.uInterferenceBoost.value = pod.effectiveGlitchIntensity;
          if (mat.uniforms.uWalkGlitch) mat.uniforms.uWalkGlitch.value = pod.walkThroughGlitchIntensity;
          if (mat.uniforms.uGlitchClockHz) mat.uniforms.uGlitchClockHz.value = pod.glitchClockHz;
          if (mat.uniforms.uMaxSliceOffset) mat.uniforms.uMaxSliceOffset.value = pod.maxSliceOffsetMeters;
          if (mat.uniforms.uMaxVerticalJitter) mat.uniforms.uMaxVerticalJitter.value = WALK_THROUGH_GLITCH_SPEC.maxVerticalJitterMeters;
        }
      }
      this._refreshAggregateTelemetry();
      return pod;
    },

    resetPositions() {
      for (const pod of this.pods) {
        pod.rootGroup.position.set(
          pod.defaultOffset.x,
          this.floorY + pod.defaultOffset.yRel,
          pod.defaultOffset.z
        );
        pod.anchorPos.copy(pod.rootGroup.position);
        pod.dragTargetPos.copy(pod.rootGroup.position);
        pod.worldPos.copy(pod.rootGroup.position);
        pod.velocity.set(0, 0, 0);
        pod.isDragging = false;
        pod.walkThroughGlitchIntensity = 0.0;
        pod.effectiveGlitchIntensity = 0.0;
        pod.isWalkThroughGlitching = false;
        pod.interferencePulse = 0.0;
        pod.phaseJitter = 0.0;
        pod.inOuterGlitchZone = false;
        pod.inCoreGlitchZone = false;
        pod.glitchSpikeRemainingSec = 0.0;
        pod.currentSliceOffsetMeters = 0.0;
        pod.glitchSliceOffset = 0.0;
        if (pod.telemetry) {
          pod.telemetry.walkThroughGlitchIntensity = 0.0;
          pod.telemetry.isWalkThroughGlitching = false;
          pod.telemetry.glitchSliceOffset = 0.0;
        }
      }
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem(storageKey);
      }
      this._refreshAggregateTelemetry();
    },

    _refreshAggregateTelemetry() {
      const activeGlitching = this.pods.filter(p => p.isWalkThroughGlitching);
      this.activeGlitchingPodCount = activeGlitching.length;
      this.activeGlitchingPodIds = activeGlitching.map(p => p.id);
      this.maxWalkThroughGlitchIntensity = this.pods.reduce((max, p) => Math.max(max, p.walkThroughGlitchIntensity), 0.0);
      this.totalWalkThroughGlitchEvents = this.pods.reduce((sum, p) => sum + (p.walkThroughGlitchCount || 0), 0);
      this.visiblePodCount = this.pods.filter(p => p.rootGroup.visible).length;
      this.activeCount = this.pods.length;
    },

    update(dt = 1 / 60, timeSec = 0.0, optionalContext = null) {
      const clampedDt = Math.max(0.0001, Math.min(dt, 0.1));
      const ctx = optionalContext || this.interactionContext || (typeof this.getInteractionContext === 'function' ? this.getInteractionContext() : null);

      for (const pod of pods) {
        // Physics update (Spring-damper tracking & inertial coast)
        const pos = pod.rootGroup.position;
        if (pod.isDragging) {
          // Fast tracking spring
          const accelX = (pod.dragTargetPos.x - pos.x) * 140.0 - pod.velocity.x * 16.0;
          const accelY = (pod.dragTargetPos.y - pos.y) * 140.0 - pod.velocity.y * 16.0;
          const accelZ = (pod.dragTargetPos.z - pos.z) * 140.0 - pod.velocity.z * 16.0;

          pod.velocity.x += accelX * clampedDt;
          pod.velocity.y += accelY * clampedDt;
          pod.velocity.z += accelZ * clampedDt;

          pos.x += pod.velocity.x * clampedDt;
          pos.y += pod.velocity.y * clampedDt;
          pos.z += pod.velocity.z * clampedDt;

          pod.anchorPos.copy(pos);
          pod.interferencePulse = Math.max(pod.interferencePulse, 0.45);
        } else {
          // If pod was repositioned externally without velocity or dragging, align anchorPos
          if (pos.distanceTo(pod.anchorPos) > 0.05 && pod.velocity.lengthSq() < 0.001) {
            pod.anchorPos.copy(pos);
          }

          // Gentle settle spring to anchorPos + idle hover bob
          const idleBobY = pod.anchorPos.y + 0.018 * Math.sin(timeSec * 1.8 + pod.phaseOffset);
          const accelX = (pod.anchorPos.x - pos.x) * 18.0 - pod.velocity.x * 6.5;
          const accelY = (idleBobY - pos.y) * 18.0 - pod.velocity.y * 6.5;
          const accelZ = (pod.anchorPos.z - pos.z) * 18.0 - pod.velocity.z * 6.5;

          pod.velocity.x += accelX * clampedDt;
          pod.velocity.y += accelY * clampedDt;
          pod.velocity.z += accelZ * clampedDt;

          pos.x += pod.velocity.x * clampedDt;
          pos.y += pod.velocity.y * clampedDt;
          pos.z += pod.velocity.z * clampedDt;

          // Interference pulse decay
          pod.interferencePulse *= Math.exp(-3.2 * clampedDt);
          pod.phaseJitter *= Math.exp(-5.0 * clampedDt);
        }

        // Walk-through holographic glitch evaluation (Spec 027)
        const glitchResult = evaluatePodWalkThroughGlitch(pod, ctx, clampedDt, timeSec);
        if (glitchResult && glitchResult.triggeredAudio) {
          const audioEngine = (ctx && ctx.audio) || this.audio;
          if (audioEngine && typeof audioEngine.onPodGlitch === 'function') {
            const timeSinceLast = timeSec - (pod.lastGlitchAudioTimeSec || -Infinity);
            if (timeSinceLast >= WALK_THROUGH_GLITCH_SPEC.audioCooldownSec) {
              pod.lastGlitchAudioTimeSec = timeSec;
              audioEngine.onPodGlitch(pod.id, pod.walkThroughGlitchIntensity);
            }
          }
        }

        // Apply glitch & interference uniforms to all materials in this pod
        for (const mat of pod.materials) {
          if (mat && mat.uniforms) {
            if (mat.uniforms.uTime) {
              mat.uniforms.uTime.value = timeSec;
            }
            if (mat.uniforms.uInterferenceBoost) {
              mat.uniforms.uInterferenceBoost.value = pod.effectiveGlitchIntensity;
            }
            if (mat.uniforms.uInterference) {
              mat.uniforms.uInterference.value = pod.effectiveGlitchIntensity;
            }
            if (mat.uniforms.uWalkGlitch) {
              mat.uniforms.uWalkGlitch.value = pod.walkThroughGlitchIntensity;
            }
            if (mat.uniforms.uPhaseJitter) {
              mat.uniforms.uPhaseJitter.value = pod.phaseJitter;
            }
            if (mat.uniforms.uGlitchClockHz) {
              mat.uniforms.uGlitchClockHz.value = pod.glitchClockHz;
            }
            if (mat.uniforms.uMaxSliceOffset) {
              mat.uniforms.uMaxSliceOffset.value = pod.maxSliceOffsetMeters;
            }
            if (mat.uniforms.uMaxVerticalJitter) {
              mat.uniforms.uMaxVerticalJitter.value = WALK_THROUGH_GLITCH_SPEC.maxVerticalJitterMeters;
            }
          }
        }

        // Layer 5 Emitter / Dome flutter
        if (pod.emitterGroup) {
          const gEff = pod.effectiveGlitchIntensity;
          if (gEff > 0.001) {
            const flutterScale = 1.0 + 0.045 * gEff * Math.sin(timeSec * 43.0 + pod.index);
            pod.emitterGroup.scale.set(flutterScale, 1.0, flutterScale);
          } else {
            pod.emitterGroup.scale.set(1.0, 1.0, 1.0);
          }
        }

        // Deterministic state machine progression
        const cycleState = evaluatePodCycleState(
          timeSec,
          pod.phaseOffset,
          pod.cycleDuration,
          pod.overrideCycleProgress
        );
        pod.cycleState = cycleState;
        pod.stageIndex = ['spawn', 'animate', 'climax', 'dissolve'].indexOf(cycleState.stage);
        pod.stageName = cycleState.stage.toUpperCase();
        pod.cycleProgress = cycleState.cycleProgress;

        // Pod domain kinetic loop
        pod.updateImpl(clampedDt, timeSec, cycleState);
      }

      this._refreshAggregateTelemetry();

      if (this.popupManager) {
        for (const pod of this.pods) {
          if (pod.callout) {
            pod.callout.syncWithHostPod(pod);
          }
        }
        this.popupManager.update(clampedDt, timeSec, ctx);
      }
    },

    dispose() {
      if (this.popupManager) {
        this.popupManager.dispose();
      }
    },
  };

  const popupManager = createMathPodPopupManager({
    scene: options.scene || null,
    camera: options.camera || null,
    audioEngine: audio || options.audio || null,
    getInteractionContext: options.getInteractionContext || getInteractionContext || null,
    applyStencilReject,
  });
  popupManager.registerMathPods(mathPodsSystem);
  mathPodsSystem.popupManager = popupManager;
  mathPodsSystem.callouts = popupManager.callouts;

  return mathPodsSystem;
}
