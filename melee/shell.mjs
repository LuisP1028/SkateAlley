// SPDX-License-Identifier: GPL-3.0-or-later
// Standalone host controller for Super Smash Bros. Melee (doldecomp/melee + aurora WebGPU).
// Supports automatic HTTP 206 byte-range disc streaming from ./game.iso as well as manual
// <input type="file"> selection, IndexedDB /saves & /cache persistence, and live telemetry.
import { createDiscCache, createHttpRangeFile } from './disc-cache.mjs';

const EXPECTED_GC_DISC_SIZE = 1459978240;
const $ = (id) => document.getElementById(id);
const lines = [];

const telemetry = {
  crossOriginIsolated: Boolean(window.crossOriginIsolated),
  webgpuAvailable: Boolean(typeof navigator !== 'undefined' && navigator.gpu),
  runtimeReady: false,
  discSource: null,
  discSize: 0,
  started: false,
  frames: 0,
  fps: 0,
  p99Ms: 0,
  residentCacheBytes: 0,
  lastError: null,
  scenes: [],
  rigOverlay: null,
};
window.__MELEE_STATUS__ = telemetry;

function log(text) {
  const line = String(text);
  lines.push(line);
  if (line.startsWith('boot scene:')) {
    telemetry.scenes.push(line);
  }
  const logEl = $('log');
  if (logEl) {
    logEl.textContent = lines.slice(-80).join('\n');
  }
  console.log(line);
}

const status = (text) => {
  const el = $('status');
  if (el) el.textContent = text;
};

// Rolling frame statistics; also read by automated e2e verification.
const frames = { count: 0, last: 0, samples: [] };
window.meleeFrames = frames;
let activeCache = null;

function onFrame() {
  const now = performance.now();
  if (frames.last) {
    frames.samples.push(now - frames.last);
    if (frames.samples.length > 7200) frames.samples.shift(); // two minutes
  }
  frames.last = now;
  frames.count += 1;
  telemetry.frames = frames.count;
  if (activeCache) {
    telemetry.residentCacheBytes = activeCache.residentBytes;
    if (telemetry.rigOverlay) {
      telemetry.rigOverlay.overlayStats = activeCache.overlayStats;
    }
  }
  if (frames.count % 30 === 0 && frames.samples.length > 60) {
    const recent = frames.samples.slice(-120);
    const sorted = [...recent].sort((a, b) => a - b);
    const fps = (1000 * recent.length) / recent.reduce((a, b) => a + b, 0);
    const p99 = sorted[Math.floor(sorted.length * 0.99)];
    telemetry.fps = Number(fps.toFixed(2));
    telemetry.p99Ms = Number(p99.toFixed(2));
    const statsEl = $('stats');
    if (statsEl) {
      statsEl.textContent = `${fps.toFixed(1)} fps · p99 ${p99.toFixed(1)} ms`;
    }
  }
}

function syncfs(populate) {
  return new Promise((resolve, reject) =>
    Module.FS.syncfs(populate, (error) => (error ? reject(error) : resolve()))
  );
}

// Unlock any suspended Web Audio contexts on first user interaction.
function installAudioUnlock() {
  const unlock = () => {
    try {
      const sdlAudio = window.Module?.SDL2?.audioContext || window.Module?.SDL3?.audioContext;
      if (sdlAudio && sdlAudio.state === 'suspended') {
        sdlAudio.resume().catch(() => {});
      }
    } catch (_) {}
  };
  for (const evt of ['pointerdown', 'keydown', 'touchstart', 'click']) {
    window.addEventListener(evt, unlock, { passive: true });
  }
}
installAudioUnlock();

// Any MELEE_* query parameter becomes an environment variable, so the knobs in
// docs/testing.md work unchanged: ?MELEE_BOOT_SCENE=vs&MELEE_SEED=1
const searchParams = new URLSearchParams(location.search);
const ENV = {};
for (const [key, value] of searchParams) {
  if (/^MELEE_[A-Z0-9_]+$/.test(key)) ENV[key] = value;
}

const autorunDisabled = searchParams.get('autorun') === '0' || searchParams.get('autostart') === '0';
const customIsoUrl = searchParams.get('iso') || './game.iso';

