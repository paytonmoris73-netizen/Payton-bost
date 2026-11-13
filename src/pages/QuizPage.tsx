import { useState, useEffect, useCallback, useRef } from "react";
import { Icons } from "../components/Icons";
import { useStore } from "../state/store";
import type { QuizQuestion } from "../types";

const DEMO_MATH_QUESTIONS: QuizQuestion[] = [
  { id: "mq1", type: "multiple-choice", question: "What is the value of x in the equation 3x + 7 = 22?", options: ["3", "5", "7", "15"], correctAnswer: "5", explanation: "Subtract 7 from both sides: 3x = 15. Divide both sides by 3: x = 5.", difficulty: "easy" },
  { id: "mq2", type: "multiple-choice", question: "What is the area of a triangle with base 10 cm and height 6 cm?", options: ["16 cm²", "30 cm²", "60 cm²", "36 cm²"], correctAnswer: "30 cm²", explanation: "Area = ½ × base × height = ½ × 10 × 6 = 30 cm².", difficulty: "easy" },
  { id: "mq3", type: "true-false", question: "The square root of 144 is 14.", correctAnswer: "False", explanation: "The square root of 144 is 12, since 12 × 12 = 144.", difficulty: "easy" },
  { id: "mq4", type: "multiple-choice", question: "Simplify: 2(3x − 4) + 5x", options: ["11x − 8", "11x − 4", "6x − 8", "11x + 8"], correctAnswer: "11x − 8", explanation: "Distribute: 6x − 8 + 5x = 11x − 8.", difficulty: "medium" },
  { id: "mq5", type: "fill-blank", question: "The slope of the line y = 4x − 9 is ___.", correctAnswer: "4", explanation: "In slope-intercept form y = mx + b, the slope m is the coefficient of x, which is 4.", difficulty: "easy" },
  { id: "mq6", type: "multiple-choice", question: "What is 15% of 200?", options: ["15", "20", "25", "30"], correctAnswer: "30", explanation: "15% × 200 = 0.15 × 200 = 30.", difficulty: "easy" },
  { id: "mq7", type: "true-false", question: "A right triangle can have two 90° angles.", correctAnswer: "False", explanation: "The angles in a triangle must sum to 180°. Two 90° angles would already equal 180°, leaving 0° for the third angle, which is impossible.", difficulty: "easy" },
  { id: "mq8", type: "multiple-choice", question: "What is the next number in the sequence: 2, 6, 18, 54, ...?", options: ["108", "162", "72", "96"], correctAnswer: "162", explanation: "Each term is multiplied by 3. 54 × 3 = 162.", difficulty: "medium" },
  { id: "mq9", type: "fill-blank", question: "The greatest common factor of 24 and 36 is ___.", correctAnswer: "12", explanation: "Factors of 24: 1, 2, 3, 4, 6, 8, 12, 24. Factors of 36: 1, 2, 3, 4, 6, 9, 12, 18, 36. The greatest common factor is 12.", difficulty: "medium" },
  { id: "mq10", type: "multiple-choice", question: "If f(x) = x² − 3x + 2, what is f(4)?", options: ["2", "6", "10", "12"], correctAnswer: "6", explanation: "f(4) = 16 − 12 + 2 = 6.", difficulty: "medium" },
];

