extends Node3D
## Dev tool: renders every playable creature model side by side and saves a
## screenshot. Usage: godot res://tests/gallery.tscn -- --shot=/path.png [--colossal]

func _ready() -> void:
	var env := WorldEnvironment.new()
	var e := Environment.new()
	var sky := Sky.new()
	var sm := ProceduralSkyMaterial.new()
	sm.sky_top_color = Color("5d9fd8"); sm.sky_horizon_color = Color("cfe6ee"); sm.ground_horizon_color = Color("cfe6ee"); sm.ground_bottom_color = Color("6a8a5a")
	sky.sky_material = sm
	e.background_mode = Environment.BG_SKY
	e.sky = sky
	e.ambient_light_source = Environment.AMBIENT_SOURCE_SKY
	e.ambient_light_energy = 0.35
	e.tonemap_mode = Environment.TONE_MAPPER_FILMIC
	env.environment = e
	add_child(env)
	var sun := DirectionalLight3D.new()
	sun.rotation_degrees = Vector3(-50, -35, 0)
	sun.shadow_enabled = true
	sun.light_energy = 0.8
	for a in OS.get_cmdline_user_args():
		if a.begins_with("--sun="):
			sun.light_energy = float(a.trim_prefix("--sun="))
		if a == "--nospec":
			sun.light_specular = 0.0
	add_child(sun)
	var ground := MeshInstance3D.new()
	var pm := PlaneMesh.new()
	pm.size = Vector2(60, 60)
	ground.mesh = pm
	ground.material_override = MeshKit.mat(Color("8fbf6a"))
	add_child(ground)
	var cam := Camera3D.new()
	add_child(cam)
	var colossal := "--colossal" in OS.get_cmdline_user_args()
	if colossal:
		var r := CreatureModels.build("verdantus")
		add_child(r)
		r.rotation_degrees.y = 145
		cam.position = Vector3(0, 5.5, 15)
		cam.look_at(Vector3(0, 4.0, 0))
		cam.fov = 50
	else:
		var ids := ["mossbun", "cloverling", "pebblit", "sunfox", "dewdrop", "bloomtail"]
		for i in ids.size():
			var r := CreatureModels.build(ids[i])
			add_child(r)
			r.position = Vector3((i - 2.5) * 0.85, 0, 0)
			r.rotation_degrees.y = 160 + (i % 2) * 30
		cam.position = Vector3(0, 0.9, 3.4)
		cam.look_at(Vector3(0, 0.32, 0))
		cam.fov = 45
	await get_tree().create_timer(1.0).timeout
	for a in OS.get_cmdline_user_args():
		if a.begins_with("--shot="):
			get_viewport().get_texture().get_image().save_png(a.trim_prefix("--shot="))
	get_tree().quit()
