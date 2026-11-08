class_name CreaturesPanel
extends UIPanel
## Your Mythlings: search, sort, favourites, companion/summon, habitat,
## abilities (with comparison), evolution paths and cosmetics.

var _list: VBoxContainer
var _detail: VBoxContainer
var _viewer: ModelViewer
var _search: LineEdit
var _selected := ""
var _sort := "friendship"
var _fav_only := false
var _show_scale := false

func build_content() -> void:
	setup_frame("Your Mythlings", "paw")
	var bar := UIKit.hbox(8)
	_search = LineEdit.new()
	_search.placeholder_text = "Search Mythlings…"
	_search.custom_minimum_size = Vector2(260, 52)
	_search.text_changed.connect(func(_t): refresh())
	bar.add_child(_search)
	var sort := OptionButton.new()
	sort.focus_mode = Control.FOCUS_NONE
	sort.custom_minimum_size = Vector2(220, 52)
	var keys := ["friendship", "size", "element", "rarity", "evolution", "name"]
	for k in keys:
		sort.add_item("Sort: " + k.capitalize())
	sort.item_selected.connect(func(i):
		_sort = keys[i]
		refresh())
	bar.add_child(sort)
	var fav := UIKit.button("Favourites", "star", "TabButton", 52, 22)
	fav.toggle_mode = true
	fav.toggled.connect(func(v):
		_fav_only = v
		refresh())
	bar.add_child(fav)
	body.add_child(bar)
	var split := UIKit.hbox(16)
	split.size_flags_vertical = Control.SIZE_EXPAND_FILL
	body.add_child(split)
	_list = UIKit.vbox(6)
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
	_viewer.custom_minimum_size = Vector2(0, 300)

func on_open(args: Dictionary) -> void:
	if args.has("creature"):
		_selected = args.creature

func _owned() -> Array:
	var out: Array = Evolution.owned_forms()
	var q := _search.text.strip_edges().to_lower() if _search else ""
	out = out.filter(func(c): return (q == "" or q in c.display_name.to_lower()) and (not _fav_only or GameState.is_favorite(c.id)))
	var rank := func(r: String) -> int: return ["common", "uncommon", "rare", "epic", "legendary", "mythic"].find(r)
	match _sort:
		"friendship": out.sort_custom(func(a, b): return GameState.friendship(a.id) > GameState.friendship(b.id))
		"size": out.sort_custom(func(a, b): return ["small", "large", "colossal"].find(a.size_class) > ["small", "large", "colossal"].find(b.size_class))
		"element": out.sort_custom(func(a, b): return a.primary_element() < b.primary_element())
		"rarity": out.sort_custom(func(a, b): return rank.call(a.rarity) > rank.call(b.rarity))
		"evolution": out.sort_custom(func(a, b): return a.stage > b.stage)
		"name": out.sort_custom(func(a, b): return a.display_name < b.display_name)
	return out

func refresh() -> void:
	UIKit.clear(_list)
	var owned := _owned()
	var hab: Array = GameState.data.flags.get("habitat", [])
	var slots := MeadowLevel.current.habitat_slots() if MeadowLevel.current else 0
	_list.add_child(UIKit.label("Ancient Oak habitat: %d / %d" % [hab.size(), slots], "Title", 20, Palette.MOSS_DARK))
	if owned.is_empty():
		_list.add_child(UIKit.label("No Mythlings here yet. Elder Rowan knows where to start!" if _search.text == "" and not _fav_only else "No matches.", "", 19, Color(0, 0, 0, 0), true))
	for c in owned:
		var b := Button.new()
		b.focus_mode = Control.FOCUS_NONE
		b.custom_minimum_size = Vector2(380, 78)
		var sel: bool = c.id == _selected
		b.add_theme_stylebox_override("normal", UITheme.box(Palette.CARD, 16, Palette.GOLD if sel else Palette.PARCHMENT_DEEP, 3 if sel else 2, 0, 8))
		b.add_theme_stylebox_override("hover", UITheme.box(Color("fffdf6"), 16, Palette.MOSS_LIGHT, 2, 0, 8))
		b.add_theme_stylebox_override("pressed", UITheme.box(Palette.PARCHMENT_DEEP, 16, Palette.MOSS, 2, 0, 8))
		var h := UIKit.hbox(10)
		h.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
		h.offset_left = 8
		h.offset_right = -8
		h.mouse_filter = Control.MOUSE_FILTER_IGNORE
		var portrait := CreaturePortrait.new()
		portrait.setup(c, true)
		portrait.custom_minimum_size = Vector2(62, 62)
		portrait.size_flags_vertical = Control.SIZE_SHRINK_CENTER
		h.add_child(portrait)
		var v := UIKit.vbox(2)
		v.size_flags_horizontal = Control.SIZE_EXPAND_FILL
		v.alignment = BoxContainer.ALIGNMENT_CENTER
		v.mouse_filter = Control.MOUSE_FILTER_IGNORE
		var tag := ""
		if GameState.companion() == c.id:
			tag = " · Companion"
		elif c.id in hab:
			tag = " · Sanctuary"
		var nm := UIKit.label(c.display_name + tag, "", 19)
		nm.add_theme_font_override("font", UITheme.bold_font)
		v.add_child(nm)
		var row := UIKit.hbox(6)
		row.mouse_filter = Control.MOUSE_FILTER_IGNORE
		row.add_child(UIKit.pill(c.size_label(), Palette.TEAL))
		row.add_child(UIKit.hearts(GameState.friendship_level(c.id), 5, 14.0))
		v.add_child(row)
		h.add_child(v)
		if GameState.is_favorite(c.id):
			h.add_child(IconGlyph.make("star", 22, Palette.GOLD))
		if _can_evolve_any(c.id):
			h.add_child(IconGlyph.make("evolve", 26, Palette.MOSS))
		b.add_child(h)
		UIKit.attach_press_feedback(b)
		var id: String = c.id
		b.pressed.connect(func():
			_selected = id
			refresh())
		_list.add_child(b)
	if (_selected == "" or not GameState.is_discovered(_selected) or GameState.evolved_to(_selected) != "") and owned.size() > 0:
		_selected = owned[0].id
	_show(_selected)

