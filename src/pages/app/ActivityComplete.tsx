import { useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
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
    <motion.div
      className="min-h-screen bg-pp-navy relative overflow-hidden flex flex-col items-center justify-center px-6 text-center pb-10"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }}
    >
      <div className="absolute inset-0 stars-bg pointer-events-none" />

      {/* Confetti burst (pure CSS) */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {[...Array(18)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 rounded-full"
            style={{
              left: `${10 + (i * 5) % 85}%`,
              top: "-8px",
              background: ["#FF6B35","#FFD93D","#22C55E","#3B82F6","#EC4899","#7C3AED"][i % 6],
            }}
            animate={{
              y: ["0vh", `${60 + (i * 7) % 40}vh`],
              rotate: [0, 360 + i * 20],
              opacity: [1, 0],
            }}
            transition={{
              duration: 1.6 + (i % 4) * 0.3,
              delay: i * 0.08,
              ease: "easeOut",
            }}
          />
        ))}
      </div>

      <div className="relative z-10 w-full max-w-sm flex flex-col items-center">
        {/* PIP celebrating */}
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", damping: 15, delay: 0.1 }}
          className="mb-4"
        >
          <Pip expression="celebrating" size={140} animate />
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="font-display text-pp-gold text-4xl mb-1"
        >
          Amazing!
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-pp-muted text-sm mb-6"
        >
          You completed <span className="text-pp-cream font-bold">{activityName}</span>!
        </motion.p>

        {/* Points card */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", damping: 15, delay: 0.5 }}
          className="w-full rounded-3xl p-6 mb-4 text-center"
          style={{ background: "linear-gradient(135deg, #FFD93D, #FF6B35)" }}
        >
          <div className="font-display text-pp-navy text-5xl">+{pointsEarned}</div>
          <div className="text-pp-navy font-black text-sm mt-1">Spark Points Earned! ⚡</div>
        </motion.div>

        {/* New achievements */}
        {newAchievements.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="w-full mb-4"
          >
            <div className="text-xs font-bold text-pp-gold mb-2 tracking-wider uppercase">🏆 New Achievements!</div>
            {newAchievements.map((achId, i) => {
              const ach = ACHIEVEMENTS.find(a => a.id === achId);
              if (!ach) return null;
              return (
                <motion.div
                  key={achId}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.8 + i * 0.1 }}
                  className="bg-pp-card border border-pp-gold/30 rounded-2xl p-3 flex items-center gap-3 mb-2"
                >
                  <div className="w-10 h-10 rounded-full bg-pp-gold/20 flex items-center justify-center text-2xl flex-shrink-0">
                    {ach.emoji}
                  </div>
                  <div className="text-left">
                    <div className="font-black text-pp-cream text-sm">{ach.name}</div>
                    <div className="text-xs text-pp-muted">{ach.description}</div>
                  </div>
                  <span className="text-pp-gold ml-auto">★</span>
                </motion.div>
              );
            })}
          </motion.div>
        )}

        {/* PIP message */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9 }}
          className="bg-pp-card border border-pp-orange/30 rounded-2xl px-5 py-4 mb-6 w-full"
        >
          <p className="text-sm font-bold text-pp-orange">
            {newAchievements.length > 0
              ? "You unlocked new achievements! You're legendary!"
              : pointsEarned >= 50
              ? "That was incredible! You're a movement superstar!"
              : "Every activity makes you stronger and happier! Keep it up!"}
          </p>
        </motion.div>

        {/* Action buttons */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.0 }}
          className="w-full space-y-3"
        >
          <button
            onClick={() => navigate("/app/explore")}
            className="w-full py-4 rounded-2xl font-black text-white text-base shadow-glow-orange hover:brightness-110 transition-all"
            style={{ background: "linear-gradient(135deg, #FF6B35, #FF4500)" }}
          >
            Try Another Activity 🔍
          </button>
          <button
            onClick={() => navigate("/app/home")}
            className="w-full py-3.5 rounded-2xl font-bold text-pp-muted bg-pp-card border border-pp-border hover:text-pp-cream transition-colors"
          >
            Back to Home
          </button>
          <button
            onClick={() => navigate("/app/rewards")}
            className="text-pp-orange font-bold text-sm"
          >
            Spend your points in the shop →
          </button>
        </motion.div>
      </div>
    </motion.div>
  );
}
