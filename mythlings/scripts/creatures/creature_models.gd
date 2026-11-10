class_name CreatureModels
## Builds a playable procedural model for each Mythling. Every species has its
## own builder (distinct anatomy, silhouette and palette) — no shared base mesh.
## If CreatureData.model_scene is set, that imported scene is used instead.

const K := preload("res://scripts/core/mesh_kit.gd")

static func has_model(id: String) -> bool:
	var c: CreatureData = DB.creature(id) if Engine.get_main_loop() else null
	if c and c.model_scene:
		return true
	return id in ["mossbun", "cloverling", "pebblit", "sunfox", "dewdrop", "bloomtail", "verdantus", "mosswarden", "glimmerhare", "ignaroth", "shamrelle", "cairnback", "dawnstrider", "cloudwell", "blossomere", "astravyth", "cindercub", "magmole", "ashwing", "thistlepin", "geodrift", "lanternwhisk", "drizzlefin", "thornmane", "thalassor", "mossmantle", "cindermaw"]

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
		"mosswarden": rig = _mosswarden(variant)
		"glimmerhare": rig = _glimmerhare(variant)
		"ignaroth": rig = _ignaroth(variant)
		"shamrelle": rig = _shamrelle(variant)
		"cairnback": rig = _cairnback(variant)
		"dawnstrider": rig = _dawnstrider(variant)
		"cloudwell": rig = _cloudwell(variant)
		"blossomere": rig = _blossomere(variant)
		"astravyth": rig = _astravyth(variant)
		"cindercub": rig = _cindercub(variant)
		"magmole": rig = _magmole(variant)
		"ashwing": rig = _ashwing(variant)
		"thistlepin": rig = _thistlepin(variant)
		"geodrift": rig = _geodrift(variant)
		"lanternwhisk": rig = _lanternwhisk(variant)
		"drizzlefin": rig = _drizzlefin(variant)
		"thornmane": rig = _thornmane(variant)
		"thalassor": rig = _thalassor(variant)
		"mossmantle": rig = _mossmantle(variant)
		"cindermaw": rig = _cindermaw(variant)
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
	# Whiskers, smile and a tiny mushroom growing in the moss.
	for sx in [-1, 1]:
		for k in 2:
			K.add(head, K.cyl(0.003, 0.003, 0.14, 3), K.mat(Color("e6ebc4")), Vector3(0.1 * sx, -0.02 - k * 0.025, -0.25), Vector3(0, 0, (80 + k * 14) * sx))
	K.add(head, K.torus(0.012, 0.02, 10), K.mat(Color("5a3a30")), Vector3(0, -0.035, -0.282), Vector3(75, 0, 0), Vector3(1, 1, 0.5))
	K.add(v, K.cyl(0.012, 0.016, 0.06, 5), K.mat(Color("efe6d4")), Vector3(-0.12, 0.5, 0.16))
	K.add(v, K.sphere(0.035, 8, 4), K.mat(Color("c4583f")), Vector3(-0.12, 0.535, 0.16), Vector3.ZERO, Vector3(1, 0.55, 1))
	for k in 3:
		K.add(v, K.sphere(0.008, 4, 2), K.mat(Color.WHITE), Vector3(-0.12 + cos(k * 2.1) * 0.02, 0.552, 0.16 + sin(k * 2.1) * 0.02))
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
	# A glistening dewdrop resting on the golden leaf.
	K.add(sways[3], K.sphere(0.025, 10, 5), K.glass(Color("cfeeff"), 0.6), Vector3(0, 0.1, -0.03))
	K.add(head, K.sphere(0.012, 6, 3), K.glow(Color.WHITE, 1.0), Vector3(0.0, 0.11, -0.12))
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
	# Crystal shards sprouting between the plates.
	for c in [[Vector3(0.12, 0.5, 0.14), Vector3(10, 0, -25), 0.14], [Vector3(-0.1, 0.48, 0.2), Vector3(-15, 0, 30), 0.11], [Vector3(0.02, 0.44, 0.3), Vector3(-35, 0, 5), 0.09]]:
		K.add(v, K.cyl(0.0, 0.035, c[2], 5), K.mat(rune.lightened(0.3), 0.2, rune, 0.8), c[0], c[1])
	for sx in [-1, 1]:
		K.add(head, K.sphere(0.02, 6, 3), K.flat(stone.lightened(0.15)), Vector3(0.13 * sx, -0.05, -0.08))
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
	# Whiskers, ear tufts and a flame-shaped blaze on the chest.
	for sx in [-1, 1]:
		for k in 2:
			K.add(head, K.cyl(0.0015, 0.0015, 0.07, 3), K.mat(cream.darkened(0.15)), Vector3(0.06 * sx, -0.04 - k * 0.014, -0.17), Vector3(0, -35 * sx, (70 + k * 14) * sx))
		K.add(ears[0 if sx < 0 else 1], K.cyl(0.0, 0.02, 0.05, 5), K.mat(cream), Vector3(0, 0.19, -0.005))
	K.add(v, K.cyl(0.0, 0.05, 0.14, 6), K.mat(glow_c, 0.6, glow_c, 0.5), Vector3(0, 0.33, -0.29), Vector3(-20, 0, 0))
	for k in 3:
		K.add(v, K.sphere(0.035, 6, 3), K.mat(sock.lightened(0.15)), Vector3(0, 0.44, -0.05 + k * 0.12), Vector3.ZERO, Vector3(1.6, 0.4, 0.7))
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
	# Tiny bubbles suspended inside the droplet.
	for k in 6:
		K.add(v, K.sphere(0.012 + (k % 3) * 0.006, 6, 3), K.glass(Color.WHITE, 0.7), Vector3(cos(k * 1.7) * 0.1, 0.27 + k * 0.035, sin(k * 1.7) * 0.06 + 0.04))
	K.add(head, K.torus(0.01, 0.017, 10), K.mat(Color("16213a")), Vector3(0, -0.04, -0.185), Vector3(80, 0, 0), Vector3(1, 1, 0.5))
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
	# Petal collar and leaf veins.
	for k in 8:
		var a := k * TAU / 8.0
		var pp := K.pivot(v, Vector3(cos(a) * 0.1, 0.4, -0.2 + sin(a) * 0.08), "", Vector3(0, -rad_to_deg(a) - 90, 0))
		K.add(pp, K.petal(0.1, 0.07, -0.04, 0.012), K.mat(petal_c.lightened(0.35) if k % 2 else Color("f7e9dc")), Vector3.ZERO, Vector3(-70, 0, 0))
	for k in 4:
		K.add(tail, K.cyl(0.003, 0.004, 0.16, 3), K.mat(leaf.darkened(0.3)), Vector3(0.0, 0.14 + k * 0.1, 0.05 + k * 0.03), Vector3(-8, 0, 50 if k % 2 else -50))
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
	# Glowing shelf mushrooms on the legs and vines trailing from the shoulders.
	for i in legs.size():
		for k in 3:
			K.add(legs[i], K.sphere(0.18, 8, 4), K.mat(Color("7ad8e8"), 0.4, Color("4ac8e0"), 1.2), Vector3(0.35 * (1 if i % 2 else -1), -1.2 - k * 0.35, 0.1 + k * 0.08), Vector3.ZERO, Vector3(1.3, 0.35, 1))
	for sx in [-1, 1]:
		for k in 3:
			var vine := MeshInstance3D.new()
			var st := Vector3(1.3 * sx, 0.3, -1.9 + k * 0.6)
			vine.mesh = K.tube(K.bezier(st, st + Vector3(0.25 * sx, -0.8, 0.1), st + Vector3(0.15 * sx, -1.8 - k * 0.3, 0.2), 6), K.taper(6, 0.05, 0.025), 5)
			vine.material_override = K.mat(Color("4f8a3a"))
			torso.add_child(vine)
			K.add(torso, K.petal(0.3, 0.14, 0.05), K.mat(moss_l), st + Vector3(0.2 * sx, -1.0, 0.15), Vector3(-30, 0, 40 * sx))
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

# ===================================================================== MOSSWARDEN (Large, evolved)
static func _mosswarden(_variant: String) -> CreatureRig:
	## Heavy, round, upright-sitting forest keeper. Its leaf ears have grown into a
	## draping cloak; a sapling crowns its head; it cradles a glowing lantern-seed.
	var r := _rig("hop")
	r.gait_speed = 0.55
	r.bob_height = 0.08
	var v := r.visual
	var moss := Color("4f7a36"); var moss_l := Color("7aa64c"); var belly := Color("d6dcb0"); var bark := Color("6b4a32"); var seed := Color("c8ffb0")
	K.add(v, K.sphere(1.0, 26, 13), K.mat(moss, 0.95), Vector3(0, 1.05, 0.05), Vector3.ZERO, Vector3(1.0, 1.0, 0.95), "Body")
	K.add(v, K.sphere(0.72, 20, 10), K.mat(belly), Vector3(0, 0.9, -0.42), Vector3.ZERO, Vector3(0.95, 1.0, 0.55))
	var rng := RandomNumberGenerator.new()
	rng.seed = 91
	for i in 16:
		var a := rng.randf() * TAU
		var y := rng.randf_range(1.1, 1.9)
		var rad := sqrt(maxf(0.05, 1.0 - pow((y - 1.05), 2))) * 1.0
		if sin(a) < -0.4:
			continue
		K.add(v, K.sphere(0.22, 10, 5), K.mat(moss_l if i % 2 else moss.darkened(0.1), 1.0), Vector3(cos(a) * rad, y, sin(a) * rad * 0.95 + 0.05), Vector3.ZERO, Vector3(1, 0.5, 1))
	var head := K.pivot(v, Vector3(0, 1.55, -0.55), "Head")
	K.add(head, K.sphere(0.55, 20, 10), K.mat(moss), Vector3(0, 0.05, 0.1), Vector3.ZERO, Vector3(1.0, 0.9, 0.9))
	K.add(head, K.sphere(0.3, 14, 7), K.mat(belly), Vector3(0, -0.12, -0.32), Vector3.ZERO, Vector3(1.3, 0.8, 0.7))
	K.add(head, K.sphere(0.06, 8, 4), K.mat(Color("3a2a22"), 0.35), Vector3(0, -0.04, -0.52))
	var eyes := []
	for sx in [-1, 1]:
		var e := K.eye(head, Vector3(0.2 * sx, 0.12, -0.38), 0.09, Color("1d2a1a"), Vector3(0.3 * sx, 0, -1), Color("6dffb0"))
		e.scale = Vector3(1, 0.7, 1)  # calm, heavy-lidded
		eyes.append(e)
		K.add(head, K.sphere(0.13, 8, 4), K.mat(moss.darkened(0.25)), Vector3(0.21 * sx, 0.23, -0.34), Vector3(0, 0, -20 * sx), Vector3(1.3, 0.35, 0.6))
	# Cloak ears drape down the back.
	var ears := []
	for sx in [-1, 1]:
		var ep := K.pivot(head, Vector3(0.32 * sx, 0.3, 0.15), "Ear", Vector3(120, 0, -25 * sx))
		K.add(ep, K.petal(1.5, 0.75, 0.35, 0.08), K.mat(moss_l, 0.85))
		K.add(ep, K.petal(1.2, 0.4, 0.33, 0.05), K.mat(moss.darkened(0.15)), Vector3(0, 0.1, 0.03))
		ears.append(ep)
	var crown := K.pivot(head, Vector3(0, 0.48, 0.05), "Crown")
	K.add(crown, K.cyl(0.04, 0.07, 0.6, 6), K.mat(bark), Vector3(0, 0.3, 0))
	K.add(crown, K.sphere(0.3, 10, 5), K.mat(Color("6fae4a")), Vector3(0, 0.68, 0), Vector3.ZERO, Vector3(1, 0.75, 1))
	for k in 5:
		K.add(crown, K.sphere(0.06, 6, 3), K.mat([Color("f2a7c3"), Color("ffffff"), Color("f4e27a")][k % 3], 0.6), Vector3(cos(k * 1.3) * 0.24, 0.75 + (k % 2) * 0.1, sin(k * 1.3) * 0.24))
	# Small forepaws holding the lantern-seed in a cage of roots.
	var arms := []
	for sx in [-1, 1]:
		var ap := K.pivot(v, Vector3(0.45 * sx, 1.15, -0.72), "Arm", Vector3(-60, 0, 25 * sx))
		K.add(ap, K.capsule(0.16, 0.6), K.mat(moss), Vector3(0, -0.25, 0))
		K.add(ap, K.cyl(0.17, 0.17, 0.22, 8), K.mat(bark), Vector3(0, -0.3, 0))
		arms.append(ap)
	var lantern := K.pivot(v, Vector3(0, 0.95, -1.05), "Lantern")
	K.add(lantern, K.sphere(0.18, 12, 6), K.glow(seed, 1.8))
	for k in 5:
		var a := k * TAU / 5.0
		var root := MeshInstance3D.new()
		root.mesh = K.tube(K.bezier(Vector3(0, 0.28, 0), Vector3(cos(a) * 0.3, 0.05, sin(a) * 0.3), Vector3(cos(a) * 0.12, -0.24, sin(a) * 0.12), 5), K.taper(5, 0.03, 0.02), 5)
		root.material_override = K.mat(bark)
		lantern.add_child(root)
	var lamp := OmniLight3D.new()
	lamp.light_color = seed
	lamp.omni_range = 4.0
	lamp.light_energy = 0.9
	lantern.add_child(lamp)
	var legs := []
	for p in [Vector3(-0.55, 0.3, -0.35), Vector3(0.55, 0.3, -0.35), Vector3(-0.6, 0.3, 0.45), Vector3(0.6, 0.3, 0.45)]:
		var lp := K.pivot(v, p)
		K.add(lp, K.sphere(0.32, 12, 6), K.mat(belly), Vector3(0, -0.18, -0.08), Vector3.ZERO, Vector3(1, 0.65, 1.3))
		for k in 3:
			K.add(lp, K.sphere(0.07, 6, 3), K.mat(bark.darkened(0.2)), Vector3(-0.12 + k * 0.12, -0.24, -0.45))
		legs.append(lp)
	var tail := K.pivot(v, Vector3(0, 0.75, 0.95), "Tail", Vector3(70, 0, 0))
	for a in [-50, -25, 0, 25, 50]:
		K.add(tail, K.petal(0.7, 0.18, 0.2, 0.03), K.mat(moss_l if a % 50 else moss), Vector3.ZERO, Vector3(0, 0, a))
	r.reg("head", head); r.reg("eyes", eyes); r.reg("ear_l", ears[0]); r.reg("ear_r", ears[1])
	r.reg("legs", legs); r.reg("tail", tail); r.reg("sway", [crown, lantern] + arms)
	r.reg("acc_head", K.pivot(head, Vector3(0, 0.45, 0))); r.reg("acc_neck", K.pivot(v, Vector3(0, 1.35, -0.6)))
	r.reg("saddle", K.pivot(v, Vector3(0, 2.05, 0.25)))
	return r

