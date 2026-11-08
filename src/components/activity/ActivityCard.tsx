import { useNavigate } from "react-router-dom";
import type { Activity } from "../../lib/types";

interface ActivityCardProps {
  activity: Activity;
  compact?: boolean;
}

export function ActivityCard({ activity, compact = false }: ActivityCardProps) {
  const navigate = useNavigate();

  if (compact) {
    return (
      <button
        onClick={() => navigate(`/app/activity/${activity.id}`)}
        className="flex items-center gap-3 p-3 bg-white dark:bg-gray-800 rounded-2xl shadow-card hover:shadow-card-hover transition-all active:scale-95 w-full text-left"
      >
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
          style={{ backgroundColor: activity.color }}
        >
          {activity.emoji}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-bold text-navy dark:text-white text-sm truncate">{activity.name}</div>
          <div className="text-xs text-gray-400 mt-0.5">{activity.durationMin} min · {activity.space}</div>
        </div>
        <div className="text-gray-300 dark:text-gray-600">›</div>
      </button>
    );
  }

  return (
    <button
      onClick={() => navigate(`/app/activity/${activity.id}`)}
      className="rounded-3xl overflow-hidden shadow-card hover:shadow-card-hover transition-all active:scale-95 text-left w-full group"
    >
      {/* Card header */}
      <div
        className="h-28 flex items-center justify-center relative overflow-hidden"
        style={{ backgroundColor: activity.color }}
      >
        <span className="text-5xl group-hover:scale-110 transition-transform">{activity.emoji}</span>
        <div className="absolute top-2 right-2 bg-white/30 backdrop-blur-sm rounded-full px-2 py-0.5 text-xs font-bold text-navy/80">
          {activity.durationMin} min
        </div>
        {activity.space === "outdoor" && (
          <div className="absolute top-2 left-2 bg-white/30 backdrop-blur-sm rounded-full px-2 py-0.5 text-xs font-bold text-navy/80">
            🌿 Outdoor
          </div>
        )}
      </div>
      {/* Card body */}
      <div className="bg-white dark:bg-gray-800 p-4">
        <div className="font-black text-navy dark:text-white text-sm leading-tight mb-1">{activity.name}</div>
        <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed line-clamp-2">{activity.description}</p>
        <div className="mt-3 flex items-center justify-between">
          <div className="flex flex-wrap gap-1">
            {activity.tags.slice(0, 2).map(tag => (
              <span key={tag} className="text-xs bg-soft-gray dark:bg-gray-700 text-gray-500 dark:text-gray-400 px-2 py-0.5 rounded-full">
                {tag}
              </span>
            ))}
          </div>
          <span className="text-coral text-xs font-bold">Let's Go →</span>
        </div>
      </div>
    </button>
  );
}
