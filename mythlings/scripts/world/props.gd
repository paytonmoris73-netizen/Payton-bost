class_name Props
## Procedural prop library. Each function returns one merged ArrayMesh
## (vertex-coloured; alpha = wind sway weight) so props are cheap to draw.
## These are stand-ins for authored environment art (see ASSET_MANIFEST.md).

const K := preload("res://scripts/core/mesh_kit.gd")

static var _cache: Dictionary = {}
static var _materials: Dictionary = {}

static func material(kind := "solid") -> Material:
	if _materials.has(kind):
		return _materials[kind]
	var m: Material
	match kind:
		"foliage":
			var sm := ShaderMaterial.new()
			sm.shader = load("res://shaders/foliage.gdshader")
			sm.set_shader_parameter("weight_from_alpha", true)
			sm.set_shader_parameter("use_instance_color", false)
			sm.set_shader_parameter("wind_strength", 0.18)
			sm.set_shader_parameter("wind_speed", 1.1)
			m = sm
		"foliage_mm":
			var sm := ShaderMaterial.new()
			sm.shader = load("res://shaders/foliage.gdshader")
			sm.set_shader_parameter("weight_from_alpha", false)
			sm.set_shader_parameter("height_ref", 0.5)
			sm.set_shader_parameter("use_instance_color", true)
			sm.set_shader_parameter("wind_strength", 0.18)
			sm.set_shader_parameter("wind_speed", 1.1)
			m = sm
		_:
			m = K.vcol(0.9)
	_materials[kind] = m
	return m

static func cached(key: String, builder: Callable) -> ArrayMesh:
	if not _cache.has(key):
		_cache[key] = builder.call()
	return _cache[key]

static func node(mesh: Mesh, kind := "solid", pos := Vector3.ZERO, rot_y := 0.0, scl := 1.0) -> MeshInstance3D:
	var mi := MeshInstance3D.new()
	mi.mesh = mesh
	mi.material_override = material(kind)
	mi.position = pos
	mi.rotation.y = rot_y
	mi.scale = Vector3.ONE * scl
	return mi

# ------------------------------------------------------------------ vegetation
static func broadleaf_tree(variant := 0) -> ArrayMesh:
	return cached("tree%d" % variant, func():
		var m := MeshMerger.new()
		var rng := RandomNumberGenerator.new()
		rng.seed = 100 + variant
		var trunk := Color("6b4a32")
		var greens := [Color("4f8a3a"), Color("5f9c42"), Color("3f7533"), Color("71a84a")]
		if variant == 2:
			greens = [Color("8fae3c"), Color("a8b845"), Color("7a9a36"), Color("c2b24a")]
		if variant == 3:
			greens = [Color("b8452a"), Color("d0602e"), Color("9a3524"), Color("e0843a")]
			trunk = Color("3a2a22")
		if variant == 4:
			greens = [Color("d88a2e"), Color("e8a63a"), Color("b86a26"), Color("c8502a")]
			trunk = Color("3a2a22")
		var h := 3.2 + (variant % 3) * 0.6
		m.add(K.tube(K.bezier(Vector3.ZERO, Vector3(0.2, h * 0.5, 0), Vector3(-0.1, h, 0.1), 5), K.taper(5, 0.38, 0.18), 8), Transform3D.IDENTITY, trunk)
		for k in 3:
			var a := k * TAU / 3.0 + 0.5
			m.add(K.tube(K.bezier(Vector3(0, h * 0.7, 0), Vector3(cos(a) * 0.8, h * 0.85, sin(a) * 0.8), Vector3(cos(a) * 1.4, h * 1.05, sin(a) * 1.4), 4), K.taper(4, 0.15, 0.06), 6), Transform3D.IDENTITY, trunk)
		for k in 9:
			var p := Vector3(rng.randf_range(-1.6, 1.6), h + rng.randf_range(0.0, 1.8), rng.randf_range(-1.6, 1.6))
			var r := rng.randf_range(1.1, 1.7)
			m.put(K.sphere(1.0, 10, 6), p, greens[k % greens.size()], Vector3(0, rng.randf() * 90, 0), Vector3(r, r * 0.85, r), 0.35)
		return m.commit())

static func giant_tree(variant := 0) -> ArrayMesh:
	return cached("giant%d" % variant, func():
		var m := MeshMerger.new()
		var rng := RandomNumberGenerator.new()
		rng.seed = 300 + variant
		var bark := Color("5a4030")
		var h := 11.0 + variant * 2.0
		m.add(K.tube(K.bezier(Vector3.ZERO, Vector3(0.4, h * 0.5, 0.2), Vector3(0, h, 0), 7), K.taper(7, 1.25, 0.5, 0.1), 10), Transform3D.IDENTITY, bark)
		for k in 5:
			var a := k * TAU / 5.0 + rng.randf()
			m.add(K.tube(K.bezier(Vector3(cos(a) * 0.6, 1.4, sin(a) * 0.6), Vector3(cos(a) * 1.6, 0.6, sin(a) * 1.6), Vector3(cos(a) * 2.4, -0.3, sin(a) * 2.4), 5), K.taper(5, 0.45, 0.12), 7), Transform3D.IDENTITY, bark.darkened(0.1))
		for k in 4:
			var a := k * TAU / 4.0 + rng.randf()
			var base := Vector3(0, h * (0.62 + k * 0.08), 0)
			var tip := base + Vector3(cos(a) * 3.8, 1.8, sin(a) * 3.8)
			m.add(K.tube(K.bezier(base, base.lerp(tip, 0.5) + Vector3(0, 0.6, 0), tip, 4), K.taper(4, 0.4, 0.12), 6), Transform3D.IDENTITY, bark)
			for q in 3:
				var r := rng.randf_range(1.8, 2.6)
				m.put(K.sphere(1.0, 10, 6), tip + Vector3(rng.randf_range(-1.2, 1.2), rng.randf_range(-0.3, 1.0), rng.randf_range(-1.2, 1.2)), [Color("2f5e2c"), Color("3d6e30"), Color("4a7d38")][q], Vector3.ZERO, Vector3(r, r * 0.75, r), 0.2)
		for q in 5:
			var r := rng.randf_range(2.4, 3.2)
			m.put(K.sphere(1.0, 12, 7), Vector3(rng.randf_range(-1.5, 1.5), h + rng.randf_range(0.5, 2.2), rng.randf_range(-1.5, 1.5)), [Color("2f5e2c"), Color("3d6e30"), Color("467a35")][q % 3], Vector3.ZERO, Vector3(r, r * 0.7, r), 0.2)
		# Moss on trunk.
		for q in 4:
			m.put(K.sphere(0.5, 8, 4), Vector3(cos(q * 1.6) * 1.0, 1.0 + q * 1.4, sin(q * 1.6) * 1.0), Color("6a9a40"), Vector3.ZERO, Vector3(1, 0.5, 1))
		return m.commit())

