/**
 * spray_paint_loader.js
 *
 * Interactive Graffiti Spray-Paint Loading Screen & Intro Component
 * Governed by: spray_paint.md (§1–§8)
 * Canonical Reference Ground Truth: /Users/diesel/Desktop/SkateAlley/spray.mp4
 * Source Artwork: tags/1DOOMTAG.jpeg (3514 x 1184 px, "PLATO DOOM" bubble throw-up)
 */

export const SPRAY_PAINT_TIMELINE_SPEC = Object.freeze({
  totalDurationMs: 6500,
  blackoutEndMs: 500,
  shakeBurstsMs: Object.freeze([540, 720, 980, 1140]),
  shakeEndMs: 1300,
  valveClickMs: 1660,
  sprayStartMs: 2039,
  sprayEndMs: 3075,
  holdEndMs: 6180,
  fadeEndMs: 6500,
  passes: Object.freeze([
    Object.freeze({ index: 0, id: 'PASS_1_TOP', letterId: 'D', startMs: 2039, endMs: 2230, progressStart: 0.00, progressEnd: 0.25 }),
    Object.freeze({ index: 1, id: 'PASS_2_MID_UPPER', letterId: 'O1', startMs: 2270, endMs: 2510, progressStart: 0.25, progressEnd: 0.46 }),
    Object.freeze({ index: 2, id: 'PASS_3_MID_LOWER', letterId: 'O2', startMs: 2580, endMs: 2810, progressStart: 0.46, progressEnd: 0.71 }),
    Object.freeze({ index: 3, id: 'PASS_4_BASE', letterId: 'M', startMs: 2840, endMs: 3075, progressStart: 0.71, progressEnd: 1.00 }),
  ]),
});

export const SPRAY_LETTER_SPECS = Object.freeze([
  Object.freeze({
    index: 0,
    id: 'D',
    progressStart: 0.00,
    progressEnd: 0.25,
    uvBounds: Object.freeze({ uMin: 0.1124, uMax: 0.3552, vMin: 0.1622, vMax: 0.9578 }),
    waypoints: Object.freeze([
      [0.310, 0.195], [0.245, 0.205], [0.180, 0.220],
      [0.135, 0.320], [0.240, 0.335], [0.345, 0.350],
      [0.350, 0.455], [0.230, 0.475], [0.118, 0.495],
      [0.120, 0.610], [0.235, 0.635], [0.352, 0.655],
      [0.350, 0.755], [0.250, 0.780], [0.158, 0.805],
      [0.205, 0.875], [0.275, 0.895], [0.345, 0.905],
    ]),
  }),
  Object.freeze({
    index: 1,
    id: 'O1',
    progressStart: 0.25,
    progressEnd: 0.46,
    uvBounds: Object.freeze({ uMin: 0.3480, uMax: 0.5074, vMin: 0.1191, vMax: 0.9172 }),
    waypoints: Object.freeze([
      [0.480, 0.175], [0.420, 0.190], [0.358, 0.215],
      [0.350, 0.325], [0.420, 0.350], [0.488, 0.370],
      [0.482, 0.480], [0.420, 0.510], [0.358, 0.540],
      [0.362, 0.660], [0.430, 0.690], [0.502, 0.725],
      [0.494, 0.845], [0.440, 0.870], [0.390, 0.885],
    ]),
  }),
  Object.freeze({
    index: 2,
    id: 'O2',
    progressStart: 0.46,
    progressEnd: 0.71,
    uvBounds: Object.freeze({ uMin: 0.4960, uMax: 0.6642, vMin: 0.1377, vMax: 0.8927 }),
    waypoints: Object.freeze([
      [0.515, 0.230], [0.575, 0.205], [0.642, 0.195],
      [0.608, 0.335], [0.550, 0.355], [0.500, 0.375],
      [0.498, 0.490], [0.560, 0.515], [0.618, 0.540],
      [0.655, 0.655], [0.580, 0.685], [0.505, 0.715],
      [0.525, 0.815], [0.590, 0.855], [0.645, 0.865],
    ]),
  }),
  Object.freeze({
    index: 3,
    id: 'M',
    progressStart: 0.71,
    progressEnd: 1.00,
    uvBounds: Object.freeze({ uMin: 0.6187, uMax: 0.9471, vMin: 0.1199, vMax: 0.9215 }),
    waypoints: Object.freeze([
      [0.658, 0.195], [0.625, 0.335], [0.635, 0.485], [0.675, 0.655],
      [0.695, 0.440], [0.755, 0.235], [0.870, 0.225],
      [0.878, 0.370], [0.775, 0.410], [0.665, 0.450],
      [0.675, 0.565], [0.805, 0.585], [0.940, 0.605],
      [0.938, 0.730], [0.810, 0.750], [0.685, 0.765],
      [0.710, 0.865], [0.815, 0.880], [0.910, 0.890],
    ]),
  }),
]);

export const SPRAY_ARCADE_TIMELINE_SPEC = Object.freeze({
  totalDurationMs: 6500,
  blackoutEndMs: 500,
  shakeBurstsMs: Object.freeze([540, 720, 980, 1140]),
  shakeEndMs: 1300,
  valveClickMs: 1660,
  sprayStartMs: 2039,
  sprayEndMs: 3075,
  holdEndMs: 6180,
  fadeEndMs: 6500,
  passes: Object.freeze([
    Object.freeze({ index: 0, id: 'PASS_1_D', letterId: 'D', startMs: 2039, endMs: 2225, progressStart: 0.00, progressEnd: 0.20 }),
    Object.freeze({ index: 1, id: 'PASS_2_O1', letterId: 'O1', startMs: 2245, endMs: 2425, progressStart: 0.20, progressEnd: 0.38 }),
    Object.freeze({ index: 2, id: 'PASS_3_O2', letterId: 'O2', startMs: 2445, endMs: 2625, progressStart: 0.38, progressEnd: 0.56 }),
    Object.freeze({ index: 3, id: 'PASS_4_M', letterId: 'M', startMs: 2645, endMs: 2855, progressStart: 0.56, progressEnd: 0.78 }),
    Object.freeze({ index: 4, id: 'PASS_5_ARCADE', letterId: 'ARCADE', startMs: 2875, endMs: 3075, progressStart: 0.78, progressEnd: 1.00 }),
  ]),
});

export const SPRAY_ARCADE_LETTER_SPECS = Object.freeze([
  Object.freeze({
    index: 0,
    id: 'D',
    progressStart: 0.00,
    progressEnd: 0.20,
    uvBounds: Object.freeze({ uMin: 0.2131, uMax: 0.3984, vMin: 0.0870, vMax: 0.6959 }),
    waypoints: Object.freeze([
      [0.365, 0.120], [0.305, 0.130], [0.245, 0.155],
      [0.222, 0.235], [0.305, 0.250], [0.385, 0.265],
      [0.390, 0.350], [0.300, 0.365], [0.220, 0.380],
      [0.225, 0.465], [0.310, 0.480], [0.392, 0.495],
      [0.388, 0.575], [0.320, 0.595], [0.265, 0.615],
      [0.295, 0.660], [0.345, 0.675], [0.382, 0.665],
    ]),
  }),
  Object.freeze({
    index: 1,
    id: 'O1',
    progressStart: 0.20,
    progressEnd: 0.38,
    uvBounds: Object.freeze({ uMin: 0.3890, uMax: 0.5097, vMin: 0.0541, vMax: 0.6647 }),
    waypoints: Object.freeze([
      [0.485, 0.095], [0.440, 0.110], [0.398, 0.135],
      [0.395, 0.230], [0.448, 0.245], [0.496, 0.265],
      [0.492, 0.365], [0.445, 0.385], [0.400, 0.405],
      [0.402, 0.505], [0.455, 0.525], [0.502, 0.545],
      [0.495, 0.625], [0.455, 0.645], [0.420, 0.640],
    ]),
  }),
  Object.freeze({
    index: 2,
    id: 'O2',
    progressStart: 0.38,
    progressEnd: 0.56,
    uvBounds: Object.freeze({ uMin: 0.5011, uMax: 0.6244, vMin: 0.0684, vMax: 0.6461 }),
    waypoints: Object.freeze([
      [0.520, 0.120], [0.565, 0.105], [0.612, 0.100],
      [0.595, 0.215], [0.550, 0.235], [0.508, 0.255],
      [0.506, 0.355], [0.555, 0.375], [0.602, 0.395],
      [0.618, 0.495], [0.565, 0.520], [0.515, 0.540],
      [0.530, 0.605], [0.575, 0.625], [0.612, 0.620],
    ]),
  }),
  Object.freeze({
    index: 3,
    id: 'M',
    progressStart: 0.56,
    progressEnd: 0.78,
    uvBounds: Object.freeze({ uMin: 0.5905, uMax: 0.8338, vMin: 0.0557, vMax: 0.6672 }),
    waypoints: Object.freeze([
      [0.635, 0.115], [0.600, 0.235], [0.608, 0.365], [0.642, 0.505],
      [0.662, 0.335], [0.710, 0.155], [0.780, 0.145],
      [0.790, 0.275], [0.715, 0.310], [0.640, 0.345],
      [0.648, 0.445], [0.740, 0.465], [0.825, 0.485],
      [0.822, 0.575], [0.735, 0.595], [0.652, 0.610],
      [0.675, 0.645], [0.755, 0.650], [0.810, 0.645],
    ]),
  }),
  Object.freeze({
    index: 4,
    id: 'ARCADE',
    progressStart: 0.78,
    progressEnd: 1.00,
    uvBounds: Object.freeze({ uMin: 0.3460, uMax: 0.6946, vMin: 0.6782, vMax: 0.9611 }),
    waypoints: Object.freeze([
      [0.352, 0.785], [0.435, 0.775], [0.520, 0.760], [0.605, 0.745], [0.688, 0.780],
      [0.690, 0.855], [0.605, 0.865], [0.520, 0.870], [0.435, 0.875], [0.350, 0.880],
      [0.355, 0.935], [0.440, 0.940], [0.525, 0.940], [0.610, 0.938], [0.688, 0.932],
    ]),
  }),
]);

