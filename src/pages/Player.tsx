import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import {
  getWorkout,
  workoutSeconds,
  circuitSeconds,
  workoutMinutes,
  workoutCalories,
} from "../data/workouts";
import { useApp, type CompletedSession } from "../state/AppContext";
import { Icon } from "../components/Icon";
import { CoverArt } from "../components/CoverArt";
import { Button, ConfirmDialog, ProgressRing } from "../components/ui";
import { cues } from "../lib/audio";

type Phase = "ready" | "countdown" | "work" | "rest" | "done";

const COUNTDOWN_FROM = 3;

export function PlayerPage() {
  const { id } = useParams();
  const workout = getWorkout(id);
  const navigate = useNavigate();
  const { state, completeWorkout, pushToast } = useApp();

  const [phase, setPhase] = useState<Phase>("ready");
  const [index, setIndex] = useState(0);
  const [round, setRound] = useState(0);
  const [remaining, setRemaining] = useState(0);
  const [paused, setPaused] = useState(false);
  const [muted, setMuted] = useState(false);
  const [confirmQuit, setConfirmQuit] = useState(false);
  const [result, setResult] = useState<CompletedSession | null>(null);

  const exercises = useMemo(() => workout?.exercises ?? [], [workout]);
  const exercise = exercises[index];
  const totalSec = useMemo(() => (workout ? workoutSeconds(workout) : 0), [workout]);
  const lapSec = useMemo(() => (workout ? circuitSeconds(workout) : 0), [workout]);
  const rounds = workout?.rounds ?? 1;

  // Each phase may only advance once, even if effects re-run.
  const advancedFor = useRef<string>("");
  const savedRef = useRef(false);
  const mutedRef = useRef(muted);
  mutedRef.current = muted;

  const sound = useCallback((fn: () => void) => {
    if (!mutedRef.current) fn();
  }, []);

  /* ---------- Phase transitions ---------- */

  const enterWork = useCallback(
    (i: number) => {
      setIndex(i);
      setPhase("work");
      setRemaining(exercises[i].work);
      sound(cues.go);
    },
    [exercises, sound],
  );

  const advance = useCallback(() => {
    if (phase === "countdown") {
      enterWork(0);
      return;
    }
    if (phase === "work" && exercise && exercise.rest > 0) {
      setPhase("rest");
      setRemaining(exercise.rest);
      sound(cues.rest);
      return;
    }
    if (index + 1 < exercises.length) {
      enterWork(index + 1);
      return;
    }
    if (round + 1 < rounds) {
      setRound(round + 1);
      enterWork(0);
      return;
    }
    setPhase("done");
    sound(cues.finish);
  }, [phase, exercise, index, exercises.length, round, rounds, enterWork, sound]);

  /* ---------- Clock ---------- */

  const running = (phase === "countdown" || phase === "work" || phase === "rest") && !paused && !confirmQuit;

  useEffect(() => {
    if (!running) return;
    const t = window.setInterval(() => setRemaining((r) => Math.max(0, r - 1)), 1000);
    return () => window.clearInterval(t);
  }, [running]);

  // Countdown blips on the final seconds of a phase.
  useEffect(() => {
    if (!running) return;
    if (phase === "countdown" && remaining > 0) sound(cues.tick);
    else if ((phase === "work" || phase === "rest") && remaining > 0 && remaining <= 3) {
      sound(cues.tick);
    }
  }, [remaining, phase, running, sound]);

  useEffect(() => {
    if (remaining !== 0 || paused || confirmQuit) return;
    if (phase !== "countdown" && phase !== "work" && phase !== "rest") return;
    const key = `${phase}:${round}:${index}`;
    if (advancedFor.current === key) return;
    advancedFor.current = key;
    advance();
  }, [remaining, phase, round, index, paused, confirmQuit, advance]);

  /* ---------- Save the session once ---------- */

  useEffect(() => {
    if (phase !== "done" || !workout || savedRef.current) return;
    savedRef.current = true;
    setResult(
      completeWorkout({
        workoutId: workout.id,
        workoutName: workout.name,
        minutes: workoutMinutes(workout),
        calories: workoutCalories(workout),
      }),
    );
  }, [phase, workout, completeWorkout]);

  /* ---------- Keep the screen awake while training ---------- */

  useEffect(() => {
    if (!running) return;
    type Sentinel = { release: () => Promise<void> };
    let sentinel: Sentinel | null = null;
    let cancelled = false;
    const wakeLock = (navigator as Navigator & {
      wakeLock?: { request: (t: "screen") => Promise<Sentinel> };
    }).wakeLock;

    void (async () => {
      try {
        const s = await wakeLock?.request("screen");
        if (cancelled) void s?.release();
        else sentinel = s ?? null;
      } catch {
        // Not supported, or denied — the timer still works.
      }
    })();

    return () => {
      cancelled = true;
      void sentinel?.release().catch(() => {});
    };
  }, [running]);

  /* ---------- Controls ---------- */

  const start = useCallback(() => {
    cues.unlock();
    advancedFor.current = "";
    setRound(0);
    setIndex(0);
    setPhase("countdown");
    setRemaining(COUNTDOWN_FROM);
  }, []);

  const skip = useCallback(() => {
    if (phase !== "work" && phase !== "rest") return;
    advancedFor.current = `${phase}:${round}:${index}`;
    advance();
  }, [phase, round, index, advance]);

  const restart = useCallback(() => {
    if (phase !== "work" && phase !== "rest") return;
    const target = phase === "work" && remaining === exercises[index]?.work && index > 0 ? index - 1 : index;
    advancedFor.current = "";
    enterWork(target);
  }, [phase, remaining, exercises, index, enterWork]);

  // Keyboard shortcuts for the active session.
  useEffect(() => {
    if (phase !== "work" && phase !== "rest" && phase !== "countdown") return;
    const onKey = (e: KeyboardEvent) => {
      if (confirmQuit) {
        if (e.key === "Escape") setConfirmQuit(false);
        return;
      }
      if (e.key === " " || e.key === "Spacebar") {
        e.preventDefault();
        setPaused((p) => !p);
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        skip();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        restart();
      } else if (e.key === "Escape") {
        e.preventDefault();
        setConfirmQuit(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [phase, confirmQuit, skip, restart]);

  if (!workout) return <Navigate to="/app/workouts" replace />;
  if (workout.pro && !state.premium) return <Navigate to="/app/store" replace />;

  /* ---------- Ready ---------- */

  if (phase === "ready") {
    return (
      <Shell>
        <div className="flex flex-1 flex-col items-center justify-center text-center">
          <div className="relative h-32 w-32 overflow-hidden rounded-3xl shadow-glow">
            <CoverArt
              seed={workout.id}
              emblem={workout.emblem}
              from={workout.tint.from}
              to={workout.tint.to}
              className="absolute inset-0 h-full w-full"
            />
          </div>
          <h1 className="mt-6 font-display text-3xl font-bold tracking-tight">{workout.name}</h1>
          <p className="mt-2 max-w-xs text-sm leading-relaxed text-cream-dim">
            {rounds > 1
              ? `${exercises.length} exercises × ${rounds} rounds`
              : `${exercises.length} exercises`}
            , about {workoutMinutes(workout)} minutes. Clear some space and grab water.
          </p>
          <Button size="lg" className="mt-8 w-full max-w-xs" onClick={start}>
            <Icon name="play" className="h-5 w-5" />
            Begin
          </Button>
          <Link
            to={`/app/workouts/${workout.id}`}
            className="mt-4 text-sm font-semibold text-cream-faint hover:text-cream-dim"
          >
            Back to details
          </Link>
        </div>
      </Shell>
    );
  }

  /* ---------- Get-ready countdown ---------- */

  if (phase === "countdown") {
    return (
      <Shell>
        <div className="flex flex-1 flex-col items-center justify-center text-center">
          <div className="text-[11px] font-extrabold uppercase tracking-[0.22em] text-gold-400">
            Get ready
          </div>
          <div
            key={remaining}
            className="mt-4 font-display text-[120px] font-bold leading-none gold-text"
            style={{ animation: "fadeUp 0.3s cubic-bezier(0.22, 1, 0.36, 1) both" }}
          >
            {remaining === 0 ? "GO" : remaining}
          </div>
          <p className="mt-4 text-sm text-cream-dim">
            First up: <span className="font-bold text-cream">{exercises[0]?.name}</span>
          </p>
        </div>
      </Shell>
    );
  }

  /* ---------- Done ---------- */

  if (phase === "done") {
    return (
      <Shell>
        <div className="flex flex-1 flex-col items-center justify-center text-center">
          <span className="flex h-24 w-24 items-center justify-center rounded-full gold-fill text-ink-950 shadow-glow">
            <Icon name="check" className="h-12 w-12" />
          </span>
          <h1 className="mt-6 font-display text-3xl font-bold tracking-tight">
            Workout <span className="gold-text">complete</span>
          </h1>
          <p className="mt-2 text-sm text-cream-dim">
            {workout.name} is in the books. Strong work.
          </p>
          <div className="mt-8 grid w-full max-w-sm grid-cols-3 gap-3">
            <Stat value={String(workoutMinutes(workout))} label="Minutes" />
            <Stat value={String(workoutCalories(workout))} label="Calories" />
            <Stat value={`+${result?.xp ?? 0}`} label="XP" gold />
          </div>
          <Button
            size="lg"
            className="mt-8 w-full max-w-xs"
            onClick={() => {
              pushToast(`+${result?.xp ?? 0} XP earned`, `${workout.name} complete`);
              navigate("/app/home");
            }}
          >
            Done
          </Button>
          <Link
            to="/app/progress"
            className="mt-4 text-sm font-semibold text-gold-400 hover:text-gold-300"
          >
            See your progress
          </Link>
        </div>
      </Shell>
    );
  }

  /* ---------- Active ---------- */

  const isRest = phase === "rest";
  const phaseTotal = isRest ? exercise?.rest ?? 0 : exercise?.work ?? 0;
  const upNext = isRest ? exercises[index + 1] ?? null : null;

  let elapsed = round * lapSec;
  for (let i = 0; i < index; i++) elapsed += exercises[i].work + exercises[i].rest;
  if (isRest && exercise) elapsed += exercise.work;
  elapsed += Math.max(0, phaseTotal - remaining);
  const overall = totalSec > 0 ? elapsed / totalSec : 0;

  return (
    <Shell>
      <div className="flex items-center justify-between gap-3">
        <button
          onClick={() => setConfirmQuit(true)}
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-line bg-ink-800 text-cream-dim transition-colors hover:text-cream"
          aria-label="Quit workout"
        >
          <Icon name="x" className="h-4 w-4" />
        </button>
        <div className="min-w-0 text-center">
          <div className="truncate text-[11px] font-extrabold uppercase tracking-[0.18em] text-cream-faint">
            {workout.name}
          </div>
          <div className="text-xs font-semibold text-cream-dim">
            {rounds > 1 && <span className="text-gold-400">Round {round + 1}/{rounds} · </span>}
            Exercise {index + 1} of {exercises.length}
          </div>
        </div>
        <button
          onClick={() => setMuted((m) => !m)}
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-line bg-ink-800 text-cream-dim transition-colors hover:text-cream"
          aria-label={muted ? "Unmute cues" : "Mute cues"}
          aria-pressed={muted}
        >
          <Icon name={muted ? "sound-off" : "sound-on"} className="h-4 w-4" />
        </button>
      </div>

      {/* Overall progress */}
      <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-ink-700">
        <div
          className="h-full gold-fill transition-[width] duration-700"
          style={{ width: `${Math.round(overall * 100)}%` }}
        />
      </div>

      {/* Circuit dots */}
      <div className="mt-3 flex items-center justify-center gap-1.5">
        {exercises.map((ex, i) => (
          <span
            key={`${ex.name}-${i}`}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              i < index
                ? "w-1.5 bg-gold-600"
                : i === index
                  ? "w-5 gold-fill"
                  : "w-1.5 bg-ink-700"
            }`}
          />
        ))}
      </div>

      <div className="flex flex-1 flex-col items-center justify-center py-6 text-center">
        <div
          className={`text-[11px] font-extrabold uppercase tracking-[0.22em] ${
            isRest ? "text-sky-300" : "text-gold-400"
          }`}
        >
          {isRest ? "Rest" : "Work"}
        </div>
        <h1 className="mt-2 max-w-sm font-display text-3xl font-bold leading-tight tracking-tight text-balance">
          {isRest ? "Breathe and recover" : exercise?.name}
        </h1>
        {!isRest && exercise && (
          <p className="mt-2 max-w-xs text-sm text-cream-dim">{exercise.cue}</p>
        )}

        <div className="mt-8">
          <ProgressRing
            progress={phaseTotal > 0 ? remaining / phaseTotal : 0}
            size={210}
            stroke={13}
            trackColor={isRest ? "#1b2430" : "#272217"}
          >
            <span
              className={`font-display text-6xl font-bold tabular-nums transition-opacity ${
                paused ? "animate-pulse-soft" : ""
              }`}
              aria-live="off"
            >
              {remaining}
            </span>
            <span className="text-xs font-semibold text-cream-faint">
              {paused ? "paused" : "seconds"}
            </span>
          </ProgressRing>
        </div>

        <div className="sr-only" aria-live="polite">
          {isRest ? "Rest" : exercise?.name}, {remaining} seconds remaining
        </div>

        {upNext && (
          <div className="mt-8 text-sm text-cream-dim">
            Up next: <span className="font-bold text-cream">{upNext.name}</span>
          </div>
        )}
      </div>

      <div className="flex items-center justify-center gap-4 pb-2">
        <button
          onClick={restart}
          className="flex h-12 w-12 items-center justify-center rounded-full border border-line bg-ink-800 text-cream-dim transition-colors hover:text-cream"
          aria-label="Previous exercise"
        >
          <Icon name="arrow-left" className="h-5 w-5" />
        </button>
        <button
          onClick={() => setPaused((p) => !p)}
          className="flex h-16 w-16 items-center justify-center rounded-full gold-fill text-ink-950 shadow-glow transition-transform hover:scale-105 active:scale-95"
          aria-label={paused ? "Resume" : "Pause"}
        >
          <Icon name={paused ? "play" : "pause"} className="h-7 w-7" />
        </button>
        <button
          onClick={skip}
          className="flex h-12 w-12 items-center justify-center rounded-full border border-line bg-ink-800 text-cream-dim transition-colors hover:text-cream"
          aria-label="Skip ahead"
        >
          <Icon name="skip" className="h-5 w-5" />
        </button>
      </div>

      <p className="hidden pb-2 text-center text-[11px] text-cream-faint lg:block">
        Space to pause · ← → to move · Esc to quit
      </p>

      {confirmQuit && (
        <ConfirmDialog
          title="Quit this workout?"
          body={`You're ${Math.round(overall * 100)}% through. This session won't be saved.`}
          cancelLabel="Keep going"
          confirmLabel="Quit"
          onCancel={() => setConfirmQuit(false)}
          onConfirm={() => navigate(`/app/workouts/${workout.id}`)}
        />
      )}

    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return <div className="mx-auto flex min-h-dvh max-w-xl flex-col px-5 py-6">{children}</div>;
}

function Stat({ value, label, gold = false }: { value: string; label: string; gold?: boolean }) {
  return (
    <div className="card px-3 py-4">
      <div className={`font-display text-2xl font-bold ${gold ? "gold-text" : ""}`}>{value}</div>
      <div className="mt-0.5 text-[11px] font-semibold uppercase tracking-wide text-cream-faint">
        {label}
      </div>
    </div>
  );
}
