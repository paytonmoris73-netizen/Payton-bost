class_name CameraDragZone
extends Control
## Right-side area: dragging rotates the camera; buttons above it take priority.

var player: Player
var blockers: Array = []  # Controls that should not start a camera drag
var _touch := -1
var _last := Vector2.ZERO

func _ready() -> void:
	mouse_filter = Control.MOUSE_FILTER_IGNORE

func _input(event: InputEvent) -> void:
	if player == null or not is_visible_in_tree():
		return
	if event is InputEventScreenTouch:
		if event.pressed and _touch == -1 and get_global_rect().has_point(event.position) and not _blocked(event.position):
			_touch = event.index
			_last = event.position
		elif not event.pressed and event.index == _touch:
			_touch = -1
	elif event is InputEventScreenDrag and event.index == _touch:
		player.add_camera_input(event.position - _last)
		_last = event.position
	elif event is InputEventMouseButton and event.button_index == MOUSE_BUTTON_LEFT:
		if event.pressed and _touch == -1 and get_global_rect().has_point(event.position) and not _blocked(event.position):
			_touch = 99
			_last = event.position
		elif not event.pressed and _touch == 99:
			_touch = -1
	elif event is InputEventMouseMotion and _touch == 99:
		player.add_camera_input(event.position - _last)
		_last = event.position

func _blocked(p: Vector2) -> bool:
	for b in blockers:
		if is_instance_valid(b) and b.is_visible_in_tree() and b.get_global_rect().has_point(p):
			return true
	return false
