import { useNavigate } from "react-router-dom";

export function PrivacySettingsPage() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-soft-gray dark:bg-gray-950 pb-10">
      <div className="bg-white dark:bg-gray-900 px-6 py-5 border-b border-soft-gray dark:border-gray-700 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="text-gray-400 hover:text-navy text-xl">‹</button>
        <div className="font-black text-navy dark:text-white">Privacy Settings</div>
      </div>
      <div className="max-w-lg mx-auto px-6 py-6 space-y-4">
        {[
          { emoji: "🗂️", title: "Data Storage", desc: "All app data is stored locally on this device using browser storage. No data is sent to external servers." },
          { emoji: "👤", title: "No Public Profiles", desc: "Child profiles are private and not visible to anyone outside your family account." },
          { emoji: "💬", title: "No Social Features", desc: "PLAYPULSE has no chat, messaging, or public social network features." },
          { emoji: "📊", title: "No Analytics", desc: "We don't collect or share analytics about your child's activity." },
          { emoji: "🗑️", title: "Data Deletion", desc: "To delete all data, go to Account Settings and choose 'Clear All Data'. This cannot be undone." },
          { emoji: "📍", title: "No Location Data", desc: "We never request or store location information." },
        ].map(item => (
          <div key={item.title} className="bg-white dark:bg-gray-900 rounded-2xl p-4 shadow-card">
            <div className="flex items-start gap-3">
              <span className="text-2xl">{item.emoji}</span>
              <div>
                <div className="font-black text-navy dark:text-white mb-0.5">{item.title}</div>
                <p className="text-sm text-gray-500">{item.desc}</p>
              </div>
            </div>
          </div>
        ))}
        <div className="bg-mint dark:bg-teal/10 rounded-2xl p-4">
          <div className="text-sm font-bold text-teal-dark dark:text-teal mb-1">📋 Legal Note</div>
          <p className="text-xs text-gray-600 dark:text-gray-400">
            This is a demo application. Before a real public launch, qualified legal review for COPPA, GDPR-K, and applicable children's privacy regulations would be required.
          </p>
        </div>
      </div>
    </div>
  );
}
