extends Node
## Loads every data resource in resources/* at startup so new creatures,
## quests, items and products are added by dropping in a .tres file.

var creatures: Dictionary = {}  # id -> CreatureData
var items: Dictionary = {}
var quests: Dictionary = {}
var regions: Dictionary = {}
var shop: Dictionary = {}
var abilities: Dictionary = {}

const REGION_ORDER := ["meadow", "emberfall", "tideglass", "frostroot", "sunpetal", "starfall"]

## Achievements are small enough to live in code; condition evaluated by GameState.
const ACHIEVEMENTS := [
	{"id": "first_discovery", "name": "First Discovery", "desc": "Discover your first Mythling.", "stat": "discovered", "goal": 1, "gold": 50},
	{"id": "nature_explorer", "name": "Nature Explorer", "desc": "Visit every landmark in Whispering Meadow.", "stat": "landmarks_meadow", "goal": 5, "gold": 150},
	{"id": "best_friends", "name": "Best Friends", "desc": "Reach friendship level 5 with any Mythling.", "stat": "max_friendship", "goal": 5, "crystals": 10},
	{"id": "sanctuary_restorer", "name": "Sanctuary Restorer", "desc": "Fully restore a sanctuary.", "stat": "sanctuary_max", "goal": 3, "crystals": 15},
	{"id": "meadow_naturalist", "name": "Meadow Naturalist", "desc": "Discover all six Whispering Meadow Mythlings.", "stat": "discovered_meadow", "goal": 6, "crystals": 20},
	{"id": "gentle_giant", "name": "Gentle Giant", "desc": "Earn the trust of a Colossal Mythling.", "stat": "colossal_discovered", "goal": 1, "crystals": 25, "star_gems": 50},
	{"id": "gatherer", "name": "Gatherer", "desc": "Collect 50 resources.", "stat": "resources_collected", "goal": 50, "gold": 100},
	{"id": "master_collector", "name": "Master Collector", "desc": "Discover all 36 standard Mythlings.", "stat": "discovered_standard", "goal": 36, "crystals": 100},
	{"id": "ocean_adventurer", "name": "Ocean Adventurer", "desc": "Discover every Tideglass Coast Mythling.", "stat": "discovered_tideglass", "goal": 6, "crystals": 20},
	{"id": "first_evolution", "name": "Grown Together", "desc": "Help a Mythling evolve.", "stat": "evolutions", "goal": 1, "crystals": 20},
	{"id": "starfall_explorer", "name": "Starfall Explorer", "desc": "Discover every Starfall Isles Mythling.", "stat": "discovered_starfall", "goal": 6, "crystals": 30},
]

## Character customisation options. Clothing that is sold in the market is
## referenced by id from ShopItemData.grants.own and must be owned to equip.
const HAIR_STYLES := ["short", "tousled", "long", "bun", "braids", "curly"]
const HAIR_COLORS := ["3b2a20", "6b4423", "c98b4a", "e8cf8a", "1c1c22", "b8463c", "d9d4cf", "5d7fbf"]
const SKIN_TONES := ["f6d7bf", "e8b994", "c98e66", "9c6644", "6e4630", "4a2e20"]
const OUTFIT_COLORS := ["4f8a5b", "2f7d86", "c4583f", "e8b64c", "6c5aa8", "f0ebe0", "3b4a6b", "b86a8a"]
## Free starter clothing. Market items extend these lists via ownership.
const FREE_TOPS := ["tunic", "vest"]
const FREE_HATS := ["none", "headband"]
const FREE_BACKPACKS := ["satchel"]
const ALL_TOPS := ["tunic", "vest", "explorer_jacket", "ember_coat", "tide_wrap", "frost_parka", "star_robe"]
const ALL_HATS := ["none", "headband", "leaf_cap", "explorer_hat", "flower_crown", "star_circlet"]
const ALL_BACKPACKS := ["satchel", "rucksack", "mossbun_pack", "lantern_pack"]

func _ready() -> void:
	_load_dir("res://resources/creatures", creatures)
	_load_dir("res://resources/items", items)
	_load_dir("res://resources/quests", quests)
	_load_dir("res://resources/regions", regions)
	_load_dir("res://resources/shop", shop)
	_load_dir("res://resources/abilities", abilities)
	print("[DB] creatures=%d items=%d quests=%d regions=%d shop=%d" % [creatures.size(), items.size(), quests.size(), regions.size(), shop.size()])

func _load_dir(path: String, into: Dictionary) -> void:
	var dir := DirAccess.open(path)
	if dir == null:
		push_error("[DB] Missing data directory: %s" % path)
		return
	for f in dir.get_files():
		var file := f.trim_suffix(".remap")  # exported builds remap .tres files
		if not (file.ends_with(".tres") or file.ends_with(".res")):
			continue
		var res = load(path.path_join(file))
		if res == null or not ("id" in res) or String(res.id) == "":
			push_error("[DB] Invalid resource: %s" % file)
			continue
		if into.has(res.id):
			push_error("[DB] Duplicate id '%s' in %s" % [res.id, path])
		into[res.id] = res

func creature(id: String) -> CreatureData:
	return creatures.get(id)

func ability(id: String) -> AbilityData:
	return abilities.get(id)

func item(id: String) -> ItemData:
	return items.get(id)

func quest(id: String) -> QuestData:
	return quests.get(id)

func region(id: String) -> RegionData:
	return regions.get(id)

func product(id: String) -> ShopItemData:
	return shop.get(id)

func creatures_in_region(region_id: String, include_colossal := false) -> Array:
	var out: Array = []
	for c in creatures.values():
		if c.region == region_id and (include_colossal or not c.is_colossal()):
			out.append(c)
	out.sort_custom(func(a, b): return _rarity_rank(a.rarity) < _rarity_rank(b.rarity) or (_rarity_rank(a.rarity) == _rarity_rank(b.rarity) and a.display_name < b.display_name))
	return out

## Base-form species found in the wild (the "36" of the collection).
func standard_creatures() -> Array:
	var out: Array = []
	for r in REGION_ORDER:
		for c in creatures_in_region(r):
			if c.evolves_from == "":
				out.append(c)
	return out

## Forms reached through evolution (excluding colossals).
func evolved_creatures() -> Array:
	var out: Array = []
	for r in REGION_ORDER:
		for c in creatures_in_region(r):
			if c.evolves_from != "":
				out.append(c)
	return out

## Every stage in a family, ordered by stage.
func family(fam: String) -> Array:
	var out: Array = []
	if fam == "":
		return out
	for c in creatures.values():
		if c.family == fam:
			out.append(c)
	out.sort_custom(func(a, b): return a.stage < b.stage or (a.stage == b.stage and a.display_name < b.display_name))
	return out

func colossal_creatures() -> Array:
	var out: Array = []
	for r in REGION_ORDER:
		for c in creatures.values():
			if c.region == r and c.is_colossal():
				out.append(c)
	return out

func _rarity_rank(r: String) -> int:
	return ["common", "uncommon", "rare", "epic", "legendary", "mythic"].find(r)

func achievement(id: String) -> Dictionary:
	for a in ACHIEVEMENTS:
		if a.id == id:
			return a
	return {}
