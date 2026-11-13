class_name EmberfallLevel
extends MeadowLevel
## Emberfall Highlands: ash plains, lava river, Ember Village, Dragonstone Ridge,
## Ashen Caverns, Cinder Lake and the Forgotten Forge. Reuses the meadow level's
## systems (creatures, quests, interactables) with its own layout and builders.

const ELOC := {
	"spawn": Vector2(-6, 14),
	"brenna": Vector2(-3, 4),
	"oro": Vector2(8, -10),
	"ember_village": Vector2(0, 0),
	"ashen_caverns": Vector2(-20, -72),
	"dragonstone_ridge": Vector2(-60, -14),
	"cinder_lake": Vector2(-42, 58),
	"forgotten_forge": Vector2(74, -40),
	"forge_seal": Vector2(74, -40),
	"cindercub": Vector2(-16, 24),
	"magmole": Vector2(-14, -66),
	"ashwing": Vector2(-52, -6),
	"lava_bridge": Vector2(0, 15),
	"obsidian_deep": Vector2(-56, -70),
	"glass_record_2": Vector2(-68, -78),
}

const ELOCATIONS := [
	["ember_village", "Ember Village", 20.0],
	["ashen_caverns", "Ashen Caverns", 10.0],
	["dragonstone_ridge", "Dragonstone Ridge", 14.0],
	["cinder_lake", "Cinder Lake", 18.0],
	["forgotten_forge", "The Forgotten Forge", 13.0],
	["obsidian_deep", "The Obsidian Deep", 7.0],
]

var _crusts: Array = []
var et: EmberTerrain

func _init() -> void:
	et = EmberTerrain.new()
	terrain = et
	region_id = "emberfall"
	loc = ELOC
	locations = ELOCATIONS
	native = ["cindercub", "magmole", "ashwing"]
	sanctuary_key = "forgotten_forge"
	music = "music_meadow"

func near_gap(p: Vector3) -> bool:
	return absf(p.x - EmberTerrain.lava_x(p.z)) < 14.0 and p.z > MeadowTerrain.CLIFF_Z

func build() -> void:
	var bz: float = EmberTerrain.lava_x(ELOC.lava_bridge.y)
	ELOC_BRIDGE_X = bz
	terrain.paths = [
		[Vector2(0, 0), Vector2(14, 10), Vector2(bz - 9, 15)],
		[Vector2(bz + 9, 15), Vector2(58, -6), Vector2(70, -28), Vector2(74, -40)],
		[Vector2(0, 0), Vector2(-20, -20), Vector2(-20, -66)],
		[Vector2(0, 0), Vector2(-26, -6), Vector2(-50, -10)],
		[Vector2(0, 0), Vector2(-20, 30), Vector2(-36, 46)],
	]
	sky = SkyCycle.new()
	sky.tint = "ember"
	add_child(sky)
	sky.night_changed.connect(_on_night)
	static_body = StaticBody3D.new()
	static_body.collision_layer = 1
	add_child(static_body)
	_build_terrain()
	_build_lava()
	_build_lake()
	_build_ember_scenery()
	_build_ember_village()
	_build_ember_trees()
	_build_lava_bridge()
	_build_forge()
	_build_ridge_steps()
	_build_caverns()
	_build_obsidian_deep()
	_build_ember_resources()
	_build_ember_targets()
	_build_ember_vegetation()
	_build_locations()
	_build_ember_npcs()
	_build_quest_marker()
	_decor_root = Node3D.new()
	add_child(_decor_root)
	refresh_creatures()
	Events.companion_changed.connect(func(_c): refresh_creatures())
	Events.creature_discovered.connect(func(_c): refresh_creatures())
	var ash := FX.motes(Color("bfb0a0"), 60, Vector3(60, 10, 60), 0.05)
	ash.gravity = Vector3(0.1, -0.2, 0.05)
	ash.position = Vector3(0, 12, 0)
	add_child(ash)
	_on_night(sky.is_night())
	_add_weather()

var ELOC_BRIDGE_X := 0.0