const DEMO_SCIENCE_QUESTIONS: QuizQuestion[] = [
  { id: "sq1", type: "multiple-choice", question: "What is the chemical symbol for water?", options: ["H₂O", "CO₂", "O₂", "NaCl"], correctAnswer: "H₂O", explanation: "Water is composed of two hydrogen atoms and one oxygen atom, giving the formula H₂O.", difficulty: "easy" },
  { id: "sq2", type: "true-false", question: "Mitochondria are known as the powerhouse of the cell.", correctAnswer: "True", explanation: "Mitochondria produce ATP through cellular respiration, which is the main energy currency of the cell.", difficulty: "easy" },
  { id: "sq3", type: "multiple-choice", question: "Which planet is the largest in our solar system?", options: ["Saturn", "Jupiter", "Neptune", "Uranus"], correctAnswer: "Jupiter", explanation: "Jupiter is the largest planet in our solar system, with a diameter of about 139,820 km.", difficulty: "easy" },
  { id: "sq4", type: "fill-blank", question: "The process by which plants convert sunlight into energy is called ___.", correctAnswer: "photosynthesis", explanation: "Photosynthesis is the process where plants use sunlight, carbon dioxide, and water to produce glucose and oxygen.", difficulty: "easy" },
  { id: "sq5", type: "multiple-choice", question: "What type of bond involves the sharing of electrons?", options: ["Ionic bond", "Covalent bond", "Metallic bond", "Hydrogen bond"], correctAnswer: "Covalent bond", explanation: "Covalent bonds form when atoms share electron pairs to achieve a stable electron configuration.", difficulty: "medium" },
  { id: "sq6", type: "true-false", question: "Sound travels faster in water than in air.", correctAnswer: "True", explanation: "Sound travels at about 343 m/s in air and about 1,480 m/s in water because water molecules are closer together.", difficulty: "medium" },
  { id: "sq7", type: "multiple-choice", question: "What is the pH of a neutral substance?", options: ["0", "7", "10", "14"], correctAnswer: "7", explanation: "The pH scale ranges from 0 to 14, with 7 being neutral. Values below 7 are acidic, and above 7 are basic.", difficulty: "easy" },
  { id: "sq8", type: "multiple-choice", question: "Which organelle is responsible for protein synthesis?", options: ["Golgi apparatus", "Ribosome", "Lysosome", "Nucleus"], correctAnswer: "Ribosome", explanation: "Ribosomes read mRNA instructions and assemble amino acids into proteins.", difficulty: "medium" },
  { id: "sq9", type: "fill-blank", question: "Newton's second law states that Force equals mass times ___.", correctAnswer: "acceleration", explanation: "F = ma. Force is the product of an object's mass and its acceleration.", difficulty: "medium" },
  { id: "sq10", type: "multiple-choice", question: "Which layer of Earth's atmosphere do we live in?", options: ["Stratosphere", "Mesosphere", "Troposphere", "Thermosphere"], correctAnswer: "Troposphere", explanation: "The troposphere is the lowest layer of Earth's atmosphere, extending from the surface to about 12 km altitude.", difficulty: "easy" },
];

interface DemoQuiz {
  id: string;
  title: string;
  subjectId: string;
  subjectName: string;
  questions: QuizQuestion[];
  bestScore: number | null;
  createdAt: number;
}

const DEMO_QUIZZES: DemoQuiz[] = [
  { id: "dq1", title: "Algebra Fundamentals", subjectId: "math", subjectName: "Mathematics", questions: DEMO_MATH_QUESTIONS, bestScore: 80, createdAt: Date.now() - 86400000 * 2 },
  { id: "dq2", title: "General Science Review", subjectId: "science", subjectName: "Science", questions: DEMO_SCIENCE_QUESTIONS, bestScore: 90, createdAt: Date.now() - 86400000 },
  { id: "dq3", title: "Physics & Chemistry Mix", subjectId: "science", subjectName: "Science", questions: [...DEMO_SCIENCE_QUESTIONS.slice(4), ...DEMO_SCIENCE_QUESTIONS.slice(0, 4)], bestScore: null, createdAt: Date.now() - 86400000 * 5 },
];

type View = "list" | "create" | "play" | "results";

