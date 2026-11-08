class_name MarketPanel
extends UIPanel
## THE GRAND MARKET. Fair, transparent store: exact prices, no randomised
## items, every creature also earnable through play, mock billing clearly
## labelled as a test in development builds.

const CATS := [
	["featured", "Featured", "star"],
	["creature", "Creature Market", "paw"],
	["colossal", "Colossal Collection", "leaf"],
	["clothing", "Clothing", "person"],
	["creature_cosmetic", "Creature Cosmetics", "sparkle"],
	["sanctuary", "Sanctuary", "hammer"],
	["collection", "World Collections", "collection"],
	["rotating", "Rotating", "star"],
	["currency", "Star Gems", "gem"],
	["history", "History", "quest"],
]

var _rail: VBoxContainer
var _content: VBoxContainer
var _cur_box: HBoxContainer
var _search: LineEdit
var _filter := 0
var _cat := "featured"
var _product := ""
var _viewer: ModelViewer
var _confirm: Control
var _busy := false

func build_content() -> void:
	max_size = Vector2(1560, 900)
	setup_frame("The Grand Market", "cart")
	_cur_box = UIKit.hbox(18)
	header.add_child(_cur_box)
	header.move_child(_cur_box, 2)
	var split := UIKit.hbox(16)
	split.size_flags_vertical = Control.SIZE_EXPAND_FILL
	body.add_child(split)
	_rail = UIKit.vbox(6)
	var rail_sc := UIKit.scroll(_rail)
	rail_sc.custom_minimum_size.x = 290
	rail_sc.size_flags_horizontal = Control.SIZE_FILL
	split.add_child(rail_sc)
	var right := UIKit.vbox(10)
	right.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	var bar := UIKit.hbox(10)
	_search = LineEdit.new()
	_search.placeholder_text = "Search the market…"
	_search.custom_minimum_size = Vector2(320, 52)
	_search.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	_search.text_changed.connect(func(_t):
		_product = ""
		_render())
	bar.add_child(_search)
	var f := OptionButton.new()
	f.focus_mode = Control.FOCUS_NONE
	f.custom_minimum_size = Vector2(220, 52)
	for o in ["All items", "Can afford", "Owned", "Not owned"]:
		f.add_item(o)
	f.item_selected.connect(func(i):
		_filter = i
		_render())
	bar.add_child(f)
	right.add_child(bar)
	_content = UIKit.vbox(12)
	_content.size_flags_vertical = Control.SIZE_EXPAND_FILL
	right.add_child(_content)
	split.add_child(right)
	_viewer = ModelViewer.new()
	Store.purchase_finished.connect(_on_purchase_finished)
	Events.currency_changed.connect(func(_c, _a): _refresh_currency())

func on_open(args: Dictionary) -> void:
	if args.has("category"):
		_cat = args.category
	_product = args.get("product", "")

func refresh() -> void:
	_refresh_currency()
	_build_rail()
	_render()

func _refresh_currency() -> void:
	if _cur_box == null:
		return
	UIKit.clear(_cur_box)
	for c in ["gold", "crystals", "star_gems"]:
		_cur_box.add_child(UIKit.currency_chip(c, GameState.currency(c)))

func _build_rail() -> void:
	UIKit.clear(_rail)
	for c in CATS:
		var b := UIKit.button(c[1], c[2], "TabButton", 56, 24)
		b.toggle_mode = true
		b.button_pressed = c[0] == _cat
		b.alignment = HORIZONTAL_ALIGNMENT_LEFT
		var hb := b.get_child(0) as HBoxContainer
		if hb:
			hb.alignment = BoxContainer.ALIGNMENT_BEGIN
			hb.offset_left = 14
			var ic := hb.get_node("Icon") as IconGlyph
			if ic and c[0] == _cat:
				ic.color = Color.WHITE
			var tl := hb.get_node("Text") as Label
			if tl and c[0] == _cat:
				tl.add_theme_color_override("font_color", Color.WHITE)
		var key: String = c[0]
		b.pressed.connect(func():
			_cat = key
			_product = ""
			_search.text = ""
			refresh())
		_rail.add_child(b)

func _detach_viewer() -> void:
	if _viewer.get_parent():
		_viewer.get_parent().remove_child(_viewer)

