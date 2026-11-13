extends Node
## AWAKENINGS engine (autoload "Evolution"). Requirements are data on
## CreatureData.evolutions and are always shown in full. Nothing here is random
## and nothing can be bought. Awakening is never automatic: the player chooses
## when. Earlier forms are remembered ("Form Memory") and can still accompany
## the player, and other paths can still be awakened later from the earlier
## form, so no choice is permanent.

signal evolved(from_id: String, to_id: String)

const PATH_NAMES := {"natural": "Natural Awakening", "alternate": "Alternate Awakening", "ascended": "Ascended Awakening"}
const STAGE_NAMES := ["First Form", "Awakened Form", "Advanced Form", "Ascended Form", "Colossal Form"]
const LORE_NAMES := {"grove_stone_1": "Old Grove Stone I (Heartwood Hollow)", "grove_stone_2": "Old Grove Stone II (near the Forgotten Shrine)", "grove_stone_3": "Old Grove Stone III (bound in roots, west woods)", "heartwood_seed": "Plant Mossbun's seed in the Heartwood Hollow", "ember_tablet": "the Ember Tablet (Dragonstone Ridge lookout)", "basalt_core": "Let Magmole hollow out a column in the Obsidian Deep", "glass_record_1": "the First Glass Record (Obsidian Deep, entry gallery)", "glass_record_2": "the Second Glass Record (Obsidian Deep, deep gallery)"}

static func stage_name(c: CreatureData) -> String:
	if c == null:
		return ""
	if c.is_colossal():
		return "Colossal Form"
	return STAGE_NAMES[clampi(c.stage - 1, 0, 3)]

## Every form in a family, ordered by stage.
func family_forms(fam: String) -> Array:
	var out: Array = []
	for c in DB.creatures.values():
		if c.family == fam and fam != "":
			out.append(c)
	out.sort_custom(func(a, b): return a.stage < b.stage or (a.stage == b.stage and a.id < b.id))
	return out

## Forms of this bond that the player has unlocked (for Form Memory).
func remembered_forms(cid: String) -> Array:
	var c: CreatureData = DB.creature(cid)
	if c == null:
		return []
	if c.family == "":
		return [c] if GameState.is_discovered(cid) else []
	var out: Array = []
	for f in family_forms(c.family):
		if GameState.is_discovered(f.id) and (f.id == c.family or String(GameState.data.creatures[f.id].get("evolved_from", "")) != "" or f.evolves_from == ""):
			out.append(f)
	return out

## The form a bond currently "is" (the newest form, unless the player chose to
## bring an earlier one along).
func bond_head(cid: String) -> String:
	var id := cid
	var guard := 0
	while GameState.evolved_to(id) != "" and guard < 8:
		id = GameState.evolved_to(id)
		guard += 1
	return id

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
			var label := {"moss_curtain": "Find moss-hidden passages", "tangled_roots": "Pull aside tangled roots", "hidden_plant": "Reveal hidden plants with abilities", "lucky_clover": "Find lucky clovers", "dark_lantern": "Light old lanterns", "cracked_rock": "Crack weakened boulders", "ripple_stone": "Raise stepping stones", "wilted_flower": "Revive wilted flowers"}.get(kind, "Use abilities on " + kind.replace("_", " "))
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
	if req.has("lore"):
		for l in req.lore:
			out.append({"label": "Read " + LORE_NAMES.get(l, l), "met": bool(GameState.flag("lore_" + l)), "progress": ""})
	if req.has("not_owned"):
		var t: CreatureData = DB.creature(req.not_owned)
		var owned := GameState.is_discovered(req.not_owned)
		out.append({"label": "You have not already bonded with %s" % t.display_name, "met": not owned, "progress": "Already bonded" if owned else "OK"})
	return out

func _loc_name(id: String) -> String:
	return MeadowLevel.location_name(id)

func can_evolve(cid: String, evo: Dictionary) -> bool:
	if not GameState.is_discovered(cid):
		return false
	var target: CreatureData = DB.creature(evo.get("to", ""))
	if target == null or not target.model_ready:
		return false
	if already_awakened(cid, evo):
		return false
	for r in requirements(cid, evo):
		if not r.met:
			return false
	return true

## True when this option's form is already part of this bond.
func already_awakened(cid: String, evo: Dictionary) -> bool:
	var to: String = evo.get("to", "")
	if not GameState.is_discovered(to):
		return false
	var from := String(GameState.data.creatures[to].get("evolved_from", ""))
	return from != "" or GameState.evolved_to(cid) == to

## A colossal guardian you already befriended in the wild, that your awakened
## form will join with instead of becoming a duplicate.
func joins_elder(cid: String, evo: Dictionary) -> bool:
	var to: String = evo.get("to", "")
	return GameState.is_discovered(to) and not already_awakened(cid, evo)

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
	var first_path := String(src.get("evolved_to", "")) == ""
	if first_path:
		src.evolved_to = to
	GameState.discover(to, String(src.get("discovered_at", "")))
	var t: Dictionary = GameState.data.creatures[to]
	t.friendship = maxi(int(t.friendship), int(src.friendship))
	t.evolved_from = cid
	var elog: Array = GameState.data.flags.get("evolution_log", [])
	elog.append({"from": cid, "to": to, "path": evo.path, "time": Time.get_datetime_string_from_system()})
	GameState.data.flags["evolution_log"] = elog
	if GameState.companion() == cid and (first_path or not DB.creature(to).is_colossal()):
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

## Form Memory: bring an earlier (or any unlocked) form of this bond along.
func choose_form(form_id: String) -> bool:
	var c: CreatureData = DB.creature(form_id)
	if c == null or not GameState.is_discovered(form_id) or not c.model_ready:
		return false
	GameState.data.companion = form_id
	Events.companion_changed.emit(form_id)
	Events.emit_game_event("companion", form_id)
	return true

## Totals for the Awakenings gallery.
func gallery_totals() -> Dictionary:
	var fams := {}
	for c in DB.creatures.values():
		if c.family != "":
			fams[c.family] = true
	var forms := 0
	var total := 0
	var complete := 0
	var colossal := 0
	var alternate := 0
	for f in fams:
		var all := family_forms(f)
		var have := 0
		for c in all:
			total += 1
			if GameState.is_discovered(c.id):
				have += 1
				if c.is_colossal():
					colossal += 1
		forms += have
		if have == all.size() and all.size() > 1:
			complete += 1
	for e in GameState.data.flags.get("evolution_log", []):
		if String(e.get("path", "")) == "alternate":
			alternate += 1
	return {"forms": forms, "total": total, "families": complete, "family_total": fams.size(), "colossal": colossal, "alternate": alternate}
