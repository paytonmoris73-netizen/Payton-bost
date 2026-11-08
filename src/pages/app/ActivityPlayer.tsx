import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "../../components/ui/Button";
import { ProgressBar } from "../../components/ui/ProgressBar";
import { getActivityById } from "../../data/activities";
import { useApp } from "../../contexts/AppContext";
import { Pip } from "../../components/mascot/Pip";

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
    const id = setInterval(() => setElapsed(e => e + 1), 1000);
    return () => clearInterval(id);
  }, [started, paused]);

  const handleComplete = useCallback(() => {
    const { pointsEarned, newAchievements } = completeActivity(activity!.id, Math.round(elapsed / 60) || 1);
    navigate(`/app/activity/${activity!.id}/complete`, {
      state: { pointsEarned, newAchievements, activityName: activity!.name },
    });
  }, [activity, completeActivity, elapsed, navigate]);

  if (!activity) return <div className="p-6 text-center">Activity not found</div>;

  if (!started) {
    return (
      <div className="min-h-screen flex flex-col animate-fade-in">
        {/* Hero */}
        <div className="relative h-48 flex items-center justify-center" style={{ backgroundColor: activity.color }}>
          <button
            onClick={() => navigate(-1)}
            className="absolute top-5 left-5 w-10 h-10 bg-white/30 rounded-full flex items-center justify-center text-white font-bold"
          >
            ‹
          </button>
          <span className="text-7xl">{activity.emoji}</span>
        </div>

        <div className="flex-1 px-5 py-6 space-y-4">
          <div>
            <h1 className="font-black text-2xl text-navy dark:text-white">{activity.name}</h1>
            <p className="text-gray-500 text-sm mt-1">{activity.description}</p>
          </div>

          <div className="flex gap-3">
            <div className="flex-1 bg-soft-gray dark:bg-gray-800 rounded-2xl p-3 text-center">
              <div className="text-xl mb-1">⏱️</div>
              <div className="text-xs font-bold text-navy dark:text-white">{activity.durationMin} min</div>
            </div>
            <div className="flex-1 bg-soft-gray dark:bg-gray-800 rounded-2xl p-3 text-center">
              <div className="text-xl mb-1">📋</div>
              <div className="text-xs font-bold text-navy dark:text-white">{activity.steps.length} steps</div>
            </div>
            <div className="flex-1 bg-soft-gray dark:bg-gray-800 rounded-2xl p-3 text-center">
              <div className="text-xl mb-1">⭐</div>
              <div className="text-xs font-bold text-navy dark:text-white">~{activity.durationMin * 5} pts</div>
            </div>
          </div>

          {activity.equipment.length > 0 && (
            <div className="bg-yellow/20 rounded-2xl p-3">
              <div className="text-xs font-bold text-navy dark:text-white mb-1">🎒 You'll need:</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">{activity.equipment.join(", ")}</div>
            </div>
          )}

          <div className="bg-mint dark:bg-teal/10 rounded-2xl p-3">
            <div className="text-xs font-bold text-teal-dark dark:text-teal mb-1">🛡️ Remember</div>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              {activity.safetyNote || "Move at your own pace. Rest whenever you need to. Stop and tell an adult if something hurts."}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Pip expression="encouraging" size={60} />
            <div className="bg-coral/10 rounded-2xl px-4 py-3 flex-1">
              <p className="text-sm font-bold text-coral">PIP: "You've got this! Let's move!"</p>
            </div>
          </div>
        </div>

        <div className="px-5 pb-10">
          <Button fullWidth size="lg" onClick={() => setStarted(true)} className="font-black">
            Start Activity! 🚀
          </Button>
        </div>
      </div>
    );
  }

  const step = activity.steps[currentStep];
  const progress = ((currentStep) / activity.steps.length) * 100;
  const isLast = currentStep === activity.steps.length - 1;

  return (
    <div className="min-h-screen flex flex-col animate-fade-in">
      {/* Top bar */}
      <div className="flex items-center justify-between px-5 py-4 bg-white dark:bg-gray-900 border-b border-soft-gray dark:border-gray-700">
        <button
          onClick={() => setShowExit(true)}
          className="w-9 h-9 rounded-full bg-soft-gray dark:bg-gray-800 flex items-center justify-center text-gray-500"
        >
          ✕
        </button>
        <div className="text-center">
          <div className="font-black text-sm text-navy dark:text-white">{activity.name}</div>
          <div className="text-xs text-gray-400">Step {currentStep + 1} of {activity.steps.length}</div>
        </div>
        <button
          onClick={() => setPaused(!paused)}
          className="w-9 h-9 rounded-full bg-soft-gray dark:bg-gray-800 flex items-center justify-center text-gray-500"
        >
          {paused ? "▶" : "⏸"}
        </button>
      </div>

      {/* Progress */}
      <div className="px-5 pt-4">
        <ProgressBar value={progress} />
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-5 py-6 text-center">
        {/* Step illustration */}
        <div
          className="w-32 h-32 rounded-3xl flex items-center justify-center text-7xl mb-6 shadow-card"
          style={{ backgroundColor: activity.color }}
        >
          {activity.emoji}
        </div>

        <div className="text-xs text-coral font-bold mb-2">STEP {currentStep + 1}</div>
        <p className="text-xl font-black text-navy dark:text-white leading-relaxed max-w-sm">
          {step.instruction}
        </p>

        {paused && (
          <div className="mt-4 bg-yellow/20 rounded-2xl px-4 py-3">
            <div className="font-bold text-navy dark:text-white text-sm">⏸ Paused</div>
            <div className="text-xs text-gray-500">Take a break! Tap play when ready.</div>
          </div>
        )}

        {/* Timer display */}
        <div className="mt-6 text-sm text-gray-400">
          {Math.floor(elapsed / 60)}:{String(elapsed % 60).padStart(2, "0")} elapsed
        </div>

        {/* PIP encouragement */}
        <div className="mt-4 flex items-center gap-2">
          <Pip expression={isLast ? "celebrating" : "encouraging"} size={48} />
          <div className="bg-soft-gray dark:bg-gray-800 rounded-2xl px-3 py-2 text-xs font-bold text-gray-500 dark:text-gray-400">
            {currentStep === 0
              ? "Let's do this!"
              : currentStep < activity.steps.length / 2
              ? "Great start! Keep going!"
              : isLast
              ? "Almost there! You're amazing!"
              : "You're doing so well!"}
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="px-5 pb-10 space-y-3">
        {isLast ? (
          <Button fullWidth size="lg" onClick={handleComplete} className="font-black bg-teal hover:bg-teal-dark">
            Complete Activity! 🎉
          </Button>
        ) : (
          <Button fullWidth size="lg" onClick={() => setCurrentStep(s => s + 1)}>
            Next Step →
          </Button>
        )}
        {currentStep > 0 && (
          <Button
            fullWidth
            variant="ghost"
            size="sm"
            onClick={() => setCurrentStep(s => s - 1)}
          >
            ← Previous Step
          </Button>
        )}
      </div>

      {/* Exit confirmation */}
      {showExit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/40">
          <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 max-w-xs w-full text-center">
            <Pip expression="curious" size={60} />
            <h3 className="font-black text-navy dark:text-white mt-3 mb-1">Leave activity?</h3>
            <p className="text-sm text-gray-500 mb-4">Your progress won't be saved.</p>
            <div className="flex gap-3">
              <Button variant="secondary" fullWidth onClick={() => setShowExit(false)}>Keep Going</Button>
              <Button variant="danger" fullWidth onClick={() => navigate(-1)}>Leave</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
