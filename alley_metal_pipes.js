import * as THREE from 'three';

export const ALLEY_METAL_PIPES_ASSET_URL = './assets/pipes/alley_metal_pipes.glb?v=052';

/**
 * Evaluates the authoritative Freeman Alley bilateral wall surface X coordinates
 * x_L(z) (Left Wall, -X, screen-right when facing +Z) and x_R(z) (Right Wall, +X, screen-left)
 * calibrated directly against VISUAL_ALLEY_MESH in freeman_alley.glb.
 */
export function resolveAlleyWallProfileX(side, z) {
  const clampedZ = Math.max(0, Math.min(58.0, Number(z) || 0));
  if (side === 'left' || side === 'L') {
    if (clampedZ <= 26.2) {
      return -1.72 - 0.94 * (clampedZ / 26.2);
    }
    if (clampedZ <= 44.0) {
      return -1.92 + 0.28 * ((clampedZ - 26.2) / 17.8);
    }
    return -1.68 - 0.16 * Math.min(1.0, (clampedZ - 44.0) / 8.0);
  }
  if (clampedZ <= 34.0) {
    return 2.24 - 0.72 * (clampedZ / 34.0);
  }
  if (clampedZ <= 43.8) {
    return 1.52 + 0.35 * ((clampedZ - 34.0) / 9.8);
  }
  return 3.45 - 0.15 * Math.min(1.0, (clampedZ - 43.8) / 12.0);
}

/**
 * 8 Canonical Modular Industrial Rusty Pipe Variations (functional_specification_034.md §5)
 */
export const PIPE_VARIATION_SPECS = [
  {
    id: 'PIPE_VAR_01',
    archetype: 'STRAIGHT_TWIN_CONDUIT',
    mountCategory: 'WALL_MOUNTED',
    nominalDimensions: { lengthZ: 3.20, heightY: 0.38, depthX: 0.16 },
    finish: {
      name: 'Corroded Sienna Rust & Flaking Oxide',
      primaryColor: 0xc86432,
      secondaryColor: 0x8f3d1c,
      accentColor: 0xd97736,
      emissiveColor: 0x3b1608,
      metalness: 0.16,
      roughness: 0.88
    }
  },
  {
    id: 'PIPE_VAR_02',
    archetype: 'VERTICAL_STANDPIPE_RISER',
    mountCategory: 'WALL_MOUNTED',
    nominalDimensions: { lengthZ: 0.45, heightY: 3.50, depthX: 0.22 },
    finish: {
      name: 'Deep Oxidized Cast-Iron Rust & Weathered Crimson Valve',
      primaryColor: 0xb85628,
      secondaryColor: 0x7c3316,
      accentColor: 0xb91c1c,
      emissiveColor: 0x361306,
      metalness: 0.15,
      roughness: 0.90
    }
  },
  {
    id: 'PIPE_VAR_03',
    archetype: 'ELBOW_MANIFOLD_CLUSTER',
    mountCategory: 'WALL_MOUNTED',
    nominalDimensions: { lengthZ: 2.40, heightY: 1.65, depthX: 0.20 },
    finish: {
      name: 'Weathered Ochre Rust & Tarnished Brass Manifold',
      primaryColor: 0xd47236,
      secondaryColor: 0x9a441e,
      accentColor: 0xd97706,
      emissiveColor: 0x3d1707,
      metalness: 0.18,
      roughness: 0.86
    }
  },
  {
    id: 'PIPE_VAR_04',
    archetype: 'EXHAUST_VENT_GOOSENECK',
    mountCategory: 'WALL_MOUNTED',
    nominalDimensions: { lengthZ: 0.60, heightY: 2.90, depthX: 0.26 },
    finish: {
      name: 'Burnt Umber Exhaust Rust & Soot Patina',
      primaryColor: 0xa84c24,
      secondaryColor: 0x6e2e14,
      accentColor: 0xc2622e,
      emissiveColor: 0x2e1005,
      metalness: 0.14,
      roughness: 0.92
    }
  },
  {
    id: 'PIPE_VAR_05',
    archetype: 'HYDRAULIC_VALVE_BYPASS',
    mountCategory: 'WALL_MOUNTED',
    nominalDimensions: { lengthZ: 2.60, heightY: 1.15, depthX: 0.22 },
    finish: {
      name: 'Heavily Pitted Orange-Iron Rust & Faded Safety Collars',
      primaryColor: 0xc45e2c,
      secondaryColor: 0x92400e,
      accentColor: 0xb91c1c,
      emissiveColor: 0x381506,
      metalness: 0.16,
      roughness: 0.89
    }
  },
  {
    id: 'PIPE_VAR_06',
    archetype: 'CROSS_ALLEY_OVERHEAD_ARCH',
    mountCategory: 'CROSS_WALL_BRIDGE',
    nominalDimensions: { minSpanX: 3.21, maxSpanX: 4.90, diameterM: 0.125 },
    finish: {
      name: 'Heavy Corroded Red-Oxide Bridge Iron',
      primaryColor: 0xbe5a2a,
      secondaryColor: 0x853818,
      accentColor: 0xd47236,
      emissiveColor: 0x361406,
      metalness: 0.17,
      roughness: 0.88
    }
  },
  {
    id: 'PIPE_VAR_07',
    archetype: 'CROSS_ALLEY_TRUSS_TWIN_SPAN',
    mountCategory: 'CROSS_WALL_BRIDGE',
    nominalDimensions: { minSpanX: 3.21, maxSpanX: 4.90, heightY: 0.32 },
    finish: {
      name: 'Weathered Terracotta Rust & Corroded Structural Truss',
      primaryColor: 0xcb6834,
      secondaryColor: 0x7c3416,
      accentColor: 0xb45309,
      emissiveColor: 0x3a1507,
      metalness: 0.18,
      roughness: 0.87
    }
  },
  {
    id: 'PIPE_VAR_08',
    archetype: 'CROSS_ALLEY_STEPPED_Z_BRIDGE',
    mountCategory: 'CROSS_WALL_BRIDGE',
    nominalDimensions: { minSpanX: 3.21, maxSpanX: 4.90, stepDeltaY: 0.65 },
    finish: {
      name: 'Oxidized Copper-Rust & Pitted Cast-Iron Fittings',
      primaryColor: 0xc25926,
      secondaryColor: 0x78350f,
      accentColor: 0xb91c1c,
      emissiveColor: 0x381406,
      metalness: 0.16,
      roughness: 0.89
    }
  }
];

/**
 * Authoritative 15-Placement Spatial Schedule (functional_specification_034.md §6)
 * - 5 Left-Wall ('L') placements: ALLEY_PIPE_01, 04, 07, 10, 13
 * - 5 Right-Wall ('R') placements: ALLEY_PIPE_02, 05, 08, 11, 14
 * - 5 Cross-Wall ('CROSS') placements: ALLEY_PIPE_03, 06, 09, 12, 15
 */
export const ALLEY_PIPE_PLACEMENT_SCHEDULE = [
  {
    id: 'ALLEY_PIPE_01',
    index: 1,
    zone: 'Entrance Mouth Left',
    variationId: 'PIPE_VAR_02',
    mountMode: 'L',
    side: 'left',
    z: 2.20,
    relY: 0.05,
    topRelY: 3.55,
    standoffX: 0.09
  },
  {
    id: 'ALLEY_PIPE_02',
    index: 2,
    zone: 'Entrance Mouth Right',
    variationId: 'PIPE_VAR_01',
    mountMode: 'R',
    side: 'right',
    z: 3.80,
    relY: 2.65,
    standoffX: 0.08
  },
  {
    id: 'ALLEY_PIPE_03',
    index: 3,
    zone: 'Station 01 Overhead Arch',
    variationId: 'PIPE_VAR_06',
    mountMode: 'CROSS',
    side: 'both',
    z: 5.45,
    relY: 3.65,
    standoffX: 0.0
  },
  {
    id: 'ALLEY_PIPE_04',
    index: 4,
    zone: 'Post-Station 01 Left Run',
    variationId: 'PIPE_VAR_03',
    mountMode: 'L',
    side: 'left',
    z: 8.10,
    relY: 2.15,
    standoffX: 0.09
  },
  {
    id: 'ALLEY_PIPE_05',
    index: 5,
    zone: 'Station 02 Upper Bypass',
    variationId: 'PIPE_VAR_05',
    mountMode: 'R',
    side: 'right',
    z: 10.40,
    relY: 3.10,
    standoffX: 0.09
  },
  {
    id: 'ALLEY_PIPE_06',
    index: 6,
    zone: 'Front-Mid Truss Gantry',
    variationId: 'PIPE_VAR_07',
    mountMode: 'CROSS',
    side: 'both',
    z: 13.20,
    relY: 4.20,
    standoffX: 0.0
  },
  {
    id: 'ALLEY_PIPE_07',
    index: 7,
    zone: 'Station 03 Upper Conduit',
    variationId: 'PIPE_VAR_01',
    mountMode: 'L',
    side: 'left',
    z: 15.60,
    relY: 3.05,
    standoffX: 0.08
  },
  {
    id: 'ALLEY_PIPE_08',
    index: 8,
    zone: 'Mid-Corridor Right Vent',
    variationId: 'PIPE_VAR_04',
    mountMode: 'R',
    side: 'right',
    z: 17.20,
    relY: 1.80,
    topRelY: 4.70,
    standoffX: 0.10
  },
  {
    id: 'ALLEY_PIPE_09',
    index: 9,
    zone: 'Mid-Alley Stepped Z-Bridge',
    variationId: 'PIPE_VAR_08',
    mountMode: 'CROSS',
    side: 'both',
    z: 21.80,
    relY: 3.55,
    rightRelY: 4.20,
    stepDeltaY: 0.65,
    standoffX: 0.0
  },
  {
    id: 'ALLEY_PIPE_10',
    index: 10,
    zone: 'Deep-Mid Left Valve Loop',
    variationId: 'PIPE_VAR_05',
    mountMode: 'L',
    side: 'left',
    z: 24.50,
    relY: 1.95,
    standoffX: 0.09
  },
  {
    id: 'ALLEY_PIPE_11',
    index: 11,
    zone: 'Post-Station 05 Right Riser',
    variationId: 'PIPE_VAR_02',
    mountMode: 'R',
    side: 'right',
    z: 28.10,
    relY: 0.05,
    topRelY: 3.55,
    standoffX: 0.09
  },
  {
    id: 'ALLEY_PIPE_12',
    index: 12,
    zone: 'Station 06 Overhead Arch',
    variationId: 'PIPE_VAR_06',
    mountMode: 'CROSS',
    side: 'both',
    z: 33.30,
    relY: 3.85,
    standoffX: 0.0
  },
  {
    id: 'ALLEY_PIPE_13',
    index: 13,
    zone: 'Far Corridor Left Exhaust',
    variationId: 'PIPE_VAR_04',
    mountMode: 'L',
    side: 'left',
    z: 36.40,
    relY: 1.60,
    topRelY: 4.50,
    standoffX: 0.10
  },
  {
    id: 'ALLEY_PIPE_14',
    index: 14,
    zone: 'Pre-Transition Right Manifold',
    variationId: 'PIPE_VAR_03',
    mountMode: 'R',
    side: 'right',
    z: 40.10,
    relY: 2.25,
    standoffX: 0.09
  },
  {
    id: 'ALLEY_PIPE_15',
    index: 15,
    zone: 'Back-Alley Wide Truss Span',
    variationId: 'PIPE_VAR_07',
    mountMode: 'CROSS',
    side: 'both',
    z: 48.60,
    relY: 3.95,
    standoffX: 0.0
  }
];

