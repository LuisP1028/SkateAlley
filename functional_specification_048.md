# Functional Specification 048: Deterministic Level Wall & Floor Bounding Envelopes and Unoccluded Sticker Visibility Across Freeman Alley

## 1. Authoritative Glossary & Evaluation Taxonomy (`LANGUAGE.md`)

All requirements, mathematical invariants, and verification gates in this specification strictly adopt the evaluation taxonomy defined in [LANGUAGE.md](file:///Users/diesel/desktop/skatealley/LANGUAGE.md):

- **`{errors}`**: Explicit failure states or structural invariant breaches surfaced during planning, execution, or verification—including unhandled exceptions, silent fallbacks (`RULE[user_global]`), depth-buffer burial where a placed or previewed sticker is occluded behind `VISUAL_ALLEY_MESH`, non-level surface tangents that skew or roll stickers on vertical walls or floors, mid-air blocking colliders that intercept exterior camera rays, or per-frame raycast latency spikes exceeding the 60 FPS frame budget.
- **`{correctness}`**: Contract fidelity and mathematical accuracy across the entire surface-alignment and sticker-placement pipeline:
  1. Every wall bounding surface maintains a strictly plumb, level horizontal tangent ($\vec{N}_{\text{wall}} = (n_x, 0, n_z)$ with $n_y = 0$ and horizontal right-tangent $\vec{T} \perp \vec{Y}_{\text{world}}$ with $T_y = 0$).
  2. Every floor bounding surface maintains a level lateral cross-section across $X$ ($N_x = 0$, $T_y = 0$) and follows the true upper pavement envelope of `VISUAL_ALLEY_MESH` and `PlanarFloorReflectionMesh`.
  3. Every previewed or placed sticker of size $S \in [S_{\min}, S_{\max}]$ sits at a deterministic positive clearance $\Delta d_{\text{clear}} \ge +0.015\text{ m}$ in front of / above the visible photogrammetry surface across its entire 2D footprint $[-\frac{W}{2}, +\frac{W}{2}] \times [-\frac{H}{2}, +\frac{H}{2}]$.
- **`{functionality}`**: End-to-end interactive sticker placement, previewing, resizing, and rotation across the entire Freeman Alley scene—covering the interior Left and Right Alleyway Walls ($Z \in [0.0\text{ m}, 42.5\text{ m}]$), the Exterior Left and Right Building Facade and Return Walls right outside the alleyway ($Z \in [-8.5\text{ m}, 0.0\text{ m}]$), and the Interior and Exterior Floor ($Z \in [-8.5\text{ m}, 42.5\text{ m}]$)—such that stickers remain level and visibly unoccluded throughout the full scene.
- **`{correct required outputs}`**: Objectively measurable runtime states and telemetry metrics proving:
  1. Positive signed clearance ($\Delta d_{\text{clear}} \ge +0.015\text{ m}$) between the placed/previewed sticker plane and `VISUAL_ALLEY_MESH` across the sticker's center and 4 corners at every valid wall and floor station.
  2. Strict surface-normal alignment ($\vec{N}_{\text{sticker}} \cdot \vec{N}_{\text{level}} \ge 0.999$) and level tangent horizontal lock ($|T_y| \le 10^{-6}$ on all walls and floors).
  3. Zero depth-buffer burial of stickers behind brick walls, wall pilasters/alcoves, exterior building facades, or floor crowns/curbs, verified both by live raycast telemetry and multi-viewpoint Playwright visual screenshots.
- **`{sufficient}` / `{insufficient}`**: Documentation and verification are `{sufficient}` only when backed by empirical world-space coordinates measured from the live `VISUAL_ALLEY_MESH` (`120,153` vertices across `VISUAL_ALLEY_MESH_1`, `VISUAL_ALLEY_MESH_2`, `VISUAL_ALLEY_MESH_3`) using Playwright live raycast/camera inspection and `glbforge` geometry analysis, and verified against live runtime reality without synthetic mocks or arbitrary visual hacks.

---

## 2. Empirical Root-Cause Diagnosis & Feasibility Analysis (`RULE[user_global]`)

### 2.1 Why Stickers Currently Appear Invisible (Buried Behind/Beneath `VISUAL_ALLEY_MESH`)

Deterministic geometric inspection of `freeman_alley.glb` (`glbforge` `inspect_geometry`) combined with live Playwright raycast scans and multi-viewpoint camera screenshots (`syncPOVStateFromPose` + `browser_take_screenshot`) against `VISUAL_ALLEY_MESH` (`120,153` vertices, `renderOrder: 0`, `depthWrite: true`) and `PlanarFloorReflectionMesh` (`renderOrder: 2`) revealed four physical mismatches in the current bounding surfaces:

1. **Interior Left & Right Bounding Walls Are Recessed `3.6 cm` to `102.7 cm` Behind the Visible Brick Walls:**
   - The current wall profile knots in [`resolveStickerWallProfileX`](file:///Users/diesel/desktop/skatealley/holographic_stickers.js#L1337-L1362) were derived from the outer physics hull (`COLLIDER_WALL_L`, `COLLIDER_WALL_R`) rather than the innermost corridor-facing brick and metal surfaces of `VISUAL_ALLEY_MESH`:
     - **Left Alley Wall (`-X`, corridor side is $+X$):**
       - Across $Z = 0.0\text{ m}..24.0\text{ m}$, live raycasts from the corridor centerline ($X = 0$) hit the visible Left Wall brick face along a linear inner profile from $X = -1.579\text{ m}$ ($Z = 0\text{ m}$), $-1.654\text{ m}$ ($Z = 2\text{ m}$), $-1.730\text{ m}$ ($Z = 4\text{ m}$), $-1.885\text{ m}$ ($Z = 8\text{ m}$), $-2.038\text{ m}$ ($Z = 12\text{ m}$), $-2.189\text{ m}$ ($Z = 16\text{ m}$), $-2.339\text{ m}$ ($Z = 20\text{ m}$) to $-2.488\text{ m}$ ($Z = 24\text{ m}$), whereas `COLLIDER_STICKER_WALL_L` sits recessed at $X \in [-1.720\text{ m}, -2.581\text{ m}]$ (**`9.3 cm` to `14.1 cm` behind the visible wall**).
       - At $Z \in [25.8\text{ m}, 26.5\text{ m}]$, Playwright visual inspection confirmed a corridor-facing architectural step where the Left Wall steps inward by $\approx 0.75\text{ m}$ from $X = -2.53\text{ m}$ to $X = -1.78\text{ m}$, and then runs from $X = -1.755\text{ m}$ ($Z = 28\text{ m}$), $-1.650\text{ m}$ ($Z = 32\text{ m}$), $-1.641\text{ m}$ ($Z = 36\text{ m}$), $-1.528\text{ m}$ ($Z = 40\text{ m}$) to $-1.467\text{ m}$ ($Z = 42\text{ m}$). In contrast, `COLLIDER_STICKER_WALL_L` interpolates out to $X = -2.660\text{ m}$ at $Z = 26.2\text{ m}$ (**up to `102.7 cm` behind the visible wall**).
       - Right at the alley threshold ($Z \in [-0.4\text{ m}, +0.2\text{ m}]$), Playwright visual inspection identified an open perpendicular black metal gate frame extending from the Left Wall out to $X = -0.088\text{ m}$, which must be filtered out of the Left Wall surface envelope so stickers at the entrance adhere flush to the brick wall ($X \approx -1.58\text{ m}$).
     - **Right Alley Wall (`+X`, corridor side is $-X$):**
       - Across $Z = 0.0\text{ m}..42.5\text{ m}$, live raycasts from $X = 0$ hit the visible Right Wall face at $X = +2.229\text{ m}$ ($Z = 0\text{ m}$), $+2.187\text{ m}$ ($Z = 2\text{ m}$), $+2.130\text{ m}$ ($Z = 4\text{ m}$), $+2.037\text{ m}$ ($Z = 8\text{ m}$), $+1.942\text{ m}$ ($Z = 12\text{ m}$), $+1.807\text{ m}$ ($Z = 16\text{ m}$), $+1.765\text{ m}$ ($Z = 20\text{ m}$), $+1.653\text{ m}$ ($Z = 24\text{ m}$), $+1.567\text{ m}$ ($Z = 28\text{ m}$), $+1.485\text{ m}$ ($Z = 30\text{ m}$), $+1.468\text{ m}$ ($Z = 34\text{ m}$), $+1.478\text{ m}$ ($Z = 38\text{ m}$), $+1.560\text{ m}$ ($Z = 40\text{ m}$), and $+1.770\text{ m}$ ($Z = 42\text{ m}$), whereas `COLLIDER_STICKER_WALL_R` is recessed `3.8 cm` to `18.0 cm` behind the visible brick wall (and up to `60.1 cm` behind the $Z = 38\text{ m}..40\text{ m}$ right-wall structural feature reaching $X = +1.10\text{ m}$).
   - Because a $+0.015\text{ m}$ (`1.5 cm`) normal offset is smaller than the `3.8 cm–102.7 cm` recession, `VISUAL_ALLEY_MESH` writes closer depth values to the WebGL depth buffer and completely hides placed stickers.

2. **Vertical Relief Across Wall Height $Y$ (`8 cm` to `45 cm` Variation at Fixed $Z$):**
   - Because `VISUAL_ALLEY_MESH` is a photogrammetry scan containing brick courses, window sills, ledges, pipes, and pilasters, even at a single corridor station $Z$ the wall surface $X(z, y)$ varies by `8 cm` to `45 cm` across height $Y \in [0.4\text{ m}, 5.5\text{ m}]$. A single 1D curve $X(z)$ that sits at the recessed brick base will still be occluded wherever local relief protrudes into the sticker's 2D footprint $[W \times H]$.

3. **Floor Bounding Surface (`COLLIDER_STICKER_FLOOR`) Does Not Track the True Upper Walkable Pavement Envelope:**
   - Live downward raycasts along $(0, -1, 0)$ across the walkable corridor and exterior forecourt measured the upper pavement profile $Y_{\text{max,floor}}(z)$: $+0.362\text{ m}$ ($Z = -8\text{ m}$), $+0.185\text{ m}$ ($Z = -6\text{ m}$), $+0.231\text{ m}$ ($Z = -4\text{ m}$), $+0.221\text{ m}$ ($Z = -2\text{ m}$), $+0.230\text{ m}$ ($Z = 0\text{ m}$), $+0.234\text{ m}$ ($Z = 2\text{ m}$), $+0.191\text{ m}$ ($Z = 4\text{ m}$), $+0.150\text{ m}$ ($Z = 6\text{ m}$), $+0.124\text{ m}$ ($Z = 8\text{ m}$), $+0.075\text{ m}$ ($Z = 12\text{ m}$), $+0.017\text{ m}$ ($Z = 16\text{ m}$), $-0.035\text{ m}$ ($Z = 20\text{ m}$), $-0.086\text{ m}$ ($Z = 24\text{ m}$), $-0.095\text{ m}$ ($Z = 26\text{ m}$), $-0.038\text{ m}$ ($Z = 30\text{ m}$), $+0.026\text{ m}$ ($Z = 34\text{ m}$), $+0.067\text{ m}$ ($Z = 38\text{ m}$), and $+0.040\text{ m}$ ($Z = 42\text{ m}$), with `4 cm` to `13 cm` of lateral camber between the center channel ($X = 0$) and the left/right curbs ($X = \pm 0.9\text{ m}$).

4. **Exterior Building Walls Right Outside the Alleyway ($Z \le 0.0\text{ m}$) Are Recessed Behind the Storefront Facades and Blocked by `COLLIDER_STICKER_BOUND_START`:**
   - Playwright exterior street POV inspection ($Z = -6.5\text{ m}$ looking toward $+Z$) and height-stratified raycasts ($Y \in [1.8\text{ m}, 4.0\text{ m}]$) revealed that both exterior buildings form co-planar street-facing facades angled at $\approx 2.4^\circ$, with foreground street props below $Y = 1.85\text{ m}$:
     - **Left Exterior Building (`-X`, painted brick/mural facade):** Connects from the Left Interior Wall mouth $(X = -1.58\text{ m}, Z = 0.00\text{ m})$ via an entrance pier return to $(X = -1.58\text{ m}, Z = -0.55\text{ m})$, and runs along the street-facing building wall from $(X = -1.58\text{ m}, Z = -0.55\text{ m})$ through $(X = -4.00\text{ m}, Z = -0.66\text{ m})$ to $(X = -9.40\text{ m}, Z = -0.86\text{ m})$ (while a parked car and sidewalk planters sit in front on the street at $Z \approx -2.32\text{ m}$ for $Y \le 1.85\text{ m}$). Placing `COLLIDER_STICKER_EXTERIOR_L` at $Z = 0.0\text{ m}$ buries stickers `55 cm` to `86 cm` behind the visible exterior building wall.
     - **Right Exterior Building (`+X`, `FREEMANS SPORTING CLUB` shuttered storefront facade):** Connects from the Right Interior Wall mouth $(X = +2.23\text{ m}, Z = 0.00\text{ m})$ via an entrance pier return to $(X = +2.23\text{ m}, Z = -0.45\text{ m})$, and runs along the shuttered storefront facade from $(X = +2.23\text{ m}, Z = -0.45\text{ m})$ through $(X = +6.90\text{ m}, Z = -0.37\text{ m})$ to $(X = +10.20\text{ m}, Z = -0.17\text{ m})$ (while foreground street barriers sit at $Z \approx -4.36\text{ m}$ around $X = +4.0\text{ m}$ and overhanging tree branches sit at $Z \approx -2.90\text{ m}$ for $X \in [+7.2\text{ m}, +8.7\text{ m}], Y \ge 3.8\text{ m}$). Placing `COLLIDER_STICKER_EXTERIOR_R` at $Z = 0.0\text{ m}$ buries stickers `17 cm` to `45 cm` behind the visible storefront.
   - Meanwhile, `COLLIDER_STICKER_BOUND_START` at $Z = -10.5\text{ m}$ acts as an invisible wall in mid-air that intercepts exterior rays before they can reach the exterior building walls or floor.

### 2.2 Operational & Latency Budget (Why Live Multi-Ray Mesh Intersection Is Prohibited in the Hot Path)

Empirical benchmarking on `http://localhost:8080/` measured:
- **Live Raycast Against `VISUAL_ALLEY_MESH` (`120,153` vertices):** `4.408 ms` per single ray (`22.04 ms` for a 5-point footprint check per `pointermove`), which exceeds the entire `16.67 ms` (`60 FPS`) frame budget and would cause severe frame drops during interactive sticker previewing.
- **One-Time Vertex Scan of `VISUAL_ALLEY_MESH` at Initialization:** `4.60 ms` total for all `120,153` vertices.
- **Low-Poly Level Collider Raycast + Pre-Baked 2D Spatial Envelope Lookup:** `< 0.08 ms` per `pointermove` (**> 275× faster** than live multi-ray `VISUAL_ALLEY_MESH` intersection).

Therefore, per-pointer-move raycasting MUST NOT intersect the 120,153-vertex `VISUAL_ALLEY_MESH` directly in the `pointermove` hot path. Instead, the system MUST use calibrated, level low-poly bounding surfaces combined with a deterministic, $O(1)$ pre-computed surface-relief envelope (extracted once from the visual scene meshes at initialization and/or encoded in the deterministic envelope table) so every preview update completes in **$\le 0.25\text{ ms}$**.

---

## 3. Desired Functional Behavior & System Requirements

### 3.1 Deterministic Level Wall & Floor Orientation Invariants

To guarantee that stickers never appear crooked, skewed, or warped by noisy photogrammetry triangles, every sticker-receivable surface zone MUST enforce a **strictly level geometric orientation**:

1. **All Interior & Exterior Vertical Walls (`COLLIDER_STICKER_WALL_L`, `COLLIDER_STICKER_WALL_R`, `COLLIDER_STICKER_EXTERIOR_L`, `COLLIDER_STICKER_EXTERIOR_R`, `COLLIDER_STICKER_BOUND_END`):**
   - **Plumb Surface Normal ($\vec{N}_{\text{level}}$):** The outward surface normal $\vec{N}_{\text{level}} = (n_x, 0, n_z)$ MUST lie strictly in the horizontal $XZ$-plane ($n_y = 0$, $\|\vec{N}_{\text{level}}\| = 1$) and point toward the navigable corridor or street interior.
   - **Level Horizontal Tangent ($\vec{T}_{\text{level}}$) & Vertical Bitangent ($\vec{U}_{\text{level}}$):** At baseline rotation $\theta = 0\text{ rad}$, the sticker's local vertical axis $\vec{U}_0 = (0, 1, 0)$ MUST be parallel to world $+Y$, and its local horizontal right axis $\vec{T}_0 = \vec{U}_0 \times \vec{N}_{\text{level}}$ MUST have zero vertical component ($T_{0,y} = 0$).
   - **Right-Handed Unmirrored Basis:** $\det([\vec{T}(\theta), \vec{U}(\theta), \vec{N}_{\text{level}}]) = +1.0$ for all user rotations $\theta \in [-\pi, +\pi]$, ensuring sticker artwork and typography read left-to-right without horizontal mirroring on any wall.

2. **Interior & Exterior Floor (`COLLIDER_STICKER_FLOOR`):**
   - **Level Lateral Cross-Section Across $X$:** At any longitudinal station $Z \in [-8.5\text{ m}, 42.5\text{ m}]$, the floor bounding surface MUST be laterally level across $X$ ($N_x = 0$, horizontal right tangent $\vec{T}_0 = (\pm 1, 0, 0)$ with $T_{0,y} = 0$) so stickers placed on the floor never roll left or right on curb edges or drainage slopes.
   - **Smooth Longitudinal Elevation Profile $Y_{\text{floor}}(z)$:** The floor height $Y_{\text{floor}}(z)$ MUST track the upper corridor pavement envelope across $Z \in [-8.5\text{ m}, 42.5\text{ m}]$ so the floor collider never dips beneath the visible pavement or `PlanarFloorReflectionMesh`.

---

### 3.2 Empirically Calibrated Level Bounding Surfaces Across the Full Scene

The bounding surface assembly (`buildStickerBoundingSurfaces`) MUST cover all visible walls and floors inside and right outside the alleyway up to the active scene boundary ($Z \in [-8.5\text{ m}, 42.5\text{ m}]$, with extension to $Z = 71.2\text{ m}$ when the scene cutter is restored), using the exact coordinates deterministically verified via Playwright visual inspection and `VISUAL_ALLEY_MESH` raycasting:

1. **Interior Left Alley Wall (`COLLIDER_STICKER_WALL_L`, $Z \in [0.0\text{ m}, 71.2\text{ m}]$, $Y \in [-0.15\text{ m}, 6.80\text{ m}]$):**
   - Anchored to the measured inner-corridor brick/wall envelope $X_{\text{left}}(z)$ of `VISUAL_ALLEY_MESH`:
     - $(Z = 0.0\text{ m}, X = -1.58\text{ m}) \to (Z = 8.0\text{ m}, X = -1.89\text{ m}) \to (Z = 16.0\text{ m}, X = -2.19\text{ m}) \to (Z = 24.0\text{ m}, X = -2.49\text{ m}) \to (Z = 25.8\text{ m}, X = -2.53\text{ m})$
     - Mid-alley inward step at $(Z = 25.8\text{ m}, X = -2.53\text{ m}) \to (Z = 26.5\text{ m}, X = -1.78\text{ m})$
     - Inner back-alley wall from $(Z = 26.5\text{ m}, X = -1.78\text{ m}) \to (Z = 32.0\text{ m}, X = -1.65\text{ m}) \to (Z = 36.0\text{ m}, X = -1.64\text{ m}) \to (Z = 40.0\text{ m}, X = -1.53\text{ m}) \to (Z = 42.5\text{ m}, X = -1.47\text{ m}) \to (Z = 58.0\text{ m}, X = -1.68\text{ m}) \to (Z = 71.2\text{ m}, X = -1.50\text{ m})$, with outward normal pointing toward the corridor interior ($+X$).

2. **Interior Right Alley Wall (`COLLIDER_STICKER_WALL_R`, $Z \in [0.0\text{ m}, 71.2\text{ m}]$, $Y \in [-0.15\text{ m}, 6.80\text{ m}]$):**
   - Anchored to the measured inner-corridor brick/wall envelope $X_{\text{right}}(z)$ of `VISUAL_ALLEY_MESH`:
     - $(Z = 0.0\text{ m}, X = +2.23\text{ m}) \to (Z = 4.0\text{ m}, X = +2.13\text{ m}) \to (Z = 8.0\text{ m}, X = +2.04\text{ m}) \to (Z = 12.0\text{ m}, X = +1.94\text{ m}) \to (Z = 16.0\text{ m}, X = +1.81\text{ m}) \to (Z = 20.0\text{ m}, X = +1.76\text{ m}) \to (Z = 24.0\text{ m}, X = +1.65\text{ m}) \to (Z = 28.0\text{ m}, X = +1.57\text{ m}) \to (Z = 30.0\text{ m}, X = +1.48\text{ m}) \to (Z = 34.0\text{ m}, X = +1.47\text{ m}) \to (Z = 38.0\text{ m}, X = +1.48\text{ m}) \to (Z = 40.0\text{ m}, X = +1.56\text{ m}) \to (Z = 42.5\text{ m}, X = +1.77\text{ m})$ (and continuing along the far-alley right-wall knots to $Z = 71.2\text{ m}$), with outward normal pointing toward the corridor interior ($-X$).

3. **Exterior Left Building Walls Right Outside the Alleyway (`COLLIDER_STICKER_EXTERIOR_L`, $Z \in [-8.5\text{ m}, 0.0\text{ m}]$, $Y \in [-0.15\text{ m}, 6.80\text{ m}]$):**
   - Must accurately follow the visible exterior left building segments verified in Playwright rather than sitting buried at $Z = 0.0\text{ m}$:
     - **Left Entrance Threshold Return ($Z \in [-0.55\text{ m}, 0.00\text{ m}]$):** Corridor-mouth return wall at $X = -1.58\text{ m}$ with outward normal $(+1, 0, 0)$.
     - **Left Street-Facing Building Facade ($X \in [-9.40\text{ m}, -1.58\text{ m}]$):** Plumb front-facing building facade running from $(X = -1.58\text{ m}, Z = -0.55\text{ m})$ through $(X = -4.00\text{ m}, Z = -0.66\text{ m})$ to $(X = -9.40\text{ m}, Z = -0.86\text{ m})$ with outward normal pointing toward the street ($-Z$), plus outer flank closure at $X = -9.40\text{ m}$ across $Z \in [-8.50\text{ m}, -0.86\text{ m}]$ with outward normal $(+1, 0, 0)$.

4. **Exterior Right Building Walls Right Outside the Alleyway (`COLLIDER_STICKER_EXTERIOR_R`, $Z \in [-8.5\text{ m}, 0.0\text{ m}]$, $Y \in [-0.15\text{ m}, 6.80\text{ m}]$):**
   - Must accurately follow the visible exterior right `FREEMANS SPORTING CLUB` storefront segments verified in Playwright:
     - **Right Entrance Threshold Return ($Z \in [-0.45\text{ m}, 0.00\text{ m}]$):** Corridor-mouth return wall at $X = +2.23\text{ m}$ with outward normal $(-1, 0, 0)$.
     - **Right Street-Facing Storefront Facade ($X \in [+2.23\text{ m}, +10.20\text{ m}]$):** Plumb front-facing wall running from $(X = +2.23\text{ m}, Z = -0.45\text{ m})$ through $(X = +6.90\text{ m}, Z = -0.37\text{ m})$ to $(X = +10.20\text{ m}, Z = -0.17\text{ m})$ with outward normal pointing toward the street ($-Z$), plus outer flank closure at $X = +10.20\text{ m}$ across $Z \in [-8.50\text{ m}, -0.17\text{ m}]$ with outward normal $(-1, 0, 0)$.

5. **Removal of Mid-Air Front Curtain Obstruction (`COLLIDER_STICKER_BOUND_START`):**
   - `COLLIDER_STICKER_BOUND_START` at $Z = -10.5\text{ m}$ MUST NOT intercept sticker placement raycasts in open air in front of the alley entrance ($Z < 0\text{ m}$), ensuring camera rays from outside the alleyway strike `COLLIDER_STICKER_EXTERIOR_L`, `COLLIDER_STICKER_EXTERIOR_R`, `COLLIDER_STICKER_WALL_L/R`, or `COLLIDER_STICKER_FLOOR` directly.

6. **Level Upper-Envelope Floor (`COLLIDER_STICKER_FLOOR`, $Z \in [-8.5\text{ m}, 71.2\text{ m}]$):**
   - Calibrated to the upper visible walkable pavement envelope across both the exterior street/sidewalk ($Z \in [-8.5\text{ m}, 0.0\text{ m}]$, tracking $Y = +0.36\text{ m}$ at $Z = -8\text{ m}$, $+0.19\text{ m}$ at $Z = -6\text{ m}$, and $+0.23\text{ m}$ at $Z = -4\text{ m}..0\text{ m}$) and the interior corridor ($Z \in [0.0\text{ m}, 42.5\text{ m}]$, tracking $Y = +0.23\text{ m}$ at $Z = 0\text{ m}..2\text{ m}$, $+0.19\text{ m}$ at $Z = 4\text{ m}$, $+0.12\text{ m}$ at $Z = 8\text{ m}$, $+0.08\text{ m}$ at $Z = 12\text{ m}$, $+0.02\text{ m}$ at $Z = 16\text{ m}$, $-0.03\text{ m}$ at $Z = 20\text{ m}$, $-0.08\text{ m}$ at $Z = 24\text{ m}..26\text{ m}$, $-0.04\text{ m}$ at $Z = 30\text{ m}$, $+0.03\text{ m}$ at $Z = 34\text{ m}$, $+0.07\text{ m}$ at $Z = 38\text{ m}$, and $+0.04\text{ m}$ at $Z = 42.5\text{ m}$, sitting above both `VISUAL_ALLEY_MESH` and `PlanarFloorReflectionMesh`).

---

### 3.3 Deterministic Visual-Mesh Envelope Projection & Footprint Clearance Clamping

Because `VISUAL_ALLEY_MESH` has localized 3D relief (protruding bricks, pipes, window sills, pilasters, and floor crowns/curbs) that varies across $(X, Y, Z)$, static low-poly planes alone cannot simultaneously sit flush on flat brick sections and clear `10 cm–45 cm` local protrusions everywhere. Therefore, the sticker system MUST implement a **Deterministic Visual-Mesh Envelope Clearance Projection**:

1. **One-Time Visual Surface Envelope Extraction (`O(N)` at Initialization, `O(1)` at Runtime):**
   - When connected to the Three.js scene containing `VISUAL_ALLEY_MESH` (or on first placement/preview after `VISUAL_ALLEY_MESH` is loaded), the system MUST scan the world-space vertices of `VISUAL_ALLEY_MESH` (and `PlanarFloorReflectionMesh`) once (`< 6 ms` budget) into deterministic 2D spatial relief grids (Lookup Tables / heightfields):
     - **Left Wall Relief Grid $X_{\text{max},L}(z, y)$:** Maximum (most $+X$, corridor-ward) vertex $X$ within each $(z, y)$ cell for the Left Wall ($X < -0.95\text{ m}$, excluding the perpendicular entrance gate at $Z \in [-0.5\text{ m}, +0.5\text{ m}], X > -1.45\text{ m}$).
     - **Right Wall Relief Grid $X_{\text{min},R}(z, y)$:** Minimum (most $-X$, corridor-ward) vertex $X$ within each $(z, y)$ cell for the Right Wall ($X > +1.05\text{ m}$).
     - **Exterior Left & Right Facade Relief Grids $Z_{\text{min,ext}}(x, y)$:** Minimum (most $-Z$, street-ward) building-wall vertex $Z$ within each $(x, y)$ cell for the exterior facades ($Z \in [-1.15\text{ m}, +0.20\text{ m}]$, filtering out detached street-level vehicles/barriers at $Z < -1.15\text{ m}$).
     - **Floor Upper-Envelope Grid $Y_{\text{max,floor}}(x, z)$:** Maximum floor vertex $Y$ (filtering floor/curb geometry $Y \le 0.45\text{ m}$ within walkable corridor/forecourt bounds) within each $(x, z)$ cell across the interior and exterior floor.
   - If `VISUAL_ALLEY_MESH` is not present (e.g., in isolated unit tests), the envelope lookup MUST deterministically fall back to the calibrated analytical inner-envelope profile functions without throwing or degrading.

2. **Multi-Point Sticker Footprint Clearance Evaluation (`O(1)` Per Preview/Placement/Resize/Rotate):**
   - Whenever a sticker of world-space width $W$ and height $H$ is previewed, placed, resized, or rotated at hit point $\vec{P}_{\text{hit}}$ on a level bounding surface with normal $\vec{N}_{\text{level}}$ and in-plane basis $(\vec{T}(\theta), \vec{U}(\theta))$:
     - The system MUST sample the relief envelope across the sticker's 2D oriented footprint (at minimum 9 points: center $(0, 0)$, 4 corners $(\pm \frac{W}{2}, \pm \frac{H}{2})$, and 4 edge midpoints $(\pm \frac{W}{2}, 0), (0, \pm \frac{H}{2})$):
       $$\vec{Q}_k = \vec{P}_{\text{hit}} + u_k \vec{T}(\theta) + v_k \vec{U}(\theta)$$
     - The sticker plane's position along $\vec{N}_{\text{level}}$ MUST be clamped to clear the highest protruding visual surface point under its footprint by at least $\delta_{\text{clear}} \ge 0.020\text{ m}$ (`2.0 cm`):
       $$d_{\text{final}} = \max\!\left(\vec{P}_{\text{hit}} \cdot \vec{N}_{\text{level}},\, \max_{k} \left(\vec{P}_{\text{envelope}}(\vec{Q}_k) \cdot \vec{N}_{\text{level}}\right)\right) + \delta_{\text{clear}}$$
     - **Orientation Invariance:** This clearance adjustment ONLY translates the sticker plane outward along $\vec{N}_{\text{level}}$; it MUST NEVER tilt or alter $\vec{N}_{\text{level}}$, $\vec{T}(\theta)$, or $\vec{U}(\theta)$. The sticker remains 100% level and parallel to the bounding wall or floor.

3. **Resizing & Rotation Re-Clamping (Idempotent Anchor Preservation):**
   - Each placed sticker record and preview hit state MUST store its base `anchorHitPoint` on the level bounding surface so that when a user enlarges or rotates a previewed or placed sticker (increasing its $[W \times H]$ footprint so a corner overlaps a nearby brick protrusion or floor crown), the footprint clearance evaluation automatically re-runs from `anchorHitPoint` without cumulative position drift and translates the sticker outward along $\vec{N}_{\text{level}}$ so the newly covered relief never clips through the sticker.

4. **Depth-Bias & Render-Order Guard:**
   - Placed and previewed sticker meshes MUST render at `renderOrder >= 12` (above `VISUAL_ALLEY_MESH` at `0`, `PlanarFloorReflectionMesh` at `2`, and `NeonBaseSegments` at `4–5`) with `polygonOffset: true` (`polygonOffsetFactor: -4`, `polygonOffsetUnits: -4`) and `depthWrite: false` to eliminate grazing-angle z-fighting against walls and floors.

---

## 4. Operational & Performance Budgets

| Subsystem Operation | Mandatory Latency / Scale Budget | Failure Isolation & Telemetry Requirement |
| :--- | :--- | :--- |
| **One-Time Visual Mesh Envelope Extraction** | $\le 8.0\text{ ms}$ one-time cost over `120,153` vertices of `VISUAL_ALLEY_MESH` | Executed once upon scene attachment; zero per-frame re-scans. |
| **Per-Pointer-Move Raycast + 9-Point Footprint Clearance** | $\le 0.25\text{ ms}$ per `pointermove` event at `60 FPS` (`16.67 ms` frame budget) | Strictly $O(1)$ grid lookup + low-poly collider raycast; zero per-frame raycasts against the 120k-vertex visual mesh. |
| **Sticker Surface Normal Level Alignment** | $\vec{N}_{\text{sticker}} \cdot \vec{N}_{\text{level}} \ge 0.999$, $\|N_y\| \le 10^{-6}$ on walls, $\|T_y\| \le 10^{-6}$ at $\theta = 0$ | Exposed on each placed sticker record (`normalDotProduct`, `position`, `normal`, `clearanceMeters`). |
| **Visual Mesh Depth Clearance ($\Delta d_{\text{clear}}$)** | $\Delta d_{\text{clear}} \ge +0.015\text{ m}$ across center + 4 corners of every placed sticker | Verified by live raycast from corridor interior toward $-\vec{N}_{\text{level}}$ hitting the sticker mesh before `VISUAL_ALLEY_MESH`. |

---

## 5. Edge Cases & Failure Modes

1. **Mid-Corridor & Street Obstacles (Characters, Entrance Gate Frame, Parked Cars, Overhead Cables, Pipes):**
   - During one-time visual envelope extraction, vertices belonging to mid-corridor props, the perpendicular entrance gate frame ($Z \in [-0.5\text{ m}, +0.5\text{ m}], X > -1.45\text{ m}$), street-level vehicles/barriers ($Z < -1.15\text{ m}$ outside the exterior building facade planes), overhead cables ($Y > 2.6\text{ m}$ near $X \approx 0$), or opposite walls MUST be excluded from each wall/floor zone's relief grid using strict spatial domain bounds:
     - Left Wall domain: $X \in [-3.60\text{ m}, -0.95\text{ m}]$ for $Z \in [0.0\text{ m}, 42.5\text{ m}]$, clamped relative to the calibrated wall baseline $X_{\text{left}}(z)$ so local relief excursions are bounded within $[X_{\text{left}}(z) - 0.15\text{ m},\, X_{\text{left}}(z) + 0.35\text{ m}]$.
     - Right Wall domain: $X \in [+1.05\text{ m}, +3.60\text{ m}]$ for $Z \in [0.0\text{ m}, 42.5\text{ m}]$, bounded within $[X_{\text{right}}(z) - 0.35\text{ m},\, X_{\text{right}}(z) + 0.15\text{ m}]$.
     - Exterior Left & Right Facade domains: $Z \in [-1.15\text{ m}, +0.20\text{ m}]$ bounded within $0.30\text{ m}$ of the calibrated facade plane $Z_{\text{ext}}(x)$.
     - Floor domain: $Y \in [-0.35\text{ m}, +0.45\text{ m}]$ across walkable corridor and exterior street widths.
2. **Large Stickers Near Wall-Floor or Wall-Corner Intersections ($S \to S_{\max}$):**
   - When a sticker is resized up to $S_{\max}$ near the floor or an exterior return corner, footprint sample points $\vec{Q}_k$ that fall outside the wall segment's bounds MUST clamp to the valid grid domain rather than reading `NaN` or `undefined` cells.
3. **Scene Cutter Plane (`Z_cut = 42.5m`):**
   - Both the calibrated bounding surfaces and the visual envelope grid MUST remain valid whether the Scene Cutter at $Z = 42.5\text{ m}$ is active or restored up to $Z = 71.2\text{ m}$.

---

## 6. Acceptance Criteria & Verification Gates (`{correct required outputs}`)

- **`AC-01` (Deterministic Level Orientation on All Walls & Floor):**
  - Every sticker placed on `COLLIDER_STICKER_WALL_L`, `COLLIDER_STICKER_WALL_R`, `COLLIDER_STICKER_EXTERIOR_L`, `COLLIDER_STICKER_EXTERIOR_R`, or `COLLIDER_STICKER_FLOOR` satisfies $\vec{N}_{\text{sticker}} \cdot \vec{N}_{\text{level}} \ge 0.999$, with wall normals strictly horizontal ($|N_y| \le 10^{-6}$), floor normals laterally level ($|N_x| \le 10^{-6}$), and baseline $\theta = 0$ horizontal tangent strictly level ($|T_y| \le 10^{-6}$).
- **`AC-02` (Zero Visual Mesh Occlusion Across Interior Left & Right Alley Walls):**
  - Across test stations $Z \in \{2\text{ m}, 6\text{ m}, 12\text{ m}, 18\text{ m}, 24\text{ m}, 28\text{ m}, 34\text{ m}, 40\text{ m}\}$ on both Left and Right Alley Walls, raycasting from the corridor centerline ($X = 0$) through the center of each placed sticker intersects the placed sticker mesh **in front of** `VISUAL_ALLEY_MESH` ($d_{\text{hit,sticker}} < d_{\text{hit,visualAlley}}$ by at least $0.015\text{ m}$).
- **`AC-03` (Zero Visual Mesh Occlusion Across Exterior Left & Right Building Walls Outside the Alley):**
  - Outside the alley entrance ($Z \le 0\text{ m}$), camera raycasts from the street ($Z = -6\text{ m}$) strike `COLLIDER_STICKER_EXTERIOR_L` and `COLLIDER_STICKER_EXTERIOR_R` directly (unblocked by `COLLIDER_STICKER_BOUND_START`), and stickers placed on both exterior walls sit in front of `VISUAL_ALLEY_MESH` ($d_{\text{hit,sticker}} < d_{\text{hit,visualAlley}}$).
- **`AC-04` (Zero Visual Mesh Occlusion Across Interior & Exterior Floor):**
  - Across floor stations $Z \in \{-6\text{ m}, -2\text{ m}, 2\text{ m}, 8\text{ m}, 16\text{ m}, 24\text{ m}, 32\text{ m}, 40\text{ m}\}$, downward raycasts from $Y = 2.5\text{ m}$ through placed floor stickers intersect the placed sticker mesh **above** both `VISUAL_ALLEY_MESH` and `PlanarFloorReflectionMesh` ($Y_{\text{sticker}} \ge \max(Y_{\text{visFloor}}, Y_{\text{reflector}}) + 0.015\text{ m}$).
- **`AC-05` (Resizing & Rotation Footprint Clearance Preservation):**
  - Resizing a placed or previewed sticker up to $S_{\max}$ or rotating it across $[ -180^\circ, +180^\circ ]$ re-evaluates its 9-point footprint against the visual surface envelope so the sticker remains unoccluded by adjacent wall/floor relief, completing in $\le 0.25\text{ ms}$ per update with zero console or page errors.
- **`AC-06` (Playwright & Visual Tooling Multi-Viewpoint Verification):**
  - Using Playwright (`browser_evaluate` + `browser_take_screenshot` with `sandbox.director.syncPOVStateFromPose(camPos, lookTarget)` and `sandbox.director.applyCameraPOVPose()`) and visual inspection across at least 4 diagnostic camera viewpoints—(1) Exterior Street POV ($Z = -6.5\text{ m}$ looking toward $+Z$), (2) Interior Entrance POV ($Z = 1.2\text{ m}$ looking toward $Z = 5.5\text{ m}$), (3) Mid-Alley Jog POV ($Z = 17.5\text{ m}$ looking toward $Z = 26.0\text{ m}$), and (4) Back-Alley POV ($Z = 25.5\text{ m}$ looking toward $Z = 38.0\text{ m}$)—verify visually and via live raycast telemetry that stickers placed on Left/Right Exterior Facades, Left/Right Interior Walls, and Exterior/Interior Floors render level, unclipped, and 100% visible in the WebGL viewport.