func _render() -> void:
	_detach_viewer()
	UIKit.clear(_content)
	if _product != "":
		_render_detail(DB.product(_product))
		return
	match _cat:
		"featured": _render_featured()
		"colossal": _render_colossal()
		"history": _render_history()
		_: _render_grid(_products_in(_cat))

func _products_in(cat: String) -> Array:
	var out: Array = []
	var q := _search.text.strip_edges().to_lower()
	for p in DB.shop.values():
		if q == "" and p.category != cat:
			continue
		if q != "" and not (q in p.display_name.to_lower() or q in p.description.to_lower()):
			continue
		match _filter:
			1:
				if not (p.currency in ["gold", "crystals", "star_gems"] and GameState.can_afford(p.currency, p.price)):
					continue
			2:
				if not _owned(p):
					continue
			3:
				if _owned(p):
					continue
		out.append(p)
	out.sort_custom(_sort_products)
	return out

func _sort_products(a: ShopItemData, b: ShopItemData) -> bool:
	if a.available != b.available:
		return a.available
	if a.currency != b.currency:
		return ["none", "gold", "crystals", "star_gems", "real_money"].find(a.currency) < ["none", "gold", "crystals", "star_gems", "real_money"].find(b.currency)
	if a.price != b.price:
		return a.price < b.price
	return a.display_name < b.display_name

func _owned(p: ShopItemData) -> bool:
	if p.category in ["creature", "colossal"] and p.preview_id != "" and p.currency == "none":
		return GameState.is_discovered(p.preview_id.split(":")[0])
	return GameState.owns(p.id)

# ------------------------------------------------------------------ grid
func _render_grid(list: Array) -> void:
	var desc := {
		"creature": "Every Mythling is discovered for free in the world. Here you'll find treats and optional cosmetic coats.",
		"clothing": "Outfits for your Keeper. Preview any item on your character before buying.",
		"creature_cosmetic": "Accessories for your Mythlings. Purely cosmetic — they never change abilities.",
		"sanctuary": "Decorations appear in the Ancient Oak Sanctuary once its standing stones are restored.",
		"collection": "Themed collections that release alongside each new region.",
		"rotating": "Seasonal sets rotate through the market and always return later. Nothing is lost by missing one.",
		"currency": "Star Gems are optional and only buy cosmetics. Prices are shown in full before any purchase.",
	}
	if desc.has(_cat) and _search.text == "":
		_content.add_child(UIKit.label(desc[_cat], "Caption", 18, Color(0, 0, 0, 0), true))
	if _cat == "currency" and _search.text == "":
		var note := UIKit.card()
		var nl := UIKit.label(("Development build: purchases use %s. Nothing is charged and no payment details are collected." % Store.billing.provider_name()) if Store.real_money_available() else "Purchases are unavailable in this build.", "", 18, Palette.DANGER, true)
		note.add_child(nl)
		_content.add_child(note)
	var grid := GridContainer.new()
	grid.columns = 4 if get_viewport_rect().size.x > 1400 else 3
	for p in list:
		grid.add_child(_product_card(p))
	if list.is_empty():
		grid.add_child(UIKit.label("Nothing matches. Try another search or filter.", "Caption", 18))
	_content.add_child(UIKit.scroll(grid))

func _product_card(p: ShopItemData) -> Button:
	var b := Button.new()
	b.focus_mode = Control.FOCUS_NONE
	b.custom_minimum_size = Vector2(250, 270)
	var rc := Palette.rarity_color(p.rarity)
	b.add_theme_stylebox_override("normal", UITheme.box(Palette.CARD, 20, rc.lerp(Color.WHITE, 0.35), 3, 0, 10))
	b.add_theme_stylebox_override("hover", UITheme.box(Color("fffdf6"), 20, rc, 3, 0, 10))
	b.add_theme_stylebox_override("pressed", UITheme.box(Palette.PARCHMENT_DEEP, 20, rc, 3, 0, 10))
	var v := UIKit.vbox(6)
	v.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	v.offset_left = 12
	v.offset_right = -12
	v.offset_top = 12
	v.offset_bottom = -12
	v.mouse_filter = Control.MOUSE_FILTER_IGNORE
	var art := ProductArt.new()
	art.setup(p)
	art.custom_minimum_size = Vector2(0, 130)
	v.add_child(art)
	var n := UIKit.label(p.display_name, "Title", 20)
	n.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	v.add_child(n)
	var row := UIKit.hbox(6)
	row.add_child(UIKit.rarity_pill(p.rarity))
	row.add_child(UIKit.spacer())
	if _owned(p):
		row.add_child(UIKit.pill("Owned" if p.currency != "none" else "Befriended", Palette.MOSS, Color.WHITE, "check"))
	elif not p.available:
		row.add_child(UIKit.pill("Coming later", Palette.INK_SOFT, Color.WHITE, "lock"))
	else:
		row.add_child(_price_chip(p))
	v.add_child(row)
	b.add_child(v)
	UIKit.attach_press_feedback(b)
	b.pressed.connect(func():
		_product = p.id
		_render())
	return b

