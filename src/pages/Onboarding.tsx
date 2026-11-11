import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../state/AppContext";
import type { Goal, Level } from "../data/workouts";
import { GOAL_LABEL } from "../data/workouts";
import { Button } from "../components/ui";
import { Icon, type IconName } from "../components/Icon";
import { Brand } from "../components/Layout";

type AgeGroup = "kids" | "teens" | "adults" | "seniors";

const GOALS: { id: Goal; icon: IconName; blurb: string }[] = [
  { id: "strength", icon: "dumbbell", blurb: "Build lean muscle and raw power" },
  { id: "fat-loss", icon: "flame", blurb: "Torch calories and lean out" },
  { id: "endurance", icon: "heart", blurb: "Go longer, recover faster" },
  { id: "mobility", icon: "wind", blurb: "Move freely, feel younger" },
];

const LEVELS: { id: Level; name: string; blurb: string }[] = [
  { id: "beginner", name: "Beginner", blurb: "New to training, or coming back after a break" },
  { id: "intermediate", name: "Intermediate", blurb: "I train a few times a week" },
  { id: "advanced", name: "Advanced", blurb: "Training is part of who I am" },
];

const AGES: { id: AgeGroup; name: string; blurb: string }[] = [
  { id: "kids", name: "Kids", blurb: "Under 13" },
  { id: "teens", name: "Teens", blurb: "13 – 17" },
  { id: "adults", name: "Adults", blurb: "18 – 59" },
  { id: "seniors", name: "Seniors", blurb: "60 and over" },
];

export function OnboardingPage() {
  const { createProfile } = useApp();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [goal, setGoal] = useState<Goal | null>(null);
  const [level, setLevel] = useState<Level | null>(null);
  const [age, setAge] = useState<AgeGroup | null>(null);

  const canContinue =
    (step === 0 && name.trim().length > 0) ||
    (step === 1 && goal !== null) ||
    (step === 2 && level !== null) ||
    (step === 3 && age !== null);

  const next = () => {
    if (step < 3) {
      setStep(step + 1);
      return;
    }
    if (name.trim() && goal && level && age) {
      createProfile({ name: name.trim(), goal, level, ageGroup: age });
      navigate("/app/home", { replace: true });
    }
  };

  return (
    <div className="mx-auto flex min-h-dvh max-w-lg flex-col px-5 py-8">
      <div className="flex items-center justify-between">
        <Brand />
        <span className="text-xs font-semibold text-cream-faint">Step {step + 1} of 4</span>
      </div>

      {/* Progress */}
      <div className="mt-6 flex gap-1.5">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${
              i <= step ? "gold-fill" : "bg-ink-700"
            }`}
          />
        ))}
      </div>

      <div key={step} className="animate-fade-up mt-10 flex-1">
        {step === 0 && (
          <>
            <h1 className="font-display text-3xl font-bold leading-tight text-balance">
              Stronger. Healthier. <span className="gold-text">Happier.</span>
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-cream-dim">
              The ultimate fitness app for everyone, anywhere. Personalized workouts, real
              progress, and a community cheering you on. Let's start with your name.
            </p>
            <label className="mt-8 block">
              <span className="mb-2 block text-xs font-bold uppercase tracking-wide text-cream-faint">
                What should we call you?
              </span>
              <input
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && name.trim()) next();
                }}
                placeholder="Your name"
                maxLength={30}
                className="w-full rounded-xl border border-line bg-ink-850 px-4 py-3.5 text-base font-semibold outline-none transition-colors placeholder:text-cream-faint focus:border-gold-500/60 focus:ring-2 focus:ring-gold-500/20"
              />
            </label>
          </>
        )}

        {step === 1 && (
          <>
            <h1 className="font-display text-2xl font-bold">What's your main goal?</h1>
            <p className="mt-2 text-sm text-cream-dim">We'll build your plan around it.</p>
            <div className="mt-7 grid gap-3">
              {GOALS.map((g) => (
                <button
                  key={g.id}
                  onClick={() => setGoal(g.id)}
                  className={`card card-hover flex items-center gap-4 px-4 py-4 text-left ${
                    goal === g.id ? "border-gold-500/70 bg-gold-500/10" : ""
                  }`}
                >
                  <span
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
                      goal === g.id ? "gold-fill text-ink-950" : "bg-gold-500/15 text-gold-400"
                    }`}
                  >
                    <Icon name={g.icon} className="h-5 w-5" />
                  </span>
                  <span>
                    <span className="block font-bold">{GOAL_LABEL[g.id]}</span>
                    <span className="block text-xs text-cream-dim">{g.blurb}</span>
                  </span>
                </button>
              ))}
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <h1 className="font-display text-2xl font-bold">What's your level?</h1>
            <p className="mt-2 text-sm text-cream-dim">Be honest — we'll meet you there.</p>
            <div className="mt-7 grid gap-3">
              {LEVELS.map((l) => (
                <button
                  key={l.id}
                  onClick={() => setLevel(l.id)}
                  className={`card card-hover px-4 py-4 text-left ${
                    level === l.id ? "border-gold-500/70 bg-gold-500/10" : ""
                  }`}
                >
                  <span className="block font-bold">{l.name}</span>
                  <span className="block text-xs text-cream-dim">{l.blurb}</span>
                </button>
              ))}
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <h1 className="font-display text-2xl font-bold">Who's training?</h1>
            <p className="mt-2 text-sm text-cream-dim">
              Apex is for everyone — from beginners to pros, kids to seniors.
            </p>
            <div className="mt-7 grid grid-cols-2 gap-3">
              {AGES.map((a) => (
                <button
                  key={a.id}
                  onClick={() => setAge(a.id)}
                  className={`card card-hover px-4 py-5 text-center ${
                    age === a.id ? "border-gold-500/70 bg-gold-500/10" : ""
                  }`}
                >
                  <span className="block font-display font-bold">{a.name}</span>
                  <span className="mt-0.5 block text-xs text-cream-dim">{a.blurb}</span>
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      <div className="mt-8 flex items-center gap-3">
        {step > 0 && (
          <Button variant="ghost" onClick={() => setStep(step - 1)} aria-label="Back">
            <Icon name="arrow-left" className="h-4 w-4" />
          </Button>
        )}
        <Button className="flex-1" size="lg" disabled={!canContinue} onClick={next}>
          {step === 3 ? "Start Your Journey" : "Continue"}
          <Icon name="chevron-right" className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
