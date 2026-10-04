import { useEffect, useRef, useState } from "react";
import { api } from "../lib/api";
import type { PublicUser, User } from "../lib/types";

interface Props {
  onLogin: (user: User, token: string) => void;
}

function initials(name: string) {
  return name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
}

const digitsOnly = (v: string) => v.replace(/\D/g, "").slice(0, 8);

export function LoginPage({ onLogin }: Props) {
  const [users, setUsers] = useState<PublicUser[]>([]);
  const [mode, setMode] = useState<"list" | "pin" | "join">("list");
  const [selected, setSelected] = useState<PublicUser | null>(null);
  const [pin, setPin] = useState("");
  const [claimCode, setClaimCode] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [joinName, setJoinName] = useState("");
  const [joinPin, setJoinPin] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const pinRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    api.getLoginUsers().then(setUsers).catch(() => {});
  }, []);

  useEffect(() => { if (mode === "pin") setTimeout(() => pinRef.current?.focus(), 30); }, [mode]);

  function choose(u: PublicUser) {
    setSelected(u); setPin(""); setClaimCode(""); setError(""); setMode("pin");
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!selected || pin.length < 4) return;
    setLoading(true); setError("");
    try {
      const { user, token } = await api.login(selected.name, pin, needsCode ? claimCode.trim() : undefined);
      onLogin(user, token);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed.");
      setPin("");
      setLoading(false);
    }
  }

  async function handleJoin(e: React.FormEvent) {
    e.preventDefault();
    if (!joinCode.trim() || !joinName.trim() || joinPin.length < 4) return;
    setLoading(true); setError("");
    try {
      const { user, token } = await api.join(joinCode.trim(), joinName.trim(), joinPin);
      onLogin(user, token);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not join.");
      setLoading(false);
    }
  }

  const needsCode = !!selected && !selected.hasPin && selected.role !== "owner";
  const shown = query.trim() ? users.filter(u => u.name.toLowerCase().includes(query.toLowerCase())) : users;

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <div className="auth-logo-icon">🏢</div>
          <h1>WorkBase</h1>
          <p>Sign in to your workspace</p>
        </div>

        {mode === "list" && (
          <>
            <h2>Who are you?</h2>
            <p className="subtitle">Select your name, then enter your PIN.</p>
            {users.length > 6 && (
              <div className="form-group">
                <input type="search" value={query} onChange={e => setQuery(e.target.value)} placeholder="Search your name…" aria-label="Search team members" />
              </div>
            )}
            {users.length > 0 ? (
              <div className="user-list">
                {shown.map(u => (
                  <button type="button" key={u.id} className="user-card" onClick={() => choose(u)}>
                    <div className="user-avatar">{initials(u.name)}</div>
                    <div className="user-card-info">
                      <div className="name">{u.name}</div>
                      <div className="role">{u.title} · {u.role === "owner" ? "Owner" : "Employee"}</div>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-muted" style={{ marginBottom: 20 }}>No team members yet.</p>
            )}
            <div className="divider"><span>OR</span></div>
            <button className="btn btn-secondary btn-full" onClick={() => { setMode("join"); setError(""); }}>
              Join with Invite Code
            </button>
          </>
        )}

        {mode === "pin" && selected && (
          <>
            <button className="back-link" onClick={() => { setMode("list"); setError(""); }}>← Back</button>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18 }}>
              <div className="user-avatar">{initials(selected.name)}</div>
              <div>
                <h2 style={{ margin: 0 }}>{selected.name}</h2>
                <p className="subtitle" style={{ margin: 0 }}>{selected.hasPin ? "Enter your PIN" : "Create a 4–8 digit PIN to secure your account"}</p>
              </div>
            </div>
            <form onSubmit={handleLogin}>
              {needsCode && (
                <div className="form-group">
                  <label htmlFor="claim-code">Invite code</label>
                  <input id="claim-code" type="text" value={claimCode} onChange={e => setClaimCode(e.target.value.toUpperCase())} placeholder="From your manager" style={{ letterSpacing: "0.2em", fontFamily: "monospace" }} />
                </div>
              )}
              <div className="form-group">
                <label htmlFor="pin">{selected.hasPin ? "PIN" : "New PIN"}</label>
                <input
                  id="pin"
                  ref={pinRef}
                  type="password"
                  inputMode="numeric"
                  autoComplete={selected.hasPin ? "current-password" : "new-password"}
                  value={pin}
                  onChange={e => setPin(digitsOnly(e.target.value))}
                  placeholder="••••"
                  style={{ letterSpacing: "0.4em", fontSize: 20, textAlign: "center" }}
                />
              </div>
              {error && <p className="error-msg">{error}</p>}
              <button type="submit" className="btn btn-primary btn-full" style={{ marginTop: 12 }} disabled={loading || pin.length < 4 || (needsCode && !claimCode.trim())}>
                {loading ? "Signing in…" : "Sign in"}
              </button>
            </form>
          </>
        )}

        {mode === "join" && (
          <>
            <button className="back-link" onClick={() => { setMode("list"); setError(""); }}>← Back</button>
            <h2>Join a company</h2>
            <p className="subtitle">Enter the invite code from your manager, your name, and a PIN you'll use to sign in.</p>
            <form onSubmit={handleJoin}>
              <div className="form-group">
                <label>Invite Code</label>
                <input type="text" value={joinCode} onChange={e => setJoinCode(e.target.value.toUpperCase())} placeholder="e.g. AB3X9K" style={{ letterSpacing: "0.2em", fontFamily: "monospace", fontSize: 16 }} autoFocus required />
              </div>
              <div className="form-group">
                <label>Your Name</label>
                <input type="text" value={joinName} onChange={e => setJoinName(e.target.value)} placeholder="e.g. Alex Johnson" required />
              </div>
              <div className="form-group">
                <label>Create a PIN</label>
                <input type="password" inputMode="numeric" autoComplete="new-password" value={joinPin} onChange={e => setJoinPin(digitsOnly(e.target.value))} placeholder="4–8 digits" required />
              </div>
              {error && <p className="error-msg">{error}</p>}
              <div style={{ marginTop: 20 }}>
                <button type="submit" className="btn btn-primary btn-full" disabled={loading || !joinCode.trim() || !joinName.trim() || joinPin.length < 4}>
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
