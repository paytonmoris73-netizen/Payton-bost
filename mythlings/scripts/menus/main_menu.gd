extends Node3D
## Title screen: a living diorama (Mythlings playing under the great tree at
## golden hour), the MYTHLINGS logo, and clear entry points.

const K := preload("res://scripts/core/mesh_kit.gd")

var _cam: Camera3D
var _t := 0.0
var _rigs: Array = []
var _ui: Control
var _confirm: Control
var _journal: JournalPanel
var _settings: SettingsPanel

func _ready() -> void:
	GameState.session_active = false
	if SaveManager.has_save():
		SaveManager.load_game()
	_build_diorama()
	_build_ui()
	Audio.play_music("music_menu")
	Audio.play_ambience("amb_meadow")

func _build_diorama() -> void:
	var sky := SkyCycle.new()
	add_child(sky)
	sky.time = 0.7
	sky.paused = true
	var ground := MeshInstance3D.new()
	var st := SurfaceTool.new()
	st.begin(Mesh.PRIMITIVE_TRIANGLES)
	var n := 48
	var noise := FastNoiseLite.new()
	noise.frequency = 0.04
	var hf := func(x: float, z: float) -> float:
		var r := Vector2(x, z).length()
		return noise.get_noise_2d(x, z) * 1.2 + smoothstep(18.0, 60.0, r) * 6.0 - 0.5
	for j in n:
		for i in n:
			for q in [[0, 0], [1, 0], [0, 1], [1, 0], [1, 1], [0, 1]]:
				var x: float = (i + q[0] - n / 2.0) * 2.5
				var z: float = (j + q[1] - n / 2.0) * 2.5
				var h: float = hf.call(x, z)
				st.set_color(Color("6fa848").lerp(Color("8fbf5a"), noise.get_noise_2d(z, x) * 0.5 + 0.5))
				st.add_vertex(Vector3(x, h, z))
	st.generate_normals()
	ground.mesh = st.commit()
	ground.material_override = K.vcol(0.95)
	add_child(ground)
	var veg := Node3D.new()
	add_child(veg)
	var grass_xf: Array = []
	var rng := RandomNumberGenerator.new()
	rng.seed = 3
	for i in 2600:
		var x := rng.randf_range(-40, 40)
		var z := rng.randf_range(-40, 40)
		if Vector2(x, z + 2).length() < 3.5:
			continue
		grass_xf.append(Transform3D(Basis(Vector3.UP, rng.randf() * TAU).scaled(Vector3.ONE * rng.randf_range(0.8, 1.4)), Vector3(x, hf.call(x, z) - 0.05, z)))
	Vegetation.instances(veg, Props.grass_tuft(), grass_xf, "foliage_mm", false)
	var cols := [Color("f2a7c3"), Color("ffffff"), Color("f4e27a"), Color("c49af0")]
	for ci in 4:
		var fx: Array = []
		for i in 120:
			var x := rng.randf_range(-22, 22)
			var z := rng.randf_range(-22, 22)
			fx.append(Transform3D(Basis(Vector3.UP, rng.randf() * TAU).scaled(Vector3.ONE * rng.randf_range(0.9, 1.4)), Vector3(x, hf.call(x, z) - 0.05, z)))
		Vegetation.instances(veg, Vegetation.flower_mesh(cols[ci]), fx, "foliage_mm", false)
	var tree := Props.node(Props.ancient_oak(), "foliage", Vector3(9, hf.call(9, -10) - 0.5, -10), 0.4, 0.75)
	add_child(tree)
	for p in [Vector3(-14, 0, -16), Vector3(-20, 0, -4), Vector3(18, 0, 6), Vector3(-6, 0, -28)]:
		add_child(Props.node(Props.broadleaf_tree(randi() % 3), "foliage", Vector3(p.x, hf.call(p.x, p.z) - 0.2, p.z), randf() * TAU))
	for i in 18:
		var a := TAU * i / 18.0
		add_child(Props.node(Props.mountain(i % 6), "solid", Vector3(cos(a) * 160, -8, sin(a) * 160), a, 0.9))
	var vd := CreatureModels.build("verdantus")
	vd.position = Vector3(-26, hf.call(-26, -34), -34)
	vd.rotation.y = 0.9
	vd.speed = 0.0
	add_child(vd)
	_rigs.append([vd, Vector3.ZERO, 0.0, 0.0])
	var specs := [["mossbun", Vector3(-1.6, 0, 0.4), 2.2, 0.0], ["sunfox", Vector3(1.8, 0, -1.2), 3.0, 1.5], ["cloverling", Vector3(0.6, 0, 1.6), 1.4, 3.0], ["dewdrop", Vector3(-2.6, 0, -1.8), 1.8, 4.2], ["pebblit", Vector3(2.8, 0, 1.4), 0.0, 0.0], ["bloomtail", Vector3(-0.4, 0, -2.6), 0.0, 0.0]]
	for s in specs:
		var r := CreatureModels.build(s[0])
		r.position = s[1]
		add_child(r)
		_rigs.append([r, s[1], s[2], s[3]])
	_rigs[5][0].sleeping = true
	var bf := FX.motes(Color("fff2b0"), 30, Vector3(8, 2, 8), 0.04)
	bf.position = Vector3(0, 1.5, 0)
	add_child(bf)
	for i in 6:
		var b := Butterfly.new()
		b.setup(Vector3(randf_range(-4, 4), 0.2, randf_range(-4, 4)), [Color("f2c94c"), Color("f2a7c3"), Color("8fd3ec")][i % 3])
		add_child(b)
	_cam = Camera3D.new()
	_cam.fov = 48
	add_child(_cam)
	_cam.current = true

