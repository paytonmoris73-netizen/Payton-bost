import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { localDate } from "../lib/dates";
import type { Expense } from "../lib/types";
import { Modal } from "../components/Modal";
import { StatCard } from "../components/StatCard";

const CATEGORIES = ["General", "Software", "Hardware", "Travel", "Food", "Marketing", "Office", "Utilities", "Other"];

function money(n: number): string { return "$" + n.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ","); }
function fmtDate(iso: string): string { return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }); }

interface FormState { title: string; amount: string; category: string; vendor: string; notes: string; date: string; recurring: boolean; }
const blank = (): FormState => ({ title: "", amount: "", category: "General", vendor: "", notes: "", date: localDate(), recurring: false });

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
      const payload = { title: form.title.trim(), amount: parseFloat(form.amount), category: form.category, vendor: form.vendor.trim(), notes: form.notes.trim(), date: form.date, recurring: form.recurring };
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
    setForm({ title: exp.title, amount: String(exp.amount), category: exp.category, vendor: exp.vendor, notes: exp.notes, date: exp.date, recurring: exp.recurring });
    setEditExp(exp); setError("");
  }

  const thisMonthStr = localDate().slice(0, 7);
  const recurringMissing = expenses.filter(e => e.recurring && !expenses.some(e2 => e2.title === e.title && e2.recurring && e2.date.startsWith(thisMonthStr) && e2.id !== e.id));

  async function applyRecurring() {
    const today = localDate();
    for (const e of recurringMissing) {
      await api.createExpense({ title: e.title, amount: e.amount, category: e.category, vendor: e.vendor, notes: e.notes, date: today, recurring: true });
    }
    setExpenses(await api.refreshExpenses());
  }

  const shown = filterCat === "all" ? expenses : expenses.filter(e => e.category === filterCat);
  const total = expenses.reduce((s, e) => s + e.amount, 0);
  const thisMonth = expenses.filter(e => e.date.startsWith(thisMonthStr)).reduce((s, e) => s + e.amount, 0);
  const thisWeek = (() => { const w = new Date(); w.setDate(w.getDate() - w.getDay()); const ws = localDate(w); return expenses.filter(e => e.date >= ws).reduce((s, e) => s + e.amount, 0); })();

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

      {recurringMissing.length > 0 && (
        <div style={{ background: "rgba(255,107,53,0.08)", border: "1px solid rgba(255,107,53,0.25)", borderRadius: 10, padding: "12px 16px", marginBottom: 20, display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 16 }}>🔁</span>
          <span style={{ flex: 1, fontWeight: 600, color: "var(--primary)" }}>{recurringMissing.length} recurring expense{recurringMissing.length !== 1 ? "s" : ""} haven't been applied this month</span>
          <button className="btn btn-sm btn-primary" onClick={applyRecurring}>Apply Now</button>
        </div>
      )}

      <div className="stats-grid">
        <StatCard label="Total Spent" value={money(total)} sub="all time" />
        <StatCard label="This Month" value={money(thisMonth)} color="orange" />
        <StatCard label="This Week" value={money(thisWeek)} color="blue" />
        <StatCard label="Transactions" value={expenses.length} sub="all time" />
      </div>

      {catTotals.length > 0 && (
        <div className="card" style={{ marginBottom: 20 }}>
          <div className="card-header"><span className="card-title">Spending by Category</span></div>
          <div style={{ padding: "16px 20px", display: "flex", gap: 28, alignItems: "center", flexWrap: "wrap" }}>
            {/* SVG donut */}
            <DonutChart segments={catTotals.map((x, i) => ({ label: x.cat, value: x.total, color: DONUT_COLORS[i % DONUT_COLORS.length] }))} total={total} />
            {/* Legend */}
            <div style={{ display: "flex", flexDirection: "column", gap: 8, flex: 1, minWidth: 180 }}>
              {catTotals.map(({ cat, total: t }, i) => (
                <div key={cat} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ width: 10, height: 10, borderRadius: 3, background: DONUT_COLORS[i % DONUT_COLORS.length], flexShrink: 0 }} />
                  <div style={{ flex: 1, fontSize: 13, color: "var(--text-secondary)" }}>{cat}</div>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{money(t)}</div>
                  <div style={{ fontSize: 11, color: "var(--text-muted)", width: 36, textAlign: "right" }}>{Math.round(t / total * 100)}%</div>
                </div>
              ))}
            </div>
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
                    <td><span className="badge badge-gray">{e.category}</span>{e.recurring && <span style={{ marginLeft: 4, fontSize: 10, color: "var(--primary)" }}>🔁</span>}</td>
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
            <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 0" }}>
              <input type="checkbox" id="recurring-toggle" checked={form.recurring} onChange={e => setForm(f => ({ ...f, recurring: e.target.checked }))} style={{ width: 16, height: 16, cursor: "pointer" }} />
              <label htmlFor="recurring-toggle" style={{ fontSize: 13, cursor: "pointer", userSelect: "none" }}>🔁 Recurring monthly expense</label>
            </div>
            {error && <p className="error-msg">{error}</p>}
          </form>
        </Modal>
      )}
    </div>
  );
}

const DONUT_COLORS = ["#ff6b35", "#0ea372", "#7c3aed", "#0891b2", "#dc2626", "#d97706", "#65a30d", "#db2777"];

function DonutChart({ segments, total }: { segments: { label: string; value: number; color: string }[]; total: number }) {
  const R = 54, cx = 70, cy = 70, stroke = 18;
  const circ = 2 * Math.PI * R;
  let offset = 0;
  return (
    <svg width={140} height={140} viewBox="0 0 140 140">
      <circle cx={cx} cy={cy} r={R} fill="none" stroke="var(--surface-2)" strokeWidth={stroke} />
      {segments.map(seg => {
        const dash = (seg.value / total) * circ;
        const el = (
          <circle
            key={seg.label}
            cx={cx} cy={cy} r={R}
            fill="none"
            stroke={seg.color}
            strokeWidth={stroke}
            strokeDasharray={`${dash} ${circ}`}
            strokeDashoffset={-offset}
            transform={`rotate(-90 ${cx} ${cy})`}
            strokeLinecap="butt"
          />
        );
        offset += dash;
        return el;
      })}
      <text x={cx} y={cy - 6} textAnchor="middle" style={{ fontSize: 11, fill: "var(--text-muted)", fontFamily: "inherit" }}>Total</text>
      <text x={cx} y={cy + 10} textAnchor="middle" style={{ fontSize: 13, fontWeight: 700, fill: "var(--text)", fontFamily: "inherit" }}>
        {total >= 1000 ? `$${(total / 1000).toFixed(1)}k` : `$${Math.round(total)}`}
      </text>
    </svg>
  );
}
