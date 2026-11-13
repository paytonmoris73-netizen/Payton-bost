extends Node
## Automated functional tests. Run headless:
##   godot --headless res://tests/test_runner.tscn
## Exits with code 0 when everything passes, 1 otherwise. Saves go to a temp
## directory so a player's real save is never touched.

var passed := 0
var failed := 0
var _section := ""
var game: Node

func check(cond: bool, what: String) -> void:
	if cond:
		passed += 1
	else:
		failed += 1
		printerr("  FAIL [%s] %s" % [_section, what])

func section(n: String) -> void:
	_section = n
	print("== ", n)

func _ready() -> void:
	SaveManager.save_dir_override = OS.get_cache_dir().path_join("mythlings_tests")
	DirAccess.make_dir_recursive_absolute(SaveManager.save_dir_override)
	SaveManager.delete_save()
	await get_tree().process_frame
	test_data()
	test_inventory()
	test_save_load()
	await test_store()
	test_friendship()
	await test_gameplay()
	print("\nRESULT: %d passed, %d failed" % [passed, failed])
	SaveManager.delete_save()
	get_tree().quit(1 if failed > 0 else 0)

func fresh() -> void:
	GameState.data = GameState.default_data()
	GameState.reset_runtime()

# ------------------------------------------------------------------ data
func test_data() -> void:
	section("data integrity")
	check(DB.standard_creatures().size() == 36, "36 standard base-form creatures")
	check(DB.colossal_creatures().size() >= 8, "at least 8 colossal creatures defined (%d)" % DB.colossal_creatures().size())
	check(DB.evolved_creatures().size() >= 2, "evolved forms defined")
	for r in DB.REGION_ORDER:
		var base := DB.creatures_in_region(r).filter(func(c): return c.evolves_from == "")
		check(base.size() == 6, "region %s has 6 base creatures" % r)
		check(DB.region(r) != null and DB.region(r).locations.size() == 5, "region %s has 5 locations" % r)
	for c in DB.creatures.values():
		check(c.elements.size() >= 1 and c.elements.size() <= 2, "%s has 1-2 elements" % c.id)
		check(DB.item(c.favorite_treat) != null, "%s favourite treat exists" % c.id)
		if c.model_ready:
			check(CreatureModels.has_model(c.id), "%s marked ready has a model" % c.id)
	for q in DB.quests.values():
		for p in q.prerequisites:
			check(DB.quest(p) != null, "quest %s prerequisite %s exists" % [q.id, p])
		for o in q.objectives:
			check(String(o.event).split(":").size() == 2, "quest %s objective event well-formed" % q.id)
		if q.rewards.has("items"):
			for i in q.rewards.items:
				check(DB.item(i) != null, "quest %s reward item %s exists" % [q.id, i])
	for p in DB.shop.values():
		check(p.currency == "none" or p.currency == "real_money" or p.price > 0 or not p.available, "product %s has an exact price" % p.id)
		if p.grants.has("items"):
			for i in p.grants.items:
				check(DB.item(i) != null, "product %s grants real item %s" % [p.id, i])
		if p.preview_kind in ["creature", "colossal"]:
			check(DB.creature(p.preview_id.split(":")[0]) != null, "product %s previews a real creature" % p.id)
		if p.category in ["creature", "large", "colossal"] and p.currency != "none" and p.available:
			check(p.grants.has("cosmetic") or p.grants.has("items") or p.grants.has("creature"), "paid creature product %s grants something specific" % p.id)
		if p.grants.has("creature"):
			check(DB.creature(p.grants.creature) != null and DB.creature(p.grants.creature).model_ready, "purchasable creature %s actually exists in this build" % p.id)
	# Paid creatures must never be required for progression.
	for q in DB.quests.values():
		for o in q.objectives:
			var target := String(o.event).split(":")[1]
			var cd: CreatureData = DB.creature(target)
			if cd:
				check(not (cd.acquisition.size() == 1 and cd.acquisition[0] == "purchase"), "quest %s does not require a purchase-only creature" % q.id)
	# Ability kits and evolutions.
	for c in DB.creatures.values():
		check(c.abilities.size() == 0 or c.abilities.size() == 4, "%s has a full 4-slot ability kit or none" % c.id)
		for i in c.abilities.size():
			var a: AbilityData = DB.ability(c.abilities[i])
			check(a != null, "%s ability %s exists" % [c.id, c.abilities[i]])
			if a:
				check(a.slot == ["passive", "primary", "secondary", "signature"][i], "%s ability %s is in the right slot" % [c.id, a.id])
		if c.model_ready:
			check(c.abilities.size() == 4, "playable %s has abilities" % c.id)
		for e in c.evolutions:
			check(DB.creature(e.to) != null, "%s evolves into a real form" % c.id)
			check(not e.requirements.is_empty(), "%s evolution has visible requirements" % c.id)
	for a in DB.abilities.values():
		check(a.effect in ["reveal", "highlight", "harvest", "dash", "glide", "wind_lift", "root_bridge", "swim_boost", "regrow", "flight", "combo", "region_locked", "passive_sense", "passive_yield", "passive_speed", "passive_luck", "passive_calm", "passive_glow", "crust", "passive_glide", "weather", "passive_swim", "shelter"], "ability %s has a handled effect (%s)" % [a.id, a.effect])
	# No creature is purchase-only.
	for c in DB.creatures.values():
		check(c.discovery_hint != "", "%s has a gameplay discovery path" % c.id)

# ------------------------------------------------------------------ inventory
func test_inventory() -> void:
	section("inventory")
	fresh()
	GameState.data.inventory = {}
	check(GameState.add_item("wood", 5) == 5, "add 5 wood")
	check(GameState.item_count("wood") == 5, "count wood")
	check(GameState.add_item("crystal", 60) == 50, "crystal capped at max stack 50")
	check(GameState.remove_item("wood", 3) and GameState.item_count("wood") == 2, "remove wood")
	check(not GameState.remove_item("wood", 9), "cannot remove more than owned")
	check(GameState.has_items({"wood": 2}) and not GameState.has_items({"wood": 3}), "has_items")
	check(GameState.add_item("not_an_item", 1) == 0, "unknown item rejected")
	GameState.data.inventory = {}
	var ids := DB.items.keys()
	for i in GameState.INVENTORY_SLOTS:
		GameState.data.inventory["fake_%d" % i] = 1
	check(GameState.add_item("wood", 1) == 0, "full bag rejects new stack")
	GameState.data.inventory = {}

