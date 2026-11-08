import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useApp } from "../../contexts/AppContext";

interface Region {
  id: string;
  name: string;
  emoji: string;
  activitiesRequired: number;
  description: string;
  path: string;
  cx: number;
  cy: number;
  color: string;
  bgFrom: string;
  bgTo: string;
  terrainColor: string;
  landmarks: { x: number; y: number; emoji: string; size: number }[];
}

const REGIONS: Region[] = [
  {
    id: "sunny-meadow",
    name: "Sunny Meadow",
    emoji: "🌻",
    activitiesRequired: 0,
    description: "Rolling hills and colorful flowers. Your adventure begins here!",
    path: "/app/adventures",
    cx: 160, cy: 310,
    color: "#6BCB77",
    bgFrom: "#A5D6A7", bgTo: "#6BCB77",
    terrainColor: "#52B788",
    landmarks: [
      { x: 120, y: 280, emoji: "🏡", size: 18 },
      { x: 185, y: 295, emoji: "🌻", size: 14 },
      { x: 145, y: 330, emoji: "🌼", size: 12 },
      { x: 175, y: 325, emoji: "🦋", size: 12 },
    ],
  },
  {
    id: "whispering-forest",
    name: "Whispering Forest",
    emoji: "🌲",
    activitiesRequired: 3,
    description: "Ancient trees with glowing mushrooms and hidden paths.",
    path: "/app/adventures",
    cx: 280, cy: 220,
    color: "#2D6A4F",
    bgFrom: "#1B4332", bgTo: "#52B788",
    terrainColor: "#2D6A4F",
    landmarks: [
      { x: 255, y: 190, emoji: "🌲", size: 20 },
      { x: 295, y: 200, emoji: "🍄", size: 14 },
      { x: 270, y: 240, emoji: "🌿", size: 12 },
      { x: 300, y: 235, emoji: "🦔", size: 12 },
    ],
  },
  {
    id: "ocean-discovery",
    name: "Ocean Discovery",
    emoji: "🌊",
    activitiesRequired: 6,
    description: "Sandy beaches, coral reefs, and a lighthouse on the horizon.",
    path: "/app/adventures",
    cx: 100, cy: 190,
    color: "#0288D1",
    bgFrom: "#0277BD", bgTo: "#4FC3F7",
    terrainColor: "#01579B",
    landmarks: [
      { x: 70, y: 165, emoji: "🏖️", size: 16 },
      { x: 120, y: 170, emoji: "🏝️", size: 18 },
      { x: 85, y: 205, emoji: "🦀", size: 12 },
      { x: 115, y: 205, emoji: "🐠", size: 12 },
    ],
  },
  {
    id: "crystal-mountains",
    name: "Crystal Mountains",
    emoji: "⛰️",
    activitiesRequired: 10,
    description: "Towering peaks with crystal caves and icy mountain lakes.",
    path: "/app/adventures",
    cx: 240, cy: 120,
    color: "#546E7A",
    bgFrom: "#37474F", bgTo: "#90A4AE",
    terrainColor: "#455A64",
    landmarks: [
      { x: 215, y: 95, emoji: "🏔️", size: 20 },
      { x: 255, y: 100, emoji: "❄️", size: 14 },
      { x: 230, y: 135, emoji: "💎", size: 12 },
      { x: 260, y: 130, emoji: "🦅", size: 12 },
    ],
  },
  {
    id: "cloud-kingdom",
    name: "Cloud Kingdom",
    emoji: "☁️",
    activitiesRequired: 15,
    description: "Floating islands connected by rainbow bridges high in the sky.",
    path: "/app/adventures",
    cx: 320, cy: 100,
    color: "#9B5DE5",
    bgFrom: "#6A1B9A", bgTo: "#CE93D8",
    terrainColor: "#7B1FA2",
    landmarks: [
      { x: 295, y: 75, emoji: "🌈", size: 16 },
      { x: 340, y: 80, emoji: "🏰", size: 18 },
      { x: 310, y: 115, emoji: "🎈", size: 14 },
      { x: 340, y: 110, emoji: "☁️", size: 14 },
    ],
  },
  {
    id: "starlight-space",
    name: "Starlight Space",
    emoji: "🌌",
    activitiesRequired: 20,
    description: "Beyond the clouds lies a cosmic wonder of planets and stardust.",
    path: "/app/adventures",
    cx: 160, cy: 80,
    color: "#1A2744",
    bgFrom: "#0D1B2A", bgTo: "#4A148C",
    terrainColor: "#1A237E",
    landmarks: [
      { x: 130, y: 55, emoji: "🪐", size: 18 },
      { x: 175, y: 60, emoji: "⭐", size: 14 },
      { x: 145, y: 95, emoji: "🚀", size: 14 },
      { x: 180, y: 90, emoji: "🌠", size: 12 },
    ],
  },
];

