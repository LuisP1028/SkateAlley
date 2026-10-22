"""
Builds the industrial wall-mounted 'Alarm Light' 3D model (modeled after Sketchfab
933ac2e9d1924e2a973f8692a07972af by BurnGameVen) with dark amber emissive glass dome
and internal beacon core, exporting to:
  - /Users/diesel/desktop/SkateAlley/alarm_light.glb
  - /Users/diesel/Desktop/Doom_Rig/alarm_light.glb

Coordinate Convention (glTF Y-up after export):
  - Origin (0, 0, 0) is at the center of the backplate's wall-contact face.
  - Local +Z (Blender -Y) points OUTWARD from the wall into the alleyway corridor.
  - Local +Y (Blender +Z) points UP.
"""

import json
import math
import os
import struct
import bpy
import bmesh


GREEK_ALARM_GLB = "/Users/diesel/desktop/SkateAlley/alarm_light.glb"
DOOM_ALARM_GLB = "/Users/diesel/Desktop/Doom_Rig/alarm_light.glb"


def create_metal_material() -> bpy.types.Material:
    mat = bpy.data.materials.new(name="AlarmLight_WeatheredMetal_Mat")
    mat.use_nodes = True
    bsdf = next((n for n in mat.node_tree.nodes if n.type == 'BSDF_PRINCIPLED'), None)
    if bsdf:
        bsdf.inputs["Base Color"].default_value = (0.34, 0.36, 0.39, 1.0)
        bsdf.inputs["Metallic"].default_value = 0.86
        bsdf.inputs["Roughness"].default_value = 0.42
    return mat


def create_dark_amber_dome_material() -> bpy.types.Material:
    mat = bpy.data.materials.new(name="AlarmLight_DarkAmberGlass_Mat")
    mat.use_nodes = True
    mat.blend_method = 'BLEND'
    bsdf = next((n for n in mat.node_tree.nodes if n.type == 'BSDF_PRINCIPLED'), None)
    if bsdf:
        # Deep burnt dark amber (#b45309 / #92400e)
        bsdf.inputs["Base Color"].default_value = (0.44, 0.14, 0.01, 1.0)
        bsdf.inputs["Metallic"].default_value = 0.05
        bsdf.inputs["Roughness"].default_value = 0.14
        if "Alpha" in bsdf.inputs:
            bsdf.inputs["Alpha"].default_value = 0.78
        if "Emission Color" in bsdf.inputs:
            bsdf.inputs["Emission Color"].default_value = (0.72, 0.28, 0.02, 1.0)
        if "Emission Strength" in bsdf.inputs:
            bsdf.inputs["Emission Strength"].default_value = 2.4
    return mat


def create_dark_amber_bulb_material() -> bpy.types.Material:
    mat = bpy.data.materials.new(name="AlarmLight_DarkAmberCore_Mat")
    mat.use_nodes = True
    bsdf = next((n for n in mat.node_tree.nodes if n.type == 'BSDF_PRINCIPLED'), None)
    if bsdf:
        # Glowing dark-amber core (#d97706 / #f59e0b)
        bsdf.inputs["Base Color"].default_value = (0.85, 0.38, 0.02, 1.0)
        bsdf.inputs["Metallic"].default_value = 0.10
        bsdf.inputs["Roughness"].default_value = 0.18
        if "Emission Color" in bsdf.inputs:
            bsdf.inputs["Emission Color"].default_value = (0.92, 0.42, 0.03, 1.0)
        if "Emission Strength" in bsdf.inputs:
            bsdf.inputs["Emission Strength"].default_value = 4.2
    return mat


def add_transformed_bmesh(target_bm: bmesh.types.BMesh, src_mesh: bpy.types.Mesh) -> None:
    target_bm.from_mesh(src_mesh)


