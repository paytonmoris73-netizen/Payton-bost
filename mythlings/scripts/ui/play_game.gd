class_name PlayGame
extends Control
## "Play together" mini-activity: catch the glowing sparkles your Mythling
## chases. Five sparkles appear one after another; tap each before it fades.

var creature: Creature
var _score := 0
var _round := 0
var _target: Button
var _info: Label
var _running := false

func _init() -> void:
	set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	mouse_filter = Control.MOUSE_FILTER_IGNORE
	visible = false

func build() -> void:
	theme = UITheme.get_theme()
	_info = UIKit.label("", "HudLabel", 30)
	_info.anchor_left = 0.0
	_info.anchor_right = 1.0
	_info.position.y = 120
	_info.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	add_child(_info)
	_target = Button.new()
	_target.focus_mode = Control.FOCUS_NONE
	_target.custom_minimum_size = Vector2(120, 120)
	_target.size = Vector2(120, 120)
	for st in ["normal", "hover", "pressed"]:
		_target.add_theme_stylebox_override(st, UITheme.box(Color(1, 0.95, 0.7, 0.25), 99, Color("ffe9a8"), 4, 0, 0))
	var g := IconGlyph.make("sparkle", 70, Color("fff2b0"))
	g.position = Vector2(25, 25)
	_target.add_child(g)
	_target.pressed.connect(_hit)
	_target.visible = false
	add_child(_target)

func open(c: Creature) -> void:
	creature = c
	visible = true
	_score = 0
	_round = 0
	_running = true
	MeadowLevel.current.player.input_locked = true
	_info.text = "Catch the sparkles with %s!" % c.data.display_name
	await get_tree().create_timer(1.0).timeout
	_next()

func _next() -> void:
	if _round >= 5:
		_finish()
		return
	_round += 1
	var vp := get_viewport_rect().size
	_target.position = Vector2(randf_range(vp.x * 0.2, vp.x * 0.75), randf_range(vp.y * 0.25, vp.y * 0.65))
	_target.visible = true
	_target.pivot_offset = Vector2(60, 60)
	_target.scale = Vector2.ONE
	_target.modulate.a = 1.0
	creature.emote("happy", 0.8)
	var r := _round
	var tw := create_tween()
	tw.tween_property(_target, "scale", Vector2.ONE * 0.35, 1.5)
	tw.parallel().tween_property(_target, "modulate:a", 0.3, 1.5)
	await tw.finished
	if r == _round and _target.visible:
		_target.visible = false
		_info.text = "Missed! %d / %d" % [_score, _round]
		_next()

func _hit() -> void:
	if not _target.visible:
		return
	_target.visible = false
	_score += 1
	_info.text = "Caught! %d / %d" % [_score, _round]
	Audio.play_sfx("collect", 1.0 + _score * 0.08)
	_next()

func _finish() -> void:
	_running = false
	var gain := creature.do_play(_score)
	_info.text = "%s had fun! +%d friendship" % [creature.data.display_name, gain]
	await get_tree().create_timer(1.6).timeout
	visible = false
	MeadowLevel.current.player.input_locked = false
