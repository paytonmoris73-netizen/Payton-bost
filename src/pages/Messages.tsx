import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { CREATORS } from "../data";
import { useMe, useStore } from "../store";
import { Avatar, Empty, Modal, PageHeader } from "../ui";

export default function Messages() {
  const me = useMe()!; const { threads, send, readThread, openThread } = useStore(); const [p, setP] = useSearchParams();
  const [sel, setSel] = useState<string | null>(p.get("t")); const [text, setText] = useState(""); const [newOpen, setNewOpen] = useState(false); const end = useRef<HTMLDivElement>(null);
  const t = threads.find((x) => x.id === sel);
  useEffect(() => { if (sel) readThread(sel); if (p.get("t")) setP({}, { replace: true }); }, [sel]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { end.current?.scrollIntoView(); }, [t?.messages.length]);
  return (
    <div>
      <PageHeader title="Messages" sub="Direct messages with other cooks." action={<button className="btn-primary" onClick={() => setNewOpen(true)}>New message</button>} />
      <p className="mb-4 rounded-xl bg-sage-light/60 p-3 text-xs">In this build messages are stored on this device only and recipients aren't notified. Real delivery needs the backend described in docs/BACKEND.md. Be kind and never share personal or payment details.</p>
      {!me.privacy.allowDMs && <p className="mb-4 rounded-xl bg-orange-light/50 p-3 text-sm">You've turned off direct messages in Settings → Privacy.</p>}
      <div className="card grid h-[65vh] overflow-hidden md:grid-cols-[280px_1fr]">
        <div className={`overflow-y-auto border-cream md:border-r ${sel ? "hidden md:block" : ""}`}>
          {threads.length === 0 ? <div className="rise-in flex flex-col items-center gap-2 px-6 py-10 text-center"><div className="tile grid h-16 w-16 place-items-center rounded-[1.4rem] text-3xl">💬</div><b className="mt-1">No conversations yet</b><p className="max-w-[16rem] text-xs text-brown">Start one with “New message” to chat with another cook.</p></div> : threads.map((x) => <button key={x.id} onClick={() => setSel(x.id)} className={`flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-cream ${sel === x.id ? "bg-cream" : ""}`}><Avatar emoji={x.emoji} size={40} /><span className="min-w-0 flex-1"><b className="block truncate text-sm">{x.withName}</b><span className="block truncate text-xs text-brown">{x.messages.at(-1)?.text ?? "No messages yet"}</span></span></button>)}
        </div>
        <div className={`flex min-h-0 flex-col ${sel ? "" : "hidden md:flex"}`}>
          {!t ? <div className="hidden flex-1 place-items-center md:grid"><Empty emoji="💬" title="Select a conversation" /></div> : (
            <>
              <div className="flex items-center gap-3 border-b border-cream px-4 py-3"><button className="md:hidden" onClick={() => setSel(null)} aria-label="Back">←</button><Avatar emoji={t.emoji} size={32} /><b>{t.withName}</b></div>
              <div className="flex-1 space-y-2 overflow-y-auto p-4">{t.messages.length === 0 && <p className="text-center text-sm text-brown">Say hello 👋</p>}{t.messages.map((m) => <div key={m.id} className={`flex ${m.from === "me" ? "justify-end" : ""}`}><div className={`rise-in max-w-[80%] rounded-[1.25rem] px-4 py-2 text-sm ${m.from === "me" ? "rounded-br-md ink-fill text-ivory" : "tile rounded-bl-md"}`}>{m.text}</div></div>)}<div ref={end} /></div>
              <form className="flex gap-2 border-t border-cream p-3" onSubmit={(e) => { e.preventDefault(); if (!me.privacy.allowDMs) return; send(t.id, text); setText(""); }}><input className="input" value={text} onChange={(e) => setText(e.target.value)} placeholder="Write a message…" maxLength={2000} aria-label="Message" /><button className="btn-primary" disabled={!text.trim() || !me.privacy.allowDMs}>Send</button></form>
            </>
          )}
        </div>
      </div>
      <Modal open={newOpen} onClose={() => setNewOpen(false)} title="New message">
        <div className="space-y-2">{CREATORS.map((c) => <button key={c.id} className="flex w-full items-center gap-3 rounded-xl bg-cream p-3 text-left hover:bg-cream-dark" onClick={() => { setSel(openThread(c)); setNewOpen(false); }}><Avatar emoji={c.emoji} hue={c.hue} size={40} /><span><b className="block text-sm">{c.name}</b><span className="text-xs text-brown">{c.handle}</span></span></button>)}</div>
      </Modal>
    </div>
  );
}
