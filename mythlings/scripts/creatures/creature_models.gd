class_name CreatureModels
## Builds a playable procedural model for each Mythling. Every species has its
## own builder (distinct anatomy, silhouette and palette) — no shared base mesh.
## If CreatureData.model_scene is set, that imported scene is used instead.

const K := preload("res://scripts/core/mesh_kit.gd")

static func has_model(id: String) -> bool:
	var c: CreatureData = DB.creature(id) if Engine.get_main_loop() else null
	if c and c.model_scene:
		return true
	return id in ["mossbun", "cloverling", "pebblit", "sunfox", "dewdrop", "bloomtail", "verdantus"]

## variant: cosmetic palette variant id ("" = default)
static func build(id: String, variant := "", accessory := "") -> CreatureRig:
	var c: CreatureData = DB.creature(id)
	if c and c.model_scene:
		var rig := CreatureRig.new()
		rig.visual.add_child(c.model_scene.instantiate())
		return rig
	var rig: CreatureRig
	match id:
		"mossbun": rig = _mossbun(variant)
		"cloverling": rig = _cloverling(variant)
		"pebblit": rig = _pebblit(variant)
		"sunfox": rig = _sunfox(variant)
		"dewdrop": rig = _dewdrop(variant)
		"bloomtail": rig = _bloomtail(variant)
		"verdantus": rig = _verdantus(variant)
		_:
			rig = _unknown()
	rig.name = "Rig_" + id
	if accessory != "":
		attach_accessory(rig, accessory)
	return rig

static func _rig(loco: String) -> CreatureRig:
	var r := CreatureRig.new()
	r.locomotion = loco
	return r

# ===================================================================== MOSSBUN
static func _mossbun(variant: String) -> CreatureRig:
	var r := _rig("hop")
	var v := r.visual
	var fur := Color("6f9c4b"); var moss_a := Color("4f7a36"); var moss_b := Color("93c062")
	var leaf := Color("86c45e"); var leaf_in := Color("c3e39a"); var belly := Color("e6ebc4")
	if variant == "autumn":
		fur = Color("b8743a"); moss_a = Color("8c4f26"); moss_b = Color("d9a04f"); leaf = Color("d86f2d"); leaf_in = Color("f2c27a")
	K.add(v, K.sphere(0.3, 22, 11), K.mat(fur, 0.95), Vector3(0, 0.29, 0), Vector3.ZERO, Vector3(1.0, 0.9, 1.04), "Body")
	var tufts := [Vector3(0.0, 0.52, 0.08), Vector3(0.16, 0.47, 0.12), Vector3(-0.17, 0.46, 0.1), Vector3(0.08, 0.42, 0.26), Vector3(-0.1, 0.4, 0.27), Vector3(0.24, 0.34, 0.16), Vector3(-0.24, 0.33, 0.14), Vector3(0.0, 0.32, 0.31)]
	for i in tufts.size():
		K.add(v, K.sphere(0.085 + 0.02 * (i % 3), 10, 6), K.mat(moss_a if i % 2 == 0 else moss_b, 1.0), tufts[i], Vector3(0, i * 40, 0), Vector3(1, 0.55, 1))
	K.add(v, K.sphere(0.2, 16, 8), K.mat(belly, 0.95), Vector3(0, 0.23, -0.17), Vector3.ZERO, Vector3(1.0, 0.85, 0.55))
	var head := K.pivot(v, Vector3(0, 0.3, 0), "Head")
	var eyes := [K.eye(head, Vector3(-0.105, 0.07, -0.252), 0.052, Color("1d1a22"), Vector3(-0.3, 0.05, -1)), K.eye(head, Vector3(0.105, 0.07, -0.252), 0.052, Color("1d1a22"), Vector3(0.3, 0.05, -1))]
	for sx in [-1, 1]:
		K.add(head, K.sphere(0.042, 10, 5), K.mat(Color("f0a597"), 0.9), Vector3(0.17 * sx, -0.005, -0.215), Vector3.ZERO, Vector3(1, 0.6, 0.45))
	K.add(head, K.sphere(0.024, 8, 4), K.mat(Color("4a3226"), 0.35), Vector3(0, 0.005, -0.298))
	var ears := []
	for sx in [-1, 1]:
		var ep := K.pivot(head, Vector3(0.13 * sx, 0.2, 0.0), "Ear", Vector3(18, 0, -30 * sx))
		K.add(ep, K.petal(0.36, 0.18, 0.14, 0.03), K.mat(leaf, 0.8))
		K.add(ep, K.petal(0.26, 0.09, 0.12, 0.02), K.mat(leaf_in, 0.8), Vector3(0, 0.03, -0.012))
		ears.append(ep)
	var sprout := K.pivot(head, Vector3(0, 0.25, 0.02), "Sprout")
	K.add(sprout, K.cyl(0.008, 0.012, 0.12, 6), K.mat(Color("5a8a3a")), Vector3(0, 0.06, 0))
	K.add(sprout, K.petal(0.08, 0.05, 0.05), K.mat(leaf), Vector3(0, 0.11, 0), Vector3(0, 0, -55))
	K.add(sprout, K.petal(0.07, 0.045, 0.05), K.mat(leaf_in), Vector3(0, 0.1, 0), Vector3(0, 0, 60))
	var legs := []
	for p in [Vector3(-0.13, 0.08, -0.12), Vector3(0.13, 0.08, -0.12), Vector3(-0.13, 0.08, 0.12), Vector3(0.13, 0.08, 0.12)]:
		var lp := K.pivot(v, p)
		K.add(lp, K.sphere(0.06, 10, 5), K.mat(belly), Vector3(0, -0.04, -0.01), Vector3.ZERO, Vector3(1, 0.7, 1.2))
		legs.append(lp)
	var tail := K.pivot(v, Vector3(0, 0.24, 0.29), "Tail", Vector3(105, 0, 0))
	for a in [-35, 0, 35]:
		K.add(tail, K.petal(0.16, 0.08, 0.06), K.mat(leaf if a == 0 else leaf_in), Vector3.ZERO, Vector3(0, 0, a))
	r.reg("head", head); r.reg("eyes", eyes); r.reg("ear_l", ears[0]); r.reg("ear_r", ears[1])
	r.reg("legs", legs); r.reg("tail", tail); r.reg("sway", [sprout])
	r.reg("acc_head", K.pivot(head, Vector3(0, 0.27, 0.02))); r.reg("acc_neck", K.pivot(v, Vector3(0, 0.16, -0.05)))
	return r

