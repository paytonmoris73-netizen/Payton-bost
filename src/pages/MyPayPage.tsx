import { useEffect, useState } from "react";
import { api } from "../lib/api";
import type { User, UserWithStats } from "../lib/types";
import { StatCard } from "../components/StatCard";

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

export function MyPayPage({ user }: Props) {
  const [stats, setStats] = useState<UserWithStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getMe(user.id)
      .then(setStats)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user.id]);

  if (loading) return <div className="page"><div className="spinner" /></div>;

  if (!stats?.hourlyRate) {
    return (
      <div className="page">
        <div className="page-header">
          <div className="page-title">My Pay</div>
        </div>
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-icon">💰</div>
            <h3>Rate not set</h3>
            <p>Ask your manager to set your hourly rate</p>
          </div>
        </div>
      </div>
    );
  }

  const now = new Date();
  const weekOf = new Date(now);
  weekOf.setDate(now.getDate() - now.getDay());

  const rows = [
    { label: "Today", hours: stats.todayHours, pay: stats.todayHours * stats.hourlyRate },
    { label: "This Week", hours: stats.weekHours, pay: stats.weekPay },
    { label: "This Month", hours: stats.monthHours, pay: stats.monthPay },
  ];

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <div className="page-title">My Pay</div>
          <div className="page-subtitle">Week of {weekOf.toLocaleDateString(undefined, { month: "long", day: "numeric" })}</div>
        </div>
      </div>

      <div className="stats-grid" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
        <StatCard label="Hourly Rate" value={money(stats.hourlyRate)} sub="per hour" color="blue" />
        <StatCard label="Week Pay" value={money(stats.weekPay)} sub={`${fmt(stats.weekHours)} worked`} color="green" />
        <StatCard label="Month Pay" value={money(stats.monthPay)} sub={`${fmt(stats.monthHours)} worked`} color="orange" />
      </div>

      <div className="card">
        <div className="card-header">
          <span className="card-title">Pay Breakdown</span>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Period</th>
                <th>Hours Worked</th>
                <th>Rate</th>
                <th className="text-right">Estimated Pay</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(row => (
                <tr key={row.label}>
                  <td className="td-name">{row.label}</td>
                  <td>{fmt(row.hours)}</td>
                  <td>{money(stats.hourlyRate)}/hr</td>
                  <td className="text-right pay-total">{money(row.pay)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