func _can_evolve_any(id: String) -> bool:
	for e in Evolution.options(id):
		if Evolution.can_evolve(id, e):
			return true
	return false

func _section(t: String) -> void:
	_detail.add_child(UIKit.label(t, "Title", 22, Palette.MOSS_DARK))

func _show(id: String) -> void:
	if _viewer.get_parent():
		_viewer.get_parent().remove_child(_viewer)
	UIKit.clear(_detail)
	var c: CreatureData = DB.creature(id)
	if c == null or not GameState.is_discovered(id):
		return
	var lvl := MeadowLevel.current
	_detail.add_child(_viewer)
	var cosm := GameState.creature_cosmetic(id)
	var acc := String(GameState.data.flags.get("acc_" + id, ""))
	_viewer.scale_ref = _show_scale
	_viewer.show_item("colossal" if c.is_colossal() else "creature", id + ":" + (cosm.split(":")[2] if cosm.begins_with("variant:") else "") + ":" + acc)
	var vrow := UIKit.hbox(6)
	for a in [["Idle", "idle"], ["Walk", "walk"], ["Happy", "happy"], ["Sleep", "sleep"]]:
		var ab := UIKit.button(a[0], "", "", 44)
		var an: String = a[1]
		ab.pressed.connect(func(): _viewer.play(an))
		vrow.add_child(ab)
	var sz := UIKit.button("Size vs Keeper", "size", "TabButton", 44, 20)
	sz.toggle_mode = true
	sz.button_pressed = _show_scale
	sz.toggled.connect(func(v):
		_show_scale = v
		_show(id))
	vrow.add_child(sz)
	_detail.add_child(vrow)
	var title := UIKit.hbox(10)
	var nm := UIKit.label(c.display_name, "Heading", 32)
	nm.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	title.add_child(nm)
	var fav := UIKit.button("", "star", "TabButton", 48, 24)
	fav.custom_minimum_size.x = 56
	fav.toggle_mode = true
	fav.button_pressed = GameState.is_favorite(id)
	fav.pressed.connect(func():
		GameState.toggle_favorite(id)
		refresh())
	title.add_child(fav)
	_detail.add_child(title)
	var pills := HFlowContainer.new()
	pills.add_theme_constant_override("h_separation", 6)
	pills.add_child(UIKit.pill(c.size_label(), Palette.TEAL, Color.WHITE, "size"))
	pills.add_child(UIKit.rarity_pill(c.rarity))
	for e in c.elements:
		pills.add_child(UIKit.element_pill(e))
	pills.add_child(UIKit.pill(c.personality.capitalize(), Palette.INK_SOFT))
	_detail.add_child(pills)
	var fr := UIKit.hbox(10)
	fr.add_child(UIKit.hearts(GameState.friendship_level(id), 5, 24.0))
	fr.add_child(UIKit.label("Friendship %d / 100" % GameState.friendship(id), "Caption", 18))
	_detail.add_child(fr)
	# Actions
	var actions := HFlowContainer.new()
	actions.add_theme_constant_override("h_separation", 10)
	actions.add_theme_constant_override("v_separation", 10)
	var is_comp := GameState.companion() == id
	if c.size_class == "small" or is_comp:
		var comp := UIKit.button("Send home" if is_comp else "Make companion", "paw", "" if is_comp else "PrimaryButton", 56)
		comp.disabled = not is_comp and GameState.friendship_level(id) < 1
		comp.pressed.connect(func():
			if is_comp:
				GameState.set_companion("")
			else:
				GameState.set_companion(id)
				var h2: Array = GameState.data.flags.get("habitat", [])
				h2.erase(id)
				GameState.data.flags["habitat"] = h2
			refresh())
		actions.add_child(comp)
	if c.size_class != "small" and not is_comp:
		var sm := UIKit.button("Summon here", "sparkle", "PrimaryButton", 56)
		sm.pressed.connect(func():
			if lvl == null:
				return
			var msg := lvl.summon(id)
			if msg != "":
				Events.toast.emit("Can't summon " + c.display_name, msg, "map")
			else:
				await close()
				Events.toast.emit(c.display_name + " answers your call", "Walk up to it to interact%s." % (" or ride" if c.rideable else ""), "sparkle"))
		actions.add_child(sm)
	if not c.is_colossal():
		var hab: Array = GameState.data.flags.get("habitat", [])
		var in_hab: bool = id in hab
		var slots := lvl.habitat_slots() if lvl else 0
		var hb := UIKit.button("Leave sanctuary" if in_hab else "Place in sanctuary", "leaf", "", 56)
		hb.disabled = not in_hab and (hab.size() >= slots or is_comp)
		hb.pressed.connect(func():
			var h2: Array = GameState.data.flags.get("habitat", [])
			if id in h2:
				h2.erase(id)
			else:
				h2.append(id)
			GameState.data.flags["habitat"] = h2
			if lvl:
				lvl.refresh_creatures()
			refresh())
		actions.add_child(hb)
	_detail.add_child(actions)
	if GameState.friendship_level(id) < 1:
		_detail.add_child(UIKit.label("Spend a little time together (friendship 1) before inviting %s along." % c.display_name, "Caption", 16, Color(0, 0, 0, 0), true))
	# Abilities
	_section("Abilities")
	var cur := GameState.companion()
	var compare := cur != "" and cur != id
	for a in Abilities.kit(id):
		var row := UIKit.card()
		var rv := UIKit.vbox(2)
		var top := UIKit.hbox(8)
		top.add_child(UIKit.pill(a.slot.capitalize(), Palette.GOLD_DARK if a.slot == "signature" else Palette.TEAL))
		var an := UIKit.label(a.display_name, "Title", 19)
		an.size_flags_horizontal = Control.SIZE_EXPAND_FILL
		top.add_child(an)
		var reason := Abilities.lock_reason(id, a)
		top.add_child(UIKit.pill("Ready" if reason == "" else "Locked", Palette.MOSS if reason == "" else Palette.INK_SOFT, Color.WHITE, "check" if reason == "" else "lock"))
		rv.add_child(top)
		rv.add_child(UIKit.label(a.description, "", 16, Color(0, 0, 0, 0), true))
		var meta: String = "%s · cooldown %ds" % [a.category.capitalize(), int(a.cooldown)] if a.slot != "passive" else a.category.capitalize() + " · always on"
		if reason != "":
			meta += " · " + reason
		rv.add_child(UIKit.label(meta, "Caption", 15, Color(0, 0, 0, 0), true))
		if compare:
			var other := Abilities.in_slot(cur, a.slot)
			if other:
				rv.add_child(UIKit.label("Your companion %s: %s" % [DB.creature(cur).display_name, other.display_name], "Caption", 15, Palette.TEAL, true))
		row.add_child(rv)
		_detail.add_child(row)
	# Evolution
	var opts := Evolution.options(id)
	var fam: Array = DB.family(c.family)
	if fam.size() > 1:
		_section("Evolution family")
		var chain := HFlowContainer.new()
		chain.add_theme_constant_override("h_separation", 6)
		for f in fam:
			var known := GameState.is_discovered(f.id)
			chain.add_child(UIKit.pill(("%s (%s)" % [f.display_name, f.size_label()]) if known else "??? (stage %d)" % f.stage, Palette.MOSS if f.id == id else (Palette.TEAL if known else Palette.INK_SOFT)))
		_detail.add_child(chain)
	if c.evolves_from != "":
		var replay := UIKit.button("Replay evolution from %s" % DB.creature(c.evolves_from).display_name, "play", "", 52)
		var src: String = c.evolves_from
		replay.pressed.connect(func(): _play_cinematic(src, id))
		_detail.add_child(replay)
	for i in opts.size():
		var e: Dictionary = opts[i]
		var target: CreatureData = DB.creature(e.to)
		var ec := UIKit.card()
		var ev := UIKit.vbox(6)
		var eh := UIKit.hbox(8)
		eh.add_child(IconGlyph.make("evolve", 30, Palette.MOSS))
		var et := UIKit.label("%s → %s" % [Evolution.PATH_NAMES.get(e.path, e.path), target.display_name if GameState.is_discovered(e.to) else target.display_name + " (new form)"], "Title", 19)
		et.size_flags_horizontal = Control.SIZE_EXPAND_FILL
		eh.add_child(et)
		eh.add_child(UIKit.pill(target.size_label(), Palette.TEAL))
		ev.add_child(eh)
		ev.add_child(UIKit.label(String(e.get("text", "")), "", 16, Color(0, 0, 0, 0), true))
		for r in Evolution.requirements(id, e):
			var rr := UIKit.hbox(6)
			rr.add_child(IconGlyph.make("check" if r.met else "sparkle", 20, Palette.MOSS if r.met else Palette.INK_SOFT))
			var rl := UIKit.label(r.label, "", 16, Palette.MOSS_DARK if r.met else Palette.INK, true)
			rr.add_child(rl)
			if r.progress != "":
				rr.add_child(UIKit.label(r.progress, "Caption", 15))
			ev.add_child(rr)
		var ok := Evolution.can_evolve(id, e)
		var btn := UIKit.button("Evolve into %s" % target.display_name, "evolve", "PrimaryButton", 58)
		btn.disabled = not ok
		var idx := i
		btn.pressed.connect(func():
			if Evolution.evolve(id, idx):
				_selected = target.id
				await close()
				_play_cinematic(id, target.id))
		ev.add_child(btn)
		if not target.model_ready:
			ev.add_child(UIKit.label("This form's model isn't in this build yet.", "Caption", 15, Palette.DANGER))
		ec.add_child(ev)
		_detail.add_child(ec)
	if c.lore != "":
		_section("Lore")
		_detail.add_child(UIKit.label(c.lore, "", 17, Palette.INK_SOFT, true))
	_cosmetics(id, cosm, acc)

