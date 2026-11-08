class_name RegionData
extends Resource

@export var id: String = ""
@export var display_name: String = ""
@export_multiline var description: String = ""
@export var difficulty: String = "Beginner"
@export var unlock_level: int = 1
@export var unlock_quest: String = ""
@export var playable: bool = false  # whether a scene exists in this build
@export var theme_color: Color = Color.WHITE
@export var accent_color: Color = Color.WHITE
@export var map_position: Vector2 = Vector2.ZERO  # 0..1 on the world map
@export var locations: PackedStringArray = PackedStringArray()  # location ids
@export var location_names: PackedStringArray = PackedStringArray()  # parallel display names
@export var location_texts: PackedStringArray = PackedStringArray()  # parallel descriptions
@export var creatures: PackedStringArray = PackedStringArray()
@export var colossal: String = ""
@export var resource_item: String = ""
