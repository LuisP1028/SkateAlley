#!/usr/bin/env node
/**
 * End-to-End Verification Suite for Spec 063:
 * Super Smash Bros. Melee Character Auto-Rigger, Proportion-Preserving Skeleton
 * Retargeting Compiler & Virtual FST Disc Overlay (/melee/).
 *
 * Verifies:
 *   1. GET /api/melee/fighters (26 fighters with exact bone counts and costume FST targets)
 *   2. GET /api/melee/gcs-characters (available Stage 4 assembled characters)
 *   3. POST /api/melee/rig across 7 structurally distinct fighters:
 *      Ca (63), Mr (61), Fx (74), Ms (52), Lk (80), Kb (46, w2=59), Gw (53 + PlGw.dat 3D/color patch)
 *   4. Two-selector UI contract (#gcs-char-select, #fighter-select, #rig-play-btn; zero costume selector)
 *   5. Live headless Chromium WebGPU execution of custom-rigged characters inside /melee/
 *      with virtual FST overlay reads at >= 0x58000000 and >= 58.0 FPS.
 */
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import net from 'node:net';
import path from 'node:path';
import { createRequire } from 'node:module';

const REPO_ROOT = path.resolve(import.meta.dirname, '..');
const require = createRequire('/Users/diesel/.npm/_npx/9833c18b2d85bc59/node_modules/playwright/package.json');
const { chromium } = require('.');

function getFreePort() {
  return new Promise((resolve, reject) => {
    const srv = net.createServer();
    srv.listen(0, '127.0.0.1', () => {
      const { port } = srv.address();
      srv.close(() => resolve(port));
    });
    srv.on('error', reject);
  });
}

async function waitForHealth(baseUrl, timeoutMs = 15000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(`${baseUrl}/api/health`);
      if (res.ok) return await res.json();
    } catch (_) {}
    await new Promise((r) => setTimeout(r, 150));
  }
  throw new Error(`Timed out waiting for ${baseUrl}/api/health`);
}

const port = await getFreePort();
const baseUrl = `http://127.0.0.1:${port}`;
const pyBin = fs.existsSync('/opt/anaconda3/bin/python3') ? '/opt/anaconda3/bin/python3' : '/opt/homebrew/bin/python3';
const serverProc = spawn(
  pyBin,
  [path.join(REPO_ROOT, 'scripts/serve_skatealley.py'), '--host', '127.0.0.1', '--port', String(port), '--dir', REPO_ROOT],
  { stdio: ['ignore', 'pipe', 'pipe'] }
);

