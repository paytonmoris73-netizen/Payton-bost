class_name PlayerModel
extends Node3D
## Procedural, customisable Keeper character with a simple limb rig.
## `rebuild(appearance)` swaps hair/clothes without touching gameplay code.

const K := preload("res://scripts/core/mesh_kit.gd")

var root: Node3D
var hips: Node3D
var torso: Node3D
var head: Node3D
var arm_l: Node3D
var arm_r: Node3D
var leg_l: Node3D
var leg_r: Node3D
var eyes: Array = []

var speed := 0.0  # 0 idle, 1 walk, 2 run
var airborne := false
var riding := false
var swimming := false
var _phase := 0.0
var _t := 0.0
var _action := ""
var _action_t := 0.0
var _blink := 3.0

func _ready() -> void:
	if root == null:
		rebuild(GameState.data.appearance)

func rebuild(a: Dictionary) -> void:
	if root:
		root.queue_free()
	eyes.clear()
	root = K.pivot(self, Vector3.ZERO, "Body")
	var skin := Color(String(a.get("skin", "e8b994")))
	var hair_c := Color(String(a.get("hair_color", "6b4423")))
	var top_c := Color(String(a.get("top_color", "4f8a5b")))
	var pants_c := Color(String(a.get("pants_color", "3b4a6b")))
	var shoe_c := Color(String(a.get("shoes_color", "6b4423")))
	var top := String(a.get("top", "tunic"))
	hips = K.pivot(root, Vector3(0, 0.82, 0), "Hips")
	# Legs
	for sx in [-1, 1]:
		var leg := K.pivot(hips, Vector3(0.09 * sx, 0, 0), "Leg")
		K.add(leg, K.capsule(0.068, 0.5), K.mat(pants_c), Vector3(0, -0.24, 0))
		K.add(leg, K.capsule(0.06, 0.42), K.mat(pants_c), Vector3(0, -0.56, 0))
		K.add(leg, K.box(Vector3(0.12, 0.09, 0.2)), K.mat(shoe_c, 0.7), Vector3(0, -0.78, -0.03))
		K.add(leg, K.sphere(0.06, 10, 5), K.mat(shoe_c, 0.7), Vector3(0, -0.77, -0.12), Vector3.ZERO, Vector3(1, 0.7, 1))
		if sx < 0: leg_l = leg
		else: leg_r = leg
	torso = K.pivot(hips, Vector3(0, 0.05, 0), "Torso")
	K.add(torso, K.capsule(0.17, 0.56), K.mat(top_c), Vector3(0, 0.27, 0), Vector3.ZERO, Vector3(1.0, 1.0, 0.75))
	_build_top(top, top_c)
	K.add(torso, K.cyl(0.05, 0.055, 0.1, 10), K.mat(skin), Vector3(0, 0.6, 0))
	# Arms
	for sx in [-1, 1]:
		var arm := K.pivot(torso, Vector3(0.21 * sx, 0.5, 0), "Arm", Vector3(0, 0, 6 * sx))
		var sleeve := top_c.darkened(0.05)
		K.add(arm, K.capsule(0.055, 0.32), K.mat(sleeve), Vector3(0, -0.14, 0))
		K.add(arm, K.capsule(0.048, 0.3), K.mat(skin if top in ["vest", "tunic"] else sleeve), Vector3(0, -0.4, 0))
		K.add(arm, K.sphere(0.055, 10, 5), K.mat(skin), Vector3(0, -0.57, 0))
		if sx < 0: arm_l = arm
		else: arm_r = arm
	# Head
	head = K.pivot(torso, Vector3(0, 0.72, 0), "Head")
	K.add(head, K.sphere(0.165, 20, 10), K.mat(skin, 0.8), Vector3(0, 0.12, 0), Vector3.ZERO, Vector3(0.95, 1.0, 0.95))
	for sx in [-1, 1]:
		eyes.append(K.eye(head, Vector3(0.058 * sx, 0.12, -0.148), 0.026, Color("2a2230")))
		K.add(head, K.sphere(0.022, 8, 4), K.mat(skin.lerp(Color("e88a7a"), 0.45)), Vector3(0.1 * sx, 0.06, -0.13), Vector3.ZERO, Vector3(1, 0.6, 0.4))
		K.add(head, K.box(Vector3(0.05, 0.012, 0.012)), K.mat(hair_c.darkened(0.2)), Vector3(0.06 * sx, 0.172, -0.152), Vector3(0, 0, -8 * sx))
		K.add(head, K.sphere(0.035, 8, 4), K.mat(skin), Vector3(0.16 * sx, 0.11, 0.0), Vector3.ZERO, Vector3(0.5, 1, 0.8))
	K.add(head, K.sphere(0.018, 8, 4), K.mat(skin.darkened(0.08)), Vector3(0, 0.09, -0.163))
	K.add(head, K.torus(0.01, 0.022, 10), K.mat(Color("8a4a42")), Vector3(0, 0.045, -0.15), Vector3(80, 0, 0), Vector3(1, 1, 0.4))
	_build_hair(String(a.get("hair_style", "tousled")), hair_c)
	_build_hat(String(a.get("hat", "none")), hair_c)
	_build_backpack(String(a.get("backpack", "satchel")))

