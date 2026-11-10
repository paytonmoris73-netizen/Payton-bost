class_name EvolutionCinematic
extends Control
## Full-screen Awakening sequence (one per family style). Used live (after Evolution.evolve) and for
## replays from the Journal / Mythlings screen; it never changes game state itself.

signal finished

var viewer: ModelViewer
var _title: Label
var _sub: Label
var _card: PanelContainer
var _card_box: VBoxContainer
var _flash: ColorRect
var _from := ""
var _to := ""
var _busy := false

func _init() -> void:
	set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	mouse_filter = Control.MOUSE_FILTER_STOP
	visible = false
	process_mode = Node.PROCESS_MODE_ALWAYS

func _ready() -> void:
	theme = UITheme.get_theme()
	viewer = ModelViewer.new()
	viewer.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	viewer.auto_rotate = false
	add_child(viewer)
	_flash = ColorRect.new()
	_flash.color = Color(1, 1, 0.94, 0)
	_flash.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	_flash.mouse_filter = Control.MOUSE_FILTER_IGNORE
	add_child(_flash)
	_title = UIKit.label("", "Heading", 54, Color.WHITE)
	_title.add_theme_color_override("font_outline_color", Color(0.05, 0.1, 0.08, 0.8))
	_title.add_theme_constant_override("outline_size", 14)
	_title.anchor_right = 1.0
	_title.offset_top = 40
	_title.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	add_child(_title)
	_sub = UIKit.label("", "HudLabel", 24, Palette.GOLD)
	_sub.anchor_right = 1.0
	_sub.offset_top = 112
	_sub.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	add_child(_sub)
	_card = PanelContainer.new()
	_card.anchor_left = 1.0
	_card.anchor_right = 1.0
	_card.anchor_top = 0.5
	_card.anchor_bottom = 0.5
	_card.offset_left = -520
	_card.offset_right = -30
	_card.offset_top = -300
	_card.offset_bottom = 300
	_card.visible = false
	add_child(_card)
	_card_box = UIKit.vbox(10)
	_card.add_child(_card_box)

## Which sequence plays: the families each have their own ("grove" for the
## Mossbun line, "ember" for fire lines, "celestial" for star lines); anything
## else uses the classic light-pillar sequence.
var style := ""
var _fx: Array = []

func play(from_id: String, to_id: String) -> void:
	if _busy:
		return
	_busy = true
	_from = from_id
	_to = to_id
	visible = true
	_card.visible = false
	var a: CreatureData = DB.creature(from_id)
	var b: CreatureData = DB.creature(to_id)
	style = b.awakening_style if b.awakening_style != "" else a.awakening_style
	if style == "" and "fire" in b.elements:
		style = "ember"
	elif style == "" and "celestial" in b.elements and b.is_colossal():
		style = "celestial"
	viewer.show_item("creature", from_id)
	_wide()
	viewer._yaw = 0.3
	_title.text = ""
	_sub.text = ""
	match style:
		"grove": await _grove(a, b)
		"ember": await _ember(a, b)
		"celestial": await _celestial(a, b)
		_: await _classic(a, b)
	for n in _fx:
		if is_instance_valid(n):
			n.queue_free()
	_fx.clear()
	_title.text = "%s awakened as %s!" % [a.display_name, b.display_name]
	_sub.text = "%s · %s · %s" % [Evolution.PATH_NAMES.get(_path_of(from_id, to_id), "Awakening"), Evolution.stage_name(b), b.size_label() + " Mythling"]
	await _wait(0.6)
	viewer.play("roar" if b.size_class != "small" else "happy")
	await _wait(1.0)
	# New profile with its abilities; the journal already holds the entry.
	_show_card(b)
	_busy = false

func _add_fx(n: Node3D) -> Node3D:
	viewer.stage.add_child(n)
	_fx.append(n)
	return n

