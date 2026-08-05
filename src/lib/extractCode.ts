export function extractHtml(raw: string): string | null {
  const fenced = raw.match(/```html\s*\n([\s\S]*?)```/i);
  if (fenced) return fenced[1].trim();

  const lower = raw.toLowerCase();
  const start = lower.indexOf("<!doctype");
  const end = lower.lastIndexOf("</html>");
  if (start !== -1 && end !== -1 && end > start) {
    return raw.slice(start, end + "</html>".length).trim();
  }
  return null;
}

export function leadingNote(raw: string): string {
  const idx = raw.indexOf("```");
  return (idx === -1 ? raw : raw.slice(0, idx)).trim();
}
