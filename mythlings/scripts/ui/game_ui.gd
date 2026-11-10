class_name GameUI
extends CanvasLayer
## Owns the HUD and lazily creates panels on request. Panels are opened through
## Events.request_panel so any system can ask for one without a reference.

var hud: GameHUD
var player: Player
var level: MeadowLevel
var panels: Dictionary = {}
var interact_panel: CreatureInteractPanel
var discover_panel: DiscoverPanel
var play_game: PlayGame
var tutorial: TutorialDirector
var evolution: EvolutionCinematic

const PANEL_CLASSES := {
	"journal": "JournalPanel", "inventory": "InventoryPanel", "quests": "QuestsPanel",
	"map": "MapPanel", "creatures": "CreaturesPanel", "market": "MarketPanel",
	"settings": "SettingsPanel", "pause": "PausePanel", "profile": "ProfilePanel",
	"achievements": "AchievementsPanel", "friends": "FriendsPanel",
	"customize": "CustomizePanel", "restore": "RestorePanel", "awakening": "AwakeningPanel", "awakening_gallery": "AwakeningGalleryPanel",
}

func setup(p: Player, l: MeadowLevel) -> void:
	player = p
	level = l
	layer = 10
	add_to_group("game_ui")
	process_mode = Node.PROCESS_MODE_ALWAYS
	hud = GameHUD.new()
	add_child(hud)
	hud.build(p, l)
	hud.process_mode = Node.PROCESS_MODE_PAUSABLE
	hud.nav_pressed.connect(func(n): open_panel(n, {}))
	interact_panel = CreatureInteractPanel.new()
	add_child(interact_panel)
	interact_panel.build()
	discover_panel = DiscoverPanel.new()
	add_child(discover_panel)
	discover_panel.build()
	play_game = PlayGame.new()
	add_child(play_game)
	play_game.build()
	evolution = EvolutionCinematic.new()
	add_child(evolution)
	evolution.finished.connect(_on_panel_closed)
	Evolution.evolved.connect(_on_evolved)
	tutorial = TutorialDirector.new()
	add_child(tutorial)
	tutorial.setup(self)
	Events.request_panel.connect(open_panel)

func _on_evolved(_a: String, _b: String) -> void:
	# A method (not a lambda capturing the level) so the connection ends with this UI.
	if is_instance_valid(level):
		level.refresh_creatures()

func play_evolution(from_id: String, to_id: String) -> void:
	player.input_locked = true
	evolution.play(from_id, to_id)

func any_panel_open() -> bool:
	for p in panels.values():
		if p.visible:
			return true
	return interact_panel.visible or discover_panel.visible or play_game.visible or evolution.visible

func open_panel(name_: String, args: Dictionary) -> void:
	match name_:
		"creature_interact":
			interact_panel.open(args.creature)
			return
		"discover":
			discover_panel.open(args.creature)
			return
		"play":
			play_game.open(args.creature)
			return
		"location_banner":
			hud.show_banner(args.name, "New place discovered" if args.first else "")
			return
	if not PANEL_CLASSES.has(name_):
		push_warning("Unknown panel " + name_)
		return
	if interact_panel.visible:
		interact_panel.close()
	for k in panels:
		if k != name_ and panels[k].visible:
			panels[k].close()
	var panel: UIPanel = panels.get(name_)
	if panel == null:
		panel = _make(name_)
		panels[name_] = panel
		add_child(panel)
		panel.closed.connect(_on_panel_closed)
	player.input_locked = true
	player.touch_move = Vector2.ZERO
	hud.joystick._release()
	panel.open(args)

func _make(name_: String) -> UIPanel:
	var p: UIPanel
	match name_:
		"journal": p = JournalPanel.new()
		"inventory": p = InventoryPanel.new()
		"quests": p = QuestsPanel.new()
		"map": p = MapPanel.new()
		"creatures": p = CreaturesPanel.new()
		"market": p = MarketPanel.new()
		"settings": p = SettingsPanel.new()
		"pause": p = PausePanel.new()
		"profile": p = ProfilePanel.new()
		"achievements": p = AchievementsPanel.new()
		"friends": p = FriendsPanel.new()
		"customize": p = CustomizePanel.new()
		"restore": p = RestorePanel.new()
		"awakening": p = AwakeningPanel.new()
		"awakening_gallery": p = AwakeningGalleryPanel.new()
	p.panel_name = name_
	p.game_ui = self
	p.process_mode = Node.PROCESS_MODE_ALWAYS
	return p

func _on_panel_closed() -> void:
	if not any_panel_open() and not hud.dialogue_open():
		player.input_locked = false

func _unhandled_input(event: InputEvent) -> void:
	if event.is_action_pressed("pause") and not any_panel_open():
		open_panel("pause", {})
		get_viewport().set_input_as_handled()

func _notification(what: int) -> void:
	# Pause automatically when the app goes to the background on mobile.
	if what == NOTIFICATION_APPLICATION_PAUSED and not any_panel_open():
		open_panel("pause", {})