func _reveal_new(b: CreatureData, flash := 1.0) -> Node3D:
	_flash.color.a = flash
	Audio.play_sfx("discovery", 0.85)
	viewer.show_item("colossal" if b.is_colossal() else "creature", b.id)
	_wide()
	viewer._yaw = 0.5
	create_tween().tween_property(_flash, "color:a", 0.0, 1.0)
	return viewer.current

# ---------------------------------------------------------------- GROVE (Mossbun family)
## Leaves gather and swirl, roots rise from the ground and wrap the creature in
## a mound of moss; the new body unfolds out of it in a forest clearing.
func _grove(a: CreatureData, b: CreatureData) -> void:
	var env := viewer.environment
	env.background_mode = Environment.BG_COLOR
	env.background_color = Color("cfe3c4")
	env.ambient_light_energy = 0.55
	var floor_ := _add_fx(MeshKit.add(Node3D.new(), MeshKit.cyl(2.6, 2.6, 0.06, 32), MeshKit.mat(Color("5f8f3e")), Vector3(0, -0.03, 0)).get_parent())
	for k in 9:
		var ang := k * TAU / 9.0
		MeshKit.add(floor_, MeshKit.sphere(0.18, 8, 4), MeshKit.mat(Color("7aa64c")), Vector3(cos(ang) * 2.1, 0.05, sin(ang) * 2.1), Vector3.ZERO, Vector3(1, 0.4, 1))
	await _wait(0.5)
	_title.text = "%s's moss is stirring…" % a.display_name
	viewer.play("happy")
	Audio.play_sfx("ability", 0.7)
	# 1. Leaves drift in and begin to circle.
	var leaves := _leaves(Color("86c45e"))
	await _wait(1.3)
	var tw := create_tween().set_parallel(true)
	tw.tween_property(env, "background_color", Color("2c4a2a"), 1.4)
	tw.tween_property(env, "ambient_light_energy", 0.35, 1.4)
	# 2. Roots rise out of the ground around it.
	_title.text = "Roots answer from deep below…"
	var roots := Node3D.new()
	_add_fx(roots)
	for k in 7:
		var ang := k * TAU / 7.0 + 0.2
		var base := Vector3(cos(ang) * 1.5, 0, sin(ang) * 1.5)
		var mi := MeshInstance3D.new()
		mi.mesh = MeshKit.tube(MeshKit.bezier(base, base * 0.7 + Vector3(0, 1.3, 0), base * 0.15 + Vector3(0, 1.0, 0), 8), MeshKit.taper(8, 0.12, 0.03), 6)
		mi.material_override = MeshKit.mat(Color("5a4030"))
		roots.add_child(mi)
	roots.scale = Vector3(1, 0.02, 1)
	create_tween().tween_property(roots, "scale", Vector3.ONE, 1.6).set_trans(Tween.TRANS_BACK).set_ease(Tween.EASE_OUT)
	Audio.play_sfx("stomp", 0.7)
	await _wait(1.6)
	# 3. A mound of moss closes over the old body.
	# The mound lives in the viewer's pivot so it scales with the creature.
	var mound := MeshKit.add(Node3D.new(), MeshKit.sphere(0.45, 18, 9), MeshKit.mat(Color("4f7a36"), 1.0), Vector3(0, 0.1, 0), Vector3.ZERO, Vector3(1.0, 0.8, 1.1)).get_parent()
	for k in 8:
		var ang := k * TAU / 8.0
		MeshKit.add(mound, MeshKit.petal(0.35, 0.2, 0.15), MeshKit.mat(Color("6aa648"), 0.8), Vector3(cos(ang) * 0.3, 0.3, sin(ang) * 0.3), Vector3(-40, rad_to_deg(-ang) - 90.0, 0))
	viewer.pivot.add_child(mound)
	_fx.append(mound)
	mound.scale = Vector3.ONE * 0.05
	var t2 := create_tween().set_parallel(true)
	t2.tween_property(mound, "scale", Vector3.ONE, 1.2).set_trans(Tween.TRANS_CUBIC)
	t2.tween_property(viewer.current, "scale", Vector3(1.0, 0.1, 1.0), 1.2)
	_title.text = "The body is changing…"
	await _wait(1.3)
	# 4. The mound splits and the new form unfolds lengthwise, then rises.
	var glow := MeshKit.add(Node3D.new(), MeshKit.sphere(0.5, 14, 7), MeshKit.glow(Color("8affc0"), 2.4), Vector3(0, 0.6, 0)).get_parent()
	_add_fx(glow)
	_title.text = "%s unfolds from the moss…" % b.display_name
	var reveal := _reveal_new(b, 0.55)
	reveal.scale = Vector3(0.5, 0.15, 0.3)
	var t3 := create_tween()
	t3.tween_property(reveal, "scale", Vector3(0.7, 0.3, 1.0), 0.6).set_trans(Tween.TRANS_SINE)
	t3.tween_property(reveal, "scale", Vector3(1.0, 1.0, 1.0), 0.9).set_trans(Tween.TRANS_BACK).set_ease(Tween.EASE_OUT)
	create_tween().tween_property(mound, "scale", Vector3(1.6, 0.05, 1.6), 0.8)
	create_tween().tween_property(glow, "scale", Vector3.ONE * 0.01, 0.8)
	# 5. The clearing blossoms: sunlight returns and flowers open around it.
	var t4 := create_tween().set_parallel(true)
	t4.tween_property(env, "background_color", Color("d9efcf"), 1.8)
	t4.tween_property(env, "ambient_light_energy", 0.6, 1.8)
	for k in 10:
		var ang := k * TAU / 10.0
		var f := MeshKit.add(Node3D.new(), MeshKit.sphere(0.09, 8, 4), MeshKit.mat([Color("f2a7c3"), Color("f4e27a"), Color("ffffff")][k % 3], 0.6), Vector3(cos(ang) * 1.9, 0.1, sin(ang) * 1.9)).get_parent()
		_add_fx(f)
		f.scale = Vector3.ONE * 0.01
		var ft := create_tween()
		ft.tween_interval(0.08 * k)
		ft.tween_property(f, "scale", Vector3.ONE, 0.4).set_trans(Tween.TRANS_BACK).set_ease(Tween.EASE_OUT)
	leaves.emitting = false
	_title.text = "The clearing blossoms around it."
	create_tween().tween_property(roots, "scale", Vector3(1, 0.02, 1), 1.4)
	Audio.play_sfx("restore", 0.9)
	await _wait(1.5)

