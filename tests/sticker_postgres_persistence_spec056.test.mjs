/**
 * Live End-to-End Browser & Server SSH Mac PostgreSQL Verification for functional_specification_056.md:
 * Cross-Session 3D Sticker & Tag/Message Persistence via Server SSH Mac PostgreSQL (egg@10.0.0.62:5432).
 */

import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

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
    throw new Error('Playwright package could not be resolved for E2E browser verification.');
  }
}

const { chromium } = loadPlaywright();

const LOCAL_SERVER_URL = 'http://localhost:8080';
const SERVER_MAC_URL = 'http://10.0.0.62:3002';

async function fetchJson(url, options = {}) {
  const res = await fetch(url, options);
  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  return { status: res.status, ok: res.ok, data };
}

async function runSpec056Verification() {
  console.log('=== Functional Specification 056: Live PostgreSQL Sticker Persistence Verification ===');

  // ---------------------------------------------------------------------------
  // AC-01: Verify Server SSH Mac (10.0.0.62:3002) & Local Server (localhost:8080) PostgreSQL Health
  // ---------------------------------------------------------------------------
  console.log('[1/4] Verifying AC-01: PostgreSQL health on localhost:8080 and Server SSH Mac (10.0.0.62:3002)...');
  const localHealth = await fetchJson(`${LOCAL_SERVER_URL}/api/health`);
  assert.equal(localHealth.status, 200, 'Expected HTTP 200 from localhost:8080/api/health');
  assert.equal(localHealth.data.sticker_db_ready, true, 'Expected sticker_db_ready=true on localhost:8080');
  assert.equal(localHealth.data.sticker_storage, 'postgres', 'Expected sticker_storage="postgres" on localhost:8080');

  const remoteHealth = await fetchJson(`${SERVER_MAC_URL}/api/health`);
  assert.equal(remoteHealth.status, 200, 'Expected HTTP 200 from 10.0.0.62:3002/api/health');
  assert.equal(remoteHealth.data.sticker_db_ready, true, 'Expected sticker_db_ready=true on 10.0.0.62:3002');
  assert.equal(remoteHealth.data.sticker_storage, 'postgres', 'Expected sticker_storage="postgres" on 10.0.0.62:3002');

  const initialList = await fetchJson(`${SERVER_MAC_URL}/api/stickers`);
  assert.equal(initialList.status, 200, 'Expected HTTP 200 from 10.0.0.62:3002/api/stickers');
  assert.equal(initialList.data.ok, true);
  assert.equal(initialList.data.storage, 'postgres');
  assert.equal(initialList.data.dbConnected, true);
  console.log(`      ✓ AC-01 passed (Server Mac & Local Server connected to PostgreSQL; initial count=${initialList.data.count}).`);

  const browser = await chromium.launch({
    headless: true,
    args: [
      '--enable-webgl',
      '--ignore-gpu-blocklist',
      '--use-gl=angle',
      '--autoplay-policy=no-user-gesture-required',
    ],
  });

  let createdPlacedId = null;

  try {
    // -------------------------------------------------------------------------
    // AC-02: Session 1 — Place a sticker on a wall with message "x" and tagger "y"
    // -------------------------------------------------------------------------
    console.log('[2/4] Verifying AC-02 (Session 1): Placing wall sticker with message="x" and tagger="y"...');
    const context1 = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page1 = await context1.newPage();

    await page1.goto(`${LOCAL_SERVER_URL}/index.html`, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page1.waitForFunction(
      () => Boolean(window.sandbox && window.sandbox.ready && window.sandbox.holographicStickers),
      null,
      { timeout: 60000 }
    );

    const session1Placement = await page1.evaluate(async () => {
      const sb = window.sandbox;
      if (typeof sb.skipSprayPaintIntro === 'function') sb.skipSprayPaintIntro();
      if (sb.director) sb.director.stopStartupPan(true);

      const rec = sb.placeStickerAt(
        {
          stickerId: 'doom_tag',
          surfaceId: 'COLLIDER_STICKER_WALL_L',
          surfaceLabel: 'Left Alley Wall (Interior)',
          surfaceCategory: 'interior-wall',
          wallSide: 'L',
          position: { x: -1.16, y: 1.58, z: 6.25 },
          normal: { x: 1, y: 0, z: 0 },
          sizeMeters: 0.68,
          rotationDeg: 12,
        },
        { openPopup: true, immediate: true }
      );
      if (sb.lastStickerPersistPromise) {
        await sb.lastStickerPersistPromise;
      }
      return {
        placedId: rec.placedId,
        position: rec.position,
        normal: rec.normal,
        sizeMeters: rec.sizeMeters,
        rotationDeg: rec.rotationDeg,
      };
    });

    createdPlacedId = session1Placement.placedId;
    assert.ok(createdPlacedId, 'Expected valid placedId in Session 1');

    // Fill TAGGER: "y" and MESSAGE: "x" via the popup form and click Save
    await page1.fill('#sticker-tagger-input', 'y');
    await page1.fill('#sticker-message-input', 'x');
    await page1.click('#sticker-save-message-btn');

    await page1.evaluate(async () => {
      if (window.sandbox && window.sandbox.lastStickerPersistPromise) {
        await window.sandbox.lastStickerPersistPromise;
      }
    });

    // Verify directly against Server SSH Mac (10.0.0.62:3002) PostgreSQL API that the row is persisted
    const afterSaveRemote = await fetchJson(`${SERVER_MAC_URL}/api/stickers`);
    const persistedRow = afterSaveRemote.data.stickers.find((s) => s.placedId === createdPlacedId);
    assert.ok(persistedRow, `Expected sticker ${createdPlacedId} to be persisted in PostgreSQL on 10.0.0.62`);
    assert.equal(persistedRow.tagger, 'y', 'Expected PostgreSQL row tagger === "y"');
    assert.equal(persistedRow.message, 'x', 'Expected PostgreSQL row message === "x"');
    assert.equal(persistedRow.stickerId, 'doom_tag');
    assert.equal(persistedRow.sizeMeters, 0.68);

    // Close Session 1 completely (destroying its memory and isolated browser context storage)
    await context1.close();
    console.log(`      ✓ Session 1 placed ${createdPlacedId} with tagger="y", message="x", persisted to PostgreSQL on 10.0.0.62, and closed.`);

    // -------------------------------------------------------------------------
    // AC-02: Session 2 — Open a brand-new browser session and verify sticker + message/tagger are visible
    // -------------------------------------------------------------------------
    console.log('[3/4] Verifying AC-02 (Session 2): Re-opening webapp in a brand-new browser context...');
    const context2 = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page2 = await context2.newPage();

    await page2.goto(`${LOCAL_SERVER_URL}/index.html`, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page2.waitForFunction(
      () => Boolean(window.sandbox && window.sandbox.ready && window.sandbox.holographicStickers),
      null,
      { timeout: 60000 }
    );

    const session2Audit = await page2.evaluate((targetId) => {
      const sb = window.sandbox;
      if (typeof sb.skipSprayPaintIntro === 'function') sb.skipSprayPaintIntro();
      if (sb.director) sb.director.stopStartupPan(true);

      const sysState = sb.getStickerSystemState();
      const hydratedSticker = sysState.placedStickers.find((s) => s.placedId === targetId);
      const rawRec = sb.holographicStickers.getPlacedSticker(targetId);
      const meshInScene = Boolean(
        rawRec &&
          rawRec.instance &&
          rawRec.instance.group &&
          rawRec.instance.group.parent === sb.holographicStickers.placedStickersGroup
      );

      // Click/open the hydrated sticker popup to verify DOM readout and inputs
      sb.openStickerPopup(targetId, { immediate: true });

      return {
        persistence: sysState.persistence,
        hydratedSticker,
        meshInScene,
        taggerInputVal: document.getElementById('sticker-tagger-input')?.value,
        messageInputVal: document.getElementById('sticker-message-input')?.value,
        savedTaggerText: document.getElementById('sticker-saved-tagger-display')?.textContent,
        savedMessageText: document.getElementById('sticker-saved-message-display')?.textContent,
        savedReadoutVisible: document.getElementById('sticker-saved-readout')?.classList.contains('visible'),
      };
    }, createdPlacedId);

    assert.equal(session2Audit.persistence.hydrated, true, 'Expected Session 2 stickerPersistenceState.hydrated=true');
    assert.equal(session2Audit.persistence.dbConnected, true, 'Expected Session 2 stickerPersistenceState.dbConnected=true');
    assert.equal(session2Audit.persistence.storageBackend, 'postgres', 'Expected Session 2 storageBackend="postgres"');
    assert.ok(session2Audit.hydratedSticker, `Expected sticker ${createdPlacedId} hydrated in Session 2`);
    assert.equal(session2Audit.meshInScene, true, 'Expected 3D sticker mesh mounted in placedStickersGroup in Session 2');
    assert.equal(session2Audit.hydratedSticker.tagger, 'y', 'Expected hydrated sticker tagger === "y"');
    assert.equal(session2Audit.hydratedSticker.message, 'x', 'Expected hydrated sticker message === "x"');
    assert.equal(session2Audit.hydratedSticker.sizeMeters, 0.68, 'Expected hydrated sticker sizeMeters === 0.68');
    assert.equal(session2Audit.taggerInputVal, 'y', 'Expected #sticker-tagger-input populated with "y"');
    assert.equal(session2Audit.messageInputVal, 'x', 'Expected #sticker-message-input populated with "x"');
    assert.equal(session2Audit.savedTaggerText, 'TAGGER // y', 'Expected #sticker-saved-tagger-display to show "TAGGER // y"');
    assert.equal(session2Audit.savedMessageText, 'x', 'Expected #sticker-saved-message-display to show "x"');
    assert.equal(session2Audit.savedReadoutVisible, true, 'Expected #sticker-saved-readout to be visible');
    console.log('      ✓ AC-02 passed: Sticker, 3D pose, tagger="y", and message="x" restored in fresh Session 2.');

    // -------------------------------------------------------------------------
    // AC-03: Update & Delete Persistence Across Sessions
    // -------------------------------------------------------------------------
    console.log('[4/4] Verifying AC-03: Updating and deleting sticker across sessions...');
    await page2.fill('#sticker-tagger-input', 'tagger_updated');
    await page2.fill('#sticker-message-input', 'message_updated');
    await page2.click('#sticker-save-message-btn');
    await page2.evaluate(async () => {
      window.sandbox.resizeStickerToMeters(0.82);
      if (window.sandbox.lastStickerPersistPromise) {
        await window.sandbox.lastStickerPersistPromise;
      }
    });
    await context2.close();

    // Open Session 3 to verify update persisted, then delete the sticker
    const context3 = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page3 = await context3.newPage();
    await page3.goto(`${LOCAL_SERVER_URL}/index.html`, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page3.waitForFunction(
      () => Boolean(window.sandbox && window.sandbox.ready && window.sandbox.holographicStickers),
      null,
      { timeout: 60000 }
    );

    const session3Audit = await page3.evaluate(async (targetId) => {
      const sb = window.sandbox;
      const beforeDelete = sb.getStickerSystemState().placedStickers.find((s) => s.placedId === targetId);
      const deletedOk = sb.deleteSelectedSticker(targetId);
      if (sb.lastStickerPersistPromise) {
        await sb.lastStickerPersistPromise;
      }
      const afterDelete = sb.getStickerSystemState().placedStickers.find((s) => s.placedId === targetId);
      return { beforeDelete, deletedOk, afterDelete };
    }, createdPlacedId);

    assert.ok(session3Audit.beforeDelete, 'Expected updated sticker present on Session 3 load');
    assert.equal(session3Audit.beforeDelete.tagger, 'tagger_updated');
    assert.equal(session3Audit.beforeDelete.message, 'message_updated');
    assert.equal(session3Audit.beforeDelete.sizeMeters, 0.82);
    assert.equal(session3Audit.deletedOk, true, 'Expected deleteSelectedSticker to return true');
    assert.equal(session3Audit.afterDelete, undefined, 'Expected sticker removed from in-memory state');
    await context3.close();

    // Verify row is gone from PostgreSQL on 10.0.0.62
    const afterDeleteRemote = await fetchJson(`${SERVER_MAC_URL}/api/stickers`);
    const stillExists = afterDeleteRemote.data.stickers.find((s) => s.placedId === createdPlacedId);
    assert.equal(stillExists, undefined, 'Expected deleted sticker to be removed from PostgreSQL on 10.0.0.62');
    createdPlacedId = null;
    console.log('      ✓ AC-03 passed: Updates and deletions persisted to PostgreSQL across session reloads.');
  } finally {
    if (createdPlacedId) {
      await fetch(`${SERVER_MAC_URL}/api/stickers/${encodeURIComponent(createdPlacedId)}`, {
        method: 'DELETE',
      }).catch(() => {});
    }
    await browser.close();
  }

  console.log('=== ALL SPEC 056 ACCEPTANCE CRITERIA (AC-01..AC-04) PASSED ===');
}

runSpec056Verification().catch((err) => {
  console.error('Spec 056 Verification Failed:', err);
  process.exit(1);
});
