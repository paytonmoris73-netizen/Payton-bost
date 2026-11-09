class_name EmberTerrain
extends MeadowTerrain
## Height field for Emberfall Highlands: ash plains, a winding lava river, the
## Dragonstone Ridge, a cliff with the Ashen Caverns and the steaming Cinder Lake.

const LAVA_Y := -0.6
const LAKE := Vector2(-42, 58)
const LAKE_Y := -0.4

func _init() -> void:
	super._init()
	noise.seed = 9001
	noise2.seed = 4242

static func lava_x(z: float) -> float:
	return 34.0 + 9.0 * sin(z * 0.032) + 4.0 * sin(z * 0.011 + 2.0)

func height(x: float, z: float) -> float:
	var h := noise.get_noise_2d(x, z) * 3.8 + noise2.get_noise_2d(x, z) * 0.7 + 1.4
	h += 9.0 * _gauss(x + 62, z + 15, 20)  # Dragonstone Ridge
	h += 4.0 * _gauss(x + 70, z - 25, 14)
	h += 2.0 * _gauss(x - 74, z + 40, 14)  # forge mound
	h = lerpf(h, 2.6, 1.0 - smoothstep(14.0, 28.0, Vector2(x, z).length()))  # village plateau
	var forge := Vector2(x - 74, z + 40).length()
	h = lerpf(h, 3.2, 1.0 - smoothstep(9.0, 16.0, forge))
	var cliff := smoothstep(CLIFF_Z + 3.0, CLIFF_Z - 3.0, z)
	h = lerpf(h, HIGH_Y + noise2.get_noise_2d(x, z) * 0.8, cliff)
	# Lava channel (below the cliff only).
	if z > CLIFF_Z - 2.0 and z < 112.0:
		var d := absf(x - lava_x(z))
		h = lerpf(-1.4, h, smoothstep(4.0, 9.5, d))
	# Cinder Lake bowl.
	var ld := Vector2(x, z).distance_to(LAKE)
	h = lerpf(-2.6, h, smoothstep(9.0, 18.0, ld))
	h += smoothstep(108.0, 135.0, Vector2(x, z).length()) * 24.0
	return h

func is_lava(x: float, z: float) -> bool:
	return z > CLIFF_Z and z < 112.0 and absf(x - lava_x(z)) < 6.0 and height(x, z) < LAVA_Y + 0.15

func water_level_at(x: float, z: float) -> float:
	return LAKE_Y if Vector2(x, z).distance_to(LAKE) < 18.0 else -INF

func is_water(x: float, z: float) -> bool:
	return height(x, z) < water_level_at(x, z) - 0.05

func _color(x: float, z: float, h: float, n: Vector3) -> Color:
	var ash_a := Color("5d4f45")
	var ash_b := Color("7a6352")
	var c := ash_a.lerp(ash_b, clampf(noise2.get_noise_2d(x * 1.7, z * 1.7) * 0.5 + 0.5, 0.0, 1.0))
	# Patches of hardy red grass and moss near the village and lake.
	var lush := exp(-Vector2(x, z).length_squared() / 1500.0) + exp(-Vector2(x, z).distance_squared_to(LAKE) / 900.0)
	c = c.lerp(Color("8a5a32"), clampf(lush, 0.0, 0.8) * 0.6)
	var pd := path_distance(x, z)
	c = c.lerp(Color("b07a4a"), smoothstep(2.6, 1.1, pd) * 0.9)
	c = c.lerp(Color("9a8d80"), smoothstep(9.0, 7.5, Vector2(x, z).length()))
	c = c.lerp(Color("2b2524"), smoothstep(0.82, 0.62, n.y))  # basalt slopes
	# Glowing scorched edges along the lava.
	if z > CLIFF_Z and z < 112.0:
		var d := absf(x - lava_x(z))
		c = c.lerp(Color("1e1a19"), smoothstep(11.0, 6.0, d))
		c = c.lerp(Color("c4481c"), smoothstep(6.5, 5.0, d) * 0.7)
	if Vector2(x, z).distance_to(LAKE) < 19.0:
		c = c.lerp(Color("6b6560"), smoothstep(19.0, 15.0, Vector2(x, z).distance_to(LAKE)))
	return c

func map_color(x: float, z: float) -> Color:
	if is_lava(x, z) or (z > CLIFF_Z and z < 112.0 and absf(x - lava_x(z)) < 5.0):
		return Color("ff6a1f")
	return super.map_color(x, z)
