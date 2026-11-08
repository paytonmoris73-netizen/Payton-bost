class_name ItemData
extends Resource

@export var id: String = ""
@export var display_name: String = ""
@export_enum("material", "treat", "special", "quest") var category: String = "material"
@export_multiline var description: String = ""
@export var icon: String = "leaf"  # name understood by IconGlyph
@export var color: Color = Color.WHITE
@export var max_stack: int = 99
@export var sell_value: int = 0  # gold; 0 = cannot be sold
@export var region: String = "meadow"
