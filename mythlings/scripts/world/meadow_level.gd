class_name MeadowLevel
extends Node3D
## Builds and runs Whispering Meadow: terrain, water, landmarks, vegetation,
## interactables, NPCs and creature spawns. Layout lives in LOC so designers can
## move landmarks without touching builder code.

static var current: MeadowLevel

const K := preload("res://scripts/core/mesh_kit.gd")

const LOC := {
	"spawn": Vector2(4, 12),
	"rowan": Vector2(3, 4),
	"well": Vector2(0, 0),
	"windmill": Vector2(34, 20),
	"bridge_site": Vector2(-34.2, 5),
	"mossbun": Vector2(-64, -6),
	"cloverling": Vector2(46, 57),
	"pebblit": Vector2(-29, 26),
	"sunfox": Vector2(38, 27),
	"dewdrop": Vector2(-35, -63),
	"ancient_oak": Vector2(62, -30),
	"oak_site": Vector2(62, -30),
	"forest_shrine": Vector2(-90, -40),
	"verdantus": Vector2(-84, -55),
	"butterfly_clearing": Vector2(45, 58),
	"whispering_woods": Vector2(-70, -5),
	"sunstone_river": Vector2(-36, 12),
	"meadow_village": Vector2(0, 0),
	"sunstone_falls": Vector2(-40, -66),
	"windmill_hills": Vector2(34, 20),
	"hidden_cave": Vector2(12, -73),
	"highland": Vector2(-10, -95),
	"market": Vector2(-9, -7),
}

const LOCATIONS := [
	["meadow_village", "Meadow Village", 20.0],
	["whispering_woods", "Whispering Woods", 24.0],
	["sunstone_river", "Sunstone River", 10.0],
	["ancient_oak", "Ancient Oak Sanctuary", 14.0],
	["butterfly_clearing", "Butterfly Clearing", 16.0],
	["forest_shrine", "The Forgotten Shrine", 11.0],
	["sunstone_falls", "Sunstone Falls", 10.0],
	["windmill_hills", "Windmill Hills", 10.0],
	["highland", "Waterfall Heights", 14.0],
	["hidden_cave", "Glimmer Grotto", 6.0],
]

var terrain := MeadowTerrain.new()
var sky: SkyCycle
var player: Player
var obstacles: Array = []  # Vector3(x, z, radius)
var butterflies: Array = []
var creatures: Dictionary = {}  # id -> Creature
var sites: Dictionary = {}
var static_body: StaticBody3D
var _windmill_blades: Node3D
var _night_lights: Array = []
var _decor_root: Node3D
var _quest_marker: Node3D
var _flower_pool: Array = []
var _flower_i := 0

func _enter_tree() -> void:
	current = self

func _exit_tree() -> void:
	if current == self:
		current = null

func at(key: String, lift := 0.0) -> Vector3:
	var v: Vector2 = LOC[key]
	return Vector3(v.x, terrain.height(v.x, v.y) + lift, v.y)

func ground(x: float, z: float) -> Vector3:
	return Vector3(x, terrain.height(x, z), z)

func build() -> void:
	_setup_paths()
	sky = SkyCycle.new()
	add_child(sky)
	sky.night_changed.connect(_on_night)
	static_body = StaticBody3D.new()
	static_body.collision_layer = 1
	add_child(static_body)
	_build_terrain()
	_build_water()
	_build_scenery()
	_build_village()
	_build_details()
	_build_woods()
	_build_meadow_trees()
	_build_oak_sanctuary()
	_build_bridge()
	_build_shrine()
	_build_waterfall_secrets()
	_build_cave()
	_build_resources()
	_build_ability_targets()
	_build_vegetation()
	_build_butterflies()
	_build_locations()
	_build_npcs()
	_build_quest_marker()
	_decor_root = Node3D.new()
	add_child(_decor_root)
	refresh_decorations()
	refresh_creatures()
	Events.companion_changed.connect(func(_c): refresh_creatures())
	Events.sanctuary_changed.connect(_on_sanctuary_changed)
	Events.ownership_changed.connect(func(_i): refresh_decorations())
	Events.creature_discovered.connect(func(_c): refresh_creatures())
	_on_night(sky.is_night())

func _on_sanctuary_changed(_s: String, _st: int) -> void:
	refresh_creatures()
	refresh_decorations()

func _setup_paths() -> void:
	terrain.paths = [
		[Vector2(0, 0), Vector2(-12, 3), Vector2(-24, 5), Vector2(-46, 5), Vector2(-56, 0), Vector2(-64, -6)],
		[Vector2(-64, -6), Vector2(-74, -20), Vector2(-84, -32), Vector2(-90, -40)],
		[Vector2(0, 0), Vector2(14, -8), Vector2(30, -18), Vector2(48, -26), Vector2(56, -28)],
		[Vector2(0, 0), Vector2(14, 14), Vector2(28, 32), Vector2(40, 50)],
		[Vector2(14, 14), Vector2(26, 18), Vector2(32, 18)],
		[Vector2(-12, 3), Vector2(-22, -18), Vector2(-28, -40), Vector2(-32, -56)],
	]

# ------------------------------------------------------------------ terrain & water
func _build_terrain() -> void:
	var mi := MeshInstance3D.new()
	mi.mesh = terrain.build_mesh()
	var sm := ShaderMaterial.new()
	sm.shader = load("res://shaders/terrain.gdshader")
	var nt := NoiseTexture2D.new()
	nt.width = 256
	nt.height = 256
	nt.seamless = true
	var fn := FastNoiseLite.new()
	fn.frequency = 0.03
	nt.noise = fn
	sm.set_shader_parameter("detail_noise", nt)
	mi.material_override = sm
	add_child(mi)
	static_body.add_child(terrain.build_collision())

func _noise_tex(freq: float) -> NoiseTexture2D:
	var nt := NoiseTexture2D.new()
	nt.width = 256
	nt.height = 256
	nt.seamless = true
	var fn := FastNoiseLite.new()
	fn.frequency = freq
	nt.noise = fn
	return nt

func _build_water() -> void:
	var mat := ShaderMaterial.new()
	mat.shader = load("res://shaders/water.gdshader")
	mat.set_shader_parameter("ripple_noise", _noise_tex(0.02))
	# Lower river (below the cliff) and upper river (on the plateau).
	for seg in [[MeadowTerrain.CLIFF_Z + 1.0, 150.0, MeadowTerrain.WATER_Y], [-150.0, MeadowTerrain.CLIFF_Z + 0.5, MeadowTerrain.HIGH_Y - 0.3]]:
		var st := SurfaceTool.new()
		st.begin(Mesh.PRIMITIVE_TRIANGLES)
		var z0: float = seg[0]
		var z1: float = seg[1]
		var y: float = seg[2]
		var steps := int((z1 - z0) / 2.0)
		var w := 9.5 if y < 1.0 else 7.0
		for i in steps + 1:
			var z := z0 + (z1 - z0) * i / steps
			var cx := MeadowTerrain.river_x(z)
			for side in [0.0, 1.0]:
				st.set_uv(Vector2(side, z * 0.1))
				st.set_normal(Vector3.UP)
				st.add_vertex(Vector3(cx - w + side * w * 2.0, y, z))
		for i in steps:
			var a := i * 2
			st.add_index(a); st.add_index(a + 2); st.add_index(a + 1)
			st.add_index(a + 1); st.add_index(a + 2); st.add_index(a + 3)
		var mi := MeshInstance3D.new()
		mi.mesh = st.commit()
		mi.material_override = mat
		mi.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
		add_child(mi)
	# Plunge pool disc.
	var pool_mat := mat.duplicate()
	pool_mat.set_shader_parameter("is_pool", true)
	var pool := MeshInstance3D.new()
	var disc := CylinderMesh.new()
	disc.top_radius = 11.0
	disc.bottom_radius = 11.0
	disc.height = 0.02
	disc.radial_segments = 32
	pool.mesh = disc
	pool.material_override = pool_mat
	pool.position = Vector3(MeadowTerrain.river_x(MeadowTerrain.CLIFF_Z + 9.0), MeadowTerrain.WATER_Y + 0.01, MeadowTerrain.CLIFF_Z + 9.0)
	add_child(pool)
	# Waterfall sheet + mist.
	var fx := MeadowTerrain.river_x(MeadowTerrain.CLIFF_Z)
	var fall := MeshInstance3D.new()
	var q := QuadMesh.new()
	q.size = Vector2(7.0, MeadowTerrain.HIGH_Y - MeadowTerrain.WATER_Y + 1.0)
	fall.mesh = q
	var fm := ShaderMaterial.new()
	fm.shader = load("res://shaders/waterfall.gdshader")
	fm.set_shader_parameter("streak_noise", _noise_tex(0.06))
	fall.material_override = fm
	fall.position = Vector3(fx, (MeadowTerrain.HIGH_Y + MeadowTerrain.WATER_Y) * 0.5, MeadowTerrain.CLIFF_Z + 1.2)
	fall.rotation_degrees.x = -12
	add_child(fall)
	var mist := FX.motes(Color(1, 1, 1, 1), 40, Vector3(4, 1.2, 2), 0.18)
	mist.position = Vector3(fx, 0.6, MeadowTerrain.CLIFF_Z + 3.0)
	mist.initial_velocity_max = 1.2
	add_child(mist)

