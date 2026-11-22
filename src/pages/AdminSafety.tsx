import { Link } from "react-router-dom";
import { useCatalogue, useStore } from "../store";
import { Empty, toast } from "../ui";
import { activeStrikes, reporterWeight, daysSince } from "../safety";

/** Admin "Safety" tab: held items, appeals, strikes, and how trustworthy each reporter has been. */
export function AdminSafety() {
  const { holds, appeals, strikes, accounts, posts, reporterStats, suspensions, banned, approveHold, rejectHold, decideAppeal } = useStore(); const cat = useCatalogue();
  const heldList = Object.values(holds).sort((a, b) => b.at.localeCompare(a.at));
  const title = (id: string, kind: string) => kind === "post" ? posts.find((p) => p.id === id)?.text.slice(0, 70) : cat.find((r) => r.id === id)?.title;
  const who = (id: string) => accounts.find((a) => a.id === id)?.name ?? id;
  const ownerName = (id: string, kind: string) => kind === "post" ? posts.find((p) => p.id === id)?.userName : who(cat.find((r) => r.id === id)?.creatorId ?? "");
  const openAppeals = appeals.filter((a) => a.status === "open");
  const reporters = Object.entries(reporterStats).sort((a, b) => b[1].dismissed - a[1].dismissed);
  const H = (t: string, n?: number) => <h2 className="h-display mb-2 mt-6 text-xl first:mt-0">{t}{n !== undefined && <span className="ml-2 text-sm text-brown">({n})</span>}</h2>;
  return (
    <div>
      {H("Held for review", heldList.length)}
      {heldList.length === 0 ? <Empty emoji="✅" title="Nothing waiting" /> : <div className="space-y-3">{heldList.map((h) => (
        <div key={h.targetId} className="card p-4 text-sm">
          <div className="text-xs font-semibold uppercase text-brown">{h.kind} · {h.reason === "reports" ? "hidden after reports" : h.reason === "scan" ? "flagged by scan" : "new-account check"} · {new Date(h.at).toLocaleString()}</div>
          <b>{title(h.targetId, h.kind) ?? h.targetId}</b> <span className="text-brown">by {ownerName(h.targetId, h.kind) ?? "unknown"}</span>
          {h.flags.length > 0 && <ul className="mt-1 list-disc pl-5 text-xs text-red-800">{h.flags.map((f) => <li key={f}>{f}</li>)}</ul>}
          {h.kind === "recipe" && <Link className="mt-1 inline-block text-xs underline" to={`/recipe/${h.targetId}`}>Open to inspect</Link>}
          <div className="mt-3 flex flex-wrap gap-2">
            <button className="btn-dark !py-1.5" onClick={() => { approveHold(h.targetId); toast("Approved and live"); }}>Approve</button>
            <button className="btn-outline !py-1.5" onClick={() => { rejectHold(h.targetId, false); toast("Removed"); }}>Remove</button>
            <button className="btn-outline !py-1.5" onClick={() => { rejectHold(h.targetId, true); toast("Removed + strike"); }}>Remove + strike</button>
          </div></div>))}</div>}

      {H("Appeals", openAppeals.length)}
      {openAppeals.length === 0 ? <p className="text-sm text-brown">No open appeals.</p> : <div className="space-y-3">{openAppeals.map((a) => (
        <div key={a.id} className="card p-4 text-sm"><b>{who(a.accountId)}</b> appealing <b>{cat.find((r) => r.id === a.targetId)?.title ?? a.targetId}</b>
          <p className="mt-1 text-brown">“{a.text}”</p>
          <div className="mt-3 flex gap-2"><button className="btn-dark !py-1.5" onClick={() => { decideAppeal(a.id, true); toast("Restored and strike removed"); }}>Approve (restore + remove strike)</button><button className="btn-ghost !py-1.5" onClick={() => { decideAppeal(a.id, false); toast("Appeal denied"); }}>Deny</button></div></div>))}</div>}

      {H("Strikes", strikes.length)}
      {strikes.length === 0 ? <p className="text-sm text-brown">No strikes issued.</p> : <div className="card divide-y divide-cream">{strikes.slice(0, 30).map((k) => (
        <div key={k.id} className="flex flex-wrap items-center gap-x-3 p-3 text-sm"><b>{who(k.accountId)}</b><span className="flex-1 text-brown">{k.reason} · {new Date(k.at).toLocaleDateString()}</span>{k.revoked && <span className="chip">revoked</span>}</div>))}</div>}
      <p className="mt-2 text-xs text-brown">Suspended now: {Object.entries(suspensions).filter(([, u]) => new Date(u).getTime() > Date.now()).map(([id]) => who(id)).join(", ") || "none"} · Banned: {banned.map(who).join(", ") || "none"}</p>

      {H("Reporter reliability", reporters.length)}
      {reporters.length === 0 ? <p className="text-sm text-brown">No reports resolved yet.</p> : <div className="card divide-y divide-cream">{reporters.map(([id, st]) => {
        const a = accounts.find((x) => x.id === id);
        return <div key={id} className="flex flex-wrap items-center gap-x-4 p-3 text-sm"><b className="flex-1">{who(id)}</b><span>✅ {st.upheld} upheld</span><span>❌ {st.dismissed} rejected</span><span className="text-xs text-brown">weight ×{reporterWeight(st, a ? daysSince(a.createdAt) : 30)}</span>{st.pausedUntil && new Date(st.pausedUntil).getTime() > Date.now() && <span className="chip bg-red-100">paused</span>}</div>;
      })}</div>}
      <p className="mt-2 text-xs text-brown">Accounts with active strikes: {accounts.filter((a) => activeStrikes(strikes, a.id).length).map((a) => `${a.name} (${activeStrikes(strikes, a.id).length})`).join(", ") || "none"}</p>
    </div>
  );
}
