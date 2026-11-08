class_name ShopItemData
extends Resource
## One product in the Grand Market. Prices are exact and always shown.

@export var id: String = ""
@export var display_name: String = ""
@export_enum("creature", "large", "colossal", "clothing", "creature_cosmetic", "sanctuary", "collection", "rotating", "currency") var category: String = "clothing"
@export_multiline var description: String = ""
@export_enum("gold", "crystals", "star_gems", "real_money", "none") var currency: String = "gold"
@export var price: int = 0
@export var real_price_label: String = ""  # e.g. "$4.99" – only for currency packs (mock in dev)
@export var grants: Dictionary = {}  # {"star_gems": 500} or {"items": {"sunberry": 3}} or {"own": true}
@export var stackable: bool = false  # consumables can be bought repeatedly
@export var rarity: String = "common"
@export var preview_kind: String = "icon"  # creature, colossal, outfit, icon, decoration
@export var preview_id: String = ""  # creature id / outfit id / icon name
@export var preview_color: Color = Color.WHITE
@export var available: bool = true
@export var unavailable_reason: String = ""
@export var earn_path: String = ""  # how to get it through play, if any
@export var requires_owned: String = ""  # e.g. creature cosmetic needs the creature discovered
@export var min_level: int = 1
@export var tags: PackedStringArray = PackedStringArray()
@export var includes: PackedStringArray = PackedStringArray()
@export var featured: bool = false
