/**
 * radial_menu_hud.js
 *
 * Cyber-Tactical 2D HUD Radial Menu (Animate UI Adaptation)
 * Native browser ES module runtime for Three.js screen-space HUD overlay.
 *
 * Preserves the upstream animate-ui/components/community/radial-menu foundation
 * (FULL_CIRCLE = 360, START_ANGLE = -90, degToRad, polarToCartesian, slicePath,
 * RadialMenuProps, MenuItem) while providing 100% slice-agnostic ("N-slice")
 * parametric geometry (parallel linear channels, vertex-anchored reticles,
 * arc-proportional inner ticks, upright centroid payloads, density degradation),
 * luminance-to-alpha emblem harmonization, PLATO DOOM central hub anatomy,
 * and 3-state interactive choreography (Idle, Hover reticle migration, Selection surge).
 *
 * Governed by:
 * - anim/radial_menu.md (§1–§6)
 * - wayfinder/20261019T234216-836-uewy/map.md and master_component_to_edit_matrix.md
 * - tickets/ticket-001.md through ticket-006.md
 * - assets/20261019T234216-836-uewy/plan-radial-menu-schema.json
 */

export const FULL_CIRCLE = 360;
export const START_ANGLE = -90; // 12 o'clock anchor (0, -radius)
export const SELECTION_CONFIRM_DURATION_MS = 260;

export const menuTransition = {
  type: 'spring',
  stiffness: 420,
  damping: 32,
  mass: 1,
};

export const wedgeTransition = {
  duration: 0.05,
  ease: 'easeOut',
};

/**
 * Authoritative 4-Slice Clockwise Default Constant (Spec 032 §3.4)
 */
export const DEFAULT_CYBER_MENU_ITEMS = [
  {
    id: 1,
    key: 'mail',
    identity: 'Mail',
    label: 'MAIL',
    idleFramedLabel: '[ MAIL ]',
    emblemSrc: 'anim/Mail_emblem.jpeg',
    stagedPngSrc: 'anim/Mail_emblem.jpeg',
    dimensions: { width: 2048, height: 2048 },
    telemetryCode: 'NET // SMTP-01',
  },
  {
    id: 2,
    key: 'github',
    identity: 'GitHub',
    label: 'GITHUB',
    idleFramedLabel: '[ GITHUB ]',
    emblemSrc: 'anim/github_emblem.jpeg',
    stagedPngSrc: 'anim/github_emblem.jpeg',
    dimensions: { width: 2048, height: 2048 },
    telemetryCode: 'GIT // REPO-02',
  },
  {
    id: 3,
    key: 'x',
    identity: 'X (Twitter)',
    label: 'X',
    idleFramedLabel: '[ X ]',
    emblemSrc: 'anim/twitter_emblem.jpeg',
    stagedPngSrc: 'anim/twitter_emblem.jpeg',
    dimensions: { width: 1024, height: 1024 },
    telemetryCode: 'COM // XNET-03',
  },
  {
    id: 4,
    key: 'skateboard',
    identity: 'Skateboard',
    label: 'SKATEBOARD',
    idleFramedLabel: '[ SKATEBOARD ]',
    emblemSrc: 'anim/skateboard_emblem.jpeg',
    stagedPngSrc: 'anim/skateboard_emblem.jpeg',
    dimensions: { width: 1024, height: 1024 },
    telemetryCode: 'LOC // SK8-04',
  },
];

/**
 * Authoritative Central Hub Emblem Reference (anim/radial_menu.md §3.2)
 */
export const CENTRAL_HUB_EMBLEM = {
  id: 'plato-doom-tag',
  label: 'PLATO DOOM',
  repoPath: 'anim/techno_platodoom_Tag.jpeg',
  stagedPngSrc: 'anim/techno_platodoom_Tag.jpeg',
  width: 3584,
  height: 1184,
};

export const CENTRAL_HUB_FLARE_ANGLES = [-120, -60, 60, 120]; // 11, 1, 5, 7 o'clock

// ============================================================================
// Core Trigonometry & Polar Geometry Foundation (Ticket-001 & Ticket-002)
// ============================================================================

export function degToRad(deg) {
  return (deg * Math.PI) / 180;
}

export function radToDeg(rad) {
  return (rad * 180) / Math.PI;
}

export function polarToCartesian(radius, angleDeg) {
  const rad = degToRad(angleDeg);
  return {
    x: Math.cos(rad) * radius,
    y: Math.sin(rad) * radius,
  };
}

/**
 * Compute calibrated radial proportions for the cyber-tactical HUD wheel.
 */
export function computeRadialDimensions(props = {}) {
  const size = Number(props.size ?? 680);
  const radius = size / 2;
  const outerRingWidth = Number(props.outerRingWidth ?? 10);
  const outerGap = Number(props.outerGap ?? 6);
  const bandWidth = Number(props.bandWidth ?? 198);
  const innerGap = Number(props.innerGap ?? 18);
  const linearGapPx = Number(props.linearGapPx ?? 8);
  const iconSize = Number(props.iconSize ?? 68);

  const outerRingOuterRadius = radius;
  const outerRingInnerRadius = outerRingOuterRadius - outerRingWidth;
  const wedgeOuterRadius = outerRingInnerRadius - outerGap;
  const wedgeInnerRadius = wedgeOuterRadius - bandWidth;
  const centerRadius = Math.max(wedgeInnerRadius - innerGap, 0);
  const payloadRadius = wedgeInnerRadius + 0.54 * (wedgeOuterRadius - wedgeInnerRadius);

  return {
    size,
    radius,
    outerRingWidth,
    outerGap,
    bandWidth,
    innerGap,
    linearGapPx,
    iconSize,
    outerRingOuterRadius,
    outerRingInnerRadius,
    wedgeOuterRadius,
    wedgeInnerRadius,
    centerRadius,
    payloadRadius,
  };
}

/**
 * Calculate angular subdivision for sector index in [0, total - 1].
 */
export function computeSectorAngles(index, total) {
  if (total <= 0) {
    return { anglePerSlice: 0, midDeg: 0, startDeg: 0, endDeg: 0 };
  }
  const anglePerSlice = FULL_CIRCLE / total;
  const midDeg = START_ANGLE + index * anglePerSlice;
  const halfSlice = anglePerSlice / 2;
  return {
    anglePerSlice,
    midDeg,
    startDeg: midDeg - halfSlice,
    endDeg: midDeg + halfSlice,
  };
}

/**
 * SVG sector path generator with uniform parallel linear separation channels.
 * Maintains an exact constant width `linearGapPx` between adjacent slices from inner to outer radius.
 */
