import { useEffect, useRef, useState, type Dispatch, type ReactNode, type SetStateAction } from "react";
import Icon from "../components/Icon";
import Ring from "../components/Ring";
import { dayKey, fmtTime, lastWeight, topPrs } from "../lib";
import { findWorkout, useApp, useNav } from "../store";
import type { Lift, Workout, WorkoutLog } from "../types";

interface S {
  ex: number; // exercise index
  set: number; // 1-based
  phase: "work" | "rest" | "done";
  rest: number; // rest seconds left
  /** Seconds left on a timed set, or null when its timer hasn't been started. */
  workLeft: number | null;
  elapsed: number; // seconds
  paused: boolean;
  setsDone: number;
  lifts: Lift[];
}

const MAX_WEIGHT = 2000; // lbs

const totalSets = (w: Workout) => w.exercises.reduce((n, e) => n + e.sets, 0);

/** Move on after a finished set (or finished rest). */
function advance(s: S, w: Workout): S {
  const e = w.exercises[s.ex];
  if (s.set < e.sets) return { ...s, set: s.set + 1, phase: "work", rest: 0, workLeft: null };
  if (s.ex + 1 < w.exercises.length) return { ...s, ex: s.ex + 1, set: 1, phase: "work", rest: 0, workLeft: null };
  return { ...s, phase: "done", rest: 0, workLeft: null };
}

function completeSet(s: S, w: Workout, lift: Lift | null): S {
  const e = w.exercises[s.ex];
  const next: S = { ...s, paused: false, workLeft: null, setsDone: s.setsDone + 1, lifts: lift ? [...s.lifts, lift] : s.lifts };
  const isLast = s.set === e.sets && s.ex === w.exercises.length - 1;
  if (isLast) return { ...next, phase: "done" };
  if (e.rest <= 0) return advance(next, w);
  return { ...next, phase: "rest", rest: e.rest };
}

/** Apply `dt` whole seconds of real time. */
function tick(p: S, w: Workout, dt: number): S {
  if (p.phase === "done" || p.paused || dt <= 0) return p;
  const q = { ...p, elapsed: p.elapsed + dt };
  if (q.phase === "rest") {
    const left = q.rest - dt;
    return left <= 0 ? advance(q, w) : { ...q, rest: left };
  }
  if (q.workLeft !== null) {
    const left = q.workLeft - dt;
    return left <= 0 ? completeSet(q, w, null) : { ...q, workLeft: left };
  }
  return q;
}

export default function Session() {
  const id = useNav((s) => s.sessionId)!;
  const end = useNav((s) => s.endSession);
  const logWorkout = useApp((s) => s.logWorkout);
  const w = findWorkout(id);

  // History as it was before this session, for "last weight" prefill and PR detection.
  const prior = useRef(useApp.getState().logs);

  const [s, setS] = useState<S>({ ex: 0, set: 1, phase: "work", rest: 0, workLeft: null, elapsed: 0, paused: false, setsDone: 0, lifts: [] });
  const [weights, setWeights] = useState<Record<number, string>>({});
  const [logged, setLogged] = useState(false);

  // Clock: measures real elapsed time and carries leftover milliseconds, so timers
  // stay exact even when the browser throttles or the phone locks.
  useEffect(() => {
    if (!w || s.phase === "done" || s.paused) return;
    let last = Date.now();
    let carry = 0;
    const t = setInterval(() => {
      const now = Date.now();
      carry += now - last;
      last = now;
      const dt = Math.floor(carry / 1000);
      if (dt > 0) {
        carry -= dt * 1000;
        setS((p) => tick(p, w, dt));
      }
    }, 250);
    return () => clearInterval(t);
  }, [s.phase, s.paused, w]);

  // A short buzz (where supported) when a rest or a timed set ends.
  const cue = useRef(`${s.phase}-${s.ex}-${s.set}`);
  useEffect(() => {
    const k = `${s.phase}-${s.ex}-${s.set}`;
    if (k !== cue.current) {
      cue.current = k;
      navigator.vibrate?.(s.phase === "done" ? [120, 80, 120] : 120);
    }
  }, [s.phase, s.ex, s.set]);

  // Keep the screen awake while working out (where supported).
  useEffect(() => {
    let lock: WakeLockSentinel | null = null;
    let cancelled = false;
    const acquire = async () => {
      if (lock && !lock.released) return;
      try {
        const l = (await navigator.wakeLock?.request("screen")) ?? null;
        if (cancelled) void l?.release().catch(() => {});
        else lock = l;
      } catch {
        /* unsupported or denied: fine */
      }
    };
    void acquire();
    const onVis = () => document.visibilityState === "visible" && void acquire();
    document.addEventListener("visibilitychange", onVis);
    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onVis);
      void lock?.release().catch(() => {});
    };
  }, []);

  // The workout was removed (e.g. a backup restore) while this screen was open.
  if (!w) {
    return (
      <Shell>
        <div className="flex flex-1 flex-col items-center justify-center text-center">
          <p className="text-white/70">This workout is no longer available.</p>
          <button onClick={end} className="btn-primary mt-6">
            Back
          </button>
        </div>
      </Shell>
    );
  }

  return <Running w={w} s={s} setS={setS} weights={weights} setWeights={setWeights} logged={logged} setLogged={setLogged} prior={prior.current} end={end} logWorkout={logWorkout} />;
}

