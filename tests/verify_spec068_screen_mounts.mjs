/**
 * End-to-End Live Runtime Verification for functional_specification_068.md:
 * Screen Mount & Focused Holographic Terminal Revision — Header & Footer Removal,
 * Top-Right Exit Control Relocation, Persistent Amber-Themed Mobile/Desktop Scrollbar,
 * Enlarged Description Typography, Interactive "+" Tag Bubbles with Animated Pop-Up
 * Descriptions, and Screen-Size-Agnostic Compact Summary Cards.
 */

import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '..');
const ARTIFACT_DIR =
  '/Users/diesel/.gemini/antigravity-cli/brain/77785ff1-1a55-4ebc-a8c2-a7d179add64b';

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

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.glb': 'model/gltf-binary',
  '.gltf': 'model/gltf+json',
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
  '.ogg': 'audio/ogg',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
};

function startStaticServer(rootDir) {
  return new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      try {
        const parsedUrl = new URL(req.url, 'http://127.0.0.1');
        let pathname = decodeURIComponent(parsedUrl.pathname);
        if (pathname === '/') pathname = '/index.html';
        const safePath = path.normalize(path.join(rootDir, pathname));
        if (!safePath.startsWith(rootDir)) {
          res.writeHead(403);
          res.end('Forbidden');
          return;
        }
        if (!fs.existsSync(safePath) || fs.statSync(safePath).isDirectory()) {
          res.writeHead(404);
          res.end('Not found');
          return;
        }
        const ext = path.extname(safePath).toLowerCase();
        const contentType = MIME_TYPES[ext] || 'application/octet-stream';
        res.writeHead(200, {
          'Content-Type': contentType,
          'Cache-Control': 'no-store',
        });
        fs.createReadStream(safePath).pipe(res);
      } catch (err) {
        res.writeHead(500);
        res.end(String(err));
      }
    });
    server.on('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const address = server.address();
      resolve({
        server,
        baseUrl: `http://127.0.0.1:${address.port}`,
      });
    });
  });
}