func _build_lava() -> void:
	var mat := ShaderMaterial.new()
	mat.shader = load("res://shaders/lava.gdshader")
	mat.set_shader_parameter("flow_noise", _noise_tex(0.03))
	var st := SurfaceTool.new()
	st.begin(Mesh.PRIMITIVE_TRIANGLES)
	var z0 := MeadowTerrain.CLIFF_Z + 1.0
	var z1 := 112.0
	var steps := int((z1 - z0) / 2.0)
	for i in steps + 1:
		var z := z0 + (z1 - z0) * i / steps
		var cx := EmberTerrain.lava_x(z)
		for side in [0.0, 1.0]:
			st.set_uv(Vector2(side, z * 0.1))
			st.set_normal(Vector3.UP)
			st.add_vertex(Vector3(cx - 7.5 + side * 15.0, EmberTerrain.LAVA_Y, z))
	for i in steps:
		var a := i * 2
		st.add_index(a); st.add_index(a + 2); st.add_index(a + 1)
		st.add_index(a + 1); st.add_index(a + 2); st.add_index(a + 3)
	var mi := MeshInstance3D.new()
	mi.mesh = st.commit()
	mi.material_override = mat
	mi.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
	add_child(mi)
	# A lava fall pours from the cliff, and heat shimmer hangs over the river.
	var fx := EmberTerrain.lava_x(MeadowTerrain.CLIFF_Z)
	var fall := MeshInstance3D.new()
	var q := QuadMesh.new()
	q.size = Vector2(8.0, MeadowTerrain.HIGH_Y - EmberTerrain.LAVA_Y + 1.0)
	fall.mesh = q
	fall.material_override = mat
	fall.position = Vector3(fx, (MeadowTerrain.HIGH_Y + EmberTerrain.LAVA_Y) * 0.5, MeadowTerrain.CLIFF_Z + 1.2)
	fall.rotation_degrees.x = -12
	add_child(fall)
	for z in [-50.0, -10.0, 30.0, 70.0]:
		var l := OmniLight3D.new()
		l.light_color = Color("ff7a2a")
		l.omni_range = 16.0
		l.light_energy = 1.4
		l.position = Vector3(EmberTerrain.lava_x(z), 1.5, z)
		add_child(l)
		var sparks := FX.motes(Color("ffb347"), 16, Vector3(4, 0.5, 8), 0.05)
		sparks.position = Vector3(EmberTerrain.lava_x(z), 0.2, z)
		sparks.gravity = Vector3(0, 0.6, 0)
		add_child(sparks)

func _build_lake() -> void:
	var mat := ShaderMaterial.new()
	mat.shader = load("res://shaders/water.gdshader")
	mat.set_shader_parameter("ripple_noise", _noise_tex(0.02))
	mat.set_shader_parameter("is_pool", true)
	mat.set_shader_parameter("shallow_color", Color("4a7a7a"))
	mat.set_shader_parameter("deep_color", Color("1e3a40"))
	var pool := MeshInstance3D.new()
	var disc := CylinderMesh.new()
	disc.top_radius = 18.0
	disc.bottom_radius = 18.0
	disc.height = 0.02
	disc.radial_segments = 40
	pool.mesh = disc
	pool.material_override = mat
	pool.position = Vector3(EmberTerrain.LAKE.x, EmberTerrain.LAKE_Y + 0.01, EmberTerrain.LAKE.y)
	add_child(pool)
	var steam := FX.motes(Color(1, 1, 1), 30, Vector3(12, 0.5, 12), 0.3)
	steam.position = pool.position + Vector3(0, 0.6, 0)
	steam.gravity = Vector3(0, 0.4, 0)
	add_child(steam)

func _build_ember_scenery() -> void:
	var rng := RandomNumberGenerator.new()
	rng.seed = 8
	var v := Props.node(Props.volcano(), "solid", Vector3(-30, -10, -230), 0.3, 1.4)
	v.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
	add_child(v)
	var smoke := FX.motes(Color(0.35, 0.32, 0.3), 30, Vector3(18, 4, 18), 3.0)
	smoke.position = Vector3(-30, 95, -230)
	smoke.gravity = Vector3(0.6, 1.2, 0)
	smoke.lifetime = 9.0
	add_child(smoke)
	for i in 18:
		var a := TAU * i / 18.0 + rng.randf() * 0.1
		if absf(a - 4.6) < 0.4:
			continue
		var d := rng.randf_range(190.0, 250.0)
		var mi := Props.node(Props.mountain(i % 6), "solid", Vector3(cos(a) * d, -6.0, sin(a) * d), rng.randf() * TAU, rng.randf_range(0.9, 1.3))
		var mm := StandardMaterial3D.new()
		mm.vertex_color_use_as_albedo = true
		mm.albedo_color = Color("8a6a5a")
		mi.material_override = mm
		mi.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
		add_child(mi)
	var spires: Array = []
	for i in 34:
		var x := rng.randf_range(-100, -36)
		var z := rng.randf_range(-70, 20)
		if terrain.path_distance(x, z) < 4.0 or Vector2(x, z).distance_to(ELOC.dragonstone_ridge) < 7.0:
			continue
		spires.append(Transform3D(Basis(Vector3.UP, rng.randf() * TAU).scaled(Vector3.ONE * rng.randf_range(0.7, 1.5)), ground(x, z) - Vector3(0, 0.5, 0)))
		_add_obstacle(ground(x, z), 1.4)
	for i in 50:
		var a := rng.randf() * TAU
		var d := rng.randf_range(112.0, 140.0)
		spires.append(Transform3D(Basis(Vector3.UP, rng.randf() * TAU).scaled(Vector3.ONE * rng.randf_range(1.2, 2.2)), ground(cos(a) * d, sin(a) * d)))
	Vegetation.instances(self, Props.spire(0), spires, "solid", true)

