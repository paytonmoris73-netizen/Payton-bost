class_name GameHUD
extends Control
## In-game heads-up display. Keeps the world visible: compact corner cards,
## contextual action buttons and a bottom navigation bar.

var player: Player
var level: MeadowLevel
var joystick: VirtualJoystick
var cam_zone: CameraDragZone
var _xp_bar: ProgressBar
var _lvl_label: Label
var _name_label: Label
var _cur_labels: Dictionary = {}
var _quest_card: PanelContainer
var _quest_title: Label
var _quest_obj: Label
var _quest_arrow: IconGlyph
var _quest_dist: Label
var _interact_btn: Button
var _interact_label: Label
var _ability_btn: Button
var _ability_label: Label
var _ab_buttons: Dictionary = {}  # slot -> Button
var _ab_labels: Dictionary = {}
var _ab_cd: Dictionary = {}
var _hint: Label
var _swap_btn: Button
var _swap_box: PanelContainer
var _hint_t := 0.0
var _useful := ""
var _ride_btn: Button
var _jump_btn: Button
var _cam_btn: Button
var _toasts: VBoxContainer
var _banner: Label
var _banner_sub: Label
var _dialogue: PanelContainer
var _dlg_name: Label
var _dlg_text: RichTextLabel
var _dlg_queue: Array = []
var _dlg_lines: Array = []
var _dlg_i := 0
var _fps: Label
var _nav: HBoxContainer
var _bell_dot: Control
var _cam_far := false
var _margin: MarginContainer

signal nav_pressed(panel_name: String)

func build(p: Player, l: MeadowLevel) -> void:
	player = p
	level = l
	theme = UITheme.get_theme()
	set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	mouse_filter = Control.MOUSE_FILTER_IGNORE
	_margin = MarginContainer.new()
	_margin.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	_margin.mouse_filter = Control.MOUSE_FILTER_IGNORE
	add_child(_margin)
	_apply_safe_area()
	get_viewport().size_changed.connect(_apply_safe_area)
	var root := Control.new()
	root.mouse_filter = Control.MOUSE_FILTER_IGNORE
	_margin.add_child(root)
	# Touch zones first (behind buttons).
	joystick = VirtualJoystick.new()
	joystick.anchor_top = 0.38
	joystick.anchor_bottom = 1.0
	joystick.anchor_right = 0.4
	joystick.offset_bottom = -96
	root.add_child(joystick)
	joystick.changed.connect(func(v): player.touch_move = v)
	cam_zone = CameraDragZone.new()
	cam_zone.anchor_left = 0.4
	cam_zone.anchor_right = 1.0
	cam_zone.anchor_bottom = 1.0
	cam_zone.offset_bottom = -96
	cam_zone.player = player
	root.add_child(cam_zone)
	_build_top_left(root)
	_build_top_right(root)
	_build_nav(root)
	_build_actions(root)
	_build_overlays(root)
	cam_zone.blockers = [_interact_btn, _ride_btn, _jump_btn, _cam_btn, _nav, _quest_card, _swap_btn, _swap_box] + _ab_buttons.values()
	# Signals
	Events.xp_changed.connect(func(_a, _b, _c): _refresh_profile())
	Events.currency_changed.connect(func(_c, _a): _refresh_currencies())
	Events.toast.connect(show_toast)
	Events.request_dialogue.connect(queue_dialogue)
	Events.companion_changed.connect(func(_c): _refresh_ability())
	Events.quest_progress.connect(func(_q): _refresh_quest())
	Events.quest_started.connect(func(_q): _refresh_quest())
	Events.quest_completed.connect(func(_q): _refresh_quest())
	Events.achievement_unlocked.connect(func(_a): _bell_dot.visible = true)
	Events.settings_changed.connect(_on_settings)
	player.interactable_changed.connect(_on_interactable)
	player.mounted_changed.connect(func(_c): _refresh_ride())
	_refresh_profile()
	_refresh_currencies()
	_refresh_ability()
	_refresh_quest()
	_on_interactable(null)

