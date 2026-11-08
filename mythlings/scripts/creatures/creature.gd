class_name Creature
extends Interactable
## Behaviour for a Mythling in the world. Movement is kinematic over the
## level's height field (no physics body) which is cheap enough for many
## creatures on mobile. Personality drives what the creature does when idle.

enum Mode { WILD, COMPANION, HABITAT, DISPLAY, MOUNT }

signal discovered_here(creature: Creature)

var data: CreatureData
var rig: CreatureRig
var mode := Mode.WILD
var home := Vector3.ZERO
var home_radius := 8.0
var spawn_condition: Callable  # optional: only appears when this returns true

var _state := "idle"
var _state_t := 0.0
var _target := Vector3.ZERO
var _velocity := Vector3.ZERO
var _speed := 0.0
var _marker: Label3D
var _voice: AudioStreamPlayer3D
var _voice_t := 3.0
var _ability_cd := 0.0
var _step_t := 0.0
var _flower_t := 0.0
var _player_close_t := 0.0
var rider: Node3D = null

func setup(d: CreatureData, m: int, at: Vector3) -> void:
	data = d
	mode = m
	home = at
	position = at
	var variant := ""
	var cosm := GameState.creature_cosmetic(d.id)
	var acc := ""
	if cosm.begins_with("variant:"):
		variant = cosm.split(":")[2]
	var acc_c := String(GameState.data.flags.get("acc_" + d.id, ""))
	if acc_c != "":
		acc = acc_c
	rig = CreatureModels.build(d.id, variant, acc)
	add_child(rig)
	radius = 8.5 if d.is_colossal() else 3.2
	home_radius = 18.0 if d.is_colossal() else 8.0
	_voice = AudioStreamPlayer3D.new()
	_voice.bus = "SFX"
	_voice.unit_size = 6.0 if not d.is_colossal() else 30.0
	_voice.max_distance = 40.0 if not d.is_colossal() else 120.0
	add_child(_voice)
	_marker = Label3D.new()
	_marker.text = "?"
	_marker.font = load("res://assets/fonts/Fredoka.ttf")
	_marker.font_size = 96
	_marker.pixel_size = 0.006
	_marker.outline_size = 18
	_marker.modulate = Color("fff2b0")
	_marker.outline_modulate = Color(0.2, 0.15, 0.05, 0.7)
	_marker.billboard = BaseMaterial3D.BILLBOARD_ENABLED
	_marker.no_depth_test = true
	_marker.position = Vector3(0, d.height + (0.9 if not d.is_colossal() else 3.0), 0)
	_marker.visible = false
	add_child(_marker)
	icon = "paw"

func rebuild_model() -> void:
	if rig:
		rig.queue_free()
	var variant := ""
	var cosm := GameState.creature_cosmetic(data.id)
	if cosm.begins_with("variant:"):
		variant = cosm.split(":")[2]
	rig = CreatureModels.build(data.id, variant, String(GameState.data.flags.get("acc_" + data.id, "")))
	add_child(rig)

func get_prompt() -> String:
	if not GameState.is_discovered(data.id):
		return "Approach " + ("the guardian" if data.is_colossal() else "the creature")
	return data.display_name

func can_interact() -> bool:
	if mode == Mode.MOUNT or mode == Mode.DISPLAY:
		return false
	return visible and is_inside_tree()

func interact(player: Node) -> void:
	if not GameState.is_discovered(data.id):
		Events.request_panel.emit("discover", {"creature": self})
	else:
		face_toward(player.global_position)
		Events.request_panel.emit("creature_interact", {"creature": self})

func focus_point() -> Vector3:
	return global_position + Vector3(0, data.height * 0.6, 0)

# ------------------------------------------------------------------ helpers
func level() -> Node:
	return MeadowLevel.current

func player() -> Node3D:
	var l := level()
	return l.player if l else null

func face_toward(p: Vector3) -> void:
	var to := p - global_position
	to.y = 0
	if to.length() > 0.05:
		rotation.y = atan2(-to.x, -to.z)

func say(kind := "") -> void:
	if _voice == null:
		return
	var s: String = "voice_colossal" if data.is_colossal() else ({"shy": "voice_coo", "sleepy": "voice_coo", "calm": "voice_coo", "excited": "voice_trill", "playful": "voice_trill"}.get(data.personality, "voice_chirp"))
	_voice.stream = Audio.get_stream(s)
	_voice.pitch_scale = data.sound_pitch * randf_range(0.94, 1.06) * (1.15 if kind == "happy" else 1.0)
	_voice.play()