func _price_chip(p: ShopItemData) -> Control:
	if p.currency == "none":
		return UIKit.pill("Earn in game", Palette.TEAL, Color.WHITE, "leaf")
	if p.currency == "real_money":
		return UIKit.pill(Store.price_label(p), Palette.STARGEM.darkened(0.3))
	var h := UIKit.hbox(4)
	h.add_child(IconGlyph.make(IconGlyph.currency_icon(p.currency), 24))
	var l := UIKit.label(str(p.price), "Title", 22, Palette.INK if GameState.can_afford(p.currency, p.price) else Palette.DANGER)
	h.add_child(l)
	return h

# ------------------------------------------------------------------ featured
func _render_featured() -> void:
	var hero := UIKit.card()
	var hh := UIKit.hbox(16)
	_viewer.custom_minimum_size = Vector2(420, 300)
	hh.add_child(_viewer)
	_viewer.show_item("colossal", "verdantus" + (":bloomguard" if GameState.owns("verdantus_bloomguard") else ""))
	var hv := UIKit.vbox(8)
	hv.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	hv.add_child(UIKit.label("COLOSSAL COLLECTION", "Title", 18, Palette.GOLD_DARK))
	hv.add_child(UIKit.label("Meet the guardians of the world", "Heading", 34))
	hv.add_child(UIKit.label("Six enormous Mythlings watch over the six regions. Every guardian is earned through play — restore their shrines, earn their trust, and ride them across the land.", "", 19, Color(0, 0, 0, 0), true))
	var go := UIKit.button("Explore the Colossal Collection", "leaf", "PrimaryButton", 60)
	go.pressed.connect(func():
		_cat = "colossal"
		refresh())
	hv.add_child(go)
	hh.add_child(hv)
	hero.add_child(hh)
	_content.add_child(hero)
	var week := int(Time.get_unix_time_from_system() / 604800.0)
	var rot: Array = _products_in("rotating")
	var picks: Array = []
	var pool: Array = []
	for p in DB.shop.values():
		if p.available and p.currency in ["gold", "crystals", "star_gems"] and not p.stackable and p.category in ["clothing", "sanctuary", "creature_cosmetic", "creature"]:
			pool.append(p)
	pool.sort_custom(func(a, b): return a.id < b.id)
	if rot.size() > 0:
		picks.append(rot[week % rot.size()])
	for i in 3:
		if pool.size() > 0:
			picks.append(pool[(week * 3 + i * 5) % pool.size()])
	_content.add_child(UIKit.label("This week's spotlight", "Title", 22, Palette.MOSS_DARK))
	_content.add_child(UIKit.label("Spotlight items change weekly and every item stays available in its category.", "Caption", 16))
	var grid := GridContainer.new()
	grid.columns = 4
	for p in picks:
		grid.add_child(_product_card(p))
	_content.add_child(UIKit.scroll(grid))

