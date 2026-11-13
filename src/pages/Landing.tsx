import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Icons } from "../components/Icons";
import { useStore } from "../state/store";

const GRADES = [
  "Middle School",
  "High School",
  "College",
  "University",
  "Independent Learner",
];

const DEFAULT_SUBJECTS = [
  { id: "math", name: "Mathematics", icon: "calculator" },
  { id: "science", name: "Science", icon: "flask" },
  { id: "english", name: "English", icon: "book-open" },
  { id: "history", name: "History", icon: "landmark" },
  { id: "geography", name: "Geography", icon: "globe" },
  { id: "cs", name: "Computer Science", icon: "code" },
];

export function LandingPage() {
  const navigate = useNavigate();
  const setProfile = useStore((s) => s.setProfile);
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [grade, setGrade] = useState("");
  const [subjects, setSubjects] = useState<string[]>([]);
  const [customSubject, setCustomSubject] = useState("");

  function toggleSubject(id: string) {
    setSubjects((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  }

  function addCustom() {
    const trimmed = customSubject.trim();
    if (trimmed && !subjects.includes(trimmed)) {
      setSubjects((prev) => [...prev, trimmed]);
      setCustomSubject("");
    }
  }

  function handleFinish() {
    setProfile({
      id: Math.random().toString(36).slice(2),
      name: name.trim(),
      email: "",
      grade,
      subjects,
      createdAt: Date.now(),
    });
    navigate("/app/home");
  }

  const canAdvance =
    step === 0
      ? name.trim().length >= 1
      : step === 1
        ? grade !== ""
        : subjects.length > 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-warm-50 via-warm-100 to-brand-50 dark:from-dark-900 dark:via-dark-800 dark:to-dark-900 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Logo */}
        <div className="flex flex-col items-center mb-10 animate-fade-up">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-500 to-accent-500 flex items-center justify-center shadow-glow mb-4">
            <Icons.sparkles size={30} className="text-white" />
          </div>
          <h1 className="text-3xl font-extrabold font-display text-ink-900 dark:text-white">
            StudyVerse
          </h1>
          <p className="text-sm text-ink-500 dark:text-gray-400 mt-1">
            Your AI-Powered Learning Companion
          </p>
        </div>

        {/* Card */}
        <div className="card p-8 shadow-elevated animate-fade-up" style={{ animationDelay: "0.1s" }}>
          {/* Progress dots */}
          <div className="flex items-center justify-center gap-2 mb-8">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className={`h-2 rounded-full transition-all duration-300 ${
                  i === step
                    ? "w-8 bg-brand-500"
                    : i < step
                      ? "w-2 bg-brand-300"
                      : "w-2 bg-warm-300 dark:bg-dark-500"
                }`}
              />
            ))}
          </div>

          {/* Step 0: Name */}
          {step === 0 && (
            <div className="animate-fade-in">
              <h2 className="text-xl font-bold text-ink-900 dark:text-white mb-2">
                Welcome! What's your name?
              </h2>
              <p className="text-sm text-ink-500 dark:text-gray-400 mb-6">
                Let's personalize your learning experience.
              </p>
              <input
                type="text"
                className="input text-base py-3"
                placeholder="Enter your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && canAdvance && setStep(1)}
                autoFocus
              />
            </div>
          )}

          {/* Step 1: Grade */}
          {step === 1 && (
            <div className="animate-fade-in">
              <h2 className="text-xl font-bold text-ink-900 dark:text-white mb-2">
                What best describes you?
              </h2>
              <p className="text-sm text-ink-500 dark:text-gray-400 mb-6">
                This helps us tailor content to your level.
              </p>
              <div className="space-y-2">
                {GRADES.map((g) => (
                  <button
                    key={g}
                    onClick={() => setGrade(g)}
                    className={`w-full text-left px-4 py-3 rounded-lg border text-sm font-medium transition-all ${
                      grade === g
                        ? "border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-300 dark:border-brand-500/50"
                        : "border-warm-200 bg-white text-ink-700 hover:border-brand-300 hover:bg-brand-50/50 dark:border-dark-border dark:bg-dark-700 dark:text-gray-300 dark:hover:border-brand-500/30"
                    }`}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 2: Subjects */}
          {step === 2 && (
            <div className="animate-fade-in">
              <h2 className="text-xl font-bold text-ink-900 dark:text-white mb-2">
                What are you studying?
              </h2>
              <p className="text-sm text-ink-500 dark:text-gray-400 mb-6">
                Pick your subjects — you can always add more later.
              </p>
              <div className="grid grid-cols-2 gap-2 mb-4">
                {DEFAULT_SUBJECTS.map((s) => {
                  const active = subjects.includes(s.id);
                  return (
                    <button
                      key={s.id}
                      onClick={() => toggleSubject(s.id)}
                      className={`flex items-center gap-2.5 px-3.5 py-3 rounded-lg border text-sm font-medium transition-all ${
                        active
                          ? "border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-300 dark:border-brand-500/50"
                          : "border-warm-200 bg-white text-ink-700 hover:border-brand-300 dark:border-dark-border dark:bg-dark-700 dark:text-gray-300"
                      }`}
                    >
                      <div
                        className={`w-5 h-5 rounded flex items-center justify-center transition-colors ${
                          active
                            ? "bg-brand-500 text-white"
                            : "border border-warm-300 dark:border-dark-400"
                        }`}
                      >
                        {active && <Icons.check size={14} />}
                      </div>
                      {s.name}
                    </button>
                  );
                })}
              </div>
              {/* Custom subject */}
              <div className="flex gap-2">
                <input
                  type="text"
                  className="input text-sm flex-1"
                  placeholder="Add a custom subject..."
                  value={customSubject}
                  onChange={(e) => setCustomSubject(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addCustom()}
                />
                <button
                  onClick={addCustom}
                  disabled={!customSubject.trim()}
                  className="btn-secondary px-3"
                >
                  <Icons.plus size={16} />
                </button>
              </div>
              {subjects.filter((s) => !DEFAULT_SUBJECTS.some((d) => d.id === s)).length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {subjects
                    .filter((s) => !DEFAULT_SUBJECTS.some((d) => d.id === s))
                    .map((s) => (
                      <span
                        key={s}
                        className="chip chip-active flex items-center gap-1"
                      >
                        {s}
                        <button onClick={() => toggleSubject(s)} className="hover:text-red-500">
                          <Icons.x size={12} />
                        </button>
                      </span>
                    ))}
                </div>
              )}
            </div>
          )}

          {/* Navigation buttons */}
          <div className="flex items-center justify-between mt-8">
            {step > 0 ? (
              <button
                onClick={() => setStep(step - 1)}
                className="btn-ghost text-sm"
              >
                <Icons.chevronLeft size={16} />
                Back
              </button>
            ) : (
              <div />
            )}
            {step < 2 ? (
              <button
                onClick={() => setStep(step + 1)}
                disabled={!canAdvance}
                className="btn-primary"
              >
                Continue
                <Icons.chevronRight size={16} />
              </button>
            ) : (
              <button
                onClick={handleFinish}
                disabled={!canAdvance}
                className="btn-primary"
              >
                <Icons.sparkles size={16} />
                Get Started
              </button>
            )}
          </div>
        </div>

        <p
          className="text-center text-xs text-ink-400 dark:text-gray-500 mt-6 animate-fade-up"
          style={{ animationDelay: "0.2s" }}
        >
          By continuing you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  );
}