func _leaves(col: Color) -> CPUParticles3D:
	var p := _spiral(col)
	p.amount = 40 if not AbilityFX.reduced() else 18
	p.emission_ring_radius = 1.8
	p.emission_ring_inner_radius = 1.2
	p.initial_velocity_min = 0.2
	p.initial_velocity_max = 0.5
	var m := MeshKit.petal(0.12, 0.06, 0.04)
	p.mesh = m
	p.material_override = MeshKit.mat(col, 0.8)
	p.angle_min = 0
	p.angle_max = 360
	p.particle_flag_rotate_y = true
	_fx.append(p)
	return p

# ---------------------------------------------------------------- EMBER (fire families)
## Markings glow, cracks of light spread across the ground, plates of dark
## stone fly in and lock around the body, then the magma seams ignite.
func _ember(a: CreatureData, b: CreatureData) -> void:
	var env := viewer.environment
	env.background_mode = Environment.BG_COLOR
	env.background_color = Color("3a2a26")
	env.ambient_light_energy = 0.4
	await _wait(0.5)
	_title.text = "%s's markings begin to glow…" % a.display_name
	viewer.play("happy")
	var sparks := _spiral(Color("ff8a3a"))
	sparks.direction = Vector3.UP
	sparks.orbit_velocity_min = 0.1
	sparks.orbit_velocity_max = 0.3
	_fx.append(sparks)
	Audio.play_sfx("ability", 0.6)
	await _wait(1.2)
	# Glowing cracks spread across the ground.
	_title.text = "The ground answers with fire…"
	var cracks := Node3D.new()
	_add_fx(cracks)
	for k in 8:
		var ang := k * TAU / 8.0 + randf() * 0.3
		MeshKit.add(cracks, MeshKit.box(Vector3(0.05, 0.02, 1.6)), MeshKit.glow(Color("ff6a1f"), 2.4), Vector3(cos(ang) * 1.1, 0.01, sin(ang) * 1.1), Vector3(0, rad_to_deg(-ang) + 90.0, 0))
	cracks.scale = Vector3(0.05, 1, 0.05)
	create_tween().tween_property(cracks, "scale", Vector3.ONE, 1.2).set_trans(Tween.TRANS_EXPO)
	create_tween().tween_property(env, "background_color", Color("1c0f0c"), 1.2)
	Audio.play_sfx("stomp", 0.6)
	await _wait(1.3)
	# Armour plates fly in from all sides and lock together.
	_title.text = "Armour forms around it…"
	var plates: Array = []
	for k in 10:
		var ang := k * TAU / 10.0
		var pl := MeshKit.add(Node3D.new(), MeshKit.prism(Vector3(0.4, 0.5, 0.12)), MeshKit.mat(Color("2a2422"), 0.6, Color("ff6a1f"), 0.3), Vector3.ZERO).get_parent()
		_add_fx(pl)
		pl.position = Vector3(cos(ang) * 3.0, 0.6 + (k % 3) * 0.3, sin(ang) * 3.0)
		pl.look_at_from_position(pl.position, Vector3(0, 0.6, 0), Vector3.UP)
		create_tween().tween_property(pl, "position", Vector3(cos(ang) * 0.45, 0.5 + (k % 3) * 0.2, sin(ang) * 0.45), 0.9).set_trans(Tween.TRANS_BACK).set_ease(Tween.EASE_IN)
		plates.append(pl)
	create_tween().tween_property(viewer.current, "scale", Vector3.ONE * 0.6, 0.9)
	await _wait(1.0)
	var reveal := _reveal_new(b, 0.9)
	for pl in plates:
		create_tween().tween_property(pl, "scale", Vector3.ONE * 0.01, 0.4)
	reveal.scale = Vector3.ONE * 0.7
	create_tween().tween_property(reveal, "scale", Vector3.ONE, 0.7).set_trans(Tween.TRANS_BACK).set_ease(Tween.EASE_OUT)
	sparks.emitting = false
	create_tween().tween_property(env, "background_color", Color("4a2e24"), 1.4)
	Audio.play_sfx("restore", 0.7)
	await _wait(1.4)

