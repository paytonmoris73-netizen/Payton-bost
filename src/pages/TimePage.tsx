import { useEffect, useState } from "react";
import { api } from "../lib/api";
import type { TimeEntry, UserWithStats } from "../lib/types";
import { useToast } from "../contexts/Toast";

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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    try {
      const [entriesData, teamData] = await Promise.all([api.getTimeEntries(), api.getTeam()]);
      setEntries(entriesData);
      setTeam(teamData.filter(u => u.role !== "owner" && u.active));
    } catch {/* ignore */}
    finally { setLoading(false); }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this time entry? This cannot be undone.")) return;
    try {
      await api.deleteTimeEntry(id);
      setEntries(es => es.filter(e => e.id !== id));
      toast("Time entry deleted");
    } catch {
      toast("Failed to delete entry", "error");
    }
  }

  const displayed = filter === "all" ? entries : entries.filter(e => e.userId === filter);
  const totalHours = displayed.reduce((s, e) => s + (e.hours ?? 0), 0);

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <div className="page-title">Time Tracking</div>
          <div className="page-subtitle">All employee time entries</div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn btn-secondary btn-sm" onClick={() => exportCSV(displayed)}>
            ↓ Export CSV
          </button>
          <button className="btn btn-ghost btn-sm" onClick={load}>↻ Refresh</button>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <span className="card-title">
            Time Entries
            {displayed.length > 0 && <span style={{ fontWeight: 400, color: "var(--text-muted)", marginLeft: 8 }}>· {fmt(totalHours)} total</span>}
          </span>
          <select
            value={filter}
            onChange={e => setFilter(e.target.value)}
            style={{ padding: "6px 10px", border: "1px solid var(--border)", borderRadius: "var(--radius)", fontSize: 13, background: "var(--surface)", color: "var(--text)" }}
          >
            <option value="all">All Employees</option>
            {team.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
          </select>
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
                  <tr key={entry.id}>
                    <td className="td-name">{entry.userName ?? "—"}</td>
                    <td className="td-muted">{fmtDate(entry.clockIn)}</td>
                    <td>{fmtTime(entry.clockIn)}</td>
                    <td>
                      {entry.clockOut
                        ? fmtTime(entry.clockOut)
                        : <span className="badge badge-green"><span className="badge-dot" />Active</span>}
                    </td>
                    <td style={{ fontWeight: 500 }}>{fmt(entry.hours ?? 0)}</td>
                    <td className="td-muted">{entry.notes || "—"}</td>
                    <td>
                      {entry.clockOut && (
                        <button className="btn btn-ghost btn-sm" style={{ color: "var(--danger)" }} onClick={() => handleDelete(entry.id)}>×</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
