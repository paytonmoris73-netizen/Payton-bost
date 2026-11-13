import { Link } from "react-router-dom";
import { useApp, currentStreak, levelFromXp, xpIntoLevel, XP_PER_LEVEL } from "../state/AppContext";
import { greeting, thisWeek, todaysWorkout, recommended } from "../lib/stats";
import { LEVEL_LABEL, workoutMinutes, workoutCalories } from "../data/workouts";
import { Icon, type IconName } from "../components/Icon";
import { CoverArt } from "../components/CoverArt";
import { SectionHeader, StatTile, ProTag } from "../components/ui";
import { WorkoutCard } from "../components/WorkoutCard";

const QUICK_LINKS: { to: string; label: string; icon: IconName }[] = [
  { to: "/app/workouts", label: "Browse", icon: "dumbbell" },
  { to: "/app/plan", label: "My Plan", icon: "calendar" },
  { to: "/app/progress", label: "Progress", icon: "chart" },
  { to: "/app/rewards", label: "Rewards", icon: "trophy" },
];

export function HomePage() {
  const { state } = useApp();
  const name = state.profile?.name ?? "Athlete";
  const today = todaysWorkout(state);
  const week = thisWeek(state.sessions);
  const streak = currentStreak(state);
  const level = levelFromXp(state.xp);
  const into = xpIntoLevel(state.xp);
  const recs = recommended(state, 4);

  const subline =
    streak > 1
      ? `${streak} days in a row. Keep it alive.`
      : streak === 1
        ? "Streak started. Come back tomorrow."
        : state.sessions.length > 0
          ? "Ready when you are."
          : "Your first session is waiting.";

  return (
    <div className="mx-auto max-w-4xl">
      <header className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="font-display text-2xl font-bold tracking-tight sm:text-[32px] sm:leading-tight">
            {greeting()}, <span className="gold-text">{name}</span>
          </h1>
          <p className="mt-1 text-sm text-cream-dim">{subline}</p>
        </div>
        <Link
          to="/app/rewards"
          className="card card-hover hidden shrink-0 items-center gap-3 px-3.5 py-2.5 sm:flex"
        >
          <div className="text-right">
            <div className="font-display text-sm font-bold leading-none">Level {level}</div>
            <div className="mt-1 text-[10px] font-semibold text-cream-faint">
              {XP_PER_LEVEL - into} XP to go
            </div>
          </div>
          <div className="h-8 w-1.5 overflow-hidden rounded-full bg-ink-700">
            <div
              className="w-full gold-fill transition-[height] duration-700"
              style={{ height: `${(into / XP_PER_LEVEL) * 100}%`, marginTop: "auto" }}
            />
          </div>
        </Link>
      </header>

      {/* Today's workout */}
      <Link
        to={`/app/workouts/${today.id}`}
        className="card group relative mt-6 block overflow-hidden transition-transform duration-200 hover:-translate-y-0.5"
      >
        <CoverArt
          seed={today.id}
          emblem={today.emblem}
          from={today.tint.from}
          to={today.tint.to}
          className="absolute inset-0 h-full w-full transition-transform duration-700 group-hover:scale-105"
        />
        {/* Scrim keeps the copy legible over any artwork */}
        <div className="absolute inset-0 bg-gradient-to-r from-ink-950/90 via-ink-950/60 to-ink-950/15" />
        <div className="relative p-6 sm:p-8">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-extrabold uppercase tracking-[0.2em] text-gold-200">
              Today's Workout
            </span>
            {state.premium && <ProTag />}
          </div>
          <h2 className="mt-2.5 font-display text-[28px] font-bold leading-none tracking-tight sm:text-4xl">
            {today.name}
          </h2>
          <p className="mt-2 text-sm text-cream/85">{today.tagline}</p>

          <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs font-semibold text-cream/80">
            <span className="inline-flex items-center gap-1.5">
              <Icon name="clock" className="h-4 w-4" />
              {workoutMinutes(today)} min
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Icon name="flame" className="h-4 w-4" />~{workoutCalories(today)} cal
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Icon name="bolt" className="h-4 w-4" />
              {today.exercises.length} exercises{today.rounds > 1 ? ` × ${today.rounds} rounds` : ""}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Icon name="star" className="h-4 w-4" />
              {LEVEL_LABEL[today.level]}
            </span>
          </div>

          <span className="mt-6 inline-flex items-center gap-2 rounded-xl gold-fill px-6 py-3.5 text-sm font-bold text-ink-950 shadow-glow-sm transition-transform duration-200 group-hover:scale-[1.03]">
            Start Workout
            <Icon name="play" className="h-4 w-4" />
          </span>
        </div>
      </Link>

      {/* Quick links */}
      <nav className="stagger mt-6 grid grid-cols-4 gap-2.5 sm:gap-3">
        {QUICK_LINKS.map((q) => (
          <Link
            key={q.to}
            to={q.to}
            className="card card-hover group flex flex-col items-center gap-2 px-2 py-4"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gold-500/10 text-gold-400 ring-1 ring-gold-500/20 transition-colors group-hover:bg-gold-500/20">
              <Icon name={q.icon} className="h-[18px] w-[18px]" />
            </span>
            <span className="text-[11px] font-bold text-cream-dim">{q.label}</span>
          </Link>
        ))}
      </nav>

      {/* This week */}
      <section className="mt-8">
        <SectionHeader title="This Week" to="/app/progress" hint="Last 7 days" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatTile icon="dumbbell" value={week.workouts} label="Workouts" />
          <StatTile icon="clock" value={week.minutes} label="Minutes" />
          <StatTile icon="flame" value={week.calories} label="Calories" />
          <StatTile icon="bolt" value={streak} label="Streak" suffix="d" accent={streak > 0} />
        </div>
      </section>

      {/* Recommended */}
      <section className="mt-8">
        <SectionHeader
          title="Recommended For You"
          to="/app/workouts"
          hint={state.profile ? `Matched to your goal and level` : undefined}
        />
        <div className="stagger grid gap-4 sm:grid-cols-2">
          {recs.map((w) => (
            <WorkoutCard key={w.id} workout={w} />
          ))}
        </div>
      </section>

      {/* Premium */}
      {!state.premium && (
        <Link
          to="/app/store"
          className="card card-hover group relative mt-8 flex items-center gap-4 overflow-hidden border-gold-500/25 p-5"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-gold-500/10 via-transparent to-transparent" />
          <span className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl gold-fill text-ink-950 shadow-glow-sm">
            <Icon name="crown" className="h-6 w-6" filled={false} />
          </span>
          <div className="relative min-w-0 flex-1">
            <div className="font-display font-bold">Apex Premium</div>
            <div className="text-xs text-cream-dim">
              Every Pro workout, double XP, and deeper analytics.
            </div>
          </div>
          <Icon
            name="chevron-right"
            className="relative h-5 w-5 shrink-0 text-gold-400 transition-transform group-hover:translate-x-0.5"
          />
        </Link>
      )}
    </div>
  );
}