static func pine_tree() -> ArrayMesh:
	return cached("pine", func():
		var m := MeshMerger.new()
		m.put(K.cyl(0.12, 0.3, 3.0, 7), Vector3(0, 1.5, 0), Color("5a3e2a"))
		for k in 4:
			var r := 2.0 - k * 0.4
			m.put(K.cyl(0.05, r, 2.0, 9), Vector3(0, 2.2 + k * 1.2, 0), [Color("2e5a3a"), Color("366842"), Color("2e5a3a"), Color("3d7048")][k], Vector3(0, k * 20, 0), Vector3.ONE, 0.15 + k * 0.1)
		return m.commit())

static func bush(variant := 0) -> ArrayMesh:
	return cached("bush%d" % variant, func():
		var m := MeshMerger.new()
		var rng := RandomNumberGenerator.new()
		rng.seed = 500 + variant
		for k in 5:
			var r := rng.randf_range(0.45, 0.75)
			m.put(K.sphere(1.0, 9, 5), Vector3(rng.randf_range(-0.6, 0.6), r * 0.7, rng.randf_range(-0.6, 0.6)), [Color("4f8a3a"), Color("5f9c42"), Color("6aa648")][k % 3], Vector3.ZERO, Vector3(r, r * 0.8, r), 0.5)
		if variant == 1:
			for k in 9:
				m.put(K.sphere(0.07, 6, 3), Vector3(rng.randf_range(-0.7, 0.7), rng.randf_range(0.5, 1.0), rng.randf_range(-0.7, 0.7)), Color("f2b33d"), Vector3.ZERO, Vector3.ONE, 0.5)
		if variant == 2:
			for k in 9:
				m.put(K.sphere(0.08, 6, 3), Vector3(rng.randf_range(-0.7, 0.7), rng.randf_range(0.5, 1.0), rng.randf_range(-0.7, 0.7)), [Color("f2a7c3"), Color("ffffff"), Color("c49af0")][k % 3], Vector3.ZERO, Vector3.ONE, 0.5)
		return m.commit())

static func grass_tuft() -> ArrayMesh:
	return cached("grass", func():
		var st := SurfaceTool.new()
		st.begin(Mesh.PRIMITIVE_TRIANGLES)
		for k in 5:
			var a := k * TAU / 5.0 + 0.3
			var dir := Vector3(cos(a), 0, sin(a))
			var side := Vector3(-dir.z, 0, dir.x) * 0.045
			var base := dir * 0.06
			var tip := dir * 0.22 + Vector3(0, 0.42 + (k % 2) * 0.12, 0)
			var nrm := Vector3(0, 1, 0)
			for v in [[base - side, Color("3f7a2e")], [base + side, Color("3f7a2e")], [tip, Color("9ccc5e")]]:
				st.set_normal(nrm)
				st.set_color(v[1])
				st.add_vertex(v[0])
		return st.commit())

static func flower() -> ArrayMesh:
	return cached("flower", func():
		var m := MeshMerger.new()
		m.put(K.cyl(0.008, 0.012, 0.32, 4), Vector3(0, 0.16, 0), Color("4f8a3a"), Vector3.ZERO, Vector3.ONE, 0.5)
		for k in 5:
			m.put(K.sphere(0.04, 6, 3), Vector3(cos(k * TAU / 5) * 0.045, 0.33, sin(k * TAU / 5) * 0.045), Color.WHITE, Vector3.ZERO, Vector3(1, 0.4, 1), 1.0)
		m.put(K.sphere(0.025, 6, 3), Vector3(0, 0.345, 0), Color("f5d04a"), Vector3.ZERO, Vector3.ONE, 1.0)
		return m.commit())

static func rock(variant := 0) -> ArrayMesh:
	return cached("rock%d" % variant, func():
		var m := MeshMerger.new()
		var rng := RandomNumberGenerator.new()
		rng.seed = 700 + variant
		var cols := [Color("8a8a84"), Color("9a978e"), Color("7a7a74")]
		for k in 1 + variant % 3:
			var r := rng.randf_range(0.6, 1.1)
			m.put(K.sphere(1.0, 7, 4), Vector3(k * 0.7, r * 0.45, rng.randf() * 0.4), cols[k % 3], Vector3(rng.randf() * 30, rng.randf() * 180, rng.randf() * 30), Vector3(r, r * 0.65, r * 0.9))
		m.put(K.sphere(0.35, 7, 4), Vector3(0.2, 0.75, 0.1), Color("6a9a40"), Vector3.ZERO, Vector3(1, 0.35, 1))
		return m.commit())

static func log_pile() -> ArrayMesh:
	return cached("logs", func():
		var m := MeshMerger.new()
		for k in 3:
			m.put(K.cyl(0.18, 0.18, 1.6, 8), Vector3(0, 0.18 + (0.3 if k == 2 else 0.0), -0.2 + k * 0.38 - (0.19 if k == 2 else 0.0)), Color("7a5236"), Vector3(0, 0, 90))
			m.put(K.cyl(0.14, 0.14, 0.02, 8), Vector3(0.81, 0.18 + (0.3 if k == 2 else 0.0), -0.2 + k * 0.38 - (0.19 if k == 2 else 0.0)), Color("d8b57e"), Vector3(0, 0, 90))
		return m.commit())

static func stone_pile() -> ArrayMesh:
	return cached("stones", func():
		var m := MeshMerger.new()
		var rng := RandomNumberGenerator.new()
		rng.seed = 77
		for k in 6:
			var r := rng.randf_range(0.18, 0.32)
			m.put(K.sphere(1.0, 6, 4), Vector3(rng.randf_range(-0.5, 0.5), r * 0.6 + (0.25 if k > 3 else 0.0), rng.randf_range(-0.4, 0.4)), [Color("a3a6a8"), Color("8e9396"), Color("b4b1a8")][k % 3], Vector3(0, k * 50, 0), Vector3(r, r * 0.7, r))
		return m.commit())

static func crystal_cluster() -> ArrayMesh:
	return cached("crystal", func():
		var m := MeshMerger.new()
		for k in 5:
			var a := k * TAU / 5.0
			m.put(K.cyl(0.0, 0.14, 0.8 - k * 0.08, 6), Vector3(cos(a) * 0.18, 0.35, sin(a) * 0.18), Color("8fd8f5"), Vector3(cos(a) * 18, 0, sin(a) * 18))
		m.put(K.cyl(0.0, 0.18, 1.1, 6), Vector3(0, 0.5, 0), Color("b5ecff"))
		return m.commit())

