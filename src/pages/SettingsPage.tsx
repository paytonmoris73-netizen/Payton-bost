import { useEffect, useState } from "react";
import { api } from "../lib/api";
import type { Company } from "../lib/types";
import { useToast } from "../contexts/Toast";

export function SettingsPage() {
  const { toast } = useToast();
  const [company, setCompany] = useState<Company | null>(null);
  const [companyName, setCompanyName] = useState("");
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    api.getCompany().then(c => { setCompany(c); setCompanyName(c.name); }).catch(() => {});
  }, []);

  async function handleSaveName(e: React.FormEvent) {
    e.preventDefault();
    if (!companyName.trim() || companyName.trim() === company?.name) return;
    setSaving(true);
    try {
      const c = await api.updateCompany(companyName.trim());
      setCompany(c);
      toast("Company name updated");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Failed to update", "error");
    } finally { setSaving(false); }
  }

  async function handleRegenCode() {
    if (!confirm("Regenerate the invite code? The old code will stop working immediately.")) return;
    try {
      const res = await api.regenerateJoinCode();
      setCompany(c => c ? { ...c, joinCode: res.joinCode } : c);
      toast("New invite code generated");
    } catch {
      toast("Failed to regenerate code", "error");
    }
  }

  function copyCode() {
    if (!company) return;
    navigator.clipboard.writeText(company.joinCode).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <div className="page-title">Settings</div>
          <div className="page-subtitle">Manage your company configuration</div>
        </div>
      </div>

      {/* Company details */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-header"><span className="card-title">Company Details</span></div>
        <div style={{ padding: "20px 24px" }}>
          <form onSubmit={handleSaveName}>
            <div className="form-group" style={{ maxWidth: 420 }}>
              <label>Company Name</label>
              <input
                type="text"
                value={companyName}
                onChange={e => setCompanyName(e.target.value)}
                placeholder="Your company name"
                required
              />
            </div>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={saving || !companyName.trim() || companyName.trim() === company?.name}
            >
              {saving ? "Saving…" : "Save Name"}
            </button>
          </form>
        </div>
      </div>

      {/* Join code */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-header"><span className="card-title">Employee Invite Code</span></div>
        <div style={{ padding: "20px 24px" }}>
          <p style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 16 }}>
            Share this code with employees so they can join your workspace from the login page.
          </p>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ background: "var(--surface-2)", border: "1.5px solid var(--border)", borderRadius: 8, padding: "10px 18px", fontFamily: "monospace", fontSize: 20, fontWeight: 700, letterSpacing: "0.15em", color: "var(--primary)" }}>
              {company?.joinCode ?? "———"}
            </div>
            <button className="btn btn-secondary btn-sm" onClick={copyCode}>
              {copied ? "✓ Copied" : "Copy"}
            </button>
            <button className="btn btn-ghost btn-sm" onClick={handleRegenCode}>
              ↻ Regenerate
            </button>
          </div>
        </div>
      </div>

      {/* App info */}
      <div className="card">
        <div className="card-header"><span className="card-title">About WorkBase</span></div>
        <div style={{ padding: "20px 24px", display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px,1fr))", gap: 16 }}>
          {[
            { label: "Version", value: "1.0.0" },
            { label: "Plan", value: "Pro" },
            { label: "Data storage", value: "Local (data.json)" },
            { label: "Company ID", value: company?.id.slice(0, 8).toUpperCase() ?? "—" },
          ].map(({ label, value }) => (
            <div key={label} style={{ background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 8, padding: "12px 14px" }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>{label}</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text)", fontFamily: label === "Company ID" ? "monospace" : "inherit" }}>{value}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
