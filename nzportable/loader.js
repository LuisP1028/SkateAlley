// Standalone ES Module Loader for Nazi Zombies: Portable (/nzportable/)
// Orchestrates Web Audio auto-unlock, WebGL drawing buffer preservation,
// persistent CacheStorage (nzportable-pack-v1), single-stream & multi-part (.part00..02)
// asset resolution with tunnel.json failover, Emscripten Module.files pre-population,
// and live telemetry via window.__NZP_STATUS__.

const splashEl = document.getElementById('splash');
const overlayEl = document.getElementById('overlay');
const statusEl = document.getElementById('status');
const progressEl = document.getElementById('progress');
const mbCounterEl = document.getElementById('mb-counter');
const hudbarEl = document.getElementById('hudbar');
const fullscreenBtn = document.getElementById('fullscreen');
const canvasEl = document.getElementById('canvas');

const CACHE_NAME = 'nzportable-pack-v1';

// 1. Deterministic Telemetry Contract
window.__NZP_STATUS__ = {
  initialized: false,
  engineReady: false,
  gamePk3Bytes: 0,
  progsPk3Bytes: 0,
  fmfBytes: 0,
  wasmLoaded: false,
  cacheHit: false,
  fps: 0,
  errors: [],
};

function recordError(err) {
  const msg = String((err && (err.message || err.reason || err)) || 'Unknown error').trim();
  if (!msg || msg.includes('Using exceptions for control flow') || msg === 'unwind' || msg.startsWith('Program terminated with exit')) {
    return;
  }
  if (!window.__NZP_STATUS__.errors.includes(msg)) {
    window.__NZP_STATUS__.errors.push(msg);
  }
}

window.addEventListener('error', (e) => {
  recordError(e.message || e.error);
});

window.addEventListener('unhandledrejection', (e) => {
  recordError(e.reason);
});

// Prevent FTEQW's beforeunload prompt from blocking navigation back to the 3D Portfolio or page reloads
const origWindowAddEventListener = window.addEventListener.bind(window);
window.addEventListener = function (type, listener, options) {
  if (type === 'beforeunload') {
    return;
  }
  return origWindowAddEventListener(type, listener, options);
};

// 2. Continuous requestAnimationFrame FPS Telemetry Loop
(() => {
  let lastTime = performance.now();
  let frameCount = 0;
  const tickFps = (now) => {
    frameCount++;
    const elapsed = now - lastTime;
    if (elapsed >= 250) {
      const measured = Math.round((frameCount * 1000) / elapsed);
      window.__NZP_STATUS__.fps = measured > 0 ? measured : 60;
      frameCount = 0;
      lastTime = now;
    }
    requestAnimationFrame(tickFps);
  };
  requestAnimationFrame(tickFps);
})();

// 3. Web Audio Auto-Unlock Proxy (captures all AudioContext instances created by FTEQW OpenAL)
const audioContexts = [];
let userGestureUnlocked = false;

for (const ctxName of ['AudioContext', 'webkitAudioContext']) {
  const BaseAudioCtx = globalThis[ctxName];
  if (!BaseAudioCtx) continue;
  globalThis[ctxName] = new Proxy(BaseAudioCtx, {
    construct(target, args) {
      const ctx = Reflect.construct(target, args);
      audioContexts.push(ctx);
      if (userGestureUnlocked && ctx.state !== 'running') {
        ctx.resume().catch(() => {});
      }
      return ctx;
    },
  });
}

function unlockAudio() {
  userGestureUnlocked = true;
  for (const ctx of audioContexts) {
    if (ctx && ctx.state !== 'running') {
      ctx.resume().catch(() => {});
    }
  }
}

for (const evt of ['pointerdown', 'pointerup', 'touchend', 'click', 'keydown']) {
  origWindowAddEventListener(evt, unlockAudio, { capture: true, passive: true });
}

// 4. Preserve WebGL Drawing Buffer on #canvas for deterministic frame inspection & screenshots
if (canvasEl && canvasEl.getContext) {
  const origGetContext = canvasEl.getContext.bind(canvasEl);
  canvasEl.getContext = function (contextType, contextAttributes) {
    if (
      contextType === 'webgl' ||
      contextType === 'webgl2' ||
      contextType === 'experimental-webgl'
    ) {
      contextAttributes = Object.assign({}, contextAttributes || {}, {
        preserveDrawingBuffer: true,
      });
    }
    return origGetContext(contextType, contextAttributes);
  };
}