func _apply_safe_area() -> void:
	var safe := DisplayServer.get_display_safe_area()
	var screen := DisplayServer.screen_get_size()
	var vp := get_viewport_rect().size
	var m := Vector4(18, 14, 18, 12)
	if screen.x > 0 and safe.size.x > 0 and OS.has_feature("mobile"):
		var sx := vp.x / screen.x
		var sy := vp.y / screen.y
		m.x = maxf(m.x, safe.position.x * sx + 8)
		m.y = maxf(m.y, safe.position.y * sy + 6)
		m.z = maxf(m.z, (screen.x - safe.end.x) * sx + 8)
		m.w = maxf(m.w, (screen.y - safe.end.y) * sy + 6)
	_margin.add_theme_constant_override("margin_left", int(m.x))
	_margin.add_theme_constant_override("margin_top", int(m.y))
	_margin.add_theme_constant_override("margin_right", int(m.z))
	_margin.add_theme_constant_override("margin_bottom", int(m.w))

# ------------------------------------------------------------------ build
func _build_top_left(root: Control) -> void:
	var col := UIKit.vbox(10)
	col.position = Vector2.ZERO
	root.add_child(col)
	var prof := Button.new()
	prof.theme_type_variation = "HudButton"
	prof.custom_minimum_size = Vector2(300, 78)
	prof.focus_mode = Control.FOCUS_NONE
	UIKit.attach_press_feedback(prof)
	prof.pressed.connect(func(): nav_pressed.emit("profile"))
	var h := UIKit.hbox(12)
	h.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	h.offset_left = 10
	h.offset_right = -12
	h.mouse_filter = Control.MOUSE_FILTER_IGNORE
	prof.add_child(h)
	var avatar := PanelContainer.new()
	avatar.add_theme_stylebox_override("panel", UITheme.box(Palette.MOSS, 99, Color.WHITE, 3, 0, 6))
	avatar.custom_minimum_size = Vector2(58, 58)
	avatar.size_flags_vertical = Control.SIZE_SHRINK_CENTER
	avatar.mouse_filter = Control.MOUSE_FILTER_IGNORE
	_lvl_label = UIKit.label("1", "Title", 26, Color.WHITE)
	_lvl_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	avatar.add_child(_lvl_label)
	h.add_child(avatar)
	var v := UIKit.vbox(4)
	v.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	v.alignment = BoxContainer.ALIGNMENT_CENTER
	v.mouse_filter = Control.MOUSE_FILTER_IGNORE
	_name_label = UIKit.label("Keeper", "HudLabel", 22)
	v.add_child(_name_label)
	_xp_bar = ProgressBar.new()
	_xp_bar.theme_type_variation = "GoldBar"
	_xp_bar.show_percentage = false
	_xp_bar.custom_minimum_size = Vector2(170, 12)
	_xp_bar.mouse_filter = Control.MOUSE_FILTER_IGNORE
	v.add_child(_xp_bar)
	h.add_child(v)
	col.add_child(prof)
	# Quest tracker.
	_quest_card = PanelContainer.new()
	_quest_card.theme_type_variation = "DarkCard"
	_quest_card.custom_minimum_size = Vector2(340, 0)
	_quest_card.mouse_filter = Control.MOUSE_FILTER_STOP
	_quest_card.gui_input.connect(_on_quest_card_input)
	var qh := UIKit.hbox(10)
	qh.mouse_filter = Control.MOUSE_FILTER_IGNORE
	var qv := UIKit.vbox(2)
	qv.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	qv.mouse_filter = Control.MOUSE_FILTER_IGNORE
	_quest_title = UIKit.label("", "HudLabel", 20, Palette.GOLD)
	_quest_obj = UIKit.label("", "HudLabel", 18, Color.WHITE, true)
	_quest_obj.custom_minimum_size.x = 250
	qv.add_child(_quest_title)
	qv.add_child(_quest_obj)
	qh.add_child(qv)
	var av := UIKit.vbox(0)
	av.mouse_filter = Control.MOUSE_FILTER_IGNORE
	_quest_arrow = IconGlyph.make("arrow", 34, Palette.GOLD)
	_quest_arrow.pivot_offset = Vector2(17, 17)
	_quest_dist = UIKit.label("", "HudLabel", 15)
	_quest_dist.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	av.add_child(_quest_arrow)
	av.add_child(_quest_dist)
	qh.add_child(av)
	_quest_card.add_child(qh)
	col.add_child(_quest_card)
	_hint = UIKit.label("", "HudLabel", 17, Palette.MOSS_LIGHT, true)
	_hint.custom_minimum_size.x = 340
	col.add_child(_hint)
	_fps = UIKit.label("", "HudLabel", 16)
	_fps.visible = GameState.setting("show_fps")
	col.add_child(_fps)

