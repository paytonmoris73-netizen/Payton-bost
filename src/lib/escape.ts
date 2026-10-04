const MAP: Record<string, string> = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };

export function escapeHtml(v: unknown): string {
  return String(v ?? "").replace(/[&<>"']/g, c => MAP[c]);
}
