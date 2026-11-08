import { useParams, useNavigate } from "react-router-dom";
import { Button } from "../../components/ui/Button";
import { getActivityById } from "../../data/activities";

export function ActivityDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const activity = getActivityById(id ?? "");

  if (!activity) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6">
        <div className="text-5xl mb-3">😕</div>
        <div className="font-bold text-navy dark:text-white mb-2">Activity not found</div>
        <Button onClick={() => navigate("/app/explore")} variant="secondary">Back to Explore</Button>
      </div>
    );
  }

  return (
    <div className="pb-24 lg:pb-8 animate-fade-in">
      {/* Hero */}
      <div
        className="relative h-56 flex items-center justify-center"
        style={{ backgroundColor: activity.color }}
      >
        <button
          onClick={() => navigate(-1)}
          className="absolute top-5 left-5 w-10 h-10 bg-white/30 backdrop-blur-sm rounded-full flex items-center justify-center text-white font-bold hover:bg-white/40 transition-colors"
        >
          ‹
        </button>
        <span className="text-8xl">{activity.emoji}</span>
        <div className="absolute bottom-4 right-4 flex gap-2">
          <span className="bg-white/30 backdrop-blur-sm text-navy/80 text-xs font-bold px-3 py-1 rounded-full">
            {activity.durationMin} min
          </span>
          <span className="bg-white/30 backdrop-blur-sm text-navy/80 text-xs font-bold px-3 py-1 rounded-full capitalize">
            {activity.space === "both" ? "🏠🌿" : activity.space === "indoor" ? "🏠 Indoor" : "🌿 Outdoor"}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="px-5 py-5 space-y-5">
        <div>
          <div className="text-xs text-coral font-bold uppercase tracking-wider mb-1">{activity.category.replace("-", " ")}</div>
          <h1 className="font-black text-2xl text-navy dark:text-white leading-tight">{activity.name}</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2 leading-relaxed">{activity.description}</p>
        </div>

        {/* Meta */}
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: "Duration", value: `${activity.durationMin} minutes` },
            { label: "Space", value: activity.space === "both" ? "Indoor or outdoor" : activity.space },
            { label: "Equipment", value: activity.equipment.length ? activity.equipment.join(", ") : "None needed" },
            { label: "Points earned", value: `~${activity.durationMin * 5} Play Points` },
          ].map(({ label, value }) => (
            <div key={label} className="bg-soft-gray dark:bg-gray-800 rounded-2xl p-3">
              <div className="text-xs text-gray-400 mb-0.5">{label}</div>
              <div className="font-bold text-navy dark:text-white text-sm">{value}</div>
            </div>
          ))}
        </div>

        {/* Steps preview */}
        <div>
          <h3 className="font-black text-navy dark:text-white mb-3">What you'll do</h3>
          <div className="space-y-2">
            {activity.steps.slice(0, 3).map((step, i) => (
              <div key={step.id} className="flex items-start gap-3 p-3 bg-white dark:bg-gray-800 rounded-2xl">
                <div className="w-6 h-6 rounded-full bg-coral text-white text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                  {i + 1}
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-300">{step.instruction}</p>
              </div>
            ))}
            {activity.steps.length > 3 && (
              <div className="text-center text-xs text-gray-400 py-1">
                + {activity.steps.length - 3} more steps inside
              </div>
            )}
          </div>
        </div>

        {/* Safety note */}
        {activity.safetyNote && (
          <div className="bg-mint dark:bg-teal/10 rounded-2xl p-4">
            <div className="text-xs font-bold text-teal-dark dark:text-teal mb-1">🛡️ Safety Reminder</div>
            <p className="text-xs text-gray-600 dark:text-gray-400">{activity.safetyNote}</p>
          </div>
        )}

        {/* Modifications */}
        {activity.modifications && (
          <div className="bg-lavender/20 dark:bg-lavender/10 rounded-2xl p-4">
            <div className="text-xs font-bold text-lavender-dark dark:text-lavender mb-1">♿ Modifications</div>
            <p className="text-xs text-gray-600 dark:text-gray-400">{activity.modifications}</p>
          </div>
        )}

        {/* CTA */}
        <Button
          fullWidth
          size="lg"
          onClick={() => navigate(`/app/activity/${activity.id}/play`)}
          className="font-black"
        >
          Let's Go! 🚀
        </Button>
      </div>
    </div>
  );
}
