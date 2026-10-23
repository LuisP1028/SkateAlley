/**
 * scene_cutter.js - Interactive Straight-Line Scene Cutter & Half-Space Geometry Deletion System
 * Authoritative Specification: functional_specification_036.md
 */
import * as THREE from 'three';

const MIN_LINE_LENGTH_PX = 8.0;
const HANDLE_HIT_RADIUS_PX = 16.0;
const SCENE_CUTS_STORAGE_KEY = 'skatealley_scene_cuts_v1';

// Default back-alley cutoff right behind the furthest kept hologram column (daffy_vid back edge Z = 42.28m)
const DEFAULT_INITIAL_CUT_SPECS = [
  {
    mode: 'VERTICAL_PLUMB_PLANE',
    normal: [0, 0, 1],
    constant: -42.5,
    zIntercept: 42.5,
    w1: [-3.2, 0, 42.5],
    w2: [3.2, 0, 42.5],
    p1: { x: 340, y: 360 },
    p2: { x: 940, y: 360 },
    deleteDirectionZ: 'Z > Z_cut (Back Alley)',
  },
];

/**
 * Computes the 2D polygon vertices (in viewport pixel coordinates [0..W] x [0..H])
 * representing the half-plane on the positive side of the 2D normal n2D = (nx, ny)
 * passing through line point P1 = (x1, y1).
 */
export function computeViewportHalfPlanePolygon(p1, p2, normal2D, width, height) {
  const corners = [
    { x: 0, y: 0 },
    { x: width, y: 0 },
    { x: width, y: height },
    { x: 0, y: height },
  ];

  const evalDist = (pt) => (pt.x - p1.x) * normal2D.x + (pt.y - p1.y) * normal2D.y;

  const out = [];
  for (let i = 0; i < corners.length; i++) {
    const cur = corners[i];
    const next = corners[(i + 1) % corners.length];
    const dCur = evalDist(cur);
    const dNext = evalDist(next);

    if (dCur >= 0) {
      out.push(cur);
    }
    if ((dCur >= 0 && dNext < 0) || (dCur < 0 && dNext >= 0)) {
      const denom = dCur - dNext;
      if (Math.abs(denom) > 1e-6) {
        const t = dCur / denom;
        out.push({
          x: cur.x + t * (next.x - cur.x),
          y: cur.y + t * (next.y - cur.y),
        });
      }
    }
  }
  return out;
}

/**
 * Clips a single triangle against the half-space s(X) <= 0 (retaining points where s <= 0,
 * discarding points where s > 0). Returns an array of 0, 1, or 2 triangles, where each
 * triangle is an array of 3 vertex objects { pos, norm, uv, s }.
 */
function clipTriangleToRetainedHalfSpace(v0, v1, v2) {
  const input = [v0, v1, v2];
  const output = [];

  for (let i = 0; i < input.length; i++) {
    const cur = input[i];
    const next = input[(i + 1) % input.length];
    const curInside = cur.s <= 0.0;
    const nextInside = next.s <= 0.0;

    if (curInside && nextInside) {
      output.push(next);
    } else if (curInside && !nextInside) {
      const denom = cur.s - next.s;
      const t = Math.abs(denom) > 1e-8 ? Math.max(0.0, Math.min(1.0, cur.s / denom)) : 0.5;
      output.push(interpolateVertex(cur, next, t));
    } else if (!curInside && nextInside) {
      const denom = cur.s - next.s;
      const t = Math.abs(denom) > 1e-8 ? Math.max(0.0, Math.min(1.0, cur.s / denom)) : 0.5;
      output.push(interpolateVertex(cur, next, t));
      output.push(next);
    }
  }

  if (output.length < 3) return [];
  if (output.length === 3) return [[output[0], output[1], output[2]]];
  return [
    [output[0], output[1], output[2]],
    [output[0], output[2], output[3]],
  ];
}

function interpolateVertex(a, b, t) {
  const pos = [
    a.pos[0] + t * (b.pos[0] - a.pos[0]),
    a.pos[1] + t * (b.pos[1] - a.pos[1]),
    a.pos[2] + t * (b.pos[2] - a.pos[2]),
  ];
  let norm = null;
  if (a.norm && b.norm) {
    const nx = a.norm[0] + t * (b.norm[0] - a.norm[0]);
    const ny = a.norm[1] + t * (b.norm[1] - a.norm[1]);
    const nz = a.norm[2] + t * (b.norm[2] - a.norm[2]);
    const len = Math.hypot(nx, ny, nz) || 1.0;
    norm = [nx / len, ny / len, nz / len];
  }
  let uv = null;
  if (a.uv && b.uv) {
    uv = [
      a.uv[0] + t * (b.uv[0] - a.uv[0]),
      a.uv[1] + t * (b.uv[1] - a.uv[1]),
    ];
  }
  return { pos, norm, uv, s: 0.0 };
}

/**
 * Slices a Three.js BufferGeometry in place against a world-space cutting plane (n, d)
 * where points with n.dot(X_world) + d > 0 are deleted and n.dot(X_world) + d <= 0 are retained.
 * - For meshes with custom shader vertex attributes (e.g., OverheadHangingCablesBatchMesh,
 *   LowAltitudeGroundFogMesh, AlarmLightDiffusedVolumesMesh), preserves all vertex attributes
 *   and filters the index buffer (and removes entire cable spans if either wall anchor is cut).
 * - For standard meshes (position/normal/uv), clips straddling triangles along s(X) = 0.
 */
