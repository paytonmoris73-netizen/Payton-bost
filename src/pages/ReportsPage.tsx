import { useEffect, useState } from "react";
import { api } from "../lib/api";
import type { ReportData } from "../lib/types";
import { StatCard } from "../components/StatCard";
import { useToast } from "../contexts/Toast";
import { localDate } from "../lib/dates";

function money(n: number) { const s = "$" + Math.abs(n).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ","); return n < 0 ? `-${s}` : s; }
function hrs(n: number) { return n.toFixed(1) + "h"; }

type Preset = "this-week" | "last-week" | "this-month" | "last-month" | "this-year" | "custom";

function rangeFor(p: Preset): [string, string] {
  const now = new Date();
  const d = (y: number, m: number, day: number) => localDate(new Date(y, m, day));
  const y = now.getFullYear(), m = now.getMonth();
  switch (p) {
    case "this-week": { const s = new Date(now); s.setDate(now.getDate() - now.getDay()); const e = new Date(s); e.setDate(s.getDate() + 6); return [localDate(s), localDate(e)]; }
    case "last-week": { const s = new Date(now); s.setDate(now.getDate() - now.getDay() - 7); const e = new Date(s); e.setDate(s.getDate() + 6); return [localDate(s), localDate(e)]; }
    case "this-month": return [d(y, m, 1), d(y, m + 1, 0)];
    case "last-month": return [d(y, m - 1, 1), d(y, m, 0)];
    case "this-year": return [d(y, 0, 1), d(y, 11, 31)];
    default: return [d(y, m, 1), localDate(now)];
  }
}

