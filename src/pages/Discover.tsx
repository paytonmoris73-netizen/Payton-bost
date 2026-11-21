import { useState } from "react";
import { Link } from "react-router-dom";
import { CREATORS, MARKET_CATEGORIES } from "../data";
import { totalMin } from "../engine";
import { FilterPanel, defaultFilters, useFiltered, useVisibleRecipes } from "../filters";
import { useCatalogue, useOwnedIds } from "../store";
import { Avatar, Empty, PageHeader, RecipeCard, Section, useLoading, CardSkeletons } from "../ui";

export default function Discover() {
  const cat = useCatalogue(); const owned = useOwnedIds(); const loading = useLoading(300);
  const vis = useVisibleRecipes(cat).filter((r) => !r.bundleOf);
  const [f, setF] = useState(defaultFilters); const [browsing, setBrowsing] = useState(false);
  const res = useFiltered(vis, f);
  const trending = [...vis].sort((a, b) => b.views - a.views).slice(0, 4);
  const fresh = [...vis].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 4);
  const quick = vis.filter((r) => totalMin(r) <= 25).slice(0, 4);
  const season = vis.filter((r) => r.seasonal).slice(0, 4);
  const pick = (c: string) => { setF({ ...defaultFilters, category: c }); setBrowsing(true); };
  return (
    <div>
      <PageHeader title="Discover" sub="Find your next favourite dish by mood, cuisine, time or diet." action={<button className="btn-dark" onClick={() => { setBrowsing(!browsing); setF(defaultFilters); }}>{browsing ? "← Back to highlights" : "Browse & filter all"}</button>} />
      <div className="no-scrollbar -mx-4 mb-6 flex gap-2 overflow-x-auto px-4 md:mx-0 md:px-0">{MARKET_CATEGORIES.map((c) => <button key={c} onClick={() => pick(c)} className="chip shrink-0 !px-4 !py-2 hover:bg-orange-light">{c}</button>)}</div>
      {browsing ? (
        <>
          <input className="input mb-3 max-w-md" placeholder="Search within recipes…" value={f.q} onChange={(e) => setF({ ...f, q: e.target.value })} aria-label="Search recipes" />
          <FilterPanel f={f} set={setF} />
          <p className="mb-3 text-sm text-brown">{res.length} recipe{res.length === 1 ? "" : "s"}{f.category !== "Any" ? ` in ${f.category}` : ""}</p>
          {res.length ? <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">{res.map((r) => <RecipeCard key={r.id} r={r} owned={owned.has(r.id)} />)}</div> : <Empty emoji="🔎" title="Nothing matches those filters" text="Try loosening a filter." action={<button className="btn-primary" onClick={() => setF(defaultFilters)}>Reset filters</button>} />}
        </>
      ) : loading ? <CardSkeletons /> : (
        <>
          <Section title="Trending now">{<Grid list={trending} owned={owned} />}</Section>
          <Section title="New releases"><Grid list={fresh} owned={owned} /></Section>
          <Section title="Ready in 25 minutes or less"><Grid list={quick} owned={owned} /></Section>
          {season.length > 0 && <Section title="In season"><Grid list={season} owned={owned} /></Section>}
          <Section title="Creators to follow" to="/community">
            <div className="no-scrollbar flex gap-3 overflow-x-auto">{CREATORS.map((c) => <Link key={c.id} to={`/creator/${c.id}`} className="card flex w-44 shrink-0 flex-col items-center p-4 text-center transition hover:-translate-y-1"><Avatar emoji={c.emoji} hue={c.hue} size={56} /><b className="mt-2 text-sm">{c.name}</b><span className="text-xs text-brown">{c.badges[0]}</span></Link>)}</div>
          </Section>
        </>
      )}
    </div>
  );
}
function Grid({ list, owned }: { list: ReturnType<typeof useCatalogue>; owned: Set<string> }) { return <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">{list.map((r) => <RecipeCard key={r.id} r={r} owned={owned.has(r.id)} />)}</div>; }