export function slicePath(index, total, wedgeRadius, innerRadius, linearGapPx = 8) {
  if (total <= 0) return '';

  // Single item -> full concentric donut ring
  if (total === 1) {
    return [
      `M ${wedgeRadius} 0`,
      `A ${wedgeRadius} ${wedgeRadius} 0 1 1 ${-wedgeRadius} 0`,
      `A ${wedgeRadius} ${wedgeRadius} 0 1 1 ${wedgeRadius} 0`,
      `M ${innerRadius} 0`,
      `A ${innerRadius} ${innerRadius} 0 1 0 ${-innerRadius} 0`,
      `A ${innerRadius} ${innerRadius} 0 1 0 ${innerRadius} 0`,
      'Z',
    ].join(' ');
  }

  const { startDeg, endDeg } = computeSectorAngles(index, total);
  const halfGap = linearGapPx > 0 ? linearGapPx / 2 : 0;

  // Angular offset ensuring chord distance = 2 * r * sin(deltaTheta) = 2 * halfGap = linearGapPx
  const deltaThetaIn =
    innerRadius > 0 && halfGap > 0
      ? radToDeg(Math.asin(Math.min(0.95, halfGap / innerRadius)))
      : 0;
  const deltaThetaOut =
    wedgeRadius > 0 && halfGap > 0
      ? radToDeg(Math.asin(Math.min(0.95, halfGap / wedgeRadius)))
      : 0;

  const thetaInStart = startDeg + deltaThetaIn;
  const thetaInEnd = endDeg - deltaThetaIn;
  const thetaOutStart = startDeg + deltaThetaOut;
  const thetaOutEnd = endDeg - deltaThetaOut;

  const outerStart = polarToCartesian(wedgeRadius, thetaOutStart);
  const outerEnd = polarToCartesian(wedgeRadius, thetaOutEnd);
  const innerEnd = polarToCartesian(innerRadius, thetaInEnd);
  const innerStart = polarToCartesian(innerRadius, thetaInStart);

  const largeArcFlagOut = thetaOutEnd - thetaOutStart > 180 ? 1 : 0;
  const largeArcFlagIn = thetaInEnd - thetaInStart > 180 ? 1 : 0;

  return [
    `M ${outerStart.x} ${outerStart.y}`,
    `A ${wedgeRadius} ${wedgeRadius} 0 ${largeArcFlagOut} 1 ${outerEnd.x} ${outerEnd.y}`,
    `L ${innerEnd.x} ${innerEnd.y}`,
    `A ${innerRadius} ${innerRadius} 0 ${largeArcFlagIn} 0 ${innerStart.x} ${innerStart.y}`,
    'Z',
  ].join(' ');
}

/**
 * Compute the 4 vertex-anchored corner targeting brackets for a sector slice.
 */
export function computeSectorCornerBrackets(index, total, innerRadius, outerRadius, linearGapPx = 8) {
  const angles = computeSectorAngles(index, total);
  const halfGap = linearGapPx > 0 ? linearGapPx / 2 : 0;
  const padR = 10;
  const padLinear = 10;
  const effectiveGap = halfGap + padLinear;

  const r1 = innerRadius + padR;
  const deltaThetaR1 = radToDeg(Math.asin(Math.min(0.95, effectiveGap / r1)));
  const theta1 = angles.startDeg + deltaThetaR1; // innerLeft
  const theta2 = angles.endDeg - deltaThetaR1;   // innerRight

  const r2 = outerRadius - padR;
  const deltaThetaR2 = radToDeg(Math.asin(Math.min(0.95, effectiveGap / r2)));
  const theta3 = angles.startDeg + deltaThetaR2; // outerLeft
  const theta4 = angles.endDeg - deltaThetaR2;   // outerRight

  const P1 = polarToCartesian(r1, theta1);
  const P2 = polarToCartesian(r1, theta2);
  const P3 = polarToCartesian(r2, theta3);
  const P4 = polarToCartesian(r2, theta4);

  // Arms extending radially and along arc toward theta_mid
  const P1r = polarToCartesian(r1 + 10, theta1);
  const P1a = polarToCartesian(r1, theta1 + 5);

  const P2r = polarToCartesian(r1 + 10, theta2);
  const P2a = polarToCartesian(r1, theta2 - 5);

  const P3r = polarToCartesian(r2 - 10, theta3);
  const P3a = polarToCartesian(r2, theta3 + 3.5);

  const P4r = polarToCartesian(r2 - 10, theta4);
  const P4a = polarToCartesian(r2, theta4 - 3.5);

  return {
    innerLeft: {
      radius: r1,
      angleDeg: theta1,
      pos: P1,
      path: `M ${P1r.x.toFixed(2)} ${P1r.y.toFixed(2)} L ${P1.x.toFixed(2)} ${P1.y.toFixed(2)} L ${P1a.x.toFixed(2)} ${P1a.y.toFixed(2)}`,
    },
    innerRight: {
      radius: r1,
      angleDeg: theta2,
      pos: P2,
      path: `M ${P2r.x.toFixed(2)} ${P2r.y.toFixed(2)} L ${P2.x.toFixed(2)} ${P2.y.toFixed(2)} L ${P2a.x.toFixed(2)} ${P2a.y.toFixed(2)}`,
    },
    outerLeft: {
      radius: r2,
      angleDeg: theta3,
      pos: P3,
      path: `M ${P3r.x.toFixed(2)} ${P3r.y.toFixed(2)} L ${P3.x.toFixed(2)} ${P3.y.toFixed(2)} L ${P3a.x.toFixed(2)} ${P3a.y.toFixed(2)}`,
    },
    outerRight: {
      radius: r2,
      angleDeg: theta4,
      pos: P4,
      path: `M ${P4r.x.toFixed(2)} ${P4r.y.toFixed(2)} L ${P4.x.toFixed(2)} ${P4.y.toFixed(2)} L ${P4a.x.toFixed(2)} ${P4a.y.toFixed(2)}`,
    },
  };
}

/**
 * Compute arc-proportional protractor tick marks along the sector's inner concave edge.
 */