export function sliceMeshGeometryByWorldPlane(mesh, planeNormal, planeConstant) {
  if (
    !mesh ||
    mesh.name === 'PrecipitationEmitterMesh' ||
    !mesh.geometry ||
    !mesh.geometry.attributes ||
    !mesh.geometry.attributes.position
  ) {
    return { beforeTris: 0, afterTris: 0, deletedTris: 0, clippedTris: 0 };
  }

  mesh.updateMatrixWorld(true);
  const worldMat = mesh.matrixWorld;
  const invWorldMat = new THREE.Matrix4().copy(worldMat).invert();

  // Transform world plane normal*X_world + d = 0 into mesh local space:
  // X_world = M * X_local => (n^T * M) * X_local + d = 0
  const e = worldMat.elements;
  const nx = planeNormal.x;
  const ny = planeNormal.y;
  const nz = planeNormal.z;

  const localNx = nx * e[0] + ny * e[1] + nz * e[2];
  const localNy = nx * e[4] + ny * e[5] + nz * e[6];
  const localNz = nx * e[8] + ny * e[9] + nz * e[10];
  const localD = nx * e[12] + ny * e[13] + nz * e[14] + planeConstant;

  const geom = mesh.geometry;
  const posAttr = geom.attributes.position;
  const normAttr = geom.attributes.normal || null;
  const uvAttr = geom.attributes.uv || null;
  const indexAttr = geom.index;

  const attrKeys = Object.keys(geom.attributes);
  const hasCustomAttributes = attrKeys.some(
    (k) => k !== 'position' && k !== 'normal' && k !== 'uv'
  );

  const vertCount = posAttr.count;
  const signedDists = new Float32Array(vertCount);
  for (let i = 0; i < vertCount; i++) {
    const vx = posAttr.getX(i);
    const vy = posAttr.getY(i);
    const vz = posAttr.getZ(i);
    signedDists[i] = localNx * vx + localNy * vy + localNz * vz + localD;
  }

  const triCount = indexAttr ? Math.floor(indexAttr.count / 3) : Math.floor(vertCount / 3);

  // Path A: Meshes with custom shader attributes (preserve all vertex attribute buffers, filter index buffer)
  if (hasCustomAttributes) {
    const vertCableIndices = geom.userData && geom.userData.vertCableIndices ? geom.userData.vertCableIndices : null;
    const cables = mesh.userData && Array.isArray(mesh.userData.cables) ? mesh.userData.cables : null;
    const culledCableSet = new Set();

    if (vertCableIndices && cables) {
      for (let cIdx = 0; cIdx < cables.length; cIdx++) {
        const c = cables[cIdx];
        if (!c) continue;
        const sL = c.leftAnchor ? planeNormal.dot(c.leftAnchor) + planeConstant : -1.0;
        const sR = c.rightAnchor ? planeNormal.dot(c.rightAnchor) + planeConstant : -1.0;
        const sM = c.midSpanPoint ? planeNormal.dot(c.midSpanPoint) + planeConstant : -1.0;
        if (sL > 0.0 || sR > 0.0 || sM > 0.0) {
          culledCableSet.add(cIdx);
          if (c.node) {
            c.node.visible = false;
            c.node.userData.culledBySceneCutter = true;
          }
        }
      }
    }

    const keptIndices = [];
    let deletedTris = 0;

    for (let t = 0; t < triCount; t++) {
      const i0 = indexAttr ? indexAttr.getX(t * 3) : t * 3;
      const i1 = indexAttr ? indexAttr.getX(t * 3 + 1) : t * 3 + 1;
      const i2 = indexAttr ? indexAttr.getX(t * 3 + 2) : t * 3 + 2;

      if (vertCableIndices && culledCableSet.has(vertCableIndices[i0])) {
        deletedTris++;
        continue;
      }

      const s0 = signedDists[i0];
      const s1 = signedDists[i1];
      const s2 = signedDists[i2];

      if (s0 <= 0.02 && s1 <= 0.02 && s2 <= 0.02) {
        keptIndices.push(i0, i1, i2);
      } else {
        deletedTris++;
      }
    }

    if (deletedTris === 0) {
      return {
        beforeTris: triCount,
        afterTris: triCount,
        deletedTris: 0,
        clippedTris: 0,
        invWorldMat,
      };
    }

    const newGeom = geom.clone();
    newGeom.userData = { ...geom.userData };
    const IndexArrayCtor = vertCount > 65535 ? Uint32Array : Uint16Array;
    newGeom.setIndex(new THREE.BufferAttribute(new IndexArrayCtor(keptIndices), 1));
    mesh.geometry = newGeom;

    return {
      beforeTris: triCount,
      afterTris: Math.floor(keptIndices.length / 3),
      deletedTris,
      clippedTris: 0,
      invWorldMat,
    };
  }

  // Path B: Standard meshes (position, normal, uv) -> exact triangle-plane clipping along s(X) = 0
  const keptIndices = [];
  const appendedPositions = [];
  const appendedNormals = [];
  const appendedUVs = [];
  let nextNewVertexIndex = vertCount;
  let deletedTris = 0;
  let clippedTris = 0;

  const readVert = (idx) => ({
    pos: [posAttr.getX(idx), posAttr.getY(idx), posAttr.getZ(idx)],
    norm: normAttr ? [normAttr.getX(idx), normAttr.getY(idx), normAttr.getZ(idx)] : null,
    uv: uvAttr ? [uvAttr.getX(idx), uvAttr.getY(idx)] : null,
    s: signedDists[idx],
  });

  for (let t = 0; t < triCount; t++) {
    const i0 = indexAttr ? indexAttr.getX(t * 3) : t * 3;
    const i1 = indexAttr ? indexAttr.getX(t * 3 + 1) : t * 3 + 1;
    const i2 = indexAttr ? indexAttr.getX(t * 3 + 2) : t * 3 + 2;

    const s0 = signedDists[i0];
    const s1 = signedDists[i1];
    const s2 = signedDists[i2];

    if (s0 <= 0.0 && s1 <= 0.0 && s2 <= 0.0) {
      keptIndices.push(i0, i1, i2);
    } else if (s0 > 0.0 && s1 > 0.0 && s2 > 0.0) {
      deletedTris++;
    } else {
      // Straddling triangle: clip against s(X) = 0
      const subTris = clipTriangleToRetainedHalfSpace(readVert(i0), readVert(i1), readVert(i2));
      if (subTris.length === 0) {
        deletedTris++;
      } else {
        clippedTris++;
        for (let st = 0; st < subTris.length; st++) {
          const tri = subTris[st];
          for (let k = 0; k < 3; k++) {
            const v = tri[k];
            appendedPositions.push(v.pos[0], v.pos[1], v.pos[2]);
            if (normAttr) {
              const nm = v.norm || [0, 1, 0];
              appendedNormals.push(nm[0], nm[1], nm[2]);
            }
            if (uvAttr) {
              const uv = v.uv || [0, 0];
              appendedUVs.push(uv[0], uv[1]);
            }
            keptIndices.push(nextNewVertexIndex++);
          }
        }
      }
    }
  }

  // If no triangles were deleted or clipped, leave geometry untouched
  if (deletedTris === 0 && clippedTris === 0) {
    return {
      beforeTris: triCount,
      afterTris: triCount,
      deletedTris: 0,
      clippedTris: 0,
      invWorldMat,
    };
  }

  const totalVerts = vertCount + appendedPositions.length / 3;
  const newPosArray = new Float32Array(totalVerts * 3);
  for (let i = 0; i < vertCount; i++) {
    newPosArray[i * 3] = posAttr.getX(i);
    newPosArray[i * 3 + 1] = posAttr.getY(i);
    newPosArray[i * 3 + 2] = posAttr.getZ(i);
  }
  newPosArray.set(appendedPositions, vertCount * 3);

  const newGeom = new THREE.BufferGeometry();
  newGeom.setAttribute('position', new THREE.BufferAttribute(newPosArray, 3));

  if (normAttr) {
    const newNormArray = new Float32Array(totalVerts * 3);
    for (let i = 0; i < vertCount; i++) {
      newNormArray[i * 3] = normAttr.getX(i);
      newNormArray[i * 3 + 1] = normAttr.getY(i);
      newNormArray[i * 3 + 2] = normAttr.getZ(i);
    }
    newNormArray.set(appendedNormals, vertCount * 3);
    newGeom.setAttribute('normal', new THREE.BufferAttribute(newNormArray, 3));
  }

  if (uvAttr) {
    const newUVArray = new Float32Array(totalVerts * 2);
    for (let i = 0; i < vertCount; i++) {
      newUVArray[i * 2] = uvAttr.getX(i);
      newUVArray[i * 2 + 1] = uvAttr.getY(i);
    }
    newUVArray.set(appendedUVs, vertCount * 2);
    newGeom.setAttribute('uv', new THREE.BufferAttribute(newUVArray, 2));
  }

  const IndexArrayCtor = totalVerts > 65535 ? Uint32Array : Uint16Array;
  newGeom.setIndex(new THREE.BufferAttribute(new IndexArrayCtor(keptIndices), 1));
  newGeom.computeBoundingBox();
  newGeom.computeBoundingSphere();

  mesh.geometry = newGeom;

  const afterTris = Math.floor(keptIndices.length / 3);
  return {
    beforeTris: triCount,
    afterTris,
    deletedTris,
    clippedTris,
  };
}

/**
 * Builds the interactive Straight-Line Scene Cutter subsystem and wires all DOM & 3D controls.
 */
