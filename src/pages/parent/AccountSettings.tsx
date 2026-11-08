import { useNavigate } from "react-router-dom";
import { useApp } from "../../contexts/AppContext";
import { Button } from "../../components/ui/Button";
import { Modal } from "../../components/ui/Modal";
import { useState } from "react";

export function AccountSettingsPage() {
  const navigate = useNavigate();
  const { state, updateParentSettings, logout } = useApp();
  const [name, setName] = useState(state.parent?.displayName ?? "");
  const [showClear, setShowClear] = useState(false);
  const [saved, setSaved] = useState(false);

  function handleSave() {
    updateParentSettings({ displayName: name });
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  }

  function clearAllData() {
    localStorage.removeItem("playpulse_state");
    logout();
    navigate("/");
  }

  if (!state.parent) return null;

  return (
    <div className="min-h-screen bg-soft-gray dark:bg-gray-950 pb-10">
      <div className="bg-white dark:bg-gray-900 px-6 py-5 border-b border-soft-gray dark:border-gray-700 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="text-gray-400 hover:text-navy text-xl">‹</button>
        <div className="font-black text-navy dark:text-white">Account Settings</div>
      </div>

      <div className="max-w-lg mx-auto px-6 py-6 space-y-4">
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-5 shadow-card space-y-4">
          <div>
            <label className="block text-sm font-bold text-navy dark:text-white mb-1">Display Name</label>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl border-2 border-soft-gray dark:border-gray-700 bg-white dark:bg-gray-800 text-navy dark:text-white focus:border-coral focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-navy dark:text-white mb-1">Email</label>
            <div className="px-4 py-3 rounded-2xl bg-soft-gray dark:bg-gray-800 text-gray-500 text-sm">
              {state.parent.email}
            </div>
          </div>
          <Button fullWidth variant={saved ? "teal" : "primary"} onClick={handleSave}>
            {saved ? "✓ Saved!" : "Save Changes"}
          </Button>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-2xl p-5 shadow-card">
          <div className="font-black text-navy dark:text-white mb-1">Account created</div>
          <div className="text-sm text-gray-500">{new Date(state.parent.createdAt).toLocaleDateString()}</div>
        </div>

        <div className="bg-red-50 dark:bg-red-900/20 rounded-2xl p-5">
          <div className="font-bold text-red-700 dark:text-red-400 mb-1">Danger Zone</div>
          <p className="text-xs text-gray-500 mb-3">Clearing all data permanently removes your account, all child profiles, and all progress. This cannot be undone.</p>
          <Button variant="danger" size="sm" onClick={() => setShowClear(true)}>
            Clear All Data
          </Button>
        </div>
      </div>

      <Modal open={showClear} onClose={() => setShowClear(false)} title="Clear All Data?" size="sm">
        <div className="text-center">
          <div className="text-4xl mb-3">⚠️</div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            This will permanently delete your account and all child profiles. This cannot be undone.
          </p>
          <div className="flex gap-3">
            <Button variant="secondary" fullWidth onClick={() => setShowClear(false)}>Cancel</Button>
            <Button variant="danger" fullWidth onClick={clearAllData}>Delete Everything</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
