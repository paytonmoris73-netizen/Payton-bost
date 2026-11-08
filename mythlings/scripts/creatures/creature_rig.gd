class_name CreatureRig
extends Node3D
## Procedural animation for a procedurally built (or imported) creature model.
## Builders register named parts; this script layers breathing, blinking,
## locomotion gaits and one-shot emotes on top of their rest transforms.
## An imported model with an AnimationPlayer can replace this by exposing the
## same `set_motion` / `emote` API.

signal emote_finished(name: String)

var parts: Dictionary = {}
var _rest: Dictionary = {}  # node -> Transform3D
var visual: Node3D  # everything bobs/squashes through this node
var locomotion := "quad"
var gait_speed := 1.0  # scales leg frequency (big creatures move slower)
var bob_height := 0.03
var hover_height := 0.0
var is_colossal := false

var speed := 0.0  # 0 idle, 1 walk, 2 run (set by controller)
var sleeping := false
var _emote := ""
var _emote_t := 0.0
var _emote_len := 0.0
var _t := 0.0
var _phase := 0.0
var _blink_t := 2.0
var _ear_twitch := 0.0
var _look := Vector2.ZERO
var _look_target := Vector2.ZERO
var _look_timer := 0.0
var lower_head := 0.0  # 0..1, used by colossal interactions
var wing_spread := 0.0  # 0..1

func _init() -> void:
	visual = Node3D.new()
	visual.name = "Visual"
	add_child(visual)

func reg(part_name: String, node) -> void:
	parts[part_name] = node
	if node is Array:
		for n in node:
			_rest[n] = n.transform
	elif node is Node3D:
		_rest[node] = node.transform

func part(n: String):
	return parts.get(n)

func emote(n: String, length := 1.6) -> void:
	_emote = n
	_emote_t = 0.0
	_emote_len = length

func is_emoting() -> bool:
	return _emote != ""

func _rest_of(n: Node3D) -> Transform3D:
	return _rest.get(n, n.transform)

func _process(delta: float) -> void:
	if not is_visible_in_tree():
		return
	_t += delta
	var move: float = clamp(speed, 0.0, 2.0)
	var freq := (6.0 + move * 3.0) * gait_speed
	_phase += delta * freq * (0.0 if move < 0.05 else 1.0)
	var e := 0.0
	if _emote != "":
		_emote_t += delta
		e = _emote_t / _emote_len
		if e >= 1.0:
			var done := _emote
			_emote = ""
			e = 0.0
			emote_finished.emit(done)
	_animate_body(delta, move, e)
	_animate_head(delta, move, e)
	_animate_limbs(move)
	_animate_extras(delta, move)
	_blink(delta)

func _animate_body(delta: float, move: float, e: float) -> void:
	var y := hover_height
	var rot := Vector3.ZERO
	var sq := Vector3.ONE
	var breathe := sin(_t * (1.4 if is_colossal else 2.4)) * (0.012 if is_colossal else 0.025)
	sq = Vector3(1.0 + breathe * 0.5, 1.0 + breathe, 1.0 + breathe * 0.5)
	match locomotion:
		"hop":
			if move > 0.05:
				var h: float = absf(sin(_phase * 0.5))
				y += h * (0.12 + 0.06 * move)
				sq = Vector3(1.0 - h * 0.06, 1.0 + h * 0.1, 1.0 - h * 0.06) if h > 0.25 else Vector3(1.08, 0.88, 1.08)
				rot.x = -h * 8.0
		"float":
			y += sin(_t * 1.6) * 0.06 + 0.02
			rot.z = sin(_t * 1.1) * 4.0
			rot.x = -move * 10.0
		"waddle":
			rot.z = sin(_phase * 0.5) * (6.0 * minf(move, 1.0) + 1.0)
			y += absf(sin(_phase * 0.5)) * bob_height * move
		"fly":
			y += sin(_t * 2.0) * 0.1
			rot.x = -move * 8.0
		_:
			y += absf(sin(_phase)) * bob_height * minf(move, 1.5)
			rot.x = sin(_phase * 2.0) * 1.5 * move
			if is_colossal:
				rot.z = sin(_phase) * 2.0 * minf(move, 1.0)
	if sleeping:
		y -= 0.06 if not is_colossal else 0.6
		sq = Vector3(1.06, 0.86 + breathe * 2.0, 1.06)
	# emotes
	match _emote:
		"happy":
			var j: float = absf(sin(e * PI * 3.0))
			y += j * (0.25 if not is_colossal else 0.4)
			rot.y = e * 360.0 if not is_colossal else 0.0
			sq = Vector3(1.0 - j * 0.08, 1.0 + j * 0.15, 1.0 - j * 0.08)
		"discovery":
			var s: float = sin(e * PI)
			y += s * 0.45 if not is_colossal else s * 0.6
			rot.y = ease(e, -2.2) * 720.0 if not is_colossal else 0.0
		"interact", "pet":
			rot.x = sin(e * PI) * 10.0
			rot.z = sin(e * PI * 4.0) * 6.0 * (1.0 - e)
			sq = Vector3(1.04, 0.95, 1.04) if e < 0.5 else sq
		"startled":
			y += sin(e * PI) * 0.3
			sq = Vector3(0.92, 1.12, 0.92)
		"stomp":
			var k: float = sin(e * PI)
			rot.x = -k * 6.0
			y += k * 0.5 - (0.3 if e > 0.6 and e < 0.75 else 0.0)
		"roar":
			rot.x = -sin(e * PI) * 10.0
	visual.position = visual.position.lerp(Vector3(0, y, 0), clamp(delta * 14.0, 0, 1))
	visual.rotation_degrees = visual.rotation_degrees.lerp(rot, clamp(delta * 10.0, 0, 1))
	visual.scale = visual.scale.lerp(sq, clamp(delta * 12.0, 0, 1))

