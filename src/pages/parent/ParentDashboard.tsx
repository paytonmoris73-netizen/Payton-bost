import { useNavigate } from "react-router-dom";
import { useApp } from "../../contexts/AppContext";
import { ACTIVITIES } from "../../data/activities";
import { Button } from "../../components/ui/Button";

export function ParentDashboardPage() {
  const navigate = useNavigate();
  const { state, profileSessions, logout } = useApp();

  if (!state.parent) {
    navigate("/");
    return null;
  }

  return (
    <div className="min-h-screen bg-soft-gray dark:bg-gray-950 pb-10">
      {/* Header */}
      <div className="bg-white dark:bg-gray-900 px-6 py-5 border-b border-soft-gray dark:border-gray-700">
        <div className="flex items-center justify-between max-w-2xl mx-auto">
          <div>
            <div className="font-black text-xl text-navy dark:text-white">Parent Dashboard</div>
            <div className="text-sm text-gray-400">Hi, {state.parent.displayName}!</div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => navigate("/profiles")}
              className="px-3 py-1.5 bg-coral text-white rounded-xl text-xs font-bold"
            >
              Kids' App
            </button>
            <button
              onClick={() => { logout(); navigate("/"); }}
              className="px-3 py-1.5 bg-soft-gray dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded-xl text-xs font-bold"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-6 space-y-6">
        {/* Family overview */}
        <div>
          <div className="font-black text-navy dark:text-white mb-3">Family Profiles ({state.profiles.length})</div>
          {state.profiles.length === 0 ? (
            <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 text-center shadow-card">
              <div className="text-4xl mb-2">👶</div>
              <div className="font-bold text-navy dark:text-white mb-2">No profiles yet</div>
              <Button size="sm" onClick={() => navigate("/profiles/create")}>Add Child Profile</Button>
            </div>
          ) : (
            <div className="space-y-3">
              {state.profiles.map(profile => {
                const sessions = profileSessions(profile.id);
                const thisWeek = sessions.filter(s => {
                  const diff = (Date.now() - new Date(s.completedAt).getTime()) / (1000 * 60 * 60 * 24);
                  return diff < 7;
                });
                const categories = new Set(sessions.map(s => ACTIVITIES.find(a => a.id === s.activityId)?.category ?? "").filter(Boolean));

                return (
                  <div key={profile.id} className="bg-white dark:bg-gray-900 rounded-3xl p-5 shadow-card">
                    <div className="flex items-center gap-4 mb-4">
                      <div
                        className="w-14 h-14 rounded-full flex items-center justify-center text-3xl"
                        style={{ backgroundColor: profile.avatarConfig.background }}
                      >
                        {profile.avatarConfig.outfit}
                      </div>
                      <div>
                        <div className="font-black text-navy dark:text-white">{profile.nickname}</div>
                        <div className="text-xs text-gray-400">Age {profile.ageRange} · {sessions.length} activities completed</div>
                        <div className="text-xs text-coral font-semibold">⭐ {profile.points} Play Points</div>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3 text-center mb-3">
                      <div className="bg-soft-gray dark:bg-gray-800 rounded-xl p-2">
                        <div className="font-black text-navy dark:text-white">{thisWeek.length}</div>
                        <div className="text-xs text-gray-400">This week</div>
                      </div>
                      <div className="bg-soft-gray dark:bg-gray-800 rounded-xl p-2">
                        <div className="font-black text-navy dark:text-white">{categories.size}</div>
                        <div className="text-xs text-gray-400">Categories</div>
                      </div>
                      <div className="bg-soft-gray dark:bg-gray-800 rounded-xl p-2">
                        <div className="font-black text-navy dark:text-white">{sessions.length}</div>
                        <div className="text-xs text-gray-400">Total</div>
                      </div>
                    </div>

                    {sessions.length > 0 && (
                      <div className="text-xs text-gray-500">
                        Last activity: {new Date(sessions[sessions.length - 1].completedAt).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Parent settings links */}
        <div>
          <div className="font-black text-navy dark:text-white mb-3">Settings & Management</div>
          <div className="bg-white dark:bg-gray-900 rounded-3xl overflow-hidden shadow-card divide-y divide-soft-gray dark:divide-gray-700">
            {[
              { label: "Family Settings", emoji: "👨‍👩‍👧", to: "/parent/family-settings" },
              { label: "Privacy Settings", emoji: "🔒", to: "/parent/privacy" },
              { label: "Notification Settings", emoji: "🔔", to: "/parent/notifications" },
              { label: "Subscription", emoji: "⭐", to: "/parent/subscription" },
              { label: "Account Settings", emoji: "⚙️", to: "/parent/account" },
              { label: "Safety Information", emoji: "🛡️", to: "/parent/safety" },
            ].map(({ label, emoji, to }) => (
              <button
                key={to}
                onClick={() => navigate(to)}
                className="w-full flex items-center justify-between px-5 py-4 hover:bg-soft-gray dark:hover:bg-gray-800 transition-colors text-left"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">{emoji}</span>
                  <span className="font-semibold text-navy dark:text-white text-sm">{label}</span>
                </div>
                <span className="text-gray-400">›</span>
              </button>
            ))}
          </div>
        </div>

        {/* Add profile */}
        <Button variant="secondary" fullWidth onClick={() => navigate("/profiles/create")}>
          + Add Child Profile
        </Button>
      </div>
    </div>
  );
}
