import assert from "node:assert/strict";
import type { Recipe } from "../src/types";
const mem = new Map<string, string>();
(globalThis as any).localStorage = { getItem: (k: string) => mem.get(k) ?? null, setItem: (k: string, v: string) => void mem.set(k, v), removeItem: (k: string) => void mem.delete(k) };
const { useStore } = await import("../src/store");

const S = () => useStore.getState();
let n = 0; const t = async (name: string, f: () => void | Promise<void>) => { await f(); n++; console.log("ok -", name); };
const mkUser = async (name: string, ageDays = 30) => {
  const err = await S().signUp({ name, email: name.toLowerCase() + "@t.com", password: "password1", birthYear: 1990 }); assert.equal(err, null);
  const id = S().session!; useStore.setState((s) => ({ accounts: s.accounts.map((a) => (a.id === id ? { ...a, createdAt: new Date(Date.now() - ageDays * 86400000).toISOString() } : a)) })); return id;
};
const as = (id: string) => useStore.setState({ session: id });
const recipe = (id: string, by: string, o: Partial<Recipe> = {}): Recipe => ({
  id, title: "Garlic pasta", description: "A simple weeknight pasta with garlic and olive oil.", emoji: "🍝", hue: 30, creatorId: by,
  ingredients: [{ name: "pasta", amount: "200 g" }, { name: "garlic", amount: "3 cloves" }],
  steps: [{ text: "Boil the pasta in salted water until al dente." }, { text: "Fry the garlic gently in olive oil and toss with the pasta." }],
  prepMin: 5, cookMin: 15, servings: 2, difficulty: "Easy", cuisine: "Italian", meal: "Dinner", categories: [], diet: [], price: 0, rating: 0, reviews: 0, sales: 0, views: 0,
  nutrition: { calories: 1, protein: 1, carbs: 1, fat: 1, fiber: 1, sugar: 1, sodium: 1 }, allergens: [], equipment: [], substitutions: [], storage: "", status: "published", createdAt: new Date().toISOString(), ...o,
});
const status = (id: string) => S().customRecipes.find((r) => r.id === id)?.status;

const admin = await mkUser("Admin");
const scammer = await mkUser("Scammer", 0);       // brand new
const vet = await mkUser("Vet", 60);
const reporters = await Promise.all(["R1", "R2", "R3", "R4"].map((x) => mkUser(x, 30)));
const fresh = await Promise.all(["N1", "N2", "N3", "N4", "N5"].map((x) => mkUser(x, 0)));

await t("dangerous recipe is refused and not published", () => {
  as(vet); const out = S().upsertRecipe(recipe("bad1", vet, { ingredients: [{ name: "bleach", amount: "1 cup" }, { name: "rice", amount: "1 cup" }] }));
  assert.equal(out.result, "blocked"); assert.notEqual(status("bad1"), "published");
});
await t("3 blocked attempts earn an automatic strike", () => {
  as(vet); for (let i = 0; i < 2; i++) S().upsertRecipe(recipe("bad1", vet, { ingredients: [{ name: "bleach", amount: "1 cup" }] }));
  assert.equal(S().strikes.filter((k) => k.accountId === vet).length, 1);
});
await t("a trusted-looking recipe from a brand-new account waits for review", () => {
  as(scammer); const out = S().upsertRecipe(recipe("new1", scammer)); assert.equal(out.result, "review"); assert.equal(status("new1"), "review"); assert.ok(S().holds["new1"]);
});
await t("scam wording is held even for an old account (after strike, everything is held)", () => {
  as(reporters[0]); const out = S().upsertRecipe(recipe("sc1", reporters[0], { description: "Secret recipe! DM me on whatsapp, pay by cashapp, guaranteed results!" }));
  assert.equal(out.result, "review"); assert.ok(S().holds["sc1"].flags.length >= 2);
});
await t("a suspended/banned user can't publish", () => {
  useStore.setState((s) => ({ suspensions: { ...s.suspensions, [reporters[3]]: new Date(Date.now() + 86400000).toISOString() } }));
  as(reporters[3]); assert.equal(S().upsertRecipe(recipe("susp", reporters[3])).result, "blocked");
  assert.equal(S().addPost({ text: "hello world", emoji: "🍽️", hue: 1, ingredients: [] }).result, "blocked");
});

// a legit published recipe from a veteran, to attack with reports
as(reporters[1]); useStore.setState((s) => ({ customRecipes: [recipe("good1", reporters[1]), ...s.customRecipes] }));

