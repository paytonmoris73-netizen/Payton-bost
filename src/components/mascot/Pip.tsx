import { motion, type TargetAndTransition } from "framer-motion";

export type PipExpression =
  | "idle" | "happy" | "excited" | "curious"
  | "encouraging" | "sleeping" | "celebrating" | "running";

interface PipProps {
  expression?: PipExpression;
  size?: number;
  className?: string;
  showMessage?: boolean;
  animate?: boolean;
}

const MESSAGES: Record<PipExpression, string> = {
  idle: "Ready for adventure! 🗺️",
  happy: "That was amazing! 🎉",
  excited: "Let's go, let's go! ⚡",
  curious: "Ooh, what's over there? 🔍",
  encouraging: "You can do it! 💪",
  sleeping: "Zzzz... sweet dreams 😴",
  celebrating: "WAHOO! You did it! 🎊",
  running: "Adventure awaits! 🏃",
};

const bodyVariants: Record<PipExpression, TargetAndTransition> = {
  idle: { y: [0, -6, 0], transition: { duration: 2.5, repeat: Infinity, ease: "easeInOut" } },
  happy: { y: [0, -10, 0, -6, 0], transition: { duration: 0.8, repeat: Infinity, ease: "easeInOut" } },
  excited: { rotate: [-5, 5, -5], y: [0, -8, 0], transition: { duration: 0.5, repeat: Infinity } },
  curious: { rotate: [0, -8, 0], transition: { duration: 1.5, repeat: Infinity, ease: "easeInOut" } },
  encouraging: { y: [0, -4, 0], transition: { duration: 1.2, repeat: Infinity, ease: "easeInOut" } },
  sleeping: { y: [0, -2, 0], transition: { duration: 3, repeat: Infinity, ease: "easeInOut" } },
  celebrating: { y: [0, -15, 0], rotate: [-10, 10, -10], transition: { duration: 0.7, repeat: Infinity } },
  running: { x: [0, 3, 0, -3, 0], y: [0, -4, 0], transition: { duration: 0.4, repeat: Infinity } },
};