# ------------------------------------------------------------------ village
static func house(variant := 0) -> ArrayMesh:
	return cached("house%d" % variant, func():
		var m := MeshMerger.new()
		var wall: Color = [Color("f2e6cf"), Color("efd9b8"), Color("e8e0d0")][variant % 3]
		var roof: Color = [Color("b4553c"), Color("6f8a4a"), Color("4f6f8f")][variant % 3]
		if variant >= 10:  # Emberfall: basalt walls, ember-red and slate roofs
			wall = [Color("6a5a50"), Color("7a6656"), Color("5a4c44")][variant % 3]
			roof = [Color("8a2a1a"), Color("3a3533"), Color("a5482a")][variant % 3]
		var timber := Color("6b4a32")
		var w := 5.0 + (variant % 10) * 0.6
		var d := 4.2
		m.put(K.box(Vector3(w + 0.3, 0.5, d + 0.3)), Vector3(0, 0.25, 0), Color("9a958a"))
		m.put(K.box(Vector3(w, 3.0, d)), Vector3(0, 2.0, 0), wall)
		for x in [-w / 2, 0.0, w / 2]:
			m.put(K.box(Vector3(0.18, 3.0, 0.18)), Vector3(x, 2.0, -d / 2 - 0.02), timber)
			m.put(K.box(Vector3(0.18, 3.0, 0.18)), Vector3(x, 2.0, d / 2 + 0.02), timber)
		m.put(K.box(Vector3(w + 0.1, 0.18, 0.2)), Vector3(0, 3.45, -d / 2), timber)
		m.put(K.box(Vector3(w + 0.1, 0.18, 0.2)), Vector3(0, 1.75, -d / 2 - 0.02), timber)
		m.put(K.prism(Vector3(d + 1.2, 2.2, w + 0.8)), Vector3(0, 4.6, 0), roof, Vector3(0, 90, 0))
		m.put(K.prism(Vector3(d - 0.1, 2.0, w - 0.3)), Vector3(0, 4.5, 0), wall, Vector3(0, 90, 0))
		# Shingle rows on both roof slopes, ridge cap and window shutters.
		var slope := atan2(2.2, (d + 1.2) * 0.5)
		var run := (d + 1.2) * 0.5
		for side in [-1, 1]:
			for k in 6:
				var t := (k + 0.5) / 6.0
				var shade: Color = roof.darkened(0.12) if k % 2 == 0 else roof.lightened(0.06)
				m.put(K.box(Vector3(w + 0.95, 0.07, run / cos(slope) / 6.0 * 1.12)), Vector3(0, 3.5 + 2.2 * t + 0.05, side * run * (1.0 - t)), shade, Vector3(rad_to_deg(slope) * side, 0, 0))
		m.put(K.cyl(0.14, 0.14, w + 1.0, 6), Vector3(0, 5.72, 0), roof.darkened(0.25), Vector3(0, 0, 90))
		for sx in [-1, 1]:
			m.put(K.box(Vector3(0.32, 0.95, 0.06)), Vector3(w * 0.22 + 0.68 * sx, 2.2, -d / 2 - 0.1), roof.darkened(0.1))
		m.put(K.box(Vector3(0.7, 0.12, 0.7)), Vector3(w * 0.28, 6.25, 0.6), Color("6a6058"))
		m.put(K.box(Vector3(1.4, 0.12, 0.5)), Vector3(-w * 0.2, 2.5, -d / 2 - 0.3), timber)
		m.put(K.box(Vector3(0.6, 1.6, 0.6)), Vector3(w * 0.28, 5.4, 0.6), Color("8a7e72"))
		m.put(K.box(Vector3(1.1, 1.9, 0.12)), Vector3(-w * 0.2, 1.45, -d / 2 - 0.05), Color("7a4e2e"))
		m.put(K.sphere(0.06, 6, 3), Vector3(-w * 0.2 + 0.35, 1.45, -d / 2 - 0.13), Color("e8c66a"))
		for x in [w * 0.22]:
			m.put(K.box(Vector3(1.0, 0.9, 0.1)), Vector3(x, 2.2, -d / 2 - 0.06), Color("ffd98a"))
			m.put(K.box(Vector3(1.15, 0.1, 0.16)), Vector3(x, 2.68, -d / 2 - 0.08), timber)
			m.put(K.box(Vector3(0.08, 0.9, 0.14)), Vector3(x, 2.2, -d / 2 - 0.08), timber)
			m.put(K.box(Vector3(1.1, 0.25, 0.3)), Vector3(x, 1.65, -d / 2 - 0.2), Color("7a4e2e"))
			for k in 5:
				m.put(K.sphere(0.1, 6, 3), Vector3(x - 0.4 + k * 0.2, 1.85, -d / 2 - 0.22), [Color("e8576b"), Color("f2c94c"), Color("ffffff"), Color("c49af0")][k % 4], Vector3.ZERO, Vector3.ONE, 0.6)
		return m.commit())

static func windmill_base() -> ArrayMesh:
	return cached("windmill", func():
		var m := MeshMerger.new()
		m.put(K.cyl(1.6, 2.4, 8.0, 10), Vector3(0, 4.0, 0), Color("ece2cc"))
		m.put(K.cyl(2.5, 2.5, 0.5, 10), Vector3(0, 0.25, 0), Color("9a958a"))
		m.put(K.cyl(0.0, 2.1, 2.4, 10), Vector3(0, 9.2, 0), Color("8a4a36"))
		m.put(K.box(Vector3(1.2, 2.0, 0.2)), Vector3(0, 1.0, -2.25), Color("7a4e2e"), Vector3(-6, 0, 0))
		for y in [3.5, 6.0]:
			m.put(K.box(Vector3(0.7, 0.8, 0.15)), Vector3(0, y, -1.95 + (y - 3.5) * 0.12), Color("ffd98a"), Vector3(-6, 0, 0))
		m.put(K.cyl(0.25, 0.25, 1.4, 8), Vector3(0, 8.0, -1.9), Color("6b4a32"), Vector3(90, 0, 0))
		return m.commit())

static func windmill_blades() -> ArrayMesh:
	return cached("blades", func():
		var m := MeshMerger.new()
		for k in 4:
			var a := k * 90.0
			var dir := Vector3(cos(deg_to_rad(a)), sin(deg_to_rad(a)), 0)
			m.put(K.box(Vector3(0.2, 5.5, 0.12)), dir * 2.9, Color("6b4a32"), Vector3(0, 0, a - 90))
			m.put(K.box(Vector3(1.1, 4.2, 0.05)), dir * 3.3 + Vector3(0, 0, 0.05) + Vector3(-dir.y, dir.x, 0) * 0.6, Color("f4efe2"), Vector3(0, 0, a - 90))
		m.put(K.sphere(0.45, 10, 5), Vector3.ZERO, Color("6b4a32"))
		return m.commit())

static func well() -> ArrayMesh:
	return cached("well", func():
		var m := MeshMerger.new()
		m.put(K.cyl(1.0, 1.1, 1.0, 14), Vector3(0, 0.5, 0), Color("a3a09a"))
		m.put(K.cyl(0.8, 0.8, 0.05, 14), Vector3(0, 0.95, 0), Color("3d6e8a"))
		for sx in [-1, 1]:
			m.put(K.box(Vector3(0.15, 2.2, 0.15)), Vector3(0.95 * sx, 1.6, 0), Color("6b4a32"))
		m.put(K.prism(Vector3(2.6, 0.9, 1.6)), Vector3(0, 3.0, 0), Color("b4553c"))
		m.put(K.cyl(0.08, 0.08, 1.9, 6), Vector3(0, 2.3, 0), Color("6b4a32"), Vector3(0, 0, 90))
		return m.commit())