func _build_top_right(root: Control) -> void:
	var h := UIKit.hbox(10)
	h.anchor_left = 1.0
	h.anchor_right = 1.0
	h.grow_horizontal = Control.GROW_DIRECTION_BEGIN
	root.add_child(h)
	var cur := Button.new()
	cur.theme_type_variation = "HudButton"
	cur.focus_mode = Control.FOCUS_NONE
	cur.custom_minimum_size = Vector2(0, 62)
	UIKit.attach_press_feedback(cur)
	cur.pressed.connect(func(): nav_pressed.emit("market"))
	var ch := UIKit.hbox(16)
	ch.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	ch.offset_left = 14
	ch.offset_right = -14
	ch.alignment = BoxContainer.ALIGNMENT_CENTER
	ch.mouse_filter = Control.MOUSE_FILTER_IGNORE
	for c in ["gold", "crystals", "star_gems"]:
		var chip := UIKit.currency_chip(c, 0, true)
		chip.mouse_filter = Control.MOUSE_FILTER_IGNORE
		_cur_labels[c] = chip.get_node("Amount")
		ch.add_child(chip)
	cur.add_child(ch)
	cur.custom_minimum_size.x = 330
	h.add_child(cur)
	var bell := UIKit.button("", "bell", "HudButton", 62, 30)
	bell.custom_minimum_size.x = 62
	bell.pressed.connect(_on_bell)
	_bell_dot = Panel.new()
	_bell_dot.add_theme_stylebox_override("panel", UITheme.box(Palette.DANGER, 99))
	_bell_dot.size = Vector2(14, 14)
	_bell_dot.position = Vector2(44, 6)
	_bell_dot.visible = false
	_bell_dot.mouse_filter = Control.MOUSE_FILTER_IGNORE
	bell.add_child(_bell_dot)
	h.add_child(bell)
	var gear := UIKit.button("", "pause", "HudButton", 62, 26)
	gear.custom_minimum_size.x = 62
	gear.pressed.connect(func(): nav_pressed.emit("pause"))
	h.add_child(gear)

func _build_nav(root: Control) -> void:
	var bar := PanelContainer.new()
	bar.theme_type_variation = "DarkCard"
	bar.anchor_left = 0.5
	bar.anchor_right = 0.5
	bar.anchor_top = 1.0
	bar.anchor_bottom = 1.0
	bar.grow_horizontal = Control.GROW_DIRECTION_BOTH
	bar.grow_vertical = Control.GROW_DIRECTION_BEGIN
	root.add_child(bar)
	_nav = UIKit.hbox(6)
	bar.add_child(_nav)
	for item in [["creatures", "paw", "Mythlings"], ["journal", "book", "Journal"], ["inventory", "bag", "Bag"], ["quests", "quest", "Quests"], ["map", "map", "Map"], ["market", "cart", "Market"]]:
		var b := Button.new()
		b.theme_type_variation = "HudButton"
		b.focus_mode = Control.FOCUS_NONE
		b.custom_minimum_size = Vector2(104, 76)
		var v := UIKit.vbox(2)
		v.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
		v.alignment = BoxContainer.ALIGNMENT_CENTER
		v.mouse_filter = Control.MOUSE_FILTER_IGNORE
		var g := IconGlyph.make(item[1], 34, Color.WHITE)
		g.size_flags_horizontal = Control.SIZE_SHRINK_CENTER
		v.add_child(g)
		var l := UIKit.label(item[2], "HudLabel", 16)
		l.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
		v.add_child(l)
		b.add_child(v)
		UIKit.attach_press_feedback(b)
		var pname: String = item[0]
		b.pressed.connect(func(): nav_pressed.emit(pname))
		_nav.add_child(b)
	_nav = _nav  # keep reference for blockers
	_nav.set_meta("bar", bar)

