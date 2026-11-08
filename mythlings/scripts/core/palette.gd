class_name Palette
## Central colour language for UI and world. Keep UI colours here, not scattered.

const INK := Color("1d2a24")
const INK_SOFT := Color("3c4d44")
const PARCHMENT := Color("f6efdf")
const PARCHMENT_DEEP := Color("eadfc6")
const CARD := Color("fffaf0")
const MOSS := Color("4f8a5b")
const MOSS_DARK := Color("2f5a3c")
const MOSS_LIGHT := Color("9fd08f")
const GOLD := Color("e8b64c")
const GOLD_DARK := Color("a8771f")
const TEAL := Color("2f7d86")
const NIGHT := Color("13201b")
const NIGHT_SOFT := Color("1f3029")
const CRYSTAL := Color("7cc6e8")
const STARGEM := Color("b98cf0")
const DANGER := Color("c4583f")
const WHITE := Color("ffffff")

const RARITY := {
	"common": Color("8a9a8e"),
	"uncommon": Color("5aa469"),
	"rare": Color("3f8fcf"),
	"epic": Color("9a62d6"),
	"legendary": Color("e2a33a"),
	"mythic": Color("e0578a"),
}

const ELEMENT := {
	"nature": Color("5fae5b"),
	"fire": Color("e4693a"),
	"water": Color("3d9bd6"),
	"ice": Color("8fd3ec"),
	"earth": Color("a6814f"),
	"celestial": Color("8b74e6"),
}


static func rarity_color(r: String) -> Color:
	return RARITY.get(r, RARITY["common"])

static func element_color(e: String) -> Color:
	return ELEMENT.get(e, Color.GRAY)
