class_name SkyCycle
extends Node3D
## Sun, sky, ambient light and fog with a gentle day/night loop.
## time 0..1 (0.25 sunrise, 0.5 noon, 0.75 sunset). A full day lasts DAY_LENGTH.

signal night_changed(is_night: bool)

const DAY_LENGTH := 1200.0
var time := 0.36
var env: Environment
var sun: DirectionalLight3D
var sky_mat: ProceduralSkyMaterial
var world_env: WorldEnvironment
var _night := false
var paused := false
var tint := ""  # "" or "ember"

const KEYS := [
	# t, sun col, sun energy, sky top, horizon, ambient energy, fog col
	[0.0, Color("6f80c0"), 0.12, Color("0d1630"), Color("2a3a62"), 0.16, Color("22304f")],
	[0.22, Color("ffb07a"), 0.35, Color("4f6fa8"), Color("f0b38a"), 0.32, Color("e6b89a")],
	[0.32, Color("ffe2b8"), 0.8, Color("4f8fd0"), Color("cfe3ea"), 0.42, Color("c9dde6")],
	[0.5, Color("fff6e6"), 1.0, Color("3f82cc"), Color("bfdcec"), 0.45, Color("c4dbe8")],
	[0.68, Color("ffd9a0"), 0.82, Color("4b80c4"), Color("e8d2b0"), 0.42, Color("e2d0b4")],
	[0.78, Color("ff9a62"), 0.4, Color("3d4f8f"), Color("f09a6a"), 0.33, Color("d99a7a")],
	[0.86, Color("8a90d0"), 0.15, Color("141d3d"), Color("3b3f6e"), 0.18, Color("2a3358")],
	[1.0, Color("6f80c0"), 0.12, Color("0d1630"), Color("2a3a62"), 0.16, Color("22304f")],
]

func _ready() -> void:
	world_env = WorldEnvironment.new()
	env = Environment.new()
	var sky := Sky.new()
	sky_mat = ProceduralSkyMaterial.new()
	sky_mat.sun_angle_max = 20.0
	sky_mat.sun_curve = 0.12
	sky_mat.ground_bottom_color = Color("3c5a3a")
	sky.sky_material = sky_mat
	env.background_mode = Environment.BG_SKY
	env.sky = sky
	env.ambient_light_source = Environment.AMBIENT_SOURCE_COLOR
	env.reflected_light_source = Environment.REFLECTION_SOURCE_SKY
	env.tonemap_mode = Environment.TONE_MAPPER_FILMIC
	env.tonemap_white = 3.0
	env.fog_enabled = true
	env.fog_density = 0.0028
	env.fog_sky_affect = 0.25
	env.fog_aerial_perspective = 0.4
	env.glow_enabled = true
	env.glow_intensity = 0.35
	env.glow_bloom = 0.04
	env.glow_hdr_threshold = 1.1
	env.adjustment_enabled = true
	env.adjustment_saturation = 1.08
	env.adjustment_contrast = 1.04
	world_env.environment = env
	add_child(world_env)
	sun = DirectionalLight3D.new()
	sun.shadow_enabled = true
	sun.directional_shadow_mode = DirectionalLight3D.SHADOW_PARALLEL_2_SPLITS
	sun.directional_shadow_max_distance = 70.0
	sun.shadow_blur = 1.2
	add_child(sun)
	apply_quality()
	Events.settings_changed.connect(apply_quality)
	_update()

func apply_quality() -> void:
	var q: String = GameState.setting("graphics")
	sun.shadow_enabled = q != "low"
	sun.directional_shadow_max_distance = 50.0 if q == "medium" else 90.0
	env.glow_enabled = q != "low"
	env.fog_enabled = true

func is_night() -> bool:
	return time < 0.24 or time > 0.8

func _process(delta: float) -> void:
	if not paused:
		time = fposmod(time + delta / DAY_LENGTH, 1.0)
	_update()

func _sample(t: float) -> Array:
	for i in KEYS.size() - 1:
		var a: Array = KEYS[i]
		var b: Array = KEYS[i + 1]
		if t >= a[0] and t <= b[0]:
			var f := (t - float(a[0])) / (float(b[0]) - float(a[0]))
			f = f * f * (3.0 - 2.0 * f)
			return [a[1].lerp(b[1], f), lerpf(a[2], b[2], f), a[3].lerp(b[3], f), a[4].lerp(b[4], f), lerpf(a[5], b[5], f), a[6].lerp(b[6], f)]
	return [KEYS[0][1], KEYS[0][2], KEYS[0][3], KEYS[0][4], KEYS[0][5], KEYS[0][6]]

func _update() -> void:
	var s := _sample(time)
	# Sun arcs east→west; at night the "sun" becomes soft moonlight from above.
	var day_angle := (time - 0.25) * TAU
	var elev := sin(day_angle) * 65.0
	if is_night():
		elev = 40.0
	sun.rotation_degrees = Vector3(-maxf(elev, 12.0), -35.0 + (time - 0.5) * 120.0, 0)
	sun.light_color = s[0]
	sun.light_energy = s[1]
	if tint == "ember":
		s[0] = s[0].lerp(Color("ffb070"), 0.4)
		s[2] = s[2].lerp(Color("5a3a3a"), 0.5)
		s[3] = s[3].lerp(Color("d8885a"), 0.55)
		s[5] = s[5].lerp(Color("a06a50"), 0.6)
		env.fog_density = 0.0034
	sky_mat.sky_top_color = s[2]
	sky_mat.sky_horizon_color = s[3]
	sky_mat.ground_horizon_color = s[3].darkened(0.1)
	env.ambient_light_color = s[2].lerp(s[3], 0.55).lerp(Color(0.85, 0.9, 0.85), 0.25)
	env.ambient_light_energy = s[4] * 1.65
	env.fog_light_color = s[5]
	var n := is_night()
	if n != _night:
		_night = n
		night_changed.emit(n)
