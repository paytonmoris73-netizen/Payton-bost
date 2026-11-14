import { useState, useCallback, useEffect } from "react";
import { Icon, type IconName } from "../components/Icon";
import { useAppStore } from "../stores/appStore";
import { Modal } from "../components/ui/Modal";
import type { Test, Question, QuestionType, TestSettings, TestAttempt, QuestionResult } from "../types";
import { v4 as uuid } from "uuid";

const TEST_TYPES = [
  { id: "quiz", label: "Practice Quiz", icon: "zap" as IconName },
  { id: "chapter", label: "Chapter Test", icon: "book-open" as IconName },
  { id: "unit", label: "Unit Test", icon: "layers" as IconName },
  { id: "final", label: "Final Exam", icon: "graduation" as IconName },
  { id: "mock", label: "Mock Exam", icon: "target" as IconName },
  { id: "vocabulary", label: "Vocabulary", icon: "hash" as IconName },
  { id: "mixed", label: "Mixed Format", icon: "grid" as IconName },
];

const DIFFICULTIES = ["easy", "medium", "hard"] as const;
const Q_TYPES: { id: QuestionType; label: string }[] = [
  { id: "multiple-choice", label: "Multiple Choice" },
  { id: "true-false", label: "True / False" },
  { id: "fill-blank", label: "Fill in the Blank" },
  { id: "short-answer", label: "Short Answer" },
  { id: "matching", label: "Matching" },
  { id: "vocabulary", label: "Vocabulary" },
  { id: "explain", label: "Explain Your Answer" },
];

function generateQuestions(topic: string, count: number, types: QuestionType[], difficulty: string): Question[] {
  const sampleQuestions: Question[] = [];
  for (let i = 0; i < count; i++) {
    const qType = types[i % types.length];
    const diff = difficulty === "mixed" ? DIFFICULTIES[i % 3] : (difficulty as "easy" | "medium" | "hard");
    const q: Question = {
      id: uuid(),
      type: qType,
      text: "",
      options: undefined,
      correctAnswer: "",
      explanation: "",
      difficulty: diff,
      points: diff === "easy" ? 1 : diff === "medium" ? 2 : 3,
      topic,
    };

    switch (qType) {
      case "multiple-choice":
        q.text = `Question ${i + 1}: Which of the following best describes a key concept related to ${topic}?`;
        q.options = [
          "The process by which organisms convert energy from their environment",
          "A statistical method used primarily in data analysis",
          "The structural framework that supports cellular function",
          "An abstract mathematical model used in theoretical physics",
        ];
        q.correctAnswer = "The process by which organisms convert energy from their environment";
        q.explanation = `This is correct because it accurately describes a fundamental concept in ${topic}. The other options, while they may sound plausible, describe concepts from different fields.`;
        break;
      case "true-false":
        q.text = `Question ${i + 1}: True or False — The fundamental principles of ${topic} were first established in the 20th century.`;
        q.options = ["True", "False"];
        q.correctAnswer = "False";
        q.explanation = `Many foundational concepts in ${topic} were established much earlier, though significant advances continued through the 20th century.`;
        break;
      case "fill-blank":
        q.text = `Question ${i + 1}: The main function of _______ in ${topic} is to maintain balance and regulation within the system.`;
        q.correctAnswer = "homeostasis";
        q.explanation = `Homeostasis refers to the ability of a system to maintain internal stability. In the context of ${topic}, this concept is fundamental.`;
        break;
      case "short-answer":
        q.text = `Question ${i + 1}: Briefly explain the significance of the key principles in ${topic} and provide one example.`;
        q.correctAnswer = "The key principles provide a framework for understanding the subject. Example answers should demonstrate understanding of core concepts.";
        q.explanation = `A good answer should include: 1) A clear statement of the principle, 2) Why it matters, 3) A specific, relevant example.`;
        break;
      case "vocabulary":
        q.text = `Question ${i + 1}: Define the following term as it relates to ${topic}: "synthesis"`;
        q.correctAnswer = "The combination of components to form a connected whole; in this context, the process of building complex structures from simpler ones.";
        q.explanation = `Synthesis in ${topic} refers to the constructive process of combining elements. Understanding this term is crucial for grasping larger concepts.`;
        break;
      case "matching":
        q.text = `Question ${i + 1}: Match the following concepts with their correct definitions in ${topic}:\nA) Analysis\nB) Synthesis\nC) Evaluation`;
        q.options = [
          "Breaking down information into components",
          "Combining elements to form a new whole",
          "Making judgments based on criteria",
        ];
        q.correctAnswer = "A-1, B-2, C-3";
        q.explanation = `Analysis involves breaking down, synthesis involves combining, and evaluation involves judgment — these are key cognitive processes in ${topic}.`;
        break;
      default:
        q.text = `Question ${i + 1}: Explain in your own words how the main concepts of ${topic} relate to each other and why they are important.`;
        q.correctAnswer = "Answers should demonstrate understanding of relationships between concepts and their practical significance.";
        q.explanation = `A strong answer connects multiple concepts and explains their real-world relevance.`;
    }
    sampleQuestions.push(q);
  }
  return sampleQuestions;
}

