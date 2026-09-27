import { useEffect, useState } from "react";
import { api } from "../lib/api";
import type { TimeEntry, UserWithStats } from "../lib/types";

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

export function TimePage() {
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

  const displayed = filter === "all"
    ? entries
    : entries.filter(e => e.userId === filter);

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <div className="page-title">Time Tracking</div>
          <div className="page-subtitle">All employee time entries</div>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={load}>↻ Refresh</button>
      </div>

      <div className="card">
        <div className="card-header">
          <span className="card-title">Time Entries</span>
          <select
            value={filter}
            onChange={e => setFilter(e.target.value)}
            style={{ padding: "6px 10px", border: "1px solid var(--border)", borderRadius: "var(--radius)", fontSize: 13, background: "var(--surface)" }}
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
                </tr>
              </thead>
              <tbody>
                {displayed.map(entry => (
                  <tr key={entry.id}>
                    <td className="td-name">{entry.userName ?? "—"}</td>
                    <td>{fmtDate(entry.clockIn)}</td>
                    <td>{fmtTime(entry.clockIn)}</td>
                    <td>
                      {entry.clockOut
                        ? fmtTime(entry.clockOut)
                        : <span className="badge badge-green"><span className="badge-dot" />Active</span>}
                    </td>
                    <td>{fmt(entry.hours ?? 0)}</td>
                    <td className="td-muted">{entry.notes || "—"}</td>
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