func _build_actions(root: Control) -> void:
	var cluster := Control.new()
	cluster.anchor_left = 1.0
	cluster.anchor_right = 1.0
	cluster.anchor_top = 1.0
	cluster.anchor_bottom = 1.0
	cluster.mouse_filter = Control.MOUSE_FILTER_IGNORE
	root.add_child(cluster)
	_jump_btn = _round_button("jump", 112)
	_jump_btn.position = Vector2(-128, -232)
	_jump_btn.button_down.connect(func():
		player.jump_held = true
		_on_jump())
	_jump_btn.button_up.connect(func(): player.jump_held = false)
	cluster.add_child(_jump_btn)
	_interact_btn = _round_button("hand", 126)
	_interact_btn.position = Vector2(-270, -270)
	_interact_btn.pressed.connect(func(): player.try_interact())
	_interact_label = UIKit.label("", "HudLabel", 18)
	_interact_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	_interact_label.position = Vector2(-60, -36)
	_interact_label.size = Vector2(246, 30)
	_interact_btn.add_child(_interact_label)
	cluster.add_child(_interact_btn)
	var slots := [["primary", 96, Vector2(-116, -370)], ["secondary", 78, Vector2(-206, -440)], ["signature", 84, Vector2(-112, -520)]]
	for sl in slots:
		var b := _round_button("leaf", sl[1])
		b.position = sl[2]
		var slot_name: String = sl[0]
		b.pressed.connect(func(): _use_ability(slot_name))
		var l := UIKit.label("", "HudLabel", 14)
		l.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
		l.position = Vector2(-50, sl[1] - 2)
		l.size = Vector2(sl[1] + 100, 22)
		b.add_child(l)
		var cd := UIKit.label("", "HudLabel", 24)
		cd.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
		cd.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
		cd.size = Vector2(sl[1], sl[1])
		b.add_child(cd)
		cluster.add_child(b)
		_ab_buttons[slot_name] = b
		_ab_labels[slot_name] = l
		_ab_cd[slot_name] = cd
	_ability_btn = _ab_buttons.primary
	_ability_label = _ab_labels.primary
	_cam_btn = _round_button("camera", 72)
	_cam_btn.position = Vector2(-236, -540)
	_cam_btn.pressed.connect(func():
		_cam_far = not _cam_far
		player.set_camera_distance(7.5 if _cam_far else 5.2))
	cluster.add_child(_cam_btn)
	_swap_btn = _round_button("paw", 72)
	_swap_btn.position = Vector2(-330, -500)
	_swap_btn.pressed.connect(_toggle_swap)
	cluster.add_child(_swap_btn)
	_swap_box = PanelContainer.new()
	_swap_box.theme_type_variation = "DarkCard"
	_swap_box.visible = false
	_swap_box.position = Vector2(-760, -620)
	cluster.add_child(_swap_box)
	_ride_btn = _round_button("ride", 96)
	_ride_btn.position = Vector2(-256, -392)
	_ride_btn.pressed.connect(_toggle_ride)
	cluster.add_child(_ride_btn)
	_ride_btn.visible = false

