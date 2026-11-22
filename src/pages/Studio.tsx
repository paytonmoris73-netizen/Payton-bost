import { useState } from "react";
import { Link } from "react-router-dom";
import { MARKET_FEE, money } from "../engine";
import { ageOf, MIN_AGE_COMMERCE, uid, useCatalogue, useMe, useStore } from "../store";
import { Cover, Empty, Modal, PageHeader, Stars, toast } from "../ui";
import type { Recipe } from "../types";

export default function Studio() {
  const me = useMe()!; const cat = useCatalogue(); const reviews = useStore((s) => s.reviews); const setStatus = useStore((s) => s.setStatus); const { publishRecipe, holds, appeals, appeal } = useStore(); const [appealFor, setAppealFor] = useState<string | null>(null); const [appealText, setAppealText] = useState(""); const upsertRecipe = useStore((s) => s.upsertRecipe);
  const mine = cat.filter((r) => r.creatorId === me.id);
  const [bundleOpen, setBundleOpen] = useState(false); const [sel, setSel] = useState<string[]>([]); const [bt, setBt] = useState(""); const [bp, setBp] = useState(5);
  const live = mine.filter((r) => r.status === "published"); const myReviews = reviews.filter((v) => mine.some((r) => r.id === v.recipeId));
  const sales = mine.reduce((s, r) => s + r.sales, 0); const views = mine.reduce((s, r) => s + r.views, 0);
  const revenue = mine.reduce((s, r) => s + r.sales * r.price * (1 - MARKET_FEE), 0);
  const avg = myReviews.length ? myReviews.reduce((s, v) => s + v.rating, 0) / myReviews.length : 0;
  const single = live.filter((r) => !r.bundleOf);
  const makeBundle = () => {
    if (ageOf(me) < MIN_AGE_COMMERCE) return toast(`Selling requires age ${MIN_AGE_COMMERCE}+.`, "err");
    if (sel.length < 2) return toast("Pick at least 2 recipes.", "err"); if (bt.trim().length < 3) return toast("Give the collection a title.", "err");
    const b: Recipe = { ...single[0], id: "my_" + uid(), title: bt.trim(), description: `A collection of ${sel.length} recipes: ${sel.map((id) => single.find((r) => r.id === id)?.title).join(", ")}.`, emoji: "📚", hue: 30, ingredients: [], steps: [], bundleOf: sel, price: bp, rating: 0, reviews: 0, sales: 0, views: 0, status: "published", createdAt: new Date().toISOString(), categories: ["Premium collections"] };
    const out = upsertRecipe(b); setBundleOpen(false); setSel([]); setBt(""); toast(out.result === "published" ? "Collection published" : out.message, out.result === "blocked" ? "err" : "ok");
  };
  const stat = (l: string, v: string, sub?: string) => <div className="card p-4"><div className="text-xs font-semibold uppercase tracking-wide text-brown">{l}</div><div className="mt-1 text-2xl font-bold">{v}</div>{sub && <div className="text-xs text-brown">{sub}</div>}</div>;
  return (
    <div>
      <PageHeader title="Creator studio" sub="Manage your listings and see how they're performing." action={<div className="flex gap-2"><button className="btn-ghost" onClick={() => setBundleOpen(true)} disabled={single.length < 2}>Create collection</button><Link to="/creator/new" className="btn-primary">New recipe</Link></div>} />
      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-5">
        {stat("Listings", String(live.length), `${mine.length - live.length} drafts/unpublished`)}{stat("Views", views.toLocaleString())}{stat("Sales", sales.toLocaleString(), `Conversion ${views ? ((sales / views) * 100).toFixed(1) + "%" : "—"}`)}{stat("Revenue", money(Math.round(revenue * 100) / 100), `After ${MARKET_FEE * 100}% commission`)}{stat("Rating", avg ? avg.toFixed(1) : "—", `${myReviews.length} reviews`)}
      </div>
      <p className="mb-6 rounded-xl bg-sage-light/60 p-3 text-xs">Stats come from data recorded by this app. Until you connect a backend and payment provider (see docs/BACKEND.md), views and sales only count activity on this device.</p>
      {mine.length === 0 ? <Empty emoji="📝" title="You haven't created any recipes yet" text="Generate one with the AI chef or write your own." action={<Link to="/creator/new" className="btn-primary">Write a recipe</Link>} /> : (
        <div className="card divide-y divide-cream">
          {mine.map((r) => (
            <div key={r.id} className="flex flex-wrap items-center gap-3 p-4">
              <Cover id={r.id} photo={r.photo} emoji={r.emoji} hue={r.hue} className="h-14 w-14 rounded-xl" size="text-2xl" />
              <div className="min-w-0 flex-1"><Link to={r.price > 0 || r.bundleOf ? `/marketplace/${r.id}` : `/recipe/${r.id}`} className="font-semibold">{r.title || "Untitled"}</Link><div className="flex flex-wrap items-center gap-2 text-xs text-brown"><span className={`chip ${r.status === "published" ? "bg-sage-light" : r.status === "removed" ? "bg-red-100" : ""}`}>{r.status}</span>{r.bundleOf ? "collection" : `${r.views} views`} · {r.sales} sales · {money(r.price)} {r.reviews > 0 && <Stars value={r.rating} />}</div></div>
              <div className="flex gap-2">
                {!r.bundleOf && <Link to={`/creator/edit/${r.id}`} className="btn-ghost !py-1.5">Edit</Link>}
                {r.status === "published" ? <button className="btn-outline !py-1.5" onClick={() => { setStatus(r.id, "unpublished"); toast("Unpublished"); }}>Unpublish</button>
                  : r.status === "review" ? <span className="text-xs text-orange-700">⏳ Waiting for safety review{holds[r.id]?.flags.length ? ": " + holds[r.id].flags.join("; ") : ""}</span>
                  : r.status === "removed" ? (appeals.some((a) => a.targetId === r.id) ? <span className="text-xs text-brown">Appeal: {appeals.find((a) => a.targetId === r.id)!.status}</span> : <><span className="text-xs text-red-700">Removed by moderators</span><button className="btn-outline !py-1.5" onClick={() => setAppealFor(r.id)}>Appeal</button></>)
                  : <button className="btn-dark !py-1.5" onClick={() => { if (r.price > 0 && ageOf(me) < MIN_AGE_COMMERCE) return toast(`Selling requires age ${MIN_AGE_COMMERCE}+.`, "err"); const out = publishRecipe(r.id); toast(out.message, out.result === "blocked" ? "err" : "ok"); }}>Publish</button>}
              </div>
            </div>
          ))}
        </div>
      )}
      {myReviews.length > 0 && <section className="mt-8"><h2 className="h-display mb-3 text-2xl">Recent reviews</h2><div className="card divide-y divide-cream">{myReviews.slice(0, 6).map((v) => <div key={v.id} className="p-4 text-sm"><b>{v.userName}</b> <Stars value={v.rating} /> {v.verified && <span className="chip bg-sage-light">Verified</span>}<p className="text-brown">{v.text}</p></div>)}</div></section>}
      <Modal open={bundleOpen} onClose={() => setBundleOpen(false)} title="Create a collection">
        <label className="label" htmlFor="bt">Title</label><input id="bt" className="input mb-3" placeholder="e.g. 10 Easy Desserts" value={bt} onChange={(e) => setBt(e.target.value)} />
        <span className="label">Choose recipes</span><div className="mb-3 max-h-48 space-y-1 overflow-y-auto">{single.map((r) => <label key={r.id} className="flex items-center gap-2 rounded-lg bg-cream p-2 text-sm"><input type="checkbox" className="accent-orange" checked={sel.includes(r.id)} onChange={() => setSel(sel.includes(r.id) ? sel.filter((x) => x !== r.id) : [...sel, r.id])} />{r.emoji} {r.title}</label>)}</div>
        <label className="label" htmlFor="bp">Price (USD)</label><input id="bp" type="number" min={1} max={100} className="input mb-3" value={bp} onChange={(e) => setBp(Math.max(1, Math.min(100, Number(e.target.value) || 1)))} />
        <button className="btn-primary w-full" onClick={makeBundle}>Publish collection</button>
      </Modal>
      <Modal open={!!appealFor} onClose={() => setAppealFor(null)} title="Appeal this removal">
        <p className="mb-2 text-sm text-brown">Explain why this recipe follows the rules. A person will review it. If you're right, it goes back up and the strike is removed.</p>
        <textarea className="input" rows={4} maxLength={800} value={appealText} onChange={(e) => setAppealText(e.target.value)} aria-label="Appeal" />
        <button className="btn-dark mt-3" onClick={() => { const err = appeal(appealFor!, appealText); if (err) return toast(err, "err"); setAppealFor(null); setAppealText(""); toast("Appeal sent"); }}>Send appeal</button>
      </Modal>
    </div>
  );
}
