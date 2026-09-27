import { useEffect, useState } from "react";
import { api } from "../lib/api";
import type { UserWithStats } from "../lib/types";

const PLANS = [
  {
    name: "Starter",
    price: 0,
    period: "forever",
    color: "#6b7280",
    gradient: "linear-gradient(135deg,#f9fafb,#f3f4f6)",
    border: "#e5e7eb",
    features: ["Up to 3 employees", "Time tracking", "Basic payroll", "Join code invites"],
    missing: ["Job board", "Analytics & charts", "Expenses tracking", "Announcements", "Bulk payroll"],
  },
  {
    name: "Pro",
    price: 29,
    period: "per month",
    color: "#5b6af0",
    gradient: "linear-gradient(135deg,#eef0fe,#f5f3ff)",
    border: "rgba(91,106,240,0.3)",
    badge: "Most Popular",
    features: ["Up to 25 employees", "Everything in Starter", "Job board & assignments", "Analytics & charts", "Expenses tracking", "Announcements", "Bulk payroll", "Payment history"],
    missing: ["Custom domain", "Priority support", "API access"],
    current: true,
  },
  {
    name: "Business",
    price: 79,
    period: "per month",
    color: "#7c3aed",
    gradient: "linear-gradient(135deg,#faf5ff,#ede9fe)",
    border: "rgba(124,58,237,0.25)",
    features: ["Unlimited employees", "Everything in Pro", "Custom domain", "Priority support", "API access", "Advanced reporting", "Custom roles", "Data export"],
    missing: [],
  },
];

