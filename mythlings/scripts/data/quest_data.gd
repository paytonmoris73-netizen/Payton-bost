class_name QuestData
extends Resource
## Objectives are dictionaries: {"event": "collect:wood", "count": 5, "label": "Gather wood"}
## The event string matches Events.game_event "kind:id". Use "kind:*" to match any id.

@export var id: String = ""
@export var title: String = ""
@export_enum("main", "region", "creature", "exploration", "daily", "collection") var category: String = "main"
@export var region: String = "meadow"
@export_multiline var description: String = ""
@export var objectives: Array[Dictionary] = []
@export var rewards: Dictionary = {"xp": 0, "gold": 0}
@export var prerequisites: PackedStringArray = PackedStringArray()
@export var min_level: int = 1
@export var auto_start: bool = true
@export var giver: String = ""
@export var start_dialogue: PackedStringArray = PackedStringArray()
@export var end_dialogue: PackedStringArray = PackedStringArray()
@export var sort_order: int = 0
@export var map_marker: String = ""  # world location id for the tracker
