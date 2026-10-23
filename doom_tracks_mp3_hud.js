/**
 * doom_tracks_mp3_hud.js
 *
 * Interactive "DOOM TRACKS" (SYS-990-AMBER // AUDIO SYSTEM v2) Cyber-Industrial MP3 Deck Component
 * Governed by functional_specification_035.md and assets/mp3.jpeg (2752 x 1536).
 *
 * Key Invariants:
 * 1. Exact visual fidelity to assets/mp3.jpeg (2752 x 1536):
 *    - Border-connected exterior white background removal around the chamfered octagonal chassis.
 *    - Top-center nameplate "TECHNO-AUDIO" occluded with seamless gradient inpainting and
 *      replaced with "DOOM TRACKS" in identical extended techno-industrial #ffa51d typography
 *      while preserving the upper (y = 150) and lower (y = 216) horizontal accent rules.
 * 2. 100% live 60 FPS Amber OLED display screen (x: 26.67%..73.33%, y: 22.92%..47.14%):
 *    - Dynamic transport status icon & banner (▶ PLAYING, ❚❚ PAUSED, ■ STOPPED).
 *    - Scrolling marquee track title inside fixed « ... » delimiters.
 *    - Interactive seek/progress bar proportional to currentTime / duration.
 *    - Spinning optical CD sprite extracted from assets/mp3.jpeg.
 *    - Real-time Web Audio AnalyserNode oscilloscope waveform / spectrum / dual-pulse trace.
 *    - Animated dual-reel cassette tape hubs.
 *    - Live MM:SS digital clock readout under TIME ELAPSED.
 *    - Interactive 10-segment rising VOLUME bar meter synced with window.__sandbox.audio.
 *    - Reactive 8x5 dot-matrix frequency grid + bitrate (128 KBPS) + MP3 / STEREO telemetry.
 * 3. Interactive Hardware Buttons & Switches (Zero End-User Upload UI, Static Rotary Dials):
 *    - 7 bottom transport buttons: PLAY, PAUSE, STOP, REPEAT/CYCLE, PREV, NEXT, PLAYBACK (tracklist selector).
 *    - 2 mid-deck slide switches: SHUFFLE, LOOP / VISUALS.
 *    - 4 rotary dials remain purely decorative (pointer-events: none).
 */

export const MP3_NATIVE_WIDTH = 2752;
export const MP3_NATIVE_HEIGHT = 1536;

export const MP3_CHASSIS_CROP = Object.freeze({
  x: 396,
  y: 114,
  w: 1960,
  h: 1308,
});

export const MP3_SCREEN_ONLY_CROP = Object.freeze({
  x: 722,
  y: 338,
  w: 1308,
  h: 396,
});

export const MP3_PALETTE = Object.freeze({
  primaryAmber: '#ffa51d',
  coreNeonAmber: '#ff9c0b',
  warmSecondaryAmber: '#e58d21',
  dimSegmentAmber: '#4a2c0d',
  gridLineAmber: '#6e4214',
  nameplateCharcoal: '#1c170f',
  nameplateBevelEdge: '#896239',
  oledUpperSubstrate: '#2e1b0a',
  oledCoreSubstrate: '#271604',
  casingRustBronze: '#ac5c18',
  casingDeepObsidian: '#16100b',
});

export const DOOM_TRACKS_DEFAULT_CATALOG = Object.freeze([
  Object.freeze({
    id: '01_doom_alloy_intro',
    title: 'DOOM ALLOY // INTRO',
    src: 'assets/tracks/01_doom_alloy_intro.mp3',
    duration: 32,
    bitrateKbps: 128,
    format: 'MP3 / STEREO',
  }),
  Object.freeze({
    id: '02_sys990_amber_pulse',
    title: 'SYS-990 AMBER PULSE',
    src: 'assets/tracks/02_sys990_amber_pulse.mp3',
    duration: 36,
    bitrateKbps: 128,
    format: 'MP3 / STEREO',
  }),
  Object.freeze({
    id: '03_freeman_alley_cipher',
    title: 'FREEMAN ALLEY CIPHER',
    src: 'assets/tracks/03_freeman_alley_cipher.mp3',
    duration: 40,
    bitrateKbps: 128,
    format: 'MP3 / STEREO',
  }),
  Object.freeze({
    id: '04_iron_mask_dub',
    title: 'IRON MASK DUB v2',
    src: 'assets/tracks/04_iron_mask_dub.mp3',
    duration: 34,
    bitrateKbps: 128,
    format: 'MP3 / STEREO',
  }),
]);

export const MP3_CONTROL_HIT_ZONES = Object.freeze([
  Object.freeze({
    id: 'BTN_PLAY',
    key: 'play',
    label: 'PLAY',
    px: { x1: 698, y1: 1042, x2: 863, y2: 1245 },
    capPx: { x1: 710, y1: 1042, x2: 855, y2: 1196 },
  }),
  Object.freeze({
    id: 'BTN_PAUSE',
    key: 'pause',
    label: 'PAUSE',
    px: { x1: 888, y1: 1042, x2: 1049, y2: 1245 },
    capPx: { x1: 896, y1: 1042, x2: 1042, y2: 1196 },
  }),
  Object.freeze({
    id: 'BTN_STOP',
    key: 'stop',
    label: 'STOP',
    px: { x1: 1058, y1: 1042, x2: 1217, y2: 1245 },
    capPx: { x1: 1066, y1: 1042, x2: 1210, y2: 1196 },
  }),
  Object.freeze({
    id: 'BTN_REPEAT',
    key: 'repeat',
    label: 'REPEAT / CYCLE',
    px: { x1: 1238, y1: 1042, x2: 1396, y2: 1245 },
    capPx: { x1: 1244, y1: 1042, x2: 1390, y2: 1196 },
  }),
  Object.freeze({
    id: 'BTN_PREV',
    key: 'prev',
    label: 'PREV',
    px: { x1: 1445, y1: 1042, x2: 1609, y2: 1245 },
    capPx: { x1: 1452, y1: 1042, x2: 1602, y2: 1196 },
  }),
  Object.freeze({
    id: 'BTN_NEXT',
    key: 'next',
    label: 'NEXT',
    px: { x1: 1634, y1: 1042, x2: 1799, y2: 1245 },
    capPx: { x1: 1642, y1: 1042, x2: 1792, y2: 1196 },
  }),
  Object.freeze({
    id: 'BTN_PLAYBACK',
    key: 'playback',
    label: 'PLAYBACK (TRACKLIST)',
    px: { x1: 1854, y1: 1042, x2: 2021, y2: 1245 },
    capPx: { x1: 1862, y1: 1042, x2: 2014, y2: 1196 },
  }),
  Object.freeze({
    id: 'SW_SHUFFLE',
    key: 'shuffle',
    label: 'SHUFFLE',
    px: { x1: 710, y1: 825, x2: 868, y2: 898 },
    capPx: { x1: 719, y1: 855, x2: 859, y2: 894 },
  }),
  Object.freeze({
    id: 'SW_LOOP_VIS',
    key: 'visuals',
    label: 'LOOP / VISUALS',
    px: { x1: 1888, y1: 825, x2: 2046, y2: 898 },
    capPx: { x1: 1897, y1: 855, x2: 2037, y2: 894 },
  }),
]);

export const MP3_SCREEN_HIT_ZONES = Object.freeze({
  progressBar: Object.freeze({ x1: 1368, y1: 452, x2: 2000, y2: 505 }),
  timerReadout: Object.freeze({ x1: 1368, y1: 528, x2: 1655, y2: 635 }),
  volumeMeter: Object.freeze({ x1: 1370, y1: 658, x2: 1682, y2: 702 }),
  titleBanner: Object.freeze({ x1: 1368, y1: 380, x2: 2000, y2: 438 }),
});

// ============================================================================
// Precision Extended Techno-Industrial Vector Glyph Renderer
// ============================================================================

