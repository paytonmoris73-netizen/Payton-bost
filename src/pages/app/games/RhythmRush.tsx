import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Pip } from "../../../components/mascot/Pip";

type Color = "red" | "blue" | "green" | "yellow";

const COLORS: { id: Color; bg: string; active: string; label: string }[] = [
  { id: "red", bg: "#FF6B6B", active: "#FF3333", label: "🔴" },
  { id: "blue", bg: "#4FC3F7", active: "#0288D1", label: "🔵" },
  { id: "green", bg: "#6BCB77", active: "#388E3C", label: "🟢" },
  { id: "yellow", bg: "#FFD93D", active: "#F9A825", label: "🟡" },
];

type Phase = "intro" | "showing" | "input" | "correct" | "wrong" | "gameover" | "win";

export function RhythmRushPage() {
  const navigate = useNavigate();
  const [phase, setPhase] = useState<Phase>("intro");
  const [sequence, setSequence] = useState<Color[]>([]);
  const [playerInput, setPlayerInput] = useState<Color[]>([]);
  const [activeColor, setActiveColor] = useState<Color | null>(null);
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [feedback, setFeedback] = useState("");
  const [highScore, setHighScore] = useState(() => {
    try { return parseInt(localStorage.getItem("rr_highscore") ?? "0"); } catch { return 0; }
  });

  const generateSequence = useCallback((len: number): Color[] => {
    const cols: Color[] = ["red", "blue", "green", "yellow"];
    return Array.from({ length: len }, () => cols[Math.floor(Math.random() * 4)]);
  }, []);

  const showSequence = useCallback(async (seq: Color[]) => {
    setPhase("showing");
    setPlayerInput([]);
    for (let i = 0; i < seq.length; i++) {
      await new Promise(r => setTimeout(r, i === 0 ? 600 : 200));
      setActiveColor(seq[i]);
      await new Promise(r => setTimeout(r, 600));
      setActiveColor(null);
    }
    setPhase("input");
  }, []);

  function startGame() {
    const seq = generateSequence(3);
    setSequence(seq);
    setScore(0);
    setLevel(1);
    setPlayerInput([]);
    showSequence(seq);
  }

  function handleColorPress(color: Color) {
    if (phase !== "input") return;
    setActiveColor(color);
    setTimeout(() => setActiveColor(null), 150);

    const newInput = [...playerInput, color];
    setPlayerInput(newInput);
    const idx = newInput.length - 1;

    if (color !== sequence[idx]) {
      setFeedback("Not quite! Try again!");
      setPhase("wrong");
      const newHigh = Math.max(highScore, score);
      setHighScore(newHigh);
      try { localStorage.setItem("rr_highscore", String(newHigh)); } catch {}
      setTimeout(() => setPhase("gameover"), 1200);
      return;
    }

    if (newInput.length === sequence.length) {
      const pts = level * 10;
      setScore(s => s + pts);
      setFeedback(level < 3 ? "Great! 🎉" : level < 6 ? "Amazing! ⚡" : "PERFECT! 🌟");
      setPhase("correct");
      setTimeout(() => {
        const nextLevel = level + 1;
        if (nextLevel > 8) { setPhase("win"); return; }
        setLevel(nextLevel);
        const newSeq = generateSequence(2 + nextLevel);
        setSequence(newSeq);
        showSequence(newSeq);
      }, 1200);
    }
  }

  return (
    <div className="min-h-screen bg-pp-navy pb-24 lg:pb-8 flex flex-col">
      {/* Header */}
      <div className="flex items-center px-5 pt-5 pb-3 gap-3 bg-pp-surface border-b border-pp-border">
        <button onClick={() => navigate("/app/mini-games")} className="text-pp-muted text-2xl hover:text-pp-cream transition-colors">‹</button>
        <div className="flex-1">
          <h1 className="font-display text-xl text-pp-cream">Rhythm Rush</h1>
          <p className="text-xs text-pp-muted">Watch the pattern, then repeat it!</p>
        </div>
        <div className="bg-pp-card border border-pp-border rounded-xl px-3 py-1.5 text-center">
          <div className="font-display text-lg text-pp-gold">{score}</div>
          <div className="text-xs text-pp-muted">pts</div>
        </div>
      </div>

      {phase === "intro" && (
        <div className="flex-1 flex flex-col items-center justify-center px-5 gap-6">
          <Pip expression="excited" size={120} />
          <div className="text-center">
            <h2 className="font-display text-3xl text-pp-cream mb-2">Rhythm Rush</h2>
            <p className="text-pp-muted">Watch the colors light up, then tap them in the same order!</p>
          </div>
          <div className="bg-pp-card border border-pp-border rounded-2xl p-3 text-center">
            <p className="text-xs text-pp-muted">Best score: <span className="font-bold text-pp-gold">{highScore}</span></p>
          </div>
          <button
            onClick={startGame}
            className="text-white font-display text-xl px-10 py-4 rounded-3xl shadow-glow-purple active:scale-95 transition-transform"
            style={{ background: "linear-gradient(135deg, #7C3AED, #3B82F6)" }}
          >
            Start Game! ⚡
          </button>
        </div>
      )}

      {(phase === "showing" || phase === "input" || phase === "correct" || phase === "wrong") && (
        <div className="flex-1 flex flex-col items-center px-5 gap-4 pt-6">
          {/* Level indicator */}
          <div className="flex items-center gap-3">
            <span className="text-sm font-bold text-pp-muted">Level {level}</span>
            <div className="flex gap-1">
              {sequence.map((_, i) => (
                <div
                  key={i}
                  className={`w-2 h-2 rounded-full ${i < playerInput.length ? "bg-pp-green" : "bg-pp-border"}`}
                />
              ))}
            </div>
          </div>

          {/* PIP feedback */}
          <Pip
            expression={phase === "correct" ? "celebrating" : phase === "wrong" ? "curious" : "encouraging"}
            size={80}
          />

          {/* Feedback message */}
          <AnimatePresence>
            {(phase === "correct" || phase === "wrong") && (
              <motion.div
                initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
                className={`font-display text-2xl px-6 py-3 rounded-2xl ${
                  phase === "correct" ? "bg-pp-green/20 text-pp-green" : "bg-pp-coral/20 text-pp-coral"
                }`}
              >
                {feedback}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Phase indicator */}
          <div className={`text-sm font-bold px-4 py-2 rounded-xl ${
            phase === "showing" ? "bg-pp-purple/20 text-pp-purple" :
            phase === "input" ? "bg-pp-green/20 text-pp-green" : "bg-pp-card text-pp-muted"
          }`}>
            {phase === "showing" ? "Watch carefully! 👀" : phase === "input" ? "Your turn! Tap! 👇" : ""}
          </div>

          {/* Color buttons */}
          <div className="grid grid-cols-2 gap-4 w-full max-w-xs mt-2">
            {COLORS.map(c => (
              <motion.button
                key={c.id}
                onPointerDown={() => handleColorPress(c.id)}
                whileTap={{ scale: 0.9 }}
                animate={activeColor === c.id ? { scale: 1.15 } : { scale: 1 }}
                transition={{ duration: 0.1 }}
                className="h-28 rounded-3xl text-4xl font-bold active:scale-90 transition-all select-none"
                style={{
                  backgroundColor: activeColor === c.id ? c.active : c.bg,
                  boxShadow: activeColor === c.id ? `0 0 30px ${c.bg}` : undefined,
                  opacity: phase === "showing" ? 0.7 : 1,
                }}
              >
                {c.label}
              </motion.button>
            ))}
          </div>
        </div>
      )}

      {phase === "gameover" && (
        <div className="flex-1 flex flex-col items-center justify-center px-5 gap-6">
          <Pip expression="encouraging" size={100} />
          <div className="text-center">
            <h2 className="font-display text-3xl text-pp-cream">Game Over!</h2>
            <p className="text-pp-muted mt-1">You got to level {level}</p>
            <div className="mt-3 bg-pp-card border border-pp-border rounded-2xl p-4">
              <p className="text-2xl font-display text-pp-purple">{score} pts</p>
              {score >= highScore && score > 0 && <p className="text-xs text-pp-gold font-bold">🏆 New High Score!</p>}
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={startGame} className="bg-pp-purple text-white font-display px-6 py-3 rounded-2xl active:scale-95 transition-transform">
              Try Again
            </button>
            <button onClick={() => navigate("/app/mini-games")} className="bg-pp-card border border-pp-border text-pp-muted font-bold px-6 py-3 rounded-2xl active:scale-95 transition-transform">
              Exit
            </button>
          </div>
        </div>
      )}

      {phase === "win" && (
        <div className="flex-1 flex flex-col items-center justify-center px-5 gap-6">
          <Pip expression="celebrating" size={120} />
          <div className="text-center">
            <h2 className="font-display text-3xl text-pp-cream">You Won! 🎊</h2>
            <p className="text-pp-muted">All 8 levels complete!</p>
            <div className="mt-3 bg-pp-card border border-pp-gold/30 rounded-2xl p-4">
              <p className="text-3xl font-display text-pp-gold">{score} pts</p>
              <p className="text-xs text-pp-gold font-bold">🏆 Champion!</p>
            </div>
          </div>
          <button
            onClick={startGame}
            className="text-white font-display text-xl px-10 py-4 rounded-3xl active:scale-95 transition-transform"
            style={{ background: "linear-gradient(135deg, #7C3AED, #3B82F6)" }}
          >
            Play Again!
          </button>
        </div>
      )}
    </div>
  );
}
