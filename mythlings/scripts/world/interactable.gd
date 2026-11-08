class_name Interactable
extends Node3D
## Anything the player can use with the Interact button. The player picks the
## nearest enabled Interactable in range and shows its prompt contextually.

@export var prompt := "Interact"
@export var radius := 2.6
@export var icon := "hand"
var enabled := true

func _ready() -> void:
	add_to_group("interactable")

func get_prompt() -> String:
	return prompt

func can_interact() -> bool:
	return enabled and is_visible_in_tree()

func interact(_player: Node) -> void:
	pass

func focus_point() -> Vector3:
	return global_position + Vector3(0, 1.0, 0)
