import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/ui/Button";
import { useApp } from "../contexts/AppContext";
import type { AvatarConfig, AccessibilityPrefs, ChildProfile } from "../lib/types";

const AGE_RANGES: Array<ChildProfile["ageRange"]> = ["6-8", "9-10", "11-12"];
const CATEGORIES = [
  { id: "dance", label: "Dance 💃", color: "#B9A9EA" },
  { id: "sports", label: "Sports ⚽", color: "#58B9A9" },
  { id: "outdoor", label: "Outdoors 🌿", color: "#DDF2E7" },
  { id: "creative", label: "Creative 🎨", color: "#FF786B" },
  { id: "relaxing", label: "Relaxing 🧘", color: "#FFD56A" },
  { id: "quick-moves", label: "Quick Moves ⚡", color: "#FFF5EC" },
];
const AVATAR_EMOJIS = ["🦊", "🐻", "🐼", "🦁", "🐯", "🐨", "🦋", "🐸", "🦄", "🐬"];

const DEFAULT_AVATAR: AvatarConfig = {
  skinTone: "#FFDBB5",
  hairStyle: "default",
  hairColor: "#4A3728",
  outfit: "🦊",
  accessory: "",
  background: "#FFF9F0",
  equippedItems: [],
};
const DEFAULT_ACCESSIBILITY: AccessibilityPrefs = {
  reducedMotion: false,
  largeText: false,
  highContrast: false,
};

export function ProfileCreationPage() {
  const navigate = useNavigate();
  const { createProfile, selectProfile } = useApp();
  const [step, setStep] = useState(1);
  const [nickname, setNickname] = useState("");
  const [ageRange, setAgeRange] = useState<ChildProfile["ageRange"]>("9-10");
  const [selectedEmoji, setSelectedEmoji] = useState("🦊");
  const [categories, setCategories] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function toggleCategory(id: string) {
    setCategories(prev =>
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    );
  }

  async function finish() {
    if (!nickname.trim()) return setError("Please give your child a nickname.");
    setLoading(true);
    await new Promise(r => setTimeout(r, 400));

    const profile = createProfile({
      nickname: nickname.trim(),
      ageRange,
      avatarConfig: { ...DEFAULT_AVATAR, outfit: selectedEmoji },
      favoriteCategories: categories,
      accessibilityPrefs: DEFAULT_ACCESSIBILITY,
      points: 0,
    });

    selectProfile(profile.id);
    setLoading(false);
    navigate("/app/home");
  }

  return (
    <div className="min-h-screen bg-cream dark:bg-gray-950 flex flex-col">
      <div className="flex items-center px-6 py-5">
        <button
          onClick={() => step > 1 ? setStep(s => s - 1) : navigate(-1)}
          className="text-gray-400 hover:text-navy dark:hover:text-white mr-3 text-xl"
        >‹</button>
        <div>
          <div className="font-black text-navy dark:text-white">Create Child Profile</div>
          <div className="text-xs text-gray-400">Step {step} of 3</div>
        </div>
      </div>

      {/* Progress */}
      <div className="px-6">
        <div className="flex gap-1.5">
          {[1, 2, 3].map(s => (
            <div key={s} className={`flex-1 h-1.5 rounded-full transition-colors ${s <= step ? "bg-coral" : "bg-soft-gray dark:bg-gray-700"}`} />
          ))}
        </div>
      </div>

      <div className="flex-1 px-6 py-8 max-w-sm mx-auto w-full">
        {step === 1 && (
          <div className="space-y-6 animate-fade-in">
            <div className="text-center">
              <div className="text-5xl mb-2">{selectedEmoji}</div>
              <h2 className="font-black text-xl text-navy dark:text-white">Who's this profile for?</h2>
              <p className="text-sm text-gray-500 mt-1">Choose an avatar and nickname</p>
            </div>

            <div>
              <label className="block text-sm font-bold text-navy dark:text-white mb-2">Choose an Avatar</label>
              <div className="grid grid-cols-5 gap-2">
                {AVATAR_EMOJIS.map(emoji => (
                  <button
                    key={emoji}
                    onClick={() => setSelectedEmoji(emoji)}
                    className={`aspect-square rounded-2xl text-3xl flex items-center justify-center transition-all ${
                      selectedEmoji === emoji
                        ? "bg-coral text-white scale-110 shadow-sm"
                        : "bg-white dark:bg-gray-800 hover:scale-105"
                    }`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-navy dark:text-white mb-1">Nickname</label>
              <input
                type="text"
                value={nickname}
                onChange={e => { setNickname(e.target.value); setError(""); }}
                placeholder="e.g. Superstar Alex"
                maxLength={20}
                className="w-full px-4 py-3 rounded-2xl border-2 border-soft-gray dark:border-gray-700 bg-white dark:bg-gray-800 text-navy dark:text-white focus:border-coral focus:outline-none"
              />
              {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
            </div>

            <Button fullWidth size="lg" onClick={() => {
              if (!nickname.trim()) return setError("Please enter a nickname.");
              setStep(2);
            }}>
              Next →
            </Button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6 animate-fade-in">
            <div className="text-center">
              <div className="text-5xl mb-2">🎂</div>
              <h2 className="font-black text-xl text-navy dark:text-white">How old is {nickname}?</h2>
              <p className="text-sm text-gray-500 mt-1">We'll suggest the right activities</p>
            </div>

            <div className="space-y-3">
              {AGE_RANGES.map(range => (
                <button
                  key={range}
                  onClick={() => setAgeRange(range)}
                  className={`w-full p-4 rounded-2xl border-2 text-left font-bold transition-all ${
                    ageRange === range
                      ? "border-coral bg-coral/10 text-coral"
                      : "border-soft-gray dark:border-gray-700 bg-white dark:bg-gray-800 text-navy dark:text-white hover:border-gray-300"
                  }`}
                >
                  {range} years old {range === "9-10" ? "👍" : ""}
                </button>
              ))}
            </div>

            <Button fullWidth size="lg" onClick={() => setStep(3)}>
              Next →
            </Button>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6 animate-fade-in">
            <div className="text-center">
              <div className="text-5xl mb-2">❤️</div>
              <h2 className="font-black text-xl text-navy dark:text-white">What does {nickname} love?</h2>
              <p className="text-sm text-gray-500 mt-1">Pick favourite activity types (optional)</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {CATEGORIES.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => toggleCategory(cat.id)}
                  className={`p-3 rounded-2xl border-2 text-sm font-bold transition-all ${
                    categories.includes(cat.id)
                      ? "border-coral bg-coral/10 text-coral scale-105"
                      : "border-soft-gray dark:border-gray-700 bg-white dark:bg-gray-800 text-navy dark:text-white"
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            <Button fullWidth size="lg" loading={loading} onClick={finish}>
              Let's Go! 🚀
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
