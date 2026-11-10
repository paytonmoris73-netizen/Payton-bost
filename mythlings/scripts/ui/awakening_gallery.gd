class_name AwakeningGalleryPanel
extends UIPanel
## Evolution gallery: every family drawn as a connected tree (First Form on the
## left, later forms to the right, alternate paths as branches). Undiscovered
## forms show as silhouettes. Totals at the top.

var totals_label: Label
var trees: Array = []
var _list: VBoxContainer

func build_content() -> void:
	setup_frame("Awakenings Gallery", "evolve")
	totals_label = UIKit.label("", "Title", 20, Palette.MOSS_DARK)
	totals_label.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	body.add_child(totals_label)
	_list = UIKit.vbox(14)
	var sc := UIKit.scroll(_list)
	sc.size_flags_vertical = Control.SIZE_EXPAND_FILL
	body.add_child(sc)

func refresh() -> void:
	var t: Dictionary = Evolution.gallery_totals()
	totals_label.text = "Forms discovered %d / %d  ·  Families completed %d / %d  ·  Colossal forms %d  ·  Alternate forms unlocked %d" % [t.forms, t.total, t.families, t.family_total, t.colossal, t.alternate]
	UIKit.clear(_list)
	trees.clear()
	var fams: Array = []
	for c in DB.creatures.values():
		if c.family != "" and not (c.family in fams) and Evolution.family_forms(c.family).size() > 1:
			fams.append(c.family)
	fams.sort_custom(func(a, b): return _fam_known(a) > _fam_known(b) or (_fam_known(a) == _fam_known(b) and a < b))
	for f in fams:
		var card := UIKit.card()
		var v := UIKit.vbox(6)
		var base: CreatureData = DB.creature(f)
		var forms: Array = Evolution.family_forms(f)
		var have := forms.filter(func(c): return GameState.is_discovered(c.id)).size()
		var h := UIKit.hbox(8)
		var title := UIKit.label("%s family" % (base.display_name if base and GameState.is_discovered(f) else "Unknown"), "Title", 20)
		title.size_flags_horizontal = Control.SIZE_EXPAND_FILL
		h.add_child(title)
		h.add_child(UIKit.pill("%d / %d forms" % [have, forms.size()], Palette.MOSS if have == forms.size() else Palette.TEAL))
		v.add_child(h)
		var tree := FamilyTree.new()
		tree.build(forms)
		v.add_child(tree)
		trees.append(tree)
		card.add_child(v)
		_list.add_child(card)

func _fam_known(f: String) -> int:
	return Evolution.family_forms(f).filter(func(c): return GameState.is_discovered(c.id)).size()

class FamilyTree extends Control:
	const NODE := Vector2(150, 150)
	const GAP := Vector2(70, 14)
	var nodes := {}  # id -> Control
	var edges: Array = []  # [from, to, branch]

	func build(forms: Array) -> void:
		var by_stage := {}
		for c in forms:
			var s: int = 3 if c.is_colossal() and c.stage < 3 else c.stage
			if not by_stage.has(s):
				by_stage[s] = []
			by_stage[s].append(c)
		var stages: Array = by_stage.keys()
		stages.sort()
		var rows := 1
		for s in stages:
			rows = maxi(rows, by_stage[s].size())
		custom_minimum_size = Vector2(stages.size() * (NODE.x + GAP.x), rows * (NODE.y + GAP.y))
		for col in stages.size():
			var list: Array = by_stage[stages[col]]
			for row in list.size():
				var c: CreatureData = list[row]
				var disc := GameState.is_discovered(c.id)
				var box := UIKit.vbox(2)
				box.position = Vector2(col * (NODE.x + GAP.x), row * (NODE.y + GAP.y) + (rows - list.size()) * (NODE.y + GAP.y) * 0.5)
				box.size = NODE
				var p := CreaturePortrait.new()
				p.setup(c, disc)
				p.custom_minimum_size = Vector2(NODE.x, NODE.y - 44)
				box.add_child(p)
				var l := UIKit.label(c.display_name if disc else "???", "", 15)
				l.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
				box.add_child(l)
				var s := UIKit.label(Evolution.stage_name(c), "Caption", 13)
				s.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
				box.add_child(s)
				add_child(box)
				nodes[c.id] = box
		for c in forms:
			for e in c.evolutions:
				if nodes.has(e.to):
					edges.append([c.id, e.to, String(e.get("branch", ""))])
		queue_redraw()

	func _draw() -> void:
		for e in edges:
			var a: Control = nodes[e[0]]
			var b: Control = nodes[e[1]]
			var p0 := a.position + Vector2(NODE.x, NODE.y * 0.38)
			var p1 := b.position + Vector2(0, NODE.y * 0.38)
			var known := GameState.is_discovered(e[1])
			var col := Palette.MOSS if known else Color(0.5, 0.55, 0.5, 0.6)
			var mid := Vector2((p0.x + p1.x) * 0.5, 0)
			var pts := PackedVector2Array()
			for i in 13:
				var t := i / 12.0
				var q0 := p0.lerp(Vector2(mid.x, p0.y), t)
				var q1 := Vector2(mid.x, p1.y).lerp(p1, t)
				pts.append(q0.lerp(q1, t))
			draw_polyline(pts, col, 4.0, true)
			if e[2] != "":
				var font := get_theme_default_font()
				draw_string(font, (p0 + p1) * 0.5 + Vector2(-34, -6), e[2], HORIZONTAL_ALIGNMENT_LEFT, -1, 12, Palette.INK_SOFT)
