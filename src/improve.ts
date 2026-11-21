import { SUBS, subKey, substitutesFor, type Tag } from "./substitutions";

export interface RIng { amount: string; name: string }
export interface Draft { title: string; ingredients: RIng[]; steps: string[] }
export type Goal = "vegetarian" | "vegan" | "dairy-free" | "less-sweet" | "creamier" | "simpler";
export const GOALS: { id: Goal; label: string }[] = [
  { id: "vegetarian", label: "Make it vegetarian" }, { id: "vegan", label: "Make it vegan" }, { id: "dairy-free", label: "Make it dairy-free" },
  { id: "less-sweet", label: "Make it less sweet" }, { id: "creamier", label: "Make the sauce creamier" }, { id: "simpler", label: "Reduce complexity" },
];
export interface Finding { level: "issue" | "tip"; text: string }
export interface Improvement { improved: Draft; changes: string[]; findings: Finding[]; unchanged: string[] }

const AMT = /^\s*((?:\d+\s+)?\d+(?:[./]\d+)?|\d*\.\d+|a pinch of|pinch of|a splash of|to taste)?\s*((?:g|kg|ml|l|cups?|tbsp|tsp|oz|lb|cloves?|cans?|slices?|pieces?)\b)?\s*(?:of\s+)?(.+)$/i;
export function parseIngredients(text: string): RIng[] {
  return text.split("\n").map((l) => l.trim().replace(/^[-•*]\s*/, "")).filter(Boolean).map((l) => {
    const m = l.match(AMT); if (!m) return { amount: "", name: l };
    return { amount: [m[1], m[2]].filter(Boolean).join(" ").trim(), name: m[3].trim() };
  });
}
export const parseSteps = (text: string) => text.split("\n").map((l) => l.trim().replace(/^\d+[.)]\s*/, "")).filter(Boolean);
export const fmtIng = (i: RIng) => `${i.amount ? i.amount + " " : ""}${i.name}`;

const num = (s: string) => { const m = s.match(/^(\d+)\s+(\d+)\/(\d+)|^(\d+)\/(\d+)|^(\d*\.?\d+)/); if (!m) return null; if (m[1]) return Number(m[1]) + Number(m[2]) / Number(m[3]); if (m[4]) return Number(m[4]) / Number(m[5]); return Number(m[6]); };
const scale = (amount: string, f: number) => { const v = num(amount); if (v === null) return amount; const rest = amount.replace(/^(\d+\s+\d+\/\d+|\d+\/\d+|\d*\.?\d+)/, ""); return `${Math.round(v * f * 100) / 100}${rest}`; };

const MEAT = /\b(chicken|beef|pork|bacon|sausage|lamb|turkey|ham|steak|mince|salmon|shrimp|prawns?|tuna|cod|fish|scallops?)\b/i;
const DAIRY = /\b(milk|butter|cream|cheese|cheddar|mozzarella|parmesan|feta|yogh?urt|ghee)\b/i;
const EGG = /\b(eggs?)\b/i; const HONEY = /\bhoney\b/i;
const SWEET = /\b(sugar|honey|syrup|molasses|agave)\b/i;
const FAT = /\b(oil|butter|cream|cheese|avocado|coconut|mayonnaise|ghee)\b/i;
const ACID = /\b(lemon|lime|vinegar|wine|yogh?urt|tomato|tamarind|pickle)\b/i;
const SALT = /\b(salt|soy sauce|miso|fish sauce|anchov|parmesan|feta|capers)\b/i;
const HEAT_CUE = /\b(until|for \d+|minutes?|mins?|golden|soft|tender|simmer|boil|bubbl|fragrant|reduce)\b/i;

export function findings(d: Draft): Finding[] {
  const out: Finding[] = []; const all = d.ingredients.map((i) => i.name).join(" | ");
  if (d.ingredients.length && !d.ingredients.some((i) => SALT.test(i.name))) out.push({ level: "issue", text: "No salt or salty ingredient is listed. Seasoning is the quickest way to lift flavour." });
  if (d.ingredients.length >= 4 && !ACID.test(all)) out.push({ level: "tip", text: "Nothing acidic (lemon, vinegar, tomato, yogurt). A little acid often brightens a rich or flat dish." });
  if (d.ingredients.length >= 4 && !FAT.test(all)) out.push({ level: "tip", text: "No obvious fat source. A little oil or butter helps browning and carries flavour." });
  const sweet = d.ingredients.filter((i) => SWEET.test(i.name)).length;
  if (sweet >= 2) out.push({ level: "tip", text: "Several sweeteners are listed. Check whether the dish is balanced or will read as too sweet." });
  const noQty = d.ingredients.filter((i) => !i.amount && !/salt|pepper|oil|to taste/i.test(i.name));
  if (noQty.length) out.push({ level: "issue", text: `${noQty.length} ingredient${noQty.length > 1 ? "s have" : " has"} no quantity (${noQty.slice(0, 3).map((i) => i.name).join(", ")}). Clear amounts make the recipe repeatable.` });
  const longSteps = d.steps.filter((s) => s.length > 220);
  if (longSteps.length) out.push({ level: "issue", text: `${longSteps.length} step${longSteps.length > 1 ? "s are" : " is"} very long. Splitting them makes the method easier to follow.` });
  const vague = d.steps.filter((s) => !HEAT_CUE.test(s) && /\b(cook|fry|bake|roast|heat|simmer|saut[eé])\b/i.test(s));
  if (vague.length) out.push({ level: "issue", text: `${vague.length} cooking step${vague.length > 1 ? "s give" : " gives"} no time or doneness cue (e.g. “until golden”, “for 5 minutes”).` });
  if (d.steps.length > 10) out.push({ level: "tip", text: "More than 10 steps. Consider whether any can be combined." });
  if (!d.steps.length) out.push({ level: "issue", text: "No method steps were provided." });
  return out;
}

