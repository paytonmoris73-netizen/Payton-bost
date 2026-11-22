import { useState } from "react";
import Icon from "../components/Icon";
import { WORKOUTS } from "../data";
import { useApp, useNav } from "../store";
import type { Category, Exercise, Workout } from "../types";
import WorkoutBuilder from "./WorkoutBuilder";

const FILTERS: ("For You" | Category)[] = ["For You", "Strength", "Cardio", "Mobility"];

const target = (e: Exercise) => (e.reps ? `${e.sets} × ${e.reps}` : `${e.sets} × ${e.seconds}s`);
const iconFor = (w: Workout) => (w.category === "Cardio" ? "flame" : w.category === "Mobility" ? "target" : "dumbbell");

export default function Workouts() {
  const detailId = useNav((s) => s.detailId);
  const openDetail = useNav((s) => s.openDetail);
  const startSession = useNav((s) => s.startSession);
  const custom = useApp((s) => s.customWorkouts);
  const addCustom = useApp((s) => s.addCustomWorkout);
  const deleteCustom = useApp((s) => s.deleteCustomWorkout);
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("For You");
  const [building, setBuilding] = useState(false);

  if (building) {
    return (
      <WorkoutBuilder
        onClose={() => setBuilding(false)}
        onSave={(w) => {
          addCustom(w);
          setBuilding(false);
          openDetail(w.id);
        }}
      />
    );
  }

  const detail = detailId ? [...custom, ...WORKOUTS].find((w) => w.id === detailId) : undefined;
  if (detail) {
    return (
      <Detail
        w={detail}
        onBack={() => openDetail(null)}
        onStart={() => startSession(detail.id)}
        onDelete={
          detail.custom
            ? () => {
                if (window.confirm(`Delete "${detail.name}"? This can't be undone.`)) {
                  deleteCustom(detail.id);
                  openDetail(null);
                }
              }
            : undefined
        }
      />
    );
  }

  const match = (w: Workout) => filter === "For You" || w.category === filter;
  const builtIn = WORKOUTS.filter(match);
  const mine = custom.filter(match);
  const [featured, ...rest] = builtIn;

  return (
    <div className="animate-fade-up pt-safe space-y-5 px-5">
      <h1 className="text-center text-xl font-extrabold">Workout</h1>

      <div className="no-scrollbar -mx-5 flex gap-2 overflow-x-auto px-5">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`chip shrink-0 ${filter === f ? "bg-apex text-black" : "bg-ink-2 text-white/70"}`}
          >
            {f}
          </button>
        ))}
      </div>

      <button onClick={() => setBuilding(true)} className="btn-ghost w-full border-dashed">
        <Icon name="plus" size={16} /> Create your own workout
      </button>

      {mine.length > 0 && (
        <section>
          <h2 className="mb-3 text-base font-bold">My Workouts</h2>
          <ul className="space-y-2.5">
            {mine.map((w) => (
              <Row key={w.id} w={w} onOpen={() => openDetail(w.id)} />
            ))}
          </ul>
        </section>
      )}

      {featured && (
        <button
          onClick={() => openDetail(featured.id)}
          className="card relative block w-full overflow-hidden rounded-3xl bg-gradient-to-br from-[#4a2608] via-[#1d1107] to-[#100c08] p-5 text-left"
        >
          <div className="absolute -right-8 -top-8 text-apex/15">
            <Icon name="dumbbell" size={190} strokeWidth={1.2} />
          </div>
          <span className="gloss-tile rounded-full px-2.5 py-1 text-[10px] font-bold uppercase text-white">Featured</span>
          <h2 className="mt-14 text-2xl font-extrabold">{featured.name}</h2>
          <p className="text-sm text-white/60">
            {featured.minutes} min · {featured.level}
          </p>
          <span className="btn-primary mt-4 w-full">
            <Icon name="play" size={14} /> View Workout
          </span>
        </button>
      )}

      <section>
        <h2 className="mb-3 text-base font-bold">{filter === "For You" ? "Popular Workouts" : `${filter} Workouts`}</h2>
        <ul className="space-y-2.5">
          {rest.map((w) => (
            <Row key={w.id} w={w} onOpen={() => openDetail(w.id)} />
          ))}
        </ul>
      </section>
    </div>
  );
}

function Row({ w, onOpen }: { w: Workout; onOpen: () => void }) {
  return (
    <li>
      <button onClick={onOpen} className="card flex w-full items-center gap-3 p-3 text-left transition active:scale-[0.98]">
        <span className="gloss-tile flex h-14 w-14 shrink-0 items-center justify-center rounded-xl text-white">
          <Icon name={iconFor(w)} size={24} />
        </span>
        <span className="flex-1">
          <span className="block text-sm font-bold">{w.name}</span>
          <span className="block text-xs text-white/50">
            {w.minutes} min · {w.level}
          </span>
        </span>
        <Icon name="chevR" size={18} className="text-white/40" />
      </button>
    </li>
  );
}

function Detail({ w, onBack, onStart, onDelete }: { w: Workout; onBack: () => void; onStart: () => void; onDelete?: () => void }) {
  return (
    <div className="animate-fade-up pt-safe px-5">
      <button onClick={onBack} className="mb-4 flex items-center gap-1 text-sm text-white/60">
        <Icon name="chevL" size={18} /> Back
      </button>
      <h1 className="text-2xl font-extrabold">{w.name}</h1>
      <p className="mt-1 text-sm text-white/60">{w.focus}</p>
      <div className="mt-4 flex gap-2 text-xs font-semibold">
        <span className="chip bg-ink-2">{w.minutes} min</span>
        <span className="chip bg-ink-2">{w.level}</span>
        <span className="chip bg-ink-2">~{Math.round(w.minutes * w.kcalPerMin)} kcal</span>
      </div>

      <h2 className="mb-3 mt-6 text-base font-bold">Exercises ({w.exercises.length})</h2>
      <ol className="space-y-2">
        {w.exercises.map((e, i) => (
          <li key={e.name + i} className="card flex items-center gap-3 p-3">
            <span className="gloss-tile flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white">{i + 1}</span>
            <span className="flex-1 text-sm font-semibold">{e.name}</span>
            <span className="text-sm text-white/60">{target(e)}</span>
          </li>
        ))}
      </ol>

      <div className="sticky bottom-[calc(env(safe-area-inset-bottom)+6.5rem)] z-10 mt-6">
        <button onClick={onStart} className="btn-primary w-full py-4 text-base shadow-lg shadow-black/50">
          <Icon name="play" size={16} /> Start Workout
        </button>
      </div>

      {onDelete && (
        <button onClick={onDelete} className="mx-auto mt-4 flex items-center gap-1 text-xs text-white/40 underline">
          <Icon name="trash" size={12} /> Delete this workout
        </button>
      )}
    </div>
  );
}
