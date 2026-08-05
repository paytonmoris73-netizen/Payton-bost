import { useEffect, useRef, useState } from "react";
import { Composer } from "./components/Composer";
import { BuildLog } from "./components/BuildLog";
import { PreviewPane } from "./components/PreviewPane";
import { streamGenerate, type ChatTurn } from "./lib/stream";
import { extractHtml, leadingNote } from "./lib/extractCode";
import type { Config, Revision } from "./lib/types";

export default function App() {
  const [config, setConfig] = useState<Config | null>(null);
  const [configError, setConfigError] = useState<string | null>(null);

  const [revisions, setRevisions] = useState<Revision[]>([]);
  const [messages, setMessages] = useState<ChatTurn[]>([]);
  const [currentHtml, setCurrentHtml] = useState<string | null>(null);
  const [liveText, setLiveText] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [activeTab, setActiveTab] = useState<"preview" | "code">("preview");

  const bufferRef = useRef("");
  const abortRef = useRef<AbortController | null>(null);
  const nextId = useRef(1);

  useEffect(() => {
    fetch("/api/config")
      .then((res) => res.json())
      .then((data: Config) => setConfig(data))
      .catch(() => setConfigError("Could not reach the BunnyX server. Make sure it's running."));
  }, []);

  useEffect(() => () => abortRef.current?.abort(), []);

  async function handleSubmit(prompt: string) {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    const id = nextId.current++;
    bufferRef.current = "";
    setLiveText("");
    setActiveTab("code");
    setIsStreaming(true);
    setRevisions((prev) => [...prev, { id, prompt, status: "streaming" }]);

    const nextMessages: ChatTurn[] = [...messages, { role: "user", content: prompt }];

    await streamGenerate(
      nextMessages,
      {
        onDelta: (text) => {
          bufferRef.current += text;
          setLiveText(bufferRef.current);
        },
        onDone: () => {
          const raw = bufferRef.current;
          const html = extractHtml(raw);
          setMessages([...nextMessages, { role: "assistant", content: raw }]);
          setIsStreaming(false);

          if (html) {
            setCurrentHtml(html);
            setActiveTab("preview");
            const note = leadingNote(raw);
            setRevisions((prev) =>
              prev.map((rev) => (rev.id === id ? { ...rev, status: "done", note: note || undefined } : rev)),
            );
          } else {
            setRevisions((prev) =>
              prev.map((rev) =>
                rev.id === id
                  ? { ...rev, status: "error", error: "No complete HTML document was found in the response." }
                  : rev,
              ),
            );
          }
        },
        onError: (message) => {
          setIsStreaming(false);
          setRevisions((prev) => prev.map((rev) => (rev.id === id ? { ...rev, status: "error", error: message } : rev)));
        },
      },
      controller.signal,
    );
  }

  function handleNewApp() {
    abortRef.current?.abort();
    nextId.current = 1;
    bufferRef.current = "";
    setRevisions([]);
    setMessages([]);
    setCurrentHtml(null);
    setLiveText("");
    setIsStreaming(false);
    setActiveTab("preview");
  }

  const composerDisabled = isStreaming || configError !== null || (config !== null && !config.hasApiKey);

  return (
    <div className="shell">
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark">BunnyX</span>
          <span className="brand-tagline">Describe it. Ship it.</span>
        </div>
        <div className="topbar-actions">
          {config ? <span className="model-badge mono">{config.model}</span> : null}
          <button type="button" className="ghost-button" onClick={handleNewApp} disabled={revisions.length === 0}>
            New app
          </button>
        </div>
      </header>

      {configError ? (
        <div className="status-banner status-banner--error">{configError}</div>
      ) : config && !config.hasApiKey ? (
        <div className="status-banner status-banner--warn">
          Add <code>ANTHROPIC_API_KEY</code> to your <code>.env</code> file, then restart the server, to start building.
        </div>
      ) : null}

      <div className="layout">
        <aside className="sidebar">
          <div className="sidebar-scroll">
            <BuildLog revisions={revisions} />
          </div>
          <Composer
            onSubmit={handleSubmit}
            disabled={composerDisabled}
            isStreaming={isStreaming}
            hasApps={revisions.length > 0}
          />
        </aside>

        <main className="workspace">
          <PreviewPane
            html={currentHtml}
            liveText={liveText}
            isStreaming={isStreaming}
            activeTab={activeTab}
            onTabChange={setActiveTab}
          />
        </main>
      </div>
    </div>
  );
}
