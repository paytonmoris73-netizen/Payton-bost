extends Node
## Ability engine (autoload "Abilities"). Abilities are data (AbilityData); this
## node maps each `effect` to real gameplay. Passives are queried by the systems
## they affect (gathering, movement, chests, shy creatures).

signal ability_used(creature_id: String, ability_id: String)

const SLOTS := ["passive", "primary", "secondary", "signature"]
var _ready_at: Dictionary = {}  # "cid:aid" -> msec when usable again

# ------------------------------------------------------------------ queries
func kit(cid: String) -> Array:
	var c: CreatureData = DB.creature(cid)
	var out: Array = []
	if c == null:
		return out
	for aid in c.abilities:
		var a: AbilityData = DB.ability(aid)
		if a:
			out.append(a)
	return out

func in_slot(cid: String, slot: String) -> AbilityData:
	var c: CreatureData = DB.creature(cid)
	return DB.ability(c.ability_in(slot)) if c else null

func unlocked(cid: String, a: AbilityData) -> bool:
	if a == null:
		return false
	return GameState.friendship_level(cid) >= a.unlock_friendship

func lock_reason(cid: String, a: AbilityData) -> String:
	if a.effect == "region_locked":
		return "Arrives with a future region update."
	if GameState.friendship_level(cid) < a.unlock_friendship:
		return "Unlocks at friendship level %d." % a.unlock_friendship
	return ""

func cooldown_left(cid: String, aid: String) -> float:
	var t: int = _ready_at.get(cid + ":" + aid, 0)
	return maxf(0.0, (t - Time.get_ticks_msec()) / 1000.0)

func companion_id() -> String:
	return GameState.companion()

func _active_passive(effect: String) -> AbilityData:
	var cid := companion_id()
	if cid == "":
		return null
	var a := in_slot(cid, "passive")
	return a if a and a.effect == effect and unlocked(cid, a) else null

func speed_mult() -> float:
	var a := _active_passive("passive_speed")
	return float(a.params.get("mult", 1.0)) if a else 1.0

func yield_bonus(item_id: String) -> int:
	var a := _active_passive("passive_yield")
	if a and item_id in a.params.get("items", []):
		return int(a.params.get("bonus", 1))
	return 0

func luck_mult() -> float:
	var a := _active_passive("passive_luck")
	return float(a.params.get("gold_mult", 1.0)) if a else 1.0

func calm_active() -> bool:
	return _active_passive("passive_calm") != null or shelter_active()

## Living Shelter (Mossmantle): a moss dome; inside it Mythlings stay calm and
## interactions earn more friendship.
var _shelter := {}

func shelter_active() -> bool:
	if _shelter.is_empty() or Time.get_ticks_msec() > int(_shelter.until):
		return false
	var lvl := MeadowLevel.current
	if lvl == null or lvl.player == null:
		return false
	return lvl.player.global_position.distance_to(_shelter.pos) <= float(_shelter.radius)

func friendship_mult() -> float:
	return float(_shelter.get("mult", 1.0)) if shelter_active() else 1.0

func swim_mult() -> float:
	var a := _active_passive("passive_swim")
	return float(a.params.get("mult", 1.0)) if a else 1.0

func featherfall_active() -> bool:
	return _active_passive("passive_glide") != null

func glow_active() -> bool:
	return _active_passive("passive_glow") != null

## Passive sense: returns {"text":..., "target": AbilityTarget} or {}.
func sense_hint(origin: Vector3) -> Dictionary:
	var a := _active_passive("passive_sense")
	if a == null:
		return {}
	var best: AbilityTarget = null
	var bd: float = float(a.params.get("radius", 20.0))
	for t in get_tree().get_nodes_in_group("ability_target"):
		var at := t as AbilityTarget
		if at and not at.done and at.kind in a.params.get("kinds", []):
			var d := at.global_position.distance_to(origin)
			if d < bd:
				bd = d
				best = at
	if best == null:
		return {}
	var c: CreatureData = DB.creature(companion_id())
	return {"text": "%s's ears twitch: something hidden to the %s (%dm)" % [c.display_name, Creature._compass(best.global_position - origin), int(bd)], "target": best}