# ===================================================================== MOSSMANTLE (Awakened Form of Mossbun)
static func _mossmantle(_variant: String) -> CreatureRig:
	## A long, low, careful climber. Where Mossbun is a round ball, Mossmantle is
	## stretched out: a slung body under overlapping curved bark shingles, a living
	## mat of moss and ferns on its back, short forked boughs growing from the
	## SHOULDERS (never the head), huge night-forager eyes on a forward-thrust head,
	## and crouched, jointed limbs ending in long three-fingered root hands.
	## Mossbun's leaf ears survive, swept far back.
	var r := _rig("quad")
	r.gait_speed = 0.75
	r.bob_height = 0.05
	var v := r.visual
	var hide := Color("4a6230"); var hide_d := Color("3a4f27"); var bark := Color("5e4129"); var bark_d := Color("3f2b1c"); var bark_l := Color("7d5c3a")
	var moss := Color("4f7a36"); var moss_l := Color("7aa64c"); var fern := Color("5fa046"); var belly := Color("b9c48e")
	var leaf := Color("86c45e"); var leaf_in := Color("c3e39a"); var glow_c := Color("8affc0")
	var rng := RandomNumberGenerator.new()
	rng.seed = 2207
	var torso := K.pivot(v, Vector3(0, 0.82, 0.05), "Torso")
	# Long slung body: chest, waist and hips as separate lobes (a stretched silhouette).
	K.add(torso, K.sphere(0.46, 22, 11), K.mat(hide, 0.95), Vector3(0, 0.06, -0.6), Vector3(10, 0, 0), Vector3(1.0, 0.92, 1.05))
	K.add(torso, K.sphere(0.4, 20, 10), K.mat(hide, 0.95), Vector3(0, 0.02, 0.05), Vector3.ZERO, Vector3(0.9, 1.0, 1.25))
	K.add(torso, K.sphere(0.42, 20, 10), K.mat(hide, 0.95), Vector3(0, 0.08, 0.62), Vector3(-8, 0, 0), Vector3(0.95, 0.9, 1.0))
	K.add(torso, K.sphere(0.36, 16, 8), K.mat(belly), Vector3(0, -0.2, -0.15), Vector3.ZERO, Vector3(0.8, 0.5, 2.2))
	# Curved bark shingles overlap down the spine and both flanks like layered armour.
	for i in 10:
		var z := -0.92 + i * 0.19
		var arch := 0.38 + sin(float(i) / 9.0 * PI) * 0.03
		K.add(torso, K.petal(0.36, 0.5, 0.2, 0.035), K.mat(bark if i % 2 == 0 else bark_l, 0.9), Vector3(0, arch, z), Vector3(-82, 180, 0))
		for sx in [-1, 1]:
			K.add(torso, K.petal(0.28, 0.26, 0.12, 0.03), K.mat(bark_d if i % 2 else bark, 0.9), Vector3(0.27 * sx, arch - 0.12, z + 0.04), Vector3(-80, 180, -48 * sx))
	# Living moss mat with ferns and a few tiny glow-caps along the ridge.
	var flora := []
	for i in 16:
		var z := rng.randf_range(-0.85, 0.9)
		K.add(torso, K.sphere(0.09 + rng.randf() * 0.05, 8, 4), K.mat(moss if i % 2 else moss_l, 1.0), Vector3(rng.randf_range(-0.12, 0.12), 0.43 + sin((z + 0.9) / 1.8 * PI) * 0.03, z), Vector3.ZERO, Vector3(1.2, 0.45, 1))
	for i in 5:
		var fp := K.pivot(torso, Vector3(rng.randf_range(-0.1, 0.1), 0.46, -0.55 + i * 0.32), "Fern", Vector3(0, rng.randf() * 360.0, 0))
		for k in 3:
			K.add(fp, K.petal(0.3, 0.07, 0.12, 0.015), K.mat(fern, 0.8), Vector3.ZERO, Vector3(-35 + k * 8, k * 120, 0))
		flora.append(fp)
	for i in 3:
		var gp := Vector3(0.14 * (1 if i % 2 else -1), 0.45, 0.3 + i * 0.18)
		K.add(torso, K.cyl(0.012, 0.016, 0.07, 5), K.mat(Color("efe6d4")), gp)
		K.add(torso, K.sphere(0.04, 8, 4), K.glow(glow_c, 1.2), gp + Vector3(0, 0.045, 0), Vector3.ZERO, Vector3(1, 0.5, 1))
	# Shoulder boughs: short forked branches rising from the shoulder blades.
	var boughs := []
	for sx in [-1, 1]:
		var bp := K.pivot(torso, Vector3(0.24 * sx, 0.4, -0.72), "Bough", Vector3(-12, 0, -32 * sx))
		var main := MeshInstance3D.new()
		main.mesh = K.tube(K.bezier(Vector3.ZERO, Vector3(0.04 * sx, 0.3, 0.06), Vector3(0.1 * sx, 0.55, 0.2), 7), K.taper(7, 0.055, 0.016), 6)
		main.material_override = K.mat(bark_d)
		bp.add_child(main)
		var fork := MeshInstance3D.new()
		fork.mesh = K.tube(K.bezier(Vector3(0.03 * sx, 0.26, 0.05), Vector3(0.16 * sx, 0.33, 0.0), Vector3(0.27 * sx, 0.38, -0.05), 5), K.taper(5, 0.03, 0.012), 5)
		fork.material_override = K.mat(bark_d)
		bp.add_child(fork)
		for tip in [Vector3(0.1 * sx, 0.55, 0.2), Vector3(0.27 * sx, 0.38, -0.05)]:
			for k in 3:
				K.add(bp, K.petal(0.13, 0.07, 0.06), K.mat(leaf if k % 2 else leaf_in, 0.8), tip, Vector3(-30, k * 120, 20 * sx))
		boughs.append(bp)
	# Neck thrusts forward and slightly up; the head sits well clear of the chest.
	var neck := MeshInstance3D.new()
	neck.mesh = K.tube(K.bezier(Vector3(0, 0.92, -0.75), Vector3(0, 1.08, -1.05), Vector3(0, 1.12, -1.3), 7), K.taper(7, 0.27, 0.2), 12)
	neck.material_override = K.mat(hide, 0.95)
	v.add_child(neck)
	for k in 3:
		K.add(v, K.petal(0.2, 0.22, 0.1, 0.03), K.mat(bark if k % 2 else bark_l, 0.9), Vector3(0, 1.12 + k * 0.01, -0.82 - k * 0.17), Vector3(-75, 180, 0))
	var head := K.pivot(v, Vector3(0, 1.15, -1.45), "Head")
	K.add(head, K.sphere(0.3, 20, 10), K.mat(hide, 0.95), Vector3(0, 0.02, 0.02), Vector3.ZERO, Vector3(1.15, 0.85, 1.0))
	K.add(head, K.sphere(0.16, 14, 7), K.mat(belly), Vector3(0, -0.1, -0.22), Vector3.ZERO, Vector3(1.15, 0.7, 0.85))
	K.add(head, K.sphere(0.032, 8, 4), K.mat(Color("2a1e18"), 0.35), Vector3(0, -0.05, -0.355))
	var eyes := []
	for sx in [-1, 1]:
		K.add(head, K.sphere(0.12, 12, 6), K.mat(hide_d), Vector3(0.14 * sx, 0.08, -0.17), Vector3.ZERO, Vector3(1, 1, 0.55))
		eyes.append(K.eye(head, Vector3(0.14 * sx, 0.08, -0.215), 0.095, Color("1d2a1a"), Vector3(0.25 * sx, 0, -1), Color("6dffb0")))
	K.add(head, K.petal(0.26, 0.3, 0.12, 0.03), K.mat(bark_l), Vector3(0, 0.2, -0.02), Vector3(-80, 180, 0))
	var ears := []
	for sx in [-1, 1]:
		var ep := K.pivot(head, Vector3(0.2 * sx, 0.14, 0.08), "Ear", Vector3(72, 0, -42 * sx))
		K.add(ep, K.petal(0.58, 0.2, 0.16, 0.03), K.mat(leaf, 0.8))
		K.add(ep, K.petal(0.43, 0.1, 0.14, 0.02), K.mat(leaf_in, 0.8), Vector3(0, 0.04, -0.012))
		ears.append(ep)
	# Crouched, jointed limbs: upper leg angled out, forearm/shin angled back, root hands.
	var legs := []
	for p in [Vector3(-0.3, 0.8, -0.62), Vector3(0.3, 0.8, -0.62), Vector3(-0.32, 0.82, 0.68), Vector3(0.32, 0.82, 0.68)]:
		var lp := K.pivot(v, p, "Leg")
		var front: bool = p.z < 0
		var sx := signf(p.x)
		var knee := Vector3(0.12 * sx, -0.38, -0.12 if front else 0.16)
		var foot := Vector3(0.1 * sx, -0.76, -0.04 if front else 0.0)
		var up := MeshInstance3D.new()
		up.mesh = K.tube(K.bezier(Vector3.ZERO, Vector3(0.08 * sx, -0.2, knee.z * 0.4), knee, 6), K.taper(6, 0.16 if not front else 0.14, 0.1), 10)
		up.material_override = K.mat(hide)
		lp.add_child(up)
		var low := MeshInstance3D.new()
		low.mesh = K.tube(K.bezier(knee, (knee + foot) * 0.5 + Vector3(0, 0, 0.03), foot, 6), K.taper(6, 0.09, 0.065), 8)
		low.material_override = K.mat(bark)
		lp.add_child(low)
		K.add(lp, K.sphere(0.09, 8, 4), K.mat(moss_l), knee, Vector3.ZERO, Vector3(1.1, 0.8, 1.1))
		for k in 3:
			var a := -0.55 + k * 0.55
			var f := MeshInstance3D.new()
			var tip := foot + Vector3(sin(a) * 0.2, -0.04, -0.2 - (0.05 if k == 1 else 0.0))
			f.mesh = K.tube(K.bezier(foot, foot + Vector3(sin(a) * 0.1, 0.02, -0.1), tip, 5), K.taper(5, 0.035, 0.014), 5)
			f.material_override = K.mat(bark_d)
			lp.add_child(f)
			K.add(lp, K.sphere(0.02, 6, 3), K.glow(glow_c, 0.8), tip)
		legs.append(lp)
	# Long tail curling up into a moss plume (Mossbun's leaf tail, grown).
	var tail := K.pivot(v, Vector3(0, 0.95, 1.05), "Tail", Vector3(-15, 0, 0))
	var tt := MeshInstance3D.new()
	tt.mesh = K.tube(K.bezier(Vector3.ZERO, Vector3(0, -0.05, 0.6), Vector3(0, 0.35, 0.95), 9), K.taper(9, 0.12, 0.045), 8)
	tt.material_override = K.mat(hide)
	tail.add_child(tt)
	for k in 6:
		K.add(tail, K.petal(0.3, 0.12, 0.12, 0.02), K.mat(moss_l if k % 2 else leaf, 0.8), Vector3(0, 0.35, 0.95), Vector3(-30, k * 60, 25))
	r.reg("head", head); r.reg("eyes", eyes); r.reg("ear_l", ears[0]); r.reg("ear_r", ears[1])
	r.reg("legs", legs); r.reg("tail", tail); r.reg("sway", flora + boughs)
	r.reg("acc_head", K.pivot(head, Vector3(0, 0.27, 0.0))); r.reg("acc_neck", K.pivot(v, Vector3(0, 1.0, -1.0)))
	r.reg("saddle", K.pivot(v, Vector3(0, 1.4, 0.1)))
	return r

# ===================================================================== GLIMMERHARE (Small, alternate evolution)
static func _glimmerhare(_variant: String) -> CreatureRig:
	## Lean long-legged sprinter; ears have become glowing root-antennae.
	var r := _rig("quad")
	r.gait_speed = 1.3
	r.bob_height = 0.05
	var v := r.visual
	var fur := Color("cfe6d4"); var dark := Color("3d5a4a"); var glow_c := Color("7af2b8")
	K.add(v, K.capsule(0.11, 0.5), K.mat(fur, 0.9), Vector3(0, 0.48, 0.02), Vector3(80, 0, 0), Vector3.ONE, "Body")
	K.add(v, K.sphere(0.12, 12, 6), K.mat(fur.lightened(0.2)), Vector3(0, 0.47, -0.18), Vector3.ZERO, Vector3(0.9, 1.0, 0.8))
	for k in 7:
		K.add(v, K.sphere(0.018, 6, 3), K.glow(glow_c, 1.5), Vector3((k % 2) * 0.06 - 0.03, 0.59 - k * 0.006, -0.1 + k * 0.05))
	var head := K.pivot(v, Vector3(0, 0.64, -0.3), "Head")
	K.add(head, K.sphere(0.11, 14, 7), K.mat(fur), Vector3.ZERO, Vector3.ZERO, Vector3(0.85, 0.9, 1.15))
	K.add(head, K.sphere(0.07, 10, 5), K.mat(dark), Vector3(0, 0.02, -0.06), Vector3.ZERO, Vector3(1.6, 0.6, 1.0))
	K.add(head, K.cyl(0.0, 0.045, 0.1, 8), K.mat(fur), Vector3(0, -0.02, -0.14), Vector3(-90, 0, 0))
	K.add(head, K.sphere(0.014, 6, 3), K.mat(Color("2a2a30")), Vector3(0, -0.02, -0.19))
	var eyes := [K.eye(head, Vector3(-0.05, 0.03, -0.085), 0.026, Color("0f2a20"), Vector3(-0.5, 0, -1), glow_c), K.eye(head, Vector3(0.05, 0.03, -0.085), 0.026, Color("0f2a20"), Vector3(0.5, 0, -1), glow_c)]
	var ears := []
	for sx in [-1, 1]:
		var ep := K.pivot(head, Vector3(0.04 * sx, 0.08, 0.04), "Ear", Vector3(-20, 0, -12 * sx))
		var ant := MeshInstance3D.new()
		ant.mesh = K.tube(K.bezier(Vector3.ZERO, Vector3(0.05 * sx, 0.3, 0.1), Vector3(0.14 * sx, 0.5, 0.28), 8), K.taper(8, 0.022, 0.008), 5)
		ant.material_override = K.mat(Color("8a6a48"))
		ep.add_child(ant)
		K.add(ep, K.sphere(0.04, 8, 4), K.glow(glow_c, 2.0), Vector3(0.14 * sx, 0.5, 0.28))
		K.add(ep, K.petal(0.12, 0.05, 0.03), K.mat(Color("8fd88a")), Vector3(0.05 * sx, 0.3, 0.1), Vector3(0, 0, -60 * sx))
		ears.append(ep)
	var legs := []
	for p in [Vector3(-0.06, 0.42, -0.2), Vector3(0.06, 0.42, -0.2), Vector3(-0.07, 0.44, 0.22), Vector3(0.07, 0.44, 0.22)]:
		var lp := K.pivot(v, p)
		var back: bool = p.z > 0
		K.add(lp, K.cyl(0.022, 0.03, 0.36, 6), K.mat(fur.darkened(0.08)), Vector3(0, -0.18, 0.04 if back else 0.0), Vector3(-12 if back else 0, 0, 0))
		K.add(lp, K.sphere(0.035, 6, 3), K.mat(dark), Vector3(0, -0.4, -0.02), Vector3.ZERO, Vector3(1, 0.6, 1.6))
		legs.append(lp)
	var tail := K.pivot(v, Vector3(0, 0.55, 0.3), "Tail", Vector3(45, 0, 0))
	K.add(tail, K.petal(0.28, 0.08, 0.22, 0.015), K.mat(glow_c.darkened(0.2), 0.6, glow_c, 0.4))
	r.reg("head", head); r.reg("eyes", eyes); r.reg("ear_l", ears[0]); r.reg("ear_r", ears[1]); r.reg("legs", legs); r.reg("tail", tail)
	r.reg("acc_head", K.pivot(head, Vector3(0, 0.12, 0))); r.reg("acc_neck", K.pivot(v, Vector3(0, 0.55, -0.22)))
	return r