function formatDate(ts: number) {
  return new Date(ts).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function QuizList({ quizzes, onPlay, onCreate, filter, setFilter }: {
  quizzes: DemoQuiz[]; onPlay: (q: DemoQuiz) => void; onCreate: () => void;
  filter: string; setFilter: (f: string) => void;
}) {
  const subjects = useStore((s) => s.subjects);
  const filtered = filter === "all" ? quizzes : quizzes.filter((q) => q.subjectId === filter);

  return (
    <div className="p-4 lg:p-6 max-w-5xl mx-auto animate-fade-up">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold font-display text-ink-900 dark:text-white">Quizzes</h1>
          <p className="text-sm text-ink-500 dark:text-gray-400 mt-1">Test your knowledge with AI-generated quizzes</p>
        </div>
        <button onClick={onCreate} className="btn-primary">
          <Icons.plus size={16} /> Create Quiz
        </button>
      </div>

      <div className="flex gap-2 mb-5 overflow-x-auto no-scrollbar pb-1">
        <button onClick={() => setFilter("all")} className={`chip whitespace-nowrap ${filter === "all" ? "chip-active" : ""}`}>All Subjects</button>
        {subjects.map((s) => (
          <button key={s.id} onClick={() => setFilter(s.id)} className={`chip whitespace-nowrap ${filter === s.id ? "chip-active" : ""}`}>{s.name}</button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="card p-12 text-center">
          <Icons.quiz size={40} className="mx-auto text-ink-300 dark:text-gray-600 mb-3" />
          <p className="text-ink-500 dark:text-gray-400 font-medium">No quizzes yet</p>
          <p className="text-sm text-ink-400 dark:text-gray-500 mt-1">Create your first quiz to start practicing</p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((q) => (
            <button key={q.id} onClick={() => onPlay(q)} className="card card-hover p-4 text-left group">
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-brand-50 dark:bg-brand-500/15 flex items-center justify-center text-brand-600 dark:text-brand-400">
                  <Icons.quiz size={20} />
                </div>
                <Icons.chevronRight size={16} className="text-ink-300 dark:text-gray-600 group-hover:text-brand-500 transition-colors" />
              </div>
              <h3 className="font-semibold text-ink-900 dark:text-white mb-1">{q.title}</h3>
              <p className="text-xs text-ink-400 dark:text-gray-500 mb-3">{q.subjectName} &middot; {q.questions.length} questions</p>
              <div className="flex items-center justify-between">
                <span className="text-xs text-ink-400 dark:text-gray-500">{formatDate(q.createdAt)}</span>
                {q.bestScore !== null ? (
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${q.bestScore >= 80 ? "bg-success-50 text-success-600 dark:bg-success-500/15 dark:text-success-400" : q.bestScore >= 60 ? "bg-yellow-50 text-yellow-600 dark:bg-yellow-500/15 dark:text-yellow-400" : "bg-red-50 text-red-600 dark:bg-red-500/15 dark:text-red-400"}`}>
                    Best: {q.bestScore}%
                  </span>
                ) : (
                  <span className="text-xs text-ink-300 dark:text-gray-600">Not attempted</span>
                )}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function QuizCreator({ onGenerate, onCancel }: { onGenerate: (q: DemoQuiz) => void; onCancel: () => void }) {
  const subjects = useStore((s) => s.subjects);
  const [title, setTitle] = useState("");
  const [subjectId, setSubjectId] = useState("math");
  const [numQuestions, setNumQuestions] = useState(10);
  const [difficulty, setDifficulty] = useState("mixed");
  const [types, setTypes] = useState({ mc: true, tf: true, fb: true });
  const [generating, setGenerating] = useState(false);

  const handleGenerate = () => {
    if (!title.trim()) return;
    setGenerating(true);
    setTimeout(() => {
      const pool = subjectId === "math" ? DEMO_MATH_QUESTIONS : DEMO_SCIENCE_QUESTIONS;
      const shuffled = [...pool].sort(() => Math.random() - 0.5).slice(0, numQuestions);
      const sub = subjects.find((s) => s.id === subjectId);
      onGenerate({
        id: "gen_" + Date.now().toString(36),
        title: title.trim(),
        subjectId,
        subjectName: sub?.name || "General",
        questions: shuffled,
        bestScore: null,
        createdAt: Date.now(),
      });
    }, 2000);
  };

  const toggleType = (t: keyof typeof types) => setTypes((prev) => ({ ...prev, [t]: !prev[t] }));

  return (
    <div className="p-4 lg:p-6 max-w-2xl mx-auto animate-fade-up">
      <button onClick={onCancel} className="btn-ghost mb-4">
        <Icons.arrowLeft size={16} /> Back to Quizzes
      </button>
      <div className="card p-6">
        <h2 className="text-xl font-bold font-display text-ink-900 dark:text-white mb-6">Create a Quiz</h2>

        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-ink-700 dark:text-gray-300 mb-1.5">Quiz Title</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g., Chapter 5 Review" className="input" />
          </div>

          <div>
            <label className="block text-sm font-medium text-ink-700 dark:text-gray-300 mb-1.5">Subject</label>
            <select value={subjectId} onChange={(e) => setSubjectId(e.target.value)} className="input">
              {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-ink-700 dark:text-gray-300 mb-1.5">Number of Questions: {numQuestions}</label>
            <input type="range" min={5} max={30} value={numQuestions} onChange={(e) => setNumQuestions(Number(e.target.value))}
              className="w-full h-2 bg-warm-200 dark:bg-dark-600 rounded-full appearance-none cursor-pointer accent-brand-500" />
            <div className="flex justify-between text-xs text-ink-400 dark:text-gray-500 mt-1"><span>5</span><span>30</span></div>
          </div>

          <div>
            <label className="block text-sm font-medium text-ink-700 dark:text-gray-300 mb-1.5">Difficulty</label>
            <div className="flex gap-2 flex-wrap">
              {["easy", "medium", "hard", "mixed"].map((d) => (
                <button key={d} onClick={() => setDifficulty(d)} className={`chip capitalize ${difficulty === d ? "chip-active" : ""}`}>{d}</button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-ink-700 dark:text-gray-300 mb-1.5">Question Types</label>
            <div className="flex gap-3 flex-wrap">
              {([["mc", "Multiple Choice"], ["tf", "True / False"], ["fb", "Fill in Blank"]] as const).map(([k, label]) => (
                <label key={k} className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={types[k]} onChange={() => toggleType(k)}
                    className="w-4 h-4 rounded border-warm-300 text-brand-500 focus:ring-brand-400 dark:border-dark-border dark:bg-dark-700" />
                  <span className="text-sm text-ink-700 dark:text-gray-300">{label}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        <button onClick={handleGenerate} disabled={!title.trim() || generating} className="btn-primary w-full mt-8">
          {generating ? (
            <><Icons.loader size={16} /> Generating Quiz...</>
          ) : (
            <><Icons.sparkles size={16} /> Generate Quiz</>
          )}
        </button>
      </div>
    </div>
  );
}

function QuizPlayer({ quiz, onFinish }: { quiz: DemoQuiz; onFinish: (answers: Record<string, string>) => void }) {
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [flagged, setFlagged] = useState<Set<string>>(new Set());
  const [timerEnabled, setTimerEnabled] = useState(false);
  const [timeLeft, setTimeLeft] = useState(quiz.questions.length * 60);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (timerEnabled && timeLeft > 0) {
      timerRef.current = setInterval(() => setTimeLeft((t) => t - 1), 1000);
      return () => { if (timerRef.current) clearInterval(timerRef.current); };
    }
    if (timeLeft <= 0) onFinish(answers);
  }, [timerEnabled, timeLeft]);

  const q = quiz.questions[current];
  const progress = ((current + 1) / quiz.questions.length) * 100;

  const setAnswer = (val: string) => setAnswers((prev) => ({ ...prev, [q.id]: val }));
  const toggleFlag = () => setFlagged((prev) => { const n = new Set(prev); n.has(q.id) ? n.delete(q.id) : n.add(q.id); return n; });

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;

  return (
    <div className="fixed inset-0 bg-warm-100 dark:bg-dark-900 z-50 flex flex-col">
      <div className="border-b border-warm-200 dark:border-dark-border bg-white dark:bg-dark-800 px-4 py-3">
        <div className="max-w-3xl mx-auto flex items-center gap-4">
          <span className="text-sm font-semibold text-ink-700 dark:text-gray-300">{current + 1} / {quiz.questions.length}</span>
          <div className="flex-1 h-2 bg-warm-200 dark:bg-dark-600 rounded-full overflow-hidden">
            <div className="h-full bg-brand-500 rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
          </div>
          <button onClick={() => setTimerEnabled(!timerEnabled)} className={`btn-ghost text-xs px-2 py-1 ${timerEnabled ? "text-brand-600" : ""}`}>
            <Icons.clock size={14} /> {timerEnabled ? formatTime(timeLeft) : "Timer"}
          </button>
          <button onClick={() => onFinish(answers)} className="btn-primary text-xs px-3 py-1.5">Submit</button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 lg:p-8">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-2 mb-6">
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${q.difficulty === "easy" ? "bg-success-50 text-success-600 dark:bg-success-500/15 dark:text-success-400" : q.difficulty === "medium" ? "bg-yellow-50 text-yellow-600 dark:bg-yellow-500/15 dark:text-yellow-400" : "bg-red-50 text-red-600 dark:bg-red-500/15 dark:text-red-400"}`}>
              {q.difficulty}
            </span>
            <button onClick={toggleFlag} className={`btn-ghost text-xs px-2 py-1 ${flagged.has(q.id) ? "text-yellow-500" : ""}`}>
              <Icons.bookmark size={14} /> {flagged.has(q.id) ? "Flagged" : "Flag"}
            </button>
          </div>

          <h3 className="text-xl font-semibold text-ink-900 dark:text-white mb-8 leading-relaxed">{q.question}</h3>

          {q.type === "multiple-choice" && q.options && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {q.options.map((opt, i) => (
                <button key={i} onClick={() => setAnswer(opt)}
                  className={`card p-4 text-left font-medium transition-all ${answers[q.id] === opt ? "border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-300 dark:border-brand-500" : "hover:border-ink-300 dark:hover:border-dark-400 text-ink-700 dark:text-gray-300"}`}>
                  <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-warm-200 dark:bg-dark-600 text-xs font-bold mr-3 text-ink-600 dark:text-gray-400">
                    {String.fromCharCode(65 + i)}
                  </span>
                  {opt}
                </button>
              ))}
            </div>
          )}

          {q.type === "true-false" && (
            <div className="grid grid-cols-2 gap-4">
              {["True", "False"].map((val) => (
                <button key={val} onClick={() => setAnswer(val)}
                  className={`card p-6 text-center text-lg font-semibold transition-all ${answers[q.id] === val ? "border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-300 dark:border-brand-500" : "hover:border-ink-300 dark:hover:border-dark-400 text-ink-700 dark:text-gray-300"}`}>
                  {val}
                </button>
              ))}
            </div>
          )}

          {q.type === "fill-blank" && (
            <input value={answers[q.id] || ""} onChange={(e) => setAnswer(e.target.value)} placeholder="Type your answer..."
              className="input text-lg py-4" autoFocus />
          )}
        </div>
      </div>

      <div className="border-t border-warm-200 dark:border-dark-border bg-white dark:bg-dark-800 px-4 py-3">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <button onClick={() => setCurrent(Math.max(0, current - 1))} disabled={current === 0} className="btn-secondary text-sm">
            <Icons.chevronLeft size={16} /> Previous
          </button>
          <div className="flex gap-1 overflow-x-auto no-scrollbar">
            {quiz.questions.map((_, i) => (
              <button key={i} onClick={() => setCurrent(i)}
                className={`w-8 h-8 rounded-lg text-xs font-medium flex items-center justify-center transition-all ${i === current ? "bg-brand-500 text-white" : answers[quiz.questions[i].id] ? "bg-brand-100 text-brand-700 dark:bg-brand-500/20 dark:text-brand-300" : flagged.has(quiz.questions[i].id) ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-500/20 dark:text-yellow-300" : "bg-warm-100 text-ink-500 dark:bg-dark-600 dark:text-gray-400"}`}>
                {i + 1}
              </button>
            ))}
          </div>
          <button onClick={() => setCurrent(Math.min(quiz.questions.length - 1, current + 1))} disabled={current === quiz.questions.length - 1} className="btn-secondary text-sm">
            Next <Icons.chevronRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}

function QuizResults({ quiz, answers, onRetryMissed, onNewQuiz, onBack }: {
  quiz: DemoQuiz; answers: Record<string, string>;
  onRetryMissed: () => void; onNewQuiz: () => void; onBack: () => void;
}) {
  const [showExplanations, setShowExplanations] = useState(false);
  const correct = quiz.questions.filter((q) => {
    const a = (answers[q.id] || "").trim().toLowerCase();
    return a === q.correctAnswer.toLowerCase();
  }).length;
  const total = quiz.questions.length;
  const pct = Math.round((correct / total) * 100);
  const [animatedPct, setAnimatedPct] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => setAnimatedPct(pct), 100);
    return () => clearTimeout(timer);
  }, [pct]);

  return (
    <div className="p-4 lg:p-6 max-w-3xl mx-auto animate-fade-up">
      <button onClick={onBack} className="btn-ghost mb-4"><Icons.arrowLeft size={16} /> Back to Quizzes</button>
      <div className="card p-8 text-center mb-6">
        <h2 className="text-lg font-semibold text-ink-500 dark:text-gray-400 mb-2">Quiz Complete!</h2>
        <div className="relative w-36 h-36 mx-auto mb-4">
          <svg className="w-36 h-36 -rotate-90" viewBox="0 0 120 120">
            <circle cx="60" cy="60" r="52" fill="none" stroke="currentColor" strokeWidth="8" className="text-warm-200 dark:text-dark-600" />
            <circle cx="60" cy="60" r="52" fill="none" stroke="currentColor" strokeWidth="8" strokeLinecap="round"
              className={pct >= 80 ? "text-success-500" : pct >= 60 ? "text-yellow-500" : "text-red-500"}
              strokeDasharray={`${2 * Math.PI * 52}`} strokeDashoffset={`${2 * Math.PI * 52 * (1 - animatedPct / 100)}`}
              style={{ transition: "stroke-dashoffset 1s ease-out" }} />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-bold text-ink-900 dark:text-white" style={{ transition: "all 1s" }}>{animatedPct}%</span>
          </div>
        </div>
        <p className="text-ink-600 dark:text-gray-300 font-medium">{correct} of {total} correct</p>
        <p className="text-sm text-ink-400 dark:text-gray-500 mt-1">{pct >= 80 ? "Excellent work! Keep it up!" : pct >= 60 ? "Good effort! Review the missed questions." : "Keep practicing, you'll improve!"}</p>
      </div>

      <div className="flex gap-3 mb-6">
        <button onClick={onRetryMissed} className="btn-secondary flex-1"><Icons.arrowRight size={16} /> Retry Missed</button>
        <button onClick={onNewQuiz} className="btn-primary flex-1"><Icons.plus size={16} /> New Quiz</button>
      </div>

      <button onClick={() => setShowExplanations(!showExplanations)} className="btn-ghost w-full mb-4">
        {showExplanations ? "Hide" : "Show"} Explanations <Icons.chevronDown size={16} className={`transition-transform ${showExplanations ? "rotate-180" : ""}`} />
      </button>

      {showExplanations && (
        <div className="space-y-3">
          {quiz.questions.map((q, i) => {
            const userAns = (answers[q.id] || "").trim();
            const isCorrect = userAns.toLowerCase() === q.correctAnswer.toLowerCase();
            return (
              <div key={q.id} className={`card p-4 border-l-4 ${isCorrect ? "border-l-success-500" : "border-l-red-500"}`}>
                <div className="flex items-start gap-3">
                  <span className={`mt-0.5 flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${isCorrect ? "bg-success-100 text-success-700 dark:bg-success-500/20 dark:text-success-400" : "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400"}`}>
                    {isCorrect ? <Icons.check size={12} /> : <Icons.x size={12} />}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-ink-900 dark:text-white mb-1">Q{i + 1}. {q.question}</p>
                    {!isCorrect && <p className="text-xs text-red-600 dark:text-red-400 mb-0.5">Your answer: {userAns || "(no answer)"}</p>}
                    <p className="text-xs text-success-600 dark:text-success-400 mb-2">Correct: {q.correctAnswer}</p>
                    <p className="text-xs text-ink-500 dark:text-gray-400 leading-relaxed">{q.explanation}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function QuizPage() {
  const [view, setView] = useState<View>("list");
  const [quizzes, setQuizzes] = useState<DemoQuiz[]>(DEMO_QUIZZES);
  const [activeQuiz, setActiveQuiz] = useState<DemoQuiz | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [filter, setFilter] = useState("all");

  const handlePlay = useCallback((q: DemoQuiz) => { setActiveQuiz(q); setAnswers({}); setView("play"); }, []);
  const handleFinish = useCallback((a: Record<string, string>) => { setAnswers(a); setView("results"); }, []);

  const handleGenerate = useCallback((q: DemoQuiz) => {
    setQuizzes((prev) => [q, ...prev]);
    setActiveQuiz(q);
    setAnswers({});
    setView("play");
  }, []);

  const retryMissed = useCallback(() => {
    if (!activeQuiz) return;
    const missed = activeQuiz.questions.filter((q) => (answers[q.id] || "").trim().toLowerCase() !== q.correctAnswer.toLowerCase());
    if (missed.length === 0) return;
    setActiveQuiz({ ...activeQuiz, questions: missed });
    setAnswers({});
    setView("play");
  }, [activeQuiz, answers]);

  if (view === "create") return <QuizCreator onGenerate={handleGenerate} onCancel={() => setView("list")} />;
  if (view === "play" && activeQuiz) return <QuizPlayer quiz={activeQuiz} onFinish={handleFinish} />;
  if (view === "results" && activeQuiz) return <QuizResults quiz={activeQuiz} answers={answers} onRetryMissed={retryMissed} onNewQuiz={() => setView("create")} onBack={() => setView("list")} />;
  return <QuizList quizzes={quizzes} onPlay={handlePlay} onCreate={() => setView("create")} filter={filter} setFilter={setFilter} />;
}