func _round_button(icon: String, sz: float) -> Button:
	var b := Button.new()
	b.focus_mode = Control.FOCUS_NONE
	b.custom_minimum_size = Vector2(sz, sz)
	b.size = Vector2(sz, sz)
	for st in ["normal", "hover", "pressed", "disabled"]:
		var c := Color(0.07, 0.12, 0.1, 0.5) if st != "pressed" else Color(Palette.MOSS, 0.85)
		b.add_theme_stylebox_override(st, UITheme.box(c, int(sz * 0.5) - 2, Color(1, 1, 1, 0.35), 3, 0, 0))
	b.add_theme_stylebox_override("focus", StyleBoxEmpty.new())
	var g := IconGlyph.make(icon, sz * 0.46, Color.WHITE)
	g.name = "Icon"
	g.position = Vector2(sz * 0.27, sz * 0.27)
	b.add_child(g)
	UIKit.attach_press_feedback(b)
	return b

func _build_overlays(root: Control) -> void:
	_toasts = UIKit.vbox(8)
	_toasts.anchor_left = 0.5
	_toasts.anchor_right = 0.5
	_toasts.grow_horizontal = Control.GROW_DIRECTION_BOTH
	_toasts.position.y = 90
	_toasts.mouse_filter = Control.MOUSE_FILTER_IGNORE
	root.add_child(_toasts)
	_banner = UIKit.label("", "Heading", 54, Color.WHITE)
	_banner.add_theme_color_override("font_outline_color", Color(0.05, 0.1, 0.08, 0.7))
	_banner.add_theme_constant_override("outline_size", 12)
	_banner.anchor_left = 0.0
	_banner.anchor_right = 1.0
	_banner.anchor_top = 0.22
	_banner.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	_banner.modulate.a = 0.0
	_banner.mouse_filter = Control.MOUSE_FILTER_IGNORE
	root.add_child(_banner)
	_banner_sub = UIKit.label("", "HudLabel", 22, Palette.GOLD)
	_banner_sub.anchor_left = 0.0
	_banner_sub.anchor_right = 1.0
	_banner_sub.anchor_top = 0.22
	_banner_sub.offset_top = 70
	_banner_sub.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	_banner_sub.modulate.a = 0.0
	root.add_child(_banner_sub)
	# Dialogue box.
	_dialogue = PanelContainer.new()
	_dialogue.anchor_left = 0.5
	_dialogue.anchor_right = 0.5
	_dialogue.anchor_top = 1.0
	_dialogue.anchor_bottom = 1.0
	_dialogue.offset_left = -480
	_dialogue.offset_right = 480
	_dialogue.offset_top = -300
	_dialogue.offset_bottom = -110
	_dialogue.visible = false
	_dialogue.mouse_filter = Control.MOUSE_FILTER_STOP
	_dialogue.gui_input.connect(_on_dialogue_input)
	var dv := UIKit.vbox(6)
	dv.mouse_filter = Control.MOUSE_FILTER_IGNORE
	_dlg_name = UIKit.label("", "Title", 26, Palette.MOSS_DARK)
	_dlg_text = RichTextLabel.new()
	_dlg_text.fit_content = true
	_dlg_text.bbcode_enabled = true
	_dlg_text.custom_minimum_size = Vector2(900, 90)
	_dlg_text.add_theme_font_size_override("normal_font_size", 24)
	_dlg_text.add_theme_font_size_override("italics_font_size", 24)
	_dlg_text.add_theme_color_override("default_color", Palette.INK)
	_dlg_text.mouse_filter = Control.MOUSE_FILTER_IGNORE
	var hint := UIKit.label("Tap to continue", "Caption", 16)
	hint.horizontal_alignment = HORIZONTAL_ALIGNMENT_RIGHT
	dv.add_child(_dlg_name)
	dv.add_child(_dlg_text)
	dv.add_child(hint)
	_dialogue.add_child(dv)
	root.add_child(_dialogue)

