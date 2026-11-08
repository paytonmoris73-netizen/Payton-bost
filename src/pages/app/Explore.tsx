import { useState, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { ACTIVITIES, searchActivities } from "../../data/activities";
import type { ActivityCategory } from "../../lib/types";

const CATEGORIES: { id: ActivityCategory; label: string; emoji: string; color: string; gradient: string }[] = [
  { id: "quick-moves", label: "Quick Moves", emoji: "⚡", color: "#FFD93D", gradient: "from-yellow-400 to-orange-400" },
  { id: "dance", label: "Dance", emoji: "💃", color: "#9B5DE5", gradient: "from-purple to-pink-500" },
  { id: "sports", label: "Sports", emoji: "⚽", color: "#4FC3F7", gradient: "from-sky-blue to-blue-500" },
  { id: "stretching", label: "Stretch", emoji: "🤸", color: "#6BCB77", gradient: "from-mint to-forest" },
  { id: "balance", label: "Balance", emoji: "🦩", color: "#FF6B6B", gradient: "from-coral to-red-400" },
  { id: "indoor", label: "Indoor", emoji: "🏠", color: "#F4A261", gradient: "from-gold to-orange-500" },
  { id: "outdoor", label: "Outdoor", emoji: "🌿", color: "#52B788", gradient: "from-forest to-mint" },
  { id: "team", label: "Team", emoji: "👫", color: "#4FC3F7", gradient: "from-sky-blue to-purple" },
  { id: "creative", label: "Creative", emoji: "🎨", color: "#FF6B6B", gradient: "from-coral to-purple" },
  { id: "relaxing", label: "Relax", emoji: "🧘", color: "#6BCB77", gradient: "from-mint to-sky-blue" },
];

const MOODS = [
  { id: "energetic", label: "Energetic", emoji: "🔥", categories: ["quick-moves", "dance", "sports"] },
  { id: "calm", label: "Chill", emoji: "🌊", categories: ["stretching", "relaxing", "balance"] },
  { id: "social", label: "Social", emoji: "🤝", categories: ["team", "dance"] },
  { id: "creative", label: "Creative", emoji: "✨", categories: ["creative", "indoor"] },
];

export function ExplorePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialCat = searchParams.get("cat") as ActivityCategory | null;
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<ActivityCategory | null>(initialCat);
  const [activeMood, setActiveMood] = useState<string | null>(null);
  const [spaceFilter, setSpaceFilter] = useState<"all" | "indoor" | "outdoor">("all");

  const results = useMemo(() => {
    let list = query.trim() ? searchActivities(query) : ACTIVITIES;
    if (activeMood) {
      const mood = MOODS.find(m => m.id === activeMood);
      if (mood) list = list.filter(a => mood.categories.includes(a.category));
    }
    if (activeCategory) list = list.filter(a => a.category === activeCategory);
    if (spaceFilter !== "all") list = list.filter(a => a.space === spaceFilter || a.space === "both");
    return list;
  }, [query, activeCategory, activeMood, spaceFilter]);

  const featuredActivity = ACTIVITIES[Math.floor(Date.now() / 86400000) % ACTIVITIES.length];

  return (
    <div className="pb-24 lg:pb-8">
      {/* Hero header */}
      <div className="relative px-5 pt-6 pb-6 bg-gradient-to-br from-coral/80 via-purple/60 to-sky-blue/60 overflow-hidden">
        <div className="absolute top-0 right-0 w-40 h-40 rounded-full bg-white/10 -translate-y-1/2 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-28 h-28 rounded-full bg-black/10 translate-y-1/2 -translate-x-1/3" />
        <div className="relative">
          <h1 className="font-display text-3xl text-white">Find Adventures</h1>
          <p className="text-white/80 text-sm mt-0.5">What do you feel like doing today?</p>
          {/* Search bar */}
          <div className="relative mt-4">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/60 text-sm">🔍</span>
            <input
              type="text"
              value={query}
              onChange={e => { setQuery(e.target.value); setActiveMood(null); setActiveCategory(null); }}
              placeholder="Search adventures..."
              className="w-full pl-10 pr-10 py-3 rounded-2xl bg-white/20 backdrop-blur-sm text-white placeholder-white/60 focus:outline-none focus:bg-white/30 text-sm font-bold"
            />
            {query && (
              <button onClick={() => setQuery("")} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/60 text-sm">✕</button>
            )}
          </div>
        </div>
      </div>

      <div className="px-5 py-4 space-y-5">
        {/* Mood picker */}
        {!query && (
          <div>
            <h2 className="font-display text-lg text-adventure-navy dark:text-white mb-3">How are you feeling?</h2>
            <div className="grid grid-cols-4 gap-2">
              {MOODS.map((mood, i) => (
                <motion.button
                  key={mood.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => {
                    setActiveMood(activeMood === mood.id ? null : mood.id);
                    setActiveCategory(null);
                  }}
                  className={`rounded-2xl p-3 flex flex-col items-center gap-1 transition-all ${
                    activeMood === mood.id
                      ? "bg-purple text-white shadow-glow-purple scale-105"
                      : "bg-white dark:bg-gray-800 shadow-card text-adventure-navy dark:text-white"
                  }`}
                >
                  <span className="text-2xl">{mood.emoji}</span>
                  <span className="text-xs font-bold">{mood.label}</span>
                </motion.button>
              ))}
            </div>
          </div>
        )}

        {/* Featured today */}
        {!query && !activeMood && !activeCategory && (
          <div>
            <h2 className="font-display text-lg text-adventure-navy dark:text-white mb-3">⭐ Featured Today</h2>
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate(`/app/activity/${featuredActivity.id}`)}
              className="w-full rounded-3xl overflow-hidden shadow-card relative"
              style={{ background: `linear-gradient(135deg, ${featuredActivity.color}, ${featuredActivity.color}99)` }}
            >
              <div className="p-5 flex items-center gap-4">
                <div className="w-20 h-20 rounded-2xl bg-white/20 flex items-center justify-center text-5xl flex-shrink-0">
                  {featuredActivity.emoji}
                </div>
                <div className="flex-1 text-left">
                  <span className="text-xs font-bold text-white/80 uppercase tracking-wide">Adventure of the Day</span>
                  <p className="font-display text-xl text-white leading-tight">{featuredActivity.name}</p>
                  <p className="text-white/80 text-sm mt-1">{featuredActivity.durationMin} min · {featuredActivity.durationMin > 10 ? "Active" : "Quick"}</p>
                </div>
                <div className="text-white text-2xl">→</div>
              </div>
            </motion.button>
          </div>
        )}

        {/* Categories */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display text-lg text-adventure-navy dark:text-white">Categories</h2>
            <div className="flex gap-2">
              {(["all", "indoor", "outdoor"] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setSpaceFilter(f)}
                  className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                    spaceFilter === f
                      ? "bg-adventure-navy dark:bg-white text-white dark:text-adventure-navy"
                      : "bg-soft-gray dark:bg-gray-800 text-gray-500 dark:text-gray-400"
                  }`}
                >
                  {f === "all" ? "All" : f === "indoor" ? "🏠" : "🌿"}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-5 gap-2">
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => { setActiveCategory(null); setActiveMood(null); }}
              className={`rounded-2xl p-2 flex flex-col items-center gap-1 transition-all ${
                !activeCategory && !activeMood
                  ? "bg-adventure-navy dark:bg-white text-white dark:text-adventure-navy shadow-card"
                  : "bg-white dark:bg-gray-800 text-gray-500 shadow-card"
              }`}
            >
              <span className="text-xl">🌟</span>
              <span className="text-xs font-bold">All</span>
            </motion.button>
            {CATEGORIES.map((cat, i) => (
              <motion.button
                key={cat.id}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.03 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => {
                  setActiveCategory(activeCategory === cat.id ? null : cat.id);
                  setActiveMood(null);
                }}
                className={`rounded-2xl p-2 flex flex-col items-center gap-1 transition-all ${
                  activeCategory === cat.id
                    ? "shadow-card scale-105"
                    : "bg-white dark:bg-gray-800 shadow-card"
                }`}
                style={activeCategory === cat.id ? { backgroundColor: cat.color, color: "white" } : {}}
              >
                <span className="text-xl">{cat.emoji}</span>
                <span className="text-xs font-bold leading-tight text-center">{cat.label}</span>
              </motion.button>
            ))}
          </div>
        </div>

        {/* Results */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display text-lg text-adventure-navy dark:text-white">
              {activeMood ? `${MOODS.find(m => m.id === activeMood)?.emoji} ${MOODS.find(m => m.id === activeMood)?.label} Adventures` :
               activeCategory ? `${CATEGORIES.find(c => c.id === activeCategory)?.emoji} ${CATEGORIES.find(c => c.id === activeCategory)?.label}` :
               query ? "Search Results" : "All Adventures"}
            </h2>
            <span className="text-xs text-gray-400 font-bold">{results.length} found</span>
          </div>

          {results.length === 0 ? (
            <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-3xl shadow-card">
              <div className="text-5xl mb-3">🔍</div>
              <div className="font-display text-xl text-adventure-navy dark:text-white mb-1">Nothing here yet!</div>
              <div className="text-sm text-gray-500">Try a different search or category</div>
              <button
                onClick={() => { setQuery(""); setActiveCategory(null); setActiveMood(null); setSpaceFilter("all"); }}
                className="mt-4 bg-purple text-white font-bold text-sm px-6 py-2 rounded-full"
              >
                Clear filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {results.map((activity, i) => (
                <motion.button
                  key={activity.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => navigate(`/app/activity/${activity.id}`)}
                  className="rounded-3xl overflow-hidden shadow-card text-left"
                  style={{ background: `linear-gradient(135deg, ${activity.color}, ${activity.color}99)` }}
                >
                  <div className="p-4">
                    <div className="text-4xl mb-2">{activity.emoji}</div>
                    <p className="font-display text-white text-sm leading-tight">{activity.name}</p>
                    <p className="text-white/70 text-xs mt-1">{activity.durationMin} min</p>
                    <p className="text-white/90 text-xs font-bold mt-0.5">{activity.category}</p>
                  </div>
                </motion.button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