static func fence(length := 4.0) -> ArrayMesh:
	return cached("fence%.1f" % length, func():
		var m := MeshMerger.new()
		var posts := int(length / 1.3) + 1
		for k in posts:
			m.put(K.box(Vector3(0.14, 1.0, 0.14)), Vector3(-length / 2 + k * length / (posts - 1), 0.5, 0), Color("8a6a48"))
		for y in [0.45, 0.8]:
			m.put(K.box(Vector3(length, 0.1, 0.06)), Vector3(0, y, 0), Color("9a7a55"))
		return m.commit())

static func lamp_post() -> ArrayMesh:
	return cached("lamp", func():
		var m := MeshMerger.new()
		m.put(K.cyl(0.07, 0.1, 2.6, 6), Vector3(0, 1.3, 0), Color("3c3a38"))
		m.put(K.box(Vector3(0.4, 0.08, 0.4)), Vector3(0, 2.62, 0), Color("3c3a38"))
		m.put(K.cyl(0.0, 0.32, 0.3, 4), Vector3(0, 3.15, 0), Color("3c3a38"), Vector3(0, 45, 0))
		return m.commit())

static func market_stall(variant := 0) -> ArrayMesh:
	return cached("stall%d" % variant, func():
		var m := MeshMerger.new()
		var cloth: Color = [Color("c4583f"), Color("2f7d86"), Color("e8b64c")][variant % 3]
		for p in [Vector3(-1.2, 1.2, -0.8), Vector3(1.2, 1.2, -0.8), Vector3(-1.2, 1.2, 0.8), Vector3(1.2, 1.2, 0.8)]:
			m.put(K.box(Vector3(0.12, 2.4, 0.12)), p, Color("6b4a32"))
		m.put(K.box(Vector3(2.6, 0.9, 1.4)), Vector3(0, 0.45, 0), Color("8a6a48"))
		for k in 5:
			m.put(K.box(Vector3(0.55, 0.06, 1.9)), Vector3(-1.1 + k * 0.55, 2.45 + (0.06 if k % 2 else 0.0), 0), cloth if k % 2 == 0 else Color("f4efe2"), Vector3(14, 0, 0))
		for k in 6:
			m.put(K.sphere(0.13, 6, 3), Vector3(-0.9 + k * 0.35, 1.0, -0.2 + (k % 2) * 0.3), [Color("f2b33d"), Color("e8576b"), Color("7fbf6a")][k % 3])
		return m.commit())

static func bridge(restored: bool) -> ArrayMesh:
	return cached("bridge%s" % restored, func():
		var m := MeshMerger.new()
		var stone := Color("a39d90")
		var dark := Color("8a857a")
		var span := 16.0
		var segs := 14
		for k in segs + 1:
			var t := float(k) / segs
			var x := -span / 2 + t * span
			var y := sin(t * PI) * 1.6
			var broken := not restored and k >= 6 and k <= 9
			if broken:
				continue
			m.put(K.box(Vector3(span / segs + 0.05, 0.45, 3.2)), Vector3(x, y + 1.0, 0), stone if k % 2 else dark, Vector3(0, 0, -cos(t * PI) * 12.0))
			for sz in [-1, 1]:
				m.put(K.box(Vector3(span / segs + 0.05, 0.55, 0.3)), Vector3(x, y + 1.45, 1.5 * sz), dark, Vector3(0, 0, -cos(t * PI) * 12.0))
		for sx in [-1, 1]:
			m.put(K.box(Vector3(1.6, 3.0, 3.6)), Vector3(5.6 * sx, -0.2, 0), dark)
		if not restored:
			for k in 4:
				m.put(K.box(Vector3(0.9, 0.4, 1.0)), Vector3(-1.5 + k * 1.0, -0.9, -0.8 + k * 0.5), stone, Vector3(k * 20, k * 35, k * 15))
		return m.commit())

# ------------------------------------------------------------------ sanctuary
static func ancient_oak() -> ArrayMesh:
	return cached("oak", func():
		var m := MeshMerger.new()
		var rng := RandomNumberGenerator.new()
		rng.seed = 2024
		var bark := Color("5d4636")
		m.add(K.tube(K.bezier(Vector3(0, -0.5, 0), Vector3(0.6, 5.0, 0.3), Vector3(0, 9.0, 0), 8), K.taper(8, 2.6, 1.2, 0.2), 14), Transform3D.IDENTITY, bark)
		for k in 7:
			var a := k * TAU / 7.0 + 0.2
			m.add(K.tube(K.bezier(Vector3(cos(a) * 1.6, 2.2, sin(a) * 1.6), Vector3(cos(a) * 3.4, 0.8, sin(a) * 3.4), Vector3(cos(a) * 5.0, -0.4, sin(a) * 5.0), 6), K.taper(6, 0.9, 0.2), 8), Transform3D.IDENTITY, bark.darkened(0.12))
		for k in 6:
			var a := k * TAU / 6.0 + 0.6
			var base := Vector3(0, 7.5 + (k % 2) * 1.2, 0)
			var tip := base + Vector3(cos(a) * 7.5, 3.0 + rng.randf() * 1.5, sin(a) * 7.5)
			m.add(K.tube(K.bezier(base, base.lerp(tip, 0.5) + Vector3(0, 1.2, 0), tip, 6), K.taper(6, 0.95, 0.3), 9), Transform3D.IDENTITY, bark)
			for q in 4:
				var r := rng.randf_range(2.6, 3.6)
				m.put(K.sphere(1.0, 12, 7), tip + Vector3(rng.randf_range(-2.0, 2.0), rng.randf_range(-0.5, 1.6), rng.randf_range(-2.0, 2.0)), [Color("3f7a33"), Color("4d8a3a"), Color("5c9a42"), Color("6aa648")][q], Vector3.ZERO, Vector3(r, r * 0.7, r), 0.15)
		for q in 6:
			var r := rng.randf_range(3.2, 4.2)
			m.put(K.sphere(1.0, 12, 7), Vector3(rng.randf_range(-3, 3), 13.0 + rng.randf_range(0, 2.5), rng.randf_range(-3, 3)), [Color("3f7a33"), Color("4d8a3a"), Color("5c9a42")][q % 3], Vector3.ZERO, Vector3(r, r * 0.7, r), 0.15)
		for q in 8:
			m.put(K.sphere(0.6, 8, 4), Vector3(cos(q * 0.8) * 2.2, 0.6 + q * 0.9, sin(q * 0.8) * 2.2), Color("6a9a40"), Vector3.ZERO, Vector3(1, 0.5, 1))
		return m.commit())

static func standing_stone(intact: bool, variant := 0) -> ArrayMesh:
	return cached("stone_%s_%d" % [intact, variant], func():
		var m := MeshMerger.new()
		var c := Color("9a978e")
		if intact:
			m.put(K.box(Vector3(1.0, 3.4, 0.7)), Vector3(0, 1.6, 0), c, Vector3(0, 0, 2))
			m.put(K.box(Vector3(1.1, 0.3, 0.8)), Vector3(0, 3.35, 0), c.darkened(0.1))
			m.put(K.box(Vector3(0.12, 1.4, 0.02)), Vector3(0, 1.9, -0.36), Color("b6f5c8"))
			m.put(K.sphere(0.3, 8, 4), Vector3(0.3, 3.5, 0), Color("6a9a40"), Vector3.ZERO, Vector3(1.4, 0.4, 1))
		else:
			m.put(K.box(Vector3(1.0, 1.2, 0.7)), Vector3(0, 0.5, 0), c, Vector3(0, 0, 6))
			m.put(K.box(Vector3(1.0, 2.2, 0.7)), Vector3(1.5, 0.35, 0.4), c.darkened(0.05), Vector3(0, 30 + variant * 20, 84))
			m.put(K.sphere(0.4, 8, 4), Vector3(0.1, 1.1, 0), Color("6a9a40"), Vector3.ZERO, Vector3(1.5, 0.4, 1))
		return m.commit())