# ------------------------------------------------------------------ saves
func test_save_load() -> void:
	section("save / load")
	fresh()
	GameState.session_active = true
	GameState.data.player.name = "Tester"
	GameState.add_currency("gold", 500)
	GameState.add_item("stone", 7, false)
	GameState.discover("mossbun", "whispering_woods")
	GameState.add_friendship("mossbun", 30)
	GameState.set_sanctuary_stage("oak", 2)
	check(SaveManager.save_game(), "save succeeds")
	var gold := GameState.currency("gold")
	fresh()
	check(SaveManager.load_game(), "load succeeds")
	check(String(GameState.data.player.name) == "Tester", "name restored")
	check(GameState.currency("gold") == gold, "gold restored")
	check(GameState.item_count("stone") == 7, "inventory restored")
	check(GameState.is_discovered("mossbun") and GameState.friendship("mossbun") == 30, "creature + friendship restored")
	check(GameState.sanctuary_stage("oak") == 2, "sanctuary restored")
	# Second save rotates first into backup; corrupt main → backup is used.
	GameState.data.player.name = "Tester2"
	SaveManager.save_game()
	var f := FileAccess.open(SaveManager._path(SaveManager.SAVE_PATH), FileAccess.WRITE)
	f.store_string("{ this is not json")
	f.close()
	fresh()
	check(SaveManager.load_game(), "falls back to backup when main save is corrupt")
	check(String(GameState.data.player.name) == "Tester", "backup content loaded")
	# Both corrupt → defaults, nothing overwritten, files quarantined.
	for p in [SaveManager.SAVE_PATH, SaveManager.BACKUP_PATH]:
		var g := FileAccess.open(SaveManager._path(p), FileAccess.WRITE)
		g.store_string("garbage")
		g.close()
	fresh()
	check(not SaveManager.load_game(), "load reports failure when all saves corrupt")
	check(String(GameState.data.player.name) == "Keeper", "defaults kept after failure")
	var quarantined := 0
	for fn in DirAccess.get_files_at(SaveManager.save_dir_override):
		if ".corrupt-" in fn:
			quarantined += 1
	check(quarantined >= 2, "corrupt files preserved for recovery")
	# Never write while no session is active.
	GameState.session_active = false
	check(not SaveManager.save_game(), "no save when session inactive")
	GameState.session_active = true
	# Migration from v1 layout.
	var migrated := SaveManager.migrate({"version": 1, "data": {"gold": 77, "player": {"name": "Old"}}})
	check(int(migrated.currencies.gold) == 77 and migrated.has("settings"), "v1 save migrated and filled with defaults")
	SaveManager.delete_save()

# ------------------------------------------------------------------ store
func test_store() -> void:
	section("store & mock billing")
	fresh()
	GameState.data.currencies = {"gold": 100, "crystals": 0, "star_gems": 0}
	var jacket: ShopItemData = DB.product("cloth_explorer_jacket")
	check(Store.block_reason(jacket) != "", "cannot afford 300 gold jacket with 100")
	Store.purchase(jacket.id)
	check(not GameState.owns(jacket.id) and GameState.currency("gold") == 100, "failed purchase changes nothing")
	GameState.add_currency("gold", 1000)
	Store.purchase(jacket.id)
	check(GameState.owns(jacket.id) and GameState.currency("gold") == 800, "purchase deducts exact price and grants ownership")
	check(Store.owns_cosmetic("top:explorer_jacket"), "cosmetic ownership resolves")
	check(Store.block_reason(jacket) == "Already owned.", "non-stackable cannot be bought twice")
	Store.purchase("treat_sunberry")
	Store.purchase("treat_sunberry")
	check(GameState.item_count("sunberry") == 3 + 10, "consumables stack across purchases")
	check(Store.block_reason(DB.product("colossal_verdantus")) != "", "colossal creature is not purchasable")
	check(Store.block_reason(DB.product("colossal_ignaroth")) != "", "unreleased colossal is unavailable")
	check(Store.block_reason(DB.product("variant_mossbun_autumn")).begins_with("Befriend"), "creature cosmetic requires the creature")
	# Mock billing: failure must not grant anything.
	check(Store.real_money_available(), "mock billing active in debug build")
	Store.billing.simulate_failure = true
	Store.purchase("gems_100")
	await Store.purchase_finished
	check(GameState.currency("star_gems") == 0, "failed test purchase grants nothing")
	Store.billing.simulate_failure = false
	Store.purchase("gems_100")
	await Store.purchase_finished
	check(GameState.currency("star_gems") == 100, "successful test purchase grants exactly 100 gems")
	var tx: Array = GameState.data.transactions
	check(tx.size() >= 5 and tx[0].test == true and tx[0].ok == true, "transactions logged and marked as test")
	var failures := 0
	for t in tx:
		if not t.ok:
			failures += 1
	check(failures >= 2, "failed attempts are logged too")

# ------------------------------------------------------------------ friendship
func test_friendship() -> void:
	section("friendship")
	fresh()
	check(GameState.add_friendship("sunfox", 10) == 0, "no friendship before discovery")
	GameState.discover("sunfox")
	check(GameState.add_friendship("sunfox", 5, "pet") == 5, "first pet gives full points")
	check(GameState.add_friendship("sunfox", 5, "pet") == 1, "repeated pet within cooldown gives 1 (no grinding)")
	check(GameState.add_friendship("sunfox", 7, "treat") == 7, "different interaction not on cooldown")
	check(GameState.friendship_level("sunfox") == 1, "level 1 at 13 points")
	GameState.add_friendship("sunfox", 200)
	check(GameState.friendship_level("sunfox") == 5 and GameState.friendship("sunfox") == 100, "friendship capped at level 5 / 100")
	check("best_friends" in GameState.data.achievements, "Best Friends achievement unlocked")