export function buildSceneCutterSubsystem({
  scene,
  camera,
  renderer,
  sandbox,
  floorY = 0.0,
}) {
  const cutter3DGroup = new THREE.Group();
  cutter3DGroup.name = 'SceneCutter3DVisualizerGroup';
  cutter3DGroup.renderOrder = 990;
  scene.add(cutter3DGroup);

  // 3D Cut Plane Visualizer Quad (visible while drawing/previewing a cut line)
  const planeVizGeom = new THREE.PlaneGeometry(28.0, 18.0, 8, 6);
  const planeVizMat = new THREE.MeshBasicMaterial({
    color: 0xff2e4c,
    transparent: true,
    opacity: 0.18,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  const planeVizMesh = new THREE.Mesh(planeVizGeom, planeVizMat);
  planeVizMesh.name = 'SceneCutter3DSliceQuad';
  planeVizMesh.visible = false;

  const planeWireGeom = new THREE.EdgesGeometry(planeVizGeom);
  const planeWireMat = new THREE.LineBasicMaterial({
    color: 0xfbbf24,
    transparent: true,
    opacity: 0.75,
  });
  const planeWireMesh = new THREE.LineSegments(planeWireGeom, planeWireMat);
  planeVizMesh.add(planeWireMesh);
  cutter3DGroup.add(planeVizMesh);

  // DOM References
  const elOverlay = document.getElementById('scene-cutter-overlay');
  const elSvg = document.getElementById('scene-cutter-svg');
  const elShadePoly = document.getElementById('cutter-svg-delete-shade');
  const elInfGuide = document.getElementById('cutter-svg-infinite-guide');
  const elMainGlow = document.getElementById('cutter-svg-main-glow');
  const elMainLine = document.getElementById('cutter-svg-main-line');
  const elNormalArrow = document.getElementById('cutter-svg-normal-arrow');
  const elNormalHead = document.getElementById('cutter-svg-normal-head');
  const elBadgeGroup = document.getElementById('cutter-svg-badge-group');
  const elBadgeText = document.getElementById('cutter-svg-badge-text');
  const elHandleP1 = document.getElementById('cutter-svg-handle-p1');
  const elHandleP2 = document.getElementById('cutter-svg-handle-p2');

  const elFloatStatus = document.getElementById('cutter-floating-status');
  const elHudBadge = document.getElementById('cutter-hud-badge');
  const elToggleBtn = document.getElementById('cutter-toggle-mode-btn');
  const elFlipBtn = document.getElementById('cutter-flip-side-btn');
  const elModeSelect = document.getElementById('cutter-plane-mode-select');
  const elPreviewBtn = document.getElementById('cutter-preview-toggle-btn');
  const elExecuteBtn = document.getElementById('cutter-execute-btn');
  const elUndoBtn = document.getElementById('cutter-undo-btn');
  const elRestoreBtn = document.getElementById('cutter-restore-all-btn');
  const elCopyJsonBtn = document.getElementById('cutter-copy-json-btn');
  const elReadout = document.getElementById('cutter-telemetry-readout');
  const elTelCutter = document.getElementById('tel-cutter');

  const elFloatFlipBtn = document.getElementById('cutter-float-flip-btn');
  const elFloatExecBtn = document.getElementById('cutter-float-execute-btn');
  const elFloatClearBtn = document.getElementById('cutter-float-clear-line-btn');
  const elFloatUndoBtn = document.getElementById('cutter-float-undo-btn');
  const elFloatRestoreBtn = document.getElementById('cutter-float-restore-btn');
  const elFloatExitBtn = document.getElementById('cutter-float-exit-btn');

  // Original geometry cache for instant (<5ms) Undo / Restore
  const originalMeshGeometries = new Map();
  const originalObjectVisibilities = new Map();
  let baselineCaptured = false;
  let initialPrimaryTriCount = 42314;

  function captureBaselineSceneState() {
    if (baselineCaptured) return;
    baselineCaptured = true;
    scene.traverse((obj) => {
      if (obj === cutter3DGroup || obj === planeVizMesh || obj === planeWireMesh) return;
      // Never slice character controllers or director gizmo handles
      if (
        obj.name === 'SpawnAndCameraDirectorGroup' ||
        (sandbox.characters &&
          ((sandbox.characters.hoodie && sandbox.characters.hoodie.root === obj) ||
            (sandbox.characters.tunic && sandbox.characters.tunic.root === obj)))
      ) {
        return;
      }
      originalObjectVisibilities.set(obj.uuid, {
        obj,
        visible: obj.visible,
        culledBySceneCutter: Boolean(obj.userData && obj.userData.culledBySceneCutter),
        intensity: obj.isLight ? obj.intensity : undefined,
      });
      if (obj.isMesh && !obj.isSkinnedMesh && obj.geometry) {
        const clonedGeom = obj.geometry.clone();
        clonedGeom.userData = { ...obj.geometry.userData };
        originalMeshGeometries.set(obj.uuid, {
          mesh: obj,
          geometry: clonedGeom,
        });
        if (obj.name === 'VISUAL_ALLEY_MESH' || (obj.parent && obj.parent.name === 'VISUAL_ALLEY_MESH')) {
          const idx = obj.geometry.index;
          const pos = obj.geometry.attributes.position;
          if (idx) initialPrimaryTriCount = Math.floor(idx.count / 3);
          else if (pos) initialPrimaryTriCount = Math.floor(pos.count / 3);
        }
      }
    });
  }

  const state = {
    active: false,
    interactionPhase: 'INACTIVE', // 'INACTIVE' | 'ARMED_READY_TO_DRAW' | 'DRAWING_LINE' | 'TWO_CLICK_PENDING' | 'LINE_DEFINED_PENDING_CONFIRM'
    draggingHandle: null, // 'P1' | 'P2' | 'NEW' | null
    planeMode: 'VIEW_PLANE', // 'VIEW_PLANE' | 'VERTICAL_PLUMB_PLANE'
    polarity: 1, // +1 or -1
    previewClipEnabled: true,
    p1: null, // { x, y } in CSS pixels
    p2: null, // { x, y } in CSS pixels
    currentPlane: null, // { normal: THREE.Vector3, constant: number, w1, w2, zIntercept, normal2D }
    appliedCuts: [], // History stack of applied cuts
    lastCutSummary: null,
    previewCulledObjects: [], // Discrete props temporarily culled during live preview
  };

  function isWorldPointInDeletedHalfSpace(x, y, z) {
    for (let i = 0; i < state.appliedCuts.length; i++) {
      const c = state.appliedCuts[i];
      const n = c.normalVec;
      if (n && n.x * x + n.y * y + n.z * z + c.constant > 0.0) {
        return true;
      }
    }
    if (state.active && state.previewClipEnabled && state.currentPlane) {
      const n = state.currentPlane.normal;
      if (n.x * x + n.y * y + n.z * z + state.currentPlane.constant > 0.0) {
        return true;
      }
    }
    return false;
  }

  function persistCutsToStorage() {
    try {
      if (typeof localStorage === 'undefined') return;
      const serializable = state.appliedCuts.map((c) => ({
        mode: c.mode,
        normal: c.normal,
        constant: c.constant,
        zIntercept: c.zIntercept,
        w1: c.w1,
        w2: c.w2,
        p1: c.p1,
        p2: c.p2,
        deleteDirectionZ: c.deleteDirectionZ,
      }));
      localStorage.setItem(SCENE_CUTS_STORAGE_KEY, JSON.stringify(serializable));
    } catch (_) {}
  }

  function getDiscretePropGroups() {
    return [
      scene.getObjectByName('AlleyMetalPipesRootGroup'),
      scene.getObjectByName('WallScreenMountsGroup'),
      scene.getObjectByName('HologramMediaColumnsRootGroup'),
      scene.getObjectByName('MathHologramPodsRootGroup'),
      scene.getObjectByName('AlleyAlarmLightsGroup'),
      scene.getObjectByName('AlleyNightStreetLights'),
      scene.getObjectByName('VillainyIncOverheadSignGroup'),
      scene.getObjectByName('EntranceHologramTerminalGroup'),
      scene.getObjectByName('CentralHolographicTerminalGroup'),
    ].filter(Boolean);
  }

  function getSliceableRoots() {
    return [
      scene.getObjectByName('VISUAL_ALLEY_MESH'),
      scene.getObjectByName('COLLIDERS'),
      scene.getObjectByName('OverheadHangingCablesGroup'),
      scene.getObjectByName('NeonWallCornersGroup'),
      scene.getObjectByName('WaterColorSkyboxGroup'),
      scene.getObjectByName('EnvironmentalSFXGroup'),
    ].filter(Boolean);
  }

  function evaluateDiscreteChildWorldCenter(child, outVec) {
    if (
      child.name === 'PipeSteamPlumeBatchMesh' ||
      child.name === 'EntranceStreetLamppostLight' ||
      child.name === 'EntranceStreetLamppostTarget' ||
      child.name === 'EntranceLamppostVolumetricConeMesh' ||
      child.name === 'EntranceLamppostTargetMarkerGroup'
    ) {
      return false;
    }
    const box = new THREE.Box3().setFromObject(child);
    if (!box.isEmpty()) {
      box.getCenter(outVec);
      return true;
    }
    child.getWorldPosition(outVec);
    return true;
  }

  function restorePreviewCulledObjects() {
    if (state.previewCulledObjects.length === 0) return;
    for (const item of state.previewCulledObjects) {
      item.obj.visible = item.visible;
      if (item.obj.userData) {
        item.obj.userData.culledBySceneCutter = item.culledBySceneCutter;
      }
      if (item.obj.isLight && item.intensity !== undefined) {
        item.obj.intensity = item.intensity;
      }
    }
    state.previewCulledObjects.length = 0;
  }

  function syncPreviewPropCulling() {
    restorePreviewCulledObjects();
    if (!(state.active && state.previewClipEnabled && state.currentPlane)) {
      return;
    }
    const { normal, constant } = state.currentPlane;
    const worldPos = new THREE.Vector3();
    for (const grp of getDiscretePropGroups()) {
      for (const child of grp.children) {
        if (child.userData && child.userData.culledBySceneCutter) continue;
        if (!evaluateDiscreteChildWorldCenter(child, worldPos)) continue;
        const s = normal.dot(worldPos) + constant;
        if (s > 0.0) {
          state.previewCulledObjects.push({
            obj: child,
            visible: child.visible,
            culledBySceneCutter: Boolean(child.userData && child.userData.culledBySceneCutter),
            intensity: child.isLight ? child.intensity : undefined,
          });
          if (!child.userData) child.userData = {};
          child.userData.culledBySceneCutter = true;
          child.visible = false;
          if (child.isLight) {
            child.intensity = 0.0;
          }
        }
      }
    }
  }

  function unprojectScreenPointRay(px, py, width, height) {
    const ndcX = (px / width) * 2.0 - 1.0;
    const ndcY = 1.0 - (py / height) * 2.0;
    const nearPt = new THREE.Vector3(ndcX, ndcY, -1.0).unproject(camera);
    const farPt = new THREE.Vector3(ndcX, ndcY, 0.5).unproject(camera);
    const dir = farPt.sub(nearPt).normalize();
    const origin = camera.position.clone();

    // Floor intersection at Y = floorY
    let floorHit = null;
    if (Math.abs(dir.y) > 1e-4) {
      const t = (floorY - origin.y) / dir.y;
      if (t > 0.05 && t < 350.0) {
        floorHit = origin.clone().addScaledVector(dir, t);
      }
    }
    if (!floorHit) {
      floorHit = origin.clone().addScaledVector(dir, 18.0);
    }
    return { ndcX, ndcY, origin, dir, floorHit };
  }

  function recomputeCurrentPlane() {
    if (!state.p1 || !state.p2) {
      state.currentPlane = null;
      planeVizMesh.visible = false;
      syncClippingPlanes();
      return null;
    }

    const dx = state.p2.x - state.p1.x;
    const dy = state.p2.y - state.p1.y;
    const lenPx = Math.hypot(dx, dy);
    if (lenPx < MIN_LINE_LENGTH_PX) {
      state.currentPlane = null;
      planeVizMesh.visible = false;
      syncClippingPlanes();
      return null;
    }

    const width = Math.max(1, window.innerWidth || 1280);
    const height = Math.max(1, window.innerHeight || 720);

    camera.updateMatrixWorld(true);
    const ray1 = unprojectScreenPointRay(state.p1.x, state.p1.y, width, height);
    const ray2 = unprojectScreenPointRay(state.p2.x, state.p2.y, width, height);

    // 2D screen normal pointing to the "DELETE THIS SIDE" half-plane
    const normal2D = {
      x: state.polarity * (-dy / lenPx),
      y: state.polarity * (dx / lenPx),
    };

    // Sample a point 45px inside the 2D shaded DELETE region to lock 3D normal orientation
    const mid2D = {
      x: (state.p1.x + state.p2.x) * 0.5,
      y: (state.p1.y + state.p2.y) * 0.5,
    };
    const test2D = {
      x: mid2D.x + normal2D.x * 45.0,
      y: mid2D.y + normal2D.y * 45.0,
    };
    const testRay = unprojectScreenPointRay(test2D.x, test2D.y, width, height);
    const testWorldPt = testRay.origin.clone().addScaledVector(testRay.dir, 12.0);

    let normal3D = new THREE.Vector3();
    let anchor3D = camera.position.clone();
    let effectiveMode = state.planeMode;

    if (state.planeMode === 'VERTICAL_PLUMB_PLANE') {
      const xzVec = new THREE.Vector3(
        ray2.floorHit.x - ray1.floorHit.x,
        0.0,
        ray2.floorHit.z - ray1.floorHit.z
      );
      if (xzVec.lengthSq() > 1e-4) {
        normal3D.crossVectors(xzVec, new THREE.Vector3(0, 1, 0)).normalize();
        anchor3D.copy(ray1.floorHit);
      } else {
        effectiveMode = 'VIEW_PLANE';
      }
    }

    if (effectiveMode === 'VIEW_PLANE') {
      normal3D.crossVectors(ray1.dir, ray2.dir);
      if (normal3D.lengthSq() < 1e-8) {
        state.currentPlane = null;
        return null;
      }
      normal3D.normalize();
      anchor3D.copy(camera.position);
    }

    let constant = -normal3D.dot(anchor3D);

    // Guarantee 3D deleted half-space (normal3D.dot(X) + constant > 0) matches the 2D shaded side
    const testSignedDist = normal3D.dot(testWorldPt) + constant;
    if (testSignedDist < 0.0) {
      normal3D.negate();
      constant = -constant;
    }

    // Compute corridor centerline Z intercept at (X = 0, Y = floorY)
    let zIntercept = null;
    if (Math.abs(normal3D.z) > 1e-4) {
      zIntercept = Number((-(normal3D.y * floorY + constant) / normal3D.z).toFixed(2));
    }

    state.currentPlane = {
      mode: effectiveMode,
      normal: normal3D,
      constant: Number(constant.toFixed(5)),
      w1: ray1.floorHit.toArray().map((n) => Number(n.toFixed(2))),
      w2: ray2.floorHit.toArray().map((n) => Number(n.toFixed(2))),
      zIntercept,
      deleteDirectionZ:
        normal3D.z > 0.15
          ? 'Z > Z_cut (Back Alley)'
          : normal3D.z < -0.15
          ? 'Z < Z_cut (Front/Entrance)'
          : 'Lateral / Angled',
      normal2D,
      mid2D,
      lenPx: Number(lenPx.toFixed(1)),
    };

    // Position 3D Slice Quad along the cutting plane inside the alley
    const planeCenter = new THREE.Vector3(
      0.0,
      floorY + 2.5,
      zIntercept !== null && Number.isFinite(zIntercept)
        ? Math.max(-10.0, Math.min(65.0, zIntercept))
        : 12.0
    );
    // Project planeCenter onto the plane: X_proj = X - (n.X + d)*n
    const distCenter = normal3D.dot(planeCenter) + constant;
    planeCenter.addScaledVector(normal3D, -distCenter);
    planeVizMesh.position.copy(planeCenter);
    const lookTarget = planeCenter.clone().add(normal3D);
    planeVizMesh.lookAt(lookTarget);
    planeVizMesh.visible = state.active;

    syncClippingPlanes();
    return state.currentPlane;
  }

  function syncClippingPlanes() {
    syncPreviewPropCulling();
    if (!renderer) return;
    const planes = [];
    for (let i = 0; i < state.appliedCuts.length; i++) {
      const c = state.appliedCuts[i];
      if (c.normalVec) {
        planes.push(new THREE.Plane(c.normalVec.clone().negate(), -c.constant));
      }
    }
    if (state.active && state.previewClipEnabled && state.currentPlane) {
      // Three.js clips points where plane.normal.dot(X) + plane.constant < 0.
      // Since we delete s(X) = n.X + d > 0, we keep -n.X - d >= 0.
      planes.push(
        new THREE.Plane(
          state.currentPlane.normal.clone().negate(),
          -state.currentPlane.constant
        )
      );
    }
    renderer.localClippingEnabled = planes.length > 0;
    renderer.clippingPlanes = planes;
  }

  function renderSVGOverlay() {
    if (!elSvg) return;
    const hasLine = Boolean(state.p1 && state.p2 && state.currentPlane);

    const showVal = hasLine ? 'block' : 'none';
    if (elShadePoly) elShadePoly.style.display = showVal;
    if (elInfGuide) elInfGuide.style.display = showVal;
    if (elMainGlow) elMainGlow.style.display = showVal;
    if (elMainLine) elMainLine.style.display = showVal;
    if (elNormalArrow) elNormalArrow.style.display = showVal;
    if (elNormalHead) elNormalHead.style.display = showVal;
    if (elBadgeGroup) elBadgeGroup.style.display = showVal;
    if (elHandleP1) elHandleP1.style.display = state.p1 ? 'block' : 'none';
    if (elHandleP2) elHandleP2.style.display = hasLine ? 'block' : 'none';

    if (state.p1 && elHandleP1) {
      elHandleP1.setAttribute('cx', String(state.p1.x));
      elHandleP1.setAttribute('cy', String(state.p1.y));
    }

    if (!hasLine) {
      syncHUDReadouts();
      return;
    }

    const { p1, p2, currentPlane } = state;
    const { normal2D, mid2D, zIntercept, deleteDirectionZ } = currentPlane;
    const width = Math.max(1, window.innerWidth || 1280);
    const height = Math.max(1, window.innerHeight || 720);

    // 1. Half-plane shaded polygon
    const polyPts = computeViewportHalfPlanePolygon(p1, p2, normal2D, width, height);
    if (elShadePoly && polyPts.length >= 3) {
      elShadePoly.setAttribute(
        'points',
        polyPts.map((pt) => `${pt.x.toFixed(1)},${pt.y.toFixed(1)}`).join(' ')
      );
    }

    // 2. Infinite extension line
    const dirX = -normal2D.y;
    const dirY = normal2D.x;
    const diag = Math.hypot(width, height) * 1.5;
    if (elInfGuide) {
      elInfGuide.setAttribute('x1', String((mid2D.x - dirX * diag).toFixed(1)));
      elInfGuide.setAttribute('y1', String((mid2D.y - dirY * diag).toFixed(1)));
      elInfGuide.setAttribute('x2', String((mid2D.x + dirX * diag).toFixed(1)));
      elInfGuide.setAttribute('y2', String((mid2D.y + dirY * diag).toFixed(1)));
    }

    // 3. Main drawn line segment P1 -> P2
    for (const ln of [elMainGlow, elMainLine]) {
      if (!ln) continue;
      ln.setAttribute('x1', String(p1.x.toFixed(1)));
      ln.setAttribute('y1', String(p1.y.toFixed(1)));
      ln.setAttribute('x2', String(p2.x.toFixed(1)));
      ln.setAttribute('y2', String(p2.y.toFixed(1)));
    }

    if (elHandleP2) {
      elHandleP2.setAttribute('cx', String(p2.x.toFixed(1)));
      elHandleP2.setAttribute('cy', String(p2.y.toFixed(1)));
    }

    // 4. Perpendicular deletion arrow at midpoint
    const arrowLen = 54.0;
    const tipX = mid2D.x + normal2D.x * arrowLen;
    const tipY = mid2D.y + normal2D.y * arrowLen;
    if (elNormalArrow) {
      elNormalArrow.setAttribute('x1', String(mid2D.x.toFixed(1)));
      elNormalArrow.setAttribute('y1', String(mid2D.y.toFixed(1)));
      elNormalArrow.setAttribute('x2', String(tipX.toFixed(1)));
      elNormalArrow.setAttribute('y2', String(tipY.toFixed(1)));
    }
    if (elNormalHead) {
      const headLen = 12.0;
      const headHalfW = 6.5;
      const bx = tipX - normal2D.x * headLen;
      const by = tipY - normal2D.y * headLen;
      const leftX = bx - normal2D.y * headHalfW;
      const leftY = by + normal2D.x * headHalfW;
      const rightX = bx + normal2D.y * headHalfW;
      const rightY = by - normal2D.x * headHalfW;
      elNormalHead.setAttribute(
        'points',
        `${tipX.toFixed(1)},${tipY.toFixed(1)} ${leftX.toFixed(1)},${leftY.toFixed(1)} ${rightX.toFixed(1)},${rightY.toFixed(1)}`
      );
    }

    // 5. Midpoint DELETE THIS SIDE badge
    if (elBadgeGroup && elBadgeText) {
      const badgeX = Math.max(150, Math.min(width - 150, mid2D.x + normal2D.x * 84.0));
      const badgeY = Math.max(70, Math.min(height - 40, mid2D.y + normal2D.y * 84.0));
      elBadgeGroup.setAttribute('transform', `translate(${badgeX.toFixed(1)}, ${badgeY.toFixed(1)})`);
      const zLabel = zIntercept !== null ? `Z_cut = ${zIntercept}m (${deleteDirectionZ})` : deleteDirectionZ;
      elBadgeText.textContent = `DELETE THIS SIDE • ${zLabel}`;
    }

    syncHUDReadouts();
  }

  function countRemainingAlleyTriangles() {
    let tris = 0;
    const visualMesh = scene.getObjectByName('VISUAL_ALLEY_MESH');
    if (visualMesh) {
      visualMesh.traverse((c) => {
        if (c.isMesh && c.geometry) {
          const idx = c.geometry.index;
          const pos = c.geometry.attributes.position;
          if (idx) tris += Math.floor(idx.count / 3);
          else if (pos) tris += Math.floor(pos.count / 3);
        }
      });
    }
    return tris;
  }

  function syncHUDReadouts() {
    const remainingTris = countRemainingAlleyTriangles();
    if (elToggleBtn) {
      elToggleBtn.textContent = state.active ? '✂️ Draw Cut Line: ON (X)' : '✂️ Draw Cut Line: OFF (X)';
      elToggleBtn.style.background = state.active
        ? 'rgba(239, 68, 68, 0.55)'
        : 'rgba(239, 68, 68, 0.24)';
    }
    if (elHudBadge) {
      elHudBadge.textContent = state.active
        ? state.currentPlane
          ? 'LINE READY'
          : 'DRAWING'
        : state.appliedCuts.length > 0
        ? `CUT (${state.appliedCuts.length})`
        : 'STANDBY';
    }
    if (elPreviewBtn) {
      elPreviewBtn.textContent = `Preview Clip: ${state.previewClipEnabled ? 'ON' : 'OFF'}`;
    }
    if (elModeSelect && elModeSelect.value !== state.planeMode) {
      elModeSelect.value = state.planeMode;
    }

    if (state.currentPlane) {
      const cp = state.currentPlane;
      const nStr = `(${cp.normal.x.toFixed(3)}, ${cp.normal.y.toFixed(3)}, ${cp.normal.z.toFixed(3)})`;
      const zStr = cp.zIntercept !== null ? `${cp.zIntercept}m` : 'N/A';
      if (elReadout) {
        elReadout.innerHTML =
          `<strong>Line:</strong> (${Math.round(state.p1.x)},${Math.round(state.p1.y)}) &rarr; (${Math.round(state.p2.x)},${Math.round(state.p2.y)}) | <strong>Z_cut:</strong> ${zStr}<br/>` +
          `<strong>Plane n:</strong> ${nStr} | <strong>d:</strong> ${cp.constant.toFixed(3)}<br/>` +
          `<strong>Delete:</strong> ${cp.deleteDirectionZ} &bull; Press <strong>Enter</strong> or click <strong>Execute Cut</strong>`;
      }
      if (elFloatStatus) {
        elFloatStatus.textContent = `Cut @ Z ≈ ${zStr} (${cp.deleteDirectionZ}) • Press Enter to Delete or Tab to Flip Side`;
      }
    } else if (state.lastCutSummary) {
      const s = state.lastCutSummary;
      if (elReadout) {
        elReadout.innerHTML =
          `<strong>Applied Cut #${state.appliedCuts.length}:</strong> Deleted <strong>${s.deletedTris.toLocaleString()}</strong> tris &amp; <strong>${s.culledPropCount}</strong> props (${s.elapsedMs}ms)<br/>` +
          `<strong>Plane n:</strong> (${s.normal.join(', ')}) | <strong>d:</strong> ${s.constant} | <strong>Z_cut:</strong> ${s.zIntercept ?? 'N/A'}m`;
      }
      if (elFloatStatus) {
        elFloatStatus.textContent = `Cut Executed: Deleted ${s.deletedTris.toLocaleString()} tris & ${s.culledPropCount} props (${s.elapsedMs}ms)`;
      }
    } else {
      if (elReadout) {
        elReadout.textContent = state.active
          ? 'Drag a straight line across the viewport (or click 2 points) to designate the cut.'
          : 'Line: None • Click "Draw Cut Line (X)" then drag across screen';
      }
      if (elFloatStatus) {
        elFloatStatus.textContent = 'Click & drag (or click 2 points) to draw a straight cut line';
      }
    }

    if (elTelCutter) {
      if (state.appliedCuts.length > 0) {
        const last = state.appliedCuts[state.appliedCuts.length - 1];
        elTelCutter.textContent = `CUT x${state.appliedCuts.length} (${remainingTris.toLocaleString()} / ${initialPrimaryTriCount.toLocaleString()} Tris | Z_cut=${last.zIntercept ?? 'N/A'}m)`;
      } else if (state.currentPlane) {
        elTelCutter.textContent = `PREVIEW (Z_cut=${state.currentPlane.zIntercept ?? 'N/A'}m • ${state.currentPlane.deleteDirectionZ})`;
      } else {
        elTelCutter.textContent = `UNCUT (${remainingTris.toLocaleString()} / ${initialPrimaryTriCount.toLocaleString()} Tris)`;
      }
    }
  }

  /**
   * Executes a world-space half-space cut across all environment meshes, colliders, SFX, cables, neon, and discrete props.
   */
  function applyWorldCutPlane(planeSpec, { persist = true } = {}) {
    restorePreviewCulledObjects();
    captureBaselineSceneState();
    const t0 = performance.now();

    const normal =
      planeSpec.normal && planeSpec.normal.isVector3
        ? planeSpec.normal.clone().normalize()
        : new THREE.Vector3(
            planeSpec.normal[0],
            planeSpec.normal[1],
            planeSpec.normal[2]
          ).normalize();
    const constant = Number(planeSpec.constant);
    const zIntercept =
      planeSpec.zIntercept !== undefined
        ? planeSpec.zIntercept
        : Math.abs(normal.z) > 1e-4
        ? Number((-(normal.y * floorY + constant) / normal.z).toFixed(2))
        : null;
    const mode = planeSpec.mode || 'VIEW_PLANE';
    const w1 = planeSpec.w1 || [-3.2, floorY, zIntercept || 42.5];
    const w2 = planeSpec.w2 || [3.2, floorY, zIntercept || 42.5];
    const p1 = planeSpec.p1 ? { ...planeSpec.p1 } : { x: 340, y: 360 };
    const p2 = planeSpec.p2 ? { ...planeSpec.p2 } : { x: 940, y: 360 };
    const deleteDirectionZ =
      planeSpec.deleteDirectionZ ||
      (normal.z > 0.15
        ? 'Z > Z_cut (Back Alley)'
        : normal.z < -0.15
        ? 'Z < Z_cut (Front/Entrance)'
        : 'Lateral / Angled');

    // Save pre-cut snapshot for single-step undo
    const stepSnapshot = {
      meshGeometries: [],
      objectStates: [],
    };

    let totalDeletedTris = 0;
    let totalClippedTris = 0;
    let totalRemainingTris = 0;
    const culledProps = [];

    // 1. Slice primary environment, collider, cable, neon, watercolor, and environmental SFX meshes
    const sliceableRoots = getSliceableRoots();
    const slicedMeshUUIDs = new Set();

    for (const root of sliceableRoots) {
      root.traverse((obj) => {
        if (
          obj.isMesh &&
          !obj.isSkinnedMesh &&
          obj.geometry &&
          !slicedMeshUUIDs.has(obj.uuid) &&
          obj.name !== 'PrecipitationEmitterMesh'
        ) {
          slicedMeshUUIDs.add(obj.uuid);
          stepSnapshot.meshGeometries.push({
            mesh: obj,
            geometry: obj.geometry,
          });
          // Also snapshot cable metadata nodes if slicing OverheadHangingCablesBatchMesh
          if (obj.name === 'OverheadHangingCablesBatchMesh' && Array.isArray(obj.userData?.cables)) {
            for (const c of obj.userData.cables) {
              if (c && c.node) {
                stepSnapshot.objectStates.push({
                  obj: c.node,
                  visible: c.node.visible,
                  culledBySceneCutter: Boolean(c.node.userData?.culledBySceneCutter),
                });
              }
            }
          }
          const res = sliceMeshGeometryByWorldPlane(obj, normal, constant);
          if (obj.name === 'OverheadHangingCablesBatchMesh' && Array.isArray(obj.userData?.cables)) {
            for (const c of obj.userData.cables) {
              if (c && c.node && c.node.userData?.culledBySceneCutter && !culledProps.includes(c.id)) {
                culledProps.push(c.id);
              }
            }
          }
          totalDeletedTris += res.deletedTris;
          totalClippedTris += res.clippedTris;
          if (obj.name === 'VISUAL_ALLEY_MESH' || (obj.parent && obj.parent.name === 'VISUAL_ALLEY_MESH')) {
            totalRemainingTris += res.afterTris;
          }
        }
      });
    }

    // 2. Prune discrete scene props, pipes, stations, lights, and assemblies in the deleted half-space s(X) > 0
    const worldPos = new THREE.Vector3();
    for (const grp of getDiscretePropGroups()) {
      for (const child of grp.children) {
        if (child.userData && child.userData.culledBySceneCutter) continue;
        if (!evaluateDiscreteChildWorldCenter(child, worldPos)) continue;
        const s = normal.dot(worldPos) + constant;
        if (s > 0.0) {
          stepSnapshot.objectStates.push({
            obj: child,
            visible: child.visible,
            culledBySceneCutter: Boolean(child.userData && child.userData.culledBySceneCutter),
            intensity: child.isLight ? child.intensity : undefined,
          });
          if (!child.userData) child.userData = {};
          child.userData.culledBySceneCutter = true;
          child.visible = false;
          if (child.isLight) {
            child.intensity = 0.0;
          }
          culledProps.push(child.name || child.uuid);
        }
      }
    }

    // 3. Ensure active player character is never stranded in the deleted half-space
    if (sandbox.getActiveCharacter) {
      const activeChar = sandbox.getActiveCharacter();
      if (activeChar && activeChar.root) {
        const charPos = activeChar.root.position;
        const charS = normal.dot(charPos) + constant;
        if (charS > 0.0) {
          charPos.addScaledVector(normal, -(charS + 0.75));
          charPos.y = floorY;
        }
      }
    }

    const elapsedMs = Number((performance.now() - t0).toFixed(2));
    const cutRecord = {
      cutIndex: state.appliedCuts.length + 1,
      mode,
      p1,
      p2,
      w1,
      w2,
      zIntercept,
      deleteDirectionZ,
      normalVec: normal.clone(),
      normal: [
        Number(normal.x.toFixed(5)),
        Number(normal.y.toFixed(5)),
        Number(normal.z.toFixed(5)),
      ],
      constant: Number(constant.toFixed(5)),
      deletedTris: totalDeletedTris,
      clippedTris: totalClippedTris,
      remainingAlleyTris: totalRemainingTris || countRemainingAlleyTriangles(),
      culledPropCount: culledProps.length,
      culledProps,
      elapsedMs,
      snapshot: stepSnapshot,
    };

    state.appliedCuts.push(cutRecord);
    state.lastCutSummary = cutRecord;

    // Immediately step steam & particle subsystems so culled pipe plumes and rain streaks clear on the same frame
    if (sandbox.alleyPipes && typeof sandbox.alleyPipes.update === 'function') {
      sandbox.alleyPipes.update(1 / 60, 0.0, camera);
    }

    // Clear the active preview line after committing the cut so the user sees the clean sliced scene immediately
    state.p1 = null;
    state.p2 = null;
    state.currentPlane = null;
    state.interactionPhase = state.active ? 'ARMED_READY_TO_DRAW' : 'INACTIVE';
    planeVizMesh.visible = false;
    syncClippingPlanes();
    renderSVGOverlay();

    if (persist) {
      persistCutsToStorage();
    }

    return cutRecord;
  }

  /**
   * Executes the structural half-space cut from the currently drawn 2D screen line.
   */
  function executeCut() {
    if (!state.currentPlane) {
      recomputeCurrentPlane();
    }
    if (!state.currentPlane) {
      return null;
    }
    return applyWorldCutPlane(
      {
        mode: state.currentPlane.mode,
        normal: state.currentPlane.normal,
        constant: state.currentPlane.constant,
        zIntercept: state.currentPlane.zIntercept,
        w1: state.currentPlane.w1,
        w2: state.currentPlane.w2,
        p1: state.p1,
        p2: state.p2,
        deleteDirectionZ: state.currentPlane.deleteDirectionZ,
      },
      { persist: true }
    );
  }

  function undoLastCut() {
    restorePreviewCulledObjects();
    if (state.appliedCuts.length === 0) return false;
    const lastCut = state.appliedCuts.pop();
    const snap = lastCut.snapshot;
    if (snap) {
      for (const item of snap.meshGeometries) {
        item.mesh.geometry = item.geometry;
      }
      for (const item of snap.objectStates) {
        item.obj.visible = item.visible;
        if (item.obj.userData) {
          item.obj.userData.culledBySceneCutter = Boolean(item.culledBySceneCutter);
        }
        if (item.obj.isLight && item.intensity !== undefined) {
          item.obj.intensity = item.intensity;
        }
      }
    }
    state.lastCutSummary =
      state.appliedCuts.length > 0 ? state.appliedCuts[state.appliedCuts.length - 1] : null;
    persistCutsToStorage();
    syncClippingPlanes();
    renderSVGOverlay();
    return true;
  }

  function restoreFullScene() {
    restorePreviewCulledObjects();
    if (!baselineCaptured) {
      clearLine();
      return true;
    }
    for (const { mesh, geometry } of originalMeshGeometries.values()) {
      const restoredGeom = geometry.clone();
      restoredGeom.userData = { ...geometry.userData };
      mesh.geometry = restoredGeom;
    }
    for (const { obj, visible, culledBySceneCutter, intensity } of originalObjectVisibilities.values()) {
      obj.visible = visible;
      if (obj.userData) {
        obj.userData.culledBySceneCutter = Boolean(culledBySceneCutter);
      }
      if (obj.isLight && intensity !== undefined) {
        obj.intensity = intensity;
      }
    }
    state.appliedCuts.length = 0;
    state.lastCutSummary = null;
    persistCutsToStorage();
    clearLine();
    return true;
  }

  function clearLine() {
    restorePreviewCulledObjects();
    state.p1 = null;
    state.p2 = null;
    state.currentPlane = null;
    state.draggingHandle = null;
    state.interactionPhase = state.active ? 'ARMED_READY_TO_DRAW' : 'INACTIVE';
    planeVizMesh.visible = false;
    syncClippingPlanes();
    renderSVGOverlay();
  }

  function flipCutSide() {
    state.polarity *= -1;
    recomputeCurrentPlane();
    renderSVGOverlay();
    return state.polarity;
  }

  function setPlaneMode(mode) {
    if (mode === 'VIEW_PLANE' || mode === 'VERTICAL_PLUMB_PLANE') {
      state.planeMode = mode;
      recomputeCurrentPlane();
      renderSVGOverlay();
    }
    return state.planeMode;
  }

  function setLineEndpoints(p1, p2, options = {}) {
    if (options.planeMode) state.planeMode = options.planeMode;
    if (options.polarity === 1 || options.polarity === -1) state.polarity = options.polarity;
    state.p1 = { x: Number(p1.x), y: Number(p1.y) };
    state.p2 = { x: Number(p2.x), y: Number(p2.y) };
    state.interactionPhase = 'LINE_DEFINED_PENDING_CONFIRM';
    recomputeCurrentPlane();
    renderSVGOverlay();
    return state.currentPlane;
  }

  function toggleActive(forceState = undefined) {
    const next = typeof forceState === 'boolean' ? forceState : !state.active;
    state.active = next;
    state.interactionPhase = next
      ? state.currentPlane
        ? 'LINE_DEFINED_PENDING_CONFIRM'
        : 'ARMED_READY_TO_DRAW'
      : 'INACTIVE';

    if (elOverlay) {
      elOverlay.style.display = next ? 'block' : 'none';
    }
    planeVizMesh.visible = next && Boolean(state.currentPlane);
    syncClippingPlanes();
    renderSVGOverlay();
    return state.active;
  }

  function getTelemetry() {
    const remainingTris = countRemainingAlleyTriangles();
    return {
      active: state.active,
      interactionPhase: state.interactionPhase,
      planeMode: state.planeMode,
      polarity: state.polarity,
      previewClipEnabled: state.previewClipEnabled,
      p1: state.p1 ? { ...state.p1 } : null,
      p2: state.p2 ? { ...state.p2 } : null,
      currentPlane: state.currentPlane
        ? {
            mode: state.currentPlane.mode,
            normal: state.currentPlane.normal.toArray().map((n) => Number(n.toFixed(5))),
            constant: state.currentPlane.constant,
            w1: state.currentPlane.w1,
            w2: state.currentPlane.w2,
            zIntercept: state.currentPlane.zIntercept,
            deleteDirectionZ: state.currentPlane.deleteDirectionZ,
          }
        : null,
      appliedCutCount: state.appliedCuts.length,
      appliedCuts: state.appliedCuts.map((c) => ({
        cutIndex: c.cutIndex,
        mode: c.mode,
        p1: c.p1,
        p2: c.p2,
        w1: c.w1,
        w2: c.w2,
        zIntercept: c.zIntercept,
        deleteDirectionZ: c.deleteDirectionZ,
        normal: c.normal,
        constant: c.constant,
        deletedTris: c.deletedTris,
        clippedTris: c.clippedTris,
        remainingAlleyTris: c.remainingAlleyTris,
        culledPropCount: c.culledPropCount,
        culledProps: c.culledProps,
        elapsedMs: c.elapsedMs,
      })),
      initialPrimaryTriCount,
      remainingAlleyTris: remainingTris,
    };
  }

  // Wire SVG pointer events for Click-Drag AND Two-Click Straight Line Drawing + Endpoint Handle Dragging
  if (elSvg) {
    elSvg.addEventListener('pointerdown', (e) => {
      if (!state.active || e.button !== 0) return;
      e.preventDefault();
      e.stopPropagation();

      const pt = { x: e.clientX, y: e.clientY };

      // If in TWO_CLICK_PENDING phase, second click finalizes P2
      if (state.interactionPhase === 'TWO_CLICK_PENDING' && state.p1) {
        const dist = Math.hypot(pt.x - state.p1.x, pt.y - state.p1.y);
        if (dist >= MIN_LINE_LENGTH_PX) {
          state.p2 = pt;
          state.draggingHandle = null;
          state.interactionPhase = 'LINE_DEFINED_PENDING_CONFIRM';
          recomputeCurrentPlane();
          renderSVGOverlay();
          return;
        }
      }

      // Check if clicking an existing endpoint handle P1 or P2
      if (state.p1 && Math.hypot(pt.x - state.p1.x, pt.y - state.p1.y) <= HANDLE_HIT_RADIUS_PX) {
        state.draggingHandle = 'P1';
        state.interactionPhase = 'DRAWING_LINE';
        elSvg.setPointerCapture(e.pointerId);
        return;
      }
      if (state.p2 && Math.hypot(pt.x - state.p2.x, pt.y - state.p2.y) <= HANDLE_HIT_RADIUS_PX) {
        state.draggingHandle = 'P2';
        state.interactionPhase = 'DRAWING_LINE';
        elSvg.setPointerCapture(e.pointerId);
        return;
      }

      // Start a new straight line at P1
      state.p1 = pt;
      state.p2 = { x: pt.x, y: pt.y };
      state.draggingHandle = 'NEW';
      state.interactionPhase = 'DRAWING_LINE';
      elSvg.setPointerCapture(e.pointerId);
      recomputeCurrentPlane();
      renderSVGOverlay();
    });

    elSvg.addEventListener('pointermove', (e) => {
      if (!state.active) return;
      const pt = { x: e.clientX, y: e.clientY };

      if (state.interactionPhase === 'DRAWING_LINE' && state.draggingHandle) {
        e.preventDefault();
        e.stopPropagation();
        if (state.draggingHandle === 'P1') {
          state.p1 = pt;
        } else {
          state.p2 = pt;
        }
        recomputeCurrentPlane();
        renderSVGOverlay();
      } else if (state.interactionPhase === 'TWO_CLICK_PENDING' && state.p1) {
        state.p2 = pt;
        recomputeCurrentPlane();
        renderSVGOverlay();
      }
    });

    elSvg.addEventListener('pointerup', (e) => {
      if (!state.active || state.interactionPhase !== 'DRAWING_LINE') return;
      e.preventDefault();
      e.stopPropagation();
      try {
        if (elSvg.hasPointerCapture(e.pointerId)) {
          elSvg.releasePointerCapture(e.pointerId);
        }
      } catch (_) {}

      const pt = { x: e.clientX, y: e.clientY };
      if (state.draggingHandle === 'P1') {
        state.p1 = pt;
      } else if (state.draggingHandle === 'P2' || state.draggingHandle === 'NEW') {
        state.p2 = pt;
      }

      const dist = state.p1 && state.p2 ? Math.hypot(state.p2.x - state.p1.x, state.p2.y - state.p1.y) : 0;
      if (dist < MIN_LINE_LENGTH_PX) {
        // Short click without drag -> transition to TWO_CLICK_PENDING so second click sets P2
        state.interactionPhase = 'TWO_CLICK_PENDING';
        state.draggingHandle = null;
      } else {
        state.interactionPhase = 'LINE_DEFINED_PENDING_CONFIRM';
        state.draggingHandle = null;
        recomputeCurrentPlane();
      }
      renderSVGOverlay();
    });
  }

  // Wire HUD & Floating Toolbar Buttons
  if (elToggleBtn) {
    elToggleBtn.addEventListener('click', () => toggleActive());
  }
  for (const btn of [elFlipBtn, elFloatFlipBtn]) {
    if (btn) btn.addEventListener('click', () => flipCutSide());
  }
  if (elModeSelect) {
    elModeSelect.addEventListener('change', (e) => setPlaneMode(e.target.value));
  }
  if (elPreviewBtn) {
    elPreviewBtn.addEventListener('click', () => {
      state.previewClipEnabled = !state.previewClipEnabled;
      syncClippingPlanes();
      syncHUDReadouts();
    });
  }
  for (const btn of [elExecuteBtn, elFloatExecBtn]) {
    if (btn) btn.addEventListener('click', () => executeCut());
  }
  if (elFloatClearBtn) {
    elFloatClearBtn.addEventListener('click', () => clearLine());
  }
  for (const btn of [elUndoBtn, elFloatUndoBtn]) {
    if (btn) btn.addEventListener('click', () => undoLastCut());
  }
  for (const btn of [elRestoreBtn, elFloatRestoreBtn]) {
    if (btn) btn.addEventListener('click', () => restoreFullScene());
  }
  if (elFloatExitBtn) {
    elFloatExitBtn.addEventListener('click', () => toggleActive(false));
  }
  if (elCopyJsonBtn) {
    elCopyJsonBtn.addEventListener('click', () => {
      const jsonStr = JSON.stringify(getTelemetry(), null, 2);
      console.log('[SCENE_CUTTER_TELEMETRY_JSON]\n' + jsonStr);
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(jsonStr).catch(() => {});
      }
      if (elHudBadge) {
        elHudBadge.textContent = 'COPIED JSON';
      }
    });
  }

  window.addEventListener('resize', () => {
    if (state.p1 && state.p2) {
      recomputeCurrentPlane();
      renderSVGOverlay();
    }
  });

  // Restore saved cuts from localStorage, or apply the default back-alley cutoff (Z > 42.5m)
  let initialCutSpecs = DEFAULT_INITIAL_CUT_SPECS;
  try {
    if (typeof localStorage !== 'undefined') {
      const raw = localStorage.getItem(SCENE_CUTS_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          initialCutSpecs = parsed;
        }
      }
    }
  } catch (_) {}

  for (const spec of initialCutSpecs) {
    if (spec && Array.isArray(spec.normal) && typeof spec.constant === 'number') {
      applyWorldCutPlane(spec, { persist: false });
    }
  }
  persistCutsToStorage();

  syncHUDReadouts();

  return {
    get active() {
      return state.active;
    },
    toggleActive,
    setLineEndpoints,
    flipCutSide,
    setPlaneMode,
    executeCut,
    applyWorldCutPlane,
    undoLastCut,
    restoreFullScene,
    clearLine,
    isWorldPointInDeletedHalfSpace,
    getTelemetry,
    recomputeCurrentPlane,
  };
}
