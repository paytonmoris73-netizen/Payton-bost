import { useEffect, useRef, useState } from "react";
import { api } from "../lib/api";
import type { ActivityEvent } from "../lib/types";

type FilterType = "all" | "clock_in" | "clock_out" | "payment" | "job_created" | "job_done" | "announcement";

const FILTERS: { key: FilterType; label: string }[] = [
  { key: "all", label: "All" },
  { key: "clock_in", label: "Clock-ins" },
  { key: "clock_out", label: "Clock-outs" },
  { key: "payment", label: "Payments" },
  { key: "job_created", label: "Jobs" },
  { key: "announcement", label: "Announcements" },
];

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function fmtDate(iso: string): string {
  const d = new Date(iso);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return "Today";
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
  return d.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });
}

function fmtTime(iso: string): string {
  return new Date(iso).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

function groupByDay(events: ActivityEvent[]): Array<{ day: string; items: ActivityEvent[] }> {
  const map = new Map<string, ActivityEvent[]>();
  for (const e of events) {
    const key = new Date(e.ts).toDateString();
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(e);
  }
  return Array.from(map.values()).map(items => ({
    day: fmtDate(items[0].ts),
    items,
  }));
}

interface EventConfig {
  icon: string;
  color: string;
  bg: string;
}

function eventConfig(type: ActivityEvent["type"]): EventConfig {
  switch (type) {
    case "clock_in":    return { icon: "▶", color: "var(--success)", bg: "rgba(14,163,114,0.1)" };
    case "clock_out":   return { icon: "⏹", color: "var(--text-muted)", bg: "var(--surface-2)" };
    case "payment":     return { icon: "$", color: "#8b5cf6", bg: "rgba(139,92,246,0.1)" };
    case "job_created": return { icon: "✦", color: "var(--primary)", bg: "var(--primary-light)" };
    case "job_done":    return { icon: "✓", color: "var(--success)", bg: "rgba(14,163,114,0.1)" };
    case "announcement": return { icon: "📣", color: "#0891b2", bg: "rgba(8,145,178,0.1)" };
    default:            return { icon: "·", color: "var(--text-muted)", bg: "var(--surface-2)" };
  }
}

/* mini live-count chip that animates on mount */
function CountChip({ label, count, color }: { label: string; count: number; color: string }) {
  const [show, setShow] = useState(false);
  useEffect(() => { const t = setTimeout(() => setShow(true), 60); return () => clearTimeout(t); }, []);
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 10, padding: "10px 18px", minWidth: 80, transition: "transform 0.25s, opacity 0.25s", transform: show ? "translateY(0)" : "translateY(6px)", opacity: show ? 1 : 0 }}>
      <div style={{ fontSize: 20, fontWeight: 800, color, lineHeight: 1.1 }}>{count}</div>
      <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 3, fontWeight: 500 }}>{label}</div>
    </div>
  );
}

/* single feed item with entry animation */
function FeedItem({ event, index }: { event: ActivityEvent; index: number }) {
  const cfg = eventConfig(event.type);
  const [visible, setVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.disconnect(); } }, { threshold: 0.1 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: 14,
        padding: "13px 0",
        borderBottom: "1px solid var(--border)",
        transition: `opacity 0.3s ${index * 30}ms, transform 0.3s ${index * 30}ms`,
        opacity: visible ? 1 : 0,
        transform: visible ? "translateX(0)" : "translateX(-8px)",
      }}
    >
      {/* icon dot */}
      <div style={{ width: 34, height: 34, borderRadius: 9, background: cfg.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: event.type === "announcement" ? 14 : 12, fontWeight: 700, color: cfg.color, flexShrink: 0, marginTop: 1 }}>
        {cfg.icon}
      </div>

      {/* content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 8, flexWrap: "wrap" }}>
          <span style={{ fontWeight: 600, fontSize: 14, color: "var(--text)" }}>{event.title}</span>
        </div>
        <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2, whiteSpace: "pre-wrap", lineHeight: 1.5 }}>{event.sub}</div>
      </div>

      {/* time */}
      <div style={{ fontSize: 11, color: "var(--text-muted)", flexShrink: 0, textAlign: "right", paddingTop: 2 }}>
        <div>{timeAgo(event.ts)}</div>
        <div style={{ opacity: 0.65 }}>{fmtTime(event.ts)}</div>
      </div>
    </div>
  );
}