def build_alarm_light_scene() -> None:
    bpy.ops.wm.read_factory_settings(use_empty=True)

    metal_mat = create_metal_material()
    glass_mat = create_dark_amber_dome_material()
    bulb_mat = create_dark_amber_bulb_material()

    root_empty = bpy.data.objects.new("AlarmLight_Root", None)
    bpy.context.scene.collection.objects.link(root_empty)

    # Note: In Blender Z-up, -Y exports to +Z in glTF Y-up!
    # So we build extending along -Y (outward from wall) and hanging along -Z (downward).
    # Lamp center is at Y = -0.17m (outward from wall), Z = -0.02m (top cap rim).
    lamp_y = -0.17

    # -------------------------------------------------------------------------
    # 1. Weathered Metal Housing + Backplate + Arm + Cap + Cage (AlarmLight_MetalHousing)
    # -------------------------------------------------------------------------
    metal_objs = []

    # 1a. Rectangular Wall Mounting Backplate (width=0.14m, height=0.16m, thickness=0.014m)
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0.0, -0.007, 0.02))
    plate = bpy.context.active_object
    plate.scale = (0.070, 0.007, 0.080)
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    metal_objs.append(plate)

    # 4 corner hexagonal mounting bolts on the backplate (front cap only; back face is inside plate)
    for bx in (-0.052, 0.052):
        for bz in (-0.042, 0.082):
            bpy.ops.mesh.primitive_cylinder_add(
                vertices=6,
                radius=0.008,
                depth=0.012,
                end_fill_type='NGON',
                location=(bx, -0.016, bz),
                rotation=(math.pi / 2.0, 0.0, 0.0),
            )
            bolt = bpy.context.active_object
            bpy.ops.object.transform_apply(location=False, rotation=True, scale=True)
            bm_bolt = bmesh.new()
            bm_bolt.from_mesh(bolt.data)
            for f in list(bm_bolt.faces):
                if f.normal.y > 0.5:
                    bm_bolt.faces.remove(f)
            bm_bolt.to_mesh(bolt.data)
            bm_bolt.free()
            metal_objs.append(bolt)

    # 1b. Horizontal Cylindrical Extension Arm / Neck from backplate to lamp cap (ends embedded)
    bpy.ops.mesh.primitive_cylinder_add(
        vertices=8,
        radius=0.036,
        depth=0.13,
        end_fill_type='NOTHING',
        location=(0.0, -0.070, 0.02),
        rotation=(math.pi / 2.0, 0.0, 0.0),
    )
    metal_objs.append(bpy.context.active_object)

    # 1c. Stepped Conical / Domed Top Metal Cap overhanging the glass cylinder
    # Lower rim collar (top face hidden under conical hood)
    bpy.ops.mesh.primitive_cylinder_add(
        vertices=12,
        radius=0.105,
        depth=0.036,
        end_fill_type='NGON',
        location=(0.0, lamp_y, 0.018),
    )
    collar = bpy.context.active_object
    bm_col = bmesh.new()
    bm_col.from_mesh(collar.data)
    for f in list(bm_col.faces):
        if f.normal.z > 0.5:
            bm_col.faces.remove(f)
    bm_col.to_mesh(collar.data)
    bm_col.free()
    metal_objs.append(collar)

    # Conical upper hood (open ends joined with collar & crown)
    bpy.ops.mesh.primitive_cone_add(
        vertices=12,
        radius1=0.105,
        radius2=0.052,
        depth=0.034,
        end_fill_type='NOTHING',
        location=(0.0, lamp_y, 0.053),
    )
    metal_objs.append(bpy.context.active_object)

    # Top crown cap disc (bottom face hidden on conical hood)
    bpy.ops.mesh.primitive_cylinder_add(
        vertices=12,
        radius=0.052,
        depth=0.010,
        end_fill_type='NGON',
        location=(0.0, lamp_y, 0.072),
    )
    crown = bpy.context.active_object
    bm_crn = bmesh.new()
    bm_crn.from_mesh(crown.data)
    for f in list(bm_crn.faces):
        if f.normal.z < -0.5:
            bm_crn.faces.remove(f)
    bm_crn.to_mesh(crown.data)
    bm_crn.free()
    metal_objs.append(crown)

    # 1d. Protective Wire/Bar Cage Guard (Mid-height ring + Bottom ring + 4 vertical curved bars)
    # Mid-height horizontal band ring (around Z = -0.105m)
    bpy.ops.mesh.primitive_torus_add(
        major_radius=0.096,
        minor_radius=0.009,
        major_segments=12,
        minor_segments=4,
        location=(0.0, lamp_y, -0.105),
    )
    metal_objs.append(bpy.context.active_object)

    # Bottom cage ring (around Z = -0.235m)
    bpy.ops.mesh.primitive_torus_add(
        major_radius=0.042,
        minor_radius=0.008,
        major_segments=10,
        minor_segments=4,
        location=(0.0, lamp_y, -0.235),
    )
    metal_objs.append(bpy.context.active_object)

    # 4 vertical cage bars at 45°, 135°, 225°, 315° curving inward at bottom
    for angle_deg in (45.0, 135.0, 225.0, 315.0):
        rad = math.radians(angle_deg)
        ca = math.cos(rad)
        sa = math.sin(rad)
        r_bar = 0.094
        bx = r_bar * ca
        by = lamp_y + r_bar * sa

        # Upper vertical bar segment (Z = 0.00 to Z = -0.165)
        bpy.ops.mesh.primitive_cylinder_add(
            vertices=5,
            radius=0.0075,
            depth=0.165,
            end_fill_type='NOTHING',
            location=(bx, by, -0.0825),
        )
        metal_objs.append(bpy.context.active_object)

        # Lower angled/curved bar segment meeting bottom ring (Z = -0.165 to Z = -0.235)
        mid_r = 0.5 * (r_bar + 0.042)
        seg_len = math.hypot(r_bar - 0.042, 0.070)
        tilt = math.atan2(r_bar - 0.042, 0.070)
        bpy.ops.mesh.primitive_cylinder_add(
            vertices=5,
            radius=0.0075,
            depth=seg_len + 0.012,
            end_fill_type='NOTHING',
            location=(mid_r * ca, lamp_y + mid_r * sa, -0.200),
        )
        bar_low = bpy.context.active_object
        # Orient bar inward toward (0, lamp_y, -0.235)
        bar_low.rotation_euler = (tilt * sa, -tilt * ca, 0.0)
        metal_objs.append(bar_low)

    # Internal metallic socket collar hanging inside top of dome
    bpy.ops.mesh.primitive_cylinder_add(
        vertices=8,
        radius=0.024,
        depth=0.045,
        end_fill_type='NGON',
        location=(0.0, lamp_y, -0.022),
    )
    sock = bpy.context.active_object
    bm_sck = bmesh.new()
    bm_sck.from_mesh(sock.data)
    for f in list(bm_sck.faces):
        if f.normal.z > 0.5:
            bm_sck.faces.remove(f)
    bm_sck.to_mesh(sock.data)
    bm_sck.free()
    metal_objs.append(sock)

    # Join all metal parts into a single clean mesh
    bpy.ops.object.select_all(action='DESELECT')
    for o in metal_objs:
        o.select_set(True)
    bpy.context.view_layer.objects.active = metal_objs[0]
    bpy.ops.object.join()
    housing_obj = bpy.context.active_object
    housing_obj.name = "AlarmLight_MetalHousing"
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
    for p in housing_obj.data.polygons:
        p.use_smooth = True
    housing_obj.data.materials.clear()
    housing_obj.data.materials.append(metal_mat)
    housing_obj.parent = root_empty

    # -------------------------------------------------------------------------
    # 2. Internal Emissive Dark Amber Beacon Core (AlarmLight_BulbCore)
    # -------------------------------------------------------------------------
    bulb_objs = []
    # Central circular beacon drum (matching the round reflector visible inside the Sketchfab model)
    bpy.ops.mesh.primitive_cylinder_add(
        vertices=8,
        radius=0.046,
        depth=0.036,
        end_fill_type='NGON',
        location=(0.0, lamp_y, -0.105),
        rotation=(math.pi / 2.0, 0.0, 0.0),
    )
    bulb_objs.append(bpy.context.active_object)

    bpy.ops.mesh.primitive_uv_sphere_add(
        segments=8,
        ring_count=4,
        radius=0.038,
        location=(0.0, lamp_y, -0.105),
    )
    bulb_objs.append(bpy.context.active_object)

    bpy.ops.object.select_all(action='DESELECT')
    for o in bulb_objs:
        o.select_set(True)
    bpy.context.view_layer.objects.active = bulb_objs[0]
    bpy.ops.object.join()
    bulb_obj = bpy.context.active_object
    bulb_obj.name = "AlarmLight_BulbCore"
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
    for p in bulb_obj.data.polygons:
        p.use_smooth = True
    bulb_obj.data.materials.clear()
    bulb_obj.data.materials.append(bulb_mat)
    bulb_obj.parent = root_empty

    # -------------------------------------------------------------------------
    # 3. Dark Amber Translucent Glass Dome Enclosure (AlarmLight_GlassDome)
    #    Single clean cylindrical-hemispherical shell without internal overlap
    # -------------------------------------------------------------------------
    dome_mesh = bpy.data.meshes.new("AlarmLight_GlassDome_Mesh")
    bm_dome = bmesh.new()
    radial_segs = 12
    dome_radius = 0.080
    z_top = 0.00
    z_cyl_bot = -0.155
    hemi_lats_deg = (30.0, 60.0)

    ring_profiles = [
        (dome_radius, z_top),
        (dome_radius, z_cyl_bot),
    ]
    for lat_deg in hemi_lats_deg:
        lat_rad = math.radians(lat_deg)
        ring_profiles.append(
            (dome_radius * math.cos(lat_rad), z_cyl_bot - dome_radius * math.sin(lat_rad))
        )

    rings_verts = []
    for r_ring, z_ring in ring_profiles:
        ring = []
        for s_idx in range(radial_segs):
            theta = (2.0 * math.pi * s_idx) / radial_segs
            vx = r_ring * math.cos(theta)
            vy = lamp_y + r_ring * math.sin(theta)
            ring.append(bm_dome.verts.new((vx, vy, z_ring)))
        rings_verts.append(ring)

    bottom_pole = bm_dome.verts.new((0.0, lamp_y, z_cyl_bot - dome_radius))

    # Cap top ring so the single-shell glass dome is 100% watertight
    bm_dome.faces.new(tuple(rings_verts[0]))

    # Connect consecutive rings with outward-facing quads
    for r_idx in range(len(rings_verts) - 1):
        upper_ring = rings_verts[r_idx]
        lower_ring = rings_verts[r_idx + 1]
        for s_idx in range(radial_segs):
            s_next = (s_idx + 1) % radial_segs
            bm_dome.faces.new(
                (upper_ring[s_idx], lower_ring[s_idx], lower_ring[s_next], upper_ring[s_next])
            )

    # Connect lowest ring to bottom hemispherical pole with outward-facing triangles
    last_ring = rings_verts[-1]
    for s_idx in range(radial_segs):
        s_next = (s_idx + 1) % radial_segs
        bm_dome.faces.new((last_ring[s_idx], bottom_pole, last_ring[s_next]))

    bmesh.ops.recalc_face_normals(bm_dome, faces=bm_dome.faces)
    for f in bm_dome.faces:
        f.smooth = True
    bm_dome.to_mesh(dome_mesh)
    bm_dome.free()

    dome_obj = bpy.data.objects.new("AlarmLight_GlassDome", dome_mesh)
    bpy.context.scene.collection.objects.link(dome_obj)
    for p in dome_obj.data.polygons:
        p.use_smooth = True
    dome_obj.data.materials.clear()
    dome_obj.data.materials.append(glass_mat)
    dome_obj.parent = root_empty

    # -------------------------------------------------------------------------
    # 4. Compact Physical Footprint Scaling (0.72x around wall-mount backplate origin)
    # -------------------------------------------------------------------------
    model_scale = 0.72
    bpy.ops.object.select_all(action='DESELECT')
    for obj in (housing_obj, bulb_obj, dome_obj):
        obj.select_set(True)
        obj.scale = (model_scale, model_scale, model_scale)
    bpy.context.view_layer.objects.active = housing_obj
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)

    # -------------------------------------------------------------------------
    # 5. Embedded Electrical Flicker Animation Action (AlarmLight_Flicker)
    # -------------------------------------------------------------------------
    bpy.context.scene.frame_start = 0
    bpy.context.scene.frame_end = 60
    bpy.context.scene.render.fps = 24

    bulb_obj.animation_data_create()
    flicker_action = bpy.data.actions.new(name="AlarmLight_Flicker")
    bulb_obj.animation_data.action = flicker_action

    # Keyframe subtle core flicker sputter pulses while keeping frame 0 at exact 1.0 rest scale
    flicker_keyframes = [
        (0, 1.00),
        (6, 0.96),
        (9, 0.42),
        (11, 1.04),
        (14, 0.35),
        (17, 0.98),
        (26, 1.00),
        (30, 0.28),
        (32, 0.92),
        (35, 0.45),
        (38, 1.02),
        (48, 0.95),
        (51, 0.38),
        (54, 1.00),
        (60, 1.00),
    ]
    for frame_idx, sc in flicker_keyframes:
        bpy.context.scene.frame_set(frame_idx)
        bulb_obj.scale = (sc, sc, sc)
        bulb_obj.keyframe_insert(data_path="scale", frame=frame_idx)

    bpy.context.scene.frame_set(0)
    bulb_obj.scale = (1.0, 1.0, 1.0)

    # Export GLB
    os.makedirs(os.path.dirname(GREEK_ALARM_GLB), exist_ok=True)
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.export_scene.gltf(
        filepath=GREEK_ALARM_GLB,
        export_format='GLB',
        use_selection=True,
        export_apply=False,
        export_yup=True,
        export_normals=True,
        export_animations=True,
        export_materials='EXPORT',
    )

    if os.path.exists(os.path.dirname(DOOM_ALARM_GLB)):
        with open(GREEK_ALARM_GLB, "rb") as src_f, open(DOOM_ALARM_GLB, "wb") as dst_f:
            dst_f.write(src_f.read())

    print(f"Exported compact flickering Alarm Light GLB (scale={model_scale}) to {GREEK_ALARM_GLB}")


if __name__ == "__main__":
    build_alarm_light_scene()

