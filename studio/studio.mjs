// Spec 045 Dedicated /studio/ 2D-to-3D .glb Character Studio & Community Showcase.
// Strictly same-origin Three.js imports (`0` external CDN requests under `COEP: require-corp`).

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const TOKEN_STORAGE_KEY = 'studio_visitor_token_045';
const TERMINAL_RUN_STATES = new Set(['COMPLETE', 'PARTIAL_FAIL', 'FAILED']);

const FALLBACK_CATALOG = [
  { code: 'Mr', name: 'Mario' }, { code: 'Lg', name: 'Luigi' }, { code: 'Dr', name: 'Dr. Mario' },
  { code: 'Pe', name: 'Peach' }, { code: 'Kp', name: 'Bowser' }, { code: 'Ys', name: 'Yoshi' },
  { code: 'Dk', name: 'Donkey Kong' }, { code: 'Ca', name: 'Captain Falcon' }, { code: 'Gn', name: 'Ganondorf' },
  { code: 'Fc', name: 'Falco' }, { code: 'Fx', name: 'Fox' }, { code: 'Ns', name: 'Ness' },
  { code: 'Pp', name: 'Ice Climbers' }, { code: 'Kb', name: 'Kirby' }, { code: 'Ss', name: 'Samus' },
  { code: 'Zd', name: 'Zelda' }, { code: 'Sk', name: 'Sheik' }, { code: 'Lk', name: 'Link' },
  { code: 'Cl', name: 'Young Link' }, { code: 'Pc', name: 'Pichu' }, { code: 'Pk', name: 'Pikachu' },
  { code: 'Pr', name: 'Jigglypuff' }, { code: 'Mt', name: 'Mewtwo' }, { code: 'Gw', name: 'Game & Watch' },
  { code: 'Ms', name: 'Marth' }, { code: 'Fe', name: 'Roy' },
];

const $ = (id) => document.getElementById(id);
const esc = (s) =>
  String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const state = {
  me: null,
  catalog: FALLBACK_CATALOG,
  createMode: 'new', // 'new' | 'reuse'
  selectedFighters: new Set(['Mr']),
  activeRun: null, // full run_manifest object
  activeFighterCode: 'Mr',
  activeStep: 1, // 1..4
  viewportMode: '2d', // '2d' | '3d'
  loadedGlbUrl: null,
  autoLoadedGlbForKey: null,
  galleryRuns: [],
  pollTimer: null,
};

function authHeaders() {
  const tok = localStorage.getItem(TOKEN_STORAGE_KEY);
  return tok ? { 'X-Visitor-Token': tok } : {};
}

// ============================================================================
// Interactive 360° Three.js .glb Orbit Viewer
// ============================================================================

class StudioGlbViewer {
  constructor(canvas, hudEl) {
    this.canvas = canvas;
    this.hudEl = hudEl;
    this.loader = new GLTFLoader();
    this.renderer = null;
    this.scene = null;
    this.camera = null;
    this.controls = null;
    this.currentRoot = null;
    this.autoRotate = true;
    this.rafId = null;
    this.currentUrl = null;
  }

  ensureInitialized() {
    if (this.renderer) return;
    const renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.12;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(38, 1, 0.05, 100);
    camera.position.set(0, 1.15, 3.25);

    const hemi = new THREE.HemisphereLight(0xdbeafe, 0x1e293b, 1.35);
    scene.add(hemi);

    const keyLight = new THREE.DirectionalLight(0xffffff, 2.1);
    keyLight.position.set(2.6, 3.8, 3.2);
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0x60a5fa, 1.15);
    rimLight.position.set(-2.8, 2.2, -2.6);
    scene.add(rimLight);

    const fillLight = new THREE.DirectionalLight(0xfde68a, 0.55);
    fillLight.position.set(-1.8, 1.0, 2.2);
    scene.add(fillLight);

    const pedestalGeo = new THREE.RingGeometry(0.48, 0.52, 64);
    pedestalGeo.rotateX(-Math.PI / 2);
    const pedestalMat = new THREE.MeshBasicMaterial({
      color: 0x3b82f6,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.45,
    });
    const ring = new THREE.Mesh(pedestalGeo, pedestalMat);
    ring.position.y = 0.002;
    scene.add(ring);

    const grid = new THREE.GridHelper(3.0, 12, 0x2563eb, 0x1e293b);
    grid.position.y = 0;
    scene.add(grid);

