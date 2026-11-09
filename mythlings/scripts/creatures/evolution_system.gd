extends Node
## Evolution engine (autoload "Evolution"). Requirements are data on
## CreatureData.evolutions and are always shown in full. Nothing here is random
## and nothing can be bought.

signal evolved(from_id: String, to_id: String)

const PATH_NAMES := {"natural": "Natural evolution", "alternate": "Alternate evolution", "ascended": "Ascended form"}

func options(cid: String) -> Array:
	var c: CreatureData = DB.creature(cid)
	return Array(c.evolutions) if c else []

## Returns [{label, met, progress}] for each requirement of an evolution option.
func requirements(cid: String, evo: Dictionary) -> Array:
	var out: Array = []
	var req: Dictionary = evo.get("requirements", {})
	var c: CreatureData = DB.creature(cid)
	if req.has("friendship"):
		var have := GameState.friendship_level(cid)
		out.append({"label": "%s friendship level %d" % [c.display_name, int(req.friendship)], "met": have >= int(req.friendship), "progress": "%d / %d" % [have, int(req.friendship)]})
	if req.has("level"):
		out.append({"label": "Keeper level %d" % int(req.level), "met": GameState.level() >= int(req.level), "progress": "%d / %d" % [GameState.level(), int(req.level)]})
	if req.has("items"):
		for it in req.items:
			var d: ItemData = DB.item(it)
			var have := GameState.item_count(it)
			out.append({"label": "%d × %s (used up)" % [int(req.items[it]), d.display_name if d else it], "met": have >= int(req.items[it]), "progress": "%d / %d" % [have, int(req.items[it])]})
	if req.has("sanctuary"):
		for site in req.sanctuary:
			var names := {"oak": "Ancient Oak Sanctuary", "shrine": "Forgotten Shrine", "bridge": "Meadow Bridge"}
			var have := GameState.sanctuary_stage(site)
			out.append({"label": "%s restored to stage %d" % [names.get(site, site), int(req.sanctuary[site])], "met": have >= int(req.sanctuary[site]), "progress": "%d / %d" % [have, int(req.sanctuary[site])]})
	if req.has("ability_uses"):
		for kind in req.ability_uses:
			var have := int(GameState.data.stats.get("ability_" + kind, 0))
			var label := {"hidden_plant": "Reveal hidden plants with abilities", "lucky_clover": "Find lucky clovers", "dark_lantern": "Light old lanterns", "cracked_rock": "Crack weakened boulders", "ripple_stone": "Raise stepping stones", "wilted_flower": "Revive wilted flowers"}.get(kind, "Use abilities on " + kind.replace("_", " "))
			out.append({"label": "%s (%d times)" % [label, int(req.ability_uses[kind])], "met": have >= int(req.ability_uses[kind]), "progress": "%d / %d" % [mini(have, int(req.ability_uses[kind])), int(req.ability_uses[kind])]})
	if req.has("stats"):
		for k in req.stats:
			var have := int(GameState.data.stats.get(k, 0))
			var need := int(req.stats[k])
			var label: String = k
			if k.begins_with("rain_with_"):
				var cd: CreatureData = DB.creature(k.trim_prefix("rain_with_"))
				label = "Be with %s when it starts to rain" % (cd.display_name if cd else k)
			out.append({"label": label + (" (%d times)" % need if need > 1 else ""), "met": have >= need, "progress": "%d / %d" % [mini(have, need), need]})
	if req.has("visited"):
		var n := 0
		var names: Array = []
		for l in req.visited:
			if l in GameState.data.visited:
				n += 1
			names.append(_loc_name(l))
		out.append({"label": "Visit " + ", ".join(names), "met": n == req.visited.size(), "progress": "%d / %d" % [n, req.visited.size()]})
	if req.has("quest"):
		var q: QuestData = DB.quest(req.quest)
		out.append({"label": "Complete \"%s\"" % (q.title if q else req.quest), "met": Quests.is_completed(req.quest), "progress": ""})
	if req.has("not_owned"):
		var t: CreatureData = DB.creature(req.not_owned)
		var owned := GameState.is_discovered(req.not_owned)
		out.append({"label": "You have not already bonded with %s" % t.display_name, "met": not owned, "progress": "Already bonded" if owned else "OK"})
	return out

func _loc_name(id: String) -> String:
	return MeadowLevel.location_name(id)

func can_evolve(cid: String, evo: Dictionary) -> bool:
	if not GameState.is_discovered(cid) or GameState.evolved_to(cid) != "":
		return false
	var target: CreatureData = DB.creature(evo.get("to", ""))
	if target == null or not target.model_ready:
		return false
	for r in requirements(cid, evo):
		if not r.met:
			return false
	return true

func evolve(cid: String, index: int) -> bool:
	var opts := options(cid)
	if index < 0 or index >= opts.size():
		return false
	var evo: Dictionary = opts[index]
	if not can_evolve(cid, evo):
		return false
	var to: String = evo.to
	if evo.requirements.has("items"):
		GameState.consume_items(evo.requirements.items)
	var src: Dictionary = GameState.data.creatures[cid]
	src.evolved_to = to
	GameState.discover(to, String(src.get("discovered_at", "")))
	var t: Dictionary = GameState.data.creatures[to]
	t.friendship = maxi(int(t.friendship), int(src.friendship))
	t.evolved_from = cid
	var elog: Array = GameState.data.flags.get("evolution_log", [])
	elog.append({"from": cid, "to": to, "path": evo.path, "time": Time.get_datetime_string_from_system()})
	GameState.data.flags["evolution_log"] = elog
	if GameState.companion() == cid:
		GameState.data.companion = to
	var hab: Array = GameState.data.flags.get("habitat", [])
	if cid in hab:
		hab.erase(cid)
		if not DB.creature(to).is_colossal():
			hab.append(to)
		GameState.data.flags["habitat"] = hab
	GameState.add_xp(150 if evo.path != "ascended" else 400)
	Events.emit_game_event("evolve", to)
	Events.companion_changed.emit(GameState.companion())
	GameState.check_achievements()
	evolved.emit(cid, to)
	SaveManager.save_game()
	return true

## Forms the player currently owns (evolved-away forms excluded).
func owned_forms() -> Array:
	var out: Array = []
	for c in DB.creatures.values():
		if GameState.is_discovered(c.id) and GameState.evolved_to(c.id) == "":
			out.append(c)
	return out