# ------------------------------------------------------------------ colossal
func _render_colossal() -> void:
	var list: Array = DB.colossal_creatures()
	var sel_id := _search.get_meta("colossal_sel", "verdantus") as String
	var stage := PanelContainer.new()
	stage.add_theme_stylebox_override("panel", UITheme.box(Palette.NIGHT, 22, Palette.GOLD_DARK, 2, 0, 14))
	stage.size_flags_vertical = Control.SIZE_EXPAND_FILL
	var sh := UIKit.hbox(16)
	stage.add_child(sh)
	var c: CreatureData = DB.creature(sel_id)
	var discovered := GameState.is_discovered(sel_id)
	_viewer.custom_minimum_size = Vector2(560, 440)
	_viewer.size_flags_vertical = Control.SIZE_SHRINK_BEGIN
	sh.add_child(_viewer)
	_viewer.show_item("colossal", sel_id + (":bloomguard" if sel_id == "verdantus" and GameState.owns("verdantus_bloomguard") else ""))
	_cinematic()
	var info := UIKit.vbox(8)
	info.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	var reg: RegionData = DB.region(c.region)
	info.add_child(UIKit.label(reg.display_name.to_upper(), "Title", 18, reg.accent_color))
	var nm := UIKit.label(c.display_name, "Heading", 46, Color.WHITE)
	info.add_child(nm)
	var pills := HFlowContainer.new()
	pills.add_theme_constant_override("h_separation", 6)
	pills.add_child(UIKit.rarity_pill(c.rarity))
	for e in c.elements:
		pills.add_child(UIKit.element_pill(e))
	pills.add_child(UIKit.pill("Owned" if discovered else "Undiscovered", Palette.MOSS if discovered else Palette.INK_SOFT, Color.WHITE, "check" if discovered else "lock"))
	info.add_child(pills)
	info.add_child(UIKit.label(c.description, "", 18, Color("e8efe9"), true))
	info.add_child(UIKit.label("Ability — %s: %s" % [c.ability_name, c.ability_text], "", 18, Palette.GOLD, true))
	if discovered:
		var fr := UIKit.hbox(8)
		fr.add_child(UIKit.label("Friendship", "", 18, Color.WHITE))
		fr.add_child(UIKit.hearts(GameState.friendship_level(c.id), 5, 22.0))
		info.add_child(fr)
		info.add_child(UIKit.label("Ride unlocked!" if GameState.friendship_level(c.id) >= 3 else "Reach friendship 3 to ride.", "", 17, Palette.MOSS_LIGHT))
	info.add_child(UIKit.label("How to discover: " + c.discovery_hint, "", 18, Color("cfe0d6"), true))
	if not c.model_ready:
		info.add_child(UIKit.label("Arrives with the %s update. Not available for purchase." % reg.display_name, "", 17, Color("ffb3a0"), true))
	var anims := UIKit.hbox(6)
	for a in [["Idle", "idle"], ["Walk", "walk"], ["Stomp", "stomp"], ["Roar", "roar"], ["Rest", "sleep"]]:
		var ab := UIKit.button(a[0], "", "", 46)
		var an: String = a[1]
		ab.pressed.connect(func(): _viewer.play(an))
		ab.disabled = not c.model_ready
		anims.add_child(ab)
	info.add_child(anims)
	var cosp: ShopItemData = DB.product("verdantus_bloomguard")
	if sel_id == "verdantus" and cosp:
		var cb := UIKit.button("Bloomguard appearance — " + Store.price_label(cosp), "gem", "GoldButton", 56)
		cb.pressed.connect(func():
			_product = cosp.id
			_render())
		info.add_child(cb)
	sh.add_child(info)
	_content.add_child(stage)
	var strip := UIKit.hbox(10)
	for col in list:
		var b := UIKit.button(col.display_name if (GameState.is_discovered(col.id) or col.model_ready) else col.display_name, IconGlyph.element_icon(col.primary_element()), "TabButton", 54, 22)
		b.toggle_mode = true
		b.button_pressed = col.id == sel_id
		var cid: String = col.id
		b.pressed.connect(func():
			_search.set_meta("colossal_sel", cid)
			_render())
		strip.add_child(b)
	var sc := ScrollContainer.new()
	sc.vertical_scroll_mode = ScrollContainer.SCROLL_MODE_DISABLED
	sc.custom_minimum_size.y = 70
	sc.add_child(strip)
	_content.add_child(sc)
	_content.move_child(sc, 0)

func _cinematic() -> void:
	# Slow dolly-in on reveal.
	var cam := _viewer.cam
	var end := cam.position
	cam.position = end + Vector3(0, 0.3, 1.6)
	var tw := create_tween()
	tw.tween_property(cam, "position", end, 2.2).set_trans(Tween.TRANS_CUBIC).set_ease(Tween.EASE_OUT)
	if _viewer.rig:
		_viewer.rig.emote("roar", 2.0)

