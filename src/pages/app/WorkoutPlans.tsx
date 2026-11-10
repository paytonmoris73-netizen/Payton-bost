import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useApp } from "../../contexts/AppContext";
import { WORKOUT_PLANS } from "../../data/workoutPlans";

function ProgressRing({ percent, size = 72, color = "#FF6B35" }: { percent: number; size?: number; color?: string }) {
  const r = (size - 12) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (percent / 100) * circ;
  const cx = size / 2;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={cx} cy={cx} r={r} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="8" />
      <motion.circle
        cx={cx} cy={cx} r={r}
        fill="none" stroke={color} strokeWidth="8" strokeLinecap="round"
        strokeDasharray={circ} strokeDashoffset={circ}
        transform={`rotate(-90 ${cx} ${cx})`}
        animate={{ strokeDashoffset: offset }}
        transition={{ duration: 1.0, ease: "easeOut" }}
      />
      <text x={cx} y={cx + 5} textAnchor="middle" fill="white" fontSize="13" fontWeight="800">{percent}%</text>
    </svg>
  );
}

export function WorkoutPlansPage() {
  const navigate = useNavigate();
  const { state } = useApp();

  const activePlanId = state.activePlanId;
  const planProgress = state.planProgress;

  function getPlanProgress(planId: string) {
    const prog = planProgress[planId];
    if (!prog) return 0;
    const plan = WORKOUT_PLANS.find(p => p.id === planId);
    if (!plan) return 0;
    const totalDays = plan.weeks.reduce((acc, w) => acc + w.days.length, 0);
    return totalDays > 0 ? Math.round((prog.completedDays.length / totalDays) * 100) : 0;
  }

  const activePlan = WORKOUT_PLANS.find(p => p.id === activePlanId);
  const otherPlans = WORKOUT_PLANS.filter(p => p.id !== activePlanId);

  return (
    <motion.div
      className="min-h-screen bg-pp-navy pb-24 px-4 pt-4"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }}
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-full bg-pp-card flex items-center justify-center">
          <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div>
          <h1 className="text-2xl font-bold text-white font-fredoka">Workout Plans</h1>
          <p className="text-pp-border text-sm">Choose your adventure in fitness</p>
        </div>
      </div>

      {/* Active Plan Card */}
      {activePlan && (
        <motion.div
          className="mb-6 rounded-2xl overflow-hidden"
          style={{ background: `linear-gradient(135deg, ${activePlan.thumbnailColor}33, ${activePlan.thumbnailColor}11)`, border: `1px solid ${activePlan.thumbnailColor}44` }}
          whileTap={{ scale: 0.98 }}
          onClick={() => navigate(`/app/workout-plans/${activePlan.id}`)}
        >
          <div className="p-4">
            <div className="flex items-start gap-3 mb-3">
              <ProgressRing percent={getPlanProgress(activePlan.id)} color={activePlan.thumbnailColor} />
              <div className="flex-1">
                <div className="inline-flex items-center gap-1 bg-pp-orange/20 rounded-full px-2 py-0.5 mb-1">
                  <span className="w-2 h-2 rounded-full bg-pp-orange animate-pulse" />
                  <span className="text-pp-orange text-xs font-bold">ACTIVE PLAN</span>
                </div>
                <h2 className="text-white font-bold text-lg leading-tight">{activePlan.emoji} {activePlan.name}</h2>
                <p className="text-pp-border text-sm mt-0.5">{activePlan.description}</p>
              </div>
            </div>

            {/* Week progress */}
            <div className="space-y-2">
              {activePlan.weeks.map((week) => {
                const completedInWeek = (planProgress[activePlan.id]?.completedDays ?? [])
                  .filter(d => d.startsWith(`w${week.weekNumber}`)).length;
                const pct = Math.round((completedInWeek / week.days.length) * 100);
                return (
                  <div key={week.weekNumber} className="flex items-center gap-2">
                    <span className="text-sm text-pp-border w-14 shrink-0">{week.illustration} Wk {week.weekNumber}</span>
                    <div className="flex-1 h-2 bg-pp-border/30 rounded-full overflow-hidden">
                      <motion.div
                        className="h-full rounded-full"
                        style={{ background: activePlan.thumbnailColor }}
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.8, delay: week.weekNumber * 0.1 }}
                      />
                    </div>
                    <span className="text-xs text-pp-border w-8 text-right">{completedInWeek}/{week.days.length}</span>
                  </div>
                );
              })}
            </div>

            <button
              className="mt-4 w-full py-3 rounded-xl font-bold text-white text-sm"
              style={{ background: activePlan.thumbnailColor }}
            >
              Continue Plan →
            </button>
          </div>
        </motion.div>
      )}

      {/* Other Plans */}
      <h2 className="text-white font-bold text-lg font-fredoka mb-3">
        {activePlan ? "Other Plans" : "Choose a Plan"}
      </h2>
      <div className="space-y-3">
        {otherPlans.map((plan, i) => {
          const prog = getPlanProgress(plan.id);
          const totalDays = plan.weeks.reduce((acc, w) => acc + w.days.length, 0);
          return (
            <motion.div
              key={plan.id}
              className="bg-pp-card rounded-2xl p-4 cursor-pointer"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => navigate(`/app/workout-plans/${plan.id}`)}
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl shrink-0"
                  style={{ background: `${plan.thumbnailColor}22` }}
                >
                  {plan.emoji}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <h3 className="text-white font-bold text-base truncate">{plan.name}</h3>
                    <span
                      className="text-xs px-2 py-0.5 rounded-full shrink-0 font-semibold"
                      style={{ background: `${plan.thumbnailColor}22`, color: plan.thumbnailColor }}
                    >
                      {plan.difficulty}
                    </span>
                  </div>
                  <p className="text-pp-border text-xs line-clamp-1">{plan.description}</p>
                  <div className="flex items-center gap-3 mt-1.5 text-xs text-pp-border">
                    <span>📅 {plan.weeks.length} weeks</span>
                    <span>🏃 {totalDays} workouts</span>
                    <span>⚡ {plan.category}</span>
                  </div>
                </div>
                {prog > 0 && (
                  <ProgressRing percent={prog} size={48} color={plan.thumbnailColor} />
                )}
              </div>

              {prog > 0 && (
                <div className="mt-3">
                  <div className="h-1.5 bg-pp-border/30 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full rounded-full"
                      style={{ background: plan.thumbnailColor }}
                      initial={{ width: 0 }}
                      animate={{ width: `${prog}%` }}
                      transition={{ duration: 0.6 }}
                    />
                  </div>
                </div>
              )}
            </motion.div>
          );
        })}
      </div>

      {WORKOUT_PLANS.length === 0 && (
        <div className="text-center py-16 text-pp-border">
          <div className="text-5xl mb-3">🏋️</div>
          <p>No plans available yet</p>
        </div>
      )}
    </motion.div>
  );
}
