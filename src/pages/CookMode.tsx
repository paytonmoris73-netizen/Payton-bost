import { useEffect, useRef, useState } from "react";
import { G } from "../icons";
import { Link, useNavigate, useParams } from "react-router-dom";
import { scaleAmount } from "../RecipeBody";
import { canAccess, useCatalogue, useMe, useOwnedIds, useStore } from "../store";
import { Empty, toast } from "../ui";

export default function CookMode() {
  const { id } = useParams(); const nav = useNavigate(); const cat = useCatalogue(); const owned = useOwnedIds(); const me = useMe(); const markCooked = useStore((s) => s.markCooked);
  const r = cat.find((x) => x.id === id);
  const [i, setI] = useState(0); const [servings, setServings] = useState(r?.servings || 1); const [showIng, setShowIng] = useState(false);
  const [checked, setChecked] = useState<Record<string, boolean>>({}); const [voice, setVoice] = useState(false);
  const [left, setLeft] = useState<number | null>(null); const [running, setRunning] = useState(false); const tick = useRef<number | undefined>(undefined);
  const speak = (t: string) => { if (!("speechSynthesis" in window)) return; window.speechSynthesis.cancel(); window.speechSynthesis.speak(new SpeechSynthesisUtterance(t)); };
  useEffect(() => { setRunning(false); setLeft(null); window.clearInterval(tick.current); }, [i]);
  useEffect(() => { if (voice && r) speak(`Step ${i + 1}. ${r.steps[i]?.text ?? ""}`); }, [i, voice]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => () => { window.clearInterval(tick.current); if ("speechSynthesis" in window) window.speechSynthesis.cancel(); }, []);
  useEffect(() => {
    if (!running) return;
    tick.current = window.setInterval(() => setLeft((l) => {
      if (l === null) return l;
      if (l <= 1) { window.clearInterval(tick.current); setRunning(false); toast("Timer finished!"); if (navigator.vibrate) navigator.vibrate([200, 100, 200]); return 0; }
      return l - 1;
    }), 1000);
    return () => window.clearInterval(tick.current);
  }, [running]);
  useEffect(() => { let lock: { release: () => void } | undefined; (navigator as unknown as { wakeLock?: { request: (t: string) => Promise<{ release: () => void }> } }).wakeLock?.request("screen").then((l) => (lock = l)).catch(() => {}); return () => lock?.release(); }, []);

  if (!r || r.steps.length === 0) return <div className="p-6"><Empty title="Nothing to cook" action={<Link to="/" className="btn-primary">Home</Link>} /></div>;
  if (!canAccess(r, owned, me?.id ?? null)) return <div className="p-6"><Empty emoji="🔒" title="Purchase required" text="Buy this recipe to cook it." action={<Link to={`/marketplace/${r.id}`} className="btn-primary">View listing</Link>} /></div>;
  const step = r.steps[i]; const last = i === r.steps.length - 1; const factor = servings / Math.max(1, r.servings);
  const mm = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
  return (
    <div className="flex min-h-screen flex-col">
      <div className="h-1.5 bg-charcoal/[0.06]"><div className="h-full w-full origin-left accent-fill transition-transform duration-500 [transition-timing-function:var(--ease-spring)]" style={{ transform: `scaleX(${(i + 1) / r.steps.length})` }} /></div>
      <header className="glass-bar sticky top-0 z-10 flex items-center justify-between gap-2 px-4 py-3 md:px-8">
        <button onClick={() => nav(-1)} className="btn-ghost"><G g="✕" /> Exit</button>
        <div className="text-center"><div className="line-clamp-1 font-semibold">{r.title}</div><div className="text-xs text-brown">Step {i + 1} of {r.steps.length}</div></div>
        <div className="flex gap-2"><button className={`btn-ghost ${voice ? "!bg-orange" : ""}`} onClick={() => { const v = !voice; setVoice(v); if (!v && "speechSynthesis" in window) window.speechSynthesis.cancel(); if (v && !("speechSynthesis" in window)) toast("Voice isn't supported in this browser.", "err"); }} aria-pressed={voice} aria-label="Read steps aloud">🔊</button><button className="btn-ghost" onClick={() => setShowIng(true)}>🧺</button></div>
      </header>
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center px-6 py-6">
        <div key={i} className="rise-in">
          <div className="pop-in mb-4 grid h-12 w-12 place-items-center rounded-full ink-fill text-xl font-bold text-ivory shadow-[inset_0_1px_0_rgba(255,255,255,.15),0_8px_18px_-8px_rgba(37,35,31,.6)]">{i + 1}</div>
          <p className="text-2xl font-medium leading-snug md:text-4xl md:leading-snug">{step.text}</p>
          {step.timerMin && step.timerMin < 180 && (
            <div className="mt-8 flex items-center gap-4">
              <div className="glass rounded-[1.4rem] px-5 py-3 text-3xl font-bold tabular-nums">{mm(left ?? step.timerMin * 60)}</div>
              {!running ? <button className="btn-primary" onClick={() => { setLeft(left && left > 0 ? left : step.timerMin! * 60); setRunning(true); }}>{left && left > 0 ? "Resume" : "Start timer"}</button> : <button className="btn-ghost" onClick={() => setRunning(false)}>Pause</button>}
              {left !== null && <button className="text-sm text-brown" onClick={() => { setLeft(null); setRunning(false); }}>Reset</button>}
            </div>
          )}
        </div>
      </main>
      <footer className="glass-bar safe-bottom sticky bottom-0 flex gap-3 border-t border-white/60 p-4 md:px-8">
        <button className="btn-ghost flex-1 !py-4 text-base" disabled={i === 0} onClick={() => setI(i - 1)}>← Previous</button>
        {last ? <button className="btn-primary flex-1 !py-4 text-base" onClick={() => { markCooked(r.id); toast("Nice work! Logged as cooked."); nav(`/recipe/${r.id}`); }}>Finish 🎉</button> : <button className="btn-dark flex-1 !py-4 text-base" onClick={() => setI(i + 1)}>Next →</button>}
      </footer>
      {showIng && (
        <div className="backdrop-in fixed inset-0 z-50 flex justify-end scrim" onClick={() => setShowIng(false)}>
          <aside className="glass-thick m-2 h-[calc(100%-1rem)] w-full max-w-sm overflow-y-auto rounded-[1.75rem] p-5 [animation:sheetUp_480ms_var(--ease-spring)_both] md:[animation:riseIn_420ms_var(--ease-spring)_both]" onClick={(e) => e.stopPropagation()}>
            <div className="mb-3 flex items-center justify-between"><h2 className="h-display text-2xl">Ingredients</h2><button onClick={() => setShowIng(false)} aria-label="Close" className="press grid h-9 w-9 place-items-center rounded-full bg-charcoal/[0.07]"><G g="✕" size={15} /></button></div>
            <div className="mb-3 flex items-center gap-2 text-sm"><button className="grid h-8 w-8 place-items-center rounded-full bg-cream" onClick={() => setServings(Math.max(1, servings - 1))}>−</button><span className="font-semibold">{servings} servings</span><button className="grid h-8 w-8 place-items-center rounded-full bg-cream" onClick={() => setServings(servings + 1)}>+</button></div>
            {r.ingredients.map((g) => <label key={g.name} className="flex items-center gap-3 border-b border-cream py-3"><input type="checkbox" className="h-5 w-5 accent-orange" checked={!!checked[g.name]} onChange={() => setChecked((p) => ({ ...p, [g.name]: !p[g.name] }))} /><span className={`flex-1 ${checked[g.name] ? "text-brown-light line-through" : ""}`}>{g.name}</span><span className="text-brown">{scaleAmount(g.amount, factor)}</span></label>)}
          </aside>
        </div>
      )}
    </div>
  );
}
