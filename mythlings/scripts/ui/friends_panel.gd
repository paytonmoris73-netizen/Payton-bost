class_name FriendsPanel
extends UIPanel
## Friends are designed but not online in this build. The panel says so plainly
## instead of showing fake friends or fake connectivity.

func build_content() -> void:
	setup_frame("Friends", "friends")
	max_size = Vector2(900, 760)
	var v := UIKit.vbox(14)
	v.add_child(UIKit.label("Friends are coming in a future online update.", "Title", 26, Palette.MOSS_DARK, true))
	v.add_child(UIKit.label("This version of Mythlings is fully playable offline and does not connect to any server, so there is no friends list yet. When online features arrive they will include:", "", 20, Color(0, 0, 0, 0), true))
	for t in ["Adding friends by Keeper code (no public chat)", "Visiting friends' sanctuaries", "Viewing each other's Mythling collections", "Sending preset reactions and taking photos together", "Block and report tools, with all actions validated on the server"]:
		var h := UIKit.hbox(8)
		h.add_child(IconGlyph.make("sparkle", 22, Palette.MOSS))
		h.add_child(UIKit.label(t, "", 19, Color(0, 0, 0, 0), true))
		v.add_child(h)
	var code := UIKit.card()
	var ch := UIKit.vbox(4)
	ch.add_child(UIKit.label("Your Keeper code (reserved for later)", "Caption", 17))
	ch.add_child(UIKit.label(_code(), "Heading", 34))
	code.add_child(ch)
	v.add_child(code)
	body.add_child(v)

func _code() -> String:
	if not GameState.data.flags.has("keeper_code"):
		var chars := "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
		var s := ""
		for i in 8:
			s += chars[randi() % chars.length()]
			if i == 3:
				s += "-"
		GameState.data.flags["keeper_code"] = s
	return GameState.data.flags.keeper_code
