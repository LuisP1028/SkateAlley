/**
 * luis_fighter_bridge.js
 *
 * .glb-File-Agnostic Real-Time PSP GE / WebGL2 (`GlrVtx` 28 B/vertex) Playable Fighter
 * Replacement Bridge & 36-Fighter Tekken Moveset Selector for Tekken: Dark Resurrection (/tkdr/)
 * (Functional Specifications 058 & 059).
 *
 * Architectural Guarantees:
 *   1. Preserves Emscripten's 5-argument WebGL2 `bufferData(target, srcData, usage, srcOffset, length)`
 *      signature via rest parameters `(...args)` so `HEAPU8` is never uploaded in full.
 *   2. Loads `/tkdr/custom_fighters/registry.json` containing the 36-fighter Tekken roster (`PAU`..`JPC`,
 *      IDs `0..35`) and all compiled `.glb` character bundles (`luis_jin`, `nicotest_pau`, `hoodie_law`, etc.),
 *      plus supports client-side browser `.glb` file upload & auto-rigging on the fly.
 *   3. Suppresses the stock Tekken fighter's opaque & alpha sub-mesh `gl.drawArrays` calls for any bound
 *      fighter slot (`P1` and/or `P2`) so there is zero double-mesh overlay or ghosting.
 *   4. Reconstructs the 14-segment live anatomical pose from the suppressed `GlrVtx` sub-meshes, applies
 *      the selected Tekken fighter's proportion profile (`heightScale`, `shoulderScale`, `limbWidthScale`),
 *      skins the bound `.glb` mesh into `GlrVtx` clip space (`28 B/vertex`), and renders it in a single
 *      hardware depth-tested pass (`luisVao` / `luisVbo`) into the active PSP 3D FBO.
 */
