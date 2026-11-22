import { useState } from "react";
import Icon from "../components/Icon";
import Modal from "../components/Modal";
import { EXERCISE_LIBRARY } from "../data";
import { uid } from "../lib";
import type { Category, Exercise, Level, Workout } from "../types";

const CATEGORIES: Category[] = ["Strength", "Cardio", "Mobility"];
const LEVELS: Level[] = ["Beginner", "Intermediate", "Advanced"];
const KCAL: Record<Category, number> = { Strength: 7, Cardio: 10, Mobility: 3 };

const MAX_EXERCISES = 30;
const estimateMinutes = (items: Exercise[]) =>
  Math.min(600, Math.max(5, Math.round(items.reduce((n, e) => n + e.sets * ((e.seconds ?? 40) + e.rest), 0) / 60)));

interface Props {
  onClose: () => void;
  onSave: (w: Workout) => void;
}

export default function WorkoutBuilder({ onClose, onSave }: Props) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState<Category>("Strength");
  const [level, setLevel] = useState<Level>("Intermediate");
  // Each row carries a stable key so removing one doesn't shuffle the others.
  const [items, setItems] = useState<(Exercise & { key: string })[]>([]);
  const [picking, setPicking] = useState(false);

  const patch = (i: number, p: Partial<Exercise>) => setItems((xs) => xs.map((x, j) => (j === i ? { ...x, ...p } : x)));
  const valid = name.trim().length > 0 && items.length > 0;

  const save = () => {
    if (!valid) return;
    onSave({
      id: `custom-${uid()}`,
      name: name.trim().slice(0, 40),
      category,
      level,
      minutes: estimateMinutes(items),
      focus: "Custom workout",
      kcalPerMin: KCAL[category],
      exercises: items.map(({ key: _key, ...e }) => e),
      custom: true,
    });
  };

  const cancel = () => {
    if ((name.trim() || items.length > 0) && !window.confirm("Discard this workout?")) return;
    onClose();
  };

  return (
    <div className="animate-fade-up pt-safe px-5">
      <button onClick={cancel} className="mb-4 flex items-center gap-1 text-sm text-white/60">
        <Icon name="chevL" size={18} /> Cancel
      </button>
      <h1 className="display text-[38px]">New workout</h1>

      <label className="mt-5 block text-xs font-semibold text-white/60" htmlFor="wname">
        Name
      </label>
      <input id="wname" className="input mt-1" placeholder="e.g. Monday Push Day" maxLength={40} value={name} onChange={(e) => setName(e.target.value)} />

      <Pills label="Type" options={CATEGORIES} value={category} onChange={setCategory} />
      <Pills label="Level" options={LEVELS} value={level} onChange={setLevel} />

      <h2 className="eyebrow mb-3 mt-6">
        Exercises <span className="text-white/40">({items.length})</span>
      </h2>
      <ol className="space-y-3">
        {items.map((e, i) => (
          <li key={e.key} className="card p-3">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-medium">{e.name}</span>
              <button onClick={() => setItems((xs) => xs.filter((_, j) => j !== i))} aria-label={`Remove ${e.name}`} className="p-1 text-white/40">
                <Icon name="trash" size={16} />
              </button>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <Stepper label="Sets" value={e.sets} min={1} max={10} step={1} onChange={(v) => patch(i, { sets: v })} />
              {e.reps !== undefined ? (
                <Stepper label="Reps" value={e.reps} min={1} max={100} step={1} onChange={(v) => patch(i, { reps: v })} />
              ) : (
                <Stepper label="Seconds" value={e.seconds ?? 30} min={5} max={600} step={5} onChange={(v) => patch(i, { seconds: v })} />
              )}
              <Stepper label="Rest (s)" value={e.rest} min={0} max={300} step={15} onChange={(v) => patch(i, { rest: v })} />
            </div>
          </li>
        ))}
      </ol>

      <button onClick={() => setPicking(true)} disabled={items.length >= MAX_EXERCISES} className="btn-ghost mt-3 w-full disabled:opacity-40">
        <Icon name="plus" size={16} /> {items.length >= MAX_EXERCISES ? `Max ${MAX_EXERCISES} exercises` : "Add exercise"}
      </button>

      <div className="sticky bottom-[calc(env(safe-area-inset-bottom)+5.5rem)] z-10 mt-6">
        <button onClick={save} disabled={!valid} className="btn-primary w-full py-4 text-base shadow-lg shadow-black/50 disabled:opacity-40">
          Save workout{items.length ? ` · ~${estimateMinutes(items)} min` : ""}
        </button>
        {!valid && (
          <p className="mt-2 text-center text-xs text-white/50">
            {!name.trim() ? "Give your workout a name" : "Add at least one exercise"} to save it.
          </p>
        )}
      </div>

      {picking && (
        <Picker
          onClose={() => setPicking(false)}
          onPick={(ex) => {
            setItems((xs) => [...xs, { ...ex, key: uid() }]);
            setPicking(false);
          }}
          category={category}
        />
      )}
    </div>
  );
}

