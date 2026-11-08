import { NavLink, useNavigate } from "react-router-dom";
import { useApp } from "../../contexts/AppContext";

const NAV_ITEMS = [
  { to: "/app/home",        label: "Home",       icon: HomeIcon },
  { to: "/app/explore",     label: "Explore",    icon: ExploreIcon },
  { to: "/app/world",       label: "World",      icon: WorldIcon },
  { to: "/app/adventures",  label: "Adventures", icon: AdventuresIcon },
  { to: "/app/rewards",     label: "Rewards",    icon: RewardsIcon },
  { to: "/app/creatures",   label: "Creatures",  icon: CreaturesIcon },
  { to: "/app/mini-games",  label: "Mini Games", icon: GamesIcon },
  { to: "/app/profile",     label: "Profile",    icon: ProfileIcon },
];

export function Sidebar() {
  const { activeProfile, levelInfo } = useApp();
  const navigate = useNavigate();

  return (
    <aside className="hidden lg:flex flex-col w-64 min-h-screen bg-pp-surface border-r border-pp-border fixed left-0 top-0 bottom-0 z-30">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-pp-border">
        <div className="w-10 h-10 rounded-2xl bg-pp-orange flex items-center justify-center shadow-glow-orange">
          <span className="text-white font-display text-xl">P</span>
        </div>
        <div>
          <div className="font-display text-pp-cream text-xl leading-none tracking-wide">PlayPulse</div>
          <div className="text-xs text-pp-muted mt-0.5">Move. Play. Explore.</div>
        </div>
      </div>

      {/* Profile pill */}
      {activeProfile && (
        <div className="mx-4 my-3 p-3 rounded-2xl bg-pp-card border border-pp-border flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pp-orange to-pp-purple flex items-center justify-center text-xl">
            {activeProfile.avatarConfig.outfit || "🦊"}
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-bold text-pp-cream truncate">{activeProfile.nickname}</div>
            <div className="text-xs text-pp-gold font-semibold">
              Lv {levelInfo.level} · {activeProfile.points} SP
            </div>
          </div>
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 px-3 py-2 overflow-y-auto scrollbar-hide">
        {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-2.5 rounded-2xl mb-1 font-semibold text-sm transition-all ${
                isActive
                  ? "bg-pp-orange text-white shadow-glow-orange"
                  : "text-pp-muted hover:bg-pp-card hover:text-pp-cream"
              }`
            }
          >
            {({ isActive }) => (
              <>
                <span className={`w-5 h-5 ${isActive ? "text-white" : "text-pp-muted"}`}>
                  <Icon active={isActive} />
                </span>
                {label}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Bottom */}
      <div className="px-3 pb-4 space-y-1 border-t border-pp-border pt-3">
        <button
          onClick={() => navigate("/parent")}
          className="flex items-center gap-3 px-4 py-2.5 rounded-2xl w-full text-left text-sm font-semibold text-pp-muted hover:bg-pp-card hover:text-pp-cream transition-colors"
        >
          <span className="w-5 h-5">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" strokeLinecap="round" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" strokeLinecap="round" />
            </svg>
          </span>
          Parent Dashboard
        </button>
      </div>
    </aside>
  );
}

function HomeIcon({ active }: { active: boolean }) {
  return <svg viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2"><path d="M3 12L12 3l9 9" strokeLinecap="round" strokeLinejoin="round" /><path d="M5 10v9a1 1 0 001 1h4v-5h4v5h4a1 1 0 001-1v-9" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}
function ExploreIcon({ active }: { active: boolean }) {
  return <svg viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" strokeLinecap="round" /></svg>;
}
function WorldIcon({ active }: { active: boolean }) {
  return <svg viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><path d="M2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" strokeLinecap="round" /></svg>;
}
function AdventuresIcon({ active }: { active: boolean }) {
  return <svg viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2"><path d="M3 17l4-8 4 4 4-6 4 10" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}
function RewardsIcon({ active }: { active: boolean }) {
  return <svg viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}
function CreaturesIcon({ active }: { active: boolean }) {
  return <svg viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2"><path d="M12 2C8 2 4 6 4 10c0 2 1 4 2 5l-1 2h14l-1-2c1-1 2-3 2-5 0-4-4-8-8-8z" strokeLinecap="round" strokeLinejoin="round" /><path d="M9 10h.01M15 10h.01M9 14s1 1 3 1 3-1 3-1" strokeLinecap="round" /></svg>;
}
function GamesIcon({ active }: { active: boolean }) {
  return <svg viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2"><rect x="2" y="6" width="20" height="12" rx="2" /><path d="M6 12h4M8 10v4M15 11h.01M18 13h.01" strokeLinecap="round" /></svg>;
}
function ProfileIcon({ active }: { active: boolean }) {
  return <svg viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2"><circle cx="12" cy="8" r="4" /><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" strokeLinecap="round" /></svg>;
}
