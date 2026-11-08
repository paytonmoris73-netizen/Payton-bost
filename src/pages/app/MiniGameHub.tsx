import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

interface GameEntry {
  id: string;
  name: string;
  description: string;
  emoji: string;
  color: string;
  bgFrom: string;
  bgTo: string;
  route: string;
  available: boolean;
  comingSoon?: boolean;
}

const GAMES: GameEntry[] = [
  {
    id: "rhythm-rush",
    name: "Rhythm Rush",
    description: "Watch the color pattern, then tap it back! Gets faster every level.",
    emoji: "🎵",
    color: "#9B5DE5",
    bgFrom: "#6A1B9A",
    bgTo: "#CE93D8",
    route: "/app/mini-games/rhythm-rush",
    available: true,
  },
  {
    id: "creature-match",
    name: "Creature Match",
    description: "Flip the cards to find matching pairs of Wonderworld creatures!",
    emoji: "🐾",
    color: "#6BCB77",
    bgFrom: "#2D6A4F",
    bgTo: "#6BCB77",
    route: "/app/mini-games/creature-match",
    available: true,
  },
  {
    id: "bubble-pop",
    name: "Bubble Pop",
    description: "Tap floating bubbles before they escape! Race against the clock.",
    emoji: "🫧",
    color: "#4FC3F7",
    bgFrom: "#0288D1",
    bgTo: "#81D4FA",
    route: "/app/mini-games/bubble-pop",
    available: true,
  },
  {
    id: "move-memory",
    name: "Move Memory",
    description: "Watch PIP do moves, then copy the same sequence!",
    emoji: "🏃",
    color: "#FF6B6B",
    bgFrom: "#C62828",
    bgTo: "#FF8A80",
    route: "/app/mini-games/move-memory",
    available: true,
  },
  {
    id: "path-finder",
    name: "Path Finder",
    description: "Help PIP navigate through a colorful maze to find treasure!",
    emoji: "🗺️",
    color: "#F4A261",
    bgFrom: "#E65100",
    bgTo: "#FFCC80",
    route: "/app/mini-games/path-finder",
    available: false,
    comingSoon: true,
  },
  {
    id: "color-quest",
    name: "Color Quest",
    description: "Find matching colors and objects hidden in the adventure world.",
    emoji: "🎨",
    color: "#FFD93D",
    bgFrom: "#F9A825",
    bgTo: "#FFF9C4",
    route: "/app/mini-games/color-quest",
    available: false,
    comingSoon: true,
  },
  {
    id: "adventure-puzzle",
    name: "Adventure Puzzle",
    description: "Solve illustrated puzzles to reveal new world locations!",
    emoji: "🧩",
    color: "#58B9A9",
    bgFrom: "#00695C",
    bgTo: "#80CBC4",
    route: "/app/mini-games/adventure-puzzle",
    available: false,
    comingSoon: true,
  },
  {
    id: "dance-story",
    name: "Dance Story",
    description: "Follow a visual dance sequence and groove to the beat!",
    emoji: "💃",
    color: "#F48FB1",
    bgFrom: "#880E4F",
    bgTo: "#F48FB1",
    route: "/app/mini-games/dance-story",
    available: false,
    comingSoon: true,
  },
];

export function MiniGameHubPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple/10 to-sky-blue/5 dark:from-adventure-navy dark:to-gray-950 pb-24 lg:pb-8">
      {/* Header */}
      <div className="px-5 pt-5 pb-4">
        <h1 className="font-display text-2xl text-adventure-navy dark:text-white">Mini-Game Hub</h1>
        <p className="text-sm text-gray-500">Play fun little games to earn Spark Points!</p>
      </div>

      {/* Featured game */}
      <div className="px-5 mb-5">
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={() => navigate("/app/mini-games/rhythm-rush")}
          className="w-full rounded-3xl overflow-hidden shadow-card relative"
          style={{ background: `linear-gradient(135deg, ${GAMES[0].bgFrom}, ${GAMES[0].bgTo})` }}
        >
          <div className="p-5 flex items-center gap-4">
            <div className="w-20 h-20 rounded-2xl bg-white/20 flex items-center justify-center text-5xl">
              {GAMES[0].emoji}
            </div>
            <div className="flex-1 text-left">
              <span className="bg-sunny-yellow text-adventure-navy text-xs font-bold px-2 py-0.5 rounded-full">⚡ Featured</span>
              <h2 className="font-display text-2xl text-white mt-1">{GAMES[0].name}</h2>
              <p className="text-white/80 text-sm">{GAMES[0].description}</p>
            </div>
          </div>
          <div className="px-5 pb-4">
            <div className="bg-white/20 rounded-2xl py-2.5 text-center font-display text-white text-lg">
              Play Now →
            </div>
          </div>
        </motion.button>
      </div>

      {/* Game grid */}
      <div className="px-5">
        <h3 className="font-display text-lg text-adventure-navy dark:text-white mb-3">All Games</h3>
        <div className="grid grid-cols-2 gap-3">
          {GAMES.map((game, i) => (
            <motion.button
              key={game.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              whileTap={game.available ? { scale: 0.95 } : {}}
              onClick={() => game.available && navigate(game.route)}
              className={`rounded-3xl overflow-hidden shadow-card relative text-left ${!game.available ? "opacity-70" : ""}`}
              style={{ background: `linear-gradient(135deg, ${game.bgFrom}, ${game.bgTo})` }}
            >
              {game.comingSoon && (
                <div className="absolute top-2 right-2 bg-black/30 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                  Soon
                </div>
              )}
              <div className="p-4">
                <div className="text-4xl mb-2">{game.emoji}</div>
                <h4 className="font-display text-white text-base leading-tight">{game.name}</h4>
                <p className="text-white/70 text-xs mt-1 leading-tight line-clamp-2">{game.description}</p>
              </div>
              {game.available && (
                <div className="px-4 pb-3">
                  <div className="bg-white/20 rounded-xl py-1.5 text-center font-bold text-white text-xs">
                    Play →
                  </div>
                </div>
              )}
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  );
}