const TECHNO_GLYPH_STROKES = {
  A: (ctx, x, y, w, h, sw) => {
    const pad = sw * 0.45;
    ctx.beginPath();
    ctx.moveTo(x + pad, y + h);
    ctx.lineTo(x + w * 0.38, y + pad);
    ctx.lineTo(x + w * 0.62, y + pad);
    ctx.lineTo(x + w - pad, y + h);
    ctx.moveTo(x + w * 0.2, y + h * 0.66);
    ctx.lineTo(x + w * 0.8, y + h * 0.66);
    ctx.stroke();
  },
  B: (ctx, x, y, w, h, sw) => {
    const pad = sw * 0.5;
    const h2 = h * 0.5;
    ctx.beginPath();
    ctx.moveTo(x + pad, y + pad);
    ctx.lineTo(x + pad, y + h - pad);
    ctx.moveTo(x + pad, y + pad);
    ctx.lineTo(x + w * 0.78, y + pad);
    ctx.lineTo(x + w - pad, y + pad + sw * 0.9);
    ctx.lineTo(x + w - pad, y + h2 - sw * 0.6);
    ctx.lineTo(x + w * 0.78, y + h2);
    ctx.lineTo(x + pad, y + h2);
    ctx.moveTo(x + w * 0.78, y + h2);
    ctx.lineTo(x + w - pad, y + h2 + sw * 0.6);
    ctx.lineTo(x + w - pad, y + h - pad - sw * 0.9);
    ctx.lineTo(x + w * 0.78, y + h - pad);
    ctx.lineTo(x + pad, y + h - pad);
    ctx.stroke();
  },
  C: (ctx, x, y, w, h, sw) => {
    const pad = sw * 0.5;
    const ch = sw * 1.1;
    ctx.beginPath();
    ctx.moveTo(x + w - pad * 0.5, y + pad + ch * 0.45);
    ctx.lineTo(x + w - pad - ch * 0.5, y + pad);
    ctx.lineTo(x + pad + ch, y + pad);
    ctx.lineTo(x + pad, y + pad + ch);
    ctx.lineTo(x + pad, y + h - pad - ch);
    ctx.lineTo(x + pad + ch, y + h - pad);
    ctx.lineTo(x + w - pad - ch * 0.5, y + h - pad);
    ctx.lineTo(x + w - pad * 0.5, y + h - pad - ch * 0.45);
    ctx.stroke();
  },
  D: (ctx, x, y, w, h, sw) => {
    const pad = sw * 0.5;
    const ch = sw * 1.25;
    ctx.beginPath();
    ctx.moveTo(x + pad, y + pad);
    ctx.lineTo(x + w - pad - ch, y + pad);
    ctx.lineTo(x + w - pad, y + pad + ch);
    ctx.lineTo(x + w - pad, y + h - pad - ch);
    ctx.lineTo(x + w - pad - ch, y + h - pad);
    ctx.lineTo(x + pad, y + h - pad);
    ctx.closePath();
    ctx.stroke();
  },
  E: (ctx, x, y, w, h, sw) => {
    const pad = sw * 0.5;
    ctx.beginPath();
    ctx.moveTo(x + w - pad * 0.4, y + pad);
    ctx.lineTo(x + pad, y + pad);
    ctx.lineTo(x + pad, y + h - pad);
    ctx.lineTo(x + w - pad * 0.4, y + h - pad);
    ctx.moveTo(x + pad, y + h * 0.5);
    ctx.lineTo(x + w * 0.84, y + h * 0.5);
    ctx.stroke();
  },
  F: (ctx, x, y, w, h, sw) => {
    const pad = sw * 0.5;
    ctx.beginPath();
    ctx.moveTo(x + w - pad * 0.4, y + pad);
    ctx.lineTo(x + pad, y + pad);
    ctx.lineTo(x + pad, y + h);
    ctx.moveTo(x + pad, y + h * 0.5);
    ctx.lineTo(x + w * 0.82, y + h * 0.5);
    ctx.stroke();
  },
  G: (ctx, x, y, w, h, sw) => {
    const pad = sw * 0.5;
    const ch = sw * 1.1;
    ctx.beginPath();
    ctx.moveTo(x + w - pad, y + pad + ch * 0.45);
    ctx.lineTo(x + w - pad - ch * 0.5, y + pad);
    ctx.lineTo(x + pad + ch, y + pad);
    ctx.lineTo(x + pad, y + pad + ch);
    ctx.lineTo(x + pad, y + h - pad - ch);
    ctx.lineTo(x + pad + ch, y + h - pad);
    ctx.lineTo(x + w - pad - ch * 0.5, y + h - pad);
    ctx.lineTo(x + w - pad, y + h - pad - ch * 0.5);
    ctx.lineTo(x + w - pad, y + h * 0.52);
    ctx.lineTo(x + w * 0.52, y + h * 0.52);
    ctx.stroke();
  },
  H: (ctx, x, y, w, h, sw) => {
    const pad = sw * 0.5;
    ctx.beginPath();
    ctx.moveTo(x + pad, y);
    ctx.lineTo(x + pad, y + h);
    ctx.moveTo(x + w - pad, y);
    ctx.lineTo(x + w - pad, y + h);
    ctx.moveTo(x + pad, y + h * 0.5);
    ctx.lineTo(x + w - pad, y + h * 0.5);
    ctx.stroke();
  },
  I: (ctx, x, y, w, h, _sw) => {
    const cx = x + w * 0.5;
    ctx.beginPath();
    ctx.moveTo(cx, y);
    ctx.lineTo(cx, y + h);
    ctx.stroke();
  },
  J: (ctx, x, y, w, h, sw) => {
    const pad = sw * 0.5;
    const ch = sw * 1.1;
    ctx.beginPath();
    ctx.moveTo(x + w - pad, y);
    ctx.lineTo(x + w - pad, y + h - pad - ch);
    ctx.lineTo(x + w - pad - ch, y + h - pad);
    ctx.lineTo(x + pad + ch, y + h - pad);
    ctx.lineTo(x + pad, y + h - pad - ch);
    ctx.lineTo(x + pad, y + h * 0.68);
    ctx.stroke();
  },
  K: (ctx, x, y, w, h, sw) => {
    const pad = sw * 0.5;
    ctx.beginPath();
    ctx.moveTo(x + pad, y);
    ctx.lineTo(x + pad, y + h);
    ctx.moveTo(x + w - pad * 0.5, y + sw * 0.15);
    ctx.lineTo(x + pad + sw * 1.1, y + h * 0.5);
    ctx.lineTo(x + pad, y + h * 0.5);
    ctx.moveTo(x + pad + sw * 1.2, y + h * 0.48);
    ctx.lineTo(x + w - pad * 0.4, y + h);
    ctx.stroke();
  },
  L: (ctx, x, y, w, h, sw) => {
    const pad = sw * 0.5;
    ctx.beginPath();
    ctx.moveTo(x + pad, y);
    ctx.lineTo(x + pad, y + h - pad);
    ctx.lineTo(x + w - pad * 0.3, y + h - pad);
    ctx.stroke();
  },
  M: (ctx, x, y, w, h, sw) => {
    const pad = sw * 0.5;
    ctx.beginPath();
    ctx.moveTo(x + pad, y + h);
    ctx.lineTo(x + pad, y + pad);
    ctx.lineTo(x + pad + sw * 0.35, y + pad);
    ctx.lineTo(x + w * 0.5, y + h * 0.64);
    ctx.lineTo(x + w - pad - sw * 0.35, y + pad);
    ctx.lineTo(x + w - pad, y + pad);
    ctx.lineTo(x + w - pad, y + h);
    ctx.stroke();
  },
  N: (ctx, x, y, w, h, sw) => {
    const pad = sw * 0.5;
    ctx.beginPath();
    ctx.moveTo(x + pad, y + h);
    ctx.lineTo(x + pad, y + pad);
    ctx.lineTo(x + pad + sw * 0.35, y + pad);
    ctx.lineTo(x + w - pad - sw * 0.35, y + h - pad);
    ctx.lineTo(x + w - pad, y + h - pad);
    ctx.lineTo(x + w - pad, y);
    ctx.stroke();
  },
  O: (ctx, x, y, w, h, sw) => {
    const pad = sw * 0.5;
    const ch = sw * 1.15;
    ctx.beginPath();
    ctx.moveTo(x + pad + ch, y + pad);
    ctx.lineTo(x + w - pad - ch, y + pad);
    ctx.lineTo(x + w - pad, y + pad + ch);
    ctx.lineTo(x + w - pad, y + h - pad - ch);
    ctx.lineTo(x + w - pad - ch, y + h - pad);
    ctx.lineTo(x + pad + ch, y + h - pad);
    ctx.lineTo(x + pad, y + h - pad - ch);
    ctx.lineTo(x + pad, y + pad + ch);
    ctx.closePath();
    ctx.stroke();
  },
  P: (ctx, x, y, w, h, sw) => {
    const pad = sw * 0.5;
    const ch = sw * 0.95;
    const midY = y + h * 0.54;
    ctx.beginPath();
    ctx.moveTo(x + pad, y + h);
    ctx.lineTo(x + pad, y + pad);
    ctx.lineTo(x + w - pad - ch, y + pad);
    ctx.lineTo(x + w - pad, y + pad + ch);
    ctx.lineTo(x + w - pad, midY - ch);
    ctx.lineTo(x + w - pad - ch, midY);
    ctx.lineTo(x + pad, midY);
    ctx.stroke();
  },
  Q: (ctx, x, y, w, h, sw) => {
    TECHNO_GLYPH_STROKES.O(ctx, x, y, w, h, sw);
    ctx.beginPath();
    ctx.moveTo(x + w * 0.58, y + h * 0.62);
    ctx.lineTo(x + w, y + h + sw * 0.2);
    ctx.stroke();
  },
  R: (ctx, x, y, w, h, sw) => {
    const pad = sw * 0.5;
    const ch = sw * 0.95;
    const midY = y + h * 0.53;
    ctx.beginPath();
    ctx.moveTo(x + pad, y + h);
    ctx.lineTo(x + pad, y + pad);
    ctx.lineTo(x + w - pad - ch, y + pad);
    ctx.lineTo(x + w - pad, y + pad + ch);
    ctx.lineTo(x + w - pad, midY - ch);
    ctx.lineTo(x + w - pad - ch, midY);
    ctx.lineTo(x + pad, midY);
    ctx.moveTo(x + w * 0.58, midY);
    ctx.lineTo(x + w - pad * 0.45, y + h);
    ctx.stroke();
  },
  S: (ctx, x, y, w, h, sw) => {
    const pad = sw * 0.5;
    const ch = sw * 0.95;
    const midY = y + h * 0.5;
    ctx.beginPath();
    ctx.moveTo(x + w - pad * 0.5, y + pad + ch * 0.4);
    ctx.lineTo(x + w - pad - ch, y + pad);
    ctx.lineTo(x + pad + ch, y + pad);
    ctx.lineTo(x + pad, y + pad + ch);
    ctx.lineTo(x + pad, midY - ch * 0.6);
    ctx.lineTo(x + pad + ch, midY);
    ctx.lineTo(x + w - pad - ch, midY);
    ctx.lineTo(x + w - pad, midY + ch * 0.6);
    ctx.lineTo(x + w - pad, y + h - pad - ch);
    ctx.lineTo(x + w - pad - ch, y + h - pad);
    ctx.lineTo(x + pad + ch, y + h - pad);
    ctx.lineTo(x + pad * 0.5, y + h - pad - ch * 0.4);
    ctx.stroke();
  },
  T: (ctx, x, y, w, h, sw) => {
    const pad = sw * 0.5;
    const cx = x + w * 0.5;
    ctx.beginPath();
    ctx.moveTo(x, y + pad);
    ctx.lineTo(x + w, y + pad);
    ctx.moveTo(cx, y + pad);
    ctx.lineTo(cx, y + h);
    ctx.stroke();
  },
  U: (ctx, x, y, w, h, sw) => {
    const pad = sw * 0.5;
    const ch = sw * 1.15;
    ctx.beginPath();
    ctx.moveTo(x + pad, y);
    ctx.lineTo(x + pad, y + h - pad - ch);
    ctx.lineTo(x + pad + ch, y + h - pad);
    ctx.lineTo(x + w - pad - ch, y + h - pad);
    ctx.lineTo(x + w - pad, y + h - pad - ch);
    ctx.lineTo(x + w - pad, y);
    ctx.stroke();
  },
  V: (ctx, x, y, w, h, sw) => {
    const pad = sw * 0.5;
    ctx.beginPath();
    ctx.moveTo(x + pad, y);
    ctx.lineTo(x + w * 0.44, y + h - pad);
    ctx.lineTo(x + w * 0.56, y + h - pad);
    ctx.lineTo(x + w - pad, y);
    ctx.stroke();
  },
  W: (ctx, x, y, w, h, sw) => {
    const pad = sw * 0.5;
    ctx.beginPath();
    ctx.moveTo(x + pad * 0.5, y);
    ctx.lineTo(x + w * 0.24, y + h - pad);
    ctx.lineTo(x + w * 0.5, y + h * 0.35);
    ctx.lineTo(x + w * 0.76, y + h - pad);
    ctx.lineTo(x + w - pad * 0.5, y);
    ctx.stroke();
  },
  X: (ctx, x, y, w, h, sw) => {
    const pad = sw * 0.4;
    ctx.beginPath();
    ctx.moveTo(x + pad, y + pad);
    ctx.lineTo(x + w - pad, y + h - pad);
    ctx.moveTo(x + w - pad, y + pad);
    ctx.lineTo(x + pad, y + h - pad);
    ctx.stroke();
  },
  Y: (ctx, x, y, w, h, sw) => {
    const pad = sw * 0.5;
    const cx = x + w * 0.5;
    const midY = y + h * 0.52;
    ctx.beginPath();
    ctx.moveTo(x + pad, y);
    ctx.lineTo(cx, midY);
    ctx.lineTo(x + w - pad, y);
    ctx.moveTo(cx, midY);
    ctx.lineTo(cx, y + h);
    ctx.stroke();
  },
  Z: (ctx, x, y, w, h, sw) => {
    const pad = sw * 0.5;
    ctx.beginPath();
    ctx.moveTo(x + pad, y + pad);
    ctx.lineTo(x + w - pad, y + pad);
    ctx.lineTo(x + pad, y + h - pad);
    ctx.lineTo(x + w - pad, y + h - pad);
    ctx.stroke();
  },
  0: (ctx, x, y, w, h, sw) => {
    TECHNO_GLYPH_STROKES.O(ctx, x, y, w, h, sw);
  },
  1: (ctx, x, y, w, h, sw) => {
    const pad = sw * 0.5;
    const cx = x + w * 0.58;
    ctx.beginPath();
    ctx.moveTo(x + w * 0.22, y + pad + sw * 0.9);
    ctx.lineTo(cx - sw * 0.3, y + pad);
    ctx.lineTo(cx, y + pad);
    ctx.lineTo(cx, y + h);
    ctx.stroke();
  },
  2: (ctx, x, y, w, h, sw) => {
    const pad = sw * 0.5;
    const ch = sw * 0.95;
    const midY = y + h * 0.5;
    ctx.beginPath();
    ctx.moveTo(x + pad, y + pad + ch * 0.7);
    ctx.lineTo(x + pad + ch, y + pad);
    ctx.lineTo(x + w - pad - ch, y + pad);
    ctx.lineTo(x + w - pad, y + pad + ch);
    ctx.lineTo(x + w - pad, midY - ch * 0.7);
    ctx.lineTo(x + w - pad - ch, midY);
    ctx.lineTo(x + pad + ch, midY);
    ctx.lineTo(x + pad, midY + ch * 0.7);
    ctx.lineTo(x + pad, y + h - pad);
    ctx.lineTo(x + w - pad, y + h - pad);
    ctx.stroke();
  },
  3: (ctx, x, y, w, h, sw) => {
    const pad = sw * 0.5;
    const ch = sw * 0.95;
    const midY = y + h * 0.5;
    ctx.beginPath();
    ctx.moveTo(x + pad, y + pad);
    ctx.lineTo(x + w - pad - ch, y + pad);
    ctx.lineTo(x + w - pad, y + pad + ch);
    ctx.lineTo(x + w - pad, midY - ch * 0.7);
    ctx.lineTo(x + w - pad - ch, midY);
    ctx.lineTo(x + w * 0.28, midY);
    ctx.moveTo(x + w - pad - ch, midY);
    ctx.lineTo(x + w - pad, midY + ch * 0.7);
    ctx.lineTo(x + w - pad, y + h - pad - ch);
    ctx.lineTo(x + w - pad - ch, y + h - pad);
    ctx.lineTo(x + pad, y + h - pad);
    ctx.stroke();
  },
  4: (ctx, x, y, w, h, sw) => {
    const pad = sw * 0.5;
    const stemX = x + w * 0.72;
    const barY = y + h * 0.64;
    ctx.beginPath();
    ctx.moveTo(stemX, y + h);
    ctx.lineTo(stemX, y + pad);
    ctx.lineTo(x + pad, barY);
    ctx.lineTo(x + w - pad * 0.3, barY);
    ctx.stroke();
  },
  5: (ctx, x, y, w, h, sw) => {
    const pad = sw * 0.5;
    const ch = sw * 0.95;
    const midY = y + h * 0.48;
    ctx.beginPath();
    ctx.moveTo(x + w - pad, y + pad);
    ctx.lineTo(x + pad, y + pad);
    ctx.lineTo(x + pad, midY);
    ctx.lineTo(x + w - pad - ch, midY);
    ctx.lineTo(x + w - pad, midY + ch);
    ctx.lineTo(x + w - pad, y + h - pad - ch);
    ctx.lineTo(x + w - pad - ch, y + h - pad);
    ctx.lineTo(x + pad + ch, y + h - pad);
    ctx.lineTo(x + pad, y + h - pad - ch * 0.6);
    ctx.stroke();
  },
  6: (ctx, x, y, w, h, sw) => {
    const pad = sw * 0.5;
    const ch = sw * 0.95;
    const midY = y + h * 0.5;
    ctx.beginPath();
    ctx.moveTo(x + w - pad - ch * 0.5, y + pad);
    ctx.lineTo(x + pad + ch, y + pad);
    ctx.lineTo(x + pad, y + pad + ch);
    ctx.lineTo(x + pad, y + h - pad - ch);
    ctx.lineTo(x + pad + ch, y + h - pad);
    ctx.lineTo(x + w - pad - ch, y + h - pad);
    ctx.lineTo(x + w - pad, y + h - pad - ch);
    ctx.lineTo(x + w - pad, midY + ch);
    ctx.lineTo(x + w - pad - ch, midY);
    ctx.lineTo(x + pad, midY);
    ctx.stroke();
  },
  7: (ctx, x, y, w, h, sw) => {
    const pad = sw * 0.5;
    ctx.beginPath();
    ctx.moveTo(x + pad, y + pad);
    ctx.lineTo(x + w - pad, y + pad);
    ctx.lineTo(x + w * 0.42, y + h);
    ctx.stroke();
  },
  8: (ctx, x, y, w, h, sw) => {
    const pad = sw * 0.5;
    const ch = sw * 0.9;
    const midY = y + h * 0.5;
    ctx.beginPath();
    ctx.moveTo(x + pad + ch, y + pad);
    ctx.lineTo(x + w - pad - ch, y + pad);
    ctx.lineTo(x + w - pad, y + pad + ch);
    ctx.lineTo(x + w - pad, midY - ch * 0.6);
    ctx.lineTo(x + w - pad - ch, midY);
    ctx.lineTo(x + pad + ch, midY);
    ctx.lineTo(x + pad, midY - ch * 0.6);
    ctx.lineTo(x + pad, y + pad + ch);
    ctx.closePath();
    ctx.moveTo(x + pad + ch, midY);
    ctx.lineTo(x + pad, midY + ch * 0.6);
    ctx.lineTo(x + pad, y + h - pad - ch);
    ctx.lineTo(x + pad + ch, y + h - pad);
    ctx.lineTo(x + w - pad - ch, y + h - pad);
    ctx.lineTo(x + w - pad, y + h - pad - ch);
    ctx.lineTo(x + w - pad, midY + ch * 0.6);
    ctx.lineTo(x + w - pad - ch, midY);
    ctx.stroke();
  },
  9: (ctx, x, y, w, h, sw) => {
    const pad = sw * 0.5;
    const ch = sw * 0.95;
    const midY = y + h * 0.52;
    ctx.beginPath();
    ctx.moveTo(x + w - pad, midY);
    ctx.lineTo(x + pad + ch, midY);
    ctx.lineTo(x + pad, midY - ch);
    ctx.lineTo(x + pad, y + pad + ch);
    ctx.lineTo(x + pad + ch, y + pad);
    ctx.lineTo(x + w - pad - ch, y + pad);
    ctx.lineTo(x + w - pad, y + pad + ch);
    ctx.lineTo(x + w - pad, y + h - pad - ch);
    ctx.lineTo(x + w - pad - ch, y + h - pad);
    ctx.lineTo(x + pad + ch * 0.5, y + h - pad);
    ctx.stroke();
  },
  '-': (ctx, x, y, w, h, _sw) => {
    ctx.beginPath();
    ctx.moveTo(x + w * 0.15, y + h * 0.5);
    ctx.lineTo(x + w * 0.85, y + h * 0.5);
    ctx.stroke();
  },
  '/': (ctx, x, y, w, h, sw) => {
    const pad = sw * 0.3;
    ctx.beginPath();
    ctx.moveTo(x + w * 0.18, y + h - pad);
    ctx.lineTo(x + w * 0.82, y + pad);
    ctx.stroke();
  },
  ':': (ctx, x, y, w, h, sw) => {
    const s = Math.max(4, sw * 1.05);
    const cx = x + (w - s) * 0.5;
    ctx.fillRect(cx, y + h * 0.22, s, s);
    ctx.fillRect(cx, y + h * 0.68, s, s);
  },
  '.': (ctx, x, y, w, h, sw) => {
    const s = Math.max(4, sw);
    ctx.fillRect(x + (w - s) * 0.5, y + h - s, s, s);
  },
  '•': (ctx, x, y, w, h, sw) => {
    const s = Math.max(5, sw * 1.1);
    ctx.fillRect(x + (w - s) * 0.5, y + (h - s) * 0.5, s, s);
  },
  '«': (ctx, x, y, w, h, sw) => {
    const pad = sw * 0.35;
    const midY = y + h * 0.5;
    ctx.beginPath();
    ctx.moveTo(x + w * 0.52, y + pad + h * 0.12);
    ctx.lineTo(x + w * 0.14, midY);
    ctx.lineTo(x + w * 0.52, y + h - pad - h * 0.12);
    ctx.moveTo(x + w * 0.9, y + pad + h * 0.12);
    ctx.lineTo(x + w * 0.52, midY);
    ctx.lineTo(x + w * 0.9, y + h - pad - h * 0.12);
    ctx.stroke();
  },
  '»': (ctx, x, y, w, h, sw) => {
    const pad = sw * 0.35;
    const midY = y + h * 0.5;
    ctx.beginPath();
    ctx.moveTo(x + w * 0.1, y + pad + h * 0.12);
    ctx.lineTo(x + w * 0.48, midY);
    ctx.lineTo(x + w * 0.1, y + h - pad - h * 0.12);
    ctx.moveTo(x + w * 0.48, y + pad + h * 0.12);
    ctx.lineTo(x + w * 0.86, midY);
    ctx.lineTo(x + w * 0.48, y + h - pad - h * 0.12);
    ctx.stroke();
  },
};