export const SPRAY_DEFAULT_OPTIONS = Object.freeze({
  logoSource: 'tags/1DOOMTAG.jpeg',
  mode: 'deterministic',
  duration: 6500,
  loop: false,
  audioEnabled: true,
  volume: 0.8,
  oversprayIntensity: 0.5,
  mistEnabled: true,
  backgroundColor: '#000000',
});

export function isArcadeLogoProfile(logoSource, explicitProfile) {
  if (explicitProfile === 'platodoomarcade' || explicitProfile === 'arcade') return true;
  if (explicitProfile === '1doomtag' || explicitProfile === 'default') return false;
  return String(logoSource || '').toLowerCase().includes('platodoomarcade');
}

function parseHexColorToRGBNormalized(hexStr) {
  const cleaned = String(hexStr || '#000000').trim().replace(/^#/, '');
  if (cleaned.length === 3) {
    const r = parseInt(cleaned[0] + cleaned[0], 16) / 255;
    const g = parseInt(cleaned[1] + cleaned[1], 16) / 255;
    const b = parseInt(cleaned[2] + cleaned[2], 16) / 255;
    return [Number.isFinite(r) ? r : 0, Number.isFinite(g) ? g : 0, Number.isFinite(b) ? b : 0];
  }
  if (cleaned.length >= 6) {
    const r = parseInt(cleaned.slice(0, 2), 16) / 255;
    const g = parseInt(cleaned.slice(2, 4), 16) / 255;
    const b = parseInt(cleaned.slice(4, 6), 16) / 255;
    return [Number.isFinite(r) ? r : 0, Number.isFinite(g) ? g : 0, Number.isFinite(b) ? b : 0];
  }
  return [0, 0, 0];
}

function seededHash(n) {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453123;
  return x - Math.floor(x);
}

/**
 * Builds a dense, arc-length-parameterized table of virtual spray nozzle sample points
 * across the target letters (D -> O1 -> O2 -> M [-> ARCADE]), including local curvature/deceleration factors.
 */
export function buildChoreographedNozzleTrajectory(samplesPerLetter = 450, letterSpecs = SPRAY_LETTER_SPECS) {
  const specs = Array.isArray(letterSpecs) && letterSpecs.length > 0 ? letterSpecs : SPRAY_LETTER_SPECS;
  const trajectory = [];
  for (let lIdx = 0; lIdx < specs.length; lIdx++) {
    const letter = specs[lIdx];
    const pts = letter.waypoints;
    const segLengths = [];
    let totalLen = 0;
    for (let i = 0; i < pts.length - 1; i++) {
      const dx = (pts[i + 1][0] - pts[i][0]) * 2.9679;
      const dy = pts[i + 1][1] - pts[i][1];
      const len = Math.hypot(dx, dy);
      segLengths.push(len);
      totalLen += len;
    }

    const cumLengths = [0];
    let acc = 0;
    for (let i = 0; i < segLengths.length; i++) {
      acc += segLengths[i];
      cumLengths.push(acc);
    }

    for (let s = 0; s <= samplesPerLetter; s++) {
      const localT = s / samplesPerLetter;
      const globalProgress = letter.progressStart + localT * (letter.progressEnd - letter.progressStart);
      const targetDist = localT * totalLen;

      let segIdx = 0;
      while (segIdx < segLengths.length - 1 && cumLengths[segIdx + 1] < targetDist) {
        segIdx++;
      }
      const segStartDist = cumLengths[segIdx];
      const segLen = Math.max(1e-6, segLengths[segIdx]);
      const rawSegFrac = Math.max(0, Math.min(1, (targetDist - segStartDist) / segLen));

      // Wrist kinematics: decelerate into tight turnaround vertices, accelerate mid-span
      const distFromVertex = Math.min(rawSegFrac, 1.0 - rawSegFrac) * 2.0; // 0 at vertex, 1 at midpoint
      const speedFactor = 0.45 + 0.55 * Math.sin(distFromVertex * Math.PI * 0.5);
      const depositionDensity = 0.42 + 0.36 * (1.0 - distFromVertex);

      const p0 = pts[segIdx];
      const p1 = pts[segIdx + 1];
      const u = p0[0] + (p1[0] - p0[0]) * rawSegFrac;
      const v = p0[1] + (p1[1] - p0[1]) * rawSegFrac;

      const isTurnaround = distFromVertex < 0.28;
      trajectory.push({
        progress: globalProgress,
        localT,
        letterIndex: lIdx,
        letterId: letter.id,
        u,
        v,
        speedFactor,
        depositionDensity,
        isTurnaround,
      });
    }
  }
  return trajectory;
}

/**
 * Evaluates the exact piecewise-linear separator curve in normalized UV space [0, 1] x [0, 1]
 * returning the letter index (0 = 'D', 1 = 'O1', 2 = 'O2', 3 = 'M') with 0 misclassified pixels
 * for tags/1DOOMTAG.jpeg.
 */
export function resolveLogoPixelLetterIndex(u, v) {
  const yPx = Math.max(0, Math.min(1184, v * 1184.0));
  const xPx = u * 3514.0;

  // Piecewise linear dividers verified against tags/1DOOMTAG.jpeg connected components
  let d1 = 1247.0;
  if (yPx < 350.0) {
    d1 = 1170.0 + ((yPx - 250.0) / 100.0) * 39.0;
  } else if (yPx < 650.0) {
    d1 = 1209.0 + ((yPx - 350.0) / 300.0) * 44.0;
  } else {
    d1 = 1253.0 + ((yPx - 650.0) / 300.0) * 29.0;
  }

  let d2 = 1730.0;
  if (yPx < 550.0) {
    d2 = 1760.0 - ((yPx - 250.0) / 300.0) * 44.0;
  } else {
    d2 = 1716.0 + ((yPx - 550.0) / 400.0) * 123.0;
  }

  let d3 = 2280.0;
  if (yPx < 450.0) {
    d3 = 2288.0 - ((yPx - 250.0) / 200.0) * 139.0;
  } else if (yPx < 750.0) {
    d3 = 2149.0 + ((yPx - 450.0) / 300.0) * 205.0;
  } else {
    d3 = 2354.0 + ((yPx - 750.0) / 250.0) * 30.0;
  }

  if (xPx < d1) return 0;
  if (xPx < d2) return 1;
  if (xPx < d3) return 2;
  return 3;
}

/**
 * Evaluates the exact 5-region piecewise-linear separator curve in normalized UV space [0, 1] x [0, 1]
 * returning the region index (0 = 'D', 1 = 'O1', 2 = 'O2', 3 = 'M', 4 = 'ARCADE') with 0 misclassified
 * pixels across all 1,277,006 ink pixels of platodoomarcade.jpeg (Spec 046 §3.2).
 */
export function resolveArcadeLogoPixelLetterIndex(u, v) {
  const xPx = u * 3514.0;
  const yPx = Math.max(0.0, Math.min(1184.0, v * 1184.0));
  const yArcade = xPx < 1410.0 ? 826.0 : 795.0;
  if (yPx >= yArcade) {
    return 4;
  }

  let d1 = 1368.0;
  if (yPx < 180.0) {
    d1 = 1330.0 + ((yPx - 100.0) / 80.0) * 20.0;
  } else if (yPx < 240.0) {
    d1 = 1350.0 + ((yPx - 180.0) / 60.0) * 18.0;
  } else if (yPx < 460.0) {
    d1 = 1368.0 + ((yPx - 240.0) / 220.0) * 27.0;
  } else if (yPx < 660.0) {
    d1 = 1395.0 + ((yPx - 460.0) / 200.0) * 16.0;
  } else {
    d1 = 1411.0 + ((yPx - 660.0) / 140.0) * 30.0;
  }

  let d2 = 1760.0;
  if (yPx < 220.0) {
    d2 = 1780.0 - ((yPx - 100.0) / 120.0) * 16.0;
  } else if (yPx < 360.0) {
    d2 = 1764.0 - ((yPx - 220.0) / 140.0) * 24.0;
  } else if (yPx < 520.0) {
    d2 = 1740.0 + ((yPx - 360.0) / 160.0) * 20.0;
  } else if (yPx < 640.0) {
    d2 = 1760.0 + ((yPx - 520.0) / 120.0) * 42.0;
  } else {
    d2 = 1802.0 + ((yPx - 640.0) / 140.0) * 50.0;
  }

  let d3 = 2188.0;
  if (yPx < 155.0) {
    d3 = 2205.0 - ((yPx - 100.0) / 55.0) * 35.0;
  } else if (yPx < 215.0) {
    d3 = 2170.0 - ((yPx - 155.0) / 60.0) * 102.0;
  } else if (yPx < 350.0) {
    d3 = 2068.0 - ((yPx - 215.0) / 135.0) * 6.0;
  } else if (yPx < 480.0) {
    d3 = 2062.0 + ((yPx - 350.0) / 130.0) * 126.0;
  } else if (yPx < 660.0) {
    d3 = 2188.0 + ((yPx - 480.0) / 180.0) * 30.0;
  } else {
    d3 = 2218.0 + ((yPx - 660.0) / 140.0) * 40.0;
  }

  if (xPx < d1) return 0;
  if (xPx < d2) return 1;
  if (xPx < d3) return 2;
  return 3;
}

/**
 * Procedural Web Audio Synthesizer reproducing the acoustic profile of spray.mp4 (§4.1–§4.2)
 */
export class SprayPaintAudioEngine {
  constructor(options = {}) {
    this.enabled = options.audioEnabled !== false;
    this.volume = Number.isFinite(options.volume) ? Math.max(0, Math.min(1, options.volume)) : 0.8;
    this.ctx = null;
    this.masterGain = null;
    this.noiseBuffer = null;
    this.hissSource = null;
    this.hissGain = null;
    this.hissBandpass = null;
    this.isHissing = false;
    this.userUnlocked = false;
    this.destroyed = false;

    this._unlockHandler = () => {
      this.userUnlocked = true;
      this.unlock();
    };
    if (typeof window !== 'undefined') {
      window.addEventListener('pointerdown', this._unlockHandler, { passive: true });
      window.addEventListener('keydown', this._unlockHandler, { passive: true });
    }
  }

  _ensureContext() {
    if (!this.enabled || !this.userUnlocked || this.destroyed || typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return null;
      try {
        this.ctx = new AudioCtx();
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.value = this.volume;
        this.masterGain.connect(this.ctx.destination);
        this._buildNoiseBuffer();
      } catch (_err) {
        return null;
      }
    }
    return this.ctx;
  }

  _buildNoiseBuffer() {
    if (!this.ctx) return;
    const sampleRate = this.ctx.sampleRate;
    const length = sampleRate * 2;
    const buffer = this.ctx.createBuffer(1, length, sampleRate);
    const data = buffer.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0;
    for (let i = 0; i < length; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99765 * b0 + white * 0.0990460;
      b1 = 0.96300 * b1 + white * 0.2965164;
      b2 = 0.57000 * b2 + white * 1.0526913;
      data[i] = (b0 + b1 + b2 + white * 0.35) * 0.22;
    }
    this.noiseBuffer = buffer;
  }

  unlock() {
    this.userUnlocked = true;
    const ctx = this._ensureContext();
    if (ctx && ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }
  }

  setVolume(val) {
    this.volume = Math.max(0, Math.min(1, Number(val) || 0));
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(this.enabled ? this.volume : 0, this.ctx.currentTime, 0.015);
    }
  }

  setEnabled(flag) {
    this.enabled = Boolean(flag);
    if (!this.enabled) {
      this.stopSprayHiss();
    }
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(this.enabled ? this.volume : 0, this.ctx.currentTime, 0.015);
    }
  }

  /**
   * Fires a metallic mixing-ball rattle burst (540ms, 720ms, 980ms, 1140ms in spray.mp4)
   */
  triggerCanShakeRattle(burstIndex = 0) {
    const ctx = this._ensureContext();
    if (!ctx || !this.enabled || ctx.state !== 'running') return;

    try {
      const now = ctx.currentTime;
      // Primary strike + secondary bounce 32ms later
      const offsets = [0, 0.032];
      offsets.forEach((offset, idx) => {
        const t = now + offset;
        const amp = (idx === 0 ? 0.55 : 0.32) * (0.9 + 0.1 * (burstIndex % 2));

        if (this.noiseBuffer) {
          const noise = ctx.createBufferSource();
          noise.buffer = this.noiseBuffer;
          const bp = ctx.createBiquadFilter();
          bp.type = 'bandpass';
          bp.frequency.setValueAtTime(2800 + idx * 450, t);
          bp.Q.setValueAtTime(8.0, t);

          const env = ctx.createGain();
          env.gain.setValueAtTime(0.001, t);
          env.gain.linearRampToValueAtTime(amp, t + 0.004);
          env.gain.exponentialRampToValueAtTime(0.001, t + 0.045);

          noise.connect(bp);
          bp.connect(env);
          env.connect(this.masterGain);
          noise.start(t);
          noise.stop(t + 0.05);
        }

        // Metallic resonance ping (f ≈ 4200 Hz)
        const osc = ctx.createOscillator();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(4200 + (burstIndex * 90), t);
        const pingGain = ctx.createGain();
        pingGain.gain.setValueAtTime(amp * 0.35, t);
        pingGain.gain.exponentialRampToValueAtTime(0.0005, t + 0.055);

        osc.connect(pingGain);
        pingGain.connect(this.masterGain);
        osc.start(t);
        osc.stop(t + 0.06);
      });
    } catch (_err) {
      // Ignore audio scheduling errors in restricted environments
    }
  }

  /**
   * Fires the mechanical valve cap pop click (~1660ms in spray.mp4)
   */
  triggerValveClick() {
    const ctx = this._ensureContext();
    if (!ctx || !this.enabled || ctx.state !== 'running') return;

    try {
      const t = ctx.currentTime;
      if (this.noiseBuffer) {
        const noise = ctx.createBufferSource();
        noise.buffer = this.noiseBuffer;
        const bp = ctx.createBiquadFilter();
        bp.type = 'bandpass';
        bp.frequency.setValueAtTime(1950, t);
        bp.Q.setValueAtTime(4.5, t);

        const env = ctx.createGain();
        env.gain.setValueAtTime(0.001, t);
        env.gain.linearRampToValueAtTime(0.85, t + 0.002);
        env.gain.exponentialRampToValueAtTime(0.001, t + 0.022);

        noise.connect(bp);
        bp.connect(env);
        env.connect(this.masterGain);
        noise.start(t);
        noise.stop(t + 0.025);
      }
    } catch (_err) {}
  }

  /**
   * Starts or modulates the continuous aerosol hiss (2039ms–3075ms)
   */
  startOrModulateSprayHiss(velocityFactor = 1.0) {
    const ctx = this._ensureContext();
    if (!ctx || !this.enabled || ctx.state !== 'running' || !this.noiseBuffer) return;

    try {
      const now = ctx.currentTime;
      if (!this.isHissing) {
        this.hissSource = ctx.createBufferSource();
        this.hissSource.buffer = this.noiseBuffer;
        this.hissSource.loop = true;

        this.hissBandpass = ctx.createBiquadFilter();
        this.hissBandpass.type = 'bandpass';
        this.hissBandpass.frequency.setValueAtTime(3500, now);
        this.hissBandpass.Q.setValueAtTime(2.5, now);

        this.hissGain = ctx.createGain();
        this.hissGain.gain.setValueAtTime(0.001, now);

        this.hissSource.connect(this.hissBandpass);
        this.hissBandpass.connect(this.hissGain);
        this.hissGain.connect(this.masterGain);
        this.hissSource.start(now);
        this.isHissing = true;
      }

      const clampedVel = Math.max(0.2, Math.min(1.5, velocityFactor));
      const targetFreq = 3200 + clampedVel * 650;
      const targetGain = 0.28 + clampedVel * 0.22;
      this.hissBandpass.frequency.setTargetAtTime(targetFreq, now, 0.02);
      this.hissGain.gain.setTargetAtTime(targetGain, now, 0.02);
    } catch (_err) {}
  }

  stopSprayHiss() {
    if (!this.isHissing || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      if (this.hissGain) {
        this.hissGain.gain.setTargetAtTime(0.0001, now, 0.015);
      }
      const src = this.hissSource;
      setTimeout(() => {
        try {
          if (src) src.stop();
          if (src) src.disconnect();
        } catch (_e) {}
      }, 60);
    } catch (_err) {}
    this.hissSource = null;
    this.hissGain = null;
    this.hissBandpass = null;
    this.isHissing = false;
  }

  destroy() {
    this.destroyed = true;
    this.stopSprayHiss();
    if (typeof window !== 'undefined') {
      window.removeEventListener('pointerdown', this._unlockHandler);
      window.removeEventListener('keydown', this._unlockHandler);
    }
    if (this.ctx && this.ctx.state !== 'closed') {
      this.ctx.close().catch(() => {});
    }
    this.ctx = null;
  }
}

