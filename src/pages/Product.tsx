import { useEffect, useState } from "react";
import { G } from "../icons";
import { Link, useNavigate, useParams } from "react-router-dom";
import { RecipeBody } from "../RecipeBody";
import { money, totalMin } from "../engine";
import { canAccess, creatorOf, useCatalogue, useMe, useOwnedIds, useStore } from "../store";
import { Avatar, Cover, Empty, Modal, RecipeCard, SaveButton, Stars, toast } from "../ui";

export default function Product() {
  const { id } = useParams(); const nav = useNavigate(); const cat = useCatalogue(); const owned = useOwnedIds(); const me = useMe();
  const { addCart, cart, accounts, reviews, view, report, toggleFollow, following } = useStore();
  const [rep, setRep] = useState<null | "listing" | "creator">(null); const [reason, setReason] = useState("");
  const r = cat.find((x) => x.id === id);
  useEffect(() => { if (r) view(r.id); }, [r?.id]); // eslint-disable-line react-hooks/exhaustive-deps
  if (!r || (r.status !== "published" && r.creatorId !== me?.id)) return <Empty emoji="🔍" title="Listing not found" text="It may have been unpublished." action={<Link to="/marketplace" className="btn-primary">Back to marketplace</Link>} />;
  const c = creatorOf(r.creatorId, accounts); const access = canAccess(r, owned, me?.id ?? null); const inCart = cart.includes(r.id);
  const bundle = r.bundleOf ? r.bundleOf.map((i) => cat.find((x) => x.id === i)).filter(Boolean) as typeof cat : [];
  const others = cat.filter((x) => x.creatorId === c.id && x.id !== r.id && x.status === "published").slice(0, 4);
  const similar = cat.filter((x) => x.id !== r.id && x.status === "published" && !x.bundleOf && (x.cuisine === r.cuisine || x.meal === r.meal)).slice(0, 4);
  const rs = reviews.filter((v) => v.recipeId === r.id);
  const sendReport = () => { if (reason.trim().length < 5) return toast("Please add a short reason.", "err"); report(rep!, rep === "creator" ? c.id : r.id, reason.trim()); setRep(null); setReason(""); toast("Report sent to moderators"); };

  if (!r.bundleOf && access) return <RecipeBody r={r} />;
  return (
    <div>
      <div className="grid gap-8 lg:grid-cols-2">
        <div className="relative overflow-hidden rounded-3xl"><Cover id={r.id} photo={r.photo} emoji={r.emoji} hue={r.hue} className="aspect-[4/3]" size="text-[9rem]" /><SaveButton id={r.id} className="absolute right-4 top-4" /></div>
        <div>
          <div className="flex flex-wrap gap-2">{r.bundleOf ? <span className="chip bg-orange-light">Collection · {bundle.length} recipes</span> : <><span className="chip"><G g="⏱" /> {totalMin(r)} min</span><span className="chip">{r.difficulty}</span><span className="chip">{r.cuisine}</span></>}{r.diet.map((d) => <span key={d} className="chip bg-sage-light">{d}</span>)}</div>
          <h1 className="h-display mt-3 text-4xl">{r.title}</h1>
          <div className="mt-2 flex items-center gap-2 text-sm"><Stars value={r.rating} size={16} /><b>{r.rating.toFixed(1)}</b><span className="text-brown">({r.reviews} reviews) · {r.sales.toLocaleString()} sold</span></div>
          <p className="mt-4 text-brown">{r.description}</p>
          <Link to={`/creator/${c.id}`} className="card mt-5 flex items-center gap-3 p-4 transition hover:shadow-card-hover"><Avatar emoji={c.emoji} hue={c.hue} size={48} /><span className="flex-1"><b className="block">{c.name}{c.verified ? <G g="✓" className="ml-1 text-orange" /> : null}</b><span className="text-xs text-brown">{c.badges.join(" · ") || c.handle}</span></span><button onClick={(e) => { e.preventDefault(); toggleFollow(c.id); }} className={following.includes(c.id) ? "btn-ghost !py-1.5" : "btn-dark !py-1.5"}>{following.includes(c.id) ? "Following" : "Follow"}</button></Link>

          <div className="card mt-5 p-5">
            <div className="flex items-baseline justify-between"><span className="text-3xl font-bold">{money(r.price)}</span><span className="text-xs text-brown">One-time purchase · personal use</span></div>
            {access ? <p className="mt-3 rounded-xl bg-sage-light p-3 text-sm font-semibold"><G g="✓" /> You own this {r.bundleOf ? "collection" : "recipe"}. Find it in My Cookbook.</p> : (
              <div className="mt-3 flex gap-2">
                <button className="btn-primary flex-1" onClick={() => { addCart(r.id); nav("/marketplace/cart"); }}>Buy now</button>
                <button className="btn-ghost" disabled={inCart} onClick={() => { addCart(r.id); toast("Added to cart"); }}>{inCart ? "In cart" : "Add to cart"}</button>
              </div>
            )}
            <p className="mt-3 text-xs text-brown">Refunds can be requested from your order history. Full recipe content is only shown after purchase.</p>
          </div>
          <div className="mt-3 flex gap-4 text-xs text-brown"><button className="underline" onClick={() => setRep("listing")}>Report listing</button><button className="underline" onClick={() => setRep("creator")}>Report creator</button></div>
        </div>
      </div>

      {!r.bundleOf && (
        <div className="mt-8 grid gap-5 lg:grid-cols-2">
          <div className="card p-5"><h2 className="h-display text-2xl">Ingredient preview</h2><ul className="mt-2 space-y-1 text-sm">{r.ingredients.slice(0, 4).map((i) => <li key={i.name}>• {i.name}</li>)}</ul>{r.ingredients.length > 4 && <p className="mt-1 text-sm text-brown">…and {r.ingredients.length - 4} more, with exact quantities, unlocked after purchase.</p>}</div>
          <div className="card p-5"><h2 className="h-display text-2xl">What's included</h2><ul className="mt-2 space-y-1 text-sm text-brown"><li><G g="🔒" /> {r.steps.length} step-by-step instructions</li><li><G g="🔒" /> Exact quantities &amp; serving scaling</li><li><G g="🔒" /> Full-screen cooking mode with timers</li><li><G g="🔒" /> Nutrition estimate, allergens, substitutions, storage</li></ul></div>
        </div>
      )}
      {bundle.length > 0 && <section className="mt-8"><h2 className="h-display mb-3 text-2xl">Included recipes</h2><div className="stagger grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">{bundle.map((b) => <RecipeCard key={b.id} r={b} owned={owned.has(b.id)} />)}</div><p className="mt-2 text-xs text-brown">Individually worth {money(bundle.reduce((s, b) => s + b.price, 0))}.</p></section>}

      <section className="mt-8"><h2 className="h-display mb-3 text-2xl">Reviews</h2>{rs.length === 0 ? <p className="text-sm text-brown">No reviews yet. Only verified buyers can review paid recipes.</p> : <div className="card divide-y divide-cream">{rs.map((v) => <div key={v.id} className="p-4"><div className="flex items-center gap-2 text-sm"><b>{v.userName}</b><Stars value={v.rating} />{v.verified && <span className="chip bg-sage-light">Verified purchase</span>}</div><p className="mt-1 text-sm text-brown">{v.text}</p></div>)}</div>}</section>
      {others.length > 0 && <section className="mt-8"><h2 className="h-display mb-3 text-2xl">More from {c.name}</h2><div className="stagger grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">{others.map((o) => <RecipeCard key={o.id} r={o} owned={owned.has(o.id)} />)}</div></section>}
      {similar.length > 0 && <section className="mt-8"><h2 className="h-display mb-3 text-2xl">Similar recipes</h2><div className="stagger grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">{similar.map((o) => <RecipeCard key={o.id} r={o} owned={owned.has(o.id)} />)}</div></section>}

      <Modal open={!!rep} onClose={() => setRep(null)} title={rep === "creator" ? "Report creator" : "Report listing"}>
        <textarea className="input" rows={3} placeholder="Copied content, misleading description, unsafe advice…" value={reason} onChange={(e) => setReason(e.target.value)} />
        <button className="btn-dark mt-3" onClick={sendReport}>Send report</button>
      </Modal>
    </div>
  );
}
