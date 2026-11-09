class_name Weather
extends Node3D
## Per-region weather: clear, cloudy, rain (or ashfall in Emberfall). Changes
## every few minutes, dims the sky, drives precipitation around the camera,
## speeds plant regrowth in rain and tells creatures how to react.

signal changed(state: String)

const STATES := {
	"meadow": [["clear", 0.5], ["cloudy", 0.25], ["rain", 0.25]],
	"emberfall": [["clear", 0.45], ["cloudy", 0.25], ["ashfall", 0.3]],
}
const NAMES := {"clear": "Clear", "cloudy": "Cloudy", "rain": "Rain", "ashfall": "Ashfall"}

var region := "meadow"
var state := "clear"
var dim := 0.0  # 0..1 sky darkening, eased
var _timer := 0.0
var _precip: CPUParticles3D
var _audio: AudioStreamPlayer
var level: MeadowLevel

func setup(lvl: MeadowLevel) -> void:
	level = lvl
	region = lvl.region_id
	_precip = CPUParticles3D.new()
	_precip.amount = 420 if not AbilityFX.reduced() else 160
	_precip.lifetime = 1.2
	_precip.emission_shape = CPUParticles3D.EMISSION_SHAPE_BOX
	_precip.emission_box_extents = Vector3(12, 0.5, 12)
	_precip.direction = Vector3(0.1, -1, 0)
	_precip.spread = 3.0
	_precip.gravity = Vector3(0, -18, 0)
	_precip.initial_velocity_min = 10.0
	_precip.initial_velocity_max = 13.0
	_precip.emitting = false
	add_child(_precip)
	_audio = AudioStreamPlayer.new()
	_audio.bus = "Ambience"
	_audio.stream = Audio.get_stream("amb_rain", true)
	add_child(_audio)
	_pick(true)

func _pick(initial := false) -> void:
	var options: Array = STATES.get(region, STATES.meadow)
	var r := randf()
	var acc := 0.0
	var next := "clear"
	for o in options:
		acc += float(o[1])
		if r <= acc:
			next = o[0]
			break
	if initial and GameState.flag("tutorial_step", 0) < 4:
		next = "clear"  # keep the first minutes bright for new players
	set_state(next)
	_timer = randf_range(150.0, 300.0)

func set_state(s: String) -> void:
	if s == state and _precip.emitting == (s in ["rain", "ashfall"]):
		return
	state = s
	var wet := s in ["rain", "ashfall"]
	_precip.emitting = wet
	var m := QuadMesh.new()
	if s == "rain":
		m.size = Vector2(0.04, 0.6)
		_precip.mesh = m
		_precip.gravity = Vector3(0, -18, 0)
		_precip.initial_velocity_min = 10.0
		_precip.initial_velocity_max = 13.0
		var mat := StandardMaterial3D.new()
		mat.shading_mode = BaseMaterial3D.SHADING_MODE_UNSHADED
		mat.transparency = BaseMaterial3D.TRANSPARENCY_ALPHA
		mat.albedo_color = Color(0.85, 0.9, 1.0, 0.6)
		mat.billboard_mode = BaseMaterial3D.BILLBOARD_FIXED_Y
		m.material = mat
	elif s == "ashfall":
		m.size = Vector2(0.08, 0.08)
		_precip.mesh = m
		_precip.gravity = Vector3(0.4, -1.2, 0.2)
		_precip.initial_velocity_min = 0.5
		_precip.initial_velocity_max = 1.5
		_precip.lifetime = 6.0
		var mat := StandardMaterial3D.new()
		mat.shading_mode = BaseMaterial3D.SHADING_MODE_UNSHADED
		mat.billboard_mode = BaseMaterial3D.BILLBOARD_ENABLED
		mat.albedo_color = Color("9a8a80")
		m.material = mat
	if s == "rain" and GameState.companion() != "":
		GameState.add_stat("rain_with_" + GameState.companion())
	if s == "rain":
		_audio.play()
	else:
		_audio.stop()
	changed.emit(s)
	if s != "clear":
		Events.toast.emit(NAMES[s], {"cloudy": "Clouds roll in.", "rain": "Rain! Plants regrow faster, and water Mythlings love it.", "ashfall": "Ash drifts down from the volcano. Fire Mythlings feel at home."}[s], "drop" if s == "rain" else "star")

## Can this region have rain at all?
func allows(s: String) -> bool:
	for o in STATES.get(region, []):
		if o[0] == s:
			return true
	return false

func display_name() -> String:
	return NAMES.get(state, state)

func is_wet() -> bool:
	return state in ["rain", "ashfall"]

func _process(delta: float) -> void:
	_timer -= delta
	if _timer <= 0.0:
		_pick()
	var target := {"clear": 0.0, "cloudy": 0.35, "rain": 0.6, "ashfall": 0.45}.get(state, 0.0)
	dim = lerpf(dim, target, clampf(delta * 0.3, 0.0, 1.0))
	if level and level.sky:
		level.sky.weather_dim = dim
	if level and level.player and level.player.camera:
		_precip.global_position = level.player.camera.global_position + Vector3(0, 9, 0)
	# Rain helps plants regrow (berries, petals, dew).
	if state == "rain" and level:
		for n in get_tree().get_nodes_in_group("interactable"):
			if n is ResourceNode and not n.enabled and n.item_id in ["petals", "sunberry", "dew_nectar"]:
				n._respawn -= delta
