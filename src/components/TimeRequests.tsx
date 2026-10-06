import { useEffect, useState } from "react";
import { api } from "../lib/api";
import type { TimeRequest, User } from "../lib/types";
import { Modal } from "./Modal";
import { useToast } from "../contexts/Toast";
import { localDate } from "../lib/dates";

interface Props { user: User; onChange?: () => void; }

function fmtRange(r: TimeRequest) {
  const a = new Date(r.clockIn), b = new Date(r.clockOut);
  const t = (d: Date) => d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  const hours = ((b.getTime() - a.getTime()) / 3600e3).toFixed(1);
  return `${a.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })} · ${t(a)} – ${t(b)} (${hours}h)`;
}

const STATUS_BADGE: Record<TimeRequest["status"], string> = { pending: "badge-orange", approved: "badge-green", denied: "badge-red" };

/** Employees request missed time; owners approve or deny. */
export function TimeRequests({ user, onChange }: Props) {
  const { toast } = useToast();
  const isOwner = user.role === "owner";
  const [requests, setRequests] = useState<TimeRequest[]>([]);
  const [show, setShow] = useState(false);
  const [date, setDate] = useState(localDate());
  const [start, setStart] = useState("09:00");
  const [end, setEnd] = useState("17:00");
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function load() { try { setRequests(await api.getTimeRequests()); } catch { /* panel is optional */ } }
  useEffect(() => { load(); }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const ci = new Date(`${date}T${start}`);
    const co = new Date(`${date}T${end}`);
    if (co <= ci) co.setDate(co.getDate() + 1); // overnight shift
    setSaving(true);
    try {
      await api.createTimeRequest({ clockIn: ci.toISOString(), clockOut: co.toISOString(), reason: reason.trim() });
      setShow(false); setReason("");
      toast("Sent to your manager for approval");
      load();
    } catch (err) { setError(err instanceof Error ? err.message : "Failed"); }
    finally { setSaving(false); }
  }

  async function review(r: TimeRequest, status: "approved" | "denied") {
    try {
      await api.reviewTimeRequest(r.id, status);
      toast(status === "approved" ? "Time added to their hours" : "Request denied");
      await load();
      onChange?.();
    } catch (err) { toast(err instanceof Error ? err.message : "Failed", "error"); }
  }

  const pending = requests.filter(r => r.status === "pending");
  const shown = isOwner ? pending : requests.slice(0, 5);
  if (isOwner && pending.length === 0) return null;

  return (
    <>
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-header">
          <span className="card-title">{isOwner ? `Time corrections to review (${pending.length})` : "Missed a clock-in?"}</span>
          {!isOwner && <button className="btn btn-secondary btn-sm" onClick={() => { setShow(true); setError(""); }}>+ Request a time fix</button>}
        </div>
        {shown.length === 0 ? (
          <div style={{ padding: "12px 18px", fontSize: 13, color: "var(--text-muted)" }}>If you forgot to clock in or out, send the correct times and your manager can approve them.</div>
        ) : shown.map(r => (
          <div key={r.id} style={{ display: "flex", gap: 12, alignItems: "center", padding: "12px 18px", borderTop: "1px solid var(--border)", flexWrap: "wrap" }}>
            <div style={{ flex: 1, minWidth: 200 }}>
              <div style={{ fontWeight: 600, fontSize: 14 }}>{isOwner ? `${r.userName}: ` : ""}{fmtRange(r)}</div>
              <div className="td-muted" style={{ fontSize: 12 }}>"{r.reason}"</div>
            </div>
            {isOwner ? (
              <>
                <button className="btn btn-sm btn-primary" onClick={() => review(r, "approved")}>Approve</button>
                <button className="btn btn-sm btn-ghost" onClick={() => review(r, "denied")}>Deny</button>
              </>
            ) : <span className={`badge ${STATUS_BADGE[r.status]}`}>{r.status[0].toUpperCase() + r.status.slice(1)}</span>}
          </div>
        ))}
      </div>

      {show && (
        <Modal title="Request a time fix" onClose={() => setShow(false)}
          footer={<>
            <button className="btn btn-secondary" onClick={() => setShow(false)}>Cancel</button>
            <button className="btn btn-primary" form="fix-form" type="submit" disabled={saving || !reason.trim()}>{saving ? "Sending…" : "Send to manager"}</button>
          </>}>
          <form id="fix-form" onSubmit={submit}>
            <div className="form-group">
              <label>Date worked</label>
              <input type="date" value={date} max={localDate()} onChange={e => setDate(e.target.value)} required />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div className="form-group"><label>Started</label><input type="time" value={start} onChange={e => setStart(e.target.value)} required /></div>
              <div className="form-group"><label>Finished</label><input type="time" value={end} onChange={e => setEnd(e.target.value)} required /></div>
            </div>
            <div className="form-group">
              <label>What happened?</label>
              <textarea rows={2} value={reason} onChange={e => setReason(e.target.value)} placeholder="e.g. Phone died, forgot to clock in" required />
            </div>
            {error && <p className="error-msg">{error}</p>}
          </form>
        </Modal>
      )}
    </>
  );
}
