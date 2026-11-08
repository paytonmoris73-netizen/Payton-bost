class_name DiscoverPanel
extends Control
## The "new Mythling discovered" moment: camera focus, creature reveal
## animation, then a collectible card.

var _card: PanelContainer
var _viewer: ModelViewer
var _name: Label
var _sub: Label
var _desc: Label
var _pills: HBoxContainer
var creature: Creature

func _init() -> void:
	set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	mouse_filter = Control.MOUSE_FILTER_STOP
	visible = false

func build() -> void:
	theme = UITheme.get_theme()
	var dim := ColorRect.new()
	dim.color = Color(0.03, 0.06, 0.05, 0.45)
	dim.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	add_child(dim)
	_card = PanelContainer.new()
	_card.set_anchors_preset(Control.PRESET_CENTER)
	_card.custom_minimum_size = Vector2(620, 0)
	add_child(_card)
	var v := UIKit.vbox(10)
	_card.add_child(v)
	var tag := UIKit.label("NEW MYTHLING DISCOVERED", "Title", 22, Palette.GOLD_DARK)
	tag.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	v.add_child(tag)
	_viewer = ModelViewer.new()
	_viewer.custom_minimum_size = Vector2(560, 320)
	v.add_child(_viewer)
	_name = UIKit.label("", "Heading", 44)
	_name.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	v.add_child(_name)
	_pills = UIKit.hbox(8)
	_pills.alignment = BoxContainer.ALIGNMENT_CENTER
	v.add_child(_pills)
	_sub = UIKit.label("", "Caption", 18)
	_sub.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	v.add_child(_sub)
	_desc = UIKit.label("", "", 19, Color(0, 0, 0, 0), true)
	_desc.custom_minimum_size.x = 560
	_desc.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	v.add_child(_desc)
	var row := UIKit.hbox(10)
	row.alignment = BoxContainer.ALIGNMENT_CENTER
	var ok := UIKit.button("Wonderful!", "heart", "PrimaryButton", 62)
	ok.pressed.connect(close)
	row.add_child(ok)
	var j := UIKit.button("View in Journal", "book", "", 62)
	j.pressed.connect(func():
		var id := creature.data.id
		close()
		Events.request_panel.emit("journal", {"creature": id}))
	row.add_child(j)
	v.add_child(row)

func open(c: Creature) -> void:
	creature = c
	var p: Player = MeadowLevel.current.player
	p.input_locked = true
	p.focus_on(c.focus_point())
	p.face_camera_toward(c.global_position)
	c.face_toward(p.global_position)
	c.emote("discovery", 2.0)
	Audio.play_sfx("discovery")
	FX.burst(c.get_parent(), c.global_position + Vector3(0, c.data.height * 0.6, 0), Color("fff2b0"), 50, 0.07 if not c.data.is_colossal() else 0.3, 4.0, 1.6, -0.5)
	# Let the in-world reveal play before the card appears.
	await get_tree().create_timer(1.5).timeout
	var where := ""
	for l in MeadowLevel.LOCATIONS:
		if MeadowLevel.LOC.has(l[0]) and MeadowLevel.current.at(l[0]).distance_to(c.global_position) < l[2] + 8.0:
			where = l[0]
			break
	GameState.discover(c.data.id, where)
	_name.text = c.data.display_name
	_sub.text = "Habitat: %s" % c.data.habitat
	_desc.text = c.data.description
	UIKit.clear(_pills)
	_pills.add_child(UIKit.rarity_pill(c.data.rarity))
	for e in c.data.elements:
		_pills.add_child(UIKit.element_pill(e))
	_viewer.show_item("colossal" if c.data.is_colossal() else "creature", c.data.id)
	_viewer.play("happy")
	visible = true
	_card.pivot_offset = _card.size * 0.5
	_card.scale = Vector2.ONE * 0.7
	_card.modulate.a = 0.0
	var tw := create_tween().set_parallel(true)
	tw.tween_property(_card, "scale", Vector2.ONE, 0.45).set_trans(Tween.TRANS_BACK).set_ease(Tween.EASE_OUT)
	tw.tween_property(_card, "modulate:a", 1.0, 0.3)
	_card.position = (get_viewport_rect().size - _card.size) * 0.5

func close() -> void:
	visible = false
	_viewer.clear()
	var p: Player = MeadowLevel.current.player if MeadowLevel.current else null
	if p:
		p.input_locked = false
		p.clear_focus()
	SaveManager.save_game()
