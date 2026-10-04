import { useEffect, useState } from "react";
import { api } from "../lib/api";
import type { PublicUser, Task, User, UserWithStats } from "../lib/types";
import { Modal } from "../components/Modal";
import { StatCard } from "../components/StatCard";
import { useToast } from "../contexts/Toast";

interface Props { user: User; }

function localToday(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function dueLabel(due: string | null, done: boolean): { text: string; color: string } | null {
  if (!due) return null;
  const today = localToday();
  const d = new Date(due + "T00:00:00").toLocaleDateString(undefined, { month: "short", day: "numeric" });
  if (done) return { text: d, color: "var(--text-muted)" };
  if (due < today) return { text: `Overdue · ${d}`, color: "var(--danger)" };
  if (due === today) return { text: "Due today", color: "var(--primary)" };
  return { text: `Due ${d}`, color: "var(--text-secondary)" };
}

export function TasksPage({ user }: Props) {
  const { toast } = useToast();
  const isOwner = user.role === "owner";
  const [tasks, setTasks] = useState<Task[]>([]);
  const [team, setTeam] = useState<Array<UserWithStats | PublicUser>>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"open" | "done" | "all">("open");
  const [person, setPerson] = useState("all");
  const [showAdd, setShowAdd] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [assignedTo, setAssignedTo] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => { load(); }, []);

  async function load() {
    try {
      const [t, tm] = await Promise.all([api.getTasks(), isOwner ? api.getTeam() : Promise.resolve([])]);
      setTasks(t);
      setTeam(tm.filter(m => m.role !== "owner" && ("active" in m ? m.active : true)));
    } catch { toast("Couldn't load tasks", "error"); }
    finally { setLoading(false); }
  }

  async function toggle(t: Task) {
    setTasks(ts => ts.map(x => x.id === t.id ? { ...x, done: !x.done } : x));
    try {
      await api.updateTask(t.id, { done: !t.done });
      if (!t.done) toast("Task completed");
    } catch {
      setTasks(ts => ts.map(x => x.id === t.id ? { ...x, done: t.done } : x));
      toast("Couldn't update task", "error");
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this task?")) return;
    await api.deleteTask(id);
    setTasks(ts => ts.filter(t => t.id !== id));
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !assignedTo) return;
    setSaving(true); setError("");
    try {
      await api.createTask({ title: title.trim(), description: description.trim(), assignedTo, dueDate: dueDate || null });
      setTitle(""); setDescription(""); setDueDate("");
      setShowAdd(false);
      setTasks(await api.getTasks());
      toast("Task assigned");
    } catch (err) { setError(err instanceof Error ? err.message : "Failed"); }
    finally { setSaving(false); }
  }

  const today = localToday();
  const scoped = tasks.filter(t => person === "all" || t.assignedTo === person);
  const shown = scoped
    .filter(t => filter === "all" || (filter === "done" ? t.done : !t.done))
    .sort((a, b) => Number(a.done) - Number(b.done) || (a.dueDate ?? "9999").localeCompare(b.dueDate ?? "9999"));
  const open = scoped.filter(t => !t.done).length;
  const overdue = scoped.filter(t => !t.done && t.dueDate && t.dueDate < today).length;
  const dueToday = scoped.filter(t => !t.done && t.dueDate === today).length;
  const pct = scoped.length ? Math.round((scoped.length - open) / scoped.length * 100) : 0;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <div className="page-title">{isOwner ? "Tasks" : "My Tasks"}</div>
          <div className="page-subtitle">{isOwner ? "Assign to-dos and see who's on track" : "Your to-do list from your manager"}</div>
        </div>
        {isOwner && <button className="btn btn-primary" onClick={() => { setShowAdd(true); setError(""); if (!assignedTo && team[0]) setAssignedTo(team[0].id); }}>+ New Task</button>}
      </div>

      <div className="stats-grid">
        <StatCard label="Open" value={open} />
        <StatCard label="Due today" value={dueToday} color={dueToday ? "orange" : undefined} />
        <StatCard label="Overdue" value={overdue} color={overdue ? "red" : undefined} />
        <StatCard label="Completion" value={`${pct}%`} color="green" sub={`${scoped.length - open} of ${scoped.length} done`} />
      </div>

      <div className="card">
        <div className="card-header" style={{ flexWrap: "wrap", gap: 8 }}>
          <div className="tabs-inline" role="tablist">
            {(["open", "done", "all"] as const).map(f => (
              <button key={f} role="tab" aria-selected={filter === f} className={`btn btn-sm ${filter === f ? "btn-primary" : "btn-ghost"}`} onClick={() => setFilter(f)}>
                {f === "open" ? "To do" : f === "done" ? "Done" : "All"}
              </button>
            ))}
          </div>
          {isOwner && team.length > 0 && (
            <select value={person} onChange={e => setPerson(e.target.value)} className="select-sm" aria-label="Filter by employee">
              <option value="all">Everyone</option>
              {team.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
          )}
        </div>

        {loading ? (
          <div style={{ padding: 40, textAlign: "center" }}><div className="spinner" style={{ margin: "0 auto" }} /></div>
        ) : shown.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">{filter === "open" ? "🎉" : "✅"}</div>
            <h3>{filter === "open" ? "All caught up" : "Nothing here yet"}</h3>
            <p>{isOwner ? "Assign a task to keep your team moving." : "New tasks from your manager will show up here."}</p>
          </div>
        ) : (
          <ul className="task-list">
            {shown.map(t => {
              const due = dueLabel(t.dueDate, t.done);
              return (
                <li key={t.id} className={`task-row${t.done ? " done" : ""}`}>
                  <button className={`task-check${t.done ? " checked" : ""}`} onClick={() => toggle(t)} aria-label={t.done ? `Mark "${t.title}" not done` : `Mark "${t.title}" done`}>
                    {t.done && "✓"}
                  </button>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="task-title">{t.title}</div>
                    {t.description && <div className="task-desc">{t.description}</div>}
                    <div className="task-meta">
                      {isOwner && <span>👤 {t.assigneeName}</span>}
                      {due && <span style={{ color: due.color, fontWeight: 600 }}>{due.text}</span>}
                    </div>
                  </div>
                  {isOwner && <button className="btn btn-ghost btn-sm" style={{ color: "var(--danger)" }} onClick={() => handleDelete(t.id)} aria-label={`Delete "${t.title}"`}>×</button>}
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {showAdd && (
        <Modal title="New Task" onClose={() => setShowAdd(false)}
          footer={<>
            <button className="btn btn-secondary" onClick={() => setShowAdd(false)}>Cancel</button>
            <button className="btn btn-primary" form="task-form" type="submit" disabled={saving || !title.trim() || !assignedTo}>{saving ? "Saving…" : "Assign Task"}</button>
          </>}>
          {team.length === 0 ? (
            <p className="text-muted">Add employees on the Team page before assigning tasks.</p>
          ) : (
            <form id="task-form" onSubmit={handleAdd}>
              <div className="form-group">
                <label>Task *</label>
                <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Restock supply closet" autoFocus required />
              </div>
              <div className="form-group">
                <label>Details</label>
                <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} placeholder="Optional instructions" />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div className="form-group">
                  <label>Assign to *</label>
                  <select value={assignedTo} onChange={e => setAssignedTo(e.target.value)} required>
                    {team.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Due date</label>
                  <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} />
                </div>
              </div>
              {error && <p className="error-msg">{error}</p>}
            </form>
          )}
        </Modal>
      )}
    </div>
  );
}
