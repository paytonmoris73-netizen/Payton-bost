import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useApp } from "../../contexts/AppContext";
import { Pip } from "../../components/mascot/Pip";
import { ACTIVITIES } from "../../data/activities";
import { WORKOUT_PLANS } from "../../data/workoutPlans";

const CATEGORY_CARDS = [
  { label: "Quick Moves",    emoji: "👟", gradient: "from-blue-500 to-blue-700",    path: "quick-moves" },
  { label: "Sports",         emoji: "🏀", gradient: "from-pp-orange to-orange-700", path: "sports" },
  { label: "Dance",          emoji: "🎵", gradient: "from-pp-pink to-pink-700",     path: "dance" },
  { label: "Stretch & Relax",emoji: "🧘", gradient: "from-pp-teal to-teal-700",     path: "stretching" },
  { label: "Balance",        emoji: "⚡", gradient: "from-pp-purple to-purple-700", path: "balance" },
];

function ProgressRing({ percent }: { percent: number }) {
  const r = 40;
  const circ = 2 * Math.PI * r;
  const offset = circ - (percent / 100) * circ;
  return (
    <svg width="96" height="96" viewBox="0 0 96 96">
      <circle cx="48" cy="48" r={r} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="8" />
      <motion.circle
        cx="48" cy="48" r={r}
        fill="none"
        stroke="#FF6B35"
        strokeWidth="8"
        strokeLinecap="round"
        strokeDasharray={circ}
        strokeDashoffset={circ}
        transform="rotate(-90 48 48)"
        animate={{ strokeDashoffset: offset }}
        transition={{ duration: 1.2, ease: "easeOut", delay: 0.3 }}
      />
      <text x="48" y="53" textAnchor="middle" fill="white" fontSize="18" fontWeight="900">{percent}%</text>
    </svg>
  );
}

