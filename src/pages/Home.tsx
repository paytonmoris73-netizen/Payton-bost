import { useMemo } from "react";
import { Link } from "react-router-dom";
import { Icon, type IconName } from "../components/Icon";
import { useAppStore } from "../stores/appStore";

const QUICK_ACTIONS: { to: string; label: string; icon: IconName; color: string }[] = [
  { to: "/app/audio", label: "Record", icon: "mic", color: "bg-red-500/10 text-red-500" },
  { to: "/app/library", label: "Upload", icon: "upload", color: "bg-blue-500/10 text-blue-500" },
  { to: "/app/tutor", label: "Ask AI", icon: "brain", color: "bg-purple-500/10 text-purple-500" },
  { to: "/app/tests", label: "New Test", icon: "test-tube", color: "bg-green-500/10 text-green-500" },
  { to: "/app/flashcards", label: "Flashcards", icon: "layers", color: "bg-amber-500/10 text-amber-500" },
  { to: "/app/audio", label: "Podcast", icon: "podcast", color: "bg-pink-500/10 text-pink-500" },
  { to: "/app/notes", label: "Notes", icon: "file-text", color: "bg-teal-500/10 text-teal-500" },
  { to: "/app/guides", label: "Study Guide", icon: "book-open", color: "bg-indigo-500/10 text-indigo-500" },
];

function formatDuration(ms: number) {
  const hours = Math.floor(ms / 3_600_000);
  const mins = Math.floor((ms % 3_600_000) / 60_000);
  if (hours > 0) return `${hours}h ${mins}m`;
  return `${mins}m`;
}