    const controls = new OrbitControls(camera, this.canvas);
    controls.enableDamping = true;
    controls.dampingFactor = 0.07;
    controls.autoRotate = this.autoRotate;
    controls.autoRotateSpeed = 1.6;
    controls.target.set(0, 0.95, 0);
    controls.minDistance = 0.6;
    controls.maxDistance = 12.0;

    this.renderer = renderer;
    this.scene = scene;
    this.camera = camera;
    this.controls = controls;

    window.addEventListener('resize', () => this.resize());
    this.resize();
    this.startLoop();
  }

  resize() {
    if (!this.renderer || !this.camera) return;
    const parent = this.canvas.parentElement;
    if (!parent) return;
    const w = Math.max(300, parent.clientWidth || 640);
    const h = Math.max(320, parent.clientHeight || 480);
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  }

  startLoop() {
    if (this.rafId) return;
    const tick = () => {
      this.rafId = requestAnimationFrame(tick);
      if (!this.renderer || !this.scene || !this.camera) return;
      if (this.canvas.parentElement?.classList.contains('hidden')) return;
      this.controls.update();
      this.renderer.render(this.scene, this.camera);
    };
    tick();
  }

  clearModel() {
    if (!this.currentRoot || !this.scene) return;
    this.scene.remove(this.currentRoot);
    this.currentRoot.traverse((obj) => {
      if (obj.geometry) obj.geometry.dispose();
      if (obj.material) {
        const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
        for (const m of mats) {
          for (const k of Object.keys(m)) {
            if (m[k] && m[k].isTexture) m[k].dispose();
          }
          m.dispose();
        }
      }
    });
    this.currentRoot = null;
  }

  resetCamera() {
    if (!this.camera || !this.controls) return;
    this.camera.position.set(0, 1.15, 3.1);
    this.controls.target.set(0, 0.95, 0);
    this.controls.update();
  }

  setAutoRotate(enabled) {
    this.autoRotate = Boolean(enabled);
    if (this.controls) this.controls.autoRotate = this.autoRotate;
  }

  async loadGlb(url, label = '') {
    this.ensureInitialized();
    this.resize();
    if (this.currentUrl === url && this.currentRoot) {
      return;
    }
    this.currentUrl = url;
    if (this.hudEl) this.hudEl.textContent = `Loading 3D mesh ${label}…`;

    return new Promise((resolve, reject) => {
      this.loader.load(
        url,
        (gltf) => {
          this.clearModel();
          const root = gltf.scene || gltf.scenes?.[0];
          if (!root) {
            reject(new Error('GLB contained no scene root'));
            return;
          }
          // Normalize display scale to ~1.9m height grounded at y=0 for consistent studio orbit framing
          const box = new THREE.Box3().setFromObject(root);
          const size = new THREE.Vector3();
          const center = new THREE.Vector3();
          box.getSize(size);
          box.getCenter(center);
          const maxDim = Math.max(size.x, size.y, size.z, 1e-4);
          const scale = 1.9 / maxDim;
          root.scale.multiplyScalar(scale);

          const scaledBox = new THREE.Box3().setFromObject(root);
          const scaledCenter = new THREE.Vector3();
          scaledBox.getCenter(scaledCenter);
          root.position.x -= scaledCenter.x;
          root.position.z -= scaledCenter.z;
          root.position.y -= scaledBox.min.y;

          let triCount = 0;
          root.traverse((node) => {
            if (node.isMesh && node.geometry) {
              const idx = node.geometry.index;
              const pos = node.geometry.attributes?.position;
              triCount += idx ? Math.floor(idx.count / 3) : pos ? Math.floor(pos.count / 3) : 0;
            }
          });

          this.scene.add(root);
          this.currentRoot = root;
          this.resetCamera();
          if (this.hudEl) {
            this.hudEl.textContent = `${label} · ${triCount.toLocaleString()} tris · Drag to orbit · Scroll to zoom`;
          }
          resolve();
        },
        undefined,
        (err) => {
          this.currentUrl = null;
          if (this.hudEl) this.hudEl.textContent = `Failed to load .glb: ${err?.message || err}`;
          reject(err);
        }
      );
    });
  }
}

const viewer = new StudioGlbViewer($('glb-canvas'), $('glb-hud'));
window.__STUDIO_STATE_045__ = state;

// ============================================================================
// UI Rendering: Account Strip, Fighter Selector, 4-Step Filmstrip, & Gallery
// ============================================================================

