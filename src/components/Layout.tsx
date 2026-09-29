import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import type { User, Page, AppNotification } from "../lib/types";
import { api } from "../lib/api";
import type { UserWithStats, Job, Payment } from "../lib/types";

interface Props {
  user: User;
  page: Page;
  onNavigate: (p: Page) => void;
  onLogout: () => void;
  children: ReactNode;
}

interface NavItem { page: Page; label: string; icon: ReactNode; }

const ownerNav: NavItem[] = [
  { page: "owner-dashboard",      label: "Dashboard",      icon: <DashIcon /> },
  { page: "owner-activity",       label: "Activity",        icon: <ActivityIcon /> },
  { page: "owner-schedule",       label: "Schedule",        icon: <CalendarIcon /> },
  { page: "owner-leave",          label: "Leave Requests",  icon: <LeaveIcon /> },
  { page: "owner-jobs",           label: "Jobs",            icon: <JobIcon /> },
  { page: "owner-team",           label: "Team",            icon: <TeamIcon /> },
  { page: "owner-time",           label: "Time Tracking",   icon: <ClockIcon /> },
  { page: "owner-payroll",        label: "Payroll",         icon: <PayIcon /> },
  { page: "owner-payments",       label: "Payments",        icon: <LedgerIcon /> },
  { page: "owner-expenses",       label: "Expenses",        icon: <ExpenseIcon /> },
  { page: "owner-analytics",      label: "Analytics",       icon: <ChartIcon /> },
  { page: "owner-announcements",  label: "Announcements",   icon: <MegaphoneIcon /> },
  { page: "owner-billing",        label: "Plan & Billing",  icon: <BillingIcon /> },
  { page: "owner-settings",       label: "Settings",        icon: <SettingsIcon /> },
];

const employeeNav: NavItem[] = [
  { page: "employee-dashboard",      label: "Dashboard",      icon: <DashIcon /> },
  { page: "employee-schedule",       label: "My Schedule",    icon: <CalendarIcon /> },
  { page: "employee-leave",          label: "My Leave",       icon: <LeaveIcon /> },
  { page: "employee-jobs",           label: "My Jobs",        icon: <JobIcon /> },
  { page: "employee-time",           label: "My Hours",       icon: <ClockIcon /> },
  { page: "employee-pay",            label: "My Pay",         icon: <PayIcon /> },
  { page: "employee-payments",       label: "Payments",       icon: <LedgerIcon /> },
  { page: "employee-announcements",  label: "Announcements",  icon: <MegaphoneIcon /> },
];

function initials(name: string) {
  return name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
}

interface SearchResult { label: string; sub: string; page: Page; }