const REQUIRED_KIT_PIECES = [
  'Pipe_Bracket',
  'Pipe_Joint_90',
  'Pipe_Junction_3Way',
  'Pipe_Junction_4Way',
  'Pipe_Straight_ExtraLong',
  'Pipe_Straight_Long',
  'Pipe_Straight_Medium',
  'Pipe_Straight_Short',
  'Pipe_Valve_Handle',
  'Pipe_Valve_Junction',
  'Solo_Thick_Pipe'
];

function countObjectTriangles(rootObject) {
  let triangles = 0;
  rootObject.traverse((node) => {
    if (node.isMesh && node.geometry) {
      if (node.geometry.index) {
        triangles += Math.floor(node.geometry.index.count / 3);
      } else if (node.geometry.attributes?.position) {
        triangles += Math.floor(node.geometry.attributes.position.count / 3);
      }
    }
  });
  return triangles;
}

/**
 * Extracts normalized Sketchfab kit meshes and creates shared PBR material palettes
 * for the 8 variations.
 */
function extractKitCatalogAndMaterials(pipeGLTF) {
  if (!pipeGLTF || !pipeGLTF.scene) {
    throw new Error(
      `[AlleyMetalPipes] Missing or invalid glTF payload from ${ALLEY_METAL_PIPES_ASSET_URL}.`
    );
  }

  const kitMeshes = {};
  const bakedVariationNodes = {};
  let baseMaps = { map: null, metalnessRoughnessMap: null, normalMap: null };

  pipeGLTF.scene.traverse((child) => {
    if (child.isMesh) {
      kitMeshes[child.name] = child;
      if (!baseMaps.map && child.material) {
        const mat = Array.isArray(child.material) ? child.material[0] : child.material;
        if (mat) {
          baseMaps = {
            map: mat.map || null,
            metalnessRoughnessMap: mat.metalnessRoughnessMap || mat.roughnessMap || null,
            normalMap: mat.normalMap || null
          };
        }
      }
    }
    if (child.name && child.name.startsWith('PIPE_VAR_')) {
      bakedVariationNodes[child.name] = child;
    }
  });

  for (const reqName of REQUIRED_KIT_PIECES) {
    if (!kitMeshes[reqName]) {
      throw new Error(
        `[AlleyMetalPipes] Required Sketchfab kit mesh "${reqName}" missing inside ${ALLEY_METAL_PIPES_ASSET_URL}.`
      );
    }
  }

  function applyMatteRustySurfaceOptics(mat) {
    mat.envMapIntensity = 0.0;
    mat.onBeforeCompile = (shader) => {
      shader.fragmentShader = shader.fragmentShader.replace(
        '#include <lights_fragment_end>',
        `#include <lights_fragment_end>
        // Eliminate grazing-angle Fresnel specular glare and apply warm rusty wrap-diffuse
        reflectedLight.directSpecular *= 0.02;
        reflectedLight.indirectSpecular *= 0.0;
        float wrapNdotV = clamp(abs(dot(normalize(geometryNormal), normalize(geometryViewDir))), 0.0, 1.0);
        reflectedLight.indirectDiffuse += diffuseColor.rgb * (0.42 + 0.36 * wrapNdotV);`
      );
    };
    mat.customProgramCacheKey = () => 'matte_corroded_rust_pipe_v1';
    return mat;
  }

  const variationMaterials = {};
  for (const spec of PIPE_VARIATION_SPECS) {
    const { finish } = spec;
    variationMaterials[spec.id] = {
      primary: applyMatteRustySurfaceOptics(
        new THREE.MeshStandardMaterial({
          name: `${spec.id}_PrimaryMat`,
          color: new THREE.Color(finish.primaryColor),
          map: baseMaps.map,
          roughnessMap: baseMaps.metalnessRoughnessMap,
          normalMap: baseMaps.normalMap,
          normalScale: new THREE.Vector2(0.45, 0.45),
          emissive: new THREE.Color(finish.primaryColor),
          emissiveMap: baseMaps.map,
          emissiveIntensity: 0.48,
          metalness: 0.06,
          roughness: 0.96,
          depthTest: true,
          depthWrite: true
        })
      ),
      secondary: applyMatteRustySurfaceOptics(
        new THREE.MeshStandardMaterial({
          name: `${spec.id}_SecondaryMat`,
          color: new THREE.Color(finish.secondaryColor),
          map: baseMaps.map,
          roughnessMap: baseMaps.metalnessRoughnessMap,
          normalMap: baseMaps.normalMap,
          normalScale: new THREE.Vector2(0.45, 0.45),
          emissive: new THREE.Color(finish.secondaryColor),
          emissiveMap: baseMaps.map,
          emissiveIntensity: 0.44,
          metalness: 0.05,
          roughness: 0.97,
          depthTest: true,
          depthWrite: true
        })
      ),
      accent: applyMatteRustySurfaceOptics(
        new THREE.MeshStandardMaterial({
          name: `${spec.id}_AccentMat`,
          color: new THREE.Color(finish.accentColor),
          map: baseMaps.map,
          roughnessMap: baseMaps.metalnessRoughnessMap,
          normalMap: baseMaps.normalMap,
          normalScale: new THREE.Vector2(0.4, 0.4),
          emissive: new THREE.Color(finish.accentColor),
          emissiveMap: baseMaps.map,
          emissiveIntensity: 0.42,
          metalness: 0.06,
          roughness: 0.95,
          depthTest: true,
          depthWrite: true
        })
      )
    };
  }

  return { kitMeshes, bakedVariationNodes, variationMaterials };
}

function spawnKitPart(kitMeshes, pieceName, material, pos, rotEuler, scaleVec) {
  const srcMesh = kitMeshes[pieceName];
  if (!srcMesh) {
    throw new Error(`[AlleyMetalPipes] Unknown kit piece "${pieceName}".`);
  }
  const mesh = new THREE.Mesh(srcMesh.geometry, material);
  mesh.name = pieceName;
  mesh.position.set(pos[0], pos[1], pos[2]);
  if (rotEuler) {
    mesh.rotation.set(rotEuler[0], rotEuler[1], rotEuler[2]);
  }
  if (scaleVec) {
    mesh.scale.set(scaleVec[0], scaleVec[1], scaleVec[2]);
  }
  mesh.castShadow = false;
  mesh.receiveShadow = true;
  mesh.renderOrder = 2;
  return mesh;
}

/**
 * Constructs a wall-mounted variation group (PIPE_VAR_01 .. PIPE_VAR_05) in local space where:
 * - Local Z is along the corridor wall
 * - Local Y is vertical height
 * - Local -X contacts the masonry wall face (and +X points into the corridor interior)
 * When mounted on the Right Wall ('R'), the group is mirrored/rotated around X so its wall brackets
 * extend in +X into x_R(z) and its valves/manifolds face -X into the alley.
 */
