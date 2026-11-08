class_name CreaturePortrait
extends Control
## Lightweight 2D emblem for list cards (no per-card 3D viewport, which would be
## too costly on phones): element-tinted medallion, or a mysterious silhouette.

var data: CreatureData
var discovered := false

func setup(c: CreatureData, disc: bool) -> void:
	data = c
	discovered = disc
	mouse_filter = Control.MOUSE_FILTER_IGNORE
	queue_redraw()

func _draw() -> void:
	if data == null:
		return
	var s := minf(size.x, size.y)
	var c := size * 0.5
	var pal := data.palette
	var base := pal[0] if pal.size() > 0 else Color.GRAY
	var acc := pal[1] if pal.size() > 1 else base.lightened(0.3)
	var el := Palette.element_color(data.primary_element())
	if not discovered:
		draw_circle(c, s * 0.44, Color("d9d1c0"))
		_body(c, s, Color("8a8478"), Color("8a8478"), true)
		draw_string(UITheme.heading_font, c + Vector2(-s * 0.1, s * 0.16), "?", HORIZONTAL_ALIGNMENT_CENTER, -1, int(s * 0.36), Color("f6efdf"))
		return
	draw_circle(c, s * 0.46, el.lerp(Color.WHITE, 0.65))
	draw_arc(c, s * 0.46, 0, TAU, 48, el, 3.0, true)
	_body(c, s, base, acc, false)

func _body(c: Vector2, s: float, base: Color, acc: Color, sil: bool) -> void:
	# A tiny stylised figure by locomotion type so silhouettes differ per species.
	var r := s * 0.22
	match data.locomotion:
		"float":
			draw_circle(c + Vector2(0, r * 0.1), r, base)
			draw_colored_polygon(PackedVector2Array([c + Vector2(-r * 0.7, -r * 0.5), c + Vector2(0, -r * 1.7), c + Vector2(r * 0.7, -r * 0.5)]), base)
		"fly":
			draw_circle(c, r * 0.8, base)
			draw_colored_polygon(PackedVector2Array([c + Vector2(-r * 0.4, -r * 0.2), c + Vector2(-r * 2.0, -r * 1.0), c + Vector2(-r * 1.4, r * 0.4)]), acc)
			draw_colored_polygon(PackedVector2Array([c + Vector2(r * 0.4, -r * 0.2), c + Vector2(r * 2.0, -r * 1.0), c + Vector2(r * 1.4, r * 0.4)]), acc)
		"hop":
			draw_circle(c + Vector2(0, r * 0.2), r * 1.05, base)
			draw_colored_polygon(PackedVector2Array([c + Vector2(-r * 0.6, -r * 0.6), c + Vector2(-r * 1.1, -r * 1.9), c + Vector2(-r * 0.1, -r * 0.8)]), acc)
			draw_colored_polygon(PackedVector2Array([c + Vector2(r * 0.6, -r * 0.6), c + Vector2(r * 1.1, -r * 1.9), c + Vector2(r * 0.1, -r * 0.8)]), acc)
		"swim":
			draw_set_transform(c, 0, Vector2(1.6, 0.8))
			draw_circle(Vector2.ZERO, r, base)
			draw_set_transform(Vector2.ZERO, 0, Vector2.ONE)
			draw_colored_polygon(PackedVector2Array([c + Vector2(r * 1.4, 0), c + Vector2(r * 2.1, -r * 0.6), c + Vector2(r * 2.1, r * 0.6)]), acc)
		_:
			draw_set_transform(c + Vector2(r * 0.2, r * 0.3), 0, Vector2(1.5, 0.9))
			draw_circle(Vector2.ZERO, r * 0.85, base)
			draw_set_transform(Vector2.ZERO, 0, Vector2.ONE)
			draw_circle(c + Vector2(-r * 1.0, -r * 0.3), r * 0.62, base)
			draw_colored_polygon(PackedVector2Array([c + Vector2(-r * 1.4, -r * 0.6), c + Vector2(-r * 1.25, -r * 1.4), c + Vector2(-r * 0.9, -r * 0.8)]), acc if not sil else base)
			draw_line(c + Vector2(r * 1.3, r * 0.2), c + Vector2(r * 1.9, -r * 0.6), acc if not sil else base, r * 0.35, true)
			for x in [-0.6, -0.1, 0.5, 1.0]:
				draw_line(c + Vector2(r * x, r * 0.8), c + Vector2(r * x, r * 1.4), base, r * 0.22)
	if not sil:
		var eye_c := c + (Vector2(-r * 1.15, -r * 0.35) if data.locomotion in ["quad", "waddle"] else Vector2(-r * 0.3, 0))
		draw_circle(eye_c, r * 0.14, Color("1d1a22"))
		draw_circle(eye_c + Vector2(r * 0.05, -r * 0.05), r * 0.05, Color.WHITE)
		if not (data.locomotion in ["quad", "waddle"]):
			draw_circle(eye_c + Vector2(r * 0.6, 0), r * 0.14, Color("1d1a22"))
			draw_circle(eye_c + Vector2(r * 0.65, -r * 0.05), r * 0.05, Color.WHITE)
