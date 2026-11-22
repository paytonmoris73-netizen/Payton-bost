import { INGREDIENTS } from "./data";
import type { AIConfig, Combo, Ingredient, Nutrition, Recipe, Taste, Texture } from "./types";

export const DISCLAIMER_TASTE = "Taste is subjective. These are suggestions based on general flavour principles, not a guarantee that a combination will taste good.";
export const DISCLAIMER_NUTRITION = "Nutrition values are estimates calculated from typical ingredient data, not laboratory-tested facts.";
export const DISCLAIMER_ALLERGEN = "Allergen information is based on ingredient data only and cannot account for cross-contact or brand differences. Always check labels. CRUNCH cannot guarantee any recipe is safe for someone with an allergy.";

/* ---------- units & nutrition ---------- */
export const UNITS = ["g", "ml", "cup", "tbsp", "tsp", "piece"] as const;
const PIECE_G: Record<string, number> = { Fruits: 150, Vegetables: 120, Meats: 150, Seafood: 120, Dairy: 60, Cheese: 30, Grains: 40, Pasta: 100, Sauces: 15, Spices: 2, Snacks: 30, Desserts: 40, Drinks: 240, Baking: 10, Other: 100 };
export function toGrams(ing: Ingredient, qty: number, unit: string): number {
  switch (unit) {
    case "g": case "ml": return qty;
    case "cup": return qty * 240;
    case "tbsp": return qty * 15;
    case "tsp": return qty * 5;
    default: return qty * (ing.id === "egg" ? 50 : ing.id === "garlic" ? 4 : PIECE_G[ing.category] ?? 100);
  }
}
export function sumNutrition(items: { ing: Ingredient; grams: number }[]): { total: Nutrition; known: number; unknown: number } {
  const t: Nutrition = { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, sugar: 0, sodium: 0 };
  let known = 0, unknown = 0;
  for (const { ing, grams } of items) {
    if (ing.custom) { unknown++; continue; }
    known++;
    (Object.keys(t) as (keyof Nutrition)[]).forEach((k) => (t[k] += (ing.per100g[k] * grams) / 100));
  }
  return { total: t, known, unknown };
}
export const round = (n: number, d = 0) => { const f = 10 ** d; return Math.round(n * f) / f; };
export const perServing = (n: Nutrition, s: number): Nutrition => Object.fromEntries((Object.keys(n) as (keyof Nutrition)[]).map((k) => [k, round(n[k] / Math.max(1, s), k === "calories" || k === "sodium" ? 0 : 1)])) as unknown as Nutrition;

/* ---------- search ---------- */
function lev(a: string, b: string): number {
  if (Math.abs(a.length - b.length) > 2) return 3;
  const dp = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) dp[0][j] = j;
  for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++)
    dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  return dp[a.length][b.length];
}
/** Returns 0 for no match; higher is better. Tolerates small typos. */
export function matchScore(query: string, text: string): number {
  const q = query.toLowerCase().trim(); if (!q) return 1;
  const t = text.toLowerCase();
  if (t === q) return 100;
  if (t.startsWith(q)) return 80;
  if (t.includes(q)) return 60;
  const qs = q.split(/\s+/), words = t.split(/[^a-z0-9]+/).filter(Boolean);
  let total = 0;
  for (const w of qs) {
    let best = 0;
    for (const x of words) {
      if (x.startsWith(w)) best = Math.max(best, 30);
      else if (w.length >= 4 && lev(w, x.slice(0, w.length + 1)) <= 1) best = Math.max(best, 20);
      else if (w.length >= 4 && lev(w, x) <= (w.length > 6 ? 2 : 1)) best = Math.max(best, 18);
    }
    if (!best) return 0;
    total += best;
  }
  return total / qs.length;
}