// Auto-rigger query parameters (?player=nicotest_nt01&run=run_01&fighter=Ca or ?rig_fighter=Ca)
const queryPlayer = searchParams.get('player') || searchParams.get('player_folder') || 'nicotest_nt01';
const queryRun = searchParams.get('run') || searchParams.get('run_id') || 'run_01';
const queryFighter = searchParams.get('fighter') || searchParams.get('fighters') || searchParams.get('rig_fighter') || '';

// External CharacterKind (CKIND_*) used by gmPlayerInitData and MELEE_DEBUG_VS_FIGHTER_BASE
const FIGHTER_CODE_TO_CKIND = {
  ca: 0, dk: 1, fx: 2, gw: 3, kb: 4, kp: 5, lk: 6, lg: 7, mr: 8, ms: 9,
  mt: 10, ns: 11, pe: 12, pk: 13, pp: 14, nn: 14, pr: 15, ss: 16, ys: 17,
  zd: 18, sk: 19, fc: 20, cl: 21, dr: 22, fe: 23, pc: 24, gn: 25,
};
const CKIND_TO_FIGHTER_CODE = [
  'Ca', 'Dk', 'Fx', 'Gw', 'Kb', 'Kp', 'Lk', 'Lg', 'Mr', 'Ms',
  'Mt', 'Ns', 'Pe', 'Pk', 'Pp', 'Pr', 'Ss', 'Ys', 'Zd', 'Sk',
  'Fc', 'Cl', 'Dr', 'Fe', 'Pc', 'Gn',
];
const STATIC_FIGHTER_CATALOG = [
  { code: 'Mr', name: 'Mario' },
  { code: 'Fx', name: 'Fox' },
  { code: 'Ca', name: 'Captain Falcon' },
  { code: 'Dk', name: 'Donkey Kong' },
  { code: 'Kb', name: 'Kirby' },
  { code: 'Kp', name: 'Bowser' },
  { code: 'Lk', name: 'Link' },
  { code: 'Sk', name: 'Sheik' },
  { code: 'Ns', name: 'Ness' },
  { code: 'Pe', name: 'Peach' },
  { code: 'Pp', name: 'Ice Climbers' },
  { code: 'Pk', name: 'Pikachu' },
  { code: 'Ss', name: 'Samus' },
  { code: 'Ys', name: 'Yoshi' },
  { code: 'Pr', name: 'Jigglypuff' },
  { code: 'Mt', name: 'Mewtwo' },
  { code: 'Lg', name: 'Luigi' },
  { code: 'Ms', name: 'Marth' },
  { code: 'Zd', name: 'Zelda' },
  { code: 'Cl', name: 'Young Link' },
  { code: 'Dr', name: 'Dr. Mario' },
  { code: 'Fc', name: 'Falco' },
  { code: 'Pc', name: 'Pichu' },
  { code: 'Gw', name: 'Mr. Game & Watch' },
  { code: 'Gn', name: 'Ganondorf' },
  { code: 'Fe', name: 'Roy' },
];
if (queryFighter) {
  // Automatically suppress idle "Press Start" background attract-demo movies (FtDemoViWaitMotion)
  // whenever custom rig overlays are mounted unless explicitly overridden via ?MELEE_NO_ATTRACT=0 (INV-NO-ATTRACT-01).
  if (!searchParams.has('MELEE_NO_ATTRACT')) {
    ENV.MELEE_NO_ATTRACT = '1';
  }
}