func useful_ability_for(cid: String, player: Player) -> String:
	return useful_here(cid, player.global_position, player) if player else ""

## Which unlocked active ability would do something right here (for HUD hints).
func useful_here(cid: String, origin: Vector3, player: Player) -> String:
	for slot in ["primary", "secondary", "signature"]:
		var a := in_slot(cid, slot)
		if a == null or not unlocked(cid, a) or cooldown_left(cid, a.id) > 0.0:
			continue
		match a.effect:
			"reveal":
				if _targets_in(a.params.get("kinds", []), origin, float(a.params.get("radius", 14.0))).size() > 0:
					return a.id
			"combo":
				for st in a.params.get("steps", []):
					if st.effect == "reveal" and _targets_in(st.params.get("kinds", []), origin, float(st.params.get("radius", 14.0))).size() > 0:
						return a.id
			"swim_boost":
				if player and (player.swimming or player.wading):
					return a.id
			"root_bridge":
				var lvl := MeadowLevel.current
				if lvl and lvl.near_gap(origin):
					return a.id
	return ""

func _targets_in(kinds: Array, origin: Vector3, radius: float) -> Array:
	var out: Array = []
	for t in get_tree().get_nodes_in_group("ability_target"):
		var at := t as AbilityTarget
		if at and not at.done and at.kind in kinds and at.global_position.distance_to(origin) <= radius:
			out.append(at)
	return out

# ------------------------------------------------------------------ activation
## Returns "" on success, otherwise a player-facing explanation.
func activate(c: Creature, aid: String) -> String:
	var a: AbilityData = DB.ability(aid)
	if c == null or a == null:
		return "No ability."
	var cid := c.data.id
	if a.slot == "passive":
		return "%s is always active while %s is with you." % [a.display_name, c.data.display_name]
	var reason := lock_reason(cid, a)
	if reason != "":
		return reason
	var cd := cooldown_left(cid, aid)
	if cd > 0.0:
		return "%s needs %ds to recover." % [a.display_name, ceili(cd)]
	var lvl := MeadowLevel.current
	var p: Player = lvl.player if lvl else null
	var res := _run(a.effect, a.params, c, p)
	if res.ok:
		_ready_at[cid + ":" + aid] = Time.get_ticks_msec() + int(a.cooldown * 1000.0)
		AbilityFX.play(a.vfx, c, a.color, a.slot == "signature")
		Audio.play_sfx(a.sound, 0.9 if c.data.size_class != "small" else 1.1)
		GameState.add_stat("abilities_used")
		Events.emit_game_event("use_ability", aid)
		ability_used.emit(cid, aid)
		return ""
	# Failed attempts get a short cooldown so spamming does nothing silly.
	_ready_at[cid + ":" + aid] = Time.get_ticks_msec() + 1500
	return res.msg

