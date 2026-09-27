import { useEffect, useState } from "react";
import { api } from "../lib/api";
import type { User } from "../lib/types";

interface Props {
  onLogin: (user: User) => void;
}

function initials(name: string) {
  return name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
}

export function LoginPage({ onLogin }: Props) {
  const [users, setUsers] = useState<User[]>([]);
  const [mode, setMode] = useState<"list" | "join">("list");
  const [joinCode, setJoinCode] = useState("");
  const [joinName, setJoinName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    api.getTeam().then(team => setUsers(team.filter(u => u.active))).catch(() => {});
  }, []);

  async function handleSelect(name: string) {
    setLoading(true);
    setError("");
    try {
      const user = await api.login(name);
      onLogin(user);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed.");
      setLoading(false);
    }
  }

  async function handleJoin(e: React.FormEvent) {
    e.preventDefault();
    if (!joinCode.trim() || !joinName.trim()) return;
    setLoading(true);
    setError("");
    try {
      const user = await api.join(joinCode.trim(), joinName.trim());
      onLogin(user);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not join.");
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <div className="auth-logo-icon">🏢</div>
          <h1>WorkBase</h1>
          <p>Sign in to your workspace</p>
        </div>

        {mode === "list" ? (
          <>
            <h2>Who are you?</h2>
            <p className="subtitle">Select your name to sign in.</p>
            {users.length > 0 ? (
              <div className="user-list">
                {users.map(u => (
                  <div key={u.id} className="user-card" onClick={() => !loading && handleSelect(u.name)}>
                    <div className="user-avatar">{initials(u.name)}</div>
                    <div className="user-card-info">
                      <div className="name">{u.name}</div>
                      <div className="role">{u.title} · {u.role === "owner" ? "Owner" : "Employee"}</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted" style={{ marginBottom: 20 }}>No team members yet.</p>
            )}
            {error && <p className="error-msg" style={{ marginBottom: 12 }}>{error}</p>}
            <div className="divider"><span>OR</span></div>
            <button className="btn btn-secondary btn-full" onClick={() => { setMode("join"); setError(""); }}>
              Join with Invite Code
            </button>
          </>
        ) : (
          <>
            <button className="back-link" onClick={() => { setMode("list"); setError(""); }}>
              ← Back
            </button>
            <h2>Join a company</h2>
            <p className="subtitle">Enter the invite code from your manager and your name.</p>
            <form onSubmit={handleJoin}>
              <div className="form-group">
                <label>Invite Code</label>
                <input
                  type="text"
                  value={joinCode}
                  onChange={e => setJoinCode(e.target.value.toUpperCase())}
                  placeholder="e.g. AB3X9K"
                  style={{ letterSpacing: "0.2em", fontFamily: "monospace", fontSize: 16 }}
                  autoFocus
                  required
                />
              </div>
              <div className="form-group">
                <label>Your Name</label>
                <input
                  type="text"
                  value={joinName}
                  onChange={e => setJoinName(e.target.value)}
                  placeholder="e.g. Alex Johnson"
                  required
                />
              </div>
              {error && <p className="error-msg">{error}</p>}
              <div style={{ marginTop: 20 }}>
                <button
                  type="submit"
                  className="btn btn-primary btn-full"
                  disabled={loading || !joinCode.trim() || !joinName.trim()}
                >
                  {loading ? "Joining..." : "Join Company"}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