const CONNECTIONS = [
  { from: 0, to: 1 }, { from: 0, to: 2 }, { from: 1, to: 3 },
  { from: 2, to: 3 }, { from: 3, to: 4 }, { from: 4, to: 5 }, { from: 5, to: 0 },
];

export function WorldMapPage() {
  const navigate = useNavigate();
  const { state, activeProfile, levelInfo, worldRebloom } = useApp();
  const [selected, setSelected] = useState<Region | null>(null);
  const totalActivities = activeProfile
    ? state.sessions.filter(s => s.profileId === activeProfile.id).length
    : 0;

  function isUnlocked(region: Region) {
    return totalActivities >= region.activitiesRequired;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-blue/20 to-adventure-navy/10 dark:from-adventure-navy dark:to-gray-950 pb-24 lg:pb-8">
      {/* Header HUD */}
      <div className="px-4 pt-5 pb-3">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="font-display text-2xl text-adventure-navy dark:text-white">Wonderworld</h1>
            <p className="text-xs text-gray-500">Explore & restore the magic</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="bg-white dark:bg-gray-800 rounded-2xl px-3 py-1.5 shadow-card flex items-center gap-1.5">
              <span className="text-sm">⚡</span>
              <span className="font-bold text-adventure-navy dark:text-white text-sm">{activeProfile?.points ?? 0}</span>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-2xl px-3 py-1.5 shadow-card">
              <span className="font-bold text-purple text-sm">Lv.{levelInfo.level}</span>
            </div>
          </div>
        </div>

        {/* World Rebloom Bar */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-3 shadow-card">
          <div className="flex justify-between items-center mb-1.5">
            <span className="text-xs font-bold text-adventure-navy dark:text-white">🌱 World Rebloom</span>
            <span className="text-xs text-mint font-bold">{worldRebloom}%</span>
          </div>
          <div className="h-2.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-mint to-forest"
              initial={{ width: 0 }}
              animate={{ width: `${worldRebloom}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
            />
          </div>
          <p className="text-xs text-gray-400 mt-1">Complete adventures to restore Wonderworld!</p>
        </div>
      </div>

      {/* SVG World Map */}
      <div className="px-2 overflow-x-auto">
        <div className="relative">
          <svg
            viewBox="0 0 420 400"
            className="w-full max-w-lg mx-auto"
            style={{ minHeight: 320 }}
          >
            {/* Sky background */}
            <defs>
              <radialGradient id="skyGrad" cx="50%" cy="30%" r="70%">
                <stop offset="0%" stopColor="#B3E5FC" />
                <stop offset="100%" stopColor="#4FC3F7" />
              </radialGradient>
              <radialGradient id="spaceGrad" cx="50%" cy="10%" r="50%">
                <stop offset="0%" stopColor="#1A237E" />
                <stop offset="100%" stopColor="#0D1B2A" />
              </radialGradient>
            </defs>

            {/* Background gradient */}
            <rect x="0" y="0" width="420" height="180" fill="url(#spaceGrad)" rx="20" />
            <rect x="0" y="150" width="420" height="250" fill="url(#skyGrad)" />

            {/* Stars in space area */}
            {[
              [30,20],[80,40],[130,15],[200,30],[260,10],[320,25],[380,40],
              [50,60],[170,50],[350,55],[400,20],[10,80],[290,70],
            ].map(([x, y], i) => (
              <circle
                key={i}
                cx={x} cy={y} r={1.5}
                fill="white"
                style={{ animation: `twinkle ${1.5 + (i % 3) * 0.7}s ease-in-out ${i * 0.2}s infinite` }}
                opacity={0.8}
              />
            ))}

            {/* Clouds drifting */}
            {[
              { x: 60, y: 155, r: 18, speed: "8s" },
              { x: 300, y: 165, r: 14, speed: "11s" },
              { x: 180, y: 148, r: 12, speed: "9s" },
            ].map((c, i) => (
              <ellipse
                key={i} cx={c.x} cy={c.y} rx={c.r} ry={c.r * 0.6}
                fill="white" opacity={0.5}
                style={{ animation: `drift ${c.speed} ease-in-out ${i * 2}s infinite` }}
              />
            ))}

            {/* Ocean water */}
            <ellipse cx="100" cy="200" rx="70" ry="45" fill="#0288D1" opacity={0.4} />
            <ellipse cx="85" cy="195" rx="55" ry="35" fill="#4FC3F7" opacity={0.3} />

            {/* Ground terrain */}
            <ellipse cx="210" cy="310" rx="200" ry="80" fill="#A5D6A7" opacity={0.5} />
            <ellipse cx="150" cy="320" rx="130" ry="55" fill="#6BCB77" opacity={0.4} />

            {/* Connection paths */}
            {CONNECTIONS.map(({ from, to }, i) => {
              const r1 = REGIONS[from];
              const r2 = REGIONS[to];
              const unlocked1 = isUnlocked(r1);
              const unlocked2 = isUnlocked(r2);
              return (
                <line
                  key={i}
                  x1={r1.cx} y1={r1.cy}
                  x2={r2.cx} y2={r2.cy}
                  stroke={unlocked1 && unlocked2 ? "#FFD93D" : "#9CA3AF"}
                  strokeWidth={unlocked1 && unlocked2 ? 2.5 : 1.5}
                  strokeDasharray={unlocked1 && unlocked2 ? "none" : "5,4"}
                  opacity={unlocked1 && unlocked2 ? 0.8 : 0.3}
                />
              );
            })}

            {/* Region bubbles */}
            {REGIONS.map((region) => {
              const unlocked = isUnlocked(region);
              return (
                <g key={region.id} onClick={() => setSelected(unlocked ? region : null)} style={{ cursor: unlocked ? "pointer" : "default" }}>
                  {/* Glow ring for unlocked + current */}
                  {unlocked && (
                    <circle
                      cx={region.cx} cy={region.cy} r={34}
                      fill={region.color} opacity={0.2}
                      style={{ animation: "pulseGlow 3s ease-in-out infinite" }}
                    />
                  )}

                  {/* Main bubble */}
                  <circle
                    cx={region.cx} cy={region.cy} r={28}
                    fill={unlocked ? region.color : "#9CA3AF"}
                    opacity={unlocked ? 1 : 0.4}
                    stroke="white"
                    strokeWidth={2}
                  />

                  {/* Inner circle for depth */}
                  <circle
                    cx={region.cx - 6} cy={region.cy - 6} r={8}
                    fill="white" opacity={unlocked ? 0.25 : 0.1}
                  />

                  {/* Emoji */}
                  <text
                    x={region.cx} y={region.cy + 5}
                    textAnchor="middle"
                    fontSize={unlocked ? 18 : 14}
                    opacity={unlocked ? 1 : 0.5}
                  >
                    {unlocked ? region.emoji : "🔒"}
                  </text>

                  {/* Landmarks */}
                  {unlocked && region.landmarks.map((lm, li) => (
                    <text key={li} x={lm.x} y={lm.y} fontSize={lm.size} textAnchor="middle"
                      style={{ animation: li === 3 ? "bounce-soft 2s ease-in-out infinite" : "none" }}
                    >
                      {lm.emoji}
                    </text>
                  ))}

                  {/* Name label */}
                  <text
                    x={region.cx} y={region.cy + 42}
                    textAnchor="middle"
                    fontSize={9}
                    fontWeight="bold"
                    fill={unlocked ? "#1A2744" : "#9CA3AF"}
                    className="dark:fill-white"
                  >
                    {region.name}
                  </text>

                  {/* Lock requirement */}
                  {!unlocked && (
                    <text
                      x={region.cx} y={region.cy + 54}
                      textAnchor="middle"
                      fontSize={7}
                      fill="#9CA3AF"
                    >
                      {region.activitiesRequired} adventures
                    </text>
                  )}
                </g>
              );
            })}

            {/* PIP marker on current region */}
            {(() => {
              const currentRegion = REGIONS.filter(r => isUnlocked(r)).at(-1) ?? REGIONS[0];
              return (
                <g style={{ animation: "float 2.5s ease-in-out infinite" }}>
                  <circle cx={currentRegion.cx} cy={currentRegion.cy - 40} r={12} fill="#FF8C42" />
                  <text x={currentRegion.cx} y={currentRegion.cy - 36} textAnchor="middle" fontSize={12}>🦊</text>
                  <polygon
                    points={`${currentRegion.cx - 5},${currentRegion.cy - 30} ${currentRegion.cx + 5},${currentRegion.cy - 30} ${currentRegion.cx},${currentRegion.cy - 22}`}
                    fill="#FF8C42"
                  />
                </g>
              );
            })()}
          </svg>
        </div>
      </div>

      {/* Region detail card (animated) */}
      <AnimatePresence>
        {selected && (
          <motion.div
            key={selected.id}
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed bottom-20 lg:bottom-4 left-0 right-0 mx-4 bg-white dark:bg-gray-800 rounded-3xl shadow-card-hover p-5 z-20"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl"
                  style={{ background: `linear-gradient(135deg, ${selected.bgFrom}, ${selected.bgTo})` }}
                >
                  {selected.emoji}
                </div>
                <div>
                  <h3 className="font-display text-xl text-adventure-navy dark:text-white">{selected.name}</h3>
                  <p className="text-xs text-gray-500">{selected.description}</p>
                </div>
              </div>
              <button onClick={() => setSelected(null)} className="text-gray-400 text-xl">×</button>
            </div>
            <button
              onClick={() => { setSelected(null); navigate(selected.path); }}
              className="w-full py-3 rounded-2xl font-display text-lg text-white shadow-card active:scale-95 transition-transform"
              style={{ background: `linear-gradient(135deg, ${selected.bgFrom}, ${selected.bgTo})` }}
            >
              Explore {selected.name} →
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tap hint */}
      {!selected && (
        <p className="text-center text-xs text-gray-400 mt-2">Tap a region to explore</p>
      )}
    </div>
  );
}
