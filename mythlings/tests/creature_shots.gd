extends Node
## Screenshots of the creature systems. godot res://tests/creature_shots.tscn -- --out=/dir

var out := "user://creature_shots"
var vp_snap: Callable

func snap(n: String) -> void:
	get_viewport().get_texture().get_image().save_png(out.path_join(n + ".png"))
	print("[shot] ", n)

func _ready() -> void:
	for a in OS.get_cmdline_user_args():
		if a.begins_with("--out="):
			out = a.trim_prefix("--out=")
	DirAccess.make_dir_recursive_absolute(out)
	SaveManager.save_dir_override = OS.get_cache_dir().path_join("mythlings_cshots")
	DirAccess.make_dir_recursive_absolute(SaveManager.save_dir_override)
	GameState.data = GameState.default_data()
	GameState.set_flag("intro_done")
	GameState.set_flag("tutorial_step", 99)
	for id in ["mossbun", "sunfox", "cloverling", "bloomtail"]:
		GameState.discover(id, "whispering_woods")
		GameState.add_friendship(id, 75)
	GameState.data.companion = "mossbun"
	GameState.data.sanctuary = {"oak": 2}
	GameState.data.player.level = 5
	GameState.add_item("glimmerroot", 2, false)
	GameState.add_currency("star_gems", 1600)
	var game: Node = load("res://scenes/main/game.tscn").instantiate()
	get_tree().root.add_child.call_deferred(game)
	await get_tree().create_timer(3.0).timeout
	var ui: GameUI = game.ui
	var lvl := MeadowLevel.current
	lvl.sky.time = 0.42
	lvl.sky.paused = true
	var p := lvl.player
	# Mythlings panel with evolution ready.
	ui.open_panel("creatures", {"creature": "mossbun"})
	await get_tree().create_timer(2.5).timeout
	snap("creatures_panel")
	var cp: CreaturesPanel = ui.panels.creatures
	(cp._detail.get_parent() as ScrollContainer).scroll_vertical = 900
	await get_tree().create_timer(0.6).timeout
	snap("creatures_evolution")
	cp.close()
	await get_tree().create_timer(0.4).timeout
	# Evolve + cinematic.
	Evolution.evolve("mossbun", 0)
	ui.play_evolution("mossbun", "mosswarden")
	for i in 6:
		await get_tree().create_timer(1.2).timeout
		snap("evolve_t%d" % i)
	await get_tree().create_timer(3.0).timeout
	snap("evolve_reveal")
	ui.evolution.close()
	ui.hud._dlg_queue.clear()
	ui.hud._dialogue.visible = false
	# Market: Ignaroth.
	ui.open_panel("market", {"category": "colossal"})
	cp = null
	var mp: MarketPanel = ui.panels.market
	mp._search.set_meta("colossal_sel", "ignaroth")
	mp._render()
	await get_tree().create_timer(2.6).timeout
	snap("market_ignaroth")
	mp._size_ref = true
	mp._product = "colossal_ignaroth"
	mp._render()
	await get_tree().create_timer(2.0).timeout
	print("viewer size ", mp._viewer.size, " vp ", mp._viewer.vp.size, " in tree ", mp._viewer.is_inside_tree(), " vis ", mp._viewer.is_visible_in_tree(), " current ", mp._viewer.current)
	snap("market_ignaroth_size")
	Store.purchase("colossal_ignaroth")
	mp.close()
	await get_tree().create_timer(0.5).timeout
	# World: Mosswarden companion + ability.
	p.input_locked = false
	p.global_position = lvl.ground(30, 40) + Vector3(0, 0.3, 0)
	p._yaw = 2.6
	p.rotation.y = 2.6
	lvl.refresh_creatures()
	var mw: Creature = lvl.creatures.mosswarden
	mw.global_position = p.global_position + Vector3(-2.0, 0, -3.0)
	await get_tree().create_timer(1.5).timeout
	Abilities.activate(mw, "grove_call")
	await get_tree().create_timer(0.5).timeout
	snap("world_mosswarden_ability")
	# Ignaroth summoned and flying.
	lvl.summon("ignaroth")
	await get_tree().create_timer(1.5).timeout
	var ig: Creature = lvl.creatures.ignaroth
	p._yaw = ig.rotation.y + 2.2
	p._pitch = -0.15
	snap("world_ignaroth")
	p.global_position = ig.global_position
	p.mount_creature(ig)
	p.jump_held = true
	p.touch_move = Vector2(0, -1)
	await get_tree().create_timer(3.5).timeout
	p.jump_held = false
	await get_tree().create_timer(0.5).timeout
	snap("world_flying")
	get_tree().quit()