function renderFighterSelector() {
  const grid = $('fighter-grid');
  const filterSel = $('gallery-fighter-filter');
  const unlocked = Boolean(state.me?.access_code_unlocked);

  $('bulk-fighter-controls').classList.toggle('hidden', !unlocked);
  $('fighter-tier-hint').textContent = unlocked
    ? 'Unlimited Access Unlocked: Click multiple fighters or Select All 26!'
    : 'Public tier: 1 fighter per build (4 max) · Unlock Access Code for multi-select & All 26';

  if (!unlocked && state.selectedFighters.size > 1) {
    const first = [...state.selectedFighters][0] || 'Mr';
    state.selectedFighters = new Set([first]);
  }

  grid.innerHTML = '';
  for (const ft of state.catalog) {
    const btn = document.createElement('button');
    btn.type = 'button';
    const sel = state.selectedFighters.has(ft.code);
    btn.className = `fighter-pill${sel ? ' selected' : ''}`;
    btn.innerHTML = `<strong>${esc(ft.code)}</strong><span>${esc(ft.name)}</span>`;
    btn.onclick = () => {
      if (Boolean(state.me?.access_code_unlocked)) {
        if (state.selectedFighters.has(ft.code) && state.selectedFighters.size > 1) {
          state.selectedFighters.delete(ft.code);
        } else {
          state.selectedFighters.add(ft.code);
        }
      } else {
        state.selectedFighters = new Set([ft.code]);
      }
      $('selected-fighters-count').textContent = String(state.selectedFighters.size);
      renderFighterSelector();
    };
    grid.appendChild(btn);
  }
  $('selected-fighters-count').textContent = String(state.selectedFighters.size);

  if (filterSel && filterSel.options.length <= 1) {
    for (const ft of state.catalog) {
      filterSel.add(new Option(`${ft.name} (${ft.code})`, ft.code));
    }
  }
}

function renderAccountStrip() {
  const me = state.me;
  if (!me) return;
  if (me.visitor_token) {
    localStorage.setItem(TOKEN_STORAGE_KEY, me.visitor_token);
  }
  if (Array.isArray(me.fighter_catalog) && me.fighter_catalog.length === 26) {
    state.catalog = me.fighter_catalog;
  }

  const unlocked = Boolean(me.access_code_unlocked);
  const badge = $('quota-badge');
  if (unlocked) {
    badge.textContent = '✦ Unlimited Access Unlocked';
    badge.classList.add('unlocked');
    $('unlock-box').classList.add('hidden');
  } else {
    const rem = me.quota?.remaining ?? 4;
    const lim = me.quota?.limit ?? 4;
    badge.textContent = `Public Tier: ${rem} of ${lim} builds remaining`;
    badge.classList.remove('unlocked');
    $('unlock-box').classList.remove('hidden');
  }

  // Uploaded People (`subjects`)
  const subjs = me.subjects || [];
  $('my-subjects-count').textContent = String(subjs.length);
  const subjList = $('my-subjects-list');
  const reuseSelect = $('reuse-subject-select');
  reuseSelect.innerHTML = '';

  if (!subjs.length) {
    subjList.innerHTML = '<span class="muted">Upload a person below to save reusable Stage-1 orthographic anchors.</span>';
    $('mode-reuse-btn').disabled = true;
    if (state.createMode === 'reuse') setCreateMode('new');
  } else {
    $('mode-reuse-btn').disabled = false;
    subjList.innerHTML = '';
    for (const s of subjs) {
      const headUrl = s.user_orthos?.head_front?.url || '';
      const chip = document.createElement('button');
      chip.type = 'button';
      chip.className = 'chip';
      chip.innerHTML = `${headUrl ? `<img src="${esc(headUrl)}" alt="">` : ''}<strong>${esc(s.character_name)}</strong><span class="muted">Build Fighter →</span>`;
      chip.onclick = () => {
        setCreateMode('reuse');
        reuseSelect.value = s.subject_id;
        $('studio-create-panel').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      };
      subjList.appendChild(chip);

      const cachedKeys = Object.entries(s.user_orthos || {})
        .filter(([, v]) => v && v.url)
        .map(([k]) => k.replace('_front', ''));
      reuseSelect.add(
        new Option(
          `${s.character_name} (${s.upload_mode} · cached: ${cachedKeys.length ? cachedKeys.join(', ') : 'raw ready'})`,
          s.subject_id
        )
      );
    }
  }

  // My Fighter Builds (`my_runs`)
  const myRuns = me.my_runs || [];
  $('my-runs-count').textContent = String(myRuns.length);
  const runsList = $('my-runs-list');
  if (!myRuns.length) {
    runsList.innerHTML = '<span class="muted">Your active and completed Melee fighters appear here automatically.</span>';
  } else {
    runsList.innerHTML = '';
    for (const r of myRuns) {
      const codes = r.requested_fighters || [];
      const firstF = (r.fighters || {})[codes[0]] || {};
      const thumb =
        firstF.three_quarter_url ||
        firstF.assembled_front_url ||
        firstF.fighter_front_url ||
        r.user_orthos_ref?.head_front_url ||
        '';
      const chip = document.createElement('button');
      chip.type = 'button';
      chip.className = 'chip';
      chip.innerHTML = `${thumb ? `<img src="${esc(thumb)}" alt="">` : ''}<strong>${esc(r.character_name)}</strong><span>[${esc(codes.join(','))}]</span><span class="muted">${esc(r.overall_status)}</span>`;
      chip.onclick = () => selectRunForInspection(r.visitor_hash, r.run_id, codes[0]);
      runsList.appendChild(chip);
    }
  }

  renderFighterSelector();
}

