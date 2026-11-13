import { Link } from "react-router-dom";
import { useApp, currentStreak } from "../state/AppContext";
import { lastSevenDays, thisWeek, totals } from "../lib/stats";
import { ProgressRing, StatTile, EmptyState, SectionHeader } from "../components/ui";
import { ActivityChart } from "../components/ActivityChart";
import { Icon } from "../components/Icon";

export function ProgressPage() {
  const { state } = useApp();
  const week = thisWeek(state.sessions);
  const days = lastSevenDays(state.sessions);
  const all = totals(state.sessions);
  const streak = currentStreak(state);
  const goal = state.weeklyGoalMinutes;
  const pct = goal > 0 ? Math.min(1, week.minutes / goal) : 0;
  const recent = [...state.sessions].slice(-8).reverse();
  const activeDays = days.filter((d) => d.minutes > 0).length;

  if (state.sessions.length === 0) {
    return (
      <div className="mx-auto max-w-4xl">
        <Header />
        <div className="mt-6">
          <EmptyState
            icon="chart"
            title="Nothing to chart yet"
            body="Finish your first workout and this page fills up with your weekly trend, totals, and session history."
          >
            <Link
              to="/app/workouts"
              className="mt-2 inline-flex items-center gap-2 rounded-xl gold-fill px-6 py-3 text-sm font-bold text-ink-950 shadow-glow-sm"
            >
              Browse workouts
              <Icon name="chevron-right" className="h-4 w-4" />
            </Link>
          </EmptyState>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl">
      <Header />

      <div className="mt-6 grid gap-4 lg:grid-cols-5">
        {/* Weekly goal */}
        <div className="card flex flex-col items-center justify-center gap-4 p-6 lg:col-span-2">
          <ProgressRing progress={pct} size={168} stroke={13}>
            <span className="font-display text-4xl font-bold tabular-nums">
              {Math.round(pct * 100)}
              <span className="text-xl">%</span>
            </span>
            <span className="mt-0.5 text-[11px] font-bold uppercase tracking-wide text-cream-faint">
              of weekly goal
            </span>
          </ProgressRing>
          <div className="text-center text-sm text-cream-dim">
            <span className="font-bold text-cream">{week.minutes}</span> of {goal} active minutes
            <div className="mt-0.5 text-xs text-cream-faint">
              {pct >= 1
                ? "Goal reached. Outstanding."
                : `${goal - week.minutes} minutes to go this week`}
            </div>
          </div>

          <div className="grid w-full grid-cols-3 gap-2 border-t border-line pt-4 text-center">
            <Summary value={`${streak}d`} label="Streak" />
            <Summary value={`${activeDays}/7`} label="Active days" />
            <Summary value={String(week.workouts)} label="Sessions" />
          </div>
        </div>

        {/* Chart */}
        <div className="card p-5 sm:p-6 lg:col-span-3">
          <div className="mb-5 flex items-baseline justify-between gap-4">
            <div>
              <h2 className="font-display font-bold">Last 7 days</h2>
              <p className="mt-0.5 text-xs text-cream-faint">
                Active on {activeDays} of 7 days
              </p>
            </div>
            <span className="text-[11px] font-semibold text-cream-faint">minutes</span>
          </div>

          <ActivityChart days={days} dailyGoal={Math.round(goal / 7)} />

          <div className="mt-5 grid grid-cols-3 gap-3 border-t border-line pt-4 text-center">
            <Summary value={String(week.workouts)} label="Workouts" />
            <Summary value={week.calories.toLocaleString()} label="Calories" />
            <Summary value={`${(week.minutes / 60).toFixed(1)}h`} label="Active time" />
          </div>
        </div>
      </div>

      {/* All time */}
      <section className="mt-8">
        <SectionHeader title="All Time" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatTile icon="dumbbell" value={all.workouts} label="Workouts" />
          <StatTile icon="flame" value={all.calories} label="Calories" />
          <StatTile
            icon="clock"
            value={Math.round(all.minutes / 6) / 10}
            label="Hours"
            suffix="h"
            decimals={1}
          />
          <StatTile
            icon="bolt"
            value={Math.max(streak, state.bestStreak)}
            label="Best streak"
            suffix="d"
            accent
          />
        </div>
      </section>

      {/* History */}
      <section className="mt-8">
        <SectionHeader title="Recent Sessions" hint={`${all.workouts} total`} />
        <div className="stagger space-y-2.5">
          {recent.map((s, i) => (
            <div
              key={`${s.date}-${s.workoutId}-${i}`}
              className="card flex items-center gap-4 px-4 py-3.5"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20">
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
                +{s.xp}
              </span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function Header() {
  return (
    <header>
      <h1 className="font-display text-2xl font-bold tracking-tight sm:text-[32px] sm:leading-tight">
        Progress
      </h1>
      <p className="mt-1 text-sm text-cream-dim">Every session, measured.</p>
    </header>
  );
}

function Summary({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <div className="font-display text-lg font-bold tabular-nums">{value}</div>
      <div className="text-[11px] font-semibold text-cream-faint">{label}</div>
    </div>
  );
}
