import { useState } from "react";
import Logo from "../components/Logo";
import { useApp } from "../store";

export default function Welcome() {
  const finish = useApp((s) => s.finishOnboarding);
  const [name, setName] = useState("");

  return (
    <div className="flex min-h-dvh flex-col px-8 pb-[calc(env(safe-area-inset-bottom)+2.5rem)] pt-[calc(env(safe-area-inset-top)+4rem)]">
      <div className="animate-fade-up flex flex-1 flex-col items-center justify-center text-center">
        <Logo />
        <h1 className="display mt-14 text-[34px]">
          Train with <span className="italic text-luna-light">intention.</span>
        </h1>
        <p className="mx-auto mt-4 max-w-[17rem] text-sm leading-relaxed text-white/50">
          Guided sessions, nutrition and progress, considered together.
        </p>
      </div>

      <form
        className="mx-auto w-full max-w-xs space-y-3"
        onSubmit={(e) => {
          e.preventDefault();
          finish(name);
        }}
      >
        <label className="eyebrow block text-left" htmlFor="name">
          Your first name
        </label>
        <input
          id="name"
          className="input"
          placeholder="First name"
          value={name}
          maxLength={24}
          onChange={(e) => setName(e.target.value)}
          autoComplete="given-name"
        />
        <button type="submit" className="btn-primary w-full py-3.5">
          Continue
        </button>
        <p className="pt-2 text-center text-[11px] text-white/30">Your data stays on this device.</p>
      </form>
    </div>
  );
}
