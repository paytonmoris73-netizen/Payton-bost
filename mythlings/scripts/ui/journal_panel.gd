class_name JournalPanel
extends UIPanel
## The Mythling Journal: an illustrated encyclopedia of every species with
## collection progress, filters, 3D inspection and friendship-unlocked notes.

var _grid: GridContainer
var _progress: Label
var _region_bar: HBoxContainer
var _detail: VBoxContainer
var _viewer: ModelViewer
var _selected := ""
var _filters := {"region": "all", "element": "all", "rarity": "all", "status": "all", "size": "all"}
var _scale := false

func build_content() -> void:
	setup_frame("Mythling Journal", "book")
	var top := UIKit.hbox(10)
	_progress = UIKit.label("", "Title", 22, Palette.MOSS_DARK)
	_progress.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	top.add_child(_progress)
	for f in [["region", ["all"] + DB.REGION_ORDER + ["colossal"]], ["size", ["all", "small", "large", "colossal"]], ["element", ["all", "nature", "fire", "water", "ice", "earth", "celestial", "storm"]], ["rarity", ["all", "common", "uncommon", "rare", "epic", "legendary", "mythic"]], ["status", ["all", "discovered", "undiscovered", "friends"]]]:
		var ob := OptionButton.new()
		ob.focus_mode = Control.FOCUS_NONE
		ob.custom_minimum_size = Vector2(170, 52)
		for opt in f[1]:
			var nm: String = opt
			if f[0] == "region" and DB.region(opt):
				nm = DB.region(opt).display_name
			ob.add_item(("All " + f[0] + "s") if opt == "all" else (nm.capitalize() if f[0] != "region" else nm))
		var key: String = f[0]
		var opts: Array = f[1]
		ob.item_selected.connect(func(i):
			_filters[key] = opts[i]
			_rebuild_grid())
		top.add_child(ob)
	body.add_child(top)
	_region_bar = UIKit.hbox(8)
	body.add_child(_region_bar)
	var split := UIKit.hbox(16)
	split.size_flags_vertical = Control.SIZE_EXPAND_FILL
	body.add_child(split)
	_grid = GridContainer.new()
	_grid.columns = 4
	var sc := UIKit.scroll(_grid)
	sc.size_flags_stretch_ratio = 1.15
	split.add_child(sc)
	var right := UIKit.card()
	right.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	right.size_flags_vertical = Control.SIZE_EXPAND_FILL
	split.add_child(right)
	_detail = UIKit.vbox(8)
	right.add_child(UIKit.scroll(_detail))
	_viewer = ModelViewer.new()
	_viewer.custom_minimum_size = Vector2(0, 300)

func on_open(args: Dictionary) -> void:
	if args.has("creature"):
		_selected = args.creature

func refresh() -> void:
	var total := DB.standard_creatures().size()
	var forms := 0
	for c in DB.evolved_creatures():
		if GameState.is_discovered(c.id):
			forms += 1
	_progress.text = "Collection  %d / %d  ·  Evolved forms %d / %d  ·  Colossal %d / %d" % [GameState.discovered_count(), total, forms, DB.evolved_creatures().size(), GameState.stat_value("colossal_discovered"), DB.colossal_creatures().size()]
	UIKit.clear(_region_bar)
	for r in DB.REGION_ORDER:
		var reg: RegionData = DB.region(r)
		var n := DB.creatures_in_region(r).size()
		var p := UIKit.pill("%s  %d/%d" % [reg.display_name, GameState.discovered_count(r), n], reg.theme_color.darkened(0.25))
		_region_bar.add_child(p)
	_rebuild_grid()
	if _selected == "":
		var first: Array = DB.standard_creatures()
		_selected = first[0].id
	_show_detail(_selected)

func _passes(c: CreatureData) -> bool:
	var f := _filters
	if f.region == "colossal":
		if not c.is_colossal():
			return false
	elif f.region != "all" and c.region != f.region:
		return false
	if f.size != "all" and c.size_class != f.size:
		return false
	if f.element != "all" and not (f.element in c.elements):
		return false
	if f.rarity != "all" and c.rarity != f.rarity:
		return false
	var disc := GameState.is_discovered(c.id)
	match f.status:
		"discovered": return disc
		"undiscovered": return not disc
		"friends": return GameState.friendship_level(c.id) >= 3
	return true

func _rebuild_grid() -> void:
	UIKit.clear(_grid)
	_grid.columns = 4 if get_viewport_rect().size.x > 1300 else 3
	var list: Array = DB.standard_creatures() + DB.evolved_creatures() + DB.colossal_creatures()
	for c in list:
		if _passes(c):
			_grid.add_child(_card(c))

