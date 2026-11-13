import { useState, useEffect, useCallback, useRef } from "react";
import { Icons } from "../components/Icons";

/* ── shared types & data ── */
interface QA { q: string; a: string; options?: string[] }

const VOCAB_PAIRS: { term: string; def: string }[] = [
  { term: "Photosynthesis", def: "Converting light to energy" },
  { term: "Mitosis", def: "Cell division process" },
  { term: "Osmosis", def: "Water through membrane" },
  { term: "Catalyst", def: "Speeds up a reaction" },
  { term: "Erosion", def: "Wearing away of land" },
  { term: "Friction", def: "Resistance between surfaces" },
];

const CHALLENGE_QS: QA[] = [
  { q: "What is 7 × 8?", a: "56", options: ["48", "56", "64", "72"] },
  { q: "Capital of France?", a: "Paris", options: ["London", "Paris", "Berlin", "Rome"] },
  { q: "H₂O is the formula for?", a: "Water", options: ["Water", "Oxygen", "Hydrogen", "Salt"] },
  { q: "How many continents?", a: "7", options: ["5", "6", "7", "8"] },
  { q: "Largest organ in the body?", a: "Skin", options: ["Heart", "Liver", "Skin", "Brain"] },
  { q: "What is 12²?", a: "144", options: ["124", "144", "132", "156"] },
  { q: "Who wrote Romeo and Juliet?", a: "Shakespeare", options: ["Dickens", "Shakespeare", "Hemingway", "Austen"] },
  { q: "Boiling point of water (°C)?", a: "100", options: ["90", "100", "110", "120"] },
  { q: "What planet is closest to the Sun?", a: "Mercury", options: ["Venus", "Mercury", "Mars", "Earth"] },
  { q: "What gas do plants absorb?", a: "CO₂", options: ["O₂", "N₂", "CO₂", "H₂"] },
];

const TF_STATEMENTS: { text: string; answer: boolean }[] = [
  { text: "The Earth revolves around the Sun.", answer: true },
  { text: "Spiders are insects.", answer: false },
  { text: "Water boils at 100°C at sea level.", answer: true },
  { text: "The Great Wall of China is visible from space.", answer: false },
  { text: "Diamonds are made of carbon.", answer: true },
  { text: "Sound travels faster than light.", answer: false },
  { text: "Humans have 206 bones.", answer: true },
  { text: "Bananas grow on trees.", answer: false },
  { text: "The Pacific is the largest ocean.", answer: true },
  { text: "Venus is the hottest planet.", answer: true },
  { text: "Octopuses have three hearts.", answer: true },
  { text: "Lightning never strikes the same place twice.", answer: false },
  { text: "DNA stands for deoxyribonucleic acid.", answer: true },
  { text: "The Moon produces its own light.", answer: false },
  { text: "Sharks are mammals.", answer: false },
  { text: "Pluto is classified as a dwarf planet.", answer: true },
  { text: "The Sahara is the largest desert.", answer: false },
  { text: "Oxygen is the most abundant gas in the atmosphere.", answer: false },
  { text: "The speed of light is approximately 300,000 km/s.", answer: true },
  { text: "Goldfish have a 3-second memory.", answer: false },
];

type GameId = "challenge" | "memory" | "truefalse";
type Screen = "menu" | "playing" | "results";

interface GameCard {
  id: GameId;
  name: string;
  desc: string;
  icon: (p: { size?: number }) => JSX.Element;
  color: string;
  highScore: number;
}

const GAME_DEFS: GameCard[] = [
  { id: "challenge", name: "Quick Challenge", desc: "Answer fast before time runs out!", icon: Icons.zap, color: "bg-yellow-500", highScore: 0 },
  { id: "memory", name: "Memory Match", desc: "Match terms with their definitions.", icon: Icons.grid, color: "bg-brand-500", highScore: 0 },
  { id: "truefalse", name: "True or False", desc: "Decide if statements are accurate.", icon: Icons.check, color: "bg-success-500", highScore: 0 },
];

