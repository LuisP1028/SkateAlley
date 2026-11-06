/**
 * End-to-End Live Runtime & Mathematical Verification for functional_specification_067.md:
 * Levitating 3D Cyber-Drip Graffiti Screen Mount Headers — 26-Glyph Alphabet Atlas Extraction,
 * Stripped "STATION 0X" Titles, Desynchronized Holographic Flicker/Glitch Optics,
 * and 0.414m Vertical Clearance Envelope.
 */

import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

import {
  GRAFFITI_HEADER_GLITCH_FLICKER_SPEC,
  GRAFFITI_ALPHABET_GLYPH_MAP,
  GRAFFITI_STATION_HEADER_SCHEDULE,
  stripStationHeaderPrefix,
  evaluateHologramScreenFlickerAndGlitch,
  evaluateGraffitiHeaderFlickerAndGlitch,
  evaluateGraffitiHeaderLevitation,
} from '../alley_atmosphere_023.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '..');

function loadPlaywright() {
  const require = createRequire(import.meta.url);
  try {
    return require('playwright');
  } catch {
    const npxDir = '/Users/diesel/.npm/_npx';
    if (fs.existsSync(npxDir)) {
      const candidates = fs
        .readdirSync(npxDir)
        .map((d) => path.join(npxDir, d, 'node_modules', 'playwright'))
        .filter((p) => fs.existsSync(p));
      if (candidates.length > 0) {
        return require(candidates[candidates.length - 1]);
      }
    }
    throw new Error('Playwright package could not be resolved for E2E verification.');
  }
}

const { chromium } = loadPlaywright();

