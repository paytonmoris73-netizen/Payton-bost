import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import type { User, Page } from "../lib/types";
import { api } from "../lib/api";

interface Props {
  user: User;
  page: Page;
  onNavigate: (p: Page) => void;
  onLogout: () => void;
  children: ReactNode;
}

interface NavItem { page: Page; label: string; icon: ReactNode; }

const ownerNav: NavItem[] = [
  { page: "owner-dashboard",  label: "Dashboard",      icon: <DashIcon /> },
  { page: "owner-jobs",       label: "Jobs",            icon: <JobIcon /> },
  { page: "owner-team",       label: "Team",            icon: <TeamIcon /> },
  { page: "owner-time",       label: "Time Tracking",   icon: <ClockIcon /> },
  { page: "owner-payroll",    label: "Payroll",         icon: <PayIcon /> },
  { page: "owner-payments",   label: "Payments",        icon: <LedgerIcon /> },
  { page: "owner-analytics",  label: "Analytics",       icon: <ChartIcon /> },
];

const employeeNav: NavItem[] = [
  { page: "employee-dashboard", label: "Dashboard",     icon: <DashIcon /> },
  { page: "employee-jobs",      label: "My Jobs",       icon: <JobIcon /> },
  { page: "employee-time",      label: "My Hours",      icon: <ClockIcon /> },
  { page: "employee-pay",       label: "My Pay",        icon: <PayIcon /> },
  { page: "employee-payments",  label: "Payments",      icon: <LedgerIcon /> },
];

function initials(name: string) {
  return name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
}

export function Layout({ user, page, onNavigate, onLogout, children }: Props) {
  const [company, setCompany] = useState<string>("");

  useEffect(() => {
    api.getCompany().then(c => setCompany(c.name)).catch(() => {});
  }, []);

  const nav = user.role === "owner" ? ownerNav : employeeNav;
  const section = user.role === "owner" ? "Management" : "My Workspace";

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-top">
          <div className="sidebar-logo">🏢</div>
          <div>
            <div className="company-name">{company || "WorkBase"}</div>
            <span className="company-tag">Company Portal</span>
          </div>
        </div>
        <nav className="nav">
          <div className="nav-section-label">{section}</div>
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
          </div>
          <button className="sidebar-signout" onClick={onLogout}>Sign out</button>
        </div>
      </aside>
      <main className="main-content">{children}</main>
    </div>
  );
}

function DashIcon() {
  return <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="1" y="1" width="6" height="6" rx="1" /><rect x="9" y="1" width="6" height="6" rx="1" /><rect x="1" y="9" width="6" height="6" rx="1" /><rect x="9" y="9" width="6" height="6" rx="1" /></svg>;
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