# ===================================================================== CLOVERLING
static func _cloverling(variant: String) -> CreatureRig:
	var r := _rig("hop")
	r.bob_height = 0.05
	var v := r.visual
	var stem := Color("7fbf6a"); var face := Color("eef3c9")
	var leaves := [Color("4fa35a"), Color("5cb866"), Color("4fa35a"), Color("e3c24a")]  # one lucky golden leaf
	if variant == "moonlit":
		stem = Color("6f8fbf"); face = Color("e8ecff"); leaves = [Color("5a6fc4"), Color("7484d6"), Color("5a6fc4"), Color("cfd8ff")]
	K.add(v, K.capsule(0.085, 0.3), K.mat(stem), Vector3(0, 0.2, 0), Vector3.ZERO, Vector3.ONE, "Body")
	var arms := []
	for sx in [-1, 1]:
		var ap := K.pivot(v, Vector3(0.07 * sx, 0.25, 0), "Arm", Vector3(0, 0, -72 * sx))
		K.add(ap, K.petal(0.14, 0.08, 0.06), K.mat(stem.darkened(0.1)))
		arms.append(ap)
	var head := K.pivot(v, Vector3(0, 0.46, 0), "Head")
	K.add(head, K.sphere(0.15, 18, 9), K.mat(face, 0.85), Vector3.ZERO, Vector3.ZERO, Vector3(1, 0.95, 0.9))
	var clover := K.pivot(head, Vector3(0, 0, 0.05), "Clover")
	var sways := []
	for i in 4:
		var a := 45.0 + i * 90.0
		var lp := K.pivot(clover, Vector3(cos(deg_to_rad(a)), sin(deg_to_rad(a)), 0) * 0.1, "Leaf", Vector3(0, 0, a - 90.0))
		for s in [-1, 1]:
			K.add(lp, K.petal(0.17, 0.13, -0.1, 0.02), K.mat(leaves[i], 0.8), Vector3(0.025 * s, 0, 0), Vector3(12, 0, -20 * s))
		K.add(lp, K.petal(0.09, 0.05, -0.05, 0.015), K.mat(Color(1, 1, 1, 1).lerp(leaves[i], 0.4)), Vector3(0, 0.03, -0.02), Vector3(10, 0, 0))
		sways.append(lp)
	var eyes := [K.eye(head, Vector3(-0.055, 0.02, -0.125), 0.04), K.eye(head, Vector3(0.055, 0.02, -0.125), 0.04)]
	for sx in [-1, 1]:
		K.add(head, K.sphere(0.028, 8, 4), K.mat(Color("f3a0a8")), Vector3(0.1 * sx, -0.035, -0.11), Vector3.ZERO, Vector3(1, 0.6, 0.5))
	K.add(head, K.torus(0.012, 0.022, 10), K.mat(Color("6b3a3a")), Vector3(0, -0.05, -0.135), Vector3(80, 0, 0), Vector3(1, 1, 0.5))
	var legs := []
	for sx in [-1, 1]:
		var lp := K.pivot(v, Vector3(0.05 * sx, 0.07, 0))
		K.add(lp, K.capsule(0.03, 0.1), K.mat(Color("6e5a3a")), Vector3(0, -0.04, -0.01), Vector3(-15, 0, 0))
		legs.append(lp)
	r.reg("head", head); r.reg("eyes", eyes); r.reg("legs", legs); r.reg("sway", sways + arms)
	r.reg("acc_head", K.pivot(head, Vector3(0, 0.16, 0))); r.reg("acc_neck", K.pivot(v, Vector3(0, 0.33, 0)))
	return r

