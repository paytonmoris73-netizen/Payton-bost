class_name NPC
extends Interactable
## A villager. Talking emits "talk:<npc_id>" for quests; lines depend on progress.

var npc_id := ""
var display_name := ""
var lines_fn: Callable  # returns Array[String]
var model: PlayerModel
var _wave_t := 0.0

func setup(id: String, name_text: String, appearance: Dictionary, lines: Callable) -> void:
	npc_id = id
	display_name = name_text
	lines_fn = lines
	prompt = "Talk to " + name_text
	icon = "talk"
	radius = 3.0
	model = PlayerModel.new()
	add_child(model)
	model.rebuild(appearance)
	var label := Label3D.new()
	label.text = name_text
	label.billboard = BaseMaterial3D.BILLBOARD_ENABLED
	label.font = load("res://assets/fonts/Fredoka.ttf")
	label.font_size = 40
	label.pixel_size = 0.006
	label.outline_size = 10
	label.outline_modulate = Color(0, 0, 0, 0.5)
	label.position = Vector3(0, 2.25, 0)
	label.modulate = Color("fff6dc")
	add_child(label)

func interact(player: Node) -> void:
	if player:
		var to: Vector3 = player.global_position - global_position
		to.y = 0
		if to.length() > 0.1:
			rotation.y = atan2(-to.x, -to.z)
	model.action("wave", 1.2)
	Events.emit_game_event("talk", npc_id)
	var lines: Array = lines_fn.call() if lines_fn.is_valid() else []
	if lines.size() > 0:
		Events.request_dialogue.emit(display_name, lines)

func _process(delta: float) -> void:
	_wave_t -= delta
	if _wave_t <= 0.0:
		_wave_t = randf_range(6.0, 12.0)
		if randf() < 0.5:
			model.action("wave", 1.0)
