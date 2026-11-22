import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { CREATORS } from "../data";
import { matchScore, comboToItems } from "../engine";
import { FilterPanel, defaultFilters, useFiltered, useVisibleRecipes } from "../filters";
import { useCatalogue, useIngredients, useOwnedIds, useStore } from "../store";
import { Avatar, Empty, PageHeader, RecipeCard, Tabs } from "../ui";

const TABS = ["All", "Recipes", "Marketplace", "Ingredients", "Creators", "Combinations", "Collections", "Posts"] as const;

export default function Search() {
  const [p, setP] = useSearchParams(); const q = p.get("q") ?? ""; const [tab, setTab] = useState<(typeof TABS)[number]>("All"); const [f, setF] = useState(defaultFilters);
  const cat = useCatalogue(); const owned = useOwnedIds(); const ings = useIngredients(); const combos = useStore((s) => s.combos); const posts = useStore((s) => s.posts); const record = useStore((s) => s.recordSearch);
  const vis = useVisibleRecipes(cat); const [local, setLocal] = useState(q);
  useEffect(() => { setLocal(q); setF((x) => ({ ...x, q })); }, [q]);
  const recipes = useFiltered(vis.filter((r) => !r.bundleOf), f);
  const market = useFiltered(vis.filter((r) => r.price > 0 && !r.bundleOf), f);
  const bundles = useFiltered(vis.filter((r) => !!r.bundleOf), f);
  const iRes = useMemo(() => ings.map((i) => ({ i, s: matchScore(q, i.name) })).filter((x) => x.s > 0).sort((a, b) => b.s - a.s).map((x) => x.i), [ings, q]);
  const cRes = CREATORS.filter((c) => matchScore(q, c.name + " " + c.handle + " " + c.bio) > 0);
  const comboRes = combos.filter((c) => matchScore(q, c.name + " " + c.notes + " " + comboToItems(c, ings).map((i) => i.ing.name).join(" ")) > 0);
  const postRes = posts.filter((x) => !x.hidden && matchScore(q, x.text + " " + x.ingredients.join(" ")) > 0);
  const show = (t: (typeof TABS)[number]) => tab === "All" || tab === t;
  const total = recipes.length + iRes.length + cRes.length + comboRes.length + postRes.length + bundles.length;
  const didYouMean = total === 0 && q ? ings.map((i) => ({ n: i.name, s: matchScore(q.slice(0, 5), i.name) })).filter((x) => x.s > 0)[0]?.n : undefined;
  return (
    <div>
      <PageHeader title={q ? `Results for “${q}”` : "Search"} sub={q ? `${total} results` : "Search recipes, ingredients, creators, combinations, listings, collections and posts."} />
      <form className="mb-4 max-w-xl" onSubmit={(e) => { e.preventDefault(); record(local); setP({ q: local }); }}><input className="input" value={local} onChange={(e) => setLocal(e.target.value)} placeholder="Search CRUNCH…" aria-label="Search" autoFocus /></form>
      <Tabs tabs={TABS} value={tab} onChange={setTab} />
      {(tab === "All" || tab === "Recipes" || tab === "Marketplace") && <FilterPanel f={f} set={setF} />}
      {!q && <Empty emoji="🔎" title="What are you hungry for?" text="Try “garlic noodles”, “mango”, or a creator's name. Small typos are fine." />}
      {q && total === 0 && <Empty emoji="🤷" title="No results" text={didYouMean ? `Did you mean “${didYouMean}”?` : "Try a different spelling or fewer words."} />}
      {q && show("Recipes") && recipes.length > 0 && <Block title="Recipes"><div className="stagger grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-4">{recipes.map((r) => <RecipeCard key={r.id} r={r} owned={owned.has(r.id)} />)}</div></Block>}
      {q && tab === "Marketplace" && market.length > 0 && <Block title="Marketplace listings"><div className="stagger grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-4">{market.map((r) => <RecipeCard key={r.id} r={r} owned={owned.has(r.id)} />)}</div></Block>}
      {q && show("Collections") && bundles.length > 0 && <Block title="Collections"><div className="stagger grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-4">{bundles.map((r) => <RecipeCard key={r.id} r={r} owned={owned.has(r.id)} />)}</div></Block>}
      {q && show("Ingredients") && iRes.length > 0 && <Block title="Ingredients"><div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">{iRes.slice(0, 12).map((i) => <Link key={i.id} to={`/shop/${i.id}`} className="card p-3 text-center lift"><div className="text-4xl">{i.emoji}</div><b className="text-sm">{i.name}</b><div className="text-xs text-brown">{i.category}</div></Link>)}</div></Block>}
      {q && show("Creators") && cRes.length > 0 && <Block title="Creators"><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{cRes.map((c) => <Link key={c.id} to={`/creator/${c.id}`} className="card flex items-center gap-3 p-4"><Avatar emoji={c.emoji} hue={c.hue} size={48} /><span><b className="block">{c.name}</b><span className="text-xs text-brown">{c.handle}</span></span></Link>)}</div></Block>}
      {q && show("Combinations") && comboRes.length > 0 && <Block title="Your combinations"><div className="grid gap-3 sm:grid-cols-2">{comboRes.map((c) => <Link key={c.id} to={`/combiner?combo=${c.id}`} className="card p-4"><b>{c.name}</b><p className="text-xs text-brown">{comboToItems(c, ings).map((i) => i.ing.name).join(", ")}</p></Link>)}</div></Block>}
      {q && show("Posts") && postRes.length > 0 && <Block title="Community posts"><div className="grid gap-3 sm:grid-cols-2">{postRes.map((x) => <Link key={x.id} to="/community" className="card p-4"><b>{x.userEmoji} {x.userName}</b><p className="text-sm text-brown">{x.text}</p></Link>)}</div></Block>}
    </div>
  );
}
function Block({ title, children }: { title: string; children: React.ReactNode }) { return <section className="mb-8"><h2 className="h-display mb-3 text-2xl">{title}</h2>{children}</section>; }