# ===================================================================== PEBBLIT
static func _pebblit(variant: String) -> CreatureRig:
	var r := _rig("waddle")
	r.gait_speed = 0.8
	var v := r.visual
	var stone := Color("8f979c"); var dark := Color("666e74"); var rune := Color("63f2d8")
	if variant == "geode":
		stone = Color("7d6f8f"); dark = Color("5a4d6b"); rune = Color("f28fe0")
	K.add(v, K.sphere(0.28, 8, 5), K.flat(stone), Vector3(0, 0.3, 0), Vector3(0, 22, 0), Vector3(1.15, 0.85, 1.05), "Body")
	var plates := [[Vector3(0, 0.5, 0.05), Vector3(-12, 10, 6), 1.0], [Vector3(0.02, 0.44, 0.2), Vector3(-30, -20, -4), 0.85], [Vector3(-0.02, 0.36, 0.3), Vector3(-50, 35, 3), 0.7], [Vector3(0.22, 0.38, 0.05), Vector3(0, 0, -45), 0.7], [Vector3(-0.22, 0.38, 0.06), Vector3(0, 0, 45), 0.7]]
	for p in plates:
		var slab := K.add(v, K.sphere(0.17, 6, 3), K.flat(dark), p[0], p[1], Vector3(1.1, 0.35, 0.9) * p[2])
		K.add(slab, K.box(Vector3(0.16, 0.05, 0.025)), K.glow(rune, 1.3), Vector3(0, 0.12, 0))
	for sx in [-1, 1]:
		for k in 3:
			K.add(v, K.sphere(0.018, 6, 3), K.glow(rune, 1.4), Vector3(0.3 * sx, 0.25 + k * 0.06, -0.02 + k * 0.05))
	var head := K.pivot(v, Vector3(0, 0.33, -0.2), "Head")
	K.add(head, K.sphere(0.16, 8, 4), K.flat(dark), Vector3(0, 0.075, -0.035), Vector3(-14, 0, 0), Vector3(1.05, 0.28, 0.5))
	var eyes := [K.eye(head, Vector3(-0.08, 0.0, -0.085), 0.036), K.eye(head, Vector3(0.08, 0.0, -0.085), 0.036)]
	for e in eyes:
		e.scale = Vector3(1, 0.62, 1)  # heavy sleepy lids
	K.add(head, K.torus(0.025, 0.038, 12), K.glow(rune, 1.2), Vector3(0, 0.13, -0.05), Vector3(70, 0, 0))
	var tuft := K.pivot(v, Vector3(0.04, 0.56, 0.0))
	for i in 4:
		K.add(tuft, K.sphere(0.045, 8, 4), K.mat(Color("6c9a4a")), Vector3(cos(i * 1.7) * 0.05, 0, sin(i * 1.7) * 0.05), Vector3.ZERO, Vector3(1, 0.6, 1))
	K.add(tuft, K.sphere(0.022, 8, 4), K.mat(Color("f6e27a")), Vector3(0, 0.035, 0))
	var legs := []
	for p in [Vector3(-0.16, 0.14, -0.12), Vector3(0.16, 0.14, -0.12), Vector3(-0.16, 0.14, 0.13), Vector3(0.16, 0.14, 0.13)]:
		var lp := K.pivot(v, p)
		K.add(lp, K.cyl(0.055, 0.07, 0.15, 7), K.flat(dark), Vector3(0, -0.07, 0))
		legs.append(lp)
	var tail := K.pivot(v, Vector3(0, 0.2, 0.3), "Tail")
	K.add(tail, K.sphere(0.07, 6, 3), K.flat(stone), Vector3(0, 0, 0.03))
	K.add(tail, K.sphere(0.045, 6, 3), K.flat(dark), Vector3(0, -0.01, 0.1))
	r.reg("head", head); r.reg("eyes", eyes); r.reg("legs", legs); r.reg("tail", tail); r.reg("sway", [tuft])
	r.reg("acc_head", K.pivot(v, Vector3(0, 0.58, 0))); r.reg("acc_neck", K.pivot(v, Vector3(0, 0.2, -0.22)))
	return r

