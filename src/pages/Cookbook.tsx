import { useState } from "react";
import { Link } from "react-router-dom";
import { matchScore } from "../engine";
import { comboToItems } from "../engine";
import { useCatalogue, useIngredients, useMe, useOwnedIds, useStore } from "../store";
import { Empty, PageHeader, RecipeCard, Tabs, toast } from "../ui";

const TABS = ["Purchased", "Saved", "Created", "Favourites", "Combinations", "Folders", "Recently cooked", "Shopping lists"] as const;

export default function Cookbook({ saved: onlySaved }: { saved?: boolean }) {
  const me = useMe()!; const cat = useCatalogue(); const owned = useOwnedIds(); const ings = useIngredients();
  const { saved, favorites, combos, folders, addFolder, deleteFolder, toggleInFolder, cooked, lists, deleteCombo, purchases } = useStore();
  const [tab, setTab] = useState<(typeof TABS)[number]>(onlySaved ? "Saved" : "Purchased"); const [q, setQ] = useState(""); const [name, setName] = useState(""); const [open, setOpen] = useState<string | null>(null);
  const byId = (id: string) => cat.find((r) => r.id === id);
  const filt = <T extends { title: string }>(l: T[]) => l.filter((r) => !q.trim() || matchScore(q, r.title) > 0);
  const purchased = filt(cat.filter((r) => owned.has(r.id) && r.price > 0));
  const savedR = filt(saved.map(byId).filter((r): r is NonNullable<typeof r> => !!r && (r.status === "published" || r.creatorId === me.id)));
  const created = filt(cat.filter((r) => r.creatorId === me.id));
  const favs = filt(favorites.map(byId).filter((r): r is NonNullable<typeof r> => !!r));
  const cookedR = cooked.map((c) => ({ ...c, r: byId(c.id) })).filter((x) => x.r);
  const grid = (l: typeof cat, empty: string, to?: string) => l.length ? <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">{l.map((r) => <RecipeCard key={r.id} r={r} owned={owned.has(r.id)} />)}</div> : <Empty emoji="📖" title={empty} action={to ? <Link to={to} className="btn-primary">Explore</Link> : undefined} />;
  return (
    <div>
      <PageHeader title={onlySaved ? "Saved Recipes" : "My Cookbook"} sub="Everything you've bought, saved, created and cooked — in one place." />
      <input className="input mb-3 max-w-md" placeholder="Search your cookbook…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search your cookbook" />
      <Tabs tabs={TABS} value={tab} onChange={setTab} />
      {tab === "Purchased" && (<>{grid(purchased, "No purchased recipes yet", "/marketplace")}{purchases.length > 0 && <p className="mt-3 text-sm"><Link to="/marketplace/cart" className="font-semibold underline">View purchase history</Link></p>}</>)}
      {tab === "Saved" && grid(savedR, "Nothing saved yet", "/discover")}
      {tab === "Created" && <>{grid(created, "You haven't created any recipes")}<div className="mt-4 flex gap-2"><Link to="/creator/new" className="btn-primary">Write a recipe</Link><Link to="/chef?tab=generate" className="btn-ghost">Generate with AI</Link></div></>}
      {tab === "Favourites" && grid(favs, "No favourites yet. Star a recipe to see it here.")}
      {tab === "Combinations" && (combos.length ? <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{combos.filter((c) => !q.trim() || matchScore(q, c.name) > 0).map((c) => <div key={c.id} className="card overflow-hidden">{c.photo && <img src={c.photo} alt="" className="h-36 w-full object-cover" />}<div className="p-4"><b>{c.name}</b><p className="text-xs text-brown">{comboToItems(c, ings).map((i) => `${i.ing.emoji} ${i.ing.name}`).join(" · ")}</p>{c.notes && <p className="mt-1 text-xs">{c.notes}</p>}<div className="mt-3 flex gap-2"><Link className="btn-dark !py-1.5" to={`/combiner?combo=${c.id}`}>Open</Link><button className="btn-ghost !py-1.5" onClick={() => { if (confirm("Delete this combination?")) deleteCombo(c.id); }}>Delete</button></div></div></div>)}</div> : <Empty emoji="🥕" title="No saved combinations" action={<Link to="/combiner" className="btn-primary">Open Food Combiner</Link>} />)}
      {tab === "Folders" && (
        <div>
          <form className="mb-4 flex max-w-md gap-2" onSubmit={(e) => { e.preventDefault(); if (name.trim().length < 2) return toast("Name your folder.", "err"); addFolder(name.trim().slice(0, 40)); setName(""); }}><input className="input" placeholder="New folder (e.g. Weekend Cooking)" value={name} onChange={(e) => setName(e.target.value)} aria-label="New folder name" /><button className="btn-dark">Create</button></form>
          <div className="space-y-3">{folders.map((f) => { const rs = f.recipeIds.map(byId).filter(Boolean) as typeof cat; return (
            <div key={f.id} className="card p-4"><div className="flex items-center justify-between"><button className="text-left" onClick={() => setOpen(open === f.id ? null : f.id)}><b>📁 {f.name}</b> <span className="text-xs text-brown">{rs.length} recipes</span></button><button className="text-xs text-brown underline" onClick={() => { if (confirm(`Delete folder “${f.name}”? Recipes are kept.`)) deleteFolder(f.id); }}>Delete</button></div>
              {open === f.id && <div className="mt-3">{rs.length ? <div className="grid grid-cols-2 gap-3 md:grid-cols-4">{rs.map((r) => <div key={r.id} className="relative"><RecipeCard r={r} owned={owned.has(r.id)} /><button className="absolute bottom-2 right-2 rounded-full bg-white px-2 py-0.5 text-xs shadow-card" onClick={() => toggleInFolder(f.id, r.id)}>Remove</button></div>)}</div> : <p className="text-sm text-brown">Empty. Open a recipe and use “Add to folder”.</p>}
                <details className="mt-3 text-sm"><summary className="cursor-pointer font-semibold">Add from saved</summary><div className="mt-2 space-y-1">{savedR.filter((r) => !f.recipeIds.includes(r.id)).map((r) => <button key={r.id} className="block w-full rounded-lg bg-cream px-3 py-2 text-left" onClick={() => toggleInFolder(f.id, r.id)}>＋ {r.emoji} {r.title}</button>)}</div></details></div>}</div>); })}</div>
        </div>
      )}
      {tab === "Recently cooked" && (cookedR.length ? <div className="card divide-y divide-cream">{cookedR.slice(0, 30).map((c, i) => <Link key={i} to={`/recipe/${c.r!.id}`} className="flex items-center gap-3 p-4"><span className="text-2xl">{c.r!.emoji}</span><span className="flex-1 font-semibold">{c.r!.title}</span><span className="text-xs text-brown">{new Date(c.at).toLocaleDateString()}</span></Link>)}</div> : <Empty emoji="🍳" title="You haven't cooked anything yet" text="Finish a recipe in cooking mode or tap “I cooked this”." />)}
      {tab === "Shopping lists" && <div className="grid gap-3 sm:grid-cols-2">{lists.map((l) => <Link key={l.id} to="/lists" className="card p-4"><b>🛒 {l.name}</b><p className="text-xs text-brown">{l.items.filter((i) => !i.checked).length} to buy · {l.items.filter((i) => i.checked).length} done</p></Link>)}</div>}
    </div>
  );
}
