import { NavLink } from "react-router-dom";

const NAV_ITEMS = [
  { to: "/app/home", label: "Home", icon: HomeIcon },
  { to: "/app/explore", label: "Explore", icon: ExploreIcon },
  { to: "/app/adventures", label: "Adventures", icon: AdventuresIcon },
  { to: "/app/rewards", label: "Rewards", icon: RewardsIcon },
  { to: "/app/profile", label: "Profile", icon: ProfileIcon },
];

export function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white dark:bg-navy border-t border-soft-gray dark:border-gray-700 shadow-nav lg:hidden">
      <div className="flex items-stretch h-16">
        {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center flex-1 gap-0.5 text-xs font-semibold transition-colors ${
                isActive
                  ? "text-coral"
                  : "text-gray-400 dark:text-gray-500 hover:text-navy dark:hover:text-white"
              }`
            }
          >
            {({ isActive }) => (
              <>
                <span className={`w-6 h-6 transition-transform ${isActive ? "scale-110" : ""}`}>
                  <Icon active={isActive} />
                </span>
                <span>{label}</span>
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

function AdventuresIcon({ active }: { active: boolean }) {
  return (
    <svg viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
      <path d="M3 17l4-8 4 4 4-6 4 10H3z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function RewardsIcon({ active }: { active: boolean }) {
  return (
    <svg viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" strokeLinecap="round" strokeLinejoin="round" />
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
