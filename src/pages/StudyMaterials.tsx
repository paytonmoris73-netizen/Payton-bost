import { useState, useRef } from "react";
import { Icons } from "../components/Icons";
import { useStore } from "../state/store";

type ConversionType =
  | "flashcards" | "quiz" | "exam" | "summary" | "study-guide"
  | "vocabulary" | "mind-map" | "formula-sheet" | "podcast";

const CONVERSIONS: { type: ConversionType; label: string; desc: string; icon: keyof typeof Icons }[] = [
  { type: "flashcards", label: "Flashcards", desc: "Generate study cards", icon: "flashcards" },
  { type: "quiz", label: "Quiz", desc: "Create a practice quiz", icon: "quiz" },
  { type: "exam", label: "Practice Exam", desc: "Full practice test", icon: "exam" },
  { type: "summary", label: "Summary", desc: "Key points overview", icon: "notes" },
  { type: "study-guide", label: "Study Guide", desc: "Comprehensive guide", icon: "study" },
  { type: "vocabulary", label: "Vocabulary List", desc: "Key terms & definitions", icon: "list" },
  { type: "mind-map", label: "Mind Map", desc: "Visual concept map", icon: "brain" },
  { type: "formula-sheet", label: "Formula Sheet", desc: "Important formulas", icon: "file" },
  { type: "podcast", label: "Podcast", desc: "Audio explanation", icon: "podcast" },
];

const DEMO_RESULTS: Record<ConversionType, string> = {
  flashcards: "Generated 12 flashcards covering key concepts from your material. Head to Flashcards to study them!",
  quiz: "Created a 10-question quiz with multiple choice and true/false questions. Check your Quizzes page!",
  exam: "Built a 25-question practice exam with a 45-minute time limit. Visit Practice Exams to take it!",
  summary: "**Key Points Summary**\n\n1. The main concept revolves around understanding core principles.\n2. Several supporting details strengthen the argument.\n3. Key vocabulary terms were identified and defined.\n4. Important dates and figures were extracted.\n5. Connections between topics were highlighted.",
  "study-guide": "**Study Guide**\n\nSection 1: Introduction & Overview\nSection 2: Core Concepts\nSection 3: Key Definitions\nSection 4: Examples & Applications\nSection 5: Review Questions\n\nYour complete study guide has been saved to My Notes.",
  vocabulary: "**Vocabulary List (8 terms)**\n\n1. **Hypothesis** — A proposed explanation for a phenomenon\n2. **Variable** — A factor that can change in an experiment\n3. **Control group** — The group that remains unchanged\n4. **Dependent variable** — The variable being measured\n5. **Independent variable** — The variable being manipulated\n6. **Data** — Facts and statistics collected for analysis\n7. **Conclusion** — The final outcome of an investigation\n8. **Theory** — A well-substantiated explanation",
  "mind-map": "Mind map generated with 5 main branches and 15 sub-topics. Saved to your Study Materials library.",
  "formula-sheet": "**Formula Sheet**\n\nArea of Circle: A = πr²\nPythagorean Theorem: a² + b² = c²\nQuadratic Formula: x = (-b ± √(b²-4ac)) / 2a\nSlope: m = (y₂-y₁) / (x₂-x₁)\nDistance: d = √((x₂-x₁)² + (y₂-y₁)²)",
  podcast: "A 5-minute AI podcast has been generated covering the key concepts. Click play to listen!",
};

