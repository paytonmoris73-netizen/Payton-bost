extends Node
## Screenshots of the AWAKENINGS systems (Mossbun family).
## godot res://tests/awakening_shots.tscn -- --out=/dir

var out := "user://awakening_shots"

func snap(n: String) -> void:
	get_viewport().get_texture().get_image().save_png(out.path_join(n + ".png"))
	print("[shot] ", n)

func view(lvl: MeadowLevel, pos: Vector3, look: Vector3, pitch := -0.2) -> void:
	var p := lvl.player
	pos.y = lvl.terrain.height(pos.x, pos.z) + 0.2
	p.global_position = pos
	var yaw := atan2(-(look.x - pos.x), -(look.z - pos.z))
	p.rotation.y = yaw
	p._yaw = yaw
	p._pitch = pitch
	p.cam_yaw.global_position = pos + Vector3(0, 1.45, 0)

func _ready() -> void:
	for a in OS.get_cmdline_user_args():
		if a.begins_with("--out="):
			out = a.trim_prefix("--out=")
	DirAccess.make_dir_recursive_absolute(out)
	SaveManager.save_dir_override = OS.get_cache_dir().path_join("mythlings_ashots")
	DirAccess.make_dir_recursive_absolute(SaveManager.save_dir_override)
	GameState.data = GameState.default_data()
	GameState.set_flag("intro_done")
	GameState.set_flag("tutorial_step", 99)
	GameState.discover("mossbun", "whispering_woods")
	GameState.add_friendship("mossbun", 60)
	GameState.data.companion = "mossbun"
	GameState.data.sanctuary = {"oak": 2}
	GameState.data.player.level = 5
	var game: Node = load("res://scenes/main/game.tscn").instantiate()
	get_tree().root.add_child.call_deferred(game)
	await get_tree().create_timer(3.0).timeout
	var ui: GameUI = game.ui
	var lvl := MeadowLevel.current
	lvl.sky.time = 0.4
	lvl.sky.paused = true
	var hc := lvl.at("heartwood_hollow")
	# 1. The moss curtain hiding the Heartwood Hollow.
	view(lvl, hc + Vector3(15, 0, 3), hc + Vector3(6, 1.5, 0), -0.1)
	await get_tree().create_timer(0.5).timeout
	lvl.companion_creature().global_position = hc + Vector3(10, 0.2, 1)
	await get_tree().create_timer(2.0).timeout
	snap("a1_moss_curtain")
	# 2. Open it and look inside.
	Quests.start("c_mossbun_seed", true)
	lvl.player.global_position = hc + Vector3(10, 1, 0)
	await get_tree().create_timer(0.3).timeout
	Abilities.activate(lvl.companion_creature(), "hidden_sense")
	await get_tree().create_timer(1.5).timeout
	view(lvl, hc + Vector3(2.5, 0, 3.0), hc + Vector3(-2.5, 1.2, -0.5), -0.22)
	await get_tree().create_timer(2.0).timeout
	snap("a2_heartwood_hollow")
	GameState.data.visited.append("heartwood_hollow")
	for n in lvl.get_children():
		if n is LoreStone and n.uid == "heartwood_seed":
			n.interact(lvl.player)
	await get_tree().create_timer(0.5).timeout
	ui.hud._dlg_queue.clear()
	ui.hud._dialogue.visible = false
	# 3. Mythlings panel with the Awakening options.
	ui.open_panel("creatures", {"creature": "mossbun"})
	await get_tree().create_timer(2.0).timeout
	var cp: CreaturesPanel = ui.panels.creatures
	(cp._detail.get_parent() as ScrollContainer).scroll_vertical = 1100
	await get_tree().create_timer(0.6).timeout
	snap("a3_creatures_awakenings")
	cp.close()
	await get_tree().create_timer(0.4).timeout
	# 4. Awakening screen.
	ui.open_panel("awakening", {"id": "mossbun", "index": 0})
	await get_tree().create_timer(2.5).timeout
	snap("a4_awakening_screen")
	var aw: AwakeningPanel = ui.panels.awakening
	(aw._info.get_parent() as ScrollContainer).scroll_vertical = 500
	await get_tree().create_timer(0.6).timeout
	snap("a5_awakening_requirements")
	aw.close()
	await get_tree().create_timer(0.4).timeout
	# 5. Grove Awakening sequence.
	Evolution.evolve("mossbun", 0)
	ui.play_evolution("mossbun", "mossmantle")
	for i in 8:
		await get_tree().create_timer(1.1).timeout
		snap("a6_grove_t%d" % i)
	await get_tree().create_timer(2.5).timeout
	snap("a7_grove_reveal")
	ui.evolution.close()
	ui.hud._dlg_queue.clear()
	ui.hud._dialogue.visible = false
	await get_tree().create_timer(0.5).timeout
	# 6. Mossmantle in the woods, with Form Memory Mossbun for comparison.
	var mm: Creature = lvl.companion_creature()
	var spot := hc + Vector3(1.0, 0, 1.0)
	spot.y = lvl.terrain.height(spot.x, spot.z)
	view(lvl, hc + Vector3(5.0, 0, 0.3), spot + Vector3(0, 0.6, 0), -0.12)
	mm.mode = Creature.Mode.DISPLAY
	mm.global_position = spot
	mm.rotation.y = -2.0
	await get_tree().create_timer(2.5).timeout
	snap("a8_mossmantle_world")
	# 7. Verdantus Awakening screen with the cottage size comparison.
	GameState.data.sanctuary["shrine"] = 1
	ui.open_panel("awakening", {"id": "mossmantle", "index": 0})
	await get_tree().create_timer(2.5).timeout
	snap("a9_awakening_colossal")
	ui.panels.awakening.close()
	await get_tree().create_timer(0.4).timeout
	# 8. Gallery.
	GameState.discover("cindercub")
	GameState.discover("sunfox")
	ui.open_panel("awakening_gallery", {})
	await get_tree().create_timer(2.0).timeout
	snap("a10_gallery")
	get_tree().quit()