function buildWallVariationInstance(variationId, kitMeshes, matPalette) {
  const group = new THREE.Group();
  group.name = `${variationId}_Instance`;
  const { primary, secondary, accent } = matPalette;
  const halfPi = Math.PI * 0.5;

  if (variationId === 'PIPE_VAR_01') {
    // STRAIGHT_TWIN_CONDUIT: 3.20m (Z) x 0.38m (Y) x 0.16m (X)
    // Upper main conduit (two 1.60m segments along Z)
    group.add(spawnKitPart(kitMeshes, 'Pipe_Straight_ExtraLong', primary, [0, 0.11, -0.80], [0, halfPi, 0], [0.96, 0.90, 0.90]));
    group.add(spawnKitPart(kitMeshes, 'Pipe_Straight_ExtraLong', primary, [0, 0.11, 0.80], [0, halfPi, 0], [0.96, 0.90, 0.90]));
    // Lower secondary conduit
    group.add(spawnKitPart(kitMeshes, 'Pipe_Straight_ExtraLong', secondary, [0, -0.11, -0.80], [0, halfPi, 0], [0.96, 0.68, 0.68]));
    group.add(spawnKitPart(kitMeshes, 'Pipe_Straight_ExtraLong', secondary, [0, -0.11, 0.80], [0, halfPi, 0], [0.96, 0.68, 0.68]));
    // 4 cast-iron wall saddle clamps & mid-span couplings
    for (const zClamp of [-1.35, -0.45, 0.45, 1.35]) {
      group.add(spawnKitPart(kitMeshes, 'Pipe_Valve_Junction', secondary, [-0.03, 0.11, zClamp], [0, halfPi, 0], [0.55, 1.05, 1.05]));
      group.add(spawnKitPart(kitMeshes, 'Pipe_Valve_Junction', secondary, [-0.03, -0.11, zClamp], [0, halfPi, 0], [0.50, 0.82, 0.82]));
    }
    group.add(spawnKitPart(kitMeshes, 'Pipe_Junction_3Way', accent, [0, 0.0, 0.0], [0, halfPi, 0], [0.55, 0.75, 0.75]));
  } else if (variationId === 'PIPE_VAR_02') {
    // VERTICAL_STANDPIPE_RISER: 0.45m (Z) x 3.50m (Y) x 0.22m (X)
    // Base is at local Y = 0, rising to Y = 3.50m
    group.add(spawnKitPart(kitMeshes, 'Pipe_Bracket', primary, [0.02, 1.75, 0], [0, 0, 0], [0.95, 1.12, 0.95]));
    group.add(spawnKitPart(kitMeshes, 'Solo_Thick_Pipe', secondary, [-0.02, 0.65, 0], [0, 0, 0], [0.42, 1.05, 0.42]));
    group.add(spawnKitPart(kitMeshes, 'Pipe_Straight_ExtraLong', primary, [0.04, 2.55, 0], [0, 0, halfPi], [1.05, 0.95, 0.95]));
    // Intermediate T-fitting + crimson handwheel gate valve at 1.35m height
    group.add(spawnKitPart(kitMeshes, 'Pipe_Junction_3Way', secondary, [0.04, 1.35, 0], [0, 0, halfPi], [0.85, 0.90, 0.90]));
    group.add(spawnKitPart(kitMeshes, 'Pipe_Valve_Junction', secondary, [0.06, 1.85, 0], [0, 0, halfPi], [0.95, 0.95, 0.95]));
    group.add(spawnKitPart(kitMeshes, 'Pipe_Valve_Handle', accent, [0.18, 1.85, 0], [0, 0, halfPi], [1.45, 1.45, 1.45]));
    // 3 wall masonry standoffs contacting local X = -0.09
    for (const yClamp of [0.45, 1.60, 2.95]) {
      group.add(spawnKitPart(kitMeshes, 'Pipe_Valve_Junction', secondary, [-0.04, yClamp, 0], [0, 0, 0], [0.55, 0.95, 0.95]));
    }
  } else if (variationId === 'PIPE_VAR_03') {
    // ELBOW_MANIFOLD_CLUSTER: 2.40m (Z) x 1.65m (Y) x 0.20m (X)
    const offsets = [
      { y: 0.22, zLen: 1.15, mat: primary },
      { y: 0.0, zLen: 1.02, mat: secondary },
      { y: -0.22, zLen: 0.90, mat: primary }
    ];
    for (const row of offsets) {
      group.add(spawnKitPart(kitMeshes, 'Pipe_Straight_ExtraLong', row.mat, [0, row.y, -0.45], [0, halfPi, 0], [row.zLen, 0.78, 0.78]));
      group.add(spawnKitPart(kitMeshes, 'Pipe_Joint_90', secondary, [0, row.y + 0.14, 0.45], [0, halfPi, 0], [0.85, 0.85, 0.85]));
      group.add(spawnKitPart(kitMeshes, 'Pipe_Straight_Medium', row.mat, [0, row.y + 0.62, 0.58], [0, 0, halfPi], [1.10, 0.78, 0.78]));
    }
    // Distribution header box & pressure valve wheel
    group.add(spawnKitPart(kitMeshes, 'Pipe_Junction_4Way', secondary, [0.02, 0.55, 0.58], [0, halfPi, 0], [0.95, 0.95, 0.95]));
    group.add(spawnKitPart(kitMeshes, 'Pipe_Valve_Junction', accent, [-0.03, 0.0, -0.95], [0, halfPi, 0], [0.65, 1.15, 1.15]));
    group.add(spawnKitPart(kitMeshes, 'Pipe_Valve_Handle', accent, [0.14, 0.55, 0.58], [0, 0, halfPi], [1.35, 1.35, 1.35]));
  } else if (variationId === 'PIPE_VAR_04') {
    // EXHAUST_VENT_GOOSENECK: 0.60m (Z) x 2.90m (Y) x 0.26m (X), base at local Y=0 to Y=2.90m
    group.add(spawnKitPart(kitMeshes, 'Solo_Thick_Pipe', primary, [0.0, 0.65, 0], [0, 0, 0], [0.52, 1.15, 0.52]));
    group.add(spawnKitPart(kitMeshes, 'Solo_Thick_Pipe', primary, [0.0, 1.85, 0], [0, 0, 0], [0.52, 1.15, 0.52]));
    group.add(spawnKitPart(kitMeshes, 'Pipe_Bracket', secondary, [0.02, 1.45, 0], [0, 0, 0], [1.0, 0.96, 1.0]));
    // Ribbed expansion bellows joint
    group.add(spawnKitPart(kitMeshes, 'Pipe_Valve_Junction', accent, [0.02, 1.25, 0], [0, 0, halfPi], [1.25, 1.25, 1.25]));
    // 180-degree gooseneck weather hood at top (Y ≈ 2.75m)
    group.add(spawnKitPart(kitMeshes, 'Pipe_Joint_90', secondary, [0.08, 2.68, 0], [0, 0, Math.PI], [1.25, 1.25, 1.25]));
    group.add(spawnKitPart(kitMeshes, 'Pipe_Joint_90', secondary, [0.22, 2.62, 0], [0, 0, -halfPi], [1.15, 1.15, 1.15]));
  } else if (variationId === 'PIPE_VAR_05') {
    // HYDRAULIC_VALVE_BYPASS: 2.60m (Z) x 1.15m (Y) x 0.22m (X)
    group.add(spawnKitPart(kitMeshes, 'Pipe_Straight_ExtraLong', primary, [0, 0.24, 0], [0, halfPi, 0], [1.52, 0.95, 0.95]));
    // T-branches dropping into U-shaped bypass loop
    group.add(spawnKitPart(kitMeshes, 'Pipe_Junction_3Way', secondary, [0, 0.16, -0.68], [Math.PI, halfPi, 0], [0.85, 0.85, 0.85]));
    group.add(spawnKitPart(kitMeshes, 'Pipe_Junction_3Way', secondary, [0, 0.16, 0.68], [Math.PI, halfPi, 0], [0.85, 0.85, 0.85]));
    group.add(spawnKitPart(kitMeshes, 'Pipe_Joint_90', secondary, [0, -0.34, -0.68], [0, halfPi, 0], [0.85, 0.85, 0.85]));
    group.add(spawnKitPart(kitMeshes, 'Pipe_Joint_90', secondary, [0, -0.34, 0.68], [0, -halfPi, 0], [0.85, 0.85, 0.85]));
    group.add(spawnKitPart(kitMeshes, 'Pipe_Straight_Long', primary, [0, -0.44, 0], [0, halfPi, 0], [1.42, 0.82, 0.82]));
    // Dual industrial shutoff valves + crimson handwheels + safety amber collars
    group.add(spawnKitPart(kitMeshes, 'Pipe_Valve_Junction', secondary, [0, -0.44, -0.32], [0, halfPi, 0], [0.95, 0.95, 0.95]));
    group.add(spawnKitPart(kitMeshes, 'Pipe_Valve_Handle', accent, [0.14, -0.44, -0.32], [0, 0, halfPi], [1.35, 1.35, 1.35]));
    group.add(spawnKitPart(kitMeshes, 'Pipe_Valve_Junction', secondary, [0, 0.24, 0.32], [0, halfPi, 0], [0.95, 0.95, 0.95]));
    group.add(spawnKitPart(kitMeshes, 'Pipe_Valve_Handle', accent, [0.14, 0.24, 0.32], [0, 0, halfPi], [1.35, 1.35, 1.35]));
    // Wall anchor collars at ends
    group.add(spawnKitPart(kitMeshes, 'Pipe_Valve_Junction', secondary, [-0.03, 0.24, -1.12], [0, halfPi, 0], [0.55, 1.05, 1.05]));
    group.add(spawnKitPart(kitMeshes, 'Pipe_Valve_Junction', secondary, [-0.03, 0.24, 1.12], [0, halfPi, 0], [0.55, 1.05, 1.05]));
  }

  return group;
}

/**
 * Constructs a Cross-Alley Bridge variation (PIPE_VAR_06, PIPE_VAR_07, PIPE_VAR_08) spanning
 * the exact horizontal distance ΔX(z) = x_R(z) - x_L(z) from x_L(z) to x_R(z) without
 * oval distortion on elbows, valves, or wall plates (functional_specification_034.md §8.1).
 *
 * Group origin is placed at (0, worldY, z) in world X, so local X equals world X ∈ [xLeft, xRight].
 */
