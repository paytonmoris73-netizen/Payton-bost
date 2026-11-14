import { useState } from "react";
import { Icon } from "../components/Icon";
import { useAppStore } from "../stores/appStore";

const NOTE_TYPES = [
  { id: "detailed", label: "Detailed Notes" },
  { id: "short", label: "Short Summary" },
  { id: "cornell", label: "Cornell Notes" },
  { id: "outline", label: "Outline" },
  { id: "qa", label: "Q&A Format" },
  { id: "vocab", label: "Vocabulary" },
  { id: "revision", label: "Revision Notes" },
  { id: "comparison", label: "Comparison Chart" },
];

export function NotesStudioPage() {
  const notes = useAppStore((s) => s.notes);
  const addNote = useAppStore((s) => s.addNote);
  const updateNote = useAppStore((s) => s.updateNote);
  const deleteNote = useAppStore((s) => s.deleteNote);
  const subjects = useAppStore((s) => s.subjects);

  const [activeId, setActiveId] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [generating, setGenerating] = useState(false);
  const [genTopic, setGenTopic] = useState("");
  const [genType, setGenType] = useState("detailed");
  const [showGen, setShowGen] = useState(false);

  const active = notes.find((n) => n.id === activeId);

  const handleNew = () => {
    const note = addNote({
      title: "Untitled Note",
      content: "",
      format: "rich",
      tags: [],
      subjectId: undefined,
    });
    setActiveId(note.id);
    setTitle(note.title);
    setContent(note.content);
    setEditing(true);
  };

  const handleSave = () => {
    if (activeId) {
      updateNote(activeId, { title, content });
      setEditing(false);
    }
  };

  const handleGenerate = async () => {
    if (!genTopic.trim()) return;
    setGenerating(true);
    await new Promise((r) => setTimeout(r, 1500));

    const generatedContent = genType === "cornell"
      ? `## ${genTopic}\n\n| Cues | Notes |\n|------|-------|\n| Key concept 1 | ${genTopic} involves understanding fundamental principles that connect different ideas together. |\n| Key concept 2 | The practical applications include problem-solving, analysis, and critical thinking. |\n| Key concept 3 | Historical context shows how these ideas developed over time. |\n| Important terms | Definitions of essential vocabulary related to ${genTopic}. |\n\n### Summary\n${genTopic} is a multifaceted subject that requires understanding both theoretical foundations and practical applications. The key takeaway is that mastery comes from connecting individual concepts into a coherent framework.`
      : genType === "qa"
      ? `## ${genTopic} — Questions & Answers\n\n**Q: What is the main idea of ${genTopic}?**\nA: The main idea centers on understanding how different components interact and influence each other within a system.\n\n**Q: Why is ${genTopic} important?**\nA: It provides the foundation for understanding more complex topics and has practical applications in real-world scenarios.\n\n**Q: What are the key terms to know?**\nA: Essential terms include: analysis, synthesis, evaluation, application, and comprehension.\n\n**Q: How can I study ${genTopic} effectively?**\nA: Use active recall, spaced repetition, and practice problems. Connect new information to what you already know.\n\n**Q: What are common mistakes students make?**\nA: Common mistakes include memorizing without understanding, skipping foundational concepts, and not practicing application.`
      : genType === "outline"
      ? `# ${genTopic}\n\n## I. Introduction\n   A. Definition and overview\n   B. Historical background\n   C. Importance and relevance\n\n## II. Key Concepts\n   A. Fundamental principles\n      1. First principle and explanation\n      2. Second principle and explanation\n   B. Core theories\n      1. Main theory overview\n      2. Supporting evidence\n   C. Important terminology\n\n## III. Applications\n   A. Real-world examples\n   B. Problem-solving approaches\n   C. Connections to other subjects\n\n## IV. Common Challenges\n   A. Frequently misunderstood concepts\n   B. Typical mistakes to avoid\n   C. Tips for mastery\n\n## V. Summary\n   A. Key takeaways\n   B. Review questions\n   C. Further reading suggestions`
      : genType === "short"
      ? `## ${genTopic} — Quick Summary\n\n**Key Points:**\n- ${genTopic} involves understanding foundational principles and their interconnections\n- Practical applications extend across multiple domains\n- Success requires both theoretical knowledge and hands-on practice\n\n**Essential Terms:**\n- Analysis, Synthesis, Evaluation, Application\n\n**Remember:**\nThe most important thing is to understand *why* things work, not just *what* they are. Connect new concepts to existing knowledge for better retention.`
      : `## ${genTopic}\n\n### Overview\n${genTopic} is an important area of study that encompasses several key concepts and principles. Understanding this topic thoroughly requires exploring its foundations, applications, and connections to related subjects.\n\n### Key Concepts\n\n**1. Fundamental Principles**\nThe foundation of ${genTopic} rests on several core ideas:\n- Understanding how individual elements interact within a system\n- Recognizing patterns and relationships between different components\n- Applying theoretical knowledge to practical situations\n\n**2. Important Terminology**\n- **Analysis**: Breaking down complex information into smaller, manageable parts\n- **Synthesis**: Combining different elements to create a new understanding\n- **Evaluation**: Making informed judgments based on evidence and criteria\n- **Application**: Using knowledge to solve real-world problems\n\n**3. Historical Context**\nThe study of ${genTopic} has evolved significantly over time. Key developments include major theoretical breakthroughs, practical discoveries, and paradigm shifts that have shaped our current understanding.\n\n### Applications\n- Problem-solving in academic and professional contexts\n- Critical thinking and analytical reasoning\n- Research and investigation methodologies\n\n### Common Misconceptions\n1. Memorization is sufficient — understanding and application are equally important\n2. Concepts exist in isolation — they are deeply interconnected\n3. There is only one correct approach — multiple valid methods exist\n\n### Study Tips\n- Use active recall techniques\n- Practice with real examples\n- Create connections between related topics\n- Review regularly using spaced repetition\n- Teach concepts to others to reinforce understanding\n\n### Review Questions\n1. What are the fundamental principles of ${genTopic}?\n2. How do the key concepts relate to each other?\n3. Give a real-world example of how this topic applies.\n4. What is the most common misunderstanding about this topic?`;

    const note = addNote({
      title: `${genTopic} — ${NOTE_TYPES.find((t) => t.id === genType)?.label ?? "Notes"}`,
      content: generatedContent,
      format: genType === "cornell" ? "cornell" : genType === "outline" ? "outline" : genType === "qa" ? "qa" : "rich",
      tags: [genTopic.toLowerCase()],
      subjectId: undefined,
    });
    setActiveId(note.id);
    setTitle(note.title);
    setContent(note.content);
    setGenerating(false);
    setShowGen(false);
  };

  if (editing && activeId) {
    return (
      <div className="max-w-4xl mx-auto space-y-4">
        <div className="flex items-center justify-between">
          <button onClick={() => { handleSave(); setActiveId(null); setEditing(false); }} className="btn-ghost">
            <Icon name="arrow-left" className="h-4 w-4" /> Back
          </button>
          <div className="flex gap-2">
            <button onClick={handleSave} className="btn-primary py-2">
              <Icon name="check" className="h-4 w-4" /> Save
            </button>
          </div>
        </div>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full bg-transparent text-2xl font-semibold text-text-primary outline-none border-none placeholder:text-text-tertiary"
          placeholder="Note title"
        />
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="w-full min-h-[60vh] bg-transparent text-text-primary outline-none border-none resize-none leading-relaxed text-sm font-mono"
          placeholder="Start typing your notes..."
        />
      </div>
    );
  }

  if (activeId && active) {
    return (
      <div className="max-w-4xl mx-auto space-y-4">
        <div className="flex items-center justify-between">
          <button onClick={() => setActiveId(null)} className="btn-ghost">
            <Icon name="arrow-left" className="h-4 w-4" /> Back
          </button>
          <div className="flex gap-2">
            <button onClick={() => { setTitle(active.title); setContent(active.content); setEditing(true); }} className="btn-secondary py-2">
              <Icon name="edit" className="h-4 w-4" /> Edit
            </button>
            <button className="btn-ghost p-2 text-text-tertiary" title="Listen">
              <Icon name="headphones" className="h-4 w-4" />
            </button>
          </div>
        </div>
        <h1 className="text-2xl font-semibold text-text-primary">{active.title}</h1>
        <div className="text-xs text-text-tertiary">
          {new Date(active.updatedAt).toLocaleString()} &middot; v{active.version}
        </div>
        <div className="prose text-sm leading-relaxed text-text-primary" dangerouslySetInnerHTML={{
          __html: active.content
            .replace(/^### (.*$)/gm, '<h3>$1</h3>')
            .replace(/^## (.*$)/gm, '<h2>$1</h2>')
            .replace(/^# (.*$)/gm, '<h1>$1</h1>')
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/^- (.*$)/gm, '<li>$1</li>')
            .replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>')
            .replace(/\n\n/g, '</p><p>')
            .replace(/\n/g, '<br/>')
        }} />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-text-primary">Notes Studio</h1>
          <p className="text-sm text-text-secondary mt-0.5">Create, edit, and generate beautiful study notes</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowGen(true)} className="btn-secondary">
            <Icon name="sparkles" className="h-4 w-4" /> AI Generate
          </button>
          <button onClick={handleNew} className="btn-primary">
            <Icon name="plus" className="h-4 w-4" /> New Note
          </button>
        </div>
      </div>

      {notes.length === 0 ? (
        <div className="card flex flex-col items-center gap-4 py-12 text-center">
          <Icon name="file-text" className="h-8 w-8 text-accent" />
          <h2 className="text-lg font-semibold text-text-primary">No notes yet</h2>
          <p className="text-sm text-text-secondary">Create notes manually or let AI generate them from any topic.</p>
          <div className="flex gap-2">
            <button onClick={handleNew} className="btn-secondary">
              <Icon name="plus" className="h-4 w-4" /> Manual Note
            </button>
            <button onClick={() => setShowGen(true)} className="btn-primary">
              <Icon name="sparkles" className="h-4 w-4" /> AI Generate
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {notes.map((note) => (
            <div key={note.id} onClick={() => { setActiveId(note.id); }} className="card card-interactive p-4 space-y-2 cursor-pointer">
              <div className="flex items-start justify-between">
                <Icon name="file-text" className="h-5 w-5 text-accent shrink-0" />
                <button onClick={(e) => { e.stopPropagation(); deleteNote(note.id); }} className="btn-ghost p-1 text-text-tertiary">
                  <Icon name="trash" className="h-3.5 w-3.5" />
                </button>
              </div>
              <h3 className="text-sm font-semibold text-text-primary line-clamp-2">{note.title}</h3>
              <p className="text-xs text-text-tertiary line-clamp-3">{note.content.replace(/[#*|_`]/g, "").slice(0, 150)}</p>
              <div className="text-[11px] text-text-tertiary">{new Date(note.updatedAt).toLocaleDateString()}</div>
            </div>
          ))}
        </div>
      )}

      {/* AI Generate Modal */}
      {showGen && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center p-4" onClick={() => !generating && setShowGen(false)}>
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />
          <div className="relative z-10 w-full max-w-lg rounded-2xl border border-border bg-surface-0 shadow-modal animate-scale-in p-6 space-y-5" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-text-primary">Generate Notes with AI</h2>
              <button onClick={() => !generating && setShowGen(false)} className="btn-ghost p-1.5"><Icon name="x" className="h-5 w-5" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1.5">Topic</label>
                <input type="text" value={genTopic} onChange={(e) => setGenTopic(e.target.value)} placeholder="e.g., Photosynthesis, WW2 Causes" className="input-field" autoFocus />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1.5">Note Style</label>
                <div className="grid grid-cols-2 gap-2">
                  {NOTE_TYPES.map((t) => (
                    <button key={t.id} onClick={() => setGenType(t.id)} className={`card card-interactive p-2.5 text-sm text-left ${genType === t.id ? "ring-2 ring-accent border-accent" : ""}`}>
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <button onClick={handleGenerate} disabled={!genTopic.trim() || generating} className="btn-primary w-full">
              {generating ? <><Icon name="loader" className="h-4 w-4 animate-spin" /> Generating...</> : <><Icon name="sparkles" className="h-4 w-4" /> Generate Notes</>}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
