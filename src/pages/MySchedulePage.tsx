import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { localDate } from "../lib/dates";
import type { User, Shift } from "../lib/types";
import { useToast } from "../contexts/Toast";

interface Props { user: User; }

function addDays(d: Date, n: number) { const r = new Date(d); r.setDate(r.getDate() + n); return r; }

function shiftHours(s: Shift): number {
  const [sh, sm] = s.startTime.split(":").map(Number);
  const [eh, em] = s.endTime.split(":").map(Number);
  let mins = (eh * 60 + em) - (sh * 60 + sm);
  if (mins <= 0) mins += 24 * 60;
  return mins / 60;
}

export function MySchedulePage({ user }: Props) {
  const { toast } = useToast();
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => { load(); }, [user.id]);

  async function load() {
    try { setShifts(await api.refreshShifts(user.id)); }
    catch { toast("Couldn't load your schedule", "error"); }
    finally { setLoading(false); }
  }

  async function claim(s: Shift) {
    setBusy(s.id);
    try {
      await api.claimShift(s.id);
      toast("Shift claimed. It's yours!");
      await load();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Couldn't claim shift", "error");
      await load();
    } finally { setBusy(null); }
  }

  async function drop(s: Shift) {
    if (!confirm("Ask your manager to let you drop this shift? You're still on it until they approve.")) return;
    setBusy(s.id);
    try {
      await api.dropShift(s.id);
      toast("Drop request sent to your manager");
      await load();
    } catch (err) { toast(err instanceof Error ? err.message : "Request failed", "error"); }
    finally { setBusy(null); }
  }

  const todayStr = localDate();
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const upcoming = shifts.filter(s => s.date >= todayStr)
    .sort((a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime));
  const mine = upcoming.filter(s => s.userId === user.id);
  const open = upcoming.filter(s => !s.userId);

  const weekStart = new Date(today); weekStart.setDate(today.getDate() - today.getDay());
  const wk1 = localDate(addDays(weekStart, 7)), wk2 = localDate(addDays(weekStart, 14));
  const thisWeek = mine.filter(s => s.date < wk1);
  const nextWeek = mine.filter(s => s.date >= wk1 && s.date < wk2);
  const later = mine.filter(s => s.date >= wk2);
  const weekHours = thisWeek.reduce((sum, s) => sum + shiftHours(s), 0);

  function Row({ s, action }: { s: Shift; action: React.ReactNode }) {
    const d = new Date(s.date + "T00:00:00");
    const isToday = s.date === todayStr;
    return (
      <div style={{ display: "flex", gap: 14, alignItems: "center", padding: "12px 0", borderBottom: "1px solid var(--border)", flexWrap: "wrap" }}>
        <div style={{ textAlign: "center", minWidth: 44, background: isToday ? "var(--primary)" : "var(--surface-2)", borderRadius: 8, padding: "6px 8px", border: `1px solid ${isToday ? "var(--primary)" : "var(--border)"}` }}>
          <div style={{ fontSize: 10, fontWeight: 600, color: isToday ? "#fff" : "var(--text-muted)", textTransform: "uppercase" }}>{d.toLocaleDateString(undefined, { weekday: "short" })}</div>
          <div style={{ fontSize: 18, fontWeight: 800, color: isToday ? "#fff" : "var(--text)", lineHeight: 1 }}>{d.getDate()}</div>
        </div>
        <div style={{ flex: 1, minWidth: 140 }}>
          <div style={{ fontWeight: 600, fontSize: 14 }}>{s.title || "Shift"}</div>
          <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{d.toLocaleDateString(undefined, { month: "short", day: "numeric" })} · {s.startTime} – {s.endTime} · {shiftHours(s).toFixed(1)}h</div>
          {s.note && <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>{s.note}</div>}
        </div>
        {action}
      </div>
    );
  }

  function Group({ label, items }: { label: string; items: Shift[] }) {
    if (items.length === 0) return null;
    return (
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-header"><span className="card-title">{label}</span><span className="text-muted" style={{ fontSize: 12 }}>{items.length} shift{items.length !== 1 ? "s" : ""}</span></div>
        <div style={{ padding: "0 20px 12px" }}>
          {items.map(s => (
            <Row key={s.id} s={s} action={
              s.dropRequested
                ? <span className="badge badge-orange">Drop requested</span>
                : <>
                    {s.date === todayStr && <span className="badge badge-green"><span className="badge-dot" />Today</span>}
                    <button className="btn btn-ghost btn-sm" onClick={() => drop(s)} disabled={busy === s.id}>Request drop</button>
                  </>
            } />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <div className="page-title">My Schedule</div>
          <div className="page-subtitle">{mine.length ? `${weekHours.toFixed(1)}h scheduled this week` : "Your upcoming shifts"}</div>
        </div>
      </div>

      {loading ? (
        <div style={{ padding: 40, textAlign: "center" }}><div className="spinner" style={{ margin: "0 auto" }} /></div>
      ) : (
        <>
          {open.length > 0 && (
            <div className="card" style={{ marginBottom: 16, borderColor: "var(--primary)" }}>
              <div className="card-header">
                <span className="card-title">Open shifts</span>
                <span className="text-muted" style={{ fontSize: 12 }}>First to claim gets it</span>
              </div>
              <div style={{ padding: "0 20px 12px" }}>
                {open.map(s => (
                  <Row key={s.id} s={s} action={
                    <button className="btn btn-primary btn-sm" onClick={() => claim(s)} disabled={busy === s.id}>{busy === s.id ? "Claiming…" : "Claim"}</button>
                  } />
                ))}
              </div>
            </div>
          )}
          {mine.length === 0 ? (
            <div className="card">
              <div className="empty-state">
                <div className="empty-state-icon">📅</div>
                <h3>No upcoming shifts</h3>
                <p>{open.length ? "Claim an open shift above, or wait for your manager to schedule you." : "Your manager will schedule your shifts here."}</p>
              </div>
            </div>
          ) : (
            <>
              <Group label="This Week" items={thisWeek} />
              <Group label="Next Week" items={nextWeek} />
              <Group label="Later" items={later} />
            </>
          )}
        </>
      )}
    </div>
  );
}