static func spring_pool() -> ArrayMesh:
	return cached("spring", func():
		var m := MeshMerger.new()
		for k in 14:
			var a := k * TAU / 14.0
			m.put(K.sphere(0.5, 7, 4), Vector3(cos(a) * 3.0, 0.15, sin(a) * 3.0), [Color("a39d90"), Color("8a857a")][k % 2], Vector3(0, k * 40, 0), Vector3(1.2, 0.6, 1))
		return m.commit())

static func shrine(restored: bool) -> ArrayMesh:
	return cached("shrine%s" % restored, func():
		var m := MeshMerger.new()
		var c := Color("8f8a7e")
		m.put(K.cyl(3.2, 3.6, 0.6, 12), Vector3(0, 0.3, 0), c.darkened(0.1))
		m.put(K.cyl(2.2, 2.6, 0.5, 12), Vector3(0, 0.85, 0), c)
		var pillars := 6
		for k in pillars:
			var a := k * TAU / pillars
			var p := Vector3(cos(a) * 2.6, 0, sin(a) * 2.6)
			if restored or k % 2 == 0:
				m.put(K.cyl(0.32, 0.38, 3.4, 8), p + Vector3(0, 2.3, 0), c)
				m.put(K.box(Vector3(0.9, 0.3, 0.9)), p + Vector3(0, 4.05, 0), c.darkened(0.08))
			else:
				m.put(K.cyl(0.32, 0.38, 1.0, 8), p + Vector3(0, 1.1, 0), c)
				m.put(K.cyl(0.32, 0.32, 1.8, 8), p + Vector3(0.9, 0.5, 0.5), c, Vector3(70, k * 30, 0))
		m.put(K.box(Vector3(1.2, 1.4, 1.2)), Vector3(0, 1.8, 0), c.lightened(0.05))
		if restored:
			m.put(K.cyl(4.0, 4.0, 0.25, 16), Vector3(0, 4.3, 0), c.darkened(0.05))
			for k in 6:
				var a := k * TAU / 6.0
				m.put(K.sphere(0.5, 8, 4), Vector3(cos(a) * 3.0, 4.5, sin(a) * 3.0), Color("6a9a40"), Vector3.ZERO, Vector3(1.5, 0.5, 1))
		for k in 5:
			m.put(K.sphere(0.5, 8, 4), Vector3(cos(k * 1.3) * 3.2, 0.6, sin(k * 1.3) * 3.2), Color("6a9a40"), Vector3.ZERO, Vector3(1.4, 0.4, 1.2))
		return m.commit())

# ------------------------------------------------------------------ decorations (store items)
static func decoration(id: String) -> ArrayMesh:
	return cached("deco_" + id, func():
		var m := MeshMerger.new()
		match id:
			"deco_stone_lantern":
				m.put(K.box(Vector3(0.7, 0.2, 0.7)), Vector3(0, 0.1, 0), Color("9a978e"))
				m.put(K.cyl(0.14, 0.18, 0.8, 6), Vector3(0, 0.6, 0), Color("a39d90"))
				m.put(K.box(Vector3(0.55, 0.45, 0.55)), Vector3(0, 1.2, 0), Color("ffe3a0"))
				m.put(K.cyl(0.0, 0.5, 0.35, 4), Vector3(0, 1.6, 0), Color("8a857a"), Vector3(0, 45, 0))
			"deco_oak_bench":
				m.put(K.box(Vector3(1.8, 0.1, 0.5)), Vector3(0, 0.5, 0), Color("9a6a42"))
				m.put(K.box(Vector3(1.8, 0.45, 0.08)), Vector3(0, 0.8, 0.22), Color("9a6a42"), Vector3(-10, 0, 0))
				for sx in [-1, 1]:
					m.put(K.box(Vector3(0.1, 0.5, 0.45)), Vector3(0.75 * sx, 0.25, 0), Color("6b4a32"))
			"deco_flower_arch":
				var pts := PackedVector3Array()
				for k in 13:
					var t := float(k) / 12.0
					pts.append(Vector3(-1.2 + t * 2.4, sin(t * PI) * 1.0 + 1.6 * (1.0 - absf(t - 0.5) * 0.0), 0))
				m.add(K.tube(pts, K.taper(12, 0.09, 0.09), 6, false), Transform3D.IDENTITY, Color("5a8a3a"))
				for sx in [-1, 1]:
					m.put(K.cyl(0.09, 0.09, 1.6, 6), Vector3(1.2 * sx, 0.8, 0), Color("5a8a3a"))
				for k in 16:
					var t := float(k) / 15.0
					m.put(K.sphere(0.12, 6, 3), Vector3(-1.2 + t * 2.4, (sin(t * PI) * 1.0 + 1.6) if t > 0.05 and t < 0.95 else 0.3 + k * 0.05, 0.05), [Color("e8576b"), Color("f2a7c3"), Color("ffffff")][k % 3], Vector3.ZERO, Vector3.ONE, 0.3)
			"deco_mythling_house":
				m.put(K.cyl(0.7, 0.8, 1.0, 10), Vector3(0, 0.5, 0), Color("efd9b8"))
				m.put(K.cyl(0.0, 1.05, 1.0, 10), Vector3(0, 1.45, 0), Color("6f9c4b"))
				m.put(K.sphere(0.3, 8, 4), Vector3(0, 0.35, -0.68), Color("4a3226"), Vector3.ZERO, Vector3(1, 1.2, 0.3))
				m.put(K.sphere(0.15, 6, 3), Vector3(0.2, 2.0, 0), Color("e8576b"))
			"deco_mossy_fountain":
				m.put(K.cyl(1.0, 1.1, 0.5, 12), Vector3(0, 0.25, 0), Color("a39d90"))
				m.put(K.cyl(0.85, 0.85, 0.05, 12), Vector3(0, 0.48, 0), Color("6ab8d8"))
				m.put(K.cyl(0.15, 0.2, 1.0, 8), Vector3(0, 0.9, 0), Color("a39d90"))
				m.put(K.cyl(0.5, 0.3, 0.2, 10), Vector3(0, 1.45, 0), Color("a39d90"))
				m.put(K.sphere(0.3, 8, 4), Vector3(0.5, 0.5, 0.3), Color("6a9a40"), Vector3.ZERO, Vector3(1.3, 0.4, 1))
			"deco_star_lamp":
				m.put(K.cyl(0.05, 0.08, 1.8, 6), Vector3(0, 0.9, 0), Color("2b2f6b"))
				m.put(K.sphere(0.22, 10, 5), Vector3(0, 2.0, 0), Color("fff2b0"))
				m.put(K.torus(0.25, 0.3, 12), Vector3(0, 2.0, 0), Color("e8c66a"), Vector3(90, 0, 0))
			_:
				m.put(K.box(Vector3(0.6, 0.6, 0.6)), Vector3(0, 0.3, 0), Color("cccccc"))
		return m.commit())

