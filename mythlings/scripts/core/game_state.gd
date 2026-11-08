extends Node
## Single source of truth for persistent player progress. Everything in `data`
## is JSON-serialisable and saved by SaveManager.

const FRIENDSHIP_THRESHOLDS := [0, 10, 25, 45, 70, 100]
const INVENTORY_SLOTS := 40
const INTERACTION_COOLDOWN := 25.0  # seconds per creature per interaction type

var data: Dictionary = {}
var _cooldowns: Dictionary = {}  # runtime only: "creature:kind" -> unix time
var session_active := false

func _ready() -> void:
	data = default_data()

func default_data() -> Dictionary:
	return {
		"player": {
			"name": "Keeper",
			"level": 1,
			"xp": 0,
			"region": "meadow",
			"position": null,
			"play_time": 0.0,
		},
		"appearance": {
			"skin": DB.SKIN_TONES[1], "hair_style": "tousled", "hair_color": DB.HAIR_COLORS[1],
			"top": "tunic", "top_color": DB.OUTFIT_COLORS[0], "pants_color": "3b4a6b",
			"hat": "none", "backpack": "satchel", "shoes_color": "6b4423",
		},
		"currencies": {"gold": 120, "crystals": 5, "star_gems": 0},
		"inventory": {"sunberry": 3},
		"creatures": {},  # id -> {"discovered": bool, "friendship": int, "discovered_at": String, "cosmetic": String}
		"companion": "",
		"quests": {"active": {}, "completed": [], "daily_date": "", "tracked": ""},
		"sanctuary": {},  # site id -> stage
		"owned": [],  # shop products / cosmetics owned
		"transactions": [],
		"achievements": [],
		"stats": {"resources_collected": 0, "interactions": 0},
		"flags": {},
		"visited": [],
		"settings": default_settings(),
	}

func default_settings() -> Dictionary:
	return {
		"master": 0.9, "music": 0.7, "sfx": 0.9, "muted": false,
		"sensitivity": 1.0, "invert_y": false, "graphics": "medium",
		"show_fps": false, "ui_scale": 1.0, "joystick_size": 1.0, "reduce_motion": false, "reduced_effects": false,
	}

# ---------------------------------------------------------------- helpers
func setting(key: String):
	return data.settings.get(key, default_settings().get(key))

func set_setting(key: String, value) -> void:
	data.settings[key] = value
	Events.settings_changed.emit()

func flag(key: String, default_value = false):
	return data.flags.get(key, default_value)

func set_flag(key: String, value = true) -> void:
	data.flags[key] = value

# ---------------------------------------------------------------- level & xp
func level() -> int:
	return int(data.player.level)

func xp_to_next(lv: int = -1) -> int:
	if lv < 0:
		lv = level()
	return 100 + (lv - 1) * 60

func add_xp(amount: int) -> void:
	if amount <= 0:
		return
	data.player.xp = int(data.player.xp) + amount
	while int(data.player.xp) >= xp_to_next():
		data.player.xp = int(data.player.xp) - xp_to_next()
		data.player.level = level() + 1
		Events.level_up.emit(level())
		Events.toast.emit("Level %d!" % level(), "New possibilities await, Keeper.", "star")
	Events.xp_changed.emit(level(), int(data.player.xp), xp_to_next())

# ---------------------------------------------------------------- currency
func currency(kind: String) -> int:
	return int(data.currencies.get(kind, 0))

func add_currency(kind: String, amount: int) -> void:
	if amount == 0:
		return
	data.currencies[kind] = max(0, currency(kind) + amount)
	Events.currency_changed.emit(kind, currency(kind))

func can_afford(kind: String, amount: int) -> bool:
	return currency(kind) >= amount

func spend_currency(kind: String, amount: int) -> bool:
	if amount < 0 or not can_afford(kind, amount):
		return false
	data.currencies[kind] = currency(kind) - amount
	Events.currency_changed.emit(kind, currency(kind))
	return true

func grant_rewards(rewards: Dictionary, source: String = "") -> void:
	for k in ["gold", "crystals", "star_gems"]:
		if rewards.has(k):
			add_currency(k, int(rewards[k]))
	if rewards.has("items"):
		for id in rewards.items:
			add_item(id, int(rewards.items[id]), false)
	if rewards.has("xp"):
		add_xp(int(rewards.xp))

# ---------------------------------------------------------------- inventory
func item_count(id: String) -> int:
	return int(data.inventory.get(id, 0))

func used_slots() -> int:
	return data.inventory.size()