func _on_quest_card_input(e: InputEvent) -> void:
	if (e is InputEventMouseButton and e.pressed) or (e is InputEventScreenTouch and e.pressed):
		nav_pressed.emit("quests")

func _on_dialogue_input(e: InputEvent) -> void:
	if (e is InputEventMouseButton and e.pressed and e.button_index == MOUSE_BUTTON_LEFT) or (e is InputEventScreenTouch and e.pressed):
		_advance_dialogue()

func _on_jump() -> void:
	if player.is_on_floor() or player.mount:
		player.jump()

func _on_bell() -> void:
	_bell_dot.visible = false
	nav_pressed.emit("achievements")

func _on_settings() -> void:
	_fps.visible = GameState.setting("show_fps")
	joystick._rest_update()

# ------------------------------------------------------------------ refresh
func _refresh_profile() -> void:
	_lvl_label.text = str(GameState.level())
	_name_label.text = String(GameState.data.player.name)
	_xp_bar.max_value = GameState.xp_to_next()
	create_tween().tween_property(_xp_bar, "value", float(GameState.data.player.xp), 0.4)

func _refresh_currencies() -> void:
	for c in _cur_labels:
		_cur_labels[c].text = str(GameState.currency(c))

func _refresh_ability() -> void:
	var cid := GameState.companion()
	var c: CreatureData = DB.creature(cid)
	for slot in _ab_buttons:
		var b: Button = _ab_buttons[slot]
		var a: AbilityData = Abilities.in_slot(cid, slot) if c else null
		b.visible = a != null and Abilities.unlocked(cid, a) and a.effect != "region_locked"
		if a:
			var g: IconGlyph = b.get_node("Icon")
			g.icon = {"movement": "jump", "support": "bag", "environmental": "hammer", "signature": "sparkle"}.get(a.category, IconGlyph.element_icon(c.primary_element()))
			g.color = a.color.lightened(0.3) if slot != "signature" else Palette.GOLD
			_ab_labels[slot].text = a.display_name
	_refresh_ride()

func _refresh_quest() -> void:
	var qid := Quests.tracked()
	_quest_card.visible = qid != ""
	if qid == "":
		return
	var q: QuestData = DB.quest(qid)
	_quest_title.text = q.title
	for i in q.objectives.size():
		if not Quests.objective_done(qid, i):
			_quest_obj.text = Quests.objective_text(qid, i)
			return
	_quest_obj.text = "Complete!"

func _on_interactable(it: Interactable) -> void:
	_interact_btn.visible = it != null
	if it:
		_interact_label.text = it.get_prompt()
		var g: IconGlyph = _interact_btn.get_node("Icon")
		g.icon = it.icon
		_interact_btn.pivot_offset = _interact_btn.size * 0.5
		_interact_btn.scale = Vector2.ONE * 0.6
		create_tween().tween_property(_interact_btn, "scale", Vector2.ONE, 0.25).set_trans(Tween.TRANS_BACK).set_ease(Tween.EASE_OUT)
	_refresh_ride()

func _refresh_ride() -> void:
	var g: IconGlyph = _ride_btn.get_node("Icon")
	if player.mount:
		_ride_btn.visible = true
		g.icon = "back"
		return
	var it := player.current_interactable()
	var c := it as Creature
	_ride_btn.visible = c != null and player.can_mount(c)
	g.icon = "ride"

func _toggle_ride() -> void:
	if player.mount:
		player.dismount()
	else:
		var c := player.current_interactable() as Creature
		if c and player.can_mount(c):
			player.mount_creature(c)
	_refresh_ride()