# ===================================================================== SUNFOX
static func _sunfox(variant: String) -> CreatureRig:
	var r := _rig("quad")
	r.bob_height = 0.025
	var v := r.visual
	var fur := Color("e9a23b"); var cream := Color("f8e6bf"); var sock := Color("6b3518"); var glow_c := Color("ffcf6a")
	if variant == "twilight":
		fur = Color("6d4fb0"); cream = Color("efe4ff"); sock = Color("2b1f4a"); glow_c = Color("ffd98a")
	K.add(v, K.capsule(0.13, 0.52), K.mat(fur, 0.9), Vector3(0, 0.33, 0.02), Vector3(90, 0, 0), Vector3.ONE, "Body")
	K.add(v, K.capsule(0.105, 0.4), K.mat(cream), Vector3(0, 0.29, 0.0), Vector3(90, 0, 0), Vector3(0.9, 1, 0.8))
	K.add(v, K.sphere(0.11, 12, 6), K.mat(cream), Vector3(0, 0.37, -0.2), Vector3.ZERO, Vector3(1, 1.15, 0.8))
	var head := K.pivot(v, Vector3(0, 0.47, -0.27), "Head")
	K.add(head, K.sphere(0.13, 18, 9), K.mat(fur), Vector3.ZERO, Vector3.ZERO, Vector3(1, 0.9, 1))
	for sx in [-1, 1]:
		K.add(head, K.sphere(0.07, 10, 5), K.mat(cream), Vector3(0.085 * sx, -0.045, -0.03), Vector3(0, 0, 25 * sx), Vector3(1.1, 0.7, 0.9))
	K.add(head, K.cyl(0.0, 0.066, 0.17, 12), K.mat(cream), Vector3(0, -0.035, -0.155), Vector3(-90, 0, 0))
	K.add(head, K.sphere(0.024, 8, 4), K.mat(Color("2a1a14"), 0.3), Vector3(0, -0.035, -0.24))
	var eyes := [K.eye(head, Vector3(-0.06, 0.03, -0.1), 0.031, Color("3a1d0e"), Vector3(-0.4, 0, -1)), K.eye(head, Vector3(0.06, 0.03, -0.1), 0.031, Color("3a1d0e"), Vector3(0.4, 0, -1))]
	var ears := []
	for sx in [-1, 1]:
		var ep := K.pivot(head, Vector3(0.075 * sx, 0.09, 0.0), "Ear", Vector3(-6, 0, -16 * sx))
		K.add(ep, K.cyl(0.0, 0.056, 0.18, 10), K.mat(fur), Vector3(0, 0.09, 0))
		K.add(ep, K.cyl(0.0, 0.034, 0.12, 8), K.mat(sock), Vector3(0, 0.075, -0.022))
		ears.append(ep)
	var legs := []
	for p in [Vector3(-0.075, 0.27, -0.17), Vector3(0.075, 0.27, -0.17), Vector3(-0.075, 0.27, 0.2), Vector3(0.075, 0.27, 0.2)]:
		var lp := K.pivot(v, p)
		K.add(lp, K.cyl(0.03, 0.026, 0.2, 8), K.mat(fur), Vector3(0, -0.1, 0))
		K.add(lp, K.cyl(0.026, 0.034, 0.08, 8), K.mat(sock), Vector3(0, -0.23, -0.005))
		legs.append(lp)
	var tail := K.pivot(v, Vector3(0, 0.38, 0.28), "Tail")
	var pts := K.bezier(Vector3.ZERO, Vector3(0, 0.1, 0.26), Vector3(0, 0.34, 0.36), 10)
	var tmi := MeshInstance3D.new()
	tmi.mesh = K.tube(pts, K.taper(10, 0.04, 0.07, 0.07), 10)
	tmi.material_override = K.mat(fur)
	tail.add_child(tmi)
	K.add(tail, K.sphere(0.078, 12, 6), K.mat(Color("fff3cf"), 0.5, glow_c, 1.6), Vector3(0, 0.37, 0.37), Vector3(20, 0, 0), Vector3(1, 1.35, 1))
	r.reg("head", head); r.reg("eyes", eyes); r.reg("ear_l", ears[0]); r.reg("ear_r", ears[1]); r.reg("legs", legs); r.reg("tail", tail)
	r.reg("glow_anchor", K.pivot(tail, Vector3(0, 0.36, 0.36)))
	r.reg("acc_head", K.pivot(head, Vector3(0, 0.11, 0.0))); r.reg("acc_neck", K.pivot(v, Vector3(0, 0.42, -0.2)))
	return r

# ===================================================================== DEWDROP
static func _dewdrop(variant: String) -> CreatureRig:
	var r := _rig("float")
	r.hover_height = 0.18
	var v := r.visual
	var water := Color("7fd3f5"); var core := Color("d6fbff"); var em := Color("4ab8e8")
	if variant == "rose":
		water = Color("f5a3c7"); core = Color("fff0f7"); em = Color("e86aa5")
	K.add(v, K.sphere(0.03, 6, 3), K.glow(core, 1.5), Vector3(0, 0.33, 0.02), Vector3.ZERO, Vector3(3, 3, 3), "Core")
	K.add(v, K.sphere(0.2, 22, 11), K.glass(water, 0.55, em), Vector3(0, 0.35, 0), Vector3.ZERO, Vector3.ONE, "Body")
	var tip := K.pivot(v, Vector3(0, 0.47, 0.0), "Tip", Vector3(6, 0, 0))
	K.add(tip, K.cyl(0.0, 0.16, 0.2, 18), K.glass(water, 0.55, em), Vector3(0, 0.1, 0))
	var head := K.pivot(v, Vector3(0, 0.35, 0), "Head")
	var eyes := [K.eye(head, Vector3(-0.07, 0.03, -0.172), 0.046, Color("16213a")), K.eye(head, Vector3(0.07, 0.03, -0.172), 0.046, Color("16213a"))]
	for sx in [-1, 1]:
		K.add(head, K.sphere(0.026, 8, 4), K.mat(Color("ffb3c8")), Vector3(0.12 * sx, -0.03, -0.155), Vector3.ZERO, Vector3(1, 0.55, 0.4))
	var fins := []
	for sx in [-1, 1]:
		var fp := K.pivot(v, Vector3(0.18 * sx, 0.33, 0.02), "Fin", Vector3(0, 0, -78 * sx))
		K.add(fp, K.petal(0.17, 0.13, 0.1, 0.015), K.glass(water.lightened(0.2), 0.45, em))
		fins.append(fp)
	K.add(v, K.cyl(0.05, 0.0, 0.12, 10), K.glass(water, 0.5, em), Vector3(0, 0.12, 0.03))
	var orbit := K.pivot(v, Vector3(0, 0.35, 0), "Orbit")
	for i in 3:
		var a := TAU * i / 3.0
		K.add(orbit, K.sphere(0.03, 10, 5), K.glass(water, 0.7, em), Vector3(cos(a) * 0.32, sin(a * 2.0) * 0.06, sin(a) * 0.32))
	r.reg("head", head); r.reg("eyes", eyes); r.reg("wings", fins); r.reg("orbit", orbit); r.reg("sway", [tip])
	r.reg("acc_head", K.pivot(v, Vector3(0, 0.6, 0.02))); r.reg("acc_neck", K.pivot(v, Vector3(0, 0.2, -0.1)))
	return r

