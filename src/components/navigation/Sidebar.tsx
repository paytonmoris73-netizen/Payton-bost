import { NavLink, useNavigate } from "react-router-dom";
import { Pip } from "../mascot/Pip";
import { useApp } from "../../contexts/AppContext";
import { useTheme } from "../../contexts/ThemeContext";

const NAV_ITEMS = [
  { to: "/app/home", label: "Home", emoji: "🏠" },
  { to: "/app/explore", label: "Explore", emoji: "🔍" },
  { to: "/app/adventures", label: "Adventures", emoji: "🗺️" },
  { to: "/app/rewards", label: "Rewards", emoji: "⭐" },
  { to: "/app/profile", label: "Profile", emoji: "🦊" },
];

export function Sidebar() {
  const { activeProfile } = useApp();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  return (
    <aside className="hidden lg:flex flex-col w-64 min-h-screen bg-white dark:bg-gray-900 border-r border-soft-gray dark:border-gray-700 fixed left-0 top-0 bottom-0 z-30">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-soft-gray dark:border-gray-700">
        <div className="w-10 h-10 rounded-2xl bg-coral flex items-center justify-center shadow-sm">
          <span className="text-white font-black text-lg">P</span>
        </div>
        <div>
          <div className="font-black text-navy dark:text-white text-xl leading-none">PLAYPULSE</div>
          <div className="text-xs text-gray-400 mt-0.5">Move. Play. Explore.</div>
        </div>
      </div>

      {/* Profile pill */}
      {activeProfile && (
        <div className="mx-4 my-3 p-3 rounded-2xl bg-cream dark:bg-gray-800 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-coral/10 flex items-center justify-center text-xl">
            {activeProfile.avatarConfig.outfit || "🦊"}
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-bold text-navy dark:text-white truncate">{activeProfile.nickname}</div>
            <div className="text-xs text-coral font-semibold">⭐ {activeProfile.points} pts</div>
          </div>
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 px-3 py-2">
        {NAV_ITEMS.map(({ to, label, emoji }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-2xl mb-1 font-semibold text-sm transition-all ${
                isActive
                  ? "bg-coral text-white shadow-sm"
                  : "text-gray-500 dark:text-gray-400 hover:bg-soft-gray dark:hover:bg-gray-800 hover:text-navy dark:hover:text-white"
              }`
            }
          >
            <span className="text-lg">{emoji}</span>
            {label}
          </NavLink>
        ))}
      </nav>

      {/* PIP mascot */}
      <div className="flex justify-center py-4">
        <Pip expression="happy" size={64} animate />
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
