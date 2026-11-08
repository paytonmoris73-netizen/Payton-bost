class_name UITheme
## Builds the single Theme used by every screen: warm parchment cards, moss
## accents, Fredoka headings and Nunito body text. Change the look here only.

static var _theme: Theme
static var heading_font: FontVariation
static var body_font: FontVariation
static var bold_font: FontVariation

static func fonts() -> void:
	if heading_font:
		return
	var fredoka: FontFile = load("res://assets/fonts/Fredoka.ttf")
	var nunito: FontFile = load("res://assets/fonts/Nunito.ttf")
	heading_font = FontVariation.new()
	heading_font.base_font = fredoka
	heading_font.variation_opentype = {TextServerManager.get_primary_interface().name_to_tag("wght"): 600}
	body_font = FontVariation.new()
	body_font.base_font = nunito
	body_font.variation_opentype = {TextServerManager.get_primary_interface().name_to_tag("wght"): 600}
	bold_font = FontVariation.new()
	bold_font.base_font = nunito
	bold_font.variation_opentype = {TextServerManager.get_primary_interface().name_to_tag("wght"): 800}

static func box(bg: Color, radius := 18, border := Color(0, 0, 0, 0), border_w := 0, shadow := 0, pad := 14) -> StyleBoxFlat:
	var s := StyleBoxFlat.new()
	s.bg_color = bg
	s.set_corner_radius_all(radius)
	if border_w > 0:
		s.border_color = border
		s.set_border_width_all(border_w)
	if shadow > 0:
		s.shadow_color = Color(0, 0, 0, 0.22)
		s.shadow_size = shadow
		s.shadow_offset = Vector2(0, shadow * 0.4)
	s.content_margin_left = pad
	s.content_margin_right = pad
	s.content_margin_top = pad * 0.7
	s.content_margin_bottom = pad * 0.7
	s.anti_aliasing = true
	return s