func _build_ember_village() -> void:
	var angles := [-60.0, -110.0, 160.0, 100.0, 130.0]
	for i in angles.size():
		var a := deg_to_rad(angles[i])
		var p := Vector3(cos(a) * 17.0, 0, sin(a) * 17.0)
		p.y = terrain.height(p.x, p.z) - 0.2
		var face := atan2(p.x, p.z)
		add_child(Props.node(Props.house(10 + i), "solid", p, face))
		_box_collider(p + Vector3(0, 2.0, 0), Vector3(5.6, 4.0, 4.8), face)
		_add_obstacle(p, 3.6)
		var l := OmniLight3D.new()
		l.light_color = Color("ffa860")
		l.omni_range = 7.0
		l.light_energy = 0.0
		l.position = p + Basis(Vector3.UP, face) * Vector3(1.2, 2.2, -3.0)
		add_child(l)
		_night_lights.append(l)
	add_child(Props.node(Props.brazier(true), "solid", at("ember_village")))
	_cyl_collider(at("ember_village"), 0.8, 1.6)
	_add_obstacle(at("ember_village"), 1.2)
	var fire := OmniLight3D.new()
	fire.light_color = Color("ff8a3a")
	fire.omni_range = 12.0
	fire.light_energy = 1.6
	fire.position = at("ember_village", 2.4)
	add_child(fire)
	for d in [[Props.barrel(), -8, 12], [Props.crates(), 10, -12], [Props.cart(), -14, -5], [Props.barrel(), 12, 8]]:
		_detail(d[0], d[1], d[2], randf() * TAU, 1.0, "solid", 0.6)
	_detail(Props.signpost(), 6, 6, 0.6, 1.0, "solid", 0.2)

func _ember_tree_ok(x: float, z: float) -> bool:
	if et.is_water(x, z) or et.is_lava(x, z) or absf(x - EmberTerrain.lava_x(z)) < 11.0:
		return false
	if terrain.path_distance(x, z) < 4.0 or Vector2(x, z).length() < 24.0:
		return false
	for k in ["forgotten_forge", "cinder_lake", "dragonstone_ridge"]:
		if Vector2(x, z).distance_to(ELOC[k]) < 18.0:
			return false
	return terrain.normal(x, z).y > 0.8 and z > MeadowTerrain.CLIFF_Z + 5.0 and Vector2(x, z).length() < 104.0

func _build_ember_trees() -> void:
	var rng := RandomNumberGenerator.new()
	rng.seed = 31
	var sets := {3: [], 4: [], "dead": []}
	for i in 900:
		var x := rng.randf_range(-100, 100)
		var z := rng.randf_range(-74, 100)
		if not _ember_tree_ok(x, z):
			continue
		var s := rng.randf_range(0.8, 1.3)
		var key = [3, 4, "dead"][rng.randi() % 3]
		sets[key].append(Transform3D(Basis(Vector3.UP, rng.randf() * TAU).scaled(Vector3.ONE * s), ground(x, z) - Vector3(0, 0.2, 0)))
		_cyl_collider(ground(x, z), 0.4 * s, 4.0)
		_add_obstacle(ground(x, z), 0.8 * s)
		if sets[3].size() + sets[4].size() + sets["dead"].size() > 70:
			break
	Vegetation.instances(self, Props.broadleaf_tree(3), sets[3], "foliage", true)
	Vegetation.instances(self, Props.broadleaf_tree(4), sets[4], "foliage", true)
	Vegetation.instances(self, Props.dead_tree(0), sets["dead"], "solid", true)

func _build_lava_bridge() -> void:
	# A permanent stone bridge: abilities are a shortcut, never the only way across.
	var p := Vector3(ELOC_BRIDGE_X, -0.3, ELOC.lava_bridge.y)
	var root := Node3D.new()
	root.position = p
	root.add_child(Props.node(Props.bridge(true), "solid"))
	add_child(root)
	_bridge_collision(root, true)

