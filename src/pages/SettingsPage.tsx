import { useState } from "react";
import { Icons } from "../components/Icons";
import { useStore } from "../state/store";

function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!on)}
      className={`relative w-10 h-6 rounded-full transition-colors ${on ? "bg-brand-500" : "bg-ink-200 dark:bg-dark-500"}`}
    >
      <span
        className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${on ? "translate-x-4" : ""}`}
      />
    </button>
  );
}

function SettingRow({ label, description, children }: { label: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <div>
        <p className="text-sm font-medium text-ink-800 dark:text-gray-200">{label}</p>
        {description && <p className="text-xs text-ink-400 dark:text-gray-500 mt-0.5">{description}</p>}
      </div>
      <div className="flex-shrink-0">{children}</div>
    </div>
  );
}

export function SettingsPage() {
  const { profile, darkMode, toggleDarkMode } = useStore();
  const [fontSize, setFontSize] = useState("medium");
  const [difficulty, setDifficulty] = useState("balanced");
  const [tutorMode, setTutorMode] = useState("teach");
  const [notifs, setNotifs] = useState({ study: true, deadlines: true, flashcards: true, weekly: false });
  const [audioQuality, setAudioQuality] = useState("high");
  const [autoTranscribe, setAutoTranscribe] = useState(true);

  return (
    <div className="p-4 lg:p-6 max-w-3xl mx-auto space-y-6 animate-fade-up">
      <h1 className="text-2xl font-bold font-display text-ink-900 dark:text-white">Settings</h1>

      {/* Profile */}
      <div className="card p-5">
        <h2 className="text-base font-bold text-ink-900 dark:text-white mb-4 flex items-center gap-2">
          <Icons.profile size={18} /> Profile
        </h2>
        <div className="flex items-center gap-4 mb-4">
          <div className="w-16 h-16 rounded-full bg-brand-100 dark:bg-brand-500/20 flex items-center justify-center text-brand-600 dark:text-brand-400 text-xl font-bold">
            {profile?.name?.charAt(0).toUpperCase() ?? "?"}
          </div>
          <div>
            <p className="text-base font-semibold text-ink-900 dark:text-white">{profile?.name ?? "Student"}</p>
            <p className="text-sm text-ink-500 dark:text-gray-400">{profile?.email ?? "student@example.com"}</p>
            <p className="text-xs text-ink-400 dark:text-gray-500 mt-0.5">Grade: {profile?.grade ?? "Not set"}</p>
          </div>
        </div>
        <button className="btn-secondary text-sm">Edit Profile</button>
      </div>

      {/* Appearance */}
      <div className="card p-5">
        <h2 className="text-base font-bold text-ink-900 dark:text-white mb-2 flex items-center gap-2">
          {darkMode ? <Icons.moon size={18} /> : <Icons.sun size={18} />} Appearance
        </h2>
        <div className="divide-y divide-warm-200 dark:divide-dark-border">
          <SettingRow label="Dark Mode" description="Switch between light and dark themes">
            <Toggle on={darkMode} onChange={toggleDarkMode} />
          </SettingRow>
          <SettingRow label="Font Size">
            <select className="input w-32 py-1.5 text-sm" value={fontSize} onChange={(e) => setFontSize(e.target.value)}>
              <option value="small">Small</option>
              <option value="medium">Medium</option>
              <option value="large">Large</option>
            </select>
          </SettingRow>
        </div>
      </div>

      {/* AI Preferences */}
      <div className="card p-5">
        <h2 className="text-base font-bold text-ink-900 dark:text-white mb-2 flex items-center gap-2">
          <Icons.brain size={18} /> AI Preferences
        </h2>
        <div className="divide-y divide-warm-200 dark:divide-dark-border">
          <SettingRow label="Explanation Difficulty" description="Adjust how the AI explains concepts">
            <select className="input w-36 py-1.5 text-sm" value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
              <option value="simple">Simple</option>
              <option value="balanced">Balanced</option>
              <option value="detailed">Detailed</option>
            </select>
          </SettingRow>
          <SettingRow label="Preferred Tutor Mode">
            <select className="input w-36 py-1.5 text-sm" value={tutorMode} onChange={(e) => setTutorMode(e.target.value)}>
              <option value="teach">Teach Me</option>
              <option value="step-by-step">Step-by-Step</option>
              <option value="deep">Deep Thinking</option>
              <option value="beginner">Beginner</option>
              <option value="socratic">Socratic</option>
            </select>
          </SettingRow>
        </div>
      </div>

      {/* Notifications */}
      <div className="card p-5">
        <h2 className="text-base font-bold text-ink-900 dark:text-white mb-2 flex items-center gap-2">
          <Icons.bell size={18} /> Notifications
        </h2>
        <div className="divide-y divide-warm-200 dark:divide-dark-border">
          <SettingRow label="Study Reminders" description="Reminders to keep your study streak going">
            <Toggle on={notifs.study} onChange={(v) => setNotifs((n) => ({ ...n, study: v }))} />
          </SettingRow>
          <SettingRow label="Assignment Deadlines" description="Get notified before assignments are due">
            <Toggle on={notifs.deadlines} onChange={(v) => setNotifs((n) => ({ ...n, deadlines: v }))} />
          </SettingRow>
          <SettingRow label="Flashcard Reviews" description="Reminders when cards are due for review">
            <Toggle on={notifs.flashcards} onChange={(v) => setNotifs((n) => ({ ...n, flashcards: v }))} />
          </SettingRow>
          <SettingRow label="Weekly Reports" description="Summary of your weekly learning progress">
            <Toggle on={notifs.weekly} onChange={(v) => setNotifs((n) => ({ ...n, weekly: v }))} />
          </SettingRow>
        </div>
      </div>

      {/* Recording */}
      <div className="card p-5">
        <h2 className="text-base font-bold text-ink-900 dark:text-white mb-2 flex items-center gap-2">
          <Icons.record size={18} /> Recording
        </h2>
        <div className="divide-y divide-warm-200 dark:divide-dark-border">
          <SettingRow label="Audio Quality">
            <select className="input w-32 py-1.5 text-sm" value={audioQuality} onChange={(e) => setAudioQuality(e.target.value)}>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </SettingRow>
          <SettingRow label="Auto-Transcribe" description="Automatically transcribe recordings after saving">
            <Toggle on={autoTranscribe} onChange={setAutoTranscribe} />
          </SettingRow>
        </div>
      </div>

      {/* Privacy */}
      <div className="card p-5">
        <h2 className="text-base font-bold text-ink-900 dark:text-white mb-2 flex items-center gap-2">
          <Icons.exam size={18} /> Privacy
        </h2>
        <p className="text-sm text-ink-600 dark:text-gray-400 leading-relaxed">
          Your data is stored securely and is only accessible to you. Study materials, recordings, and AI conversations are private to your account.
          We do not sell or share your personal information with third parties. You can delete your data at any time from your profile settings.
        </p>
      </div>

      {/* Subscription */}
      <div className="card p-5">
        <h2 className="text-base font-bold text-ink-900 dark:text-white mb-4 flex items-center gap-2">
          <Icons.crown size={18} /> Subscription
        </h2>
        <div className="flex items-center gap-3 mb-4">
          <span className="chip chip-active">Free Plan</span>
          <span className="text-xs text-ink-400 dark:text-gray-500">Currently active</span>
        </div>
        <div className="p-4 rounded-xl bg-gradient-to-br from-brand-50 to-accent-50 dark:from-brand-500/10 dark:to-accent-500/10 border border-brand-100 dark:border-brand-500/20">
          <h3 className="text-base font-bold text-ink-900 dark:text-white mb-2">Upgrade to Premium</h3>
          <ul className="space-y-1.5 text-sm text-ink-600 dark:text-gray-400">
            <li className="flex items-center gap-2"><Icons.check size={14} className="text-brand-500" /> Unlimited AI tutoring sessions</li>
            <li className="flex items-center gap-2"><Icons.check size={14} className="text-brand-500" /> Advanced reasoning mode</li>
            <li className="flex items-center gap-2"><Icons.check size={14} className="text-brand-500" /> Longer recording limits</li>
            <li className="flex items-center gap-2"><Icons.check size={14} className="text-brand-500" /> Unlimited practice exams</li>
            <li className="flex items-center gap-2"><Icons.check size={14} className="text-brand-500" /> AI podcast generation</li>
            <li className="flex items-center gap-2"><Icons.check size={14} className="text-brand-500" /> Advanced learning analytics</li>
          </ul>
          <button className="btn-primary mt-4 w-full">Upgrade Now</button>
        </div>
      </div>

      {/* About */}
      <div className="card p-5">
        <h2 className="text-base font-bold text-ink-900 dark:text-white mb-2 flex items-center gap-2">
          <Icons.sparkles size={18} /> About
        </h2>
        <div className="space-y-1 text-sm text-ink-600 dark:text-gray-400">
          <p>StudyVerse v1.0.0</p>
          <p>The ultimate AI-powered learning platform.</p>
          <p className="text-xs text-ink-400 dark:text-gray-500 mt-2">Made with care for students everywhere.</p>
        </div>
      </div>
    </div>
  );
}
