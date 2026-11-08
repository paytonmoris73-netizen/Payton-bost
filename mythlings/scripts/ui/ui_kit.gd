class_name UIKit
## Small builder helpers so screens stay declarative and consistent.

static func label(text: String, variation := "", size := 0, color := Color(0, 0, 0, 0), wrap := false) -> Label:
	var l := Label.new()
	l.text = text
	if variation != "":
		l.theme_type_variation = variation
	if size > 0:
		l.add_theme_font_size_override("font_size", size)
	if color.a > 0.0:
		l.add_theme_color_override("font_color", color)
	if wrap:
		l.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
		l.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	return l

static func button(text: String, icon := "", variation := "", min_h := 64.0, icon_size := 28.0) -> Button:
	UITheme.fonts()
	var b := Button.new()
	if variation != "":
		b.theme_type_variation = variation
	b.custom_minimum_size.y = min_h
	b.focus_mode = Control.FOCUS_NONE
	if icon == "":
		b.text = text
	else:
		# Vector icon + label laid out inside the button.
		var col := Color.WHITE if variation in ["PrimaryButton", "HudButton"] else Palette.MOSS_DARK
		var h := HBoxContainer.new()
		h.alignment = BoxContainer.ALIGNMENT_CENTER
		h.add_theme_constant_override("separation", 8)
		h.mouse_filter = Control.MOUSE_FILTER_IGNORE
		h.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
		var g := IconGlyph.make(icon, icon_size, col)
		g.name = "Icon"
		h.add_child(g)
		if text != "":
			var l := Label.new()
			l.text = text
			l.name = "Text"
			l.add_theme_font_override("font", UITheme.bold_font if UITheme.bold_font else null)
			l.add_theme_font_size_override("font_size", b.get_theme_font_size("font_size") if b.has_theme_font_size("font_size") else 22)
			var fc := Color.WHITE if variation in ["PrimaryButton", "HudButton"] else Palette.INK
			l.add_theme_color_override("font_color", fc)
			l.mouse_filter = Control.MOUSE_FILTER_IGNORE
			h.add_child(l)
		b.add_child(h)
		b.custom_minimum_size.x = maxf(b.custom_minimum_size.x, icon_size + 36 + (text.length() * 11.5 if text != "" else 0))
	attach_press_feedback(b)
	return b

static func set_button_text(b: Button, text: String) -> void:
	var l := b.find_child("Text", true, false) as Label
	if l:
		l.text = text
	else:
		b.text = text

static func attach_press_feedback(b: BaseButton) -> void:
	b.button_down.connect(func():
		b.pivot_offset = b.size * 0.5
		var tw := b.create_tween()
		tw.tween_property(b, "scale", Vector2.ONE * 0.95, 0.06))
	b.button_up.connect(func():
		var tw := b.create_tween()
		tw.tween_property(b, "scale", Vector2.ONE, 0.18).set_trans(Tween.TRANS_BACK).set_ease(Tween.EASE_OUT))
	b.pressed.connect(func(): Audio.play_sfx("ui_click", randf_range(0.97, 1.03), -4.0))

static func hbox(sep := 10) -> HBoxContainer:
	var h := HBoxContainer.new()
	h.add_theme_constant_override("separation", sep)
	return h

static func vbox(sep := 10) -> VBoxContainer:
	var v := VBoxContainer.new()
	v.add_theme_constant_override("separation", sep)
	return v

static func card(variation := "Card") -> PanelContainer:
	var p := PanelContainer.new()
	p.theme_type_variation = variation
	return p

static func spacer(expand := true) -> Control:
	var c := Control.new()
	if expand:
		c.size_flags_horizontal = Control.SIZE_EXPAND_FILL
		c.size_flags_vertical = Control.SIZE_EXPAND_FILL
	return c

static func pill(text: String, bg: Color, fg := Color.WHITE, icon := "") -> PanelContainer:
	var p := PanelContainer.new()
	var sb := UITheme.box(bg, 99, Color(0, 0, 0, 0), 0, 0, 10)
	sb.content_margin_top = 3
	sb.content_margin_bottom = 3
	p.add_theme_stylebox_override("panel", sb)
	var h := hbox(5)
	if icon != "":
		h.add_child(IconGlyph.make(icon, 18, fg))
	var l := label(text, "", 16, fg)
	l.add_theme_font_override("font", UITheme.bold_font)
	h.add_child(l)
	p.add_child(h)
	return p

static func currency_chip(currency: String, amount: int, dark := false) -> HBoxContainer:
	var h := hbox(6)
	h.add_child(IconGlyph.make(IconGlyph.currency_icon(currency), 26))
	var l := label(str(amount), "HudLabel" if dark else "", 22)
	if not dark:
		l.add_theme_font_override("font", UITheme.bold_font)
	l.name = "Amount"
	h.add_child(l)
	return h

static func hearts(level: int, max_level := 5, size := 20.0) -> HBoxContainer:
	var h := hbox(2)
	for i in max_level:
		h.add_child(IconGlyph.make("heart" if i < level else "heart_empty", size, Color("e8708f") if i < level else Color("d8b8c0")))
	return h

static func scroll(child: Control) -> ScrollContainer:
	var s := ScrollContainer.new()
	s.horizontal_scroll_mode = ScrollContainer.SCROLL_MODE_DISABLED
	s.size_flags_vertical = Control.SIZE_EXPAND_FILL
	s.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	child.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	s.add_child(child)
	return s

static func clear(n: Node) -> void:
	for c in n.get_children():
		n.remove_child(c)
		c.queue_free()

static func rarity_pill(r: String) -> PanelContainer:
	return pill(r.capitalize(), Palette.rarity_color(r))

static func element_pill(e: String) -> PanelContainer:
	return pill(e.capitalize(), Palette.element_color(e), Color.WHITE, IconGlyph.element_icon(e))
