class_name FX
## Small reusable particle bursts. CPUParticles3D keeps them working on every
## renderer and device. Each burst frees itself.

static func burst(parent: Node, pos: Vector3, color: Color, amount := 24, size := 0.08, speed := 2.5, lifetime := 0.9, gravity := -1.5) -> void:
	if parent == null or not parent.is_inside_tree():
		return
	var p := CPUParticles3D.new()
	p.one_shot = true
	p.emitting = false
	p.amount = amount
	p.lifetime = lifetime
	p.explosiveness = 0.9
	p.direction = Vector3.UP
	p.spread = 70.0
	p.initial_velocity_min = speed * 0.5
	p.initial_velocity_max = speed
	p.gravity = Vector3(0, gravity, 0)
	p.scale_amount_min = 0.6
	p.scale_amount_max = 1.2
	var curve := Curve.new()
	curve.add_point(Vector2(0, 1))
	curve.add_point(Vector2(1, 0))
	p.scale_amount_curve = curve
	var mesh := SphereMesh.new()
	mesh.radius = size
	mesh.height = size * 2
	mesh.radial_segments = 6
	mesh.rings = 3
	mesh.material = MeshKit.glow(color, 1.4)
	p.mesh = mesh
	parent.add_child(p)
	p.global_position = pos
	p.emitting = true
	parent.get_tree().create_timer(lifetime + 0.5).timeout.connect(p.queue_free)

static func motes(color: Color, amount := 16, extents := Vector3(2, 1, 2), size := 0.05) -> CPUParticles3D:
	## Continuous gentle floating motes (fireflies, magic dust, pollen).
	var p := CPUParticles3D.new()
	p.amount = amount
	p.lifetime = 4.0
	p.emission_shape = CPUParticles3D.EMISSION_SHAPE_BOX
	p.emission_box_extents = extents
	p.direction = Vector3.UP
	p.spread = 180.0
	p.initial_velocity_min = 0.05
	p.initial_velocity_max = 0.25
	p.gravity = Vector3(0, 0.05, 0)
	var curve := Curve.new()
	curve.add_point(Vector2(0, 0))
	curve.add_point(Vector2(0.2, 1))
	curve.add_point(Vector2(0.8, 1))
	curve.add_point(Vector2(1, 0))
	p.scale_amount_curve = curve
	var mesh := SphereMesh.new()
	mesh.radius = size
	mesh.height = size * 2
	mesh.radial_segments = 6
	mesh.rings = 3
	mesh.material = MeshKit.glow(color, 1.6)
	p.mesh = mesh
	return p

static func popup_text(parent: Node, pos: Vector3, text: String, color := Color.WHITE) -> void:
	if parent == null or not parent.is_inside_tree():
		return
	var l := Label3D.new()
	l.text = text
	l.billboard = BaseMaterial3D.BILLBOARD_ENABLED
	l.font = load("res://assets/fonts/Fredoka.ttf")
	l.font_size = 64
	l.pixel_size = 0.006
	l.outline_size = 14
	l.modulate = color
	l.outline_modulate = Color(0, 0, 0, 0.55)
	l.no_depth_test = true
	parent.add_child(l)
	l.global_position = pos
	var tw := l.create_tween()
	tw.tween_property(l, "global_position", pos + Vector3(0, 1.2, 0), 1.2).set_trans(Tween.TRANS_CUBIC).set_ease(Tween.EASE_OUT)
	tw.parallel().tween_property(l, "modulate:a", 0.0, 1.2).set_delay(0.5)
	tw.tween_callback(l.queue_free)