# ------------------------------------------------------------------ scenery
func _build_scenery() -> void:
	var rng := RandomNumberGenerator.new()
	rng.seed = 5
	for i in 22:
		var a := TAU * i / 22.0 + rng.randf() * 0.1
		var d := rng.randf_range(190.0, 260.0)
		var mi := Props.node(Props.mountain(i % 6), "solid", Vector3(cos(a) * d, -6.0, sin(a) * d), rng.randf() * TAU, rng.randf_range(0.9, 1.4))
		mi.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
		add_child(mi)
	for i in 9:
		var a := rng.randf() * TAU
		var d := rng.randf_range(150.0, 260.0)
		var c := Props.node(Props.cloud(i % 4), "solid", Vector3(cos(a) * d, rng.randf_range(70, 110), sin(a) * d), rng.randf() * TAU, rng.randf_range(1.0, 1.8))
		c.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
		var cm := StandardMaterial3D.new()
		cm.vertex_color_use_as_albedo = true
		cm.shading_mode = BaseMaterial3D.SHADING_MODE_UNSHADED
		cm.disable_fog = false
		c.material_override = cm
		add_child(c)
	# Rim forest of pines softens the map edge.
	var pines: Array = []
	for i in 140:
		var a := rng.randf() * TAU
		var d := rng.randf_range(112.0, 145.0)
		var x := cos(a) * d
		var z := sin(a) * d
		pines.append(Transform3D(Basis(Vector3.UP, rng.randf() * TAU).scaled(Vector3.ONE * rng.randf_range(1.2, 2.0)), ground(x, z)))
	for i in 30:
		var x := rng.randf_range(-120, 60)
		var z := rng.randf_range(-140, -85)
		if absf(x - MeadowTerrain.river_x(z)) < 9.0:
			continue
		pines.append(Transform3D(Basis(Vector3.UP, rng.randf() * TAU).scaled(Vector3.ONE * rng.randf_range(1.0, 1.6)), ground(x, z)))
	Vegetation.instances(self, Props.pine_tree(), pines, "foliage", true)

func _add_obstacle(p: Vector3, r: float) -> void:
	obstacles.append(Vector3(p.x, p.z, r))

func _box_collider(pos: Vector3, size: Vector3, rot_y := 0.0, rot_z := 0.0) -> void:
	var cs := CollisionShape3D.new()
	var b := BoxShape3D.new()
	b.size = size
	cs.shape = b
	cs.position = pos
	cs.rotation = Vector3(0, rot_y, rot_z)
	static_body.add_child(cs)

func _cyl_collider(pos: Vector3, r: float, h: float) -> void:
	var cs := CollisionShape3D.new()
	var c := CylinderShape3D.new()
	c.radius = r
	c.height = h
	cs.shape = c
	cs.position = pos + Vector3(0, h * 0.5, 0)
	static_body.add_child(cs)

# ------------------------------------------------------------------ village
func _build_village() -> void:
	var angles := [-50.0, -85.0, -158.0, 75.0, 110.0, 145.0]
	for i in angles.size():
		var a := deg_to_rad(angles[i])
		var p := Vector3(cos(a) * 18.0, 0, sin(a) * 18.0)
		p.y = terrain.height(p.x, p.z) - 0.2
		var face := atan2(p.x, p.z)  # front (-Z) toward the plaza
		add_child(Props.node(Props.house(i), "solid", p, face))
		_box_collider(p + Vector3(0, 2.0, 0), Vector3(5.6 + i % 3 * 0.6, 4.0, 4.8), face)
		_add_obstacle(p, 3.6)
		var l := OmniLight3D.new()
		l.light_color = Color("ffc878")
		l.omni_range = 6.0
		l.light_energy = 0.0
		l.position = p + Basis(Vector3.UP, face) * Vector3(1.2, 2.2, -3.0)
		add_child(l)
		_night_lights.append(l)
	# Well and plaza.
	add_child(Props.node(Props.well(), "solid", at("well")))
	_cyl_collider(at("well"), 1.1, 1.0)
	_add_obstacle(at("well"), 1.4)
	for k in 3:
		var p := at("market") + Vector3(k * 3.4 - 3.4, 0, -abs(k - 1) * 1.0)
		add_child(Props.node(Props.market_stall(k), "solid", p, 0.2))
		_box_collider(p + Vector3(0, 0.5, 0), Vector3(2.6, 1.0, 1.4), 0.2)
		_add_obstacle(p, 1.6)
	# Plaza lamps (light up at night).
	for k in 6:
		var a := TAU * k / 6.0 + 0.3
		var p := ground(cos(a) * 10.5, sin(a) * 10.5)
		add_child(Props.node(Props.lamp_post(), "solid", p))
		var glow := K.add(self, K.sphere(0.16, 8, 4), K.glow(Color("ffd98a"), 1.6), p + Vector3(0, 2.85, 0))
		_night_lights.append(glow)
		var l := OmniLight3D.new()
		l.light_color = Color("ffc878")
		l.omni_range = 7.0
		l.light_energy = 0.0
		l.position = p + Vector3(0, 2.8, 0)
		add_child(l)
		_night_lights.append(l)
	# Fences around gardens.
	for f in [[Vector3(22, 0, 6), 0.4], [Vector3(-6, 0, 22), 1.4], [Vector3(16, 0, -16), -0.8]]:
		var p: Vector3 = f[0]
		add_child(Props.node(Props.fence(6.0), "solid", ground(p.x, p.z), f[1]))
	# Windmill on its hill.
	var wp := at("windmill", -0.3)
	add_child(Props.node(Props.windmill_base(), "solid", wp, deg_to_rad(-30)))
	_cyl_collider(wp, 2.3, 9.0)
	_add_obstacle(wp, 3.0)
	_windmill_blades = Node3D.new()
	_windmill_blades.position = wp + Basis(Vector3.UP, deg_to_rad(-30)) * Vector3(0, 8.0, -2.7)
	_windmill_blades.rotation.y = deg_to_rad(-30)
	_windmill_blades.add_child(Props.node(Props.windmill_blades(), "solid"))
	add_child(_windmill_blades)

# ------------------------------------------------------------------ set dressing
func _detail(mesh: Mesh, x: float, z: float, rot := 0.0, scl := 1.0, kind := "solid", collide_r := 0.0) -> void:
	var p := ground(x, z)
	add_child(Props.node(mesh, kind, p, rot, scl))
	if collide_r > 0.0:
		_cyl_collider(p, collide_r, 1.0)
		_add_obstacle(p, collide_r + 0.2)