export function findIngredientsInText(text: string, pool: Ingredient[] = INGREDIENTS): Ingredient[] {
  const lower = " " + text.toLowerCase().replace(/[^a-z0-9 ]/g, " ") + " ";
  const found = new Map<string, Ingredient>();
  for (const ing of pool) {
    const n = ing.name.toLowerCase();
    const forms = [n, n.endsWith("y") ? n.slice(0, -1) + "ies" : n + "s", n.endsWith("o") ? n + "es" : n + "s"];
    if (forms.some((f) => lower.includes(" " + f + " "))) found.set(ing.id, ing);
  }
  // typo tolerance on single tokens
  for (const tok of lower.split(" ").filter((w) => w.length >= 5)) {
    for (const ing of pool) if (!found.has(ing.id) && !ing.name.includes(" ") && lev(tok, ing.name.toLowerCase()) === 1) found.set(ing.id, ing);
  }
  return [...found.values()];
}

/* ---------- combination analysis ---------- */
export interface ComboItem { ing: Ingredient; qty: number; unit: string }
export interface Analysis {
  score: number; flavor: number; texture: number; versatility: number; potential: number;
  profile: Record<"sweet" | "salty" | "sour", number>; heat: number;
  reasons: string[]; conflicts: string[]; suggestions: Ingredient[]; ideas: string[]; methods: string[];
  nutrition: { total: Nutrition; perServing: Nutrition; servings: number; partial: boolean; breakdown: { name: string; calories: number }[] };
}
const clamp = (n: number, a = 0, b = 100) => Math.max(a, Math.min(b, n));
const byId = (id: string) => INGREDIENTS.find((i) => i.id === id)!;

