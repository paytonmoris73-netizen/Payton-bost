class_name SettingsPanel
extends UIPanel
## Audio, controls, graphics, accessibility and save management.

var _box: VBoxContainer

func build_content() -> void:
	setup_frame("Settings", "gear")
	max_size = Vector2(980, 860)
	_box = UIKit.vbox(14)
	body.add_child(UIKit.scroll(_box))

func refresh() -> void:
	UIKit.clear(_box)
	_section("Audio")
	_slider("Master volume", "master", 0.0, 1.0)
	_slider("Music", "music", 0.0, 1.0)
	_slider("Sound effects", "sfx", 0.0, 1.0)
	_toggle("Mute all audio", "muted")
	_section("Controls")
	_slider("Camera sensitivity", "sensitivity", 0.3, 2.5)
	_toggle("Invert camera Y", "invert_y")
	_slider("Joystick size", "joystick_size", 0.7, 1.4)
	_section("Graphics")
	var row := UIKit.hbox(10)
	row.add_child(_label("Quality"))
	for q in ["low", "medium", "high"]:
		var b := UIKit.button(q.capitalize(), "", "TabButton", 50)
		b.toggle_mode = true
		b.button_pressed = GameState.setting("graphics") == q
		b.pressed.connect(func():
			GameState.set_setting("graphics", q)
			refresh())
		row.add_child(b)
	_box.add_child(row)
	_box.add_child(UIKit.label("Low turns off shadows and glow and reduces grass for older phones. Grass density applies the next time the meadow loads.", "Caption", 16, Color(0, 0, 0, 0), true))
	_toggle("Show FPS counter", "show_fps")
	_section("Accessibility")
	_toggle("Reduce camera motion", "reduce_motion")
	_section("Save data")
	var srow := UIKit.hbox(10)
	var save := UIKit.button("Save now", "check", "PrimaryButton", 56)
	save.pressed.connect(func():
		var ok := SaveManager.save_game()
		Events.toast.emit("Saved" if ok else "Save failed", "" if ok else SaveManager.last_error, "check"))
	srow.add_child(save)
	var bk := UIKit.button("Export backup", "chest", "", 56)
	bk.pressed.connect(func():
		var p := SaveManager.export_backup()
		Events.toast.emit("Backup written" if p != "" else "Backup failed", p, "chest"))
	srow.add_child(bk)
	_box.add_child(srow)
	_box.add_child(UIKit.label("Cloud saves are not available in this build; backups are stored on this device.", "Caption", 16, Color(0, 0, 0, 0), true))

func _section(t: String) -> void:
	_box.add_child(UIKit.label(t, "Title", 24, Palette.MOSS_DARK))

func _label(t: String) -> Label:
	var l := UIKit.label(t, "", 20)
	l.custom_minimum_size.x = 260
	return l

func _slider(t: String, key: String, lo: float, hi: float) -> void:
	var row := UIKit.hbox(10)
	row.add_child(_label(t))
	var s := HSlider.new()
	s.min_value = lo
	s.max_value = hi
	s.step = 0.05
	s.value = float(GameState.setting(key))
	s.custom_minimum_size = Vector2(360, 40)
	s.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	var val := UIKit.label("%d%%" % int(s.value * 100), "Caption", 18)
	val.custom_minimum_size.x = 70
	s.value_changed.connect(func(v):
		GameState.set_setting(key, v)
		val.text = "%d%%" % int(v * 100))
	row.add_child(s)
	row.add_child(val)
	_box.add_child(row)

func _toggle(t: String, key: String) -> void:
	var c := CheckButton.new()
	c.text = t
	c.focus_mode = Control.FOCUS_NONE
	c.button_pressed = bool(GameState.setting(key))
	c.custom_minimum_size.y = 48
	c.toggled.connect(func(v): GameState.set_setting(key, v))
	_box.add_child(c)

func close() -> void:
	SaveManager.save_game()
	super.close()
