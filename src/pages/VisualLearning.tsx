import { useState } from "react";
import { Icon } from "../components/Icon";


export function VisualLearningPage() {
  const [tool, setTool] = useState<"mindmap" | "timeline" | "diagram" | null>(null);

  if (tool === "mindmap") return <MindMapTool onBack={() => setTool(null)} />;
  if (tool === "timeline") return <TimelineTool onBack={() => setTool(null)} />;
  if (tool === "diagram") return <DiagramTool onBack={() => setTool(null)} />;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-text-primary">Visual Learning</h1>
        <p className="text-sm text-text-secondary mt-0.5">Create mind maps, timelines, and diagrams</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { type: "mindmap" as const, name: "Mind Map", desc: "Map connections between concepts", icon: "compass" as const, color: "bg-blue-500/10 text-blue-500" },
          { type: "timeline" as const, name: "Timeline", desc: "Visualize events in order", icon: "clock" as const, color: "bg-green-500/10 text-green-600" },
          { type: "diagram" as const, name: "Flowchart", desc: "Create process diagrams", icon: "map" as const, color: "bg-purple-500/10 text-purple-500" },
        ].map((t) => (
          <button key={t.type} onClick={() => setTool(t.type)} className="card card-interactive p-6 text-left space-y-3">
            <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${t.color}`}>
              <Icon name={t.icon} className="h-6 w-6" />
            </div>
            <h3 className="text-base font-semibold text-text-primary">{t.name}</h3>
            <p className="text-sm text-text-tertiary">{t.desc}</p>
          </button>
        ))}
      </div>
    </div>
  );
}

function MindMapTool({ onBack }: { onBack: () => void }) {
  const [topic, setTopic] = useState("");
  const [nodes, setNodes] = useState<{ id: string; label: string; level: number; parent?: string }[]>([]);
  const [generated, setGenerated] = useState(false);

  const generate = () => {
    if (!topic.trim()) return;
    const t = topic.trim();
    setNodes([
      { id: "0", label: t, level: 0 },
      { id: "1", label: "Key Concepts", level: 1, parent: "0" },
      { id: "2", label: "History", level: 1, parent: "0" },
      { id: "3", label: "Applications", level: 1, parent: "0" },
      { id: "4", label: "Related Fields", level: 1, parent: "0" },
      { id: "5", label: "Definition", level: 2, parent: "1" },
      { id: "6", label: "Core Principles", level: 2, parent: "1" },
      { id: "7", label: "Terminology", level: 2, parent: "1" },
      { id: "8", label: "Origins", level: 2, parent: "2" },
      { id: "9", label: "Key Figures", level: 2, parent: "2" },
      { id: "10", label: "Milestones", level: 2, parent: "2" },
      { id: "11", label: "Academic", level: 2, parent: "3" },
      { id: "12", label: "Professional", level: 2, parent: "3" },
      { id: "13", label: "Everyday", level: 2, parent: "3" },
    ]);
    setGenerated(true);
  };

  const colors = ["bg-accent text-text-inverse", "bg-blue-500 text-white", "bg-green-500 text-white", "bg-purple-500 text-white", "bg-amber-500 text-white"];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <button onClick={onBack} className="btn-ghost"><Icon name="arrow-left" className="h-4 w-4" /> Back</button>
        <h2 className="text-base font-semibold text-text-primary">Mind Map</h2>
        <div />
      </div>

      {!generated ? (
        <div className="card p-6 max-w-md mx-auto space-y-4">
          <label className="block text-sm font-medium text-text-primary">Central Topic</label>
          <input type="text" value={topic} onChange={(e) => setTopic(e.target.value)} onKeyDown={(e) => e.key === "Enter" && generate()} placeholder="e.g., Cell Biology" className="input-field" autoFocus />
          <button onClick={generate} disabled={!topic.trim()} className="btn-primary w-full">
            <Icon name="sparkles" className="h-4 w-4" /> Generate Mind Map
          </button>
        </div>
      ) : (
        <div className="card p-6 overflow-auto">
          <div className="min-w-[600px]">
            {/* Center node */}
            <div className="flex flex-col items-center gap-6">
              <div className={`${colors[0]} rounded-2xl px-6 py-3 text-base font-bold shadow-lg`}>
                {nodes[0]?.label}
              </div>
              <div className="grid grid-cols-4 gap-8 w-full">
                {nodes.filter((n) => n.level === 1).map((branch, bi) => (
                  <div key={branch.id} className="flex flex-col items-center gap-3">
                    <div className="h-6 w-px bg-border" />
                    <div className={`${colors[(bi % 4) + 1]} rounded-xl px-4 py-2 text-sm font-semibold shadow-md text-center`}>
                      {branch.label}
                    </div>
                    <div className="flex flex-col items-center gap-2">
                      {nodes.filter((n) => n.parent === branch.id).map((leaf) => (
                        <div key={leaf.id} className="flex items-center gap-2">
                          <div className="h-px w-4 bg-border" />
                          <div className="rounded-lg border border-border bg-surface-1 px-3 py-1.5 text-xs font-medium text-text-primary whitespace-nowrap">
                            {leaf.label}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function TimelineTool({ onBack }: { onBack: () => void }) {
  const [topic, setTopic] = useState("");
  const [events, setEvents] = useState<{ year: string; title: string; desc: string }[]>([]);

  const generate = () => {
    if (!topic.trim()) return;
    setEvents([
      { year: "Phase 1", title: "Discovery & Foundations", desc: `Early observations and foundational work in ${topic}` },
      { year: "Phase 2", title: "Theoretical Development", desc: "Key theories established and initial frameworks created" },
      { year: "Phase 3", title: "Major Breakthroughs", desc: "Significant advances that changed understanding" },
      { year: "Phase 4", title: "Modern Applications", desc: "Practical applications developed from theoretical knowledge" },
      { year: "Phase 5", title: "Current Research", desc: "Ongoing research and future directions" },
    ]);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <button onClick={onBack} className="btn-ghost"><Icon name="arrow-left" className="h-4 w-4" /> Back</button>
        <h2 className="text-base font-semibold text-text-primary">Timeline</h2>
        <div />
      </div>

      {events.length === 0 ? (
        <div className="card p-6 max-w-md mx-auto space-y-4">
          <label className="block text-sm font-medium text-text-primary">Topic</label>
          <input type="text" value={topic} onChange={(e) => setTopic(e.target.value)} onKeyDown={(e) => e.key === "Enter" && generate()} placeholder="e.g., The Industrial Revolution" className="input-field" autoFocus />
          <button onClick={generate} disabled={!topic.trim()} className="btn-primary w-full">
            <Icon name="sparkles" className="h-4 w-4" /> Generate Timeline
          </button>
        </div>
      ) : (
        <div className="relative pl-8">
          <div className="absolute left-3 top-0 bottom-0 w-0.5 bg-border" />
          {events.map((e, i) => (
            <div key={i} className="relative mb-8 last:mb-0">
              <div className="absolute -left-5 top-1 h-4 w-4 rounded-full border-2 border-accent bg-surface-0" />
              <div className="card p-4 ml-4">
                <span className="chip text-[10px] mb-2">{e.year}</span>
                <h3 className="text-sm font-semibold text-text-primary">{e.title}</h3>
                <p className="text-xs text-text-secondary mt-1">{e.desc}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function DiagramTool({ onBack }: { onBack: () => void }) {
  const [topic, setTopic] = useState("");
  const [steps, setSteps] = useState<string[]>([]);

  const generate = () => {
    if (!topic.trim()) return;
    setSteps([
      `Start: Define ${topic}`,
      "Gather information and resources",
      "Analyze key components",
      "Identify relationships",
      "Decision: Sufficient data?",
      "Synthesize findings",
      "Draw conclusions",
      "End: Apply knowledge",
    ]);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <button onClick={onBack} className="btn-ghost"><Icon name="arrow-left" className="h-4 w-4" /> Back</button>
        <h2 className="text-base font-semibold text-text-primary">Flowchart</h2>
        <div />
      </div>

      {steps.length === 0 ? (
        <div className="card p-6 max-w-md mx-auto space-y-4">
          <label className="block text-sm font-medium text-text-primary">Process Topic</label>
          <input type="text" value={topic} onChange={(e) => setTopic(e.target.value)} onKeyDown={(e) => e.key === "Enter" && generate()} placeholder="e.g., Scientific Method" className="input-field" autoFocus />
          <button onClick={generate} disabled={!topic.trim()} className="btn-primary w-full">
            <Icon name="sparkles" className="h-4 w-4" /> Generate Flowchart
          </button>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-2">
          {steps.map((step, i) => {
            const isDecision = step.startsWith("Decision:");
            const isTerminal = step.startsWith("Start:") || step.startsWith("End:");
            return (
              <div key={i} className="flex flex-col items-center">
                <div className={`px-6 py-3 text-sm font-medium text-center border shadow-sm ${
                  isDecision ? "rotate-0 bg-amber-500/10 border-amber-500/30 text-amber-600 rounded-xl" :
                  isTerminal ? "bg-accent-subtle border-accent/30 text-accent-text rounded-full" :
                  "bg-surface-1 border-border text-text-primary rounded-xl"
                }`} style={{ minWidth: 200 }}>
                  {step}
                </div>
                {i < steps.length - 1 && (
                  <div className="flex flex-col items-center">
                    <div className="h-4 w-px bg-border" />
                    <Icon name="chevron-down" className="h-3 w-3 text-text-tertiary -mt-1" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
