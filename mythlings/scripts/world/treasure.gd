class_name Treasure
extends Interactable
## A one-time treasure chest. Opened state is saved.

const K := preload("res://scripts/core/mesh_kit.gd")
var uid := ""
var reward: Dictionary = {}
var label_text := ""
var _lid: Node3D

func setup(id: String, rewards: Dictionary, label: String) -> void:
	uid = id
	reward = rewards
	label_text = label
	prompt = "Open " + label
	icon = "chest"
	radius = 2.6
	K.add(self, K.box(Vector3(0.9, 0.5, 0.6)), K.mat(Color("7a4e2e")), Vector3(0, 0.25, 0))
	K.add(self, K.box(Vector3(0.95, 0.08, 0.65)), K.mat(Color("e8b64c"), 0.35, Color.BLACK, 1.0, 0.7), Vector3(0, 0.5, 0))
	_lid = K.pivot(self, Vector3(0, 0.5, 0.3))
	K.add(_lid, K.cyl(0.3, 0.3, 0.92, 10), K.mat(Color("8a5a32")), Vector3(0, 0.0, -0.3), Vector3(0, 0, 90), Vector3(1, 1, 1))
	K.add(_lid, K.box(Vector3(0.14, 0.18, 0.06)), K.mat(Color("e8b64c"), 0.35, Color.BLACK, 1.0, 0.7), Vector3(0, 0.05, -0.62))

func _ready() -> void:
	super._ready()
	if GameState.flag("chest_" + uid):
		_open_visual(false)

func can_interact() -> bool:
	return super.can_interact() and not GameState.flag("chest_" + uid)

func interact(player: Node) -> void:
	if GameState.flag("chest_" + uid):
		return
	GameState.set_flag("chest_" + uid)
	GameState.grant_rewards(reward)
	_open_visual(true)
	Audio.play_sfx("discovery", 1.2)
	FX.burst(get_parent(), global_position + Vector3(0, 0.8, 0), Color("ffe08a"), 40, 0.08, 4.0, 1.2)
	var bits: Array = []
	for k in reward:
		if k == "items":
			for i in reward.items:
				bits.append("%d %s" % [reward.items[i], DB.item(i).display_name])
		elif k != "xp":
			bits.append("%d %s" % [reward[k], Store.currency_name(k)])
	Events.toast.emit(label_text, "Found " + ", ".join(bits) + "!", "chest")
	Events.emit_game_event("treasure", uid)
	if player and player.has_method("play_action"):
		player.play_action("cheer")

func _open_visual(animate: bool) -> void:
	if animate:
		create_tween().tween_property(_lid, "rotation_degrees:x", -110.0, 0.6).set_trans(Tween.TRANS_BACK).set_ease(Tween.EASE_OUT)
	else:
		_lid.rotation_degrees.x = -110.0
