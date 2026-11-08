class_name CreaturesPanel
extends UIPanel
## Your Mythlings: choose a companion, place Mythlings in the Ancient Oak
## habitat, and equip owned cosmetics.

var _list: VBoxContainer
var _detail: VBoxContainer
var _viewer: ModelViewer
var _selected := ""

func build_content() -> void:
	setup_frame("Your Mythlings", "paw")
	var split := UIKit.hbox(16)
	split.size_flags_vertical = Control.SIZE_EXPAND_FILL
	body.add_child(split)
	_list = UIKit.vbox(8)
	var sc := UIKit.scroll(_list)
	sc.custom_minimum_size.x = 400
	sc.size_flags_horizontal = Control.SIZE_FILL
	split.add_child(sc)
	var card := UIKit.card()
	card.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	card.size_flags_vertical = Control.SIZE_EXPAND_FILL
	_detail = UIKit.vbox(10)
	card.add_child(UIKit.scroll(_detail))
	split.add_child(card)
	_viewer = ModelViewer.new()
	_viewer.custom_minimum_size = Vector2(0, 280)

func _owned() -> Array:
	var out: Array = []
	for c in DB.standard_creatures() + DB.colossal_creatures():
		if GameState.is_discovered(c.id):
			out.append(c)
	return out

func refresh() -> void:
	UIKit.clear(_list)
	var owned := _owned()
	var hab: Array = GameState.data.flags.get("habitat", [])
	var slots := MeadowLevel.current.habitat_slots() if MeadowLevel.current else 0
	_list.add_child(UIKit.label("Ancient Oak habitat: %d / %d" % [hab.size(), slots], "Title", 20, Palette.MOSS_DARK))
	if slots == 0:
		_list.add_child(UIKit.label("Restore the Ancient Oak Sanctuary to give Mythlings a home.", "Caption", 16, Color(0, 0, 0, 0), true))
	if owned.is_empty():
		_list.add_child(UIKit.label("You haven't befriended any Mythlings yet. Elder Rowan knows where to start!", "", 19, Color(0, 0, 0, 0), true))
	for c in owned:
		var tag := ""
		if GameState.companion() == c.id:
			tag = "  · Companion"
		elif c.id in hab:
			tag = "  · Sanctuary"
		var b := UIKit.button(c.display_name + tag, IconGlyph.element_icon(c.primary_element()), "", 60, 26)
		b.custom_minimum_size.x = 380
		if c.id == _selected:
			b.add_theme_stylebox_override("normal", UITheme.box(Palette.CARD, 16, Palette.GOLD, 3, 0, 16))
		var id: String = c.id
		b.pressed.connect(func():
			_selected = id
			refresh())
		_list.add_child(b)
	if _selected == "" and owned.size() > 0:
		_selected = owned[0].id
	_show(_selected)

