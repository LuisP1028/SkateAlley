import * as THREE from 'three';

// ============================================================================
// Lifecycle State Enums & Constants (TICKET-001, TICKET-004)
// ============================================================================
export const HOLO_CALLOUT_LIFECYCLE_STATES = Object.freeze({
  DORMANT: 'dormant',
  MATERIALIZING: 'materializing',
  ACTIVE: 'active',
  DEMATERIALIZING: 'dematerializing',
});

// Backward-compatible alias supporting both state naming conventions
export const CALLOUT_LIFECYCLE_STATES = Object.freeze({
  DORMANT: 'dormant',
  IGNITION: 'materializing',
  MATERIALIZING: 'materializing',
  ACTIVE: 'active',
  COLLAPSE: 'dematerializing',
  DEMATERIALIZING: 'dematerializing',
});

export const HOLO_CALLOUT_TRIGGER_POLICIES = Object.freeze([
  'hover',
  'click',
  'drag',
  'proximity',
  'manual',
]);

// ============================================================================
// Palette Architecture & Presets (TICKET-001, TICKET-003, anim/mathpod_popup.md §3.1)
// ============================================================================
export const HOLO_CALLOUT_PALETTE_PRESETS = Object.freeze({
  neon_dark_amber: Object.freeze({
    key: 'neon_dark_amber',
    label: 'Neon Dark Amber (MathPod Standard)',
    coreDeepHex: 0x1a0a00,
    coreDeepStr: '#1a0a00',
    coreShadowHex: 0x2b1200,
    coreShadowStr: '#2b1200',
    midWireLowHex: 0xd95b00,
    midWireLowStr: '#d95b00',
    midWireHighHex: 0xf59e0b,
    midWireHighStr: '#f59e0b',
    highEmissiveHex: 0xff9d00,
    highEmissiveStr: '#ff9d00',
    highPulseGoldHex: 0xffcc4d,
    highPulseGoldStr: '#ffcc4d',
    // Extended aliases for typography & borders
    coreBgTop: '#1a0a00',
    coreBgBottom: '#2b1200',
    borderPrimary: '#d95b00',
    borderSecondary: '#f59e0b',
    highlightEmissive: '#ff9d00',
    highlightBloom: '#ffcc4d',
    textPrimary: '#fff7ed',
    textSecondary: '#fdba74',
    textMuted: '#9a3412',
  }),
  holosys_cyan: Object.freeze({
    key: 'holosys_cyan',
    label: 'HOLO.SYS Iridescent Cyan (Character & Companion)',
    coreDeepHex: 0x02141c,
    coreDeepStr: '#02141c',
    coreShadowHex: 0x042433,
    coreShadowStr: '#042433',
    midWireLowHex: 0x0088cc,
    midWireLowStr: '#0088cc',
    midWireHighHex: 0x00d5ff,
    midWireHighStr: '#00d5ff',
    highEmissiveHex: 0x38bdf8,
    highEmissiveStr: '#38bdf8',
    highPulseGoldHex: 0xccf6ff,
    highPulseGoldStr: '#ccf6ff',
    coreBgTop: '#021824',
    coreBgBottom: '#04283b',
    borderPrimary: '#0099cc',
    borderSecondary: '#00d5ff',
    highlightEmissive: '#38bdf8',
    highlightBloom: '#a5f3fc',
    textPrimary: '#ecfeff',
    textSecondary: '#67e8f9',
    textMuted: '#0e7490',
  }),
  industrial_amber: Object.freeze({
    key: 'industrial_amber',
    label: 'Burnt Industrial Amber (Alarm Fixtures & Infrastructure)',
    coreDeepHex: 0x1c0b02,
    coreDeepStr: '#1c0b02',
    coreShadowHex: 0x2e1304,
    coreShadowStr: '#2e1304',
    midWireLowHex: 0xb45309,
    midWireLowStr: '#b45309',
    midWireHighHex: 0xd97706,
    midWireHighStr: '#d97706',
    highEmissiveHex: 0xf59e0b,
    highEmissiveStr: '#f59e0b',
    highPulseGoldHex: 0xfde68a,
    highPulseGoldStr: '#fde68a',
    coreBgTop: '#1c0d02',
    coreBgBottom: '#2e1505',
    borderPrimary: '#b45309',
    borderSecondary: '#d97706',
    highlightEmissive: '#f59e0b',
    highlightBloom: '#fde68a',
    textPrimary: '#fef3c7',
    textSecondary: '#fcd34d',
    textMuted: '#78350f',
  }),
});

export const CALLOUT_PALETTE_THEMES = HOLO_CALLOUT_PALETTE_PRESETS;

function resolveHexColorStr(primaryStr, fallbackStr, numericHex, defaultStr) {
  if (primaryStr) return primaryStr;
  if (fallbackStr) return fallbackStr;
  if (numericHex !== undefined) {
    return '#' + numericHex.toString(16).padStart(6, '0');
  }
  return defaultStr;
}

export function resolveCalloutPalette(paletteInput) {
  if (typeof paletteInput === 'string') {
    const key = paletteInput.toLowerCase().trim();
    if (key === 'neon_dark_amber' || key === 'amber' || key === 'mathpod' || key === 'default') {
      paletteInput = HOLO_CALLOUT_PALETTE_PRESETS.neon_dark_amber;
    } else if (key === 'holosys_cyan' || key === 'holo_cyan' || key === 'cyan' || key === 'companion' || key === 'character') {
      paletteInput = HOLO_CALLOUT_PALETTE_PRESETS.holosys_cyan;
    } else if (key === 'industrial_amber' || key === 'alarm' || key === 'infrastructure') {
      paletteInput = HOLO_CALLOUT_PALETTE_PRESETS.industrial_amber;
    } else if (HOLO_CALLOUT_PALETTE_PRESETS[key]) {
      paletteInput = HOLO_CALLOUT_PALETTE_PRESETS[key];
    } else {
      paletteInput = HOLO_CALLOUT_PALETTE_PRESETS.neon_dark_amber;
    }
  }

  const base = HOLO_CALLOUT_PALETTE_PRESETS.neon_dark_amber;
  const p = paletteInput || {};

  const coreDeepStr = resolveHexColorStr(p.coreDeepStr, p.coreBgTop, p.coreDeepHex, base.coreDeepStr);
  const coreShadowStr = resolveHexColorStr(p.coreShadowStr, p.coreBgBottom, p.coreShadowHex, base.coreShadowStr);
  const midWireLowStr = resolveHexColorStr(p.midWireLowStr, p.borderPrimary, p.midWireLowHex, base.midWireLowStr);
  const midWireHighStr = resolveHexColorStr(p.midWireHighStr, p.borderSecondary, p.midWireHighHex, base.midWireHighStr);
  const highEmissiveStr = resolveHexColorStr(p.highEmissiveStr, p.highlightEmissive, p.highEmissiveHex, base.highEmissiveStr);
  const highPulseGoldStr = resolveHexColorStr(p.highPulseGoldStr, p.highlightBloom, p.highPulseGoldHex, base.highPulseGoldStr);

  const textPrimary = p.textPrimary || base.textPrimary;
  const textSecondary = p.textSecondary || base.textSecondary;
  const textMuted = p.textMuted || base.textMuted;

  return {
    key: p.key || 'custom',
    label: p.label || 'Custom Callout Palette',
    coreDeepStr,
    coreDeepHex: parseInt(coreDeepStr.replace('#', ''), 16),
    coreDeepColor: new THREE.Color(coreDeepStr),
    coreShadowStr,
    coreShadowHex: parseInt(coreShadowStr.replace('#', ''), 16),
    coreShadowColor: new THREE.Color(coreShadowStr),
    midWireLowStr,
    midWireLowHex: parseInt(midWireLowStr.replace('#', ''), 16),
    midWireLowColor: new THREE.Color(midWireLowStr),
    midWireHighStr,
    midWireHighHex: parseInt(midWireHighStr.replace('#', ''), 16),
    midWireHighColor: new THREE.Color(midWireHighStr),
    highEmissiveStr,
    highEmissiveHex: parseInt(highEmissiveStr.replace('#', ''), 16),
    highEmissiveColor: new THREE.Color(highEmissiveStr),
    highPulseGoldStr,
    highPulseGoldHex: parseInt(highPulseGoldStr.replace('#', ''), 16),
    highPulseGoldColor: new THREE.Color(highPulseGoldStr),
    coreBgTop: coreDeepStr,
    coreBgBottom: coreShadowStr,
    borderPrimary: midWireLowStr,
    borderSecondary: midWireHighStr,
    highlightEmissive: highEmissiveStr,
    highlightBloom: highPulseGoldStr,
    textPrimary,
    textSecondary,
    textMuted,
  };
}

// ============================================================================
// Default Subsystem Configuration (TICKET-001, TICKET-002, plan schema)
// ============================================================================
export const HOLO_CALLOUT_DEFAULT_CONFIG = Object.freeze({
  frameWidth: 0.96,
  frameHeight: 0.50,
  canvasWidth: 1024,
  canvasHeight: 512,
  defaultOffset: Object.freeze({ x: 0.0, y: 0.88, z: 0.0 }),
  mathPodCageRadius: 0.38,
  mathPodAuraRadius: 0.56,
  defaultClearanceRadius: 0.58,
  upperBracketLocalY: 0.38,
  distanceScaleRefMeters: 3.80,
  minWorldScale: 0.65,
  maxWorldScale: 1.45,
  materializeDurationSec: 0.32,
  dematerializeDurationSec: 0.24,
  dragReleaseHoldDurationSec: 0.45,
  proximityRadiusMeters: 4.20,
  proximityHysteresisMeters: 0.35,
  scanFrequency: 36.0,
  scanSpeed: 3.4,
  fresnelExponent: 2.1,
  hoverBobAmplitude: 0.008,
  axialOffsets: Object.freeze({
    leaderLineZ: -0.004,
    backingPlaneZ: 0.000,
    wireframeBorderZ: 0.004,
    lightBarsZ: 0.006,
    typographyQuadZ: 0.009,
  }),
  renderOrders: Object.freeze({
    leaderLine: 12,
    backingPlane: 12,
    wireframeBorder: 13,
    lightBars: 14,
    typographyQuad: 15,
  }),
});

export const CALLOUT_DEFAULT_CONFIG = HOLO_CALLOUT_DEFAULT_CONFIG;

// ============================================================================
// Easing Functions (TICKET-004 §2.3)
// ============================================================================
export function easeOutCubic(t) {
  const u = 1.0 - Math.max(0.0, Math.min(1.0, t));
  return 1.0 - u * u * u;
}

export function easeInCubic(t) {
  const u = Math.max(0.0, Math.min(1.0, t));
  return u * u * u;
}

export function easeOutBack(t) {
  const u = Math.max(0.0, Math.min(1.0, t)) - 1.0;
  const c1 = 1.35;
  const c3 = c1 + 1.0;
  return 1.0 + c3 * u * u * u + c1 * u * u;
}

