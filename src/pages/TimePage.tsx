import { useEffect, useState } from "react";
import { api } from "../lib/api";
import type { TimeEntry, UserWithStats } from "../lib/types";
import { useToast } from "../contexts/Toast";
import { Modal } from "../components/Modal";

function fmt(h: number): string {
  const hrs = Math.floor(h);
  const mins = Math.round((h - hrs) * 60);
  if (hrs === 0) return `${mins}m`;
  return mins > 0 ? `${hrs}h ${mins}m` : `${hrs}h`;
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

function fmtTime(iso: string): string {
  return new Date(iso).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

// Convert ISO to local datetime-local input value
function toLocalInput(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function exportCSV(entries: TimeEntry[]) {
  const header = ["Employee", "Date", "Clock In", "Clock Out", "Duration (hrs)", "Notes"];
  const rows = entries.map(e => [
    e.userName ?? "",
    fmtDate(e.clockIn),
    fmtTime(e.clockIn),
    e.clockOut ? fmtTime(e.clockOut) : "Active",
    (e.hours ?? 0).toFixed(2),
    e.notes ?? "",
  ]);
  const csv = [header, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a"); a.href = url; a.download = "time-entries.csv"; a.click();
  URL.revokeObjectURL(url);
}

export function TimePage() {
  const { toast } = useToast();
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [team, setTeam] = useState<UserWithStats[]>([]);
  const [filter, setFilter] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [editEntry, setEditEntry] = useState<TimeEntry | null>(null);
  const [editClockIn, setEditClockIn] = useState("");
  const [editClockOut, setEditClockOut] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => { load(); }, []);

  async function load() {
    try {
      const [entriesData, teamData] = await Promise.all([api.getTimeEntries(), api.getTeam()]);
      setEntries(entriesData);
      setTeam(teamData.filter(u => u.role !== "owner" && u.active));
    } catch {/* ignore */}
    finally { setLoading(false); }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this time entry?")) return;
    try {
      await api.deleteTimeEntry(id);
      setEntries(es => es.filter(e => e.id !== id));
      setSelected(s => { const n = new Set(s); n.delete(id); return n; });
      toast("Entry deleted");
    } catch { toast("Failed to delete", "error"); }
  }

  async function handleBulkDelete() {
    if (!selected.size || !confirm(`Delete ${selected.size} entr${selected.size === 1 ? "y" : "ies"}?`)) return;
    let ok = 0;
    for (const id of selected) {
      try { await api.deleteTimeEntry(id); ok++; } catch {/* ignore */}
    }
    setEntries(es => es.filter(e => !selected.has(e.id)));
    setSelected(new Set());
    toast(`Deleted ${ok} entr${ok === 1 ? "y" : "ies"}`);
  }

  function openEdit(entry: TimeEntry) {
    setEditEntry(entry);
    setEditClockIn(toLocalInput(entry.clockIn));
    setEditClockOut(entry.clockOut ? toLocalInput(entry.clockOut) : "");
    setEditNotes(entry.notes ?? "");
  }

  async function handleEditSave() {
    if (!editEntry) return;
    setSaving(true);
    try {
      const updates: { clockIn?: string; clockOut?: string | null; notes?: string } = {
        clockIn: new Date(editClockIn).toISOString(),
        notes: editNotes,
      };
      if (editClockOut) updates.clockOut = new Date(editClockOut).toISOString();
      await api.updateTimeEntry(editEntry.id, updates);
      toast("Entry updated");
      setEditEntry(null);
      await load();
    } catch { toast("Failed to save", "error"); }
    finally { setSaving(false); }
  }

  function toggleSelect(id: string) {
    setSelected(s => {
      const n = new Set(s);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  }

  function toggleAll(ids: string[]) {
    const allSelected = ids.every(id => selected.has(id));
    if (allSelected) {
      setSelected(s => { const n = new Set(s); ids.forEach(id => n.delete(id)); return n; });
    } else {
      setSelected(s => { const n = new Set(s); ids.forEach(id => n.add(id)); return n; });
    }
  }

  const displayed = entries
    .filter(e => filter === "all" || e.userId === filter)
    .filter(e => {
      if (!dateFrom && !dateTo) return true;
      const d = new Date(e.clockIn);
      if (dateFrom && d < new Date(dateFrom)) return false;
      if (dateTo) {
        const to = new Date(dateTo); to.setHours(23, 59, 59);
        if (d > to) return false;
      }
      return true;
    });
  const totalHours = displayed.reduce((s, e) => s + (e.hours ?? 0), 0);
  const completedIds = displayed.filter(e => e.clockOut).map(e => e.id);
  const allSelected = completedIds.length > 0 && completedIds.every(id => selected.has(id));

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <div className="page-title">Time Tracking</div>
          <div className="page-subtitle">All employee time entries</div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {selected.size > 0 && (
            <button className="btn btn-sm" style={{ background: "var(--danger)", color: "#fff", border: "none" }} onClick={handleBulkDelete}>
              🗑 Delete {selected.size} selected
            </button>
          )}
          <button className="btn btn-secondary btn-sm" onClick={() => exportCSV(displayed)}>↓ Export CSV</button>
          <button className="btn btn-ghost btn-sm" onClick={load}>↻ Refresh</button>
        </div>
      </div>

      <div className="card">
        {/* Toolbar */}
        <div style={{ padding: "12px 20px", borderBottom: "1px solid var(--border)", display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <select
            value={filter}
            onChange={e => setFilter(e.target.value)}
            style={{ padding: "6px 10px", border: "1px solid var(--border)", borderRadius: "var(--radius)", fontSize: 13, background: "var(--surface)", color: "var(--text)" }}
          >
            <option value="all">All Employees</option>
            {team.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
          </select>
          <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
            style={{ padding: "6px 10px", border: "1px solid var(--border)", borderRadius: "var(--radius)", fontSize: 13, background: "var(--surface)", color: "var(--text)" }} />
          <span style={{ color: "var(--text-muted)", fontSize: 13 }}>–</span>
          <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
            style={{ padding: "6px 10px", border: "1px solid var(--border)", borderRadius: "var(--radius)", fontSize: 13, background: "var(--surface)", color: "var(--text)" }} />
          {(dateFrom || dateTo) && (
            <button className="btn btn-ghost btn-sm" onClick={() => { setDateFrom(""); setDateTo(""); }}>✕ Clear</button>
          )}
          <span style={{ marginLeft: "auto", fontSize: 13, color: "var(--text-muted)", fontWeight: 500 }}>
            {displayed.length} entries · {fmt(totalHours)}
          </span>
        </div>

        {loading ? (
          <div style={{ padding: 40, textAlign: "center" }}><div className="spinner" style={{ margin: "0 auto" }} /></div>
        ) : displayed.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">⏰</div>
            <h3>No time entries</h3>
            <p>Entries will appear here when employees clock in</p>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th style={{ width: 36 }}>
                    <input type="checkbox" checked={allSelected} onChange={() => toggleAll(completedIds)}
                      style={{ cursor: "pointer" }} />
                  </th>
                  <th>Employee</th>
                  <th>Date</th>
                  <th>Clock In</th>
                  <th>Clock Out</th>
                  <th>Duration</th>
                  <th>Notes</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {displayed.map(entry => (
                  <tr key={entry.id} style={{ opacity: selected.has(entry.id) ? 0.65 : 1 }}>
                    <td>
                      {entry.clockOut && (
                        <input type="checkbox" checked={selected.has(entry.id)} onChange={() => toggleSelect(entry.id)}
                          style={{ cursor: "pointer" }} />
                      )}
                    </td>
                    <td className="td-name">{entry.userName ?? "—"}</td>
                    <td className="td-muted">{fmtDate(entry.clockIn)}</td>
                    <td>{fmtTime(entry.clockIn)}</td>
                    <td>
                      {entry.clockOut
                        ? fmtTime(entry.clockOut)
                        : <span className="badge badge-green"><span className="badge-dot" />Active</span>}
                    </td>
                    <td style={{ fontWeight: 500 }}>{fmt(entry.hours ?? 0)}</td>
                    <td className="td-muted" style={{ maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{entry.notes || "—"}</td>
                    <td>
                      <div className="td-actions">
                        <button className="btn btn-ghost btn-sm" onClick={() => openEdit(entry)}>Edit</button>
                        {entry.clockOut && (
                          <button className="btn btn-ghost btn-sm" style={{ color: "var(--danger)" }} onClick={() => handleDelete(entry.id)}>×</button>
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

      {/* Edit modal */}
      {editEntry && (
        <Modal title="Edit Time Entry"
          onClose={() => setEditEntry(null)}
          footer={
            <>
              <button className="btn btn-secondary" onClick={() => setEditEntry(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleEditSave} disabled={saving}>
                {saving ? "Saving…" : "Save"}
              </button>
            </>
          }
        >
          <div style={{ marginBottom: 12, padding: "8px 12px", background: "var(--surface-2)", borderRadius: 8, fontSize: 13, color: "var(--text-muted)" }}>
            {editEntry.userName}
          </div>
          <div className="form-group">
            <label>Clock In</label>
            <input type="datetime-local" value={editClockIn} onChange={e => setEditClockIn(e.target.value)} />
          </div>
          <div className="form-group">
            <label>Clock Out</label>
            <input type="datetime-local" value={editClockOut} onChange={e => setEditClockOut(e.target.value)} />
          </div>
          <div className="form-group">
            <label>Notes</label>
            <input type="text" value={editNotes} onChange={e => setEditNotes(e.target.value)} placeholder="Shift note…" />
          </div>
        </Modal>
      )}
    </div>
  );
}