export function analyze(items: ComboItem[]): Analysis | null {
  if (items.length === 0) return null;
  const ings = items.map((i) => i.ing);
  const tasteSum: Record<Taste, number> = { sweet: 0, salty: 0, sour: 0, bitter: 0, umami: 0, fat: 0, heat: 0 };
  ings.forEach((i) => (Object.entries(i.taste) as [Taste, number][]).forEach(([k, v]) => (tasteSum[k] = Math.max(tasteSum[k], v))));
  const has = (t: Taste, min = 3) => ings.some((i) => (i.taste[t] ?? 0) >= min);
  const cats = new Set(ings.map((i) => i.category));
  const texSet = new Set<Texture>(ings.flatMap((i) => i.textures));
  const reasons: string[] = [], conflicts: string[] = [];

  // flavor balance: contrast and completeness, with penalties for pile-ups
  let flavor = 45;
  if (has("sweet") && has("salty")) { flavor += 14; reasons.push("Sweet and salty elements contrast well."); }
  if (has("fat") && has("sour")) { flavor += 12; reasons.push("Acid cuts through richness."); }
  if (has("umami", 3)) { flavor += 8; reasons.push("A savoury, umami backbone adds depth."); }
  if (has("heat") && has("sweet")) { flavor += 8; reasons.push("Heat plays nicely against sweetness."); }
  if (has("sour") && !has("fat") && !has("sweet") && ings.length > 2) flavor -= 4;
  const sweetCount = ings.filter((i) => (i.taste.sweet ?? 0) >= 4).length;
  const saltyCount = ings.filter((i) => (i.taste.salty ?? 0) >= 4).length;
  const heatCount = ings.filter((i) => (i.taste.heat ?? 0) >= 4).length;
  if (sweetCount >= 3) { flavor -= 12; conflicts.push("Several very sweet ingredients may be cloying without acid or salt."); }
  if (saltyCount >= 3) { flavor -= 12; conflicts.push("Multiple strongly salty ingredients — watch the seasoning."); }
  if (heatCount >= 2) { flavor -= 6; conflicts.push("More than one strongly spicy ingredient can overpower the rest."); }
  if (has("bitter", 4) && has("sour", 4)) { flavor -= 8; conflicts.push("Strong bitter and sour together can taste harsh."); }
  const meaty = ings.some((i) => i.category === "Meats" || i.category === "Seafood");
  const sweetDessert = ings.some((i) => i.category === "Desserts" || i.category === "Baking" && (i.taste.sweet ?? 0) >= 5);
  if (meaty && sweetDessert) { flavor -= 10; conflicts.push("Meat or seafood with dessert items is a divisive pairing."); }
  if (ings.some((i) => i.category === "Seafood") && ings.some((i) => i.category === "Dairy" || i.category === "Cheese") && ings.some((i) => i.id === "parmesan")) conflicts.push("Parmesan with seafood is a debated pairing in some cuisines.");
  if (ings.length === 1) flavor = Math.min(flavor, 50);
  flavor = clamp(flavor);

  // texture
  let texture = 40 + Math.min(3, texSet.size) * 10;
  if (texSet.has("crisp") && (texSet.has("creamy") || texSet.has("soft"))) { texture += 14; reasons.push("Crisp and creamy textures give contrast."); }
  if (texSet.size === 1 && ings.length > 2) { texture -= 10; conflicts.push("All ingredients share a similar texture; consider adding some contrast."); }
  texture = clamp(texture);

  const hasProtein = ings.some((i) => ["Meats", "Seafood", "Dairy"].includes(i.category) || i.id === "tofu" || i.per100g.protein > 12);
  const hasStarch = ings.some((i) => ["Grains", "Pasta"].includes(i.category) || i.id === "potato");
  const hasVeg = ings.some((i) => ["Vegetables", "Fruits"].includes(i.category));
  const versatility = clamp(30 + cats.size * 9 + (hasProtein ? 8 : 0) + (hasStarch ? 8 : 0) + (hasVeg ? 8 : 0));
  const potential = clamp(25 + Math.min(items.length, 5) * 8 + (hasStarch ? 8 : 0) + (hasProtein ? 8 : 0) + (cats.size >= 3 ? 8 : 0) - (items.length > 8 ? 12 : 0));
  if (items.length >= 7) conflicts.push("Seven or more main ingredients can muddy the flavour. Consider simplifying.");
  if (items.length < 3) reasons.push("Few ingredients so far — add a couple more for a fuller analysis.");

  const score = Math.round(clamp(flavor * 0.4 + texture * 0.2 + versatility * 0.2 + potential * 0.2, 15, 96));

  // suggestions
  const sug: Ingredient[] = [];
  const add = (id: string) => { const i = byId(id); if (i && !ings.some((x) => x.id === id) && !sug.some((x) => x.id === id)) sug.push(i); };
  if (!has("sour", 3)) add("lemon");
  if (!has("fat", 3) && !sweetDessert) add("olive-oil");
  if (!has("salty", 3) && !sweetDessert) add("salt");
  if (!ings.some((i) => i.category === "Vegetables") && !sweetDessert) add("spinach");
  if (!texSet.has("crisp")) add(sweetDessert ? "almonds" : "onion");
  if (!ings.some((i) => i.id === "garlic" || i.id === "onion") && !sweetDessert && meaty) add("garlic");
  if (sweetDessert || cats.has("Fruits")) add("vanilla");
  if (!has("heat", 2) && !sweetDessert && !cats.has("Fruits")) add("black-pepper");
  if (ings.every((i) => i.category !== "Spices") && meaty) add("paprika");

  // ideas & methods
  const ideas: string[] = [];
  const methods = new Set<string>();
  if (hasStarch && hasProtein) { ideas.push("One-pan skillet"); ideas.push("Hearty grain bowl"); }
  if (cats.has("Pasta")) ideas.push("Baked pasta or quick sauté");
  if (cats.has("Fruits") && (cats.has("Dairy") || cats.has("Desserts"))) ideas.push("Layered parfait", "Smoothie bowl");
  if (cats.has("Fruits") && (cats.has("Baking") || cats.has("Grains"))) ideas.push("Crumble or galette");
  if (cats.has("Vegetables") && !hasStarch) ideas.push("Roasted tray bake", "Warm salad");
  if (meaty) { methods.add("Pan-fry"); methods.add("Roast"); }
  if (cats.has("Vegetables")) { methods.add("Roast"); methods.add("Stir-fry"); }
  if (cats.has("Fruits") || cats.has("Desserts")) { methods.add("No-cook"); methods.add("Bake"); }
  if (hasStarch) methods.add("Simmer or boil");
  if (ideas.length === 0) ideas.push("Taste-and-adjust bowl", "Quick sauté");
  if (methods.size === 0) methods.add("Pan-fry");

  // nutrition
  const rows = items.map((i) => ({ ing: i.ing, grams: toGrams(i.ing, i.qty, i.unit) }));
  const { total, unknown } = sumNutrition(rows);
  const servings = Math.max(1, Math.round(rows.reduce((s, r) => s + r.grams, 0) / 300));
  const breakdown = rows.map((r) => ({ name: r.ing.name, calories: r.ing.custom ? 0 : round((r.ing.per100g.calories * r.grams) / 100) }));

  return {
    score, flavor, texture, versatility, potential,
    profile: { sweet: Math.round((tasteSum.sweet / 5) * 100), salty: Math.round((tasteSum.salty / 5) * 100), sour: Math.round((tasteSum.sour / 5) * 100) },
    heat: Math.round((tasteSum.heat / 5) * 100),
    reasons: reasons.length ? reasons : ["A simple combination with a mild flavour profile."], conflicts, suggestions: sug.slice(0, 5),
    ideas: [...new Set(ideas)].slice(0, 5), methods: [...methods].slice(0, 4),
    nutrition: { total, perServing: perServing(total, servings), servings, partial: unknown > 0, breakdown },
  };
}

