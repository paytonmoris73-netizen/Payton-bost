import { useState } from "react";
import { api } from "../lib/api";
import type { User } from "../lib/types";

interface Props {
  onSetup: (owner: User) => void;
}

export function SetupPage({ onSetup }: Props) {
  const [companyName, setCompanyName] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!companyName.trim() || !ownerName.trim()) return;
    setLoading(true);
    setError("");
    try {
      const result = await api.setup(companyName.trim(), ownerName.trim());
      onSetup(result.user);
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
          {error && <p className="error-msg">{error}</p>}
          <div style={{ marginTop: 20 }}>
            <button
              type="submit"
              className="btn btn-primary btn-full btn-lg"
              disabled={loading || !companyName.trim() || !ownerName.trim()}
            >
              {loading ? "Creating..." : "Create Company"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