export function computeInnerArcTicks(index, total, innerRadius, linearGapPx = 8) {
  const angles = computeSectorAngles(index, total);
  const halfGap = linearGapPx > 0 ? linearGapPx / 2 : 0;
  const deltaThetaIn =
    innerRadius > 0 && halfGap > 0
      ? radToDeg(Math.asin(Math.min(0.95, halfGap / innerRadius)))
      : 0;

  const usableSpan = Math.max(4, angles.anglePerSlice - 2 * deltaThetaIn - 10);
  const tickCount = Math.max(3, Math.min(24, Math.floor(usableSpan / 3.5)));
  const step = tickCount > 1 ? usableSpan / (tickCount - 1) : 0;
  const startAngle = angles.midDeg - usableSpan / 2;

  const ticks = [];
  for (let k = 0; k < tickCount; k++) {
    const angleK = startAngle + k * step;
    const isMajor = k % 4 === 0;
    const rIn = innerRadius + 5;
    const rOut = innerRadius + (isMajor ? 14 : 11);
    const p1 = polarToCartesian(rIn, angleK);
    const p2 = polarToCartesian(rOut, angleK);
    ticks.push({
      index: k,
      angleDeg: angleK,
      isMajor,
      p1,
      p2,
      path: `M ${p1.x.toFixed(2)} ${p1.y.toFixed(2)} L ${p2.x.toFixed(2)} ${p2.y.toFixed(2)}`,
    });
  }

  return ticks;
}

/**
 * Compute upright centroid payload positions (emblem + uppercase HUD label) and dynamic scaling.
 */
export function computePayloadLayout(index, total, radii, iconSize = 68, linearGapPx = 8) {
  const angles = computeSectorAngles(index, total);
  const R_payload =
    radii.payloadRadius ??
    radii.wedgeInnerRadius + 0.54 * (radii.wedgeOuterRadius - radii.wedgeInnerRadius);
  const centroid = polarToCartesian(R_payload, angles.midDeg);
  const chordWidth =
    2 * R_payload * Math.sin(degToRad(angles.anglePerSlice / 2)) - linearGapPx;
  const emblemDisplaySize = Math.min(iconSize, Math.max(24, chordWidth * 0.46));

  const emblemCenter = { x: centroid.x, y: centroid.y - 14 };
  const labelCenter = { x: centroid.x, y: centroid.y + emblemDisplaySize / 2 + 10 };

  return {
    centroid,
    rotationDeg: 0, // strictly upright (0 degrees)
    emblemDisplaySize,
    emblemCenter,
    labelCenter,
    chordWidth,
  };
}

/**
 * Telemetry density degradation tier based on slice count / angular width.
 */
export function getTelemetryDensityTier(total) {
  if (!total || total <= 0) return 'minimal';
  const deltaTheta = FULL_CIRCLE / total;
  if (deltaTheta >= 40) return 'full';
  if (deltaTheta >= 28) return 'compact';
  return 'minimal';
}

// ============================================================================
// Interactive State Choreography & Resolvers (Ticket-004)
// ============================================================================

/**
 * Deterministic visual state resolver for sector `index`.
 */
export function computeSliceVisualState(index, activeIndex, confirmingIndex, total = 4, item = null) {
  const resolvedItem = item ?? DEFAULT_CYBER_MENU_ITEMS[index] ?? { label: `SLICE_${index + 1}` };
  const framedLabel = resolvedItem.idleFramedLabel ?? `[ ${resolvedItem.label} ]`;

  if (confirmingIndex !== null) {
    if (confirmingIndex === index) {
      return {
        visualState: 'selection',
        wedgeFill: 'url(#cyber-sector-select-grad)',
        perimeterStroke: '#FFF3C4',
        perimeterStrokeWidth: 3.4,
        innerBloomOpacity: 1.0,
        sectorCornerBracketsVisible: true,
        reticleTarget: 'emblem-locked',
        reticleLockInScale: 0.86,
        labelDisplayText: resolvedItem.label,
        labelColor: '#FFFBEB',
        emblemBrightness: 1.65,
        sectorOpacity: 1.0,
      };
    }
    return {
      visualState: 'dimmed',
      wedgeFill: 'url(#cyber-sector-idle-grad)',
      perimeterStroke: '#5C340E',
      perimeterStrokeWidth: 1.2,
      innerBloomOpacity: 0.0,
      sectorCornerBracketsVisible: false,
      reticleTarget: 'label',
      reticleLockInScale: 1.0,
      labelDisplayText: framedLabel,
      labelColor: '#78491C',
      emblemBrightness: 0.55,
      sectorOpacity: 0.25,
    };
  }

  if (activeIndex === index) {
    return {
      visualState: 'hover',
      wedgeFill: 'url(#cyber-sector-hover-grad)',
      perimeterStroke: '#FFB02E',
      perimeterStrokeWidth: 2.6,
      innerBloomOpacity: 0.85,
      sectorCornerBracketsVisible: true,
      reticleTarget: 'emblem',
      reticleLockInScale: 1.0,
      labelDisplayText: resolvedItem.label,
      labelColor: '#FFE082',
      emblemBrightness: 1.35,
      sectorOpacity: 1.0,
    };
  }

  return {
    visualState: 'idle',
    wedgeFill: 'url(#cyber-sector-idle-grad)',
    perimeterStroke: '#925418',
    perimeterStrokeWidth: 1.5,
    innerBloomOpacity: 0.0,
    sectorCornerBracketsVisible: false,
    reticleTarget: 'label',
    reticleLockInScale: 1.0,
    labelDisplayText: framedLabel,
    labelColor: '#D99B52',
    emblemBrightness: 1.0,
    sectorOpacity: 1.0,
  };
}

/**
 * Compute the 4-corner reticle framing box (migrating between label in Idle and emblem in Hover/Selection).
 */
