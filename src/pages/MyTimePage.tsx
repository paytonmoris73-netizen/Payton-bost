import { useEffect, useState } from "react";
import { api } from "../lib/api";
import type { User, TimeEntry } from "../lib/types";

interface Props {
  user: User;
}

function fmt(h: number): string {
  const hrs = Math.floor(h);
  const mins = Math.round((h - hrs) * 60);
  if (hrs === 0) return `${mins}m`;
  return mins > 0 ? `${hrs}h ${mins}m` : `${hrs}h`;
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
}

function fmtTime(iso: string): string {
  return new Date(iso).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

export function MyTimePage({ user }: Props) {
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getTimeEntries(user.id)
      .then(setEntries)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user.id]);

  const totalHours = entries.reduce((s, e) => s + (e.hours ?? 0), 0);

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <div className="page-title">My Hours</div>
          <div className="page-subtitle">Your complete time history</div>
        </div>
        <div className="badge badge-blue" style={{ fontSize: 13, padding: "6px 12px" }}>
          Total: {fmt(totalHours)}
        </div>
      </div>

      <div className="card">
        {loading ? (
          <div style={{ padding: 40, textAlign: "center" }}><div className="spinner" style={{ margin: "0 auto" }} /></div>
        ) : entries.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">⏱️</div>
            <h3>No time entries yet</h3>
            <p>Clock in on your dashboard to start tracking time</p>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>Date</th><th>Clock In</th><th>Clock Out</th><th>Duration</th><th>Notes</th></tr>
              </thead>
              <tbody>
                {entries.map(entry => (
                  <tr key={entry.id}>
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
