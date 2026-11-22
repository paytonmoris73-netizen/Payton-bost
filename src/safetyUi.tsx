import { useState } from "react";
import { Link } from "react-router-dom";
import { useMe, useStore } from "./store";
import { Modal, toast } from "./ui";
import { REPORT_CATEGORIES, SCAM_WARNING, activeStrikes } from "./safety";
import type { Report, ReportCategory } from "./types";

/** One report dialog used everywhere (recipes, listings, creators, posts). */
export function ReportDialog({ open, onClose, kind, targetId, title, allowCopyright }: { open: boolean; onClose: () => void; kind: Report["kind"]; targetId: string; title: string; allowCopyright?: boolean }) {
  const report = useStore((s) => s.report);
  const [cat, setCat] = useState<ReportCategory>("unsafe"); const [reason, setReason] = useState(""); const [copyright, setCopyright] = useState(false);
  const cats = kind === "creator" ? REPORT_CATEGORIES.filter((c) => c.id !== "stolen") : REPORT_CATEGORIES;
  const send = () => {
    const err = report(copyright ? "copyright" : kind, targetId, (copyright ? "[COPYRIGHT] " : "") + reason.trim(), copyright ? "stolen" : cat);
    if (err) return toast(err, "err");
    onClose(); setReason(""); setCopyright(false); toast("Thanks. Moderators will review this.");
  };
  return (
    <Modal open={open} onClose={onClose} title={title}>
      <fieldset className="mb-3"><legend className="label">What's the problem?</legend>
        <div className="space-y-1.5">{cats.map((c) => (
          <label key={c.id} className="flex cursor-pointer items-start gap-2 rounded-xl bg-cream p-2.5 text-sm">
            <input type="radio" name="report-cat" className="mt-1 accent-orange" checked={cat === c.id && !copyright} onChange={() => { setCat(c.id); setCopyright(false); }} />
            <span><b>{c.label}</b><span className="block text-xs text-brown">{c.hint}</span></span>
          </label>))}
        </div></fieldset>
      {allowCopyright && <label className="mb-2 flex items-center gap-2 text-sm"><input type="checkbox" className="accent-orange" checked={copyright} onChange={(e) => setCopyright(e.target.checked)} />This is a copyright complaint (I own, or represent the owner of, this content)</label>}
      <textarea className="input" rows={3} maxLength={500} value={reason} onChange={(e) => setReason(e.target.value)} aria-label="Details" placeholder={copyright ? "Identify the original work and explain why this copies it…" : "Tell moderators what you saw…"} />
      <p className="mt-2 rounded-lg bg-orange-light/50 p-2 text-xs">Only report real problems. A person reviews every report, and people whose reports are repeatedly rejected lose the ability to report. <Link to="/safety" className="underline" onClick={onClose}>How reports work</Link></p>
      <button className="btn-dark mt-3" onClick={send}>Send report</button>
    </Modal>
  );
}

/** Shown on publish / post forms. Deliberately blunt. */
export function ScamWarning() {
  return (
    <div role="note" className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-900">
      <b>⚠️ Before you post</b>
      <p className="mt-1">{SCAM_WARNING}</p>
      <p className="mt-1 text-xs">1st strike: warning · 2nd: 7-day suspension · 3rd: permanent ban. <Link to="/safety" className="underline">Read the rules</Link></p>
    </div>
  );
}

/** Top-of-page notice for anyone with strikes, a suspension, or content held for review. */
export function SafetyBanner() {
  const me = useMe(); const { strikes, suspensions, holds, customRecipes, appeals } = useStore();
  if (!me) return null;
  const mine = activeStrikes(strikes, me.id); const until = suspensions[me.id]; const suspended = until && new Date(until).getTime() > Date.now();
  const heldRecipes = customRecipes.filter((r) => r.creatorId === me.id && r.status === "review" && holds[r.id]).length;
  const removed = customRecipes.filter((r) => r.creatorId === me.id && r.status === "removed" && !appeals.some((a) => a.targetId === r.id)).length;
  if (!mine.length && !suspended && !heldRecipes && !removed) return null;
  return (
    <div role="status" className={`mx-auto mb-4 max-w-7xl rounded-2xl p-3 text-sm ${suspended ? "bg-red-100 text-red-900" : "bg-orange-light/60"}`}>
      {suspended && <p><b>Your account is suspended until {new Date(until!).toLocaleDateString()}.</b> You can browse and cook, but not post, publish, sell, review or message. </p>}
      {mine.length > 0 && <p><b>{mine.length} active strike{mine.length > 1 ? "s" : ""}.</b> {mine.length >= 2 ? "One more is a permanent ban. " : "Your next recipes are checked by a person before going live. "}</p>}
      {heldRecipes > 0 && <p>{heldRecipes} of your recipes {heldRecipes > 1 ? "are" : "is"} waiting for a safety review.</p>}
      {removed > 0 && <p>{removed} of your recipes {removed > 1 ? "were" : "was"} removed. You can appeal from your Studio.</p>}
      <Link to="/safety" className="underline">Safety Center</Link>
    </div>
  );
}