function TestTakingView({ test, onFinish }: { test: Test; onFinish: (attempt: Omit<TestAttempt, "id">) => void }) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [currentQ, setCurrentQ] = useState(0);
  const [timeLeft, setTimeLeft] = useState(test.settings.timeLimit ? test.settings.timeLimit * 60 : 0);
  const [submitted, setSubmitted] = useState(false);
  const [marked, setMarked] = useState<Set<string>>(new Set());
  const startTime = useState(() => Date.now())[0];

  useEffect(() => {
    if (!test.settings.timeLimit || submitted) return;
    const interval = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) { clearInterval(interval); return 0; }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [test.settings.timeLimit, submitted]);

  const handleSubmit = () => {
    const results: QuestionResult[] = test.questions.map((q) => {
      const answer = answers[q.id] || "";
      let correct = false;
      if (q.type === "multiple-choice" || q.type === "true-false") {
        correct = answer === q.correctAnswer;
      } else if (q.type === "fill-blank") {
        correct = answer.toLowerCase().trim() === (q.correctAnswer as string).toLowerCase().trim();
      } else {
        correct = answer.length > 10;
      }
      return {
        questionId: q.id,
        answer,
        correct,
        pointsEarned: correct ? q.points : 0,
        feedback: correct ? "Correct!" : `The correct answer is: ${q.correctAnswer}`,
      };
    });

    const totalPoints = test.questions.reduce((s, q) => s + q.points, 0);
    const score = results.reduce((s, r) => s + r.pointsEarned, 0);

    onFinish({
      testId: test.id,
      answers,
      score,
      totalPoints,
      percentage: totalPoints > 0 ? Math.round((score / totalPoints) * 100) : 0,
      timeTaken: Math.round((Date.now() - startTime) / 1000),
      startedAt: startTime,
      completedAt: Date.now(),
      graded: true,
      questionResults: results,
    });
    setSubmitted(true);
  };

  const q = test.questions[currentQ];
  if (!q) return null;

  const oneAtATime = test.settings.showOneAtATime;

  const renderQuestion = (question: Question, idx: number) => (
    <div key={question.id} className={`card p-5 space-y-4 ${marked.has(question.id) ? "ring-2 ring-warning" : ""}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-surface-2 text-xs font-bold text-text-primary">
            {idx + 1}
          </span>
          <span className={`chip text-[10px] ${question.difficulty === "easy" ? "text-green-600" : question.difficulty === "hard" ? "text-red-500" : "text-amber-500"}`}>
            {question.difficulty} &middot; {question.points} pt{question.points > 1 ? "s" : ""}
          </span>
        </div>
        <button
          onClick={() => setMarked((m) => { const n = new Set(m); n.has(question.id) ? n.delete(question.id) : n.add(question.id); return n; })}
          className={`btn-ghost p-1.5 ${marked.has(question.id) ? "text-warning" : "text-text-tertiary"}`}
          title="Mark for review"
        >
          <Icon name="flag" className="h-4 w-4" />
        </button>
      </div>
      <p className="text-sm font-medium text-text-primary leading-relaxed whitespace-pre-line">{question.text}</p>

      {(question.type === "multiple-choice" || question.type === "true-false") && question.options && (
        <div className="space-y-2">
          {question.options.map((opt, oi) => (
            <button
              key={oi}
              onClick={() => !submitted && setAnswers((a) => ({ ...a, [question.id]: opt }))}
              className={`w-full text-left rounded-lg border px-4 py-3 text-sm transition-colors ${
                answers[question.id] === opt
                  ? submitted
                    ? opt === question.correctAnswer ? "border-green-500 bg-green-500/10 text-green-700" : "border-red-500 bg-red-500/10 text-red-700"
                    : "border-accent bg-accent-subtle text-accent-text font-medium"
                  : submitted && opt === question.correctAnswer
                    ? "border-green-500 bg-green-500/5"
                    : "border-border hover:border-border-strong hover:bg-surface-2"
              }`}
            >
              <span className="font-medium mr-2">{String.fromCharCode(65 + oi)}.</span>
              {opt}
            </button>
          ))}
        </div>
      )}

      {(question.type === "fill-blank" || question.type === "short-answer" || question.type === "vocabulary" || question.type === "explain") && (
        <textarea
          value={answers[question.id] || ""}
          onChange={(e) => !submitted && setAnswers((a) => ({ ...a, [question.id]: e.target.value }))}
          placeholder={question.type === "fill-blank" ? "Type your answer..." : "Write your answer here..."}
          className="input-field min-h-[80px] resize-none"
          readOnly={submitted}
        />
      )}

      {submitted && (
        <div className={`rounded-lg p-3 text-sm ${
          (answers[question.id] || "") === question.correctAnswer || (question.type !== "multiple-choice" && question.type !== "true-false" && (answers[question.id] || "").length > 10)
            ? "bg-green-500/10 text-green-700"
            : "bg-red-500/10 text-red-700"
        }`}>
          <p className="font-medium mb-1">
            {(answers[question.id] || "") === question.correctAnswer || (question.type !== "multiple-choice" && question.type !== "true-false" && (answers[question.id] || "").length > 10) ? "Correct!" : "Incorrect"}
          </p>
          <p className="text-xs opacity-80">{question.explanation}</p>
        </div>
      )}
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      {/* Test header */}
      <div className="card px-5 py-4 flex items-center justify-between">
        <div>
          <h2 className="font-semibold text-text-primary">{test.title}</h2>
          <p className="text-xs text-text-secondary">{test.questions.length} questions &middot; {test.type}</p>
        </div>
        <div className="flex items-center gap-3">
          {test.settings.timeLimit && !submitted && (
            <div className={`chip ${timeLeft < 60 ? "text-red-500 border-red-500/30" : ""}`}>
              <Icon name="clock" className="h-3.5 w-3.5" />
              {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, "0")}
            </div>
          )}
          <div className="text-sm text-text-secondary">
            {Object.keys(answers).length} / {test.questions.length} answered
          </div>
        </div>
      </div>

      {/* Question navigation (for one-at-a-time) */}
      {oneAtATime && (
        <div className="flex flex-wrap gap-1.5">
          {test.questions.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentQ(i)}
              className={`h-8 w-8 rounded-lg text-xs font-semibold transition-colors ${
                i === currentQ
                  ? "bg-accent text-text-inverse"
                  : answers[test.questions[i].id]
                    ? "bg-accent-subtle text-accent-text"
                    : marked.has(test.questions[i].id)
                      ? "bg-warning/10 text-warning border border-warning/30"
                      : "bg-surface-2 text-text-secondary hover:bg-surface-3"
              }`}
            >
              {i + 1}
            </button>
          ))}
        </div>
      )}

      {/* Questions */}
      {oneAtATime ? (
        <div>
          {renderQuestion(q, currentQ)}
          <div className="flex justify-between mt-4">
            <button
              onClick={() => setCurrentQ(Math.max(0, currentQ - 1))}
              disabled={currentQ === 0}
              className="btn-secondary"
            >
              <Icon name="chevron-left" className="h-4 w-4" /> Previous
            </button>
            {currentQ < test.questions.length - 1 ? (
              <button onClick={() => setCurrentQ(currentQ + 1)} className="btn-primary">
                Next <Icon name="chevron-right" className="h-4 w-4" />
              </button>
            ) : !submitted ? (
              <button onClick={handleSubmit} className="btn-primary bg-green-600 hover:bg-green-700">
                <Icon name="check" className="h-4 w-4" /> Submit Test
              </button>
            ) : null}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {test.questions.map((question, i) => renderQuestion(question, i))}
          {!submitted && (
            <button onClick={handleSubmit} className="btn-primary w-full py-3">
              <Icon name="check" className="h-4 w-4" /> Submit Test
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function TestResultsView({ test, attempt, onRetake, onBack }: { test: Test; attempt: TestAttempt; onRetake: () => void; onBack: () => void }) {
  const correct = attempt.questionResults.filter((r) => r.correct).length;
  const incorrect = attempt.questionResults.filter((r) => !r.correct).length;
  const passed = attempt.percentage >= test.settings.passingGrade;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="card p-6 text-center space-y-4">
        <div className={`flex h-20 w-20 mx-auto items-center justify-center rounded-full ${passed ? "bg-green-500/10" : "bg-red-500/10"}`}>
          <span className={`text-3xl font-bold ${passed ? "text-green-600" : "text-red-500"}`}>{attempt.percentage}%</span>
        </div>
        <div>
          <h2 className="text-xl font-semibold text-text-primary">{passed ? "Congratulations!" : "Keep Practicing"}</h2>
          <p className="text-sm text-text-secondary mt-1">
            {passed ? "You passed the test!" : `You need ${test.settings.passingGrade}% to pass.`}
          </p>
        </div>
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: "Score", value: `${attempt.score}/${attempt.totalPoints}` },
            { label: "Correct", value: String(correct) },
            { label: "Incorrect", value: String(incorrect) },
            { label: "Time", value: `${Math.floor(attempt.timeTaken / 60)}m ${attempt.timeTaken % 60}s` },
          ].map((s) => (
            <div key={s.label} className="text-center">
              <div className="text-lg font-bold text-text-primary">{s.value}</div>
              <div className="text-[11px] text-text-tertiary">{s.label}</div>
            </div>
          ))}
        </div>
        <div className="flex justify-center gap-3 pt-2">
          <button onClick={onBack} className="btn-secondary">
            <Icon name="arrow-left" className="h-4 w-4" /> Back to Tests
          </button>
          <button onClick={onRetake} className="btn-primary">
            <Icon name="refresh" className="h-4 w-4" /> Retake Test
          </button>
        </div>
      </div>

      <h3 className="text-base font-semibold text-text-primary">Question Review</h3>
      <div className="space-y-3">
        {test.questions.map((q, i) => {
          const result = attempt.questionResults.find((r) => r.questionId === q.id);
          return (
            <div key={q.id} className={`card p-4 border-l-4 ${result?.correct ? "border-l-green-500" : "border-l-red-500"}`}>
              <div className="flex items-start gap-2 mb-2">
                <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${result?.correct ? "bg-green-500/10 text-green-600" : "bg-red-500/10 text-red-500"}`}>
                  {result?.correct ? <Icon name="check" className="h-3.5 w-3.5" /> : <Icon name="x" className="h-3.5 w-3.5" />}
                </span>
                <p className="text-sm text-text-primary font-medium">{q.text}</p>
              </div>
              <div className="ml-8 space-y-1">
                <p className="text-xs text-text-secondary"><strong>Your answer:</strong> {(result?.answer as string) || "No answer"}</p>
                <p className="text-xs text-green-600"><strong>Correct answer:</strong> {q.correctAnswer as string}</p>
                <p className="text-xs text-text-tertiary mt-1">{q.explanation}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function TestCenterPage() {
  const tests = useAppStore((s) => s.tests);
  const testAttempts = useAppStore((s) => s.testAttempts);
  const addTest = useAppStore((s) => s.addTest);
  const addTestAttempt = useAppStore((s) => s.addTestAttempt);
  const deleteTest = useAppStore((s) => s.deleteTest);
  const subjects = useAppStore((s) => s.subjects);

  const [view, setView] = useState<"list" | "create" | "take" | "results">("list");
  const [activeTestId, setActiveTestId] = useState<string | null>(null);
  const [activeAttemptId, setActiveAttemptId] = useState<string | null>(null);

  // Creation wizard state
  const [wizStep, setWizStep] = useState(0);
  const [wizTopic, setWizTopic] = useState("");
  const [wizType, setWizType] = useState("quiz");
  const [wizCount, setWizCount] = useState(10);
  const [wizDifficulty, setWizDifficulty] = useState("mixed");
  const [wizQTypes, setWizQTypes] = useState<QuestionType[]>(["multiple-choice", "true-false"]);
  const [wizTimed, setWizTimed] = useState(false);
  const [wizTimeLimit, setWizTimeLimit] = useState(30);
  const [wizShuffle, setWizShuffle] = useState(true);
  const [wizOneAtATime, setWizOneAtATime] = useState(true);
  const [generating, setGenerating] = useState(false);

  const handleGenerate = async () => {
    setGenerating(true);
    await new Promise((r) => setTimeout(r, 1500));

    const questions = generateQuestions(wizTopic || "General Knowledge", wizCount, wizQTypes, wizDifficulty);
    const test = addTest({
      title: `${wizTopic || "General Knowledge"} — ${TEST_TYPES.find((t) => t.id === wizType)?.label ?? "Test"}`,
      description: `${wizCount} questions, ${wizDifficulty} difficulty`,
      type: wizType as any,
      questions,
      settings: {
        timeLimit: wizTimed ? wizTimeLimit : undefined,
        shuffleQuestions: wizShuffle,
        shuffleOptions: wizShuffle,
        showOneAtATime: wizOneAtATime,
        showExplanationsAfterEach: false,
        allowRetakes: true,
        enableHints: false,
        passingGrade: 70,
      },
    });
    setActiveTestId(test.id);
    setGenerating(false);
    setView("take");
  };

  const activeTest = tests.find((t) => t.id === activeTestId);
  const activeAttempt = testAttempts.find((a) => a.id === activeAttemptId);

  if (view === "take" && activeTest) {
    return (
      <TestTakingView
        test={activeTest}
        onFinish={(attempt) => {
          const a = addTestAttempt(attempt);
          setActiveAttemptId(a.id);
          setView("results");
        }}
      />
    );
  }

  if (view === "results" && activeTest && activeAttempt) {
    return (
      <TestResultsView
        test={activeTest}
        attempt={activeAttempt}
        onRetake={() => setView("take")}
        onBack={() => { setView("list"); setActiveTestId(null); setActiveAttemptId(null); }}
      />
    );
  }

  if (view === "create") {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <button onClick={() => { setView("list"); setWizStep(0); }} className="btn-ghost p-2">
            <Icon name="arrow-left" className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-xl font-semibold text-text-primary">Create New Test</h1>
            <p className="text-sm text-text-secondary">Step {wizStep + 1} of 4</p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-1.5 rounded-full bg-surface-2">
          <div className="h-full rounded-full bg-accent transition-all" style={{ width: `${((wizStep + 1) / 4) * 100}%` }} />
        </div>

        {wizStep === 0 && (
          <div className="space-y-4 animate-fade-up">
            <h2 className="text-base font-semibold text-text-primary">What topic do you want to test?</h2>
            <input
              type="text"
              value={wizTopic}
              onChange={(e) => setWizTopic(e.target.value)}
              placeholder="e.g., Biology Chapter 5, World War II, Algebra"
              className="input-field"
              autoFocus
            />
            <h2 className="text-base font-semibold text-text-primary mt-6">Test Type</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {TEST_TYPES.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setWizType(t.id)}
                  className={`card card-interactive p-3 text-left ${wizType === t.id ? "ring-2 ring-accent border-accent" : ""}`}
                >
                  <Icon name={t.icon} className="h-5 w-5 text-accent mb-1.5" />
                  <div className="text-sm font-medium text-text-primary">{t.label}</div>
                </button>
              ))}
            </div>
            <button onClick={() => setWizStep(1)} className="btn-primary w-full">
              Next <Icon name="chevron-right" className="h-4 w-4" />
            </button>
          </div>
        )}

        {wizStep === 1 && (
          <div className="space-y-4 animate-fade-up">
            <h2 className="text-base font-semibold text-text-primary">How many questions?</h2>
            <div className="grid grid-cols-4 gap-2">
              {[5, 10, 15, 20, 25, 30, 40, 50].map((n) => (
                <button key={n} onClick={() => setWizCount(n)} className={`card card-interactive py-3 text-center text-sm font-semibold ${wizCount === n ? "ring-2 ring-accent border-accent" : ""}`}>
                  {n}
                </button>
              ))}
            </div>
            <h2 className="text-base font-semibold text-text-primary mt-6">Difficulty</h2>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: "easy", label: "Easy", color: "text-green-600" },
                { id: "medium", label: "Medium", color: "text-amber-500" },
                { id: "hard", label: "Hard", color: "text-red-500" },
                { id: "mixed", label: "Mixed", color: "text-purple-500" },
              ].map((d) => (
                <button key={d.id} onClick={() => setWizDifficulty(d.id)} className={`card card-interactive py-3 text-center text-sm font-semibold ${d.color} ${wizDifficulty === d.id ? "ring-2 ring-accent border-accent" : ""}`}>
                  {d.label}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <button onClick={() => setWizStep(0)} className="btn-secondary flex-1">Back</button>
              <button onClick={() => setWizStep(2)} className="btn-primary flex-1">Next</button>
            </div>
          </div>
        )}

        {wizStep === 2 && (
          <div className="space-y-4 animate-fade-up">
            <h2 className="text-base font-semibold text-text-primary">Question Types</h2>
            <div className="grid grid-cols-2 gap-2">
              {Q_TYPES.map((qt) => (
                <button
                  key={qt.id}
                  onClick={() => setWizQTypes((prev) => prev.includes(qt.id) ? prev.filter((t) => t !== qt.id) : [...prev, qt.id])}
                  className={`card card-interactive p-3 text-left text-sm ${wizQTypes.includes(qt.id) ? "ring-2 ring-accent border-accent" : ""}`}
                >
                  <Icon name={wizQTypes.includes(qt.id) ? "check" : "plus"} className="h-4 w-4 text-accent mb-1" />
                  {qt.label}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <button onClick={() => setWizStep(1)} className="btn-secondary flex-1">Back</button>
              <button onClick={() => setWizStep(3)} disabled={wizQTypes.length === 0} className="btn-primary flex-1">Next</button>
            </div>
          </div>
        )}

        {wizStep === 3 && (
          <div className="space-y-4 animate-fade-up">
            <h2 className="text-base font-semibold text-text-primary">Test Settings</h2>
            <div className="space-y-3">
              <label className="card p-3 flex items-center justify-between cursor-pointer">
                <div>
                  <div className="text-sm font-medium text-text-primary">Timed Test</div>
                  <div className="text-xs text-text-tertiary">Set a time limit for the test</div>
                </div>
                <input type="checkbox" checked={wizTimed} onChange={(e) => setWizTimed(e.target.checked)} className="h-5 w-5 rounded accent-[var(--accent)]" />
              </label>
              {wizTimed && (
                <div className="pl-4">
                  <label className="text-xs text-text-secondary">Time limit (minutes)</label>
                  <input type="number" value={wizTimeLimit} onChange={(e) => setWizTimeLimit(Number(e.target.value))} className="input-field w-24 mt-1" min={5} max={180} />
                </div>
              )}
              <label className="card p-3 flex items-center justify-between cursor-pointer">
                <div>
                  <div className="text-sm font-medium text-text-primary">Shuffle Questions</div>
                  <div className="text-xs text-text-tertiary">Randomize question order</div>
                </div>
                <input type="checkbox" checked={wizShuffle} onChange={(e) => setWizShuffle(e.target.checked)} className="h-5 w-5 rounded accent-[var(--accent)]" />
              </label>
              <label className="card p-3 flex items-center justify-between cursor-pointer">
                <div>
                  <div className="text-sm font-medium text-text-primary">One Question at a Time</div>
                  <div className="text-xs text-text-tertiary">Show questions one by one</div>
                </div>
                <input type="checkbox" checked={wizOneAtATime} onChange={(e) => setWizOneAtATime(e.target.checked)} className="h-5 w-5 rounded accent-[var(--accent)]" />
              </label>
            </div>

            <div className="card p-4 bg-accent-subtle border-accent/20">
              <h3 className="text-sm font-semibold text-accent-text mb-2">Test Summary</h3>
              <div className="grid grid-cols-2 gap-2 text-xs text-text-secondary">
                <div>Topic: <strong className="text-text-primary">{wizTopic || "General Knowledge"}</strong></div>
                <div>Type: <strong className="text-text-primary">{TEST_TYPES.find((t) => t.id === wizType)?.label}</strong></div>
                <div>Questions: <strong className="text-text-primary">{wizCount}</strong></div>
                <div>Difficulty: <strong className="text-text-primary capitalize">{wizDifficulty}</strong></div>
                <div>Question types: <strong className="text-text-primary">{wizQTypes.length}</strong></div>
                {wizTimed && <div>Time limit: <strong className="text-text-primary">{wizTimeLimit} min</strong></div>}
              </div>
            </div>

            <div className="flex gap-2">
              <button onClick={() => setWizStep(2)} className="btn-secondary flex-1">Back</button>
              <button onClick={handleGenerate} disabled={generating} className="btn-primary flex-1">
                {generating ? (
                  <><Icon name="loader" className="h-4 w-4 animate-spin" /> Generating...</>
                ) : (
                  <><Icon name="sparkles" className="h-4 w-4" /> Generate Test</>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-text-primary">Test Center</h1>
          <p className="text-sm text-text-secondary mt-0.5">Create, take, and review practice tests and examinations</p>
        </div>
        <button onClick={() => { setView("create"); setWizStep(0); setWizTopic(""); }} className="btn-primary">
          <Icon name="plus" className="h-4 w-4" /> Create Test
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Tests Created", value: String(tests.length), icon: "file-text" as IconName },
          { label: "Attempts", value: String(testAttempts.length), icon: "check" as IconName },
          { label: "Avg Score", value: testAttempts.length > 0 ? `${Math.round(testAttempts.reduce((s, a) => s + a.percentage, 0) / testAttempts.length)}%` : "—", icon: "target" as IconName },
          { label: "Questions Done", value: String(testAttempts.reduce((s, a) => s + a.questionResults.length, 0)), icon: "hash" as IconName },
        ].map((s) => (
          <div key={s.label} className="card px-4 py-3 text-center">
            <Icon name={s.icon} className="h-5 w-5 text-accent mx-auto mb-1" />
            <div className="text-lg font-bold text-text-primary">{s.value}</div>
            <div className="text-[11px] text-text-tertiary">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Test List */}
      {tests.length === 0 ? (
        <div className="card flex flex-col items-center gap-4 py-12 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-accent-subtle">
            <Icon name="test-tube" className="h-7 w-7 text-accent" />
          </div>
          <h2 className="text-lg font-semibold text-text-primary">No tests yet</h2>
          <p className="text-sm text-text-secondary max-w-sm">Create your first practice test from any topic or uploaded material.</p>
          <button onClick={() => { setView("create"); setWizStep(0); }} className="btn-primary">
            <Icon name="plus" className="h-4 w-4" /> Create Your First Test
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {tests.map((test) => {
            const attempts = testAttempts.filter((a) => a.testId === test.id);
            const bestScore = attempts.length > 0 ? Math.max(...attempts.map((a) => a.percentage)) : null;
            return (
              <div key={test.id} className="card card-interactive p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent-subtle shrink-0">
                    <Icon name="test-tube" className="h-5 w-5 text-accent" />
                  </div>
                  <button onClick={() => deleteTest(test.id)} className="btn-ghost p-1.5 text-text-tertiary opacity-0 group-hover:opacity-100">
                    <Icon name="trash" className="h-4 w-4" />
                  </button>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-text-primary line-clamp-2">{test.title}</h3>
                  <p className="text-xs text-text-tertiary mt-0.5">{test.questions.length} questions &middot; {test.type}</p>
                </div>
                <div className="flex items-center justify-between">
                  {bestScore !== null ? (
                    <span className={`chip text-xs ${bestScore >= 70 ? "text-green-600" : "text-red-500"}`}>
                      Best: {bestScore}%
                    </span>
                  ) : (
                    <span className="chip text-xs">Not taken</span>
                  )}
                  <button onClick={() => { setActiveTestId(test.id); setView("take"); }} className="btn-primary py-1.5 px-3 text-xs">
                    {attempts.length > 0 ? "Retake" : "Start"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
