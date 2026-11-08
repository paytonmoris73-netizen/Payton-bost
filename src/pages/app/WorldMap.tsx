import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useApp } from "../../contexts/AppContext";

const REGIONS = [
  {
    id: "sunny-meadow",
    name: "Suntrail Meadow",
    description: "A bright, welcoming world of rolling hills and hidden wonders. Where every adventure begins!",
    emoji: "🌻",
    color: "#22C55E",
    glow: "rgba(34,197,94,0.4)",
    requiredActivities: 0,
    cx: 110, cy: 190, rx: 65, ry: 45,
    pathTo: "/app/adventures",
  },
  {
    id: "crystal-creek",
    name: "Crystal Creek",
    description: "A beautiful water-themed location with glowing waterfalls and hidden crystal paths.",
    emoji: "💎",
    color: "#3B82F6",
    glow: "rgba(59,130,246,0.4)",
    requiredActivities: 3,
    cx: 250, cy: 160, rx: 55, ry: 40,
    pathTo: "/app/adventures",
  },
  {
    id: "emberwood-forest",
    name: "Emberwood Forest",
    description: "A mysterious forest with warm glowing light, unique creatures, and hidden companion habitats.",
    emoji: "🌲",
    color: "#F97316",
    glow: "rgba(249,115,22,0.4)",
    requiredActivities: 6,
    cx: 90, cy: 100, rx: 55, ry: 38,
    pathTo: "/app/adventures",
  },
  {
    id: "cloudpeak-mountains",
    name: "Cloudpeak Mountains",
    description: "Mountain paths, snowy peaks, and balance-themed exploration high above the clouds.",
    emoji: "🏔️",
    color: "#8B5CF6",
    glow: "rgba(139,92,246,0.4)",
    requiredActivities: 10,
    cx: 270, cy: 90, rx: 55, ry: 38,
    pathTo: "/app/adventures",
  },
  {
    id: "starfall-valley",
    name: "Starfall Valley",
    description: "A spectacular nighttime environment with rare discoveries and special star-powered achievements.",
    emoji: "🌟",
    color: "#EC4899",
    glow: "rgba(236,72,153,0.4)",
    requiredActivities: 15,
    cx: 180, cy: 55, rx: 52, ry: 36,
    pathTo: "/app/adventures",
  },
  {
    id: "lost-garden",
    name: "The Lost Garden",
    description: "A legendary hidden sanctuary with rare collectibles and the greatest restoration projects.",
    emoji: "🌸",
    color: "#FFD93D",
    glow: "rgba(255,217,61,0.5)",
    requiredActivities: 20,
    cx: 185, cy: 230, rx: 52, ry: 35,
    pathTo: "/app/adventures",
  },
];

