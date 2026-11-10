class_name CreatureData
extends Resource
## Data definition for one Mythling species. Models are built by `CreatureModels`
## from `model_id`, so professional meshes can replace procedural ones later
## by pointing `model_scene` at an imported scene.

@export var id: String = ""
@export var display_name: String = ""
@export var region: String = "meadow"
@export var habitat: String = ""
@export var elements: PackedStringArray = PackedStringArray()
@export_enum("common", "uncommon", "rare", "epic", "legendary", "mythic") var rarity: String = "common"
@export var size_class: String = "small"  # small, medium, large, colossal
@export var personality: String = "curious"  # curious, shy, playful, sleepy, excited, calm, proud
@export_multiline var description: String = ""
@export_multiline var personality_text: String = ""
@export var ability_id: String = ""
@export var ability_name: String = ""
@export_multiline var ability_text: String = ""
@export var favorite_treat: String = ""
@export var base_stats: Dictionary = {"vitality": 10, "spirit": 10, "agility": 10}
@export var palette: PackedColorArray = PackedColorArray()
@export var model_id: String = ""
@export var model_scene: PackedScene  # optional imported model overriding procedural build
@export var locomotion: String = "quad"  # quad, hop, float, waddle, fly, swim
@export var move_speed: float = 2.0
@export var height: float = 0.6
@export var sound_pitch: float = 1.0
@export var friendship_notes: PackedStringArray = PackedStringArray()  # unlocked per level
@export var discovery_hint: String = ""
@export var rideable: bool = false
@export var model_ready: bool = false  # true when a playable model exists in this build
## Ability kit: [passive, primary, secondary, signature] AbilityData ids ("" = none).
@export var abilities: PackedStringArray = PackedStringArray()
## Evolution options from this form. Each: {"to": id, "path": "natural|alternate|ascended",
## "requirements": {"friendship": n, "level": n, "items": {id: n}, "ability_uses": {kind: n},
## "sanctuary": {site: stage}, "quest": id, "visited": [ids], "not_owned": id}, "text": flavour}
@export var evolutions: Array[Dictionary] = []
@export var evolves_from: String = ""
@export var family: String = ""
@export var stage: int = 1
## How it can be obtained: explore, evolve, quest, purchase.
@export var acquisition: PackedStringArray = PackedStringArray()
@export_multiline var lore: String = ""
@export var flight: bool = false  # rideable in the air
@export var originality_notes: String = ""
## AWAKENINGS: which per-family transformation sequence plays ("grove", "ember", "celestial", "tide", ...).
@export var awakening_style: String = ""
## What this form is best at, so earlier forms stay useful after an Awakening.
@export var form_role: String = ""

func primary_element() -> String:
	return elements[0] if elements.size() > 0 else "nature"

func is_colossal() -> bool:
	return size_class == "colossal"

func is_large() -> bool:
	return size_class == "large"

func size_label() -> String:
	return {"small": "Small", "large": "Large", "colossal": "Colossal"}.get(size_class, "Small")

func ability_in(slot_name: String) -> String:
	var i := ["passive", "primary", "secondary", "signature"].find(slot_name)
	return abilities[i] if i >= 0 and i < abilities.size() else ""