/* ── Quick Challenge ── */
function QuickChallenge({ onBack }: { onBack: (score: number) => void }) {
  const [screen, setScreen] = useState<Screen>("menu");
  const [qIdx, setQIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [feedback, setFeedback] = useState<"correct" | "wrong" | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const shuffled = useRef(CHALLENGE_QS.sort(() => Math.random() - 0.5));

  useEffect(() => {
    if (screen !== "playing") return;
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) { clearInterval(timerRef.current!); setScreen("results"); return 0; }
        return t - 1;
      });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [screen]);

  const pick = (ans: string) => {
    const correct = ans === shuffled.current[qIdx].a;
    if (correct) {
      const mult = Math.min(streak + 1, 4);
      setScore((s) => s + 10 * mult);
      setStreak((s) => s + 1);
    } else {
      setStreak(0);
    }
    setFeedback(correct ? "correct" : "wrong");
    setTimeout(() => {
      setFeedback(null);
      if (qIdx + 1 >= shuffled.current.length) { if (timerRef.current) clearInterval(timerRef.current); setScreen("results"); }
      else setQIdx((i) => i + 1);
    }, 400);
  };

  if (screen === "menu") return (
    <div className="text-center py-12">
      <div className="w-16 h-16 rounded-2xl bg-yellow-100 dark:bg-yellow-500/15 flex items-center justify-center mx-auto mb-4 text-yellow-600 dark:text-yellow-400"><Icons.zap size={32} /></div>
      <h2 className="text-2xl font-bold font-display text-ink-900 dark:text-white mb-2">Quick Challenge</h2>
      <p className="text-ink-500 dark:text-gray-400 mb-6 max-w-sm mx-auto">Answer as many questions as you can in 30 seconds. Streaks multiply your score!</p>
      <button onClick={() => { setScreen("playing"); setScore(0); setStreak(0); setTimeLeft(30); setQIdx(0); shuffled.current = [...CHALLENGE_QS].sort(() => Math.random() - 0.5); }} className="btn-primary text-lg px-8 py-3"><Icons.play size={18} /> Start</button>
    </div>
  );

  if (screen === "results") return (
    <div className="text-center py-12 animate-fade-up">
      <Icons.trophy size={48} className="mx-auto text-yellow-500 mb-4" />
      <h2 className="text-3xl font-bold font-display text-ink-900 dark:text-white mb-2">{score} pts</h2>
      <p className="text-ink-500 dark:text-gray-400 mb-6">You answered {qIdx} questions</p>
      <div className="flex gap-3 justify-center">
        <button onClick={() => setScreen("menu")} className="btn-secondary">Play Again</button>
        <button onClick={() => onBack(score)} className="btn-ghost">Back to Games</button>
      </div>
    </div>
  );

  const q = shuffled.current[qIdx];
  return (
    <div className="py-6 animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <span className="text-2xl font-bold text-ink-900 dark:text-white">{score} pts</span>
        <span className={`text-lg font-bold ${timeLeft <= 10 ? "text-red-500" : "text-ink-600 dark:text-gray-300"}`}>{timeLeft}s</span>
      </div>
      {streak > 1 && <p className="text-center text-sm font-semibold text-yellow-500 mb-4">🔥 {streak}x streak!</p>}
      <div className={`card p-6 mb-6 transition-colors ${feedback === "correct" ? "border-success-500 bg-success-50 dark:bg-success-500/10" : feedback === "wrong" ? "border-red-500 bg-red-50 dark:bg-red-500/10" : ""}`}>
        <p className="text-lg font-semibold text-ink-900 dark:text-white text-center">{q.q}</p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {q.options!.map((o) => (
          <button key={o} onClick={() => pick(o)} className="card card-hover p-4 text-center font-medium text-ink-800 dark:text-gray-200">{o}</button>
        ))}
      </div>
    </div>
  );
}

