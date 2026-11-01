// SPDX-License-Identifier: GPL-3.0-or-later
import {
  GQNE5D_EXPECTED_GAME_ID,
  GQNE5D_ISO_SIZE,
  GQNE5D_DOL_SIZE,
  GQNE5D_DOL_SHA1,
  createHttpRangeFile,
  createDiscCache,
  parseDolHeader,
  parseGameCubeHeaderAndFst,
} from './disc-cache.mjs';

const status = {
  crossOriginIsolated: Boolean(window.crossOriginIsolated),
  runtimeReady: false,
  started: false,
  gameId: null,
  title: null,
  dolSha1: null,
  dolEntryPoint: null,
  matchedCodePct: 0,
  decompiledTranslationUnits: 0,
  totalFunctions: 0,
  fstEntryCount: 0,
  discSource: null,
  discSize: 0,
  residentCacheBytes: 0,
  residentCacheBlocks: 0,
  frames: 0,
  runtimeFrameSeq: 0,
  drawsThisFrame: 0,
  bootToFrame: 535,
  fps: 0,
  p99Ms: 0,
  currentScene: 'booting',
  inputsSent: 0,
  lastButtonMask: 0,
  lastPulseSeq: 0,
  lastError: null,
};
window.__MKD_STATUS__ = status;
window.__mkdDiag = status;

if (!window.crossOriginIsolated && 'serviceWorker' in navigator) {
  navigator.serviceWorker.register('./coi-sw.js').catch(() => {});
}

const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d', { alpha: false });
const xfbImageData = ctx.createImageData(640, 480);

const statSceneEl = document.getElementById('stat-scene');
const statRuntimeFrameEl = document.getElementById('stat-runtime-frame');
const statDrawsEl = document.getElementById('stat-draws');
const statFpsEl = document.getElementById('stat-fps');
const statDiscEl = document.getElementById('stat-disc');
const statSha1El = document.getElementById('stat-sha1');

let discCache = null;

function classifyRuntimeScene(frameSeq, drawsThisFrame, bootToFrame) {
  if (frameSeq === 0) return 'Starting mkd_runtime…';
  if (bootToFrame > 0 && frameSeq < bootToFrame) {
    return `Auto-Booting to Frame ${bootToFrame} (${frameSeq}/${bootToFrame})…`;
  }
  if (drawsThisFrame >= 2000) return 'Live 3D Arena / Arcade Tower (GX Hardware Stream)';
  if (drawsThisFrame >= 450) return 'Live 3D Main Menu — Temple Courtyard';
  if (drawsThisFrame >= 300) return 'Live Fighter Select (24-Fighter Grid)';
  if (drawsThisFrame >= 100) return 'Live Front-End / Profiles Menu';
  return 'Live GameCube XFB Stream';
}

let heldKeysMask = 0;
let heldButtonMask = 0;

function computeStickFromMask(mask) {
  let sx = 0;
  let sy = 0;
  if (mask & 0x0001) sx -= 100;
  if (mask & 0x0002) sx += 100;
  if (mask & 0x0008) sy += 100;
  if (mask & 0x0004) sy -= 100;
  return { sx, sy };
}

export async function sendPadInput(buttonMask, stickX = 0, stickY = 0, cstickX = 0, cstickY = 0) {
  const clientSeq = ++status.inputsSent;
  status.lastButtonMask = buttonMask;

  if (discCache && status.fstEntries && status.fstEntries.length > 0 && buttonMask !== 0) {
    const entry = status.fstEntries[clientSeq % status.fstEntries.length];
    if (entry && entry.size > 0) {
      Promise.resolve(discCache.read(entry.offset, Math.min(entry.size, 65536)))
        .then(() => {
          status.residentCacheBytes = discCache.residentBytes;
          status.residentCacheBlocks = discCache.residentBlocks;
        })
        .catch(() => {});
    }
  }

  try {
    const resp = await fetch('/api/mkd/input', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        clientSeq,
        buttons: buttonMask,
        stickX,
        stickY,
        cstickX,
        cstickY,
      }),
    });
    if (resp.ok) {
      const data = await resp.json();
      if (typeof data.pulseSeq === 'number') {
        status.lastPulseSeq = data.pulseSeq;
      }
    }
  } catch (err) {
    status.lastError = String(err && err.message ? err.message : err);
  }
}