func _build_forge() -> void:
	var c := at("forgotten_forge", -0.1)
	add_child(Props.node(Props.forge_ruins(), "solid", c))
	for k in 10:
		if k == 7 or k == 8:
			continue
		var a := TAU * k / 10.0
		_box_collider(c + Vector3(cos(a) * 10.0, 2.0, sin(a) * 10.0), Vector3(3.4, 4.0, 0.9), -a + PI * 0.5)
	_box_collider(c + Vector3(0, 0.9, 0), Vector3(2.2, 1.8, 0.9))
	# Three braziers: lit by any fire ability (Cindercub is the free way).
	var lit_count := func() -> int:
		var n := 0
		for i in 3:
			if GameState.flag("ab_forge_brazier_%d" % i):
				n += 1
		return n
	for i in 3:
		var a := PI * 0.25 + i * PI * 0.5
		var bp := c + Vector3(cos(a) * 6.0, 0, sin(a) * 6.0)
		bp.y = terrain.height(bp.x, bp.z)
		var before := Props.node(Props.brazier(false), "solid")
		var after := Node3D.new()
		after.add_child(Props.node(Props.brazier(true), "solid"))
		var l := OmniLight3D.new()
		l.light_color = Color("ff8a3a")
		l.omni_range = 9.0
		l.light_energy = 1.4
		l.position.y = 2.0
		after.add_child(l)
		var t := AbilityTarget.new()
		t.setup("volcanic_structure", "forge_brazier_%d" % i, before, after, {"items": {"emberstone": 2}})
		t.position = bp
		add_child(t)
		_cyl_collider(bp, 0.6, 1.6)
	# The seal: an earth ability can crack it only once the braziers have heated it.
	var gap_a := TAU * 7.5 / 10.0
	var sp := c + Vector3(cos(gap_a) * 10.0, 0, sin(gap_a) * 10.0)
	sp.y = terrain.height(sp.x, sp.z) - 0.1
	var seal_body := StaticBody3D.new()
	var scs := CollisionShape3D.new()
	var sb := BoxShape3D.new()
	sb.size = Vector3(6.6, 5.0, 1.2)
	scs.shape = sb
	scs.position = Vector3(0, 2.5, 0)
	seal_body.add_child(scs)
	var before_seal := Props.node(Props.forge_seal(false), "solid")
	before_seal.add_child(seal_body)
	var after_seal := Props.node(Props.forge_seal(true), "solid")
	var seal := AbilityTarget.new()
	seal.setup("forge_seal", "forge_seal", before_seal, after_seal, {"xp": 120, "crystals": 10})
	seal.blocked_by = func() -> String:
		var n: int = lit_count.call()
		return "" if n >= 3 else "The seal is cold stone (%d/3 braziers lit). Light the forge braziers with a fire ability first." % n
	seal.on_activate = func(_t):
		seal_body.collision_layer = 0
	seal.position = sp
	seal.rotation.y = -gap_a + PI * 0.5
	add_child(seal)
	if seal.done or GameState.flag("ab_forge_seal"):
		seal_body.collision_layer = 0
	var vault := sp + (sp - c).normalized() * 4.0
	vault.y = terrain.height(vault.x, vault.z)
	_chest(vault, "forge_vault", {"crystals": 20, "gold": 200, "items": {"emberstone": 5}}, "Forge Vault")
	_add_obstacle(c, 10.5)

func _build_ridge_steps() -> void:
	# Warm stones rise into steps up Dragonstone Ridge when heated (Hearth Paw).
	var top := at("dragonstone_ridge")
	var start := ground(-44, -4)
	for i in 5:
		var t := float(i + 1) / 6.0
		var p := start.lerp(top, t)
		p.y = terrain.height(p.x, p.z) - 0.2 + i * 0.6
		var before := Props.node(Props.warm_stone(false), "solid")
		var after := Node3D.new()
		after.add_child(Props.node(Props.warm_stone(true), "solid"))
		var body := StaticBody3D.new()
		var cs := CollisionShape3D.new()
		var cy := CylinderShape3D.new()
		cy.radius = 1.35
		cy.height = 1.6
		cs.shape = cy
		cs.position.y = 0.8
		body.add_child(cs)
		body.collision_layer = 0
		after.add_child(body)
		var t2 := AbilityTarget.new()
		t2.setup("warm_stone", "ridge_step_%d" % i, before, after)
		t2.on_activate = func(_t): body.collision_layer = 1
		t2.position = p
		add_child(t2)
		if GameState.flag("ab_ridge_step_%d" % i):
			body.collision_layer = 1
	_chest(top + Vector3(0, 0.3, 0), "ridge_lookout", {"crystals": 12, "star_gems": 20}, "Ridge Lookout")
	# The Ember Tablet: Emberfall's history, part of Cindermaw's Awakening.
	var tab := LoreStone.new()
	tab.setup("ember_tablet", "the Ember Tablet", ["*Letters cut into black glass, still warm to the touch:*", "\"The cub that guards the hearth becomes the beast that guards the forge.\"", "\"And the beast that guards the forge, if it is loved, becomes the one who guards the sky.\""])
	K.add(tab, K.box(Vector3(1.0, 1.4, 0.3)), K.mat(Color("2a2422"), 0.4), Vector3(0, 0.7, 0), Vector3(0, 0, -3))
	K.add(tab, K.box(Vector3(0.7, 0.9, 0.04)), K.glow(Color("ff8a3a"), 1.2), Vector3(0, 0.8, -0.17))
	tab.position = top + Vector3(1.8, 0, 1.0)
	add_child(tab)

