import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Icon, type IconName } from "../components/Icon";
import { useAppStore } from "../stores/appStore";

const SUBJECT_ICONS = ["📚", "🔬", "📐", "🌍", "🎨", "💻", "📖", "🧬", "⚡", "🎵", "🏛️", "🌱", "🧮", "🗺️", "✍️", "🔢"];
const SUBJECT_COLORS = ["#3B82F6", "#EF4444", "#22C55E", "#F59E0B", "#8B5CF6", "#EC4899", "#06B6D4", "#F97316"];

export function SubjectsPage() {
  const subjects = useAppStore((s) => s.subjects);
  const addSubject = useAppStore((s) => s.addSubject);
  const deleteSubject = useAppStore((s) => s.deleteSubject);
  const getSubjectStats = useAppStore((s) => s.getSubjectStats);

  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState("");
  const [icon, setIcon] = useState("📚");
  const [color, setColor] = useState("#3B82F6");
  const [desc, setDesc] = useState("");

  const handleCreate = () => {
    if (!name.trim()) return;
    addSubject(name.trim(), icon, color, desc.trim() || undefined);
    setShowCreate(false);
    setName("");
    setDesc("");
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-text-primary">My Subjects</h1>
          <p className="text-sm text-text-secondary mt-0.5">Organize your learning by subject</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn-primary">
          <Icon name="plus" className="h-4 w-4" /> New Subject
        </button>
      </div>

      {subjects.length === 0 ? (
        <div className="card flex flex-col items-center gap-4 py-12 text-center">
          <Icon name="graduation" className="h-8 w-8 text-accent" />
          <h2 className="text-lg font-semibold text-text-primary">No subjects yet</h2>
          <p className="text-sm text-text-secondary max-w-sm">Create subjects to organize your notes, flashcards, tests, and other materials.</p>
          <button onClick={() => setShowCreate(true)} className="btn-primary">
            <Icon name="plus" className="h-4 w-4" /> Create Subject
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {subjects.map((sub) => {
            const stats = getSubjectStats(sub.id);
            return (
              <div key={sub.id} className="card card-interactive p-5 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{sub.icon}</span>
                    <div>
                      <h3 className="text-base font-semibold text-text-primary">{sub.name}</h3>
                      {sub.description && <p className="text-xs text-text-tertiary">{sub.description}</p>}
                    </div>
                  </div>
                  <button onClick={() => deleteSubject(sub.id)} className="btn-ghost p-1.5 text-text-tertiary">
                    <Icon name="trash" className="h-3.5 w-3.5" />
                  </button>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="rounded-lg bg-surface-2 py-2">
                    <div className="text-sm font-bold text-text-primary">{stats.notes}</div>
                    <div className="text-[10px] text-text-tertiary">Notes</div>
                  </div>
                  <div className="rounded-lg bg-surface-2 py-2">
                    <div className="text-sm font-bold text-text-primary">{stats.flashcards}</div>
                    <div className="text-[10px] text-text-tertiary">Cards</div>
                  </div>
                  <div className="rounded-lg bg-surface-2 py-2">
                    <div className="text-sm font-bold text-text-primary">{stats.tests}</div>
                    <div className="text-[10px] text-text-tertiary">Tests</div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Link to="/app/tutor" className="btn-ghost text-xs flex-1 justify-center py-2">
                    <Icon name="brain" className="h-3.5 w-3.5" /> Ask AI
                  </Link>
                  <Link to="/app/notes" className="btn-ghost text-xs flex-1 justify-center py-2">
                    <Icon name="file-text" className="h-3.5 w-3.5" /> Notes
                  </Link>
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
            <h2 className="text-lg font-semibold text-text-primary">Create Subject</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1.5">Subject Name</label>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., Mathematics, Biology" className="input-field" autoFocus />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1.5">Icon</label>
                <div className="flex flex-wrap gap-2">
                  {SUBJECT_ICONS.map((i) => (
                    <button key={i} onClick={() => setIcon(i)} className={`h-10 w-10 rounded-lg text-xl flex items-center justify-center transition-all ${icon === i ? "ring-2 ring-accent bg-accent-subtle" : "bg-surface-2 hover:bg-surface-3"}`}>
                      {i}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1.5">Color</label>
                <div className="flex gap-2">
                  {SUBJECT_COLORS.map((c) => (
                    <button key={c} onClick={() => setColor(c)} className={`h-8 w-8 rounded-full transition-all ${color === c ? "ring-2 ring-offset-2 ring-text-primary" : ""}`} style={{ backgroundColor: c }} />
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1.5">Description (optional)</label>
                <input type="text" value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Brief description" className="input-field" />
              </div>
            </div>
            <button onClick={handleCreate} disabled={!name.trim()} className="btn-primary w-full">
              <Icon name="plus" className="h-4 w-4" /> Create Subject
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
