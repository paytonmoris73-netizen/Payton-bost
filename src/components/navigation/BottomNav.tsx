import { NavLink } from "react-router-dom";

const NAV_ITEMS = [
  { to: "/app/home",          label: "Home",    icon: HomeIcon },
  { to: "/app/workout-plans", label: "Workout", icon: WorkoutIcon },
  { to: "/app/world",         label: "World",   icon: WorldIcon },
  { to: "/app/rewards",       label: "Rewards", icon: RewardsIcon },
  { to: "/app/profile",       label: "Profile", icon: ProfileIcon },
];

export function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-pp-surface border-t border-pp-border shadow-nav lg:hidden">
      <div className="flex items-stretch h-16 px-1">
        {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center flex-1 gap-0.5 text-[10px] font-bold transition-all ${
                isActive ? "text-pp-orange" : "text-pp-muted hover:text-pp-cream"
              }`
            }
          >
            {({ isActive }) => (
              <>
                <span className={`w-6 h-6 transition-transform ${isActive ? "scale-110" : ""}`}>
                  <Icon active={isActive} />
                </span>
                <span>{label}</span>
                {isActive && (
                  <span className="w-1 h-1 rounded-full bg-pp-orange" />
                )}
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

function WorkoutIcon({ active }: { active: boolean }) {
  return (
    <svg viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
      <path d="M6 4v16M18 4v16M6 12h12M3 7l3-3M21 7l-3-3M3 17l3 3M21 17l-3 3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function WorldIcon({ active }: { active: boolean }) {
  return (
    <svg viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10" />
      <path d="M2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" strokeLinecap="round" />
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
