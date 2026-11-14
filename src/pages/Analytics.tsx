import { useMemo } from "react";
import { Icon, type IconName } from "../components/Icon";
import { useAppStore } from "../stores/appStore";

export function AnalyticsPage() {
  const subjects = useAppStore((s) => s.subjects);
  const getSubjectStats = useAppStore((s) => s.getSubjectStats);
  const testAttempts = useAppStore((s) => s.testAttempts);
  const studySessions = useAppStore((s) => s.studySessions);
  const flashcardDecks = useAppStore((s) => s.flashcardDecks);
  const stats = useMemo(() => useAppStore.getState().getLearningStats(), [studySessions, testAttempts, flashcardDecks]);

  const formatTime = (ms: number) => {
    const h = Math.floor(ms / 3_600_000);
    const m = Math.floor((ms % 3_600_000) / 60_000);
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  };

  const recentScores = testAttempts.slice(-10).map((a) => a.percentage);

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-text-primary">Learning Analytics</h1>
        <p className="text-sm text-text-secondary mt-0.5">Track your progress and identify areas for improvement</p>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { icon: "clock" as IconName, value: formatTime(stats.totalStudyTime), label: "Total Study Time", color: "bg-blue-500/10 text-blue-500" },
          { icon: "check" as IconName, value: String(stats.questionsCompleted), label: "Questions Done", color: "bg-green-500/10 text-green-600" },
          { icon: "target" as IconName, value: stats.averageScore > 0 ? `${Math.round(stats.averageScore)}%` : "—", label: "Average Score", color: "bg-purple-500/10 text-purple-500" },
          { icon: "flame" as IconName, value: `${stats.streakDays}d`, label: "Study Streak", color: "bg-amber-500/10 text-amber-500" },
        ].map((s) => (
          <div key={s.label} className="card p-4 text-center space-y-2">
            <span className={`inline-flex h-10 w-10 items-center justify-center rounded-xl ${s.color}`}>
              <Icon name={s.icon} className="h-5 w-5" />
            </span>
            <div className="text-2xl font-bold text-text-primary">{s.value}</div>
            <div className="text-[11px] font-medium uppercase tracking-wide text-text-tertiary">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Weekly Activity */}
      <div className="card p-5 space-y-3">
        <h2 className="text-base font-semibold text-text-primary">Weekly Activity</h2>
        <div className="flex items-end gap-2 h-32">
          {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day, i) => {
            const active = stats.weeklyConsistency[i] ?? 0;
            return (
              <div key={day} className="flex-1 flex flex-col items-center gap-2">
                <div className="w-full flex items-end justify-center" style={{ height: 96 }}>
                  <div className={`w-full max-w-[40px] rounded-lg transition-all ${active ? "bg-accent" : "bg-surface-3"}`} style={{ height: active ? 96 : 12 }} />
                </div>
                <span className="text-[11px] font-medium text-text-tertiary">{day}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Test Performance */}
        <div className="card p-5 space-y-3">
          <h2 className="text-base font-semibold text-text-primary">Recent Test Scores</h2>
          {recentScores.length === 0 ? (
            <p className="text-sm text-text-tertiary text-center py-6">Take some tests to see your scores here.</p>
          ) : (
            <div className="flex items-end gap-1.5 h-32">
              {recentScores.map((score, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <div className="w-full flex items-end justify-center" style={{ height: 100 }}>
                    <div
                      className={`w-full max-w-[24px] rounded-md ${score >= 70 ? "bg-green-500" : score >= 50 ? "bg-amber-500" : "bg-red-500"}`}
                      style={{ height: score }}
                    />
                  </div>
                  <span className="text-[10px] text-text-tertiary">{score}%</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Subject Performance */}
        <div className="card p-5 space-y-3">
          <h2 className="text-base font-semibold text-text-primary">Subject Progress</h2>
          {subjects.length === 0 ? (
            <p className="text-sm text-text-tertiary text-center py-6">Create subjects to track per-subject progress.</p>
          ) : (
            <div className="space-y-3">
              {subjects.map((sub) => {
                const s = getSubjectStats(sub.id);
                const total = s.notes + s.flashcards + s.tests;
                return (
                  <div key={sub.id} className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-text-primary">{sub.icon} {sub.name}</span>
                      <span className="text-xs text-text-tertiary">{total} items</span>
                    </div>
                    <div className="h-2 rounded-full bg-surface-3">
                      <div className="h-full rounded-full bg-accent transition-all" style={{ width: `${Math.min(100, total * 10)}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* AI Insights */}
      <div className="card p-5 space-y-3 border-accent/20 bg-accent-subtle">
        <div className="flex items-center gap-2">
          <Icon name="sparkles" className="h-5 w-5 text-accent" />
          <h2 className="text-base font-semibold text-accent-text">AI Learning Insights</h2>
        </div>
        {stats.totalStudyTime > 0 ? (
          <div className="space-y-2 text-sm text-text-primary">
            <p>Based on your activity:</p>
            <ul className="list-disc pl-5 space-y-1 text-text-secondary">
              <li>You've studied for <strong className="text-text-primary">{formatTime(stats.totalStudyTime)}</strong> total</li>
              {stats.averageScore > 0 && <li>Your average test score is <strong className="text-text-primary">{Math.round(stats.averageScore)}%</strong></li>}
              <li>You've reviewed <strong className="text-text-primary">{stats.flashcardsReviewed}</strong> flashcards</li>
              {stats.streakDays > 0 && <li>You're on a <strong className="text-text-primary">{stats.streakDays}-day</strong> study streak!</li>}
            </ul>
          </div>
        ) : (
          <p className="text-sm text-text-secondary">Start studying to receive personalized insights about your learning patterns.</p>
        )}
      </div>
    </div>
  );
}
