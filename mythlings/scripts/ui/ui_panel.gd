class_name UIPanel
extends Control
## Base for full-screen modal sheets: dimmed backdrop, animated sheet, title bar
## with icon and close button. Subclasses fill `body` in `build_content()`.

signal closed

var dim: ColorRect
var sheet: PanelContainer
var body: VBoxContainer
var header: HBoxContainer
var title_label: Label
var panel_name := ""
var pauses_game := false
var _built := false
var max_size := Vector2(1440, 860)
var game_ui: Node

func _init() -> void:
	set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	mouse_filter = Control.MOUSE_FILTER_STOP
	visible = false

func setup_frame(title: String, icon: String) -> void:
	theme = UITheme.get_theme()
	dim = ColorRect.new()
	dim.color = Color(0.04, 0.08, 0.06, 0.55)
	dim.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	dim.mouse_filter = Control.MOUSE_FILTER_STOP
	dim.gui_input.connect(_on_dim_input)
	add_child(dim)
	sheet = PanelContainer.new()
	add_child(sheet)
	var v := UIKit.vbox(14)
	sheet.add_child(v)
	header = UIKit.hbox(12)
	var ic := IconGlyph.make(icon, 40, Palette.MOSS)
	ic.size_flags_vertical = Control.SIZE_SHRINK_CENTER
	header.add_child(ic)
	title_label = UIKit.label(title, "Heading")
	title_label.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	header.add_child(title_label)
	var close_btn := UIKit.button("", "close", "", 60, 26)
	close_btn.custom_minimum_size.x = 60
	close_btn.pressed.connect(close)
	header.add_child(close_btn)
	v.add_child(header)
	body = UIKit.vbox(12)
	body.size_flags_vertical = Control.SIZE_EXPAND_FILL
	v.add_child(body)
	get_viewport().size_changed.connect(_layout)
	_layout()

func _layout() -> void:
	if sheet == null:
		return
	var vp := get_viewport_rect().size
	var s := Vector2(minf(vp.x - 40, max_size.x), minf(vp.y - 30, max_size.y))
	sheet.size = s
	sheet.position = (vp - s) * 0.5

func _on_dim_input(e: InputEvent) -> void:
	if e is InputEventMouseButton and e.pressed and e.button_index == MOUSE_BUTTON_LEFT:
		close()

func build_content() -> void:
	pass

func refresh() -> void:
	pass

func open(args := {}) -> void:
	if not _built:
		_built = true
		build_content()
	on_open(args)
	refresh()
	visible = true
	_layout()
	Audio.play_sfx("ui_open", 1.0, -6.0)
	dim.modulate.a = 0.0
	sheet.modulate.a = 0.0
	sheet.pivot_offset = sheet.size * 0.5
	sheet.scale = Vector2.ONE * 0.94
	var tw := create_tween().set_parallel(true)
	tw.tween_property(dim, "modulate:a", 1.0, 0.2)
	tw.tween_property(sheet, "modulate:a", 1.0, 0.2)
	tw.tween_property(sheet, "scale", Vector2.ONE, 0.28).set_trans(Tween.TRANS_BACK).set_ease(Tween.EASE_OUT)
	if pauses_game:
		get_tree().paused = true

func on_open(_args: Dictionary) -> void:
	pass

func close() -> void:
	if not visible:
		return
	Audio.play_sfx("ui_close", 1.0, -8.0)
	var tw := create_tween().set_parallel(true)
	tw.tween_property(dim, "modulate:a", 0.0, 0.16)
	tw.tween_property(sheet, "modulate:a", 0.0, 0.16)
	tw.tween_property(sheet, "scale", Vector2.ONE * 0.96, 0.16)
	await tw.finished
	visible = false
	if pauses_game:
		get_tree().paused = false
	closed.emit()

func _unhandled_input(event: InputEvent) -> void:
	if visible and event.is_action_pressed("pause"):
		close()
		get_viewport().set_input_as_handled()
