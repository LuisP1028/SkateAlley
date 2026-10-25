/**
 * Holographic Die-Cut Sticker Pipeline & Three.js Renderer
 * Authoritative Specification: anim/stickers.md
 * Governing Tickets: ticket-001.md, ticket-004.md, ticket-005.md, ticket-006.md
 * Schemas: assets/20261020T004604-878-nmhc/plan-stickers-pipeline-schema.json
 */

import * as THREE from 'three';

// ============================================================================
// 1. Authoritative Catalog Manifest & Data Contract (Ticket-001)
// ============================================================================

export const STICKER_ASSET_MANIFEST = Object.freeze([
  Object.freeze({
    index: 1,
    id: 'doom_tag',
    code: 'HOLO-STK-01',
    repoPath: 'tags/1DOOMTAG.jpeg',
    canonicalPath: '/Users/diesel/desktop/SkateAlley/tags/1DOOMTAG.jpeg',
    format: 'JPEG',
    preProcessingMode: 'group_a_cutout',
    bypassExteriorCutout: false,
    sourceWidth: 3514,
    sourceHeight: 1184,
    sourceAspectRatio: 2.967905,
    fileSizeBytes: 1036704,
    sha256: '7ed17b3deff1e09d1b67deef4fce714f7656ae5cbe3ab9fa1e5a31414dd83dc9',
    expectedStage1Metrics: Object.freeze({
      masterBBoxInSource: Object.freeze([358, 105, 3365, 1173]),
      croppedWidth: 3014,
      croppedHeight: 1075,
      croppedAspectRatio: 2.803721,
      planeWidthMeters: 1.9256,
      planeHeightMeters: 0.6868,
      preservedInteriorWhitePixelsMin: 100000,
      connectedStickerIslands: 1,
    }),
    bundlePaths: Object.freeze({
      bundleDir: 'stickers_build/doom_tag',
      baseColorMap: 'stickers_build/doom_tag/base_color.png',
      masterAlphaMap: 'stickers_build/doom_tag/master_alpha.png',
      foilIntensityMask: 'stickers_build/doom_tag/foil_mask.png',
      borderZoneMask: 'stickers_build/doom_tag/border_mask.png',
      packedControlMap: 'stickers_build/doom_tag/packed_control.png',
      spatialMetadata: 'stickers_build/doom_tag/metadata.json',
    }),
    defaultStage2Config: Object.freeze({
      borderMode: 'opaque_vinyl',
      borderTintHex: '#ffffff',
      holoIntensity: 0.85,
      spectralFrequency: 3.6,
      spectralSpread: 1.15,
      microTextureScale: 26.0,
      sparkleSharpness: 4.5,
      vinylRoughness: 0.1,
      clearcoatStrength: 1.0,
      idleShimmer: 1.0,
      defaultPlacementMode: 'decal',
      decalPlacement: Object.freeze({
        wallSide: 'L',
        x: -1.46,
        yRel: 1.72,
        z: 5.3,
        yawRad: 1.5707963267948966,
        normalOffsetMeters: 0.015,
      }),
      floatingPlacement: Object.freeze({
        x: -0.58,
        yRel: 1.52,
        z: 5.3,
        yawRad: 0.32,
        pitchRad: -0.06,
        rollRad: 0.0,
      }),
    }),
  }),
  Object.freeze({
    index: 2,
    id: 'glass_doom',
    code: 'HOLO-STK-02',
    repoPath: 'tags/Glass_DOOM.jpg',
    canonicalPath: '/Users/diesel/desktop/SkateAlley/tags/Glass_DOOM.jpg',
    format: 'JPEG',
    preProcessingMode: 'group_a_cutout',
    bypassExteriorCutout: false,
    sourceWidth: 1440,
    sourceHeight: 1376,
    sourceAspectRatio: 1.046512,
    fileSizeBytes: 487827,
    sha256: 'd382f82f0b8e15ed60be06b2a3c025a02de018a78dbf66b155dcd2879146d43a',
    expectedStage1Metrics: Object.freeze({
      masterBBoxInSource: Object.freeze([63, 404, 1439, 981]),
      croppedWidth: 1383,
      croppedHeight: 584,
      croppedAspectRatio: 2.368151,
      planeWidthMeters: 1.7697,
      planeHeightMeters: 0.7473,
      preservedInteriorWhitePixelsMin: 95000,
      connectedStickerIslands: 1,
    }),
    bundlePaths: Object.freeze({
      bundleDir: 'stickers_build/glass_doom',
      baseColorMap: 'stickers_build/glass_doom/base_color.png',
      masterAlphaMap: 'stickers_build/glass_doom/master_alpha.png',
      foilIntensityMask: 'stickers_build/glass_doom/foil_mask.png',
      borderZoneMask: 'stickers_build/glass_doom/border_mask.png',
      packedControlMap: 'stickers_build/glass_doom/packed_control.png',
      spatialMetadata: 'stickers_build/glass_doom/metadata.json',
    }),
    defaultStage2Config: Object.freeze({
      borderMode: 'exposed_holo_rim',
      borderTintHex: '#ffffff',
      holoIntensity: 0.9,
      spectralFrequency: 4.0,
      spectralSpread: 1.25,
      microTextureScale: 28.0,
      sparkleSharpness: 5.0,
      vinylRoughness: 0.08,
      clearcoatStrength: 1.0,
      idleShimmer: 1.0,
      defaultPlacementMode: 'decal',
      decalPlacement: Object.freeze({
        wallSide: 'R',
        x: 1.46,
        yRel: 1.72,
        z: 9.8,
        yawRad: -1.5707963267948966,
        normalOffsetMeters: 0.015,
      }),
      floatingPlacement: Object.freeze({
        x: 0.58,
        yRel: 1.52,
        z: 9.8,
        yawRad: -0.32,
        pitchRad: -0.05,
        rollRad: 0.0,
      }),
    }),
  }),
  Object.freeze({
    index: 3,
    id: 'doom_cig',
    code: 'HOLO-STK-03',
    repoPath: 'tags/DOOMTAG_CIG.jpg',
    canonicalPath: '/Users/diesel/desktop/SkateAlley/tags/DOOMTAG_CIG.jpg',
    format: 'JPEG',
    preProcessingMode: 'group_a_cutout',
    bypassExteriorCutout: false,
    sourceWidth: 1456,
    sourceHeight: 1360,
    sourceAspectRatio: 1.070588,
    fileSizeBytes: 291555,
    sha256: '6986c6c9ed34b007c74634949467937ae0fb60140c7fbe29258a96bc6bbede2d',
    expectedStage1Metrics: Object.freeze({
      masterBBoxInSource: Object.freeze([0, 393, 985, 1359]),
      croppedWidth: 992,
      croppedHeight: 973,
      croppedAspectRatio: 1.019527,
      planeWidthMeters: 1.1611,
      planeHeightMeters: 1.1389,
      preservedInteriorWhitePixelsMin: 2500,
      connectedStickerIslands: 1,
    }),
    bundlePaths: Object.freeze({
      bundleDir: 'stickers_build/doom_cig',
      baseColorMap: 'stickers_build/doom_cig/base_color.png',
      masterAlphaMap: 'stickers_build/doom_cig/master_alpha.png',
      foilIntensityMask: 'stickers_build/doom_cig/foil_mask.png',
      borderZoneMask: 'stickers_build/doom_cig/border_mask.png',
      packedControlMap: 'stickers_build/doom_cig/packed_control.png',
      spatialMetadata: 'stickers_build/doom_cig/metadata.json',
    }),
    defaultStage2Config: Object.freeze({
      borderMode: 'iridescent_pearl',
      borderTintHex: '#fdf8f5',
      holoIntensity: 0.82,
      spectralFrequency: 3.4,
      spectralSpread: 1.1,
      microTextureScale: 24.0,
      sparkleSharpness: 4.2,
      vinylRoughness: 0.12,
      clearcoatStrength: 1.0,
      idleShimmer: 1.0,
      defaultPlacementMode: 'decal',
      decalPlacement: Object.freeze({
        wallSide: 'L',
        x: -1.46,
        yRel: 1.65,
        z: 14.3,
        yawRad: 1.5707963267948966,
        normalOffsetMeters: 0.015,
      }),
      floatingPlacement: Object.freeze({
        x: -0.58,
        yRel: 1.48,
        z: 14.3,
        yawRad: 0.35,
        pitchRad: -0.04,
        rollRad: 0.0,
      }),
    }),
  }),
  Object.freeze({
    index: 4,
    id: 'doom_watch',
    code: 'HOLO-STK-04',
    repoPath: 'tags/DOOM_WATCH.jpg',
    canonicalPath: '/Users/diesel/desktop/SkateAlley/tags/DOOM_WATCH.jpg',
    format: 'JPEG',
    preProcessingMode: 'group_a_cutout',
    bypassExteriorCutout: false,
    sourceWidth: 1440,
    sourceHeight: 1376,
    sourceAspectRatio: 1.046512,
    fileSizeBytes: 368537,
    sha256: 'f2fb2c94fcee7128e55dfe453b5a30d5c9b89758dbe477ed572055b542c9c9ee',
    expectedStage1Metrics: Object.freeze({
      masterBBoxInSource: Object.freeze([320, 59, 1243, 1266]),
      croppedWidth: 930,
      croppedHeight: 1214,
      croppedAspectRatio: 0.766063,
      planeWidthMeters: 1.0065,
      planeHeightMeters: 1.3139,
      preservedInteriorWhitePixelsMin: 15000,
      connectedStickerIslands: 1,
    }),
    bundlePaths: Object.freeze({
      bundleDir: 'stickers_build/doom_watch',
      baseColorMap: 'stickers_build/doom_watch/base_color.png',
      masterAlphaMap: 'stickers_build/doom_watch/master_alpha.png',
      foilIntensityMask: 'stickers_build/doom_watch/foil_mask.png',
      borderZoneMask: 'stickers_build/doom_watch/border_mask.png',
      packedControlMap: 'stickers_build/doom_watch/packed_control.png',
      spatialMetadata: 'stickers_build/doom_watch/metadata.json',
    }),
    defaultStage2Config: Object.freeze({
      borderMode: 'opaque_vinyl',
      borderTintHex: '#ffffff',
      holoIntensity: 0.86,
      spectralFrequency: 3.8,
      spectralSpread: 1.2,
      microTextureScale: 30.0,
      sparkleSharpness: 4.8,
      vinylRoughness: 0.09,
      clearcoatStrength: 1.0,
      idleShimmer: 1.0,
      defaultPlacementMode: 'floating',
      decalPlacement: Object.freeze({
        wallSide: 'R',
        x: 1.46,
        yRel: 1.68,
        z: 18.8,
        yawRad: -1.5707963267948966,
        normalOffsetMeters: 0.015,
      }),
      floatingPlacement: Object.freeze({
        x: 0.58,
        yRel: 1.5,
        z: 18.8,
        yawRad: -0.35,
        pitchRad: -0.05,
        rollRad: 0.0,
      }),
    }),
  }),
  Object.freeze({
    index: 5,
    id: 'blueberry_tag',
    code: 'HOLO-STK-05',
    repoPath: 'tags/blueberrytag.jpeg',
    canonicalPath: '/Users/diesel/desktop/SkateAlley/tags/blueberrytag.jpeg',
    format: 'JPEG',
    preProcessingMode: 'group_a_cutout',
    bypassExteriorCutout: false,
    sourceWidth: 2106,
    sourceHeight: 2048,
    sourceAspectRatio: 1.02832,
    fileSizeBytes: 2368612,
    sha256: '29bb42493f69b8793207c411e47fa1c9b83c3014740cf37efc1377a184b0ac49',
    expectedStage1Metrics: Object.freeze({
      masterBBoxInSource: Object.freeze([113, 44, 1880, 2018]),
      croppedWidth: 1774,
      croppedHeight: 1981,
      croppedAspectRatio: 0.895507,
      planeWidthMeters: 1.0882,
      planeHeightMeters: 1.2152,
      preservedInteriorWhitePixelsMin: 28000,
      connectedStickerIslands: 1,
    }),
    bundlePaths: Object.freeze({
      bundleDir: 'stickers_build/blueberry_tag',
      baseColorMap: 'stickers_build/blueberry_tag/base_color.png',
      masterAlphaMap: 'stickers_build/blueberry_tag/master_alpha.png',
      foilIntensityMask: 'stickers_build/blueberry_tag/foil_mask.png',
      borderZoneMask: 'stickers_build/blueberry_tag/border_mask.png',
      packedControlMap: 'stickers_build/blueberry_tag/packed_control.png',
      spatialMetadata: 'stickers_build/blueberry_tag/metadata.json',
    }),
    defaultStage2Config: Object.freeze({
      borderMode: 'exposed_holo_rim',
      borderTintHex: '#f0fdf4',
      holoIntensity: 0.88,
      spectralFrequency: 3.7,
      spectralSpread: 1.18,
      microTextureScale: 25.0,
      sparkleSharpness: 4.4,
      vinylRoughness: 0.11,
      clearcoatStrength: 1.0,
      idleShimmer: 1.0,
      defaultPlacementMode: 'floating',
      decalPlacement: Object.freeze({
        wallSide: 'L',
        x: -1.46,
        yRel: 1.66,
        z: 23.3,
        yawRad: 1.5707963267948966,
        normalOffsetMeters: 0.015,
      }),
      floatingPlacement: Object.freeze({
        x: -0.58,
        yRel: 1.5,
        z: 23.3,
        yawRad: 0.34,
        pitchRad: -0.05,
        rollRad: 0.0,
      }),
    }),
  }),
  Object.freeze({
    index: 6,
    id: 'eye_tag',
    code: 'HOLO-STK-06',
    repoPath: 'tags/eyetag.jpeg',
    canonicalPath: '/Users/diesel/desktop/SkateAlley/tags/eyetag.jpeg',
    format: 'JPEG',
    preProcessingMode: 'group_b_full_frame',
    bypassExteriorCutout: true,
    sourceWidth: 2090,
    sourceHeight: 2048,
    sourceAspectRatio: 1.020508,
    fileSizeBytes: 2262863,
    sha256: 'b68107ca8ade08257f4f1dd133a2872289c04a9fcf45a1a1f6833e57793043ef',
    expectedStage1Metrics: Object.freeze({
      masterBBoxInSource: Object.freeze([0, 0, 2089, 2047]),
      croppedWidth: 2168,
      croppedHeight: 2126,
      croppedAspectRatio: 1.019755,
      planeWidthMeters: 1.1613,
      planeHeightMeters: 1.1388,
      preservedInteriorWhitePixelsMin: 0,
      connectedStickerIslands: 1,
    }),
    bundlePaths: Object.freeze({
      bundleDir: 'stickers_build/eye_tag',
      baseColorMap: 'stickers_build/eye_tag/base_color.png',
      masterAlphaMap: 'stickers_build/eye_tag/master_alpha.png',
      foilIntensityMask: 'stickers_build/eye_tag/foil_mask.png',
      borderZoneMask: 'stickers_build/eye_tag/border_mask.png',
      packedControlMap: 'stickers_build/eye_tag/packed_control.png',
      spatialMetadata: 'stickers_build/eye_tag/metadata.json',
    }),
    defaultStage2Config: Object.freeze({
      borderMode: 'iridescent_pearl',
      borderTintHex: '#fff5f7',
      holoIntensity: 0.84,
      spectralFrequency: 3.5,
      spectralSpread: 1.15,
      microTextureScale: 24.0,
      sparkleSharpness: 4.6,
      vinylRoughness: 0.1,
      clearcoatStrength: 1.0,
      idleShimmer: 1.0,
      defaultPlacementMode: 'decal',
      decalPlacement: Object.freeze({
        wallSide: 'R',
        x: 1.46,
        yRel: 1.66,
        z: 27.8,
        yawRad: -1.5707963267948966,
        normalOffsetMeters: 0.015,
      }),
      floatingPlacement: Object.freeze({
        x: 0.58,
        yRel: 1.5,
        z: 27.8,
        yawRad: -0.34,
        pitchRad: -0.04,
        rollRad: 0.0,
      }),
    }),
  }),
]);

const lookup = {};
for (const item of STICKER_ASSET_MANIFEST) {
  lookup[item.id] = item;
  lookup[item.code] = item;
  lookup[item.repoPath] = item;
  lookup[item.index] = item;
  lookup[String(item.index)] = item;
}
export const STICKER_ASSET_BY_ID = Object.freeze(lookup);

export const STICKER_BORDER_MODES = Object.freeze({
  opaque_vinyl: Object.freeze({ code: 0, label: 'Opaque Vinyl Border' }),
  exposed_holo_rim: Object.freeze({ code: 1, label: 'Exposed Holo Rim' }),
  iridescent_pearl: Object.freeze({ code: 2, label: 'Iridescent Pearl Border' }),
});

export const STICKER_PLACEMENT_MODES = Object.freeze(['decal', 'floating']);

export const STICKER_DEFAULT_MATERIAL_PARAMS = Object.freeze({
  holoIntensity: 0.85,
  foilSubstrateMetallic: 0.9,
  spectralFrequency: 3.6,
  spectralSpread: 1.15,
  spectralPhaseOffset: 0.0,
  microTextureScale: 26.0,
  sparkleSharpness: 4.5,
  sparkleDensity: 0.85,
  inkOpacityBoost: 0.65,
  headOnLegibilityGuard: 0.8,
  borderMode: 'opaque_vinyl',
  borderTintHex: '#ffffff',
  pearlFresnelPower: 2.2,
  pearlIridescenceStrength: 0.88,
  vinylRoughness: 0.1,
  clearcoatStrength: 1.0,
  clearcoatFresnelBias: 0.04,
  idleShimmerEnabled: true,
  idleShimmerSpeed: 1.6,
  idleShimmerAmplitude: 0.18,
});

export function resolveStickerAssetSpec(idOrCodeOrPathOrIndex) {
  if (idOrCodeOrPathOrIndex === undefined || idOrCodeOrPathOrIndex === null) {
    throw new Error('resolveStickerAssetSpec: Asset identifier is required (INV-FAILFAST-01).');
  }
  if (typeof idOrCodeOrPathOrIndex === 'object') {
    const key = idOrCodeOrPathOrIndex.id || idOrCodeOrPathOrIndex.stickerId || idOrCodeOrPathOrIndex.code;
    if (key && STICKER_ASSET_BY_ID[key]) {
      return STICKER_ASSET_BY_ID[key];
    }
  }
  const spec = STICKER_ASSET_BY_ID[idOrCodeOrPathOrIndex];
  if (!spec) {
    throw new Error(`resolveStickerAssetSpec: Unknown sticker asset identifier '${idOrCodeOrPathOrIndex}' (INV-FAILFAST-01).`);
  }
  return spec;
}