/* ---------- recipe generation (local engine; structured output) ---------- */
export interface GenOptions { meal: string; style?: string; cuisine?: string; servings: number; maxMinutes?: number; difficulty?: string; diet: string[]; equipment?: string[]; flavor?: string; }
export interface GenRecipe extends Omit<Recipe, "creatorId" | "price" | "rating" | "reviews" | "sales" | "views" | "status" | "createdAt" | "id" | "hue"> { warnings: string[] }

const role = (i: Ingredient): "protein" | "starch" | "veg" | "fruit" | "dairy" | "sauce" | "spice" | "sweet" | "snack" | "other" => {
  if (["Meats", "Seafood"].includes(i.category) || ["tofu", "egg", "chickpeas", "black-beans", "lentils"].includes(i.id)) return "protein";
  if (["Grains", "Pasta"].includes(i.category) || ["potato", "sweet-potato"].includes(i.id)) return "starch";
  if (i.category === "Vegetables") return "veg";
  if (i.category === "Fruits") return "fruit";
  if (["Dairy", "Cheese"].includes(i.category)) return "dairy";
  if (i.category === "Sauces") return "sauce";
  if (i.category === "Spices") return "spice";
  if (["Desserts", "Baking"].includes(i.category)) return "sweet";
  if (i.category === "Snacks") return "snack";
  return "other";
};
const PER_SERVING: Record<string, number> = { protein: 150, starch: 80, veg: 100, fruit: 100, dairy: 50, sauce: 30, spice: 2, sweet: 40, snack: 20, other: 100 };
const fmtAmt = (g: number, i: Ingredient) => {
  if (i.id === "egg") return `${Math.max(1, Math.round(g / 50))}`;
  if (i.category === "Spices") return `${Math.max(1, Math.round(g / 2))} tsp`;
  if (i.category === "Sauces" || i.id === "olive-oil") return `${Math.max(1, Math.round(g / 15))} tbsp`;
  if (["Drinks", "Dairy"].includes(i.category) && ["milk", "heavy-cream", "coconut-milk"].includes(i.id)) return `${Math.round(g)} ml`;
  return `${Math.round(g / 5) * 5 || 5} g`;
};
const safeTemp = (i: Ingredient) => i.id === "chicken-breast" || i.id === "sausage" ? "74°C" : i.id === "ground-beef" ? "71°C" : i.category === "Seafood" ? "63°C" : i.category === "Meats" ? "63°C (rest 3 minutes)" : "";

