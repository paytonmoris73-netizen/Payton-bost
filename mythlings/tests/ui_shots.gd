extends Node
## Visual check of UI panels. godot res://tests/ui_shots.tscn -- --out=/dir

var out := "user://ui_shots"

func _ready() -> void:
	for a in OS.get_cmdline_user_args():
		if a.begins_with("--out="):
			out = a.trim_prefix("--out=")
	DirAccess.make_dir_recursive_absolute(out)
	SaveManager.save_dir_override = OS.get_cache_dir().path_join("mythlings_uishots")
	DirAccess.make_dir_recursive_absolute(SaveManager.save_dir_override)
	GameState.data = GameState.default_data()
	GameState.set_flag("intro_done")
	GameState.set_flag("tutorial_step", 99)
	for id in ["mossbun", "sunfox", "cloverling", "pebblit", "verdantus"]:
		GameState.discover(id, "whispering_woods")
		GameState.add_friendship(id, 30 + randi() % 50)
	GameState.data.companion = "mossbun"
	GameState.data.sanctuary = {"oak": 2, "shrine": 1}
	GameState.add_currency("gold", 900)
	GameState.add_currency("crystals", 40)
	for i in ["wood", "stone", "petals", "crystal", "glimmerroot", "honey_drop"]:
		GameState.add_item(i, 3 + randi() % 8, false)
	var game: Node = load("res://scenes/main/game.tscn").instantiate()
	get_tree().root.add_child.call_deferred(game)
	await get_tree().create_timer(3.0).timeout
	var ui: GameUI = game.ui
	var lvl := MeadowLevel.current
	lvl.sky.time = 0.42
	lvl.sky.paused = true
	var only := ""
	for a in OS.get_cmdline_user_args():
		if a.begins_with("--only="):
			only = a.trim_prefix("--only=")
	var shots := [
		["journal", "journal", {"creature": "sunfox"}],
		["market", "market", {}],
		["market_colossal", "market", {"category": "colossal"}],
		["market_detail", "market", {"product": "cloth_explorer_hat"}],
		["map_world", "map", {}],
		["creatures", "creatures", {}],
		["customize", "customize", {}],
		["quests", "quests", {}],
		["inventory", "inventory", {}],
		["restore", "restore", {"site": lvl.sites.oak}],
	]
	for s in shots:
		if only != "" and not (s[0] in only.split(",")):
			continue
		ui.open_panel(s[1], s[2])
		await get_tree().create_timer(2.6).timeout
		get_viewport().get_texture().get_image().save_png(out.path_join(s[0] + ".png"))
		print("[ui] ", s[0])
		ui.panels[s[1]].close()
		await get_tree().create_timer(0.4).timeout
	get_tree().paused = false
	var moss: Creature = lvl.creatures.mossbun
	lvl.player.global_position = moss.global_position + Vector3(0, 0, 2.5)
	await get_tree().create_timer(0.5).timeout
	ui.open_panel("creature_interact", {"creature": moss})
	await get_tree().create_timer(2.0).timeout
	get_viewport().get_texture().get_image().save_png(out.path_join("interact.png"))
	ui.interact_panel.close()
	var sun: Creature = lvl.creatures.sunfox
	GameState.data.creatures.erase("sunfox")
	lvl.player.global_position = sun.global_position + Vector3(0, 0, 3)
	ui.discover_panel.open(sun)
	await get_tree().create_timer(3.4).timeout
	get_viewport().get_texture().get_image().save_png(out.path_join("discover.png"))
	print("[ui] done")
	get_tree().quit()