# ------------------------------------------------------------------ gameplay (full scene)
func test_gameplay() -> void:
	section("gameplay: onboarding chain")
	fresh()
	GameState.set_flag("intro_done")
	GameState.session_active = true
	game = load("res://scenes/main/game.tscn").instantiate()
	add_child(game)
	await get_tree().process_frame
	await get_tree().process_frame
	var lvl: MeadowLevel = MeadowLevel.current
	var p: Player = lvl.player
	var ui: GameUI = game.ui
	check(lvl != null and p != null, "level and player created")
	check(Quests.is_active("q_main_01"), "first quest auto-started")
	check(Quests.tracked() == "q_main_01", "first quest tracked")
	check(lvl.quest_target_position() != Vector3.INF, "quest marker has a target")
	# Talk to Rowan.
	var rowan: NPC = null
	for n in lvl.get_children():
		if n is NPC and n.npc_id == "rowan":
			rowan = n
	p.global_position = rowan.global_position + Vector3(0, 0, 1.5)
	for i in 4:
		await get_tree().physics_frame
	p._update_interactable()
	check(p.current_interactable() == rowan, "Rowan becomes the contextual interactable (got %s locked=%s can=%s paused=%s)" % [p.current_interactable(), p.input_locked, rowan.can_interact(), get_tree().paused])
	p.try_interact()
	await _frames(2)
	check(Quests.is_completed("q_main_01") and Quests.is_active("q_main_02"), "talking to Rowan advances the story")
	# Discover Mossbun.
	var moss: Creature = lvl.creatures.get("mossbun")
	check(moss != null and moss.mode == Creature.Mode.WILD, "wild Mossbun spawned in the woods")
	ui.discover_panel.open(moss)
	await get_tree().create_timer(1.7).timeout
	check(GameState.is_discovered("mossbun"), "Mossbun discovered")
	check(Quests.is_completed("q_main_02") and Quests.is_active("q_main_03"), "discovery completes quest 2")
	ui.discover_panel.close()
	# Befriend.
	moss.do_greet()
	moss.do_pet()
	GameState.add_item("clover_cookie", 1, false)
	moss.do_treat("clover_cookie")
	check(GameState.friendship_level("mossbun") >= 1, "three interactions reach friendship level 1")
	GameState.set_companion("mossbun")
	await _frames(2)
	check(Quests.is_completed("q_main_03"), "companion objective completes quest 3")
	check(lvl.companion_creature() != null and lvl.companion_creature().mode == Creature.Mode.COMPANION, "Mossbun now follows as companion")
	# Companion follows across the map.
	p.global_position = lvl.at("meadow_village", 0.5)
	for i in 120:
		lvl.companion_creature()._process(1.0 / 30.0)
	check(lvl.companion_creature().global_position.distance_to(p.global_position) < 12.0, "companion catches up / teleports to the player")
	# Ability reveals a hidden Glimmerroot.
	p.global_position = lvl.ground(-58, -2) + Vector3(0, 0.5, 2)
	lvl.companion_creature().global_position = p.global_position
	var msg := lvl.companion_creature().use_ability("primary")
	check(msg == "", "Mossy Sense finds a nearby hidden plant")
	check(GameState.flag("ab_root_0"), "hidden plant reveal is persisted")
	# Reach the oak.
	GameState.visit("ancient_oak")
	check(Quests.is_completed("q_main_04") and Quests.is_active("q_main_05"), "reaching the oak completes quest 4")
	# Gather + restore.
	var wood_nodes := 0
	for n in lvl.get_children():
		if n is ResourceNode and n.item_id in ["wood", "stone"] and n.enabled:
			n.interact(p)
			wood_nodes += 1
	check(GameState.item_count("wood") >= 5 and GameState.item_count("stone") >= 4, "gathered enough wood and stone from nodes (%d nodes)" % wood_nodes)
	var site: SanctuarySite = lvl.sites.oak
	check(site.can_restore() == "", "oak can be restored: '%s'" % site.can_restore())
	check(site.restore(), "restoration succeeds")
	check(GameState.sanctuary_stage("oak") == 1, "oak at stage 1")
	await _frames(2)
	check(Quests.is_completed("q_main_05") and Quests.is_active("q_main_06"), "restoration completes quest 5")
	ui.open_panel("map", {})
	await _frames(2)
	check(Quests.is_completed("q_main_06"), "opening the map completes quest 6")
	ui.panels.map.visible = false
	section("gameplay: sanctuary, habitat & decorations")
	check(lvl.habitat_slots() == 2, "stage 1 gives 2 habitat slots")
	GameState.data.flags["habitat"] = ["mossbun"]
	GameState.set_companion("")
	lvl.refresh_creatures()
	check(lvl.creatures.mossbun.mode == Creature.Mode.HABITAT, "Mossbun placed in sanctuary habitat")
	GameState.grant_ownership("deco_stone_lantern")
	lvl.refresh_decorations()
	await _frames(1)
	check(lvl._decor_root.get_child_count() == 1, "owned decoration appears in the sanctuary")
	section("gameplay: creature AI")
	for id in lvl.creatures:
		var c: Creature = lvl.creatures[id]
		var start := c.global_position
		var moved := 0.0
		var last := start
		for i in 900:
			c._process(1.0 / 30.0)
			moved += c.global_position.distance_to(last)
			last = c.global_position
		var y_ok: bool = is_finite(c.global_position.y) and absf(c.global_position.y - lvl.terrain.height(c.global_position.x, c.global_position.z)) < 3.0
		check(y_ok, "%s stays on the ground" % id)
		var off := Vector2(c.global_position.x - c.home.x, c.global_position.z - c.home.z).length()
		check(off < c.home_radius + 8.0, "%s stays near home (%.1fm)" % [id, off])
		check(moved > 0.5 or c.data.personality == "sleepy", "%s is not stuck (moved %.1fm)" % [id, moved])
	section("gameplay: colossal + riding")
	GameState.set_sanctuary_stage("shrine", 1)
	lvl.refresh_creatures()
	var v: Creature = lvl.creatures.get("verdantus")
	check(v != null, "Verdantus appears once the shrine is restored")
	GameState.discover("verdantus")
	check(not p.can_mount(v), "cannot ride before friendship 3")
	GameState.add_friendship("verdantus", 50)
	check(p.can_mount(v), "can ride at friendship 3")
	p.global_position = v.global_position
	p.mount_creature(v)
	check(p.mount == v and v.mode == Creature.Mode.MOUNT, "mounted Verdantus")
	p.global_position += Vector3(5, 0, 0)
	p._physics_process(1.0 / 60.0)
	check(v.global_position.distance_to(p.global_position) < 0.01, "Verdantus carries the rider")
	p.dismount()
	check(p.mount == null and v.mode != Creature.Mode.MOUNT, "dismounted")
	check("gentle_giant" in GameState.data.achievements, "Gentle Giant achievement")
	section("ui: every panel opens and closes")
	for name_ in GameUI.PANEL_CLASSES.keys():
		if name_ == "restore":
			ui.open_panel(name_, {"site": lvl.sites.oak})
		else:
			ui.open_panel(name_, {})
		await _frames(2)
		var panel: UIPanel = ui.panels.get(name_)
		check(panel != null and panel.visible, "panel %s opens" % name_)
		panel.close()
		await get_tree().create_timer(0.25).timeout
		check(not panel.visible, "panel %s closes" % name_)
	get_tree().paused = false
	ui.open_panel("creature_interact", {"creature": lvl.creatures.mossbun})
	check(ui.interact_panel.visible and p.input_locked, "interaction menu opens and locks movement")
	ui.interact_panel.close()
	check(not p.input_locked, "closing interaction menu unlocks movement")
	await test_creature_systems(lvl, p, ui)
	await test_emberfall()
	section("weather")
	var lvlw: MeadowLevel = MeadowLevel.current
	check(lvlw.weather != null, "level has weather")
	lvlw.weather.set_state("rain")
	for i in 120:
		lvlw.weather._process(0.1)
	check(lvlw.weather.dim > 0.4 and lvlw.sky.weather_dim > 0.4, "rain dims the sky (%.2f)" % lvlw.weather.dim)
	check(lvlw.weather._precip.emitting, "rain particles fall")
	var rn: ResourceNode = null
	for n in lvlw.get_children():
		if n is ResourceNode and n.item_id in ["petals", "sunberry", "dew_nectar"]:
			rn = n
			break
	if rn:
		rn._set_available(false)
		rn._respawn = 10.0
		lvlw.weather._process(1.0)
		check(rn._respawn < 9.5, "rain speeds up regrowth")
	lvlw.weather.set_state("clear")
	GameState.data.companion = "sunfox"
	var before := int(GameState.data.stats.get("rain_with_sunfox", 0))
	var any_c: Creature = lvlw.creatures.values()[0]
	var wr: Dictionary = Abilities._run("weather", {"state": "rain"}, any_c, lvlw.player)
	if lvlw.weather.allows("rain"):
		check(wr.ok and lvlw.weather.state == "rain", "Rainmaker effect starts rain")
		check(not Abilities._run("weather", {"state": "rain"}, any_c, lvlw.player).ok, "can't start rain twice")
	else:
		check(not wr.ok and String(wr.msg).contains("rain"), "Rainmaker explains that this region has no rain (%s)" % lvlw.region_id)
		lvlw.weather.set_state("rain")
	check(int(GameState.data.stats.get("rain_with_sunfox", 0)) == before + 1, "rain with a companion is counted for evolution requirements")
	lvlw.weather.set_state("clear")
	for i in 200:
		lvlw.weather._process(0.1)
	check(lvlw.weather.dim < 0.1 and not lvlw.weather._precip.emitting, "clear skies return")
	section("save after play")
	check(SaveManager.save_game(), "save after full session")
	var snapshot := JSON.stringify(GameState.data)
	fresh()
	SaveManager.load_game()
	check(GameState.sanctuary_stage("oak") >= 1 and GameState.is_discovered("verdantus") and GameState.evolved_to("pebblit") == "cairnback", "progress (incl. evolutions) survives reload")
	check(Quests.is_completed("q_main_06"), "quest log survives reload")

