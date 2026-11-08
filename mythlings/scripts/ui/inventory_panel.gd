class_name InventoryPanel
extends UIPanel
## Bag: categories, search, sorting, capacity and item details (with selling).

var _grid: GridContainer
var _search: LineEdit
var _cap: Label
var _cap_bar: ProgressBar
var _detail: VBoxContainer
var _cat := "all"
var _sort := "name"
var _selected := ""
var _tabs: HBoxContainer

func build_content() -> void:
	setup_frame("Bag", "bag")
	var top := UIKit.hbox(10)
	_tabs = UIKit.hbox(6)
	for c in [["all", "All"], ["material", "Materials"], ["treat", "Treats"], ["special", "Special"]]:
		var b := UIKit.button(c[1], "", "TabButton", 52)
		b.toggle_mode = true
		b.button_pressed = c[0] == _cat
		var key: String = c[0]
		b.pressed.connect(func():
			_cat = key
			for t in _tabs.get_children():
				t.button_pressed = t == b
			refresh())
		_tabs.add_child(b)
	top.add_child(_tabs)
	top.add_child(UIKit.spacer())
	_search = LineEdit.new()
	_search.placeholder_text = "Search items…"
	_search.custom_minimum_size = Vector2(260, 52)
	_search.text_changed.connect(func(_t): refresh())
	top.add_child(_search)
	var sort := OptionButton.new()
	sort.focus_mode = Control.FOCUS_NONE
	sort.custom_minimum_size = Vector2(190, 52)
	for o in ["Sort: Name", "Sort: Quantity", "Sort: Category"]:
		sort.add_item(o)
	sort.item_selected.connect(func(i):
		_sort = ["name", "qty", "cat"][i]
		refresh())
	top.add_child(sort)
	body.add_child(top)
	var caprow := UIKit.hbox(10)
	_cap = UIKit.label("", "Caption", 18)
	caprow.add_child(_cap)
	_cap_bar = ProgressBar.new()
	_cap_bar.show_percentage = false
	_cap_bar.custom_minimum_size = Vector2(240, 12)
	_cap_bar.size_flags_vertical = Control.SIZE_SHRINK_CENTER
	caprow.add_child(_cap_bar)
	body.add_child(caprow)
	var split := UIKit.hbox(16)
	split.size_flags_vertical = Control.SIZE_EXPAND_FILL
	body.add_child(split)
	_grid = GridContainer.new()
	_grid.columns = 5
	var sc := UIKit.scroll(_grid)
	sc.size_flags_stretch_ratio = 1.6
	split.add_child(sc)
	var card := UIKit.card()
	card.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	card.size_flags_vertical = Control.SIZE_EXPAND_FILL
	_detail = UIKit.vbox(10)
	card.add_child(_detail)
	split.add_child(card)
	Events.inventory_changed.connect(_on_inv_changed)

func _on_inv_changed(_i: String, _q: int) -> void:
	if visible:
		refresh()

func refresh() -> void:
	_cap.text = "Slots used %d / %d" % [GameState.used_slots(), GameState.INVENTORY_SLOTS]
	_cap_bar.max_value = GameState.INVENTORY_SLOTS
	_cap_bar.value = GameState.used_slots()
	UIKit.clear(_grid)
	var ids: Array = GameState.data.inventory.keys()
	var q := _search.text.strip_edges().to_lower()
	var list: Array = []
	for id in ids:
		var d: ItemData = DB.item(id)
		if d == null:
			continue
		if _cat != "all" and d.category != _cat:
			continue
		if q != "" and not (q in d.display_name.to_lower() or q in d.description.to_lower()):
			continue
		list.append(d)
	match _sort:
		"name": list.sort_custom(func(a, b): return a.display_name < b.display_name)
		"qty": list.sort_custom(func(a, b): return GameState.item_count(a.id) > GameState.item_count(b.id))
		"cat": list.sort_custom(func(a, b): return a.category + a.display_name < b.category + b.display_name)
	for d in list:
		_grid.add_child(_tile(d))
	if list.is_empty():
		_grid.add_child(UIKit.label("Nothing here yet. Gather resources around the meadow!", "Caption", 18))
	if _selected == "" or GameState.item_count(_selected) == 0:
		_selected = list[0].id if list.size() > 0 else ""
	_show(_selected)

func _tile(d: ItemData) -> Button:
	var b := Button.new()
	b.focus_mode = Control.FOCUS_NONE
	b.custom_minimum_size = Vector2(124, 124)
	var sel := d.id == _selected
	b.add_theme_stylebox_override("normal", UITheme.box(Palette.CARD, 18, Palette.GOLD if sel else Palette.PARCHMENT_DEEP, 3 if sel else 2, 0, 6))
	b.add_theme_stylebox_override("hover", UITheme.box(Color("fffdf6"), 18, Palette.MOSS_LIGHT, 2, 0, 6))
	b.add_theme_stylebox_override("pressed", UITheme.box(Palette.PARCHMENT_DEEP, 18, Palette.MOSS, 2, 0, 6))
	var v := UIKit.vbox(2)
	v.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	v.alignment = BoxContainer.ALIGNMENT_CENTER
	v.mouse_filter = Control.MOUSE_FILTER_IGNORE
	var g := IconGlyph.make(d.icon, 52, d.color)
	g.size_flags_horizontal = Control.SIZE_SHRINK_CENTER
	v.add_child(g)
	var n := UIKit.label(d.display_name, "", 15)
	n.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	n.clip_text = true
	v.add_child(n)
	b.add_child(v)
	var qty := UIKit.pill("×%d" % GameState.item_count(d.id), Palette.MOSS_DARK)
	qty.position = Vector2(66, 6)
	qty.mouse_filter = Control.MOUSE_FILTER_IGNORE
	b.add_child(qty)
	UIKit.attach_press_feedback(b)
	b.pressed.connect(func():
		_selected = d.id
		refresh())
	return b

func _show(id: String) -> void:
	UIKit.clear(_detail)
	var d: ItemData = DB.item(id)
	if d == null:
		_detail.add_child(UIKit.label("Select an item to see details.", "Caption", 18))
		return
	var g := IconGlyph.make(d.icon, 96, d.color)
	g.size_flags_horizontal = Control.SIZE_SHRINK_CENTER
	_detail.add_child(g)
	_detail.add_child(UIKit.label(d.display_name, "Heading", 30))
	_detail.add_child(UIKit.pill(d.category.capitalize(), Palette.TEAL))
	_detail.add_child(UIKit.label(d.description, "", 19, Color(0, 0, 0, 0), true))
	_detail.add_child(UIKit.label("Owned: %d / %d" % [GameState.item_count(id), d.max_stack], "Title", 20))
	if d.category == "treat":
		var likes: Array = []
		for c in DB.creatures.values():
			if c.favorite_treat == id and GameState.is_discovered(c.id):
				likes.append(c.display_name)
		_detail.add_child(UIKit.label("Favourite of: " + (", ".join(likes) if likes.size() > 0 else "— discover more Mythlings"), "Caption", 17, Color(0, 0, 0, 0), true))
		_detail.add_child(UIKit.label("Offer treats from a Mythling's interaction menu.", "Caption", 16, Color(0, 0, 0, 0), true))
	if d.sell_value > 0:
		var sell := UIKit.button("Sell 1 for %d Gold" % d.sell_value, "coin", "GoldButton", 58)
		sell.pressed.connect(func():
			if GameState.remove_item(id, 1):
				GameState.add_currency("gold", d.sell_value)
				Audio.play_sfx("purchase", 1.1)
				refresh())
		_detail.add_child(sell)
