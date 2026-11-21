import { useEffect, useMemo, useState } from "react";
import { G } from "../icons";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ALLERGENS, DIETS, INGREDIENTS, MARKET_CATEGORIES, CUISINES, MEALS } from "../data";
import { MARKET_FEE, money, perServing, sumNutrition } from "../engine";
import { RecipeBody } from "../RecipeBody";
import { MIN_AGE_COMMERCE, ageOf, uid, useCatalogue, useMe, useStore } from "../store";
import { fileToJpeg } from "../photos";
import { Empty, PageHeader, toast } from "../ui";
import type { Recipe } from "../types";

const EMOJI = ["🍽️", "🍝", "🍜", "🥗", "🍲", "🍛", "🥘", "🍕", "🍔", "🌮", "🥪", "🍣", "🍰", "🧁", "🍪", "🥞", "🍳", "🥣", "🍹", "🍿"];
const words = (s: string) => new Set(s.toLowerCase().split(/[^a-z0-9]+/).filter((w) => w.length > 2));
const jaccard = (a: Set<string>, b: Set<string>) => { const i = [...a].filter((x) => b.has(x)).length; return a.size + b.size - i === 0 ? 0 : i / (a.size + b.size - i); };
function amountToGrams(a: string, id: string): number {
  const m = a.match(/(\d+(?:\.\d+)?)(?:\s*\/\s*(\d+))?\s*(kg|g|ml|l|cups?|tbsp|tsp)?/i); if (!m) return 0;
  const v = m[2] ? Number(m[1]) / Number(m[2]) : Number(m[1]); const u = (m[3] ?? "").toLowerCase();
  if (u === "kg" || u === "l") return v * 1000; if (u === "g" || u === "ml") return v; if (u.startsWith("cup")) return v * 240; if (u === "tbsp") return v * 15; if (u === "tsp") return v * 5;
  return v * (id === "egg" ? 50 : id === "garlic" ? 4 : 100);
}

