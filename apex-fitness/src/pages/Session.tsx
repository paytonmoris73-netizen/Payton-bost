import { useEffect, useRef, useState, type ReactNode } from "react";
import Icon from "../components/Icon";
import Ring from "../components/Ring";
import { dayKey, fmtTime, lastWeight, topPrs } from "../lib";
import { findWorkout, useApp, useNav } from "../store";
import type { Lift, Workout } from "../types";

interface S {
  ex: number; // exercise index
  set: number; // 1-based
  phase: "work" | "rest" | "done";
  rest: number; // seconds left
  elapsed: number; // seconds
  paused: boolean;
  setsDone: number;
  lifts: Lift[];
}

const totalSets = (w: Workout) => w.exercises.reduce((n, e) => n + e.sets, 0);

/** Move on after a finished set (or finished rest). */
function advance(s: S, w: Workout): S {
  const e = w.exercises[s.ex];
  if (s.set < e.sets) return { ...s, set: s.set + 1, phase: "work", rest: 0 };
  if (s.ex + 1 < w.exercises.length) return { ...s, ex: s.ex + 1, set: 1, phase: "work", rest: 0 };
  return { ...s, phase: "done", rest: 0 };
}

function completeSet(s: S, w: Workout, lift: Lift | null): S {
  const e = w.exercises[s.ex];
  const next = { ...s, setsDone: s.setsDone + 1, lifts: lift ? [...s.lifts, lift] : s.lifts };
  const isLast = s.set === e.sets && s.ex === w.exercises.length - 1;
  if (isLast) return { ...next, phase: "done" };
  if (e.rest <= 0) return advance(next, w);
  return { ...next, phase: "rest", rest: e.rest };
}

export default function Session() {
  const id = useNav((s) => s.sessionId)!;
  const end = useNav((s) => s.endSession);
  const logWorkout = useApp((s) => s.logWorkout);
  const w = findWorkout(id)!;

  // History as it was before this session, for "last weight" prefill and PR detection.
  const prior = useRef(useApp.getState().logs);

  const [s, setS] = useState<S>({ ex: 0, set: 1, phase: "work", rest: 0, elapsed: 0, paused: false, setsDone: 0, lifts: [] });
  const [weights, setWeights] = useState<Record<number, string>>({});
  const [logged, setLogged] = useState(false);

  // One-second tick. Uses real elapsed time, so a throttled/locked phone doesn't lose seconds.
  useEffect(() => {
    if (s.phase === "done" || s.paused) return;
    let last = Date.now();
    const t = setInterval(() => {
      const now = Date.now();
      const dt = Math.max(1, Math.round((now - last) / 1000));
      last = now;
      setS((p) => {
        if (p.phase === "done" || p.paused) return p;
        const q = { ...p, elapsed: p.elapsed + dt };
        if (q.phase === "rest") {
          const left = q.rest - dt;
          return left <= 0 ? advance(q, w) : { ...q, rest: left };
        }
        return q;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [s.phase, s.paused, w]);

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

  const minutes = Math.max(1, Math.round(s.elapsed / 60));
  const calories = Math.round(minutes * w.kcalPerMin);

  // Log once when finished (guarded so StrictMode / re-renders can't double-log).
  useEffect(() => {
    if (s.phase === "done" && !logged) {
      setLogged(true);
      logWorkout({ workoutId: w.id, name: w.name, date: dayKey(), minutes, calories, ...(s.lifts.length ? { lifts: s.lifts } : {}) });
    }
  }, [s.phase, s.lifts, logged, logWorkout, w.id, w.name, minutes, calories]);

  const quit = () => {
    // Save partial progress only if something was actually completed.
    if (s.setsDone > 0 && !logged) {
      logWorkout({ workoutId: w.id, name: w.name, date: dayKey(), minutes, calories, ...(s.lifts.length ? { lifts: s.lifts } : {}) });
    }
    end();
  };

  if (s.phase === "done") {
    // New PRs: heaviest lift this session beats the previous best for that exercise.
    const before = new Map(topPrs(prior.current, 1000).map((p) => [p.exercise, p.weight]));
    const now = topPrs([{ date: dayKey(), lifts: s.lifts }], 1000);
    const prs = now.filter((p) => before.has(p.exercise) && p.weight > (before.get(p.exercise) ?? 0));

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
          {prs.length > 0 && (
            <div className="mt-5 w-full max-w-xs rounded-2xl border border-gold/40 bg-gold/10 p-4 text-left">
              <p className="flex items-center gap-2 text-sm font-bold text-gold">
                <Icon name="trophy" size={16} /> New personal record{prs.length > 1 ? "s" : ""}!
              </p>
              <ul className="mt-2 space-y-1 text-sm">
                {prs.map((p) => (
                  <li key={p.exercise}>
                    {p.exercise}: <b>{p.weight} lbs</b> <span className="text-white/50">(was {before.get(p.exercise)})</span>
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
  const last = lastWeight(prior.current, e.name);
  const weightText = weights[s.ex] ?? (last ? String(last) : "");
  const weightNum = Number(weightText);
  const setWeight = (v: string) => setWeights((p) => ({ ...p, [s.ex]: v }));
  const bump = (d: number) => setWeight(String(Math.max(0, (Number.isFinite(weightNum) ? weightNum : 0) + d)));

  const finishSet = () => {
    const lift: Lift | null = e.reps && weightNum > 0 ? { exercise: e.name, weight: weightNum, reps: e.reps } : null;
    setS((p) => completeSet(p, w, lift));
  };

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
            <Ring value={s.rest} max={Math.max(e.rest, s.rest)} size={220} stroke={12}>
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
                  className="input text-center text-lg font-bold"
                  type="number"
                  inputMode="decimal"
                  min={0}
                  placeholder="—"
                  value={weightText}
                  onChange={(ev) => setWeight(ev.target.value)}
                />
                <button className="btn-ghost px-4" onClick={() => bump(5)} aria-label="Increase weight">
                  <Icon name="plus" size={16} />
                </button>
              </div>
            </div>
          ) : null}

          <button onClick={finishSet} className="btn-primary mt-8 w-full max-w-xs py-4 text-base">
            <Icon name="check" size={18} /> Complete set
          </button>
          {s.paused && <p className="mt-4 text-xs font-semibold text-gold">Paused</p>}
        </div>
      )}
    </Shell>
  );
}

function Shell({ children }: { children: ReactNode }) {
  return (
    <div className="fixed inset-0 z-[60] flex justify-center bg-black">
      <div className="flex w-full max-w-[430px] flex-col overflow-y-auto bg-ink px-5 pb-8 pt-6">{children}</div>
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