# ------------------------------------------------------------------ The Obsidian Deep (Magmole's Awakening)
const GLASS_LORE := {
	"glass_record_1": ["the First Glass Record", ["*A slab of black glass, written on while it was still soft:*", "\"Before the mountain there was a sea of glass, and the sea remembered everything that walked on it.\"", "\"When the fire came the glass broke into columns, and small diggers carried the pieces so the memory would not be lost.\""]],
	"glass_record_2": ["the Second Glass Record", ["*The letters here are cut deeper, as if by something very large:*", "\"The guardian of the deep is only a digger that was trusted long enough to stop holding itself together.\"", "\"Its plates are not armour. They are the deep letting go.\"", "\"Read this to your friend. The glass remembers being read to.\""]],
}

func _build_obsidian_deep() -> void:
	var c := at("obsidian_deep")
	var root := Node3D.new()
	root.name = "ObsidianDeep"
	add_child(root)
	var glass := Color("17141c"); var facet := Color("2a2434"); var facet_l := Color("3d3550")
	var basalt := Color("36302f"); var seam := Color("cdbcff")
	# A gallery of standing hexagonal columns, open only on the east side.
	var m := MeshMerger.new()
	for i in 13:
		var ang := -2.4 + i * (4.8 / 12.0) + PI  # skips the east gap
		var p := Vector3(cos(ang) * 8.5, 0, sin(ang) * 8.5)
		p.y = terrain.height(c.x + p.x, c.z + p.z) - c.y - 0.5  # follow the slope
		var h := 5.0 + float(i % 4) * 1.3
		m.put(K.cyl(1.1, 1.25, h, 6), p + Vector3(0, h * 0.5, 0), basalt if i % 2 else facet, Vector3(0, 24 * i, 2.5 - float(i % 3) * 2.0))
		m.put(K.box(Vector3(0.1, h * 0.7, 0.16)), p + Vector3(1.0, h * 0.5 + 0.4, 0), seam, Vector3(0, 24 * i, 0))
		_cyl_collider(c + p, 1.3, h)
	# The great standing column at the centre, lit from inside.
	for k in 3:
		var off := Vector3(cos(k * 2.1) * 1.3, 0, sin(k * 2.1) * 1.3)
		var ch := 7.5 - float(k) * 1.6
		m.put(K.cyl(1.0 - float(k) * 0.18, 1.15 - float(k) * 0.18, ch, 6), off + Vector3(0, ch * 0.5 - 0.3, 0), glass, Vector3(0, 18 * k, 0))
		m.put(K.box(Vector3(0.12, ch * 0.75, 0.2)), off + Vector3(0.9 - float(k) * 0.16, ch * 0.5, 0), seam, Vector3(0, 18 * k, 0))
	root.add_child(Props.node(m.commit(), "solid", c))
	_cyl_collider(c, 2.4, 7.0)
	var lamp := OmniLight3D.new()
	lamp.light_color = seam
	lamp.omni_range = 14.0
	lamp.light_energy = 1.2
	lamp.position = c + Vector3(0, 4.5, 0)
	root.add_child(lamp)
	var motes := FX.motes(seam, 24, Vector3(7, 3, 7), 0.07)
	motes.position = c + Vector3(0, 2.0, 0)
	root.add_child(motes)
	# A pane of glass walls the only gap: Magmole's Burrow Break opens it.
	var gap := c + Vector3(8.5, 0, 0)
	var wall := Node3D.new()
	var wm := MeshMerger.new()
	for k in 5:
		var z := -2.4 + k * 1.2
		wm.put(K.box(Vector3(0.5, 5.0 + float(k % 2) * 0.8, 1.2)), Vector3(0, 2.3, z), glass if k % 2 else facet, Vector3(0, 0, 3.0 - float(k)))
		wm.put(K.box(Vector3(0.1, 3.4, 0.14)), Vector3(-0.3, 2.3, z), seam)
	wall.add_child(Props.node(wm.commit(), "solid"))
	var broken := Node3D.new()
	var bm := MeshMerger.new()
	for k in 5:
		var z2 := -2.4 + k * 1.2
		bm.put(K.box(Vector3(0.5, 1.1, 1.1)), Vector3(0, 0.45, z2), facet, Vector3(0, 0, 8.0 - float(k) * 3.0))
	for k in 4:
		bm.put(K.cyl(0.0, 0.3, 0.8, 6), Vector3(0.2, 0.4, -1.8 + k * 1.2), glass, Vector3(14 - k * 8, 20 * k, 0))
	broken.add_child(Props.node(bm.commit(), "solid"))
	var gate := StaticBody3D.new()
	var gcs := CollisionShape3D.new()
	var gbx := BoxShape3D.new()
	gbx.size = Vector3(1.2, 5.0, 6.4)
	gcs.shape = gbx
	gcs.position = Vector3(0, 2.5, 0)
	gate.add_child(gcs)
	wall.add_child(gate)
	var t := AbilityTarget.new()
	t.setup("cracked_rock", "obsidian_wall", wall, broken, {"xp": 50, "items": {"crystal": 2}})
	t.position = gap
	t.position.y = terrain.height(t.position.x, t.position.z)
	t.on_activate = func(_t):
		_enable_collision(gate, false)
		Events.toast.emit("The glass gives way", "A gallery of standing columns opens up behind the wall.", "fire")
	add_child(t)
	_enable_collision(gate, not GameState.flag("ab_obsidian_wall"))
	# The column Magmole hollows out (its personal quest step).
	var bed := LoreStone.new()
	bed.setup("basalt_core", "the hollow column", ["*Magmole braces its claws against a cracked column and digs out its core in one long, patient spiral.*", "*The column rings like a struck bell. Magmole sits inside the hollow it made and will not come out for a while.*", "*Something has settled in it. Magmole is ready to Awaken whenever you both are.*"], "Let Magmole hollow out")
	bed.needs = func() -> String:
		if GameState.companion() != "magmole":
			return "Only a Magmole companion can hollow this column. Bring Magmole (in its First Form) with you."
		return ""
	K.add(bed, K.cyl(0.95, 1.05, 2.2, 6), K.mat(basalt, 0.5), Vector3(0, 1.0, 0), Vector3(0, 12, 2))
	K.add(bed, K.box(Vector3(0.12, 1.5, 0.18)), K.glow(Color("ff6a1f"), 1.8), Vector3(0.85, 1.1, 0))
	bed.position = c + Vector3(3.4, 0, 3.0)
	bed.position.y = terrain.height(bed.position.x, bed.position.z)
	add_child(bed)
	_cyl_collider(bed.position, 1.1, 2.2)
	# The two Glass Records: the deep's history, needed for Obsidra's Awakening.
	var spots := {"glass_record_1": c + Vector3(-1.0, 0, 4.6), "glass_record_2": at("glass_record_2")}
	for sid in spots:
		var st := LoreStone.new()
		st.setup(sid, GLASS_LORE[sid][0], GLASS_LORE[sid][1])
		K.add(st, K.box(Vector3(1.3, 1.9, 0.4)), K.flat(glass, 0.35), Vector3(0, 0.95, 0), Vector3(0, 0, 5))
		K.add(st, K.box(Vector3(0.85, 1.2, 0.06)), K.glow(seam, 1.6), Vector3(0, 1.1, -0.22))
		K.add(st, K.cyl(0.6, 0.75, 0.3, 6), K.flat(facet_l, 0.4), Vector3(0, 0.1, 0), Vector3(0, 20, 0))
		st.position = spots[sid]
		st.position.y = terrain.height(st.position.x, st.position.z)
		add_child(st)
		_cyl_collider(st.position, 0.8, 2.0)
	# The deep gallery around the second record: a stand of smaller columns.
	var gm := MeshMerger.new()
	var g2: Vector3 = at("glass_record_2")
	for k in 9:
		var a2 := k * TAU / 9.0 + 0.4
		var rr := 4.0 + float(k % 3) * 1.6
		var hh := 3.0 + float(k % 4) * 1.1
		var gp := Vector3(cos(a2) * rr, 0, sin(a2) * rr)
		gp.y = terrain.height(g2.x + gp.x, g2.z + gp.z) - g2.y - 0.4
		gm.put(K.cyl(0.8, 0.95, hh, 6), gp + Vector3(0, hh * 0.5, 0), basalt if k % 2 else glass, Vector3(0, 20 * k, 3.0 - float(k % 3) * 2.0))
		_cyl_collider(g2 + gp, 0.95, hh)
	root.add_child(Props.node(gm.commit(), "solid", g2))
	for k in 3:
		var p3 := c + Vector3(-5.0 + k * 2.4, 0, -4.4 - float(k % 2) * 1.2)
		p3.y = terrain.height(p3.x, p3.z)
		_resource("emberstone", p3, Props.ember_rock(), "solid", Vector2i(1, 2), 220.0)
	var cp := c + Vector3(-2.2, 0, -2.0)
	cp.y = terrain.height(cp.x, cp.z) + 0.3
	_chest(cp, "obsidian_deep_chest", {"crystals": 15, "star_gems": 25}, "Obsidian Deep")

