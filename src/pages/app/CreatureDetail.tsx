import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useApp } from "../../contexts/AppContext";
import { getCreatureById } from "../../data/creatures";

const RARITY_STYLES = {
  common: { label: "Common", color: "#9CA3AF", bg: "from-gray-100 to-gray-200" },
  uncommon: { label: "Uncommon", color: "#6BCB77", bg: "from-green-100 to-green-200" },
  rare: { label: "Rare", color: "#4FC3F7", bg: "from-sky-100 to-sky-200" },
  legendary: { label: "Legendary", color: "#FFD93D", bg: "from-yellow-100 to-yellow-200" },
};

const REGION_NAMES: Record<string, string> = {
  "sunny-meadow": "🌻 Sunny Meadow",
  "whispering-forest": "🌲 Whispering Forest",
  "ocean-discovery": "🌊 Ocean Discovery",
  "crystal-mountains": "⛰️ Crystal Mountains",
  "cloud-kingdom": "☁️ Cloud Kingdom",
  "starlight-space": "🌌 Starlight Space",
};

export function CreatureDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { activeProfile, setCompanion } = useApp();
  const creature = id ? getCreatureById(id) : undefined;

  if (!creature) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <p className="text-gray-500">Creature not found</p>
        <button onClick={() => navigate("/app/creatures")} className="mt-4 text-sky-blue font-bold">← Back</button>
      </div>
    );
  }

  const rs = RARITY_STYLES[creature.rarity];
  const isCompanion = activeProfile?.selectedCompanionId === creature.id;

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-blue/10 to-purple/5 dark:from-adventure-navy dark:to-gray-950 pb-24 lg:pb-8">
      {/* Back button */}
      <div className="flex items-center px-5 pt-5">
        <button onClick={() => navigate("/app/creatures")} className="text-gray-400 text-2xl mr-3">‹</button>
        <h1 className="font-display text-xl text-adventure-navy dark:text-white">{creature.name}</h1>
      </div>

      {/* Hero card */}
      <div className="px-5 mt-4">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className={`rounded-3xl p-8 bg-gradient-to-br ${rs.bg} shadow-card text-center`}
          style={{ border: `3px solid ${rs.color}`, boxShadow: `0 0 20px ${rs.color}40` }}
        >
          <motion.div
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
            className="text-8xl mb-4"
          >
            {creature.emoji}
          </motion.div>
          <h2 className="font-display text-3xl text-adventure-navy mb-1">{creature.name}</h2>
          <span
            className="text-sm font-bold px-3 py-1 rounded-full text-white"
            style={{ backgroundColor: rs.color }}
          >
            {rs.label}
          </span>
          <p className="text-gray-600 mt-3 text-sm italic">"{creature.idleMessage}"</p>
        </motion.div>
      </div>

      {/* Info cards */}
      <div className="px-5 mt-4 space-y-3">
        <div className="bg-white dark:bg-gray-800 rounded-3xl p-4 shadow-card">
          <h3 className="font-bold text-adventure-navy dark:text-white mb-2">About {creature.name}</h3>
          <p className="text-sm text-gray-600 dark:text-gray-300">{creature.description}</p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-card">
            <div className="text-2xl mb-1">🏡</div>
            <p className="text-xs text-gray-400 font-bold">Region</p>
            <p className="text-sm font-bold text-adventure-navy dark:text-white">{REGION_NAMES[creature.region] ?? creature.region}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-card">
            <div className="text-2xl mb-1">✨</div>
            <p className="text-xs text-gray-400 font-bold">Personality</p>
            <p className="text-sm font-bold text-adventure-navy dark:text-white">{creature.personality}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-card">
          <div className="text-2xl mb-1">🔍</div>
          <p className="text-xs text-gray-400 font-bold">How to Discover</p>
          <p className="text-sm text-adventure-navy dark:text-white">{creature.unlockCondition}</p>
        </div>

        {/* Companion button */}
        <button
          onClick={() => setCompanion(creature.id)}
          className={`w-full py-4 rounded-3xl font-display text-xl shadow-card active:scale-95 transition-transform ${
            isCompanion
              ? "bg-sunny-yellow text-adventure-navy"
              : "bg-gradient-to-r from-purple to-sky-blue text-white"
          }`}
        >
          {isCompanion ? "✓ Current Companion!" : "Set as Companion 🤝"}
        </button>
      </div>
    </div>
  );
}
