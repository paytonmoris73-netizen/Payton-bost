import { useEffect, useState } from "react";
import { api } from "../lib/api";
import type { User, UserWithStats, Insight, Page } from "../lib/types";
import { StatCard } from "../components/StatCard";

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

interface Props {
  user: User;
  onNavigate: (p: Page) => void;
}

const INSIGHT_ICON: Record<Insight["level"], string> = { critical: "🚨", warning: "⚠️", info: "💡", success: "✅" };

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

export function OwnerDashboard({ user, onNavigate }: Props) {
  const [team, setTeam] = useState<UserWithStats[]>([]);
  const [insights, setInsights] = useState<Insight[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    load();
    const t = setInterval(() => { if (document.visibilityState === "visible") load(); }, 30000);
    return () => clearInterval(t);
  }, []);

  async function load() {
    try {
      const [data, ins] = await Promise.all([api.refreshTeam(), api.getInsights()]);
      setTeam(data.filter(u => u.active && u.role !== "owner"));
      setInsights(ins);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }

  const attention = insights.filter(i => i.level === "critical" || i.level === "warning").length;
  const totalEmployees = team.length;
  const clockedIn = team.filter(u => u.clockedIn).length;
  const totalWeekHours = team.reduce((s, u) => s + u.weekHours, 0);
  const totalWeekPay = team.reduce((s, u) => s + u.weekPay, 0);

  const owedTotal = team.reduce((s, u) => s + Math.max(0, u.totalOwed), 0);

  return (
    <div className="page">
      {/* Greeting header */}
      <div className="dash-head">
        <div>
          <h1 className="dash-greeting">{greeting()}, {user.name.split(" ")[0]}</h1>
          <div className="dash-sub">Here's what's happening across your team today.</div>
        </div>
        <div className="dash-head-right">
          <div className="dash-date">
            <span className="dash-date-day">{new Date().toLocaleDateString(undefined, { weekday: "long" })}</span>
            <span className="dash-date-full">{new Date().toLocaleDateString(undefined, { month: "long", day: "numeric" })}</span>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={load}>↻ Refresh</button>
        </div>
      </div>

      {insights.length > 0 && (
        <div className="card" style={{ marginBottom: 22 }}>
          <div className="card-header">
            <span className="card-title">Smart Insights</span>
            <span className="td-muted" style={{ fontSize: 12 }}>{attention === 0 ? "Nothing urgent" : `${attention} item${attention === 1 ? "" : "s"} need${attention === 1 ? "s" : ""} attention`}</span>
          </div>
          <div className="insights">
            {insights.slice(0, 8).map(i => {
              const body = (<>
                <span className="insight-icon" aria-hidden>{INSIGHT_ICON[i.level]}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="insight-title">{i.title}</div>
                  <div className="insight-detail">{i.detail}</div>
                </div>
                {i.page && <span className="td-muted" aria-hidden>→</span>}
              </>);
              return i.page
                ? <button key={i.id} className={`insight ${i.level}`} onClick={() => onNavigate(i.page!)}>{body}</button>
                : <div key={i.id} className={`insight ${i.level}`}>{body}</div>;
            })}
          </div>
        </div>
      )}

      <div className="stats-grid">
        <StatCard label="Active employees" value={totalEmployees} icon={<PeopleIcon />} sub={`${team.filter(u => u.hourlyRate > 0).length} on payroll`} />
        <StatCard label="Working now" value={clockedIn} color="green" icon={<BoltIcon />} sub={totalEmployees > 0 ? `${Math.round((clockedIn / totalEmployees) * 100)}% of team clocked in` : "no one clocked in"} />
        <StatCard label="Hours this week" value={fmt(totalWeekHours)} color="blue" icon={<ClockIcon />} sub="across all employees" />
        <StatCard label="Payroll this week" value={money(totalWeekPay)} color="orange" icon={<WalletIcon />} sub="estimated to date" />
        <StatCard label="Outstanding" value={money(owedTotal)} color="orange" icon={<CoinIcon />} delta={owedTotal > 0 ? { value: `${team.filter(u => u.totalOwed > 0).length} owed`, up: false } : undefined} sub={owedTotal > 0 ? "awaiting payout" : "all settled up"} />
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
                        <div className="user-avatar" style={{ width: 30, height: 30, fontSize: 11, borderRadius: "50%", background: "linear-gradient(135deg,#ff9a56,#ff6b35)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, flexShrink: 0 }}>
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

const sv = { viewBox: "0 0 20 20", fill: "none", stroke: "currentColor", strokeWidth: 1.6, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, width: 18, height: 18 };
function PeopleIcon() { return <svg {...sv}><circle cx="7" cy="6" r="3" /><path d="M2 17c0-2.8 2.2-5 5-5s5 2.2 5 5" /><path d="M14 3.5a3 3 0 010 5.5M18 17c0-2.2-1.3-4.1-3.2-4.8" /></svg>; }
function BoltIcon() { return <svg {...sv}><path d="M11 2L4 11h5l-1 7 7-9h-5l1-7z" /></svg>; }
function ClockIcon() { return <svg {...sv}><circle cx="10" cy="10" r="8" /><path d="M10 5.5V10l3 2" /></svg>; }
function WalletIcon() { return <svg {...sv}><rect x="2.5" y="5" width="15" height="11" rx="2.5" /><path d="M2.5 9h15" /><circle cx="14" cy="12.5" r="1" fill="currentColor" stroke="none" /></svg>; }
function CoinIcon() { return <svg {...sv}><ellipse cx="10" cy="6" rx="6.5" ry="2.8" /><path d="M3.5 6v8c0 1.5 2.9 2.8 6.5 2.8s6.5-1.3 6.5-2.8V6" /><path d="M3.5 10c0 1.5 2.9 2.8 6.5 2.8s6.5-1.3 6.5-2.8" /></svg>; }