function setCreateMode(mode) {
  state.createMode = mode;
  $('mode-new-btn').classList.toggle('active', mode === 'new');
  $('mode-reuse-btn').classList.toggle('active', mode === 'reuse');
  $('new-person-fields').classList.toggle('hidden', mode !== 'new');
  $('reuse-person-fields').classList.toggle('hidden', mode !== 'reuse');
}

function collectStepPlates(run, fCode) {
  const f = (run?.fighters || {})[fCode] || {};
  const uo = run?.user_orthos_ref || {};
  const step1 = [];
  if (uo.head_front_url) step1.push({ label: 'User Head Ortho (Stage 1)', url: uo.head_front_url });
  if (uo.body_tpose_front_url) step1.push({ label: 'User T-Pose Ortho (Stage 1)', url: uo.body_tpose_front_url });
  if (uo.body_apose_front_url) step1.push({ label: 'User A-Pose Ortho (Stage 1)', url: uo.body_apose_front_url });

  const step2 = [];
  const fo = f.fighter_orthos || {};
  for (const [k, u] of Object.entries(fo)) {
    if (u) step2.push({ label: `Fighter Split: ${k}`, url: u });
  }
  if (!step2.length && f.fighter_front_url) {
    step2.push({ label: 'Fighter Front Preview', url: f.fighter_front_url });
  }

  const step3 = [];
  if (f.assembled_front_url) step3.push({ label: 'Assembled Front (Wave B)', url: f.assembled_front_url });
  if (f.assembled_back_url) step3.push({ label: 'Assembled Back (Wave C)', url: f.assembled_back_url });
  if (f.registration_check_url) step3.push({ label: '2048×2048 RGBA Registration Check', url: f.registration_check_url });
  const ao = f.assembled_orthos || {};
  for (const [k, u] of Object.entries(ao)) {
    if (u && !step3.some((p) => p.url === u)) step3.push({ label: `Registered Plate: ${k}`, url: u });
  }

  const step4 = [];
  if (f.three_quarter_url) step4.push({ label: '3D Mesh 3/4 Studio Render', url: f.three_quarter_url });
  if (f.front_render_url) step4.push({ label: '3D Mesh Front Render', url: f.front_render_url });
  if (f.side_render_url) step4.push({ label: '3D Mesh Side Render', url: f.side_render_url });
  if (f.live_verify_url) step4.push({ label: 'In-Game Melee WebGPU Verification', url: f.live_verify_url });

  return { 1: step1, 2: step2, 3: step3, 4: step4 };
}