function buildCrossWallBridgeInstance(variationId, xLeft, xRight, stepDeltaY, kitMeshes, matPalette) {
  const group = new THREE.Group();
  group.name = `${variationId}_SpanInstance`;
  const { primary, secondary, accent } = matPalette;
  const spanWidth = xRight - xLeft;
  const xMid = 0.5 * (xLeft + xRight);
  const halfPi = Math.PI * 0.5;
  // Pipe_Straight_ExtraLong has length 1.6783m along X.
  const straightBaseLen = 1.6783;

  if (variationId === 'PIPE_VAR_06') {
    // CROSS_ALLEY_OVERHEAD_ARCH: Single heavy-gauge horizontal overhead main (Ø0.125m)
    // terminating in unscaled 90° downward wall-entry elbows & wall plates flush at xLeft and xRight.
    const innerSpan = Math.max(1.0, spanWidth - 0.36);
    const segScaleX = (innerSpan * 0.5) / straightBaseLen;
    group.add(spawnKitPart(kitMeshes, 'Pipe_Straight_ExtraLong', primary, [xLeft + 0.18 + innerSpan * 0.25, 0, 0], [0, 0, 0], [segScaleX, 1.15, 1.15]));
    group.add(spawnKitPart(kitMeshes, 'Pipe_Straight_ExtraLong', primary, [xRight - 0.18 - innerSpan * 0.25, 0, 0], [0, 0, 0], [segScaleX, 1.15, 1.15]));
    // Unscaled 90° wall entry elbows & masonry wall collars flush on Left and Right walls
    group.add(spawnKitPart(kitMeshes, 'Pipe_Joint_90', secondary, [xLeft + 0.18, -0.12, 0], [0, 0, halfPi], [1.05, 1.05, 1.05]));
    group.add(spawnKitPart(kitMeshes, 'Pipe_Joint_90', secondary, [xRight - 0.18, -0.12, 0], [0, Math.PI, halfPi], [1.05, 1.05, 1.05]));
    group.add(spawnKitPart(kitMeshes, 'Pipe_Valve_Junction', secondary, [xLeft + 0.08, 0, 0], [0, 0, 0], [0.50, 1.35, 1.35]));
    group.add(spawnKitPart(kitMeshes, 'Pipe_Valve_Junction', secondary, [xRight - 0.08, 0, 0], [0, 0, 0], [0.50, 1.35, 1.35]));
    // 2 center flange rings
    group.add(spawnKitPart(kitMeshes, 'Pipe_Valve_Junction', accent, [xMid - 0.48, 0, 0], [0, 0, 0], [0.85, 1.25, 1.25]));
    group.add(spawnKitPart(kitMeshes, 'Pipe_Valve_Junction', accent, [xMid + 0.48, 0, 0], [0, 0, 0], [0.85, 1.25, 1.25]));
  } else if (variationId === 'PIPE_VAR_07') {
    // CROSS_ALLEY_TRUSS_TWIN_SPAN: Dual vertically stacked cross-alley pipes (separated by 0.24m)
    // linked by 5 unscaled vertical strut spacers and bilateral wall anchor plates.
    const segScaleX = (spanWidth * 0.5) / straightBaseLen;
    for (const yOff of [0.12, -0.12]) {
      group.add(spawnKitPart(kitMeshes, 'Pipe_Straight_ExtraLong', primary, [xLeft + spanWidth * 0.25, yOff, 0], [0, 0, 0], [segScaleX, 0.92, 0.92]));
      group.add(spawnKitPart(kitMeshes, 'Pipe_Straight_ExtraLong', primary, [xRight - spanWidth * 0.25, yOff, 0], [0, 0, 0], [segScaleX, 0.92, 0.92]));
    }
    // 5 vertical truss struts evenly spaced across the span (unscaled in X/Z so zero oval distortion)
    for (let i = 1; i <= 5; i++) {
      const xStrut = xLeft + (spanWidth * i) / 6;
      const piece = i === 3 ? 'Pipe_Junction_4Way' : 'Pipe_Junction_3Way';
      group.add(spawnKitPart(kitMeshes, piece, secondary, [xStrut, 0, 0], [0, 0, 0], [0.55, 0.65, 0.85]));
    }
    // Bilateral wall anchor plates flush at xLeft and xRight
    group.add(spawnKitPart(kitMeshes, 'Pipe_Valve_Junction', secondary, [xLeft + 0.08, 0.12, 0], [0, 0, 0], [0.50, 1.25, 1.25]));
    group.add(spawnKitPart(kitMeshes, 'Pipe_Valve_Junction', secondary, [xLeft + 0.08, -0.12, 0], [0, 0, 0], [0.50, 1.25, 1.25]));
    group.add(spawnKitPart(kitMeshes, 'Pipe_Valve_Junction', secondary, [xRight - 0.08, 0.12, 0], [0, 0, 0], [0.50, 1.25, 1.25]));
    group.add(spawnKitPart(kitMeshes, 'Pipe_Valve_Junction', secondary, [xRight - 0.08, -0.12, 0], [0, 0, 0], [0.50, 1.25, 1.25]));
  } else if (variationId === 'PIPE_VAR_08') {
    // CROSS_ALLEY_STEPPED_Z_BRIDGE: Departing Left Wall at Y_L (local Y=0), rising ΔY = +0.65m
    // at corridor mid-span (X ≈ xMid) via dual unscaled elbows to anchor on Right Wall at Y_R = Y_L + 0.65m.
    const dY = Number.isFinite(stepDeltaY) ? stepDeltaY : 0.65;
    const halfSpan = spanWidth * 0.5;
    const horizScaleX = (halfSpan - 0.14) / straightBaseLen;
    // Left lower horizontal leg (Y = 0) from xLeft to xMid
    group.add(spawnKitPart(kitMeshes, 'Pipe_Straight_ExtraLong', primary, [xLeft + (halfSpan - 0.14) * 0.5, 0, 0], [0, 0, 0], [horizScaleX, 1.0, 1.0]));
    // Unscaled mid-span upward elbows & vertical riser at xMid
    group.add(spawnKitPart(kitMeshes, 'Pipe_Joint_90', secondary, [xMid - 0.08, 0.12, 0], [0, 0, 0], [0.95, 0.95, 0.95]));
    group.add(spawnKitPart(kitMeshes, 'Pipe_Straight_Short', primary, [xMid, dY * 0.5, 0], [0, 0, halfPi], [dY / 0.5431, 0.95, 0.95]));
    group.add(spawnKitPart(kitMeshes, 'Pipe_Joint_90', secondary, [xMid + 0.08, dY - 0.12, 0], [0, 0, Math.PI], [0.95, 0.95, 0.95]));
    // Right upper horizontal leg (Y = dY) from xMid to xRight
    group.add(spawnKitPart(kitMeshes, 'Pipe_Straight_ExtraLong', primary, [xRight - (halfSpan - 0.14) * 0.5, dY, 0], [0, 0, 0], [horizScaleX, 1.0, 1.0]));
    // Mid-span pressure relief valve & crimson handwheel
    group.add(spawnKitPart(kitMeshes, 'Pipe_Valve_Junction', secondary, [xMid - 0.55, 0, 0], [0, 0, 0], [0.95, 1.05, 1.05]));
    group.add(spawnKitPart(kitMeshes, 'Pipe_Valve_Handle', accent, [xMid - 0.55, 0, 0.14], [halfPi, 0, 0], [1.35, 1.35, 1.35]));
    // Bilateral wall anchor collars flush at (xLeft, 0) and (xRight, dY)
    group.add(spawnKitPart(kitMeshes, 'Pipe_Valve_Junction', secondary, [xLeft + 0.08, 0, 0], [0, 0, 0], [0.50, 1.30, 1.30]));
    group.add(spawnKitPart(kitMeshes, 'Pipe_Valve_Junction', secondary, [xRight - 0.08, dY, 0], [0, 0, 0], [0.50, 1.30, 1.30]));
  }

  return group;
}

/**
 * Builds and mounts the Freeman Alley Metal Pipework Subsystem (functional_specification_034.md):
 * - 8 modular industrial pipe variations (PIPE_VAR_01 .. PIPE_VAR_08)
 * - 15 spatial placements (ALLEY_PIPE_01 .. ALLEY_PIPE_15: 5 Left, 5 Right, 5 Cross-Wall Bridges)
 */
export function buildAlleyMetalPipesSubsystem({
  pipeGLTF,
  rootGroup,
  floorY = 0,
  uTimeUniform = null,
  applyStencilReject = null
} = {}) {
  if (!rootGroup) {
    throw new Error('[AlleyMetalPipes] Missing rootGroup container.');
  }

  const { kitMeshes, bakedVariationNodes, variationMaterials } =
    extractKitCatalogAndMaterials(pipeGLTF);

  const pipesRootGroup = new THREE.Group();
  pipesRootGroup.name = 'AlleyMetalPipesRootGroup';
  rootGroup.add(pipesRootGroup);

  // Build catalog of the 8 canonical variation templates (PIPE_VAR_01 .. PIPE_VAR_08)
  const variations = {};
  for (const spec of PIPE_VARIATION_SPECS) {
    const matPalette = variationMaterials[spec.id];
    const templateGroup =
      spec.mountCategory === 'WALL_MOUNTED'
        ? buildWallVariationInstance(spec.id, kitMeshes, matPalette)
        : buildCrossWallBridgeInstance(spec.id, -1.58, 1.85, 0.65, kitMeshes, matPalette);
    templateGroup.name = spec.id;
    const triangleCount = countObjectTriangles(templateGroup);
    variations[spec.id] = {
      ...spec,
      triangleCount,
      templateGroup,
      bakedGlbNodePresent: Boolean(bakedVariationNodes[spec.id])
    };
  }

  const placements = [];
  const placementsById = {};
  let leftWallCount = 0;
  let rightWallCount = 0;
  let crossWallCount = 0;
  let minCrossWallClearanceY = Infinity;
  let totalTriangles = 0;

  for (const entry of ALLEY_PIPE_PLACEMENT_SCHEDULE) {
    const varSpec = variations[entry.variationId];
    if (!varSpec) {
      throw new Error(
        `[AlleyMetalPipes] Placement "${entry.id}" references unknown variation "${entry.variationId}".`
      );
    }

    const matPalette = variationMaterials[entry.variationId];
    const xLeftWall = resolveAlleyWallProfileX('left', entry.z);
    const xRightWall = resolveAlleyWallProfileX('right', entry.z);
    const worldY = floorY + entry.relY;

    const placementGroup = new THREE.Group();
    placementGroup.name = entry.id;

    let anchorX = 0;
    let spanWidthM = 0;
    let undersideClearanceRelY = entry.relY;

    if (entry.mountMode === 'L') {
      leftWallCount += 1;
      anchorX = xLeftWall + entry.standoffX;
      const instance = buildWallVariationInstance(entry.variationId, kitMeshes, matPalette);
      placementGroup.position.set(anchorX, worldY, entry.z);
      placementGroup.add(instance);
      spanWidthM = varSpec.nominalDimensions.depthX || 0.20;
    } else if (entry.mountMode === 'R') {
      rightWallCount += 1;
      anchorX = xRightWall - entry.standoffX;
      const instance = buildWallVariationInstance(entry.variationId, kitMeshes, matPalette);
      // Mirror across X so wall brackets extend in +X into x_R(z) and valves face -X into the alley
      instance.scale.x = -1;
      placementGroup.position.set(anchorX, worldY, entry.z);
      placementGroup.add(instance);
      spanWidthM = varSpec.nominalDimensions.depthX || 0.20;
    } else if (entry.mountMode === 'CROSS') {
      crossWallCount += 1;
      spanWidthM = Number((xRightWall - xLeftWall).toFixed(4));
      anchorX = Number((0.5 * (xLeftWall + xRightWall)).toFixed(4));
      const instance = buildCrossWallBridgeInstance(
        entry.variationId,
        xLeftWall,
        xRightWall,
        entry.stepDeltaY,
        kitMeshes,
        matPalette
      );
      placementGroup.position.set(0, worldY, entry.z);
      placementGroup.add(instance);
      undersideClearanceRelY = entry.relY;
      if (undersideClearanceRelY < minCrossWallClearanceY) {
        minCrossWallClearanceY = undersideClearanceRelY;
      }
    } else {
      throw new Error(`[AlleyMetalPipes] Invalid mountMode "${entry.mountMode}" on ${entry.id}.`);
    }

    const triangleCount = countObjectTriangles(placementGroup);
    totalTriangles += triangleCount;

    const record = {
      id: entry.id,
      index: entry.index,
      zone: entry.zone,
      variationId: entry.variationId,
      archetype: varSpec.archetype,
      mountMode: entry.mountMode,
      side: entry.side,
      z: entry.z,
      relY: entry.relY,
      worldY: Number(worldY.toFixed(4)),
      xLeftWall: Number(xLeftWall.toFixed(4)),
      xRightWall: Number(xRightWall.toFixed(4)),
      anchorX: Number(anchorX.toFixed(4)),
      spanWidthM: Number(spanWidthM.toFixed(4)),
      undersideClearanceRelY: Number(undersideClearanceRelY.toFixed(4)),
      triangleCount,
      group: placementGroup
    };

    placementGroup.userData.alleyPipePlacement = record;
    pipesRootGroup.add(placementGroup);
    placements.push(record);
    placementsById[entry.id] = record;
    placementsById[entry.index] = record;
  }

  const steamSystem = buildPipeSteamSubsystem({
    placements,
    rootGroup: pipesRootGroup,
    floorY,
    uTimeUniform,
    applyStencilReject
  });

  function update(dt, timeSec, camera) {
    return steamSystem.update(dt, timeSec, camera);
  }

  function triggerSteamBurst(pipeIdOrIndex = 'all', durationSec = 3.0) {
    return steamSystem.triggerSteamBurst(pipeIdOrIndex, durationSec);
  }

  function setAllSteamActive(activeBool) {
    return steamSystem.setAllSteamActive(activeBool);
  }

  return {
    rootGroup: pipesRootGroup,
    assetUrl: ALLEY_METAL_PIPES_ASSET_URL,
    variations,
    placements,
    placementsById,
    steamSystem,
    update,
    triggerSteamBurst,
    setAllSteamActive,
    getTelemetry() {
      const steamTel = steamSystem.getTelemetry();
      return {
        totalCount: placements.length,
        variationCount: Object.keys(variations).length,
        leftWallCount,
        rightWallCount,
        crossWallCount,
        minCrossWallClearanceY: Number.isFinite(minCrossWallClearanceY)
          ? Number(minCrossWallClearanceY.toFixed(2))
          : 0,
        totalTriangles,
        activeSteamEmitterCount: steamTel.activeEmitterCount,
        activeSteamParticleCount: steamTel.activeParticleCount,
        steamDrawCalls: steamTel.drawCalls,
        steamAllForcedActive: steamTel.allForcedActive
      };
    }
  };
}

