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
export const SLICE_FAN_DURATION_MS = 420;
export const SLICE_FAN_STAGGER_MS = 48;
export const SUBMENU_FAN_IN_DURATION_MS = 200;
export const HOLO_POPUP_OPEN_DURATION_MS = 660;
export const HOLO_POPUP_CLOSE_DURATION_MS = 240;
export const RESPONSIVE_DIAMETER_CSS = 'min(82vw, 76dvh, clamp(280px, 46vmin, 420px))';

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
 * Authoritative 6-Sticker Radial Menu Catalog (Spec 047 §5.1)
 */
export const STICKER_RADIAL_MENU_ITEMS = [
  {
    id: 1,
    key: 'doom_tag',
    stickerId: 'doom_tag',
    code: 'HOLO-STK-01',
    identity: 'DOOM Tag',
    label: 'DOOM TAG',
    idleFramedLabel: '[ DOOM TAG ]',
    emblemSrc: 'stickers_build/doom_tag/radial_thumb_amber.png',
    stagedPngSrc: 'stickers_build/doom_tag/base_color.png',
    repoPath: 'tags/1DOOMTAG.jpeg',
    preserveOriginalColors: true,
    prebakedAmberThumb: true,
    dimensions: { width: 3014, height: 1075 },
    telemetryCode: 'HOLO // STK-01',
  },
  {
    id: 2,
    key: 'glass_doom',
    stickerId: 'glass_doom',
    code: 'HOLO-STK-02',
    identity: 'Glass DOOM',
    label: 'GLASS DOOM',
    idleFramedLabel: '[ GLASS DOOM ]',
    emblemSrc: 'stickers_build/glass_doom/radial_thumb_amber.png',
    stagedPngSrc: 'stickers_build/glass_doom/base_color.png',
    repoPath: 'tags/Glass_DOOM.jpg',
    preserveOriginalColors: true,
    prebakedAmberThumb: true,
    dimensions: { width: 1383, height: 584 },
    telemetryCode: 'HOLO // STK-02',
  },
  {
    id: 3,
    key: 'doom_cig',
    stickerId: 'doom_cig',
    code: 'HOLO-STK-03',
    identity: 'DOOM Cig',
    label: 'DOOM CIG',
    idleFramedLabel: '[ DOOM CIG ]',
    emblemSrc: 'stickers_build/doom_cig/radial_thumb_amber.png',
    stagedPngSrc: 'stickers_build/doom_cig/base_color.png',
    repoPath: 'tags/DOOMTAG_CIG.jpg',
    preserveOriginalColors: true,
    prebakedAmberThumb: true,
    dimensions: { width: 992, height: 973 },
    telemetryCode: 'HOLO // STK-03',
  },
  {
    id: 4,
    key: 'doom_watch',
    stickerId: 'doom_watch',
    code: 'HOLO-STK-04',
    identity: 'DOOM Watch',
    label: 'DOOM WATCH',
    idleFramedLabel: '[ DOOM WATCH ]',
    emblemSrc: 'stickers_build/doom_watch/radial_thumb_amber.png',
    stagedPngSrc: 'stickers_build/doom_watch/base_color.png',
    repoPath: 'tags/DOOM_WATCH.jpg',
    preserveOriginalColors: true,
    prebakedAmberThumb: true,
    dimensions: { width: 930, height: 1214 },
    telemetryCode: 'HOLO // STK-04',
  },
  {
    id: 5,
    key: 'blueberry_tag',
    stickerId: 'blueberry_tag',
    code: 'HOLO-STK-05',
    identity: 'Blueberry Tag',
    label: 'BLUEBERRY',
    idleFramedLabel: '[ BLUEBERRY ]',
    emblemSrc: 'stickers_build/blueberry_tag/radial_thumb_amber.png',
    stagedPngSrc: 'stickers_build/blueberry_tag/base_color.png',
    repoPath: 'tags/blueberrytag.jpeg',
    preserveOriginalColors: true,
    prebakedAmberThumb: true,
    dimensions: { width: 1774, height: 1981 },
    telemetryCode: 'HOLO // STK-05',
  },
  {
    id: 6,
    key: 'eye_tag',
    stickerId: 'eye_tag',
    code: 'HOLO-STK-06',
    identity: 'Eye Tag',
    label: 'EYE TAG',
    idleFramedLabel: '[ EYE TAG ]',
    emblemSrc: 'stickers_build/eye_tag/radial_thumb_amber.png',
    stagedPngSrc: 'stickers_build/eye_tag/base_color.png',
    repoPath: 'tags/eyetag.jpeg',
    preserveOriginalColors: true,
    prebakedAmberThumb: true,
    dimensions: { width: 2168, height: 2126 },
    telemetryCode: 'HOLO // STK-06',
  },
];

/**
 * Legacy 4-Slice Clockwise Constant (Spec 032 §3.4)
 */
