import { useEffect, useState } from "react";
import { api } from "../lib/api";
import type { LeaveRequest, User } from "../lib/types";
import { Modal } from "../components/Modal";
import { useToast } from "../contexts/Toast";

interface Props { user: User; }

function fmtDate(iso: string) { return new Date(iso + "T00:00:00").toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }); }

const TYPE_LABELS: Record<LeaveRequest["type"], string> = { vacation: "Vacation", sick: "Sick Leave", personal: "Personal", other: "Other" };
const TYPE_COLORS: Record<LeaveRequest["type"], string> = { vacation: "badge-blue", sick: "badge-orange", personal: "badge-green", other: "badge-gray" };

export function LeavePage({ user }: Props) {
  const { toast } = useToast();
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ startDate: "", endDate: "", type: "vacation" as LeaveRequest["type"], reason: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "denied">("all");

  useEffect(() => { load(); }, []);

  async function load() {
    try {
      const isOwner = user.role === "owner";
      setRequests(await api.getLeaveRequests(isOwner ? undefined : user.id));
    } catch {/* ignore */}
    finally { setLoading(false); }
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!form.startDate || !form.endDate) return;
    setSaving(true); setError("");
    try {
      await api.createLeaveRequest({ userId: user.id, ...form });
      setShowAdd(false);
      setForm({ startDate: "", endDate: "", type: "vacation", reason: "" });
      await load();
      toast("Leave request submitted");
    } catch (err) { setError(err instanceof Error ? err.message : "Failed"); }
    finally { setSaving(false); }
  }

  async function handleReview(id: string, status: "approved" | "denied") {
    await api.updateLeaveRequest(id, status);
    await load();
    toast(status === "approved" ? "Request approved" : "Request denied");
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this request?")) return;
    await api.deleteLeaveRequest(id);
    await load();
  }

  const shown = filter === "all" ? requests : requests.filter(r => r.status === filter);
  const pending = requests.filter(r => r.status === "pending");

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <div className="page-title">{user.role === "owner" ? "Leave Requests" : "My Leave"}</div>
          <div className="page-subtitle">{user.role === "owner" ? "Review and manage time-off requests" : "Request and track your time off"}</div>
        </div>
        {user.role !== "owner" && (
          <button className="btn btn-primary" onClick={() => { setShowAdd(true); setError(""); }}>+ Request Leave</button>
        )}
      </div>

      {user.role === "owner" && pending.length > 0 && (
        <div style={{ background: "rgba(255,107,53,0.08)", border: "1px solid rgba(255,107,53,0.25)", borderRadius: 10, padding: "12px 16px", marginBottom: 20, display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 16 }}>⏳</span>
          <span style={{ fontWeight: 600, color: "var(--primary)" }}>{pending.length} pending request{pending.length !== 1 ? "s" : ""} need review</span>
        </div>
      )}

      <div className="card">
        <div className="card-header">
          <span className="card-title">Requests</span>
          <div style={{ display: "flex", gap: 6 }}>
            {(["all","pending","approved","denied"] as const).map(f => (
              <button key={f} onClick={() => setFilter(f)} className={`btn btn-sm ${filter === f ? "btn-primary" : "btn-ghost"}`}>
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
        </div>
        {loading ? (
          <div style={{ padding: 40, textAlign: "center" }}><div className="spinner" style={{ margin: "0 auto" }} /></div>
        ) : shown.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">🌴</div>
            <h3>No requests</h3>
            <p>{user.role !== "owner" ? "Submit a leave request above" : "No leave requests yet"}</p>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  {user.role === "owner" && <th>Employee</th>}
                  <th>Type</th>
                  <th>From</th>
                  <th>To</th>
                  <th>Reason</th>
                  <th>Status</th>
                  <th>Submitted</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {shown.map(r => (
                  <tr key={r.id}>
                    {user.role === "owner" && <td className="td-name">{r.userName ?? "—"}</td>}
                    <td><span className={`badge ${TYPE_COLORS[r.type]}`}>{TYPE_LABELS[r.type]}</span></td>
                    <td className="td-muted" style={{ whiteSpace: "nowrap" }}>{fmtDate(r.startDate)}</td>
                    <td className="td-muted" style={{ whiteSpace: "nowrap" }}>{fmtDate(r.endDate)}</td>
                    <td className="td-muted" style={{ maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.reason || "—"}</td>
                    <td>
                      {r.status === "pending" && <span className="badge badge-orange">Pending</span>}
                      {r.status === "approved" && <span className="badge badge-green">Approved</span>}
                      {r.status === "denied" && <span className="badge badge-gray" style={{ color: "var(--danger)" }}>Denied</span>}
                    </td>
                    <td className="td-muted" style={{ whiteSpace: "nowrap" }}>{fmtDate(r.createdAt.split("T")[0])}</td>
                    <td>
                      <div className="td-actions">
                        {user.role === "owner" && r.status === "pending" && (
                          <>
                            <button className="btn btn-ghost btn-sm" style={{ color: "var(--success)" }} onClick={() => handleReview(r.id, "approved")}>✓</button>
                            <button className="btn btn-ghost btn-sm" style={{ color: "var(--danger)" }} onClick={() => handleReview(r.id, "denied")}>✕</button>
                          </>
                        )}
                        {(user.role === "owner" || r.status === "pending") && (
                          <button className="btn btn-ghost btn-sm" style={{ color: "var(--danger)" }} onClick={() => handleDelete(r.id)}>×</button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showAdd && (
        <Modal title="Request Leave"
          onClose={() => { setShowAdd(false); setError(""); }}
          footer={
            <>
              <button className="btn btn-secondary" onClick={() => setShowAdd(false)}>Cancel</button>
              <button className="btn btn-primary" form="leave-form" type="submit" disabled={saving}>
                {saving ? "Submitting…" : "Submit Request"}
              </button>
            </>
          }
        >
          <form id="leave-form" onSubmit={handleAdd}>
            <div className="form-group">
              <label>Leave Type</label>
              <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value as LeaveRequest["type"] }))}
                style={{ width: "100%", padding: "9px 12px", border: "1.5px solid var(--border)", borderRadius: "var(--radius)", fontSize: 14, fontFamily: "inherit", background: "var(--surface)" }}>
                {Object.entries(TYPE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div className="form-group">
                <label>Start Date *</label>
                <input type="date" value={form.startDate} onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))} required />
              </div>
              <div className="form-group">
                <label>End Date *</label>
                <input type="date" value={form.endDate} min={form.startDate} onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))} required />
              </div>
            </div>
            <div className="form-group">
              <label>Reason</label>
              <textarea value={form.reason} onChange={e => setForm(f => ({ ...f, reason: e.target.value }))} placeholder="Optional details…" rows={3} style={{ resize: "none" }} />
            </div>
            {error && <p className="error-msg">{error}</p>}
          </form>
        </Modal>
      )}
    </div>
  );
}
