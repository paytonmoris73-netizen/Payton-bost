class_name WorldMapCanvas
extends Control
## Hand-drawn style world map: six region islands on a sea of parchment, each
## with its own silhouette, palette and landmark icons. Locked regions are
## veiled in mist with their unlock requirement.

signal region_tapped(region_id: String)

var _t := 0.0
var _hover := ""
var _rects: Dictionary = {}

func _ready() -> void:
	mouse_filter = Control.MOUSE_FILTER_STOP

func _process(delta: float) -> void:
	_t += delta
	queue_redraw()

func unlocked(r: RegionData) -> bool:
	return r.playable and GameState.level() >= r.unlock_level

func _gui_input(event: InputEvent) -> void:
	var pos := Vector2.INF
	if event is InputEventMouseButton and event.pressed and event.button_index == MOUSE_BUTTON_LEFT:
		pos = event.position
	elif event is InputEventScreenTouch and event.pressed:
		pos = event.position
	if pos == Vector2.INF:
		return
	for id in _rects:
		if (_rects[id] as Rect2).has_point(pos):
			region_tapped.emit(id)
			Audio.play_sfx("ui_click")
			return

func _island(center: Vector2, r: float, seed_v: int, col: Color) -> PackedVector2Array:
	var pts := PackedVector2Array()
	var rng := RandomNumberGenerator.new()
	rng.seed = seed_v
	var offs: Array = []
	for i in 9:
		offs.append(rng.randf_range(0.78, 1.18))
	for i in 48:
		var a := TAU * i / 48.0
		var k := float(i) / 48.0 * 9.0
		var o: float = lerpf(offs[int(k) % 9], offs[(int(k) + 1) % 9], k - floor(k))
		pts.append(center + Vector2(cos(a) * 1.25, sin(a) * 0.82) * r * o)
	return pts

func _draw() -> void:
	var sz := size
	# Sea.
	draw_rect(Rect2(Vector2.ZERO, sz), Color("cfe3e0"))
	for i in 7:
		var y := sz.y * (0.1 + i * 0.14) + sin(_t * 0.6 + i) * 4.0
		draw_arc(Vector2(sz.x * 0.5, y + sz.y * 2.0), sz.y * 2.0, -PI * 0.62, -PI * 0.38, 40, Color(1, 1, 1, 0.25), 2.0, true)
	# Dotted travel routes between regions.
	var order := DB.REGION_ORDER
	for i in order.size() - 1:
		var a: Vector2 = DB.region(order[i]).map_position * sz
		var b: Vector2 = DB.region(order[i + 1]).map_position * sz
		var steps := int(a.distance_to(b) / 18.0)
		for k in steps:
			if k % 2 == 0:
				draw_circle(a.lerp(b, float(k) / steps), 3.0, Color(Palette.INK_SOFT, 0.35))
	_rects.clear()
	var r := minf(sz.x, sz.y) * 0.13
	for id in order:
		var reg: RegionData = DB.region(id)
		var c: Vector2 = reg.map_position * sz
		var open := unlocked(reg)
		var pts := _island(c, r, hash(id), reg.theme_color)
		var shadow := PackedVector2Array()
		for p in pts:
			shadow.append(p + Vector2(0, 8))
		draw_colored_polygon(shadow, Color(0, 0, 0, 0.12))
		draw_colored_polygon(pts, Color("eadcb8"))
		var inner := PackedVector2Array()
		for p in pts:
			inner.append(c + (p - c) * 0.88)
		draw_colored_polygon(inner, reg.theme_color.lerp(Color("eadcb8"), 0.15 if open else 0.55))
		_landmarks(id, c, r, open, reg)
		if not open:
			draw_colored_polygon(inner, Color(0.95, 0.95, 0.97, 0.45 + sin(_t + c.x) * 0.05))
		draw_polyline(pts + PackedVector2Array([pts[0]]), Color(Palette.INK, 0.35), 2.0, true)
		# Label banner.
		var font := UITheme.heading_font
		var fs := int(clampf(r * 0.24, 16, 28))
		var tw := font.get_string_size(reg.display_name, HORIZONTAL_ALIGNMENT_LEFT, -1, fs).x
		var lb := Rect2(c + Vector2(-tw * 0.5 - 14, r * 0.62), Vector2(tw + 28, fs + 14))
		draw_style_box(UITheme.box(Palette.CARD if open else Color("ddd6c6"), 12, reg.accent_color.darkened(0.2), 2), lb)
		draw_string(font, lb.position + Vector2(14, fs + 3), reg.display_name, HORIZONTAL_ALIGNMENT_LEFT, -1, fs, Palette.INK)
		if not open:
			var lock_c := c + Vector2(0, -r * 0.05)
			draw_circle(lock_c, r * 0.22, Color(Palette.NIGHT, 0.7))
			draw_rect(Rect2(lock_c + Vector2(-r * 0.1, -r * 0.02), Vector2(r * 0.2, r * 0.14)), Color.WHITE)
			draw_arc(lock_c + Vector2(0, -r * 0.02), r * 0.07, PI, TAU, 12, Color.WHITE, 3.0, true)
		else:
			var pulse := 0.5 + 0.5 * sin(_t * 3.0)
			if MeadowLevel.current and id == "meadow":
				draw_circle(c + Vector2(-r * 0.15, -r * 0.05), 8 + pulse * 3, Color(Palette.DANGER, 0.9))
				draw_circle(c + Vector2(-r * 0.15, -r * 0.05), 4, Color.WHITE)
		_rects[id] = Rect2(c - Vector2(r * 1.25, r * 0.85), Vector2(r * 2.5, r * 1.7 + fs + 20))

