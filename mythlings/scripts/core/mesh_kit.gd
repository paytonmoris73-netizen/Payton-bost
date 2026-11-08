class_name MeshKit
## Procedural geometry + material helpers shared by creature, character and
## world builders. Meshes and materials are cached so hundreds of props share GPU
## resources. Everything here is a placeholder-quality stand-in for authored art
## and is listed as such in docs/ASSET_MANIFEST.md.

static var _mat_cache: Dictionary = {}
static var _mesh_cache: Dictionary = {}

# ------------------------------------------------------------------ materials
static func mat(color: Color, rough := 0.85, emission := Color.BLACK, emission_energy := 1.0, metallic := 0.0, rim := 0.0) -> StandardMaterial3D:
	var key := "%s|%.2f|%s|%.2f|%.2f|%.2f" % [color.to_html(), rough, emission.to_html(), emission_energy, metallic, rim]
	if _mat_cache.has(key):
		return _mat_cache[key]
	var m := StandardMaterial3D.new()
	m.albedo_color = color
	m.roughness = rough
	m.metallic = metallic
	if rim > 0.0:
		m.rim_enabled = true
		m.rim = rim
		m.rim_tint = 0.85
	if emission != Color.BLACK:
		m.emission_enabled = true
		m.emission = emission
		m.emission_energy_multiplier = emission_energy
	_mat_cache[key] = m
	return m

static func glow(color: Color, energy := 2.0) -> StandardMaterial3D:
	var key := "glow|%s|%.2f" % [color.to_html(), energy]
	if _mat_cache.has(key):
		return _mat_cache[key]
	var m := StandardMaterial3D.new()
	m.shading_mode = BaseMaterial3D.SHADING_MODE_UNSHADED
	m.albedo_color = color * energy if energy > 1.0 else color
	m.albedo_color.a = 1.0
	_mat_cache[key] = m
	return m

static func glass(color: Color, alpha := 0.5, emission := Color.BLACK) -> StandardMaterial3D:
	var key := "glass|%s|%.2f|%s" % [color.to_html(), alpha, emission.to_html()]
	if _mat_cache.has(key):
		return _mat_cache[key]
	var m := StandardMaterial3D.new()
	m.transparency = BaseMaterial3D.TRANSPARENCY_ALPHA
	m.albedo_color = Color(color, alpha)
	m.roughness = 0.08
	m.metallic = 0.1
	m.rim_enabled = true
	m.rim = 0.8
	m.rim_tint = 0.2
	m.cull_mode = BaseMaterial3D.CULL_BACK
	if emission != Color.BLACK:
		m.emission_enabled = true
		m.emission = emission
		m.emission_energy_multiplier = 0.6
	_mat_cache[key] = m
	return m

static func flat(color: Color, rough := 0.95) -> StandardMaterial3D:
	## Faceted look for stone.
	var key := "flat|%s|%.2f" % [color.to_html(), rough]
	if _mat_cache.has(key):
		return _mat_cache[key]
	var m := mat(color, rough).duplicate()
	m.rim_enabled = false
	_mat_cache[key] = m
	return m

static func vcol(rough := 0.9, two_sided := false) -> StandardMaterial3D:
	var key := "vcol|%.2f|%s" % [rough, two_sided]
	if _mat_cache.has(key):
		return _mat_cache[key]
	var m := StandardMaterial3D.new()
	m.vertex_color_use_as_albedo = true
	m.roughness = rough
	m.diffuse_mode = BaseMaterial3D.DIFFUSE_LAMBERT_WRAP
	if two_sided:
		m.cull_mode = BaseMaterial3D.CULL_DISABLED
	_mat_cache[key] = m
	return m

# ------------------------------------------------------------------ primitives
static func sphere(r := 0.5, seg := 16, rings := 8) -> SphereMesh:
	var key := "sph|%.3f|%d|%d" % [r, seg, rings]
	if not _mesh_cache.has(key):
		var m := SphereMesh.new()
		m.radius = r
		m.height = r * 2
		m.radial_segments = seg
		m.rings = rings
		_mesh_cache[key] = m
	return _mesh_cache[key]