func emote(n: String, length := 1.6) -> void:
	rig.emote(n, length)
	if n in ["happy", "discovery", "roar"]:
		say("happy")

func hearts() -> void:
	FX.burst(get_parent(), global_position + Vector3(0, data.height + 0.3, 0), Color("ff8fb0"), 10, 0.07 if not data.is_colossal() else 0.3, 1.6, 1.2, -0.6)

# ------------------------------------------------------------------ interactions (called by UI)
func do_greet() -> int:
	emote("happy", 1.4)
	return _gain(4, "greet")

func do_pet() -> int:
	emote("pet", 1.8)
	Audio.play_sfx("pet", data.sound_pitch)
	hearts()
	return _gain(5, "pet")

func do_treat(item_id: String) -> int:
	if not GameState.remove_item(item_id, 1):
		return 0
	var fav := item_id == data.favorite_treat
	emote("happy" if fav else "interact", 1.6)
	hearts()
	if fav:
		FX.popup_text(get_parent(), global_position + Vector3(0, data.height + 0.8, 0), "Favourite!", Color("ffd27a"))
	return _gain(12 if fav else 7, "treat")

func do_play(score: int) -> int:
	emote("happy", 2.0)
	hearts()
	return _gain(3 + score * 2, "play")

func _gain(n: int, kind: String) -> int:
	var g := GameState.add_friendship(data.id, n, kind)
	Events.emit_game_event("interact", data.id)
	return g

# ------------------------------------------------------------------ ability
func ability_ready() -> bool:
	return _ability_cd <= 0.0

func use_ability() -> String:
	if _ability_cd > 0.0:
		return "%s is resting (%.0fs)." % [data.display_name, _ability_cd]
	_ability_cd = 3.0
	emote("discovery" if not data.is_colossal() else "stomp", 1.2)
	Audio.play_sfx("ability", 1.0)
	var p := player()
	var origin: Vector3 = p.global_position if p else global_position
	var reach := 40.0 if data.is_colossal() else 14.0
	var kinds := [data.ability_id]
	if data.is_colossal():
		kinds.append("hidden_plant")  # guardians sense everything their forest hides
	var hit := 0
	var nearest: AbilityTarget = null
	var nearest_d := INF
	for t in get_tree().get_nodes_in_group("ability_target"):
		var at := t as AbilityTarget
		if at == null or at.done or not (at.kind in kinds):
			continue
		var d := at.global_position.distance_to(origin)
		if d <= reach:
			if at.activate():
				hit += 1
		elif d < nearest_d:
			nearest_d = d
			nearest = at
	FX.burst(get_parent(), global_position + Vector3(0, data.height * 0.6, 0), Palette.element_color(data.primary_element()), 30 if not data.is_colossal() else 80, 0.07 if not data.is_colossal() else 0.2, 3.0 if not data.is_colossal() else 8.0, 1.2)
	if hit > 0:
		return ""
	if nearest:
		return "%s senses something to the %s (%dm)." % [data.display_name, _compass(nearest.global_position - origin), int(nearest_d)]
	return "%s finds nothing new around here." % data.display_name

static func _compass(v: Vector3) -> String:
	var a := rad_to_deg(atan2(v.x, -v.z))
	var dirs := ["north", "north-east", "east", "south-east", "south", "south-west", "west", "north-west"]
	return dirs[int(round(fposmod(a, 360.0) / 45.0)) % 8]

# ------------------------------------------------------------------ update
func _process(delta: float) -> void:
	if data == null or level() == null:
		return
	_ability_cd = maxf(0.0, _ability_cd - delta)
	match mode:
		Mode.WILD, Mode.HABITAT:
			_wild(delta)
		Mode.COMPANION:
			_companion(delta)
		Mode.MOUNT:
			_mount(delta)
		Mode.DISPLAY:
			return
	_marker.visible = mode == Mode.WILD and not GameState.is_discovered(data.id) and _player_dist() < (18.0 if not data.is_colossal() else 40.0)
	if _marker.visible:
		_marker.position.y = data.height + (0.9 if not data.is_colossal() else 3.0) + sin(Time.get_ticks_msec() * 0.004) * 0.08
	_voice_t -= delta
	if _voice_t <= 0.0:
		_voice_t = randf_range(7.0, 16.0)
		if _player_dist() < 15.0 and not rig.sleeping:
			say()
	if data.is_colossal():
		_colossal_fx(delta)

