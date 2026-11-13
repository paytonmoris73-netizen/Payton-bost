import { Link } from "react-router-dom";
import { Icons } from "../components/Icons";
import { useStore } from "../state/store";
import { format } from "date-fns";

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

const QUICK_ACTIONS = [
  { label: "Ask AI", icon: Icons.sparkles, to: "/app/tutor", color: "from-brand-500 to-brand-600" },
  { label: "Scan Homework", icon: Icons.camera, to: "/app/homework", color: "from-violet-500 to-purple-600" },
  { label: "Record Lecture", icon: Icons.mic, to: "/app/record", color: "from-rose-500 to-pink-600" },
  { label: "Upload PDF", icon: Icons.upload, to: "/app/materials", color: "from-amber-500 to-orange-600" },
  { label: "Make Flashcards", icon: Icons.flashcards, to: "/app/flashcards", color: "from-emerald-500 to-green-600" },
  { label: "Create Quiz", icon: Icons.quiz, to: "/app/quiz", color: "from-cyan-500 to-teal-600" },
  { label: "Practice Exam", icon: Icons.exam, to: "/app/exams", color: "from-blue-500 to-indigo-600" },
  { label: "Open Notes", icon: Icons.notes, to: "/app/notes", color: "from-fuchsia-500 to-pink-600" },
];

const SUBJECT_COLORS: Record<string, string> = {
  math: "bg-brand-500",
  science: "bg-emerald-500",
  english: "bg-amber-500",
  history: "bg-red-500",
  geography: "bg-cyan-500",
  cs: "bg-violet-500",
};