func _run(effect: String, params: Dictionary, c: Creature, p: Player) -> Dictionary:
	var origin: Vector3 = p.global_position if p else c.global_position
	match effect:
		"reveal":
			var kinds: Array = params.get("kinds", [])
			var radius := float(params.get("radius", 14.0))
			var hits := 0
			for at in _targets_in(kinds, origin, radius):
				if at.activate():
					hits += 1
			if hits > 0:
				return {"ok": true, "msg": ""}
			for at in _targets_in(kinds, origin, radius):
				var why: String = at.block_reason()
				if why != "":
					return {"ok": false, "msg": why}
			var nearest: AbilityTarget = null
			var nd := INF
			for t in get_tree().get_nodes_in_group("ability_target"):
				var at2 := t as AbilityTarget
				if at2 and not at2.done and at2.kind in kinds:
					var d := at2.global_position.distance_to(origin)
					if d < nd:
						nd = d
						nearest = at2
			if nearest:
				return {"ok": false, "msg": "%s senses something to the %s (%dm)." % [c.data.display_name, Creature._compass(nearest.global_position - origin), int(nd)]}
			if "volcanic_structure" in kinds:
				return {"ok": false, "msg": "No volcanic mechanisms here. They are found in Emberfall Highlands (World Map)."}
			return {"ok": false, "msg": "%s finds nothing new around here." % c.data.display_name}
		"highlight":
			var n := _highlight(origin, float(params.get("radius", 30.0)), params.get("items", []), float(params.get("duration", 25.0)))
			return {"ok": n > 0, "msg": "No resources nearby right now." if n == 0 else ""}
		"harvest":
			var got := _harvest(origin, float(params.get("radius", 10.0)), params.get("items", []), int(params.get("max", 2)), p)
			return {"ok": got > 0, "msg": "Nothing ready to gather nearby." if got == 0 else ""}
		"regrow":
			var n2 := _regrow(origin, float(params.get("radius", 15.0)))
			return {"ok": true, "msg": ""} if n2 >= 0 else {"ok": false, "msg": ""}
		"dash":
			if p == null:
				return {"ok": false, "msg": ""}
			p.dash(float(params.get("speed", 16.0)), float(params.get("time", 0.28)))
			return {"ok": true, "msg": ""}
		"glide":
			if p == null:
				return {"ok": false, "msg": ""}
			p.glide_time = float(params.get("duration", 10.0))
			Events.toast.emit("Glide ready", "Jump from anywhere high and you'll float down.", "leaf")
			return {"ok": true, "msg": ""}
		"wind_lift":
			if p == null or p.mount != null:
				return {"ok": false, "msg": "Can't do that while riding."}
			p.velocity.y = sqrt(2.0 * Player.GRAVITY * float(params.get("height", 10.0)))
			return {"ok": true, "msg": ""}
		"swim_boost":
			if p == null:
				return {"ok": false, "msg": ""}
			p.swim_boost_time = float(params.get("duration", 20.0))
			p.swim_boost_mult = float(params.get("mult", 2.0))
			return {"ok": true, "msg": ""}
		"root_bridge":
			if p == null or MeadowLevel.current == null:
				return {"ok": false, "msg": ""}
			MeadowLevel.current.spawn_root_bridge(p, float(params.get("length", 14.0)), float(params.get("duration", 25.0)), float(params.get("width", 3.0)))
			return {"ok": true, "msg": ""}
		"shelter":
			if p == null:
				return {"ok": false, "msg": ""}
			var dur := float(params.get("duration", 40.0))
			_shelter = {"pos": p.global_position, "radius": float(params.get("radius", 6.0)), "until": Time.get_ticks_msec() + int(dur * 1000.0), "mult": float(params.get("friendship_mult", 2.0))}
			if MeadowLevel.current:
				MeadowLevel.current.spawn_shelter(p.global_position, float(params.get("radius", 6.0)), dur)
			Events.toast.emit("Living Shelter", "Mythlings nearby feel safe. Interactions inside the shelter earn double friendship.", "leaf")
			return {"ok": true, "msg": ""}
		"weather":
			var lvl2 := MeadowLevel.current
			var want: String = params.get("state", "rain")
			if lvl2 == null or lvl2.weather == null or not lvl2.weather.allows(want):
				return {"ok": false, "msg": "The skies here won't bring %s." % want}
			if lvl2.weather.state == want:
				return {"ok": false, "msg": "It's already raining."}
			lvl2.weather.set_state(want)
			lvl2.weather._timer = 120.0
			return {"ok": true, "msg": ""}
		"crust":
			if p == null or MeadowLevel.current == null:
				return {"ok": false, "msg": ""}
			var made: int = MeadowLevel.current.spawn_crust(p, float(params.get("duration", 20.0)))
			return {"ok": made > 0, "msg": "There's no lava close enough to cool." if made == 0 else ""}
		"flight":
			if p == null:
				return {"ok": false, "msg": ""}
			if p.mount == c:
				return {"ok": false, "msg": "Hold Jump to climb; let go to glide down."}
			if not p.can_mount(c):
				return {"ok": false, "msg": "%s needs friendship level 3 to carry you." % c.data.display_name}
			if c.global_position.distance_to(p.global_position) > (24.0 if c.data.locomotion == "swim" else 14.0):
				return {"ok": false, "msg": "Get closer to %s first." % c.data.display_name}
			if c.data.locomotion == "swim" and not MeadowLevel.current.water_deep(c.global_position.x, c.global_position.z):
				return {"ok": false, "msg": "%s can only carry you in deep water." % c.data.display_name}
			p.mount_creature(c)
			return {"ok": true, "msg": ""}
		"combo":
			var any := false
			var last := ""
			for st in params.get("steps", []):
				var r := _run(st.effect, st.params, c, p)
				any = any or r.ok
				if not r.ok and r.msg != "":
					last = r.msg
			return {"ok": any, "msg": last}
		"region_locked":
			return {"ok": false, "msg": "This ability belongs to a region that isn't in this build yet."}
	return {"ok": false, "msg": "Unknown ability effect: " + effect}

