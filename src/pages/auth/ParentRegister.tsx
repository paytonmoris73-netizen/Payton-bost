import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "../../components/ui/Button";
import { useApp } from "../../contexts/AppContext";

export function ParentRegisterPage() {
  const navigate = useNavigate();
  const { register } = useApp();
  const [form, setForm] = useState({ displayName: "", email: "", password: "", confirm: "", agreed: false });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const update = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, [k]: e.target.type === "checkbox" ? e.target.checked : e.target.value }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!form.displayName.trim()) return setError("Please enter your name.");
    if (!form.email.includes("@")) return setError("Please enter a valid email address.");
    if (form.password.length < 6) return setError("Password must be at least 6 characters.");
    if (form.password !== form.confirm) return setError("Passwords don't match.");
    if (!form.agreed) return setError("Please agree to the parent consent terms.");

    setLoading(true);
    await new Promise(r => setTimeout(r, 600));
    const ok = register(form.email, form.password, form.displayName);
    setLoading(false);

    if (ok) navigate("/profiles/create");
    else setError("An account with this email already exists. Try logging in.");
  }

  return (
    <div className="min-h-screen bg-cream dark:bg-gray-950 flex flex-col">
      <div className="flex items-center px-6 py-5">
        <button onClick={() => navigate("/")} className="text-gray-400 hover:text-navy dark:hover:text-white mr-3 text-xl">‹</button>
        <div>
          <div className="font-black text-navy dark:text-white">Create Family Account</div>
          <div className="text-xs text-gray-400">Step 1 of 2 — Parent setup</div>
        </div>
      </div>

      <div className="flex-1 px-6 pb-10 max-w-sm mx-auto w-full">
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">👨‍👩‍👧</div>
          <h1 className="font-black text-xl text-navy dark:text-white">Welcome to PLAYPULSE!</h1>
          <p className="text-sm text-gray-500 mt-1">Parents create the account. Kids get the fun.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-navy dark:text-white mb-1">Your Name</label>
            <input
              type="text"
              value={form.displayName}
              onChange={update("displayName")}
              placeholder="e.g. Alex's Mum"
              className="w-full px-4 py-3 rounded-2xl border-2 border-soft-gray dark:border-gray-700 bg-white dark:bg-gray-800 text-navy dark:text-white focus:border-coral focus:outline-none transition-colors"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-navy dark:text-white mb-1">Email Address</label>
            <input
              type="email"
              value={form.email}
              onChange={update("email")}
              placeholder="parent@email.com"
              className="w-full px-4 py-3 rounded-2xl border-2 border-soft-gray dark:border-gray-700 bg-white dark:bg-gray-800 text-navy dark:text-white focus:border-coral focus:outline-none transition-colors"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-navy dark:text-white mb-1">Password</label>
            <input
              type="password"
              value={form.password}
              onChange={update("password")}
              placeholder="At least 6 characters"
              className="w-full px-4 py-3 rounded-2xl border-2 border-soft-gray dark:border-gray-700 bg-white dark:bg-gray-800 text-navy dark:text-white focus:border-coral focus:outline-none transition-colors"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-navy dark:text-white mb-1">Confirm Password</label>
            <input
              type="password"
              value={form.confirm}
              onChange={update("confirm")}
              placeholder="Repeat your password"
              className="w-full px-4 py-3 rounded-2xl border-2 border-soft-gray dark:border-gray-700 bg-white dark:bg-gray-800 text-navy dark:text-white focus:border-coral focus:outline-none transition-colors"
            />
          </div>

          <div className="bg-mint dark:bg-teal/10 rounded-2xl p-4">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={form.agreed}
                onChange={update("agreed")}
                className="mt-0.5 w-5 h-5 accent-coral flex-shrink-0"
              />
              <span className="text-xs text-navy dark:text-teal-200 leading-relaxed">
                I confirm I am the parent or guardian setting up this account. I understand PLAYPULSE is designed for children ages 8–12, and I will supervise their use of the app. I agree that no personal data beyond a nickname is collected from children.
              </span>
            </label>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-2xl px-4 py-3">{error}</div>
          )}

          <Button type="submit" fullWidth size="lg" loading={loading} className="mt-2">
            Create Account →
          </Button>
        </form>

        <div className="text-center mt-6">
          <span className="text-sm text-gray-500">Already have an account? </span>
          <Link to="/login" className="text-coral font-bold text-sm">Sign in</Link>
        </div>

        <div className="mt-6 p-4 bg-soft-gray dark:bg-gray-800 rounded-2xl">
          <div className="text-xs font-bold text-navy dark:text-white mb-2">🔒 Privacy First</div>
          <ul className="text-xs text-gray-500 space-y-1">
            <li>• No advertising to children</li>
            <li>• No public profiles or social features</li>
            <li>• Data stored locally on your device</li>
            <li>• Parent controls everything</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
