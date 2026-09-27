import { useEffect, useState } from "react";
import { api } from "../lib/api";
import type { Payment, UserWithStats } from "../lib/types";
import { Modal } from "../components/Modal";
import { StatCard } from "../components/StatCard";

function money(n: number): string { return "$" + n.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ","); }
function fmtDateTime(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }) + " · " +
    new Date(iso).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

const typeBadge = (type: Payment["type"]) => {
  const map = { payroll: "badge-blue", bonus: "badge-orange", job: "badge-green" };
  const labels = { payroll: "Payroll", bonus: "Bonus", job: "Job Pay" };
  return <span className={`badge ${map[type]}`}>{labels[type]}</span>;
};

export function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [team, setTeam] = useState<UserWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [filterUser, setFilterUser] = useState("all");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [userId, setUserId] = useState("");
  const [amount, setAmount] = useState("");
  const [type, setType] = useState("payroll");
  const [description, setDescription] = useState("");

  useEffect(() => { load(); }, []);

  async function load() {
    try {
      const [p, t] = await Promise.all([api.getPayments(), api.getTeam()]);
      setPayments(p);
      setTeam(t.filter(u => u.role !== "owner" && u.active));
    } catch {/* ignore */}
    finally { setLoading(false); }
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!userId || !amount) return;
    setSaving(true); setError("");
    try {
      await api.addPayment({ userId, amount: parseFloat(amount), type, description: description.trim() || `${type === "payroll" ? "Payroll" : type === "bonus" ? "Bonus" : "Job payment"}` });
      setShowAdd(false); setUserId(""); setAmount(""); setType("payroll"); setDescription("");
      const p = await api.refreshPayments(); setPayments(p);
    } catch (err) { setError(err instanceof Error ? err.message : "Failed"); }
    finally { setSaving(false); }
  }

  const shown = filterUser === "all" ? payments : payments.filter(p => p.userId === filterUser);
  const totalOut = payments.reduce((s, p) => s + p.amount, 0);
  const thisMonth = payments.filter(p => new Date(p.paidAt) >= new Date(new Date().setDate(1))).reduce((s, p) => s + p.amount, 0);
  const thisWeek = (() => {
    const ws = new Date(); ws.setHours(0,0,0,0); ws.setDate(ws.getDate() - ws.getDay());
    return payments.filter(p => new Date(p.paidAt) >= ws).reduce((s, p) => s + p.amount, 0);
  })();

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <div className="page-title">Payments</div>
          <div className="page-subtitle">Record and track all employee payments</div>
        </div>
        <button className="btn btn-primary" onClick={() => { setShowAdd(true); setError(""); }}>
          + Record Payment
        </button>
      </div>

      <div className="stats-grid">
        <StatCard label="Total Paid Out" value={money(totalOut)} sub="all time" />
        <StatCard label="This Month" value={money(thisMonth)} color="green" />
        <StatCard label="This Week" value={money(thisWeek)} color="blue" />
        <StatCard label="Transactions" value={payments.length} sub="all time" />
      </div>

      <div className="card">
        <div className="card-header">
          <span className="card-title">Payment History</span>
          <select value={filterUser} onChange={e => setFilterUser(e.target.value)}
            style={{ padding: "6px 10px", border: "1px solid var(--border)", borderRadius: "var(--radius)", fontSize: 13, background: "var(--surface)" }}>
            <option value="all">All Employees</option>
            {team.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
          </select>
        </div>
        {loading ? (
          <div style={{ padding: 40, textAlign: "center" }}><div className="spinner" style={{ margin: "0 auto" }} /></div>
        ) : shown.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">💳</div>
            <h3>No payments yet</h3>
            <p>Record your first payment above</p>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>Date</th><th>Employee</th><th>Type</th><th>Description</th><th className="text-right">Amount</th></tr>
              </thead>
              <tbody>
                {shown.map(p => (
                  <tr key={p.id}>
                    <td className="td-muted" style={{ whiteSpace: "nowrap" }}>{fmtDateTime(p.paidAt)}</td>
                    <td className="td-name">{p.userName ?? "—"}</td>
                    <td>{typeBadge(p.type)}</td>
                    <td className="td-muted">{p.description || "—"}</td>
                    <td className="text-right pay-total">{money(p.amount)}</td>
                  </tr>
                ))}
              </tbody>
              {shown.length > 1 && (
                <tfoot>
                  <tr style={{ background: "var(--surface-hover)" }}>
                    <td colSpan={4} style={{ fontWeight: 600, padding: "12px 14px" }}>Total</td>
                    <td className="text-right pay-total" style={{ fontWeight: 700, padding: "12px 14px" }}>{money(shown.reduce((s, p) => s + p.amount, 0))}</td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        )}
      </div>

      {showAdd && (
        <Modal title="Record Payment" onClose={() => { setShowAdd(false); setError(""); }}
          footer={
            <>
              <button className="btn btn-secondary" onClick={() => setShowAdd(false)}>Cancel</button>
              <button className="btn btn-primary" form="pay-form" type="submit" disabled={saving || !userId || !amount}>
                {saving ? "Saving…" : "Record Payment"}
              </button>
            </>
          }
        >
          <form id="pay-form" onSubmit={handleAdd}>
            <div className="form-group">
              <label>Employee *</label>
              <select value={userId} onChange={e => setUserId(e.target.value)} required style={{ width: "100%", padding: "9px 12px", border: "1px solid var(--border)", borderRadius: "var(--radius)", fontSize: 14 }}>
                <option value="">Select employee…</option>
                {team.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div className="form-group">
                <label>Amount ($) *</label>
                <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00" min="0.01" step="0.01" required />
              </div>
              <div className="form-group">
                <label>Type</label>
                <select value={type} onChange={e => setType(e.target.value)} style={{ width: "100%", padding: "9px 12px", border: "1px solid var(--border)", borderRadius: "var(--radius)", fontSize: 14 }}>
                  <option value="payroll">Payroll</option>
                  <option value="bonus">Bonus</option>
                  <option value="job">Job Payment</option>
                </select>
              </div>
            </div>
            <div className="form-group">
              <label>Description</label>
              <input type="text" value={description} onChange={e => setDescription(e.target.value)} placeholder="e.g. Week of Oct 7–13" />
            </div>
            {error && <p className="error-msg">{error}</p>}
          </form>
        </Modal>
      )}
    </div>
  );
}
