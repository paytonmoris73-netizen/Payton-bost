import { NavLink } from "react-router-dom";
import { Icon, type IconName } from "../Icon";

const ITEMS: { to: string; label: string; icon: IconName }[] = [
  { to: "/app/home", label: "Home", icon: "home" },
  { to: "/app/tutor", label: "AI Tutor", icon: "brain" },
  { to: "/app/audio", label: "Record", icon: "mic" },
  { to: "/app/tests", label: "Tests", icon: "test-tube" },
  { to: "/app/library", label: "Library", icon: "library" },
];

export function MobileNav() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-surface-1/95 pb-[max(env(safe-area-inset-bottom),0.25rem)] pt-1.5 backdrop-blur-md lg:hidden">
      <div className="mx-auto flex max-w-md items-stretch justify-around px-1">
        {ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex w-16 flex-col items-center gap-0.5 rounded-lg py-1.5 text-[10px] font-semibold transition-colors ${
                isActive ? "text-accent" : "text-text-tertiary"
              }`
            }
          >
            {({ isActive }) => (
              <>
                <span className={`flex h-7 w-10 items-center justify-center rounded-full transition-colors ${
                  isActive ? "bg-accent-subtle" : ""
                }`}>
                  <Icon name={item.icon} className="h-5 w-5" />
                </span>
                {item.label}
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