export function ActivityPage() {
  const [events, setEvents] = useState<ActivityEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>("all");
  const [search, setSearch] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    setLoading(true);
    api.getActivity()
      .then(data => setEvents(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [refreshKey]);

  // auto-refresh every 30 seconds
  useEffect(() => {
    const t = setInterval(() => setRefreshKey(k => k + 1), 30_000);
    return () => clearInterval(t);
  }, []);

  const filtered = events.filter(e => {
    if (filter !== "all" && e.type !== filter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      if (!e.title.toLowerCase().includes(q) && !e.sub.toLowerCase().includes(q) && !e.actor.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const grouped = groupByDay(filtered);

  // summary counts from all events (no search/filter)
  const clockIns = events.filter(e => e.type === "clock_in").length;
  const payments = events.filter(e => e.type === "payment").length;
  const jobsDone = events.filter(e => e.type === "job_done").length;
  const totalPayment = events.filter(e => e.type === "payment").reduce((s, e) => s + (Number(e.meta?.amount) || 0), 0);

  return (
    <div className="page">
      {/* Header */}
      <div className="dash-head" style={{ marginBottom: 20 }}>
        <div>
          <h1 className="dash-greeting">Activity</h1>
          <div className="dash-sub">Everything happening across your workspace, live.</div>
        </div>
        <div className="dash-head-right">
          <button className="btn btn-secondary btn-sm" onClick={() => setRefreshKey(k => k + 1)}>↻ Refresh</button>
        </div>
      </div>

      {/* Summary chips */}
      {!loading && (
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 24 }}>
          <CountChip label="Clock-ins" count={clockIns} color="var(--success)" />
          <CountChip label="Payments" count={payments} color="#8b5cf6" />
          <CountChip label="Jobs done" count={jobsDone} color="var(--primary)" />
          <CountChip label="Total paid" count={Math.round(totalPayment)} color="#0891b2" />
          <CountChip label="Events" count={events.length} color="var(--text-secondary)" />
        </div>
      )}

      <div className="card" style={{ overflow: "visible" }}>
        {/* Toolbar */}
        <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--border)", display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          {/* filter pills */}
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", flex: 1 }}>
            {FILTERS.map(f => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                style={{
                  padding: "5px 12px",
                  borderRadius: 20,
                  border: "1px solid var(--border)",
                  background: filter === f.key ? "var(--primary)" : "var(--surface-2)",
                  color: filter === f.key ? "#fff" : "var(--text-secondary)",
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "all 0.15s",
                }}
              >
                {f.label}
                {f.key !== "all" && (
                  <span style={{ marginLeft: 5, opacity: 0.75 }}>
                    {events.filter(e => e.type === f.key).length}
                  </span>
                )}
              </button>
            ))}
          </div>
          {/* search */}
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search activity…"
            style={{ border: "1px solid var(--border)", borderRadius: 8, padding: "6px 11px", fontSize: 13, background: "var(--surface-2)", color: "var(--text)", outline: "none", width: 200 }}
          />
        </div>

        {/* Feed */}
        {loading ? (
          <div style={{ padding: 40, display: "flex", justifyContent: "center" }}><div className="spinner" /></div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📋</div>
            <h3>No activity yet</h3>
            <p>{search || filter !== "all" ? "Try changing your filters." : "Activity will appear here as your team clocks in, jobs get completed, and payments are made."}</p>
          </div>
        ) : (
          <div style={{ padding: "0 20px" }}>
            {grouped.map(group => (
              <div key={group.day}>
                {/* day separator */}
                <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "16px 0 4px", position: "sticky", top: 0, background: "var(--surface)", zIndex: 2 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.07em", whiteSpace: "nowrap" }}>{group.day}</span>
                  <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
                  <span style={{ fontSize: 11, color: "var(--text-muted)", whiteSpace: "nowrap" }}>{group.items.length} event{group.items.length !== 1 ? "s" : ""}</span>
                </div>
                {group.items.map((event, i) => (
                  <FeedItem key={event.id} event={event} index={i} />
                ))}
              </div>
            ))}

            <div style={{ padding: "16px 0", textAlign: "center", fontSize: 12, color: "var(--text-muted)" }}>
              Showing {filtered.length} event{filtered.length !== 1 ? "s" : ""}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
