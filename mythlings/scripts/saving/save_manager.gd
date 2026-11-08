extends Node
## Versioned, atomic JSON saves with a rolling backup.
## - Writes go to a temp file first, the previous save becomes save.bak.
## - Corrupt files are quarantined (never overwritten) and the backup is tried.
## - Nothing is written until a session is active, so defaults can never clobber a save.

const SAVE_VERSION := 2
const SAVE_PATH := "user://mythlings_save.json"
const BACKUP_PATH := "user://mythlings_save.bak"
const TMP_PATH := "user://mythlings_save.tmp"
const AUTOSAVE_INTERVAL := 45.0

signal saved
signal loaded

var last_error := ""
var _timer := 0.0
var save_dir_override := ""  # used by tests

func _path(p: String) -> String:
	return p if save_dir_override == "" else save_dir_override.path_join(p.get_file())

func _process(delta: float) -> void:
	if not GameState.session_active:
		return
	GameState.data.player.play_time = float(GameState.data.player.play_time) + delta
	_timer += delta
	if _timer >= AUTOSAVE_INTERVAL:
		_timer = 0.0
		save_game()

func _notification(what: int) -> void:
	if what == NOTIFICATION_WM_CLOSE_REQUEST or what == NOTIFICATION_APPLICATION_PAUSED or what == NOTIFICATION_APPLICATION_FOCUS_OUT:
		if GameState.session_active:
			save_game()

func has_save() -> bool:
	return FileAccess.file_exists(_path(SAVE_PATH)) or FileAccess.file_exists(_path(BACKUP_PATH))

func save_game() -> bool:
	if not GameState.session_active:
		return false
	var payload := {
		"version": SAVE_VERSION,
		"saved_at": Time.get_datetime_string_from_system(true),
		"data": GameState.data,
	}
	var text := JSON.stringify(payload)
	if text.length() < 20:
		last_error = "Refusing to write suspiciously small save"
		push_error(last_error)
		return false
	var f := FileAccess.open(_path(TMP_PATH), FileAccess.WRITE)
	if f == null:
		last_error = "Cannot open temp save: %s" % error_string(FileAccess.get_open_error())
		push_error(last_error)
		return false
	f.store_string(text)
	f.close()
	# Verify what we wrote parses before replacing anything.
	if _read_payload(_path(TMP_PATH)).is_empty():
		last_error = "Temp save failed verification"
		push_error(last_error)
		return false
	if FileAccess.file_exists(_path(SAVE_PATH)):
		if FileAccess.file_exists(_path(BACKUP_PATH)):
			DirAccess.remove_absolute(_path(BACKUP_PATH))
		DirAccess.rename_absolute(_path(SAVE_PATH), _path(BACKUP_PATH))
	var err := DirAccess.rename_absolute(_path(TMP_PATH), _path(SAVE_PATH))
	if err != OK:
		last_error = "Rename failed: %s" % error_string(err)
		push_error(last_error)
		return false
	saved.emit()
	return true

## Returns true if a save was loaded. On total failure GameState keeps defaults
## and the corrupt file is preserved under a .corrupt name for recovery.
func load_game() -> bool:
	for p in [_path(SAVE_PATH), _path(BACKUP_PATH)]:
		if not FileAccess.file_exists(p):
			continue
		var payload := _read_payload(p)
		if payload.is_empty():
			_quarantine(p)
			continue
		GameState.data = migrate(payload)
		GameState.reset_runtime()
		loaded.emit()
		return true
	return false

func _read_payload(p: String) -> Dictionary:
	var f := FileAccess.open(p, FileAccess.READ)
	if f == null:
		return {}
	var text := f.get_as_text()
	f.close()
	var json := JSON.new()
	if json.parse(text) != OK:
		last_error = "Parse error in %s: %s" % [p, json.get_error_message()]
		push_warning(last_error)
		return {}
	var res = json.data
	if typeof(res) != TYPE_DICTIONARY or not res.has("version") or not res.has("data") or typeof(res.data) != TYPE_DICTIONARY:
		last_error = "Invalid save structure in %s" % p
		push_warning(last_error)
		return {}
	if int(res.version) > SAVE_VERSION:
		last_error = "Save from a newer game version"
		push_warning(last_error)
		return {}
	return res

func _quarantine(p: String) -> void:
	var stamp := Time.get_datetime_string_from_system(true).replace(":", "-")
	DirAccess.rename_absolute(p, p + ".corrupt-" + stamp)

## Fills keys missing from older saves with defaults and applies version upgrades.
func migrate(payload: Dictionary) -> Dictionary:
	var d: Dictionary = payload.data
	var version := int(payload.version)
	if version < 2:
		# v1 stored currencies at the top level as "gold".
		if d.has("gold") and not d.has("currencies"):
			d["currencies"] = {"gold": int(d.gold), "crystals": 0, "star_gems": 0}
			d.erase("gold")
	return _deep_merge(GameState.default_data(), d)

func _deep_merge(base: Dictionary, over: Dictionary) -> Dictionary:
	var out := base.duplicate(true)
	for k in over:
		if out.has(k) and typeof(out[k]) == TYPE_DICTIONARY and typeof(over[k]) == TYPE_DICTIONARY:
			# Keyed collections (inventory, creatures...) are replaced wholesale by
			# the save, structured blocks (player, settings) are merged.
			if k in ["inventory", "creatures", "sanctuary", "active"] or out[k].is_empty():
				out[k] = over[k]
			else:
				out[k] = _deep_merge(out[k], over[k])
		else:
			out[k] = over[k]
	return out

func delete_save() -> void:
	for p in [SAVE_PATH, BACKUP_PATH, TMP_PATH]:
		if FileAccess.file_exists(_path(p)):
			DirAccess.remove_absolute(_path(p))

## Writes a timestamped portable backup and returns its absolute path.
func export_backup() -> String:
	var stamp := Time.get_datetime_string_from_system(true).replace(":", "-")
	var p := "user://mythlings_backup_%s.json" % stamp
	var f := FileAccess.open(p, FileAccess.WRITE)
	if f == null:
		return ""
	f.store_string(JSON.stringify({"version": SAVE_VERSION, "data": GameState.data}, "\t"))
	f.close()
	return ProjectSettings.globalize_path(p)
