import { useState, useMemo, useEffect } from "react";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameDay,
  isSameMonth,
  addMonths,
  subMonths,
  isToday,
  startOfWeek,
  endOfWeek,
} from "date-fns";
import { Icons } from "../components/Icons";
import { useStore } from "../state/store";
import type { CalendarEvent } from "../types";

const EVENT_COLORS: Record<string, string> = {
  assignment: "bg-brand-500",
  exam: "bg-red-500",
  "study-session": "bg-green-500",
  deadline: "bg-amber-500",
  reminder: "bg-purple-500",
};

const EVENT_LABELS: Record<string, string> = {
  assignment: "Assignment",
  exam: "Exam",
  "study-session": "Study Session",
  deadline: "Deadline",
  reminder: "Reminder",
};

const DEMO_EVENTS: Omit<CalendarEvent, "id">[] = [
  {
    title: "Math Chapter 5 Homework",
    type: "assignment",
    subjectId: "math",
    date: Date.now() + 2 * 86400000,
    description: "Complete exercises 1-20",
    completed: false,
    priority: "medium",
  },
  {
    title: "Science Midterm",
    type: "exam",
    subjectId: "science",
    date: Date.now() + 5 * 86400000,
    description: "Chapters 1-6, bring calculator",
    completed: false,
    priority: "high",
  },
  {
    title: "English Essay Draft",
    type: "deadline",
    subjectId: "english",
    date: Date.now() + 1 * 86400000,
    description: "First draft of persuasive essay",
    completed: false,
    priority: "high",
  },
  {
    title: "History Review Session",
    type: "study-session",
    subjectId: "history",
    date: Date.now() + 3 * 86400000,
    description: "Review notes on Industrial Revolution",
    completed: false,
    priority: "low",
  },
];

