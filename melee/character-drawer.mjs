// SPDX-License-Identifier: GPL-3.0-or-later
// <=12 KB zero-dependency, zero-3D-lib collapsible Character Drawer (Spec 045 §6.1.3).
const GAMES = {
  melee: ['Melee Character Studio', '/studio/'],
  skate3: ['Skate 3 Skater Studio', '/studio/?game=skate3'],
  gta: ['Vice City Ped Studio', '/studio/?game=gta'],
  zombies: ['Zombies Operator Studio', '/studio/?game=zombies'],
};
const ROSTER = [
  ['Mr','Mario'],['Lg','Luigi'],['Dr','Dr. Mario'],['Pe','Peach'],['Kp','Bowser'],['Ys','Yoshi'],
  ['Dk','Donkey Kong'],['Ca','Cpt. Falcon'],['Gn','Ganondorf'],['Fc','Falco'],['Fx','Fox'],['Ns','Ness'],
  ['Pp','Ice Climbers'],['Kb','Kirby'],['Ss','Samus'],['Zd','Zelda'],['Sk','Sheik'],['Lk','Link'],
  ['Cl','Young Link'],['Pc','Pichu'],['Pk','Pikachu'],['Pr','Jigglypuff'],['Mt','Mewtwo'],
  ['Gw','Game & Watch'],['Ms','Marth'],['Fe','Roy'],
];
const TKEY = 'studio_visitor_token_045';
const CSS = `.cd45{margin:8px 0 10px;background:#141821;border:1px solid #283042;border-radius:6px;font:12.5px/1.4 system-ui,-apple-system,sans-serif;color:#e6edf3}
.cd45-h{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:7px 12px;cursor:pointer;user-select:none}
.cd45-h:hover{background:#1a202c}.cd45-t{font-weight:700;display:flex;align-items:center;gap:8px}
.cd45-bg{font-size:11px;padding:1px 7px;border-radius:99px;background:#1f2937;border:1px solid #374151;color:#93c5fd;font-weight:600}
.cd45-b{display:none;padding:10px 12px;border-top:1px solid #242c3d;grid-template-columns:1.15fr 1fr;gap:12px}
.cd45.open .cd45-b{display:grid}@media(max-width:760px){.cd45.open .cd45-b{grid-template-columns:1fr}}
.cd45-c{display:flex;flex-direction:column;gap:7px}.cd45-r{display:flex;gap:6px;align-items:center;flex-wrap:wrap}
.cd45 input[type=text],.cd45 input[type=password],.cd45 select{background:#0d1017;color:#eef2f7;border:1px solid #30384a;border-radius:5px;padding:4px 8px;font-size:12px}
.cd45 input[type=file]{font-size:11px;color:#9ca3af;max-width:195px}
.cd45-bt{background:#238636;color:#fff;border:1px solid rgba(255,255,255,.12);border-radius:5px;padding:4px 9px;font-size:12px;font-weight:600;cursor:pointer}
.cd45-bt.s{background:#1f6feb}.cd45-bt.g{background:#21262d;color:#c9d1d9}
.cd45-n{font-size:11px;color:#8b95a7}.cd45-l{display:flex;flex-direction:column;gap:5px;max-height:165px;overflow:auto}
.cd45-i{display:flex;align-items:center;gap:8px;padding:5px 7px;background:#0d1017;border:1px solid #232a38;border-radius:5px}
.cd45-i img,.cd45-ph{width:34px;height:34px;object-fit:cover;border-radius:4px;background:#1f2430;flex-shrink:0}
.cd45-m{flex:1;min-width:0}.cd45-m b{display:block;font-size:12px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.cd45-a{color:#58a6ff;text-decoration:none;font-weight:600;font-size:12px}.cd45-e{color:#f87171;font-size:11.5px}`;

