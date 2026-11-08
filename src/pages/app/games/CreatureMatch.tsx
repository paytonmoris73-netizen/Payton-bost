import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Pip } from "../../../components/mascot/Pip";

interface Card {
  id: number;
  creatureId: string;
  emoji: string;
  color: string;
  isFlipped: boolean;
  isMatched: boolean;
}

const CARD_CREATURES = [
  { id: "fluffle", emoji: "☁️", color: "#E0F7FA" },
  { id: "bubble", emoji: "🫧", color: "#4FC3F7" },
  { id: "ember", emoji: "🔥", color: "#FF6B6B" },
  { id: "mossy", emoji: "🌿", color: "#6BCB77" },
  { id: "glimmer", emoji: "⭐", color: "#FFD93D" },
  { id: "frosty", emoji: "❄️", color: "#B3E5FC" },
  { id: "bloom", emoji: "🌸", color: "#F48FB1" },
  { id: "zip", emoji: "⚡", color: "#FFD93D" },
];

type GameState = "intro" | "playing" | "win";

function buildDeck(): Card[] {
  const pairs = [...CARD_CREATURES, ...CARD_CREATURES].map((c, i) => ({
    id: i,
    creatureId: c.id,
    emoji: c.emoji,
    color: c.color,
    isFlipped: false,
    isMatched: false,
  }));
  for (let i = pairs.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pairs[i], pairs[j]] = [pairs[j], pairs[i]];
  }
  return pairs;
}