(function () {
  "use strict";

  const params = new URLSearchParams(window.location.search);
  const bridgeEnabled = params.get("LUIS_FIGHTER") !== "0";

  // Authoritative 36-Fighter Fallback Roster (matches eboot.bin 0x2cc9c8 & 0x2f6f2c)
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
      window.__TKDR_STATUS__.luisFighter = statusTelemetry;
    }
  }
  syncGlobalTelemetry();
  setInterval(syncGlobalTelemetry, 250);

  const state = {
    roster: DEFAULT_ROSTER.slice(),
    rosterByCode: new Map(),
    bundles: new Map(), // bundleId -> parsed bundle object
    p1BundleId: params.get("P1_GLB") || null,
    p1FighterCode: (params.get("P1_FIGHTER") || "JIN").toUpperCase(),
    p2BundleId: params.get("P2_GLB") || "NONE",
    p2FighterCode: (params.get("P2_FIGHTER") || "PAU").toUpperCase(),
    gl: null,
    luisVao: null,
    luisVbo: null,
    curProg: null,
    progUniforms: new WeakMap(),
    curVao: null,
    curArrayBuf: null,
    curTex2D: null,
    curSampler0: null,
    inBridgeDraw: false,
    // Per-frame GlrVtx batch state
    frameView: null,
    frameNumVerts: 0,
    p1TrackCx: 145.0,
    p2TrackCx: 335.0,
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
      // Limb sub-mesh extrema for live 14-segment articulation
      headCx: 0, headCy: 0, headW: 0,
      lHandCx: 0, lHandCy: 0, lHandW: 0,
      rHandCx: 0, rHandCy: 0, rHandW: 0,
      lFootCx: 0, lFootCy: 0, lFootW: 0,
      rFootCx: 0, rFootCy: 0, rFootW: 0,
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
    acc.headCx = 0; acc.headCy = 0; acc.headW = 0;
    acc.lHandCx = 0; acc.lHandCy = 0; acc.lHandW = 0;
    acc.rHandCx = 0; acc.rHandCy = 0; acc.rHandW = 0;
    acc.lFootCx = 0; acc.lFootCy = 0; acc.lFootW = 0;
    acc.rFootCx = 0; acc.rFootCy = 0; acc.rFootW = 0;
  }

  function parseRigBinary(arrayBuffer, manifest) {
    const dv = new DataView(arrayBuffer);
    const magic = String.fromCharCode(
      dv.getUint8(0), dv.getUint8(1), dv.getUint8(2), dv.getUint8(3),
      dv.getUint8(4), dv.getUint8(5), dv.getUint8(6), dv.getUint8(7)
    );
    if (magic !== "LUISTKDR") {
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

    // Pre-populate static UV coordinates in stagingF32 and compute per-vertex shade factor
    const vShade = new Uint32Array(vertexCount);
    for (let v = 0; v < vertexCount; v++) {
      const nx = norm[v * 3 + 0];
      const ny = norm[v * 3 + 1];
      const nz = norm[v * 3 + 2];
      const ndotl = Math.max(0.0, nx * 0.25 + ny * 0.45 + Math.abs(nz) * 0.85);
      const lum = Math.min(255, Math.max(155, Math.round((0.68 + 0.32 * ndotl) * 255)));
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
      boneDx: new Float32Array(14),
      boneDy: new Float32Array(14),
      boneDz: new Float32Array(14),
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
          state.p1BundleId = (reg.bindings && reg.bindings.p1BundleId) || (bundleEntries[0] && bundleEntries[0].bundleId);
        }
        if (!params.get("P1_FIGHTER") && reg.bindings && reg.bindings.p1FighterCode) {
          state.p1FighterCode = reg.bindings.p1FighterCode;
        }
      } else {
        // Fallback to ./luis_fighter/manifest.json
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
      console.warn("[luis_fighter_bridge] Registry load warning:", err);
    }
  }

  // Reconstruct 14 anatomical bone offsets & deform the bound .glb bundle into GlrVtx clip space
  function skinAndInjectFighter(gl, origBufferData, origDrawArrays, bundle, fighterProfile, acc, isP1) {
    if (!bundle || !bundle.atlasImg || acc.injectedThisBatch) return;
    acc.injectedThisBatch = true;

    const t0 = performance.now();
    const wTotal = Math.max(1e-5, acc.totalWeight);
    const meanCx = acc.sumWeightedCx / wTotal;
    const meanCy = acc.sumWeightedCy / wTotal;
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

    // Compute live limb articulation offsets from captured sub-mesh centroids
    const bDx = bundle.boneDx;
    const bDy = bundle.boneDy;
    const bDz = bundle.boneDz;
    bDx.fill(0);
    bDy.fill(0);
    bDz.fill(0);

    if (acc.headW > 0) {
      const hCx = acc.headCx / acc.headW;
      const hCy = acc.headCy / acc.headW;
      const expectedHeadY = yBot - 0.885 * heightPx;
      bDx[3] = Math.max(-18.0, Math.min(18.0, (hCx - meanCx) * 0.55));
      bDy[3] = Math.max(-14.0, Math.min(14.0, (hCy - expectedHeadY) * 0.45));
      bDx[2] = bDx[3] * 0.6;
      bDy[2] = bDy[3] * 0.5;
      bDx[1] = bDx[3] * 0.3;
    }
    if (acc.lHandW > 0) {
      const lhX = acc.lHandCx / acc.lHandW;
      const lhY = acc.lHandCy / acc.lHandW;
      const restArmX = meanCx + facingSign * 0.25 * widthScalePx;
      const restArmY = yBot - 0.72 * heightPx;
      const dx = Math.max(-35.0, Math.min(35.0, (lhX - restArmX) * 0.55));
      const dy = Math.max(-35.0, Math.min(35.0, (lhY - restArmY) * 0.55));
      bDx[4] = dx * 0.35; bDy[4] = dy * 0.35;
      bDx[5] = dx * 0.70; bDy[5] = dy * 0.70;
      bDx[6] = dx;        bDy[6] = dy;
    }
    if (acc.rHandW > 0) {
      const rhX = acc.rHandCx / acc.rHandW;
      const rhY = acc.rHandCy / acc.rHandW;
      const restArmX = meanCx - facingSign * 0.25 * widthScalePx;
      const restArmY = yBot - 0.72 * heightPx;
      const dx = Math.max(-35.0, Math.min(35.0, (rhX - restArmX) * 0.55));
      const dy = Math.max(-35.0, Math.min(35.0, (rhY - restArmY) * 0.55));
      bDx[7] = dx * 0.35; bDy[7] = dy * 0.35;
      bDx[8] = dx * 0.70; bDy[8] = dy * 0.70;
      bDx[9] = dx;        bDy[9] = dy;
    }
    if (acc.lFootW > 0) {
      const lfX = acc.lFootCx / acc.lFootW;
      const restLegX = meanCx + facingSign * 0.08 * widthScalePx;
      const dx = Math.max(-28.0, Math.min(28.0, (lfX - restLegX) * 0.65));
      bDx[10] = dx * 0.45;
      bDx[11] = dx;
    }
    if (acc.rFootW > 0) {
      const rfX = acc.rFootCx / acc.rFootW;
      const restLegX = meanCx - facingSign * 0.08 * widthScalePx;
      const dx = Math.max(-28.0, Math.min(28.0, (rfX - restLegX) * 0.65));
      bDx[12] = dx * 0.45;
      bDx[13] = dx;
    }

    const vCount = bundle.vertexCount;
    const pos = bundle.pos;
    const joints = bundle.joints;
    const weights = bundle.weights;
    const sPx = bundle.skinnedPx;
    const sPy = bundle.skinnedPy;
    const sPz = bundle.skinnedPz;
    const sW = bundle.skinnedW;

    // 4-bone linear-blend skinning of all vertices into PSP screen/depth space (px, py, pz, w)
    for (let v = 0; v < vCount; v++) {
      const v3 = v * 3;
      const v4 = v * 4;
      const nx = pos[v3 + 0] * lScale;
      const ny = pos[v3 + 1];
      const nz = pos[v3 + 2] * lScale;

      const j0 = joints[v4 + 0], j1 = joints[v4 + 1], j2 = joints[v4 + 2], j3 = joints[v4 + 3];
      const w0 = weights[v4 + 0], w1 = weights[v4 + 1], w2 = weights[v4 + 2], w3 = weights[v4 + 3];

      const dx = bDx[j0] * w0 + bDx[j1] * w1 + bDx[j2] * w2 + bDx[j3] * w3;
      const dy = bDy[j0] * w0 + bDy[j1] * w1 + bDy[j2] * w2 + bDy[j3] * w3;
      const dz = bDz[j0] * w0 + bDz[j1] * w1 + bDz[j2] * w2 + bDz[j3] * w3;

      // Isometric 3/4 fighting yaw so both front face/chest and depth silhouette read cleanly
      const rotX = nx * 0.88 * facingSign + nz * 0.47;
      const rotZ = -nx * 0.47 * facingSign + nz * 0.88;

      sPx[v] = meanCx + rotX * widthScalePx + dx;
      sPy[v] = yBot - ny * heightPx + dy;
      sPz[v] = Math.max(100.0, Math.min(65400.0, meanCz - rotZ * 140.0 + dz));
      sW[v] = Math.max(400.0, meanCw - rotZ * 180.0);
    }

    // Populate unrolled GlrVtx (28 B/vertex = 7 float32 words) using glr_vtx exact clip math
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

    // Issue single depth-tested draw call into the active PSP 3D FBO
    const atlasTex = ensureBundleTexture(gl, bundle);
    if (!atlasTex) return;

    if (!state.luisVao) {
      state.luisVao = gl.createVertexArray();
      state.luisVbo = gl.createBuffer();
      gl.bindVertexArray(state.luisVao);
      gl.bindBuffer(gl.ARRAY_BUFFER, state.luisVbo);
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

    state.inBridgeDraw = true;
    try {
      gl.bindVertexArray(state.luisVao);
      gl.bindBuffer(gl.ARRAY_BUFFER, state.luisVbo);
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
    if (!ctx || ctx.__tkdrLuisBridgeHooked) return ctx;
    ctx.__tkdrLuisBridgeHooked = true;
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
          // End of 3D FBO pass (present_quad uploads 64-byte screen quad)
          flushPendingSlotInjections(ctx, origBufferData, origDrawArrays);
          state.frameView = null;
          state.frameNumVerts = 0;
        } else if (byteLen >= 2800 && byteLen % 28 === 0 && srcData) {
          flushPendingSlotInjections(ctx, origBufferData, origDrawArrays);
          const rawBuf = srcData.buffer || srcData;
          if (rawBuf instanceof ArrayBuffer || (typeof SharedArrayBuffer !== "undefined" && rawBuf instanceof SharedArrayBuffer)) {
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
          // Transitioned to 2D HUD pass: flush any pending 3D fighter replacements before UI draws
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

          // If transitioning from P1 opaque draws to P2 draws, flush P1 immediately!
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

            // Classify sub-mesh into anatomical limb buckets (Head, Hands, Feet)
            if (cy < 105.0 && spanY <= 45.0) {
              acc.headCx += cx * count;
              acc.headCy += cy * count;
              acc.headW += count;
            } else if (cy >= 195.0) {
              if (cx >= (acc.sumWeightedCx / acc.totalWeight)) {
                acc.lFootCx += cx * count; acc.lFootCy += cy * count; acc.lFootW += count;
              } else {
                acc.rFootCx += cx * count; acc.rFootCy += cy * count; acc.rFootW += count;
              }
            } else if (cy >= 78.0 && cy <= 165.0 && spanX <= 42.0 && spanY <= 42.0) {
              if (cx >= (acc.sumWeightedCx / acc.totalWeight)) {
                acc.lHandCx += cx * count; acc.lHandCy += cy * count; acc.lHandW += count;
              } else {
                acc.rHandCx += cx * count; acc.rHandCy += cy * count; acc.rHandW += count;
              }
            }

            // Suppress stock fighter sub-mesh draw call (zero double-mesh overlay!)
            return;
          } else if (!isP1Cluster) {
            state.p2TrackCx = 0.85 * state.p2TrackCx + 0.15 * cx;
          }
        } else if (isGroundShadow) {
          // Flush fighter before ground shadows / post-pass
          flushPendingSlotInjections(ctx, origBufferData, origDrawArrays);
        }
      }
      return origDrawArrays.call(this, mode, first, count);
    };

    return ctx;
  }

  // Hook HTMLCanvasElement.prototype.getContext before tkdr.js creates the WebGL2 context
  const origGetContext = HTMLCanvasElement.prototype.getContext;
  HTMLCanvasElement.prototype.getContext = function (type, attrs) {
    const ctx = origGetContext.call(this, type, attrs);
    if (ctx && (type === "webgl2" || type === "webgl")) {
      hookWebGL2Context(ctx);
    }
    return ctx;
  };

  // Client-side browser .glb file parser & auto-rigger for on-the-fly user uploads
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

    // Subsample triangles to <= 3600 if high-poly
    const totalTris = Math.floor(triList.length / 3);
    const maxTris = 3400;
    const stepT = totalTris > maxTris ? totalTris / maxTris : 1;
    const outTris = new Uint16Array(Math.min(totalTris, maxTris) * 3);
    const remap = new Map();
    const cPos = [], cNorm = [], cUv = [];

    const outTriCount = Math.min(totalTris, maxTris);
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
    const xMid = 0.5 * (minX + maxX);
    const zMid = 0.5 * (minZ + maxZ);

    const fEntry = state.rosterByCode.get(fighterCode) || state.roster[9];
    const headerBytes = 40 + 14 * 12 + vCount * 52 + outTris.length * 2;
    const rigBuf = new ArrayBuffer(headerBytes);
    const rDv = new DataView(rigBuf);
    "LUISTKDR".split("").forEach((ch, idx) => rDv.setUint8(idx, ch.charCodeAt(0)));
    rDv.setUint32(8, 1, true);
    rDv.setUint32(12, vCount, true);
    rDv.setUint32(16, outTriCount, true);
    rDv.setUint32(20, 14, true);
    rDv.setUint32(24, fEntry.id, true);
    rDv.setFloat32(28, fEntry.heightScale, true);
    rDv.setFloat32(32, fEntry.shoulderScale, true);
    rDv.setFloat32(36, fEntry.limbWidthScale, true);

    let rOff = 40 + 14 * 12;
    for (let v = 0; v < vCount; v++) {
      const nx = (cPos[v * 3] - xMid) / h;
      const ny = Math.max(0, Math.min(1, (cPos[v * 3 + 1] - minY) / h));
      const nz = (cPos[v * 3 + 2] - zMid) / h;
      rDv.setFloat32(rOff + 0, nx, true);
      rDv.setFloat32(rOff + 4, ny, true);
      rDv.setFloat32(rOff + 8, nz, true);
      rDv.setFloat32(rOff + 12, cNorm[v * 3], true);
      rDv.setFloat32(rOff + 16, cNorm[v * 3 + 1], true);
      rDv.setFloat32(rOff + 20, cNorm[v * 3 + 2], true);
      rDv.setFloat32(rOff + 24, cUv[v * 2], true);
      rDv.setFloat32(rOff + 28, cUv[v * 2 + 1], true);
      let bId = 1;
      if (ny > 0.83) bId = 3;
      else if (ny > 0.77) bId = 2;
      else if (nx > 0.11 && ny > 0.48) bId = nx > 0.30 ? 6 : nx > 0.20 ? 5 : 4;
      else if (nx < -0.11 && ny > 0.48) bId = nx < -0.30 ? 9 : nx < -0.20 ? 8 : 7;
      else if (ny < 0.48) bId = nx >= 0 ? (ny < 0.25 ? 11 : 10) : (ny < 0.25 ? 13 : 12);
      rDv.setUint8(rOff + 32, bId);
      rDv.setUint8(rOff + 33, 0);
      rDv.setUint8(rOff + 34, 0);
      rDv.setUint8(rOff + 35, 0);
      rDv.setFloat32(rOff + 36, 1.0, true);
      rDv.setFloat32(rOff + 40, 0.0, true);
      rDv.setFloat32(rOff + 44, 0.0, true);
      rDv.setFloat32(rOff + 48, 0.0, true);
      rOff += 52;
    }
    for (let i = 0; i < outTris.length; i++) {
      rDv.setUint16(rOff, outTris[i], true);
      rOff += 2;
    }

    // Decode first embedded image or generate solid canvas
    const cvs = document.createElement("canvas");
    cvs.width = 512;
    cvs.height = 512;
    const c2d = cvs.getContext("2d");
    c2d.fillStyle = "#d8b8a0";
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
      bundleOpts.push(`<option value="${id}"${sel}>${b.manifest.sourceGlbName || id}</option>`);
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
