import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useRef } from "react";
import { useApp } from "../../contexts/AppContext";
import type { WorkoutDay, WorkoutExercise } from "../../lib/types";

// SVG exercise illustrations
function ExerciseIllustration({ demoKey }: { demoKey: string }) {
  const illustrations: Record<string, JSX.Element> = {
    jumpingjacks: (
      <svg viewBox="0 0 120 160" className="w-full h-full">
        <circle cx="60" cy="22" r="14" fill="#FFD93D" />
        <line x1="60" y1="36" x2="60" y2="90" stroke="#FF6B35" strokeWidth="6" strokeLinecap="round" />
        <line x1="60" y1="55" x2="20" y2="35" stroke="#FF6B35" strokeWidth="6" strokeLinecap="round" />
        <line x1="60" y1="55" x2="100" y2="35" stroke="#FF6B35" strokeWidth="6" strokeLinecap="round" />
        <line x1="60" y1="90" x2="25" y2="130" stroke="#FF6B35" strokeWidth="6" strokeLinecap="round" />
        <line x1="60" y1="90" x2="95" y2="130" stroke="#FF6B35" strokeWidth="6" strokeLinecap="round" />
        <circle cx="20" cy="30" r="6" fill="#4FC3F7" />
        <circle cx="100" cy="30" r="6" fill="#4FC3F7" />
        <circle cx="25" cy="134" r="7" fill="#4FC3F7" />
        <circle cx="95" cy="134" r="7" fill="#4FC3F7" />
      </svg>
    ),
    running: (
      <svg viewBox="0 0 120 160" className="w-full h-full">
        <circle cx="70" cy="22" r="14" fill="#FFD93D" />
        <line x1="70" y1="36" x2="55" y2="85" stroke="#FF6B35" strokeWidth="6" strokeLinecap="round" />
        <line x1="62" y1="55" x2="30" y2="45" stroke="#FF6B35" strokeWidth="6" strokeLinecap="round" />
        <line x1="62" y1="55" x2="90" y2="40" stroke="#FF6B35" strokeWidth="6" strokeLinecap="round" />
        <line x1="55" y1="85" x2="35" y2="125" stroke="#FF6B35" strokeWidth="6" strokeLinecap="round" />
        <line x1="55" y1="85" x2="80" y2="120" stroke="#FF6B35" strokeWidth="6" strokeLinecap="round" />
        <circle cx="30" cy="40" r="6" fill="#4FC3F7" />
        <circle cx="90" cy="35" r="6" fill="#4FC3F7" />
        <circle cx="32" cy="128" r="7" fill="#4FC3F7" />
        <circle cx="82" cy="124" r="7" fill="#4FC3F7" />
      </svg>
    ),
    squat: (
      <svg viewBox="0 0 120 160" className="w-full h-full">
        <circle cx="60" cy="22" r="14" fill="#FFD93D" />
        <line x1="60" y1="36" x2="60" y2="80" stroke="#FF6B35" strokeWidth="6" strokeLinecap="round" />
        <line x1="60" y1="55" x2="30" y2="65" stroke="#FF6B35" strokeWidth="6" strokeLinecap="round" />
        <line x1="60" y1="55" x2="90" y2="65" stroke="#FF6B35" strokeWidth="6" strokeLinecap="round" />
        <line x1="60" y1="80" x2="40" y2="120" stroke="#FF6B35" strokeWidth="6" strokeLinecap="round" />
        <line x1="60" y1="80" x2="80" y2="120" stroke="#FF6B35" strokeWidth="6" strokeLinecap="round" />
        <line x1="40" y1="120" x2="30" y2="140" stroke="#FF6B35" strokeWidth="5" strokeLinecap="round" />
        <line x1="80" y1="120" x2="90" y2="140" stroke="#FF6B35" strokeWidth="5" strokeLinecap="round" />
        <circle cx="30" cy="62" r="6" fill="#4FC3F7" />
        <circle cx="90" cy="62" r="6" fill="#4FC3F7" />
      </svg>
    ),
    stretch: (
      <svg viewBox="0 0 120 160" className="w-full h-full">
        <circle cx="60" cy="25" r="14" fill="#FFD93D" />
        <line x1="60" y1="39" x2="60" y2="90" stroke="#FF6B35" strokeWidth="6" strokeLinecap="round" />
        <line x1="60" y1="55" x2="20" y2="30" stroke="#FF6B35" strokeWidth="6" strokeLinecap="round" />
        <line x1="60" y1="55" x2="100" y2="30" stroke="#FF6B35" strokeWidth="6" strokeLinecap="round" />
        <line x1="60" y1="90" x2="45" y2="135" stroke="#FF6B35" strokeWidth="6" strokeLinecap="round" />
        <line x1="60" y1="90" x2="75" y2="135" stroke="#FF6B35" strokeWidth="6" strokeLinecap="round" />
        <circle cx="20" cy="25" r="6" fill="#EC4899" />
        <circle cx="100" cy="25" r="6" fill="#EC4899" />
      </svg>
    ),
    sidestretch: (
      <svg viewBox="0 0 120 160" className="w-full h-full">
        <circle cx="55" cy="22" r="14" fill="#FFD93D" />
        <line x1="55" y1="36" x2="50" y2="90" stroke="#FF6B35" strokeWidth="6" strokeLinecap="round" />
        <line x1="52" y1="55" x2="20" y2="50" stroke="#FF6B35" strokeWidth="6" strokeLinecap="round" />
        <line x1="52" y1="55" x2="90" y2="20" stroke="#FF6B35" strokeWidth="6" strokeLinecap="round" />
        <line x1="50" y1="90" x2="40" y2="135" stroke="#FF6B35" strokeWidth="6" strokeLinecap="round" />
        <line x1="50" y1="90" x2="65" y2="130" stroke="#FF6B35" strokeWidth="6" strokeLinecap="round" />
        <circle cx="90" cy="15" r="6" fill="#EC4899" />
      </svg>
    ),
    balance: (
      <svg viewBox="0 0 120 160" className="w-full h-full">
        <circle cx="60" cy="22" r="14" fill="#FFD93D" />
        <line x1="60" y1="36" x2="60" y2="90" stroke="#FF6B35" strokeWidth="6" strokeLinecap="round" />
        <line x1="60" y1="55" x2="25" y2="45" stroke="#FF6B35" strokeWidth="6" strokeLinecap="round" />
        <line x1="60" y1="55" x2="95" y2="45" stroke="#FF6B35" strokeWidth="6" strokeLinecap="round" />
        <line x1="60" y1="90" x2="60" y2="140" stroke="#FF6B35" strokeWidth="6" strokeLinecap="round" />
        <line x1="60" y1="110" x2="85" y2="100" stroke="#FF6B35" strokeWidth="5" strokeLinecap="round" />
        <circle cx="25" cy="40" r="6" fill="#22C55E" />
        <circle cx="95" cy="40" r="6" fill="#22C55E" />
        <circle cx="60" cy="144" r="7" fill="#4FC3F7" />
      </svg>
    ),
    lunge: (
      <svg viewBox="0 0 120 160" className="w-full h-full">
        <circle cx="60" cy="22" r="14" fill="#FFD93D" />
        <line x1="60" y1="36" x2="58" y2="82" stroke="#FF6B35" strokeWidth="6" strokeLinecap="round" />
        <line x1="59" y1="55" x2="30" y2="50" stroke="#FF6B35" strokeWidth="6" strokeLinecap="round" />
        <line x1="59" y1="55" x2="88" y2="50" stroke="#FF6B35" strokeWidth="6" strokeLinecap="round" />
        <line x1="58" y1="82" x2="35" y2="125" stroke="#FF6B35" strokeWidth="6" strokeLinecap="round" />
        <line x1="58" y1="82" x2="90" y2="110" stroke="#FF6B35" strokeWidth="6" strokeLinecap="round" />
        <line x1="35" y1="125" x2="25" y2="140" stroke="#FF6B35" strokeWidth="5" strokeLinecap="round" />
        <line x1="90" y1="110" x2="90" y2="140" stroke="#FF6B35" strokeWidth="5" strokeLinecap="round" />
      </svg>
    ),
    pushup: (
      <svg viewBox="0 0 160 100" className="w-full h-full">
        <circle cx="130" cy="20" r="14" fill="#FFD93D" />
        <line x1="116" y1="26" x2="80" y2="50" stroke="#FF6B35" strokeWidth="6" strokeLinecap="round" />
        <line x1="98" y1="38" x2="80" y2="22" stroke="#FF6B35" strokeWidth="6" strokeLinecap="round" />
        <line x1="80" y1="50" x2="30" y2="55" stroke="#FF6B35" strokeWidth="6" strokeLinecap="round" />
        <line x1="80" y1="22" x2="50" y2="22" stroke="#FF6B35" strokeWidth="5" strokeLinecap="round" />
        <circle cx="50" cy="20" r="6" fill="#4FC3F7" />
        <circle cx="30" cy="58" r="7" fill="#4FC3F7" />
        <line x1="80" y1="50" x2="78" y2="80" stroke="#FF6B35" strokeWidth="6" strokeLinecap="round" />
        <circle cx="78" cy="84" r="7" fill="#4FC3F7" />
      </svg>
    ),
  };
  return illustrations[demoKey] ?? illustrations["stretch"];
}