func _build_caverns() -> void:
	var cp := at("ashen_caverns")
	add_child(Props.node(Props.cave_mouth(), "solid", cp + Vector3(0, -0.3, -2.0), PI))
	for k in 3:
		var p := cp + Vector3(-1.6 + k * 1.6, 0, -2.5 - (k % 2) * 0.6)
		p.y = terrain.height(p.x, p.z)
		_resource("emberstone", p, Props.ember_rock(), "solid", Vector2i(1, 2), 240.0)
	var boulder := Props.node(Props.cracked_boulder(), "solid", cp + Vector3(6, -0.4, 2.0))
	var t := AbilityTarget.new()
	t.setup("cracked_rock", "cavern_boulder", boulder, null, {"items": {"crystal": 2}})
	add_child(t)

func _build_ember_resources() -> void:
	for v in [Vector2(-10, -30), Vector2(20, -40), Vector2(-30, 30), Vector2(10, 40), Vector2(-60, 20), Vector2(56, 20), Vector2(84, -20), Vector2(-70, -40)]:
		_resource("emberstone", ground(v.x, v.y), Props.ember_rock(), "solid", Vector2i(1, 2), 150.0)
	for v in [Vector2(-24, 10), Vector2(16, -24), Vector2(-40, -30), Vector2(30, 60), Vector2(64, -10), Vector2(-30, 50)]:
		_resource("stone", ground(v.x, v.y), Props.stone_pile(), "solid", Vector2i(2, 3))
	for v in [Vector2(-34, 20), Vector2(22, 30), Vector2(-56, 36), Vector2(50, -50)]:
		_resource("wood", ground(v.x, v.y), Props.log_pile(), "solid", Vector2i(2, 3))
	for v in [Vector2(-30, 64), Vector2(-52, 52)]:
		_resource("dew_nectar", ground(v.x, v.y), Vegetation.flower_mesh(Color("ff8a3a")), "foliage", Vector2i(1, 1), 200.0).visual.scale = Vector3.ONE * 3.0

