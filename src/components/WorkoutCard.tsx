import { Link } from "react-router-dom";
import type { Workout } from "../data/workouts";
import { LEVEL_LABEL } from "../data/workouts";
import { Icon } from "./Icon";
import { ProTag } from "./ui";
import { useApp } from "../state/AppContext";

export function WorkoutCard({ workout, wide = false }: { workout: Workout; wide?: boolean }) {
  const { state } = useApp();
  const locked = workout.pro && !state.premium;

  return (
    <Link
      to={locked ? "/app/store" : `/app/workouts/${workout.id}`}
      className={`card card-hover group relative block overflow-hidden ${wide ? "" : "h-full"}`}
    >
      {/* Cover art */}
      <div className={`relative h-28 overflow-hidden bg-gradient-to-br ${workout.art}`}>
        <Icon
          name={workout.emblem}
          className="absolute -bottom-5 -right-4 h-28 w-28 text-white/10 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3"
        />
        <div className="absolute left-3 top-3 flex items-center gap-2">
          <span className="rounded-md bg-ink-950/60 px-2 py-0.5 text-[11px] font-bold text-cream backdrop-blur">
            {LEVEL_LABEL[workout.level]}
          </span>
          {workout.pro && <ProTag />}
        </div>
        <span className="absolute bottom-3 right-3 flex h-9 w-9 items-center justify-center rounded-full bg-ink-950/60 text-gold-300 backdrop-blur transition-colors group-hover:bg-gold-400 group-hover:text-ink-950">
          <Icon name={locked ? "crown" : "play"} className="h-4 w-4" filled={!locked} />
        </span>
      </div>

      {/* Body */}
      <div className="p-4">
        <div className="font-display text-base font-bold leading-tight">{workout.name}</div>
        <div className="mt-0.5 text-xs text-cream-dim">{workout.tagline}</div>
        <div className="mt-3 flex items-center gap-3 text-[11px] font-semibold text-cream-faint">
          <span className="inline-flex items-center gap-1">
            <Icon name="clock" className="h-3.5 w-3.5" />
            {workout.minutes} min
          </span>
          <span className="inline-flex items-center gap-1">
            <Icon name="flame" className="h-3.5 w-3.5" />
            {workout.calories} cal
          </span>
          <span className="inline-flex items-center gap-1">
            <Icon name="bolt" className="h-3.5 w-3.5" />
            {workout.exercises.length} moves
          </span>
        </div>
      </div>
    </Link>
  );
}