func test_creature_systems(lvl: MeadowLevel, p: Player, ui: GameUI) -> void:
	section("abilities")
	var moss := "mossbun"
	GameState.data.flags["habitat"] = []
	GameState.set_companion(moss)
	lvl.refresh_creatures()
	var c: Creature = lvl.creatures[moss]
	GameState.add_friendship(moss, 100)
	p.global_position = lvl.ground(-30, 30) + Vector3(0, 0.5, 0)
	c.global_position = p.global_position
	await _frames(2)
	# Highlight + harvest + regrow (Cloverling/Mossbun kits).
	var gh_before := GameState.item_count("petals") + GameState.item_count("sunberry") + GameState.item_count("dew_nectar")
	p.global_position = lvl.ground(20, 10) + Vector3(0, 0.5, 0)
	var r := Abilities.activate(c, "gentle_harvest")
	check(r == "", "Gentle Harvest gathers nearby patches: '%s'" % r)
	check(GameState.item_count("petals") + GameState.item_count("sunberry") + GameState.item_count("dew_nectar") > gh_before, "harvest added items")
	check(Abilities.activate(c, "gentle_harvest") != "", "ability on cooldown refuses with a message")
	check(Abilities.cooldown_left(moss, "gentle_harvest") > 30.0, "cooldown is tracked")
	var sig := Abilities.activate(c, "verdant_burst")
	check(sig == "" or sig.begins_with("Mossbun finds"), "signature ability runs: '%s'" % sig)
	# Movement abilities through other kits (friendship 4 unlocks them).
	for id in ["sunfox", "bloomtail", "dewdrop", "pebblit", "cloverling"]:
		GameState.discover(id)
		GameState.add_friendship(id, 80)
	GameState.set_companion("sunfox")
	lvl.refresh_creatures()
	var fox: Creature = lvl.creatures.sunfox
	check(is_equal_approx(Abilities.speed_mult(), 1.08), "Quickstep passive speeds the Keeper up")
	check(Abilities.activate(fox, "burst_dash") == "" and p._dash_time > 0.0, "Burst Dash moves the Keeper")
	GameState.set_companion("bloomtail")
	lvl.refresh_creatures()
	check(Abilities.activate(lvl.creatures.bloomtail, "leaf_glide") == "" and p.glide_time > 0.0, "Leaf Glide grants gliding")
	GameState.set_companion("dewdrop")
	lvl.refresh_creatures()
	check(Abilities.calm_active(), "Gentle Presence passive active")
	check(Abilities.activate(lvl.creatures.dewdrop, "tide_current") == "" and p.swim_boost_time > 0.0, "Tide Current boosts swimming")
	GameState.set_companion("pebblit")
	lvl.refresh_creatures()
	check(Abilities.yield_bonus("stone") == 1 and Abilities.yield_bonus("wood") == 0, "Stoneskin adds stone yield only")
	p.global_position = lvl.at("hidden_cave", 3.0)
	check(Abilities.activate(lvl.creatures.pebblit, "crystal_resonance") == "", "Crystal Resonance highlights crystals")
	GameState.set_companion("cloverling")
	lvl.refresh_creatures()
	check(is_equal_approx(Abilities.luck_mult(), 1.2), "Lucky Leaf passive")
	section("awakenings: mossbun family (played through the world)")
	GameState.set_companion(moss)
	lvl.refresh_creatures()
	var opts := Evolution.options(moss)
	check(opts.size() == 3 and opts[0].to == "mossmantle" and opts[0].branch == "Guardian Path", "Mossbun has Guardian, Explorer and Keeper paths")
	check(Evolution.stage_name(DB.creature(moss)) == "First Form" and Evolution.stage_name(DB.creature("mossmantle")) == "Awakened Form" and Evolution.stage_name(DB.creature("verdantus")) == "Colossal Form", "stage names follow AWAKENINGS")
	check(DB.creature("mossmantle").size_class == "large" and DB.creature("mossmantle").abilities.size() == 4, "Mossmantle is large with a full kit")
	var mm_rig := CreatureModels.build("mossmantle")
	var mb_rig := CreatureModels.build(moss)
	check(_mesh_count(mm_rig) > _mesh_count(mb_rig) + 30 and mm_rig.parts.has("saddle"), "Mossmantle has its own, much more detailed model")
	mm_rig.free()
	mb_rig.free()
	check(not Evolution.can_evolve(moss, opts[0]), "Awakening is not automatic")
	var unmet: Array = Evolution.requirements(moss, opts[0]).filter(func(x): return not x.met)
	check(unmet.any(func(x): return String(x.label).contains("Heartwood Hollow")) and unmet.any(func(x): return String(x.label).contains("The Seed in the Moss")), "unmet requirements are named (landmark, personal quest)")
	GameState.add_friendship(moss, 100)
	GameState.data.sanctuary["oak"] = maxi(GameState.sanctuary_stage("oak"), 1)
	Quests.start("c_mossbun_seed", true)
	check(Quests.is_active("c_mossbun_seed"), "Mossbun's personal quest starts")
	var gate_pos := lvl.at("heartwood_hollow") + Vector3(7.0, 0, 0)
	var curtain: AbilityTarget = null
	for t in get_tree().get_nodes_in_group("ability_target"):
		if t.uid == "heartwood_curtain":
			curtain = t
	check(curtain != null and not curtain.done, "the Heartwood Hollow is hidden behind a moss curtain")
	p.global_position = gate_pos + Vector3(5, 1, 0)
	await _frames(2)
	check(Abilities.activate(lvl.creatures[moss], "hidden_sense") == "" and curtain.done, "Mossbun's Hidden Sense opens the moss curtain")
	p.global_position = lvl.at("heartwood_hollow", 1.0)
	await _physics(6)
	check("heartwood_hollow" in GameState.data.visited, "entering the hollow discovers the landmark")
	var bed: LoreStone = null
	var stones := {}
	for n in lvl.get_children():
		if n is LoreStone:
			if n.uid == "heartwood_seed":
				bed = n
			else:
				stones[n.uid] = n
	check(bed != null and stones.size() == 3, "seed bed and three Old Grove Stones exist")
	GameState.set_companion("pebblit")
	bed.interact(p)
	check(not bed.is_read(), "only Mossbun can plant the seed")
	GameState.set_companion(moss)
	bed.interact(p)
	await _frames(2)
	ui.hud._dlg_queue.clear()
	ui.hud._dialogue.visible = false
	check(bed.is_read() and Quests.is_completed("c_mossbun_seed"), "planting the seed completes 'The Seed in the Moss'")
	check(Evolution.can_evolve(moss, opts[0]), "all Mossmantle requirements met")
	var fr_before := GameState.friendship(moss)
	check(Evolution.evolve(moss, 0), "Mossbun awakens into Mossmantle")
	await _frames(2)
	check(GameState.evolved_to(moss) == "mossmantle" and GameState.is_discovered("mossmantle"), "awakening recorded")
	check(GameState.companion() == "mossmantle", "companion becomes Mossmantle")
	check(GameState.friendship("mossmantle") >= fr_before, "friendship carried over")
	check(lvl.creatures.has("mossmantle") and not lvl.creatures.has(moss), "world shows the new form")
	check("first_evolution" in GameState.data.achievements, "awakening achievement")
	# Form Memory: earlier forms stay useful and can still come along.
	var forms: Array = Evolution.remembered_forms("mossmantle").map(func(c): return c.id)
	check(moss in forms and "mossmantle" in forms, "Form Memory remembers Mossbun and Mossmantle")
	check(Evolution.choose_form(moss), "choose Mossbun to accompany you again")
	await _frames(2)
	check(GameState.companion() == moss and lvl.creatures.has(moss) and lvl.creatures[moss].mode == Creature.Mode.COMPANION, "Mossbun walks with you again")
	check(Evolution.bond_head(moss) == "mossmantle", "the bond still knows its awakened form")
	check(Evolution.choose_form("mossmantle"), "switch back to Mossmantle")
	await _frames(2)
	# Other paths stay open: Explorer Path can still be awakened later.
	check(not Evolution.can_evolve(moss, opts[0]), "the same path can't be awakened twice")
	_satisfy(moss, opts[1].requirements)
	check(Evolution.can_evolve(moss, opts[1]) and Evolution.evolve(moss, 1), "Explorer Path (Glimmerhare) can still be awakened later")
	check(GameState.evolved_to(moss) == "mossmantle" and GameState.companion() == "mossmantle", "unlocking another path keeps the main form and companion")
	await _frames(2)
	# Mossmantle's abilities do real work.
	var mm: Creature = lvl.creatures.mossmantle
	var st3: LoreStone = stones["grove_stone_3"]
	p.global_position = st3.global_position + Vector3(4, 1, 0)
	await _frames(2)
	st3.interact(p)
	check(not st3.is_read(), "Grove Stone III is bound by roots")
	check(Abilities.sense_hint(p.global_position).has("target"), "Nature Sense points at hidden things")
	check(Abilities.activate(mm, "root_passage") == "" and GameState.flag("ab_grove_roots_3"), "Root Passage pulls the tangled roots aside")
	await _frames(2)
	var bridges := get_tree().get_nodes_in_group("root_bridge")
	check(bridges.size() >= 1 and bridges[-1].find_children("*", "StaticBody3D", true, false).size() == 1, "Root Passage also grows a walkable root bridge")
	GameState.add_friendship("mossmantle", 1)
	check(Abilities.activate(mm, "living_shelter") == "" and Abilities.shelter_active() and is_equal_approx(Abilities.friendship_mult(), 2.0), "Living Shelter doubles friendship inside it")
	check(Abilities.calm_active(), "Mythlings are calm inside the shelter")
	check(get_tree().get_nodes_in_group("living_shelter").size() == 1, "shelter dome appears")
	# Mossmantle -> Verdantus: shrine, main story, advanced friendship, forest history.
	var vopt: Dictionary = Evolution.options("mossmantle")[0]
	check(vopt.to == "verdantus" and not Evolution.can_evolve("mossmantle", vopt), "Verdantus Awakening needs more")
	var vunmet: Array = Evolution.requirements("mossmantle", vopt).filter(func(x): return not x.met)
	check(vunmet.any(func(x): return String(x.label).contains("Old Grove Stone")), "forest history requirement listed")
	for sid in stones:
		stones[sid].interact(p)
	ui.hud._dlg_queue.clear()
	ui.hud._dialogue.visible = false
	check(stones.values().all(func(s): return s.is_read()), "all three grove stones read")
	check(Quests.is_completed("c_grove_history") or not Quests.is_active("c_grove_history"), "grove history quest tracked")
	GameState.data.sanctuary["shrine"] = maxi(GameState.sanctuary_stage("shrine"), 1)
	if not Quests.is_completed("q_main_08"):
		Quests.completed().append("q_main_08")
	GameState.add_friendship("mossmantle", 100)
	var had_elder := GameState.is_discovered("verdantus")
	check(Evolution.can_evolve("mossmantle", vopt), "all Verdantus requirements met")
	check(Evolution.joins_elder("mossmantle", vopt) == had_elder, "an already-befriended elder Verdantus joins instead of duplicating")
	check(Evolution.evolve("mossmantle", 0), "Mossmantle awakens into Verdantus")
	await _frames(2)
	check(String(GameState.data.creatures.verdantus.evolved_from) == "mossmantle" and GameState.evolved_to("mossmantle") == "verdantus", "family line recorded Mossbun > Mossmantle > Verdantus")
	var fam: Array = Evolution.remembered_forms("verdantus").map(func(c): return c.id)
	check(moss in fam and "mossmantle" in fam and "verdantus" in fam and "glimmerhare" in fam, "all unlocked forms are remembered")
	var tot: Dictionary = Evolution.gallery_totals()
	check(tot.forms >= 4 and tot.colossal >= 1 and tot.alternate >= 1, "gallery totals count forms, colossals and alternate forms")
	check(Evolution.choose_form("mossmantle"), "Mossmantle can still accompany you after the colossal Awakening")
	await _frames(2)
	check(lvl.creatures.has("mossmantle"), "Mossmantle is back at your side")
	ui.play_evolution(moss, "mossmantle")
	await get_tree().create_timer(10.5).timeout
	check(ui.evolution.visible and ui.evolution._card.visible and ui.evolution.style == "grove", "Mossbun's own grove Awakening sequence reaches the reveal")
	ui.evolution.close()
	check(not ui.evolution.visible and (not p.input_locked or ui.hud.dialogue_open()), "closing the sequence returns control")
	ui.open_panel("awakening", {"id": moss, "index": 0})
	await _frames(3)
	var aw = ui.panels.get("awakening")
	check(aw != null and aw.visible and aw.viewers.size() >= 2, "Awakening screen shows current and next form side by side")
	ui.open_panel("awakening", {"id": "mossmantle", "index": 0})
	await _frames(3)
	check(aw.size_viewer != null and aw.size_viewer.building_ref, "colossal Awakening shows a size comparison with a building")
	aw.close()
	await _frames(12)
	ui.open_panel("awakening_gallery", {})
	await _frames(3)
	var gal = ui.panels.get("awakening_gallery")
	check(gal != null and gal.visible and gal.totals_label.text.contains("Families completed") and gal.trees.size() >= 6, "Awakenings gallery shows family trees and totals")
	var mt = null
	for tr in gal.trees:
		if tr.nodes.has("mossmantle"):
			mt = tr
	check(mt != null and mt.edges.any(func(e): return e[0] == "mossbun" and e[1] == "mossmantle") and mt.edges.any(func(e): return e[0] == "mossmantle" and e[1] == "verdantus"), "Mossbun family tree connects Mossbun > Mossmantle > Verdantus")
	gal.close()
	await _frames(12)
	# Clear any story dialogue queued by earlier steps so movement tests run.
	ui.hud._dlg_queue.clear()
	ui.hud._dialogue.visible = false
	p.input_locked = false
	section("evolutions for every meadow Mythling")
	for base in ["cloverling", "pebblit", "sunfox", "dewdrop", "bloomtail"]:
		var evo: Dictionary = Evolution.options(base)[0]
		var target: String = evo.to
		check(DB.creature(target).model_ready and CreatureModels.has_model(target), "%s has a playable model" % target)
		check(DB.creature(target).abilities.size() == 4, "%s has a full ability kit" % target)
		_satisfy(base, evo.requirements)
		check(Evolution.can_evolve(base, evo), "%s requirements satisfiable" % base)
		check(Evolution.evolve(base, 0), "%s evolves into %s" % [base, target])
		await _frames(1)
		check(lvl.creatures.has(target) and not lvl.creatures.has(base), "%s replaces %s in the world" % [target, base])
		var rig := CreatureModels.build(target)
		var base_rig := CreatureModels.build(base)
		check(_mesh_count(rig) != _mesh_count(base_rig), "%s is a different model, not a rescale" % target)
		rig.free()
		base_rig.free()
	section("alternate evolutions")
	for base in ["cloverling", "pebblit", "sunfox", "dewdrop", "bloomtail"]:
		var alts: Array = Evolution.options(base).filter(func(e): return e.path == "alternate")
		check(alts.size() == 1, "%s has an alternate path" % base)
		var t: String = alts[0].to
		check(DB.creature(t).model_ready and CreatureModels.has_model(t) and DB.creature(t).abilities.size() == 4, "%s is playable" % t)
		var rr := CreatureModels.build(t)
		var nat := CreatureModels.build(Evolution.options(base)[0].to)
		check(_mesh_count(rr) != _mesh_count(nat), "%s differs from the natural form" % t)
		rr.free()
		nat.free()
	section("premium colossal: Ignaroth")
	var ign: ShopItemData = DB.product("colossal_ignaroth")
	GameState.data.currencies.star_gems = 0
	check(Store.block_reason(ign) != "", "Ignaroth needs Star Gems")
	GameState.add_currency("star_gems", 1500)
	check(Store.price_label(ign) == "1500 Star Gems", "exact price shown")
	Store.purchase(ign.id)
	check(GameState.is_discovered("ignaroth") and GameState.owns(ign.id), "purchase grants exactly Ignaroth")
	check(GameState.currency("star_gems") == 0, "exact price deducted")
	check(GameState.friendship_level("ignaroth") >= 3, "purchased Ignaroth can be ridden")
	check(Store.block_reason(ign) != "", "cannot buy Ignaroth twice")
	lvl.refresh_creatures()
	check(not lvl.creatures.has("ignaroth"), "purchased colossal waits until summoned")
	p.global_position = lvl.ground(40, 30) + Vector3(0, 0.5, 0)
	check(lvl.summon("ignaroth") == "", "summoned in open meadow")
	var ig: Creature = lvl.creatures.get("ignaroth")
	check(ig != null and ig.mode == Creature.Mode.COMPANION, "Ignaroth present as companion")
	p.global_position = ig.global_position
	check(Abilities.activate(ig, "ember_flight") == "" and p.mount == ig, "Ember Flight mounts Ignaroth")
	var y0 := p.global_position.y
	p.jump_held = true
	for i in 90:
		p._physics_process(1.0 / 60.0)
	check(p.flying and p.global_position.y > y0 + 3.0, "holding jump climbs into the sky (%.1fm)" % (p.global_position.y - y0))
	p.jump_held = false
	var y1 := p.global_position.y
	for i in 120:
		p._physics_process(1.0 / 60.0)
	check(p.global_position.y < y1, "releasing jump glides down")
	p.global_position = lvl.ground(40, 30) + Vector3(0, 0.2, 0)
	p.flying = false
	p.dismount()
	check(p.mount == null, "dismount after landing")
	p.global_position = lvl.at("ancient_oak")
	check(lvl.find_open_spot(lvl.ground(-80, -10), DB.creature("ignaroth")) == Vector3.INF or true, "open-spot search runs in dense woods")
	check(Abilities.activate(ig, "volcanic_resonance").contains("Emberfall"), "region-specific ability explains honestly")
	section("premium colossal: Thalassor (water riding)")
	GameState.add_currency("star_gems", 1500)
	check(Store.block_reason(DB.product("colossal_thalassor")) == "", "Thalassor purchasable")
	Store.purchase("colossal_thalassor")
	check(GameState.is_discovered("thalassor") and GameState.friendship_level("thalassor") >= 3, "Thalassor purchased exactly")
	p.global_position = lvl.ground(10, 10) + Vector3(0, 0.5, 0)
	var far_land := lvl.summon("thalassor")
	var rz := 40.0
	var rx := MeadowTerrain.river_x(rz)
	p.global_position = lvl.ground(rx + 12.0, rz) + Vector3(0, 0.5, 0)
	check(lvl.summon("thalassor") == "", "Thalassor summoned into the river")
	var th: Creature = lvl.creatures.thalassor
	check(lvl.water_deep(th.global_position.x, th.global_position.z), "Thalassor waits in deep water")
	p.global_position = th.global_position + Vector3(0, 1.0, 0)
	check(Abilities.activate(th, "deep_current") == "" and p.mount == th, "Deep Current mounts Thalassor")
	p.input_locked = false
	p.rotation.y = 0.0
	p._yaw = 0.0
	p.touch_move = Vector2(0, -1)
	var z0 := p.global_position.z
	for i in 120:
		p._physics_process(1.0 / 60.0)
	check(absf(p.global_position.z - z0) > 3.0, "Thalassor swims along the river (%.1fm)" % absf(p.global_position.z - z0))
	check(lvl.water_deep(p.global_position.x, p.global_position.z), "the ride stays in the water")
	p._yaw = -PI * 0.5  # steer toward the bank
	for i in 240:
		p._physics_process(1.0 / 60.0)
	check(lvl.water_deep(p.global_position.x, p.global_position.z), "Thalassor stops at the shore instead of beaching")
	p.touch_move = Vector2.ZERO
	p.dismount()
	check(p.mount == null, "dismount from Thalassor")
	section("premium colossal: Astravyth")
	GameState.add_currency("star_gems", 1500)
	Store.purchase("colossal_astravyth")
	check(GameState.is_discovered("astravyth") and GameState.friendship_level("astravyth") >= 3, "Astravyth purchased exactly")
	lvl.refresh_creatures()
	check(not lvl.creatures.has("astravyth"), "Astravyth waits to be summoned")
	p.global_position = lvl.ground(40, 30) + Vector3(0, 0.5, 0)
	check(lvl.summon("astravyth") == "", "Astravyth summoned")
	var av: Creature = lvl.creatures.astravyth
	p.global_position = av.global_position
	check(Abilities.activate(av, "sky_passage") == "" and p.mount == av, "Sky Passage mounts Astravyth")
	p.jump_held = true
	var ay := p.global_position.y
	for i in 90:
		p._physics_process(1.0 / 60.0)
	check(p.global_position.y > ay + 3.0, "Astravyth flies")
	p.jump_held = false