# ===================================================================== IGNAROTH (Colossal, premium)
static func _membrane(pts: PackedVector3Array, col_a: Color, col_b: Color) -> ArrayMesh:
	## Triangle fan from pts[0] (wing root) across the spar tips: a wing membrane.
	var st := SurfaceTool.new()
	st.begin(Mesh.PRIMITIVE_TRIANGLES)
	for i in range(1, pts.size() - 1):
		for p in [pts[0], pts[i], pts[i + 1]]:
			var t := clampf(p.distance_to(pts[0]) / 9.0, 0.0, 1.0)
			st.set_color(col_a.lerp(col_b, t))
			st.add_vertex(p)
	st.generate_normals()
	var m := st.commit()
	m.set_meta("arrays", st.commit_to_arrays())
	return m

static func _ignaroth(_variant: String) -> CreatureRig:
	var r := _rig("quad")
	r.is_colossal = true
	r.gait_speed = 0.4
	r.bob_height = 0.16
	var v := r.visual
	var obs := Color("221d1d"); var obs_l := Color("3a302c"); var magma := Color("ff6a1f"); var horn := Color("cfc2ae")
	var rng := RandomNumberGenerator.new()
	rng.seed = 777
	var torso := K.pivot(v, Vector3(0, 5.0, 0), "Torso")
	K.add(torso, K.sphere(1.0, 22, 11), K.flat(obs, 0.6), Vector3.ZERO, Vector3.ZERO, Vector3(2.0, 1.7, 3.6))
	K.add(torso, K.sphere(1.0, 16, 8), K.mat(Color("4a2a20"), 0.8), Vector3(0, -0.7, -0.3), Vector3.ZERO, Vector3(1.6, 1.0, 3.0))
	# Overlapping obsidian scutes down the spine, each with a molten seam.
	for i in 9:
		var z := -2.8 + i * 0.75
		var sc := K.add(torso, K.sphere(0.9, 6, 3), K.flat(obs_l if i % 2 else obs, 0.5), Vector3(0, 1.45 - absf(z) * 0.1, z), Vector3(-20, 45, 0), Vector3(1.1 - absf(z) * 0.08, 0.45, 0.9))
		K.add(sc, K.box(Vector3(1.2, 0.05, 0.05)), K.glow(magma, 2.2), Vector3(0, 0.3, 0.6))
	# Magma veins across the flanks.
	for sx in [-1, 1]:
		for k in 6:
			K.add(torso, K.capsule(0.06, 1.0 + (k % 3) * 0.4), K.glow(magma, 2.0), Vector3(1.95 * sx, rng.randf_range(-0.6, 0.6), -2.4 + k * 0.95), Vector3(rng.randf_range(20, 70), 0, 15 * sx))
	# Heavy legs with glowing joints and pale talons.
	var legs := []
	for p in [Vector3(-1.3, 4.6, -2.3), Vector3(1.3, 4.6, -2.3), Vector3(-1.4, 4.6, 2.4), Vector3(1.4, 4.6, 2.4)]:
		var lp := K.pivot(v, p, "Leg")
		K.add(lp, K.capsule(0.75, 2.6), K.flat(obs, 0.6), Vector3(0, -1.1, 0))
		K.add(lp, K.sphere(0.45, 10, 5), K.glow(magma, 1.8), Vector3(0, -2.3, -0.25), Vector3.ZERO, Vector3(1, 0.6, 0.6))
		K.add(lp, K.cyl(0.5, 0.65, 2.0, 8), K.flat(obs_l, 0.6), Vector3(0, -3.3, 0))
		for k in 3:
			K.add(lp, K.cyl(0.0, 0.16, 0.7, 5), K.mat(horn, 0.5), Vector3(-0.35 + k * 0.35, -4.4, -0.6), Vector3(-75, 0, 0))
		legs.append(lp)
	# S-curved neck and wedge head with crown horns sweeping back, cheek horns curling forward.
	var neck := MeshInstance3D.new()
	neck.mesh = K.tube(K.bezier(Vector3(0, 5.6, -3.0), Vector3(0, 8.4, -3.4), Vector3(0, 8.0, -5.6), 12), K.taper(12, 1.2, 0.7, 0.1), 12)
	neck.material_override = K.flat(obs, 0.6)
	v.add_child(neck)
	for k in 5:
		K.add(v, K.sphere(0.4, 6, 3), K.flat(obs_l, 0.5), Vector3(0, 6.6 + k * 0.4, -3.1 - k * 0.45), Vector3(-30, 45, 0), Vector3(1.0, 0.4, 1.0))
	var head := K.pivot(v, Vector3(0, 8.1, -5.8), "Head")
	K.add(head, K.sphere(1.0, 12, 6), K.flat(obs, 0.6), Vector3(0, 0.1, -0.2), Vector3(-6, 0, 0), Vector3(0.78, 0.6, 1.05))
	K.add(head, K.cyl(0.32, 0.62, 1.6, 8), K.flat(obs_l, 0.6), Vector3(0, -0.02, -1.35), Vector3(-92, 0, 0), Vector3(1.0, 1.0, 0.75))
	K.add(head, K.cyl(0.25, 0.5, 1.5, 8), K.flat(Color("2e2522"), 0.6), Vector3(0, -0.42, -1.05), Vector3(-80, 0, 0), Vector3(1.0, 1.0, 0.5))
	K.add(head, K.sphere(0.2, 8, 4), K.glow(magma, 1.6), Vector3(0, -0.2, -2.1), Vector3.ZERO, Vector3(1.4, 0.5, 0.6))
	for k in 4:
		K.add(head, K.cyl(0.0, 0.08, 0.3, 4), K.mat(horn), Vector3(-0.4 + k * 0.27, -0.33, -1.7), Vector3(180, 0, 0))
	var eyes := []
	for sx in [-1, 1]:
		eyes.append(K.eye(head, Vector3(0.62 * sx, 0.35, -0.9), 0.16, Color("3a0a00"), Vector3(0.8 * sx, 0, -1), Color("ffb347")))
		K.add(head, K.box(Vector3(0.5, 0.12, 0.6)), K.flat(obs_l, 0.5), Vector3(0.55 * sx, 0.55, -0.85), Vector3(0, 0, 18 * sx))
		K.add(head, K.capsule(0.04, 0.9), K.glow(magma, 2.2), Vector3(0.5 * sx, -0.05, -0.9), Vector3(80, 0, 0))
		var cheek := MeshInstance3D.new()
		cheek.mesh = K.tube(K.bezier(Vector3(0.7 * sx, -0.1, 0.2), Vector3(1.4 * sx, -0.2, -0.3), Vector3(1.2 * sx, 0.1, -1.1), 8), K.taper(8, 0.18, 0.03), 7)
		cheek.material_override = K.mat(horn, 0.5)
		head.add_child(cheek)
	var crown := K.pivot(head, Vector3(0, 0.6, 0.4), "Crown")
	var lens := [3.2, 2.6, 2.0, 2.6, 3.2]
	for i in 5:
		var off := (i - 2) * 0.32
		var h := MeshInstance3D.new()
		h.mesh = K.tube(K.bezier(Vector3(off, 0, 0), Vector3(off * 1.6, 0.9, lens[i] * 0.5), Vector3(off * 2.2, 0.5 + (2 - absf(i - 2)) * 0.25, lens[i]), 10), K.taper(10, 0.22, 0.03), 7)
		h.material_override = K.mat(horn.darkened(0.15 * absf(i - 2)), 0.5)
		crown.add_child(h)
		K.add(crown, K.sphere(0.12, 6, 3), K.glow(magma, 2.0), Vector3(off * 1.6, 0.85, lens[i] * 0.5))
	# Asymmetric wings: the left is larger than the right.
	var wings := []
	for sx in [-1, 1]:
		var big: bool = sx < 0
		var span: float = 11.0 if big else 8.5
		var wp := K.pivot(torso, Vector3(1.2 * sx, 1.1, -1.2), "Wing", Vector3(0, 0, 18 * sx))
		var arm_end := Vector3(span * 0.45 * sx, 2.4, 0.6)
		var arm := MeshInstance3D.new()
		arm.mesh = K.tube(K.bezier(Vector3.ZERO, Vector3(span * 0.2 * sx, 2.0, -0.4), arm_end, 8), K.taper(8, 0.35, 0.18), 8)
		arm.material_override = K.flat(obs, 0.6)
		wp.add_child(arm)
		var tips := PackedVector3Array([Vector3(0, 0, 1.5)])
		var fingers := 4
		for f in fingers:
			var t := float(f) / (fingers - 1)
			var tip := arm_end + Vector3(span * (0.55 - 0.15 * t) * sx, -1.0 - t * 3.0, 1.2 + t * 3.5)
			var spar := MeshInstance3D.new()
			spar.mesh = K.tube(K.bezier(arm_end, arm_end.lerp(tip, 0.5) + Vector3(0, 0.4, 0), tip, 6), K.taper(6, 0.14, 0.04), 5)
			spar.material_override = K.flat(obs_l, 0.6)
			wp.add_child(spar)
			K.add(wp, K.cyl(0.0, 0.1, 0.5, 4), K.mat(horn), tip, Vector3(0, 0, 90 * sx))
			tips.append(tip)
		tips.insert(1, arm_end)
		var mem := MeshInstance3D.new()
		mem.mesh = _membrane(tips, Color("5a1a10"), Color("e8642f"))
		mem.material_override = K.vcol(0.7, true)
		wp.add_child(mem)
		for f in 3:
			K.add(wp, K.capsule(0.05, 2.5), K.glow(magma.darkened(0.2), 1.4), arm_end + Vector3(span * 0.25 * sx, -1.4 - f, 1.5 + f * 1.1), Vector3(60, 0, 30 * sx))
		wings.append(wp)
	# Tail ending in a basalt club.
	var tail := K.pivot(v, Vector3(0, 5.2, 3.4), "Tail")
	var tmi := MeshInstance3D.new()
	tmi.mesh = K.tube(K.bezier(Vector3.ZERO, Vector3(0, -1.0, 3.5), Vector3(0, -2.6, 7.0), 14), K.taper(14, 0.9, 0.3), 10)
	tmi.material_override = K.flat(obs, 0.6)
	tail.add_child(tmi)
	for k in 6:
		var t := float(k) / 6.0
		K.add(tail, K.cyl(0.0, 0.22, 0.6, 4), K.mat(horn, 0.5), Vector3(0, -0.15 - t * 2.3 + 0.7 - t * 0.2, t * 6.6), Vector3(-20, 0, 0))
	var club := K.add(tail, K.sphere(0.85, 7, 4), K.flat(Color("2b2624"), 0.5), Vector3(0, -2.7, 7.2), Vector3(20, 30, 0), Vector3(1, 0.8, 1.2))
	for k in 5:
		K.add(club, K.cyl(0.0, 0.18, 0.7, 4), K.mat(horn), Vector3(cos(k * 1.26) * 0.7, sin(k * 1.26) * 0.7, 0.2), Vector3(0, 0, rad_to_deg(k * 1.26) - 90))
	K.add(club, K.sphere(0.5, 8, 4), K.glow(magma, 1.6), Vector3(0, 0, 0.5), Vector3.ZERO, Vector3(1, 1, 0.4))
	var embers := FX.motes(Color("ffb347"), 24, Vector3(2.5, 2.0, 4.0), 0.06)
	embers.position = Vector3(0, 5.5, 0)
	v.add_child(embers)
	r.reg("head", head); r.reg("eyes", eyes); r.reg("legs", legs); r.reg("tail", tail); r.reg("wings", wings)
	r.reg("sway", [crown]); r.reg("feet", legs)
	r.reg("acc_head", K.pivot(head, Vector3(0, 0.7, 0))); r.reg("acc_neck", K.pivot(v, Vector3(0, 7.0, -3.4)))
	r.reg("saddle", K.pivot(torso, Vector3(0, 1.6, -1.0)))
	return r

# ===================================================================== SHAMRELLE (Cloverling evolved)
static func _shamrelle(_variant: String) -> CreatureRig:
	## Tall clover dancer: slender stem body, parasol crown of four great leaves.
	var r := _rig("hop")
	r.bob_height = 0.06
	var v := r.visual
	var stem := Color("6fae5a"); var face := Color("f2f5d6"); var gold := Color("e3c24a")
	var body := MeshInstance3D.new()
	body.mesh = K.tube(K.bezier(Vector3(0, 0.12, 0), Vector3(0, 0.45, 0.04), Vector3(0, 0.8, 0), 8), K.taper(8, 0.1, 0.07, 0.03), 10)
	body.material_override = K.mat(stem)
	v.add_child(body)
	K.add(v, K.cyl(0.24, 0.1, 0.25, 12), K.mat(stem.lightened(0.15)), Vector3(0, 0.22, 0))
	var skirt := []
	for k in 6:
		var pp := K.pivot(v, Vector3(0, 0.3, 0), "", Vector3(0, k * 60, 0))
		K.add(pp, K.petal(0.26, 0.16, -0.1, 0.015), K.mat(stem.darkened(0.1) if k % 2 else stem.lightened(0.1)), Vector3.ZERO, Vector3(120, 0, 0))
		skirt.append(pp)
	var head := K.pivot(v, Vector3(0, 0.92, 0), "Head")
	K.add(head, K.sphere(0.14, 18, 9), K.mat(face, 0.85), Vector3.ZERO, Vector3.ZERO, Vector3(0.95, 1.0, 0.9))
	var eyes := [K.eye(head, Vector3(-0.05, 0.02, -0.115), 0.034, Color("1d2a1a")), K.eye(head, Vector3(0.05, 0.02, -0.115), 0.034, Color("1d2a1a"))]
	for sx in [-1, 1]:
		K.add(head, K.sphere(0.022, 8, 4), K.mat(Color("f3a0a8")), Vector3(0.09 * sx, -0.035, -0.1), Vector3.ZERO, Vector3(1, 0.6, 0.5))
	K.add(head, K.torus(0.01, 0.02, 10), K.mat(Color("6b3a3a")), Vector3(0, -0.05, -0.125), Vector3(80, 0, 0), Vector3(1, 1, 0.5))
	var parasol := K.pivot(head, Vector3(0, 0.16, 0), "Parasol")
	K.add(parasol, K.cyl(0.012, 0.016, 0.22, 5), K.mat(stem.darkened(0.2)), Vector3(0, 0.1, 0))
	for k in 4:
		var lp := K.pivot(parasol, Vector3(0, 0.2, 0), "", Vector3(0, 45 + k * 90, 0))
		for sx in [-1, 1]:
			K.add(lp, K.petal(0.34, 0.26, -0.15, 0.02), K.mat(Color("4fa35a") if k % 2 == 0 else Color("5cb866"), 0.8), Vector3(0.05 * sx, 0, 0), Vector3(-72, 0, -16 * sx))
	K.add(parasol, K.sphere(0.06, 10, 5), K.mat(gold, 0.4, gold, 1.2), Vector3(0, 0.28, 0))
	var arms := []
	for sx in [-1, 1]:
		var ap := K.pivot(v, Vector3(0.08 * sx, 0.72, 0), "Arm", Vector3(20, 0, -110 * sx))
		var rib := MeshInstance3D.new()
		rib.mesh = K.tube(K.bezier(Vector3.ZERO, Vector3(0, 0.25, 0.08), Vector3(0.02 * sx, 0.5, 0.22), 8), K.taper(8, 0.025, 0.01), 5)
		rib.material_override = K.mat(stem)
		ap.add_child(rib)
		K.add(ap, K.petal(0.14, 0.08, 0.05), K.mat(gold.lightened(0.2)), Vector3(0.02 * sx, 0.5, 0.22), Vector3(-40, 0, 0))
		arms.append(ap)
	var legs := []
	for sx in [-1, 1]:
		var lp := K.pivot(v, Vector3(0.06 * sx, 0.12, 0))
		K.add(lp, K.capsule(0.035, 0.16), K.mat(Color("6e5a3a")), Vector3(0, -0.06, -0.01), Vector3(-15, 0, 0))
		legs.append(lp)
	r.reg("head", head); r.reg("eyes", eyes); r.reg("legs", legs); r.reg("sway", [parasol] + arms + skirt); r.reg("orbit", parasol)
	r.reg("acc_head", K.pivot(head, Vector3(0, 0.15, 0))); r.reg("acc_neck", K.pivot(v, Vector3(0, 0.82, 0)))
	return r