# ------------------------------------------------------------------ detail
func _render_detail(p: ShopItemData) -> void:
	if p == null:
		_product = ""
		_render()
		return
	var back := UIKit.button("Back", "back", "", 50, 22)
	back.size_flags_horizontal = Control.SIZE_SHRINK_BEGIN
	back.pressed.connect(func():
		_product = ""
		_render())
	_content.add_child(back)
	var split := UIKit.hbox(18)
	split.size_flags_vertical = Control.SIZE_EXPAND_FILL
	_content.add_child(split)
	var left := UIKit.vbox(8)
	left.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	_viewer.custom_minimum_size = Vector2(480, 380)
	_viewer.size_flags_vertical = Control.SIZE_EXPAND_FILL
	left.add_child(_viewer)
	match p.preview_kind:
		"creature", "colossal":
			_viewer.show_item(p.preview_kind, p.preview_id)
			var anims := UIKit.hbox(6)
			for a in [["Idle", "idle"], ["Walk", "walk"], ["Happy", "happy"], ["Sleep", "sleep"]]:
				var ab := UIKit.button(a[0], "", "", 46)
				var an: String = a[1]
				ab.pressed.connect(func(): _viewer.play(an))
				anims.add_child(ab)
			left.add_child(anims)
		"outfit":
			_viewer.show_item("outfit", p.preview_id)
			left.add_child(UIKit.label("Previewing on your Keeper", "Caption", 16))
		"decoration":
			_viewer.show_item("decoration", p.preview_id)
			if MeadowLevel.current and GameState.sanctuary_stage("oak") >= 1:
				var pv := UIKit.button("Preview in my sanctuary", "map", "", 54)
				pv.pressed.connect(func(): _preview_in_sanctuary(p))
				left.add_child(pv)
		_:
			_detach_viewer()
			var art := ProductArt.new()
			art.setup(p)
			art.custom_minimum_size = Vector2(420, 320)
			left.add_child(art)
	split.add_child(left)
	var right := UIKit.vbox(10)
	right.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	right.add_child(UIKit.label(p.display_name, "Heading", 36))
	var pills := HFlowContainer.new()
	pills.add_theme_constant_override("h_separation", 6)
	pills.add_child(UIKit.rarity_pill(p.rarity))
	for t in p.tags:
		pills.add_child(UIKit.pill(String(t).capitalize(), Palette.TEAL))
	right.add_child(pills)
	right.add_child(UIKit.label(p.description, "", 20, Color(0, 0, 0, 0), true))
	var cd: CreatureData = DB.creature(p.preview_id.split(":")[0]) if p.preview_kind in ["creature", "colossal"] else null
	if cd and p.currency == "none":
		for row in [["Size", "Colossal" if cd.is_colossal() else "Small"], ["Element", ", ".join(Array(cd.elements)).capitalize()], ["Habitat", cd.habitat], ["Personality", cd.personality.capitalize()], ["Ability", cd.ability_name + " — " + cd.ability_text]]:
			right.add_child(UIKit.label("%s: %s" % row, "", 18, Palette.INK_SOFT, true))
	if p.includes.size() > 0:
		right.add_child(UIKit.label("Includes", "Title", 20))
		for inc in p.includes:
			right.add_child(UIKit.label("• " + inc, "", 18, Color(0, 0, 0, 0), true))
	if p.grants.has("items"):
		for it in p.grants.items:
			right.add_child(UIKit.label("• %d × %s" % [p.grants.items[it], DB.item(it).display_name], "", 18))
	if p.earn_path != "":
		right.add_child(UIKit.label(p.earn_path, "", 18, Palette.MOSS_DARK, true))
	right.add_child(UIKit.spacer())
	var price_row := UIKit.hbox(10)
	price_row.add_child(UIKit.label("Price", "Title", 22))
	price_row.add_child(_price_chip(p))
	right.add_child(price_row)
	var reason := Store.block_reason(p)
	var owned := _owned(p)
	if owned and not p.stackable:
		var eq := _equip_button(p)
		if eq:
			right.add_child(eq)
		else:
			right.add_child(UIKit.pill("Owned", Palette.MOSS, Color.WHITE, "check"))
	elif p.currency == "none":
		right.add_child(UIKit.label(p.unavailable_reason if not p.available else "Not sold — earned through play.", "Title", 18, Palette.TEAL, true))
	else:
		var buy := UIKit.button("Buy for " + Store.price_label(p), "cart", "PrimaryButton", 66)
		buy.disabled = reason != ""
		buy.pressed.connect(func(): _confirm_purchase(p))
		right.add_child(buy)
		if reason != "":
			right.add_child(UIKit.label(reason, "Caption", 17, Palette.DANGER, true))
	split.add_child(right)

