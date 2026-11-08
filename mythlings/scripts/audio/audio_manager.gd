extends Node
## Music crossfades, ambience and pooled UI/gameplay SFX on dedicated buses.

const POOL_SIZE := 10
var _pool: Array[AudioStreamPlayer] = []
var _music_a: AudioStreamPlayer
var _music_b: AudioStreamPlayer
var _ambience: AudioStreamPlayer
var _current_music := ""
var _cache: Dictionary = {}

func _ready() -> void:
	process_mode = Node.PROCESS_MODE_ALWAYS
	for bus in ["Music", "SFX", "Ambience"]:
		if AudioServer.get_bus_index(bus) == -1:
			AudioServer.add_bus()
			var idx := AudioServer.bus_count - 1
			AudioServer.set_bus_name(idx, bus)
			AudioServer.set_bus_send(idx, "Master")
	for i in POOL_SIZE:
		var p := AudioStreamPlayer.new()
		p.bus = "SFX"
		add_child(p)
		_pool.append(p)
	_music_a = _make_player("Music")
	_music_b = _make_player("Music")
	_ambience = _make_player("Ambience")
	Events.settings_changed.connect(apply_volumes)
	apply_volumes()

func _make_player(bus: String) -> AudioStreamPlayer:
	var p := AudioStreamPlayer.new()
	p.bus = bus
	add_child(p)
	return p

func _linear_db(v: float) -> float:
	return linear_to_db(max(v, 0.0001))

func apply_volumes() -> void:
	var muted: bool = GameState.setting("muted")
	AudioServer.set_bus_mute(0, muted)
	AudioServer.set_bus_volume_db(0, _linear_db(float(GameState.setting("master"))))
	AudioServer.set_bus_volume_db(AudioServer.get_bus_index("Music"), _linear_db(float(GameState.setting("music"))))
	AudioServer.set_bus_volume_db(AudioServer.get_bus_index("SFX"), _linear_db(float(GameState.setting("sfx"))))
	AudioServer.set_bus_volume_db(AudioServer.get_bus_index("Ambience"), _linear_db(float(GameState.setting("sfx")) * 0.8))

func get_stream(name: String, looped := false) -> AudioStream:
	var key := name + ("#loop" if looped else "")
	if _cache.has(key):
		return _cache[key]
	var path := "res://assets/audio/%s.wav" % name
	if not ResourceLoader.exists(path):
		push_warning("Missing audio: " + path)
		return null
	var s: AudioStream = load(path)
	if looped and s is AudioStreamWAV:
		s = s.duplicate()
		s.loop_mode = AudioStreamWAV.LOOP_FORWARD
		s.loop_begin = 0
		s.loop_end = s.data.size() / 2
	_cache[key] = s
	return s

func play_sfx(name: String, pitch: float = 1.0, volume_db: float = 0.0) -> void:
	var s := get_stream(name)
	if s == null:
		return
	for p in _pool:
		if not p.playing:
			p.stream = s
			p.pitch_scale = pitch
			p.volume_db = volume_db
			p.play()
			return
	_pool[0].stop()
	_pool[0].stream = s
	_pool[0].play()

func play_music(name: String, fade := 1.5) -> void:
	if name == _current_music:
		return
	_current_music = name
	var incoming := _music_b if _music_a.playing else _music_a
	var outgoing := _music_a if incoming == _music_b else _music_b
	incoming.stream = get_stream(name, true)
	incoming.volume_db = -40
	incoming.play()
	var tw := create_tween().set_parallel(true)
	tw.tween_property(incoming, "volume_db", 0.0, fade)
	tw.tween_property(outgoing, "volume_db", -40.0, fade)
	tw.chain().tween_callback(outgoing.stop)

func play_ambience(name: String) -> void:
	if name == "":
		_ambience.stop()
		return
	_ambience.stream = get_stream(name, true)
	_ambience.volume_db = -6
	_ambience.play()