export const LEGACY_CYBER_MENU_ITEMS = [
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
 * Authoritative 4-Slice Primary Radial Menu Catalog (Spec 053 §5.1):
 * 12:00 MAIL, 3:00 GITHUB, 6:00 X, 9:00 SPRAYPAINT (opens 6-Sticker Submenu).
 */
export const PRIMARY_CYBER_MENU_ITEMS = [
  {
    id: 1,
    key: 'mail',
    identity: 'Mail',
    label: 'MAIL',
    idleFramedLabel: '[ MAIL ]',
    emblemSrc: 'stickers_build/main_menu/mail_thumb_amber.png',
    stagedPngSrc: 'stickers_build/main_menu/mail_thumb_amber.png',
    repoPath: 'anim/Mail_emblem.jpeg',
    preserveOriginalColors: true,
    prebakedAmberThumb: true,
    dimensions: { width: 2048, height: 2048 },
    telemetryCode: 'NET // SMTP-01',
  },
  {
    id: 2,
    key: 'github',
    identity: 'GitHub',
    label: 'GITHUB',
    idleFramedLabel: '[ GITHUB ]',
    emblemSrc: 'stickers_build/main_menu/github_thumb_amber.png',
    stagedPngSrc: 'stickers_build/main_menu/github_thumb_amber.png',
    repoPath: 'anim/github_emblem.jpeg',
    preserveOriginalColors: true,
    prebakedAmberThumb: true,
    dimensions: { width: 2048, height: 2048 },
    telemetryCode: 'GIT // REPO-02',
  },
  {
    id: 3,
    key: 'x',
    identity: 'X (Twitter)',
    label: 'X',
    idleFramedLabel: '[ X ]',
    emblemSrc: 'stickers_build/main_menu/x_thumb_amber.png',
    stagedPngSrc: 'stickers_build/main_menu/x_thumb_amber.png',
    repoPath: 'anim/twitter_emblem.jpeg',
    preserveOriginalColors: true,
    prebakedAmberThumb: true,
    dimensions: { width: 1024, height: 1024 },
    telemetryCode: 'COM // XNET-03',
  },
  {
    id: 4,
    key: 'spraypaint',
    identity: 'Spraypaint',
    label: 'SPRAYPAINT',
    idleFramedLabel: '[ SPRAYPAINT ]',
    emblemSrc: 'stickers_build/main_menu/spraypaint_thumb_amber.png',
    stagedPngSrc: 'stickers_build/main_menu/spraypaint_thumb_amber.png',
    repoPath: 'anim/spraypaint_emblem.jpeg',
    preserveOriginalColors: true,
    prebakedAmberThumb: true,
    dimensions: { width: 2048, height: 2048 },
    telemetryCode: 'TAG // CAN-04',
    submenuId: 'stickers',
    submenuTitle: 'HOLO.SYS // STICKER MATRIX [HUB: BACK]',
    submenuItems: STICKER_RADIAL_MENU_ITEMS,
  },
];

export const DEFAULT_CYBER_MENU_ITEMS = PRIMARY_CYBER_MENU_ITEMS;

/**
 * Authoritative Central Hub Emblem Reference (anim/radial_menu.md §3.2)
 */
export const CENTRAL_HUB_EMBLEM = {
  id: 'plato-doom-tag',
  label: 'PLATO DOOM',
  emblemSrc: 'stickers_build/plato_doom_hub_amber.png',
  repoPath: 'anim/techno_platodoom_Tag.jpeg',
  stagedPngSrc: 'stickers_build/plato_doom_hub_amber.png',
  prebakedAmberThumb: true,
  width: 280,
  height: 96,
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
  const iconSize = Number(props.iconSize ?? 94);

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
export function computePayloadLayout(index, total, radii, iconSize = 94, linearGapPx = 8) {
  const angles = computeSectorAngles(index, total);
  const R_payload =
    radii.payloadRadius ??
    radii.wedgeInnerRadius + 0.54 * (radii.wedgeOuterRadius - radii.wedgeInnerRadius);
  const centroid = polarToCartesian(R_payload, angles.midDeg);
  const chordWidth =
    2 * R_payload * Math.sin(degToRad(angles.anglePerSlice / 2)) - linearGapPx;
  const emblemDisplaySize = Math.min(iconSize, Math.max(28, chordWidth * 0.54));

  const emblemCenter = { x: centroid.x, y: centroid.y - 12 };
  const labelCenter = { x: centroid.x, y: centroid.y + emblemDisplaySize / 2 + 4 };

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
 * Polar hit-testing contract (Ticket-001 §3.3 & Spec 051 §5.3).
 * Supports optional `renderedDimensions` ({ width, height } or scalar diameter in CSS px)
 * to normalize CSS screen-pixel pointer offsets (dx, dy) into canonical viewBox coordinates.
 */
export function resolvePolarHitSector(dx, dy, total, radii, renderedDimensions = null) {
  const resolvedRadii = radii ?? computeRadialDimensions();
  let scaleX = 1.0;
  let scaleY = 1.0;

  if (renderedDimensions !== null && renderedDimensions !== undefined) {
    const rw =
      typeof renderedDimensions === 'number'
        ? renderedDimensions
        : Number(renderedDimensions.width);
    const rh =
      typeof renderedDimensions === 'number'
        ? renderedDimensions
        : Number(renderedDimensions.height ?? renderedDimensions.width);
    if (Number.isFinite(rw) && rw > 0) {
      scaleX = resolvedRadii.size / rw;
    }
    if (Number.isFinite(rh) && rh > 0) {
      scaleY = resolvedRadii.size / rh;
    }
  }

  const viewBoxDx = dx * scaleX;
  const viewBoxDy = dy * scaleY;
  const distance = Math.hypot(viewBoxDx, viewBoxDy);
  const angleDeg = radToDeg(Math.atan2(viewBoxDy, viewBoxDx));

  if (distance <= resolvedRadii.wedgeInnerRadius) {
    return {
      zone: 'deadzone',
      index: null,
      distance,
      angleDeg,
      rawDx: dx,
      rawDy: dy,
      viewBoxDx,
      viewBoxDy,
      scaleX,
      scaleY,
    };
  }
  if (distance > resolvedRadii.outerRingOuterRadius || !total || total <= 0) {
    return {
      zone: 'outside',
      index: null,
      distance,
      angleDeg,
      rawDx: dx,
      rawDy: dy,
      viewBoxDx,
      viewBoxDy,
      scaleX,
      scaleY,
    };
  }

  const anglePerSlice = FULL_CIRCLE / total;
  const startOffset = START_ANGLE - anglePerSlice / 2;
  let normalized = (angleDeg - startOffset) % FULL_CIRCLE;
  if (normalized < 0) normalized += FULL_CIRCLE;

  const index = Math.floor(normalized / anglePerSlice) % total;
  return {
    zone: 'sector',
    index,
    distance,
    angleDeg,
    rawDx: dx,
    rawDy: dy,
    viewBoxDx,
    viewBoxDy,
    scaleX,
    scaleY,
  };
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
  const entering = Boolean(state.entering);
  const submenuEntering = Boolean(state.submenuEntering);
  const submenuFolding = Boolean(state.submenuFolding);
  const isSubmenu = Boolean(state.isSubmenu);
  const enterElapsedMs = Math.max(0, Number(state.enterElapsedMs ?? 0));
  const densityTier = getTelemetryDensityTier(total);
  const hubState = computeCentralHubState(activeIndex, confirmingIndex, total);

  const radius = radii.radius;
  const viewBox = `${-radius} ${-radius} ${radius * 2} ${radius * 2}`;

  // Build sector slices
  const slicesMarkup = menuItems
    .map((item, index) => {
      const visualState = computeSliceVisualState(index, activeIndex, confirmingIndex, total, item);
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

      // Spec 052 §5.1: Sequential Clockwise Slice Fan-Out & Radial Hover Bisector Kinematics
      const fanStartDeg = -index * angles.anglePerSlice;
      const counterFanStartDeg = index * angles.anglePerSlice;
      const staggerMs = index * SLICE_FAN_STAGGER_MS;
      const midRad = degToRad(angles.midDeg);
      const hoverTx = Math.cos(midRad) * 9;
      const hoverTy = Math.sin(midRad) * 9;
      const selectTx = Math.cos(midRad) * 14;
      const selectTy = Math.sin(midRad) * 14;

      return `
      <g
        class="cyber-radial-slice"
        data-slice-index="${index}"
        data-slice-key="${item.key}"
        data-visual-state="${visualState.visualState}"
        opacity="${visualState.sectorOpacity}"
        style="--slice-index: ${index}; --slice-fan-start-deg: ${fanStartDeg.toFixed(2)}deg; --slice-counter-fan-start-deg: ${counterFanStartDeg.toFixed(2)}deg; --slice-stagger-ms: ${staggerMs}ms; --slice-hover-tx: ${hoverTx.toFixed(2)}px; --slice-hover-ty: ${hoverTy.toFixed(2)}px; --slice-select-tx: ${selectTx.toFixed(2)}px; --slice-select-ty: ${selectTy.toFixed(2)}px;"
      >
        <g class="cyber-slice-hover-mover">
          <!-- Dual-line Outer Rim Band -->
          <path class="cyber-outer-rim-band" d="${dualOuterArc}" fill="rgba(28, 15, 5, 0.32)" stroke="${visualState.perimeterStroke}" stroke-width="1.0" opacity="0.85" />

          <!-- Interactive Sector Wedge Surface (Smoked Glass) -->
          <path
            d="${sectorPath}"
            fill="${visualState.wedgeFill}"
            stroke="${visualState.perimeterStroke}"
            stroke-width="${visualState.perimeterStrokeWidth}"
            class="cyber-sector-surface"
          />

          <!-- Specular Smoked-Glass Diagonal Sheen & Inner Bevel Highlight -->
          <path
            d="${sectorPath}"
            fill="url(#cyber-glass-sheen-grad)"
            stroke="rgba(255, 248, 220, 0.24)"
            stroke-width="0.8"
            class="cyber-sector-glass-sheen"
            pointer-events="none"
          />

          <!-- Inner Concave Bloom Overlay (Persistent Node for In-Place Hover Updates) -->
          <path
            d="${sectorPath}"
            fill="url(#cyber-sector-hover-grad)"
            opacity="${visualState.innerBloomOpacity}"
            class="cyber-sector-bloom-overlay"
            pointer-events="none"
          />

          <!-- Concave Inner Arc Hairline -->
          <path
            d="${slicePath(index, total, radii.wedgeInnerRadius + 18, radii.wedgeInnerRadius + 17, radii.linearGapPx)}"
            fill="rgba(245, 158, 11, 0.42)"
            opacity="0.65"
          />

          <!-- Inner Concave Protractor Ticks -->
          <g class="cyber-inner-ticks" stroke="rgba(245, 158, 11, 0.65)" stroke-width="1.2">
            ${ticks.map((t) => `<path d="${t.path}" opacity="${t.isMajor ? 0.95 : 0.55}" />`).join('\n            ')}
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
          >
            <path d="${brackets.innerLeft.path}" />
            <path d="${brackets.innerRight.path}" />
            <path d="${brackets.outerLeft.path}" />
            <path d="${brackets.outerRight.path}" />
          </g>

          <!-- Upright Centroid Payload (Emblem & Uppercase HUD Label) -->
          <g
            class="cyber-centroid-payload"
            transform="translate(0, 0)"
            style="transform-origin: ${payloadLayout.centroid.x.toFixed(2)}px ${payloadLayout.centroid.y.toFixed(2)}px; transform-box: view-box;"
          >
            <!-- Primary Emblem Graphic (Pre-Baked Amber-Orange Thumbnail, Zero Runtime SVG Filter) -->
            <image
              class="cyber-slice-emblem"
              href="${stagedOrRepoSrc}"
              x="${(payloadLayout.emblemCenter.x - payloadLayout.emblemDisplaySize / 2).toFixed(2)}"
              y="${(payloadLayout.emblemCenter.y - payloadLayout.emblemDisplaySize / 2).toFixed(2)}"
              width="${payloadLayout.emblemDisplaySize.toFixed(2)}"
              height="${payloadLayout.emblemDisplaySize.toFixed(2)}"
              preserveAspectRatio="xMidYMid meet"
              opacity="${visualState.visualState === 'dimmed' ? 0.48 : visualState.visualState === 'idle' ? 0.90 : 1.0}"
              ${item.prebakedAmberThumb ? '' : `filter="${item.preserveOriginalColors ? 'none' : 'url(#cyber-amber-emblem-filter)'}"`}
            />

            <!-- Uppercase Technical Sans-Serif HUD Label -->
            <text
              class="cyber-slice-label"
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
            >
              <path data-bracket-corner="tl" d="${reticleBox.brackets.tl}" />
              <path data-bracket-corner="tr" d="${reticleBox.brackets.tr}" />
              <path data-bracket-corner="bl" d="${reticleBox.brackets.bl}" />
              <path data-bracket-corner="br" d="${reticleBox.brackets.br}" />
            </g>
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
      <g class="cyber-hub-flare" data-flare-angle="${angleDeg}" data-flare-index="${flareIdx}">
        <!-- Radial Streak -->
        <line
          class="cyber-hub-flare-streak"
          x1="${streakPos1.x.toFixed(2)}"
          y1="${streakPos1.y.toFixed(2)}"
          x2="${streakPos2.x.toFixed(2)}"
          y2="${streakPos2.y.toFixed(2)}"
          stroke="${flareColor}"
          stroke-width="${isBoosted ? 2.5 : 1.5}"
          opacity="${isBoosted ? 1.0 : 0.75}"
        />
        <!-- Perimeter Arc Flash -->
        <path
          class="cyber-hub-flare-arc"
          d="M ${pA.x.toFixed(2)} ${pA.y.toFixed(2)} A ${hubRadius} ${hubRadius} 0 0 1 ${pB.x.toFixed(2)} ${pB.y.toFixed(2)}"
          stroke="${flareColor}"
          stroke-width="${coreWidth}"
          fill="none"
        />
      </g>`;
  }).join('\n');

  // Central PLATO DOOM tag emblem sizing (strictly contained inside 0.58 * hubRadius inner framing circle & 0.68 * hubRadius tick ring)
  const hubEmblemW = hubRadius * 1.12;
  const hubEmblemH = hubRadius * 0.39;
  const hubEmblemSrc =
    CENTRAL_HUB_EMBLEM.emblemSrc ?? CENTRAL_HUB_EMBLEM.stagedPngSrc ?? CENTRAL_HUB_EMBLEM.repoPath;

  const svgClassNames = ['cyber-radial-svg'];
  if (entering) svgClassNames.push('cyber-concentric-deploy');
  if (submenuEntering) svgClassNames.push('cyber-submenu-deploy');
  if (submenuFolding) svgClassNames.push('cyber-fan-fold', 'cyber-submenu-fan-fold');

  return `
<svg
  xmlns="http://www.w3.org/2000/svg"
  class="${svgClassNames.join(' ')}"
  viewBox="${viewBox}"
  width="${radii.size}"
  height="${radii.size}"
  preserveAspectRatio="xMidYMid meet"
  style="width: var(--cyber-radial-diameter, ${RESPONSIVE_DIAMETER_CSS}); height: var(--cyber-radial-diameter, ${RESPONSIVE_DIAMETER_CSS}); max-width: min(84vw, 78dvh); max-height: min(84vw, 78dvh); aspect-ratio: 1 / 1; overflow: visible; user-select: none; --holo-enter-offset: -${Math.round(enterElapsedMs)}ms;"
>
  <defs>
    <clipPath id="cyber-wheel-clip">
      <circle cx="0" cy="0" r="${radius}" />
    </clipPath>

    <linearGradient id="cyber-holo-scanbeam-grad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#D97706" stop-opacity="0.0" />
      <stop offset="42%" stop-color="#F59E0B" stop-opacity="0.34" />
      <stop offset="50%" stop-color="#FFFBEB" stop-opacity="0.82" />
      <stop offset="58%" stop-color="#FFB02E" stop-opacity="0.38" />
      <stop offset="100%" stop-color="#B45309" stop-opacity="0.0" />
    </linearGradient>

    <!-- Diagonal Specular Smoked-Amber Glass Sheen Gradient (Spec 052 §5.2) -->
    <linearGradient id="cyber-glass-sheen-grad" x1="12%" y1="8%" x2="88%" y2="92%">
      <stop offset="0%" stop-color="#FFFBEB" stop-opacity="0.16" />
      <stop offset="28%" stop-color="#FDE68A" stop-opacity="0.07" />
      <stop offset="55%" stop-color="#1E1005" stop-opacity="0.0" />
      <stop offset="100%" stop-color="#F59E0B" stop-opacity="0.10" />
    </linearGradient>

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

    <!-- Smoked-Glass Radial Gradients (Spec 052 §5.2: Low-Alpha See-Through Optics) -->
    <radialGradient id="cyber-sector-idle-grad" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#1E1005" stop-opacity="0.34" />
      <stop offset="100%" stop-color="#3A210C" stop-opacity="0.24" />
    </radialGradient>

    <radialGradient id="cyber-sector-hover-grad" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#F59E0B" stop-opacity="0.52" />
      <stop offset="50%" stop-color="#78350F" stop-opacity="0.44" />
      <stop offset="100%" stop-color="#281405" stop-opacity="0.48" />
    </radialGradient>

    <radialGradient id="cyber-sector-select-grad" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#FFD56B" stop-opacity="0.78" />
      <stop offset="60%" stop-color="#D97706" stop-opacity="0.68" />
      <stop offset="100%" stop-color="#3A210C" stop-opacity="0.72" />
    </radialGradient>

    <radialGradient id="cyber-hub-core-grad" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#261507" stop-opacity="0.48" />
      <stop offset="70%" stop-color="#160B04" stop-opacity="0.42" />
      <stop offset="100%" stop-color="#0E0602" stop-opacity="0.48" />
    </radialGradient>
  </defs>

  <g class="cyber-holo-wheel-assembly">
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
      <!-- Hub Smoked-Glass Core Disk -->
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
        style="transform: rotate(${hubState.ringRotationDeg.toFixed(2)}deg); transform-origin: 0px 0px; transform-box: view-box;"
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
        class="cyber-hub-tick-ring"
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

      <!-- Perimeter Bezel Ring (Dual Vector Pass, Zero Gaussian Blur Filter Allocation) -->
      <circle
        cx="0"
        cy="0"
        r="${hubRadius.toFixed(2)}"
        stroke="rgba(245, 158, 11, 0.32)"
        stroke-width="5.5"
        fill="none"
      />
      <circle
        cx="0"
        cy="0"
        r="${hubRadius.toFixed(2)}"
        stroke="#FFB02E"
        stroke-width="2.2"
        fill="none"
      />

      <!-- 4 Symmetrical High-Intensity Light Flares (11, 1, 5, 7 o'clock) -->
      <g class="cyber-hub-perimeter-flares">
        ${flaresMarkup}
      </g>

      <!-- Central PLATO DOOM Tag Emblem (Pre-Baked Amber Thumbnail, Centered Without Spill, Zero Text Beneath) -->
      <g class="cyber-hub-emblem" opacity="${hubState.emblemGlowMultiplier > 1.05 ? 1.0 : 0.92}">
        <image
          class="cyber-hub-emblem-image"
          href="${hubEmblemSrc}"
          x="${(-hubEmblemW / 2).toFixed(2)}"
          y="${(-hubEmblemH / 2).toFixed(2)}"
          width="${hubEmblemW.toFixed(2)}"
          height="${hubEmblemH.toFixed(2)}"
          preserveAspectRatio="xMidYMid meet"
        />
      </g>
    </g>

    <!-- Holographic Scan-Wave & Scanbeam Projection Overlay (Spec 051 §5.2 - Pure Amber Orange) -->
    <g class="cyber-holo-svg-fx" clip-path="url(#cyber-wheel-clip)" pointer-events="none">
      <circle
        class="cyber-svg-scan-wave"
        cx="0"
        cy="0"
        r="${radii.wedgeOuterRadius.toFixed(2)}"
        fill="none"
        stroke="rgba(251, 191, 36, 0.78)"
        stroke-width="2.5"
        opacity="0"
      />
      <circle
        class="cyber-svg-emitter-ring"
        cx="0"
        cy="0"
        r="${(radii.wedgeInnerRadius * 0.94).toFixed(2)}"
        fill="none"
        stroke="rgba(245, 158, 11, 0.46)"
        stroke-width="1.3"
        stroke-dasharray="10 6 3 6"
      />
      <rect
        class="cyber-svg-scanbeam"
        x="${-radius}"
        y="${(-radius * 0.10).toFixed(2)}"
        width="${radius * 2}"
        height="${(radius * 0.20).toFixed(2)}"
        fill="url(#cyber-holo-scanbeam-grad)"
        opacity="0"
      />
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
    entering: props.entering ?? false,
  };
  return renderRadialMenuSVGMarkup(state, props);
}

// ============================================================================
// Holographic Pop-Up Stylesheet Injection (Spec 051 & Spec 052 - Pure Compositor)
// ============================================================================

const CYBER_RADIAL_HOLO_STYLE_ID = 'cyber-radial-menu-holo-styles';

export function ensureCyberRadialHoloStyles() {
  if (typeof document === 'undefined' || !document.head) return;
  if (document.getElementById(CYBER_RADIAL_HOLO_STYLE_ID)) return;

  const styleEl = document.createElement('style');
  styleEl.id = CYBER_RADIAL_HOLO_STYLE_ID;
  styleEl.textContent = `
    :root {
      --cyber-radial-diameter: ${RESPONSIVE_DIAMETER_CSS};
    }

    /* GPU-Composited Materialize Keyframes (transform + opacity ONLY, zero per-frame filter blur) */
    @keyframes cyberHoloWheelMaterialize {
      0% {
        transform: scale(0.22) rotate(-8deg);
        opacity: 0;
      }
      58% {
        transform: scale(1.025) rotate(1.0deg);
        opacity: 1;
      }
      84% {
        transform: scale(0.995) rotate(-0.2deg);
        opacity: 1;
      }
      100% {
        transform: scale(1) rotate(0deg);
        opacity: 1;
      }
    }

    /* Spec 052 §5.1: Sequential Clockwise Slice Fan-Out around (0, 0) - Pure GPU transform + opacity */
    @keyframes cyberSliceFanOut {
      0% {
        transform: rotate(var(--slice-fan-start-deg, 0deg)) scale(0.58);
        opacity: 0;
      }
      22% {
        opacity: 0.92;
      }
      76% {
        transform: rotate(3.5deg) scale(1.025);
        opacity: 1;
      }
      100% {
        transform: rotate(0deg) scale(1);
        opacity: 1;
      }
    }

    /* Spec 052 §5.1: Equal-and-Opposite Centroid Counter-Rotation to Keep Icons/Labels Upright */
    @keyframes cyberPayloadCounterFan {
      0% {
        transform: rotate(var(--slice-counter-fan-start-deg, 0deg)) scale(0.84);
      }
      76% {
        transform: rotate(-3.5deg) scale(1.03);
      }
      100% {
        transform: rotate(0deg) scale(1);
      }
    }

    /* Spec 052 §5.1 & Spec 053 §3.2: Reverse Fan-Fold Collapse toward 12 o'clock Anchor */
    @keyframes cyberSliceFanFold {
      0% {
        transform: rotate(0deg) scale(1);
        opacity: 1;
      }
      100% {
        transform: rotate(calc(var(--slice-fan-start-deg, 0deg) * 0.82)) scale(0.48);
        opacity: 0;
      }
    }

    @keyframes cyberPayloadCounterFold {
      0% {
        transform: rotate(0deg) scale(1);
      }
      100% {
        transform: rotate(calc(var(--slice-counter-fan-start-deg, 0deg) * 0.82)) scale(0.84);
      }
    }

    @keyframes cyberHoloStageTiltIn {
      0% {
        transform: perspective(1100px) rotateX(20deg) translateY(12px);
      }
      62% {
        transform: perspective(1100px) rotateX(-2.5deg) translateY(-2px);
      }
      100% {
        transform: perspective(1100px) rotateX(0deg) translateY(0px);
      }
    }

    @keyframes cyberHoloStageCollapse {
      0% {
        transform: perspective(1100px) rotateX(0deg) rotateZ(0deg) scale(1);
        opacity: 1;
      }
      100% {
        transform: perspective(1100px) rotateX(-16deg) rotateZ(7deg) scale(0.20);
        opacity: 0;
      }
    }

    @keyframes cyberConcentricLayerPop {
      0% {
        transform: scale(0.32);
        opacity: 0;
      }
      68% {
        transform: scale(1.03);
        opacity: 1;
      }
      100% {
        transform: scale(1);
        opacity: 1;
      }
    }

    @keyframes cyberHoloScanWaveSweep {
      0% {
        transform: scale(0.16);
        opacity: 0.95;
      }
      75% {
        opacity: 0.68;
      }
      100% {
        transform: scale(1.06);
        opacity: 0;
      }
    }

    @keyframes cyberHoloScanbeamSweep {
      0% {
        transform: translateY(-340px);
        opacity: 0;
      }
      18% {
        opacity: 0.85;
      }
      82% {
        opacity: 0.75;
      }
      100% {
        transform: translateY(340px);
        opacity: 0;
      }
    }

    @keyframes cyberHoloAmbientAura {
      0%, 100% {
        opacity: 0.82;
        transform: scale(1);
      }
      50% {
        opacity: 1;
        transform: scale(1.02);
      }
    }

    @keyframes cyberHoloEmitterSpin {
      0% {
        transform: rotate(0deg);
      }
      100% {
        transform: rotate(360deg);
      }
    }

    /* Pause all animations & hide compositor layers when dormant so 0% GPU/CPU is used when closed */
    #cyber-radial-menu-overlay.dormant:not(.holo-closing) {
      visibility: hidden;
    }

    #cyber-radial-menu-overlay.dormant:not(.holo-closing) *,
    #cyber-radial-menu-overlay.dormant:not(.holo-closing) *::before,
    #cyber-radial-menu-overlay.dormant:not(.holo-closing) *::after {
      animation-play-state: paused !important;
    }

    #cyber-radial-menu-overlay.dormant:not(.holo-closing) .cyber-radial-smoked-glass {
      backdrop-filter: none;
      -webkit-backdrop-filter: none;
    }

    .cyber-radial-holo-stage {
      position: relative;
      width: var(--cyber-radial-diameter, ${RESPONSIVE_DIAMETER_CSS});
      height: var(--cyber-radial-diameter, ${RESPONSIVE_DIAMETER_CSS});
      max-width: min(84vw, 78dvh);
      max-height: min(84vw, 78dvh);
      aspect-ratio: 1 / 1;
      display: flex;
      align-items: center;
      justify-content: center;
      transform-style: preserve-3d;
      will-change: transform, opacity;
      pointer-events: auto;
    }

    #cyber-radial-menu-overlay.holo-opening .cyber-radial-holo-stage {
      animation: cyberHoloStageTiltIn ${HOLO_POPUP_OPEN_DURATION_MS}ms cubic-bezier(0.16, 1, 0.3, 1) both;
    }

    #cyber-radial-menu-overlay.holo-closing .cyber-radial-holo-stage {
      animation: cyberHoloStageCollapse ${HOLO_POPUP_CLOSE_DURATION_MS}ms cubic-bezier(0.4, 0, 0.8, 0.6) forwards;
    }

    .cyber-radial-holo-aura {
      position: absolute;
      inset: -7%;
      border-radius: 50%;
      background:
        radial-gradient(
          circle at 50% 50%,
          rgba(251, 191, 36, 0.18) 0%,
          rgba(217, 119, 6, 0.11) 42%,
          rgba(28, 12, 3, 0.24) 66%,
          transparent 76%
        ),
        repeating-linear-gradient(
          0deg,
          rgba(245, 158, 11, 0.04) 0px,
          rgba(245, 158, 11, 0.04) 1px,
          transparent 1px,
          transparent 4px
        );
      box-shadow:
        0 0 36px rgba(245, 158, 11, 0.24),
        0 0 60px rgba(217, 119, 6, 0.16),
        inset 0 0 26px rgba(251, 191, 36, 0.15);
      pointer-events: none;
      z-index: 0;
      will-change: transform, opacity;
      animation: cyberHoloAmbientAura 3.4s ease-in-out infinite;
    }

    /* Spec 052 §5.2: True Smoked-Amber Glass Frosted Backdrop Disc */
    .cyber-radial-smoked-glass {
      position: absolute;
      inset: 1.5%;
      border-radius: 50%;
      background:
        radial-gradient(
          circle at 32% 26%,
          rgba(255, 248, 220, 0.12) 0%,
          rgba(52, 26, 8, 0.28) 44%,
          rgba(20, 9, 2, 0.44) 78%,
          rgba(12, 5, 1, 0.52) 100%
        ),
        linear-gradient(
          135deg,
          rgba(255, 243, 199, 0.10) 0%,
          rgba(245, 158, 11, 0.05) 36%,
          rgba(18, 8, 2, 0.20) 68%,
          rgba(217, 119, 6, 0.09) 100%
        );
      backdrop-filter: blur(8px) saturate(1.18) brightness(0.90);
      -webkit-backdrop-filter: blur(8px) saturate(1.18) brightness(0.90);
      border: 1px solid rgba(251, 191, 36, 0.24);
      box-shadow:
        inset 0 1px 2px rgba(255, 248, 220, 0.24),
        inset 0 -10px 24px rgba(12, 5, 1, 0.36),
        0 12px 32px rgba(0, 0, 0, 0.38);
      pointer-events: none;
      z-index: 1;
    }

    .cyber-radial-holo-projector-rings {
      position: absolute;
      inset: 0;
      border-radius: 50%;
      pointer-events: none;
      z-index: 1;
      overflow: hidden;
    }

    .cyber-holo-proj-ring {
      position: absolute;
      border-radius: 50%;
      pointer-events: none;
      will-change: transform;
    }

    .cyber-holo-proj-ring.ring-outer {
      inset: -2.5%;
      border: 1.5px dashed rgba(245, 158, 11, 0.46);
      box-shadow: 0 0 16px rgba(217, 119, 6, 0.28);
      animation: cyberHoloEmitterSpin 26s linear infinite;
    }

    .cyber-holo-proj-ring.ring-mid {
      inset: 14%;
      border: 1px solid rgba(251, 191, 36, 0.28);
      box-shadow: inset 0 0 14px rgba(245, 158, 11, 0.22);
    }

    .cyber-holo-proj-ring.ring-inner {
      inset: 31%;
      border: 1.5px dotted rgba(252, 211, 77, 0.46);
      animation: cyberHoloEmitterSpin 18s linear infinite reverse;
    }

    .cyber-holo-scanbeam-bar {
      position: absolute;
      left: 6%;
      right: 6%;
      top: 50%;
      height: 3px;
      border-radius: 999px;
      background: linear-gradient(
        90deg,
        transparent 0%,
        rgba(217, 119, 6, 0.76) 22%,
        rgba(255, 251, 235, 0.96) 50%,
        rgba(251, 191, 36, 0.80) 78%,
        transparent 100%
      );
      box-shadow:
        0 0 14px rgba(251, 191, 36, 0.78),
        0 0 24px rgba(245, 158, 11, 0.85);
      opacity: 0;
      will-change: transform, opacity;
      pointer-events: none;
    }

    #cyber-radial-menu-overlay.holo-opening .cyber-holo-scanbeam-bar {
      animation: cyberHoloScanbeamSweep ${HOLO_POPUP_OPEN_DURATION_MS}ms cubic-bezier(0.16, 1, 0.3, 1) forwards;
    }

    .cyber-radial-svg-mount {
      position: relative;
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 2;
    }

    .cyber-radial-svg {
      width: 100%;
      height: 100%;
      aspect-ratio: 1 / 1;
      display: block;
      overflow: visible;
    }

    .cyber-radial-svg .cyber-holo-wheel-assembly,
    .cyber-radial-svg .cyber-central-hub,
    .cyber-radial-svg .cyber-negative-space-isolation-ring,
    .cyber-radial-svg .cyber-inner-ticks,
    .cyber-radial-svg .cyber-radial-slice,
    .cyber-radial-svg .cyber-slice-hover-mover,
    .cyber-radial-svg .cyber-outer-rim-band,
    .cyber-radial-svg .cyber-svg-scan-wave,
    .cyber-radial-svg .cyber-svg-emitter-ring,
    .cyber-radial-svg .cyber-hub-tick-ring {
      transform-origin: 0px 0px;
      transform-box: view-box;
    }

    .cyber-radial-svg .cyber-svg-emitter-ring {
      animation: cyberHoloEmitterSpin 22s linear infinite;
    }

    .cyber-radial-svg .cyber-hub-tick-ring {
      animation: cyberHoloEmitterSpin 32s linear infinite reverse;
    }

    .cyber-radial-svg .cyber-hub-sync-ring {
      transition: transform 220ms cubic-bezier(0.16, 1, 0.3, 1);
    }

    /* Spec 052 §5.3: Smooth GPU-Composited Radial Hover Pop-Out Physics (Zero Filter Re-Rasterization) */
    .cyber-radial-svg .cyber-radial-slice {
      transition: opacity 160ms ease-out;
    }

    .cyber-radial-svg .cyber-slice-hover-mover {
      transition: transform 180ms cubic-bezier(0.16, 1, 0.3, 1);
    }

    .cyber-radial-svg .cyber-radial-slice[data-visual-state="hover"] .cyber-slice-hover-mover {
      transform: translate(var(--slice-hover-tx, 0px), var(--slice-hover-ty, 0px)) scale(1.035);
    }

    .cyber-radial-svg .cyber-radial-slice[data-visual-state="selection"] .cyber-slice-hover-mover {
      transform: translate(var(--slice-select-tx, 0px), var(--slice-select-ty, 0px)) scale(1.055);
    }

    .cyber-radial-svg .cyber-radial-slice[data-visual-state="dimmed"] .cyber-slice-hover-mover {
      transform: scale(0.965);
    }

    .cyber-radial-svg .cyber-sector-surface,
    .cyber-radial-svg .cyber-sector-bloom-overlay,
    .cyber-radial-svg .cyber-sector-corner-brackets {
      transition: opacity 160ms ease-out, stroke 160ms ease-out, stroke-width 160ms ease-out;
    }

    .cyber-radial-svg.cyber-concentric-deploy .cyber-holo-wheel-assembly {
      animation: cyberHoloWheelMaterialize ${HOLO_POPUP_OPEN_DURATION_MS}ms cubic-bezier(0.16, 1, 0.3, 1) calc(0ms + var(--holo-enter-offset, 0ms)) both;
    }

    .cyber-radial-svg.cyber-concentric-deploy .cyber-central-hub,
    .cyber-radial-svg.cyber-concentric-deploy .cyber-negative-space-isolation-ring {
      animation: cyberConcentricLayerPop 240ms cubic-bezier(0.16, 1, 0.3, 1) calc(16ms + var(--holo-enter-offset, 0ms)) both;
    }

    /* Spec 053 §3.2: Keep Central Hub & Outer Stage Anchored During Submenu Fan-Out */
    .cyber-radial-svg.cyber-submenu-deploy .cyber-holo-wheel-assembly,
    .cyber-radial-svg.cyber-submenu-deploy .cyber-central-hub,
    .cyber-radial-svg.cyber-submenu-deploy .cyber-negative-space-isolation-ring {
      animation: none !important;
      transform: scale(1) rotate(0deg);
      opacity: 1;
    }

    /* Spec 052 §5.1 & Spec 053 §3.2: Sequential Clockwise Slice Fan-Out & Upright Payload Counter-Sweep */
    .cyber-radial-svg.cyber-concentric-deploy .cyber-radial-slice {
      animation: cyberSliceFanOut ${SLICE_FAN_DURATION_MS}ms cubic-bezier(0.22, 1.28, 0.36, 1) calc(var(--slice-stagger-ms, 0ms) + var(--holo-enter-offset, 0ms)) both;
    }

    .cyber-radial-svg.cyber-concentric-deploy .cyber-centroid-payload {
      animation: cyberPayloadCounterFan ${SLICE_FAN_DURATION_MS}ms cubic-bezier(0.22, 1.28, 0.36, 1) calc(var(--slice-stagger-ms, 0ms) + var(--holo-enter-offset, 0ms)) both;
    }

    .cyber-radial-svg.cyber-fan-fold .cyber-radial-slice {
      animation: cyberSliceFanFold ${HOLO_POPUP_CLOSE_DURATION_MS}ms cubic-bezier(0.4, 0, 0.8, 0.6) forwards;
    }

    .cyber-radial-svg.cyber-fan-fold .cyber-centroid-payload {
      animation: cyberPayloadCounterFold ${HOLO_POPUP_CLOSE_DURATION_MS}ms cubic-bezier(0.4, 0, 0.8, 0.6) forwards;
    }

    /* Spec 053 §3.2: Stage 1 Submenu Fan-In (Counter-Clockwise Fold to 12 o'clock) */
    .cyber-radial-svg.cyber-submenu-fan-fold .cyber-radial-slice {
      animation: cyberSliceFanFold ${SUBMENU_FAN_IN_DURATION_MS}ms cubic-bezier(0.4, 0, 0.68, 0.92) forwards;
    }

    .cyber-radial-svg.cyber-submenu-fan-fold .cyber-centroid-payload {
      animation: cyberPayloadCounterFold ${SUBMENU_FAN_IN_DURATION_MS}ms cubic-bezier(0.4, 0, 0.68, 0.92) forwards;
    }

    .cyber-radial-svg.cyber-concentric-deploy .cyber-svg-scan-wave {
      animation: cyberHoloScanWaveSweep ${HOLO_POPUP_OPEN_DURATION_MS}ms cubic-bezier(0.16, 1, 0.3, 1) calc(15ms + var(--holo-enter-offset, 0ms)) forwards;
    }

    .cyber-radial-svg.cyber-concentric-deploy .cyber-svg-scanbeam {
      animation: cyberHoloScanbeamSweep ${HOLO_POPUP_OPEN_DURATION_MS}ms cubic-bezier(0.16, 1, 0.3, 1) calc(0ms + var(--holo-enter-offset, 0ms)) forwards;
    }

    .cyber-radial-holo-readout-pill {
      position: absolute;
      bottom: clamp(-28px, -6.5%, -18px);
      left: 50%;
      transform: translateX(-50%);
      display: inline-flex;
      align-items: center;
      gap: clamp(5px, 1.4vmin, 7px);
      padding: clamp(2px, 0.5vmin, 3.5px) clamp(8px, 2.2vmin, 11px);
      border-radius: 999px;
      background: rgba(24, 11, 3, 0.86);
      border: 1px solid rgba(245, 158, 11, 0.72);
      box-shadow:
        0 0 14px rgba(245, 158, 11, 0.34),
        0 0 22px rgba(217, 119, 6, 0.24);
      color: #fef3c7;
      font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
      font-size: clamp(8px, 2.1vmin, 9.5px);
      font-weight: 800;
      letter-spacing: 0.12em;
      white-space: nowrap;
      pointer-events: none;
      z-index: 3;
    }

    .cyber-radial-holo-readout-pill .holo-readout-dot {
      width: clamp(5px, 1.3vmin, 6px);
      height: clamp(5px, 1.3vmin, 6px);
      border-radius: 50%;
      background: #fbbf24;
      box-shadow: 0 0 8px #fbbf24, 0 0 14px #f59e0b;
    }

    @media (prefers-reduced-motion: reduce) {
      #cyber-radial-menu-overlay.holo-opening .cyber-radial-holo-stage,
      #cyber-radial-menu-overlay.holo-closing .cyber-radial-holo-stage,
      .cyber-radial-svg.cyber-concentric-deploy .cyber-holo-wheel-assembly,
      .cyber-radial-svg.cyber-concentric-deploy .cyber-central-hub,
      .cyber-radial-svg.cyber-concentric-deploy .cyber-negative-space-isolation-ring,
      .cyber-radial-svg.cyber-concentric-deploy .cyber-radial-slice,
      .cyber-radial-svg.cyber-concentric-deploy .cyber-centroid-payload,
      .cyber-radial-svg.cyber-fan-fold .cyber-radial-slice,
      .cyber-radial-svg.cyber-fan-fold .cyber-centroid-payload,
      .cyber-radial-svg.cyber-submenu-fan-fold .cyber-radial-slice,
      .cyber-radial-svg.cyber-submenu-fan-fold .cyber-centroid-payload {
        animation-duration: 0.01ms !important;
        animation-delay: 0ms !important;
      }
    }
  `;
  document.head.appendChild(styleEl);
}

// ============================================================================
// Browser Three.js Runtime HUD Controller (Ticket-005, Spec 051, Spec 052 & Spec 053)
// ============================================================================

const prewarmedRadialThumbnailSrcs = new Set();

function collectEmblemSrcsRecursive(items, outSet) {
  if (!Array.isArray(items)) return;
  for (const item of items) {
    if (item?.emblemSrc) outSet.add(item.emblemSrc);
    if (Array.isArray(item?.submenuItems)) {
      collectEmblemSrcsRecursive(item.submenuItems, outSet);
    }
  }
}

function prewarmRadialThumbnailCache(items) {
  if (typeof Image === 'undefined') return;
  const srcs = new Set();
  collectEmblemSrcsRecursive(items, srcs);
  if (CENTRAL_HUB_EMBLEM.emblemSrc) {
    srcs.add(CENTRAL_HUB_EMBLEM.emblemSrc);
  }
  for (const src of srcs) {
    if (prewarmedRadialThumbnailSrcs.has(src)) continue;
    prewarmedRadialThumbnailSrcs.add(src);
    const img = new Image();
    img.decoding = 'async';
    img.src = src;
  }
}

const DEFAULT_ROOT_READOUT_TITLE = 'HOLO.SYS // RADIAL MATRIX [Q]';

/**
 * Instantiate and attach the Cyber-Tactical 2D HUD Radial Menu controller.
 */
export function createCyberRadialMenuHUD(options = {}) {
  ensureCyberRadialHoloStyles();

  let container = options.container ?? null;
  if (typeof container === 'string' && typeof document !== 'undefined') {
    container = document.querySelector(container);
  }

  let rootMenuItems = options.menuItems
    ? [...options.menuItems]
    : [...DEFAULT_CYBER_MENU_ITEMS];
  let menuItems = [...rootMenuItems];
  let menuStack = [];
  let activeMenuId = 'main';
  let activeMenuTitle = DEFAULT_ROOT_READOUT_TITLE;
  let submenuTransitionCount = 0;

  prewarmRadialThumbnailCache(rootMenuItems);

  let props = {
    size: options.size ?? 680,
    iconSize: options.iconSize ?? 94,
    bandWidth: options.bandWidth ?? 198,
    innerGap: options.innerGap ?? 18,
    outerGap: options.outerGap ?? 6,
    outerRingWidth: options.outerRingWidth ?? 10,
    linearGapPx: options.linearGapPx ?? 8,
  };

  let open = false;
  let animationPhase = 'dormant'; // 'dormant' | 'opening' | 'open' | 'submenu-folding' | 'submenu-opening' | 'closing'
  let openTimestamp = 0;
  let openCount = 0;
  let hoverUpdateCount = 0;
  let activeIndex = null;
  let confirmingIndex = null;
  let lastSelectedItem = null;
  let confirmTimer = null;
  let openPhaseTimer = null;
  let closePhaseTimer = null;
  let submenuTimer = null;
  let cachedSvgRect = null;
  let cachedSvgRectTime = 0;

  const onSelect = options.onSelect ?? null;
  const onOpenChange = options.onOpenChange ?? null;
  const onHoverChange = options.onHoverChange ?? null;
  const onSubmenuChange = options.onSubmenuChange ?? null;

  function invalidateRectCache() {
    cachedSvgRect = null;
    cachedSvgRectTime = 0;
  }

  function ensureStageElements() {
    if (!container) return null;
    let stageEl = container.querySelector('.cyber-radial-holo-stage');
    let svgMountEl = container.querySelector('.cyber-radial-svg-mount');
    let smokedGlassEl = container.querySelector('.cyber-radial-smoked-glass');
    if (!stageEl || !svgMountEl || !smokedGlassEl) {
      container.innerHTML = `
        <div class="cyber-radial-holo-stage" data-holo-phase="${animationPhase}">
          <div class="cyber-radial-holo-aura" aria-hidden="true"></div>
          <div class="cyber-radial-smoked-glass" aria-hidden="true"></div>
          <div class="cyber-radial-holo-projector-rings" aria-hidden="true">
            <span class="cyber-holo-proj-ring ring-outer"></span>
            <span class="cyber-holo-proj-ring ring-mid"></span>
            <span class="cyber-holo-proj-ring ring-inner"></span>
            <span class="cyber-holo-scanbeam-bar"></span>
          </div>
          <div class="cyber-radial-svg-mount"></div>
          <div class="cyber-radial-holo-readout-pill" aria-hidden="true">
            <span class="holo-readout-dot"></span>
            <span class="holo-readout-text">${activeMenuTitle}</span>
          </div>
        </div>
      `.trim();
      stageEl = container.querySelector('.cyber-radial-holo-stage');
      svgMountEl = container.querySelector('.cyber-radial-svg-mount');
      invalidateRectCache();
    }
    const readoutTextEl = container.querySelector('.holo-readout-text');
    if (readoutTextEl && readoutTextEl.textContent !== activeMenuTitle) {
      readoutTextEl.textContent = activeMenuTitle;
    }
    return { stageEl, svgMountEl };
  }

  /**
   * Spec 052 §5.3: Mutate mounted SVG attributes/styles in-place without
   * destroying or recreating DOM nodes on pointer hover / selection updates.
   */
  function syncMountedSVGState(svgEl) {
    const total = menuItems.length;
    const radii = computeRadialDimensions(props);
    const hubState = computeCentralHubState(activeIndex, confirmingIndex, total);
    const hubRadius = radii.centerRadius;

    const sliceNodes = svgEl.querySelectorAll('.cyber-radial-slice');
    sliceNodes.forEach((sliceEl, index) => {
      const item = menuItems[index];
      if (!item) return;

      const visualState = computeSliceVisualState(index, activeIndex, confirmingIndex, total, item);
      const payloadLayout = computePayloadLayout(index, total, radii, radii.iconSize, radii.linearGapPx);
      const reticleBox = computeReticleBox(payloadLayout, visualState, item);
      const cornerBracketTransform =
        visualState.reticleLockInScale < 1.0
          ? `translate(${payloadLayout.emblemCenter.x.toFixed(2)}, ${payloadLayout.emblemCenter.y.toFixed(2)}) scale(${visualState.reticleLockInScale}) translate(${(-payloadLayout.emblemCenter.x).toFixed(2)}, ${(-payloadLayout.emblemCenter.y).toFixed(2)})`
          : 'translate(0, 0)';

      sliceEl.setAttribute('data-visual-state', visualState.visualState);
      sliceEl.setAttribute('opacity', String(visualState.sectorOpacity));

      const outerRimEl = sliceEl.querySelector('.cyber-outer-rim-band');
      if (outerRimEl) {
        outerRimEl.setAttribute('stroke', visualState.perimeterStroke);
      }

      const surfaceEl = sliceEl.querySelector('.cyber-sector-surface');
      if (surfaceEl) {
        surfaceEl.setAttribute('fill', visualState.wedgeFill);
        surfaceEl.setAttribute('stroke', visualState.perimeterStroke);
        surfaceEl.setAttribute('stroke-width', String(visualState.perimeterStrokeWidth));
      }

      const bloomEl = sliceEl.querySelector('.cyber-sector-bloom-overlay');
      if (bloomEl) {
        bloomEl.setAttribute('opacity', String(visualState.innerBloomOpacity));
      }

      const cornerBracketsEl = sliceEl.querySelector('.cyber-sector-corner-brackets');
      if (cornerBracketsEl) {
        cornerBracketsEl.setAttribute('opacity', visualState.sectorCornerBracketsVisible ? '1' : '0');
        cornerBracketsEl.setAttribute('transform', cornerBracketTransform);
      }

      const emblemEl = sliceEl.querySelector('.cyber-slice-emblem');
      if (emblemEl) {
        const emblemOpacity =
          visualState.visualState === 'dimmed'
            ? 0.48
            : visualState.visualState === 'idle'
              ? 0.90
              : 1.0;
        emblemEl.setAttribute('opacity', String(emblemOpacity));
      }

      const labelEl = sliceEl.querySelector('.cyber-slice-label');
      if (labelEl) {
        labelEl.setAttribute('fill', visualState.labelColor);
        if (labelEl.textContent !== visualState.labelDisplayText) {
          labelEl.textContent = visualState.labelDisplayText;
        }
      }

      const reticleEl = sliceEl.querySelector('.cyber-payload-reticle');
      if (reticleEl) {
        reticleEl.setAttribute('data-reticle-target', reticleBox.target);
        reticleEl.setAttribute('stroke', reticleBox.stroke);
        reticleEl.setAttribute('stroke-width', String(reticleBox.strokeWidth));

        const tlPath = reticleEl.querySelector('[data-bracket-corner="tl"]');
        const trPath = reticleEl.querySelector('[data-bracket-corner="tr"]');
        const blPath = reticleEl.querySelector('[data-bracket-corner="bl"]');
        const brPath = reticleEl.querySelector('[data-bracket-corner="br"]');
        if (tlPath) tlPath.setAttribute('d', reticleBox.brackets.tl);
        if (trPath) trPath.setAttribute('d', reticleBox.brackets.tr);
        if (blPath) blPath.setAttribute('d', reticleBox.brackets.bl);
        if (brPath) brPath.setAttribute('d', reticleBox.brackets.br);
      }
    });

    const centralHubEl = svgEl.querySelector('.cyber-central-hub');
    if (centralHubEl) {
      centralHubEl.setAttribute('transform', `scale(${hubState.hubPulseScale})`);
    }

    const syncRingEl = svgEl.querySelector('.cyber-hub-sync-ring');
    if (syncRingEl) {
      const rotStr = hubState.ringRotationDeg.toFixed(2);
      syncRingEl.setAttribute('transform', `rotate(${rotStr})`);
      syncRingEl.style.transform = `rotate(${rotStr}deg)`;
    }

    const hubEmblemEl = svgEl.querySelector('.cyber-hub-emblem');
    if (hubEmblemEl) {
      hubEmblemEl.setAttribute('opacity', hubState.emblemGlowMultiplier > 1.05 ? '1.0' : '0.92');
    }

    const flareNodes = svgEl.querySelectorAll('.cyber-hub-flare');
    flareNodes.forEach((flareEl, flareIdx) => {
      const angleDeg = CENTRAL_HUB_FLARE_ANGLES[flareIdx];
      if (angleDeg === undefined) return;
      const isBoosted = hubState.activeFlareIndex === flareIdx;
      const coreWidth = isBoosted ? 5.2 : 3.8;
      const arcSpan = isBoosted ? 12 : 8;
      const flareColor = isBoosted ? '#FFFDF0' : '#FFF7D6';
      const a1 = angleDeg - arcSpan / 2;
      const a2 = angleDeg + arcSpan / 2;
      const pA = polarToCartesian(hubRadius, a1);
      const pB = polarToCartesian(hubRadius, a2);

      const streakEl = flareEl.querySelector('.cyber-hub-flare-streak');
      if (streakEl) {
        streakEl.setAttribute('stroke', flareColor);
        streakEl.setAttribute('stroke-width', String(isBoosted ? 2.5 : 1.5));
        streakEl.setAttribute('opacity', String(isBoosted ? 1.0 : 0.75));
      }

      const arcEl = flareEl.querySelector('.cyber-hub-flare-arc');
      if (arcEl) {
        arcEl.setAttribute(
          'd',
          `M ${pA.x.toFixed(2)} ${pA.y.toFixed(2)} A ${hubRadius} ${hubRadius} 0 0 1 ${pB.x.toFixed(2)} ${pB.y.toFixed(2)}`
        );
        arcEl.setAttribute('stroke', flareColor);
        arcEl.setAttribute('stroke-width', String(coreWidth));
      }
    });
  }

  function render(renderOpts = {}) {
    if (!container) return;
    const stageNodes = ensureStageElements();
    if (!stageNodes) return;

    const { stageEl, svgMountEl } = stageNodes;
    const entering = Boolean(renderOpts.entering);
    const submenuEntering = Boolean(renderOpts.submenuEntering);
    const submenuFolding = Boolean(renderOpts.submenuFolding);
    const closing = Boolean(renderOpts.closing);
    const forceRebuild = Boolean(renderOpts.forceRebuild);
    const enterElapsedMs = Math.max(0, Number(renderOpts.enterElapsedMs ?? 0));
    const isSubmenu = menuStack.length > 0;

    let svgEl = svgMountEl.querySelector('.cyber-radial-svg');
    const existingSliceCount = svgEl ? svgEl.querySelectorAll('.cyber-radial-slice').length : 0;

    if (!svgEl || forceRebuild || existingSliceCount !== menuItems.length) {
      const markup = renderRadialMenuSVGMarkup(
        {
          activeIndex,
          confirmingIndex,
          entering,
          submenuEntering,
          submenuFolding,
          isSubmenu,
          enterElapsedMs,
        },
        { ...props, menuItems }
      );
      svgMountEl.innerHTML = markup;
      svgEl = svgMountEl.querySelector('.cyber-radial-svg');
      invalidateRectCache();
    } else {
      syncMountedSVGState(svgEl);
      if (entering) {
        svgEl.classList.remove(
          'cyber-fan-fold',
          'cyber-submenu-fan-fold',
          'cyber-concentric-deploy',
          'cyber-submenu-deploy'
        );
        svgEl.style.setProperty('--holo-enter-offset', `-${Math.round(enterElapsedMs)}ms`);
        if (typeof svgEl.getBoundingClientRect === 'function') {
          void svgEl.getBoundingClientRect();
        }
        svgEl.classList.add('cyber-concentric-deploy');
        if (submenuEntering) {
          svgEl.classList.add('cyber-submenu-deploy');
        }
      } else if (submenuFolding) {
        svgEl.classList.remove('cyber-concentric-deploy', 'cyber-submenu-deploy');
        svgEl.classList.add('cyber-fan-fold', 'cyber-submenu-fan-fold');
      } else if (closing) {
        svgEl.classList.remove('cyber-concentric-deploy', 'cyber-submenu-deploy', 'cyber-submenu-fan-fold');
        svgEl.classList.add('cyber-fan-fold');
      }
    }

    stageEl.dataset.holoPhase = animationPhase;
    stageEl.dataset.activeMenu = activeMenuId;
    stageEl.dataset.menuDepth = String(menuStack.length);

    if (open) {
      container.classList.add('open');
      container.classList.remove('dormant');
      container.setAttribute('aria-hidden', 'false');
      container.style.pointerEvents = 'auto';
    } else {
      container.classList.remove('open');
      container.classList.add('dormant');
      container.setAttribute('aria-hidden', 'true');
      container.style.pointerEvents = 'none';
    }
  }

  function clearLifecycleTimers() {
    if (openPhaseTimer) {
      clearTimeout(openPhaseTimer);
      openPhaseTimer = null;
    }
    if (closePhaseTimer) {
      clearTimeout(closePhaseTimer);
      closePhaseTimer = null;
    }
    if (submenuTimer) {
      clearTimeout(submenuTimer);
      submenuTimer = null;
    }
  }

  /**
   * Spec 053 §3.2 & §5.3: Execute two-stage Fan-In (counter-clockwise fold to 12 o'clock)
   * followed by Fan-Out (clockwise deploy from 12 o'clock) while keeping the smoked-glass
   * stage and central PLATO DOOM hub anchored.
   */
  function transitionToMenu(targetItems, { menuId = 'main', menuTitle = DEFAULT_ROOT_READOUT_TITLE, pushCurrent = false } = {}) {
    if (!Array.isArray(targetItems) || targetItems.length === 0) return false;
    prewarmRadialThumbnailCache(targetItems);

    if (openPhaseTimer) {
      clearTimeout(openPhaseTimer);
      openPhaseTimer = null;
    }
    if (submenuTimer) {
      clearTimeout(submenuTimer);
      submenuTimer = null;
    }
    if (confirmTimer) {
      clearTimeout(confirmTimer);
      confirmTimer = null;
    }

    if (!open) {
      if (pushCurrent) {
        menuStack.push({
          menuItems: [...menuItems],
          menuId: activeMenuId,
          menuTitle: activeMenuTitle,
        });
      }
      menuItems = [...targetItems];
      activeMenuId = menuId;
      activeMenuTitle = menuTitle;
      activeIndex = null;
      confirmingIndex = null;
      render({ entering: false, forceRebuild: true });
      return true;
    }

    // Stage 1: Fan-In outgoing slices counter-clockwise toward 12 o'clock (SUBMENU_FAN_IN_DURATION_MS)
    activeIndex = null;
    confirmingIndex = null;
    animationPhase = 'submenu-folding';
    container?.classList.remove('holo-opening', 'holo-closing');
    container?.classList.add('holo-settled', 'holo-submenu-folding');
    if (container) container.dataset.holoPhase = 'submenu-folding';

    render({ entering: false, submenuFolding: true });

    // Stage 2: Mount incoming menu slices & Fan-Out clockwise from 12 o'clock
    submenuTimer = setTimeout(() => {
      submenuTimer = null;
      if (!open) return;

      if (pushCurrent) {
        menuStack.push({
          menuItems: [...menuItems],
          menuId: activeMenuId,
          menuTitle: activeMenuTitle,
        });
      }
      menuItems = [...targetItems];
      activeMenuId = menuId;
      activeMenuTitle = menuTitle;
      activeIndex = null;
      confirmingIndex = null;
      submenuTransitionCount += 1;
      animationPhase = 'submenu-opening';

      container?.classList.remove('holo-submenu-folding');
      container?.classList.add('holo-submenu-opening');
      if (container) container.dataset.holoPhase = 'submenu-opening';

      render({
        entering: true,
        submenuEntering: true,
        forceRebuild: true,
        enterElapsedMs: 0,
      });

      const fanOutDurationMs =
        SLICE_FAN_DURATION_MS + Math.max(0, menuItems.length - 1) * SLICE_FAN_STAGGER_MS;
      openPhaseTimer = setTimeout(() => {
        openPhaseTimer = null;
        if (open) {
          animationPhase = 'open';
          invalidateRectCache();
          container?.classList.remove('holo-submenu-opening');
          container?.classList.add('holo-settled');
          if (container) container.dataset.holoPhase = 'open';
          const stageEl = container?.querySelector('.cyber-radial-holo-stage');
          if (stageEl) stageEl.dataset.holoPhase = 'open';
        }
      }, fanOutDurationMs);
    }, SUBMENU_FAN_IN_DURATION_MS);

    return true;
  }

  function openSubmenu(submenuItems, submenuId = 'stickers', submenuTitle = 'HOLO.SYS // STICKER MATRIX [HUB: BACK]') {
    return transitionToMenu(submenuItems, {
      menuId: submenuId,
      menuTitle: submenuTitle,
      pushCurrent: true,
    });
  }

  function navigateBack() {
    if (menuStack.length === 0) return false;
    const prev = menuStack.pop();
    return transitionToMenu(prev.menuItems, {
      menuId: prev.menuId,
      menuTitle: prev.menuTitle,
      pushCurrent: false,
    });
  }

  function setOpenState(newOpen) {
    if (open === newOpen) return;
    clearLifecycleTimers();
    open = newOpen;
    invalidateRectCache();

    if (open) {
      // Spec 053 §5.3: Always reset to Root 4-Slice Menu on fresh open
      const needsRootRebuild =
        menuStack.length > 0 ||
        activeMenuId !== 'main' ||
        menuItems.length !== rootMenuItems.length;
      menuStack = [];
      activeMenuId = 'main';
      activeMenuTitle = DEFAULT_ROOT_READOUT_TITLE;
      menuItems = [...rootMenuItems];
      activeIndex = null;
      confirmingIndex = null;

      openCount += 1;
      openTimestamp = typeof performance !== 'undefined' ? performance.now() : Date.now();
      animationPhase = 'opening';
      container?.classList.remove(
        'holo-closing',
        'holo-settled',
        'holo-submenu-folding',
        'holo-submenu-opening'
      );
      container?.classList.add('holo-opening');
      if (container) container.dataset.holoPhase = 'opening';

      render({ entering: true, forceRebuild: needsRootRebuild, enterElapsedMs: 0 });

      openPhaseTimer = setTimeout(() => {
        openPhaseTimer = null;
        if (open) {
          animationPhase = 'open';
          invalidateRectCache();
          container?.classList.remove('holo-opening');
          container?.classList.add('holo-settled');
          if (container) container.dataset.holoPhase = 'open';
          const stageEl = container?.querySelector('.cyber-radial-holo-stage');
          if (stageEl) stageEl.dataset.holoPhase = 'open';
        }
      }, HOLO_POPUP_OPEN_DURATION_MS);
    } else {
      activeIndex = null;
      confirmingIndex = null;
      if (confirmTimer) {
        clearTimeout(confirmTimer);
        confirmTimer = null;
      }
      animationPhase = 'closing';
      container?.classList.remove(
        'holo-opening',
        'holo-settled',
        'holo-submenu-folding',
        'holo-submenu-opening'
      );
      container?.classList.add('holo-closing');
      if (container) container.dataset.holoPhase = 'closing';

      render({ entering: false, closing: true });

      closePhaseTimer = setTimeout(() => {
        closePhaseTimer = null;
        if (!open) {
          animationPhase = 'dormant';
          container?.classList.remove('holo-closing');
          if (container) container.dataset.holoPhase = 'dormant';
          const stageEl = container?.querySelector('.cyber-radial-holo-stage');
          if (stageEl) stageEl.dataset.holoPhase = 'dormant';
        }
      }, HOLO_POPUP_CLOSE_DURATION_MS);
    }

    onOpenChange?.(open);
  }

  function getCachedOrFreshSvgRect() {
    if (!container) return null;
    const now = typeof performance !== 'undefined' ? performance.now() : Date.now();
    // Refresh cached rect at most every 120ms (or immediately when invalidated on open/resize)
    if (cachedSvgRect && now - cachedSvgRectTime < 120) {
      return cachedSvgRect;
    }
    const svg = container.querySelector('.cyber-radial-svg');
    if (!svg) return null;
    cachedSvgRect = svg.getBoundingClientRect();
    cachedSvgRectTime = now;
    return cachedSvgRect;
  }

  function resolvePointerHitFromEvent(e) {
    const rect = getCachedOrFreshSvgRect();
    if (!rect) return null;

    const width = rect.width > 0 ? rect.width : props.size;
    const height = rect.height > 0 ? rect.height : props.size;
    const cx = rect.left + width / 2;
    const cy = rect.top + height / 2;
    const dxCss = e.clientX - cx;
    const dyCss = e.clientY - cy;

    const radii = computeRadialDimensions(props);
    return resolvePolarHitSector(dxCss, dyCss, menuItems.length, radii, { width, height });
  }

  function handlePointerMove(e) {
    if (!open || confirmingIndex !== null || animationPhase === 'submenu-folding' || !container) {
      return;
    }
    const hit = resolvePointerHitFromEvent(e);
    if (!hit) return;

    if (hit.zone === 'sector') {
      if (activeIndex !== hit.index) {
        activeIndex = hit.index;
        hoverUpdateCount += 1;
        render({ entering: false });
        onHoverChange?.(menuItems[activeIndex], activeIndex);
      }
    } else if (hit.zone === 'deadzone' || hit.zone === 'outside') {
      if (activeIndex !== null) {
        activeIndex = null;
        hoverUpdateCount += 1;
        render({ entering: false });
        onHoverChange?.(null, null);
      }
    }
  }

  function handlePointerDown(e) {
    if (!open || confirmingIndex !== null || animationPhase === 'submenu-folding' || !container) {
      return;
    }
    e.stopPropagation();

    invalidateRectCache();
    const hit = resolvePointerHitFromEvent(e);
    if (!hit) return;

    if (hit.zone === 'deadzone') {
      // Spec 053 §5.3: Clicking central hub in a submenu navigates back via Fan-In -> Fan-Out
      if (menuStack.length > 0) {
        navigateBack();
      } else {
        controller.cancelDeadzone();
      }
    } else if (hit.zone === 'outside') {
      // Outside-ring click: dismisses menu cleanly at any depth
      controller.cancelDeadzone();
    } else if (hit.zone === 'sector') {
      controller.selectIndex(hit.index);
    }
  }

  function selectIndex(index) {
    if (
      animationPhase === 'submenu-folding' ||
      index < 0 ||
      index >= menuItems.length
    ) {
      return;
    }
    const selectedItem = menuItems[index];

    // Spec 053 §5.3: Branch slice with submenuItems transitions via Fan-In -> Fan-Out
    if (Array.isArray(selectedItem?.submenuItems) && selectedItem.submenuItems.length > 0) {
      lastSelectedItem = selectedItem;
      const targetMenuId = selectedItem.submenuId || selectedItem.key || 'submenu';
      const targetMenuTitle =
        selectedItem.submenuTitle || `HOLO.SYS // ${selectedItem.label} [HUB: BACK]`;
      onSubmenuChange?.(selectedItem, index, {
        fromMenuId: activeMenuId,
        toMenuId: targetMenuId,
        menuDepth: menuStack.length + 1,
      });
      openSubmenu(selectedItem.submenuItems, targetMenuId, targetMenuTitle);
      return;
    }

    confirmingIndex = index;
    activeIndex = index;
    render({ entering: false });

    if (confirmTimer) {
      clearTimeout(confirmTimer);
    }

    confirmTimer = setTimeout(() => {
      confirmTimer = null;
      lastSelectedItem = selectedItem;
      setOpenState(false);
      onSelect?.(selectedItem, index);
      selectedItem?.action?.();
    }, SELECTION_CONFIRM_DURATION_MS);
  }

  function cancelDeadzone() {
    setOpenState(false);
  }

  function getRenderedBounds() {
    if (!container || typeof window === 'undefined') return null;
    const svg = container.querySelector('.cyber-radial-svg');
    if (!svg) return null;
    const rect = svg.getBoundingClientRect();
    cachedSvgRect = rect;
    cachedSvgRectTime = typeof performance !== 'undefined' ? performance.now() : Date.now();
    const vw = window.innerWidth || 1;
    const vh = window.innerHeight || 1;
    const width = rect.width;
    const height = rect.height;
    return {
      left: rect.left,
      top: rect.top,
      right: rect.right,
      bottom: rect.bottom,
      width,
      height,
      cx: rect.left + width / 2,
      cy: rect.top + height / 2,
      aspectRatio: height > 0 ? Number((width / height).toFixed(4)) : 1,
      aspectDriftPx: Number(Math.abs(width - height).toFixed(3)),
      scaleToViewBoxX: width > 0 ? Number((props.size / width).toFixed(4)) : 1,
      scaleToViewBoxY: height > 0 ? Number((props.size / height).toFixed(4)) : 1,
      viewportWidth: vw,
      viewportHeight: vh,
      widthViewportRatio: Number((width / vw).toFixed(4)),
      heightViewportRatio: Number((height / vh).toFixed(4)),
    };
  }

  if (container) {
    container.addEventListener('pointermove', handlePointerMove);
    container.addEventListener('pointerdown', handlePointerDown);
    container.addEventListener('click', (e) => e.stopPropagation());
    container.addEventListener('contextmenu', (e) => e.preventDefault());
  }
  if (typeof window !== 'undefined') {
    window.addEventListener('resize', invalidateRectCache, { passive: true });
    window.addEventListener('orientationchange', invalidateRectCache, { passive: true });
  }

  const controller = {
    open: () => setOpenState(true),
    close: () => setOpenState(false),
    toggle: () => setOpenState(!open),
    isOpen: () => open,
    cancelDeadzone,
    selectIndex,
    openSubmenu,
    navigateBack,
    setActiveIndex: (idx) => {
      if (activeIndex !== idx) {
        activeIndex = idx;
        hoverUpdateCount += 1;
        render({ entering: false });
        if (idx !== null && idx >= 0 && idx < menuItems.length) {
          onHoverChange?.(menuItems[idx], idx);
        }
      }
    },
    getActiveIndex: () => activeIndex,
    setMenuItems: (newItems) => {
      rootMenuItems = [...newItems];
      menuStack = [];
      activeMenuId = 'main';
      activeMenuTitle = DEFAULT_ROOT_READOUT_TITLE;
      menuItems = [...newItems];
      prewarmRadialThumbnailCache(menuItems);
      render({ entering: false, forceRebuild: true });
    },
    getMenuItems: () => [...menuItems],
    getRenderedBounds,
    getState: () => ({
      open,
      animationPhase,
      openCount,
      hoverUpdateCount,
      activeIndex,
      confirmingIndex,
      activeMenuId,
      menuDepth: menuStack.length,
      isSubmenu: menuStack.length > 0,
      submenuTransitionCount,
      itemCount: menuItems.length,
      sliceAngleDeg: menuItems.length > 0 ? FULL_CIRCLE / menuItems.length : 0,
      viewBoxSize: props.size,
      renderedBounds: getRenderedBounds(),
      lastSelectedItem,
    }),
    render,
    destroy: () => {
      clearLifecycleTimers();
      if (confirmTimer) {
        clearTimeout(confirmTimer);
        confirmTimer = null;
      }
      if (typeof window !== 'undefined') {
        window.removeEventListener('resize', invalidateRectCache);
        window.removeEventListener('orientationchange', invalidateRectCache);
      }
      if (container) {
        container.removeEventListener('pointermove', handlePointerMove);
        container.removeEventListener('pointerdown', handlePointerDown);
        container.innerHTML = '';
      }
    },
  };

  render({ entering: false });
  return controller;
}