# ------------------------------------------------------------------ scenery
static func mountain(variant := 0) -> ArrayMesh:
	return cached("mtn%d" % variant, func():
		var m := MeshMerger.new()
		var rng := RandomNumberGenerator.new()
		rng.seed = 900 + variant
		var h := rng.randf_range(45, 80)
		var r := rng.randf_range(40, 60)
		m.put(K.cyl(0.0, r, h, 7), Vector3(0, h / 2, 0), Color("6f7f78").lerp(Color("7a8a9a"), rng.randf()), Vector3(0, rng.randf() * 60, 0))
		m.put(K.cyl(0.0, r * 0.32, h * 0.32, 7), Vector3(0, h * 0.84, 0), Color("eef2f5"), Vector3(0, rng.randf() * 60, 0))
		for k in 2:
			var hh := h * rng.randf_range(0.45, 0.65)
			m.put(K.cyl(0.0, r * 0.7, hh, 6), Vector3(rng.randf_range(-r, r) * 0.7, hh / 2, rng.randf_range(-r, r) * 0.4), Color("5f7068"), Vector3(0, rng.randf() * 60, 0))
		return m.commit())

static func cloud(variant := 0) -> ArrayMesh:
	return cached("cloud%d" % variant, func():
		var m := MeshMerger.new()
		var rng := RandomNumberGenerator.new()
		rng.seed = 1100 + variant
		for k in 7:
			var r := rng.randf_range(5, 9)
			m.put(K.sphere(1.0, 10, 5), Vector3(rng.randf_range(-12, 12), rng.randf_range(0, 3), rng.randf_range(-5, 5)), Color("ffffff").lerp(Color("dfe8f0"), rng.randf() * 0.6), Vector3.ZERO, Vector3(r, r * 0.55, r))
		return m.commit())

static func cracked_boulder() -> ArrayMesh:
	return cached("cracked", func():
		var m := MeshMerger.new()
		m.put(K.sphere(1.8, 8, 5), Vector3(0, 1.4, 0), Color("8a8378"), Vector3(10, 20, 0), Vector3(1.2, 1.0, 0.9))
		for k in 5:
			m.put(K.box(Vector3(0.08, 1.2 - k * 0.15, 0.05)), Vector3(-0.3 + k * 0.2, 1.4 + (k % 2) * 0.3, -1.62), Color("3a3833"), Vector3(0, 0, -30 + k * 18))
		return m.commit())

static func cave_mouth() -> ArrayMesh:
	return cached("cave", func():
		var m := MeshMerger.new()
		for k in 9:
			var a := PI * k / 8.0
			m.put(K.sphere(1.6, 7, 4), Vector3(cos(a) * 3.2, sin(a) * 3.4, 0), [Color("7f786e"), Color("8a8378")][k % 2], Vector3(0, k * 30, 0), Vector3(1, 1, 1.6))
		m.put(K.box(Vector3(5.5, 4.0, 0.4)), Vector3(0, 1.6, 4.5), Color("2c2a28"))
		return m.commit())

static func stepping_stone() -> ArrayMesh:
	return cached("step", func():
		var m := MeshMerger.new()
		m.put(K.cyl(0.9, 1.0, 1.6, 9), Vector3(0, -0.4, 0), Color("9a978e"))
		m.put(K.sphere(0.4, 6, 3), Vector3(0.3, 0.42, 0.2), Color("6a9a40"), Vector3.ZERO, Vector3(1.2, 0.3, 1))
		return m.commit())

static func mushroom_cluster() -> ArrayMesh:
	return cached("mush", func():
		var m := MeshMerger.new()
		for k in 4:
			var p := Vector3(cos(k * 1.7) * 0.3, 0, sin(k * 1.7) * 0.3)
			var s := 1.0 - k * 0.18
			m.put(K.cyl(0.05 * s, 0.07 * s, 0.35 * s, 6), p + Vector3(0, 0.17 * s, 0), Color("efe6d4"))
			m.put(K.sphere(0.17 * s, 8, 4), p + Vector3(0, 0.36 * s, 0), Color("c4583f") if k % 2 == 0 else Color("e8b64c"), Vector3.ZERO, Vector3(1, 0.55, 1))
		return m.commit())

# ------------------------------------------------------------------ detail props
static func barrel() -> ArrayMesh:
	return cached("barrel", func():
		var m := MeshMerger.new()
		m.put(K.cyl(0.36, 0.36, 0.9, 12), Vector3(0, 0.45, 0), Color("8a5a32"))
		m.put(K.cyl(0.42, 0.42, 0.5, 12), Vector3(0, 0.45, 0), Color("9a6a3e"))
		for y in [0.12, 0.45, 0.78]:
			m.put(K.cyl(0.43, 0.43, 0.06, 12), Vector3(0, y, 0), Color("4a4440"))
		m.put(K.cyl(0.34, 0.34, 0.02, 12), Vector3(0, 0.91, 0), Color("c49a62"))
		return m.commit())

static func crates() -> ArrayMesh:
	return cached("crates", func():
		var m := MeshMerger.new()
		for c in [[Vector3(0, 0.3, 0), 0.0], [Vector3(0.65, 0.3, 0.1), 12.0], [Vector3(0.3, 0.9, 0.05), -8.0]]:
			m.put(K.box(Vector3(0.6, 0.6, 0.6)), c[0], Color("b08a55"), Vector3(0, c[1], 0))
			for e in [-0.27, 0.27]:
				m.put(K.box(Vector3(0.62, 0.08, 0.62)), c[0] + Vector3(0, e, 0), Color("7a5a36"), Vector3(0, c[1], 0))
		m.put(K.sphere(0.12, 6, 3), Vector3(0.6, 0.66, 0.0), Color("e8576b"))
		m.put(K.sphere(0.12, 6, 3), Vector3(0.75, 0.66, 0.2), Color("f2b33d"))
		return m.commit())

static func signpost() -> ArrayMesh:
	return cached("signpost", func():
		var m := MeshMerger.new()
		m.put(K.cyl(0.08, 0.1, 2.4, 6), Vector3(0, 1.2, 0), Color("6b4a32"))
		for a in [[20.0, 1.9, Color("e8dcc0")], [-130.0, 1.55, Color("dcd0b0")], [95.0, 1.2, Color("e8dcc0")]]:
			var dir := Vector3(cos(deg_to_rad(a[0])), 0, sin(deg_to_rad(a[0])))
			m.put(K.box(Vector3(1.0, 0.24, 0.06)), dir * 0.5 + Vector3(0, a[1], 0), a[2], Vector3(0, -a[0], 0))
			m.put(K.prism(Vector3(0.3, 0.24, 0.06)), dir * 1.06 + Vector3(0, a[1], 0), a[2], Vector3(0, -a[0], -90))
		return m.commit())