# ===================================================================== CAIRNBACK (Pebblit evolved, Large)
static func _cairnback(_variant: String) -> CreatureRig:
	## Low, heavy stone tortoise-beast carrying a glowing rune cairn.
	var r := _rig("waddle")
	r.gait_speed = 0.55
	r.bob_height = 0.04
	var v := r.visual
	var stone := Color("8f979c"); var dark := Color("5f676c"); var rune := Color("63f2d8"); var moss := Color("6c9a4a")
	K.add(v, K.sphere(1.0, 9, 5), K.flat(stone), Vector3(0, 0.95, 0.05), Vector3(0, 20, 0), Vector3(1.35, 0.7, 1.7))
	K.add(v, K.sphere(1.0, 8, 4), K.flat(dark), Vector3(0, 0.62, 0.05), Vector3.ZERO, Vector3(1.25, 0.35, 1.55))
	var rng := RandomNumberGenerator.new()
	rng.seed = 404
	for i in 10:
		var a := TAU * i / 10.0
		var slab := K.add(v, K.sphere(0.32, 6, 3), K.flat(dark if i % 2 else stone.lightened(0.05)), Vector3(cos(a) * 1.1, 1.05, sin(a) * 1.4 + 0.05), Vector3(0, rad_to_deg(-a), 0), Vector3(1.2, 0.4, 0.9))
		K.add(slab, K.box(Vector3(0.3, 0.04, 0.04)), K.glow(rune, 1.6), Vector3(0, 0.15, 0))
	var cairn := K.pivot(v, Vector3(0, 1.55, 0.2), "Cairn")
	var y := 0.0
	for k in 4:
		var sz := 0.45 - k * 0.08
		var cs := K.add(cairn, K.sphere(sz, 7, 4), K.flat(stone.lerp(dark, rng.randf())), Vector3(rng.randf_range(-0.05, 0.05), y + sz * 0.45, 0), Vector3(0, k * 40, rng.randf_range(-8, 8)), Vector3(1.2, 0.55, 1.0))
		K.add(cs, K.torus(sz * 0.8, sz * 0.9, 12), K.glow(rune, 1.4), Vector3(0, 0.0, 0), Vector3.ZERO, Vector3(1, 0.3, 1))
		y += sz * 0.85
	for k in 6:
		K.add(v, K.cyl(0.0, 0.1, 0.45, 5), K.mat(rune.lightened(0.3), 0.2, rune, 0.9), Vector3(0, 1.45 - k * 0.12, -0.9 + k * 0.5 + (0.0 if k < 2 else 0.4)), Vector3(-15 + k * 8, 0, 0))
	for k in 5:
		K.add(v, K.sphere(0.18, 8, 4), K.mat(moss), Vector3(rng.randf_range(-0.8, 0.8), 1.2, rng.randf_range(-0.6, 1.0)), Vector3.ZERO, Vector3(1.3, 0.4, 1))
	var head := K.pivot(v, Vector3(0, 0.85, -1.55), "Head")
	K.add(head, K.sphere(0.42, 8, 4), K.flat(stone), Vector3(0, 0, -0.15), Vector3.ZERO, Vector3(1.0, 0.75, 1.15))
	K.add(head, K.sphere(0.3, 7, 4), K.flat(dark), Vector3(0, 0.22, -0.2), Vector3(-10, 0, 0), Vector3(1.4, 0.35, 0.9))
	var eyes := [K.eye(head, Vector3(-0.17, 0.08, -0.5), 0.06, Color("101a18"), Vector3(-0.4, 0, -1), rune), K.eye(head, Vector3(0.17, 0.08, -0.5), 0.06, Color("101a18"), Vector3(0.4, 0, -1), rune)]
	for e in eyes:
		e.scale = Vector3(1, 0.55, 1)
	K.add(head, K.torus(0.05, 0.08, 12), K.glow(rune, 1.4), Vector3(0, 0.28, -0.42), Vector3(70, 0, 0))
	var legs := []
	for p in [Vector3(-0.85, 0.6, -0.9), Vector3(0.85, 0.6, -0.9), Vector3(-0.85, 0.6, 1.0), Vector3(0.85, 0.6, 1.0)]:
		var lp := K.pivot(v, p)
		K.add(lp, K.cyl(0.26, 0.32, 0.65, 7), K.flat(dark), Vector3(0, -0.3, 0))
		for k in 3:
			K.add(lp, K.sphere(0.07, 5, 3), K.flat(stone.lightened(0.1)), Vector3(-0.15 + k * 0.15, -0.6, -0.28))
		legs.append(lp)
	var tail := K.pivot(v, Vector3(0, 0.7, 1.75), "Tail")
	K.add(tail, K.sphere(0.2, 6, 3), K.flat(stone), Vector3(0, 0, 0.1))
	K.add(tail, K.sphere(0.13, 6, 3), K.flat(dark), Vector3(0, -0.04, 0.32))
	r.reg("head", head); r.reg("eyes", eyes); r.reg("legs", legs); r.reg("tail", tail); r.reg("sway", [cairn])
	r.reg("acc_head", K.pivot(head, Vector3(0, 0.35, -0.1))); r.reg("acc_neck", K.pivot(v, Vector3(0, 0.85, -1.3)))
	r.reg("saddle", K.pivot(v, Vector3(0, 1.55, -0.55)))
	return r

# ===================================================================== DAWNSTRIDER (Sunfox evolved, Large)
static func _dawnstrider(_variant: String) -> CreatureRig:
	## Tall long-legged golden runner with a floating sun halo and a single sun-disc tail.
	var r := _rig("quad")
	r.gait_speed = 0.8
	r.bob_height = 0.06
	var v := r.visual
	var fur := Color("e9a23b"); var cream := Color("fff1c2"); var dark := Color("6b3518"); var glow_c := Color("ffcf6a")
	K.add(v, K.capsule(0.32, 1.5), K.mat(fur), Vector3(0, 1.6, 0.05), Vector3(84, 0, 0))
	K.add(v, K.capsule(0.26, 1.1), K.mat(cream), Vector3(0, 1.48, -0.05), Vector3(84, 0, 0), Vector3(0.9, 1, 0.75))
	for k in 5:
		K.add(v, K.sphere(0.07, 6, 3), K.mat(dark.lightened(0.2)), Vector3(0, 1.92, -0.45 + k * 0.25), Vector3.ZERO, Vector3(2.2, 0.35, 0.7))
	var neck := MeshInstance3D.new()
	neck.mesh = K.tube(K.bezier(Vector3(0, 1.75, -0.55), Vector3(0, 2.2, -0.75), Vector3(0, 2.45, -0.95), 8), K.taper(8, 0.22, 0.15), 10)
	neck.material_override = K.mat(fur)
	v.add_child(neck)
	K.add(v, K.sphere(0.24, 10, 5), K.mat(cream), Vector3(0, 1.95, -0.7), Vector3(-30, 0, 0), Vector3(1, 1.2, 0.7))
	var head := K.pivot(v, Vector3(0, 2.55, -1.0), "Head")
	K.add(head, K.sphere(0.2, 16, 8), K.mat(fur), Vector3.ZERO, Vector3.ZERO, Vector3(0.9, 0.9, 1.1))
	K.add(head, K.cyl(0.0, 0.1, 0.32, 10), K.mat(cream), Vector3(0, -0.06, -0.27), Vector3(-92, 0, 0))
	K.add(head, K.sphere(0.035, 8, 4), K.mat(Color("2a1a14"), 0.3), Vector3(0, -0.06, -0.43))
	var eyes := [K.eye(head, Vector3(-0.1, 0.05, -0.14), 0.04, Color("3a1d0e"), Vector3(-0.5, 0, -1)), K.eye(head, Vector3(0.1, 0.05, -0.14), 0.04, Color("3a1d0e"), Vector3(0.5, 0, -1))]
	var ears := []
	for sx in [-1, 1]:
		var ep := K.pivot(head, Vector3(0.1 * sx, 0.14, 0.05), "Ear", Vector3(-15, 0, -10 * sx))
		K.add(ep, K.petal(0.22, 0.1, 0.08, 0.02), K.mat(fur))
		K.add(ep, K.petal(0.14, 0.05, 0.07, 0.015), K.mat(dark), Vector3(0, 0.02, -0.015))
		ears.append(ep)
	var halo := K.pivot(head, Vector3(0, 0.15, 0.35), "Halo")
	K.add(halo, K.torus(0.32, 0.38, 32), K.glow(glow_c, 1.8), Vector3.ZERO, Vector3(90, 0, 0))
	for k in 12:
		var a := TAU * k / 12.0
		K.add(halo, K.cyl(0.0, 0.04, 0.16, 4), K.glow(glow_c.lightened(0.2), 1.6), Vector3(cos(a) * 0.46, sin(a) * 0.46, 0), Vector3(0, 0, rad_to_deg(a) - 90))
	var legs := []
	for p in [Vector3(-0.2, 1.4, -0.55), Vector3(0.2, 1.4, -0.55), Vector3(-0.2, 1.4, 0.6), Vector3(0.2, 1.4, 0.6)]:
		var lp := K.pivot(v, p)
		var back: bool = p.z > 0
		K.add(lp, K.capsule(0.1, 0.8), K.mat(fur), Vector3(0, -0.35, 0.05 if back else 0.0))
		K.add(lp, K.cyl(0.05, 0.065, 0.75, 8), K.mat(fur.darkened(0.05)), Vector3(0, -0.95, -0.05 if back else 0.0))
		K.add(lp, K.cyl(0.07, 0.08, 0.14, 8), K.mat(dark), Vector3(0, -1.34, -0.02))
		legs.append(lp)
	var tail := K.pivot(v, Vector3(0, 1.75, 0.8), "Tail")
	var tmi := MeshInstance3D.new()
	tmi.mesh = K.tube(K.bezier(Vector3.ZERO, Vector3(0, 0.15, 0.7), Vector3(0, 0.6, 1.2), 12), K.taper(12, 0.12, 0.05, 0.05), 8)
	tmi.material_override = K.mat(fur)
	tail.add_child(tmi)
	var disc := K.pivot(tail, Vector3(0, 0.62, 1.25))
	K.add(disc, K.cyl(0.26, 0.26, 0.04, 20), K.mat(cream, 0.5, glow_c, 1.6), Vector3.ZERO, Vector3(70, 0, 0))
	K.add(disc, K.torus(0.24, 0.3, 20), K.mat(fur.darkened(0.2)), Vector3.ZERO, Vector3(70, 0, 0))
	var l := OmniLight3D.new()
	l.light_color = glow_c
	l.omni_range = 4.0
	l.light_energy = 0.7
	disc.add_child(l)
	r.reg("head", head); r.reg("eyes", eyes); r.reg("ear_l", ears[0]); r.reg("ear_r", ears[1]); r.reg("legs", legs); r.reg("tail", tail); r.reg("sway", [halo])
	r.reg("acc_head", K.pivot(head, Vector3(0, 0.2, 0))); r.reg("acc_neck", K.pivot(v, Vector3(0, 2.1, -0.8)))
	r.reg("saddle", K.pivot(v, Vector3(0, 1.95, -0.05)))
	return r

# ===================================================================== CLOUDWELL (Dewdrop evolved, Large)
static func _cloudwell(_variant: String) -> CreatureRig:
	## A floating raincloud with a water-drop face beneath and a small rainbow on top.
	var r := _rig("float")
	r.hover_height = 1.0
	var v := r.visual
	var cloud := Color("eef4fb"); var water := Color("7fd3f5"); var em := Color("4ab8e8")
	var body := K.pivot(v, Vector3(0, 1.4, 0), "Cloud")
	var puffs := [[Vector3(0, 0.1, 0), 0.6], [Vector3(-0.55, 0, 0.1), 0.42], [Vector3(0.55, 0, 0.05), 0.45], [Vector3(0.1, 0.35, 0.2), 0.42], [Vector3(-0.25, 0.25, -0.2), 0.38], [Vector3(0.35, 0.2, -0.25), 0.35], [Vector3(0, -0.05, 0.4), 0.4]]
	for pf in puffs:
		K.add(body, K.sphere(pf[1], 14, 7), K.mat(cloud, 0.95), pf[0], Vector3.ZERO, Vector3(1, 0.8, 1))
	K.add(body, K.sphere(0.55, 12, 6), K.mat(Color("c9d6e4")), Vector3(0, -0.25, 0.05), Vector3.ZERO, Vector3(1.6, 0.35, 1.2))
	var rainbow := K.pivot(body, Vector3(0, 0.45, 0.05), "Rainbow")
	var bands := [Color("e8576b"), Color("f2b33d"), Color("f4e27a"), Color("7fbf6a"), Color("6c9ad0"), Color("9a62d6")]
	for i in bands.size():
		var rad := 0.5 - i * 0.045
		K.add(rainbow, K.torus(rad - 0.022, rad, 28), K.mat(bands[i], 0.5, bands[i], 0.4), Vector3.ZERO, Vector3(90, 0, 0), Vector3(1, 1, 1))
	K.add(rainbow, K.box(Vector3(1.2, 0.6, 0.2)), K.mat(cloud), Vector3(0, -0.3, 0))
	var head := K.pivot(v, Vector3(0, 0.85, -0.05), "Head")
	K.add(head, K.sphere(0.26, 20, 10), K.glass(water, 0.6, em), Vector3.ZERO)
	K.add(head, K.cyl(0.0, 0.2, 0.34, 16), K.glass(water, 0.6, em), Vector3(0, 0.3, 0))
	K.add(head, K.sphere(0.08, 8, 4), K.glow(Color("d6fbff"), 1.4), Vector3(0, 0, 0.03))
	var eyes := [K.eye(head, Vector3(-0.09, 0.03, -0.22), 0.055, Color("16213a")), K.eye(head, Vector3(0.09, 0.03, -0.22), 0.055, Color("16213a"))]
	for sx in [-1, 1]:
		K.add(head, K.sphere(0.03, 8, 4), K.mat(Color("ffb3c8")), Vector3(0.15 * sx, -0.04, -0.2), Vector3.ZERO, Vector3(1, 0.55, 0.4))
	K.add(head, K.torus(0.015, 0.025, 10), K.mat(Color("16213a")), Vector3(0, -0.07, -0.24), Vector3(80, 0, 0), Vector3(1, 1, 0.5))
	var fins := []
	for sx in [-1, 1]:
		var fp := K.pivot(head, Vector3(0.24 * sx, 0.0, 0.02), "Fin", Vector3(0, 0, -80 * sx))
		K.add(fp, K.petal(0.24, 0.18, 0.12, 0.02), K.glass(water.lightened(0.2), 0.45, em))
		fins.append(fp)
	var rain := FX.motes(water.lightened(0.3), 40, Vector3(0.7, 0.05, 0.5), 0.025)
	rain.direction = Vector3.DOWN
	rain.spread = 2.0
	rain.initial_velocity_min = 2.5
	rain.initial_velocity_max = 3.5
	rain.gravity = Vector3(0, -4, 0)
	rain.lifetime = 0.5
	rain.position = Vector3(0, 1.1, 0)
	v.add_child(rain)
	r.reg("head", head); r.reg("eyes", eyes); r.reg("wings", fins); r.reg("sway", [rainbow, body])
	r.reg("acc_head", K.pivot(body, Vector3(0, 0.6, -0.1))); r.reg("acc_neck", K.pivot(head, Vector3(0, -0.2, -0.1)))
	return r

