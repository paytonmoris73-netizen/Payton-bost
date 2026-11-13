import { useState, useRef, useCallback, useEffect } from "react";
import { Icons } from "../components/Icons";
import { useStore } from "../state/store";
import type { Note } from "../types";

const NOTE_TYPES = [
  { id: "detailed", label: "Detailed Notes", desc: "Comprehensive coverage of all topics" },
  { id: "summary", label: "Quick Summary", desc: "Key points in brief" },
  { id: "exam", label: "Exam Review", desc: "Focused on testable material" },
  { id: "cornell", label: "Cornell Notes", desc: "Cues, notes, and summary format" },
  { id: "bullets", label: "Bullet Points", desc: "Concise bullet-point format" },
  { id: "concepts", label: "Key Concepts", desc: "Core ideas and definitions" },
  { id: "formulas", label: "Formula Sheet", desc: "All formulas and equations" },
  { id: "qa", label: "Q&A Notes", desc: "Question and answer pairs" },
];

type SortKey = "date" | "title" | "subject";
type ViewMode = "grid" | "list";

function formatDate(ts: number) {
  return new Date(ts).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

function NoteTypeModal({ onSelect, onClose }: { onSelect: (type: string) => void; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div className="card shadow-elevated w-full max-w-lg mx-4 p-6 animate-scale-in" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-ink-900 dark:text-white">Choose Note Type</h3>
          <button onClick={onClose} className="btn-ghost p-1.5 rounded-lg"><Icons.x size={18} /></button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {NOTE_TYPES.map((t) => (
            <button
              key={t.id}
              onClick={() => { onSelect(t.id); onClose(); }}
              className="card card-hover text-left p-3"
            >
              <p className="text-sm font-semibold text-ink-800 dark:text-gray-200">{t.label}</p>
              <p className="text-xs text-ink-500 dark:text-gray-400 mt-0.5">{t.desc}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function ToolbarButton({ label, onClick, icon }: { label: string; onClick: () => void; icon?: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      className="p-1.5 rounded text-ink-500 hover:bg-warm-200 hover:text-ink-700 dark:text-gray-400 dark:hover:bg-dark-600 dark:hover:text-gray-200 transition-colors text-xs font-bold"
    >
      {icon || label}
    </button>
  );
}

function NoteEditor({
  note,
  onBack,
}: {
  note: Note | null;
  onBack: () => void;
}) {
  const { subjects, addNote, updateNote, deleteNote } = useStore();
  const [title, setTitle] = useState(note?.title ?? "");
  const [content, setContent] = useState(note?.content ?? "");
  const [subjectId, setSubjectId] = useState(note?.subjectId ?? subjects[0]?.id ?? "");
  const [tags, setTags] = useState<string[]>(note?.tags ?? []);
  const [tagInput, setTagInput] = useState("");
  const [saved, setSaved] = useState(true);
  const [aiOpen, setAiOpen] = useState(false);
  const [noteTypeModal, setNoteTypeModal] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const saveTimeout = useRef<ReturnType<typeof setTimeout>>();

  const markDirty = useCallback(() => {
    setSaved(false);
    clearTimeout(saveTimeout.current);
    saveTimeout.current = setTimeout(() => setSaved(true), 1200);
  }, []);

  useEffect(() => () => clearTimeout(saveTimeout.current), []);

  const wrapSelection = (before: string, after: string) => {
    const ta = textareaRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const selected = content.substring(start, end);
    const replacement = `${before}${selected || "text"}${after}`;
    const next = content.substring(0, start) + replacement + content.substring(end);
    setContent(next);
    markDirty();
    requestAnimationFrame(() => {
      ta.focus();
      ta.setSelectionRange(start + before.length, start + before.length + (selected || "text").length);
    });
  };

  const insertAtCursor = (text: string) => {
    const ta = textareaRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const lineStart = content.lastIndexOf("\n", start - 1) + 1;
    const prefix = start === lineStart ? "" : "\n";
    const next = content.substring(0, start) + prefix + text + content.substring(start);
    setContent(next);
    markDirty();
  };

  const handleSave = () => {
    if (!title.trim()) return;
    if (note) {
      updateNote(note.id, { title, content, subjectId, tags });
    } else {
      addNote({ title, content, subjectId, tags, sourceType: "manual" });
    }
    setSaved(true);
    onBack();
  };

  const handleDelete = () => {
    if (note && confirm("Delete this note?")) {
      deleteNote(note.id);
      onBack();
    }
  };

  const addTag = () => {
    const t = tagInput.trim().toLowerCase();
    if (t && !tags.includes(t)) {
      setTags([...tags, t]);
      markDirty();
    }
    setTagInput("");
  };

  const subject = subjects.find((s) => s.id === subjectId);

  return (
    <div className="animate-fade-in">
      {noteTypeModal && (
        <NoteTypeModal
          onSelect={(type) => {
            const t = NOTE_TYPES.find((n) => n.id === type);
            if (t) setContent((prev) => prev + `\n\n[AI: Generate ${t.label}]\n`);
            markDirty();
          }}
          onClose={() => setNoteTypeModal(false)}
        />
      )}

      <div className="flex items-center gap-3 px-4 lg:px-6 py-3 border-b border-warm-200 dark:border-dark-border bg-white dark:bg-dark-800 sticky top-14 z-10">
        <button onClick={onBack} className="btn-ghost p-1.5"><Icons.arrowLeft size={18} /></button>
        <span className="text-sm font-medium text-ink-500 dark:text-gray-400">
          {saved ? "Saved" : "Saving..."}
        </span>
        <div className="ml-auto flex items-center gap-2">
          {note && (
            <button onClick={handleDelete} className="btn-ghost p-2 text-red-500 hover:text-red-600">
              <Icons.trash size={16} />
            </button>
          )}
          <div className="relative">
            <button onClick={() => setAiOpen(!aiOpen)} className="btn-secondary text-xs gap-1.5">
              <Icons.sparkles size={14} /> AI Actions
            </button>
            {aiOpen && (
              <div className="absolute right-0 top-full mt-1 w-52 card shadow-elevated p-1 z-20">
                {["Generate Summary", "Simplify", "Create Flashcards", "Create Quiz"].map((a) => (
                  <button
                    key={a}
                    onClick={() => {
                      if (a === "Generate Summary") setNoteTypeModal(true);
                      setAiOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 text-sm rounded-lg hover:bg-warm-100 dark:hover:bg-dark-600 text-ink-700 dark:text-gray-300"
                  >
                    {a}
                  </button>
                ))}
              </div>
            )}
          </div>
          <button onClick={handleSave} className="btn-primary text-xs">Save</button>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 lg:px-6 py-6 space-y-4">
        <input
          type="text"
          value={title}
          onChange={(e) => { setTitle(e.target.value); markDirty(); }}
          placeholder="Note Title"
          className="w-full text-2xl font-bold font-display bg-transparent outline-none placeholder:text-ink-300 text-ink-900 dark:text-white dark:placeholder:text-gray-600"
        />

        <div className="flex items-center gap-3 flex-wrap">
          <select
            value={subjectId}
            onChange={(e) => { setSubjectId(e.target.value); markDirty(); }}
            className="input py-1.5 text-xs w-40"
          >
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
          {subject && (
            <span className="w-3 h-3 rounded-full" style={{ background: subject.color }} />
          )}
        </div>

        {/* Toolbar */}
        <div className="flex items-center gap-0.5 p-1 rounded-lg border border-warm-200 dark:border-dark-border bg-warm-50 dark:bg-dark-700 flex-wrap">
          <ToolbarButton label="Bold" onClick={() => wrapSelection("**", "**")} icon={<span className="font-black">B</span>} />
          <ToolbarButton label="Italic" onClick={() => wrapSelection("*", "*")} icon={<span className="italic">I</span>} />
          <ToolbarButton label="Heading" onClick={() => insertAtCursor("## ")} icon={<span>H</span>} />
          <div className="w-px h-5 bg-warm-300 dark:bg-dark-500 mx-1" />
          <ToolbarButton label="Bullet List" onClick={() => insertAtCursor("- ")} icon={<Icons.list size={14} />} />
          <ToolbarButton label="Numbered List" onClick={() => insertAtCursor("1. ")} icon={<span className="text-[11px]">1.</span>} />
          <ToolbarButton label="Checklist" onClick={() => insertAtCursor("- [ ] ")} icon={<Icons.check size={14} />} />
          <div className="w-px h-5 bg-warm-300 dark:bg-dark-500 mx-1" />
          <ToolbarButton label="Highlight" onClick={() => wrapSelection("==", "==")} icon={<span className="bg-yellow-200 dark:bg-yellow-700 px-0.5 rounded text-[11px]">H</span>} />
        </div>

        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => { setContent(e.target.value); markDirty(); }}
          placeholder="Start writing your notes..."
          className="w-full min-h-[400px] resize-y rounded-lg border border-warm-200 dark:border-dark-border bg-white dark:bg-dark-700 p-4 text-sm leading-relaxed text-ink-800 dark:text-gray-200 outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100 dark:focus:ring-brand-500/20 placeholder:text-ink-300 dark:placeholder:text-gray-600 font-mono"
        />

        {/* Tags */}
        <div>
          <label className="text-xs font-medium text-ink-500 dark:text-gray-400 mb-1 block">Tags</label>
          <div className="flex items-center gap-2 flex-wrap">
            {tags.map((t) => (
              <span key={t} className="chip chip-active gap-1 pr-1.5">
                {t}
                <button onClick={() => { setTags(tags.filter((x) => x !== t)); markDirty(); }} className="hover:text-red-500">
                  <Icons.x size={12} />
                </button>
              </span>
            ))}
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag(); } }}
              placeholder="Add tag..."
              className="text-xs bg-transparent outline-none w-24 text-ink-700 dark:text-gray-300 placeholder:text-ink-400 dark:placeholder:text-gray-500"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export function NotesPage() {
  const { notes, subjects } = useStore();
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<SortKey>("date");
  const [filterSubject, setFilterSubject] = useState<string>("all");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [editing, setEditing] = useState<Note | null | "new">(null);

  if (editing !== null) {
    return (
      <NoteEditor
        note={editing === "new" ? null : editing}
        onBack={() => setEditing(null)}
      />
    );
  }

  let filtered = notes.filter((n) => {
    if (filterSubject !== "all" && n.subjectId !== filterSubject) return false;
    if (search) {
      const q = search.toLowerCase();
      return n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q) || n.tags.some((t) => t.includes(q));
    }
    return true;
  });

  filtered = [...filtered].sort((a, b) => {
    if (sortBy === "title") return a.title.localeCompare(b.title);
    if (sortBy === "subject") return a.subjectId.localeCompare(b.subjectId);
    return b.updatedAt - a.updatedAt;
  });

  return (
    <div className="p-4 lg:p-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold font-display text-ink-900 dark:text-white">My Notes</h1>
          <p className="text-sm text-ink-500 dark:text-gray-400 mt-0.5">{notes.length} note{notes.length !== 1 ? "s" : ""}</p>
        </div>
        <div className="sm:ml-auto flex items-center gap-2">
          <div className="relative flex-1 sm:w-56">
            <Icons.search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search notes..."
              className="input pl-8 py-2 text-xs"
            />
          </div>
          <button onClick={() => setEditing("new")} className="btn-primary text-xs whitespace-nowrap">
            <Icons.plus size={14} /> New Note
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <button
          onClick={() => setFilterSubject("all")}
          className={`chip ${filterSubject === "all" ? "chip-active" : ""}`}
        >
          All
        </button>
        {subjects.map((s) => (
          <button
            key={s.id}
            onClick={() => setFilterSubject(s.id)}
            className={`chip ${filterSubject === s.id ? "chip-active" : ""}`}
          >
            <span className="w-2 h-2 rounded-full" style={{ background: s.color }} />
            {s.name}
          </button>
        ))}

        <div className="ml-auto flex items-center gap-2">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortKey)}
            className="input py-1 text-xs w-28"
          >
            <option value="date">Date</option>
            <option value="title">Title</option>
            <option value="subject">Subject</option>
          </select>
          <button
            onClick={() => setViewMode(viewMode === "grid" ? "list" : "grid")}
            className="btn-ghost p-1.5"
          >
            {viewMode === "grid" ? <Icons.list size={16} /> : <Icons.grid size={16} />}
          </button>
        </div>
      </div>

      {/* Notes */}
      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-16 h-16 rounded-2xl bg-brand-50 dark:bg-brand-500/15 flex items-center justify-center mx-auto mb-4">
            <Icons.notes size={28} className="text-brand-500" />
          </div>
          <h3 className="text-lg font-semibold text-ink-800 dark:text-gray-200 mb-1">No notes yet</h3>
          <p className="text-sm text-ink-500 dark:text-gray-400 mb-4">Create your first note to get started</p>
          <button onClick={() => setEditing("new")} className="btn-primary text-sm">
            <Icons.plus size={16} /> Create Note
          </button>
        </div>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((note) => {
            const sub = subjects.find((s) => s.id === note.subjectId);
            return (
              <button
                key={note.id}
                onClick={() => setEditing(note)}
                className="card card-hover text-left p-4"
              >
                <div className="flex items-center gap-2 mb-2">
                  {sub && <span className="w-2.5 h-2.5 rounded-full" style={{ background: sub.color }} />}
                  <span className="text-xs text-ink-400 dark:text-gray-500">{sub?.name ?? "General"}</span>
                  <span className="ml-auto text-[10px] text-ink-400 dark:text-gray-500">{formatDate(note.updatedAt)}</span>
                </div>
                <h3 className="text-sm font-semibold text-ink-800 dark:text-gray-200 mb-1 line-clamp-1">{note.title || "Untitled"}</h3>
                <p className="text-xs text-ink-500 dark:text-gray-400 line-clamp-3 leading-relaxed">{note.content || "Empty note"}</p>
                {note.tags.length > 0 && (
                  <div className="flex items-center gap-1 mt-2 flex-wrap">
                    {note.tags.slice(0, 3).map((t) => (
                      <span key={t} className="chip text-[10px] py-0.5 px-2">{t}</span>
                    ))}
                    {note.tags.length > 3 && (
                      <span className="text-[10px] text-ink-400 dark:text-gray-500">+{note.tags.length - 3}</span>
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((note) => {
            const sub = subjects.find((s) => s.id === note.subjectId);
            return (
              <button
                key={note.id}
                onClick={() => setEditing(note)}
                className="card card-hover w-full text-left p-3 flex items-center gap-3"
              >
                {sub && <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: sub.color }} />}
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-ink-800 dark:text-gray-200 truncate">{note.title || "Untitled"}</h3>
                  <p className="text-xs text-ink-500 dark:text-gray-400 truncate">{note.content || "Empty note"}</p>
                </div>
                <span className="text-[10px] text-ink-400 dark:text-gray-500 flex-shrink-0">{formatDate(note.updatedAt)}</span>
                <Icons.chevronRight size={14} className="text-ink-300 dark:text-gray-600 flex-shrink-0" />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