static func cart() -> ArrayMesh:
	return cached("cart", func():
		var m := MeshMerger.new()
		m.put(K.box(Vector3(1.6, 0.5, 1.0)), Vector3(0, 0.75, 0), Color("9a6a3e"))
		m.put(K.box(Vector3(1.5, 0.1, 0.9)), Vector3(0, 1.02, 0), Color("c9a24a"))
		for sz in [-1, 1]:
			m.put(K.cyl(0.42, 0.42, 0.08, 12), Vector3(0, 0.42, 0.55 * sz), Color("6b4a32"), Vector3(90, 0, 0))
			m.put(K.cyl(0.1, 0.1, 0.1, 8), Vector3(0, 0.42, 0.57 * sz), Color("4a4440"), Vector3(90, 0, 0))
		m.put(K.box(Vector3(1.4, 0.06, 0.06)), Vector3(-1.4, 0.62, 0.3), Color("6b4a32"), Vector3(0, 0, 8))
		m.put(K.box(Vector3(1.4, 0.06, 0.06)), Vector3(-1.4, 0.62, -0.3), Color("6b4a32"), Vector3(0, 0, 8))
		for k in 5:
			m.put(K.sphere(0.16, 6, 3), Vector3(-0.5 + k * 0.25, 1.15, -0.2 + (k % 2) * 0.35), [Color("f2b33d"), Color("e8576b"), Color("7fbf6a")][k % 3])
		return m.commit())

static func hay_bale() -> ArrayMesh:
	return cached("hay", func():
		var m := MeshMerger.new()
		m.put(K.cyl(0.6, 0.6, 1.0, 12), Vector3(0, 0.6, 0), Color("d8b85a"), Vector3(0, 0, 90))
		m.put(K.cyl(0.62, 0.62, 0.06, 12), Vector3(0.25, 0.6, 0), Color("b8983a"), Vector3(0, 0, 90))
		m.put(K.cyl(0.62, 0.62, 0.06, 12), Vector3(-0.25, 0.6, 0), Color("b8983a"), Vector3(0, 0, 90))
		return m.commit())

static func planter() -> ArrayMesh:
	return cached("planter", func():
		var m := MeshMerger.new()
		m.put(K.box(Vector3(2.0, 0.4, 0.7)), Vector3(0, 0.2, 0), Color("8a6a48"))
		m.put(K.box(Vector3(1.9, 0.05, 0.6)), Vector3(0, 0.41, 0), Color("5a4030"))
		for k in 9:
			var x := -0.85 + k * 0.21
			m.put(K.cyl(0.01, 0.015, 0.3, 3), Vector3(x, 0.55, (k % 2) * 0.15 - 0.07), Color("4f8a3a"), Vector3.ZERO, Vector3.ONE, 0.5)
			m.put(K.sphere(0.09, 6, 3), Vector3(x, 0.72, (k % 2) * 0.15 - 0.07), [Color("e8576b"), Color("f4e27a"), Color("c49af0"), Color("ffffff")][k % 4], Vector3.ZERO, Vector3(1, 0.7, 1), 1.0)
		return m.commit())

static func laundry_line() -> ArrayMesh:
	return cached("laundry", func():
		var m := MeshMerger.new()
		for sx in [-1, 1]:
			m.put(K.cyl(0.06, 0.07, 2.2, 6), Vector3(2.2 * sx, 1.1, 0), Color("6b4a32"))
		m.put(K.cyl(0.012, 0.012, 4.4, 4), Vector3(0, 2.05, 0), Color("dcd0b0"), Vector3(0, 0, 90))
		var cols := [Color("f0ebe0"), Color("6c9ad0"), Color("e8b64c"), Color("c4583f"), Color("ffffff")]
		for k in 5:
			m.put(K.box(Vector3(0.55, 0.6 + (k % 2) * 0.2, 0.03)), Vector3(-1.6 + k * 0.8, 1.72 - (k % 2) * 0.1, 0), cols[k], Vector3(0, 0, 0), Vector3.ONE, 0.6)
		return m.commit())

static func reeds() -> ArrayMesh:
	return cached("reeds", func():
		var m := MeshMerger.new()
		for k in 9:
			var a := k * 2.4
			var p := Vector3(cos(a) * 0.3 * (k % 3), 0, sin(a) * 0.3 * (k % 3))
			var h := 0.9 + (k % 4) * 0.25
			m.put(K.cyl(0.012, 0.025, h, 4), p + Vector3(0, h * 0.5, 0), Color("6f8f3a"), Vector3((k % 3 - 1) * 6.0, 0, (k % 2) * 8.0 - 4.0), Vector3.ONE, 0.8)
			if k % 3 == 0:
				m.put(K.capsule(0.04, 0.22), p + Vector3(0, h, 0), Color("6b4423"), Vector3.ZERO, Vector3.ONE, 1.0)
		return m.commit())

static func lily_pads() -> ArrayMesh:
	return cached("lily", func():
		var m := MeshMerger.new()
		for k in 5:
			var p := Vector3(cos(k * 1.9) * 0.9 * (k % 3), 0, sin(k * 1.9) * 0.9 * (k % 3))
			m.put(K.cyl(0.32, 0.32, 0.02, 10), p, Color("4f8a3a").lerp(Color("7fae4a"), (k % 3) * 0.4))
			if k % 2 == 0:
				for q in 5:
					m.put(K.sphere(0.06, 6, 3), p + Vector3(cos(q * 1.26) * 0.06, 0.06, sin(q * 1.26) * 0.06), Color("f6c6d8"), Vector3.ZERO, Vector3(1, 0.6, 1))
				m.put(K.sphere(0.04, 6, 3), p + Vector3(0, 0.09, 0), Color("f5d04a"))
		return m.commit())

static func well_bucket_bench() -> ArrayMesh:
	return decoration("deco_oak_bench")

static func bird() -> ArrayMesh:
	return cached("bird", func():
		var m := MeshMerger.new()
		m.put(K.capsule(0.06, 0.3), Vector3.ZERO, Color("3a3430"), Vector3(90, 0, 0))
		return m.commit())

# ------------------------------------------------------------------ Emberfall
static func dead_tree(variant := 0) -> ArrayMesh:
	return cached("dead%d" % variant, func():
		var m := MeshMerger.new()
		var rng := RandomNumberGenerator.new()
		rng.seed = 1300 + variant
		var bark := Color("2a2220")
		var h := 4.0 + variant
		m.add(K.tube(K.bezier(Vector3.ZERO, Vector3(0.3, h * 0.5, 0.1), Vector3(-0.2, h, 0), 6), K.taper(6, 0.32, 0.08), 7), Transform3D.IDENTITY, bark)
		for k in 5:
			var a := rng.randf() * TAU
			var y := h * rng.randf_range(0.45, 0.9)
			var base := Vector3(0, y, 0)
			var tip := base + Vector3(cos(a) * 1.6, rng.randf_range(0.4, 1.4), sin(a) * 1.6)
			m.add(K.tube(K.bezier(base, base.lerp(tip, 0.5) + Vector3(0, 0.3, 0), tip, 4), K.taper(4, 0.12, 0.02), 5), Transform3D.IDENTITY, bark)
			if k % 2 == 0:
				m.put(K.sphere(0.08, 5, 3), tip, Color("ff7a2a"))
		return m.commit())