export function computeStickerGeometrySpec(assetSpec, options = {}) {
  const spec = typeof assetSpec === 'string' || typeof assetSpec === 'number'
    ? resolveStickerAssetSpec(assetSpec)
    : assetSpec;

  const croppedWidth = options.croppedWidth || spec.expectedStage1Metrics.croppedWidth;
  const croppedHeight = options.croppedHeight || spec.expectedStage1Metrics.croppedHeight;
  const croppedAspectRatio = options.croppedAspectRatio || (croppedWidth / croppedHeight);

  const baseArea = (options.baseHeightMeters || 1.15) ** 2;
  const planeHeightMeters = Number(Math.sqrt(baseArea / croppedAspectRatio).toFixed(4));
  const planeWidthMeters = Number((planeHeightMeters * croppedAspectRatio).toFixed(4));
  const aspectError = Math.abs((planeWidthMeters / planeHeightMeters) - croppedAspectRatio);

  return {
    croppedWidth,
    croppedHeight,
    croppedAspectRatio,
    planeWidthMeters,
    planeHeightMeters,
    aspectError,
    uvSafetyMarginPx: 3,
    segmentsX: options.segmentsX || 32,
    segmentsY: options.segmentsY || 32,
  };
}

export function evaluateStickerTriZoneClassification(masterAlpha, subjectAlpha) {
  const m = Math.max(0.0, Math.min(1.0, Number(masterAlpha) || 0.0));
  const s = Math.max(0.0, Math.min(1.0, Number(subjectAlpha) || 0.0));
  const borderMask = Math.max(0.0, Math.min(1.0, m - s));

  let zoneName = 'exterior_void';
  let zoneCode = 0;
  if (m >= 0.05) {
    if (borderMask >= s) {
      zoneName = 'die_cut_border';
      zoneCode = 128;
    } else {
      zoneName = 'subject_interior';
      zoneCode = 255;
    }
  }

  return {
    zoneName,
    zoneCode,
    exteriorVoidWeight: 1.0 - m,
    borderZoneWeight: borderMask,
    subjectInteriorWeight: s,
  };
}

export function evaluateStickerFoilMaskDerivation(rgbNormalized, subjectAlpha, borderMask) {
  const [r, g, b] = rgbNormalized;
  const luma = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  const maxC = Math.max(r, g, b);
  const minC = Math.min(r, g, b);
  const sat = maxC > 1e-4 ? (maxC - minC) / maxC : 0.0;

  // smoothstep(0.10, 0.28, luma)
  const t = Math.max(0.0, Math.min(1.0, (luma - 0.10) / (0.28 - 0.10)));
  const shadowGate = t * t * (3.0 - 2.0 * t);

  const lumaNorm = Math.max(0.0, Math.min(1.0, (luma - 0.10) / 0.90));
  const midHighlight = 0.22 + 0.68 * Math.pow(lumaNorm, 0.85) + 0.15 * sat * (1.0 - Math.abs(2.0 * luma - 1.0));
  const foilSubject = Math.max(0.0, Math.min(0.92, shadowGate * midHighlight));
  const foilMask = Math.max(0.0, Math.min(1.0, subjectAlpha * foilSubject + borderMask * 1.0));

  return { luma, sat, shadowGate, midHighlight, foilSubject, foilMask };
}

export function evaluateDieCutBorderVisualMode(borderMode, borderTintRGB, rawHoloFoilRGB, rainbowRGB, ndotv, options = {}) {
  const mode = borderMode || 'opaque_vinyl';
  const tint = borderTintRGB ? [...borderTintRGB] : [1.0, 1.0, 1.0];
  const pearlPower = options.pearlFresnelPower !== undefined ? options.pearlFresnelPower : 2.2;
  const pearlStrength = options.pearlIridescenceStrength !== undefined ? options.pearlIridescenceStrength : 0.88;

  if (mode === 'opaque_vinyl') {
    return {
      mode,
      borderRGB: tint,
      foilContribution: 0.0,
      clearcoatActive: true,
      pearlGrazing: 0.0,
    };
  }

  if (mode === 'exposed_holo_rim') {
    const borderRGB = rawHoloFoilRGB.map((c, i) => c * tint[i]);
    return {
      mode,
      borderRGB,
      foilContribution: 1.0,
      clearcoatActive: true,
      pearlGrazing: 0.0,
    };
  }

  if (mode === 'iridescent_pearl') {
    const pearlGrazing = Math.pow(1.0 - Math.max(0.0, Math.min(1.0, ndotv)), pearlPower);
    const pastelPearl = rainbowRGB.map((c) => 1.0 * (1.0 - 0.48) + c * 0.48);
    const blendWeight = Math.max(0.0, Math.min(0.92, pearlGrazing * pearlStrength));
    const borderRGB = tint.map((tVal, i) => {
      const pearlCol = pastelPearl[i] * (0.85 + 0.25 * rawHoloFoilRGB[i]);
      return tVal * (1.0 - blendWeight) + pearlCol * blendWeight;
    });
    return {
      mode,
      borderRGB,
      foilContribution: blendWeight,
      clearcoatActive: true,
      pearlGrazing,
    };
  }

  throw new Error(`evaluateDieCutBorderVisualMode: Unknown border visual mode '${borderMode}' (INV-FAILFAST-01).`);
}

export function evaluateHolographicStickerOptics(sampleInput) {
  const {
    baseColorRGB = [1, 1, 1],
    masterAlpha = 1.0,
    foilMask = 0.5,
    borderMask = 0.0,
    normal = [0, 0, 1],
    viewDir = [0, 0, 1],
    lightDir = [0.4, 0.8, 0.4],
    tangent = [1, 0, 0],
    uv = [0.5, 0.5],
    params = STICKER_DEFAULT_MATERIAL_PARAMS,
    time = 0.0,
  } = sampleInput;

  // Vector normalization & dot products
  const lenN = Math.hypot(...normal) || 1.0;
  const N = normal.map((v) => v / lenN);
  const lenV = Math.hypot(...viewDir) || 1.0;
  const V = viewDir.map((v) => v / lenV);
  const lenL = Math.hypot(...lightDir) || 1.0;
  const L = lightDir.map((v) => v / lenL);

  const Hvec = [V[0] + L[0], V[1] + L[1], V[2] + L[2]];
  const lenH = Math.hypot(...Hvec) || 1.0;
  const H = Hvec.map((v) => v / lenH);

  const ndotv = Math.max(0.0, Math.min(1.0, N[0] * V[0] + N[1] * V[1] + N[2] * V[2]));
  const ndoth = Math.max(0.0, Math.min(1.0, N[0] * H[0] + N[1] * H[1] + N[2] * H[2]));

  // Bitangent
  const B = [
    N[1] * tangent[2] - N[2] * tangent[1],
    N[2] * tangent[0] - N[0] * tangent[2],
    N[0] * tangent[1] - N[1] * tangent[0],
  ];

  // Layer 1: Metallic Foil Substrate
  const foilMetallic = params.foilSubstrateMetallic ?? 0.9;
  const metallicLuma = (0.32 + 0.68 * Math.pow(ndoth, 6.0)) * foilMetallic;
  const layer1_foilSubstrate = [metallicLuma, metallicLuma, metallicLuma];

  // Layer 2: Iridescent Diffraction Layer
  const tangentDot = (V[0] - L[0]) * tangent[0] + (V[1] - L[1]) * tangent[1] + (V[2] - L[2]) * tangent[2];
  const bitangentDot = V[0] * B[0] + V[1] * B[1] + V[2] * B[2];
  const tangentShift = tangentDot * 0.65 + bitangentDot * 0.35;
  const idleWave = (params.idleShimmerEnabled !== false)
    ? Math.sin(time * (params.idleShimmerSpeed ?? 1.6) + uv[0] * 5.0 + uv[1] * 3.5) * (params.idleShimmerAmplitude ?? 0.18)
    : 0.0;

  const freq = params.spectralFrequency ?? 3.6;
  const spread = params.spectralSpread ?? 1.15;
  const phaseOffset = params.spectralPhaseOffset ?? 0.0;
  const spectralPhase = (1.0 - ndotv) * freq * spread + tangentShift * freq + (uv[0] * 0.8 + uv[1] * 0.6) * spread + phaseOffset + idleWave;

  const rainbowRGB = [
    0.5 + 0.5 * Math.cos(2.0 * Math.PI * (spectralPhase + 0.0)),
    0.5 + 0.5 * Math.cos(2.0 * Math.PI * (spectralPhase + 0.333333)),
    0.5 + 0.5 * Math.cos(2.0 * Math.PI * (spectralPhase + 0.666667)),
  ];
  const layer2_iridescentDiffraction = rainbowRGB;

  // Layer 3: Foil Micro-Texture Grating
  const microScale = params.microTextureScale ?? 26.0;
  const microUv = [uv[0] * microScale, uv[1] * microScale];
  const cellId = [Math.floor(microUv[0]), Math.floor(microUv[1])];
  const cellUv = [microUv[0] - cellId[0] - 0.5, microUv[1] - cellId[1] - 0.5];
  const cellAngle = Math.sin(cellId[0] * 127.1 + cellId[1] * 311.7) * 43758.5453;
  const cCos = Math.cos(cellAngle);
  const cSin = Math.sin(cellAngle);
  const rotCell = [cellUv[0] * cCos - cellUv[1] * cSin, cellUv[0] * cSin + cellUv[1] * cCos];
  const microFacetDist = Math.max(Math.abs(rotCell[0]) + Math.abs(rotCell[1]) * 0.866, Math.abs(rotCell[1]));
  const microGratingPattern = 0.5 + 0.5 * Math.cos(microFacetDist * 18.0 + cellAngle);

  const facetDelta = [
    (tangent[0] * rotCell[0] + B[0] * rotCell[1]) * 0.35,
    (tangent[1] * rotCell[0] + B[1] * rotCell[1]) * 0.35,
    (tangent[2] * rotCell[0] + B[2] * rotCell[1]) * 0.35,
  ];
  const pertN = [N[0] + facetDelta[0], N[1] + facetDelta[1], N[2] + facetDelta[2]];
  const lenPert = Math.hypot(...pertN) || 1.0;
  const pN = pertN.map((v) => v / lenPert);
  const pertH = Math.max(0.0, Math.min(1.0, pN[0] * H[0] + pN[1] * H[1] + pN[2] * H[2]));
  const sparkle = Math.pow(pertH, params.sparkleSharpness ?? 4.5) * (params.sparkleDensity ?? 0.85);

  const rawHoloFoilRGB = rainbowRGB.map((c, i) => {
    const substrateMix = layer1_foilSubstrate[i] * (1.0 - 0.78) + c * 0.78;
    return substrateMix * (0.65 + 0.55 * microGratingPattern) + c * sparkle * 0.85;
  });
  const layer3_microTexture = rawHoloFoilRGB;

  // Layer 4: Printed CMYK Ink Layer & Border Zone Compositing
  const obliqueFactor = 1.0 - Math.pow(ndotv, 1.5);
  const baseLuma = 0.2126 * baseColorRGB[0] + 0.7152 * baseColorRGB[1] + 0.0722 * baseColorRGB[2];
  const headOnGuard = params.headOnLegibilityGuard !== undefined ? params.headOnLegibilityGuard : 0.8;
  const inkOpacityBoost = params.inkOpacityBoost !== undefined ? params.inkOpacityBoost : 0.65;
  const holoIntensity = params.holoIntensity !== undefined ? params.holoIntensity : 0.85;

  const effectiveSubjectFoil = Math.max(
    0.0,
    Math.min(
      1.0,
      foilMask * holoIntensity * (1.0 - 0.55 * headOnGuard * (1.0 - obliqueFactor)) * (1.0 - 0.35 * inkOpacityBoost * (1.0 - baseLuma))
    )
  );

  const subjectInkRGB = baseColorRGB.map((c, i) => {
    const holoRef = c * 0.35 + rawHoloFoilRGB[i] * 0.95;
    return c * (1.0 - effectiveSubjectFoil) + holoRef * effectiveSubjectFoil;
  });

  // Border zone evaluation
  const borderMode = params.borderMode || 'opaque_vinyl';
  const borderTintRGB = params.borderTintHex
    ? [
        parseInt(params.borderTintHex.slice(1, 3), 16) / 255,
        parseInt(params.borderTintHex.slice(3, 5), 16) / 255,
        parseInt(params.borderTintHex.slice(5, 7), 16) / 255,
      ]
    : [1, 1, 1];

  const borderEval = evaluateDieCutBorderVisualMode(borderMode, borderTintRGB, rawHoloFoilRGB, rainbowRGB, ndotv, params);
  const bWeight = Math.max(0.0, Math.min(1.0, borderMask));
  const layer4_printedInkComposite = subjectInkRGB.map((c, i) => c * (1.0 - bWeight) + borderEval.borderRGB[i] * bWeight);

  // Layer 5: Glossy Vinyl Topcoat / Clearcoat
  const roughness = params.vinylRoughness ?? 0.1;
  const alphaRough = Math.max(0.02, roughness * roughness);
  const specPower = Math.max(8.0, Math.min(512.0, 2.0 / (alphaRough * alphaRough) - 2.0));
  const bias = params.clearcoatFresnelBias !== undefined ? params.clearcoatFresnelBias : 0.04;
  const fresnelClearcoat = bias + (1.0 - bias) * Math.pow(1.0 - ndotv, 5.0);
  const clearcoatSpec = Math.pow(ndoth, specPower) * fresnelClearcoat * (params.clearcoatStrength ?? 1.0);

  const layer5_vinylClearcoat = [clearcoatSpec, clearcoatSpec, clearcoatSpec];
  const finalRGB = layer4_printedInkComposite.map((c) => Math.max(0.0, Math.min(1.0, c + clearcoatSpec)));
  const finalAlpha = masterAlpha;

  const headOnContrastRatio = (baseLuma + 0.05) / (baseLuma * (1.0 - effectiveSubjectFoil) + 0.05);

  return {
    layer1_foilSubstrate,
    layer2_iridescentDiffraction,
    layer3_microTexture,
    layer4_printedInkComposite,
    layer5_vinylClearcoat,
    finalRGB,
    finalAlpha,
    headOnContrastRatio,
    spectralColorSpread: spread,
  };
}

export function evaluateStickerIdleShimmer(isStationary, arg2, arg3, arg4) {
  let stationaryDurationSec = 0.0;
  let elapsedTime = 0.0;
  let params = undefined;

  if (typeof arg3 === 'number') {
    stationaryDurationSec = Number(arg2) || 0.0;
    elapsedTime = arg3;
    params = arg4;
  } else {
    stationaryDurationSec = isStationary ? 1.0 : 0.0;
    elapsedTime = Number(arg2) || 0.0;
    params = arg3;
  }

  const enabled = params && params.idleShimmerEnabled !== undefined ? Boolean(params.idleShimmerEnabled) : true;
  const speed = params && params.idleShimmerSpeed !== undefined ? params.idleShimmerSpeed : 1.6;
  const amp = params && params.idleShimmerAmplitude !== undefined ? params.idleShimmerAmplitude : 0.18;

  if (!enabled || !isStationary || stationaryDurationSec < 0.15) {
    return { active: false, shimmerPhase: 0.0, waveOffset: 0.0 };
  }
  const shimmerPhase = Math.sin(elapsedTime * speed) * amp;
  return { active: true, shimmerPhase, waveOffset: shimmerPhase };
}

// ============================================================================
// 2. Texture Bundle Controller (Ticket-001 §3.1, Ticket-005 §3.2)
// ============================================================================

function createPlaceholderDataTexture(width = 32, height = 32, fillVal = [255, 255, 255, 255], isSrgb = true) {
  const size = width * height * 4;
  const data = new Uint8Array(size);
  for (let i = 0; i < size; i += 4) {
    data[i] = fillVal[0];
    data[i + 1] = fillVal[1];
    data[i + 2] = fillVal[2];
    data[i + 3] = fillVal[3];
  }
  const texture = new THREE.DataTexture(data, width, height, THREE.RGBAFormat);
  texture.needsUpdate = true;
  texture.colorSpace = isSrgb ? THREE.SRGBColorSpace : THREE.NoColorSpace;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  return texture;
}

export function createStickerTextureBundleController(assetSpec, options = {}) {
  const spec = typeof assetSpec === 'string' || typeof assetSpec === 'number'
    ? resolveStickerAssetSpec(assetSpec)
    : assetSpec;

  const isBrowser = typeof window !== 'undefined' && typeof Image !== 'undefined';
  const loader = isBrowser ? new THREE.TextureLoader() : null;

  function loadMap(path, isSrgb = false, defaultVal = [255, 255, 255, 255]) {
    if (loader) {
      const tex = loader.load(path);
      tex.colorSpace = isSrgb ? THREE.SRGBColorSpace : THREE.NoColorSpace;
      tex.minFilter = THREE.LinearFilter;
      tex.magFilter = THREE.LinearFilter;
      tex.wrapS = THREE.ClampToEdgeWrapping;
      tex.wrapT = THREE.ClampToEdgeWrapping;
      return tex;
    }
    return createPlaceholderDataTexture(32, 32, defaultVal, isSrgb);
  }

  const baseColorMap = loadMap(spec.bundlePaths.baseColorMap, true, [200, 200, 200, 255]);
  const masterAlphaMap = loadMap(spec.bundlePaths.masterAlphaMap, false, [255, 255, 255, 255]);
  const foilMaskMap = loadMap(spec.bundlePaths.foilIntensityMask, false, [128, 128, 128, 255]);
  const borderMaskMap = loadMap(spec.bundlePaths.borderZoneMask, false, [0, 0, 0, 255]);
  const packedControlMap = loadMap(spec.bundlePaths.packedControlMap, false, [255, 128, 0, 255]);

  return {
    spec,
    baseColorMap,
    masterAlphaMap,
    foilMaskMap,
    borderMaskMap,
    packedControlMap,
    dispose() {
      baseColorMap.dispose();
      masterAlphaMap.dispose();
      foilMaskMap.dispose();
      borderMaskMap.dispose();
      packedControlMap.dispose();
    },
  };
}

// ============================================================================
// 3. Holographic Sticker Shader Material (Ticket-004, Ticket-005)
// ============================================================================

const STICKER_VERTEX_SHADER = /* glsl */ `
varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vViewPosition;
varying vec3 vWorldPosition;
varying vec3 vTangent;
varying vec3 vBitangent;

attribute vec4 tangent;

void main() {
  vUv = uv;
  vec4 worldPosition = modelMatrix * vec4(position, 1.0);
  vWorldPosition = worldPosition.xyz;

  vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
  vViewPosition = -mvPosition.xyz;

  vNormal = normalize(normalMatrix * normal);

  // Compute tangent & bitangent in world space
  vec3 objectTangent = tangent.xyz;
  if (length(objectTangent) < 0.001) {
    objectTangent = vec3(1.0, 0.0, 0.0);
  }
  vTangent = normalize(mat3(modelMatrix) * objectTangent);
  vBitangent = normalize(cross(mat3(modelMatrix) * normal, vTangent) * (tangent.w != 0.0 ? tangent.w : 1.0));

  gl_Position = projectionMatrix * mvPosition;
}
`;