if (queryFighter && !ENV.MELEE_DEBUG_VS_FIGHTER_BASE) {
  const rawCodes = queryFighter.split(',').map((s) => s.trim().toLowerCase()).filter(Boolean);
  const isAllRoster = rawCodes.length === 1 && (rawCodes[0] === 'all' || rawCodes[0] === 'roster');
  const ckinds = isAllRoster
    ? [FIGHTER_CODE_TO_CKIND.mr, FIGHTER_CODE_TO_CKIND.lk, FIGHTER_CODE_TO_CKIND.ss, FIGHTER_CODE_TO_CKIND.kp]
    : rawCodes.map((c) => FIGHTER_CODE_TO_CKIND[c]).filter((v) => v !== undefined);
  if (ckinds.length >= 1) {
    const c0 = ckinds[0];
    const c1 = ckinds.length > 1 ? ckinds[1] : (c0 + 1) % 26;
    const c2 = ckinds.length > 2 ? ckinds[2] : (c0 + 2) % 26;
    const c3 = ckinds.length > 3 ? ckinds[3] : (c0 + 3) % 26;
    const packed = ((c0 & 0xff) | ((c1 & 0xff) << 8) | ((c2 & 0xff) << 16) | ((c3 & 0xff) << 24));
    ENV.MELEE_DEBUG_VS_FIGHTER_BASE = String(packed);
  }
} else if (ENV.MELEE_DEBUG_VS_FIGHTER_BASE) {
  const baseNum = Number(ENV.MELEE_DEBUG_VS_FIGHTER_BASE);
  if (Number.isInteger(baseNum) && baseNum >= 0 && baseNum < 26) {
    const c0 = baseNum;
    const c1 = (c0 + 1) % 26;
    const c2 = (c0 + 2) % 26;
    const c3 = (c0 + 3) % 26;
    ENV.MELEE_DEBUG_VS_FIGHTER_BASE = String((c0 & 0xff) | ((c1 & 0xff) << 8) | ((c2 & 0xff) << 16) | ((c3 & 0xff) << 24));
  }
}

let pendingRigMetadata = null;
let pendingRigBuffers = []; // [{ fstTargets, bytes, datUrl }]

const rigStatus = (text) => {
  const el = $('rig-status');
  if (el) el.textContent = text;
};

async function initAutoRiggerControls() {
  const charSelect = $('gcs-char-select');
  const fighterSelect = $('fighter-select');
  const rigBtn = $('rig-play-btn');
  const primaryQueryFighter = (queryFighter.split(',')[0] || '').trim().toLowerCase();

  try {
    const [charsRes, fightersRes] = await Promise.all([
      fetch('/api/melee/gcs-characters', { cache: 'no-store' }).then((r) => (r.ok ? r.json() : null)).catch(() => null),
      fetch('/api/melee/fighters', { cache: 'no-store' }).then((r) => (r.ok ? r.json() : null)).catch(() => null),
    ]);

    if (charSelect) {
      const targetVal = `${queryPlayer}|${queryRun}`;
      let matched = false;
      if (charsRes && Array.isArray(charsRes.characters) && charsRes.characters.length > 0) {
        charSelect.innerHTML = '';
        for (const ch of charsRes.characters) {
          const opt = document.createElement('option');
          opt.value = `${ch.player_folder}|${ch.run_id}`;
          opt.textContent = ch.label || `${ch.player_folder} / ${ch.run_id}`;
          if (ch.player_folder === queryPlayer && ch.run_id === queryRun) {
            opt.selected = true;
            matched = true;
          }
          charSelect.appendChild(opt);
        }
      } else {
        charSelect.innerHTML = '';
      }
      if (!matched) {
        const opt = document.createElement('option');
        opt.value = targetVal;
        opt.textContent = `${queryPlayer} / ${queryRun}`;
        opt.selected = true;
        charSelect.prepend(opt);
      }
    }

    if (fighterSelect) {
      const fighterList =
        fightersRes && Array.isArray(fightersRes.fighters) && fightersRes.fighters.length > 0
          ? fightersRes.fighters
          : STATIC_FIGHTER_CATALOG;
      fighterSelect.innerHTML = '';
      for (const ft of fighterList) {
        const opt = document.createElement('option');
        opt.value = ft.code;
        opt.textContent = ft.bone_count
          ? `${ft.name} (${ft.code} · ${ft.bone_count} bones)`
          : `${ft.name} (${ft.code})`;
        if (primaryQueryFighter && ft.code.toLowerCase() === primaryQueryFighter) {
          opt.selected = true;
        } else if (!primaryQueryFighter && ft.code === 'Ca') {
          opt.selected = true;
        }
        fighterSelect.appendChild(opt);
      }
    }
  } catch (err) {
    log(`rig catalog init warning: ${err?.message || err}`);
  }

  if (rigBtn) {
    rigBtn.addEventListener('click', async () => {
      const charVal = charSelect?.value || `${queryPlayer}|${queryRun}`;
      const [playerFolder, runId] = charVal.split('|');
      const fighterCode = fighterSelect?.value || 'Ca';
      rigBtn.disabled = true;
      try {
        await compileAndPrepareRigOverlay(playerFolder || 'nicotest_nt01', runId || 'run_01', fighterCode);
        if (telemetry.started) {
          // Reload with query parameters so fresh boot mounts the virtual FST overlay cleanly before DVDInit
          const nextParams = new URLSearchParams(location.search);
          nextParams.set('player', playerFolder || 'nicotest_nt01');
          nextParams.set('run', runId || 'run_01');
          nextParams.set('fighter', fighterCode);
          if (!nextParams.has('MELEE_BOOT_SCENE')) {
            nextParams.set('MELEE_BOOT_SCENE', 'vs');
          }
          if (!nextParams.has('MELEE_DEBUG_VS')) {
            nextParams.set('MELEE_DEBUG_VS', 'cpu4');
          }
          location.search = nextParams.toString();
          return;
        }
        // If not started yet, boot now with the HTTP range disc
        const httpDisc = await probeHttpDisc(customIsoUrl);
        if (httpDisc) {
          await bootWithDisc(httpDisc, 'http-range');
        }
      } catch (err) {
        rigStatus(`Rig error: ${err?.message || err}`);
        log(`rig error: ${err?.stack || err}`);
      } finally {
        rigBtn.disabled = false;
      }
    });
  }
}