// ============================================================================
// Host Descriptor Validation & Normalization (TICKET-001, TICKET-005)
// ============================================================================
export function validateHostDescriptor(desc) {
  if (!desc || typeof desc !== 'object') {
    throw new Error('HostDescriptor validation failed: descriptor must be a non-null object');
  }
  if (!desc.id || typeof desc.id !== 'string' || desc.id.trim().length === 0) {
    throw new Error('HostDescriptor validation failed: descriptor.id must be a non-empty string');
  }

  const hasAnchor =
    (desc.targetAnchor && (desc.targetAnchor.isObject3D || typeof desc.targetAnchor === 'object')) ||
    (desc.target && (desc.target.isObject3D || typeof desc.target === 'object')) ||
    (desc.hostObject && (desc.hostObject.isObject3D || typeof desc.hostObject === 'object')) ||
    (desc.worldPosition && typeof desc.worldPosition.x === 'number' && typeof desc.worldPosition.y === 'number' && typeof desc.worldPosition.z === 'number');

  if (!hasAnchor) {
    throw new Error(
      `HostDescriptor validation failed for [${desc.id}]: descriptor must provide a targetAnchor, target, hostObject (THREE.Object3D/group) or worldPosition ({x,y,z})`
    );
  }

  if (desc.clearanceRadius !== undefined && (typeof desc.clearanceRadius !== 'number' || desc.clearanceRadius < 0)) {
    throw new Error(`HostDescriptor validation failed for [${desc.id}]: clearanceRadius must be a non-negative number`);
  }

  if (desc.minWorldScale !== undefined && desc.maxWorldScale !== undefined) {
    if (desc.minWorldScale <= 0 || desc.minWorldScale > desc.maxWorldScale) {
      throw new Error(`HostDescriptor validation failed for [${desc.id}]: invalid scale clamp [minScale <= 0 or minScale > maxScale]`);
    }
  }

  return true;
}

export function normalizeHostDescriptor(desc) {
  validateHostDescriptor(desc);

  const targetAnchor = desc.targetAnchor || desc.target || desc.hostObject || null;
  const worldPosition = desc.worldPosition || null;

  const rawOffset = desc.offset || HOLO_CALLOUT_DEFAULT_CONFIG.defaultOffset;
  const offset = {
    x: typeof rawOffset.x === 'number' ? rawOffset.x : 0.0,
    y: typeof rawOffset.y === 'number' ? rawOffset.y : 0.88,
    z: typeof rawOffset.z === 'number' ? rawOffset.z : 0.0,
  };

  const clearanceRadius =
    typeof desc.clearanceRadius === 'number' ? desc.clearanceRadius : HOLO_CALLOUT_DEFAULT_CONFIG.defaultClearanceRadius;

  const palette = resolveCalloutPalette(desc.palette || desc.theme);

  const triggerPolicy = Array.isArray(desc.triggerPolicy)
    ? desc.triggerPolicy
    : ['click', 'manual'];

  let autoRevealRadius = HOLO_CALLOUT_DEFAULT_CONFIG.proximityRadiusMeters;
  if (typeof desc.autoRevealRadius === 'number') {
    autoRevealRadius = desc.autoRevealRadius;
  } else if (typeof desc.proximityRadius === 'number') {
    autoRevealRadius = desc.proximityRadius;
  }

  const payloadProvider = typeof desc.payloadProvider === 'function' ? desc.payloadProvider : null;
  const staticPayload = desc.payload && typeof desc.payload === 'object' ? desc.payload : null;

  return {
    id: desc.id.trim(),
    targetAnchor,
    worldPosition,
    offset,
    clearanceRadius,
    palette,
    triggerPolicy,
    autoRevealEnabled: Boolean(desc.autoRevealEnabled),
    autoRevealRadius,
    autoRevealHysteresis: desc.autoRevealHysteresis || HOLO_CALLOUT_DEFAULT_CONFIG.proximityHysteresisMeters,
    payloadProvider: payloadProvider || (staticPayload ? () => staticPayload : null),
    staticPayload,
    interactiveSubRegions: Boolean(desc.interactiveSubRegions),
    showLeaderLine: desc.showLeaderLine !== false,
    minWorldScale: desc.minWorldScale || HOLO_CALLOUT_DEFAULT_CONFIG.minWorldScale,
    maxWorldScale: desc.maxWorldScale || HOLO_CALLOUT_DEFAULT_CONFIG.maxWorldScale,
    referenceDistance: desc.referenceDistance || HOLO_CALLOUT_DEFAULT_CONFIG.distanceScaleRefMeters,
    frameWidth: desc.frameWidth || HOLO_CALLOUT_DEFAULT_CONFIG.frameWidth,
    frameHeight: desc.frameHeight || HOLO_CALLOUT_DEFAULT_CONFIG.frameHeight,
    canvasWidth: desc.canvasWidth || HOLO_CALLOUT_DEFAULT_CONFIG.canvasWidth,
    canvasHeight: desc.canvasHeight || HOLO_CALLOUT_DEFAULT_CONFIG.canvasHeight,
  };
}

// ============================================================================
// Pure Billboarding & Spatial Transform Solver (TICKET-002, AC-1, AC-2)
// ============================================================================
const _tmpHostPos = new THREE.Vector3();
const _tmpCamPos = new THREE.Vector3();
const _tmpParentWorldQuat = new THREE.Quaternion();

function resolveClearanceOffset(offset, clearanceRadius, frameHeight) {
  const minCenterDist = clearanceRadius + 0.5 * frameHeight;
  const enforcedOffset = new THREE.Vector3(offset.x, offset.y, offset.z);

  if (enforcedOffset.length() < minCenterDist) {
    if (enforcedOffset.lengthSq() < 1e-8) {
      enforcedOffset.set(0, minCenterDist, 0);
    } else {
      enforcedOffset.setLength(minCenterDist);
    }
  }
  if (enforcedOffset.y > 0 && (enforcedOffset.y - 0.5 * frameHeight) < clearanceRadius) {
    enforcedOffset.y = clearanceRadius + 0.5 * frameHeight;
  }
  return enforcedOffset;
}

export function computeBillboardPoseAndScale(options = {}) {
  const {
    hostWorldPos = new THREE.Vector3(),
    offset = { x: 0.0, y: 0.88, z: 0.0 },
    clearanceRadius = 0.58,
    frameHeight = 0.50,
    cameraPos = null,
    cameraQuaternion = null,
    camera = null,
    parentWorldQuaternion = null,
    minWorldScale = 0.65,
    maxWorldScale = 1.45,
    distanceScaleRefMeters = 3.80,
    timeSec = 0.0,
    hoverBobAmplitude = 0.008,
    isActive = true,
  } = options;

  // 1. Clearance-Safe Anchor Computation
  const enforcedOffset = resolveClearanceOffset(offset, clearanceRadius, frameHeight);
  const hoverOffsetY = isActive ? hoverBobAmplitude * Math.sin(timeSec * 2.4) : 0.0;
  const anchorWorldPos = hostWorldPos.clone().add(enforcedOffset);

  // 2. Camera Orientation & Omnidirectional Billboarding
  let camQuat = cameraQuaternion;
  let camPos = cameraPos;
  if (camera) {
    if (!camQuat) camQuat = camera.quaternion;
    if (!camPos) camPos = camera.position;
  }
  if (!camQuat) camQuat = new THREE.Quaternion();
  if (!camPos) camPos = new THREE.Vector3(0, 1.5, 10.0);

  // billboardGroup orientation matches camera.quaternion in world space
  const billboardQuaternion = camQuat.clone();
  let localQuaternion = billboardQuaternion.clone();
  if (parentWorldQuaternion && !parentWorldQuaternion.equals(new THREE.Quaternion())) {
    localQuaternion.copy(parentWorldQuaternion).invert().multiply(camQuat);
  }

  // 3. Perspective Distance Scaling
  const dist = anchorWorldPos.distanceTo(camPos);
  const rawScale = dist / distanceScaleRefMeters;
  const clampedScale = THREE.MathUtils.clamp(
    0.70 + 0.30 * rawScale,
    minWorldScale,
    maxWorldScale
  );

  return {
    anchorWorldPos,
    enforcedOffset,
    billboardQuaternion,
    localQuaternion,
    worldScale: clampedScale,
    hoverOffsetY,
    distanceToCamera: dist,
  };
}

// ============================================================================
// Text Wrapping & 2D Canvas Recording Engine (TICKET-003, AC-3)
// ============================================================================
export function wrapCalloutText(ctx, text, x, y, maxWidth, lineHeight, maxLines = 4) {
  if (!text || typeof text !== 'string') {
    return { lines: [], maxLineWidth: 0, overflow: false };
  }

  const words = text.split(/\s+/);
  const lines = [];
  let currentLine = '';
  let maxLineWidth = 0;
  let overflow = false;

  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    const testLine = currentLine.length > 0 ? `${currentLine} ${word}` : word;
    const metrics = ctx.measureText ? ctx.measureText(testLine) : { width: testLine.length * 10 };
    const testWidth = metrics.width;

    if (testWidth > maxWidth && currentLine.length > 0) {
      lines.push(currentLine);
      const curMetrics = ctx.measureText ? ctx.measureText(currentLine) : { width: currentLine.length * 10 };
      maxLineWidth = Math.max(maxLineWidth, curMetrics.width);
      currentLine = word;

      if (lines.length >= maxLines) {
        overflow = true;
        // Truncate remaining
        if (i < words.length - 1) {
          lines[maxLines - 1] = lines[maxLines - 1] + '...';
        }
        break;
      }
    } else {
      currentLine = testLine;
    }
  }

  if (!overflow && currentLine.length > 0 && lines.length < maxLines) {
    lines.push(currentLine);
    const curMetrics = ctx.measureText ? ctx.measureText(currentLine) : { width: currentLine.length * 10 };
    maxLineWidth = Math.max(maxLineWidth, curMetrics.width);
  }

  return {
    lines,
    maxLineWidth,
    overflow,
  };
}

