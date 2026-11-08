extends Node
## Grand Market purchase logic. All prices are exact; nothing is randomised.
## Real-money products go through `BillingProvider`. In this build only the
## MockBillingProvider exists: it never charges anything and labels every
## transaction as a test. A release build must register a platform provider
## (Google Play Billing / StoreKit) or real-money products report unavailable.

signal purchase_finished(product_id: String, ok: bool, message: String)

var billing: Object = null  # provider with purchase(product: ShopItemData, cb: Callable)

func _ready() -> void:
	if OS.is_debug_build() or OS.has_feature("editor"):
		billing = MockBilling.new()

class MockBilling:
	var simulate_failure := false
	func provider_name() -> String:
		return "Test billing (no real money)"
	func purchase(_product: ShopItemData, cb: Callable) -> void:
		# Mimics an asynchronous store sheet; result is reported honestly.
		var tree := Engine.get_main_loop() as SceneTree
		await tree.create_timer(0.8).timeout
		if simulate_failure:
			cb.call(false, "The test store declined the purchase (simulated failure).")
		else:
			cb.call(true, "Test purchase approved. No money was charged.")

func real_money_available() -> bool:
	return billing != null

## Returns "" if purchasable, otherwise a human-readable reason.
func block_reason(p: ShopItemData) -> String:
	if p == null:
		return "Unknown product."
	if not p.available:
		return p.unavailable_reason if p.unavailable_reason != "" else "Not available right now."
	if not p.stackable and GameState.owns(p.id):
		return "Already owned."
	if GameState.level() < p.min_level:
		return "Requires Keeper level %d." % p.min_level
	if p.requires_owned != "" and not (GameState.is_discovered(p.requires_owned) or GameState.owns(p.requires_owned)):
		var c: CreatureData = DB.creature(p.requires_owned)
		return "Befriend %s first." % (c.display_name if c else p.requires_owned)
	if p.currency == "none":
		return p.earn_path if p.earn_path != "" else "Earned through gameplay."
	if p.currency == "real_money":
		return "" if real_money_available() else "Purchases are not available in this build."
	if not GameState.can_afford(p.currency, p.price):
		return "Not enough %s." % currency_name(p.currency)
	return ""

func currency_name(c: String) -> String:
	return {"gold": "Gold", "crystals": "Crystals", "star_gems": "Star Gems", "real_money": "", "none": ""}.get(c, c)

func price_label(p: ShopItemData) -> String:
	match p.currency:
		"none": return "Earn in game"
		"real_money": return p.real_price_label + (" (test)" if billing is MockBilling else "")
	return "%d %s" % [p.price, currency_name(p.currency)]

## Called only after the player confirmed in the UI.
func purchase(product_id: String) -> void:
	var p: ShopItemData = DB.product(product_id)
	var reason := block_reason(p)
	if reason != "":
		_log(p, false, reason)
		purchase_finished.emit(product_id, false, reason)
		return
	if p.currency == "real_money":
		billing.purchase(p, func(ok: bool, msg: String):
			if ok:
				_grant(p)
			_log(p, ok, msg)
			purchase_finished.emit(product_id, ok, msg))
		return
	if not GameState.spend_currency(p.currency, p.price):
		_log(p, false, "Insufficient funds")
		purchase_finished.emit(product_id, false, "Not enough %s." % currency_name(p.currency))
		return
	_grant(p)
	_log(p, true, "Purchased")
	purchase_finished.emit(product_id, true, "%s is yours!" % p.display_name)

func _grant(p: ShopItemData) -> void:
	var g := p.grants
	for k in ["gold", "crystals", "star_gems"]:
		if g.has(k):
			GameState.add_currency(k, int(g[k]))
	if g.has("items"):
		for id in g.items:
			GameState.add_item(id, int(g.items[id]), false)
	if not p.stackable:
		GameState.grant_ownership(p.id)
	Events.emit_game_event("purchase", p.id)
	Audio.play_sfx("purchase")
	SaveManager.save_game()

func _log(p: ShopItemData, ok: bool, msg: String) -> void:
	GameState.data.transactions.push_front({
		"time": Time.get_datetime_string_from_system(false, true),
		"product": p.id if p else "?",
		"name": p.display_name if p else "?",
		"price": price_label(p) if p else "",
		"ok": ok,
		"note": msg,
		"test": p != null and p.currency == "real_money" and billing is MockBilling,
	})
	if GameState.data.transactions.size() > 100:
		GameState.data.transactions.resize(100)

## Ownership for cosmetic/clothing lookups.
func owns_cosmetic(cosmetic_id: String) -> bool:
	for p in DB.shop.values():
		if p.grants.get("cosmetic", "") == cosmetic_id and GameState.owns(p.id):
			return true
	return false