export function computeReticleBox(payloadLayout, visualState, item = null) {
  const target = visualState.reticleTarget ?? 'label';

  if (target === 'label') {
    const labelStr = item?.label ?? 'MAIL';
    const labelWidth = Math.max(68, labelStr.length * 9.5 + 24);
    const w = labelWidth + 22;
    const h = 24;
    const center = payloadLayout.labelCenter;
    const x0 = center.x - w / 2;
    const x1 = center.x + w / 2;
    const y0 = center.y - h / 2;
    const y1 = center.y + h / 2;
    const arm = 5;

    return {
      target: 'label',
      center,
      width: w,
      height: h,
      stroke: 'rgba(217, 155, 82, 0.78)',
      strokeWidth: 1.3,
      brackets: {
        tl: `M ${x0.toFixed(2)} ${(y0 + arm).toFixed(2)} L ${x0.toFixed(2)} ${y0.toFixed(2)} L ${(x0 + arm).toFixed(2)} ${y0.toFixed(2)}`,
        tr: `M ${(x1 - arm).toFixed(2)} ${y0.toFixed(2)} L ${x1.toFixed(2)} ${y0.toFixed(2)} L ${x1.toFixed(2)} ${(y0 + arm).toFixed(2)}`,
        bl: `M ${x0.toFixed(2)} ${(y1 - arm).toFixed(2)} L ${x0.toFixed(2)} ${y1.toFixed(2)} L ${(x0 + arm).toFixed(2)} ${y1.toFixed(2)}`,
        br: `M ${(x1 - arm).toFixed(2)} ${y1.toFixed(2)} L ${x1.toFixed(2)} ${y1.toFixed(2)} L ${x1.toFixed(2)} ${(y1 - arm).toFixed(2)}`,
      },
    };
  }

  // Hover or Selection: reticle migrates upward to frame the primary emblem
  const scale = visualState.reticleLockInScale ?? 1.0;
  const rawSize = payloadLayout.emblemDisplaySize + 18;
  const w = rawSize * scale;
  const h = rawSize * scale;
  const center = payloadLayout.emblemCenter;
  const x0 = center.x - w / 2;
  const x1 = center.x + w / 2;
  const y0 = center.y - h / 2;
  const y1 = center.y + h / 2;
  const arm = 8 * scale;

  return {
    target,
    center,
    width: w,
    height: h,
    stroke: target === 'emblem-locked' ? '#FFF7D6' : '#FFB02E',
    strokeWidth: target === 'emblem-locked' ? 2.5 : 2.0,
    brackets: {
      tl: `M ${x0.toFixed(2)} ${(y0 + arm).toFixed(2)} L ${x0.toFixed(2)} ${y0.toFixed(2)} L ${(x0 + arm).toFixed(2)} ${y0.toFixed(2)}`,
      tr: `M ${(x1 - arm).toFixed(2)} ${y0.toFixed(2)} L ${x1.toFixed(2)} ${y0.toFixed(2)} L ${x1.toFixed(2)} ${(y0 + arm).toFixed(2)}`,
      bl: `M ${x0.toFixed(2)} ${(y1 - arm).toFixed(2)} L ${x0.toFixed(2)} ${y1.toFixed(2)} L ${(x0 + arm).toFixed(2)} ${y1.toFixed(2)}`,
      br: `M ${(x1 - arm).toFixed(2)} ${y1.toFixed(2)} L ${x1.toFixed(2)} ${y1.toFixed(2)} L ${x1.toFixed(2)} ${(y1 - arm).toFixed(2)}`,
    },
  };
}

/**
 * Compute central PLATO DOOM hub synchronized visual state.
 */
export function computeCentralHubState(activeIndex, confirmingIndex, total) {
  function findNearestFlareIndex(targetAngle) {
    let bestIdx = 0;
    let bestDist = Infinity;
    for (let i = 0; i < CENTRAL_HUB_FLARE_ANGLES.length; i++) {
      const diff = Math.abs(((CENTRAL_HUB_FLARE_ANGLES[i] - targetAngle + 540) % 360) - 180);
      if (diff < bestDist) {
        bestDist = diff;
        bestIdx = i;
      }
    }
    return bestIdx;
  }

  if (activeIndex === null && confirmingIndex === null) {
    return {
      ringRotationDeg: 0,
      activeFlareIndex: null,
      flareBoost: 1.0,
      hubPulseScale: 1.0,
      emblemGlowMultiplier: 1.0,
    };
  }

  if (confirmingIndex !== null) {
    const angles = computeSectorAngles(confirmingIndex, total);
    return {
      ringRotationDeg: angles.midDeg,
      activeFlareIndex: findNearestFlareIndex(angles.midDeg),
      flareBoost: 1.9,
      hubPulseScale: 1.08,
      emblemGlowMultiplier: 1.85,
    };
  }

  const angles = computeSectorAngles(activeIndex, total);
  return {
    ringRotationDeg: angles.midDeg,
    activeFlareIndex: findNearestFlareIndex(angles.midDeg),
    flareBoost: 1.6,
    hubPulseScale: 1.0,
    emblemGlowMultiplier: 1.2,
  };
}

/**
 * Polar hit-testing contract (Ticket-001 §3.3).
 */
export function resolvePolarHitSector(dx, dy, total, radii) {
  const distance = Math.hypot(dx, dy);
  const angleDeg = radToDeg(Math.atan2(dy, dx));
  const resolvedRadii = radii ?? computeRadialDimensions();

  if (distance <= resolvedRadii.wedgeInnerRadius) {
    return { zone: 'deadzone', index: null, distance, angleDeg };
  }
  if (distance > resolvedRadii.outerRingOuterRadius || !total || total <= 0) {
    return { zone: 'outside', index: null, distance, angleDeg };
  }

  const anglePerSlice = FULL_CIRCLE / total;
  const startOffset = START_ANGLE - anglePerSlice / 2;
  let normalized = (angleDeg - startOffset) % FULL_CIRCLE;
  if (normalized < 0) normalized += FULL_CIRCLE;

  const index = Math.floor(normalized / anglePerSlice) % total;
  return { zone: 'sector', index, distance, angleDeg };
}

/**
 * Pure per-pixel luminance-to-alpha conversion pipeline (Ticket-003 §2.2).
 * Converts white-background JPEG pixel buffers into transparent molten-amber wireframes.
 */
export function harmonizeEmblemPixelBuffer(rgbaUint8Array) {
  for (let i = 0; i < rgbaUint8Array.length; i += 4) {
    const r = rgbaUint8Array[i];
    const g = rgbaUint8Array[i + 1];
    const b = rgbaUint8Array[i + 2];

    const ink = Math.min(Math.max((246 - b) / 238, 0), 1);
    if (ink < 0.025) {
      rgbaUint8Array[i + 3] = 0;
    } else {
      const a = Math.round(Math.pow((ink - 0.025) / 0.975, 0.76) * 255);
      rgbaUint8Array[i] = Math.round(Math.min(Math.max(200 + 55 * (r / 255), 215), 255));
      rgbaUint8Array[i + 1] = Math.round(Math.min(Math.max(105 + 125 * (g / 255), 125), 235));
      rgbaUint8Array[i + 2] = Math.round(Math.min(Math.max(16 + 34 * ((255 - b) / 255), 18), 115));
      rgbaUint8Array[i + 3] = a;
    }
  }
  return rgbaUint8Array;
}

// ============================================================================
// SVG Rendering Engine (Ticket-003, Ticket-004, Ticket-005)
// ============================================================================

/**
 * Render complete standalone SVG markup for the Cyber-Tactical Radial Menu HUD.
 */