# ===================================================================== BLOSSOMERE (Bloomtail evolved, Large)
static func _blossomere(_variant: String) -> CreatureRig:
	## Long-necked gentle grazer with a whole flower garden on its back.
	var r := _rig("quad")
	r.gait_speed = 0.6
	r.bob_height = 0.05
	var v := r.visual
	var fur := Color("e7b9c9"); var cream := Color("f7e9dc"); var petal_c := Color("d9487a"); var leaf := Color("5fa857")
	K.add(v, K.sphere(1.0, 20, 10), K.mat(fur, 0.95), Vector3(0, 1.45, 0.1), Vector3.ZERO, Vector3(0.75, 0.62, 1.15))
	K.add(v, K.sphere(1.0, 16, 8), K.mat(cream), Vector3(0, 1.3, 0.05), Vector3.ZERO, Vector3(0.65, 0.5, 1.0))
	var garden := K.pivot(v, Vector3(0, 1.98, 0.15), "Garden")
	var rng := RandomNumberGenerator.new()
	rng.seed = 515
	K.add(garden, K.sphere(0.7, 14, 7), K.mat(leaf), Vector3(0, -0.12, 0), Vector3.ZERO, Vector3(0.9, 0.3, 1.25))
	for k in 18:
		var p := Vector3(rng.randf_range(-0.5, 0.5), 0.05, rng.randf_range(-0.8, 0.8))
		K.add(garden, K.sphere(0.08, 6, 3), K.mat([petal_c, Color("f2a7c3"), Color("ffffff"), Color("f4e27a"), Color("c49af0")][k % 5], 0.7), p + Vector3(0, 0.08, 0), Vector3.ZERO, Vector3(1, 0.6, 1))
	var tree := K.pivot(garden, Vector3(0.1, 0, -0.1))
	K.add(tree, K.cyl(0.03, 0.06, 0.6, 6), K.mat(Color("6b4a32")), Vector3(0, 0.3, 0))
	for k in 5:
		K.add(tree, K.sphere(0.22, 10, 5), K.mat(Color("f2a7c3").lerp(Color.WHITE, rng.randf() * 0.4), 0.7), Vector3(rng.randf_range(-0.2, 0.2), 0.65 + rng.randf() * 0.2, rng.randf_range(-0.2, 0.2)))
	for k in 3:
		K.add(garden, K.sphere(0.16, 8, 4), K.mat(leaf.lightened(0.15)), Vector3(rng.randf_range(-0.4, 0.4), 0.1, rng.randf_range(0.2, 0.7)))
	var neck := MeshInstance3D.new()
	neck.mesh = K.tube(K.bezier(Vector3(0, 1.6, -0.75), Vector3(0, 2.4, -1.0), Vector3(0, 2.85, -1.45), 10), K.taper(10, 0.24, 0.15), 10)
	neck.material_override = K.mat(fur)
	v.add_child(neck)
	for k in 5:
		K.add(v, K.sphere(0.06, 6, 3), K.mat(petal_c), Vector3(0, 1.9 + k * 0.2, -0.82 - k * 0.13), Vector3.ZERO, Vector3(1, 0.6, 1))
	var head := K.pivot(v, Vector3(0, 2.95, -1.55), "Head")
	K.add(head, K.sphere(0.22, 16, 8), K.mat(fur), Vector3.ZERO, Vector3.ZERO, Vector3(0.9, 0.9, 1.15))
	K.add(head, K.sphere(0.12, 12, 6), K.mat(cream), Vector3(0, -0.06, -0.2), Vector3.ZERO, Vector3(1.2, 0.8, 1.1))
	K.add(head, K.sphere(0.03, 8, 4), K.mat(Color("b3566e"), 0.4), Vector3(0, -0.03, -0.32))
	var eyes := [K.eye(head, Vector3(-0.1, 0.05, -0.16), 0.045, Color("1d1a22")), K.eye(head, Vector3(0.1, 0.05, -0.16), 0.045, Color("1d1a22"))]
	for e in eyes:
		e.scale = Vector3(1, 0.8, 1)
	var ears := []
	for sx in [-1, 1]:
		var ep := K.pivot(head, Vector3(0.17 * sx, 0.06, 0.02), "Ear", Vector3(0, 0, 150 * sx))
		K.add(ep, K.petal(0.3, 0.2, -0.06, 0.02), K.mat(Color("d48aa8")))
		ears.append(ep)
	var crown := K.pivot(head, Vector3(0, 0.2, 0.02), "Crown")
	for i in 7:
		var pp := K.pivot(crown, Vector3.ZERO, "", Vector3(0, i * 51.4, 0))
		K.add(pp, K.petal(0.2, 0.14, -0.06, 0.015), K.mat(petal_c, 0.7), Vector3.ZERO, Vector3(-55, 0, 0))
	K.add(crown, K.sphere(0.06, 10, 5), K.mat(Color("f5cf4a"), 0.6, Color("f5cf4a"), 0.4), Vector3(0, 0.03, 0))
	var legs := []
	for p in [Vector3(-0.4, 1.15, -0.65), Vector3(0.4, 1.15, -0.65), Vector3(-0.4, 1.15, 0.8), Vector3(0.4, 1.15, 0.8)]:
		var lp := K.pivot(v, p)
		K.add(lp, K.cyl(0.12, 0.15, 1.15, 8), K.mat(fur.darkened(0.08)), Vector3(0, -0.58, 0))
		K.add(lp, K.cyl(0.15, 0.17, 0.12, 8), K.mat(leaf.darkened(0.2)), Vector3(0, -1.12, 0))
		legs.append(lp)
	var tail := K.pivot(v, Vector3(0, 1.55, 1.2), "Tail", Vector3(55, 0, 0))
	for a in [-50, -25, 0, 25, 50]:
		K.add(tail, K.petal(1.0, 0.36, 0.3, 0.04), K.mat(leaf if a % 50 else leaf.lightened(0.2), 0.75), Vector3.ZERO, Vector3(0, 0, a))
	var bf := FX.motes(Color("f2c94c"), 6, Vector3(0.5, 0.3, 0.6), 0.04)
	bf.position = Vector3(0, 2.4, 0.1)
	v.add_child(bf)
	r.reg("head", head); r.reg("eyes", eyes); r.reg("ear_l", ears[0]); r.reg("ear_r", ears[1]); r.reg("legs", legs); r.reg("tail", tail); r.reg("sway", [crown, tree])
	r.reg("acc_head", K.pivot(head, Vector3(0, 0.26, 0))); r.reg("acc_neck", K.pivot(v, Vector3(0, 2.4, -1.0)))
	r.reg("saddle", K.pivot(v, Vector3(0, 2.05, -0.45)))
	return r

# ===================================================================== ASTRAVYTH (Colossal, flying)
static func _astravyth(_variant: String) -> CreatureRig:
	## Slender celestial flyer: layered star-veined wings, crescent crest, three tail-ribbons.
	var r := _rig("quad")
	r.is_colossal = true
	r.gait_speed = 0.45
	r.bob_height = 0.12
	var v := r.visual
	var night := Color("141c4a"); var deep := Color("232d6b"); var star := Color("dfe6ff"); var accent := Color("9fb3ff")
	var torso := K.pivot(v, Vector3(0, 4.6, 0), "Torso")
	K.add(torso, K.sphere(1.0, 22, 11), K.mat(night, 0.4, Color.BLACK, 1.0, 0.25), Vector3.ZERO, Vector3.ZERO, Vector3(1.3, 1.2, 3.2))
	K.add(torso, K.sphere(1.0, 16, 8), K.mat(deep, 0.5), Vector3(0, -0.45, -0.2), Vector3.ZERO, Vector3(1.0, 0.8, 2.6))
	var rng := RandomNumberGenerator.new()
	rng.seed = 909
	for i in 40:
		var a := rng.randf() * TAU
		var z := rng.randf_range(-2.8, 2.8)
		var rr := sqrt(maxf(0.05, 1.0 - pow(z / 3.2, 2)))
		K.add(torso, K.sphere(0.035 + rng.randf() * 0.04, 6, 3), K.glow(star, 1.8), Vector3(cos(a) * 1.3 * rr, sin(a) * 1.2 * rr, z))
	for k in 7:
		K.add(torso, K.cyl(0.0, 0.18, 0.7, 5), K.mat(accent, 0.3, accent, 0.6), Vector3(0, 1.2 - absf(k - 3) * 0.08, -2.2 + k * 0.7), Vector3(-25, 0, 0))
	var legs := []
	for p in [Vector3(-0.8, 4.1, -1.9), Vector3(0.8, 4.1, -1.9), Vector3(-0.8, 4.1, 2.0), Vector3(0.8, 4.1, 2.0)]:
		var lp := K.pivot(v, p, "Leg")
		K.add(lp, K.capsule(0.38, 2.4), K.mat(night, 0.4), Vector3(0, -1.0, 0))
		K.add(lp, K.cyl(0.2, 0.3, 1.8, 8), K.mat(deep, 0.5), Vector3(0, -2.9, 0))
		K.add(lp, K.sphere(0.12, 6, 3), K.glow(accent, 1.6), Vector3(0, -2.0, -0.32))
		for k in 3:
			K.add(lp, K.cyl(0.0, 0.08, 0.4, 4), K.mat(star, 0.3), Vector3(-0.18 + k * 0.18, -3.85, -0.35), Vector3(-75, 0, 0))
		legs.append(lp)
	var neck := MeshInstance3D.new()
	neck.mesh = K.tube(K.bezier(Vector3(0, 5.2, -2.8), Vector3(0, 8.0, -3.4), Vector3(0, 8.6, -5.4), 14), K.taper(14, 0.85, 0.4), 12)
	neck.material_override = K.mat(night, 0.4, Color.BLACK, 1.0, 0.25)
	v.add_child(neck)
	var head := K.pivot(v, Vector3(0, 8.7, -5.6), "Head")
	K.add(head, K.sphere(0.55, 16, 8), K.mat(night, 0.4), Vector3(0, 0.05, -0.2), Vector3.ZERO, Vector3(0.75, 0.6, 1.3))
	K.add(head, K.cyl(0.12, 0.35, 1.3, 10), K.mat(deep, 0.4), Vector3(0, -0.08, -1.0), Vector3(-92, 0, 0), Vector3(1, 1, 0.7))
	var eyes := []
	for sx in [-1, 1]:
		eyes.append(K.eye(head, Vector3(0.36 * sx, 0.15, -0.55), 0.12, Color("0a0f30"), Vector3(0.8 * sx, 0, -1), accent))
		K.add(head, K.capsule(0.03, 0.9), K.glow(accent, 1.8), Vector3(0.28 * sx, -0.05, -0.9), Vector3(82, 0, 0))
	var crest := K.pivot(head, Vector3(0, 0.45, 0.2), "Crest")
	var cpts := PackedVector3Array()
	for k in 13:
		var a := lerpf(-1.2, 1.2, float(k) / 12.0)
		cpts.append(Vector3(sin(a) * 1.0, cos(a) * 1.0 - 0.2, 0.3 + absf(a) * 0.4))
	var cm := MeshInstance3D.new()
	cm.mesh = K.tube(cpts, K.taper(12, 0.09, 0.09, -0.04), 7, false)
	cm.material_override = K.mat(star, 0.2, accent, 0.8)
	crest.add_child(cm)
	K.add(crest, K.sphere(0.14, 10, 5), K.glow(Color("ffffff"), 2.2), Vector3(0, 0.82, 0.3))
	var wings := []
	for sx in [-1, 1]:
		var wp := K.pivot(torso, Vector3(0.9 * sx, 0.9, -1.0), "Wing", Vector3(0, 0, 14 * sx))
		for layer in 3:
			var span := 11.0 - layer * 2.6
			var back := layer * 1.4
			var arm_end := Vector3(span * 0.42 * sx, 2.0 - layer * 0.5, 0.4 + back)
			var arm := MeshInstance3D.new()
			arm.mesh = K.tube(K.bezier(Vector3(0, -layer * 0.3, back), Vector3(span * 0.2 * sx, 1.6 - layer * 0.4, back - 0.2), arm_end, 8), K.taper(8, 0.22 - layer * 0.05, 0.08), 6)
			arm.material_override = K.mat(night, 0.4)
			wp.add_child(arm)
			var tips := PackedVector3Array([Vector3(0, -layer * 0.3, back + 1.2), arm_end])
			for f in 3:
				var t := float(f) / 2.0
				tips.append(arm_end + Vector3(span * (0.6 - 0.2 * t) * sx, -0.8 - t * 2.4, 0.8 + t * 3.0))
			var mem := MeshInstance3D.new()
			mem.mesh = _membrane(tips, deep.lerp(night, 0.5), accent.lerp(Color("c9b6ff"), layer * 0.3))
			mem.material_override = K.vcol(0.4, true)
			mem.transparency = 0.15 + layer * 0.15
			wp.add_child(mem)
			for k in 6:
				var tp: Vector3 = tips[2 + (k % 3)].lerp(arm_end, rng.randf_range(0.2, 0.8))
				K.add(wp, K.sphere(0.06, 6, 3), K.glow(star, 2.0), tp)
		wings.append(wp)
	var tail := K.pivot(v, Vector3(0, 4.6, 3.1), "Tail")
	for i in 3:
		var off := (i - 1) * 0.5
		var tm := MeshInstance3D.new()
		tm.mesh = K.tube(K.bezier(Vector3(off * 0.3, 0, 0), Vector3(off, -0.8, 4.0), Vector3(off * 2.4, -0.4 + i * 0.3, 8.0 + absf(off) * 2.0), 16), K.taper(16, 0.4 if i == 1 else 0.25, 0.04), 8)
		tm.material_override = K.mat(night if i == 1 else deep, 0.4, accent if i != 1 else Color.BLACK, 0.3)
		tail.add_child(tm)
		K.add(tail, K.sphere(0.12, 8, 4), K.glow(star, 2.0), Vector3(off * 2.4, -0.4 + i * 0.3, 8.0 + absf(off) * 2.0))
	var dust := FX.motes(star, 30, Vector3(6.0, 2.0, 4.0), 0.05)
	dust.position = Vector3(0, 6.0, 0)
	v.add_child(dust)
	r.reg("head", head); r.reg("eyes", eyes); r.reg("legs", legs); r.reg("tail", tail); r.reg("wings", wings)
	r.reg("sway", [crest]); r.reg("feet", legs)
	r.reg("acc_head", K.pivot(head, Vector3(0, 0.6, 0))); r.reg("acc_neck", K.pivot(v, Vector3(0, 7.0, -3.8)))
	r.reg("saddle", K.pivot(torso, Vector3(0, 1.25, -0.9)))
	return r

