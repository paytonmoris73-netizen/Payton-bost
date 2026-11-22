import { useState } from "react";
import Logo from "../components/Logo";
import Icon from "../components/Icon";
import { useApp } from "../store";

const FEATURES = [
  { icon: "dumbbell", label: "Custom Workouts" },
  { icon: "apple", label: "Nutrition Tracker" },
  { icon: "bars", label: "Progress Analytics" },
  { icon: "trophy", label: "Leaderboards" },
];

export default function Welcome() {
  const finish = useApp((s) => s.finishOnboarding);
  const [name, setName] = useState("");

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[radial-gradient(ellipse_at_top,#3a1f08_0%,#0b0b0c_60%)] px-6 py-10 text-center">
      <div className="animate-fade-up">
        <Logo />
        <h1 className="mt-8 text-3xl font-extrabold">
          Train. Track. <span className="text-apex">Improve.</span>
        </h1>
        <p className="mx-auto mt-3 max-w-xs text-sm text-white/60">
          The ultimate fitness app with everything you need to reach your goals.
        </p>
      </div>

      <form
        className="mt-8 w-full max-w-xs space-y-3"
        onSubmit={(e) => {
          e.preventDefault();
          finish(name);
        }}
      >
        <label className="block text-left text-xs font-semibold text-white/60" htmlFor="name">
          What should we call you?
        </label>
        <input
          id="name"
          className="input"
          placeholder="Your name"
          value={name}
          maxLength={24}
          onChange={(e) => setName(e.target.value)}
          autoFocus
        />
        <button type="submit" className="btn-primary w-full py-3.5 text-base">
          Start Your Journey <Icon name="arrowR" size={18} />
        </button>
      </form>

      <ul className="mt-10 grid w-full max-w-xs grid-cols-4 gap-2">
        {FEATURES.map((f) => (
          <li key={f.label} className="flex flex-col items-center gap-2 text-[10px] font-medium text-white/60">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-ink-2 text-apex">
              <Icon name={f.icon} size={20} />
            </span>
            {f.label}
          </li>
        ))}
      </ul>
    </div>
  );
}
