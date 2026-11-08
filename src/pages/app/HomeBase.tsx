import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useApp } from "../../contexts/AppContext";
import { getCreatureById } from "../../data/creatures";
import { Pip } from "../../components/mascot/Pip";

export function HomeBasePage() {
  const navigate = useNavigate();
  const { activeProfile, worldRebloom, levelInfo, dailyMissions, isMissionCompleted, completeMission } = useApp();
  const companion = activeProfile?.selectedCompanionId
    ? getCreatureById(activeProfile.selectedCompanionId)
    : null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-blue/20 to-mint/10 dark:from-adventure-navy dark:to-gray-950 pb-24 lg:pb-8">
      {/* Header */}
      <div className="px-5 pt-5 pb-3">
        <h1 className="font-display text-2xl text-adventure-navy dark:text-white">Home Base</h1>
        <p className="text-sm text-gray-500">Welcome home, {activeProfile?.nickname}!</p>
      </div>

      {/* Scene */}
      <div className="px-5 mb-4">
        <div className="rounded-3xl overflow-hidden shadow-card relative h-64"
          style={{ background: "linear-gradient(180deg, #87CEEB 0%, #87CEEB 40%, #A5D6A7 40%, #6BCB77 100%)" }}
        >
          {/* Sky elements */}
          <div className="absolute inset-0">
            {/* Sun */}
            <div className="absolute top-4 right-6 w-12 h-12 rounded-full bg-sunny-yellow shadow-glow-yellow" />

            {/* Clouds */}
            {[{ l: "15%", t: "12%" }, { l: "55%", t: "18%" }].map((pos, i) => (
              <div key={i} className="absolute" style={{ left: pos.l, top: pos.t }}>
                <div className="bg-white rounded-full w-10 h-6 opacity-80" />
                <div className="bg-white rounded-full w-7 h-5 opacity-80 -mt-3 ml-3" />
              </div>
            ))}
          </div>

          {/* Ground */}
          <div className="absolute bottom-0 left-0 right-0 h-32 rounded-b-3xl"
            style={{ background: "linear-gradient(0deg, #2D6A4F, #6BCB77)" }}
          >
            {/* House */}
            <div className="absolute bottom-6 left-4">
              {/* Body */}
              <div className="w-24 h-16 bg-cream border-2 border-yellow-200 rounded-t-sm relative">
                {/* Door */}
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-6 h-9 bg-gold rounded-t-full border-2 border-yellow-600" />
                {/* Window L */}
                <div className="absolute top-2 left-2 w-5 h-5 bg-sky-blue rounded border-2 border-blue-300" />
                {/* Window R */}
                <div className="absolute top-2 right-2 w-5 h-5 bg-sky-blue rounded border-2 border-blue-300" />
              </div>
              {/* Roof */}
              <div className="w-0 h-0 -mt-0.5"
                style={{
                  borderLeft: "52px solid transparent",
                  borderRight: "52px solid transparent",
                  borderBottom: "36px solid #FF6B6B",
                }}
              />
              {/* Chimney */}
              <div className="absolute -top-10 right-6 w-5 h-8 bg-gray-400 rounded" />
            </div>

            {/* Trees */}
            {[{ r: "15%", h: 48 }, { r: "30%", h: 40 }].map((t, i) => (
              <div key={i} className="absolute bottom-4" style={{ right: t.r }}>
                <div className="w-0 h-0"
                  style={{
                    borderLeft: `${t.h * 0.4}px solid transparent`,
                    borderRight: `${t.h * 0.4}px solid transparent`,
                    borderBottom: `${t.h}px solid #2D6A4F`,
                    marginLeft: `-${t.h * 0.4 - 4}px`,
                  }}
                />
                <div className="w-2 h-4 bg-amber-800 mx-auto" />
              </div>
            ))}

            {/* Flowers */}
            {["🌸", "🌼", "🌺"].map((f, i) => (
              <div key={i} className="absolute bottom-3 text-sm" style={{ left: `${35 + i * 12}%` }}>{f}</div>
            ))}
          </div>

          {/* PIP */}
          <div className="absolute bottom-10 left-1/2 -translate-x-1/2">
            <Pip expression="happy" size={56} />
          </div>

          {/* Companion */}
          {companion && (
            <motion.div
              className="absolute bottom-10 right-16 text-3xl"
              animate={{ y: [0, -4, 0] }}
              transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
            >
              {companion.emoji}
            </motion.div>
          )}

          {/* Profile name badge */}
          <div className="absolute top-3 left-3 bg-white/80 dark:bg-gray-800/80 rounded-xl px-2.5 py-1.5 shadow-sm">
            <p className="font-bold text-adventure-navy text-xs">{activeProfile?.nickname}'s Base</p>
            <p className="text-xs text-purple font-bold">{levelInfo.title}</p>
          </div>
        </div>
      </div>

      {/* World Rebloom */}
      <div className="px-5 mb-4">
        <div className="bg-white dark:bg-gray-800 rounded-3xl p-4 shadow-card">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 className="font-display text-base text-adventure-navy dark:text-white">🌱 World Rebloom</h3>
              <p className="text-xs text-gray-500">Your adventures are restoring Wonderworld!</p>
            </div>
            <span className="font-display text-2xl text-mint">{worldRebloom}%</span>
          </div>
          <div className="h-3 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-mint to-forest rounded-full"
              animate={{ width: `${worldRebloom}%` }}
              transition={{ duration: 1 }}
            />
          </div>
          {worldRebloom < 100 && (
            <p className="text-xs text-gray-400 mt-1.5">Complete more adventures to restore the world!</p>
          )}
        </div>
      </div>

      {/* Daily Missions */}
      <div className="px-5 mb-4">
        <h3 className="font-display text-lg text-adventure-navy dark:text-white mb-3">Today's Missions</h3>
        <div className="space-y-2">
          {dailyMissions.map(mission => {
            const done = isMissionCompleted(mission.id);
            return (
              <div
                key={mission.id}
                className={`bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-card flex items-center gap-3 ${done ? "opacity-60" : ""}`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl ${done ? "bg-mint/20" : "bg-purple/10"}`}>
                  {done ? "✅" : mission.icon}
                </div>
                <div className="flex-1">
                  <p className={`font-bold text-sm ${done ? "line-through text-gray-400" : "text-adventure-navy dark:text-white"}`}>
                    {mission.description}
                  </p>
                  <p className="text-xs text-sunny-yellow font-bold">+{mission.sparkReward} ⚡</p>
                </div>
                {!done && (
                  <button
                    onClick={() => completeMission(mission.id)}
                    className="bg-purple text-white text-xs font-bold px-3 py-1.5 rounded-xl active:scale-95 transition-transform"
                  >
                    Done!
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Quick actions */}
      <div className="px-5 grid grid-cols-2 gap-3">
        <button
          onClick={() => navigate("/app/explore")}
          className="bg-gradient-to-br from-coral to-coral/60 rounded-2xl p-4 text-white shadow-card active:scale-95 transition-transform text-left"
        >
          <div className="text-2xl mb-1">🗺️</div>
          <p className="font-display text-base">Find Adventures</p>
          <p className="text-xs text-white/70">Explore activities</p>
        </button>
        <button
          onClick={() => navigate("/app/creatures")}
          className="bg-gradient-to-br from-mint to-forest rounded-2xl p-4 text-white shadow-card active:scale-95 transition-transform text-left"
        >
          <div className="text-2xl mb-1">🐾</div>
          <p className="font-display text-base">My Creatures</p>
          <p className="text-xs text-white/70">View collection</p>
        </button>
      </div>
    </div>
  );
}