const STICKER_FRAGMENT_SHADER = /* glsl */ `
uniform sampler2D uBaseColorMap;
uniform sampler2D uMasterAlphaMap;
uniform sampler2D uFoilMaskMap;
uniform sampler2D uBorderMaskMap;
uniform sampler2D uPackedControlMap;
uniform float uUsePackedControl;

uniform float uTime;
uniform float uHoloIntensity;
uniform float uFoilSubstrateMetallic;
uniform float uSpectralFrequency;
uniform float uSpectralSpread;
uniform float uSpectralPhaseOffset;
uniform float uMicroTextureScale;
uniform float uSparkleSharpness;
uniform float uSparkleDensity;
uniform float uInkOpacityBoost;
uniform float uHeadOnLegibilityGuard;
uniform int uBorderMode;
uniform vec3 uBorderTint;
uniform float uPearlFresnelPower;
uniform float uPearlIridescenceStrength;
uniform float uVinylRoughness;
uniform float uClearcoatStrength;
uniform float uClearcoatFresnelBias;
uniform float uIdleShimmerEnabled;
uniform float uIdleShimmerSpeed;
uniform float uIdleShimmerAmplitude;
uniform vec3 uPrimaryLightDir;
uniform vec3 uCameraWorldPos;
uniform int uPlacementModeCode;

varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vViewPosition;
varying vec3 vWorldPosition;
varying vec3 vTangent;
varying vec3 vBitangent;

void main() {
  // Sample textures
  vec4 baseSample = texture2D(uBaseColorMap, vUv);
  vec3 baseColorRGB = baseSample.rgb;

  float masterAlpha = 0.0;
  float foilMask = 0.0;
  float borderMask = 0.0;

  if (uUsePackedControl > 0.5) {
    vec4 packed = texture2D(uPackedControlMap, vUv);
    masterAlpha = packed.r;
    foilMask = packed.g;
    borderMask = packed.b;
  } else {
    masterAlpha = texture2D(uMasterAlphaMap, vUv).r;
    foilMask = texture2D(uFoilMaskMap, vUv).r;
    borderMask = texture2D(uBorderMaskMap, vUv).r;
  }

  // Alpha test for clean cutout boundary (§4.3)
  if (masterAlpha < 0.005) {
    discard;
  }

  // Direction vectors
  vec3 N = normalize(vNormal);
  if (!gl_FrontFacing) {
    N = -N;
  }
  vec3 V = normalize(uCameraWorldPos - vWorldPosition);
  vec3 L = normalize(uPrimaryLightDir);
  vec3 H = normalize(V + L);
  vec3 T = normalize(vTangent);
  vec3 B = normalize(vBitangent);

  float ndotv = clamp(dot(N, V), 0.0, 1.0);
  float ndoth = clamp(dot(N, H), 0.0, 1.0);

  // Layer 1: Metallic Foil Substrate
  float metallicLuma = (0.32 + 0.68 * pow(ndoth, 6.0)) * uFoilSubstrateMetallic;
  vec3 foilSubstrateColor = vec3(metallicLuma);

  // Layer 2: Iridescent Diffraction Layer
  float tangentShift = dot(V - L, T) * 0.65 + dot(V, B) * 0.35;
  float idleWave = (uIdleShimmerEnabled > 0.5)
    ? sin(uTime * uIdleShimmerSpeed + vUv.x * 5.0 + vUv.y * 3.5) * uIdleShimmerAmplitude
    : 0.0;

  float spectralPhase = (1.0 - ndotv) * uSpectralFrequency * uSpectralSpread + tangentShift * uSpectralFrequency + (vUv.x * 0.8 + vUv.y * 0.6) * uSpectralSpread + uSpectralPhaseOffset + idleWave;
  vec3 rainbowRGB = 0.5 + 0.5 * cos(6.2831853 * (spectralPhase + vec3(0.0, 0.333333, 0.666667)));

  // Layer 3: Foil Micro-Texture Grating
  vec2 microUv = vUv * uMicroTextureScale;
  vec2 cellId = floor(microUv);
  vec2 cellUv = fract(microUv) - 0.5;
  float cellAngle = sin(dot(cellId, vec2(127.1, 311.7))) * 43758.5453;
  float cCos = cos(cellAngle);
  float cSin = sin(cellAngle);
  vec2 rotCell = vec2(cellUv.x * cCos - cellUv.y * cSin, cellUv.x * cSin + cellUv.y * cCos);
  float microFacetDist = max(abs(rotCell.x) + abs(rotCell.y) * 0.866, abs(rotCell.y));
  float microGratingPattern = 0.5 + 0.5 * cos(microFacetDist * 18.0 + cellAngle);

  vec3 facetDelta = (T * rotCell.x + B * rotCell.y) * 0.35;
  vec3 pN = normalize(N + facetDelta);
  float pertH = clamp(dot(pN, H), 0.0, 1.0);
  float sparkle = pow(pertH, uSparkleSharpness) * uSparkleDensity;

  vec3 rawHoloFoilRGB = mix(foilSubstrateColor, rainbowRGB, 0.78) * (0.65 + 0.55 * microGratingPattern) + rainbowRGB * sparkle * 0.85;

  // Layer 4: Printed CMYK Ink Layer & Border Zone Compositing
  float obliqueFactor = 1.0 - pow(ndotv, 1.5);
  float baseLuma = dot(baseColorRGB, vec3(0.2126, 0.7152, 0.0722));
  float effectiveSubjectFoil = clamp(
    foilMask * uHoloIntensity * (1.0 - 0.55 * uHeadOnLegibilityGuard * (1.0 - obliqueFactor)) * (1.0 - 0.35 * uInkOpacityBoost * (1.0 - baseLuma)),
    0.0,
    1.0
  );

  vec3 subjectInkRGB = mix(baseColorRGB, baseColorRGB * 0.35 + rawHoloFoilRGB * 0.95, effectiveSubjectFoil);

  // Border zone visual modes
  vec3 borderRGB = uBorderTint;
  if (uBorderMode == 1) { // exposed_holo_rim
    borderRGB = rawHoloFoilRGB * uBorderTint;
  } else if (uBorderMode == 2) { // iridescent_pearl
    float pearlGrazing = pow(1.0 - ndotv, uPearlFresnelPower);
    vec3 pastelPearl = mix(vec3(1.0), rainbowRGB, 0.48);
    float blendWeight = clamp(pearlGrazing * uPearlIridescenceStrength, 0.0, 0.92);
    borderRGB = mix(uBorderTint, pastelPearl * (0.85 + 0.25 * rawHoloFoilRGB), blendWeight);
  }

  vec3 layer4CompositeRGB = mix(subjectInkRGB, borderRGB, clamp(borderMask, 0.0, 1.0));

  // Layer 5: Glossy Vinyl Topcoat / Clearcoat
  float alphaRough = max(0.02, uVinylRoughness * uVinylRoughness);
  float specPower = clamp(2.0 / (alphaRough * alphaRough) - 2.0, 8.0, 512.0);
  float fresnelClearcoat = uClearcoatFresnelBias + (1.0 - uClearcoatFresnelBias) * pow(1.0 - ndotv, 5.0);
  float clearcoatSpec = pow(ndoth, specPower) * fresnelClearcoat * uClearcoatStrength;

  vec3 finalRGB = clamp(layer4CompositeRGB + vec3(clearcoatSpec), 0.0, 1.0);

  gl_FragColor = vec4(finalRGB, masterAlpha);
}
`;

export function createHolographicStickerShaderMaterial(bundleTextures, params = {}) {
  const p = { ...STICKER_DEFAULT_MATERIAL_PARAMS, ...params };
  const borderModeCode = STICKER_BORDER_MODES[p.borderMode] ? STICKER_BORDER_MODES[p.borderMode].code : 0;
  const borderTint = new THREE.Color(p.borderTintHex || '#ffffff');
  const placementCode = p.placementMode === 'floating' ? 1 : 0;

  const uniforms = {
    uBaseColorMap: { value: bundleTextures.baseColorMap },
    uMasterAlphaMap: { value: bundleTextures.masterAlphaMap },
    uFoilMaskMap: { value: bundleTextures.foilMaskMap },
    uBorderMaskMap: { value: bundleTextures.borderMaskMap },
    uPackedControlMap: { value: bundleTextures.packedControlMap },
    uUsePackedControl: { value: p.usePackedControl ? 1.0 : 0.0 },
    uTime: { value: p.uTimeUniform ? p.uTimeUniform.value : 0.0 },
    uHoloIntensity: { value: p.holoIntensity },
    uFoilSubstrateMetallic: { value: p.foilSubstrateMetallic },
    uSpectralFrequency: { value: p.spectralFrequency },
    uSpectralSpread: { value: p.spectralSpread },
    uSpectralPhaseOffset: { value: p.spectralPhaseOffset },
    uMicroTextureScale: { value: p.microTextureScale },
    uSparkleSharpness: { value: p.sparkleSharpness },
    uSparkleDensity: { value: p.sparkleDensity },
    uInkOpacityBoost: { value: p.inkOpacityBoost },
    uHeadOnLegibilityGuard: { value: p.headOnLegibilityGuard },
    uBorderMode: { value: borderModeCode },
    uBorderTint: { value: borderTint },
    uPearlFresnelPower: { value: p.pearlFresnelPower },
    uPearlIridescenceStrength: { value: p.pearlIridescenceStrength },
    uVinylRoughness: { value: p.vinylRoughness },
    uClearcoatStrength: { value: p.clearcoatStrength },
    uClearcoatFresnelBias: { value: p.clearcoatFresnelBias },
    uIdleShimmerEnabled: { value: p.idleShimmerEnabled ? 1.0 : 0.0 },
    uIdleShimmerSpeed: { value: p.idleShimmerSpeed },
    uIdleShimmerAmplitude: { value: p.idleShimmerAmplitude },
    uPrimaryLightDir: { value: new THREE.Vector3(0.4, 0.8, 0.4).normalize() },
    uCameraWorldPos: { value: new THREE.Vector3(0, 1.6, 3.0) },
    uPlacementModeCode: { value: placementCode },
  };

  const material = new THREE.ShaderMaterial({
    uniforms,
    vertexShader: STICKER_VERTEX_SHADER,
    fragmentShader: STICKER_FRAGMENT_SHADER,
    transparent: true,
    alphaTest: 0.005,
    depthTest: true,
    side: THREE.DoubleSide,
  });

  return material;
}

// ============================================================================
// 4. Holographic Sticker Instance (Ticket-005, Ticket-006)
// ============================================================================

export function createHolographicStickerInstance(assetIdOrSpec, options = {}) {
  const spec = typeof assetIdOrSpec === 'string' || typeof assetIdOrSpec === 'number'
    ? resolveStickerAssetSpec(assetIdOrSpec)
    : assetIdOrSpec;

  const floorY = options.floorY || 0.0;
  const geomSpec = computeStickerGeometrySpec(spec, options);
  const geometry = new THREE.PlaneGeometry(geomSpec.planeWidthMeters, geomSpec.planeHeightMeters, geomSpec.segmentsX, geomSpec.segmentsY);
  geometry.computeTangents();

  const textureController = createStickerTextureBundleController(spec, options);

  const initialParams = {
    ...STICKER_DEFAULT_MATERIAL_PARAMS,
    ...spec.defaultStage2Config,
    ...options.params,
    uTimeUniform: options.uTimeUniform,
  };

  const material = createHolographicStickerShaderMaterial(textureController, initialParams);
  if (typeof options.applyStencilReject === 'function') {
    options.applyStencilReject(material);
  }
  const mesh = new THREE.Mesh(geometry, material);
  mesh.name = `HoloStickerMesh_${spec.id}`;
  mesh.castShadow = false;
  mesh.receiveShadow = false;

  const group = new THREE.Group();
  group.name = `HoloStickerGroup_${spec.id}`;
  group.add(mesh);

  let currentPlacementMode = initialParams.defaultPlacementMode || 'decal';
  let currentBorderMode = initialParams.borderMode || 'opaque_vinyl';
  let currentBorderTintHex = initialParams.borderTintHex || '#ffffff';
  let currentParams = { ...initialParams };

  // Stationary & angular motion tracking
  const lastCameraPos = new THREE.Vector3();
  const lastMeshRot = new THREE.Euler();
  const lastLightDir = new THREE.Vector3(0.4, 0.8, 0.4).normalize();
  let hasInitialPoseSample = false;
  let stationaryTimer = 0.2;
  let isStationary = true;
  let angularVelocity = 0.0;
  let idleShimmerActive = Boolean(currentParams.idleShimmerEnabled);

  function applyPlacement(mode) {
    if (!STICKER_PLACEMENT_MODES.includes(mode)) {
      throw new Error(`applyPlacement: Invalid sticker placement mode '${mode}' (INV-FAILFAST-01).`);
    }
    currentPlacementMode = mode;
    material.uniforms.uPlacementModeCode.value = mode === 'floating' ? 1 : 0;

    if (mode === 'decal') {
      const dp = spec.defaultStage2Config.decalPlacement;
      group.position.set(dp.x, floorY + dp.yRel, dp.z);
      group.rotation.set(0, dp.yawRad, 0);

      material.polygonOffset = true;
      material.polygonOffsetFactor = -4;
      material.polygonOffsetUnits = -4;
      material.depthWrite = false;
      mesh.renderOrder = 12;
    } else {
      const fp = spec.defaultStage2Config.floatingPlacement;
      group.position.set(fp.x, floorY + fp.yRel, fp.z);
      group.rotation.set(fp.pitchRad, fp.yawRad, fp.rollRad);

      material.polygonOffset = false;
      material.depthWrite = true;
      mesh.renderOrder = 13;
    }
  }

  function setBorderMode(mode, tintHex = null) {
    if (!STICKER_BORDER_MODES[mode]) {
      throw new Error(`setBorderMode: Invalid sticker border mode '${mode}' (INV-FAILFAST-01).`);
    }
    currentBorderMode = mode;
    material.uniforms.uBorderMode.value = STICKER_BORDER_MODES[mode].code;
    if (tintHex) {
      currentBorderTintHex = tintHex;
      material.uniforms.uBorderTint.value.set(tintHex);
    }
  }

  function setPlacementMode(mode) {
    applyPlacement(mode);
  }

  function setMaterialParams(partialParams) {
    if (!partialParams) return;
    Object.assign(currentParams, partialParams);

    if (partialParams.holoIntensity !== undefined) material.uniforms.uHoloIntensity.value = partialParams.holoIntensity;
    if (partialParams.foilSubstrateMetallic !== undefined) material.uniforms.uFoilSubstrateMetallic.value = partialParams.foilSubstrateMetallic;
    if (partialParams.spectralFrequency !== undefined) material.uniforms.uSpectralFrequency.value = partialParams.spectralFrequency;
    if (partialParams.spectralSpread !== undefined) material.uniforms.uSpectralSpread.value = partialParams.spectralSpread;
    if (partialParams.spectralPhaseOffset !== undefined) material.uniforms.uSpectralPhaseOffset.value = partialParams.spectralPhaseOffset;
    if (partialParams.microTextureScale !== undefined) material.uniforms.uMicroTextureScale.value = partialParams.microTextureScale;
    if (partialParams.sparkleSharpness !== undefined) material.uniforms.uSparkleSharpness.value = partialParams.sparkleSharpness;
    if (partialParams.sparkleDensity !== undefined) material.uniforms.uSparkleDensity.value = partialParams.sparkleDensity;
    if (partialParams.inkOpacityBoost !== undefined) material.uniforms.uInkOpacityBoost.value = partialParams.inkOpacityBoost;
    if (partialParams.headOnLegibilityGuard !== undefined) material.uniforms.uHeadOnLegibilityGuard.value = partialParams.headOnLegibilityGuard;
    if (partialParams.pearlFresnelPower !== undefined) material.uniforms.uPearlFresnelPower.value = partialParams.pearlFresnelPower;
    if (partialParams.pearlIridescenceStrength !== undefined) material.uniforms.uPearlIridescenceStrength.value = partialParams.pearlIridescenceStrength;
    if (partialParams.vinylRoughness !== undefined) material.uniforms.uVinylRoughness.value = partialParams.vinylRoughness;
    if (partialParams.clearcoatStrength !== undefined) material.uniforms.uClearcoatStrength.value = partialParams.clearcoatStrength;
    if (partialParams.clearcoatFresnelBias !== undefined) material.uniforms.uClearcoatFresnelBias.value = partialParams.clearcoatFresnelBias;
    if (partialParams.idleShimmerEnabled !== undefined) material.uniforms.uIdleShimmerEnabled.value = partialParams.idleShimmerEnabled ? 1.0 : 0.0;
    if (partialParams.idleShimmerSpeed !== undefined) material.uniforms.uIdleShimmerSpeed.value = partialParams.idleShimmerSpeed;
    if (partialParams.idleShimmerAmplitude !== undefined) material.uniforms.uIdleShimmerAmplitude.value = partialParams.idleShimmerAmplitude;
    if (partialParams.borderMode) setBorderMode(partialParams.borderMode, partialParams.borderTintHex);
    if (partialParams.placementMode) setPlacementMode(partialParams.placementMode);
  }

  function setStickerTransform(transformSpec) {
    if (!transformSpec) return;
    if (transformSpec.position) {
      group.position.copy(transformSpec.position);
    }
    if (transformSpec.quaternion) {
      group.quaternion.copy(transformSpec.quaternion);
    } else if (transformSpec.rotation) {
      group.rotation.copy(transformSpec.rotation);
    }
    if (transformSpec.tiltPitchRad !== undefined) {
      group.rotation.x = transformSpec.tiltPitchRad;
    }
    if (transformSpec.tiltYawRad !== undefined) {
      group.rotation.y = transformSpec.tiltYawRad;
    }
    if (transformSpec.scale !== undefined) {
      const s = Number(transformSpec.scale) || 1.0;
      group.scale.set(s, s, 1.0);
    }
  }

  function update(dt, elapsedTime, camera, lightDir = null) {
    material.uniforms.uTime.value = elapsedTime;

    let dCam = 0.0;
    if (camera && camera.position) {
      material.uniforms.uCameraWorldPos.value.copy(camera.position);
      if (hasInitialPoseSample) {
        dCam = camera.position.distanceTo(lastCameraPos);
      }
      lastCameraPos.copy(camera.position);
    }

    const dRot = hasInitialPoseSample
      ? Math.abs(group.rotation.x - lastMeshRot.x) +
        Math.abs(group.rotation.y - lastMeshRot.y) +
        Math.abs(group.rotation.z - lastMeshRot.z)
      : 0.0;
    lastMeshRot.copy(group.rotation);

    let dLight = 0.0;
    if (lightDir && typeof lightDir.x === 'number' && typeof lightDir.y === 'number' && typeof lightDir.z === 'number') {
      material.uniforms.uPrimaryLightDir.value.set(lightDir.x, lightDir.y, lightDir.z).normalize();
      if (hasInitialPoseSample) {
        dLight = material.uniforms.uPrimaryLightDir.value.distanceTo(lastLightDir);
      }
      lastLightDir.copy(material.uniforms.uPrimaryLightDir.value);
    }

    hasInitialPoseSample = true;
    angularVelocity = dCam + dRot + dLight;

    if (angularVelocity < 1e-4) {
      stationaryTimer += Math.max(0.0, Number(dt) || 0.0);
      isStationary = stationaryTimer >= 0.15;
    } else {
      stationaryTimer = 0.0;
      isStationary = false;
    }

    const idleEval = evaluateStickerIdleShimmer(isStationary, stationaryTimer, elapsedTime, currentParams);
    idleShimmerActive = idleEval.active;
  }

  function getTelemetry() {
    return {
      id: spec.id,
      code: spec.code,
      borderMode: currentBorderMode,
      borderTintHex: currentBorderTintHex,
      placementMode: currentPlacementMode,
      croppedAspectRatio: geomSpec.croppedAspectRatio,
      planeWidthMeters: geomSpec.planeWidthMeters,
      planeHeightMeters: geomSpec.planeHeightMeters,
      position: { x: group.position.x, y: group.position.y, z: group.position.z },
      rotation: { x: group.rotation.x, y: group.rotation.y, z: group.rotation.z },
      angularVelocity,
      isStationary,
      stationaryDurationSec: stationaryTimer,
      idleShimmerActive,
      holoIntensity: material.uniforms.uHoloIntensity.value,
      spectralFrequency: material.uniforms.uSpectralFrequency.value,
    };
  }

  function dispose() {
    geometry.dispose();
    material.dispose();
    textureController.dispose();
    if (group.parent) {
      group.parent.remove(group);
    }
  }

  // Initialize placement
  applyPlacement(currentPlacementMode);

  return {
    spec,
    geomSpec,
    geometrySpec: geomSpec,
    group,
    rootGroup: group,
    mesh,
    material,
    geometry,
    textureController,
    setBorderMode,
    setPlacementMode,
    setMaterialParams,
    setStickerTransform,
    update,
    getTelemetry,
    dispose,
  };
}

