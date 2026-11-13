extends Node
## Screenshots of the Magmole family Awakening (Magmole -> Basaltusk -> Obsidra)
## and of the Obsidian Deep in Emberfall Highlands.
## godot res://tests/magmole_shots.tscn -- --out=/dir

var out := "user://magmole_shots"

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
	SaveManager.save_dir_override = OS.get_cache_dir().path_join("mythlings_mshots")
	DirAccess.make_dir_recursive_absolute(SaveManager.save_dir_override)
	GameState.data = GameState.default_data()
	GameState.set_flag("intro_done")
	GameState.set_flag("tutorial_step", 99)
	GameState.data.player.region = "emberfall"
	GameState.discover("magmole", "ashen_caverns")
	GameState.add_friendship("magmole", 60)
	GameState.data.companion = "magmole"
	GameState.data.player.level = 6
	var game: Node = load("res://scenes/main/game.tscn").instantiate()
	get_tree().root.add_child.call_deferred(game)
	await get_tree().create_timer(3.0).timeout
	var ui: GameUI = game.ui
	var lvl := MeadowLevel.current
	lvl.sky.time = 0.42
	lvl.sky.paused = true
	var dc := lvl.at("obsidian_deep")
	# 1. The glass wall across the only gap into the Obsidian Deep.
	view(lvl, dc + Vector3(17, 0, 4), dc + Vector3(8, 2.0, 0), -0.08)
	await get_tree().create_timer(0.5).timeout
	var comp := lvl.companion_creature()
	if comp:
		comp.global_position = dc + Vector3(12, 0.2, 1)
	await get_tree().create_timer(2.0).timeout
	snap("m1_glass_wall")
	# 2. Break it open and look into the gallery.
	Quests.start("c_magmole_deep", true)
	lvl.player.global_position = dc + Vector3(10, 1, 0)
	await get_tree().create_timer(0.3).timeout
	Abilities.activate(lvl.companion_creature(), "burrow_break")
	await get_tree().create_timer(1.5).timeout
	view(lvl, dc + Vector3(14.0, 0, 9.0), dc + Vector3(0.0, 3.0, 0.0), -0.08)
	await get_tree().create_timer(2.0).timeout
	snap("m2_obsidian_deep")
	GameState.data.visited.append("obsidian_deep")
	GameState.data.visited.append("ashen_caverns")
	for n in lvl.get_children():
		if n is LoreStone and n.uid == "basalt_core":
			n.interact(lvl.player)
	await get_tree().create_timer(0.6).timeout
	ui.hud._dlg_queue.clear()
	ui.hud._dialogue.visible = false
	if not Quests.is_completed("c_magmole_deep"):
		Quests.completed().append("c_magmole_deep")
	GameState.add_item("stone", 10)
	GameState.add_item("emberstone", 10)
	# 3. Awakening screen for Basaltusk.
	ui.open_panel("awakening", {"id": "magmole", "index": 0})
	await get_tree().create_timer(2.5).timeout
	snap("m3_awakening_basaltusk")
	var aw: AwakeningPanel = ui.panels.awakening
	(aw._info.get_parent() as ScrollContainer).scroll_vertical = 500
	await get_tree().create_timer(0.6).timeout
	snap("m4_requirements")
	aw.close()
	await get_tree().create_timer(0.4).timeout
	# 4. The stone Awakening sequence.
	Evolution.evolve("magmole", 0)
	ui.play_evolution("magmole", "basaltusk")
	for i in 7:
		await get_tree().create_timer(1.1).timeout
		snap("m5_stone_t%d" % i)
	await get_tree().create_timer(2.5).timeout
	snap("m6_basaltusk_reveal")
	ui.evolution.close()
	ui.hud._dlg_queue.clear()
	ui.hud._dialogue.visible = false
	await get_tree().create_timer(0.5).timeout
	# 5. Basaltusk standing in the deep.
	lvl.refresh_creatures()
	await get_tree().create_timer(0.5).timeout
	var bt: Creature = lvl.creatures.get("basaltusk")
	var spot := dc + Vector3(5.5, 0, 1.5)
	spot.y = lvl.terrain.height(spot.x, spot.z)
	if bt:
		bt.mode = Creature.Mode.DISPLAY
		bt.global_position = spot
		bt.rotation.y = -2.2
	view(lvl, dc + Vector3(15.0, 0, 3.0), spot + Vector3(0, 1.0, 0), -0.05)
	await get_tree().create_timer(2.5).timeout
	snap("m7_basaltusk_world")
	# 6. Obsidra's Awakening screen: true scale beside the Keeper and a cottage.
	GameState.set_flag("lore_glass_record_1")
	GameState.set_flag("lore_glass_record_2")
	if not Quests.is_completed("e_glass_history"):
		Quests.completed().append("e_glass_history")
	GameState.data.visited.append("cinder_lake")
	GameState.data.visited.append("dragonstone_ridge")
	GameState.add_item("emberstone", 10)
	GameState.add_item("crystal", 6)
	GameState.add_friendship("basaltusk", 80)
	ui.open_panel("awakening", {"id": "basaltusk", "index": 0})
	await get_tree().create_timer(2.5).timeout
	snap("m8_awakening_obsidra")
	ui.panels.awakening.close()
	await get_tree().create_timer(0.4).timeout
	# 7. Obsidra's own Awakening sequence and the gallery.
	Evolution.evolve("basaltusk", 0)
	ui.play_evolution("basaltusk", "obsidra")
	await get_tree().create_timer(7.5).timeout
	snap("m9_obsidra_reveal")
	ui.evolution.close()
	ui.hud._dlg_queue.clear()
	ui.hud._dialogue.visible = false
	await get_tree().create_timer(0.6).timeout
	ui.open_panel("awakening_gallery", {})
	await get_tree().create_timer(2.0).timeout
	snap("m10_gallery")
	get_tree().quit()
