class_name VirtualJoystick
extends Control
## Floating thumbstick for the left side of the screen. Appears where the thumb
## lands, so it works for any hand size and screen. Output in `value` (-1..1).

signal changed(value: Vector2)

var value := Vector2.ZERO
var radius := 90.0
var _touch := -1
var _origin := Vector2.ZERO
var _knob := Vector2.ZERO
var _rest := Vector2.ZERO
var _active := false

func _ready() -> void:
	mouse_filter = Control.MOUSE_FILTER_IGNORE
	_rest_update()
	resized.connect(_rest_update)

func _rest_update() -> void:
	radius = 90.0 * float(GameState.setting("joystick_size"))
	_rest = Vector2(radius + 40, size.y - radius - 40)
	if not _active:
		_origin = _rest
		_knob = _rest
	queue_redraw()

func _input(event: InputEvent) -> void:
	if not is_visible_in_tree():
		return
	if event is InputEventScreenTouch:
		if event.pressed and _touch == -1 and _in_zone(event.position):
			_touch = event.index
			_active = true
			_origin = event.position - global_position
			_knob = _origin
			get_viewport().set_input_as_handled()
		elif not event.pressed and event.index == _touch:
			_release()
	elif event is InputEventScreenDrag and event.index == _touch:
		_drag(event.position - global_position)
		get_viewport().set_input_as_handled()
	# Mouse fallback for desktop testing of touch UI.
	elif event is InputEventMouseButton and event.button_index == MOUSE_BUTTON_LEFT:
		if event.pressed and _touch == -1 and _in_zone(event.position):
			_touch = 99
			_active = true
			_origin = event.position - global_position
			_knob = _origin
		elif not event.pressed and _touch == 99:
			_release()
	elif event is InputEventMouseMotion and _touch == 99:
		_drag(event.position - global_position)

func _in_zone(p: Vector2) -> bool:
	var local := p - global_position
	return local.x >= 0 and local.y >= 0 and local.x < size.x and local.y < size.y

func _drag(p: Vector2) -> void:
	var d := p - _origin
	if d.length() > radius:
		d = d.normalized() * radius
	_knob = _origin + d
	value = d / radius
	changed.emit(value)
	queue_redraw()

func _release() -> void:
	_touch = -1
	_active = false
	value = Vector2.ZERO
	_origin = _rest
	_knob = _rest
	changed.emit(value)
	queue_redraw()

func _draw() -> void:
	var a := 1.0 if _active else 0.55
	draw_circle(_origin, radius, Color(0.05, 0.1, 0.08, 0.28 * a))
	draw_arc(_origin, radius, 0, TAU, 48, Color(1, 1, 1, 0.35 * a), 3.0, true)
	draw_circle(_knob, radius * 0.42, Color(1, 1, 1, 0.55 * a + 0.2))
	draw_arc(_knob, radius * 0.42, 0, TAU, 32, Color(Palette.MOSS_DARK, 0.6), 3.0, true)
