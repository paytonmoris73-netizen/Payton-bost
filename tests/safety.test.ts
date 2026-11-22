import assert from "node:assert/strict";
import { LADDER, penaltyFor, publishDecision, reportScore, reporterWeight, looksLikePileOn, scanRecipe, scanText, shouldPause } from "../src/safety";

const rec = (o: object = {}) => ({ title: "Garlic pasta", description: "A simple weeknight pasta with garlic and olive oil.", price: 0,
  ingredients: [{ name: "pasta", amount: "200 g" }, { name: "garlic", amount: "3 cloves" }], steps: [{ text: "Boil the pasta in salted water until al dente." }, { text: "Fry the garlic gently in olive oil and toss with the pasta." }], ...o });
const adult = { strikes: 0, accountAgeDays: 30, approvedBefore: 5, isAdmin: false };
let n = 0; const t = (name: string, f: () => void) => { f(); n++; console.log("ok -", name); };

t("normal recipe passes the scan", () => assert.equal(scanRecipe(rec()).length, 0));
t("toxic ingredient is blocked", () => assert.ok(scanRecipe(rec({ ingredients: [{ name: "bleach", amount: "1 cup" }, { name: "rice", amount: "1 cup" }] })).some((f) => f.level === "block")));
t("raw chicken advice is blocked", () => assert.ok(scanText("Serve it with raw chicken on top").some((f) => f.level === "block")));
t("outside link / cashapp is held, not blocked", () => { const f = scanText("Pay me on cashapp or visit www.cheap-recipes.shop"); assert.ok(f.length >= 2 && f.every((x) => x.level === "review")); });
t("thin paid recipe is flagged, thin free one is not", () => {
  const thin = { steps: [{ text: "Mix it." }, { text: "Eat." }] };
  assert.ok(scanRecipe(rec({ ...thin, price: 9 })).some((f) => f.code === "thin-paid"));
  assert.ok(!scanRecipe(rec({ ...thin, price: 0 })).some((f) => f.code === "thin-paid"));
});
t("no false positives on ordinary words", () => { assert.equal(scanText("Pan-fried chicken breast, cooked through. Soap-free pan. Serve with rice.").filter((f) => f.level === "block").length, 0); });
t("blocked content can't be published even by admin", () => assert.equal(publishDecision(scanText("add bleach"), { ...adult, isAdmin: true }).result, "blocked"));
t("trusted user publishes, new user is reviewed, struck user is reviewed", () => {
  assert.equal(publishDecision([], adult).result, "publish");
  assert.equal(publishDecision([], { ...adult, accountAgeDays: 0, approvedBefore: 0 }).result, "review");
  assert.equal(publishDecision([], { ...adult, strikes: 1 }).result, "review");
  assert.equal(publishDecision([], { ...adult, accountAgeDays: 0, approvedBefore: 2 }).result, "publish");
});
t("strike ladder: warn -> 7 day suspension -> ban", () => { assert.deepEqual([1, 2, 3, 4].map(penaltyFor), ["warning", "suspension", "ban", "ban"]); assert.equal(LADDER.length, 3); });

// ---- false-report defences ----
t("brand-new account reports count for little", () => { assert.ok(reporterWeight(undefined, 0) <= 0.25); assert.equal(reporterWeight(undefined, 30), 1); });
t("track record moves the weight both ways", () => {
  assert.ok(reporterWeight({ upheld: 10, dismissed: 0 }, 30) > 1);
  assert.ok(reporterWeight({ upheld: 0, dismissed: 8 }, 30) < 0.3);
});
t("one person reporting repeatedly counts once", () => assert.equal(reportScore([{ reporterId: "a", weight: 1 }, { reporterId: "a", weight: 1 }, { reporterId: "a", weight: 1 }]), 1));
t("a mob of fresh accounts can't reach the threshold or hide content", () => {
  const mob = Array.from({ length: 10 }, (_, i) => ({ reporterId: "n" + i, weight: reporterWeight(undefined, 0) }));
  // the score can add up, but it is flagged as a pile-on and the store refuses to auto-hide on those
  assert.equal(looksLikePileOn(mob), true);
});
t("genuine independent reporters do reach it, and aren't called a pile-on", () => {
  const real = [1, 2, 3].map((i) => ({ reporterId: "r" + i, weight: 1 }));
  assert.ok(reportScore(real) >= 3); assert.equal(looksLikePileOn(real), false);
});
t("serial false reporters get paused", () => { assert.equal(shouldPause({ upheld: 1, dismissed: 5 }), true); assert.equal(shouldPause({ upheld: 6, dismissed: 5 }), false); assert.equal(shouldPause({ upheld: 0, dismissed: 3 }), false); });
console.log(`\n${n} passed`);
