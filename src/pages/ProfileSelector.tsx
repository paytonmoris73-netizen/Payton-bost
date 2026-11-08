import { useNavigate } from "react-router-dom";
import { Button } from "../components/ui/Button";
import { useApp } from "../contexts/AppContext";
import { Pip } from "../components/mascot/Pip";

export function ProfileSelectorPage() {
  const navigate = useNavigate();
  const { state, selectProfile, logout } = useApp();

  if (!state.parent) {
    navigate("/");
    return null;
  }

  function pick(id: string) {
    selectProfile(id);
    navigate("/app/home");
  }

  const hours = new Date().getHours();
  const greeting = hours < 12 ? "Good morning!" : hours < 17 ? "Good afternoon!" : "Good evening!";

  return (
    <div className="min-h-screen bg-gradient-to-b from-cream to-white dark:from-gray-900 dark:to-gray-950 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-5">
        <div>
          <div className="text-sm text-gray-500">{greeting}</div>
          <div className="font-black text-navy dark:text-white">{state.parent.displayName}</div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => navigate("/parent")}
            className="px-3 py-1.5 bg-soft-gray dark:bg-gray-800 rounded-xl text-xs font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            Parent 👨‍👩‍👧
          </button>
          <button
            onClick={() => { logout(); navigate("/"); }}
            className="px-3 py-1.5 bg-soft-gray dark:bg-gray-800 rounded-xl text-xs font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            Sign Out
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 px-6 pb-10 flex flex-col items-center">
        <div className="text-center mb-8">
          <Pip expression="excited" size={80} animate />
          <h1 className="font-black text-2xl text-navy dark:text-white mt-3">Who's playing today?</h1>
          <p className="text-sm text-gray-500 mt-1">Choose a profile to start the adventure</p>
        </div>

        {state.profiles.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-5xl mb-3">👋</div>
            <p className="text-gray-500 mb-4">No profiles yet! Create one to get started.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 w-full max-w-sm">
            {state.profiles.map(profile => (
              <button
                key={profile.id}
                onClick={() => pick(profile.id)}
                className="bg-white dark:bg-gray-800 rounded-3xl p-5 shadow-card hover:shadow-card-hover transition-all active:scale-95 text-center"
              >
                <div className="text-5xl mb-3">{profile.avatarConfig.outfit}</div>
                <div className="font-black text-navy dark:text-white text-sm">{profile.nickname}</div>
                <div className="text-xs text-coral font-semibold mt-1">⭐ {profile.points} pts</div>
                <div className="text-xs text-gray-400 mt-0.5">Age {profile.ageRange}</div>
              </button>
            ))}
          </div>
        )}

        <div className="mt-6">
          <Button
            variant="secondary"
            onClick={() => navigate("/profiles/create")}
          >
            + Add Profile
          </Button>
        </div>
      </div>
    </div>
  );
}