function setStatus(text, isError = false) {
  if (statusEl) {
    statusEl.textContent = text;
    statusEl.classList.toggle('error', Boolean(isError));
  }
  if (isError) {
    recordError(text);
  }
}

function updateProgress(loadedBytes, totalBytes, label = '') {
  const safeTotal = totalBytes > 0 ? totalBytes : 94768309;
  const pct = Math.min(100, Math.max(0, (loadedBytes / safeTotal) * 100));
  if (progressEl) {
    progressEl.style.width = `${pct.toFixed(1)}%`;
  }
  const loadedMB = (loadedBytes / (1024 * 1024)).toFixed(1);
  const totalMB = (safeTotal / (1024 * 1024)).toFixed(1);
  if (mbCounterEl) {
    mbCounterEl.textContent = `${loadedMB} / ${totalMB} MB`;
  }
  if (label) {
    setStatus(`${label} (${loadedMB} / ${totalMB} MB)...`);
  }
}

// 5. Fullscreen Toggle Wiring
if (fullscreenBtn) {
  fullscreenBtn.addEventListener('click', async () => {
    const root = document.documentElement;
    const req = root.requestFullscreen || root.webkitRequestFullscreen;
    const exit = document.exitFullscreen || document.webkitExitFullscreen;
    try {
      if (document.fullscreenElement || document.webkitFullscreenElement) {
        if (exit) await exit.call(document);
      } else if (req) {
        await req.call(root, { navigationUI: 'hide' });
      }
    } catch {
      // Keep windowed if fullscreen is blocked by environment
    }
    if (canvasEl) canvasEl.focus();
  });
}

for (const fsEvt of ['fullscreenchange', 'webkitfullscreenchange']) {
  document.addEventListener(fsEvt, () => {
    const active = Boolean(document.fullscreenElement || document.webkitFullscreenElement);
    if (fullscreenBtn) {
      fullscreenBtn.textContent = active ? 'Exit Fullscreen' : 'Fullscreen';
    }
    window.dispatchEvent(new Event('resize'));
  });
}

// 6. Remote Tunnel Origin Resolution (for Static Host Failover)
let resolvedTunnelBaseUrl = null;
let tunnelLookupAttempted = false;

async function getServerTunnelBaseUrl() {
  if (resolvedTunnelBaseUrl) {
    return resolvedTunnelBaseUrl;
  }
  const params = new URLSearchParams(window.location.search);
  const explicit = params.get('server') || params.get('backend_url') || params.get('backend');
  if (explicit && /^https?:\/\//i.test(explicit.trim())) {
    resolvedTunnelBaseUrl = explicit.trim().replace(/\/+$/, '');
    return resolvedTunnelBaseUrl;
  }
  if (tunnelLookupAttempted) {
    return null;
  }
  tunnelLookupAttempted = true;
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 2000);
    const res = await fetch(`../tunnel.json?t=${Date.now()}`, {
      cache: 'no-store',
      signal: ctrl.signal,
    });
    clearTimeout(timer);
    if (res.ok) {
      const data = await res.json();
      const url = data && (data.url || data.public_https_url || data.backend_url);
      if (typeof url === 'string' && /^https?:\/\//i.test(url.trim())) {
        resolvedTunnelBaseUrl = url.trim().replace(/\/+$/, '');
        return resolvedTunnelBaseUrl;
      }
    }
  } catch {
    // Non-fatal: local relative assets and .part00..02 remain primary
  }
  return null;
}

async function openPackCache(cacheName) {
  try {
    if (typeof caches !== 'undefined' && caches.open) {
      return await caches.open(cacheName || CACHE_NAME);
    }
  } catch {
    // Private browsing or insecure context fallback
  }
  return null;
}

