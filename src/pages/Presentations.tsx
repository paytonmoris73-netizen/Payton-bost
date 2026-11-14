import { useState } from "react";
import { Icon } from "../components/Icon";

interface Slide { title: string; content: string; type: "title" | "content" | "bullets" | "image" | "quote" }

export function PresentationsPage() {
  const [topic, setTopic] = useState("");
  const [slides, setSlides] = useState<Slide[]>([]);
  const [activeSlide, setActiveSlide] = useState(0);
  const [generating, setGenerating] = useState(false);
  const [presenting, setPresenting] = useState(false);

  const generate = async () => {
    if (!topic.trim()) return;
    setGenerating(true);
    await new Promise((r) => setTimeout(r, 1500));

    const t = topic.trim();
    setSlides([
      { title: t, content: "An Interactive Presentation", type: "title" },
      { title: "Overview", content: `This presentation covers the key aspects of ${t}, including foundational concepts, important details, and practical applications.`, type: "content" },
      { title: "Key Concepts", content: "• Foundational principles and definitions\n• Core theories and frameworks\n• Important terminology\n• Historical context", type: "bullets" },
      { title: "Deep Dive", content: `Understanding ${t} requires examining how different components interact. The relationship between theory and practice is central to mastering this subject.`, type: "content" },
      { title: "Important Details", content: "• Evidence-based findings\n• Common misconceptions\n• Critical analysis points\n• Connections to related topics", type: "bullets" },
      { title: `"The more I learn, the more I realize how much I don't know."`, content: "— Albert Einstein", type: "quote" },
      { title: "Applications", content: "• Academic research and study\n• Professional development\n• Problem-solving frameworks\n• Cross-disciplinary connections", type: "bullets" },
      { title: "Summary & Next Steps", content: `Continue exploring ${t} through active practice, spaced repetition, and connecting concepts to real-world applications.`, type: "content" },
      { title: "Thank You", content: `Questions about ${t}?`, type: "title" },
    ]);
    setActiveSlide(0);
    setGenerating(false);
  };

  if (presenting && slides.length > 0) {
    const slide = slides[activeSlide];
    return (
      <div className="fixed inset-0 z-[100] bg-[#1a1a2e] flex flex-col" onClick={(e) => {
        const rect = (e.target as HTMLElement).getBoundingClientRect();
        if (e.clientX > rect.width / 2) setActiveSlide((i) => Math.min(slides.length - 1, i + 1));
        else setActiveSlide((i) => Math.max(0, i - 1));
      }}>
        <button onClick={(e) => { e.stopPropagation(); setPresenting(false); }} className="absolute top-4 right-4 z-10 text-white/60 hover:text-white p-2">
          <Icon name="x" className="h-6 w-6" />
        </button>
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="max-w-3xl text-center space-y-6">
            {slide.type === "title" && (
              <>
                <h1 className="text-4xl sm:text-5xl font-bold text-white leading-tight">{slide.title}</h1>
                <p className="text-xl text-white/60">{slide.content}</p>
              </>
            )}
            {slide.type === "content" && (
              <>
                <h2 className="text-3xl font-bold text-white">{slide.title}</h2>
                <p className="text-lg text-white/80 leading-relaxed">{slide.content}</p>
              </>
            )}
            {slide.type === "bullets" && (
              <>
                <h2 className="text-3xl font-bold text-white">{slide.title}</h2>
                <div className="text-left max-w-lg mx-auto space-y-3">
                  {slide.content.split("\n").map((line, i) => (
                    <p key={i} className="text-lg text-white/80">{line}</p>
                  ))}
                </div>
              </>
            )}
            {slide.type === "quote" && (
              <div className="space-y-4">
                <p className="text-2xl sm:text-3xl font-serif italic text-white/90 leading-relaxed">{slide.title}</p>
                <p className="text-lg text-white/50">{slide.content}</p>
              </div>
            )}
          </div>
        </div>
        <div className="p-4 flex items-center justify-center gap-1.5">
          {slides.map((_, i) => (
            <button key={i} onClick={(e) => { e.stopPropagation(); setActiveSlide(i); }} className={`h-1.5 rounded-full transition-all ${i === activeSlide ? "w-8 bg-white" : "w-1.5 bg-white/30"}`} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-text-primary">Presentations</h1>
        <p className="text-sm text-text-secondary mt-0.5">Generate AI-powered presentations on any topic</p>
      </div>

      {slides.length === 0 ? (
        <div className="card p-8 max-w-lg mx-auto space-y-5 text-center">
          <Icon name="presentation" className="h-10 w-10 text-accent mx-auto" />
          <h2 className="text-lg font-semibold text-text-primary">Create a Presentation</h2>
          <p className="text-sm text-text-secondary">Enter a topic and AI will generate a complete slide deck.</p>
          <input type="text" value={topic} onChange={(e) => setTopic(e.target.value)} onKeyDown={(e) => e.key === "Enter" && generate()} placeholder="e.g., Climate Change, Machine Learning" className="input-field" />
          <button onClick={generate} disabled={!topic.trim() || generating} className="btn-primary w-full">
            {generating ? <><Icon name="loader" className="h-4 w-4 animate-spin" /> Generating...</> : <><Icon name="sparkles" className="h-4 w-4" /> Generate Presentation</>}
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <button onClick={() => setSlides([])} className="btn-ghost"><Icon name="arrow-left" className="h-4 w-4" /> New</button>
            <div className="flex gap-2">
              <span className="text-sm text-text-secondary">Slide {activeSlide + 1} of {slides.length}</span>
              <button onClick={() => setPresenting(true)} className="btn-primary">
                <Icon name="play" className="h-4 w-4" filled /> Present
              </button>
            </div>
          </div>

          {/* Slide preview */}
          <div className="card aspect-video flex items-center justify-center p-8 bg-gradient-to-br from-surface-0 to-surface-2">
            <div className="text-center space-y-4 max-w-lg">
              {slides[activeSlide].type === "title" && (
                <>
                  <h2 className="text-2xl sm:text-3xl font-bold text-text-primary">{slides[activeSlide].title}</h2>
                  <p className="text-base text-text-secondary">{slides[activeSlide].content}</p>
                </>
              )}
              {slides[activeSlide].type === "content" && (
                <>
                  <h2 className="text-xl font-bold text-text-primary">{slides[activeSlide].title}</h2>
                  <p className="text-sm text-text-secondary leading-relaxed">{slides[activeSlide].content}</p>
                </>
              )}
              {slides[activeSlide].type === "bullets" && (
                <>
                  <h2 className="text-xl font-bold text-text-primary">{slides[activeSlide].title}</h2>
                  <div className="text-left space-y-1">
                    {slides[activeSlide].content.split("\n").map((line, i) => (
                      <p key={i} className="text-sm text-text-secondary">{line}</p>
                    ))}
                  </div>
                </>
              )}
              {slides[activeSlide].type === "quote" && (
                <>
                  <p className="text-lg font-serif italic text-text-primary">{slides[activeSlide].title}</p>
                  <p className="text-sm text-text-tertiary">{slides[activeSlide].content}</p>
                </>
              )}
            </div>
          </div>

          {/* Slide strip */}
          <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
            {slides.map((s, i) => (
              <button key={i} onClick={() => setActiveSlide(i)} className={`shrink-0 w-28 h-20 rounded-lg border p-2 text-left transition-all ${i === activeSlide ? "border-accent ring-2 ring-accent/30" : "border-border"}`}>
                <p className="text-[8px] font-bold text-text-primary truncate">{s.title}</p>
                <p className="text-[7px] text-text-tertiary truncate">{s.content.slice(0, 40)}</p>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
