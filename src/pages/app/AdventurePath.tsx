import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useApp } from "../../contexts/AppContext";

interface PathNode {
  id: string;
  type: "activity" | "creature" | "location" | "story";
  activityId?: string;
  label: string;
  emoji: string;
  color: string;
  activitiesRequired: number;
  x: number; // 0-1 relative
}

const PATH_NODES: PathNode[] = [
  { id: "n1", type: "activity", activityId: "animal-moves", label: "Animal Moves", emoji: "🐾", color: "#6BCB77", activitiesRequired: 0, x: 0.5 },
  { id: "n2", type: "activity", activityId: "dance-party", label: "Dance Party", emoji: "💃", color: "#FF6B6B", activitiesRequired: 1, x: 0.25 },
  { id: "n3", type: "story", label: "PIP finds a friend!", emoji: "📖", color: "#FFD93D", activitiesRequired: 2, x: 0.75 },
  { id: "n4", type: "activity", activityId: "balance-quest", label: "Balance Quest", emoji: "🦩", color: "#9B5DE5", activitiesRequired: 2, x: 0.5 },
  { id: "n5", type: "creature", label: "Find BLOOM!", emoji: "🌸", color: "#F48FB1", activitiesRequired: 3, x: 0.2 },
  { id: "n6", type: "activity", activityId: "mini-soccer", label: "Soccer Skills", emoji: "⚽", color: "#4FC3F7", activitiesRequired: 3, x: 0.8 },
  { id: "n7", type: "activity", activityId: "stretch-relax", label: "Stretch & Relax", emoji: "🧘", color: "#58B9A9", activitiesRequired: 4, x: 0.5 },
  { id: "n8", type: "location", label: "Forest Unlocked!", emoji: "🌲", color: "#2D6A4F", activitiesRequired: 5, x: 0.3 },
  { id: "n9", type: "activity", activityId: "outdoor-discovery", label: "Outdoor Walk", emoji: "🌿", color: "#52B788", activitiesRequired: 5, x: 0.7 },
  { id: "n10", type: "activity", activityId: "basketball-skills", label: "Basketball", emoji: "🏀", color: "#F4A261", activitiesRequired: 6, x: 0.5 },
  { id: "n11", type: "creature", label: "Find BUBBLE!", emoji: "🫧", color: "#4FC3F7", activitiesRequired: 7, x: 0.2 },
  { id: "n12", type: "activity", activityId: "hopscotch", label: "Hopscotch", emoji: "🏃", color: "#FF6B6B", activitiesRequired: 7, x: 0.75 },
  { id: "n13", type: "story", label: "The Ocean calls...", emoji: "📖", color: "#FFD93D", activitiesRequired: 8, x: 0.5 },
  { id: "n14", type: "activity", activityId: "yoga-adventure", label: "Yoga Adventure", emoji: "🌸", color: "#CE93D8", activitiesRequired: 8, x: 0.3 },
  { id: "n15", type: "location", label: "Ocean Unlocked!", emoji: "🌊", color: "#0288D1", activitiesRequired: 10, x: 0.5 },
];

const NODE_HEIGHT = 90;