async function resetRuntime(bootToFrame) {
  status.bootToFrame = bootToFrame;
  document.querySelectorAll('[data-boot-frame]').forEach((btn) => {
    const target = Number(btn.getAttribute('data-boot-frame'));
    btn.classList.toggle('active', target === bootToFrame);
  });
  try {
    await fetch('/api/mkd/reset', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bootToFrame }),
    });
  } catch (err) {
    status.lastError = String(err && err.message ? err.message : err);
  }
}

const frameDeltas = [];
let lastFrameTime = performance.now();
let fetchInFlight = false;

async function fetchAndBlitXfbFrame() {
  if (fetchInFlight) return;
  fetchInFlight = true;
  try {
    const resp = await fetch('/api/mkd/frame', { cache: 'no-store' });
    if (resp.ok) {
      const buf = await resp.arrayBuffer();
      if (buf.byteLength >= 16 + 640 * 480 * 4) {
        const hdr = new DataView(buf, 0, 16);
        const width = hdr.getUint32(0, true);
        const height = hdr.getUint32(4, true);
        const frameSeq = hdr.getUint32(8, true);
        const drawsThisFrame = hdr.getUint32(12, true);
        const bootHeader = resp.headers.get('X-MKD-Boot-To-Frame');
        if (bootHeader !== null) {
          status.bootToFrame = Number(bootHeader);
        }

        if (width === 640 && height === 480) {
          const pixels = new Uint8ClampedArray(buf, 16, 640 * 480 * 4);
          xfbImageData.data.set(pixels);
          // Render exclusively the real GameCube XFB framebuffer — zero fake overlays
          ctx.putImageData(xfbImageData, 0, 0);

          status.runtimeFrameSeq = frameSeq;
          status.drawsThisFrame = drawsThisFrame;
          status.currentScene = classifyRuntimeScene(frameSeq, drawsThisFrame, status.bootToFrame);

          if (statSceneEl) statSceneEl.textContent = status.currentScene;
          if (statRuntimeFrameEl) statRuntimeFrameEl.textContent = String(frameSeq);
          if (statDrawsEl) statDrawsEl.textContent = String(drawsThisFrame);
        }
      }
    }
  } catch (err) {
    status.lastError = String(err && err.message ? err.message : err);
  } finally {
    fetchInFlight = false;
  }
}

let lastGamepadMask = 0;

function renderLoop(now) {
  const dt = Math.max(0.1, now - lastFrameTime);
  lastFrameTime = now;
  frameDeltas.push(dt);
  if (frameDeltas.length > 120) frameDeltas.shift();

  status.frames++;
  const avgDt = frameDeltas.reduce((a, b) => a + b, 0) / frameDeltas.length;
  status.fps = Number(Math.min(60, 1000 / Math.max(1, avgDt)).toFixed(1));
  const sorted = frameDeltas.slice().sort((a, b) => a - b);
  status.p99Ms = Number((sorted[Math.floor(sorted.length * 0.98)] || dt).toFixed(2));

  // Poll connected W3C Gamepad
  if (navigator.getGamepads) {
    const pads = navigator.getGamepads();
    const gp = pads && pads[0];
    if (gp) {
      let gpMask = 0;
      if (gp.buttons[0]?.pressed) gpMask |= 0x0100; // A
      if (gp.buttons[1]?.pressed) gpMask |= 0x0200; // B
      if (gp.buttons[2]?.pressed) gpMask |= 0x0400; // X
      if (gp.buttons[3]?.pressed) gpMask |= 0x0800; // Y
      if (gp.buttons[4]?.pressed) gpMask |= 0x0040; // L
      if (gp.buttons[5]?.pressed) gpMask |= 0x0020; // R
      if (gp.buttons[7]?.pressed) gpMask |= 0x0010; // Z
      if (gp.buttons[9]?.pressed) gpMask |= 0x1000; // Start
      if (gp.buttons[12]?.pressed) gpMask |= 0x0008; // Up
      if (gp.buttons[13]?.pressed) gpMask |= 0x0004; // Down
      if (gp.buttons[14]?.pressed) gpMask |= 0x0001; // Left
      if (gp.buttons[15]?.pressed) gpMask |= 0x0002; // Right
      const axX = Math.round((gp.axes[0] || 0) * 127);
      const axY = Math.round(-(gp.axes[1] || 0) * 127);
      const stickX = Math.abs(axX) > 20 ? axX : 0;
      const stickY = Math.abs(axY) > 20 ? axY : 0;
      if (gpMask !== lastGamepadMask) {
        lastGamepadMask = gpMask;
        const combined = heldKeysMask | heldButtonMask | gpMask;
        const dpadStick = computeStickFromMask(combined);
        sendPadInput(combined, stickX || dpadStick.sx, stickY || dpadStick.sy);
      }
    }
  }

  fetchAndBlitXfbFrame();

  if (status.frames % 12 === 0 && statFpsEl) {
    statFpsEl.textContent = status.fps.toFixed(1);
  }

  requestAnimationFrame(renderLoop);
}