async function fetchSingleFighterRigMetaAndBuffers(
  playerFolder,
  runId,
  fighterCode,
  { required = true } = {}
) {
  let meta = null;
  const staticTelemUrl = `/melee/rigged/${playerFolder}/${runId}/rigging_telemetry_${fighterCode}.json`;
  try {
    const staticRes = await fetch(staticTelemUrl, { cache: 'no-store' });
    if (staticRes.ok) {
      meta = await staticRes.json();
    }
  } catch (_) {}

  if (!meta) {
    try {
      const res = await fetch('/api/melee/rig', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          player_folder: playerFolder,
          run_id: runId,
          fighter: fighterCode,
        }),
      });
      if (res.ok) {
        const parsed = await res.json();
        if (parsed && (parsed.status === 'ok' || parsed.status === 'COMPLETE')) {
          meta = parsed;
        }
      }
    } catch (_) {}
  }

  if (!meta) {
    if (!required) {
      return null;
    }
    throw Error(`Failed to rig or load precompiled telemetry for ${fighterCode}`);
  }

  const datRes = await fetch(meta.dat_url, { cache: 'no-store' });
  if (!datRes.ok) {
    throw Error(`Failed to fetch compiled archive ${meta.dat_url} (HTTP ${datRes.status})`);
  }
  const datBytes = new Uint8Array(await datRes.arrayBuffer());
  const buffers = [
    {
      fstTargets: meta.fst_targets || [`Pl${meta.fighter}Nr.dat`],
      bytes: datBytes,
      datUrl: meta.dat_url,
    },
  ];

  if (Array.isArray(meta.companion_overlays)) {
    for (const comp of meta.companion_overlays) {
      if (comp && comp.dat_url && Array.isArray(comp.fst_targets) && comp.fst_targets.length > 0) {
        const compRes = await fetch(comp.dat_url, { cache: 'no-store' });
        if (!compRes.ok) {
          throw Error(`Failed to fetch companion overlay ${comp.dat_url} (HTTP ${compRes.status})`);
        }
        buffers.push({
          fstTargets: comp.fst_targets,
          bytes: new Uint8Array(await compRes.arrayBuffer()),
          datUrl: comp.dat_url,
        });
      }
    }
  }
  return { code: fighterCode, meta, buffers, byteLength: datBytes.byteLength };
}

