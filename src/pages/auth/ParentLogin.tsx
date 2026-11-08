import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "../../components/ui/Button";
import { useApp } from "../../contexts/AppContext";
import { Pip } from "../../components/mascot/Pip";

export function ParentLoginPage() {
  const navigate = useNavigate();
  const { login, state } = useApp();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const update = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!form.email.includes("@")) return setError("Please enter a valid email.");
    if (!form.password) return setError("Please enter your password.");

    setLoading(true);
    await new Promise(r => setTimeout(r, 500));

    const ok = login(form.email, form.password);
    setLoading(false);

    if (ok) {
      const s = JSON.parse(localStorage.getItem("playpulse_state") ?? "{}");
      if (s.activeProfileId) navigate("/app/home");
      else navigate("/profiles");
    } else {
      if (!state.parent) {
        setError("No account found. Please create one first.");
      } else {
        setError("Incorrect email or password.");
      }
    }
  }

  return (
    <div className="min-h-screen bg-cream dark:bg-gray-950 flex flex-col">
      <div className="flex items-center px-6 py-5">
        <button onClick={() => navigate("/")} className="text-gray-400 hover:text-navy dark:hover:text-white mr-3 text-xl">‹</button>
        <div className="font-black text-navy dark:text-white">Parent Sign In</div>
      </div>

      <div className="flex-1 px-6 pb-10 max-w-sm mx-auto w-full flex flex-col">
        <div className="text-center mb-8">
          <Pip expression="happy" size={80} />
          <h1 className="font-black text-xl text-navy dark:text-white mt-3">Welcome back!</h1>
          <p className="text-sm text-gray-500 mt-1">Sign in to access your family's account.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 flex-1">
          <div>
            <label className="block text-sm font-bold text-navy dark:text-white mb-1">Email Address</label>
            <input
              type="email"
              value={form.email}
              onChange={update("email")}
              placeholder="parent@email.com"
              autoComplete="email"
              className="w-full px-4 py-3 rounded-2xl border-2 border-soft-gray dark:border-gray-700 bg-white dark:bg-gray-800 text-navy dark:text-white focus:border-coral focus:outline-none transition-colors"
            />
          </div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-sm font-bold text-navy dark:text-white">Password</label>
              <Link to="/forgot-password" className="text-xs text-coral font-semibold">Forgot?</Link>
            </div>
            <input
              type="password"
              value={form.password}
              onChange={update("password")}
              placeholder="Your password"
              autoComplete="current-password"
              className="w-full px-4 py-3 rounded-2xl border-2 border-soft-gray dark:border-gray-700 bg-white dark:bg-gray-800 text-navy dark:text-white focus:border-coral focus:outline-none transition-colors"
            />
          </div>

          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm rounded-2xl px-4 py-3">{error}</div>
          )}

          <Button type="submit" fullWidth size="lg" loading={loading} className="mt-2">
            Sign In
          </Button>

          <div className="text-center pt-2">
            <span className="text-sm text-gray-500">Don't have an account? </span>
            <Link to="/register" className="text-coral font-bold text-sm">Create one</Link>
          </div>
        </form>

        {/* Demo hint */}
        <div className="mt-6 p-4 bg-yellow/20 rounded-2xl">
          <div className="text-xs font-bold text-navy dark:text-white mb-1">🎮 Demo Mode</div>
          <p className="text-xs text-gray-600 dark:text-gray-400">
            This app stores data locally. Register with any email to get started — no verification needed!
          </p>
        </div>
      </div>
    </div>
  );
}