func _landmarks(id: String, c: Vector2, r: float, open: bool, reg: RegionData) -> void:
	var dark := reg.theme_color.darkened(0.45)
	var lite := reg.accent_color
	match id:
		"meadow":
			for k in 5:
				draw_circle(c + Vector2(-r * 0.6 + k * r * 0.3, r * 0.15 + sin(k) * r * 0.1), r * 0.16, reg.theme_color.darkened(0.2))
			draw_circle(c + Vector2(r * 0.5, -r * 0.25), r * 0.3, Color("4d8a3a"))
			draw_rect(Rect2(c + Vector2(r * 0.46, -r * 0.05), Vector2(r * 0.08, r * 0.25)), Color("6b4a32"))
			draw_line(c + Vector2(-r * 0.3, -r * 0.6), c + Vector2(-r * 0.1, r * 0.5), Color("6ab8d8"), 5.0, true)
			for k in 4:
				var a := _t * 0.8 + k * PI * 0.5
				draw_line(c + Vector2(-r * 0.75, -r * 0.3), c + Vector2(-r * 0.75, -r * 0.3) + Vector2(cos(a), sin(a)) * r * 0.16, Color("f4efe2"), 3.0)
		"emberfall":
			for k in 3:
				var b := c + Vector2(-r * 0.5 + k * r * 0.5, r * 0.25)
				draw_colored_polygon(PackedVector2Array([b + Vector2(-r * 0.3, 0), b + Vector2(0, -r * (0.6 + k * 0.15)), b + Vector2(r * 0.3, 0)]), dark)
				draw_colored_polygon(PackedVector2Array([b + Vector2(-r * 0.08, -r * (0.45 + k * 0.15)), b + Vector2(0, -r * (0.6 + k * 0.15)), b + Vector2(r * 0.08, -r * (0.45 + k * 0.15))]), Color("ff8a3a"))
		"tideglass":
			for k in 3:
				draw_arc(c + Vector2(-r * 0.3 + k * r * 0.3, r * 0.1), r * 0.15, PI, TAU, 12, Color("ffffff"), 3.0, true)
			draw_circle(c + Vector2(r * 0.45, -r * 0.3), r * 0.2, Color("f2d2b6"))
			draw_line(c + Vector2(r * 0.45, -r * 0.3), c + Vector2(r * 0.45, -r * 0.65), Color("6b4a32"), 3.0)
		"frostroot":
			for k in 4:
				var b := c + Vector2(-r * 0.6 + k * r * 0.4, r * 0.2)
				draw_colored_polygon(PackedVector2Array([b + Vector2(-r * 0.15, 0), b + Vector2(0, -r * 0.45), b + Vector2(r * 0.15, 0)]), Color("3f6e72"))
				draw_colored_polygon(PackedVector2Array([b + Vector2(-r * 0.06, -r * 0.3), b + Vector2(0, -r * 0.45), b + Vector2(r * 0.06, -r * 0.3)]), Color.WHITE)
			for k in 3:
				draw_line(c + Vector2(-r * 0.8, -r * (0.5 + k * 0.08)), c + Vector2(r * 0.8, -r * (0.6 + k * 0.08)), Color(lite, 0.6), 3.0)
		"sunpetal":
			for k in 4:
				draw_circle(c + Vector2(-r * 0.5 + k * r * 0.33, -r * 0.05 + (k % 2) * r * 0.2), r * 0.22, Color("2f7a3a"))
			draw_colored_polygon(PackedVector2Array([c + Vector2(-r * 0.15, r * 0.3), c + Vector2(0, -r * 0.15), c + Vector2(r * 0.15, r * 0.3)]), Color("b8a888"))
			draw_circle(c + Vector2(r * 0.5, r * 0.2), r * 0.08, Color("f27fb2"))
		"starfall":
			for k in 3:
				var b := c + Vector2(-r * 0.6 + k * r * 0.6, -r * 0.1 + sin(_t + k) * 4.0)
				draw_colored_polygon(_island(b, r * 0.18, k, lite), Color("8b74e6"))
			for k in 6:
				var p := c + Vector2(cos(k * 1.1) * r * 0.8, -r * 0.5 + sin(k * 2.3) * r * 0.3)
				draw_circle(p, 2.0 + (sin(_t * 3.0 + k) * 0.5 + 0.5) * 2.0, Color("ffe08a"))