func _build_top(top: String, c: Color) -> void:
	match top:
		"tunic":
			K.add(torso, K.cyl(0.2, 0.17, 0.2, 14), K.mat(c), Vector3(0, -0.02, 0), Vector3.ZERO, Vector3(1, 1, 0.8))
			K.add(torso, K.torus(0.16, 0.19, 18), K.mat(Color("6b4423"), 0.6), Vector3(0, 0.1, 0), Vector3.ZERO, Vector3(1, 1.5, 0.78))
			K.add(torso, K.box(Vector3(0.06, 0.05, 0.02)), K.mat(Color("e8b64c"), 0.3, Color.BLACK, 1, 0.6), Vector3(0, 0.1, -0.135))
		"vest":
			K.add(torso, K.capsule(0.175, 0.5), K.mat(Color("f0ebe0")), Vector3(0, 0.29, 0.003), Vector3.ZERO, Vector3(0.98, 0.96, 0.72))
			for sx in [-1, 1]:
				K.add(torso, K.box(Vector3(0.14, 0.4, 0.05)), K.mat(c), Vector3(0.09 * sx, 0.3, -0.115), Vector3(0, 12 * sx, 0))
		"explorer_jacket":
			K.add(torso, K.capsule(0.185, 0.58), K.mat(c), Vector3(0, 0.26, 0), Vector3.ZERO, Vector3(1, 1, 0.78))
			K.add(torso, K.torus(0.07, 0.12, 14), K.mat(c.darkened(0.2)), Vector3(0, 0.55, 0), Vector3.ZERO, Vector3(1, 1.2, 1))
			for sx in [-1, 1]:
				K.add(torso, K.box(Vector3(0.08, 0.07, 0.03)), K.mat(c.darkened(0.25)), Vector3(0.09 * sx, 0.2, -0.14))
		"star_robe":
			K.add(torso, K.cyl(0.18, 0.3, 0.9, 16), K.mat(Color("232a5c"), 0.6), Vector3(0, -0.12, 0), Vector3.ZERO, Vector3(1, 1, 0.85))
			for i in 7:
				var a := i * 0.9
				K.add(torso, K.sphere(0.014, 6, 3), K.glow(Color("ffe08a"), 1.4), Vector3(cos(a) * 0.22, -0.3 + i * 0.07, sin(a) * 0.19 - 0.02))
		_:
			K.add(torso, K.capsule(0.18, 0.55), K.mat(c), Vector3(0, 0.27, 0), Vector3.ZERO, Vector3(1, 1, 0.78))