interface RunningProps {
  w: Workout;
  s: S;
  setS: Dispatch<SetStateAction<S>>;
  weights: Record<number, string>;
  setWeights: Dispatch<SetStateAction<Record<number, string>>>;
  logged: boolean;
  setLogged: (v: boolean) => void;
  prior: WorkoutLog[];
  end: () => void;
  logWorkout: (l: Omit<WorkoutLog, "id">) => void;
}

function Running({ w, s, setS, weights, setWeights, logged, setLogged, prior, end, logWorkout }: RunningProps) {
  const minutes = Math.min(600, Math.max(1, Math.round(s.elapsed / 60)));
  const calories = Math.round(minutes * w.kcalPerMin);

  // Log once when finished (guarded so StrictMode / re-renders can't double-log).
  useEffect(() => {
    if (s.phase === "done" && !logged) {
      setLogged(true);
      logWorkout({ workoutId: w.id, name: w.name, date: dayKey(), minutes, calories, ...(s.lifts.length ? { lifts: s.lifts } : {}) });
    }
  }, [s.phase, s.lifts, logged, logWorkout, w.id, w.name, minutes, calories]);

  const quit = () => {
    if (s.setsDone > 0 && !window.confirm("End this workout? The sets you've finished will be saved.")) return;
    if (s.setsDone === 0 && s.elapsed >= 30 && !window.confirm("End this workout? Nothing has been completed yet, so nothing will be saved.")) return;
    // Save partial progress only if something was actually completed.
    if (s.setsDone > 0 && !logged) {
      logWorkout({ workoutId: w.id, name: w.name, date: dayKey(), minutes, calories, ...(s.lifts.length ? { lifts: s.lifts } : {}) });
    }
    end();
  };

  if (s.phase === "done") {
    // New PRs: heaviest lift this session beats the previous best for that exercise.
    const before = new Map(topPrs(prior, 1000).map((p) => [p.exercise, p.weight]));
    const now = topPrs([{ date: dayKey(), lifts: s.lifts }], 1000);
    const prs = now.filter((p) => before.has(p.exercise) && p.weight > (before.get(p.exercise) ?? 0));

    return (
      <Shell>
        <div className="animate-pop flex flex-1 flex-col items-center justify-center text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full border border-white/15 text-luna-light">
            <Icon name="check" size={26} />
          </div>
          <p className="eyebrow mt-8">Session complete</p>
          <h1 className="display mt-2 text-[40px]">{w.name}</h1>
          <div className="card mt-8 grid w-full max-w-xs grid-cols-3 divide-x divide-white/[0.07] py-4">
            <Summary label="Minutes" value={String(minutes)} />
            <Summary label="Calories" value={String(calories)} />
            <Summary label="Sets" value={String(s.setsDone)} />
          </div>
          {prs.length > 0 && (
            <div className="card mt-4 w-full max-w-xs p-5 text-left">
              <p className="eyebrow flex items-center gap-2 !text-moon">
                <Icon name="trophy" size={14} /> Personal record{prs.length > 1 ? "s" : ""}
              </p>
              <ul className="mt-2 space-y-1 text-sm">
                {prs.map((p) => (
                  <li key={p.exercise}>
                    {p.exercise}: <span className="font-medium">{p.weight} lbs</span> <span className="text-white/50">(was {before.get(p.exercise)})</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          <button onClick={end} className="btn-primary mt-8 w-full max-w-xs py-4 text-base">
            Done
          </button>
        </div>
      </Shell>
    );
  }

  const e = w.exercises[s.ex];
  const overall = s.setsDone / totalSets(w);
  const last = lastWeight(prior, e.name);
  const weightText = weights[s.ex] ?? (last ? String(last) : "");
  const weightNum = Number(weightText);
  const setWeight = (v: string) => setWeights((p) => ({ ...p, [s.ex]: v }));
  const weightOk = weightText.trim() === "" || (Number.isFinite(weightNum) && weightNum >= 0 && weightNum <= MAX_WEIGHT);
  const bump = (d: number) => setWeight(String(Math.min(MAX_WEIGHT, Math.max(0, (Number.isFinite(weightNum) ? weightNum : 0) + d))));

  const finishSet = () => {
    if (!weightOk) return;
    const lift: Lift | null = e.reps && weightNum > 0 ? { exercise: e.name, weight: Math.round(weightNum * 10) / 10, reps: e.reps } : null;
    setS((p) => completeSet(p, w, lift));
  };
  const timed = !e.reps && !!e.seconds;

  return (
    <Shell>
      <div className="flex items-center justify-between">
        <button onClick={quit} className="flex items-center gap-1 text-sm text-white/60" aria-label="End workout">
          <Icon name="x" size={18} /> End
        </button>
        <span className="text-sm font-semibold tabular-nums text-white/70">{fmtTime(s.elapsed)}</span>
        <button
          onClick={() => setS((p) => ({ ...p, paused: !p.paused }))}
          className="btn-ghost p-2.5"
          aria-label={s.paused ? "Resume" : "Pause"}
        >
          <Icon name={s.paused ? "play" : "pause"} size={16} />
        </button>
      </div>

      <div
        className="mt-3 h-2 overflow-hidden rounded-full bg-white/10 shadow-[inset_0_1px_2px_rgba(0,0,0,0.6)]"
        role="progressbar"
        aria-label="Workout progress"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(overall * 100)}
      >
        <div className="glow-fill h-full rounded-full transition-all" style={{ width: `${overall * 100}%` }} />
      </div>
      <p className="mt-2 text-center text-xs text-white/50">
        Exercise {s.ex + 1} of {w.exercises.length}
      </p>

      {s.phase === "rest" ? (
        <div className="flex flex-1 flex-col items-center justify-center">
          <p className="eyebrow">Rest</p>
          <div className="my-6">
            <Ring value={s.rest} max={Math.max(e.rest, s.rest)} size={230}>
              <span className="display text-[76px] tabular-nums">{s.rest}</span>
              <span className="eyebrow mt-3">seconds</span>
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
            <button className="btn-primary" onClick={() => setS((p) => ({ ...advance(p, w), paused: false }))}>
              Skip rest
            </button>
          </div>
          {s.paused && <p className="eyebrow mt-4 !text-moon">Paused</p>}
        </div>
      ) : (
        <div className="flex flex-1 flex-col items-center justify-center text-center">
          <p className="eyebrow">
            Set {s.set} of {e.sets}
          </p>
          <h1 className="display mt-4 break-words text-[44px]">{e.name}</h1>
          {timed && s.workLeft !== null ? (
            <div className="mt-6">
              <Ring value={s.workLeft} max={Math.max(e.seconds ?? 0, s.workLeft)} size={210}>
                <span className="display text-[68px] tabular-nums">{s.workLeft}</span>
                <span className="eyebrow mt-3">seconds left</span>
              </Ring>
            </div>
          ) : (
            <p className="mt-8">
              <span className="display text-[84px] tabular-nums">{e.reps ?? e.seconds ?? "Go"}</span>
              {(e.reps || e.seconds) && <span className="eyebrow ml-2">{e.reps ? "reps" : "seconds"}</span>}
            </p>
          )}

          {e.reps ? (
            <div className="mt-6 w-full max-w-xs">
              <label className="mb-1 block text-xs font-semibold text-white/50" htmlFor="weight">
                Weight (lbs){last ? ` · last time ${last}` : " · leave blank for bodyweight"}
              </label>
              <div className="flex items-center gap-2">
                <button className="btn-ghost px-4" onClick={() => bump(-5)} aria-label="Decrease weight">
                  <Icon name="minus" size={16} />
                </button>
                <input
                  id="weight"
                  className="input text-center font-serif text-2xl"
                  type="number"
                  inputMode="decimal"
                  min={0}
                  max={MAX_WEIGHT}
                  step="any"
                  placeholder="—"
                  aria-invalid={!weightOk}
                  value={weightText}
                  onChange={(ev) => setWeight(ev.target.value)}
                />
                <button className="btn-ghost px-4" onClick={() => bump(5)} aria-label="Increase weight">
                  <Icon name="plus" size={16} />
                </button>
              </div>
              {!weightOk && <p className="mt-1 text-xs text-red-400">Enter a weight between 0 and {MAX_WEIGHT} lbs.</p>}
            </div>
          ) : null}

          {timed && s.workLeft === null ? (
            <button
              onClick={() => setS((p) => ({ ...p, paused: false, workLeft: e.seconds ?? 0 }))}
              className="btn-primary mt-8 w-full max-w-xs py-4 text-base"
            >
              Start {e.seconds}-second timer
            </button>
          ) : (
            <button onClick={finishSet} disabled={!weightOk} className="btn-primary mt-8 w-full max-w-xs py-4 text-base disabled:opacity-40">
              {timed ? "Finish early" : "Complete set"}
            </button>
          )}
          {timed && s.workLeft === null && (
            <button onClick={finishSet} className="mt-3 text-xs text-white/50 underline">
              Mark set done without the timer
            </button>
          )}
          {s.paused && <p className="eyebrow mt-4 !text-moon">Paused</p>}
        </div>
      )}
    </Shell>
  );
}

function Shell({ children }: { children: ReactNode }) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Workout in progress"
      className="fixed inset-0 z-[60] flex justify-center bg-[#0a090d]"
    >
      <div className="flex w-full max-w-[430px] flex-col overflow-y-auto px-5 pb-[calc(env(safe-area-inset-bottom)+2rem)] pt-[calc(env(safe-area-inset-top)+1.5rem)]">
        {children}
      </div>
    </div>
  );
}

function Summary({ label, value }: { label: string; value: string }) {
  return (
    <div className="px-2">
      <div className="display text-[30px] tabular-nums">{value}</div>
      <div className="text-[11px] text-white/45">{label}</div>
    </div>
  );
}
