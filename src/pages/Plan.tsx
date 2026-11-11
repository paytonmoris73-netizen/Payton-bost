import { Link } from "react-router-dom";
import { useApp } from "../state/AppContext";
import { WORKOUTS, GOAL_LABEL, type Workout } from "../data/workouts";
import { localDateISO } from "../state/AppContext";
import { Icon } from "../components/Icon";
import { WorkoutCard } from "../components/WorkoutCard";

const DAY_NAMES = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

/** Deterministic weekly plan from goal + level: 4 training days, rest in between. */
function buildPlan(state: ReturnType<typeof useApp>["state"]): (Workout | null)[] {
  const { profile } = state;
  const pool = WORKOUTS.filter((w) => {
    if (w.pro && !state.premium) return false;
    if (!profile) return true;
    return w.level === "all" || w.level === profile.level;
  });
  const preferred = profile
    ? [...pool].sort((a, b) => {
        const score = (w: Workout) => (w.focus === profile.goal ? 0 : 1);
        return score(a) - score(b) || a.id.localeCompare(b.id);
      })
    : pool;

  const picks = preferred.slice(0, 4);
  while (picks.length < 4 && pool.length > 0) picks.push(pool[picks.length % pool.length]);

  // Mon / Tue / Thu / Sat training, mobility-friendly spread.
  const slots: (Workout | null)[] = [null, null, null, null, null, null, null];
  const trainingDays = [0, 1, 3, 5];
  trainingDays.forEach((day, i) => {
    slots[day] = picks[i] ?? null;
  });
  return slots;
}

export function PlanPage() {
  const { state } = useApp();
  const plan = buildPlan(state);
  const goalLabel = state.profile ? GOAL_LABEL[state.profile.goal] : "Get Fit";
  // getDay(): 0=Sunday … convert so Monday=0.
  const todayIndex = (new Date(`${localDateISO()}T12:00:00`).getDay() + 6) % 7;
  const doneToday = state.sessions.some((s) => s.date === localDateISO());

  return (
    <div className="mx-auto max-w-3xl">
      <header>
        <h1 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
          Your Personalized Plan
        </h1>
        <p className="mt-1 text-sm text-cream-dim">
          Built for your goal: <span className="font-bold text-gold-300">{goalLabel}</span>
          {state.profile && <> · {state.profile.level}</>}
        </p>
      </header>

      <div className="card mt-6 border-gold-500/30 p-5">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-400">
            <Icon name="check" className="h-5 w-5" />
          </span>
          <div>
            <div className="font-bold">Your plan is ready!</div>
            <div className="text-xs text-cream-dim">
              4 sessions a week, with recovery days built in. Adjust anytime in Settings.
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 space-y-2.5">
        {DAY_NAMES.map((day, i) => {
          const w = plan[i];
          const isToday = i === todayIndex;
          return (
            <div
              key={day}
              className={`card flex items-center gap-4 px-4 py-3.5 ${
                isToday ? "border-gold-500/50 bg-gold-500/5" : ""
              }`}
            >
              <div className="w-24 shrink-0">
                <div className={`text-sm font-bold ${isToday ? "text-gold-300" : ""}`}>{day}</div>
                {isToday && (
                  <div className="text-[10px] font-extrabold uppercase tracking-wide text-gold-500">
                    Today
                  </div>
                )}
              </div>
              {w ? (
                <>
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-bold">{w.name}</div>
                    <div className="text-xs text-cream-dim">
                      {w.minutes} min · ~{w.calories} cal
                    </div>
                  </div>
                  {isToday && doneToday ? (
                    <span className="inline-flex shrink-0 items-center gap-1.5 text-xs font-bold text-emerald-400">
                      <Icon name="check" className="h-4 w-4" />
                      Done
                    </span>
                  ) : (
                    <Link
                      to={`/app/workouts/${w.id}`}
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-colors ${
                        isToday
                          ? "gold-fill text-ink-950 shadow-glow-sm"
                          : "bg-ink-700 text-cream-dim hover:text-cream"
                      }`}
                      aria-label={`Open ${w.name}`}
                    >
                      <Icon name="play" className="h-4 w-4" />
                    </Link>
                  )}
                </>
              ) : (
                <div className="flex-1 text-sm text-cream-faint">
                  Rest &amp; recovery — stretch, walk, hydrate
                </div>
              )}
            </div>
          );
        })}
      </div>

      {plan[todayIndex] && !doneToday && (
        <section className="mt-8">
          <h2 className="mb-4 font-display text-lg font-bold">Today's session</h2>
          <WorkoutCard workout={plan[todayIndex]!} wide />
        </section>
      )}
    </div>
  );
}
