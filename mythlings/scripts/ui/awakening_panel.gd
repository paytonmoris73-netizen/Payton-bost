class_name AwakeningPanel
extends UIPanel
## AWAKENING screen: the current form and the potential form side by side
## (both drag-to-rotate), every requirement with progress, the abilities and
## characteristics the new form brings, its size category, a true-scale size
## comparison (with a village cottage for colossal forms) and a preview of the
## transformation sequence. Awakening only happens when the player presses
## Awaken; nothing is automatic and nothing can be bought.

var viewers: Array = []
var size_viewer: ModelViewer
var _from := ""
var _index := 0
var _info: VBoxContainer
var _views: HBoxContainer

func build_content() -> void:
	setup_frame("Awakening", "evolve")
	_views = UIKit.hbox(12)
	_views.custom_minimum_size.y = 300
	body.add_child(_views)
	_info = UIKit.vbox(10)
	var sc := UIKit.scroll(_info)
	sc.size_flags_vertical = Control.SIZE_EXPAND_FILL
	body.add_child(sc)

func on_open(args: Dictionary) -> void:
	_from = String(args.get("id", ""))
	_index = int(args.get("index", 0))

func _viewer_card(cid: String, caption: String, colossal: bool) -> VBoxContainer:
	var v := UIKit.vbox(4)
	v.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	var mv := ModelViewer.new()
	mv.custom_minimum_size = Vector2(0, 250)
	mv.size_flags_vertical = Control.SIZE_EXPAND_FILL
	v.add_child(mv)
	mv.show_item("colossal" if colossal else "creature", cid)
	viewers.append(mv)
	var l := UIKit.label(caption, "Title", 18)
	l.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	v.add_child(l)
	return v

