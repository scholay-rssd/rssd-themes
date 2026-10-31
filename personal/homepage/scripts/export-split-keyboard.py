"""Export the editable D01 split keyboard for the portfolio's interactive viewer.

Run with Blender (the source blend is opened read-only and never saved):
  Blender --background --factory-startup --python scripts/export-split-keyboard.py -- \
    --source /path/to/D01_R8_color.blend

Only exterior geometry is retained. Each animated key keeps its own named parent,
while static geometry is batched by module and original Principled material.
The poster uses the same split layout as the GLB. cwebp is required for encoding.
Draco compression is enabled when bundled with Blender; --no-draco disables it.
"""

import argparse
import collections
import hashlib
import json
import math
import pathlib
import re
import shutil
import subprocess
import sys
import tempfile

import bpy
from mathutils import Vector


ROOT = pathlib.Path(__file__).resolve().parents[1]
COLLECTIONS = (
    "01_LEFT", "02_RIGHT", "03_TRACKBALL_MODULE", "04_EINK_MODULE",
    "05_SWITCH_MODULE", "10_NUMPAD",
)
OFFSETS = {
    "01_LEFT": (-0.015, 0, 0),
    "02_RIGHT": (0.025, 0, 0),
    "03_TRACKBALL_MODULE": (-0.029, 0.006, 0),
    "04_EINK_MODULE": (-0.029, 0, 0),
    "05_SWITCH_MODULE": (-0.029, -0.006, 0),
    "10_NUMPAD": (0.050, 0, 0),
}
TRAVEL = 0.0025


def keyboard_codes(label, side):
    """KeyboardEvent.code mappings; firmware-specific Fn keys stay clickable."""
    if side == "numpad":
        if label.isdigit():
            return ["Numpad" + label]
        return {"+": ["NumpadAdd"], "-": ["NumpadSubtract"],
                ".": ["NumpadDecimal"], "Enter": ["NumpadEnter"]}.get(label, [])
    if len(label) == 1 and label.isalpha():
        return ["Key" + label.upper()]
    if len(label) == 1 and label.isdigit():
        return ["Digit" + label]
    if label in ("Shift", "Ctrl", "Alt", "GUI"):
        prefix = {"Shift": "Shift", "Ctrl": "Control", "Alt": "Alt", "GUI": "Meta"}[label]
        return [prefix + ("Left" if side == "left" else "Right")]
    if label == "Space":
        # A physical Space press has one code; the two halves remain individually clickable.
        return ["Space"] if side == "left" else []
    return {
        "Esc": ["Escape"], "Tab": ["Tab"], "Caps": ["CapsLock"],
        "Bksp": ["Backspace"], "Delete": ["Delete"], "Enter": ["Enter"],
        "Home": ["Home"], "End": ["End"], "PgUp": ["PageUp"], "PgDn": ["PageDown"],
        "Up": ["ArrowUp"], "Down": ["ArrowDown"], "Left": ["ArrowLeft"], "Right": ["ArrowRight"],
        "-": ["Minus"], "=": ["Equal"], "[": ["BracketLeft"], "]": ["BracketRight"],
        "\\": ["Backslash"], ";": ["Semicolon"], "'": ["Quote"], ",": ["Comma"],
        ".": ["Period"], "/": ["Slash"],
    }.get(label, [])


