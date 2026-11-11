import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../state/AppContext";
import { GOAL_LABEL, type Goal, type Level } from "../data/workouts";
import { Button } from "../components/ui";
import { Icon } from "../components/Icon";

const GOALS: Goal[] = ["strength", "fat-loss", "endurance", "mobility"];
const LEVELS: Level[] = ["beginner", "intermediate", "advanced"];
const LEVEL_NAMES: Record<Level, string> = {
  beginner: "Beginner",
  intermediate: "Intermediate",
  advanced: "Advanced",
};
const GOAL_OPTIONS: { v: number; label: string }[] = [
  { v: 60, label: "Casual · 60 min" },
  { v: 90, label: "Steady · 90 min" },
  { v: 150, label: "Driven · 150 min" },
  { v: 240, label: "Athlete · 240 min" },
];

export function SettingsPage() {
  const { state, updateProfile, setWeeklyGoal, setPremium, resetAll, pushToast } = useApp();
  const navigate = useNavigate();
  const [confirmReset, setConfirmReset] = useState(false);
  const profile = state.profile;

  if (!profile) return null;

  return (
    <div className="mx-auto max-w-2xl">
      <header>
        <h1 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">Settings</h1>
        <p className="mt-1 text-sm text-cream-dim">Tune Apex to fit you.</p>
      </header>

      {/* Profile */}
      <section className="card mt-6 p-5">
        <h2 className="font-display font-bold">Profile</h2>
        <label className="mt-4 block">
          <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-cream-faint">
            Name
          </span>
          <input
            value={profile.name}
            maxLength={30}
            onChange={(e) => updateProfile({ name: e.target.value })}
            className="w-full rounded-xl border border-line bg-ink-850 px-4 py-3 text-sm font-semibold outline-none transition-colors focus:border-gold-500/60 focus:ring-2 focus:ring-gold-500/20"
          />
        </label>

        <div className="mt-5">
          <span className="mb-2 block text-xs font-bold uppercase tracking-wide text-cream-faint">
            Main goal
          </span>
          <div className="flex flex-wrap gap-2">
            {GOALS.map((g) => (
              <button
                key={g}
                onClick={() => updateProfile({ goal: g })}
                className={`chip ${profile.goal === g ? "chip-active" : "hover:text-cream"}`}
              >
                {GOAL_LABEL[g]}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-5">
          <span className="mb-2 block text-xs font-bold uppercase tracking-wide text-cream-faint">
            Training level
          </span>
          <div className="flex flex-wrap gap-2">
            {LEVELS.map((l) => (
              <button
                key={l}
                onClick={() => updateProfile({ level: l })}
                className={`chip ${profile.level === l ? "chip-active" : "hover:text-cream"}`}
              >
                {LEVEL_NAMES[l]}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Weekly goal */}
      <section className="card mt-4 p-5">
        <h2 className="font-display font-bold">Weekly active-minutes goal</h2>
        <p className="mt-1 text-xs text-cream-dim">
          Drives the progress ring on your Progress page.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {GOAL_OPTIONS.map((o) => (
            <button
              key={o.v}
              onClick={() => setWeeklyGoal(o.v)}
              className={`chip ${state.weeklyGoalMinutes === o.v ? "chip-active" : "hover:text-cream"}`}
            >
              {o.label}
            </button>
          ))}
        </div>
      </section>

      {/* Membership */}
      <section className="card mt-4 flex items-center gap-4 p-5">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl gold-fill text-ink-950">
          <Icon name="crown" className="h-5 w-5" filled={false} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="font-bold">Apex Premium</div>
          <div className="text-xs text-cream-dim">
            {state.premium ? "Active — enjoy 2× XP and all Pro workouts" : "Not active"}
          </div>
        </div>
        <Button
          size="sm"
          variant={state.premium ? "ghost" : "gold"}
          onClick={() => {
            if (state.premium) {
              setPremium(false);
              pushToast("Premium cancelled");
            } else {
              navigate("/app/store");
            }
          }}
        >
          {state.premium ? "Cancel" : "Upgrade"}
        </Button>
      </section>

      {/* Danger zone */}
      <section className="card mt-4 border-red-500/20 p-5">
        <h2 className="font-display font-bold text-red-400">Danger zone</h2>
        <p className="mt-1 text-xs text-cream-dim">
          Erase your profile, workout history, XP, and badges. This cannot be undone.
        </p>
        <Button variant="danger" size="sm" className="mt-4" onClick={() => setConfirmReset(true)}>
          Reset everything
        </Button>
      </section>

      <p className="mt-8 text-center text-[11px] text-cream-faint">
        Apex Fitness · Train. Improve. Achieve.
      </p>

      {confirmReset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-950/80 p-6 backdrop-blur-sm">
          <div className="card animate-fade-up w-full max-w-sm p-6 text-center">
            <h2 className="font-display text-xl font-bold">Reset everything?</h2>
            <p className="mt-2 text-sm text-cream-dim">
              All progress, XP, and badges will be permanently deleted.
            </p>
            <div className="mt-6 flex gap-3">
              <Button variant="ghost" className="flex-1" onClick={() => setConfirmReset(false)}>
                Keep my data
              </Button>
              <Button
                variant="danger"
                className="flex-1"
                onClick={() => {
                  resetAll();
                  navigate("/", { replace: true });
                }}
              >
                Reset
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
