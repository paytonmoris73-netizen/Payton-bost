import { useState } from "react";
import { Icons } from "../components/Icons";
import { useStore } from "../state/store";
import { format } from "date-fns";

interface ExamConfig {
  subjectId: string;
  topics: string;
  questionCount: number;
  timeLimit: number;
}

interface PastExam {
  id: string;
  title: string;
  subject: string;
  questions: number;
  score: number;
  total: number;
  date: number;
}

const DEMO_EXAMS: PastExam[] = [
  { id: "pe1", title: "Biology Midterm Practice", subject: "Science", questions: 30, score: 24, total: 30, date: Date.now() - 3 * 86400000 },
  { id: "pe2", title: "Algebra Chapter 3-5 Exam", subject: "Mathematics", questions: 25, score: 19, total: 25, date: Date.now() - 7 * 86400000 },
  { id: "pe3", title: "History Unit 2 Test", subject: "History", questions: 40, score: 32, total: 40, date: Date.now() - 12 * 86400000 },
];

export function PracticeExamsPage() {
  const { subjects, quizzes } = useStore();
  const [config, setConfig] = useState<ExamConfig>({
    subjectId: subjects[0]?.id ?? "",
    topics: "",
    questionCount: 25,
    timeLimit: 45,
  });
  const [generating, setGenerating] = useState(false);
  const [pastExams] = useState<PastExam[]>(DEMO_EXAMS);
  const [examReady, setExamReady] = useState(false);

  const handleGenerate = () => {
    setGenerating(true);
    setExamReady(false);
    setTimeout(() => {
      setGenerating(false);
      setExamReady(true);
    }, 2000);
  };

  const scoreColor = (score: number, total: number) => {
    const pct = (score / total) * 100;
    if (pct >= 80) return "text-green-600 dark:text-green-400";
    if (pct >= 60) return "text-amber-600 dark:text-amber-400";
    return "text-red-600 dark:text-red-400";
  };

  return (
    <div className="p-4 lg:p-6 max-w-5xl mx-auto space-y-6 animate-fade-up">
      <div>
        <h1 className="text-2xl font-bold font-display text-ink-900 dark:text-white">Practice Exams</h1>
        <p className="text-sm text-ink-500 dark:text-gray-400 mt-1">
          Generate full-length practice tests from your study materials
        </p>
      </div>

      {/* Exam builder */}
      <div className="card p-5">
        <h2 className="text-base font-bold text-ink-900 dark:text-white mb-4">Create Practice Exam</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-ink-500 dark:text-gray-400 mb-1">Subject</label>
            <select
              className="input"
              value={config.subjectId}
              onChange={(e) => setConfig((c) => ({ ...c, subjectId: e.target.value }))}
            >
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-ink-500 dark:text-gray-400 mb-1">Topics (optional)</label>
            <input
              className="input"
              placeholder="e.g. Chapters 1-5, Fractions, Civil War"
              value={config.topics}
              onChange={(e) => setConfig((c) => ({ ...c, topics: e.target.value }))}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-ink-500 dark:text-gray-400 mb-1">Number of Questions</label>
            <select
              className="input"
              value={config.questionCount}
              onChange={(e) => setConfig((c) => ({ ...c, questionCount: Number(e.target.value) }))}
            >
              {[20, 25, 30, 40, 50].map((n) => (
                <option key={n} value={n}>{n} questions</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-ink-500 dark:text-gray-400 mb-1">Time Limit</label>
            <select
              className="input"
              value={config.timeLimit}
              onChange={(e) => setConfig((c) => ({ ...c, timeLimit: Number(e.target.value) }))}
            >
              {[30, 45, 60, 90, 120].map((n) => (
                <option key={n} value={n}>{n} minutes</option>
              ))}
            </select>
          </div>
        </div>

        <button
          onClick={handleGenerate}
          disabled={generating}
          className="btn-primary mt-5"
        >
          {generating ? (
            <><Icons.loader size={16} /> Generating Exam...</>
          ) : (
            <><Icons.sparkles size={16} /> Generate Exam</>
          )}
        </button>

        {examReady && (
          <div className="mt-4 p-4 rounded-xl bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/20 animate-fade-in">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-500/20 flex items-center justify-center">
                <Icons.check size={20} className="text-green-600 dark:text-green-400" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-green-800 dark:text-green-300">Exam Ready!</p>
                <p className="text-xs text-green-600 dark:text-green-400">
                  {config.questionCount} questions · {config.timeLimit} min time limit ·{" "}
                  {subjects.find((s) => s.id === config.subjectId)?.name}
                </p>
              </div>
              <button className="btn-primary text-sm">Start Exam</button>
            </div>
          </div>
        )}
      </div>

      {/* Past exams */}
      <div className="card p-5">
        <h2 className="text-base font-bold text-ink-900 dark:text-white mb-4">Past Exams</h2>
        {pastExams.length === 0 && quizzes.length === 0 ? (
          <div className="text-center py-8">
            <Icons.exam size={32} className="mx-auto text-ink-300 dark:text-gray-600 mb-2" />
            <p className="text-sm text-ink-400 dark:text-gray-500">No exams yet. Generate your first one above!</p>
          </div>
        ) : (
          <div className="space-y-2">
            {pastExams.map((exam) => {
              const pct = Math.round((exam.score / exam.total) * 100);
              return (
                <div
                  key={exam.id}
                  className="flex items-center gap-4 p-4 rounded-lg hover:bg-warm-50 dark:hover:bg-dark-600 transition-colors"
                >
                  <div className="w-12 h-12 rounded-xl bg-brand-50 dark:bg-brand-500/15 flex items-center justify-center">
                    <span className={`text-lg font-bold ${scoreColor(exam.score, exam.total)}`}>{pct}%</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-ink-800 dark:text-gray-200">{exam.title}</p>
                    <p className="text-xs text-ink-400 dark:text-gray-500 mt-0.5">
                      {exam.subject} · {exam.questions} questions · {exam.score}/{exam.total} correct
                    </p>
                  </div>
                  <div className="text-right hidden sm:block">
                    <p className="text-xs text-ink-400 dark:text-gray-500">{format(new Date(exam.date), "MMM d, yyyy")}</p>
                  </div>
                  <button className="btn-ghost text-sm">
                    <Icons.arrowRight size={14} /> Review
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Tips */}
      <div className="card p-5">
        <h2 className="text-base font-bold text-ink-900 dark:text-white mb-3">Exam Tips</h2>
        <div className="grid sm:grid-cols-2 gap-3">
          {[
            { icon: Icons.clock, title: "Simulate real conditions", desc: "Use a time limit to practice under pressure" },
            { icon: Icons.target, title: "Focus on weak areas", desc: "Use your Progress page to identify topics to review" },
            { icon: Icons.lightbulb, title: "Review mistakes", desc: "Study explanations for every incorrect answer" },
            { icon: Icons.zap, title: "Practice regularly", desc: "Short, frequent practice is more effective than cramming" },
          ].map((tip) => (
            <div key={tip.title} className="flex items-start gap-3 p-3 rounded-lg bg-warm-50 dark:bg-dark-600">
              <tip.icon size={18} className="text-brand-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-ink-800 dark:text-gray-200">{tip.title}</p>
                <p className="text-xs text-ink-500 dark:text-gray-400 mt-0.5">{tip.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
