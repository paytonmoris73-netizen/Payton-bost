extends Node
## Global signal bus. Systems emit here instead of holding references to each other.

## Generic gameplay event used by quests, achievements and analytics.
## kind examples: "talk", "discover", "interact", "collect", "restore", "reach",
## "ability", "companion", "open", "befriend", "purchase".
signal game_event(kind: String, id: String, amount: int)

signal creature_discovered(creature_id: String)
signal friendship_changed(creature_id: String, points: int, level: int)
signal companion_changed(creature_id: String)
signal inventory_changed(item_id: String, quantity: int)
signal currency_changed(currency: String, amount: int)
signal xp_changed(level: int, xp: int, xp_to_next: int)
signal level_up(level: int)
signal quest_started(quest_id: String)
signal quest_progress(quest_id: String)
signal quest_completed(quest_id: String)
signal sanctuary_changed(site_id: String, stage: int)
signal settings_changed()
signal appearance_changed()
signal ownership_changed(item_id: String)
signal toast(title: String, body: String, icon: String)
signal request_dialogue(speaker: String, lines: Array)
signal request_panel(panel_name: String, args: Dictionary)
signal achievement_unlocked(achievement_id: String)

func emit_game_event(kind: String, id: String, amount: int = 1) -> void:
	game_event.emit(kind, id, amount)
