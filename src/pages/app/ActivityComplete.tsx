import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "../../components/ui/Button";
import { Pip } from "../../components/mascot/Pip";
import { ACHIEVEMENTS } from "../../data/achievements";

interface CompleteState {
  pointsEarned: number;
  newAchievements: string[];
  activityName: string;
}

export function ActivityCompletePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as CompleteState | null;

  const pointsEarned = state?.pointsEarned ?? 10;
  const newAchievements = state?.newAchievements ?? [];
  const activityName = state?.activityName ?? "Activity";

  return (
    <div className="min-h-screen bg-gradient-to-b from-teal/20 to-cream dark:from-teal/10 dark:to-gray-950 flex flex-col items-center justify-center px-6 text-center animate-fade-in">
      {/* Celebration header */}
      <div className="relative mb-6">
        <div className="text-6xl animate-bounce-soft">🎉</div>
      </div>

      {/* PIP */}
      <div className="mb-4">
        <Pip expression="celebrating" size={120} animate />
      </div>

      <h1 className="font-black text-3xl text-navy dark:text-white mb-2">Amazing!</h1>
      <p className="text-gray-500 text-sm mb-6">You completed <strong>{activityName}</strong>!</p>

      {/* Points earned */}
      <div className="bg-yellow rounded-3xl px-8 py-5 mb-4 shadow-card animate-pop">
        <div className="text-3xl font-black text-navy">+{pointsEarned}</div>
        <div className="text-sm font-bold text-navy/70">Play Points Earned!</div>
      </div>

      {/* New achievements */}
      {newAchievements.length > 0 && (
        <div className="w-full max-w-sm mb-4">
          <div className="text-xs font-bold text-gray-400 mb-2">🏆 New Achievements!</div>
          {newAchievements.map(achId => {
            const ach = ACHIEVEMENTS.find(a => a.id === achId);
            if (!ach) return null;
            return (
              <div key={achId} className="bg-white dark:bg-gray-800 rounded-2xl p-3 flex items-center gap-3 mb-2 shadow-card animate-pop">
                <div className="w-10 h-10 rounded-full bg-yellow/30 flex items-center justify-center text-2xl">
                  {ach.emoji}
                </div>
                <div className="text-left">
                  <div className="font-black text-navy dark:text-white text-sm">{ach.name}</div>
                  <div className="text-xs text-gray-400">{ach.description}</div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Encouraging message */}
      <div className="bg-coral/10 rounded-2xl px-5 py-4 mb-6 max-w-xs">
        <p className="text-sm font-bold text-coral">
          {newAchievements.length > 0
            ? "You unlocked new achievements! Keep exploring!"
            : pointsEarned >= 50
            ? "That was incredible! You're a movement superstar!"
            : "Great job! Every activity makes you stronger and happier!"}
        </p>
      </div>

      {/* Actions */}
      <div className="w-full max-w-sm space-y-3">
        <Button fullWidth size="lg" onClick={() => navigate("/app/explore")} className="font-black">
          Try Another Activity 🔍
        </Button>
        <Button fullWidth variant="secondary" onClick={() => navigate("/app/home")}>
          Back to Home
        </Button>
        <button
          onClick={() => navigate("/app/rewards")}
          className="text-coral font-bold text-sm"
        >
          Spend your points in the shop →
        </button>
      </div>
    </div>
  );
}
