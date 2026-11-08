class_name ModelViewer
extends SubViewportContainer
## Isolated 3D stage for previewing creatures, colossals, outfits and
## decorations. Drag to rotate; auto-rotates when idle.

var vp: SubViewport
var stage: Node3D
var pivot: Node3D
var cam: Camera3D
var current: Node3D
var rig: CreatureRig
var _drag := false
var _idle := 0.0
var _yaw := 0.0
var auto_rotate := true
var bg_top := Color("dff0e4")
var bg_bottom := Color("f6efdf")

func _init() -> void:
	stretch = true
	mouse_filter = Control.MOUSE_FILTER_STOP
	vp = SubViewport.new()
	vp.own_world_3d = true
	vp.transparent_bg = false
	vp.msaa_3d = Viewport.MSAA_2X
	vp.render_target_update_mode = SubViewport.UPDATE_WHEN_VISIBLE
	add_child(vp)
	stage = Node3D.new()
	vp.add_child(stage)
	var env := WorldEnvironment.new()
	var e := Environment.new()
	var sky := Sky.new()
	var sm := ProceduralSkyMaterial.new()
	sm.sky_top_color = Color("b8d8e8")
	sm.sky_horizon_color = Color("f2ead8")
	sm.ground_horizon_color = Color("f2ead8")
	sm.ground_bottom_color = Color("c8d8b8")
	sky.sky_material = sm
	e.background_mode = Environment.BG_SKY
	e.sky = sky
	e.ambient_light_source = Environment.AMBIENT_SOURCE_SKY
	e.ambient_light_energy = 0.45
	e.tonemap_mode = Environment.TONE_MAPPER_FILMIC
	e.tonemap_white = 3.0
	env.environment = e
	stage.add_child(env)
	var key := DirectionalLight3D.new()
	key.rotation_degrees = Vector3(-40, -30, 0)
	key.light_energy = 0.85
	key.shadow_enabled = true
	stage.add_child(key)
	var fill := DirectionalLight3D.new()
	fill.rotation_degrees = Vector3(-20, 150, 0)
	fill.light_energy = 0.25
	fill.light_color = Color("cfe0ff")
	stage.add_child(fill)
	var ped := MeshInstance3D.new()
	var cm := CylinderMesh.new()
	cm.top_radius = 1.0
	cm.bottom_radius = 1.08
	cm.height = 0.12
	cm.radial_segments = 40
	ped.mesh = cm
	ped.material_override = MeshKit.mat(Color("e6dcc4"))
	ped.position.y = -0.06
	ped.name = "Pedestal"
	stage.add_child(ped)
	var grass := MeshInstance3D.new()
	var gm := CylinderMesh.new()
	gm.top_radius = 0.96
	gm.bottom_radius = 0.96
	gm.height = 0.02
	gm.radial_segments = 40
	grass.mesh = gm
	grass.material_override = MeshKit.mat(Color("8fbf6a"))
	grass.position.y = 0.005
	grass.name = "Grass"
	stage.add_child(grass)
	pivot = Node3D.new()
	stage.add_child(pivot)
	cam = Camera3D.new()
	cam.fov = 35
	stage.add_child(cam)
	cam.current = true

func clear() -> void:
	if current:
		current.queue_free()
	current = null
	rig = null

## kind: creature (id or "id:variant" or "id::accessory"), outfit ("top:x"), player, decoration, colossal
func show_item(kind: String, id: String) -> void:
	clear()
	_yaw = 0.6
	var height := 0.7
	var scl := 1.0
	match kind:
		"creature", "colossal":
			var parts := id.split(":")
			var cid := parts[0]
			var variant := parts[1] if parts.size() > 1 else ""
			var acc := parts[2] if parts.size() > 2 else ""
			if not CreatureModels.has_model(cid):
				var ph := Node3D.new()
				var mi := MeshInstance3D.new()
				var sm := SphereMesh.new()
				sm.radius = 0.35
				sm.height = 0.7
				mi.mesh = sm
				mi.material_override = MeshKit.glass(Color("9fb4c0"), 0.35)
				mi.position.y = 0.45
				ph.add_child(mi)
				var l := Label3D.new()
				l.text = "?"
				l.font_size = 120
				l.pixel_size = 0.004
				l.modulate = Color("5f6f78")
				l.position = Vector3(0, 0.45, 0)
				l.billboard = BaseMaterial3D.BILLBOARD_ENABLED
				ph.add_child(l)
				current = ph
				height = 0.9
			else:
				rig = CreatureModels.build(cid, variant, acc)
				current = rig
				var d: CreatureData = DB.creature(cid)
				height = d.height if d else 0.7
		"outfit", "player":
			var a: Dictionary = GameState.data.appearance.duplicate()
			if kind == "outfit":
				var p := id.split(":")
				match p[0]:
					"top": a.top = p[1]
					"hat": a.hat = p[1]
					"backpack": a.backpack = p[1]
			var pm := PlayerModel.new()
			pm.rebuild(a)
			current = pm
			height = 1.75
		"decoration":
			var m := Props.node(Props.decoration(id), "solid")
			current = m
			height = 2.0
		_:
			var n := Node3D.new()
			current = n
	pivot.add_child(current)
	# Frame the subject.
	var big := height > 3.0
	scl = 1.0 / height * (1.25 if not big else 1.6)
	if kind == "outfit" or kind == "player":
		scl = 0.95
	pivot.scale = Vector3.ONE * scl
	var h := height * scl
	var cp := Vector3(0, h * 0.62 + 0.15, 2.9 if not big else 3.1)
	# Basis.looking_at works before the viewer is inside the tree.
	cam.transform = Transform3D(Basis.looking_at(Vector3(0, h * 0.45, 0) - cp, Vector3.UP), cp)

func play(anim: String) -> void:
	if rig == null:
		if current is PlayerModel:
			(current as PlayerModel).action({"happy": "cheer", "interact": "wave"}.get(anim, "wave"), 1.4)
		return
	match anim:
		"walk":
			rig.sleeping = false
			rig.speed = 1.0 if rig.speed < 0.5 else 0.0
		"sleep":
			rig.speed = 0.0
			rig.sleeping = not rig.sleeping
		_:
			rig.sleeping = false
			rig.emote(anim, 1.8)

func _gui_input(event: InputEvent) -> void:
	if event is InputEventMouseButton and event.button_index == MOUSE_BUTTON_LEFT:
		_drag = event.pressed
	elif event is InputEventScreenTouch:
		_drag = event.pressed
	elif (event is InputEventMouseMotion and _drag) or event is InputEventScreenDrag:
		_yaw += event.relative.x * 0.012
		_idle = 0.0

func _process(delta: float) -> void:
	# Keep the subject framed on both tall and wide layouts.
	cam.keep_aspect = Camera3D.KEEP_WIDTH if size.y > size.x else Camera3D.KEEP_HEIGHT
	_idle += delta
	if auto_rotate and _idle > 2.0 and not _drag:
		_yaw += delta * 0.5
	pivot.rotation.y = lerp_angle(pivot.rotation.y, _yaw, clampf(delta * 10.0, 0.0, 1.0))
