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
  { id: "strength", icon: "dumbbell", blurb: "Build lean muscle and real power" },
  { id: "fat-loss", icon: "flame", blurb: "Burn calories and lean out" },
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

const FEATURES: { icon: IconName; label: string }[] = [
  { icon: "dumbbell", label: "Personalized workouts" },
  { icon: "chart", label: "Progress you can see" },
  { icon: "trophy", label: "Badges and levels" },
  { icon: "users", label: "A community behind you" },
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
    <div className="grid min-h-dvh lg:grid-cols-[1.05fr_1fr]">
      {/* Brand panel — desktop only */}
      <aside className="relative hidden overflow-hidden border-r border-line bg-ink-900 lg:flex lg:flex-col lg:justify-between lg:p-12">
        <div className="grain absolute inset-0" />
        <div
          className="absolute -left-24 top-1/4 h-[460px] w-[460px] rounded-full opacity-50 blur-3xl"
          style={{ background: "radial-gradient(circle, rgba(237,165,18,0.30), transparent 65%)" }}
        />
        <div
          className="absolute -right-16 bottom-0 h-[380px] w-[380px] rounded-full opacity-40 blur-3xl"
          style={{ background: "radial-gradient(circle, rgba(216,138,6,0.28), transparent 65%)" }}
        />

        <div className="relative">
          <Brand />
        </div>

        <div className="relative">
          <h1 className="font-display text-5xl font-bold leading-[1.05] tracking-tight text-balance">
            Stronger.
            <br />
            Healthier.
            <br />
            <span className="gold-text">Happier.</span>
          </h1>
          <p className="mt-5 max-w-sm text-base leading-relaxed text-cream-dim">
            The ultimate fitness app for everyone, anywhere. Your journey starts here.
          </p>

          <ul className="mt-8 space-y-3">
            {FEATURES.map((f) => (
              <li key={f.label} className="flex items-center gap-3 text-sm font-semibold">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gold-500/10 text-gold-400 ring-1 ring-gold-500/20">
                  <Icon name={f.icon} className="h-4 w-4" />
                </span>
                {f.label}
              </li>
            ))}
          </ul>
        </div>

        <div className="relative flex items-center gap-6 text-xs font-bold uppercase tracking-wide text-cream-faint">
          <span className="inline-flex items-center gap-1.5">
            <Icon name="bolt" className="h-3.5 w-3.5 text-gold-500" />
            Any age
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Icon name="wind" className="h-3.5 w-3.5 text-gold-500" />
            Anywhere
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Icon name="heart" className="h-3.5 w-3.5 text-gold-500" />
            A healthier you
          </span>
        </div>
      </aside>

      {/* Form panel */}
      <main className="flex flex-col px-5 py-8 sm:px-10 lg:justify-center lg:px-14">
        <div className="mx-auto flex w-full max-w-md flex-1 flex-col lg:flex-none">
          <div className="flex items-center justify-between lg:hidden">
            <Brand />
            <span className="text-xs font-semibold text-cream-faint">Step {step + 1} of 4</span>
          </div>

          <div className="mt-6 flex items-center gap-3 lg:mt-0">
            <div className="flex flex-1 gap-1.5">
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={i}
                  className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${
                    i <= step ? "gold-fill" : "bg-ink-700"
                  }`}
                />
              ))}
            </div>
            <span className="hidden text-xs font-semibold text-cream-faint lg:block">
              {step + 1} / 4
            </span>
          </div>

          <div key={step} className="animate-fade-up mt-9 flex-1">
            {step === 0 && (
              <>
                <h2 className="font-display text-2xl font-bold tracking-tight">
                  First, what should we call you?
                </h2>
                <p className="mt-2 text-sm text-cream-dim">
                  Four quick questions and your plan is ready.
                </p>
                <label className="mt-7 block">
                  <span className="mb-2 block text-xs font-bold uppercase tracking-wide text-cream-faint">
                    Your name
                  </span>
                  <input
                    autoFocus
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && name.trim()) next();
                    }}
                    placeholder="e.g. Payton"
                    maxLength={30}
                    className="w-full rounded-xl border border-line bg-ink-850 px-4 py-3.5 text-base font-semibold outline-none transition-colors placeholder:text-cream-faint focus:border-gold-500/60"
                  />
                </label>
              </>
            )}

            {step === 1 && (
              <>
                <h2 className="font-display text-2xl font-bold tracking-tight">
                  What's your main goal?
                </h2>
                <p className="mt-2 text-sm text-cream-dim">We'll build your plan around it.</p>
                <div className="mt-7 grid gap-3">
                  {GOALS.map((g) => (
                    <Choice
                      key={g.id}
                      selected={goal === g.id}
                      onClick={() => setGoal(g.id)}
                      icon={g.icon}
                      title={GOAL_LABEL[g.id]}
                      blurb={g.blurb}
                    />
                  ))}
                </div>
              </>
            )}

            {step === 2 && (
              <>
                <h2 className="font-display text-2xl font-bold tracking-tight">
                  How would you describe your level?
                </h2>
                <p className="mt-2 text-sm text-cream-dim">Be honest — we'll meet you there.</p>
                <div className="mt-7 grid gap-3">
                  {LEVELS.map((l) => (
                    <Choice
                      key={l.id}
                      selected={level === l.id}
                      onClick={() => setLevel(l.id)}
                      title={l.name}
                      blurb={l.blurb}
                    />
                  ))}
                </div>
              </>
            )}

            {step === 3 && (
              <>
                <h2 className="font-display text-2xl font-bold tracking-tight">Who's training?</h2>
                <p className="mt-2 text-sm text-cream-dim">
                  Apex works for beginners and pros, kids and seniors alike.
                </p>
                <div className="mt-7 grid grid-cols-2 gap-3">
                  {AGES.map((a) => (
                    <button
                      key={a.id}
                      onClick={() => setAge(a.id)}
                      className={`card card-hover px-4 py-5 text-center ${
                        age === a.id ? "border-gold-500/70 bg-gold-500/10" : ""
                      }`}
                      aria-pressed={age === a.id}
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
              <Button variant="ghost" onClick={() => setStep(step - 1)} aria-label="Back a step">
                <Icon name="arrow-left" className="h-4 w-4" />
              </Button>
            )}
            <Button className="flex-1" size="lg" disabled={!canContinue} onClick={next}>
              {step === 3 ? "Start your journey" : "Continue"}
              <Icon name="chevron-right" className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}

function Choice({
  selected,
  onClick,
  icon,
  title,
  blurb,
}: {
  selected: boolean;
  onClick: () => void;
  icon?: IconName;
  title: string;
  blurb: string;
}) {
  return (
    <button
      onClick={onClick}
      aria-pressed={selected}
      className={`card card-hover flex items-center gap-4 px-4 py-4 text-left ${
        selected ? "border-gold-500/70 bg-gold-500/10" : ""
      }`}
    >
      {icon && (
        <span
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-colors ${
            selected ? "gold-fill text-ink-950" : "bg-gold-500/10 text-gold-400 ring-1 ring-gold-500/20"
          }`}
        >
          <Icon name={icon} className="h-5 w-5" />
        </span>
      )}
      <span className="min-w-0">
        <span className="block font-bold">{title}</span>
        <span className="block text-xs text-cream-dim">{blurb}</span>
      </span>
      <span
        className={`ml-auto flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-colors ${
          selected ? "border-gold-400 gold-fill text-ink-950" : "border-line-bright"
        }`}
      >
        {selected && <Icon name="check" className="h-3 w-3" />}
      </span>
    </button>
  );
}
