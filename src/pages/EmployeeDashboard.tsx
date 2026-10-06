import { useEffect, useState, useCallback } from "react";
import { api } from "../lib/api";
import type { User, UserWithStats, TimeEntry, Job, BreakEntry } from "../lib/types";
import { StatCard } from "../components/StatCard";
import { useToast } from "../contexts/Toast";
import { getPosition } from "../lib/geo";

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
  const { toast } = useToast();
  const [stats, setStats] = useState<UserWithStats | null>(null);
  const [clocked, setClocked] = useState(false);
  const [clockEntry, setClockEntry] = useState<TimeEntry | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [recentEntries, setRecentEntries] = useState<TimeEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [noteText, setNoteText] = useState("");
  const [showClockInNote, setShowClockInNote] = useState(false);
  const [clockInNote, setClockInNote] = useState("");
  const [clockInJobId, setClockInJobId] = useState("");
  const [myJobs, setMyJobs] = useState<Job[]>([]);
  const [onBreak, setOnBreak] = useState(false);
  const [breakElapsed, setBreakElapsed] = useState(0);

  const load = useCallback(async () => {
    try {
      const [me, status, entries, jobs] = await Promise.all([
        api.getMe(user.id),
        api.getTimeStatus(user.id),
        api.getTimeEntries(user.id),
        api.getJobs(user.id),
      ]);
      setStats(me);
      onUserUpdate(me);
      setClocked(status.clocked);
      setClockEntry(status.entry ?? null);
      const activeEntry = status.entry;
      const currentBreak = activeEntry?.breaks?.find((b: BreakEntry) => !b.breakEnd) ?? null;
      setOnBreak(!!currentBreak);
      setRecentEntries(entries.slice(0, 10));
      setMyJobs(jobs.filter(j => j.status !== "completed" && j.assignedTo.includes(user.id)));
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
    const totalBreakMs = (clockEntry.breaks ?? []).filter((b: BreakEntry) => b.breakEnd).reduce((s: number, b: BreakEntry) => s + (new Date(b.breakEnd!).getTime() - new Date(b.breakStart).getTime()), 0);
    const tick = () => setElapsed(Math.floor((Date.now() - start - totalBreakMs) / 1000));
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [clocked, clockEntry]);

  // Break timer
  useEffect(() => {
    if (!onBreak || !clockEntry) { setBreakElapsed(0); return; }
    const activeBreak = (clockEntry.breaks ?? []).find((b: BreakEntry) => !b.breakEnd);
    if (!activeBreak) { setBreakElapsed(0); return; }
    const breakStart = new Date(activeBreak.breakStart).getTime();
    const tick = () => setBreakElapsed(Math.floor((Date.now() - breakStart) / 1000));
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [onBreak, clockEntry]);

  function initiateClockIn() {
    setClockInNote("");
    setClockInJobId("");
    setShowClockInNote(true);
  }

  async function handleClockIn(note?: string) {
    setShowClockInNote(false);
    setActionLoading(true);
    try {
      const location = await getPosition();
      await api.clockIn(user.id, note, clockInJobId || undefined, location);
      toast("Clocked in successfully");
      await load();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Couldn't clock in", "error");
    }
    finally { setActionLoading(false); }
  }

  async function handleBreak() {
    if (!clockEntry) return;
    setActionLoading(true);
    try {
      if (onBreak) {
        await api.endBreak(clockEntry.id);
        toast("Break ended");
      } else {
        await api.startBreak(clockEntry.id);
        toast("Break started");
      }
      await load();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Couldn't update break", "error");
    }
    finally { setActionLoading(false); }
  }

  function initiateClockOut() {
    setNoteText("");
    setShowNoteModal(true);
  }

  async function handleClockOut(note?: string) {
    setShowNoteModal(false);
    setActionLoading(true);
    try {
      const location = await getPosition(5000);
      await api.clockOut(user.id, note, location);
      toast("Clocked out successfully");
      await load();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Couldn't clock out", "error");
    }
    finally { setActionLoading(false); }
  }

  if (loading) return <div className="page"><div className="spinner" /></div>;

  const firstName = user.name.split(" ")[0];

  return (
    <div className="page">
      {/* Greeting */}
      <div className="dash-head">
        <div>
          <h1 className="dash-greeting">Welcome back, {firstName}</h1>
          <div className="dash-sub">{user.title}</div>
        </div>
      </div>

      {/* Clock status card */}
      <div className={`clock-card${clocked ? " clocked" : ""}`}>
        <div className="clock-card-status">
          <span className={`clock-pill${clocked ? " on" : ""}`}>
            {clocked ? (onBreak ? <><span className="badge-dot" style={{ background: "#f59e0b" }} />On break</> : <><span className="badge-dot" />On the clock</>) : "Off the clock"}
          </span>
          <div className="clock-card-since">
            {clocked && clockEntry ? `Started at ${fmtTime(clockEntry.clockIn)}` : "Clock in to start tracking your shift"}
          </div>
        </div>
        <div className="clock-card-timer">
          {clocked ? (onBreak ? <span style={{ color: "#f59e0b" }}>{fmtTimer(breakElapsed)}</span> : fmtTimer(elapsed)) : "00:00:00"}
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "flex-end" }}>
          {clocked && (
            <button className="btn btn-lg" onClick={handleBreak} disabled={actionLoading}
              style={{ background: onBreak ? "var(--primary)" : "var(--surface)", border: "1.5px solid var(--border-strong)", color: onBreak ? "#fff" : "var(--text)" }}>
              {actionLoading ? "…" : onBreak ? "End break" : "Start break"}
            </button>
          )}
          {clocked ? (
            <button className="btn btn-lg" onClick={initiateClockOut} disabled={actionLoading}
              style={{ background: "var(--surface)", border: "1.5px solid var(--border-strong)", color: "var(--text)" }}>
              {actionLoading ? "…" : "Clock out"}
            </button>
          ) : (
            <button className="btn btn-primary btn-lg" onClick={initiateClockIn} disabled={actionLoading}>
              {actionLoading ? "…" : "Clock in"}
            </button>
          )}
        </div>
      </div>

      <div className="stats-grid" style={{ marginBottom: 24 }}>
        <StatCard label="Today" value={fmt(stats?.todayHours ?? 0)} color={clocked ? "green" : undefined} icon={<TodayIcon />} />
        <StatCard label="This week" value={fmt(stats?.weekHours ?? 0)} color="blue" icon={<WeekIcon />} />
        <StatCard label="This month" value={fmt(stats?.monthHours ?? 0)} icon={<MonthIcon />} />
        <StatCard label="Week pay" value={money(stats?.weekPay ?? 0)} sub={stats?.hourlyRate ? `$${stats.hourlyRate}/hr` : "Rate not set"} color="orange" icon={<WalletIcon />} />
      </div>

      {/* Monthly earnings summary */}
      {stats && stats.hourlyRate > 0 && (
        <div className="card" style={{ marginBottom: 24 }}>
          <div className="card-header"><span className="card-title">This Month's Earnings</span></div>
          <div style={{ padding: "16px 20px", display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(160px,1fr))", gap: 12 }}>
            {[
              { label: "Hours Worked", value: fmt(stats.monthHours), color: "var(--primary)" },
              { label: "Gross Earned", value: "$" + stats.monthPay.toFixed(2), color: "var(--text)" },
              { label: "Total Paid", value: "$" + stats.totalPaid.toFixed(2), color: "var(--success)" },
              { label: stats.totalOwed > 0 ? "Outstanding" : "Balance", value: stats.totalOwed > 0 ? "-$" + stats.totalOwed.toFixed(2) : "✓ Settled", color: stats.totalOwed > 0 ? "var(--danger)" : "var(--success)" },
            ].map(({ label, value, color }) => (
              <div key={label} style={{ background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 10, padding: "12px 14px" }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>{label}</div>
                <div style={{ fontSize: 18, fontWeight: 700, color }}>{value}</div>
              </div>
            ))}
          </div>
          {stats.totalOwed > 0 && (
            <div style={{ margin: "0 20px 16px", padding: "10px 14px", background: "rgba(214,59,59,0.08)", border: "1px solid rgba(214,59,59,0.2)", borderRadius: 8, fontSize: 13, color: "var(--danger)", fontWeight: 500 }}>
              You have ${stats.totalOwed.toFixed(2)} outstanding — contact your manager to arrange payment.
            </div>
          )}
        </div>
      )}

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

      {/* Upcoming jobs */}
      {myJobs.length > 0 && (
        <div className="card" style={{ marginTop: 24 }}>
          <div className="card-header"><span className="card-title">My Open Jobs</span></div>
          <div style={{ padding: "0 20px 12px" }}>
            {myJobs.map(j => {
              const overdue = j.dueDate && new Date(j.dueDate) < new Date();
              return (
                <div key={j.id} style={{ padding: "12px 0", borderBottom: "1px solid var(--border)", display: "flex", gap: 12, alignItems: "flex-start" }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: j.priority === "urgent" ? "#dc2626" : j.priority === "high" ? "var(--primary)" : "var(--success)", marginTop: 5, flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{j.title}</div>
                    <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{j.category} · {j.status.replace("_", " ")}</div>
                  </div>
                  {j.dueDate && (
                    <div style={{ fontSize: 11, fontWeight: 600, color: overdue ? "#dc2626" : "var(--text-muted)", background: overdue ? "rgba(220,38,38,0.08)" : "var(--surface-2)", border: `1px solid ${overdue ? "rgba(220,38,38,0.2)" : "var(--border)"}`, borderRadius: 6, padding: "3px 8px", whiteSpace: "nowrap" }}>
                      {overdue ? "⚠ Overdue" : "Due " + new Date(j.dueDate).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Clock-in note modal */}
      {showClockInNote && (
        <div onClick={() => setShowClockInNote(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 500, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
          <div onClick={e => e.stopPropagation()} style={{ background: "var(--surface)", borderRadius: 14, border: "1px solid var(--border)", boxShadow: "0 16px 48px rgba(0,0,0,0.15)", width: "100%", maxWidth: 400, padding: 28 }}>
            <div style={{ fontSize: 17, fontWeight: 700, marginBottom: 6 }}>Clock In</div>
            <div style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 20 }}>Optionally note what you'll be working on.</div>
            {myJobs.length > 0 && (
              <div className="form-group">
                <label>Link to Job (optional)</label>
                <select value={clockInJobId} onChange={e => setClockInJobId(e.target.value)}
                  style={{ width: "100%", padding: "9px 12px", border: "1.5px solid var(--border)", borderRadius: "var(--radius)", fontSize: 14, fontFamily: "inherit", background: "var(--surface)" }}>
                  <option value="">No job</option>
                  {myJobs.map(j => <option key={j.id} value={j.id}>{j.title}</option>)}
                </select>
              </div>
            )}
            <div className="form-group">
              <label>Shift note (optional)</label>
              <textarea value={clockInNote} onChange={e => setClockInNote(e.target.value)} placeholder="e.g. Starting on inventory, covering front desk…" rows={3} autoFocus style={{ resize: "none" }} />
            </div>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 20 }}>
              <button className="btn btn-secondary" onClick={() => setShowClockInNote(false)}>Cancel</button>
              <button className="btn btn-secondary" onClick={() => handleClockIn()}>Skip</button>
              <button className="btn btn-primary" onClick={() => handleClockIn(clockInNote)}>Clock In</button>
            </div>
          </div>
        </div>
      )}

      {/* Clock-out note modal */}
      {showNoteModal && (
        <div onClick={() => setShowNoteModal(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 500, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
          <div onClick={e => e.stopPropagation()} style={{ background: "var(--surface)", borderRadius: 14, border: "1px solid var(--border)", boxShadow: "0 16px 48px rgba(0,0,0,0.15)", width: "100%", maxWidth: 400, padding: 28 }}>
            <div style={{ fontSize: 17, fontWeight: 700, marginBottom: 6 }}>Clock Out</div>
            <div style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 20 }}>Add an optional note about your shift.</div>
            <div className="form-group">
              <label>Shift note (optional)</label>
              <textarea value={noteText} onChange={e => setNoteText(e.target.value)} placeholder="e.g. Completed inventory count, helped with onboarding…" rows={3} autoFocus style={{ resize: "none" }} />
            </div>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 20 }}>
              <button className="btn btn-secondary" onClick={() => setShowNoteModal(false)}>Cancel</button>
              <button className="btn btn-secondary" onClick={() => handleClockOut()}>Skip note</button>
              <button className="btn btn-primary" onClick={() => handleClockOut(noteText)}>Clock Out</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const sv = { viewBox: "0 0 20 20", fill: "none", stroke: "currentColor", strokeWidth: 1.6, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, width: 18, height: 18 };
function TodayIcon() { return <svg {...sv}><circle cx="10" cy="10" r="8" /><path d="M10 5.5V10l3 2" /></svg>; }
function WeekIcon() { return <svg {...sv}><rect x="2.5" y="4" width="15" height="13.5" rx="2.5" /><path d="M2.5 8h15M6.5 2.5v3M13.5 2.5v3" /></svg>; }
function MonthIcon() { return <svg {...sv}><rect x="2.5" y="4" width="15" height="13.5" rx="2.5" /><path d="M2.5 8h15M6 11.5h2M10 11.5h4M6 14.5h4" /></svg>; }
function WalletIcon() { return <svg {...sv}><rect x="2.5" y="5" width="15" height="11" rx="2.5" /><path d="M2.5 9h15" /><circle cx="14" cy="12.5" r="1" fill="currentColor" stroke="none" /></svg>; }
