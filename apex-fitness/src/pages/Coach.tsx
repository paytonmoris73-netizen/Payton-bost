import { useEffect, useRef, useState } from "react";
import Icon from "../components/Icon";
import { askCoach, buildContext } from "../coach";
import { allWorkouts, useApp, useNav } from "../store";

const SUGGESTIONS = [
  "What should I train today?",
  "How's my nutrition looking?",
  "How is my progress?",
  "I'm tired and unmotivated",
  "How do I recover faster?",
];

export default function Coach() {
  const chat = useApp((s) => s.coachChat);
  const name = useApp((s) => s.name);
  const addMsg = useApp((s) => s.addCoachMsg);
  const clear = useApp((s) => s.clearCoach);
  const startSession = useNav((s) => s.startSession);
  const custom = useApp((s) => s.customWorkouts);
  const catalog = [...custom, ...allWorkouts().filter((w) => !w.custom)];

  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [chat.length, busy]);

  const send = async (raw: string) => {
    const content = raw.trim().slice(0, 1000);
    if (!content || busy) return;
    setText("");
    addMsg({ role: "user", content });
    setBusy(true);
    try {
      // Read the latest history from the store so the new message is included.
      const history = useApp.getState().coachChat;
      const reply = await askCoach(history, buildContext());
      addMsg({ role: "assistant", content: reply.text, source: reply.source });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="animate-fade-up pt-safe flex min-h-[calc(100dvh-7.5rem)] flex-col px-5">
      <header className="mb-4 flex items-center gap-3">
        <span className="gloss-tile flex h-11 w-11 items-center justify-center rounded-full text-white">
          <Icon name="sparkle" size={22} />
        </span>
        <div className="flex-1">
          <h1 className="text-lg font-extrabold">Apex Coach</h1>
          <p className="text-xs text-white/50">AI fitness coach</p>
        </div>
        {chat.length > 0 && (
          <button onClick={() => window.confirm("Clear this conversation?") && clear()} className="text-xs text-white/40 underline">
            Clear
          </button>
        )}
      </header>

      <div className="flex-1 space-y-3 pb-4" aria-live="polite">
        {chat.length === 0 && (
          <div className="card p-4 text-sm text-white/70">
            Hi {name}! I can see your workouts, meals and progress, so ask me anything: what to train, what to eat, how you're doing, or how to stay
            consistent.
          </div>
        )}

        {chat.map((m) => {
          const suggested =
            m.role === "assistant" ? catalog.filter((w) => m.content.toLowerCase().includes(w.name.toLowerCase())).slice(0, 2) : [];
          return (
            <div key={m.id} className={`flex flex-col ${m.role === "user" ? "items-end" : "items-start"}`}>
              <div
                className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                  m.role === "user"
                    ? "rounded-br-md bg-gradient-to-b from-[#ffcf96] via-apex to-apex-dark font-medium text-black shadow-[inset_0_1px_0_rgba(255,255,255,0.8),0_6px_18px_-6px_rgba(255,138,31,0.8)]"
                    : m.source === "error"
                      ? "rounded-bl-md border border-red-500/30 bg-red-500/10 text-red-200"
                      : "card rounded-bl-md"
                }`}
              >
                {m.content}
              </div>
              {m.role === "assistant" && m.source === "local" && <span className="mt-1 text-[10px] text-white/30">Offline coach</span>}
              {suggested.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {suggested.map((w) => (
                    <button key={w.id} onClick={() => startSession(w.id)} className="chip flex items-center gap-1.5 bg-apex text-black">
                      <Icon name="play" size={10} /> Start {w.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}

        {busy && (
          <div className="flex items-start">
            <div className="card flex gap-1 rounded-2xl rounded-bl-md px-4 py-3" role="status" aria-label="Coach is typing">
              {[0, 150, 300].map((d) => (
                <span key={d} className="h-1.5 w-1.5 animate-bounce rounded-full bg-white/50" style={{ animationDelay: `${d}ms` }} />
              ))}
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      <div className="glass-bar sticky bottom-[calc(env(safe-area-inset-bottom)+5.75rem)] z-10 -mx-2 rounded-3xl px-3 pb-3 pt-3">
        <div className="no-scrollbar -mx-3 mb-2 flex gap-2 overflow-x-auto px-3">
          {SUGGESTIONS.map((s) => (
            <button key={s} onClick={() => send(s)} disabled={busy} className="chip shrink-0 bg-ink-2 text-white/70 disabled:opacity-40">
              {s}
            </button>
          ))}
        </div>
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            send(text);
          }}
        >
          <input
            className="input"
            placeholder="Ask your coach…"
            value={text}
            maxLength={1000}
            onChange={(e) => setText(e.target.value)}
            aria-label="Message your coach"
          />
          <button type="submit" disabled={busy || !text.trim()} aria-label="Send" className="btn-primary px-4 disabled:opacity-40">
            <Icon name="send" size={18} />
          </button>
        </form>
        <p className="mt-2 text-center text-[10px] text-white/30">General fitness guidance, not medical advice.</p>
      </div>
    </div>
  );
}