// ============================================================================
// WebGL2 Shaders
// ============================================================================

const STAMP_VERTEX_SHADER = `#version 300 es
precision highp float;

layout(location = 0) in vec2 a_quadCorner;   // [-1, 1] x [-1, 1]
layout(location = 1) in vec2 a_centerUV;     // [0, 1] x [0, 1] in logo space
layout(location = 2) in vec2 a_radiusUV;     // (rx, ry) in UV space
layout(location = 3) in float a_density;     // paint deposition scalar
layout(location = 4) in float a_seed;        // pseudo-random seed for aerosol speckle

out vec2 v_localPos;
out vec2 v_uv;
out float v_density;
out float v_seed;

void main() {
  v_localPos = a_quadCorner;
  v_uv = a_centerUV + a_quadCorner * a_radiusUV;
  v_density = a_density;
  v_seed = a_seed;
  // Convert UV [0, 1] to clip space [-1, 1]
  vec2 clip = v_uv * 2.0 - 1.0;
  gl_Position = vec4(clip, 0.0, 1.0);
}
`;

const STAMP_FRAGMENT_SHADER = `#version 300 es
precision highp float;

in vec2 v_localPos;
in vec2 v_uv;
in float v_density;
in float v_seed;

out vec4 outColor;

float hash21(vec2 p) {
  p = fract(p * vec2(234.34, 435.345));
  p += dot(p, p + 34.23);
  return fract(p.x * p.y);
}

void main() {
  float r = length(v_localPos);
  if (r > 1.0) discard;

  // High-frequency aerosol speckle noise around the fat-cap periphery
  vec2 noiseCoord = floor(v_uv * vec2(850.0, 290.0)) + vec2(v_seed * 17.3, v_seed * 31.7);
  float n = hash21(noiseCoord);
  float fineSpeckle = hash21(floor(v_uv * vec2(1750.0, 590.0)));

  // Soft Gaussian-like core + feathered aerosol outer ring
  float core = smoothstep(0.92, 0.12, r);
  float edgeFeather = smoothstep(1.0, 0.45, r) * step(0.32, n);
  float aerosolAlpha = clamp((core * 0.85 + edgeFeather * 0.45) * v_density, 0.0, 1.0);

  // Permanent micro-splatter (overspray flecks 1px-3px outside the core along outer ring)
  float oversprayRing = smoothstep(0.55, 0.82, r) * smoothstep(1.0, 0.84, r);
  float isFleck = step(0.968, fineSpeckle) * oversprayRing;

  outColor = vec4(aerosolAlpha, isFleck * 0.95, 0.0, 1.0);
}
`;

const COMPOSITE_VERTEX_SHADER = `#version 300 es
precision highp float;

layout(location = 0) in vec2 a_position; // [-1, 1] fullscreen quad
out vec2 v_screenUV;

void main() {
  v_screenUV = a_position * 0.5 + 0.5;
  gl_Position = vec4(a_position, 0.0, 1.0);
}
`;

