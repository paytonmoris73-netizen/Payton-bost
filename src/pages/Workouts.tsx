import { useMemo, useState } from "react";
import { WORKOUTS, type Goal, type Level } from "../data/workouts";
import { WorkoutCard } from "../components/WorkoutCard";

type LevelFilter = "all-levels" | Level;
type FocusFilter = "any" | Goal;

const LEVEL_FILTERS: { id: LevelFilter; label: string }[] = [
  { id: "all-levels", label: "All" },
  { id: "beginner", label: "Beginner" },
  { id: "intermediate", label: "Intermediate" },
  { id: "advanced", label: "Advanced" },
];

const FOCUS_FILTERS: { id: FocusFilter; label: string }[] = [
  { id: "any", label: "Any goal" },
  { id: "strength", label: "Strength" },
  { id: "fat-loss", label: "Fat Loss" },
  { id: "endurance", label: "Endurance" },
  { id: "mobility", label: "Mobility" },
];

export function WorkoutsPage() {
  const [level, setLevel] = useState<LevelFilter>("all-levels");
  const [focus, setFocus] = useState<FocusFilter>("any");
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return WORKOUTS.filter((w) => {
      if (level !== "all-levels" && w.level !== level && w.level !== "all") return false;
      if (focus !== "any" && w.focus !== focus) return false;
      if (q && !`${w.name} ${w.tagline}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [level, focus, query]);

  return (
    <div className="mx-auto max-w-4xl">
      <header>
        <h1 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">Workouts</h1>
        <p className="mt-1 text-sm text-cream-dim">
          {WORKOUTS.length} workouts for every goal and level.
        </p>
      </header>

      {/* Search */}
      <div className="relative mt-5">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search workouts…"
          className="w-full rounded-xl border border-line bg-ink-850 px-4 py-3 text-sm font-semibold outline-none transition-colors placeholder:text-cream-faint focus:border-gold-500/60 focus:ring-2 focus:ring-gold-500/20"
        />
      </div>

      {/* Filters */}
      <div className="no-scrollbar mt-4 flex gap-2 overflow-x-auto pb-1">
        {LEVEL_FILTERS.map((f) => (
          <button
            key={f.id}
            onClick={() => setLevel(f.id)}
            className={`chip shrink-0 ${level === f.id ? "chip-active" : "hover:text-cream"}`}
          >
            {f.label}
          </button>
        ))}
        <span className="mx-1 w-px shrink-0 self-stretch bg-line" />
        {FOCUS_FILTERS.map((f) => (
          <button
            key={f.id}
            onClick={() => setFocus(f.id)}
            className={`chip shrink-0 ${focus === f.id ? "chip-active" : "hover:text-cream"}`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Grid */}
      {filtered.length > 0 ? (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((w) => (
            <WorkoutCard key={w.id} workout={w} />
          ))}
        </div>
      ) : (
        <div className="card mt-6 px-6 py-14 text-center">
          <div className="font-display text-lg font-bold">No workouts match</div>
          <p className="mt-1 text-sm text-cream-dim">Try a different search or clear the filters.</p>
          <button
            onClick={() => {
              setQuery("");
              setLevel("all-levels");
              setFocus("any");
            }}
            className="mt-4 text-sm font-bold text-gold-400 hover:text-gold-300"
          >
            Clear filters
          </button>
        </div>
      )}
    </div>
  );
}
