import { useNavigate, useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { useApp } from "../../contexts/AppContext";
import { WORKOUT_PLANS } from "../../data/workoutPlans";
import type { WorkoutDay } from "../../lib/types";

export function WorkoutPlanDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { state, startWorkoutPlan } = useApp() as any;
  const [openWeek, setOpenWeek] = useState(0);

  const plan = WORKOUT_PLANS.find(p => p.id === id);
  if (!plan) return <div className="text-white p-8">Plan not found</div>;

  const prog = state.planProgress[plan.id];
  const completedDays: string[] = prog?.completedDays ?? [];
  const isActive = state.activePlanId === plan.id;
  const totalDays = plan.weeks.reduce((acc, w) => acc + w.days.length, 0);
  const pct = totalDays > 0 ? Math.round((completedDays.length / totalDays) * 100) : 0;

  function handleStart() {
    startWorkoutPlan(plan!.id);
    navigate(`/app/workout-plans/${plan!.id}`);
  }

  function getDayKey(weekNum: number, dayNum: number) {
    return `w${weekNum}d${dayNum}`;
  }

  function isDayCompleted(weekNum: number, dayNum: number) {
    return completedDays.includes(getDayKey(weekNum, dayNum));
  }

  function isDayUnlocked(weekNum: number, dayNum: number) {
    if (!isActive) return false;
    if (weekNum === 1 && dayNum === 1) return true;
    // Previous day completed?
    const prev = dayNum > 1
      ? getDayKey(weekNum, dayNum - 1)
      : getDayKey(weekNum - 1, plan!.weeks[weekNum - 2]?.days.length ?? 1);
    return completedDays.includes(prev);
  }

  function handleDayTap(weekNum: number, day: WorkoutDay) {
    const unlocked = isDayUnlocked(weekNum, day.dayNumber) || isDayCompleted(weekNum, day.dayNumber);
    if (!unlocked) return;
    navigate(`/app/workout-player`, { state: { planId: plan!.id, weekNum, day } });
  }

  return (
    <motion.div
      className="min-h-screen bg-pp-navy pb-24"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }}
    >
      {/* Hero */}
      <div
        className="relative px-4 pt-12 pb-6"
        style={{ background: `linear-gradient(160deg, ${plan.thumbnailColor}44 0%, transparent 60%)` }}
      >
        <button
          onClick={() => navigate(-1)}
          className="absolute top-4 left-4 w-9 h-9 rounded-full bg-pp-card/80 flex items-center justify-center"
        >
          <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <div className="text-5xl mb-3 mt-6">{plan.emoji}</div>
        <h1 className="text-2xl font-bold text-white font-fredoka mb-1">{plan.name}</h1>
        <p className="text-pp-border text-sm mb-4">{plan.description}</p>

        <div className="flex gap-3 flex-wrap">
          {[
            { icon: "📅", label: `${plan.weeks.length} weeks` },
            { icon: "🏃", label: `${totalDays} workouts` },
            { icon: "⚡", label: plan.category },
            { icon: "🎯", label: plan.difficulty },
          ].map(tag => (
            <span key={tag.label} className="text-xs bg-pp-card px-3 py-1 rounded-full text-pp-border">
              {tag.icon} {tag.label}
            </span>
          ))}
        </div>

        {isActive && pct > 0 && (
          <div className="mt-4">
            <div className="flex justify-between text-xs text-pp-border mb-1">
              <span>Progress</span>
              <span>{completedDays.length}/{totalDays} days · {pct}%</span>
            </div>
            <div className="h-2 bg-pp-border/30 rounded-full overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                style={{ background: plan.thumbnailColor }}
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 0.8 }}
              />
            </div>
          </div>
        )}

        {!isActive && (
          <motion.button
            className="mt-4 w-full py-3 rounded-xl font-bold text-white"
            style={{ background: plan.thumbnailColor }}
            whileTap={{ scale: 0.96 }}
            onClick={handleStart}
          >
            Start This Plan 🚀
          </motion.button>
        )}
      </div>

      {/* Weeks Accordion */}
      <div className="px-4 mt-2 space-y-2">
        {plan.weeks.map((week) => {
          const weekCompleted = week.days.filter(d => isDayCompleted(week.weekNumber, d.dayNumber)).length;
          const isOpen = openWeek === week.weekNumber;

          return (
            <div key={week.weekNumber} className="bg-pp-card rounded-2xl overflow-hidden">
              <button
                className="w-full px-4 py-4 flex items-center gap-3 text-left"
                onClick={() => setOpenWeek(isOpen ? -1 : week.weekNumber)}
              >
                <span className="text-2xl">{week.illustration}</span>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-white font-bold text-sm">{week.title}</span>
                    {weekCompleted === week.days.length && weekCompleted > 0 && (
                      <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full">✓ Done</span>
                    )}
                  </div>
                  <p className="text-pp-border text-xs mt-0.5">{week.description}</p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <div className="flex-1 h-1.5 bg-pp-border/30 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ background: plan.thumbnailColor, width: `${(weekCompleted / week.days.length) * 100}%` }}
                      />
                    </div>
                    <span className="text-xs text-pp-border">{weekCompleted}/{week.days.length}</span>
                  </div>
                </div>
                <svg
                  className={`w-5 h-5 text-pp-border transition-transform ${isOpen ? "rotate-180" : ""}`}
                  fill="none" viewBox="0 0 24 24" stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              <AnimatePresence>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="px-4 pb-4 space-y-2">
                      {week.days.map((day) => {
                        const completed = isDayCompleted(week.weekNumber, day.dayNumber);
                        const unlocked = isDayUnlocked(week.weekNumber, day.dayNumber) || completed;
                        const totalSecs = day.exercises.reduce((a, e) => a + e.durationSeconds + 10, 0);
                        const mins = Math.round(totalSecs / 60);

                        return (
                          <motion.div
                            key={day.dayNumber}
                            className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all ${
                              completed ? "bg-green-500/10 border border-green-500/20" :
                              unlocked ? "bg-pp-surface border border-pp-border" :
                              "bg-pp-surface/50 opacity-50 cursor-not-allowed"
                            }`}
                            whileTap={unlocked ? { scale: 0.97 } : {}}
                            onClick={() => handleDayTap(week.weekNumber, day)}
                          >
                            <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
                              completed ? "bg-green-500" : unlocked ? "bg-pp-card" : "bg-pp-card/50"
                            }`}>
                              {completed ? (
                                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                </svg>
                              ) : unlocked ? (
                                <span className="text-sm">▶</span>
                              ) : (
                                <svg className="w-4 h-4 text-pp-border" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                </svg>
                              )}
                            </div>
                            <div className="flex-1">
                              <p className="text-white text-sm font-semibold">{day.title}</p>
                              <p className="text-pp-border text-xs">{day.focus} · {day.exercises.length} exercises · ~{mins} min</p>
                            </div>
                            <div className="text-right shrink-0">
                              <p className="text-xs text-pp-gold">+{day.sparkPoints} pts</p>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}