func _build_details() -> void:
	# Village life: barrels, crates, carts, planters, laundry, signpost.
	for d in [[Props.barrel(), -9, 15, 0.0, 0.5], [Props.barrel(), -8, 16.2, 0.6, 0.5], [Props.crates(), 13, -12, 0.4, 0.8], [Props.barrel(), 15, -10.5, 0.2, 0.5],
			[Props.crates(), -14, -9, -0.6, 0.8], [Props.cart(), -16, -2, 1.2, 1.2], [Props.planter(), 6, -15.5, 0.3, 0.0], [Props.planter(), -4, 15.8, 0.0, 0.0],
			[Props.planter(), 15.5, 5, 1.5, 0.0], [Props.laundry_line(), -19, 9, 1.1, 0.0], [Props.barrel(), 4, -19, 0.0, 0.5], [Props.crates(), 18, 13, 2.0, 0.8]]:
		_detail(d[0], d[1], d[2], d[3], 1.0, "solid", d[4])
	_detail(Props.signpost(), 8.5, 6.5, 0.4, 1.0, "solid", 0.2)
	for k in 5:
		var a := TAU * k / 5.0
		_detail(Props.hay_bale(), 34 + cos(a) * 6.5, 20 + sin(a) * 6.5, a, 1.0, "solid", 0.7)
	_detail(Props.cart(), 28, 25, 2.4, 1.0, "solid", 1.0)
	# Chimney smoke from every house.
	var angles := [-50.0, -85.0, -158.0, 75.0, 110.0, 145.0]
	for i in angles.size():
		var a := deg_to_rad(angles[i])
		var hp := Vector3(cos(a) * 18.0, 0, sin(a) * 18.0)
		hp.y = terrain.height(hp.x, hp.z) - 0.2
		var face := atan2(hp.x, hp.z)
		var w := 5.0 + i * 0.6
		var smoke := FX.motes(Color(0.92, 0.92, 0.9), 10, Vector3(0.2, 0.2, 0.2), 0.22)
		smoke.lifetime = 5.0
		smoke.direction = Vector3(0.3, 1, 0)
		smoke.spread = 12.0
		smoke.initial_velocity_min = 0.5
		smoke.initial_velocity_max = 0.9
		smoke.scale_amount_min = 1.0
		smoke.scale_amount_max = 2.4
		var mat := StandardMaterial3D.new()
		mat.transparency = BaseMaterial3D.TRANSPARENCY_ALPHA
		mat.albedo_color = Color(0.93, 0.93, 0.92, 0.45)
		mat.shading_mode = BaseMaterial3D.SHADING_MODE_UNSHADED
		(smoke.mesh as SphereMesh).material = mat
		smoke.position = hp + Basis(Vector3.UP, face) * Vector3(w * 0.28, 6.4, 0.6)
		add_child(smoke)
	# Riverbanks: reeds, lily pads, stones in the water.
	var rng := RandomNumberGenerator.new()
	rng.seed = 77
	var reeds: Array = []
	for i in 46:
		var z := rng.randf_range(MeadowTerrain.CLIFF_Z + 4.0, 105.0)
		var side := -1.0 if i % 2 == 0 else 1.0
		var x := MeadowTerrain.river_x(z) + side * rng.randf_range(5.5, 7.5)
		if absf(z - 5.0) < 9.0:
			continue
		reeds.append(Transform3D(Basis(Vector3.UP, rng.randf() * TAU).scaled(Vector3.ONE * rng.randf_range(0.8, 1.3)), ground(x, z) - Vector3(0, 0.1, 0)))
	Vegetation.instances(self, Props.reeds(), reeds, "foliage", false, 80.0)
	var pads: Array = []
	var pc := Vector2(MeadowTerrain.river_x(MeadowTerrain.CLIFF_Z + 9.0), MeadowTerrain.CLIFF_Z + 9.0)
	for i in 6:
		var a := rng.randf() * TAU
		var r := rng.randf_range(4.0, 8.5)
		pads.append(Transform3D(Basis(Vector3.UP, rng.randf() * TAU), Vector3(pc.x + cos(a) * r, MeadowTerrain.WATER_Y + 0.03, pc.y + sin(a) * r)))
	for i in 8:
		var z := rng.randf_range(20.0, 100.0)
		pads.append(Transform3D(Basis(Vector3.UP, rng.randf() * TAU), Vector3(MeadowTerrain.river_x(z) + rng.randf_range(-6.0, -4.5), MeadowTerrain.WATER_Y + 0.03, z)))
	Vegetation.instances(self, Props.lily_pads(), pads, "solid", false, 70.0)
	var stones: Array = []
	for i in 18:
		var z := rng.randf_range(-60.0, 100.0)
		var x := MeadowTerrain.river_x(z) + rng.randf_range(-4.0, 4.0)
		stones.append(Transform3D(Basis(Vector3.UP, rng.randf() * TAU).scaled(Vector3.ONE * rng.randf_range(0.35, 0.7)), Vector3(x, -1.0, z)))
	Vegetation.instances(self, Props.rock(1), stones, "solid", false, 90.0)
	# Woods atmosphere: drifting leaves and glowing mushrooms.
	var leaves := FX.motes(Color("c9a24a"), 40, Vector3(30, 6, 40), 0.07)
	leaves.gravity = Vector3(0.15, -0.35, 0.05)
	leaves.lifetime = 9.0
	leaves.position = ground(-80, -10) + Vector3(0, 9, 0)
	var lm := StandardMaterial3D.new()
	lm.albedo_color = Color("b8862f")
	(leaves.mesh as SphereMesh).material = lm
	leaves.scale_amount_min = 0.8
	leaves.scale_amount_max = 1.4
	add_child(leaves)
	for i in 14:
		var x := rng.randf_range(-110, -55)
		var z := rng.randf_range(-70, 45)
		if not _tree_ok(x, z, 2.0):
			continue
		var g := Node3D.new()
		for k in 3:
			K.add(g, K.cyl(0.03, 0.04, 0.22, 5), K.mat(Color("e8e0d0")), Vector3(cos(k * 2.1) * 0.15, 0.11, sin(k * 2.1) * 0.15))
			K.add(g, K.sphere(0.09, 8, 4), K.mat(Color("7ad8e8"), 0.4, Color("4ac8e0"), 1.4), Vector3(cos(k * 2.1) * 0.15, 0.24, sin(k * 2.1) * 0.15), Vector3.ZERO, Vector3(1, 0.55, 1))
		g.position = ground(x, z)
		add_child(g)
	# Birds circling high over the meadow.
	for f in 3:
		var flock := Flock.new()
		flock.setup(Vector3([20.0, -60.0, 50.0][f], [38.0, 46.0, 42.0][f], [10.0, -20.0, 50.0][f]), 5 + f)
		add_child(flock)

class Flock extends Node3D:
	const K := preload("res://scripts/core/mesh_kit.gd")
	var _birds: Array = []
	var _t := 0.0
	var _r := 30.0
	func setup(c: Vector3, n: int) -> void:
		position = c
		_r = randf_range(22.0, 38.0)
		_t = randf() * TAU
		for i in n:
			var b := Node3D.new()
			K.add(b, K.capsule(0.08, 0.4), K.mat(Color("2f2a28")), Vector3.ZERO, Vector3(90, 0, 0))
			var wings := []
			for sx in [-1, 1]:
				var w := K.pivot(b, Vector3(0.05 * sx, 0, 0))
				K.add(w, K.box(Vector3(0.6, 0.02, 0.18)), K.mat(Color("2f2a28")), Vector3(0.3 * sx, 0, 0))
				wings.append(w)
			b.set_meta("wings", wings)
			b.set_meta("off", Vector3(randf_range(-3, 3), randf_range(-1.5, 1.5), randf_range(-3, 3)))
			add_child(b)
			_birds.append(b)
	func _process(delta: float) -> void:
		_t += delta * 0.18
		for i in _birds.size():
			var b: Node3D = _birds[i]
			var a := _t + i * 0.12
			var off: Vector3 = b.get_meta("off")
			b.position = Vector3(cos(a) * _r, sin(a * 2.0) * 1.5, sin(a) * _r) + off
			b.rotation.y = -a
			var flap := sin(Time.get_ticks_msec() * 0.012 + i) * 0.6
			var wings: Array = b.get_meta("wings")
			wings[0].rotation.z = flap
			wings[1].rotation.z = -flap

