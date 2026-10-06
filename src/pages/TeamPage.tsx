import { useEffect, useState } from "react";
import { api } from "../lib/api";
import type { User, UserWithStats, EmployeeNote } from "../lib/types";
import { Modal } from "../components/Modal";
import { useToast } from "../contexts/Toast";

interface Props {
  user: User;
  onUserUpdate: (u: User) => void;
}

function initials(name: string) {
  return name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
}

function money(n: number): string { return "$" + n.toFixed(2); }
function fmt(h: number): string { const hrs = Math.floor(h); const mins = Math.round((h - hrs) * 60); if (hrs === 0) return `${mins}m`; return mins > 0 ? `${hrs}h ${mins}m` : `${hrs}h`; }

type SortKey = "name" | "weekHours" | "monthHours" | "weekPay" | "monthPay";

export function TeamPage({ user }: Props) {
  const { toast } = useToast();
  const [team, setTeam] = useState<UserWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [editUser, setEditUser] = useState<UserWithStats | null>(null);
  const [viewUser, setViewUser] = useState<UserWithStats | null>(null);
  const [joinCode, setJoinCode] = useState("");
  const [copied, setCopied] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [sortAsc, setSortAsc] = useState(true);
  const [notes, setNotes] = useState<EmployeeNote[]>([]);
  const [noteText, setNoteText] = useState("");
  const [savingNote, setSavingNote] = useState(false);

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

  async function openView(member: UserWithStats) {
    setViewUser(member);
    setNoteText("");
    try { setNotes(await api.getEmployeeNotes(member.id)); } catch {/* ignore */}
  }

  async function handleAddNote() {
    if (!viewUser || !noteText.trim()) return;
    setSavingNote(true);
    try {
      await api.addEmployeeNote(viewUser.id, noteText.trim(), user.id);
      setNoteText("");
      setNotes(await api.getEmployeeNotes(viewUser.id));
    } catch {/* ignore */}
    finally { setSavingNote(false); }
  }

  async function handleDeleteNote(noteId: string) {
    if (!viewUser) return;
    await api.deleteEmployeeNote(noteId);
    setNotes(await api.getEmployeeNotes(viewUser.id));
  }

  async function handleResetPin(u: UserWithStats) {
    if (!confirm(`Reset ${u.name}'s PIN? They'll be signed out and will set a new PIN next time using your invite code.`)) return;
    try {
      await api.resetEmployeePin(u.id);
      toast(`${u.name}'s PIN was reset`);
    } catch (err) { toast(err instanceof Error ? err.message : "Reset failed", "error"); }
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

  function copyInviteUrl() {
    const url = `${window.location.origin}?join=${joinCode}`;
    navigator.clipboard.writeText(url).catch(() => {});
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 1800);
  }

  function handleSort(key: SortKey) {
    if (sortKey === key) setSortAsc(a => !a);
    else { setSortKey(key); setSortAsc(false); }
  }

  function sortIcon(key: SortKey) {
    if (sortKey !== key) return <span style={{ opacity: 0.3 }}>↕</span>;
    return <span>{sortAsc ? "↑" : "↓"}</span>;
  }

  const active = team.filter(u => u.active);
  const inactive = team.filter(u => !u.active);

  const sortedActive = [...active.filter(u => u.role !== "owner")].sort((a, b) => {
    let diff = 0;
    if (sortKey === "name") diff = a.name.localeCompare(b.name);
    else diff = (a[sortKey] as number) - (b[sortKey] as number);
    return sortAsc ? diff : -diff;
  });

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
          <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4, wordBreak: "break-all" }}>
            {window.location.origin}?join={joinCode}
          </div>
        </div>
        <div className="join-code-actions">
          <button className="btn btn-sm btn-secondary" onClick={copyCode}>
            {copied ? "✓ Code" : "Copy code"}
          </button>
          <button className="btn btn-sm btn-secondary" onClick={copyInviteUrl}>
            {copiedUrl ? "✓ Link copied" : "Copy invite link"}
          </button>
          <button className="btn btn-sm btn-ghost" onClick={handleRegenCode} title="Regenerate code">↻</button>
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
                      <th style={{ cursor: "pointer", userSelect: "none" }} onClick={() => handleSort("name")}>Name {sortIcon("name")}</th>
                      <th>Title</th>
                      <th>Rate</th>
                      <th>Status</th>
                      <th style={{ cursor: "pointer", userSelect: "none" }} onClick={() => handleSort("weekHours")}>Wk Hrs {sortIcon("weekHours")}</th>
                      <th style={{ cursor: "pointer", userSelect: "none" }} onClick={() => handleSort("weekPay")}>Wk Pay {sortIcon("weekPay")}</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedActive.map(member => (
                      <tr key={member.id}>
                        <td>
                          <div className="row" style={{ gap: 8 }}>
                            <div style={{ width: 30, height: 30, borderRadius: "50%", background: "linear-gradient(135deg,#ff9a56,#ff6b35)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, flexShrink: 0 }}>
                              {initials(member.name)}
                            </div>
                            <div>
                              <div className="td-name">{member.name}</div>
                              {member.weekHours >= 40 && (
                                <span style={{ fontSize: 10, fontWeight: 700, color: "#dc2626", background: "rgba(220,38,38,0.1)", borderRadius: 4, padding: "1px 5px" }}>⚠ OT</span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td>{member.title}</td>
                        <td>{member.hourlyRate > 0 ? money(member.hourlyRate) + "/hr" : <span className="td-muted">Not set</span>}</td>
                        <td>
                          {member.clockedIn
                            ? <span className="badge badge-green"><span className="badge-dot" />Working</span>
                            : <span className="badge badge-gray">Off</span>}
                        </td>
                        <td style={{ fontWeight: member.weekHours >= 40 ? 700 : 400, color: member.weekHours >= 40 ? "#dc2626" : "var(--text)" }}>
                          {fmt(member.weekHours)}
                        </td>
                        <td>{member.hourlyRate > 0 ? money(member.weekPay) : <span className="td-muted">—</span>}</td>
                        <td>
                          <div className="td-actions">
                            <button className="btn btn-ghost btn-sm" onClick={() => openView(member)}>View</button>
                            <button className="btn btn-ghost btn-sm" onClick={() => { setEditUser(member); setError(""); }}>Edit</button>
                            <button className="btn btn-ghost btn-sm" onClick={() => handleResetPin(member)} title="Use when someone forgets their PIN">Reset PIN</button>
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
            <div style={{ width: 52, height: 52, borderRadius: "50%", background: "linear-gradient(135deg,#ff9a56,#ff6b35)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, fontWeight: 700, flexShrink: 0 }}>
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
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
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
          {/* Manager Notes */}
          <div style={{ borderTop: "1px solid var(--border)", paddingTop: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 10 }}>Manager Notes</div>
            <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
              <input type="text" value={noteText} onChange={e => setNoteText(e.target.value)} placeholder="Add a note…" style={{ flex: 1, padding: "7px 10px", border: "1px solid var(--border)", borderRadius: "var(--radius)", fontSize: 13, background: "var(--surface)" }} onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); handleAddNote(); }}} />
              <button className="btn btn-sm btn-primary" onClick={handleAddNote} disabled={savingNote || !noteText.trim()}>Add</button>
            </div>
            {notes.length === 0 ? (
              <p style={{ fontSize: 12, color: "var(--text-muted)", textAlign: "center", padding: "8px 0" }}>No notes yet</p>
            ) : (
              notes.map(n => (
                <div key={n.id} style={{ background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 8, padding: "9px 12px", marginBottom: 6, display: "flex", gap: 8, alignItems: "flex-start" }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, color: "var(--text)" }}>{n.text}</div>
                    <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 3 }}>{n.authorName} · {new Date(n.createdAt).toLocaleDateString()}</div>
                  </div>
                  <button onClick={() => handleDeleteNote(n.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", fontSize: 14, lineHeight: 1, flexShrink: 0 }}>×</button>
                </div>
              ))
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}
