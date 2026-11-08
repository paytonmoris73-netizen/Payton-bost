import { useParams, useNavigate } from "react-router-dom";
import { getLocationById } from "../../data/adventures";
import { getActivityById } from "../../data/activities";
import { ActivityCard } from "../../components/activity/ActivityCard";
import { Button } from "../../components/ui/Button";

export function AdventureWorldPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = getLocationById(id ?? "");

  if (!location) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6">
        <div className="text-5xl mb-3">🗺️</div>
        <div className="font-bold text-navy dark:text-white mb-2">World not found</div>
        <Button onClick={() => navigate("/app/adventures")} variant="secondary">Back to Adventures</Button>
      </div>
    );
  }

  const activities = location.activityIds.map(id => getActivityById(id)).filter(Boolean);

  return (
    <div className="pb-24 lg:pb-8 animate-fade-in">
      {/* Hero */}
      <div
        className="relative h-56 flex flex-col items-center justify-center overflow-hidden"
        style={{ backgroundColor: location.color }}
      >
        <button
          onClick={() => navigate(-1)}
          className="absolute top-5 left-5 w-10 h-10 bg-white/30 rounded-full flex items-center justify-center text-white font-bold"
        >
          ‹
        </button>
        <div className="text-7xl mb-2">{location.emoji}</div>
        <div className="text-white font-black text-xl">{location.name}</div>
        <div className="text-white/70 text-xs">{location.theme}</div>
      </div>

      <div className="px-5 py-5 space-y-5">
        {/* Description */}
        <div className="bg-white dark:bg-gray-800 rounded-3xl p-5 shadow-card">
          <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">{location.description}</p>
          <div className="mt-3 flex gap-3 text-xs text-gray-500">
            <span>📍 {activities.length} activities</span>
            {location.rewardId && <span>🎁 Completion reward available</span>}
          </div>
        </div>

        {/* Activities */}
        <div>
          <h3 className="font-black text-navy dark:text-white mb-3">Activities in this world</h3>
          <div className="grid grid-cols-2 gap-3">
            {activities.map(activity => activity && (
              <ActivityCard key={activity.id} activity={activity} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