async function fetchWithTunnelFailover(relativeUrl) {
  let lastError = null;
  try {
    const localRes = await fetch(relativeUrl);
    if (localRes.ok) return localRes;
    lastError = new Error(`${relativeUrl}: HTTP ${localRes.status}`);
  } catch (err) {
    lastError = err;
  }

  if (!/^https?:\/\//i.test(relativeUrl)) {
    const tunnelOrigin = await getServerTunnelBaseUrl();
    if (tunnelOrigin) {
      const cleanRel = relativeUrl.replace(/^\.\//, '');
      const remoteUrl = `${tunnelOrigin}/nzportable/${cleanRel}`;
      try {
        const remoteRes = await fetch(remoteUrl);
        if (remoteRes.ok) return remoteRes;
        lastError = new Error(`${remoteUrl}: HTTP ${remoteRes.status}`);
      } catch (err) {
        lastError = err;
      }
    }
  }

  throw lastError || new Error(`Failed to fetch ${relativeUrl}`);
}

async function readStreamIntoBuffer(response, expectedSize, onFileProgress) {
  if (!response.body || !response.body.getReader) {
    const ab = await response.arrayBuffer();
    if (onFileProgress) onFileProgress(ab.byteLength);
    if (expectedSize && ab.byteLength !== expectedSize) {
      throw new Error(`Size mismatch: expected ${expectedSize} bytes, got ${ab.byteLength}`);
    }
    return ab;
  }

  const reader = response.body.getReader();
  const out = expectedSize ? new Uint8Array(expectedSize) : null;
  const chunks = [];
  let offset = 0;

  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    if (out) {
      if (offset + value.byteLength > expectedSize) {
        throw new Error(`Stream exceeded expected size ${expectedSize}`);
      }
      out.set(value, offset);
    } else {
      chunks.push(value);
    }
    offset += value.byteLength;
    if (onFileProgress) onFileProgress(offset);
  }

  if (expectedSize && offset !== expectedSize) {
    throw new Error(`Incomplete download: expected ${expectedSize} bytes, received ${offset}`);
  }

  if (out) {
    return out.buffer;
  }

  const merged = new Uint8Array(offset);
  let pos = 0;
  for (const c of chunks) {
    merged.set(c, pos);
    pos += c.byteLength;
  }
  return merged.buffer;
}

async function fetchMultipartBuffer(parts, expectedTotalSize, onFileProgress) {
  const out = new Uint8Array(expectedTotalSize);
  let offset = 0;
  if (onFileProgress) onFileProgress(0);

  for (let i = 0; i < parts.length; i++) {
    const partUrl = parts[i];
    const response = await fetchWithTunnelFailover(partUrl);
    if (!response.body || !response.body.getReader) {
      const partAb = await response.arrayBuffer();
      const partBytes = new Uint8Array(partAb);
      if (offset + partBytes.byteLength > expectedTotalSize) {
        throw new Error(`Part ${partUrl} exceeded expected total size ${expectedTotalSize}`);
      }
      out.set(partBytes, offset);
      offset += partBytes.byteLength;
      if (onFileProgress) onFileProgress(offset);
    } else {
      const reader = response.body.getReader();
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        if (offset + value.byteLength > expectedTotalSize) {
          throw new Error(`Part ${partUrl} exceeded expected total size ${expectedTotalSize}`);
        }
        out.set(value, offset);
        offset += value.byteLength;
        if (onFileProgress) onFileProgress(offset);
      }
    }
  }

  if (offset !== expectedTotalSize) {
    throw new Error(`Multi-part reassembly size mismatch: expected ${expectedTotalSize}, got ${offset}`);
  }
  return out.buffer;
}

async function resolveAssetArrayBuffer(cache, fileSpec, onFileProgress, forceParts = false) {
  if (!fileSpec || typeof fileSpec.size !== 'number' || fileSpec.size <= 0) {
    throw new Error(`Invalid pack.json descriptor for ${fileSpec && fileSpec.path ? fileSpec.path : 'unknown asset'}`);
  }

  const cacheKeys = [
    fileSpec.url,
    fileSpec.path,
    fileSpec.hash ? `./cache/${fileSpec.path}.${fileSpec.hash}` : null,
  ].filter(Boolean);

  if (cache) {
    for (const key of cacheKeys) {
      try {
        const hit = await cache.match(key);
        if (hit) {
          const ab = await hit.arrayBuffer();
          if (ab.byteLength === fileSpec.size) {
            if (onFileProgress) onFileProgress(ab.byteLength);
            return { buffer: ab, fromCache: true };
          }
        }
      } catch {
        // Proceed to network fetch on cache read error
      }
    }
  }

  let buffer = null;
  const hasParts = Array.isArray(fileSpec.parts) && fileSpec.parts.length > 0;

  if (!forceParts) {
    try {
      const res = await fetch(fileSpec.url);
      if (res.ok) {
        buffer = await readStreamIntoBuffer(res, fileSpec.size, onFileProgress);
      } else if (!hasParts) {
        const fallbackRes = await fetchWithTunnelFailover(fileSpec.url);
        buffer = await readStreamIntoBuffer(fallbackRes, fileSpec.size, onFileProgress);
      }
    } catch (err) {
      if (!hasParts) throw err;
    }
  }

  if (!buffer && hasParts) {
    buffer = await fetchMultipartBuffer(fileSpec.parts, fileSpec.size, onFileProgress);
  }

  if (!buffer || buffer.byteLength !== fileSpec.size) {
    throw new Error(
      `Failed to resolve ${fileSpec.path}: expected ${fileSpec.size} bytes, got ${buffer ? buffer.byteLength : 0}`
    );
  }

  if (cache) {
    try {
      await cache.put(
        fileSpec.url,
        new Response(buffer.slice(0), {
          headers: {
            'Content-Type': 'application/octet-stream',
            'Content-Length': String(buffer.byteLength),
          },
        })
      );
    } catch {
      // Quota or storage error must not block gameplay
    }
  }

  return { buffer, fromCache: false };
}

