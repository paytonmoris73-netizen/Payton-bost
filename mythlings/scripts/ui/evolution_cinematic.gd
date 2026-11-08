class_name EvolutionCinematic
extends Control
## Full-screen evolution sequence. Used live (after Evolution.evolve) and for
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
	var env := viewer.environment
	env.background_mode = Environment.BG_COLOR
	env.background_color = Color("cfe3d8")
	env.ambient_light_energy = 0.5
	viewer.show_item("creature", from_id)
	_wide()
	viewer._yaw = 0.3
	_title.text = ""
	_sub.text = ""
	# 1. The creature reacts.
	await _wait(0.6)
	_title.text = "Something is happening to %s…" % a.display_name
	viewer.play("happy")
	Audio.play_sfx("ability", 0.8)
	await _wait(1.4)
	# 2. The environment changes.
	var tw := create_tween().set_parallel(true)
	tw.tween_property(env, "background_color", Color("1a1530"), 1.6)
	tw.tween_property(env, "ambient_light_energy", 0.25, 1.6)
	# 3. Effects gather around it.
	var col := Palette.element_color(b.primary_element())
	var spiral := _spiral(col)
	var pillar := MeshKit.add(viewer.stage, MeshKit.cyl(0.35, 0.5, 6.0, 20), MeshKit.glass(col.lightened(0.4), 0.35, col), Vector3(0, 3.0, 0))
	pillar.scale = Vector3(0.05, 1, 0.05)
	create_tween().tween_property(pillar, "scale", Vector3.ONE, 1.8).set_trans(Tween.TRANS_CUBIC)
	Audio.play_sfx("restore", 0.8)
	await _wait(1.8)
	# 4. Transformation: the old form spins into a glowing core.
	var orb := MeshKit.add(viewer.stage, MeshKit.sphere(0.4, 20, 10), MeshKit.glow(col.lightened(0.5), 2.2), Vector3(0, 0.6, 0))
	orb.scale = Vector3.ONE * 0.05
	var t2 := create_tween().set_parallel(true)
	t2.tween_property(viewer.pivot, "rotation:y", viewer.pivot.rotation.y + TAU * 3.0, 1.4).set_trans(Tween.TRANS_QUAD).set_ease(Tween.EASE_IN)
	t2.tween_property(viewer.current, "scale", Vector3.ONE * 0.05, 1.4).set_trans(Tween.TRANS_QUAD).set_ease(Tween.EASE_IN)
	t2.tween_property(orb, "scale", Vector3.ONE * 1.6, 1.4)
	await _wait(1.45)
	_flash.color.a = 1.0
	Audio.play_sfx("discovery", 0.85)
	viewer.show_item("colossal" if b.is_colossal() else "creature", to_id)
	_wide()
	viewer._yaw = 0.5
	orb.queue_free()
	var reveal := viewer.current
	reveal.scale = Vector3.ONE * 0.3
	create_tween().tween_property(_flash, "color:a", 0.0, 1.0)
	create_tween().tween_property(reveal, "scale", Vector3.ONE, 0.9).set_trans(Tween.TRANS_BACK).set_ease(Tween.EASE_OUT)
	# 5. The new form is revealed.
	var t3 := create_tween().set_parallel(true)
	t3.tween_property(env, "background_color", Color("dbeee2"), 1.6)
	t3.tween_property(env, "ambient_light_energy", 0.5, 1.6)
	create_tween().tween_property(pillar, "scale", Vector3(0.01, 1, 0.01), 1.2)
	spiral.emitting = false
	get_tree().create_timer(3.0).timeout.connect(spiral.queue_free)
	_title.text = "%s became %s!" % [a.display_name, b.display_name]
	_sub.text = "%s · %s" % [Evolution.PATH_NAMES.get(_path_of(from_id, to_id), "Evolution"), b.size_label() + " Mythling"]
	await _wait(0.6)
	viewer.play("roar" if b.size_class != "small" else "happy")
	await _wait(1.0)
	pillar.queue_free()
	# 6-8. New profile with its abilities; the journal already holds the entry.
	_show_card(b)
	_busy = false

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
	pills.add_child(UIKit.pill(b.size_label(), Palette.TEAL, Color.WHITE, "size"))
	pills.add_child(UIKit.rarity_pill(b.rarity))
	for e in b.elements:
		pills.add_child(UIKit.element_pill(e))
	_card_box.add_child(pills)
	_card_box.add_child(UIKit.label(b.description, "", 18, Color(0, 0, 0, 0), true))
	_card_box.add_child(UIKit.label("Abilities", "Title", 20))
	for a in Abilities.kit(b.id):
		_card_box.add_child(UIKit.label("%s — %s" % [a.display_name, a.slot.capitalize()], "", 17, Palette.MOSS_DARK, true))
	_card_box.add_child(UIKit.label("Added to your Journal.", "Caption", 16))
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