func _play_cinematic(from_id: String, to_id: String) -> void:
	if game_ui and game_ui.has_method("play_evolution"):
		if visible:
			await close()
		game_ui.play_evolution(from_id, to_id)

func _cosmetics(id: String, cosm: String, acc: String) -> void:
	var variants: Array = [["Default", ""]]
	for p in DB.shop.values():
		var g: String = p.grants.get("cosmetic", "")
		if g.begins_with("variant:%s:" % id) and GameState.owns(p.id):
			variants.append([p.display_name, g])
	var accs: Array = [["None", ""]]
	for p in DB.shop.values():
		var g: String = p.grants.get("cosmetic", "")
		if g.begins_with("acc:") and Store.owns_cosmetic(g):
			var key := g.split(":")[1]
			if accs.filter(func(a): return a[1] == key).is_empty():
				accs.append([p.display_name, key])
	_section("Appearance")
	var vr := HFlowContainer.new()
	vr.add_theme_constant_override("h_separation", 8)
	for v in variants:
		var b := UIKit.button(v[0], "", "TabButton", 46)
		b.toggle_mode = true
		b.button_pressed = cosm == v[1]
		var val: String = v[1]
		b.pressed.connect(func():
			GameState.set_creature_cosmetic(id, val)
			_rebuild_world_creature(id)
			refresh())
		vr.add_child(b)
	for a in accs:
		var b := UIKit.button("Accessory: " + a[0], "", "TabButton", 46)
		b.toggle_mode = true
		b.button_pressed = acc == a[1]
		var val: String = a[1]
		b.pressed.connect(func():
			GameState.data.flags["acc_" + id] = val
			_rebuild_world_creature(id)
			refresh())
		vr.add_child(b)
	_detail.add_child(vr)
	if variants.size() == 1 and accs.size() == 1:
		_detail.add_child(UIKit.label("Cosmetic coats and accessories are in the Grand Market. They never change abilities.", "Caption", 16, Color(0, 0, 0, 0), true))

func _rebuild_world_creature(id: String) -> void:
	if MeadowLevel.current and MeadowLevel.current.creatures.has(id):
		MeadowLevel.current.creatures[id].rebuild_model()
