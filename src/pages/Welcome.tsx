import { useNavigate } from "react-router-dom";
import { Pip } from "../components/mascot/Pip";
import { Button } from "../components/ui/Button";
import { useApp } from "../contexts/AppContext";
import { useEffect } from "react";

export function WelcomePage() {
  const navigate = useNavigate();
  const { state } = useApp();

  useEffect(() => {
    if (state.parent) {
      if (state.activeProfileId) navigate("/app/home");
      else navigate("/profiles");
    }
  }, [state.parent, state.activeProfileId, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-cream to-white dark:from-gray-900 dark:to-gray-950 flex flex-col">
      {/* Hero */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 text-center pt-12 pb-6">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 bg-coral/10 text-coral font-bold text-xs px-4 py-2 rounded-full mb-8 animate-fade-in">
          <span>✨</span> The movement app kids love
        </div>

        {/* Logo */}
        <div className="mb-4 animate-pop">
          <div className="inline-flex items-center gap-3">
            <div className="w-14 h-14 rounded-3xl bg-coral flex items-center justify-center shadow-lg">
              <span className="text-white font-black text-2xl">P</span>
            </div>
            <div className="text-left">
              <div className="font-black text-navy dark:text-white text-4xl leading-none tracking-tight">PLAY</div>
              <div className="font-black text-coral text-4xl leading-none tracking-tight">PULSE</div>
            </div>
          </div>
        </div>

        {/* PIP mascot */}
        <div className="my-6">
          <Pip expression="excited" size={140} animate />
        </div>

        {/* Tagline */}
        <h1 className="text-2xl font-black text-navy dark:text-white mb-3 leading-tight">
          Move. Play. Explore. Repeat.
        </h1>
        <p className="text-gray-500 dark:text-gray-400 max-w-sm text-sm leading-relaxed">
          Join PIP on amazing adventures! Discover fun activities, earn rewards, and love being active.
        </p>

        {/* Features */}
        <div className="grid grid-cols-3 gap-3 mt-8 w-full max-w-sm">
          {[
            { emoji: "🎮", label: "25+ Activities" },
            { emoji: "🗺️", label: "Adventure Worlds" },
            { emoji: "⭐", label: "Earn Rewards" },
          ].map(f => (
            <div key={f.label} className="bg-white dark:bg-gray-800 rounded-2xl p-3 shadow-card text-center">
              <div className="text-2xl mb-1">{f.emoji}</div>
              <div className="text-xs font-bold text-navy dark:text-white">{f.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="px-6 pb-10 space-y-3 max-w-sm mx-auto w-full">
        <Button
          variant="primary"
          size="lg"
          fullWidth
          onClick={() => navigate("/register")}
          className="font-black text-base"
        >
          Start Your Adventure! 🚀
        </Button>
        <Button
          variant="ghost"
          size="lg"
          fullWidth
          onClick={() => navigate("/login")}
        >
          I already have an account
        </Button>
        <p className="text-center text-xs text-gray-400 mt-2">
          Designed for kids ages 8–12. Parent setup required.
        </p>
      </div>
    </div>
  );
}
