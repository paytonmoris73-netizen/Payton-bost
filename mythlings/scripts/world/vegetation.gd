class_name Vegetation
## Scatters grass and flowers as chunked MultiMeshes with distance culling.
## Density scales with the graphics quality setting.

const K := preload("res://scripts/core/mesh_kit.gd")
const CHUNK := 30.0

static func quality_scale() -> float:
	return {"low": 0.35, "medium": 1.0, "high": 1.6}.get(GameState.setting("graphics"), 1.0)

static func view_range() -> float:
	return {"low": 45.0, "medium": 70.0, "high": 100.0}.get(GameState.setting("graphics"), 70.0)

static func flower_mesh(c: Color) -> ArrayMesh:
	return Props.cached("flower_" + c.to_html(), func():
		var m := MeshMerger.new()
		m.put(K.cyl(0.008, 0.012, 0.32, 4), Vector3(0, 0.16, 0), Color("4f8a3a"), Vector3.ZERO, Vector3.ONE, 0.5)
		for k in 5:
			m.put(K.sphere(0.042, 6, 3), Vector3(cos(k * TAU / 5) * 0.045, 0.33, sin(k * TAU / 5) * 0.045), c, Vector3.ZERO, Vector3(1, 0.4, 1), 1.0)
		m.put(K.sphere(0.024, 6, 3), Vector3(0, 0.345, 0), Color("f5d04a"), Vector3.ZERO, Vector3.ONE, 1.0)
		return m.commit())

## accept(x, z) -> float density multiplier (0 = none)
static func scatter(parent: Node3D, terrain: MeadowTerrain, area: Rect2, per_chunk: int, mesh: Mesh, accept: Callable, seed_v: int, tint_a: Color, tint_b: Color, scale_min := 0.8, scale_max := 1.4) -> void:
	var rng := RandomNumberGenerator.new()
	rng.seed = seed_v
	var mat := Props.material("foliage_mm")
	var count := int(per_chunk * quality_scale())
	var cx := int(ceil(area.size.x / CHUNK))
	var cz := int(ceil(area.size.y / CHUNK))
	for i in cx:
		for j in cz:
			var origin := area.position + Vector2(i * CHUNK, j * CHUNK)
			var xfs: Array = []
			var cols: Array = []
			for n in count:
				var x := origin.x + rng.randf() * CHUNK
				var z := origin.y + rng.randf() * CHUNK
				var dens: float = accept.call(x, z)
				if dens <= 0.0 or rng.randf() > dens:
					continue
				var y := terrain.height(x, z)
				var s := rng.randf_range(scale_min, scale_max)
				var b := Basis(Vector3.UP, rng.randf() * TAU).scaled(Vector3(s, s * rng.randf_range(0.8, 1.2), s))
				xfs.append(Transform3D(b, Vector3(x, y - 0.03, z)))
				cols.append(tint_a.lerp(tint_b, rng.randf()))
			if xfs.is_empty():
				continue
			var mm := MultiMesh.new()
			mm.transform_format = MultiMesh.TRANSFORM_3D
			mm.use_custom_data = false
			mm.mesh = mesh
			mm.instance_count = xfs.size()
			for k in xfs.size():
				mm.set_instance_transform(k, xfs[k])
			var mmi := MultiMeshInstance3D.new()
			mmi.multimesh = mm
			mmi.material_override = mat
			mmi.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
			mmi.visibility_range_end = view_range()
			mmi.visibility_range_end_margin = 8.0
			mmi.visibility_range_fade_mode = GeometryInstance3D.VISIBILITY_RANGE_FADE_SELF
			# Visibility range is measured from the node origin, so centre it on the chunk.
			var centre := Vector3(origin.x + CHUNK * 0.5, 0, origin.y + CHUNK * 0.5)
			mmi.position = centre
			for k in xfs.size():
				var t: Transform3D = xfs[k]
				t.origin -= centre
				mm.set_instance_transform(k, t)
			parent.add_child(mmi)

## Large props (trees, rocks) as one MultiMesh per mesh type.
static func instances(parent: Node3D, mesh: Mesh, xforms: Array, kind := "foliage", shadows := true, range_end := 0.0) -> MultiMeshInstance3D:
	var mm := MultiMesh.new()
	mm.transform_format = MultiMesh.TRANSFORM_3D
	mm.use_custom_data = false
	mm.mesh = mesh
	mm.instance_count = xforms.size()
	for k in xforms.size():
		mm.set_instance_transform(k, xforms[k])
	var mmi := MultiMeshInstance3D.new()
	mmi.multimesh = mm
	mmi.material_override = Props.material(kind)
	mmi.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_ON if shadows else GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
	if range_end > 0.0:
		mmi.visibility_range_end = range_end
	parent.add_child(mmi)
	return mmi
