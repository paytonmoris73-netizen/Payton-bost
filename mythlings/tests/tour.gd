extends Node
## Visual verification tour: loads the game, teleports to landmarks and saves
## screenshots. Usage: godot res://tests/tour.tscn -- --out=/dir [--progress]

var out := "user://tour"
var game: Node

func _ready() -> void:
	for a in OS.get_cmdline_user_args():
		if a.begins_with("--out="):
			out = a.trim_prefix("--out=")
	DirAccess.make_dir_recursive_absolute(out)
	SaveManager.save_dir_override = OS.get_cache_dir().path_join("mythlings_tour")
	DirAccess.make_dir_recursive_absolute(SaveManager.save_dir_override)
	GameState.data = GameState.default_data()
	GameState.set_flag("intro_done")
	GameState.set_flag("tutorial_step", 99)
	if "--progress" in OS.get_cmdline_user_args():
		_progress()
	game = load("res://scenes/main/game.tscn").instantiate()
	get_tree().root.add_child.call_deferred(game)
	await get_tree().create_timer(3.0).timeout
	var shots := [
		["village", Vector3(10, 0, 22), 0.4, -0.25, 0.42],
		["oak", Vector3(52, 0, -8), 0.6, -0.2, 0.45],
		["woods", Vector3(-48, 0, 4), 1.3, -0.15, 0.4],
		["falls", Vector3(-36, 0, -50), 0.05, -0.12, 0.5],
		["clearing", Vector3(30, 0, 44), -0.9, -0.2, 0.55],
		["bridge", Vector3(-22, 0, 14), 1.1, -0.18, 0.62],
		["dusk", Vector3(10, 0, 22), 0.4, -0.25, 0.79],
		["night", Vector3(10, 0, 22), 0.4, -0.25, 0.92],
	]
	if "--progress" in OS.get_cmdline_user_args():
		shots = [["verdantus", Vector3(-70, 0, -40), 1.9, -0.18, 0.45], ["sanctuary", Vector3(48, 0, -18), 0.85, -0.22, 0.45], ["companion", Vector3(-60, 0, 0), 0.8, -0.3, 0.4]]
	var lvl: MeadowLevel = MeadowLevel.current
	var p: Player = lvl.player
	for s in shots:
		var pos: Vector3 = s[1]
		pos.y = lvl.terrain.height(pos.x, pos.z) + 0.2
		p.global_position = pos
		p.rotation.y = s[2]
		p._yaw = s[2]
		p._pitch = s[3]
		lvl.sky.time = s[4]
		lvl.sky.paused = true
		var comp := lvl.companion_creature()
		if comp:
			comp.global_position = pos + Vector3(1.2, 0, 1.0)
		p.cam_yaw.global_position = pos + Vector3(0, 1.45, 0)
		await get_tree().create_timer(2.5).timeout
		get_viewport().get_texture().get_image().save_png(out.path_join(s[0] + ".png"))
		print("[tour] ", s[0])
	get_tree().quit()

func _progress() -> void:
	for id in ["mossbun", "sunfox", "cloverling", "verdantus"]:
		GameState.discover(id, "")
		GameState.add_friendship(id, 50)
	GameState.data.companion = "mossbun"
	GameState.data.sanctuary = {"oak": 3, "shrine": 1, "bridge": 1}
	GameState.data.owned = ["deco_stone_lantern", "deco_flower_arch", "deco_mossy_fountain"]
	GameState.data.player.level = 6