export function renderRadialMenuSVGMarkup(state = {}, props = {}) {
  const menuItems = props.menuItems ?? DEFAULT_CYBER_MENU_ITEMS;
  const total = menuItems.length;
  const radii = computeRadialDimensions(props);
  const activeIndex = state.activeIndex ?? null;
  const confirmingIndex = state.confirmingIndex ?? null;
  const densityTier = getTelemetryDensityTier(total);
  const hubState = computeCentralHubState(activeIndex, confirmingIndex, total);

  const radius = radii.radius;
  const viewBox = `${-radius} ${-radius} ${radius * 2} ${radius * 2}`;

  // Build sector slices
  const slicesMarkup = menuItems
    .map((item, index) => {
      const visualState = computeSliceVisualState(index, activeIndex, confirmingIndex, total);
      const angles = computeSectorAngles(index, total);
      const payloadLayout = computePayloadLayout(index, total, radii, radii.iconSize, radii.linearGapPx);
      const reticleBox = computeReticleBox(payloadLayout, visualState, item);
      const brackets = computeSectorCornerBrackets(
        index,
        total,
        radii.wedgeInnerRadius,
        radii.wedgeOuterRadius,
        radii.linearGapPx
      );
      const ticks = computeInnerArcTicks(index, total, radii.wedgeInnerRadius, radii.linearGapPx);
      const sectorPath = slicePath(
        index,
        total,
        radii.wedgeOuterRadius,
        radii.wedgeInnerRadius,
        radii.linearGapPx
      );

      const dualOuterArc = slicePath(
        index,
        total,
        radii.outerRingOuterRadius,
        radii.outerRingInnerRadius,
        radii.linearGapPx
      );

      // Micro-telemetry coordinates
      const outerCornerPos = brackets.outerRight.pos;
      const chevronPos = brackets.outerLeft.pos;
      const innerLabelPos = polarToCartesian(radii.wedgeInnerRadius + 26, angles.midDeg);

      const displayText = visualState.labelDisplayText;
      const stagedOrRepoSrc = item.emblemSrc ?? item.stagedPngSrc;
      const microScale = densityTier === 'compact' ? 0.75 : 1.0;
      const cornerBracketTransform =
        visualState.reticleLockInScale < 1.0
          ? `translate(${payloadLayout.emblemCenter.x.toFixed(2)}, ${payloadLayout.emblemCenter.y.toFixed(2)}) scale(${visualState.reticleLockInScale}) translate(${(-payloadLayout.emblemCenter.x).toFixed(2)}, ${(-payloadLayout.emblemCenter.y).toFixed(2)})`
          : 'translate(0, 0)';

      return `
      <g class="cyber-radial-slice" data-slice-index="${index}" data-slice-key="${item.key}" opacity="${visualState.sectorOpacity}">
        <!-- Dual-line Outer Rim Band -->
        <path d="${dualOuterArc}" fill="rgba(42, 22, 7, 0.72)" stroke="${visualState.perimeterStroke}" stroke-width="1.0" opacity="0.85" />

        <!-- Interactive Sector Wedge Surface -->
        <path
          d="${sectorPath}"
          fill="${visualState.wedgeFill}"
          stroke="${visualState.perimeterStroke}"
          stroke-width="${visualState.perimeterStrokeWidth}"
          class="cyber-sector-surface"
        />

        <!-- Inner Concave Bloom Overlay (Hover/Select) -->
        ${
          visualState.innerBloomOpacity > 0
            ? `<path d="${sectorPath}" fill="url(#cyber-sector-hover-grad)" opacity="${visualState.innerBloomOpacity}" />`
            : ''
        }

        <!-- Concave Inner Arc Hairline -->
        <path
          d="${slicePath(index, total, radii.wedgeInnerRadius + 18, radii.wedgeInnerRadius + 17, radii.linearGapPx)}"
          fill="rgba(245, 158, 11, 0.42)"
          opacity="0.65"
        />

        <!-- Inner Concave Protractor Ticks -->
        <g class="cyber-inner-ticks" stroke="rgba(245, 158, 11, 0.65)" stroke-width="1.2">
          ${ticks.map((t) => `<path d="${t.path}" opacity="${t.isMajor ? 0.95 : 0.55}" />`).join('\n          ')}
        </g>

        ${
          densityTier !== 'minimal'
            ? `
        <!-- Inner Concave Micro-Label -->
        <text
          x="${innerLabelPos.x.toFixed(2)}"
          y="${innerLabelPos.y.toFixed(2)}"
          text-anchor="middle"
          dominant-baseline="central"
          font-family="ui-monospace, SFMono-Regular, Menlo, monospace"
          font-size="${(7.5 * microScale).toFixed(2)}"
          font-weight="700"
          fill="rgba(217, 155, 82, 0.78)"
          letter-spacing="0.08em"
        >${item.telemetryCode ?? `SYS.0x0${index + 1}`}</text>

        <!-- Peripheral Micro-Telemetry: Three-Dot Indicator -->
        <g class="cyber-micro-dots" fill="#FFB02E" opacity="0.8">
          <circle cx="${(outerCornerPos.x - 6 * microScale).toFixed(2)}" cy="${(outerCornerPos.y - 2 * microScale).toFixed(2)}" r="${(2.2 * microScale).toFixed(2)}" />
          <circle cx="${outerCornerPos.x.toFixed(2)}" cy="${outerCornerPos.y.toFixed(2)}" r="${(2.2 * microScale).toFixed(2)}" />
          <circle cx="${(outerCornerPos.x + 6 * microScale).toFixed(2)}" cy="${(outerCornerPos.y + 2 * microScale).toFixed(2)}" r="${(2.2 * microScale).toFixed(2)}" />
        </g>

        <!-- Peripheral Micro-Telemetry: Directional Chevron -->
        <polygon
          points="${(chevronPos.x - 3 * microScale).toFixed(2)},${(chevronPos.y - 4 * microScale).toFixed(2)} ${(chevronPos.x + 4 * microScale).toFixed(2)},${chevronPos.y.toFixed(2)} ${(chevronPos.x - 3 * microScale).toFixed(2)},${(chevronPos.y + 4 * microScale).toFixed(2)}"
          fill="#FFB02E"
          opacity="0.75"
        />
        `
            : ''
        }

        <!-- High-Density Telemetry (when densityTier === 'full') -->
        ${
          densityTier === 'full'
            ? `
        <g class="cyber-micro-hex-cluster" stroke="#FFB02E" stroke-width="0.8" fill="none" opacity="0.6">
          <polygon points="${(outerCornerPos.x - 14).toFixed(2)},${(outerCornerPos.y - 10).toFixed(2)} ${(outerCornerPos.x - 11).toFixed(2)},${(outerCornerPos.y - 15).toFixed(2)} ${(outerCornerPos.x - 6).toFixed(2)},${(outerCornerPos.y - 15).toFixed(2)} ${(outerCornerPos.x - 3).toFixed(2)},${(outerCornerPos.y - 10).toFixed(2)} ${(outerCornerPos.x - 6).toFixed(2)},${(outerCornerPos.y - 5).toFixed(2)} ${(outerCornerPos.x - 11).toFixed(2)},${(outerCornerPos.y - 5).toFixed(2)}" />
          <polygon points="${(outerCornerPos.x - 23).toFixed(2)},${(outerCornerPos.y - 5).toFixed(2)} ${(outerCornerPos.x - 20).toFixed(2)},${(outerCornerPos.y - 10).toFixed(2)} ${(outerCornerPos.x - 15).toFixed(2)},${(outerCornerPos.y - 10).toFixed(2)} ${(outerCornerPos.x - 12).toFixed(2)},${(outerCornerPos.y - 5).toFixed(2)} ${(outerCornerPos.x - 15).toFixed(2)},${outerCornerPos.y.toFixed(2)} ${(outerCornerPos.x - 20).toFixed(2)},${outerCornerPos.y.toFixed(2)}" />
          <polygon points="${(outerCornerPos.x - 23).toFixed(2)},${(outerCornerPos.y - 15).toFixed(2)} ${(outerCornerPos.x - 20).toFixed(2)},${(outerCornerPos.y - 20).toFixed(2)} ${(outerCornerPos.x - 15).toFixed(2)},${(outerCornerPos.y - 20).toFixed(2)} ${(outerCornerPos.x - 12).toFixed(2)},${(outerCornerPos.y - 15).toFixed(2)} ${(outerCornerPos.x - 15).toFixed(2)},${(outerCornerPos.y - 10).toFixed(2)} ${(outerCornerPos.x - 20).toFixed(2)},${(outerCornerPos.y - 10).toFixed(2)}" />
        </g>
        <text
          x="${(chevronPos.x + 12).toFixed(2)}"
          y="${(chevronPos.y - 6).toFixed(2)}"
          font-family="ui-monospace, monospace"
          font-size="6"
          fill="rgba(245, 158, 11, 0.7)"
        >
          <tspan x="${(chevronPos.x + 12).toFixed(2)}" dy="0">SYS.0x0${index + 1} // LOCK</tspan>
          <tspan x="${(chevronPos.x + 12).toFixed(2)}" dy="7.5">ARC ${(angles.anglePerSlice).toFixed(0)}DEG // ACTIVE</tspan>
        </text>
        `
            : ''
        }

        <!-- 4 Vertex-Anchored Sector Corner Brackets (Active on Hover & Selection) -->
        <g
          class="cyber-sector-corner-brackets"
          stroke="#FFB02E"
          stroke-width="1.8"
          fill="none"
          opacity="${visualState.sectorCornerBracketsVisible ? 1 : 0}"
          transform="${cornerBracketTransform}"
          filter="url(#cyber-amber-glow)"
        >
          <path d="${brackets.innerLeft.path}" />
          <path d="${brackets.innerRight.path}" />
          <path d="${brackets.outerLeft.path}" />
          <path d="${brackets.outerRight.path}" />
        </g>

        <!-- Upright Centroid Payload (Emblem & Uppercase HUD Label) -->
        <g class="cyber-centroid-payload" transform="translate(0, 0)">
          <!-- Primary Emblem Graphic -->
          <image
            href="${stagedOrRepoSrc}"
            x="${(payloadLayout.emblemCenter.x - payloadLayout.emblemDisplaySize / 2).toFixed(2)}"
            y="${(payloadLayout.emblemCenter.y - payloadLayout.emblemDisplaySize / 2).toFixed(2)}"
            width="${payloadLayout.emblemDisplaySize.toFixed(2)}"
            height="${payloadLayout.emblemDisplaySize.toFixed(2)}"
            preserveAspectRatio="xMidYMid meet"
            filter="url(#cyber-amber-emblem-filter)"
            style="filter: brightness(${visualState.emblemBrightness});"
          />

          <!-- Uppercase Technical Sans-Serif HUD Label -->
          <text
            x="${payloadLayout.labelCenter.x.toFixed(2)}"
            y="${payloadLayout.labelCenter.y.toFixed(2)}"
            text-anchor="middle"
            dominant-baseline="central"
            font-family="ui-monospace, SFMono-Regular, Menlo, monospace"
            font-size="11.5"
            font-weight="700"
            fill="${visualState.labelColor}"
            letter-spacing="0.14em"
          >${displayText}</text>

          <!-- 4-Corner Targeting Reticle Assembly (Migrates between Label and Emblem) -->
          <g
            class="cyber-payload-reticle"
            data-reticle-target="${reticleBox.target}"
            stroke="${reticleBox.stroke}"
            stroke-width="${reticleBox.strokeWidth}"
            fill="none"
            filter="${reticleBox.target !== 'label' ? 'url(#cyber-amber-glow)' : 'none'}"
          >
            <path d="${reticleBox.brackets.tl}" />
            <path d="${reticleBox.brackets.tr}" />
            <path d="${reticleBox.brackets.bl}" />
            <path d="${reticleBox.brackets.br}" />
          </g>
        </g>
      </g>`;
    })
    .join('\n');

  // Build Central Hub with 4 perimeter flares and PLATO DOOM tag
  const hubRadius = radii.centerRadius;
  const flaresMarkup = CENTRAL_HUB_FLARE_ANGLES.map((angleDeg, flareIdx) => {
    const isBoosted = hubState.activeFlareIndex === flareIdx;
    const coreWidth = isBoosted ? 5.2 : 3.8;
    const arcSpan = isBoosted ? 12 : 8;
    const flareColor = isBoosted ? '#FFFDF0' : '#FFF7D6';
    const streakPos1 = polarToCartesian(hubRadius - 16, angleDeg);
    const streakPos2 = polarToCartesian(hubRadius + 18, angleDeg);

    const a1 = angleDeg - arcSpan / 2;
    const a2 = angleDeg + arcSpan / 2;
    const pA = polarToCartesian(hubRadius, a1);
    const pB = polarToCartesian(hubRadius, a2);

    return `
      <g class="cyber-hub-flare" data-flare-angle="${angleDeg}">
        <!-- Radial Streak -->
        <line
          x1="${streakPos1.x.toFixed(2)}"
          y1="${streakPos1.y.toFixed(2)}"
          x2="${streakPos2.x.toFixed(2)}"
          y2="${streakPos2.y.toFixed(2)}"
          stroke="${flareColor}"
          stroke-width="${isBoosted ? 2.5 : 1.5}"
          filter="url(#cyber-amber-glow)"
          opacity="${isBoosted ? 1.0 : 0.75}"
        />
        <!-- Perimeter Arc Flash -->
        <path
          d="M ${pA.x.toFixed(2)} ${pA.y.toFixed(2)} A ${hubRadius} ${hubRadius} 0 0 1 ${pB.x.toFixed(2)} ${pB.y.toFixed(2)}"
          stroke="${flareColor}"
          stroke-width="${coreWidth}"
          fill="none"
          filter="url(#cyber-amber-glow)"
        />
      </g>`;
  }).join('\n');

  // Central PLATO DOOM tag emblem sizing
  const hubEmblemW = hubRadius * 1.52;
  const hubEmblemH = hubRadius * 0.5;
  const hubEmblemSrc = CENTRAL_HUB_EMBLEM.repoPath ?? CENTRAL_HUB_EMBLEM.stagedPngSrc;

  return `
<svg
  xmlns="http://www.w3.org/2000/svg"
  class="cyber-radial-svg"
  viewBox="${viewBox}"
  width="${radii.size}"
  height="${radii.size}"
  style="max-width: 100vw; max-height: 100vh; overflow: visible; user-select: none;"
>
  <defs>
    <!-- Amber Glow Filter -->
    <filter id="cyber-amber-glow" x="-40%" y="-40%" width="180%" height="180%">
      <feGaussianBlur stdDeviation="3.5" result="blur" />
      <feMerge>
        <feMergeNode in="blur" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>

    <!-- Emblem Luminance-to-Alpha Filter (feColorMatrix eliminating white bounding box) -->
    <filter id="cyber-amber-emblem-filter" color-interpolation-filters="sRGB">
      <feColorMatrix
        type="matrix"
        values="0    0    0     0 1.00
                0    0.35 0     0 0.45
                0    0    0.10  0 0.08
                0    0   -1.08  0 1.04"
      />
    </filter>

    <!-- Radial Gradients -->
    <radialGradient id="cyber-sector-idle-grad" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#180D04" stop-opacity="0.94" />
      <stop offset="100%" stop-color="#3A210C" stop-opacity="0.88" />
    </radialGradient>

    <radialGradient id="cyber-sector-hover-grad" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#F59E0B" stop-opacity="0.62" />
      <stop offset="45%" stop-color="#5C2E0A" stop-opacity="0.90" />
      <stop offset="100%" stop-color="#281405" stop-opacity="0.94" />
    </radialGradient>

    <radialGradient id="cyber-sector-select-grad" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#FFD56B" stop-opacity="0.92" />
      <stop offset="60%" stop-color="#D97706" stop-opacity="0.88" />
      <stop offset="100%" stop-color="#3A210C" stop-opacity="0.95" />
    </radialGradient>

    <radialGradient id="cyber-hub-core-grad" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#261507" stop-opacity="0.98" />
      <stop offset="70%" stop-color="#1A0E05" stop-opacity="0.96" />
      <stop offset="100%" stop-color="#120902" stop-opacity="0.98" />
    </radialGradient>
  </defs>

  <!-- Interactive Sectors -->
  <g class="cyber-radial-slices-group">
    ${slicesMarkup}
  </g>

  <!-- Negative-Space Isolation Ring Gap (centerRadius to wedgeInnerRadius) -->
  <circle
    cx="0"
    cy="0"
    r="${((radii.centerRadius + radii.wedgeInnerRadius) / 2).toFixed(2)}"
    stroke="rgba(245, 158, 11, 0.15)"
    stroke-width="${(radii.innerGap).toFixed(2)}"
    fill="none"
    class="cyber-negative-space-isolation-ring"
  />

  <!-- Central PLATO DOOM Hub & Deadzone Core (r <= centerRadius) -->
  <g class="cyber-central-hub" transform="scale(${hubState.hubPulseScale})">
    <!-- Hub Solid Core Disk -->
    <circle
      cx="0"
      cy="0"
      r="${hubRadius.toFixed(2)}"
      fill="url(#cyber-hub-core-grad)"
      class="cyber-hub-deadzone-target"
    />

    <!-- Concentric Technical Readout: Outer Hairline Circle -->
    <circle
      cx="0"
      cy="0"
      r="${(hubRadius * 0.88).toFixed(2)}"
      stroke="rgba(245, 158, 11, 0.38)"
      stroke-width="1.0"
      fill="none"
    />

    <!-- Concentric Technical Readout: Synchronized Dashed Arc Ring -->
    <circle
      cx="0"
      cy="0"
      r="${(hubRadius * 0.78).toFixed(2)}"
      stroke="#FFB02E"
      stroke-width="1.6"
      stroke-dasharray="14 6 4 6"
      fill="none"
      class="cyber-hub-sync-ring"
      transform="rotate(${hubState.ringRotationDeg.toFixed(2)})"
    />

    <!-- Concentric Technical Readout: Protractor Tick Ring -->
    <circle
      cx="0"
      cy="0"
      r="${(hubRadius * 0.68).toFixed(2)}"
      stroke="rgba(245, 158, 11, 0.55)"
      stroke-width="2.5"
      stroke-dasharray="2 6"
      fill="none"
    />

    <!-- Concentric Technical Readout: Inner Framing Circle -->
    <circle
      cx="0"
      cy="0"
      r="${(hubRadius * 0.58).toFixed(2)}"
      stroke="rgba(245, 158, 11, 0.3)"
      stroke-width="1.0"
      fill="none"
    />

    <!-- Perimeter Bezel Ring -->
    <circle
      cx="0"
      cy="0"
      r="${hubRadius.toFixed(2)}"
      stroke="#FFB02E"
      stroke-width="2.5"
      fill="none"
      filter="url(#cyber-amber-glow)"
    />

    <!-- 4 Symmetrical High-Intensity Light Flares (11, 1, 5, 7 o'clock) -->
    <g class="cyber-hub-perimeter-flares">
      ${flaresMarkup}
    </g>

    <!-- Central PLATO DOOM Tag Emblem -->
    <g class="cyber-hub-emblem" style="filter: brightness(${hubState.emblemGlowMultiplier});">
      <image
        href="${hubEmblemSrc}"
        x="${(-hubEmblemW / 2).toFixed(2)}"
        y="${(-hubEmblemH / 2).toFixed(2)}"
        width="${hubEmblemW.toFixed(2)}"
        height="${hubEmblemH.toFixed(2)}"
        preserveAspectRatio="xMidYMid meet"
        filter="url(#cyber-amber-emblem-filter)"
      />

      <!-- Techno Overlay: Binary Micro-Readout & Scanlines -->
      <text
        x="0"
        y="${(hubEmblemH / 2 + 8).toFixed(2)}"
        text-anchor="middle"
        font-family="ui-monospace, monospace"
        font-size="6.5"
        font-weight="700"
        fill="rgba(245, 158, 11, 0.85)"
        letter-spacing="0.22em"
      >01101001 01101111 // PLATO.DOOM</text>
    </g>
  </g>
</svg>
`.trim();
}

