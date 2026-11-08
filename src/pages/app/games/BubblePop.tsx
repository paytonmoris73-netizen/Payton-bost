import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Pip } from "../../../components/mascot/Pip";

interface Bubble {
  id: number;
  x: number;
  color: string;
  size: number;
  speed: number;
  emoji: string;
  startY: number;
}

const COLORS = ["#FF6B6B", "#4FC3F7", "#6BCB77", "#FFD93D", "#9B5DE5", "#F4A261", "#F48FB1"];
const EMOJIS = ["🫧", "⭐", "💫", "✨", "🎈", "🌟", "💜"];

let bubbleId = 0;

type GameState = "intro" | "playing" | "gameover";

export function BubblePopPage() {
  const navigate = useNavigate();
  const [gameState, setGameState] = useState<GameState>("intro");
  const [bubbles, setBubbles] = useState<Bubble[]>([]);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [timeLeft, setTimeLeft] = useState(60);
  const [combo, setCombo] = useState(0);
  const [popEffects, setPopEffects] = useState<{ id: number; x: number; y: number }[]>([]);
  const [highScore] = useState(() => {
    try { return parseInt(localStorage.getItem("bp_highscore") ?? "0"); } catch { return 0; }
  });
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const spawnBubble = useCallback(() => {
    const containerWidth = containerRef.current?.clientWidth ?? 320;
    const size = 44 + Math.random() * 30;
    const newBubble: Bubble = {
      id: bubbleId++,
      x: Math.random() * (containerWidth - size),
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      size,
      speed: 3 + Math.random() * 3,
      emoji: EMOJIS[Math.floor(Math.random() * EMOJIS.length)],
      startY: (containerRef.current?.clientHeight ?? 500) + 20,
    };
    setBubbles(prev => [...prev, newBubble]);
  }, []);

  function startGame() {
    setBubbles([]);
    setScore(0);
    setLives(3);
    setTimeLeft(60);
    setCombo(0);
    setGameState("playing");
  }

  useEffect(() => {
    if (gameState !== "playing") return;

    // Spawn bubbles
    const spawnRate = Math.max(600, 1200 - (60 - timeLeft) * 10);
    intervalRef.current = setInterval(spawnBubble, spawnRate);

    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [gameState, timeLeft, spawnBubble]);

  useEffect(() => {
    if (gameState !== "playing") return;

    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          setGameState("gameover");
          try { localStorage.setItem("bp_highscore", String(Math.max(score, highScore))); } catch {}
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [gameState, score, highScore]);

  function popBubble(id: number, _x: number, e: React.PointerEvent) {
    const rect = (e.target as HTMLElement).getBoundingClientRect();
    setPopEffects(prev => [...prev, { id: Date.now(), x: rect.left + rect.width / 2, y: rect.top }]);
    setTimeout(() => setPopEffects(prev => prev.filter(p => p.id !== Date.now())), 500);

    setBubbles(prev => prev.filter(b => b.id !== id));
    setCombo(c => c + 1);
    const pts = combo >= 3 ? 20 : combo >= 2 ? 15 : 10;
    setScore(s => s + pts);
  }

  function missedBubble(id: number) {
    setBubbles(prev => prev.filter(b => b.id !== id));
    setCombo(0);
    setLives(l => {
      const newLives = l - 1;
      if (newLives <= 0) {
        setGameState("gameover");
        try { localStorage.setItem("bp_highscore", String(Math.max(score, highScore))); } catch {}
      }
      return newLives;
    });
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-blue/20 to-adventure-navy/10 dark:from-adventure-navy dark:to-gray-950 pb-20 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center px-5 pt-5 pb-3 gap-3 z-10">
        <button onClick={() => navigate("/app/mini-games")} className="text-gray-400 text-2xl">‹</button>
        <div className="flex-1">
          <h1 className="font-display text-xl text-adventure-navy dark:text-white">Bubble Pop!</h1>
        </div>
        {gameState === "playing" && (
          <>
            <div className="flex gap-0.5">{Array.from({ length: 3 }).map((_, i) => <span key={i} className="text-lg">{i < lives ? "❤️" : "🖤"}</span>)}</div>
            <div className="bg-white dark:bg-gray-800 rounded-xl px-3 py-1 text-center shadow-card">
              <div className="font-display text-lg text-purple">{timeLeft}s</div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl px-3 py-1 text-center shadow-card">
              <div className="font-display text-lg text-adventure-navy dark:text-white">{score}</div>
            </div>
          </>
        )}
      </div>

      {gameState === "intro" && (
        <div className="flex-1 flex flex-col items-center justify-center px-5 gap-6">
          <Pip expression="excited" size={120} showMessage />
          <div className="text-center">
            <h2 className="font-display text-3xl text-adventure-navy dark:text-white mb-2">Bubble Pop!</h2>
            <p className="text-gray-500">Tap the bubbles before they float away! You have 3 lives and 60 seconds.</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-3 shadow-card text-center">
            <p className="text-xs text-gray-500">Best: <span className="font-bold text-sky-blue">{highScore} pts</span></p>
          </div>
          <button
            onClick={startGame}
            className="bg-gradient-to-r from-sky-blue to-purple text-white font-display text-xl px-10 py-4 rounded-3xl active:scale-95 transition-transform"
          >
            Pop Bubbles! 🫧
          </button>
        </div>
      )}

      {gameState === "playing" && (
        <div ref={containerRef} className="flex-1 relative overflow-hidden">
          {combo >= 3 && (
            <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-sunny-yellow text-adventure-navy font-display text-sm px-3 py-1 rounded-full z-10">
              {combo}x COMBO! 🔥
            </div>
          )}
          <AnimatePresence>
            {bubbles.map(bubble => (
              <motion.button
                key={bubble.id}
                initial={{ y: bubble.startY, x: bubble.x, opacity: 1, scale: 1 }}
                animate={{ y: -100 }}
                transition={{ duration: bubble.speed, ease: "linear" }}
                onAnimationComplete={() => missedBubble(bubble.id)}
                onPointerDown={(e) => popBubble(bubble.id, bubble.x, e)}
                exit={{ scale: 1.5, opacity: 0, transition: { duration: 0.2 } }}
                className="absolute flex items-center justify-center rounded-full text-2xl select-none active:scale-110"
                style={{
                  width: bubble.size,
                  height: bubble.size,
                  backgroundColor: bubble.color,
                  boxShadow: `0 0 15px ${bubble.color}50`,
                  left: bubble.x,
                }}
              >
                {bubble.emoji}
              </motion.button>
            ))}
          </AnimatePresence>

          {/* Pop effects */}
          <AnimatePresence>
            {popEffects.map(ef => (
              <motion.div
                key={ef.id}
                initial={{ scale: 0, opacity: 1 }}
                animate={{ scale: 2, opacity: 0 }}
                exit={{}}
                transition={{ duration: 0.3 }}
                className="fixed pointer-events-none text-2xl z-20"
                style={{ left: ef.x - 15, top: ef.y - 15 }}
              >
                ✨
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {gameState === "gameover" && (
        <div className="flex-1 flex flex-col items-center justify-center px-5 gap-6">
          <Pip expression={score > highScore ? "celebrating" : "happy"} size={100} />
          <div className="text-center">
            <h2 className="font-display text-3xl text-adventure-navy dark:text-white">
              {lives <= 0 ? "No more lives!" : "Time's up!"}
            </h2>
            <div className="mt-3 bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-card">
              <p className="text-3xl font-display text-purple">{score} pts</p>
              {score > highScore && <p className="text-xs text-sunny-yellow font-bold">🏆 New High Score!</p>}
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={startGame} className="bg-sky-blue text-white font-display px-6 py-3 rounded-2xl active:scale-95 transition-transform">
              Play Again
            </button>
            <button onClick={() => navigate("/app/mini-games")} className="bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 font-bold px-6 py-3 rounded-2xl active:scale-95 transition-transform">
              Exit
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