export function generateRecipes(base: ComboItem[], o: GenOptions): GenRecipe[] {
  const ings = base.map((b) => b.ing);
  const savoury = !["Dessert", "Drink"].includes(o.meal) && !(o.meal === "Snack" && ings.every((i) => ["Fruits", "Desserts", "Snacks", "Dairy"].includes(i.category)));
  const roles = (r: string) => ings.filter((i) => role(i) === r);
  const names = (l: Ingredient[]) => l.map((i) => i.name.toLowerCase()).join(", ");
  const dessertish = o.meal === "Dessert";
  const styles = savoury
    ? [{ key: "Skillet", method: "Pan-fry" }, { key: "Roasted Tray", method: "Roast" }, { key: "Bowl", method: "Stir-fry" }]
    : o.meal === "Drink"
    ? [{ key: "Smoothie", method: "Blend" }, { key: "Chilled Sipper", method: "Chill" }, { key: "Warm Cup", method: "Warm" }]
    : [{ key: "Layered Parfait", method: "No-cook" }, { key: "Baked", method: "Bake" }, { key: "Frozen Treat", method: "Freeze" }];

  const warnings: string[] = [];
  o.diet.forEach((d) => { const bad = ings.filter((i) => !(i.tags ?? []).includes(d) && !i.custom); if (bad.length) warnings.push(`Not ${d}: ${bad.map((b) => b.name).join(", ")}. See substitutions, or remove these ingredients.`); });

  return styles.map((s, idx): GenRecipe => {
    const wanted = idx === 0 && o.style ? o.style : s.method;
    const lead = ings.find((i) => ["protein", "fruit", "starch", "veg"].includes(role(i))) ?? ings[0];
    const cuisineTag = o.cuisine && o.cuisine !== "Any" ? `${o.cuisine}-Style ` : "";
    const title = `${cuisineTag}${lead.name} ${savoury ? s.key : dessertish ? s.key : s.key}`.replace(/\s+/g, " ");
    const lines = base.map((b) => {
      const g = b.qty > 0 && b.unit !== "piece" ? toGrams(b.ing, b.qty, b.unit) : (PER_SERVING[role(b.ing)] ?? 50) * o.servings * (b.qty > 1 && b.unit === "piece" ? b.qty : 1);
      return { ing: b.ing, grams: Math.min(g, 2000), amount: fmtAmt(g, b.ing) };
    });
    const addOil = savoury && !ings.some((i) => i.id === "olive-oil" || i.id === "butter");
    const extra: { name: string; amount: string; ing?: Ingredient }[] = [];
    if (addOil) extra.push({ name: "Olive oil", amount: `${Math.max(1, o.servings)} tbsp`, ing: INGREDIENTS.find((i) => i.id === "olive-oil") });
    if (savoury && !ings.some((i) => i.id === "salt")) extra.push({ name: "Salt", amount: "to taste", ing: undefined });
    const nutr = sumNutrition([...lines.map((l) => ({ ing: l.ing, grams: l.grams })), ...extra.filter((e) => e.ing).map((e) => ({ ing: e.ing!, grams: 15 * o.servings }))]);

    const steps: { text: string; timerMin?: number }[] = [];
    const prot = roles("protein"), starch = roles("starch"), veg = roles("veg"), fruit = roles("fruit"), dairy = roles("dairy"), sauce = roles("sauce"), spice = roles("spice"), sweet = roles("sweet"), snack = roles("snack");
    if (savoury) {
      steps.push({ text: `Prep: wash and chop ${names([...veg, ...fruit]) || "your fresh ingredients"} into even pieces. Pat ${names(prot) || "everything"} dry and season${spice.length ? ` with ${names(spice)}` : " with salt"}.` });
      if (starch.length) {
        const pasta = starch.some((i) => i.category === "Pasta"), rice = starch.some((i) => ["Rice", "Quinoa", "Couscous"].includes(i.name));
        steps.push({ text: pasta ? `Boil ${names(starch)} in well-salted water until just tender. Reserve a cup of the cooking water, then drain.` : rice ? `Rinse and cook ${names(starch)} according to the package until tender, then fluff and keep warm.` : `Cut ${names(starch)} into bite-size pieces and parboil briefly so they cook evenly.`, timerMin: pasta ? 10 : rice ? 15 : 8 });
      }
      const cookTime = wanted === "Roast" ? 25 : 10;
      if (wanted === "Roast") steps.push({ text: `Heat the oven to 200°C. Toss ${names([...prot, ...veg, ...starch.filter((i) => i.category !== "Pasta" && i.category !== "Grains")]) || "the main ingredients"} with oil on a tray in a single layer. Roast, turning once.`, timerMin: cookTime });
      else steps.push({ text: `Heat a large pan over medium-high heat with oil or butter. Cook ${names(prot) || names(veg) || "the main ingredient"} until browned${prot.length ? `, reaching a safe internal temperature (${safeTemp(prot[0]) || "check packaging"} for ${prot[0].name.toLowerCase()})` : ""}.`, timerMin: cookTime });
      if (veg.length && wanted !== "Roast") steps.push({ text: `Add ${names(veg)} and cook until tender-crisp, stirring often.`, timerMin: 5 });
      if (sauce.length || dairy.length) steps.push({ text: `Lower the heat and stir in ${names([...sauce, ...dairy]) || "your sauce"}. Warm through gently without boiling hard${dairy.some((d) => d.category === "Cheese") ? "; add cheese off the heat so it stays smooth" : ""}.`, timerMin: 3 });
      if (starch.length) steps.push({ text: `Combine with the ${names(starch)}${starch.some((i) => i.category === "Pasta") ? ", loosening with splashes of the reserved water" : ""}.` });
      steps.push({ text: `Taste and adjust: add salt for depth, an acid such as lemon or lime to brighten, or a pinch of sugar if it tastes sharp.${snack.length ? ` Finish with ${names(snack)} for crunch.` : ""}` });
      steps.push({ text: "Rest for 2 minutes, then serve hot." });
    } else if (o.meal === "Drink") {
      steps.push({ text: `Add ${names(ings)} to a blender${s.method === "Chill" ? " with plenty of ice" : ""}.` });
      steps.push({ text: s.method === "Warm" ? "Warm gently in a saucepan over low heat until steaming; do not boil." : "Blend until completely smooth, about 45 seconds.", timerMin: s.method === "Warm" ? 5 : 1 });
      steps.push({ text: "Taste, sweeten or add citrus if needed, and serve right away." });
    } else {
      steps.push({ text: `Prep: wash, peel and slice ${names([...fruit, ...veg]) || "the fruit"}. Measure everything out.` });
      if (s.method === "Bake") steps.push({ text: `Heat the oven to 180°C. Arrange ${names([...fruit, ...sweet]) || "the base"} in a baking dish${starch.length || sweet.some((i) => i.id === "flour") ? ", topping with a crumbly mix of the dry ingredients and butter" : ""}. Bake until bubbling and golden.`, timerMin: 25 });
      else if (s.method === "Freeze") steps.push({ text: `Blend ${names([...fruit, ...dairy]) || "everything"} until smooth, pour into a container and freeze until scoopable.`, timerMin: 120 });
      else steps.push({ text: `Layer ${names([...dairy, ...fruit]) || "the soft ingredients"} in glasses with ${names([...sweet, ...snack]) || "a crunchy element"} between the layers.` });
      steps.push({ text: `Finish with ${names(spice) || "a pinch of salt"}; a little salt makes sweet flavours taste fuller.` });
      steps.push({ text: "Chill for 15 minutes if you can, then serve." });
    }
    const prep = 10 + ings.length * 2, cook = steps.reduce((m, st) => m + (st.timerMin && st.timerMin < 90 ? st.timerMin : 0), 0);
    const diets = ["vegan", "vegetarian", "gluten-free", "dairy-free"].filter((d) => ings.every((i) => i.custom || (i.tags ?? []).includes(d)));
    const allergens = [...new Set(ings.flatMap((i) => i.allergens))];
    const subs = ings.flatMap((i) => i.substitutes.slice(0, 1).map((s2) => `${i.name} → ${s2}`)).slice(0, 5);
    return {
      title: title.replace(/^./, (c) => c.toUpperCase()),
      description: `A ${o.difficulty?.toLowerCase() ?? "straightforward"} ${o.meal.toLowerCase()} built around ${names(ings.slice(0, 3))}, using a ${wanted.toLowerCase()} approach${o.flavor ? ` with a ${o.flavor.toLowerCase()} flavour lean` : ""}.`,
      emoji: lead.emoji, ingredients: [...lines.map((l) => ({ name: l.ing.name, amount: l.amount })), ...extra.map((e) => ({ name: e.name, amount: e.amount }))],
      steps, prepMin: prep, cookMin: cook, servings: o.servings, difficulty: (o.difficulty as Recipe["difficulty"]) || "Easy", cuisine: o.cuisine && o.cuisine !== "Any" ? o.cuisine : "Global",
      meal: o.meal, categories: [o.meal], diet: diets, nutrition: perServing(nutr.total, o.servings), allergens,
      equipment: [wanted === "Roast" || wanted === "Bake" ? "Oven + baking tray" : s.method === "Blend" || s.method === "Chill" || s.method === "Freeze" ? "Blender" : "Large pan", "Chopping board and knife", ...(starch.length ? ["Saucepan"] : [])],
      substitutions: subs, storage: savoury ? "Cool quickly and refrigerate within 2 hours. Keep up to 3 days and reheat until steaming hot." : "Keep chilled and eat within 2 days.",
      ai: true, warnings: nutr.unknown ? [...warnings, "Some custom ingredients have no nutrition data, so totals are partial."] : warnings,
    };
  });
}