function renderTransformationStage() {
  const run = state.activeRun;
  if (!run) return;

  const codes = run.requested_fighters || Object.keys(run.fighters || {});
  if (!codes.includes(state.activeFighterCode)) {
    state.activeFighterCode = codes[0] || 'Mr';
  }
  const fCode = state.activeFighterCode;
  const f = (run.fighters || {})[fCode] || {};
  const qPos = run.queue_position && !TERMINAL_RUN_STATES.has(run.overall_status) ? ` · Queue #${run.queue_position}` : '';

  $('stage-run-meta').textContent = `Run ${run.run_id} · Subject ${run.subject_id}${qPos}`;
  $('stage-title').textContent = `${run.character_name} · ${f.fighter_name || fCode} (${fCode})`;

  const pill = $('stage-status-pill');
  const dispStage = f.stage || run.overall_status || 'QUEUED';
  pill.textContent = dispStage;
  pill.className = `status-pill ${f.status || run.overall_status || ''}`;

  // Multi-fighter tabs
  const tabsEl = $('run-fighter-tabs');
  if (codes.length > 1) {
    tabsEl.classList.remove('hidden');
    tabsEl.innerHTML = '';
    for (const c of codes) {
      const fst = (run.fighters || {})[c] || {};
      const b = document.createElement('button');
      b.type = 'button';
      b.className = `tab-btn${c === fCode ? ' active' : ''}`;
      b.textContent = `${c} (${fst.status === 'COMPLETE' ? '✓' : fst.stage || '…'})`;
      b.onclick = () => {
        state.activeFighterCode = c;
        state.autoLoadedGlbForKey = null;
        renderTransformationStage();
      };
      tabsEl.appendChild(b);
    }
  } else {
    tabsEl.classList.add('hidden');
  }

  // Play in Melee button
  const playBtn = $('play-melee-btn');
  if (f.status === 'COMPLETE' || f.dat_url) {
    playBtn.classList.remove('hidden');
    playBtn.href =
      f.play_url ||
      `/melee/?player=${encodeURIComponent(run.visitor_hash)}&run=${encodeURIComponent(run.run_id)}&fighter=${encodeURIComponent(fCode)}&MELEE_BOOT_SCENE=vs&MELEE_DEBUG_VS=cpu4`;
  } else {
    playBtn.classList.add('hidden');
  }

  // Step readiness & subtitles
  const stepMap = collectStepPlates(run, fCode);
  const hasGlb = Boolean(f.full_glb_url || f.rigged_glb_url);
  $('step-1-sub').textContent = stepMap[1].length ? `${stepMap[1].length} anchor(s)` : 'Waiting…';
  $('step-2-sub').textContent = stepMap[2].length ? `${stepMap[2].length} view(s)` : 'Waiting…';
  $('step-3-sub').textContent = stepMap[3].length ? `${stepMap[3].length} plate(s)` : 'Waiting…';
  $('step-4-sub').textContent = f.status === 'COMPLETE' ? 'Rigged + Verified!' : hasGlb ? '3D .glb Ready!' : 'Waiting…';

  document.querySelectorAll('.film-step').forEach((el) => {
    const sNum = Number(el.dataset.step);
    el.classList.toggle('active', sNum === state.activeStep);
    const ready = sNum === 4 ? hasGlb || stepMap[4].length > 0 : stepMap[sNum].length > 0;
    el.classList.toggle('ready', ready);
  });

  // 3D .glb availability & variant selector
  const view3dBtn = $('view-3d-btn');
  const varSel = $('glb-variant-select');
  const dlBtn = $('download-glb-btn');
  const spinBtn = $('glb-spin-btn');
  const rstBtn = $('glb-reset-btn');

  view3dBtn.disabled = !hasGlb;
  varSel.disabled = !hasGlb;
  spinBtn.disabled = !hasGlb;
  rstBtn.disabled = !hasGlb;

  if (hasGlb) {
    const optFull = varSel.querySelector('option[value="full"]');
    const optRig = varSel.querySelector('option[value="rigged"]');
    if (optFull) optFull.disabled = !f.full_glb_url;
    if (optRig) optRig.disabled = !f.rigged_glb_url;
    if (varSel.value === 'rigged' && !f.rigged_glb_url) varSel.value = 'full';
    if (varSel.value === 'full' && !f.full_glb_url && f.rigged_glb_url) varSel.value = 'rigged';

    const chosenUrl = varSel.value === 'rigged' && f.rigged_glb_url ? f.rigged_glb_url : f.full_glb_url || f.rigged_glb_url;
    dlBtn.classList.remove('hidden');
    dlBtn.href = chosenUrl.includes('?') ? `${chosenUrl}&download=1` : `${chosenUrl}?download=1`;
    dlBtn.setAttribute('download', `${run.character_name.replace(/\s+/g, '_')}_${fCode}.glb`);

    // Automatically unlock and switch to 360° 3D .glb view the first time Stage 4 finishes for this fighter!
    const autoKey = `${run.run_id}:${fCode}`;
    if (state.autoLoadedGlbForKey !== autoKey) {
      state.autoLoadedGlbForKey = autoKey;
      state.activeStep = 4;
      state.viewportMode = '3d';
    }

    if (state.viewportMode === '3d') {
      $('plates-view').classList.add('hidden');
      $('glb-view').classList.remove('hidden');
      $('view-3d-btn').className = 'btn btn-xs btn-secondary active';
      $('view-2d-btn').className = 'btn btn-xs btn-ghost';
      viewer.loadGlb(chosenUrl, `${run.character_name} (${fCode})`).catch(() => {});
      return;
    }
  } else {
    dlBtn.classList.add('hidden');
    state.viewportMode = '2d';
  }

  // Render 2D Ortho Plates for activeStep
  $('glb-view').classList.add('hidden');
  $('plates-view').classList.remove('hidden');
  $('view-2d-btn').className = 'btn btn-xs btn-secondary active';
  $('view-3d-btn').className = 'btn btn-xs btn-ghost';

  const plates = stepMap[state.activeStep] || [];
  const box = $('plates-view');
  if (!plates.length) {
    const errTxt = f.error ? `<p style="color:#f87171"><strong>Diagnostic Error:</strong> ${esc(f.error)}</p>` : '';
    box.innerHTML = `<div class="empty-stage"><div><p><strong>Stage ${state.activeStep}</strong> artifacts are ${TERMINAL_RUN_STATES.has(run.overall_status) ? 'not present for this step' : 'currently generating in headless Google Colab…'}</p>${errTxt}</div></div>`;
  } else {
    box.innerHTML = '';
    for (const p of plates) {
      const card = document.createElement('div');
      card.className = 'plate-card';
      card.innerHTML = `<a href="${esc(p.url)}" target="_blank" rel="noopener"><img src="${esc(p.url)}" alt="${esc(p.label)}"></a><div class="plate-cap"><span>${esc(p.label)}</span><a class="muted" href="${esc(p.url)}" target="_blank" rel="noopener">Full ↗</a></div>`;
      box.appendChild(card);
    }
  }
}

