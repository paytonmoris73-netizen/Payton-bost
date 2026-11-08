class_name AbilityFX
## Visual presentation for abilities. Each style pairs a body reaction (emote,
## glow) with an environmental effect built from cheap particles and meshes.
## "Reduced effects" in Settings halves particles and skips dynamic lights.

const K := preload("res://scripts/core/mesh_kit.gd")

static func reduced() -> bool:
	return bool(GameState.setting("reduced_effects")) or GameState.setting("graphics") == "low"

static func play(style: String, c: Creature, color: Color, big := false) -> void:
	if c == null or not c.is_inside_tree():
		return
	var parent := c.get_parent()
	var s := (6.0 if c.data.is_colossal() else (2.2 if c.data.is_large() else 1.0)) * (1.6 if big else 1.0)
	var origin := c.global_position
	# Body reaction.
	match style:
		"ember_crown": c.emote("roar", 1.6)
		"root_wave", "rune_pulse": c.emote("stomp" if c.data.size_class != "small" else "happy", 1.2)
		_: c.emote("discovery" if c.data.size_class == "small" else "happy", 1.2)
	_flash(c, color, s)
	var n := 1.0 if not reduced() else 0.5
	match style:
		"leaf_spiral":
			var p := _particles(parent, origin + Vector3(0, 0.3 * s, 0), Color("86c45e"), int(40 * n), 0.06 * s, 2.0)
			p.mesh = K.petal(0.14 * s, 0.07 * s, 0.05)
			p.material_override = K.mat(color.lerp(Color("86c45e"), 0.5))
			p.orbit_velocity_min = 0.6
			p.orbit_velocity_max = 1.0
			p.direction = Vector3.UP
			p.spread = 25
			p.initial_velocity_min = 1.0 * s
			p.initial_velocity_max = 2.0 * s
			p.gravity = Vector3(0, -0.4, 0)
			p.emission_shape = CPUParticles3D.EMISSION_SHAPE_RING
			p.emission_ring_axis = Vector3.UP
			p.emission_ring_radius = 1.2 * s
			p.emission_ring_inner_radius = 0.8 * s
			p.emission_ring_height = 0.1
			p.emitting = true
		"ember_crown":
			FX.burst(parent, origin + Vector3(0, 0.7 * s, 0), Color("ffb347"), int(70 * n), 0.06 * s, 5.0 * sqrt(s), 1.6, 1.5)
			for i in 8:
				var a := TAU * i / 8.0
				var orb := K.add(parent, K.sphere(0.16 * s, 8, 4), K.glow(Color("ff7a2a"), 2.0), origin + Vector3(cos(a), 0.2, sin(a)) * 1.4 * s)
				_rise_fade(orb, Vector3(0, 1.4 * s, 0), 1.2)
		"star_field":
			for i in 10:
				var a := TAU * i / 10.0
				var r := (1.0 if i % 2 == 0 else 0.55) * 1.6 * s
				var st := K.add(parent, K.sphere(0.08 * s, 6, 3), K.glow(color, 2.0), origin + Vector3(0, 0.15, 0))
				var tw := st.create_tween()
				tw.tween_property(st, "global_position", origin + Vector3(cos(a) * r, 0.15 + 0.4 * s, sin(a) * r), 0.6).set_trans(Tween.TRANS_CUBIC).set_ease(Tween.EASE_OUT)
				tw.tween_property(st, "scale", Vector3.ONE * 0.01, 0.8)
				tw.tween_callback(st.queue_free)
			FX.burst(parent, origin + Vector3(0, 0.6 * s, 0), Color("fff2b0"), int(30 * n), 0.05 * s, 2.5, 1.4, -0.2)
		"water_ring":
			for k in 3:
				var ring := K.add(parent, K.torus(0.4 * s, 0.5 * s, 24), K.glass(color, 0.55), origin + Vector3(0, 0.08, 0), Vector3.ZERO, Vector3(1, 0.15, 1))
				var tw := ring.create_tween()
				tw.tween_interval(k * 0.25)
				tw.tween_property(ring, "scale", Vector3(5, 0.15, 5), 1.2).set_trans(Tween.TRANS_QUAD).set_ease(Tween.EASE_OUT)
				tw.parallel().tween_property(ring, "transparency", 1.0, 1.2)
				tw.tween_callback(ring.queue_free)
			FX.burst(parent, origin + Vector3(0, 0.5 * s, 0), color.lightened(0.3), int(36 * n), 0.05 * s, 3.0, 1.0, -6.0)
		"wind_column":
			var p := _particles(parent, origin, Color(1, 1, 1, 0.8), int(50 * n), 0.04 * s, 1.2)
			p.emission_shape = CPUParticles3D.EMISSION_SHAPE_RING
			p.emission_ring_axis = Vector3.UP
			p.emission_ring_radius = 0.9 * s
			p.emission_ring_inner_radius = 0.6 * s
			p.emission_ring_height = 0.2
			p.direction = Vector3.UP
			p.spread = 5
			p.initial_velocity_min = 5.0
			p.initial_velocity_max = 8.0
			p.orbit_velocity_min = 1.2
			p.orbit_velocity_max = 1.6
			p.gravity = Vector3.ZERO
			p.emitting = true
		"root_wave":
			for i in int(12 * n) + 4:
				var a := TAU * i / (int(12 * n) + 4)
				var d := randf_range(1.0, 2.6) * s
				var pos := origin + Vector3(cos(a) * d, 0, sin(a) * d)
				if MeadowLevel.current:
					pos.y = MeadowLevel.current.terrain.height(pos.x, pos.z)
				var sprout := Node3D.new()
				parent.add_child(sprout)
				sprout.global_position = pos
				K.add(sprout, K.cyl(0.02 * s, 0.05 * s, 0.6 * s, 5), K.mat(Color("4f8a3a")), Vector3(0, 0.3 * s, 0))
				K.add(sprout, K.petal(0.3 * s, 0.15 * s, 0.1), K.mat(color.lerp(Color("86c45e"), 0.4)), Vector3(0, 0.55 * s, 0), Vector3(-40, randf() * 360, 0))
				sprout.scale = Vector3.ONE * 0.01
				var tw := sprout.create_tween()
				tw.tween_interval(i * 0.03)
				tw.tween_property(sprout, "scale", Vector3.ONE, 0.45).set_trans(Tween.TRANS_BACK).set_ease(Tween.EASE_OUT)
				tw.tween_interval(1.6)
				tw.tween_property(sprout, "scale", Vector3.ONE * 0.01, 0.6)
				tw.tween_callback(sprout.queue_free)
			FX.burst(parent, origin + Vector3(0, 0.4 * s, 0), Color("c8ffb0"), int(30 * n), 0.05 * s, 2.5)
		"rune_pulse":
			for k in 3:
				var ring := K.add(parent, K.torus(0.5 * s, 0.6 * s, 24), K.glow(color, 1.6), origin + Vector3(0, 0.05, 0), Vector3.ZERO, Vector3(1, 0.1, 1))
				var tw := ring.create_tween()
				tw.tween_interval(k * 0.2)
				tw.tween_property(ring, "global_position", origin + Vector3(0, 1.4 * s, 0), 0.9)
				tw.parallel().tween_property(ring, "scale", Vector3(2.2, 0.1, 2.2), 0.9)
				tw.tween_callback(ring.queue_free)
		_:
			FX.burst(parent, origin + Vector3(0, 0.6 * s, 0), color, int(30 * n), 0.07 * s, 3.0, 1.2)

