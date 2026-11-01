/**
 * custom_fighter_bridge.js
 *
 * .glb-File-Agnostic A-Pose Real-Time PSP GE / WebGL2 (`GlrVtx` 28 B/vertex) Playable Fighter
 * Replacement Bridge & 36-Fighter Tekken Moveset Selector for Tekken: Dark Resurrection (/tkdr/)
 * (Functional Specifications 058 & 059).
 *
 * Architectural Guarantees:
 *   1. Preserves Emscripten's 5-argument WebGL2 `bufferData(target, srcData, usage, srcOffset, length)`
 *      signature via rest parameters `(...args)` so `HEAPU8` is never uploaded in full.
 *   2. Loads `/tkdr/custom_fighters/registry.json` containing the 36-fighter Tekken roster (`PAU`..`JPC`,
 *      IDs `0..35`) and all compiled `.glb` character bundles (`nicotest_jin`, `nicotest_pau`, `luis_jin`,
 *      `hoodie_law`, etc.), plus supports client-side browser `.glb` file upload & auto-rigging.
 *   3. Suppresses the stock Tekken fighter's opaque & alpha sub-mesh `gl.drawArrays` calls for any bound
 *      fighter slot (`P1` and/or `P2`) so there is zero double-mesh overlay or ghosting.
 *   4. Reconstructs a 3D 14-bone articulated fighting pose (shoulders down, elbows bent ~85 deg into a
 *      martial-arts guard, staggered fighting stance legs, plus live punch/kick/walk/crouch tracking from
 *      the suppressed `GlrVtx` sub-meshes) using 3x3 SO(3) joint-pivot rotations (`R_b * (v - p_rest) + p_live`).
 *   5. Orientates the character in a 3/4 front-facing fighting stance facing the opponent with hardware
 *      `gl.GEQUAL` depth parity (`+Z` chest/face closer to camera than `-Z` back) in <= 1.2 ms/frame.
 */
