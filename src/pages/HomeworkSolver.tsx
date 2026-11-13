import { useState, useRef, useCallback } from "react";
import { Icons } from "../components/Icons";
import { useStore } from "../state/store";

interface SolutionStep {
  stepNumber: number;
  title: string;
  content: string;
  explanation: string;
}

interface Solution {
  id: string;
  question: string;
  subject: string;
  concept: string;
  steps: SolutionStep[];
  finalAnswer: string;
  commonMistakes: string[];
  timestamp: number;
  imagePreview?: string;
}

const DEMO_SOLUTIONS: Record<string, Omit<Solution, "id" | "question" | "timestamp" | "imagePreview">> = {
  quadratic: {
    subject: "Mathematics",
    concept: "Quadratic Equations",
    steps: [
      {
        stepNumber: 1,
        title: "Identify the equation form",
        content: "The equation is in standard form: ax² + bx + c = 0, where a = 1, b = -5, c = 6.",
        explanation: "Recognizing the form lets us choose the best solving method.",
      },
      {
        stepNumber: 2,
        title: "Apply the quadratic formula",
        content: "x = (-b ± √(b² - 4ac)) / 2a\nx = (5 ± √(25 - 24)) / 2\nx = (5 ± √1) / 2",
        explanation: "We substitute a, b and c into the formula. The discriminant (b² - 4ac) tells us how many real solutions exist.",
      },
      {
        stepNumber: 3,
        title: "Simplify the two solutions",
        content: "x = (5 + 1) / 2 = 3\nx = (5 - 1) / 2 = 2",
        explanation: "The ± gives us two branches—one with addition, one with subtraction.",
      },
      {
        stepNumber: 4,
        title: "Verify by substitution",
        content: "For x = 3: (3)² - 5(3) + 6 = 9 - 15 + 6 = 0 ✓\nFor x = 2: (2)² - 5(2) + 6 = 4 - 10 + 6 = 0 ✓",
        explanation: "Always check your answers by plugging them back into the original equation.",
      },
    ],
    finalAnswer: "x = 3  and  x = 2",
    commonMistakes: [
      "Forgetting the ± sign, which means missing the second solution.",
      "Sign errors when substituting negative values of b.",
      "Not simplifying the square root of the discriminant before dividing.",
    ],
  },
  photosynthesis: {
    subject: "Science",
    concept: "Photosynthesis",
    steps: [
      {
        stepNumber: 1,
        title: "Define photosynthesis",
        content: "Photosynthesis is the process by which green plants, algae, and some bacteria convert light energy into chemical energy stored in glucose.",
        explanation: "Understanding the big picture helps connect each detail that follows.",
      },
      {
        stepNumber: 2,
        title: "Write the overall equation",
        content: "6CO₂ + 6H₂O + light energy → C₆H₁₂O₆ + 6O₂",
        explanation: "Carbon dioxide and water are the reactants; glucose and oxygen are the products.",
      },
      {
        stepNumber: 3,
        title: "Light-dependent reactions",
        content: "These occur in the thylakoid membranes of chloroplasts. Chlorophyll absorbs light to split water molecules, releasing O₂, and producing ATP and NADPH.",
        explanation: "Light energy is converted into chemical energy carriers (ATP, NADPH) that power the next stage.",
      },
      {
        stepNumber: 4,
        title: "Calvin Cycle (light-independent reactions)",
        content: "Takes place in the stroma. CO₂ is fixed by the enzyme RuBisCO and, using ATP and NADPH from the light reactions, is converted into G3P, which is used to build glucose.",
        explanation: "This cycle does not need light directly, but it depends on the products of the light reactions.",
      },
      {
        stepNumber: 5,
        title: "Importance of photosynthesis",
        content: "Produces oxygen for aerobic organisms, forms the base of most food chains, and removes CO₂ from the atmosphere.",
        explanation: "Photosynthesis connects to ecology, climate, and cellular respiration.",
      },
    ],
    finalAnswer:
      "Photosynthesis converts light energy, CO₂, and H₂O into glucose (C₆H₁₂O₆) and O₂ through light-dependent reactions in the thylakoids and the Calvin Cycle in the stroma.",
    commonMistakes: [
      "Confusing photosynthesis with cellular respiration (they are essentially reverse processes).",
      "Saying photosynthesis happens only in leaves—it occurs in any cell with chloroplasts.",
      "Thinking the Calvin Cycle happens at night. It is light-independent, not dark-exclusive.",
    ],
  },
  derivative: {
    subject: "Mathematics",
    concept: "Derivatives & Differentiation",
    steps: [
      {
        stepNumber: 1,
        title: "Identify the function",
        content: "f(x) = 3x³ + 2x² - 5x + 7",
        explanation: "We need to find f′(x), the derivative with respect to x.",
      },
      {
        stepNumber: 2,
        title: "Apply the power rule term by term",
        content:
          "Power rule: d/dx [xⁿ] = n·xⁿ⁻¹\n\nd/dx [3x³] = 9x²\nd/dx [2x²] = 4x\nd/dx [-5x] = -5\nd/dx [7] = 0",
        explanation: "Multiply the coefficient by the exponent, then reduce the exponent by 1. Constants differentiate to 0.",
      },
      {
        stepNumber: 3,
        title: "Combine the results",
        content: "f′(x) = 9x² + 4x - 5",
        explanation: "Sum the derivatives of each term to get the full derivative.",
      },
    ],
    finalAnswer: "f′(x) = 9x² + 4x - 5",
    commonMistakes: [
      "Forgetting to reduce the exponent by 1 after multiplying.",
      "Leaving the constant term (+7) in the derivative.",
      "Sign errors when the coefficient is negative.",
    ],
  },
};