func _animate_head(delta: float, move: float, e: float) -> void:
	var head: Node3D = parts.get("head")
	if head == null:
		return
	_look_timer -= delta
	if _look_timer <= 0.0:
		_look_timer = randf_range(1.2, 3.5)
		_look_target = Vector2(randf_range(-22, 22), randf_range(-8, 10)) if move < 0.1 else Vector2.ZERO
	_look = _look.lerp(_look_target, delta * 3.0)
	var r := _rest_of(head)
	var rot := Vector3(_look.y, _look.x, 0)
	rot.x += sin(_phase * 2.0) * 3.0 * minf(move, 1.0)
	if sleeping:
		rot = Vector3(22, 0, 12)
	match _emote:
		"interact", "pet":
			rot = Vector3(-8, 0, sin(e * PI * 2.0) * 16.0)
		"happy":
			rot = Vector3(-14, 0, 0)
		"discovery":
			rot = Vector3(-18, 0, 0)
		"roar":
			rot = Vector3(-35 * sin(e * PI), 0, 0)
		"sniff":
			rot = Vector3(30 * sin(e * PI), sin(e * 20.0) * 8.0, 0)
	rot.x += lower_head * 38.0
	var target := r.basis * Basis.from_euler(rot * (PI / 180.0))
	head.basis = head.basis.slerp(target.orthonormalized(), clamp(delta * 8.0, 0, 1))
	var ears = [parts.get("ear_l"), parts.get("ear_r")]
	_ear_twitch = maxf(0.0, _ear_twitch - delta * 4.0)
	if randf() < delta * 0.4:
		_ear_twitch = 1.0
	for i in 2:
		var ear: Node3D = ears[i]
		if ear == null:
			continue
		var er := _rest_of(ear)
		var tw := sin(_t * 30.0) * 10.0 * _ear_twitch * (1 if i == 0 else -1)
		var flop := sin(_phase) * 6.0 * minf(move, 1.0)
		var droop := 25.0 if sleeping else 0.0
		ear.basis = er.basis * Basis.from_euler(Vector3(flop + droop, 0, tw) * (PI / 180.0))

func _animate_limbs(move: float) -> void:
	var legs = parts.get("legs")
	if legs is Array:
		var offsets := [0.0, PI, PI, 0.0]  # diagonal gait
		for i in legs.size():
			var leg: Node3D = legs[i]
			var r := _rest_of(leg)
			var swing := sin(_phase + offsets[i % 4]) * (28.0 if move > 1.2 else 22.0) * minf(move, 1.0)
			if sleeping:
				swing = 70.0 if i < 2 else -60.0
			if locomotion == "hop" and move > 0.05:
				swing = sin(_phase * 0.5 * 2.0) * 25.0
			if _emote == "stomp" and i == 0:
				swing = -sin(_emote_t / _emote_len * PI) * 45.0
			leg.basis = r.basis * Basis.from_euler(Vector3(deg_to_rad(swing), 0, 0))
	var wings = parts.get("wings")
	if wings is Array:
		for i in wings.size():
			var w: Node3D = wings[i]
			var r := _rest_of(w)
			var side := 1.0 if i % 2 == 0 else -1.0
			var flap := sin(_t * (3.0 if wing_spread < 0.5 else 1.5)) * (10.0 + 25.0 * wing_spread)
			var open := wing_spread * 50.0
			w.basis = r.basis * Basis.from_euler(Vector3(0, 0, deg_to_rad((flap + open) * side)))

func _animate_extras(delta: float, move: float) -> void:
	var tail: Node3D = parts.get("tail")
	if tail:
		var r := _rest_of(tail)
		var amp := 10.0 + 14.0 * minf(move, 1.0) + (25.0 if _emote == "happy" else 0.0)
		var sway := sin(_t * (2.2 + move * 3.0)) * amp
		tail.basis = r.basis * Basis.from_euler(Vector3(0, deg_to_rad(sway), deg_to_rad(sway * 0.3)))
	var sways = parts.get("sway")
	if sways is Array:
		for i in sways.size():
			var s: Node3D = sways[i]
			var r := _rest_of(s)
			var a := sin(_t * 1.7 + i * 1.3) * 4.0 + sin(_phase) * 3.0 * minf(move, 1.0)
			s.basis = r.basis * Basis.from_euler(Vector3(deg_to_rad(a), 0, deg_to_rad(a * 0.6)))
	var spin = parts.get("orbit")
	if spin is Node3D:
		spin.rotate_y(delta * 1.8)

func _blink(delta: float) -> void:
	var eyes = parts.get("eyes")
	if not (eyes is Array):
		return
	_blink_t -= delta
	var closed := sleeping or _emote == "pet"
	var target_y := 1.0
	if _blink_t < 0.0:
		target_y = 0.1
		if _blink_t < -0.12:
			_blink_t = randf_range(2.0, 5.0)
	if closed:
		target_y = 0.08
	for eye in eyes:
		var r := _rest_of(eye)
		eye.scale = Vector3(r.basis.get_scale().x, lerp(eye.scale.y, r.basis.get_scale().y * target_y, clamp(delta * 30.0, 0, 1)), r.basis.get_scale().z)