func _player_dist() -> float:
	var p := player()
	return p.global_position.distance_to(global_position) if p else INF

func _move_toward(target: Vector3, speed: float, delta: float) -> bool:
	var to := target - global_position
	to.y = 0
	var dist := to.length()
	if dist < 0.3:
		_speed = lerpf(_speed, 0.0, delta * 6.0)
		rig.speed = _speed / maxf(data.move_speed, 0.1)
		return true
	var dir := to / dist
	dir = _avoid(dir)
	var desired := minf(speed, dist * 3.0)
	_speed = lerpf(_speed, desired, delta * 4.0)
	var step := dir * _speed * delta
	global_position += step
	var target_rot := atan2(-dir.x, -dir.z)
	rotation.y = lerp_angle(rotation.y, target_rot, delta * (3.0 if data.is_colossal() else 8.0))
	_snap_ground(delta)
	rig.speed = _speed / maxf(data.move_speed, 0.1)
	return false

func _avoid(dir: Vector3) -> Vector3:
	var l := level()
	var pos := Vector2(global_position.x, global_position.z)
	var push := Vector2.ZERO
	var my_r := 2.5 if data.is_colossal() else 0.4
	for o in l.obstacles:
		var c := Vector2(o.x, o.y)
		var d := pos.distance_to(c)
		var rr: float = o.z + my_r + 0.6
		if d < rr and d > 0.01:
			push += (pos - c) / d * (rr - d) / rr
	if push.length() > 0.0:
		var nd := (Vector2(dir.x, dir.z) + push * 2.0).normalized()
		return Vector3(nd.x, 0, nd.y)
	return dir

func _snap_ground(delta: float) -> void:
	var l := level()
	var g: float = l.terrain.height(global_position.x, global_position.z)
	var w: float = l.terrain.water_level_at(global_position.x, global_position.z)
	var y := g
	if data.locomotion in ["float", "fly"] or data.is_colossal():
		y = maxf(g, w)
	elif w > g:
		y = maxf(g, w - 0.15)  # small creatures paddle at the surface
	global_position.y = lerpf(global_position.y, y, clampf(delta * 10.0, 0.0, 1.0))

func _wild(delta: float) -> void:
	_state_t -= delta
	var p := player()
	var pd := _player_dist()
	var discovered := GameState.is_discovered(data.id)
	var player_running: bool = p != null and p.get("is_running") == true
	# Colossals lower their heads to trusted keepers.
	if data.is_colossal():
		rig.lower_head = lerpf(rig.lower_head, 1.0 if (pd < 9.0 and discovered) else 0.0, delta * 1.5)
	# Shy creatures startle when someone runs up to them.
	if data.personality == "shy" and pd < 7.0 and player_running and _state != "flee":
		_state = "flee"
		_state_t = 2.5
		rig.emote("startled", 0.6)
		var away := (global_position - p.global_position)
		away.y = 0
		_target = global_position + away.normalized() * 6.0
		_clamp_home()
	match _state:
		"idle":
			_move_toward(global_position, 0, delta)
			if pd < 6.0 and data.personality in ["curious", "excited", "playful"] and p:
				face_toward(p.global_position)
			if _state_t <= 0.0:
				_pick_wild_action(pd)
		"wander", "flee", "approach":
			var spd := data.move_speed * (1.8 if _state == "flee" else (0.6 if data.is_colossal() else 0.75))
			if _state == "approach" and p:
				_target = p.global_position + (global_position - p.global_position).normalized() * 1.6
			if _move_toward(_target, spd, delta) or _state_t <= 0.0:
				_state = "idle"
				_state_t = randf_range(1.5, 4.0)
				if randf() < 0.3:
					rig.emote("sniff", 1.4)
		"sleep":
			_move_toward(global_position, 0, delta)
			rig.sleeping = true
			if _state_t <= 0.0 or (pd < 2.5 and data.personality != "sleepy"):
				rig.sleeping = false
				_state = "idle"
				_state_t = 2.0
		"chase":
			var b = level().nearest_butterfly(global_position, 10.0)
			if b == null or _state_t <= 0.0:
				_state = "idle"
				_state_t = 1.0
				rig.emote("happy", 1.2)
			else:
				_move_toward(Vector3(b.global_position.x, 0, b.global_position.z), data.move_speed * 1.2, delta)
	if _state != "sleep":
		rig.sleeping = false

