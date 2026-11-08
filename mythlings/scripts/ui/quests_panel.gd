class_name QuestsPanel
extends UIPanel
## Quest log grouped by category, with objective progress, rewards and tracking.

var _list: VBoxContainer
var _detail: VBoxContainer
var _selected := ""
var _show_done := false

func build_content() -> void:
	setup_frame("Quests", "quest")
	var top := UIKit.hbox(8)
	var active_b := UIKit.button("Active", "", "TabButton", 50)
	var done_b := UIKit.button("Completed", "", "TabButton", 50)
	active_b.toggle_mode = true
	done_b.toggle_mode = true
	active_b.button_pressed = true
	active_b.pressed.connect(func():
		_show_done = false
		done_b.button_pressed = false
		active_b.button_pressed = true
		refresh())
	done_b.pressed.connect(func():
		_show_done = true
		active_b.button_pressed = false
		done_b.button_pressed = true
		refresh())
	top.add_child(active_b)
	top.add_child(done_b)
	body.add_child(top)
	var split := UIKit.hbox(16)
	split.size_flags_vertical = Control.SIZE_EXPAND_FILL
	body.add_child(split)
	_list = UIKit.vbox(8)
	var sc := UIKit.scroll(_list)
	split.add_child(sc)
	var card := UIKit.card()
	card.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	card.size_flags_vertical = Control.SIZE_EXPAND_FILL
	_detail = UIKit.vbox(10)
	card.add_child(UIKit.scroll(_detail))
	split.add_child(card)

func refresh() -> void:
	UIKit.clear(_list)
	var ids: Array = Quests.completed().duplicate() if _show_done else Quests.active().keys()
	var cats := ["main", "region", "creature", "exploration", "collection", "daily"]
	var names := {"main": "Main Story", "region": "Region", "creature": "Mythling Requests", "exploration": "Exploration", "collection": "Collection", "daily": "Daily (optional)"}
	var any := false
	for cat in cats:
		var qs: Array = []
		for id in ids:
			var q: QuestData = DB.quest(id)
			if q and q.category == cat:
				qs.append(q)
		if qs.is_empty():
			continue
		qs.sort_custom(func(a, b): return a.sort_order < b.sort_order)
		_list.add_child(UIKit.label(names[cat], "Title", 20, Palette.MOSS_DARK))
		for q in qs:
			any = true
			_list.add_child(_row(q))
	if not any:
		_list.add_child(UIKit.label("No quests here yet.", "Caption", 18))
	if _selected == "" or not (_selected in ids):
		_selected = Quests.tracked() if (not _show_done and Quests.tracked() != "") else (ids[0] if ids.size() > 0 else "")
	_show(_selected)

func _row(q: QuestData) -> Button:
	var b := UIKit.button(q.title, "star" if Quests.tracked() == q.id else ("check" if Quests.is_completed(q.id) else "quest"), "", 58, 22)
	b.custom_minimum_size.x = 380
	if q.id == _selected:
		b.add_theme_stylebox_override("normal", UITheme.box(Palette.CARD, 16, Palette.GOLD, 3, 0, 16))
	b.pressed.connect(func():
		_selected = q.id
		refresh())
	return b

func _show(id: String) -> void:
	UIKit.clear(_detail)
	var q: QuestData = DB.quest(id)
	if q == null:
		return
	_detail.add_child(UIKit.label(q.title, "Heading", 30))
	_detail.add_child(UIKit.pill(q.category.capitalize(), Palette.TEAL))
	_detail.add_child(UIKit.label(q.description, "", 20, Color(0, 0, 0, 0), true))
	_detail.add_child(UIKit.label("Objectives", "Title", 20))
	for i in q.objectives.size():
		var done := Quests.is_completed(id) or Quests.objective_done(id, i)
		var row := UIKit.hbox(8)
		row.add_child(IconGlyph.make("check" if done else "sparkle", 24, Palette.MOSS if done else Palette.INK_SOFT))
		var need := int(q.objectives[i].get("count", 1))
		var txt: String = q.objectives[i].label
		if need > 1:
			txt += "  (%d/%d)" % [need if Quests.is_completed(id) else Quests.progress_of(id, i), need]
		row.add_child(UIKit.label(txt, "", 19, Palette.MOSS_DARK if done else Palette.INK, true))
		_detail.add_child(row)
	_detail.add_child(UIKit.label("Rewards", "Title", 20))
	var rw := HFlowContainer.new()
	rw.add_theme_constant_override("h_separation", 8)
	for k in q.rewards:
		if k == "items":
			for it in q.rewards.items:
				rw.add_child(UIKit.pill("%d× %s" % [q.rewards.items[it], DB.item(it).display_name], Palette.MOSS_DARK, Color.WHITE, DB.item(it).icon))
		elif k == "xp":
			rw.add_child(UIKit.pill("%d XP" % q.rewards.xp, Palette.GOLD_DARK, Color.WHITE, "star"))
		else:
			rw.add_child(UIKit.pill("%d %s" % [q.rewards[k], Store.currency_name(k)], Palette.TEAL, Color.WHITE, IconGlyph.currency_icon(k)))
	_detail.add_child(rw)
	if Quests.is_active(id):
		var track := UIKit.button("Tracking" if Quests.tracked() == id else "Track this quest", "map", "PrimaryButton", 58)
		track.disabled = Quests.tracked() == id
		track.pressed.connect(func():
			GameState.data.quests.tracked = id
			Events.quest_progress.emit(id)
			refresh())
		_detail.add_child(track)
