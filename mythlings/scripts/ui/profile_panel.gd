class_name ProfilePanel
extends UIPanel
## Keeper profile: appearance preview, stats and shortcuts.

var _viewer: ModelViewer
var _stats: VBoxContainer

func build_content() -> void:
	setup_frame("Keeper Profile", "person")
	var split := UIKit.hbox(18)
	split.size_flags_vertical = Control.SIZE_EXPAND_FILL
	body.add_child(split)
	_viewer = ModelViewer.new()
	_viewer.custom_minimum_size = Vector2(420, 0)
	_viewer.size_flags_vertical = Control.SIZE_EXPAND_FILL
	split.add_child(_viewer)
	var right := UIKit.vbox(12)
	right.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	_stats = UIKit.vbox(8)
	right.add_child(UIKit.scroll(_stats))
	var row := UIKit.hbox(10)
	var cust := UIKit.button("Customise", "person", "PrimaryButton", 60)
	cust.pressed.connect(func():
		await close()
		Events.request_panel.emit("customize", {}))
	var ach := UIKit.button("Achievements", "trophy", "", 60)
	ach.pressed.connect(func():
		await close()
		Events.request_panel.emit("achievements", {}))
	row.add_child(cust)
	row.add_child(ach)
	right.add_child(row)
	split.add_child(right)

func refresh() -> void:
	_viewer.show_item("player", "")
	UIKit.clear(_stats)
	_stats.add_child(UIKit.label(String(GameState.data.player.name), "Heading", 34))
	_stats.add_child(UIKit.label("Keeper level %d" % GameState.level(), "Title", 22, Palette.MOSS_DARK))
	var pt := int(GameState.data.player.play_time)
	for row in [
		["Mythlings discovered", "%d / %d" % [GameState.discovered_count(), DB.standard_creatures().size()]],
		["Colossal Mythlings", "%d / %d" % [GameState.stat_value("colossal_discovered"), DB.colossal_creatures().size()]],
		["Quests completed", str(Quests.completed().size())],
		["Places visited", str(GameState.data.visited.size())],
		["Resources gathered", str(GameState.data.stats.resources_collected)],
		["Achievements", "%d / %d" % [GameState.data.achievements.size(), DB.ACHIEVEMENTS.size()]],
		["Time in Mythlings", "%dh %02dm" % [pt / 3600, (pt / 60) % 60]],
	]:
		var h := UIKit.hbox(10)
		var k := UIKit.label(row[0], "", 20, Palette.INK_SOFT)
		k.size_flags_horizontal = Control.SIZE_EXPAND_FILL
		h.add_child(k)
		h.add_child(UIKit.label(row[1], "Title", 22))
		_stats.add_child(h)