export function HomePage() {
  const navigate = useNavigate();
  const { activeProfile, levelInfo, worldRebloom, dailyMissions, isMissionCompleted, profileSessions, profileAchievements, state } = useApp();

  if (!activeProfile) return null;

  const sessions = profileSessions(activeProfile.id);
  const achievements = profileAchievements(activeProfile.id);
  const totalActivities = sessions.length;
  const weekActivity = sessions.filter(s => {
    const d = new Date(s.completedAt);
    const now = new Date();
    return (now.getTime() - d.getTime()) < 7 * 24 * 60 * 60 * 1000;
  }).length;
  const progressPct = Math.min(100, Math.round((weekActivity / 5) * 100));

  const featuredActivity = ACTIVITIES[totalActivities % ACTIVITIES.length];
  const activePlan = WORKOUT_PLANS.find(p => p.id === state.activePlanId);
  const activePlanProgress = state.activePlanId ? state.planProgress[state.activePlanId] : null;
  const activePlanTotalDays = activePlan?.weeks.reduce((a, w) => a + w.days.length, 0) ?? 0;
  const activePlanCompletedDays = activePlanProgress?.completedDays.length ?? 0;
  const activePlanPct = activePlanTotalDays > 0 ? Math.round((activePlanCompletedDays / activePlanTotalDays) * 100) : 0;
  const xpToNext = levelInfo.nextLevelPoints - activeProfile.points;
  const xpProgress = Math.max(0, Math.min(100, 100 - (xpToNext / (levelInfo.nextLevelPoints - (levelInfo.level - 1) * 500)) * 100));

  return (
    <motion.div
      className="pb-24 lg:pb-8 min-h-screen bg-pp-navy"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* ── Header bar ── */}
      <div className="sticky top-0 z-20 bg-pp-navy/90 backdrop-blur-sm border-b border-pp-border px-5 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-pp-orange flex items-center justify-center">
            <span className="text-white font-display text-sm">P</span>
          </div>
          <span className="font-display text-pp-cream text-lg tracking-wide">PlayPulse</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 bg-pp-card border border-pp-border rounded-full px-3 py-1.5">
            <span className="text-pp-orange text-sm">🔥</span>
            <span className="text-pp-gold font-black text-sm">{activeProfile.points}</span>
          </div>
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-pp-orange to-pp-purple flex items-center justify-center text-lg cursor-pointer"
            onClick={() => navigate("/app/profile")}>
            {activeProfile.avatarConfig.outfit || "🦊"}
          </div>
        </div>
      </div>

      {/* ── Hero section ── */}
      <div className="relative overflow-hidden px-5 pt-6 pb-4"
        style={{ background: "linear-gradient(135deg, #2A1F5C 0%, #1A1935 60%, #0F0E2A 100%)" }}>
        {/* Stars */}
        <div className="absolute inset-0 stars-bg pointer-events-none" />
        {/* Glow blobs */}
        <div className="absolute top-4 right-16 w-32 h-32 rounded-full bg-pp-orange/10 blur-2xl pointer-events-none" />
        <div className="absolute bottom-0 left-8 w-24 h-24 rounded-full bg-pp-purple/10 blur-2xl pointer-events-none" />

        <div className="relative flex items-end justify-between gap-4">
          <div className="flex-1">
            <p className="text-pp-muted text-sm mb-1">Good to see you!</p>
            <h1 className="font-display text-3xl text-pp-cream leading-tight">
              Hey {activeProfile.nickname}!
            </h1>
            <p className="text-pp-muted text-sm mt-1">Ready to move today?</p>

            {/* Level badge */}
            <div className="mt-4 inline-flex flex-col gap-1.5">
              <div className="flex items-center gap-2">
                <div className="hex-clip w-9 h-9 bg-pp-gold flex items-center justify-center">
                  <span className="font-display text-pp-navy text-sm">{levelInfo.level}</span>
                </div>
                <div>
                  <div className="text-pp-gold font-black text-xs uppercase tracking-wider">Explorer Level</div>
                  <div className="text-pp-muted text-xs">{activeProfile.points} / {levelInfo.nextLevelPoints} SP</div>
                </div>
              </div>
              <div className="w-40 h-2 bg-pp-border rounded-full overflow-hidden">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-pp-gold to-pp-orange"
                  initial={{ width: 0 }}
                  animate={{ width: `${xpProgress}%` }}
                  transition={{ duration: 1, ease: "easeOut", delay: 0.5 }}
                />
              </div>
            </div>
          </div>

          {/* PIP */}
          <div className="flex-shrink-0 -mb-2">
            <Pip expression="happy" size={150} animate />
          </div>
        </div>
      </div>

      <div className="px-5 space-y-4 mt-4">
        {/* ── Today's Mission ── */}
        {dailyMissions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="rounded-2xl overflow-hidden border border-pp-border"
            style={{ background: "linear-gradient(135deg, #1E3A8A, #1E40AF)" }}
          >
            <div className="p-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-white/15 flex items-center justify-center text-2xl flex-shrink-0">
                📅
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-blue-200 text-xs font-bold uppercase tracking-wider mb-0.5">Today's Mission</div>
                <div className="text-white font-black text-sm truncate">{dailyMissions[0].description}</div>
                <div className="text-pp-gold font-bold text-xs mt-0.5">+{dailyMissions[0].sparkReward} SP</div>
              </div>
              <button
                onClick={() => navigate("/app/explore")}
                className="w-10 h-10 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center text-white transition-colors flex-shrink-0"
              >
                →
              </button>
            </div>
          </motion.div>
        )}

        {/* ── Active Plan Card ── */}
        {activePlan && (
          <motion.div
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}
            className="rounded-2xl border overflow-hidden cursor-pointer"
            style={{ background: `linear-gradient(135deg, ${activePlan.thumbnailColor}22, transparent)`, borderColor: `${activePlan.thumbnailColor}44` }}
            onClick={() => navigate(`/app/workout-plans/${activePlan.id}`)}
          >
            <div className="p-4 flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0"
                style={{ background: `${activePlan.thumbnailColor}22` }}>
                {activePlan.emoji}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-bold text-pp-orange mb-0.5">ACTIVE PLAN</div>
                <div className="text-white font-bold text-sm truncate">{activePlan.name}</div>
                <div className="flex items-center gap-2 mt-1.5">
                  <div className="flex-1 h-1.5 bg-pp-border/30 rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ background: activePlan.thumbnailColor, width: `${activePlanPct}%` }} />
                  </div>
                  <span className="text-xs text-pp-border">{activePlanPct}%</span>
                </div>
              </div>
              <span className="text-white text-lg">→</span>
            </div>
          </motion.div>
        )}

        {/* ── Workout Plans Button (if no active plan) ── */}
        {!activePlan && (
          <motion.div
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}
            className="bg-pp-card border border-pp-border rounded-2xl p-4 flex items-center gap-3 cursor-pointer"
            onClick={() => navigate("/app/workout-plans")}
          >
            <div className="w-12 h-12 rounded-xl bg-pp-orange/20 flex items-center justify-center text-2xl shrink-0">💪</div>
            <div className="flex-1">
              <div className="text-white font-bold text-sm">Start a Workout Plan</div>
              <div className="text-pp-border text-xs">3 plans available — build a habit!</div>
            </div>
            <span className="text-pp-orange font-bold">→</span>
          </motion.div>
        )}

        {/* ── Featured Workout ── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          className="rounded-3xl overflow-hidden relative cursor-pointer"
          style={{ background: "linear-gradient(135deg, #FF6B6B, #FF6B35, #FF8C00)", minHeight: 160 }}
          onClick={() => navigate(`/app/activity/${featuredActivity.id}`)}
        >
          {/* Silhouette art */}
          <div className="absolute right-0 bottom-0 opacity-20 pointer-events-none">
            <svg width="120" height="130" viewBox="0 0 120 130">
              {/* Running figure silhouette */}
              <ellipse cx="60" cy="18" rx="12" ry="12" fill="white" />
              <path d="M60 30 L52 55 L40 75 L48 76 L58 60 L60 70 L50 90 L58 92 L66 72 L68 55 L78 72 L85 68 L72 48 L68 30 Z" fill="white" />
              <line x1="52" y1="40" x2="38" y2="52" stroke="white" strokeWidth="6" strokeLinecap="round" />
              <line x1="68" y1="40" x2="82" y2="52" stroke="white" strokeWidth="6" strokeLinecap="round" />
            </svg>
          </div>
          <div className="p-5">
            <div className="inline-flex items-center gap-1.5 bg-black/20 rounded-full px-3 py-1 mb-3">
              <span className="text-xs">⚡</span>
              <span className="text-white text-xs font-bold">Featured Workout</span>
            </div>
            <h2 className="font-display text-white text-2xl leading-tight">{featuredActivity.name}</h2>
            <p className="text-white/80 text-sm mt-1 mb-4">{featuredActivity.description}</p>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 bg-black/20 rounded-full px-3 py-1">
                <span className="text-white/80 text-xs">🕐</span>
                <span className="text-white text-xs font-bold">{featuredActivity.durationMin} min</span>
              </div>
              <button
                className="flex items-center gap-2 bg-pp-gold text-pp-navy font-black text-sm px-5 py-2.5 rounded-full hover:brightness-110 transition-all shadow-glow-gold"
                onClick={e => { e.stopPropagation(); navigate(`/app/activity/${featuredActivity.id}`); }}
              >
                Start Workout ▶
              </button>
            </div>
          </div>
        </motion.div>

        {/* ── Progress card ── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="bg-pp-card border border-pp-border rounded-3xl p-5"
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-display text-pp-cream text-lg">Your Progress</h3>
            <button onClick={() => navigate("/app/profile")} className="text-pp-orange text-xs font-bold">View All →</button>
          </div>
          <div className="flex items-center gap-5">
            <ProgressRing percent={progressPct} />
            <div className="flex-1 space-y-2.5">
              <div className="flex items-center gap-2.5">
                <div className="w-6 h-6 rounded-full bg-pp-green/20 flex items-center justify-center">
                  <span className="text-pp-green text-xs">✓</span>
                </div>
                <span className="text-pp-cream text-sm font-semibold">{totalActivities} Activities</span>
              </div>
              <div className="flex items-center gap-2.5">
                <div className="w-6 h-6 rounded-full bg-pp-purple/20 flex items-center justify-center">
                  <span className="text-pp-purple text-xs">⭐</span>
                </div>
                <span className="text-pp-cream text-sm font-semibold">{Math.min(6, Math.floor(totalActivities / 3))} Locations</span>
              </div>
              <div className="flex items-center gap-2.5">
                <div className="w-6 h-6 rounded-full bg-pp-gold/20 flex items-center justify-center">
                  <span className="text-pp-gold text-xs">🏆</span>
                </div>
                <span className="text-pp-cream text-sm font-semibold">{achievements.length} Badges</span>
              </div>
              <p className="text-pp-muted text-xs">You're doing amazing!</p>
            </div>
          </div>
        </motion.div>

        {/* ── Explore Activities ── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-display text-pp-cream text-lg">Explore Activities</h3>
            <button onClick={() => navigate("/app/explore")} className="text-pp-orange text-xs font-bold">See All →</button>
          </div>
          <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2">
            {CATEGORY_CARDS.map(cat => (
              <button
                key={cat.path}
                onClick={() => navigate(`/app/explore?cat=${cat.path}`)}
                className={`flex-shrink-0 w-28 h-28 rounded-2xl bg-gradient-to-br ${cat.gradient} flex flex-col items-center justify-center gap-2 shadow-card-dark hover:scale-105 transition-transform`}
              >
                <span className="text-3xl">{cat.emoji}</span>
                <span className="text-white font-bold text-xs text-center leading-tight px-1">{cat.label}</span>
              </button>
            ))}
          </div>
        </motion.div>

        {/* ── World Rebloom ── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="rounded-3xl overflow-hidden"
          style={{ background: "linear-gradient(135deg, #4C1D95, #7C3AED, #5B21B6)" }}
        >
          <div className="p-5 relative overflow-hidden">
            <div className="absolute top-0 right-0 text-6xl opacity-20 pointer-events-none select-none" style={{ lineHeight: 1 }}>✨</div>
            <div className="absolute bottom-0 left-16 text-4xl opacity-15 pointer-events-none select-none">⭐</div>
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <div className="text-purple-200 text-xs font-bold uppercase tracking-wider mb-1">World Rebloom</div>
                <h3 className="font-display text-white text-lg">🎁 Unlock cool rewards!</h3>
                <p className="text-purple-200 text-xs mt-1">Complete more adventures to restore Wonderworld.</p>
                <div className="mt-2 w-full h-2 bg-white/20 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full rounded-full bg-gradient-to-r from-pp-gold to-pp-orange"
                    initial={{ width: 0 }}
                    animate={{ width: `${worldRebloom}%` }}
                    transition={{ duration: 1, delay: 0.6 }}
                  />
                </div>
                <div className="text-purple-200 text-xs mt-1">{worldRebloom}% restored</div>
              </div>
              <button
                onClick={() => navigate("/app/rewards")}
                className="flex-shrink-0 bg-pp-gold text-pp-navy font-black text-sm px-4 py-2.5 rounded-full hover:brightness-110 transition-all"
              >
                Go to Rewards →
              </button>
            </div>
          </div>
        </motion.div>

        {/* ── Daily Missions ── */}
        {dailyMissions.length > 1 && (
          <motion.div
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
            className="bg-pp-card border border-pp-border rounded-3xl p-5"
          >
            <h3 className="font-display text-pp-cream text-lg mb-3">Daily Missions</h3>
            <div className="space-y-2.5">
              {dailyMissions.slice(0, 3).map(m => {
                const done = isMissionCompleted(m.id);
                return (
                  <div key={m.id} className={`flex items-center gap-3 p-3 rounded-2xl border transition-colors ${done ? "border-pp-green/30 bg-pp-green/10" : "border-pp-border hover:border-pp-orange/30"}`}>
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl ${done ? "bg-pp-green/20" : "bg-pp-border"}`}>
                      {m.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className={`font-semibold text-sm truncate ${done ? "text-pp-green" : "text-pp-cream"}`}>{m.description}</div>
                      <div className="text-pp-gold text-xs font-bold">+{m.sparkReward} SP</div>
                    </div>
                    {done && <span className="text-pp-green text-lg">✓</span>}
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
