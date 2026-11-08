class_name LocationTrigger
extends Area3D
## Marks a named place as visited when the player walks in, and announces it.

signal entered(location_id: String)

var location_id := ""
var display_name := ""

func setup(id: String, name_text: String, radius: float) -> void:
	location_id = id
	display_name = name_text
	var cs := CollisionShape3D.new()
	var s := SphereShape3D.new()
	s.radius = radius
	cs.shape = s
	add_child(cs)
	collision_layer = 0
	collision_mask = 2
	monitoring = true
	body_entered.connect(_on_body)

func _on_body(body: Node) -> void:
	if not body.is_in_group("player"):
		return
	var first := GameState.visit(location_id)
	entered.emit(location_id)
	Events.request_panel.emit("location_banner", {"name": display_name, "first": first})
