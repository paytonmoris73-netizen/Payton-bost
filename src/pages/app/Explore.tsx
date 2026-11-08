import { useState, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { ACTIVITIES } from "../../data/activities";
import type { ActivityCategory } from "../../lib/types";

const MOODS = [
  { label: "Energetic", emoji: "⚡", category: "quick-moves" as ActivityCategory },
  { label: "Calm",      emoji: "🧘", category: "stretching" as ActivityCategory },
  { label: "Playful",   emoji: "🎮", category: "dance" as ActivityCategory },
  { label: "Sporty",    emoji: "🏃", category: "sports" as ActivityCategory },
  { label: "Creative",  emoji: "🎨", category: "creative" as ActivityCategory },
];

const CATEGORIES = [
  { id: "quick-moves" as ActivityCategory, label: "Quick Moves",    emoji: "👟", gradient: "from-blue-500 to-blue-700" },
  { id: "sports"      as ActivityCategory, label: "Sports",         emoji: "🏀", gradient: "from-pp-orange to-orange-700" },
  { id: "dance"       as ActivityCategory, label: "Dance",          emoji: "🎵", gradient: "from-pp-pink to-pink-700" },
  { id: "stretching"  as ActivityCategory, label: "Stretch & Relax",emoji: "🧘", gradient: "from-pp-teal to-teal-700" },
  { id: "balance"     as ActivityCategory, label: "Balance",        emoji: "⚡", gradient: "from-pp-purple to-purple-700" },
  { id: "outdoor"     as ActivityCategory, label: "Outdoor",        emoji: "🌿", gradient: "from-pp-green to-green-700" },
  { id: "creative"    as ActivityCategory, label: "Creative",       emoji: "🎨", gradient: "from-yellow-500 to-orange-500" },
  { id: "relaxing"    as ActivityCategory, label: "Relaxing",       emoji: "☁️", gradient: "from-indigo-400 to-indigo-700" },
];

function DifficultyDots({ level }: { level: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3].map(i => (
        <div key={i} className={`w-1.5 h-1.5 rounded-full ${i <= level ? "bg-pp-orange" : "bg-pp-border"}`} />
      ))}
    </div>
  );
}

export function ExplorePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initCat = searchParams.get("cat") as ActivityCategory | null;

  const [search, setSearch] = useState("");
  const [selectedCat, setSelectedCat] = useState<ActivityCategory | null>(initCat);

  const filtered = useMemo(() => {
    return ACTIVITIES.filter(a => {
      const matchCat = !selectedCat || a.category === selectedCat;
      const matchSearch = !search || a.name.toLowerCase().includes(search.toLowerCase()) || a.description.toLowerCase().includes(search.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [search, selectedCat]);

  return (
    <motion.div
      className="pb-24 lg:pb-8 min-h-screen bg-pp-navy"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }}
    >
      {/* Header */}
      <div className="px-5 pt-6 pb-4">
        <h1 className="font-display text-pp-cream text-2xl mb-1">Explore</h1>
        <p className="text-pp-muted text-sm">Discover your next adventure</p>
      </div>

      {/* Search */}
      <div className="px-5 mb-4">
        <div className="glass rounded-2xl flex items-center gap-3 px-4 py-3">
          <svg className="w-5 h-5 text-pp-muted flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" strokeLinecap="round" />
          </svg>
          <input
            type="text"
            placeholder="Search activities..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="flex-1 bg-transparent text-pp-cream placeholder-pp-muted text-sm outline-none"
          />
        </div>
      </div>

      {/* Mood selector */}
      <div className="px-5 mb-5">
        <p className="text-pp-muted text-xs font-bold uppercase tracking-wider mb-2">How are you feeling?</p>
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
          {MOODS.map(m => (
            <button
              key={m.label}
              onClick={() => setSelectedCat(selectedCat === m.category ? null : m.category)}
              className={`flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-semibold transition-all ${
                selectedCat === m.category
                  ? "bg-pp-orange border-pp-orange text-white"
                  : "border-pp-border text-pp-muted hover:border-pp-orange/50 hover:text-pp-cream"
              }`}
            >
              <span>{m.emoji}</span>
              <span>{m.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Category grid */}
      {!search && (
        <div className="px-5 mb-5">
          <p className="text-pp-muted text-xs font-bold uppercase tracking-wider mb-3">Categories</p>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {CATEGORIES.map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCat(selectedCat === cat.id ? null : cat.id)}
                className={`rounded-2xl p-4 bg-gradient-to-br ${cat.gradient} flex flex-col items-start gap-2 transition-all ${
                  selectedCat === cat.id ? "ring-2 ring-white scale-[1.02]" : "hover:scale-[1.02]"
                }`}
              >
                <span className="text-3xl">{cat.emoji}</span>
                <span className="text-white font-black text-sm">{cat.label}</span>
                <span className="text-white/70 text-xs">{ACTIVITIES.filter(a => a.category === cat.id).length} activities</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Activity list */}
      <div className="px-5">
        <div className="flex items-center justify-between mb-3">
          <p className="text-pp-muted text-xs font-bold uppercase tracking-wider">
            {selectedCat ? CATEGORIES.find(c => c.id === selectedCat)?.label : "All Activities"} · {filtered.length}
          </p>
          {selectedCat && (
            <button onClick={() => setSelectedCat(null)} className="text-pp-orange text-xs font-bold">Clear ✕</button>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {filtered.map((activity, i) => (
            <motion.button
              key={activity.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              onClick={() => navigate(`/app/activity/${activity.id}`)}
              className="w-full text-left bg-pp-card border border-pp-border rounded-2xl overflow-hidden hover:border-pp-orange/50 hover:scale-[1.01] transition-all"
            >
              <div className="flex items-stretch">
                <div
                  className="w-20 flex items-center justify-center text-4xl flex-shrink-0"
                  style={{ background: activity.color + "33" }}
                >
                  {activity.emoji}
                </div>
                <div className="flex-1 p-3 min-w-0">
                  <div className="font-black text-pp-cream text-sm truncate">{activity.name}</div>
                  <div className="text-pp-muted text-xs mt-0.5 line-clamp-1">{activity.description}</div>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-pp-orange text-xs font-bold">🕐 {activity.durationMin} min</span>
                    <DifficultyDots level={activity.durationMin <= 5 ? 1 : activity.durationMin <= 10 ? 2 : 3} />
                    <span className="text-pp-muted text-xs capitalize">{activity.category.replace("-", " ")}</span>
                  </div>
                </div>
              </div>
            </motion.button>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