# ===================================================================== BLOOMTAIL
static func _bloomtail(variant: String) -> CreatureRig:
	var r := _rig("quad")
	r.gait_speed = 0.85
	r.bob_height = 0.02
	var v := r.visual
	var fur := Color("e7b9c9"); var cream := Color("f7e9dc"); var petal_c := Color("d9487a"); var leaf := Color("5fa857"); var ear := Color("d48aa8")
	if variant == "sunset":
		fur = Color("f2c79a"); petal_c = Color("e8642f"); ear = Color("e09a6a"); leaf = Color("8a9f3c")
	K.add(v, K.sphere(0.22, 18, 9), K.mat(fur, 0.95), Vector3(0, 0.31, 0.02), Vector3.ZERO, Vector3(0.88, 0.82, 1.28), "Body")
	K.add(v, K.sphere(0.2, 14, 7), K.mat(cream), Vector3(0, 0.26, -0.02), Vector3.ZERO, Vector3(0.72, 0.6, 1.05))
	var head := K.pivot(v, Vector3(0, 0.46, -0.25), "Head")
	K.add(head, K.sphere(0.15, 18, 9), K.mat(fur), Vector3.ZERO, Vector3.ZERO, Vector3(1, 0.95, 0.95))
	K.add(head, K.sphere(0.07, 12, 6), K.mat(cream), Vector3(0, -0.045, -0.12), Vector3.ZERO, Vector3(1.25, 0.8, 0.9))
	K.add(head, K.sphere(0.02, 8, 4), K.mat(Color("b3566e"), 0.4), Vector3(0, -0.02, -0.18))
	var eyes := [K.eye(head, Vector3(-0.062, 0.03, -0.12), 0.034), K.eye(head, Vector3(0.062, 0.03, -0.12), 0.034)]
	for e in eyes:
		e.scale = Vector3(1, 0.8, 1)
	var ears := []
	for sx in [-1, 1]:
		var ep := K.pivot(head, Vector3(0.12 * sx, 0.05, 0.01), "Ear", Vector3(0, 0, 150 * sx))
		K.add(ep, K.petal(0.2, 0.13, -0.06, 0.02), K.mat(ear))
		ears.append(ep)
	var flower := K.pivot(head, Vector3(0, 0.14, 0.02), "Flower")
	for i in 5:
		var pp := K.pivot(flower, Vector3.ZERO, "", Vector3(0, i * 72, 0))
		K.add(pp, K.petal(0.12, 0.09, -0.05, 0.015), K.mat(petal_c, 0.7), Vector3.ZERO, Vector3(-62, 0, 0))
	K.add(flower, K.sphere(0.035, 10, 5), K.mat(Color("f5cf4a"), 0.6, Color("f5cf4a"), 0.4), Vector3(0, 0.02, 0))
	var legs := []
	for p in [Vector3(-0.09, 0.2, -0.15), Vector3(0.09, 0.2, -0.15), Vector3(-0.09, 0.2, 0.19), Vector3(0.09, 0.2, 0.19)]:
		var lp := K.pivot(v, p)
		K.add(lp, K.cyl(0.036, 0.042, 0.18, 8), K.mat(fur.darkened(0.08)), Vector3(0, -0.1, 0))
		legs.append(lp)
	var tail := K.pivot(v, Vector3(0, 0.33, 0.27), "Tail", Vector3(58, 0, 0))
	K.add(tail, K.petal(0.64, 0.36, 0.38, 0.04), K.mat(leaf, 0.75))
	K.add(tail, K.petal(0.5, 0.2, 0.36, 0.03), K.mat(leaf.lightened(0.25), 0.75), Vector3(0, 0.03, -0.015))
	K.add(tail, K.cyl(0.006, 0.012, 0.5, 5), K.mat(leaf.darkened(0.3)), Vector3(0, 0.25, 0.05), Vector3(-8, 0, 0))
	r.reg("head", head); r.reg("eyes", eyes); r.reg("ear_l", ears[0]); r.reg("ear_r", ears[1]); r.reg("legs", legs); r.reg("tail", tail); r.reg("sway", [flower])
	r.reg("acc_head", K.pivot(head, Vector3(0, 0.2, 0.02))); r.reg("acc_neck", K.pivot(v, Vector3(0, 0.4, -0.2)))
	return r