function swapMatching(d: Draft, test: (n: string) => boolean, tag: Tag, changes: string[], unchanged: string[]) {
  d.ingredients = d.ingredients.map((i) => {
    if (!test(i.name)) return i;
    const key = subKey(i.name);
    const choice = key ? SUBS[key].find((s) => s.tags.includes(tag)) : undefined;
    if (!choice) { unchanged.push(`${i.name}: no tested substitute in CRUNCH's knowledge base. Replace it manually.`); return i; }
    const short = choice.with.replace(/\s*[(,].*$/, "").toLowerCase();
    const rx = (w: string) => new RegExp(`\\b${w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}s?\\b`, "gi");
    const head = i.name.split(/\s+/)[0];
    d.steps = d.steps.map((st) => { const full = st.replace(rx(i.name), short); return full !== st || head.length < 4 || head.toLowerCase() === i.name.toLowerCase() ? full : st.replace(rx(head), short); });
    changes.push(`${i.name} → ${choice.with} (${choice.amount}). Taste: ${choice.taste}. Texture: ${choice.texture}. ${choice.process}.${choice.allergens.length ? ` Contains: ${choice.allergens.join(", ")}.` : ""}`);
    return { amount: i.amount, name: choice.with };
  });
}

export function improve(src: Draft, goals: Goal[], opts: { allergies?: string[] } = {}): Improvement {
  const d: Draft = { title: src.title, ingredients: src.ingredients.map((i) => ({ ...i })), steps: [...src.steps] };
  const changes: string[] = []; const unchanged: string[] = [];
  const g = new Set(goals); if (g.has("vegan")) { g.add("vegetarian"); g.add("dairy-free"); }
  if (g.has("vegetarian")) {
    swapMatching(d, (n) => MEAT.test(n), "vegetarian", changes, unchanged);
    if (d.ingredients.some((i) => /chicken (stock|broth)|beef (stock|broth)/i.test(i.name))) {
      d.ingredients = d.ingredients.map((i) => /(chicken|beef) (stock|broth)/i.test(i.name) ? { ...i, name: i.name.replace(/(chicken|beef)/i, "vegetable") } : i);
      changes.push("Meat stock → vegetable stock (check the label; some contain allergens).");
    }
  }
  if (g.has("dairy-free")) swapMatching(d, (n) => DAIRY.test(n), "dairy-free", changes, unchanged);
  if (g.has("vegan")) { swapMatching(d, (n) => EGG.test(n), "vegan", changes, unchanged); swapMatching(d, (n) => HONEY.test(n), "vegan", changes, unchanged); }
  if (g.has("less-sweet")) {
    d.ingredients = d.ingredients.map((i) => { if (!SWEET.test(i.name) || !i.amount) return i; const a = scale(i.amount, 0.7); if (a === i.amount) return i; changes.push(`${i.name}: ${i.amount} → ${a} (about 30% less).`); return { ...i, amount: a }; });
    if (!d.ingredients.some((i) => /salt/i.test(i.name))) { d.ingredients.push({ amount: "1 pinch", name: "salt" }); changes.push("Added a pinch of salt, which sharpens flavour and tempers sweetness."); }
    if (!d.ingredients.some((i) => ACID.test(i.name))) { d.ingredients.push({ amount: "1 tsp", name: "lemon juice" }); changes.push("Added 1 tsp lemon juice to balance the sweetness. Taste and adjust."); }
  }
  if (g.has("creamier")) {
    const dairyFree = g.has("dairy-free"); const pick = dairyFree ? "coconut cream" : "heavy cream";
    const added = !d.ingredients.some((i) => /cream|coconut milk|yogh?urt/i.test(i.name));
    if (added) { d.ingredients.push({ amount: "¼ cup", name: pick }); changes.push(`Added ¼ cup ${pick} for a creamier sauce. Stir it in off the heat at the end.`); }
    else changes.push("A cream or yogurt is already present. Reduce the sauce a little longer before serving for a thicker, creamier body.");
    if (added && d.steps.length) d.steps.splice(Math.max(0, d.steps.length - 1), 0, `Lower the heat and stir in the ${pick}. Warm gently for 1–2 minutes without boiling.`);
  }
  if (g.has("simpler")) {
    const split: string[] = [];
    d.steps.forEach((s) => { if (s.length > 220) { const parts = s.split(/(?<=[.!?])\s+/); let cur = ""; parts.forEach((p) => { if ((cur + " " + p).length > 160 && cur) { split.push(cur.trim()); cur = p; } else cur += " " + p; }); if (cur.trim()) split.push(cur.trim()); changes.push("Split a long step into shorter ones."); } else split.push(s); });
    d.steps = split;
    if (!/prep|chop|measure/i.test(d.steps[0] ?? "")) { d.steps.unshift("Prep first: measure, chop and set out every ingredient before turning on the heat."); changes.push("Added a prep-first step so cooking runs smoothly."); }
  }
  // allergy guard on the result
  const alg = (opts.allergies ?? []).map((a) => a.toLowerCase());
  const warnings: Finding[] = [];
  d.ingredients.forEach((i) => { const key = subKey(i.name); if (!key) return; alg.forEach((a) => { if (a && i.name.toLowerCase().includes(a)) warnings.push({ level: "issue", text: `“${i.name}” matches your allergy to ${a}.` }); }); });
  return { improved: d, changes, unchanged, findings: [...findings(src), ...warnings] };
}

export { substitutesFor };
