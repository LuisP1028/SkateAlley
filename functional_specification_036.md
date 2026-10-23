# Functional Specification 036: Interactive Straight-Line Scene Cutter & Half-Space Geometry Deletion System

## 1. System Purpose & Core Objective

This specification defines the desired `{functionality}`, mathematical cutting-plane formulation, interactive state machine, visual preview and confirmation workflow, mesh and prop deletion rules, operational and performance budgets, edge-case failure boundaries, and verifiable `{correct required outputs}` for an **Interactive Straight-Line Scene Cutter & Half-Space Deletion System** within the Freeman Alley 3D runtime environment.

The primary objective is to enable the user to:
1. Enter an interactive **Scene Cut Mode** and draw a **straight cut line** directly across the viewport (from a start point $P_1$ to an end point $P_2$), designating the exact planar boundary where the 3D scene is to be sliced.
2. Visually preview in real time which side of the drawn line (half-space) will be **deleted** versus **retained**, with the ability to **Flip Cut Side**, adjust the line endpoints, or toggle between a **Camera View-Plane Cut** (slicing straight through the screen line along the camera sightlines) and a **Vertical Plumb-Wall Cut** (projecting the line onto the alley floor/corridor and slicing vertically through all walls, floor, pipes, cables, and props).
3. Execute the **Cut / Delete** operation to cleanly remove the designated chunk of the scene—including slicing/filtering the `VISUAL_ALLEY_MESH` (`50,638` vertices, `42,314` triangles), updating physical `COLLIDERS`, and pruning all props, lights, pipes, cables, neon borders, and holographic stations located inside the deleted half-space—while providing instant **Undo / Restore** and exact **Cut Plane Telemetry Readout** so the cut coordinates are permanently inspectable and reproducible.

**DO NOT CODE YET.** This document specifies functional requirements, mathematical models, state transitions, operational budgets, and observable outcomes only. It contains zero implementation code, concrete syntax, or mechanical diffs.

---

## 2. Authoritative Domain Vocabulary Alignment (`LANGUAGE.md`)