/* ---------- Chef chat ---------- */
export interface ChefReply { text: string; recipes?: GenRecipe[]; suggestRemote?: boolean }
export function chefReply(input: string, ctx: { diet: string[]; allergies: string[] }): ChefReply {
  const q = input.toLowerCase();
  const found = findIngredientsInText(input);
  const base: ComboItem[] = found.map((ing) => ({ ing, qty: 0, unit: "g" }));
  const disclaimer = ctx.allergies.length ? `\n\nYou listed allergies (${ctx.allergies.join(", ")}). ${DISCLAIMER_ALLERGEN}` : "";

  if (/substitut|swap|replace|instead of|out of|don'?t have/.test(q) && found.length) {
    return { text: found.map((i) => `**${i.name}** — try ${i.substitutes.length ? i.substitutes.join(" or ") : "a similar " + i.category.toLowerCase() + " ingredient"}. Results vary: expect small changes in flavour and texture.`).join("\n") + disclaimer };
  }
  if (/vegan|vegetarian|dairy.?free|gluten.?free|without dairy|no dairy/.test(q)) {
    const diet = /vegan/.test(q) ? "vegan" : /vegetarian/.test(q) ? "vegetarian" : /gluten/.test(q) ? "gluten-free" : "dairy-free";
    const tips: Record<string, string> = {
      vegan: "Swap butter for olive oil or coconut milk, dairy for coconut milk, eggs for tofu scramble (or flax in baking), and meat for chickpeas, lentils, mushrooms or tofu. Add soy sauce or mushrooms for umami.",
      vegetarian: "Replace meat with tofu, chickpeas, lentils, mushrooms or eggs. Add smoked paprika or soy sauce for savoury depth. Check cheeses for animal rennet if that matters to you.",
      "gluten-free": "Use rice, quinoa or rice noodles in place of wheat pasta and bread, and check sauces — soy sauce usually contains wheat. Look for certified gluten-free labels if you need to avoid cross-contact.",
      "dairy-free": "Swap butter for olive oil, milk and cream for coconut milk, and yogurt for a dairy-free alternative. Nutritional yeast or miso can stand in for the savoury note of cheese.",
    };
    const gen = found.length ? generateRecipes(base, { meal: "Dinner", servings: 2, diet: [diet] }).slice(0, 1) : undefined;
    return { text: `Making it ${diet}: ${tips[diet]}${found.length ? "\n\nHere is a starting point with the ingredients you mentioned:" : "\n\nTell me the dish or ingredients and I'll adapt it."}${disclaimer}`, recipes: gen };
  }
  if (/dessert|sweet|cake|cookie/.test(q) && found.length) {
    return { text: "Here are three dessert ideas from what you mentioned. Treat them as starting points and taste as you go." , recipes: generateRecipes(base, { meal: "Dessert", servings: 2, diet: ctx.diet }) };
  }
  if (/what can i (make|cook)|make with|cook with|i have|ideas|recipe/.test(q) && found.length) {
    return { text: `Good start. With ${found.map((f) => f.name.toLowerCase()).join(", ")} you could try these three directions:${disclaimer}`, recipes: generateRecipes(base, { meal: "Dinner", servings: 2, diet: ctx.diet }) };
  }
  if (/improve|better|flavou?r|bland|boring|add to|taste/.test(q)) {
    if (found.length) {
      const a = analyze(base.map((b) => ({ ...b, qty: 1, unit: "piece" })));
      return { text: `For ${found.map((f) => f.name.toLowerCase()).join(", ")}: ${a?.suggestions.length ? "consider adding " + a.suggestions.map((s) => s.name.toLowerCase()).join(", ") + "." : "the balance already looks reasonable."} ${a?.conflicts.length ? "Watch out: " + a.conflicts[0] : ""}\n\nGeneral rule: if it tastes flat, add salt or acid; if it is sharp, add a little fat or sweetness; if it is heavy, add something fresh and sour. ${DISCLAIMER_TASTE}` };
    }
    return { text: "When food tastes flat, work through four levers in order: salt, acid (lemon, vinegar), fat (oil, butter, cream) and sweetness. Add a little at a time and taste between each. Tell me the dish and I'll be more specific." };
  }
  if (/step|how (do|to|long)|cook (this|it)/.test(q)) return { text: "Open any recipe and press 'Start cooking' for full-screen step-by-step mode with timers and voice. Or ask me about a technique, like 'how do I cook rice' or 'how long to roast potatoes'." };
  if (/how.*(rice)/.test(q)) return { text: "Rinse rice until the water runs mostly clear. Use about 1.5× water by volume for white rice, bring to a boil, cover and cook on the lowest heat for 12–15 minutes, then rest covered for 10 minutes." };
  if (found.length) return { text: `I can work with ${found.map((f) => f.name.toLowerCase()).join(", ")}. Ask me what to make, what to add, or how to substitute something — or use the generator on the left for full recipes.`, recipes: generateRecipes(base, { meal: "Dinner", servings: 2, diet: ctx.diet }).slice(0, 2) };
  return { text: "I'm CRUNCH's AI chef. Try asking:\n• What can I make with chicken, rice and spinach?\n• What can I substitute for butter?\n• How can I make this vegetarian?\n• How do I improve the flavour of tomato and mozzarella?\n• Create a dessert using banana and oats.\n\nNote: without a connected AI provider I use CRUNCH's built-in rules engine, which is more limited. Connect a provider in Settings → AI & Integrations for open-ended answers.", suggestRemote: true };
}