# ===================================================================== CINDERCUB (Emberfall)
static func _cindercub(_variant: String) -> CreatureRig:
	## Chunky charcoal bear cub with a glowing ember heart in its chest.
	var r := _rig("quad")
	r.bob_height = 0.04
	var v := r.visual
	var fur := Color("2b2624"); var fur_l := Color("4a3f3a"); var ember := Color("ff8a3a"); var plate := Color("5a4a40")
	K.add(v, K.sphere(0.3, 18, 9), K.mat(fur, 0.95), Vector3(0, 0.36, 0.04), Vector3.ZERO, Vector3(1.0, 0.9, 1.15))
	K.add(v, K.sphere(0.2, 14, 7), K.mat(fur_l), Vector3(0, 0.32, -0.22), Vector3.ZERO, Vector3(1.0, 1.0, 0.6))
	K.add(v, K.sphere(0.1, 10, 5), K.glow(ember, 2.0), Vector3(0, 0.36, -0.31), Vector3.ZERO, Vector3(1.0, 1.1, 0.5))
	for k in 4:
		K.add(v, K.box(Vector3(0.025, 0.14, 0.02)), K.glow(ember.lightened(0.2), 1.8), Vector3(-0.07 + k * 0.045, 0.37 + (k % 2) * 0.03, -0.33), Vector3(0, 0, -30 + k * 20))
	for sx in [-1, 1]:
		K.add(v, K.sphere(0.12, 6, 3), K.flat(plate), Vector3(0.22 * sx, 0.5, -0.1), Vector3(0, 0, 20 * sx), Vector3(1.2, 0.6, 1.1))
	var head := K.pivot(v, Vector3(0, 0.6, -0.28), "Head")
	K.add(head, K.sphere(0.19, 18, 9), K.mat(fur), Vector3.ZERO, Vector3.ZERO, Vector3(1.05, 0.95, 0.95))
	K.add(head, K.sphere(0.09, 12, 6), K.mat(Color("8a6a5a")), Vector3(0, -0.06, -0.15), Vector3.ZERO, Vector3(1.2, 0.8, 0.9))
	K.add(head, K.sphere(0.035, 8, 4), K.mat(Color("1a1414"), 0.3), Vector3(0, -0.03, -0.24))
	var eyes := [K.eye(head, Vector3(-0.08, 0.04, -0.15), 0.035, Color("3a1a08"), Vector3(-0.3, 0, -1), ember), K.eye(head, Vector3(0.08, 0.04, -0.15), 0.035, Color("3a1a08"), Vector3(0.3, 0, -1), ember)]
	var ears := []
	for sx in [-1, 1]:
		var ep := K.pivot(head, Vector3(0.13 * sx, 0.14, 0.02), "Ear")
		K.add(ep, K.sphere(0.07, 10, 5), K.mat(fur), Vector3.ZERO, Vector3.ZERO, Vector3(1, 1, 0.6))
		K.add(ep, K.sphere(0.04, 8, 4), K.glow(ember, 1.2), Vector3(0, 0, -0.03), Vector3.ZERO, Vector3(1, 1, 0.4))
		ears.append(ep)
	var smoke := FX.motes(Color(0.5, 0.48, 0.46), 6, Vector3(0.12, 0.05, 0.05), 0.04)
	smoke.position = Vector3(0, 0.22, 0)
	smoke.gravity = Vector3(0, 0.4, 0)
	head.add_child(smoke)
	var legs := []
	for p in [Vector3(-0.15, 0.2, -0.15), Vector3(0.15, 0.2, -0.15), Vector3(-0.15, 0.2, 0.2), Vector3(0.15, 0.2, 0.2)]:
		var lp := K.pivot(v, p)
		K.add(lp, K.capsule(0.08, 0.24), K.mat(fur), Vector3(0, -0.1, 0))
		K.add(lp, K.sphere(0.07, 8, 4), K.mat(fur_l), Vector3(0, -0.2, -0.02), Vector3.ZERO, Vector3(1, 0.6, 1.2))
		legs.append(lp)
	var tail := K.pivot(v, Vector3(0, 0.38, 0.36), "Tail")
	K.add(tail, K.sphere(0.06, 8, 4), K.glow(ember, 1.6))
	r.reg("head", head); r.reg("eyes", eyes); r.reg("ear_l", ears[0]); r.reg("ear_r", ears[1]); r.reg("legs", legs); r.reg("tail", tail)
	r.reg("acc_head", K.pivot(head, Vector3(0, 0.2, 0))); r.reg("acc_neck", K.pivot(v, Vector3(0, 0.5, -0.24)))
	return r

# ===================================================================== CINDERMAW (Awakened Form of Cindercub)
static func _cindermaw(_variant: String) -> CreatureRig:
	## Cindercub grown into a low, broad, heavy-shouldered forager. Basalt plates
	## have formed over its charcoal hide with glowing seams between them; its
	## lower jaw is a wide armoured "maw" lit from inside; its ember heart now
	## shows through a cage of plates on its chest. No wings, no horns: it is a
	## ground animal, deliberately unlike Ignaroth.
	var r := _rig("quad")
	r.gait_speed = 0.7
	r.bob_height = 0.06
	var v := r.visual
	var hide := Color("2b2624"); var hide_l := Color("4a3f3a"); var basalt := Color("3a3330"); var basalt_l := Color("5a4f48")
	var ember := Color("ff8a3a"); var magma := Color("ff5a1a")
	var torso := K.pivot(v, Vector3(0, 0.95, 0), "Torso")
	K.add(torso, K.sphere(0.62, 22, 11), K.mat(hide, 0.95), Vector3(0, 0.08, -0.35), Vector3(8, 0, 0), Vector3(1.15, 0.95, 1.0))
	K.add(torso, K.sphere(0.52, 20, 10), K.mat(hide, 0.95), Vector3(0, 0.0, 0.35), Vector3.ZERO, Vector3(1.0, 0.85, 1.05))
	K.add(torso, K.sphere(0.4, 16, 8), K.mat(hide_l), Vector3(0, -0.25, -0.2), Vector3.ZERO, Vector3(1.0, 0.6, 1.6))
	# Basalt plates over the back (ridged like cooled lava), magma glowing in the seams.
	for i in 7:
		var z := -0.78 + i * 0.22
		var top := 0.66 - clampf(z + 0.35, 0.0, 1.0) * 0.3
		var w := 0.62 - absf(z + 0.1) * 0.3
		K.add(torso, K.prism(Vector3(w, 0.2, 0.26)), K.flat(basalt if i % 2 else basalt_l), Vector3(0, top + 0.02, z), Vector3(-10, 0, 0))
		K.add(torso, K.sphere(0.5, 10, 5), K.glow(magma, 1.8), Vector3(0, top - 0.02, z + 0.13), Vector3.ZERO, Vector3(w * 1.6, 0.06, 0.07))
		for sx in [-1, 1]:
			K.add(torso, K.prism(Vector3(0.26, 0.14, 0.24)), K.flat(basalt), Vector3((w * 0.55 + 0.12) * sx, top - 0.2, z), Vector3(0, 0, -50 * sx))
	# Chest cage: ember heart glowing between vertical plates.
	K.add(torso, K.sphere(0.22, 14, 7), K.glow(ember, 2.4), Vector3(0, 0.0, -0.9), Vector3.ZERO, Vector3(1.0, 1.1, 0.6))
	for k in 5:
		K.add(torso, K.box(Vector3(0.07, 0.42, 0.06)), K.flat(basalt_l), Vector3(-0.2 + k * 0.1, 0.0, -0.98), Vector3(0, 0, -16 + k * 8))
	var glow := OmniLight3D.new()
	glow.light_color = ember
	glow.omni_range = 4.0
	glow.light_energy = 0.8
	glow.position = Vector3(0, 0, -1.2)
	torso.add_child(glow)
	# Head: low and wide; the armoured jaw is the widest part.
	var head := K.pivot(v, Vector3(0, 1.05, -1.25), "Head")
	K.add(head, K.sphere(0.36, 18, 9), K.mat(hide, 0.95), Vector3(0, 0.08, 0.05), Vector3.ZERO, Vector3(1.15, 0.85, 1.0))
	# The "maw": a wide plated lower jaw with a magma glow along the lip.
	K.add(head, K.sphere(0.3, 14, 7), K.flat(basalt), Vector3(0, -0.15, -0.22), Vector3(8, 0, 0), Vector3(1.15, 0.45, 1.0))
	K.add(head, K.sphere(0.3, 14, 7), K.glow(magma, 2.0), Vector3(0, -0.07, -0.24), Vector3(8, 0, 0), Vector3(1.05, 0.12, 0.92))
	K.add(head, K.sphere(0.26, 14, 7), K.mat(hide_l), Vector3(0, 0.04, -0.26), Vector3(-6, 0, 0), Vector3(1.0, 0.4, 0.95))
	for k in 4:
		K.add(head, K.prism(Vector3(0.07, 0.08, 0.05)), K.flat(Color("e8d8c8")), Vector3(-0.15 + k * 0.1, -0.04, -0.45), Vector3(180, 0, 0))
	K.add(head, K.sphere(0.05, 8, 4), K.mat(Color("1a1414"), 0.3), Vector3(0, 0.12, -0.44))
	var eyes := []
	for sx in [-1, 1]:
		eyes.append(K.eye(head, Vector3(0.18 * sx, 0.2, -0.2), 0.05, Color("3a1a08"), Vector3(0.4 * sx, 0, -1), ember))
		K.add(head, K.box(Vector3(0.16, 0.05, 0.1)), K.flat(basalt), Vector3(0.18 * sx, 0.27, -0.2), Vector3(0, 0, -12 * sx))
	var ears := []
	for sx in [-1, 1]:
		var ep := K.pivot(head, Vector3(0.26 * sx, 0.34, 0.12), "Ear")
		K.add(ep, K.sphere(0.12, 10, 5), K.mat(hide), Vector3.ZERO, Vector3.ZERO, Vector3(1, 1, 0.55))
		K.add(ep, K.torus(0.07, 0.1, 14), K.glow(ember, 1.4), Vector3(0, 0, -0.04), Vector3(90, 0, 0), Vector3(1, 0.5, 1))
		ears.append(ep)
	var smoke := FX.motes(Color(0.5, 0.48, 0.46), 10, Vector3(0.3, 0.1, 0.1), 0.06)
	smoke.position = Vector3(0, 0.45, 0.1)
	smoke.gravity = Vector3(0, 0.5, 0)
	head.add_child(smoke)
	# Thick legs with plated forearms and wide, blunt digging claws.
	var legs := []
	for p in [Vector3(-0.42, 0.8, -0.6), Vector3(0.42, 0.8, -0.6), Vector3(-0.4, 0.78, 0.5), Vector3(0.4, 0.78, 0.5)]:
		var lp := K.pivot(v, p, "Leg")
		K.add(lp, K.capsule(0.19, 0.7), K.mat(hide), Vector3(0, -0.3, 0))
		K.add(lp, K.box(Vector3(0.3, 0.32, 0.3)), K.flat(basalt), Vector3(0, -0.45, -0.04), Vector3(6, 0, 0))
		K.add(lp, K.box(Vector3(0.26, 0.03, 0.03)), K.glow(magma, 1.6), Vector3(0, -0.3, -0.19))
		K.add(lp, K.sphere(0.18, 10, 5), K.mat(hide_l), Vector3(0, -0.72, -0.06), Vector3.ZERO, Vector3(1.1, 0.5, 1.3))
		for k in 3:
			K.add(lp, K.prism(Vector3(0.06, 0.12, 0.06)), K.flat(Color("1a1616")), Vector3(-0.08 + k * 0.08, -0.76, -0.24), Vector3(-90, 0, 0))
		legs.append(lp)
	# Short heavy tail ending in a cluster of glowing coals.
	var tail := K.pivot(v, Vector3(0, 1.0, 0.85), "Tail", Vector3(-25, 0, 0))
	K.add(tail, K.capsule(0.13, 0.5), K.mat(hide), Vector3(0, 0, 0.2), Vector3(80, 0, 0))
	for k in 5:
		K.add(tail, K.sphere(0.08, 6, 3), K.flat(basalt) if k % 2 else K.glow(ember, 1.8), Vector3(cos(k * 1.3) * 0.08, sin(k * 1.3) * 0.08, 0.45))
	r.reg("head", head); r.reg("eyes", eyes); r.reg("ear_l", ears[0]); r.reg("ear_r", ears[1]); r.reg("legs", legs); r.reg("tail", tail)
	r.reg("acc_head", K.pivot(head, Vector3(0, 0.38, 0))); r.reg("acc_neck", K.pivot(v, Vector3(0, 1.1, -0.9)))
	r.reg("saddle", K.pivot(v, Vector3(0, 1.62, -0.05)))
	return r

