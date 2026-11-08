import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Pip } from "../../../components/mascot/Pip";

interface MoveCard {
  id: string;
  label: string;
  emoji: string;
  color: string;
  pipExpression: "happy" | "excited" | "encouraging" | "celebrating";
}

const MOVES: MoveCard[] = [
  { id: "run", label: "Run in place", emoji: "🏃", color: "#FF6B6B", pipExpression: "excited" },
  { id: "jump", label: "Jump up", emoji: "⬆️", color: "#FFD93D", pipExpression: "excited" },
  { id: "spin", label: "Spin around", emoji: "🌀", color: "#9B5DE5", pipExpression: "happy" },
  { id: "stretch", label: "Stretch wide", emoji: "🤸", color: "#6BCB77", pipExpression: "encouraging" },
  { id: "hop", label: "Hop on one foot", emoji: "🦩", color: "#4FC3F7", pipExpression: "happy" },
  { id: "wave", label: "Wave your arms", emoji: "👋", color: "#F4A261", pipExpression: "celebrating" },
];

type Phase = "intro" | "showing" | "input" | "correct" | "wrong" | "gameover" | "win";

export function MoveMemoryPage() {
  const navigate = useNavigate();
  const [phase, setPhase] = useState<Phase>("intro");
  const [sequence, setSequence] = useState<string[]>([]);
  const [playerInput, setPlayerInput] = useState<string[]>([]);
  const [showingIndex, setShowingIndex] = useState(-1);
  const [level, setLevel] = useState(1);
  const [score, setScore] = useState(0);

  function getRandomMoves(count: number): string[] {
    const all = MOVES.map(m => m.id);
    const result: string[] = [];
    for (let i = 0; i < count; i++) {
      result.push(all[Math.floor(Math.random() * all.length)]);
    }
    return result;
  }

  async function showSequence(seq: string[]) {
    setPhase("showing");
    setPlayerInput([]);
    setShowingIndex(-1);
    await new Promise(r => setTimeout(r, 600));
    for (let i = 0; i < seq.length; i++) {
      setShowingIndex(i);
      await new Promise(r => setTimeout(r, 900));
      setShowingIndex(-1);
      await new Promise(r => setTimeout(r, 300));
    }
    setPhase("input");
  }

  function startGame() {
    const seq = getRandomMoves(3);
    setSequence(seq);
    setLevel(1);
    setScore(0);
    setPlayerInput([]);
    showSequence(seq);
  }

  function handleMovePress(moveId: string) {
    if (phase !== "input") return;
    const newInput = [...playerInput, moveId];
    setPlayerInput(newInput);
    const idx = newInput.length - 1;

    if (moveId !== sequence[idx]) {
      setPhase("wrong");
      setTimeout(() => setPhase("gameover"), 1200);
      return;
    }

    if (newInput.length === sequence.length) {
      setScore(s => s + level * 15);
      setPhase("correct");
      setTimeout(() => {
        const nextLevel = level + 1;
        if (nextLevel > 7) { setPhase("win"); return; }
        setLevel(nextLevel);
        const newSeq = getRandomMoves(2 + nextLevel);
        setSequence(newSeq);
        showSequence(newSeq);
      }, 1200);
    }
  }

  const currentShowMove = showingIndex >= 0 ? MOVES.find(m => m.id === sequence[showingIndex]) : null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-coral/10 to-sunny-yellow/5 dark:from-adventure-navy dark:to-gray-950 pb-24 lg:pb-8 flex flex-col">
      {/* Header */}
      <div className="flex items-center px-5 pt-5 pb-3 gap-3">
        <button onClick={() => navigate("/app/mini-games")} className="text-gray-400 text-2xl">‹</button>
        <div className="flex-1">
          <h1 className="font-display text-xl text-adventure-navy dark:text-white">Move Memory</h1>
          <p className="text-xs text-gray-500">Watch PIP, then copy the moves!</p>
        </div>
        {phase !== "intro" && (
          <div className="bg-white dark:bg-gray-800 rounded-xl px-3 py-1 shadow-card text-center">
            <div className="font-display text-lg text-coral">{score}</div>
            <div className="text-xs text-gray-400">pts</div>
          </div>
        )}
      </div>

      {phase === "intro" && (
        <div className="flex-1 flex flex-col items-center justify-center px-5 gap-6">
          <Pip expression="excited" size={120} showMessage />
          <div className="text-center">
            <h2 className="font-display text-3xl text-adventure-navy dark:text-white mb-2">Move Memory</h2>
            <p className="text-gray-500">Watch the movement sequence, then tap the same moves in order!</p>
          </div>
          <button
            onClick={startGame}
            className="bg-gradient-to-r from-coral to-sunny-yellow text-white font-display text-xl px-10 py-4 rounded-3xl active:scale-95 transition-transform"
          >
            Start Moving! 🏃
          </button>
        </div>
      )}

      {(phase === "showing" || phase === "input" || phase === "correct" || phase === "wrong") && (
        <div className="flex-1 flex flex-col items-center px-5 gap-4">
          {/* PIP center stage */}
          <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-card w-full max-w-xs flex flex-col items-center gap-3">
            <AnimatePresence mode="wait">
              <motion.div key={phase === "showing" ? showingIndex : phase}>
                <Pip
                  expression={
                    currentShowMove ? currentShowMove.pipExpression :
                    phase === "correct" ? "celebrating" :
                    phase === "wrong" ? "curious" : "encouraging"
                  }
                  size={90}
                />
              </motion.div>
            </AnimatePresence>

            <AnimatePresence>
              {currentShowMove && (
                <motion.div
                  initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
                  className="text-center"
                >
                  <div className="text-4xl mb-1">{currentShowMove.emoji}</div>
                  <p className="font-display text-lg text-adventure-navy dark:text-white">{currentShowMove.label}</p>
                </motion.div>
              )}
            </AnimatePresence>

            {phase === "correct" && (
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
                className="font-display text-xl text-mint"
              >
                Perfect! 🎉
              </motion.div>
            )}
            {phase === "wrong" && (
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
                className="font-display text-xl text-coral"
              >
                Oops! 🤔
              </motion.div>
            )}
          </div>

          {/* Phase + progress */}
          <div className="flex items-center gap-2">
            <span className={`text-sm font-bold px-3 py-1 rounded-xl ${
              phase === "showing" ? "bg-purple/10 text-purple" : "bg-mint/10 text-forest"
            }`}>
              {phase === "showing" ? "Watch PIP! 👀" : phase === "input" ? "Your turn! 👇" : ""}
            </span>
            <div className="flex gap-1">
              {sequence.map((_, i) => (
                <div key={i} className={`w-2 h-2 rounded-full ${
                  i < playerInput.length ? "bg-mint" :
                  i === showingIndex ? "bg-purple" : "bg-gray-200"
                }`} />
              ))}
            </div>
          </div>

          {/* Move buttons */}
          <div className="grid grid-cols-3 gap-3 w-full max-w-xs">
            {MOVES.map(move => (
              <motion.button
                key={move.id}
                onClick={() => handleMovePress(move.id)}
                whileTap={{ scale: 0.9 }}
                disabled={phase !== "input"}
                className={`flex flex-col items-center gap-1 p-3 rounded-2xl shadow-card transition-all ${
                  phase !== "input" ? "opacity-40" : "active:scale-95"
                }`}
                style={{ backgroundColor: move.color + "30", border: `2px solid ${move.color}` }}
              >
                <span className="text-2xl">{move.emoji}</span>
                <span className="text-xs font-bold text-adventure-navy dark:text-white leading-tight text-center">{move.label}</span>
              </motion.button>
            ))}
          </div>
        </div>
      )}

      {phase === "gameover" && (
        <div className="flex-1 flex flex-col items-center justify-center px-5 gap-6">
          <Pip expression="encouraging" size={100} />
          <div className="text-center">
            <h2 className="font-display text-3xl text-adventure-navy dark:text-white">Keep practicing!</h2>
            <p className="text-gray-500">Level {level} — {score} points</p>
          </div>
          <div className="flex gap-3">
            <button onClick={startGame} className="bg-coral text-white font-display px-6 py-3 rounded-2xl active:scale-95 transition-transform">Try Again</button>
            <button onClick={() => navigate("/app/mini-games")} className="bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 font-bold px-6 py-3 rounded-2xl active:scale-95 transition-transform">Exit</button>
          </div>
        </div>
      )}

      {phase === "win" && (
        <div className="flex-1 flex flex-col items-center justify-center px-5 gap-6">
          <Pip expression="celebrating" size={120} />
          <div className="text-center">
            <h2 className="font-display text-3xl text-adventure-navy dark:text-white">Move Master! 🏆</h2>
            <p className="text-3xl font-display text-coral mt-2">{score} pts</p>
          </div>
          <button onClick={startGame} className="bg-gradient-to-r from-coral to-sunny-yellow text-white font-display text-xl px-10 py-4 rounded-3xl active:scale-95 transition-transform">
            Play Again!
          </button>
        </div>
      )}
    </div>
  );
}