function AddEventModal({
  onClose,
  onAdd,
  subjects,
}: {
  onClose: () => void;
  onAdd: (e: Omit<CalendarEvent, "id">) => void;
  subjects: { id: string; name: string }[];
}) {
  const [title, setTitle] = useState("");
  const [type, setType] = useState<CalendarEvent["type"]>("assignment");
  const [subjectId, setSubjectId] = useState(subjects[0]?.id ?? "");
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<CalendarEvent["priority"]>("medium");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    onAdd({
      title: title.trim(),
      type,
      subjectId,
      date: new Date(date + "T12:00:00").getTime(),
      description: description.trim(),
      completed: false,
      priority,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <form
        onSubmit={handleSubmit}
        className="relative card p-6 w-full max-w-md space-y-4 shadow-elevated animate-scale-in"
      >
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-ink-900 dark:text-white">Add Event</h3>
          <button type="button" onClick={onClose} className="btn-ghost p-1">
            <Icons.x size={18} />
          </button>
        </div>

        <input
          className="input"
          placeholder="Event title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          autoFocus
          required
        />

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-ink-500 dark:text-gray-400 mb-1">Type</label>
            <select className="input" value={type} onChange={(e) => setType(e.target.value as CalendarEvent["type"])}>
              {Object.entries(EVENT_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-ink-500 dark:text-gray-400 mb-1">Subject</label>
            <select className="input" value={subjectId} onChange={(e) => setSubjectId(e.target.value)}>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-ink-500 dark:text-gray-400 mb-1">Date</label>
            <input type="date" className="input" value={date} onChange={(e) => setDate(e.target.value)} required />
          </div>
          <div>
            <label className="block text-xs font-medium text-ink-500 dark:text-gray-400 mb-1">Priority</label>
            <select className="input" value={priority} onChange={(e) => setPriority(e.target.value as CalendarEvent["priority"])}>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>
        </div>

        <textarea
          className="input resize-none"
          rows={2}
          placeholder="Description (optional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        <div className="flex gap-3 justify-end">
          <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
          <button type="submit" className="btn-primary">Add Event</button>
        </div>
      </form>
    </div>
  );
}

export function CalendarPage() {
  const {
    calendarEvents,
    addCalendarEvent,
    updateCalendarEvent,
    deleteCalendarEvent,
    subjects,
  } = useStore();

  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    if (calendarEvents.length === 0) {
      DEMO_EVENTS.forEach((e) => addCalendarEvent(e));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const gridStart = startOfWeek(monthStart, { weekStartsOn: 0 });
    const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
    return eachDayOfInterval({ start: gridStart, end: gridEnd });
  }, [currentMonth]);

  const eventsForDay = (day: Date) =>
    calendarEvents.filter((e) => isSameDay(new Date(e.date), day));

  const selectedDayEvents = selectedDay ? eventsForDay(selectedDay) : [];

  const upcomingEvents = useMemo(
    () =>
      [...calendarEvents]
        .filter((e) => e.date >= Date.now() - 86400000)
        .sort((a, b) => a.date - b.date)
        .slice(0, 10),
    [calendarEvents]
  );

  const subjectName = (id?: string) => subjects.find((s) => s.id === id)?.name ?? "";

  const priorityBadge = (p: string) => {
    const cls = p === "high" ? "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400" :
      p === "medium" ? "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400" :
        "bg-gray-100 text-gray-600 dark:bg-gray-500/20 dark:text-gray-400";
    return <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${cls}`}>{p}</span>;
  };

  return (
    <div className="p-4 lg:p-6 max-w-6xl mx-auto space-y-6 animate-fade-up">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold font-display text-ink-900 dark:text-white">Calendar</h1>
        <button onClick={() => setShowAddModal(true)} className="btn-primary">
          <Icons.plus size={16} /> Add Event
        </button>
      </div>

      {/* Calendar grid */}
      <div className="card p-4 lg:p-6">
        <div className="flex items-center justify-between mb-4">
          <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="btn-ghost p-2">
            <Icons.chevronLeft size={18} />
          </button>
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-bold text-ink-900 dark:text-white">
              {format(currentMonth, "MMMM yyyy")}
            </h2>
            <button
              onClick={() => setCurrentMonth(new Date())}
              className="text-xs font-medium text-brand-600 dark:text-brand-400 hover:underline"
            >
              Today
            </button>
          </div>
          <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="btn-ghost p-2">
            <Icons.chevronRight size={18} />
          </button>
        </div>

        <div className="grid grid-cols-7 gap-px">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
            <div key={d} className="text-center text-xs font-semibold text-ink-400 dark:text-gray-500 py-2">{d}</div>
          ))}
          {calendarDays.map((day) => {
            const inMonth = isSameMonth(day, currentMonth);
            const today = isToday(day);
            const selected = selectedDay && isSameDay(day, selectedDay);
            const dayEvents = eventsForDay(day);

            return (
              <button
                key={day.toISOString()}
                onClick={() => setSelectedDay(day)}
                className={`relative aspect-square flex flex-col items-center justify-center rounded-lg transition-all text-sm ${
                  !inMonth ? "text-ink-300 dark:text-gray-600" :
                  selected ? "bg-brand-500 text-white font-bold" :
                  today ? "bg-brand-50 text-brand-700 dark:bg-brand-500/20 dark:text-brand-300 font-semibold" :
                  "text-ink-700 dark:text-gray-300 hover:bg-warm-100 dark:hover:bg-dark-600"
                }`}
              >
                <span>{format(day, "d")}</span>
                {dayEvents.length > 0 && (
                  <div className="flex gap-0.5 mt-0.5">
                    {dayEvents.slice(0, 3).map((ev) => (
                      <span
                        key={ev.id}
                        className={`w-1.5 h-1.5 rounded-full ${selected ? "bg-white/70" : EVENT_COLORS[ev.type] || "bg-gray-400"}`}
                      />
                    ))}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected day events */}
      {selectedDay && (
        <div className="card p-4 lg:p-6 animate-fade-in">
          <h3 className="text-base font-bold text-ink-900 dark:text-white mb-3">
            {format(selectedDay, "EEEE, MMMM d, yyyy")}
          </h3>
          {selectedDayEvents.length === 0 ? (
            <p className="text-sm text-ink-400 dark:text-gray-500">No events for this day.</p>
          ) : (
            <div className="space-y-2">
              {selectedDayEvents.map((ev) => (
                <div
                  key={ev.id}
                  className="flex items-center gap-3 p-3 rounded-lg bg-warm-50 dark:bg-dark-600"
                >
                  <button
                    onClick={() => updateCalendarEvent(ev.id, { completed: !ev.completed })}
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                      ev.completed
                        ? "bg-green-500 border-green-500 text-white"
                        : "border-ink-300 dark:border-gray-500"
                    }`}
                  >
                    {ev.completed && <Icons.check size={12} />}
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium ${ev.completed ? "line-through text-ink-400 dark:text-gray-500" : "text-ink-800 dark:text-gray-200"}`}>
                      {ev.title}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className={`w-2 h-2 rounded-full ${EVENT_COLORS[ev.type]}`} />
                      <span className="text-xs text-ink-400 dark:text-gray-500">{EVENT_LABELS[ev.type]}</span>
                      {ev.subjectId && (
                        <span className="text-xs text-ink-400 dark:text-gray-500">· {subjectName(ev.subjectId)}</span>
                      )}
                    </div>
                  </div>
                  {priorityBadge(ev.priority)}
                  <button
                    onClick={() => deleteCalendarEvent(ev.id)}
                    className="btn-ghost p-1 text-ink-400 hover:text-red-500"
                  >
                    <Icons.trash size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Upcoming events */}
      <div className="card p-4 lg:p-6">
        <h3 className="text-base font-bold text-ink-900 dark:text-white mb-3">Upcoming Events</h3>
        {upcomingEvents.length === 0 ? (
          <p className="text-sm text-ink-400 dark:text-gray-500">No upcoming events. Add one to get started!</p>
        ) : (
          <div className="space-y-2">
            {upcomingEvents.map((ev) => (
              <div
                key={ev.id}
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-warm-50 dark:hover:bg-dark-600 transition-colors"
              >
                <button
                  onClick={() => updateCalendarEvent(ev.id, { completed: !ev.completed })}
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                    ev.completed
                      ? "bg-green-500 border-green-500 text-white"
                      : "border-ink-300 dark:border-gray-500"
                  }`}
                >
                  {ev.completed && <Icons.check size={12} />}
                </button>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium ${ev.completed ? "line-through text-ink-400 dark:text-gray-500" : "text-ink-800 dark:text-gray-200"}`}>
                    {ev.title}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className={`w-2 h-2 rounded-full ${EVENT_COLORS[ev.type]}`} />
                    <span className="text-xs text-ink-400 dark:text-gray-500">
                      {format(new Date(ev.date), "MMM d")} · {EVENT_LABELS[ev.type]}
                    </span>
                    {ev.subjectId && (
                      <span className="text-xs text-ink-400 dark:text-gray-500">· {subjectName(ev.subjectId)}</span>
                    )}
                  </div>
                </div>
                {priorityBadge(ev.priority)}
                <button
                  onClick={() => deleteCalendarEvent(ev.id)}
                  className="btn-ghost p-1 text-ink-400 hover:text-red-500"
                >
                  <Icons.trash size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {showAddModal && (
        <AddEventModal
          onClose={() => setShowAddModal(false)}
          onAdd={addCalendarEvent}
          subjects={subjects.map((s) => ({ id: s.id, name: s.name }))}
        />
      )}
    </div>
  );
}
