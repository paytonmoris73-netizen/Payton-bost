import Icon from "./Icon";
import { useNav } from "../store";
import type { Tab } from "../types";

const ITEMS: { tab: Tab; label: string; icon: string }[] = [
  { tab: "home", label: "Home", icon: "home" },
  { tab: "workouts", label: "Workouts", icon: "dumbbell" },
  { tab: "nutrition", label: "Nutrition", icon: "apple" },
  { tab: "coach", label: "Coach", icon: "sparkle" },
  { tab: "profile", label: "Profile", icon: "user" },
];

export default function BottomNav() {
  const tab = useNav((s) => s.tab);
  const go = useNav((s) => s.go);
  return (
    <nav className="fixed bottom-0 left-1/2 z-40 w-full max-w-[430px] -translate-x-1/2 border-t border-line bg-ink/95 pb-[env(safe-area-inset-bottom)] backdrop-blur">
      <ul className="flex">
        {ITEMS.map((it) => {
          const active = tab === it.tab;
          return (
            <li key={it.tab} className="flex-1">
              <button
                onClick={() => go(it.tab)}
                aria-current={active ? "page" : undefined}
                className={`flex w-full flex-col items-center gap-1 py-3 text-[11px] font-semibold transition ${
                  active ? "text-apex" : "text-white/45"
                }`}
              >
                <Icon name={it.icon} size={22} />
                {it.label}
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
