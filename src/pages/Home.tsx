import { Link } from "react-router-dom";
import { useApp, currentStreak, levelFromXp } from "../state/AppContext";
import { greeting, thisWeek, todaysWorkout, recommended } from "../lib/stats";
import { LEVEL_LABEL } from "../data/workouts";
import { Icon, type IconName } from "../components/Icon";
import { SectionHeader, StatTile, ProTag } from "../components/ui";
import { WorkoutCard } from "../components/WorkoutCard";

const QUICK_LINKS: { to: string; label: string; icon: IconName }[] = [
  { to: "/app/workouts", label: "Workouts", icon: "bolt" },
  { to: "/app/progress", label: "Progress", icon: "chart" },
  { to: "/app/rewards", label: "Rewards", icon: "trophy" },
  { to: "/app/plan", label: "My Plan", icon: "calendar" },
];

export function HomePage() {
  const { state } = useApp();
  const name = state.profile?.name ?? "Athlete";
  const today = todaysWorkout(state);
  const week = thisWeek(state.sessions);
  const streak = currentStreak(state);
  const level = levelFromXp(state.xp);
  const recs = recommended(state, 4);

  return (
    <div className="mx-auto max-w-4xl">
      {/* Header */}
      <header className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
            {greeting()}, <span className="gold-text">{name}!</span>
          </h1>
          <p className="mt-1 text-sm text-cream-dim">
            Level {level} · {streak > 0 ? `${streak}-day streak 🔥` : "Start a streak today"}
          </p>
        </div>
        {state.premium && <ProTag />}
      </header>

      {/* Today's workout hero */}
      <Link
        to={`/app/workouts/${today.id}`}
        className={`card card-hover group relative mt-6 block overflow-hidden bg-gradient-to-br ${today.art}`}
      >
        <Icon
          name={today.emblem}
          className="absolute -right-6 -top-8 h-44 w-44 text-white/10 transition-transform duration-500 group-hover:rotate-6 group-hover:scale-110"
        />
        <div className="relative p-6 sm:p-8">
          <div className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-gold-200">
            Today's Workout
          </div>
          <div className="mt-2 font-display text-2xl font-bold sm:text-3xl">{today.name}</div>
          <div className="mt-1 text-sm text-cream/80">{today.tagline}</div>
          <div className="mt-4 flex items-center gap-4 text-xs font-semibold text-cream/75">
            <span className="inline-flex items-center gap-1.5">
              <Icon name="clock" className="h-4 w-4" />
              {today.minutes} min
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Icon name="flame" className="h-4 w-4" />
              ~{today.calories} cal
            </span>
            <span className="hidden sm:inline-flex items-center gap-1.5">
              <Icon name="star" className="h-4 w-4" />
              {LEVEL_LABEL[today.level]}
            </span>
          </div>
          <span className="mt-6 inline-flex items-center gap-2 rounded-xl gold-fill px-6 py-3 text-sm font-bold text-ink-950 shadow-glow-sm transition-transform group-hover:scale-[1.03]">
            Start Workout
            <Icon name="play" className="h-4 w-4" />
          </span>
        </div>
      </Link>

      {/* Quick start */}
      <section className="mt-8">
        <SectionHeader title="Quick Start" />
        <div className="grid grid-cols-4 gap-3">
          {QUICK_LINKS.map((q) => (
            <Link
              key={q.to}
              to={q.to}
              className="card card-hover flex flex-col items-center gap-2 px-2 py-4"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gold-500/15 text-gold-400">
                <Icon name={q.icon} className="h-5 w-5" />
              </span>
              <span className="text-[11px] font-bold text-cream-dim">{q.label}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Stats */}
      <section className="mt-8">
        <SectionHeader title="Your Week" to="/app/progress" />
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
          <StatTile icon="flame" value={String(week.calories)} label="Calories" />
          <StatTile icon="clock" value={`${week.minutes} min`} label="Total Time" />
          <StatTile icon="bolt" value={String(streak)} label="Day Streak" accent={streak > 0} />
          <div className="hidden sm:block">
            <StatTile icon="dumbbell" value={String(week.workouts)} label="Workouts" />
          </div>
        </div>
      </section>

      {/* Recommended */}
      <section className="mt-8">
        <SectionHeader title="Recommended For You" to="/app/workouts" />
        <div className="grid gap-4 sm:grid-cols-2">
          {recs.map((w) => (
            <WorkoutCard key={w.id} workout={w} />
          ))}
        </div>
      </section>

      {/* Premium upsell */}
      {!state.premium && (
        <Link
          to="/app/store"
          className="card card-hover mt-8 flex items-center gap-4 border-gold-500/30 p-5"
        >
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl gold-fill text-ink-950 shadow-glow-sm">
            <Icon name="crown" className="h-6 w-6" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="font-display font-bold">Apex Premium</div>
            <div className="text-xs text-cream-dim">
              Unlock every Pro workout, 2× XP, and advanced analytics.
            </div>
          </div>
          <Icon name="chevron-right" className="h-5 w-5 shrink-0 text-gold-400" />
        </Link>
      )}
    </div>
  );
}
