import { useNavigate } from "react-router-dom";
import { Pip } from "../../components/mascot/Pip";
import { ActivityCard } from "../../components/activity/ActivityCard";
import { Button } from "../../components/ui/Button";
import { useApp } from "../../contexts/AppContext";
import { ACTIVITIES } from "../../data/activities";
import { ADVENTURE_LOCATIONS } from "../../data/adventures";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function HomePage() {
  const navigate = useNavigate();
  const { activeProfile, state, profileSessions } = useApp();

  if (!activeProfile) return null;

  const sessions = profileSessions(activeProfile.id);
  const today = new Date();
  const hours = today.getHours();
  const greeting = hours < 12 ? "Good morning" : hours < 17 ? "Hey" : "Good evening";

  // Weekly activity dots
  const weekDots = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - 6 + i);
    const dateStr = d.toDateString();
    const hasActivity = sessions.some(s => new Date(s.completedAt).toDateString() === dateStr);
    return { day: DAYS[d.getDay()], hasActivity, isToday: i === 6 };
  });

  // Suggested activities based on preferences
  const preferred = activeProfile.favoriteCategories;
  const featured = preferred.length > 0
    ? ACTIVITIES.filter(a => preferred.includes(a.category))
    : ACTIVITIES;
  const suggested = featured.slice(0, 3).concat(ACTIVITIES.slice(0, 3)).slice(0, 4);

  // Featured adventure (first unlocked location)
  const featuredLoc = ADVENTURE_LOCATIONS.find(l => state.unlockedLocations.includes(l.id));

  // Weekly summary
  const thisWeekSessions = sessions.filter(s => {
    const d = new Date(s.completedAt);
    const diff = (today.getTime() - d.getTime()) / (1000 * 60 * 60 * 24);
    return diff < 7;
  });

  return (
    <div className="pb-24 lg:pb-8 animate-fade-in">
      {/* Top bar */}
      <div className="sticky top-0 z-20 bg-cream/90 dark:bg-gray-950/90 backdrop-blur-sm px-5 py-3 flex items-center justify-between">
        <div>
          <div className="text-xs text-gray-400">👋 {greeting},</div>
          <div className="font-black text-lg text-navy dark:text-white leading-tight">{activeProfile.nickname}!</div>
        </div>
        <div className="flex items-center gap-2">
          <div className="bg-yellow/20 text-navy dark:text-yellow px-3 py-1.5 rounded-full text-xs font-black">
            ⭐ {activeProfile.points}
          </div>
          <button
            onClick={() => navigate("/app/profile")}
            className="w-10 h-10 rounded-full bg-coral/10 flex items-center justify-center text-xl"
          >
            {activeProfile.avatarConfig.outfit}
          </button>
        </div>
      </div>

      <div className="px-5 space-y-6">
        {/* PIP greeting card */}
        <div className="bg-gradient-to-br from-coral to-coral-dark rounded-3xl p-5 relative overflow-hidden shadow-card">
          <div className="absolute right-0 bottom-0 opacity-80">
            <Pip expression="excited" size={110} />
          </div>
          <div className="relative z-10 max-w-[60%]">
            <div className="text-white/70 text-xs font-bold mb-1">PIP says...</div>
            <h2 className="text-white font-black text-lg leading-tight mb-3">
              {sessions.length === 0
                ? "Let's start our first adventure together!"
                : thisWeekSessions.length > 0
                ? `You've done ${thisWeekSessions.length} activities this week!`
                : "Ready for something fun today?"}
            </h2>
            <Button
              variant="yellow"
              size="sm"
              onClick={() => navigate("/app/explore")}
              className="shadow-sm"
            >
              Explore Activities 🔍
            </Button>
          </div>
        </div>

        {/* Featured Adventure */}
        {featuredLoc && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-black text-navy dark:text-white">🗺️ Featured Adventure</h3>
              <button onClick={() => navigate("/app/adventures")} className="text-coral text-xs font-bold">See All →</button>
            </div>
            <button
              onClick={() => navigate(`/app/adventure/${featuredLoc.id}`)}
              className="w-full text-left rounded-3xl overflow-hidden shadow-card hover:shadow-card-hover transition-all active:scale-95"
              style={{ backgroundColor: featuredLoc.bgColor }}
            >
              <div className="p-5 flex items-center gap-4">
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center text-4xl flex-shrink-0 shadow-sm"
                  style={{ backgroundColor: featuredLoc.color }}
                >
                  {featuredLoc.emoji}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-black text-navy dark:text-white text-base">{featuredLoc.name}</div>
                  <div className="text-xs text-gray-500 mt-0.5">{featuredLoc.theme}</div>
                  <div className="text-xs text-gray-400 mt-1">{featuredLoc.activityIds.length} activities inside</div>
                </div>
                <div className="text-2xl">{featuredLoc.emoji}</div>
              </div>
            </button>
          </div>
        )}

        {/* Weekly overview */}
        <div className="bg-white dark:bg-gray-800 rounded-3xl p-5 shadow-card">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-black text-navy dark:text-white">This Week</h3>
              <p className="text-xs text-gray-400">
                {thisWeekSessions.length === 0
                  ? "No activities yet — the week is wide open!"
                  : `${thisWeekSessions.length} adventure${thisWeekSessions.length !== 1 ? "s" : ""} completed!`}
              </p>
            </div>
            <div className="text-2xl">{thisWeekSessions.length >= 5 ? "🔥" : thisWeekSessions.length >= 3 ? "⭐" : "💪"}</div>
          </div>
          <div className="flex justify-between">
            {weekDots.map(({ day, hasActivity, isToday }, i) => (
              <div key={i} className="flex flex-col items-center gap-1.5">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                    hasActivity
                      ? "bg-coral text-white"
                      : isToday
                      ? "border-2 border-coral"
                      : "bg-soft-gray dark:bg-gray-700"
                  }`}
                >
                  {hasActivity ? "✓" : ""}
                </div>
                <span className={`text-xs font-bold ${isToday ? "text-coral" : "text-gray-400"}`}>{day}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Today's Activities */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-black text-navy dark:text-white">Today's Activities</h3>
            <button onClick={() => navigate("/app/explore")} className="text-coral text-xs font-bold">See More →</button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {suggested.map(activity => (
              <ActivityCard key={activity.id} activity={activity} />
            ))}
          </div>
        </div>

        {/* Quick categories */}
        <div>
          <h3 className="font-black text-navy dark:text-white mb-3">Browse Categories</h3>
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {[
              { id: "dance", label: "Dance", emoji: "💃", color: "#B9A9EA" },
              { id: "sports", label: "Sports", emoji: "⚽", color: "#58B9A9" },
              { id: "outdoor", label: "Outdoor", emoji: "🌿", color: "#DDF2E7" },
              { id: "quick-moves", label: "Quick", emoji: "⚡", color: "#FFD56A" },
              { id: "relaxing", label: "Relax", emoji: "🧘", color: "#DDF2E7" },
            ].map(cat => (
              <button
                key={cat.id}
                onClick={() => navigate(`/app/explore?cat=${cat.id}`)}
                className="flex-shrink-0 flex flex-col items-center gap-1 px-4 py-3 rounded-2xl text-center transition-all hover:scale-105 active:scale-95"
                style={{ backgroundColor: cat.color }}
              >
                <span className="text-2xl">{cat.emoji}</span>
                <span className="text-xs font-bold text-navy/80">{cat.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