## Quick companion switch without opening any menu.
func _toggle_swap() -> void:
	_swap_box.visible = not _swap_box.visible
	if not _swap_box.visible:
		return
	UIKit.clear(_swap_box)
	var v := UIKit.vbox(6)
	v.add_child(UIKit.label("Switch companion", "HudLabel", 18))
	var row := HFlowContainer.new()
	row.add_theme_constant_override("h_separation", 6)
	row.add_theme_constant_override("v_separation", 6)
	row.custom_minimum_size.x = 420
	for c in Evolution.owned_forms():
		if c.is_colossal() or GameState.friendship_level(c.id) < 1:
			continue
		var b := Button.new()
		b.theme_type_variation = "HudButton"
		b.focus_mode = Control.FOCUS_NONE
		b.custom_minimum_size = Vector2(96, 96)
		var cv := UIKit.vbox(0)
		cv.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
		cv.mouse_filter = Control.MOUSE_FILTER_IGNORE
		var pt := CreaturePortrait.new()
		pt.setup(c, true)
		pt.custom_minimum_size = Vector2(60, 60)
		pt.size_flags_horizontal = Control.SIZE_SHRINK_CENTER
		cv.add_child(pt)
		var nl := UIKit.label(c.display_name, "HudLabel", 13)
		nl.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
		cv.add_child(nl)
		b.add_child(cv)
		if GameState.companion() == c.id:
			b.modulate = Palette.GOLD
		var cid: String = c.id
		b.pressed.connect(func():
			_swap_box.visible = false
			if c.size_class == "large":
				var msg := level.summon(cid)
				if msg != "":
					show_toast("Not enough room", msg, "map")
			else:
				GameState.set_companion(cid)
			_refresh_ability())
		UIKit.attach_press_feedback(b)
		row.add_child(b)
	if row.get_child_count() == 0:
		row.add_child(UIKit.label("Befriend Mythlings (friendship 1) to bring them along.", "HudLabel", 15, Color.WHITE, true))
	v.add_child(row)
	_swap_box.add_child(v)

func _use_ability(slot := "primary") -> void:
	var c: Creature = level.companion_creature()
	if c == null:
		return
	var a := Abilities.in_slot(c.data.id, slot)
	var msg := c.use_ability(slot)
	if msg != "" and a:
		show_toast(a.display_name, msg, IconGlyph.element_icon(c.data.primary_element()))

# ------------------------------------------------------------------ toasts / banner / dialogue
func show_toast(title: String, body: String, icon := "star") -> void:
	var card := PanelContainer.new()
	card.theme_type_variation = "Card"
	card.mouse_filter = Control.MOUSE_FILTER_IGNORE
	var h := UIKit.hbox(12)
	h.add_child(IconGlyph.make(icon if icon != "" else "star", 40, Palette.MOSS))
	var v := UIKit.vbox(0)
	v.add_child(UIKit.label(title, "Title", 22))
	if body != "":
		var b := UIKit.label(body, "Caption", 17, Color(0, 0, 0, 0), true)
		b.custom_minimum_size.x = 380
		v.add_child(b)
	h.add_child(v)
	card.add_child(h)
	card.modulate.a = 0.0
	_toasts.add_child(card)
	while _toasts.get_child_count() > 3:
		_toasts.get_child(0).queue_free()
		_toasts.remove_child(_toasts.get_child(0))
	var tw := card.create_tween()
	tw.tween_property(card, "modulate:a", 1.0, 0.25)
	tw.tween_interval(3.2)
	tw.tween_property(card, "modulate:a", 0.0, 0.4)
	tw.tween_callback(card.queue_free)

func show_banner(title: String, sub: String) -> void:
	_banner.text = title
	_banner_sub.text = sub
	var tw := create_tween()
	tw.tween_property(_banner, "modulate:a", 1.0, 0.6)
	tw.parallel().tween_property(_banner_sub, "modulate:a", 1.0, 0.8)
	tw.tween_interval(2.0)
	tw.tween_property(_banner, "modulate:a", 0.0, 0.8)
	tw.parallel().tween_property(_banner_sub, "modulate:a", 0.0, 0.8)

func queue_dialogue(speaker: String, lines: Array) -> void:
	if lines.is_empty():
		return
	_dlg_queue.append([speaker, lines])
	if not _dialogue.visible:
		_next_dialogue()

