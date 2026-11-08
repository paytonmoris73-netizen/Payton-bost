class_name Butterfly
extends Node3D
## A small flapping butterfly that drifts around an anchor point.

const K := preload("res://scripts/core/mesh_kit.gd")
var anchor := Vector3.ZERO
var _wings: Array = []
var _t := 0.0
var _seed := 0.0
var _color := Color.WHITE

func setup(at: Vector3, c: Color) -> void:
	anchor = at
	_color = c
	_seed = randf() * 100.0
	position = at
	K.add(self, K.capsule(0.012, 0.09), K.mat(Color("2a2420")), Vector3.ZERO, Vector3(90, 0, 0))
	for sx in [-1, 1]:
		var w := K.pivot(self, Vector3.ZERO)
		K.add(w, K.petal(0.11, 0.11, 0.0, 0.004), K.mat(c, 0.6, c, 0.25), Vector3(0, 0, -0.01), Vector3(0, 0, -90 * sx))
		K.add(w, K.petal(0.07, 0.07, 0.0, 0.004), K.mat(c.darkened(0.15), 0.6), Vector3(0, 0, 0.03), Vector3(0, 0, -120 * sx))
		_wings.append(w)

func _process(delta: float) -> void:
	_t += delta
	var flap := sin(_t * 18.0 + _seed) * 65.0
	_wings[0].rotation_degrees.z = flap
	_wings[1].rotation_degrees.z = -flap
	var tt := _t * 0.45 + _seed
	var p := anchor + Vector3(sin(tt) * 3.2 + sin(tt * 2.3) * 1.2, 0.9 + sin(tt * 3.1) * 0.4 + sin(_t * 7.0) * 0.06, cos(tt * 0.8) * 3.0)
	var dir := p - position
	position = p
	if dir.length() > 0.001:
		rotation.y = atan2(-dir.x, -dir.z)