func _process(delta: float) -> void:
	_t += delta
	var a := _t * 0.05
	_cam.position = Vector3(sin(a) * 6.5, 2.0, cos(a) * 6.5 + 1.0)
	_cam.look_at(Vector3(0, 0.45, -0.8))
	# Mythlings play in little loops around the clearing.
	for e in _rigs:
		var r: CreatureRig = e[0]
		var radius: float = e[2]
		if radius <= 0.0:
			continue
		var ang: float = _t * (0.9 / radius) + e[3]
		var center: Vector3 = e[1]
		var pos := center + Vector3(cos(ang) * radius, 0, sin(ang) * radius) * 0.5
		var dir := pos - r.position
		r.position = pos
		r.position.y = 0.0
		if dir.length() > 0.0001:
			r.rotation.y = atan2(-dir.x, -dir.z)
		r.speed = 1.0
		if fmod(_t + e[3], 9.0) < 0.05:
			r.emote("happy", 1.4)

func _build_ui() -> void:
	var layer := CanvasLayer.new()
	add_child(layer)
	_ui = Control.new()
	_ui.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	_ui.theme = UITheme.get_theme()
	_ui.mouse_filter = Control.MOUSE_FILTER_IGNORE
	layer.add_child(_ui)
	var grad := TextureRect.new()
	var gt := GradientTexture2D.new()
	var g := Gradient.new()
	g.set_color(0, Color(0.05, 0.1, 0.08, 0.72))
	g.set_color(1, Color(0.05, 0.1, 0.08, 0.0))
	gt.gradient = g
	gt.fill_from = Vector2(0, 0)
	gt.fill_to = Vector2(0.6, 0)
	grad.texture = gt
	grad.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	grad.stretch_mode = TextureRect.STRETCH_SCALE
	grad.mouse_filter = Control.MOUSE_FILTER_IGNORE
	_ui.add_child(grad)
	var col := UIKit.vbox(14)
	col.anchor_top = 0.0
	col.anchor_bottom = 1.0
	col.offset_left = 80
	col.offset_top = 60
	col.offset_bottom = -50
	col.custom_minimum_size.x = 520
	col.alignment = BoxContainer.ALIGNMENT_CENTER
	_ui.add_child(col)
	var logo := Logo.new()
	logo.custom_minimum_size = Vector2(560, 170)
	col.add_child(logo)
	var tag := UIKit.label("A creature-keeping adventure", "HudLabel", 26, Color("f6efdf"))
	col.add_child(tag)
	col.add_child(UIKit.spacer(false))
	if SaveManager.has_save():
		var card := UIKit.card("DarkCard")
		var ch := UIKit.hbox(12)
		ch.add_child(IconGlyph.make("person", 44, Palette.GOLD))
		var cv := UIKit.vbox(0)
		cv.add_child(UIKit.label(String(GameState.data.player.name), "HudLabel", 24))
		cv.add_child(UIKit.label("Keeper level %d · %d / %d Mythlings · %s" % [GameState.level(), GameState.discovered_count(), DB.standard_creatures().size(), "Whispering Meadow"], "HudLabel", 17, Color("cfe0d6")))
		ch.add_child(cv)
		card.add_child(ch)
		col.add_child(card)
		var cont := UIKit.button("Continue", "play", "PrimaryButton", 74)
		cont.pressed.connect(_continue)
		col.add_child(cont)
		var nb := UIKit.button("New Adventure", "leaf", "", 64)
		nb.pressed.connect(_ask_new)
		col.add_child(nb)
	else:
		var play := UIKit.button("Begin your adventure", "play", "PrimaryButton", 78)
		play.pressed.connect(_new_game)
		col.add_child(play)
	var row := UIKit.hbox(10)
	var jb := UIKit.button("Mythling Collection", "book", "", 60)
	jb.pressed.connect(_open_journal)
	row.add_child(jb)
	var sb := UIKit.button("", "gear", "", 60, 28)
	sb.custom_minimum_size.x = 64
	sb.pressed.connect(_open_settings)
	row.add_child(sb)
	col.add_child(row)
	var preview := HBoxContainer.new()
	preview.add_theme_constant_override("separation", 6)
	for c in DB.creatures_in_region("meadow"):
		var p := CreaturePortrait.new()
		p.setup(c, GameState.is_discovered(c.id))
		p.custom_minimum_size = Vector2(64, 64)
		preview.add_child(p)
	col.add_child(preview)
	var ver := UIKit.label("v%s · Phase 1 vertical slice · offline" % ProjectSettings.get_setting("application/config/version"), "HudLabel", 15, Color(1, 1, 1, 0.7))
	ver.anchor_top = 1.0
	ver.anchor_bottom = 1.0
	ver.anchor_left = 1.0
	ver.anchor_right = 1.0
	ver.offset_left = -520
	ver.offset_top = -40
	ver.offset_right = -24
	ver.horizontal_alignment = HORIZONTAL_ALIGNMENT_RIGHT
	_ui.add_child(ver)
	_journal = JournalPanel.new()
	_ui.add_child(_journal)
	_settings = SettingsPanel.new()
	_ui.add_child(_settings)
	col.modulate.a = 0.0
	col.position.x -= 40
	var tw := create_tween().set_parallel(true)
	tw.tween_property(col, "modulate:a", 1.0, 0.9).set_delay(0.3)
	tw.tween_property(col, "position:x", col.position.x + 40, 0.9).set_delay(0.3).set_trans(Tween.TRANS_CUBIC).set_ease(Tween.EASE_OUT)