# ------------------------------------------------------------------ trees
func _tree_ok(x: float, z: float, clear := 3.5) -> bool:
	if terrain.is_water(x, z) or absf(x - MeadowTerrain.river_x(z)) < 9.0:
		return false
	if terrain.path_distance(x, z) < clear:
		return false
	if Vector2(x, z).length() < 26.0:
		return false
	for k in ["ancient_oak", "forest_shrine", "windmill", "butterfly_clearing", "verdantus"]:
		var c: Vector2 = LOC[k]
		var r: float = {"ancient_oak": 16.0, "forest_shrine": 9.0, "windmill": 8.0, "butterfly_clearing": 13.0, "verdantus": 10.0}[k]
		if Vector2(x, z).distance_to(c) < r:
			return false
	if z < MeadowTerrain.CLIFF_Z + 6.0 and z > MeadowTerrain.CLIFF_Z - 6.0:
		return false
	return terrain.normal(x, z).y > 0.8

func _build_woods() -> void:
	var rng := RandomNumberGenerator.new()
	rng.seed = 11
	var giants: Array[Array] = [[], [], []]
	var placed: Array = []
	var tries := 0
	while placed.size() < 46 and tries < 900:
		tries += 1
		var x := rng.randf_range(-112, -50)
		var z := rng.randf_range(-74, 52)
		if not _tree_ok(x, z, 4.5):
			continue
		var ok := true
		for p in placed:
			if Vector2(x, z).distance_to(p) < 9.0:
				ok = false
				break
		if not ok:
			continue
		placed.append(Vector2(x, z))
		var v := placed.size() % 3
		var s := rng.randf_range(0.85, 1.25)
		giants[v].append(Transform3D(Basis(Vector3.UP, rng.randf() * TAU).scaled(Vector3.ONE * s), ground(x, z) - Vector3(0, 0.3, 0)))
		_cyl_collider(ground(x, z), 1.3 * s, 8.0)
		_add_obstacle(ground(x, z), 1.8 * s)
	for v in 3:
		Vegetation.instances(self, Props.giant_tree(v), giants[v], "foliage", true)
	# Undergrowth, mushrooms and fireflies.
	var bushes: Array = []
	var mush: Array = []
	for i in 70:
		var x := rng.randf_range(-112, -50)
		var z := rng.randf_range(-74, 52)
		if not _tree_ok(x, z, 2.0):
			continue
		if i % 3 == 0:
			mush.append(Transform3D(Basis(Vector3.UP, rng.randf() * TAU).scaled(Vector3.ONE * rng.randf_range(1.0, 2.2)), ground(x, z)))
		else:
			bushes.append(Transform3D(Basis(Vector3.UP, rng.randf() * TAU).scaled(Vector3.ONE * rng.randf_range(0.8, 1.6)), ground(x, z)))
	Vegetation.instances(self, Props.bush(0), bushes, "foliage", false, 90.0)
	Vegetation.instances(self, Props.mushroom_cluster(), mush, "solid", false, 60.0)
	var ff := FX.motes(Color("d8ff8a"), 50, Vector3(28, 2.5, 40), 0.045)
	ff.position = ground(-80, -10) + Vector3(0, 2, 0)
	add_child(ff)

func _build_meadow_trees() -> void:
	var rng := RandomNumberGenerator.new()
	rng.seed = 21
	var sets: Array[Array] = [[], [], []]
	var count := 0
	var tries := 0
	while count < 55 and tries < 1200:
		tries += 1
		var x := rng.randf_range(-30, 105)
		var z := rng.randf_range(-74, 105)
		if Vector2(x, z).length() > 104.0 or not _tree_ok(x, z, 4.0):
			continue
		var v := rng.randi() % 3
		var s := rng.randf_range(0.8, 1.3)
		sets[v].append(Transform3D(Basis(Vector3.UP, rng.randf() * TAU).scaled(Vector3.ONE * s), ground(x, z) - Vector3(0, 0.2, 0)))
		_cyl_collider(ground(x, z), 0.4 * s, 4.0)
		_add_obstacle(ground(x, z), 0.8 * s)
		count += 1
	for v in 3:
		Vegetation.instances(self, Props.broadleaf_tree(v), sets[v], "foliage", true)
	var rocks: Array = []
	for i in 40:
		var x := rng.randf_range(-100, 100)
		var z := rng.randf_range(-100, 100)
		if Vector2(x, z).length() > 105.0 or not _tree_ok(x, z, 2.5):
			continue
		rocks.append(Transform3D(Basis(Vector3.UP, rng.randf() * TAU).scaled(Vector3.ONE * rng.randf_range(0.6, 1.4)), ground(x, z) - Vector3(0, 0.15, 0)))
	Vegetation.instances(self, Props.rock(rng.randi() % 3), rocks, "solid", true, 120.0)

# ------------------------------------------------------------------ sanctuary
func _build_oak_sanctuary() -> void:
	var c := at("ancient_oak", -0.6)
	add_child(Props.node(Props.ancient_oak(), "foliage", c))
	_cyl_collider(c, 2.4, 12.0)
	_add_obstacle(c, 4.0)
	var motes := FX.motes(Color("c8ffb0"), 30, Vector3(9, 4, 9), 0.06)
	motes.position = c + Vector3(0, 5, 0)
	add_child(motes)
	var site := SanctuarySite.new()
	site.setup("oak", "Ancient Oak Sanctuary", [
		{"title": "Raise the Standing Stones", "desc": "Rebuild the ring of runestones that shelters the sanctuary.", "cost": {"wood": 5, "stone": 4}, "min_level": 1, "xp": 80, "requires_quest": "q_main_05"},
		{"title": "Revive the Spring & Gardens", "desc": "Clear the old spring, plant flower beds and build Mythling homes. Habitat space: 4.", "cost": {"petals": 6, "wood": 6, "crystal": 1}, "min_level": 3, "xp": 120, "requires_quest": "q_main_07"},
		{"title": "Weave the Canopy Lights", "desc": "Hang glowing lanterns through the branches. Habitat space: 6, decoration space: 6.", "cost": {"wood": 10, "stone": 10, "glimmerroot": 2}, "min_level": 5, "xp": 200},
	], _oak_stage)
	site.position = c
	site.radius = 12.0
	add_child(site)
	sites["oak"] = site

func _oak_stage(s: int) -> Node3D:
	var root := Node3D.new()
	var c := at("ancient_oak")
	for k in 6:
		var a := TAU * k / 6.0 + 0.25
		var p := Vector3(cos(a) * 10.0, 0, sin(a) * 10.0)
		p.y = terrain.height(c.x + p.x, c.z + p.z) - c.y
		var st := Props.node(Props.standing_stone(s >= 1, k), "solid", p, -a)
		root.add_child(st)
	if s == 0:
		for k in 5:
			var a := TAU * k / 5.0
			var p := Vector3(cos(a) * 6.5, terrain.height(c.x + cos(a) * 6.5, c.z + sin(a) * 6.5) - c.y, sin(a) * 6.5)
			var b := Props.node(Props.bush(0), "solid", p, a, 0.8)
			var dry := StandardMaterial3D.new()
			dry.vertex_color_use_as_albedo = true
			dry.albedo_color = Color("b59a6a")
			b.material_override = dry
			root.add_child(b)
	if s >= 1:
		var ring := MeshInstance3D.new()
		var t := TorusMesh.new()
		t.inner_radius = 9.6
		t.outer_radius = 10.4
		t.rings = 48
		ring.mesh = t
		ring.material_override = K.mat(Color("cfc6ae"))
		ring.scale = Vector3(1, 0.08, 1)
		ring.position.y = 0.05
		root.add_child(ring)
		var glow := FX.motes(Color("9dffc0"), 24, Vector3(10, 1.5, 10), 0.05)
		glow.position.y = 1.0
		root.add_child(glow)
	if s >= 2:
		var pool := Props.node(Props.spring_pool(), "solid", Vector3(-6.5, terrain.height(c.x - 6.5, c.z + 4) - c.y, 4))
		root.add_child(pool)
		var water := K.add(pool, K.cyl(2.8, 2.8, 0.05, 24), K.glass(Color("58b8d8"), 0.75, Color("2a7aa0")), Vector3(0, 0.2, 0))
		water.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
		for k in 3:
			var a := 1.9 + k * 0.7
			var p := Vector3(cos(a) * 7.0, 0, sin(a) * 7.0)
			p.y = terrain.height(c.x + p.x, c.z + p.z) - c.y
			root.add_child(Props.node(Props.decoration("deco_mythling_house"), "solid", p, a + PI))
		var flowers := MeshMerger.new()
		var rng := RandomNumberGenerator.new()
		rng.seed = 8
		for k in 80:
			var a := rng.randf() * TAU
			var d := rng.randf_range(4.5, 9.0)
			var p := Vector3(cos(a) * d, 0, sin(a) * d)
			p.y = terrain.height(c.x + p.x, c.z + p.z) - c.y
			flowers.put(K.sphere(0.09, 6, 3), p + Vector3(0, 0.25, 0), [Color("f2a7c3"), Color("f4e27a"), Color("ffffff"), Color("c49af0"), Color("e8576b")][k % 5], Vector3.ZERO, Vector3(1, 0.6, 1), 1.0)
			flowers.put(K.cyl(0.01, 0.01, 0.25, 3), p + Vector3(0, 0.12, 0), Color("4f8a3a"), Vector3.ZERO, Vector3.ONE, 0.5)
		var fm := MeshInstance3D.new()
		fm.mesh = flowers.commit()
		fm.material_override = Props.material("foliage")
		root.add_child(fm)
	if s >= 3:
		for k in 14:
			var a := TAU * k / 14.0
			var d := 4.0 + (k % 3) * 2.2
			K.add(root, K.sphere(0.22, 8, 4), K.glow(Color("ffe9a8"), 1.8), Vector3(cos(a) * d, 7.5 + (k % 4) * 1.4, sin(a) * d))
	return root

