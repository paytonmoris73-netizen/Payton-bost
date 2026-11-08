import { useNavigate } from "react-router-dom";
import { useApp } from "../../contexts/AppContext";
import { Button } from "../../components/ui/Button";
import { Modal } from "../../components/ui/Modal";
import { useState } from "react";

export function FamilySettingsPage() {
  const navigate = useNavigate();
  const { state, removeProfile } = useApp();
  const [deleteId, setDeleteId] = useState<string | null>(null);

  function confirmDelete() {
    if (!deleteId) return;
    removeProfile(deleteId);
    setDeleteId(null);
  }

  return (
    <div className="min-h-screen bg-soft-gray dark:bg-gray-950 pb-10">
      <div className="bg-white dark:bg-gray-900 px-6 py-5 border-b border-soft-gray dark:border-gray-700 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="text-gray-400 hover:text-navy text-xl">‹</button>
        <div className="font-black text-navy dark:text-white">Family Settings</div>
      </div>

      <div className="max-w-lg mx-auto px-6 py-6 space-y-4">
        <div>
          <div className="font-bold text-sm text-gray-500 mb-2">Child Profiles</div>
          {state.profiles.map(profile => (
            <div key={profile.id} className="bg-white dark:bg-gray-900 rounded-2xl p-4 shadow-card mb-3 flex items-center gap-3">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center text-2xl"
                style={{ backgroundColor: profile.avatarConfig.background }}
              >
                {profile.avatarConfig.outfit}
              </div>
              <div className="flex-1">
                <div className="font-bold text-navy dark:text-white">{profile.nickname}</div>
                <div className="text-xs text-gray-400">Age {profile.ageRange}</div>
              </div>
              <button
                onClick={() => setDeleteId(profile.id)}
                className="text-red-400 hover:text-red-600 text-sm font-bold"
              >
                Remove
              </button>
            </div>
          ))}
          <Button size="sm" variant="secondary" onClick={() => navigate("/profiles/create")}>
            + Add Profile
          </Button>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 shadow-card">
          <div className="font-black text-navy dark:text-white mb-1">Screen Time</div>
          <p className="text-sm text-gray-500">Set daily session limits in a future update. For now, all activity time is unlimited and parent-supervised.</p>
        </div>
      </div>

      <Modal open={!!deleteId} onClose={() => setDeleteId(null)} title="Remove Profile?" size="sm">
        <div className="text-center">
          <div className="text-4xl mb-3">⚠️</div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            This will permanently delete the profile and all its progress, points, and achievements.
          </p>
          <div className="flex gap-3">
            <Button variant="secondary" fullWidth onClick={() => setDeleteId(null)}>Cancel</Button>
            <Button variant="danger" fullWidth onClick={confirmDelete}>Delete</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
