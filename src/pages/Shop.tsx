import { useMemo, useState } from "react";
import { G } from "../icons";
import { Link, useParams } from "react-router-dom";
import { CATEGORIES } from "../data";
import { DISCLAIMER_ALLERGEN, DISCLAIMER_NUTRITION, matchScore } from "../engine";
import { useCatalogue, useIngredients, useOwnedIds, useStore } from "../store";
import { Empty, Meter, PageHeader, RecipeCard, Tabs, toast } from "../ui";
import type { Category } from "../types";

export default function Shop() {
  const { id } = useParams(); const ings = useIngredients();
  const [q, setQ] = useState(""); const [cat, setCat] = useState<"All" | Category>("All");
  const shown = useMemo(() => ings.filter((i) => cat === "All" || i.category === cat).map((i) => ({ i, s: matchScore(q, i.name) })).filter((x) => x.s > 0).sort((a, b) => b.s - a.s).map((x) => x.i), [ings, cat, q]);
  if (id) return <Detail id={id} />;
  return (
    <div>
      <PageHeader title="Ingredient Shop" sub="Explore what's in your kitchen: flavour, storage, nutrition, substitutions and the recipes that use it." />
      <input className="input mb-3 max-w-md" placeholder="Search ingredients…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search ingredients" />
      <Tabs tabs={["All", ...CATEGORIES] as readonly ("All" | Category)[]} value={cat} onChange={setCat} />
      {shown.length === 0 ? <Empty emoji="🥕" title="No ingredients found" /> : <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6">{shown.map((i) => <Link key={i.id} to={`/shop/${i.id}`} className="card p-4 text-center transition hover:-translate-y-1 hover:shadow-card-hover"><div className="text-5xl">{i.emoji}</div><b className="mt-1 block text-sm">{i.name}</b><span className="text-xs text-brown">{i.category}</span></Link>)}</div>}
    </div>
  );
}

function Detail({ id }: { id: string }) {
  const ings = useIngredients(); const i = ings.find((x) => x.id === id); const cat = useCatalogue(); const owned = useOwnedIds(); const { lists, addToList, createList } = useStore();
  const [listId, setListId] = useState(lists[0]?.id ?? "");
  if (!i) return <Empty emoji="🔍" title="Ingredient not found" action={<Link to="/shop" className="btn-primary">Ingredient Shop</Link>} />;
  const related = cat.filter((r) => r.status === "published" && !r.bundleOf && r.ingredients.some((x) => x.name.toLowerCase().includes(i.name.toLowerCase()))).slice(0, 4);
  const n = i.per100g;
  return (
    <div>
      <Link to="/shop" className="text-sm font-semibold text-brown">← Ingredient Shop</Link>
      <div className="mt-3 grid gap-6 lg:grid-cols-[320px_1fr]">
        <div className="card grid place-items-center p-8 text-center"><div className="text-[8rem] leading-none">{i.emoji}</div><h1 className="h-display mt-2 text-3xl">{i.name}</h1><span className="chip mt-1">{i.category}</span>
          <div className="mt-5 w-full"><select className="input mb-2" value={listId} onChange={(e) => setListId(e.target.value)} aria-label="Shopping list">{lists.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}</select>
            <button className="btn-primary w-full" onClick={() => { const lid = listId || createList("Groceries"); addToList(lid, [{ name: i.name, category: i.category }]); toast(`${i.name} added to your list`); }}><G g="＋" /> Add to shopping list</button></div></div>
        <div className="space-y-5">
          <div className="card p-5"><p>{i.description}</p><h2 className="mt-4 font-semibold">Common uses</h2><div className="mt-1 flex flex-wrap gap-1.5">{i.uses.map((u) => <span key={u} className="chip">{u}</span>)}</div></div>
          <div className="grid gap-5 md:grid-cols-2">
            <div className="card p-5"><h2 className="mb-3 font-semibold">Flavour profile</h2><div className="space-y-2">{(Object.entries(i.taste) as [string, number][]).length ? (Object.entries(i.taste) as [string, number][]).map(([k, v]) => <Meter key={k} label={k[0].toUpperCase() + k.slice(1)} value={v * 20} />) : <p className="text-sm text-brown">Mild.</p>}</div><p className="mt-3 text-xs text-brown">Texture: {i.textures.join(", ")}</p></div>
            <div className="card p-5"><h2 className="mb-2 font-semibold">Nutrition per 100 g</h2>{i.custom ? <p className="text-sm text-brown">No nutrition data for custom ingredients.</p> : <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">{([["Calories", n.calories, "kcal"], ["Protein", n.protein, "g"], ["Carbs", n.carbs, "g"], ["Fat", n.fat, "g"], ["Fibre", n.fiber, "g"], ["Sugar", n.sugar, "g"], ["Sodium", n.sodium, "mg"]] as const).map(([l, v, u]) => <div key={l} className="flex justify-between border-b border-cream py-1"><dt>{l}</dt><dd className="font-semibold">{v} {u}</dd></div>)}</dl>}<p className="mt-2 text-xs text-brown">{DISCLAIMER_NUTRITION}</p></div>
          </div>
          <div className="grid gap-5 md:grid-cols-2">
            <div className="card p-5"><h2 className="font-semibold">Storage</h2><p className="mt-1 text-sm text-brown">{i.storage}</p><h2 className="mt-4 font-semibold">Substitutions</h2><p className="mt-1 text-sm text-brown">{i.substitutes.length ? i.substitutes.join(" · ") : "No common substitutes listed."}</p></div>
            <div className="card p-5"><h2 className="font-semibold">Common allergens</h2><div className="mt-1 flex flex-wrap gap-1.5">{i.allergens.length ? i.allergens.map((a) => <span key={a} className="chip bg-orange-light">{a}</span>) : <span className="text-sm text-brown">None commonly listed</span>}</div><p className="mt-2 text-xs text-brown">{DISCLAIMER_ALLERGEN}</p></div>
          </div>
          <div className="card p-5"><h2 className="font-semibold">Where to buy</h2><p className="mt-1 text-sm text-brown">Grocery retailer integrations (products, package sizes, live prices and availability) are <b>coming soon</b>. CRUNCH doesn't show prices or stock it can't verify. For now, add this to a shopping list and take it to your usual store.</p></div>
        </div>
      </div>
      {related.length > 0 && <section className="mt-8"><h2 className="h-display mb-3 text-2xl">Recipes using {i.name.toLowerCase()}</h2><div className="grid grid-cols-2 gap-4 lg:grid-cols-4">{related.map((r) => <RecipeCard key={r.id} r={r} owned={owned.has(r.id)} />)}</div></section>}
    </div>
  );
}