function getTechnoGlyphWidthRatio(ch) {
  if (ch === ' ') return 0.55;
  if (ch === 'I') return 0.32;
  if (ch === ':' || ch === '.') return 0.36;
  if (ch === '-' || ch === '/' || ch === '•') return 0.62;
  if (ch === '1') return 0.68;
  if (ch === 'M' || ch === 'W') return 1.24;
  return 1.08;
}

export function measureTechnoVectorText(text, capHeight, trackingPx = 6, widthScale = 1.0) {
  const upper = String(text || '').toUpperCase();
  if (!upper.length) return 0;
  let total = 0;
  for (let i = 0; i < upper.length; i++) {
    const ch = upper[i];
    total += capHeight * getTechnoGlyphWidthRatio(ch) * widthScale;
    if (i < upper.length - 1) {
      total += trackingPx;
    }
  }
  return total;
}

export function drawTechnoVectorText(ctx, text, x, y, capHeight, options = {}) {
  const upper = String(text || '').toUpperCase();
  if (!upper.length) return 0;

  const color = options.color || MP3_PALETTE.primaryAmber;
  const glowColor = options.glowColor || MP3_PALETTE.coreNeonAmber;
  const glowBlur = options.glowBlur !== undefined ? options.glowBlur : 2;
  const strokeWidth = options.strokeWidth || Math.max(2.5, capHeight * 0.185);
  const trackingPx = options.trackingPx !== undefined ? options.trackingPx : Math.round(capHeight * 0.22);
  const widthScale = options.widthScale !== undefined ? options.widthScale : 1.0;
  const align = options.align || 'left';

  const totalWidth = measureTechnoVectorText(upper, capHeight, trackingPx, widthScale);
  let curX = x;
  if (align === 'center') {
    curX = x - totalWidth * 0.5;
  } else if (align === 'right') {
    curX = x - totalWidth;
  }

  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = strokeWidth;
  ctx.lineCap = 'butt';
  ctx.lineJoin = 'bevel';

  if (glowBlur > 0) {
    ctx.shadowColor = glowColor;
    ctx.shadowBlur = glowBlur;
  }

  for (let i = 0; i < upper.length; i++) {
    const ch = upper[i];
    const gw = capHeight * getTechnoGlyphWidthRatio(ch) * widthScale;
    const drawFn = TECHNO_GLYPH_STROKES[ch];
    if (drawFn) {
      drawFn(ctx, curX, y, gw, capHeight, strokeWidth);
    }
    curX += gw + trackingPx;
  }

  ctx.restore();
  return totalWidth;
}

// ============================================================================
// Offscreen Reference Chassis Processor (Strips Exterior #FFFFFF & Patches Nameplate)
// ============================================================================

