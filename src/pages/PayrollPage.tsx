import { useEffect, useState } from "react";
import { api } from "../lib/api";
import type { UserWithStats } from "../lib/types";
import { StatCard } from "../components/StatCard";

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
  const [team, setTeam] = useState<UserWithStats[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    try {
      const data = await api.getPayroll();
      setTeam(data.filter(u => u.role !== "owner" && u.active));
    } catch {/* ignore */}
    finally { setLoading(false); }
  }

  const totalWeekPay = team.reduce((s, u) => s + u.weekPay, 0);
  const totalMonthPay = team.reduce((s, u) => s + u.monthPay, 0);
  const totalWeekHours = team.reduce((s, u) => s + u.weekHours, 0);
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
        <StatCard label="Week Hours" value={fmt(totalWeekHours)} sub="all employees" color="blue" />
        <StatCard label="Week Payroll" value={money(totalWeekPay)} sub="due this week" color="green" />
        <StatCard label="Month Hours" value={fmt(totalMonthHours)} sub="current month" />
        <StatCard label="Month Payroll" value={money(totalMonthPay)} sub="current month" color="orange" />
      </div>

      <div className="card">
        <div className="card-header">
          <span className="card-title">Employee Breakdown</span>
          <span className="text-muted">{team.length} employees</span>
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
                </tr>
              </thead>
              <tbody>
                {team.map(member => (
                  <tr key={member.id}>
                    <td>
                      <div className="row" style={{ gap: 8 }}>
                        <div style={{ width: 30, height: 30, borderRadius: "50%", background: "#2563eb", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 600, flexShrink: 0 }}>
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
                    <td>{fmt(member.weekHours)}</td>
                    <td className="text-right pay-total">{member.hourlyRate > 0 ? money(member.weekPay) : <span className="td-muted">—</span>}</td>
                    <td>{fmt(member.monthHours)}</td>
                    <td className="text-right pay-total">{member.hourlyRate > 0 ? money(member.monthPay) : <span className="td-muted">—</span>}</td>
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
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