function renderGallery() {
  const grid = $('gallery-grid');
  const runs = state.galleryRuns || [];
  if (!runs.length) {
    grid.innerHTML = '<div class="muted" style="padding:18px 0">No public builds matching current filter yet.</div>';
    return;
  }
  grid.innerHTML = '';
  for (const r of runs) {
    const codes = r.requested_fighters || Object.keys(r.fighters || {});
    const primaryCode = codes[0] || 'Mr';
    const fsum = (r.fighters || {})[primaryCode] || {};
    const thumb = r.primary_thumbnail_url || fsum.thumbnail_url || '';
    const st = r.overall_status || 'QUEUED';
    const card = document.createElement('article');
    card.className = 'gal-card';
    card.innerHTML = `
      <div class="gal-thumb">
        ${thumb ? `<img src="${esc(thumb)}" alt="${esc(r.character_name)}" loading="lazy">` : '<span class="muted">Synthesizing in Colab…</span>'}
        <span class="gal-badge ${esc(st)}">${esc(st)}</span>
      </div>
      <div class="gal-body">
        <div class="gal-title">${esc(r.character_name)}</div>
        <div class="gal-sub">Fighters: <strong>${esc(codes.join(', '))}</strong></div>
        <div class="gal-actions">
          <button type="button" class="btn btn-xs btn-secondary" data-act="inspect">${r.primary_glb_url ? '360° .glb & Orthos' : 'Inspect Progress'}</button>
          ${fsum.play_url && fsum.status === 'COMPLETE' ? `<a class="btn btn-xs btn-play" href="${esc(fsum.play_url)}" target="_blank" rel="noopener" data-stop="1">Play ↗</a>` : ''}
        </div>
      </div>
    `;
    card.onclick = (ev) => {
      if (ev.target.closest('[data-stop]')) return;
      selectRunForInspection(r.visitor_hash, r.run_id, primaryCode);
      $('transformation-stage').scrollIntoView({ behavior: 'smooth', block: 'start' });
    };
    grid.appendChild(card);
  }
}

// ============================================================================
// API Synchronization & Detached Live Progress Polling
// ============================================================================

async function fetchMe() {
  const res = await fetch('/api/studio/me', { headers: authHeaders(), cache: 'no-store' });
  const data = await res.json();
  if (data?.ok) {
    state.me = data;
    renderAccountStrip();
  }
  return data;
}

