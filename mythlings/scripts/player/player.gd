class_name Player
extends CharacterBody3D
## Third-person Keeper controller: walk/run/jump, wading & swimming, vine
## climbing, contextual interaction and riding Colossal Mythlings.

signal interactable_changed(target: Interactable)
signal mounted_changed(creature: Creature)

const WALK := 4.2
const RUN := 7.2
const JUMP := 6.2
const GRAVITY := 18.0
const SWIM := 3.0

var model: PlayerModel
var cam_yaw: Node3D
var cam_pitch: Node3D
var spring: SpringArm3D
var camera: Camera3D

var touch_move := Vector2.ZERO  # set by the virtual joystick
var touch_run := false
var is_running := false
var swimming := false
var wading := false
var input_locked := false
var mount: Creature = null
var jump_held := false  # set by the HUD jump button (hold to climb while flying)
var glide_time := 0.0
var swim_boost_time := 0.0
var swim_boost_mult := 2.0
var _dash_time := 0.0
var _dash_vel := Vector3.ZERO
var _glow: OmniLight3D
var flying := false

var _yaw := 0.0
var _pitch := -0.32
var _cam_idle := 0.0
var _dist := 5.2
var _focus_override := Vector3.INF
var _climb: ClimbArea = null
var _current: Interactable = null
var _step_t := 0.0
var _was_air := false
var _safe_pos := Vector3.ZERO
var _safe_t := 0.0

func _ready() -> void:
	add_to_group("player")
	collision_layer = 2
	collision_mask = 1
	floor_snap_length = 0.4
	floor_max_angle = deg_to_rad(50)
	var cs := CollisionShape3D.new()
	var cap := CapsuleShape3D.new()
	cap.radius = 0.32
	cap.height = 1.7
	cs.shape = cap
	cs.position.y = 0.85
	add_child(cs)
	model = PlayerModel.new()
	add_child(model)
	model.rebuild(GameState.data.appearance)
	Events.appearance_changed.connect(func(): model.rebuild(GameState.data.appearance))
	cam_yaw = Node3D.new()
	cam_yaw.top_level = true
	add_child(cam_yaw)
	cam_pitch = Node3D.new()
	cam_yaw.add_child(cam_pitch)
	spring = SpringArm3D.new()
	spring.spring_length = _dist
	spring.collision_mask = 1
	spring.margin = 0.3
	var sph := SphereShape3D.new()
	sph.radius = 0.25
	spring.shape = sph
	cam_pitch.add_child(spring)
	camera = Camera3D.new()
	camera.fov = 62
	camera.far = 900
	spring.add_child(camera)
	camera.current = true
	_yaw = rotation.y
	cam_yaw.global_position = global_position + Vector3(0, 1.5, 0)
	_safe_pos = global_position

# ------------------------------------------------------------------ input
func add_camera_input(delta_px: Vector2) -> void:
	var sens: float = 0.0045 * float(GameState.setting("sensitivity"))
	_yaw -= delta_px.x * sens
	var inv := -1.0 if GameState.setting("invert_y") else 1.0
	_pitch = clampf(_pitch - delta_px.y * sens * inv, -1.15, 0.45)
	_cam_idle = 0.0

func _unhandled_input(event: InputEvent) -> void:
	# Desktop testing: drag with the right mouse button to orbit.
	if event is InputEventMouseMotion and (event.button_mask & MOUSE_BUTTON_MASK_RIGHT):
		add_camera_input(event.relative)

func _move_input() -> Vector2:
	var v := touch_move
	var k := Input.get_vector("move_left", "move_right", "move_forward", "move_back")
	if k.length() > v.length():
		v = k
	return v.limit_length(1.0)