# ---------------------------------------------------------------- CELESTIAL (star families)
## The light changes to night, rings of light orbit on different axes, and the
## new anatomy unfolds axis by axis inside a field of stars.
func _celestial(a: CreatureData, b: CreatureData) -> void:
	var env := viewer.environment
	env.background_mode = Environment.BG_COLOR
	env.background_color = Color("cfd6f0")
	env.ambient_light_energy = 0.5
	await _wait(0.5)
	_title.text = "The light around %s is changing…" % a.display_name
	create_tween().tween_property(env, "background_color", Color("0c0e26"), 1.6)
	var stars := _spiral(Color("fff2b0"))
	stars.emission_shape = CPUParticles3D.EMISSION_SHAPE_SPHERE
	stars.emission_sphere_radius = 3.0
	stars.initial_velocity_min = 0.0
	stars.initial_velocity_max = 0.1
	_fx.append(stars)
	await _wait(1.6)
	_title.text = "Celestial rings gather…"
	var rings: Array = []
	for k in 3:
		var r := MeshKit.add(Node3D.new(), MeshKit.torus(0.9 + k * 0.3, 0.95 + k * 0.3, 40), MeshKit.glow([Color("b9c8ff"), Color("ffe08a"), Color("c49af0")][k], 2.0), Vector3(0, 0.7, 0), Vector3(60 * k, 0, 30 * k)).get_parent()
		_add_fx(r)
		r.scale = Vector3.ONE * 0.05
		create_tween().tween_property(r, "scale", Vector3.ONE, 1.0).set_trans(Tween.TRANS_BACK)
		var spin := create_tween().set_loops(3)
		spin.tween_property(r, "rotation:y", TAU, 1.4).as_relative()
		rings.append(r)
	Audio.play_sfx("ability", 1.2)
	await _wait(1.4)
	create_tween().tween_property(viewer.current, "scale", Vector3.ONE * 0.05, 0.8).set_trans(Tween.TRANS_QUAD).set_ease(Tween.EASE_IN)
	await _wait(0.85)
	_title.text = "Its new form unfolds…"
	var reveal := _reveal_new(b, 0.6)
	reveal.scale = Vector3(0.05, 0.05, 1.0)
	var t := create_tween()
	t.tween_property(reveal, "scale", Vector3(1.0, 0.05, 1.0), 0.5).set_trans(Tween.TRANS_SINE)
	t.tween_property(reveal, "scale", Vector3.ONE, 0.7).set_trans(Tween.TRANS_BACK).set_ease(Tween.EASE_OUT)
	for r in rings:
		create_tween().tween_property(r, "scale", Vector3.ONE * 1.8, 1.2)
	create_tween().tween_property(env, "background_color", Color("1c2050"), 1.4)
	Audio.play_sfx("restore", 1.1)
	await _wait(1.3)

