import { useState } from "react";
import { G } from "../icons";
import { Link } from "react-router-dom";
import { MARKET_CATEGORIES } from "../data";
import { money } from "../engine";
import { useCatalogue, useMe, useStore } from "../store";
import { Empty, PageHeader, Tabs, toast, ask } from "../ui";
import { AdminSafety } from "./AdminSafety";
import { AdminRefunds } from "./AdminRefunds";
import { REPORT_CATEGORIES, activeStrikes } from "../safety";

const TABS = ["Overview", "Reports", "Safety", "Listings", "Community", "Accounts", "Refunds", "Announcements", "Categories"] as const;

export default function Admin() {
  const me = useMe(); const cat = useCatalogue();
  const { reports, actionReport, dismissReport, markFalseReport, strikes, setStatus, toggleFeatured, featuredIds, posts, hidePost, accounts, banned, ban, purchases, announce, announcements, awarded } = useStore();
  const [tab, setTab] = useState<(typeof TABS)[number]>("Overview"); const [ann, setAnn] = useState("");
  if (me?.role !== "admin") return <Empty emoji="🚫" title="Not authorised" />;
  const open = reports.filter((r) => r.status === "open"); const refunds = purchases.filter((p) => p.status === "refund_requested");
  const act = (id: string) => { actionReport(id); toast("Done: content removed, owner penalised, buyers refunded, reporters credited"); };
  const name = (kind: string, id: string) => kind === "listing" || kind === "copyright" ? cat.find((r) => r.id === id)?.title : kind === "post" ? posts.find((p) => p.id === id)?.text.slice(0, 50) : accounts.find((a) => a.id === id)?.name ?? id;
  const stat = (l: string, v: string | number) => <div className="card p-4"><div className="text-xs font-semibold uppercase tracking-wide text-brown">{l}</div><div className="mt-1 text-2xl font-bold">{v}</div></div>;
  return (
    <div>
      <PageHeader title="Admin dashboard" sub="Moderation and platform management. Access is limited to administrators." />
      <p className="mb-4 rounded-xl bg-orange-light/50 p-3 text-xs">Role checks here are client-side for this local build. In production, admin permissions must be enforced server-side (custom claims + security rules); never trust the client. See docs/BACKEND.md.</p>
      <Tabs tabs={TABS} value={tab} onChange={setTab} />
      {tab === "Overview" && <><div className="grid grid-cols-2 gap-3 lg:grid-cols-4">{stat("Accounts", accounts.length)}{stat("Published listings", cat.filter((r) => r.status === "published").length)}{stat("Orders", purchases.length)}{stat("Gross sales (this device)", money(purchases.filter((p) => p.status === "paid").reduce((s, p) => s + p.total, 0)))}{stat("Open reports", open.length)}{stat("Refund requests", refunds.length)}{stat("Community posts", posts.length)}{stat("XP awards logged", Object.keys(awarded).length)}</div>
        <h2 className="h-display mb-2 mt-6 text-xl">Suspicious activity</h2>{refunds.length + open.length === 0 ? <p className="text-sm text-brown">Nothing flagged.</p> : <ul className="list-disc space-y-1 pl-5 text-sm">{refunds.map((p) => <li key={p.id}>Refund requested on order {p.id} ({money(p.total)})</li>)}{open.length > 0 && <li>{open.length} unresolved report(s)</li>}</ul>}</>}
      {tab === "Reports" && (open.length === 0 ? <Empty emoji="✅" title="No open reports" /> : <div className="space-y-3">{open.map((r) => <div key={r.id} className="card p-4"><div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase text-brown"><span>{r.kind === "copyright" ? "copyright complaint" : r.kind + " report"} · {new Date(r.at).toLocaleString()}</span>{r.category && <span className="chip normal-case">{REPORT_CATEGORIES.find((c) => c.id === r.category)?.label}</span>}{r.weight !== undefined && <span className="chip normal-case">weight ×{r.weight}</span>}{r.suspicious && <span className="chip bg-red-100 normal-case">⚠ possible pile-on</span>}</div><b>{name(r.kind, r.targetId)}</b>{r.reporterId && <span className="text-xs text-brown"> · reported by {accounts.find((a) => a.id === r.reporterId)?.name ?? "unknown"}</span>}<p className="mt-1 text-sm text-brown">“{r.reason}”</p><div className="mt-3 flex gap-2"><button className="btn-dark !py-1.5" onClick={async () => { if ((r.category === "scam" || r.category === "inappropriate") && !(await ask(r.category === "scam" ? "Confirm this is a scam? The account will be PERMANENTLY banned." : "Confirm this photo is inappropriate? The account will be PERMANENTLY banned.", "Ban permanently", true))) return; act(r.id); }}>{r.category === "scam" ? "Confirm scam: remove + PERMANENT BAN" : r.category === "inappropriate" ? "Confirm photo: remove + PERMANENT BAN" : r.kind === "creator" ? "Strike account" : "Remove + strike"}</button><button className="btn-ghost !py-1.5" onClick={() => { dismissReport(r.id); toast("Rejected. Reporter's record updated."); }}>Reject (honest mistake)</button><button className="btn-outline !py-1.5" onClick={async () => { if (await ask("Mark as a FALSE report? 1st offence = warning + reporting paused. 2nd offence = permanent ban.", "Mark as false", true)) { markFalseReport(r.id); toast("Marked as false report"); } }}>False report (punish)</button></div></div>)}</div>)}
      {tab === "Safety" && <AdminSafety />}
      {tab === "Listings" && <div className="card divide-y divide-cream">{cat.filter((r) => !r.bundleOf || r.status).map((r) => <div key={r.id} className="flex flex-wrap items-center gap-3 p-3 text-sm"><span className="text-xl">{r.emoji}</span><Link to={r.price > 0 || r.bundleOf ? `/marketplace/${r.id}` : `/recipe/${r.id}`} className="min-w-0 flex-1 truncate font-semibold">{r.title}</Link><span className="chip">{r.status}</span><button className="btn-ghost !py-1" onClick={() => toggleFeatured(r.id)}>{featuredIds.includes(r.id) ? <><G g="★" /> Featured</> : <><G g="☆" /> Feature</>}</button>{r.status === "removed" ? <button className="btn-ghost !py-1" onClick={() => setStatus(r.id, "published")}>Restore</button> : <button className="btn-outline !py-1" onClick={() => setStatus(r.id, "removed")}>Remove</button>}</div>)}</div>}
      {tab === "Community" && <div className="card divide-y divide-cream">{posts.map((p) => <div key={p.id} className="flex items-center gap-3 p-3 text-sm"><span className="min-w-0 flex-1 truncate"><b>{p.userName}</b>: {p.text}</span><button className="btn-outline !py-1" onClick={() => hidePost(p.id)}>{p.hidden ? "Unhide" : "Hide"}</button></div>)}</div>}
      {tab === "Accounts" && <div className="card divide-y divide-cream">{accounts.map((a) => <div key={a.id} className="flex items-center gap-3 p-3 text-sm"><span className="text-xl">{a.emoji}</span><span className="flex-1"><b>{a.name}</b> <span className="text-xs text-brown">{a.email} · {a.role}{activeStrikes(strikes, a.id).length > 0 && ` · ${activeStrikes(strikes, a.id).length} strike(s)`}</span></span>{a.id !== me.id && <button className="btn-outline !py-1" onClick={() => ban(a.id)}>{banned.includes(a.id) ? "Reinstate" : "Suspend"}</button>}</div>)}</div>}
      {tab === "Refunds" && <AdminRefunds />}
      {tab === "Announcements" && <div><form className="mb-4 flex max-w-xl gap-2" onSubmit={(e) => { e.preventDefault(); if (ann.trim().length < 5) return toast("Write an announcement.", "err"); announce(ann.trim().slice(0, 200)); setAnn(""); toast("Announcement published"); }}><input className="input" value={ann} onChange={(e) => setAnn(e.target.value)} placeholder="Announcement shown at the top of the app" /><button className="btn-primary">Publish</button></form>{announcements.map((a) => <p key={a.id} className="mb-2 rounded-xl bg-cream p-3 text-sm">{a.text}</p>)}</div>}
      {tab === "Categories" && <div><div className="mb-3 flex flex-wrap gap-1.5">{MARKET_CATEGORIES.map((c) => <span key={c} className="chip">{c}</span>)}</div><p className="text-sm text-brown">Adding, renaming and reordering categories is <b>coming soon</b> (needs a server-side categories collection).</p></div>}
    </div>
  );
}
