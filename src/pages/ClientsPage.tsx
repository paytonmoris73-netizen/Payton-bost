import { useEffect, useState } from "react";
import { api } from "../lib/api";
import type { Client, Invoice } from "../lib/types";
import { Modal } from "../components/Modal";
import { useToast } from "../contexts/Toast";

type Form = Omit<Client, "id" | "createdAt">;
const blank = (): Form => ({ name: "", email: "", phone: "", address: "", notes: "" });

function money(n: number) { return "$" + n.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ","); }

export function ClientsPage() {
  const { toast } = useToast();
  const [clients, setClients] = useState<Client[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Client | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<Form>(blank());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");

  useEffect(() => { load(); }, []);

  async function load() {
    try {
      const [c, i] = await Promise.all([api.getClients(), api.getInvoices()]);
      setClients(c); setInvoices(i);
    } catch { toast("Couldn't load clients", "error"); }
    finally { setLoading(false); }
  }

  function openNew() { setEditing(null); setForm(blank()); setError(""); setShowForm(true); }
  function openEdit(c: Client) { setEditing(c); setForm({ name: c.name, email: c.email, phone: c.phone, address: c.address, notes: c.notes }); setError(""); setShowForm(true); }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSaving(true); setError("");
    try {
      if (editing) await api.updateClient(editing.id, form);
      else await api.createClient(form);
      setShowForm(false);
      setClients(await api.getClients());
      toast(editing ? "Client updated" : "Client added");
    } catch (err) { setError(err instanceof Error ? err.message : "Failed"); }
    finally { setSaving(false); }
  }

  async function handleDelete(c: Client) {
    if (!confirm(`Delete ${c.name}?`)) return;
    try {
      await api.deleteClient(c.id);
      setClients(cs => cs.filter(x => x.id !== c.id));
      toast("Client deleted");
    } catch (err) { toast(err instanceof Error ? err.message : "Delete failed", "error"); }
  }

  function stats(id: string) {
    const mine = invoices.filter(i => i.clientId === id);
    return {
      billed: mine.reduce((s, i) => s + i.total, 0),
      outstanding: mine.filter(i => i.status !== "paid").reduce((s, i) => s + i.total, 0),
      count: mine.length,
    };
  }

  const shown = clients
    .filter(c => !query.trim() || [c.name, c.email, c.phone].some(v => v.toLowerCase().includes(query.toLowerCase())))
    .sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <div className="page-title">Clients</div>
          <div className="page-subtitle">Your customers, their jobs, and what they owe</div>
        </div>
        <button className="btn btn-primary" onClick={openNew}>+ Add Client</button>
      </div>

      <div className="card">
        <div className="card-header">
          <span className="card-title">{clients.length} client{clients.length !== 1 ? "s" : ""}</span>
          {clients.length > 0 && <input type="search" value={query} onChange={e => setQuery(e.target.value)} placeholder="Search…" className="select-sm" aria-label="Search clients" />}
        </div>
        {loading ? (
          <div style={{ padding: 40, textAlign: "center" }}><div className="spinner" style={{ margin: "0 auto" }} /></div>
        ) : clients.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">🤝</div>
            <h3>No clients yet</h3>
            <p>Add a client to link jobs and send invoices.</p>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead><tr><th>Name</th><th>Contact</th><th className="text-right">Billed</th><th className="text-right">Outstanding</th><th></th></tr></thead>
              <tbody>
                {shown.map(c => {
                  const s = stats(c.id);
                  return (
                    <tr key={c.id}>
                      <td>
                        <div className="td-name">{c.name}</div>
                        {c.address && <div className="td-muted" style={{ fontSize: 12 }}>{c.address}</div>}
                      </td>
                      <td className="td-muted">
                        {c.email && <div><a href={`mailto:${c.email}`}>{c.email}</a></div>}
                        {c.phone && <div><a href={`tel:${c.phone}`}>{c.phone}</a></div>}
                        {!c.email && !c.phone && "—"}
                      </td>
                      <td className="text-right">{money(s.billed)}<div className="td-muted" style={{ fontSize: 11 }}>{s.count} invoice{s.count !== 1 ? "s" : ""}</div></td>
                      <td className="text-right" style={{ fontWeight: 700, color: s.outstanding > 0 ? "var(--danger)" : "var(--text-muted)" }}>{money(s.outstanding)}</td>
                      <td>
                        <div className="td-actions">
                          <button className="btn btn-ghost btn-sm" onClick={() => openEdit(c)}>Edit</button>
                          <button className="btn btn-ghost btn-sm" style={{ color: "var(--danger)" }} onClick={() => handleDelete(c)} aria-label={`Delete ${c.name}`}>×</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showForm && (
        <Modal title={editing ? "Edit Client" : "Add Client"} onClose={() => setShowForm(false)}
          footer={<>
            <button className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
            <button className="btn btn-primary" form="client-form" type="submit" disabled={saving || !form.name.trim()}>{saving ? "Saving…" : "Save"}</button>
          </>}>
          <form id="client-form" onSubmit={handleSave}>
            <div className="form-group">
              <label>Name *</label>
              <input type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Riverside Dental" autoFocus required />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div className="form-group">
                <label>Email</label>
                <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="billing@client.com" />
              </div>
              <div className="form-group">
                <label>Phone</label>
                <input type="tel" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="(555) 123-4567" />
              </div>
            </div>
            <div className="form-group">
              <label>Address</label>
              <input type="text" value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} placeholder="Street, city" />
            </div>
            <div className="form-group">
              <label>Notes</label>
              <textarea rows={3} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Gate code, preferred contact time…" />
            </div>
            {error && <p className="error-msg">{error}</p>}
          </form>
        </Modal>
      )}
    </div>
  );
}