export function processMp3ChassisBitmap(sourceImage) {
  const W = MP3_NATIVE_WIDTH;
  const H = MP3_NATIVE_HEIGHT;

  // 1. Full raw canvas for pixel inspection and sprite extraction
  const rawCanvas = document.createElement('canvas');
  rawCanvas.width = W;
  rawCanvas.height = H;
  const rawCtx = rawCanvas.getContext('2d', { willReadFrequently: true });
  rawCtx.drawImage(sourceImage, 0, 0, W, H);

  // Extract CD circular sprite at center (860.5, 621.5), radius 64px BEFORE masking screen
  const cdRadius = 64;
  const cdDiam = cdRadius * 2;
  const cdSpriteCanvas = document.createElement('canvas');
  cdSpriteCanvas.width = cdDiam;
  cdSpriteCanvas.height = cdDiam;
  const cdCtx = cdSpriteCanvas.getContext('2d');
  cdCtx.save();
  cdCtx.beginPath();
  cdCtx.arc(cdRadius, cdRadius, cdRadius - 1, 0, Math.PI * 2);
  cdCtx.closePath();
  cdCtx.clip();
  cdCtx.drawImage(
    rawCanvas,
    Math.round(860.5 - cdRadius),
    Math.round(621.5 - cdRadius),
    cdDiam,
    cdDiam,
    0,
    0,
    cdDiam,
    cdDiam
  );
  cdCtx.restore();

  // Extract the original "▶ PLAYING" sprite and original idle ECG waveform sprite for exact reference fidelity
  const origPlayingCanvas = document.createElement('canvas');
  origPlayingCanvas.width = 480;
  origPlayingCanvas.height = 84;
  origPlayingCanvas
    .getContext('2d')
    .drawImage(rawCanvas, 805, 410, 480, 84, 0, 0, 480, 84);

  const origWaveformCanvas = document.createElement('canvas');
  origWaveformCanvas.width = 212;
  origWaveformCanvas.height = 120;
  origWaveformCanvas
    .getContext('2d')
    .drawImage(rawCanvas, 924, 560, 212, 120, 0, 0, 212, 120);

  // Extract the 7 button cap sprites so pressed states shift the exact hardware button artwork
  const buttonCapSprites = {};
  for (const ctrl of MP3_CONTROL_HIT_ZONES) {
    const { x1, y1, x2, y2 } = ctrl.capPx;
    const bw = x2 - x1;
    const bh = y2 - y1;
    const bCanvas = document.createElement('canvas');
    bCanvas.width = bw;
    bCanvas.height = bh;
    bCanvas.getContext('2d').drawImage(rawCanvas, x1, y1, bw, bh, 0, 0, bw, bh);
    buttonCapSprites[ctrl.id] = bCanvas;
  }

  // 2. Border-connected flood fill to strip 100% of exterior white (#FFFFFF) background
  const imgData = rawCtx.getImageData(0, 0, W, H);
  const data = imgData.data;
  const visited = new Uint8Array(W * H);
  const queue = new Int32Array(W * H);
  let qHead = 0;
  let qTail = 0;

  const isExteriorWhite = (idx4) => {
    const r = data[idx4];
    const g = data[idx4 + 1];
    const b = data[idx4 + 2];
    return r > 175 && g > 175 && b > 175 && Math.abs(r - b) < 35;
  };

  for (let x = 0; x < W; x++) {
    const topIdx = x;
    const botIdx = (H - 1) * W + x;
    if (isExteriorWhite(topIdx * 4)) {
      visited[topIdx] = 1;
      queue[qTail++] = topIdx;
    }
    if (isExteriorWhite(botIdx * 4)) {
      visited[botIdx] = 1;
      queue[qTail++] = botIdx;
    }
  }
  for (let y = 1; y < H - 1; y++) {
    const leftIdx = y * W;
    const rightIdx = y * W + (W - 1);
    if (isExteriorWhite(leftIdx * 4)) {
      visited[leftIdx] = 1;
      queue[qTail++] = leftIdx;
    }
    if (isExteriorWhite(rightIdx * 4)) {
      visited[rightIdx] = 1;
      queue[qTail++] = rightIdx;
    }
  }

  while (qHead < qTail) {
    const curr = queue[qHead++];
    const p4 = curr * 4;
    data[p4 + 3] = 0;

    const cx = curr % W;
    const cy = (curr - cx) / W;

    if (cx > 0) {
      const n = curr - 1;
      if (!visited[n] && isExteriorWhite(n * 4)) {
        visited[n] = 1;
        queue[qTail++] = n;
      }
    }
    if (cx < W - 1) {
      const n = curr + 1;
      if (!visited[n] && isExteriorWhite(n * 4)) {
        visited[n] = 1;
        queue[qTail++] = n;
      }
    }
    if (cy > 0) {
      const n = curr - W;
      if (!visited[n] && isExteriorWhite(n * 4)) {
        visited[n] = 1;
        queue[qTail++] = n;
      }
    }
    if (cy < H - 1) {
      const n = curr + W;
      if (!visited[n] && isExteriorWhite(n * 4)) {
        visited[n] = 1;
        queue[qTail++] = n;
      }
    }
  }

  // Feather 1-2px anti-aliased fringe along the chassis boundary so no white halo remains
  for (let y = 1; y < H - 1; y++) {
    const rowOff = y * W;
    for (let x = 1; x < W - 1; x++) {
      const idx = rowOff + x;
      if (visited[idx]) continue;
      if (
        visited[idx - 1] ||
        visited[idx + 1] ||
        visited[idx - W] ||
        visited[idx + W]
      ) {
        const p4 = idx * 4;
        const lum = (data[p4] + data[p4 + 1] + data[p4 + 2]) / 3;
        if (lum > 75) {
          const factor = Math.max(0, Math.min(1, (185 - lum) / 110));
          data[p4] = Math.round(data[p4] * factor);
          data[p4 + 1] = Math.round(data[p4 + 1] * factor);
          data[p4 + 2] = Math.round(data[p4 + 2] * factor);
          data[p4 + 3] = Math.round(255 * Math.min(1, factor + 0.25));
        }
      }
    }
  }

  // 3. Seamless Boundary-Interpolated Inpainting Helper on raw `data` buffer
  // Replaces any interior dynamic region [x1..x2, y1..y2] by linearly interpolating between
  // the clean substrate pixels at (x, y1-1) and (x, y2+1), eliminating 100% of rectangular patch seams!
  const inpaintRectVertical = (x1, y1, x2, y2, maxDarkR = 65) => {
    const spanY = Math.max(1, y2 - y1);
    for (let x = x1; x <= x2; x++) {
      const topIdx = ((y1 - 1) * W + x) * 4;
      const botIdx = ((y2 + 1) * W + x) * 4;
      const tr = Math.min(maxDarkR, data[topIdx]);
      const tg = Math.min(Math.round(maxDarkR * 0.62), data[topIdx + 1]);
      const tb = Math.min(Math.round(maxDarkR * 0.28), data[topIdx + 2]);
      const br = Math.min(maxDarkR, data[botIdx]);
      const bg = Math.min(Math.round(maxDarkR * 0.62), data[botIdx + 1]);
      const bb = Math.min(Math.round(maxDarkR * 0.28), data[botIdx + 2]);

      for (let y = y1; y <= y2; y++) {
        const t = (y - y1) / spanY;
        const p4 = (y * W + x) * 4;
        // Deterministic micro-grain (+/- 1 LSB) so CRT phosphor texture looks completely natural
        const grain = ((x * 17 + y * 31) & 3) - 1;
        data[p4] = Math.max(0, Math.round(tr * (1 - t) + br * t + grain));
        data[p4 + 1] = Math.max(0, Math.round(tg * (1 - t) + bg * t + grain));
        data[p4 + 2] = Math.max(0, Math.round(tb * (1 - t) + bb * t));
      }
    }
  };

  // Inpaint "TECHNO-AUDIO" nameplate (x: 1140..1612, y: 168..206) cleanly between upper rule (y=150) & lower rule (y=216)
  for (let y = 168; y <= 206; y++) {
    for (let x = 1140; x <= 1612; x++) {
      const p4 = (y * W + x) * 4;
      const grain = ((x * 13 + y * 29) & 1);
      data[p4] = 29 + grain;
      data[p4 + 1] = 22 + grain;
      data[p4 + 2] = 15 + grain;
    }
  }

  // Seamlessly inpaint dynamic OLED screen zones:
  // Sub-region A: Transport status icon & "PLAYING" banner (x: 808..1285, y: 408..492)
  inpaintRectVertical(808, 408, 1285, 492, 54);
  // Sub-region B: Track title marquee «TROOLLSHORT MP» (x: 1368..2000, y: 382..434)
  inpaintRectVertical(1368, 382, 2000, 434, 54);
  // Sub-region C: Progress bar inner trough (x: 1375..1991, y: 465..494) — preserves outer border at y=460..462 & y=497..500
  inpaintRectVertical(1375, 465, 1991, 494, 48);
  // Sub-region D: CD icon footprint (x: 790..926, y: 556..685)
  inpaintRectVertical(790, 556, 926, 685, 52);
  // Sub-region E: Oscilloscope waveform footprint (x: 924..1137, y: 556..680)
  inpaintRectVertical(924, 556, 1137, 680, 48);
  // Sub-region G: Digital clock digits "02:45" under TIME ELAPSED (x: 1368..1648, y: 566..632)
  inpaintRectVertical(1368, 566, 1648, 632, 48);
  // Sub-region H: 10-segment VOLUME bars to the right of VOLUME label (x: 1512..1674, y: 662..695)
  inpaintRectVertical(1512, 662, 1674, 695, 50);

  rawCtx.putImageData(imgData, 0, 0);

  // Render crisp "DOOM TRACKS" on the top nameplate (y = 173..202, centered at x = 1376)
  drawTechnoVectorText(rawCtx, 'DOOM TRACKS', 1376, 173, 29, {
    align: 'center',
    color: MP3_PALETTE.nameplateBevelEdge,
    glowColor: MP3_PALETTE.coreNeonAmber,
    glowBlur: 2,
    strokeWidth: 6.4,
    trackingPx: 9,
    widthScale: 1.05,
  });
  drawTechnoVectorText(rawCtx, 'DOOM TRACKS', 1376, 173, 29, {
    align: 'center',
    color: MP3_PALETTE.primaryAmber,
    glowColor: MP3_PALETTE.coreNeonAmber,
    glowBlur: 0.8,
    strokeWidth: 5.2,
    trackingPx: 9,
    widthScale: 1.05,
  });

  return {
    baseCanvas: rawCanvas,
    cdSpriteCanvas,
    origPlayingCanvas,
    origWaveformCanvas,
    buttonCapSprites,
    exteriorMask: visited,
  };
}

// ============================================================================
// Interactive "DOOM TRACKS" MP3 Deck Controller
// ============================================================================

const MORPH_DURATION_SEC = 0.46;

function easeInOutCubic(t) {
  const clamped = Math.max(0.0, Math.min(1.0, t));
  return clamped < 0.5
    ? 4.0 * clamped * clamped * clamped
    : 1.0 - Math.pow(-2.0 * clamped + 2.0, 3) * 0.5;
}

