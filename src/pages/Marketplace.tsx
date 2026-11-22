import { useState } from "react";
import { Link } from "react-router-dom";
import { CREATORS, MARKET_CATEGORIES } from "../data";
import { MARKET_FEE } from "../engine";
import { FilterPanel, defaultFilters, useFiltered, useVisibleRecipes } from "../filters";
import { useCatalogue, useOwnedIds, useStore } from "../store";
import { Avatar, CardSkeletons, Empty, PageHeader, RecipeCard, Section, Stars, useLoading } from "../ui";
import type { Recipe } from "../types";

export default function Marketplace() {
  const cat = useCatalogue(); const owned = useOwnedIds(); const loading = useLoading(300); const { featuredIds, saved, recent } = useStore();
  const vis = useVisibleRecipes(cat).filter((r) => r.price > 0);
  const [f, setF] = useState({ ...defaultFilters, maxPrice: 20 }); const [browse, setBrowse] = useState(false);
  const res = useFiltered(vis, f);
  const solo = vis.filter((r) => !r.bundleOf);
  // Phones: always 2 columns. PC: as many columns as there are cards (min `min`), so rows never have holes.
  const LG = ["", "lg:grid-cols-1", "lg:grid-cols-2", "lg:grid-cols-3", "lg:grid-cols-4"];
  const grid = (l: Recipe[], max = 4, min = 3) => { const shown = l.slice(0, max); return <div className={`stagger grid grid-cols-2 gap-3 sm:gap-4 ${LG[Math.max(min, Math.min(shown.length, max))]}`}>{shown.map((r) => <RecipeCard key={r.id} r={r} owned={owned.has(r.id)} />)}</div>; };
  const pair = "lg:grid lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] lg:gap-6";
  const interest = new Set([...saved, ...recent].map((id) => cat.find((r) => r.id === id)?.cuisine));
  const personal = solo.filter((r) => interest.has(r.cuisine) && !owned.has(r.id));
  return (
    <div>
      <PageHeader title="Recipe Marketplace" sub="Original recipes from independent creators. Buy once, keep in your cookbook." action={<div className="flex gap-2"><Link to="/creator/studio" className="btn-ghost">Creator studio</Link><Link to="/creator/new" className="btn-primary">Sell a recipe</Link></div>} />
      <div className="no-scrollbar -mx-4 mb-6 flex gap-2 overflow-x-auto px-4 md:mx-0 md:px-0">
        <button className="chip nav-pill nav-on shrink-0 !px-4 !py-2" onClick={() => { setBrowse(!browse); setF(defaultFilters); }}>{browse ? "← Highlights" : "Browse all & filter"}</button>
        {MARKET_CATEGORIES.map((c) => <button key={c} onClick={() => { setF({ ...defaultFilters, category: c }); setBrowse(true); }} className="chip shrink-0 !px-4 !py-2 hover:bg-orange-light">{c}</button>)}
      </div>
      {browse ? (
        <>
          <input className="input mb-3 max-w-md" placeholder="Search listings…" value={f.q} onChange={(e) => setF({ ...f, q: e.target.value })} aria-label="Search listings" />
          <FilterPanel f={f} set={setF} />
          {res.length ? <div className="stagger grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-4">{res.map((r) => <RecipeCard key={r.id} r={r} owned={owned.has(r.id)} />)}</div> : <Empty emoji="🛍️" title="No listings match" action={<button className="btn-primary" onClick={() => setF(defaultFilters)}>Reset filters</button>} />}
        </>
      ) : loading ? <CardSkeletons /> : (
        <>
          <Section title="Featured recipes">{grid(solo.filter((r) => featuredIds.includes(r.id) || r.featured))}</Section>
          <Section title="Trending">{grid([...solo].sort((a, b) => b.views - a.views))}</Section>
          <Section title="Best sellers">{grid([...solo].sort((a, b) => b.sales - a.sales))}</Section>
          <Section title="New releases">{grid([...solo].sort((a, b) => b.createdAt.localeCompare(a.createdAt)))}</Section>
          <Section title="Editor's picks" sub="Hand-picked by the CRUNCH team">{grid(solo.filter((r) => featuredIds.includes(r.id)).reverse())}</Section>
          {(() => { const b = vis.filter((r) => r.bundleOf); const seasonal = solo.filter((r) => r.seasonal); return (
            // Same order as always on phones (collections, under $5, seasonal). On PC "under $5" moves up a row
            // so collections and seasonal can share one row instead of leaving gaps.
            <div className={seasonal.length ? pair : ""}>
              <div className={seasonal.length ? "lg:order-2" : ""}><Section title="Premium collections" sub="Bundles save you money">{b.length ? grid(b, seasonal.length ? 2 : 4, seasonal.length ? 2 : 3) : <p className="text-sm text-brown">No collections yet.</p>}</Section></div>
              <div className={seasonal.length ? "lg:order-1 lg:col-span-2" : ""}><Section title="Recipes under $5">{grid(solo.filter((r) => r.price < 5))}</Section></div>
              {seasonal.length > 0 && <div className="lg:order-3"><Section title="Seasonal">{grid(seasonal, 1, 1)}</Section></div>}
            </div>); })()}
          <div className={personal.length ? pair : ""}>
          {personal.length > 0 && <Section title="Recommended for you" sub="Based on cuisines you've saved or viewed">{grid(personal, 2, 2)}</Section>}
          <Section title="Top-rated creators">
            <div className={`grid gap-3 sm:grid-cols-2 ${personal.length ? "lg:grid-cols-1" : "lg:grid-cols-3"}`}>{[...CREATORS].sort((a, b) => b.rating - a.rating).slice(0, 3).map((c) => <Link key={c.id} to={`/creator/${c.id}`} className="card flex items-center gap-3 p-4 lift"><Avatar emoji={c.emoji} hue={c.hue} size={52} /><span><b className="block">{c.name}</b><span className="flex items-center gap-1 text-xs text-brown"><Stars value={c.rating} /> {c.rating}</span></span></Link>)}</div>
          </Section>
          </div>
        </>
      )}
      <div className="card mt-6 grid gap-6 p-6 md:grid-cols-3">
        <div><h3 className="h-display text-xl">How the marketplace works</h3><p className="mt-1 text-sm text-brown">Creators set their own prices. Buyers unlock the full recipe and keep it in My Cookbook for personal use. Recipes are for personal cooking, not resale or redistribution.</p></div>
        <div><h3 className="h-display text-xl">Fees</h3><p className="mt-1 text-sm text-brown">CRUNCH keeps a {MARKET_FEE * 100}% commission on each sale. Payment-processor fees may also apply. No listing fees.</p></div>
        <div><h3 className="h-display text-xl">Trust &amp; safety</h3><p className="mt-1 text-sm text-brown">Only verified buyers can review. Listings are checked for duplicates and unsafe advice. Refunds can be requested from your order history. Report any listing from its page.</p></div>
      </div>
    </div>
  );
}
