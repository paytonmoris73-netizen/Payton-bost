class_name CreatureInteractPanel
extends Control
## Compact side card shown when interacting with a discovered Mythling:
## Greet / Pet / Treat / Play / Companion / Ride. Keeps the creature visible.

var creature: Creature
var _card: PanelContainer
var _title: Label
var _hearts_box: HBoxContainer
var _bar: ProgressBar
var _buttons: VBoxContainer
var _treats: HFlowContainer
var _msg: Label
var game_ui: Node

func _init() -> void:
	set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	mouse_filter = Control.MOUSE_FILTER_IGNORE
	visible = false

func build() -> void:
	theme = UITheme.get_theme()
	_card = PanelContainer.new()
	_card.anchor_left = 1.0
	_card.anchor_right = 1.0
	_card.anchor_top = 0.5
	_card.anchor_bottom = 0.5
	_card.offset_left = -470
	_card.offset_right = -24
	_card.offset_top = -330
	_card.offset_bottom = 330
	add_child(_card)
	var v := UIKit.vbox(10)
	_card.add_child(v)
	var top := UIKit.hbox(8)
	_title = UIKit.label("", "Heading", 30)
	_title.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	top.add_child(_title)
	var x := UIKit.button("", "close", "", 54, 24)
	x.custom_minimum_size.x = 54
	x.pressed.connect(close)
	top.add_child(x)
	v.add_child(top)
	_hearts_box = UIKit.hbox(4)
	v.add_child(_hearts_box)
	_bar = ProgressBar.new()
	_bar.theme_type_variation = "HeartBar"
	_bar.show_percentage = false
	_bar.max_value = 1.0
	_bar.custom_minimum_size.y = 12
	v.add_child(_bar)
	_buttons = UIKit.vbox(8)
	v.add_child(_buttons)
	_treats = HFlowContainer.new()
	_treats.add_theme_constant_override("h_separation", 8)
	_treats.add_theme_constant_override("v_separation", 8)
	_treats.visible = false
	v.add_child(_treats)
	_msg = UIKit.label("", "Caption", 17, Color(0, 0, 0, 0), true)
	v.add_child(_msg)
	Events.friendship_changed.connect(_on_friendship)

func _on_friendship(_id: String, _p: int, _l: int) -> void:
	if visible:
		_refresh_header()

func open(c: Creature) -> void:
	creature = c
	visible = true
	_msg.text = ""
	_treats.visible = false
	_refresh()
	_card.modulate.a = 0.0
	_card.position.x += 60
	var tw := create_tween().set_parallel(true)
	tw.tween_property(_card, "modulate:a", 1.0, 0.2)
	tw.tween_property(_card, "position:x", _card.position.x - 60, 0.25).set_trans(Tween.TRANS_CUBIC).set_ease(Tween.EASE_OUT)
	var p: Player = MeadowLevel.current.player
	p.input_locked = true
	p.focus_on(c.focus_point() + Vector3(0, 0.3, 0))
	p.face_camera_toward(c.global_position)

func close() -> void:
	visible = false
	var p: Player = MeadowLevel.current.player if MeadowLevel.current else null
	if p:
		p.input_locked = false
		p.clear_focus()

func _refresh_header() -> void:
	var id := creature.data.id
	_title.text = creature.data.display_name
	UIKit.clear(_hearts_box)
	_hearts_box.add_child(UIKit.hearts(GameState.friendship_level(id), 5, 26.0))
	_bar.value = GameState.friendship_progress(id)

func _refresh() -> void:
	_refresh_header()
	UIKit.clear(_buttons)
	var c := creature
	var id := c.data.id
	_add("Greet", "hand", func(): _result(c.do_greet(), "%s chirps hello!" % c.data.display_name))
	_add("Pet", "heart", func(): _result(c.do_pet(), "%s leans into your hand." % c.data.display_name))
	_add("Offer a treat", "berry", _toggle_treats)
	_add("Play together", "sparkle", func():
		visible = false
		Events.request_panel.emit("play", {"creature": c}))
	if not c.data.is_colossal() or GameState.friendship_level(id) >= 1:
		var is_comp := GameState.companion() == id
		var comp_cb := func():
			if is_comp:
				GameState.set_companion("")
				_msg.text = "%s heads home." % c.data.display_name
			elif GameState.friendship_level(id) < 1:
				_msg.text = "%s isn't quite ready. Spend a little more time together." % c.data.display_name
				return
			else:
				GameState.set_companion(id)
				_msg.text = "%s will follow you now!" % c.data.display_name
				c.emote("happy")
			_refresh()
		_add("Send home" if is_comp else "Invite as companion", "paw", comp_cb, "PrimaryButton" if not is_comp else "")
	if c.data.rideable and c.data.model_ready:
		var p: Player = MeadowLevel.current.player
		var can := p.can_mount(c)
		var rb := _add("Ride" if can else "Ride (friendship 3)", "ride", func():
			close()
			p.mount_creature(c))
		rb.disabled = not can
	_add("Open in Journal", "book", func():
		close()
		Events.request_panel.emit("journal", {"creature": id}))

func _add(text: String, icon: String, cb: Callable, variation := "") -> Button:
	var b := UIKit.button(text, icon, variation, 58, 26)
	b.pressed.connect(cb)
	_buttons.add_child(b)
	return b

func _toggle_treats() -> void:
	_treats.visible = not _treats.visible
	UIKit.clear(_treats)
	var any := false
	for d in DB.items.values():
		if d.category != "treat" or GameState.item_count(d.id) <= 0:
			continue
		any = true
		var fav: bool = d.id == creature.data.favorite_treat and GameState.friendship_level(creature.data.id) >= 1
		var b := UIKit.button("%s ×%d%s" % [d.display_name, GameState.item_count(d.id), " ★" if fav else ""], d.icon, "", 52, 24)
		var tid: String = d.id
		b.pressed.connect(func():
			var g := creature.do_treat(tid)
			_result(g, "%s munches happily." % creature.data.display_name)
			_toggle_treats()
			_treats.visible = false)
		_treats.add_child(b)
	if not any:
		_treats.add_child(UIKit.label("No treats in your bag. Pick sunberries or visit the Grand Market.", "Caption", 16, Color(0, 0, 0, 0), true))

func _result(gain: int, text: String) -> void:
	_msg.text = text + ("  +%d friendship" % gain if gain > 0 else "")
	if gain <= 1:
		_msg.text += "\n(%s enjoyed that, but needs a little rest before it counts as much again.)" % creature.data.display_name
	_refresh_header()