func _build_ember_targets() -> void:
	for i in 3:
		var v: Vector2 = [Vector2(-10, 8), Vector2(12, -6), Vector2(4, 16)][i]
		var p := ground(v.x, v.y)
		add_child(Props.node(Props.lamp_post(), "solid", p))
		var lit := Node3D.new()
		K.add(lit, K.sphere(0.2, 8, 4), K.glow(Color("ff8a3a"), 2.2), Vector3(0, 2.85, 0))
		var unlit := Node3D.new()
		K.add(unlit, K.sphere(0.18, 8, 4), K.mat(Color("3a3533")), Vector3(0, 2.85, 0))
		var t := AbilityTarget.new()
		t.setup("dark_lantern", "ember_lantern_%d" % i, unlit, lit, {"gold": 15})
		t.position = p
		add_child(t)
	for i in 4:
		var v: Vector2 = [Vector2(-36, 40), Vector2(-60, 30), Vector2(40, 70), Vector2(90, -50)][i]
		var after := Node3D.new()
		var rn := ResourceNode.new()
		rn.item_id = "glimmerroot"
		rn.once_flag = "gr_ember_%d" % i
		rn.respawn_time = -1.0
		var vis := Node3D.new()
		K.add(vis, K.sphere(0.18, 8, 4), K.glow(Color("ffb347"), 1.8), Vector3(0, 0.15, 0), Vector3.ZERO, Vector3(1, 0.6, 1))
		rn.visual = vis
		rn.add_child(vis)
		after.add_child(rn)
		var t := AbilityTarget.new()
		t.setup("hidden_plant", "ember_root_%d" % i, null, after)
		t.position = ground(v.x, v.y)
		add_child(t)

func _build_ember_vegetation() -> void:
	var veg := Node3D.new()
	add_child(veg)
	var t: EmberTerrain = et
	var ok := func(x: float, z: float) -> float:
		if Vector2(x, z).length() > 116.0 or t.is_water(x, z) or t.is_lava(x, z) or absf(x - EmberTerrain.lava_x(z)) < 8.0:
			return 0.0
		if Vector2(x, z).length() < 9.0 or t.path_distance(x, z) < 1.4 or t.normal(x, z).y < 0.75:
			return 0.0
		return 0.55
	Vegetation.scatter(veg, t, Rect2(-120, -150, 240, 260), 160, _ash_grass(), ok, 7, Color.WHITE, Color.WHITE)
	Vegetation.scatter(veg, t, Rect2(-120, -150, 240, 260), 14, Vegetation.flower_mesh(Color("ff6a3a")), ok, 8, Color.WHITE, Color.WHITE, 0.8, 1.3)

