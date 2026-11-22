import { useMemo, useState } from "react";
import { G } from "./icons";
import { CUISINES, DIETS, MARKET_CATEGORIES } from "./data";
import { matchScore, totalMin } from "./engine";
import { useStore } from "./store";
import type { Recipe } from "./types";
import { Select } from "./glass";

export interface Filters { q: string; maxPrice: number; minRating: number; maxTime: number; difficulty: string; cuisine: string; diet: string[]; category: string; ingredient: string; sort: string }
export const defaultFilters: Filters = { q: "", maxPrice: 20, minRating: 0, maxTime: 600, difficulty: "Any", cuisine: "Any", diet: [], category: "Any", ingredient: "", sort: "relevance" };

export function useFiltered(list: Recipe[], f: Filters) {
  return useMemo(() => {
    const rows = list
      .filter((r) => r.price <= f.maxPrice && r.rating >= f.minRating && (r.bundleOf || totalMin(r) <= f.maxTime) && (f.difficulty === "Any" || r.difficulty === f.difficulty) && (f.cuisine === "Any" || r.cuisine === f.cuisine) && f.diet.every((d) => r.diet.includes(d)) && (f.category === "Any" || r.categories.includes(f.category) || r.meal === f.category) && (!f.ingredient.trim() || r.ingredients.some((i) => matchScore(f.ingredient, i.name) > 0)))
      .map((r) => ({ r, s: f.q.trim() ? Math.max(matchScore(f.q, r.title), matchScore(f.q, r.cuisine) * 0.6, matchScore(f.q, r.description) * 0.3, ...r.ingredients.map((i) => matchScore(f.q, i.name) * 0.5)) : 1 }))
      .filter((x) => x.s > 0);
    const by: Record<string, (a: { r: Recipe; s: number }, b: { r: Recipe; s: number }) => number> = {
      relevance: (a, b) => b.s - a.s || b.r.rating - a.r.rating, rating: (a, b) => b.r.rating - a.r.rating, "price-asc": (a, b) => a.r.price - b.r.price, "price-desc": (a, b) => b.r.price - a.r.price,
      quick: (a, b) => totalMin(a.r) - totalMin(b.r), newest: (a, b) => b.r.createdAt.localeCompare(a.r.createdAt), popular: (a, b) => b.r.sales + b.r.views / 10 - (a.r.sales + a.r.views / 10),
    };
    return rows.sort(by[f.sort] ?? by.relevance).map((x) => x.r);
  }, [list, f]);
}

export function FilterPanel({ f, set, showPrice = true }: { f: Filters; set: (f: Filters) => void; showPrice?: boolean }) {
  const [open, setOpen] = useState(false); const u = (p: Partial<Filters>) => set({ ...f, ...p });
  const active = JSON.stringify({ ...f, q: "", sort: "" }) !== JSON.stringify({ ...defaultFilters, q: "", sort: "" });
  return (
    <div className="mb-5">
      <div className="flex flex-wrap items-center gap-2">
        <button className="btn-ghost" onClick={() => setOpen(!open)} aria-expanded={open}><G g="⚙" /> Filters{active ? " •" : ""}</button>
        <Select className="!w-auto" label="Sort" value={f.sort} onChange={(v) => u({ sort: v })} options={[{ value: "relevance", label: "Best match" }, { value: "rating", label: "Top rated" }, { value: "popular", label: "Most popular" }, { value: "newest", label: "Newest" }, { value: "quick", label: "Quickest" }, ...(showPrice ? [{ value: "price-asc", label: "Price: low to high" }, { value: "price-desc", label: "Price: high to low" }] : [])]} />
        {active && <button className="text-sm font-semibold text-brown underline" onClick={() => set({ ...defaultFilters, q: f.q, sort: f.sort })}>Reset</button>}
      </div>
      {open && (
        <div className="card rise-in mt-3 grid gap-4 p-4 sm:grid-cols-2 lg:grid-cols-4">
          {showPrice && <div><label className="label">Max price: {f.maxPrice >= 20 ? "any" : `$${f.maxPrice}`}</label><input type="range" min={0} max={20} step={1} value={f.maxPrice} onChange={(e) => u({ maxPrice: Number(e.target.value) })} className="w-full accent-orange" /></div>}
          <div><label className="label">Min rating: {f.minRating || "any"}</label><input type="range" min={0} max={5} step={0.5} value={f.minRating} onChange={(e) => u({ minRating: Number(e.target.value) })} className="w-full accent-orange" /></div>
          <div><label className="label">Max time: {f.maxTime >= 600 ? "any" : `${f.maxTime} min`}</label><input type="range" min={15} max={600} step={15} value={f.maxTime} onChange={(e) => u({ maxTime: Number(e.target.value) })} className="w-full accent-orange" /></div>
          <div><label className="label" htmlFor="fd">Difficulty</label><Select id="fd" label="Difficulty" value={f.difficulty} onChange={(v) => u({ difficulty: v })} options={["Any", "Easy", "Medium", "Hard"]} /></div>
          <div><label className="label" htmlFor="fc">Cuisine</label><Select id="fc" label="Cuisine" value={f.cuisine} onChange={(v) => u({ cuisine: v })} options={[...CUISINES, "Fusion", "Global"].filter((v, i, a) => a.indexOf(v) === i)} /></div>
          <div><label className="label" htmlFor="fk">Category</label><Select id="fk" label="Category" value={f.category} onChange={(v) => u({ category: v })} options={["Any", ...MARKET_CATEGORIES]} /></div>
          <div><label className="label" htmlFor="fi">Contains ingredient</label><input id="fi" className="input" value={f.ingredient} onChange={(e) => u({ ingredient: e.target.value })} placeholder="e.g. garlic" /></div>
          <div><span className="label">Dietary</span><div className="flex flex-wrap gap-1.5">{DIETS.map((d) => <button key={d} onClick={() => u({ diet: f.diet.includes(d) ? f.diet.filter((x) => x !== d) : [...f.diet, d] })} className="pick sm sage" aria-pressed={f.diet.includes(d)}>{d}</button>)}</div></div>
        </div>
      )}
    </div>
  );
}

export function useVisibleRecipes(all: Recipe[]) {
  const banned = useStore((s) => s.banned);
  return all.filter((r) => r.status === "published" && !banned.includes(r.creatorId));
}