const COMPOSITE_FRAGMENT_SHADER = `#version 300 es
precision highp float;

in vec2 v_screenUV;

uniform sampler2D u_logoTex;
uniform sampler2D u_maskTex;
uniform vec4 u_logoRect;          // (minX, minY, width, height) in normalized screen UV
uniform vec3 u_bgColor;           // default (0, 0, 0)
uniform float u_progress;         // current rendered progress [0, 1]
uniform float u_oversprayScale;   // [0, 1]
uniform float u_masterOpacity;    // [0, 1] for Stage 5 dissolve fade-out
uniform vec2 u_nozzleUV;          // active nozzle (u, v)
uniform float u_mistActive;       // [0, 1] active nozzle vapor glow
uniform int u_profileMode;        // 0 = 1DOOMTAG (4 regions), 1 = PLATODOOMARCADE (5 regions)

out vec4 fragColor;

float hash21(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

int getLetterId(vec2 uv) {
  float yPx = clamp(uv.y * 1184.0, 0.0, 1184.0);
  float xPx = uv.x * 3514.0;

  if (u_profileMode == 1) {
    float yArcade = (xPx < 1410.0) ? 826.0 : 795.0;
    if (yPx >= yArcade) {
      return 4;
    }

    float d1 = 1368.0;
    if (yPx < 180.0) {
      d1 = 1330.0 + ((yPx - 100.0) / 80.0) * 20.0;
    } else if (yPx < 240.0) {
      d1 = 1350.0 + ((yPx - 180.0) / 60.0) * 18.0;
    } else if (yPx < 460.0) {
      d1 = 1368.0 + ((yPx - 240.0) / 220.0) * 27.0;
    } else if (yPx < 660.0) {
      d1 = 1395.0 + ((yPx - 460.0) / 200.0) * 16.0;
    } else {
      d1 = 1411.0 + ((yPx - 660.0) / 140.0) * 30.0;
    }

    float d2 = 1760.0;
    if (yPx < 220.0) {
      d2 = 1780.0 - ((yPx - 100.0) / 120.0) * 16.0;
    } else if (yPx < 360.0) {
      d2 = 1764.0 - ((yPx - 220.0) / 140.0) * 24.0;
    } else if (yPx < 520.0) {
      d2 = 1740.0 + ((yPx - 360.0) / 160.0) * 20.0;
    } else if (yPx < 640.0) {
      d2 = 1760.0 + ((yPx - 520.0) / 120.0) * 42.0;
    } else {
      d2 = 1802.0 + ((yPx - 640.0) / 140.0) * 50.0;
    }

    float d3 = 2188.0;
    if (yPx < 155.0) {
      d3 = 2205.0 - ((yPx - 100.0) / 55.0) * 35.0;
    } else if (yPx < 215.0) {
      d3 = 2170.0 - ((yPx - 155.0) / 60.0) * 102.0;
    } else if (yPx < 350.0) {
      d3 = 2068.0 - ((yPx - 215.0) / 135.0) * 6.0;
    } else if (yPx < 480.0) {
      d3 = 2062.0 + ((yPx - 350.0) / 130.0) * 126.0;
    } else if (yPx < 660.0) {
      d3 = 2188.0 + ((yPx - 480.0) / 180.0) * 30.0;
    } else {
      d3 = 2218.0 + ((yPx - 660.0) / 140.0) * 40.0;
    }

    if (xPx < d1) return 0;
    if (xPx < d2) return 1;
    if (xPx < d3) return 2;
    return 3;
  }

  float d1 = 1247.0;
  if (yPx < 350.0) {
    d1 = 1170.0 + ((yPx - 250.0) / 100.0) * 39.0;
  } else if (yPx < 650.0) {
    d1 = 1209.0 + ((yPx - 350.0) / 300.0) * 44.0;
  } else {
    d1 = 1253.0 + ((yPx - 650.0) / 300.0) * 29.0;
  }

  float d2 = 1730.0;
  if (yPx < 550.0) {
    d2 = 1760.0 - ((yPx - 250.0) / 300.0) * 44.0;
  } else {
    d2 = 1716.0 + ((yPx - 550.0) / 400.0) * 123.0;
  }

  float d3 = 2280.0;
  if (yPx < 450.0) {
    d3 = 2288.0 - ((yPx - 250.0) / 200.0) * 139.0;
  } else if (yPx < 750.0) {
    d3 = 2149.0 + ((yPx - 450.0) / 300.0) * 205.0;
  } else {
    d3 = 2354.0 + ((yPx - 750.0) / 250.0) * 30.0;
  }

  if (xPx < d1) return 0;
  if (xPx < d2) return 1;
  if (xPx < d3) return 2;
  return 3;
}

void main() {
  // Flip screen Y so top of image is at top of canvas
  vec2 screenUV = vec2(v_screenUV.x, 1.0 - v_screenUV.y);

  // Map screenUV into logo UV space
  vec2 logoUV = (screenUV - u_logoRect.xy) / max(u_logoRect.zw, vec2(0.0001));

  if (logoUV.x < -0.06 || logoUV.x > 1.06 || logoUV.y < -0.08 || logoUV.y > 1.08 || u_progress <= 0.0001) {
    fragColor = vec4(u_bgColor, 1.0);
    return;
  }

  vec2 clampedUV = clamp(logoUV, 0.0, 1.0);
  bool insideLogoBounds = (logoUV.x >= 0.0 && logoUV.x <= 1.0 && logoUV.y >= 0.0 && logoUV.y <= 1.0);

  vec4 maskSample = insideLogoBounds ? texture(u_maskTex, clampedUV) : vec4(0.0);
  float sprayAccum = clamp(maskSample.r, 0.0, 1.0);
  float oversprayFleck = clamp(maskSample.g, 0.0, 1.0);

  float stencilAlpha = 0.0;
  vec3 cleanLogoRgb = vec3(0.0);

  if (insideLogoBounds) {
    vec4 rawTex = texture(u_logoTex, clampedUV);
    float luma = dot(rawTex.rgb, vec3(0.299, 0.587, 0.114));

    // Strip white background, counter-holes (D, O1, O2), and negative-space PLATO cutouts
    stencilAlpha = smoothstep(182.0 / 255.0, 96.0 / 255.0, luma);

    // Edge matte defringing (unpremultiply white background to eliminate any white/pink halo)
    vec3 unwhite = (rawTex.rgb - vec3(1.0 - stencilAlpha)) / max(stencilAlpha, 0.001);
    vec3 edgeDefringed = clamp(unwhite, vec3(0.0), min(rawTex.rgb, vec3(0.40, 0.14, 0.14)));
    cleanLogoRgb = mix(edgeDefringed, rawTex.rgb, smoothstep(0.60, 0.96, stencilAlpha));
  }

  int letterId = getLetterId(clampedUV);
  float letterStart = 0.0;
  float letterEnd = 0.25;
  if (u_profileMode == 1) {
    // 5-Region PLATODOOMARCADE intervals: D=[0.00, 0.20], O1=[0.20, 0.38], O2=[0.38, 0.56], M=[0.56, 0.78], ARCADE=[0.78, 1.00]
    letterStart = 0.0;
    letterEnd = 0.20;
    if (letterId == 1) {
      letterStart = 0.20;
      letterEnd = 0.38;
    } else if (letterId == 2) {
      letterStart = 0.38;
      letterEnd = 0.56;
    } else if (letterId == 3) {
      letterStart = 0.56;
      letterEnd = 0.78;
    } else if (letterId == 4) {
      letterStart = 0.78;
      letterEnd = 1.00;
    }
  } else {
    // 4-Region 1DOOMTAG intervals: D=[0.00, 0.25], O1=[0.25, 0.46], O2=[0.46, 0.71], M=[0.71, 1.00]
    if (letterId == 1) {
      letterStart = 0.25;
      letterEnd = 0.46;
    } else if (letterId == 2) {
      letterStart = 0.46;
      letterEnd = 0.71;
    } else if (letterId == 3) {
      letterStart = 0.71;
      letterEnd = 1.00;
    }
  }

  float letterGate = step(letterStart + 0.0005, u_progress);
  float letterCompleteLock = smoothstep(letterEnd - 0.018, letterEnd, u_progress);

  // Guarantee 100% pinhole-free coverage as each letter completes and at progress == 1.0
  float effectiveReveal = clamp(max(sprayAccum, letterCompleteLock) * letterGate, 0.0, 1.0);
  if (u_progress >= 0.999) {
    effectiveReveal = 1.0;
  }

  float finalLogoAlpha = stencilAlpha * effectiveReveal;

  // Permanent micro-splatter (overspray flecks outside stencil contour against #000000)
  float distToContour = (1.0 - stencilAlpha);
  // Also procedural micro-flecks near painted regions
  float procNoise = hash21(floor(clampedUV * vec2(1400.0, 480.0)));
  float nearSprayBand = smoothstep(0.02, 0.35, sprayAccum) * (1.0 - smoothstep(0.75, 0.98, stencilAlpha));
  float procFleck = step(0.982, procNoise) * nearSprayBand * letterGate;
  float totalOverspray = max(oversprayFleck * letterGate, procFleck) * distToContour * u_oversprayScale;

  vec3 oversprayColor = vec3(0.42, 0.11, 0.11);

  // Active nozzle transient mist halo
  vec2 nozzleDelta = (logoUV - u_nozzleUV) * vec2(2.968, 1.0);
  float nozzleDist = length(nozzleDelta);
  float nozzleMist = exp(-nozzleDist * nozzleDist * 38.0) * 0.26 * u_mistActive;
  vec3 mistColor = vec3(0.56, 0.14, 0.15);

  vec3 composite = u_bgColor;
  composite = mix(composite, oversprayColor, clamp(totalOverspray, 0.0, 1.0));
  composite = mix(composite, cleanLogoRgb, finalLogoAlpha);
  composite += mistColor * nozzleMist;

  // Apply Stage 5 dissolve fade-out
  composite = mix(u_bgColor, composite, clamp(u_masterOpacity, 0.0, 1.0));

  fragColor = vec4(composite, 1.0);
}
`;

const MIST_PARTICLE_VERTEX_SHADER = `#version 300 es
precision highp float;

layout(location = 0) in vec2 a_corner;   // [-1, 1]
layout(location = 1) in vec2 a_uvPos;    // [0, 1] in logo space
layout(location = 2) in float a_radius;  // radius in normalized height
layout(location = 3) in float a_alpha;   // particle opacity

uniform vec4 u_logoRect;

out vec2 v_local;
out float v_alpha;

void main() {
  v_local = a_corner;
  v_alpha = a_alpha;
  vec2 screenUV = u_logoRect.xy + a_uvPos * u_logoRect.zw;
  vec2 aspectRadius = vec2(a_radius * (u_logoRect.w / max(u_logoRect.z, 0.001)) * 0.35, a_radius);
  vec2 posUV = screenUV + a_corner * aspectRadius;
  // Flip Y back to clip space
  vec2 clip = vec2(posUV.x * 2.0 - 1.0, (1.0 - posUV.y) * 2.0 - 1.0);
  gl_Position = vec4(clip, 0.0, 1.0);
}
`;