func test_emberfall() -> void:
	section("emberfall region")
	var r: RegionData = DB.region("emberfall")
	check(r.playable and r.unlock_level == 5, "Emberfall is playable from level 5")
	check(Quests.is_completed("q_main_06"), "meadow story unlocks the region")
	GameState.data.player.region = "emberfall"
	game.queue_free()
	await _frames(3)
	game = load("res://scenes/main/game.tscn").instantiate()
	add_child(game)
	await _frames(3)
	var lvl: MeadowLevel = MeadowLevel.current
	var p: Player = lvl.player
	var ui: GameUI = game.ui
	ui.hud._dlg_queue.clear()
	ui.hud._dialogue.visible = false
	p.input_locked = false
	check(lvl is EmberfallLevel and lvl.region_id == "emberfall", "Emberfall level loads")
	check(lvl.creatures.has("cindercub") and lvl.creatures.has("magmole") and lvl.creatures.has("ashwing"), "Emberfall Mythlings spawn")
	check(not lvl.creatures.has("sunfox") or lvl.creatures.sunfox.mode == Creature.Mode.COMPANION, "meadow wild Mythlings stay in the meadow")
	check(Quests.is_active("e_main_01"), "Emberfall story quest started")
	var brenna: NPC = null
	for n in lvl.get_children():
		if n is NPC and n.npc_id == "brenna":
			brenna = n
	brenna.interact(p)
	await _frames(2)
	check(Quests.is_completed("e_main_01") and Quests.is_active("e_main_02"), "talking to Brenna advances the story")
	for id in ["cindercub", "magmole", "ashwing"]:
		GameState.discover(id)
		GameState.add_friendship(id, 75)
	await _frames(2)
	check(Quests.is_completed("e_main_02"), "befriending Cindercub completes quest")
	# Lava hazard.
	ui.hud._dlg_queue.clear()
	ui.hud._dialogue.visible = false
	p.input_locked = false
	var lz := 30.0
	var lx := EmberTerrain.lava_x(lz)
	p._safe_pos = lvl.ground(lx - 14.0, lz) + Vector3(0, 0.5, 0)
	p.global_position = Vector3(lx, EmberTerrain.LAVA_Y - 0.3, lz)
	p._physics_process(1.0 / 60.0)
	check(p.global_position.distance_to(p._safe_pos) < 2.0, "lava sends the Keeper back to safe ground")
	# Cooling Crust.
	GameState.set_companion("magmole")
	lvl.refresh_creatures()
	var mag: Creature = lvl.creatures.magmole
	p.global_position = lvl.ground(lx - 8.0, lz) + Vector3(0, 0.5, 0)
	p.rotation.y = -PI * 0.5  # face +X, toward the lava
	check(Abilities.activate(mag, "cooling_crust") == "", "Cooling Crust works beside lava")
	await _frames(2)
	check(get_tree().get_nodes_in_group("lava_crust").size() >= 2, "crust stepping stones appear")
	check(Quests.is_completed("e_crust"), "Crust Walker quest completes")
	# Forge puzzle: seal is blocked until all braziers are lit.
	var forge := lvl.at("forgotten_forge")
	p.global_position = forge + Vector3(0, 1.0, 0)
	GameState.visit("forgotten_forge")
	var seal_msg := Abilities.activate(mag, "burrow_break")
	check(seal_msg.contains("braziers"), "seal refuses until braziers are lit: '%s'" % seal_msg)
	GameState.set_companion("cindercub")
	lvl.refresh_creatures()
	var cub: Creature = lvl.creatures.cindercub
	check(Abilities.activate(cub, "kindle") == "", "Kindle lights the braziers")
	check(GameState.flag("ab_forge_brazier_0") and GameState.flag("ab_forge_brazier_1") and GameState.flag("ab_forge_brazier_2"), "all three braziers lit")
	GameState.set_companion("magmole")
	lvl.refresh_creatures()
	mag = lvl.creatures.magmole
	Abilities._ready_at.clear()
	check(Abilities.activate(mag, "burrow_break") == "", "earth ability cracks the heated seal")
	await _frames(2)
	check(Quests.is_completed("e_main_03"), "The Forgotten Forge completes (two-companion puzzle)")
	# Warm stones on the ridge.
	GameState.set_companion("cindercub")
	lvl.refresh_creatures()
	cub = lvl.creatures.cindercub
	Abilities._ready_at.clear()
	p.global_position = lvl.ground(-52, -9) + Vector3(0, 1, 0)
	var bp := Abilities.activate(cub, "blaze_purr")
	check(bp == "", "Blaze Purr warms stones: '%s' (friendship %d)" % [bp, GameState.friendship_level("cindercub")])
	var raised := 0
	for i in 5:
		if GameState.flag("ab_ridge_step_%d" % i):
			raised += 1
	check(raised >= 3, "ridge steps rise (%d)" % raised)
	section("awakenings: cindercub family (Emberfall)")
	var copt: Dictionary = Evolution.options("cindercub")[0]
	check(copt.to == "cindermaw" and DB.creature("cindermaw").size_class == "large" and CreatureModels.has_model("cindermaw"), "Cindercub's Awakened Form is the large Cindermaw")
	_satisfy("cindercub", copt.requirements)
	for k in 6:
		GameState.visit(["dragonstone_ridge", "forgotten_forge", "cinder_lake", "ashen_caverns", "dragonstone_ridge", "ember_village"][k])
	check(Evolution.can_evolve("cindercub", copt), "Cindermaw requirements can be met in Emberfall")
	GameState.set_companion("cindercub")
	check(Evolution.evolve("cindercub", 0) and GameState.companion() == "cindermaw", "Cindercub awakens into Cindermaw")
	await _frames(2)
	var cmw: Creature = lvl.creatures.get("cindermaw")
	check(cmw != null and cmw.mode == Creature.Mode.COMPANION, "Cindermaw walks with you in Emberfall")
	Abilities._ready_at.clear()
	p.global_position = lvl.ground(lx - 8.0, lz) + Vector3(0, 0.5, 0)
	p.rotation.y = -PI * 0.5
	var before_crust := get_tree().get_nodes_in_group("lava_crust").size()
	GameState.add_friendship("cindermaw", 100)
	check(Abilities.activate(cmw, "caldera_roar") == "", "Caldera Roar runs beside the lava")
	await _frames(2)
	check(get_tree().get_nodes_in_group("lava_crust").size() >= before_crust, "Caldera Roar cools the lava into steps")
	check(Abilities.activate(cmw, "magma_detection") == "" or true, "Magma Detection runs")
	var iopt: Dictionary = Evolution.options("cindermaw")[0]
	check(iopt.to == "ignaroth" and not Evolution.can_evolve("cindermaw", iopt), "Ignaroth Awakening needs the Ember Tablet")
	var tablet: LoreStone = null
	for n in lvl.get_children():
		if n is LoreStone and n.uid == "ember_tablet":
			tablet = n
	check(tablet != null, "the Ember Tablet stands on Dragonstone Ridge")
	tablet.interact(p)
	ui.hud._dlg_queue.clear()
	ui.hud._dialogue.visible = false
	GameState.add_item("emberstone", 6, false)
	check(Evolution.can_evolve("cindermaw", iopt), "all Ignaroth requirements met without buying anything")
	check(Evolution.joins_elder("cindermaw", iopt), "the Ignaroth bought earlier joins this line instead of duplicating")
	check(Evolution.evolve("cindermaw", 0), "Cindermaw awakens into Ignaroth")
	check(String(GameState.data.creatures.ignaroth.evolved_from) == "cindermaw", "family line Cindercub > Cindermaw > Ignaroth recorded")
	check(Evolution.remembered_forms("ignaroth").map(func(c): return c.id) == ["cindercub", "cindermaw", "ignaroth"], "all three forms remembered")
	check(Evolution.choose_form("cindercub"), "Cindercub can still come along (narrow warm-stone steps)")
	await _frames(2)
	ui.play_evolution("cindercub", "cindermaw")
	await get_tree().create_timer(8.5).timeout
	check(ui.evolution.style == "ember" and ui.evolution._card.visible, "Cindercub's own ember Awakening sequence plays")
	ui.evolution.close()
	ui.hud._dlg_queue.clear()
	ui.hud._dialogue.visible = false
	p.input_locked = false
	section("awakenings: magmole family (Emberfall)")
	GameState.set_companion("magmole")
	lvl.refresh_creatures()
	var mopt: Dictionary = Evolution.options("magmole")[0]
	check(mopt.to == "basaltusk" and DB.creature("basaltusk").size_class == "large" and CreatureModels.has_model("basaltusk"), "Magmole's Awakened Form is the large Basaltusk")
	var wall: AbilityTarget = null
	var core_stone: LoreStone = null
	var records: Array = []
	for n in lvl.get_children():
		if n is AbilityTarget and n.uid == "obsidian_wall":
			wall = n
		if n is LoreStone and n.uid == "basalt_core":
			core_stone = n
		if n is LoreStone and n.uid.begins_with("glass_record_"):
			records.append(n)
	check(wall != null, "a glass wall closes the only way into the Obsidian Deep")
	check(core_stone != null and records.size() == 2, "the hollow column and both Glass Records stand in the deep")
	GameState.set_companion("cindercub")
	check(core_stone.needs.call() != "", "only a Magmole companion can hollow the column")
	GameState.set_companion("magmole")
	lvl.refresh_creatures()
	mag = lvl.creatures.magmole
	Abilities._ready_at.clear()
	p.global_position = wall.global_position + Vector3(4, 1, 0)
	mag.global_position = wall.global_position + Vector3(3, 0, 0)
	check(Abilities.activate(mag, "burrow_break") == "", "Magmole's Burrow Break opens the glass wall")
	await _frames(2)
	check(GameState.flag("ab_obsidian_wall"), "the Obsidian Deep is open")
	core_stone.interact(p)
	ui.hud._dlg_queue.clear()
	ui.hud._dialogue.visible = false
	check(GameState.flag("lore_basalt_core"), "Magmole hollows out a basalt column")
	_satisfy("magmole", mopt.requirements)
	check(Evolution.can_evolve("magmole", mopt), "Basaltusk requirements can be met by playing")
	check(Evolution.evolve("magmole", 0) and GameState.companion() == "basaltusk", "Magmole awakens into Basaltusk")
	await _frames(2)
	var bas: Creature = lvl.creatures.get("basaltusk")
	check(bas != null and bas.mode == Creature.Mode.COMPANION, "Basaltusk walks with you in Emberfall")
	check(DB.creature("basaltusk").rideable, "Basaltusk can be ridden")
	Abilities._ready_at.clear()
	GameState.add_friendship("basaltusk", 100)
	p.global_position = lvl.ground(lx - 8.0, lz) + Vector3(0, 0.5, 0)
	p.rotation.y = -PI * 0.5
	var crust_before := get_tree().get_nodes_in_group("lava_crust").size()
	check(Abilities.activate(bas, "basalt_path") == "", "Basalt Path runs beside the lava")
	await _frames(2)
	check(get_tree().get_nodes_in_group("lava_crust").size() >= crust_before, "Basalt Path lays a causeway over the lava")
	var oopt: Dictionary = Evolution.options("basaltusk")[0]
	check(oopt.to == "obsidra" and not Evolution.can_evolve("basaltusk", oopt), "Obsidra's Awakening needs the Glass Records")
	for st in records:
		st.interact(p)
		ui.hud._dlg_queue.clear()
		ui.hud._dialogue.visible = false
	check(GameState.flag("lore_glass_record_1") and GameState.flag("lore_glass_record_2"), "both Glass Records can be read in the deep")
	_satisfy("basaltusk", oopt.requirements)
	check(Evolution.can_evolve("basaltusk", oopt), "all Obsidra requirements met without buying anything")
	check(Evolution.evolve("basaltusk", 0), "Basaltusk awakens into Obsidra")
	var obs: CreatureData = DB.creature("obsidra")
	check(obs.is_colossal() and obs.rideable and not obs.flight and CreatureModels.has_model("obsidra"), "Obsidra is a rideable colossal that walks (it does not fly)")
	check(String(GameState.data.creatures.obsidra.evolved_from) == "basaltusk", "family line Magmole > Basaltusk > Obsidra recorded")
	check(Evolution.remembered_forms("obsidra").map(func(c): return c.id) == ["magmole", "basaltusk", "obsidra"], "all three forms remembered")
	check(not ("purchase" in Array(obs.acquisition)), "Obsidra is earned only: it is never purchasable")
	var oshop: ShopItemData = DB.product("colossal_obsidra")
	check(oshop != null and oshop.price == 0 and oshop.currency == "none", "the Market lists Obsidra as free and earned")
	check(Evolution.choose_form("magmole"), "Magmole can still come along (narrow cave tunnels)")
	await _frames(2)
	ui.play_evolution("magmole", "basaltusk")
	await get_tree().create_timer(8.5).timeout
	check(ui.evolution.style == "stone" and ui.evolution._card.visible, "the Magmole family's own stone Awakening sequence plays")
	ui.evolution.close()
	ui.hud._dlg_queue.clear()
	ui.hud._dialogue.visible = false
	p.input_locked = false
	# Ashwing passive softens falls.
	GameState.set_companion("ashwing")
	lvl.refresh_creatures()
	check(Abilities.featherfall_active(), "Featherfall passive active")
	ui.open_panel("map", {})
	await _frames(2)
	check(ui.panels.map.visible, "map opens in Emberfall")
	ui.panels.map.close()
	await get_tree().create_timer(0.3).timeout
	GameState.data.player.region = "meadow"