# ===================================================================== VERDANTUS (Colossal)
static func _verdantus(variant: String) -> CreatureRig:
	var r := _rig("quad")
	r.is_colossal = true
	r.gait_speed = 0.42
	r.bob_height = 0.14
	var v := r.visual
	var bark := Color("4b4532"); var bark_d := Color("35301f"); var moss := Color("557f3a"); var moss_l := Color("7aa64c")
	var glow_c := Color("39e58c"); var stone := Color("2f2c26")
	var blossom := Color("f2a7c3") if variant == "bloomguard" else Color("f4e27a")
	var rng := RandomNumberGenerator.new()
	rng.seed = 4242
	var torso := K.pivot(v, Vector3(0, 4.3, 0), "Torso")
	K.add(torso, K.sphere(1.0, 24, 12), K.mat(bark, 0.95), Vector3.ZERO, Vector3.ZERO, Vector3(1.75, 1.45, 2.9))
	K.add(torso, K.sphere(1.0, 18, 9), K.mat(Color("6d6a4b")), Vector3(0, -0.45, 0), Vector3.ZERO, Vector3(1.45, 1.0, 2.5))
	# Moss mantle along the spine, layered like armour.
	for i in 6:
		var z := -2.0 + i * 0.8
		K.add(torso, K.sphere(1.0, 14, 7), K.mat(moss if i % 2 == 0 else moss_l, 1.0), Vector3(0, 1.0 - absf(z) * 0.12, z), Vector3(rng.randf_range(-8, 8), 0, rng.randf_range(-6, 6)), Vector3(1.45 - absf(z) * 0.12, 0.55, 0.9))
	for sx in [-1, 1]:
		K.add(torso, K.sphere(1.0, 14, 7), K.mat(moss, 1.0), Vector3(1.25 * sx, 0.45, -1.6), Vector3(0, 0, -20 * sx), Vector3(0.85, 0.75, 1.0))
		K.add(torso, K.sphere(1.0, 12, 6), K.mat(moss_l, 1.0), Vector3(1.2 * sx, 0.35, 1.7), Vector3(0, 0, -18 * sx), Vector3(0.75, 0.65, 0.9))
		for k in 3:
			K.add(torso, K.capsule(0.05, 1.1), K.glow(glow_c, 1.6), Vector3(1.66 * sx, -0.05 - k * 0.28, -0.9 + k * 0.9), Vector3(90, 0, 8 * sx))
	# Back flora: bushes, flowers and a sapling.
	var flora := []
	for i in 14:
		var z := rng.randf_range(-2.1, 2.1)
		var x := rng.randf_range(-0.9, 0.9)
		var y := 1.45 - absf(z) * 0.15 - absf(x) * 0.25
		if i % 3 == 0:
			var fl := K.pivot(torso, Vector3(x, y, z))
			K.add(fl, K.cyl(0.02, 0.03, 0.4, 5), K.mat(Color("5a8a3a")), Vector3(0, 0.2, 0))
			K.add(fl, K.sphere(0.1, 8, 4), K.mat(blossom, 0.7, blossom, 0.25), Vector3(0, 0.42, 0))
			flora.append(fl)
		else:
			K.add(torso, K.sphere(0.28 + rng.randf() * 0.15, 10, 5), K.mat(moss_l.lerp(Color("9fcf5f"), rng.randf()), 1.0), Vector3(x, y, z), Vector3.ZERO, Vector3(1, 0.7, 1))
	var sapling := K.pivot(torso, Vector3(0.3, 1.45, -0.6), "Sapling")
	K.add(sapling, K.cyl(0.05, 0.09, 1.2, 6), K.mat(bark_d), Vector3(0, 0.6, 0))
	K.add(sapling, K.sphere(0.5, 12, 6), K.mat(Color("6fae4a")), Vector3(0, 1.35, 0), Vector3.ZERO, Vector3(1, 0.8, 1))
	K.add(sapling, K.sphere(0.35, 10, 5), K.mat(Color("8cc65a")), Vector3(0.25, 1.55, 0.1))
	flora.append(sapling)
	# Legs: hip pivots so the whole leg swings; thick bark with mossy knees and stone hooves.
	var legs := []
	for p in [Vector3(-1.05, 3.9, -1.75), Vector3(1.05, 3.9, -1.75), Vector3(-1.05, 3.9, 1.85), Vector3(1.05, 3.9, 1.85)]:
		var lp := K.pivot(v, p, "Leg")
		K.add(lp, K.capsule(0.55, 2.2), K.mat(bark), Vector3(0, -0.9, 0))
		K.add(lp, K.sphere(0.5, 12, 6), K.mat(moss, 1.0), Vector3(0, -1.85, -0.12), Vector3.ZERO, Vector3(1, 0.9, 1.05))
		K.add(lp, K.cyl(0.34, 0.44, 1.7, 10), K.mat(bark_d), Vector3(0, -2.75, 0))
		K.add(lp, K.cyl(0.52, 0.58, 0.42, 10), K.flat(stone), Vector3(0, -3.7, -0.02))
		for k in 4:
			var a := k * TAU / 4.0 + 0.4
			var root := MeshInstance3D.new()
			root.mesh = K.tube(K.bezier(Vector3(cos(a) * 0.4, -3.4, sin(a) * 0.4), Vector3(cos(a) * 0.65, -3.55, sin(a) * 0.65), Vector3(cos(a) * 0.8, -3.88, sin(a) * 0.8), 5), K.taper(5, 0.09, 0.03), 6)
			root.material_override = K.mat(bark_d)
			lp.add_child(root)
		legs.append(lp)
	# Neck and head.
	var neck := MeshInstance3D.new()
	neck.mesh = K.tube(K.bezier(Vector3(0, 4.6, -1.8), Vector3(0, 5.6, -2.6), Vector3(0, 6.05, -3.35), 10), K.taper(10, 0.95, 0.55, 0.1), 14)
	neck.material_override = K.mat(bark, 0.95)
	v.add_child(neck)
	for i in 4:
		K.add(v, K.sphere(0.45, 10, 5), K.mat(moss_l if i % 2 else moss, 1.0), Vector3(0, 5.15 + i * 0.28, -2.15 - i * 0.33), Vector3(-30, 0, 0), Vector3(1.2, 0.5, 1))
	var head := K.pivot(v, Vector3(0, 6.1, -3.45), "Head")
	head.scale = Vector3.ONE * 1.25
	K.add(head, K.sphere(0.72, 18, 9), K.mat(bark), Vector3(0, 0, -0.15), Vector3.ZERO, Vector3(1, 0.88, 1.3))
	K.add(head, K.sphere(0.5, 16, 8), K.mat(Color("5c5640")), Vector3(0, -0.28, -1.0), Vector3(-8, 0, 0), Vector3(0.82, 0.68, 1.45))
	K.add(head, K.sphere(0.12, 8, 4), K.mat(stone, 0.4), Vector3(0, -0.2, -1.68), Vector3.ZERO, Vector3(1.6, 0.8, 0.8))
	K.add(head, K.sphere(0.45, 10, 5), K.mat(moss, 1.0), Vector3(0, 0.5, -0.25), Vector3.ZERO, Vector3(1.2, 0.4, 1.2))
	var eyes := []
	for sx in [-1, 1]:
		eyes.append(K.eye(head, Vector3(0.55 * sx, 0.12, -0.72), 0.14, Color("0f3b25"), Vector3(0.7 * sx, 0, -1), glow_c))
		K.add(head, K.capsule(0.035, 0.7), K.glow(glow_c, 1.6), Vector3(0.36 * sx, -0.12, -1.0), Vector3(80, 0, -12 * sx))
	var ears := []
	for sx in [-1, 1]:
		var ep := K.pivot(head, Vector3(0.6 * sx, 0.28, 0.05), "Ear", Vector3(30, 0, -70 * sx))
		K.add(ep, K.petal(0.85, 0.38, 0.2, 0.06), K.mat(moss_l, 0.85))
		ears.append(ep)
	var sways := flora.duplicate()
	for sx in [-1, 1]:
		var ant := K.pivot(head, Vector3(0.32 * sx, 0.55, 0.15), "Antler")
		_branch(ant, Vector3.ZERO, Vector3(0.95 * sx, 0.75, 0.55).normalized(), 2.0, 0.21, 0, rng, bark_d, glow_c, moss_l, blossom, variant == "bloomguard")
		sways.append(ant)
	for i in 5:
		var strand := K.pivot(head, Vector3(-0.3 + i * 0.15, -0.55, -0.7 + absf(i - 2) * 0.1), "Moss")
		var slen := 0.7 + rng.randf() * 0.6
		var mi := MeshInstance3D.new()
		mi.mesh = K.tube(K.bezier(Vector3.ZERO, Vector3(0, -slen * 0.5, 0.05), Vector3(0, -slen, 0.15), 5), K.taper(5, 0.07, 0.02), 6)
		mi.material_override = K.mat(moss_l, 1.0)
		strand.add_child(mi)
		sways.append(strand)
	var tail := K.pivot(v, Vector3(0, 4.5, 2.75), "Tail")
	var tmi := MeshInstance3D.new()
	tmi.mesh = K.tube(K.bezier(Vector3.ZERO, Vector3(0, -0.3, 0.8), Vector3(0, -1.1, 1.2), 8), K.taper(8, 0.4, 0.12), 10)
	tmi.material_override = K.mat(bark)
	tail.add_child(tmi)
	for a in [-40, 0, 40]:
		K.add(tail, K.petal(0.9, 0.4, 0.2, 0.05), K.mat(moss_l), Vector3(0, -1.0, 1.2), Vector3(150, a, 0))
	r.reg("head", head); r.reg("eyes", eyes); r.reg("ear_l", ears[0]); r.reg("ear_r", ears[1])
	r.reg("legs", legs); r.reg("tail", tail); r.reg("sway", sways)
	r.reg("feet", [legs[0], legs[1], legs[2], legs[3]])
	r.reg("acc_head", K.pivot(head, Vector3(0, 0.75, 0))); r.reg("acc_neck", K.pivot(v, Vector3(0, 5.0, -2.2)))
	r.reg("saddle", K.pivot(torso, Vector3(0, 1.45, -0.9)))
	return r

