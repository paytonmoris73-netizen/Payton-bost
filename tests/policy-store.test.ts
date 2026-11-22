import assert from "node:assert/strict";
import type { Purchase, Recipe } from "../src/types";
const mem = new Map<string, string>();
(globalThis as any).localStorage = { getItem: (k: string) => mem.get(k) ?? null, setItem: (k: string, v: string) => void mem.set(k, v), removeItem: (k: string) => void mem.delete(k) };
const { useStore, useOwnedIds } = await import("../src/store");
const S = () => useStore.getState();
let n = 0; const t = async (name: string, f: () => void | Promise<void>) => { await f(); n++; console.log("ok -", name); };
const mkUser = async (name: string, ageDays = 30) => {
  assert.equal(await S().signUp({ name, email: name.toLowerCase() + "@t.com", password: "password1", birthYear: 1990 }), null);
  const id = S().session!; useStore.setState((s) => ({ accounts: s.accounts.map((a) => (a.id === id ? { ...a, createdAt: new Date(Date.now() - ageDays * 86400000).toISOString() } : a)) })); return id;
};
const as = (id: string) => useStore.setState({ session: id });
const recipe = (id: string, by: string, price = 5): Recipe => ({
  id, title: "Recipe " + id, description: "A simple weeknight pasta with garlic and olive oil.", emoji: "🍝", hue: 30, creatorId: by,
  ingredients: [{ name: "pasta", amount: "200 g" }, { name: "garlic", amount: "3 cloves" }],
  steps: [{ text: "Boil the pasta in salted water until al dente." }, { text: "Fry the garlic gently in olive oil and toss with the pasta." }],
  prepMin: 5, cookMin: 15, servings: 2, difficulty: "Easy", cuisine: "Italian", meal: "Dinner", categories: [], diet: [], price, rating: 0, reviews: 0, sales: 0, views: 0,
  nutrition: { calories: 1, protein: 1, carbs: 1, fat: 1, fiber: 1, sugar: 1, sodium: 1 }, allergens: [], equipment: [], substitutions: [], storage: "", status: "published", createdAt: new Date().toISOString(),
});
const order = (id: string, ids: string[], daysAgo = 1): Purchase => ({ id, recipeIds: ids, total: ids.length * 5, at: new Date(Date.now() - daysAgo * 86400000).toISOString(), status: "paid", method: "demo", unitPrices: Object.fromEntries(ids.map((i) => [i, 5])) });
const give = (...ps: Purchase[]) => useStore.setState((s) => ({ purchases: [...ps, ...s.purchases] }));
const status = (id: string) => S().customRecipes.find((r) => r.id === id)?.status;

const admin = await mkUser("Admin"); const seller = await mkUser("Seller"); const buyer = await mkUser("Buyer"); const rep: string[] = []; for (const x of ["RepA", "RepB", "RepC"]) rep.push(await mkUser(x)); const owner2 = await mkUser("Owner2");
useStore.setState((s) => ({ customRecipes: [recipe("scam1", seller), recipe("ok1", seller), recipe("ok2", seller), recipe("ok3", seller), ...s.customRecipes] }));

await t("a confirmed scam report = instant permanent ban, recipe removed, buyers auto-refunded", () => {
  give(order("o_scam", ["scam1", "ok1"]));
  as(rep[0]); assert.equal(S().report("listing", "scam1", "Recipe is empty, pay on cashapp", "scam"), null);
  as(admin); S().actionReport(S().reports.find((r) => r.targetId === "scam1")!.id);
  assert.ok(S().banned.includes(seller), "banned on the FIRST scam");
  assert.equal(status("scam1"), "removed");
  const o = S().purchases.find((p) => p.id === "o_scam")!;
  assert.deepEqual(o.refundedIds, ["scam1"]); assert.equal(o.refund?.state, "auto"); assert.equal(o.refund?.amount, 5); assert.equal(o.status, "paid", "other recipe in the order isn't refunded");
  assert.ok(!useOwnedIds_has("scam1") && useOwnedIds_has("ok1"));
});
function useOwnedIds_has(id: string) { const p = S().purchases; return new Set(p.filter((x) => x.status !== "refunded").flatMap((x) => x.recipeIds.filter((i) => !x.refundedIds?.includes(i)))).has(id); }
await t("a non-scam violation is still a strike, not an instant ban", () => {
  const other = owner2; useStore.setState((s) => ({ customRecipes: [recipe("ill1", other), ...s.customRecipes] }));
  as(rep[0]); S().report("listing", "ill1", "copied from a blog post", "stolen");
  as(admin); S().actionReport(S().reports.find((r) => r.targetId === "ill1" && r.status === "open")!.id);
  assert.ok(!S().banned.includes(other)); assert.equal(S().strikes.filter((k) => k.accountId === other).length, 1);
});
await t("admins can't be banned by a scam report", () => { assert.equal(S().addStrike(admin, "x"), null); });

