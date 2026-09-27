import { useEffect, useState } from "react";
import { api } from "../lib/api";
import type { User, UserWithStats } from "../lib/types";
import { Modal } from "../components/Modal";

interface Props {
  user: User;
  onUserUpdate: (u: User) => void;
}

function initials(name: string) {
  return name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
}

function money(n: number): string { return "$" + n.toFixed(2); }
function fmt(h: number): string { const hrs = Math.floor(h); const mins = Math.round((h - hrs) * 60); if (hrs === 0) return `${mins}m`; return mins > 0 ? `${hrs}h ${mins}m` : `${hrs}h`; }

export function TeamPage({ user: _user }: Props) {
  const [team, setTeam] = useState<UserWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [editUser, setEditUser] = useState<UserWithStats | null>(null);
  const [viewUser, setViewUser] = useState<UserWithStats | null>(null);
  const [joinCode, setJoinCode] = useState("");
  const [copied, setCopied] = useState(false);

  // Add form
  const [name, setName] = useState("");
  const [title, setTitle] = useState("");
  const [rate, setRate] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    load();
  }, []);

  async function load() {
    try {
      const [teamData, company] = await Promise.all([api.getTeam(), api.getCompany()]);
      setTeam(teamData);
      setJoinCode(company.joinCode);
    } catch {/* ignore */}
    finally { setLoading(false); }
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    setError("");
    try {
      await api.addEmployee(name.trim(), parseFloat(rate) || 0, title.trim() || "Employee");
      setName(""); setTitle(""); setRate("");
      setShowAdd(false);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add.");
    } finally {
      setSaving(false);
    }
  }

  async function handleEditSave(e: React.FormEvent) {
    e.preventDefault();
    if (!editUser) return;
    setSaving(true);
    setError("");
    try {
      await api.updateEmployee(editUser.id, {
        name: editUser.name,
        title: editUser.title,
        hourlyRate: editUser.hourlyRate,
        active: editUser.active,
      });
      setEditUser(null);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDeactivate(u: UserWithStats) {
    if (!confirm(`Deactivate ${u.name}?`)) return;
    await api.updateEmployee(u.id, { active: false });
    await load();
  }

  async function handleReactivate(u: UserWithStats) {
    await api.updateEmployee(u.id, { active: true });
    await load();
  }

  async function handleRegenCode() {
    if (!confirm("Regenerate the invite code? The old code will stop working.")) return;
    const res = await api.regenerateJoinCode();
    setJoinCode(res.joinCode);
  }

  function copyCode() {
    navigator.clipboard.writeText(joinCode).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  const active = team.filter(u => u.active);
  const inactive = team.filter(u => !u.active);

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <div className="page-title">Team</div>
          <div className="page-subtitle">Manage your employees and invite codes</div>
        </div>
        <button className="btn btn-primary" onClick={() => { setShowAdd(true); setError(""); }}>
          + Add Employee
        </button>
      </div>

      <div className="join-code-box">
        <div>
          <div className="join-code-label">Employee Invite Code</div>
          <div className="join-code-value">{joinCode}</div>
        </div>
        <div className="join-code-actions">
          <button className="btn btn-sm btn-secondary" onClick={copyCode}>
            {copied ? "✓ Copied" : "Copy"}
          </button>
          <button className="btn btn-sm btn-ghost" onClick={handleRegenCode} title="Regenerate code">
            ↻
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: 40 }}><div className="spinner" style={{ margin: "0 auto" }} /></div>
      ) : (
        <>
          <div className="card mb-4">
            <div className="card-header">
              <span className="card-title">Active Employees ({active.filter(u => u.role !== "owner").length})</span>
            </div>
            {active.filter(u => u.role !== "owner").length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">👤</div>
                <h3>No employees yet</h3>
                <p>Add an employee or share the invite code above</p>
              </div>
            ) : (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Title</th>
                      <th>Hourly Rate</th>
                      <th>Status</th>
                      <th>Joined</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {active.filter(u => u.role !== "owner").map(member => (
                      <tr key={member.id}>
                        <td>
                          <div className="row" style={{ gap: 8 }}>
                            <div style={{ width: 30, height: 30, borderRadius: "50%", background: "#2563eb", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 600, flexShrink: 0 }}>
                              {initials(member.name)}
                            </div>
                            <span className="td-name">{member.name}</span>
                          </div>
                        </td>
                        <td>{member.title}</td>
                        <td>{member.hourlyRate > 0 ? money(member.hourlyRate) + "/hr" : <span className="td-muted">Not set</span>}</td>
                        <td>
                          {member.clockedIn
                            ? <span className="badge badge-green"><span className="badge-dot" />Working</span>
                            : <span className="badge badge-gray">Off</span>}
                        </td>
                        <td className="td-muted">{new Date(member.createdAt).toLocaleDateString()}</td>
                        <td>
                          <div className="td-actions">
                            <button className="btn btn-ghost btn-sm" onClick={() => setViewUser(member)}>View</button>
                            <button className="btn btn-ghost btn-sm" onClick={() => { setEditUser(member); setError(""); }}>Edit</button>
                            <button className="btn btn-ghost btn-sm" style={{ color: "var(--danger)" }} onClick={() => handleDeactivate(member)}>Remove</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {inactive.length > 0 && (
            <div className="card">
              <div className="card-header">
                <span className="card-title" style={{ color: "var(--text-muted)" }}>Inactive ({inactive.length})</span>
              </div>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr><th>Name</th><th>Title</th><th></th></tr>
                  </thead>
                  <tbody>
                    {inactive.map(member => (
                      <tr key={member.id}>
                        <td className="td-muted">{member.name}</td>
                        <td className="td-muted">{member.title}</td>
                        <td><button className="btn btn-ghost btn-sm" onClick={() => handleReactivate(member)}>Reactivate</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {showAdd && (
        <Modal title="Add Employee" onClose={() => { setShowAdd(false); setError(""); }}
          footer={
            <>
              <button className="btn btn-secondary" onClick={() => setShowAdd(false)}>Cancel</button>
              <button className="btn btn-primary" form="add-form" type="submit" disabled={saving}>
                {saving ? "Adding…" : "Add Employee"}
              </button>
            </>
          }
        >
          <form id="add-form" onSubmit={handleAdd}>
            <div className="form-group">
              <label>Full Name</label>
              <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Alex Johnson" autoFocus required />
            </div>
            <div className="form-group">
              <label>Job Title</label>
              <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Developer" />
            </div>
            <div className="form-group">
              <label>Hourly Rate ($)</label>
              <input type="number" value={rate} onChange={e => setRate(e.target.value)} placeholder="e.g. 25.00" min="0" step="0.01" />
            </div>
            {error && <p className="error-msg">{error}</p>}
          </form>
        </Modal>
      )}

      {editUser && (
        <Modal title="Edit Employee" onClose={() => { setEditUser(null); setError(""); }}
          footer={
            <>
              <button className="btn btn-secondary" onClick={() => setEditUser(null)}>Cancel</button>
              <button className="btn btn-primary" form="edit-form" type="submit" disabled={saving}>
                {saving ? "Saving…" : "Save Changes"}
              </button>
            </>
          }
        >
          <form id="edit-form" onSubmit={handleEditSave}>
            <div className="form-group">
              <label>Full Name</label>
              <input type="text" value={editUser.name} onChange={e => setEditUser({ ...editUser, name: e.target.value })} required />
            </div>
            <div className="form-group">
              <label>Job Title</label>
              <input type="text" value={editUser.title} onChange={e => setEditUser({ ...editUser, title: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Hourly Rate ($/hr)</label>
              <input type="number" value={editUser.hourlyRate} onChange={e => setEditUser({ ...editUser, hourlyRate: parseFloat(e.target.value) || 0 })} min="0" step="0.01" placeholder="0.00" />
            </div>
            <div className="form-group">
              <label>Status</label>
              <select value={editUser.active ? "active" : "inactive"} onChange={e => setEditUser({ ...editUser, active: e.target.value === "active" })}
                style={{ width: "100%", padding: "9px 12px", border: "1.5px solid var(--border)", borderRadius: "var(--radius)", fontSize: 14, fontFamily: "inherit", background: "var(--surface)" }}>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
            {error && <p className="error-msg">{error}</p>}
          </form>
        </Modal>
      )}

      {viewUser && (
        <Modal title="Employee Profile" onClose={() => setViewUser(null)}
          footer={<button className="btn btn-secondary" onClick={() => setViewUser(null)}>Close</button>}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 20, paddingBottom: 20, borderBottom: "1px solid var(--border)" }}>
            <div style={{ width: 52, height: 52, borderRadius: "50%", background: "linear-gradient(135deg,#5b6af0,#8b5cf6)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, fontWeight: 700, flexShrink: 0 }}>
              {initials(viewUser.name)}
            </div>
            <div>
              <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: "-0.2px" }}>{viewUser.name}</div>
              <div style={{ fontSize: 13, color: "var(--text-muted)" }}>{viewUser.title}</div>
            </div>
            <div style={{ marginLeft: "auto" }}>
              {viewUser.clockedIn
                ? <span className="badge badge-green"><span className="badge-dot" />Working now</span>
                : <span className="badge badge-gray">Off</span>}
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            {[
              { label: "Today", value: fmt(viewUser.todayHours) },
              { label: "This Week", value: fmt(viewUser.weekHours) },
              { label: "This Month", value: fmt(viewUser.monthHours) },
              { label: "Hourly Rate", value: viewUser.hourlyRate > 0 ? money(viewUser.hourlyRate) + "/hr" : "Not set" },
              { label: "Month Owed", value: money(viewUser.monthPay), color: "var(--primary)" },
              { label: "Total Paid", value: money(viewUser.totalPaid), color: "var(--success)" },
              { label: "Balance", value: viewUser.totalOwed > 0 ? `-${money(viewUser.totalOwed)}` : viewUser.totalOwed < 0 ? `+${money(Math.abs(viewUser.totalOwed))}` : "✓ Even", color: viewUser.totalOwed > 0 ? "var(--danger)" : "var(--success)" },
              { label: "Joined", value: new Date(viewUser.createdAt).toLocaleDateString() },
            ].map(({ label, value, color }) => (
              <div key={label} style={{ background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 8, padding: "12px 14px" }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>{label}</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: color ?? "var(--text)" }}>{value}</div>
              </div>
            ))}
          </div>
        </Modal>
      )}
    </div>
  );
}