export function createHologramCalloutTypographyController(options = {}) {
  const width = options.width || HOLO_CALLOUT_DEFAULT_CONFIG.canvasWidth;
  const height = options.height || HOLO_CALLOUT_DEFAULT_CONFIG.canvasHeight;
  let palette = resolveCalloutPalette(options.palette || 'neon_dark_amber');

  let canvas;
  const textCalls = [];

  if (typeof document !== 'undefined' && document.createElement) {
    canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
  } else {
    // Headless recording canvas context for Node.js parity testing
    canvas = {
      width,
      height,
      getContext: () => ({
        save: () => {},
        restore: () => {},
        clearRect: () => {},
        fillRect: (x, y, w, h) => {},
        strokeRect: (x, y, w, h) => {},
        beginPath: () => {},
        closePath: () => {},
        moveTo: (x, y) => {},
        lineTo: (x, y) => {},
        stroke: () => {},
        fill: () => {},
        arc: () => {},
        roundRect: () => {},
        fillText: (str, x, y) => {
          textCalls.push({ str: String(str), x, y });
        },
        strokeText: () => {},
        measureText: (str) => ({ width: Math.min(width - 40, (str ? str.length : 0) * 11.2) }),
        createLinearGradient: () => ({ addColorStop: () => {} }),
        createRadialGradient: () => ({ addColorStop: () => {} }),
        setLineDash: () => {},
      }),
      addEventListener: () => {},
      removeEventListener: () => {},
    };
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;

  let lastSignature = '';
  let lastRenderedLayout = {
    overflowDetected: false,
    bodyLines: [],
    headerBadge: '',
    statusBadge: '',
    coordinatesText: '',
    title: '',
    telemetryRows: [],
    tags: [],
    renderedCount: 0,
    textCalls: [],
  };

  function render(payload = {}, options = {}) {
    if (!payload) return;
    const forceRedraw = Boolean(options.forceRedraw);
    const climaxHighlight = Boolean(options.climaxHighlight);

    const headerBadge = String(payload.headerBadge || '');
    const statusBadge = String(payload.statusBadge || '');
    const coordinatesText = String(payload.coordinatesText || '');
    const title = String(payload.title || '');
    const description = String(payload.description || payload.bodyDescription || '');
    const telemetryRows = Array.isArray(payload.telemetryRows) ? payload.telemetryRows : [];
    const tags = Array.isArray(payload.tags) ? payload.tags : [];

    // Signature checking to avoid redundant canvas rasterization
    const sig = `${headerBadge}|${statusBadge}|${coordinatesText}|${title}|${description}|${JSON.stringify(telemetryRows)}|${tags.join(',')}|${palette.key}|${climaxHighlight}`;
    if (!forceRedraw && sig === lastSignature) {
      return;
    }
    lastSignature = sig;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    textCalls.length = 0;
    ctx.clearRect(0, 0, width, height);

    // See-through holographic canvas: ultra-low translucent amber wash (95% transparent)
    ctx.fillStyle = 'rgba(245, 158, 11, 0.04)';
    ctx.fillRect(0, 0, width, height);

    ctx.save();
    ctx.shadowColor = 'rgba(245, 158, 11, 0.65)';
    ctx.shadowBlur = 7;

    // Margins and Layout Bounds (Four-Region Layout)
    const marginX = 36;
    const contentWidth = width - marginX * 2;

    // -------------------------------------------------------------
    // Region 1 — Top Header & Status Bar (y: 16..76)
    // -------------------------------------------------------------
    const reg1Y = 38;
    ctx.fillStyle = palette.midWireHighStr;
    ctx.font = 'bold 20px monospace';
    ctx.fillText(headerBadge, marginX, reg1Y);

    if (statusBadge) {
      const isClimax = statusBadge.includes('CLIMAX') || climaxHighlight;
      ctx.fillStyle = isClimax ? palette.highPulseGoldStr : palette.highEmissiveStr;
      ctx.font = 'bold 18px monospace';
      ctx.fillText(statusBadge, marginX + 380, reg1Y);
    }

    if (coordinatesText) {
      ctx.fillStyle = palette.midWireLowStr;
      ctx.font = '16px monospace';
      ctx.fillText(coordinatesText, width - marginX - 260, reg1Y);
    }

    // Divider Line below Region 1
    ctx.strokeStyle = palette.midWireLowStr;
    ctx.beginPath();
    ctx.moveTo(marginX, 54);
    ctx.lineTo(width - marginX, 54);
    ctx.stroke();

    // -------------------------------------------------------------
    // Region 2 — Primary Title Region (y: 68..130)
    // -------------------------------------------------------------
    const reg2Y = 96;
    ctx.fillStyle = climaxHighlight ? palette.highPulseGoldStr : palette.textPrimary;
    ctx.font = 'bold 30px sans-serif';
    ctx.fillText(title.toUpperCase(), marginX, reg2Y);

    // -------------------------------------------------------------
    // Region 3 — Body Copy & Concept Summary (y: 136..240)
    // -------------------------------------------------------------
    ctx.fillStyle = palette.textSecondary;
    ctx.font = '18px sans-serif';
    const wrapped = wrapCalloutText(ctx, description, marginX, 142, contentWidth, 26, 3);
    let curBodyY = 142;
    for (const line of wrapped.lines) {
      ctx.fillText(line, marginX, curBodyY);
      curBodyY += 26;
    }

    // Divider Line above Region 4
    ctx.strokeStyle = 'rgba(217, 91, 0, 0.45)';
    ctx.beginPath();
    ctx.moveTo(marginX, 248);
    ctx.lineTo(width - marginX, 248);
    ctx.stroke();

    // -------------------------------------------------------------
    // Region 4 — Live Telemetry & Metadata Readout Grid (y: 260..480)
    // -------------------------------------------------------------
    const rowWidth = (contentWidth - 28) / 2;
    const rowHeight = 72;
    const startY = 264;

    for (let i = 0; i < Math.min(4, telemetryRows.length); i++) {
      const row = telemetryRows[i];
      const col = i % 2;
      const r = Math.floor(i / 2);
      const rx = marginX + col * (rowWidth + 28);
      const ry = startY + r * (rowHeight + 12);

      // See-through holographic sub-card fill + glowing frame
      ctx.fillStyle = row.highlight ? 'rgba(251, 191, 36, 0.14)' : 'rgba(245, 158, 11, 0.08)';
      ctx.fillRect(rx, ry, rowWidth, rowHeight);
      ctx.strokeStyle = row.highlight ? palette.highPulseGoldStr : 'rgba(245, 158, 11, 0.48)';
      ctx.strokeRect(rx, ry, rowWidth, rowHeight);

      // Metric Label
      ctx.fillStyle = palette.midWireHighStr;
      ctx.font = '14px monospace';
      ctx.fillText(String(row.label || '').toUpperCase(), rx + 14, ry + 24);

      // Metric Value
      ctx.fillStyle = row.highlight ? palette.highPulseGoldStr : palette.highEmissiveStr;
      ctx.font = 'bold 20px monospace';
      ctx.fillText(String(row.value || ''), rx + 14, ry + 54);
    }

    // Tags Row + Click-to-Focus Hint
    if (tags.length > 0) {
      ctx.fillStyle = palette.textMuted || palette.midWireLowStr;
      ctx.font = '13px monospace';
      const tagStr = tags.map((t) => `[ ${t} ]`).join('  ');
      ctx.fillText(tagStr, marginX, height - 22);
    }
    ctx.fillStyle = palette.highPulseGoldStr;
    ctx.font = 'bold 12px monospace';
    ctx.fillText('[ CLICK POP-UP TO FOCUS CAMERA ]', width - marginX - 245, height - 22);
    ctx.restore();

    lastRenderedLayout = {
      overflowDetected: wrapped.overflow,
      bodyLines: wrapped.lines,
      headerBadge,
      statusBadge,
      coordinatesText,
      title,
      telemetryRows,
      tags,
      renderedCount: lastRenderedLayout.renderedCount + 1,
      textCalls: [...textCalls],
    };

    texture.needsUpdate = true;
  }

  return {
    canvas,
    texture,
    get lastRenderedLayout() {
      return lastRenderedLayout;
    },
    setPalette(newPalette) {
      palette = resolveCalloutPalette(newPalette);
      lastSignature = '';
    },
    render,
    dispose() {
      texture.dispose();
    },
  };
}

// ============================================================================
// Holographic Callout Shaders & Material Suite (TICKET-003, AC-1, AC-3)
// ============================================================================
const CALLOUT_BACKING_VERT = `
varying vec2 vUv;
varying vec3 vLocalPos;
varying vec3 vViewPos;
varying vec3 vNormal;

void main() {
  vUv = uv;
  vLocalPos = position;
  vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
  vViewPos = -mvPosition.xyz;
  vNormal = normalize(normalMatrix * normal);
  gl_Position = projectionMatrix * mvPosition;
}
`;

const CALLOUT_BACKING_FRAG = `
uniform float uTime;
uniform float uScanFrequency;
uniform float uScanSpeed;
uniform float uFresnelExponent;
uniform float uMaterializeAlpha;
uniform float uOpacity;
uniform float uTransitionFlicker;
uniform float uInterferenceBoost;
uniform float uInterference;
uniform float uInterferenceStrength;
uniform float uPhaseJitter;
uniform float uWalkGlitch;
uniform float uClimaxFlash;
uniform float uClimaxBoost;
uniform float uBaseOpacity;
uniform vec3 uCoreDeepColor;
uniform vec3 uCoreShadowColor;
uniform vec3 uBorderColor;
uniform vec3 uHighPulseColor;

varying vec2 vUv;
varying vec3 vLocalPos;
varying vec3 vViewPos;
varying vec3 vNormal;

void main() {
  float gEff = max(max(uInterferenceBoost, uInterference), max(uInterferenceStrength, uWalkGlitch));
  float cEff = max(uClimaxFlash, uClimaxBoost);

  // Soft edge vignette falloff
  float vignette = smoothstep(0.0, 0.08, vUv.x) * smoothstep(1.0, 0.92, vUv.x) *
                   smoothstep(0.0, 0.10, vUv.y) * smoothstep(1.0, 0.90, vUv.y);
  float edgeSilhouette = 1.0 - vignette;

  // View-dependent Fresnel rim
  vec3 viewDir = normalize(vViewPos);
  float ndv = abs(dot(normalize(vNormal), viewDir));
  float fresnel = pow(1.0 - ndv, uFresnelExponent) * (1.0 + 1.2 * gEff);

  // Spatial scanlines & holographic interference grid with speed boost
  float effScanSpeed = uScanSpeed * (1.0 + 2.0 * gEff);
  float scan = 0.5 + 0.5 * sin(vLocalPos.y * uScanFrequency - uTime * effScanSpeed + uPhaseJitter);
  float fineGrid = step(0.92, fract(vUv.y * 42.0 - uTime * 0.45)) * 0.35 +
                   step(0.96, fract(vUv.x * 32.0)) * 0.18;

  // Harmonic hum & transition flicker
  float hum = 0.92 + 0.08 * sin(uTime * 19.5 + vLocalPos.y * 11.0);
  float flicker = 1.0 - 0.35 * uTransitionFlicker * step(0.5, sin(uTime * 68.0 + vUv.y * 40.0));

  // See-through holographic projection tint
  vec3 col = mix(uCoreDeepColor, uCoreShadowColor, vUv.y) * 0.65;
  col += uBorderColor * (edgeSilhouette * 0.85 + fresnel * 0.55 + fineGrid * 0.45);
  col += uHighPulseColor * (cEff * 0.85 + scan * 0.22 + fineGrid * 0.25 + gEff * 0.40);

  float scanMod = 0.65 + 0.35 * scan + fineGrid * 0.30;
  float interiorAlpha = uBaseOpacity * vignette * scanMod;
  float rimAlpha = 0.54 * edgeSilhouette + 0.28 * fresnel;
  float alpha = (interiorAlpha + rimAlpha) * uOpacity * uMaterializeAlpha * hum * flicker;
  gl_FragColor = vec4(col, clamp(alpha, 0.0, 0.66));
}
`;

const CALLOUT_WIREFRAME_VERT = `
varying vec3 vLocalPos;
varying vec2 vUv;

void main() {
  vLocalPos = position;
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const CALLOUT_WIREFRAME_FRAG = `
uniform float uTime;
uniform float uMaterializeAlpha;
uniform float uOpacity;
uniform float uInterferenceBoost;
uniform float uInterference;
uniform float uInterferenceStrength;
uniform float uClimaxFlash;
uniform float uClimaxBoost;
uniform vec3 uWireLowColor;
uniform vec3 uWireHighColor;
uniform vec3 uHighPulseColor;

varying vec3 vLocalPos;
varying vec2 vUv;

void main() {
  float gEff = max(max(uInterferenceBoost, uInterference), uInterferenceStrength);
  float cEff = max(uClimaxFlash, uClimaxBoost);

  vec3 col = mix(uWireLowColor, uWireHighColor, 0.5 + 0.5 * sin(vLocalPos.x * 24.0 + uTime * 4.0));
  col += uHighPulseColor * (cEff * 0.90 + gEff * 0.50);

  float alpha = uOpacity * uMaterializeAlpha;
  gl_FragColor = vec4(col, alpha);
}
`;

const CALLOUT_LIGHTBARS_VERT = `
uniform float uIgnitionScaleX;
varying vec2 vUv;

void main() {
  vUv = uv;
  vec3 pos = position;
  pos.x *= uIgnitionScaleX;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}
`;

const CALLOUT_LIGHTBARS_FRAG = `
uniform float uMaterializeAlpha;
uniform float uOpacity;
uniform float uClimaxFlash;
uniform float uClimaxBoost;
uniform vec3 uHighEmissiveColor;
uniform vec3 uHighPulseColor;

varying vec2 vUv;

void main() {
  float cEff = max(uClimaxFlash, uClimaxBoost);
  float distToCenter = abs(vUv.x - 0.5) * 2.0;
  float intensity = 1.0 - smoothstep(0.0, 1.0, distToCenter);

  vec3 col = mix(uHighEmissiveColor, uHighPulseColor, intensity + cEff * 0.5);
  float alpha = intensity * uOpacity * uMaterializeAlpha;

  gl_FragColor = vec4(col, alpha);
}
`;

const CALLOUT_TYPO_VERT = `
varying vec2 vUv;
varying vec3 vLocalPos;

void main() {
  vUv = uv;
  vLocalPos = position;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const CALLOUT_TYPO_FRAG = `
uniform sampler2D uTypographyTexture;
uniform float uTime;
uniform float uMaterializeAlpha;
uniform float uOpacity;
uniform float uPhaseJitter;
uniform float uGlitchIntensity;
uniform float uInterferenceStrength;
uniform float uClimaxFlash;
uniform float uClimaxBoost;
uniform vec3 uHighlightColor;

varying vec2 vUv;
varying vec3 vLocalPos;

void main() {
  vec2 uv = vUv;
  float gEff = max(uGlitchIntensity, uInterferenceStrength);

  // Horizontal glitch jitter on typography
  if (gEff > 0.001 || abs(uPhaseJitter) > 0.001) {
    uv.x += 0.012 * sin(uTime * 48.0 + vLocalPos.y * 36.0) * (gEff + abs(uPhaseJitter) * 0.25);
  }

  vec4 texColor = texture2D(uTypographyTexture, uv);

  // Fine scanline modulation
  float scan = 0.88 + 0.12 * sin(vLocalPos.y * 64.0 - uTime * 4.2 + uPhaseJitter);
  float hum = 0.94 + 0.06 * sin(uTime * 19.5);

  vec3 col = texColor.rgb * scan * hum;
  float cEff = max(uClimaxFlash, uClimaxBoost);
  col += uHighlightColor * (cEff * 0.45 * texColor.a);

  float alpha = texColor.a * uOpacity * uMaterializeAlpha;
  gl_FragColor = vec4(col, alpha);
}
`;

export function createHologramCalloutMaterialSuite(options = {}) {
  let palette = resolveCalloutPalette(options.palette || 'neon_dark_amber');
  const typographyTexture = options.typographyTexture || null;
  const applyStencilReject = typeof options.applyStencilReject === 'function' ? options.applyStencilReject : null;

  function configureHoloMaterial(mat) {
    mat.transparent = true;
    mat.depthTest = true;
    mat.depthWrite = false;
    mat.stencilWrite = false;
    mat.stencilRef = 1;
    mat.stencilFunc = THREE.NotEqualStencilFunc;
    mat.stencilFail = THREE.KeepStencilOp;
    mat.stencilZFail = THREE.KeepStencilOp;
    mat.stencilZPass = THREE.KeepStencilOp;

    if (applyStencilReject) {
      applyStencilReject(mat);
    }
    return mat;
  }

  const backingMat = configureHoloMaterial(
    new THREE.ShaderMaterial({
      name: 'HoloCallout_BackingMaterial',
      vertexShader: CALLOUT_BACKING_VERT,
      fragmentShader: CALLOUT_BACKING_FRAG,
      side: THREE.DoubleSide,
      uniforms: {
        uTime: { value: 0.0 },
        uScanFrequency: { value: HOLO_CALLOUT_DEFAULT_CONFIG.scanFrequency },
        uScanSpeed: { value: HOLO_CALLOUT_DEFAULT_CONFIG.scanSpeed },
        uFresnelExponent: { value: HOLO_CALLOUT_DEFAULT_CONFIG.fresnelExponent },
        uMaterializeAlpha: { value: 0.0 },
        uOpacity: { value: 0.0 },
        uTransitionFlicker: { value: 0.0 },
        uInterferenceBoost: { value: 0.0 },
        uInterference: { value: 0.0 },
        uInterferenceStrength: { value: 0.0 },
        uPhaseJitter: { value: 0.0 },
        uWalkGlitch: { value: 0.0 },
        uClimaxFlash: { value: 0.0 },
        uClimaxBoost: { value: 0.0 },
        uBaseOpacity: { value: 0.22 },
        uCoreDeepColor: { value: palette.coreDeepColor.clone() },
        uCoreShadowColor: { value: palette.coreShadowColor.clone() },
        uBorderColor: { value: palette.midWireHighColor.clone() },
        uHighPulseColor: { value: palette.highPulseGoldColor.clone() },
        // Aliases for parity tests
        uCoreColor: { value: palette.coreDeepColor.clone() },
        uHighlightColor: { value: palette.highPulseGoldColor.clone() },
      },
    })
  );

  const wireframeMat = configureHoloMaterial(
    new THREE.ShaderMaterial({
      name: 'HoloCallout_WireframeMaterial',
      vertexShader: CALLOUT_WIREFRAME_VERT,
      fragmentShader: CALLOUT_WIREFRAME_FRAG,
      uniforms: {
        uTime: { value: 0.0 },
        uMaterializeAlpha: { value: 0.0 },
        uOpacity: { value: 0.0 },
        uInterferenceBoost: { value: 0.0 },
        uInterference: { value: 0.0 },
        uInterferenceStrength: { value: 0.0 },
        uClimaxFlash: { value: 0.0 },
        uClimaxBoost: { value: 0.0 },
        uWireLowColor: { value: palette.midWireLowColor.clone() },
        uWireHighColor: { value: palette.midWireHighColor.clone() },
        uHighPulseColor: { value: palette.highPulseGoldColor.clone() },
        uBorderColor: { value: palette.midWireHighColor.clone() },
        uHighlightColor: { value: palette.highPulseGoldColor.clone() },
      },
    })
  );

  const lightBarsMat = configureHoloMaterial(
    new THREE.ShaderMaterial({
      name: 'HoloCallout_LightBarsMaterial',
      vertexShader: CALLOUT_LIGHTBARS_VERT,
      fragmentShader: CALLOUT_LIGHTBARS_FRAG,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      uniforms: {
        uIgnitionScaleX: { value: 1.0 },
        uMaterializeAlpha: { value: 0.0 },
        uOpacity: { value: 0.0 },
        uClimaxFlash: { value: 0.0 },
        uClimaxBoost: { value: 0.0 },
        uHighEmissiveColor: { value: palette.highEmissiveColor.clone() },
        uHighPulseColor: { value: palette.highPulseGoldColor.clone() },
        uHighlightColor: { value: palette.highPulseGoldColor.clone() },
      },
    })
  );

  const typographyMat = configureHoloMaterial(
    new THREE.ShaderMaterial({
      name: 'HoloCallout_TypographyMaterial',
      vertexShader: CALLOUT_TYPO_VERT,
      fragmentShader: CALLOUT_TYPO_FRAG,
      transparent: true,
      side: THREE.DoubleSide,
      uniforms: {
        uTypographyTexture: { value: typographyTexture },
        uTime: { value: 0.0 },
        uMaterializeAlpha: { value: 0.0 },
        uOpacity: { value: 0.0 },
        uPhaseJitter: { value: 0.0 },
        uGlitchIntensity: { value: 0.0 },
        uInterferenceStrength: { value: 0.0 },
        uClimaxFlash: { value: 0.0 },
        uClimaxBoost: { value: 0.0 },
        uHighlightColor: { value: palette.highPulseGoldColor.clone() },
      },
    })
  );

  const materials = [backingMat, wireframeMat, lightBarsMat, typographyMat];

  function setPalette(newPalette) {
    palette = resolveCalloutPalette(newPalette);
    backingMat.uniforms.uCoreDeepColor.value.copy(palette.coreDeepColor);
    backingMat.uniforms.uCoreShadowColor.value.copy(palette.coreShadowColor);
    backingMat.uniforms.uBorderColor.value.copy(palette.midWireHighColor);
    backingMat.uniforms.uHighPulseColor.value.copy(palette.highPulseGoldColor);
    backingMat.uniforms.uCoreColor.value.copy(palette.coreDeepColor);
    backingMat.uniforms.uHighlightColor.value.copy(palette.highPulseGoldColor);

    wireframeMat.uniforms.uWireLowColor.value.copy(palette.midWireLowColor);
    wireframeMat.uniforms.uWireHighColor.value.copy(palette.midWireHighColor);
    wireframeMat.uniforms.uHighPulseColor.value.copy(palette.highPulseGoldColor);
    wireframeMat.uniforms.uBorderColor.value.copy(palette.midWireHighColor);
    wireframeMat.uniforms.uHighlightColor.value.copy(palette.highPulseGoldColor);

    lightBarsMat.uniforms.uHighEmissiveColor.value.copy(palette.highEmissiveColor);
    lightBarsMat.uniforms.uHighPulseColor.value.copy(palette.highPulseGoldColor);
    lightBarsMat.uniforms.uHighlightColor.value.copy(palette.highPulseGoldColor);

    typographyMat.uniforms.uHighlightColor.value.copy(palette.highPulseGoldColor);
  }

  function updateUniforms(state = {}) {
    const timeSec = state.timeSec !== undefined ? state.timeSec : 0.0;
    const opacity = state.opacity !== undefined ? state.opacity : 1.0;
    const materializeAlpha = state.materializeAlpha !== undefined ? state.materializeAlpha : 1.0;
    const interference = state.interferenceStrength !== undefined ? state.interferenceStrength : 0.0;
    const phaseJitter = state.phaseJitter !== undefined ? state.phaseJitter : 0.0;
    const climax = state.climaxBoost !== undefined ? state.climaxBoost : 0.0;
    const glitch = state.glitchIntensity !== undefined ? state.glitchIntensity : 0.0;
    const transitionFlicker = state.transitionFlicker !== undefined ? state.transitionFlicker : 0.0;
    const ignitionScaleX = state.ignitionScaleX !== undefined ? state.ignitionScaleX : 1.0;

    for (const m of materials) {
      if (m.uniforms.uTime) m.uniforms.uTime.value = timeSec;
      if (m.uniforms.uOpacity) m.uniforms.uOpacity.value = opacity;
      if (m.uniforms.uMaterializeAlpha) m.uniforms.uMaterializeAlpha.value = materializeAlpha;
      if (m.uniforms.uInterferenceStrength) m.uniforms.uInterferenceStrength.value = interference;
      if (m.uniforms.uInterferenceBoost) m.uniforms.uInterferenceBoost.value = interference;
      if (m.uniforms.uInterference) m.uniforms.uInterference.value = interference;
      if (m.uniforms.uPhaseJitter) m.uniforms.uPhaseJitter.value = phaseJitter;
      if (m.uniforms.uClimaxFlash) m.uniforms.uClimaxFlash.value = climax;
      if (m.uniforms.uClimaxBoost) m.uniforms.uClimaxBoost.value = climax;
      if (m.uniforms.uGlitchIntensity) m.uniforms.uGlitchIntensity.value = glitch;
      if (m.uniforms.uTransitionFlicker) m.uniforms.uTransitionFlicker.value = transitionFlicker;
      if (m.uniforms.uIgnitionScaleX) m.uniforms.uIgnitionScaleX.value = ignitionScaleX;
    }
  }

  return {
    backingMat,
    wireframeMat,
    lightBarsMat,
    typographyMat,
    materials,
    setPalette,
    updateUniforms,
    dispose() {
      materials.forEach((m) => m.dispose());
    },
  };
}

// ============================================================================
// Merged Geometry Builders (TICKET-002, TICKET-003)
// ============================================================================
export function createCalloutWireframeGeometry(width, height) {
  const halfW = width * 0.5;
  const halfH = height * 0.5;
  const cornerLen = 0.06;

  const points = [];

  // Outer perimeter frame
  points.push(
    -halfW, -halfH, 0,  halfW, -halfH, 0,
     halfW, -halfH, 0,  halfW,  halfH, 0,
     halfW,  halfH, 0, -halfW,  halfH, 0,
    -halfW,  halfH, 0, -halfW, -halfH, 0
  );

  // 4 L-shaped corner calibration brackets (offset slightly inside)
  const pad = 0.015;
  // Top-left
  points.push(
    -halfW + pad,  halfH - pad, 0,  -halfW + pad + cornerLen,  halfH - pad, 0,
    -halfW + pad,  halfH - pad, 0,  -halfW + pad,  halfH - pad - cornerLen, 0
  );
  // Top-right
  points.push(
     halfW - pad,  halfH - pad, 0,   halfW - pad - cornerLen,  halfH - pad, 0,
     halfW - pad,  halfH - pad, 0,   halfW - pad,  halfH - pad - cornerLen, 0
  );
  // Bottom-left
  points.push(
    -halfW + pad, -halfH + pad, 0,  -halfW + pad + cornerLen, -halfH + pad, 0,
    -halfW + pad, -halfH + pad, 0,  -halfW + pad, -halfH + pad + cornerLen, 0
  );
  // Bottom-right
  points.push(
     halfW - pad, -halfH + pad, 0,   halfW - pad - cornerLen, -halfH + pad, 0,
     halfW - pad, -halfH + pad, 0,   halfW - pad, -halfH + pad + cornerLen, 0
  );

  // Header divider rule
  const divY = halfH - 0.08;
  points.push(-halfW + 0.02, divY, 0, halfW - 0.02, divY, 0);

  // Coordinate reticle ticks
  points.push(
    0,  halfH, 0,  0,  halfH + 0.015, 0,
    0, -halfH, 0,  0, -halfH - 0.015, 0,
    -halfW, 0, 0, -halfW - 0.015, 0, 0,
     halfW, 0, 0,  halfW + 0.015, 0, 0
  );

  // Tether leader line from bottom bracket downward
  points.push(0, -halfH, 0, 0, -halfH - 0.14, 0);

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(points, 3));
  return geometry;
}

export function createCalloutLightBarsGeometry(width, height) {
  const halfW = width * 0.5;
  const halfH = height * 0.5;
  const barH = 0.012;

  // Top and bottom bar planes
  const topY = halfH - barH * 0.5;
  const botY = -halfH + barH * 0.5;

  const positions = [
    // Top Bar
    -halfW, topY - barH * 0.5, 0,
     halfW, topY - barH * 0.5, 0,
     halfW, topY + barH * 0.5, 0,
    -halfW, topY - barH * 0.5, 0,
     halfW, topY + barH * 0.5, 0,
    -halfW, topY + barH * 0.5, 0,
    // Bottom Bar
    -halfW, botY - barH * 0.5, 0,
     halfW, botY - barH * 0.5, 0,
     halfW, botY + barH * 0.5, 0,
    -halfW, botY - barH * 0.5, 0,
     halfW, botY + barH * 0.5, 0,
    -halfW, botY + barH * 0.5, 0,
  ];

  const uvs = [
    0, 0,  1, 0,  1, 1,  0, 0,  1, 1,  0, 1,
    0, 0,  1, 0,  1, 1,  0, 0,  1, 1,  0, 1,
  ];

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  return geometry;
}

// ============================================================================
// Deterministic 4-Stage Lifecycle State Evaluation (TICKET-004)
// ============================================================================
export function evaluateCalloutLifecycleState(currentState, stageElapsed, shouldBeActive, config = {}) {
  const T_ign = config.materializeDurationSec || 0.32;
  const T_col = config.dematerializeDurationSec || 0.24;

  let state = currentState || HOLO_CALLOUT_LIFECYCLE_STATES.DORMANT;
  let elapsed = stageElapsed || 0.0;
  let transitioned = false;

  if (state === HOLO_CALLOUT_LIFECYCLE_STATES.DORMANT) {
    if (shouldBeActive) {
      state = HOLO_CALLOUT_LIFECYCLE_STATES.MATERIALIZING;
      elapsed = 0.0;
      transitioned = true;
    }
  } else if (state === HOLO_CALLOUT_LIFECYCLE_STATES.MATERIALIZING) {
    if (!shouldBeActive) {
      // Smooth reversal mid-ignition
      const p = Math.max(0.0, Math.min(1.0, elapsed / T_ign));
      state = HOLO_CALLOUT_LIFECYCLE_STATES.DEMATERIALIZING;
      elapsed = (1.0 - p) * T_col;
      transitioned = true;
    } else if (elapsed >= T_ign) {
      state = HOLO_CALLOUT_LIFECYCLE_STATES.ACTIVE;
      elapsed = 0.0;
      transitioned = true;
    }
  } else if (state === HOLO_CALLOUT_LIFECYCLE_STATES.ACTIVE) {
    if (!shouldBeActive) {
      state = HOLO_CALLOUT_LIFECYCLE_STATES.DEMATERIALIZING;
      elapsed = 0.0;
      transitioned = true;
    }
  } else if (state === HOLO_CALLOUT_LIFECYCLE_STATES.DEMATERIALIZING) {
    if (shouldBeActive) {
      // Smooth reversal mid-collapse
      const p = Math.max(0.0, Math.min(1.0, elapsed / T_col));
      state = HOLO_CALLOUT_LIFECYCLE_STATES.MATERIALIZING;
      elapsed = (1.0 - p) * T_ign;
      transitioned = true;
    } else if (elapsed >= T_col) {
      state = HOLO_CALLOUT_LIFECYCLE_STATES.DORMANT;
      elapsed = 0.0;
      transitioned = true;
    }
  }

  // Compute envelope factors
  let scaleX = 1.0;
  let scaleY = 1.0;
  let opacity = 1.0;
  let materializeAlpha = 1.0;
  let glitchIntensity = 0.0;
  let transitionFlicker = 0.0;
  let ignitionScaleX = 1.0;

  if (state === HOLO_CALLOUT_LIFECYCLE_STATES.DORMANT) {
    scaleX = 0.001;
    scaleY = 0.001;
    opacity = 0.0;
    materializeAlpha = 0.0;
    ignitionScaleX = 0.001;
  } else if (state === HOLO_CALLOUT_LIFECYCLE_STATES.MATERIALIZING) {
    const p = Math.max(0.0, Math.min(1.0, elapsed / T_ign));
    if (p <= 0.45) {
      const q = easeOutCubic(p / 0.45);
      scaleX = 0.08 + 0.92 * q;
      scaleY = 0.04 + 0.06 * q;
      ignitionScaleX = scaleX;
    } else {
      const r = easeOutBack((p - 0.45) / 0.55);
      scaleX = 1.0;
      scaleY = 0.10 + 0.90 * r;
      ignitionScaleX = 1.0;
    }
    materializeAlpha = THREE.MathUtils.smoothstep(p, 0.0, 0.25);
    opacity = materializeAlpha;
    glitchIntensity = (1.0 - p) * 0.65;
    transitionFlicker = 1.0 - p;
  } else if (state === HOLO_CALLOUT_LIFECYCLE_STATES.ACTIVE) {
    scaleX = 1.0;
    scaleY = 1.0;
    opacity = 1.0;
    materializeAlpha = 1.0;
    glitchIntensity = 0.0;
    transitionFlicker = 0.0;
    ignitionScaleX = 1.0;
  } else if (state === HOLO_CALLOUT_LIFECYCLE_STATES.DEMATERIALIZING) {
    const p = Math.max(0.0, Math.min(1.0, elapsed / T_col));
    if (p <= 0.65) {
      const q = easeInCubic(p / 0.65);
      scaleX = 1.0;
      scaleY = 1.0 - 0.92 * q;
      ignitionScaleX = 1.0;
    } else {
      const r = (p - 0.65) / 0.35;
      scaleX = 1.0 - 0.95 * r;
      scaleY = 0.08 * (1.0 - r);
      ignitionScaleX = scaleX;
    }
    materializeAlpha = 1.0 - THREE.MathUtils.smoothstep(p, 0.25, 1.0);
    opacity = materializeAlpha;
    glitchIntensity = Math.sin(p * Math.PI) * 0.55;
    transitionFlicker = p;
  }

  return {
    state,
    elapsed,
    transitioned,
    scaleX,
    scaleY,
    opacity,
    materializeAlpha,
    glitchIntensity,
    transitionFlicker,
    ignitionScaleX,
    isVisible: state !== HOLO_CALLOUT_LIFECYCLE_STATES.DORMANT,
  };
}

// ============================================================================
// Authoritative MathPod Profiles (POD-01..POD-07, TICKET-004, plan schema)
// ============================================================================
export const MATHPOD_CALLOUT_PROFILES = Object.freeze([
  Object.freeze({
    index: 1,
    podId: 'pod-01-graph',
    podCode: 'POD-01',
    concept: 'graph-theory',
    defaultCorridorAnchor: { x: -0.78, yRel: 1.48, z: 6.80 },
    headerBadge: 'POD-01 // GRAPH-THEORY',
    primaryTitle: '3D GRAPH THEORY HOLOGRAM',
    bodyDescription:
      'Force-directed 18-node icosahedral network with 36 optical light-pipe filaments executing topological path traversal and collinear 3D laser alignment.',
    tags: ['18-Node Icosahedron', '36 Light-Pipes', 'Collinear Lock'],
  }),
  Object.freeze({
    index: 2,
    podId: 'pod-02-matrix',
    podCode: 'POD-02',
    concept: 'matrix-rank',
    defaultCorridorAnchor: { x: 1.28, yRel: 1.9567, z: 11.8509 },
    headerBadge: 'POD-02 // MATRIX-RANK',
    primaryTitle: 'MATRIX RANK SOLVER HOLOGRAM',
    bodyDescription:
      'Volumetric 4x4x4 lattice of 64 binary glyphs (0/1) swept by a planar row-echelon laser scanner to isolate linearly independent rows and lock full rank.',
    tags: ['4x4x4 Binary Lattice', 'Row-Echelon Scanner', 'Full Rank [4]'],
  }),
  Object.freeze({
    index: 3,
    podId: 'pod-03-gradient',
    podCode: 'POD-03',
    concept: 'gradient-descent',
    defaultCorridorAnchor: { x: -0.78, yRel: 1.46, z: 17.20 },
    headerBadge: 'POD-03 // GRADIENT-DESCENT',
    primaryTitle: 'GRADIENT DESCENT HOLOGRAM',
    bodyDescription:
      'Hyperbolic paraboloid saddle surface (z = x^2 - y^2) where SGD, Momentum, and Adam optimizer nuclei race down topographic contours toward the minimum beacon.',
    tags: ['Saddle z=x^2-y^2', 'SGD / Momentum / Adam', 'Minimum Beacon'],
  }),
  Object.freeze({
    index: 4,
    podId: 'pod-04-neural',
    podCode: 'POD-04',
    concept: 'neural-network',
    defaultCorridorAnchor: { x: 0.78, yRel: 1.54, z: 22.40 },
    headerBadge: 'POD-04 // NEURAL-NETWORK',
    primaryTitle: 'NEURAL NETWORK HOLOGRAM',
    bodyDescription:
      'Three-layer (9 Input -> 16 Hidden -> 4 Output) holographic glass architecture firing weighted synaptic light pulses across 208 beams to lock a winning classification node.',
    tags: ['9->16->4 Architecture', '208 Synaptic Beams', 'Winner Lock'],
  }),
  Object.freeze({
    index: 5,
    podId: 'pod-05-clustering',
    podCode: 'POD-05',
    concept: 'clustering',
    defaultCorridorAnchor: { x: -0.7502, yRel: 1.7176, z: 27.8776 },
    headerBadge: 'POD-05 // CLUSTERING',
    primaryTitle: 'CLUSTERING ALGORITHM HOLOGRAM',
    bodyDescription:
      '120-particle data swarm converging around 3 rotating octahedron centroid beacons inside Fresnel-rimmed Gaussian ellipsoid containment shells.',
    tags: ['120-Particle Swarm', '3 Centroids', 'Gaussian Shells'],
  }),
  Object.freeze({
    index: 7,
    podId: 'pod-07-poker',
    podCode: 'POD-07',
    concept: 'poker-game-theory',
    defaultCorridorAnchor: { x: 0.00, yRel: 1.56, z: 35.40 },
    headerBadge: 'POD-07 // POKER-GAME-THEORY',
    primaryTitle: 'POKER / GAME THEORY HOLOGRAM',
    bodyDescription:
      '5-card holographic flop/turn/river arc paired with 3 volumetric expected-value (EV) probability bars (FOLD, CALL, RAISE ★) and a 9-node CFR decision tree.',
    tags: ['5-Card Hologram Arc', '3 EV Bars (RAISE ★)', '9-Node CFR Tree'],
  }),
]);

export function formatMathPodCalloutPayload(pod, profile) {
  const t = pod.telemetry || {};
  const stage = (pod.cycleState && pod.cycleState.stage) || pod.stageName || 'SPAWN';
  const isClimax = stage.toLowerCase() === 'climax';
  const statusBadge = isClimax ? 'CLIMAX LOCK' : `STAGE: ${stage.toUpperCase()}`;

  const pos = pod.rootGroup ? pod.rootGroup.position : pod.worldPos || new THREE.Vector3();
  const coordinatesText = `XYZ(${pos.x >= 0 ? '+' : ''}${pos.x.toFixed(2)}, +${pos.y.toFixed(2)}, ${pos.z >= 0 ? '+' : ''}${pos.z.toFixed(2)})`;

  const telemetryRows = [];

  switch (profile.concept) {
    case 'graph-theory':
      telemetryRows.push(
        { label: 'Extracted Nodes', value: `${t.extractedNodeCount || 0} / 6`, highlight: (t.extractedNodeCount || 0) >= 6 },
        { label: 'Collinear Align', value: `${((t.collinearAlignmentFactor || 0) * 100).toFixed(1)}%`, highlight: (t.collinearAlignmentFactor || 0) > 0.8 },
        { label: 'Dijkstra Pulse', value: `${((t.activePulseProgress || 0) * 100).toFixed(0)}%`, highlight: false },
        { label: 'Topology', value: '18V / 36E ICOSAHEDRON', highlight: false }
      );
      break;
    case 'matrix-rank':
      telemetryRows.push(
        { label: 'Pivot Rows Locked', value: `${t.lockedRows || 0} / 4`, highlight: (t.lockedRows || 0) >= 4 },
        { label: 'Rank Status', value: t.isFullRank ? 'FULL RANK (4)' : 'CONVERGING', highlight: Boolean(t.isFullRank) },
        { label: 'Scanner Plane Y', value: `${(t.scannerY || 0) >= 0 ? '+' : ''}${(t.scannerY || 0).toFixed(2)}m`, highlight: false },
        { label: 'Shockwave Env', value: `${(t.shockwaveScale || 1.0).toFixed(2)}x`, highlight: (t.shockwaveScale || 1.0) > 1.2 }
      );
      break;
    case 'gradient-descent':
      telemetryRows.push(
        { label: 'Adam Dist To Min', value: `${(t.adamDistanceToBeacon || 0).toFixed(3)}m`, highlight: (t.adamDistanceToBeacon || 0) < 0.1 },
        { label: 'Active Solvers', value: 'SGD | MOM | ADAM', highlight: false },
        { label: 'Adam Coord', value: `(${t.optimizers && t.optimizers[2] ? t.optimizers[2].position.x.toFixed(2) : '0.00'}, ${t.optimizers && t.optimizers[2] ? t.optimizers[2].position.z.toFixed(2) : '0.00'})`, highlight: false },
        { label: 'Minimum Converge', value: `${((t.targetFlashIntensity || 0) * 100).toFixed(0)}%`, highlight: (t.targetFlashIntensity || 0) > 0.7 }
      );
      break;
    case 'neural-network':
      telemetryRows.push(
        { label: 'Synaptic Wave L0', value: `${((t.waveLayer0 || 0) * 100).toFixed(0)}%`, highlight: false },
        { label: 'Synaptic Wave L1', value: `${((t.waveLayer1 || 0) * 100).toFixed(0)}%`, highlight: false },
        { label: 'Hidden Ripples', value: `${t.activeHiddenRipples || 0} / 16 ACTIVE`, highlight: (t.activeHiddenRipples || 0) > 12 },
        { label: 'Argmax Class Lock', value: `${((t.winningNodeFlare || 0) * 100).toFixed(0)}%`, highlight: (t.winningNodeFlare || 0) > 0.8 }
      );
      break;
    case 'clustering':
      telemetryRows.push(
        { label: 'Lloyd Convergence', value: `${((t.convergenceProgress || 0) * 100).toFixed(1)}%`, highlight: (t.convergenceProgress || 0) > 0.9 },
        { label: 'Voronoi Cells', value: `K = ${t.activeClusters || 3} PARTITIONS`, highlight: false },
        { label: 'Tether Intensity', value: `${((t.tetherBeamIntensity || 0) * 100).toFixed(0)}%`, highlight: (t.tetherBeamIntensity || 0) > 0.7 },
        { label: 'Sample Cloud', value: '120 PTS / 3 CENTROIDS', highlight: false }
      );
      break;
    case 'anomaly-detection':
      telemetryRows.push(
        { label: 'Isolated Outliers', value: `${t.isolatedCount || 0} / 2 QUARANTINED`, highlight: (t.isolatedCount || 0) >= 2 },
        { label: 'Radar Sweep Angle', value: `${(((t.scannerAngle || 0) * 180 / Math.PI) % 360).toFixed(0)} DEG`, highlight: false },
        { label: 'Purge Envelope', value: `${((t.purgeProgress || 0) * 100).toFixed(0)}%`, highlight: (t.purgeProgress || 0) > 0.7 },
        { label: 'Core Distribution', value: '96 PTS / 2 ANOMALIES', highlight: false }
      );
      break;
    case 'poker-game-theory': {
      const evs = t.evValues || [-1.0, 1.25, 4.82];
      const dealtCount = t.dealtCardCount || 0;
      let streetStr = 'RIVER';
      if (dealtCount === 0) {
        streetStr = 'PREFLOP';
      } else if (dealtCount === 3) {
        streetStr = 'FLOP';
      } else if (dealtCount === 4) {
        streetStr = 'TURN';
      }
      telemetryRows.push(
        { label: 'Board Runout', value: `${dealtCount} / 5 (${streetStr})`, highlight: dealtCount >= 5 },
        { label: 'EV [Fold / Call]', value: `${evs[0].toFixed(2)} / +${evs[1].toFixed(2)} BB`, highlight: false },
        { label: 'Optimal Raise +EV', value: `+${evs[2].toFixed(2)} BB ★`, highlight: true },
        { label: 'Optimal Path Lock', value: `${((t.optimalPathFlare || 0) * 100).toFixed(0)}%`, highlight: (t.optimalPathFlare || 0) > 0.8 }
      );
      break;
    }
    default:
      telemetryRows.push(
        { label: 'Cycle Stage', value: stage.toUpperCase(), highlight: isClimax },
        { label: 'Status', value: 'ACTIVE', highlight: false }
      );
  }

  return {
    headerBadge: profile.headerBadge,
    statusBadge,
    coordinatesText,
    title: profile.primaryTitle,
    description: profile.bodyDescription,
    tags: profile.tags || [],
    telemetryRows,
    climaxHighlight: isClimax,
  };
}

// ============================================================================
// Universal Scene Asset Presets (TICKET-005, anim/mathpod_popup.md §6)
// ============================================================================
export const UNIVERSAL_ASSET_CALLOUT_PRESETS = Object.freeze([
  Object.freeze({
    id: 'SCREEN_MOUNT_01',
    targetName: 'SCREEN_MOUNT_01',
    fallbackPosition: { x: -1.42, y: 2.35, z: 8.0 },
    theme: 'neon_dark_amber',
    offset: { x: 0.45, y: 0.35, z: 0.0 },
    clearanceRadius: 0.35,
    payload: {
      headerBadge: 'MOUNT-01 // FREEMAN-WALL',
      statusBadge: 'ONLINE',
      title: 'WALL SCREEN TERMINAL 01',
      description: 'Diegetic high-resolution holographic wall mount screen with interactive viewport streaming.',
      tags: ['Wall Mount', 'Free-Roam', 'Terminal'],
      telemetryRows: [
        { label: 'Resolution', value: '1920x1080 FHD', highlight: false },
        { label: 'Signal Lock', value: '100% 60 FPS', highlight: true },
      ],
    },
  }),
  Object.freeze({
    id: 'ALARM_LIGHT_01',
    targetName: 'ALARM_LIGHT_01',
    fallbackPosition: { x: 0.0, y: 3.65, z: 14.0 },
    theme: 'industrial_amber',
    offset: { x: 0.0, y: -0.55, z: 0.0 },
    clearanceRadius: 0.30,
    payload: {
      headerBadge: 'ALARM-01 // CEILING-STROBE',
      statusBadge: 'BALLAST ARMED',
      title: 'INDUSTRIAL ALARM FIXTURE 01',
      description: 'Overhead industrial sodium strobe light fixture with harmonic ballast flicker.',
      tags: ['Alarm Light', 'Sodium Strobe', 'Industrial'],
      telemetryRows: [
        { label: 'Ballast Flicker', value: '43.2 Hz', highlight: false },
        { label: 'Strobe State', value: 'ARMED', highlight: true },
      ],
    },
  }),
  Object.freeze({
    id: 'DOOM_Companion',
    targetName: 'DOOM_Companion',
    fallbackPosition: { x: 0.65, y: 1.85, z: 0.0 },
    theme: 'holosys_cyan',
    offset: { x: 0.52, y: 0.48, z: 0.0 },
    clearanceRadius: 0.42,
    payload: {
      headerBadge: 'COMPANION // DOOM-DRONE',
      statusBadge: 'LEVITATING',
      title: 'DOOM COMPANION DRONE',
      description: 'Autonomous companion drone executing 3D harmonic levitation and environmental reconnaissance.',
      tags: ['Companion', 'Levitation', 'HOLO.SYS'],
      telemetryRows: [
        { label: 'Levitation Offset', value: '+0.12m HARMONIC', highlight: false },
        { label: 'Telemetry Stream', value: 'SYNCHRONIZED', highlight: true },
      ],
    },
  }),
]);

// ============================================================================
// Core Hologram Callout Instance (TICKET-001, TICKET-002, TICKET-004)
// ============================================================================
export class MathPodPopupCallout {
  constructor(descriptor, options = {}) {
    this.descriptor = normalizeHostDescriptor(descriptor);
    this.id = this.descriptor.id;
    this.options = options;

    const fw = this.descriptor.frameWidth;
    const fh = this.descriptor.frameHeight;
    const axial = HOLO_CALLOUT_DEFAULT_CONFIG.axialOffsets;
    const ro = HOLO_CALLOUT_DEFAULT_CONFIG.renderOrders;

    // Transform Hierarchy
    this.rootGroup = new THREE.Group();
    this.rootGroup.name = `HoloCalloutRoot_${this.id}`;
    this.rootGroup.visible = false; // Zero draw calls when dormant

    this.billboardGroup = new THREE.Group();
    this.billboardGroup.name = `HoloCalloutBillboard_${this.id}`;
    this.rootGroup.add(this.billboardGroup);

    this.unfoldGroup = new THREE.Group();
    this.unfoldGroup.name = `HoloCalloutUnfold_${this.id}`;
    this.billboardGroup.add(this.unfoldGroup);

    // Typography Controller
    this.typographyController = createHologramCalloutTypographyController({
      width: this.descriptor.canvasWidth,
      height: this.descriptor.canvasHeight,
      palette: this.descriptor.palette,
    });

    // Material Suite
    this.materialSuite = createHologramCalloutMaterialSuite({
      palette: this.descriptor.palette,
      typographyTexture: this.typographyController.texture,
      applyStencilReject: options.applyStencilReject || null,
    });

    // Sub-Layer 1: Backing Plane (z = 0.000)
    const backingGeo = new THREE.PlaneGeometry(fw, fh);
    this.backingMesh = new THREE.Mesh(backingGeo, this.materialSuite.backingMat);
    this.backingMesh.name = `HoloCallout_Backing_${this.id}`;
    this.backingMesh.position.z = axial.backingPlaneZ;
    this.backingMesh.renderOrder = ro.backingPlane;
    this.backingMesh.raycast = () => {}; // Raycast transparent by default
    this.unfoldGroup.add(this.backingMesh);

    // Sub-Layer 2: Wireframe Borders & Reticles (z = 0.004)
    const wireframeGeo = createCalloutWireframeGeometry(fw, fh);
    this.wireframeMesh = new THREE.LineSegments(wireframeGeo, this.materialSuite.wireframeMat);
    this.wireframeMesh.name = `HoloCallout_Wireframe_${this.id}`;
    this.wireframeMesh.position.z = axial.wireframeBorderZ;
    this.wireframeMesh.renderOrder = ro.wireframeBorder;
    this.wireframeMesh.raycast = () => {};
    this.unfoldGroup.add(this.wireframeMesh);

    // Sub-Layer 3: Top/Bottom Ignition Light Bars (z = 0.006)
    const lightBarsGeo = createCalloutLightBarsGeometry(fw, fh);
    this.lightBarsMesh = new THREE.Mesh(lightBarsGeo, this.materialSuite.lightBarsMat);
    this.lightBarsMesh.name = `HoloCallout_LightBars_${this.id}`;
    this.lightBarsMesh.position.z = axial.lightBarsZ;
    this.lightBarsMesh.renderOrder = ro.lightBars;
    this.lightBarsMesh.raycast = () => {};
    this.unfoldGroup.add(this.lightBarsMesh);

    // Sub-Layer 4: Foreground Typography (z = 0.009)
    const typoGeo = new THREE.PlaneGeometry(fw * 0.94, fh * 0.90);
    this.typographyMesh = new THREE.Mesh(typoGeo, this.materialSuite.typographyMat);
    this.typographyMesh.name = `HoloCallout_Typography_${this.id}`;
    this.typographyMesh.position.z = axial.typographyQuadZ;
    this.typographyMesh.renderOrder = ro.typographyQuad;
    this.typographyMesh.raycast = () => {};
    this.unfoldGroup.add(this.typographyMesh);

    // Interactive Hit Box (for explicit popup clicking & camera focus)
    this.hitBoxMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(fw, fh),
      new THREE.MeshBasicMaterial({
        transparent: true,
        opacity: 0.0,
        depthWrite: false,
        side: THREE.DoubleSide,
      })
    );
    this.hitBoxMesh.name = `HoloCallout_HitBox_${this.id}`;
    this.hitBoxMesh.position.z = axial.typographyQuadZ + 0.001;
    this.hitBoxMesh.userData = { calloutId: this.id, podId: this.id, isCalloutHitProxy: true };
    this.unfoldGroup.add(this.hitBoxMesh);

    // Dynamic State
    this.state = HOLO_CALLOUT_LIFECYCLE_STATES.DORMANT;
    this.stageElapsed = 0.0;
    this.isHovered = false;
    this.isPinned = false;
    this.isDragging = false;
    this.isWithinProximity = false;
    this.forceOpen = false;
    this.isCameraFocused = false;

    this.interferencePulse = 0.0;
    this.phaseJitter = 0.0;
    this.climaxBoost = 0.0;
    this.walkGlitch = 0.0;

    this.lastWorldPos = new THREE.Vector3();
    this.audioEngine = options.audioEngine || options.audio || null;

    // Initial render of payload if static
    if (this.descriptor.staticPayload) {
      this.typographyController.render(this.descriptor.staticPayload, { forceRedraw: true });
    }
  }

  get materials() {
    return this.materialSuite.materials;
  }

  get isVisible() {
    return this.rootGroup.visible;
  }

  getResolvedOffset() {
    return resolveClearanceOffset(
      this.descriptor.offset,
      this.descriptor.clearanceRadius,
      this.descriptor.frameHeight
    );
  }

  resolveHostWorldPosition(outVec = new THREE.Vector3()) {
    const desc = this.descriptor;
    if (desc.targetAnchor) {
      if (typeof desc.targetAnchor.getWorldPosition === 'function') {
        desc.targetAnchor.getWorldPosition(outVec);
        return outVec;
      }
      if (desc.targetAnchor.rootGroup && typeof desc.targetAnchor.rootGroup.getWorldPosition === 'function') {
        desc.targetAnchor.rootGroup.getWorldPosition(outVec);
        return outVec;
      }
      if (desc.targetAnchor.position) {
        outVec.copy(desc.targetAnchor.position);
        return outVec;
      }
    }
    if (desc.worldPosition) {
      outVec.set(desc.worldPosition.x, desc.worldPosition.y, desc.worldPosition.z);
      return outVec;
    }
    outVec.set(0, 0, 0);
    return outVec;
  }

  open() {
    this.forceOpen = true;
    this.isPinned = true;
  }

  close() {
    this.forceOpen = false;
    this.isPinned = false;
    this.isCameraFocused = false;
  }

  toggle() {
    if (this.state === HOLO_CALLOUT_LIFECYCLE_STATES.DORMANT || this.state === HOLO_CALLOUT_LIFECYCLE_STATES.DEMATERIALIZING) {
      this.open();
      return true;
    } else {
      this.close();
      return false;
    }
  }

  pin() {
    this.isPinned = true;
    this.forceOpen = true;
  }

  unpin() {
    this.isPinned = false;
    this.forceOpen = false;
    this.isCameraFocused = false;
  }

  togglePin() {
    return this.toggle();
  }

  syncWithHostPod(pod) {
    if (!pod) return;

    // Interference pulse mirror
    if (typeof pod.interferencePulse === 'number') {
      this.interferencePulse = Math.max(this.interferencePulse, pod.interferencePulse);
    }
    if (typeof pod.phaseJitter === 'number') {
      this.phaseJitter = pod.phaseJitter;
    }
    if (typeof pod.effectiveGlitchIntensity === 'number') {
      this.interferencePulse = Math.max(this.interferencePulse, pod.effectiveGlitchIntensity);
    }

    // Drag & hover state mirror
    if (pod.isDragging !== undefined) {
      this.isDragging = Boolean(pod.isDragging);
    }
    if (pod.isHovered !== undefined) {
      this.isHovered = Boolean(pod.isHovered);
    }

    // Climax flash synchronization
    const stage = (pod.cycleState && pod.cycleState.stage) || (pod.stageName ? pod.stageName.toLowerCase() : '');
    if (stage === 'climax') {
      const p = pod.cycleState ? pod.cycleState.stageProgress : 0.5;
      this.climaxBoost = Math.sin(Math.max(0.0, Math.min(1.0, p)) * Math.PI);
    } else {
      this.climaxBoost = 0.0;
    }
  }

  setPayload(payload, options = {}) {
    this.typographyController.render(payload, options);
  }

  setTheme(themeInput) {
    this.descriptor.palette = resolveCalloutPalette(themeInput);
    this.materialSuite.setPalette(this.descriptor.palette);
    this.typographyController.setPalette(this.descriptor.palette);
  }

  update(dt = 1 / 60, timeSec = 0.0, context = {}) {
    const clampedDt = Math.max(0.0001, Math.min(dt, 0.1));
    this.stageElapsed += clampedDt;

    // Decay interference & jitter
    this.interferencePulse *= Math.exp(-3.6 * clampedDt);
    this.phaseJitter *= Math.exp(-5.0 * clampedDt);

    // Resolve Host Position & Distance
    this.resolveHostWorldPosition(_tmpHostPos);

    // Proximity Trigger Evaluation (only if autoRevealEnabled and allowed by triggerPolicy)
    const policy = Array.isArray(this.descriptor.triggerPolicy) ? this.descriptor.triggerPolicy : ['click'];
    const allowProximity = Boolean(this.descriptor.autoRevealEnabled && policy.includes('proximity'));
    const allowHover = policy.includes('hover');
    const allowDrag = policy.includes('drag');

    if (allowProximity && context && (context.camera || context.characterPosition || context.character)) {
      let minTargetDist = Infinity;
      if (context.camera) {
        const camPos = context.camera.position || _tmpCamPos;
        minTargetDist = Math.min(minTargetDist, _tmpHostPos.distanceTo(camPos));
      }
      const charPos = context.characterPosition || (context.character && context.character.position);
      if (charPos) {
        minTargetDist = Math.min(minTargetDist, _tmpHostPos.distanceTo(charPos));
      }

      const enterR = this.descriptor.autoRevealRadius;
      const exitR = enterR + this.descriptor.autoRevealHysteresis;
      if (this.isWithinProximity) {
        this.isWithinProximity = minTargetDist <= exitR;
      } else {
        this.isWithinProximity = minTargetDist <= enterR;
      }
    } else {
      this.isWithinProximity = false;
    }

    if (context && context.hoveredMathPod !== undefined) {
      const hoveredId = typeof context.hoveredMathPod === 'string' ? context.hoveredMathPod : context.hoveredMathPod?.id;
      this.isHovered = hoveredId === this.id;
    }

    // Arbitration check: strictly honor triggerPolicy (click/pin only for MathPods)
    const locked = Boolean(context && context.interactionLocked);
    const shouldBeActive =
      !locked &&
      (this.forceOpen ||
        this.isPinned ||
        this.isCameraFocused ||
        (allowHover && this.isHovered) ||
        (allowDrag && this.isDragging) ||
        (allowProximity && this.isWithinProximity));

    // Lifecycle Evaluation
    const fsm = evaluateCalloutLifecycleState(
      this.state,
      this.stageElapsed,
      shouldBeActive,
      HOLO_CALLOUT_DEFAULT_CONFIG
    );

    this.state = fsm.state;
    this.stageElapsed = fsm.elapsed;
    this.rootGroup.visible = fsm.isVisible;

    // Audio trigger on transitions
    if (fsm.transitioned && this.audioEngine) {
      if (this.state === HOLO_CALLOUT_LIFECYCLE_STATES.MATERIALIZING && typeof this.audioEngine.onCalloutIgnite === 'function') {
        this.audioEngine.onCalloutIgnite(this.id);
      } else if (this.state === HOLO_CALLOUT_LIFECYCLE_STATES.DEMATERIALIZING && typeof this.audioEngine.onCalloutCollapse === 'function') {
        this.audioEngine.onCalloutCollapse(this.id);
      }
    }

    // If completely dormant, skip transform & render cost
    if (!this.rootGroup.visible) {
      return;
    }

    // Spatial Kinematics & Billboarding
    const cam = context && context.camera ? context.camera : this.options.camera || null;
    let parentWorldQuat = null;
    if (this.rootGroup.parent && this.rootGroup.parent.isObject3D) {
      this.rootGroup.parent.getWorldQuaternion(_tmpParentWorldQuat);
      parentWorldQuat = _tmpParentWorldQuat;
    }

    const pose = computeBillboardPoseAndScale({
      hostWorldPos: _tmpHostPos,
      offset: this.descriptor.offset,
      clearanceRadius: this.descriptor.clearanceRadius,
      frameHeight: this.descriptor.frameHeight,
      camera: cam,
      parentWorldQuaternion: parentWorldQuat,
      minWorldScale: this.isCameraFocused ? 0.92 : this.descriptor.minWorldScale,
      maxWorldScale: this.descriptor.maxWorldScale,
      distanceScaleRefMeters: this.descriptor.referenceDistance,
      timeSec,
      hoverBobAmplitude: this.isCameraFocused ? 0.0 : HOLO_CALLOUT_DEFAULT_CONFIG.hoverBobAmplitude,
      isActive: this.state === HOLO_CALLOUT_LIFECYCLE_STATES.ACTIVE,
    });

    // 1:1 Instant Anchor Tracking
    this.rootGroup.position.copy(pose.anchorWorldPos);
    this.billboardGroup.position.set(0, pose.hoverOffsetY, 0);
    this.lastWorldPos.copy(this.rootGroup.position);

    // Decoupled Spherical Billboarding
    this.billboardGroup.quaternion.copy(pose.localQuaternion);

    // Apply distance scale & lifecycle unfold scale
    const effectiveWorldScale = this.isCameraFocused ? 0.95 : pose.worldScale;
    const finalScaleX = effectiveWorldScale * fsm.scaleX;
    const finalScaleY = effectiveWorldScale * fsm.scaleY;
    this.unfoldGroup.scale.set(finalScaleX, finalScaleY, effectiveWorldScale);
    this.rootGroup.updateMatrixWorld(true);

    // Update Material Uniforms
    this.materialSuite.updateUniforms({
      timeSec,
      opacity: fsm.opacity,
      materializeAlpha: fsm.materializeAlpha,
      interferenceStrength: this.interferencePulse,
      phaseJitter: this.phaseJitter,
      climaxBoost: this.climaxBoost,
      glitchIntensity: fsm.glitchIntensity,
      transitionFlicker: fsm.transitionFlicker,
      ignitionScaleX: fsm.ignitionScaleX,
    });

    // Dynamic Telemetry Payload Refresh
    if (typeof this.descriptor.payloadProvider === 'function') {
      const payload = this.descriptor.payloadProvider(this);
      if (payload) {
        this.typographyController.render(payload, { climaxHighlight: this.climaxBoost > 0.1 });
      }
    }
  }

  dispose() {
    this.rootGroup.clear();
    this.materialSuite.dispose();
    this.typographyController.dispose();
  }
}

