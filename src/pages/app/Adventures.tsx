import { useNavigate } from "react-router-dom";
import { ADVENTURE_LOCATIONS } from "../../data/adventures";
import { useApp } from "../../contexts/AppContext";
import { Pip } from "../../components/mascot/Pip";

export function AdventuresPage() {
  const navigate = useNavigate();
  const { state, activeProfile, profileSessions } = useApp();

  if (!activeProfile) return null;
  const sessions = profileSessions(activeProfile.id);
  const totalActivities = sessions.length;

  return (
    <div className="pb-24 lg:pb-8 animate-fade-in">
      {/* Header */}
      <div className="relative overflow-hidden px-5 pt-5 pb-10 bg-gradient-to-br from-navy to-gray-800">
        <div className="absolute right-0 bottom-0 opacity-30">
          <Pip expression="excited" size={120} />
        </div>
        <div className="relative z-10">
          <h1 className="font-black text-3xl text-white mb-1">PIP's World</h1>
          <p className="text-sm text-white/70">Explore adventure locations</p>
          <div className="mt-3 inline-flex items-center gap-2 bg-white/20 rounded-full px-3 py-1.5">
            <span className="text-white text-xs font-bold">🗺️ {state.unlockedLocations.length}/{ADVENTURE_LOCATIONS.length} locations unlocked</span>
          </div>
        </div>
      </div>

      {/* Progress hint */}
      <div className="px-5 -mt-4 mb-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-3 shadow-card text-xs text-gray-500 dark:text-gray-400">
          <span className="font-bold text-navy dark:text-white">You've completed {totalActivities} activities!</span> Keep exploring to unlock new worlds.
        </div>
      </div>

      {/* World map */}
      <div className="px-5 space-y-3">
        {ADVENTURE_LOCATIONS.map((loc, i) => {
          const isUnlocked = state.unlockedLocations.includes(loc.id);
          const remaining = loc.activitiesRequired - totalActivities;

          return (
            <button
              key={loc.id}
              onClick={() => isUnlocked ? navigate(`/app/adventure/${loc.id}`) : undefined}
              disabled={!isUnlocked}
              className={`w-full text-left rounded-3xl overflow-hidden shadow-card transition-all ${
                isUnlocked
                  ? "hover:shadow-card-hover active:scale-95 cursor-pointer"
                  : "opacity-60 cursor-not-allowed"
              }`}
            >
              <div
                className="relative p-5 flex items-center gap-4"
                style={{ backgroundColor: isUnlocked ? loc.bgColor : "#F5F5F5" }}
              >
                {/* Number */}
                <div className="absolute top-3 left-3 w-5 h-5 rounded-full bg-white/60 flex items-center justify-center text-xs font-black text-navy/60">
                  {i + 1}
                </div>

                {/* Icon */}
                <div
                  className={`w-20 h-20 rounded-3xl flex items-center justify-center text-5xl flex-shrink-0 shadow-sm ${!isUnlocked ? "grayscale" : ""}`}
                  style={{ backgroundColor: isUnlocked ? loc.color : "#E0E0E0" }}
                >
                  {isUnlocked ? loc.emoji : "🔒"}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="font-black text-navy dark:text-navy text-base">{loc.name}</div>
                  <div className="text-xs text-gray-500 mt-0.5">{loc.theme}</div>
                  <div className="text-xs text-gray-400 mt-1">{loc.activityIds.length} activities</div>

                  {!isUnlocked && remaining > 0 && (
                    <div className="mt-2 inline-flex items-center gap-1 bg-gray-200 rounded-full px-2 py-0.5">
                      <span className="text-xs font-bold text-gray-600">
                        🔓 Complete {remaining} more activit{remaining === 1 ? "y" : "ies"}
                      </span>
                    </div>
                  )}

                  {isUnlocked && (
                    <div className="mt-2 inline-flex items-center gap-1 bg-teal/20 rounded-full px-2 py-0.5">
                      <span className="text-xs font-bold text-teal-dark">✓ Unlocked!</span>
                    </div>
                  )}
                </div>

                {isUnlocked && (
                  <div className="text-gray-400">›</div>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Motivation */}
      <div className="px-5 mt-6">
        <div className="bg-coral/10 rounded-3xl p-5 flex items-center gap-4">
          <Pip expression="encouraging" size={60} />
          <div>
            <div className="font-black text-navy dark:text-white text-sm">Keep exploring!</div>
            <div className="text-xs text-gray-500 mt-0.5">
              {totalActivities < 3
                ? "Complete 3 activities to unlock Rainbow Forest!"
                : totalActivities < 18
                ? `Just ${18 - totalActivities} more activities to unlock Space Explorer!`
                : "You've unlocked all worlds! You're a true adventurer!"}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