func dialogue_open() -> bool:
	return _dialogue.visible

func _next_dialogue() -> void:
	if _dlg_queue.is_empty():
		_dialogue.visible = false
		player.input_locked = false
		return
	var d: Array = _dlg_queue.pop_front()
	_dlg_name.text = d[0]
	_dlg_lines = d[1]
	_dlg_i = 0
	_dialogue.visible = true
	player.input_locked = true
	player.touch_move = Vector2.ZERO
	_show_line()

func _show_line() -> void:
	var line: String = _dlg_lines[_dlg_i]
	if line.begins_with("*") and line.ends_with("*"):
		line = "[i]" + line.trim_prefix("*").trim_suffix("*") + "[/i]"
	_dlg_text.text = line
	_dlg_text.visible_ratio = 0.0
	create_tween().tween_property(_dlg_text, "visible_ratio", 1.0, clampf(line.length() * 0.018, 0.25, 1.4))

func _advance_dialogue() -> void:
	if _dlg_text.visible_ratio < 1.0:
		_dlg_text.visible_ratio = 1.0
		return
	_dlg_i += 1
	if _dlg_i >= _dlg_lines.size():
		_next_dialogue()
	else:
		_show_line()

func _unhandled_input(event: InputEvent) -> void:
	if _dialogue.visible and (event.is_action_pressed("interact") or event.is_action_pressed("jump")):
		_advance_dialogue()
		get_viewport().set_input_as_handled()
		return
	if event.is_action_pressed("interact"):
		player.try_interact()
	elif event.is_action_pressed("ability"):
		_use_ability("primary")
	elif event is InputEventKey and event.pressed and not event.echo and event.keycode == KEY_F:
		_use_ability("secondary")
	elif event is InputEventKey and event.pressed and not event.echo and event.keycode == KEY_G:
		_use_ability("signature")
	elif event.is_action_pressed("mount"):
		_toggle_ride()

func _process(_delta: float) -> void:
	if _fps.visible:
		_fps.text = "%d FPS" % Engine.get_frames_per_second()
	if _quest_card.visible and level:
		var tp := level.quest_target_position()
		_quest_arrow.visible = tp != Vector3.INF
		_quest_dist.visible = _quest_arrow.visible
		if tp != Vector3.INF:
			var to := tp - player.global_position
			var d := Vector2(to.x, to.z).length()
			_quest_dist.text = "%dm" % int(d)
			var cam_fwd := -player.camera.global_transform.basis.z
			var a := atan2(to.x, -to.z) - atan2(cam_fwd.x, -cam_fwd.z)
			_quest_arrow.rotation = a
	if player.mount == null and _ride_btn.visible and player.current_interactable() == null:
		_ride_btn.visible = false
	# Ability cooldowns, "useful here" pulse and passive sense hint.
	var c: Creature = level.companion_creature() if level else null
	if c:
		var t := Time.get_ticks_msec() * 0.006
		for slot in _ab_buttons:
			var a := Abilities.in_slot(c.data.id, slot)
			if a == null:
				continue
			var cd := Abilities.cooldown_left(c.data.id, a.id)
			_ab_cd[slot].text = str(ceili(cd)) if cd > 0.0 else ""
			var b: Button = _ab_buttons[slot]
			b.modulate = Color(1, 1, 1, 0.55) if cd > 0.0 else (Color(1.0, 0.92 + sin(t) * 0.08, 0.6 + sin(t) * 0.2) if a.id == _useful else Color.WHITE)
		_hint_t -= _delta
		if _hint_t <= 0.0:
			_hint_t = 0.5
			_useful = Abilities.useful_ability_for(c.data.id, player)
			var sense := Abilities.sense_hint(player.global_position)
			if sense.has("text"):
				_hint.text = sense.text
			elif _useful != "":
				_hint.text = "%s could help here!" % DB.ability(_useful).display_name
			else:
				_hint.text = ""