export function HomePage() {
  const user = useAppStore((s) => s.user);
  const studySessions = useAppStore((s) => s.studySessions);
  const testAttemptsAll = useAppStore((s) => s.testAttempts);
  const allDecks = useAppStore((s) => s.flashcardDecks);
  const stats = useMemo(() => useAppStore.getState().getLearningStats(), [studySessions, testAttemptsAll, allDecks]);
  const subjects = useAppStore((s) => s.subjects);
  const notes = useAppStore((s) => s.notes);
  const conversations = useAppStore((s) => s.conversations);
  const tests = useAppStore((s) => s.tests);
  const testAttempts = useAppStore((s) => s.testAttempts);
  const flashcardDecks = useAppStore((s) => s.flashcardDecks);
  const recordings = useAppStore((s) => s.recordings);

  const recentItems = [
    ...notes.map((n) => ({ id: n.id, type: "Note" as const, title: n.title, time: n.updatedAt, to: "/app/notes" })),
    ...conversations.map((c) => ({ id: c.id, type: "Chat" as const, title: c.title, time: c.updatedAt, to: "/app/tutor" })),
    ...tests.map((t) => ({ id: t.id, type: "Test" as const, title: t.title, time: t.updatedAt, to: "/app/tests" })),
    ...recordings.map((r) => ({ id: r.id, type: "Recording" as const, title: r.title, time: r.createdAt, to: "/app/audio" })),
  ].sort((a, b) => b.time - a.time).slice(0, 6);

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  })();

  const today = new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-8">
      {/* Welcome */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-text-primary">
            {greeting}, {user?.name?.split(" ")[0] ?? "Learner"}
          </h1>
          <p className="text-text-secondary mt-0.5">{today}</p>
        </div>
        <div className="flex items-center gap-3">
          {stats.streakDays > 0 && (
            <div className="chip chip-active gap-2">
              <Icon name="flame" className="h-3.5 w-3.5" />
              {stats.streakDays} day streak
            </div>
          )}
          <Link to="/app/tutor" className="btn-primary py-2">
            <Icon name="sparkles" className="h-4 w-4" /> Quick Study
          </Link>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { icon: "clock" as const, value: formatDuration(stats.totalStudyTime), label: "Study Time" },
          { icon: "check" as const, value: String(stats.questionsCompleted), label: "Questions Done" },
          { icon: "target" as const, value: stats.averageScore > 0 ? `${Math.round(stats.averageScore)}%` : "—", label: "Avg Score" },
          { icon: "layers" as const, value: String(stats.flashcardsReviewed), label: "Cards Reviewed" },
        ].map((s) => (
          <div key={s.label} className="card px-4 py-3.5 text-center space-y-1">
            <div className="flex justify-center">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent-subtle">
                <Icon name={s.icon} className="h-4 w-4 text-accent" />
              </span>
            </div>
            <div className="text-xl font-bold text-text-primary">{s.value}</div>
            <div className="text-[11px] font-medium uppercase tracking-wide text-text-tertiary">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-base font-semibold text-text-primary mb-3">Quick Actions</h2>
        <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
          {QUICK_ACTIONS.map((a) => (
            <Link
              key={a.label}
              to={a.to}
              className="card card-interactive flex flex-col items-center gap-2 py-3 px-2 text-center"
            >
              <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${a.color}`}>
                <Icon name={a.icon} className="h-5 w-5" />
              </span>
              <span className="text-xs font-medium text-text-secondary">{a.label}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Activity & Subjects */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent */}
        <div>
          <h2 className="text-base font-semibold text-text-primary mb-3">Continue Learning</h2>
          {recentItems.length === 0 ? (
            <div className="card flex flex-col items-center gap-3 py-10 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent-subtle">
                <Icon name="sparkles" className="h-6 w-6 text-accent" />
              </div>
              <p className="text-sm font-medium text-text-primary">Start your learning journey</p>
              <p className="text-xs text-text-tertiary max-w-xs">Upload a document, record a lecture, or ask your AI tutor a question.</p>
              <Link to="/app/tutor" className="btn-primary py-2 mt-1">
                <Icon name="brain" className="h-4 w-4" /> Talk to AI Tutor
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {recentItems.map((item) => (
                <Link key={item.id} to={item.to} className="card card-interactive flex items-center gap-3 px-4 py-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-surface-2">
                    <Icon
                      name={item.type === "Note" ? "file-text" : item.type === "Chat" ? "brain" : item.type === "Test" ? "test-tube" : "mic"}
                      className="h-4 w-4 text-text-secondary"
                    />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium text-text-primary">{item.title}</div>
                    <div className="text-xs text-text-tertiary">{item.type} &middot; {new Date(item.time).toLocaleDateString()}</div>
                  </div>
                  <Icon name="chevron-right" className="h-4 w-4 text-text-tertiary shrink-0" />
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Subjects */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold text-text-primary">My Subjects</h2>
            <Link to="/app/subjects" className="text-xs font-semibold text-accent hover:text-accent-hover transition-colors">
              See all <Icon name="chevron-right" className="h-3 w-3 inline" />
            </Link>
          </div>
          {subjects.length === 0 ? (
            <div className="card flex flex-col items-center gap-3 py-10 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent-subtle">
                <Icon name="graduation" className="h-6 w-6 text-accent" />
              </div>
              <p className="text-sm font-medium text-text-primary">No subjects yet</p>
              <p className="text-xs text-text-tertiary max-w-xs">Create subjects to organize your learning materials.</p>
              <Link to="/app/subjects" className="btn-primary py-2 mt-1">
                <Icon name="plus" className="h-4 w-4" /> Create Subject
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {subjects.slice(0, 6).map((sub) => (
                <Link key={sub.id} to={`/app/subjects/${sub.id}`} className="card card-interactive p-4 space-y-2">
                  <span className="text-2xl">{sub.icon}</span>
                  <div className="text-sm font-semibold text-text-primary">{sub.name}</div>
                  <div className="text-xs text-text-tertiary">{sub.description || "No description"}</div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Weekly Activity */}
      <div>
        <h2 className="text-base font-semibold text-text-primary mb-3">This Week</h2>
        <div className="card px-4 py-4">
          <div className="flex items-end gap-1.5 h-20">
            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day, i) => {
              const active = stats.weeklyConsistency[i] ?? 0;
              return (
                <div key={day} className="flex-1 flex flex-col items-center gap-1.5">
                  <div className="w-full flex items-end justify-center" style={{ height: 48 }}>
                    <div
                      className={`w-full max-w-[32px] rounded-md transition-all ${active ? "bg-accent" : "bg-surface-3"}`}
                      style={{ height: active ? 48 : 8 }}
                    />
                  </div>
                  <span className="text-[10px] font-medium text-text-tertiary">{day}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
