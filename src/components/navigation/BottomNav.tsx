import { NavLink } from "react-router-dom";

const NAV_ITEMS = [
  { to: "/app/home", label: "Home", icon: HomeIcon },
  { to: "/app/explore", label: "Explore", icon: ExploreIcon },
  { to: "/app/world", label: "World", icon: WorldIcon },
  { to: "/app/creatures", label: "Creatures", icon: CreaturesIcon },
  { to: "/app/profile", label: "Profile", icon: ProfileIcon },
];

export function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white dark:bg-gray-900 border-t border-soft-gray dark:border-gray-700 shadow-nav lg:hidden">
      <div className="flex items-stretch h-16">
        {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center flex-1 gap-0.5 text-xs font-bold transition-colors ${
                isActive
                  ? "text-purple dark:text-purple"
                  : "text-gray-400 dark:text-gray-500 hover:text-adventure-navy dark:hover:text-white"
              }`
            }
          >
            {({ isActive }) => (
              <>
                <span className={`w-6 h-6 transition-transform ${isActive ? "scale-125" : ""}`}>
                  <Icon active={isActive} />
                </span>
                <span className={isActive ? "text-purple" : ""}>{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}

function HomeIcon({ active }: { active: boolean }) {
  return (
    <svg viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
      <path d="M3 12L12 3l9 9" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5 10v9a1 1 0 001 1h4v-5h4v5h4a1 1 0 001-1v-9" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ExploreIcon({ active }: { active: boolean }) {
  return (
    <svg viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
      <circle cx="11" cy="11" r="8" />
      <path d="M21 21l-4.35-4.35" strokeLinecap="round" />
    </svg>
  );
}

function WorldIcon({ active }: { active: boolean }) {
  return (
    <svg viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10" />
      <path d="M2 12h20M12 2a15 15 0 010 20M12 2a15 15 0 000 20" strokeLinecap="round" />
    </svg>
  );
}

function CreaturesIcon({ active }: { active: boolean }) {
  return (
    <svg viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
      <path d="M12 2C8 2 4 6 4 10c0 2 1 4 2 5l-1 2h14l-1-2c1-1 2-3 2-5 0-4-4-8-8-8z" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M9 10h.01M15 10h.01" strokeLinecap="round" />
      <path d="M9 14s1 1 3 1 3-1 3-1" strokeLinecap="round" />
    </svg>
  );
}

function ProfileIcon({ active }: { active: boolean }) {
  return (
    <svg viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" strokeLinecap="round" />
    </svg>
  );
}