func _card(c: CreatureData) -> Button:
	var disc := GameState.is_discovered(c.id)
	var b := Button.new()
	b.focus_mode = Control.FOCUS_NONE
	b.custom_minimum_size = Vector2(150, 170)
	b.toggle_mode = false
	var sel := c.id == _selected
	var bg := Palette.CARD if disc else Color("ece5d6")
	b.add_theme_stylebox_override("normal", UITheme.box(bg, 18, Palette.GOLD if sel else Palette.rarity_color(c.rarity).lerp(Color.WHITE, 0.4), 3 if sel else 2, 0, 8))
	b.add_theme_stylebox_override("hover", UITheme.box(bg.lightened(0.05), 18, Palette.MOSS_LIGHT, 2, 0, 8))
	b.add_theme_stylebox_override("pressed", UITheme.box(bg.darkened(0.05), 18, Palette.MOSS, 2, 0, 8))
	var v := UIKit.vbox(4)
	v.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	v.offset_top = 10
	v.offset_bottom = -8
	v.mouse_filter = Control.MOUSE_FILTER_IGNORE
	var portrait := CreaturePortrait.new()
	portrait.setup(c, disc)
	portrait.custom_minimum_size = Vector2(110, 92)
	portrait.size_flags_horizontal = Control.SIZE_SHRINK_CENTER
	v.add_child(portrait)
	var nm := UIKit.label(c.display_name if disc else "???", "", 19, Palette.INK if disc else Palette.INK_SOFT)
	nm.add_theme_font_override("font", UITheme.bold_font)
	nm.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	v.add_child(nm)
	if disc:
		var hearts := UIKit.hearts(GameState.friendship_level(c.id), 5, 14.0)
		hearts.alignment = BoxContainer.ALIGNMENT_CENTER
		hearts.mouse_filter = Control.MOUSE_FILTER_IGNORE
		v.add_child(hearts)
	else:
		var l := UIKit.label(DB.region(c.region).display_name if DB.region(c.region) else "", "Caption", 14)
		l.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
		v.add_child(l)
	b.add_child(v)
	UIKit.attach_press_feedback(b)
	b.pressed.connect(func():
		_selected = c.id
		_rebuild_grid()
		_show_detail(c.id))
	return b