export function WorldMapPage() {
  const navigate = useNavigate();
  const { profileSessions, activeProfile, worldRebloom } = useApp();
  const [selected, setSelected] = useState<string | null>(null);

  if (!activeProfile) return null;
  const sessions = profileSessions(activeProfile.id);
  const totalActivities = sessions.length;

  const selectedRegion = REGIONS.find(r => r.id === selected);

  return (
    <motion.div
      className="pb-24 lg:pb-8 min-h-screen bg-pp-navy relative overflow-hidden"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }}
    >
      {/* Space background */}
      <div className="absolute inset-0 stars-bg pointer-events-none" />
      {[...Array(30)].map((_, i) => (
        <div
          key={i}
          className="absolute rounded-full bg-white animate-twinkle"
          style={{
            width: Math.random() * 2 + 1,
            height: Math.random() * 2 + 1,
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 3}s`,
            opacity: Math.random() * 0.6 + 0.2,
          }}
        />
      ))}

      {/* Header */}
      <div className="relative z-10 px-5 pt-6 pb-2">
        <div className="flex items-center justify-between mb-1">
          <div>
            <h1 className="font-display text-pp-gold text-2xl tracking-widest">WONDERWORLD</h1>
            <p className="text-pp-muted text-xs">Tap a region to explore</p>
          </div>
          <div className="text-right">
            <div className="text-pp-muted text-xs mb-1">World Rebloom</div>
            <div className="w-28 h-2 bg-pp-border rounded-full overflow-hidden">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-pp-green to-pp-teal"
                initial={{ width: 0 }}
                animate={{ width: `${worldRebloom}%` }}
                transition={{ duration: 1 }}
              />
            </div>
            <div className="text-pp-green text-xs font-bold mt-0.5">{worldRebloom}% restored</div>
          </div>
        </div>
      </div>

      {/* SVG Map */}
      <div className="relative z-10 px-3">
        <svg
          viewBox="0 0 360 290"
          className="w-full"
          style={{ maxHeight: "55vh" }}
        >
          {/* Connecting paths between regions */}
          <g opacity="0.3">
            <line x1="110" y1="168" x2="195" y2="142" stroke="#8B8FA8" strokeWidth="2" strokeDasharray="6 4" />
            <line x1="175" y1="168" x2="220" y2="130" stroke="#8B8FA8" strokeWidth="2" strokeDasharray="6 4" />
            <line x1="110" y1="155" x2="90" y2="128" stroke="#8B8FA8" strokeWidth="2" strokeDasharray="6 4" />
            <line x1="90" y1="80" x2="168" y2="68" stroke="#8B8FA8" strokeWidth="2" strokeDasharray="6 4" />
            <line x1="232" y1="68" x2="270" y2="80" stroke="#8B8FA8" strokeWidth="2" strokeDasharray="6 4" />
            <line x1="140" y1="195" x2="162" y2="210" stroke="#8B8FA8" strokeWidth="2" strokeDasharray="6 4" />
          </g>

          {REGIONS.map(region => {
            const unlocked = totalActivities >= region.requiredActivities;
            const isSelected = selected === region.id;

            return (
              <g key={region.id} onClick={() => setSelected(isSelected ? null : region.id)} style={{ cursor: "pointer" }}>
                {/* Glow ring for unlocked */}
                {unlocked && (
                  <ellipse
                    cx={region.cx} cy={region.cy}
                    rx={region.rx + 8} ry={region.ry + 6}
                    fill="none"
                    stroke={region.color}
                    strokeWidth="2"
                    opacity={isSelected ? 0.8 : 0.3}
                    className={unlocked ? "animate-pulse-glow" : ""}
                  />
                )}

                {/* Island body */}
                <ellipse
                  cx={region.cx} cy={region.cy}
                  rx={region.rx} ry={region.ry}
                  fill={unlocked ? region.color + "33" : "rgba(30,27,60,0.8)"}
                  stroke={unlocked ? region.color : "#2E2B55"}
                  strokeWidth={isSelected ? 3 : 1.5}
                />

                {/* Fog overlay for locked */}
                {!unlocked && (
                  <ellipse
                    cx={region.cx} cy={region.cy}
                    rx={region.rx} ry={region.ry}
                    fill="rgba(10,8,30,0.6)"
                  />
                )}

                {/* Emoji label */}
                <text
                  x={region.cx} y={region.cy - 4}
                  textAnchor="middle"
                  fontSize="22"
                  opacity={unlocked ? 1 : 0.4}
                >
                  {unlocked ? region.emoji : "🔒"}
                </text>

                {/* Region name */}
                <text
                  x={region.cx} y={region.cy + 16}
                  textAnchor="middle"
                  fontSize="8"
                  fontWeight="bold"
                  fill={unlocked ? "white" : "#8B8FA8"}
                  opacity={unlocked ? 0.9 : 0.5}
                >
                  {region.name}
                </text>

                {/* Locked: show required activities */}
                {!unlocked && (
                  <text
                    x={region.cx} y={region.cy + 26}
                    textAnchor="middle"
                    fontSize="7"
                    fill="#8B8FA8"
                    opacity="0.7"
                  >
                    {region.requiredActivities - totalActivities} more activities
                  </text>
                )}
              </g>
            );
          })}

          {/* PIP location marker on first unlocked uncompleted region */}
          <motion.g
            animate={{ y: [0, -4, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <circle cx="110" cy="174" r="8" fill="#FF6B35" />
            <text x="110" y="177" textAnchor="middle" fontSize="8">🦊</text>
          </motion.g>
        </svg>
      </div>

      {/* Bottom sheet for selected region */}
      <AnimatePresence>
        {selectedRegion && (
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed bottom-16 lg:bottom-0 left-0 right-0 z-50 bg-pp-surface border-t border-pp-border rounded-t-3xl px-5 pt-5 pb-8 lg:mx-auto lg:max-w-lg"
          >
            <div className="w-10 h-1 bg-pp-border rounded-full mx-auto mb-4" />
            <div className="flex items-start gap-4">
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl flex-shrink-0"
                style={{ backgroundColor: selectedRegion.color + "22", border: `2px solid ${selectedRegion.color}44` }}
              >
                {totalActivities >= selectedRegion.requiredActivities ? selectedRegion.emoji : "🔒"}
              </div>
              <div className="flex-1">
                <h2 className="font-display text-pp-cream text-xl">{selectedRegion.name}</h2>
                <p className="text-pp-muted text-sm mt-1">{selectedRegion.description}</p>
                {totalActivities < selectedRegion.requiredActivities && (
                  <div className="mt-2 inline-flex items-center gap-1.5 bg-pp-card border border-pp-border rounded-full px-3 py-1">
                    <span className="text-pp-muted text-xs">🔒 Requires {selectedRegion.requiredActivities} activities ({totalActivities}/{selectedRegion.requiredActivities})</span>
                  </div>
                )}
              </div>
            </div>
            <button
              onClick={() => {
                setSelected(null);
                navigate(selectedRegion.pathTo);
              }}
              disabled={totalActivities < selectedRegion.requiredActivities}
              className="mt-5 w-full py-3.5 rounded-2xl font-black text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              style={
                totalActivities >= selectedRegion.requiredActivities
                  ? { background: `linear-gradient(135deg, ${selectedRegion.color}, ${selectedRegion.color}BB)`, color: "white" }
                  : { background: "#2E2B55", color: "#8B8FA8" }
              }
            >
              {totalActivities >= selectedRegion.requiredActivities ? `Explore ${selectedRegion.name} →` : "Complete more activities to unlock"}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tap to dismiss */}
      {selected && (
        <div className="fixed inset-0 z-40" onClick={() => setSelected(null)} />
      )}
    </motion.div>
  );
}
