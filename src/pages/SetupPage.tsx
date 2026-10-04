import { useState } from "react";
import { api } from "../lib/api";
import type { User } from "../lib/types";

interface Props {
  onSetup: (owner: User, token: string) => void;
}

export function SetupPage({ onSetup }: Props) {
  const [companyName, setCompanyName] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [pin, setPin] = useState("");
  const [pin2, setPin2] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!companyName.trim() || !ownerName.trim()) return;
    if (!/^\d{4,8}$/.test(pin)) { setError("PIN must be 4–8 digits."); return; }
    if (pin !== pin2) { setError("PINs don't match."); return; }
    setLoading(true);
    setError("");
    try {
      const result = await api.setup(companyName.trim(), ownerName.trim(), pin);
      onSetup(result.user, result.token);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Setup failed.");
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <div className="auth-logo-icon">🏢</div>
          <h1>WorkBase</h1>
          <p>Set up your company workspace</p>
        </div>

        <h2>Create your company</h2>
        <p className="subtitle">You'll be the owner. Employees can join with an invite code.</p>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Company Name</label>
            <input
              type="text"
              value={companyName}
              onChange={e => setCompanyName(e.target.value)}
              placeholder="e.g. Acme Inc."
              autoFocus
              required
            />
          </div>
          <div className="form-group">
            <label>Your Name</label>
            <input
              type="text"
              value={ownerName}
              onChange={e => setOwnerName(e.target.value)}
              placeholder="e.g. Jane Smith"
              required
            />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div className="form-group">
              <label>Create a PIN</label>
              <input type="password" inputMode="numeric" autoComplete="new-password" value={pin} onChange={e => setPin(e.target.value.replace(/\D/g, "").slice(0, 8))} placeholder="4–8 digits" required />
            </div>
            <div className="form-group">
              <label>Confirm PIN</label>
              <input type="password" inputMode="numeric" autoComplete="new-password" value={pin2} onChange={e => setPin2(e.target.value.replace(/\D/g, "").slice(0, 8))} placeholder="Repeat PIN" required />
            </div>
          </div>
          {error && <p className="error-msg">{error}</p>}
          <div style={{ marginTop: 20 }}>
            <button
              type="submit"
              className="btn btn-primary btn-full btn-lg"
              disabled={loading || !companyName.trim() || !ownerName.trim() || pin.length < 4}
            >
              {loading ? "Creating..." : "Create Company"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