export function DashboardPage() {
  const profile = useStore((s) => s.profile);
  const subjects = useStore((s) => s.subjects);
  const notes = useStore((s) => s.notes);
  const flashcards = useStore((s) => s.flashcards);
  const quizzes = useStore((s) => s.quizzes);
  const quizAttempts = useStore((s) => s.quizAttempts);
  const studySessions = useStore((s) => s.studySessions);

  const today = format(new Date(), "EEEE, MMMM d, yyyy");
  const dueFlashcards = flashcards.filter((c) => c.nextReview <= Date.now()).length;

  const avgQuizScore =
    quizAttempts.length > 0
      ? Math.round(
          quizAttempts.reduce((sum, a) => sum + (a.score / a.total) * 100, 0) /
            quizAttempts.length
        )
      : 0;

  const uniqueStudyDays = new Set(
    studySessions.map((s) => new Date(s.startTime).toDateString())
  ).size;

  return (
    <div className="max-w-6xl mx-auto px-4 lg:px-6 py-6 space-y-8">
      {/* Welcome */}
      <section className="animate-fade-up">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold font-display text-ink-900 dark:text-white">
              {getGreeting()}, {profile?.name || "Learner"} &#128075;
            </h1>
            <p className="text-sm text-ink-500 dark:text-gray-400 mt-1">{today}</p>
          </div>
          <div className="hidden lg:flex items-center gap-2">
            <Link to="/app/tutor" className="btn-primary">
              <Icons.sparkles size={16} />
              Ask AI
            </Link>
          </div>
        </div>
      </section>

      {/* Quick Actions */}
      <section className="animate-fade-up" style={{ animationDelay: "0.05s" }}>
        <h2 className="text-lg font-bold text-ink-900 dark:text-white mb-3">Quick Actions</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {QUICK_ACTIONS.map((action) => (
            <Link
              key={action.label}
              to={action.to}
              className="card card-hover flex flex-col items-center gap-3 p-4 text-center group"
            >
              <div
                className={`w-12 h-12 rounded-xl bg-gradient-to-br ${action.color} flex items-center justify-center text-white shadow-soft group-hover:scale-105 transition-transform`}
              >
                <action.icon size={22} />
              </div>
              <span className="text-xs font-semibold text-ink-700 dark:text-gray-300">
                {action.label}
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* Your Subjects */}
      <section className="animate-fade-up" style={{ animationDelay: "0.1s" }}>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold text-ink-900 dark:text-white">Your Subjects</h2>
          <Link to="/app/settings" className="text-xs font-medium text-brand-600 dark:text-brand-400 hover:underline">
            Manage
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {subjects.map((subj) => {
            const subjectNotes = notes.filter((n) => n.subjectId === subj.id).length;
            const bg = SUBJECT_COLORS[subj.id] || "bg-gray-500";
            return (
              <div key={subj.id} className="card card-hover p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div
                    className={`w-10 h-10 rounded-lg ${bg} bg-opacity-15 flex items-center justify-center`}
                    style={{ color: subj.color }}
                  >
                    <Icons.study size={20} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-ink-800 dark:text-gray-200 truncate">
                      {subj.name}
                    </h3>
                    <p className="text-xs text-ink-400 dark:text-gray-500">
                      {subjectNotes} note{subjectNotes !== 1 ? "s" : ""}
                    </p>
                  </div>
                </div>
                <div className="w-full bg-warm-200 dark:bg-dark-500 rounded-full h-1.5">
                  <div
                    className="h-1.5 rounded-full transition-all"
                    style={{
                      width: `${Math.max(subj.mastery, 5)}%`,
                      backgroundColor: subj.color,
                    }}
                  />
                </div>
                <p className="text-[10px] text-ink-400 dark:text-gray-500 mt-1">
                  {subj.mastery}% mastery
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Continue Learning */}
      <section className="animate-fade-up" style={{ animationDelay: "0.15s" }}>
        <h2 className="text-lg font-bold text-ink-900 dark:text-white mb-3">Continue Learning</h2>
        {notes.length > 0 || quizzes.length > 0 ? (
          <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1">
            {notes.slice(0, 4).map((note) => (
              <Link
                key={note.id}
                to="/app/notes"
                className="card card-hover flex-shrink-0 w-56 p-4"
              >
                <div className="flex items-center gap-2 mb-2">
                  <Icons.notes size={14} className="text-brand-500" />
                  <span className="text-[10px] font-medium text-ink-400 dark:text-gray-500 uppercase tracking-wider">
                    Note
                  </span>
                </div>
                <h3 className="text-sm font-semibold text-ink-800 dark:text-gray-200 truncate">
                  {note.title}
                </h3>
                <p className="text-xs text-ink-400 dark:text-gray-500 mt-1 line-clamp-2">
                  {note.content.slice(0, 80)}...
                </p>
              </Link>
            ))}
            {quizzes.slice(0, 2).map((quiz) => (
              <Link
                key={quiz.id}
                to="/app/quiz"
                className="card card-hover flex-shrink-0 w-56 p-4"
              >
                <div className="flex items-center gap-2 mb-2">
                  <Icons.quiz size={14} className="text-accent-500" />
                  <span className="text-[10px] font-medium text-ink-400 dark:text-gray-500 uppercase tracking-wider">
                    Quiz
                  </span>
                </div>
                <h3 className="text-sm font-semibold text-ink-800 dark:text-gray-200 truncate">
                  {quiz.title}
                </h3>
                <p className="text-xs text-ink-400 dark:text-gray-500 mt-1">
                  {quiz.questions.length} questions
                </p>
              </Link>
            ))}
          </div>
        ) : (
          <div className="card p-8 text-center">
            <Icons.study size={32} className="mx-auto text-ink-300 dark:text-gray-600 mb-3" />
            <p className="text-sm text-ink-500 dark:text-gray-400 mb-3">
              Start by uploading notes, creating flashcards, or asking the AI tutor a question.
            </p>
            <Link to="/app/tutor" className="btn-primary text-sm">
              <Icons.sparkles size={16} />
              Start Learning
            </Link>
          </div>
        )}
      </section>

      {/* Learning Insights */}
      <section className="animate-fade-up" style={{ animationDelay: "0.2s" }}>
        <h2 className="text-lg font-bold text-ink-900 dark:text-white mb-3">Learning Insights</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <InsightCard
            icon={<Icons.study size={20} />}
            label="Notes Created"
            value={String(notes.length)}
            color="text-brand-500"
            bgColor="bg-brand-50 dark:bg-brand-500/10"
          />
          <InsightCard
            icon={<Icons.zap size={20} />}
            label="Study Days"
            value={String(uniqueStudyDays)}
            color="text-amber-500"
            bgColor="bg-amber-50 dark:bg-amber-500/10"
          />
          <InsightCard
            icon={<Icons.flashcards size={20} />}
            label="Flashcards Due"
            value={String(dueFlashcards)}
            color="text-emerald-500"
            bgColor="bg-emerald-50 dark:bg-emerald-500/10"
          />
          <InsightCard
            icon={<Icons.target size={20} />}
            label="Quiz Average"
            value={quizAttempts.length > 0 ? `${avgQuizScore}%` : "--"}
            color="text-violet-500"
            bgColor="bg-violet-50 dark:bg-violet-500/10"
          />
        </div>
      </section>
    </div>
  );
}

function InsightCard({
  icon,
  label,
  value,
  color,
  bgColor,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: string;
  bgColor: string;
}) {
  return (
    <div className="card p-4">
      <div className={`w-10 h-10 rounded-lg ${bgColor} ${color} flex items-center justify-center mb-3`}>
        {icon}
      </div>
      <p className="text-2xl font-bold text-ink-900 dark:text-white">{value}</p>
      <p className="text-xs text-ink-500 dark:text-gray-400 mt-0.5">{label}</p>
    </div>
  );
}
