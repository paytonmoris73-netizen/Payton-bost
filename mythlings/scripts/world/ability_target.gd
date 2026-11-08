class_name AbilityTarget
extends Node3D
## Something only a specific companion ability can affect (hidden plants,
## cracked boulders, dark lanterns, wilted flowers, sunken stepping stones,
## lucky clovers, hidden treasure). Permanent changes are stored as flags.

signal activated(target: AbilityTarget)

var kind := ""
var uid := ""
var permanent := true
var reward: Dictionary = {}
var on_activate: Callable  # optional custom effect
var visual_before: Node3D
var visual_after: Node3D
var done := false

func setup(target_kind: String, id: String, before: Node3D, after: Node3D, rewards := {}, is_permanent := true) -> void:
	kind = target_kind
	uid = id
	visual_before = before
	visual_after = after
	reward = rewards
	permanent = is_permanent
	if before:
		add_child(before)
	if after:
		add_child(after)

func _ready() -> void:
	add_to_group("ability_target")
	done = permanent and GameState.flag("ab_" + uid)
	_apply(done, false)

func _apply(is_done: bool, animate: bool) -> void:
	if visual_before:
		visual_before.visible = not is_done
	if visual_after:
		visual_after.visible = is_done
		if animate and is_done:
			visual_after.scale = Vector3.ONE * 0.05
			create_tween().tween_property(visual_after, "scale", Vector3.ONE, 0.9).set_trans(Tween.TRANS_BACK).set_ease(Tween.EASE_OUT)

func activate() -> bool:
	if done:
		return false
	done = true
	if permanent:
		GameState.set_flag("ab_" + uid)
	_apply(true, true)
	FX.burst(get_parent(), global_position + Vector3(0, 0.8, 0), Color("b6f5c8"), 30, 0.08, 3.0, 1.2)
	if not reward.is_empty():
		GameState.grant_rewards(reward)
		var parts: Array = []
		for k in reward:
			if k == "items":
				for i in reward.items:
					parts.append("+%d %s" % [reward.items[i], DB.item(i).display_name if DB.item(i) else i])
			elif k != "xp":
				parts.append("+%d %s" % [reward[k], Store.currency_name(k)])
		if parts.size() > 0:
			FX.popup_text(get_parent(), global_position + Vector3(0, 1.6, 0), ", ".join(parts), Color("fff2b0"))
	if on_activate.is_valid():
		on_activate.call(self)
	GameState.add_stat("ability_" + kind)
	Events.emit_game_event("ability", kind)
	activated.emit(self)
	return true
