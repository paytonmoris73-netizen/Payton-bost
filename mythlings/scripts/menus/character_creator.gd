extends Node3D
## First-time character creation (simple by design), then into the world.

func _ready() -> void:
	var sky := SkyCycle.new()
	add_child(sky)
	sky.time = 0.42
	sky.paused = true
	var cam := Camera3D.new()
	add_child(cam)
	cam.current = true
	var layer := CanvasLayer.new()
	add_child(layer)
	var panel := CustomizePanel.new()
	layer.add_child(panel)
	panel.open({"first_time": true})
	panel.title_label.text = "Create your Keeper"
	panel.dim.color = Color(0.05, 0.1, 0.08, 0.35)
	panel.dim.gui_input.disconnect(panel._on_dim_input)
	panel.finished.connect(_begin)

func _begin() -> void:
	GameState.session_active = true
	SaveManager.save_game()
	Router.go("res://scenes/main/game.tscn")
