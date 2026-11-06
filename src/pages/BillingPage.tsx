import { useEffect, useState } from "react";
import { api } from "../lib/api";

const PLANS = [
  { name: "Starter", price: 0, color: "#6b7280", seats: 3, features: ["Up to 3 employees", "Time clock & breaks", "Scheduling", "Tasks & messages"] },
  { name: "Pro", price: 29, color: "#ff7a3d", seats: 25, badge: "Most popular", features: ["Up to 25 employees", "Everything in Starter", "Payroll & overtime", "Jobs, clients & invoices", "GPS clock-in", "Reports & insights"] },
  { name: "Business", price: 79, color: "#b45309", seats: Infinity, features: ["Unlimited employees", "Everything in Pro", "Multiple locations", "Priority support", "API access", "Custom roles"] },
];

interface Usage { employees: number; entries: number; payments: number; jobs: number; invoices: number; clients: number }

export function BillingPage() {
  const [usage, setUsage] = useState<Usage | null>(null);
  const [company, setCompany] = useState("");

  useEffect(() => {
    Promise.all([api.getTeam(), api.getCompany(), api.getTimeEntries(), api.getPayments(), api.getJobs(), api.getInvoices(), api.getClients()])
      .then(([team, c, entries, payments, jobs, invoices, clients]) => {
        setCompany(c.name);
        setUsage({
          employees: team.filter(u => u.role !== "owner" && u.active).length,
          entries: entries.length, payments: payments.length, jobs: jobs.length, invoices: invoices.length, clients: clients.length,
        });
      })
      .catch(() => {});
  }, []);

  const n = usage?.employees ?? 0;
  const fits = PLANS.find(p => n <= p.seats) ?? PLANS[2];

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <div className="page-title">Plan &amp; Usage</div>
          <div className="page-subtitle">What {company || "your company"} is using, and which plan fits</div>
        </div>
      </div>

      <div className="hero-banner" style={{ background: "linear-gradient(120deg,#ff9a56 0%,#ff6b35 55%,#f0611b 100%)" }}>
        <div style={{ fontSize: 12, fontWeight: 600, opacity: 0.8, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>Recommended for your team</div>
        <div style={{ fontSize: 28, fontWeight: 800, letterSpacing: "-0.5px", marginBottom: 4 }}>
          {fits.name} <span style={{ fontSize: 16, fontWeight: 500, opacity: 0.85 }}>{fits.price ? `$${fits.price}/mo` : "Free"}</span>
        </div>
        <div style={{ fontSize: 14, opacity: 0.9 }}>Based on {n} active employee{n === 1 ? "" : "s"}. Every feature is unlocked while you're self-hosting.</div>
      </div>

      <div className="card" style={{ marginBottom: 24 }}>
        <div className="card-header"><span className="card-title">Your usage</span></div>
        <div className="card-body">
          <div className="usage-grid">
            {([
              ["Employees", usage?.employees, "active"],
              ["Time entries", usage?.entries, "all time"],
              ["Payments", usage?.payments, "recorded"],
              ["Jobs", usage?.jobs, "all time"],
              ["Invoices", usage?.invoices, "all time"],
              ["Clients", usage?.clients, "saved"],
            ] as const).map(([label, value, unit]) => (
              <div key={label} className="usage-tile">
                <div className="usage-label">{label}</div>
                <div className="usage-value">{value ?? "—"}</div>
                <div className="usage-unit">{unit}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 16, letterSpacing: "-0.3px" }}>Plans</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(260px,1fr))", gap: 16, marginBottom: 24 }}>
        {PLANS.map(plan => {
          const recommended = plan.name === fits.name;
          return (
            <div key={plan.name} className="plan-card" style={{ borderColor: recommended ? plan.color : undefined, boxShadow: recommended ? `0 0 0 2px ${plan.color}30, var(--shadow-md)` : undefined }}>
              {plan.badge && <div className="plan-badge" style={{ background: plan.color }}>{plan.badge}</div>}
              {recommended && <span className="plan-fit" style={{ background: plan.color }}>FITS YOUR TEAM</span>}
              <div style={{ fontSize: 16, fontWeight: 700, color: plan.color, marginBottom: 6 }}>{plan.name}</div>
              <div style={{ fontSize: 30, fontWeight: 800, letterSpacing: "-1px" }}>
                {plan.price === 0 ? "Free" : `$${plan.price}`}
                {plan.price > 0 && <span style={{ fontSize: 13, fontWeight: 400, color: "var(--text-muted)" }}>/mo</span>}
              </div>
              <div style={{ height: 1, background: "var(--border)", margin: "16px 0" }} />
              <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                {plan.features.map(f => (
                  <div key={f} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
                    <span style={{ color: plan.color, fontWeight: 700 }}>✓</span>
                    <span style={{ color: "var(--text-secondary)" }}>{f}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <div className="callout">
        <strong>Online subscription billing isn't connected yet.</strong> No card is on file and nothing is being charged. To sell WorkBase to other businesses, connect a payment provider such as Stripe and these plans can become real subscriptions.
      </div>
    </div>
  );
}
