import type { Revision } from "../lib/types";

interface BuildLogProps {
  revisions: Revision[];
}

const STATUS_LABEL: Record<Revision["status"], string> = {
  streaming: "Building",
  done: "Ready",
  error: "Failed",
};

export function BuildLog({ revisions }: BuildLogProps) {
  if (revisions.length === 0) {
    return (
      <div className="build-log-empty">
        <p>Nothing built yet. Describe an app below to start.</p>
      </div>
    );
  }

  return (
    <ol className="build-log">
      {revisions.map((rev) => (
        <li key={rev.id} className={`build-entry build-entry--${rev.status}`}>
          <div className="build-entry-head">
            <span className="build-entry-num mono">Build {String(rev.id).padStart(2, "0")}</span>
            <span className={`status-pill status-pill--${rev.status}`}>{STATUS_LABEL[rev.status]}</span>
          </div>
          <p className="build-entry-prompt">{rev.prompt}</p>
          {rev.status === "done" && rev.note ? <p className="build-entry-note">{rev.note}</p> : null}
          {rev.status === "error" && rev.error ? <p className="build-entry-error">{rev.error}</p> : null}
        </li>
      ))}
    </ol>
  );
}