def exterior(obj):
    name = obj.name
    if obj.type not in {"MESH", "FONT", "CURVE"} or obj.hide_render:
        return False
    if name.startswith(("KEY_", "Legend_", "Homing_")):
        return True
    if any(c.name in {"01_LEFT", "02_RIGHT", "10_NUMPAD"} for c in obj.users_collection):
        if any(part in name for part in (
            "_independent_case", "_bottom_cover", "_switch_plate", "_USB_C_",
            "_rubber_foot", "MAGNETIC_SIDE", "RF_POLYMER_REAR_WINDOW",
            "CHARGE_5V_CENTER", "CHARGE_GND_RING",
        )):
            return True
        return name.startswith((
            "NUMPAD_CUSTOM_LCD_GLASS", "NUMPAD_EMBEDDED_LCD_BEZEL", "NUMPAD_LCD_ACTIVE_AREA",
            "NUMPAD_RAISED_TOUCH_ROW_SKIRT", "NUMPAD_RIGHT_SIDE_SCROLL_WHEEL",
            "NUMPAD_WHEEL_KNURL", "NUMPAD_TOUCH_",
        ))
    # Explicit visible surfaces and side/bottom connector details of the three modules.
    return name.startswith((
        "M_TOP__COMMON_", "M_MIDDLE__", "M_BOTTOM__", "Trackball_",
        "TRACKBALL_RAISED_FUNCTION_CAP", "Eink_", "Reflective_eink_active_area",
        "Switch_",
    )) or any(part in name for part in (
        "_MAGNET", "STEEL_TARGET", "RF_POLYMER_WINDOW", "CHARGE_5V_CENTER", "CHARGE_GND_RING",
    ))


def parent_preserve_world(obj, parent):
    matrix = obj.matrix_world.copy()
    obj.parent = parent
    obj.matrix_world = matrix


def meshify(obj):
    """Bake geometry/modifiers, including font outlines, without touching the source file."""
    bpy.ops.object.select_all(action="DESELECT")
    obj.hide_set(False)
    obj.hide_viewport = False
    obj.select_set(True)
    bpy.context.view_layer.objects.active = obj
    bpy.ops.object.convert(target="MESH")
    return bpy.context.view_layer.objects.active


def separate_display_layers(objects):
    """Keep the source's visual UI layers distinct at web/depth-buffer precision.

    D01 places the display and tile surfaces only 1 micrometre apart. Its Cycles
    renders resolve that, but EEVEE/WebGL and Draco quantization can collapse the
    layers. These tiny display-only offsets preserve each original surface and
    material; they do not change the keyboard, mechanical parts, or source blend.
    """
    for obj in objects:
        if obj.name == "NUMPAD_CUSTOM_LCD_GLASS_73x18":
            obj.location.z += 0.00002
        elif obj.name == "NUMPAD_LCD_ACTIVE_AREA":
            obj.location.z += 0.00005
        elif obj.name.startswith("NUMPAD_TOUCH_CELL_"):
            obj.location.z += 0.00010
        elif obj.name.startswith(("NUMPAD_TOUCH_NUM", "NUMPAD_TOUCH_SYMBOL")):
            obj.location.z += 0.00015
    bpy.context.view_layer.update()


def empty(name, location=(0, 0, 0)):
    obj = bpy.data.objects.new(name, None)
    bpy.context.scene.collection.objects.link(obj)
    obj.location = location
    return obj


def static_batches(objects, container, collection_name):
    """Merge evaluated exterior meshes by original material to keep draw calls bounded."""
    buckets = collections.defaultdict(list)
    for obj in objects:
        # These source meshes each use one material. Fail if a future source changes that contract.
        if len(obj.data.materials) != 1:
            raise RuntimeError(f"Expected one material on {obj.name}, found {len(obj.data.materials)}")
        buckets[obj.data.materials[0].name].append(obj)
    output = []
    for material, group in sorted(buckets.items()):
        bpy.ops.object.select_all(action="DESELECT")
        for obj in group:
            obj.select_set(True)
        bpy.context.view_layer.objects.active = group[0]
        if len(group) > 1:
            bpy.ops.object.join()
        obj = bpy.context.view_layer.objects.active
        obj.name = "static_" + collection_name + "_" + material
        parent_preserve_world(obj, container)
        output.append(obj)
    return output


def material(name, color, roughness):
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    node = mat.node_tree.nodes.get("Principled BSDF")
    node.inputs["Base Color"].default_value = color
    node.inputs["Metallic"].default_value = 0.0
    node.inputs["Roughness"].default_value = roughness
    return mat