// ============================================================================
// 5. Aligned Interior/Exterior Wall & Floor Bounding Surfaces + Surface Math (Spec 047 & Spec 048)
// ============================================================================

export const STICKER_DEFAULT_SIZE_BOUNDS = Object.freeze({
  minSize: 0.25,
  maxSize: 1.0,
  defaultSize: 0.65,
  absMinLimit: 0.25,
  absMaxLimit: 1.0,
  normalOffsetMeters: 0.022,
  minSurfaceClearanceMeters: 0.022,
});

export function normalizeStickerSizeBounds(_minSize, _maxSize) {
  return {
    minSize: STICKER_DEFAULT_SIZE_BOUNDS.minSize,
    maxSize: STICKER_DEFAULT_SIZE_BOUNDS.maxSize,
  };
}

export function clampStickerSize(size, minSize = STICKER_DEFAULT_SIZE_BOUNDS.minSize, maxSize = STICKER_DEFAULT_SIZE_BOUNDS.maxSize) {
  const bounds = normalizeStickerSizeBounds(minSize, maxSize);
  const raw = Number.isFinite(Number(size)) ? Number(size) : STICKER_DEFAULT_SIZE_BOUNDS.defaultSize;
  return Number(Math.max(bounds.minSize, Math.min(bounds.maxSize, raw)).toFixed(4));
}

export function normalizeStickerRotationRad(rad) {
  let r = Number.isFinite(Number(rad)) ? Number(rad) : 0.0;
  while (r > Math.PI) r -= Math.PI * 2.0;
  while (r < -Math.PI) r += Math.PI * 2.0;
  return Number(r.toFixed(4));
}

export const CALIBRATED_LEFT_WALL_KNOTS = Object.freeze([
  [0.0, -1.58],
  [4.0, -1.73],
  [8.0, -1.89],
  [12.0, -2.04],
  [16.0, -2.19],
  [20.0, -2.34],
  [24.0, -2.49],
  [25.8, -2.53],
  [26.5, -1.78],
  [28.0, -1.75],
  [32.0, -1.65],
  [36.0, -1.64],
  [40.0, -1.53],
  [42.5, -1.47],
  [58.0, -1.68],
  [71.2, -1.50],
]);

export const CALIBRATED_RIGHT_WALL_KNOTS = Object.freeze([
  [0.0, 2.23],
  [4.0, 2.13],
  [8.0, 2.04],
  [12.0, 1.94],
  [16.0, 1.81],
  [20.0, 1.76],
  [24.0, 1.65],
  [28.0, 1.57],
  [30.0, 1.48],
  [34.0, 1.47],
  [38.0, 1.48],
  [40.0, 1.56],
  [42.5, 1.77],
  [43.8, 1.87],
  [44.0, 3.45],
  [60.75, 3.05],
  [62.25, 5.40],
  [65.75, 2.80],
  [71.2, 2.50],
]);

export const CALIBRATED_EXTERIOR_LEFT_Z_KNOTS = Object.freeze([
  [-9.40, -0.86],
  [-4.00, -0.66],
  [-1.58, -0.55],
]);

export const CALIBRATED_EXTERIOR_RIGHT_Z_KNOTS = Object.freeze([
  [2.23, -0.45],
  [6.90, -0.37],
  [10.20, -0.17],
]);

export const CALIBRATED_FLOOR_CONTOUR_KNOTS = Object.freeze([
  [-10.5, 0.380],
  [-8.0, 0.362],
  [-6.0, 0.185],
  [-4.0, 0.231],
  [-2.0, 0.221],
  [0.0, 0.230],
  [2.0, 0.234],
  [4.0, 0.191],
  [6.0, 0.150],
  [8.0, 0.124],
  [10.0, 0.108],
  [12.0, 0.075],
  [14.0, 0.049],
  [16.0, 0.017],
  [18.0, 0.010],
  [20.0, -0.035],
  [22.0, -0.062],
  [24.0, -0.086],
  [26.0, -0.095],
  [28.0, -0.054],
  [30.0, -0.038],
  [32.0, 0.003],
  [34.0, 0.026],
  [36.0, 0.045],
  [38.0, 0.067],
  [40.0, 0.053],
  [42.5, 0.040],
  [44.0, 0.040],
  [71.2, 0.020],
]);

function evaluatePiecewiseLinearKnots(knots, s) {
  const sv = Number(s) || 0.0;
  if (sv <= knots[0][0]) return knots[0][1];
  const lastIdx = knots.length - 1;
  if (sv >= knots[lastIdx][0]) return knots[lastIdx][1];
  for (let i = 0; i < lastIdx; i++) {
    const s0 = knots[i][0];
    const s1 = knots[i + 1][0];
    if (sv >= s0 && sv <= s1) {
      const span = s1 - s0;
      if (span <= 1e-9) return knots[i + 1][1];
      const t = (sv - s0) / span;
      return knots[i][1] + (knots[i + 1][1] - knots[i][1]) * t;
    }
  }
  return knots[lastIdx][1];
}

/**
 * Evaluates the calibrated Freeman Alley wall X profile for Left ('L') and Right ('R') interior walls (Spec 048 §4.1).
 */
export function resolveStickerWallProfileX(side, z) {
  const isLeft = side === 'left' || side === 'L';
  const knots = isLeft ? CALIBRATED_LEFT_WALL_KNOTS : CALIBRATED_RIGHT_WALL_KNOTS;
  return Number(evaluatePiecewiseLinearKnots(knots, z).toFixed(4));
}

/**
 * Evaluates the calibrated Exterior Street Facade Z profile for Left ('L') and Right ('R') building facades (Spec 048 §4.1).
 */
export function resolveStickerExteriorWallProfileZ(side, x) {
  const isLeft = side === 'left' || side === 'L';
  const knots = isLeft ? CALIBRATED_EXTERIOR_LEFT_Z_KNOTS : CALIBRATED_EXTERIOR_RIGHT_Z_KNOTS;
  return Number(evaluatePiecewiseLinearKnots(knots, x).toFixed(4));
}

/**
 * Evaluates the calibrated upper-envelope floor elevation Y across both the exterior street/sidewalk (Z in [-10.5m, 0.0m])
 * and the interior alleyway corridor (Z in [0.0m, 71.2m]) (Spec 048 §4.2).
 */
export function resolveStickerFloorContourY(z) {
  return Number(evaluatePiecewiseLinearKnots(CALIBRATED_FLOOR_CONTOUR_KNOTS, z).toFixed(4));
}

/**
 * Computes an orthonormal tangent basis [T(theta), U(theta), N] and quaternion for a sticker mounted
 * on a surface with outward unit normal N, rotated in-plane by `rotationRad` around N.
 */
export function computeStickerSurfaceBasis(normalInput, rotationRad = 0.0) {
  const nxRaw = normalInput?.x ?? (Array.isArray(normalInput) ? normalInput[0] : 0.0);
  const nyRaw = normalInput?.y ?? (Array.isArray(normalInput) ? normalInput[1] : 0.0);
  const nzRaw = normalInput?.z ?? (Array.isArray(normalInput) ? normalInput[2] : 1.0);
  const len = Math.hypot(nxRaw, nyRaw, nzRaw) || 1.0;
  const N = new THREE.Vector3(nxRaw / len, nyRaw / len, nzRaw / len);

  const worldUp = new THREE.Vector3(0, 1, 0);
  const U0 = new THREE.Vector3();
  const T0 = new THREE.Vector3();

  if (Math.abs(N.y) < 0.85) {
    // Wall surface: project world +Y onto the wall tangent plane so rotationRad = 0 is upright
    U0.copy(worldUp).addScaledVector(N, -worldUp.dot(N)).normalize();
    T0.crossVectors(U0, N).normalize();
  } else {
    // Floor / horizontal surface: align U0 along +Z so sticker faces reader looking into alley (+Z)
    const refForward = new THREE.Vector3(0, 0, N.y >= 0 ? 1 : -1);
    U0.copy(refForward).addScaledVector(N, -refForward.dot(N)).normalize();
    T0.crossVectors(U0, N).normalize();
  }

  const theta = normalizeStickerRotationRad(rotationRad);
  const cosT = Math.cos(theta);
  const sinT = Math.sin(theta);

  // Rotate (T0, U0) in the tangent plane around N
  const T = new THREE.Vector3()
    .addScaledVector(T0, cosT)
    .addScaledVector(U0, sinT)
    .normalize();
  const U = new THREE.Vector3()
    .addScaledVector(T0, -sinT)
    .addScaledVector(U0, cosT)
    .normalize();

  const rotMatrix = new THREE.Matrix4().makeBasis(T, U, N);
  const quaternion = new THREE.Quaternion().setFromRotationMatrix(rotMatrix);
  const euler = new THREE.Euler().setFromQuaternion(quaternion, 'YXZ');

  return {
    normal: N,
    tangentRight: T,
    tangentUp: U,
    rotationRad: theta,
    quaternion,
    euler,
  };
}

/**
 * Builds a quad strip mesh from ordered bottom/top vertex pairs with explicit outward normals.
 */
function createQuadStripColliderMesh(name, surfaceZone, segments, material) {
  const positions = [];
  const normals = [];
  const uvs = [];
  const indices = [];
  let vertCursor = 0;
  const edgeA = new THREE.Vector3();
  const edgeB = new THREE.Vector3();
  const faceCross = new THREE.Vector3();

  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i];
    // Each seg has p00 (start bottom), p10 (end bottom), p11 (end top), p01 (start top), and outward normal n
    const { p00, p10, p11, p01, normal } = seg;
    positions.push(
      p00.x, p00.y, p00.z,
      p10.x, p10.y, p10.z,
      p11.x, p11.y, p11.z,
      p01.x, p01.y, p01.z
    );
    for (let k = 0; k < 4; k++) {
      normals.push(normal.x, normal.y, normal.z);
    }
    uvs.push(0, 0, 1, 0, 1, 1, 0, 1);
    // Ensure triangle winding matches explicit outward normal
    edgeA.subVectors(p10, p00);
    edgeB.subVectors(p11, p00);
    faceCross.crossVectors(edgeA, edgeB);
    if (faceCross.dot(normal) >= 0) {
      indices.push(
        vertCursor, vertCursor + 1, vertCursor + 2,
        vertCursor, vertCursor + 2, vertCursor + 3
      );
    } else {
      indices.push(
        vertCursor, vertCursor + 2, vertCursor + 1,
        vertCursor, vertCursor + 3, vertCursor + 2
      );
    }
    vertCursor += 4;
  }

  const geom = new THREE.BufferGeometry();
  geom.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geom.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
  geom.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geom.setIndex(indices);
  geom.computeBoundingBox();
  geom.computeBoundingSphere();

  const mesh = new THREE.Mesh(geom, material);
  mesh.name = name;
  mesh.userData.isStickerBoundingSurface = true;
  mesh.userData.surfaceZone = surfaceZone;
  mesh.userData.colliderName = name;
  return mesh;
}

/**
 * Constructs calibrated interior & exterior wall and floor bounding surfaces (Spec 047 §5.3 & Spec 048 §4–§5)
 * covering:
 *  - Left Interior Alley Wall (Z in [0, 71.2m])
 *  - Right Interior Alley Wall (Z in [0, 71.2m], including alcoves)
 *  - Exterior Left Return & Street Facade Walls right outside the alleyway (Z in [-8.5m, 0m], X in [-9.4m, -1.58m])
 *  - Exterior Right Return & Street Facade Walls right outside the alleyway (Z in [-8.5m, 0m], X in [2.23m, 10.2m])
 *  - Interior Alley End Boundary (Z = 71.2m)
 *  - Contoured Upper-Envelope Interior & Exterior Floor (Z in [-10.5m, 71.2m])
 */
