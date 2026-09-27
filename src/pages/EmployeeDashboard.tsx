import { useEffect, useState, useCallback } from "react";
import { api } from "../lib/api";
import type { User, UserWithStats, TimeEntry } from "../lib/types";
import { StatCard } from "../components/StatCard";

interface Props {
  user: User;
  onUserUpdate: (u: UserWithStats) => void;
}

function fmt(h: number): string {
  const hrs = Math.floor(h);
  const mins = Math.round((h - hrs) * 60);
  if (hrs === 0) return `${mins}m`;
  return mins > 0 ? `${hrs}h ${mins}m` : `${hrs}h`;
}

function fmtTimer(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return [h, m, s].map(v => String(v).padStart(2, "0")).join(":");
}

function money(n: number): string {
  return "$" + n.toFixed(2);
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function fmtTime(iso: string): string {
  return new Date(iso).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

export function EmployeeDashboard({ user, onUserUpdate }: Props) {
  const [stats, setStats] = useState<UserWithStats | null>(null);
  const [clocked, setClocked] = useState(false);
  const [clockEntry, setClockEntry] = useState<TimeEntry | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [recentEntries, setRecentEntries] = useState<TimeEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const load = useCallback(async () => {
    try {
      const [me, status, entries] = await Promise.all([
        api.getMe(user.id),
        api.getTimeStatus(user.id),
        api.getTimeEntries(user.id),
      ]);
      setStats(me);
      onUserUpdate(me);
      setClocked(status.clocked);
      setClockEntry(status.entry ?? null);
      setRecentEntries(entries.slice(0, 10));
    } catch {/* ignore */}
    finally { setLoading(false); }
  }, [user.id, onUserUpdate]);

  useEffect(() => {
    load();
  }, [load]);

  // Live elapsed timer
  useEffect(() => {
    if (!clocked || !clockEntry) { setElapsed(0); return; }
    const start = new Date(clockEntry.clockIn).getTime();
    const tick = () => setElapsed(Math.floor((Date.now() - start) / 1000));
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [clocked, clockEntry]);

  async function handleClockIn() {
    setActionLoading(true);
    try {
      await api.clockIn(user.id);
      await load();
    } catch {/* ignore */}
    finally { setActionLoading(false); }
  }

  async function handleClockOut() {
    setActionLoading(true);
    try {
      await api.clockOut(user.id);
      await load();
    } catch {/* ignore */}
    finally { setActionLoading(false); }
  }

  if (loading) return <div className="page"><div className="spinner" /></div>;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <div className="page-title">Hi, {user.name.split(" ")[0]} 👋</div>
          <div className="page-subtitle">{user.title}</div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 24 }}>
        <div className="clock-widget">
          <div className="clock-label">{clocked ? "Currently Working" : "Not Clocked In"}</div>
          <div className={`clock-time${clocked ? " active" : ""}`}>
            {clocked ? fmtTimer(elapsed) : "--:--:--"}
          </div>
          <div className="clock-btn-wrap">
            {clocked ? (
              <button className="clock-btn out" onClick={handleClockOut} disabled={actionLoading}>
                {actionLoading ? "…" : "Clock Out"}
              </button>
            ) : (
              <button className="clock-btn in" onClick={handleClockIn} disabled={actionLoading}>
                {actionLoading ? "…" : "Clock In"}
              </button>
            )}
          </div>
          {clocked && clockEntry && (
            <div className="clock-since">Since {fmtTime(clockEntry.clockIn)}</div>
          )}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <StatCard label="Today" value={fmt(stats?.todayHours ?? 0)} color={clocked ? "green" : undefined} />
          <StatCard label="This Week" value={fmt(stats?.weekHours ?? 0)} color="blue" />
          <StatCard label="Week Pay" value={money(stats?.weekPay ?? 0)} sub={stats?.hourlyRate ? `$${stats.hourlyRate}/hr` : "Rate not set"} color="orange" />
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <span className="card-title">Recent Time Entries</span>
        </div>
        {recentEntries.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">⏱️</div>
            <h3>No entries yet</h3>
            <p>Your time entries will appear here</p>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>Date</th><th>Clock In</th><th>Clock Out</th><th>Duration</th></tr>
              </thead>
              <tbody>
                {recentEntries.map(entry => (
                  <tr key={entry.id}>
                    <td>{fmtDate(entry.clockIn)}</td>
                    <td>{fmtTime(entry.clockIn)}</td>
                    <td>{entry.clockOut ? fmtTime(entry.clockOut) : <span className="badge badge-green"><span className="badge-dot" />Active</span>}</td>
                    <td>{fmt(entry.hours ?? 0)}</td>
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
