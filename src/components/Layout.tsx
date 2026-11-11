import { NavLink, Outlet, useLocation } from "react-router-dom";
import { Icon, type IconName } from "./Icon";
import { ToastStack } from "./ui";
import { useApp, levelFromXp } from "../state/AppContext";

const NAV: { to: string; label: string; icon: IconName }[] = [
  { to: "/app/home", label: "Home", icon: "home" },
  { to: "/app/workouts", label: "Workouts", icon: "dumbbell" },
  { to: "/app/progress", label: "Progress", icon: "chart" },
  { to: "/app/rewards", label: "Rewards", icon: "trophy" },
  { to: "/app/community", label: "Community", icon: "users" },
  { to: "/app/store", label: "Store", icon: "store" },
  { to: "/app/settings", label: "Settings", icon: "settings" },
];

const MOBILE_NAV = NAV.filter((n) =>
  ["Home", "Workouts", "Progress", "Rewards", "Community"].includes(n.label),
);

export function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="flex h-9 w-9 items-center justify-center rounded-xl gold-fill text-ink-950 shadow-glow-sm">
        <Icon name="apex" className="h-5 w-5" />
      </span>
      {!compact && (
        <span className="font-display text-lg font-bold tracking-tight">
          Apex <span className="gold-text">Fitness</span>
        </span>
      )}
    </div>
  );
}

export function AppLayout() {
  const { state } = useApp();
  const location = useLocation();
  const level = levelFromXp(state.xp);

  return (
    <div className="mx-auto flex min-h-dvh max-w-7xl">
      <ToastStack />

      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-dvh w-60 shrink-0 flex-col border-r border-line bg-ink-900/70 px-4 py-6 backdrop-blur lg:flex">
        <div className="px-2">
          <Brand />
        </div>
        <nav className="mt-8 flex flex-1 flex-col gap-1">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition-colors ${
                  isActive
                    ? "gold-fill text-ink-950 shadow-glow-sm"
                    : "text-cream-dim hover:bg-ink-800 hover:text-cream"
                }`
              }
            >
              <Icon name={item.icon} className="h-[18px] w-[18px]" />
              {item.label}
            </NavLink>
          ))}
        </nav>
        {state.profile && (
          <div className="card flex items-center gap-3 px-3 py-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-full gold-fill font-display text-sm font-bold text-ink-950">
              {state.profile.name[0]?.toUpperCase() ?? "A"}
            </span>
            <div className="min-w-0">
              <div className="truncate text-sm font-bold">{state.profile.name}</div>
              <div className="text-xs text-cream-faint">Level {level}</div>
            </div>
          </div>
        )}
      </aside>

      {/* Main */}
      <div className="min-w-0 flex-1 pb-24 lg:pb-10">
        <div key={location.pathname} className="animate-fade-up px-4 pt-6 sm:px-8">
          <Outlet />
        </div>
      </div>

      {/* Mobile bottom nav */}
      <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-line bg-ink-900/90 pb-[max(env(safe-area-inset-bottom),0.5rem)] pt-2 backdrop-blur lg:hidden">
        <div className="mx-auto flex max-w-md items-stretch justify-around px-2">
          {MOBILE_NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex w-16 flex-col items-center gap-1 rounded-xl py-1.5 text-[10px] font-bold transition-colors ${
                  isActive ? "text-gold-400" : "text-cream-faint hover:text-cream-dim"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <span
                    className={`flex h-7 w-11 items-center justify-center rounded-full transition-colors ${
                      isActive ? "bg-gold-500/15" : ""
                    }`}
                  >
                    <Icon name={item.icon} className="h-5 w-5" />
                  </span>
                  {item.label}
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}
