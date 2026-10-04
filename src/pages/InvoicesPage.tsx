import { useEffect, useState } from "react";
import { api } from "../lib/api";
import type { Client, Invoice, InvoiceItem, Job, TimeEntry } from "../lib/types";
import { Modal } from "../components/Modal";
import { StatCard } from "../components/StatCard";
import { useToast } from "../contexts/Toast";
import { escapeHtml } from "../lib/escape";

function money(n: number) { return "$" + n.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ","); }
function isoDate(d: Date) { return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; }
function plusDays(n: number) { const d = new Date(); d.setDate(d.getDate() + n); return isoDate(d); }
function fmt(d: string) { return new Date(d + "T00:00:00").toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }); }

interface Form {
  clientId: string;
  jobId: string;
  items: Array<{ description: string; quantity: string; unitPrice: string }>;
  taxRate: string;
  issueDate: string;
  dueDate: string;
  notes: string;
}
const blankItem = () => ({ description: "", quantity: "1", unitPrice: "" });
const blank = (): Form => ({ clientId: "", jobId: "", items: [blankItem()], taxRate: "0", issueDate: isoDate(new Date()), dueDate: plusDays(14), notes: "" });

function statusBadge(inv: Invoice) {
  if (inv.status === "paid") return <span className="badge badge-green">Paid</span>;
  if (inv.overdue) return <span className="badge badge-red">Overdue</span>;
  if (inv.status === "sent") return <span className="badge badge-blue">Sent</span>;
  return <span className="badge badge-gray">Draft</span>;
}

