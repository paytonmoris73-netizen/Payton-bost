import { Link } from "react-router-dom";
import type { Workout } from "../data/workouts";
import { LEVEL_LABEL, workoutMinutes, workoutCalories } from "../data/workouts";
import { Icon } from "./Icon";
import { CoverArt } from "./CoverArt";
import { ProTag } from "./ui";
import { useApp } from "../state/AppContext";

export function WorkoutCard({ workout, featured = false }: { workout: Workout; featured?: boolean }) {
  const { state } = useApp();
  const locked = workout.pro && !state.premium;
  const done = state.sessions.filter((s) => s.workoutId === workout.id).length;

  return (
    <Link
      to={locked ? "/app/store" : `/app/workouts/${workout.id}`}
      className="card card-hover group relative flex h-full flex-col overflow-hidden"
      aria-label={`${workout.name}${locked ? " — Premium" : ""}, ${workoutMinutes(workout)} minutes`}
    >
      <div className={`relative overflow-hidden ${featured ? "h-40" : "h-32"}`}>
        <CoverArt
          seed={workout.id}
          emblem={workout.emblem}
          from={workout.tint.from}
          to={workout.tint.to}
          className="absolute inset-0 h-full w-full transition-transform duration-500 group-hover:scale-[1.06]"
        />

        <div className="absolute left-3 top-3 flex items-center gap-1.5">
          <span className="rounded-md bg-ink-950/55 px-2 py-0.5 text-[11px] font-bold tracking-tight text-cream backdrop-blur-sm">
            {LEVEL_LABEL[workout.level]}
          </span>
          {workout.pro && <ProTag />}
        </div>

        {done > 0 && (
          <span
            className="absolute right-3 top-3 flex h-6 items-center gap-1 rounded-md bg-ink-950/55 px-2 text-[11px] font-bold text-emerald-300 backdrop-blur-sm"
            title={`Completed ${done} time${done > 1 ? "s" : ""}`}
          >
            <Icon name="check" className="h-3 w-3" />
            {done}
          </span>
        )}

        <span className="absolute bottom-3 right-3 flex h-10 w-10 items-center justify-center rounded-full bg-ink-950/55 text-gold-200 ring-1 ring-white/15 backdrop-blur-sm transition-all duration-200 group-hover:bg-gold-400 group-hover:text-ink-950 group-hover:ring-gold-200/50">
          <Icon name={locked ? "crown" : "play"} className="h-4 w-4" filled={!locked} />
        </span>
      </div>

      <div className="flex flex-1 flex-col p-4">
        <h3 className="font-display text-base font-bold leading-tight tracking-tight">
          {workout.name}
        </h3>
        <p className="mt-1 text-xs leading-snug text-cream-dim">{workout.tagline}</p>

        <div className="mt-auto flex items-center gap-3 pt-3 text-[11px] font-semibold text-cream-faint">
          <span className="inline-flex items-center gap-1">
            <Icon name="clock" className="h-3.5 w-3.5" />
            {workoutMinutes(workout)} min
          </span>
          <span className="inline-flex items-center gap-1">
            <Icon name="flame" className="h-3.5 w-3.5" />
            {workoutCalories(workout)}
          </span>
          <span className="inline-flex items-center gap-1">
            <Icon name="bolt" className="h-3.5 w-3.5" />
            {workout.exercises.length}
            {workout.rounds > 1 && <span className="text-cream-faint/70">×{workout.rounds}</span>}
          </span>
        </div>
      </div>
    </Link>
  );
}