func refresh() -> void:
	UIKit.clear(_views)
	UIKit.clear(_info)
	viewers.clear()
	size_viewer = null
	var a: CreatureData = DB.creature(_from)
	var opts := Evolution.options(_from)
	if a == null or _index < 0 or _index >= opts.size():
		_info.add_child(UIKit.label("No Awakening available.", "", 18))
		return
	var e: Dictionary = opts[_index]
	var b: CreatureData = DB.creature(e.to)
	title_label.text = "Awakening: %s → %s" % [a.display_name, b.display_name]
	_views.add_child(_viewer_card(a.id, "%s · %s · %s" % [a.display_name, Evolution.stage_name(a), a.size_label()], a.is_colossal()))
	var mid := UIKit.vbox(6)
	mid.alignment = BoxContainer.ALIGNMENT_CENTER
	mid.add_child(IconGlyph.make("evolve", 46, Palette.MOSS))
	mid.add_child(UIKit.label(String(e.get("branch", Evolution.PATH_NAMES.get(e.path, ""))), "Caption", 16))
	_views.add_child(mid)
	_views.add_child(_viewer_card(b.id, "%s · %s · %s" % [b.display_name, Evolution.stage_name(b), b.size_label()], b.is_colossal()))
	_views.add_child(_size_card(b))
	# What changes.
	var pills := HFlowContainer.new()
	pills.add_theme_constant_override("h_separation", 6)
	pills.add_theme_constant_override("v_separation", 6)
	pills.add_child(UIKit.pill(Evolution.PATH_NAMES.get(e.path, e.path), Palette.MOSS_DARK, Color.WHITE, "evolve"))
	if e.has("branch"):
		pills.add_child(UIKit.pill(String(e.branch), Palette.GOLD_DARK, Color.WHITE, "star"))
	pills.add_child(UIKit.pill("%s → %s" % [Evolution.stage_name(a), Evolution.stage_name(b)], Palette.TEAL, Color.WHITE, "star"))
	pills.add_child(UIKit.pill("Size: %s → %s" % [a.size_label(), b.size_label()], Palette.TEAL, Color.WHITE, "size"))
	if b.rideable:
		pills.add_child(UIKit.pill("Rideable", Palette.MOSS, Color.WHITE, "paw"))
	_info.add_child(pills)
	_info.add_child(UIKit.label(String(e.get("text", "")), "", 17, Color(0, 0, 0, 0), true))
	_section("New characteristics")
	_info.add_child(UIKit.label(b.description, "", 16, Color(0, 0, 0, 0), true))
	if b.personality_text != "":
		_info.add_child(UIKit.label(b.personality_text, "", 16, Palette.INK_SOFT, true))
	if b.form_role != "":
		_info.add_child(UIKit.label("Best at: " + b.form_role, "", 16, Palette.MOSS_DARK, true))
	if a.form_role != "":
		_info.add_child(UIKit.label("%s stays useful: %s" % [a.display_name, a.form_role], "Caption", 15, Color(0, 0, 0, 0), true))
	_section("Abilities after Awakening")
	var old_kit: Array = Array(a.abilities)
	for ab in Abilities.kit(b.id):
		var r := UIKit.hbox(8)
		var is_new: bool = not (ab.id in old_kit)
		r.add_child(UIKit.pill("New" if is_new else "Kept", Palette.GOLD_DARK if is_new else Palette.INK_SOFT))
		r.add_child(UIKit.label("%s (%s) — %s" % [ab.display_name, ab.slot.capitalize(), ab.description], "", 15, Color(0, 0, 0, 0), true))
		r.get_child(1).size_flags_horizontal = Control.SIZE_EXPAND_FILL
		_info.add_child(r)
	_section("Requirements")
	for req in Evolution.requirements(a.id, e):
		var rr := UIKit.hbox(6)
		rr.add_child(IconGlyph.make("check" if req.met else "sparkle", 20, Palette.MOSS if req.met else Palette.INK_SOFT))
		var rl := UIKit.label(req.label, "", 16, Palette.MOSS_DARK if req.met else Palette.INK, true)
		rl.size_flags_horizontal = Control.SIZE_EXPAND_FILL
		rr.add_child(rl)
		if req.progress != "":
			rr.add_child(UIKit.label(req.progress, "Caption", 15))
		_info.add_child(rr)
	if Evolution.joins_elder(a.id, e):
		_info.add_child(UIKit.label("You already befriended the elder %s. Your %s will take up its mantle and the two bonds become one; nothing is lost." % [b.display_name, a.display_name], "Caption", 15, Palette.TEAL, true))
	_info.add_child(UIKit.label("Your %s is remembered after Awakening: you can still bring it along from the Mythlings menu, and other paths stay open." % a.display_name, "Caption", 15, Color(0, 0, 0, 0), true))
	var row := UIKit.hbox(10)
	var prev := UIKit.button("Preview transformation", "play", "", 58)
	prev.pressed.connect(_preview.bind(a.id, b.id))
	row.add_child(prev)
	var already := Evolution.already_awakened(a.id, e)
	var go := UIKit.button("Already awakened" if already else "Awaken into %s" % b.display_name, "evolve", "PrimaryButton", 58)
	go.disabled = not Evolution.can_evolve(a.id, e)
	go.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	go.pressed.connect(_awaken)
	row.add_child(go)
	_info.add_child(row)
	if not b.model_ready:
		_info.add_child(UIKit.label("This form's model isn't in this build yet, so it can't be awakened.", "Caption", 15, Palette.DANGER, true))

func _size_card(b: CreatureData) -> VBoxContainer:
	var v := UIKit.vbox(4)
	v.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	size_viewer = ModelViewer.new()
	size_viewer.custom_minimum_size = Vector2(0, 250)
	size_viewer.size_flags_vertical = Control.SIZE_EXPAND_FILL
	size_viewer.scale_ref = true
	size_viewer.building_ref = b.is_colossal()
	size_viewer.auto_rotate = false
	v.add_child(size_viewer)
	size_viewer.show_item("colossal" if b.is_colossal() else "creature", b.id)
	var l := UIKit.label("True size beside your Keeper" + (" and a village cottage" if b.is_colossal() else ""), "Caption", 15)
	l.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	l.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	v.add_child(l)
	return v

func _section(t: String) -> void:
	_info.add_child(UIKit.label(t, "Title", 20))

func _preview(a: String, b: String) -> void:
	if game_ui and game_ui.has_method("play_evolution"):
		await close()
		game_ui.play_evolution(a, b)

func _awaken() -> void:
	var a := _from
	var e: Dictionary = Evolution.options(a)[_index]
	if Evolution.evolve(a, _index):
		await close()
		if game_ui and game_ui.has_method("play_evolution"):
			game_ui.play_evolution(a, e.to)
