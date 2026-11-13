import { NavLink, Outlet, useLocation } from "react-router-dom";
import { useState } from "react";
import { Icons } from "./Icons";
import { useStore } from "../state/store";

const NAV_ITEMS = [
  { to: "/app/home", icon: Icons.home, label: "Home" },
  { to: "/app/tutor", icon: Icons.tutor, label: "AI Tutor" },
  { to: "/app/homework", icon: Icons.homework, label: "Solve Homework" },
  { to: "/app/notes", icon: Icons.notes, label: "My Notes" },
  { to: "/app/record", icon: Icons.record, label: "Record & Capture" },
  { to: "/app/materials", icon: Icons.study, label: "Study Materials" },
  { to: "/app/flashcards", icon: Icons.flashcards, label: "Flashcards" },
  { to: "/app/quiz", icon: Icons.quiz, label: "Quizzes" },
  { to: "/app/exams", icon: Icons.exam, label: "Practice Exams" },
  { to: "/app/games", icon: Icons.games, label: "Study Games" },
  { to: "/app/calendar", icon: Icons.calendar, label: "Calendar" },
  { to: "/app/progress", icon: Icons.progress, label: "Progress" },
];

const BOTTOM_NAV = [
  { to: "/app/settings", icon: Icons.settings, label: "Settings" },
];

const MOBILE_NAV = [
  { to: "/app/home", icon: Icons.home, label: "Home" },
  { to: "/app/tutor", icon: Icons.tutor, label: "Tutor" },
  { to: "/app/homework", icon: Icons.homework, label: "Solve" },
  { to: "/app/notes", icon: Icons.notes, label: "Notes" },
  { to: "/app/more", icon: Icons.grid, label: "More" },
];

