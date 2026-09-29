import { useEffect, useState } from "react";
import { api } from "../lib/api";
import type { Job, UserWithStats } from "../lib/types";
import { Modal } from "../components/Modal";

const CATEGORIES = ["General", "Development", "Design", "Marketing", "Sales", "Support", "Operations", "Finance", "Other"];
const PRIORITIES = ["normal", "high", "urgent"] as const;
const PAY_COLORS: Record<string, string> = { green: "var(--success)", orange: "var(--warning)", blue: "var(--primary)" };

function money(n: number): string { return "$" + n.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ","); }
function fmtDate(iso: string): string { return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" }); }
function isOverdue(job: Job): boolean {
  return !!job.dueDate && job.status !== "completed" && new Date(job.dueDate) < new Date();
}

const statusBadge = (status: Job["status"]) => {
  const map = { open: "badge-blue", in_progress: "badge-orange", completed: "badge-green" };
  const labels = { open: "Open", in_progress: "In Progress", completed: "Completed" };
  return <span className={`badge ${map[status]}`}>{labels[status]}</span>;
};

const priorityBadge = (p: Job["priority"]) => {
  if (p === "normal") return null;
  return <span className={`badge ${p === "urgent" ? "badge-red" : "badge-orange"}`}>{p === "urgent" ? "🔴 Urgent" : "⚡ High"}</span>;
};

interface FormState {
  title: string; description: string; category: string;
  payType: "fixed" | "hourly"; payAmount: string;
  assignedTo: string[]; priority: "normal" | "high" | "urgent";
  dueDate: string;
}

const blankForm = (): FormState => ({ title: "", description: "", category: "General", payType: "fixed", payAmount: "", assignedTo: [], priority: "normal", dueDate: "" });

export function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [team, setTeam] = useState<UserWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [editJob, setEditJob] = useState<Job | null>(null);
  const [payJob, setPayJob] = useState<Job | null>(null);
  const [form, setForm] = useState<FormState>(blankForm());
  const [payUserId, setPayUserId] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<"all" | "open" | "in_progress" | "completed">("all");
  const [priorityFilter, setPriorityFilter] = useState<"all" | "normal" | "high" | "urgent">("all");

  useEffect(() => { load(); }, []);

  async function load() {
    try {
      const [j, t] = await Promise.all([api.getJobs(), api.getTeam()]);
      setJobs(j);
      setTeam(t.filter(u => u.role !== "owner" && u.active));
    } catch {/* ignore */}
    finally { setLoading(false); }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim()) return;
    setSaving(true); setError("");
    try {
      await api.createJob({ title: form.title.trim(), description: form.description.trim(), category: form.category, payType: form.payType, payAmount: parseFloat(form.payAmount) || 0, assignedTo: form.assignedTo, priority: form.priority, dueDate: form.dueDate || null });
      setShowCreate(false); setForm(blankForm());
      const j = await api.refreshJobs(); setJobs(j);
    } catch (err) { setError(err instanceof Error ? err.message : "Failed"); }
    finally { setSaving(false); }
  }

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editJob) return;
    setSaving(true); setError("");
    try {
      await api.updateJob(editJob.id, { title: form.title.trim(), description: form.description.trim(), category: form.category, payType: form.payType, payAmount: parseFloat(form.payAmount) || 0, assignedTo: form.assignedTo, priority: form.priority, dueDate: form.dueDate || null });
      setEditJob(null); setForm(blankForm());
      const j = await api.refreshJobs(); setJobs(j);
    } catch (err) { setError(err instanceof Error ? err.message : "Failed"); }
    finally { setSaving(false); }
  }

  async function handleStatus(job: Job, status: Job["status"]) {
    await api.updateJob(job.id, { status });
    const j = await api.refreshJobs(); setJobs(j);
  }

  async function handleDelete(job: Job) {
    if (!confirm(`Delete "${job.title}"?`)) return;
    await api.deleteJob(job.id);
    const j = await api.refreshJobs(); setJobs(j);
  }

  async function handlePay(e: React.FormEvent) {
    e.preventDefault();
    if (!payJob || !payUserId) return;
    setSaving(true); setError("");
    try {
      const userId = payUserId === "assigned" && payJob.assignedTo.length === 1 ? payJob.assignedTo[0] : payUserId;
      await api.addPayment({ userId, amount: payJob.payAmount, type: "job", description: `Job: ${payJob.title}`, jobId: payJob.id });
      await api.updateJob(payJob.id, { status: "completed" });
      setPayJob(null); setPayUserId("");
      const j = await api.refreshJobs(); setJobs(j);
    } catch (err) { setError(err instanceof Error ? err.message : "Payment failed"); }
    finally { setSaving(false); }
  }

  function openEdit(job: Job) {
    setForm({ title: job.title, description: job.description, category: job.category, payType: job.payType, payAmount: String(job.payAmount), assignedTo: job.assignedTo, priority: job.priority, dueDate: job.dueDate ?? "" });
    setEditJob(job); setError("");
  }

  function toggleAssign(uid: string) {
    setForm(f => ({ ...f, assignedTo: f.assignedTo.includes(uid) ? f.assignedTo.filter(i => i !== uid) : [...f.assignedTo, uid] }));
  }

  const shown = jobs.filter(j =>
    (filter === "all" || j.status === filter) &&
    (priorityFilter === "all" || j.priority === priorityFilter)
  );
  const counts = { open: jobs.filter(j => j.status === "open").length, in_progress: jobs.filter(j => j.status === "in_progress").length, completed: jobs.filter(j => j.status === "completed").length };
  const completionPct = jobs.length > 0 ? Math.round((counts.completed / jobs.length) * 100) : 0;
  const userMap = new Map(team.map(u => [u.id, u]));

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <div className="page-title">Jobs</div>
          <div className="page-subtitle">Post work and assign it to your team</div>
        </div>
        <button className="btn btn-primary" onClick={() => { setShowCreate(true); setForm(blankForm()); setError(""); }}>
          + Post Job
        </button>
      </div>

      {/* Completion progress bar */}
      {jobs.length > 0 && (
        <div style={{ marginBottom: 16, padding: "12px 16px", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 10 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <span style={{ fontSize: 13, fontWeight: 600 }}>Overall Completion</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: completionPct === 100 ? "var(--success)" : "var(--text)" }}>{completionPct}%</span>
          </div>
          <div style={{ height: 7, background: "var(--surface-2)", borderRadius: 4, overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${completionPct}%`, background: completionPct === 100 ? "var(--success)" : "var(--primary)", borderRadius: 4, transition: "width 0.6s ease" }} />
          </div>
          <div style={{ display: "flex", gap: 16, marginTop: 8, fontSize: 12, color: "var(--text-muted)" }}>
            <span>{counts.open} open</span>
            <span>{counts.in_progress} in progress</span>
            <span>{counts.completed} completed</span>
          </div>
        </div>
      )}

      <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 12, flexWrap: "wrap" }}>
        <div className="tab-bar" style={{ margin: 0 }}>
          {([["all","All"], ["open","Open"], ["in_progress","In Progress"], ["completed","Done"]] as [string, string][]).map(([v, l]) => (
            <button key={v} className={`tab-btn${filter === v ? " active" : ""}`} onClick={() => setFilter(v as typeof filter)}>
              {l} {v !== "all" && <span className="tab-count">{counts[v as keyof typeof counts] ?? jobs.length}</span>}
            </button>
          ))}
        </div>
        <select value={priorityFilter} onChange={e => setPriorityFilter(e.target.value as typeof priorityFilter)}
          style={{ padding: "6px 10px", border: "1px solid var(--border)", borderRadius: "var(--radius)", fontSize: 13, background: "var(--surface)", color: "var(--text)" }}>
          <option value="all">All priorities</option>
          <option value="urgent">🔴 Urgent</option>
          <option value="high">⚡ High</option>
          <option value="normal">Normal</option>
        </select>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: 40 }}><div className="spinner" style={{ margin: "0 auto" }} /></div>
      ) : shown.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📋</div>
          <h3>No jobs {filter !== "all" ? `with status "${filter}"` : "yet"}</h3>
          <p>Post your first job to assign work to your team</p>
        </div>
      ) : (
        <div className="jobs-grid">
          {shown.map(job => {
            const overdue = isOverdue(job);
            const assigned = job.assignedTo.map(id => userMap.get(id)).filter(Boolean);
            return (
              <div key={job.id} className={`job-card${job.status === "completed" ? " completed" : ""}`}>
                <div className="job-card-header">
                  <div className="job-card-badges">
                    {statusBadge(job.status)}
                    {priorityBadge(job.priority)}
                    {overdue && <span className="badge badge-red">Overdue</span>}
                  </div>
                  <span className="job-category">{job.category}</span>
                </div>
                <div className="job-title">{job.title}</div>
                {job.description && <div className="job-desc">{job.description}</div>}
                <div className="job-meta">
                  <div className="job-pay">
                    <span className="job-pay-amount" style={{ color: PAY_COLORS[job.payAmount > 0 ? "green" : "blue"] }}>
                      {job.payAmount > 0 ? money(job.payAmount) : "No pay set"}
                    </span>
                    {job.payAmount > 0 && <span className="job-pay-type">{job.payType === "hourly" ? "/hr" : " fixed"}</span>}
                  </div>
                  {job.dueDate && (
                    <span className={`job-due${overdue ? " overdue" : ""}`}>
                      Due {fmtDate(job.dueDate)}
                    </span>
                  )}
                </div>
                {assigned.length > 0 && (
                  <div className="job-assigned">
                    {assigned.map(u => u && (
                      <span key={u.id} className="assigned-chip">
                        <span className="assigned-dot" style={{ background: "var(--primary)" }}>{u.name[0]}</span>
                        {u.name}
                      </span>
                    ))}
                  </div>
                )}
                <div className="job-actions">
                  {job.status === "open" && (
                    <button className="btn btn-sm btn-secondary" onClick={() => handleStatus(job, "in_progress")}>Start</button>
                  )}
                  {job.status === "in_progress" && (
                    <button className="btn btn-sm" style={{ background: "var(--success-light)", color: "var(--success-text)", border: "none" }} onClick={() => handleStatus(job, "completed")}>Mark Done</button>
                  )}
                  {job.status === "completed" && job.payAmount > 0 && (
                    <button className="btn btn-sm btn-primary" onClick={() => { setPayJob(job); setError(""); if (job.assignedTo.length === 1) setPayUserId(job.assignedTo[0]); else setPayUserId(""); }}>
                      💰 Pay
                    </button>
                  )}
                  <button className="btn btn-sm btn-ghost" onClick={() => openEdit(job)}>Edit</button>
                  <button className="btn btn-sm btn-ghost" style={{ color: "var(--danger)" }} onClick={() => handleDelete(job)}>×</button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {(showCreate || editJob) && (
        <Modal
          title={editJob ? "Edit Job" : "Post a Job"}
          onClose={() => { setShowCreate(false); setEditJob(null); setForm(blankForm()); setError(""); }}
          footer={
            <>
              <button className="btn btn-secondary" onClick={() => { setShowCreate(false); setEditJob(null); }}>Cancel</button>
              <button className="btn btn-primary" form="job-form" type="submit" disabled={saving}>
                {saving ? "Saving…" : editJob ? "Save Changes" : "Post Job"}
              </button>
            </>
          }
        >
          <form id="job-form" onSubmit={editJob ? handleEdit : handleCreate}>
            <div className="form-group">
              <label>Job Title *</label>
              <input type="text" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. Build landing page" autoFocus required />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div className="form-group">
                <label>Category</label>
                <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} style={{ width: "100%", padding: "9px 12px", border: "1px solid var(--border)", borderRadius: "var(--radius)", fontSize: 14 }}>
                  {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Priority</label>
                <select value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value as typeof form.priority }))} style={{ width: "100%", padding: "9px 12px", border: "1px solid var(--border)", borderRadius: "var(--radius)", fontSize: 14 }}>
                  {PRIORITIES.map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
                </select>
              </div>
            </div>
            <div className="form-group">
              <label>Description</label>
              <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="What needs to be done?" rows={2} style={{ width: "100%", padding: "9px 12px", border: "1px solid var(--border)", borderRadius: "var(--radius)", fontSize: 14, resize: "vertical", fontFamily: "inherit" }} />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
              <div className="form-group">
                <label>Pay Type</label>
                <select value={form.payType} onChange={e => setForm(f => ({ ...f, payType: e.target.value as "fixed"|"hourly" }))} style={{ width: "100%", padding: "9px 12px", border: "1px solid var(--border)", borderRadius: "var(--radius)", fontSize: 14 }}>
                  <option value="fixed">Fixed</option>
                  <option value="hourly">Hourly</option>
                </select>
              </div>
              <div className="form-group">
                <label>Pay Amount ($)</label>
                <input type="number" value={form.payAmount} onChange={e => setForm(f => ({ ...f, payAmount: e.target.value }))} placeholder="0.00" min="0" step="0.01" />
              </div>
              <div className="form-group">
                <label>Due Date</label>
                <input type="date" value={form.dueDate} onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))} />
              </div>
            </div>
            <div className="form-group">
              <label>Assign To</label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 4 }}>
                {team.map(u => (
                  <button key={u.id} type="button" onClick={() => toggleAssign(u.id)}
                    style={{ padding: "5px 10px", borderRadius: 20, fontSize: 12, fontWeight: 500, border: `1.5px solid ${form.assignedTo.includes(u.id) ? "var(--primary)" : "var(--border)"}`, background: form.assignedTo.includes(u.id) ? "var(--primary-light)" : "var(--surface)", color: form.assignedTo.includes(u.id) ? "var(--primary-text)" : "var(--text-secondary)", cursor: "pointer" }}>
                    {u.name}
                  </button>
                ))}
                {team.length === 0 && <span className="text-muted">No employees yet</span>}
              </div>
            </div>
            {error && <p className="error-msg">{error}</p>}
          </form>
        </Modal>
      )}

      {payJob && (
        <Modal title="Pay for Job" onClose={() => { setPayJob(null); setError(""); }}
          footer={
            <>
              <button className="btn btn-secondary" onClick={() => setPayJob(null)}>Cancel</button>
              <button className="btn btn-primary" form="pay-form" type="submit" disabled={saving || !payUserId}>
                {saving ? "Processing…" : `Pay ${money(payJob.payAmount)}`}
              </button>
            </>
          }
        >
          <form id="pay-form" onSubmit={handlePay}>
            <p style={{ marginBottom: 16, fontSize: 14, color: "var(--text-secondary)" }}>
              Record payment of <strong style={{ color: "var(--success)" }}>{money(payJob.payAmount)}</strong> for <strong>{payJob.title}</strong>
            </p>
            <div className="form-group">
              <label>Pay To *</label>
              <select value={payUserId} onChange={e => setPayUserId(e.target.value)} required style={{ width: "100%", padding: "9px 12px", border: "1px solid var(--border)", borderRadius: "var(--radius)", fontSize: 14 }}>
                <option value="">Select employee…</option>
                {team.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
            </div>
            {error && <p className="error-msg">{error}</p>}
          </form>
        </Modal>
      )}
    </div>
  );
}
