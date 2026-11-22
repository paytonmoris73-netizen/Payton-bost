import Icon from "./Icon";
import { useNav } from "../store";
import type { Tab } from "../types";

const ITEMS: { tab: Tab; label: string; icon: string }[] = [
  { tab: "home", label: "Today", icon: "home" },
  { tab: "workouts", label: "Train", icon: "dumbbell" },
  { tab: "nutrition", label: "Nutrition", icon: "apple" },
  { tab: "coach", label: "Coach", icon: "message" },
  { tab: "profile", label: "Profile", icon: "user" },
];

export default function BottomNav() {
  const tab = useNav((s) => s.tab);
  const go = useNav((s) => s.go);
  return (
    <nav
      aria-label="Main"
      className="glass-bar fixed bottom-0 left-1/2 z-40 w-full max-w-[430px] -translate-x-1/2 !border-x-0 !border-b-0 pb-[env(safe-area-inset-bottom)]"
    >
      <ul className="flex">
        {ITEMS.map((it) => {
          const active = tab === it.tab;
          return (
            <li key={it.tab} className="flex-1">
              <button
                onClick={() => go(it.tab)}
                aria-current={active ? "page" : undefined}
                className={`flex w-full flex-col items-center gap-1.5 pb-2.5 pt-3 text-[10px] font-medium uppercase tracking-[0.12em] transition-colors ${
                  active ? "text-[#f2eee8]" : "text-white/35 hover:text-white/60"
                }`}
              >
                <Icon name={it.icon} size={20} strokeWidth={active ? 1.8 : 1.5} />
                {it.label}
                <span className={`h-[3px] w-[3px] rounded-full ${active ? "bg-luna" : "bg-transparent"}`} aria-hidden="true" />
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
