import { useEffect, useState } from "react";
import { api } from "../lib/api";
import type { Shift, UserWithStats } from "../lib/types";
import { Modal } from "../components/Modal";

function addDays(d: Date, n: number) { const r = new Date(d); r.setDate(r.getDate() + n); return r; }
function fmtDate(d: Date) { return d.toISOString().split("T")[0]; }
function fmtDisplay(iso: string) { return new Date(iso + "T00:00:00").toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" }); }

const DAYS = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

export function SchedulePage() {
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [team, setTeam] = useState<UserWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [weekOffset, setWeekOffset] = useState(0);
  const [addModal, setAddModal] = useState<{ date: string; userId?: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ userId: "", startTime: "09:00", endTime: "17:00", title: "", note: "" });
  const [error, setError] = useState("");

  useEffect(() => { load(); }, []);

  async function load() {
    try {
      const [s, t] = await Promise.all([api.getShifts(), api.getTeam()]);
      setShifts(s);
      setTeam(t.filter(u => u.role !== "owner" && u.active));
    } catch {/* ignore */}
    finally { setLoading(false); }
  }

  const weekStart = (() => {
    const d = new Date(); d.setHours(0,0,0,0); d.setDate(d.getDate() - d.getDay() + weekOffset * 7); return d;
  })();
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const weekShifts = shifts.filter(s => weekDays.some(d => fmtDate(d) === s.date));

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!addModal || !form.userId || !form.startTime || !form.endTime) return;
    setSaving(true); setError("");
    try {
      await api.createShift({ userId: form.userId, date: addModal.date, startTime: form.startTime, endTime: form.endTime, title: form.title, note: form.note });
      setAddModal(null);
      setShifts(await api.refreshShifts());
    } catch (err) { setError(err instanceof Error ? err.message : "Failed"); }
    finally { setSaving(false); }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this shift?")) return;
    await api.deleteShift(id);
    setShifts(await api.refreshShifts());
  }

  function openAdd(date: string, userId?: string) {
    setForm({ userId: userId ?? (team[0]?.id ?? ""), startTime: "09:00", endTime: "17:00", title: "", note: "" });
    setError("");
    setAddModal({ date, userId });
  }

  const COLORS = ["#ff6b35","#0ea372","#7c3aed","#0891b2","#d97706","#db2777","#65a30d","#dc2626"];
  const colorMap = new Map(team.map((u, i) => [u.id, COLORS[i % COLORS.length]]));

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <div className="page-title">Schedule</div>
          <div className="page-subtitle">Plan and manage employee shifts</div>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <button className="btn btn-ghost btn-sm" onClick={() => setWeekOffset(w => w - 1)}>← Prev</button>
          <button className="btn btn-secondary btn-sm" onClick={() => setWeekOffset(0)}>Today</button>
          <button className="btn btn-ghost btn-sm" onClick={() => setWeekOffset(w => w + 1)}>Next →</button>
          <button className="btn btn-primary" onClick={() => openAdd(fmtDate(weekStart))}>+ Add Shift</button>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-header">
          <span className="card-title">
            Week of {weekStart.toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" })}
          </span>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {team.map(u => (
              <div key={u.id} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11 }}>
                <div style={{ width: 8, height: 8, borderRadius: 3, background: colorMap.get(u.id) }} />
                <span>{u.name}</span>
              </div>
            ))}
          </div>
        </div>
        {loading ? (
          <div style={{ padding: 40, textAlign: "center" }}><div className="spinner" style={{ margin: "0 auto" }} /></div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 700 }}>
              <thead>
                <tr>
                  {weekDays.map(d => {
                    const isToday = fmtDate(d) === fmtDate(new Date());
                    return (
                      <th key={fmtDate(d)} style={{ padding: "10px 8px", textAlign: "center", fontWeight: 600, fontSize: 12, color: isToday ? "var(--primary)" : "var(--text-secondary)", borderBottom: "1px solid var(--border)", background: isToday ? "var(--primary-light)" : undefined }}>
                        <div>{DAYS[d.getDay()]}</div>
                        <div style={{ fontSize: 16, fontWeight: isToday ? 800 : 600 }}>{d.getDate()}</div>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                <tr>
                  {weekDays.map(d => {
                    const dayStr = fmtDate(d);
                    const dayShifts = weekShifts.filter(s => s.date === dayStr).sort((a,b) => a.startTime.localeCompare(b.startTime));
                    const isToday = dayStr === fmtDate(new Date());
                    return (
                      <td key={dayStr} style={{ padding: 6, verticalAlign: "top", minWidth: 110, borderRight: "1px solid var(--border)", background: isToday ? "rgba(255,106,53,0.03)" : undefined }}>
                        {dayShifts.map(shift => (
                          <div key={shift.id} style={{ background: colorMap.get(shift.userId) + "20", border: `1px solid ${colorMap.get(shift.userId)}40`, borderLeft: `3px solid ${colorMap.get(shift.userId)}`, borderRadius: 6, padding: "5px 7px", marginBottom: 4, fontSize: 11, cursor: "default" }}>
                            <div style={{ fontWeight: 700, color: colorMap.get(shift.userId) }}>{shift.userName ?? "?"}</div>
                            <div style={{ color: "var(--text-secondary)" }}>{shift.startTime} – {shift.endTime}</div>
                            {shift.title && <div style={{ color: "var(--text-muted)", marginTop: 2 }}>{shift.title}</div>}
                            <button onClick={() => handleDelete(shift.id)} style={{ marginTop: 4, fontSize: 10, color: "var(--danger)", background: "none", border: "none", cursor: "pointer", padding: 0 }}>Remove</button>
                          </div>
                        ))}
                        <button onClick={() => openAdd(dayStr)} style={{ width: "100%", padding: "5px 0", background: "none", border: "1px dashed var(--border)", borderRadius: 6, cursor: "pointer", color: "var(--text-muted)", fontSize: 11 }}>+ Add</button>
                      </td>
                    );
                  })}
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>

      {addModal && (
        <Modal title={`Add Shift — ${fmtDisplay(addModal.date)}`}
          onClose={() => setAddModal(null)}
          footer={
            <>
              <button className="btn btn-secondary" onClick={() => setAddModal(null)}>Cancel</button>
              <button className="btn btn-primary" form="shift-form" type="submit" disabled={saving}>
                {saving ? "Saving…" : "Add Shift"}
              </button>
            </>
          }
        >
          <form id="shift-form" onSubmit={handleAdd}>
            <div className="form-group">
              <label>Employee *</label>
              <select value={form.userId} onChange={e => setForm(f => ({ ...f, userId: e.target.value }))} required
                style={{ width: "100%", padding: "9px 12px", border: "1.5px solid var(--border)", borderRadius: "var(--radius)", fontSize: 14, fontFamily: "inherit", background: "var(--surface)" }}>
                <option value="">Select employee…</option>
                {team.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div className="form-group">
                <label>Start Time *</label>
                <input type="time" value={form.startTime} onChange={e => setForm(f => ({ ...f, startTime: e.target.value }))} required />
              </div>
              <div className="form-group">
                <label>End Time *</label>
                <input type="time" value={form.endTime} onChange={e => setForm(f => ({ ...f, endTime: e.target.value }))} required />
              </div>
            </div>
            <div className="form-group">
              <label>Shift Label</label>
              <input type="text" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. Opening shift" />
            </div>
            <div className="form-group">
              <label>Note</label>
              <input type="text" value={form.note} onChange={e => setForm(f => ({ ...f, note: e.target.value }))} placeholder="Optional" />
            </div>
            {error && <p className="error-msg">{error}</p>}
          </form>
        </Modal>
      )}
    </div>
  );
}
