class_name LoreStone
extends Interactable
## A readable landmark (an Old Grove stone, a seed bed...). Reading it sets the
## flag "lore_<uid>", emits game event lore:<uid> and shows its text.
## `needs` optionally returns "" when it can be used, otherwise a reason.

const K := preload("res://scripts/core/mesh_kit.gd")
var uid := ""
var title := ""
var lines: Array = []
var needs: Callable
var on_read: Callable

func setup(id: String, title_text: String, text_lines: Array, verb := "Read") -> void:
	uid = id
	title = title_text
	lines = text_lines
	prompt = "%s %s" % [verb, title_text]
	icon = "journal"
	radius = 2.8

func is_read() -> bool:
	return GameState.flag("lore_" + uid)

func interact(_player: Node) -> void:
	var why := String(needs.call()) if needs.is_valid() else ""
	if why != "":
		Events.toast.emit(title, why, "leaf")
		return
	var first := not is_read()
	if first:
		GameState.set_flag("lore_" + uid)
		GameState.add_xp(40)
		FX.burst(get_parent(), global_position + Vector3(0, 1.2, 0), Color("8affc0"), 30, 0.08, 3.0, 1.2)
		Audio.play_sfx("discovery", 0.9)
	Events.emit_game_event("lore", uid)
	if on_read.is_valid():
		on_read.call(self, first)
	if lines.size() > 0:
		Events.request_dialogue.emit(title, lines)
