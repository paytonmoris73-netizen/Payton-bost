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
	var ember := "--ember" in OS.get_cmdline_user_args()
	if ember:
		GameState.data.player.region = "emberfall"
		GameState.data.player.level = 6
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
	if ember:
		shots = [["e_village", Vector3(-6, 0, 22), 0.2, -0.22, 0.4], ["e_lava", Vector3(26, 0, 30), -1.9, -0.3, 0.42], ["e_forge", Vector3(60, 0, -22), -0.65, -0.2, 0.45], ["e_ridge", Vector3(-30, 0, 4), 1.1, -0.1, 0.62], ["e_lake", Vector3(-24, 0, 44), 0.9, -0.2, 0.7], ["e_night", Vector3(-6, 0, 22), 0.2, -0.22, 0.88]]
	if "--detail" in OS.get_cmdline_user_args():
		shots = [["plaza", Vector3(-6, 0, -14), 2.6, -0.28, 0.4], ["windmill", Vector3(24, 0, 30), -0.9, -0.15, 0.62], ["river", Vector3(-26, 0, 40), 1.3, -0.3, 0.45], ["glade", Vector3(-70, 0, 10), 0.6, -0.2, 0.36]]
	if "--progress" in OS.get_cmdline_user_args():
		shots = [["verdantus", Vector3(-68, 0, -36), 0.75, -0.08, 0.45], ["sanctuary", Vector3(46, 0, -14), -0.86, -0.2, 0.45], ["sanctuary_night", Vector3(46, 0, -14), -0.86, -0.2, 0.9], ["companion", Vector3(-60, 0, 0), 0.8, -0.3, 0.4]]
	var lvl: MeadowLevel = MeadowLevel.current
	var p: Player = lvl.player
	if "--progress" in OS.get_cmdline_user_args():
		var v: Creature = lvl.creatures.get("verdantus")
		if v:
			v.mode = Creature.Mode.DISPLAY
			var vp := v.global_position
			var from := vp + Vector3(9, 0, 10)
			shots[0] = ["verdantus", from, atan2(-(vp.x - from.x), -(vp.z - from.z)), 0.05, 0.45]
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
	if "--progress" in OS.get_cmdline_user_args() and lvl.creatures.has("verdantus"):
		var v: Creature = lvl.creatures.verdantus
		v.mode = Creature.Mode.WILD
		v.global_position = lvl.ground(22, 34)
		p.global_position = v.global_position + Vector3(0, 0.5, 0)
		p.mount_creature(v)
		p.touch_move = Vector2(0, -1)
		p._yaw = v.rotation.y + 2.4
		p._pitch = -0.25
		await get_tree().create_timer(3.0).timeout
		get_viewport().get_texture().get_image().save_png(out.path_join("riding.png"))
		print("[tour] riding")
	get_tree().quit()

func _progress() -> void:
	for id in ["mossbun", "sunfox", "cloverling", "verdantus"]:
		GameState.discover(id, "")
		GameState.add_friendship(id, 50)
	GameState.data.companion = "mossbun"
	GameState.data.sanctuary = {"oak": 3, "shrine": 1, "bridge": 1}
	GameState.data.owned = ["deco_stone_lantern", "deco_flower_arch", "deco_mossy_fountain"]
	GameState.data.player.level = 6