static func cyl(top: float, bottom: float, h: float, seg := 12) -> CylinderMesh:
	var key := "cyl|%.3f|%.3f|%.3f|%d" % [top, bottom, h, seg]
	if not _mesh_cache.has(key):
		var m := CylinderMesh.new()
		m.top_radius = top
		m.bottom_radius = bottom
		m.height = h
		m.radial_segments = seg
		m.rings = 1
		_mesh_cache[key] = m
	return _mesh_cache[key]

static func capsule(r: float, h: float, seg := 14) -> CapsuleMesh:
	var key := "cap|%.3f|%.3f|%d" % [r, h, seg]
	if not _mesh_cache.has(key):
		var m := CapsuleMesh.new()
		m.radius = r
		m.height = max(h, r * 2.0)
		m.radial_segments = seg
		m.rings = 4
		_mesh_cache[key] = m
	return _mesh_cache[key]

static func box(size: Vector3) -> BoxMesh:
	var key := "box|%s" % [size]
	if not _mesh_cache.has(key):
		var m := BoxMesh.new()
		m.size = size
		_mesh_cache[key] = m
	return _mesh_cache[key]

static func prism(size: Vector3) -> PrismMesh:
	var key := "prism|%s" % [size]
	if not _mesh_cache.has(key):
		var m := PrismMesh.new()
		m.size = size
		_mesh_cache[key] = m
	return _mesh_cache[key]

static func torus(inner: float, outer: float, seg := 16) -> TorusMesh:
	var key := "tor|%.3f|%.3f|%d" % [inner, outer, seg]
	if not _mesh_cache.has(key):
		var m := TorusMesh.new()
		m.inner_radius = inner
		m.outer_radius = outer
		m.rings = seg
		m.ring_segments = 8
		_mesh_cache[key] = m
	return _mesh_cache[key]

## Adds a MeshInstance3D. rot is in degrees.
static func add(parent: Node3D, mesh: Mesh, material: Material, pos := Vector3.ZERO, rot := Vector3.ZERO, scl := Vector3.ONE, name := "") -> MeshInstance3D:
	var mi := MeshInstance3D.new()
	mi.mesh = mesh
	mi.material_override = material
	mi.position = pos
	mi.rotation_degrees = rot
	mi.scale = scl
	if name != "":
		mi.name = name
	parent.add_child(mi)
	return mi

static func pivot(parent: Node3D, pos := Vector3.ZERO, name := "", rot := Vector3.ZERO) -> Node3D:
	var n := Node3D.new()
	n.position = pos
	n.rotation_degrees = rot
	if name != "":
		n.name = name
	parent.add_child(n)
	return n

# ------------------------------------------------------------------ organic shapes
## A leaf / petal: a cambered, double-sided lens shape along +Y.
## curl bends the tip toward +Z (use rotation to orient).
static func petal(length := 0.4, width := 0.16, curl := 0.15, thickness := 0.025, seg := 8) -> ArrayMesh:
	var key := "petal|%.3f|%.3f|%.3f|%.3f|%d" % [length, width, curl, thickness, seg]
	if _mesh_cache.has(key):
		return _mesh_cache[key]
	var st := SurfaceTool.new()
	st.begin(Mesh.PRIMITIVE_TRIANGLES)
	var cols := 5
	var verts: Array = []
	for i in seg + 1:
		var v := float(i) / seg
		var w := sin(v * PI) * width * 0.5 * (1.0 - 0.25 * v)
		var y := v * length
		var z := curl * v * v * length
		var row: Array = []
		for j in cols:
			var u := float(j) / (cols - 1) * 2.0 - 1.0
			var bulge := (1.0 - u * u) * thickness * sin(v * PI)
			row.append([Vector3(u * w, y, z + bulge), Vector3(u * w, y, z - bulge)])
		verts.append(row)
	for side in 2:
		for i in seg:
			for j in cols - 1:
				var a: Vector3 = verts[i][j][side]
				var b: Vector3 = verts[i][j + 1][side]
				var c: Vector3 = verts[i + 1][j][side]
				var d: Vector3 = verts[i + 1][j + 1][side]
				if side == 0:
					st.add_vertex(a); st.add_vertex(c); st.add_vertex(b)
					st.add_vertex(b); st.add_vertex(c); st.add_vertex(d)
				else:
					st.add_vertex(a); st.add_vertex(b); st.add_vertex(c)
					st.add_vertex(b); st.add_vertex(d); st.add_vertex(c)
	st.generate_normals()
	var mesh := st.commit()
	mesh.set_meta("arrays", st.commit_to_arrays())
	_mesh_cache[key] = mesh
	return mesh