# ---------------------------------------------------------------- CLASSIC (fallback)
func _classic(a: CreatureData, b: CreatureData) -> void:
	var env := viewer.environment
	env.background_mode = Environment.BG_COLOR
	env.background_color = Color("cfe3d8")
	env.ambient_light_energy = 0.5
	await _wait(0.6)
	_title.text = "Something is happening to %s…" % a.display_name
	viewer.play("happy")
	Audio.play_sfx("ability", 0.8)
	await _wait(1.4)
	var tw := create_tween().set_parallel(true)
	tw.tween_property(env, "background_color", Color("1a1530"), 1.6)
	tw.tween_property(env, "ambient_light_energy", 0.25, 1.6)
	var col := Palette.element_color(b.primary_element())
	var spiral := _spiral(col)
	_fx.append(spiral)
	var pillar := MeshKit.add(viewer.stage, MeshKit.cyl(0.35, 0.5, 6.0, 20), MeshKit.glass(col.lightened(0.4), 0.35, col), Vector3(0, 3.0, 0))
	_fx.append(pillar)
	pillar.scale = Vector3(0.05, 1, 0.05)
	create_tween().tween_property(pillar, "scale", Vector3.ONE, 1.8).set_trans(Tween.TRANS_CUBIC)
	Audio.play_sfx("restore", 0.8)
	await _wait(1.8)
	var orb := MeshKit.add(viewer.stage, MeshKit.sphere(0.4, 20, 10), MeshKit.glow(col.lightened(0.5), 2.2), Vector3(0, 0.6, 0))
	_fx.append(orb)
	orb.scale = Vector3.ONE * 0.05
	var t2 := create_tween().set_parallel(true)
	t2.tween_property(viewer.pivot, "rotation:y", viewer.pivot.rotation.y + TAU * 3.0, 1.4).set_trans(Tween.TRANS_QUAD).set_ease(Tween.EASE_IN)
	t2.tween_property(viewer.current, "scale", Vector3.ONE * 0.05, 1.4).set_trans(Tween.TRANS_QUAD).set_ease(Tween.EASE_IN)
	t2.tween_property(orb, "scale", Vector3.ONE * 1.6, 1.4)
	await _wait(1.45)
	var reveal := _reveal_new(b)
	orb.visible = false
	reveal.scale = Vector3.ONE * 0.3
	create_tween().tween_property(reveal, "scale", Vector3.ONE, 0.9).set_trans(Tween.TRANS_BACK).set_ease(Tween.EASE_OUT)
	var t3 := create_tween().set_parallel(true)
	t3.tween_property(env, "background_color", Color("dbeee2"), 1.6)
	t3.tween_property(env, "ambient_light_energy", 0.5, 1.6)
	create_tween().tween_property(pillar, "scale", Vector3(0.01, 1, 0.01), 1.2)
	spiral.emitting = false
	await _wait(1.2)