All evaluations of system state, operational constraints, and verification gates within this specification strictly adhere to the authoritative taxonomy established in [`LANGUAGE.md`](file:///Users/diesel/desktop/skatealley/LANGUAGE.md):

- **`{functionality}`**: End-to-end interactive ability to draw a straight 2D viewport line that projects into a 3D cutting plane $\Pi$, preview the affected half-space at 60 FPS, flip or refine the cut direction, and execute a clean structural cut that deletes the designated chunk of the 3D environment mesh, colliders, and scene subsystems while preserving interactive runtime stability on the retained scene.
- **`{correctness}`**:
  - The drawn 2D screen segment $\overline{P_1 P_2}$ maps deterministically to a 3D cutting plane $\Pi = (\vec{n}_{\Pi}, d_{\Pi})$ with unit normal $\|\vec{n}_{\Pi}\| = 1$ and signed distance $s(X) = \vec{n}_{\Pi} \cdot X + d_{\Pi}$ for every world-space point $X \in \mathbb{R}^3$.
  - Every triangle in `VISUAL_ALLEY_MESH` and collider meshes lying in the deleted half-space ($s(X) > 0$) is removed or clipped along $\Pi$ without corrupting vertex attribute buffers (`position`, `normal`, `uv`), leaving NaN coordinates, or detaching materials.
  - Every discrete scene subsystem (hologram columns, wall screen mounts, math pods, metal pipe assemblies, overhead cables, alarm lights, floor-border neon segments, street/point lights, and overhead signage) whose world position lies inside the deleted half-space is cleanly culled and deactivated from per-frame update loops.
  - Flipping the cut side negates $(\vec{n}_{\Pi}, d_{\Pi}) \mapsto (-\vec{n}_{\Pi}, -d_{\Pi})$ deterministically, swapping the retained and deleted half-spaces.
- **`{correct required outputs}`**:
  1. An accessible **Scene Cutter Control Panel & Viewport Overlay** allowing the user to toggle **Cut Mode**, draw a crisp straight line $\overline{P_1 P_2}$ with start/end handles and normal-direction indicator arrow showing the **"DELETE SIDE"**, toggle **Flip Side**, choose **View-Plane** vs. **Vertical Plumb Cut**, and click **Execute Cut** or **Undo / Reset Scene**.
  2. Live 60 FPS visual preview before and during cut confirmation (via GPU clipping plane and/or red half-space overlay tint) showing the exact slice across the alley geometry before destructive triangle removal occurs.
  3. Post-cut scene state where 100% of geometry and props in the deleted half-space are removed from the rendered scene, corridor bounds/colliders reflect the truncated geometry, and exact cut telemetry (plane normal $\vec{n}_{\Pi}$, constant $d_{\Pi}$, world intercept coordinates, deleted triangle count, and culled prop list) is exposed on `window.__SANDBOX__.sceneCutter` and displayed in the HUD so the user or assistant can inspect the exact cut specification.
- **`{errors}`**:
  - Zero-length or degenerate cut lines ($\|P_2 - P_1\| < 8\text{ px}$) producing NaN plane normals ($\|\vec{n}_{\Pi}\| = 0$) and crashing the renderer.
  - Performing CPU-bound per-triangle buffer re-allocation on every `pointermove` event during line dragging, causing frame drops below 60 FPS.
  - Leaving orphaned invisible colliders, active point lights, audio emitters, or interactive raycast targets floating in the deleted empty space after a cut is executed.
  - Camera orbit or character movement triggering concurrently while the user is clicking-and-dragging to draw the cut line.
- **`{sufficient}`**: Complete mathematical specification of the 2D-to-3D cutting plane projection, half-space classification rules across static meshes and dynamic subsystems, interaction state machine, HUD controls, undo/persistence contract, and empirical performance budgets.
- **`{insufficient}`**: Any specification that fails to define how a 2D line determines which 3D side is deleted, omits prop/subsystem cleanup in the deleted zone, or allows camera drag to conflict with line drawing.

---

## 3. Empirical Scene Geometry & Runtime Baseline

Inspection of the live Freeman Alley runtime (`freeman_alley.glb` and active scene graph in `sandbox.js`) establishes the physical scale and geometry volume that the Scene Cutter operates upon:

| Scene Layer / Subsystem | Scene Graph Identifier | Geometry / Instance Volume | World Spatial Bounds ($X, Y, Z$ in meters) | Cut Behavior Requirement |
| :--- | :--- | :--- | :--- | :--- |
| **Primary Photogrammetry Mesh** | `VISUAL_ALLEY_MESH` | `50,638` vertices, `42,314` triangles | $X \in [-11.65, +10.78]$, $Y \in [-0.47, +10.47]$, $Z \in [-20.29, +73.19]$ | Slice/cull triangles in deleted half-space $s(X) > 0$; clip or discard boundary triangles cleanly. |
| **Floor & Wall Colliders** | `COLLIDER_FLOOR`, `COLLIDER_WALL_L`, `COLLIDER_WALL_R`, `COLLIDER_BOUND_*` | `66` vertices, `35` triangles total | $X \in [-9.40, +10.20]$, $Y \in [0.00, 3.00]$, $Z \in [-10.50, +71.20]$ | Slice/clamp collider bounds to prevent walking into deleted void; reposition end-cap boundary collider along the cut line if corridor is truncated. |
| **Overhead Hanging Cables** | `OverheadHangingCablesGroup` | `20` catenary spans (merged mesh + metadata) | $Z \in [1.10, 56.40]$, $Y \in [2.88, 8.15]$ | Slice/cull geometry and cable records whose span midpoint or anchors lie in $s(X) > 0$. |
| **Industrial Metal Pipework** | `AlleyMetalPipesGroup` | `15` assemblies (`ALLEY_PIPE_01`..`15`) | $Z \in [2.20, 42.80]$, $Y \in [0.05, 4.40]$ | Cull pipe assemblies and slice batched pipe geometry in $s(X) > 0$. |
| **Wall Screen Mounts & Holo Columns** | `WallScreenMountsGroup`, `HologramMediaColumnsRootGroup` | `6` wall mounts + `6` holo columns | $Z \in [5.80, 31.50]$ | Hide/cull mounts and columns in $s(X) > 0$ and exclude them from raycast/proximity focus. |
| **Interactive Math Pods** | `MathPodsRootGroup` | `7` pods (`POD-01`..`07`) | $Z \in [6.50, 35.00]$ | Hide/cull pods in $s(X) > 0$ and disable hover/click popups for culled pods. |
| **Alarm Lights & Street Lights** | `AlleyAlarmLightsGroup`, `AlleyNightStreetLights` | `14` alarm fixtures + `2` street lights | $Z \in [-4.04, 59.50]$ | Hide fixtures and disable light emission (`intensity = 0` / `visible = false`) for lights in $s(X) > 0$. |
| **Floor-Border Neon System** | `NeonWallCornersGroup` | `11` corridor border segments | $Z \in [0.00, 46.00]$ | Slice/cull neon tube segments lying in $s(X) > 0$. |
| **Overhead Villainy Neon Sign** | `VillainyIncOverheadSignGroup` | `1` PBR neon sign assembly (`346,446` tris) | Center $(0.12, 2.82, 5.15)$ | Retain or cull based on assembly centroid/mesh evaluation against $s(X) > 0$. |

---

## 4. Mathematical Formulation: From 2D Drawn Line to 3D Cutting Plane

When the user draws a straight line on the viewport from screen pixel $P_1 = (x_1, y_1)$ to $P_2 = (x_2, y_2)$ across a viewport of dimensions $(W_{\text{vp}}, H_{\text{vp}})$:

### 4.1 Normalized Device Coordinates (NDC) & Unprojection
1. Convert $P_1$ and $P_2$ to Normalized Device Coordinates $\text{NDC}_i = (u_i, v_i) \in [-1, +1]^2$:
   $$u_i = \frac{2 x_i}{W_{\text{vp}}} - 1, \quad v_i = 1 - \frac{2 y_i}{H_{\text{vp}}}, \quad i \in \{1, 2\}$$
2. Reject degenerate lines where the screen-space Euclidean length $\|P_2 - P_1\|_2 < 8.0\text{ px}$ prior to plane construction.
3. Unproject $\text{NDC}_1$ and $\text{NDC}_2$ through the active camera's inverse view-projection matrix (`camera.projectionMatrixInverse` and `camera.matrixWorld`) onto the far frustum plane to obtain unit world-space ray directions $\hat{r}_1, \hat{r}_2$ originating from the camera world position $C_{\text{cam}} \in \mathbb{R}^3$.

### 4.2 Cutting Plane Modes
The system must support two selectable geometric interpretations of the drawn line:

1. **Mode A — View-Projected Cutting Plane (`VIEW_PLANE`, Default):**
   - The 3D cutting plane $\Pi$ is the exact plane passing through the camera eye $C_{\text{cam}}$ and both unprojected rays $\hat{r}_1$ and $\hat{r}_2$.
   - Visually, from the camera's viewpoint, this plane projects to the exact razor-sharp 2D line $\overline{P_1 P_2}$ drawn by the user, slicing straight through every 3D surface behind that screen line:
     $$\vec{n}_0 = \hat{r}_1 \times \hat{r}_2, \quad \vec{n}_{\Pi} = \sigma \frac{\vec{n}_0}{\|\vec{n}_0\|_2}, \quad d_{\Pi} = -\vec{n}_{\Pi} \cdot C_{\text{cam}}$$
     where $\sigma \in \{+1, -1\}$ is the user-controlled **Cut Side Polarity** (`+1` defaults to the right-hand / upper-right normal of the directed vector $\overrightarrow{P_1 P_2}$; `-1` when **Flip Cut Side** is toggled).

2. **Mode B — Vertical Plumb-Wall Cutting Plane (`VERTICAL_PLUMB_PLANE`):**
   - Raycast (or intersect with the horizontal alley floor plane $Y = Y_{\text{floor}}$ or `VISUAL_ALLEY_MESH`) from $(C_{\text{cam}}, \hat{r}_1)$ and $(C_{\text{cam}}, \hat{r}_2)$ to obtain two 3D world anchor points $W_1 = (X_1, Y_1, Z_1)$ and $W_2 = (X_2, Y_2, Z_2)$.
   - Construct a strictly vertical cutting wall perpendicular to the world $XZ$ ground plane ($\vec{n}_{\Pi} \cdot \hat{y} = 0$) passing through $(X_1, Z_1)$ and $(X_2, Z_2)$:
     $$\vec{\tau}_{XZ} = (X_2 - X_1, \, 0, \, Z_2 - Z_1), \quad \vec{n}_{\Pi} = \sigma \frac{\vec{\tau}_{XZ} \times \hat{y}}{\|\vec{\tau}_{XZ} \times \hat{y}\|_2}, \quad d_{\Pi} = -\vec{n}_{\Pi} \cdot W_1$$
   - This guarantees that even when looking down the alley at an angled perspective pitch, the resulting cut slices the brick walls, floor, ceiling cables, and pipes along a plumb vertical architectural cross-section without diagonal pitch tilt.

### 4.3 Half-Space Classification Rule
For any world-space point $X \in \mathbb{R}^3$, its signed distance to the cutting plane $\Pi = (\vec{n}_{\Pi}, d_{\Pi})$ is:
$$s(X) = \vec{n}_{\Pi} \cdot X + d_{\Pi}$$
- **Deleted Half-Space ($\mathcal{H}_{\text{delete}}$):** $s(X) > 0$ (all geometry and props on the side pointed to by $\vec{n}_{\Pi}$).
- **Retained Half-Space ($\mathcal{H}_{\text{keep}}$):** $s(X) \le 0$ (all geometry and props on the opposite side).

---

## 5. Interactive Workflow, User Interface & State Machine

### 5.1 State Machine
The Scene Cutter operates across four deterministic states:
1. **`INACTIVE` (Normal Gameplay / Exploration):**
   - Pointer events pass normally to camera orbit, mount focus, and math pod interactions. Any previously applied cuts remain active in the scene.
2. **`ARMED_READY_TO_DRAW` (Cut Mode Active, Waiting for Stroke):**
   - Camera drag-orbit and prop click handlers are suspended on the 3D canvas; cursor changes to a precision crosshair (`crosshair`).
   - A banner/status badge indicates: **"DRAW CUT LINE: Click and drag a straight line across the scene to designate the cut."**
3. **`DRAWING_LINE` (Pointer Down $\rightarrow$ Dragging):**
   - On `pointerdown` at $P_1$, the start endpoint is anchored.
   - As the pointer moves to $P_2$, a high-contrast 2D SVG/Canvas overlay renders:
     - The straight cut line $\overline{P_1 P_2}$ (glowing cyan/crimson laser line with draggable endpoint handles at $P_1$ and $P_2$).
     - A perpendicular **Deletion Direction Arrow** at the midpoint of $\overline{P_1 P_2}$ pointing into the deleted half-space, labeled **`DELETE THIS SIDE`**, accompanied by a translucent crimson shaded half-plane tint over the deleted side of the line.
     - Live GPU clipping preview (or instant toggleable preview) slicing the 3D scene along $\Pi$ at 60 FPS.
4. **`LINE_DEFINED_PENDING_CONFIRM` (Pointer Up — Adjustable Preview):**
   - The user can:
     - Drag either endpoint handle ($P_1$ or $P_2$) to fine-tune the exact angle and position of the straight cut line.
     - Click **`Flip Cut Side`** (or press `X` / `Tab`) to invert $\sigma \mapsto -\sigma$, immediately switching which side of the line is marked for deletion.
     - Toggle **`Preview Live Clip`** to see the scene with the deleted half-space clipped away before committing.
     - Click **`Execute Cut (Delete Chunk)`** (or press `Enter`) to commit the structural geometry and prop deletion.
     - Click **`Cancel Line`** (or press `Escape`) to clear the drawn line without modifying the scene.

### 5.2 Multi-Cut Support & Non-Destructive Undo / Reset
- **Sequential Cuts:** After executing a cut, the user may draw additional straight lines to make further cuts (e.g., trimming both the back courtyard and a side protrusion).
- **Undo Last Cut & Reset All Cuts:** The system must preserve original pre-cut geometry buffers and prop visibility states in memory so clicking **`Undo Cut`** or **`Restore Full Scene`** instantaneously restores the uncut scene in $< 16\text{ ms}$ without reloading `.glb` files over the network.
- **Cut Telemetry Readout:** Once a cut line is drawn or executed, the HUD panel and `window.__SANDBOX__.sceneCutter.getTelemetry()` must report:
  - Screen endpoints $P_1, P_2$ (in pixels and NDC).
  - World-space 3D ray/floor intersection coordinates $W_1, W_2$ and corridor depth $Z_{\text{cut}}$ (where the cut plane intersects the alley centerline $X = 0, Y = Y_{\text{floor}}$).
  - Plane normal $\vec{n}_{\Pi} = (n_x, n_y, n_z)$ and plane constant $d_{\Pi}$.
  - Count of deleted vs. retained triangles in `VISUAL_ALLEY_MESH` and list of culled prop IDs.

---

## 6. Operational & Performance Budgets

| Metric / Operation | Mandatory Target Budget | Physical & Architectural Rationale |
| :--- | :--- | :--- |
| **Interactive Line Drag & Preview Frame Rate** | **$\ge 60\text{ FPS}$ ($\le 16.67\text{ ms/frame}$)** | Dragging $P_2$ updates only the 2D overlay vector and a single `THREE.Plane` uniform ($\mathcal{O}(1)$ per frame); zero CPU mesh buffer rebuilding is permitted during `pointermove`. |
| **One-Shot Geometry Cut Execution Latency** | **$\le 35.0\text{ ms}$** on `42,314` triangles | Single linear pass over indexed position/normal/UV buffers of `VISUAL_ALLEY_MESH` + batched props upon clicking **Execute Cut**. |
| **Undo / Restore Full Scene Latency** | **$\le 5.0\text{ ms}$** | Swaps cached original index/attribute `BufferGeometry` references and restores prop `.visible` flags without network I/O or re-parsing GLBs. |
| **Memory Overhead of Cached Pre-Cut Buffers** | **$\le 4.5\text{ MB}$** | Caching the original index buffer (`42,314 × 3 × 4` bytes $\approx 508\text{ KB}$) or vertex attributes of `VISUAL_ALLEY_MESH` requires $< 3.5\text{ MB}$ RAM. |
| **Runtime Console & WebGL Error Budget** | **$0$ Errors** | Zero WebGL shader compilation errors, zero `NaN` bounding sphere warnings, and zero unhandled exceptions. |

---

## 7. Edge Cases & Failure Isolation Boundaries

1. **Degenerate / Short Click Without Drag ($\|P_2 - P_1\|_2 < 8\text{ px}$):**
   - Must not construct a `NaN` plane normal or execute a cut. Instead, support **Two-Click Line Drawing** (clicking point $P_1$ then clicking point $P_2$) as well as **Click-and-Drag Line Drawing**, so both trackpad tap-tap users and mouse click-drag users can draw a straight line effortlessly.
2. **Line Drawn Strictly in Sky / Above Horizon (No Floor Intersection in `VERTICAL_PLUMB_PLANE` Mode):**
   - If an unprojected ray does not intersect the finite floor collider mesh, intersect against the infinite mathematical plane $Y = Y_{\text{floor}}$, and if the ray is parallel or upward ($\hat{r} \cdot \hat{y} \ge -10^{-4}$), automatically fall back to `VIEW_PLANE` projection with a clear telemetry indicator rather than failing or throwing an error.
3. **Boundary-Straddling Triangles along the Cut Line:**
   - Triangles with vertices on both sides of $\Pi$ must either be cleanly clipped along the plane intersection segment (interpolating `position`, `normal`, and `uv` for watertight razor-straight cut edges) or filtered deterministically without leaving jagged missing-polygon holes on the retained side.
4. **Active Player / Camera Inside Deleted Half-Space:**
   - If the user deletes the section of the alley where the player character is currently standing, player character meshes (`hoodie`, `tunic`) must **never** be deleted; if the floor beneath the player is removed, the player must be safely clamped/teleported to the nearest retained corridor floor point on the kept side of the cut plane.
5. **Interaction Conflict Isolation:**
   - While Cut Mode is active (`ARMED_READY_TO_DRAW`, `DRAWING_LINE`, or dragging endpoint handles in `LINE_DEFINED_PENDING_CONFIRM`), orbit camera dragging, wall-mount click focusing, and math-pod click focusing must be strictly suppressed so drawing a line never spins the camera or opens a popup.