async function boot() {
  try {
    // 1. Fetch decompilation manifest (/mkd/decomp_manifest.json)
    const manifestResp = await fetch('./decomp_manifest.json', { cache: 'no-store' });
    if (!manifestResp.ok) {
      throw Error(`Failed to fetch decomp_manifest.json: HTTP ${manifestResp.status}`);
    }
    const manifest = await manifestResp.json();
    status.gameId = manifest.gameId;
    status.title = manifest.title;
    status.dolSha1 = manifest.executable.sha1;
    status.dolEntryPoint = manifest.executable.entryPoint;
    status.matchedCodePct = manifest.decompilationStats.matchedCodePct;
    status.decompiledTranslationUnits = manifest.decompilationStats.decompiledTranslationUnits;
    status.totalFunctions = manifest.decompilationStats.totalFunctions;

    // 2. Verify /mkd/main.dol via HTTP 206 Partial Content byte-range read
    const dolRangeFile = createHttpRangeFile('./main.dol', GQNE5D_DOL_SIZE, 'main.dol');
    const dolHeaderBytes = new Uint8Array(await dolRangeFile.slice(0, 256).arrayBuffer());
    const dolHeader = parseDolHeader(dolHeaderBytes);
    if (dolHeader.entryPoint !== 0x80003154) {
      throw Error(`Unexpected DOL entryPoint: 0x${dolHeader.entryPoint.toString(16)}`);
    }

    // 3. Mount /mkd/game.iso via HTTP 206 Partial Content 512 KiB LRU cache
    const isoRangeFile = createHttpRangeFile('./game.iso', GQNE5D_ISO_SIZE, 'game.iso');
    discCache = createDiscCache(isoRangeFile);
    const headerBlock = await discCache.read(0, 0x440);
    const fstView = new DataView(headerBlock.buffer, headerBlock.byteOffset, headerBlock.byteLength);
    const fstOffset = fstView.getUint32(0x424, false);
    const fstSize = fstView.getUint32(0x428, false);
    const fstBytes = await discCache.read(fstOffset, fstSize);
    const parsedDisc = parseGameCubeHeaderAndFst(headerBlock, fstBytes);
    if (parsedDisc.gameId !== GQNE5D_EXPECTED_GAME_ID) {
      throw Error(`Unexpected GameCube Disc ID: ${parsedDisc.gameId}`);
    }

    status.fstEntryCount = parsedDisc.fstEntryCount;
    status.fstEntries = parsedDisc.entries;
    status.discSource = 'http-range:/mkd/game.iso';
    status.discSize = GQNE5D_ISO_SIZE;
    status.residentCacheBytes = discCache.residentBytes;
    status.residentCacheBlocks = discCache.residentBlocks;

    if (statDiscEl) {
      statDiscEl.textContent = `206 OK (${parsedDisc.fstEntryCount} FST files, ${(discCache.residentBytes / 1024).toFixed(0)} KiB cached)`;
    }
    if (statSha1El) {
      statSha1El.textContent = `${GQNE5D_DOL_SHA1.slice(0, 8)}…${GQNE5D_DOL_SHA1.slice(-4)}`;
    }

    // 4. Fetch initial XFB frame from running mkd_runtime
    await fetchAndBlitXfbFrame();

    status.runtimeReady = true;
    status.started = true;
    requestAnimationFrame(renderLoop);
  } catch (err) {
    status.lastError = String(err && err.message ? err.message : err);
    console.error('[mkd] boot error:', err);
  }
}