async function fetchGallery() {
  const q = $('gallery-search').value.trim();
  const fighter = $('gallery-fighter-filter').value;
  const params = new URLSearchParams({ limit: '48' });
  if (q) params.set('q', q);
  if (fighter) params.set('fighter', fighter);
  const res = await fetch(`/api/studio/gallery?${params}`, { cache: 'no-store' });
  const data = await res.json();
  if (data?.ok) {
    state.galleryRuns = data.runs || [];
    renderGallery();
  }
  return data;
}

async function selectRunForInspection(visitorHash, runId, preferredFighter = null) {
  const res = await fetch(`/api/studio/runs/${encodeURIComponent(visitorHash)}/${encodeURIComponent(runId)}`, {
    headers: authHeaders(),
    cache: 'no-store',
  });
  const data = await res.json();
  if (!res.ok || !data?.ok || !data.run) return;
  const prevId = state.activeRun?.run_id;
  state.activeRun = data.run;
  if (preferredFighter) state.activeFighterCode = preferredFighter;
  if (prevId !== data.run.run_id) {
    state.autoLoadedGlbForKey = null;
    // Choose highest populated step initially
    const stepMap = collectStepPlates(data.run, state.activeFighterCode);
    const f = (data.run.fighters || {})[state.activeFighterCode] || {};
    if (f.full_glb_url || f.rigged_glb_url || stepMap[4].length) state.activeStep = 4;
    else if (stepMap[3].length) state.activeStep = 3;
    else if (stepMap[2].length) state.activeStep = 2;
    else state.activeStep = 1;
  }
  renderTransformationStage();
  syncPollingLoop();
}

function syncPollingLoop() {
  const activeNonTerminal =
    (state.activeRun && !TERMINAL_RUN_STATES.has(state.activeRun.overall_status)) ||
    (state.me?.my_runs || []).some((r) => !TERMINAL_RUN_STATES.has(r.overall_status));

  if (activeNonTerminal && !state.pollTimer) {
    state.pollTimer = setInterval(async () => {
      await Promise.all([
        fetchMe().catch(() => {}),
        fetchGallery().catch(() => {}),
        state.activeRun
          ? selectRunForInspection(state.activeRun.visitor_hash, state.activeRun.run_id, state.activeFighterCode).catch(() => {})
          : Promise.resolve(),
      ]);
    }, 3500);
  } else if (!activeNonTerminal && state.pollTimer) {
    clearInterval(state.pollTimer);
    state.pollTimer = null;
  }
}

// ============================================================================
// Event Wiring
// ============================================================================

$('mode-new-btn').onclick = () => setCreateMode('new');
$('mode-reuse-btn').onclick = () => setCreateMode('reuse');

$('select-all-26-btn').onclick = () => {
  if (!state.me?.access_code_unlocked) return;
  state.selectedFighters = new Set(state.catalog.map((f) => f.code));
  renderFighterSelector();
};

$('clear-fighters-btn').onclick = () => {
  state.selectedFighters = new Set(['Mr']);
  renderFighterSelector();
};

$('photo-0-input').onchange = (e) => {
  const f = e.target.files?.[0];
  $('photo-0-hint').textContent = f ? `${f.name} (${(f.size / 1024).toFixed(0)} KiB)` : 'JPG, PNG, WebP · ≥256px · ≤10 MiB';
};
$('photo-1-input').onchange = (e) => {
  const f = e.target.files?.[0];
  $('photo-1-hint').textContent = f ? `${f.name} (${(f.size / 1024).toFixed(0)} KiB)` : 'Add 2nd photo for thorough outfit match';
};

$('unlock-btn').onclick = async () => {
  const code = $('access-code-input').value.trim();
  const fb = $('form-feedback');
  if (!code) return;
  fb.textContent = '';
  const res = await fetch('/api/studio/unlock', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ access_code: code }),
  });
  const data = await res.json();
  if (!res.ok || !data.ok) {
    fb.className = 'feedback-msg err';
    fb.textContent = data.message || 'Invalid Access Code.';
  } else {
    $('access-code-input').value = '';
    fb.className = 'feedback-msg ok';
    fb.textContent = 'Unlimited Access Code unlocked on your visitor account!';
    await fetchMe();
  }
};

