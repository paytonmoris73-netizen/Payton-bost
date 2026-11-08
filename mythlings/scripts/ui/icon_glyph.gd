@tool
class_name IconGlyph
extends Control
## Consistent vector icon set drawn in code (one visual language, scales to any
## DPI, no font glyph fallbacks). Use IconGlyph.make("coin", 28).

@export var icon := "star":
	set(v):
		icon = v
		queue_redraw()
@export var color := Color.WHITE:
	set(v):
		color = v
		queue_redraw()
@export var accent := Color(0, 0, 0, 0)

static func make(name: String, size := 28.0, col := Color.WHITE, acc := Color(0, 0, 0, 0)) -> IconGlyph:
	var g := IconGlyph.new()
	g.icon = name
	g.color = col
	g.accent = acc
	g.custom_minimum_size = Vector2(size, size)
	g.mouse_filter = Control.MOUSE_FILTER_IGNORE
	return g

func _draw() -> void:
	var s := minf(size.x, size.y)
	var o := (size - Vector2(s, s)) * 0.5
	var c := color
	var a := accent if accent.a > 0.0 else c.darkened(0.35)
	var P := func(x: float, y: float) -> Vector2: return o + Vector2(x, y) * s
	var w := maxf(1.5, s * 0.09)
	match icon:
		"coin", "gold":
			draw_circle(P.call(0.5, 0.5), s * 0.42, Color("c98f22"))
			draw_circle(P.call(0.5, 0.47), s * 0.38, Color("f2c14e"))
			draw_arc(P.call(0.5, 0.47), s * 0.26, 0, TAU, 24, Color("d9a032"), w * 0.6, true)
			draw_circle(P.call(0.42, 0.38), s * 0.06, Color(1, 1, 1, 0.7))
		"crystal", "crystals":
			var pts := PackedVector2Array([P.call(0.5, 0.06), P.call(0.82, 0.38), P.call(0.5, 0.94), P.call(0.18, 0.38)])
			draw_colored_polygon(pts, Color("5fb7e0"))
			draw_colored_polygon(PackedVector2Array([P.call(0.5, 0.06), P.call(0.82, 0.38), P.call(0.5, 0.45)]), Color("a8e4fa"))
			draw_colored_polygon(PackedVector2Array([P.call(0.5, 0.45), P.call(0.18, 0.38), P.call(0.5, 0.94)]), Color("3f8fbf"))
		"gem", "star_gems":
			var pts := PackedVector2Array([P.call(0.25, 0.18), P.call(0.75, 0.18), P.call(0.92, 0.4), P.call(0.5, 0.92), P.call(0.08, 0.4)])
			draw_colored_polygon(pts, Color("9a6be0"))
			draw_colored_polygon(PackedVector2Array([P.call(0.25, 0.18), P.call(0.75, 0.18), P.call(0.66, 0.4), P.call(0.34, 0.4)]), Color("d4b8ff"))
			draw_colored_polygon(PackedVector2Array([P.call(0.34, 0.4), P.call(0.66, 0.4), P.call(0.5, 0.92)]), Color("b98cf0"))
		"heart":
			var pts := PackedVector2Array()
			for i in 40:
				var t := TAU * i / 40.0
				var x := 16.0 * pow(sin(t), 3)
				var y := -(13.0 * cos(t) - 5.0 * cos(2 * t) - 2.0 * cos(3 * t) - cos(4 * t))
				pts.append(P.call(0.5 + x / 38.0, 0.48 + y / 38.0))
			draw_colored_polygon(pts, c)
		"heart_empty":
			var pts := PackedVector2Array()
			for i in 41:
				var t := TAU * i / 40.0
				var x := 16.0 * pow(sin(t), 3)
				var y := -(13.0 * cos(t) - 5.0 * cos(2 * t) - 2.0 * cos(3 * t) - cos(4 * t))
				pts.append(P.call(0.5 + x / 38.0, 0.48 + y / 38.0))
			draw_polyline(pts, c, w * 0.8, true)
		"star", "sparkle":
			var pts := PackedVector2Array()
			var n := 5 if icon == "star" else 4
			for i in n * 2:
				var r := (0.46 if i % 2 == 0 else (0.2 if icon == "star" else 0.12))
				var t := -PI / 2 + PI * i / n
				pts.append(P.call(0.5 + cos(t) * r, 0.52 + sin(t) * r))
			draw_colored_polygon(pts, c)
		"leaf", "nature", "sprout":
			var pts := PackedVector2Array()
			for i in 21:
				var t := float(i) / 20.0
				pts.append(P.call(0.2 + t * 0.62, 0.8 - t * 0.62 - sin(t * PI) * 0.18))
			for i in 21:
				var t := 1.0 - float(i) / 20.0
				pts.append(P.call(0.2 + t * 0.62, 0.8 - t * 0.62 + sin(t * PI) * 0.18))
			draw_colored_polygon(pts, c)
			draw_line(P.call(0.14, 0.86), P.call(0.66, 0.34), a, w * 0.6, true)
		"fire", "flame":
			var pts := PackedVector2Array()
			for i in 30:
				var t := TAU * i / 30.0
				var r := 0.3 * (1.0 + 0.55 * maxf(0.0, -sin(t)) * (1.0 + 0.3 * sin(t * 3.0)))
				pts.append(P.call(0.5 + cos(t) * r * 0.85, 0.62 + sin(t) * r * (1.3 if sin(t) < 0 else 0.8)))
			draw_colored_polygon(pts, c)
			draw_circle(P.call(0.5, 0.7), s * 0.12, Color(1, 0.9, 0.6, 0.9))
		"water", "drop", "dew_nectar":
			var pts := PackedVector2Array()
			for i in 24:
				var t := PI * 0.15 + (PI * 1.7) * i / 23.0
				pts.append(P.call(0.5 + cos(t + PI * 0.5) * 0.28, 0.62 + sin(t + PI * 0.5) * 0.28))
			pts.append(P.call(0.5, 0.08))
			draw_colored_polygon(pts, c)
			draw_circle(P.call(0.4, 0.62), s * 0.06, Color(1, 1, 1, 0.6))
		"ice", "snow":
			for k in 3:
				var t := PI * k / 3.0
				draw_line(P.call(0.5 - cos(t) * 0.4, 0.5 - sin(t) * 0.4), P.call(0.5 + cos(t) * 0.4, 0.5 + sin(t) * 0.4), c, w, true)
			draw_circle(P.call(0.5, 0.5), s * 0.08, c)
		"earth", "stone", "rock":
			var pts := PackedVector2Array([P.call(0.15, 0.75), P.call(0.25, 0.4), P.call(0.5, 0.22), P.call(0.78, 0.35), P.call(0.88, 0.72), P.call(0.6, 0.84)])
			draw_colored_polygon(pts, c)
			draw_line(P.call(0.5, 0.22), P.call(0.55, 0.6), a, w * 0.5, true)
			draw_line(P.call(0.55, 0.6), P.call(0.25, 0.4), a, w * 0.5, true)
		"celestial", "moon":
			draw_circle(P.call(0.5, 0.5), s * 0.36, c)
			var pts := PackedVector2Array()
			for i in 24:
				var t := TAU * i / 24.0
				pts.append(P.call(0.64 + cos(t) * 0.28, 0.38 + sin(t) * 0.28))
			draw_colored_polygon(pts, accent if accent.a > 0 else Palette.NIGHT_SOFT)
		"bag", "inventory":
			draw_rect(Rect2(P.call(0.18, 0.32), Vector2(0.64, 0.56) * s), c, true)
			draw_arc(P.call(0.5, 0.34), s * 0.18, PI, TAU, 16, c, w, true)
			draw_rect(Rect2(P.call(0.18, 0.46), Vector2(0.64, 0.08) * s), a, true)
		"book", "journal":
			draw_rect(Rect2(P.call(0.16, 0.18), Vector2(0.68, 0.66) * s), c, true)
			draw_rect(Rect2(P.call(0.22, 0.24), Vector2(0.56, 0.54) * s), a, true)
			draw_line(P.call(0.5, 0.24), P.call(0.5, 0.78), c, w * 0.6)
			var leaf := PackedVector2Array([P.call(0.62, 0.4), P.call(0.72, 0.48), P.call(0.62, 0.62), P.call(0.56, 0.5)])
			draw_colored_polygon(leaf, c)
		"quest", "scroll":
			draw_rect(Rect2(P.call(0.24, 0.16), Vector2(0.52, 0.68) * s), c, true)
			draw_circle(P.call(0.24, 0.2), s * 0.08, a)
			draw_circle(P.call(0.76, 0.8), s * 0.08, a)
			for k in 3:
				draw_line(P.call(0.34, 0.36 + k * 0.14), P.call(0.66, 0.36 + k * 0.14), a, w * 0.5)
		"map":
			var pts := PackedVector2Array([P.call(0.1, 0.24), P.call(0.36, 0.14), P.call(0.64, 0.24), P.call(0.9, 0.14), P.call(0.9, 0.78), P.call(0.64, 0.88), P.call(0.36, 0.78), P.call(0.1, 0.88)])
			draw_colored_polygon(pts, c)
			draw_line(P.call(0.36, 0.14), P.call(0.36, 0.78), a, w * 0.5)
			draw_line(P.call(0.64, 0.24), P.call(0.64, 0.88), a, w * 0.5)
			draw_circle(P.call(0.5, 0.48), s * 0.07, Color("c4583f"))
		"paw", "creatures":
			draw_circle(P.call(0.5, 0.64), s * 0.2, c)
			for p in [Vector2(0.26, 0.4), Vector2(0.42, 0.24), Vector2(0.58, 0.24), Vector2(0.74, 0.4)]:
				draw_circle(P.call(p.x, p.y), s * 0.09, c)
		"gear", "settings":
			for k in 8:
				var t := TAU * k / 8.0
				draw_line(P.call(0.5, 0.5), P.call(0.5 + cos(t) * 0.42, 0.5 + sin(t) * 0.42), c, s * 0.16)
			draw_circle(P.call(0.5, 0.5), s * 0.3, c)
			draw_circle(P.call(0.5, 0.5), s * 0.12, a if accent.a > 0 else Color(0, 0, 0, 0.35))
		"bell":
			var pts := PackedVector2Array()
			for i in 17:
				var t := PI + PI * i / 16.0
				pts.append(P.call(0.5 + cos(t) * 0.28, 0.46 + sin(t) * 0.3))
			pts.append(P.call(0.82, 0.74))
			pts.append(P.call(0.18, 0.74))
			draw_colored_polygon(pts, c)
			draw_circle(P.call(0.5, 0.8), s * 0.08, c)
		"cart", "market":
			draw_colored_polygon(PackedVector2Array([P.call(0.12, 0.24), P.call(0.88, 0.24), P.call(0.8, 0.44), P.call(0.2, 0.44)]), Color("e8b64c"))
			draw_rect(Rect2(P.call(0.18, 0.44), Vector2(0.64, 0.42) * s), c, true)
			draw_rect(Rect2(P.call(0.42, 0.6), Vector2(0.16, 0.26) * s), a, true)
			for k in 4:
				draw_line(P.call(0.12 + k * 0.25, 0.24), P.call(0.2 + k * 0.2, 0.44), Color("c4583f"), w * 0.5)
		"hand", "interact":
			draw_circle(P.call(0.5, 0.62), s * 0.24, c)
			for k in 4:
				draw_line(P.call(0.32 + k * 0.12, 0.6), P.call(0.32 + k * 0.12, 0.2 + absf(k - 1.5) * 0.06), c, s * 0.1)
			draw_line(P.call(0.3, 0.66), P.call(0.14, 0.48), c, s * 0.1)
		"talk":
			draw_rect(Rect2(P.call(0.12, 0.2), Vector2(0.76, 0.48) * s), c, true)
			draw_colored_polygon(PackedVector2Array([P.call(0.3, 0.66), P.call(0.48, 0.66), P.call(0.28, 0.86)]), c)
			for k in 3:
				draw_circle(P.call(0.32 + k * 0.18, 0.44), s * 0.05, a)
		"hammer":
			draw_line(P.call(0.3, 0.82), P.call(0.62, 0.4), c, s * 0.12)
			draw_colored_polygon(PackedVector2Array([P.call(0.44, 0.22), P.call(0.72, 0.12), P.call(0.86, 0.36), P.call(0.6, 0.48)]), a)
		"chest", "treasure":
			draw_rect(Rect2(P.call(0.14, 0.42), Vector2(0.72, 0.42) * s), Color("8a5a32"), true)
			draw_rect(Rect2(P.call(0.14, 0.24), Vector2(0.72, 0.2) * s), Color("a06a3a"), true)
			draw_rect(Rect2(P.call(0.14, 0.42), Vector2(0.72, 0.06) * s), Color("e8b64c"), true)
			draw_rect(Rect2(P.call(0.44, 0.4), Vector2(0.12, 0.16) * s), Color("e8b64c"), true)
		"trophy", "achievements":
			draw_colored_polygon(PackedVector2Array([P.call(0.26, 0.16), P.call(0.74, 0.16), P.call(0.68, 0.48), P.call(0.32, 0.48)]), c)
			draw_circle(P.call(0.5, 0.46), s * 0.18, c)
			draw_rect(Rect2(P.call(0.45, 0.58), Vector2(0.1, 0.16) * s), c, true)
			draw_rect(Rect2(P.call(0.3, 0.74), Vector2(0.4, 0.1) * s), c, true)
			draw_arc(P.call(0.26, 0.3), s * 0.1, PI * 0.5, PI * 1.5, 10, c, w * 0.6)
			draw_arc(P.call(0.74, 0.3), s * 0.1, -PI * 0.5, PI * 0.5, 10, c, w * 0.6)
		"log", "wood":
			draw_rect(Rect2(P.call(0.12, 0.36), Vector2(0.7, 0.3) * s), Color("8a5a32"), true)
			draw_circle(P.call(0.82, 0.51), s * 0.15, Color("d8b57e"))
			draw_arc(P.call(0.82, 0.51), s * 0.08, 0, TAU, 12, Color("a07a4a"), w * 0.4)
		"flower", "petals":
			for k in 5:
				var t := TAU * k / 5.0 - PI / 2
				draw_circle(P.call(0.5 + cos(t) * 0.2, 0.5 + sin(t) * 0.2), s * 0.15, c)
			draw_circle(P.call(0.5, 0.5), s * 0.11, Color("f5d04a"))
		"berry", "sunberry":
			for p in [Vector2(0.38, 0.6), Vector2(0.62, 0.6), Vector2(0.5, 0.4)]:
				draw_circle(P.call(p.x, p.y), s * 0.17, c)
				draw_circle(P.call(p.x - 0.05, p.y - 0.05), s * 0.04, Color(1, 1, 1, 0.6))
			draw_colored_polygon(PackedVector2Array([P.call(0.5, 0.24), P.call(0.66, 0.12), P.call(0.6, 0.28)]), Color("5fa857"))
		"cookie":
			draw_circle(P.call(0.5, 0.5), s * 0.38, c)
			for p in [Vector2(0.38, 0.4), Vector2(0.6, 0.36), Vector2(0.56, 0.6), Vector2(0.36, 0.62)]:
				draw_circle(P.call(p.x, p.y), s * 0.05, a)
		"shell":
			for k in 5:
				var t := PI + PI * k / 4.0
				draw_line(P.call(0.5, 0.8), P.call(0.5 + cos(t) * 0.38, 0.6 + sin(t) * 0.4), c, s * 0.14)
		"lock":
			draw_rect(Rect2(P.call(0.24, 0.44), Vector2(0.52, 0.42) * s), c, true)
			draw_arc(P.call(0.5, 0.44), s * 0.17, PI, TAU, 16, c, w, true)
			draw_circle(P.call(0.5, 0.62), s * 0.06, a)
		"person", "profile":
			draw_circle(P.call(0.5, 0.32), s * 0.18, c)
			draw_colored_polygon(PackedVector2Array([P.call(0.18, 0.88), P.call(0.24, 0.62), P.call(0.5, 0.54), P.call(0.76, 0.62), P.call(0.82, 0.88)]), c)
		"close":
			draw_line(P.call(0.25, 0.25), P.call(0.75, 0.75), c, w * 1.2, true)
			draw_line(P.call(0.75, 0.25), P.call(0.25, 0.75), c, w * 1.2, true)
		"back":
			draw_polyline(PackedVector2Array([P.call(0.62, 0.2), P.call(0.32, 0.5), P.call(0.62, 0.8)]), c, w * 1.2, true)
		"search":
			draw_arc(P.call(0.44, 0.44), s * 0.24, 0, TAU, 24, c, w, true)
			draw_line(P.call(0.62, 0.62), P.call(0.84, 0.84), c, w * 1.2, true)
		"jump":
			draw_polyline(PackedVector2Array([P.call(0.22, 0.56), P.call(0.5, 0.26), P.call(0.78, 0.56)]), c, w * 1.4, true)
			draw_line(P.call(0.3, 0.78), P.call(0.7, 0.78), c, w * 1.2, true)
		"camera":
			draw_arc(P.call(0.5, 0.5), s * 0.32, -0.6, PI + 0.6, 24, c, w, true)
			draw_colored_polygon(PackedVector2Array([P.call(0.06, 0.52), P.call(0.32, 0.52), P.call(0.19, 0.7)]), c)
			draw_circle(P.call(0.5, 0.5), s * 0.09, c)
		"ride", "saddle":
			draw_arc(P.call(0.5, 0.55), s * 0.3, PI, TAU, 16, c, w * 1.3, true)
			draw_line(P.call(0.2, 0.55), P.call(0.8, 0.55), c, w)
			draw_line(P.call(0.5, 0.55), P.call(0.5, 0.86), c, w)
		"play":
			draw_colored_polygon(PackedVector2Array([P.call(0.3, 0.18), P.call(0.82, 0.5), P.call(0.3, 0.82)]), c)
		"pause":
			draw_rect(Rect2(P.call(0.26, 0.2), Vector2(0.16, 0.6) * s), c, true)
			draw_rect(Rect2(P.call(0.58, 0.2), Vector2(0.16, 0.6) * s), c, true)
		"check":
			draw_polyline(PackedVector2Array([P.call(0.18, 0.52), P.call(0.42, 0.74), P.call(0.84, 0.26)]), c, w * 1.4, true)
		"arrow":
			draw_colored_polygon(PackedVector2Array([P.call(0.5, 0.06), P.call(0.86, 0.72), P.call(0.5, 0.56), P.call(0.14, 0.72)]), c)
		"friends":
			draw_circle(P.call(0.36, 0.34), s * 0.14, c)
			draw_circle(P.call(0.66, 0.38), s * 0.12, a)
			draw_colored_polygon(PackedVector2Array([P.call(0.1, 0.84), P.call(0.16, 0.6), P.call(0.36, 0.52), P.call(0.56, 0.6), P.call(0.62, 0.84)]), c)
		"collection":
			for k in 3:
				draw_rect(Rect2(P.call(0.14 + k * 0.08, 0.5 - k * 0.14), Vector2(0.5, 0.34) * s), c.darkened(0.15 * (2 - k)), true)
		_:
			draw_circle(P.call(0.5, 0.5), s * 0.3, c)

static func element_icon(e: String) -> String:
	return {"nature": "leaf", "fire": "fire", "water": "water", "ice": "ice", "earth": "earth", "celestial": "star"}.get(e, "star")

static func currency_icon(c: String) -> String:
	return {"gold": "coin", "crystals": "crystal", "star_gems": "gem"}.get(c, "coin")
