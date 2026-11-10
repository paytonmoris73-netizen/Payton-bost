import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useApp } from "../../contexts/AppContext";

const MISSIONS = [
  {
    id: "daily-move",
    title: "Daily Mover",
    description: "Complete any 1 activity today",
    icon: "🏃",
    type: "daily" as const,
    reward: { sparkPoints: 50, adventureEnergy: 10 },
    requirement: { type: "activity" as const, count: 1 },
  },
  {
    id: "triple-threat",
    title: "Triple Threat",
    description: "Complete 3 activities this week",
    icon: "⚡",
    type: "adventure" as const,
    reward: { sparkPoints: 150, adventureEnergy: 25 },
    requirement: { type: "activity" as const, count: 3 },
  },
  {
    id: "dance-master",
    title: "Dance Master",
    description: "Do 2 dance activities",
    icon: "💃",
    type: "adventure" as const,
    reward: { sparkPoints: 100, adventureEnergy: 20 },
    requirement: { type: "activity" as const, count: 2, category: "dance" },
  },
  {
    id: "plan-starter",
    title: "Plan Starter",
    description: "Start a workout plan",
    icon: "🗺️",
    type: "special" as const,
    reward: { sparkPoints: 200, adventureEnergy: 30 },
    requirement: { type: "plan" as const, count: 1 },
  },
  {
    id: "creature-collector",
    title: "Creature Collector",
    description: "Discover 3 creatures",
    icon: "🦋",
    type: "adventure" as const,
    reward: { sparkPoints: 300, adventureEnergy: 50 },
    requirement: { type: "creature" as const, count: 3 },
  },
  {
    id: "five-day",
    title: "5-Day Hero",
    description: "Complete activities 5 days in a row",
    icon: "🌟",
    type: "special" as const,
    reward: { sparkPoints: 500, adventureEnergy: 80 },
    requirement: { type: "activity" as const, count: 5 },
  },
];

const TYPE_COLORS = {
  daily: { bg: "bg-pp-orange/10", border: "border-pp-orange/30", text: "text-pp-orange", label: "DAILY" },
  adventure: { bg: "bg-pp-blue/10", border: "border-pp-blue/30", text: "text-pp-blue", label: "ADVENTURE" },
  special: { bg: "bg-pp-gold/10", border: "border-pp-gold/30", text: "text-pp-gold", label: "SPECIAL" },
};

export function MissionsPage() {
  const navigate = useNavigate();
  const { state, activeProfile, profileSessions, profileCreatures, isMissionCompleted } = useApp();

  if (!activeProfile) return null;
  const sessions = profileSessions(activeProfile.id);
  const creatures = profileCreatures(activeProfile.id);

  function getProgress(mission: typeof MISSIONS[0]) {
    if (isMissionCompleted(mission.id)) return { current: mission.requirement.count, total: mission.requirement.count };
    const req = mission.requirement;
    if (req.type === "activity") {
      const count = sessions.length;
      return { current: Math.min(count, req.count), total: req.count };
    }
    if (req.type === "creature") {
      return { current: Math.min(creatures.length, req.count), total: req.count };
    }
    if (req.type === "plan") {
      return { current: state.activePlanId ? 1 : 0, total: 1 };
    }
    return { current: 0, total: (req as { count: number }).count };
  }

  const dailyMissions = MISSIONS.filter(m => m.type === "daily");
  const adventureMissions = MISSIONS.filter(m => m.type === "adventure");
  const specialMissions = MISSIONS.filter(m => m.type === "special");

  function MissionCard({ mission }: { mission: typeof MISSIONS[0] }) {
    const { current, total } = getProgress(mission);
    const done = current >= total;
    const pct = Math.min(100, (current / total) * 100);
    const style = TYPE_COLORS[mission.type];

    return (
      <motion.div
        className={`rounded-2xl border p-4 ${done ? "opacity-70" : ""} ${style.bg} ${style.border}`}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-start gap-3">
          <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-2xl ${style.bg} border ${style.border} shrink-0`}>
            {done ? "✅" : mission.icon}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-0.5">
              <h3 className="text-white font-bold text-sm">{mission.title}</h3>
              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${style.bg} ${style.text}`}>
                {style.label}
              </span>
            </div>
            <p className="text-pp-border text-xs">{mission.description}</p>
            <div className="flex items-center gap-2 mt-2">
              <div className="flex-1 h-1.5 bg-pp-border/30 rounded-full overflow-hidden">
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: done ? "#22C55E" : "#FF6B35" }}
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 0.6 }}
                />
              </div>
              <span className={`text-xs font-bold ${done ? "text-green-400" : "text-pp-border"}`}>
                {current}/{total}
              </span>
            </div>
          </div>
          <div className="text-right shrink-0">
            <div className="text-pp-gold text-xs font-bold">+{mission.reward.sparkPoints}</div>
            <div className="text-pp-border text-[9px]">pts</div>
            <div className="text-pp-orange text-xs font-bold mt-0.5">+{mission.reward.adventureEnergy}</div>
            <div className="text-pp-border text-[9px]">energy</div>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      className="min-h-screen bg-pp-navy pb-24 px-4 pt-4"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }}
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-full bg-pp-card flex items-center justify-center">
          <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div>
          <h1 className="text-2xl font-bold text-white font-fredoka">Missions</h1>
          <p className="text-pp-border text-sm">Complete challenges, earn rewards!</p>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-2 mb-6">
        {[
          { label: "Activities", value: sessions.length, icon: "🏃" },
          { label: "Creatures", value: creatures.length, icon: "🦋" },
          { label: "Points", value: activeProfile.points, icon: "⭐" },
        ].map(stat => (
          <div key={stat.label} className="bg-pp-card rounded-xl p-3 text-center">
            <div className="text-xl mb-0.5">{stat.icon}</div>
            <div className="text-white font-bold text-lg">{stat.value}</div>
            <div className="text-pp-border text-xs">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Daily */}
      <h2 className="text-white font-bold font-fredoka mb-2">Today's Missions</h2>
      <div className="space-y-2 mb-6">
        {dailyMissions.map(m => <MissionCard key={m.id} mission={m} />)}
      </div>

      {/* Adventure */}
      <h2 className="text-white font-bold font-fredoka mb-2">Adventure Missions</h2>
      <div className="space-y-2 mb-6">
        {adventureMissions.map(m => <MissionCard key={m.id} mission={m} />)}
      </div>

      {/* Special */}
      <h2 className="text-white font-bold font-fredoka mb-2">⭐ Special Challenges</h2>
      <div className="space-y-2">
        {specialMissions.map(m => <MissionCard key={m.id} mission={m} />)}
      </div>
    </motion.div>
  );
}