func can_add_item(id: String, qty: int = 1) -> bool:
	var def: ItemData = DB.item(id)
	if def == null:
		return false
	if not data.inventory.has(id) and used_slots() >= INVENTORY_SLOTS:
		return false
	return item_count(id) + qty <= def.max_stack

## Adds up to `qty`, returns how many were actually added (respects stack limits).
func add_item(id: String, qty: int = 1, count_as_collected := true) -> int:
	var def: ItemData = DB.item(id)
	if def == null or qty <= 0:
		push_warning("add_item: unknown item %s" % id)
		return 0
	if not data.inventory.has(id) and used_slots() >= INVENTORY_SLOTS:
		Events.toast.emit("Bag full", "Make room before collecting more.", "bag")
		return 0
	var added: int = min(qty, def.max_stack - item_count(id))
	if added <= 0:
		Events.toast.emit("Stack full", "%s is at its limit (%d)." % [def.display_name, def.max_stack], "bag")
		return 0
	data.inventory[id] = item_count(id) + added
	Events.inventory_changed.emit(id, item_count(id))
	if count_as_collected:
		data.stats.resources_collected = int(data.stats.resources_collected) + added
		Events.emit_game_event("collect", id, added)
		check_achievements()
	return added

func remove_item(id: String, qty: int = 1) -> bool:
	if item_count(id) < qty:
		return false
	var left := item_count(id) - qty
	if left <= 0:
		data.inventory.erase(id)
	else:
		data.inventory[id] = left
	Events.inventory_changed.emit(id, left)
	return true

func has_items(cost: Dictionary) -> bool:
	for id in cost:
		if item_count(id) < int(cost[id]):
			return false
	return true

func consume_items(cost: Dictionary) -> bool:
	if not has_items(cost):
		return false
	for id in cost:
		remove_item(id, int(cost[id]))
	return true

# ---------------------------------------------------------------- creatures
func _creature_entry(id: String) -> Dictionary:
	if not data.creatures.has(id):
		data.creatures[id] = {"discovered": false, "friendship": 0, "discovered_at": "", "cosmetic": ""}
	return data.creatures[id]

func is_discovered(id: String) -> bool:
	return data.creatures.has(id) and bool(data.creatures[id].discovered)

func discover(id: String, where: String = "") -> bool:
	if is_discovered(id):
		return false
	var e := _creature_entry(id)
	e.discovered = true
	e.discovered_at = where
	Events.creature_discovered.emit(id)
	Events.emit_game_event("discover", id)
	var c: CreatureData = DB.creature(id)
	var xp := 40
	if c and c.is_colossal():
		xp = 250
		add_currency("crystals", 15)
	add_xp(xp)
	add_currency("gold", 25)
	check_achievements()
	return true

func discovered_count(region_id: String = "", standard_only := true) -> int:
	var n := 0
	for id in data.creatures:
		if not data.creatures[id].discovered:
			continue
		var c: CreatureData = DB.creature(id)
		if c == null:
			continue
		if standard_only and (c.is_colossal() or c.evolves_from != ""):
			continue
		if region_id != "" and c.region != region_id:
			continue
		n += 1
	return n

func friendship(id: String) -> int:
	return int(data.creatures.get(id, {}).get("friendship", 0))

func friendship_level(id: String) -> int:
	var pts := friendship(id)
	var lv := 0
	for i in FRIENDSHIP_THRESHOLDS.size():
		if pts >= FRIENDSHIP_THRESHOLDS[i]:
			lv = i
	return lv

func friendship_progress(id: String) -> float:
	var lv := friendship_level(id)
	if lv >= FRIENDSHIP_THRESHOLDS.size() - 1:
		return 1.0
	var a: int = FRIENDSHIP_THRESHOLDS[lv]
	var b: int = FRIENDSHIP_THRESHOLDS[lv + 1]
	return float(friendship(id) - a) / float(b - a)

## Seconds until this kind of interaction gives friendship again (0 = ready).
func interaction_cooldown(id: String, kind: String) -> float:
	var key := id + ":" + kind
	if not _cooldowns.has(key):
		return 0.0
	return max(0.0, INTERACTION_COOLDOWN - (Time.get_unix_time_from_system() - float(_cooldowns[key])))

