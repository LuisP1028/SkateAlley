# Functional Specification 039: Decimation & Payload Optimization of the Overhead "VILLAINY INC." PBR Neon Sign (`villainy_inc_textured.glb`)

## 1. System Purpose & Core Objective

This specification defines the desired `{functionality}`, 3D mesh topology welding and decimation mathematics, analytical orthographic UV registration contract, PBR + emissive texture resolution and encoding budgets, scene staging invariants, edge-case failure boundaries, and verifiable `{correct required outputs}` for decimating and optimizing the overhead **"VILLAINY INC." PBR Neon Sign** ([`/Users/diesel/desktop/skatealley/villainy_inc_textured.glb`](file:///Users/diesel/desktop/skatealley/villainy_inc_textured.glb)) in the Freeman Alley 3D runtime environment.

Per explicit scope directive, this specification is **strictly isolated to the decimation and payload optimization of the Villainy Inc. overhead neon sign asset**. All other Freeman Alley subsystems—including the primary alleyway photogrammetry mesh (`freeman_alley.glb`), character rigs, 17 holographic media columns, 6 wall screen mounts, interactive math pods, watercolor shader portal, planar floor reflections, low-altitude ground fog, pipework and steam emitters, and the MP3 player HUD—must remain untouched.

**DO NOT CODE YET.** This document specifies functional requirements, mathematical models, asset invariants, operational budgets, and observable outcomes only. It contains zero implementation code, concrete syntax, or mechanical diffs.

---

## 2. Authoritative Domain Vocabulary Alignment (`LANGUAGE.md`)

All evaluations of system state, operational constraints, and verification gates within this specification strictly adhere to the authoritative taxonomy established in [`LANGUAGE.md`](file:///Users/diesel/desktop/skatealley/LANGUAGE.md):

- **`{functionality}`**: End-to-end reduction of the overhead `"VILLAINY INC."` 3D sign asset from its unoptimized raw sculpt (`346,446` triangles, `406,881` split glTF vertices, `29.72 MB` binary file size, and `~87.47 MB` uncompressed GPU texture VRAM) to a lightweight, mobile-ready PBR + Emissive glTF 2.0 binary asset ($\le 8,000$ triangles, $\le 2.50\text{ MB}$ total `.glb` file size, $\le 22.0\text{ MB}$ uncompressed GPU texture VRAM) that loads and renders identically in its overhead alley entrance suspension mount (`Z = 5.15 m`) at 60 FPS.
- **`{correctness}`**:
  - Prior to edge-collapse decimation, duplicate 3D vertex positions split along glTF attribute seams (`406,881` raw vertex entries across `173,058` unique 3D spatial positions within $\epsilon = 10^{-5}\text{ m}$) are welded in 3D space so the collapse algorithm operates on a connected manifold rather than fragmenting into disconnected polygons or leaving hundreds of thousands of orphaned vertices.
  - Post-decimation face-corner (`loop`) UV coordinates strictly obey the bi-directional orthographic registration equations for front/perimeter surfaces ($n_z \ge -0.15$) and rear backplate surfaces ($n_z < -0.15$), eliminating UV seam tearing across the front-to-back silhouette boundary where face normals invert.
  - Local 3D bounding-box extents ($X \in [-0.8205, +0.8401]\text{ m}$, $Y \in [-0.5798, +0.5718]\text{ m}$, $Z \in [-0.0595, +0.0548]\text{ m}$), world-space overhead placement ($(0.123, Y_{\text{floor}} + 2.82, 5.15)\text{ m}$), scale ($1.32\times$), yaw orientation ($\pi\text{ rad}$), steel suspension cables, wall anchor plates, and crimson-orange neon fill light (`VillainySignNeonFillLight`) remain $100\%$ invariant.
  - All vertex normal vectors are smooth, unit-length ($\|\vec{n}\|_2 = 1.0 \pm 10^{-4}$), and free of `NaN` or zero-length degeneracies.
- **`{correct required outputs}`**:
  1. A valid, self-contained glTF 2.0 binary at [`/Users/diesel/desktop/skatealley/villainy_inc_textured.glb`](file:///Users/diesel/desktop/skatealley/villainy_inc_textured.glb) (and, if a separate decimated filename is also produced, synchronized with `ASSET_PATHS.villainySign` in [`sandbox.js`](file:///Users/diesel/desktop/skatealley/sandbox.js#L173)) containing exactly `1` mesh (`geometry_0`) with triangle count $T \in [4,500, \, 8,000]$, vertex count $V \le 8,500$, zero loose/unreferenced vertices, and total file size $\le 2.50\text{ MB}$.
  2. Embedded PBR + Emissive texture maps (`base_color`, `emissive`, `metallic-roughness`, `normal`) downscaled from `2400 × 1792` to `1200 × 896` (exact $0.5\times$ aspect-preserving dimensions) or equivalent $\le 1280\text{ px}$ resolution with optimized compression, reducing uncompressed RGBA8 + mipmap GPU memory from `87.47 MB` to $\le 22.0\text{ MB}$ while maintaining perceptual visual similarity $\text{SSIM} \ge 0.95$ against the pre-decimated sign render.
  3. Live runtime verification in the Freeman Alley scene confirming `window.__SANDBOX__.ready === true`, `window.__SANDBOX__.villainySign` mounted at $(0.123, Y_{\text{floor}} + 2.82, 5.15)\text{ m}$ with `emissiveIntensity = 3.10`, intact Scene Cutter compatibility (`VillainyIncOverheadSignGroup`), and zero console or WebGL errors.
- **`{errors}`**:
  - Applying collapse decimation directly to the unwelded `406,881`-vertex glTF import without spatial vertex welding, which leaves $>150,000$ orphaned vertices in the exported buffer or stalls collapse along split UV/normal seams.
  - Allowing edge-collapse interpolation to blend front-face UVs ($u \in [0.043, 0.956], \, v_{\text{gltf}} \in [0.059, 0.896]$) with rear-backplate UVs ($u \in [0.440, 0.540], \, v_{\text{gltf}} \in [0.380, 0.460]$) across silhouette edges, causing streaked neon letters across the rear iron plate or dark iron blotches on the front scrollwork.
  - Altering the mesh's local origin, coordinate-system orientation (Blender $Z$-up vs. glTF $Y$-up), or bounding-box extents such that the 4 steel suspension cables (`VillainySignSupportCable_1..4`) detach from the sign frame.
  - Exporting missing materials, unlinked `KHR_materials_emissive_strength`, or non-color normal/metallic-roughness maps tagged with sRGB transfer functions.
- **`{sufficient}`**: Complete mathematical specification of the pre-decimation spatial welding threshold, target triangle/vertex/byte budgets, exact front/side/back orthographic UV projection equations, PBR material and texture compression parameters, runtime scene integration invariants, and objective verification criteria.
- **`{insufficient}`**: Any specification that omits the pre-decimation spatial welding requirement on `villainy_inc_textured.glb`, fails to specify UV seam protection between front neon and rear iron surfaces, leaves the `87.47 MB` uncompressed texture VRAM unaddressed, or modifies unrelated Freeman Alley subsystems.

---

## 3. Empirical Baseline Analysis of `villainy_inc_textured.glb`

Direct binary inspection of the current [`/Users/diesel/desktop/skatealley/villainy_inc_textured.glb`](file:///Users/diesel/desktop/skatealley/villainy_inc_textured.glb) asset establishes the exact physical baseline that must be remediated:

### 3.1 Raw Geometry & Buffer Footprint
- **Total File Size on Disk:** `31,160,252` bytes (`29.72 MB`).
- **Scene & Node Hierarchy:** `1` scene (`Scene`), `1` root mesh node (`geometry_0`), `1` primitive using material `VillainyInc_PBR_NeonSign` (`doubleSided: true`, `emissiveFactor: [1, 1, 1]`, `KHR_materials_emissive_strength: 5.0`).
- **Primitive Counts:**
  - **Triangles:** `346,446` (`1,039,338` `UNSIGNED_INT` indices, `4,157,352` bytes).
  - **Exported glTF Vertices:** `406,881` (`POSITION`: `4,882,572` bytes; `NORMAL`: `4,882,572` bytes; `TEXCOORD_0`: `3,255,048` bytes).
  - **Unique 3D Spatial Vertex Positions:** `173,058` (within $\epsilon = 10^{-5}\text{ m}$). Over $57\%$ of the exported vertex buffer consists of duplicate 3D coordinates split along normal and UV seams.
  - **Raw Uncompressed Geometry Buffer Total:** `17,177,544` bytes (`16.38 MB`).
- **Authoritative Local glTF ($Y$-Up) Bounding Box:**
  - $X_{\text{gltf}} \in [-0.820469\text{ m}, \, +0.840110\text{ m}]$ ($\Delta X = 1.660578\text{ m}$)
  - $Y_{\text{gltf}} \in [-0.579832\text{ m}, \, +0.571802\text{ m}]$ ($\Delta Y = 1.151634\text{ m}$)
  - $Z_{\text{gltf}} \in [-0.059512\text{ m}, \, +0.054814\text{ m}]$ ($\Delta Z = 0.114326\text{ m}$)

### 3.2 Raw Embedded Texture & GPU VRAM Footprint
All four embedded textures in `villainy_inc_textured.glb` are 3-channel RGB PNG images at `2400 × 1792` resolution:

| BufferView | Image Name | Role & Color Space | Dimensions | Compressed PNG Size | Uncompressed GPU VRAM (RGBA8 + Mips) |
| :---: | :--- | :--- | :---: | :---: | :---: |
| `bufferView[4]` | `emissive` | Emissive Map (`sRGB`) | `2400 × 1792` | `0.76 MB` (`794,875 B`) | `21.87 MB` |
| `bufferView[5]` | `normal` | Tangent Normal Map (`Non-Color`) | `2400 × 1792` | `5.80 MB` (`6,076,983 B`) | `21.87 MB` |
| `bufferView[6]` | `base_color` | Base Color Albedo (`sRGB`) | `2400 × 1792` | `5.07 MB` (`5,320,222 B`) | `21.87 MB` |
| `bufferView[7]` | `metallic-roughness` | ORM / Roughness-Metallic (`Non-Color`) | `2400 × 1792` | `1.71 MB` (`1,788,542 B`) | `21.87 MB` |
| **Total** | **4 Maps** | — | **`2400 × 1792`** | **`13.33 MB`** | **`87.47 MB`** |

---

## 4. Functional & Mathematical Requirements for Asset Decimation

### 4.1 Stage 1 — Pre-Decimation 3D Spatial Vertex Welding & Cleanup
1. When loading the high-poly source mesh (`346,446` triangles, `406,881` split glTF vertices), all vertices must first be welded by 3D Euclidean distance within tolerance $\epsilon_{\text{weld}} = 1.0 \times 10^{-5}\text{ m}$ prior to invoking edge-collapse decimation.
2. This welding operation must reconstruct the contiguous `173,058`-vertex manifold so that edge collapses operate uniformly across the sign's scrolled iron frame, embossed `"VILLAINY INC."` lettering, and rear plate without stalling at split attribute boundaries.
3. After edge-collapse decimation and triangulation, any unreferenced/loose vertices or zero-area degenerate faces must be purged so every exported vertex belongs to at least one valid triangle.

### 4.2 Stage 2 — Target Decimation Ratio & Geometric Fidelity Invariants
1. **Target Triangle Budget:** Reduce the welded manifold from `346,228` triangles to $T_{\text{dec}} \in [4,500, \, 8,000]$ triangles (nominal target $\approx 6,000\text{–}7,000$ triangles, corresponding to a collapse ratio of $r \approx 0.017\text{–}0.020$, a **$\ge 97.7\%$ triangle reduction**).
2. **Dimensional & Silhouette Preservation:**
   - The decimated mesh's axis-aligned bounding box in glTF $Y$-up space must match the source bounding box within $\pm 0.005\text{ m}$ on all three axes ($X \in [-0.8205, +0.8401]\text{ m}$, $Y \in [-0.5798, +0.5718]\text{ m}$, $Z \in [-0.0595, +0.0548]\text{ m}$).
   - The outer scrolled wrought-iron silhouette, corner mounting lugs (where the 4 steel suspension cables attach at $X = \pm 0.76 \cdot S$, $Y = 0.44 \cdot S$ and $Y = 0.16 \cdot S$), and raised front relief contours of the `"VILLAINY INC."` lettering must remain structurally intact with zero holes or non-manifold tears.
3. **Smooth Vertex Normals:** Recompute smooth vertex normals across the decimated mesh so that tangent-space normal mapping (`normal` texture) renders continuous iron relief and bevel specular highlights without faceted low-poly shading artifacts.

### 4.3 Stage 3 — Deterministic Bi-Directional Orthographic UV Registration
Because edge-collapse decimation merges triangles across the perimeter silhouette where front/side faces ($n_z \ge -0.15$) meet rear backplate faces ($n_z < -0.15$), relying on naive UV interpolation across the collapse step would bridge discontinuous UV islands and streak neon texels across the backplate.

Therefore, after decimation and normal updates are finalized, every face-corner (`loop`) on the decimated mesh must be registered using the exact analytical orthographic projection equations of the `"VILLAINY INC."` texture suite:

Let $(x, y, z)$ be the vertex position in glTF $Y$-up coordinates ($+Z$ = Front neon face, $-Z$ = Rear iron backplate, $+Y$ = Up) and $\vec{n}_f = (n_x, n_y, n_z)$ be the unit face normal in glTF $Y$-up coordinates. Define the normalized spatial coordinates across the mesh bounding box $[X_{\min}, X_{\max}] \times [Y_{\min}, Y_{\max}] \times [Z_{\min}, Z_{\max}]$:
$$s_x = \frac{x - X_{\min}}{X_{\max} - X_{\min}} \in [0, 1], \quad s_y = \frac{y - Y_{\min}}{Y_{\max} - Y_{\min}} \in [0, 1], \quad z_{\text{rel}} = \frac{z - Z_{\min}}{Z_{\max} - Z_{\min}} - 0.5 \in [-0.5, +0.5]$$

1. **Front Face & Side Perimeter Loops ($n_z \ge -0.15$):**
   - Map orthographically onto the calibrated foreground sign bounds ($x_{\text{px}} \in [104.0, \, 2295.0]$ of $W_{\text{ref}} = 2400.0$, $y_{\text{px}} \in [106.0, \, 1605.0]$ from top of $H_{\text{ref}} = 1792.0$, matching the exact affine transform of the reference asset to $< 10^{-7}$ error):
     $$u_0 = 0.54975822 \, x + 0.49439282$$
     $$v_{0,\text{gltf}} = -0.72635523 \, y + 0.47448339 \quad \left(v_{0,\text{bl}} = 1.0 - v_{0,\text{gltf}} = 0.72635523 \, y + 0.52551661\right)$$
   - For steep side-extrusion walls ($|n_z| < 0.30$), apply the tangent micro-offset so side bevels sample adjacent weathered iron/neon gradient texels without 1D extrusion streaking:
     $$u = \operatorname{clamp}\!\left(u_0 + 0.00037 \, n_x \, z_{\text{rel}}, \, 0.002, \, 0.998\right)$$
     $$v_{\text{bl}} = \operatorname{clamp}\!\left(v_{0,\text{bl}} + 0.00037 \, n_y \, z_{\text{rel}}, \, 0.002, \, 0.998\right)$$
2. **Rear Backplate Loops ($n_z < -0.15$ and $z_{\text{center}} < -0.015\text{ m}$):**
   - Map onto the interior dark corroded cast-iron substrate patch ($u \in [0.44, 0.54]$, $v_{\text{gltf}} \in [0.38, 0.46]$) where emissive intensity is zero (`#000000`), guaranteeing that viewing the sign from deeper inside the alley looking back toward the entrance reveals a solid weathered iron backplate with zero mirrored neon bleed-through:
     $$u = 0.06021998 \, x + 0.48940861, \quad v_{\text{gltf}} = -0.06946650 \, y + 0.41972109 \quad \left(v_{\text{bl}} = 1.0 - v_{\text{gltf}} = 0.06946650 \, y + 0.58027891\right)$$

### 4.4 Stage 4 — Texture Resolution & Compression Optimization
To eliminate the `87.47 MB` uncompressed GPU VRAM spike and `13.33 MB` compressed PNG transfer cost while preserving razor-sharp neon tubes and rust grain:
1. Extract the four `2400 × 1792` source maps (`base_color`, `emissive`, `metallic-roughness`, `normal`) from the original `villainy_inc_textured.glb`.
2. Downscale all four maps by an exact $0.5\times$ factor to **`1200 × 896`** (preserving the exact $15:11.2$ aspect ratio and all normalized UV coordinates without distortion) using area-averaging interpolation (`INTER_AREA`), and re-normalize the tangent-space normal vectors in the downscaled `normal` map so every pixel encodes a unit-length tangent normal.
3. Encode the embedded glTF textures using high-efficiency lossy/lossless compression (`JPEG` quality `92–95` or `WebP`), maintaining:
   - `base_color`: `sRGB` color space
   - `emissive`: `sRGB` color space, with `KHR_materials_emissive_strength = 5.0` and `emissiveFactor = [1.0, 1.0, 1.0]`
   - `metallic-roughness`: `Non-Color` linear data space (glTF standard: Green channel = Roughness, Blue channel = Metallic)
   - `normal`: `Non-Color` linear data space (`normalScale = 0.85–1.0`)
4. **Backup Preservation:** Prior to overwriting [`/Users/diesel/desktop/skatealley/villainy_inc_textured.glb`](file:///Users/diesel/desktop/skatealley/villainy_inc_textured.glb) or updating its runtime target, preserve a backup or deterministic build script in `scripts/` so the decimation pipeline is reproducible.

---

## 5. Scene Staging & Runtime Integration Contract (`sandbox.js`)

The decimated Villainy Inc. sign must integrate into [`buildVillainyNeonSignSubsystem`](file:///Users/diesel/desktop/skatealley/sandbox.js#L15105-L15198) with zero regressions to the surrounding scene graph:

1. **Asset Loading & Naming Contract:**
   - `ASSET_PATHS.villainySign` in [`sandbox.js`](file:///Users/diesel/desktop/skatealley/sandbox.js#L173) must resolve to the decimated `.glb` asset (either replacing [`./villainy_inc_textured.glb`](file:///Users/diesel/desktop/skatealley/villainy_inc_textured.glb) in-place with cache-busting query string or pointing to the decimated `.glb` while keeping `./villainy_inc_textured.glb` updated in-place so external inspectors find the optimized binary).
2. **World Transform & Suspension Hardware Invariants:**
   - Root container group: `VillainyIncOverheadSignGroup` (`renderOrder = 5`).
   - Assembly group: `VILLAINY_INC_OVERHEAD_SIGN` positioned at:
     $$X_{\text{sign}} = \frac{x_L(5.15) + x_R(5.15)}{2} \approx 0.123\text{ m}, \quad Y_{\text{sign}} = Y_{\text{floor}} + 2.82\text{ m}, \quad Z_{\text{sign}} = 5.15\text{ m}$$
   - Cloned model root: `VillainyIncSignMeshRoot` with `rotation = (0, \pi, 0)` (facing $-Z$ toward the alley entrance camera) and uniform scale `1.32`.
   - Material runtime override: `emissiveIntensity = 3.10` applied across all mesh materials on `VillainyIncSignMeshRoot`.
   - Local neon fill light: `VillainySignNeonFillLight` (`PointLight`, color `0xff4224`, intensity `2.4`, distance `6.5`, decay `1.6`, local offset `(0.0, 0.05, -0.48)`).
   - Suspension hardware: 4 weathered steel tension rods (`VillainySignSupportCable_1..4`) and 4 brick wall anchor plates (`VillainySignWallAnchor_1..4`).
3. **Scene Cutter Compatibility:**
   - [`scene_cutter.js`](file:///Users/diesel/desktop/skatealley/scene_cutter.js#L544) references `scene.getObjectByName('VillainyIncOverheadSignGroup')`; this group hierarchy and naming must remain unchanged.

---

## 6. Operational & Performance Budgets

| Metric / Parameter | Pre-Optimization Baseline | Mandatory Target Budget | Reduction / Improvement |
| :--- | :---: | :---: | :---: |
| **Triangle Count ($T$)** | `346,446` tris | **$4,500 \le T \le 8,000$ tris** | **$\ge 97.7\%$ reduction** |
| **Exported glTF Vertex Count ($V$)** | `406,881` verts | **$V \le 8,500$ verts** (0 loose verts) | **$\ge 97.9\%$ reduction** |
| **Raw Geometry Buffer Size** | `16.38 MB` (`17,177,544 B`) | **$\le 0.35\text{ MB}$** ($\le 358,400\text{ B}$) | **$\ge 97.8\%$ reduction** |
| **Texture Resolution (4 Maps)** | `2400 × 1792` (`4.30 MP` each) | **`1200 × 896`** (`1.08 MP` each) | **$75.0\%$ pixel reduction** |
| **Uncompressed GPU Texture VRAM** | `87.47 MB` (RGBA8 + mips) | **$\le 22.00\text{ MB}$** (RGBA8 + mips) | **$75.0\%$ VRAM reduction** |
| **Total `.glb` File Size on Disk** | `29.72 MB` (`31,160,252 B`) | **$\le 2.50\text{ MB}$** ($\le 2,621,440\text{ B}$) | **$\ge 91.6\%$ payload reduction** |
| **Perceptual Visual Fidelity (SSIM)** | `1.000` (Reference) | **$\text{SSIM} \ge 0.95$** (front render) | Visually indistinguishable in-scene |

---

## 7. Edge Cases, Failure Modes & Recovery Boundaries

1. **Unwelded glTF Seam Explosion During Decimation:**
   - *Failure Mode:* Running `DECIMATE` directly on the imported glTF mesh without first welding vertices by spatial proximity ($\epsilon = 10^{-5}\text{ m}$) leaves $>150,000$ unreferenced vertices in the mesh data block or causes cracks along UV/normal seams.
   - *Requirement:* Spatial vertex welding (`remove_doubles` at $10^{-5}\text{ m}$) and post-decimation loose-vertex removal are mandatory gates before glTF export; the exported accessor count for `POSITION` must be $\le 8,500$.
2. **Front-to-Back UV Bleed Across Collapsed Perimeter Edges:**
   - *Failure Mode:* Edges collapsing across the $n_z = -0.15$ normal threshold interpolate between front neon UVs and rear dark-iron UVs, painting glowing red/orange streaks across the back of the sign.
   - *Requirement:* Re-evaluate the deterministic face-loop UV projection (§4.3) *after* the decimate modifier is applied and triangulated so every triangle's three loops belong cleanly to either the front/side domain ($n_z \ge -0.15$) or the rear backplate domain ($n_z < -0.15$).
3. **Blender JPEG Export Channel-Socket Compatibility (`metallic-roughness`):**
   - *Failure Mode:* Blender's glTF 2.0 exporter requires the `Metallic` and `Roughness` inputs of `ShaderNodeBsdfPrincipled` to be fed via a `ShaderNodeSeparateColor` node from a combined ORM map (or separate grayscale maps) so the exported glTF packs Roughness into Green and Metallic into Blue.
   - *Requirement:* Verify that the exported `.glb` material JSON contains valid `baseColorTexture`, `metallicRoughnessTexture`, `normalTexture`, and `emissiveTexture` bindings matching the original material contract (`VillainyInc_PBR_NeonSign`).
4. **Fail-Fast Asset Validation:**
   - If the decimated `.glb` fails to load or contains zero mesh primitives, `buildVillainyNeonSignSubsystem` must fail fast via `raiseFatalError` rather than silently rendering an empty group or masking the error.

---

## 8. Verifiable `{correct required outputs}`

Implementation of this specification is complete (`{sufficient}`) only when all of the following objective checks pass:

1. **Binary `.glb` Structural Audit:**
   - Inspecting [`/Users/diesel/desktop/skatealley/villainy_inc_textured.glb`](file:///Users/diesel/desktop/skatealley/villainy_inc_textured.glb) confirms:
     - Total file size $\le 2,621,440\text{ bytes}$ ($\le 2.50\text{ MB}$).
     - Primitive triangle count $T \in [4,500, \, 8,000]$ and vertex count $V \le 8,500$.
     - Bounding box `min` and `max` on `POSITION` accessor match $[-0.8205, -0.5798, -0.0595]$ and $[+0.8401, +0.5718, +0.0548]$ within $\pm 0.005\text{ m}$.
     - All 4 PBR + Emissive textures (`base_color`, `emissive`, `metallic-roughness`, `normal`) are present at `1200 × 896` resolution.
2. **Live Browser Runtime Telemetry Audit:**
   - Loading the live Freeman Alley scene in a headless browser and inspecting `window.__SANDBOX__` confirms:
     - `window.__SANDBOX__.ready === true` with zero fatal error banners or console errors.
     - `window.__SANDBOX__.villainySign` is present at `{ x: 0.123, relY: 2.82, z: 5.15, scale: 1.32, yawRad: Math.PI }`.
     - Traversing `window.__SANDBOX__.villainySign.model` confirms total rendered triangles $\in [4,500, \, 8,000]$, `emissiveIntensity === 3.10`, and all 4 texture maps bound (`map`, `emissiveMap`, `roughnessMap`/`metalnessMap`, `normalMap`).
