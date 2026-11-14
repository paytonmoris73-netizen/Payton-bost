import { NavLink, useLocation } from "react-router-dom";
import { Icon, type IconName } from "../Icon";
import { useAppStore } from "../../stores/appStore";

interface NavItem { to: string; label: string; icon: IconName; section?: string }

const NAV: NavItem[] = [
  { to: "/app/home", label: "Home", icon: "home" },
  { to: "/app/tutor", label: "AI Tutor", icon: "brain", section: "Learn" },
  { to: "/app/subjects", label: "My Subjects", icon: "graduation" },
  { to: "/app/library", label: "My Library", icon: "library" },
  { to: "/app/audio", label: "Audio Studio", icon: "headphones", section: "Create" },
  { to: "/app/notes", label: "Notes Studio", icon: "file-text" },
  { to: "/app/flashcards", label: "Flashcards", icon: "layers" },
  { to: "/app/tests", label: "Test Center", icon: "test-tube" },
  { to: "/app/guides", label: "Study Guides", icon: "book-open" },
  { to: "/app/games", label: "Study Games", icon: "gamepad", section: "Practice" },
  { to: "/app/visual", label: "Visual Learning", icon: "eye" },
  { to: "/app/presentations", label: "Presentations", icon: "presentation" },
  { to: "/app/planner", label: "Planner", icon: "calendar", section: "Track" },
  { to: "/app/analytics", label: "Analytics", icon: "bar-chart" },
];

export function Sidebar() {
  const collapsed = useAppStore((s) => s.sidebarCollapsed);
  const setSidebarCollapsed = useAppStore((s) => s.setSidebarCollapsed);
  const user = useAppStore((s) => s.user);
  const location = useLocation();

  let lastSection = "";

  return (
    <aside
      className={`sticky top-0 hidden h-dvh shrink-0 flex-col border-r border-border bg-surface-1/80 backdrop-blur-sm transition-all duration-200 lg:flex ${
        collapsed ? "w-[68px]" : "w-60"
      }`}
    >
      <div className={`flex items-center gap-2.5 px-4 py-5 ${collapsed ? "justify-center" : ""}`}>
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent text-text-inverse shadow-soft">
          <Icon name="lucent" className="h-5 w-5" filled />
        </span>
        {!collapsed && (
          <span className="font-serif text-xl font-semibold tracking-tight text-text-primary">
            Lucent
          </span>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto px-2 pb-4 no-scrollbar">
        {NAV.map((item) => {
          const showSection = item.section && item.section !== lastSection;
          if (item.section) lastSection = item.section;
          return (
            <div key={item.to}>
              {showSection && !collapsed && (
                <div className="mt-5 mb-1.5 px-3 text-[10px] font-bold uppercase tracking-widest text-text-tertiary">
                  {item.section}
                </div>
              )}
              {showSection && collapsed && <div className="mt-4 mb-1 mx-auto h-px w-6 bg-border" />}
              <NavLink
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-medium transition-colors ${
                    collapsed ? "justify-center" : ""
                  } ${
                    isActive
                      ? "bg-accent-subtle text-accent-text font-semibold"
                      : "text-text-secondary hover:bg-surface-2 hover:text-text-primary"
                  }`
                }
                title={collapsed ? item.label : undefined}
              >
                <Icon name={item.icon} className="h-[18px] w-[18px] shrink-0" />
                {!collapsed && <span className="truncate">{item.label}</span>}
              </NavLink>
            </div>
          );
        })}
      </nav>

      <div className="border-t border-border px-2 py-3 space-y-1">
        <NavLink
          to="/app/search"
          className={({ isActive }) =>
            `flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-medium transition-colors ${
              collapsed ? "justify-center" : ""
            } ${isActive ? "bg-accent-subtle text-accent-text" : "text-text-secondary hover:bg-surface-2"}`
          }
        >
          <Icon name="search" className="h-[18px] w-[18px]" />
          {!collapsed && "Search"}
        </NavLink>
        <NavLink
          to="/app/settings"
          className={({ isActive }) =>
            `flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-medium transition-colors ${
              collapsed ? "justify-center" : ""
            } ${isActive ? "bg-accent-subtle text-accent-text" : "text-text-secondary hover:bg-surface-2"}`
          }
        >
          <Icon name="settings" className="h-[18px] w-[18px]" />
          {!collapsed && "Settings"}
        </NavLink>

        {user && !collapsed && (
          <div className="card flex items-center gap-3 px-3 py-2.5 mt-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-accent text-xs font-bold text-text-inverse">
              {user.name[0]?.toUpperCase() ?? "U"}
            </span>
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold text-text-primary">{user.name}</div>
              <div className="text-xs text-text-tertiary">Free plan</div>
            </div>
          </div>
        )}

        <button
          onClick={() => setSidebarCollapsed(!collapsed)}
          className="flex w-full items-center justify-center gap-2 rounded-lg px-3 py-2 text-[13px] text-text-tertiary hover:bg-surface-2 hover:text-text-secondary transition-colors"
        >
          <Icon name={collapsed ? "chevron-right" : "chevron-left"} className="h-4 w-4" />
          {!collapsed && <span>Collapse</span>}
        </button>
      </div>
    </aside>
  );
}
