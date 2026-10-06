import { useEffect, useState } from "react";
import { api } from "../lib/api";
import type { UserWithStats } from "../lib/types";
import { StatCard } from "../components/StatCard";
import { useToast } from "../contexts/Toast";

function PayrollSparkline({ weeks }: { weeks: Array<{ label: string; amount: number }> }) {
  if (weeks.length === 0) return null;
  const max = Math.max(...weeks.map(w => w.amount), 1);
  const W = 480, H = 80, pad = 4, barW = Math.floor((W - pad * (weeks.length + 1)) / weeks.length);
  return (
    <div className="card" style={{ marginBottom: 20 }}>
      <div className="card-header"><span className="card-title">Last 6 Weeks — Payroll Paid Out</span></div>
      <div style={{ padding: "16px 20px 8px" }}>
        <svg viewBox={`0 0 ${W} ${H + 24}`} style={{ width: "100%", maxWidth: W, display: "block" }}>
          {weeks.map((w, i) => {
            const barH = Math.max(4, Math.round((w.amount / max) * H));
            const x = pad + i * (barW + pad);
            const y = H - barH;
            const isLast = i === weeks.length - 1;
            return (
              <g key={w.label}>
                <rect x={x} y={y} width={barW} height={barH}
                  rx={3} fill={isLast ? "var(--primary)" : "var(--border-strong)"}
                  style={{ transition: "height 0.4s ease, y 0.4s ease" }} />
                <text x={x + barW / 2} y={H + 16} textAnchor="middle"
                  style={{ fontSize: 9, fill: "var(--text-muted)", fontFamily: "inherit" }}>
                  {w.label}
                </text>
                {w.amount > 0 && (
                  <text x={x + barW / 2} y={y - 4} textAnchor="middle"
                    style={{ fontSize: 9, fill: isLast ? "var(--primary)" : "var(--text-muted)", fontWeight: isLast ? 700 : 400, fontFamily: "inherit" }}>
                    ${w.amount >= 1000 ? (w.amount / 1000).toFixed(1) + "k" : w.amount.toFixed(0)}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
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

export function PayrollPage() {
  const { toast } = useToast();
  const [team, setTeam] = useState<UserWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState<string | null>(null);
  const [weeklyPayroll, setWeeklyPayroll] = useState<Array<{ label: string; amount: number }>>([]);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    try {
      const [data, analytics] = await Promise.all([api.getPayroll(), api.getAnalytics()]);
      setTeam(data.filter(u => u.role !== "owner" && u.active));
      setWeeklyPayroll(analytics.weeklyPayroll ?? []);
    } catch {/* ignore */}
    finally { setLoading(false); }
  }

  async function payEmployee(u: UserWithStats) {
    if (u.totalOwed <= 0) return;
    if (!confirm(`Pay ${u.name} $${u.totalOwed.toFixed(2)} (month balance)?`)) return;
    setPaying(u.id);
    try {
      await api.addPayment({ userId: u.id, amount: u.totalOwed, type: "payroll", description: "Month payroll" });
      toast(`Paid ${u.name} $${u.totalOwed.toFixed(2)}`);
      await load();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Payment failed", "error");
    } finally { setPaying(null); }
  }

  const totalWeekPay = team.reduce((s, u) => s + u.weekPay, 0);
  const totalMonthPay = team.reduce((s, u) => s + u.monthPay, 0);
  const totalWeekHours = team.reduce((s, u) => s + u.weekHours, 0);
  const totalWeekOT = team.reduce((s, u) => s + u.weekOvertimeHours, 0);
  const totalMonthHours = team.reduce((s, u) => s + u.monthHours, 0);

  const now = new Date();
  const weekOf = new Date(now);
  weekOf.setDate(now.getDate() - now.getDay());

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <div className="page-title">Payroll</div>
          <div className="page-subtitle">
            Week of {weekOf.toLocaleDateString(undefined, { month: "long", day: "numeric" })}
          </div>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={load}>↻ Refresh</button>
      </div>

      <div className="stats-grid">
        <StatCard label="Week Hours" value={fmt(totalWeekHours)} sub={totalWeekOT > 0 ? `${fmt(totalWeekOT)} overtime` : "all employees"} color="blue" />
        <StatCard label="Week Payroll" value={money(totalWeekPay)} sub="due this week" color="green" />
        <StatCard label="Month Hours" value={fmt(totalMonthHours)} sub="current month" />
        <StatCard label="Month Payroll" value={money(totalMonthPay)} sub="current month" color="orange" />
        <StatCard label="Year to date" value={money(team.reduce((s, u) => s + u.ytdPay, 0))} sub={`${fmt(team.reduce((s, u) => s + u.ytdHours, 0))} worked this year`} />
      </div>

      {weeklyPayroll.length > 0 && <PayrollSparkline weeks={weeklyPayroll} />}

      <div className="card">
        <div className="card-header">
          <span className="card-title">Employee Breakdown</span>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {team.some(u => u.totalOwed > 0) && (
              <span style={{ fontSize: 12, color: "var(--warning)", fontWeight: 600 }}>
                {team.filter(u => u.totalOwed > 0).length} employees owed payment
              </span>
            )}
            <span className="text-muted">{team.length} total</span>
          </div>
        </div>

        {loading ? (
          <div style={{ padding: 40, textAlign: "center" }}><div className="spinner" style={{ margin: "0 auto" }} /></div>
        ) : team.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">💰</div>
            <h3>No employees</h3>
            <p>Payroll data will appear here once you have employees</p>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Rate</th>
                  <th>Today</th>
                  <th>Week Hours</th>
                  <th className="text-right">Week Pay</th>
                  <th>Month Hours</th>
                  <th className="text-right">Month Pay</th>
                  <th>Balance</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {team.map(member => (
                  <tr key={member.id}>
                    <td>
                      <div className="row" style={{ gap: 8 }}>
                        <div style={{ width: 30, height: 30, borderRadius: "50%", background: "linear-gradient(135deg,#ff9a56,#ff6b35)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, flexShrink: 0 }}>
                          {initials(member.name)}
                        </div>
                        <div>
                          <div className="td-name">{member.name}</div>
                          <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{member.title}</div>
                        </div>
                      </div>
                    </td>
                    <td>{member.hourlyRate > 0 ? money(member.hourlyRate) + "/hr" : <span className="td-muted">—</span>}</td>
                    <td>{fmt(member.todayHours)}</td>
                    <td>
                      {fmt(member.weekHours)}
                      {member.weekOvertimeHours > 0 && <span className="badge badge-orange" style={{ marginLeft: 6, fontSize: 10 }} title="Overtime hours this week">{fmt(member.weekOvertimeHours)} OT</span>}
                    </td>
                    <td className="text-right pay-total">{member.hourlyRate > 0 ? money(member.weekPay) : <span className="td-muted">—</span>}</td>
                    <td>{fmt(member.monthHours)}</td>
                    <td className="text-right pay-total">{member.hourlyRate > 0 ? money(member.monthPay) : <span className="td-muted">—</span>}</td>
                    <td>
                      {member.totalOwed > 0
                        ? <span style={{ fontWeight: 700, color: "var(--danger)", fontSize: 13 }}>-{money(member.totalOwed)}</span>
                        : <span style={{ color: "var(--success)", fontSize: 13 }}>✓ Even</span>}
                    </td>
                    <td>
                      {member.totalOwed > 0 && (
                        <button className="btn btn-primary btn-sm" disabled={paying === member.id} onClick={() => payEmployee(member)}>
                          {paying === member.id ? "…" : "Pay Now"}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr style={{ background: "var(--surface-hover)" }}>
                  <td colSpan={3} style={{ fontWeight: 600, padding: "12px 14px" }}>Total</td>
                  <td style={{ fontWeight: 600, padding: "12px 14px" }}>{fmt(totalWeekHours)}</td>
                  <td className="text-right pay-total" style={{ fontWeight: 700, padding: "12px 14px" }}>{money(totalWeekPay)}</td>
                  <td style={{ fontWeight: 600, padding: "12px 14px" }}>{fmt(totalMonthHours)}</td>
                  <td className="text-right pay-total" style={{ fontWeight: 700, padding: "12px 14px" }}>{money(totalMonthPay)}</td>
                  <td colSpan={2} />
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
