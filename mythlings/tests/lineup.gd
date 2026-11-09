extends Node
## In-world lineup of evolved forms and colossals next to the Keeper.
var out := "user://lineup"
func _ready() -> void:
	for a in OS.get_cmdline_user_args():
		if a.begins_with("--out="):
			out = a.trim_prefix("--out=")
	SaveManager.save_dir_override = OS.get_cache_dir().path_join("mythlings_lineup")
	DirAccess.make_dir_recursive_absolute(SaveManager.save_dir_override)
	GameState.data = GameState.default_data()
	GameState.set_flag("intro_done")
	GameState.set_flag("tutorial_step", 99)
	var game: Node = load("res://scenes/main/game.tscn").instantiate()
	get_tree().root.add_child.call_deferred(game)
	await get_tree().create_timer(3.0).timeout
	var lvl := MeadowLevel.current
	lvl.sky.time = 0.4
	lvl.sky.paused = true
	var p := lvl.player
	var ids := ["shamrelle", "cloudwell", "cairnback", "dawnstrider", "blossomere", "mosswarden", "glimmerhare"]
	var base := lvl.ground(30, 42)
	var x := -9.0
	for id in ids:
		var c := Creature.new()
		c.setup(DB.creature(id), Creature.Mode.DISPLAY, base)
		lvl.add_child(c)
		var w := 1.2 + DB.creature(id).height * 0.6
		x += w * 0.5
		c.global_position = lvl.ground(base.x + x, base.z)
		c.rotation.y = 0.0
		x += w * 0.5 + 0.4
	p.global_position = lvl.ground(base.x - 10.0, base.z - 1.0)
	p.rotation.y = 0.0
	p.input_locked = true
	var cam := Camera3D.new()
	lvl.add_child(cam)
	cam.global_position = base + Vector3(-1.5, 3.2, -13.0)
	cam.look_at(base + Vector3(-1.5, 1.3, 0))
	cam.fov = 55
	cam.current = true
	await get_tree().create_timer(2.0).timeout
	get_viewport().get_texture().get_image().save_png(out + "/lineup.png")
	var av := Creature.new()
	av.setup(DB.creature("astravyth"), Creature.Mode.DISPLAY, base)
	lvl.add_child(av)
	av.global_position = base + Vector3(0, 14, 10)
	av.rig.wing_spread = 1.0
	av.rig.locomotion = "fly"
	av.rotation.y = 0.8
	var ig := Creature.new()
	ig.setup(DB.creature("ignaroth"), Creature.Mode.DISPLAY, base)
	lvl.add_child(ig)
	ig.global_position = lvl.ground(base.x + 14, base.z + 14)
	ig.rotation.y = -0.6
	cam.global_position = base + Vector3(-4, 5, -16)
	cam.look_at(base + Vector3(4, 7, 8))
	await get_tree().create_timer(2.0).timeout
	get_viewport().get_texture().get_image().save_png(out + "/colossals.png")
	get_tree().quit()
