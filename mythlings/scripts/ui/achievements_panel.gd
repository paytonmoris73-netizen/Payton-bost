class_name AchievementsPanel
extends UIPanel

var _list: VBoxContainer

func build_content() -> void:
	setup_frame("Achievements", "trophy")
	max_size = Vector2(1100, 860)
	_list = UIKit.vbox(10)
	body.add_child(UIKit.scroll(_list))

func refresh() -> void:
	UIKit.clear(_list)
	for a in DB.ACHIEVEMENTS:
		var done: bool = a.id in GameState.data.achievements
		var card := UIKit.card()
		var h := UIKit.hbox(14)
		h.add_child(IconGlyph.make("trophy", 48, Palette.GOLD if done else Color("c9c0ad")))
		var v := UIKit.vbox(2)
		v.size_flags_horizontal = Control.SIZE_EXPAND_FILL
		v.add_child(UIKit.label(a.name, "Title", 22, Palette.INK if done else Palette.INK_SOFT))
		v.add_child(UIKit.label(a.desc, "Caption", 17))
		var bar := ProgressBar.new()
		bar.show_percentage = false
		bar.custom_minimum_size.y = 10
		bar.max_value = int(a.goal)
		bar.value = mini(GameState.stat_value(a.stat), int(a.goal))
		v.add_child(bar)
		h.add_child(v)
		var reward := "%d Gold" % a.gold if a.has("gold") else "%d Crystals" % a.crystals
		h.add_child(UIKit.pill("Earned" if done else reward, Palette.MOSS if done else Palette.GOLD_DARK, Color.WHITE, "check" if done else IconGlyph.currency_icon("gold" if a.has("gold") else "crystals")))
		card.add_child(h)
		_list.add_child(card)
