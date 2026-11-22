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
    <nav
      aria-label="Main"
      className="glass-bar fixed bottom-[calc(env(safe-area-inset-bottom)+0.75rem)] left-1/2 z-40 w-[calc(100%-1.5rem)] max-w-[406px] -translate-x-1/2 rounded-3xl px-1"
    >
      <ul className="flex">
        {ITEMS.map((it) => {
          const active = tab === it.tab;
          return (
            <li key={it.tab} className="flex-1">
              <button
                onClick={() => go(it.tab)}
                aria-current={active ? "page" : undefined}
                className={`flex w-full flex-col items-center gap-1 py-2.5 text-[11px] font-semibold transition ${
                  active ? "text-luna-light" : "text-white/45 hover:text-white/70"
                }`}
              >
                <span
                  className={`flex h-8 w-12 items-center justify-center rounded-full transition ${
                    active ? "gloss-tile text-white" : ""
                  }`}
                >
                  <Icon name={it.icon} size={20} />
                </span>
                {it.label}
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
