import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useApp } from "../../contexts/AppContext";
import { ACTIVITIES } from "../../data/activities";
import { ACHIEVEMENTS } from "../../data/achievements";
import { getCreatureById } from "../../data/creatures";
import { ProgressBar } from "../../components/ui/ProgressBar";

export function ProfilePage() {
  const navigate = useNavigate();
  const { activeProfile, profileSessions, profileAchievements, selectProfile, state, levelInfo, worldRebloom, profileCreatures } = useApp();

  if (!activeProfile) return null;

  const sessions = profileSessions(activeProfile.id);
  const achievements = profileAchievements(activeProfile.id);
  const creatures = profileCreatures(activeProfile.id);
  const totalActivities = sessions.length;
  const uniqueCategories = new Set(sessions.map(s => ACTIVITIES.find(a => a.id === s.activityId)?.category ?? "").filter(Boolean)).size;
  const companion = activeProfile.selectedCompanionId ? getCreatureById(activeProfile.selectedCompanionId) : null;
  const levelProgress = Math.min(100, ((activeProfile.points) / levelInfo.nextLevelPoints) * 100);

  return (
    <div className="pb-24 lg:pb-8">
      {/* Hero header */}
      <div className="relative px-5 pt-6 pb-8 bg-gradient-to-br from-purple/30 via-sky-blue/20 to-mint/20 dark:from-purple/20 dark:via-adventure-navy dark:to-gray-950">
        <div className="absolute top-0 right-0 w-48 h-48 rounded-full bg-purple/10 -translate-y-1/2 translate-x-1/3" />

        <div className="relative flex items-center gap-4">
          {/* Avatar */}
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate("/app/avatar")}
            className="w-20 h-20 rounded-full flex items-center justify-center text-5xl shadow-card border-4 border-white dark:border-gray-700 relative flex-shrink-0"
            style={{ backgroundColor: activeProfile.avatarConfig.background }}
          >
            {activeProfile.avatarConfig.outfit}
            <div className="absolute -bottom-1 -right-1 bg-white dark:bg-gray-800 rounded-full w-7 h-7 flex items-center justify-center text-sm shadow-sm">✏️</div>
          </motion.button>

          <div className="flex-1 min-w-0">
            <h1 className="font-display text-2xl text-adventure-navy dark:text-white truncate">{activeProfile.nickname}</h1>
            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
              <span className="bg-purple text-white text-xs font-bold px-2 py-0.5 rounded-full">Lv.{levelInfo.level}</span>
              <span className="text-xs text-gray-500 font-bold">{levelInfo.title}</span>
            </div>
            {companion && (
              <div className="flex items-center gap-1.5 mt-1">
                <span className="text-sm">{companion.emoji}</span>
                <span className="text-xs text-gray-500">with {companion.name}</span>
              </div>
            )}
          </div>

          {/* Spark Points */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl px-3 py-2 text-center shadow-card flex-shrink-0">
            <div className="text-xl">⚡</div>
            <div className="font-display text-lg text-adventure-navy dark:text-white leading-none">{activeProfile.points}</div>
            <div className="text-xs text-gray-400">Spark</div>
          </div>
        </div>

        {/* Level bar */}
        <div className="mt-4 relative">
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>Level {levelInfo.level}</span>
            <span>Level {levelInfo.level + 1}</span>
          </div>
          <div className="h-3 bg-white/40 dark:bg-gray-700 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-purple to-sky-blue rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${levelProgress}%` }}
              transition={{ duration: 1 }}
            />
          </div>
        </div>
      </div>

      <div className="px-5 py-4 space-y-4">
        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: "Adventures", value: totalActivities, emoji: "⚡", color: "#FF6B6B" },
            { label: "Creatures", value: creatures.length, emoji: "🐾", color: "#6BCB77" },
            { label: "Achievements", value: achievements.length, emoji: "🏆", color: "#FFD93D" },
            { label: "Categories", value: uniqueCategories, emoji: "🗺️", color: "#9B5DE5" },
          ].map(stat => (
            <div key={stat.label} className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-card flex items-center gap-3">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
                style={{ backgroundColor: `${stat.color}20` }}
              >
                {stat.emoji}
              </div>
              <div>
                <div className="font-display text-2xl text-adventure-navy dark:text-white">{stat.value}</div>
                <div className="text-xs text-gray-400">{stat.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Adventure Progress */}
        <div className="bg-white dark:bg-gray-800 rounded-3xl p-5 shadow-card">
          <h3 className="font-display text-lg text-adventure-navy dark:text-white mb-3">Adventure Progress</h3>
          <div className="space-y-3">
            <ProgressBar value={(totalActivities / 20) * 100} label={`${totalActivities}/20 adventures`} color="#FF6B6B" />
            <ProgressBar value={(worldRebloom)} label={`${worldRebloom}% world restored`} color="#6BCB77" />
            <ProgressBar value={(state.unlockedLocations.length / 6) * 100} label={`${state.unlockedLocations.length}/6 worlds unlocked`} color="#9B5DE5" />
          </div>
        </div>

        {/* Achievements preview */}
        <div className="bg-white dark:bg-gray-800 rounded-3xl p-5 shadow-card">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-display text-lg text-adventure-navy dark:text-white">Achievements</h3>
            <button onClick={() => navigate("/app/achievements")} className="text-xs text-sky-blue font-bold">See All →</button>
          </div>
          {achievements.length === 0 ? (
            <div className="text-center py-4">
              <div className="text-3xl mb-2">🏆</div>
              <div className="text-sm text-gray-500">Complete activities to earn achievements!</div>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {achievements.slice(0, 6).map(ua => {
                const ach = ACHIEVEMENTS.find(a => a.id === ua.achievementId);
                if (!ach) return null;
                return (
                  <div key={ua.achievementId} className="w-12 h-12 rounded-full bg-sunny-yellow/20 flex items-center justify-center text-2xl" title={ach.name}>
                    {ach.emoji}
                  </div>
                );
              })}
              {achievements.length > 6 && (
                <div className="w-12 h-12 rounded-full bg-soft-gray dark:bg-gray-700 flex items-center justify-center text-xs font-bold text-gray-500">
                  +{achievements.length - 6}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Creature companion */}
        {companion ? (
          <div className="bg-white dark:bg-gray-800 rounded-3xl p-5 shadow-card flex items-center gap-4">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center text-4xl flex-shrink-0"
              style={{ backgroundColor: `${companion.color}30` }}
            >
              {companion.emoji}
            </div>
            <div className="flex-1">
              <p className="text-xs text-gray-400 font-bold">Current Companion</p>
              <p className="font-display text-lg text-adventure-navy dark:text-white">{companion.name}</p>
              <p className="text-xs text-gray-500 italic">"{companion.idleMessage}"</p>
            </div>
            <button onClick={() => navigate("/app/creatures")} className="text-xs text-sky-blue font-bold">Change →</button>
          </div>
        ) : (
          <button
            onClick={() => navigate("/app/creatures")}
            className="w-full bg-white dark:bg-gray-800 rounded-3xl p-4 shadow-card flex items-center gap-3 active:scale-95 transition-transform"
          >
            <div className="text-3xl">🐾</div>
            <div className="flex-1 text-left">
              <p className="font-bold text-adventure-navy dark:text-white text-sm">No companion yet</p>
              <p className="text-xs text-gray-500">Discover creatures on adventures!</p>
            </div>
            <div className="text-sky-blue">→</div>
          </button>
        )}

        {/* Recent activity */}
        {sessions.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-3xl p-5 shadow-card">
            <h3 className="font-display text-lg text-adventure-navy dark:text-white mb-3">Recent Adventures</h3>
            <div className="space-y-2">
              {sessions.slice(-3).reverse().map(s => {
                const act = ACTIVITIES.find(a => a.id === s.activityId);
                return (
                  <div key={s.id} className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0" style={{ backgroundColor: act?.color ?? "#F0EFEB" }}>
                      {act?.emoji ?? "🏃"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-adventure-navy dark:text-white text-sm truncate">{s.activityName}</div>
                      <div className="text-xs text-gray-400">{new Date(s.completedAt).toLocaleDateString()}</div>
                    </div>
                    <div className="text-xs text-coral font-bold">+{s.pointsEarned} ⚡</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="space-y-2">
          <button
            className="w-full bg-gradient-to-r from-purple to-sky-blue text-white font-display text-lg py-4 rounded-3xl shadow-card active:scale-95 transition-transform"
            onClick={() => navigate("/app/rewards")}
          >
            🛍️ Reward Shop ({activeProfile.points} ⚡)
          </button>
          <button
            className="w-full bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 font-bold py-3 rounded-3xl shadow-card active:scale-95 transition-transform"
            onClick={() => { selectProfile(null); navigate("/profiles"); }}
          >
            Switch Profile
          </button>
        </div>
      </div>
    </div>
  );
}