export function AdventurePathPage() {
  const navigate = useNavigate();
  const { state, activeProfile } = useApp();
  const [selectedNode, setSelectedNode] = useState<PathNode | null>(null);

  const totalActivities = activeProfile
    ? state.sessions.filter(s => s.profileId === activeProfile.id).length
    : 0;

  function isNodeComplete(node: PathNode) {
    if (node.type === "activity" && node.activityId) {
      return state.sessions.some(s => s.profileId === activeProfile?.id && s.activityId === node.activityId);
    }
    return totalActivities > node.activitiesRequired;
  }

  function isNodeUnlocked(node: PathNode) {
    return totalActivities >= node.activitiesRequired;
  }

  const totalHeight = PATH_NODES.length * NODE_HEIGHT + 100;

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-blue/10 to-purple/5 dark:from-adventure-navy dark:to-gray-950 pb-24 lg:pb-8">
      {/* Header */}
      <div className="px-5 pt-5 pb-3">
        <h1 className="font-display text-2xl text-adventure-navy dark:text-white">Adventure Path</h1>
        <p className="text-sm text-gray-500">{totalActivities} adventures completed</p>
      </div>

      {/* Path */}
      <div className="px-4 overflow-y-auto">
        <div className="relative mx-auto max-w-xs" style={{ height: totalHeight }}>
          {/* Connecting line */}
          <div
            className="absolute left-1/2 top-10 w-1 -translate-x-1/2 rounded-full bg-gradient-to-b from-mint via-sky-blue to-purple opacity-30"
            style={{ height: totalHeight - 80 }}
          />

          {PATH_NODES.map((node, index) => {
            const unlocked = isNodeUnlocked(node);
            const complete = isNodeComplete(node);
            const isCurrent = unlocked && !complete && (index === 0 || isNodeComplete(PATH_NODES[index - 1]));
            const leftPercent = node.x;

            return (
              <div
                key={node.id}
                className="absolute"
                style={{
                  top: index * NODE_HEIGHT + 20,
                  left: `${leftPercent * 100}%`,
                  transform: "translateX(-50%)",
                }}
              >
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  animate={isCurrent ? { scale: [1, 1.1, 1], boxShadow: ["0 0 0px transparent", `0 0 20px ${node.color}`, "0 0 0px transparent"] } : {}}
                  transition={isCurrent ? { duration: 2, repeat: Infinity } : {}}
                  onClick={() => unlocked && setSelectedNode(node)}
                  className={`w-14 h-14 rounded-full flex items-center justify-center text-2xl shadow-card border-4 transition-all ${
                    complete ? "border-sunny-yellow" :
                    isCurrent ? "border-white" :
                    unlocked ? "border-white/50" : "border-gray-300"
                  } ${!unlocked ? "opacity-30 grayscale" : ""}`}
                  style={{ backgroundColor: unlocked ? node.color : "#D1D5DB" }}
                >
                  {complete ? "✅" : unlocked ? node.emoji : "🔒"}
                </motion.button>

                {/* Type indicator */}
                {node.type !== "activity" && unlocked && (
                  <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-white shadow text-xs flex items-center justify-center">
                    {node.type === "story" ? "📖" : node.type === "creature" ? "🐾" : "🗺️"}
                  </div>
                )}

                {/* Label */}
                <p className="text-center text-xs font-bold mt-1 w-20 -ml-3 text-adventure-navy dark:text-white leading-tight">
                  {node.label}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Node Detail Sheet */}
      <AnimatePresence>
        {selectedNode && (
          <motion.div
            initial={{ y: 300, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 300, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed bottom-20 lg:bottom-4 left-0 right-0 mx-4 bg-white dark:bg-gray-800 rounded-3xl shadow-card-hover p-5 z-20"
          >
            <div className="flex items-center gap-4 mb-4">
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl"
                style={{ backgroundColor: selectedNode.color }}
              >
                {selectedNode.emoji}
              </div>
              <div className="flex-1">
                <h3 className="font-display text-xl text-adventure-navy dark:text-white">{selectedNode.label}</h3>
                <span className="text-xs px-2 py-0.5 rounded-full font-bold text-white" style={{ backgroundColor: selectedNode.color }}>
                  {selectedNode.type === "activity" ? "Adventure" :
                   selectedNode.type === "creature" ? "Creature Discovery" :
                   selectedNode.type === "story" ? "Story Chapter" : "Location Unlock"}
                </span>
              </div>
              <button onClick={() => setSelectedNode(null)} className="text-gray-400 text-2xl">×</button>
            </div>

            {selectedNode.type === "activity" && selectedNode.activityId && (
              <button
                onClick={() => {
                  setSelectedNode(null);
                  navigate(`/app/activity/${selectedNode.activityId}`);
                }}
                className="w-full py-3 rounded-2xl font-display text-lg text-white active:scale-95 transition-transform"
                style={{ backgroundColor: selectedNode.color }}
              >
                Start Adventure →
              </button>
            )}
            {selectedNode.type !== "activity" && (
              <div className="bg-gray-50 dark:bg-gray-700 rounded-2xl p-3 text-sm text-gray-600 dark:text-gray-300 text-center">
                {selectedNode.type === "story" ? "Complete the previous adventure to unlock this story!" :
                 selectedNode.type === "creature" ? "Complete the previous adventure to discover this creature!" :
                 "Complete enough adventures to unlock this location!"}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