static func _flash(c: Creature, color: Color, s: float) -> void:
	if reduced():
		return
	var l := OmniLight3D.new()
	l.light_color = color
	l.omni_range = 5.0 * s
	l.light_energy = 2.5
	l.position = Vector3(0, c.data.height * 0.6, 0)
	c.add_child(l)
	var tw := l.create_tween()
	tw.tween_property(l, "light_energy", 0.0, 0.9)
	tw.tween_callback(l.queue_free)
	var v := c.rig.visual
	var tw2 := v.create_tween()
	tw2.tween_property(v, "scale", Vector3.ONE * 1.12, 0.12)
	tw2.tween_property(v, "scale", Vector3.ONE, 0.3).set_trans(Tween.TRANS_BACK)

static func _particles(parent: Node, pos: Vector3, color: Color, amount: int, size: float, life: float) -> CPUParticles3D:
	var p := CPUParticles3D.new()
	p.one_shot = true
	p.amount = maxi(amount, 4)
	p.lifetime = life
	p.explosiveness = 0.6
	var curve := Curve.new()
	curve.add_point(Vector2(0, 1))
	curve.add_point(Vector2(1, 0))
	p.scale_amount_curve = curve
	var m := SphereMesh.new()
	m.radius = size
	m.height = size * 2
	m.radial_segments = 6
	m.rings = 3
	m.material = K.glow(color, 1.2)
	p.mesh = m
	parent.add_child(p)
	p.global_position = pos
	parent.get_tree().create_timer(life + 0.6).timeout.connect(p.queue_free)
	return p

static func _rise_fade(n: Node3D, by: Vector3, t: float) -> void:
	var tw := n.create_tween()
	tw.tween_property(n, "global_position", n.global_position + by, t).set_trans(Tween.TRANS_QUAD).set_ease(Tween.EASE_OUT)
	tw.parallel().tween_property(n, "scale", Vector3.ONE * 0.01, t)
	tw.tween_callback(n.queue_free)
