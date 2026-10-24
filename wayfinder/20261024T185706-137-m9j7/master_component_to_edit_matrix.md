# Master Component-to-Edit Matrix (`20261024T185706-137-m9j7`)

- **Run ID**: `20261024T185706-137-m9j7`
- **Authoritative Seed Specification**: `functional_specification_042.md`
- **Governance**: Explicitly separates **Mandatory Target Deliverables (`MANDATORY_TARGET`)** that the `implement` stage must create or modify and mark `CHANGED` in `handoff/20261024T185706-137-m9j7/implementer-status.txt` from **Read-Only Discovery Context (`READ_ONLY_CONTEXT`)** inspected during reconnaissance (`INV-DELIVERABLE-SPLIT-01`, `INV-NO-SELF-TEST-01`).

---

## Mandatory Target Deliverables (MANDATORY_TARGET)

Every file in this table is a required production deliverable that the `implement` stage must create or modify and record as `CHANGED` in `handoff/20261024T185706-137-m9j7/implementer-status.txt`:

| Repository-Relative Path | Action (`CREATE` / `MODIFY`) | Governing Ticket | Target Line Range / Scope | Required Production Transformation & Verifiable Contract |
| :--- | :---: | :---: | :--- | :--- |
| `.gitignore` | `MODIFY` | `ticket-001` | Lines `45–52` | Add `nzportable/nzp/game.pk3` to the unsplit raw binary ignore list so the `94,276,834`-byte archive remains on disk for fast local/LAN streaming while excluded from Git tracking (`<= 35 MB` per tracked file invariant). |
| `nzportable/default.fmf` | `CREATE` | `ticket-001` | Full file (`96` bytes) | Stage upstream FTEQW manifest (`game nzp`, `name "Nazi Zombies Portable"`, `basegame nzp`, `mainconfig "nzportable.cfg"`, `disablehomedir 1`) with exact size `96` bytes (`sha256: d3e89c92ff2b43b83e4a461a79b7986e3fd7ca3126ec1842588a688c539b3979`). |
| `nzportable/ftewebgl.js` | `CREATE` | `ticket-001` | Full file (`165,608` bytes) | Stage upstream FTEQW Emscripten WebGL runtime loader script with exact size `165,608` bytes (`sha256: 7ae5352b39e21c5dc83dd2c27d0f49f842ce89462402400775ccb055a2d9da46`). |
| `nzportable/ftewebgl.wasm` | `CREATE` | `ticket-001` | Full binary (`5,178,106` bytes) | Stage upstream FTEQW Emscripten WebAssembly binary with exact size `5,178,106` bytes (`sha256: 523141c46f2898fe1f4bb175eca6035ff8aed981e8f770993f98d15d7a2199e2`). |
| `nzportable/nzp/progs.pk3` | `CREATE` | `ticket-001` | Full binary (`491,379` bytes) | Stage upstream NZ:P QuakeC bytecode archive (`csprogs.dat`, `menu.dat`, `qwprogs.dat`, `csprogs.lno`) with exact size `491,379` bytes (`sha256: 47bc82fa1335f5748ac08372c2daf24c57f29e56f046ad0fa125eec90c9bf832`). |
| `nzportable/parts/game.pk3.part00` | `CREATE` | `ticket-001` | Full binary (`31,457,280` bytes) | First deterministic chunk (`bytes [0 : 31457280]`) of `nzportable/nzp/game.pk3` (`94,276,834` bytes total; `nzportable/nzp/game.pk3` is also staged on disk at `nzportable/nzp/game.pk3` and ignored by Git). |
| `nzportable/parts/game.pk3.part01` | `CREATE` | `ticket-001` | Full binary (`31,457,280` bytes) | Second deterministic chunk (`bytes [31457280 : 62914560]`) of `nzportable/nzp/game.pk3`. |
| `nzportable/parts/game.pk3.part02` | `CREATE` | `ticket-001` | Full binary (`31,362,274` bytes) | Third deterministic chunk (`bytes [62914560 : 94276834]`) of `nzportable/nzp/game.pk3` (`len(part00)+len(part01)+len(part02) == 94276834`). |
| `nzportable/pack.json` | `CREATE` | `ticket-001` | Full JSON file | JSON manifest specifying `cacheName: "nzportable-pack-v1"`, `engine` (`ftewebgl.js` = `165608`, `ftewebgl.wasm` = `5178106`), and `files` (`default.fmf` = `96`, `nzp/progs.pk3` = `491379`, `nzp/game.pk3` = `94276834` with `url: "./nzp/game.pk3"` and `parts: ["./parts/game.pk3.part00", "./parts/game.pk3.part01", "./parts/game.pk3.part02"]`). |
| `nzportable/index.html` | `CREATE` | `ticket-002` | Full HTML5 file | Full-viewport dark HTML5 shell containing `<canvas class="emscripten" id="canvas" oncontextmenu="event.preventDefault()" tabindex="0"></canvas>` (`border: 0px none; width: 100%; height: 100%; padding: 0; margin: 0; display: block;`), `#splash` click/key launch screen, `#overlay` (`#status`, `#progress`, `#mb-counter`, `#overlay-return-alley`), `#hudbar` (`#return-alley-btn`, `#fullscreen`), and `<script type="module" src="./loader.js"></script>`. |
| `nzportable/loader.js` | `CREATE` | `ticket-003` | Full ES module | Implements `AudioContext`/`webkitAudioContext` auto-unlock `Proxy`, `#canvas.getContext` `preserveDrawingBuffer: true` wrapper, `?autostart=1` support, `caches.open('nzportable-pack-v1')` lookup/write, `nzp/game.pk3` streaming with automatic multi-part `./parts/game.pk3.part00..02` and `../tunnel.json` failover, `window.Module` initialization (`files` mapped to `ArrayBuffer`s, `arguments: []`, `mayregisterscemes: false`, `postRun` checking `Module.sched !== undefined`), overlay dismissal, `#fullscreen` toggle, and `window.__NZP_STATUS__` telemetry. |
| `scripts/serve_skatealley.py` | `MODIFY` | `ticket-004` | Lines `205–261` & `426–448` | Register `EXTRA_MIME_TYPES` (`.pk3`, `.fmf`, `.part`, `.part00`..`.part99` $\rightarrow$ `application/octet-stream`, `.wasm` $\rightarrow$ `application/wasm`) merged into `CUSTOM_MIME_TYPES` and `guess_type()`; update `_serve_health()` to check `nzportable/index.html`, `nzportable/ftewebgl.wasm`, and `nzportable/nzp/progs.pk3` and emit `"nzportable_webapp": True` plus `"nzportable_webapp"` in `"services"` and `"components"`. |
| `index.html` | `MODIFY` | `ticket-004` | Lines `2234–2243` | Add `#hud-enter-nzportable-btn` (`href="./nzportable/"`, label `🧟 NZ: Portable (Zombies)`) in the Freeman Alley `#sandbox-hud-body` locomotion/launcher section for one-click navigation to `/nzportable/`. |