await t("false report: 1st offence = warning + reporting paused; 2nd = permanent ban", () => {
  as(rep[1]); assert.equal(S().report("listing", "ok2", "this is a scam!!", "scam"), null);
  as(admin); S().markFalseReport(S().reports.find((r) => r.reporterId === rep[1] && r.status === "open")!.id);
  assert.ok(!S().banned.includes(rep[1])); assert.equal(S().strikes.filter((k) => k.accountId === rep[1] && k.kind === "false-report").length, 1);
  as(rep[1]); assert.match(S().report("listing", "ok3", "scam again", "scam")!, /paused/);
  // pause expires; they do it again
  useStore.setState((s) => ({ reporterStats: { ...s.reporterStats, [rep[1]]: { ...s.reporterStats[rep[1]], pausedUntil: new Date(Date.now() - 1000).toISOString() } } }));
  assert.equal(S().report("listing", "ok3", "scam again", "scam"), null);
  as(admin); S().markFalseReport(S().reports.find((r) => r.reporterId === rep[1] && r.status === "open")!.id);
  assert.ok(S().banned.includes(rep[1]), "banned on the 2nd false report");
});
await t("an honest mistake (plain reject) is NOT a false-report offence", () => {
  as(rep[2]); S().report("listing", "ok2", "I think the photo looks off", "misleading");
  as(admin); S().dismissReport(S().reports.find((r) => r.reporterId === rep[2] && r.status === "open")!.id);
  assert.ok(!S().banned.includes(rep[2])); assert.equal(S().strikes.filter((k) => k.accountId === rep[2]).length, 0);
});

// ---------- refunds ----------
as(buyer);
await t("not-covered reasons are refused with the policy message", () => {
  give(order("o1", ["ok1"])); for (const r of ["changed-mind", "taste", "my-mistake", "found-free"] as const) assert.match(S().requestRefund("o1", r, ["ok1"], "whatever whatever whatever")!, /isn't covered/);
});
await t("outside the 7-day window is refused", () => { give(order("o_old", ["ok2"], 9)); assert.match(S().requestRefund("o_old", "misleading", ["ok2"], "does not match the photo at all really")!, /within 7 days/); });
await t("covered reasons need details, then go to review", () => {
  assert.match(S().requestRefund("o1", "misleading", ["ok1"], "short")!, /explain/);
  assert.equal(S().requestRefund("o1", "misleading", ["ok1"], "The photo shows lasagne but the recipe is plain pasta."), null);
  assert.equal(S().purchases.find((p) => p.id === "o1")!.status, "refund_requested");
  assert.match(S().requestRefund("o1", "misleading", ["ok1"], "The photo shows lasagne but the recipe is plain pasta.")!, /already/);
});
await t("moderator approves: only the chosen recipe is refunded and access ends", () => {
  as(admin); S().decideRefund("o1", true, "Photo doesn't match."); const o = S().purchases.find((p) => p.id === "o1")!;
  assert.equal(o.status, "refunded"); assert.deepEqual(o.refundedIds, ["ok1"]); assert.equal(o.refund?.amount, 5); assert.ok(!useOwnedIds_has("ok1") || S().purchases.some((p) => p.id !== "o1" && p.recipeIds.includes("ok1") && p.status !== "refunded"));
});
await t("partial refund keeps the order active for the other recipe", () => {
  as(buyer); give(order("o2", ["ok2", "ok3"])); assert.equal(S().requestRefund("o2", "incomplete", ["ok3"], "The method steps stop halfway through the recipe."), null);
  as(admin); S().decideRefund("o2", true, ""); const o = S().purchases.find((p) => p.id === "o2")!; assert.equal(o.status, "paid"); assert.deepEqual(o.refundedIds, ["ok3"]);
});
await t("declined request goes back to paid with the moderator's note", () => {
  as(buyer); give(order("o3", ["ok2"])); S().requestRefund("o3", "other", ["ok2"], "I just don't think it is worth the price honestly."); as(admin); S().decideRefund("o3", false, "Not covered.");
  const o = S().purchases.find((p) => p.id === "o3")!; assert.equal(o.status, "paid"); assert.equal(o.refund?.state, "denied");
  as(buyer); assert.match(S().requestRefund("o3", "other", ["ok2"], "Please reconsider this one, it was bad really.")!, /already reviewed/);
});
await t("duplicate purchases refund automatically only if a second purchase exists", () => {
  give(order("d1", ["ok3"]), order("d2", ["ok3"]));
  assert.equal(S().requestRefund("d2", "duplicate", ["ok3"], ""), null); assert.equal(S().purchases.find((p) => p.id === "d2")!.refund?.state, "auto");
  give(order("solo", ["ok1x"])); assert.match(S().requestRefund("solo", "duplicate", ["ok1x"], "")!, /second purchase/);
});
await t("'unsafe' refund also files an illness report so moderators can pull the recipe", () => {
  give(order("u1", ["ok2"])); assert.equal(S().requestRefund("u1", "unsafe", ["ok2"], "My family got food poisoning after cooking this."), null);
  assert.ok(S().reports.some((r) => r.targetId === "ok2" && r.category === "illness" && r.status === "open"));
});
await t("after 3 declined requests refunds are paused", () => {
  useStore.setState((s) => ({ purchases: s.purchases.map((p) => (["o_old"].includes(p.id) ? p : p)) }));
  for (const id of ["x1", "x2"]) { give(order(id, ["ok2"])); as(buyer); S().requestRefund(id, "other", ["ok2"], "Not great, would like my money back please."); as(admin); S().decideRefund(id, false, ""); }
  give(order("x3", ["ok2"])); as(buyer); assert.match(S().requestRefund("x3", "other", ["ok2"], "Not great, would like my money back please.")!, /paused/);
});
console.log(`\n${n} passed`);