const MIST_PARTICLE_FRAGMENT_SHADER = `#version 300 es
precision highp float;

in vec2 v_local;
in float v_alpha;

out vec4 fragColor;

void main() {
  float r = length(v_local);
  if (r > 1.0) discard;
  float soft = pow(1.0 - r, 2.2);
  vec3 vaporColor = vec3(0.58, 0.13, 0.14);
  fragColor = vec4(vaporColor * soft * v_alpha, soft * v_alpha);
}
`;

function compileShader(gl, type, source) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const info = gl.getShaderInfoLog(shader);
    gl.deleteShader(shader);
    throw new Error(`SprayPaintLoader shader compile error: ${info}`);
  }
  return shader;
}

function createProgram(gl, vsSource, fsSource) {
  const vs = compileShader(gl, gl.VERTEX_SHADER, vsSource);
  const fs = compileShader(gl, gl.FRAGMENT_SHADER, fsSource);
  const prog = gl.createProgram();
  gl.attachShader(prog, vs);
  gl.attachShader(prog, fs);
  gl.linkProgram(prog);
  gl.deleteShader(vs);
  gl.deleteShader(fs);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
    const info = gl.getProgramInfoLog(prog);
    gl.deleteProgram(prog);
    throw new Error(`SprayPaintLoader program link error: ${info}`);
  }
  return prog;
}

// ============================================================================
// Main SprayPaintLoader Controller Class (§6)
// ============================================================================

export class SprayPaintLoader {
  constructor(options = {}) {
    if (!options || !options.canvas || !(options.canvas instanceof HTMLCanvasElement)) {
      throw new Error('SprayPaintLoader requires a valid HTMLCanvasElement in options.canvas.');
    }

    this.canvas = options.canvas;
    this.logoSource = options.logoSource || SPRAY_DEFAULT_OPTIONS.logoSource;
    this.isArcadeProfile = isArcadeLogoProfile(this.logoSource, options.profile);
    this.letterSpecs = this.isArcadeProfile ? SPRAY_ARCADE_LETTER_SPECS : SPRAY_LETTER_SPECS;
    this.timelineSpec = this.isArcadeProfile ? SPRAY_ARCADE_TIMELINE_SPEC : SPRAY_PAINT_TIMELINE_SPEC;
    this.mode = options.mode === 'autoplay' ? 'autoplay' : 'deterministic';
    this.duration = Number.isFinite(options.duration) && options.duration > 0
      ? options.duration
      : SPRAY_DEFAULT_OPTIONS.duration;
    this.loop = Boolean(options.loop);
    this.audioEnabled = options.audioEnabled !== undefined ? Boolean(options.audioEnabled) : true;
    this.volume = Number.isFinite(options.volume) ? Math.max(0, Math.min(1, options.volume)) : 0.8;
    this.oversprayIntensity = Number.isFinite(options.oversprayIntensity)
      ? Math.max(0, Math.min(1, options.oversprayIntensity))
      : SPRAY_DEFAULT_OPTIONS.oversprayIntensity;
    this.mistEnabled = options.mistEnabled !== undefined ? Boolean(options.mistEnabled) : true;
    this.backgroundColor = options.backgroundColor || SPRAY_DEFAULT_OPTIONS.backgroundColor;
    this.bgRGB = parseHexColorToRGBNormalized(this.backgroundColor);
    this.minCatchUpRate = Number.isFinite(options.minCatchUpRate) && options.minCatchUpRate > 0
      ? options.minCatchUpRate
      : 0.55;
    this.creditText = options.creditText ? String(options.creditText) : '';
    this.creditElement = options.creditElement || null;

    // Lifecycle Callbacks (§6)
    this.onReady = typeof options.onReady === 'function' ? options.onReady : null;
    this.onShake = typeof options.onShake === 'function' ? options.onShake : null;
    this.onSprayStart = typeof options.onSprayStart === 'function' ? options.onSprayStart : null;
    this.onLetterComplete = typeof options.onLetterComplete === 'function' ? options.onLetterComplete : null;
    this.onPassComplete = typeof options.onPassComplete === 'function' ? options.onPassComplete : null;
    this.onComplete = typeof options.onComplete === 'function' ? options.onComplete : null;
    this.onStageChange = typeof options.onStageChange === 'function' ? options.onStageChange : null;

    // Internal Trajectory & State
    this.trajectory = buildChoreographedNozzleTrajectory(450, this.letterSpecs);
    this.lastStampedIndex = -1;
    this.renderedProgress = 0.0;
    this.targetProgress = 0.0;
    this.masterOpacity = 1.0;
    this.currentStage = 'STAGE_0_BLACKOUT';
    this.nozzleUV = this.isArcadeProfile ? [0.365, 0.120] : [0.31, 0.195];
    this.isSpraying = false;

    this.completedLetters = new Set();
    this.completedPasses = new Set();
    this.firedShakeBursts = new Set();
    this.firedValveClick = false;
    this.firedSprayStart = false;
    this.firedComplete = false;

    this.isReady = false;
    this.isPlaying = false;
    this.isDestroyed = false;
    this.contextLost = false;
    this.autoplayElapsedMs = 0;
    this.deterministicHoldElapsedMs = 0;
    this.lastFrameTimeMs = 0;
    this.rafId = null;

    // Transient Aerosol Mist Particles (lifespan 150ms–400ms)
    this.mistParticles = [];
    this.maxMistParticles = 140;

    // Audio Synthesizer
    this.audioEngine = new SprayPaintAudioEngine({
      audioEnabled: this.audioEnabled,
      volume: this.volume,
    });

    // WebGL2 resources
    this.gl = null;
    this.maskFBO = null;
    this.maskTex = null;
    this.maskWidth = 1757;
    this.maskHeight = 592;
    this.logoTex = null;
    this.logoImage = null;
    this.logoAspect = 3514 / 1184;
    this.logoRect = [0.1, 0.25, 0.8, 0.5];

    this.stampProgram = null;
    this.compositeProgram = null;
    this.mistProgram = null;
    this.quadVBO = null;
    this.stampInstanceVBO = null;
    this.mistInstanceVBO = null;
    this.stampVAO = null;
    this.compositeVAO = null;
    this.mistVAO = null;

    this._boundResize = () => this.resize();
    this._boundContextLost = (e) => this._handleContextLost(e);
    this._boundContextRestored = () => this._handleContextRestored();

    this.canvas.addEventListener('webglcontextlost', this._boundContextLost, false);
    this.canvas.addEventListener('webglcontextrestored', this._boundContextRestored, false);
    if (typeof window !== 'undefined') {
      window.addEventListener('resize', this._boundResize);
    }

    this._initCreditElement();
    this._initWebGL2();
    this.resize();
    this._renderFrame(); // Frame 0 solid black (#000000) immediately
    this._loadLogoAsset(this.logoSource);
  }

  _initCreditElement() {
    if (typeof document === 'undefined') return;
    if (!this.creditElement && this.canvas && this.canvas.parentElement) {
      const existing = this.canvas.parentElement.querySelector('#spray-paint-credit-subtitle');
      if (existing) {
        this.creditElement = existing;
      } else if (this.creditText) {
        const el = document.createElement('div');
        el.id = 'spray-paint-credit-subtitle';
        this.canvas.parentElement.appendChild(el);
        this.creditElement = el;
      }
    }
    if (this.creditElement) {
      if (this.creditText) {
        this.creditElement.textContent = this.creditText;
      } else if (!this.creditText && this.creditElement.textContent) {
        this.creditText = this.creditElement.textContent.trim();
      }
      const s = this.creditElement.style;
      s.position = 'fixed';
      s.transform = 'translateX(-50%)';
      s.pointerEvents = 'none';
      s.userSelect = 'none';
      s.whiteSpace = 'nowrap';
      s.zIndex = '100000';
      if (!s.fontFamily) {
        s.fontFamily = "'Courier New', Courier, monospace";
      }
      if (!s.fontSize) {
        s.fontSize = 'clamp(11px, 1.15vw, 15px)';
      }
      if (!s.letterSpacing) {
        s.letterSpacing = '0.16em';
      }
      if (!s.color) {
        s.color = 'rgba(218, 198, 192, 0.86)';
      }
      if (!s.textShadow) {
        s.textShadow = '0 1px 6px rgba(0, 0, 0, 0.95)';
      }
    }
  }

  _syncCreditPosition() {
    if (!this.creditElement) return;
    const [normX, normY, normW, normH] = this.logoRect;
    // In platodoomarcade.jpeg (3514x1184), "arcade" spans u in [0.3460, 0.6946] (center u = 0.5203)
    // and ends vertically at v = 0.9611. Position credit subtitle directly underneath at v = 0.982.
    const anchorU = this.isArcadeProfile ? 0.5203 : 0.50;
    const anchorV = this.isArcadeProfile ? 0.982 : 0.96;
    const leftPct = (normX + anchorU * normW) * 100.0;
    const topPct = Math.min(96.0, (normY + anchorV * normH) * 100.0);
    this.creditElement.style.left = `${leftPct.toFixed(2)}%`;
    this.creditElement.style.top = `${topPct.toFixed(2)}%`;
    this.creditElement.style.opacity = String(Math.max(0, Math.min(1, this.masterOpacity)));
  }