export default function RecipeEditor() {
  const { id } = useParams(); const nav = useNavigate(); const me = useMe()!; const cat = useCatalogue(); const upsert = useStore((s) => s.upsertRecipe);
  const existing = id ? cat.find((r) => r.id === id && r.creatorId === me.id) : undefined;
  const [r, setR] = useState<Recipe>(() => existing ?? { id: "my_" + uid(), title: "", description: "", emoji: "🍽️", hue: 30, creatorId: me.id, ingredients: [{ name: "", amount: "" }, { name: "", amount: "" }], steps: [{ text: "" }, { text: "" }], prepMin: 10, cookMin: 20, servings: 2, difficulty: "Easy", cuisine: "Global", meal: "Dinner", categories: [], diet: [], price: 0, rating: 0, reviews: 0, sales: 0, views: 0, nutrition: { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, sugar: 0, sodium: 0 }, allergens: [], equipment: [], substitutions: [], storage: "Refrigerate in an airtight container for up to 3 days.", status: "draft", createdAt: new Date().toISOString() });
  const [preview, setPreview] = useState(false); const [original, setOriginal] = useState(false); const [errs, setErrs] = useState<string[]>([]);
  useEffect(() => { if (id && !existing) toast("Recipe not found", "err"); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const u = (p: Partial<Recipe>) => setR((x) => ({ ...x, ...p }));
  const clean = useMemo<Recipe>(() => ({ ...r, hue: (r.emoji.codePointAt(0) ?? 30) % 360, ingredients: r.ingredients.filter((i) => i.name.trim()), steps: r.steps.filter((s) => s.text.trim()) }), [r]);

  const estimate = () => {
    const rows = clean.ingredients.flatMap((i) => { const ing = INGREDIENTS.find((x) => i.name.toLowerCase().includes(x.name.toLowerCase())); return ing ? [{ ing, grams: amountToGrams(i.amount, ing.id) }] : []; });
    if (!rows.length) return toast("No known ingredients found to estimate from.", "err");
    const { total } = sumNutrition(rows); u({ nutrition: perServing(total, r.servings), allergens: [...new Set([...r.allergens, ...rows.flatMap((x) => x.ing.allergens.map((a) => a.split(" ")[0]))])].filter((a) => ALLERGENS.includes(a)) });
    toast(`Estimated from ${rows.length} of ${clean.ingredients.length} ingredients`);
  };

  const validate = (publish: boolean) => {
    const e: string[] = [];
    if (clean.title.trim().length < 3) e.push("Title must be at least 3 characters.");
    if (publish) {
      if (clean.description.trim().length < 20) e.push("Description must be at least 20 characters.");
      if (clean.ingredients.length < 2) e.push("Add at least 2 ingredients.");
      if (clean.steps.length < 2) e.push("Add at least 2 steps.");
      if (clean.ingredients.some((i) => !i.amount.trim())) e.push("Every ingredient needs a quantity.");
      if (clean.servings < 1) e.push("Servings must be at least 1.");
      if (clean.price < 0 || clean.price > 50) e.push("Price must be between $0 and $50.");
      if (clean.price > 0 && ageOf(me) < MIN_AGE_COMMERCE) e.push(`Selling requires an account holder aged ${MIN_AGE_COMMERCE}+. You can still publish free recipes.`);
      if (!original) e.push("Please confirm this is your original work.");
      const mine = words(clean.title + " " + clean.ingredients.map((i) => i.name).join(" ") + " " + clean.steps.map((s) => s.text).join(" "));
      const dup = cat.find((o) => o.id !== r.id && o.status === "published" && o.creatorId !== me.id && jaccard(mine, words(o.title + " " + o.ingredients.map((i) => i.name).join(" ") + " " + o.steps.map((s) => s.text).join(" "))) > 0.7);
      if (dup) e.push(`This looks very similar to “${dup.title}”. Duplicate or copied listings aren't allowed.`);
    }
    setErrs(e); return e.length === 0;
  };
  const save = (status: Recipe["status"]) => { if (!validate(status === "published")) { window.scrollTo({ top: 0, behavior: "smooth" }); return; } upsert({ ...clean, status }); toast(status === "published" ? "Published!" : "Draft saved"); nav(status === "published" ? "/creator/studio" : "/cookbook"); };

  if (id && !existing) return <Empty emoji="🔍" title="Recipe not found" action={<Link to="/creator/studio" className="btn-primary">Studio</Link>} />;
  const earn = r.price * (1 - MARKET_FEE);
  const arr = <T,>(list: T[], i: number, v: T) => list.map((x, k) => (k === i ? v : x));
  return (
    <div>
      <PageHeader title={existing ? "Edit recipe" : "Upload a recipe"} sub="Write it up, preview it, then save as a draft or publish." action={<div className="flex gap-2"><button className="btn-ghost" onClick={() => setPreview(!preview)}>{preview ? "← Edit" : "Preview"}</button></div>} />
      {errs.length > 0 && <div role="alert" className="mb-4 rounded-2xl bg-red-50 p-4 text-sm text-red-800"><b>Fix the following:</b><ul className="mt-1 list-disc pl-5">{errs.map((e) => <li key={e}>{e}</li>)}</ul></div>}
      {preview ? <><p className="mb-3 rounded-xl bg-sage-light/60 p-3 text-sm">This is how buyers will see it after purchase. Before purchase they only see the cover, description and first four ingredient names.</p><RecipeBody r={clean} preview /></> : (
        <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
          <div className="space-y-5">
            <div className="card space-y-3 p-5">
              <div><label className="label" htmlFor="rt">Title</label><input id="rt" className="input" value={r.title} onChange={(e) => u({ title: e.target.value.slice(0, 80) })} /></div>
              <div><label className="label" htmlFor="rd">Description</label><textarea id="rd" className="input" rows={3} value={r.description} onChange={(e) => u({ description: e.target.value.slice(0, 500) })} /></div>
              <div><span className="label">Cover photo</span>{r.photo && <img src={r.photo} alt="Cover preview" className="mb-2 h-32 w-48 rounded-xl object-cover" />}<div className="mb-2 flex flex-wrap items-center gap-2"><label className="btn-ghost cursor-pointer !py-1.5">{r.photo ? "Replace photo" : "Upload photo"}<input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={async (e) => { const f = e.target.files?.[0]; e.target.value = ""; if (!f) return; try { u({ photo: await fileToJpeg(f) }); toast("Photo added"); } catch (er) { toast((er as Error).message, "err"); } }} /></label>{r.photo && <button type="button" className="text-xs underline" onClick={() => u({ photo: undefined })}>Remove</button>}</div><p className="mb-2 text-xs text-brown">Only upload photos you took or have permission to use. No photo? Pick a placeholder emoji below.</p><span className="label">Placeholder emoji</span><div className="flex flex-wrap gap-1.5">{EMOJI.map((e) => <button key={e} type="button" onClick={() => u({ emoji: e })} className={`grid h-10 w-10 place-items-center rounded-xl text-xl ${r.emoji === e ? "bg-orange-light ring-2 ring-orange" : "bg-cream"}`}>{e}</button>)}</div></div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div><label className="label">Cuisine</label><select className="input" value={r.cuisine} onChange={(e) => u({ cuisine: e.target.value })}>{[...CUISINES.slice(1), "Fusion", "Global"].map((c) => <option key={c}>{c}</option>)}</select></div>
                <div><label className="label">Meal</label><select className="input" value={r.meal} onChange={(e) => u({ meal: e.target.value })}>{MEALS.map((c) => <option key={c}>{c}</option>)}</select></div>
                <div><label className="label">Difficulty</label><select className="input" value={r.difficulty} onChange={(e) => u({ difficulty: e.target.value as Recipe["difficulty"] })}><option>Easy</option><option>Medium</option><option>Hard</option></select></div>
                <div><label className="label">Servings</label><input type="number" min={1} max={50} className="input" value={r.servings} onChange={(e) => u({ servings: Math.max(1, Number(e.target.value) || 1) })} /></div>
                <div><label className="label">Prep (min)</label><input type="number" min={0} className="input" value={r.prepMin} onChange={(e) => u({ prepMin: Math.max(0, Number(e.target.value) || 0) })} /></div>
                <div><label className="label">Cook (min)</label><input type="number" min={0} className="input" value={r.cookMin} onChange={(e) => u({ cookMin: Math.max(0, Number(e.target.value) || 0) })} /></div>
              </div>
              <div><span className="label">Categories</span><div className="flex flex-wrap gap-1.5">{MARKET_CATEGORIES.map((c) => <button key={c} type="button" onClick={() => u({ categories: r.categories.includes(c) ? r.categories.filter((x) => x !== c) : [...r.categories, c] })} className={`rounded-full px-2.5 py-1 text-xs font-semibold ${r.categories.includes(c) ? "bg-sage" : "bg-cream"}`}>{c}</button>)}</div></div>
              <div><span className="label">Dietary labels</span><div className="flex flex-wrap gap-1.5">{DIETS.map((c) => <button key={c} type="button" onClick={() => u({ diet: r.diet.includes(c) ? r.diet.filter((x) => x !== c) : [...r.diet, c] })} className={`rounded-full px-2.5 py-1 text-xs font-semibold ${r.diet.includes(c) ? "bg-sage" : "bg-cream"}`}>{c}</button>)}</div></div>
            </div>
            <div className="card p-5"><h2 className="h-display mb-3 text-xl">Ingredients</h2>
              {r.ingredients.map((i, k) => <div key={k} className="mb-2 flex gap-2"><input className="input w-28 sm:w-36" placeholder="Amount" aria-label="Amount" value={i.amount} onChange={(e) => u({ ingredients: arr(r.ingredients, k, { ...i, amount: e.target.value }) })} /><input className="input" placeholder="Ingredient" aria-label="Ingredient" value={i.name} onChange={(e) => u({ ingredients: arr(r.ingredients, k, { ...i, name: e.target.value }) })} /><button className="px-2 text-brown-light" aria-label="Remove ingredient" onClick={() => u({ ingredients: r.ingredients.filter((_, j) => j !== k) })}><G g="✕" /></button></div>)}
              <button className="btn-ghost" onClick={() => u({ ingredients: [...r.ingredients, { name: "", amount: "" }] })}><G g="＋" /> Ingredient</button></div>
            <div className="card p-5"><h2 className="h-display mb-3 text-xl">Method</h2>
              {r.steps.map((s, k) => <div key={k} className="mb-2 flex gap-2"><span className="mt-2 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-charcoal text-xs font-bold text-ivory">{k + 1}</span><textarea className="input" rows={2} aria-label={`Step ${k + 1}`} value={s.text} onChange={(e) => u({ steps: arr(r.steps, k, { ...s, text: e.target.value }) })} /><input type="number" min={0} className="input !w-20" placeholder="min" aria-label="Timer minutes" title="Optional timer (minutes)" value={s.timerMin ?? ""} onChange={(e) => u({ steps: arr(r.steps, k, { ...s, timerMin: e.target.value ? Number(e.target.value) : undefined }) })} /><button className="px-2 text-brown-light" aria-label="Remove step" onClick={() => u({ steps: r.steps.filter((_, j) => j !== k) })}><G g="✕" /></button></div>)}
              <button className="btn-ghost" onClick={() => u({ steps: [...r.steps, { text: "" }] })}><G g="＋" /> Step</button></div>
            <div className="card space-y-3 p-5"><div className="flex items-center justify-between"><h2 className="h-display text-xl">Nutrition &amp; allergens</h2><button className="btn-ghost !py-1.5" onClick={estimate}>Estimate from ingredients</button></div>
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-7">{(Object.keys(r.nutrition) as (keyof Recipe["nutrition"])[]).map((k) => <div key={k}><label className="label">{k}</label><input type="number" min={0} className="input !px-2" value={r.nutrition[k]} onChange={(e) => u({ nutrition: { ...r.nutrition, [k]: Math.max(0, Number(e.target.value) || 0) } })} /></div>)}</div>
              <p className="text-xs text-brown">Per serving. Shown to buyers as an estimate, so enter honest values.</p>
              <div><span className="label">Allergens (contains)</span><div className="flex flex-wrap gap-1.5">{ALLERGENS.map((c) => <button key={c} type="button" onClick={() => u({ allergens: r.allergens.includes(c) ? r.allergens.filter((x) => x !== c) : [...r.allergens, c] })} className={`rounded-full px-2.5 py-1 text-xs font-semibold ${r.allergens.includes(c) ? "bg-orange" : "bg-cream"}`}>{c}</button>)}</div></div>
              <div><label className="label" htmlFor="re">Equipment (comma separated)</label><input id="re" className="input" value={r.equipment.join(", ")} onChange={(e) => u({ equipment: e.target.value.split(",").map((x) => x.trim()).filter(Boolean) })} /></div>
              <div><label className="label" htmlFor="rs">Substitutions (one per line)</label><textarea id="rs" className="input" rows={2} value={r.substitutions.join("\n")} onChange={(e) => u({ substitutions: e.target.value.split("\n").filter((x) => x.trim()) })} /></div>
              <div><label className="label" htmlFor="rst">Storage</label><input id="rst" className="input" value={r.storage} onChange={(e) => u({ storage: e.target.value })} /></div>
            </div>
          </div>
          <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start">
            <div className="card p-5"><h2 className="h-display text-xl">Pricing</h2>
              <label className="label mt-2" htmlFor="rp">Price (USD, 0 = free)</label><input id="rp" type="number" min={0} max={50} step={0.5} className="input" value={r.price} onChange={(e) => u({ price: Math.max(0, Math.min(50, Number(e.target.value) || 0)) })} />
              {r.price > 0 && <p className="mt-2 text-xs text-brown">Buyer pays {money(r.price)}. After CRUNCH's {MARKET_FEE * 100}% commission you earn about {money(Math.round(earn * 100) / 100)} (payment-processor fees extra).</p>}
              {ageOf(me) < MIN_AGE_COMMERCE && <p className="mt-2 rounded-lg bg-orange-light/50 p-2 text-xs">Selling requires age {MIN_AGE_COMMERCE}+.</p>}</div>
            <div className="card p-5 text-sm"><h2 className="h-display text-xl">Creator guidelines</h2><ul className="mt-2 list-disc space-y-1 pl-5 text-brown"><li>Only publish recipes you created or have the right to sell.</li><li>Don't copy other creators' recipes, photos or text.</li><li>Be accurate about allergens and safe cooking temperatures.</li><li>No unsafe or inedible combinations.</li></ul>
              <label className="mt-3 flex items-start gap-2 text-xs"><input type="checkbox" className="mt-0.5 accent-orange" checked={original} onChange={(e) => setOriginal(e.target.checked)} />I confirm this is my original work and I agree to the creator guidelines.</label></div>
            <div className="flex flex-col gap-2"><button className="btn-primary" onClick={() => save("published")}>Publish</button><button className="btn-dark" onClick={() => save("draft")}>Save draft</button></div>
          </aside>
        </div>
      )}
    </div>
  );
}
