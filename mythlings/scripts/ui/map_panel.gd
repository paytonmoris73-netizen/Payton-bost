class_name MapPanel
extends UIPanel
## World map (six regions) + local Whispering Meadow map with landmarks, quest
## marker, player position and fast travel to visited places.

var _world: WorldMapCanvas
var _local: Control
var _info: VBoxContainer
var _tabs: HBoxContainer
var _mode := "world"
var _content: HBoxContainer
var _terrain_tex: ImageTexture

func build_content() -> void:
	setup_frame("World Map", "map")
	_tabs = UIKit.hbox(8)
	for t in [["world", "World"], ["local", "Whispering Meadow"]]:
		var b := UIKit.button(t[1], "", "TabButton", 50)
		b.toggle_mode = true
		b.button_pressed = t[0] == _mode
		var m: String = t[0]
		b.pressed.connect(func():
			_mode = m
			for x in _tabs.get_children():
				x.button_pressed = x == b
			refresh())
		_tabs.add_child(b)
	body.add_child(_tabs)
	_content = UIKit.hbox(16)
	_content.size_flags_vertical = Control.SIZE_EXPAND_FILL
	body.add_child(_content)
	_world = WorldMapCanvas.new()
	_world.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	_world.size_flags_vertical = Control.SIZE_EXPAND_FILL
	_world.size_flags_stretch_ratio = 1.8
	_world.region_tapped.connect(_show_region)
	_content.add_child(_world)
	_local = LocalMap.new()
	_local.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	_local.size_flags_vertical = Control.SIZE_EXPAND_FILL
	_local.size_flags_stretch_ratio = 1.8
	_content.add_child(_local)
	var card := UIKit.card()
	card.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	card.size_flags_vertical = Control.SIZE_EXPAND_FILL
	_info = UIKit.vbox(10)
	card.add_child(UIKit.scroll(_info))
	_content.add_child(card)

func on_open(_args: Dictionary) -> void:
	Events.emit_game_event("open", "map")

func refresh() -> void:
	_world.visible = _mode == "world"
	_local.visible = _mode == "local"
	if _mode == "world":
		_show_region("meadow")
	else:
		(_local as LocalMap).panel = self
		_local.queue_redraw()
		_show_local()

func _show_region(id: String) -> void:
	UIKit.clear(_info)
	var r: RegionData = DB.region(id)
	var open := _world.unlocked(r)
	_info.add_child(UIKit.label(r.display_name, "Heading", 30))
	var pills := HFlowContainer.new()
	pills.add_theme_constant_override("h_separation", 6)
	pills.add_child(UIKit.pill(r.difficulty, r.theme_color.darkened(0.3)))
	pills.add_child(UIKit.pill("Unlocked" if open else "Locked", Palette.MOSS if open else Palette.INK_SOFT, Color.WHITE, "check" if open else "lock"))
	_info.add_child(pills)
	_info.add_child(UIKit.label(r.description, "", 19, Color(0, 0, 0, 0), true))
	_info.add_child(UIKit.label("Mythlings discovered: %d / %d" % [GameState.discovered_count(id), DB.creatures_in_region(id).size()], "Title", 20))
	if r.colossal != "":
		var col: CreatureData = DB.creature(r.colossal)
		_info.add_child(UIKit.label("Guardian: %s" % (col.display_name if GameState.is_discovered(col.id) else "???"), "", 18, Palette.GOLD_DARK))
	_info.add_child(UIKit.label("Places", "Title", 20))
	for i in r.locations.size():
		var visited: bool = r.locations[i] in GameState.data.visited
		_info.add_child(UIKit.label(("✓ " if visited else "• ") + r.location_names[i], "", 18, Palette.MOSS_DARK if visited else Palette.INK_SOFT))
	var qn := 0
	for q in Quests.active():
		if DB.quest(q) and DB.quest(q).region == id:
			qn += 1
	_info.add_child(UIKit.label("Active quests here: %d" % qn, "Caption", 17))
	if not open:
		var req := "Requires Keeper level %d" % r.unlock_level
		if not r.playable:
			req += " · Arrives in a future content update"
		_info.add_child(UIKit.label(req, "Title", 18, Palette.DANGER, true))
	elif id == "meadow":
		var b := UIKit.button("View local map", "map", "PrimaryButton", 58)
		b.pressed.connect(func():
			_mode = "local"
			_tabs.get_child(1).button_pressed = true
			_tabs.get_child(0).button_pressed = false
			refresh())
		_info.add_child(b)