static func _branch(parent: Node3D, start: Vector3, dir: Vector3, length: float, radius: float, depth: int, rng: RandomNumberGenerator, col: Color, glow_c: Color, leaf: Color, blossom: Color, blossoms: bool) -> void:
	var bend := Vector3(rng.randf_range(-0.2, 0.2), 0.15, rng.randf_range(-0.1, 0.25))
	var mid := start + dir * length * 0.5 + bend * length * 0.3
	var end := start + (dir + bend * 0.4).normalized() * length
	var mi := MeshInstance3D.new()
	mi.mesh = K.tube(K.bezier(start, mid, end, 6), K.taper(6, radius, radius * 0.45), 7)
	mi.material_override = K.mat(col, 0.95)
	parent.add_child(mi)
	if depth >= 2:
		K.add(parent, K.sphere(radius * 0.9 + 0.04, 8, 4), K.glow(glow_c, 1.8), end)
		K.add(parent, K.petal(0.35, 0.16, 0.1), K.mat(leaf), end, Vector3(rng.randf_range(-40, 40), rng.randf() * 360.0, rng.randf_range(20, 70)))
		if blossoms:
			K.add(parent, K.sphere(0.12, 8, 4), K.mat(blossom, 0.7, blossom, 0.3), end + Vector3(0, 0.1, 0))
		return
	var kids := 3 if depth == 0 else 2
	for k in kids:
		var t := 0.45 + 0.25 * k if depth == 0 else 1.0
		var p := start.lerp(end, min(t, 1.0))
		var side := Vector3(signf(dir.x) * rng.randf_range(0.1, 0.7), rng.randf_range(0.4, 1.0), rng.randf_range(-0.6, 0.4))
		_branch(parent, p, (dir + side).normalized(), length * (0.55 if depth == 0 else 0.6), radius * 0.6, depth + 1, rng, col, glow_c, leaf, blossom, blossoms)

