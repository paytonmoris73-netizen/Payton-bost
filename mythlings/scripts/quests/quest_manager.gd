extends Node
## Tracks quest availability, progress and completion. Quests are data (QuestData)
## and progress is driven only by Events.game_event, so any system can advance a
## quest without knowing about it.

func _ready() -> void:
	Events.game_event.connect(_on_game_event)
	Events.level_up.connect(func(_l): refresh_available())

func active() -> Dictionary:
	return GameState.data.quests.active

func completed() -> Array:
	return GameState.data.quests.completed

func is_active(id: String) -> bool:
	return active().has(id)

func is_completed(id: String) -> bool:
	return id in completed()

func is_available(q: QuestData) -> bool:
	if is_active(q.id) or is_completed(q.id):
		return false
	if q.category == "daily":
		return false  # dailies are started by refresh_dailies
	if GameState.level() < q.min_level:
		return false
	for p in q.prerequisites:
		if not is_completed(p):
			return false
	return true

## Starts every quest whose prerequisites are met and that starts automatically.
func refresh_available() -> void:
	if not GameState.session_active:
		return
	var list := DB.quests.values()
	list.sort_custom(func(a, b): return a.sort_order < b.sort_order)
	for q in list:
		if q.auto_start and is_available(q):
			start(q.id)
	refresh_dailies()

func refresh_dailies() -> void:
	var today := Time.get_date_string_from_system()
	if GameState.data.quests.daily_date == today:
		return
	GameState.data.quests.daily_date = today
	for q in DB.quests.values():
		if q.category != "daily":
			continue
		completed().erase(q.id)
		active().erase(q.id)
		if GameState.level() >= q.min_level:
			start(q.id, true)

func start(id: String, silent := false) -> bool:
	var q: QuestData = DB.quest(id)
	if q == null or is_active(id):
		return false
	var progress: Array = []
	for o in q.objectives:
		progress.append(0)
	active()[id] = {"progress": progress}
	if GameState.data.quests.tracked == "" or q.category == "main":
		GameState.data.quests.tracked = id
	Events.quest_started.emit(id)
	if not silent:
		Events.toast.emit("New quest", q.title, "quest")
		if q.start_dialogue.size() > 0:
			Events.request_dialogue.emit(q.giver, Array(q.start_dialogue))
	_catch_up(q)
	return true

## Some objectives describe state that may already be true (e.g. creature already
## discovered or item already held); credit those immediately.
func _catch_up(q: QuestData) -> void:
	var st: Dictionary = active()[q.id]
	for i in q.objectives.size():
		var ev: String = q.objectives[i].event
		var parts := ev.split(":")
		var need := int(q.objectives[i].get("count", 1))
		var have := 0
		match parts[0]:
			"discover":
				if parts[1] == "*":
					have = GameState.discovered_count("", false)
				elif GameState.is_discovered(parts[1]):
					have = 1
			"reach":
				if parts[1] in GameState.data.visited:
					have = 1
			"companion":
				if GameState.companion() == parts[1]:
					have = 1
			"befriend":
				have = GameState.friendship_level(parts[1])
			"restore":
				var site := parts[1].rsplit("_", true, 1)
				if site.size() == 2 and GameState.sanctuary_stage(site[0]) >= int(site[1]):
					have = 1
			"has":
				have = GameState.item_count(parts[1])
		if have > 0:
			st.progress[i] = max(int(st.progress[i]), min(have, need))
	_check_complete(q)

func _on_game_event(kind: String, id: String, amount: int) -> void:
	for qid in active().keys():
		var q: QuestData = DB.quest(qid)
		if q == null:
			active().erase(qid)
			continue
		var st: Dictionary = active()[qid]
		var changed := false
		for i in q.objectives.size():
			var o: Dictionary = q.objectives[i]
			var parts := String(o.event).split(":")
			if parts[0] != kind:
				continue
			if parts[1] != "*" and parts[1] != id:
				continue
			var need := int(o.get("count", 1))
			var cur := int(st.progress[i])
			if cur >= need:
				continue
			# "befriend" reports a level, others report increments.
			var nv := amount if kind == "befriend" else cur + amount
			st.progress[i] = min(need, max(cur, nv))
			changed = true
		if changed:
			Events.quest_progress.emit(qid)
			_check_complete(q)

func objective_done(qid: String, i: int) -> bool:
	var q: QuestData = DB.quest(qid)
	if q == null or not is_active(qid):
		return is_completed(qid)
	return int(active()[qid].progress[i]) >= int(q.objectives[i].get("count", 1))

func progress_of(qid: String, i: int) -> int:
	if not is_active(qid):
		return 0
	return int(active()[qid].progress[i])

func _check_complete(q: QuestData) -> void:
	if not is_active(q.id):
		return
	for i in q.objectives.size():
		if not objective_done(q.id, i):
			return
	complete(q.id)

func complete(id: String) -> void:
	var q: QuestData = DB.quest(id)
	active().erase(id)
	if not id in completed():
		completed().append(id)
	GameState.grant_rewards(q.rewards, "quest:" + id)
	if GameState.data.quests.tracked == id:
		GameState.data.quests.tracked = ""
	Events.quest_completed.emit(id)
	Audio.play_sfx("quest_complete")
	if q.end_dialogue.size() > 0:
		Events.request_dialogue.emit(q.giver, Array(q.end_dialogue))
	call_deferred("refresh_available")
	call_deferred("_pick_tracked")

func _pick_tracked() -> void:
	if GameState.data.quests.tracked != "" and is_active(GameState.data.quests.tracked):
		return
	var best: QuestData = null
	for qid in active():
		var q: QuestData = DB.quest(qid)
		if q == null or q.category == "daily":
			continue
		if best == null or (q.category == "main" and best.category != "main") or (q.category == best.category and q.sort_order < best.sort_order):
			best = q
	GameState.data.quests.tracked = best.id if best else ""
	Events.quest_progress.emit(GameState.data.quests.tracked)

func tracked() -> String:
	var t: String = GameState.data.quests.tracked
	if t != "" and not is_active(t):
		_pick_tracked()
		t = GameState.data.quests.tracked
	return t

func objective_text(qid: String, i: int) -> String:
	var q: QuestData = DB.quest(qid)
	var o: Dictionary = q.objectives[i]
	var need := int(o.get("count", 1))
	var label: String = o.get("label", o.event)
	if need > 1:
		return "%s  %d/%d" % [label, min(progress_of(qid, i), need), need]
	return label