export function createDoomTracksMp3HUD(options = {}) {
  const sandboxAudio = options.audio || null;
  const assetSrc = options.assetSrc || 'assets/mp3.jpeg';
  const manifestUrl = options.manifestUrl || 'assets/tracks/manifest.json';

  const state = {
    initialized: false,
    visible: options.initiallyVisible !== undefined ? Boolean(options.initiallyVisible) : true,
    displayMode: 'SCREEN_ONLY', // 'SCREEN_ONLY' | 'EXPANDING' | 'FULL_TAKEOVER' | 'COLLAPSING'
    morphProgress: 0.0, // 0.0 = compact SCREEN_ONLY in bottom-right corner, 1.0 = centered FULL_TAKEOVER
    targetMorphProgress: 0.0,
    expanded: false,
    minimized: false,
    playbackState: 'STOPPED', // 'PLAYING' | 'PAUSED' | 'STOPPED'
    tracks: [...DOOM_TRACKS_DEFAULT_CATALOG],
    currentTrackIndex: 0,
    currentTime: 0,
    duration: DOOM_TRACKS_DEFAULT_CATALOG[0].duration,
    repeatMode: 'ALL', // 'ALL' | 'ONE' | 'OFF'
    shuffle: false,
    visualsMode: 'WAVE', // 'WAVE' | 'SPECTRUM' | 'PULSE'
    showTracklistOnScreen: false,
    showRemainingTime: false,
    volume: sandboxAudio ? sandboxAudio.masterGain : 0.75,
    muted: sandboxAudio ? sandboxAudio.muted : false,
    cdRotationRad: 0,
    cassetteRotationRad: 0,
    marqueeOffsetPx: 0,
    marqueePauseTimer: 1.5,
    footerNoticeText: '',
    footerNoticeTimer: 0,
    activePressedButtonId: null,
    hoveredControlId: null,
    isScrubbingProgress: false,
    isScrubbingVolume: false,
    lastFrameTimeMs: performance.now(),
    lastRenderDurationMs: 0,
    errorCount: 0,
    lastError: null,
  };

  // Pre-allocated zero-GC typed arrays for 60 FPS AnalyserNode waveform & spectrum reads (§6.2)
  const timeDomainBuffer = new Uint8Array(128);
  const freqDomainBuffer = new Uint8Array(128);
  timeDomainBuffer.fill(128);

  // Single persistent HTMLAudioElement (§4.2 & §6.1)
  const audioEl = new Audio();
  audioEl.crossOrigin = 'anonymous';
  audioEl.preload = 'auto';

  let audioCtx = null;
  let mediaSourceNode = null;
  let analyserNode = null;
  let playerGainNode = null;
  let playRequestSeq = 0;
  let lastSeekWallTimeMs = 0;

  // Offscreen processed chassis assets
  let processedAssets = null;

  // DOM Elements
  let backdropEl = null;
  let rootEl = null;
  let deckClipEl = null;
  let deckFrameEl = null;
  let displayCanvas = null;
  let displayCtx = null;
  const buttonEls = new Map();

  function showFooterNotice(text, durationSec = 1.4) {
    state.footerNoticeText = String(text || '').toUpperCase();
    state.footerNoticeTimer = durationSec;
  }

  function ensureWebAudioGraph() {
    if (analyserNode && audioCtx) {
      if (audioCtx.state === 'suspended') {
        audioCtx.resume().catch(() => {});
      }
      return analyserNode;
    }

    if (sandboxAudio && typeof sandboxAudio.unlock === 'function') {
      sandboxAudio.unlock();
    }

    const AudioCtxClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtxClass) return null;

    try {
      audioCtx = new AudioCtxClass();
      analyserNode = audioCtx.createAnalyser();
      analyserNode.fftSize = 256;
      analyserNode.smoothingTimeConstant = 0.78;

      playerGainNode = audioCtx.createGain();
      const effectiveGain = state.muted ? 0.0 : state.volume;
      playerGainNode.gain.value = effectiveGain;

      mediaSourceNode = audioCtx.createMediaElementSource(audioEl);
      mediaSourceNode.connect(analyserNode);
      analyserNode.connect(playerGainNode);
      playerGainNode.connect(audioCtx.destination);

      if (audioCtx.state === 'suspended') {
        audioCtx.resume().catch(() => {});
      }
    } catch (_err) {
      // Fallback to direct HTMLAudioElement volume if MediaElementSource already bound
    }
    return analyserNode;
  }

  function syncEffectiveVolumeFromSandbox() {
    if (sandboxAudio) {
      state.muted = Boolean(sandboxAudio.muted);
      if (typeof sandboxAudio.masterGain === 'number' && !state.isScrubbingVolume) {
        state.volume = sandboxAudio.masterGain;
      }
    }
    const effective = state.muted ? 0.0 : Math.max(0.0, Math.min(1.0, state.volume));
    audioEl.muted = state.muted;
    audioEl.volume = effective;
    if (playerGainNode && audioCtx) {
      playerGainNode.gain.setTargetAtTime(effective, audioCtx.currentTime, 0.015);
    }
  }

  function triggerTactileClick(cueName = 'onHover') {
    if (
      sandboxAudio &&
      typeof sandboxAudio.trigger === 'function' &&
      sandboxAudio.uiTriggers &&
      sandboxAudio.uiTriggers[cueName]
    ) {
      try {
        sandboxAudio.trigger(cueName);
      } catch (_e) {
        // Ignore if trigger fails
      }
    }
  }

  function updateTelemetryReadout() {
    const activeTrack = state.tracks[state.currentTrackIndex] || DOOM_TRACKS_DEFAULT_CATALOG[0];
    const telMp3El = document.getElementById('tel-mp3');
    if (telMp3El) {
      telMp3El.textContent = `${state.playbackState} • ${activeTrack.title}`;
    }
  }

  function loadTrackAtIndex(index, autoPlay = false) {
    if (!state.tracks.length) return;
    const count = state.tracks.length;
    const normalizedIdx = ((index % count) + count) % count;
    state.currentTrackIndex = normalizedIdx;
    const track = state.tracks[normalizedIdx];

    state.currentTime = 0;
    state.duration = Number.isFinite(track.duration) && track.duration > 0 ? track.duration : 32;
    state.marqueeOffsetPx = 0;
    state.marqueePauseTimer = 1.4;

    audioEl.src = track.src;
    try {
      audioEl.currentTime = 0;
    } catch (_e) {
      // Ignore if metadata not yet loaded
    }
    showFooterNotice(`TRK ${String(normalizedIdx + 1).padStart(2, '0')}/${String(count).padStart(2, '0')}`);
    updateButtonAriaStates();
    updateTelemetryReadout();

    if (autoPlay) {
      playCurrentTrack();
    } else {
      renderFrame(performance.now());
    }
  }

  function playCurrentTrack() {
    ensureWebAudioGraph();
    syncEffectiveVolumeFromSandbox();

    if (!audioEl.src && state.tracks.length > 0) {
      audioEl.src = state.tracks[state.currentTrackIndex].src;
    }

    const reqId = ++playRequestSeq;
    state.playbackState = 'PLAYING';
    state.showTracklistOnScreen = false;
    updateButtonAriaStates();
    updateTelemetryReadout();

    const playPromise = audioEl.play();
    if (playPromise && typeof playPromise.then === 'function') {
      playPromise.catch((err) => {
        if (reqId !== playRequestSeq) return; // Superseded by rapid track switch (§7.3)
        if (err && err.name === 'AbortError') return;
        if (err && err.name === 'NotAllowedError') {
          // Keep deterministic UI playback clock running if programmatic play() was invoked before user gesture,
          // and unlock audioEl automatically on next user click
          return;
        }
        state.errorCount += 1;
        state.lastError = err ? err.message : 'MEDIA_PLAY_ERROR';
        showFooterNotice('ERR: TRACK UNAVAILABLE', 2.0);
      });
    }
    renderFrame(performance.now());
    return state.playbackState;
  }

  function pauseCurrentTrack() {
    playRequestSeq++;
    if (state.playbackState === 'PAUSED') {
      // Pressing PAUSE while already paused resumes playback (§3.5)
      return playCurrentTrack();
    }
    audioEl.pause();
    state.playbackState = 'PAUSED';
    showFooterNotice('PAUSED', 1.2);
    updateButtonAriaStates();
    updateTelemetryReadout();
    renderFrame(performance.now());
    return state.playbackState;
  }

  function stopCurrentTrack() {
    playRequestSeq++;
    audioEl.pause();
    try {
      audioEl.currentTime = 0;
    } catch (_e) {
      // Ignore if metadata not yet loaded
    }
    state.currentTime = 0;
    state.playbackState = 'STOPPED';
    state.showTracklistOnScreen = false;
    showFooterNotice('STOPPED', 1.2);
    updateButtonAriaStates();
    updateTelemetryReadout();
    renderFrame(performance.now());
    return state.playbackState;
  }

  function nextTrack() {
    const count = state.tracks.length;
    if (count === 0) return;
    let nextIdx = (state.currentTrackIndex + 1) % count;
    if (state.shuffle && count > 1) {
      const candidates = [];
      for (let i = 0; i < count; i++) {
        if (i !== state.currentTrackIndex) candidates.push(i);
      }
      nextIdx = candidates[Math.floor(Math.random() * candidates.length)];
    }
    const shouldPlay = state.playbackState === 'PLAYING';
    loadTrackAtIndex(nextIdx, shouldPlay);
  }

  function prevTrack() {
    if (state.currentTime > 3.0) {
      state.currentTime = 0;
      lastSeekWallTimeMs = performance.now();
      try {
        audioEl.currentTime = 0;
      } catch (_e) {
        // Ignore
      }
      showFooterNotice('RESTART TRK', 1.0);
      renderFrame(performance.now());
      return;
    }
    const count = state.tracks.length;
    if (count === 0) return;
    const prevIdx = (state.currentTrackIndex - 1 + count) % count;
    const shouldPlay = state.playbackState === 'PLAYING';
    loadTrackAtIndex(prevIdx, shouldPlay);
  }

  function cycleRepeatMode() {
    if (state.repeatMode === 'ALL') {
      state.repeatMode = 'ONE';
    } else if (state.repeatMode === 'ONE') {
      state.repeatMode = 'OFF';
    } else {
      state.repeatMode = 'ALL';
    }
    showFooterNotice(`REPEAT ${state.repeatMode}`, 1.4);
    updateButtonAriaStates();
    renderFrame(performance.now());
    return state.repeatMode;
  }

  function togglePlaybackTracklist() {
    state.showTracklistOnScreen = !state.showTracklistOnScreen;
    showFooterNotice(
      state.showTracklistOnScreen
        ? `CATALOG (${state.tracks.length})`
        : `TRK ${String(state.currentTrackIndex + 1).padStart(2, '0')}/${String(state.tracks.length).padStart(2, '0')}`,
      1.4
    );
    updateButtonAriaStates();
    renderFrame(performance.now());
    return state.showTracklistOnScreen;
  }

  function toggleShuffle() {
    state.shuffle = !state.shuffle;
    showFooterNotice(state.shuffle ? 'SHUFFLE ON' : 'SHUFFLE OFF', 1.4);
    updateButtonAriaStates();
    renderFrame(performance.now());
    return state.shuffle;
  }

  function cycleVisualsMode() {
    if (state.visualsMode === 'WAVE') {
      state.visualsMode = 'SPECTRUM';
    } else if (state.visualsMode === 'SPECTRUM') {
      state.visualsMode = 'PULSE';
    } else {
      state.visualsMode = 'WAVE';
    }
    showFooterNotice(`VIS: ${state.visualsMode}`, 1.4);
    updateButtonAriaStates();
    renderFrame(performance.now());
    return state.visualsMode;
  }

  function seekToFraction(fraction01) {
    const clamped = Math.max(0.0, Math.min(1.0, Number(fraction01) || 0));
    const dur = Number.isFinite(audioEl.duration) && audioEl.duration > 0 ? audioEl.duration : state.duration;
    if (dur > 0) {
      const targetSec = clamped * dur;
      state.currentTime = targetSec;
      lastSeekWallTimeMs = performance.now();
      try {
        audioEl.currentTime = targetSec;
      } catch (_e) {
        // Ignore if media stream not seekable yet
      }
      renderFrame(performance.now());
    }
    return state.currentTime;
  }

  function setVolume(gain01) {
    const clamped = Math.max(0.0, Math.min(1.0, Number(gain01)));
    if (Number.isNaN(clamped)) return state.volume;
    state.volume = Number(clamped.toFixed(2));
    if (state.volume > 0 && state.muted) {
      state.muted = false;
      if (sandboxAudio && typeof sandboxAudio.setMuted === 'function') {
        sandboxAudio.setMuted(false);
      }
    }
    if (sandboxAudio && typeof sandboxAudio.setMasterGain === 'function') {
      sandboxAudio.setMasterGain(state.volume);
    }
    syncEffectiveVolumeFromSandbox();
    showFooterNotice(`VOL ${Math.round(state.volume * 100)}%`, 1.0);
    renderFrame(performance.now());
    return state.volume;
  }

  // Audio Element Event Listeners
  audioEl.addEventListener('loadedmetadata', () => {
    if (Number.isFinite(audioEl.duration) && audioEl.duration > 0) {
      state.duration = audioEl.duration;
    }
  });

  audioEl.addEventListener('ended', () => {
    if (state.repeatMode === 'ONE') {
      state.currentTime = 0;
      playCurrentTrack();
      return;
    }
    const isLast = state.currentTrackIndex >= state.tracks.length - 1;
    if (state.repeatMode === 'OFF' && isLast && !state.shuffle) {
      stopCurrentTrack();
      return;
    }
    nextTrack();
  });

  audioEl.addEventListener('error', () => {
    state.errorCount += 1;
    state.lastError = 'MEDIA_ERR_SRC_NOT_SUPPORTED';
    showFooterNotice('ERR: TRACK UNAVAILABLE', 2.0);
    if (state.tracks.length > 1) {
      setTimeout(() => {
        if (state.playbackState === 'PLAYING') {
          nextTrack();
        }
      }, 600);
    }
  });

  // ============================================================================
  // 60 FPS Dynamic OLED Screen & Tactile Hardware Render Pass
  // ============================================================================

  function formatTimeMMSS(seconds, isRemaining = false) {
    const safeSec = Math.max(0, Math.floor(Number.isFinite(seconds) ? seconds : 0));
    const mins = Math.floor(safeSec / 60);
    const secs = safeSec % 60;
    const prefix = isRemaining ? '-' : '';
    return `${prefix}${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }

  function applyMorphLayout() {
    if (!rootEl || !deckClipEl || !deckFrameEl || typeof window === 'undefined') return;

    const p = Math.max(0.0, Math.min(1.0, state.morphProgress));
    const t = easeInOutCubic(p);

    const vw = Math.max(320, window.innerWidth || 1280);
    const vh = Math.max(240, window.innerHeight || 720);

    // 1. Compact SCREEN_ONLY viewport rectangle (docked in bottom-right corner)
    const screenAspect = MP3_SCREEN_ONLY_CROP.w / MP3_SCREEN_ONLY_CROP.h;
    const w0 = Math.round(Math.min(410, Math.max(290, vw * 0.275)));
    const h0 = Math.round(w0 / screenAspect);
    const margin0 = 18;
    const screenRect0 = {
      x: vw - w0 - margin0,
      y: vh - h0 - margin0,
      w: w0,
      h: h0,
    };

    // 2. Centered FULL_TAKEOVER viewport rectangle (takes over the screen at max aspect-preserving scale)
    const chassisAspect = MP3_CHASSIS_CROP.w / MP3_CHASSIS_CROP.h;
    const maxW = vw * 0.94;
    const maxH = vh * 0.92;
    const w1 = Math.round(Math.min(maxW, maxH * chassisAspect));
    const h1 = Math.round(w1 / chassisAspect);
    const x1 = Math.round((vw - w1) * 0.5);
    const y1 = Math.round((vh - h1) * 0.5);
    const s1 = w1 / MP3_CHASSIS_CROP.w;

    // Where the OLED screen sits inside the centered FULL_TAKEOVER chassis
    const screenRect1 = {
      x: x1 + (MP3_SCREEN_ONLY_CROP.x - MP3_CHASSIS_CROP.x) * s1,
      y: y1 + (MP3_SCREEN_ONLY_CROP.y - MP3_CHASSIS_CROP.y) * s1,
      w: MP3_SCREEN_ONLY_CROP.w * s1,
      h: MP3_SCREEN_ONLY_CROP.h * s1,
    };

    // 3. Isotropic interpolation of the OLED screen trajectory + simultaneous unfolding of the outer hardware crop
    const curScreenX = screenRect0.x + (screenRect1.x - screenRect0.x) * t;
    const curScreenY = screenRect0.y + (screenRect1.y - screenRect0.y) * t;
    const curScreenW = screenRect0.w + (screenRect1.w - screenRect0.w) * t;
    const curScale = curScreenW / MP3_SCREEN_ONLY_CROP.w;

    const curCropX = MP3_SCREEN_ONLY_CROP.x + (MP3_CHASSIS_CROP.x - MP3_SCREEN_ONLY_CROP.x) * t;
    const curCropY = MP3_SCREEN_ONLY_CROP.y + (MP3_CHASSIS_CROP.y - MP3_SCREEN_ONLY_CROP.y) * t;
    const curCropW = MP3_SCREEN_ONLY_CROP.w + (MP3_CHASSIS_CROP.w - MP3_SCREEN_ONLY_CROP.w) * t;
    const curCropH = MP3_SCREEN_ONLY_CROP.h + (MP3_CHASSIS_CROP.h - MP3_SCREEN_ONLY_CROP.h) * t;

    const curViewX = curScreenX - (MP3_SCREEN_ONLY_CROP.x - curCropX) * curScale;
    const curViewY = curScreenY - (MP3_SCREEN_ONLY_CROP.y - curCropY) * curScale;
    const curViewW = curCropW * curScale;
    const curViewH = curCropH * curScale;

    const deckW = MP3_CHASSIS_CROP.w * curScale;
    const deckH = MP3_CHASSIS_CROP.h * curScale;
    const deckLeft = -(curCropX - MP3_CHASSIS_CROP.x) * curScale;
    const deckTop = -(curCropY - MP3_CHASSIS_CROP.y) * curScale;

    rootEl.style.left = `${curViewX.toFixed(2)}px`;
    rootEl.style.top = `${curViewY.toFixed(2)}px`;
    rootEl.style.width = `${curViewW.toFixed(2)}px`;
    rootEl.style.height = `${curViewH.toFixed(2)}px`;
    rootEl.dataset.displayMode = state.displayMode;
    rootEl.classList.toggle('expanded', state.targetMorphProgress > 0.5);
    rootEl.classList.toggle('screen-only', p < 0.05);

    const clipRadiusPx = Math.round(10 * (1.0 - t));
    const borderAlpha = Number((0.45 * (1.0 - t)).toFixed(3));
    deckClipEl.style.borderRadius = `${clipRadiusPx}px`;
    deckClipEl.style.borderColor = `rgba(255, 165, 29, ${borderAlpha})`;

    deckFrameEl.style.width = `${deckW.toFixed(2)}px`;
    deckFrameEl.style.height = `${deckH.toFixed(2)}px`;
    deckFrameEl.style.left = `${deckLeft.toFixed(2)}px`;
    deckFrameEl.style.top = `${deckTop.toFixed(2)}px`;
    deckFrameEl.style.cursor = state.targetMorphProgress < 0.5 ? 'pointer' : 'default';

    if (backdropEl) {
      const backdropVisible = state.visible && p > 0.005;
      backdropEl.style.opacity = backdropVisible ? t.toFixed(3) : '0';
      backdropEl.style.pointerEvents =
        state.visible && state.targetMorphProgress > 0.5 ? 'auto' : 'none';
      backdropEl.classList.toggle('active', backdropVisible);
    }

    const buttonsInteractive = p > 0.85 && state.targetMorphProgress > 0.5;
    for (const btn of buttonEls.values()) {
      btn.style.pointerEvents = buttonsInteractive ? 'auto' : 'none';
      btn.style.visibility = buttonsInteractive ? 'visible' : 'hidden';
    }
  }

  function renderFrame(nowMs = performance.now()) {
    if (!state.visible || state.minimized || !processedAssets || !displayCtx) return;

    const t0 = performance.now();
    const dt = Math.min(0.1, Math.max(0.0, (nowMs - state.lastFrameTimeMs) * 0.001));
    state.lastFrameTimeMs = nowMs;

    // Advance animated morph between SCREEN_ONLY (0.0) and FULL_TAKEOVER (1.0)
    if (state.morphProgress !== state.targetMorphProgress) {
      const step = dt > 0 ? dt / MORPH_DURATION_SEC : 1 / (60 * MORPH_DURATION_SEC);
      if (state.morphProgress < state.targetMorphProgress) {
        state.morphProgress = Math.min(state.targetMorphProgress, state.morphProgress + step);
        state.displayMode = state.morphProgress >= 1.0 ? 'FULL_TAKEOVER' : 'EXPANDING';
      } else {
        state.morphProgress = Math.max(state.targetMorphProgress, state.morphProgress - step);
        state.displayMode = state.morphProgress <= 0.0 ? 'SCREEN_ONLY' : 'COLLAPSING';
      }
      state.expanded = state.morphProgress > 0.5;
      applyMorphLayout();
    }

    syncEffectiveVolumeFromSandbox();

    if (state.playbackState === 'PLAYING' && !state.isScrubbingProgress) {
      const timeSinceSeekMs = nowMs - lastSeekWallTimeMs;
      // Advance currentTime smoothly and reconcile with audioEl.currentTime when not recently seeked on non-Range HTTP server
      state.currentTime += dt;
      if (
        !audioEl.paused &&
        timeSinceSeekMs > 800 &&
        Math.abs(audioEl.currentTime - state.currentTime) < 1.2
      ) {
        state.currentTime = audioEl.currentTime;
      }
      if (state.currentTime >= state.duration) {
        if (state.repeatMode === 'ONE') {
          state.currentTime = 0;
        } else {
          const isLast = state.currentTrackIndex >= state.tracks.length - 1;
          if (state.repeatMode === 'OFF' && isLast && !state.shuffle) {
            stopCurrentTrack();
            return;
          }
          nextTrack();
          return;
        }
      }
      state.cdRotationRad = (state.cdRotationRad + dt * 1.65) % (Math.PI * 2);
      state.cassetteRotationRad = (state.cassetteRotationRad + dt * 2.2) % (Math.PI * 2);
    }

    if (state.footerNoticeTimer > 0) {
      state.footerNoticeTimer = Math.max(0, state.footerNoticeTimer - dt);
    }

    const ctx = displayCtx;
    const crop = MP3_CHASSIS_CROP;

    ctx.clearRect(0, 0, crop.w, crop.h);
    ctx.save();
    ctx.translate(-crop.x, -crop.y);

    // 1. Draw cached transparent chassis with "DOOM TRACKS" header and seamlessly inpainted screen zones
    ctx.drawImage(processedAssets.baseCanvas, 0, 0);

    const activeTrack = state.tracks[state.currentTrackIndex] || DOOM_TRACKS_DEFAULT_CATALOG[0];

    // 2. Sub-region A: Transport Status Icon & Banner (x: 816..1285, y: 417..485)
    if (state.playbackState === 'PLAYING') {
      ctx.drawImage(processedAssets.origPlayingCanvas, 805, 410);
    } else if (state.playbackState === 'PAUSED') {
      ctx.save();
      ctx.fillStyle = MP3_PALETTE.primaryAmber;
      ctx.shadowColor = MP3_PALETTE.coreNeonAmber;
      ctx.shadowBlur = 6;
      ctx.fillRect(820, 421, 18, 60);
      ctx.fillRect(852, 421, 18, 60);
      ctx.restore();
      drawTechnoVectorText(ctx, 'PAUSED', 909, 426, 51, {
        color: MP3_PALETTE.primaryAmber,
        glowColor: MP3_PALETTE.coreNeonAmber,
        glowBlur: 4,
        strokeWidth: 9.2,
        trackingPx: 11,
        widthScale: 1.02,
      });
    } else {
      ctx.save();
      ctx.fillStyle = MP3_PALETTE.primaryAmber;
      ctx.shadowColor = MP3_PALETTE.coreNeonAmber;
      ctx.shadowBlur = 6;
      ctx.fillRect(818, 422, 58, 58);
      ctx.restore();
      drawTechnoVectorText(ctx, 'STOPPED', 906, 426, 48, {
        color: MP3_PALETTE.primaryAmber,
        glowColor: MP3_PALETTE.coreNeonAmber,
        glowBlur: 4,
        strokeWidth: 8.8,
        trackingPx: 9,
        widthScale: 0.96,
      });
    }

    // 3. Sub-region B: Track Title Marquee « SONG TITLE » (x: 1373..1995, y: 388..425)
    const titleCapH = 34;
    const titleY = 389;
    drawTechnoVectorText(ctx, '«', 1373, titleY, titleCapH, {
      color: MP3_PALETTE.primaryAmber,
      glowBlur: 3,
      strokeWidth: 5.4,
    });
    drawTechnoVectorText(ctx, '»', 1970, titleY, titleCapH, {
      color: MP3_PALETTE.primaryAmber,
      glowBlur: 3,
      strokeWidth: 5.4,
    });

    const innerTitleX = 1420;
    const innerTitleW = 536;
    const displayTitle = state.showTracklistOnScreen
      ? `SELECT [${state.currentTrackIndex + 1}/${state.tracks.length}]: ${activeTrack.title}`
      : activeTrack.title;
    const fullTitleWidth = measureTechnoVectorText(displayTitle, titleCapH, 7, 0.94);

    ctx.save();
    ctx.beginPath();
    ctx.rect(innerTitleX, 380, innerTitleW, 54);
    ctx.clip();

    if (fullTitleWidth <= innerTitleW) {
      state.marqueeOffsetPx = 0;
      drawTechnoVectorText(ctx, displayTitle, innerTitleX + innerTitleW * 0.5, titleY, titleCapH, {
        align: 'center',
        color: MP3_PALETTE.primaryAmber,
        glowBlur: 3,
        strokeWidth: 5.4,
        trackingPx: 7,
        widthScale: 0.94,
      });
    } else {
      if (state.marqueePauseTimer > 0) {
        state.marqueePauseTimer -= dt;
      } else {
        state.marqueeOffsetPx += dt * 68;
        const loopSpan = fullTitleWidth + 90;
        if (state.marqueeOffsetPx >= loopSpan) {
          state.marqueeOffsetPx = 0;
          state.marqueePauseTimer = 1.2;
        }
      }
      const drawX1 = innerTitleX - state.marqueeOffsetPx;
      drawTechnoVectorText(ctx, displayTitle, drawX1, titleY, titleCapH, {
        color: MP3_PALETTE.primaryAmber,
        glowBlur: 3,
        strokeWidth: 5.4,
        trackingPx: 7,
        widthScale: 0.94,
      });
      drawTechnoVectorText(ctx, displayTitle, drawX1 + fullTitleWidth + 90, titleY, titleCapH, {
        color: MP3_PALETTE.primaryAmber,
        glowBlur: 3,
        strokeWidth: 5.4,
        trackingPx: 7,
        widthScale: 0.94,
      });
    }
    ctx.restore();

    // 4. Sub-region C: Interactive Progress / Seek Bar Fill (x: 1375..1991, y: 468..490)
    const dur = state.duration > 0 ? state.duration : 1;
    const progress01 = Math.max(0.0, Math.min(1.0, state.currentTime / dur));
    const maxFillW = 616;
    const fillW = Math.round(progress01 * maxFillW);
    if (fillW > 0) {
      ctx.save();
      ctx.fillStyle = MP3_PALETTE.primaryAmber;
      ctx.shadowColor = MP3_PALETTE.coreNeonAmber;
      ctx.shadowBlur = 5;
      ctx.fillRect(1375, 469, fillW, 21);
      ctx.restore();
    }

    // 5. Sub-region D: Spinning Optical CD Icon at center (860.5, 621.5)
    ctx.save();
    ctx.translate(860.5, 621.5);
    ctx.rotate(state.cdRotationRad);
    ctx.drawImage(processedAssets.cdSpriteCanvas, -64, -64);
    ctx.restore();

    // 6. Sub-region E: Live Web Audio Oscilloscope Waveform (x: 924..1136, baseline y: 621.5)
    if (state.playbackState === 'PLAYING') {
      if (analyserNode) {
        analyserNode.getByteTimeDomainData(timeDomainBuffer);
        analyserNode.getByteFrequencyData(freqDomainBuffer);
      }

      ctx.save();
      ctx.strokeStyle = MP3_PALETTE.primaryAmber;
      ctx.fillStyle = MP3_PALETTE.primaryAmber;
      ctx.shadowColor = MP3_PALETTE.coreNeonAmber;
      ctx.shadowBlur = 6;
      ctx.lineWidth = 4.2;
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';

      const wfLeft = 924;
      const wfRight = 1136;
      const wfWidth = wfRight - wfLeft;
      const baseY = 621.5;

      if (state.visualsMode === 'SPECTRUM') {
        const barCount = 16;
        const stepX = wfWidth / barCount;
        for (let i = 0; i < barCount; i++) {
          const fftVal = analyserNode ? freqDomainBuffer[i * 2] / 255.0 : 0;
          const synthVal = 0.25 + 0.55 * Math.abs(Math.sin(nowMs * 0.011 + i * 0.65));
          const val = fftVal > 0.05 ? fftVal : synthVal;
          const bh = Math.max(4, val * 82);
          ctx.fillRect(wfLeft + i * stepX + 2, baseY - bh * 0.5, stepX - 4, bh);
        }
      } else {
        ctx.beginPath();
        ctx.moveTo(wfLeft, baseY);
        const pts = 44;
        for (let i = 0; i < pts; i++) {
          const frac = i / (pts - 1);
          const px = wfLeft + frac * wfWidth;
          const windowEnv = Math.sin(frac * Math.PI);
          const rawSample = analyserNode ? (timeDomainBuffer[i * 2] - 128) / 128.0 : 0;
          const synthPulse =
            Math.sin(nowMs * 0.018 + i * 0.55) * 0.42 +
            Math.cos(nowMs * 0.031 - i * 0.9) * 0.3;
          const signal = Math.abs(rawSample) > 0.01 ? rawSample * 1.45 : synthPulse;
          const py = baseY + signal * 44 * windowEnv;
          ctx.lineTo(px, py);
        }
        ctx.lineTo(wfRight, baseY);
        ctx.stroke();

        if (state.visualsMode === 'PULSE') {
          ctx.globalAlpha = 0.55;
          ctx.lineWidth = 2.4;
          ctx.beginPath();
          ctx.moveTo(wfLeft, baseY);
          for (let i = 0; i < pts; i++) {
            const frac = i / (pts - 1);
            const px = wfLeft + frac * wfWidth;
            const windowEnv = Math.sin(frac * Math.PI);
            const rawSample = analyserNode ? (timeDomainBuffer[i * 2] - 128) / 128.0 : 0;
            const synthPulse = Math.cos(nowMs * 0.022 + i * 0.45) * 0.48;
            const signal = Math.abs(rawSample) > 0.01 ? rawSample * 1.2 : synthPulse;
            const py = baseY - signal * 34 * windowEnv;
            ctx.lineTo(px, py);
          }
          ctx.lineTo(wfRight, baseY);
          ctx.stroke();
        }
      }
      ctx.restore();
    } else {
      ctx.drawImage(processedAssets.origWaveformCanvas, 924, 560);
    }

    // 7. Sub-region F: Animated Cassette Tape Reels at (1193, 617) and (1264, 617)
    if (state.playbackState === 'PLAYING') {
      ctx.save();
      ctx.strokeStyle = MP3_PALETTE.primaryAmber;
      ctx.lineWidth = 2.4;
      for (const hubX of [1193, 1264]) {
        ctx.save();
        ctx.translate(hubX, 617);
        ctx.rotate(state.cassetteRotationRad);
        for (let k = 0; k < 3; k++) {
          const ang = (k * Math.PI) / 3;
          ctx.beginPath();
          ctx.moveTo(Math.cos(ang) * -8, Math.sin(ang) * -8);
          ctx.lineTo(Math.cos(ang) * 8, Math.sin(ang) * 8);
          ctx.stroke();
        }
        ctx.restore();
      }
      ctx.restore();
    }

    // 8. Sub-region G: Digital Timer MM:SS under TIME ELAPSED (x: 1375..1635, y: 572..625)
    const displaySeconds = state.showRemainingTime
      ? Math.max(0, state.duration - state.currentTime)
      : state.currentTime;
    const timeStr = formatTimeMMSS(displaySeconds, state.showRemainingTime);
    drawTechnoVectorText(ctx, timeStr, 1375, 572, 52, {
      color: MP3_PALETTE.primaryAmber,
      glowColor: MP3_PALETTE.coreNeonAmber,
      glowBlur: 4,
      strokeWidth: 9.0,
      trackingPx: 9,
      widthScale: 0.96,
    });

    // 9. Sub-region H: 10-Segment Rising VOLUME Bar Meter (x: 1515..1667, y: 665..691)
    const effectiveVol = state.muted ? 0 : state.volume;
    const litBars = Math.round(effectiveVol * 10);
    ctx.save();
    for (let i = 0; i < 10; i++) {
      const bx = 1515 + i * 15;
      const bh = 11 + Math.round((i / 9) * 13);
      const by = 690 - bh;
      const isLit = i < litBars;
      ctx.fillStyle = isLit ? MP3_PALETTE.primaryAmber : MP3_PALETTE.dimSegmentAmber;
      ctx.shadowColor = MP3_PALETTE.coreNeonAmber;
      ctx.shadowBlur = isLit ? 3 : 0;
      ctx.fillRect(bx, by, 10, bh);
    }
    ctx.restore();

    // 10. Sub-region I: Reactive 8x5 Dot-Matrix Spectrum Grid (x: 1762..1894, y: 574..637)
    // Note: "128 KBPS" at x: 1912..1995, y: 577..637 is preserved directly from mp3.jpeg!
    if (state.playbackState === 'PLAYING') {
      ctx.save();
      ctx.fillStyle = MP3_PALETTE.primaryAmber;
      const gridLeft = 1765;
      const gridBot = 635;
      const colW = 16;
      const rowH = 12;
      for (let col = 0; col < 8; col++) {
        const fftMag = analyserNode ? freqDomainBuffer[col * 3 + 1] / 255.0 : 0;
        const synthMag = 0.25 + 0.65 * Math.abs(Math.sin(nowMs * 0.009 + col * 0.8));
        const mag = fftMag > 0.05 ? fftMag : synthMag;
        const activeCells = Math.min(5, Math.max(1, Math.round(mag * 5)));
        for (let r = 0; r < activeCells; r++) {
          ctx.globalAlpha = 0.32 + (r / 5) * 0.48;
          ctx.fillRect(gridLeft + col * colW + 1, gridBot - (r + 1) * rowH + 1, colW - 3, rowH - 3);
        }
      }
      ctx.restore();
    }

    // Transient mode/track notice at bottom-right footer (x: 1738..1998, y: 666..694)
    if (state.footerNoticeTimer > 0 && state.footerNoticeText) {
      ctx.save();
      ctx.fillStyle = MP3_PALETTE.oledCoreSubstrate;
      ctx.fillRect(1736, 664, 264, 32);
      drawTechnoVectorText(ctx, state.footerNoticeText, 1868, 669, 20, {
        align: 'center',
        color: MP3_PALETTE.primaryAmber,
        glowBlur: 2,
        strokeWidth: 3.6,
        trackingPx: 4,
        widthScale: 0.88,
      });
      ctx.restore();
    }

    // 11. Interactive Hardware Switch & Button Visual Feedback on Chassis
    // Left LED (SHUFFLE indicator) at (1665, 738)..(1758, 772)
    if (state.shuffle) {
      ctx.save();
      ctx.fillStyle = '#ffcf40';
      ctx.shadowColor = MP3_PALETTE.primaryAmber;
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.roundRect(1672, 745, 78, 17, 8);
      ctx.fill();
      ctx.restore();
    }
    // Right LED (VISUALS indicator) at (1785, 738)..(1880, 772)
    if (state.visualsMode !== 'WAVE') {
      ctx.save();
      ctx.fillStyle = MP3_PALETTE.primaryAmber;
      ctx.shadowColor = MP3_PALETTE.coreNeonAmber;
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.roundRect(1793, 745, 78, 17, 8);
      ctx.fill();
      ctx.restore();
    }

    // Active / Pressed / Hovered button bevel highlight & mechanical depression shift
    for (const ctrl of MP3_CONTROL_HIT_ZONES) {
      const isPressed = state.activePressedButtonId === ctrl.id;
      const isHovered = state.hoveredControlId === ctrl.id;
      const isActiveMode =
        (ctrl.id === 'BTN_PLAY' && state.playbackState === 'PLAYING') ||
        (ctrl.id === 'BTN_PAUSE' && state.playbackState === 'PAUSED') ||
        (ctrl.id === 'BTN_REPEAT' && state.repeatMode !== 'ALL') ||
        (ctrl.id === 'BTN_PLAYBACK' && state.showTracklistOnScreen) ||
        (ctrl.id === 'SW_SHUFFLE' && state.shuffle) ||
        (ctrl.id === 'SW_LOOP_VIS' && state.visualsMode !== 'WAVE');

      const { x1, y1, x2, y2 } = ctrl.capPx;
      const bw = x2 - x1;
      const bh = y2 - y1;

      if (isPressed && processedAssets.buttonCapSprites[ctrl.id]) {
        ctx.save();
        ctx.drawImage(processedAssets.buttonCapSprites[ctrl.id], x1, y1 + 3);
        ctx.strokeStyle = MP3_PALETTE.primaryAmber;
        ctx.lineWidth = 3.5;
        ctx.strokeRect(x1 + 2, y1 + 2, bw - 4, bh - 4);
        ctx.restore();
      } else if (isActiveMode || isHovered) {
        ctx.save();
        ctx.strokeStyle = isActiveMode ? MP3_PALETTE.primaryAmber : MP3_PALETTE.warmSecondaryAmber;
        ctx.shadowColor = MP3_PALETTE.coreNeonAmber;
        ctx.shadowBlur = isActiveMode ? 10 : 5;
        ctx.lineWidth = isActiveMode ? 3.2 : 2.0;
        ctx.strokeRect(x1 + 2, y1 + 2, bw - 4, bh - 4);
        ctx.restore();
      }
    }

    ctx.restore();
    state.lastRenderDurationMs = Number((performance.now() - t0).toFixed(3));
  }

  // ============================================================================
  // DOM Construction, Hit-Zone Wiring & Event Isolation (§5)
  // ============================================================================

  function updateButtonAriaStates() {
    for (const [id, btn] of buttonEls.entries()) {
      let pressed = false;
      if (id === 'BTN_PLAY') pressed = state.playbackState === 'PLAYING';
      if (id === 'BTN_PAUSE') pressed = state.playbackState === 'PAUSED';
      if (id === 'BTN_STOP') pressed = state.playbackState === 'STOPPED';
      if (id === 'BTN_REPEAT') pressed = state.repeatMode !== 'ALL';
      if (id === 'BTN_PLAYBACK') pressed = state.showTracklistOnScreen;
      if (id === 'SW_SHUFFLE') pressed = state.shuffle;
      if (id === 'SW_LOOP_VIS') pressed = state.visualsMode !== 'WAVE';
      btn.setAttribute('aria-pressed', String(pressed));
    }
  }

  function handleControlAction(controlId) {
    triggerTactileClick('onSelect');
    switch (controlId) {
      case 'BTN_PLAY':
        playCurrentTrack();
        break;
      case 'BTN_PAUSE':
        pauseCurrentTrack();
        break;
      case 'BTN_STOP':
        stopCurrentTrack();
        break;
      case 'BTN_REPEAT':
        cycleRepeatMode();
        break;
      case 'BTN_PREV':
        prevTrack();
        break;
      case 'BTN_NEXT':
        nextTrack();
        break;
      case 'BTN_PLAYBACK':
        togglePlaybackTracklist();
        break;
      case 'SW_SHUFFLE':
        toggleShuffle();
        break;
      case 'SW_LOOP_VIS':
        cycleVisualsMode();
        break;
      default:
        break;
    }
    renderFrame(performance.now());
  }

  function clientPointToNativeCoords(clientX, clientY) {
    if (!displayCanvas) return null;
    const rect = displayCanvas.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return null;
    const normX = (clientX - rect.left) / rect.width;
    const normY = (clientY - rect.top) / rect.height;
    return {
      x: MP3_CHASSIS_CROP.x + normX * MP3_CHASSIS_CROP.w,
      y: MP3_CHASSIS_CROP.y + normY * MP3_CHASSIS_CROP.h,
    };
  }

  function isPointInsideChassis(nativeX, nativeY) {
    const ix = Math.round(nativeX);
    const iy = Math.round(nativeY);
    if (
      ix < MP3_CHASSIS_CROP.x ||
      ix >= MP3_CHASSIS_CROP.x + MP3_CHASSIS_CROP.w ||
      iy < MP3_CHASSIS_CROP.y ||
      iy >= MP3_CHASSIS_CROP.y + MP3_CHASSIS_CROP.h
    ) {
      return false;
    }
    if (processedAssets && processedAssets.exteriorMask) {
      return processedAssets.exteriorMask[iy * MP3_NATIVE_WIDTH + ix] === 0;
    }
    return true;
  }

  function buildDOM() {
    if (typeof document === 'undefined') return;

    const styleEl = document.createElement('style');
    styleEl.id = 'doom-tracks-mp3-hud-styles';
    styleEl.textContent = `
      #doom-tracks-mp3-backdrop {
        position: fixed;
        inset: 0;
        z-index: 95;
        background: radial-gradient(circle at center, rgba(24, 14, 5, 0.78) 0%, rgba(5, 3, 2, 0.92) 100%);
        backdrop-filter: blur(8px);
        -webkit-backdrop-filter: blur(8px);
        opacity: 0;
        pointer-events: none;
        cursor: pointer;
      }
      #doom-tracks-mp3-hud {
        position: fixed;
        z-index: 96;
        pointer-events: auto;
        user-select: none;
        -webkit-user-select: none;
        overflow: visible;
        filter: drop-shadow(0 20px 44px rgba(0, 0, 0, 0.86)) drop-shadow(0 0 22px rgba(255, 156, 11, 0.22));
      }
      #doom-tracks-mp3-hud.screen-only:hover {
        filter: drop-shadow(0 16px 36px rgba(0, 0, 0, 0.9)) drop-shadow(0 0 24px rgba(255, 165, 29, 0.42));
      }
      #doom-tracks-mp3-hud.hidden {
        opacity: 0;
        pointer-events: none;
        transform: translateY(14px) scale(0.97);
      }
      .doom-mp3-deck-clip {
        position: relative;
        width: 100%;
        height: 100%;
        overflow: hidden;
        box-sizing: border-box;
        border: 1.5px solid rgba(255, 165, 29, 0.45);
        border-radius: 10px;
      }
      .doom-mp3-deck-frame {
        position: absolute;
        left: 0;
        top: 0;
        width: 100%;
        height: 100%;
      }
      .doom-mp3-canvas {
        display: block;
        width: 100%;
        height: 100%;
        pointer-events: auto;
      }
      .doom-mp3-hit-btn {
        position: absolute;
        background: transparent;
        border: none;
        padding: 0;
        margin: 0;
        cursor: pointer;
        outline: none;
        border-radius: 6px;
        z-index: 3;
      }
      .doom-mp3-hit-btn:focus-visible {
        box-shadow: 0 0 0 2px #ffa51d;
      }
    `;
    document.head.appendChild(styleEl);

    backdropEl = document.createElement('div');
    backdropEl.id = 'doom-tracks-mp3-backdrop';
    backdropEl.setAttribute('aria-hidden', 'true');
    backdropEl.title = 'Click outside MP3 player to minimize';
    for (const evtName of ['pointerdown', 'mousedown', 'mouseup', 'click', 'dblclick', 'wheel', 'contextmenu']) {
      backdropEl.addEventListener(evtName, (e) => {
        e.stopPropagation();
        if (evtName === 'click' || evtName === 'pointerdown') {
          if (state.targetMorphProgress > 0.5) {
            collapseToScreenOnly();
          }
        }
      });
    }
    document.body.appendChild(backdropEl);

    rootEl = document.createElement('section');
    rootEl.id = 'doom-tracks-mp3-hud';
    rootEl.setAttribute('aria-label', 'DOOM TRACKS SYS-990-AMBER MP3 Player');
    rootEl.title = 'Click screen to expand DOOM TRACKS MP3 Player';
    if (!state.visible) {
      rootEl.classList.add('hidden');
    }

    deckClipEl = document.createElement('div');
    deckClipEl.className = 'doom-mp3-deck-clip';

    deckFrameEl = document.createElement('div');
    deckFrameEl.className = 'doom-mp3-deck-frame';

    displayCanvas = document.createElement('canvas');
    displayCanvas.id = 'doom-tracks-mp3-canvas';
    displayCanvas.className = 'doom-mp3-canvas';
    displayCanvas.width = MP3_CHASSIS_CROP.w;
    displayCanvas.height = MP3_CHASSIS_CROP.h;
    displayCtx = displayCanvas.getContext('2d');
    deckFrameEl.appendChild(displayCanvas);

    // Create transparent accessible <button> overlays for the 7 transport buttons & 2 switches
    for (const ctrl of MP3_CONTROL_HIT_ZONES) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.id = `doom-mp3-${ctrl.key}-btn`;
      btn.className = 'doom-mp3-hit-btn';
      btn.dataset.controlId = ctrl.id;
      btn.title = ctrl.label;
      btn.setAttribute('aria-label', ctrl.label);

      const leftPct = ((ctrl.px.x1 - MP3_CHASSIS_CROP.x) / MP3_CHASSIS_CROP.w) * 100;
      const topPct = ((ctrl.px.y1 - MP3_CHASSIS_CROP.y) / MP3_CHASSIS_CROP.h) * 100;
      const widthPct = ((ctrl.px.x2 - ctrl.px.x1) / MP3_CHASSIS_CROP.w) * 100;
      const heightPct = ((ctrl.px.y2 - ctrl.px.y1) / MP3_CHASSIS_CROP.h) * 100;

      btn.style.left = `${leftPct.toFixed(3)}%`;
      btn.style.top = `${topPct.toFixed(3)}%`;
      btn.style.width = `${widthPct.toFixed(3)}%`;
      btn.style.height = `${heightPct.toFixed(3)}%`;

      btn.addEventListener('pointerenter', () => {
        if (state.targetMorphProgress < 0.5) return;
        state.hoveredControlId = ctrl.id;
        triggerTactileClick('onHover');
      });
      btn.addEventListener('pointerleave', () => {
        if (state.hoveredControlId === ctrl.id) {
          state.hoveredControlId = null;
        }
        if (state.activePressedButtonId === ctrl.id) {
          state.activePressedButtonId = null;
        }
      });
      btn.addEventListener('pointerdown', (e) => {
        if (state.targetMorphProgress < 0.5) return;
        e.stopPropagation();
        state.activePressedButtonId = ctrl.id;
        renderFrame(performance.now());
      });
      btn.addEventListener('pointerup', (e) => {
        if (state.targetMorphProgress < 0.5) return;
        e.stopPropagation();
        state.activePressedButtonId = null;
      });
      btn.addEventListener('click', (e) => {
        if (state.targetMorphProgress < 0.5) {
          e.stopPropagation();
          expandToFullTakeover();
          return;
        }
        e.stopPropagation();
        state.activePressedButtonId = null;
        handleControlAction(ctrl.id);
      });

      deckFrameEl.appendChild(btn);
      buttonEls.set(ctrl.id, btn);
    }

    // Screen & Chassis pointer interaction:
    // - In SCREEN_ONLY mode (targetMorphProgress === 0): clicking anywhere on the screen expands the full MP3 takeover.
    // - In FULL_TAKEOVER mode (targetMorphProgress === 1): clicking outside the octagonal chassis collapses back to SCREEN_ONLY;
    //   clicking interactive screen regions scrubs progress/volume or toggles timer/tracklist.
    displayCanvas.addEventListener('pointerdown', (e) => {
      e.stopPropagation();
      if (state.targetMorphProgress < 0.5) {
        return;
      }

      const pt = clientPointToNativeCoords(e.clientX, e.clientY);
      if (!pt) return;

      // If user clicked in the transparent exterior corners outside the octagonal MP3 chassis, animate back down!
      if (!isPointInsideChassis(pt.x, pt.y)) {
        collapseToScreenOnly();
        return;
      }

      // 1. Check Progress Bar hit zone
      const pb = MP3_SCREEN_HIT_ZONES.progressBar;
      if (pt.x >= pb.x1 && pt.x <= pb.x2 && pt.y >= pb.y1 && pt.y <= pb.y2) {
        state.isScrubbingProgress = true;
        const frac = (pt.x - 1375) / 616;
        seekToFraction(frac);
        displayCanvas.setPointerCapture(e.pointerId);
        renderFrame(performance.now());
        return;
      }

      // 2. Check Volume Meter hit zone
      const vm = MP3_SCREEN_HIT_ZONES.volumeMeter;
      if (pt.x >= vm.x1 && pt.x <= vm.x2 && pt.y >= vm.y1 && pt.y <= vm.y2) {
        state.isScrubbingVolume = true;
        const volFrac = (pt.x - 1512) / 155;
        setVolume(volFrac);
        displayCanvas.setPointerCapture(e.pointerId);
        renderFrame(performance.now());
        return;
      }

      // 3. Check Digital Timer toggle (elapsed vs remaining)
      const tm = MP3_SCREEN_HIT_ZONES.timerReadout;
      if (pt.x >= tm.x1 && pt.x <= tm.x2 && pt.y >= tm.y1 && pt.y <= tm.y2) {
        state.showRemainingTime = !state.showRemainingTime;
        showFooterNotice(state.showRemainingTime ? 'TIME REMAIN' : 'TIME ELAPSED', 1.2);
        renderFrame(performance.now());
        return;
      }

      // 4. Check Track Title banner click when in tracklist selector mode
      const tb = MP3_SCREEN_HIT_ZONES.titleBanner;
      if (pt.x >= tb.x1 && pt.x <= tb.x2 && pt.y >= tb.y1 && pt.y <= tb.y2) {
        if (state.showTracklistOnScreen) {
          nextTrack();
        } else {
          togglePlaybackTracklist();
        }
        renderFrame(performance.now());
      }
    });

    displayCanvas.addEventListener('click', (e) => {
      e.stopPropagation();
      if (state.targetMorphProgress < 0.5) {
        expandToFullTakeover();
      }
    });

    displayCanvas.addEventListener('pointermove', (e) => {
      if (state.isScrubbingProgress) {
        e.stopPropagation();
        const pt = clientPointToNativeCoords(e.clientX, e.clientY);
        if (pt) {
          seekToFraction((pt.x - 1375) / 616);
          renderFrame(performance.now());
        }
      } else if (state.isScrubbingVolume) {
        e.stopPropagation();
        const pt = clientPointToNativeCoords(e.clientX, e.clientY);
        if (pt) {
          setVolume((pt.x - 1512) / 155);
          renderFrame(performance.now());
        }
      }
    });

    const endScrub = (e) => {
      if (state.isScrubbingProgress || state.isScrubbingVolume) {
        e.stopPropagation();
        state.isScrubbingProgress = false;
        state.isScrubbingVolume = false;
      }
    };
    displayCanvas.addEventListener('pointerup', endScrub);
    displayCanvas.addEventListener('pointercancel', endScrub);

    // Isolate pointer/wheel events from triggering 3D camera orbit or scroll-walk (§5)
    for (const evtName of ['mousedown', 'mouseup', 'click', 'dblclick', 'wheel', 'contextmenu']) {
      rootEl.addEventListener(evtName, (e) => {
        e.stopPropagation();
      });
    }

    if (typeof window !== 'undefined') {
      window.addEventListener('resize', () => {
        applyMorphLayout();
      });
      window.addEventListener('keydown', (e) => {
        if (e.code === 'Escape' && state.visible && state.targetMorphProgress > 0.5) {
          e.preventDefault();
          collapseToScreenOnly();
        }
      });
    }

    deckClipEl.appendChild(deckFrameEl);
    rootEl.appendChild(deckClipEl);
    document.body.appendChild(rootEl);
    applyMorphLayout();
    updateButtonAriaStates();
  }

  function setVisible(visibleBool) {
    state.visible = Boolean(visibleBool);
    if (rootEl) {
      rootEl.classList.toggle('hidden', !state.visible);
    }
    const hudToggleBtn = document.getElementById('hud-toggle-mp3-btn');
    if (hudToggleBtn) {
      hudToggleBtn.textContent = state.visible ? 'DOOM TRACKS MP3: ON (U)' : 'DOOM TRACKS MP3: OFF (U)';
    }
    applyMorphLayout();
    if (state.visible) {
      renderFrame(performance.now());
    }
    return state.visible;
  }

  function toggleVisible() {
    return setVisible(!state.visible);
  }

  function expandToFullTakeover() {
    return setExpanded(true);
  }

  function collapseToScreenOnly() {
    return setExpanded(false);
  }

  function setExpanded(expandedBool, immediate = false) {
    const target = expandedBool ? 1.0 : 0.0;
    const changed = state.targetMorphProgress !== target;
    state.targetMorphProgress = target;
    state.expanded = Boolean(expandedBool);

    if (immediate) {
      state.morphProgress = target;
      state.displayMode = target >= 1.0 ? 'FULL_TAKEOVER' : 'SCREEN_ONLY';
    } else if (state.morphProgress !== target) {
      state.displayMode = target >= 1.0 ? 'EXPANDING' : 'COLLAPSING';
    } else {
      state.displayMode = target >= 1.0 ? 'FULL_TAKEOVER' : 'SCREEN_ONLY';
    }

    if (rootEl) {
      rootEl.title = state.expanded
        ? 'DOOM TRACKS MP3 Player (Click outside to minimize)'
        : 'Click screen to expand DOOM TRACKS MP3 Player';
    }

    if (changed) {
      triggerTactileClick(state.expanded ? 'onActivate' : 'onDeactivate');
    }

    state.lastFrameTimeMs = performance.now();
    applyMorphLayout();
    if (state.visible) {
      renderFrame(performance.now());
    }
    return state.expanded;
  }

  function toggleExpanded() {
    return setExpanded(state.targetMorphProgress < 0.5);
  }

  function setTrackCatalog(tracksArray) {
    if (!Array.isArray(tracksArray) || tracksArray.length === 0) return state.tracks;
    state.tracks = tracksArray.map((t, idx) => ({
      id: t.id || `track_${idx + 1}`,
      title: String(t.title || `TRACK ${idx + 1}`).toUpperCase(),
      src: String(t.src || ''),
      duration: Number(t.duration) || 32,
      bitrateKbps: Number(t.bitrateKbps) || 128,
      format: String(t.format || 'MP3 / STEREO').toUpperCase(),
    }));
    loadTrackAtIndex(0, state.playbackState === 'PLAYING');
    return state.tracks;
  }

  // Load assets/mp3.jpeg and optional assets/tracks/manifest.json
  async function init() {
    buildDOM();

    // Load track catalog manifest if present in repository
    try {
      const resp = await fetch(manifestUrl);
      if (resp.ok) {
        const json = await resp.json();
        if (json && Array.isArray(json.tracks) && json.tracks.length > 0) {
          state.tracks = json.tracks.map((t, idx) => ({
            id: t.id || `track_${idx + 1}`,
            title: String(t.title || `TRACK ${idx + 1}`).toUpperCase(),
            src: String(t.src || ''),
            duration: Number(t.duration) || 32,
            bitrateKbps: Number(t.bitrateKbps) || 128,
            format: String(t.format || 'MP3 / STEREO').toUpperCase(),
          }));
        }
      }
    } catch (_e) {
      // Keep DOOM_TRACKS_DEFAULT_CATALOG
    }

    loadTrackAtIndex(0, false);

    await new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        try {
          processedAssets = processMp3ChassisBitmap(img);
          state.initialized = true;
          applyMorphLayout();
          renderFrame(performance.now());
          resolve();
        } catch (err) {
          reject(err);
        }
      };
      img.onerror = () => {
        reject(new Error(`Failed to load MP3 reference asset at ${assetSrc}`));
      };
      img.src = assetSrc;
    });

    return api;
  }

  const initPromise = init();

  const api = {
    state,
    initPromise,
    audioElement: audioEl,
    get visible() {
      return state.visible;
    },
    get expanded() {
      return state.expanded;
    },
    get displayMode() {
      return state.displayMode;
    },
    get morphProgress() {
      return state.morphProgress;
    },
    get playbackState() {
      return state.playbackState;
    },
    get currentTrack() {
      return state.tracks[state.currentTrackIndex] || null;
    },
    get currentTrackIndex() {
      return state.currentTrackIndex;
    },
    get tracks() {
      return state.tracks;
    },
    isExpanded: () => state.targetMorphProgress > 0.5,
    expand: expandToFullTakeover,
    collapse: collapseToScreenOnly,
    play: playCurrentTrack,
    pause: pauseCurrentTrack,
    togglePlayPause: () => (state.playbackState === 'PLAYING' ? pauseCurrentTrack() : playCurrentTrack()),
    stop: stopCurrentTrack,
    next: nextTrack,
    prev: prevTrack,
    cycleRepeatMode,
    togglePlaybackTracklist,
    toggleShuffle,
    cycleVisualsMode,
    seekToFraction,
    setVolume,
    setTrackCatalog,
    selectTrack: (index, autoPlay = true) => loadTrackAtIndex(index, autoPlay),
    setVisible,
    toggleVisible,
    setExpanded,
    toggleExpanded,
    update: (nowMs = performance.now()) => renderFrame(nowMs),
  };

  return api;
}
