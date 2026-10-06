import { useEffect, useState } from "react";
import { api } from "../lib/api";
import type { Company, CompanySettings } from "../lib/types";
import { useToast } from "../contexts/Toast";
import { getPosition, mapLink } from "../lib/geo";
import { localDate } from "../lib/dates";

export function SettingsPage() {
  const { toast } = useToast();
  const [company, setCompany] = useState<Company | null>(null);
  const [companyName, setCompanyName] = useState("");
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [settings, setSettings] = useState<CompanySettings | null>(null);
  const [savingSettings, setSavingSettings] = useState(false);
  const [locating, setLocating] = useState(false);

  useEffect(() => {
    api.getCompany().then(c => { setCompany(c); setCompanyName(c.name); setSettings(c.settings); }).catch(() => {});
  }, []);

  async function handleSaveSettings(e: React.FormEvent) {
    e.preventDefault();
    if (!settings) return;
    setSavingSettings(true);
    try {
      const c = await api.updateSettings(settings);
      setCompany(c); setSettings(c.settings);
      toast("Settings saved");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Failed to save", "error");
    } finally { setSavingSettings(false); }
  }

  async function useMyLocation() {
    setLocating(true);
    const p = await getPosition(10000);
    setLocating(false);
    if (!p) { toast("Couldn't get your location. Allow location access in your browser.", "error"); return; }
    setSettings(s => s && { ...s, geofence: { ...s.geofence, lat: Math.round(p.lat * 1e6) / 1e6, lng: Math.round(p.lng * 1e6) / 1e6 } });
    toast(`Location set (±${p.accuracy} m)`);
  }

  async function handleBackup() {
    try {
      const data = await api.downloadBackup();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = `workbase-backup-${localDate()}.json`; a.click();
      URL.revokeObjectURL(url);
      toast("Backup downloaded");
    } catch {
      toast("Backup failed", "error");
    }
  }

  const g = settings?.geofence;
  const setG = (patch: Partial<CompanySettings["geofence"]>) => setSettings(s => s && { ...s, geofence: { ...s.geofence, ...patch } });

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

      {settings && g && (
        <form className="card" style={{ marginBottom: 20 }} onSubmit={handleSaveSettings}>
          <div className="card-header"><span className="card-title">Pay &amp; Clock-in Rules</span></div>
          <div style={{ padding: "20px 24px" }}>
            <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>Overtime</div>
            <p style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 12 }}>Hours past the weekly limit are paid at the overtime rate. Weeks run Sunday to Saturday.</p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 220px))", gap: 12 }}>
              <div className="form-group">
                <label>Weekly hours before overtime</label>
                <input type="number" min="1" max="168" step="0.5" value={settings.overtimeThreshold} onChange={e => setSettings({ ...settings, overtimeThreshold: Number(e.target.value) })} />
              </div>
              <div className="form-group">
                <label>Overtime pay multiplier</label>
                <input type="number" min="1" max="5" step="0.05" value={settings.overtimeMultiplier} onChange={e => setSettings({ ...settings, overtimeMultiplier: Number(e.target.value) })} />
              </div>
            </div>

            <div style={{ borderTop: "1px solid var(--border)", margin: "8px 0 16px" }} />
            <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>Job-site location (GPS)</div>
            <p style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 12 }}>
              Every clock-in records the employee's location when their phone allows it. Turn this on to compare it against your work site, and optionally block clock-ins from too far away.
            </p>
            <label className="check-row">
              <input type="checkbox" checked={g.enabled} onChange={e => setG({ enabled: e.target.checked, enforce: e.target.checked && g.enforce })} />
              Check clock-ins against a work site
            </label>
            {g.enabled && (
              <>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 12, marginTop: 12 }}>
                  <div className="form-group"><label>Site name</label><input type="text" value={g.label} onChange={e => setG({ label: e.target.value })} placeholder="e.g. Main shop" /></div>
                  <div className="form-group"><label>Latitude</label><input type="number" step="any" value={g.lat} onChange={e => setG({ lat: Number(e.target.value) })} /></div>
                  <div className="form-group"><label>Longitude</label><input type="number" step="any" value={g.lng} onChange={e => setG({ lng: Number(e.target.value) })} /></div>
                  <div className="form-group"><label>Allowed radius (m)</label><input type="number" min="25" max="50000" value={g.radiusM} onChange={e => setG({ radiusM: Number(e.target.value) })} /></div>
                </div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
                  <button type="button" className="btn btn-secondary btn-sm" onClick={useMyLocation} disabled={locating}>{locating ? "Locating…" : "📍 Use my current location"}</button>
                  {(g.lat !== 0 || g.lng !== 0) && <a className="btn btn-ghost btn-sm" href={mapLink(g)} target="_blank" rel="noreferrer">View on map ↗</a>}
                </div>
                <label className="check-row">
                  <input type="checkbox" checked={g.enforce} onChange={e => setG({ enforce: e.target.checked })} />
                  Block clock-ins outside the radius (otherwise they're allowed but flagged)
                </label>
              </>
            )}
            <div style={{ marginTop: 16 }}>
              <button type="submit" className="btn btn-primary" disabled={savingSettings}>{savingSettings ? "Saving…" : "Save Rules"}</button>
            </div>
          </div>
        </form>
      )}

      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-header"><span className="card-title">Backup &amp; Export</span></div>
        <div style={{ padding: "20px 24px" }}>
          <p style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 12 }}>
            Download everything (team, hours, pay, jobs, clients, invoices, expenses, messages) as one file. PINs are never included. Keep a copy somewhere safe.
          </p>
          <button className="btn btn-secondary" onClick={handleBackup}>⬇ Download backup</button>
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
