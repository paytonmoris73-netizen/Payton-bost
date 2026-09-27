import { useEffect, useState } from "react";
import { api } from "../lib/api";
import type { User, Payment, UserWithStats } from "../lib/types";
import { StatCard } from "../components/StatCard";

interface Props { user: User; }

function money(n: number): string { return "$" + n.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ","); }
function fmtDateTime(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

const typeBadge = (type: Payment["type"]) => {
  const map = { payroll: "badge-blue", bonus: "badge-orange", job: "badge-green" };
  const labels = { payroll: "Payroll", bonus: "Bonus", job: "Job Pay" };
  return <span className={`badge ${map[type]}`}>{labels[type]}</span>;
};

export function MyPaymentsPage({ user }: Props) {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [stats, setStats] = useState<UserWithStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.getPayments(user.id),
      api.getMe(user.id),
    ])
      .then(([p, s]) => { setPayments(p); setStats(s); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user.id]);

  const total = payments.reduce((s, p) => s + p.amount, 0);
  const bonuses = payments.filter(p => p.type === "bonus").reduce((s, p) => s + p.amount, 0);
  const jobPays = payments.filter(p => p.type === "job").reduce((s, p) => s + p.amount, 0);

  return (
    <div className="page">
      <div className="page-header">
        <div className="page-title">Payments Received</div>
        <div className="page-subtitle">Your complete payment history</div>
      </div>

      <div className="stats-grid">
        <StatCard label="Total Received" value={money(total)} sub="all time" color="green" />
        <StatCard label="Month Owed" value={money(stats?.monthPay ?? 0)} sub="based on hours" color="blue" />
        <StatCard label="Bonuses" value={money(bonuses)} sub="total earned" color="orange" />
        <StatCard label="Job Payments" value={money(jobPays)} sub="completed jobs" />
      </div>

      <div className="card">
        <div className="card-header">
          <span className="card-title">Payment History</span>
          <span className="text-muted">{payments.length} transactions</span>
        </div>
        {loading ? (
          <div style={{ padding: 40, textAlign: "center" }}><div className="spinner" style={{ margin: "0 auto" }} /></div>
        ) : payments.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">💳</div>
            <h3>No payments yet</h3>
            <p>Payments from your manager will appear here</p>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>Date</th><th>Type</th><th>Description</th><th className="text-right">Amount</th></tr>
              </thead>
              <tbody>
                {payments.map(p => (
                  <tr key={p.id}>
                    <td className="td-muted">{fmtDateTime(p.paidAt)}</td>
                    <td>{typeBadge(p.type)}</td>
                    <td className="td-muted">{p.description || "—"}</td>
                    <td className="text-right pay-total">{money(p.amount)}</td>
                  </tr>
                ))}
              </tbody>
              {payments.length > 1 && (
                <tfoot>
                  <tr style={{ background: "var(--surface-hover)" }}>
                    <td colSpan={3} style={{ fontWeight: 600, padding: "12px 14px" }}>Total</td>
                    <td className="text-right pay-total" style={{ fontWeight: 700, padding: "12px 14px" }}>{money(total)}</td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
