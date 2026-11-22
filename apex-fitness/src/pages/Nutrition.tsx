import { useState } from "react";
import Icon from "../components/Icon";
import Modal from "../components/Modal";
import Ring from "../components/Ring";
import { MEAL_PRESETS } from "../data";
import { dayKey } from "../lib";
import { useApp } from "../store";

const num = (v: string) => Math.max(0, Math.round(Number(v) || 0));

export default function Nutrition() {
  const { meals, calorieGoal, proteinGoal, carbGoal, fatGoal, addMeal, removeMeal } = useApp();
  const [open, setOpen] = useState(false);

  const today = dayKey();
  const todays = meals.filter((m) => m.date === today);
  const sum = (k: "calories" | "protein" | "carbs" | "fat") => todays.reduce((s, m) => s + m[k], 0);
  const cals = sum("calories");
  const remaining = calorieGoal - cals;

  return (
    <div className="animate-fade-up space-y-6 px-5 pt-6">
      <h1 className="text-center text-xl font-extrabold">Nutrition</h1>

      <section className="flex flex-col items-center">
        <Ring value={cals} max={calorieGoal} size={210} stroke={14}>
          <Icon name="flame" size={22} className="text-apex" />
          <span className="text-4xl font-black tabular-nums">{cals.toLocaleString()}</span>
          <span className="text-xs text-white/50">/ {calorieGoal.toLocaleString()} Calories</span>
        </Ring>
        <p className="mt-3 text-sm text-white/60">
          {remaining >= 0 ? `${remaining.toLocaleString()} kcal remaining` : `${(-remaining).toLocaleString()} kcal over goal`}
        </p>
      </section>

      <section className="grid grid-cols-3 gap-3">
        <Macro label="Protein" value={sum("protein")} goal={proteinGoal} color="#ef4444" />
        <Macro label="Carbs" value={sum("carbs")} goal={carbGoal} color="#3b82f6" />
        <Macro label="Fats" value={sum("fat")} goal={fatGoal} color="#6bd34a" />
      </section>

      <section>
        <h2 className="mb-3 text-base font-bold">Your Meals</h2>
        {todays.length === 0 ? (
          <div className="card p-4 text-sm text-white/50">Nothing logged yet today.</div>
        ) : (
          <ul className="space-y-2">
            {todays.map((m) => (
              <li key={m.id} className="card flex items-center gap-3 p-3">
                <div className="flex-1">
                  <p className="text-sm font-bold">{m.name}</p>
                  <p className="text-xs text-white/50">
                    {m.calories} cal · {m.protein}g P · {m.carbs}g C · {m.fat}g F
                  </p>
                </div>
                <button onClick={() => removeMeal(m.id)} aria-label={`Remove ${m.name}`} className="rounded-full p-2 text-white/40 hover:text-white">
                  <Icon name="trash" size={16} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <button onClick={() => setOpen(true)} className="btn-primary w-full py-3.5 text-base">
        Add Meal <Icon name="plus" size={16} />
      </button>

      {open && (
        <AddMeal
          onClose={() => setOpen(false)}
          onAdd={(m) => {
            addMeal({ ...m, date: today });
            setOpen(false);
          }}
        />
      )}
    </div>
  );
}

function Macro({ label, value, goal, color }: { label: string; value: number; goal: number; color: string }) {
  const pct = Math.min(100, (value / goal) * 100);
  return (
    <div className="text-center">
      <div className="mx-auto mb-1 h-2 w-2 rounded-full" style={{ background: color }} />
      <div className="text-xl font-extrabold tabular-nums">{value}g</div>
      <div className="text-xs text-white/50">{label}</div>
      <div className="mx-auto mt-2 h-1 w-14 overflow-hidden rounded-full bg-ink-3">
        <div className="h-full" style={{ width: `${pct}%`, background: color }} />
      </div>
      <div className="mt-1 text-[10px] text-white/35">of {goal}g</div>
    </div>
  );
}

function AddMeal({ onClose, onAdd }: { onClose: () => void; onAdd: (m: { name: string; calories: number; protein: number; carbs: number; fat: number }) => void }) {
  const [f, setF] = useState({ name: "", calories: "", protein: "", carbs: "", fat: "" });
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => setF({ ...f, [k]: e.target.value });
  const valid = f.name.trim() && num(f.calories) > 0;

  return (
    <Modal title="Add Meal" onClose={onClose}>
      <p className="mb-2 text-xs font-semibold text-white/50">Quick add</p>
      <div className="no-scrollbar -mx-5 mb-4 flex gap-2 overflow-x-auto px-5">
        {MEAL_PRESETS.map((p) => (
          <button key={p.name} onClick={() => onAdd(p)} className="chip shrink-0 bg-ink-3 text-white/80 hover:bg-apex hover:text-black">
            {p.name} · {p.calories}
          </button>
        ))}
      </div>

      <form
        className="space-y-3"
        onSubmit={(e) => {
          e.preventDefault();
          if (!valid) return;
          onAdd({ name: f.name.trim(), calories: num(f.calories), protein: num(f.protein), carbs: num(f.carbs), fat: num(f.fat) });
        }}
      >
        <input className="input" placeholder="Meal name" value={f.name} onChange={set("name")} maxLength={40} />
        <div className="grid grid-cols-2 gap-3">
          <input className="input" type="number" inputMode="numeric" min={0} placeholder="Calories" value={f.calories} onChange={set("calories")} />
          <input className="input" type="number" inputMode="numeric" min={0} placeholder="Protein (g)" value={f.protein} onChange={set("protein")} />
          <input className="input" type="number" inputMode="numeric" min={0} placeholder="Carbs (g)" value={f.carbs} onChange={set("carbs")} />
          <input className="input" type="number" inputMode="numeric" min={0} placeholder="Fat (g)" value={f.fat} onChange={set("fat")} />
        </div>
        <button type="submit" disabled={!valid} className="btn-primary w-full disabled:opacity-40">
          Add Meal
        </button>
      </form>
    </Modal>
  );
}
