import { useMemo } from "react";
import { Icons } from "../components/Icons";
import { useStore } from "../state/store";

export function ProgressPage() {
  const { subjects, studySessions, quizAttempts, flashcards, notes } = useStore();

  const totalStudyMinutes = useMemo(
    () => Math.round(studySessions.reduce((sum, s) => sum + s.duration, 0) / 60),
    [studySessions]
  );

  const sessionsThisWeek = useMemo(() => {
    const weekAgo = Date.now() - 7 * 86400000;
    return studySessions.filter((s) => s.startTime >= weekAgo).length;
  }, [studySessions]);

  const avgQuizScore = useMemo(() => {
    if (quizAttempts.length === 0) return 0;
    const total = quizAttempts.reduce((sum, a) => sum + (a.score / a.total) * 100, 0);
    return Math.round(total / quizAttempts.length);
  }, [quizAttempts]);

  const flashcardsMastered = useMemo(
    () => flashcards.filter((c) => c.interval >= 7).length,
    [flashcards]
  );

  const streakDays = useMemo(() => {
    const now = new Date();
    const days: boolean[] = [];
    for (let i = 6; i >= 0; i--) {
      const day = new Date(now);
      day.setDate(day.getDate() - i);
      const dayStart = new Date(day.getFullYear(), day.getMonth(), day.getDate()).getTime();
      const dayEnd = dayStart + 86400000;
      days.push(studySessions.some((s) => s.startTime >= dayStart && s.startTime < dayEnd));
    }
    return days;
  }, [studySessions]);

  const dayLabels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  const stats = [
    { label: "Study Time", value: totalStudyMinutes > 0 ? `${totalStudyMinutes}m` : "0m", icon: Icons.clock, color: "text-brand-600 dark:text-brand-400", bg: "bg-brand-50 dark:bg-brand-500/15" },
    { label: "Sessions This Week", value: String(sessionsThisWeek), icon: Icons.target, color: "text-green-600 dark:text-green-400", bg: "bg-green-50 dark:bg-green-500/15" },
    { label: "Avg Quiz Score", value: `${avgQuizScore}%`, icon: Icons.quiz, color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-50 dark:bg-amber-500/15" },
    { label: "Cards Mastered", value: String(flashcardsMastered), icon: Icons.flashcards, color: "text-purple-600 dark:text-purple-400", bg: "bg-purple-50 dark:bg-purple-500/15" },
  ];

  const topicsToReview = subjects.filter((s) => s.mastery < 50).slice(0, 4);

  return (
    <div className="p-4 lg:p-6 max-w-6xl mx-auto space-y-6 animate-fade-up">
      <div>
        <h1 className="text-2xl font-bold font-display text-ink-900 dark:text-white">Progress & Insights</h1>
        <p className="text-sm text-ink-500 dark:text-gray-400 mt-1">Track your learning journey</p>
      </div>

      {/* Encouragement banner */}
      <div className="card p-4 bg-gradient-to-r from-brand-50 to-accent-50 dark:from-brand-500/10 dark:to-accent-500/10 border-brand-100 dark:border-brand-500/20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-100 dark:bg-brand-500/20 flex items-center justify-center">
            <Icons.sparkles size={20} className="text-brand-600 dark:text-brand-400" />
          </div>
          <div>
            <p className="text-sm font-semibold text-ink-800 dark:text-gray-200">
              {studySessions.length > 0 ? "Great progress! Keep up the momentum." : "Welcome! Start studying to see your progress here."}
            </p>
            <p className="text-xs text-ink-500 dark:text-gray-400 mt-0.5">
              {studySessions.length > 0
                ? `You've completed ${studySessions.length} study session${studySessions.length === 1 ? "" : "s"} so far.`
                : "Every expert was once a beginner."}
            </p>
          </div>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {stats.map((s) => (
          <div key={s.label} className="card p-4">
            <div className={`w-9 h-9 rounded-lg ${s.bg} flex items-center justify-center ${s.color} mb-3`}>
              <s.icon size={18} />
            </div>
            <p className="text-2xl font-bold text-ink-900 dark:text-white">{s.value}</p>
            <p className="text-xs text-ink-500 dark:text-gray-400 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Subject mastery */}
        <div className="card p-4 lg:p-6">
          <h3 className="text-base font-bold text-ink-900 dark:text-white mb-4">Subject Mastery</h3>
          <div className="space-y-4">
            {subjects.map((sub) => (
              <div key={sub.id}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-ink-700 dark:text-gray-300">{sub.name}</span>
                  <span className="text-xs font-semibold text-ink-500 dark:text-gray-400">{sub.mastery}%</span>
                </div>
                <div className="w-full h-2.5 rounded-full bg-warm-200 dark:bg-dark-500 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${Math.max(sub.mastery, 2)}%`, backgroundColor: sub.color }}
                  />
                </div>
              </div>
            ))}
          </div>
          {subjects.every((s) => s.mastery === 0) && (
            <p className="text-xs text-ink-400 dark:text-gray-500 mt-4">
              Complete quizzes and flashcards to build your mastery.
            </p>
          )}
        </div>

        {/* Study streak */}
        <div className="card p-4 lg:p-6">
          <h3 className="text-base font-bold text-ink-900 dark:text-white mb-4">This Week</h3>
          <div className="flex items-center justify-around py-4">
            {streakDays.map((active, i) => (
              <div key={i} className="flex flex-col items-center gap-2">
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors ${
                    active
                      ? "bg-green-500 text-white"
                      : "bg-warm-200 dark:bg-dark-500 text-ink-400 dark:text-gray-500"
                  }`}
                >
                  {active ? <Icons.check size={16} /> : <span className="text-xs">{dayLabels[i].charAt(0)}</span>}
                </div>
                <span className="text-[10px] font-medium text-ink-400 dark:text-gray-500">{dayLabels[i]}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 p-3 rounded-lg bg-warm-50 dark:bg-dark-600">
            <p className="text-sm text-ink-600 dark:text-gray-300">
              {streakDays.filter(Boolean).length} / 7 days active this week.{" "}
              {streakDays.filter(Boolean).length >= 5
                ? "Excellent consistency!"
                : streakDays.filter(Boolean).length >= 3
                ? "Good effort! Keep building your streak."
                : "Try to study a little each day."}
            </p>
          </div>
        </div>
      </div>

      {/* Recent activity */}
      <div className="card p-4 lg:p-6">
        <h3 className="text-base font-bold text-ink-900 dark:text-white mb-4">Recent Activity</h3>
        {studySessions.length === 0 && notes.length === 0 && quizAttempts.length === 0 ? (
          <div className="text-center py-8">
            <Icons.progress size={32} className="mx-auto text-ink-300 dark:text-gray-600 mb-2" />
            <p className="text-sm text-ink-400 dark:text-gray-500">No activity yet. Start learning to see your history here!</p>
          </div>
        ) : (
          <div className="space-y-2">
            {[...studySessions]
              .sort((a, b) => b.startTime - a.startTime)
              .slice(0, 8)
              .map((s) => {
                const subj = subjects.find((sub) => sub.id === s.subjectId);
                return (
                  <div key={s.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-warm-50 dark:hover:bg-dark-600">
                    <div className="w-8 h-8 rounded-lg bg-brand-50 dark:bg-brand-500/15 flex items-center justify-center text-brand-600 dark:text-brand-400">
                      <Icons.clock size={14} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-ink-800 dark:text-gray-200 capitalize">
                        {s.type} session{subj ? ` · ${subj.name}` : ""}
                      </p>
                      <p className="text-xs text-ink-400 dark:text-gray-500">
                        {Math.round(s.duration / 60)} min
                      </p>
                    </div>
                  </div>
                );
              })}
          </div>
        )}
      </div>

      {/* Topics to review */}
      {topicsToReview.length > 0 && (
        <div className="card p-4 lg:p-6">
          <h3 className="text-base font-bold text-ink-900 dark:text-white mb-3">Topics to Review</h3>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {topicsToReview.map((sub) => (
              <div key={sub.id} className="p-3 rounded-lg bg-warm-50 dark:bg-dark-600">
                <p className="text-sm font-semibold text-ink-800 dark:text-gray-200">{sub.name}</p>
                <p className="text-xs text-ink-400 dark:text-gray-500 mt-0.5">{sub.mastery}% mastery</p>
                <div className="w-full h-1.5 rounded-full bg-warm-200 dark:bg-dark-500 mt-2 overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${Math.max(sub.mastery, 2)}%`, backgroundColor: sub.color }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
