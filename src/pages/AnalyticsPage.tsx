import { useEffect, useState } from "react";
import { api, type AnalyticsData } from "../lib/api";
import { BarChart, LineChart, HorizontalBar, DonutChart } from "../components/Charts";
import { StatCard } from "../components/StatCard";

function fmt(h: number): string {
  const hrs = Math.floor(h); const mins = Math.round((h - hrs) * 60);
  if (hrs === 0) return `${mins}m`;
  return mins > 0 ? `${hrs}h ${mins}m` : `${hrs}h`;
}
function money(n: number): string { return "$" + n.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ","); }

const COLORS = ["#2563eb","#059669","#d97706","#7c3aed","#dc2626","#0891b2","#65a30d"];

export function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getAnalytics()
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function refresh() {
    setLoading(true);
    try { const d = await api.refreshAnalytics(); setData(d); } catch {/* ignore */}
    finally { setLoading(false); }
  }

  if (loading || !data) {
    return <div className="page"><div style={{ textAlign: "center", paddingTop: 60 }}><div className="spinner" style={{ margin: "0 auto" }} /></div></div>;
  }

  const employees = data.team.filter(u => u.role !== "owner");
  const totalWeekHours = employees.reduce((s, u) => s + u.weekHours, 0);
  const totalMonthPay = employees.reduce((s, u) => s + u.monthPay, 0);
  const workingNow = employees.filter(u => u.clockedIn).length;
  const topWorker = employees.reduce((a, b) => a.weekHours > b.weekHours ? a : b, employees[0]);

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <div className="page-title">Analytics</div>
          <div className="page-subtitle">Visualize your team's performance</div>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={refresh}>↻ Refresh</button>
      </div>

      <div className="stats-grid">
        <StatCard label="Week Hours" value={fmt(totalWeekHours)} sub="all employees" color="blue" />
        <StatCard label="Working Now" value={workingNow} sub="currently clocked in" color="green" />
        <StatCard label="Month Payroll" value={money(totalMonthPay)} sub="based on hours" color="orange" />
        <StatCard label="Total Paid Out" value={money(data.totalPaidOut)} sub="all time" />
        {topWorker && <StatCard label="Top Worker" value={topWorker.name.split(" ")[0]} sub={fmt(topWorker.weekHours) + " this week"} color="blue" />}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>
        {/* Daily Hours Bar Chart */}
        <div className="card">
          <div className="card-header"><span className="card-title">Daily Hours — Last 7 Days</span></div>
          <div className="card-body">
            {data.dailyHours.every(d => d.hours === 0) ? (
              <div className="empty-state" style={{ padding: 24 }}>
                <div className="empty-state-icon" style={{ fontSize: 24 }}>📊</div>
                <h3>No data yet</h3>
                <p>Data appears once employees clock in</p>
              </div>
            ) : (
              <BarChart
                data={data.dailyHours.map(d => ({ label: d.label, value: d.hours }))}
                formatValue={v => `${v.toFixed(1)}h`}
              />
            )}
          </div>
        </div>

        {/* Weekly Payroll Line Chart */}
        <div className="card">
          <div className="card-header"><span className="card-title">Payroll Paid Out — Last 6 Weeks</span></div>
          <div className="card-body">
            {data.weeklyPayroll.every(w => w.amount === 0) ? (
              <div className="empty-state" style={{ padding: 24 }}>
                <div className="empty-state-icon" style={{ fontSize: 24 }}>📉</div>
                <h3>No payments yet</h3>
                <p>Appears after you record payments</p>
              </div>
            ) : (
              <LineChart
                data={data.weeklyPayroll.map(w => ({ label: w.label, value: w.amount }))}
                formatValue={v => "$" + v.toFixed(0)}
                color="var(--success)"
              />
            )}
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 20 }}>
        {/* Employee Hours Comparison */}
        <div className="card">
          <div className="card-header"><span className="card-title">Employee Hours This Week</span></div>
          <div className="card-body">
            {employees.length === 0 ? (
              <div className="empty-state" style={{ padding: 24 }}>
                <div className="empty-state-icon" style={{ fontSize: 24 }}>👥</div>
                <h3>No employees yet</h3>
              </div>
            ) : (
              <HorizontalBar
                data={[...employees].sort((a, b) => b.weekHours - a.weekHours).map((u, i) => ({
                  label: u.name,
                  value: u.weekHours,
                  sub: fmt(u.weekHours) + (u.clockedIn ? " · 🟢" : ""),
                  color: COLORS[i % COLORS.length],
                }))}
                formatValue={v => `${v.toFixed(1)}h`}
              />
            )}
          </div>
        </div>

        {/* Work Distribution Donut */}
        <div className="card">
          <div className="card-header"><span className="card-title">Hours Distribution</span></div>
          <div className="card-body" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
            {employees.every(u => u.weekHours === 0) ? (
              <div className="empty-state" style={{ padding: 16 }}>
                <div className="empty-state-icon" style={{ fontSize: 24 }}>🥧</div>
                <h3>No hours yet</h3>
              </div>
            ) : (
              <>
                <DonutChart
                  segments={employees.filter(u => u.weekHours > 0).map((u, i) => ({
                    label: u.name, value: u.weekHours, color: COLORS[i % COLORS.length],
                  }))}
                  size={140}
                />
                <div style={{ display: "flex", flexDirection: "column", gap: 6, width: "100%" }}>
                  {employees.filter(u => u.weekHours > 0).map((u, i) => (
                    <div key={u.id} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12 }}>
                      <span style={{ width: 10, height: 10, borderRadius: "50%", background: COLORS[i % COLORS.length], flexShrink: 0 }} />
                      <span style={{ flex: 1, color: "var(--text-secondary)" }}>{u.name}</span>
                      <span style={{ fontWeight: 500 }}>{fmt(u.weekHours)}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Pay vs Owed Table */}
      {employees.length > 0 && (
        <div className="card" style={{ marginTop: 20 }}>
          <div className="card-header"><span className="card-title">Pay Summary — This Month</span></div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>Employee</th><th>Hours</th><th>Rate</th><th>Owed</th><th>Paid</th><th className="text-right">Balance</th></tr>
              </thead>
              <tbody>
                {employees.map(u => {
                  const balance = u.monthPay - u.totalPaid;
                  return (
                    <tr key={u.id}>
                      <td className="td-name">{u.name}</td>
                      <td>{fmt(u.monthHours)}</td>
                      <td>{u.hourlyRate > 0 ? "$" + u.hourlyRate + "/hr" : <span className="td-muted">—</span>}</td>
                      <td>{"$" + u.monthPay.toFixed(2)}</td>
                      <td style={{ color: "var(--success)" }}>{"$" + u.totalPaid.toFixed(2)}</td>
                      <td className="text-right" style={{ fontWeight: 600, color: balance > 0 ? "var(--danger)" : "var(--success)" }}>
                        {balance > 0 ? `-$${balance.toFixed(2)}` : balance < 0 ? `+$${Math.abs(balance).toFixed(2)}` : "✓ Even"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