const esc = (s) => String(s || '').replace(/[&<>"']/g, (c) => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));

export function initCharacterDrawer({ targetGame = 'melee', mountBeforeEl = null, onPlayFighter = null } = {}) {
  const [title, studioUrl] = GAMES[targetGame] || GAMES.melee;
  if (!document.getElementById('cd45-css')) {
    const st = document.createElement('style');
    st.id = 'cd45-css';
    st.textContent = CSS;
    document.head.appendChild(st);
  }
  const root = document.createElement('section');
  root.className = 'cd45';
  root.id = 'character-drawer-045';
  root.dataset.targetGame = targetGame;
  root.innerHTML = `<div class="cd45-h" role="button" tabindex="0" aria-expanded="false">
<div class="cd45-t"><span>✦ ${title}</span><span class="cd45-bg" data-k="q">Create / Load Fighter</span></div>
<div class="cd45-r"><a class="cd45-a" href="${studioUrl}" target="_blank" rel="noopener" data-stop="1">360° 3D Studio ↗</a><span class="cd45-n" data-k="cv">▼ Expand</span></div>
</div><div class="cd45-b"><form class="cd45-c" data-k="fm">
<div class="cd45-r"><button type="button" class="cd45-bt s" data-m="new">New Person</button><button type="button" class="cd45-bt g" data-m="reuse">Saved Person</button>
<input type="password" placeholder="Access Code" data-k="cd" style="width:102px" autocomplete="off"><button type="button" class="cd45-bt g" data-k="ul">Unlock</button></div>
<div data-k="nb" class="cd45-c"><div class="cd45-r"><input type="text" placeholder="Person Name (e.g. Marco)" data-k="nm" maxlength="48" style="flex:1"></div>
<div class="cd45-r"><label class="cd45-n">Face: <input type="file" accept=".jpg,.jpeg,.png,.webp" data-k="p0"></label><label class="cd45-n">Outfit: <input type="file" accept=".jpg,.jpeg,.png,.webp" data-k="p1"></label></div>
<div class="cd45-n">Raw photos stay private (HTTP 403). Generated orthos &amp; 3D .glb meshes are public.</div></div>
<div data-k="rb" class="cd45-r" style="display:none"><select data-k="sj" style="flex:1"></select></div>
<div class="cd45-r"><label class="cd45-n">Fighter:</label><select data-k="ft" style="flex:1"></select><button type="submit" class="cd45-bt" data-k="sb">Generate</button></div>
<div class="cd45-e" data-k="mg"></div></form>
<div class="cd45-c"><div class="cd45-r" style="justify-content:space-between"><b style="font-size:12px">My Fighters &amp; Community</b><button type="button" class="cd45-bt g" data-k="rf" style="padding:2px 8px">↻</button></div>
<div class="cd45-l" data-k="ls"><span class="cd45-n">Expand to load characters…</span></div></div></div>`;

  if (mountBeforeEl?.parentNode) mountBeforeEl.parentNode.insertBefore(root, mountBeforeEl);
  else document.body.prepend(root);

  const q = (s) => root.querySelector(s);
  const fSel = q('[data-k="ft"]');
  for (const [c, n] of ROSTER) fSel.add(new Option(`${n} (${c})`, c));

  let open = false, mode = 'new', timer = null;
  const hdrs = () => { const t = localStorage.getItem(TKEY); return t ? { 'X-Visitor-Token': t } : {}; };
  const stop = () => { if (timer) { clearInterval(timer); timer = null; } };
  const setMode = (m) => {
    mode = m;
    q('[data-k="nb"]').style.display = m === 'new' ? 'flex' : 'none';
    q('[data-k="rb"]').style.display = m === 'reuse' ? 'flex' : 'none';
    q('[data-m="new"]').className = `cd45-bt ${m === 'new' ? 's' : 'g'}`;
    q('[data-m="reuse"]').className = `cd45-bt ${m === 'reuse' ? 's' : 'g'}`;
  };
  const play = (vh, rid, code) => {
    if (onPlayFighter) return onPlayFighter(vh, rid, code);
    const u = new URL(location.href);
    u.searchParams.set('player', vh); u.searchParams.set('run', rid); u.searchParams.set('fighter', code);
    if (!u.searchParams.has('MELEE_BOOT_SCENE')) u.searchParams.set('MELEE_BOOT_SCENE', 'vs');
    if (!u.searchParams.has('MELEE_DEBUG_VS')) u.searchParams.set('MELEE_DEBUG_VS', 'cpu4');
    location.href = u.toString();
  };

  function render(me, gal) {
    if (me.visitor_token) localStorage.setItem(TKEY, me.visitor_token);
    const unl = Boolean(me.access_code_unlocked);
    q('[data-k="q"]').textContent = unl ? 'Unlimited Unlocked' : `Public: ${me.quota?.remaining ?? 4}/4 left`;
    if (unl && ![...fSel.options].some((o) => o.value === 'all')) fSel.prepend(new Option('★ All 26 Melee Fighters', 'all'));
    const sSel = q('[data-k="sj"]'); sSel.innerHTML = '';
    for (const s of me.subjects || []) sSel.add(new Option(`${s.character_name} (${s.upload_mode})`, s.subject_id));
    if (!sSel.options.length && mode === 'reuse') setMode('new');

    const ls = q('[data-k="ls"]'); ls.innerHTML = '';
    const items = [], seen = new Set();
    let busy = false;
    const add = (r, mine) => {
      const st = r.overall_status || 'QUEUED';
      if (!['COMPLETE','PARTIAL_FAIL','FAILED'].includes(st)) busy = true;
      const fm = r.fighters || {};
      for (const c of r.requested_fighters || Object.keys(fm)) {
        const k = `${r.visitor_hash}|${r.run_id}|${c}`;
        if (seen.has(k)) continue;
        seen.add(k);
        const f = fm[c] || {};
        items.push({ vh: r.visitor_hash, rid: r.run_id, c, nm: r.character_name, ok: f.status === 'COMPLETE', stg: f.stage || st,
          im: f.three_quarter_url || f.thumbnail_url || f.assembled_front_url || f.fighter_front_url || r.primary_thumbnail_url || '', mine });
      }
    };
    for (const r of me.my_runs || []) add(r, true);
    for (const r of gal || []) add(r, r.visitor_hash === me.visitor_hash);

    if (!items.length) ls.innerHTML = '<span class="cd45-n">No fighters yet — upload a photo!</span>';
    for (const it of items.slice(0, 18)) {
      const d = document.createElement('div'); d.className = 'cd45-i';
      d.innerHTML = `${it.im ? `<img src="${esc(it.im)}" alt="">` : '<div class="cd45-ph"></div>'}<div class="cd45-m"><b>${it.mine ? '★ ' : ''}${esc(it.nm)} · ${esc(it.c)}</b><span class="cd45-n">${esc(it.stg)}</span></div>`;
      if (it.ok) {
        const b = document.createElement('button'); b.type = 'button'; b.className = 'cd45-bt s'; b.textContent = 'Play';
        b.onclick = () => play(it.vh, it.rid, it.c); d.appendChild(b);
      } else {
        const a = document.createElement('a'); a.className = 'cd45-a'; a.target = '_blank'; a.textContent = '3D ↗';
        a.href = `/studio/?run=${encodeURIComponent(it.vh)}/${encodeURIComponent(it.rid)}`; d.appendChild(a);
      }
      ls.appendChild(d);
    }
    if (open && busy && !timer) timer = setInterval(refresh, 4500);
    else if (!open || !busy) stop();
  }

  async function refresh() {
    try {
      const [me, gal] = await Promise.all([
        fetch('/api/studio/me', { headers: hdrs(), cache: 'no-store' }).then((r) => r.json()),
        fetch('/api/studio/gallery?limit=16', { cache: 'no-store' }).then((r) => r.json()),
      ]);
      if (me?.ok) render(me, gal?.runs || []);
    } catch (e) { q('[data-k="mg"]').textContent = String(e?.message || e); }
  }

  const toggle = () => {
    open = !open; root.classList.toggle('open', open);
    q('.cd45-h').setAttribute('aria-expanded', String(open));
    q('[data-k="cv"]').textContent = open ? '▲ Collapse' : '▼ Expand';
    if (open) refresh(); else stop();
  };
  q('.cd45-h').onclick = (e) => { if (!e.target.closest('[data-stop]')) toggle(); };
  q('[data-m="new"]').onclick = () => setMode('new');
  q('[data-m="reuse"]').onclick = () => setMode('reuse');
  q('[data-k="rf"]').onclick = refresh;

  q('[data-k="ul"]').onclick = async () => {
    const cd = q('[data-k="cd"]').value.trim(); if (!cd) return;
    q('[data-k="mg"]').textContent = '';
    const r = await fetch('/api/studio/unlock', {
      method: 'POST', headers: { 'Content-Type': 'application/json', ...hdrs() }, body: JSON.stringify({ access_code: cd }),
    }).then((x) => x.json());
    if (!r.ok) q('[data-k="mg"]').textContent = r.message || 'Invalid Access Code';
    else { q('[data-k="cd"]').value = ''; refresh(); }
  };

  q('[data-k="fm"]').onsubmit = async (e) => {
    e.preventDefault();
    const mg = q('[data-k="mg"]'); mg.textContent = '';
    const fd = new FormData(); fd.set('fighters', fSel.value);
    const cd = q('[data-k="cd"]').value.trim(); if (cd) fd.set('access_code', cd);
    if (mode === 'reuse') {
      const sj = q('[data-k="sj"]').value;
      if (!sj) { mg.textContent = 'Select a saved person.'; return; }
      fd.set('subject_id', sj);
    } else {
      const nm = q('[data-k="nm"]').value.trim(), f0 = q('[data-k="p0"]').files?.[0], f1 = q('[data-k="p1"]').files?.[0];
      if (!nm || !f0) { mg.textContent = 'Enter a name and select a photo.'; return; }
      fd.set('character_name', nm); fd.set('photo_0', f0); if (f1) fd.set('photo_1', f1);
    }
    const sb = q('[data-k="sb"]'); sb.disabled = true;
    try {
      const rs = await fetch('/api/studio/runs', { method: 'POST', headers: hdrs(), body: fd });
      const d = await rs.json();
      if (!rs.ok || !d.ok) mg.textContent = d.message || `HTTP ${rs.status}`;
      else {
        if (d.visitor_token) localStorage.setItem(TKEY, d.visitor_token);
        mg.style.color = '#7ee787'; mg.textContent = `Queued ${d.run_id} (safe to close tab!)`;
        setTimeout(() => { mg.style.color = '#f87171'; }, 4000);
        refresh();
      }
    } catch (er) { mg.textContent = String(er?.message || er); }
    finally { sb.disabled = false; }
  };
  return { root, refresh, collapse: () => { if (open) toggle(); } };
}
