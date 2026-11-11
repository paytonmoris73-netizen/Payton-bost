import { Link, Navigate, useParams } from "react-router-dom";
import { getWorkout, LEVEL_LABEL, GOAL_LABEL, workoutSeconds } from "../data/workouts";
import { useApp } from "../state/AppContext";
import { Icon } from "../components/Icon";
import { ProTag } from "../components/ui";

const fmt = (totalSeconds: number) => {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return s === 0 ? `${m} min` : `${m}:${String(s).padStart(2, "0")}`;
};

export function WorkoutDetailPage() {
  const { id } = useParams();
  const workout = getWorkout(id);
  const { state } = useApp();

  if (!workout) return <Navigate to="/app/workouts" replace />;
  const locked = workout.pro && !state.premium;
  const totalSec = workoutSeconds(workout);
  const timesDone = state.sessions.filter((s) => s.workoutId === workout.id).length;

  return (
    <div className="mx-auto max-w-3xl">
      <Link
        to="/app/workouts"
        className="inline-flex items-center gap-2 text-sm font-semibold text-cream-dim hover:text-cream"
      >
        <Icon name="arrow-left" className="h-4 w-4" />
        All workouts
      </Link>

      {/* Hero */}
      <div className={`card relative mt-4 overflow-hidden bg-gradient-to-br ${workout.art}`}>
        <Icon
          name={workout.emblem}
          className="absolute -right-8 -top-10 h-52 w-52 text-white/10"
        />
        <div className="relative p-6 sm:p-8">
          <div className="flex items-center gap-2">
            <span className="rounded-md bg-ink-950/60 px-2 py-0.5 text-[11px] font-bold backdrop-blur">
              {LEVEL_LABEL[workout.level]}
            </span>
            <span className="rounded-md bg-ink-950/60 px-2 py-0.5 text-[11px] font-bold backdrop-blur">
              {GOAL_LABEL[workout.focus]}
            </span>
            {workout.pro && <ProTag />}
          </div>
          <h1 className="mt-3 font-display text-3xl font-bold">{workout.name}</h1>
          <p className="mt-1 text-sm text-cream/80">{workout.tagline}</p>
          <div className="mt-5 flex flex-wrap items-center gap-4 text-xs font-semibold text-cream/80">
            <span className="inline-flex items-center gap-1.5">
              <Icon name="clock" className="h-4 w-4" />
              {fmt(totalSec)}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Icon name="flame" className="h-4 w-4" />
              ~{workout.calories} cal
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Icon name="bolt" className="h-4 w-4" />
              {workout.exercises.length} exercises
            </span>
            {timesDone > 0 && (
              <span className="inline-flex items-center gap-1.5">
                <Icon name="check" className="h-4 w-4" />
                Completed {timesDone}×
              </span>
            )}
          </div>

          {locked ? (
            <Link
              to="/app/store"
              className="mt-6 inline-flex items-center gap-2 rounded-xl gold-fill px-7 py-3.5 font-bold text-ink-950 shadow-glow-sm transition-transform hover:scale-[1.02]"
            >
              <Icon name="crown" className="h-5 w-5" filled={false} />
              Unlock with Premium
            </Link>
          ) : (
            <Link
              to={`/app/play/${workout.id}`}
              className="mt-6 inline-flex items-center gap-2 rounded-xl gold-fill px-7 py-3.5 font-bold text-ink-950 shadow-glow-sm transition-transform hover:scale-[1.02]"
            >
              <Icon name="play" className="h-5 w-5" />
              Start Workout
            </Link>
          )}
        </div>
      </div>

      {/* Exercise list */}
      <section className="mt-8">
        <h2 className="font-display text-lg font-bold">What you'll do</h2>
        <ol className="mt-4 space-y-2.5">
          {workout.exercises.map((ex, i) => (
            <li key={`${ex.name}-${i}`} className="card flex items-center gap-4 px-4 py-3.5">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gold-500/15 font-display text-sm font-bold text-gold-400">
                {i + 1}
              </span>
              <div className="min-w-0 flex-1">
                <div className="truncate font-bold">{ex.name}</div>
                <div className="truncate text-xs text-cream-dim">{ex.cue}</div>
              </div>
              <div className="shrink-0 text-right">
                <div className="font-display text-sm font-bold text-gold-300">{ex.work}s</div>
                {ex.rest > 0 && <div className="text-[11px] text-cream-faint">+{ex.rest}s rest</div>}
              </div>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
