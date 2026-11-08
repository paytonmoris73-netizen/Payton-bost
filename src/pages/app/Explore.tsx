import { useState, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { ActivityCard } from "../../components/activity/ActivityCard";
import { ACTIVITIES, searchActivities } from "../../data/activities";
import type { ActivityCategory } from "../../lib/types";

const CATEGORIES: { id: ActivityCategory; label: string; emoji: string; color: string }[] = [
  { id: "quick-moves", label: "Quick Moves", emoji: "⚡", color: "#FFD56A" },
  { id: "dance", label: "Dance", emoji: "💃", color: "#B9A9EA" },
  { id: "sports", label: "Sports", emoji: "⚽", color: "#58B9A9" },
  { id: "stretching", label: "Stretching", emoji: "🤸", color: "#DDF2E7" },
  { id: "balance", label: "Balance", emoji: "🦩", color: "#FF786B" },
  { id: "indoor", label: "Indoor", emoji: "🏠", color: "#FFF5EC" },
  { id: "outdoor", label: "Outdoor", emoji: "🌿", color: "#DDF2E7" },
  { id: "team", label: "Team", emoji: "👫", color: "#58B9A9" },
  { id: "creative", label: "Creative", emoji: "🎨", color: "#FF786B" },
  { id: "relaxing", label: "Relaxing", emoji: "🧘", color: "#DDF2E7" },
];

export function ExplorePage() {
  const [searchParams] = useSearchParams();
  const initialCat = searchParams.get("cat") as ActivityCategory | null;
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<ActivityCategory | null>(initialCat);
  const [spaceFilter, setSpaceFilter] = useState<"all" | "indoor" | "outdoor">("all");

  const results = useMemo(() => {
    let list = query.trim() ? searchActivities(query) : ACTIVITIES;
    if (activeCategory) list = list.filter(a => a.category === activeCategory);
    if (spaceFilter !== "all") list = list.filter(a => a.space === spaceFilter || a.space === "both");
    return list;
  }, [query, activeCategory, spaceFilter]);

  return (
    <div className="pb-24 lg:pb-8 animate-fade-in">
      {/* Header */}
      <div className="px-5 pt-5 pb-3">
        <h1 className="font-black text-2xl text-navy dark:text-white mb-1">Explore</h1>
        <p className="text-sm text-gray-500">Discover your next adventure</p>
      </div>

      {/* Search */}
      <div className="px-5 mb-4">
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔍</span>
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search activities..."
            className="w-full pl-10 pr-4 py-3 rounded-2xl border-2 border-soft-gray dark:border-gray-700 bg-white dark:bg-gray-800 text-navy dark:text-white focus:border-coral focus:outline-none text-sm"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm"
            >✕</button>
          )}
        </div>
      </div>

      {/* Space filter */}
      <div className="px-5 mb-4">
        <div className="flex gap-2">
          {(["all", "indoor", "outdoor"] as const).map(f => (
            <button
              key={f}
              onClick={() => setSpaceFilter(f)}
              className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${
                spaceFilter === f
                  ? "bg-navy text-white dark:bg-white dark:text-navy"
                  : "bg-soft-gray dark:bg-gray-800 text-gray-500 dark:text-gray-400"
              }`}
            >
              {f === "all" ? "All" : f === "indoor" ? "🏠 Indoor" : "🌿 Outdoor"}
            </button>
          ))}
        </div>
      </div>

      {/* Categories */}
      <div className="mb-4">
        <div className="px-5 mb-2">
          <h3 className="font-bold text-navy dark:text-white text-sm">Categories</h3>
        </div>
        <div className="flex gap-2 overflow-x-auto px-5 pb-1 scrollbar-hide">
          <button
            onClick={() => setActiveCategory(null)}
            className={`flex-shrink-0 px-4 py-2 rounded-full text-xs font-bold transition-all ${
              !activeCategory ? "bg-coral text-white" : "bg-soft-gray dark:bg-gray-800 text-gray-500 dark:text-gray-400"
            }`}
          >
            All
          </button>
          {CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(activeCategory === cat.id ? null : cat.id)}
              className={`flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold transition-all ${
                activeCategory === cat.id
                  ? "bg-coral text-white scale-105"
                  : "bg-soft-gray dark:bg-gray-800 text-gray-600 dark:text-gray-300"
              }`}
              style={activeCategory !== cat.id ? {} : {}}
            >
              {cat.emoji} {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Results */}
      <div className="px-5">
        <div className="text-xs text-gray-400 mb-3">
          {results.length} {results.length === 1 ? "activity" : "activities"} found
        </div>

        {results.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-5xl mb-3">🔍</div>
            <div className="font-bold text-navy dark:text-white mb-1">Nothing found</div>
            <div className="text-sm text-gray-500">Try a different search or category</div>
            <button
              onClick={() => { setQuery(""); setActiveCategory(null); setSpaceFilter("all"); }}
              className="mt-4 text-coral font-bold text-sm"
            >
              Clear filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {results.map(activity => (
              <ActivityCard key={activity.id} activity={activity} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