func _open_journal() -> void:
	_journal.open({})

func _open_settings() -> void:
	_settings.open({})

func _continue() -> void:
	Router.go("res://scenes/main/game.tscn")

func _ask_new() -> void:
	_confirm = Control.new()
	_confirm.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	_confirm.theme = UITheme.get_theme()
	var dim := ColorRect.new()
	dim.color = Color(0, 0, 0, 0.5)
	dim.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	_confirm.add_child(dim)
	var card := PanelContainer.new()
	card.custom_minimum_size = Vector2(640, 0)
	_confirm.add_child(card)
	var v := UIKit.vbox(12)
	v.add_child(UIKit.label("Start a new adventure?", "Heading", 30))
	v.add_child(UIKit.label("Your current Keeper will be replaced when the new adventure first saves. The previous save is kept once as a backup on this device.", "", 19, Color(0, 0, 0, 0), true))
	var row := UIKit.hbox(10)
	var c := UIKit.button("Keep playing", "close", "", 60)
	c.pressed.connect(func(): _confirm.queue_free())
	var ok := UIKit.button("Start new", "leaf", "PrimaryButton", 60)
	ok.pressed.connect(_new_game)
	row.add_child(c)
	row.add_child(ok)
	v.add_child(row)
	card.add_child(v)
	_ui.add_child(_confirm)
	await get_tree().process_frame
	card.position = (_ui.get_viewport_rect().size - card.size) * 0.5

func _new_game() -> void:
	GameState.data = GameState.default_data()
	GameState.reset_runtime()
	Router.go("res://scenes/menus/character_creator.tscn")

class Logo extends Control:
	var _t := 0.0
	func _process(d: float) -> void:
		_t += d
		queue_redraw()
	func _draw() -> void:
		var font := UITheme.heading_font
		var txt := "MYTHLINGS"
		var fs := 104
		var w := font.get_string_size(txt, HORIZONTAL_ALIGNMENT_LEFT, -1, fs).x
		var base := Vector2(0, 120)
		# Leaf flourish behind the title.
		for i in 3:
			var c := Vector2(w * (0.2 + i * 0.3), 34 + sin(_t * 1.5 + i) * 3.0)
			var pts := PackedVector2Array()
			for k in 24:
				var a := TAU * k / 24.0
				pts.append(c + Vector2(cos(a) * 34, sin(a) * 14).rotated(-0.5 + i * 0.5))
			draw_colored_polygon(pts, Color(Palette.MOSS_LIGHT, 0.55))
		draw_string_outline(font, base + Vector2(4, 6), txt, HORIZONTAL_ALIGNMENT_LEFT, -1, fs, 18, Color(0.05, 0.1, 0.08, 0.6))
		draw_string_outline(font, base, txt, HORIZONTAL_ALIGNMENT_LEFT, -1, fs, 12, Palette.MOSS_DARK)
		draw_string(font, base, txt, HORIZONTAL_ALIGNMENT_LEFT, -1, fs, Palette.PARCHMENT)
		# Sparkle over the I.
		var sp := Vector2(w * 0.405, 24 + sin(_t * 3.0) * 2.0)
		for k in 4:
			var a := PI * 0.5 * k
			draw_line(sp, sp + Vector2(cos(a), sin(a)) * (12 + sin(_t * 4.0) * 3.0), Palette.GOLD, 4.0, true)
		draw_circle(sp, 5, Color.WHITE)
