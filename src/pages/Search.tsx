import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Icon, type IconName } from "../components/Icon";
import { useAppStore } from "../stores/appStore";

export function SearchPage() {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const navigate = useNavigate();

  const notes = useAppStore((s) => s.notes);
  const decks = useAppStore((s) => s.flashcardDecks);
  const tests = useAppStore((s) => s.tests);
  const documents = useAppStore((s) => s.documents);
  const recordings = useAppStore((s) => s.recordings);
  const conversations = useAppStore((s) => s.conversations);
  const studyGuides = useAppStore((s) => s.studyGuides);

  const results = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    const items: { type: string; icon: IconName; title: string; subtitle: string; route: string; color: string }[] = [];

    if (filter === "all" || filter === "notes") {
      notes.filter((n) => n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q)).forEach((n) =>
        items.push({ type: "Note", icon: "file-text", title: n.title, subtitle: n.content.slice(0, 80), route: "/app/notes", color: "bg-blue-500/10 text-blue-500" })
      );
    }
    if (filter === "all" || filter === "flashcards") {
      decks.filter((d) => d.name.toLowerCase().includes(q) || d.cards.some((c) => c.front.toLowerCase().includes(q))).forEach((d) =>
        items.push({ type: "Deck", icon: "layers", title: d.name, subtitle: `${d.cards.length} cards`, route: "/app/flashcards", color: "bg-purple-500/10 text-purple-500" })
      );
    }
    if (filter === "all" || filter === "tests") {
      tests.filter((t) => t.title.toLowerCase().includes(q) || (t.description ?? "").toLowerCase().includes(q)).forEach((t) =>
        items.push({ type: "Test", icon: "test-tube", title: t.title, subtitle: `${t.questions.length} questions`, route: "/app/tests", color: "bg-green-500/10 text-green-600" })
      );
    }
    if (filter === "all" || filter === "documents") {
      documents.filter((d) => d.name.toLowerCase().includes(q) || (d.extractedText ?? "").toLowerCase().includes(q)).forEach((d) =>
        items.push({ type: "Document", icon: "upload", title: d.name, subtitle: d.type.toUpperCase(), route: "/app/library", color: "bg-amber-500/10 text-amber-500" })
      );
    }
    if (filter === "all" || filter === "recordings") {
      recordings.filter((r) => r.title.toLowerCase().includes(q)).forEach((r) =>
        items.push({ type: "Recording", icon: "mic", title: r.title, subtitle: `${Math.round(r.duration / 60)}m`, route: "/app/audio", color: "bg-red-500/10 text-red-500" })
      );
    }
    if (filter === "all" || filter === "chats") {
      conversations.filter((c) => c.title.toLowerCase().includes(q) || c.messages.some((m) => m.content.toLowerCase().includes(q))).forEach((c) =>
        items.push({ type: "Chat", icon: "brain", title: c.title, subtitle: `${c.messages.length} messages`, route: "/app/tutor", color: "bg-cyan-500/10 text-cyan-500" })
      );
    }
    if (filter === "all" || filter === "guides") {
      studyGuides.filter((g) => g.topic.toLowerCase().includes(q) || g.content.toLowerCase().includes(q)).forEach((g) =>
        items.push({ type: "Guide", icon: "book-open", title: g.topic, subtitle: g.style, route: "/app/guides", color: "bg-emerald-500/10 text-emerald-500" })
      );
    }

    return items;
  }, [query, filter, notes, decks, tests, documents, recordings, conversations, studyGuides]);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-text-primary">Search</h1>
        <p className="text-sm text-text-secondary mt-0.5">Find anything across your learning materials</p>
      </div>

      <div className="relative">
        <Icon name="search" className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-text-tertiary" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search notes, flashcards, tests, documents..."
          className="input-field pl-11 text-base py-3"
          autoFocus
        />
      </div>

      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
        {[
          { value: "all", label: "All" },
          { value: "notes", label: "Notes" },
          { value: "flashcards", label: "Flashcards" },
          { value: "tests", label: "Tests" },
          { value: "documents", label: "Documents" },
          { value: "recordings", label: "Recordings" },
          { value: "chats", label: "Chats" },
          { value: "guides", label: "Guides" },
        ].map((f) => (
          <button key={f.value} onClick={() => setFilter(f.value)} className={`chip shrink-0 ${filter === f.value ? "chip-active" : ""}`}>
            {f.label}
          </button>
        ))}
      </div>

      {query.trim() && results.length === 0 && (
        <div className="card flex flex-col items-center gap-3 py-10 text-center">
          <Icon name="search" className="h-8 w-8 text-text-tertiary" />
          <p className="text-sm font-medium text-text-primary">No results found</p>
          <p className="text-xs text-text-tertiary">Try a different search term or filter.</p>
        </div>
      )}

      {!query.trim() && (
        <div className="card flex flex-col items-center gap-3 py-10 text-center">
          <Icon name="search" className="h-8 w-8 text-accent" />
          <p className="text-sm font-medium text-text-primary">Search your learning materials</p>
          <p className="text-xs text-text-tertiary">Type to search across notes, flashcards, tests, and more.</p>
        </div>
      )}

      {results.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-xs text-text-tertiary">{results.length} result{results.length !== 1 ? "s" : ""}</p>
          {results.map((r, i) => (
            <button key={i} onClick={() => navigate(r.route)} className="card card-interactive flex items-center gap-3 px-4 py-3 w-full text-left">
              <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${r.color}`}>
                <Icon name={r.icon} className="h-4.5 w-4.5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium text-text-primary truncate">{r.title}</div>
                <div className="text-xs text-text-tertiary truncate">{r.subtitle}</div>
              </div>
              <span className="chip text-[10px] shrink-0">{r.type}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
