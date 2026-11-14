import { useState, useEffect } from "react";
import { Icon } from "../components/Icon";

type GameType = "matching" | "typing" | "quiz-race" | "word-scramble";

interface MatchCard { id: string; text: string; pairId: string; flipped: boolean; matched: boolean }

export function GamesPage() {
  const [activeGame, setActiveGame] = useState<GameType | null>(null);

  const games = [
    { type: "matching" as const, name: "Memory Match", desc: "Match terms with definitions", icon: "grid" as const, color: "bg-blue-500/10 text-blue-500" },
    { type: "typing" as const, name: "Speed Type", desc: "Type key terms as fast as you can", icon: "zap" as const, color: "bg-amber-500/10 text-amber-500" },
    { type: "quiz-race" as const, name: "Quiz Race", desc: "Answer questions against the clock", icon: "clock" as const, color: "bg-green-500/10 text-green-600" },
    { type: "word-scramble" as const, name: "Word Scramble", desc: "Unscramble vocabulary words", icon: "refresh" as const, color: "bg-purple-500/10 text-purple-500" },
  ];

  if (activeGame === "matching") return <MatchingGame onBack={() => setActiveGame(null)} />;
  if (activeGame === "typing") return <TypingGame onBack={() => setActiveGame(null)} />;
  if (activeGame === "quiz-race") return <QuizRaceGame onBack={() => setActiveGame(null)} />;
  if (activeGame === "word-scramble") return <WordScrambleGame onBack={() => setActiveGame(null)} />;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-text-primary">Study Games</h1>
        <p className="text-sm text-text-secondary mt-0.5">Learn through play with interactive games</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {games.map((g) => (
          <button key={g.type} onClick={() => setActiveGame(g.type)} className="card card-interactive p-5 text-left space-y-3">
            <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${g.color}`}>
              <Icon name={g.icon} className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-text-primary">{g.name}</h3>
              <p className="text-sm text-text-tertiary mt-0.5">{g.desc}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

function MatchingGame({ onBack }: { onBack: () => void }) {
  const pairs = [
    { term: "Photosynthesis", def: "Converting light to energy" },
    { term: "Mitosis", def: "Cell division process" },
    { term: "Osmosis", def: "Water through membrane" },
    { term: "Entropy", def: "Measure of disorder" },
    { term: "Catalyst", def: "Speeds up reactions" },
    { term: "Hypothesis", def: "Testable prediction" },
  ];

  const [cards, setCards] = useState<MatchCard[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [moves, setMoves] = useState(0);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const all: MatchCard[] = [];
    pairs.forEach((p, i) => {
      all.push({ id: `t${i}`, text: p.term, pairId: String(i), flipped: false, matched: false });
      all.push({ id: `d${i}`, text: p.def, pairId: String(i), flipped: false, matched: false });
    });
    setCards(all.sort(() => Math.random() - 0.5));
  }, []);

  const handleClick = (id: string) => {
    if (selected.length >= 2) return;
    const card = cards.find((c) => c.id === id);
    if (!card || card.matched || card.flipped) return;

    const next = cards.map((c) => c.id === id ? { ...c, flipped: true } : c);
    const newSel = [...selected, id];
    setCards(next);
    setSelected(newSel);

    if (newSel.length === 2) {
      setMoves((m) => m + 1);
      const [a, b] = newSel.map((s) => next.find((c) => c.id === s)!);
      if (a.pairId === b.pairId) {
        setTimeout(() => {
          setCards((prev) => {
            const updated = prev.map((c) => c.pairId === a.pairId ? { ...c, matched: true } : c);
            if (updated.every((c) => c.matched)) setDone(true);
            return updated;
          });
          setSelected([]);
        }, 500);
      } else {
        setTimeout(() => {
          setCards((prev) => prev.map((c) => newSel.includes(c.id) ? { ...c, flipped: false } : c));
          setSelected([]);
        }, 800);
      }
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <button onClick={onBack} className="btn-ghost"><Icon name="arrow-left" className="h-4 w-4" /> Back</button>
        <span className="text-sm text-text-secondary">Moves: {moves}</span>
      </div>
      {done ? (
        <div className="card flex flex-col items-center gap-4 py-10 text-center">
          <Icon name="trophy" className="h-10 w-10 text-amber-500" />
          <h2 className="text-xl font-semibold text-text-primary">Completed!</h2>
          <p className="text-sm text-text-secondary">You matched all pairs in {moves} moves.</p>
          <button onClick={onBack} className="btn-primary">Play Again</button>
        </div>
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
          {cards.map((c) => (
            <button key={c.id} onClick={() => handleClick(c.id)} className={`h-24 rounded-xl border text-center p-2 text-xs font-medium transition-all ${c.matched ? "bg-green-500/10 border-green-500/30 text-green-600" : c.flipped ? "bg-accent-subtle border-accent text-accent-text" : "bg-surface-2 border-border text-text-tertiary hover:bg-surface-3"}`}>
              {c.flipped || c.matched ? c.text : "?"}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function TypingGame({ onBack }: { onBack: () => void }) {
  const words = ["photosynthesis", "metabolism", "chromosome", "evolution", "ecosystem", "hypothesis", "algorithm", "derivative", "equilibrium", "synthesis"];
  const [currentIdx, setCurrentIdx] = useState(0);
  const [input, setInput] = useState("");
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [started, setStarted] = useState(false);
  const [finished, setFinished] = useState(false);

  useEffect(() => {
    if (!started || finished) return;
    const timer = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) { setFinished(true); return 0; }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [started, finished]);

  const handleInput = (val: string) => {
    setInput(val);
    if (val.toLowerCase() === words[currentIdx % words.length]) {
      setScore((s) => s + 1);
      setInput("");
      setCurrentIdx((i) => i + 1);
    }
  };

  if (finished) {
    return (
      <div className="max-w-md mx-auto space-y-6">
        <button onClick={onBack} className="btn-ghost"><Icon name="arrow-left" className="h-4 w-4" /> Back</button>
        <div className="card flex flex-col items-center gap-4 py-10 text-center">
          <Icon name="zap" className="h-10 w-10 text-amber-500" />
          <h2 className="text-xl font-semibold text-text-primary">Time's Up!</h2>
          <p className="text-sm text-text-secondary">You typed {score} words in 30 seconds.</p>
          <p className="text-2xl font-bold text-accent">{(score * 2).toFixed(0)} WPM</p>
          <button onClick={() => { setScore(0); setTimeLeft(30); setCurrentIdx(0); setInput(""); setFinished(false); setStarted(false); }} className="btn-primary">Try Again</button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <button onClick={onBack} className="btn-ghost"><Icon name="arrow-left" className="h-4 w-4" /> Back</button>
        <span className="text-sm font-medium text-text-primary">{timeLeft}s &middot; {score} words</span>
      </div>
      {!started ? (
        <div className="card flex flex-col items-center gap-4 py-10 text-center">
          <Icon name="zap" className="h-8 w-8 text-amber-500" />
          <h2 className="text-lg font-semibold text-text-primary">Speed Type</h2>
          <p className="text-sm text-text-secondary">Type the vocabulary words as fast as you can!</p>
          <button onClick={() => setStarted(true)} className="btn-primary">Start</button>
        </div>
      ) : (
        <div className="card p-8 text-center space-y-6">
          <p className="text-2xl font-bold text-text-primary tracking-wide">{words[currentIdx % words.length]}</p>
          <input type="text" value={input} onChange={(e) => handleInput(e.target.value)} className="input-field text-center text-lg" autoFocus placeholder="Type the word..." />
          <div className="h-2 rounded-full bg-surface-2">
            <div className="h-full rounded-full bg-accent transition-all" style={{ width: `${(timeLeft / 30) * 100}%` }} />
          </div>
        </div>
      )}
    </div>
  );
}

function QuizRaceGame({ onBack }: { onBack: () => void }) {
  const questions = [
    { q: "What organelle is responsible for photosynthesis?", options: ["Mitochondria", "Chloroplast", "Ribosome", "Nucleus"], correct: 1 },
    { q: "What is the powerhouse of the cell?", options: ["Chloroplast", "Nucleus", "Mitochondria", "Golgi Body"], correct: 2 },
    { q: "What type of bond involves sharing electrons?", options: ["Ionic", "Hydrogen", "Covalent", "Metallic"], correct: 2 },
    { q: "What is the pH of pure water?", options: ["5", "7", "9", "14"], correct: 1 },
    { q: "Which planet is closest to the Sun?", options: ["Venus", "Mars", "Mercury", "Earth"], correct: 2 },
  ];

  const [idx, setIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(10);
  const [answered, setAnswered] = useState<number | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (done || answered !== null) return;
    const t = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) { setAnswered(-1); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [idx, done, answered]);

  const handleAnswer = (i: number) => {
    if (answered !== null) return;
    setAnswered(i);
    if (i === questions[idx].correct) setScore((s) => s + 1);
    setTimeout(() => {
      if (idx < questions.length - 1) {
        setIdx((prev) => prev + 1);
        setAnswered(null);
        setTimeLeft(10);
      } else {
        setDone(true);
      }
    }, 1000);
  };

  if (done) {
    return (
      <div className="max-w-md mx-auto space-y-6">
        <button onClick={onBack} className="btn-ghost"><Icon name="arrow-left" className="h-4 w-4" /> Back</button>
        <div className="card flex flex-col items-center gap-4 py-10 text-center">
          <Icon name="trophy" className="h-10 w-10 text-amber-500" />
          <h2 className="text-xl font-semibold text-text-primary">{score}/{questions.length} Correct!</h2>
          <p className="text-sm text-text-secondary">Great job racing through those questions.</p>
          <button onClick={onBack} className="btn-primary">Back to Games</button>
        </div>
      </div>
    );
  }

  const q = questions[idx];
  return (
    <div className="max-w-md mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <button onClick={onBack} className="btn-ghost"><Icon name="arrow-left" className="h-4 w-4" /> Back</button>
        <span className="text-sm text-text-secondary">{idx + 1}/{questions.length} &middot; {timeLeft}s</span>
      </div>
      <div className="h-2 rounded-full bg-surface-2">
        <div className={`h-full rounded-full transition-all ${timeLeft <= 3 ? "bg-red-500" : "bg-accent"}`} style={{ width: `${(timeLeft / 10) * 100}%` }} />
      </div>
      <div className="card p-6 space-y-4">
        <p className="text-base font-semibold text-text-primary">{q.q}</p>
        <div className="space-y-2">
          {q.options.map((opt, i) => (
            <button key={i} onClick={() => handleAnswer(i)} disabled={answered !== null}
              className={`w-full rounded-xl border p-3 text-left text-sm font-medium transition-all ${
                answered === null ? "border-border hover:border-accent hover:bg-accent-subtle text-text-primary" :
                i === q.correct ? "border-green-500 bg-green-500/10 text-green-600" :
                answered === i ? "border-red-500 bg-red-500/10 text-red-500" :
                "border-border text-text-tertiary"
              }`}>
              {opt}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function WordScrambleGame({ onBack }: { onBack: () => void }) {
  const words = ["molecule", "equation", "variable", "function", "spectrum", "particle", "velocity", "gradient"];
  const [idx, setIdx] = useState(0);
  const [input, setInput] = useState("");
  const [score, setScore] = useState(0);
  const [revealed, setRevealed] = useState(false);

  const scramble = (w: string) => w.split("").sort(() => Math.random() - 0.5).join("");
  const [scrambled, setScrambled] = useState(() => scramble(words[0]));

  const handleSubmit = () => {
    if (input.toLowerCase() === words[idx]) {
      setScore((s) => s + 1);
      next();
    } else {
      setRevealed(true);
      setTimeout(next, 1500);
    }
  };

  const next = () => {
    if (idx >= words.length - 1) return;
    const nextIdx = idx + 1;
    setIdx(nextIdx);
    setInput("");
    setRevealed(false);
    setScrambled(scramble(words[nextIdx]));
  };

  if (idx >= words.length - 1 && (revealed || input.toLowerCase() === words[idx])) {
    return (
      <div className="max-w-md mx-auto space-y-6">
        <button onClick={onBack} className="btn-ghost"><Icon name="arrow-left" className="h-4 w-4" /> Back</button>
        <div className="card flex flex-col items-center gap-4 py-10 text-center">
          <Icon name="trophy" className="h-10 w-10 text-amber-500" />
          <h2 className="text-xl font-semibold text-text-primary">{score}/{words.length} Unscrambled!</h2>
          <button onClick={onBack} className="btn-primary">Back to Games</button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <button onClick={onBack} className="btn-ghost"><Icon name="arrow-left" className="h-4 w-4" /> Back</button>
        <span className="text-sm text-text-secondary">{idx + 1}/{words.length} &middot; Score: {score}</span>
      </div>
      <div className="card p-8 text-center space-y-6">
        <p className="text-3xl font-bold text-accent tracking-[0.3em]">{scrambled.toUpperCase()}</p>
        {revealed && <p className="text-sm text-green-600 font-medium">Answer: {words[idx]}</p>}
        <input type="text" value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleSubmit()} className="input-field text-center text-lg" autoFocus placeholder="Unscramble..." />
        <button onClick={handleSubmit} className="btn-primary w-full">Submit</button>
      </div>
    </div>
  );
}