export function createHologramCalloutInstance(descriptor, options = {}) {
  return new MathPodPopupCallout(descriptor, options);
}

// ============================================================================
// Master Callout Manager (TICKET-005, anim/mathpod_popup.md §6)
// ============================================================================
export class MathPodPopupManager {
  constructor(options = {}) {
    this.options = options;
    this.scene = options.scene || null;
    this.camera = options.camera || null;
    this.audioEngine = options.audioEngine || options.audio || null;
    this.getInteractionContext = options.getInteractionContext || null;
    this.applyStencilReject = typeof options.applyStencilReject === 'function' ? options.applyStencilReject : null;
    this.globalVisibility = true;

    this.rootGroup = new THREE.Group();
    this.rootGroup.name = 'HoloCallouts_MasterRootGroup';

    if (this.scene && typeof this.scene.add === 'function') {
      this.scene.add(this.rootGroup);
    }

    this.callouts = [];
    this.calloutsById = new Map();
  }

  registerHost(descriptor) {
    const norm = normalizeHostDescriptor(descriptor);
    if (this.calloutsById.has(norm.id)) {
      return this.calloutsById.get(norm.id);
    }

    const callout = new MathPodPopupCallout(norm, {
      camera: this.camera,
      audioEngine: this.audioEngine,
      applyStencilReject: this.applyStencilReject,
    });

    this.callouts.push(callout);
    this.calloutsById.set(norm.id, callout);
    this.rootGroup.add(callout.rootGroup);
    return callout;
  }