export function buildStickerBoundingSurfaces(options = {}) {
  const group = new THREE.Group();
  group.name = 'StickerBoundingSurfacesGroup';
  const wallTopY = Number(options.wallTopY) || 6.80;

  const surfaceMat = new THREE.MeshBasicMaterial({
    color: 0x00d5ff,
    wireframe: true,
    transparent: true,
    opacity: options.debugVisible ? 0.22 : 0.0,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
  surfaceMat.visible = Boolean(options.debugVisible);

  // 1. Left Interior Alley Wall (Z = 0.0 -> 71.2m, outward normal pointing +X into corridor)
  const leftWallSegs = [];
  for (let i = 0; i < CALIBRATED_LEFT_WALL_KNOTS.length - 1; i++) {
    const z0 = CALIBRATED_LEFT_WALL_KNOTS[i][0];
    const x0 = CALIBRATED_LEFT_WALL_KNOTS[i][1];
    const z1 = CALIBRATED_LEFT_WALL_KNOTS[i + 1][0];
    const x1 = CALIBRATED_LEFT_WALL_KNOTS[i + 1][1];
    const y0 = resolveStickerFloorContourY(z0) - 0.08;
    const y1 = resolveStickerFloorContourY(z1) - 0.08;
    const dx = x1 - x0;
    const dz = z1 - z0;
    // Outward plumb normal into corridor (+X, Ny = 0)
    const n = new THREE.Vector3(dz, 0, -dx).normalize();
    if (n.x < 0) n.negate();
    n.y = 0.0;
    n.normalize();
    leftWallSegs.push({
      p00: new THREE.Vector3(x0, y0, z0),
      p10: new THREE.Vector3(x1, y1, z1),
      p11: new THREE.Vector3(x1, wallTopY, z1),
      p01: new THREE.Vector3(x0, wallTopY, z0),
      normal: n,
    });
  }
  const meshWallL = createQuadStripColliderMesh('COLLIDER_STICKER_WALL_L', 'alley_wall_left', leftWallSegs, surfaceMat);

  // 2. Right Interior Alley Wall (Z = 0.0 -> 71.2m, outward normal pointing -X into corridor)
  const rightWallSegs = [];
  for (let i = 0; i < CALIBRATED_RIGHT_WALL_KNOTS.length - 1; i++) {
    const z0 = CALIBRATED_RIGHT_WALL_KNOTS[i][0];
    const x0 = CALIBRATED_RIGHT_WALL_KNOTS[i][1];
    const z1 = CALIBRATED_RIGHT_WALL_KNOTS[i + 1][0];
    const x1 = CALIBRATED_RIGHT_WALL_KNOTS[i + 1][1];
    const y0 = resolveStickerFloorContourY(z0) - 0.08;
    const y1 = resolveStickerFloorContourY(z1) - 0.08;
    const dx = pB_dx(x0, x1);
    const dz = z1 - z0;
    // Outward plumb normal pointing toward corridor (-X, Ny = 0)
    const n = new THREE.Vector3(-dz, 0, dx).normalize();
    if (n.x > 0 && Math.abs(n.x) > Math.abs(n.z)) n.negate();
    n.y = 0.0;
    n.normalize();
    rightWallSegs.push({
      p00: new THREE.Vector3(x0, y0, z0),
      p10: new THREE.Vector3(x1, y1, z1),
      p11: new THREE.Vector3(x1, wallTopY, z1),
      p01: new THREE.Vector3(x0, wallTopY, z0),
      normal: n,
    });
  }
  function pB_dx(a, b) {
    return b - a;
  }
  const meshWallR = createQuadStripColliderMesh('COLLIDER_STICKER_WALL_R', 'alley_wall_right', rightWallSegs, surfaceMat);

  // 3. Exterior Left Return & Street Facade Walls Right Outside the Alleyway (Z <= 0, Spec 048 §4.1)
  const nExtL1 = new THREE.Vector3(-0.55 - -0.66, 0, -(-1.58 - -4.00)).normalize();
  if (nExtL1.z > 0) nExtL1.negate();
  nExtL1.y = 0.0;
  nExtL1.normalize();

  const nExtL2 = new THREE.Vector3(-0.66 - -0.86, 0, -(-4.00 - -9.40)).normalize();
  if (nExtL2.z > 0) nExtL2.negate();
  nExtL2.y = 0.0;
  nExtL2.normalize();

  const extLeftSegs = [
    // Entrance threshold left return wall: X = -1.58m, Z in [-0.55m, 0.00m], facing +X (1, 0, 0)
    {
      p00: new THREE.Vector3(-1.58, -0.08, -0.55),
      p10: new THREE.Vector3(-1.58, -0.08, 0.00),
      p11: new THREE.Vector3(-1.58, wallTopY, 0.00),
      p01: new THREE.Vector3(-1.58, wallTopY, -0.55),
      normal: new THREE.Vector3(1, 0, 0),
    },
    // Street-facing left building facade inner span: X in [-4.00m, -1.58m], Z in [-0.66m, -0.55m], facing -Z
    {
      p00: new THREE.Vector3(-4.00, -0.08, -0.66),
      p10: new THREE.Vector3(-1.58, -0.08, -0.55),
      p11: new THREE.Vector3(-1.58, wallTopY, -0.55),
      p01: new THREE.Vector3(-4.00, wallTopY, -0.66),
      normal: nExtL1,
    },
    // Street-facing left building facade outer span: X in [-9.40m, -4.00m], Z in [-0.86m, -0.66m], facing -Z
    {
      p00: new THREE.Vector3(-9.40, -0.08, -0.86),
      p10: new THREE.Vector3(-4.00, -0.08, -0.66),
      p11: new THREE.Vector3(-4.00, wallTopY, -0.66),
      p01: new THREE.Vector3(-9.40, wallTopY, -0.86),
      normal: nExtL2,
    },
    // Outer Left Street Flank Wall at X = -9.40m, Z in [-8.50m, -0.86m], facing +X (1, 0, 0)
    {
      p00: new THREE.Vector3(-9.40, -0.08, -8.50),
      p10: new THREE.Vector3(-9.40, -0.08, -0.86),
      p11: new THREE.Vector3(-9.40, wallTopY, -0.86),
      p01: new THREE.Vector3(-9.40, wallTopY, -8.50),
      normal: new THREE.Vector3(1, 0, 0),
    },
  ];
  const meshExtL = createQuadStripColliderMesh('COLLIDER_STICKER_EXTERIOR_L', 'exterior_wall_left', extLeftSegs, surfaceMat);

  // 4. Exterior Right Return & Street Facade Walls Right Outside the Alleyway (Z <= 0, Spec 048 §4.1)
  const nExtR1 = new THREE.Vector3(-0.37 - -0.45, 0, -(6.90 - 2.23)).normalize();
  if (nExtR1.z > 0) nExtR1.negate();
  nExtR1.y = 0.0;
  nExtR1.normalize();

  const nExtR2 = new THREE.Vector3(-0.17 - -0.37, 0, -(10.20 - 6.90)).normalize();
  if (nExtR2.z > 0) nExtR2.negate();
  nExtR2.y = 0.0;
  nExtR2.normalize();

  const extRightSegs = [
    // Entrance threshold right return wall: X = +2.23m, Z in [-0.45m, 0.00m], facing -X (-1, 0, 0)
    {
      p00: new THREE.Vector3(2.23, -0.08, 0.00),
      p10: new THREE.Vector3(2.23, -0.08, -0.45),
      p11: new THREE.Vector3(2.23, wallTopY, -0.45),
      p01: new THREE.Vector3(2.23, wallTopY, 0.00),
      normal: new THREE.Vector3(-1, 0, 0),
    },
    // Street-facing right storefront inner span: X in [+2.23m, +6.90m], Z in [-0.45m, -0.37m], facing -Z
    {
      p00: new THREE.Vector3(2.23, -0.08, -0.45),
      p10: new THREE.Vector3(6.90, -0.08, -0.37),
      p11: new THREE.Vector3(6.90, wallTopY, -0.37),
      p01: new THREE.Vector3(2.23, wallTopY, -0.45),
      normal: nExtR1,
    },
    // Street-facing right storefront outer span: X in [+6.90m, +10.20m], Z in [-0.37m, -0.17m], facing -Z
    {
      p00: new THREE.Vector3(6.90, -0.08, -0.37),
      p10: new THREE.Vector3(10.20, -0.08, -0.17),
      p11: new THREE.Vector3(10.20, wallTopY, -0.17),
      p01: new THREE.Vector3(6.90, wallTopY, -0.37),
      normal: nExtR2,
    },
    // Outer Right Street Flank Wall at X = +10.20m, Z in [-8.50m, -0.17m], facing -X (-1, 0, 0)
    {
      p00: new THREE.Vector3(10.20, -0.08, -0.17),
      p10: new THREE.Vector3(10.20, -0.08, -8.50),
      p11: new THREE.Vector3(10.20, wallTopY, -8.50),
      p01: new THREE.Vector3(10.20, wallTopY, -0.17),
      normal: new THREE.Vector3(-1, 0, 0),
    },
  ];
  const meshExtR = createQuadStripColliderMesh('COLLIDER_STICKER_EXTERIOR_R', 'exterior_wall_right', extRightSegs, surfaceMat);

  // 5. Exterior Street Start Boundary (Z = -10.50m, non-raycastable so it never blocks street camera views) & Interior Alley End Wall (Z = 71.20m)
  const meshBoundStart = createQuadStripColliderMesh(
    'COLLIDER_STICKER_BOUND_START',
    'exterior_wall_start',
    [
      {
        p00: new THREE.Vector3(10.20, -0.08, -10.50),
        p10: new THREE.Vector3(-9.40, -0.08, -10.50),
        p11: new THREE.Vector3(-9.40, wallTopY, -10.50),
        p01: new THREE.Vector3(10.20, wallTopY, -10.50),
        normal: new THREE.Vector3(0, 0, 1),
      },
    ],
    surfaceMat
  );
  meshBoundStart.raycast = () => {};

  const meshBoundEnd = createQuadStripColliderMesh(
    'COLLIDER_STICKER_BOUND_END',
    'alley_wall_end',
    [
      {
        p00: new THREE.Vector3(-1.50, -0.08, 71.20),
        p10: new THREE.Vector3(2.50, -0.08, 71.20),
        p11: new THREE.Vector3(2.50, wallTopY, 71.20),
        p01: new THREE.Vector3(-1.50, wallTopY, 71.20),
        normal: new THREE.Vector3(0, 0, -1),
      },
    ],
    surfaceMat
  );

  // 6. Contoured Upper-Envelope Exterior & Interior Floor (Z in [-10.50m, 71.20m], Spec 048 §4.2)
  const floorZKnots = CALIBRATED_FLOOR_CONTOUR_KNOTS.map((k) => k[0]);
  const floorSegs = [];
  for (let i = 0; i < floorZKnots.length - 1; i++) {
    const z0 = floorZKnots[i];
    const z1 = floorZKnots[i + 1];
    const isExterior = z0 < 0.0 && z1 <= 0.0;
    const xL0 = isExterior ? -9.40 : resolveStickerWallProfileX('L', z0) - 0.08;
    const xR0 = isExterior ? 10.20 : Math.max(resolveStickerWallProfileX('R', z0), z0 >= 44.0 ? 5.45 : -Infinity) + 0.08;
    const xL1 = isExterior ? -9.40 : resolveStickerWallProfileX('L', z1) - 0.08;
    const xR1 = isExterior ? 10.20 : Math.max(resolveStickerWallProfileX('R', z1), z1 >= 44.0 ? 5.45 : -Infinity) + 0.08;
    const y0 = resolveStickerFloorContourY(z0);
    const y1 = resolveStickerFloorContourY(z1);
    const dy = y1 - y0;
    const dz = z1 - z0;
    const floorNormal = new THREE.Vector3(0, dz, -dy).normalize();
    if (floorNormal.y < 0) floorNormal.negate();
    floorNormal.x = 0.0;
    floorNormal.normalize();

    floorSegs.push({
      p00: new THREE.Vector3(xL0, y0, z0),
      p10: new THREE.Vector3(xR0, y0, z0),
      p11: new THREE.Vector3(xR1, y1, z1),
      p01: new THREE.Vector3(xL1, y1, z1),
      normal: floorNormal,
    });
  }
  const meshFloor = createQuadStripColliderMesh('COLLIDER_STICKER_FLOOR', 'floor', floorSegs, surfaceMat);

  const meshes = {
    COLLIDER_STICKER_WALL_L: meshWallL,
    COLLIDER_STICKER_WALL_R: meshWallR,
    COLLIDER_STICKER_EXTERIOR_L: meshExtL,
    COLLIDER_STICKER_EXTERIOR_R: meshExtR,
    COLLIDER_STICKER_BOUND_START: meshBoundStart,
    COLLIDER_STICKER_BOUND_END: meshBoundEnd,
    COLLIDER_STICKER_FLOOR: meshFloor,
  };
  // Exclude COLLIDER_STICKER_BOUND_START from raycastTargets so exterior camera rays are never blocked (Spec 048 §4.3)
  const raycastTargets = [
    meshWallL,
    meshWallR,
    meshExtL,
    meshExtR,
    meshBoundEnd,
    meshFloor,
  ];
  for (const m of Object.values(meshes)) {
    group.add(m);
  }
  group.updateMatrixWorld(true);

  // ============================================================================
  // 2D Visual Surface Relief Envelope Grids (Spec 048 §4.1–§4.4)
  // Built once in O(N) at initialization; queried in O(1) (9 lookups) at runtime.
  // ============================================================================
  const GRID_DZ = 0.25;
  const GRID_DY = 0.25;
  const GRID_DX = 0.25;

  const WALL_Z_MIN = 0.0;
  const WALL_Z_MAX = 71.5;
  const WALL_NZ = Math.floor((WALL_Z_MAX - WALL_Z_MIN) / GRID_DZ) + 1;
  const WALL_Y_MIN = 0.0;
  const WALL_Y_MAX = 7.0;
  const WALL_NY = Math.floor((WALL_Y_MAX - WALL_Y_MIN) / GRID_DY) + 1;

  const leftWallMaxX = new Float32Array(WALL_NZ * WALL_NY);
  const rightWallMinX = new Float32Array(WALL_NZ * WALL_NY);

  const EXT_L_X_MIN = -9.50;
  const EXT_L_X_MAX = -1.50;
  const EXT_L_NX = Math.floor((EXT_L_X_MAX - EXT_L_X_MIN) / GRID_DX) + 1;
  const extLeftMinZ = new Float32Array(EXT_L_NX * WALL_NY);

  const EXT_R_X_MIN = 2.00;
  const EXT_R_X_MAX = 10.50;
  const EXT_R_NX = Math.floor((EXT_R_X_MAX - EXT_R_X_MIN) / GRID_DX) + 1;
  const extRightMinZ = new Float32Array(EXT_R_NX * WALL_NY);

  const FLOOR_Z_MIN = -10.5;
  const FLOOR_Z_MAX = 71.5;
  const FLOOR_NZ = Math.floor((FLOOR_Z_MAX - FLOOR_Z_MIN) / GRID_DZ) + 1;
  const floorMaxY = new Float32Array(FLOOR_NZ);

  function resetReliefEnvelopeToAnalyticalBaseline() {
    for (let iz = 0; iz < WALL_NZ; iz++) {
      const z = WALL_Z_MIN + iz * GRID_DZ;
      const baseXL = resolveStickerWallProfileX('L', z);
      const baseXR = resolveStickerWallProfileX('R', z);
      for (let iy = 0; iy < WALL_NY; iy++) {
        const idx = iz * WALL_NY + iy;
        leftWallMaxX[idx] = baseXL;
        rightWallMinX[idx] = baseXR;
      }
    }
    for (let ix = 0; ix < EXT_L_NX; ix++) {
      const x = EXT_L_X_MIN + ix * GRID_DX;
      const baseZ = resolveStickerExteriorWallProfileZ('L', x);
      for (let iy = 0; iy < WALL_NY; iy++) {
        extLeftMinZ[ix * WALL_NY + iy] = baseZ;
      }
    }
    for (let ix = 0; ix < EXT_R_NX; ix++) {
      const x = EXT_R_X_MIN + ix * GRID_DX;
      const baseZ = resolveStickerExteriorWallProfileZ('R', x);
      for (let iy = 0; iy < WALL_NY; iy++) {
        extRightMinZ[ix * WALL_NY + iy] = baseZ;
      }
    }
    for (let iz = 0; iz < FLOOR_NZ; iz++) {
      const z = FLOOR_Z_MIN + iz * GRID_DZ;
      floorMaxY[iz] = resolveStickerFloorContourY(z);
    }
  }
  resetReliefEnvelopeToAnalyticalBaseline();

  function splatPointIntoEnvelope(x, y, z, absNx, absNy, absNz) {
    // 1. Interior Left & Right Walls
    if (z >= -0.05 && z <= WALL_Z_MAX && y >= 0.15 && y <= WALL_Y_MAX && absNy < 0.85) {
      const izCenter = Math.round((Math.max(0.0, z) - WALL_Z_MIN) / GRID_DZ);
      const iyCenter = Math.round((y - WALL_Y_MIN) / GRID_DY);
      const baseXL = resolveStickerWallProfileX('L', Math.max(0.0, z));
      const baseXR = resolveStickerWallProfileX('R', Math.max(0.0, z));

      // Left Wall filter: exclude perpendicular entrance gate at Z <= 0.65m (X > -1.45m)
      const validLeftGate = z > 0.65 || x <= -1.45;
      if (validLeftGate && x >= baseXL - 0.35 && x <= baseXL + 0.42 && x < -1.15) {
        for (let dz = -1; dz <= 1; dz++) {
          const iz = izCenter + dz;
          if (iz < 0 || iz >= WALL_NZ) continue;
          for (let dy = -1; dy <= 1; dy++) {
            const iy = iyCenter + dy;
            if (iy < 0 || iy >= WALL_NY) continue;
            const idx = iz * WALL_NY + iy;
            if (x > leftWallMaxX[idx]) leftWallMaxX[idx] = x;
          }
        }
      }

      // Right Wall filter
      if (x >= baseXR - 0.42 && x <= baseXR + 0.35 && x > 1.15) {
        for (let dz = -1; dz <= 1; dz++) {
          const iz = izCenter + dz;
          if (iz < 0 || iz >= WALL_NZ) continue;
          for (let dy = -1; dy <= 1; dy++) {
            const iy = iyCenter + dy;
            if (iy < 0 || iy >= WALL_NY) continue;
            const idx = iz * WALL_NY + iy;
            if (x < rightWallMinX[idx]) rightWallMinX[idx] = x;
          }
        }
      }
    }

    // 2. Exterior Left & Right Street-Facing Building Facades (Z in [-1.15m, +0.10m])
    if (z >= -1.15 && z <= 0.10 && y >= 0.25 && y <= WALL_Y_MAX && absNy < 0.85) {
      const iyCenter = Math.round((y - WALL_Y_MIN) / GRID_DY);
      if (x >= EXT_L_X_MIN && x <= -1.55) {
        const baseZL = resolveStickerExteriorWallProfileZ('L', x);
        if (z >= baseZL - 0.28 && z <= baseZL + 0.28) {
          const ixCenter = Math.round((x - EXT_L_X_MIN) / GRID_DX);
          for (let dx = -1; dx <= 1; dx++) {
            const ix = ixCenter + dx;
            if (ix < 0 || ix >= EXT_L_NX) continue;
            for (let dy = -1; dy <= 1; dy++) {
              const iy = iyCenter + dy;
              if (iy < 0 || iy >= WALL_NY) continue;
              const idx = ix * WALL_NY + iy;
              if (z < extLeftMinZ[idx]) extLeftMinZ[idx] = z;
            }
          }
        }
      } else if (x >= 2.20 && x <= EXT_R_X_MAX) {
        const baseZR = resolveStickerExteriorWallProfileZ('R', x);
        if (z >= baseZR - 0.28 && z <= baseZR + 0.28) {
          const ixCenter = Math.round((x - EXT_R_X_MIN) / GRID_DX);
          for (let dx = -1; dx <= 1; dx++) {
            const ix = ixCenter + dx;
            if (ix < 0 || ix >= EXT_R_NX) continue;
            for (let dy = -1; dy <= 1; dy++) {
              const iy = iyCenter + dy;
              if (iy < 0 || iy >= WALL_NY) continue;
              const idx = ix * WALL_NY + iy;
              if (z < extRightMinZ[idx]) extRightMinZ[idx] = z;
            }
          }
        }
      }
    }

    // 3. Floor (interior & exterior)
    if (z >= FLOOR_Z_MIN && z <= FLOOR_Z_MAX && absNy >= 0.65) {
      const baseY = resolveStickerFloorContourY(z);
      const inCorridorX =
        z < 0.0
          ? x >= -9.0 && x <= 9.8
          : x >= resolveStickerWallProfileX('L', z) + 0.25 && x <= resolveStickerWallProfileX('R', z) - 0.25;
      if (inCorridorX && y >= baseY - 0.15 && y <= baseY + 0.08) {
        const izCenter = Math.round((z - FLOOR_Z_MIN) / GRID_DZ);
        for (let dz = -1; dz <= 1; dz++) {
          const iz = izCenter + dz;
          if (iz >= 0 && iz < FLOOR_NZ) {
            if (y > floorMaxY[iz]) floorMaxY[iz] = y;
          }
        }
      }
    }
  }

  let envelopeExtracted = false;
  function extractVisualSurfaceEnvelope(visualAlleyMesh, reflectorMesh = null) {
    resetReliefEnvelopeToAnalyticalBaseline();
    if (!visualAlleyMesh && !reflectorMesh) {
      return false;
    }

    const v0 = new THREE.Vector3();
    const v1 = new THREE.Vector3();
    const v2 = new THREE.Vector3();
    const e1 = new THREE.Vector3();
    const e2 = new THREE.Vector3();
    const faceN = new THREE.Vector3();

    if (visualAlleyMesh) {
      visualAlleyMesh.updateMatrixWorld(true);
      visualAlleyMesh.traverse((child) => {
        if (!child.isMesh || !child.geometry || !child.geometry.attributes.position) return;
        const posAttr = child.geometry.attributes.position;
        const indexAttr = child.geometry.index;
        const matWorld = child.matrixWorld;
        const triCount = indexAttr ? Math.floor(indexAttr.count / 3) : Math.floor(posAttr.count / 3);

        for (let t = 0; t < triCount; t++) {
          const i0 = indexAttr ? indexAttr.getX(t * 3) : t * 3;
          const i1 = indexAttr ? indexAttr.getX(t * 3 + 1) : t * 3 + 1;
          const i2 = indexAttr ? indexAttr.getX(t * 3 + 2) : t * 3 + 2;

          v0.fromBufferAttribute(posAttr, i0).applyMatrix4(matWorld);
          v1.fromBufferAttribute(posAttr, i1).applyMatrix4(matWorld);
          v2.fromBufferAttribute(posAttr, i2).applyMatrix4(matWorld);

          e1.subVectors(v1, v0);
          e2.subVectors(v2, v0);
          faceN.crossVectors(e1, e2);
          const nLen = faceN.length();
          if (nLen <= 1e-8) continue;
          const absNx = Math.abs(faceN.x) / nLen;
          const absNy = Math.abs(faceN.y) / nLen;
          const absNz = Math.abs(faceN.z) / nLen;

          const maxEdge = Math.max(e1.length(), e2.length(), v1.distanceTo(v2));
          const steps = Math.min(8, Math.max(1, Math.ceil(maxEdge / 0.14)));

          for (let su = 0; su <= steps; su++) {
            const u = su / steps;
            for (let sv = 0; sv <= steps - su; sv++) {
              const v = sv / steps;
              const w = 1.0 - u - v;
              const px = w * v0.x + u * v1.x + v * v2.x;
              const py = w * v0.y + u * v1.y + v * v2.y;
              const pz = w * v0.z + u * v1.z + v * v2.z;
              splatPointIntoEnvelope(px, py, pz, absNx, absNy, absNz);
            }
          }
        }
      });
    }

    if (reflectorMesh && reflectorMesh.geometry && reflectorMesh.geometry.attributes.position) {
      reflectorMesh.updateMatrixWorld(true);
      const rPos = reflectorMesh.geometry.attributes.position;
      const rMat = reflectorMesh.matrixWorld;
      for (let i = 0; i < rPos.count; i++) {
        v0.fromBufferAttribute(rPos, i).applyMatrix4(rMat);
        const izCenter = Math.round((v0.z - FLOOR_Z_MIN) / GRID_DZ);
        for (let dz = -1; dz <= 1; dz++) {
          const iz = izCenter + dz;
          if (iz >= 0 && iz < FLOOR_NZ) {
            if (v0.y > floorMaxY[iz]) floorMaxY[iz] = v0.y;
          }
        }
      }
    }

    envelopeExtracted = true;
    return true;
  }

  if (options.visualMesh || options.reflectorMesh) {
    extractVisualSurfaceEnvelope(options.visualMesh, options.reflectorMesh);
  }

  function sampleLeftWallEnvelopeX(z, y) {
    const base = resolveStickerWallProfileX('L', z);
    const iz = Math.max(0, Math.min(WALL_NZ - 1, Math.round((Math.max(0.0, z) - WALL_Z_MIN) / GRID_DZ)));
    const iy = Math.max(0, Math.min(WALL_NY - 1, Math.round((Math.max(0.0, y) - WALL_Y_MIN) / GRID_DY)));
    return Math.max(base, leftWallMaxX[iz * WALL_NY + iy]);
  }

  function sampleRightWallEnvelopeX(z, y) {
    const base = resolveStickerWallProfileX('R', z);
    const iz = Math.max(0, Math.min(WALL_NZ - 1, Math.round((Math.max(0.0, z) - WALL_Z_MIN) / GRID_DZ)));
    const iy = Math.max(0, Math.min(WALL_NY - 1, Math.round((Math.max(0.0, y) - WALL_Y_MIN) / GRID_DY)));
    return Math.min(base, rightWallMinX[iz * WALL_NY + iy]);
  }

  function sampleExteriorLeftEnvelopeZ(x, y) {
    const base = resolveStickerExteriorWallProfileZ('L', x);
    const ix = Math.max(0, Math.min(EXT_L_NX - 1, Math.round((x - EXT_L_X_MIN) / GRID_DX)));
    const iy = Math.max(0, Math.min(WALL_NY - 1, Math.round((Math.max(0.0, y) - WALL_Y_MIN) / GRID_DY)));
    return Math.min(base, extLeftMinZ[ix * WALL_NY + iy]);
  }

  function sampleExteriorRightEnvelopeZ(x, y) {
    const base = resolveStickerExteriorWallProfileZ('R', x);
    const ix = Math.max(0, Math.min(EXT_R_NX - 1, Math.round((x - EXT_R_X_MIN) / GRID_DX)));
    const iy = Math.max(0, Math.min(WALL_NY - 1, Math.round((Math.max(0.0, y) - WALL_Y_MIN) / GRID_DY)));
    return Math.min(base, extRightMinZ[ix * WALL_NY + iy]);
  }

  function sampleFloorEnvelopeY(z) {
    const base = resolveStickerFloorContourY(z);
    const iz = Math.max(0, Math.min(FLOOR_NZ - 1, Math.round((z - FLOOR_Z_MIN) / GRID_DZ)));
    return Math.max(base, floorMaxY[iz]);
  }

  /**
   * Evaluates the 9-point footprint (center, 4 corners, 4 edge midpoints) of a sticker in O(1) time
   * and advances its anchor along the outward surface normal N so that every sample point clears
   * both the analytical surface and the visual mesh relief envelope by >= minClearanceMeters (Spec 048 §4.4).
   */
  function evaluateFootprintClearance(
    anchorPos,
    normal,
    tangentRight,
    tangentUp,
    widthMeters,
    heightMeters,
    surfaceZone,
    minClearanceMeters = STICKER_DEFAULT_SIZE_BOUNDS.minSurfaceClearanceMeters
  ) {
    const halfW = Math.max(0.01, (Number(widthMeters) || 0.5) * 0.5);
    const halfH = Math.max(0.01, (Number(heightMeters) || 0.5) * 0.5);
    const clearance = Number.isFinite(Number(minClearanceMeters))
      ? Number(minClearanceMeters)
      : STICKER_DEFAULT_SIZE_BOUNDS.minSurfaceClearanceMeters;

    const nx = normal.x;
    const ny = normal.y;
    const nz = normal.z;
    const zone = String(surfaceZone || '').toLowerCase();

    const isFloor =
      zone.includes('floor') || Math.abs(ny) >= 0.85;
    const isExtLeft =
      zone === 'exterior_wall_left' || ( !isFloor && anchorPos.z < -0.05 && anchorPos.x < 0 );
    const isExtRight =
      zone === 'exterior_wall_right' || ( !isFloor && anchorPos.z < -0.05 && anchorPos.x > 0 );
    const isWallLeft =
      !isFloor && !isExtLeft && !isExtRight && (zone === 'alley_wall_left' || nx > 0.35);
    const isWallRight =
      !isFloor && !isExtLeft && !isExtRight && !isWallLeft && (zone === 'alley_wall_right' || nx < -0.35);

    let maxRequiredShift = 0.0;

    for (let iu = -1; iu <= 1; iu++) {
      const du = iu * halfW;
      for (let iv = -1; iv <= 1; iv++) {
        const dv = iv * halfH;
        const qx = anchorPos.x + du * tangentRight.x + dv * tangentUp.x;
        const qy = anchorPos.y + du * tangentRight.y + dv * tangentUp.y;
        const qz = anchorPos.z + du * tangentRight.z + dv * tangentUp.z;

        let reqShift = 0.0;
        if (isFloor) {
          const envY = sampleFloorEnvelopeY(qz);
          const denom = Math.max(0.5, ny);
          reqShift = (envY + clearance - qy) / denom;
        } else if (isWallLeft) {
          const envX = sampleLeftWallEnvelopeX(qz, qy);
          const denom = Math.max(0.5, nx);
          reqShift = (envX + clearance - qx) / denom;
        } else if (isWallRight) {
          const envX = sampleRightWallEnvelopeX(qz, qy);
          const denom = Math.max(0.5, -nx);
          reqShift = (qx - (envX - clearance)) / denom;
        } else if (isExtLeft) {
          if (Math.abs(nz) >= Math.abs(nx)) {
            const envZ = sampleExteriorLeftEnvelopeZ(qx, qy);
            const denom = Math.max(0.5, -nz);
            reqShift = (qz - (envZ - clearance)) / denom;
          } else {
            const envX = qz >= -0.60 && qx > -5.0 ? -1.58 : -9.40;
            const denom = Math.max(0.5, nx);
            reqShift = (envX + clearance - qx) / denom;
          }
        } else if (isExtRight) {
          if (Math.abs(nz) >= Math.abs(nx)) {
            const envZ = sampleExteriorRightEnvelopeZ(qx, qy);
            const denom = Math.max(0.5, -nz);
            reqShift = (qz - (envZ - clearance)) / denom;
          } else {
            const envX = qz >= -0.50 && qx < 5.0 ? 2.23 : 10.20;
            const denom = Math.max(0.5, -nx);
            reqShift = (qx - (envX - clearance)) / denom;
          }
        }

        if (reqShift > maxRequiredShift) {
          maxRequiredShift = reqShift;
        }
      }
    }

    const adjustedPosition = anchorPos.clone().addScaledVector(normal, maxRequiredShift);
    return {
      adjustedPosition,
      shiftMeters: Number(maxRequiredShift.toFixed(4)),
      clearanceMeters: Number((clearance + Math.max(0, maxRequiredShift)).toFixed(4)),
    };
  }

  function raycastSurface(raycaster, normalOffsetMeters = STICKER_DEFAULT_SIZE_BOUNDS.normalOffsetMeters) {
    group.updateMatrixWorld(true);
    const hits = raycaster.intersectObjects(raycastTargets, false);
    if (!hits || hits.length === 0) {
      return null;
    }
    const hit = hits[0];
    const obj = hit.object;
    const hitPoint = hit.point.clone();

    // Retrieve the calibrated outward surface normal from the vertex normal attribute (or face normal)
    const normal = new THREE.Vector3(0, 1, 0);
    const normAttr = obj.geometry && obj.geometry.attributes && obj.geometry.attributes.normal;
    if (normAttr && hit.face && typeof hit.face.a === 'number') {
      normal.fromBufferAttribute(normAttr, hit.face.a).transformDirection(obj.matrixWorld).normalize();
    } else if (hit.face && hit.face.normal) {
      normal.copy(hit.face.normal).transformDirection(obj.matrixWorld).normalize();
    }
    // Enforce exact plumb wall normals (|Ny| <= 1e-6) and zero-roll floor normals (|Nx| <= 1e-6) (AC-01)
    const rawZone = obj.userData.surfaceZone || 'alley_wall_left';
    if (rawZone === 'floor') {
      if (normal.y < 0) normal.negate();
      normal.x = 0.0;
      normal.normalize();
    } else {
      normal.y = 0.0;
      normal.normalize();
      if (rawZone === 'alley_wall_left' && normal.x < 0) {
        normal.negate();
      } else if (rawZone === 'alley_wall_right' && normal.x > 0 && Math.abs(normal.x) > Math.abs(normal.z)) {
        normal.negate();
      } else if ((rawZone === 'exterior_wall_left' || rawZone === 'exterior_wall_right') && Math.abs(normal.z) > Math.abs(normal.x) && normal.z > 0) {
        normal.negate();
      }
    }

    const resolvedZone =
      rawZone === 'floor'
        ? hitPoint.z < 0.0
          ? 'exterior_floor'
          : 'alley_floor'
        : rawZone;

    const ZONE_LABELS = {
      alley_wall_left: 'Left Alley Wall (Interior)',
      alley_wall_right: 'Right Alley Wall (Interior)',
      exterior_wall_left: 'Left Exterior Facade',
      exterior_wall_right: 'Right Exterior Facade',
      alley_floor: 'Alley Floor (Interior)',
      exterior_floor: 'Exterior Forecourt Floor',
      bound_start: 'Alley Entrance Threshold',
      bound_end: 'Far Alley Boundary Wall',
    };
    const surfaceLabel = ZONE_LABELS[resolvedZone] || obj.name;

    const surfacePoint = hitPoint.clone().addScaledVector(normal, normalOffsetMeters);
    return {
      hitPoint,
      surfacePoint,
      normal,
      surfaceZone: resolvedZone,
      surfaceId: obj.name,
      surfaceLabel,
      colliderName: obj.name,
      distance: hit.distance,
    };
  }

  return {
    group,
    meshes,
    raycastTargets,
    surfaceMat,
    raycastSurface,
    extractVisualSurfaceEnvelope,
    evaluateFootprintClearance,
    sampleLeftWallEnvelopeX,
    sampleRightWallEnvelopeX,
    sampleExteriorLeftEnvelopeZ,
    sampleExteriorRightEnvelopeZ,
    sampleFloorEnvelopeY,
    get isEnvelopeExtracted() {
      return envelopeExtracted;
    },
    setDebugVisible(visible) {
      surfaceMat.visible = Boolean(visible);
      surfaceMat.opacity = visible ? 0.28 : 0.0;
    },
  };
}

// ============================================================================
// 6. Holographic Stickers System Controller & Interactive Placement (Ticket-006 & Spec 047)
// ============================================================================

export function buildHolographicStickersSystem(options = {}) {
  const rootGroup = options.rootGroup || new THREE.Group();
  rootGroup.name = 'HolographicStickersRootGroup';
  rootGroup.renderOrder = 12;

  const spawnDefaultCatalog = options.spawnDefaultCatalog !== false;
  const stickers = [];
  const stickersById = {};
  let selectedStickerId = STICKER_ASSET_MANIFEST[0].id;

  if (spawnDefaultCatalog) {
    for (const assetSpec of STICKER_ASSET_MANIFEST) {
      const instance = createHolographicStickerInstance(assetSpec, options);
      rootGroup.add(instance.group);
      stickers.push(instance);
      stickersById[assetSpec.id] = instance;
      stickersById[assetSpec.code] = instance;
      stickersById[assetSpec.index] = instance;
    }
  }

  // Dedicated group for user-placed stickers and 3D calibration gizmo
  const placedStickersGroup = new THREE.Group();
  placedStickersGroup.name = 'PlacedHolographicStickersGroup';
  placedStickersGroup.renderOrder = 12;
  rootGroup.add(placedStickersGroup);

  const previewGroup = new THREE.Group();
  previewGroup.name = 'StickerPlacementPreviewGroup';
  previewGroup.renderOrder = 14;
  rootGroup.add(previewGroup);

  // 3D Min/Max Size Calibration Tool Wireframe Reference Group (Spec 047 §5.2)
  const calibrationGizmoGroup = new THREE.Group();
  calibrationGizmoGroup.name = 'StickerSizeCalibrationGizmoGroup';
  calibrationGizmoGroup.visible = false;
  calibrationGizmoGroup.renderOrder = 15;
  rootGroup.add(calibrationGizmoGroup);

  function createCalibrationFrameLine(colorHex, renderOrder = 15) {
    const pts = [
      new THREE.Vector3(-0.5, -0.5, 0),
      new THREE.Vector3(0.5, -0.5, 0),
      new THREE.Vector3(0.5, 0.5, 0),
      new THREE.Vector3(-0.5, 0.5, 0),
      new THREE.Vector3(-0.5, -0.5, 0),
    ];
    const geom = new THREE.BufferGeometry().setFromPoints(pts);
    const mat = new THREE.LineBasicMaterial({
      color: colorHex,
      depthTest: false,
      transparent: true,
      opacity: 0.95,
    });
    const line = new THREE.Line(geom, mat);
    line.renderOrder = renderOrder;
    return line;
  }

  const minBoundFrameLine = createCalibrationFrameLine(0x00d5ff, 15); // Cyan: Min Size
  minBoundFrameLine.name = 'StickerCalibrationMinFrame';
  const maxBoundFrameLine = createCalibrationFrameLine(0xf59e0b, 15); // Amber: Max Size
  maxBoundFrameLine.name = 'StickerCalibrationMaxFrame';
  const curBoundFrameLine = createCalibrationFrameLine(0x10b981, 16); // Emerald: Current Size
  curBoundFrameLine.name = 'StickerCalibrationCurrentFrame';
  calibrationGizmoGroup.add(minBoundFrameLine, maxBoundFrameLine, curBoundFrameLine);

  const boundingSurfaces = options.boundingSurfaces || buildStickerBoundingSurfaces(options);
  if (!options.boundingSurfaces) {
    rootGroup.add(boundingSurfaces.group);
  }

  // Size Calibration Tool State
  let minSize = clampStickerSize(
    options.minSize ?? STICKER_DEFAULT_SIZE_BOUNDS.minSize,
    STICKER_DEFAULT_SIZE_BOUNDS.absMinLimit,
    STICKER_DEFAULT_SIZE_BOUNDS.absMaxLimit
  );
  let maxSize = clampStickerSize(
    options.maxSize ?? STICKER_DEFAULT_SIZE_BOUNDS.maxSize,
    minSize,
    STICKER_DEFAULT_SIZE_BOUNDS.absMaxLimit
  );
  let currentSize = clampStickerSize(
    options.defaultSize ?? STICKER_DEFAULT_SIZE_BOUNDS.defaultSize,
    minSize,
    maxSize
  );
  let currentRotationRad = 0.0;
  let calibrationToolActive = false;

  // Interactive Placement & Placed Stickers State
  let placementActive = false;
  let repositioningStickerId = null;
  let previewInstance = null;
  let lastValidPreviewHit = null;
  let placedCounter = 0;
  const placedStickers = [];
  const placedStickersById = {};
  const placedRaycastTargets = [];
  let activePlacedStickerId = null;

  function computeScaledDimensionsForAsset(assetIdOrSpec, sizeScalar) {
    const spec = resolveStickerAssetSpec(assetIdOrSpec);
    const unitGeom = computeStickerGeometrySpec(spec, { baseHeightMeters: 1.0 });
    const clampedS = clampStickerSize(sizeScalar, minSize, maxSize);
    const widthMeters = Number((unitGeom.planeWidthMeters * clampedS).toFixed(4));
    const heightMeters = Number((unitGeom.planeHeightMeters * clampedS).toFixed(4));
    return {
      spec,
      unitGeom,
      size: clampedS,
      widthMeters,
      heightMeters,
      croppedAspectRatio: unitGeom.croppedAspectRatio,
    };
  }

  function syncCalibrationGizmoTransform() {
    const targetRecord = activePlacedStickerId ? placedStickersById[activePlacedStickerId] : null;
    const activeAssetId = targetRecord
      ? targetRecord.assetId
      : previewInstance
        ? previewInstance.spec.id
        : selectedStickerId;
    const dimsMin = computeScaledDimensionsForAsset(activeAssetId, minSize);
    const dimsMax = computeScaledDimensionsForAsset(activeAssetId, maxSize);
    const activeSize = targetRecord ? targetRecord.size : currentSize;
    const dimsCur = computeScaledDimensionsForAsset(activeAssetId, activeSize);

    minBoundFrameLine.scale.set(dimsMin.widthMeters, dimsMin.heightMeters, 1.0);
    maxBoundFrameLine.scale.set(dimsMax.widthMeters, dimsMax.heightMeters, 1.0);
    curBoundFrameLine.scale.set(dimsCur.widthMeters, dimsCur.heightMeters, 1.0);

    if (targetRecord && targetRecord.instance) {
      calibrationGizmoGroup.position.copy(targetRecord.instance.group.position);
      calibrationGizmoGroup.quaternion.copy(targetRecord.instance.group.quaternion);
    } else if (previewInstance && previewInstance.group.visible) {
      calibrationGizmoGroup.position.copy(previewInstance.group.position);
      calibrationGizmoGroup.quaternion.copy(previewInstance.group.quaternion);
    } else {
      // Default calibration wall display on Left Alley Wall at Z = 4.2m
      const defaultWallX = resolveStickerWallProfileX('L', 4.2) + STICKER_DEFAULT_SIZE_BOUNDS.normalOffsetMeters;
      const basis = computeStickerSurfaceBasis(new THREE.Vector3(1, 0, 0), 0);
      calibrationGizmoGroup.position.set(defaultWallX, 1.65, 4.2);
      calibrationGizmoGroup.quaternion.copy(basis.quaternion);
    }
    calibrationGizmoGroup.updateMatrixWorld(true);
  }

  function applyPoseAndSizeToInstance(instance, anchorPosition, normal, rotationRad, sizeScalar, surfaceZone = null) {
    const clampedS = clampStickerSize(sizeScalar, minSize, maxSize);
    const croppedAspectRatio = instance.geomSpec ? instance.geomSpec.croppedAspectRatio : 1.0;
    const widthMeters = Number((croppedAspectRatio * clampedS).toFixed(4));
    const heightMeters = Number(clampedS.toFixed(4));
    const dims = {
      spec: instance.spec,
      size: clampedS,
      widthMeters,
      heightMeters,
      croppedAspectRatio,
    };
    // Instance geometry was built with baseHeightMeters = 1.15 by default; scale relative to geomSpec
    const scaleFactorX = widthMeters / instance.geomSpec.planeWidthMeters;
    const scaleFactorY = heightMeters / instance.geomSpec.planeHeightMeters;
    const basis = computeStickerSurfaceBasis(normal, rotationRad);

    const anchorVec =
      anchorPosition instanceof THREE.Vector3
        ? anchorPosition
        : new THREE.Vector3(
            Number(anchorPosition?.x) || 0.0,
            Number(anchorPosition?.y) || 0.0,
            Number(anchorPosition?.z) || 0.0
          );

    const clearance =
      boundingSurfaces && typeof boundingSurfaces.evaluateFootprintClearance === 'function'
        ? boundingSurfaces.evaluateFootprintClearance(
            anchorVec,
            basis.normal,
            basis.tangentRight,
            basis.tangentUp,
            dims.widthMeters,
            dims.heightMeters,
            surfaceZone,
            STICKER_DEFAULT_SIZE_BOUNDS.minSurfaceClearanceMeters
          )
        : {
            adjustedPosition: anchorVec.clone(),
            shiftMeters: 0.0,
            clearanceMeters: STICKER_DEFAULT_SIZE_BOUNDS.minSurfaceClearanceMeters,
          };

    instance.group.position.copy(clearance.adjustedPosition);
    instance.group.quaternion.copy(basis.quaternion);
    instance.group.scale.set(scaleFactorX, scaleFactorY, 1.0);
    instance.material.polygonOffset = true;
    instance.material.polygonOffsetFactor = -4;
    instance.material.polygonOffsetUnits = -4;
    instance.material.depthWrite = false;
    instance.mesh.renderOrder = 12;
    instance.group.updateMatrixWorld(true);

    return {
      basis,
      dims,
      adjustedPosition: clearance.adjustedPosition,
      shiftMeters: clearance.shiftMeters,
      clearanceMeters: clearance.clearanceMeters,
    };
  }

  function ensurePreviewInstance(assetIdOrSpec) {
    const spec = resolveStickerAssetSpec(assetIdOrSpec || selectedStickerId);
    if (previewInstance && previewInstance.spec.id !== spec.id) {
      previewInstance.dispose();
      previewInstance = null;
    }
    if (!previewInstance) {
      previewInstance = createHolographicStickerInstance(spec, {
        ...options,
        floorY: options.floorY || 0.0,
      });
      previewInstance.mesh.raycast = () => {}; // Never self-intersect preview during raycast
      previewGroup.add(previewInstance.group);
    }
    return previewInstance;
  }

  function beginPlacement(assetIdOrSpec = null, initOpts = {}) {
    if (assetIdOrSpec) {
      const spec = resolveStickerAssetSpec(assetIdOrSpec);
      selectedStickerId = spec.id;
    }
    repositioningStickerId = initOpts.repositionStickerId || null;
    if (initOpts.size !== undefined) {
      currentSize = clampStickerSize(initOpts.size, minSize, maxSize);
    } else {
      currentSize = clampStickerSize(currentSize, minSize, maxSize);
    }
    if (initOpts.rotationRad !== undefined) {
      currentRotationRad = normalizeStickerRotationRad(initOpts.rotationRad);
    }

    placementActive = true;
    const prev = ensurePreviewInstance(selectedStickerId);
    prev.group.visible = true;

    // Position preview at initial wall point until first pointer move
    const fallbackNormal = initOpts.normal || new THREE.Vector3(1, 0, 0);
    const fallbackAnchor =
      initOpts.anchorPosition ||
      initOpts.position ||
      new THREE.Vector3(
        resolveStickerWallProfileX('L', 4.5),
        1.62,
        4.5
      );
    const initZone = initOpts.surfaceZone || 'alley_wall_left';
    const { adjustedPosition } = applyPoseAndSizeToInstance(
      prev,
      fallbackAnchor,
      fallbackNormal,
      currentRotationRad,
      currentSize,
      initZone
    );
    lastValidPreviewHit = {
      hitPoint: fallbackAnchor.clone(),
      surfacePoint: adjustedPosition.clone(),
      normal: fallbackNormal.clone(),
      surfaceZone: initZone,
      surfaceId: 'COLLIDER_STICKER_WALL_L',
      surfaceLabel: initOpts.surfaceLabel || 'Left Alley Wall (Interior)',
      colliderName: 'COLLIDER_STICKER_WALL_L',
      distance: 2.5,
    };
    if (calibrationToolActive) {
      syncCalibrationGizmoTransform();
    }
    return prev;
  }

  function updatePlacementPreviewFromRay(raycaster) {
    if (!placementActive) return null;
    const hit = boundingSurfaces.raycastSurface(
      raycaster,
      STICKER_DEFAULT_SIZE_BOUNDS.normalOffsetMeters
    );
    if (!hit) {
      return null;
    }
    const prev = ensurePreviewInstance(selectedStickerId);
    prev.group.visible = true;
    const { adjustedPosition, clearanceMeters } = applyPoseAndSizeToInstance(
      prev,
      hit.hitPoint,
      hit.normal,
      currentRotationRad,
      currentSize,
      hit.surfaceZone
    );
    hit.surfacePoint.copy(adjustedPosition);
    hit.clearanceMeters = clearanceMeters;
    lastValidPreviewHit = hit;
    if (calibrationToolActive) {
      syncCalibrationGizmoTransform();
    }
    return hit;
  }

  function cancelPlacement() {
    placementActive = false;
    repositioningStickerId = null;
    if (previewInstance) {
      previewInstance.group.visible = false;
    }
    if (calibrationToolActive) {
      syncCalibrationGizmoTransform();
    }
  }

  function placeStickerAt(placeOpts = {}) {
    const spec = resolveStickerAssetSpec(placeOpts.stickerId || placeOpts.assetId || selectedStickerId);
    const normal = placeOpts.normal
      ? new THREE.Vector3(placeOpts.normal.x, placeOpts.normal.y, placeOpts.normal.z).normalize()
      : lastValidPreviewHit
        ? lastValidPreviewHit.normal.clone()
        : new THREE.Vector3(1, 0, 0);

    // Enforce exact plumb wall normal (|Ny| <= 1e-6) or zero-roll floor normal (|Nx| <= 1e-6) (AC-01)
    if (Math.abs(normal.y) >= 0.85) {
      if (normal.y < 0) normal.negate();
      normal.x = 0.0;
      normal.normalize();
    } else {
      normal.y = 0.0;
      normal.normalize();
    }

    const anchorPoint = placeOpts.anchorPosition
      ? new THREE.Vector3(placeOpts.anchorPosition.x, placeOpts.anchorPosition.y, placeOpts.anchorPosition.z)
      : placeOpts.position
        ? new THREE.Vector3(placeOpts.position.x, placeOpts.position.y, placeOpts.position.z)
        : lastValidPreviewHit
          ? lastValidPreviewHit.hitPoint.clone()
          : new THREE.Vector3(
              resolveStickerWallProfileX('L', 4.5),
              1.62,
              4.5
            );

    const rotRad = normalizeStickerRotationRad(
      placeOpts.rotationRad !== undefined
        ? placeOpts.rotationRad
        : placeOpts.rotationDeg !== undefined
          ? THREE.MathUtils.degToRad(placeOpts.rotationDeg)
          : currentRotationRad
    );
    const rawSizeInput =
      placeOpts.sizeMeters !== undefined
        ? placeOpts.sizeMeters
        : placeOpts.size !== undefined
          ? placeOpts.size
          : currentSize;
    const clampedS = clampStickerSize(rawSizeInput, minSize, maxSize);
    const colliderName =
      placeOpts.surfaceId ||
      placeOpts.colliderName ||
      (lastValidPreviewHit ? lastValidPreviewHit.colliderName : 'COLLIDER_STICKER_WALL_L');

    let inferredZone = placeOpts.surfaceZone || (lastValidPreviewHit ? lastValidPreviewHit.surfaceZone : null);
    if (!inferredZone || placeOpts.surfaceId || placeOpts.colliderName || placeOpts.position || placeOpts.normal) {
      if (placeOpts.surfaceZone) {
        inferredZone = placeOpts.surfaceZone;
      } else if (colliderName === 'COLLIDER_STICKER_FLOOR' || Math.abs(normal.y) >= 0.85) {
        inferredZone = anchorPoint.z < 0.0 ? 'exterior_floor' : 'alley_floor';
      } else if (colliderName === 'COLLIDER_STICKER_EXTERIOR_L' || (anchorPoint.z < -0.05 && anchorPoint.x < 0)) {
        inferredZone = 'exterior_wall_left';
      } else if (colliderName === 'COLLIDER_STICKER_EXTERIOR_R' || (anchorPoint.z < -0.05 && anchorPoint.x > 0)) {
        inferredZone = 'exterior_wall_right';
      } else if (colliderName === 'COLLIDER_STICKER_WALL_R' || normal.x < -0.35) {
        inferredZone = 'alley_wall_right';
      } else {
        inferredZone = 'alley_wall_left';
      }
    }
    const surfaceZone = inferredZone;
    const surfaceLabel =
      placeOpts.surfaceLabel ||
      (lastValidPreviewHit && lastValidPreviewHit.surfaceLabel
        ? lastValidPreviewHit.surfaceLabel
        : colliderName);

    // If repositioning an existing placed sticker or re-hydrating/updating an existing placedId, update it in place
    const existingTargetId =
      placeOpts.placedId && placedStickersById[placeOpts.placedId]
        ? placeOpts.placedId
        : repositioningStickerId && placedStickersById[repositioningStickerId]
          ? repositioningStickerId
          : null;

    if (existingTargetId && placedStickersById[existingTargetId]) {
      const existing = placedStickersById[existingTargetId];
      const { basis, dims, adjustedPosition, clearanceMeters } = applyPoseAndSizeToInstance(
        existing.instance,
        anchorPoint,
        normal,
        rotRad,
        clampedS,
        surfaceZone
      );
      existing.anchorPosition = {
        x: Number(anchorPoint.x.toFixed(4)),
        y: Number(anchorPoint.y.toFixed(4)),
        z: Number(anchorPoint.z.toFixed(4)),
      };
      existing.position = {
        x: Number(adjustedPosition.x.toFixed(4)),
        y: Number(adjustedPosition.y.toFixed(4)),
        z: Number(adjustedPosition.z.toFixed(4)),
      };
      existing.normal = {
        x: Number(basis.normal.x.toFixed(6)),
        y: Number(basis.normal.y.toFixed(6)),
        z: Number(basis.normal.z.toFixed(6)),
      };
      existing.rotationRad = rotRad;
      existing.rotationDeg = Number(THREE.MathUtils.radToDeg(rotRad).toFixed(2));
      existing.size = clampedS;
      existing.sizeMeters = clampedS;
      existing.widthMeters = dims.widthMeters;
      existing.heightMeters = dims.heightMeters;
      existing.clearanceMeters = clearanceMeters;
      existing.surfaceZone = surfaceZone;
      existing.surfaceId = colliderName;
      existing.surfaceLabel = surfaceLabel;
      existing.colliderName = colliderName;
      existing.wallSide =
        placeOpts.wallSide || (basis.normal.x > 0.5 ? 'L' : basis.normal.x < -0.5 ? 'R' : 'FLOOR');
      if (typeof placeOpts.tagger === 'string') {
        existing.tagger = placeOpts.tagger.trim().slice(0, 64);
      }
      if (typeof placeOpts.message === 'string') {
        existing.message = placeOpts.message.trim().slice(0, 280);
      }
      const nextUpdatedAt = Number(placeOpts.updatedAt);
      existing.updatedAt =
        Number.isFinite(nextUpdatedAt) && nextUpdatedAt > 0
          ? Math.max(existing.updatedAt || 0, nextUpdatedAt)
          : Math.max(Date.now(), (existing.updatedAt || 0) + 1);
      existing.normalDotProduct = Number(
        new THREE.Vector3(0, 0, 1)
          .applyQuaternion(existing.instance.group.quaternion)
          .dot(basis.normal)
          .toFixed(6)
      );

      if (placeOpts.selectOnPlace !== false) {
        activePlacedStickerId = existing.placedId;
      }
      if (repositioningStickerId === existingTargetId) {
        cancelPlacement();
      }
      if (calibrationToolActive) {
        syncCalibrationGizmoTransform();
      }
      return existing;
    }

    placedCounter += 1;
    let placedId = placeOpts.placedId ? String(placeOpts.placedId).trim() : '';
    if (placedId) {
      const mNum = placedId.match(/^placed_sticker_(\d+)$/);
      if (mNum) {
        placedCounter = Math.max(placedCounter, Number(mNum[1]));
      }
    } else {
      const randSuffix = Math.random().toString(36).slice(2, 8);
      placedId = `placed_sticker_${Date.now()}_${randSuffix}_${placedCounter}`;
    }
    const instance = createHolographicStickerInstance(spec, {
      ...options,
      floorY: options.floorY || 0.0,
    });
    const { basis, dims, adjustedPosition, clearanceMeters } = applyPoseAndSizeToInstance(
      instance,
      anchorPoint,
      normal,
      rotRad,
      clampedS,
      surfaceZone
    );

    instance.group.name = `PlacedStickerGroup_${placedId}_${spec.id}`;
    instance.mesh.name = `PlacedStickerMesh_${placedId}_${spec.id}`;
    instance.mesh.userData.isPlacedSticker = true;
    instance.mesh.userData.placedStickerId = placedId;
    instance.mesh.userData.stickerAssetId = spec.id;

    placedStickersGroup.add(instance.group);
    placedRaycastTargets.push(instance.mesh);

    const stickerWorldNormal = new THREE.Vector3(0, 0, 1)
      .applyQuaternion(instance.group.quaternion)
      .normalize();
    const normalDotProduct = Number(stickerWorldNormal.dot(basis.normal).toFixed(6));

    const nowMs = Date.now();
    const parsedCreatedAt = Number(placeOpts.createdAt);
    const parsedUpdatedAt = Number(placeOpts.updatedAt);

    const record = {
      placedId,
      assetId: spec.id,
      stickerId: spec.id,
      code: spec.code,
      label: spec.label || spec.id.replace(/_/g, ' ').toUpperCase(),
      instance,
      anchorPosition: {
        x: Number(anchorPoint.x.toFixed(4)),
        y: Number(anchorPoint.y.toFixed(4)),
        z: Number(anchorPoint.z.toFixed(4)),
      },
      position: {
        x: Number(adjustedPosition.x.toFixed(4)),
        y: Number(adjustedPosition.y.toFixed(4)),
        z: Number(adjustedPosition.z.toFixed(4)),
      },
      normal: {
        x: Number(basis.normal.x.toFixed(6)),
        y: Number(basis.normal.y.toFixed(6)),
        z: Number(basis.normal.z.toFixed(6)),
      },
      normalDotProduct,
      clearanceMeters,
      rotationRad: rotRad,
      rotationDeg: Number(THREE.MathUtils.radToDeg(rotRad).toFixed(2)),
      size: clampedS,
      sizeMeters: clampedS,
      widthMeters: dims.widthMeters,
      heightMeters: dims.heightMeters,
      croppedAspectRatio: dims.croppedAspectRatio,
      surfaceZone,
      surfaceId: colliderName,
      surfaceLabel,
      surfaceCategory: placeOpts.surfaceCategory || surfaceZone,
      wallSide: placeOpts.wallSide || (basis.normal.x > 0.5 ? 'L' : basis.normal.x < -0.5 ? 'R' : 'FLOOR'),
      colliderName,
      tagger: typeof placeOpts.tagger === 'string' ? placeOpts.tagger.trim().slice(0, 64) : '',
      message: typeof placeOpts.message === 'string' ? placeOpts.message.trim().slice(0, 280) : '',
      createdAt: Number.isFinite(parsedCreatedAt) && parsedCreatedAt > 0 ? parsedCreatedAt : nowMs,
      updatedAt: Number.isFinite(parsedUpdatedAt) && parsedUpdatedAt > 0 ? parsedUpdatedAt : nowMs,
    };

    placedStickers.push(record);
    placedStickersById[placedId] = record;
    if (placeOpts.selectOnPlace !== false || !activePlacedStickerId) {
      activePlacedStickerId = placedId;
    }

    if (placementActive && placeOpts.selectOnPlace !== false) {
      cancelPlacement();
    }
    if (calibrationToolActive) {
      syncCalibrationGizmoTransform();
    }
    return record;
  }

  function commitPlacement(commitOpts = {}) {
    if (!placementActive && !commitOpts.force) return null;
    return placeStickerAt(commitOpts);
  }

  function selectPlacedSticker(placedId) {
    if (!placedId || !placedStickersById[placedId]) {
      activePlacedStickerId = null;
      return null;
    }
    activePlacedStickerId = placedId;
    const rec = placedStickersById[placedId];
    currentSize = rec.size;
    currentRotationRad = rec.rotationRad;
    selectedStickerId = rec.assetId;
    if (calibrationToolActive) {
      syncCalibrationGizmoTransform();
    }
    return rec;
  }

  function rotateActiveOrPlacedSticker(rotationRadOrDelta, opts = {}) {
    const isDelta = typeof opts === 'boolean' ? opts : Boolean(opts && opts.isDelta);
    const targetId = (opts && typeof opts === 'object' ? opts.placedId : null) || activePlacedStickerId;
    const rec = targetId ? placedStickersById[targetId] : null;

    if (placementActive || !rec) {
      const baseRot = isDelta ? currentRotationRad + Number(rotationRadOrDelta || 0) : Number(rotationRadOrDelta || 0);
      currentRotationRad = normalizeStickerRotationRad(baseRot);
      if (previewInstance && lastValidPreviewHit) {
        const { adjustedPosition, clearanceMeters } = applyPoseAndSizeToInstance(
          previewInstance,
          lastValidPreviewHit.hitPoint || lastValidPreviewHit.surfacePoint,
          lastValidPreviewHit.normal,
          currentRotationRad,
          currentSize,
          lastValidPreviewHit.surfaceZone
        );
        lastValidPreviewHit.surfacePoint.copy(adjustedPosition);
        lastValidPreviewHit.clearanceMeters = clearanceMeters;
      }
      if (calibrationToolActive) {
        syncCalibrationGizmoTransform();
      }
      return currentRotationRad;
    }

    const nextRot = normalizeStickerRotationRad(
      isDelta ? rec.rotationRad + Number(rotationRadOrDelta || 0) : Number(rotationRadOrDelta || 0)
    );
    rec.rotationRad = nextRot;
    rec.rotationDeg = Number(THREE.MathUtils.radToDeg(nextRot).toFixed(2));
    currentRotationRad = nextRot;
    const baseAnchor = rec.anchorPosition || rec.position;
    const { adjustedPosition, clearanceMeters } = applyPoseAndSizeToInstance(
      rec.instance,
      new THREE.Vector3(baseAnchor.x, baseAnchor.y, baseAnchor.z),
      new THREE.Vector3(rec.normal.x, rec.normal.y, rec.normal.z),
      rec.rotationRad,
      rec.size,
      rec.surfaceZone
    );
    rec.position = {
      x: Number(adjustedPosition.x.toFixed(4)),
      y: Number(adjustedPosition.y.toFixed(4)),
      z: Number(adjustedPosition.z.toFixed(4)),
    };
    rec.clearanceMeters = clearanceMeters;
    rec.updatedAt = Math.max(Date.now(), (rec.updatedAt || 0) + 1);
    if (calibrationToolActive) {
      syncCalibrationGizmoTransform();
    }
    return rec.rotationRad;
  }

  function resizeActiveOrPlacedSticker(sizeOrDelta, opts = {}) {
    const isDelta = typeof opts === 'boolean' ? opts : Boolean(opts && opts.isDelta);
    const targetId = (opts && typeof opts === 'object' ? opts.placedId : null) || activePlacedStickerId;
    const rec = targetId ? placedStickersById[targetId] : null;

    if (placementActive || !rec) {
      const rawNext = isDelta ? currentSize + Number(sizeOrDelta || 0) : Number(sizeOrDelta || currentSize);
      currentSize = clampStickerSize(rawNext, minSize, maxSize);
      if (previewInstance && lastValidPreviewHit) {
        const { adjustedPosition, clearanceMeters } = applyPoseAndSizeToInstance(
          previewInstance,
          lastValidPreviewHit.hitPoint || lastValidPreviewHit.surfacePoint,
          lastValidPreviewHit.normal,
          currentRotationRad,
          currentSize,
          lastValidPreviewHit.surfaceZone
        );
        lastValidPreviewHit.surfacePoint.copy(adjustedPosition);
        lastValidPreviewHit.clearanceMeters = clearanceMeters;
      }
      if (calibrationToolActive) {
        syncCalibrationGizmoTransform();
      }
      return currentSize;
    }

    const rawNext = isDelta ? rec.size + Number(sizeOrDelta || 0) : Number(sizeOrDelta || rec.size);
    const clampedS = clampStickerSize(rawNext, minSize, maxSize);
    const baseAnchor = rec.anchorPosition || rec.position;
    const { dims, adjustedPosition, clearanceMeters } = applyPoseAndSizeToInstance(
      rec.instance,
      new THREE.Vector3(baseAnchor.x, baseAnchor.y, baseAnchor.z),
      new THREE.Vector3(rec.normal.x, rec.normal.y, rec.normal.z),
      rec.rotationRad,
      clampedS,
      rec.surfaceZone
    );
    rec.position = {
      x: Number(adjustedPosition.x.toFixed(4)),
      y: Number(adjustedPosition.y.toFixed(4)),
      z: Number(adjustedPosition.z.toFixed(4)),
    };
    rec.clearanceMeters = clearanceMeters;
    rec.size = clampedS;
    rec.sizeMeters = clampedS;
    rec.widthMeters = dims.widthMeters;
    rec.heightMeters = dims.heightMeters;
    rec.updatedAt = Math.max(Date.now(), (rec.updatedAt || 0) + 1);
    currentSize = clampedS;
    if (calibrationToolActive) {
      syncCalibrationGizmoTransform();
    }
    return rec.size;
  }

  function setSizeBounds(newMinSize, newMaxSize) {
    let rawMin = newMinSize;
    let rawMax = newMaxSize;
    if (newMinSize && typeof newMinSize === 'object') {
      rawMin = newMinSize.minSize;
      rawMax = newMinSize.maxSize;
    }
    const normalized = normalizeStickerSizeBounds(
      rawMin !== undefined ? rawMin : minSize,
      rawMax !== undefined ? rawMax : maxSize
    );
    minSize = normalized.minSize;
    maxSize = normalized.maxSize;
    currentSize = clampStickerSize(currentSize, minSize, maxSize);

    // Clamp preview and all placed stickers to new [minSize, maxSize]
    if (previewInstance && lastValidPreviewHit) {
      const { adjustedPosition, clearanceMeters } = applyPoseAndSizeToInstance(
        previewInstance,
        lastValidPreviewHit.hitPoint || lastValidPreviewHit.surfacePoint,
        lastValidPreviewHit.normal,
        currentRotationRad,
        currentSize,
        lastValidPreviewHit.surfaceZone
      );
      lastValidPreviewHit.surfacePoint.copy(adjustedPosition);
      lastValidPreviewHit.clearanceMeters = clearanceMeters;
    }
    for (const rec of placedStickers) {
      if (rec.size < minSize || rec.size > maxSize) {
        const clampedS = clampStickerSize(rec.size, minSize, maxSize);
        const baseAnchor = rec.anchorPosition || rec.position;
        const { dims, adjustedPosition, clearanceMeters } = applyPoseAndSizeToInstance(
          rec.instance,
          new THREE.Vector3(baseAnchor.x, baseAnchor.y, baseAnchor.z),
          new THREE.Vector3(rec.normal.x, rec.normal.y, rec.normal.z),
          rec.rotationRad,
          clampedS,
          rec.surfaceZone
        );
        rec.position = {
          x: Number(adjustedPosition.x.toFixed(4)),
          y: Number(adjustedPosition.y.toFixed(4)),
          z: Number(adjustedPosition.z.toFixed(4)),
        };
        rec.clearanceMeters = clearanceMeters;
        rec.size = clampedS;
        rec.sizeMeters = clampedS;
        rec.widthMeters = dims.widthMeters;
        rec.heightMeters = dims.heightMeters;
      }
    }
    syncCalibrationGizmoTransform();
    return { minSize, maxSize, currentSize, defaultSize: currentSize, calibrationToolActive };
  }

  function syncVisualEnvelope(visualMesh, reflectorMesh = null) {
    if (!boundingSurfaces || typeof boundingSurfaces.extractVisualSurfaceEnvelope !== 'function') {
      return false;
    }
    const ok = boundingSurfaces.extractVisualSurfaceEnvelope(visualMesh, reflectorMesh);
    for (const rec of placedStickers) {
      const baseAnchor = rec.anchorPosition || rec.position;
      const { adjustedPosition, clearanceMeters } = applyPoseAndSizeToInstance(
        rec.instance,
        new THREE.Vector3(baseAnchor.x, baseAnchor.y, baseAnchor.z),
        new THREE.Vector3(rec.normal.x, rec.normal.y, rec.normal.z),
        rec.rotationRad,
        rec.size,
        rec.surfaceZone
      );
      rec.position = {
        x: Number(adjustedPosition.x.toFixed(4)),
        y: Number(adjustedPosition.y.toFixed(4)),
        z: Number(adjustedPosition.z.toFixed(4)),
      };
      rec.clearanceMeters = clearanceMeters;
    }
    return ok;
  }

  function captureCurrentAsMinSize() {
    const refSize =
      activePlacedStickerId && placedStickersById[activePlacedStickerId]
        ? placedStickersById[activePlacedStickerId].size
        : currentSize;
    const nextMax = Math.max(maxSize, Number((refSize + 0.05).toFixed(4)));
    return setSizeBounds(refSize, nextMax);
  }

  function captureCurrentAsMaxSize() {
    const refSize =
      activePlacedStickerId && placedStickersById[activePlacedStickerId]
        ? placedStickersById[activePlacedStickerId].size
        : currentSize;
    const nextMin = Math.min(minSize, Math.max(0.05, Number((refSize - 0.05).toFixed(4))));
    return setSizeBounds(nextMin, refSize);
  }

  function toggleCalibrationTool(forceState = undefined) {
    calibrationToolActive =
      typeof forceState === 'boolean' ? forceState : !calibrationToolActive;
    calibrationGizmoGroup.visible = calibrationToolActive;
    if (calibrationToolActive) {
      syncCalibrationGizmoTransform();
    }
    return calibrationToolActive;
  }

  function setStickerTagAndMessage(placedId, tagger, message) {
    const targetId = placedId || activePlacedStickerId;
    const rec = targetId ? placedStickersById[targetId] : null;
    if (!rec) return null;
    let rawTagger = tagger;
    let rawMessage = message;
    if (tagger && typeof tagger === 'object') {
      rawTagger = tagger.tagger;
      rawMessage = tagger.message;
    }
    const cleanTagger = String(rawTagger ?? '').trim().slice(0, 64);
    const cleanMessage = String(rawMessage ?? '').trim().slice(0, 280);
    rec.tagger = cleanTagger || 'ANONYMOUS';
    rec.message = cleanMessage;
    rec.updatedAt = Math.max(Date.now(), (rec.updatedAt || 0) + 1);
    return rec;
  }

  function deletePlacedSticker(placedId) {
    const targetId = placedId || activePlacedStickerId;
    const rec = targetId ? placedStickersById[targetId] : null;
    if (!rec) return false;
    const idx = placedStickers.indexOf(rec);
    if (idx !== -1) placedStickers.splice(idx, 1);
    const rIdx = placedRaycastTargets.indexOf(rec.instance.mesh);
    if (rIdx !== -1) placedRaycastTargets.splice(rIdx, 1);
    delete placedStickersById[targetId];
    rec.instance.dispose();
    if (activePlacedStickerId === targetId) {
      activePlacedStickerId = placedStickers.length > 0 ? placedStickers[placedStickers.length - 1].placedId : null;
    }
    if (calibrationToolActive) {
      syncCalibrationGizmoTransform();
    }
    return true;
  }

  function beginRepositionPlacedSticker(placedId) {
    const targetId = placedId || activePlacedStickerId;
    const rec = targetId ? placedStickersById[targetId] : null;
    if (!rec) return null;
    const baseAnchor = rec.anchorPosition || rec.position;
    return beginPlacement(rec.assetId, {
      repositionStickerId: rec.placedId,
      size: rec.size,
      rotationRad: rec.rotationRad,
      anchorPosition: new THREE.Vector3(baseAnchor.x, baseAnchor.y, baseAnchor.z),
      position: new THREE.Vector3(rec.position.x, rec.position.y, rec.position.z),
      normal: new THREE.Vector3(rec.normal.x, rec.normal.y, rec.normal.z),
      surfaceZone: rec.surfaceZone,
      surfaceLabel: rec.surfaceLabel,
    });
  }

  function raycastPlacedStickers(raycaster) {
    if (placedRaycastTargets.length === 0) return [];
    const hits = raycaster.intersectObjects(placedRaycastTargets, false);
    if (!hits || hits.length === 0) return [];
    const results = [];
    for (const h of hits) {
      const hitId = h.object.userData.placedStickerId;
      if (hitId && placedStickersById[hitId]) {
        results.push({
          placedSticker: placedStickersById[hitId],
          hit: h,
        });
      }
    }
    return results;
  }

  function getSticker(idOrIndex) {
    if (idOrIndex === undefined || idOrIndex === null) {
      return stickersById[selectedStickerId] || stickers[0] || null;
    }
    return stickersById[idOrIndex] || null;
  }

  function setSelectedSticker(idOrIndex) {
    const spec = STICKER_ASSET_BY_ID[idOrIndex];
    if (spec) {
      selectedStickerId = spec.id;
      if (placementActive) {
        beginPlacement(spec.id);
      }
      return true;
    }
    return false;
  }

  function setStickerBorderMode(idOrIndex, mode, tintHex = null) {
    const s = getSticker(idOrIndex);
    if (s) {
      s.setBorderMode(mode, tintHex);
      return true;
    }
    return false;
  }

  function setStickerPlacementMode(idOrIndex, mode) {
    const s = getSticker(idOrIndex);
    if (s) {
      s.setPlacementMode(mode);
      return true;
    }
    return false;
  }

  function setParams(idOrIndex, partialParams) {
    const s = getSticker(idOrIndex);
    if (s) {
      s.setMaterialParams(partialParams);
      return true;
    }
    return false;
  }

  function setGlobalParams(partialParams) {
    for (const s of stickers) {
      s.setMaterialParams(partialParams);
    }
    for (const p of placedStickers) {
      p.instance.setMaterialParams(partialParams);
    }
    return true;
  }

  function update(dt, elapsedTime, camera, activeChar = null) {
    const isLightVector =
      activeChar &&
      typeof activeChar.x === 'number' &&
      typeof activeChar.y === 'number' &&
      typeof activeChar.z === 'number' &&
      !activeChar.root;
    const lightDir = isLightVector ? activeChar : new THREE.Vector3(0.4, 0.8, 0.4);
    for (const s of stickers) {
      s.update(dt, elapsedTime, camera, lightDir);
    }
    for (const p of placedStickers) {
      p.instance.update(dt, elapsedTime, camera, lightDir);
    }
    if (previewInstance && previewInstance.group.visible) {
      previewInstance.update(dt, elapsedTime, camera, lightDir);
    }
  }

  function getTelemetry() {
    let decalCount = 0;
    let floatingCount = 0;
    let activeCount = 0;
    let groupACount = 0;
    let groupBCount = 0;

    for (const s of stickers) {
      activeCount++;
      if (s.spec.preProcessingMode === 'group_a_cutout') groupACount++;
      if (s.spec.preProcessingMode === 'group_b_full_frame') groupBCount++;
      const t = s.getTelemetry();
      if (t.placementMode === 'decal') decalCount++;
      else floatingCount++;
    }

    const activePlaced = activePlacedStickerId ? placedStickersById[activePlacedStickerId] : null;
    return {
      totalCount: stickers.length,
      activeCount,
      decalCount,
      floatingCount,
      groupACount,
      groupBCount,
      selectedStickerId,
      selectedTelemetry: stickersById[selectedStickerId] ? stickersById[selectedStickerId].getTelemetry() : null,
      placementActive,
      calibrationToolActive,
      minSize,
      maxSize,
      currentSize,
      currentRotationRad,
      placedCount: placedStickers.length,
      activePlacedStickerId,
      activePlacedSticker: activePlaced
        ? {
            placedId: activePlaced.placedId,
            assetId: activePlaced.assetId,
            code: activePlaced.code,
            anchorPosition: activePlaced.anchorPosition ? { ...activePlaced.anchorPosition } : { ...activePlaced.position },
            position: { ...activePlaced.position },
            normal: { ...activePlaced.normal },
            normalDotProduct: activePlaced.normalDotProduct,
            clearanceMeters: activePlaced.clearanceMeters,
            rotationRad: activePlaced.rotationRad,
            size: activePlaced.size,
            widthMeters: activePlaced.widthMeters,
            heightMeters: activePlaced.heightMeters,
            croppedAspectRatio: activePlaced.croppedAspectRatio,
            surfaceZone: activePlaced.surfaceZone,
            tagger: activePlaced.tagger,
            message: activePlaced.message,
          }
        : null,
    };
  }

  function exportSizeConfigJSON() {
    return JSON.stringify(
      {
        minSize,
        maxSize,
        currentSize,
        placedCount: placedStickers.length,
        placedStickers: placedStickers.map((p) => ({
          placedId: p.placedId,
          assetId: p.assetId,
          anchorPosition: p.anchorPosition || p.position,
          position: p.position,
          normal: p.normal,
          clearanceMeters: p.clearanceMeters,
          rotationRad: p.rotationRad,
          size: p.size,
          surfaceZone: p.surfaceZone,
          tagger: p.tagger,
          message: p.message,
        })),
      },
      null,
      2
    );
  }

  function dispose() {
    for (const s of stickers) {
      s.dispose();
    }
    for (const p of placedStickers) {
      p.instance.dispose();
    }
    if (previewInstance) {
      previewInstance.dispose();
      previewInstance = null;
    }
    stickers.length = 0;
    placedStickers.length = 0;
    placedRaycastTargets.length = 0;
    rootGroup.clear();
  }

  return {
    rootGroup,
    placedStickersGroup,
    previewGroup,
    calibrationGizmoGroup,
    boundingSurfaces,
    stickers,
    stickersById,
    placedStickers,
    placedStickersById,
    placedRaycastTargets,
    totalCount: stickers.length,
    getSticker,
    setSelectedSticker,
    setStickerBorderMode,
    setStickerPlacementMode,
    setParams,
    setGlobalParams,
    beginPlacement,
    updatePlacementPreviewFromRay,
    commitPlacement,
    cancelPlacement,
    placeStickerAt,
    selectPlacedSticker,
    getPlacedSticker: (placedId) => (placedId ? placedStickersById[placedId] || null : null),
    rotateActiveOrPlacedSticker,
    resizeActiveOrPlacedSticker,
    setSizeBounds,
    syncVisualEnvelope,
    captureCurrentAsMinSize,
    captureCurrentAsMaxSize,
    toggleCalibrationTool,
    setStickerTagAndMessage,
    deletePlacedSticker,
    beginRepositionPlacedSticker,
    raycastPlacedStickers,
    exportSizeConfigJSON,
    getSizeBounds: () => ({
      minSize,
      maxSize,
      currentSize,
      defaultSize: currentSize,
      calibrationToolActive,
    }),
    isPlacementActive: () => placementActive,
    getActivePlacedSticker: () => (activePlacedStickerId ? placedStickersById[activePlacedStickerId] || null : null),
    get selectedPlacedId() {
      return activePlacedStickerId;
    },
    get placementState() {
      return {
        active: placementActive,
        stickerId: selectedStickerId,
        sizeMeters: currentSize,
        rotationRad: currentRotationRad,
        lastHit: lastValidPreviewHit,
        repositioningStickerId,
      };
    },
    get calibrationState() {
      return {
        active: calibrationToolActive,
        minSize,
        maxSize,
        currentSize,
      };
    },
    update,
    getTelemetry,
    dispose,
  };
}