// ============================================================================
// Intermittent Industrial Pipe Steam Venting Subsystem (functional_specification_036.md)
// ============================================================================

/**
 * Variation-level local nozzle offsets and discharge vectors (Spec 036 §4.1).
 * For WALL_MOUNTED variations, local +X points outward from the wall into the alley
 * prior to Right-Wall ('R') X-mirroring.
 */
export const PIPE_STEAM_NOZZLE_SPECS = Object.freeze({
  PIPE_VAR_01: Object.freeze({
    variationId: 'PIPE_VAR_01',
    featureLabel: 'Center 3-Way T-Junction & Mid-Span Flange Coupling',
    primaryOffset: Object.freeze([0.08, 0.00, 0.00]),
    primaryNormal: Object.freeze([0.88, 0.25, 0.12]),
    secondaryOffset: Object.freeze([0.06, 0.11, -0.45]),
    secondaryNormal: Object.freeze([0.90, 0.22, -0.10]),
    plumeReachM: 0.92
  }),
  PIPE_VAR_02: Object.freeze({
    variationId: 'PIPE_VAR_02',
    featureLabel: 'Crimson Handwheel Gate Valve Stem (Y=1.85m) & T-Fitting (Y=1.35m)',
    primaryOffset: Object.freeze([0.20, 1.85, 0.00]),
    primaryNormal: Object.freeze([0.92, 0.30, 0.04]),
    secondaryOffset: Object.freeze([0.10, 1.35, 0.00]),
    secondaryNormal: Object.freeze([0.90, 0.26, -0.12]),
    plumeReachM: 1.02
  }),
  PIPE_VAR_03: Object.freeze({
    variationId: 'PIPE_VAR_03',
    featureLabel: '4-Way Distribution Header Box & Pressure Relief Wheel',
    primaryOffset: Object.freeze([0.16, 0.55, 0.58]),
    primaryNormal: Object.freeze([0.86, 0.40, 0.15]),
    secondaryOffset: Object.freeze([0.06, 0.00, -0.95]),
    secondaryNormal: Object.freeze([0.90, 0.28, -0.12]),
    plumeReachM: 0.96
  }),
  PIPE_VAR_04: Object.freeze({
    variationId: 'PIPE_VAR_04',
    featureLabel: '180° Gooseneck Weather Hood Mouth (Y=2.58m) & Expansion Bellows (Y=1.25m)',
    primaryOffset: Object.freeze([0.26, 2.58, 0.00]),
    primaryNormal: Object.freeze([0.72, -0.42, 0.00]),
    secondaryOffset: Object.freeze([0.10, 1.25, 0.00]),
    secondaryNormal: Object.freeze([0.94, 0.22, 0.00]),
    plumeReachM: 1.15
  }),
  PIPE_VAR_05: Object.freeze({
    variationId: 'PIPE_VAR_05',
    featureLabel: 'Lower Bypass Shutoff Valve (Y=-0.44m) & Upper Main Valve (Y=+0.24m)',
    primaryOffset: Object.freeze([0.16, -0.44, -0.32]),
    primaryNormal: Object.freeze([0.90, -0.16, 0.10]),
    secondaryOffset: Object.freeze([0.16, 0.24, 0.32]),
    secondaryNormal: Object.freeze([0.88, 0.26, -0.10]),
    plumeReachM: 0.94
  }),
  PIPE_VAR_06: Object.freeze({
    variationId: 'PIPE_VAR_06',
    featureLabel: 'Overhead Arch Bolted Flange Couplings (xMid ± 0.48m)',
    primaryOffset: Object.freeze([-0.48, -0.06, 0.00]),
    primaryNormal: Object.freeze([0.14, -0.78, 0.61]),
    secondaryOffset: Object.freeze([0.48, -0.06, 0.00]),
    secondaryNormal: Object.freeze([-0.14, -0.78, -0.61]),
    plumeReachM: 1.08
  }),
  PIPE_VAR_07: Object.freeze({
    variationId: 'PIPE_VAR_07',
    featureLabel: 'Central 4-Way Overhead Truss Junction (xMid)',
    primaryOffset: Object.freeze([0.00, -0.08, 0.05]),
    primaryNormal: Object.freeze([0.15, -0.72, 0.68]),
    secondaryOffset: Object.freeze([-0.55, 0.12, -0.04]),
    secondaryNormal: Object.freeze([-0.15, -0.68, -0.72]),
    plumeReachM: 1.04
  }),
  PIPE_VAR_08: Object.freeze({
    variationId: 'PIPE_VAR_08',
    featureLabel: 'Stepped Z-Bridge Mid-Span Pressure Relief Valve (xMid - 0.55m)',
    primaryOffset: Object.freeze([-0.55, -0.04, 0.15]),
    primaryNormal: Object.freeze([0.20, -0.65, 0.73]),
    secondaryOffset: Object.freeze([0.00, 0.32, 0.06]),
    secondaryNormal: Object.freeze([-0.18, -0.60, 0.78]),
    plumeReachM: 1.08
  })
});

/**
 * Authoritative 15-Pipe Asynchronous Venting Interval & Acoustic Hiss Schedule (Spec 036 §5.2).
 * Uses coprime/staggered cycle periods and phase offsets so pipes vent organically at different
 * times across the corridor while guaranteeing 3–6 active plumes at any timestamp t.
 */
export const PIPE_STEAM_INTERVAL_SCHEDULE = Object.freeze({
  ALLEY_PIPE_01: Object.freeze({
    pipeId: 'ALLEY_PIPE_01',
    cyclePeriodSec: 7.40,
    phaseOffsetSec: 0.35,
    attackSec: 0.22,
    sustainSec: 1.85,
    decaySec: 0.85,
    hissCenterFreqHz: 2450
  }),
  ALLEY_PIPE_02: Object.freeze({
    pipeId: 'ALLEY_PIPE_02',
    cyclePeriodSec: 9.15,
    phaseOffsetSec: 7.20,
    attackSec: 0.25,
    sustainSec: 1.55,
    decaySec: 0.90,
    hissCenterFreqHz: 2780
  }),
  ALLEY_PIPE_03: Object.freeze({
    pipeId: 'ALLEY_PIPE_03',
    cyclePeriodSec: 11.30,
    phaseOffsetSec: 7.50,
    attackSec: 0.30,
    sustainSec: 2.20,
    decaySec: 1.10,
    hissCenterFreqHz: 1980
  }),
  ALLEY_PIPE_04: Object.freeze({
    pipeId: 'ALLEY_PIPE_04',
    cyclePeriodSec: 6.85,
    phaseOffsetSec: 1.45,
    attackSec: 0.20,
    sustainSec: 1.60,
    decaySec: 0.80,
    hissCenterFreqHz: 2620
  }),
  ALLEY_PIPE_05: Object.freeze({
    pipeId: 'ALLEY_PIPE_05',
    cyclePeriodSec: 8.60,
    phaseOffsetSec: 0.15,
    attackSec: 0.22,
    sustainSec: 1.95,
    decaySec: 0.88,
    hissCenterFreqHz: 2340
  }),
  ALLEY_PIPE_06: Object.freeze({
    pipeId: 'ALLEY_PIPE_06',
    cyclePeriodSec: 12.70,
    phaseOffsetSec: 4.40,
    attackSec: 0.32,
    sustainSec: 2.40,
    decaySec: 1.15,
    hissCenterFreqHz: 1890
  }),
  ALLEY_PIPE_07: Object.freeze({
    pipeId: 'ALLEY_PIPE_07',
    cyclePeriodSec: 7.95,
    phaseOffsetSec: 5.20,
    attackSec: 0.24,
    sustainSec: 1.70,
    decaySec: 0.85,
    hissCenterFreqHz: 2850
  }),
  ALLEY_PIPE_08: Object.freeze({
    pipeId: 'ALLEY_PIPE_08',
    cyclePeriodSec: 6.20,
    phaseOffsetSec: 0.40,
    attackSec: 0.28,
    sustainSec: 2.10,
    decaySec: 0.95,
    hissCenterFreqHz: 1920
  }),
  ALLEY_PIPE_09: Object.freeze({
    pipeId: 'ALLEY_PIPE_09',
    cyclePeriodSec: 10.45,
    phaseOffsetSec: 2.10,
    attackSec: 0.25,
    sustainSec: 2.05,
    decaySec: 1.00,
    hissCenterFreqHz: 2210
  }),
  ALLEY_PIPE_10: Object.freeze({
    pipeId: 'ALLEY_PIPE_10',
    cyclePeriodSec: 8.10,
    phaseOffsetSec: 6.10,
    attackSec: 0.22,
    sustainSec: 1.80,
    decaySec: 0.85,
    hissCenterFreqHz: 2540
  }),
  ALLEY_PIPE_11: Object.freeze({
    pipeId: 'ALLEY_PIPE_11',
    cyclePeriodSec: 9.80,
    phaseOffsetSec: 1.10,
    attackSec: 0.24,
    sustainSec: 1.90,
    decaySec: 0.90,
    hissCenterFreqHz: 2410
  }),
  ALLEY_PIPE_12: Object.freeze({
    pipeId: 'ALLEY_PIPE_12',
    cyclePeriodSec: 13.40,
    phaseOffsetSec: 8.90,
    attackSec: 0.30,
    sustainSec: 2.30,
    decaySec: 1.10,
    hissCenterFreqHz: 2040
  }),
  ALLEY_PIPE_13: Object.freeze({
    pipeId: 'ALLEY_PIPE_13',
    cyclePeriodSec: 6.55,
    phaseOffsetSec: 3.60,
    attackSec: 0.28,
    sustainSec: 2.15,
    decaySec: 0.95,
    hissCenterFreqHz: 1950
  }),
  ALLEY_PIPE_14: Object.freeze({
    pipeId: 'ALLEY_PIPE_14',
    cyclePeriodSec: 7.65,
    phaseOffsetSec: 0.25,
    attackSec: 0.22,
    sustainSec: 1.75,
    decaySec: 0.85,
    hissCenterFreqHz: 2690
  }),
  ALLEY_PIPE_15: Object.freeze({
    pipeId: 'ALLEY_PIPE_15',
    cyclePeriodSec: 11.90,
    phaseOffsetSec: 5.50,
    attackSec: 0.32,
    sustainSec: 2.35,
    decaySec: 1.10,
    hissCenterFreqHz: 1860
  })
});

function normalizeVec3Tuple(x, y, z) {
  const len = Math.hypot(x, y, z) || 1.0;
  return {
    x: Number((x / len).toFixed(4)),
    y: Number((y / len).toFixed(4)),
    z: Number((z / len).toFixed(4))
  };
}

