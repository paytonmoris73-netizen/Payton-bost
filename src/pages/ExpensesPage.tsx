import { useEffect, useState } from "react";
import { api } from "../lib/api";
import type { Expense } from "../lib/types";
import { Modal } from "../components/Modal";
import { StatCard } from "../components/StatCard";

const CATEGORIES = ["General", "Software", "Hardware", "Travel", "Food", "Marketing", "Office", "Utilities", "Other"];

function money(n: number): string { return "$" + n.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ","); }
function fmtDate(iso: string): string { return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }); }

interface FormState { title: string; amount: string; category: string; vendor: string; notes: string; date: string; }
const blank = (): FormState => ({ title: "", amount: "", category: "General", vendor: "", notes: "", date: new Date().toISOString().split("T")[0] });

export function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [editExp, setEditExp] = useState<Expense | null>(null);
  const [form, setForm] = useState<FormState>(blank());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [filterCat, setFilterCat] = useState("all");

  useEffect(() => { load(); }, []);

  async function load() {
    try { setExpenses(await api.getExpenses()); } catch {/* ignore */}
    finally { setLoading(false); }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim() || !form.amount) return;
    setSaving(true); setError("");
    try {
      const payload = { title: form.title.trim(), amount: parseFloat(form.amount), category: form.category, vendor: form.vendor.trim(), notes: form.notes.trim(), date: form.date };
      if (editExp) {
        await api.updateExpense(editExp.id, payload);
        setEditExp(null);
      } else {
        await api.createExpense(payload);
        setShowAdd(false);
      }
      setForm(blank());
      setExpenses(await api.refreshExpenses());
    } catch (err) { setError(err instanceof Error ? err.message : "Failed"); }
    finally { setSaving(false); }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this expense?")) return;
    await api.deleteExpense(id);
    setExpenses(await api.refreshExpenses());
  }

  function openEdit(exp: Expense) {
    setForm({ title: exp.title, amount: String(exp.amount), category: exp.category, vendor: exp.vendor, notes: exp.notes, date: exp.date });
    setEditExp(exp); setError("");
  }

  const shown = filterCat === "all" ? expenses : expenses.filter(e => e.category === filterCat);
  const total = expenses.reduce((s, e) => s + e.amount, 0);
  const thisMonth = expenses.filter(e => new Date(e.date) >= new Date(new Date().setDate(1))).reduce((s, e) => s + e.amount, 0);
  const thisWeek = (() => { const w = new Date(); w.setHours(0,0,0,0); w.setDate(w.getDate() - w.getDay()); return expenses.filter(e => new Date(e.date) >= w).reduce((s, e) => s + e.amount, 0); })();

  const catTotals = CATEGORIES.map(c => ({ cat: c, total: expenses.filter(e => e.category === c).reduce((s, e) => s + e.amount, 0) })).filter(x => x.total > 0).sort((a, b) => b.total - a.total);

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <div className="page-title">Expenses</div>
          <div className="page-subtitle">Track business spending and costs</div>
        </div>
        <button className="btn btn-primary" onClick={() => { setShowAdd(true); setForm(blank()); setError(""); }}>+ Add Expense</button>
      </div>

      <div className="stats-grid">
        <StatCard label="Total Spent" value={money(total)} sub="all time" />
        <StatCard label="This Month" value={money(thisMonth)} color="orange" />
        <StatCard label="This Week" value={money(thisWeek)} color="blue" />
        <StatCard label="Transactions" value={expenses.length} sub="all time" />
      </div>

      {catTotals.length > 0 && (
        <div className="card" style={{ marginBottom: 20 }}>
          <div className="card-header"><span className="card-title">By Category</span></div>
          <div className="card-body" style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
            {catTotals.map(({ cat, total: t }) => (
              <div key={cat} style={{ background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 8, padding: "10px 16px", minWidth: 110 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>{cat}</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: "var(--danger)" }}>{money(t)}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="card">
        <div className="card-header">
          <span className="card-title">Expense Log</span>
          <select value={filterCat} onChange={e => setFilterCat(e.target.value)}
            style={{ padding: "6px 10px", border: "1px solid var(--border)", borderRadius: "var(--radius)", fontSize: 13, background: "var(--surface)" }}>
            <option value="all">All Categories</option>
            {CATEGORIES.map(c => <option key={c}>{c}</option>)}
          </select>
        </div>
        {loading ? (
          <div style={{ padding: 40, textAlign: "center" }}><div className="spinner" style={{ margin: "0 auto" }} /></div>
        ) : shown.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">🧾</div>
            <h3>No expenses yet</h3>
            <p>Track your business spending here</p>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>Date</th><th>Title</th><th>Category</th><th>Vendor</th><th>Notes</th><th className="text-right">Amount</th><th></th></tr>
              </thead>
              <tbody>
                {shown.map(e => (
                  <tr key={e.id}>
                    <td className="td-muted" style={{ whiteSpace: "nowrap" }}>{fmtDate(e.date)}</td>
                    <td className="td-name">{e.title}</td>
                    <td><span className="badge badge-gray">{e.category}</span></td>
                    <td className="td-muted">{e.vendor || "—"}</td>
                    <td className="td-muted" style={{ maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{e.notes || "—"}</td>
                    <td className="text-right" style={{ fontWeight: 700, color: "var(--danger)" }}>{money(e.amount)}</td>
                    <td>
                      <div className="td-actions">
                        <button className="btn btn-ghost btn-sm" onClick={() => openEdit(e)}>Edit</button>
                        <button className="btn btn-ghost btn-sm" style={{ color: "var(--danger)" }} onClick={() => handleDelete(e.id)}>×</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
              {shown.length > 1 && (
                <tfoot>
                  <tr style={{ background: "var(--surface-hover)" }}>
                    <td colSpan={5} style={{ fontWeight: 600, padding: "12px 16px" }}>Total</td>
                    <td className="text-right" style={{ fontWeight: 700, padding: "12px 16px", color: "var(--danger)" }}>{money(shown.reduce((s, e) => s + e.amount, 0))}</td>
                    <td />
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        )}
      </div>

      {(showAdd || editExp) && (
        <Modal title={editExp ? "Edit Expense" : "Add Expense"}
          onClose={() => { setShowAdd(false); setEditExp(null); setForm(blank()); setError(""); }}
          footer={
            <>
              <button className="btn btn-secondary" onClick={() => { setShowAdd(false); setEditExp(null); }}>Cancel</button>
              <button className="btn btn-primary" form="exp-form" type="submit" disabled={saving}>
                {saving ? "Saving…" : editExp ? "Save" : "Add Expense"}
              </button>
            </>
          }
        >
          <form id="exp-form" onSubmit={handleSave}>
            <div className="form-group">
              <label>Title *</label>
              <input type="text" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. Figma subscription" autoFocus required />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div className="form-group">
                <label>Amount ($) *</label>
                <input type="number" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} placeholder="0.00" min="0.01" step="0.01" required />
              </div>
              <div className="form-group">
                <label>Date</label>
                <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div className="form-group">
                <label>Category</label>
                <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                  style={{ width: "100%", padding: "9px 12px", border: "1.5px solid var(--border)", borderRadius: "var(--radius)", fontSize: 14, fontFamily: "inherit", background: "var(--surface)" }}>
                  {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Vendor</label>
                <input type="text" value={form.vendor} onChange={e => setForm(f => ({ ...f, vendor: e.target.value }))} placeholder="e.g. Figma Inc." />
              </div>
            </div>
            <div className="form-group">
              <label>Notes</label>
              <input type="text" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Optional details" />
            </div>
            {error && <p className="error-msg">{error}</p>}
          </form>
        </Modal>
      )}
    </div>
  );
}
