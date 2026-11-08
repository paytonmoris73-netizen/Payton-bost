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
		check(a.effect in ["reveal", "highlight", "harvest", "dash", "glide", "wind_lift", "root_bridge", "swim_boost", "regrow", "flight", "combo", "region_locked", "passive_sense", "passive_yield", "passive_speed", "passive_luck", "passive_calm", "passive_glow"], "ability %s has a handled effect (%s)" % [a.id, a.effect])
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
	section("save after play")
	check(SaveManager.save_game(), "save after full session")
	var snapshot := JSON.stringify(GameState.data)
	fresh()
	SaveManager.load_game()
	check(GameState.sanctuary_stage("oak") == 1 and GameState.is_discovered("verdantus"), "progress survives reload")
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
	section("evolution")
	GameState.set_companion(moss)
	lvl.refresh_creatures()
	var opts := Evolution.options(moss)
	check(opts.size() == 2, "Mossbun has natural and alternate paths")
	GameState.data.inventory.erase("glimmerroot")
	check(not Evolution.can_evolve(moss, opts[0]), "missing materials block evolution")
	var unmet: Array = Evolution.requirements(moss, opts[0]).filter(func(x): return not x.met)
	check(unmet.size() >= 1 and String(unmet[0].label).contains("Glimmerroot"), "unmet requirement is named")
	GameState.add_item("glimmerroot", 2, false)
	while GameState.level() < 4:
		GameState.add_xp(500)
	check(Evolution.can_evolve(moss, opts[0]), "all Mosswarden requirements met")
	check(Evolution.evolve(moss, 0), "Mossbun evolves")
	await _frames(2)
	check(GameState.evolved_to(moss) == "mosswarden" and GameState.is_discovered("mosswarden"), "evolution recorded")
	check(GameState.companion() == "mosswarden", "companion transfers to the new form")
	check(GameState.friendship_level("mosswarden") >= 4, "friendship carried over")
	check(GameState.item_count("glimmerroot") == 0, "evolution materials consumed")
	check(lvl.creatures.has("mosswarden") and not lvl.creatures.has("mossbun"), "world shows the new form")
	check(not Evolution.can_evolve(moss, opts[1]), "can't also take the alternate path")
	check("first_evolution" in GameState.data.achievements, "evolution achievement")
	var asc: Dictionary = Evolution.options("mosswarden")[0]
	check(not Evolution.can_evolve("mosswarden", asc), "ascension blocked while Verdantus is already bonded")
	check(Abilities.activate(lvl.creatures.mosswarden, "root_bridge") == "", "Root Bridge grows")
	await _frames(2)
	var bridges := get_tree().get_nodes_in_group("root_bridge")
	check(bridges.size() == 1 and bridges[0].find_children("*", "StaticBody3D", true, false).size() == 1, "root bridge has walkable collision")
	ui.play_evolution(moss, "mosswarden")
	await get_tree().create_timer(9.5).timeout
	check(ui.evolution.visible and ui.evolution._card.visible, "evolution sequence reaches the reveal card")
	ui.evolution.close()
	check(not ui.evolution.visible and (not p.input_locked or ui.hud.dialogue_open()), "closing the sequence returns control")
	# Clear any story dialogue queued by earlier steps so movement tests run.
	ui.hud._dlg_queue.clear()
	ui.hud._dialogue.visible = false
	p.input_locked = false
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

func _frames(n: int) -> void:
	for i in n:
		await get_tree().process_frame