async function runVerification() {
  console.log('================================================================');
  console.log('SPEC 067 LEVITATING GRAFFITI HEADERS VERIFICATION SUITE');
  console.log('================================================================');

  // -------------------------------------------------------------------------
  // Phase 1: Pure Mathematical & Atlas Asset Verification
  // -------------------------------------------------------------------------
  console.log('\n[Phase 1] Verifying 26-Glyph Atlas Asset & Desynchronized Math...');

  const atlasPngPath = path.join(REPO_ROOT, 'assets', 'graffiti_alphabet_atlas.png');
  const atlasJsonPath = path.join(REPO_ROOT, 'assets', 'graffiti_alphabet_atlas.json');
  assert.ok(fs.existsSync(atlasPngPath), 'assets/graffiti_alphabet_atlas.png must exist');
  assert.ok(fs.existsSync(atlasJsonPath), 'assets/graffiti_alphabet_atlas.json must exist');

  const atlasMeta = JSON.parse(fs.readFileSync(atlasJsonPath, 'utf8'));
  assert.equal(atlasMeta.atlasDimensions[0], 1024, 'Atlas width must be 1024px (Spec 066 cap)');
  assert.equal(atlasMeta.atlasDimensions[1], 572, 'Atlas height must be 572px');

  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
  for (const ch of alphabet) {
    assert.ok(GRAFFITI_ALPHABET_GLYPH_MAP[ch], `Missing glyph spec for '${ch}'`);
    assert.ok(atlasMeta.glyphs[ch], `Missing JSON glyph entry for '${ch}'`);
    const [ax1, ay1, ax2, ay2] = GRAFFITI_ALPHABET_GLYPH_MAP[ch].atlasBounds;
    assert.ok(ax2 > ax1 && ay2 > ay1, `Invalid atlasBounds for '${ch}'`);
  }
  console.log('  ✓ All 26 uppercase glyphs (A-Z) verified in GRAFFITI_ALPHABET_GLYPH_MAP and atlas JSON.');

  // Verify prefix stripping and pure [A-Z] station schedule
  assert.equal(GRAFFITI_STATION_HEADER_SCHEDULE.length, 7, 'Expected 7 station header specs');
  for (const stSpec of GRAFFITI_STATION_HEADER_SCHEDULE) {
    assert.ok(!/STATION\s+\d+/i.test(stSpec.headerText), `Header '${stSpec.headerText}' must not contain STATION 0X`);
    assert.ok(/^[A-Z\s]+$/.test(stSpec.headerText), `Header '${stSpec.headerText}' must contain only [A-Z] and spaces`);
    for (const line of stSpec.headerLines) {
      assert.ok(/^[A-Z\s]+$/.test(line), `Header line '${line}' must contain only [A-Z] and spaces`);
    }
  }
  assert.equal(
    stripStationHeaderPrefix('STATION 04 // AI DATA ANALYTICS'),
    'AI DATA ANALYTICS',
    'stripStationHeaderPrefix must remove STATION 04 //'
  );
  console.log('  ✓ All 7 station header strings verified free of "STATION 0X //" prefixes.');

  // Verify mathematical desynchronization across multiple timestamps for all 7 stations
  const sampleTimestamps = [0.0, 0.15, 0.73, 1.42, 2.31, 3.68, 5.12, 8.45];
  for (let idx = 1; idx <= 7; idx++) {
    for (const t of sampleTimestamps) {
      const mountEval = evaluateHologramScreenFlickerAndGlitch(t, idx, 0.0);
      const hdrEval = evaluateGraffitiHeaderFlickerAndGlitch(t, idx, 0.0);
      assert.equal(hdrEval.syncedWithMount, false, 'Header syncedWithMount must be false');
      assert.notEqual(
        hdrEval.flickerGain,
        mountEval.flickerGain,
        `Header flickerGain must not equal mount flickerGain at t=${t}, station=${idx}`
      );
      assert.notEqual(
        hdrEval.scanbeamY,
        mountEval.scanbeamY,
        `Header scanbeamY must not equal mount scanbeamY at t=${t}, station=${idx}`
      );
      assert.notEqual(
        hdrEval.glitchIntensity,
        mountEval.glitchIntensity,
        `Header glitchIntensity must not equal mount glitchIntensity at t=${t}, station=${idx}`
      );
    }

    // Verify levitation vertical bounds & 1:1 isotropic aspect ratio across full cycle
    const pxAspectRatio =
      (GRAFFITI_HEADER_GLITCH_FLICKER_SPEC.planeWidthMeters /
        GRAFFITI_HEADER_GLITCH_FLICKER_SPEC.textureWidth) /
      (GRAFFITI_HEADER_GLITCH_FLICKER_SPEC.planeHeightMeters /
        GRAFFITI_HEADER_GLITCH_FLICKER_SPEC.textureHeight);
    assert.ok(
      Math.abs(pxAspectRatio - 1.0) < 1e-6,
      `Expected 1:1 unsquished pixel aspect ratio on 3D header plane, got ${pxAspectRatio}`
    );
    for (let step = 0; step < 32; step++) {
      const t = step * 0.15;
      const lev = evaluateGraffitiHeaderLevitation(t, idx);
      const minY = lev.worldCenterY - GRAFFITI_HEADER_GLITCH_FLICKER_SPEC.planeHeightMeters * 0.5;
      const maxY = lev.worldCenterY + GRAFFITI_HEADER_GLITCH_FLICKER_SPEC.planeHeightMeters * 0.5;
      assert.ok(minY >= 2.20, `Station ${idx} header bottom edge ${minY} must stay above 2.20m`);
      assert.ok(maxY <= 2.98, `Station ${idx} header top edge ${maxY} must stay within 2.98m`);
    }
  }
  console.log('  ✓ Desynchronized flicker/glitch, 1:1 unsquished aspect ratio, and enlarged 2.32m x 0.725m bounds verified across all 7 stations.');

  // -------------------------------------------------------------------------
  // Phase 2: Live Browser Runtime Verification
  // -------------------------------------------------------------------------
  console.log('\n[Phase 2] Booting live browser against http://localhost:8080/index.html...');
  const browser = await chromium.launch({
    headless: true,
    args: ['--use-gl=angle', '--use-angle=metal'],
  });

  const pageErrors = [];
  try {
    const context = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      deviceScaleFactor: 2.0,
    });
    const page = await context.newPage();

    page.on('pageerror', (err) => {
      console.error('  [Browser PageError]', err.message);
      pageErrors.push(err.message);
    });

    await page.goto('http://localhost:8080/index.html', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForFunction(() => window.__sandbox && window.__sandbox.ready && window.__sandbox.wallMounts?.length === 7, {
      timeout: 30000,
    });

    // Skip spray-paint intro and dismiss intro dialogue so we can inspect the corridor mounts in live 3D
    await page.evaluate(() => {
      if (window.__sandbox && window.__sandbox.skipSprayPaintIntro) {
        window.__sandbox.skipSprayPaintIntro();
      }
    });

    // Wait for graffiti_alphabet_atlas.png to finish compositing onto all 7 station header canvases
    await page.waitForFunction(
      () =>
        window.__sandbox.wallMounts.every(
          (m) => m.headerTexture && m.headerTexture.userData && m.headerTexture.userData.atlasRendered === true
        ),
      { timeout: 15000 }
    );
    console.log('  ✓ All 7 station header textures composited from assets/graffiti_alphabet_atlas.png.');

    // Advance clock and inspect all 7 mounts in free-roam / mounted state
    const runtimeReport = await page.evaluate(() => {
      const sb = window.__sandbox;
      sb.mode = 'freeroam';
      return sb.wallMounts.map((m) => {
        const tex = m.headerTexture;
        const canvas = tex ? tex.image : null;
        let nonZeroAlphaPixels = 0;
        if (canvas && canvas.getContext) {
          const ctx = canvas.getContext('2d');
          const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
          for (let i = 3; i < data.length; i += 16) {
            if (data[i] > 25) nonZeroAlphaPixels++;
          }
        }
        const hu = m.headerMat.uniforms;
        const mu = m.faceMat.uniforms;
        return {
          mountName: m.mountName,
          stationTitle: m.station.title,
          headerText: m.headerText,
          headerLines: m.headerLines,
          hasLevitatingHeader: m.hasLevitatingHeader,
          isHeaderLevitating: m.isHeaderLevitating,
          isHeaderFlickering: m.isHeaderFlickering,
          hasHeaderGlitchEffect: m.hasHeaderGlitchEffect,
          headerSyncedWithMount: m.headerSyncedWithMount,
          texWidth: canvas ? canvas.width : 0,
          texHeight: canvas ? canvas.height : 0,
          generateMipmaps: tex ? tex.generateMipmaps : true,
          atlasRendered: Boolean(tex?.userData?.atlasRendered),
          nonZeroAlphaPixels,
          headerLocalY: m.headerLocalY,
          headerHoverOffsetY: m.headerHoverOffsetY,
          headerRollZ: m.headerRollZ,
          headerFlickerGain: hu.uFlickerGain.value,
          mountFlickerGain: mu.uFlickerGain.value,
          headerScanbeamY: hu.uScanbeamY.value,
          mountScanbeamY: mu.uScanbeamY.value,
          headerFrontVisible: m.headerFrontMesh.visible,
          headerBackVisible: m.headerBackMesh.visible,
        };
      });
    });

    for (const r of runtimeReport) {
      console.log(
        `  ✓ ${r.mountName}: "${r.headerLines.join(' / ')}" | tex=${r.texWidth}x${r.texHeight} (alphaPx=${r.nonZeroAlphaPixels}) | hdrFlicker=${r.headerFlickerGain} vs mountFlicker=${r.mountFlickerGain} | localY=${r.headerLocalY}m`
      );
      assert.equal(r.hasLevitatingHeader, true);
      assert.equal(r.isHeaderLevitating, true);
      assert.equal(r.isHeaderFlickering, true);
      assert.equal(r.hasHeaderGlitchEffect, true);
      assert.equal(r.headerSyncedWithMount, false);
      assert.ok(!/STATION\s+\d+/i.test(r.stationTitle), `Station title '${r.stationTitle}' must not have STATION 0X prefix`);
      assert.ok(!/STATION\s+\d+/i.test(r.headerText), `Header text '${r.headerText}' must not have STATION 0X prefix`);
      assert.equal(r.texWidth, 1024);
      assert.equal(r.texHeight, 320);
      assert.equal(r.generateMipmaps, false);
      assert.equal(r.atlasRendered, true);
      assert.ok(r.nonZeroAlphaPixels > 300, `Expected > 300 sampled opaque glyph pixels on ${r.mountName}, got ${r.nonZeroAlphaPixels}`);
      assert.notEqual(r.headerFlickerGain, r.mountFlickerGain, `Live headerFlickerGain must differ from mountFlickerGain on ${r.mountName}`);
      assert.notEqual(r.headerScanbeamY, r.mountScanbeamY, `Live headerScanbeamY must differ from mountScanbeamY on ${r.mountName}`);
    }

    // Verify dynamic levitation motion over 400ms
    await page.waitForTimeout(450);
    const secondSample = await page.evaluate(() =>
      window.__sandbox.wallMounts.map((m) => ({
        mountName: m.mountName,
        headerLocalY: m.headerLocalY,
        headerFlickerGain: m.headerMat.uniforms.uFlickerGain.value,
      }))
    );
    let movedCount = 0;
    for (let i = 0; i < 7; i++) {
      if (secondSample[i].headerLocalY !== runtimeReport[i].headerLocalY) {
        movedCount++;
      }
    }
    assert.ok(movedCount >= 5, `Expected levitating headers to oscillate over time, movedCount=${movedCount}`);
    console.log(`  ✓ Live 3D levitation oscillation verified across ${movedCount}/7 stations.`);

    assert.equal(pageErrors.length, 0, `Unexpected browser page errors: ${pageErrors.join('; ')}`);
    console.log('\n================================================================');
    console.log('ALL SPEC 067 VERIFICATION CHECKS PASSED WITH ZERO ERRORS!');
    console.log('================================================================');
  } finally {
    await browser.close();
  }
}

runVerification().catch((err) => {
  console.error('\n❌ SPEC 067 VERIFICATION FAILURE:', err);
  process.exit(1);
});
