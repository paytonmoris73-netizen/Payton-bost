import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Icon } from "../components/Icon";
import { useAppStore } from "../stores/appStore";

const FEATURES = [
  { icon: "brain" as const, title: "AI Tutor", desc: "Ask anything. Get intelligent, detailed answers." },
  { icon: "headphones" as const, title: "Audio Studio", desc: "Record lectures, generate podcasts, listen to notes." },
  { icon: "test-tube" as const, title: "Test Center", desc: "Create practice exams from any material." },
  { icon: "layers" as const, title: "Smart Flashcards", desc: "Spaced repetition that adapts to you." },
  { icon: "file-text" as const, title: "Notes Studio", desc: "AI-generated notes from any document." },
  { icon: "bar-chart" as const, title: "Learning Analytics", desc: "Understand exactly what to improve." },
];

export function OnboardingPage() {
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const createUser = useAppStore((s) => s.createUser);
  const navigate = useNavigate();

  const handleCreate = () => {
    if (!name.trim()) return;
    createUser(name.trim(), email.trim() || `${name.trim().toLowerCase().replace(/\s/g, "")}@lucent.app`);
    navigate("/app/home");
  };

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center bg-surface-0 px-4 py-12">
      <div className="w-full max-w-lg">
        {step === 0 && (
          <div className="animate-fade-up text-center space-y-8">
            <div className="flex justify-center">
              <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-accent text-text-inverse shadow-card">
                <Icon name="lucent" className="h-9 w-9" filled />
              </span>
            </div>
            <div>
              <h1 className="font-serif text-4xl font-semibold tracking-tight text-text-primary">Lucent</h1>
              <p className="mt-2 text-lg text-text-secondary">Your intelligent learning companion</p>
            </div>
            <div className="grid grid-cols-2 gap-3 text-left">
              {FEATURES.map((f) => (
                <div key={f.title} className="card p-3.5 space-y-1.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent-subtle">
                    <Icon name={f.icon} className="h-4 w-4 text-accent" />
                  </div>
                  <div className="text-sm font-semibold text-text-primary">{f.title}</div>
                  <div className="text-xs text-text-tertiary leading-relaxed">{f.desc}</div>
                </div>
              ))}
            </div>
            <button onClick={() => setStep(1)} className="btn-primary w-full py-3 text-base">
              Get Started
            </button>
            <p className="text-xs text-text-tertiary">Free to start. No credit card required.</p>
          </div>
        )}

        {step === 1 && (
          <div className="animate-fade-up space-y-6">
            <button onClick={() => setStep(0)} className="btn-ghost px-0 text-text-tertiary">
              <Icon name="arrow-left" className="h-4 w-4" /> Back
            </button>
            <div>
              <h2 className="text-2xl font-semibold text-text-primary">Create your profile</h2>
              <p className="mt-1 text-text-secondary">Tell us a bit about yourself to personalize your experience.</p>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1.5">Your name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your name"
                  className="input-field"
                  autoFocus
                  onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1.5">Email (optional)</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="input-field"
                  onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                />
              </div>
            </div>
            <button onClick={handleCreate} disabled={!name.trim()} className="btn-primary w-full py-3 text-base">
              Start Learning <Icon name="arrow-right" className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