def area_light(name, location, target, energy, size, color):
    light = bpy.data.lights.new(name, "AREA")
    light.energy = energy
    light.shape = "DISK"
    light.size = size
    light.color = color
    obj = bpy.data.objects.new(name, light)
    bpy.context.scene.collection.objects.link(obj)
    obj.location = location
    obj.rotation_euler = (target - obj.location).to_track_quat("-Z", "Y").to_euler()


def render_poster(model_objects, output):
    scene = bpy.context.scene
    scene.render.engine = "BLENDER_EEVEE_NEXT"
    scene.render.resolution_x = 1400
    scene.render.resolution_y = 800
    scene.render.resolution_percentage = 100
    scene.render.image_settings.file_format = "PNG"
    scene.render.film_transparent = False
    scene.view_settings.view_transform = "AgX"
    scene.view_settings.look = "AgX - Medium High Contrast"
    scene.view_settings.exposure = 0.15
    world = bpy.data.worlds.new("Portfolio_dark_studio")
    world.use_nodes = True
    world.node_tree.nodes["Background"].inputs["Color"].default_value = (0.045, 0.052, 0.064, 1)
    world.node_tree.nodes["Background"].inputs["Strength"].default_value = 0.6
    scene.world = world
    vertices = [obj.matrix_world @ Vector(v) for obj in model_objects for v in obj.bound_box]
    lower = Vector([min(v[i] for v in vertices) for i in range(3)])
    upper = Vector([max(v[i] for v in vertices) for i in range(3)])
    center = (lower + upper) / 2
    center.z = 0.015
    bpy.ops.mesh.primitive_plane_add(size=200, location=(center.x, center.y, -0.0002))
    floor = bpy.context.object
    floor.name = "Poster_only_floor"
    floor.data.materials.append(material("Poster_only_matte_floor", (0.004, 0.006, 0.010, 1), 0.84))
    area_light("Poster_key", center + Vector((-0.22, -0.22, 0.4)), center, 2.8, 0.35, (0.95, 0.97, 1))
    area_light("Poster_fill", center + Vector((0.25, -0.10, 0.24)), center, 1.6, 0.28, (0.80, 0.87, 1))
    area_light("Poster_rim", center + Vector((0.0, 0.20, 0.3)), center, 3.4, 0.32, (0.88, 1.0, 0.95))
    camera_data = bpy.data.cameras.new("Poster_camera")
    camera = bpy.data.objects.new("Poster_camera", camera_data)
    scene.collection.objects.link(camera)
    camera_data.type = "ORTHO"
    camera_data.clip_start = 0.01
    camera_data.clip_end = 2.0
    camera.location = center + Vector((0.08, -0.34, 0.38))
    camera.rotation_euler = (center - camera.location).to_track_quat("-Z", "Y").to_euler()
    scene.camera = camera
    bpy.context.view_layer.update()
    inverse = camera.matrix_world.inverted()
    projected = [inverse @ v for v in vertices]
    width = max(v.x for v in projected) - min(v.x for v in projected)
    height = max(v.y for v in projected) - min(v.y for v in projected)
    camera_data.ortho_scale = max(width / 0.84, height * 1400 / 800 / 0.80)
    cwebp = shutil.which("cwebp")
    if not cwebp:
        raise RuntimeError("cwebp is required to encode the rendered poster (install libwebp).")
    with tempfile.TemporaryDirectory(prefix="split-keyboard-render-") as temp:
        png = pathlib.Path(temp) / "poster.png"
        scene.render.filepath = str(png)
        bpy.ops.render.render(write_still=True)
        subprocess.run([cwebp, "-quiet", "-q", "88", str(png), "-o", str(output)], check=True)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--source", type=pathlib.Path, required=True)
    parser.add_argument("--output-root", type=pathlib.Path, default=ROOT / "public")
    parser.add_argument("--skip-poster", action="store_true")
    parser.add_argument("--no-draco", action="store_true")
    args = parser.parse_args(sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else [])
    original_hash = hashlib.sha256(args.source.read_bytes()).hexdigest()
    bpy.ops.wm.open_mainfile(filepath=str(args.source), load_ui=False)
    scene = bpy.context.scene
    scene.frame_set(1)
    retained = [obj for obj in bpy.data.objects if exterior(obj) and any(c.name in COLLECTIONS for c in obj.users_collection)]
    retained_names = {obj.name for obj in retained}
    for obj in list(bpy.data.objects):
        if obj.name not in retained_names:
            bpy.data.objects.remove(obj, do_unlink=True)
    for collection in bpy.data.collections:
        collection.hide_render = False
        collection.hide_viewport = False
    separate_display_layers(retained)
    root = empty("split_keyboard")
    manifest = {"keyTravel": TRAVEL, "keys": []}
    model_objects = []
    key_index = 0
    for collection_name in COLLECTIONS:
        objects = list(bpy.data.collections[collection_name].objects)
        container = empty("module_" + collection_name)
        container.parent = root
        key_members = set()
        caps = sorted((obj for obj in objects if obj.name.startswith("KEY_")), key=lambda obj: obj.name)
        for cap in caps:
            match = re.match(r"KEY_(left|right|numpad)_(\d+)_(.*)", cap.name)
            if not match:
                raise RuntimeError("Unexpected key name " + cap.name)
            side, index, label = match.groups()
            key = empty(f"key_{key_index:02d}", cap.location)
            parent_preserve_world(key, container)
            members = [cap]
            legend = bpy.data.objects.get(f"Legend_{side}_{index}")
            if not legend:
                raise RuntimeError("Missing matching legend for " + cap.name)
            members.append(legend)
            if label in {"F", "J"}:
                members.append(bpy.data.objects["Homing_" + label])
            for obj in members:
                key_members.add(obj.name)
                mesh = meshify(obj)
                parent_preserve_world(mesh, key)
                model_objects.append(mesh)
            manifest["keys"].append({"node": key.name, "label": label, "codes": keyboard_codes(label, side)})
            key_index += 1
        static = [meshify(obj) for obj in objects if obj.name not in key_members]
        model_objects.extend(static_batches(static, container, collection_name))
        container.location = OFFSETS[collection_name]
    bpy.context.view_layer.update()
    if key_index != 85:
        raise RuntimeError(f"Expected 85 keys from D01, found {key_index}")
    models = args.output_root / "models"
    visuals = args.output_root / "visuals"
    models.mkdir(parents=True, exist_ok=True)
    visuals.mkdir(parents=True, exist_ok=True)
    path = models / "split-keyboard.glb"
    from io_scene_gltf2.io.com.draco import dll_exists
    draco = not args.no_draco and dll_exists()
    bpy.ops.export_scene.gltf(
        filepath=str(path), export_format="GLB", export_yup=True,
        export_animations=False, export_cameras=False, export_lights=False,
        export_extras=False, export_apply=False, export_materials="EXPORT",
        export_draco_mesh_compression_enable=draco,
        export_draco_mesh_compression_level=6,
        export_draco_position_quantization=14,
        export_draco_normal_quantization=10,
    )
    (models / "split-keyboard.keys.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n")
    if not args.skip_poster:
        render_poster(model_objects, visuals / "split-keyboard-poster.webp")
    if hashlib.sha256(args.source.read_bytes()).hexdigest() != original_hash:
        raise RuntimeError("The source file changed during export.")
    print(json.dumps({"sourceUnchanged": True, "sourceSHA256": original_hash, "keys": key_index, "meshObjects": len(model_objects),
                      "glbBytes": path.stat().st_size, "dracoCompression": draco,
                      "front": "+Z", "up": "+Y", "keyTravel": TRAVEL}))


if __name__ == "__main__":
    main()
