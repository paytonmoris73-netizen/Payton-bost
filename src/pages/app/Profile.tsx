import { useNavigate } from "react-router-dom";
import { useApp } from "../../contexts/AppContext";
import { ACTIVITIES } from "../../data/activities";
import { ACHIEVEMENTS } from "../../data/achievements";
import { Button } from "../../components/ui/Button";
import { ProgressBar } from "../../components/ui/ProgressBar";

export function ProfilePage() {
  const navigate = useNavigate();
  const { activeProfile, profileSessions, profileAchievements, profileRewards, selectProfile, state } = useApp();

  if (!activeProfile) return null;

  const sessions = profileSessions(activeProfile.id);
  const achievements = profileAchievements(activeProfile.id);
  profileRewards(activeProfile.id); // ensure rewards are tracked

  const totalActivities = sessions.length;
  const uniqueCategories = new Set(sessions.map(s => ACTIVITIES.find(a => a.id === s.activityId)?.category ?? "").filter(Boolean)).size;
  const totalPoints = activeProfile.points;

  return (
    <div className="pb-24 lg:pb-8 animate-fade-in">
      {/* Header */}
      <div className="relative px-5 pt-5 pb-6 bg-gradient-to-br from-coral/20 to-cream dark:from-coral/10 dark:to-gray-950">
        <div className="text-center">
          {/* Avatar */}
          <button
            onClick={() => navigate("/app/avatar")}
            className="w-24 h-24 rounded-full mx-auto mb-3 flex items-center justify-center text-6xl shadow-card border-4 border-white dark:border-gray-800 transition-all hover:scale-105"
            style={{ backgroundColor: activeProfile.avatarConfig.background }}
          >
            {activeProfile.avatarConfig.outfit}
          </button>
          <div className="font-black text-2xl text-navy dark:text-white">{activeProfile.nickname}</div>
          <div className="text-sm text-gray-400 mt-0.5">Age {activeProfile.ageRange}</div>
          <button
            onClick={() => navigate("/app/avatar")}
            className="mt-2 text-xs text-coral font-bold"
          >
            ✏️ Customize Avatar
          </button>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3 mt-5">
          {[
            { label: "Activities", value: totalActivities },
            { label: "Play Points", value: totalPoints, suffix: "⭐" },
            { label: "Achievements", value: achievements.length },
          ].map(({ label, value, suffix }) => (
            <div key={label} className="bg-white dark:bg-gray-800 rounded-2xl p-3 text-center shadow-card">
              <div className="font-black text-xl text-navy dark:text-white">
                {suffix}{value}
              </div>
              <div className="text-xs text-gray-400">{label}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="px-5 py-4 space-y-4">
        {/* Adventure progress */}
        <div className="bg-white dark:bg-gray-800 rounded-3xl p-5 shadow-card">
          <h3 className="font-black text-navy dark:text-white mb-3">Adventure Progress</h3>
          <div className="space-y-3">
            <ProgressBar
              value={(totalActivities / 20) * 100}
              label={`${totalActivities} activities completed`}
              color="#FF786B"
            />
            <ProgressBar
              value={(uniqueCategories / 10) * 100}
              label={`${uniqueCategories} categories explored`}
              color="#58B9A9"
            />
            <ProgressBar
              value={(state.unlockedLocations.length / 6) * 100}
              label={`${state.unlockedLocations.length}/6 worlds unlocked`}
              color="#B9A9EA"
            />
          </div>
        </div>

        {/* Achievements preview */}
        <div className="bg-white dark:bg-gray-800 rounded-3xl p-5 shadow-card">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-black text-navy dark:text-white">Achievements</h3>
            <button onClick={() => navigate("/app/achievements")} className="text-xs text-coral font-bold">See All →</button>
          </div>
          {achievements.length === 0 ? (
            <div className="text-center py-4">
              <div className="text-3xl mb-2">🏆</div>
              <div className="text-sm text-gray-500">Complete activities to earn achievements!</div>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {achievements.slice(0, 6).map(ua => {
                const ach = ACHIEVEMENTS.find(a => a.id === ua.achievementId);
                if (!ach) return null;
                return (
                  <div
                    key={ua.achievementId}
                    className="w-12 h-12 rounded-full bg-yellow/20 flex items-center justify-center text-2xl"
                    title={ach.name}
                  >
                    {ach.emoji}
                  </div>
                );
              })}
              {achievements.length > 6 && (
                <div className="w-12 h-12 rounded-full bg-soft-gray dark:bg-gray-700 flex items-center justify-center text-xs font-bold text-gray-500">
                  +{achievements.length - 6}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Recent activity */}
        {sessions.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-3xl p-5 shadow-card">
            <h3 className="font-black text-navy dark:text-white mb-3">Recent Activities</h3>
            <div className="space-y-2">
              {sessions.slice(-3).reverse().map(s => {
                const act = ACTIVITIES.find(a => a.id === s.activityId);
                return (
                  <div key={s.id} className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                      style={{ backgroundColor: act?.color ?? "#F0EFEB" }}
                    >
                      {act?.emoji ?? "🏃"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-navy dark:text-white text-sm truncate">{s.activityName}</div>
                      <div className="text-xs text-gray-400">{new Date(s.completedAt).toLocaleDateString()}</div>
                    </div>
                    <div className="text-xs text-coral font-bold">+{s.pointsEarned} pts</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="space-y-2">
          <Button variant="secondary" fullWidth onClick={() => navigate("/app/rewards")}>
            🛍️ Visit Reward Shop ({activeProfile.points} pts)
          </Button>
          <Button variant="ghost" fullWidth onClick={() => { selectProfile(null); navigate("/profiles"); }}>
            Switch Profile
          </Button>
        </div>
      </div>
    </div>
  );
}