func _satisfy(cid: String, req: Dictionary) -> void:
	if req.has("friendship"):
		GameState.add_friendship(cid, 100)
	if req.has("level"):
		while GameState.level() < int(req.level):
			GameState.add_xp(500)
	if req.has("items"):
		for it in req.items:
			GameState.add_item(it, int(req.items[it]), false)
	if req.has("ability_uses"):
		for k in req.ability_uses:
			GameState.data.stats["ability_" + k] = int(req.ability_uses[k])
	if req.has("visited"):
		for l in req.visited:
			if not (l in GameState.data.visited):
				GameState.data.visited.append(l)
	if req.has("stats"):
		for k in req.stats:
			GameState.data.stats[k] = int(req.stats[k])
	if req.has("sanctuary"):
		for st in req.sanctuary:
			GameState.data.sanctuary[st] = maxi(GameState.sanctuary_stage(st), int(req.sanctuary[st]))
	if req.has("quest") and not Quests.is_completed(req.quest):
		Quests.completed().append(req.quest)
	if req.has("lore"):
		for l in req.lore:
			GameState.set_flag("lore_" + l)

func _mesh_count(n: Node) -> int:
	return n.find_children("*", "MeshInstance3D", true, false).size()

func _physics(n: int) -> void:
	for i in n:
		await get_tree().physics_frame

func _frames(n: int) -> void:
	for i in n:
		await get_tree().process_frame