func _build_hair(style: String, c: Color) -> void:
	var m := K.mat(c, 0.75)
	K.add(head, K.sphere(0.175, 18, 9), m, Vector3(0, 0.16, 0.015), Vector3.ZERO, Vector3(1.0, 0.9, 1.0))
	match style:
		"short":
			K.add(head, K.sphere(0.1, 10, 5), m, Vector3(0.05, 0.26, -0.1), Vector3(0, 0, 20), Vector3(1.2, 0.5, 0.8))
		"tousled":
			for i in 5:
				K.add(head, K.petal(0.12, 0.08, 0.06, 0.03), m, Vector3(-0.1 + i * 0.05, 0.26, -0.1), Vector3(-80, 0, -30 + i * 15))
		"long":
			K.add(head, K.capsule(0.15, 0.5), m, Vector3(0, -0.03, 0.06), Vector3.ZERO, Vector3(1.1, 1, 0.7))
			K.add(head, K.petal(0.14, 0.1, 0.06), m, Vector3(0.0, 0.27, -0.11), Vector3(-80, 0, 25))
		"bun":
			K.add(head, K.sphere(0.08, 12, 6), m, Vector3(0, 0.33, 0.06))
		"braids":
			for sx in [-1, 1]:
				for k in 4:
					K.add(head, K.sphere(0.04, 8, 4), m, Vector3(0.13 * sx, 0.02 - k * 0.07, 0.07))
		"curly":
			for i in 14:
				var a := i * TAU / 14.0
				K.add(head, K.sphere(0.06, 8, 4), m, Vector3(cos(a) * 0.16, 0.2 + sin(i * 1.3) * 0.04, sin(a) * 0.15 + 0.02))

func _build_hat(hat: String, hair_c: Color) -> void:
	match hat:
		"headband":
			K.add(head, K.torus(0.16, 0.185, 20), K.mat(Color("c4583f")), Vector3(0, 0.22, 0.01), Vector3(-8, 0, 0))
		"leaf_cap":
			K.add(head, K.sphere(0.18, 16, 8), K.mat(Color("4f8a5b")), Vector3(0, 0.2, 0.01), Vector3.ZERO, Vector3(1.04, 0.75, 1.04))
			K.add(head, K.petal(0.14, 0.08, 0.1), K.mat(Color("86c45e")), Vector3(0, 0.33, 0), Vector3(-20, 0, 15))
		"explorer_hat":
			K.add(head, K.cyl(0.3, 0.3, 0.02, 20), K.mat(Color("b08a55")), Vector3(0, 0.25, 0))
			K.add(head, K.cyl(0.15, 0.17, 0.14, 16), K.mat(Color("b08a55")), Vector3(0, 0.32, 0))
			K.add(head, K.cyl(0.172, 0.172, 0.04, 16), K.mat(Color("5a3a20")), Vector3(0, 0.27, 0))
		"flower_crown":
			K.add(head, K.torus(0.15, 0.175, 20), K.mat(Color("5a8a3a")), Vector3(0, 0.25, 0.01), Vector3(-6, 0, 0))
			for i in 8:
				var a := TAU * i / 8.0
				K.add(head, K.sphere(0.03, 8, 4), K.mat([Color("f2a7c3"), Color("f4e27a"), Color.WHITE, Color("c49af0")][i % 4]), Vector3(cos(a) * 0.165, 0.27, sin(a) * 0.165))
		"star_circlet":
			K.add(head, K.torus(0.165, 0.178, 24), K.mat(Color("e8c66a"), 0.3, Color.BLACK, 1, 0.8), Vector3(0, 0.2, 0.0), Vector3(-12, 0, 0))
			K.add(head, K.sphere(0.03, 8, 4), K.glow(Color("fff2b0"), 1.8), Vector3(0, 0.235, -0.17))

