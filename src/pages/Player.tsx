import { useEffect, useMemo, useRef, useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import { getWorkout, workoutSeconds } from "../data/workouts";
import { useApp, type CompletedSession } from "../state/AppContext";
import { Icon } from "../components/Icon";
import { Button, ProgressRing } from "../components/ui";

type Phase = "ready" | "work" | "rest" | "done";

export function PlayerPage() {
  const { id } = useParams();
  const workout = getWorkout(id);
  const navigate = useNavigate();
  const { state, completeWorkout, pushToast } = useApp();

  const [phase, setPhase] = useState<Phase>("ready");
  const [index, setIndex] = useState(0);
  const [remaining, setRemaining] = useState(0);
  const [paused, setPaused] = useState(false);
  const [confirmQuit, setConfirmQuit] = useState(false);
  const [result, setResult] = useState<CompletedSession | null>(null);
  const finishedRef = useRef(false);

  const totalSec = useMemo(() => (workout ? workoutSeconds(workout) : 0), [workout]);

  const exercises = workout?.exercises ?? [];
  const exercise = exercises[index];

  // Seconds elapsed before the current phase began.
  const elapsedBefore = useMemo(() => {
    let sum = 0;
    for (let i = 0; i < index; i++) sum += exercises[i].work + exercises[i].rest;
    if (phase === "rest" && exercise) sum += exercise.work;
    return sum;
  }, [index, phase, exercises, exercise]);

  const phaseTotal = phase === "work" ? exercise?.work ?? 0 : phase === "rest" ? exercise?.rest ?? 0 : 0;
  const overall =
    phase === "done"
      ? 1
      : totalSec > 0
        ? (elapsedBefore + Math.max(0, phaseTotal - remaining)) / totalSec
        : 0;

  // Advance through work → rest → next exercise → done.
  const advance = () => {
    if (!workout) return;
    if (phase === "work" && exercise && exercise.rest > 0) {
      setPhase("rest");
      setRemaining(exercise.rest);
      return;
    }
    if (index + 1 < exercises.length) {
      setIndex(index + 1);
      setPhase("work");
      setRemaining(exercises[index + 1].work);
    } else {
      setPhase("done");
    }
  };

  // Tick
  useEffect(() => {
    if (paused || phase === "ready" || phase === "done" || confirmQuit) return;
    const t = window.setInterval(() => {
      setRemaining((r) => (r > 0 ? r - 1 : 0));
    }, 1000);
    return () => window.clearInterval(t);
  }, [paused, phase, confirmQuit]);

  // Phase complete
  useEffect(() => {
    if (remaining === 0 && (phase === "work" || phase === "rest") && !paused) {
      advance();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remaining, phase, paused]);

  // Record the session exactly once when finished.
  useEffect(() => {
    if (phase === "done" && workout && !finishedRef.current) {
      finishedRef.current = true;
      const session = completeWorkout({
        workoutId: workout.id,
        workoutName: workout.name,
        minutes: workout.minutes,
        calories: workout.calories,
      });
      setResult(session);
    }
  }, [phase, workout, completeWorkout]);

  if (!workout) return <Navigate to="/app/workouts" replace />;
  const locked = workout.pro && !state.premium;
  if (locked) return <Navigate to="/app/store" replace />;

  const start = () => {
    setIndex(0);
    setPhase("work");
    setRemaining(exercises[0].work);
  };

  const skip = () => {
    if (phase === "work" || phase === "rest") advance();
  };

  const back = () => {
    if (index > 0) {
      setIndex(index - 1);
      setPhase("work");
      setRemaining(exercises[index - 1].work);
    } else {
      setPhase("work");
      setRemaining(exercises[0].work);
    }
  };

  /* ---------- Ready screen ---------- */
  if (phase === "ready") {
    return (
      <Shell>
        <div className="flex flex-1 flex-col items-center justify-center text-center">
          <span className={`flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-br ${workout.art} shadow-glow`}>
            <Icon name={workout.emblem} className="h-12 w-12 text-gold-200" />
          </span>
          <h1 className="mt-6 font-display text-3xl font-bold">{workout.name}</h1>
          <p className="mt-2 max-w-xs text-sm text-cream-dim">
            {exercises.length} exercises · about {workout.minutes} minutes. Find your space, grab
            some water, and get ready.
          </p>
          <Button size="lg" className="mt-8 w-full max-w-xs" onClick={start}>
            <Icon name="play" className="h-5 w-5" />
            Let's Go
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

  /* ---------- Done screen ---------- */
  if (phase === "done") {
    return (
      <Shell>
        <div className="flex flex-1 flex-col items-center justify-center text-center">
          <span className="flex h-24 w-24 items-center justify-center rounded-full gold-fill text-ink-950 shadow-glow">
            <Icon name="check" className="h-12 w-12" />
          </span>
          <h1 className="mt-6 font-display text-3xl font-bold">
            Workout <span className="gold-text">Complete!</span>
          </h1>
          <p className="mt-2 text-sm text-cream-dim">
            {workout.name} is in the books. Outstanding work.
          </p>
          <div className="mt-8 grid w-full max-w-sm grid-cols-3 gap-3">
            <Stat value={`${workout.minutes}`} label="Minutes" />
            <Stat value={`${workout.calories}`} label="Calories" />
            <Stat value={`+${result?.xp ?? 0}`} label="XP Earned" gold />
          </div>
          <Button
            size="lg"
            className="mt-8 w-full max-w-xs"
            onClick={() => {
              pushToast(`+${result?.xp ?? 0} XP earned`, `${workout.name} complete`);
              navigate("/app/home");
            }}
          >
            Finish
          </Button>
          <Link
            to="/app/progress"
            className="mt-4 text-sm font-semibold text-gold-400 hover:text-gold-300"
          >
            View your progress
          </Link>
        </div>
      </Shell>
    );
  }

  /* ---------- Active workout ---------- */
  const isRest = phase === "rest";
  const upNext = exercises[index + 1] ?? null;

  return (
    <Shell>
      {/* Top bar */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setConfirmQuit(true)}
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-line bg-ink-800 text-cream-dim transition-colors hover:text-cream"
          aria-label="Quit workout"
        >
          <Icon name="x" className="h-4 w-4" />
        </button>
        <div className="text-center">
          <div className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-cream-faint">
            {workout.name}
          </div>
          <div className="text-xs font-semibold text-cream-dim">
            Exercise {index + 1} of {exercises.length}
          </div>
        </div>
        <div className="w-10" />
      </div>

      {/* Overall progress */}
      <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-ink-700">
        <div
          className="h-full gold-fill transition-[width] duration-500"
          style={{ width: `${Math.round(overall * 100)}%` }}
        />
      </div>

      {/* Timer */}
      <div className="flex flex-1 flex-col items-center justify-center py-6 text-center">
        <div
          className={`text-[11px] font-extrabold uppercase tracking-[0.22em] ${
            isRest ? "text-sky-300" : "text-gold-400"
          }`}
        >
          {isRest ? "Rest" : "Work"}
        </div>
        <h1 className="mt-2 max-w-sm font-display text-3xl font-bold leading-tight text-balance">
          {isRest ? "Breathe & recover" : exercise?.name}
        </h1>
        {!isRest && exercise && (
          <p className="mt-2 max-w-xs text-sm text-cream-dim">{exercise.cue}</p>
        )}

        <div className="mt-8">
          <ProgressRing
            progress={phaseTotal > 0 ? remaining / phaseTotal : 0}
            size={210}
            stroke={13}
          >
            <span className="font-display text-6xl font-bold tabular-nums">{remaining}</span>
            <span className="text-xs font-semibold text-cream-faint">seconds</span>
          </ProgressRing>
        </div>

        {upNext && (
          <div className="mt-8 text-sm text-cream-dim">
            Up next: <span className="font-bold text-cream">{upNext.name}</span>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-4 pb-4">
        <button
          onClick={back}
          className="flex h-12 w-12 items-center justify-center rounded-full border border-line bg-ink-800 text-cream-dim transition-colors hover:text-cream"
          aria-label="Restart exercise"
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
          aria-label="Skip"
        >
          <Icon name="skip" className="h-5 w-5" />
        </button>
      </div>

      {/* Quit confirmation */}
      {confirmQuit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-950/80 p-6 backdrop-blur-sm">
          <div className="card animate-fade-up w-full max-w-sm p-6 text-center">
            <h2 className="font-display text-xl font-bold">Quit workout?</h2>
            <p className="mt-2 text-sm text-cream-dim">
              Your progress in this session won't be saved.
            </p>
            <div className="mt-6 flex gap-3">
              <Button variant="ghost" className="flex-1" onClick={() => setConfirmQuit(false)}>
                Keep Going
              </Button>
              <Button
                variant="danger"
                className="flex-1"
                onClick={() => navigate(`/app/workouts/${workout.id}`)}
              >
                Quit
              </Button>
            </div>
          </div>
        </div>
      )}
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto flex min-h-dvh max-w-xl flex-col px-5 py-6">{children}</div>
  );
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