## Smooth tube swept along points with per-point radii. Used for tails, horns,
## antlers, vines, roots and necks.
static func tube(points: PackedVector3Array, radii: PackedFloat32Array, sides := 8, cap := true) -> ArrayMesh:
	var st := SurfaceTool.new()
	st.begin(Mesh.PRIMITIVE_TRIANGLES)
	var n := points.size()
	var rings: Array = []
	var prev_normal := Vector3.UP
	for i in n:
		var fwd: Vector3
		if i == 0:
			fwd = (points[1] - points[0]).normalized()
		elif i == n - 1:
			fwd = (points[i] - points[i - 1]).normalized()
		else:
			fwd = (points[i + 1] - points[i - 1]).normalized()
		var side := prev_normal.cross(fwd)
		if side.length() < 0.01:
			side = Vector3.RIGHT.cross(fwd)
		side = side.normalized()
		var up := fwd.cross(side).normalized()
		prev_normal = up
		var ring: Array = []
		for s in sides:
			var a := TAU * s / sides
			ring.append(points[i] + (side * cos(a) + up * sin(a)) * radii[i])
		rings.append(ring)
	for i in n - 1:
		for s in sides:
			var s2 := (s + 1) % sides
			var a: Vector3 = rings[i][s]
			var b: Vector3 = rings[i][s2]
			var c: Vector3 = rings[i + 1][s]
			var d: Vector3 = rings[i + 1][s2]
			st.add_vertex(a); st.add_vertex(b); st.add_vertex(c)
			st.add_vertex(b); st.add_vertex(d); st.add_vertex(c)
	if cap:
		for s in sides:
			var s2 := (s + 1) % sides
			st.add_vertex(points[n - 1]); st.add_vertex(rings[n - 1][s]); st.add_vertex(rings[n - 1][s2])
	st.generate_normals()
	var mesh := st.commit()
	mesh.set_meta("arrays", st.commit_to_arrays())
	return mesh

static func bezier(p0: Vector3, p1: Vector3, p2: Vector3, steps := 8) -> PackedVector3Array:
	var out := PackedVector3Array()
	for i in steps + 1:
		var t := float(i) / steps
		out.append(p0.lerp(p1, t).lerp(p1.lerp(p2, t), t))
	return out

static func taper(steps: int, r0: float, r1: float, bulge := 0.0) -> PackedFloat32Array:
	var out := PackedFloat32Array()
	for i in steps + 1:
		var t := float(i) / steps
		out.append(lerp(r0, r1, t) + sin(t * PI) * bulge)
	return out

## Cartoon eye: glossy dark iris with two highlights. Returns the eye pivot so
## the rig can blink it by scaling Y.
static func eye(parent: Node3D, pos: Vector3, r: float, iris := Color("1b1820"), facing := Vector3(0, 0, -1), glow_color := Color.BLACK) -> Node3D:
	var p := pivot(parent, pos)
	if facing.length() > 0.01 and abs(facing.normalized().dot(Vector3.UP)) < 0.99:
		p.basis = Basis.looking_at(facing, Vector3.UP)
	var iris_mat := mat(iris, 0.15, glow_color, 1.5, 0.0, 0.0) if glow_color != Color.BLACK else mat(iris, 0.12, Color.BLACK, 1.0, 0.0, 0.0)
	add(p, sphere(r, 14, 8), iris_mat, Vector3.ZERO, Vector3.ZERO, Vector3(1, 1.1, 0.6))
	add(p, sphere(r * 0.32, 8, 4), glow(Color.WHITE, 1.0), Vector3(r * 0.35, r * 0.4, -r * 0.5))
	add(p, sphere(r * 0.15, 6, 3), glow(Color.WHITE, 1.0), Vector3(-r * 0.3, -r * 0.3, -r * 0.55))
	return p