function CountdownRing({ timeLeft, totalTime, color }: { timeLeft: number; totalTime: number; color: string }) {
  const r = 54;
  const circ = 2 * Math.PI * r;
  const pct = timeLeft / totalTime;
  const offset = circ - pct * circ;
  return (
    <svg width="128" height="128" viewBox="0 0 128 128">
      <circle cx="64" cy="64" r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="10" />
      <motion.circle
        cx="64" cy="64" r={r}
        fill="none" stroke={color} strokeWidth="10" strokeLinecap="round"
        strokeDasharray={circ}
        strokeDashoffset={offset}
        transform="rotate(-90 64 64)"
        transition={{ duration: 0.3 }}
      />
      <text x="64" y="58" textAnchor="middle" fill="white" fontSize="28" fontWeight="900">
        {timeLeft}
      </text>
      <text x="64" y="78" textAnchor="middle" fill="rgba(255,255,255,0.5)" fontSize="11">
        seconds
      </text>
    </svg>
  );
}

export function WorkoutPlayerPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { completeWorkoutDay } = useApp() as any;

  const { planId, weekNum, day } = (location.state ?? {}) as {
    planId: string;
    weekNum: number;
    day: WorkoutDay;
  };

  const [exerciseIdx, setExerciseIdx] = useState(0);
  const [phase, setPhase] = useState<"ready" | "active" | "rest" | "done">("ready");
  const [timeLeft, setTimeLeft] = useState(0);
  const [paused, setPaused] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  if (!day) {
    return (
      <div className="min-h-screen bg-pp-navy flex items-center justify-center">
        <div className="text-center text-white">
          <p className="text-xl mb-4">No workout selected</p>
          <button onClick={() => navigate(-1)} className="bg-pp-orange px-6 py-3 rounded-xl font-bold">Go Back</button>
        </div>
      </div>
    );
  }

  const exercises: WorkoutExercise[] = day.exercises;
  const currentExercise = exercises[exerciseIdx];
  const isLastExercise = exerciseIdx === exercises.length - 1;
  const REST_TIME = 10;
  const planColor = "#FF6B35";

  useEffect(() => {
    if (phase === "ready") return;
    if (phase === "done") return;
    if (paused) return;

    intervalRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(intervalRef.current!);
          if (phase === "active") {
            if (isLastExercise) {
              setPhase("done");
            } else {
              setPhase("rest");
              return REST_TIME;
            }
          } else if (phase === "rest") {
            setExerciseIdx(i => i + 1);
            setPhase("active");
            return exercises[exerciseIdx + 1]?.durationSeconds ?? 30;
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(intervalRef.current!);
  }, [phase, paused, exerciseIdx]);

  function startWorkout() {
    setPhase("active");
    setTimeLeft(currentExercise.durationSeconds);
  }

  function skipExercise() {
    clearInterval(intervalRef.current!);
    if (isLastExercise) {
      setPhase("done");
    } else {
      setExerciseIdx(i => i + 1);
      setPhase("active");
      setTimeLeft(exercises[exerciseIdx + 1].durationSeconds);
    }
  }

  function prevExercise() {
    if (exerciseIdx === 0) return;
    clearInterval(intervalRef.current!);
    setExerciseIdx(i => i - 1);
    setPhase("active");
    setTimeLeft(exercises[exerciseIdx - 1].durationSeconds);
  }

  function handleComplete() {
    completeWorkoutDay(planId, weekNum, day.dayNumber);
    navigate("/app/workout-plans/" + planId, { replace: true });
  }

  if (phase === "done") {
    return (
      <motion.div
        className="min-h-screen bg-pp-navy flex flex-col items-center justify-center px-6 text-center"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      >
        <motion.div
          className="text-8xl mb-4"
          initial={{ scale: 0 }} animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          🎉
        </motion.div>
        <h1 className="text-3xl font-bold text-white font-fredoka mb-2">Workout Complete!</h1>
        <p className="text-pp-border mb-2">{day.title}</p>
        <div className="flex gap-4 mt-4 mb-8">
          <div className="bg-pp-card rounded-xl px-6 py-3 text-center">
            <div className="text-2xl font-bold text-pp-gold">+{day.sparkPoints}</div>
            <div className="text-xs text-pp-border">Spark Points</div>
          </div>
          <div className="bg-pp-card rounded-xl px-6 py-3 text-center">
            <div className="text-2xl font-bold text-pp-orange">+{day.energyReward}</div>
            <div className="text-xs text-pp-border">Energy</div>
          </div>
        </div>
        <motion.button
          className="w-full max-w-xs py-4 rounded-2xl font-bold text-white text-lg bg-pp-orange"
          whileTap={{ scale: 0.96 }}
          onClick={handleComplete}
        >
          Claim Rewards ✨
        </motion.button>
      </motion.div>
    );
  }

  return (
    <div className="min-h-screen bg-pp-navy flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-4 pb-2">
        <button
          onClick={() => navigate(-1)}
          className="w-9 h-9 rounded-full bg-pp-card flex items-center justify-center shrink-0"
        >
          <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        <div className="flex-1">
          <div className="text-white font-semibold text-sm truncate">{day.title}</div>
          <div className="text-pp-border text-xs">{exerciseIdx + 1} of {exercises.length}</div>
        </div>
        {/* progress dots */}
        <div className="flex gap-1">
          {exercises.map((_, i) => (
            <div
              key={i}
              className={`rounded-full transition-all ${i < exerciseIdx ? "w-4 h-2 bg-pp-orange" : i === exerciseIdx ? "w-4 h-2 bg-white" : "w-2 h-2 bg-pp-border/40"}`}
            />
          ))}
        </div>
      </div>

      {/* Exercise Illustration */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={exerciseIdx}
            className="w-48 h-48 mb-4"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.25 }}
          >
            <ExerciseIllustration demoKey={currentExercise.demonstrationKey} />
          </motion.div>
        </AnimatePresence>

        {/* Timer */}
        {phase !== "ready" && (
          <div className="mb-3">
            {phase === "rest" ? (
              <div className="text-center">
                <div className="text-pp-border text-sm mb-2 font-semibold">REST</div>
                <CountdownRing timeLeft={timeLeft} totalTime={REST_TIME} color="#22C55E" />
              </div>
            ) : (
              <CountdownRing timeLeft={timeLeft} totalTime={currentExercise.durationSeconds} color={planColor} />
            )}
          </div>
        )}

        {/* Exercise info */}
        <AnimatePresence mode="wait">
          <motion.div
            key={exerciseIdx + phase}
            className="text-center"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            {phase === "rest" ? (
              <>
                <h2 className="text-2xl font-bold text-white font-fredoka mb-1">
                  Get Ready!
                </h2>
                <p className="text-pp-border">
                  Next: {exercises[exerciseIdx + 1]?.name}
                </p>
              </>
            ) : (
              <>
                <h2 className="text-2xl font-bold text-white font-fredoka mb-1">
                  {currentExercise.name}
                </h2>
                {currentExercise.reps && (
                  <div className="inline-block bg-pp-orange/20 text-pp-orange text-sm px-3 py-0.5 rounded-full mb-2">
                    {currentExercise.reps} reps
                  </div>
                )}
                <p className="text-pp-border text-sm max-w-xs">{currentExercise.instruction}</p>
                {currentExercise.modification && (
                  <p className="text-pp-teal text-xs mt-1">💡 {currentExercise.modification}</p>
                )}
              </>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Controls */}
      <div className="px-6 pb-10">
        {phase === "ready" ? (
          <motion.button
            className="w-full py-5 rounded-2xl font-bold text-white text-xl bg-pp-orange"
            whileTap={{ scale: 0.96 }}
            onClick={startWorkout}
          >
            Start Workout! ▶
          </motion.button>
        ) : (
          <div className="flex gap-3">
            <button
              onClick={prevExercise}
              disabled={exerciseIdx === 0}
              className="flex-1 py-4 rounded-2xl font-bold text-white bg-pp-card disabled:opacity-40 text-sm"
            >
              ← Previous
            </button>
            <button
              onClick={() => setPaused(p => !p)}
              className="w-16 h-14 rounded-2xl font-bold text-white bg-pp-card flex items-center justify-center"
            >
              {paused ? "▶" : "⏸"}
            </button>
            <button
              onClick={skipExercise}
              className="flex-1 py-4 rounded-2xl font-bold text-white bg-pp-card text-sm"
            >
              Skip →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