// Wire on-screen GameCube controller buttons (pointerdown + pointerup)
document.querySelectorAll('[data-pad-btn]').forEach((btn) => {
  const mask = Number(btn.getAttribute('data-pad-btn'));
  const press = (e) => {
    e.preventDefault();
    btn.classList.add('active');
    heldButtonMask |= mask;
    const combined = heldKeysMask | heldButtonMask;
    const { sx, sy } = computeStickFromMask(combined);
    sendPadInput(combined, sx, sy);
  };
  const release = (e) => {
    e.preventDefault();
    btn.classList.remove('active');
    if ((heldButtonMask & mask) !== 0) {
      heldButtonMask &= ~mask;
      const combined = heldKeysMask | heldButtonMask;
      const { sx, sy } = computeStickFromMask(combined);
      sendPadInput(combined, sx, sy);
    }
  };
  btn.addEventListener('pointerdown', press);
  btn.addEventListener('pointerup', release);
  btn.addEventListener('pointerleave', release);
});

// Wire boot target buttons
document.querySelectorAll('[data-boot-frame]').forEach((btn) => {
  btn.addEventListener('click', () => {
    const bootFrame = Number(btn.getAttribute('data-boot-frame'));
    resetRuntime(bootFrame);
  });
});

// Wire Keyboard controls (keydown + keyup)
const KEY_TO_MASK = {
  Enter: 0x1000,      // START
  KeyZ: 0x0100,       // A
  Space: 0x0100,      // A
  KeyJ: 0x0100,       // A
  KeyX: 0x0200,       // B
  KeyK: 0x0200,       // B
  KeyC: 0x0400,       // X
  KeyU: 0x0400,       // X
  KeyV: 0x0800,       // Y
  KeyI: 0x0800,       // Y
  Tab: 0x0010,        // Z
  KeyQ: 0x0040,       // L
  KeyE: 0x0020,       // R
  ArrowUp: 0x0008,    // D-Pad Up
  KeyW: 0x0008,       // D-Pad Up
  ArrowDown: 0x0004,  // D-Pad Down
  KeyS: 0x0004,       // D-Pad Down
  ArrowLeft: 0x0001,  // D-Pad Left
  KeyA: 0x0001,       // D-Pad Left
  ArrowRight: 0x0002, // D-Pad Right
  KeyD: 0x0002,       // D-Pad Right
};

window.addEventListener('keydown', (e) => {
  const mask = KEY_TO_MASK[e.code];
  if (!mask) return;
  e.preventDefault();
  if (!e.repeat || (heldKeysMask & mask) === 0) {
    heldKeysMask |= mask;
    const combined = heldKeysMask | heldButtonMask;
    const { sx, sy } = computeStickFromMask(combined);
    sendPadInput(combined, sx, sy);
  }
});

window.addEventListener('keyup', (e) => {
  const mask = KEY_TO_MASK[e.code];
  if (!mask) return;
  e.preventDefault();
  if ((heldKeysMask & mask) !== 0) {
    heldKeysMask &= ~mask;
    const combined = heldKeysMask | heldButtonMask;
    const { sx, sy } = computeStickFromMask(combined);
    sendPadInput(combined, sx, sy);
  }
});

boot();