func refresh_decorations() -> void:
	if _decor_root == null:
		return
	for ch in _decor_root.get_children():
		ch.queue_free()
	var stage := GameState.sanctuary_stage("oak")
	if stage < 1:
		return
	var slots := 3 if stage < 3 else 6
	var owned: Array = []
	for p in DB.shop.values():
		if not GameState.owns(p.id):
			continue
		if p.grants.has("decoration") and not (p.grants.decoration in owned):
			owned.append(p.grants.decoration)
	var c := at("ancient_oak")
	for i in mini(owned.size(), slots):
		var a := 0.9 + i * 0.55
		var p := Vector3(c.x + cos(a) * 13.5, 0, c.z + sin(a) * 13.5)
		p.y = terrain.height(p.x, p.z)
		_decor_root.add_child(Props.node(Props.decoration(owned[i]), "solid", p, -a + PI * 0.5))

# ------------------------------------------------------------------ bridge
func _build_bridge() -> void:
	var p := at("bridge_site")
	p.y = -0.1
	var site := SanctuarySite.new()
	site.setup("bridge", "the Meadow Bridge", [
		{"title": "Rebuild the Bridge", "desc": "Mend the broken arch so travellers can cross Sunstone River without wading.", "cost": {"stone": 6, "wood": 4}, "min_level": 1, "xp": 60},
	], func(s: int) -> Node3D:
		var root := Node3D.new()
		root.add_child(Props.node(Props.bridge(s >= 1), "solid"))
		_bridge_collision(root, s >= 1)
		return root)
	site.position = p
	site.radius = 7.0
	add_child(site)
	sites["bridge"] = site

func _bridge_collision(root: Node3D, whole: bool) -> void:
	var body := StaticBody3D.new()
	body.collision_layer = 1
	root.add_child(body)
	var segs := 14
	for k in segs + 1:
		var t := float(k) / segs
		if not whole and k >= 6 and k <= 9:
			continue
		var cs := CollisionShape3D.new()
		var b := BoxShape3D.new()
		b.size = Vector3(16.0 / segs + 0.15, 0.45, 2.8)
		cs.shape = b
		cs.position = Vector3(-8.0 + t * 16.0, sin(t * PI) * 1.6 + 1.0, 0)
		cs.rotation.z = deg_to_rad(-cos(t * PI) * 12.0)
		body.add_child(cs)
	for sz in [-1, 1]:
		var rail := CollisionShape3D.new()
		var rb := BoxShape3D.new()
		rb.size = Vector3(16, 1.2, 0.3)
		rail.shape = rb
		rail.position = Vector3(0, 2.2, 1.5 * sz)
		body.add_child(rail)

# ------------------------------------------------------------------ shrine & Verdantus
func _build_shrine() -> void:
	var p := at("forest_shrine", -0.2)
	var site := SanctuarySite.new()
	site.setup("shrine", "the Forgotten Shrine", [
		{"title": "Rekindle the Shrine", "desc": "Set Glimmerroot in the shrine's heart and mend its pillars.", "cost": {"glimmerroot": 3, "stone": 5}, "min_level": 4, "xp": 150, "requires_quest": "q_main_08"},
	], func(s: int) -> Node3D:
		var root := Node3D.new()
		root.add_child(Props.node(Props.shrine(s >= 1), "solid"))
		if s >= 1:
			K.add(root, K.sphere(0.45, 12, 6), K.glow(Color("6dffb0"), 2.0), Vector3(0, 2.9, 0))
			var m := FX.motes(Color("8affc0"), 30, Vector3(3, 2, 3), 0.06)
			m.position = Vector3(0, 2.5, 0)
			root.add_child(m)
		return root)
	site.position = p
	site.radius = 6.0
	site.restored.connect(func(_s): _awaken_verdantus())
	add_child(site)
	sites["shrine"] = site
	_cyl_collider(p, 2.4, 1.2)

func _awaken_verdantus() -> void:
	refresh_creatures()
	var v: Creature = creatures.get("verdantus")
	if v == null:
		return
	var final := v.global_position
	v.global_position = final - Vector3(0, 8, 0)
	var tw := create_tween()
	tw.tween_property(v, "global_position", final, 3.0).set_trans(Tween.TRANS_CUBIC).set_ease(Tween.EASE_OUT)
	tw.tween_callback(func(): v.emote("roar", 2.0))
	for i in 6:
		get_tree().create_timer(0.4 * i).timeout.connect(func(): FX.burst(self, final + Vector3(randf_range(-4, 4), 0.5, randf_range(-4, 4)), Color("8affc0"), 30, 0.15, 6.0, 1.4))
	Events.toast.emit("Something stirs…", "The ground trembles beneath the woods.", "leaf")
	Audio.play_sfx("stomp")
	if player:
		player.focus_on(final + Vector3(0, 5, 0))
		get_tree().create_timer(4.0).timeout.connect(player.clear_focus)

func spawn_footstep_flowers(p: Vector3) -> void:
	# Pooled blossom meshes that grow and fade where Verdantus walks.
	if _flower_pool.size() < 24:
		var f := Node3D.new()
		var m := MeshMerger.new()
		for k in 5:
			var a := k * TAU / 5.0
			m.put(K.sphere(0.12, 6, 3), Vector3(cos(a) * 0.5, 0.15, sin(a) * 0.5), [Color("f2a7c3"), Color("f4e27a"), Color("ffffff")][k % 3], Vector3.ZERO, Vector3(1, 0.6, 1))
			m.put(K.petal(0.3, 0.12, 0.05), Vector3(cos(a + 0.6) * 0.4, 0.0, sin(a + 0.6) * 0.4), Color("6aa648"), Vector3(-70, rad_to_deg(-a), 0))
		f.add_child(Props.node(m.commit(), "solid"))
		add_child(f)
		_flower_pool.append(f)
	var node: Node3D = _flower_pool[_flower_i % _flower_pool.size()]
	_flower_i += 1
	node.global_position = p
	node.scale = Vector3.ONE * 0.05
	node.visible = true
	var tw := node.create_tween()
	tw.tween_property(node, "scale", Vector3.ONE * randf_range(0.9, 1.4), 0.6).set_trans(Tween.TRANS_BACK).set_ease(Tween.EASE_OUT)
	tw.tween_interval(5.0)
	tw.tween_property(node, "scale", Vector3.ONE * 0.01, 1.2)

