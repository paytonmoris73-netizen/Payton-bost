class_name RestorePanel
extends UIPanel
## Shows what a sanctuary stage needs and performs the restoration.

var site: SanctuarySite
var _box: VBoxContainer

func build_content() -> void:
	max_size = Vector2(820, 720)
	setup_frame("Restoration", "hammer")
	_box = UIKit.vbox(12)
	body.add_child(_box)

func on_open(args: Dictionary) -> void:
	site = args.get("site")

func refresh() -> void:
	UIKit.clear(_box)
	if site == null:
		return
	title_label.text = site.title.capitalize() if site.title.begins_with("the") else site.title
	var stage := site.stage()
	var dots := UIKit.hbox(8)
	for i in site.max_stage():
		dots.add_child(UIKit.pill("Stage %d" % (i + 1), Palette.MOSS if i < stage else Color("c9c0ad"), Color.WHITE, "check" if i < stage else ""))
	_box.add_child(dots)
	var info := site.next_info()
	if info.is_empty():
		_box.add_child(UIKit.label("Fully restored! Mythlings feel at home here.", "Title", 24, Palette.MOSS_DARK, true))
		return
	_box.add_child(UIKit.label(info.title, "Heading", 30))
	_box.add_child(UIKit.label(info.desc, "", 20, Color(0, 0, 0, 0), true))
	_box.add_child(UIKit.label("Materials", "Title", 20))
	for id in info.cost:
		var d: ItemData = DB.item(id)
		var have := GameState.item_count(id)
		var need := int(info.cost[id])
		var row := UIKit.hbox(10)
		row.add_child(IconGlyph.make(d.icon, 36, d.color))
		var l := UIKit.label(d.display_name, "", 20)
		l.size_flags_horizontal = Control.SIZE_EXPAND_FILL
		row.add_child(l)
		row.add_child(UIKit.label("%d / %d" % [have, need], "Title", 22, Palette.MOSS_DARK if have >= need else Palette.DANGER))
		_box.add_child(row)
	var reason := site.can_restore()
	if int(info.get("min_level", 1)) > 1:
		_box.add_child(UIKit.label("Requires Keeper level %d (you are %d)." % [int(info.min_level), GameState.level()], "Caption", 17))
	var b := UIKit.button("Restore", "hammer", "PrimaryButton", 66)
	b.disabled = reason != ""
	b.pressed.connect(func():
		if site.restore():
			await close())
	_box.add_child(b)
	if reason != "":
		_box.add_child(UIKit.label(reason, "Caption", 17, Palette.DANGER, true))
