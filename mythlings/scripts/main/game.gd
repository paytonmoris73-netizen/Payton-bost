extends Node3D
## Gameplay scene root: builds the region, spawns the Keeper and the UI.

var level: MeadowLevel
var player: Player
var ui: GameUI

func _ready() -> void:
	GameState.session_active = true
	var region := String(GameState.data.player.get("region", "meadow"))
	var rd: RegionData = DB.region(region)
	if rd == null or not rd.playable:
		region = "meadow"
		GameState.data.player.region = "meadow"
	level = EmberfallLevel.new() if region == "emberfall" else MeadowLevel.new()
	level.name = region.capitalize()
	add_child(level)
	level.build()
	player = Player.new()
	player.name = "Player"
	level.player = player
	add_child(player)
	var saved = GameState.data.player.get("pos_" + region, GameState.data.player.get("position") if region == "meadow" else null)
	var spawn := level.at("spawn", 0.3)
	if saved is Array and saved.size() == 3:
		var sp := Vector3(float(saved[0]), float(saved[1]), float(saved[2]))
		# Guard against corrupt or out-of-bounds positions.
		if Vector2(sp.x, sp.z).length() < 120.0 and sp.y > -10.0:
			spawn = Vector3(sp.x, maxf(sp.y, level.terrain.height(sp.x, sp.z)) + 0.3, sp.z)
	player.global_position = spawn
	player.rotation.y = 0.0
	player._yaw = 0.0
	level.refresh_creatures()
	var comp := level.companion_creature()
	if comp:
		comp.global_position = spawn + Vector3(1.5, 0, 1.5)
	ui = GameUI.new()
	add_child(ui)
	ui.setup(player, level)
	Audio.play_music(level.music)
	Audio.play_ambience("amb_meadow")
	Quests.refresh_available()
	Events.game_event.connect(_on_event)
	if region != "meadow" and not GameState.flag("intro_" + region):
		GameState.set_flag("intro_" + region)
		ui.hud.show_banner(DB.region(region).display_name, "A new region")
	if not GameState.flag("intro_done"):
		GameState.set_flag("intro_done")
		_intro()
	SaveManager.save_game()

func _intro() -> void:
	ui.hud.show_banner("Whispering Meadow", "A new Keeper arrives")
	await get_tree().create_timer(2.0).timeout
	Events.request_dialogue.emit("Elder Rowan", ["Hello there! Over here, by the well!", "Come and say hello — I've been expecting you."])

func _on_event(kind: String, id: String, _amount: int) -> void:
	# Opening panels counts as tutorial progress.
	if kind == "collect" and int(GameState.data.stats.resources_collected) <= 2:
		pass

func _process(_delta: float) -> void:
	for n in ["inventory", "quests"]:
		if ui.panels.has(n) and ui.panels[n].visible and not ui.panels[n].has_meta("counted"):
			ui.panels[n].set_meta("counted", true)
			Events.emit_game_event("open", "bag" if n == "inventory" else n)
		elif ui.panels.has(n) and not ui.panels[n].visible:
			ui.panels[n].remove_meta("counted")
