import { useEffect, useState } from "react";
import Icon from "../components/Icon";
import Ring from "../components/Ring";
import { workoutById } from "../data";
import { dayKey, fmtTime } from "../lib";
import { useApp, useNav } from "../store";
import type { Workout } from "../types";

interface S {
  ex: number; // exercise index
  set: number; // 1-based
  phase: "work" | "rest" | "done";
  rest: number; // seconds left
  elapsed: number; // seconds
  paused: boolean;
  setsDone: number;
}

const totalSets = (w: Workout) => w.exercises.reduce((n, e) => n + e.sets, 0);

/** Move on after a finished set (or finished rest). */
function advance(s: S, w: Workout): S {
  const e = w.exercises[s.ex];
  if (s.set < e.sets) return { ...s, set: s.set + 1, phase: "work", rest: 0 };
  if (s.ex + 1 < w.exercises.length) return { ...s, ex: s.ex + 1, set: 1, phase: "work", rest: 0 };
  return { ...s, phase: "done", rest: 0 };
}

function completeSet(s: S, w: Workout): S {
  const e = w.exercises[s.ex];
  const next = { ...s, setsDone: s.setsDone + 1 };
  const isLast = s.set === e.sets && s.ex === w.exercises.length - 1;
  if (isLast) return { ...next, phase: "done" };
  if (e.rest <= 0) return advance(next, w);
  return { ...next, phase: "rest", rest: e.rest };
}

export default function Session() {
  const id = useNav((s) => s.sessionId)!;
  const end = useNav((s) => s.endSession);
  const logWorkout = useApp((s) => s.logWorkout);
  const w = workoutById(id)!;

  const [s, setS] = useState<S>({ ex: 0, set: 1, phase: "work", rest: 0, elapsed: 0, paused: false, setsDone: 0 });
  const [logged, setLogged] = useState(false);

  // One-second tick: elapsed time, plus rest countdown.
  useEffect(() => {
    if (s.phase === "done" || s.paused) return;
    const t = setInterval(() => {
      setS((p) => {
        if (p.phase === "done" || p.paused) return p;
        const q = { ...p, elapsed: p.elapsed + 1 };
        if (q.phase === "rest") {
          const left = q.rest - 1;
          return left <= 0 ? advance(q, w) : { ...q, rest: left };
        }
        return q;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [s.phase, s.paused, w]);

  const minutes = Math.max(1, Math.round(s.elapsed / 60));
  const calories = Math.round(minutes * w.kcalPerMin);

  // Log once when finished (guarded so StrictMode / re-renders can't double-log).
  useEffect(() => {
    if (s.phase === "done" && !logged) {
      setLogged(true);
      logWorkout({ workoutId: w.id, name: w.name, date: dayKey(), minutes, calories });
    }
  }, [s.phase, logged, logWorkout, w.id, w.name, minutes, calories]);

  const quit = () => {
    // Save partial progress only if something was actually completed.
    if (s.setsDone > 0 && !logged) {
      logWorkout({ workoutId: w.id, name: w.name, date: dayKey(), minutes, calories });
    }
    end();
  };

  if (s.phase === "done") {
    return (
      <Shell>
        <div className="animate-pop flex flex-1 flex-col items-center justify-center text-center">
          <div className="flex h-24 w-24 items-center justify-center rounded-full bg-lime-apex/15 text-lime-apex">
            <Icon name="check" size={48} strokeWidth={3} />
          </div>
          <h1 className="mt-6 text-3xl font-extrabold">Workout complete!</h1>
          <p className="mt-1 text-white/60">{w.name}</p>
          <div className="mt-8 grid w-full max-w-xs grid-cols-3 gap-3">
            <Summary label="Minutes" value={String(minutes)} />
            <Summary label="Calories" value={String(calories)} />
            <Summary label="Sets" value={String(s.setsDone)} />
          </div>
          <button onClick={end} className="btn-primary mt-10 w-full max-w-xs py-4 text-base">
            Done
          </button>
        </div>
      </Shell>
    );
  }

  const e = w.exercises[s.ex];
  const overall = s.setsDone / totalSets(w);

  return (
    <Shell>
      <div className="flex items-center justify-between">
        <button onClick={quit} className="flex items-center gap-1 text-sm text-white/60" aria-label="End workout">
          <Icon name="x" size={18} /> End
        </button>
        <span className="text-sm font-semibold tabular-nums text-white/70">{fmtTime(s.elapsed)}</span>
        <button
          onClick={() => setS((p) => ({ ...p, paused: !p.paused }))}
          className="rounded-full bg-ink-2 p-2"
          aria-label={s.paused ? "Resume" : "Pause"}
        >
          <Icon name={s.paused ? "play" : "pause"} size={16} />
        </button>
      </div>

      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-ink-3">
        <div className="h-full bg-apex transition-all" style={{ width: `${overall * 100}%` }} />
      </div>
      <p className="mt-2 text-center text-xs text-white/50">
        Exercise {s.ex + 1} of {w.exercises.length}
      </p>

      {s.phase === "rest" ? (
        <div className="flex flex-1 flex-col items-center justify-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-lime-apex">Rest</p>
          <div className="my-6">
            <Ring value={s.rest} max={e.rest} size={220} stroke={12}>
              <span className="text-6xl font-black tabular-nums">{s.rest}</span>
              <span className="text-xs text-white/50">seconds</span>
            </Ring>
          </div>
          <p className="text-sm text-white/60">
            Up next:{" "}
            <span className="font-semibold text-white">
              {s.set < e.sets ? `${e.name} — set ${s.set + 1}` : w.exercises[s.ex + 1]?.name}
            </span>
          </p>
          <div className="mt-8 flex gap-3">
            <button className="btn-ghost" onClick={() => setS((p) => ({ ...p, rest: p.rest + 15 }))}>
              +15s
            </button>
            <button className="btn-primary" onClick={() => setS((p) => advance(p, w))}>
              <Icon name="skip" size={14} /> Skip rest
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-1 flex-col items-center justify-center text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-apex">
            Set {s.set} of {e.sets}
          </p>
          <h1 className="mt-3 text-4xl font-black leading-tight">{e.name}</h1>
          <p className="mt-6 text-6xl font-black text-apex">
            {e.reps ? e.reps : e.seconds}
            <span className="ml-2 text-2xl font-bold text-white/50">{e.reps ? "reps" : "sec"}</span>
          </p>
          <button onClick={() => setS((p) => completeSet(p, w))} className="btn-primary mt-12 w-full max-w-xs py-4 text-base">
            <Icon name="check" size={18} /> Complete set
          </button>
          {s.paused && <p className="mt-4 text-xs font-semibold text-gold">Paused</p>}
        </div>
      )}
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-[60] flex justify-center bg-black">
      <div className="flex w-full max-w-[430px] flex-col bg-ink px-5 pb-8 pt-6">{children}</div>
    </div>
  );
}

function Summary({ label, value }: { label: string; value: string }) {
  return (
    <div className="card py-4">
      <div className="text-2xl font-extrabold">{value}</div>
      <div className="text-[11px] text-white/50">{label}</div>
    </div>
  );
}
