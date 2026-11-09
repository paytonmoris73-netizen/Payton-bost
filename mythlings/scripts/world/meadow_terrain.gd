class_name MeadowTerrain
extends RefCounted
## Height field for Whispering Meadow. The same analytic function drives the
## render mesh, the collision heightmap, vegetation scatter and creature footing,
## so everything agrees about where the ground is.

const SIZE := 300.0  # metres across
const RES := 150  # cells per side
const WATER_Y := -0.35
const HIGH_Y := 11.0  # plateau above the waterfall
const CLIFF_Z := -78.0

var noise := FastNoiseLite.new()
var noise2 := FastNoiseLite.new()
## Polylines used to paint dirt paths.
var paths: Array = []

func _init() -> void:
	noise.seed = 1337
	noise.frequency = 0.012
	noise.fractal_octaves = 3
	noise2.seed = 99
	noise2.frequency = 0.05

static func river_x(z: float) -> float:
	return -38.0 + 7.0 * sin(z * 0.035) + 3.0 * sin(z * 0.011 + 1.0)

static func _gauss(dx: float, dz: float, r: float) -> float:
	return exp(-(dx * dx + dz * dz) / (r * r))

## Ground height without water.
func height(x: float, z: float) -> float:
	var h := noise.get_noise_2d(x, z) * 3.2 + noise2.get_noise_2d(x, z) * 0.5 + 1.2
	# Landmark shapes.
	h += 5.0 * _gauss(x - 34, z - 20, 16)  # windmill hill
	h += 2.4 * _gauss(x - 62, z + 30, 15)  # ancient oak mound
	h += 1.5 * _gauss(x + 75, z + 10, 30)  # woods rise
	h -= 1.0 * _gauss(x - 45, z - 58, 18)  # clearing hollow
	# Village plateau.
	var dv := Vector2(x, z).length()
	h = lerpf(2.0, h, smoothstep(16.0, 30.0, dv))
	# North highland and cliff (waterfall source).
	var cliff := smoothstep(CLIFF_Z + 3.0, CLIFF_Z - 3.0, z)
	h = lerpf(h, HIGH_Y + noise2.get_noise_2d(x, z) * 0.6, cliff)
	# River channel.
	var rx := river_x(z)
	var d := absf(x - rx)
	if z > CLIFF_Z - 2.0:
		var bed := -1.25
		h = lerpf(bed, h, smoothstep(4.5, 10.0, d))
	else:
		var bed_hi := HIGH_Y - 0.9
		h = lerpf(bed_hi, h, smoothstep(3.5, 7.5, d))
	# Waterfall plunge pool (deep enough to swim).
	var pool := _gauss(x - river_x(CLIFF_Z + 9.0), z - (CLIFF_Z + 9.0), 9.0)
	h = lerpf(h, -3.2, smoothstep(0.35, 0.8, pool))
	# Outer rim hills keep players inside the map.
	var r := Vector2(x, z).length()
	h += smoothstep(108.0, 135.0, r) * 22.0
	return h

## Effective standing height (ground) – water handled by the player.
func ground(x: float, z: float) -> float:
	return height(x, z)

func water_level_at(x: float, z: float) -> float:
	if z < CLIFF_Z - 1.0:
		return HIGH_Y - 0.3 if absf(x - river_x(z)) < 7.0 else -INF
	return WATER_Y

func is_water(x: float, z: float) -> bool:
	return height(x, z) < water_level_at(x, z) - 0.05

func normal(x: float, z: float) -> Vector3:
	var e := 0.6
	return Vector3(height(x - e, z) - height(x + e, z), 2.0 * e, height(x, z - e) - height(x, z + e)).normalized()

func path_distance(x: float, z: float) -> float:
	var p := Vector2(x, z)
	var best := INF
	for line in paths:
		for i in line.size() - 1:
			var a: Vector2 = line[i]
			var b: Vector2 = line[i + 1]
			var q := Geometry2D.get_closest_point_to_segment(p, a, b)
			best = minf(best, p.distance_to(q))
	return best

