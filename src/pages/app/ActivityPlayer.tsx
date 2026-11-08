import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { getActivityById } from "../../data/activities";
import { useApp } from "../../contexts/AppContext";
import { Pip } from "../../components/mascot/Pip";

const PIP_LINES = [
  "You've got this!",
  "Great start! Keep it up!",
  "Looking amazing!",
  "You're doing so well!",
  "Almost there! You're crushing it!",
  "One more step — YOU GOT THIS!",
];

export function ActivityPlayerPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { completeActivity } = useApp();
  const activity = getActivityById(id ?? "");

  const [currentStep, setCurrentStep] = useState(0);
  const [paused, setPaused] = useState(false);
  const [started, setStarted] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [showExit, setShowExit] = useState(false);

  useEffect(() => {
    if (!started || paused) return;
    const timer = setInterval(() => setElapsed(e => e + 1), 1000);
    return () => clearInterval(timer);
  }, [started, paused]);

  const handleComplete = useCallback(() => {
    const { pointsEarned, newAchievements } = completeActivity(activity!.id, Math.round(elapsed / 60) || 1);
    navigate(`/app/activity/${activity!.id}/complete`, {
      state: { pointsEarned, newAchievements, activityName: activity!.name },
    });
  }, [activity, completeActivity, elapsed, navigate]);

  if (!activity) {
    return (
      <div className="min-h-screen bg-pp-navy flex items-center justify-center">
        <p className="text-pp-muted">Activity not found.</p>
      </div>
    );
  }

  /* ── Pre-start screen ── */
  if (!started) {
    return (
      <motion.div
        className="min-h-screen bg-pp-navy flex flex-col"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      >
        {/* Hero banner */}
        <div
          className="relative h-52 flex items-center justify-center overflow-hidden"
          style={{ background: `linear-gradient(135deg, ${activity.color}44, ${activity.color}22, #0F0E2A)` }}
        >
          <div className="absolute inset-0 stars-bg pointer-events-none opacity-40" />
          <button
            onClick={() => navigate(-1)}
            className="absolute top-5 left-5 w-10 h-10 bg-pp-card border border-pp-border rounded-full flex items-center justify-center text-pp-cream font-bold text-lg"
          >
            ‹
          </button>
          <span className="text-8xl relative z-10">{activity.emoji}</span>
        </div>

        <div className="flex-1 px-5 py-6 space-y-4">
          <div>
            <h1 className="font-display text-pp-cream text-2xl">{activity.name}</h1>
            <p className="text-pp-muted text-sm mt-1">{activity.description}</p>
          </div>

          {/* Quick stats */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { emoji: "⏱️", label: `${activity.durationMin} min` },
              { emoji: "📋", label: `${activity.steps.length} steps` },
              { emoji: "⚡", label: `~${activity.durationMin * 5} SP` },
            ].map(stat => (
              <div key={stat.label} className="bg-pp-card border border-pp-border rounded-2xl p-3 text-center">
                <div className="text-xl mb-1">{stat.emoji}</div>
                <div className="text-xs font-bold text-pp-cream">{stat.label}</div>
              </div>
            ))}
          </div>

          {activity.equipment.length > 0 && (
            <div className="bg-pp-gold/10 border border-pp-gold/20 rounded-2xl p-3">
              <div className="text-xs font-bold text-pp-gold mb-1">🎒 You'll need:</div>
              <div className="text-sm text-pp-muted">{activity.equipment.join(", ")}</div>
            </div>
          )}

          <div className="bg-pp-teal/10 border border-pp-teal/20 rounded-2xl p-3">
            <div className="text-xs font-bold text-pp-teal mb-1">🛡️ Safety first</div>
            <p className="text-xs text-pp-muted">
              {activity.safetyNote || "Move at your own pace. Rest whenever you need to. Stop and tell an adult if something hurts."}
            </p>
          </div>

          {/* PIP pep talk */}
          <div className="flex items-center gap-3 bg-pp-card border border-pp-border rounded-2xl p-4">
            <Pip expression="encouraging" size={56} animate={false} />
            <p className="text-sm font-bold text-pp-orange flex-1">
              "You've got this! Let's get moving — adventure awaits!"
            </p>
          </div>
        </div>

        <div className="px-5 pb-10">
          <button
            onClick={() => setStarted(true)}
            className="w-full py-4 rounded-2xl font-black text-white text-lg shadow-glow-orange transition-all hover:brightness-110"
            style={{ background: `linear-gradient(135deg, #FF6B35, #FF4500)` }}
          >
            Start Activity! 🚀
          </button>
        </div>
      </motion.div>
    );
  }

  /* ── Active player ── */
  const step = activity.steps[currentStep];
  const progress = (currentStep / activity.steps.length) * 100;
  const isLast = currentStep === activity.steps.length - 1;
  const pipLine = PIP_LINES[Math.min(currentStep, PIP_LINES.length - 1)];

  return (
    <motion.div
      className="min-h-screen bg-pp-navy flex flex-col"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }}
    >
      {/* Top bar */}
      <div className="flex items-center justify-between px-5 py-4 bg-pp-surface border-b border-pp-border">
        <button
          onClick={() => setShowExit(true)}
          className="w-9 h-9 rounded-full bg-pp-card border border-pp-border flex items-center justify-center text-pp-muted hover:text-pp-cream transition-colors"
        >
          ✕
        </button>
        <div className="text-center">
          <div className="font-black text-sm text-pp-cream">{activity.name}</div>
          <div className="text-xs text-pp-muted">Step {currentStep + 1} of {activity.steps.length}</div>
        </div>
        <button
          onClick={() => setPaused(!paused)}
          className="w-9 h-9 rounded-full bg-pp-card border border-pp-border flex items-center justify-center text-pp-muted hover:text-pp-cream transition-colors"
        >
          {paused ? "▶" : "⏸"}
        </button>
      </div>

      {/* Orange progress bar */}
      <div className="h-1.5 bg-pp-border">
        <motion.div
          className="h-full bg-gradient-to-r from-pp-orange to-pp-gold"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.4 }}
        />
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col items-center justify-center px-5 py-6 text-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="w-full flex flex-col items-center"
          >
            {/* Step icon */}
            <div
              className="w-32 h-32 rounded-3xl flex items-center justify-center text-7xl mb-6"
              style={{ background: `linear-gradient(135deg, ${activity.color}33, ${activity.color}66)` }}
            >
              {activity.emoji}
            </div>

            <div className="text-xs text-pp-orange font-black tracking-widest mb-2 uppercase">
              Step {currentStep + 1}
            </div>
            <p className="text-xl font-black text-pp-cream leading-relaxed max-w-sm">
              {step.instruction}
            </p>

            {paused && (
              <div className="mt-4 bg-pp-card border border-pp-border rounded-2xl px-4 py-3">
                <div className="font-bold text-pp-gold text-sm">⏸ Paused</div>
                <div className="text-xs text-pp-muted mt-0.5">Take a break! Tap play when ready.</div>
              </div>
            )}

            {/* Timer */}
            <div className="mt-5 font-mono text-pp-muted text-sm">
              {Math.floor(elapsed / 60)}:{String(elapsed % 60).padStart(2, "0")} elapsed
            </div>

            {/* PIP */}
            <div className="mt-4 flex items-center gap-3 bg-pp-card border border-pp-border rounded-2xl px-4 py-3 max-w-xs">
              <Pip expression={isLast ? "celebrating" : "encouraging"} size={44} animate={false} />
              <p className="text-xs font-bold text-pp-orange text-left">{pipLine}</p>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Controls */}
      <div className="px-5 pb-10 space-y-3">
        {isLast ? (
          <button
            onClick={handleComplete}
            className="w-full py-4 rounded-2xl font-black text-white text-base transition-all hover:brightness-110 shadow-glow-orange"
            style={{ background: "linear-gradient(135deg, #22C55E, #14B8A6)" }}
          >
            Complete Activity! 🎉
          </button>
        ) : (
          <button
            onClick={() => setCurrentStep(s => s + 1)}
            className="w-full py-4 rounded-2xl font-black text-white text-base transition-all hover:brightness-110"
            style={{ background: "linear-gradient(135deg, #FF6B35, #FF4500)" }}
          >
            Next Step →
          </button>
        )}
        {currentStep > 0 && (
          <button
            onClick={() => setCurrentStep(s => s - 1)}
            className="w-full py-2.5 rounded-2xl text-pp-muted text-sm font-bold border border-pp-border hover:text-pp-cream transition-colors"
          >
            ← Previous Step
          </button>
        )}
      </div>

      {/* Exit confirmation modal */}
      <AnimatePresence>
        {showExit && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 z-50"
              onClick={() => setShowExit(false)}
            />
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ type: "spring", damping: 20 }}
              className="fixed inset-x-6 top-1/2 -translate-y-1/2 z-50 bg-pp-card border border-pp-border rounded-3xl p-6 text-center max-w-sm mx-auto"
            >
              <Pip expression="curious" size={72} animate={false} />
              <h3 className="font-display text-pp-cream text-xl mt-3 mb-1">Leave activity?</h3>
              <p className="text-pp-muted text-sm mb-5">Your progress won't be saved.</p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowExit(false)}
                  className="flex-1 py-3 rounded-2xl bg-pp-border text-pp-muted font-bold hover:text-pp-cream transition-colors"
                >
                  Keep Going
                </button>
                <button
                  onClick={() => navigate(-1)}
                  className="flex-1 py-3 rounded-2xl bg-pp-coral/20 border border-pp-coral/40 text-pp-coral font-bold hover:brightness-110 transition-all"
                >
                  Leave
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
