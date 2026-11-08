extends CanvasLayer
## Fades between top-level scenes and shows a themed loading card.

var _fade: ColorRect
var _label: Label
var _busy := false

const TIPS := [
	"Approach shy Mythlings slowly — running startles them.",
	"Your companion's ability can reveal secrets nobody else can see.",
	"Every sanctuary you restore changes the land around it.",
	"Favourite treats build friendship faster.",
	"Rest at a sanctuary to watch your Mythlings live their lives.",
]

func _ready() -> void:
	layer = 100
	process_mode = Node.PROCESS_MODE_ALWAYS
	_fade = ColorRect.new()
	_fade.color = Palette.NIGHT
	_fade.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	_fade.mouse_filter = Control.MOUSE_FILTER_IGNORE
	_fade.modulate.a = 0.0
	add_child(_fade)
	_label = Label.new()
	_label.set_anchors_preset(Control.PRESET_CENTER_BOTTOM)
	_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	_label.position = Vector2(-400, -120)
	_label.size = Vector2(800, 60)
	_label.add_theme_color_override("font_color", Palette.PARCHMENT)
	_label.add_theme_font_size_override("font_size", 22)
	_label.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	_fade.add_child(_label)
	_dev_shots()

## Dev automation: --shot=/path.png [--shot-delay=6] saves a screenshot then quits.
## Multiple shots: --shots=/dir --shot-every=4 --shot-count=3
func _dev_shots() -> void:
	var args := OS.get_cmdline_user_args()
	var shot := ""
	var delay := 6.0
	for a in args:
		if a.begins_with("--shot="):
			shot = a.trim_prefix("--shot=")
		elif a.begins_with("--shot-delay="):
			delay = float(a.trim_prefix("--shot-delay="))
	if shot == "":
		return
	await get_tree().create_timer(delay).timeout
	get_viewport().get_texture().get_image().save_png(shot)
	print("[shot] saved ", shot)
	get_tree().quit()

func go(path: String) -> void:
	if _busy:
		return
	_busy = true
	_fade.mouse_filter = Control.MOUSE_FILTER_STOP
	_label.text = TIPS[randi() % TIPS.size()]
	var tw := create_tween()
	tw.tween_property(_fade, "modulate:a", 1.0, 0.35)
	await tw.finished
	await get_tree().process_frame
	get_tree().paused = false
	var err := get_tree().change_scene_to_file(path)
	if err != OK:
		push_error("Scene change failed: %s" % path)
	await get_tree().process_frame
	await get_tree().process_frame
	var tw2 := create_tween()
	tw2.tween_property(_fade, "modulate:a", 0.0, 0.5)
	await tw2.finished
	_fade.mouse_filter = Control.MOUSE_FILTER_IGNORE
	_busy = false