async function compileAndPrepareRigOverlay(playerFolder, runId, fighterCode) {
  if (!searchParams.has('MELEE_NO_ATTRACT')) {
    ENV.MELEE_NO_ATTRACT = '1';
    if (window.Module && window.Module.ENV) {
      window.Module.ENV.MELEE_NO_ATTRACT = '1';
    }
  }

  const rawParts = String(fighterCode || 'Ca')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  const primaryRaw = rawParts[0] || 'Ca';
  const primaryNorm = primaryRaw[0].toUpperCase() + primaryRaw.slice(1).toLowerCase();
  const isAllRoster =
    rawParts.length === 1 &&
    (primaryRaw.toLowerCase() === 'all' || primaryRaw.toLowerCase() === 'roster');
  const baseCkind = FIGHTER_CODE_TO_CKIND[primaryRaw.toLowerCase()];

  // Resolve target fighters to mount:
  // - ?fighter=all or ?fighter=roster -> all 26 playable fighters (all required)
  // - ?fighter=Kb,Ss,Kp,Mr or ?fighter=Mr,Mr,Mr,Mr -> deduplicated explicit squad (all required)
  // - ?fighter=<XX> -> primary <XX> required; cpu4 companions [(base+1)%26 .. (base+3)%26] optional
  //   (mounted if precompiled/riggable in run_id, otherwise vanilla disc archives are used for CPU slots)
  let targetCodes = [];
  const requiredSet = new Set();
  if (isAllRoster) {
    targetCodes = [...CKIND_TO_FIGHTER_CODE];
    for (const c of targetCodes) requiredSet.add(c);
  } else if (rawParts.length > 1) {
    for (const part of rawParts) {
      const norm = part[0].toUpperCase() + part.slice(1).toLowerCase();
      requiredSet.add(norm);
      if (!targetCodes.includes(norm)) {
        targetCodes.push(norm);
      }
    }
  } else if (baseCkind !== undefined && (ENV.MELEE_DEBUG_VS === 'cpu4' || !ENV.MELEE_DEBUG_VS)) {
    const c0Code = CKIND_TO_FIGHTER_CODE[baseCkind];
    requiredSet.add(c0Code);
    for (let i = 0; i < 4; i++) {
      const code = CKIND_TO_FIGHTER_CODE[(baseCkind + i) % 26];
      if (!targetCodes.includes(code)) {
        targetCodes.push(code);
      }
    }
  } else {
    requiredSet.add(primaryNorm);
    targetCodes = [primaryNorm];
  }

  // Automatically co-mount Zelda <-> Sheik transform counterparts when present (Spec 042 §4.5.3)
  if (targetCodes.includes('Zd') && !targetCodes.includes('Sk')) {
    targetCodes.push('Sk');
    if (isAllRoster) requiredSet.add('Sk');
  } else if (targetCodes.includes('Sk') && !targetCodes.includes('Zd')) {
    targetCodes.push('Zd');
    if (isAllRoster) requiredSet.add('Zd');
  }

  const reqLabel = [...requiredSet];
  rigStatus(
    reqLabel.length === 1
      ? `Loading Fighter Overlay: ${reqLabel[0]}…`
      : `Loading ${targetCodes.length}-Fighter Overlay: ${targetCodes.join(', ')}…`
  );
  log(
    `rig: probing overlays [${targetCodes.join(', ')}] (required: [${reqLabel.join(', ')}]) for ${playerFolder}/${runId}`
  );

  const rawFetched = await Promise.all(
    targetCodes.map((code) =>
      fetchSingleFighterRigMetaAndBuffers(playerFolder, runId, code, {
        required: requiredSet.has(code),
      })
    )
  );
  const fetchedList = rawFetched.filter(Boolean);
  const mountedCodes = fetchedList.map((entry) => entry.code);
  const skippedCompanionCodes = targetCodes.filter((code) => !mountedCodes.includes(code));

  if (skippedCompanionCodes.length > 0) {
    log(
      `rig: optional squad companions not rigged in ${playerFolder}/${runId} [${skippedCompanionCodes.join(', ')}]; using vanilla disc archives for those slots`
    );
  }

  const allBuffers = [];
  const seenDatUrls = new Set();
  let primaryMeta = null;
  let totalBytes = 0;

  for (const { meta, buffers } of fetchedList) {
    if (!primaryMeta) primaryMeta = meta;
    for (const buf of buffers) {
      const key = buf.datUrl || (buf.fstTargets || []).join('|');
      if (seenDatUrls.has(key)) continue;
      seenDatUrls.add(key);
      allBuffers.push(buf);
      totalBytes += buf.bytes.byteLength;
    }
  }

  pendingRigMetadata = {
    ...primaryMeta,
    squad_fighters: mountedCodes,
    skipped_companion_fighters: skippedCompanionCodes,
    overlay_buffer_count: allBuffers.length,
    total_overlay_bytes: totalBytes,
  };
  pendingRigBuffers = allBuffers;
  if (baseCkind !== undefined && !ENV.MELEE_DEBUG_VS_FIGHTER_BASE) {
    ENV.MELEE_DEBUG_VS_FIGHTER_BASE = String(baseCkind);
    if (window.Module && window.Module.ENV) {
      window.Module.ENV.MELEE_DEBUG_VS_FIGHTER_BASE = String(baseCkind);
    }
  }

  if (activeCache) {
    await applyPendingRigOverlaysToCache(activeCache);
  }

  if (mountedCodes.length === 1 && primaryMeta?.fighter_name) {
    rigStatus(
      `Ready (${primaryMeta.fighter_name} [${mountedCodes[0]}] · ${allBuffers.length} archive${allBuffers.length === 1 ? '' : 's'}): ${(totalBytes / 1024).toFixed(0)} KiB total`
    );
  } else {
    rigStatus(
      `Ready (${mountedCodes.length} fighters [${mountedCodes.join(', ')}] · ${allBuffers.length} archives): ${(totalBytes / 1024).toFixed(0)} KiB total`
    );
  }
  return pendingRigMetadata;
}

