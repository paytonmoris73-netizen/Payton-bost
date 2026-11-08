class_name CustomizePanel
extends UIPanel
## Character customisation with live 3D preview. Free options are always
## available; market clothing appears here once owned (locked otherwise).

var _viewer: ModelViewer
var _opts: VBoxContainer
var _draft: Dictionary = {}
var _name: LineEdit
var first_time := false
signal finished

func build_content() -> void:
	setup_frame("Customise your Keeper", "person")
	var split := UIKit.hbox(18)
	split.size_flags_vertical = Control.SIZE_EXPAND_FILL
	body.add_child(split)
	_viewer = ModelViewer.new()
	_viewer.custom_minimum_size = Vector2(440, 0)
	_viewer.size_flags_vertical = Control.SIZE_EXPAND_FILL
	split.add_child(_viewer)
	var right := UIKit.vbox(10)
	right.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	_opts = UIKit.vbox(10)
	right.add_child(UIKit.scroll(_opts))
	var row := UIKit.hbox(10)
	var cancel := UIKit.button("Cancel", "close", "", 60)
	cancel.pressed.connect(close)
	cancel.name = "Cancel"
	var save := UIKit.button("Save look", "check", "PrimaryButton", 60)
	save.pressed.connect(_save)
	save.name = "Save"
	row.add_child(cancel)
	row.add_child(save)
	right.add_child(row)
	split.add_child(right)

func on_open(args: Dictionary) -> void:
	first_time = args.get("first_time", false)
	_draft = GameState.data.appearance.duplicate(true)
	_draft["name"] = String(GameState.data.player.name)

func refresh() -> void:
	var c := sheet.find_child("Cancel", true, false)
	if c:
		c.visible = not first_time
	_viewer.show_item("player", "")
	(_viewer.current as PlayerModel).rebuild(_draft)
	UIKit.clear(_opts)
	_opts.add_child(UIKit.label("Name", "Title", 20))
	_name = LineEdit.new()
	_name.text = _draft.name
	_name.max_length = 16
	_name.custom_minimum_size.y = 54
	_name.text_changed.connect(func(t): _draft.name = t)
	_opts.add_child(_name)
	_choice("Skin tone", "skin", DB.SKIN_TONES, true)
	_choice("Hairstyle", "hair_style", DB.HAIR_STYLES, false)
	_choice("Hair colour", "hair_color", DB.HAIR_COLORS, true)
	_choice("Top", "top", DB.ALL_TOPS, false, DB.FREE_TOPS, "top")
	_choice("Top colour", "top_color", DB.OUTFIT_COLORS, true)
	_choice("Trousers", "pants_color", DB.OUTFIT_COLORS, true)
	_choice("Shoes", "shoes_color", ["6b4423", "3b2a20", "c4583f", "f0ebe0", "2f7d86"], true)
	_choice("Hat", "hat", DB.ALL_HATS, false, DB.FREE_HATS, "hat")
	_choice("Backpack", "backpack", DB.ALL_BACKPACKS, false, DB.FREE_BACKPACKS, "backpack")

func _choice(title: String, key: String, values: Array, is_color: bool, free: Array = [], slot := "") -> void:
	_opts.add_child(UIKit.label(title, "Title", 20))
	var flow := HFlowContainer.new()
	flow.add_theme_constant_override("h_separation", 8)
	flow.add_theme_constant_override("v_separation", 8)
	for v in values:
		var locked: bool = slot != "" and not (v in free) and not Store.owns_cosmetic("%s:%s" % [slot, v])
		var b: Button
		if is_color:
			b = Button.new()
			b.focus_mode = Control.FOCUS_NONE
			b.custom_minimum_size = Vector2(54, 54)
			var sel: bool = String(_draft.get(key)) == v
			b.add_theme_stylebox_override("normal", UITheme.box(Color(v), 99, Palette.GOLD if sel else Color.WHITE, 4 if sel else 2))
			b.add_theme_stylebox_override("hover", UITheme.box(Color(v).lightened(0.1), 99, Palette.MOSS_LIGHT, 3))
			b.add_theme_stylebox_override("pressed", UITheme.box(Color(v), 99, Palette.MOSS, 3))
			UIKit.attach_press_feedback(b)
		else:
			b = UIKit.button(String(v).replace("_", " ").capitalize(), "lock" if locked else "", "TabButton", 50, 20)
			b.toggle_mode = true
			b.button_pressed = String(_draft.get(key)) == v
		var val: String = v
		b.pressed.connect(func():
			if locked:
				Events.toast.emit("Available in the Grand Market", "%s can be found in the Clothing store." % val.replace("_", " ").capitalize(), "cart")
				refresh()
				return
			_draft[key] = val
			refresh())
		flow.add_child(b)
	_opts.add_child(flow)

func _save() -> void:
	var nm := String(_draft.get("name", "Keeper")).strip_edges()
	GameState.data.player.name = nm if nm != "" else "Keeper"
	_draft.erase("name")
	GameState.data.appearance = _draft
	Events.appearance_changed.emit()
	Events.xp_changed.emit(GameState.level(), int(GameState.data.player.xp), GameState.xp_to_next())
	SaveManager.save_game()
	await close()
	finished.emit()
