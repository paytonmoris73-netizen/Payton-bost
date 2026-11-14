import { useState, useMemo } from "react";
import { Icon } from "../components/Icon";
import { useAppStore } from "../stores/appStore";
import { v4 as uuid } from "uuid";

export function FlashcardsPage() {
  const decks = useAppStore((s) => s.flashcardDecks);
  const addDeck = useAppStore((s) => s.addFlashcardDeck);
  const addCard = useAppStore((s) => s.addFlashcard);
  const reviewCard = useAppStore((s) => s.reviewFlashcard);
  const deleteDeck = useAppStore((s) => s.deleteFlashcardDeck);

  const [view, setView] = useState<"list" | "study" | "create">("list");
  const [activeDeckId, setActiveDeckId] = useState<string | null>(null);
  const [cardIdx, setCardIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [newDeckName, setNewDeckName] = useState("");
  const [newDeckDesc, setNewDeckDesc] = useState("");
  const [genTopic, setGenTopic] = useState("");
  const [genCount, setGenCount] = useState(10);
  const [generating, setGenerating] = useState(false);

  const activeDeck = decks.find((d) => d.id === activeDeckId);
  const dueCards = useMemo(() => {
    if (!activeDeck) return [];
    return activeDeck.cards.filter((c) => c.nextReview <= Date.now()).sort((a, b) => a.nextReview - b.nextReview);
  }, [activeDeck]);

  const currentCard = dueCards[cardIdx];
  const totalReviewed = activeDeck?.cards.reduce((s, c) => s + c.reviews, 0) ?? 0;
  const mastered = activeDeck?.cards.filter((c) => c.streak >= 3).length ?? 0;

  const handleRate = (rating: "again" | "hard" | "good" | "easy") => {
    if (!activeDeckId || !currentCard) return;
    reviewCard(activeDeckId, currentCard.id, rating);
    setFlipped(false);
    if (cardIdx < dueCards.length - 1) {
      setCardIdx(cardIdx + 1);
    } else {
      setView("list");
      setCardIdx(0);
    }
  };

  const handleCreateDeck = () => {
    if (!newDeckName.trim()) return;
    const deck = addDeck({ name: newDeckName, description: newDeckDesc });
    setNewDeckName("");
    setNewDeckDesc("");
    setShowCreate(false);
    setActiveDeckId(deck.id);
  };

  const handleGenerate = async () => {
    if (!genTopic.trim()) return;
    setGenerating(true);
    await new Promise((r) => setTimeout(r, 1200));

    const deck = addDeck({ name: `${genTopic} Flashcards`, description: `AI-generated cards for ${genTopic}` });
    const samplePairs = [
      { f: `What is the main concept of ${genTopic}?`, b: `The main concept involves understanding how different elements interact and relate to each other within a structured framework.` },
      { f: `Define 'analysis' in the context of ${genTopic}`, b: `Analysis refers to the systematic examination of individual components to understand the whole. It involves breaking down complex information into simpler parts.` },
      { f: `What are the key principles of ${genTopic}?`, b: `The key principles include: 1) Understanding foundational concepts, 2) Recognizing patterns and relationships, 3) Applying knowledge to new situations, 4) Evaluating outcomes critically.` },
      { f: `How does ${genTopic} connect to other subjects?`, b: `It shares common analytical frameworks, problem-solving methodologies, and theoretical foundations with related disciplines, creating a network of interconnected knowledge.` },
      { f: `What is 'synthesis' as it relates to ${genTopic}?`, b: `Synthesis is the process of combining individual elements or concepts to form a coherent whole. It represents a higher-order thinking skill essential for deep understanding.` },
      { f: `Name three practical applications of ${genTopic}`, b: `1) Problem-solving in academic contexts, 2) Critical analysis of real-world situations, 3) Decision-making based on evidence and reasoning.` },
      { f: `What common mistakes do students make when studying ${genTopic}?`, b: `Common mistakes include: memorizing without understanding, studying in isolation rather than making connections, and not practicing application of concepts.` },
      { f: `Explain the historical development of ${genTopic}`, b: `The field has evolved through several stages: early theoretical foundations, major breakthroughs in methodology, modern applications, and current research frontiers.` },
      { f: `What vocabulary is essential for ${genTopic}?`, b: `Essential terms include: analysis, synthesis, evaluation, application, comprehension, methodology, framework, paradigm, and evidence-based reasoning.` },
      { f: `How should you prepare for an exam on ${genTopic}?`, b: `Use active recall, spaced repetition, practice problems, concept mapping, and teach-back methods. Focus on understanding relationships between concepts rather than isolated facts.` },
    ];

    for (let i = 0; i < Math.min(genCount, samplePairs.length); i++) {
      addCard(deck.id, { front: samplePairs[i].f, back: samplePairs[i].b, type: "basic" });
    }
    setGenerating(false);
    setGenTopic("");
    setShowCreate(false);
  };

  if (view === "study" && activeDeck) {
    return (
      <div className="max-w-xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <button onClick={() => { setView("list"); setCardIdx(0); setFlipped(false); }} className="btn-ghost">
            <Icon name="arrow-left" className="h-4 w-4" /> Back
          </button>
          <div className="text-sm text-text-secondary">
            {cardIdx + 1} / {dueCards.length} cards
          </div>
        </div>

        <div className="h-1.5 rounded-full bg-surface-2">
          <div className="h-full rounded-full bg-accent transition-all" style={{ width: `${dueCards.length > 0 ? ((cardIdx + 1) / dueCards.length) * 100 : 0}%` }} />
        </div>

        {currentCard ? (
          <>
            <div
              onClick={() => setFlipped(!flipped)}
              className="card min-h-[300px] flex items-center justify-center p-8 cursor-pointer transition-all hover:shadow-card"
              style={{ perspective: "1000px" }}
            >
              <div className="text-center space-y-4">
                <span className="chip text-[10px]">{flipped ? "Answer" : "Question"}</span>
                <p className="text-lg font-medium text-text-primary leading-relaxed">
                  {flipped ? currentCard.back : currentCard.front}
                </p>
                {!flipped && (
                  <p className="text-xs text-text-tertiary">Tap to reveal answer</p>
                )}
              </div>
            </div>

            {flipped && (
              <div className="grid grid-cols-4 gap-2 animate-fade-up">
                {([
                  { rating: "again" as const, label: "Again", color: "bg-red-500/10 text-red-500 border-red-500/20", time: "< 1m" },
                  { rating: "hard" as const, label: "Hard", color: "bg-amber-500/10 text-amber-500 border-amber-500/20", time: "~1d" },
                  { rating: "good" as const, label: "Good", color: "bg-green-500/10 text-green-600 border-green-500/20", time: "~3d" },
                  { rating: "easy" as const, label: "Easy", color: "bg-blue-500/10 text-blue-500 border-blue-500/20", time: "~7d" },
                ]).map((r) => (
                  <button key={r.rating} onClick={() => handleRate(r.rating)} className={`rounded-xl border py-3 text-center transition-colors hover:opacity-80 ${r.color}`}>
                    <div className="text-sm font-semibold">{r.label}</div>
                    <div className="text-[10px] opacity-70">{r.time}</div>
                  </button>
                ))}
              </div>
            )}
          </>
        ) : (
          <div className="card flex flex-col items-center gap-4 py-12 text-center">
            <Icon name="check" className="h-10 w-10 text-green-500" />
            <h2 className="text-xl font-semibold text-text-primary">All caught up!</h2>
            <p className="text-sm text-text-secondary">No cards are due for review right now. Great job!</p>
            <button onClick={() => setView("list")} className="btn-primary">
              <Icon name="arrow-left" className="h-4 w-4" /> Back to Decks
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-text-primary">Flashcards</h1>
          <p className="text-sm text-text-secondary mt-0.5">Study with spaced repetition flashcards</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn-primary">
          <Icon name="plus" className="h-4 w-4" /> New Deck
        </button>
      </div>

      {decks.length === 0 ? (
        <div className="card flex flex-col items-center gap-4 py-12 text-center">
          <Icon name="layers" className="h-8 w-8 text-accent" />
          <h2 className="text-lg font-semibold text-text-primary">No flashcard decks</h2>
          <p className="text-sm text-text-secondary">Create a deck manually or let AI generate one.</p>
          <button onClick={() => setShowCreate(true)} className="btn-primary">
            <Icon name="plus" className="h-4 w-4" /> Create Deck
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {decks.map((deck) => {
            const due = deck.cards.filter((c) => c.nextReview <= Date.now()).length;
            const masteredCount = deck.cards.filter((c) => c.streak >= 3).length;
            return (
              <div key={deck.id} className="card p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent-subtle">
                    <Icon name="layers" className="h-5 w-5 text-accent" />
                  </div>
                  <button onClick={() => deleteDeck(deck.id)} className="btn-ghost p-1.5 text-text-tertiary">
                    <Icon name="trash" className="h-3.5 w-3.5" />
                  </button>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-text-primary">{deck.name}</h3>
                  <p className="text-xs text-text-tertiary mt-0.5">{deck.cards.length} cards &middot; {masteredCount} mastered</p>
                </div>
                <div className="h-1.5 rounded-full bg-surface-2">
                  <div className="h-full rounded-full bg-green-500 transition-all" style={{ width: `${deck.cards.length > 0 ? (masteredCount / deck.cards.length) * 100 : 0}%` }} />
                </div>
                <div className="flex items-center justify-between">
                  <span className={`chip text-xs ${due > 0 ? "chip-active" : ""}`}>
                    {due > 0 ? `${due} due` : "All reviewed"}
                  </span>
                  <button
                    onClick={() => { setActiveDeckId(deck.id); setView("study"); setCardIdx(0); setFlipped(false); }}
                    className="btn-primary py-1.5 px-3 text-xs"
                  >
                    <Icon name="play" className="h-3.5 w-3.5" filled /> Study
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showCreate && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center p-4" onClick={() => setShowCreate(false)}>
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />
          <div className="relative z-10 w-full max-w-md rounded-2xl border border-border bg-surface-0 shadow-modal animate-scale-in p-6 space-y-5" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-semibold text-text-primary">Create Flashcard Deck</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1.5">Deck Name</label>
                <input type="text" value={newDeckName} onChange={(e) => setNewDeckName(e.target.value)} placeholder="e.g., Biology Vocabulary" className="input-field" autoFocus />
              </div>
              <button onClick={handleCreateDeck} disabled={!newDeckName.trim()} className="btn-secondary w-full">
                <Icon name="plus" className="h-4 w-4" /> Create Empty Deck
              </button>

              <div className="relative flex items-center gap-4">
                <div className="flex-1 h-px bg-border" />
                <span className="text-xs text-text-tertiary">or generate with AI</span>
                <div className="flex-1 h-px bg-border" />
              </div>

              <div>
                <label className="block text-sm font-medium text-text-primary mb-1.5">Topic for AI Generation</label>
                <input type="text" value={genTopic} onChange={(e) => setGenTopic(e.target.value)} placeholder="e.g., French Revolution, Cell Biology" className="input-field" />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1.5">Number of Cards</label>
                <div className="flex gap-2">
                  {[5, 10, 15, 20].map((n) => (
                    <button key={n} onClick={() => setGenCount(n)} className={`chip ${genCount === n ? "chip-active" : ""}`}>{n}</button>
                  ))}
                </div>
              </div>
              <button onClick={handleGenerate} disabled={!genTopic.trim() || generating} className="btn-primary w-full">
                {generating ? <><Icon name="loader" className="h-4 w-4 animate-spin" /> Generating...</> : <><Icon name="sparkles" className="h-4 w-4" /> Generate Flashcards</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