# ------------------------------------------------------------------ physics
func _physics_process(delta: float) -> void:
	var lvl := MeadowLevel.current
	var inp := Vector2.ZERO if input_locked else _move_input()
	is_running = not input_locked and (touch_run or Input.is_action_pressed("run") or inp.length() > 0.92)
	var cam_basis := Basis(Vector3.UP, _yaw)
	var dir := cam_basis * Vector3(inp.x, 0, inp.y)
	var wl: float = lvl.terrain.water_level_at(global_position.x, global_position.z) if lvl else -INF
	var gy: float = lvl.terrain.height(global_position.x, global_position.z) if lvl else -INF
	var depth := wl - gy
	swimming = mount == null and depth > 1.15 and global_position.y < wl - 0.4
	wading = mount == null and not swimming and depth > 0.15 and global_position.y < wl + 0.1
	var speed := (RUN if is_running else WALK) * inp.length() * Abilities.speed_mult()
	var boosted := swim_boost_time > 0.0
	if mount:
		var big := mount.data.is_colossal()
		speed = ((14.0 if is_running else 8.0) if big else (11.0 if is_running else 6.5)) * inp.length()
		if flying:
			speed = (20.0 if is_running else 13.0) * inp.length()
	elif swimming:
		speed = SWIM * inp.length() * (swim_boost_mult if boosted else 1.0)
	elif wading and not boosted:
		speed *= 0.62
	swim_boost_time = maxf(0.0, swim_boost_time - delta)
	var climbing := _climb != null and inp.length() > 0.2 and dir.normalized().dot(-_climb.face_normal) > 0.3
	var can_fly: bool = mount != null and mount.data.flight
	var want_up: bool = not input_locked and (jump_held or Input.is_action_pressed("jump"))
	if _dash_time > 0.0:
		_dash_time -= delta
		velocity.x = _dash_vel.x
		velocity.z = _dash_vel.z
		velocity.y = maxf(velocity.y, 0.0) if is_on_floor() else velocity.y - GRAVITY * delta * 0.5
		move_and_slide()
		_update_interactable()
		return
	if can_fly and (flying or want_up):
		flying = true
		var ground_y: float = gy if gy > -INF else global_position.y
		var target_vy := 7.0 if want_up else -2.6
		if global_position.y - ground_y > 45.0 and target_vy > 0.0:
			target_vy = 0.0
		velocity.x = lerpf(velocity.x, dir.x * speed, clampf(delta * 2.5, 0.0, 1.0))
		velocity.z = lerpf(velocity.z, dir.z * speed, clampf(delta * 2.5, 0.0, 1.0))
		velocity.y = lerpf(velocity.y, target_vy, clampf(delta * 6.0, 0.0, 1.0))
		mount.rig.wing_spread = lerpf(mount.rig.wing_spread, 1.0, delta * 3.0)
		mount.rig.locomotion = "fly"
		move_and_slide()
		if is_on_floor() and not want_up:
			flying = false
			mount.rig.locomotion = "quad"
		_after_move(delta, Vector3(velocity.x, 0, velocity.z))
		return
	if mount and mount.rig.wing_spread > 0.01:
		mount.rig.wing_spread = lerpf(mount.rig.wing_spread, 0.0, delta * 2.0)
	if climbing:
		velocity = -_climb.face_normal * 1.2 + Vector3.UP * 3.4
	elif swimming:
		velocity.x = lerpf(velocity.x, dir.x * speed, delta * 4.0)
		velocity.z = lerpf(velocity.z, dir.z * speed, delta * 4.0)
		velocity.y = lerpf(velocity.y, (wl - 1.05 - global_position.y) * 4.0, delta * 6.0)
	else:
		var accel := 10.0 if is_on_floor() else 3.5
		if mount:
			accel = 4.0
		velocity.x = lerpf(velocity.x, dir.x * speed, clampf(delta * accel, 0.0, 1.0))
		velocity.z = lerpf(velocity.z, dir.z * speed, clampf(delta * accel, 0.0, 1.0))
		if not is_on_floor():
			velocity.y -= GRAVITY * delta
			if Abilities.featherfall_active() and velocity.y < -4.0:
				velocity.y = -4.0
			if glide_time > 0.0 and velocity.y < -1.6:
				velocity.y = -1.6
				velocity.x = lerpf(velocity.x, dir.x * 7.0, delta * 2.0)
				velocity.z = lerpf(velocity.z, dir.z * 7.0, delta * 2.0)
		elif not input_locked and Input.is_action_just_pressed("jump"):
			jump()
	glide_time = maxf(0.0, glide_time - delta)
	move_and_slide()
	_after_move(delta, Vector3(velocity.x, 0, velocity.z))

