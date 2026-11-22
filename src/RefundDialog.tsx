import { useState } from "react";
import { Link } from "react-router-dom";
import { money } from "./engine";
import { useCatalogue, useStore } from "./store";
import { Modal, toast } from "./ui";
import { REFUND_REASONS, REFUND_WINDOW_DAYS, orderRefundBlock, reasonRule, refundableIds } from "./refunds";
import type { Purchase, RefundReason } from "./types";

export function RefundStatus({ p }: { p: Purchase }) {
  const r = p.refund; const cat = useCatalogue();
  if (!r) return null;
  const names = r.ids.map((id) => cat.find((x) => x.id === id)?.title).filter(Boolean).join(", ");
  const tone = r.state === "denied" ? "bg-red-50 text-red-900" : r.state === "requested" ? "bg-orange-light/50" : "bg-sage-light/60";
  return (
    <p className={`mt-2 rounded-xl p-2.5 text-xs ${tone}`}>
      {r.state === "requested" && <>⏳ <b>Refund under review</b> for {names}. We review requests within 5 business days.</>}
      {r.state === "approved" && <>✅ <b>Refund approved</b>{r.amount ? ` (${money(r.amount)})` : ""} for {names}. {r.note}</>}
      {r.state === "auto" && <>✅ <b>Refunded automatically</b>{r.amount ? ` (${money(r.amount)})` : ""} for {names}. {r.note}</>}
      {r.state === "denied" && <>❌ <b>Refund declined.</b> {r.note} <Link to="/terms#refunds" className="underline">Refund policy</Link></>}
    </p>
  );
}

export function RefundButton({ p }: { p: Purchase }) {
  const [open, setOpen] = useState(false); const purchases = useStore((s) => s.purchases);
  const block = orderRefundBlock(p, purchases);
  if (p.status === "refunded" || p.status === "refund_requested" || p.refund) return null;
  return (<>
    {block ? <span className="text-xs text-brown" title={block}>No refund available</span> : <button className="btn-outline !py-1.5" onClick={() => setOpen(true)}>Request refund</button>}
    {open && <RefundDialog p={p} onClose={() => setOpen(false)} />}
  </>);
}

function RefundDialog({ p, onClose }: { p: Purchase; onClose: () => void }) {
  const cat = useCatalogue(); const request = useStore((s) => s.requestRefund);
  const ok = refundableIds(p); const [ids, setIds] = useState<string[]>(ok); const [reason, setReason] = useState<RefundReason | "">(""); const [details, setDetails] = useState("");
  const rule = reason ? reasonRule(reason) : null;
  const submit = () => {
    if (!reason) return toast("Choose a reason.", "err");
    const err = request(p.id, reason, ids, details); if (err) return toast(err, "err");
    onClose(); toast(rule?.auto ? "Refunded." : "Refund request sent");
  };
  return (
    <Modal open onClose={onClose} title="Request a refund">
      <p className="mb-3 rounded-xl bg-cream p-3 text-xs">Refunds are for specific problems, not for every case. You can request within {REFUND_WINDOW_DAYS} days of purchase, once per order. <Link to="/terms#refunds" className="underline" onClick={onClose}>Read the refund policy</Link></p>
      <fieldset className="mb-3"><legend className="label">Which recipes?</legend>
        {ok.map((id) => <label key={id} className="flex items-center gap-2 py-1 text-sm"><input type="checkbox" checked={ids.includes(id)} onChange={() => setIds(ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id])} />{cat.find((r) => r.id === id)?.title ?? id}{p.unitPrices?.[id] ? <span className="text-xs text-brown">· {money(p.unitPrices[id])}</span> : null}</label>)}</fieldset>
      <fieldset className="mb-3"><legend className="label">What went wrong?</legend>
        <div className="space-y-1.5">{REFUND_REASONS.map((r) => (
          <label key={r.id} className="flex cursor-pointer items-start gap-2 rounded-xl bg-cream p-2.5 text-sm">
            <input type="radio" name="refund-reason" className="mt-1 accent-orange" checked={reason === r.id} onChange={() => setReason(r.id)} />
            <span>{r.label}{!r.covered && <span className="ml-1 text-xs text-brown">(not covered)</span>}</span>
          </label>))}</div></fieldset>
      {rule && !rule.covered && <p role="alert" className="mb-3 rounded-xl bg-red-50 p-3 text-xs text-red-900">This isn't covered by our refund policy. Recipes are personal taste and skill, and you're responsible for how you cook them. See what <i>is</i> covered in the <Link to="/terms#refunds" className="underline" onClick={onClose}>policy</Link>.</p>}
      {rule?.covered && <p className="mb-2 text-xs text-brown">{rule.note}</p>}
      {rule?.covered && rule.needsDetails && <textarea className="input" rows={3} maxLength={800} aria-label="Details" value={details} onChange={(e) => setDetails(e.target.value)} placeholder="Tell us what happened…" />}
      <button className="btn-dark mt-3" disabled={!rule?.covered} onClick={submit}>{rule?.auto ? "Refund now" : "Send request"}</button>
    </Modal>
  );
}