# ------------------------------------------------------------------ secrets
func _build_waterfall_secrets() -> void:
	var px := MeadowTerrain.river_x(MeadowTerrain.CLIFF_Z + 9.0)
	var stones_before := Node3D.new()
	var stones_after := Node3D.new()
	var body := StaticBody3D.new()
	body.collision_layer = 1
	var zs := [-61.5, -64.5, -67.5, -70.5, -73.5]
	for i in zs.size():
		var sp := Vector3(px + (i % 2) * 1.2 - 0.6, -0.1, zs[i])
		stones_after.add_child(Props.node(Props.stepping_stone(), "solid", sp, i * 0.7))
		var ripple := K.add(stones_before, K.torus(0.7, 0.9, 16), K.glass(Color("ffffff"), 0.35), sp + Vector3(0, 0.2, 0), Vector3.ZERO, Vector3(1, 0.1, 1))
		ripple.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
		var cs := CollisionShape3D.new()
		var cy := CylinderShape3D.new()
		cy.radius = 0.95
		cy.height = 1.6
		cs.shape = cy
		cs.position = sp + Vector3(0, -0.4, 0)
		body.add_child(cs)
	# Ledge hidden behind the falls with a chest.
	var ledge := Vector3(px, 0.9, MeadowTerrain.CLIFF_Z + 1.5)
	stones_after.add_child(Props.node(Props.stepping_stone(), "solid", ledge + Vector3(0, -0.1, 0), 0.0, 2.2))
	var lcs := CollisionShape3D.new()
	var lcy := CylinderShape3D.new()
	lcy.radius = 2.0
	lcy.height = 2.6
	lcs.shape = lcy
	lcs.position = ledge + Vector3(0, -0.9, 0)
	body.add_child(lcs)
	var t := AbilityTarget.new()
	t.setup("ripple_stone", "falls_stones", stones_before, stones_after)
	t.on_activate = func(_t):
		_enable_collision(body, true)
	add_child(t)
	stones_after.add_child(body)
	_enable_collision(body, t.done or GameState.flag("ab_falls_stones"))
	_chest(ledge + Vector3(0, 0.4, 0), "chest_falls", {"crystals": 15, "items": {"glimmerroot": 1, "crystal": 2}}, "Behind the Falls")
	# Vines up the cliff lead to the plateau.
	var vx := -18.0
	var vz := MeadowTerrain.CLIFF_Z + 2.5
	var base := ground(vx, vz)
	var climb := ClimbArea.new()
	climb.setup(Vector3(3.5, 14.0, 2.0), Vector3(0, 0, 1))
	climb.position = Vector3(vx, base.y + 6.0, vz - 0.8)
	add_child(climb)
	for k in 6:
		var x := vx - 1.5 + k * 0.6
		var pts := PackedVector3Array()
		for j in 9:
			var z := vz - 1.5 - j * 0.65
			var y := terrain.height(x, z) + 0.15
			pts.append(Vector3(x + sin(j * 1.3 + k) * 0.15, y, z + 0.25))
		var mi := MeshInstance3D.new()
		mi.mesh = K.tube(pts, K.taper(8, 0.07, 0.05), 5)
		mi.material_override = K.mat(Color("4f8a3a"))
		add_child(mi)
		for j in 5:
			K.add(self, K.petal(0.22, 0.12, 0.05), K.mat(Color("6aa648")), pts[j * 2] + Vector3(0, 0, 0.1), Vector3(-60, randf() * 360, 0))

func _enable_collision(body: StaticBody3D, on: bool) -> void:
	body.collision_layer = 1 if on else 0

func _chest(p: Vector3, uid: String, reward: Dictionary, label: String) -> void:
	var chest := Treasure.new()
	chest.setup(uid, reward, label)
	chest.position = p
	add_child(chest)

func _build_cave() -> void:
	var cp := at("hidden_cave")
	add_child(Props.node(Props.cave_mouth(), "solid", cp + Vector3(0, -0.3, -2.0), PI))
	var crystals := Node3D.new()
	for k in 3:
		var p := cp + Vector3(-1.6 + k * 1.6, 0, -2.5 - (k % 2) * 0.6)
		p.y = terrain.height(p.x, p.z)
		var rn := ResourceNode.new()
		rn.item_id = "crystal"
		rn.respawn_time = 300.0
		rn.position = p
		rn.visual = Props.node(Props.crystal_cluster(), "solid")
		rn.add_child(rn.visual)
		var l := OmniLight3D.new()
		l.light_color = Color("8fd8f5")
		l.omni_range = 4.0
		l.light_energy = 0.8
		l.position.y = 1.0
		rn.add_child(l)
		crystals.add_child(rn)
	add_child(crystals)
	var boulder := Props.node(Props.cracked_boulder(), "solid", cp + Vector3(0, -0.4, 0.8))
	var bbody := StaticBody3D.new()
	var bcs := CollisionShape3D.new()
	var bsh := SphereShape3D.new()
	bsh.radius = 2.0
	bcs.shape = bsh
	bcs.position = Vector3(0, 1.4, 0)
	bbody.add_child(bcs)
	boulder.add_child(bbody)
	var t := AbilityTarget.new()
	t.setup("cracked_rock", "cave_boulder", boulder, null, {"xp": 40})
	t.on_activate = func(_t):
		FX.burst(self, cp + Vector3(0, 1.4, 1.0), Color("a39d90"), 50, 0.2, 7.0, 1.2, -9.0)
		bbody.collision_layer = 0
	add_child(t)
	if t.done:
		bbody.collision_layer = 0
	crystals.visible = true

# ------------------------------------------------------------------ resources
func _resource(item: String, p: Vector3, mesh: Mesh, kind := "solid", amount := Vector2i(1, 2), respawn := 120.0) -> ResourceNode:
	var rn := ResourceNode.new()
	rn.item_id = item
	rn.amount_min = amount.x
	rn.amount_max = amount.y
	rn.respawn_time = respawn
	rn.position = p
	rn.visual = Props.node(mesh, kind, Vector3.ZERO, randf() * TAU)
	rn.add_child(rn.visual)
	add_child(rn)
	return rn

func _build_resources() -> void:
	var wood := [Vector2(-52, -14), Vector2(-60, 14), Vector2(-72, -30), Vector2(-78, 18), Vector2(-46, 30), Vector2(20, -30), Vector2(48, -10), Vector2(70, -14), Vector2(18, 40), Vector2(-14, -30), Vector2(56, -40), Vector2(-92, -26)]
	for v in wood:
		_resource("wood", ground(v.x, v.y), Props.log_pile(), "solid", Vector2i(2, 3))
	var stone := [Vector2(-27, 16), Vector2(-27, -6), Vector2(-26, -30), Vector2(-46, 22), Vector2(-48, -40), Vector2(-30, -58), Vector2(6, -66), Vector2(24, -60), Vector2(74, -40), Vector2(-28, 40), Vector2(80, 10)]
	for v in stone:
		_resource("stone", ground(v.x, v.y), Props.stone_pile(), "solid", Vector2i(2, 3))
	var petals := [Vector2(38, 50), Vector2(52, 64), Vector2(34, 66), Vector2(58, 48), Vector2(10, 22), Vector2(-14, 18), Vector2(68, -20), Vector2(50, -38)]
	for v in petals:
		_resource("petals", ground(v.x, v.y), Props.bush(2), "foliage", Vector2i(2, 3))
	var berries := [Vector2(20, 10), Vector2(-16, -14), Vector2(28, -12), Vector2(-56, -26), Vector2(40, 40), Vector2(64, 30)]
	for v in berries:
		_resource("sunberry", ground(v.x, v.y), Props.bush(1), "foliage", Vector2i(1, 2), 180.0)
	for v in [Vector2(-28, -66), Vector2(-46, -60)]:
		var rn := _resource("dew_nectar", ground(v.x, v.y), Vegetation.flower_mesh(Color("8fdcf5")), "foliage", Vector2i(1, 1), 200.0)
		rn.visual.scale = Vector3.ONE * 3.0
	_resource("crystal", ground(-8, -100), Props.crystal_cluster(), "solid", Vector2i(1, 1), 400.0)

