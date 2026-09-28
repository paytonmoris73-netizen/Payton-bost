import { useEffect, useState } from "react";
import { api } from "../lib/api";
import type { User, UserWithStats, Job } from "../lib/types";
import { StatCard } from "../components/StatCard";

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

interface Props {
  user: User;
}

function fmt(h: number): string {
  const hrs = Math.floor(h);
  const mins = Math.round((h - hrs) * 60);
  if (hrs === 0) return `${mins}m`;
  return mins > 0 ? `${hrs}h ${mins}m` : `${hrs}h`;
}

function money(n: number): string {
  return "$" + n.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function initials(name: string) {
  return name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
}

export function OwnerDashboard({ user }: Props) {
  const [team, setTeam] = useState<UserWithStats[]>([]);
  const [overdueJobs, setOverdueJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    load();
    const t = setInterval(load, 30000);
    return () => clearInterval(t);
  }, []);

  async function load() {
    try {
      const [data, jobs] = await Promise.all([api.getTeam(), api.getJobs()]);
      setTeam(data.filter(u => u.active && u.role !== "owner"));
      const now = new Date();
      setOverdueJobs(jobs.filter(j => j.status !== "completed" && j.dueDate && new Date(j.dueDate) < now));
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }

  const totalEmployees = team.length;
  const clockedIn = team.filter(u => u.clockedIn).length;
  const totalWeekHours = team.reduce((s, u) => s + u.weekHours, 0);
  const totalWeekPay = team.reduce((s, u) => s + u.weekPay, 0);

  const owedTotal = team.reduce((s, u) => s + Math.max(0, u.totalOwed), 0);

  return (
    <div className="page">
      {/* Welcome banner */}
      <div style={{ background: "linear-gradient(135deg,#5b6af0 0%,#8b5cf6 100%)", borderRadius: 16, padding: "28px 32px", marginBottom: 28, color: "#fff", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, opacity: 0.75, marginBottom: 4 }}>{greeting()}</div>
          <div style={{ fontSize: 26, fontWeight: 800, letterSpacing: "-0.5px", marginBottom: 4 }}>{user.name}</div>
          <div style={{ fontSize: 14, opacity: 0.8 }}>{new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}</div>
        </div>
        <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 28, fontWeight: 800 }}>{clockedIn}</div>
            <div style={{ fontSize: 12, opacity: 0.75, fontWeight: 600 }}>Working Now</div>
          </div>
          <div style={{ width: 1, background: "rgba(255,255,255,0.2)" }} />
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 28, fontWeight: 800 }}>{totalEmployees}</div>
            <div style={{ fontSize: 12, opacity: 0.75, fontWeight: 600 }}>Employees</div>
          </div>
          <div style={{ width: 1, background: "rgba(255,255,255,0.2)" }} />
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 28, fontWeight: 800 }}>{fmt(totalWeekHours)}</div>
            <div style={{ fontSize: 12, opacity: 0.75, fontWeight: 600 }}>Week Hours</div>
          </div>
        </div>
        <button className="btn btn-ghost btn-sm" style={{ background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.25)", color: "#fff" }} onClick={load}>↻ Refresh</button>
      </div>

      {/* Overdue jobs alert */}
      {overdueJobs.length > 0 && (
        <div style={{ background: "rgba(200,129,10,0.1)", border: "1px solid rgba(200,129,10,0.3)", borderRadius: 12, padding: "14px 20px", marginBottom: 20, display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 18 }}>⚠️</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: 14, color: "var(--warning)", marginBottom: 2 }}>{overdueJobs.length} overdue job{overdueJobs.length > 1 ? "s" : ""}</div>
            <div style={{ fontSize: 13, color: "var(--text-secondary)" }}>
              {overdueJobs.slice(0, 3).map(j => j.title).join(", ")}{overdueJobs.length > 3 ? ` +${overdueJobs.length - 3} more` : ""}
            </div>
          </div>
        </div>
      )}

      <div className="stats-grid">
        <StatCard label="Employees" value={totalEmployees} sub="active team members" />
        <StatCard label="Clocked In" value={clockedIn} sub="working right now" color="green" />
        <StatCard label="Week Hours" value={fmt(totalWeekHours)} sub="total this week" color="blue" />
        <StatCard label="Week Payroll" value={money(totalWeekPay)} sub="estimated this week" color="orange" />
        <StatCard label="Outstanding" value={money(owedTotal)} sub="owed to team" color="orange" />
      </div>

      <div className="card">
        <div className="card-header">
          <span className="card-title">Live Team Status</span>
          <span style={{ fontSize: 12, background: clockedIn > 0 ? "rgba(16,185,129,0.12)" : "var(--surface-2)", color: clockedIn > 0 ? "var(--success)" : "var(--text-muted)", padding: "3px 10px", borderRadius: 20, fontWeight: 600 }}>
            {loading ? "Loading…" : clockedIn > 0 ? `${clockedIn} active` : "All out"}
          </span>
        </div>
        {loading ? (
          <div style={{ padding: 40, textAlign: "center" }}><div className="spinner" style={{ margin: "0 auto" }} /></div>
        ) : team.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">👥</div>
            <h3>No employees yet</h3>
            <p>Add your first team member in the Team tab</p>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Status</th>
                  <th>Today</th>
                  <th>This Week</th>
                  <th>Rate</th>
                  <th className="text-right">Week Pay</th>
                </tr>
              </thead>
              <tbody>
                {team.map(member => (
                  <tr key={member.id}>
                    <td>
                      <div className="row" style={{ gap: 8 }}>
                        <div className="user-avatar" style={{ width: 28, height: 28, fontSize: 11, borderRadius: "50%", background: "#2563eb", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 600, flexShrink: 0 }}>
                          {initials(member.name)}
                        </div>
                        <div>
                          <div className="td-name">{member.name}</div>
                          <div className="td-muted" style={{ fontSize: 11 }}>{member.title}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      {member.clockedIn ? (
                        <span className="badge badge-green"><span className="badge-dot" />Working</span>
                      ) : (
                        <span className="badge badge-gray">Out</span>
                      )}
                    </td>
                    <td>{fmt(member.todayHours)}</td>
                    <td>{fmt(member.weekHours)}</td>
                    <td>{member.hourlyRate > 0 ? money(member.hourlyRate) + "/hr" : <span className="td-muted">—</span>}</td>
                    <td className="text-right pay-total">{member.hourlyRate > 0 ? money(member.weekPay) : <span className="td-muted">—</span>}</td>
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