export function BillingPage() {
  const [team, setTeam] = useState<UserWithStats[]>([]);
  const [company, setCompany] = useState("");

  useEffect(() => {
    Promise.all([api.getTeam(), api.getCompany()]).then(([t, c]) => {
      setTeam(t.filter(u => u.role !== "owner" && u.active));
      setCompany(c.name);
    }).catch(() => {});
  }, []);

  const currentPlan = PLANS[1]; // Pro
  const employeeCount = team.length;
  const usagePct = Math.min(100, Math.round((employeeCount / 25) * 100));

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <div className="page-title">Plan & Billing</div>
          <div className="page-subtitle">Manage your subscription and usage</div>
        </div>
      </div>

      {/* Current plan banner */}
      <div style={{ background: "linear-gradient(135deg,#5b6af0 0%,#8b5cf6 100%)", borderRadius: 16, padding: "28px 32px", marginBottom: 28, color: "#fff", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 20 }}>
        <div>
          <div style={{ fontSize: 12, fontWeight: 600, opacity: 0.75, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>Current Plan</div>
          <div style={{ fontSize: 28, fontWeight: 800, letterSpacing: "-0.5px", marginBottom: 4 }}>{currentPlan.name} <span style={{ fontSize: 16, fontWeight: 500, opacity: 0.8 }}>${currentPlan.price}/mo</span></div>
          <div style={{ fontSize: 14, opacity: 0.8 }}>Active for <strong>{company}</strong> · Renews monthly</div>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button style={{ padding: "10px 20px", borderRadius: 8, background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.25)", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Manage Billing</button>
          <button style={{ padding: "10px 20px", borderRadius: 8, background: "#fff", border: "none", color: "#5b6af0", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>Upgrade to Business →</button>
        </div>
      </div>

      {/* Usage */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div className="card-header"><span className="card-title">Usage This Month</span></div>
        <div className="card-body">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(200px,1fr))", gap: 16 }}>
            {[
              { label: "Employees", used: employeeCount, limit: 25, unit: "seats" },
              { label: "Time Entries", used: 0, limit: "Unlimited", unit: "entries" },
              { label: "Payments", used: 0, limit: "Unlimited", unit: "records" },
              { label: "Jobs", used: 0, limit: "Unlimited", unit: "jobs" },
            ].map(({ label, used, limit, unit }) => (
              <div key={label} style={{ background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 10, padding: "14px 16px" }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>{label}</div>
                <div style={{ fontSize: 20, fontWeight: 700, color: "var(--text)", marginBottom: 4 }}>
                  {used} <span style={{ fontSize: 13, fontWeight: 400, color: "var(--text-muted)" }}>/ {limit}</span>
                </div>
                {typeof limit === "number" ? (
                  <div style={{ height: 4, background: "var(--border)", borderRadius: 2, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${usagePct}%`, background: usagePct > 80 ? "var(--warning)" : "var(--primary)", borderRadius: 2, transition: "width 0.4s" }} />
                  </div>
                ) : (
                  <div style={{ fontSize: 11, color: "var(--success)", fontWeight: 600 }}>✓ Unlimited on Pro</div>
                )}
                <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4 }}>{unit}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Plan comparison */}
      <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 16, letterSpacing: "-0.3px" }}>All Plans</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: 16, marginBottom: 28 }}>
        {PLANS.map(plan => (
          <div key={plan.name} style={{ background: plan.gradient, border: `1.5px solid ${plan.border}`, borderRadius: 14, padding: "24px", position: "relative", boxShadow: plan.current ? `0 0 0 2px ${plan.color}20, var(--shadow-md)` : "var(--shadow-xs)" }}>
            {plan.badge && (
              <div style={{ position: "absolute", top: -10, left: "50%", transform: "translateX(-50%)", background: plan.color, color: "#fff", fontSize: 11, fontWeight: 700, padding: "3px 12px", borderRadius: 20, letterSpacing: "0.04em", whiteSpace: "nowrap" }}>
                {plan.badge}
              </div>
            )}
            {plan.current && (
              <div style={{ position: "absolute", top: 14, right: 14 }}>
                <span style={{ background: plan.color, color: "#fff", fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 20, letterSpacing: "0.04em" }}>YOUR PLAN</span>
              </div>
            )}
            <div style={{ fontSize: 16, fontWeight: 700, color: plan.color, marginBottom: 6 }}>{plan.name}</div>
            <div style={{ fontSize: 30, fontWeight: 800, color: "var(--text)", letterSpacing: "-1px", marginBottom: 2 }}>
              {plan.price === 0 ? "Free" : `$${plan.price}`}
              {plan.price > 0 && <span style={{ fontSize: 13, fontWeight: 400, color: "var(--text-muted)" }}>/mo</span>}
            </div>
            <div style={{ height: 1, background: "rgba(0,0,0,0.06)", margin: "16px 0" }} />
            <div style={{ display: "flex", flexDirection: "column", gap: 7, marginBottom: 20 }}>
              {plan.features.map(f => (
                <div key={f} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
                  <span style={{ color: plan.color, fontWeight: 700, flexShrink: 0 }}>✓</span>
                  <span style={{ color: "var(--text-secondary)" }}>{f}</span>
                </div>
              ))}
              {plan.missing.map(f => (
                <div key={f} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, opacity: 0.45 }}>
                  <span style={{ flexShrink: 0 }}>—</span>
                  <span style={{ color: "var(--text-muted)" }}>{f}</span>
                </div>
              ))}
            </div>
            <button style={{ width: "100%", padding: "10px", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: plan.current ? "default" : "pointer", background: plan.current ? "rgba(91,106,240,0.1)" : plan.price === 0 ? "rgba(0,0,0,0.06)" : plan.color, color: plan.current ? plan.color : plan.price === 0 ? "var(--text-secondary)" : "#fff", border: plan.current ? `1.5px solid ${plan.color}40` : "none" }}>
              {plan.current ? "✓ Current Plan" : plan.price === 0 ? "Downgrade" : "Upgrade"}
            </button>
          </div>
        ))}
      </div>

      {/* Payment method */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">Payment Method</span>
          <button className="btn btn-secondary btn-sm">+ Add Card</button>
        </div>
        <div style={{ padding: "24px", display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ width: 52, height: 36, background: "linear-gradient(135deg,#1a1f36,#2d3561)", borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <span style={{ color: "#fff", fontSize: 14, fontWeight: 900, letterSpacing: "1px" }}>VISA</span>
          </div>
          <div>
            <div style={{ fontWeight: 600, fontSize: 14 }}>•••• •••• •••• 4242</div>
            <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>Expires 12/26 · Default</div>
          </div>
          <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
            <button className="btn btn-ghost btn-sm">Edit</button>
            <button className="btn btn-ghost btn-sm" style={{ color: "var(--danger)" }}>Remove</button>
          </div>
        </div>
      </div>

      {/* Billing history */}
      <div className="card" style={{ marginTop: 20 }}>
        <div className="card-header">
          <span className="card-title">Billing History</span>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>Date</th><th>Description</th><th>Status</th><th className="text-right">Amount</th><th></th></tr>
            </thead>
            <tbody>
              {[
                { date: "Sep 1, 2026", desc: "WorkBase Pro — September", status: "Paid" },
                { date: "Aug 1, 2026", desc: "WorkBase Pro — August", status: "Paid" },
                { date: "Jul 1, 2026", desc: "WorkBase Pro — July", status: "Paid" },
              ].map((row, i) => (
                <tr key={i}>
                  <td className="td-muted">{row.date}</td>
                  <td>{row.desc}</td>
                  <td><span className="badge badge-green">✓ {row.status}</span></td>
                  <td className="text-right" style={{ fontWeight: 600 }}>$29.00</td>
                  <td><button className="btn btn-ghost btn-sm">Receipt</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