# ===================================================================== MAGMOLE (Emberfall)
static func _magmole(_variant: String) -> CreatureRig:
	## Burrower in volcanic-glass armour with huge glowing digging claws.
	var r := _rig("waddle")
	r.gait_speed = 0.9
	var v := r.visual
	var body_c := Color("3a2c28"); var glass := Color("1e1a1e"); var ember := Color("ff6a1f"); var belly := Color("6b5a50")
	K.add(v, K.sphere(0.32, 16, 8), K.mat(body_c, 0.9), Vector3(0, 0.32, 0.05), Vector3.ZERO, Vector3(1.0, 0.8, 1.3))
	K.add(v, K.sphere(0.25, 12, 6), K.mat(belly), Vector3(0, 0.25, -0.05), Vector3.ZERO, Vector3(0.9, 0.6, 1.1))
	for k in 5:
		var z := -0.15 + k * 0.12
		var pl := K.add(v, K.sphere(0.2, 6, 3), K.mat(glass, 0.15, Color.BLACK, 1.0, 0.4), Vector3(0, 0.55 - absf(z - 0.1) * 0.3, z), Vector3(-15 + k * 10, 0, 0), Vector3(1.3, 0.3, 0.75))
		K.add(pl, K.box(Vector3(0.3, 0.03, 0.03)), K.glow(ember, 1.6), Vector3(0, 0.12, 0.14))
	var head := K.pivot(v, Vector3(0, 0.35, -0.38), "Head")
	K.add(head, K.sphere(0.17, 14, 7), K.mat(body_c), Vector3.ZERO, Vector3.ZERO, Vector3(0.95, 0.85, 1.1))
	K.add(head, K.cyl(0.03, 0.09, 0.2, 10), K.mat(Color("d88a7a")), Vector3(0, -0.03, -0.2), Vector3(-90, 0, 0))
	K.add(head, K.sphere(0.04, 8, 4), K.mat(Color("e86a6a"), 0.4), Vector3(0, -0.03, -0.31))
	var eyes := []
	for sx in [-1, 1]:
		var e := K.eye(head, Vector3(0.08 * sx, 0.06, -0.12), 0.022, Color("1a1414"), Vector3(0.4 * sx, 0, -1))
		eyes.append(e)
		K.add(head, K.torus(0.025, 0.04, 12), K.mat(glass, 0.15, Color.BLACK, 1, 0.5), Vector3(0.08 * sx, 0.06, -0.13), Vector3(80, 0, 0))
	var legs := []
	for sx in [-1, 1]:
		var arm := K.pivot(v, Vector3(0.24 * sx, 0.3, -0.25), "Claw", Vector3(-20, 0, 30 * sx))
		K.add(arm, K.capsule(0.07, 0.22), K.mat(body_c), Vector3(0, -0.08, 0))
		K.add(arm, K.sphere(0.1, 10, 5), K.mat(belly), Vector3(0, -0.2, -0.05), Vector3.ZERO, Vector3(1.4, 0.6, 1.0))
		for k in 3:
			K.add(arm, K.cyl(0.0, 0.03, 0.16, 5), K.mat(glass, 0.2), Vector3(-0.06 + k * 0.06, -0.24, -0.14), Vector3(-80, 0, 0))
			K.add(arm, K.sphere(0.015, 4, 2), K.glow(ember, 2.0), Vector3(-0.06 + k * 0.06, -0.25, -0.22))
		legs.append(arm)
	for sx in [-1, 1]:
		var lp := K.pivot(v, Vector3(0.16 * sx, 0.16, 0.3))
		K.add(lp, K.sphere(0.08, 8, 4), K.mat(body_c), Vector3(0, -0.08, 0), Vector3.ZERO, Vector3(1, 0.7, 1.3))
		legs.append(lp)
	var tail := K.pivot(v, Vector3(0, 0.25, 0.48), "Tail")
	K.add(tail, K.cyl(0.01, 0.03, 0.16, 6), K.mat(Color("d88a7a")), Vector3(0, 0, 0.08), Vector3(80, 0, 0))
	r.reg("head", head); r.reg("eyes", eyes); r.reg("legs", legs); r.reg("tail", tail)
	r.reg("acc_head", K.pivot(head, Vector3(0, 0.14, 0))); r.reg("acc_neck", K.pivot(v, Vector3(0, 0.4, -0.3)))
	return r

# ===================================================================== ASHWING (Emberfall)
static func _ashwing(_variant: String) -> CreatureRig:
	## Round little flyer: ash-grey feathers with ember tips, two smoke-ribbon tail feathers.
	var r := _rig("fly")
	r.hover_height = 0.9
	var v := r.visual
	var ash := Color("6b6461"); var ash_l := Color("a8a09a"); var ember := Color("f2a14a"); var dark := Color("2b2624")
	K.add(v, K.sphere(0.2, 16, 8), K.mat(ash, 0.95), Vector3(0, 0.3, 0.02), Vector3.ZERO, Vector3(1.0, 0.95, 1.1))
	K.add(v, K.sphere(0.15, 12, 6), K.mat(ash_l), Vector3(0, 0.26, -0.1), Vector3.ZERO, Vector3(0.9, 0.9, 0.6))
	var head := K.pivot(v, Vector3(0, 0.46, -0.08), "Head")
	K.add(head, K.sphere(0.14, 14, 7), K.mat(ash), Vector3.ZERO)
	K.add(head, K.sphere(0.1, 12, 6), K.mat(ash_l), Vector3(0, -0.01, -0.07), Vector3.ZERO, Vector3(1.2, 1.0, 0.6))
	K.add(head, K.cyl(0.0, 0.03, 0.08, 6), K.mat(ember.darkened(0.2)), Vector3(0, -0.03, -0.15), Vector3(-100, 0, 0))
	var eyes := [K.eye(head, Vector3(-0.055, 0.02, -0.12), 0.032, Color("2a1a08"), Vector3(-0.3, 0, -1), ember), K.eye(head, Vector3(0.055, 0.02, -0.12), 0.032, Color("2a1a08"), Vector3(0.3, 0, -1), ember)]
	var crest := K.pivot(head, Vector3(0, 0.12, 0.02), "Crest")
	for k in 3:
		K.add(crest, K.petal(0.12 - k * 0.02, 0.05, 0.08), K.mat(ember if k == 1 else ash_l), Vector3.ZERO, Vector3(-20, 0, -25 + k * 25))
	var wings := []
	for sx in [-1, 1]:
		var wp := K.pivot(v, Vector3(0.17 * sx, 0.36, 0.02), "Wing", Vector3(0, 0, -40 * sx))
		for k in 4:
			K.add(wp, K.petal(0.32 - k * 0.04, 0.1, 0.08, 0.012), K.mat(ash.lerp(ember, k * 0.25)), Vector3(0, 0, 0.04 * k), Vector3(10 + k * 12, 0, 0))
		wings.append(wp)
	var tail := K.pivot(v, Vector3(0, 0.27, 0.2), "Tail")
	for sx in [-1, 1]:
		var rib := MeshInstance3D.new()
		rib.mesh = K.tube(K.bezier(Vector3.ZERO, Vector3(0.05 * sx, -0.05, 0.25), Vector3(0.12 * sx, 0.05, 0.5), 8), K.taper(8, 0.025, 0.006), 5)
		rib.material_override = K.mat(dark)
		tail.add_child(rib)
		K.add(tail, K.sphere(0.03, 6, 3), K.glow(ember, 1.8), Vector3(0.12 * sx, 0.05, 0.5))
	var feet := []
	for sx in [-1, 1]:
		var fp := K.pivot(v, Vector3(0.06 * sx, 0.12, 0))
		K.add(fp, K.cyl(0.01, 0.015, 0.1, 4), K.mat(dark), Vector3(0, -0.05, 0))
		feet.append(fp)
	r.reg("head", head); r.reg("eyes", eyes); r.reg("wings", wings); r.reg("tail", tail); r.reg("legs", feet); r.reg("sway", [crest])
	r.reg("acc_head", K.pivot(head, Vector3(0, 0.13, 0))); r.reg("acc_neck", K.pivot(v, Vector3(0, 0.4, -0.1)))
	return r

# ===================================================================== THISTLEPIN (Cloverling alternate)
static func _thistlepin(_variant: String) -> CreatureRig:
	var r := _rig("hop")
	var v := r.visual
	var purple := Color("6a3a8a"); var fluff := Color("e8d8f0"); var leaf := Color("4fa35a")
	K.add(v, K.sphere(0.28, 16, 8), K.mat(purple.lightened(0.15), 0.9), Vector3(0, 0.34, 0))
	var rng := RandomNumberGenerator.new()
	rng.seed = 61
	for i in 40:
		var dir := Vector3(rng.randf_range(-1, 1), rng.randf_range(-0.2, 1), rng.randf_range(-1, 1)).normalized()
		if dir.z < -0.55 and dir.y < 0.5:
			continue  # keep the face clear
		var sp := K.add(v, K.cyl(0.0, 0.025, 0.16, 4), K.mat(purple.darkened(0.2), 0.6), Vector3(0, 0.34, 0) + dir * 0.3)
		sp.basis = Basis.looking_at(dir, Vector3.UP if absf(dir.y) < 0.95 else Vector3.RIGHT) * Basis.from_euler(Vector3(-PI / 2, 0, 0))
	K.add(v, K.sphere(0.14, 10, 5), K.mat(fluff), Vector3(0, 0.62, 0.02), Vector3.ZERO, Vector3(1.2, 0.8, 1.2))
	var head := K.pivot(v, Vector3(0, 0.36, -0.2), "Head")
	K.add(head, K.sphere(0.13, 12, 6), K.mat(fluff), Vector3(0, 0, -0.02), Vector3.ZERO, Vector3(1.2, 0.95, 0.6))
	var eyes := [K.eye(head, Vector3(-0.05, 0.02, -0.08), 0.032), K.eye(head, Vector3(0.05, 0.02, -0.08), 0.032)]
	for e in eyes:
		e.scale = Vector3(1, 0.75, 1)
	K.add(head, K.box(Vector3(0.12, 0.02, 0.02)), K.mat(purple.darkened(0.3)), Vector3(0, 0.08, -0.09), Vector3(0, 0, 0))
	var cape := K.pivot(v, Vector3(0, 0.5, 0.15), "Cape", Vector3(110, 0, 0))
	K.add(cape, K.petal(0.5, 0.4, 0.25, 0.03), K.mat(leaf, 0.8))
	var legs := []
	for sx in [-1, 1]:
		var lp := K.pivot(v, Vector3(0.1 * sx, 0.08, 0))
		K.add(lp, K.capsule(0.04, 0.12), K.mat(leaf.darkened(0.3)), Vector3(0, -0.03, 0))
		legs.append(lp)
	r.reg("head", head); r.reg("eyes", eyes); r.reg("legs", legs); r.reg("tail", cape)
	r.reg("acc_head", K.pivot(v, Vector3(0, 0.7, 0))); r.reg("acc_neck", K.pivot(v, Vector3(0, 0.25, -0.2)))
	return r

# ===================================================================== GEODRIFT (Pebblit alternate)
static func _geodrift(_variant: String) -> CreatureRig:
	var r := _rig("float")
	r.hover_height = 0.35
	var v := r.visual
	var shell := Color("5a4d6b"); var amethyst := Color("c49af0"); var rune := Color("f28fe0")
	var core := K.pivot(v, Vector3(0, 0.5, 0), "Core")
	for sx in [-1, 1]:
		var half := K.pivot(core, Vector3(0.06 * sx, 0, 0), "Half", Vector3(0, -35 * sx, -10 * sx))
		K.add(half, K.sphere(0.3, 9, 5), K.flat(shell), Vector3(0.1 * sx, 0, 0), Vector3.ZERO, Vector3(0.55, 1.0, 1.0))
		for k in 8:
			var a := k * TAU / 8.0
			K.add(half, K.cyl(0.0, 0.05, 0.16, 5), K.mat(amethyst, 0.2, amethyst, 0.6), Vector3(-0.02 * sx, sin(a) * 0.18, cos(a) * 0.18), Vector3(0, 0, 90 * sx))
	K.add(core, K.sphere(0.12, 12, 6), K.glow(amethyst.lightened(0.3), 1.8))
	var head := K.pivot(core, Vector3(0, 0.02, -0.1), "Head")
	var eyes := [K.eye(head, Vector3(-0.045, 0.02, -0.06), 0.028, Color("2a1a3a"), Vector3(0, 0, -1), rune), K.eye(head, Vector3(0.045, 0.02, -0.06), 0.028, Color("2a1a3a"), Vector3(0, 0, -1), rune)]
	var ring := K.pivot(v, Vector3(0, 0.5, 0), "Orbit")
	for k in 7:
		var a := k * TAU / 7.0
		var pb := K.add(ring, K.sphere(0.05, 6, 3), K.flat(Color("8f979c")), Vector3(cos(a) * 0.48, sin(a * 2.0) * 0.04, sin(a) * 0.48))
		K.add(pb, K.box(Vector3(0.05, 0.01, 0.01)), K.glow(rune, 1.8), Vector3(0, 0.05, 0))
	r.reg("head", head); r.reg("eyes", eyes); r.reg("orbit", ring); r.reg("sway", [core])
	r.reg("acc_head", K.pivot(v, Vector3(0, 0.85, 0))); r.reg("acc_neck", K.pivot(v, Vector3(0, 0.3, -0.1)))
	return r

# ===================================================================== LANTERNWHISK (Sunfox alternate)
static func _lanternwhisk(_variant: String) -> CreatureRig:
	var r := _rig("hop")
	r.bob_height = 0.04
	var v := r.visual
	var fur := Color("e9a23b"); var cream := Color("fff1c2"); var glow_c := Color("ffd27a")
	K.add(v, K.capsule(0.15, 0.42), K.mat(fur), Vector3(0, 0.32, 0))
	K.add(v, K.capsule(0.11, 0.3), K.mat(cream), Vector3(0, 0.3, -0.06), Vector3.ZERO, Vector3(1, 1, 0.7))
	var head := K.pivot(v, Vector3(0, 0.6, -0.02), "Head")
	K.add(head, K.sphere(0.14, 16, 8), K.mat(fur))
	K.add(head, K.sphere(0.07, 10, 5), K.mat(cream), Vector3(0, -0.04, -0.11), Vector3.ZERO, Vector3(1.2, 0.8, 0.9))
	K.add(head, K.sphere(0.02, 6, 3), K.mat(Color("2a1a14")), Vector3(0, -0.02, -0.18))
	var eyes := [K.eye(head, Vector3(-0.055, 0.03, -0.11), 0.03, Color("3a1d0e")), K.eye(head, Vector3(0.055, 0.03, -0.11), 0.03, Color("3a1d0e"))]
	var ears := []
	for sx in [-1, 1]:
		var ep := K.pivot(head, Vector3(0.09 * sx, 0.1, 0.0), "Ear", Vector3(0, 0, -20 * sx))
		K.add(ep, K.petal(0.11, 0.08, 0.05), K.mat(fur))
		ears.append(ep)
	var arms := []
	for sx in [-1, 1]:
		var ap := K.pivot(v, Vector3(0.12 * sx, 0.42, -0.04), "Arm", Vector3(-30, 0, 20 * sx))
		K.add(ap, K.capsule(0.04, 0.16), K.mat(fur), Vector3(0, -0.06, 0))
		K.add(ap, K.sphere(0.04, 6, 3), K.mat(Color.WHITE), Vector3(0, -0.13, 0))
		arms.append(ap)
	var tail := K.pivot(v, Vector3(0, 0.25, 0.14), "Tail")
	var tm := MeshInstance3D.new()
	tm.mesh = K.tube(K.bezier(Vector3.ZERO, Vector3(0, 0.55, 0.3), Vector3(0, 0.82, -0.05), 12), K.taper(12, 0.06, 0.03, 0.03), 8)
	tm.material_override = K.mat(fur)
	tail.add_child(tm)
	var lantern := K.pivot(tail, Vector3(0, 0.74, -0.12))
	K.add(lantern, K.cyl(0.06, 0.06, 0.02, 10), K.mat(Color("6b4a32")), Vector3(0, 0.05, 0))
	K.add(lantern, K.cyl(0.055, 0.055, 0.1, 10), K.glass(Color("fff8e0"), 0.4), Vector3(0, -0.02, 0))
	K.add(lantern, K.sphere(0.03, 8, 4), K.glow(glow_c, 2.2), Vector3(0, -0.02, 0))
	K.add(lantern, K.cyl(0.07, 0.05, 0.03, 10), K.mat(Color("6b4a32")), Vector3(0, -0.085, 0))
	var l := OmniLight3D.new()
	l.light_color = glow_c
	l.omni_range = 3.0
	l.light_energy = 0.8
	lantern.add_child(l)
	var legs := []
	for sx in [-1, 1]:
		var lp := K.pivot(v, Vector3(0.07 * sx, 0.12, 0))
		K.add(lp, K.capsule(0.045, 0.14), K.mat(fur.darkened(0.1)), Vector3(0, -0.05, 0))
		legs.append(lp)
	r.reg("head", head); r.reg("eyes", eyes); r.reg("ear_l", ears[0]); r.reg("ear_r", ears[1]); r.reg("legs", legs); r.reg("sway", [lantern] + arms)
	r.reg("acc_head", K.pivot(head, Vector3(0, 0.14, 0))); r.reg("acc_neck", K.pivot(v, Vector3(0, 0.5, -0.06)))
	return r

