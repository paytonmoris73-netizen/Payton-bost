import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../../components/ui/Button";
import { useApp } from "../../contexts/AppContext";

const AVATAR_EMOJIS = ["🦊", "🐻", "🐼", "🦁", "🐯", "🐨", "🦋", "🐸", "🦄", "🐬", "🐺", "🦝"];
const BACKGROUNDS = [
  { id: "#FFF9F0", label: "Cream", color: "#FFF9F0" },
  { id: "#DDF2E7", label: "Mint", color: "#DDF2E7" },
  { id: "#B9A9EA", label: "Lavender", color: "#B9A9EA" },
  { id: "#FFD56A", label: "Yellow", color: "#FFD56A" },
  { id: "#58B9A9", label: "Teal", color: "#58B9A9" },
  { id: "#FF786B", label: "Coral", color: "#FF786B" },
];

export function AvatarCustomizePage() {
  const navigate = useNavigate();
  const { activeProfile, updateChildProfile } = useApp();

  if (!activeProfile) return null;

  const [outfit, setOutfit] = useState(activeProfile.avatarConfig.outfit);
  const [bg, setBg] = useState(activeProfile.avatarConfig.background);
  const [saved, setSaved] = useState(false);

  function handleSave() {
    updateChildProfile({
      ...activeProfile!,
      avatarConfig: {
        ...activeProfile!.avatarConfig,
        outfit,
        background: bg,
      },
    });
    setSaved(true);
    setTimeout(() => { setSaved(false); }, 1500);
  }

  return (
    <div className="pb-24 lg:pb-8 animate-fade-in">
      <div className="flex items-center px-5 py-5">
        <button onClick={() => navigate(-1)} className="text-gray-400 hover:text-navy dark:hover:text-white mr-3 text-xl">‹</button>
        <h1 className="font-black text-xl text-navy dark:text-white">Customize Avatar</h1>
      </div>

      {/* Preview */}
      <div className="px-5 mb-6">
        <div
          className="rounded-3xl h-48 flex items-center justify-center transition-colors shadow-card"
          style={{ backgroundColor: bg }}
        >
          <div className="text-center">
            <div className="text-8xl mb-2 animate-bounce-soft">{outfit}</div>
            <div className="font-black text-navy/60 text-sm">{activeProfile.nickname}</div>
          </div>
        </div>
      </div>

      {/* Avatar picker */}
      <div className="px-5 mb-5">
        <h3 className="font-black text-navy dark:text-white mb-3">Choose Avatar</h3>
        <div className="grid grid-cols-6 gap-2">
          {AVATAR_EMOJIS.map(emoji => (
            <button
              key={emoji}
              onClick={() => setOutfit(emoji)}
              className={`aspect-square rounded-2xl text-3xl flex items-center justify-center transition-all ${
                outfit === emoji
                  ? "bg-coral text-white scale-110 shadow-sm"
                  : "bg-white dark:bg-gray-800 hover:scale-105"
              }`}
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>

      {/* Background picker */}
      <div className="px-5 mb-6">
        <h3 className="font-black text-navy dark:text-white mb-3">Background Color</h3>
        <div className="flex gap-3">
          {BACKGROUNDS.map(b => (
            <button
              key={b.id}
              onClick={() => setBg(b.id)}
              className={`w-10 h-10 rounded-full border-4 transition-all ${
                bg === b.id ? "border-coral scale-110" : "border-transparent"
              }`}
              style={{ backgroundColor: b.color }}
              title={b.label}
            />
          ))}
        </div>
      </div>

      <div className="px-5">
        <Button
          fullWidth
          size="lg"
          onClick={handleSave}
          variant={saved ? "teal" : "primary"}
        >
          {saved ? "✓ Saved!" : "Save Avatar"}
        </Button>
      </div>
    </div>
  );
}