/**
 * Resolves exact world-space primary and secondary steam nozzle positions and outward
 * discharge normals for any of the 15 placed pipe assemblies (Spec 036 §4).
 */
export function resolvePipeNozzleWorldTransform(placementRecord) {
  const nozzleSpec =
    PIPE_STEAM_NOZZLE_SPECS[placementRecord.variationId] || PIPE_STEAM_NOZZLE_SPECS.PIPE_VAR_01;
  const pOff = nozzleSpec.primaryOffset;
  const pNorm = nozzleSpec.primaryNormal;
  const sOff = nozzleSpec.secondaryOffset;
  const sNorm = nozzleSpec.secondaryNormal;

  if (placementRecord.mountMode === 'L') {
    const primaryPos = {
      x: Number((placementRecord.anchorX + pOff[0]).toFixed(4)),
      y: Number((placementRecord.worldY + pOff[1]).toFixed(4)),
      z: Number((placementRecord.z + pOff[2]).toFixed(4))
    };
    const secondaryPos = {
      x: Number((placementRecord.anchorX + sOff[0]).toFixed(4)),
      y: Number((placementRecord.worldY + sOff[1]).toFixed(4)),
      z: Number((placementRecord.z + sOff[2]).toFixed(4))
    };
    return {
      featureLabel: nozzleSpec.featureLabel,
      plumeReachM: nozzleSpec.plumeReachM,
      primaryNozzlePos: primaryPos,
      primaryDischargeNormal: normalizeVec3Tuple(pNorm[0], pNorm[1], pNorm[2]),
      secondaryNozzlePos: secondaryPos,
      secondaryDischargeNormal: normalizeVec3Tuple(sNorm[0], sNorm[1], sNorm[2])
    };
  }

  if (placementRecord.mountMode === 'R') {
    // Right-wall instances have instance.scale.x = -1, mirroring local X across anchorX
    const primaryPos = {
      x: Number((placementRecord.anchorX - pOff[0]).toFixed(4)),
      y: Number((placementRecord.worldY + pOff[1]).toFixed(4)),
      z: Number((placementRecord.z + pOff[2]).toFixed(4))
    };
    const secondaryPos = {
      x: Number((placementRecord.anchorX - sOff[0]).toFixed(4)),
      y: Number((placementRecord.worldY + sOff[1]).toFixed(4)),
      z: Number((placementRecord.z + sOff[2]).toFixed(4))
    };
    return {
      featureLabel: nozzleSpec.featureLabel,
      plumeReachM: nozzleSpec.plumeReachM,
      primaryNozzlePos: primaryPos,
      primaryDischargeNormal: normalizeVec3Tuple(-pNorm[0], pNorm[1], pNorm[2]),
      secondaryNozzlePos: secondaryPos,
      secondaryDischargeNormal: normalizeVec3Tuple(-sNorm[0], sNorm[1], sNorm[2])
    };
  }

  // Cross-wall bridges ('CROSS') are centered around xMid = anchorX in world X
  const xMid = placementRecord.anchorX;
  const primaryPos = {
    x: Number((xMid + pOff[0]).toFixed(4)),
    y: Number((placementRecord.worldY + pOff[1]).toFixed(4)),
    z: Number((placementRecord.z + pOff[2]).toFixed(4))
  };
  const secondaryPos = {
    x: Number((xMid + sOff[0]).toFixed(4)),
    y: Number((placementRecord.worldY + sOff[1]).toFixed(4)),
    z: Number((placementRecord.z + sOff[2]).toFixed(4))
  };
  return {
    featureLabel: nozzleSpec.featureLabel,
    plumeReachM: nozzleSpec.plumeReachM,
    primaryNozzlePos: primaryPos,
    primaryDischargeNormal: normalizeVec3Tuple(pNorm[0], pNorm[1], pNorm[2]),
    secondaryNozzlePos: secondaryPos,
    secondaryDischargeNormal: normalizeVec3Tuple(sNorm[0], sNorm[1], sNorm[2])
  };
}

/**
 * Evaluates the 4-stage thermodynamic steam venting envelope E_i(t) in [0, 1]
 * for a given pipe schedule entry at simulation time `timeSec` (Spec 036 §5.1).
 */
export function evaluatePipeSteamEnvelope(scheduleEntry, timeSec = 0.0, overrideRemainingSec = 0.0, forceAllActive = false) {
  if (forceAllActive || overrideRemainingSec > 0.0) {
    const flutter =
      0.92 +
      0.05 * Math.sin(2.0 * Math.PI * 5.5 * timeSec) +
      0.03 * Math.cos(2.0 * Math.PI * 13.0 * timeSec);
    return {
      isVenting: true,
      stage: 'ACTIVE_VENTING',
      envelope: Number(Math.max(0.0, Math.min(1.0, flutter)).toFixed(4)),
      cycleTimeSec: 0.0,
      activeDurationSec: Number(
        (scheduleEntry.attackSec + scheduleEntry.sustainSec + scheduleEntry.decaySec).toFixed(3)
      )
    };
  }

  const T = scheduleEntry.cyclePeriodSec;
  const phi = scheduleEntry.phaseOffsetSec;
  const tAtt = scheduleEntry.attackSec;
  const tSus = scheduleEntry.sustainSec;
  const tDec = scheduleEntry.decaySec;
  const activeDur = tAtt + tSus + tDec;

  const t = Math.max(0.0, Number(timeSec) || 0.0);
  const tau = (((t + phi) % T) + T) % T;

  let stage = 'STANDBY';
  let env = 0.0;

  if (tau < tAtt) {
    stage = 'PRESSURE_BUILD_ATTACK';
    const u = Math.max(0.0, Math.min(1.0, tau / Math.max(1e-4, tAtt)));
    env = 1.0 - Math.pow(1.0 - u, 3.0);
  } else if (tau < tAtt + tSus) {
    stage = 'ACTIVE_VENTING';
    env =
      0.88 +
      0.08 * Math.sin(2.0 * Math.PI * 5.5 * tau + phi) +
      0.04 * Math.cos(2.0 * Math.PI * 13.0 * tau);
  } else if (tau < activeDur) {
    stage = 'DISSIPATION_DECAY';
    const v = Math.max(0.0, Math.min(1.0, (tau - (tAtt + tSus)) / Math.max(1e-4, tDec)));
    env = Math.pow(1.0 - v, 2.0) * Math.exp(-2.4 * v);
  }

  const clampedEnv = Math.max(0.0, Math.min(1.0, env));
  return {
    isVenting: clampedEnv > 0.03,
    stage,
    envelope: Number(clampedEnv.toFixed(4)),
    cycleTimeSec: Number(tau.toFixed(3)),
    activeDurationSec: Number(activeDur.toFixed(3))
  };
}