  registerMathPods(mathPodsController) {
    if (!mathPodsController || !Array.isArray(mathPodsController.pods)) {
      return;
    }

    for (const pod of mathPodsController.pods) {
      // Find matching profile by concept or ID
      const profile =
        MATHPOD_CALLOUT_PROFILES.find((p) => p.podId === pod.id || p.concept === pod.concept) ||
        MATHPOD_CALLOUT_PROFILES[0];

      const descriptor = {
        id: pod.id,
        targetAnchor: pod.rootGroup,
        offset: { x: 0.0, y: 0.88, z: 0.0 },
        clearanceRadius: HOLO_CALLOUT_DEFAULT_CONFIG.defaultClearanceRadius,
        palette: 'neon_dark_amber',
        triggerPolicy: ['click'],
        autoRevealEnabled: false,
        autoRevealRadius: HOLO_CALLOUT_DEFAULT_CONFIG.proximityRadiusMeters,
        payloadProvider: () => formatMathPodCalloutPayload(pod, profile),
      };

      const callout = this.registerHost(descriptor);
      pod.callout = callout;
      // Also register aliases (e.g. POD-01 -> pod-01-graph)
      this.calloutsById.set(profile.podCode, callout);
    }
  }

  attachCalloutToAsset(target, config = {}) {
    const id = config.id || (target && target.name) || `callout_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
    const descriptor = {
      id,
      targetAnchor: target,
      offset: config.offset,
      clearanceRadius: config.clearanceRadius,
      palette: config.theme || config.palette || 'neon_dark_amber',
      autoRevealEnabled: config.autoRevealEnabled !== undefined ? config.autoRevealEnabled : false,
      payload: config.payload || null,
      payloadProvider: config.payloadProvider || null,
    };
    return this.registerHost(descriptor);
  }

  attachWorldCoordinateCallout(id, position, config = {}) {
    const descriptor = {
      id,
      worldPosition: position,
      offset: config.offset || { x: 0.0, y: 0.35, z: 0.0 },
      clearanceRadius: config.clearanceRadius || 0.25,
      palette: config.theme || config.palette || 'neon_dark_amber',
      autoRevealEnabled: config.autoRevealEnabled !== undefined ? config.autoRevealEnabled : false,
      payload: config.payload || null,
      payloadProvider: config.payloadProvider || null,
    };
    return this.registerHost(descriptor);
  }

  detachCallout(id) {
    const callout = this.calloutsById.get(id);
    if (!callout) return false;

    this.rootGroup.remove(callout.rootGroup);
    callout.dispose();
    this.calloutsById.delete(id);
    const idx = this.callouts.indexOf(callout);
    if (idx !== -1) {
      this.callouts.splice(idx, 1);
    }
    return true;
  }

  getCallout(id) {
    return this.calloutsById.get(id) || null;
  }

  registerSceneAssetPresets(scene) {
    if (!scene) return;
    for (const preset of UNIVERSAL_ASSET_CALLOUT_PRESETS) {
      const obj = scene.getObjectByName ? scene.getObjectByName(preset.targetName) : null;
      if (obj) {
        this.attachCalloutToAsset(obj, {
          id: preset.id,
          theme: preset.theme,
          offset: preset.offset,
          clearanceRadius: preset.clearanceRadius,
          payload: preset.payload,
          autoRevealEnabled: false,
        });
      } else {
        this.attachWorldCoordinateCallout(preset.id, preset.fallbackPosition, {
          theme: preset.theme,
          offset: preset.offset,
          clearanceRadius: preset.clearanceRadius,
          payload: preset.payload,
          autoRevealEnabled: false,
        });
      }
    }
  }

  togglePinForPod(podId) {
    const callout = this.getCallout(podId);
    if (callout) {
      return callout.togglePin();
    }
    return false;
  }

  setGlobalVisibility(visible) {
    this.globalVisibility = Boolean(visible);
    if (!this.globalVisibility) {
      for (const callout of this.callouts) {
        callout.close();
      }
    }
  }

  dismissAll() {
    for (const callout of this.callouts) {
      callout.close();
    }
  }

  getRaycastTargets() {
    const targets = [];
    for (const callout of this.callouts) {
      if (callout.isVisible && callout.hitBoxMesh) {
        targets.push(callout.hitBoxMesh);
      }
    }
    return targets;
  }

  raycastCallouts(raycaster) {
    if (!raycaster) return [];
    const targets = this.getRaycastTargets();
    if (targets.length === 0) return [];
    return raycaster.intersectObjects(targets, false);
  }

  update(dt = 1 / 60, timeSec = 0.0, context = null) {
    const effectiveContext = context || (typeof this.getInteractionContext === 'function' ? this.getInteractionContext() : null);

    // If global visibility is disabled or mode is mount-focus, suppress callouts
    if (!this.globalVisibility || (effectiveContext && effectiveContext.mode === 'mount-focus')) {
      for (const callout of this.callouts) {
        if (callout.state !== HOLO_CALLOUT_LIFECYCLE_STATES.DORMANT) {
          callout.close();
          callout.update(dt, timeSec, { ...effectiveContext, interactionLocked: true });
        }
      }
      return;
    }

    for (const callout of this.callouts) {
      callout.update(dt, timeSec, effectiveContext);
    }
  }

  dispose() {
    for (const callout of this.callouts) {
      callout.dispose();
    }
    this.callouts = [];
    this.calloutsById.clear();
    if (this.scene && typeof this.scene.remove === 'function') {
      this.scene.remove(this.rootGroup);
    }
  }
}

export function createMathPodPopupManager(options = {}) {
  return new MathPodPopupManager(options);
}

export function buildHologramCalloutSystem(options = {}) {
  return new MathPodPopupManager(options);
}