func _ash_grass() -> ArrayMesh:
	return Props.cached("ash_grass", func():
		var st := SurfaceTool.new()
		st.begin(Mesh.PRIMITIVE_TRIANGLES)
		for k in 4:
			var a := k * TAU / 4.0 + 0.3
			var dir := Vector3(cos(a), 0, sin(a))
			var side := Vector3(-dir.z, 0, dir.x) * 0.04
			var base := dir * 0.05
			var tip := dir * 0.2 + Vector3(0, 0.35 + (k % 2) * 0.1, 0)
			for vv in [[base - side, Color("4a3a2a")], [base + side, Color("4a3a2a")], [tip, Color("c8783a")]]:
				st.set_normal(Vector3.UP)
				st.set_color(vv[1])
				st.add_vertex(vv[0])
		var m := st.commit()
		m.set_meta("arrays", st.commit_to_arrays())
		return m)

func _build_ember_npcs() -> void:
	var brenna := NPC.new()
	brenna.setup("brenna", "Smith Brenna", {"skin": "9c6644", "hair_style": "bun", "hair_color": "b8463c", "top": "vest", "top_color": "c4583f", "pants_color": "3b2a20", "hat": "headband", "backpack": "none", "shoes_color": "3b2a20"}, func() -> Array:
		if Quests.is_active("e_main_01"):
			return []
		if not Quests.is_completed("e_main_03"):
			return ["The old forge east of the lava river has been sealed for a hundred years.", "Its braziers need fire, and its seal needs a strong paw to crack once it's hot. No single Mythling can do both, so bring two friends.", "The stone bridge crosses the lava. A Magmole can cool a path, too."]
		return ["The forge is breathing again! I can hear it from here.", "Mind the lava, Keeper. It's kinder than it looks, but not by much."])
	brenna.position = at("brenna")
	brenna.rotation.y = PI * 0.2
	add_child(brenna)
	_add_obstacle(brenna.position, 0.8)
	var oro := NPC.new()
	oro.setup("oro", "Ash-keeper Oro", {"skin": "6e4630", "hair_style": "short", "hair_color": "d9d4cf", "top": "tunic", "top_color": "3b4a6b", "pants_color": "4a3a2a", "hat": "none", "backpack": "lantern_pack", "shoes_color": "3b2a20"}, func() -> Array:
		return ["Warm stones climb Dragonstone Ridge, if something warm wakes them. Cindercubs love that job.", "Ashwings ride the updrafts up there. Keepers with an Ashwing barely fall at all."])
	oro.position = at("oro")
	add_child(oro)
	var back := NPC.new()
	back.setup("ferry", "Wayfarer Ilse", {"skin": "f6d7bf", "hair_style": "long", "hair_color": "e8cf8a", "top": "explorer_jacket", "top_color": "4f8a5b", "pants_color": "3b4a6b", "hat": "explorer_hat", "backpack": "rucksack", "shoes_color": "6b4423"}, func() -> Array:
		Events.request_panel.emit("map", {})
		return [])
	back.prompt = "Travel (World Map)"
	back.position = at("spawn") + Vector3(-3, 0, 2)
	add_child(back)

func spawn_crust(p: Player, duration: float) -> int:
	var fwd := -p.global_transform.basis.z
	fwd.y = 0
	fwd = fwd.normalized()
	var made := 0
	for i in 6:
		var pos := p.global_position + fwd * (1.5 + i * 2.6)
		if not et.is_lava(pos.x, pos.z) and absf(pos.x - EmberTerrain.lava_x(pos.z)) > 7.0:
			continue
		var plat := StaticBody3D.new()
		plat.collision_layer = 1
		var cs := CollisionShape3D.new()
		var cy := CylinderShape3D.new()
		cy.radius = 1.6
		cy.height = 0.6
		cs.shape = cy
		plat.add_child(cs)
		K.add(plat, K.cyl(1.6, 1.7, 0.6, 7), K.flat(Color("2b2524")))
		K.add(plat, K.torus(1.3, 1.45, 14), K.glow(Color("ff6a1f"), 1.2), Vector3(0, 0.31, 0), Vector3.ZERO, Vector3(1, 0.2, 1))
		add_child(plat)
		plat.global_position = Vector3(pos.x, EmberTerrain.LAVA_Y + 0.12, pos.z)
		plat.scale = Vector3(0.05, 1, 0.05)
		var tw := plat.create_tween()
		tw.tween_interval(i * 0.08)
		tw.tween_property(plat, "scale", Vector3.ONE, 0.35).set_trans(Tween.TRANS_BACK).set_ease(Tween.EASE_OUT)
		tw.tween_interval(duration)
		tw.tween_property(plat, "scale", Vector3(0.05, 1, 0.05), 0.6)
		tw.tween_callback(plat.queue_free)
		plat.add_to_group("lava_crust")
		made += 1
	return made