func _resource_nodes() -> Array:
	var out: Array = []
	for n in get_tree().get_nodes_in_group("interactable"):
		if n is ResourceNode:
			out.append(n)
	return out

func _highlight(origin: Vector3, radius: float, items: Array, duration: float) -> int:
	var n := 0
	for rn in _resource_nodes():
		if not rn.enabled or not rn.is_visible_in_tree() or rn.global_position.distance_to(origin) > radius:
			continue
		if items.size() > 0 and not (rn.item_id in items):
			continue
		n += 1
		var beacon := Node3D.new()
		var col: Color = DB.item(rn.item_id).color if DB.item(rn.item_id) else Color.WHITE
		MeshKit.add(beacon, MeshKit.cyl(0.06, 0.18, 6.0, 8), MeshKit.glass(col.lightened(0.3), 0.35, col), Vector3(0, 3.0, 0))
		MeshKit.add(beacon, MeshKit.sphere(0.25, 8, 4), MeshKit.glow(col, 1.6), Vector3(0, 6.2, 0))
		rn.add_child(beacon)
		beacon.scale = Vector3(1, 0.01, 1)
		var tw := beacon.create_tween()
		tw.tween_property(beacon, "scale", Vector3.ONE, 0.5).set_trans(Tween.TRANS_BACK).set_ease(Tween.EASE_OUT)
		tw.tween_interval(duration)
		tw.tween_property(beacon, "scale", Vector3(1, 0.01, 1), 0.4)
		tw.tween_callback(beacon.queue_free)
	return n

func _harvest(origin: Vector3, radius: float, items: Array, max_n: int, p: Player) -> int:
	var cands: Array = []
	for rn in _resource_nodes():
		if rn.enabled and rn.is_visible_in_tree() and rn.once_flag == "" and rn.item_id in items and rn.global_position.distance_to(origin) <= radius:
			cands.append(rn)
	cands.sort_custom(func(a, b): return a.global_position.distance_to(origin) < b.global_position.distance_to(origin))
	var got := 0
	for rn in cands.slice(0, max_n):
		rn.interact(null)
		got += 1
	return got

func _regrow(origin: Vector3, radius: float) -> int:
	var n := 0
	for rn in _resource_nodes():
		if not rn.enabled and rn.respawn_time >= 0.0 and rn.global_position.distance_to(origin) <= radius:
			rn._set_available(true)
			n += 1
	if n > 0:
		Events.toast.emit("Regrowth", "%d gathering spot%s grew back." % [n, "" if n == 1 else "s"], "leaf")
	return n
