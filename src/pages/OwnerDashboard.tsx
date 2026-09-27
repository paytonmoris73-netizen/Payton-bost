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

function initials(name: string) {
  return name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
}

export function OwnerDashboard({ user: _user }: Props) {
  const [team, setTeam] = useState<UserWithStats[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    load();
    const t = setInterval(load, 30000);
    return () => clearInterval(t);
  }, []);

  async function load() {
    try {
      const data = await api.getTeam();
      setTeam(data.filter(u => u.active && u.role !== "owner"));
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

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <div className="page-title">Dashboard</div>
          <div className="page-subtitle">Live overview of your team</div>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={load}>↻ Refresh</button>
      </div>

      <div className="stats-grid">
        <StatCard label="Employees" value={totalEmployees} sub="active team members" />
        <StatCard label="Clocked In" value={clockedIn} sub="working right now" color="green" />
        <StatCard label="Week Hours" value={fmt(totalWeekHours)} sub="total this week" color="blue" />
        <StatCard label="Week Payroll" value={money(totalWeekPay)} sub="estimated this week" color="orange" />
      </div>

      <div className="card">
        <div className="card-header">
          <span className="card-title">Team Status</span>
          <span className="text-muted">{loading ? "Loading…" : `${team.length} members`}</span>
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
