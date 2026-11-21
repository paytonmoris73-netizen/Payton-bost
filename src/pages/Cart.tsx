import { Link, useNavigate } from "react-router-dom";
import { G } from "../icons";
import { money } from "../engine";
import { MIN_AGE_COMMERCE, ageOf, useCatalogue, useMe, useStore } from "../store";
import { Cover, Empty, PageHeader, toast } from "../ui";

export default function Cart() {
  const nav = useNavigate(); const me = useMe()!; const cat = useCatalogue(); const { cart, removeCart, checkout, purchases, requestRefund, stripeConfigured } = useStore();
  const items = cart.map((id) => cat.find((r) => r.id === id)).filter((r): r is NonNullable<typeof r> => !!r);
  const total = items.reduce((s, r) => s + r.price, 0); const adult = ageOf(me) >= MIN_AGE_COMMERCE;
  const pay = () => { const r = checkout(); if (!r.ok) return toast(r.error!, "err"); toast("Purchase complete. Recipes unlocked."); nav("/cookbook"); };
  return (
    <div>
      <PageHeader title="Cart & orders" />
      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div>
          {items.length === 0 ? <Empty emoji="🛍️" title="Your cart is empty" action={<Link to="/marketplace" className="btn-primary">Browse marketplace</Link>} /> : (
            <div className="card divide-y divide-cream">{items.map((r) => <div key={r.id} className="flex items-center gap-4 p-4"><Cover id={r.id} photo={r.photo} emoji={r.emoji} hue={r.hue} className="h-16 w-16 rounded-xl" size="text-3xl" /><div className="flex-1"><Link to={`/marketplace/${r.id}`} className="font-semibold">{r.title}</Link><div className="text-xs text-brown">{r.bundleOf ? `${r.bundleOf.length}-recipe collection` : r.cuisine}</div></div><b>{money(r.price)}</b><button onClick={() => removeCart(r.id)} className="text-brown-light hover:text-red-600" aria-label={`Remove ${r.title}`}><G g="✕" /></button></div>)}</div>
          )}
          <h2 className="h-display mb-3 mt-8 text-2xl">Purchase history</h2>
          {purchases.length === 0 ? <p className="text-sm text-brown">No purchases yet.</p> : (
            <div className="space-y-3">{purchases.map((p) => (
              <div key={p.id} className="card p-4"><div className="flex flex-wrap items-center justify-between gap-2"><div><b className="text-sm">{p.id}</b><div className="text-xs text-brown">{new Date(p.at).toLocaleString()} · {p.recipeIds.length} recipe(s) · {p.method === "demo" ? "demo checkout (no charge)" : "card"}</div></div><div className="flex items-center gap-3"><b>{money(p.total)}</b><span className={`chip ${p.status === "paid" ? "bg-sage-light" : "bg-orange-light"}`}>{p.status.replace("_", " ")}</span>{p.status === "paid" && <button className="btn-outline !py-1.5" onClick={() => { if (confirm("Request a refund for this order?")) requestRefund(p.id); }}>Request refund</button>}</div></div>
                <p className="mt-2 text-xs text-brown">{p.recipeIds.map((id) => cat.find((r) => r.id === id)?.title).filter(Boolean).join(", ")}</p></div>))}</div>
          )}
        </div>
        <aside className="card h-fit p-5 lg:sticky lg:top-20">
          <h2 className="h-display text-2xl">Summary</h2>
          <div className="mt-3 flex justify-between text-sm"><span>Subtotal</span><span>{money(total)}</span></div>
          <div className="mt-1 flex justify-between border-t border-cream pt-3 text-lg font-bold"><span>Total</span><span>{money(total)}</span></div>
          {!adult && <p className="mt-3 rounded-lg bg-orange-light/50 p-3 text-xs">Purchases require an account holder aged {MIN_AGE_COMMERCE}+. Ask a parent or guardian to buy for you.</p>}
          {!stripeConfigured && <p className="mt-3 rounded-lg bg-sage-light/60 p-3 text-xs"><b>Demo checkout.</b> No payment provider is connected, so no money is charged and orders are marked as demo purchases. See Settings → Integrations to set up Stripe.</p>}
          <button className="btn-primary mt-4 w-full" disabled={!items.length || !adult} onClick={pay}>{stripeConfigured ? "Pay securely" : "Complete demo purchase"}</button>
          <p className="mt-3 text-xs text-brown">Digital recipes for personal use. Refund requests are reviewed within 5 business days.</p>
        </aside>
      </div>
    </div>
  );
}
