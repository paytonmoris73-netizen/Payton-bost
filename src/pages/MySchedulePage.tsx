import { useEffect, useState } from "react";
import { api } from "../lib/api";
import type { User, Shift } from "../lib/types";

interface Props { user: User; }

function addDays(d: Date, n: number) { const r = new Date(d); r.setDate(r.getDate() + n); return r; }
function fmtDate(d: Date) { return d.toISOString().split("T")[0]; }

export function MySchedulePage({ user }: Props) {
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getShifts(user.id)
      .then(setShifts)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user.id]);

  const today = new Date(); today.setHours(0,0,0,0);
  const upcoming = shifts.filter(s => new Date(s.date + "T00:00:00") >= today)
    .sort((a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime));

  // Group by week
  const weekStart = new Date(today); weekStart.setDate(today.getDate() - today.getDay());
  const thisWeek = upcoming.filter(s => { const d = new Date(s.date + "T00:00:00"); return d >= weekStart && d < addDays(weekStart, 7); });
  const nextWeek = upcoming.filter(s => { const d = new Date(s.date + "T00:00:00"); return d >= addDays(weekStart, 7) && d < addDays(weekStart, 14); });
  const later = upcoming.filter(s => new Date(s.date + "T00:00:00") >= addDays(weekStart, 14));

  function ShiftGroup({ label, items }: { label: string; items: Shift[] }) {
    if (items.length === 0) return null;
    return (
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-header"><span className="card-title">{label}</span><span className="text-muted" style={{ fontSize: 12 }}>{items.length} shift{items.length !== 1 ? "s" : ""}</span></div>
        <div style={{ padding: "0 20px 12px" }}>
          {items.map(s => {
            const d = new Date(s.date + "T00:00:00");
            const isToday = fmtDate(d) === fmtDate(new Date());
            const dur = (() => { const [sh, sm] = s.startTime.split(":").map(Number); const [eh, em] = s.endTime.split(":").map(Number); return ((eh * 60 + em) - (sh * 60 + sm)) / 60; })();
            return (
              <div key={s.id} style={{ display: "flex", gap: 14, alignItems: "center", padding: "12px 0", borderBottom: "1px solid var(--border)" }}>
                <div style={{ textAlign: "center", minWidth: 44, background: isToday ? "var(--primary)" : "var(--surface-2)", borderRadius: 8, padding: "6px 8px", border: `1px solid ${isToday ? "var(--primary)" : "var(--border)"}` }}>
                  <div style={{ fontSize: 10, fontWeight: 600, color: isToday ? "#fff" : "var(--text-muted)", textTransform: "uppercase" }}>{d.toLocaleDateString(undefined, { weekday: "short" })}</div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: isToday ? "#fff" : "var(--text)", lineHeight: 1 }}>{d.getDate()}</div>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{s.title || "Shift"}</div>
                  <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{s.startTime} – {s.endTime} · {dur.toFixed(1)}h</div>
                  {s.note && <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>{s.note}</div>}
                </div>
                {isToday && <span className="badge badge-green"><span className="badge-dot" />Today</span>}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <div className="page-title">My Schedule</div>
          <div className="page-subtitle">Your upcoming shifts</div>
        </div>
      </div>

      {loading ? (
        <div style={{ padding: 40, textAlign: "center" }}><div className="spinner" style={{ margin: "0 auto" }} /></div>
      ) : upcoming.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-icon">📅</div>
            <h3>No upcoming shifts</h3>
            <p>Your manager will schedule your shifts here</p>
          </div>
        </div>
      ) : (
        <>
          <ShiftGroup label="This Week" items={thisWeek} />
          <ShiftGroup label="Next Week" items={nextWeek} />
          <ShiftGroup label="Later" items={later} />
        </>
      )}
    </div>
  );
}
