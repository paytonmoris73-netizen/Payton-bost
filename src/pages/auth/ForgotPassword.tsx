import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "../../components/ui/Button";

export function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSent(true);
  }

  return (
    <div className="min-h-screen bg-cream dark:bg-gray-950 flex flex-col">
      <div className="flex items-center px-6 py-5">
        <button onClick={() => navigate("/login")} className="text-gray-400 hover:text-navy dark:hover:text-white mr-3 text-xl">‹</button>
        <div className="font-black text-navy dark:text-white">Reset Password</div>
      </div>

      <div className="flex-1 px-6 pb-10 max-w-sm mx-auto w-full">
        {sent ? (
          <div className="text-center pt-16">
            <div className="text-6xl mb-4">📬</div>
            <h2 className="font-black text-xl text-navy dark:text-white mb-2">Check your email!</h2>
            <p className="text-sm text-gray-500 mb-6">
              In a production app, we'd send a reset link to <strong>{email}</strong>. Since this is demo mode, your data is stored locally.
            </p>
            <Button onClick={() => navigate("/login")} variant="primary">
              Back to Sign In
            </Button>
          </div>
        ) : (
          <>
            <div className="text-center mb-8">
              <div className="text-5xl mb-3">🔑</div>
              <h1 className="font-black text-xl text-navy dark:text-white">Forgot your password?</h1>
              <p className="text-sm text-gray-500 mt-1">Enter your email and we'll help you reset it.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-navy dark:text-white mb-1">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="parent@email.com"
                  className="w-full px-4 py-3 rounded-2xl border-2 border-soft-gray dark:border-gray-700 bg-white dark:bg-gray-800 text-navy dark:text-white focus:border-coral focus:outline-none"
                />
              </div>
              <Button type="submit" fullWidth size="lg">Send Reset Link</Button>
            </form>

            <div className="text-center mt-6">
              <Link to="/login" className="text-coral font-bold text-sm">Back to Sign In</Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
