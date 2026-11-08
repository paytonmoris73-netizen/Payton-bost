class_name PausePanel
extends UIPanel
## Pause menu. Pauses the world while open.

func build_content() -> void:
	pauses_game = true
	max_size = Vector2(620, 760)
	setup_frame("Paused", "pause")
	var v := UIKit.vbox(12)
	for item in [["Resume", "play", "PrimaryButton", "resume"], ["Profile & Customise", "person", "", "profile"], ["Achievements", "trophy", "", "achievements"], ["Friends", "friends", "", "friends"], ["Settings", "gear", "", "settings"], ["Save & return to title", "back", "", "quit"]]:
		var b := UIKit.button(item[0], item[1], item[2], 66)
		var act: String = item[3]
		b.pressed.connect(func(): _act(act))
		v.add_child(b)
	body.add_child(v)

func _act(a: String) -> void:
	match a:
		"resume":
			close()
		"quit":
			SaveManager.save_game()
			get_tree().paused = false
			GameState.session_active = false
			Router.go("res://scenes/menus/main_menu.tscn")
		_:
			await close()
			Events.request_panel.emit(a, {})