export function Layout({ user, page, onNavigate, onLogout, children }: Props) {
  const [company, setCompany] = useState<string>("");
  const [dark, setDark] = useState<boolean>(() => localStorage.getItem("theme") === "dark");
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const searchRef = useRef<HTMLInputElement>(null);
  const searchDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [bellOpen, setBellOpen] = useState(false);

  const unread = notifications.filter(n => !n.read).length;

  useEffect(() => {
    api.getCompany().then(c => setCompany(c.name)).catch(() => {});
    loadNotifications();
    const interval = setInterval(loadNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  async function loadNotifications() {
    try { setNotifications(await api.getNotifications(user.id)); } catch {/* ignore */}
  }

  async function handleMarkAllRead() {
    await api.markAllNotificationsRead(user.id);
    loadNotifications();
  }

  async function handleMarkRead(id: string) {
    await api.markNotificationRead(id);
    setNotifications(ns => ns.map(n => n.id === id ? { ...n, read: true } : n));
  }

  // Apply dark mode to <html>
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", dark ? "dark" : "light");
    localStorage.setItem("theme", dark ? "dark" : "light");
  }, [dark]);

  // Global Cmd+K shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen(s => !s);
      }
      if (e.key === "Escape") setSearchOpen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  useEffect(() => {
    if (searchOpen) { setSearchQuery(""); setTimeout(() => searchRef.current?.focus(), 50); }
  }, [searchOpen]);

  function runSearch(q: string) {
    setSearchQuery(q);
    if (searchDebounce.current) clearTimeout(searchDebounce.current);
    if (!q.trim()) { setSearchResults([]); return; }
    searchDebounce.current = setTimeout(async () => {
      const lq = q.toLowerCase();
      const results: SearchResult[] = [];
      if (user.role === "owner") {
        const [team, jobs, payments] = await Promise.all([
          api.getTeam().catch(() => [] as UserWithStats[]),
          api.getJobs().catch(() => [] as Job[]),
          api.getPayments().catch(() => [] as Payment[]),
        ]);
        team.filter(u => u.role !== "owner" && u.active && u.name.toLowerCase().includes(lq)).slice(0, 3).forEach(u =>
          results.push({ label: u.name, sub: u.title, page: "owner-team" }));
        jobs.filter(j => j.title.toLowerCase().includes(lq) || j.description.toLowerCase().includes(lq)).slice(0, 3).forEach(j =>
          results.push({ label: j.title, sub: j.category + " · " + j.status, page: "owner-jobs" }));
        payments.filter(p => (p.userName ?? "").toLowerCase().includes(lq)).slice(0, 2).forEach(p =>
          results.push({ label: (p.userName ?? "Unknown"), sub: "$" + p.amount.toFixed(2) + " — " + p.type, page: "owner-payments" }));
      }
      setSearchResults(results);
    }, 200);
  }

  function goSearch(r: SearchResult) {
    onNavigate(r.page);
    setSearchOpen(false);
  }

  const nav = user.role === "owner" ? ownerNav : employeeNav;

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-top">
          <div className="sidebar-logo">
            <svg viewBox="0 0 20 20" fill="none" width="19" height="19">
              <circle cx="7" cy="7.5" r="3" fill="#fff" fillOpacity="0.95" />
              <circle cx="13" cy="7.5" r="3" fill="#fff" fillOpacity="0.55" />
              <path d="M2 16.5c0-2.5 2.2-4.2 5-4.2s5 1.7 5 4.2" stroke="#fff" strokeWidth="1.7" strokeLinecap="round" />
              <path d="M12 12.6c2.4.2 4 1.9 4 3.9" stroke="#fff" strokeWidth="1.7" strokeLinecap="round" strokeOpacity="0.6" />
            </svg>
          </div>
          <div>
            <div className="company-name">{company || "WorkBase"}</div>
            <span className="company-tag">Company Portal</span>
          </div>
        </div>

        {/* Search button */}
        {user.role === "owner" && (
          <div style={{ padding: "10px 12px" }}>
            <button onClick={() => setSearchOpen(true)} className="sidebar-search" style={{ width: "100%", padding: "8px 11px", borderRadius: 9, background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--text-muted)", fontSize: 12, display: "flex", alignItems: "center", gap: 8, cursor: "pointer", textAlign: "left", transition: "all 0.16s" }}>
              <span style={{ fontSize: 11 }}>🔍</span>
              <span style={{ flex: 1 }}>Search…</span>
              <span style={{ fontSize: 10, opacity: 0.7, fontFamily: "monospace", background: "var(--surface)", padding: "1px 5px", borderRadius: 4, border: "1px solid var(--border)" }}>⌘K</span>
            </button>
          </div>
        )}

        <nav className="nav">
          <div className="nav-section-label">{user.role === "owner" ? "Management" : "My Workspace"}</div>
          {nav.map(item => (
            <button
              key={item.page}
              className={`nav-item${page === item.page ? " active" : ""}`}
              onClick={() => onNavigate(item.page)}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <div className="user-info-bar">
            <div className="avatar">{initials(user.name)}</div>
            <div className="info">
              <div className="name">{user.name}</div>
              <div className="role">{user.title}</div>
            </div>
            {/* Bell */}
            <button
              onClick={() => setBellOpen(b => !b)}
              title="Notifications"
              style={{ position: "relative", marginLeft: "auto", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 8, width: 30, height: 30, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0, transition: "all 0.16s", color: "var(--text-secondary)" }}
            >
              <span style={{ width: 14, height: 14, display: "flex" }}><BellIcon /></span>
              {unread > 0 && <span style={{ position: "absolute", top: -4, right: -4, background: "var(--danger)", color: "#fff", borderRadius: 10, fontSize: 9, fontWeight: 700, minWidth: 14, height: 14, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 3px", lineHeight: 1 }}>{unread > 9 ? "9+" : unread}</span>}
            </button>
            {/* Dark mode toggle */}
            <button
              onClick={() => setDark(d => !d)}
              title={dark ? "Switch to light mode" : "Switch to dark mode"}
              style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 8, width: 30, height: 30, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: 13, flexShrink: 0, transition: "all 0.16s" }}
            >
              {dark ? "☀" : "🌙"}
            </button>
          </div>
          <button className="sidebar-signout" onClick={onLogout}>Sign out</button>
        </div>

        {/* Notification panel */}
        {bellOpen && (
          <div onClick={() => setBellOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 900 }}>
            <div onClick={e => e.stopPropagation()} style={{ position: "fixed", bottom: 80, left: 8, width: 300, maxHeight: 420, background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, boxShadow: "0 12px 40px rgba(0,0,0,0.18)", overflow: "hidden", display: "flex", flexDirection: "column", zIndex: 901 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 14px", borderBottom: "1px solid var(--border)" }}>
                <span style={{ fontWeight: 700, fontSize: 13 }}>Notifications {unread > 0 && <span style={{ background: "var(--danger)", color: "#fff", borderRadius: 9, fontSize: 10, padding: "1px 5px", marginLeft: 4 }}>{unread}</span>}</span>
                {unread > 0 && <button onClick={handleMarkAllRead} style={{ fontSize: 11, color: "var(--primary)", background: "none", border: "none", cursor: "pointer", fontWeight: 600 }}>Mark all read</button>}
              </div>
              <div style={{ overflowY: "auto", flex: 1 }}>
                {notifications.length === 0 ? (
                  <div style={{ padding: 24, textAlign: "center", color: "var(--text-muted)", fontSize: 13 }}>No notifications</div>
                ) : notifications.slice(0, 20).map(n => (
                  <div key={n.id} onClick={() => handleMarkRead(n.id)} style={{ padding: "10px 14px", borderBottom: "1px solid var(--border)", cursor: "pointer", background: n.read ? "transparent" : "rgba(255,122,61,0.05)", display: "flex", gap: 10, alignItems: "flex-start", transition: "background 0.1s" }}>
                    <span style={{ fontSize: 15, flexShrink: 0, marginTop: 1 }}>{n.type === "warning" ? "⚠️" : n.type === "success" ? "✅" : "📢"}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: n.read ? 500 : 700, color: "var(--text)", lineHeight: 1.4 }}>{n.message}</div>
                      <div style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 2 }}>{new Date(n.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })} · {new Date(n.createdAt).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}</div>
                    </div>
                    {!n.read && <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--primary)", flexShrink: 0, marginTop: 4 }} />}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </aside>

      <main className="main-content">{children}</main>

      {/* Search overlay */}
      {searchOpen && (
        <div onClick={() => setSearchOpen(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", alignItems: "flex-start", justifyContent: "center", paddingTop: "15vh" }}>
          <div onClick={e => e.stopPropagation()} style={{ width: "100%", maxWidth: 540, background: "var(--surface)", borderRadius: 14, border: "1px solid var(--border)", boxShadow: "0 24px 64px rgba(0,0,0,0.2)", overflow: "hidden" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "14px 16px", borderBottom: "1px solid var(--border)" }}>
              <span style={{ fontSize: 16 }}>🔍</span>
              <input
                ref={searchRef}
                type="text"
                value={searchQuery}
                onChange={e => runSearch(e.target.value)}
                placeholder="Search employees, jobs, payments…"
                style={{ flex: 1, border: "none", outline: "none", fontSize: 15, background: "transparent", color: "var(--text)" }}
              />
              <span style={{ fontSize: 11, color: "var(--text-muted)", fontFamily: "monospace", background: "var(--surface-2)", padding: "2px 6px", borderRadius: 4 }}>ESC</span>
            </div>
            {searchResults.length > 0 && (
              <div style={{ maxHeight: 360, overflowY: "auto" }}>
                {searchResults.map((r, i) => (
                  <button key={i} onClick={() => goSearch(r)} style={{ width: "100%", padding: "11px 16px", display: "flex", alignItems: "center", gap: 12, background: "transparent", border: "none", cursor: "pointer", textAlign: "left", borderBottom: i < searchResults.length - 1 ? "1px solid var(--border)" : "none" }}>
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: "var(--primary-light)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, flexShrink: 0 }}>
                      {r.page.includes("team") ? "👤" : r.page.includes("jobs") ? "💼" : "💳"}
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 14, color: "var(--text)" }}>{r.label}</div>
                      <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{r.sub}</div>
                    </div>
                    <span style={{ marginLeft: "auto", fontSize: 11, color: "var(--text-muted)" }}>→</span>
                  </button>
                ))}
              </div>
            )}
            {searchQuery.trim() && searchResults.length === 0 && (
              <div style={{ padding: "24px 16px", textAlign: "center", color: "var(--text-muted)", fontSize: 13 }}>No results for "{searchQuery}"</div>
            )}
            {!searchQuery.trim() && (
              <div style={{ padding: "16px 16px", color: "var(--text-muted)", fontSize: 12 }}>
                <div style={{ marginBottom: 8, fontWeight: 600 }}>Quick navigation</div>
                {nav.slice(0, 5).map(n => (
                  <button key={n.page} onClick={() => { onNavigate(n.page); setSearchOpen(false); }} style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", padding: "7px 4px", background: "none", border: "none", cursor: "pointer", color: "var(--text-secondary)", fontSize: 13, borderRadius: 6, textAlign: "left" }}>
                    <span style={{ width: 18, height: 18 }}>{n.icon}</span>{n.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function DashIcon() {
  return <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="1" y="1" width="6" height="6" rx="1" /><rect x="9" y="1" width="6" height="6" rx="1" /><rect x="1" y="9" width="6" height="6" rx="1" /><rect x="9" y="9" width="6" height="6" rx="1" /></svg>;
}
function ActivityIcon() {
  return <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M1 8h2l2-5 2 10 2-6 2 3h4" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}
function TeamIcon() {
  return <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="6" cy="5" r="2.5" /><path d="M1 13c0-2.76 2.24-5 5-5s5 2.24 5 5" /><circle cx="12" cy="5" r="2" /><path d="M12 10c1.66 0 3 1.34 3 3" /></svg>;
}
function ClockIcon() {
  return <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="8" cy="8" r="6.5" /><path d="M8 4.5v4l2.5 2.5" strokeLinecap="round" /></svg>;
}
function PayIcon() {
  return <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="1" y="4" width="14" height="9" rx="1.5" /><path d="M1 7h14" /><circle cx="8" cy="10.5" r="1" fill="currentColor" stroke="none" /></svg>;
}
function JobIcon() {
  return <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="2" y="3" width="12" height="11" rx="1.5" /><path d="M5 3V2a1 1 0 011-1h4a1 1 0 011 1v1" /><path d="M5 8h6M5 11h4" strokeLinecap="round" /></svg>;
}
function LedgerIcon() {
  return <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M2 4h12M2 8h8M2 12h10" strokeLinecap="round" /></svg>;
}
function ChartIcon() {
  return <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M1 12l4-5 3 3 4-6 3 4" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}
function ExpenseIcon() {
  return <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M2 13V5l6-3 6 3v8" strokeLinejoin="round" /><rect x="5.5" y="8" width="5" height="5" rx="0.5" /><path d="M8 8v5" /></svg>;
}
function MegaphoneIcon() {
  return <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M2 10V6l9-4v12L2 10z" strokeLinejoin="round" /><path d="M2 10h2v3H2" strokeLinejoin="round" /><circle cx="13.5" cy="8" r="1.5" /></svg>;
}
function BillingIcon() {
  return <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="1" y="4" width="14" height="9" rx="1.5" /><path d="M1 7.5h14" /><path d="M4 11h2M9 11h3" strokeLinecap="round" /></svg>;
}
function SettingsIcon() {
  return <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="8" cy="8" r="2" /><path d="M8 1v2M8 13v2M1 8h2M13 8h2M3.05 3.05l1.41 1.41M11.54 11.54l1.41 1.41M3.05 12.95l1.41-1.41M11.54 4.46l1.41-1.41" strokeLinecap="round" /></svg>;
}
function CalendarIcon() {
  return <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="1" y="2.5" width="14" height="12" rx="1.5" /><path d="M1 6h14M5 1v3M11 1v3" strokeLinecap="round" /></svg>;
}
function LeaveIcon() {
  return <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="8" cy="5" r="2.5" /><path d="M2 14c0-3.3 2.7-6 6-6s6 2.7 6 6" strokeLinecap="round" /><path d="M6 11.5l2 2 2-2" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}
function BellIcon() {
  return <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M8 1.5a5 5 0 015 5v3l1.5 2H1.5L3 9.5v-3a5 5 0 015-5z" strokeLinejoin="round" /><path d="M6.5 13a1.5 1.5 0 003 0" strokeLinecap="round" /></svg>;
}
