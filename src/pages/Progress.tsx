import { Link } from "react-router-dom";
import { useApp, currentStreak } from "../state/AppContext";
import { lastSevenDays, thisWeek, totals } from "../lib/stats";
import { ProgressRing, StatTile, EmptyState, SectionHeader } from "../components/ui";
import { Icon } from "../components/Icon";

export function ProgressPage() {
  const { state } = useApp();
  const week = thisWeek(state.sessions);
  const days = lastSevenDays(state.sessions);
  const all = totals(state.sessions);
  const streak = currentStreak(state);
  const goal = state.weeklyGoalMinutes;
  const pct = goal > 0 ? Math.min(1, week.minutes / goal) : 0;
  const maxDay = Math.max(20, ...days.map((d) => d.minutes));
  const recent = [...state.sessions].slice(-6).reverse();

  return (
    <div className="mx-auto max-w-4xl">
      <header>
        <h1 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">Progress</h1>
        <p className="mt-1 text-sm text-cream-dim">Track your journey with beautiful analytics.</p>
      </header>

      {state.sessions.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            icon="chart"
            title="No workouts yet"
            body="Complete your first workout and your progress will start showing up here."
          >
            <Link
              to="/app/workouts"
              className="mt-2 inline-flex items-center gap-2 rounded-xl gold-fill px-6 py-3 text-sm font-bold text-ink-950 shadow-glow-sm"
            >
              Browse Workouts
              <Icon name="chevron-right" className="h-4 w-4" />
            </Link>
          </EmptyState>
        </div>
      ) : (
        <>
          {/* Weekly goal + bars */}
          <div className="mt-6 grid gap-4 lg:grid-cols-5">
            <div className="card flex flex-col items-center justify-center gap-3 p-6 lg:col-span-2">
              <ProgressRing progress={pct} size={170} stroke={13}>
                <span className="font-display text-4xl font-bold">{Math.round(pct * 100)}%</span>
                <span className="mt-0.5 text-[11px] font-semibold uppercase tracking-wide text-cream-faint">
                  Weekly Goal
                </span>
              </ProgressRing>
              <div className="text-sm text-cream-dim">
                <span className="font-bold text-cream">{week.minutes}</span> of {goal} active
                minutes
              </div>
            </div>

            <div className="card p-6 lg:col-span-3">
              <div className="flex items-baseline justify-between">
                <h2 className="font-display font-bold">This Week</h2>
                <span className="text-xs font-semibold text-cream-faint">minutes per day</span>
              </div>
              <div className="mt-6 flex h-36 items-end justify-between gap-2">
                {days.map((d, i) => {
                  const isToday = i === days.length - 1;
                  const h = Math.max(6, (d.minutes / maxDay) * 100);
                  return (
                    <div key={d.iso} className="flex flex-1 flex-col items-center gap-2">
                      <div className="flex w-full flex-1 items-end">
                        <div
                          className={`w-full rounded-lg transition-all duration-500 ${
                            d.minutes > 0 ? "gold-fill" : "bg-ink-700"
                          } ${isToday ? "shadow-glow-sm" : ""}`}
                          style={{ height: `${h}%` }}
                          title={`${d.minutes} min`}
                        />
                      </div>
                      <span
                        className={`text-[10px] font-bold ${
                          isToday ? "text-gold-400" : "text-cream-faint"
                        }`}
                      >
                        {d.label}
                      </span>
                    </div>
                  );
                })}
              </div>
              <div className="mt-5 grid grid-cols-3 gap-3 border-t border-line pt-4 text-center">
                <div>
                  <div className="font-display text-lg font-bold">{week.workouts}</div>
                  <div className="text-[11px] font-semibold text-cream-faint">Workouts</div>
                </div>
                <div>
                  <div className="font-display text-lg font-bold">{week.calories}</div>
                  <div className="text-[11px] font-semibold text-cream-faint">Calories</div>
                </div>
                <div>
                  <div className="font-display text-lg font-bold">
                    {(week.minutes / 60).toFixed(1)}h
                  </div>
                  <div className="text-[11px] font-semibold text-cream-faint">Active Time</div>
                </div>
              </div>
            </div>
          </div>

          {/* All-time */}
          <section className="mt-8">
            <SectionHeader title="All Time" />
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <StatTile icon="dumbbell" value={String(all.workouts)} label="Workouts" />
              <StatTile icon="flame" value={all.calories.toLocaleString()} label="Calories" />
              <StatTile icon="clock" value={`${Math.round(all.minutes / 60 * 10) / 10}h`} label="Trained" />
              <StatTile icon="bolt" value={String(Math.max(streak, state.bestStreak))} label="Best Streak" accent />
            </div>
          </section>

          {/* Recent sessions */}
          {recent.length > 0 && (
            <section className="mt-8">
              <SectionHeader title="Recent Sessions" />
              <div className="space-y-2.5">
                {recent.map((s, i) => (
                  <div key={`${s.date}-${s.workoutId}-${i}`} className="card flex items-center gap-4 px-4 py-3.5">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gold-500/15 text-gold-400">
                      <Icon name="check" className="h-5 w-5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-bold">{s.workoutName}</div>
                      <div className="text-xs text-cream-dim">
                        {new Date(`${s.date}T12:00:00`).toLocaleDateString(undefined, {
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                        })}
                        {" · "}
                        {s.minutes} min · {s.calories} cal
                      </div>
                    </div>
                    <span className="shrink-0 font-display text-sm font-bold text-gold-400">
                      +{s.xp} XP
                    </span>
                  </div>
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
