import { NavLink, useNavigate } from "react-router-dom";
import { Pip } from "../mascot/Pip";
import { useApp } from "../../contexts/AppContext";
import { useTheme } from "../../contexts/ThemeContext";

const NAV_ITEMS = [
  { to: "/app/home", label: "Home", emoji: "🏠" },
  { to: "/app/explore", label: "Explore", emoji: "🔍" },
  { to: "/app/world", label: "World Map", emoji: "🗺️" },
  { to: "/app/creatures", label: "Creatures", emoji: "🐾" },
  { to: "/app/home-base", label: "Home Base", emoji: "🏡" },
  { to: "/app/mini-games", label: "Mini-Games", emoji: "🎮" },
  { to: "/app/achievements", label: "Achievements", emoji: "🏆" },
  { to: "/app/profile", label: "Profile", emoji: "🦊" },
];

export function Sidebar() {
  const { activeProfile, levelInfo } = useApp();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  return (
    <aside className="hidden lg:flex flex-col w-64 min-h-screen bg-white dark:bg-gray-900 border-r border-soft-gray dark:border-gray-700 fixed left-0 top-0 bottom-0 z-30">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-soft-gray dark:border-gray-700">
        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-purple to-sky-blue flex items-center justify-center shadow-sm">
          <span className="text-white font-black text-lg">P</span>
        </div>
        <div>
          <div className="font-display text-adventure-navy dark:text-white text-xl leading-none">PLAYPULSE</div>
          <div className="text-xs text-gray-400 mt-0.5">Wonderworld Awaits!</div>
        </div>
      </div>

      {/* Profile pill */}
      {activeProfile && (
        <div className="mx-4 my-3 p-3 rounded-2xl bg-purple/5 dark:bg-gray-800 flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center text-xl border-2 border-purple/30"
            style={{ backgroundColor: activeProfile.avatarConfig.background }}
          >
            {activeProfile.avatarConfig.outfit || "🦊"}
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-bold text-adventure-navy dark:text-white truncate text-sm">{activeProfile.nickname}</div>
            <div className="text-xs text-purple font-bold">Lv.{levelInfo.level} {levelInfo.title}</div>
            <div className="text-xs text-gray-400">⚡ {activeProfile.points} Spark</div>
          </div>
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 px-3 py-2 overflow-y-auto">
        {NAV_ITEMS.map(({ to, label, emoji }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-2.5 rounded-2xl mb-1 font-bold text-sm transition-all ${
                isActive
                  ? "bg-gradient-to-r from-purple to-sky-blue text-white shadow-sm"
                  : "text-gray-500 dark:text-gray-400 hover:bg-soft-gray dark:hover:bg-gray-800 hover:text-adventure-navy dark:hover:text-white"
              }`
            }
          >
            <span className="text-lg">{emoji}</span>
            {label}
          </NavLink>
        ))}
      </nav>

      {/* PIP mascot */}
      <div className="flex justify-center py-3">
        <Pip expression="happy" size={56} animate />
      </div>

      {/* Bottom actions */}
      <div className="px-3 pb-4 space-y-1 border-t border-soft-gray dark:border-gray-700 pt-3">
        <button
          onClick={() => navigate("/parent")}
          className="flex items-center gap-3 px-4 py-2.5 rounded-2xl w-full text-left text-sm font-semibold text-gray-500 dark:text-gray-400 hover:bg-soft-gray dark:hover:bg-gray-800 transition-colors"
        >
          <span className="text-lg">👨‍👩‍👧</span> Parent Dashboard
        </button>
        <button
          onClick={toggleTheme}
          className="flex items-center gap-3 px-4 py-2.5 rounded-2xl w-full text-left text-sm font-semibold text-gray-500 dark:text-gray-400 hover:bg-soft-gray dark:hover:bg-gray-800 transition-colors"
        >
          <span className="text-lg">{theme === "dark" ? "☀️" : "🌙"}</span>
          {theme === "dark" ? "Light Mode" : "Dark Mode"}
        </button>
      </div>
    </aside>
  );
}
