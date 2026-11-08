import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useApp } from "../../contexts/AppContext";
import { ACTIVITIES } from "../../data/activities";
import { ACHIEVEMENTS } from "../../data/achievements";
import { CREATURES } from "../../data/creatures";

export function ProfilePage() {
  const navigate = useNavigate();
  const { activeProfile, profileSessions, profileAchievements, profileCreatures, selectProfile, levelInfo, worldRebloom } = useApp();

  if (!activeProfile) return null;

  const sessions = profileSessions(activeProfile.id);
  const achievements = profileAchievements(activeProfile.id);
  const ownedCreatures = profileCreatures(activeProfile.id);
  const totalActivities = sessions.length;
  const uniqueCategories = new Set(sessions.map(s => ACTIVITIES.find(a => a.id === s.activityId)?.category ?? "").filter(Boolean)).size;

  const xpProgress = Math.max(0, Math.min(100, 100 - ((levelInfo.nextLevelPoints - activeProfile.points) / (levelInfo.nextLevelPoints - (levelInfo.level - 1) * 500)) * 100));

  const companion = activeProfile.selectedCompanionId
    ? CREATURES.find(c => c.id === activeProfile.selectedCompanionId)
    : ownedCreatures.length > 0
    ? CREATURES.find(c => c.id === ownedCreatures[0].creatureId)
    : null;

  const STATS = [
    { label: "Adventures",  value: totalActivities, emoji: "🏃" },
    { label: "Categories",  value: uniqueCategories, emoji: "🗂️" },
    { label: "Creatures",   value: ownedCreatures.length, emoji: "🐾" },
    { label: "Spark Points",value: activeProfile.points, emoji: "⚡" },
  ];

  return (
    <motion.div
      className="pb-24 lg:pb-8 min-h-screen bg-pp-navy"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }}
    >
      {/* Hero */}
      <div
        className="relative px-5 pt-8 pb-6 text-center overflow-hidden"
        style={{ background: "linear-gradient(135deg, #1E1B4B, #2A2060, #0F0E2A)" }}
      >
        <div className="absolute inset-0 stars-bg pointer-events-none" />

        <div className="relative">
          {/* Avatar ring */}
          <div className="relative inline-block mb-3">
            <div className="w-24 h-24 rounded-full ring-4 ring-pp-gold/60 mx-auto flex items-center justify-center text-5xl"
              style={{ background: `radial-gradient(circle at 40% 35%, ${activeProfile.avatarConfig.background || "#FF6B35"}, ${activeProfile.avatarConfig.background || "#7C3AED"}88)` }}
            >
              {activeProfile.avatarConfig.outfit || "🦊"}
            </div>
            <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-pp-gold rounded-full flex items-center justify-center cursor-pointer hover:scale-110 transition-transform"
              onClick={() => navigate("/app/avatar")}>
              <span className="text-pp-navy text-sm">✏️</span>
            </div>
          </div>

          <h1 className="font-display text-pp-cream text-2xl">{activeProfile.nickname}</h1>

          {/* Level */}
          <div className="flex items-center justify-center gap-2 mt-2 mb-3">
            <div className="hex-clip w-8 h-8 bg-pp-gold flex items-center justify-center">
              <span className="font-display text-pp-navy text-xs">{levelInfo.level}</span>
            </div>
            <span className="text-pp-gold font-black text-sm">{levelInfo.title}</span>
          </div>

          {/* XP bar */}
          <div className="max-w-xs mx-auto">
            <div className="flex justify-between text-pp-muted text-xs mb-1">
              <span>{activeProfile.points} SP</span>
              <span>{levelInfo.nextLevelPoints} SP</span>
            </div>
            <div className="h-2.5 bg-pp-border rounded-full overflow-hidden">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-pp-gold to-pp-orange"
                initial={{ width: 0 }}
                animate={{ width: `${xpProgress}%` }}
                transition={{ duration: 1, ease: "easeOut", delay: 0.3 }}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="px-5 mt-5 space-y-4">
        {/* Companion */}
        {companion && (
          <motion.div
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="bg-pp-card border border-pp-border rounded-3xl p-4 flex items-center gap-4"
          >
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-4xl"
              style={{ background: `linear-gradient(135deg, ${companion.color}33, ${companion.color}66)` }}>
              {companion.emoji}
            </div>
            <div>
              <div className="text-pp-muted text-xs font-bold uppercase tracking-wider">Companion</div>
              <div className="font-display text-pp-cream text-lg">{companion.name}</div>
              <div className="text-pp-muted text-xs">{companion.idleMessage}</div>
            </div>
            <button onClick={() => navigate("/app/creatures")} className="ml-auto text-pp-orange text-xs font-bold">Change →</button>
          </motion.div>
        )}

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-3">
          {STATS.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 + i * 0.05 }}
              className="glass rounded-2xl p-4 text-center"
            >
              <div className="text-2xl mb-1">{s.emoji}</div>
              <div className="font-display text-pp-cream text-2xl">{s.value}</div>
              <div className="text-pp-muted text-xs">{s.label}</div>
            </motion.div>
          ))}
        </div>

        {/* World Rebloom */}
        <div className="bg-pp-card border border-pp-border rounded-2xl p-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-pp-cream font-bold text-sm">🌍 World Rebloom</span>
            <span className="text-pp-green font-bold text-sm">{worldRebloom}%</span>
          </div>
          <div className="h-3 bg-pp-border rounded-full overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-pp-green to-pp-teal"
              initial={{ width: 0 }}
              animate={{ width: `${worldRebloom}%` }}
              transition={{ duration: 1, delay: 0.4 }}
            />
          </div>
        </div>

        {/* Achievements preview */}
        <div className="bg-pp-card border border-pp-border rounded-3xl p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-display text-pp-cream text-lg">Achievements</h3>
            <button onClick={() => navigate("/app/rewards")} className="text-pp-orange text-xs font-bold">See All →</button>
          </div>
          {achievements.length === 0 ? (
            <p className="text-pp-muted text-sm text-center py-3">Complete activities to earn achievements!</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {achievements.slice(0, 8).map(ua => {
                const ach = ACHIEVEMENTS.find(a => a.id === ua.achievementId);
                if (!ach) return null;
                return (
                  <div key={ua.achievementId}
                    className="w-12 h-12 rounded-2xl bg-pp-gold/20 border border-pp-gold/30 flex items-center justify-center text-2xl"
                    title={ach.name}>
                    {ach.emoji}
                  </div>
                );
              })}
              {achievements.length > 8 && (
                <div className="w-12 h-12 rounded-2xl bg-pp-border flex items-center justify-center text-xs font-bold text-pp-muted">
                  +{achievements.length - 8}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Recent activities */}
        {sessions.length > 0 && (
          <div className="bg-pp-card border border-pp-border rounded-3xl p-5">
            <h3 className="font-display text-pp-cream text-lg mb-3">Recent Activities</h3>
            <div className="space-y-2">
              {sessions.slice(-3).reverse().map(s => {
                const act = ACTIVITIES.find(a => a.id === s.activityId);
                return (
                  <div key={s.id} className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                      style={{ background: (act?.color ?? "#FF6B35") + "33" }}>
                      {act?.emoji ?? "🏃"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-pp-cream text-sm truncate">{s.activityName}</div>
                      <div className="text-pp-muted text-xs">{new Date(s.completedAt).toLocaleDateString()}</div>
                    </div>
                    <div className="text-pp-gold text-xs font-black">+{s.pointsEarned} SP</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="space-y-2">
          <button
            onClick={() => navigate("/app/rewards")}
            className="w-full py-3.5 rounded-2xl bg-pp-orange text-white font-black hover:brightness-110 transition-all shadow-glow-orange"
          >
            🛍️ Visit Reward Shop ({activeProfile.points} SP)
          </button>
          <button
            onClick={() => { selectProfile(null); navigate("/profiles"); }}
            className="w-full py-3.5 rounded-2xl bg-pp-card border border-pp-border text-pp-muted font-bold hover:text-pp-cream transition-colors"
          >
            Switch Profile
          </button>
        </div>
      </div>
    </motion.div>
  );
}