await t("can't report your own content or report twice", () => {
  as(reporters[1]); assert.match(S().report("listing", "good1", "mine mine mine", "spam")!, /own/);
  as(reporters[0]); assert.equal(S().report("listing", "good1", "looks wrong to me", "misleading"), null);
  assert.match(S().report("listing", "good1", "looks wrong to me", "misleading")!, /already/);
});
await t("a pile-on of brand-new accounts does NOT hide a legit recipe", () => {
  for (const f of fresh) { as(f); S().report("listing", "good1", "this is a scam", "scam"); }
  assert.equal(status("good1"), "published"); assert.ok(S().reports.filter((r) => r.targetId === "good1").some((r) => r.suspicious));
});
await t("admin rejects the attack: attackers' records drop, recipe stays up", () => {
  as(admin); for (const r of S().reports.filter((x) => x.targetId === "good1" && x.status === "open")) S().dismissReport(r.id);
  assert.equal(status("good1"), "published"); assert.equal(S().strikes.filter((k) => k.accountId === reporters[1]).length, 0);
  assert.equal(S().reporterStats[fresh[0]].dismissed, 1);
});
await t("serial false reporter gets paused", () => {
  const liar = fresh[1]; useStore.setState((s) => ({ reporterStats: { ...s.reporterStats, [liar]: { upheld: 0, dismissed: 4 } } }));
  as(liar); S().report("post", S().posts[0].id, "bad post here", "spam"); as(admin); S().dismissReport(S().reports[0].id);
  as(liar); assert.match(S().report("post", S().posts[1].id, "another bad one", "spam")!, /paused/);
});
await t("3 independent trusted reporters hide a harmful recipe pending review (not deleted)", () => {
  as(vet); useStore.setState((s) => ({ customRecipes: [recipe("harm1", vet), ...s.customRecipes] }));
  useStore.setState((s) => ({ suspensions: {}, strikes: [] }));
  for (const r of [reporters[0], reporters[2], reporters[3]]) { as(r); assert.equal(S().report("listing", "harm1", "this made me sick", "unsafe"), null); }
  assert.equal(status("harm1"), "review"); assert.equal(S().holds["harm1"].reason, "reports");
});
await t("admin upholds: removed, owner struck, reporters credited, wall updated", () => {
  as(admin); S().actionReport(S().reports.find((r) => r.targetId === "harm1" && r.status === "open")!.id);
  assert.equal(status("harm1"), "removed"); assert.equal(S().strikes.filter((k) => k.accountId === vet).length, 1);
  assert.ok(S().reporterStats[reporters[0]].upheld >= 1); assert.ok(S().removals.length >= 1);
  assert.ok(S().reports.filter((r) => r.targetId === "harm1").every((r) => r.status === "actioned"));
});
await t("ladder: 2nd strike suspends 7 days, 3rd bans", () => {
  S().addStrike(vet, "again"); assert.ok(new Date(S().suspensions[vet]).getTime() > Date.now() + 6 * 86400000);
  S().addStrike(vet, "again again"); assert.ok(S().banned.includes(vet));
  assert.equal(S().addStrike(admin, "x"), null, "admins can't be struck");
});
await t("appeal wins: recipe restored, strike revoked, suspension/ban lifted", async () => {
  as(vet); useStore.setState({ banned: [] }); // (a banned user can't log in; model the suspended state)
  assert.equal(S().appeal("harm1", "short"), "Explain what happened in at least 20 characters.");
  assert.equal(S().appeal("harm1", "I cooked this a hundred times, it is a normal pasta recipe."), null);
  as(admin); S().decideAppeal(S().appeals[0].id, true);
  assert.equal(status("harm1"), "published");
  assert.equal(S().strikes.filter((k) => k.accountId === vet && !k.revoked).length, 2, "3 strikes minus the revoked one");
  assert.ok(!S().banned.includes(vet), "ban lifted now that active strikes < 3");
  assert.ok(S().suspensions[vet], "still suspended: 2 active strikes remain");
});
await t("approving a held recipe publishes it", () => {
  as(admin); S().approveHold("new1"); assert.equal(status("new1"), "published"); assert.equal(S().holds["new1"], undefined);
});
await t("posts: dangerous blocked, scammy held, normal posted", () => {
  as(reporters[0]); const p = (text: string) => S().addPost({ text, emoji: "🍽️", hue: 1, ingredients: [] });
  assert.equal(p("Try my bleach and rice dinner").result, "blocked");
  assert.equal(p("Message me on telegram for the secret recipe").result, "review");
  assert.equal(p("Made a lovely tomato soup tonight").result, "posted");
});
await t("inappropriate photo: severe report hides it, upheld = instant permanent ban (no strike ladder)", async () => {
  const poster = await mkUser("PhotoPoster", 60);
  as(poster); useStore.setState((s) => ({ customRecipes: [recipe("pic1", poster, { photo: "data:image/png;base64,x" }), ...s.customRecipes] }));
  for (const r of [reporters[0], reporters[2]]) { as(r); assert.equal(S().report("listing", "pic1", "nude photo on this recipe", "inappropriate"), null); }
  assert.equal(status("pic1"), "review", "two credible reports hide it (severe threshold)");
  as(admin); S().actionReport(S().reports.find((r) => r.targetId === "pic1" && r.status === "open")!.id);
  assert.equal(status("pic1"), "removed"); assert.ok(S().banned.includes(poster), "banned on the first confirmed offence");
});
console.log(`\n${n} passed`);