---

## Read-Only Discovery Context (READ_ONLY_CONTEXT)

The following files were inspected or captured during planning and reconnaissance to establish ground-truth schemas and local precedents. They must **NOT** be treated as mandatory edit targets:

| Repository-Relative Path | Role / Context Purpose |
| :--- | :--- |
| `functional_specification_042.md` | Authoritative functional specification seed for Spec 042. |
| `LANGUAGE.md` | Authoritative system glossary defining `{functionality}`, `{correctness}`, `{correct required outputs}`, `{errors}`, `{sufficient}`, and `{insufficient}`. |
| `skate3_cleanroom/index.html` | Local clean-room webapp HTML/CSS precedent for `#splash`, `#overlay`, and bottom-right HUD bar. |
| `skate3_cleanroom/loader.js` | Local clean-room ES module precedent for `AudioContext` `Proxy`, `CacheStorage`, multi-part chunk concatenation, and `../tunnel.json` failover. |
| `skate3_cleanroom/pack.json` | Local clean-room JSON manifest precedent. |
| `sandbox.js` | Freeman Alley Three.js runtime (strictly isolated from `/nzportable/`; zero NZ:P code may be added to `sandbox.js`). |
| `tunnel.json` | Remote Server Mac Cloudflare tunnel endpoint descriptor (`../tunnel.json`). |
| `assets/20261024T185706-137-m9j7/plan-default.fmf` | Captured upstream `default.fmf` (`96` bytes) reference artifact. |
| `assets/20261024T185706-137-m9j7/plan-ftewebgl.js` | Captured upstream `ftewebgl.js` (`165,608` bytes) reference artifact inspected to verify `Module.files`, `Module.sched`, and `_emscriptenfte_setupcanvas`. |
| `assets/20261024T185706-137-m9j7/plan-progs.pk3` | Captured upstream `nzp/progs.pk3` (`491,379` bytes) reference archive inspected to verify `csprogs.dat`, `menu.dat`, and `qwprogs.dat`. |
| `assets/20261024T185706-137-m9j7/plan-nzportable-README.md` | Captured upstream `nzp-team/nzportable` `README.md` architectural documentation. |
| `assets/20261024T185706-137-m9j7/plan-nzportable-generate-nightly.sh` | Captured upstream `nzp-team/nzportable` `generate-nightly.sh` build script. |
| `assets/20261024T185706-137-m9j7/plan-upstream-index.html` | Captured upstream `nzp-team/nzp-team.github.io` `index.html` reference shell. |
| `assets/20261024T185706-137-m9j7/plan-scan-1-*` | Read-only scanner 1 reconnaissance artifacts. |
| `assets/20261024T185706-137-m9j7/plan-scan-2-*` | Read-only scanner 2 reconnaissance artifacts. |
| `wayfinder/20261024T185706-137-m9j7/plan-scan-1-report.md` | Read-only scanner 1 report. |
| `wayfinder/20261024T185706-137-m9j7/plan-scan-2-report.md` | Read-only scanner 2 report. |