# ===================================================================== DRIZZLEFIN (Dewdrop alternate)
static func _drizzlefin(_variant: String) -> CreatureRig:
	var r := _rig("fly")
	r.hover_height = 0.8
	var v := r.visual
	var scale_c := Color("5fb7e0"); var fin := Color("dff4ff"); var dark := Color("2f6f9a")
	K.add(v, K.sphere(0.2, 16, 8), K.mat(scale_c, 0.25, Color.BLACK, 1.0, 0.3), Vector3(0, 0.3, 0), Vector3.ZERO, Vector3(0.75, 0.85, 1.4))
	K.add(v, K.sphere(0.16, 12, 6), K.mat(fin), Vector3(0, 0.25, -0.03), Vector3.ZERO, Vector3(0.6, 0.6, 1.2))
	for k in 6:
		K.add(v, K.sphere(0.03, 6, 3), K.mat(dark), Vector3(0.12, 0.34, -0.15 + k * 0.06), Vector3.ZERO, Vector3(0.4, 1, 1))
		K.add(v, K.sphere(0.03, 6, 3), K.mat(dark), Vector3(-0.12, 0.34, -0.15 + k * 0.06), Vector3.ZERO, Vector3(0.4, 1, 1))
	var head := K.pivot(v, Vector3(0, 0.32, -0.22), "Head")
	var eyes := [K.eye(head, Vector3(-0.09, 0.03, -0.05), 0.04, Color("0f2030"), Vector3(-0.8, 0, -0.6)), K.eye(head, Vector3(0.09, 0.03, -0.05), 0.04, Color("0f2030"), Vector3(0.8, 0, -0.6))]
	K.add(head, K.torus(0.015, 0.025, 10), K.mat(dark), Vector3(0, -0.04, -0.07), Vector3(80, 0, 0), Vector3(1, 1, 0.5))
	var wings := []
	for sx in [-1, 1]:
		var wp := K.pivot(v, Vector3(0.14 * sx, 0.32, -0.05), "Fin", Vector3(0, 0, -70 * sx))
		K.add(wp, K.petal(0.34, 0.24, 0.1, 0.012), K.glass(fin, 0.45, scale_c))
		wings.append(wp)
	K.add(v, K.petal(0.14, 0.1, 0.05, 0.01), K.glass(fin, 0.5), Vector3(0, 0.48, 0.05), Vector3(-20, 0, 0))
	var tail := K.pivot(v, Vector3(0, 0.3, 0.26), "Tail")
	for sx in [-1, 1]:
		K.add(tail, K.petal(0.28, 0.18, 0.12, 0.012), K.glass(fin, 0.5, scale_c), Vector3.ZERO, Vector3(90, 0, 35 * sx))
	var mist := FX.motes(fin, 10, Vector3(0.1, 0.1, 0.3), 0.03)
	mist.position = Vector3(0, 0.3, 0.45)
	v.add_child(mist)
	r.reg("head", head); r.reg("eyes", eyes); r.reg("wings", wings); r.reg("tail", tail)
	r.reg("acc_head", K.pivot(v, Vector3(0, 0.5, -0.1))); r.reg("acc_neck", K.pivot(v, Vector3(0, 0.3, -0.25)))
	return r

# ===================================================================== THORNMANE (Bloomtail alternate, Large)
static func _thornmane(_variant: String) -> CreatureRig:
	var r := _rig("quad")
	r.gait_speed = 0.7
	r.bob_height = 0.05
	var v := r.visual
	var fur := Color("8a5a4a"); var bark := Color("4a3426"); var rose := Color("b8456a"); var leaf := Color("5fa857")
	K.add(v, K.sphere(1.0, 18, 9), K.mat(fur), Vector3(0, 1.3, 0.1), Vector3.ZERO, Vector3(0.7, 0.65, 1.2))
	for sx in [-1, 1]:
		K.add(v, K.sphere(0.45, 7, 4), K.flat(bark), Vector3(0.55 * sx, 1.55, -0.55), Vector3(0, 0, -30 * sx), Vector3(1.0, 0.6, 1.1))
		K.add(v, K.sphere(0.35, 7, 4), K.flat(bark), Vector3(0.5 * sx, 1.5, 0.55), Vector3(0, 0, -25 * sx), Vector3(1.0, 0.6, 1.0))
	var head := K.pivot(v, Vector3(0, 1.75, -1.2), "Head")
	K.add(head, K.sphere(0.32, 16, 8), K.mat(fur), Vector3.ZERO, Vector3.ZERO, Vector3(0.9, 0.9, 1.15))
	K.add(head, K.sphere(0.16, 12, 6), K.mat(fur.lightened(0.2)), Vector3(0, -0.1, -0.3), Vector3.ZERO, Vector3(1.1, 0.8, 1.0))
	K.add(head, K.sphere(0.05, 8, 4), K.mat(Color("2a1a14")), Vector3(0, -0.06, -0.45))
	var eyes := [K.eye(head, Vector3(-0.15, 0.07, -0.24), 0.05, Color("1a2a10"), Vector3(-0.5, 0, -1), Color("9adf6a")), K.eye(head, Vector3(0.15, 0.07, -0.24), 0.05, Color("1a2a10"), Vector3(0.5, 0, -1), Color("9adf6a"))]
	var mane := K.pivot(head, Vector3(0, 0.1, 0.2), "Mane")
	var rng := RandomNumberGenerator.new()
	rng.seed = 77
	for i in 22:
		var a := rng.randf_range(-1.6, 1.6)
		var e := rng.randf_range(-0.2, 1.1)
		var p := Vector3(sin(a) * 0.38, e * 0.35, cos(a) * 0.2 + 0.1)
		if i % 3 == 0:
			K.add(mane, K.sphere(0.07, 8, 4), K.mat(rose, 0.6), p, Vector3.ZERO, Vector3(1, 0.7, 1))
		elif i % 3 == 1:
			K.add(mane, K.cyl(0.0, 0.03, 0.16, 4), K.mat(bark.lightened(0.2)), p, Vector3(rng.randf_range(-60, 60), 0, rng.randf_range(-60, 60)))
		else:
			K.add(mane, K.petal(0.16, 0.08, 0.05), K.mat(leaf), p, Vector3(rng.randf_range(-80, 0), rng.randf() * 360, 0))
	var ears := []
	for sx in [-1, 1]:
		var ep := K.pivot(head, Vector3(0.25 * sx, 0.22, 0.02), "Ear", Vector3(0, 0, -30 * sx))
		K.add(ep, K.petal(0.22, 0.12, 0.08, 0.02), K.mat(fur))
		ears.append(ep)
	var neck := MeshInstance3D.new()
	neck.mesh = K.tube(K.bezier(Vector3(0, 1.4, -0.65), Vector3(0, 1.65, -0.95), Vector3(0, 1.75, -1.15), 6), K.taper(6, 0.32, 0.26), 10)
	neck.material_override = K.mat(fur)
	v.add_child(neck)
	var legs := []
	for p in [Vector3(-0.38, 1.05, -0.65), Vector3(0.38, 1.05, -0.65), Vector3(-0.38, 1.05, 0.75), Vector3(0.38, 1.05, 0.75)]:
		var lp := K.pivot(v, p)
		K.add(lp, K.cyl(0.14, 0.17, 1.0, 8), K.mat(fur.darkened(0.1)), Vector3(0, -0.5, 0))
		K.add(lp, K.cyl(0.18, 0.2, 0.14, 8), K.flat(bark), Vector3(0, -1.0, 0))
		legs.append(lp)
	var tail := K.pivot(v, Vector3(0, 1.4, 1.2), "Tail", Vector3(60, 0, 0))
	for a in [-35, 0, 35]:
		var tp := K.pivot(tail, Vector3.ZERO, "", Vector3(0, 0, a))
		var th := MeshInstance3D.new()
		th.mesh = K.tube(K.bezier(Vector3.ZERO, Vector3(0, 0.5, 0.1), Vector3(0, 0.8, 0.4), 6), K.taper(6, 0.07, 0.01), 5)
		th.material_override = K.mat(bark.lightened(0.15))
		tp.add_child(th)
		K.add(tp, K.sphere(0.06, 6, 3), K.mat(rose), Vector3(0, 0.45, 0.12))
	r.reg("head", head); r.reg("eyes", eyes); r.reg("ear_l", ears[0]); r.reg("ear_r", ears[1]); r.reg("legs", legs); r.reg("tail", tail); r.reg("sway", [mane])
	r.reg("acc_head", K.pivot(head, Vector3(0, 0.32, 0))); r.reg("acc_neck", K.pivot(v, Vector3(0, 1.5, -0.8)))
	r.reg("saddle", K.pivot(v, Vector3(0, 1.95, 0.0)))
	return r

# ===================================================================== THALASSOR (Colossal, water)
static func _thalassor(_variant: String) -> CreatureRig:
	## Whale-shaped sea guardian with flowing fins, coral crown and glowing lines.
	var r := _rig("swim")
	r.is_colossal = true
	r.gait_speed = 0.35
	var v := r.visual
	var deep := Color("2f6f9a"); var belly := Color("bfe6ea"); var glow_c := Color("5fe3d6"); var coral := [Color("f2836b"), Color("ffb08a"), Color("e8576b")]
	var body := K.pivot(v, Vector3(0, 0, 0), "Body")
	# One continuous tapered hull from the blunt head to the tail stock.
	var hull_pts := PackedVector3Array()
	var hull_r := PackedFloat32Array()
	var prof := [0.9, 1.6, 1.95, 2.1, 2.05, 1.85, 1.5, 1.1, 0.75, 0.5, 0.38]
	for i in prof.size():
		var t := float(i) / (prof.size() - 1)
		hull_pts.append(Vector3(0, sin(t * PI) * 0.3, -6.5 + t * 13.0))
		hull_r.append(prof[i])
	var hull := MeshInstance3D.new()
	hull.mesh = K.tube(hull_pts, hull_r, 18)
	hull.material_override = K.mat(deep, 0.35, Color.BLACK, 1.0, 0.15)
	hull.scale = Vector3(1.0, 0.85, 1.0)
	body.add_child(hull)
	K.add(body, K.sphere(0.9, 16, 8), K.mat(deep, 0.35), Vector3(0, 0.1, -6.5), Vector3.ZERO, Vector3(1.0, 0.85, 0.6))
	var belly_pts := PackedVector3Array()
	var belly_r := PackedFloat32Array()
	for i in 8:
		var t := float(i) / 7.0
		belly_pts.append(Vector3(0, -0.9 - sin(t * PI) * 0.35, -6.0 + t * 9.0))
		belly_r.append(0.6 + sin(t * PI) * 0.9)
	var bel := MeshInstance3D.new()
	bel.mesh = K.tube(belly_pts, belly_r, 14)
	bel.material_override = K.mat(belly, 0.5)
	bel.scale = Vector3(1.0, 0.6, 1.0)
	body.add_child(bel)
	for k in 9:
		K.add(body, K.capsule(0.05, 4.0), K.mat(belly.darkened(0.2)), Vector3(-1.0 + k * 0.25, -1.55, -2.8), Vector3(90, 0, 0))
	var tail := K.pivot(body, Vector3(0, 0.2, 6.4), "Tail")
	for sx in [-1, 1]:
		K.add(tail, K.petal(3.4, 1.9, 0.0, 0.18), K.mat(deep.lightened(0.08), 0.35), Vector3.ZERO, Vector3(90, 40 * sx, 0))
		K.add(tail, K.petal(2.8, 0.9, 0.0, 0.08), K.glass(glow_c, 0.5, glow_c), Vector3(0, 0.06, 0), Vector3(90, 40 * sx, 0))
	var head := K.pivot(body, Vector3(0, 0.3, -6.6), "Head")
	K.add(head, K.torus(1.25, 1.32, 32), K.mat(belly.darkened(0.25)), Vector3(0, -0.55, 0.9), Vector3(80, 0, 0), Vector3(1.0, 1.0, 0.25))
	var eyes := []
	for sx in [-1, 1]:
		eyes.append(K.eye(head, Vector3(1.5 * sx, 0.1, 1.4), 0.2, Color("0a2030"), Vector3(1.0 * sx, 0, -0.3), glow_c))
	var crown := K.pivot(head, Vector3(0, 1.3, 1.6), "Crown")
	var rng := RandomNumberGenerator.new()
	rng.seed = 2468
	for i in 7:
		var base := Vector3(rng.randf_range(-0.9, 0.9), 0, rng.randf_range(-0.4, 1.6))
		var col: Color = coral[i % 3]
		for b in 3:
			var tip := base + Vector3(rng.randf_range(-0.5, 0.5), rng.randf_range(0.6, 1.4), rng.randf_range(-0.4, 0.4))
			var cm := MeshInstance3D.new()
			cm.mesh = K.tube(K.bezier(base, base.lerp(tip, 0.5) + Vector3(0, 0.2, 0), tip, 5), K.taper(5, 0.14, 0.05), 6)
			cm.material_override = K.mat(col, 0.7)
			crown.add_child(cm)
			K.add(crown, K.sphere(0.08, 6, 3), K.mat(col.lightened(0.3), 0.6, col, 0.3), tip)
	for k in 6:
		K.add(body, K.sphere(0.3 + rng.randf() * 0.2, 8, 4), K.mat(coral[k % 3], 0.8), Vector3(rng.randf_range(-0.5, 0.5), 1.85 - absf(k - 2.5) * 0.12, -3.2 + k * 1.0), Vector3.ZERO, Vector3(1.2, 0.6, 1.0))
	for sx in [-1, 1]:
		for k in 3:
			K.add(body, K.capsule(0.07, 3.2), K.glow(glow_c, 1.8), Vector3(2.0 * sx - 0.05 * k * sx, 0.5 - k * 0.5, -1.8 + k * 0.8), Vector3(90, 0, 0))
	var wings := []
	for sx in [-1, 1]:
		var fp := K.pivot(body, Vector3(1.9 * sx, -0.5, -3.4), "Fin")
		K.add(fp, K.petal(5.5, 1.7, -0.6, 0.14), K.mat(deep.lightened(0.05), 0.35), Vector3.ZERO, Vector3(90, 115 * sx, -15 * sx))
		K.add(fp, K.petal(4.8, 0.7, -0.55, 0.06), K.glass(glow_c, 0.5, glow_c), Vector3(0, 0.08, 0), Vector3(90, 115 * sx, -15 * sx))
		wings.append(fp)
	var bubbles := FX.motes(Color("dff4ff"), 24, Vector3(2.5, 1.5, 5.0), 0.1)
	bubbles.gravity = Vector3(0, 0.6, 0)
	v.add_child(bubbles)
	r.reg("head", head); r.reg("eyes", eyes); r.reg("tail", tail); r.reg("wings", wings); r.reg("sway", [crown])
	r.reg("acc_head", K.pivot(head, Vector3(0, 1.4, 1.4))); r.reg("acc_neck", K.pivot(body, Vector3(0, 1.4, -4.5)))
	r.reg("saddle", K.pivot(body, Vector3(0, 1.95, -2.2)))
	return r

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