func _equip_button(p: ShopItemData) -> Button:
	var g: String = p.grants.get("cosmetic", "")
	if g == "":
		return null
	var parts := g.split(":")
	match parts[0]:
		"top", "hat", "backpack":
			var worn: bool = GameState.data.appearance.get(parts[0]) == parts[1]
			var b := UIKit.button("Wearing" if worn else "Wear now", "person", "PrimaryButton", 60)
			b.disabled = worn
			b.pressed.connect(func():
				GameState.data.appearance[parts[0]] = parts[1]
				Events.appearance_changed.emit()
				_render())
			return b
		"variant":
			var on := GameState.creature_cosmetic(parts[1]) == g
			var b := UIKit.button("Equipped" if on else "Equip on %s" % DB.creature(parts[1]).display_name, "paw", "PrimaryButton", 60)
			b.disabled = on or not GameState.is_discovered(parts[1])
			b.pressed.connect(func():
				GameState.set_creature_cosmetic(parts[1], g)
				if MeadowLevel.current and MeadowLevel.current.creatures.has(parts[1]):
					MeadowLevel.current.creatures[parts[1]].rebuild_model()
				_render())
			return b
	return null

# ------------------------------------------------------------------ purchase flow
func _confirm_purchase(p: ShopItemData) -> void:
	if _confirm:
		_confirm.queue_free()
	_confirm = Control.new()
	_confirm.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	_confirm.mouse_filter = Control.MOUSE_FILTER_STOP
	var dim := ColorRect.new()
	dim.color = Color(0, 0, 0, 0.45)
	dim.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	_confirm.add_child(dim)
	var card := PanelContainer.new()
	card.custom_minimum_size = Vector2(620, 0)
	_confirm.add_child(card)
	var v := UIKit.vbox(12)
	card.add_child(v)
	v.add_child(UIKit.label("Confirm purchase", "Heading", 30))
	v.add_child(UIKit.label(p.display_name, "Title", 24, Palette.MOSS_DARK))
	if p.currency == "real_money":
		v.add_child(UIKit.label("Price: %s" % Store.price_label(p), "", 20))
		v.add_child(UIKit.label("TEST PURCHASE — this development build uses a simulated store. No real money will be charged and no payment details are requested.", "", 18, Palette.DANGER, true))
	else:
		var after := GameState.currency(p.currency) - p.price
		v.add_child(UIKit.label("Price: %d %s" % [p.price, Store.currency_name(p.currency)], "", 20))
		v.add_child(UIKit.label("Balance after purchase: %d %s" % [after, Store.currency_name(p.currency)], "Caption", 18))
	var status := UIKit.label("", "Caption", 18, Color(0, 0, 0, 0), true)
	status.name = "Status"
	v.add_child(status)
	var row := UIKit.hbox(10)
	var cancel := UIKit.button("Cancel", "close", "", 60)
	cancel.pressed.connect(func():
		if not _busy:
			_confirm.queue_free()
			_confirm = null)
	var ok := UIKit.button("Confirm", "check", "PrimaryButton", 60)
	ok.name = "Confirm"
	ok.pressed.connect(func():
		if _busy:
			return
		_busy = true
		ok.disabled = true
		cancel.disabled = true
		status.text = "Contacting the test store…" if p.currency == "real_money" else "Processing…"
		Store.purchase(p.id))
	row.add_child(cancel)
	row.add_child(ok)
	v.add_child(row)
	add_child(_confirm)
	await get_tree().process_frame
	card.position = (get_viewport_rect().size - card.size) * 0.5

