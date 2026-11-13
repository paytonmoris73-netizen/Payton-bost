extends Node
## Renders one creature in a ModelViewer: godot res://tests/model_shot.tscn -- --id=x --out=file.png
func _ready() -> void:
	var id := "mossmantle"
	var out := "user://model.png"
	var yaw := 0.6
	var kind := "creature"
	for a in OS.get_cmdline_user_args():
		if a.begins_with("--id="): id = a.trim_prefix("--id=")
		if a.begins_with("--out="): out = a.trim_prefix("--out=")
		if a.begins_with("--yaw="): yaw = float(a.trim_prefix("--yaw="))
		if a.begins_with("--kind="): kind = a.trim_prefix("--kind=")
	var mv := ModelViewer.new()
	mv.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	mv.auto_rotate = false
	add_child(mv)
	mv.show_item(kind, id)
	mv._yaw = yaw
	await get_tree().create_timer(1.5).timeout
	get_viewport().get_texture().get_image().save_png(out)
	get_tree().quit()
