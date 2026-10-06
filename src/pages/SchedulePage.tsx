import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { localDate } from "../lib/dates";
import type { Shift, UserWithStats } from "../lib/types";
import { Modal } from "../components/Modal";
import { useToast } from "../contexts/Toast";

const OPEN = "__open__";

function addDays(d: Date, n: number) { const r = new Date(d); r.setDate(r.getDate() + n); return r; }
const fmtDate = localDate;
function fmtDisplay(iso: string) { return new Date(iso + "T00:00:00").toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" }); }

const DAYS = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

export function SchedulePage() {
  const { toast } = useToast();
  const [copying, setCopying] = useState(false);
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
      await api.createShift({ userId: form.userId === OPEN ? "" : form.userId, date: addModal.date, startTime: form.startTime, endTime: form.endTime, title: form.title, note: form.note });
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

  async function decide(shift: Shift, decision: "approve" | "deny") {
    try {
      await api.decideDrop(shift.id, decision);
      setShifts(await api.refreshShifts());
      toast(decision === "approve" ? "Drop approved. The shift is now open for others to claim." : "Drop request denied");
    } catch (err) { toast(err instanceof Error ? err.message : "Failed", "error"); }
  }

  async function copyPreviousWeek() {
    const prevDays = weekDays.map(d => fmtDate(addDays(d, -7)));
    const source = shifts.filter(s => prevDays.includes(s.date));
    if (source.length === 0) { toast("Last week has no shifts to copy", "info"); return; }
    const toCreate = source
      .map(s => ({ ...s, date: fmtDate(addDays(new Date(s.date + "T00:00:00"), 7)) }))
      .filter(n => !shifts.some(x => x.date === n.date && x.userId === n.userId && x.startTime === n.startTime));
    if (toCreate.length === 0) { toast("This week already has those shifts", "info"); return; }
    if (!confirm(`Copy ${toCreate.length} shift${toCreate.length > 1 ? "s" : ""} from last week into this week?`)) return;
    setCopying(true);
    try {
      for (const n of toCreate) await api.createShift({ userId: n.userId, date: n.date, startTime: n.startTime, endTime: n.endTime, title: n.title, note: n.note });
      setShifts(await api.refreshShifts());
      toast(`Copied ${toCreate.length} shift${toCreate.length > 1 ? "s" : ""}`);
    } catch (err) { toast(err instanceof Error ? err.message : "Copy failed", "error"); }
    finally { setCopying(false); }
  }

  const today = fmtDate(new Date());
  const pendingDrops = shifts.filter(s => s.dropRequested && s.date >= today);

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
          <button className="btn btn-secondary btn-sm" onClick={copyPreviousWeek} disabled={copying}>{copying ? "Copying…" : "⧉ Copy last week"}</button>
          <button className="btn btn-primary" onClick={() => openAdd(fmtDate(weekStart))}>+ Add Shift</button>
        </div>
      </div>

      {pendingDrops.length > 0 && (
        <div className="card" style={{ marginBottom: 20 }}>
          <div className="card-header"><span className="card-title">Drop requests</span></div>
          {pendingDrops.map(s => (
            <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 18px", borderTop: "1px solid var(--border)", flexWrap: "wrap" }}>
              <div style={{ flex: 1, minWidth: 180 }}>
                <div style={{ fontWeight: 600 }}>{s.userName} wants to drop a shift</div>
                <div className="td-muted" style={{ fontSize: 12 }}>{fmtDisplay(s.date)} · {s.startTime}–{s.endTime}{s.title ? ` · ${s.title}` : ""}</div>
              </div>
              <button className="btn btn-sm btn-primary" onClick={() => decide(s, "approve")}>Approve (make open)</button>
              <button className="btn btn-sm btn-ghost" onClick={() => decide(s, "deny")}>Deny</button>
            </div>
          ))}
        </div>
      )}

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
                        {dayShifts.map(shift => {
                          const color = shift.userId ? colorMap.get(shift.userId) ?? "#888888" : "#888888";
                          return (
                          <div key={shift.id} style={{ background: shift.userId ? color + "20" : "transparent", border: `1px ${shift.userId ? "solid" : "dashed"} ${color}60`, borderLeft: `3px ${shift.userId ? "solid" : "dashed"} ${color}`, borderRadius: 6, padding: "5px 7px", marginBottom: 4, fontSize: 11, cursor: "default" }}>
                            <div style={{ fontWeight: 700, color }}>{shift.userId ? shift.userName ?? "?" : "Open shift"}</div>
                            {shift.dropRequested && <div style={{ color: "var(--warning)", fontWeight: 600 }}>Drop requested</div>}
                            <div style={{ color: "var(--text-secondary)" }}>{shift.startTime} – {shift.endTime}</div>
                            {shift.title && <div style={{ color: "var(--text-muted)", marginTop: 2 }}>{shift.title}</div>}
                            <button onClick={() => handleDelete(shift.id)} style={{ marginTop: 4, fontSize: 10, color: "var(--danger)", background: "none", border: "none", cursor: "pointer", padding: 0 }}>Remove</button>
                          </div>
                          );
                        })}
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
                <option value={OPEN}>Open shift (first to claim gets it)</option>
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
