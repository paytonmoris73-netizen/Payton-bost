class_name SanctuarySite
extends Interactable
## A restorable structure with visible stages. `stages[i]` describes how to go
## from stage i to i+1. `builder.call(stage)` returns the Node3D shown for a stage,
## so every upgrade visibly changes the world.

signal restored(stage: int)

var site_id := ""
var title := ""
var stages: Array = []  # [{title, desc, cost:{item:qty}, min_level}]
var builder: Callable
var _visual: Node3D

func setup(id: String, site_title: String, stage_defs: Array, build: Callable) -> void:
	site_id = id
	title = site_title
	stages = stage_defs
	builder = build
	radius = 5.0
	icon = "hammer"

func _ready() -> void:
	super._ready()
	_show_stage(GameState.sanctuary_stage(site_id), false)

func stage() -> int:
	return GameState.sanctuary_stage(site_id)

func max_stage() -> int:
	return stages.size()

func get_prompt() -> String:
	return "Restore " + title if stage() < max_stage() else title

func can_interact() -> bool:
	return is_visible_in_tree()

func next_info() -> Dictionary:
	if stage() >= max_stage():
		return {}
	return stages[stage()]

func interact(_player: Node) -> void:
	Events.request_panel.emit("restore", {"site": self})

func can_restore() -> String:
	var info := next_info()
	if info.is_empty():
		return "Fully restored."
	if GameState.level() < int(info.get("min_level", 1)):
		return "Requires Keeper level %d." % int(info.min_level)
	if info.has("requires_quest") and not (Quests.is_active(info.requires_quest) or Quests.is_completed(info.requires_quest)):
		return "Not yet — the story will lead you here."
	if not GameState.has_items(info.cost):
		return "Missing materials."
	return ""

func restore() -> bool:
	if can_restore() != "":
		return false
	var info := next_info()
	GameState.consume_items(info.cost)
	var ns := stage() + 1
	GameState.set_sanctuary_stage(site_id, ns)
	GameState.add_xp(int(info.get("xp", 60)))
	Audio.play_sfx("restore")
	_show_stage(ns, true)
	restored.emit(ns)
	SaveManager.save_game()
	return true

func _show_stage(s: int, animate: bool) -> void:
	var old := _visual
	_visual = builder.call(s)
	add_child(_visual)
	if animate:
		FX.burst(get_parent(), global_position + Vector3(0, 1.5, 0), Color("b6f5c8"), 60, 0.1, 6.0, 1.6, -2.0)
		FX.burst(get_parent(), global_position + Vector3(0, 0.5, 0), Color("ffe9a8"), 40, 0.08, 4.0, 1.4, -1.0)
		_visual.scale = Vector3(1, 0.05, 1)
		var tw := create_tween()
		tw.tween_property(_visual, "scale", Vector3.ONE, 1.4).set_trans(Tween.TRANS_ELASTIC).set_ease(Tween.EASE_OUT)
		if old:
			var tw2 := create_tween()
			tw2.tween_property(old, "scale", Vector3(1, 0.01, 1), 0.4)
			tw2.tween_callback(old.queue_free)
	elif old:
		old.queue_free()