# ===================================================================== fallback
static func _unknown() -> CreatureRig:
	## Shown only for species whose model is not in this build (never presented as final art).
	var r := _rig("float")
	K.add(r.visual, K.sphere(0.3, 16, 8), K.glass(Color("9fb4c0"), 0.4), Vector3(0, 0.45, 0))
	K.add(r.visual, K.sphere(0.1, 8, 4), K.glow(Color("dfe8ee"), 1.0), Vector3(0, 0.45, 0))
	return r

# ===================================================================== accessories
static func attach_accessory(rig: CreatureRig, acc: String) -> void:
	var head: Node3D = rig.part("acc_head")
	var neck: Node3D = rig.part("acc_neck")
	var s := 6.0 if rig.is_colossal else 1.0
	match acc:
		"flower_crown":
			if head:
				var p := K.pivot(head, Vector3.ZERO, "Acc")
				p.scale = Vector3.ONE * s
				K.add(p, K.torus(0.07, 0.09, 16), K.mat(Color("5a8a3a")), Vector3.ZERO, Vector3.ZERO, Vector3(1, 0.6, 1))
				for i in 6:
					var a := TAU * i / 6.0
					K.add(p, K.sphere(0.025, 8, 4), K.mat([Color("f2a7c3"), Color("f4e27a"), Color("ffffff")][i % 3], 0.7), Vector3(cos(a) * 0.08, 0.012, sin(a) * 0.08))
		"star_collar":
			if neck:
				var p := K.pivot(neck, Vector3.ZERO, "Acc")
				p.scale = Vector3.ONE * s
				K.add(p, K.torus(0.1, 0.125, 18), K.mat(Color("2b2f6b"), 0.4), Vector3.ZERO, Vector3(-15, 0, 0), Vector3(1, 0.7, 1))
				K.add(p, K.sphere(0.03, 8, 4), K.glow(Color("ffe08a"), 1.6), Vector3(0, -0.02, -0.12))
		"leaf_scarf":
			if neck:
				var p := K.pivot(neck, Vector3.ZERO, "Acc")
				p.scale = Vector3.ONE * s
				K.add(p, K.torus(0.09, 0.13, 16), K.mat(Color("c4583f"), 0.9), Vector3.ZERO, Vector3(-10, 0, 0), Vector3(1, 0.9, 1))
				K.add(p, K.petal(0.12, 0.07, 0.05), K.mat(Color("c4583f")), Vector3(0.06, -0.02, -0.1), Vector3(150, 20, 0))
