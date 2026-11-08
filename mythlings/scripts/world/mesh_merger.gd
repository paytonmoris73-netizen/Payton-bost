class_name MeshMerger
extends RefCounted
## Collects primitive meshes with transforms + vertex colours into a single
## ArrayMesh so a whole house or tree is one draw call. Use with MeshKit.vcol().

var _st := SurfaceTool.new()
var _has := false

func _init() -> void:
	_st.begin(Mesh.PRIMITIVE_TRIANGLES)

func add(mesh: Mesh, xf: Transform3D, color: Color, sway := 0.0) -> void:
	if mesh == null:
		return
	for arr in _arrays(mesh):
		var verts: PackedVector3Array = arr[Mesh.ARRAY_VERTEX]
		var norms: PackedVector3Array = arr[Mesh.ARRAY_NORMAL]
		var idx: PackedInt32Array = arr[Mesh.ARRAY_INDEX] if arr[Mesh.ARRAY_INDEX] != null else PackedInt32Array()
		var nb := xf.basis.inverse().transposed()
		var c := Color(color.r, color.g, color.b, sway)
		if idx.size() > 0:
			for i in idx:
				_st.set_color(c)
				_st.set_normal((nb * norms[i]).normalized())
				_st.add_vertex(xf * verts[i])
		else:
			for i in verts.size():
				_st.set_color(c)
				_st.set_normal((nb * norms[i]).normalized())
				_st.add_vertex(xf * verts[i])
		_has = true

## Reads vertex data on the CPU side (works headless and avoids GPU readback).
static func _arrays(mesh: Mesh) -> Array:
	if mesh is PrimitiveMesh:
		return [(mesh as PrimitiveMesh).get_mesh_arrays()]
	if mesh.has_meta("arrays"):
		return [mesh.get_meta("arrays")]
	var out: Array = []
	for s in mesh.get_surface_count():
		out.append(mesh.surface_get_arrays(s))
	return out

## Convenience: position / euler degrees / scale.
func put(mesh: Mesh, pos: Vector3, color: Color, rot := Vector3.ZERO, scl := Vector3.ONE, sway := 0.0) -> void:
	var b := Basis.from_euler(rot * (PI / 180.0)) * Basis.from_scale(scl)
	add(mesh, Transform3D(b, pos), color, sway)

func is_empty() -> bool:
	return not _has

func commit() -> ArrayMesh:
	var m := _st.commit()
	m.set_meta("arrays", _st.commit_to_arrays())
	return m