export function StudyMaterialsPage() {
  const { notes, subjects } = useStore();
  const [content, setContent] = useState("");
  const [fileName, setFileName] = useState<string | null>(null);
  const [generating, setGenerating] = useState<ConversionType | null>(null);
  const [result, setResult] = useState<{ type: ConversionType; text: string } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const hasContent = content.trim().length > 0 || fileName !== null;

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFileName(file.name);
      if (file.type.startsWith("text/")) {
        const reader = new FileReader();
        reader.onload = () => setContent(reader.result as string);
        reader.readAsText(file);
      } else {
        setContent(`[Uploaded file: ${file.name}]`);
      }
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) {
      setFileName(file.name);
      setContent(`[Uploaded file: ${file.name}]`);
    }
  };

  const generate = (type: ConversionType) => {
    setGenerating(type);
    setResult(null);
    setTimeout(() => {
      setGenerating(null);
      setResult({ type, text: DEMO_RESULTS[type] });
    }, 1500);
  };

  return (
    <div className="p-4 lg:p-6 max-w-5xl mx-auto space-y-6 animate-fade-up">
      <div>
        <h1 className="text-2xl font-bold font-display text-ink-900 dark:text-white">Study Materials</h1>
        <p className="text-sm text-ink-500 dark:text-gray-400 mt-1">
          Convert any learning material into flashcards, quizzes, summaries, and more
        </p>
      </div>

      {/* Upload / input */}
      <div className="card p-5 space-y-4">
        <h2 className="text-base font-bold text-ink-900 dark:text-white">Add Content</h2>

        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          onClick={() => fileRef.current?.click()}
          className="border-2 border-dashed border-warm-300 dark:border-dark-border rounded-xl p-8 text-center cursor-pointer hover:border-brand-400 dark:hover:border-brand-500 transition-colors"
        >
          <Icons.upload size={32} className="mx-auto text-ink-300 dark:text-gray-600 mb-2" />
          <p className="text-sm font-medium text-ink-600 dark:text-gray-400">
            {fileName ? fileName : "Drop a file here or click to upload"}
          </p>
          <p className="text-xs text-ink-400 dark:text-gray-500 mt-1">PDF, images, documents, presentations</p>
          <input ref={fileRef} type="file" className="hidden" accept=".pdf,.png,.jpg,.jpeg,.doc,.docx,.ppt,.pptx,.txt" onChange={handleFile} />
        </div>

        <textarea
          className="input resize-none"
          rows={4}
          placeholder="Or paste your notes, text, or content here..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />

        {/* Quick sources */}
        <div className="flex flex-wrap gap-2">
          <span className="text-xs text-ink-500 dark:text-gray-500 self-center mr-1">Quick source:</span>
          {notes.length > 0 && (
            <button
              onClick={() => {
                const n = notes[0];
                setContent(n.content || n.title);
                setFileName(null);
              }}
              className="chip chip-active"
            >
              <Icons.notes size={12} /> From Notes
            </button>
          )}
          <button className="chip" onClick={() => {}}>
            <Icons.record size={12} /> From Recordings
          </button>
          <button className="chip" onClick={() => {}}>
            <Icons.flashcards size={12} /> From Flashcards
          </button>
        </div>
      </div>

      {/* Conversion options */}
      {hasContent && (
        <div className="card p-5 animate-fade-in">
          <h2 className="text-base font-bold text-ink-900 dark:text-white mb-4">Convert To</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {CONVERSIONS.map((c) => {
              const Ic = Icons[c.icon];
              const isGenerating = generating === c.type;
              return (
                <button
                  key={c.type}
                  onClick={() => generate(c.type)}
                  disabled={generating !== null}
                  className="card card-hover p-4 text-left group disabled:opacity-60"
                >
                  <div className="w-9 h-9 rounded-lg bg-brand-50 dark:bg-brand-500/15 flex items-center justify-center text-brand-600 dark:text-brand-400 mb-2 group-hover:bg-brand-100 dark:group-hover:bg-brand-500/25 transition-colors">
                    {isGenerating ? <Icons.loader size={18} /> : <Ic size={18} />}
                  </div>
                  <p className="text-sm font-semibold text-ink-800 dark:text-gray-200">{c.label}</p>
                  <p className="text-xs text-ink-400 dark:text-gray-500 mt-0.5">{c.desc}</p>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Result */}
      {result && (
        <div className="card p-5 animate-fade-in">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-bold text-ink-900 dark:text-white">
              {CONVERSIONS.find((c) => c.type === result.type)?.label} Result
            </h2>
            <button onClick={() => setResult(null)} className="btn-ghost p-1">
              <Icons.x size={16} />
            </button>
          </div>
          <div className="prose prose-sm dark:prose-invert max-w-none">
            {result.text.split("\n").map((line, i) => {
              if (line.startsWith("**") && line.endsWith("**"))
                return <h3 key={i} className="text-base font-bold text-ink-900 dark:text-white mt-3 mb-1">{line.replace(/\*\*/g, "")}</h3>;
              if (line.match(/^\d+\./))
                return <p key={i} className="text-sm text-ink-700 dark:text-gray-300 ml-2">{line}</p>;
              if (line.trim() === "") return <br key={i} />;
              return <p key={i} className="text-sm text-ink-700 dark:text-gray-300">{line}</p>;
            })}
          </div>
          <div className="flex gap-2 mt-4">
            <button className="btn-secondary text-sm">
              <Icons.download size={14} /> Save
            </button>
            <button className="btn-ghost text-sm">
              <Icons.edit size={14} /> Edit
            </button>
          </div>
        </div>
      )}

      {/* Empty state when no content */}
      {!hasContent && (
        <div className="text-center py-12">
          <Icons.study size={40} className="mx-auto text-ink-300 dark:text-gray-600 mb-3" />
          <p className="text-sm text-ink-500 dark:text-gray-400">
            Upload a file or paste your content to get started
          </p>
        </div>
      )}
    </div>
  );
}