  _initWebGL2() {
    const gl = this.canvas.getContext('webgl2', {
      alpha: false,
      antialias: true,
      depth: false,
      stencil: false,
      premultipliedAlpha: false,
      preserveDrawingBuffer: true,
    });

    if (!gl) {
      throw new Error('SprayPaintLoader: WebGL2 context unavailable on target canvas.');
    }
    this.gl = gl;

    this.stampProgram = createProgram(gl, STAMP_VERTEX_SHADER, STAMP_FRAGMENT_SHADER);
    this.compositeProgram = createProgram(gl, COMPOSITE_VERTEX_SHADER, COMPOSITE_FRAGMENT_SHADER);
    this.mistProgram = createProgram(gl, MIST_PARTICLE_VERTEX_SHADER, MIST_PARTICLE_FRAGMENT_SHADER);

    // Base unit quad [-1, 1] (2 triangles, 6 vertices)
    const quadVerts = new Float32Array([
      -1, -1,  1, -1, -1,  1,
      -1,  1,  1, -1,  1,  1,
    ]);
    this.quadVBO = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.quadVBO);
    gl.bufferData(gl.ARRAY_BUFFER, quadVerts, gl.STATIC_DRAW);

    // 1. Composite VAO
    this.compositeVAO = gl.createVertexArray();
    gl.bindVertexArray(this.compositeVAO);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.quadVBO);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

    // 2. Stamp Instanced VAO (6 floats per stamp: centerU, centerV, radU, radV, density, seed)
    this.stampVAO = gl.createVertexArray();
    gl.bindVertexArray(this.stampVAO);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.quadVBO);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

    this.stampInstanceVBO = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.stampInstanceVBO);
    gl.bufferData(gl.ARRAY_BUFFER, this.trajectory.length * 6 * 4, gl.DYNAMIC_DRAW);

    const stride = 6 * 4;
    gl.enableVertexAttribArray(1);
    gl.vertexAttribPointer(1, 2, gl.FLOAT, false, stride, 0);
    gl.vertexAttribDivisor(1, 1);

    gl.enableVertexAttribArray(2);
    gl.vertexAttribPointer(2, 2, gl.FLOAT, false, stride, 8);
    gl.vertexAttribDivisor(2, 1);

    gl.enableVertexAttribArray(3);
    gl.vertexAttribPointer(3, 1, gl.FLOAT, false, stride, 16);
    gl.vertexAttribDivisor(3, 1);

    gl.enableVertexAttribArray(4);
    gl.vertexAttribPointer(4, 1, gl.FLOAT, false, stride, 20);
    gl.vertexAttribDivisor(4, 1);

    // 3. Mist Particle Instanced VAO (4 floats per particle: u, v, radius, alpha)
    this.mistVAO = gl.createVertexArray();
    gl.bindVertexArray(this.mistVAO);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.quadVBO);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

    this.mistInstanceVBO = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.mistInstanceVBO);
    gl.bufferData(gl.ARRAY_BUFFER, this.maxMistParticles * 4 * 4, gl.DYNAMIC_DRAW);

    const mistStride = 4 * 4;
    gl.enableVertexAttribArray(1);
    gl.vertexAttribPointer(1, 2, gl.FLOAT, false, mistStride, 0);
    gl.vertexAttribDivisor(1, 1);

    gl.enableVertexAttribArray(2);
    gl.vertexAttribPointer(2, 1, gl.FLOAT, false, mistStride, 8);
    gl.vertexAttribDivisor(2, 1);

    gl.enableVertexAttribArray(3);
    gl.vertexAttribPointer(3, 1, gl.FLOAT, false, mistStride, 12);
    gl.vertexAttribDivisor(3, 1);

    gl.bindVertexArray(null);

    // Offscreen Accumulation Mask FBO
    this.maskTex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, this.maskTex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, this.maskWidth, this.maskHeight, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    this.maskFBO = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.maskFBO);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.maskTex, 0);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);

    if (this.logoImage) {
      this._uploadLogoTexture(this.logoImage);
    }
  }

  _uploadLogoTexture(imgSource) {
    if (!this.gl || this.contextLost) return;
    const gl = this.gl;
    if (this.logoTex) {
      gl.deleteTexture(this.logoTex);
    }
    this.logoTex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, this.logoTex);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, imgSource);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.bindTexture(gl.TEXTURE_2D, null);
  }

  _loadLogoAsset(source) {
    if (typeof ImageBitmap !== 'undefined' && source instanceof ImageBitmap) {
      this._finalizeLogoLoad(source);
      return;
    }
    if (typeof HTMLImageElement !== 'undefined' && source instanceof HTMLImageElement && source.complete) {
      this._finalizeLogoLoad(source);
      return;
    }

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      if (this.isDestroyed) return;
      this._finalizeLogoLoad(img);
    };
    img.onerror = () => {
      if (this.isDestroyed) return;
      if (this.isArcadeProfile) {
        if (source !== '../platodoomarcade.jpeg' && source !== 'platodoomarcade.jpeg') {
          this._loadLogoAsset('../platodoomarcade.jpeg');
        } else if (source === '../platodoomarcade.jpeg') {
          this._loadLogoAsset('platodoomarcade.jpeg');
        }
      } else if (source !== 'tags/1DOOMTAG.jpeg') {
        this._loadLogoAsset('tags/1DOOMTAG.jpeg');
      }
    };
    img.src = String(source);
  }

  _finalizeLogoLoad(imgSource) {
    this.logoImage = imgSource;
    const w = imgSource.width || imgSource.naturalWidth || 3514;
    const h = imgSource.height || imgSource.naturalHeight || 1184;
    this.logoAspect = w / Math.max(1, h);
    this._uploadLogoTexture(imgSource);
    this.resize();

    // If progress was already set before texture finished loading, re-stamp and render
    if (this.renderedProgress > 0) {
      this._rebuildMaskUpToProgress(this.renderedProgress);
    }
    this._renderFrame();

    if (!this.isReady) {
      this.isReady = true;
      if (this.onReady) {
        this.onReady();
      }
    }
  }

  _clearMaskFBO() {
    if (!this.gl || !this.maskFBO || this.contextLost) return;
    const gl = this.gl;
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.maskFBO);
    gl.viewport(0, 0, this.maskWidth, this.maskHeight);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    this.lastStampedIndex = -1;
  }

  _stampTrajectoryRange(startIdx, endIdx) {
    if (!this.gl || !this.maskFBO || this.contextLost || endIdx < startIdx) return;
    const gl = this.gl;
    const count = endIdx - startIdx + 1;
    const instanceData = new Float32Array(count * 6);

    // Fat-cap spray cone radius in normalized UV space (~95px in 1184px height -> ry = 0.105, rx = ry / 2.968)
    const baseRadiusV = 0.112;
    const baseRadiusU = baseRadiusV / this.logoAspect;

    for (let i = 0; i < count; i++) {
      const tIdx = startIdx + i;
      const pt = this.trajectory[tIdx];
      const jitter = (seededHash(tIdx) - 0.5) * 0.014;
      const rScale = 0.92 + seededHash(tIdx + 77) * 0.22;
      const offset = i * 6;
      instanceData[offset + 0] = pt.u + jitter * 0.4;
      instanceData[offset + 1] = pt.v + jitter;
      instanceData[offset + 2] = baseRadiusU * rScale;
      instanceData[offset + 3] = baseRadiusV * rScale;
      instanceData[offset + 4] = pt.depositionDensity;
      instanceData[offset + 5] = seededHash(tIdx * 3.17);
    }

    gl.bindFramebuffer(gl.FRAMEBUFFER, this.maskFBO);
    gl.viewport(0, 0, this.maskWidth, this.maskHeight);
    gl.enable(gl.BLEND);
    // Additive accumulation saturated at 1.0
    gl.blendFunc(gl.ONE, gl.ONE);

    gl.useProgram(this.stampProgram);
    gl.bindVertexArray(this.stampVAO);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.stampInstanceVBO);
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, instanceData);

    gl.drawArraysInstanced(gl.TRIANGLES, 0, 6, count);

    gl.bindVertexArray(null);
    gl.disable(gl.BLEND);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  }

  _rebuildMaskUpToProgress(progressVal) {
    this._clearMaskFBO();
    if (progressVal <= 0) return;
    const targetIdx = Math.min(
      this.trajectory.length - 1,
      Math.floor(progressVal * (this.trajectory.length - 1))
    );
    if (targetIdx >= 0) {
      this._stampTrajectoryRange(0, targetIdx);
      this.lastStampedIndex = targetIdx;
      const lastPt = this.trajectory[targetIdx];
      this.nozzleUV = [lastPt.u, lastPt.v];
    }
  }

  _advanceMaskToProgress(newProgress, emitMist = true) {
    const clamped = Math.max(0, Math.min(1, newProgress));
    if (clamped < this.renderedProgress - 1e-5) {
      this.renderedProgress = clamped;
      this._rebuildMaskUpToProgress(clamped);
      return;
    }

    this.renderedProgress = clamped;
    if (clamped <= 0) return;

    const targetIdx = Math.min(
      this.trajectory.length - 1,
      Math.floor(clamped * (this.trajectory.length - 1))
    );

    if (targetIdx > this.lastStampedIndex) {
      const startIdx = Math.max(0, this.lastStampedIndex + 1);
      this._stampTrajectoryRange(startIdx, targetIdx);
      this.lastStampedIndex = targetIdx;

      const currentPt = this.trajectory[targetIdx];
      this.nozzleUV = [currentPt.u, currentPt.v];

      if (emitMist && this.mistEnabled && clamped < 0.999) {
        this._emitMistAtNozzle(currentPt.u, currentPt.v, currentPt.speedFactor);
      }
    }

    this._checkMilestoneCallbacks(clamped);
  }

  _emitMistAtNozzle(u, v, speedFactor = 1.0) {
    const spawnCount = 3;
    for (let i = 0; i < spawnCount; i++) {
      if (this.mistParticles.length >= this.maxMistParticles) {
        this.mistParticles.shift();
      }
      const angle = Math.random() * Math.PI * 2;
      const speed = (0.04 + Math.random() * 0.09) * (0.7 + 0.3 * speedFactor);
      this.mistParticles.push({
        u: u + (Math.random() - 0.5) * 0.02,
        v: v + (Math.random() - 0.5) * 0.04,
        vu: Math.cos(angle) * speed * 0.35,
        vv: Math.sin(angle) * speed - 0.02,
        ageMs: 0,
        lifespanMs: 180 + Math.random() * 210, // 180ms–390ms per §2.1 & §3.4
        baseRadius: 0.045 + Math.random() * 0.035,
        peakAlpha: 0.16 + Math.random() * 0.14,
      });
    }
  }

  _updateMistParticles(dtMs) {
    if (this.mistParticles.length === 0) return;
    for (let i = this.mistParticles.length - 1; i >= 0; i--) {
      const p = this.mistParticles[i];
      p.ageMs += dtMs;
      if (p.ageMs >= p.lifespanMs) {
        this.mistParticles.splice(i, 1);
      } else {
        const dtSec = dtMs * 0.001;
        p.u += p.vu * dtSec;
        p.v += p.vv * dtSec;
      }
    }
  }

  _checkMilestoneCallbacks(progressVal) {
    if (progressVal > 0.001 && !this.firedSprayStart) {
      this.firedSprayStart = true;
      if (this.onSprayStart) {
        this.onSprayStart();
      }
    }

    for (let i = 0; i < this.letterSpecs.length; i++) {
      const spec = this.letterSpecs[i];
      if (progressVal >= spec.progressEnd - 0.001) {
        if (!this.completedPasses.has(i)) {
          this.completedPasses.add(i);
          if (this.onPassComplete) {
            this.onPassComplete(i);
          }
        }
        if (!this.completedLetters.has(spec.id)) {
          this.completedLetters.add(spec.id);
          if (this.onLetterComplete) {
            this.onLetterComplete(i, spec.id);
          }
        }
      }
    }
  }

  _setStage(nextStage) {
    if (this.currentStage !== nextStage) {
      this.currentStage = nextStage;
      if (this.onStageChange) {
        this.onStageChange(nextStage);
      }
    }
  }

  _renderFrame() {
    if (!this.gl || this.contextLost || this.isDestroyed) return;
    const gl = this.gl;

    if (this.creditElement) {
      this.creditElement.style.opacity = String(Math.max(0, Math.min(1, this.masterOpacity)));
    }

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    gl.clearColor(this.bgRGB[0], this.bgRGB[1], this.bgRGB[2], 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    if (!this.logoTex || this.renderedProgress <= 0.0001) {
      return;
    }

    // 1. Main Composite Pass (Stencil Logo + Accumulated Spray Mask + Overspray Flecks)
    gl.useProgram(this.compositeProgram);
    gl.bindVertexArray(this.compositeVAO);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.logoTex);
    gl.uniform1i(gl.getUniformLocation(this.compositeProgram, 'u_logoTex'), 0);

    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, this.maskTex);
    gl.uniform1i(gl.getUniformLocation(this.compositeProgram, 'u_maskTex'), 1);

    gl.uniform4fv(gl.getUniformLocation(this.compositeProgram, 'u_logoRect'), this.logoRect);
    gl.uniform3fv(gl.getUniformLocation(this.compositeProgram, 'u_bgColor'), this.bgRGB);
    gl.uniform1f(gl.getUniformLocation(this.compositeProgram, 'u_progress'), this.renderedProgress);
    gl.uniform1f(gl.getUniformLocation(this.compositeProgram, 'u_oversprayScale'), this.oversprayIntensity);
    gl.uniform1f(gl.getUniformLocation(this.compositeProgram, 'u_masterOpacity'), this.masterOpacity);
    gl.uniform2fv(gl.getUniformLocation(this.compositeProgram, 'u_nozzleUV'), this.nozzleUV);
    gl.uniform1i(gl.getUniformLocation(this.compositeProgram, 'u_profileMode'), this.isArcadeProfile ? 1 : 0);
    gl.uniform1f(
      gl.getUniformLocation(this.compositeProgram, 'u_mistActive'),
      this.mistEnabled && this.isSpraying && this.renderedProgress > 0.001 && this.renderedProgress < 0.998 ? 1.0 : 0.0
    );

    gl.drawArrays(gl.TRIANGLES, 0, 6);

    // 2. Transient Aerosol Mist Particle Pass
    if (this.mistEnabled && this.mistParticles.length > 0 && this.masterOpacity > 0.01) {
      const count = Math.min(this.mistParticles.length, this.maxMistParticles);
      const mistData = new Float32Array(count * 4);
      for (let i = 0; i < count; i++) {
        const p = this.mistParticles[i];
        const lifeT = Math.max(0, Math.min(1, p.ageMs / p.lifespanMs));
        const envelope = Math.sin(lifeT * Math.PI);
        const radius = p.baseRadius * (1.0 + lifeT * 1.15);
        const alpha = p.peakAlpha * (1.0 - lifeT) * envelope * this.masterOpacity;
        mistData[i * 4 + 0] = p.u;
        mistData[i * 4 + 1] = p.v;
        mistData[i * 4 + 2] = radius;
        mistData[i * 4 + 3] = alpha;
      }

      gl.enable(gl.BLEND);
      gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
      gl.useProgram(this.mistProgram);
      gl.bindVertexArray(this.mistVAO);
      gl.uniform4fv(gl.getUniformLocation(this.mistProgram, 'u_logoRect'), this.logoRect);

      gl.bindBuffer(gl.ARRAY_BUFFER, this.mistInstanceVBO);
      gl.bufferSubData(gl.ARRAY_BUFFER, 0, mistData);
      gl.drawArraysInstanced(gl.TRIANGLES, 0, 6, count);
      gl.disable(gl.BLEND);
    }

    gl.bindVertexArray(null);
  }

  _stepAutoplayTimeline(dtMs) {
    const scale = 6500 / Math.max(500, this.duration);
    this.autoplayElapsedMs += dtMs * scale;
    const t = this.autoplayElapsedMs;
    const spec = this.timelineSpec;

    if (t < spec.blackoutEndMs) {
      this._setStage('STAGE_0_BLACKOUT');
      this.isSpraying = false;
      this.masterOpacity = 1.0;
    } else if (t < spec.shakeEndMs) {
      this._setStage('STAGE_1_SHAKE_PREROLL');
      this.isSpraying = false;
      for (let i = 0; i < spec.shakeBurstsMs.length; i++) {
        if (t >= spec.shakeBurstsMs[i] && !this.firedShakeBursts.has(i)) {
          this.firedShakeBursts.add(i);
          this.audioEngine.triggerCanShakeRattle(i);
          if (this.onShake) this.onShake(i);
        }
      }
    } else if (t < spec.sprayStartMs) {
      this._setStage('STAGE_2_VALVE_ENGAGE');
      this.isSpraying = false;
      if (t >= spec.valveClickMs && !this.firedValveClick) {
        this.firedValveClick = true;
        this.audioEngine.triggerValveClick();
      }
    } else if (t <= spec.sprayEndMs) {
      this._setStage('STAGE_3_ACTIVE_SPRAY');
      // Map t across the passes (with realistic brief turnaround pauses between passes)
      let mappedProgress = 0.0;
      let activelyEmitting = false;
      for (let i = 0; i < spec.passes.length; i++) {
        const pass = spec.passes[i];
        if (t >= pass.endMs) {
          mappedProgress = pass.progressEnd;
        } else if (t >= pass.startMs) {
          const frac = (t - pass.startMs) / Math.max(1, pass.endMs - pass.startMs);
          mappedProgress = pass.progressStart + frac * (pass.progressEnd - pass.progressStart);
          activelyEmitting = true;
          break;
        } else {
          break;
        }
      }
      this.isSpraying = activelyEmitting;
      this.targetProgress = mappedProgress;
      this._advanceMaskToProgress(mappedProgress, activelyEmitting);
      if (activelyEmitting) {
        this.audioEngine.startOrModulateSprayHiss(1.0);
      } else {
        this.audioEngine.startOrModulateSprayHiss(0.25);
      }
    } else if (t <= spec.holdEndMs) {
      this._setStage('STAGE_4_SHOWCASE_HOLD');
      this.isSpraying = false;
      this.audioEngine.stopSprayHiss();
      if (this.renderedProgress < 1.0) {
        this.targetProgress = 1.0;
        this._advanceMaskToProgress(1.0, false);
      }
      this.masterOpacity = 1.0;
      if (!this.firedComplete && this.mistParticles.length === 0) {
        this.firedComplete = true;
        if (this.onComplete) this.onComplete();
      }
    } else if (t <= spec.fadeEndMs) {
      this._setStage('STAGE_5_FADE_DISSOLVE');
      this.isSpraying = false;
      this.audioEngine.stopSprayHiss();
      const fadeFrac = (t - spec.holdEndMs) / Math.max(1, spec.fadeEndMs - spec.holdEndMs);
      this.masterOpacity = Math.max(0, 1.0 - fadeFrac);
    } else {
      this.isSpraying = false;
      this.audioEngine.stopSprayHiss();
      this.masterOpacity = 0.0;
      if (!this.firedComplete) {
        this.firedComplete = true;
        if (this.onComplete) this.onComplete();
      }
      if (this.loop) {
        this.reset();
        this.play();
        return;
      } else {
        this.pause();
      }
    }
  }

  _stepDeterministicTimeline(dtMs) {
    const delta = this.targetProgress - this.renderedProgress;
    if (Math.abs(delta) > 0.0002) {
      this._setStage('STAGE_3_ACTIVE_SPRAY');
      this.isSpraying = true;
      // Adaptive catch-up buffering (§5.2): smoothly catches up within ~550ms without teleporting
      const minRate = this.minCatchUpRate; // progress units per second
      const adaptiveRate = Math.max(minRate, Math.abs(delta) * 2.6);
      const stepAmount = Math.min(Math.abs(delta), adaptiveRate * (dtMs * 0.001));
      const nextProg = this.renderedProgress + Math.sign(delta) * stepAmount;
      this._advanceMaskToProgress(nextProg, true);
      this.audioEngine.startOrModulateSprayHiss(Math.min(1.4, adaptiveRate));
    } else {
      if (this.renderedProgress !== this.targetProgress) {
        this._advanceMaskToProgress(this.targetProgress, false);
      }
      this.isSpraying = false;
      this.audioEngine.stopSprayHiss();

      if (this.renderedProgress >= 0.999) {
        this._setStage('STAGE_4_SHOWCASE_HOLD');
        this.deterministicHoldElapsedMs += dtMs;
        if (!this.firedComplete && this.mistParticles.length === 0) {
          this.firedComplete = true;
          if (this.onComplete) this.onComplete();
        }
      } else if (this.renderedProgress <= 0.0001) {
        this._setStage('STAGE_0_BLACKOUT');
      }
    }
  }

  _tick(nowMs) {
    if (!this.isPlaying || this.isDestroyed) return;
    const dtMs = this.lastFrameTimeMs > 0 ? Math.min(100, Math.max(1, nowMs - this.lastFrameTimeMs)) : 16.67;
    this.lastFrameTimeMs = nowMs;

    if (this.mode === 'autoplay') {
      this._stepAutoplayTimeline(dtMs);
    } else {
      this._stepDeterministicTimeline(dtMs);
    }

    this._updateMistParticles(dtMs);
    this._renderFrame();

    if (this.isPlaying && !this.isDestroyed) {
      this.rafId = requestAnimationFrame((t) => this._tick(t));
    }
  }

  // ==========================================================================
  // Public Imperative API (§6)
  // ==========================================================================

  /**
   * Sets target completion progress [0.0, 1.0].
   * When paused or when options.immediate === true, synchronously stamps all intermediate
   * segments and renders immediately. When playing in deterministic mode, smoothly catches up.
   */
  setProgress(value, options = {}) {
    if (this.isDestroyed) return;
    const clamped = Math.max(0.0, Math.min(1.0, Number(value) || 0.0));
    this.targetProgress = clamped;
    this.masterOpacity = 1.0;

    const immediate = Boolean(options && options.immediate) || !this.isPlaying;
    if (immediate) {
      const prevProg = this.renderedProgress;
      this.isSpraying = clamped > 0.001 && clamped < 0.999;
      this._advanceMaskToProgress(clamped, this.isSpraying && clamped > prevProg);
      if (clamped <= 0.0001) {
        this._setStage('STAGE_0_BLACKOUT');
        this.mistParticles.length = 0;
      } else if (clamped >= 0.999) {
        this._setStage('STAGE_4_SHOWCASE_HOLD');
        this.isSpraying = false;
        if (!this.firedComplete) {
          this.firedComplete = true;
          if (this.onComplete) this.onComplete();
        }
      } else {
        this._setStage('STAGE_3_ACTIVE_SPRAY');
      }
      this._renderFrame();
    }
  }

  /**
   * Synchronous scrub helper for deterministic frame inspection at any progress [0.0, 1.0].
   */
  scrubTo(value) {
    this.setProgress(value, { immediate: true });
  }

  play() {
    if (this.isDestroyed || this.isPlaying) return;
    this.isPlaying = true;
    this.lastFrameTimeMs = typeof performance !== 'undefined' ? performance.now() : 0;
    this.rafId = requestAnimationFrame((t) => this._tick(t));
  }

  pause() {
    this.isPlaying = false;
    this.isSpraying = false;
    this.audioEngine.stopSprayHiss();
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  reset() {
    if (this.isDestroyed) return;
    this.pause();
    this.renderedProgress = 0.0;
    this.targetProgress = 0.0;
    this.masterOpacity = 1.0;
    this.autoplayElapsedMs = 0;
    this.deterministicHoldElapsedMs = 0;
    this.isSpraying = false;
    this.nozzleUV = this.isArcadeProfile ? [0.365, 0.120] : [0.31, 0.195];
    this.mistParticles.length = 0;

    this.completedLetters.clear();
    this.completedPasses.clear();
    this.firedShakeBursts.clear();
    this.firedValveClick = false;
    this.firedSprayStart = false;
    this.firedComplete = false;

    this._setStage('STAGE_0_BLACKOUT');
    this._clearMaskFBO();
    this._renderFrame();
  }

  resize(width, height) {
    if (this.isDestroyed) return;
    const dpr = typeof window !== 'undefined'
      ? Math.min(window.devicePixelRatio || 1, 2.0)
      : 1.0;

    const cssWidth = width || this.canvas.clientWidth || (typeof window !== 'undefined' ? window.innerWidth : 1280);
    const cssHeight = height || this.canvas.clientHeight || (typeof window !== 'undefined' ? window.innerHeight : 720);

    const pixelW = Math.max(1, Math.round(cssWidth * dpr));
    const pixelH = Math.max(1, Math.round(cssHeight * dpr));

    if (this.canvas.width !== pixelW || this.canvas.height !== pixelH) {
      this.canvas.width = pixelW;
      this.canvas.height = pixelH;
    }

    // Object-fit: contain with >= 12% safety padding on all 4 sides (§5 & §7)
    const pad = 0.12;
    const availW = Math.max(1, pixelW * (1.0 - pad * 2.0));
    const availH = Math.max(1, pixelH * (1.0 - pad * 2.0));
    const availAspect = availW / availH;

    let drawW, drawH;
    if (availAspect > this.logoAspect) {
      drawH = availH;
      drawW = drawH * this.logoAspect;
    } else {
      drawW = availW;
      drawH = drawW / this.logoAspect;
    }

    const normW = drawW / pixelW;
    const normH = drawH / pixelH;
    const normX = (1.0 - normW) * 0.5;
    const normY = (1.0 - normH) * 0.5;
    this.logoRect = [normX, normY, normW, normH];

    this._syncCreditPosition();
    this._renderFrame();
  }

  destroy() {
    if (this.isDestroyed) return;
    this.pause();
    this.isDestroyed = true;

    this.canvas.removeEventListener('webglcontextlost', this._boundContextLost);
    this.canvas.removeEventListener('webglcontextrestored', this._boundContextRestored);
    if (typeof window !== 'undefined') {
      window.removeEventListener('resize', this._boundResize);
    }

    if (this.audioEngine) {
      this.audioEngine.destroy();
    }

    if (this.gl && !this.contextLost) {
      const gl = this.gl;
      if (this.logoTex) gl.deleteTexture(this.logoTex);
      if (this.maskTex) gl.deleteTexture(this.maskTex);
      if (this.maskFBO) gl.deleteFramebuffer(this.maskFBO);
      if (this.quadVBO) gl.deleteBuffer(this.quadVBO);
      if (this.stampInstanceVBO) gl.deleteBuffer(this.stampInstanceVBO);
      if (this.mistInstanceVBO) gl.deleteBuffer(this.mistInstanceVBO);
      if (this.stampVAO) gl.deleteVertexArray(this.stampVAO);
      if (this.compositeVAO) gl.deleteVertexArray(this.compositeVAO);
      if (this.mistVAO) gl.deleteVertexArray(this.mistVAO);
      if (this.stampProgram) gl.deleteProgram(this.stampProgram);
      if (this.compositeProgram) gl.deleteProgram(this.compositeProgram);
      if (this.mistProgram) gl.deleteProgram(this.mistProgram);
    }
    this.gl = null;
  }

  _handleContextLost(event) {
    event.preventDefault();
    this.contextLost = true;
    this.pause();
  }

  _handleContextRestored() {
    if (this.isDestroyed) return;
    this.contextLost = false;
    this._initWebGL2();
    this.resize();
    this._rebuildMaskUpToProgress(this.renderedProgress);
    this._renderFrame();
  }

  /**
   * Diagnostic telemetry snapshot for runtime verification & automated tests
   */
  getState() {
    return {
      isReady: this.isReady,
      isPlaying: this.isPlaying,
      mode: this.mode,
      profile: this.isArcadeProfile ? 'platodoomarcade' : '1doomtag',
      creditText: this.creditText,
      stage: this.currentStage,
      renderedProgress: Number(this.renderedProgress.toFixed(4)),
      targetProgress: Number(this.targetProgress.toFixed(4)),
      masterOpacity: Number(this.masterOpacity.toFixed(4)),
      nozzleUV: [...this.nozzleUV],
      completedLetters: Array.from(this.completedLetters),
      completedPasses: Array.from(this.completedPasses),
      activeMistParticles: this.mistParticles.length,
      logoRect: [...this.logoRect],
      canvasSize: { width: this.canvas.width, height: this.canvas.height },
    };
  }

  /**
   * Samples pixel telemetry from the live WebGL2 framebuffer in a normalized logo UV box
   * [uMin, vMin, uMax, vMax] to verify visual acceptance criteria (§8).
   */
  sampleLogoRegionTelemetry(uMin, vMin, uMax, vMax) {
    if (!this.gl || this.contextLost) return null;
    const gl = this.gl;
    const [rx, ry, rw, rh] = this.logoRect;
    const cw = this.canvas.width;
    const ch = this.canvas.height;

    const sx0 = Math.max(0, Math.min(cw - 1, Math.floor((rx + uMin * rw) * cw)));
    const sx1 = Math.max(sx0 + 1, Math.min(cw, Math.ceil((rx + uMax * rw) * cw)));
    const syTop = Math.max(0, Math.min(ch - 1, Math.floor((ry + vMin * rh) * ch)));
    const syBot = Math.max(syTop + 1, Math.min(ch, Math.ceil((ry + vMax * rh) * ch)));

    // Convert top-down Y to WebGL bottom-up Y
    const glY0 = Math.max(0, ch - syBot);
    const w = Math.max(1, sx1 - sx0);
    const h = Math.max(1, syBot - syTop);

    const buf = new Uint8Array(w * h * 4);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.readPixels(sx0, glY0, w, h, gl.RGBA, gl.UNSIGNED_BYTE, buf);

    let nonBlackPixels = 0;
    let maroonPixels = 0;
    let whiteFringePixels = 0;
    const totalPixels = w * h;

    for (let i = 0; i < buf.length; i += 4) {
      const r = buf[i];
      const g = buf[i + 1];
      const b = buf[i + 2];
      if (r > 8 || g > 8 || b > 8) {
        nonBlackPixels++;
      }
      if (r > 35 && r > g * 1.4 && g < 110) {
        maroonPixels++;
      }
      if (r > 180 && g > 170 && b > 170) {
        whiteFringePixels++;
      }
    }

    return {
      totalPixels,
      nonBlackPixels,
      maroonPixels,
      whiteFringePixels,
      nonBlackRatio: nonBlackPixels / totalPixels,
      maroonRatio: maroonPixels / totalPixels,
    };
  }
}

export function createSprayPaintLoader(options) {
  return new SprayPaintLoader(options);
}