func _build_backpack(bp: String) -> void:
	match bp:
		"satchel":
			K.add(torso, K.box(Vector3(0.08, 0.2, 0.22)), K.mat(Color("8a5a32"), 0.7), Vector3(0.2, 0.0, 0.05), Vector3(0, 0, 8))
			K.add(torso, K.torus(0.24, 0.255, 20), K.mat(Color("6b4423")), Vector3(0.02, 0.32, 0), Vector3(0, 0, 50), Vector3(1, 1, 0.8))
		"rucksack":
			K.add(torso, K.box(Vector3(0.3, 0.38, 0.16)), K.mat(Color("5a6b3a"), 0.8), Vector3(0, 0.3, 0.18))
			K.add(torso, K.capsule(0.06, 0.34), K.mat(Color("c4583f")), Vector3(0, 0.52, 0.18), Vector3(0, 0, 90))
		"mossbun_pack":
			K.add(torso, K.sphere(0.17, 14, 7), K.mat(Color("6f9c4b"), 0.95), Vector3(0, 0.3, 0.2))
			for sx in [-1, 1]:
				K.add(torso, K.petal(0.16, 0.09, 0.08), K.mat(Color("86c45e")), Vector3(0.07 * sx, 0.43, 0.2), Vector3(10, 0, -25 * sx))
				K.add(torso, K.sphere(0.02, 6, 3), K.mat(Color("1d1a22"), 0.2), Vector3(0.05 * sx, 0.33, 0.04))
		"lantern_pack":
			K.add(torso, K.box(Vector3(0.28, 0.34, 0.15)), K.mat(Color("6b4423"), 0.8), Vector3(0, 0.3, 0.18))
			K.add(torso, K.cyl(0.05, 0.05, 0.1, 8), K.mat(Color("fff0b8"), 0.4, Color("ffc85a"), 2.0), Vector3(0.12, 0.55, 0.22))

func action(n: String, length := 0.6) -> void:
	_action = n
	_action_t = length

func _process(delta: float) -> void:
	if root == null:
		return
	_t += delta
	var move: float = clampf(speed, 0.0, 2.0)
	_phase += delta * (7.0 + move * 2.5) * (1.0 if move > 0.05 else 0.0)
	var swing := sin(_phase) * (30.0 + 12.0 * maxf(move - 1.0, 0.0)) * minf(move, 1.0)
	var leg_a := swing
	var arm_a := -swing * 0.9
	var lean := move * 5.0
	var bob := absf(sin(_phase)) * 0.035 * minf(move, 1.5)
	var breath := sin(_t * 2.2) * 0.008
	if airborne and not riding:
		leg_a = -25.0
		arm_a = -150.0 * 0.35
	if riding:
		leg_a = -70.0
		arm_a = -40.0
		bob = 0.0
		lean = 8.0
	if swimming:
		lean = 40.0
		arm_a = sin(_t * 4.0) * 60.0
		leg_a = sin(_t * 6.0) * 20.0
	leg_l.rotation_degrees.x = leg_a
	leg_r.rotation_degrees.x = -leg_a if not riding else leg_a
	if riding:
		leg_l.rotation_degrees.z = -25
		leg_r.rotation_degrees.z = 25
	else:
		leg_l.rotation_degrees.z = 0
		leg_r.rotation_degrees.z = 0
	arm_l.rotation_degrees.x = arm_a
	arm_r.rotation_degrees.x = -arm_a if not (airborne or riding) else arm_a
	if _action != "":
		_action_t -= delta
		match _action:
			"interact":
				arm_r.rotation_degrees.x = -75.0
			"wave":
				arm_r.rotation_degrees = Vector3(0, 0, 150 + sin(_t * 14.0) * 20.0)
			"gather":
				arm_r.rotation_degrees.x = -60.0 + sin(_t * 16.0) * 20.0
				lean = 25.0
			"cheer":
				arm_l.rotation_degrees = Vector3(0, 0, -160)
				arm_r.rotation_degrees = Vector3(0, 0, 160)
				bob = absf(sin(_t * 10.0)) * 0.12
		if _action_t <= 0.0:
			_action = ""
			arm_r.rotation_degrees = Vector3(0, 0, 6)
			arm_l.rotation_degrees = Vector3(0, 0, -6)
	torso.rotation_degrees.x = -lean
	torso.position.y = 0.05 + breath
	hips.position.y = 0.82 + bob
	head.rotation_degrees.x = lean * 0.5
	_blink -= delta
	var sy := 1.0
	if _blink < 0.0:
		sy = 0.1
		if _blink < -0.12:
			_blink = randf_range(2.5, 5.0)
	for e in eyes:
		e.scale.y = sy
