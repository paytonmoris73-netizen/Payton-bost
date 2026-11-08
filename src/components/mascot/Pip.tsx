import { motion } from "framer-motion";

export type PipExpression =
  | "idle"
  | "happy"
  | "excited"
  | "curious"
  | "encouraging"
  | "sleeping"
  | "celebrating"
  | "running";

interface PipProps {
  expression?: PipExpression;
  size?: number;
  animate?: boolean;
  className?: string;
}

const MESSAGES: Record<PipExpression, string> = {
  idle:        "Ready for adventure?",
  happy:       "That was awesome!",
  excited:     "Let's go explore!",
  curious:     "I wonder what's over there...",
  encouraging: "You've got this!",
  sleeping:    "Zzz... resting up for more adventures.",
  celebrating: "AMAZING! You did it!",
  running:     "Keep moving — we're almost there!",
};

export function Pip({ expression = "idle", size = 160, animate = true, className = "" }: PipProps) {
  const scale = size / 220;

  const bodyMotion = animate
    ? { y: [0, -6, 0], transition: { duration: 2.8, repeat: Infinity, ease: "easeInOut" as const } }
    : {};

  return (
    <motion.div
      className={`inline-flex flex-col items-center ${className}`}
      animate={bodyMotion}
    >
      <svg
        width={220 * scale}
        height={240 * scale}
        viewBox="0 0 220 240"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <radialGradient id="bodyGrad" cx="50%" cy="40%" r="60%">
            <stop offset="0%" stopColor="#FFAA50" />
            <stop offset="100%" stopColor="#E8701A" />
          </radialGradient>
          <radialGradient id="chestGrad" cx="50%" cy="30%" r="70%">
            <stop offset="0%" stopColor="#FFFAF0" />
            <stop offset="100%" stopColor="#FFE8C8" />
          </radialGradient>
          <radialGradient id="eyeGrad" cx="35%" cy="35%" r="65%">
            <stop offset="0%" stopColor="#2D1B00" />
            <stop offset="100%" stopColor="#1A0A00" />
          </radialGradient>
          <radialGradient id="tailGrad" cx="50%" cy="20%" r="80%">
            <stop offset="0%" stopColor="#FFAA50" />
            <stop offset="100%" stopColor="#E8701A" />
          </radialGradient>
          <linearGradient id="hoodie" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#2A2560" />
            <stop offset="100%" stopColor="#1A1540" />
          </linearGradient>
          <linearGradient id="shoeGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#20C4B8" />
            <stop offset="100%" stopColor="#0E9988" />
          </linearGradient>
        </defs>

        {/* === TAIL === */}
        <ellipse cx="168" cy="168" rx="28" ry="18" fill="url(#tailGrad)" transform="rotate(-25 168 168)" />
        <ellipse cx="174" cy="162" rx="12" ry="8" fill="#FFF5E4" transform="rotate(-25 174 162)" />

        {/* === BODY === */}
        <ellipse cx="110" cy="160" rx="52" ry="58" fill="url(#bodyGrad)" />

        {/* === HOODIE === */}
        <path d="M62 148 Q62 215 110 220 Q158 215 158 148 Q140 138 110 136 Q80 138 62 148Z" fill="url(#hoodie)" />
        {/* Hoodie pocket */}
        <rect x="94" y="192" width="32" height="18" rx="6" fill="rgba(255,255,255,0.1)" />
        {/* Hoodie P logo */}
        <text x="104" y="176" fontFamily="Arial Black, sans-serif" fontSize="14" fontWeight="900" fill="#FF6B35">P</text>
        {/* Hoodie cuffs */}
        <ellipse cx="66" cy="178" rx="12" ry="8" fill="#2A2560" />
        <ellipse cx="154" cy="178" rx="12" ry="8" fill="#2A2560" />

        {/* === CHEST PATCH === */}
        <ellipse cx="110" cy="148" rx="22" ry="20" fill="url(#chestGrad)" />

        {/* === LEFT EAR === */}
        <polygon points="68,45 52,10 85,30" fill="url(#bodyGrad)" />
        <polygon points="68,45 57,20 80,32" fill="#FFB3B3" />

        {/* === RIGHT EAR === */}
        <polygon points="152,45 168,10 135,30" fill="url(#bodyGrad)" />
        <polygon points="152,45 163,20 140,32" fill="#FFB3B3" />

        {/* === HEAD === */}
        <ellipse cx="110" cy="82" rx="52" ry="48" fill="url(#bodyGrad)" />

        {/* === FACE MARKINGS === */}
        {/* White cheek patches */}
        <ellipse cx="84" cy="96" rx="14" ry="11" fill="#FFE0C8" opacity="0.7" />
        <ellipse cx="136" cy="96" rx="14" ry="11" fill="#FFE0C8" opacity="0.7" />

        {/* === EYES === */}
        {expression === "sleeping" ? (
          <>
            {/* Closed sleeping eyes */}
            <path d="M86 80 Q92 86 98 80" stroke="#1A0A00" strokeWidth="3" strokeLinecap="round" fill="none" />
            <path d="M122 80 Q128 86 134 80" stroke="#1A0A00" strokeWidth="3" strokeLinecap="round" fill="none" />
          </>
        ) : expression === "excited" || expression === "celebrating" ? (
          <>
            {/* Star eyes */}
            <circle cx="92" cy="80" r="13" fill="white" />
            <circle cx="128" cy="80" r="13" fill="white" />
            <text x="82" y="86" fontSize="16" fill="#FFD93D">★</text>
            <text x="118" y="86" fontSize="16" fill="#FFD93D">★</text>
          </>
        ) : (
          <>
            {/* Normal eyes — large expressive */}
            <circle cx="92" cy="80" r="13" fill="white" />
            <circle cx="128" cy="80" r="13" fill="white" />
            {/* Iris */}
            <circle cx="92" cy="81" r="9" fill="url(#eyeGrad)" />
            <circle cx="128" cy="81" r="9" fill="url(#eyeGrad)" />
            {/* Pupil highlight */}
            <circle cx="96" cy="78" r="3.5" fill="white" />
            <circle cx="132" cy="78" r="3.5" fill="white" />
            {/* Small highlight dot */}
            <circle cx="89" cy="84" r="1.5" fill="rgba(255,255,255,0.5)" />
            <circle cx="125" cy="84" r="1.5" fill="rgba(255,255,255,0.5)" />
          </>
        )}

        {/* === EYEBROWS (expression-based) === */}
        {expression === "curious" && (
          <>
            <path d="M82 66 Q92 62 100 66" stroke="#1A0A00" strokeWidth="2.5" strokeLinecap="round" fill="none" transform="rotate(-8 92 66)" />
            <path d="M120 62 Q128 66 136 64" stroke="#1A0A00" strokeWidth="2.5" strokeLinecap="round" fill="none" transform="rotate(8 128 64)" />
          </>
        )}
        {(expression === "happy" || expression === "idle") && (
          <>
            <path d="M83 67 Q92 63 101 67" stroke="#1A0A00" strokeWidth="2" strokeLinecap="round" fill="none" />
            <path d="M119 67 Q128 63 137 67" stroke="#1A0A00" strokeWidth="2" strokeLinecap="round" fill="none" />
          </>
        )}
        {expression === "encouraging" && (
          <>
            <path d="M83 65 Q92 61 101 65" stroke="#1A0A00" strokeWidth="2.5" strokeLinecap="round" fill="none" />
            <path d="M119 65 Q128 61 137 65" stroke="#1A0A00" strokeWidth="2.5" strokeLinecap="round" fill="none" />
          </>
        )}

        {/* === NOSE === */}
        <ellipse cx="110" cy="97" rx="6" ry="4" fill="#D45A00" />

        {/* === MOUTH === */}
        {expression === "sleeping" ? (
          <path d="M104 106 Q110 110 116 106" stroke="#D45A00" strokeWidth="2" strokeLinecap="round" fill="none" />
        ) : expression === "happy" || expression === "excited" || expression === "celebrating" || expression === "encouraging" ? (
          <>
            <path d="M100 104 Q110 116 120 104" stroke="#D45A00" strokeWidth="2.5" strokeLinecap="round" fill="none" />
            <ellipse cx="110" cy="110" rx="8" ry="5" fill="#FF7070" opacity="0.3" />
          </>
        ) : (
          <path d="M103 106 Q110 112 117 106" stroke="#D45A00" strokeWidth="2" strokeLinecap="round" fill="none" />
        )}

        {/* === WHISKERS === */}
        <line x1="58" y1="94" x2="88" y2="97" stroke="#D45A00" strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />
        <line x1="58" y1="100" x2="88" y2="100" stroke="#D45A00" strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />
        <line x1="132" y1="97" x2="162" y2="94" stroke="#D45A00" strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />
        <line x1="132" y1="100" x2="162" y2="100" stroke="#D45A00" strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />

        {/* === ARMS === */}
        {expression === "celebrating" ? (
          <>
            {/* Arms raised */}
            <path d="M62 148 Q40 120 48 100" stroke="url(#bodyGrad)" strokeWidth="20" strokeLinecap="round" fill="none" />
            <path d="M158 148 Q180 120 172 100" stroke="url(#bodyGrad)" strokeWidth="20" strokeLinecap="round" fill="none" />
            {/* Paws up */}
            <circle cx="48" cy="98" r="12" fill="url(#bodyGrad)" />
            <circle cx="172" cy="98" r="12" fill="url(#bodyGrad)" />
          </>
        ) : expression === "encouraging" ? (
          <>
            {/* One arm raised with thumb up */}
            <path d="M62 148 Q52 148 48 148" stroke="url(#bodyGrad)" strokeWidth="20" strokeLinecap="round" fill="none" />
            <path d="M158 155 Q175 140 178 125" stroke="url(#bodyGrad)" strokeWidth="20" strokeLinecap="round" fill="none" />
            {/* Thumb up paw */}
            <circle cx="178" cy="122" r="12" fill="url(#bodyGrad)" />
            <rect x="174" y="108" width="8" height="14" rx="4" fill="#FFD93D" />
          </>
        ) : (
          <>
            {/* Normal arms by side */}
            <path d="M62 148 Q52 155 50 165" stroke="url(#bodyGrad)" strokeWidth="20" strokeLinecap="round" fill="none" />
            <path d="M158 148 Q168 155 170 165" stroke="url(#bodyGrad)" strokeWidth="20" strokeLinecap="round" fill="none" />
            <circle cx="50" cy="168" r="11" fill="url(#bodyGrad)" />
            <circle cx="170" cy="168" r="11" fill="url(#bodyGrad)" />
          </>
        )}

        {/* === LEGS === */}
        <rect x="90" y="210" width="18" height="22" rx="8" fill="url(#bodyGrad)" />
        <rect x="112" y="210" width="18" height="22" rx="8" fill="url(#bodyGrad)" />

        {/* === SHOES === */}
        <rect x="85" y="226" width="26" height="12" rx="6" fill="url(#shoeGrad)" />
        <rect x="109" y="226" width="26" height="12" rx="6" fill="url(#shoeGrad)" />
        {/* Shoe stripe */}
        <rect x="90" y="230" width="16" height="3" rx="1.5" fill="rgba(255,255,255,0.4)" />
        <rect x="114" y="230" width="16" height="3" rx="1.5" fill="rgba(255,255,255,0.4)" />

        {/* === SLEEPING ZZZS === */}
        {expression === "sleeping" && (
          <>
            <text x="140" y="55" fontFamily="Fredoka One" fontSize="14" fill="#8B8FA8" opacity="0.8">z</text>
            <text x="152" y="42" fontFamily="Fredoka One" fontSize="18" fill="#8B8FA8" opacity="0.6">z</text>
            <text x="166" y="28" fontFamily="Fredoka One" fontSize="22" fill="#8B8FA8" opacity="0.4">Z</text>
          </>
        )}

        {/* === SPARKLES for celebrating === */}
        {expression === "celebrating" && (
          <>
            <text x="30" y="60" fontSize="16">✨</text>
            <text x="168" y="55" fontSize="16">✨</text>
            <text x="100" y="22" fontSize="12">⭐</text>
          </>
        )}
      </svg>
    </motion.div>
  );
}

export function PipMessage({ expression = "idle" }: { expression?: PipExpression }) {
  return (
    <div className="bg-pp-card border border-pp-border rounded-2xl px-4 py-2.5 max-w-xs">
      <p className="text-pp-cream text-sm font-semibold">{MESSAGES[expression]}</p>
    </div>
  );
}
