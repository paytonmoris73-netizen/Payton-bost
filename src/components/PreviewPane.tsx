import { useState } from "react";

interface PreviewPaneProps {
  html: string | null;
  liveText: string;
  isStreaming: boolean;
  activeTab: "preview" | "code";
  onTabChange: (tab: "preview" | "code") => void;
}

export function PreviewPane({ html, liveText, isStreaming, activeTab, onTabChange }: PreviewPaneProps) {
  const [copied, setCopied] = useState(false);
  const codeToShow = isStreaming ? liveText : (html ?? liveText);

  async function copyCode() {
    if (!html) return;
    await navigator.clipboard.writeText(html);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  function downloadCode() {
    if (!html) return;
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "app.html";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="preview-pane">
      <div className="preview-toolbar">
        <div className="preview-tabs" role="tablist" aria-label="View">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "preview"}
            className={`preview-tab ${activeTab === "preview" ? "active" : ""}`}
            onClick={() => onTabChange("preview")}
            disabled={!html}
          >
            Preview
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "code"}
            className={`preview-tab ${activeTab === "code" ? "active" : ""}`}
            onClick={() => onTabChange("code")}
          >
            Code
          </button>
        </div>
        <div className="preview-actions">
          <button type="button" className="ghost-button" onClick={copyCode} disabled={!html}>
            {copied ? "Copied" : "Copy"}
          </button>
          <button type="button" className="ghost-button" onClick={downloadCode} disabled={!html}>
            Download
          </button>
        </div>
      </div>

      <div className="preview-body">
        {activeTab === "preview" ? (
          html ? (
            <iframe
              title="App preview"
              className="preview-frame"
              sandbox="allow-scripts allow-forms allow-modals allow-popups"
              srcDoc={html}
            />
          ) : (
            <div className="preview-empty">
              <p>Your app will appear here once BunnyX builds it.</p>
            </div>
          )
        ) : (
          <pre className="code-view mono">
            <code>{codeToShow || "// Waiting for the first build…"}</code>
          </pre>
        )}
      </div>
    </div>
  );
}