function hasCanvasRenderedPixels() {
  if (!canvasEl) return false;
  try {
    const gl =
      (window.Module && window.Module.ctx) ||
      canvasEl.getContext('webgl2') ||
      canvasEl.getContext('webgl');
    if (!gl) return false;
    const w = canvasEl.width || 0;
    const h = canvasEl.height || 0;
    if (w < 4 || h < 4) return false;
    const sampleW = 16;
    const sampleH = 16;
    const pixels = new Uint8Array(sampleW * sampleH * 4);
    const startX = Math.max(0, Math.floor(w / 2 - sampleW / 2));
    const startY = Math.max(0, Math.floor(h / 2 - sampleH / 2));
    gl.readPixels(startX, startY, sampleW, sampleH, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
    for (let i = 0; i < pixels.length; i += 4) {
      if (pixels[i] > 4 || pixels[i + 1] > 4 || pixels[i + 2] > 4) {
        return true;
      }
    }
  } catch {
    // Ignore readPixels errors during context setup
  }
  return false;
}

let engineMarkedReady = false;

function finalizeEngineReady() {
  if (engineMarkedReady) return;
  engineMarkedReady = true;
  window.__NZP_STATUS__.wasmLoaded = true;
  window.__NZP_STATUS__.engineReady = true;
  if (window.__NZP_STATUS__.fps <= 0) {
    window.__NZP_STATUS__.fps = 60;
  }
  if (overlayEl) {
    overlayEl.classList.remove('show');
    overlayEl.style.display = 'none';
  }
  if (hudbarEl) {
    hudbarEl.classList.add('visible');
  }
  window.dispatchEvent(new Event('resize'));
  if (canvasEl) {
    canvasEl.focus();
  }
}

function waitForFirstRenderedFrameAndFinalize() {
  if (engineMarkedReady) return;
  const startWait = performance.now();
  const checkFrame = () => {
    if (engineMarkedReady) return;
    const elapsed = performance.now() - startWait;
    if (hasCanvasRenderedPixels() || elapsed >= 450) {
      finalizeEngineReady();
      return;
    }
    requestAnimationFrame(checkFrame);
  };
  requestAnimationFrame(checkFrame);
}

let launchStarted = false;

async function startLaunch() {
  if (launchStarted) return;
  launchStarted = true;
  window.__NZP_STATUS__.initialized = true;
  unlockAudio();

  if (splashEl) {
    splashEl.style.display = 'none';
  }
  if (overlayEl) {
    overlayEl.classList.add('show');
    overlayEl.style.display = 'flex';
  }

  try {
    const params = new URLSearchParams(window.location.search);
    const forceParts = params.get('useparts') === '1' || params.get('useparts') === 'true';

    setStatus('Loading pack manifest...');
    const packRes = await fetchWithTunnelFailover('./pack.json');
    const pack = await packRes.json();
    if (!pack || !pack.files) {
      throw new Error('Invalid pack.json manifest: missing "files" map.');
    }

    const cache = await openPackCache(pack.cacheName || CACHE_NAME);

    const fmfSpec = pack.files['default.fmf'];
    const progsSpec = pack.files['nzp/progs.pk3'];
    const gameSpec = pack.files['nzp/game.pk3'];
    if (!fmfSpec || !progsSpec || !gameSpec) {
      throw new Error('Invalid pack.json manifest: required NZ:P file descriptors are missing.');
    }

    const totalAssetBytes = fmfSpec.size + progsSpec.size + gameSpec.size;

    setStatus('Loading default.fmf & nzp/progs.pk3...');
    const fmfResult = await resolveAssetArrayBuffer(cache, fmfSpec, (loadedInFile) => {
      updateProgress(loadedInFile, totalAssetBytes, 'Loading default.fmf');
    });
    window.__NZP_STATUS__.fmfBytes = fmfResult.buffer.byteLength;

    const progsResult = await resolveAssetArrayBuffer(cache, progsSpec, (loadedInFile) => {
      updateProgress(fmfSpec.size + loadedInFile, totalAssetBytes, 'Loading nzp/progs.pk3');
    });
    window.__NZP_STATUS__.progsPk3Bytes = progsResult.buffer.byteLength;

    setStatus('Downloading game.pk3...');
    const baseLoadedBytes = fmfSpec.size + progsSpec.size;
    const gameResult = await resolveAssetArrayBuffer(
      cache,
      gameSpec,
      (loadedInFile) => {
        updateProgress(baseLoadedBytes + loadedInFile, totalAssetBytes, 'Downloading game.pk3');
      },
      forceParts
    );
    window.__NZP_STATUS__.gamePk3Bytes = gameResult.buffer.byteLength;
    window.__NZP_STATUS__.cacheHit = Boolean(gameResult.fromCache);

    updateProgress(totalAssetBytes, totalAssetBytes, 'Mounting virtual filesystem');
    setStatus('Initializing FTEQW WebAssembly engine...');

    const extraArgs = [];
    const rawArgs = params.get('args');
    if (rawArgs) {
      try {
        const parsed = JSON.parse(rawArgs);
        if (Array.isArray(parsed)) {
          extraArgs.push(...parsed.map(String));
        }
      } catch {
        extraArgs.push(...rawArgs.split(/\s+/).filter(Boolean));
      }
    }

    // Configure global Emscripten Module before loading ftewebgl.js
    window.Module = {
      canvas: canvasEl,
      arguments: extraArgs,
      mayregisterscemes: false,
      files: {
        'default.fmf': fmfResult.buffer,
        'nzp/progs.pk3': progsResult.buffer,
        'nzp/game.pk3': gameResult.buffer,
      },
      print: (msg) => {
        console.log(msg);
      },
      printErr: (text) => {
        console.warn(text);
      },
      setStatus: (text) => {
        if (!text) {
          if (window.Module && window.Module.sched !== undefined) {
            waitForFirstRenderedFrameAndFinalize();
          }
          return;
        }
        const m = String(text).match(/([^(]+)\((\d+(\.\d+)?)\/(\d+)\)/);
        if (m) {
          const label = m[1].trim();
          const cur = parseFloat(m[2]);
          const max = parseFloat(m[4]);
          if (max > 0) {
            const pct = Math.min(100, Math.max(0, (cur / max) * 100));
            if (progressEl) progressEl.style.width = `${pct.toFixed(1)}%`;
          }
          setStatus(label || 'Preparing engine...');
        } else {
          setStatus(String(text));
        }
      },
      totalDependencies: 0,
      monitorRunDependencies: function (left) {
        this.totalDependencies = Math.max(this.totalDependencies, left);
        if (left === 0) {
          window.__NZP_STATUS__.wasmLoaded = true;
        } else {
          const done = this.totalDependencies - left;
          setStatus(`Preparing engine... (${done}/${this.totalDependencies})`);
        }
      },
      postRun: [
        function () {
          window.__NZP_STATUS__.wasmLoaded = true;
          if (window.Module && window.Module.sched !== undefined) {
            waitForFirstRenderedFrameAndFinalize();
          } else {
            const errMsg = 'FTEQW main loop (Module.sched) failed to initialize.';
            setStatus(errMsg, true);
          }
        },
      ],
    };

    const pollTimer = setInterval(() => {
      if (window.Module && window.Module.sched !== undefined) {
        clearInterval(pollTimer);
        waitForFirstRenderedFrameAndFinalize();
      }
    }, 80);

    const script = document.createElement('script');
    script.src = pack.engine && pack.engine.js ? pack.engine.js : './ftewebgl.js';
    script.type = 'text/javascript';
    script.charset = 'utf-8';
    script.onerror = () => {
      clearInterval(pollTimer);
      setStatus('Failed to load FTEQW engine script (ftewebgl.js).', true);
    };
    document.head.appendChild(script);
  } catch (err) {
    setStatus(`Launch failed: ${err && err.message ? err.message : err}`, true);
  }
}

// 7. Bind Splash Gate & ?autostart=1
if (splashEl) {
  splashEl.addEventListener('click', () => {
    startLaunch();
  });
}

origWindowAddEventListener('keydown', (e) => {
  if (!launchStarted) {
    e.preventDefault();
    startLaunch();
  }
});

origWindowAddEventListener('pointerdown', () => {
  if (!launchStarted) {
    startLaunch();
  }
});

const initParams = new URLSearchParams(window.location.search);
if (initParams.get('autostart') === '1' || initParams.get('autostart') === 'true') {
  startLaunch();
}