/* ---------- remote AI (OpenAI-compatible) ---------- */
/** Server proxy (api/chef.ts) that holds the AI key. Used unless the user sets their own endpoint. */
export const DEFAULT_AI_ENDPOINT = "/api/chef";

export async function askRemote(cfg: AIConfig, messages: { role: "user" | "assistant" | "system"; content: string }[]): Promise<string> {
  const res = await fetch(cfg.endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(cfg.key ? { Authorization: `Bearer ${cfg.key}` } : {}) },
    body: JSON.stringify({ model: cfg.model, messages: [{ role: "system", content: "You are CRUNCH's AI chef. Give practical, safe cooking advice. Never guarantee taste or allergy safety. Nutrition values are estimates." }, ...messages] }),
  });
  if (!res.ok) throw new Error(`AI provider returned ${res.status}`);
  const j = await res.json();
  const t = j?.choices?.[0]?.message?.content ?? j?.content?.[0]?.text;
  if (typeof t !== "string") throw new Error("Unexpected AI response format");
  return t;
}

export function comboToItems(c: Combo, all: Ingredient[]): ComboItem[] {
  return c.items.flatMap((i) => { const ing = all.find((x) => x.id === i.id); return ing ? [{ ing, qty: i.qty, unit: i.unit }] : []; });
}

export const totalMin = (r: Pick<Recipe, "prepMin" | "cookMin">) => r.prepMin + r.cookMin;
export const money = (n: number) => (n === 0 ? "Free" : `$${n.toFixed(2)}`);
export const MARKET_FEE = 0.15;