$('create-run-form').onsubmit = async (ev) => {
  ev.preventDefault();
  const fb = $('form-feedback');
  fb.className = 'feedback-msg';
  fb.textContent = '';

  const fightersCsv = [...state.selectedFighters].join(',');
  if (!fightersCsv) {
    fb.className = 'feedback-msg err';
    fb.textContent = 'Select at least 1 Melee fighter.';
    return;
  }

  const fd = new FormData();
  fd.set('fighters', fightersCsv);
  const inlineCode = $('access-code-input').value.trim();
  if (inlineCode) fd.set('access_code', inlineCode);

  if (state.createMode === 'reuse') {
    const sid = $('reuse-subject-select').value;
    if (!sid) {
      fb.className = 'feedback-msg err';
      fb.textContent = 'Select one of your uploaded people first.';
      return;
    }
    fd.set('subject_id', sid);
    const override = $('reuse-name-override').value.trim();
    if (override) fd.set('character_name', override);
  } else {
    const cname = $('character-name-input').value.trim();
    const p0 = $('photo-0-input').files?.[0];
    const p1 = $('photo-1-input').files?.[0];
    if (!cname) {
      fb.className = 'feedback-msg err';
      fb.textContent = 'Enter a display name for this person.';
      return;
    }
    if (!p0) {
      fb.className = 'feedback-msg err';
      fb.textContent = 'Select at least 1 photo (Face / Primary Photo).';
      return;
    }
    fd.set('character_name', cname);
    fd.set('photo_0', p0);
    if (p1) fd.set('photo_1', p1);
  }

  const btn = $('generate-submit-btn');
  btn.disabled = true;
  try {
    const res = await fetch('/api/studio/runs', {
      method: 'POST',
      headers: authHeaders(),
      body: fd,
    });
    const data = await res.json();
    if (!res.ok || !data.ok) {
      fb.className = 'feedback-msg err';
      fb.textContent = data.message || `Submission rejected (HTTP ${res.status})`;
      return;
    }
    if (data.visitor_token) localStorage.setItem(TOKEN_STORAGE_KEY, data.visitor_token);
    fb.className = 'feedback-msg ok';
    fb.textContent = `Detached cloud build ${data.run_id} queued (${data.intake_latency_ms} ms) — safe to close tab anytime!`;
    state.activeRun = data.run;
    state.activeFighterCode = (data.requested_fighters || [])[0] || 'Mr';
    state.activeStep = 1;
    state.viewportMode = '2d';
    state.autoLoadedGlbForKey = null;
    renderTransformationStage();
    await Promise.all([fetchMe(), fetchGallery()]);
    syncPollingLoop();
  } catch (err) {
    fb.className = 'feedback-msg err';
    fb.textContent = String(err?.message || err);
  } finally {
    btn.disabled = false;
  }
};

document.querySelectorAll('.film-step').forEach((btn) => {
  btn.onclick = () => {
    state.activeStep = Number(btn.dataset.step);
    if (state.activeStep < 4) {
      state.viewportMode = '2d';
    }
    renderTransformationStage();
  };
});

$('view-2d-btn').onclick = () => {
  state.viewportMode = '2d';
  renderTransformationStage();
};

$('view-3d-btn').onclick = () => {
  state.viewportMode = '3d';
  renderTransformationStage();
};

$('glb-variant-select').onchange = () => {
  state.viewportMode = '3d';
  renderTransformationStage();
};

$('glb-spin-btn').onclick = () => {
  viewer.setAutoRotate(!viewer.autoRotate);
  $('glb-spin-btn').textContent = `Auto-Spin: ${viewer.autoRotate ? 'ON' : 'OFF'}`;
};

$('glb-reset-btn').onclick = () => viewer.resetCamera();

$('gallery-refresh-btn').onclick = () => fetchGallery();
$('gallery-fighter-filter').onchange = () => fetchGallery();
$('gallery-search').oninput = () => fetchGallery();

// Initial Boot
(async function bootStudio() {
  renderFighterSelector();
  const [, gal] = await Promise.all([fetchMe(), fetchGallery()]);
  const urlRun = new URLSearchParams(location.search).get('run');
  if (urlRun && urlRun.includes('/')) {
    const [vh, rid] = urlRun.split('/', 2);
    await selectRunForInspection(vh, rid);
  } else if (state.me?.my_runs?.length) {
    const latestMine = state.me.my_runs[0];
    await selectRunForInspection(latestMine.visitor_hash, latestMine.run_id);
  } else if (gal?.runs?.length) {
    const firstPub = gal.runs[0];
    await selectRunForInspection(firstPub.visitor_hash, firstPub.run_id);
  }
  syncPollingLoop();
})();