function Sidebar() {
  const sidebarOpen = useStore((s) => s.sidebarOpen);
  const setSidebarOpen = useStore((s) => s.setSidebarOpen);
  const profile = useStore((s) => s.profile);

  return (
    <>
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/30 z-30 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}
      <aside
        className={`fixed top-0 left-0 z-40 h-full w-64 bg-white dark:bg-dark-800 border-r border-warm-200 dark:border-dark-border flex flex-col transition-transform duration-300 lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center gap-3 px-5 py-5 border-b border-warm-200 dark:border-dark-border">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-brand-500 to-accent-500 flex items-center justify-center">
            <Icons.sparkles size={18} className="text-white" />
          </div>
          <div>
            <h1 className="text-base font-bold font-display text-ink-900 dark:text-white">StudyVerse</h1>
            <p className="text-[10px] text-ink-400 dark:text-gray-500 font-medium uppercase tracking-wider">AI Learning</p>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="ml-auto lg:hidden btn-ghost p-1.5">
            <Icons.x size={18} />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-0.5">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => window.innerWidth < 1024 && setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? "bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-300"
                    : "text-ink-600 hover:bg-warm-100 hover:text-ink-800 dark:text-gray-400 dark:hover:bg-dark-600 dark:hover:text-gray-200"
                }`
              }
            >
              <item.icon size={18} />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-warm-200 dark:border-dark-border px-3 py-3 space-y-0.5">
          {BOTTOM_NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => window.innerWidth < 1024 && setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? "bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-300"
                    : "text-ink-600 hover:bg-warm-100 hover:text-ink-800 dark:text-gray-400 dark:hover:bg-dark-600 dark:hover:text-gray-200"
                }`
              }
            >
              <item.icon size={18} />
              <span>{item.label}</span>
            </NavLink>
          ))}
          {profile && (
            <NavLink
              to="/app/settings"
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-ink-600 hover:bg-warm-100 dark:text-gray-400 dark:hover:bg-dark-600"
            >
              <div className="w-7 h-7 rounded-full bg-brand-100 dark:bg-brand-500/20 flex items-center justify-center text-brand-600 dark:text-brand-400 text-xs font-bold">
                {profile.name.charAt(0).toUpperCase()}
              </div>
              <span className="truncate">{profile.name}</span>
            </NavLink>
          )}
        </div>
      </aside>
    </>
  );
}

function TopBar() {
  const setSidebarOpen = useStore((s) => s.setSidebarOpen);
  const darkMode = useStore((s) => s.darkMode);
  const toggleDarkMode = useStore((s) => s.toggleDarkMode);
  const location = useLocation();
  const [searchOpen, setSearchOpen] = useState(false);

  const pageTitle = NAV_ITEMS.find((i) => location.pathname.startsWith(i.to))?.label
    || BOTTOM_NAV.find((i) => location.pathname.startsWith(i.to))?.label
    || "StudyVerse";

  return (
    <header className="sticky top-0 z-20 bg-white/80 dark:bg-dark-800/80 backdrop-blur-lg border-b border-warm-200 dark:border-dark-border">
      <div className="flex items-center gap-3 px-4 lg:px-6 h-14">
        <button onClick={() => setSidebarOpen(true)} className="lg:hidden btn-ghost p-1.5">
          <Icons.menu size={20} />
        </button>
        <h2 className="text-base font-semibold text-ink-900 dark:text-white lg:hidden">{pageTitle}</h2>

        <div className="hidden lg:flex items-center flex-1">
          <div className="relative max-w-md w-full">
            <Icons.search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
            <input
              type="text"
              placeholder="Search notes, flashcards, quizzes..."
              className="input pl-9 pr-4 py-2 text-sm"
              onFocus={() => setSearchOpen(true)}
              onBlur={() => setTimeout(() => setSearchOpen(false), 200)}
            />
            {searchOpen && (
              <div className="absolute top-full left-0 right-0 mt-1 card p-3 shadow-elevated z-50">
                <p className="text-xs text-ink-400 dark:text-gray-500">Start typing to search across all your study materials...</p>
              </div>
            )}
          </div>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <button onClick={toggleDarkMode} className="btn-ghost p-2 rounded-lg">
            {darkMode ? <Icons.sun size={18} /> : <Icons.moon size={18} />}
          </button>
          <button className="btn-ghost p-2 rounded-lg relative">
            <Icons.bell size={18} />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-brand-500 rounded-full" />
          </button>
        </div>
      </div>
    </header>
  );
}

function MobileMoreMenu() {
  const moreItems = NAV_ITEMS.filter(
    (i) => !MOBILE_NAV.slice(0, 4).some((m) => m.to === i.to)
  );

  return (
    <div className="p-4 pb-24 animate-fade-in">
      <h2 className="text-xl font-bold font-display text-ink-900 dark:text-white mb-4">More</h2>
      <div className="grid grid-cols-3 gap-3">
        {moreItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className="card card-hover flex flex-col items-center gap-2 p-4 text-center"
          >
            <div className="w-10 h-10 rounded-xl bg-brand-50 dark:bg-brand-500/15 flex items-center justify-center text-brand-600 dark:text-brand-400">
              <item.icon size={20} />
            </div>
            <span className="text-xs font-medium text-ink-700 dark:text-gray-300">{item.label}</span>
          </NavLink>
        ))}
        <NavLink
          to="/app/settings"
          className="card card-hover flex flex-col items-center gap-2 p-4 text-center"
        >
          <div className="w-10 h-10 rounded-xl bg-brand-50 dark:bg-brand-500/15 flex items-center justify-center text-brand-600 dark:text-brand-400">
            <Icons.settings size={20} />
          </div>
          <span className="text-xs font-medium text-ink-700 dark:text-gray-300">Settings</span>
        </NavLink>
      </div>
    </div>
  );
}

function MobileTabBar() {
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 bg-white/90 dark:bg-dark-800/90 backdrop-blur-lg border-t border-warm-200 dark:border-dark-border lg:hidden safe-bottom">
      <div className="flex items-center justify-around h-16 px-2">
        {MOBILE_NAV.map((item) => {
          const isActive = item.to === "/app/more"
            ? location.pathname === "/app/more"
            : location.pathname.startsWith(item.to);
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg transition-colors ${
                isActive ? "text-brand-600 dark:text-brand-400" : "text-ink-400 dark:text-gray-500"
              }`}
            >
              <item.icon size={20} />
              <span className="text-[10px] font-medium">{item.label}</span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}

export function AppLayout() {
  const location = useLocation();

  return (
    <div className="min-h-screen">
      <Sidebar />
      <div className="lg:pl-64">
        <TopBar />
        <main className="pb-20 lg:pb-6">
          {location.pathname === "/app/more" ? <MobileMoreMenu /> : <Outlet />}
        </main>
      </div>
      <MobileTabBar />
    </div>
  );
}