async function applyPendingRigOverlaysToCache(cache) {
  if (!cache || !pendingRigMetadata || !pendingRigBuffers.length) return;
  cache.clearDiscOverlays();
  const registrations = [];
  for (const item of pendingRigBuffers) {
    const reg = await cache.registerDiscOverlay(item.fstTargets, item.bytes);
    registrations.push(reg);
    log(
      `rig overlay: mapped [${item.fstTargets.join(', ')}] -> virtual offset 0x${reg.virtualOffset.toString(16)} (${reg.byteLength} bytes)`
    );
  }
  telemetry.discSize = cache.virtualDiscSize;
  telemetry.rigOverlay = {
    active: true,
    noAttract: ENV.MELEE_NO_ATTRACT === '1',
    fighter: pendingRigMetadata.fighter,
    fighterName: pendingRigMetadata.fighter_name,
    squadFighters: pendingRigMetadata.squad_fighters,
    skippedCompanionFighters: pendingRigMetadata.skipped_companion_fighters || [],
    overlayBufferCount: pendingRigBuffers.length,
    totalOverlayBytes: pendingRigMetadata.total_overlay_bytes,
    boneCount: pendingRigMetadata.bone_count,
    playerFolder: pendingRigMetadata.player_folder,
    runId: pendingRigMetadata.run_id,
    datUrl: pendingRigMetadata.dat_url,
    glbUrl: pendingRigMetadata.glb_url,
    datSha256: pendingRigMetadata.dat_sha256,
    fstTargets: pendingRigMetadata.fst_targets,
    registrations,
    patchedFstEntries: cache.patchedFstEntries,
    overlayStats: cache.overlayStats,
  };
}

initAutoRiggerControls();

let ready = false;
let booting = false;

function updateStart() {
  const startBtn = $('start');
  const discInput = $('disc');
  if (startBtn && discInput) {
    startBtn.disabled = Boolean(booting || !ready || !discInput.files.length);
  }
}

async function probeHttpDisc(url) {
  try {
    const headRes = await fetch(url, { method: 'HEAD', cache: 'no-store' });
    if (headRes.ok) {
      const len = Number(headRes.headers.get('content-length') || 0);
      if (len >= 1024 * 1024) {
        return createHttpRangeFile(url, len);
      }
    }
  } catch (_) {}

  try {
    const rangeRes = await fetch(url, {
      headers: { Range: 'bytes=0-63' },
      cache: 'no-store',
    });
    if (rangeRes.status === 206) {
      const cr = rangeRes.headers.get('content-range') || '';
      const m = /\/(\d+)$/.exec(cr);
      const total = m ? Number(m[1]) : EXPECTED_GC_DISC_SIZE;
      if (total >= 1024 * 1024) {
        return createHttpRangeFile(url, total);
      }
    }
  } catch (_) {}

  return null;
}

