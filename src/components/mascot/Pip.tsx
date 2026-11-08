interface PipProps {
  expression?: "happy" | "excited" | "curious" | "encouraging" | "relaxed" | "celebrating";
  size?: number;
  className?: string;
  animate?: boolean;
}

export function Pip({ expression = "happy", size = 80, className = "", animate = false }: PipProps) {
  const cls = [className, animate ? "animate-bounce-soft" : ""].filter(Boolean).join(" ");

  const eyeExpressions = {
    happy: { left: "M28 42 Q30 40 32 42", right: "M48 42 Q50 40 52 42", brows: "" },
    excited: { left: "M27 41 Q30 38 33 41", right: "M47 41 Q50 38 53 41", brows: "M26 36 L33 33 M47 33 L54 36" },
    curious: { left: "M28 42 Q30 40 32 42", right: "M48 41 Q51 39 52 42", brows: "M47 35 Q50 33 53 36" },
    encouraging: { left: "M27 41 Q30 38 33 41", right: "M47 41 Q50 38 53 41", brows: "M26 35 L33 32 M47 32 L54 35" },
    relaxed: { left: "M28 43 Q30 43 32 43", right: "M48 43 Q50 43 52 43", brows: "" },
    celebrating: { left: "M27 40 Q30 37 33 40", right: "M47 40 Q50 37 53 40", brows: "M25 34 L33 31 M47 31 L55 34" },
  };

  const expr = eyeExpressions[expression];

  const mouthExpressions = {
    happy: "M34 54 Q40 60 46 54",
    excited: "M32 52 Q40 62 48 52",
    curious: "M36 55 Q40 58 44 55",
    encouraging: "M33 53 Q40 61 47 53",
    relaxed: "M36 56 Q40 58 44 56",
    celebrating: "M31 51 Q40 63 49 51",
  };

  const cheeks = expression === "celebrating" || expression === "excited" || expression === "encouraging";

  return (
    <svg
      viewBox="0 0 80 90"
      width={size}
      height={size}
      className={cls}
      style={{ display: "block" }}
      aria-label="PIP the fox mascot"
    >
      {/* Tail */}
      <ellipse cx="68" cy="78" rx="12" ry="8" fill="#FF8C42" transform="rotate(-20 68 78)" />
      <ellipse cx="69" cy="76" rx="6" ry="4" fill="#FFF5EC" transform="rotate(-20 69 76)" />

      {/* Body */}
      <ellipse cx="40" cy="72" rx="20" ry="16" fill="#FF8C42" />
      {/* Chest */}
      <ellipse cx="40" cy="74" rx="12" ry="10" fill="#FFF5EC" />

      {/* Shoes - left */}
      <ellipse cx="31" cy="85" rx="7" ry="4" fill="#263342" />
      <ellipse cx="29" cy="85" rx="4" ry="3" fill="#58B9A9" />
      {/* Shoes - right */}
      <ellipse cx="49" cy="85" rx="7" ry="4" fill="#263342" />
      <ellipse cx="51" cy="85" rx="4" ry="3" fill="#58B9A9" />

      {/* Arms */}
      <ellipse cx="22" cy="66" rx="6" ry="10" fill="#FF8C42" transform="rotate(-15 22 66)" />
      <ellipse cx="58" cy="66" rx="6" ry="10" fill="#FF8C42" transform="rotate(15 58 66)" />

      {/* Head */}
      <circle cx="40" cy="40" r="26" fill="#FF8C42" />

      {/* Ears */}
      <polygon points="18,20 12,4 28,14" fill="#FF8C42" />
      <polygon points="20,19 15,7 26,15" fill="#E06028" />
      <polygon points="62,20 68,4 52,14" fill="#FF8C42" />
      <polygon points="60,19 65,7 54,15" fill="#E06028" />

      {/* Face — cream patch */}
      <ellipse cx="40" cy="44" rx="16" ry="13" fill="#FFF5EC" />

      {/* Nose */}
      <ellipse cx="40" cy="49" rx="4" ry="3" fill="#E06028" />
      {/* Nostrils */}
      <circle cx="38.5" cy="49.5" r="1" fill="#C04010" />
      <circle cx="41.5" cy="49.5" r="1" fill="#C04010" />

      {/* Eyes background */}
      <circle cx="30" cy="41" r="5" fill="white" />
      <circle cx="50" cy="41" r="5" fill="white" />
      {/* Pupils */}
      <circle cx="30" cy="41" r="3" fill="#263342" />
      <circle cx="50" cy="41" r="3" fill="#263342" />
      {/* Eye shine */}
      <circle cx="31.5" cy="39.5" r="1" fill="white" />
      <circle cx="51.5" cy="39.5" r="1" fill="white" />

      {/* Eyebrow expressions */}
      {expr.brows && (
        <path d={expr.brows} stroke="#C04010" strokeWidth="2" strokeLinecap="round" fill="none" />
      )}

      {/* Mouth */}
      <path d={mouthExpressions[expression]} stroke="#C04010" strokeWidth="2.5" strokeLinecap="round" fill="none" />

      {/* Cheeks */}
      {cheeks && (
        <>
          <circle cx="23" cy="47" r="5" fill="#FF786B" opacity="0.4" />
          <circle cx="57" cy="47" r="5" fill="#FF786B" opacity="0.4" />
        </>
      )}

      {/* Whiskers */}
      <line x1="12" y1="47" x2="26" y2="49" stroke="#E06028" strokeWidth="1.2" opacity="0.6" />
      <line x1="12" y1="51" x2="26" y2="51" stroke="#E06028" strokeWidth="1.2" opacity="0.6" />
      <line x1="54" y1="49" x2="68" y2="47" stroke="#E06028" strokeWidth="1.2" opacity="0.6" />
      <line x1="54" y1="51" x2="68" y2="51" stroke="#E06028" strokeWidth="1.2" opacity="0.6" />
    </svg>
  );
}
