import { useState, useMemo, useCallback } from "react";
import { Icons } from "../components/Icons";
import { useStore } from "../state/store";
import type { FlashcardDeck, Flashcard } from "../types";

function formatDate(ts: number) {
  return new Date(ts).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/* ─── New / Edit Card Modal ─── */
function CardModal({
  card,
  deckId,
  onClose,
}: {
  card: Flashcard | null;
  deckId: string;
  onClose: () => void;
}) {
  const { addFlashcard, updateFlashcard } = useStore();
  const [front, setFront] = useState(card?.front ?? "");
  const [back, setBack] = useState(card?.back ?? "");
  const [explanation, setExplanation] = useState(card?.explanation ?? "");
  const [difficulty, setDifficulty] = useState<Flashcard["difficulty"]>(card?.difficulty ?? "medium");

  const save = () => {
    if (!front.trim() || !back.trim()) return;
    if (card) {
      updateFlashcard(card.id, { front, back, explanation, difficulty });
    } else {
      addFlashcard({ deckId, front, back, explanation, difficulty });
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div className="card shadow-elevated w-full max-w-md mx-4 p-6 animate-scale-in" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-ink-900 dark:text-white">{card ? "Edit Card" : "New Card"}</h3>
          <button onClick={onClose} className="btn-ghost p-1.5"><Icons.x size={18} /></button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-ink-500 dark:text-gray-400 mb-1 block">Front (Question)</label>
            <textarea value={front} onChange={(e) => setFront(e.target.value)} rows={3} className="input text-sm" placeholder="What is the question?" />
          </div>
          <div>
            <label className="text-xs font-medium text-ink-500 dark:text-gray-400 mb-1 block">Back (Answer)</label>
            <textarea value={back} onChange={(e) => setBack(e.target.value)} rows={3} className="input text-sm" placeholder="What is the answer?" />
          </div>
          <div>
            <label className="text-xs font-medium text-ink-500 dark:text-gray-400 mb-1 block">Explanation (optional)</label>
            <textarea value={explanation} onChange={(e) => setExplanation(e.target.value)} rows={2} className="input text-sm" placeholder="Why is this the answer?" />
          </div>
          <div>
            <label className="text-xs font-medium text-ink-500 dark:text-gray-400 mb-1 block">Difficulty</label>
            <div className="flex gap-2">
              {(["easy", "medium", "hard"] as const).map((d) => (
                <button
                  key={d}
                  onClick={() => setDifficulty(d)}
                  className={`chip flex-1 justify-center capitalize ${difficulty === d ? "chip-active" : ""}`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-5">
          <button onClick={onClose} className="btn-secondary text-xs">Cancel</button>
          <button onClick={save} className="btn-primary text-xs">Save Card</button>
        </div>
      </div>
    </div>
  );
}

/* ─── New Deck Modal ─── */
function NewDeckModal({ onClose }: { onClose: () => void }) {
  const { subjects, addFlashcardDeck } = useStore();
  const [name, setName] = useState("");
  const [subjectId, setSubjectId] = useState(subjects[0]?.id ?? "");

  const save = () => {
    if (!name.trim()) return;
    addFlashcardDeck({ name, subjectId, lastStudied: undefined });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div className="card shadow-elevated w-full max-w-sm mx-4 p-6 animate-scale-in" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-bold text-ink-900 dark:text-white mb-4">New Flashcard Deck</h3>
        <div className="space-y-3">
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="input text-sm" placeholder="Deck name" />
          <select value={subjectId} onChange={(e) => setSubjectId(e.target.value)} className="input text-sm">
            {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
        <div className="flex justify-end gap-2 mt-5">
          <button onClick={onClose} className="btn-secondary text-xs">Cancel</button>
          <button onClick={save} className="btn-primary text-xs">Create Deck</button>
        </div>
      </div>
    </div>
  );
}

/* ─── Study Session ─── */
function StudyView({
  deck,
  cards,
  onExit,
}: {
  deck: FlashcardDeck;
  cards: Flashcard[];
  onExit: () => void;
}) {
  const { updateFlashcard } = useStore();
  const [order, setOrder] = useState(() => cards.map((_, i) => i));
  const [pos, setPos] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [results, setResults] = useState<Record<string, "got" | "almost" | "review">>({});

  const card = cards[order[pos]];
  const total = order.length;
  const done = Object.keys(results).length;

  const doShuffle = useCallback(() => {
    setOrder(shuffle(cards.map((_, i) => i)));
    setPos(0);
    setFlipped(false);
    setResults({});
  }, [cards]);

  const respond = (quality: "got" | "almost" | "review") => {
    if (!card) return;
    setResults((r) => ({ ...r, [card.id]: quality }));

    const DAY = 86_400_000;
    let { interval, easeFactor } = card;
    if (quality === "got") {
      interval = Math.max(1, Math.round(interval * easeFactor));
      easeFactor = Math.min(3, easeFactor + 0.1);
    } else if (quality === "almost") {
      interval = Math.max(1, interval);
      easeFactor = Math.max(1.3, easeFactor - 0.05);
    } else {
      interval = 1;
      easeFactor = Math.max(1.3, easeFactor - 0.2);
    }
    updateFlashcard(card.id, {
      interval,
      easeFactor,
      nextReview: Date.now() + interval * DAY,
      reviews: card.reviews + 1,
      correct: quality === "got" ? card.correct + 1 : card.correct,
    });

    if (pos < total - 1) {
      setPos(pos + 1);
      setFlipped(false);
    }
  };

  const allDone = done >= total;

  if (!card || allDone) {
    const got = Object.values(results).filter((r) => r === "got").length;
    return (
      <div className="fixed inset-0 z-50 bg-warm-100 dark:bg-dark-900 flex items-center justify-center">
        <div className="text-center animate-scale-in max-w-sm mx-4">
          <div className="w-20 h-20 rounded-full bg-success-50 dark:bg-success-500/15 flex items-center justify-center mx-auto mb-4">
            <Icons.trophy size={36} className="text-success-500" />
          </div>
          <h2 className="text-2xl font-bold font-display text-ink-900 dark:text-white mb-1">Session Complete!</h2>
          <p className="text-ink-500 dark:text-gray-400 mb-2">{deck.name}</p>
          <p className="text-3xl font-bold text-brand-600 dark:text-brand-400 mb-1">{got}/{total}</p>
          <p className="text-sm text-ink-500 dark:text-gray-400 mb-6">cards answered correctly</p>
          <div className="flex gap-3 justify-center">
            <button onClick={doShuffle} className="btn-secondary text-sm">Study Again</button>
            <button onClick={onExit} className="btn-primary text-sm">Done</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-warm-100 dark:bg-dark-900 flex flex-col">
      {/* Top bar */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-warm-200 dark:border-dark-border bg-white dark:bg-dark-800">
        <button onClick={onExit} className="btn-ghost p-1.5"><Icons.x size={18} /></button>
        <span className="text-sm font-medium text-ink-700 dark:text-gray-300 truncate">{deck.name}</span>
        <span className="ml-auto text-xs text-ink-500 dark:text-gray-400">{pos + 1}/{total}</span>
        <button onClick={doShuffle} className="btn-ghost p-1.5" title="Shuffle">
          <Icons.zap size={16} />
        </button>
      </div>

      {/* Progress */}
      <div className="h-1 bg-warm-200 dark:bg-dark-600">
        <div className="h-full bg-brand-500 transition-all duration-300" style={{ width: `${((pos + 1) / total) * 100}%` }} />
      </div>

      {/* Card */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div
          onClick={() => setFlipped(!flipped)}
          className="w-full max-w-lg cursor-pointer select-none"
          style={{ perspective: "1000px" }}
        >
          <div
            className="relative w-full transition-transform duration-500"
            style={{
              transformStyle: "preserve-3d",
              transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
            }}
          >
            {/* Front */}
            <div
              className="card p-8 min-h-[260px] flex flex-col items-center justify-center text-center"
              style={{ backfaceVisibility: "hidden" }}
            >
              <span className="text-xs text-ink-400 dark:text-gray-500 mb-3 uppercase tracking-wider">Question</span>
              <p className="text-lg font-semibold text-ink-900 dark:text-white leading-relaxed">{card.front}</p>
              <p className="text-xs text-ink-400 dark:text-gray-500 mt-6">Tap to reveal answer</p>
            </div>
            {/* Back */}
            <div
              className="card p-8 min-h-[260px] flex flex-col items-center justify-center text-center absolute inset-0"
              style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
            >
              <span className="text-xs text-brand-500 dark:text-brand-400 mb-3 uppercase tracking-wider">Answer</span>
              <p className="text-lg font-semibold text-ink-900 dark:text-white leading-relaxed">{card.back}</p>
              {card.explanation && (
                <p className="text-sm text-ink-500 dark:text-gray-400 mt-4 leading-relaxed">{card.explanation}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Response buttons */}
      {flipped && (
        <div className="flex items-center gap-3 px-6 py-4 border-t border-warm-200 dark:border-dark-border bg-white dark:bg-dark-800 animate-fade-up">
          <button
            onClick={() => respond("review")}
            className="flex-1 py-3 rounded-xl bg-red-50 dark:bg-red-500/15 text-red-600 dark:text-red-400 font-semibold text-sm hover:bg-red-100 dark:hover:bg-red-500/25 transition-colors"
          >
            Need Review
          </button>
          <button
            onClick={() => respond("almost")}
            className="flex-1 py-3 rounded-xl bg-amber-50 dark:bg-amber-500/15 text-amber-600 dark:text-amber-400 font-semibold text-sm hover:bg-amber-100 dark:hover:bg-amber-500/25 transition-colors"
          >
            Almost
          </button>
          <button
            onClick={() => respond("got")}
            className="flex-1 py-3 rounded-xl bg-emerald-50 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-semibold text-sm hover:bg-emerald-100 dark:hover:bg-emerald-500/25 transition-colors"
          >
            Got It
          </button>
        </div>
      )}
    </div>
  );
}

/* ─── Deck Detail ─── */
function DeckDetail({
  deck,
  onBack,
}: {
  deck: FlashcardDeck;
  onBack: () => void;
}) {
  const { flashcards, deleteFlashcard } = useStore();
  const cards = useMemo(() => flashcards.filter((c) => c.deckId === deck.id), [flashcards, deck.id]);
  const [cardModal, setCardModal] = useState<Flashcard | null | "new">(null);
  const [studying, setStudying] = useState(false);

  if (studying && cards.length > 0) {
    return <StudyView deck={deck} cards={cards} onExit={() => setStudying(false)} />;
  }

  return (
    <div className="animate-fade-in">
      {cardModal !== null && (
        <CardModal card={cardModal === "new" ? null : cardModal} deckId={deck.id} onClose={() => setCardModal(null)} />
      )}

      <div className="flex items-center gap-3 px-4 lg:px-6 py-4">
        <button onClick={onBack} className="btn-ghost p-1.5"><Icons.arrowLeft size={18} /></button>
        <div className="flex-1 min-w-0">
          <h2 className="text-xl font-bold font-display text-ink-900 dark:text-white truncate">{deck.name}</h2>
          <p className="text-xs text-ink-500 dark:text-gray-400">{cards.length} card{cards.length !== 1 ? "s" : ""}</p>
        </div>
        <button onClick={() => setCardModal("new")} className="btn-secondary text-xs"><Icons.plus size={14} /> Add Card</button>
        <button onClick={() => setStudying(true)} className="btn-primary text-xs" disabled={cards.length === 0}>
          <Icons.play size={14} /> Study
        </button>
      </div>

      <div className="px-4 lg:px-6 pb-6 space-y-2">
        {cards.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-sm text-ink-500 dark:text-gray-400 mb-3">This deck has no cards yet</p>
            <button onClick={() => setCardModal("new")} className="btn-primary text-sm"><Icons.plus size={16} /> Add First Card</button>
          </div>
        ) : (
          cards.map((c, i) => (
            <div key={c.id} className="card p-3 flex items-start gap-3">
              <span className="text-xs text-ink-400 dark:text-gray-500 mt-0.5 w-5 text-right">{i + 1}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-ink-800 dark:text-gray-200">{c.front}</p>
                <p className="text-xs text-ink-500 dark:text-gray-400 mt-0.5">{c.back}</p>
              </div>
              <span className={`chip text-[10px] py-0.5 px-2 capitalize ${
                c.difficulty === "easy" ? "text-emerald-600 bg-emerald-50 border-emerald-200 dark:text-emerald-400 dark:bg-emerald-500/15 dark:border-emerald-500/30"
                : c.difficulty === "hard" ? "text-red-600 bg-red-50 border-red-200 dark:text-red-400 dark:bg-red-500/15 dark:border-red-500/30"
                : ""
              }`}>{c.difficulty}</span>
              <button onClick={() => setCardModal(c)} className="btn-ghost p-1"><Icons.edit size={14} /></button>
              <button onClick={() => { if (confirm("Delete this card?")) deleteFlashcard(c.id); }} className="btn-ghost p-1 text-red-500"><Icons.trash size={14} /></button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

/* ─── Main Page ─── */
export function FlashcardsPage() {
  const { flashcardDecks, flashcards, subjects } = useStore();
  const [newDeckOpen, setNewDeckOpen] = useState(false);
  const [selectedDeck, setSelectedDeck] = useState<FlashcardDeck | null>(null);

  if (selectedDeck) {
    const live = flashcardDecks.find((d) => d.id === selectedDeck.id);
    if (!live) return null;
    return <DeckDetail deck={live} onBack={() => setSelectedDeck(null)} />;
  }

  return (
    <div className="p-4 lg:p-6 animate-fade-in">
      {newDeckOpen && <NewDeckModal onClose={() => setNewDeckOpen(false)} />}

      <div className="flex items-center gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold font-display text-ink-900 dark:text-white">Flashcards</h1>
          <p className="text-sm text-ink-500 dark:text-gray-400 mt-0.5">
            {flashcardDecks.length} deck{flashcardDecks.length !== 1 ? "s" : ""} &middot; {flashcards.length} card{flashcards.length !== 1 ? "s" : ""}
          </p>
        </div>
        <button onClick={() => setNewDeckOpen(true)} className="ml-auto btn-primary text-xs">
          <Icons.plus size={14} /> New Deck
        </button>
      </div>

      {flashcardDecks.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-16 h-16 rounded-2xl bg-brand-50 dark:bg-brand-500/15 flex items-center justify-center mx-auto mb-4">
            <Icons.flashcards size={28} className="text-brand-500" />
          </div>
          <h3 className="text-lg font-semibold text-ink-800 dark:text-gray-200 mb-1">No flashcard decks yet</h3>
          <p className="text-sm text-ink-500 dark:text-gray-400 mb-4">Create your first deck to start studying</p>
          <button onClick={() => setNewDeckOpen(true)} className="btn-primary text-sm"><Icons.plus size={16} /> Create Deck</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {flashcardDecks.map((deck) => {
            const sub = subjects.find((s) => s.id === deck.subjectId);
            const cards = flashcards.filter((c) => c.deckId === deck.id);
            const due = cards.filter((c) => c.nextReview <= Date.now()).length;
            const mastered = cards.length > 0 ? Math.round((cards.filter((c) => c.interval >= 7).length / cards.length) * 100) : 0;

            return (
              <button
                key={deck.id}
                onClick={() => setSelectedDeck(deck)}
                className="card card-hover text-left p-4"
              >
                <div className="flex items-center gap-2 mb-3">
                  {sub && <span className="w-3 h-3 rounded-full" style={{ background: sub.color }} />}
                  <span className="text-xs text-ink-400 dark:text-gray-500">{sub?.name ?? "General"}</span>
                  {due > 0 && (
                    <span className="ml-auto text-[10px] font-semibold text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-500/15 px-2 py-0.5 rounded-full">
                      {due} due
                    </span>
                  )}
                </div>
                <h3 className="text-sm font-semibold text-ink-800 dark:text-gray-200 mb-2">{deck.name}</h3>
                <div className="flex items-center gap-3 text-xs text-ink-500 dark:text-gray-400">
                  <span>{cards.length} card{cards.length !== 1 ? "s" : ""}</span>
                  {deck.lastStudied && <span>Studied {formatDate(deck.lastStudied)}</span>}
                </div>
                {/* Mastery bar */}
                <div className="mt-3">
                  <div className="flex items-center justify-between text-[10px] mb-1">
                    <span className="text-ink-400 dark:text-gray-500">Mastery</span>
                    <span className="font-medium text-ink-600 dark:text-gray-300">{mastered}%</span>
                  </div>
                  <div className="h-1.5 bg-warm-200 dark:bg-dark-600 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-brand-400 to-accent-500 transition-all"
                      style={{ width: `${mastered}%` }}
                    />
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