(function () {
  "use strict";

  const params = new URLSearchParams(window.location.search);
  const bridgeEnabled = params.get("CUSTOM_FIGHTER") !== "0" && params.get("LUIS_FIGHTER") !== "0";

  // Authoritative 36-Fighter Roster (matches eboot.bin 0x2cc9c8 & 0x2f6f2c)
  const DEFAULT_ROSTER = [
    { id: 0,  code: "PAU", shortName: "PAUL",       fullName: "Paul Phoenix",      heightScale: 1.00, shoulderScale: 1.02, limbWidthScale: 1.02 },
    { id: 1,  code: "LAW", shortName: "LAW",        fullName: "Marshall Law",      heightScale: 0.98, shoulderScale: 0.96, limbWidthScale: 0.96 },
    { id: 2,  code: "LEI", shortName: "LEI",        fullName: "Lei Wulong",        heightScale: 0.98, shoulderScale: 0.96, limbWidthScale: 0.96 },
    { id: 3,  code: "KIN", shortName: "KING",       fullName: "King",              heightScale: 1.06, shoulderScale: 1.14, limbWidthScale: 1.12 },
    { id: 4,  code: "YOS", shortName: "YOSHIMITSU", fullName: "Yoshimitsu",        heightScale: 1.00, shoulderScale: 1.00, limbWidthScale: 1.00 },
    { id: 5,  code: "NIN", shortName: "NINA",       fullName: "Nina Williams",     heightScale: 0.93, shoulderScale: 0.86, limbWidthScale: 0.88 },
    { id: 6,  code: "HWO", shortName: "HWOARANG",   fullName: "Hwoarang",          heightScale: 1.01, shoulderScale: 0.98, limbWidthScale: 0.98 },
    { id: 7,  code: "XIA", shortName: "XIAOYU",     fullName: "Ling Xiaoyu",       heightScale: 0.89, shoulderScale: 0.84, limbWidthScale: 0.85 },
    { id: 8,  code: "CHR", shortName: "CHRISTIE",   fullName: "Christie Monteiro", heightScale: 0.94, shoulderScale: 0.87, limbWidthScale: 0.88 },
    { id: 9,  code: "JIN", shortName: "JIN",        fullName: "Jin Kazama",        heightScale: 1.00, shoulderScale: 1.02, limbWidthScale: 1.00 },
    { id: 10, code: "JUL", shortName: "JULIA",      fullName: "Julia Chang",       heightScale: 0.93, shoulderScale: 0.86, limbWidthScale: 0.88 },
    { id: 11, code: "KUM", shortName: "KUMA",       fullName: "Kuma",              heightScale: 1.18, shoulderScale: 1.30, limbWidthScale: 1.28 },
    { id: 12, code: "PAN", shortName: "PANDA",      fullName: "Panda",             heightScale: 1.18, shoulderScale: 1.30, limbWidthScale: 1.28 },
    { id: 13, code: "BRY", shortName: "BRYAN",      fullName: "Bryan Fury",        heightScale: 1.03, shoulderScale: 1.05, limbWidthScale: 1.04 },
    { id: 14, code: "HEI", shortName: "HEIHACHI",   fullName: "Heihachi Mishima",  heightScale: 1.02, shoulderScale: 1.08, limbWidthScale: 1.06 },
    { id: 15, code: "KAZ", shortName: "KAZUYA",     fullName: "Kazuya Mishima",    heightScale: 1.00, shoulderScale: 1.02, limbWidthScale: 1.01 },
    { id: 16, code: "LEE", shortName: "LEE",        fullName: "Lee Chaolan",       heightScale: 0.99, shoulderScale: 0.96, limbWidthScale: 0.96 },
    { id: 17, code: "STE", shortName: "STEVE",      fullName: "Steve Fox",         heightScale: 0.99, shoulderScale: 1.00, limbWidthScale: 1.00 },
    { id: 18, code: "MAR", shortName: "MARDUK",     fullName: "Craig Marduk",      heightScale: 1.12, shoulderScale: 1.20, limbWidthScale: 1.18 },
    { id: 19, code: "MOK", shortName: "MOKUJIN",    fullName: "Mokujin",           heightScale: 1.00, shoulderScale: 1.00, limbWidthScale: 1.00 },
    { id: 20, code: "EDD", shortName: "EDDY",       fullName: "Eddy Gordo",        heightScale: 1.00, shoulderScale: 1.01, limbWidthScale: 1.00 },
    { id: 21, code: "JAC", shortName: "JACK-5",     fullName: "Jack-5",            heightScale: 1.16, shoulderScale: 1.28, limbWidthScale: 1.25 },
    { id: 22, code: "ROG", shortName: "ROGER Jr.",  fullName: "Roger Jr.",         heightScale: 0.86, shoulderScale: 0.90, limbWidthScale: 0.92 },
    { id: 23, code: "ANN", shortName: "ANNA",       fullName: "Anna Williams",     heightScale: 0.93, shoulderScale: 0.86, limbWidthScale: 0.88 },
    { id: 24, code: "WAN", shortName: "WANG",       fullName: "Wang Jinrei",       heightScale: 0.92, shoulderScale: 0.92, limbWidthScale: 0.92 },
    { id: 25, code: "GAN", shortName: "GANRYU",     fullName: "Ganryu",            heightScale: 1.05, shoulderScale: 1.22, limbWidthScale: 1.20 },
    { id: 26, code: "ASK", shortName: "ASUKA",      fullName: "Asuka Kazama",      heightScale: 0.93, shoulderScale: 0.87, limbWidthScale: 0.88 },
    { id: 27, code: "BRU", shortName: "BRUCE",      fullName: "Bruce Irvin",       heightScale: 1.04, shoulderScale: 1.05, limbWidthScale: 1.04 },
    { id: 28, code: "BAE", shortName: "BAEK",       fullName: "Baek Doo San",      heightScale: 1.00, shoulderScale: 0.98, limbWidthScale: 0.98 },
    { id: 29, code: "DVJ", shortName: "DEVIL JIN",  fullName: "Devil Jin",         heightScale: 1.00, shoulderScale: 1.03, limbWidthScale: 1.01 },
    { id: 30, code: "RAV", shortName: "RAVEN",      fullName: "Raven",             heightScale: 1.02, shoulderScale: 1.03, limbWidthScale: 1.02 },
    { id: 31, code: "FEN", shortName: "FENG",       fullName: "Feng Wei",          heightScale: 1.02, shoulderScale: 1.06, limbWidthScale: 1.05 },
    { id: 32, code: "AMK", shortName: "ARMOR KING", fullName: "Armor King",        heightScale: 1.06, shoulderScale: 1.15, limbWidthScale: 1.12 },
    { id: 33, code: "LIL", shortName: "LILI",       fullName: "Lili",              heightScale: 0.96, shoulderScale: 0.87, limbWidthScale: 0.88 },
    { id: 34, code: "DRA", shortName: "DRAGUNOV",   fullName: "Sergei Dragunov",   heightScale: 1.03, shoulderScale: 1.03, limbWidthScale: 1.02 },
    { id: 35, code: "JPC", shortName: "JINPACHI",   fullName: "Jinpachi Mishima",  heightScale: 1.10, shoulderScale: 1.18, limbWidthScale: 1.16 },
  ];

  const statusTelemetry = {
    enabled: bridgeEnabled,
    ready: false,
    bundleLoaded: false,
    atlasLoaded: false,
    activeBundleId: null,
    sourceGlbName: null,
    targetFighterCode: "JIN",
    targetFighterId: 9,
    targetFighterName: "Jin Kazama",
    availableBundlesCount: 0,
    rosterFighterCount: 36,
    vertexCount: 0,
    triangleCount: 0,
    boneCount: 14,
    framesReplaced: 0,
    matched3dFrames: 0,
    suppressedDrawsLastFrame: 0,
    stockDrawsSuppressed: 0,
    luisVertsSubmittedLastFrame: 0,
    luisTrianglesRendered: 0,
    lastSkinningMs: 0,
  };

  function syncGlobalTelemetry() {
    if (window.__TKDR_STATUS__) {
      window.__TKDR_STATUS__.customFighter = statusTelemetry;
      window.__TKDR_STATUS__.luisFighter = statusTelemetry;
    }
  }
  syncGlobalTelemetry();
  setInterval(syncGlobalTelemetry, 250);

  const state = {
    roster: DEFAULT_ROSTER.slice(),
    rosterByCode: new Map(),
    bundles: new Map(),
    p1BundleId: params.get("P1_GLB") || null,
    p1FighterCode: (params.get("P1_FIGHTER") || "JIN").toUpperCase(),
    p2BundleId: params.get("P2_GLB") || "NONE",
    p2FighterCode: (params.get("P2_FIGHTER") || "PAU").toUpperCase(),
    gl: null,
    customVao: null,
    customVbo: null,
    curProg: null,
    progUniforms: new WeakMap(),
    curVao: null,
    curArrayBuf: null,
    curTex2D: null,
    curSampler0: null,
    inBridgeDraw: false,
    frameView: null,
    frameNumVerts: 0,
    p1TrackCx: 145.0,
    p1PrevCx: 145.0,
    p1WalkPhase: 0.0,
    p2TrackCx: 335.0,
    p2PrevCx: 335.0,
    p2WalkPhase: 0.0,
    p1Acc: null,
    p2Acc: null,
  };

  for (const f of state.roster) {
    state.rosterByCode.set(f.code, f);
  }

  function createSlotAccumulator() {
    return {
      suppressedDraws: 0,
      suppressedVerts: 0,
      injectedThisBatch: false,
      minPx: Infinity,
      maxPx: -Infinity,
      minPy: Infinity,
      maxPy: -Infinity,
      minPz: Infinity,
      maxPz: -Infinity,
      minW: Infinity,
      maxW: -Infinity,
      sumWeightedCx: 0,
      sumWeightedCy: 0,
      sumWeightedCz: 0,
      sumWeightedCw: 0,
      totalWeight: 0,
      // Upper-body (punch/guard) and lower-body (stance/kick) sub-mesh extrema
      upperMinCx: Infinity,
      upperMaxCx: -Infinity,
      upperExtCy: 135.0,
      lowerMinCx: Infinity,
      lowerMaxCx: -Infinity,
      lowerHighFootCy: 245.0,
    };
  }

  state.p1Acc = createSlotAccumulator();
  state.p2Acc = createSlotAccumulator();

  function resetAccumulator(acc) {
    acc.suppressedDraws = 0;
    acc.suppressedVerts = 0;
    acc.injectedThisBatch = false;
    acc.minPx = Infinity;
    acc.maxPx = -Infinity;
    acc.minPy = Infinity;
    acc.maxPy = -Infinity;
    acc.minPz = Infinity;
    acc.maxPz = -Infinity;
    acc.minW = Infinity;
    acc.maxW = -Infinity;
    acc.sumWeightedCx = 0;
    acc.sumWeightedCy = 0;
    acc.sumWeightedCz = 0;
    acc.sumWeightedCw = 0;
    acc.totalWeight = 0;
    acc.upperMinCx = Infinity;
    acc.upperMaxCx = -Infinity;
    acc.upperExtCy = 135.0;
    acc.lowerMinCx = Infinity;
    acc.lowerMaxCx = -Infinity;
    acc.lowerHighFootCy = 245.0;
  }

  // Compute 3x3 rotation matrix R (9 floats, row-major) that rotates unit vector uRest -> uLive
  function buildRodriguesRotation3x3(ux, uy, uz, vx, vy, vz, out9, offset) {
    // Cross product c = u x v
    const cx = uy * vz - uz * vy;
    const cy = uz * vx - ux * vz;
    const cz = ux * vy - uy * vx;
    const dot = Math.max(-1.0, Math.min(1.0, ux * vx + uy * vy + uz * vz));

    if (dot > 0.99995) {
      out9[offset + 0] = 1.0; out9[offset + 1] = 0.0; out9[offset + 2] = 0.0;
      out9[offset + 3] = 0.0; out9[offset + 4] = 1.0; out9[offset + 5] = 0.0;
      out9[offset + 6] = 0.0; out9[offset + 7] = 0.0; out9[offset + 8] = 1.0;
      return;
    }
    if (dot < -0.9995) {
      // 180 deg rotation around an orthogonal axis
      out9[offset + 0] = -1.0; out9[offset + 1] = 0.0;  out9[offset + 2] = 0.0;
      out9[offset + 3] = 0.0;  out9[offset + 4] = -1.0; out9[offset + 5] = 0.0;
      out9[offset + 6] = 0.0;  out9[offset + 7] = 0.0;  out9[offset + 8] = 1.0;
      return;
    }

    const k = 1.0 / (1.0 + dot);
    out9[offset + 0] = dot + cx * cx * k;
    out9[offset + 1] = cx * cy * k - cz;
    out9[offset + 2] = cx * cz * k + cy;

    out9[offset + 3] = cy * cx * k + cz;
    out9[offset + 4] = dot + cy * cy * k;
    out9[offset + 5] = cy * cz * k - cx;

    out9[offset + 6] = cz * cx * k - cy;
    out9[offset + 7] = cz * cy * k + cx;
    out9[offset + 8] = dot + cz * cz * k;
  }

  function parseRigBinary(arrayBuffer, manifest) {
    const dv = new DataView(arrayBuffer);
    const magic = String.fromCharCode(
      dv.getUint8(0), dv.getUint8(1), dv.getUint8(2), dv.getUint8(3),
      dv.getUint8(4), dv.getUint8(5), dv.getUint8(6), dv.getUint8(7)
    );
    if (magic !== "LUISTKDR" && magic !== "TKDRGLB1") {
      throw new Error("Invalid rig.bin magic: " + magic);
    }
    const version = dv.getUint32(8, true);
    const vertexCount = dv.getUint32(12, true);
    const triangleCount = dv.getUint32(16, true);
    const boneCount = dv.getUint32(20, true);
    const targetFighterId = dv.getUint32(24, true);
    const heightScale = dv.getFloat32(28, true);
    const shoulderScale = dv.getFloat32(32, true);
    const limbWidthScale = dv.getFloat32(36, true);

    const pivots = new Float32Array(boneCount * 3);
    let off = 40;
    for (let i = 0; i < boneCount * 3; i++) {
      pivots[i] = dv.getFloat32(off, true);
      off += 4;
    }

    // Derive rest-pose bone start (restHead), end (restTail), length (restLen), and unit vector (restDir)
    // from the 14 measured anatomical pivots stored in rig.bin
    const restHead = new Float32Array(14 * 3);
    const restTail = new Float32Array(14 * 3);
    const restLen = new Float32Array(14);
    const restDir = new Float32Array(14 * 3);

    restHead.set(pivots);

    // Child/tail mapping for the 14 Tekken anatomical bones:
    // 0:Pelvis->1, 1:Chest->2, 2:Neck->3, 3:Head->crown,
    // 4:L_UpperArm->5(L_Elbow), 5:L_Forearm->6(L_Wrist), 6:L_Hand->extrapolated tip,
    // 7:R_UpperArm->8(R_Elbow), 8:R_Forearm->9(R_Wrist), 9:R_Hand->extrapolated tip,
    // 10:L_Thigh->11(L_Knee), 11:L_Calf_Foot->ankle, 12:R_Thigh->13(R_Knee), 13:R_Calf_Foot->ankle
    const setTail = (b, tx, ty, tz) => {
      restTail[b * 3 + 0] = tx;
      restTail[b * 3 + 1] = ty;
      restTail[b * 3 + 2] = tz;
      const dx = tx - restHead[b * 3 + 0];
      const dy = ty - restHead[b * 3 + 1];
      const dz = tz - restHead[b * 3 + 2];
      const len = Math.max(1e-4, Math.hypot(dx, dy, dz));
      restLen[b] = len;
      restDir[b * 3 + 0] = dx / len;
      restDir[b * 3 + 1] = dy / len;
      restDir[b * 3 + 2] = dz / len;
    };

    setTail(0, pivots[1 * 3 + 0], pivots[1 * 3 + 1], pivots[1 * 3 + 2]);
    setTail(1, pivots[2 * 3 + 0], pivots[2 * 3 + 1], pivots[2 * 3 + 2]);
    setTail(2, pivots[3 * 3 + 0], pivots[3 * 3 + 1], pivots[3 * 3 + 2]);
    setTail(3, pivots[3 * 3 + 0], 0.990, pivots[3 * 3 + 2]);

    // Left Arm (4 -> 5 -> 6 -> tip)
    setTail(4, pivots[5 * 3 + 0], pivots[5 * 3 + 1], pivots[5 * 3 + 2]);
    setTail(5, pivots[6 * 3 + 0], pivots[6 * 3 + 1], pivots[6 * 3 + 2]);
    setTail(
      6,
      pivots[6 * 3 + 0] + (pivots[6 * 3 + 0] - pivots[5 * 3 + 0]) * 0.55,
      pivots[6 * 3 + 1] + (pivots[6 * 3 + 1] - pivots[5 * 3 + 1]) * 0.55,
      pivots[6 * 3 + 2] + (pivots[6 * 3 + 2] - pivots[5 * 3 + 2]) * 0.55
    );

    // Right Arm (7 -> 8 -> 9 -> tip)
    setTail(7, pivots[8 * 3 + 0], pivots[8 * 3 + 1], pivots[8 * 3 + 2]);
    setTail(8, pivots[9 * 3 + 0], pivots[9 * 3 + 1], pivots[9 * 3 + 2]);
    setTail(
      9,
      pivots[9 * 3 + 0] + (pivots[9 * 3 + 0] - pivots[8 * 3 + 0]) * 0.55,
      pivots[9 * 3 + 1] + (pivots[9 * 3 + 1] - pivots[8 * 3 + 1]) * 0.55,
      pivots[9 * 3 + 2] + (pivots[9 * 3 + 2] - pivots[8 * 3 + 2]) * 0.55
    );

    // Left Leg (10 -> 11 -> ankle)
    setTail(10, pivots[11 * 3 + 0], pivots[11 * 3 + 1], pivots[11 * 3 + 2]);
    setTail(11, pivots[11 * 3 + 0], 0.025, 0.0);

    // Right Leg (12 -> 13 -> ankle)
    setTail(12, pivots[13 * 3 + 0], pivots[13 * 3 + 1], pivots[13 * 3 + 2]);
    setTail(13, pivots[13 * 3 + 0], 0.025, 0.0);

    const pos = new Float32Array(vertexCount * 3);
    const norm = new Float32Array(vertexCount * 3);
    const uv = new Float32Array(vertexCount * 2);
    const joints = new Uint8Array(vertexCount * 4);
    const weights = new Float32Array(vertexCount * 4);

    for (let v = 0; v < vertexCount; v++) {
      pos[v * 3 + 0] = dv.getFloat32(off + 0, true);
      pos[v * 3 + 1] = dv.getFloat32(off + 4, true);
      pos[v * 3 + 2] = dv.getFloat32(off + 8, true);
      norm[v * 3 + 0] = dv.getFloat32(off + 12, true);
      norm[v * 3 + 1] = dv.getFloat32(off + 16, true);
      norm[v * 3 + 2] = dv.getFloat32(off + 20, true);
      uv[v * 2 + 0] = dv.getFloat32(off + 24, true);
      uv[v * 2 + 1] = dv.getFloat32(off + 28, true);
      joints[v * 4 + 0] = dv.getUint8(off + 32);
      joints[v * 4 + 1] = dv.getUint8(off + 33);
      joints[v * 4 + 2] = dv.getUint8(off + 34);
      joints[v * 4 + 3] = dv.getUint8(off + 35);
      weights[v * 4 + 0] = dv.getFloat32(off + 36, true);
      weights[v * 4 + 1] = dv.getFloat32(off + 40, true);
      weights[v * 4 + 2] = dv.getFloat32(off + 44, true);
      weights[v * 4 + 3] = dv.getFloat32(off + 48, true);
      off += 52;
    }

    const numIndices = triangleCount * 3;
    const indices = new Uint16Array(numIndices);
    for (let i = 0; i < numIndices; i++) {
      indices[i] = dv.getUint16(off, true);
      off += 2;
    }

    // Pre-allocate GlrVtx staging buffer (28 bytes/vertex = 7 float32 words)
    const stagingBuf = new ArrayBuffer(numIndices * 28);
    const stagingF32 = new Float32Array(stagingBuf);
    const stagingU32 = new Uint32Array(stagingBuf);

    // Pre-populate static UV coordinates and directional hemisphere lighting per vertex
    const vShade = new Uint32Array(vertexCount);
    for (let v = 0; v < vertexCount; v++) {
      const nx = norm[v * 3 + 0];
      const ny = norm[v * 3 + 1];
      const nz = norm[v * 3 + 2];
      // Key light from front (+Z) and above (+Y)
      const ndotl = Math.max(0.0, nx * 0.22 + ny * 0.42 + Math.max(0.0, nz) * 0.88);
      const lum = Math.min(255, Math.max(168, Math.round((0.72 + 0.28 * ndotl) * 255)));
      vShade[v] = (255 << 24) | (lum << 16) | (lum << 8) | lum;
    }
    for (let i = 0; i < numIndices; i++) {
      const vi = indices[i];
      const baseF = i * 7;
      stagingF32[baseF + 4] = uv[vi * 2 + 0];
      stagingF32[baseF + 5] = uv[vi * 2 + 1];
      stagingU32[baseF + 6] = vShade[vi];
    }

    return {
      bundleId: manifest.bundleId,
      label: manifest.label || manifest.bundleId,
      manifest,
      version,
      vertexCount,
      triangleCount,
      boneCount,
      targetFighterId,
      heightScale,
      shoulderScale,
      limbWidthScale,
      pivots,
      restHead,
      restTail,
      restLen,
      restDir,
      liveHead: new Float32Array(14 * 3),
      liveRot: new Float32Array(14 * 9),
      pos,
      norm,
      uv,
      joints,
      weights,
      indices,
      stagingBuf,
      stagingF32,
      stagingU32,
      skinnedPx: new Float32Array(vertexCount),
      skinnedPy: new Float32Array(vertexCount),
      skinnedPz: new Float32Array(vertexCount),
      skinnedW: new Float32Array(vertexCount),
      atlasImg: null,
      atlasTex: null,
    };
  }

  function ensureBundleTexture(gl, bundle) {
    if (bundle.atlasTex) return bundle.atlasTex;
    if (!bundle.atlasImg) return null;
    const prevTex = state.curTex2D;
    const tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.pixelStorei(gl.UNPACK_ALIGNMENT, 4);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, gl.RGBA, gl.UNSIGNED_BYTE, bundle.atlasImg);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAX_LEVEL, 0);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.bindTexture(gl.TEXTURE_2D, prevTex);
    bundle.atlasTex = tex;
    return tex;
  }

  async function loadBundle(manifest) {
    const [rigResp, img] = await Promise.all([
      fetch(manifest.rigUrl),
      new Promise((resolve, reject) => {
        const image = new Image();
        image.crossOrigin = "anonymous";
        image.onload = () => resolve(image);
        image.onerror = reject;
        image.src = manifest.atlasUrl;
      }),
    ]);
    if (!rigResp.ok) throw new Error("Failed to fetch " + manifest.rigUrl);
    const rigBuf = await rigResp.arrayBuffer();
    const bundle = parseRigBinary(rigBuf, manifest);
    bundle.atlasImg = img;
    state.bundles.set(bundle.bundleId, bundle);
    statusTelemetry.availableBundlesCount = state.bundles.size;
    return bundle;
  }

  function updateActiveTelemetry() {
    const b = state.bundles.get(state.p1BundleId);
    const f = state.rosterByCode.get(state.p1FighterCode) || state.roster[9];
    statusTelemetry.targetFighterCode = f.code;
    statusTelemetry.targetFighterId = f.id;
    statusTelemetry.targetFighterName = f.fullName;
    statusTelemetry.rosterFighterCount = state.roster.length;
    statusTelemetry.availableBundlesCount = state.bundles.size;
    if (b) {
      statusTelemetry.ready = !!b.atlasImg;
      statusTelemetry.bundleLoaded = true;
      statusTelemetry.atlasLoaded = !!b.atlasImg;
      statusTelemetry.activeBundleId = b.bundleId;
      statusTelemetry.sourceGlbName = b.manifest.sourceGlbName || b.bundleId;
      statusTelemetry.vertexCount = b.vertexCount;
      statusTelemetry.triangleCount = b.triangleCount;
      statusTelemetry.luisTrianglesRendered = b.triangleCount;
      statusTelemetry.boneCount = b.boneCount;
    } else {
      statusTelemetry.activeBundleId = "NONE";
    }
    syncGlobalTelemetry();
  }

  async function initRegistryAndBundles() {
    try {
      const regResp = await fetch("./custom_fighters/registry.json");
      if (regResp.ok) {
        const reg = await regResp.json();
        if (Array.isArray(reg.roster) && reg.roster.length === 36) {
          state.roster = reg.roster;
          state.rosterByCode.clear();
          for (const f of state.roster) state.rosterByCode.set(f.code, f);
        }
        const bundleEntries = Object.values(reg.bundles || {});
        await Promise.all(bundleEntries.map((m) => loadBundle(m)));
        if (!state.p1BundleId) {
          state.p1BundleId =
            (reg.bindings && reg.bindings.p1BundleId) ||
            (state.bundles.has("nicotest_jin") ? "nicotest_jin" : bundleEntries[0] && bundleEntries[0].bundleId);
        }
        if (!params.get("P1_FIGHTER") && reg.bindings && reg.bindings.p1FighterCode) {
          state.p1FighterCode = reg.bindings.p1FighterCode;
        }
      } else {
        const mResp = await fetch("./luis_fighter/manifest.json");
        if (mResp.ok) {
          const m = await mResp.json();
          const b = await loadBundle(m);
          if (!state.p1BundleId) state.p1BundleId = b.bundleId;
        }
      }
      updateActiveTelemetry();
      buildSelectorUI();
    } catch (err) {
      console.warn("[custom_fighter_bridge] Registry load warning:", err);
    }
  }

  /**
   * Solve the 14-bone 3D kinematic fighting pose (liveHead[14*3] and liveRot[14*9]) in 3D character space:
   *   +X = Character Left, -X = Character Right, +Y = Up (0..1), +Z = Forward toward Opponent.
   *
   * Deforms any A-pose (or T-pose) .glb from its measured rest pivots (`bundle.restHead`, `bundle.restDir`)
   * into a Tekken martial-arts fighting stance (shoulders rotated down, elbows bent ~85 deg with fists
   * raised protecting the jaw/chest, legs staggered in a front-foot/back-foot fighting stance) and
   * dynamically drives punches, kicks, crouches, and walking strides from the suppressed Tekken GlrVtx draws.
   */
  function solveLive3DFightingPose(bundle, acc, rawHeightPx, meanCx, facingSign, isP1) {
    const rH = bundle.restHead;
    const rLen = bundle.restLen;
    const rDir = bundle.restDir;
    const lH = bundle.liveHead;
    const lRot = bundle.liveRot;

    // 1. Extract live combat motion signals from the suppressed Tekken fighter's GlrVtx sub-meshes
    const crouch = Math.max(0.0, Math.min(0.32, (172.0 - rawHeightPx) / 165.0));
    const upperReachPx =
      facingSign > 0
        ? Math.max(0.0, acc.upperMaxCx - meanCx)
        : Math.max(0.0, meanCx - acc.upperMinCx);
    const lowerReachPx =
      facingSign > 0
        ? Math.max(0.0, acc.lowerMaxCx - meanCx)
        : Math.max(0.0, meanCx - acc.lowerMinCx);

    // Punch extension (0.0 in guard -> 1.0 when jabbing/punching toward opponent)
    const punchExt = Math.max(0.0, Math.min(1.0, (upperReachPx - 25.0) / 36.0));
    // Kick extension (0.0 in stance -> 1.0 when kicking toward opponent)
    const kickExt = Math.max(0.0, Math.min(1.0, (lowerReachPx - 28.0) / 38.0));

    // Track horizontal locomotion velocity for natural walking stride
    const prevCx = isP1 ? state.p1PrevCx : state.p2PrevCx;
    const velCx = Math.max(-6.0, Math.min(6.0, meanCx - prevCx));
    if (isP1) {
      state.p1PrevCx = meanCx;
      state.p1WalkPhase += velCx * 0.18 + 0.07;
    } else {
      state.p2PrevCx = meanCx;
      state.p2WalkPhase += velCx * 0.18 + 0.07;
    }
    const phase = isP1 ? state.p1WalkPhase : state.p2WalkPhase;
    const stride = Math.sin(phase) * Math.min(1.0, Math.abs(velCx) * 0.45 + 0.18);
    const breath = Math.sin(phase * 0.8) * 0.008;

    // Helper: set bone b's liveHead = (hx, hy, hz), compute unit direction toward (tx, ty, tz),
    // build Rodrigues rotation R_b: restDir[b] -> liveDir[b], and return the live tail (qx, qy, qz)
    const poseBoneDir = (b, hx, hy, hz, dx, dy, dz) => {
      lH[b * 3 + 0] = hx;
      lH[b * 3 + 1] = hy;
      lH[b * 3 + 2] = dz !== undefined ? hz : 0.0;
      const dLen = Math.max(1e-5, Math.hypot(dx, dy, dz));
      const ux = dx / dLen;
      const uy = dy / dLen;
      const uz = dz / dLen;
      buildRodriguesRotation3x3(
        rDir[b * 3 + 0], rDir[b * 3 + 1], rDir[b * 3 + 2],
        ux, uy, uz,
        lRot, b * 9
      );
      const len = rLen[b];
      return [hx + ux * len, hy + uy * len, hz + uz * len];
    };

    // --- Torso Chain (0: Pelvis -> 1: Chest_Spine -> 2: Neck -> 3: Head) ---
    const pelvisY = Math.max(0.28, rH[0 * 3 + 1] - 0.025 - crouch * 0.14 + breath);
    const pelvisZ = -0.010;
    const p1Tail = poseBoneDir(0, 0.0, pelvisY, pelvisZ, 0.0, 0.995, 0.095 + punchExt * 0.08);
    const p2Tail = poseBoneDir(1, p1Tail[0], p1Tail[1], p1Tail[2], 0.0, 0.992, 0.125 + punchExt * 0.10);
    const p3Tail = poseBoneDir(2, p2Tail[0], p2Tail[1], p2Tail[2], 0.0, 0.996, 0.085);
    poseBoneDir(3, p3Tail[0], p3Tail[1], p3Tail[2], 0.0, 0.998, 0.055);

    const chestDeltaY = p1Tail[1] - rH[1 * 3 + 1];
    const chestDeltaZ = p1Tail[2] - rH[1 * 3 + 2];

    // --- Left Arm (4: L_UpperArm -> 5: L_Forearm -> 6: L_Hand) [Lead Guard & Jab Arm] ---
    // Shoulder attaches to posed upper torso, slightly yawed forward (+Z) as the lead shoulder
    const lShX = rH[4 * 3 + 0] * 0.96;
    const lShY = rH[4 * 3 + 1] + chestDeltaY;
    const lShZ = rH[4 * 3 + 2] + chestDeltaZ + 0.028;

    // Upper arm: in guard, hangs down beside ribs & angled slightly forward (+Z); in punch, swings forward/up
    const lUpDx = 0.16 * (1.0 - punchExt) + 0.04 * punchExt;
    const lUpDy = -0.92 * (1.0 - punchExt) - 0.12 * punchExt;
    const lUpDz = (0.35 + 0.08 * stride) * (1.0 - punchExt) + 0.98 * punchExt;
    const lElbow = poseBoneDir(4, lShX, lShY, lShZ, lUpDx, lUpDy, lUpDz);

    // Forearm: in guard, bends ~85 deg UP and FORWARD at the elbow so the fist protects the chin/cheek!
    const lLoDx = -0.10 * (1.0 - punchExt) - 0.04 * punchExt;
    const lLoDy = (0.56 + 0.04 * Math.sin(phase)) * (1.0 - punchExt) + 0.06 * punchExt;
    const lLoDz = 0.82 * (1.0 - punchExt) + 0.99 * punchExt;
    const lWrist = poseBoneDir(5, lElbow[0], lElbow[1], lElbow[2], lLoDx, lLoDy, lLoDz);

    // Hand/Fist continues forearm direction
    poseBoneDir(6, lWrist[0], lWrist[1], lWrist[2], lLoDx, lLoDy * 0.85, lLoDz);

    // --- Right Arm (7: R_UpperArm -> 8: R_Forearm -> 9: R_Hand) [Rear Guard & Cross Arm] ---
    const rShX = rH[7 * 3 + 0] * 0.96;
    const rShY = rH[7 * 3 + 1] + chestDeltaY;
    const rShZ = rH[7 * 3 + 2] + chestDeltaZ - 0.022;

    const rUpDx = -0.18;
    const rUpDy = -0.94;
    const rUpDz = 0.28 - 0.08 * stride;
    const rElbow = poseBoneDir(7, rShX, rShY, rShZ, rUpDx, rUpDy, rUpDz);

    // Rear forearm bends UP and FORWARD protecting the jaw/ribcage
    const rLoDx = 0.14;
    const rLoDy = 0.62 - 0.04 * Math.sin(phase);
    const rLoDz = 0.77;
    const rWrist = poseBoneDir(8, rElbow[0], rElbow[1], rElbow[2], rLoDx, rLoDy, rLoDz);
    poseBoneDir(9, rWrist[0], rWrist[1], rWrist[2], rLoDx, rLoDy * 0.85, rLoDz);

    // --- Left Leg (10: L_Thigh -> 11: L_Calf_Foot) [Lead Leg: stepped forward in fighting stance] ---
    const lHipX = rH[10 * 3 + 0];
    const lHipY = pelvisY;
    const lHipZ = pelvisZ + 0.020;

    const lThDx = 0.06;
    const lThDy = -0.92 * (1.0 - kickExt) + 0.10 * kickExt;
    const lThDz = (0.36 + 0.14 * stride) * (1.0 - kickExt) + 0.98 * kickExt;
    const lKnee = poseBoneDir(10, lHipX, lHipY, lHipZ, lThDx, lThDy, lThDz);

    const lCaDx = 0.04;
    const lCaDy = -0.98 * (1.0 - kickExt) + 0.08 * kickExt;
    const lCaDz = (-0.12 + 0.10 * stride) * (1.0 - kickExt) + 0.99 * kickExt;
    poseBoneDir(11, lKnee[0], lKnee[1], lKnee[2], lCaDx, lCaDy, lCaDz);

    // --- Right Leg (12: R_Thigh -> 13: R_Calf_Foot) [Rear Leg: braced back in fighting stance] ---
    const rHipX = rH[12 * 3 + 0];
    const rHipY = pelvisY;
    const rHipZ = pelvisZ - 0.020;

    const rThDx = -0.06;
    const rThDy = -0.95;
    const rThDz = -0.28 - 0.14 * stride;
    const rKnee = poseBoneDir(12, rHipX, rHipY, rHipZ, rThDx, rThDy, rThDz);

    const rCaDx = -0.04;
    const rCaDy = -0.97;
    const rCaDz = -0.22 - 0.10 * stride;
    poseBoneDir(13, rKnee[0], rKnee[1], rKnee[2], rCaDx, rCaDy, rCaDz);
  }

  function skinAndInjectFighter(gl, origBufferData, origDrawArrays, bundle, fighterProfile, acc, isP1) {
    if (!bundle || !bundle.atlasImg || acc.injectedThisBatch) return;
    acc.injectedThisBatch = true;

    const t0 = performance.now();
    const wTotal = Math.max(1e-5, acc.totalWeight);
    const meanCx = acc.sumWeightedCx / wTotal;
    const meanCz = acc.sumWeightedCz / wTotal;
    const meanCw = Math.max(800.0, Math.min(9000.0, acc.sumWeightedCw / wTotal));

    // PSP screen Y has 0 at top (Head) and 272 at bottom (Feet)
    const yTop = Math.max(12.0, Math.min(205.0, acc.minPy));
    const yBot = Math.max(yTop + 48.0, Math.min(268.0, acc.maxPy));
    const rawHeightPx = yBot - yTop;

    const hScale = fighterProfile ? fighterProfile.heightScale : bundle.heightScale;
    const sScale = fighterProfile ? fighterProfile.shoulderScale : bundle.shoulderScale;
    const lScale = fighterProfile ? fighterProfile.limbWidthScale : bundle.limbWidthScale;

    const heightPx = rawHeightPx * hScale;
    const widthScalePx = rawHeightPx * 0.92 * sScale;
    const facingSign = isP1
      ? (state.p1TrackCx <= state.p2TrackCx ? 1.0 : -1.0)
      : (state.p2TrackCx < state.p1TrackCx ? 1.0 : -1.0);

    // 1. Solve 14-bone 3D fighting pose (SO(3) joint rotations + live combat targets)
    solveLive3DFightingPose(bundle, acc, rawHeightPx, meanCx, facingSign, isP1);

    const vCount = bundle.vertexCount;
    const pos = bundle.pos;
    const joints = bundle.joints;
    const weights = bundle.weights;
    const rH = bundle.restHead;
    const lH = bundle.liveHead;
    const lRot = bundle.liveRot;
    const sPx = bundle.skinnedPx;
    const sPy = bundle.skinnedPy;
    const sPz = bundle.skinnedPz;
    const sW = bundle.skinnedW;

    // 3/4 Front-Facing Fighting Yaw:
    // +Z_char (Face & "Durp" shirt front) points toward the opponent (+X_screen * facingSign)
    // AND toward the camera (+Z_depth in PSP gl.GEQUAL depth buffer so front occludes back!)
    const cosYaw = 0.62;
    const sinYaw = 0.78;

    // 2. 4-bone Linear Blend Skinning (LBS) with 3x3 joint rotations:
    //    v_posed = sum_k w_k * (liveHead[j_k] + R[j_k] * (v_rest - restHead[j_k]))
    for (let v = 0; v < vCount; v++) {
      const v3 = v * 3;
      const v4 = v * 4;
      const vx = pos[v3 + 0] * lScale;
      const vy = pos[v3 + 1];
      const vz = pos[v3 + 2] * lScale;

      let px3d = 0.0, py3d = 0.0, pz3d = 0.0;

      for (let k = 0; k < 4; k++) {
        const w = weights[v4 + k];
        if (w <= 1e-5) continue;
        const b = joints[v4 + k];
        const b3 = b * 3;
        const b9 = b * 9;

        const rx = vx - rH[b3 + 0];
        const ry = vy - rH[b3 + 1];
        const rz = vz - rH[b3 + 2];

        const tx = lH[b3 + 0] + lRot[b9 + 0] * rx + lRot[b9 + 1] * ry + lRot[b9 + 2] * rz;
        const ty = lH[b3 + 1] + lRot[b9 + 3] * rx + lRot[b9 + 4] * ry + lRot[b9 + 5] * rz;
        const tz = lH[b3 + 2] + lRot[b9 + 6] * rx + lRot[b9 + 7] * ry + lRot[b9 + 8] * rz;

        px3d += w * tx;
        py3d += w * ty;
        pz3d += w * tz;
      }

      // Project 3D character space (px3d, py3d, pz3d) into PSP 480x272 screen + GEQUAL depth space:
      // Note: +pz3d is character front (Face / "Durp" logo). Adding +rotZ to meanCz places the front
      // closer to the camera (higher pz in gl.GEQUAL) than the back!
      const rotX = (px3d * cosYaw + pz3d * sinYaw) * facingSign;
      const rotZ = -px3d * sinYaw * facingSign + pz3d * cosYaw;

      sPx[v] = meanCx + rotX * widthScalePx;
      sPy[v] = yBot - py3d * heightPx;
      sPz[v] = Math.max(100.0, Math.min(65400.0, meanCz + rotZ * 420.0));
      sW[v] = Math.max(400.0, meanCw - rotZ * 180.0);
    }

    // 3. Populate unrolled GlrVtx (28 B/vertex = 7 float32 words) using glr_vtx exact clip math
    const indices = bundle.indices;
    const numIndices = indices.length;
    const stagingF32 = bundle.stagingF32;
    const inv256 = 1.0 / 256.0;
    const inv32767 = 1.0 / 32767.5;

    for (let i = 0; i < numIndices; i++) {
      const vi = indices[i];
      const w = sW[vi];
      const baseF = i * 7;
      stagingF32[baseF + 0] = (sPx[vi] * inv256 - 1.0) * w;
      stagingF32[baseF + 1] = (sPy[vi] * inv256 - 1.0) * w;
      stagingF32[baseF + 2] = (sPz[vi] * inv32767 - 1.0) * w;
      stagingF32[baseF + 3] = w;
    }

    const skinMs = performance.now() - t0;

    // 4. Issue single depth-tested draw call into the active PSP 3D FBO
    const atlasTex = ensureBundleTexture(gl, bundle);
    if (!atlasTex) return;

    if (!state.customVao) {
      state.customVao = gl.createVertexArray();
      state.customVbo = gl.createBuffer();
      gl.bindVertexArray(state.customVao);
      gl.bindBuffer(gl.ARRAY_BUFFER, state.customVbo);
      gl.enableVertexAttribArray(0);
      gl.vertexAttribPointer(0, 4, gl.FLOAT, false, 28, 0);
      gl.enableVertexAttribArray(1);
      gl.vertexAttribPointer(1, 2, gl.FLOAT, false, 28, 16);
      gl.enableVertexAttribArray(2);
      gl.vertexAttribPointer(2, 4, gl.UNSIGNED_BYTE, true, 28, 24);
    }

    const prevVao = state.curVao;
    const prevBuf = state.curArrayBuf;
    const prevTex = state.curTex2D;
    const prevSampler = state.curSampler0;
    const wasCullFace = gl.isEnabled(gl.CULL_FACE);

    state.inBridgeDraw = true;
    try {
      if (wasCullFace) gl.disable(gl.CULL_FACE);
      gl.bindVertexArray(state.customVao);
      gl.bindBuffer(gl.ARRAY_BUFFER, state.customVbo);
      origBufferData.call(gl, gl.ARRAY_BUFFER, bundle.stagingBuf, gl.STREAM_DRAW);

      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, atlasTex);
      gl.bindSampler(0, null);

      if (state.curProg) {
        let u = state.progUniforms.get(state.curProg);
        if (!u) {
          u = {
            tex_on: gl.getUniformLocation(state.curProg, "u_tex_on"),
            func: gl.getUniformLocation(state.curProg, "u_func"),
            rgba: gl.getUniformLocation(state.curProg, "u_rgba"),
            dbl: gl.getUniformLocation(state.curProg, "u_dbl"),
            atest: gl.getUniformLocation(state.curProg, "u_atest"),
            srcfix: gl.getUniformLocation(state.curProg, "u_srcfix"),
          };
          state.progUniforms.set(state.curProg, u);
        }
        if (u.tex_on !== null) gl.uniform1i(u.tex_on, 1);
        if (u.func !== null) gl.uniform1i(u.func, 0);
        if (u.rgba !== null) gl.uniform1i(u.rgba, 1);
        if (u.dbl !== null) gl.uniform1i(u.dbl, 0);
        if (u.atest !== null) gl.uniform1i(u.atest, 0);
        if (u.srcfix !== null) gl.uniform1i(u.srcfix, 0);
      }

      origDrawArrays.call(gl, gl.TRIANGLES, 0, numIndices);

      if (isP1) {
        statusTelemetry.framesReplaced++;
        statusTelemetry.matched3dFrames = statusTelemetry.framesReplaced;
        statusTelemetry.suppressedDrawsLastFrame = acc.suppressedDraws;
        statusTelemetry.stockDrawsSuppressed = acc.suppressedDraws;
        statusTelemetry.luisVertsSubmittedLastFrame = numIndices;
        statusTelemetry.luisTrianglesRendered = bundle.triangleCount;
        statusTelemetry.lastSkinningMs = Number(skinMs.toFixed(3));
      }
    } finally {
      if (wasCullFace) gl.enable(gl.CULL_FACE);
      gl.bindVertexArray(prevVao);
      gl.bindBuffer(gl.ARRAY_BUFFER, prevBuf);
      gl.bindTexture(gl.TEXTURE_2D, prevTex);
      gl.bindSampler(0, prevSampler);
      state.inBridgeDraw = false;
    }
  }

  function flushPendingSlotInjections(gl, origBufferData, origDrawArrays) {
    if (state.p1Acc.suppressedDraws >= 3 && state.p1Acc.suppressedVerts >= 300 && !state.p1Acc.injectedThisBatch) {
      const b1 = state.bundles.get(state.p1BundleId);
      const f1 = state.rosterByCode.get(state.p1FighterCode);
      if (b1) {
        skinAndInjectFighter(gl, origBufferData, origDrawArrays, b1, f1, state.p1Acc, true);
        state.p1TrackCx = state.p1Acc.sumWeightedCx / Math.max(1e-5, state.p1Acc.totalWeight);
      }
    }
    if (state.p2Acc.suppressedDraws >= 3 && state.p2Acc.suppressedVerts >= 300 && !state.p2Acc.injectedThisBatch) {
      const b2 = state.bundles.get(state.p2BundleId);
      const f2 = state.rosterByCode.get(state.p2FighterCode);
      if (b2) {
        skinAndInjectFighter(gl, origBufferData, origDrawArrays, b2, f2, state.p2Acc, false);
        state.p2TrackCx = state.p2Acc.sumWeightedCx / Math.max(1e-5, state.p2Acc.totalWeight);
      }
    }
  }

  function hookWebGL2Context(ctx) {
    if (!ctx || ctx.__tkdrCustomBridgeHooked) return ctx;
    ctx.__tkdrCustomBridgeHooked = true;
    state.gl = ctx;

    const origBufferData = ctx.bufferData;
    const origDrawArrays = ctx.drawArrays;
    const origUseProgram = ctx.useProgram;
    const origBindVertexArray = ctx.bindVertexArray;
    const origBindBuffer = ctx.bindBuffer;
    const origBindTexture = ctx.bindTexture;
    const origBindSampler = ctx.bindSampler;

    ctx.useProgram = function (prog) {
      if (!state.inBridgeDraw) state.curProg = prog;
      return origUseProgram.call(this, prog);
    };

    ctx.bindVertexArray = function (vao) {
      if (!state.inBridgeDraw) state.curVao = vao;
      return origBindVertexArray.call(this, vao);
    };

    ctx.bindBuffer = function (target, buf) {
      if (!state.inBridgeDraw && target === ctx.ARRAY_BUFFER) state.curArrayBuf = buf;
      return origBindBuffer.call(this, target, buf);
    };

    ctx.bindTexture = function (target, tex) {
      if (!state.inBridgeDraw && target === ctx.TEXTURE_2D) state.curTex2D = tex;
      return origBindTexture.call(this, target, tex);
    };

    ctx.bindSampler = function (unit, sampler) {
      if (!state.inBridgeDraw && unit === 0) state.curSampler0 = sampler;
      return origBindSampler.call(this, unit, sampler);
    };

    // CRITICAL: Preserve all 5 arguments of Emscripten's WebGL2 bufferData(target, srcData, usage, srcOffset, length)
    ctx.bufferData = function (...args) {
      if (!state.inBridgeDraw && statusTelemetry.enabled && args[0] === ctx.ARRAY_BUFFER) {
        const srcData = args[1];
        const srcOffset = args.length >= 4 ? (args[3] || 0) : (srcData && srcData.byteOffset) || 0;
        const byteLen = args.length >= 5 ? (args[4] || 0) : (srcData && srcData.byteLength) || 0;

        if (byteLen === 64 && state.frameView) {
          flushPendingSlotInjections(ctx, origBufferData, origDrawArrays);
          state.frameView = null;
          state.frameNumVerts = 0;
        } else if (byteLen >= 2800 && byteLen % 28 === 0 && srcData) {
          flushPendingSlotInjections(ctx, origBufferData, origDrawArrays);
          const rawBuf = srcData.buffer || srcData;
          if (
            rawBuf instanceof ArrayBuffer ||
            (typeof SharedArrayBuffer !== "undefined" && rawBuf instanceof SharedArrayBuffer)
          ) {
            state.frameView = new DataView(rawBuf, srcOffset, byteLen);
            state.frameNumVerts = byteLen / 28;
            resetAccumulator(state.p1Acc);
            resetAccumulator(state.p2Acc);
          }
        }
      }
      return origBufferData.apply(this, args);
    };

    ctx.drawArrays = function (mode, first, count) {
      if (
        !state.inBridgeDraw &&
        statusTelemetry.enabled &&
        state.frameView &&
        mode === ctx.TRIANGLES &&
        count >= 12 &&
        first >= 0 &&
        first + count <= state.frameNumVerts
      ) {
        const depthTest = ctx.isEnabled(ctx.DEPTH_TEST);
        if (!depthTest) {
          flushPendingSlotInjections(ctx, origBufferData, origDrawArrays);
          return origDrawArrays.call(this, mode, first, count);
        }

        const dv = state.frameView;
        const step = count > 240 ? Math.max(1, Math.floor(count / 80)) : 1;
        let minPx = Infinity, maxPx = -Infinity;
        let minPy = Infinity, maxPy = -Infinity;
        let minPz = Infinity, maxPz = -Infinity;
        let minW = Infinity, maxW = -Infinity;

        for (let i = 0; i < count; i += step) {
          const base = (first + i) * 28;
          const w = dv.getFloat32(base + 12, true);
          if (w <= 0.01) continue;
          const x = dv.getFloat32(base + 0, true);
          const y = dv.getFloat32(base + 4, true);
          const z = dv.getFloat32(base + 8, true);
          const px = (x / w + 1.0) * 256.0;
          const py = (y / w + 1.0) * 256.0;
          const pz = (z / w + 1.0) * 32767.5;
          if (px < minPx) minPx = px;
          if (px > maxPx) maxPx = px;
          if (py < minPy) minPy = py;
          if (py > maxPy) maxPy = py;
          if (pz < minPz) minPz = pz;
          if (pz > maxPz) maxPz = pz;
          if (w < minW) minW = w;
          if (w > maxW) maxW = w;
        }

        const spanX = maxPx - minPx;
        const spanY = maxPy - minPy;
        const blendEnabled = ctx.isEnabled(ctx.BLEND);
        const isGroundShadow = blendEnabled && minPy >= 235.0 && spanY <= 32.0 && spanX >= 40.0;

        const isFighterSubMesh =
          !isGroundShadow &&
          minW >= 600.0 &&
          maxW <= 9500.0 &&
          spanX >= 1.5 &&
          spanX <= 255.0 &&
          spanY >= 1.5 &&
          spanY <= 262.0 &&
          minPx >= -45.0 &&
          maxPx <= 525.0 &&
          minPy >= -35.0 &&
          maxPy <= 295.0;

        if (isFighterSubMesh) {
          const cx = 0.5 * (minPx + maxPx);
          const cy = 0.5 * (minPy + maxPy);
          const cz = 0.5 * (minPz + maxPz);
          const cw = 0.5 * (minW + maxW);

          const distP1 = Math.abs(cx - state.p1TrackCx);
          const distP2 = Math.abs(cx - state.p2TrackCx);
          const isP1Cluster = distP1 <= distP2 || Math.abs(cx - state.p1TrackCx) < 62.0;

          const activeBundleId = isP1Cluster ? state.p1BundleId : state.p2BundleId;
          const hasBoundBundle = activeBundleId && activeBundleId !== "NONE" && state.bundles.has(activeBundleId);

          if (!isP1Cluster && state.p1Acc.suppressedDraws >= 4 && !state.p1Acc.injectedThisBatch) {
            const b1 = state.bundles.get(state.p1BundleId);
            const f1 = state.rosterByCode.get(state.p1FighterCode);
            if (b1) {
              skinAndInjectFighter(ctx, origBufferData, origDrawArrays, b1, f1, state.p1Acc, true);
              state.p1TrackCx = state.p1Acc.sumWeightedCx / Math.max(1e-5, state.p1Acc.totalWeight);
            }
          }

          if (hasBoundBundle) {
            const acc = isP1Cluster ? state.p1Acc : state.p2Acc;
            acc.suppressedDraws++;
            acc.suppressedVerts += count;
            if (minPx < acc.minPx) acc.minPx = minPx;
            if (maxPx > acc.maxPx) acc.maxPx = maxPx;
            if (minPy < acc.minPy) acc.minPy = minPy;
            if (maxPy > acc.maxPy) acc.maxPy = maxPy;
            if (minPz < acc.minPz) acc.minPz = minPz;
            if (maxPz > acc.maxPz) acc.maxPz = maxPz;
            if (minW < acc.minW) acc.minW = minW;
            if (maxW > acc.maxW) acc.maxW = maxW;

            acc.sumWeightedCx += cx * count;
            acc.sumWeightedCy += cy * count;
            acc.sumWeightedCz += cz * count;
            acc.sumWeightedCw += cw * count;
            acc.totalWeight += count;

            // Track upper-body (punch/guard reach) vs lower-body (footwork/kick reach) extrema
            if (cy >= 65.0 && cy <= 165.0) {
              if (maxPx > acc.upperMaxCx) {
                acc.upperMaxCx = maxPx;
                acc.upperExtCy = cy;
              }
              if (minPx < acc.upperMinCx) {
                acc.upperMinCx = minPx;
              }
            } else if (cy > 165.0) {
              if (maxPx > acc.lowerMaxCx) acc.lowerMaxCx = maxPx;
              if (minPx < acc.lowerMinCx) acc.lowerMinCx = minPx;
              if (minPy < acc.lowerHighFootCy) acc.lowerHighFootCy = minPy;
            }

            // Suppress stock fighter sub-mesh draw call (zero double-mesh overlay!)
            return;
          } else if (!isP1Cluster) {
            state.p2TrackCx = 0.85 * state.p2TrackCx + 0.15 * cx;
          }
        } else if (isGroundShadow) {
          flushPendingSlotInjections(ctx, origBufferData, origDrawArrays);
        }
      }
      return origDrawArrays.call(this, mode, first, count);
    };

    return ctx;
  }

  const origGetContext = HTMLCanvasElement.prototype.getContext;
  HTMLCanvasElement.prototype.getContext = function (type, attrs) {
    const ctx = origGetContext.call(this, type, attrs);
    if (ctx && (type === "webgl2" || type === "webgl")) {
      hookWebGL2Context(ctx);
    }
    return ctx;
  };

  // Client-side browser .glb file parser & A-pose auto-rigger for on-the-fly user uploads
  async function compileUploadedGlbInBrowser(file, fighterCode, slot) {
    const buf = await file.arrayBuffer();
    const dv = new DataView(buf);
    if (dv.getUint32(0, true) !== 0x46546c67) {
      throw new Error("Invalid .glb magic header");
    }
    const jLen = dv.getUint32(12, true);
    const gltfJson = new TextDecoder().decode(new Uint8Array(buf, 20, jLen));
    const gltf = JSON.parse(gltfJson);
    const binOff = 20 + jLen + 8;

    const posList = [];
    const normList = [];
    const uvList = [];
    const triList = [];

    for (const mesh of gltf.meshes || []) {
      for (const prim of mesh.primitives || []) {
        const baseV = posList.length / 3;
        const posAcc = gltf.accessors[prim.attributes.POSITION];
        const posBv = gltf.bufferViews[posAcc.bufferView];
        const posOff = binOff + (posBv.byteOffset || 0) + (posAcc.byteOffset || 0);
        const pArr = new Float32Array(buf, posOff, posAcc.count * 3);
        for (let i = 0; i < pArr.length; i++) posList.push(pArr[i]);

        if (prim.attributes.NORMAL !== undefined) {
          const nAcc = gltf.accessors[prim.attributes.NORMAL];
          const nBv = gltf.bufferViews[nAcc.bufferView];
          const nOff = binOff + (nBv.byteOffset || 0) + (nAcc.byteOffset || 0);
          const nArr = new Float32Array(buf, nOff, nAcc.count * 3);
          for (let i = 0; i < nArr.length; i++) normList.push(nArr[i]);
        } else {
          for (let i = 0; i < posAcc.count; i++) normList.push(0, 1, 0);
        }

        if (prim.attributes.TEXCOORD_0 !== undefined) {
          const uAcc = gltf.accessors[prim.attributes.TEXCOORD_0];
          const uBv = gltf.bufferViews[uAcc.bufferView];
          const uOff = binOff + (uBv.byteOffset || 0) + (uAcc.byteOffset || 0);
          const uArr = new Float32Array(buf, uOff, uAcc.count * 2);
          for (let i = 0; i < uArr.length; i++) uvList.push(uArr[i]);
        } else {
          for (let i = 0; i < posAcc.count; i++) uvList.push(0.5, 0.5);
        }

        if (prim.indices !== undefined) {
          const iAcc = gltf.accessors[prim.indices];
          const iBv = gltf.bufferViews[iAcc.bufferView];
          const iOff = binOff + (iBv.byteOffset || 0) + (iAcc.byteOffset || 0);
          const iArr =
            iAcc.componentType === 5123
              ? new Uint16Array(buf, iOff, iAcc.count)
              : new Uint32Array(buf, iOff, iAcc.count);
          for (let i = 0; i + 2 < iArr.length; i += 3) {
            triList.push(baseV + iArr[i], baseV + iArr[i + 1], baseV + iArr[i + 2]);
          }
        }
      }
    }

    const totalTris = Math.floor(triList.length / 3);
    const maxTris = 3400;
    const stepT = totalTris > maxTris ? totalTris / maxTris : 1;
    const outTriCount = Math.min(totalTris, maxTris);
    const outTris = new Uint16Array(outTriCount * 3);
    const remap = new Map();
    const cPos = [], cNorm = [], cUv = [];

    for (let t = 0; t < outTriCount; t++) {
      const srcT = Math.min(totalTris - 1, Math.floor(t * stepT));
      for (let k = 0; k < 3; k++) {
        const oldVi = triList[srcT * 3 + k];
        let newVi = remap.get(oldVi);
        if (newVi === undefined) {
          newVi = cPos.length / 3;
          remap.set(oldVi, newVi);
          cPos.push(posList[oldVi * 3], posList[oldVi * 3 + 1], posList[oldVi * 3 + 2]);
          cNorm.push(normList[oldVi * 3], normList[oldVi * 3 + 1], normList[oldVi * 3 + 2]);
          cUv.push(uvList[oldVi * 2], uvList[oldVi * 2 + 1]);
        }
        outTris[t * 3 + k] = newVi;
      }
    }

    const vCount = cPos.length / 3;
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity, minZ = Infinity, maxZ = -Infinity;
    for (let v = 0; v < vCount; v++) {
      const x = cPos[v * 3], y = cPos[v * 3 + 1], z = cPos[v * 3 + 2];
      if (x < minX) minX = x; if (x > maxX) maxX = x;
      if (y < minY) minY = y; if (y > maxY) maxY = y;
      if (z < minZ) minZ = z; if (z > maxZ) maxZ = z;
    }
    const h = Math.max(1e-5, maxY - minY);
    const midX = 0.5 * (minX + maxX);
    const midZ = 0.5 * (minZ + maxZ);

    const fEntry = state.rosterByCode.get((fighterCode || state.p1FighterCode).toUpperCase()) || state.roster[9];
    const rigByteLen = 40 + 14 * 12 + vCount * 52 + outTriCount * 6;
    const rigBuf = new ArrayBuffer(rigByteLen);
    const rdv = new DataView(rigBuf);
    "LUISTKDR".split("").forEach((ch, idx) => rdv.setUint8(idx, ch.charCodeAt(0)));
    rdv.setUint32(8, 1, true);
    rdv.setUint32(12, vCount, true);
    rdv.setUint32(16, outTriCount, true);
    rdv.setUint32(20, 14, true);
    rdv.setUint32(24, fEntry.id, true);
    rdv.setFloat32(28, fEntry.heightScale, true);
    rdv.setFloat32(32, fEntry.shoulderScale, true);
    rdv.setFloat32(36, fEntry.limbWidthScale, true);

    const defaultPivots = [
      [0, 0.475, 0], [0, 0.545, 0], [0, 0.77, 0], [0, 0.835, 0.005],
      [0.11, 0.723, -0.008], [0.20, 0.643, -0.021], [0.262, 0.469, -0.002],
      [-0.11, 0.723, -0.008], [-0.20, 0.643, -0.021], [-0.262, 0.469, -0.002],
      [0.085, 0.475, -0.005], [0.085, 0.265, -0.015], [-0.085, 0.475, -0.005], [-0.085, 0.265, -0.015],
    ];
    let pOff = 40;
    for (const p of defaultPivots) {
      rdv.setFloat32(pOff, p[0], true);
      rdv.setFloat32(pOff + 4, p[1], true);
      rdv.setFloat32(pOff + 8, p[2], true);
      pOff += 12;
    }

    for (let v = 0; v < vCount; v++) {
      const nx = (cPos[v * 3] - midX) / h;
      const ny = Math.max(0.0, Math.min(1.0, (cPos[v * 3 + 1] - minY) / h));
      const nz = (cPos[v * 3 + 2] - midZ) / h;
      rdv.setFloat32(pOff + 0, nx, true);
      rdv.setFloat32(pOff + 4, ny, true);
      rdv.setFloat32(pOff + 8, nz, true);
      rdv.setFloat32(pOff + 12, cNorm[v * 3], true);
      rdv.setFloat32(pOff + 16, cNorm[v * 3 + 1], true);
      rdv.setFloat32(pOff + 20, cNorm[v * 3 + 2], true);
      rdv.setFloat32(pOff + 24, cUv[v * 2], true);
      rdv.setFloat32(pOff + 28, cUv[v * 2 + 1], true);

      let b0 = 1;
      if (ny >= 0.81 && Math.abs(nx) <= 0.12) b0 = 3;
      else if (nx > 0.115 && ny >= 0.36 && ny <= 0.81) b0 = nx > 0.23 ? 6 : nx > 0.17 ? 5 : 4;
      else if (nx < -0.115 && ny >= 0.36 && ny <= 0.81) b0 = nx < -0.23 ? 9 : nx < -0.17 ? 8 : 7;
      else if (ny < 0.48) b0 = nx >= 0 ? (ny < 0.26 ? 11 : 10) : (ny < 0.26 ? 13 : 12);

      rdv.setUint8(pOff + 32, b0);
      rdv.setUint8(pOff + 33, 1);
      rdv.setUint8(pOff + 34, 0);
      rdv.setUint8(pOff + 35, 0);
      rdv.setFloat32(pOff + 36, 1.0, true);
      rdv.setFloat32(pOff + 40, 0.0, true);
      rdv.setFloat32(pOff + 44, 0.0, true);
      rdv.setFloat32(pOff + 48, 0.0, true);
      pOff += 52;
    }

    for (let i = 0; i < outTris.length; i++) {
      rdv.setUint16(pOff, outTris[i], true);
      pOff += 2;
    }

    const cvs = document.createElement("canvas");
    cvs.width = 512;
    cvs.height = 512;
    const c2d = cvs.getContext("2d");
    c2d.fillStyle = "#c8ccd4";
    c2d.fillRect(0, 0, 512, 512);
    if (gltf.images && gltf.images.length > 0 && gltf.images[0].bufferView !== undefined) {
      const ibv = gltf.bufferViews[gltf.images[0].bufferView];
      const blob = new Blob([new Uint8Array(buf, binOff + (ibv.byteOffset || 0), ibv.byteLength)], {
        type: gltf.images[0].mimeType || "image/png",
      });
      const bmp = await createImageBitmap(blob);
      c2d.drawImage(bmp, 0, 0, 512, 512);
    }

    const bundleId = "uploaded_" + file.name.replace(/[^a-zA-Z0-9_]/g, "_").toLowerCase();
    const manifest = {
      bundleId,
      label: `${file.name} (${fEntry.fullName} [${fEntry.code}])`,
      sourceGlbName: file.name,
    };
    const parsed = parseRigBinary(rigBuf, manifest);
    parsed.atlasImg = cvs;
    state.bundles.set(bundleId, parsed);
    setBinding(slot || "P1", bundleId, fEntry.code);
    buildSelectorUI();
    return parsed;
  }

  function setBinding(slot, bundleId, fighterCode) {
    const normSlot = String(slot || "P1").toUpperCase();
    if (normSlot === "P2") {
      if (bundleId !== undefined && bundleId !== null) state.p2BundleId = bundleId;
      if (fighterCode) state.p2FighterCode = String(fighterCode).toUpperCase();
    } else {
      if (bundleId !== undefined && bundleId !== null) state.p1BundleId = bundleId;
      if (fighterCode) state.p1FighterCode = String(fighterCode).toUpperCase();
    }
    updateActiveTelemetry();
    const p1B = document.getElementById("tkdr-p1-bundle");
    const p1F = document.getElementById("tkdr-p1-fighter");
    if (p1B && state.p1BundleId) p1B.value = state.p1BundleId;
    if (p1F && state.p1FighterCode) p1F.value = state.p1FighterCode;
    return {
      p1BundleId: state.p1BundleId,
      p1FighterCode: state.p1FighterCode,
      p2BundleId: state.p2BundleId,
      p2FighterCode: state.p2FighterCode,
    };
  }

  function buildSelectorUI() {
    if (typeof document === "undefined" || !document.body) return;
    let panel = document.getElementById("tkdr-fighter-rig-panel");
    if (!panel) {
      panel = document.createElement("div");
      panel.id = "tkdr-fighter-rig-panel";
      panel.style.cssText =
        "position:fixed;top:8px;right:10px;z-index:9999;background:rgba(14,14,18,0.88);" +
        "border:1px solid #3a3a48;border-radius:6px;padding:6px 10px;font:11px/1.35 ui-monospace,monospace;" +
        "color:#d8d8e2;display:flex;align-items:center;gap:8px;box-shadow:0 4px 14px rgba(0,0,0,0.5);";
      document.body.appendChild(panel);
    }

    const bundleOpts = [`<option value="NONE">Stock Tekken Fighter</option>`];
    for (const [id, b] of state.bundles.entries()) {
      const sel = id === state.p1BundleId ? " selected" : "";
      bundleOpts.push(`<option value="${id}"${sel}>${b.manifest.label || b.manifest.sourceGlbName || id}</option>`);
    }

    const fighterOpts = [];
    for (const f of state.roster) {
      const sel = f.code === state.p1FighterCode ? " selected" : "";
      fighterOpts.push(`<option value="${f.code}"${sel}>[${f.code}] ${f.fullName}</option>`);
    }

    panel.innerHTML =
      `<span style="color:#ff9e3b;font-weight:700;">.GLB RIGGER</span>` +
      `<label>Asset: <select id="tkdr-p1-bundle" style="background:#1c1c24;color:#fff;border:1px solid #555;border-radius:3px;padding:2px 4px;font-size:11px;">${bundleOpts.join("")}</select></label>` +
      `<label>Mimic Fighter: <select id="tkdr-p1-fighter" style="background:#1c1c24;color:#fff;border:1px solid #555;border-radius:3px;padding:2px 4px;font-size:11px;">${fighterOpts.join("")}</select></label>` +
      `<label style="cursor:pointer;background:#2b2b38;border:1px solid #666;border-radius:3px;padding:2px 6px;">+ .glb<input id="tkdr-upload-glb" type="file" accept=".glb" style="display:none"></label>`;

    const bSel = document.getElementById("tkdr-p1-bundle");
    const fSel = document.getElementById("tkdr-p1-fighter");
    const upIn = document.getElementById("tkdr-upload-glb");

    if (bSel) {
      bSel.addEventListener("change", (e) => {
        setBinding("P1", e.target.value, state.p1FighterCode);
        e.target.blur();
      });
    }
    if (fSel) {
      fSel.addEventListener("change", (e) => {
        setBinding("P1", state.p1BundleId, e.target.value);
        e.target.blur();
      });
    }
    if (upIn) {
      upIn.addEventListener("change", async (e) => {
        const file = e.target.files && e.target.files[0];
        if (file) {
          await compileUploadedGlbInBrowser(file, state.p1FighterCode, "P1");
        }
      });
    }
  }

  window.__TKDR_CUSTOM_FIGHTERS__ = {
    getState: () => ({
      enabled: statusTelemetry.enabled,
      p1BundleId: state.p1BundleId,
      p1FighterCode: state.p1FighterCode,
      p2BundleId: state.p2BundleId,
      p2FighterCode: state.p2FighterCode,
      bundles: Array.from(state.bundles.keys()),
      rosterCount: state.roster.length,
    }),
    setBinding,
    compileUploadedGlbInBrowser,
    setEnabled: (flag) => {
      statusTelemetry.enabled = !!flag;
      syncGlobalTelemetry();
    },
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initRegistryAndBundles);
  } else {
    initRegistryAndBundles();
  }
})();