func _on_purchase_finished(pid: String, ok: bool, msg: String) -> void:
	_busy = false
	if _confirm:
		var st := _confirm.find_child("Status", true, false) as Label
		if st:
			st.text = msg
			st.add_theme_color_override("font_color", Palette.MOSS_DARK if ok else Palette.DANGER)
		var cb := _confirm.find_child("Confirm", true, false) as Button
		if cb:
			cb.visible = false
		var c := _confirm
		await get_tree().create_timer(1.4 if ok else 2.4).timeout
		if is_instance_valid(c):
			c.queue_free()
		if _confirm == c:
			_confirm = null
	if ok:
		Events.toast.emit("Purchase complete", msg, "cart")
	if visible:
		_refresh_currency()
		_render()

# ------------------------------------------------------------------ preview in sanctuary
func _preview_in_sanctuary(p: ShopItemData) -> void:
	var lvl := MeadowLevel.current
	var c := lvl.at("ancient_oak")
	var a := 0.9 + 6 * 0.55
	var pos := Vector3(c.x + cos(a) * 13.5, 0, c.z + sin(a) * 13.5)
	pos.y = lvl.terrain.height(pos.x, pos.z)
	var ghost := Props.node(Props.decoration(p.preview_id), "solid", pos, -a + PI * 0.5)
	lvl.add_child(ghost)
	visible = false
	lvl.player.focus_on(pos + Vector3(0, 1.0, 0))
	lvl.player.input_locked = true
	Events.toast.emit("Previewing " + p.display_name, "This is how it will look in your sanctuary.", "map")
	await get_tree().create_timer(4.5).timeout
	ghost.queue_free()
	lvl.player.clear_focus()
	lvl.player.input_locked = false
	visible = true
	_render()

# ------------------------------------------------------------------ history
func _render_history() -> void:
	_content.add_child(UIKit.label("Every purchase attempt is listed here, including failed ones.", "Caption", 17))
	var list := UIKit.vbox(8)
	var tx: Array = GameState.data.transactions
	if tx.is_empty():
		list.add_child(UIKit.label("No transactions yet.", "", 19, Palette.INK_SOFT))
	for t in tx:
		var card := UIKit.card()
		var h := UIKit.hbox(12)
		h.add_child(IconGlyph.make("check" if t.ok else "close", 30, Palette.MOSS if t.ok else Palette.DANGER))
		var v := UIKit.vbox(2)
		v.size_flags_horizontal = Control.SIZE_EXPAND_FILL
		v.add_child(UIKit.label(t.name + ("  (TEST)" if t.get("test", false) else ""), "Title", 20))
		v.add_child(UIKit.label("%s · %s · %s" % [t.time, t.price, t.note], "Caption", 16, Color(0, 0, 0, 0), true))
		h.add_child(v)
		card.add_child(h)
		list.add_child(card)
	_content.add_child(UIKit.scroll(list))

class ProductArt extends Control:
	## Card artwork without per-card 3D cost: portrait emblem or icon on a
	## rarity-tinted backdrop.
	var p: ShopItemData
	func setup(prod: ShopItemData) -> void:
		p = prod
		mouse_filter = Control.MOUSE_FILTER_IGNORE
		var cid := p.preview_id.split(":")[0]
		if p.preview_kind in ["creature", "colossal"] and DB.creature(cid):
			var cp := CreaturePortrait.new()
			cp.setup(DB.creature(cid), true)
			cp.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
			add_child(cp)
		else:
			var icon := "star"
			var col := Palette.GOLD
			match p.preview_kind:
				"outfit":
					icon = "person"
					col = Palette.MOSS
				"decoration":
					icon = "hammer"
					col = Palette.TEAL
				"icon":
					if DB.item(p.preview_id):
						icon = DB.item(p.preview_id).icon
						col = DB.item(p.preview_id).color
					elif p.preview_id == "gem":
						icon = "gem"
					else:
						icon = p.preview_id
			var g := IconGlyph.make(icon, 84, col)
			g.set_anchors_preset(Control.PRESET_CENTER)
			g.position -= Vector2(42, 42)
			add_child(g)
	func _draw() -> void:
		if p == null:
			return
		var rc := Palette.rarity_color(p.rarity)
		draw_style_box(UITheme.box(rc.lerp(Color.WHITE, 0.78), 16), Rect2(Vector2.ZERO, size))
		for i in 6:
			draw_circle(Vector2(size.x * (0.15 + i * 0.15), size.y * (0.2 + (i % 2) * 0.6)), 3, Color(rc, 0.35))