func _color(x: float, z: float, h: float, n: Vector3) -> Color:
	var grass_a := Color("5f9a3e")
	var grass_b := Color("7fae4a")
	var woods := Color("3f6e34")
	var c := grass_a.lerp(grass_b, clampf(noise2.get_noise_2d(x * 1.7, z * 1.7) * 0.5 + 0.5, 0.0, 1.0))
	# Darker, mossier floor in Whispering Woods (west of the river).
	var wood_f := smoothstep(-48.0, -62.0, x) * smoothstep(-95.0, -70.0, z) * smoothstep(70.0, 45.0, z)
	c = c.lerp(woods, wood_f * 0.85)
	# Golden flower meadow near the clearing.
	c = c.lerp(Color("9dbb55"), _gauss(x - 45, z - 58, 22) * 0.6)
	# Dirt paths.
	var pd := path_distance(x, z)
	c = c.lerp(Color("b49a6a"), smoothstep(2.6, 1.1, pd) * 0.92)
	# Village square paving.
	var dv := Vector2(x, z).length()
	c = c.lerp(Color("b8ad95"), smoothstep(9.0, 7.5, dv))
	# Rock on steep slopes and cliffs.
	var steep := smoothstep(0.82, 0.62, n.y)
	c = c.lerp(Color("8a8378"), steep)
	# Sand / pebbles on banks and wet bed.
	var wl := water_level_at(x, z)
	if wl > -INF:
		c = c.lerp(Color("c9b98e"), smoothstep(wl + 1.2, wl + 0.2, h) * 0.85)
		c = c.lerp(Color("7f8a72"), smoothstep(wl - 0.1, wl - 0.6, h))
	return c

## Colour for the 2D region map (water, paths and ground as the player sees them).
func map_color(x: float, z: float) -> Color:
	if is_water(x, z):
		return Color("6ab8d8")
	var h := height(x, z)
	return _color(x, z, h, normal(x, z)).lightened(0.08)

func build_mesh() -> ArrayMesh:
	var st := SurfaceTool.new()
	st.begin(Mesh.PRIMITIVE_TRIANGLES)
	var step := SIZE / RES
	var half := SIZE * 0.5
	var heights := PackedFloat32Array()
	heights.resize((RES + 1) * (RES + 1))
	for j in RES + 1:
		for i in RES + 1:
			heights[j * (RES + 1) + i] = height(-half + i * step, -half + j * step)
	for j in RES + 1:
		for i in RES + 1:
			var x := -half + i * step
			var z := -half + j * step
			var h := heights[j * (RES + 1) + i]
			var hl := heights[j * (RES + 1) + max(i - 1, 0)]
			var hr := heights[j * (RES + 1) + min(i + 1, RES)]
			var hd := heights[max(j - 1, 0) * (RES + 1) + i]
			var hu := heights[min(j + 1, RES) * (RES + 1) + i]
			var n := Vector3(hl - hr, 2.0 * step, hd - hu).normalized()
			st.set_normal(n)
			st.set_color(_color(x, z, h, n))
			st.set_uv(Vector2(x, z) * 0.1)
			st.add_vertex(Vector3(x, h, z))
	for j in RES:
		for i in RES:
			var a := j * (RES + 1) + i
			var b := a + 1
			var c := a + RES + 1
			var d := c + 1
			st.add_index(a); st.add_index(b); st.add_index(c)
			st.add_index(b); st.add_index(d); st.add_index(c)
	return st.commit()

## Collision: uniform-scaled HeightMapShape3D (heights pre-divided by cell size).
func build_collision() -> CollisionShape3D:
	var step := SIZE / RES
	var half := SIZE * 0.5
	var shape := HeightMapShape3D.new()
	shape.map_width = RES + 1
	shape.map_depth = RES + 1
	var data := PackedFloat32Array()
	data.resize((RES + 1) * (RES + 1))
	for j in RES + 1:
		for i in RES + 1:
			data[j * (RES + 1) + i] = height(-half + i * step, -half + j * step) / step
	shape.map_data = data
	var cs := CollisionShape3D.new()
	cs.shape = shape
	cs.scale = Vector3.ONE * step
	return cs