func _show(id: String) -> void:
	if _viewer.get_parent():
		_viewer.get_parent().remove_child(_viewer)
	UIKit.clear(_detail)
	var c: CreatureData = DB.creature(id)
	if c == null or not GameState.is_discovered(id):
		return
	_detail.add_child(_viewer)
	var cosm := GameState.creature_cosmetic(id)
	var acc := String(GameState.data.flags.get("acc_" + id, ""))
	_viewer.show_item("colossal" if c.is_colossal() else "creature", id + ":" + (cosm.split(":")[2] if cosm.begins_with("variant:") else "") + ":" + acc)
	_detail.add_child(UIKit.label(c.display_name, "Heading", 32))
	var fr := UIKit.hbox(10)
	fr.add_child(UIKit.hearts(GameState.friendship_level(id), 5, 24.0))
	fr.add_child(UIKit.label("Friendship %d" % GameState.friendship(id), "Caption", 18))
	_detail.add_child(fr)
	_detail.add_child(UIKit.label("Ability: %s — %s" % [c.ability_name, c.ability_text], "", 19, Color(0, 0, 0, 0), true))
	var row := HFlowContainer.new()
	row.add_theme_constant_override("h_separation", 10)
	row.add_theme_constant_override("v_separation", 10)
	var is_comp := GameState.companion() == id
	var comp := UIKit.button("Send home" if is_comp else "Make companion", "paw", "" if is_comp else "PrimaryButton", 58)
	comp.disabled = not is_comp and GameState.friendship_level(id) < 1
	comp.pressed.connect(func():
		if is_comp:
			GameState.set_companion("")
		else:
			GameState.set_companion(id)
			var hab: Array = GameState.data.flags.get("habitat", [])
			hab.erase(id)
			GameState.data.flags["habitat"] = hab
		refresh())
	row.add_child(comp)
	if not c.is_colossal():
		var hab: Array = GameState.data.flags.get("habitat", [])
		var in_hab: bool = id in hab
		var slots := MeadowLevel.current.habitat_slots() if MeadowLevel.current else 0
		var hb := UIKit.button("Leave sanctuary" if in_hab else "Place in sanctuary", "leaf", "", 58)
		hb.disabled = not in_hab and (hab.size() >= slots or is_comp)
		hb.pressed.connect(func():
			var h2: Array = GameState.data.flags.get("habitat", [])
			if id in h2:
				h2.erase(id)
			else:
				h2.append(id)
			GameState.data.flags["habitat"] = h2
			if MeadowLevel.current:
				MeadowLevel.current.refresh_creatures()
			refresh())
		row.add_child(hb)
	_detail.add_child(row)
	if GameState.friendship_level(id) < 1:
		_detail.add_child(UIKit.label("Spend a little time together (friendship level 1) before inviting %s along." % c.display_name, "Caption", 16, Color(0, 0, 0, 0), true))
	# Cosmetics this player owns for this creature.
	var variants: Array = [["Default", ""]]
	for p in DB.shop.values():
		var g: String = p.grants.get("cosmetic", "")
		if g.begins_with("variant:%s:" % id) and GameState.owns(p.id):
			variants.append([p.display_name, g])
	_detail.add_child(UIKit.label("Appearance", "Title", 20))
	var vr := HFlowContainer.new()
	vr.add_theme_constant_override("h_separation", 8)
	for v in variants:
		var b := UIKit.button(v[0], "", "TabButton", 48)
		b.toggle_mode = true
		b.button_pressed = cosm == v[1]
		var val: String = v[1]
		b.pressed.connect(func():
			GameState.set_creature_cosmetic(id, val)
			_rebuild_world_creature(id)
			refresh())
		vr.add_child(b)
	_detail.add_child(vr)
	var accs: Array = [["None", ""]]
	for p in DB.shop.values():
		var g: String = p.grants.get("cosmetic", "")
		if g.begins_with("acc:") and Store.owns_cosmetic(g) and not ([p.display_name, g.split(":")[1]] in accs):
			var already := false
			for a in accs:
				if a[1] == g.split(":")[1]:
					already = true
			if not already:
				accs.append([p.display_name, g.split(":")[1]])
	_detail.add_child(UIKit.label("Accessory", "Title", 20))
	var ar := HFlowContainer.new()
	ar.add_theme_constant_override("h_separation", 8)
	for a in accs:
		var b := UIKit.button(a[0], "", "TabButton", 48)
		b.toggle_mode = true
		b.button_pressed = acc == a[1]
		var val: String = a[1]
		b.pressed.connect(func():
			GameState.data.flags["acc_" + id] = val
			_rebuild_world_creature(id)
			refresh())
		ar.add_child(b)
	_detail.add_child(ar)
	if variants.size() == 1 and accs.size() == 1:
		_detail.add_child(UIKit.label("Cosmetic coats and accessories are available in the Grand Market. They never change abilities.", "Caption", 16, Color(0, 0, 0, 0), true))

func _rebuild_world_creature(id: String) -> void:
	if MeadowLevel.current and MeadowLevel.current.creatures.has(id):
		MeadowLevel.current.creatures[id].rebuild_model()
