class_name AbilityData
extends Resource
## One Mythling ability. `effect` names a handler in AbilitySystem; `params`
## configures it. New abilities are new .tres files, not new code, unless they
## need a brand-new kind of effect.

@export var id: String = ""
@export var display_name: String = ""
@export_enum("passive", "primary", "secondary", "signature") var slot: String = "primary"
@export_enum("exploration", "environmental", "movement", "support", "signature") var category: String = "exploration"
@export_multiline var description: String = ""
@export var effect: String = ""  # reveal, highlight, harvest, dash, glide, wind_lift, root_bridge, swim_boost, calm, regrow, light, passive_*
@export var params: Dictionary = {}
@export var cooldown: float = 6.0
@export var unlock_friendship: int = 0  # friendship level required (0 = always)
@export var requires_evolved: bool = false
@export var vfx: String = "burst"  # leaf_spiral, ember_crown, star_field, water_ring, wind_column, root_wave, rune_pulse, burst
@export var color: Color = Color.WHITE
@export var sound: String = "ability"
