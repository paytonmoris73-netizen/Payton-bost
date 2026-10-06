import { useEffect, useRef, useState } from "react";
import { api } from "../lib/api";
import type { ChatChannel, ChatMessage, User } from "../lib/types";
import { useToast } from "../contexts/Toast";

interface Props { user: User; }

function initials(name: string) { return name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase(); }

function stamp(iso: string): string {
  const d = new Date(iso), now = new Date();
  const time = d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  if (d.toDateString() === now.toDateString()) return time;
  return `${d.toLocaleDateString(undefined, { month: "short", day: "numeric" })}, ${time}`;
}

export function ChatPage({ user }: Props) {
  const { toast } = useToast();
  const [channels, setChannels] = useState<ChatChannel[]>([]);
  const [active, setActive] = useState("team");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [showList, setShowList] = useState(true);
  const endRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef(active);
  activeRef.current = active;

  async function loadChannels() {
    try { setChannels(await api.getChannels()); } catch { /* keep last list */ }
  }

  async function loadMessages(channel: string, markRead = true) {
    try {
      const msgs = await api.getMessages(channel);
      if (activeRef.current !== channel) return;
      setMessages(prev => (prev.length === msgs.length && prev[prev.length - 1]?.id === msgs[msgs.length - 1]?.id) ? prev : msgs);
      if (markRead) await api.markChannelRead(channel);
    } catch { /* transient */ }
  }

  useEffect(() => { loadChannels(); }, []);

  useEffect(() => {
    setMessages([]);
    loadMessages(active).then(loadChannels);
    const t = setInterval(() => {
      if (document.visibilityState !== "visible") return;
      loadMessages(active);
      loadChannels();
    }, 4000);
    return () => clearInterval(t);
  }, [active]);

  useEffect(() => { endRef.current?.scrollIntoView({ block: "end" }); }, [messages.length]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const body = text.trim();
    if (!body || sending) return;
    setSending(true);
    try {
      const msg = await api.sendMessage(active, body);
      setMessages(m => [...m, msg]);
      setText("");
      loadChannels();
    } catch (err) { toast(err instanceof Error ? err.message : "Message failed to send", "error"); }
    finally { setSending(false); }
  }

  function open(channel: string) { setActive(channel); setShowList(false); }

  const current = channels.find(c => c.channel === active);

  return (
    <div className="page chat-page">
      <div className="page-header">
        <div>
          <div className="page-title">Messages</div>
          <div className="page-subtitle">Talk to your whole team or one person</div>
        </div>
      </div>

      <div className={`chat-shell${showList ? " show-list" : ""}`}>
        <aside className="chat-list" aria-label="Conversations">
          {channels.map(c => (
            <button key={c.channel} className={`chat-item${c.channel === active ? " active" : ""}`} onClick={() => open(c.channel)}>
              <div className="user-avatar" style={c.channel === "team" ? { background: "var(--success)" } : undefined}>{c.channel === "team" ? "👥" : initials(c.name)}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="chat-item-name">{c.name}</div>
                <div className="chat-item-last">{c.last ? `${c.last.senderId === user.id ? "You: " : ""}${c.last.text}` : c.title}</div>
              </div>
              {c.unread > 0 && <span className="chat-unread" aria-label={`${c.unread} unread`}>{c.unread > 99 ? "99+" : c.unread}</span>}
            </button>
          ))}
        </aside>

        <section className="chat-main">
          <div className="chat-head">
            <button className="btn btn-ghost btn-sm chat-back" onClick={() => setShowList(true)} aria-label="Back to conversations">←</button>
            <div>
              <div style={{ fontWeight: 700 }}>{current?.name ?? "Whole team"}</div>
              <div className="td-muted" style={{ fontSize: 12 }}>{current?.title}</div>
            </div>
          </div>
          <div className="chat-messages" aria-live="polite">
            {messages.length === 0 ? (
              <div className="empty-state" style={{ margin: "auto" }}>
                <div className="empty-state-icon">💬</div>
                <h3>No messages yet</h3>
                <p>Say hello to get the conversation going.</p>
              </div>
            ) : messages.map((m, i) => {
              const mine = m.senderId === user.id;
              const showName = !mine && active === "team" && messages[i - 1]?.senderId !== m.senderId;
              return (
                <div key={m.id} className={`bubble-row${mine ? " mine" : ""}`}>
                  <div className="bubble">
                    {showName && <div className="bubble-name">{m.senderName}</div>}
                    <div className="bubble-text">{m.text}</div>
                    <div className="bubble-time">{stamp(m.createdAt)}</div>
                  </div>
                </div>
              );
            })}
            <div ref={endRef} />
          </div>
          <form className="chat-compose" onSubmit={send}>
            <textarea
              value={text}
              onChange={e => setText(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(e); } }}
              placeholder={`Message ${current?.name ?? "the team"}…`}
              rows={1}
              maxLength={2000}
              aria-label="Message"
            />
            <button className="btn btn-primary" type="submit" disabled={!text.trim() || sending}>Send</button>
          </form>
        </section>
      </div>
    </div>
  );
}