async function runVerification() {
  console.log('================================================================');
  console.log('SPEC 068 SCREEN MOUNT & HOLOGRAPHIC TERMINAL VERIFICATION SUITE');
  console.log('================================================================');

  const { server, baseUrl } = await startStaticServer(REPO_ROOT);
  const browser = await chromium.launch({
    headless: true,
    args: ['--use-gl=angle', '--use-angle=metal'],
  });

  const pageErrors = [];
  try {
    // =========================================================================
    // Phase 1: Desktop Viewport (1280x800) Verification
    // =========================================================================
    console.log('\n[Phase 1] Verifying Desktop Viewport (1280x800)...');
    const desktopContext = await browser.newContext({
      viewport: { width: 1280, height: 800 },
      deviceScaleFactor: 2.0,
    });
    const page = await desktopContext.newPage();
    page.on('pageerror', (err) => {
      console.error('  [Browser PageError]', err.message);
      pageErrors.push(err.message);
    });

    await page.goto(`${baseUrl}/index.html`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForFunction(
      () => window.__sandbox && window.__sandbox.ready && window.__sandbox.wallMounts?.length === 7,
      { timeout: 30000 }
    );

    await page.evaluate(() => {
      if (window.__sandbox && window.__sandbox.skipSprayPaintIntro) {
        window.__sandbox.skipSprayPaintIntro();
      }
      window.__sandbox.focusWallMount('SCREEN_MOUNT_01');
    });

    // Wait a moment for DOM sync
    await page.waitForTimeout(150);

    const desktopCheck = await page.evaluate(() => {
      const winEl = document.getElementById('holo-popup-window');
      const winRect = winEl.getBoundingClientRect();
      const titleEl = document.getElementById('holo-title');
      const titleRect = titleEl.getBoundingClientRect();
      const exitBtn = document.getElementById('exit-mount-focus-btn');
      const exitRect = exitBtn.getBoundingClientRect();
      const exitStyle = window.getComputedStyle(exitBtn);

      // Removed elements check
      const removedIds = [
        'holo-station-badge',
        'holo-coords-label',
        'holo-tether-bridge',
        'holo-kicker',
        'holo-footer-status',
        'holo-prev-mount-btn',
        'holo-station-pips',
        'holo-next-mount-btn',
      ];
      const removedStatus = {};
      for (const id of removedIds) {
        const el = document.getElementById(id);
        removedStatus[id] = !el || window.getComputedStyle(el).display === 'none';
      }
      const footerBar = winEl.querySelector('.holo-footer-bar');
      removedStatus.footerBar = !footerBar || window.getComputedStyle(footerBar).display === 'none';

      // Scrollbar check at t=0
      const trackEl = document.getElementById('holo-custom-scrollbar');
      const thumbEl = document.getElementById('holo-custom-scrollbar-thumb');
      const trackStyle = window.getComputedStyle(trackEl);
      const thumbStyle = window.getComputedStyle(thumbEl);
      const trackRect = trackEl.getBoundingClientRect();
      const thumbRect = thumbEl.getBoundingClientRect();

      // Description font size check
      const descEl = document.getElementById('holo-description');
      const descStyle = window.getComputedStyle(descEl);
      const narrativeBodyEl = document.getElementById('holo-narrative-body');
      const narrativeBodyStyle = window.getComputedStyle(narrativeBodyEl);

      // Summary metric cards check
      const metricBoxes = Array.from(document.querySelectorAll('#holo-metrics .holo-metric-box'));
      const metricRects = metricBoxes.map((el) => el.getBoundingClientRect());
      const metricLblRects = Array.from(
        document.querySelectorAll('#holo-metrics .holo-metric-lbl')
      ).map((el) => el.getBoundingClientRect());

      return {
        mode: window.__sandbox.mode,
        isMountFocused: window.__sandbox.isMountFocused,
        winActive: winEl.classList.contains('active'),
        removedStatus,
        exitBtnVisible:
          exitStyle.display !== 'none' &&
          exitStyle.visibility === 'visible' &&
          Number(exitStyle.opacity) > 0.9,
        exitRightOffsetFromWindow: winRect.right - exitRect.right,
        exitTopDeltaFromTitle: Math.abs(exitRect.top - titleRect.top),
        scrollbar: {
          trackDisplay: trackStyle.display,
          trackVisibility: trackStyle.visibility,
          trackOpacity: Number(trackStyle.opacity),
          trackWidth: trackRect.width,
          trackHeight: trackRect.height,
          thumbVisibility: thumbStyle.visibility,
          thumbOpacity: Number(thumbStyle.opacity),
          thumbWidth: thumbRect.width,
          thumbHeight: thumbRect.height,
        },
        typography: {
          descFontSizePx: parseFloat(descStyle.fontSize),
          descLineHeightPx: parseFloat(descStyle.lineHeight),
          narrativeBodyFontSizePx: parseFloat(narrativeBodyStyle.fontSize),
        },
        metrics: {
          count: metricRects.length,
          rects: metricRects,
          lblHeights: metricLblRects.map((r) => r.height),
        },
      };
    });

    assert.equal(desktopCheck.mode, 'mount-focus');
    assert.equal(desktopCheck.isMountFocused, true);
    assert.equal(desktopCheck.winActive, true);
    for (const [key, isGone] of Object.entries(desktopCheck.removedStatus)) {
      assert.equal(isGone, true, `Expected header/footer element '${key}' to be removed or hidden`);
    }
    console.log('  ✓ Header telemetry, tether icon, kicker, and footer bar completely removed.');

    assert.equal(desktopCheck.exitBtnVisible, true, 'Top-right Exit button must be visible');
    assert.ok(
      desktopCheck.exitRightOffsetFromWindow <= 48 && desktopCheck.exitRightOffsetFromWindow >= 4,
      `Expected Exit button in top-right corner, right offset=${desktopCheck.exitRightOffsetFromWindow}px`
    );
    assert.ok(
      desktopCheck.exitTopDeltaFromTitle <= 24,
      `Expected Exit button aligned with title row, top delta=${desktopCheck.exitTopDeltaFromTitle}px`
    );
    console.log(
      `  ✓ Top-right Exit button verified in former TOC slot (rightOffset=${desktopCheck.exitRightOffsetFromWindow.toFixed(1)}px, topDelta=${desktopCheck.exitTopDeltaFromTitle.toFixed(1)}px).`
    );

    assert.equal(desktopCheck.scrollbar.trackVisibility, 'visible');
    assert.equal(desktopCheck.scrollbar.trackOpacity, 1);
    assert.ok(desktopCheck.scrollbar.trackWidth >= 6, 'Scrollbar track width must be >= 6px');
    assert.ok(desktopCheck.scrollbar.thumbHeight >= 24, 'Scrollbar thumb height must be >= 24px');
    console.log(
      `  ✓ Persistent amber scrollbar immediately visible on desktop (${desktopCheck.scrollbar.trackWidth.toFixed(1)}x${desktopCheck.scrollbar.trackHeight.toFixed(1)}px).`
    );

    assert.ok(
      desktopCheck.typography.descFontSizePx >= 18.5,
      `Expected desktop description font-size >= 18.5px, got ${desktopCheck.typography.descFontSizePx}px`
    );
    console.log(
      `  ✓ Enlarged desktop description typography verified (${desktopCheck.typography.descFontSizePx.toFixed(2)}px, line-height ${desktopCheck.typography.descLineHeightPx.toFixed(2)}px).`
    );

    // =========================================================================
    // Phase 2: All 28 Interactive Tags Across Stations 01-07
    // =========================================================================
    console.log('\n[Phase 2] Verifying all 28 interactive tags (+ bubbles, click animation, pop-up catalog)...');
    let totalVerifiedTags = 0;
    for (let stIdx = 1; stIdx <= 7; stIdx++) {
      const mountName = `SCREEN_MOUNT_0${stIdx}`;
      await page.evaluate((mName) => {
        window.__sandbox.focusWallMount(mName);
      }, mountName);
      await page.waitForTimeout(60);

      const tagCount = await page.locator('#holo-tags button.holo-tag').count();
      assert.equal(tagCount, 4, `Expected 4 button.holo-tag elements on ${mountName}, got ${tagCount}`);

      for (let tIdx = 0; tIdx < tagCount; tIdx++) {
        const tagBtn = page.locator('#holo-tags button.holo-tag').nth(tIdx);
        const tagMeta = await tagBtn.evaluate((btn) => {
          const bubble = btn.querySelector('.holo-tag-plus-bubble');
          const bRect = bubble ? bubble.getBoundingClientRect() : null;
          return {
            tagName: btn.dataset.tagName,
            hasBubble: Boolean(bubble),
            bubbleText: bubble ? bubble.textContent.trim() : '',
            bubbleWidth: bRect ? bRect.width : 0,
            bubbleHeight: bRect ? bRect.height : 0,
          };
        });
        assert.equal(tagMeta.hasBubble, true, `Tag ${tagMeta.tagName} must have .holo-tag-plus-bubble`);
        assert.equal(tagMeta.bubbleText, '+', `Tag ${tagMeta.tagName} bubble text must be '+'`);
        assert.ok(
          tagMeta.bubbleWidth >= 18 && tagMeta.bubbleHeight >= 18,
          `Tag ${tagMeta.tagName} + bubble must be >= 18x18px, got ${tagMeta.bubbleWidth}x${tagMeta.bubbleHeight}`
        );

        await tagBtn.click();
        await page.waitForTimeout(40);

        const popupState = await page.evaluate((expectedTag) => {
          const activeBtn = document.querySelector('#holo-tags button.holo-tag.active');
          const popupEl = document.getElementById('holo-tag-popup');
          const titleEl = document.getElementById('holo-tag-popup-title');
          const descEl = document.getElementById('holo-tag-popup-desc');
          const expectedDesc = window.__sandbox.holoTagDescriptions[expectedTag];
          const bubbleEl = activeBtn ? activeBtn.querySelector('.holo-tag-plus-bubble') : null;
          const bubbleTransform = bubbleEl ? window.getComputedStyle(bubbleEl).transform : 'none';
          return {
            isActive: Boolean(activeBtn && activeBtn.dataset.tagName === expectedTag),
            ariaExpanded: activeBtn ? activeBtn.getAttribute('aria-expanded') : null,
            popupOpen: popupEl.classList.contains('open') && !popupEl.hidden,
            popupTitle: titleEl.textContent.trim(),
            popupDesc: descEl.textContent.trim(),
            expectedDesc,
            bubbleTransform,
          };
        }, tagMeta.tagName);

        assert.equal(popupState.isActive, true, `Expected tag '${tagMeta.tagName}' to become .active`);
        assert.equal(popupState.ariaExpanded, 'true', `Expected aria-expanded="true" on '${tagMeta.tagName}'`);
        assert.equal(popupState.popupOpen, true, `Expected #holo-tag-popup.open for '${tagMeta.tagName}'`);
        assert.equal(popupState.popupTitle, tagMeta.tagName);
        assert.ok(
          popupState.expectedDesc && popupState.popupDesc === popupState.expectedDesc,
          `Tag '${tagMeta.tagName}' description mismatch: got '${popupState.popupDesc}'`
        );
        assert.notEqual(
          popupState.bubbleTransform,
          'none',
          `Expected rotated transform on .holo-tag-plus-bubble when '${tagMeta.tagName}' is active`
        );
        totalVerifiedTags++;
      }
    }
    assert.equal(totalVerifiedTags, 28, 'Must verify all 28 tags across 7 stations');
    console.log(`  ✓ All ${totalVerifiedTags}/28 tags verified with "+" bubbles, 45deg active rotation, and curated pop-up descriptions.`);

    // Capture a desktop screenshot of Station 01 with a tag pop-up open
    await page.evaluate(() => {
      window.__sandbox.focusWallMount('SCREEN_MOUNT_01');
    });
    await page.waitForTimeout(80);
    await page.locator('#holo-tags button.holo-tag').first().click();
    await page.waitForTimeout(260);
    const desktopShotPath = path.join(ARTIFACT_DIR, 'spec068_desktop_mount01.png');
    await page.screenshot({ path: desktopShotPath });
    console.log(`  ✓ Saved desktop verification screenshot to ${desktopShotPath}`);

    // Verify clicking #holo-tag-popup-close-btn closes the tag popup
    await page.locator('#holo-tag-popup-close-btn').click();
    await page.waitForTimeout(60);
    const popupClosed = await page.evaluate(() => {
      const popupEl = document.getElementById('holo-tag-popup');
      return !popupEl.classList.contains('open') && popupEl.hidden;
    });
    assert.equal(popupClosed, true, 'Expected #holo-tag-popup-close-btn to close the tag pop-up');

    // Verify clicking #exit-mount-focus-btn exits Mount Focus Mode
    await page.locator('#exit-mount-focus-btn').click();
    await page.waitForTimeout(80);
    const afterExit = await page.evaluate(() => ({
      mode: window.__sandbox.mode,
      isMountFocused: window.__sandbox.isMountFocused,
    }));
    assert.equal(afterExit.mode, 'freeroam', 'Clicking #exit-mount-focus-btn must return to freeroam mode');
    assert.equal(afterExit.isMountFocused, false);
    console.log('  ✓ Clicking top-right #exit-mount-focus-btn cleanly exited Mount Focus Mode.');

    await desktopContext.close();

    // =========================================================================
    // Phase 3: Mobile Viewports (390x844 & 375x667) — Persistent Scrollbar &
    // Compact Screen-Size-Agnostic Summary Cards (Zero Needless Scrolling)
    // =========================================================================
    console.log('\n[Phase 3] Verifying Mobile Viewports (390x844 & 375x667)...');
    const mobileContext = await browser.newContext({
      viewport: { width: 390, height: 844 },
      deviceScaleFactor: 2.0,
      isMobile: true,
      hasTouch: true,
    });
    const mPage = await mobileContext.newPage();
    mPage.on('pageerror', (err) => {
      console.error('  [Mobile Browser PageError]', err.message);
      pageErrors.push(err.message);
    });

    await mPage.goto(`${baseUrl}/index.html`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await mPage.waitForFunction(
      () => window.__sandbox && window.__sandbox.ready && window.__sandbox.wallMounts?.length === 7,
      { timeout: 30000 }
    );
    await mPage.evaluate(() => {
      if (window.__sandbox && window.__sandbox.skipSprayPaintIntro) {
        window.__sandbox.skipSprayPaintIntro();
      }
    });

    // Verify at exact t=0ms (synchronous on open) that scrollbar DOM is immediately visible with opacity=1 and non-zero layout dimensions
    const t0Check = await mPage.evaluate(() => {
      window.__sandbox.focusWallMount('SCREEN_MOUNT_01');
      const trackEl = document.getElementById('holo-custom-scrollbar');
      const thumbEl = document.getElementById('holo-custom-scrollbar-thumb');
      const trackStyle = window.getComputedStyle(trackEl);
      const thumbStyle = window.getComputedStyle(thumbEl);
      return {
        trackDisplay: trackStyle.display,
        trackVisibility: trackStyle.visibility,
        trackOpacity: Number(trackStyle.opacity),
        trackOffsetWidth: trackEl.offsetWidth,
        trackOffsetHeight: trackEl.offsetHeight,
        thumbDisplay: thumbStyle.display,
        thumbVisibility: thumbStyle.visibility,
        thumbOpacity: Number(thumbStyle.opacity),
        thumbOffsetWidth: thumbEl.offsetWidth,
        thumbOffsetHeight: thumbEl.offsetHeight,
      };
    });
    assert.equal(t0Check.trackVisibility, 'visible');
    assert.equal(t0Check.trackOpacity, 1);
    assert.ok(t0Check.trackOffsetWidth >= 8 && t0Check.trackOffsetHeight >= 100);
    assert.equal(t0Check.thumbVisibility, 'visible');
    assert.equal(t0Check.thumbOpacity, 1);
    assert.ok(t0Check.thumbOffsetWidth >= 6 && t0Check.thumbOffsetHeight >= 24);
    console.log(
      `  ✓ Mobile t=0ms immediate scrollbar visibility verified (${t0Check.trackOffsetWidth}x${t0Check.trackOffsetHeight}px, opacity=${t0Check.trackOpacity}).`
    );

    // Wait for initial .holo-window materialization transform transition (340ms) to settle
    await mPage.waitForTimeout(360);

    const standardStations = [1, 2, 3, 4, 5, 6];
    for (const stIdx of standardStations) {
      const mountName = `SCREEN_MOUNT_0${stIdx}`;
      const mobileStationMetrics = await mPage.evaluate((mName) => {
        window.__sandbox.focusWallMount(mName);
        const winEl = document.getElementById('holo-popup-window');
        const viewportEl = document.getElementById('holo-body-scroll-viewport');
        const trackEl = document.getElementById('holo-custom-scrollbar');
        const thumbEl = document.getElementById('holo-custom-scrollbar-thumb');
        const descEl = document.getElementById('holo-description');

        const winStyle = window.getComputedStyle(winEl);
        const vpStyle = window.getComputedStyle(viewportEl);
        const trackStyle = window.getComputedStyle(trackEl);
        const thumbStyle = window.getComputedStyle(thumbEl);
        const trackRect = trackEl.getBoundingClientRect();
        const thumbRect = thumbEl.getBoundingClientRect();

        const metricBoxes = Array.from(document.querySelectorAll('#holo-metrics .holo-metric-box')).map(
          (el) => el.getBoundingClientRect()
        );
        const metricLbls = Array.from(document.querySelectorAll('#holo-metrics .holo-metric-lbl')).map(
          (el) => el.getBoundingClientRect()
        );

        return {
          mountName: mName,
          winOverflowY: winStyle.overflowY,
          vpOverflowY: vpStyle.overflowY,
          scrollHeight: viewportEl.scrollHeight,
          clientHeight: viewportEl.clientHeight,
          trackDebug: {
            display: trackStyle.display,
            visibility: trackStyle.visibility,
            opacity: Number(trackStyle.opacity),
            width: trackRect.width,
            height: trackRect.height,
            thumbWidth: thumbRect.width,
            thumbHeight: thumbRect.height,
          },
          trackVisibleAtT0:
            trackStyle.display !== 'none' &&
            trackStyle.visibility === 'visible' &&
            Number(trackStyle.opacity) === 1 &&
            trackRect.width >= 6 &&
            trackRect.height >= 72,
          thumbVisibleAtT0:
            thumbStyle.display !== 'none' &&
            thumbStyle.visibility === 'visible' &&
            Number(thumbStyle.opacity) === 1 &&
            thumbRect.width >= 4 &&
            thumbRect.height >= 24,
          descFontSizePx: parseFloat(window.getComputedStyle(descEl).fontSize),
          metricBoxes,
          metricLblHeights: metricLbls.map((r) => r.height),
        };
      }, mountName);

      assert.equal(
        mobileStationMetrics.winOverflowY,
        'hidden',
        `Expected .holo-window overflow-y: hidden on mobile (no dual scrollbars), got ${mobileStationMetrics.winOverflowY}`
      );
      assert.equal(
        mobileStationMetrics.vpOverflowY,
        'auto',
        `Expected #holo-body-scroll-viewport overflow-y: auto on mobile`
      );
      assert.equal(
        mobileStationMetrics.trackVisibleAtT0,
        true,
        `Expected #holo-custom-scrollbar track immediately visible at t=0 on mobile for ${mountName}: ${JSON.stringify(mobileStationMetrics.trackDebug)}`
      );
      assert.equal(
        mobileStationMetrics.thumbVisibleAtT0,
        true,
        `Expected #holo-custom-scrollbar-thumb immediately visible at t=0 on mobile for ${mountName}: ${JSON.stringify(mobileStationMetrics.trackDebug)}`
      );
      assert.ok(
        mobileStationMetrics.descFontSizePx >= 16.5,
        `Expected mobile description font-size >= 16.5px on ${mountName}, got ${mobileStationMetrics.descFontSizePx}px`
      );

      // Verify 3 summary cards are in a single horizontal row and not squished together
      const [b0, b1, b2] = mobileStationMetrics.metricBoxes;
      assert.ok(
        Math.abs(b0.top - b1.top) < 2 && Math.abs(b1.top - b2.top) < 2,
        `Expected 3 summary cards on same horizontal row on ${mountName}`
      );
      const gap01 = b1.left - b0.right;
      const gap12 = b2.left - b1.right;
      assert.ok(
        gap01 >= 7.5 && gap12 >= 7.5,
        `Expected >= 8px gap between mobile summary cards (no squishing), got ${gap01.toFixed(1)}px and ${gap12.toFixed(1)}px`
      );
      for (const h of mobileStationMetrics.metricLblHeights) {
        assert.ok(h <= 20, `Expected single-line summary card label height <= 20px on ${mountName}, got ${h}px`);
      }

      // Verify zero needless vertical scrolling on 390x844 mobile for standard stations
      assert.ok(
        mobileStationMetrics.scrollHeight <= mobileStationMetrics.clientHeight + 1,
        `Expected zero needless vertical scroll on 390x844 mobile for ${mountName}, got scrollHeight=${mobileStationMetrics.scrollHeight} > clientHeight=${mobileStationMetrics.clientHeight}`
      );
      console.log(
        `  ✓ Mobile 390x844 ${mountName}: scroll=${mobileStationMetrics.scrollHeight}/${mobileStationMetrics.clientHeight}px (0 overflow), cardGap=${gap01.toFixed(1)}px, scrollbar visible at t=0.`
      );
    }

    // Capture mobile screenshot on 390x844 (SCREEN_MOUNT_05: Generative Pipelines — "Chained AI MODELS / Auto CODE & MEDIA / E2E PIPELINES")
    await mPage.evaluate(() => {
      window.__sandbox.focusWallMount('SCREEN_MOUNT_05');
    });
    await mPage.waitForTimeout(100);
    await mPage.locator('#holo-tags button.holo-tag').first().click();
    await mPage.waitForTimeout(260);
    const mobileShotPath = path.join(ARTIFACT_DIR, 'spec068_mobile_mount05.png');
    await mPage.screenshot({ path: mobileShotPath });
    console.log(`  ✓ Saved mobile 390x844 verification screenshot to ${mobileShotPath}`);

    // Now resize to compact 375x667 (iPhone SE) and verify SCREEN_MOUNT_07 (Rejection Station with narrative callout) scrollable scrollbar thumb geometry update
    await mPage.setViewportSize({ width: 375, height: 667 });
    await mPage.waitForTimeout(100);
    const scrollSyncCheck = await mPage.evaluate(async () => {
      window.__sandbox.focusWallMount('SCREEN_MOUNT_07');
      // Open first tag popup so content definitely overflows on 375x667
      const firstTag = document.querySelector('#holo-tags button.holo-tag');
      if (firstTag) firstTag.click();
      window.__sandbox.syncHoloCustomScrollbar();

      const viewportEl = document.getElementById('holo-body-scroll-viewport');
      const trackEl = document.getElementById('holo-custom-scrollbar');
      const thumbEl = document.getElementById('holo-custom-scrollbar-thumb');
      const beforeTransform = thumbEl.style.transform;
      const maxScroll = viewportEl.scrollHeight - viewportEl.clientHeight;
      viewportEl.scrollTop = Math.max(20, maxScroll);
      window.__sandbox.syncHoloCustomScrollbar();
      const afterTransform = thumbEl.style.transform;
      return {
        isScrollable: trackEl.classList.contains('is-scrollable'),
        maxScroll,
        beforeTransform,
        afterTransform,
        ariaValueNow: Number(trackEl.getAttribute('aria-valuenow')),
      };
    });
    assert.ok(scrollSyncCheck.maxScroll > 0, 'Expected overflow on 375x667 with Station 04 + tag popup open');
    assert.equal(scrollSyncCheck.isScrollable, true);
    assert.notEqual(
      scrollSyncCheck.beforeTransform,
      scrollSyncCheck.afterTransform,
      'Expected scrollbar thumb transform to update when scrolling on mobile'
    );
    assert.ok(scrollSyncCheck.ariaValueNow >= 95, `Expected aria-valuenow near 100 at bottom scroll, got ${scrollSyncCheck.ariaValueNow}`);
    console.log(
      `  ✓ Mobile 375x667 live scroll sync verified (thumb transform: ${scrollSyncCheck.beforeTransform} -> ${scrollSyncCheck.afterTransform}, aria-valuenow=${scrollSyncCheck.ariaValueNow}%).`
    );

    await mobileContext.close();

    assert.equal(pageErrors.length, 0, `Unexpected browser page errors: ${pageErrors.join('; ')}`);
    console.log('\n================================================================');
    console.log('ALL SPEC 068 VERIFICATION CHECKS PASSED WITH ZERO ERRORS!');
    console.log('================================================================');
  } finally {
    await browser.close();
    server.close();
  }
}

runVerification().catch((err) => {
  console.error('\n❌ SPEC 068 VERIFICATION FAILURE:', err);
  process.exit(1);
});