func _wide() -> void:
	# Full-screen moment: frame the creature with room around it.
	var c := viewer.cam
	var target := Vector3(0, c.position.y * 0.6, 0)
	var pos := Vector3(-0.6, c.position.y * 1.15, c.position.z * 1.75)
	c.transform = Transform3D(Basis.looking_at(target - pos, Vector3.UP), pos)

func _path_of(from_id: String, to_id: String) -> String:
	for e in Evolution.options(from_id):
		if e.to == to_id:
			return e.path
	return "natural"

func _show_card(b: CreatureData) -> void:
	UIKit.clear(_card_box)
	_card_box.add_child(UIKit.label(b.display_name, "Heading", 36))
	var pills := HFlowContainer.new()
	pills.add_theme_constant_override("h_separation", 6)
	pills.add_child(UIKit.pill(Evolution.stage_name(b), Palette.MOSS_DARK, Color.WHITE, "star"))
	pills.add_child(UIKit.pill(b.size_label(), Palette.TEAL, Color.WHITE, "size"))
	pills.add_child(UIKit.rarity_pill(b.rarity))
	for e in b.elements:
		pills.add_child(UIKit.element_pill(e))
	_card_box.add_child(pills)
	_card_box.add_child(UIKit.label(b.description, "", 18, Color(0, 0, 0, 0), true))
	_card_box.add_child(UIKit.label("Abilities", "Title", 20))
	for a in Abilities.kit(b.id):
		_card_box.add_child(UIKit.label("%s — %s" % [a.display_name, a.slot.capitalize()], "", 17, Palette.MOSS_DARK, true))
	if b.form_role != "":
		_card_box.add_child(UIKit.label(b.form_role, "Caption", 16, Color(0, 0, 0, 0), true))
	_card_box.add_child(UIKit.label("Added to your Journal. Earlier forms are remembered: you can still bring them along from the Mythlings menu.", "Caption", 16, Color(0, 0, 0, 0), true))
	var row := UIKit.hbox(8)
	var again := UIKit.button("Replay", "play", "", 56)
	again.pressed.connect(func(): play(_from, _to))
	var done := UIKit.button("Continue", "check", "PrimaryButton", 56)
	done.pressed.connect(close)
	row.add_child(again)
	row.add_child(done)
	_card_box.add_child(row)
	_card.visible = true
	_card.modulate.a = 0.0
	create_tween().tween_property(_card, "modulate:a", 1.0, 0.4)

func _spiral(col: Color) -> CPUParticles3D:
	var p := CPUParticles3D.new()
	p.amount = 60 if not AbilityFX.reduced() else 28
	p.lifetime = 2.2
	p.emission_shape = CPUParticles3D.EMISSION_SHAPE_RING
	p.emission_ring_axis = Vector3.UP
	p.emission_ring_radius = 1.0
	p.emission_ring_inner_radius = 0.8
	p.emission_ring_height = 0.1
	p.direction = Vector3.UP
	p.spread = 5
	p.initial_velocity_min = 0.6
	p.initial_velocity_max = 1.2
	p.orbit_velocity_min = 0.8
	p.orbit_velocity_max = 1.2
	p.gravity = Vector3.ZERO
	var m := SphereMesh.new()
	m.radius = 0.035
	m.height = 0.07
	m.material = MeshKit.glow(col.lightened(0.3), 1.8)
	p.mesh = m
	viewer.stage.add_child(p)
	p.emitting = true
	return p

func _wait(t: float) -> void:
	await get_tree().create_timer(t, true, false, true).timeout

func close() -> void:
	if _busy:
		return
	visible = false
	viewer.clear()
	finished.emit()