func _show_local() -> void:
	UIKit.clear(_info)
	_info.add_child(UIKit.label("Fast travel", "Title", 22))
	_info.add_child(UIKit.label("Travel instantly to places you have already visited.", "Caption", 17, Color(0, 0, 0, 0), true))
	for l in MeadowLevel.LOCATIONS:
		var visited: bool = l[0] in GameState.data.visited
		var b := UIKit.button(l[1], "map" if visited else "lock", "", 54, 22)
		b.disabled = not visited or MeadowLevel.current == null or MeadowLevel.current.player.mount != null
		var key: String = l[0]
		b.pressed.connect(func(): _travel(key))
		_info.add_child(b)

func _travel(key: String) -> void:
	var lvl := MeadowLevel.current
	if lvl == null:
		return
	var p := lvl.at(key, 1.0)
	# Step back from the exact centre so we don't land inside a landmark.
	var off := Vector3(4, 0, 6)
	var dest := p + off
	dest.y = lvl.terrain.height(dest.x, dest.z) + 1.0
	await close()
	lvl.player.global_position = dest
	lvl.player.velocity = Vector3.ZERO
	var comp := lvl.companion_creature()
	if comp:
		comp.global_position = dest + Vector3(1.5, 0, 1.5)
	FX.burst(lvl, dest, Color("b6f5c8"), 30, 0.08, 3.0)

class LocalMap extends Control:
	var panel: MapPanel
	var _img: ImageTexture
	func _ready() -> void:
		mouse_filter = Control.MOUSE_FILTER_IGNORE
	func _process(_d: float) -> void:
		if visible:
			queue_redraw()
	func _bake() -> void:
		var lvl := MeadowLevel.current
		if lvl == null:
			return
		var n := 128
		var img := Image.create(n, n, false, Image.FORMAT_RGB8)
		for j in n:
			for i in n:
				var x := -120.0 + 240.0 * i / n
				var z := -130.0 + 240.0 * j / n
				var h := lvl.terrain.height(x, z)
				var col: Color
				if lvl.terrain.is_water(x, z):
					col = Color("6ab8d8")
				elif lvl.terrain.path_distance(x, z) < 1.8:
					col = Color("c9b28a")
				elif x < -50 and z > -75 and z < 50:
					col = Color("4f7a40")
				else:
					col = Color("8fbf6a").darkened(clampf((h - 1.0) * 0.03, -0.2, 0.35))
				if Vector2(x, z).length() > 112.0:
					col = col.lerp(Color("7f8a72"), 0.6)
				img.set_pixel(i, j, col)
		_img = ImageTexture.create_from_image(img)
	func _w2m(p: Vector3, r: Rect2) -> Vector2:
		return r.position + Vector2((p.x + 120.0) / 240.0, (p.z + 130.0) / 240.0) * r.size
	func _draw() -> void:
		if _img == null:
			_bake()
		var lvl := MeadowLevel.current
		if _img == null or lvl == null:
			return
		var s := minf(size.x, size.y)
		var r := Rect2((size - Vector2(s, s)) * 0.5, Vector2(s, s))
		draw_style_box(UITheme.box(Color("eadcb8"), 20), r.grow(10))
		draw_texture_rect(_img, r, false)
		for l in MeadowLevel.LOCATIONS:
			if not MeadowLevel.LOC.has(l[0]):
				continue
			var p := _w2m(lvl.at(l[0]), r)
			var visited: bool = l[0] in GameState.data.visited
			draw_circle(p, 9, Palette.CARD if visited else Color("c9c0ad"))
			draw_circle(p, 5, Palette.MOSS_DARK if visited else Palette.INK_SOFT)
			draw_string(UITheme.bold_font, p + Vector2(12, 6), l[1] if visited else "???", HORIZONTAL_ALIGNMENT_LEFT, -1, 16, Palette.INK)
		var tp := lvl.quest_target_position()
		if tp != Vector3.INF:
			var q := _w2m(tp, r)
			draw_circle(q, 11 + sin(Time.get_ticks_msec() * 0.005) * 2.0, Color(Palette.GOLD, 0.8))
			draw_circle(q, 5, Color.WHITE)
		var pp := _w2m(lvl.player.global_position, r)
		var fwd := -lvl.player.global_transform.basis.z
		var a := atan2(fwd.z, fwd.x)
		draw_colored_polygon(PackedVector2Array([pp + Vector2(cos(a), sin(a)) * 14, pp + Vector2(cos(a + 2.4), sin(a + 2.4)) * 10, pp + Vector2(cos(a - 2.4), sin(a - 2.4)) * 10]), Palette.DANGER)
		draw_circle(pp, 4, Color.WHITE)