func add_friendship(id: String, amount: int, kind: String = "") -> int:
	if not is_discovered(id):
		return 0
	if kind != "":
		if interaction_cooldown(id, kind) > 0.0:
			amount = 1  # still rewarding, but no grinding
		_cooldowns[id + ":" + kind] = Time.get_unix_time_from_system()
	var before := friendship_level(id)
	var e := _creature_entry(id)
	e.friendship = min(FRIENDSHIP_THRESHOLDS[-1], int(e.friendship) + amount)
	var after := friendship_level(id)
	Events.friendship_changed.emit(id, int(e.friendship), after)
	if after > before:
		var c: CreatureData = DB.creature(id)
		Events.toast.emit("Friendship Lv %d" % after, "%s trusts you more." % (c.display_name if c else id), "heart")
		Events.emit_game_event("befriend", id, after)
		add_xp(15 * after)
		if after == 5:
			add_currency("crystals", 5)
	data.stats.interactions = int(data.stats.interactions) + 1
	check_achievements()
	return amount

## The species this creature turned into, or "" if it hasn't evolved.
func evolved_to(id: String) -> String:
	return String(data.creatures.get(id, {}).get("evolved_to", ""))

func is_favorite(id: String) -> bool:
	return id in data.flags.get("favorites", [])

func toggle_favorite(id: String) -> void:
	var f: Array = data.flags.get("favorites", [])
	if id in f:
		f.erase(id)
	else:
		f.append(id)
	data.flags["favorites"] = f

func add_stat(key: String, n := 1) -> void:
	data.stats[key] = int(data.stats.get(key, 0)) + n

func set_companion(id: String) -> void:
	if id != "" and (not is_discovered(id) or friendship_level(id) < 1):
		return
	data.companion = id
	Events.companion_changed.emit(id)
	if id != "":
		Events.emit_game_event("companion", id)

func companion() -> String:
	return String(data.companion)

func set_creature_cosmetic(id: String, cosmetic: String) -> void:
	_creature_entry(id).cosmetic = cosmetic
	Events.appearance_changed.emit()

func creature_cosmetic(id: String) -> String:
	return String(data.creatures.get(id, {}).get("cosmetic", ""))

# ---------------------------------------------------------------- world
func sanctuary_stage(site: String) -> int:
	return int(data.sanctuary.get(site, 0))

func set_sanctuary_stage(site: String, stage: int) -> void:
	data.sanctuary[site] = stage
	Events.sanctuary_changed.emit(site, stage)
	Events.emit_game_event("restore", "%s_%d" % [site, stage])
	check_achievements()

func visit(location_id: String) -> bool:
	if location_id in data.visited:
		return false
	data.visited.append(location_id)
	Events.emit_game_event("reach", location_id)
	add_xp(20)
	check_achievements()
	return true

func owns(product_id: String) -> bool:
	return product_id in data.owned

func grant_ownership(product_id: String) -> void:
	if not owns(product_id):
		data.owned.append(product_id)
		Events.ownership_changed.emit(product_id)

# ---------------------------------------------------------------- achievements
func stat_value(stat: String) -> int:
	match stat:
		"discovered": return discovered_count("", false)
		"discovered_standard": return discovered_count()
		"max_friendship":
			var m := 0
			for id in data.creatures:
				m = max(m, friendship_level(id))
			return m
		"sanctuary_max":
			var m := 0
			for s in data.sanctuary:
				m = max(m, int(data.sanctuary[s]))
			return m
		"colossal_discovered":
			var n := 0
			for c in DB.colossal_creatures():
				if is_discovered(c.id):
					n += 1
			return n
		"landmarks_meadow":
			var n := 0
			var reg: RegionData = DB.region("meadow")
			if reg == null:
				return 0
			for l in reg.locations:
				if l in data.visited:
					n += 1
			return n
		"resources_collected": return int(data.stats.resources_collected)
		"evolutions": return (data.flags.get("evolution_log", []) as Array).size()
	if stat.begins_with("discovered_"):
		return discovered_count(stat.trim_prefix("discovered_"))
	return 0

func check_achievements() -> void:
	for a in DB.ACHIEVEMENTS:
		if a.id in data.achievements:
			continue
		if stat_value(a.stat) >= int(a.goal):
			data.achievements.append(a.id)
			if a.has("gold"):
				add_currency("gold", int(a.gold))
			if a.has("crystals"):
				add_currency("crystals", int(a.crystals))
			if a.has("star_gems"):
				add_currency("star_gems", int(a.star_gems))
			Events.achievement_unlocked.emit(a.id)
			Events.toast.emit("Achievement: " + a.name, a.desc, "trophy")

func reset_runtime() -> void:
	_cooldowns.clear()
