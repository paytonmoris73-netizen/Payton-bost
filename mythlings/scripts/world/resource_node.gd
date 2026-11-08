class_name ResourceNode
extends Interactable
## A gatherable pile (wood, stone, petals, berries, crystal). Regrows over time.

@export var item_id := "wood"
@export var amount_min := 1
@export var amount_max := 2
@export var respawn_time := 120.0
var visual: Node3D
var _respawn := 0.0
var once_flag := ""  # if set, can only be collected once (persisted)

func _ready() -> void:
	super._ready()
	var def: ItemData = DB.item(item_id)
	prompt = "Gather " + (def.display_name if def else item_id)
	icon = "bag"
	if once_flag != "" and GameState.flag(once_flag):
		_set_available(false)
		respawn_time = -1.0

func interact(player: Node) -> void:
	if not enabled:
		return
	var n := randi_range(amount_min, amount_max)
	var got := GameState.add_item(item_id, n)
	if got <= 0:
		return
	if player and player.has_method("play_action"):
		player.play_action("gather")
	var def: ItemData = DB.item(item_id)
	FX.burst(get_parent(), global_position + Vector3(0, 0.6, 0), def.color if def else Color.WHITE, 14, 0.06, 2.0)
	FX.popup_text(get_parent(), global_position + Vector3(0, 1.4, 0), "+%d %s" % [got, def.display_name if def else item_id])
	Audio.play_sfx("collect", randf_range(0.95, 1.08))
	if once_flag != "":
		GameState.set_flag(once_flag)
		respawn_time = -1.0
	_set_available(false)
	_respawn = respawn_time

func _set_available(v: bool) -> void:
	enabled = v
	if visual:
		if v:
			visual.visible = true
			visual.scale = Vector3.ONE * 0.01
			create_tween().tween_property(visual, "scale", Vector3.ONE, 0.5).set_trans(Tween.TRANS_BACK).set_ease(Tween.EASE_OUT)
		else:
			visual.visible = false

func _process(delta: float) -> void:
	if enabled or respawn_time < 0.0:
		return
	_respawn -= delta
	if _respawn <= 0.0:
		_set_available(true)