export function Pip({ expression = "idle", size = 80, className = "", showMessage = false }: PipProps) {
  const scale = size / 100;

  const eyeExpression = () => {
    switch (expression) {
      case "sleeping": return <><ellipse cx="37" cy="47" rx="5" ry="2" fill="#3D2E1A" /><ellipse cx="63" cy="47" rx="5" ry="2" fill="#3D2E1A" /></>;
      case "happy": return <><path d="M32 44 Q37 51 42 44" fill="none" stroke="#3D2E1A" strokeWidth="2" strokeLinecap="round" /><path d="M58 44 Q63 51 68 44" fill="none" stroke="#3D2E1A" strokeWidth="2" strokeLinecap="round" /></>;
      case "excited": return <><circle cx="37" cy="47" r="6" fill="#3D2E1A" /><circle cx="63" cy="47" r="6" fill="#3D2E1A" /><circle cx="40" cy="44" r="2" fill="white" /><circle cx="66" cy="44" r="2" fill="white" /></>;
      case "celebrating": return <><path d="M32 44 Q37 50 42 44" fill="none" stroke="#3D2E1A" strokeWidth="2.5" strokeLinecap="round" /><path d="M58 44 Q63 50 68 44" fill="none" stroke="#3D2E1A" strokeWidth="2.5" strokeLinecap="round" /></>;
      default:
        return (
          <>
            <circle cx="37" cy="47" r="5.5" fill="#3D2E1A" />
            <circle cx="63" cy="47" r="5.5" fill="#3D2E1A" />
            <circle cx="39.5" cy="44.5" r="1.8" fill="white" />
            <circle cx="65.5" cy="44.5" r="1.8" fill="white" />
          </>
        );
    }
  };

  return (
    <div className={`flex flex-col items-center gap-1 ${className}`}>
      {showMessage && (
        <motion.div
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 rounded-2xl px-3 py-1.5 text-xs font-bold text-adventure-navy dark:text-white shadow-card max-w-40 text-center"
        >
          {MESSAGES[expression]}
        </motion.div>
      )}
      <motion.div animate={bodyVariants[expression]} style={{ width: size, height: size }}>
        <svg
          viewBox="0 0 100 120"
          width={size}
          height={size * 1.2}
          style={{ transform: `scale(${scale})`, transformOrigin: "center" }}
        >
          {/* Tail */}
          <ellipse cx="85" cy="90" rx="16" ry="10" fill="#FF8C42" transform="rotate(-30 85 90)" />
          <ellipse cx="90" cy="85" rx="8" ry="5" fill="#FFF5E4" transform="rotate(-30 90 85)" />

          {/* Body */}
          <ellipse cx="50" cy="80" rx="30" ry="25" fill="#FF8C42" />
          {/* Chest */}
          <ellipse cx="50" cy="82" rx="18" ry="16" fill="#FFF5E4" />

          {/* Arms */}
          <ellipse cx="22" cy="78" rx="8" ry="12" fill="#FF8C42" transform="rotate(-15 22 78)" />
          <ellipse cx="78" cy="78" rx="8" ry="12" fill="#FF8C42" transform="rotate(15 78 78)" />
          {/* Paws */}
          <ellipse cx="17" cy="88" rx="6" ry="4" fill="#FF8C42" />
          <ellipse cx="83" cy="88" rx="6" ry="4" fill="#FF8C42" />

          {/* Legs */}
          <ellipse cx="38" cy="102" rx="8" ry="6" fill="#FF8C42" />
          <ellipse cx="62" cy="102" rx="8" ry="6" fill="#FF8C42" />

          {/* Shoes — teal */}
          <ellipse cx="37" cy="108" rx="10" ry="5" fill="#58B9A9" />
          <ellipse cx="63" cy="108" rx="10" ry="5" fill="#58B9A9" />
          <ellipse cx="37" cy="107" rx="8" ry="3" fill="#6ECFC0" />
          <ellipse cx="63" cy="107" rx="8" ry="3" fill="#6ECFC0" />

          {/* Head */}
          <circle cx="50" cy="45" r="30" fill="#FF8C42" />

          {/* Ears */}
          <polygon points="22,20 10,0 35,15" fill="#FF8C42" />
          <polygon points="78,20 90,0 65,15" fill="#FF8C42" />
          {/* Inner ears */}
          <polygon points="23,18 14,5 33,14" fill="#FFB3B3" />
          <polygon points="77,18 86,5 67,14" fill="#FFB3B3" />

          {/* Snout */}
          <ellipse cx="50" cy="55" rx="13" ry="10" fill="#FFF5E4" />

          {/* Eyes */}
          {eyeExpression()}

          {/* Nose */}
          <ellipse cx="50" cy="52" rx="3.5" ry="2.5" fill="#3D2E1A" />

          {/* Mouth */}
          {expression === "sleeping" ? (
            <path d="M44 59 Q50 62 56 59" fill="none" stroke="#3D2E1A" strokeWidth="1.5" strokeLinecap="round" />
          ) : (
            <path d="M44 59 Q50 64 56 59" fill="none" stroke="#3D2E1A" strokeWidth="1.5" strokeLinecap="round" />
          )}

          {/* Cheek blush */}
          <ellipse cx="28" cy="54" rx="6" ry="4" fill="#FF9E95" opacity="0.4" />
          <ellipse cx="72" cy="54" rx="6" ry="4" fill="#FF9E95" opacity="0.4" />

          {/* Celebrating: sparkles */}
          {expression === "celebrating" && (
            <>
              <text x="5" y="30" fontSize="12">✨</text>
              <text x="80" y="25" fontSize="10">⭐</text>
              <text x="85" y="50" fontSize="8">🎉</text>
            </>
          )}

          {/* Sleeping Zzz */}
          {expression === "sleeping" && (
            <>
              <text x="72" y="25" fontSize="10" fill="#9B5DE5" fontWeight="bold">z</text>
              <text x="80" y="17" fontSize="13" fill="#9B5DE5" fontWeight="bold">z</text>
              <text x="90" y="8" fontSize="16" fill="#9B5DE5" fontWeight="bold">Z</text>
            </>
          )}
        </svg>
      </motion.div>
    </div>
  );
}
