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
      material.polygonOffsetFactor = -2;
      material.polygonOffsetUnits = -2;
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
    if (transformSpec.rotation) {
      group.rotation.copy(transformSpec.rotation);
    }
    if (transformSpec.tiltPitchRad !== undefined) {
      group.rotation.x = transformSpec.tiltPitchRad;
    }
    if (transformSpec.tiltYawRad !== undefined) {
      group.rotation.y = transformSpec.tiltYawRad;
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
    group,
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
// 5. Holographic Stickers System Controller (Ticket-006)
// ============================================================================

export function buildHolographicStickersSystem(options = {}) {
  const rootGroup = options.rootGroup || new THREE.Group();
  rootGroup.name = 'HolographicStickersRootGroup';
  rootGroup.renderOrder = 12;

  const stickers = [];
  const stickersById = {};
  let selectedStickerId = STICKER_ASSET_MANIFEST[0].id;

  for (const assetSpec of STICKER_ASSET_MANIFEST) {
    const instance = createHolographicStickerInstance(assetSpec, options);
    rootGroup.add(instance.group);
    stickers.push(instance);
    stickersById[assetSpec.id] = instance;
    stickersById[assetSpec.code] = instance;
    stickersById[assetSpec.index] = instance;
  }

  function getSticker(idOrIndex) {
    if (idOrIndex === undefined || idOrIndex === null) {
      return stickersById[selectedStickerId] || stickers[0];
    }
    return stickersById[idOrIndex] || null;
  }

  function setSelectedSticker(idOrIndex) {
    const s = getSticker(idOrIndex);
    if (s) {
      selectedStickerId = s.spec.id;
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

    return {
      totalCount: stickers.length,
      activeCount,
      decalCount,
      floatingCount,
      groupACount,
      groupBCount,
      selectedStickerId,
      selectedTelemetry: stickersById[selectedStickerId] ? stickersById[selectedStickerId].getTelemetry() : null,
    };
  }

  function dispose() {
    for (const s of stickers) {
      s.dispose();
    }
    stickers.length = 0;
    rootGroup.clear();
  }

  return {
    rootGroup,
    stickers,
    stickersById,
    totalCount: stickers.length,
    getSticker,
    setSelectedSticker,
    setStickerBorderMode,
    setStickerPlacementMode,
    setParams,
    setGlobalParams,
    update,
    getTelemetry,
    dispose,
  };
}