function Pills<T extends string>({ label, options, value, onChange }: { label: string; options: T[]; value: T; onChange: (v: T) => void }) {
  return (
    <div className="mt-4">
      <p className="mb-1 text-xs font-semibold text-white/60">{label}</p>
      <div className="flex gap-2">
        {options.map((o) => (
          <button key={o} onClick={() => onChange(o)} className={`chip ${value === o ? "bg-luna text-black" : "bg-ink-2 text-white/70"}`}>
            {o}
          </button>
        ))}
      </div>
    </div>
  );
}

function Stepper({ label, value, min, max, step, onChange }: { label: string; value: number; min: number; max: number; step: number; onChange: (v: number) => void }) {
  const clamp = (v: number) => Math.min(max, Math.max(min, v));
  return (
    <div className="text-center">
      <div className="mb-1 text-[10px] text-white/40">{label}</div>
      <div className="flex items-center justify-between rounded-xl border border-white/10 bg-black/30">
        <button className="px-2.5 py-2" onClick={() => onChange(clamp(value - step))} aria-label={`Decrease ${label}`}>
          <Icon name="minus" size={14} />
        </button>
        <span className="text-sm font-medium tabular-nums">{value}</span>
        <button className="px-2.5 py-2" onClick={() => onChange(clamp(value + step))} aria-label={`Increase ${label}`}>
          <Icon name="plus" size={14} />
        </button>
      </div>
    </div>
  );
}

function Picker({ onClose, onPick, category }: { onClose: () => void; onPick: (e: Exercise) => void; category: Category }) {
  const [q, setQ] = useState("");
  const query = q.trim().toLowerCase();
  const matches = EXERCISE_LIBRARY.filter((x) => x.name.toLowerCase().includes(query) || x.group.toLowerCase().includes(query));
  const exact = EXERCISE_LIBRARY.some((x) => x.name.toLowerCase() === query);
  const restDefault = category === "Cardio" ? 20 : category === "Mobility" ? 10 : 60;

  const make = (name: string, timed?: boolean): Exercise =>
    timed
      ? { name, sets: 3, seconds: 30, rest: restDefault }
      : { name, sets: 3, reps: 10, rest: restDefault };

  return (
    <Modal title="Add exercise" onClose={onClose}>
      <input className="input mb-3" placeholder="Search or type your own…" value={q} onChange={(e) => setQ(e.target.value)} maxLength={40} aria-label="Search exercises" />
      <ul className="max-h-72 space-y-1 overflow-y-auto">
        {query && !exact && (
          <li>
            <button onClick={() => onPick(make(q.trim().slice(0, 40)))} className="flex w-full items-center gap-2 rounded-xl border border-white/10 px-3 py-2.5 text-left text-sm font-medium text-luna-light">
              <Icon name="plus" size={14} /> Add “{q.trim()}”
            </button>
          </li>
        )}
        {matches.map((x) => (
          <li key={x.name}>
            <button onClick={() => onPick(make(x.name, x.timed))} className="flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm hover:bg-ink-3">
              <span className="font-semibold">{x.name}</span>
              <span className="text-xs text-white/40">{x.group}</span>
            </button>
          </li>
        ))}

      </ul>
    </Modal>
  );
}