function downloadCSV(name: string, header: string[], rows: Array<Array<string | number>>) {
  const csv = [header, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
  const a = document.createElement("a"); a.href = url; a.download = name; a.click();
  URL.revokeObjectURL(url);
}

const PRESETS: Array<[Preset, string]> = [["this-week", "This week"], ["last-week", "Last week"], ["this-month", "This month"], ["last-month", "Last month"], ["this-year", "This year"], ["custom", "Custom"]];

export function ReportsPage() {
  const { toast } = useToast();
  const [preset, setPreset] = useState<Preset>("this-month");
  const [[from, to], setRange] = useState(rangeFor("this-month"));
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (from > to) return;
    setLoading(true);
    api.getReport(from, to).then(setData).catch(() => toast("Couldn't load report", "error")).finally(() => setLoading(false));
  }, [from, to]);

  function choose(p: Preset) { setPreset(p); if (p !== "custom") setRange(rangeFor(p)); }

  const t = data?.totals;
  const tag = `${from}_to_${to}`;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <div className="page-title">Reports</div>
          <div className="page-subtitle">Hours, labor cost and profit for any period</div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{ padding: "14px 18px", display: "flex", gap: 12, flexWrap: "wrap", alignItems: "flex-end", justifyContent: "space-between" }}>
          <div className="tabs-inline">
            {PRESETS.map(([p, label]) => (
              <button key={p} className={`btn btn-sm ${preset === p ? "btn-primary" : "btn-ghost"}`} onClick={() => choose(p)} aria-pressed={preset === p}>{label}</button>
            ))}
          </div>
          <div className="report-range">
            <div><label htmlFor="rf">From</label><input id="rf" type="date" value={from} max={to} onChange={e => { setPreset("custom"); setRange([e.target.value, to]); }} /></div>
            <div><label htmlFor="rt">To</label><input id="rt" type="date" value={to} min={from} onChange={e => { setPreset("custom"); setRange([from, e.target.value]); }} /></div>
          </div>
        </div>
      </div>

      {from > to ? (
        <div className="callout">The start date must be on or before the end date.</div>
      ) : loading && !data ? (
        <div style={{ padding: 40, textAlign: "center" }}><div className="spinner" style={{ margin: "0 auto" }} /></div>
      ) : data && t && (
        <div style={{ opacity: loading ? 0.6 : 1, transition: "opacity 0.2s" }}>
          <div className="stats-grid">
            <StatCard label="Revenue collected" value={money(t.revenue)} color="green" sub={`${money(t.invoiced)} invoiced`} />
            <StatCard label="Labor cost" value={money(t.laborCost)} color="orange" sub={`${hrs(t.hours)} worked${t.overtimeHours > 0 ? ` · ${hrs(t.overtimeHours)} OT` : ""}`} />
            <StatCard label="Expenses" value={money(t.expenses)} color="blue" />
            <StatCard label="Net profit" value={money(t.profit)} color={t.profit >= 0 ? "green" : "red"} sub="revenue − labor − expenses" />
          </div>

          <div className="card" style={{ marginBottom: 20 }}>
            <div className="card-header">
              <span className="card-title">By employee</span>
              {data.byEmployee.length > 0 && <button className="btn btn-ghost btn-sm" onClick={() => downloadCSV(`employees_${tag}.csv`, ["Employee", "Shifts", "Regular hours", "Overtime hours", "Total hours", "Labor cost"], data.byEmployee.map(e => [e.name, e.shifts, e.regularHours.toFixed(2), e.overtimeHours.toFixed(2), e.hours.toFixed(2), e.laborCost.toFixed(2)]))}>↓ CSV</button>}
            </div>
            {data.byEmployee.length === 0 ? <div className="empty-state"><p>No hours worked in this period.</p></div> : (
              <div className="table-wrap"><table>
                <thead><tr><th>Employee</th><th className="text-right">Shifts</th><th className="text-right">Regular</th><th className="text-right">Overtime</th><th className="text-right">Total</th><th className="text-right">Labor cost</th></tr></thead>
                <tbody>{data.byEmployee.map(e => (
                  <tr key={e.userId}>
                    <td className="td-name">{e.name}</td>
                    <td className="text-right">{e.shifts}</td>
                    <td className="text-right">{hrs(e.regularHours)}</td>
                    <td className="text-right" style={{ color: e.overtimeHours > 0 ? "var(--warning)" : undefined, fontWeight: e.overtimeHours > 0 ? 700 : undefined }}>{hrs(e.overtimeHours)}</td>
                    <td className="text-right">{hrs(e.hours)}</td>
                    <td className="text-right" style={{ fontWeight: 700 }}>{money(e.laborCost)}</td>
                  </tr>
                ))}</tbody>
              </table></div>
            )}
          </div>

          <div className="card" style={{ marginBottom: 20 }}>
            <div className="card-header">
              <span className="card-title">Job profitability</span>
              {data.byJob.length > 0 && <button className="btn btn-ghost btn-sm" onClick={() => downloadCSV(`jobs_${tag}.csv`, ["Job", "Client", "Hours", "Labor cost", "Revenue", "Profit"], data.byJob.map(j => [j.title, j.clientName, j.hours.toFixed(2), j.laborCost.toFixed(2), j.revenue.toFixed(2), j.profit.toFixed(2)]))}>↓ CSV</button>}
            </div>
            {data.byJob.length === 0 ? <div className="empty-state"><p>No job time or job invoices in this period. Employees can pick a job when they clock in.</p></div> : (
              <div className="table-wrap"><table>
                <thead><tr><th>Job</th><th>Client</th><th className="text-right">Hours</th><th className="text-right">Labor</th><th className="text-right">Revenue</th><th className="text-right">Profit</th></tr></thead>
                <tbody>{data.byJob.map(j => (
                  <tr key={j.jobId}>
                    <td className="td-name">{j.title}</td>
                    <td className="td-muted">{j.clientName || "—"}</td>
                    <td className="text-right">{hrs(j.hours)}</td>
                    <td className="text-right">{money(j.laborCost)}</td>
                    <td className="text-right">{money(j.revenue)}</td>
                    <td className={`text-right ${j.profit >= 0 ? "profit-pos" : "profit-neg"}`} style={{ fontWeight: 700 }}>{money(j.profit)}</td>
                  </tr>
                ))}</tbody>
              </table></div>
            )}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 20 }}>
            <div className="card">
              <div className="card-header">
                <span className="card-title">By client</span>
                {data.byClient.length > 0 && <button className="btn btn-ghost btn-sm" onClick={() => downloadCSV(`clients_${tag}.csv`, ["Client", "Invoiced", "Collected", "Labor cost"], data.byClient.map(c => [c.name, c.invoiced.toFixed(2), c.collected.toFixed(2), c.laborCost.toFixed(2)]))}>↓ CSV</button>}
              </div>
              {data.byClient.length === 0 ? <div className="empty-state"><p>No client activity in this period.</p></div> : (
                <div className="table-wrap"><table>
                  <thead><tr><th>Client</th><th className="text-right">Invoiced</th><th className="text-right">Collected</th><th className="text-right">Labor</th></tr></thead>
                  <tbody>{data.byClient.map(c => (
                    <tr key={c.clientId}><td className="td-name">{c.name}</td><td className="text-right">{money(c.invoiced)}</td><td className="text-right">{money(c.collected)}</td><td className="text-right">{money(c.laborCost)}</td></tr>
                  ))}</tbody>
                </table></div>
              )}
            </div>
            <div className="card">
              <div className="card-header">
                <span className="card-title">Expenses by category</span>
                {data.expensesByCategory.length > 0 && <button className="btn btn-ghost btn-sm" onClick={() => downloadCSV(`expenses_${tag}.csv`, ["Category", "Amount"], data.expensesByCategory.map(e => [e.category, e.amount.toFixed(2)]))}>↓ CSV</button>}
              </div>
              {data.expensesByCategory.length === 0 ? <div className="empty-state"><p>No expenses in this period.</p></div> : (
                <div style={{ padding: "12px 18px" }}>
                  {data.expensesByCategory.map(e => (
                    <div key={e.category} style={{ marginBottom: 10 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}><span>{e.category}</span><strong>{money(e.amount)}</strong></div>
                      <div style={{ height: 6, background: "var(--surface-2)", borderRadius: 4, marginTop: 4, overflow: "hidden" }}>
                        <div style={{ width: `${t.expenses ? (e.amount / t.expenses) * 100 : 0}%`, height: "100%", background: "var(--primary)" }} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          <p className="td-muted" style={{ fontSize: 12, marginTop: 16 }}>
            Labor cost uses each employee's current hourly rate, with overtime at your Settings rule. Revenue counts invoices marked paid in this period. Wages actually paid out: {money(t.wagesPaid)}.
          </p>
        </div>
      )}
    </div>
  );
}
