import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useApp } from "../../contexts/AppContext";
import { CREATURES } from "../../data/creatures";

const RARITY_COLORS = {
  common: { border: "#9CA3AF", bg: "#F3F4F6", label: "Common" },
  uncommon: { border: "#6BCB77", bg: "#F0FFF4", label: "Uncommon" },
  rare: { border: "#4FC3F7", bg: "#E0F7FA", label: "Rare" },
  legendary: { border: "#FFD93D", bg: "#FFFDE7", label: "Legendary" },
};

export function CreatureCollectionPage() {
  const navigate = useNavigate();
  const { activeProfile, profileCreatures, setCompanion } = useApp();
  const owned = activeProfile ? profileCreatures(activeProfile.id).map(c => c.creatureId) : [];
  const totalOwned = owned.length;

  return (
    <div className="min-h-screen bg-gradient-to-b from-mint/10 to-forest/5 dark:from-adventure-navy dark:to-gray-950 pb-24 lg:pb-8">
      {/* Header */}
      <div className="px-5 pt-5 pb-3">
        <h1 className="font-display text-2xl text-adventure-navy dark:text-white">Creature Collection</h1>
        <p className="text-sm text-gray-500">{totalOwned}/{CREATURES.length} creatures discovered</p>
      </div>

      {/* Progress */}
      <div className="px-5 mb-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-card">
          <div className="flex justify-between mb-2">
            <span className="text-sm font-bold text-adventure-navy dark:text-white">Discovery Progress</span>
            <span className="text-sm font-bold text-mint">{Math.round((totalOwned / CREATURES.length) * 100)}%</span>
          </div>
          <div className="h-2.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-mint to-forest rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${(totalOwned / CREATURES.length) * 100}%` }}
              transition={{ duration: 1 }}
            />
          </div>
          <div className="flex gap-3 mt-3 text-xs text-gray-500">
            {(["common", "uncommon", "rare", "legendary"] as const).map(r => {
              const count = CREATURES.filter(c => c.rarity === r).length;
              const ownedCount = CREATURES.filter(c => c.rarity === r && owned.includes(c.id)).length;
              const rc = RARITY_COLORS[r];
              return (
                <div key={r} className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: rc.border }} />
                  <span>{ownedCount}/{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="px-5">
        <div className="grid grid-cols-3 gap-3">
          {CREATURES.map((creature, i) => {
            const isOwned = owned.includes(creature.id);
            const rc = RARITY_COLORS[creature.rarity];
            const isCompanion = activeProfile?.selectedCompanionId === creature.id;

            return (
              <motion.button
                key={creature.id}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.03 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => isOwned && navigate(`/app/creatures/${creature.id}`)}
                className={`rounded-3xl p-3 flex flex-col items-center gap-1.5 relative ${!isOwned ? "grayscale opacity-40" : ""}`}
                style={{
                  backgroundColor: isOwned ? rc.bg : "#F3F4F6",
                  border: `2px solid ${rc.border}`,
                  boxShadow: creature.rarity === "legendary" && isOwned ? `0 0 12px ${rc.border}80` : undefined,
                }}
              >
                {isCompanion && (
                  <div className="absolute -top-1 -right-1 bg-sunny-yellow rounded-full text-xs px-1.5 py-0.5 font-bold text-adventure-navy">
                    ⭐
                  </div>
                )}
                <div className="text-3xl">{isOwned ? creature.emoji : "❓"}</div>
                <p className="font-bold text-adventure-navy dark:text-white text-xs text-center leading-tight">
                  {isOwned ? creature.name : "???"}
                </p>
                <span
                  className="text-xs font-bold px-1.5 py-0.5 rounded-full text-white"
                  style={{ backgroundColor: rc.border }}
                >
                  {rc.label}
                </span>
                {isOwned && (
                  <button
                    onClick={(e) => { e.stopPropagation(); setCompanion(creature.id); }}
                    className={`text-xs mt-0.5 px-2 py-0.5 rounded-full font-bold transition-colors ${
                      isCompanion
                        ? "bg-sunny-yellow text-adventure-navy"
                        : "bg-white/80 dark:bg-gray-700 text-gray-600 dark:text-gray-300 border border-gray-200"
                    }`}
                  >
                    {isCompanion ? "✓ Companion" : "Set Companion"}
                  </button>
                )}
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* How to find more */}
      {totalOwned < CREATURES.length && (
        <div className="px-5 mt-5">
          <div className="bg-white dark:bg-gray-800 rounded-3xl p-4 shadow-card">
            <h3 className="font-display text-base text-adventure-navy dark:text-white mb-2">🔍 How to find more creatures</h3>
            <p className="text-sm text-gray-500">Complete adventures to discover new Wonderworld creatures! Each creature appears after reaching a certain number of adventures.</p>
          </div>
        </div>
      )}
    </div>
  );
}
