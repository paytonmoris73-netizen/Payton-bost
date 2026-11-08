class_name ClimbArea
extends Area3D
## Vines / ladders the player can climb by pushing toward them.

var face_normal := Vector3.BACK  # direction pointing away from the wall

func setup(size: Vector3, normal: Vector3) -> void:
	face_normal = normal.normalized()
	var cs := CollisionShape3D.new()
	var b := BoxShape3D.new()
	b.size = size
	cs.shape = b
	add_child(cs)
	collision_layer = 0
	collision_mask = 2
	add_to_group("climbable")
	body_entered.connect(_on_enter)
	body_exited.connect(_on_exit)

func _on_enter(b2: Node) -> void:
	if b2.has_method("set_climb"):
		b2.set_climb(self)

func _on_exit(b2: Node) -> void:
	if b2.has_method("clear_climb"):
		b2.clear_climb(self)
