class_name TutorialDirector
extends Node
## Gentle, in-world onboarding. One hint at a time, each cleared by actually
## doing the thing. Progress is saved so hints never repeat.

var ui: GameUI
var _card: PanelContainer
var _label: Label
var _step := 0
var _moved := 0.0
var _last_pos := Vector3.INF
var _cam_used := false

const STEPS := [
	["move", "Drag the left side of the screen to walk. Push the stick all the way to run."],
	["camera", "Drag on the right side of the screen to look around."],
	["talk", "Elder Rowan is waiting by the well. Walk up and tap the hand button to talk."],
	["discover", "Follow the golden marker to the Whispering Woods and find the Mossbun. Approach slowly!"],
	["befriend", "Tap Mossbun to greet, pet or offer a treat. Then invite it to be your companion."],
	["ability", "Tap the glowing ability button to use Mossbun's Mossy Sense."],
	["bag", "You gathered something! Tap Bag at the bottom to see your items."],
	["quests", "Tap the quest card (top-left) anytime to see all your quests."],
	["restore", "Gather wood and stone, then restore the Ancient Oak's standing stones."],
	["map", "Open the Map to see the world beyond the meadow."],
	["done", ""],
]

func setup(u: GameUI) -> void:
	ui = u
	_step = int(GameState.flag("tutorial_step", 0))
	_card = PanelContainer.new()
	_card.theme = UITheme.get_theme()
	_card.theme_type_variation = "Card"
	_card.anchor_left = 0.5
	_card.anchor_right = 0.5
	_card.anchor_top = 0.0
	_card.grow_horizontal = Control.GROW_DIRECTION_BOTH
	_card.offset_top = 96
	_card.mouse_filter = Control.MOUSE_FILTER_IGNORE
	var h := UIKit.hbox(10)
	h.add_child(IconGlyph.make("sparkle", 30, Palette.GOLD))
	_label = UIKit.label("", "", 20, Color(0, 0, 0, 0), true)
	_label.custom_minimum_size.x = 520
	h.add_child(_label)
	_card.add_child(h)
	ui.hud.add_child(_card)
	Events.game_event.connect(_on_event)
	_show()

func _show() -> void:
	if _step >= STEPS.size() - 1:
		_card.visible = false
		return
	# Skip steps already satisfied by progress (e.g. returning players).
	var key: String = STEPS[_step][0]
	if (key == "talk" and Quests.is_completed("q_main_01")) or (key == "discover" and GameState.is_discovered("mossbun")) or (key == "befriend" and GameState.companion() != "") or (key == "restore" and GameState.sanctuary_stage("oak") >= 1) or (key == "map" and Quests.is_completed("q_main_06")):
		_advance()
		return
	_label.text = STEPS[_step][1]
	_card.visible = true
	_card.modulate.a = 0.0
	_card.create_tween().tween_property(_card, "modulate:a", 1.0, 0.4)

func _advance() -> void:
	_step += 1
	GameState.set_flag("tutorial_step", _step)
	_show()

func _on_event(kind: String, id: String, _amount: int) -> void:
	if _step >= STEPS.size():
		return
	var key: String = STEPS[_step][0]
	match key:
		"talk":
			if kind == "talk" and id == "rowan":
				_advance()
		"discover":
			if kind == "discover" and id == "mossbun":
				_advance()
		"befriend":
			if kind == "companion":
				_advance()
		"ability":
			if kind == "ability":
				_advance()
		"bag":
			if kind == "open" and id == "bag":
				_advance()
		"quests":
			if kind == "open" and id == "quests":
				_advance()
		"restore":
			if kind == "restore" and id == "oak_1":
				_advance()
		"map":
			if kind == "open" and id == "map":
				_advance()

func _process(_delta: float) -> void:
	if _step >= STEPS.size() - 1:
		return
	var key: String = STEPS[_step][0]
	var p := ui.player
	if key == "ability" or key == "bag":
		var ready: bool = (key == "ability" and GameState.companion() != "") or (key == "bag" and int(GameState.data.stats.resources_collected) > 0)
		_card.visible = ready
		if not ready:
			return
	match key:
		"move":
			if _last_pos != Vector3.INF:
				_moved += p.global_position.distance_to(_last_pos)
			_last_pos = p.global_position
			if _moved > 6.0:
				_advance()
		"camera":
			if p._cam_idle < 0.05:
				_advance()
		"bag":
			if ui.panels.has("inventory") and ui.panels.inventory.visible:
				_advance()
		"quests":
			if ui.panels.has("quests") and ui.panels.quests.visible:
				_advance()