func _build_ability_targets() -> void:
	# Glimmerroot (Mossy Sense). Revealed once, collected once.
	var roots := [Vector2(-58, -2), Vector2(-70, 8), Vector2(-82, -22), Vector2(-95, -48), Vector2(-86, -60), Vector2(-62, -40), Vector2(30, -36), Vector2(66, -18), Vector2(-4, -98), Vector2(52, 72)]
	for i in roots.size():
		var p := ground(roots[i].x, roots[i].y)
		var after := Node3D.new()
		var rn := ResourceNode.new()
		rn.item_id = "glimmerroot"
		rn.once_flag = "gr_%d" % i
		rn.respawn_time = -1.0
		var vis := Node3D.new()
		K.add(vis, K.sphere(0.18, 8, 4), K.glow(Color("7af2b8"), 1.8), Vector3(0, 0.15, 0), Vector3.ZERO, Vector3(1, 0.6, 1))
		for k in 4:
			K.add(vis, K.petal(0.35, 0.12, 0.1), K.mat(Color("5fbf7f"), 0.6, Color("3a9a6a"), 0.4), Vector3(0, 0.1, 0), Vector3(-25, k * 90, 0))
		rn.visual = vis
		rn.add_child(vis)
		after.add_child(rn)
		var t := AbilityTarget.new()
		t.setup("hidden_plant", "root_%d" % i, null, after)
		t.position = p
		add_child(t)
	# Dark lanterns (Sunfox).
	for i in 3:
		var v: Vector2 = [Vector2(-20, 4.5), Vector2(22, -14), Vector2(18, 20)][i]
		var p := ground(v.x, v.y)
		add_child(Props.node(Props.lamp_post(), "solid", p))
		var lit := Node3D.new()
		K.add(lit, K.sphere(0.2, 8, 4), K.glow(Color("ffb85a"), 2.2), Vector3(0, 2.85, 0))
		var l := OmniLight3D.new()
		l.light_color = Color("ffb070")
		l.omni_range = 8.0
		l.light_energy = 1.2
		l.position.y = 2.8
		lit.add_child(l)
		var unlit := Node3D.new()
		K.add(unlit, K.sphere(0.18, 8, 4), K.mat(Color("4a4440")), Vector3(0, 2.85, 0))
		var t := AbilityTarget.new()
		t.setup("dark_lantern", "lantern_%d" % i, unlit, lit, {"gold": 15})
		t.position = p
		add_child(t)
	# Wilted flowers (Bloomtail).
	for i in 4:
		var v: Vector2 = [Vector2(54, -24), Vector2(70, -36), Vector2(42, 62), Vector2(30, 44)][i]
		var p := ground(v.x, v.y)
		var before := Node3D.new()
		var mb := MeshMerger.new()
		mb.put(K.cyl(0.02, 0.03, 0.5, 4), Vector3(0.05, 0.22, 0), Color("8a7a4a"), Vector3(0, 0, 25))
		mb.put(K.sphere(0.12, 6, 3), Vector3(0.18, 0.38, 0), Color("8a6a4a"), Vector3.ZERO, Vector3(1, 0.5, 1))
		before.add_child(Props.node(mb.commit(), "solid"))
		var after := Node3D.new()
		after.add_child(Props.node(Vegetation.flower_mesh([Color("e8576b"), Color("f2a7c3"), Color("c49af0"), Color("f4e27a")][i]), "foliage", Vector3.ZERO, 0.0, 3.2))
		var t := AbilityTarget.new()
		t.setup("wilted_flower", "wilted_%d" % i, before, after, {"items": {"petals": 3}})
		t.position = p
		add_child(t)
	# Lucky clovers (Cloverling).
	for i in 3:
		var v: Vector2 = [Vector2(40, 54), Vector2(54, 60), Vector2(46, 68)][i]
		var p := ground(v.x, v.y)
		var after := Node3D.new()
		for k in 6:
			K.add(after, K.petal(0.16, 0.13, -0.05), K.mat(Color("e3c24a"), 0.4, Color("e3c24a"), 0.6), Vector3(cos(k) * 0.2, 0.05, sin(k) * 0.2), Vector3(-80, k * 60, 0))
		var t := AbilityTarget.new()
		t.setup("lucky_clover", "clover_%d" % i, null, after, {"gold": 30, "items": {"sunberry": 1}})
		t.position = p
		add_child(t)
	# Hidden treasure (Verdantus' Guardian's Gaze).
	for i in 3:
		var v: Vector2 = [Vector2(-104, 30), Vector2(88, 64), Vector2(18, -104)][i]
		var p := ground(v.x, v.y)
		var after := Node3D.new()
		var tr := Treasure.new()
		tr.setup("guardian_cache_%d" % i, {"crystals": 10, "gold": 80}, "Guardian's Cache")
		after.add_child(tr)
		var t := AbilityTarget.new()
		t.setup("hidden_treasure", "cache_%d" % i, null, after)
		t.position = p
		add_child(t)

# ------------------------------------------------------------------ vegetation
func _build_vegetation() -> void:
	var veg := Node3D.new()
	veg.name = "Vegetation"
	add_child(veg)
	var area := Rect2(-120, -150, 240, 260)
	var t := terrain
	var grass_ok := func(x: float, z: float) -> float:
		if Vector2(x, z).length() > 118.0:
			return 0.0
		var h := t.height(x, z)
		if h < t.water_level_at(x, z) + 0.25:
			return 0.0
		if Vector2(x, z).length() < 9.0:
			return 0.0
		if t.path_distance(x, z) < 1.4:
			return 0.0
		if t.normal(x, z).y < 0.75:
			return 0.0
		return 1.0
	Vegetation.scatter(veg, t, area, 260, Props.grass_tuft(), grass_ok, 1, Color(0.85, 0.95, 0.8), Color(1.15, 1.1, 0.85))
	var colors := [Color("f2a7c3"), Color("ffffff"), Color("f4e27a"), Color("c49af0"), Color("e8576b")]
	for ci in colors.size():
		var clearing := Vector2(45, 58)
		var fl_ok := func(x: float, z: float) -> float:
			var base: float = grass_ok.call(x, z)
			if base <= 0.0:
				return 0.0
			var near := exp(-Vector2(x, z).distance_squared_to(clearing) / 600.0)
			var village := exp(-Vector2(x, z).length_squared() / 900.0) * 0.4
			return clampf(0.06 + near * 0.9 + village, 0.0, 1.0)
		Vegetation.scatter(veg, t, area, 40, Vegetation.flower_mesh(colors[ci]), fl_ok, 40 + ci, Color.WHITE, Color.WHITE, 0.8, 1.3)

func _build_butterflies() -> void:
	var cols := [Color("f2c94c"), Color("f2a7c3"), Color("8fd3ec"), Color("ffffff"), Color("f08a4a")]
	var anchors := [Vector2(45, 58), Vector2(45, 58), Vector2(45, 58), Vector2(42, 52), Vector2(50, 64), Vector2(8, 14), Vector2(60, -24), Vector2(-60, -2), Vector2(30, 30), Vector2(-14, 10)]
	for i in anchors.size() + 6:
		var a: Vector2 = anchors[i % anchors.size()]
		var b := Butterfly.new()
		b.setup(ground(a.x + randf_range(-4, 4), a.y + randf_range(-4, 4)), cols[i % cols.size()])
		add_child(b)
		butterflies.append(b)

func nearest_butterfly(p: Vector3, max_d: float) -> Node3D:
	var best: Node3D = null
	var bd := max_d
	for b in butterflies:
		var d: float = b.global_position.distance_to(p)
		if d < bd:
			bd = d
			best = b
	return best

func _build_locations() -> void:
	for l in LOCATIONS:
		var trig := LocationTrigger.new()
		trig.setup(l[0], l[1], l[2])
		trig.position = at(l[0]) if LOC.has(l[0]) else Vector3.ZERO
		add_child(trig)

