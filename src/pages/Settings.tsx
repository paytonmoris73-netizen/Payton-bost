import { Icon } from "../components/Icon";
import { useAppStore } from "../stores/appStore";

export function SettingsPage() {
  const user = useAppStore((s) => s.user);
  const theme = useAppStore((s) => s.theme);
  const setTheme = useAppStore((s) => s.setTheme);
  const updatePreferences = useAppStore((s) => s.updatePreferences);

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-text-primary">Settings</h1>
        <p className="text-sm text-text-secondary mt-0.5">Customize your Lucent experience</p>
      </div>

      {/* Profile */}
      <section className="space-y-3">
        <h2 className="text-base font-semibold text-text-primary">Profile</h2>
        <div className="card p-4 flex items-center gap-4">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-accent text-xl font-bold text-text-inverse">
            {user?.name?.[0]?.toUpperCase() ?? "U"}
          </span>
          <div>
            <div className="text-base font-semibold text-text-primary">{user?.name ?? "User"}</div>
            <div className="text-sm text-text-secondary">{user?.email ?? ""}</div>
          </div>
        </div>
      </section>

      {/* Appearance */}
      <section className="space-y-3">
        <h2 className="text-base font-semibold text-text-primary">Appearance</h2>
        <div className="card divide-y divide-border">
          <div className="p-4 flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-text-primary">Theme</div>
              <div className="text-xs text-text-tertiary">Choose your preferred color scheme</div>
            </div>
            <div className="flex gap-1">
              {(["light", "dark", "system"] as const).map((t) => (
                <button key={t} onClick={() => setTheme(t)} className={`chip capitalize ${theme === t ? "chip-active" : ""}`}>
                  <Icon name={t === "light" ? "sun" : t === "dark" ? "moon" : "settings"} className="h-3.5 w-3.5" />
                  {t}
                </button>
              ))}
            </div>
          </div>
          <div className="p-4 flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-text-primary">Font Size</div>
              <div className="text-xs text-text-tertiary">Adjust text size across the app</div>
            </div>
            <div className="flex gap-1">
              {(["small", "medium", "large"] as const).map((s) => (
                <button key={s} onClick={() => updatePreferences({ fontSize: s })} className={`chip capitalize ${user?.preferences?.fontSize === s ? "chip-active" : ""}`}>
                  {s}
                </button>
              ))}
            </div>
          </div>
          <div className="p-4 flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-text-primary">Reduced Motion</div>
              <div className="text-xs text-text-tertiary">Minimize animations</div>
            </div>
            <input type="checkbox" checked={user?.preferences?.reducedMotion ?? false} onChange={(e) => updatePreferences({ reducedMotion: e.target.checked })} className="h-5 w-5 accent-[var(--accent)]" />
          </div>
        </div>
      </section>

      {/* AI Preferences */}
      <section className="space-y-3">
        <h2 className="text-base font-semibold text-text-primary">AI Tutor Preferences</h2>
        <div className="card divide-y divide-border">
          <div className="p-4 flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-text-primary">Difficulty Level</div>
              <div className="text-xs text-text-tertiary">Default explanation complexity</div>
            </div>
            <div className="flex gap-1">
              {(["beginner", "intermediate", "advanced"] as const).map((d) => (
                <button key={d} onClick={() => updatePreferences({ aiDifficulty: d })} className={`chip capitalize ${user?.preferences?.aiDifficulty === d ? "chip-active" : ""}`}>
                  {d}
                </button>
              ))}
            </div>
          </div>
          <div className="p-4 flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-text-primary">Explanation Style</div>
              <div className="text-xs text-text-tertiary">How the AI explains things by default</div>
            </div>
            <select
              value={user?.preferences?.preferredExplanationStyle ?? "detailed"}
              onChange={(e) => updatePreferences({ preferredExplanationStyle: e.target.value as any })}
              className="input-field w-auto"
            >
              <option value="simple">Simple</option>
              <option value="detailed">Detailed</option>
              <option value="step-by-step">Step by Step</option>
              <option value="visual">Visual</option>
            </select>
          </div>
        </div>
      </section>

      {/* AI Provider Config */}
      <section className="space-y-3">
        <h2 className="text-base font-semibold text-text-primary">AI Provider Configuration</h2>
        <div className="card p-4 space-y-3">
          <p className="text-sm text-text-secondary">Configure API keys for AI providers. Keys are stored locally and never sent to our servers.</p>
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1.5">Anthropic API Key</label>
            <input type="password" placeholder="sk-ant-..." className="input-field" />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1.5">OpenAI API Key</label>
            <input type="password" placeholder="sk-..." className="input-field" />
          </div>
          <div className="flex items-center gap-2 p-3 rounded-lg bg-accent-subtle">
            <Icon name="info" className="h-4 w-4 text-accent shrink-0" />
            <p className="text-xs text-accent-text">API keys are required for AI features. They are stored locally on your device.</p>
          </div>
          <button className="btn-primary w-full">Save API Keys</button>
        </div>
      </section>

      {/* Data */}
      <section className="space-y-3">
        <h2 className="text-base font-semibold text-text-primary">Data & Privacy</h2>
        <div className="card divide-y divide-border">
          <button className="p-4 w-full text-left flex items-center justify-between hover:bg-surface-2 transition-colors">
            <div>
              <div className="text-sm font-medium text-text-primary">Export All Data</div>
              <div className="text-xs text-text-tertiary">Download all your notes, flashcards, and settings</div>
            </div>
            <Icon name="download" className="h-4 w-4 text-text-tertiary" />
          </button>
          <button className="p-4 w-full text-left flex items-center justify-between hover:bg-surface-2 transition-colors group">
            <div>
              <div className="text-sm font-medium text-error">Delete All Data</div>
              <div className="text-xs text-text-tertiary">Permanently remove all your data</div>
            </div>
            <Icon name="trash" className="h-4 w-4 text-error" />
          </button>
        </div>
      </section>

      <p className="text-xs text-text-tertiary text-center pb-8">Lucent v1.0 &middot; Your intelligent learning companion</p>
    </div>
  );
}