func _pick_wild_action(pd: float) -> void:
	var r := randf()
	var pers := data.personality
	if pers == "sleepy" and r < 0.45:
		_state = "sleep"
		_state_t = randf_range(10.0, 20.0)
		return
	if pers == "calm" and r < 0.2:
		_state = "sleep"
		_state_t = randf_range(6.0, 10.0)
		return
	if pers == "playful" and r < 0.45 and level().nearest_butterfly(global_position, 10.0) != null:
		_state = "chase"
		_state_t = randf_range(4.0, 7.0)
		return
	if pers in ["curious", "excited"] and pd < 9.0 and pd > 2.2 and r < 0.4:
		_state = "approach"
		_state_t = 3.0
		return
	if pers == "excited" and r < 0.6:
		rig.emote("happy", 1.0)
	_state = "wander"
	_state_t = randf_range(4.0, 8.0)
	var a := randf() * TAU
	var d := randf_range(2.0, home_radius)
	_target = home + Vector3(cos(a) * d, 0, sin(a) * d)
	_clamp_home()

func _clamp_home() -> void:
	var off := _target - home
	off.y = 0
	if off.length() > home_radius:
		_target = home + off.normalized() * home_radius
	var l := level()
	if l and l.terrain.is_water(_target.x, _target.z) and not (data.locomotion in ["float", "fly", "swim"]) and not data.is_colossal():
		_target = global_position

func _companion(delta: float) -> void:
	var p := player()
	if p == null:
		return
	rig.sleeping = false
	var back: Vector3 = p.global_transform.basis.z
	back.y = 0
	back = back.normalized() if back.length() > 0.01 else Vector3.BACK
	var side := back.cross(Vector3.UP)
	var follow_d := 7.5 if data.is_colossal() else 2.0
	var target: Vector3 = p.global_position + back * follow_d + side * (4.0 if data.is_colossal() else 1.1)
	var d := global_position.distance_to(p.global_position)
	if d > (60.0 if data.is_colossal() else 25.0):
		global_position = target
		_snap_ground(1.0)
		FX.burst(get_parent(), global_position + Vector3(0, 0.5, 0), Color("b6f5c8"), 16, 0.06, 2.0)
		return
	var spd := data.move_speed * (1.6 if d > 6.0 else 1.0)
	if p.get("is_running") == true:
		spd = maxf(spd, 7.5)
	if global_position.distance_to(target) > 0.8:
		_move_toward(target, spd, delta)
	else:
		_move_toward(global_position, 0, delta)
		face_toward(p.global_position + -back * 3.0)
	if data.is_colossal():
		rig.lower_head = lerpf(rig.lower_head, 0.6 if d < 9.0 else 0.0, delta)

func _mount(delta: float) -> void:
	# Position is driven by the player's riding controller; we only animate.
	rig.speed = _speed
	rig.sleeping = false
	rig.lower_head = lerpf(rig.lower_head, 0.0, delta * 2.0)

func set_mount_motion(spd_norm: float) -> void:
	_speed = spd_norm

func _colossal_fx(delta: float) -> void:
	# Footsteps bloom with small flowers (Verdantus' signature effect).
	if rig.speed > 0.1:
		_step_t -= delta * rig.speed * 1.4
		if _step_t <= 0.0:
			_step_t = 0.75
			var feet = rig.part("feet")
			var foot: Node3D = feet[randi() % feet.size()] if feet is Array else null
			var fp := foot.global_position if foot else global_position
			level().spawn_footstep_flowers(Vector3(fp.x, level().terrain.height(fp.x, fp.z), fp.z))
			if _player_dist() < 30.0:
				Audio.play_sfx("stomp", randf_range(0.85, 1.0), -10.0)
	if rig.sleeping:
		_flower_t -= delta
		if _flower_t <= 0.0:
			_flower_t = 2.0
			level().spawn_footstep_flowers(global_position + Vector3(randf_range(-4, 4), 0, randf_range(-4, 4)))
