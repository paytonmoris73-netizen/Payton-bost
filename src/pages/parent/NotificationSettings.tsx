import { useNavigate } from "react-router-dom";
import { useApp } from "../../contexts/AppContext";
import { Button } from "../../components/ui/Button";
import { useState } from "react";

export function NotificationSettingsPage() {
  const navigate = useNavigate();
  const { state, updateParentSettings } = useApp();
  const [enabled, setEnabled] = useState(state.parent?.notificationsEnabled ?? true);
  const [saved, setSaved] = useState(false);

  function handleSave() {
    updateParentSettings({ notificationsEnabled: enabled });
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  }

  return (
    <div className="min-h-screen bg-soft-gray dark:bg-gray-950 pb-10">
      <div className="bg-white dark:bg-gray-900 px-6 py-5 border-b border-soft-gray dark:border-gray-700 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="text-gray-400 hover:text-navy text-xl">‹</button>
        <div className="font-black text-navy dark:text-white">Notification Settings</div>
      </div>
      <div className="max-w-lg mx-auto px-6 py-6 space-y-4">
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-5 shadow-card">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-bold text-navy dark:text-white">Enable Notifications</div>
              <div className="text-xs text-gray-400 mt-0.5">New adventures, achievements, and rewards</div>
            </div>
            <button
              onClick={() => setEnabled(!enabled)}
              className={`w-12 h-6 rounded-full transition-colors ${enabled ? "bg-coral" : "bg-gray-300 dark:bg-gray-600"}`}
            >
              <div className={`w-5 h-5 rounded-full bg-white shadow transition-transform mx-0.5 ${enabled ? "translate-x-6" : ""}`} />
            </button>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-2xl p-5 shadow-card">
          <div className="font-bold text-navy dark:text-white mb-2">What we'll never send</div>
          <ul className="text-sm text-gray-500 space-y-1">
            <li>• Notifications designed to pressure children to exercise</li>
            <li>• Messages that make kids feel bad for missing a day</li>
            <li>• Promotional advertisements</li>
            <li>• Messages from strangers or other users</li>
          </ul>
        </div>

        <Button fullWidth variant={saved ? "teal" : "primary"} onClick={handleSave}>
          {saved ? "✓ Saved!" : "Save Settings"}
        </Button>
      </div>
    </div>
  );
}
