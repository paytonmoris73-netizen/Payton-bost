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

  const firstName = user.name.split(" ")[0];

  return (
    <div className="page">
      {/* Premium hero — clock + welcome */}
      <div style={{ background: clocked ? "linear-gradient(135deg,#059669 0%,#10b981 100%)" : "linear-gradient(135deg,#5b6af0 0%,#8b5cf6 100%)", borderRadius: 20, padding: "32px", marginBottom: 24, color: "#fff", transition: "background 0.6s" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 24 }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, opacity: 0.75, marginBottom: 6 }}>Welcome back</div>
            <div style={{ fontSize: 28, fontWeight: 800, letterSpacing: "-0.5px", marginBottom: 4 }}>{firstName}</div>
            <div style={{ fontSize: 14, opacity: 0.8 }}>{user.title}</div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 46, fontWeight: 800, letterSpacing: "0.05em", fontVariantNumeric: "tabular-nums", lineHeight: 1 }}>
              {clocked ? fmtTimer(elapsed) : "--:--:--"}
            </div>
            <div style={{ fontSize: 13, opacity: 0.75, marginTop: 6, fontWeight: 600 }}>
              {clocked && clockEntry ? `Since ${fmtTime(clockEntry.clockIn)}` : "Not clocked in"}
            </div>
          </div>
          <div>
            {clocked ? (
              <button onClick={handleClockOut} disabled={actionLoading} style={{ padding: "14px 36px", borderRadius: 12, fontSize: 15, fontWeight: 700, cursor: "pointer", background: "rgba(255,255,255,0.2)", border: "2px solid rgba(255,255,255,0.4)", color: "#fff", letterSpacing: "0.02em" }}>
                {actionLoading ? "…" : "Clock Out"}
              </button>
            ) : (
              <button onClick={handleClockIn} disabled={actionLoading} style={{ padding: "14px 36px", borderRadius: 12, fontSize: 15, fontWeight: 700, cursor: "pointer", background: "#fff", border: "none", color: "#5b6af0", letterSpacing: "0.02em" }}>
                {actionLoading ? "…" : "Clock In"}
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="stats-grid" style={{ marginBottom: 24 }}>
        <StatCard label="Today" value={fmt(stats?.todayHours ?? 0)} color={clocked ? "green" : undefined} />
        <StatCard label="This Week" value={fmt(stats?.weekHours ?? 0)} color="blue" />
        <StatCard label="This Month" value={fmt(stats?.monthHours ?? 0)} />
        <StatCard label="Week Pay" value={money(stats?.weekPay ?? 0)} sub={stats?.hourlyRate ? `$${stats.hourlyRate}/hr` : "Rate not set"} color="orange" />
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