func _after_move(delta: float, flat: Vector3) -> void:
	# Face movement direction.
	if flat.length() > 0.3:
		var target_rot := atan2(-flat.x, -flat.z)
		rotation.y = lerp_angle(rotation.y, target_rot, delta * (5.0 if mount else 12.0))
	# Animation state.
	var hs := flat.length()
	model.speed = hs / WALK if not mount else 0.0
	model.airborne = not is_on_floor() and not swimming and _climb == null and mount == null
	model.swimming = swimming
	model.riding = mount != null
	if mount:
		mount.global_position = global_position
		mount.rotation.y = rotation.y
		mount.set_mount_motion(hs / (6.0 if mount.data.is_colossal() else 4.0))
	_update_glow()
	# Landing / footsteps.
	if is_on_floor() and _was_air:
		Audio.play_sfx("land", 1.0, -6.0)
		if mount:
			Audio.play_sfx("stomp")
	_was_air = not is_on_floor()
	if is_on_floor() and hs > 0.5 and mount == null:
		_step_t -= delta * hs * 0.55
		if _step_t <= 0.0:
			_step_t = 1.0
			Audio.play_sfx("step_grass_%d" % (randi() % 3), randf_range(0.9, 1.1), -8.0 if not wading else -4.0)
	# Safety net.
	_safe_t -= delta
	var lvl := MeadowLevel.current
	var over_lava: bool = lvl != null and lvl.terrain.has_method("is_lava") and lvl.terrain.is_lava(global_position.x, global_position.z)
	if is_on_floor() and not wading and not over_lava and _safe_t <= 0.0:
		_safe_t = 1.0
		_safe_pos = global_position
		GameState.data.player["pos_" + (lvl.region_id if lvl else "meadow")] = [global_position.x, global_position.y, global_position.z]
	if global_position.y < -25.0:
		global_position = _safe_pos + Vector3(0, 1, 0)
		velocity = Vector3.ZERO
	if over_lava and global_position.y < EmberTerrain.LAVA_Y + 0.3 and mount == null:
		# Lava: no damage system, but it sends you back to safe ground.
		FX.burst(get_parent(), global_position + Vector3(0, 0.5, 0), Color("ff8a3a"), 30, 0.08, 4.0, 1.0)
		global_position = _safe_pos + Vector3(0, 0.5, 0)
		velocity = Vector3.ZERO
		Events.toast.emit("Too hot!", "Lava sends you back. A Magmole's Cooling Crust or the stone bridge can get you across.", "fire")
	_update_interactable()

func dash(speed: float, time: float) -> void:
	var f := -global_transform.basis.z
	f.y = 0
	_dash_vel = f.normalized() * speed
	_dash_time = time
	if is_on_floor():
		velocity.y = 2.5

func _update_glow() -> void:
	var want: bool = Abilities.glow_active() and MeadowLevel.current != null and MeadowLevel.current.sky.is_night()
	if want and _glow == null:
		_glow = OmniLight3D.new()
		_glow.light_color = Color("ff9a4a")
		_glow.omni_range = 9.0
		_glow.light_energy = 1.2
		_glow.position = Vector3(0, 2.0, 0)
		add_child(_glow)
	elif not want and _glow:
		_glow.queue_free()
		_glow = null

func jump() -> void:
	if swimming:
		return
	velocity.y = JUMP * (1.25 if mount else 1.0)
	Audio.play_sfx("jump", randf_range(0.95, 1.05), -6.0)
	if mount:
		mount.emote("stomp", 1.2)