func _show_detail(id: String) -> void:
	var c: CreatureData = DB.creature(id)
	if c == null:
		return
	if _viewer.get_parent():
		_viewer.get_parent().remove_child(_viewer)
	UIKit.clear(_detail)
	var disc := GameState.is_discovered(id)
	if disc:
		_detail.add_child(_viewer)
		var variant := GameState.creature_cosmetic(id)
		_viewer.scale_ref = _scale
		_viewer.show_item("colossal" if c.is_colossal() else "creature", id + (":" + variant.split(":")[2] if variant.begins_with("variant:") else ""))
		var anims := UIKit.hbox(6)
		for a in [["Idle", "idle"], ["Walk", "walk"], ["Happy", "happy"], ["Sleep", "sleep"]]:
			var ab := UIKit.button(a[0], "", "", 46)
			ab.add_theme_font_size_override("font_size", 17)
			var anim: String = a[1]
			ab.pressed.connect(func(): _viewer.play(anim))
			anims.add_child(ab)
		var sz := UIKit.button("Size", "size", "TabButton", 46, 20)
		sz.toggle_mode = true
		sz.button_pressed = _scale
		sz.toggled.connect(func(v):
			_scale = v
			_show_detail(id))
		anims.add_child(sz)
		_detail.add_child(anims)
		if not c.model_ready:
			_detail.add_child(UIKit.label("3D model arrives with its region update.", "Caption", 16, Palette.DANGER))
	else:
		var sil := CreaturePortrait.new()
		sil.setup(c, false)
		sil.custom_minimum_size = Vector2(0, 220)
		_detail.add_child(sil)
	var name_row := UIKit.hbox(10)
	name_row.add_child(UIKit.label(c.display_name if disc else "Undiscovered Mythling", "Heading", 32))
	_detail.add_child(name_row)
	var pills := HFlowContainer.new()
	pills.add_theme_constant_override("h_separation", 6)
	pills.add_theme_constant_override("v_separation", 6)
	pills.add_child(UIKit.pill(c.size_label(), Palette.TEAL, Color.WHITE, "size"))
	pills.add_child(UIKit.rarity_pill(c.rarity))
	if disc:
		for e in c.elements:
			pills.add_child(UIKit.element_pill(e))
	if c.is_colossal():
		pills.add_child(UIKit.pill("Colossal", Palette.NIGHT_SOFT, Palette.GOLD, "star"))
	pills.add_child(UIKit.pill(DB.region(c.region).display_name, DB.region(c.region).theme_color.darkened(0.3)))
	_detail.add_child(pills)
	if not disc:
		_detail.add_child(UIKit.label("Hint: " + c.discovery_hint, "", 20, Palette.INK_SOFT, true))
		if not DB.region(c.region).playable:
			_detail.add_child(UIKit.label("This region opens in a future update.", "Caption", 17, Palette.DANGER, true))
		return
	_detail.add_child(UIKit.label(c.description, "", 20, Color(0, 0, 0, 0), true))
	var fl := GameState.friendship_level(id)
	var fr := UIKit.hbox(10)
	fr.add_child(UIKit.label("Friendship", "Title", 20))
	fr.add_child(UIKit.hearts(fl, 5, 22.0))
	_detail.add_child(fr)
	var bar := ProgressBar.new()
	bar.theme_type_variation = "HeartBar"
	bar.show_percentage = false
	bar.custom_minimum_size.y = 12
	bar.max_value = 1.0
	bar.value = GameState.friendship_progress(id)
	_detail.add_child(bar)
	var info := GridContainer.new()
	info.columns = 2
	for row in [["Habitat", c.habitat], ["Found at", _loc_name(GameState.data.creatures[id].get("discovered_at", ""))], ["Personality", c.personality.capitalize()], ["Favourite treat", DB.item(c.favorite_treat).display_name if DB.item(c.favorite_treat) else "-"], ["Ability", c.ability_name + " — " + c.ability_text if c.ability_name != "" else "Unknown"]]:
		var k := UIKit.label(row[0], "Caption", 17)
		k.custom_minimum_size.x = 150
		info.add_child(k)
		var vl := UIKit.label(row[1], "", 18, Color(0, 0, 0, 0), true)
		vl.size_flags_horizontal = Control.SIZE_EXPAND_FILL
		info.add_child(vl)
	_detail.add_child(info)
	var stats := UIKit.hbox(14)
	for s in c.base_stats:
		stats.add_child(UIKit.pill("%s %d" % [String(s).capitalize(), int(c.base_stats[s])], Palette.TEAL))
	_detail.add_child(stats)
	_detail.add_child(UIKit.label("Abilities", "Title", 20))
	for a in Abilities.kit(id):
		var lock := Abilities.lock_reason(id, a)
		_detail.add_child(UIKit.label("%s · %s — %s%s" % [a.slot.capitalize(), a.display_name, a.description, "" if lock == "" else "  (" + lock + ")"], "", 17, Palette.INK if lock == "" else Palette.INK_SOFT, true))
	var fam: Array = DB.family(c.family)
	if fam.size() > 1:
		_detail.add_child(UIKit.label("Evolution", "Title", 20))
		var chain := HFlowContainer.new()
		chain.add_theme_constant_override("h_separation", 6)
		for f in fam:
			var known := GameState.is_discovered(f.id)
			chain.add_child(UIKit.pill(("%s · %s" % [f.display_name, f.size_label()]) if known else "??? · stage %d" % f.stage, Palette.MOSS if f.id == id else (Palette.TEAL if known else Palette.INK_SOFT)))
		_detail.add_child(chain)
		for e in Evolution.options(id):
			var t: CreatureData = DB.creature(e.to)
			var reqs: Array = Evolution.requirements(id, e).map(func(r): return ("✓ " if r.met else "") + r.label)
			_detail.add_child(UIKit.label("%s → %s: %s" % [Evolution.PATH_NAMES.get(e.path, e.path), t.display_name if GameState.is_discovered(t.id) else "a new form", "; ".join(reqs)], "", 16, Color(0, 0, 0, 0), true))
		if c.evolves_from != "" and GameState.is_discovered(c.evolves_from):
			var rp := UIKit.button("Replay evolution", "play", "", 50)
			var src: String = c.evolves_from
			rp.pressed.connect(func():
				await close()
				var gu = get_tree().get_first_node_in_group("game_ui")
				if gu:
					gu.play_evolution(src, id))
			_detail.add_child(rp)
	var how := {"explore": "Found in the wild", "evolve": "Evolution", "quest": "Story quest", "purchase": "Grand Market (optional)"}
	_detail.add_child(UIKit.label("How to obtain: " + ", ".join(Array(c.acquisition).map(func(x): return how.get(x, x))), "", 17, Palette.MOSS_DARK, true))
	if c.lore != "":
		_detail.add_child(UIKit.label(c.lore, "", 17, Palette.INK_SOFT, true))
	_detail.add_child(UIKit.label("Keeper's notes", "Title", 20))
	for i in c.friendship_notes.size():
		if fl >= i + 1:
			_detail.add_child(UIKit.label("• " + c.friendship_notes[i], "", 18, Color(0, 0, 0, 0), true))
		else:
			_detail.add_child(UIKit.label("• Locked — reach friendship level %d" % (i + 1), "Caption", 17))

func _loc_name(id: String) -> String:
	return MeadowLevel.location_name(id) if id != "" else "Whispering Meadow"