static func spire(variant := 0) -> ArrayMesh:
	return cached("spire%d" % variant, func():
		var m := MeshMerger.new()
		var rng := RandomNumberGenerator.new()
		rng.seed = 1400 + variant
		for k in 3:
			var hh := rng.randf_range(4.0, 9.0) * (1.0 - k * 0.25)
			m.put(K.cyl(0.1, rng.randf_range(0.8, 1.4), hh, 6), Vector3(rng.randf_range(-1.2, 1.2), hh * 0.5, rng.randf_range(-1.2, 1.2)), [Color("2b2524"), Color("3a302c"), Color("221d1d")][k], Vector3(rng.randf_range(-8, 8), rng.randf() * 60, rng.randf_range(-8, 8)))
		m.put(K.box(Vector3(0.1, 2.0, 0.05)), Vector3(0.6, 1.5, 0.75), Color("ff6a1f"), Vector3(0, 30, 10))
		return m.commit())

static func ember_rock() -> ArrayMesh:
	return cached("emberrock", func():
		var m := MeshMerger.new()
		for k in 4:
			m.put(K.sphere(0.35 - k * 0.05, 6, 3), Vector3(cos(k * 1.7) * 0.4, 0.2 + (0.2 if k == 3 else 0.0), sin(k * 1.7) * 0.4), Color("2b2524"), Vector3(0, k * 40, 0), Vector3(1, 0.7, 1))
		for k in 5:
			m.put(K.cyl(0.0, 0.1, 0.5, 5), Vector3(cos(k * 1.3) * 0.25, 0.35, sin(k * 1.3) * 0.25), Color("ff8a3a"), Vector3(cos(k * 1.3) * 20, 0, sin(k * 1.3) * 20))
		return m.commit())

static func brazier(lit: bool) -> ArrayMesh:
	return cached("brazier%s" % lit, func():
		var m := MeshMerger.new()
		m.put(K.cyl(0.35, 0.5, 1.2, 8), Vector3(0, 0.6, 0), Color("3a302c"))
		m.put(K.cyl(0.8, 0.5, 0.45, 10), Vector3(0, 1.4, 0), Color("4a3a32"))
		for k in 4:
			m.put(K.box(Vector3(0.12, 0.5, 0.12)), Vector3(cos(k * PI / 2) * 0.75, 1.55, sin(k * PI / 2) * 0.75), Color("2b2524"))
		if lit:
			m.put(K.sphere(0.55, 10, 5), Vector3(0, 1.7, 0), Color("ffb347"), Vector3.ZERO, Vector3(1, 0.6, 1))
			m.put(K.cyl(0.0, 0.45, 1.2, 8), Vector3(0, 2.3, 0), Color("ff6a1f"))
		else:
			m.put(K.sphere(0.5, 8, 4), Vector3(0, 1.62, 0), Color("2a2220"), Vector3.ZERO, Vector3(1, 0.3, 1))
		return m.commit())

static func forge_ruins() -> ArrayMesh:
	return cached("forge", func():
		var m := MeshMerger.new()
		var c := Color("4a3f3a")
		for k in 10:
			var a := TAU * k / 10.0
			if k == 7 or k == 8:
				continue  # gap for the sealed door
			var hh := 2.5 + (k % 3) * 1.4
			m.put(K.box(Vector3(3.4, hh, 0.9)), Vector3(cos(a) * 10.0, hh * 0.5, sin(a) * 10.0), c if k % 2 else c.darkened(0.15), Vector3(0, -rad_to_deg(a) + 90, 0))
		m.put(K.cyl(9.6, 10.0, 0.4, 24), Vector3(0, 0.2, 0), Color("3a3330"))
		m.put(K.box(Vector3(1.6, 0.9, 0.8)), Vector3(0, 0.85, 0), Color("2b2524"))
		m.put(K.box(Vector3(2.2, 0.35, 0.9)), Vector3(0, 1.45, 0), Color("3a3533"))
		m.put(K.cyl(0.0, 0.3, 0.9, 4), Vector3(1.4, 1.45, 0), Color("3a3533"), Vector3(0, 0, -90))
		for k in 4:
			m.put(K.box(Vector3(0.3, 0.15, 0.3 + k * 0.15)), Vector3(-2.5, 0.5 + k * 0.15, 2.0), Color("ff8a3a") if k == 3 else Color("2b2524"))
		return m.commit())

static func forge_seal(cracked: bool) -> ArrayMesh:
	return cached("seal%s" % cracked, func():
		var m := MeshMerger.new()
		if not cracked:
			m.put(K.box(Vector3(6.6, 5.0, 1.2)), Vector3(0, 2.5, 0), Color("3a302c"))
			m.put(K.torus(1.0, 1.25, 20), Vector3(0, 2.7, -0.62), Color("ff6a1f"), Vector3(90, 0, 0))
			for k in 6:
				m.put(K.box(Vector3(0.08, 1.6, 0.05)), Vector3(-1.5 + k * 0.6, 2.2 + (k % 2) * 0.4, -0.63), Color("1e1a19"), Vector3(0, 0, -25 + k * 10))
		else:
			for k in 5:
				m.put(K.box(Vector3(1.2, 0.8, 1.0)), Vector3(-2.2 + k * 1.1, 0.4, -0.6 - (k % 2) * 0.8), Color("3a302c"), Vector3(k * 15, k * 30, k * 10))
		return m.commit())

static func warm_stone(raised: bool) -> ArrayMesh:
	return cached("warm%s" % raised, func():
		var m := MeshMerger.new()
		if raised:
			m.put(K.cyl(1.3, 1.4, 1.6, 8), Vector3(0, 0.8, 0), Color("4a3a32"))
			m.put(K.cyl(1.0, 1.0, 0.06, 8), Vector3(0, 1.62, 0), Color("ff8a3a"))
		else:
			m.put(K.cyl(1.3, 1.4, 0.3, 8), Vector3(0, 0.15, 0), Color("3a3533"))
			m.put(K.torus(0.6, 0.75, 12), Vector3(0, 0.32, 0), Color("6a5a50"), Vector3.ZERO, Vector3(1, 0.3, 1))
		return m.commit())

static func volcano() -> ArrayMesh:
	return cached("volcano", func():
		var m := MeshMerger.new()
		m.put(K.cyl(18.0, 95.0, 70.0, 12), Vector3(0, 35, 0), Color("2b2524"))
		m.put(K.cyl(14.0, 40.0, 20.0, 12), Vector3(0, 60, 0), Color("3a302c"))
		m.put(K.cyl(13.0, 13.0, 1.0, 12), Vector3(0, 70.2, 0), Color("ff6a1f"))
		for k in 6:
			var a := k * TAU / 6.0
			m.put(K.box(Vector3(2.0, 50.0, 1.0)), Vector3(cos(a) * 50.0, 32.0, sin(a) * 50.0), Color("c4481c"), Vector3(-20 * cos(a), -rad_to_deg(a), 20 * sin(a)))
		return m.commit())