function printInvoice(inv: Invoice, company: string) {
  const w = window.open("", "_blank", "width=800,height=900");
  if (!w) return;
  const e = escapeHtml;
  const sub = inv.items.reduce((s, i) => s + i.quantity * i.unitPrice, 0);
  const rows = inv.items.map(i => `<tr><td>${e(i.description)}</td><td class="r">${i.quantity}</td><td class="r">${money(i.unitPrice)}</td><td class="r">${money(i.quantity * i.unitPrice)}</td></tr>`).join("");
  w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>${e(inv.number)}</title><style>
    body{font-family:-apple-system,Segoe UI,Roboto,sans-serif;color:#1a1a1a;padding:48px;max-width:760px;margin:auto}
    h1{font-size:28px;margin:0;color:#ff6b35}.top{display:flex;justify-content:space-between;margin-bottom:36px}
    .muted{color:#777;font-size:13px}table{width:100%;border-collapse:collapse;margin-top:24px}
    th{text-align:left;font-size:12px;text-transform:uppercase;color:#777;border-bottom:2px solid #eee;padding:8px 4px}
    td{padding:10px 4px;border-bottom:1px solid #f0f0f0}.r{text-align:right}
    .tot{margin-left:auto;width:260px;margin-top:20px}.tot div{display:flex;justify-content:space-between;padding:4px 0}
    .grand{font-size:20px;font-weight:800;border-top:2px solid #1a1a1a;padding-top:8px!important;margin-top:6px}
    .notes{margin-top:36px;font-size:13px;color:#555;white-space:pre-wrap}
  </style></head><body>
    <div class="top"><div><h1>INVOICE</h1><div class="muted">${e(inv.number)}</div></div>
    <div style="text-align:right"><strong>${e(company)}</strong><div class="muted">Issued ${fmt(inv.issueDate)}<br>Due ${fmt(inv.dueDate)}</div></div></div>
    <div class="muted">Bill to</div><strong>${e(inv.clientName)}</strong>
    ${inv.clientAddress ? `<div class="muted">${e(inv.clientAddress)}</div>` : ""}${inv.clientEmail ? `<div class="muted">${e(inv.clientEmail)}</div>` : ""}
    <table><thead><tr><th>Description</th><th class="r">Qty</th><th class="r">Rate</th><th class="r">Amount</th></tr></thead><tbody>${rows}</tbody></table>
    <div class="tot"><div><span>Subtotal</span><span>${money(sub)}</span></div>
    ${inv.taxRate ? `<div><span>Tax (${inv.taxRate}%)</span><span>${money(inv.total - sub)}</span></div>` : ""}
    <div class="grand"><span>Total</span><span>${money(inv.total)}</span></div>
    ${inv.status === "paid" ? `<div style="color:#0ea372;font-weight:700"><span>PAID</span><span>${inv.paidAt ? new Date(inv.paidAt).toLocaleDateString() : ""}</span></div>` : ""}</div>
    ${inv.notes ? `<div class="notes">${e(inv.notes)}</div>` : ""}
  </body></html>`);
  w.document.close();
  w.focus();
  w.print();
}

export function InvoicesPage() {
  const { toast } = useToast();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [company, setCompany] = useState("");
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "unpaid" | "overdue" | "paid" | "draft">("all");
  const [editing, setEditing] = useState<Invoice | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<Form>(blank());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => { load(); }, []);

  async function load() {
    try {
      const [inv, cl, jb, te, co] = await Promise.all([api.getInvoices(), api.getClients(), api.getJobs(), api.getTimeEntries(), api.getCompany()]);
      setInvoices(inv); setClients(cl); setJobs(jb); setEntries(te); setCompany(co.name);
    } catch { toast("Couldn't load invoices", "error"); }
    finally { setLoading(false); }
  }

  const unbilled = jobs.filter(j => j.status === "completed" && j.clientId && !invoices.some(i => i.jobId === j.id));

  function itemsForJob(j: Job): Form["items"] {
    if (j.payType === "fixed") return [{ description: j.title, quantity: "1", unitPrice: String(j.payAmount) }];
    const hrs = entries.filter(e => e.jobId === j.id).reduce((s, e) => s + (e.hours ?? 0), 0);
    return [{ description: `${j.title} (labor)`, quantity: (Math.round(hrs * 100) / 100 || 1).toString(), unitPrice: String(j.payAmount) }];
  }

  function openNew(job?: Job) {
    setEditing(null); setError("");
    const f = blank();
    if (job) { f.clientId = job.clientId ?? ""; f.jobId = job.id; f.items = itemsForJob(job); }
    else if (clients[0]) f.clientId = clients[0].id;
    setForm(f); setShowForm(true);
  }

  function openEdit(inv: Invoice) {
    setEditing(inv); setError("");
    setForm({
      clientId: inv.clientId, jobId: inv.jobId ?? "",
      items: inv.items.map(i => ({ description: i.description, quantity: String(i.quantity), unitPrice: String(i.unitPrice) })),
      taxRate: String(inv.taxRate), issueDate: inv.issueDate, dueDate: inv.dueDate, notes: inv.notes,
    });
    setShowForm(true);
  }

  const parsedItems: InvoiceItem[] = form.items
    .map(i => ({ description: i.description.trim(), quantity: parseFloat(i.quantity) || 0, unitPrice: parseFloat(i.unitPrice) || 0 }))
    .filter(i => i.description && i.quantity > 0);
  const subtotal = parsedItems.reduce((s, i) => s + i.quantity * i.unitPrice, 0);
  const tax = subtotal * (parseFloat(form.taxRate) || 0) / 100;

  async function handleSave(status?: Invoice["status"]) {
    if (!form.clientId) { setError("Choose a client."); return; }
    if (!parsedItems.length) { setError("Add at least one line item with a description."); return; }
    if (form.dueDate < form.issueDate) { setError("Due date can't be before the issue date."); return; }
    setSaving(true); setError("");
    const payload = { clientId: form.clientId, items: parsedItems, taxRate: parseFloat(form.taxRate) || 0, issueDate: form.issueDate, dueDate: form.dueDate, notes: form.notes.trim() };
    try {
      if (editing) await api.updateInvoice(editing.id, { ...payload, ...(status ? { status } : {}) });
      else await api.createInvoice({ ...payload, jobId: form.jobId || undefined, status: status ?? "draft" });
      setShowForm(false);
      setInvoices(await api.getInvoices());
      toast(editing ? "Invoice updated" : "Invoice created");
    } catch (err) { setError(err instanceof Error ? err.message : "Failed"); }
    finally { setSaving(false); }
  }

  async function setStatus(inv: Invoice, status: Invoice["status"]) {
    try {
      const updated = await api.updateInvoice(inv.id, { status });
      setInvoices(list => list.map(i => i.id === inv.id ? updated : i));
      toast(status === "paid" ? `${inv.number} marked paid` : `${inv.number} marked ${status}`);
    } catch { toast("Update failed", "error"); }
  }

  async function handleDelete(inv: Invoice) {
    if (!confirm(`Delete ${inv.number}?`)) return;
    await api.deleteInvoice(inv.id);
    setInvoices(list => list.filter(i => i.id !== inv.id));
  }

  function updateItem(idx: number, key: keyof Form["items"][number], value: string) {
    setForm(f => ({ ...f, items: f.items.map((it, i) => i === idx ? { ...it, [key]: value } : it) }));
  }

  const outstanding = invoices.filter(i => i.status !== "paid").reduce((s, i) => s + i.total, 0);
  const overdueAmt = invoices.filter(i => i.overdue).reduce((s, i) => s + i.total, 0);
  const monthStart = isoDate(new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const paidMonth = invoices.filter(i => i.status === "paid" && i.paidAt && isoDate(new Date(i.paidAt)) >= monthStart).reduce((s, i) => s + i.total, 0);

  const shown = invoices.filter(i =>
    filter === "all" ? true :
    filter === "unpaid" ? i.status !== "paid" :
    filter === "overdue" ? i.overdue :
    i.status === filter);

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <div className="page-title">Invoices</div>
          <div className="page-subtitle">Bill clients and track what's been paid</div>
        </div>
        <button className="btn btn-primary" onClick={() => openNew()} disabled={clients.length === 0} title={clients.length === 0 ? "Add a client first" : undefined}>+ New Invoice</button>
      </div>

      <div className="stats-grid">
        <StatCard label="Outstanding" value={money(outstanding)} color="orange" />
        <StatCard label="Overdue" value={money(overdueAmt)} color={overdueAmt > 0 ? "red" : undefined} />
        <StatCard label="Paid this month" value={money(paidMonth)} color="green" />
        <StatCard label="Invoices" value={invoices.length} sub="all time" />
      </div>

      {!loading && clients.length === 0 && (
        <div className="callout">Add your first client on the <strong>Clients</strong> page to start invoicing.</div>
      )}

      {unbilled.length > 0 && (
        <div className="card" style={{ marginBottom: 20 }}>
          <div className="card-header"><span className="card-title">Ready to bill</span><span className="td-muted" style={{ fontSize: 12 }}>Completed jobs with no invoice</span></div>
          <div style={{ padding: "8px 16px 14px", display: "flex", flexWrap: "wrap", gap: 8 }}>
            {unbilled.map(j => (
              <button key={j.id} className="btn btn-secondary btn-sm" onClick={() => openNew(j)}>
                🧾 {j.title} · {clients.find(c => c.id === j.clientId)?.name ?? "Client"}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="card">
        <div className="card-header" style={{ flexWrap: "wrap", gap: 6 }}>
          <div className="tabs-inline">
            {(["all", "unpaid", "overdue", "draft", "paid"] as const).map(f => (
              <button key={f} className={`btn btn-sm ${filter === f ? "btn-primary" : "btn-ghost"}`} onClick={() => setFilter(f)} aria-pressed={filter === f}>
                {f[0].toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
        </div>
        {loading ? (
          <div style={{ padding: 40, textAlign: "center" }}><div className="spinner" style={{ margin: "0 auto" }} /></div>
        ) : shown.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">🧾</div>
            <h3>{invoices.length === 0 ? "No invoices yet" : "No invoices match"}</h3>
            <p>{invoices.length === 0 ? "Create an invoice to get paid faster." : "Try a different filter."}</p>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead><tr><th>Invoice</th><th>Client</th><th>Due</th><th>Status</th><th className="text-right">Total</th><th></th></tr></thead>
              <tbody>
                {shown.map(inv => (
                  <tr key={inv.id}>
                    <td className="td-name" style={{ cursor: "pointer" }} onClick={() => openEdit(inv)}>{inv.number}</td>
                    <td>{inv.clientName}</td>
                    <td className="td-muted" style={{ whiteSpace: "nowrap", color: inv.overdue ? "var(--danger)" : undefined }}>{fmt(inv.dueDate)}</td>
                    <td>{statusBadge(inv)}</td>
                    <td className="text-right" style={{ fontWeight: 700 }}>{money(inv.total)}</td>
                    <td>
                      <div className="td-actions">
                        {inv.status === "draft" && <button className="btn btn-ghost btn-sm" onClick={() => setStatus(inv, "sent")}>Mark sent</button>}
                        {inv.status !== "paid" && <button className="btn btn-ghost btn-sm" style={{ color: "var(--success)" }} onClick={() => setStatus(inv, "paid")}>Mark paid</button>}
                        <button className="btn btn-ghost btn-sm" onClick={() => printInvoice(inv, company)} aria-label={`Print ${inv.number}`}>🖨</button>
                        <button className="btn btn-ghost btn-sm" style={{ color: "var(--danger)" }} onClick={() => handleDelete(inv)} aria-label={`Delete ${inv.number}`}>×</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showForm && (
        <Modal title={editing ? `Edit ${editing.number}` : "New Invoice"} onClose={() => setShowForm(false)}
          footer={<>
            <button className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
            <button className="btn btn-secondary" onClick={() => handleSave()} disabled={saving}>{editing ? "Save" : "Save draft"}</button>
            {(!editing || editing.status === "draft") && <button className="btn btn-primary" onClick={() => handleSave("sent")} disabled={saving}>{saving ? "Saving…" : "Save & mark sent"}</button>}
          </>}>
          <div className="form-group">
            <label>Client *</label>
            <select value={form.clientId} onChange={e => setForm(f => ({ ...f, clientId: e.target.value }))}>
              <option value="">Choose a client…</option>
              {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div className="form-group"><label>Issue date</label><input type="date" value={form.issueDate} onChange={e => setForm(f => ({ ...f, issueDate: e.target.value }))} /></div>
            <div className="form-group"><label>Due date</label><input type="date" value={form.dueDate} onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))} /></div>
          </div>

          <label style={{ fontSize: 13, fontWeight: 600, display: "block", marginBottom: 6 }}>Line items</label>
          <div className="line-items">
            {form.items.map((it, idx) => (
              <div key={idx} className="line-item">
                <input type="text" value={it.description} onChange={e => updateItem(idx, "description", e.target.value)} placeholder="Description" aria-label="Item description" />
                <input type="number" min="0" step="0.01" value={it.quantity} onChange={e => updateItem(idx, "quantity", e.target.value)} placeholder="Qty" aria-label="Quantity" />
                <input type="number" min="0" step="0.01" value={it.unitPrice} onChange={e => updateItem(idx, "unitPrice", e.target.value)} placeholder="Rate" aria-label="Unit price" />
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => setForm(f => ({ ...f, items: f.items.length > 1 ? f.items.filter((_, i) => i !== idx) : [blankItem()] }))} aria-label="Remove item">×</button>
              </div>
            ))}
          </div>
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => setForm(f => ({ ...f, items: [...f.items, blankItem()] }))}>+ Add line</button>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 12 }}>
            <div className="form-group"><label>Tax rate (%)</label><input type="number" min="0" max="100" step="0.01" value={form.taxRate} onChange={e => setForm(f => ({ ...f, taxRate: e.target.value }))} /></div>
            <div style={{ textAlign: "right", alignSelf: "end", paddingBottom: 14, fontSize: 13 }}>
              <div className="td-muted">Subtotal {money(subtotal)}{tax > 0 && <> · Tax {money(tax)}</>}</div>
              <div style={{ fontSize: 20, fontWeight: 800 }}>{money(subtotal + tax)}</div>
            </div>
          </div>
          <div className="form-group">
            <label>Notes / payment terms</label>
            <textarea rows={2} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="e.g. Pay by bank transfer or check. Thank you!" />
          </div>
          {error && <p className="error-msg">{error}</p>}
        </Modal>
      )}
    </div>
  );
}