/* ── Memory Match ── */
interface MemCard { id: number; text: string; pairId: number; flipped: boolean; matched: boolean }

function MemoryMatch({ onBack }: { onBack: (score: number) => void }) {
  const [screen, setScreen] = useState<Screen>("menu");
  const [cards, setCards] = useState<MemCard[]>([]);
  const [selected, setSelected] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [matched, setMatched] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const total = 6;

  const startGame = () => {
    const pairs = VOCAB_PAIRS.slice(0, total);
    const deck: MemCard[] = [];
    pairs.forEach((p, i) => {
      deck.push({ id: i * 2, text: p.term, pairId: i, flipped: false, matched: false });
      deck.push({ id: i * 2 + 1, text: p.def, pairId: i, flipped: false, matched: false });
    });
    deck.sort(() => Math.random() - 0.5);
    setCards(deck);
    setSelected([]);
    setMoves(0);
    setMatched(0);
    setElapsed(0);
    setScreen("playing");
    timerRef.current = setInterval(() => setElapsed((t) => t + 1), 1000);
  };

  useEffect(() => {
    if (matched === total && matched > 0) {
      if (timerRef.current) clearInterval(timerRef.current);
      setTimeout(() => setScreen("results"), 500);
    }
  }, [matched]);

  useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current); }, []);

  const flipCard = useCallback((idx: number) => {
    if (selected.length >= 2) return;
    const c = cards[idx];
    if (c.flipped || c.matched) return;

    const next = cards.map((cc, i) => i === idx ? { ...cc, flipped: true } : cc);
    setCards(next);
    const newSel = [...selected, idx];
    setSelected(newSel);

    if (newSel.length === 2) {
      setMoves((m) => m + 1);
      const [a, b] = newSel;
      if (next[a].pairId === next[b].pairId) {
        setTimeout(() => {
          setCards((prev) => prev.map((cc) => cc.pairId === next[a].pairId ? { ...cc, matched: true } : cc));
          setMatched((m) => m + 1);
          setSelected([]);
        }, 400);
      } else {
        setTimeout(() => {
          setCards((prev) => prev.map((cc, i) => (i === a || i === b) ? { ...cc, flipped: false } : cc));
          setSelected([]);
        }, 800);
      }
    }
  }, [cards, selected]);

  if (screen === "menu") return (
    <div className="text-center py-12">
      <div className="w-16 h-16 rounded-2xl bg-brand-100 dark:bg-brand-500/15 flex items-center justify-center mx-auto mb-4 text-brand-600 dark:text-brand-400"><Icons.grid size={32} /></div>
      <h2 className="text-2xl font-bold font-display text-ink-900 dark:text-white mb-2">Memory Match</h2>
      <p className="text-ink-500 dark:text-gray-400 mb-6 max-w-sm mx-auto">Match scientific terms with their definitions. Flip two cards to find pairs.</p>
      <button onClick={startGame} className="btn-primary text-lg px-8 py-3"><Icons.play size={18} /> Start</button>
    </div>
  );

  if (screen === "results") {
    const score = Math.max(100 - moves * 5 - elapsed, 10);
    return (
      <div className="text-center py-12 animate-fade-up">
        <Icons.trophy size={48} className="mx-auto text-brand-500 mb-4" />
        <h2 className="text-3xl font-bold font-display text-ink-900 dark:text-white mb-2">All Matched!</h2>
        <p className="text-ink-500 dark:text-gray-400 mb-1">{moves} moves &middot; {elapsed}s</p>
        <p className="text-lg font-semibold text-brand-600 dark:text-brand-400 mb-6">Score: {score}</p>
        <div className="flex gap-3 justify-center">
          <button onClick={startGame} className="btn-secondary">Play Again</button>
          <button onClick={() => onBack(score)} className="btn-ghost">Back to Games</button>
        </div>
      </div>
    );
  }

  return (
    <div className="py-6 animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <span className="text-sm font-medium text-ink-500 dark:text-gray-400">Moves: {moves}</span>
        <span className="text-sm font-medium text-ink-500 dark:text-gray-400">{elapsed}s</span>
        <span className="text-sm font-medium text-brand-600 dark:text-brand-400">{matched}/{total} pairs</span>
      </div>
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
        {cards.map((c, i) => (
          <button key={c.id} onClick={() => flipCard(i)}
            className={`aspect-[3/4] rounded-xl font-medium text-sm flex items-center justify-center p-2 text-center transition-all duration-300 ${
              c.matched ? "bg-success-100 dark:bg-success-500/15 text-success-700 dark:text-success-400 border border-success-200 dark:border-success-500/30" :
              c.flipped ? "bg-brand-50 dark:bg-brand-500/15 text-brand-700 dark:text-brand-300 border border-brand-200 dark:border-brand-500/30 scale-105" :
              "bg-warm-200 dark:bg-dark-600 text-ink-400 dark:text-gray-500 border border-warm-300 dark:border-dark-border hover:bg-warm-300 dark:hover:bg-dark-500 cursor-pointer"
            }`}>
            {c.flipped || c.matched ? c.text : "?"}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ── True or False ── */
function TrueOrFalse({ onBack }: { onBack: (score: number) => void }) {
  const [screen, setScreen] = useState<Screen>("menu");
  const [idx, setIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState<"correct" | "wrong" | null>(null);
  const shuffled = useRef(TF_STATEMENTS.sort(() => Math.random() - 0.5));
  const total = 20;

  const answer = (val: boolean) => {
    const correct = val === shuffled.current[idx].answer;
    if (correct) setScore((s) => s + 1);
    setFeedback(correct ? "correct" : "wrong");
    setTimeout(() => {
      setFeedback(null);
      if (idx + 1 >= total) setScreen("results");
      else setIdx((i) => i + 1);
    }, 500);
  };

  if (screen === "menu") return (
    <div className="text-center py-12">
      <div className="w-16 h-16 rounded-2xl bg-success-100 dark:bg-success-500/15 flex items-center justify-center mx-auto mb-4 text-success-600 dark:text-success-400"><Icons.check size={32} /></div>
      <h2 className="text-2xl font-bold font-display text-ink-900 dark:text-white mb-2">True or False</h2>
      <p className="text-ink-500 dark:text-gray-400 mb-6 max-w-sm mx-auto">Decide whether each statement is true or false. 20 questions total.</p>
      <button onClick={() => { setScreen("playing"); setScore(0); setIdx(0); shuffled.current = [...TF_STATEMENTS].sort(() => Math.random() - 0.5); }} className="btn-primary text-lg px-8 py-3"><Icons.play size={18} /> Start</button>
    </div>
  );

  if (screen === "results") {
    const pct = Math.round((score / total) * 100);
    return (
      <div className="text-center py-12 animate-fade-up">
        <Icons.trophy size={48} className="mx-auto text-success-500 mb-4" />
        <h2 className="text-3xl font-bold font-display text-ink-900 dark:text-white mb-2">{score}/{total}</h2>
        <p className="text-ink-500 dark:text-gray-400 mb-6">{pct}% correct</p>
        <div className="flex gap-3 justify-center">
          <button onClick={() => setScreen("menu")} className="btn-secondary">Play Again</button>
          <button onClick={() => onBack(pct)} className="btn-ghost">Back to Games</button>
        </div>
      </div>
    );
  }

  const st = shuffled.current[idx];
  return (
    <div className="py-6 animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <span className="text-sm font-medium text-ink-500 dark:text-gray-400">{idx + 1}/{total}</span>
        <span className="text-sm font-semibold text-success-600 dark:text-success-400">{score} correct</span>
      </div>
      <div className="h-2 bg-warm-200 dark:bg-dark-600 rounded-full overflow-hidden mb-8">
        <div className="h-full bg-success-500 rounded-full transition-all" style={{ width: `${((idx + 1) / total) * 100}%` }} />
      </div>
      <div className={`card p-8 mb-8 transition-colors ${feedback === "correct" ? "border-success-500 bg-success-50 dark:bg-success-500/10" : feedback === "wrong" ? "border-red-500 bg-red-50 dark:bg-red-500/10" : ""}`}>
        <p className="text-lg font-semibold text-ink-900 dark:text-white text-center leading-relaxed">{st.text}</p>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <button onClick={() => answer(true)} className="card card-hover p-6 text-center text-lg font-bold text-success-600 dark:text-success-400 hover:bg-success-50 dark:hover:bg-success-500/10">True</button>
        <button onClick={() => answer(false)} className="card card-hover p-6 text-center text-lg font-bold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10">False</button>
      </div>
    </div>
  );
}

/* ── Game Page Shell ── */
export function StudyGamesPage() {
  const [active, setActive] = useState<GameId | null>(null);
  const [highScores, setHighScores] = useState<Record<GameId, number>>({ challenge: 0, memory: 0, truefalse: 0 });

  const handleBack = (game: GameId, score: number) => {
    setHighScores((prev) => ({ ...prev, [game]: Math.max(prev[game], score) }));
    setActive(null);
  };

  if (active === "challenge") return (
    <div className="p-4 lg:p-6 max-w-2xl mx-auto">
      <button onClick={() => setActive(null)} className="btn-ghost mb-4"><Icons.arrowLeft size={16} /> Back</button>
      <QuickChallenge onBack={(s) => handleBack("challenge", s)} />
    </div>
  );
  if (active === "memory") return (
    <div className="p-4 lg:p-6 max-w-2xl mx-auto">
      <button onClick={() => setActive(null)} className="btn-ghost mb-4"><Icons.arrowLeft size={16} /> Back</button>
      <MemoryMatch onBack={(s) => handleBack("memory", s)} />
    </div>
  );
  if (active === "truefalse") return (
    <div className="p-4 lg:p-6 max-w-2xl mx-auto">
      <button onClick={() => setActive(null)} className="btn-ghost mb-4"><Icons.arrowLeft size={16} /> Back</button>
      <TrueOrFalse onBack={(s) => handleBack("truefalse", s)} />
    </div>
  );

  return (
    <div className="p-4 lg:p-6 max-w-4xl mx-auto animate-fade-up">
      <div className="mb-6">
        <h1 className="text-2xl font-bold font-display text-ink-900 dark:text-white">Study Games</h1>
        <p className="text-sm text-ink-500 dark:text-gray-400 mt-1">Learn while having fun with interactive games</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {GAME_DEFS.map((g) => (
          <button key={g.id} onClick={() => setActive(g.id)} className="card card-hover p-6 text-left group">
            <div className={`w-12 h-12 rounded-xl ${g.color} bg-opacity-15 dark:bg-opacity-15 flex items-center justify-center mb-4`}>
              <g.icon size={24} />
            </div>
            <h3 className="text-lg font-semibold text-ink-900 dark:text-white mb-1">{g.name}</h3>
            <p className="text-sm text-ink-500 dark:text-gray-400 mb-4">{g.desc}</p>
            <div className="flex items-center justify-between">
              {highScores[g.id] > 0 ? (
                <span className="text-xs font-semibold text-brand-600 dark:text-brand-400">High Score: {highScores[g.id]}</span>
              ) : (
                <span className="text-xs text-ink-300 dark:text-gray-600">Not played yet</span>
              )}
              <Icons.chevronRight size={16} className="text-ink-300 dark:text-gray-600 group-hover:text-brand-500 transition-colors" />
            </div>
          </button>
        ))}
      </div>

      <div className="card p-6 mt-6 text-center">
        <Icons.games size={32} className="mx-auto text-ink-300 dark:text-gray-600 mb-2" />
        <p className="text-sm text-ink-500 dark:text-gray-400">More games coming soon! Create flashcards or quizzes to unlock personalized game content.</p>
      </div>
    </div>
  );
}
