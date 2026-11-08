import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useApp } from "../../contexts/AppContext";
import { ACTIVITIES } from "../../data/activities";
import { Pip } from "../../components/mascot/Pip";
import { getCreatureById } from "../../data/creatures";

const HOUR = new Date().getHours();
const GREETINGS = HOUR < 12 ? "Good morning" : HOUR < 17 ? "Good afternoon" : "Good evening";

const REGION_BACKGROUNDS: Record<string, { from: string; to: string; label: string }> = {
  "sunny-meadow": { from: "#6BCB77", to: "#A5D6A7", label: "🌻 Sunny Meadow" },
  "whispering-forest": { from: "#2D6A4F", to: "#52B788", label: "🌲 Whispering Forest" },
  "ocean-discovery": { from: "#0288D1", to: "#4FC3F7", label: "🌊 Ocean Discovery" },
  "crystal-mountains": { from: "#546E7A", to: "#90A4AE", label: "⛰️ Crystal Mountains" },
  "cloud-kingdom": { from: "#9B5DE5", to: "#CE93D8", label: "☁️ Cloud Kingdom" },
  "starlight-space": { from: "#1A2744", to: "#4A148C", label: "🌌 Starlight Space" },
};

export function HomePage() {
  const navigate = useNavigate();
  const { activeProfile, state, levelInfo, worldRebloom, dailyMissions, isMissionCompleted } = useApp();

  const sessions = activeProfile
    ? state.sessions.filter(s => s.profileId === activeProfile.id)
    : [];
  const totalActivities = sessions.length;
  const pointsToNext = levelInfo.nextLevelPoints - (activeProfile?.points ?? 0);
  const levelProgress = Math.min(100, ((activeProfile?.points ?? 0) / levelInfo.nextLevelPoints) * 100);

  // Current region based on unlocked locations
  const currentRegion = state.unlockedLocations[state.unlockedLocations.length - 1] ?? "sunny-meadow";
  const regionBg = REGION_BACKGROUNDS[currentRegion] ?? REGION_BACKGROUNDS["sunny-meadow"];

  const companion = activeProfile?.selectedCompanionId
    ? getCreatureById(activeProfile.selectedCompanionId)
    : null;

  // Featured activities (first 4)
  const featuredActivities = ACTIVITIES.slice(0, 4);
  const missionsRemaining = dailyMissions.filter(m => !isMissionCompleted(m.id)).length;

  return (
    <div className="pb-24 lg:pb-8 overflow-x-hidden">
      {/* Hero banner */}
      <div
        className="relative px-5 pt-6 pb-8"
        style={{ background: `linear-gradient(135deg, ${regionBg.from}, ${regionBg.to})` }}
      >
        {/* Decorative circles */}
        <div className="absolute top-0 right-0 w-40 h-40 rounded-full bg-white/10 -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-24 h-24 rounded-full bg-black/10 translate-y-1/2 -translate-x-1/2" />

        <div className="relative flex items-start justify-between">
          <div>
            <p className="text-white/80 text-sm">{GREETINGS},</p>
            <h1 className="font-display text-3xl text-white">{activeProfile?.nickname}! 👋</h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs bg-white/20 text-white px-2 py-0.5 rounded-full font-bold">
                Lv.{levelInfo.level} {levelInfo.title}
              </span>
              <span className="text-xs text-white/80">{regionBg.label}</span>
            </div>
          </div>
          <div className="text-right">
            <div className="bg-white/20 rounded-2xl px-3 py-2 text-center">
              <div className="text-xl">⚡</div>
              <div className="font-display text-xl text-white">{activeProfile?.points ?? 0}</div>
              <div className="text-xs text-white/70">Spark Pts</div>
            </div>
          </div>
        </div>

        {/* Level XP bar */}
        <div className="mt-4">
          <div className="flex justify-between text-xs text-white/80 mb-1">
            <span>Level Progress</span>
            <span>{pointsToNext > 0 ? `${pointsToNext} pts to next level` : "Max level!"}</span>
          </div>
          <div className="h-2.5 bg-white/20 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-white rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${levelProgress}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
            />
          </div>
        </div>

        {/* PIP + companion */}
        <div className="flex items-end justify-center gap-4 mt-4">
          <Pip expression="happy" size={80} />
          {companion && (
            <motion.div
              className="text-4xl mb-2"
              animate={{ y: [0, -4, 0] }}
              transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
            >
              {companion.emoji}
            </motion.div>
          )}
        </div>
      </div>

      <div className="px-5 py-4 space-y-5">
        {/* Daily Missions banner */}
        {missionsRemaining > 0 && (
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            onClick={() => navigate("/app/home-base")}
            className="w-full bg-gradient-to-r from-purple to-sky-blue rounded-3xl p-4 shadow-card flex items-center gap-3 active:scale-95 transition-transform"
          >
            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center text-2xl">📋</div>
            <div className="flex-1 text-left">
              <p className="font-display text-white text-base">{missionsRemaining} Daily Mission{missionsRemaining !== 1 ? "s" : ""}</p>
              <p className="text-white/80 text-xs">Complete for Spark Points!</p>
            </div>
            <div className="text-white text-xl">→</div>
          </motion.button>
        )}

        {/* World Rebloom mini */}
        <button
          onClick={() => navigate("/app/world")}
          className="w-full bg-white dark:bg-gray-800 rounded-3xl p-4 shadow-card flex items-center gap-3 active:scale-95 transition-transform"
        >
          <div className="flex-1">
            <div className="flex justify-between mb-1.5">
              <span className="text-sm font-bold text-adventure-navy dark:text-white">🌱 World Rebloom</span>
              <span className="text-sm font-bold text-mint">{worldRebloom}%</span>
            </div>
            <div className="h-2.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-mint to-forest rounded-full" style={{ width: `${worldRebloom}%` }} />
            </div>
          </div>
          <div className="text-gray-400 text-xl">→</div>
        </button>

        {/* Quick adventures */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display text-xl text-adventure-navy dark:text-white">Quick Adventures</h2>
            <button onClick={() => navigate("/app/explore")} className="text-sm text-sky-blue font-bold">See All →</button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {featuredActivities.map((activity, i) => (
              <motion.button
                key={activity.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate(`/app/activity/${activity.id}`)}
                className="rounded-3xl overflow-hidden shadow-card text-left"
                style={{ background: `linear-gradient(135deg, ${activity.color}, ${activity.color}99)` }}
              >
                <div className="p-4">
                  <div className="text-4xl mb-2">{activity.emoji}</div>
                  <p className="font-display text-white text-sm leading-tight">{activity.name}</p>
                  <p className="text-white/70 text-xs mt-1">{activity.durationMin} min</p>
                </div>
              </motion.button>
            ))}
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Adventures", value: totalActivities, emoji: "⚡", color: "#FF6B6B" },
            { label: "Creatures", value: state.ownedCreatures.filter(c => c.profileId === activeProfile?.id).length, emoji: "🐾", color: "#6BCB77" },
            { label: "Worlds", value: state.unlockedLocations.length, emoji: "🗺️", color: "#9B5DE5" },
          ].map(stat => (
            <div key={stat.label} className="bg-white dark:bg-gray-800 rounded-2xl p-3 shadow-card text-center">
              <div className="text-2xl mb-1">{stat.emoji}</div>
              <div className="font-display text-xl text-adventure-navy dark:text-white">{stat.value}</div>
              <div className="text-xs text-gray-400">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Go to world map CTA */}
        <button
          onClick={() => navigate("/app/world")}
          className="w-full rounded-3xl overflow-hidden shadow-card relative active:scale-95 transition-transform"
          style={{ background: "linear-gradient(135deg, #1A2744, #4A148C)" }}
        >
          <div className="p-5 flex items-center gap-4">
            <div className="text-5xl">🗺️</div>
            <div className="text-left">
              <p className="font-display text-xl text-white">Explore Wonderworld</p>
              <p className="text-white/70 text-sm">{6 - state.unlockedLocations.length} regions left to discover</p>
            </div>
            <div className="ml-auto text-white text-2xl">→</div>
          </div>
        </button>

        {/* Mini-games teaser */}
        <button
          onClick={() => navigate("/app/mini-games")}
          className="w-full bg-gradient-to-r from-purple/90 to-sky-blue/90 rounded-3xl p-4 shadow-card flex items-center gap-3 active:scale-95 transition-transform"
        >
          <div className="text-4xl">🎮</div>
          <div className="flex-1 text-left">
            <p className="font-display text-white text-base">Mini-Game Hub</p>
            <p className="text-white/70 text-xs">4 games ready to play!</p>
          </div>
          <div className="text-white text-xl">→</div>
        </button>
      </div>
    </div>
  );
}