async function bootWithDisc(discFile, sourceLabel) {
  if (booting || telemetry.started) return;
  booting = true;
  const startBtn = $('start');
  const discInput = $('disc');
  if (startBtn) startBtn.disabled = true;
  if (discInput) discInput.disabled = true;

  try {
    if (!navigator.gpu) {
      throw Error('This browser has no WebGPU. Try a current Chrome or Edge.');
    }
    telemetry.discSource = sourceLabel;
    telemetry.discSize = discFile.size;
    Module.discFile = discFile;
    activeCache = createDiscCache(discFile);
    Module.readDisc = activeCache.read;

    if (queryFighter && !pendingRigMetadata) {
      await compileAndPrepareRigOverlay(queryPlayer, queryRun, queryFighter);
    } else if (pendingRigMetadata && pendingRigBuffers.length > 0) {
      await applyPendingRigOverlaysToCache(activeCache);
    }

    for (const dir of ['/saves', '/cache']) {
      try {
        Module.FS.mkdirTree(dir);
        Module.FS.mount(Module.FS.filesystems.IDBFS, { autoPersist: dir === '/saves' }, dir);
      } catch (_) {}
    }
    await syncfs(true).catch(() => {});

    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') syncfs(false).catch(log);
    });

    status('Starting Super Smash Bros. Melee…');
    $('canvas')?.focus();
    telemetry.started = true;
    Module.callMain([]);
    status('Running (GALE01)');
  } catch (error) {
    booting = false;
    telemetry.lastError = String(error?.message || error);
    status(telemetry.lastError);
    log(error?.stack || error);
    if (discInput) discInput.disabled = false;
    updateStart();
  }
}

window.Module = {
  preRun: [() => Object.assign(Module.ENV, ENV)],
  canvas: $('canvas'),
  print: log,
  printErr: log,
  onFrame,
  onAbort: (reason) => {
    const msg = `Engine stopped: ${reason}`;
    telemetry.lastError = msg;
    status(msg);
  },
  onGraphicsPreparation: (done, total) =>
    status(
      done === total
        ? 'Starting…'
        : `Preparing graphics… ${Math.floor((done * 100) / total)}%`
    ),
  onRuntimeInitialized: async () => {
    ready = true;
    telemetry.runtimeReady = true;
    updateStart();

    if (!autorunDisabled) {
      status('Checking local GALE01 disc stream…');
      const httpDisc = await probeHttpDisc(customIsoUrl);
      if (httpDisc) {
        log(`disc: streaming ${customIsoUrl} (${httpDisc.size} bytes) via HTTP 206 byte ranges`);
        await bootWithDisc(httpDisc, 'http-range');
        return;
      }
    }
    status('Choose a GALE01 disc image (.iso or .gcm).');
    updateStart();
  },
};

$('disc')?.addEventListener('change', updateStart);

$('start')?.addEventListener('click', async () => {
  const file = $('disc')?.files?.[0];
  if (!file) return;
  await bootWithDisc(file, 'file-input');
});

// Threads need a cross-origin isolated page. Where the server cannot send
// COOP/COEP (static hosts), coi-sw.js adds them and the page reloads once
// under its control; the session flag stops a browser that still refuses
// from reloading forever.
if (crossOriginIsolated) {
  sessionStorage.removeItem('melee-coi-reload');
  const script = document.createElement('script');
  script.src = './melee_browser.js';
  script.onerror = () => {
    const msg = 'melee_browser.js is missing.';
    telemetry.lastError = msg;
    status(msg);
  };
  document.head.append(script);
} else if (navigator.serviceWorker && !sessionStorage.getItem('melee-coi-reload')) {
  sessionStorage.setItem('melee-coi-reload', '1');
  navigator.serviceWorker
    .register('./coi-sw.js')
    .then(() => navigator.serviceWorker.ready)
    .then(
      () => location.reload(),
      (error) => {
        const msg = `Cannot enable threads: ${error.message}`;
        telemetry.lastError = msg;
        status(msg);
      }
    );
} else {
  const msg =
    'This page needs cross-origin isolation for its threads, and this browser did not allow it.';
  telemetry.lastError = msg;
  status(msg);
}