function matchDemo(query: string): Omit<Solution, "id" | "question" | "timestamp" | "imagePreview"> | null {
  const q = query.toLowerCase();
  if (/quadratic|x².*=\s*0|ax2|solve.*equation/.test(q)) return DEMO_SOLUTIONS.quadratic;
  if (/photosynth|chloro|plant.*energy|light.*reaction/.test(q)) return DEMO_SOLUTIONS.photosynthesis;
  if (/deriv|differentiat|d\/dx|f'\(x\)|power rule/.test(q)) return DEMO_SOLUTIONS.derivative;
  return null;
}

function buildGeneric(question: string): Omit<Solution, "id" | "question" | "timestamp" | "imagePreview"> {
  return {
    subject: "General",
    concept: "Problem Solving",
    steps: [
      {
        stepNumber: 1,
        title: "Understand the question",
        content: `We need to analyze: "${question.length > 120 ? question.slice(0, 120) + "…" : question}"`,
        explanation: "Reading the question carefully ensures we address exactly what is asked.",
      },
      {
        stepNumber: 2,
        title: "Identify key information",
        content: "Extract the important facts, values, and relationships from the problem statement.",
        explanation: "Separating given information from what we need to find clarifies the path to a solution.",
      },
      {
        stepNumber: 3,
        title: "Apply the relevant method",
        content: "Using the appropriate technique for this type of problem, we work through the logic step by step.",
        explanation: "Choosing the right method saves time and reduces errors.",
      },
      {
        stepNumber: 4,
        title: "State the result",
        content: "After completing the calculations and reasoning, we arrive at the answer.",
        explanation: "Always re-read the question to make sure the answer matches what was asked.",
      },
    ],
    finalAnswer: "To get a complete, specific solution, connect an AI service in Settings → AI Configuration. The step-by-step framework above shows how the solver structures every answer.",
    commonMistakes: [
      "Rushing to solve before fully understanding the question.",
      "Skipping the verification step at the end.",
    ],
  };
}

function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export function HomeworkSolverPage() {
  const subjects = useStore((s) => s.subjects);
  const [question, setQuestion] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [solving, setSolving] = useState(false);
  const [solutions, setSolutions] = useState<Solution[]>([]);
  const [activeSolution, setActiveSolution] = useState<Solution | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);

  const fileRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const pdfRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
    if (file.type === "application/pdf") {
      setQuestion((prev) => prev || `[Uploaded PDF: ${file.name}]`);
    }
    e.target.value = "";
  }, []);

  const solve = useCallback(() => {
    const q = question.trim();
    if (!q && !imagePreview) return;
    setSolving(true);

    setTimeout(() => {
      const demo = matchDemo(q);
      const data = demo || buildGeneric(q);
      const sol: Solution = {
        ...data,
        id: uid(),
        question: q || "[Image question]",
        timestamp: Date.now(),
        imagePreview: imagePreview || undefined,
      };
      if (selectedSubject) {
        const subj = subjects.find((s) => s.id === selectedSubject);
        if (subj) sol.subject = subj.name;
      }
      setSolutions((prev) => [sol, ...prev]);
      setActiveSolution(sol);
      setSolving(false);
    }, 1500);
  }, [question, imagePreview, selectedSubject, subjects]);

  const actionChips = [
    { label: "Explain Differently", icon: Icons.sparkles },
    { label: "Make Easier", icon: Icons.lightbulb },
    { label: "Another Method", icon: Icons.arrowRight },
    { label: "Similar Question", icon: Icons.plus },
    { label: "Save to Notes", icon: Icons.notes },
    { label: "Create Flashcards", icon: Icons.flashcards },
  ];

  return (
    <div className="flex h-[calc(100dvh-3.5rem)] overflow-hidden">
      {/* Main area */}
      <div className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold font-display text-ink-900 dark:text-white">Solve Homework</h1>
          <p className="text-sm text-ink-500 dark:text-gray-400 mt-1">Upload a photo, paste text, or type your question</p>
        </div>

        {/* Input card */}
        <div className="card p-5 space-y-4">
          <textarea
            className="input min-h-[100px] resize-none"
            placeholder="Type or paste your question here..."
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) solve();
            }}
          />

          {imagePreview && (
            <div className="relative inline-block">
              <img src={imagePreview} alt="Uploaded" className="max-h-48 rounded-lg border border-warm-200 dark:border-dark-border" />
              <button
                onClick={() => setImagePreview(null)}
                className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center shadow-md"
              >
                <Icons.x size={14} />
              </button>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-3">
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
            <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFile} />
            <input ref={pdfRef} type="file" accept="application/pdf" className="hidden" onChange={handleFile} />

            <button onClick={() => fileRef.current?.click()} className="btn-secondary text-xs py-2 px-3">
              <Icons.image size={15} /> Upload Image
            </button>
            <button onClick={() => cameraRef.current?.click()} className="btn-secondary text-xs py-2 px-3">
              <Icons.camera size={15} /> Take Photo
            </button>
            <button onClick={() => pdfRef.current?.click()} className="btn-secondary text-xs py-2 px-3">
              <Icons.file size={15} /> Upload PDF
            </button>

            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="input py-2 text-xs w-auto min-w-[140px]"
            >
              <option value="">Subject (auto)</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>

            <button
              onClick={solve}
              disabled={solving || (!question.trim() && !imagePreview)}
              className="btn-primary ml-auto text-sm px-6"
            >
              {solving ? (
                <>
                  <Icons.loader size={16} /> Solving...
                </>
              ) : (
                <>
                  <Icons.sparkles size={16} /> Solve
                </>
              )}
            </button>
          </div>
        </div>

        {/* Loading shimmer */}
        {solving && (
          <div className="card p-6 space-y-4 animate-fade-up">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="h-4 w-1/3 rounded bg-warm-200 dark:bg-dark-500 animate-shimmer bg-[length:200%_100%] bg-gradient-to-r from-warm-200 via-warm-100 to-warm-200 dark:from-dark-500 dark:via-dark-600 dark:to-dark-500" />
                <div className="h-3 w-full rounded bg-warm-200 dark:bg-dark-500 animate-shimmer bg-[length:200%_100%] bg-gradient-to-r from-warm-200 via-warm-100 to-warm-200 dark:from-dark-500 dark:via-dark-600 dark:to-dark-500" />
                <div className="h-3 w-2/3 rounded bg-warm-200 dark:bg-dark-500 animate-shimmer bg-[length:200%_100%] bg-gradient-to-r from-warm-200 via-warm-100 to-warm-200 dark:from-dark-500 dark:via-dark-600 dark:to-dark-500" />
              </div>
            ))}
          </div>
        )}

        {/* Solution display */}
        {activeSolution && !solving && (
          <div className="card p-6 space-y-6 animate-fade-up">
            {/* Question echo */}
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-brand-50 dark:bg-brand-500/15 flex items-center justify-center shrink-0 mt-0.5">
                <Icons.quiz size={16} className="text-brand-600 dark:text-brand-400" />
              </div>
              <div>
                <p className="text-xs font-semibold text-ink-400 dark:text-gray-500 uppercase tracking-wide mb-1">Your Question</p>
                <p className="text-sm text-ink-800 dark:text-gray-200">{activeSolution.question}</p>
                {activeSolution.imagePreview && (
                  <img src={activeSolution.imagePreview} alt="" className="mt-2 max-h-32 rounded-lg border border-warm-200 dark:border-dark-border" />
                )}
              </div>
            </div>

            {/* Concept tag */}
            <div className="flex items-center gap-2">
              <span className="chip chip-active">
                <Icons.lightbulb size={12} /> {activeSolution.concept}
              </span>
              <span className="chip">{activeSolution.subject}</span>
            </div>

            {/* Steps */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-ink-700 dark:text-gray-300 uppercase tracking-wide">Step-by-step Solution</h3>
              {activeSolution.steps.map((step) => (
                <div key={step.stepNumber} className="flex gap-3">
                  <div className="w-7 h-7 rounded-full bg-brand-500 text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                    {step.stepNumber}
                  </div>
                  <div className="flex-1 space-y-1.5">
                    <p className="text-sm font-semibold text-ink-800 dark:text-gray-200">{step.title}</p>
                    <div className="text-sm text-ink-700 dark:text-gray-300 whitespace-pre-wrap font-mono bg-warm-50 dark:bg-dark-700 rounded-lg p-3 border border-warm-200 dark:border-dark-border leading-relaxed">
                      {step.content}
                    </div>
                    <p className="text-xs text-ink-500 dark:text-gray-400 italic pl-1">{step.explanation}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Final answer */}
            <div className="rounded-xl bg-gradient-to-r from-brand-500 to-accent-500 p-[1px]">
              <div className="rounded-[11px] bg-white dark:bg-dark-card p-4">
                <p className="text-xs font-bold text-brand-600 dark:text-brand-400 uppercase tracking-wide mb-1">Final Answer</p>
                <p className="text-base font-semibold text-ink-900 dark:text-white font-mono">{activeSolution.finalAnswer}</p>
              </div>
            </div>

            {/* Common mistakes */}
            {activeSolution.commonMistakes.length > 0 && (
              <div className="rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 p-4 space-y-2">
                <p className="text-xs font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wide flex items-center gap-1.5">
                  <Icons.zap size={13} /> Common Mistakes to Avoid
                </p>
                <ul className="space-y-1">
                  {activeSolution.commonMistakes.map((m, i) => (
                    <li key={i} className="text-sm text-amber-800 dark:text-amber-300 flex items-start gap-2">
                      <span className="text-amber-500 mt-0.5">&bull;</span>
                      {m}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Action chips */}
            <div className="flex flex-wrap gap-2 pt-2">
              {actionChips.map((chip) => (
                <button key={chip.label} className="chip card-hover cursor-pointer">
                  <chip.icon size={13} /> {chip.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Empty state */}
        {!activeSolution && !solving && (
          <div className="text-center py-16 space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-brand-50 dark:bg-brand-500/15 flex items-center justify-center mx-auto">
              <Icons.homework size={28} className="text-brand-500" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-ink-800 dark:text-white">Ready to solve</h3>
              <p className="text-sm text-ink-400 dark:text-gray-500 mt-1 max-w-md mx-auto">
                Type a question, upload a photo, or scan your worksheet. The AI will explain every step.
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-2 pt-2">
              {["Solve x² - 5x + 6 = 0", "Explain photosynthesis", "Find the derivative of 3x³ + 2x² - 5x + 7"].map((q) => (
                <button
                  key={q}
                  onClick={() => { setQuestion(q); }}
                  className="chip card-hover cursor-pointer"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* History toggle (mobile) */}
        {solutions.length > 0 && (
          <div className="lg:hidden">
            <button
              onClick={() => setHistoryOpen(!historyOpen)}
              className="btn-ghost w-full justify-between text-sm"
            >
              <span className="flex items-center gap-2"><Icons.clock size={15} /> Solution History ({solutions.length})</span>
              <Icons.chevronDown size={16} className={`transition-transform ${historyOpen ? "rotate-180" : ""}`} />
            </button>
            {historyOpen && (
              <div className="mt-2 space-y-2 animate-fade-in">
                {solutions.map((sol) => (
                  <button
                    key={sol.id}
                    onClick={() => setActiveSolution(sol)}
                    className={`card card-hover w-full text-left p-3 ${activeSolution?.id === sol.id ? "ring-2 ring-brand-400" : ""}`}
                  >
                    <p className="text-sm font-medium text-ink-800 dark:text-gray-200 truncate">{sol.question}</p>
                    <p className="text-xs text-ink-400 dark:text-gray-500 mt-0.5">{sol.subject} &middot; {sol.concept}</p>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Desktop history sidebar */}
      {solutions.length > 0 && (
        <aside className="hidden lg:flex flex-col w-72 border-l border-warm-200 dark:border-dark-border bg-warm-50 dark:bg-dark-800 overflow-y-auto">
          <div className="p-4 border-b border-warm-200 dark:border-dark-border">
            <h3 className="text-sm font-semibold text-ink-700 dark:text-gray-300 flex items-center gap-2">
              <Icons.clock size={15} /> History
            </h3>
          </div>
          <div className="p-3 space-y-2 flex-1">
            {solutions.map((sol) => (
              <button
                key={sol.id}
                onClick={() => setActiveSolution(sol)}
                className={`w-full text-left rounded-lg p-3 transition-all ${
                  activeSolution?.id === sol.id
                    ? "bg-brand-50 dark:bg-brand-500/15 border border-brand-200 dark:border-brand-500/30"
                    : "hover:bg-white dark:hover:bg-dark-600 border border-transparent"
                }`}
              >
                <p className="text-sm font-medium text-ink-800 dark:text-gray-200 truncate">{sol.question}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[10px] font-medium text-ink-400 dark:text-gray-500">{sol.subject}</span>
                  <span className="text-ink-300 dark:text-gray-600">&middot;</span>
                  <span className="text-[10px] text-ink-400 dark:text-gray-500">
                    {new Date(sol.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </aside>
      )}
    </div>
  );
}