// ============================================================================
// Upstream React RadialMenu Component Interface (Ticket-001)
// ============================================================================

export function RadialMenu(props = {}) {
  // Pure headless markup generator for Node / SSR evaluation
  const state = {
    activeIndex: props.activeIndex ?? null,
    confirmingIndex: props.confirmingIndex ?? null,
  };
  return renderRadialMenuSVGMarkup(state, props);
}

// ============================================================================
// Browser Three.js Runtime HUD Controller (Ticket-005)
// ============================================================================

/**
 * Instantiate and attach the Cyber-Tactical 2D HUD Radial Menu controller.
 */
export function createCyberRadialMenuHUD(options = {}) {
  let container = options.container ?? null;
  if (typeof container === 'string' && typeof document !== 'undefined') {
    container = document.querySelector(container);
  }

  let menuItems = options.menuItems ? [...options.menuItems] : [...DEFAULT_CYBER_MENU_ITEMS];
  let props = {
    size: options.size ?? 680,
    iconSize: options.iconSize ?? 68,
    bandWidth: options.bandWidth ?? 198,
    innerGap: options.innerGap ?? 18,
    outerGap: options.outerGap ?? 6,
    outerRingWidth: options.outerRingWidth ?? 10,
    linearGapPx: options.linearGapPx ?? 8,
  };

  let open = false;
  let activeIndex = null;
  let confirmingIndex = null;
  let lastSelectedItem = null;
  let confirmTimer = null;

  const onSelect = options.onSelect ?? null;
  const onOpenChange = options.onOpenChange ?? null;

  function render() {
    if (!container) return;
    const markup = renderRadialMenuSVGMarkup(
      { activeIndex, confirmingIndex },
      { ...props, menuItems }
    );
    container.innerHTML = markup;

    if (open) {
      container.classList.add('open');
      container.classList.remove('dormant');
      container.setAttribute('aria-hidden', 'false');
      container.style.pointerEvents = 'auto';
      container.style.opacity = '1';
    } else {
      container.classList.remove('open');
      container.classList.add('dormant');
      container.setAttribute('aria-hidden', 'true');
      container.style.pointerEvents = 'none';
      container.style.opacity = '0';
    }
  }

  function setOpenState(newOpen) {
    if (open === newOpen) return;
    open = newOpen;
    if (!open) {
      activeIndex = null;
      confirmingIndex = null;
      if (confirmTimer) {
        clearTimeout(confirmTimer);
        confirmTimer = null;
      }
    }
    render();
    onOpenChange?.(open);
  }

  function handlePointerMove(e) {
    if (!open || confirmingIndex !== null || !container) return;
    const svg = container.querySelector('.cyber-radial-svg');
    if (!svg) return;

    const rect = svg.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = e.clientX - cx;
    const dy = e.clientY - cy;

    const radii = computeRadialDimensions(props);
    const hit = resolvePolarHitSector(dx, dy, menuItems.length, radii);

    if (hit.zone === 'sector') {
      if (activeIndex !== hit.index) {
        activeIndex = hit.index;
        render();
      }
    } else if (hit.zone === 'deadzone') {
      if (activeIndex !== null) {
        activeIndex = null;
        render();
      }
    }
  }

  function handlePointerDown(e) {
    if (!open || confirmingIndex !== null || !container) return;
    e.stopPropagation();

    const svg = container.querySelector('.cyber-radial-svg');
    if (!svg) return;

    const rect = svg.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = e.clientX - cx;
    const dy = e.clientY - cy;

    const radii = computeRadialDimensions(props);
    const hit = resolvePolarHitSector(dx, dy, menuItems.length, radii);

    if (hit.zone === 'deadzone') {
      // Deadzone cancellation: dismisses menu cleanly without firing onSelect
      controller.cancelDeadzone();
    } else if (hit.zone === 'sector') {
      controller.selectIndex(hit.index);
    }
  }

  function selectIndex(index) {
    if (index < 0 || index >= menuItems.length) return;
    confirmingIndex = index;
    activeIndex = index;
    render();

    if (confirmTimer) {
      clearTimeout(confirmTimer);
    }

    confirmTimer = setTimeout(() => {
      confirmTimer = null;
      const selectedItem = menuItems[index];
      lastSelectedItem = selectedItem;
      setOpenState(false);
      onSelect?.(selectedItem, index);
      selectedItem.action?.();
    }, SELECTION_CONFIRM_DURATION_MS);
  }

  function cancelDeadzone() {
    setOpenState(false);
  }

  if (container) {
    container.addEventListener('pointermove', handlePointerMove);
    container.addEventListener('pointerdown', handlePointerDown);
    container.addEventListener('click', (e) => e.stopPropagation());
    container.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  const controller = {
    open: () => setOpenState(true),
    close: () => setOpenState(false),
    toggle: () => setOpenState(!open),
    isOpen: () => open,
    cancelDeadzone,
    selectIndex,
    setActiveIndex: (idx) => {
      activeIndex = idx;
      render();
    },
    getActiveIndex: () => activeIndex,
    setMenuItems: (newItems) => {
      menuItems = [...newItems];
      render();
    },
    getMenuItems: () => [...menuItems],
    getState: () => ({
      open,
      activeIndex,
      confirmingIndex,
      itemCount: menuItems.length,
      sliceAngleDeg: menuItems.length > 0 ? FULL_CIRCLE / menuItems.length : 0,
      lastSelectedItem,
    }),
    render,
    destroy: () => {
      if (container) {
        container.removeEventListener('pointermove', handlePointerMove);
        container.removeEventListener('pointerdown', handlePointerDown);
        container.innerHTML = '';
      }
    },
  };

  render();
  return controller;
}