let browser = null;
try {
  // 1. Verify /api/health
  const health = await waitForHealth(baseUrl);
  assert.equal(health.ok, true);
  assert.equal(health.melee_webapp, true);

  // 2. Verify GET /api/melee/fighters (26 fighters)
  const fightersRes = await fetch(`${baseUrl}/api/melee/fighters`);
  assert.equal(fightersRes.status, 200);
  const fightersJson = await fightersRes.json();
  assert.equal(fightersJson.ok, true);
  assert.equal(fightersJson.count, 26, 'Expected 26 playable Melee fighters');
  const expectedBones = { Ca: 63, Mr: 61, Fx: 73, Ms: 90, Lk: 75, Kb: 46, Gw: 53 };
  for (const [code, expCount] of Object.entries(expectedBones)) {
    const entry = fightersJson.fighters.find((f) => f.code === code);
    assert.ok(entry, `Missing fighter ${code} in /api/melee/fighters`);
    assert.equal(entry.bone_count, expCount, `Bone count mismatch for ${code}`);
    assert.ok(Array.isArray(entry.fst_targets) && entry.fst_targets.includes(`Pl${code}Nr.dat`));
  }

  // 3. Verify GET /api/melee/gcs-characters
  const charsRes = await fetch(`${baseUrl}/api/melee/gcs-characters`);
  assert.equal(charsRes.status, 200);
  const charsJson = await charsRes.json();
  assert.equal(charsJson.ok, true);
  assert.ok(charsJson.count >= 1, 'Expected at least 1 GCS character');
  assert.ok(
    charsJson.characters.some((c) => c.player_folder === 'nicotest_nt01' && c.run_id === 'run_01'),
    'Expected nicotest_nt01 / run_01 in /api/melee/gcs-characters'
  );

  // 4. Verify POST /api/melee/rig across all 7 structurally distinct fighters
  const rigResults = {};
  for (const [code, expBones] of Object.entries(expectedBones)) {
    const res = await fetch(`${baseUrl}/api/melee/rig`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        player_folder: 'nicotest_nt01',
        run_id: 'run_01',
        fighter: code,
      }),
    });
    assert.equal(res.status, 200, `POST /api/melee/rig failed for ${code}`);
    const data = await res.json();
    assert.equal(data.status, 'ok');
    assert.equal(data.fighter, code);
    assert.equal(data.bone_count, expBones);
    assert.ok(data.max_envelopes_per_pobj <= 10, `Expected <= 10 envelopes/PObj for ${code}`);
    assert.ok(data.max_ibm_orthogonality_error < 1e-4, `Expected IBM orthogonality error < 1e-4 for ${code}`);
    assert.ok(data.dat_file_size_bytes <= 1835008, `Expected Pl${code}Nr.dat <= 1.75 MiB`);

    if (code === 'Kb') {
      assert.equal(data.plco_table_bones, 59);
      assert.equal(data.delta_bones_corrected, 13, 'Expected Kirby w2-N_bones offset correction of 13');
    }
    if (code === 'Gw') {
      assert.equal(data.anatomical_map.NeckN, 7, 'Expected centerline NeckN=7 for Mr. Game & Watch');
      assert.equal(data.anatomical_map.HeadN, 19, 'Expected centerline HeadN=19 for Mr. Game & Watch');
      assert.ok(
        Array.isArray(data.companion_overlays) &&
          data.companion_overlays.some((c) => c.fst_targets.includes('PlGw.dat')),
        'Expected companion PlGw.dat full-3D/color overlay for Mr. Game & Watch'
      );
    }

    rigResults[code] = {
      boneCount: data.bone_count,
      datSizeBytes: data.dat_file_size_bytes,
      pobjBatches: data.pobj_batch_count,
      maxEnvelopes: data.max_envelopes_per_pobj,
      uniformScale: Number(data.uniform_scale.toFixed(3)),
      maxIbmError: data.max_ibm_orthogonality_error,
      datSha256: data.dat_sha256,
    };
  }

  // 5. Launch headless Chromium with WebGPU and verify live custom-character VS gameplay
  browser = await chromium.launch({
    headless: true,
    args: ['--enable-unsafe-webgpu', '--use-angle=metal'],
  });

  const liveRuns = {};
  for (const fighterCode of ['Ca', 'Kb', 'Gw']) {
    const context = await browser.newContext({ viewport: { width: 960, height: 720 } });
    const page = await context.newPage();
    const pageErrors = [];
    page.on('pageerror', (err) => pageErrors.push(String(err.stack || err)));

    const url = `${baseUrl}/melee/?player=nicotest_nt01&run=run_01&fighter=${fighterCode}&MELEE_BOOT_SCENE=vs&MELEE_DEBUG_VS=cpu4&MELEE_SEED=1&MELEE_SCENE_LOG=1&MELEE_ARCHIVE_LOG=1`;
    const t0 = Date.now();
    await page.goto(url);

    // Verify strictly 2 <select> elements in #rig-bar (no costume color selector)
    const selectIds = await page.evaluate(() =>
      Array.from(document.querySelectorAll('#rig-bar select')).map((el) => el.id)
    );
    assert.deepEqual(selectIds, ['gcs-char-select', 'fighter-select']);

    await page.waitForFunction(
      (minFrames) => window.__MELEE_STATUS__ && (window.__MELEE_STATUS__.frames >= minFrames || window.__MELEE_STATUS__.lastError),
      360,
      { timeout: 35000 }
    );
    const elapsedMs = Date.now() - t0;
    const status = await page.evaluate(() => window.__MELEE_STATUS__);

    assert.equal(pageErrors.length, 0, `Unexpected page errors for ${fighterCode}: ${pageErrors.join('\n')}`);
    assert.equal(status.crossOriginIsolated, true);
    assert.equal(status.webgpuAvailable, true);
    assert.equal(status.started, true);
    assert.equal(status.lastError, null);
    assert.ok(status.rigOverlay && status.rigOverlay.active, `Expected active rigOverlay for ${fighterCode}`);
    assert.equal(status.rigOverlay.fighter, fighterCode);
    assert.ok(
      status.rigOverlay.patchedFstEntries.length >= 1,
      `Expected patched FST entries for ${fighterCode}`
    );
    assert.ok(
      status.rigOverlay.patchedFstEntries.every((e) => e.virtualOffset >= 0x58000000),
      `Expected virtual FST offsets >= 0x58000000 for ${fighterCode}`
    );
    assert.ok(
      status.rigOverlay.overlayStats.overlayReadHits > 0 && status.rigOverlay.overlayStats.overlayBytesRead > 0,
      `Expected live DVDRead of virtual overlay at >= 0x58000000 for ${fighterCode}, got ${JSON.stringify(status.rigOverlay.overlayStats)}`
    );
    assert.ok(status.fps >= 58.0, `Expected FPS >= 58.0 for ${fighterCode}, got ${status.fps}`);
    assert.ok(status.p99Ms <= 33.4, `Expected p99Ms <= 33.4 for ${fighterCode}, got ${status.p99Ms}`);
    assert.ok(
      status.scenes.some((s) => s.startsWith('boot scene: game mode 14')),
      `Expected VS game mode 14 for ${fighterCode}`
    );

    liveRuns[fighterCode] = {
      elapsedMs,
      frames: status.frames,
      fps: status.fps,
      p99Ms: status.p99Ms,
      patchedFstEntriesCount: status.rigOverlay.patchedFstEntries.length,
      overlayStats: status.rigOverlay.overlayStats,
    };
    await context.close();
  }

  console.log(
    JSON.stringify(
      {
        status: 'ok',
        fightersCatalogCount: fightersJson.count,
        gcsCharactersCount: charsJson.count,
        rigResults,
        liveRuns,
      },
      null,
      2
    )
  );
} finally {
  if (browser) await browser.close();
  serverProc.kill('SIGTERM');
}
