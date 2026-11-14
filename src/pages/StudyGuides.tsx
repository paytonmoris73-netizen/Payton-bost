import { useState } from "react";
import { Icon } from "../components/Icon";
import { useAppStore } from "../stores/appStore";

export function StudyGuidesPage() {
  const guides = useAppStore((s) => s.studyGuides);
  const addGuide = useAppStore((s) => s.addStudyGuide);
  const deleteGuide = useAppStore((s) => s.deleteStudyGuide);

  const [showCreate, setShowCreate] = useState(false);
  const [topic, setTopic] = useState("");
  const [style, setStyle] = useState<"comprehensive" | "quick" | "exam-prep" | "concept-map">("comprehensive");
  const [generating, setGenerating] = useState(false);
  const [activeGuideId, setActiveGuideId] = useState<string | null>(null);

  const activeGuide = guides.find((g) => g.id === activeGuideId);

  const handleGenerate = async () => {
    if (!topic.trim()) return;
    setGenerating(true);
    await new Promise((r) => setTimeout(r, 1500));

    const templates: Record<string, string> = {
      comprehensive: `# Comprehensive Study Guide: ${topic}\n\n## Overview\n${topic} is a multifaceted subject that encompasses several key areas of study. This guide provides a thorough overview of the most important concepts.\n\n## Key Concepts\n\n### 1. Foundational Principles\n- Core definitions and terminology\n- Historical context and development\n- Relationship to broader field\n\n### 2. Major Theories\n- Primary theoretical frameworks\n- Supporting evidence and research\n- Practical applications\n\n### 3. Important Details\n- Critical facts and figures\n- Common misconceptions to avoid\n- Edge cases and exceptions\n\n## Study Tips\n1. Start with the overview section to build context\n2. Focus on understanding relationships between concepts\n3. Use active recall to test yourself on key terms\n4. Create flashcards for important definitions\n5. Practice applying concepts to new scenarios\n\n## Review Questions\n1. What are the fundamental principles of ${topic}?\n2. How do the major theories relate to each other?\n3. What are the most common misconceptions?\n4. How can these concepts be applied practically?\n\n## Summary\nMastering ${topic} requires understanding both the theoretical foundations and practical applications. Focus on building connections between concepts rather than memorizing isolated facts.`,
      "quick": `# Quick Review: ${topic}\n\n## Must-Know Points\n- **Definition**: Core concept and scope of ${topic}\n- **Key Terms**: Essential vocabulary and definitions\n- **Main Ideas**: The 3-5 most important concepts\n- **Common Mistakes**: What to watch out for\n\n## Flash Summary\n${topic} involves understanding how fundamental principles interact within a structured framework. The key is recognizing patterns and applying knowledge systematically.\n\n## Quick Test Yourself\n1. Can you define ${topic} in one sentence?\n2. Name the three most important concepts\n3. What's the most common mistake students make?\n4. How does this connect to what you already know?`,
      "exam-prep": `# Exam Preparation: ${topic}\n\n## High-Priority Topics\nThese topics appear most frequently on exams:\n\n### Priority 1 (Very Likely)\n- Fundamental definitions and core concepts\n- Key formulas or frameworks\n- Standard application problems\n\n### Priority 2 (Likely)\n- Comparative analysis between related concepts\n- Real-world application scenarios\n- Historical development and context\n\n### Priority 3 (Possible)\n- Edge cases and exceptions\n- Advanced applications\n- Cross-disciplinary connections\n\n## Practice Problems\n1. **Recall**: Define the key terms of ${topic}\n2. **Application**: Apply the main framework to a new scenario\n3. **Analysis**: Compare and contrast two related concepts\n4. **Evaluation**: Assess the strengths and limitations of the primary theory\n\n## Last-Minute Checklist\n- [ ] Review all key definitions\n- [ ] Practice at least 5 application problems\n- [ ] Review common mistakes\n- [ ] Go through your flashcards one more time\n- [ ] Get a good night's sleep!`,
      "concept-map": `# Concept Map: ${topic}\n\n## Central Concept\n**${topic}** — the core subject connecting all related ideas\n\n## Branch 1: Foundations\n→ Historical Context\n  → Key Figures\n  → Major Developments\n→ Core Definitions\n  → Primary Terms\n  → Secondary Terms\n\n## Branch 2: Theories\n→ Theory A\n  → Evidence\n  → Applications\n→ Theory B\n  → Evidence\n  → Applications\n→ Connections between theories\n\n## Branch 3: Applications\n→ Academic Applications\n  → Research Methods\n  → Analysis Techniques\n→ Real-World Applications\n  → Professional Use\n  → Everyday Relevance\n\n## Branch 4: Assessment\n→ Key Questions\n→ Common Misconceptions\n→ Areas for Further Study\n\n## Connections\n- Foundations ↔ Theories: Theories build on foundational concepts\n- Theories ↔ Applications: Applications test theoretical predictions\n- Applications ↔ Assessment: Assessment evaluates applied understanding`,
    };

    addGuide({
      topic: topic.trim(),
      content: templates[style] || templates.comprehensive,
      style,
      sourceDocIds: [],
    });
    setGenerating(false);
    setTopic("");
    setShowCreate(false);
  };

  if (activeGuide) {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <button onClick={() => setActiveGuideId(null)} className="btn-ghost">
            <Icon name="arrow-left" className="h-4 w-4" /> Back
          </button>
          <div className="flex gap-2">
            <button onClick={() => { deleteGuide(activeGuide.id); setActiveGuideId(null); }} className="btn-ghost text-error">
              <Icon name="trash" className="h-4 w-4" /> Delete
            </button>
          </div>
        </div>
        <div className="card p-6">
          <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: activeGuide.content.replace(/^### (.+)$/gm, '<h3>$1</h3>').replace(/^## (.+)$/gm, '<h2>$1</h2>').replace(/^# (.+)$/gm, '<h1>$1</h1>').replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/^- (.+)$/gm, '<li>$1</li>').replace(/^(\d+)\. (.+)$/gm, '<li>$2</li>').replace(/\n/g, '<br/>') }} />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-text-primary">Study Guides</h1>
          <p className="text-sm text-text-secondary mt-0.5">AI-generated study guides for any topic</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn-primary">
          <Icon name="sparkles" className="h-4 w-4" /> Generate Guide
        </button>
      </div>

      {guides.length === 0 ? (
        <div className="card flex flex-col items-center gap-4 py-12 text-center">
          <Icon name="book-open" className="h-8 w-8 text-accent" />
          <h2 className="text-lg font-semibold text-text-primary">No study guides yet</h2>
          <p className="text-sm text-text-secondary max-w-sm">Generate comprehensive study guides on any topic using AI.</p>
          <button onClick={() => setShowCreate(true)} className="btn-primary">
            <Icon name="sparkles" className="h-4 w-4" /> Generate Your First Guide
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {guides.map((guide) => (
            <div key={guide.id} onClick={() => setActiveGuideId(guide.id)} className="card card-interactive p-4 space-y-3 cursor-pointer">
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent-subtle">
                  <Icon name="book-open" className="h-4.5 w-4.5 text-accent" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-semibold text-text-primary truncate">{guide.topic}</h3>
                  <span className="chip text-[10px] capitalize mt-0.5">{guide.style.replace("-", " ")}</span>
                </div>
              </div>
              <p className="text-xs text-text-tertiary line-clamp-3">{guide.content.slice(0, 150)}...</p>
              <div className="text-[10px] text-text-tertiary">{new Date(guide.createdAt).toLocaleDateString()}</div>
            </div>
          ))}
        </div>
      )}

      {showCreate && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center p-4" onClick={() => setShowCreate(false)}>
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />
          <div className="relative z-10 w-full max-w-md rounded-2xl border border-border bg-surface-0 shadow-modal animate-scale-in p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-semibold text-text-primary">Generate Study Guide</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1.5">Topic</label>
                <input type="text" value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="e.g., Photosynthesis, World War II" className="input-field" autoFocus />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1.5">Guide Style</label>
                <div className="grid grid-cols-2 gap-2">
                  {([
                    { value: "comprehensive" as const, label: "Comprehensive", desc: "Thorough coverage" },
                    { value: "quick" as const, label: "Quick Review", desc: "Key points only" },
                    { value: "exam-prep" as const, label: "Exam Prep", desc: "Test-focused" },
                    { value: "concept-map" as const, label: "Concept Map", desc: "Visual connections" },
                  ]).map((s) => (
                    <button key={s.value} onClick={() => setStyle(s.value)} className={`rounded-xl border p-3 text-left transition-all ${style === s.value ? "border-accent bg-accent-subtle" : "border-border"}`}>
                      <div className="text-sm font-medium text-text-primary">{s.label}</div>
                      <div className="text-[10px] text-text-tertiary">{s.desc}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <button onClick={handleGenerate} disabled={!topic.trim() || generating} className="btn-primary w-full">
              {generating ? <><Icon name="loader" className="h-4 w-4 animate-spin" /> Generating...</> : <><Icon name="sparkles" className="h-4 w-4" /> Generate Guide</>}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