function buildPipeSteamSubsystem({
  placements,
  rootGroup,
  uTimeUniform,
  applyStencilReject
}) {
  const pipeCount = placements.length;
  const particlesPerPipe = 64;
  const totalParticles = pipeCount * particlesPerPipe; // 15 * 64 = 960 camera-facing vapor puffs

  // 4 vertices & 6 indices per camera-facing billboard quad
  const vertexCount = totalParticles * 4;
  const indexCount = totalParticles * 6;

  const centerPositions = new Float32Array(vertexCount * 3);
  const uvs = new Float32Array(vertexCount * 2);
  const puffParams = new Float32Array(vertexCount * 4); // (radius, alpha, spinAngleRad, normAge)
  const jetStretch = new Float32Array(vertexCount * 4); // (dirX, dirY, dirZ, stretchAmount)
  const indices = new Uint16Array(indexCount);

  for (let i = 0; i < totalParticles; i++) {
    const vBase = i * 4;
    const iBase = i * 6;

    indices[iBase + 0] = vBase + 0;
    indices[iBase + 1] = vBase + 1;
    indices[iBase + 2] = vBase + 2;
    indices[iBase + 3] = vBase + 0;
    indices[iBase + 4] = vBase + 2;
    indices[iBase + 5] = vBase + 3;

    uvs[(vBase + 0) * 2 + 0] = 0.0;
    uvs[(vBase + 0) * 2 + 1] = 0.0;
    uvs[(vBase + 1) * 2 + 0] = 1.0;
    uvs[(vBase + 1) * 2 + 1] = 0.0;
    uvs[(vBase + 2) * 2 + 0] = 1.0;
    uvs[(vBase + 2) * 2 + 1] = 1.0;
    uvs[(vBase + 3) * 2 + 0] = 0.0;
    uvs[(vBase + 3) * 2 + 1] = 1.0;
  }

  const geom = new THREE.BufferGeometry();
  const posAttr = new THREE.BufferAttribute(centerPositions, 3);
  const uvAttr = new THREE.BufferAttribute(uvs, 2);
  const puffAttr = new THREE.BufferAttribute(puffParams, 4);
  const stretchAttr = new THREE.BufferAttribute(jetStretch, 4);

  geom.setAttribute('position', posAttr);
  geom.setAttribute('uv', uvAttr);
  geom.setAttribute('aPuffParams', puffAttr);
  geom.setAttribute('aJetStretch', stretchAttr);
  geom.setIndex(new THREE.BufferAttribute(indices, 1));

  const steamMat = new THREE.ShaderMaterial({
    name: 'PipeSteamPlumeMaterial',
    uniforms: {
      uTime: uTimeUniform || { value: 0.0 },
      uCoreVaporColor: { value: new THREE.Color(0xffffff) },   // Pure bright condensing nozzle jet core
      uMidVaporColor: { value: new THREE.Color(0xece4da) },    // Luminous warm-silver mist body
      uShadowVaporColor: { value: new THREE.Color(0xa69888) }, // Soft misty slate-cream outer veil
      uAmberRimColor: { value: new THREE.Color(0xf59e0b) },    // Cyber-amber alarm/lamppost rim scatter
      uHotAmberColor: { value: new THREE.Color(0xfde68a) },    // Warm incandescent highlight
      fogColor: { value: new THREE.Color(0x0b0501) },
      fogDensity: { value: 0.012 }
    },
    vertexShader: `
      attribute vec4 aPuffParams;
      attribute vec4 aJetStretch;
      varying vec2 vUv;
      varying float vAlpha;
      varying float vSpin;
      varying float vNormAge;
      varying vec3 vWorldPos;
      varying vec2 vCorner;

      void main() {
        vUv = uv;
        float radius = aPuffParams.x;
        vAlpha = aPuffParams.y;
        vSpin = aPuffParams.z;
        vNormAge = aPuffParams.w;

        if (vAlpha <= 0.002 || radius <= 0.001) {
          vWorldPos = position;
          vCorner = vec2(0.0);
          gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
          return;
        }

        // Camera-facing billboard basis extracted from viewMatrix
        vec3 camRight = vec3(viewMatrix[0][0], viewMatrix[1][0], viewMatrix[2][0]);
        vec3 camUp = vec3(viewMatrix[0][1], viewMatrix[1][1], viewMatrix[2][1]);

        vec2 corner = (uv - 0.5) * 2.0;
        vCorner = corner;

        float c = cos(vSpin);
        float s = sin(vSpin);
        vec2 rotCorner = vec2(corner.x * c - corner.y * s, corner.x * s + corner.y * c);

        vec3 billboardOffset = (camRight * rotCorner.x + camUp * rotCorner.y) * radius;
        // High-velocity nozzle jet elongation along discharge direction for young puffs
        vec3 jetElongation = aJetStretch.xyz * (corner.y * radius * aJetStretch.w);

        vec3 displacedWorld = position + billboardOffset + jetElongation;
        vWorldPos = displacedWorld;
        gl_Position = projectionMatrix * viewMatrix * vec4(displacedWorld, 1.0);
      }
    `,
    fragmentShader: `
      uniform float uTime;
      uniform vec3 uCoreVaporColor;
      uniform vec3 uMidVaporColor;
      uniform vec3 uShadowVaporColor;
      uniform vec3 uAmberRimColor;
      uniform vec3 uHotAmberColor;
      uniform vec3 fogColor;
      uniform float fogDensity;

      varying vec2 vUv;
      varying float vAlpha;
      varying float vSpin;
      varying float vNormAge;
      varying vec3 vWorldPos;
      varying vec2 vCorner;

      float hash21(vec2 p) {
        p = fract(p * vec2(234.34, 435.345));
        p += dot(p, p + 34.23);
        return fract(p.x * p.y);
      }

      float valueNoise(vec2 p) {
        vec2 i = floor(p);
        vec2 f = fract(p);
        vec2 u = f * f * (3.0 - 2.0 * f);
        return mix(
          mix(hash21(i + vec2(0.0, 0.0)), hash21(i + vec2(1.0, 0.0)), u.x),
          mix(hash21(i + vec2(0.0, 1.0)), hash21(i + vec2(1.0, 1.0)), u.x),
          u.y
        );
      }

      float fbmSteam(vec2 p) {
        float v = 0.0;
        v += 0.54 * valueNoise(p);
        p = p * 2.07 + vec2(1.7, 9.2);
        v += 0.30 * valueNoise(p);
        p = p * 2.13 + vec2(8.3, 2.8);
        v += 0.16 * valueNoise(p);
        return v;
      }

      void main() {
        if (vAlpha <= 0.002) discard;

        float r2 = dot(vCorner, vCorner);
        if (r2 > 1.0) discard;

        // Animated billowing multi-octave FBM vapor turbulence
        vec2 flowUv = vUv * 2.6 + vec2(vSpin * 1.3 + uTime * 0.35, vNormAge * 2.4 - uTime * 0.48);
        float n1 = fbmSteam(flowUv);
        float n2 = fbmSteam(flowUv * 1.75 - vec2(uTime * 0.32, -uTime * 0.40) + n1 * 0.90);
        float cloudDensity = mix(n1, n2, 0.52);

        // Perturb radial edge with turbulent lobes so puffs have wispy, curling edges
        float radialMask = pow(clamp(1.0 - r2 + (cloudDensity - 0.45) * 0.36 * (1.0 - r2), 0.0, 1.0), 1.35);
        // Concentrated flash-condensation core near nozzle (vNormAge < 0.28)
        float nozzleJetBoost = 1.0 + 0.55 * (1.0 - smoothstep(0.0, 0.30, vNormAge)) * (1.0 - r2);
        float finalAlpha = vAlpha * radialMask * (0.72 + 0.55 * cloudDensity) * nozzleJetBoost;
        if (finalAlpha < 0.004) discard;

        // 3D volumetric puff normal approximation for top/rim lighting vs soft mist underside
        float topLight = clamp(0.58 + 0.42 * vCorner.y + (cloudDensity - 0.5) * 0.35, 0.0, 1.0);
        float coreHotspot = clamp((1.0 - r2) * (1.0 - 0.55 * vNormAge), 0.0, 1.0);

        // Proximity to entrance lamppost & staggered corridor alarm lights for warm amber scattering
        float lampProximity = exp(-pow(length(vWorldPos.xz - vec2(0.15, 2.20)) * 0.24, 2.0));
        float alarmZMod = 0.5 + 0.5 * cos((vWorldPos.z - 6.0) * 0.48);
        float wallProximity = smoothstep(0.20, 1.55, abs(vWorldPos.x));
        float amberScatter = clamp(lampProximity * 0.65 + alarmZMod * wallProximity * 0.55, 0.14, 0.78);

        vec3 baseVapor = mix(uShadowVaporColor, uMidVaporColor, topLight);
        baseVapor = mix(baseVapor, uCoreVaporColor, clamp(coreHotspot * 0.75 + pow(topLight, 1.6) * 0.45, 0.0, 1.0));

        vec3 amberTint = mix(uAmberRimColor, uHotAmberColor, topLight * 0.65 + coreHotspot * 0.35);
        vec3 litSteamColor = mix(baseVapor, amberTint, amberScatter * (0.28 + 0.24 * r2));

        // Exponential squared depth fog matching Freeman Alley
        float dist = length(vWorldPos - cameraPosition);
        float fogFactor = 1.0 - exp(-pow(dist * fogDensity, 2.0));
        vec3 finalRgb = mix(litSteamColor, fogColor, clamp(fogFactor * 0.75, 0.0, 1.0));

        gl_FragColor = vec4(finalRgb, clamp(finalAlpha, 0.0, 0.86));
      }
    `,
    transparent: true,
    depthTest: true,
    depthWrite: false,
    blending: THREE.NormalBlending,
    side: THREE.DoubleSide
  });

  if (applyStencilReject) {
    applyStencilReject(steamMat);
  }

  const batchMesh = new THREE.Mesh(geom, steamMat);
  batchMesh.name = 'PipeSteamPlumeBatchMesh';
  batchMesh.frustumCulled = false;
  batchMesh.renderOrder = 8;
  batchMesh.raycast = () => {};
  rootGroup.add(batchMesh);

  // Build 15 Emitter State Records & Pre-Allocated Particle Pool (48 particles per pipe)
  const emitters = [];
  const emittersById = {};
  const particlePool = [];

  for (let i = 0; i < pipeCount; i++) {
    const placement = placements[i];
    const sched =
      PIPE_STEAM_INTERVAL_SCHEDULE[placement.id] || {
        pipeId: placement.id,
        cyclePeriodSec: 8.0 + (i % 5) * 1.1,
        phaseOffsetSec: (i * 1.73) % 8.0,
        attackSec: 0.24,
        sustainSec: 1.90,
        decaySec: 0.90,
        hissCenterFreqHz: 2350
      };
    const nozzleInfo = resolvePipeNozzleWorldTransform(placement);
    const initialEval = evaluatePipeSteamEnvelope(sched, 0.0, 0.0, false);

    const slotStart = i * particlesPerPipe;
    const slotEnd = slotStart + particlesPerPipe;

    const emitterRecord = {
      id: `STEAM_${placement.id}`,
      pipeId: placement.id,
      pipeIndex: placement.index,
      zone: placement.zone,
      variationId: placement.variationId,
      archetype: placement.archetype,
      mountMode: placement.mountMode,
      side: placement.side,
      featureLabel: nozzleInfo.featureLabel,
      plumeReachM: nozzleInfo.plumeReachM,
      nozzleWorldPos: { ...nozzleInfo.primaryNozzlePos },
      dischargeNormal: { ...nozzleInfo.primaryDischargeNormal },
      secondaryNozzleWorldPos: { ...nozzleInfo.secondaryNozzlePos },
      secondaryDischargeNormal: { ...nozzleInfo.secondaryDischargeNormal },
      cyclePeriodSec: sched.cyclePeriodSec,
      phaseOffsetSec: sched.phaseOffsetSec,
      attackSec: sched.attackSec,
      sustainSec: sched.sustainSec,
      decaySec: sched.decaySec,
      activeDurationSec: initialEval.activeDurationSec,
      hissCenterFreqHz: sched.hissCenterFreqHz,
      isVenting: initialEval.isVenting,
      stage: initialEval.stage,
      envelope: initialEval.envelope,
      cycleTimeSec: initialEval.cycleTimeSec,
      burstOverrideRemainingSec: 0.0,
      spawnAccumulator: 0.0,
      nextSlotCursor: 0,
      activeParticleCount: 0,
      slotStart,
      slotEnd,
      scheduleSpec: sched,
      placementGroup: placement.group
    };

    placement.steamEmitter = emitterRecord;
    emitters.push(emitterRecord);
    emittersById[placement.id] = emitterRecord;
    emittersById[placement.index] = emitterRecord;

    for (let p = 0; p < particlesPerPipe; p++) {
      particlePool.push({
        pipeIndex: i,
        active: false,
        x: nozzleInfo.primaryNozzlePos.x,
        y: nozzleInfo.primaryNozzlePos.y,
        z: nozzleInfo.primaryNozzlePos.z,
        vx: 0.0,
        vy: 0.0,
        vz: 0.0,
        dirX: nozzleInfo.primaryDischargeNormal.x,
        dirY: nozzleInfo.primaryDischargeNormal.y,
        dirZ: nozzleInfo.primaryDischargeNormal.z,
        ageSec: 0.0,
        lifeSec: 1.15,
        r0: 0.065,
        r1: 0.38,
        spawnEnvelope: 1.0,
        spinAngle: (p * 0.71) % (Math.PI * 2.0),
        spinSpeed: (p % 2 === 0 ? 1.0 : -1.0) * (0.45 + (p % 5) * 0.14),
        seedPhase: ((i * 48 + p) * 0.173) % 10.0
      });
    }
  }

  let allForcedActive = false;
  let activeEmitterCount = 0;
  let activeParticleCount = 0;
  let deterministicSeedCounter = 1;

  function nextPseudoRandom() {
    deterministicSeedCounter = (deterministicSeedCounter * 1664525 + 1013904223) >>> 0;
    return (deterministicSeedCounter & 0x0fffffff) / 0x10000000;
  }

  function spawnParticleForEmitter(em) {
    const slotIdx = em.slotStart + (em.nextSlotCursor % particlesPerPipe);
    em.nextSlotCursor = (em.nextSlotCursor + 1) % particlesPerPipe;
    const p = particlePool[slotIdx];

    const r1 = nextPseudoRandom();
    const r2 = nextPseudoRandom();
    const r3 = nextPseudoRandom();
    const r4 = nextPseudoRandom();

    // 72% primary nozzle, 28% secondary nozzle
    const useSecondary = r1 > 0.72;
    const nozPos = useSecondary ? em.secondaryNozzleWorldPos : em.nozzleWorldPos;
    const nozNorm = useSecondary ? em.secondaryDischargeNormal : em.dischargeNormal;

    // Slight angular cone spread (~12 degrees) around discharge normal
    const spreadX = (r2 - 0.5) * 0.36;
    const spreadY = (r3 - 0.5) * 0.32;
    const spreadZ = (r4 - 0.5) * 0.36;
    let dx = nozNorm.x + spreadX;
    let dy = nozNorm.y + spreadY;
    let dz = nozNorm.z + spreadZ;
    const dLen = Math.hypot(dx, dy, dz) || 1.0;
    dx /= dLen;
    dy /= dLen;
    dz /= dLen;

    const jetSpeed = (1.65 + 1.25 * em.envelope) * (0.85 + 0.30 * r2);

    p.active = true;
    p.x = nozPos.x + dx * 0.03;
    p.y = nozPos.y + dy * 0.03;
    p.z = nozPos.z + dz * 0.03;
    p.vx = dx * jetSpeed;
    p.vy = dy * jetSpeed;
    p.vz = dz * jetSpeed;
    p.dirX = dx;
    p.dirY = dy;
    p.dirZ = dz;
    p.ageSec = 0.0;
    p.lifeSec = 1.05 + r3 * 0.70; // [1.05s, 1.75s]
    p.r0 = 0.08 + r4 * 0.04;      // [0.08m, 0.12m] dense nozzle condensation core
    p.r1 = (0.44 + r1 * 0.24) * (0.90 + 0.22 * em.plumeReachM); // [0.44m, 0.72m] billowy cloud
    p.spawnEnvelope = Math.max(0.45, em.envelope);
    p.spinAngle = r2 * Math.PI * 2.0;
    p.spinSpeed = (r3 > 0.5 ? 1.0 : -1.0) * (0.45 + r4 * 0.75);
  }

  function stepParticlesAndEnvelopes(rawDt, timeSec) {
    const dt = Math.min(Math.max(Number(rawDt) || 0.0, 0.0), 0.05);
    if (steamMat.uniforms.uTime) {
      steamMat.uniforms.uTime.value = timeSec;
    }

    let ventingCount = 0;
    for (let i = 0; i < pipeCount; i++) {
      const em = emitters[i];
      const isPipeCulled = Boolean(
        em.placementGroup &&
          (em.placementGroup.userData?.culledBySceneCutter || !em.placementGroup.visible)
      );
      if (isPipeCulled) {
        em.isVenting = false;
        em.stage = 'STANDBY';
        em.envelope = 0.0;
        em.spawnAccumulator = 0.0;
        em.activeParticleCount = 0;
        continue;
      }

      if (em.burstOverrideRemainingSec > 0.0) {
        em.burstOverrideRemainingSec = Math.max(0.0, em.burstOverrideRemainingSec - dt);
      }

      const ev = evaluatePipeSteamEnvelope(
        em.scheduleSpec,
        timeSec,
        em.burstOverrideRemainingSec,
        allForcedActive
      );
      em.isVenting = ev.isVenting;
      em.stage = ev.stage;
      em.envelope = ev.envelope;
      em.cycleTimeSec = ev.cycleTimeSec;

      if (em.isVenting) {
        ventingCount += 1;
        // Spawn rate: 48 particles/sec at peak envelope
        em.spawnAccumulator += dt * 48.0 * em.envelope;
        const toSpawn = Math.min(8, Math.floor(em.spawnAccumulator));
        if (toSpawn > 0) {
          em.spawnAccumulator -= toSpawn;
          for (let s = 0; s < toSpawn; s++) {
            spawnParticleForEmitter(em);
          }
        }
      } else {
        em.spawnAccumulator = 0.0;
      }
      em.activeParticleCount = 0;
    }

    // Integrate all 960 particle slots and write billboard quad vertex attributes
    const dragXZ = Math.exp(-2.85 * dt);
    const dragDownY = Math.exp(-3.4 * dt);
    let livingTotal = 0;
    const cutter =
      typeof window !== 'undefined' && window.__SANDBOX__ && window.__SANDBOX__.sceneCutter
        ? window.__SANDBOX__.sceneCutter
        : null;

    for (let idx = 0; idx < totalParticles; idx++) {
      const p = particlePool[idx];
      const vBase = idx * 4;
      const em = emitters[p.pipeIndex];
      const isEmitterCulled = Boolean(
        em &&
          em.placementGroup &&
          (em.placementGroup.userData?.culledBySceneCutter || !em.placementGroup.visible)
      );

      if (
        !p.active ||
        isEmitterCulled ||
        (cutter && cutter.isWorldPointInDeletedHalfSpace(p.x, p.y, p.z))
      ) {
        p.active = false;
        for (let k = 0; k < 4; k++) {
          puffParams[(vBase + k) * 4 + 1] = 0.0;
        }
        continue;
      }

      p.ageSec += dt;
      if (p.ageSec >= p.lifeSec) {
        p.active = false;
        for (let k = 0; k < 4; k++) {
          puffParams[(vBase + k) * 4 + 1] = 0.0;
        }
        continue;
      }

      const u = p.ageSec / p.lifeSec; // normalized age in [0, 1]

      // Exponential aerodynamic drag on pressurized jet velocity
      p.vx *= dragXZ;
      p.vz *= dragXZ;
      if (p.vy < 0.0) {
        p.vy *= dragDownY;
      } else {
        p.vy *= Math.exp(-1.35 * dt);
      }

      // Thermal upward buoyancy (+Y acceleration as steam entrains air)
      p.vy += (0.72 + 0.85 * u) * dt;

      // 3D curl-like turbulent billowing eddies
      const eddyPhase = timeSec * 2.4 + p.seedPhase * 3.1;
      const turbX = Math.sin(eddyPhase + p.y * 2.2) * 0.22 * u;
      const turbZ = Math.cos(eddyPhase * 0.85 + p.x * 2.2) * 0.22 * u;

      p.x += (p.vx + turbX) * dt;
      p.y += p.vy * dt;
      p.z += (p.vz + turbZ) * dt;
      p.spinAngle += p.spinSpeed * dt;

      // Volumetric puff expansion r(u) and flash-condensation lifecycle opacity alpha(u)
      const radius = p.r0 + (p.r1 - p.r0) * (1.0 - Math.pow(1.0 - u, 1.55));
      const fadeIn = u < 0.10 ? u / 0.10 : 1.0;
      const smoothIn = fadeIn * fadeIn * (3.0 - 2.0 * fadeIn);
      const fadeOut = Math.pow(1.0 - u, 1.30);
      const alpha = Math.max(0.0, Math.min(0.68, smoothIn * fadeOut * p.spawnEnvelope * 0.64));

      // Nozzle jet elongation factor (stretches along discharge direction near orifice u < 0.35)
      const stretchFactor = u < 0.35 ? (1.0 - u / 0.35) * 0.80 : 0.0;

      for (let k = 0; k < 4; k++) {
        const dst3 = (vBase + k) * 3;
        centerPositions[dst3 + 0] = p.x;
        centerPositions[dst3 + 1] = p.y;
        centerPositions[dst3 + 2] = p.z;

        const dst4 = (vBase + k) * 4;
        puffParams[dst4 + 0] = radius;
        puffParams[dst4 + 1] = alpha;
        puffParams[dst4 + 2] = p.spinAngle;
        puffParams[dst4 + 3] = u;

        jetStretch[dst4 + 0] = p.dirX;
        jetStretch[dst4 + 1] = p.dirY;
        jetStretch[dst4 + 2] = p.dirZ;
        jetStretch[dst4 + 3] = stretchFactor;
      }

      emitters[p.pipeIndex].activeParticleCount += 1;
      livingTotal += 1;
    }

    activeEmitterCount = ventingCount;
    activeParticleCount = livingTotal;
    batchMesh.visible = livingTotal > 0;

    posAttr.needsUpdate = true;
    puffAttr.needsUpdate = true;
    stretchAttr.needsUpdate = true;
  }

  // Pre-warm 1.6 seconds of simulation across 32 steps so pipes in their active window at t=0
  // already display fully developed billowing steam plumes on the very first rendered frame.
  const prewarmSteps = 32;
  const prewarmDt = 0.05;
  for (let step = -prewarmSteps; step <= 0; step++) {
    const tSim = Math.max(0.0, (step + prewarmSteps) * prewarmDt * 0.15);
    stepParticlesAndEnvelopes(prewarmDt, tSim);
  }
  stepParticlesAndEnvelopes(1 / 60, 0.0);

  function update(dt, timeSec = 0.0) {
    stepParticlesAndEnvelopes(dt, timeSec);
  }

  function triggerSteamBurst(pipeIdOrIndex = 'all', durationSec = 3.0) {
    const dur = Math.max(0.25, Number(durationSec) || 3.0);
    const triggered = [];
    if (pipeIdOrIndex === 'all' || pipeIdOrIndex === '*') {
      for (const em of emitters) {
        em.burstOverrideRemainingSec = dur;
        em.isVenting = true;
        em.stage = 'ACTIVE_VENTING';
        em.envelope = 1.0;
        for (let s = 0; s < 10; s++) {
          spawnParticleForEmitter(em);
        }
        triggered.push(em);
      }
    } else {
      const target = emittersById[pipeIdOrIndex];
      if (target) {
        target.burstOverrideRemainingSec = dur;
        target.isVenting = true;
        target.stage = 'ACTIVE_VENTING';
        target.envelope = 1.0;
        for (let s = 0; s < 14; s++) {
          spawnParticleForEmitter(target);
        }
        triggered.push(target);
      }
    }
    stepParticlesAndEnvelopes(1 / 60, steamMat.uniforms.uTime.value);
    return triggered;
  }

  function setAllSteamActive(activeBool) {
    allForcedActive = Boolean(activeBool);
    if (allForcedActive) {
      for (const em of emitters) {
        em.isVenting = true;
        em.stage = 'ACTIVE_VENTING';
        em.envelope = 1.0;
        if (em.activeParticleCount < 8) {
          for (let s = 0; s < 10; s++) {
            spawnParticleForEmitter(em);
          }
        }
      }
    }
    stepParticlesAndEnvelopes(1 / 60, steamMat.uniforms.uTime.value);
    return allForcedActive;
  }

  function getTelemetry() {
    return {
      emitterCount: emitters.length,
      activeEmitterCount,
      activeParticleCount,
      totalParticlePool: totalParticles,
      particlesPerPipe,
      drawCalls: 1,
      allForcedActive,
      activePipeIds: emitters.filter((e) => e.isVenting).map((e) => e.pipeId)
    };
  }

  return {
    mesh: batchMesh,
    material: steamMat,
    emitters,
    emittersById,
    particles: particlePool,
    totalParticles,
    particlesPerPipe,
    get activeEmitterCount() {
      return activeEmitterCount;
    },
    get activeParticleCount() {
      return activeParticleCount;
    },
    get allForcedActive() {
      return allForcedActive;
    },
    update,
    triggerSteamBurst,
    setAllSteamActive,
    getTelemetry
  };
}