static func get_theme() -> Theme:
	if _theme:
		return _theme
	fonts()
	var t := Theme.new()
	t.default_font = body_font
	t.default_font_size = 22
	# Labels
	t.set_color("font_color", "Label", Palette.INK)
	t.set_type_variation("Heading", "Label")
	t.set_font("font", "Heading", heading_font)
	t.set_font_size("font_size", "Heading", 34)
	t.set_color("font_color", "Heading", Palette.INK)
	t.set_type_variation("Title", "Label")
	t.set_font("font", "Title", heading_font)
	t.set_font_size("font_size", "Title", 26)
	t.set_type_variation("Caption", "Label")
	t.set_font_size("font_size", "Caption", 18)
	t.set_color("font_color", "Caption", Palette.INK_SOFT)
	t.set_type_variation("HudLabel", "Label")
	t.set_font("font", "HudLabel", bold_font)
	t.set_font_size("font_size", "HudLabel", 22)
	t.set_color("font_color", "HudLabel", Color.WHITE)
	t.set_color("font_outline_color", "HudLabel", Color(0.05, 0.1, 0.08, 0.75))
	t.set_constant("outline_size", "HudLabel", 6)
	# Buttons
	var btn_n := box(Palette.CARD, 16, Palette.PARCHMENT_DEEP, 2, 0, 16)
	var btn_h := box(Color("fffdf6"), 16, Palette.MOSS_LIGHT, 2, 0, 16)
	var btn_p := box(Palette.PARCHMENT_DEEP, 16, Palette.MOSS, 2, 0, 16)
	var btn_d := box(Color("e9e3d6"), 16, Color("ddd5c4"), 2, 0, 16)
	for st in [["normal", btn_n], ["hover", btn_h], ["pressed", btn_p], ["disabled", btn_d], ["focus", box(Color(0, 0, 0, 0), 16, Palette.GOLD, 3, 0, 16)]]:
		t.set_stylebox(st[0], "Button", st[1])
	t.set_font("font", "Button", bold_font)
	t.set_font_size("font_size", "Button", 22)
	t.set_color("font_color", "Button", Palette.INK)
	t.set_color("font_hover_color", "Button", Palette.MOSS_DARK)
	t.set_color("font_pressed_color", "Button", Palette.MOSS_DARK)
	t.set_color("font_disabled_color", "Button", Color("a7a091"))
	# Primary (moss) button variation
	t.set_type_variation("PrimaryButton", "Button")
	t.set_stylebox("normal", "PrimaryButton", box(Palette.MOSS, 18, Palette.MOSS_DARK, 0, 0, 20))
	t.set_stylebox("hover", "PrimaryButton", box(Palette.MOSS.lightened(0.08), 18, Palette.MOSS_DARK, 0, 0, 20))
	t.set_stylebox("pressed", "PrimaryButton", box(Palette.MOSS_DARK, 18, Palette.MOSS_DARK, 0, 0, 20))
	t.set_stylebox("disabled", "PrimaryButton", box(Color("b9c4b5"), 18, Color(0, 0, 0, 0), 0, 0, 20))
	t.set_color("font_color", "PrimaryButton", Color.WHITE)
	t.set_color("font_hover_color", "PrimaryButton", Color.WHITE)
	t.set_color("font_pressed_color", "PrimaryButton", Color("eaf5e4"))
	t.set_color("font_disabled_color", "PrimaryButton", Color("eef2ec"))
	t.set_type_variation("GoldButton", "Button")
	t.set_stylebox("normal", "GoldButton", box(Palette.GOLD, 18, Palette.GOLD_DARK, 0, 0, 20))
	t.set_stylebox("hover", "GoldButton", box(Palette.GOLD.lightened(0.1), 18, Palette.GOLD_DARK, 0, 0, 20))
	t.set_stylebox("pressed", "GoldButton", box(Palette.GOLD_DARK, 18, Palette.GOLD_DARK, 0, 0, 20))
	t.set_stylebox("disabled", "GoldButton", box(Color("d8cfb8"), 18, Color(0, 0, 0, 0), 0, 0, 20))
	t.set_color("font_color", "GoldButton", Palette.INK)
	t.set_type_variation("TabButton", "Button")
	t.set_stylebox("normal", "TabButton", box(Color(0, 0, 0, 0), 14, Color(0, 0, 0, 0), 0, 0, 14))
	t.set_stylebox("hover", "TabButton", box(Color(1, 1, 1, 0.5), 14, Color(0, 0, 0, 0), 0, 0, 14))
	t.set_stylebox("pressed", "TabButton", box(Palette.MOSS, 14, Color(0, 0, 0, 0), 0, 0, 14))
	t.set_stylebox("hover_pressed", "TabButton", box(Palette.MOSS, 14, Color(0, 0, 0, 0), 0, 0, 14))
	t.set_color("font_pressed_color", "TabButton", Color.WHITE)
	t.set_color("font_hover_pressed_color", "TabButton", Color.WHITE)
	t.set_type_variation("HudButton", "Button")
	for st in ["normal", "hover", "pressed", "disabled", "focus"]:
		var col := Color(0.07, 0.12, 0.1, 0.5) if st != "pressed" else Color(0.07, 0.12, 0.1, 0.72)
		if st == "focus":
			col = Color(0, 0, 0, 0)
		t.set_stylebox(st, "HudButton", box(col, 22, Color(1, 1, 1, 0.22), 2 if st != "focus" else 0, 0, 10))
	t.set_color("font_color", "HudButton", Color.WHITE)
	t.set_color("font_hover_color", "HudButton", Color.WHITE)
	t.set_color("font_pressed_color", "HudButton", Palette.GOLD)
	t.set_font_size("font_size", "HudButton", 17)
	# Panels
	t.set_stylebox("panel", "PanelContainer", box(Palette.PARCHMENT, 26, Color("e2d5b8"), 2, 18, 22))
	t.set_type_variation("Card", "PanelContainer")
	t.set_stylebox("panel", "Card", box(Palette.CARD, 18, Color("eadfc6"), 2, 0, 14))
	t.set_type_variation("DarkCard", "PanelContainer")
	t.set_stylebox("panel", "DarkCard", box(Color(0.07, 0.12, 0.1, 0.62), 20, Color(1, 1, 1, 0.12), 2, 0, 14))
	t.set_type_variation("Pill", "PanelContainer")
	t.set_stylebox("panel", "Pill", box(Palette.MOSS, 99, Color(0, 0, 0, 0), 0, 0, 10))
	# Inputs
	t.set_stylebox("normal", "LineEdit", box(Palette.CARD, 14, Palette.PARCHMENT_DEEP, 2, 0, 14))
	t.set_stylebox("focus", "LineEdit", box(Palette.CARD, 14, Palette.MOSS_LIGHT, 2, 0, 14))
	t.set_color("font_color", "LineEdit", Palette.INK)
	t.set_color("font_placeholder_color", "LineEdit", Color("a7a091"))
	t.set_stylebox("background", "ProgressBar", box(Color(0, 0, 0, 0.12), 99, Color(0, 0, 0, 0), 0, 0, 0))
	t.set_stylebox("fill", "ProgressBar", box(Palette.MOSS, 99, Color(0, 0, 0, 0), 0, 0, 0))
	t.set_type_variation("GoldBar", "ProgressBar")
	t.set_stylebox("fill", "GoldBar", box(Palette.GOLD, 99, Color(0, 0, 0, 0), 0, 0, 0))
	t.set_type_variation("HeartBar", "ProgressBar")
	t.set_stylebox("fill", "HeartBar", box(Color("e8708f"), 99, Color(0, 0, 0, 0), 0, 0, 0))
	t.set_stylebox("slider", "HSlider", box(Color(0, 0, 0, 0.14), 99, Color(0, 0, 0, 0), 0, 0, 4))
	t.set_stylebox("grabber_area", "HSlider", box(Palette.MOSS, 99, Color(0, 0, 0, 0), 0, 0, 4))
	t.set_stylebox("grabber_area_highlight", "HSlider", box(Palette.MOSS_LIGHT, 99, Color(0, 0, 0, 0), 0, 0, 4))
	t.set_icon("grabber", "HSlider", _circle_tex(28, Palette.CARD, Palette.MOSS))
	t.set_icon("grabber_highlight", "HSlider", _circle_tex(28, Color.WHITE, Palette.MOSS))
	t.set_stylebox("panel", "PopupMenu", box(Palette.CARD, 14, Palette.PARCHMENT_DEEP, 2, 8, 10))
	t.set_font_size("font_size", "PopupMenu", 22)
	t.set_stylebox("normal", "OptionButton", btn_n)
	t.set_stylebox("hover", "OptionButton", btn_h)
	t.set_stylebox("pressed", "OptionButton", btn_p)
	t.set_constant("separation", "VBoxContainer", 10)
	t.set_constant("separation", "HBoxContainer", 10)
	t.set_constant("h_separation", "GridContainer", 12)
	t.set_constant("v_separation", "GridContainer", 12)
	var scroll := StyleBoxFlat.new()
	scroll.bg_color = Color(0, 0, 0, 0.1)
	scroll.set_corner_radius_all(99)
	scroll.content_margin_left = 4
	scroll.content_margin_right = 4
	t.set_stylebox("scroll", "VScrollBar", scroll)
	var grab := StyleBoxFlat.new()
	grab.bg_color = Color(0.25, 0.35, 0.3, 0.45)
	grab.set_corner_radius_all(99)
	t.set_stylebox("grabber", "VScrollBar", grab)
	t.set_stylebox("grabber_highlight", "VScrollBar", grab)
	t.set_stylebox("grabber_pressed", "VScrollBar", grab)
	t.set_color("font_color", "CheckButton", Palette.INK)
	t.set_font_size("font_size", "CheckButton", 22)
	_theme = t
	return t

static func _circle_tex(sz: int, fill: Color, ring: Color) -> ImageTexture:
	var img := Image.create(sz, sz, false, Image.FORMAT_RGBA8)
	var c := Vector2(sz, sz) * 0.5
	for y in sz:
		for x in sz:
			var d := Vector2(x + 0.5, y + 0.5).distance_to(c)
			var a := clampf(sz * 0.5 - d, 0.0, 1.0)
			var col := ring if d > sz * 0.5 - 4.0 else fill
			img.set_pixel(x, y, Color(col, a))
	return ImageTexture.create_from_image(img)
