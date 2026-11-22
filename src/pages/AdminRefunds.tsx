import { useState } from "react";
import { money } from "../engine";
import { useCatalogue, useStore } from "../store";
import { Empty, toast } from "../ui";
import { reasonRule, withinWindow, daysAgo } from "../refunds";

export function AdminRefunds() {
  const { purchases, decideRefund } = useStore(); const cat = useCatalogue(); const [note, setNote] = useState<Record<string, string>>({});
  const open = purchases.filter((p) => p.status === "refund_requested" && p.refund);
  const done = purchases.filter((p) => p.refund && p.refund.state !== "requested").slice(0, 10);
  if (!open.length && !done.length) return <Empty emoji="🧾" title="No refund requests" />;
  const names = (ids: string[]) => ids.map((id) => cat.find((r) => r.id === id)?.title ?? id).join(", ");
  return (
    <div className="space-y-3">
      {open.map((p) => { const r = p.refund!; return (
        <div key={p.id} className="card space-y-2 p-4 text-sm">
          <div className="flex flex-wrap items-center gap-2"><b>{p.id}</b><span className="text-xs text-brown">{new Date(p.at).toLocaleDateString()} · {daysAgo(p.at).toFixed(1)}d ago · {withinWindow(p) ? "in window" : "OUTSIDE window"}</span><span className="chip">{reasonRule(r.reason as never)?.label ?? r.reason}</span></div>
          <div>Recipes: <b>{names(r.ids)}</b></div>
          <p className="text-brown">“{r.details}”</p>
          <input className="input" placeholder="Note to the buyer (optional)" value={note[p.id] ?? ""} onChange={(e) => setNote({ ...note, [p.id]: e.target.value })} aria-label="Note to buyer" />
          <div className="flex gap-2"><button className="btn-dark !py-1.5" onClick={() => { decideRefund(p.id, true, note[p.id] ?? ""); toast("Refund approved"); }}>Approve refund</button><button className="btn-ghost !py-1.5" onClick={() => { decideRefund(p.id, false, note[p.id] ?? ""); toast("Refund declined"); }}>Decline</button></div>
        </div>); })}
      {done.length > 0 && <><h3 className="h-display pt-2 text-lg">Recent decisions</h3><div className="card divide-y divide-cream">{done.map((p) => <div key={p.id} className="flex flex-wrap items-center gap-3 p-3 text-sm"><b>{p.id}</b><span className="flex-1 text-brown">{names(p.refund!.ids)}</span><span className="chip">{p.refund!.state}</span>{p.refund!.amount ? <b>{money(p.refund!.amount)}</b> : null}</div>)}</div></>}
    </div>
  );
}