export function CreatureMatchPage() {
  const navigate = useNavigate();
  const [gameState, setGameState] = useState<GameState>("intro");
  const [cards, setCards] = useState<Card[]>([]);
  const [flippedIds, setFlippedIds] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [matches, setMatches] = useState(0);
  const [isChecking, setIsChecking] = useState(false);
  const [startTime, setStartTime] = useState(0);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (gameState !== "playing") return;
    const id = setInterval(() => setElapsed(Math.floor((Date.now() - startTime) / 1000)), 1000);
    return () => clearInterval(id);
  }, [gameState, startTime]);

  function startGame() {
    setCards(buildDeck());
    setFlippedIds([]);
    setMoves(0);
    setMatches(0);
    setIsChecking(false);
    setStartTime(Date.now());
    setElapsed(0);
    setGameState("playing");
  }

  const flipCard = useCallback((id: number) => {
    if (isChecking) return;
    const card = cards.find(c => c.id === id);
    if (!card || card.isFlipped || card.isMatched) return;

    const newFlipped = [...flippedIds, id];
    setCards(prev => prev.map(c => c.id === id ? { ...c, isFlipped: true } : c));
    setFlippedIds(newFlipped);

    if (newFlipped.length === 2) {
      setMoves(m => m + 1);
      setIsChecking(true);
      const [id1, id2] = newFlipped;
      const c1 = cards.find(c => c.id === id1)!;
      const c2 = cards.find(c => c.id === id2)!;

      if (c1.creatureId === c2.creatureId) {
        setTimeout(() => {
          setCards(prev => prev.map(c =>
            c.id === id1 || c.id === id2 ? { ...c, isMatched: true } : c
          ));
          setFlippedIds([]);
          setIsChecking(false);
          setMatches(m => {
            if (m + 1 === CARD_CREATURES.length) setGameState("win");
            return m + 1;
          });
        }, 500);
      } else {
        setTimeout(() => {
          setCards(prev => prev.map(c =>
            c.id === id1 || c.id === id2 ? { ...c, isFlipped: false } : c
          ));
          setFlippedIds([]);
          setIsChecking(false);
        }, 900);
      }
    }
  }, [cards, flippedIds, isChecking]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-mint/20 to-forest/5 dark:from-adventure-navy dark:to-gray-950 pb-24 lg:pb-8 flex flex-col">
      {/* Header */}
      <div className="flex items-center px-5 pt-5 pb-3 gap-3">
        <button onClick={() => navigate("/app/mini-games")} className="text-gray-400 text-2xl">‹</button>
        <div className="flex-1">
          <h1 className="font-display text-xl text-adventure-navy dark:text-white">Creature Match</h1>
        </div>
        {gameState === "playing" && (
          <>
            <div className="bg-white dark:bg-gray-800 rounded-xl px-3 py-1 shadow-card text-center">
              <div className="text-xs text-gray-400">Moves</div>
              <div className="font-display text-lg text-adventure-navy dark:text-white">{moves}</div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl px-3 py-1 shadow-card text-center">
              <div className="text-xs text-gray-400">Time</div>
              <div className="font-display text-lg text-purple">{elapsed}s</div>
            </div>
          </>
        )}
      </div>

      {gameState === "intro" && (
        <div className="flex-1 flex flex-col items-center justify-center px-5 gap-6">
          <Pip expression="curious" size={120} showMessage />
          <div className="text-center">
            <h2 className="font-display text-3xl text-adventure-navy dark:text-white mb-2">Creature Match!</h2>
            <p className="text-gray-500">Flip the cards and find the matching pairs of Wonderworld creatures!</p>
          </div>
          <button
            onClick={startGame}
            className="bg-gradient-to-r from-mint to-forest text-white font-display text-xl px-10 py-4 rounded-3xl active:scale-95 transition-transform"
          >
            Find the Creatures! 🐾
          </button>
        </div>
      )}

      {gameState === "playing" && (
        <div className="flex-1 px-4">
          {/* Progress */}
          <div className="flex justify-between items-center mb-4 px-1">
            <span className="text-sm text-gray-500">{matches}/{CARD_CREATURES.length} pairs found</span>
            <div className="flex gap-1">
              {Array.from({ length: CARD_CREATURES.length }).map((_, i) => (
                <div key={i} className={`w-3 h-3 rounded-full ${i < matches ? "bg-mint" : "bg-gray-200"}`} />
              ))}
            </div>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {cards.map(card => (
              <motion.button
                key={card.id}
                onClick={() => flipCard(card.id)}
                className="aspect-square rounded-2xl overflow-hidden relative select-none"
                whileTap={{ scale: 0.95 }}
              >
                <AnimatePresence mode="wait">
                  {card.isFlipped || card.isMatched ? (
                    <motion.div
                      key="front"
                      initial={{ rotateY: 90 }}
                      animate={{ rotateY: 0 }}
                      transition={{ duration: 0.2 }}
                      className="absolute inset-0 flex items-center justify-center rounded-2xl text-2xl border-2"
                      style={{
                        backgroundColor: card.color,
                        borderColor: card.isMatched ? "#FFD93D" : "white",
                        boxShadow: card.isMatched ? "0 0 10px rgba(255,217,61,0.5)" : undefined,
                      }}
                    >
                      {card.emoji}
                    </motion.div>
                  ) : (
                    <motion.div
                      key="back"
                      initial={{ rotateY: -90 }}
                      animate={{ rotateY: 0 }}
                      transition={{ duration: 0.2 }}
                      className="absolute inset-0 bg-gradient-to-br from-purple to-sky-blue rounded-2xl flex items-center justify-center text-xl"
                    >
                      🌟
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.button>
            ))}
          </div>
        </div>
      )}

      {gameState === "win" && (
        <div className="flex-1 flex flex-col items-center justify-center px-5 gap-6">
          <Pip expression="celebrating" size={120} />
          <div className="text-center">
            <h2 className="font-display text-3xl text-adventure-navy dark:text-white">You found them all! 🎊</h2>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-3 shadow-card text-center">
                <p className="font-display text-2xl text-purple">{moves}</p>
                <p className="text-xs text-gray-400">moves</p>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-3 shadow-card text-center">
                <p className="font-display text-2xl text-sky-blue">{elapsed}s</p>
                <p className="text-xs text-gray-400">time</p>
              </div>
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={startGame} className="bg-mint text-white font-display px-6 py-3 rounded-2xl active:scale-95 transition-transform">
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
