import { useNavigate } from "react-router-dom";
import { ACHIEVEMENTS } from "../../data/achievements";
import { useApp } from "../../contexts/AppContext";
import { Pip } from "../../components/mascot/Pip";

export function AchievementsPage() {
  const navigate = useNavigate();
  const { activeProfile, profileAchievements } = useApp();

  if (!activeProfile) return null;
  const unlocked = profileAchievements(activeProfile.id);
  const unlockedIds = unlocked.map(a => a.achievementId);

  return (
    <div className="pb-24 lg:pb-8 animate-fade-in">
      <div className="flex items-center px-5 py-5">
        <button onClick={() => navigate(-1)} className="text-gray-400 hover:text-navy dark:hover:text-white mr-3 text-xl">‹</button>
        <div>
          <h1 className="font-black text-xl text-navy dark:text-white">Achievements</h1>
          <div className="text-xs text-gray-400">{unlocked.length}/{ACHIEVEMENTS.length} unlocked</div>
        </div>
      </div>

      {/* Stats */}
      <div className="px-5 mb-4">
        <div className="bg-gradient-to-r from-coral to-coral-dark rounded-3xl p-5 text-white flex items-center gap-4">
          <Pip expression="celebrating" size={64} />
          <div>
            <div className="font-black text-2xl">{unlocked.length}</div>
            <div className="text-white/80 text-sm">achievements earned</div>
            <div className="text-white/60 text-xs mt-1">{ACHIEVEMENTS.length - unlocked.length} left to discover</div>
          </div>
        </div>
      </div>

      {/* Achievement list */}
      <div className="px-5 space-y-3">
        {/* Unlocked first */}
        {ACHIEVEMENTS.filter(a => unlockedIds.includes(a.id)).map(ach => (
          <div
            key={ach.id}
            className="flex items-center gap-4 bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-card"
          >
            <div className="w-14 h-14 rounded-full bg-yellow/30 flex items-center justify-center text-3xl flex-shrink-0">
              {ach.emoji}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-black text-navy dark:text-white text-sm">{ach.name}</div>
              <div className="text-xs text-gray-500 mt-0.5">{ach.description}</div>
              <div className="text-xs text-teal font-bold mt-1">✓ Unlocked!</div>
            </div>
          </div>
        ))}

        {/* Locked */}
        {ACHIEVEMENTS.filter(a => !unlockedIds.includes(a.id)).map(ach => (
          <div
            key={ach.id}
            className="flex items-center gap-4 bg-soft-gray dark:bg-gray-900 rounded-2xl p-4 opacity-60"
          >
            <div className="w-14 h-14 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-3xl flex-shrink-0 grayscale">
              {ach.emoji}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-black text-navy dark:text-white text-sm">{ach.name}</div>
              <div className="text-xs text-gray-400 mt-0.5">{ach.condition}</div>
              <div className="text-xs text-gray-400 mt-1">🔒 Keep exploring to unlock!</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