func _process(delta: float) -> void:
	# Camera follow with smoothing; gently recentres behind the player while moving.
	_cam_idle += delta
	var moving := Vector3(velocity.x, 0, velocity.z).length() > 1.0
	if moving and _cam_idle > 1.6 and GameState.setting("reduce_motion") != true:
		_yaw = lerp_angle(_yaw, rotation.y, delta * 0.8)
	var focus := global_position + Vector3(0, 1.45 if mount == null else (7.0 if mount.data.is_colossal() else 3.0), 0)
	if _focus_override != Vector3.INF:
		focus = _focus_override
	cam_yaw.global_position = cam_yaw.global_position.lerp(focus, clampf(delta * 10.0, 0.0, 1.0))
	cam_yaw.rotation.y = _yaw
	cam_pitch.rotation.x = _pitch
	var target_d := _dist if mount == null else (12.0 if mount.data.is_colossal() else 7.5)
	spring.spring_length = lerpf(spring.spring_length, target_d, delta * 3.0)

func set_camera_distance(d: float) -> void:
	_dist = clampf(d, 3.0, 9.0)

func focus_on(p: Vector3) -> void:
	_focus_override = p

func clear_focus() -> void:
	_focus_override = Vector3.INF

func face_camera_toward(p: Vector3) -> void:
	var to := p - global_position
	_yaw = atan2(-to.x, -to.z)

# ------------------------------------------------------------------ interaction
func _update_interactable() -> void:
	var best: Interactable = null
	var best_d := INF
	if not input_locked:
		for n in get_tree().get_nodes_in_group("interactable"):
			var it := n as Interactable
			if it == null or it == mount or not it.can_interact():
				continue
			var d := it.global_position.distance_to(global_position)
			if d < it.radius and d < best_d:
				best = it
				best_d = d
	if best != _current:
		_current = best
		interactable_changed.emit(best)

func current_interactable() -> Interactable:
	return _current

func try_interact() -> void:
	if input_locked or _current == null:
		return
	model.action("interact", 0.5)
	_current.interact(self)

func play_action(n: String) -> void:
	model.action(n, 0.7)

func set_climb(a: ClimbArea) -> void:
	_climb = a

func clear_climb(a: ClimbArea) -> void:
	if _climb == a:
		_climb = null

# ------------------------------------------------------------------ riding
func can_mount(c: Creature) -> bool:
	return c != null and c.data.rideable and c.data.model_ready and GameState.friendship_level(c.data.id) >= 3

func mount_creature(c: Creature) -> void:
	if not can_mount(c):
		return
	mount = c
	c.mode = Creature.Mode.MOUNT
	global_position = c.global_position
	velocity = Vector3.ZERO
	var saddle: Node3D = c.rig.part("saddle")
	var h := saddle.global_position.y - c.global_position.y if saddle else 5.5
	var tw := create_tween()
	tw.tween_property(model, "position", Vector3(0, h - 0.6, -0.9), 0.6).set_trans(Tween.TRANS_QUAD).set_ease(Tween.EASE_OUT)
	c.emote("happy", 1.2)
	Events.emit_game_event("ride", c.data.id)
	mounted_changed.emit(c)

func dismount() -> void:
	if mount == null:
		return
	if flying:
		Events.toast.emit("Land first", "Let go of Jump to glide down, then dismount.", "ride")
		return
	var c := mount
	mount = null
	c.rig.locomotion = "quad" if c.data.locomotion == "quad" else c.data.locomotion
	c.rig.wing_spread = 0.0
	c.mode = Creature.Mode.COMPANION if GameState.companion() == c.data.id else Creature.Mode.WILD
	c.home = c.global_position
	var side := global_transform.basis.x * 4.5
	global_position += side
	var tw := create_tween()
	tw.tween_property(model, "position", Vector3.ZERO, 0.4)
	mounted_changed.emit(null)
