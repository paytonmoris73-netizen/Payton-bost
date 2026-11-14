import { useState } from "react";
import { Icon } from "../components/Icon";
import { useAppStore } from "../stores/appStore";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const HOURS = Array.from({ length: 16 }, (_, i) => i + 6); // 6am-9pm

export function PlannerPage() {
  const events = useAppStore((s) => s.calendarEvents);
  const addEvent = useAppStore((s) => s.addCalendarEvent);
  const deleteEvent = useAppStore((s) => s.deleteCalendarEvent);

  const [view, setView] = useState<"week" | "list">("week");
  const [showCreate, setShowCreate] = useState(false);
  const [title, setTitle] = useState("");
  const [type, setType] = useState<"study" | "class" | "exam" | "assignment" | "other">("study");
  const [date, setDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("10:00");

  const today = new Date();
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - today.getDay());

  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + i);
    return d;
  });

  const handleCreate = () => {
    if (!title.trim()) return;
    const start = new Date(`${date}T${startTime}`).getTime();
    const end = new Date(`${date}T${endTime}`).getTime();
    addEvent({ title: title.trim(), type, startTime: start, endTime: end, allDay: false, completed: false });
    setShowCreate(false);
    setTitle("");
  };

  const getEventsForDay = (d: Date) =>
    events.filter((e) => {
      const ed = new Date(e.startTime);
      return ed.getFullYear() === d.getFullYear() && ed.getMonth() === d.getMonth() && ed.getDate() === d.getDate();
    });

  const typeColors: Record<string, string> = {
    study: "bg-blue-500/80",
    class: "bg-purple-500/80",
    exam: "bg-red-500/80",
    assignment: "bg-amber-500/80",
    other: "bg-surface-3",
  };

  const upcoming = [...events]
    .filter((e) => e.startTime >= Date.now())
    .sort((a, b) => a.startTime - b.startTime)
    .slice(0, 10);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-text-primary">Study Planner</h1>
          <p className="text-sm text-text-secondary mt-0.5">Plan your study sessions and track deadlines</p>
        </div>
        <div className="flex gap-2">
          <div className="flex rounded-lg border border-border overflow-hidden">
            <button onClick={() => setView("week")} className={`px-3 py-1.5 text-xs font-medium ${view === "week" ? "bg-accent text-text-inverse" : "text-text-secondary"}`}>Week</button>
            <button onClick={() => setView("list")} className={`px-3 py-1.5 text-xs font-medium ${view === "list" ? "bg-accent text-text-inverse" : "text-text-secondary"}`}>List</button>
          </div>
          <button onClick={() => setShowCreate(true)} className="btn-primary">
            <Icon name="plus" className="h-4 w-4" /> Add Event
          </button>
        </div>
      </div>

      {view === "week" ? (
        <div className="card overflow-hidden">
          <div className="grid grid-cols-8 border-b border-border">
            <div className="p-2" />
            {weekDays.map((d, i) => {
              const isToday = d.toDateString() === today.toDateString();
              return (
                <div key={i} className={`p-2 text-center border-l border-border ${isToday ? "bg-accent-subtle" : ""}`}>
                  <div className="text-[10px] font-medium text-text-tertiary uppercase">{DAYS[d.getDay()]}</div>
                  <div className={`text-sm font-bold mt-0.5 ${isToday ? "text-accent" : "text-text-primary"}`}>{d.getDate()}</div>
                </div>
              );
            })}
          </div>
          <div className="max-h-[500px] overflow-y-auto">
            {HOURS.map((hour) => (
              <div key={hour} className="grid grid-cols-8 border-b border-border/50 min-h-[48px]">
                <div className="p-1.5 text-[10px] text-text-tertiary text-right pr-3">{hour > 12 ? hour - 12 : hour}{hour >= 12 ? "pm" : "am"}</div>
                {weekDays.map((d, i) => {
                  const dayEvents = getEventsForDay(d).filter((e) => new Date(e.startTime).getHours() === hour);
                  return (
                    <div key={i} className="border-l border-border/50 p-0.5 relative">
                      {dayEvents.map((e) => (
                        <div key={e.id} className={`${typeColors[e.type] || "bg-accent"} rounded px-1.5 py-0.5 text-[10px] text-white font-medium truncate cursor-pointer`} title={e.title} onClick={() => deleteEvent(e.id)}>
                          {e.title}
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {upcoming.length === 0 ? (
            <div className="card flex flex-col items-center gap-3 py-10 text-center">
              <Icon name="calendar" className="h-8 w-8 text-accent" />
              <p className="text-sm font-medium text-text-primary">No upcoming events</p>
              <p className="text-xs text-text-tertiary">Add study sessions, classes, and deadlines.</p>
            </div>
          ) : (
            upcoming.map((e) => (
              <div key={e.id} className="card card-interactive flex items-center gap-4 px-4 py-3">
                <div className={`h-3 w-3 rounded-full shrink-0 ${typeColors[e.type]}`} />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-text-primary truncate">{e.title}</div>
                  <div className="text-xs text-text-tertiary">
                    {new Date(e.startTime).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })} &middot; {new Date(e.startTime).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })} – {new Date(e.endTime).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}
                  </div>
                </div>
                <span className="chip text-[10px] capitalize">{e.type}</span>
                <button onClick={() => deleteEvent(e.id)} className="btn-ghost p-1.5 text-text-tertiary"><Icon name="trash" className="h-3.5 w-3.5" /></button>
              </div>
            ))
          )}
        </div>
      )}

      {showCreate && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center p-4" onClick={() => setShowCreate(false)}>
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />
          <div className="relative z-10 w-full max-w-md rounded-2xl border border-border bg-surface-0 shadow-modal animate-scale-in p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-semibold text-text-primary">New Event</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">Title</label>
                <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Study session, exam..." className="input-field" autoFocus />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">Type</label>
                <div className="flex gap-1.5 flex-wrap">
                  {(["study", "class", "exam", "assignment", "other"] as const).map((t) => (
                    <button key={t} onClick={() => setType(t)} className={`chip capitalize ${type === t ? "chip-active" : ""}`}>{t}</button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">Date</label>
                <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="input-field" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-1">Start</label>
                  <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} className="input-field" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-1">End</label>
                  <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} className="input-field" />
                </div>
              </div>
            </div>
            <button onClick={handleCreate} disabled={!title.trim()} className="btn-primary w-full">
              <Icon name="plus" className="h-4 w-4" /> Create Event
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