func _build_npcs() -> void:
	var rowan := NPC.new()
	rowan.setup("rowan", "Elder Rowan", {"skin": "c98e66", "hair_style": "short", "hair_color": "d9d4cf", "top": "vest", "top_color": "6c5aa8", "pants_color": "4a3a2a", "hat": "none", "backpack": "none", "shoes_color": "3b2a20"}, _rowan_lines)
	rowan.position = at("rowan")
	rowan.rotation.y = PI * 0.15
	add_child(rowan)
	_add_obstacle(rowan.position, 0.8)
	var hazel := NPC.new()
	hazel.setup("hazel", "Miller Hazel", {"skin": "f6d7bf", "hair_style": "bun", "hair_color": "c98b4a", "top": "tunic", "top_color": "e8b64c", "pants_color": "6b4423", "hat": "headband", "backpack": "none", "shoes_color": "3b2a20"}, func() -> Array:
		if not GameState.is_discovered("sunfox"):
			return ["The wind's lovely up here. Some days a golden fox races the windmill blades round and round!", "Sunfox, they call it. Quick as a sunbeam, but it always comes back to sniff my flour sacks."]
		return ["Did you know Sunfox's tail can light the old lanterns? The village kept them burning, once.", "If you light them again, I'd bake you something nice."])
	hazel.position = at("windmill") + Vector3(-4, 0, 3)
	hazel.position.y = terrain.height(hazel.position.x, hazel.position.z)
	add_child(hazel)
	var pip := NPC.new()
	pip.setup("pip", "Pip", {"skin": "9c6644", "hair_style": "curly", "hair_color": "1c1c22", "top": "tunic", "top_color": "2f7d86", "pants_color": "3b4a6b", "hat": "none", "backpack": "satchel", "shoes_color": "c4583f"}, func() -> Array:
		if GameState.sanctuary_stage("bridge") < 1:
			return ["The bridge broke in the big storm. Now I have to wade across and my socks get SO wet.", "Mum says you need stone and wood to fix it. Lots of stone is down by the river!"]
		return ["You fixed the bridge! Now I can visit the Mossbuns every day.", "There's a sleepy rock creature down the river. It snores like a kettle."])
	pip.position = ground(-25, 8)
	pip.rotation.y = -PI * 0.5
	add_child(pip)
	var tilda := NPC.new()
	tilda.setup("tilda", "Tilda (Grand Market)", {"skin": "6e4630", "hair_style": "braids", "hair_color": "3b2a20", "top": "explorer_jacket", "top_color": "c4583f", "pants_color": "3b4a6b", "hat": "explorer_hat", "backpack": "none", "shoes_color": "6b4423"}, func() -> Array:
		Events.request_panel.emit("market", {})
		return [])
	tilda.prompt = "Visit the Grand Market"
	tilda.position = at("market") + Vector3(0, 0, 1.6)
	tilda.rotation.y = PI
	add_child(tilda)

func _rowan_lines() -> Array:
	if Quests.is_active("q_main_01"):
		return []  # quest end dialogue plays instead
	if Quests.is_active("q_main_02"):
		return ["The Whispering Woods are across the river, to the west. Follow the path past the bridge.", "Walk up gently — Mythlings can tell when someone means well."]
	if Quests.is_active("q_main_05"):
		return ["Fallen branches and river stones — that's all the old stones need. Look near the woods and the riverbank."]
	if not Quests.is_completed("q_main_06"):
		return ["The Ancient Oak is east of the village, up the gentle hill. It's been waiting a long time."]
	return ["You've a good heart, Keeper. The meadow feels brighter already.", "Remember — no Mythling should be rushed. Friendship grows at its own pace."]

# ------------------------------------------------------------------ quest marker
func _build_quest_marker() -> void:
	_quest_marker = Node3D.new()
	K.add(_quest_marker, K.cyl(0.0, 0.35, 0.7, 4), K.glow(Color("ffd36a"), 1.5), Vector3(0, 0, 0), Vector3(180, 45, 0))
	K.add(_quest_marker, K.cyl(0.0, 0.35, 0.35, 4), K.glow(Color("ffd36a"), 1.5), Vector3(0, 0.52, 0), Vector3(0, 45, 0))
	add_child(_quest_marker)

func quest_target_position() -> Vector3:
	var q := Quests.tracked()
	if q == "":
		return Vector3.INF
	var qd: QuestData = DB.quest(q)
	var key := qd.map_marker
	# Pick a sensible target for objectives without an explicit marker.
	if q == "q_main_05" and not GameState.has_items({"wood": 5, "stone": 4}):
		var p := player.global_position if player else Vector3.ZERO
		var best := Vector3.INF
		for n in get_children():
			if n is ResourceNode and n.enabled and n.item_id in ["wood", "stone"]:
				var need: int = 5 if n.item_id == "wood" else 4
				if GameState.item_count(n.item_id) >= need:
					continue
				if best == Vector3.INF or n.global_position.distance_to(p) < best.distance_to(p):
					best = n.global_position
		return best
	if key == "" or not LOC.has(key):
		if creatures.has(key):
			return creatures[key].global_position
		return Vector3.INF
	if creatures.has(key) and is_instance_valid(creatures[key]):
		return creatures[key].global_position
	return at(key)

func _process(delta: float) -> void:
	if _windmill_blades:
		_windmill_blades.rotate_object_local(Vector3(0, 0, 1), delta * 0.5)
	if _quest_marker:
		var tp := quest_target_position()
		_quest_marker.visible = tp != Vector3.INF and player != null and player.global_position.distance_to(tp) > 6.0
		if _quest_marker.visible:
			_quest_marker.global_position = tp + Vector3(0, 3.6 + sin(Time.get_ticks_msec() * 0.003) * 0.25, 0)
			_quest_marker.rotate_y(delta * 1.5)

func _on_night(n: bool) -> void:
	for l in _night_lights:
		if l is OmniLight3D:
			l.light_energy = 1.4 if n else 0.0
			l.visible = n and GameState.setting("graphics") != "low"
		elif l is Node3D:
			l.visible = n

# ------------------------------------------------------------------ creatures
func habitat_slots() -> int:
	return [0, 2, 4, 6][clampi(GameState.sanctuary_stage("oak"), 0, 3)]

func refresh_creatures() -> void:
	var habitat: Array = GameState.data.flags.get("habitat", [])
	var comp := GameState.companion()
	var wanted := {}
	for id in ["mossbun", "cloverling", "pebblit", "sunfox", "dewdrop", "bloomtail", "verdantus"]:
		var d: CreatureData = DB.creature(id)
		if d == null:
			continue
		var mode := Creature.Mode.WILD
		var home := at(id) if LOC.has(id) else Vector3.ZERO
		if id == "bloomtail" and GameState.sanctuary_stage("oak") < 2 and not GameState.is_discovered(id):
			continue
		if id == "bloomtail":
			home = at("ancient_oak") + Vector3(-5, 0, 7)
		if id == "verdantus" and GameState.sanctuary_stage("shrine") < 1:
			continue
		if id == comp:
			mode = Creature.Mode.COMPANION
		elif id in habitat:
			mode = Creature.Mode.HABITAT
			var a := float(habitat.find(id)) * 1.1
			home = at("ancient_oak") + Vector3(cos(a) * 7.0, 0, sin(a) * 7.0)
		wanted[id] = [mode, home]
	for id in creatures.keys():
		if not wanted.has(id):
			creatures[id].queue_free()
			creatures.erase(id)
	for id in wanted:
		var mode: int = wanted[id][0]
		var home: Vector3 = wanted[id][1]
		var c: Creature = creatures.get(id)
		if c == null:
			c = Creature.new()
			c.setup(DB.creature(id), mode, home)
			add_child(c)
			creatures[id] = c
			if mode == Creature.Mode.COMPANION and player:
				c.global_position = player.global_position + Vector3(1.5, 0, 1.5)
		elif c.mode != Creature.Mode.MOUNT:
			if c.mode != mode and mode != Creature.Mode.COMPANION:
				c.global_position = home
			c.mode = mode
			c.home = home
		if id == "verdantus" and mode == Creature.Mode.WILD:
			c.home_radius = 10.0

func companion_creature() -> Creature:
	return creatures.get(GameState.companion())
