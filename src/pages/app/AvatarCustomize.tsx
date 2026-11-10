import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useApp } from "../../contexts/AppContext";

type TabId = "BODY" | "PERSONALITY";
type Category = "skin" | "hair" | "outfit" | "hat" | "shoes" | "accessory" | "background" | "badge";

interface Item {
  id: string;
  name: string;
  emoji: string;
  rarity: "common" | "uncommon" | "rare" | "legendary";
  color: string;
  pointCost: number;
}

const RARITY_COLORS: Record<string, string> = {
  common: "#6B7280",
  uncommon: "#22C55E",
  rare: "#3B82F6",
  legendary: "#F59E0B",
};

const CATEGORIES: { id: Category; label: string; emoji: string; tab: TabId }[] = [
  { id: "skin", label: "Skin", emoji: "🎨", tab: "BODY" },
  { id: "hair", label: "Hair", emoji: "💇", tab: "BODY" },
  { id: "outfit", label: "Outfit", emoji: "👗", tab: "BODY" },
  { id: "hat", label: "Hat", emoji: "🎩", tab: "PERSONALITY" },
  { id: "shoes", label: "Shoes", emoji: "👟", tab: "PERSONALITY" },
  { id: "accessory", label: "Accessory", emoji: "💎", tab: "PERSONALITY" },
  { id: "background", label: "Background", emoji: "🌄", tab: "PERSONALITY" },
  { id: "badge", label: "Badge", emoji: "🏆", tab: "PERSONALITY" },
];

const ITEMS: Record<Category, Item[]> = {
  skin: [
    { id: "s1", name: "Warm", emoji: "🟤", rarity: "common", color: "#D4956A", pointCost: 0 },
    { id: "s2", name: "Light", emoji: "⬜", rarity: "common", color: "#F5CBA7", pointCost: 0 },
    { id: "s3", name: "Deep", emoji: "🔵", rarity: "common", color: "#7B4F2A", pointCost: 0 },
    { id: "s4", name: "Rosy", emoji: "🌸", rarity: "uncommon", color: "#F4A5B1", pointCost: 50 },
    { id: "s5", name: "Olive", emoji: "🫒", rarity: "uncommon", color: "#8E9B4B", pointCost: 50 },
    { id: "s6", name: "Golden", emoji: "✨", rarity: "rare", color: "#CDA84B", pointCost: 150 },
  ],
  hair: [
    { id: "h1", name: "Short", emoji: "💇", rarity: "common", color: "#4A3728", pointCost: 0 },
    { id: "h2", name: "Long", emoji: "👩", rarity: "common", color: "#2C2C2C", pointCost: 0 },
    { id: "h3", name: "Curly", emoji: "🌀", rarity: "uncommon", color: "#8B4513", pointCost: 60 },
    { id: "h4", name: "Spiky", emoji: "⚡", rarity: "uncommon", color: "#DAA520", pointCost: 80 },
    { id: "h5", name: "Braids", emoji: "🎀", rarity: "rare", color: "#C71585", pointCost: 150 },
    { id: "h6", name: "Rainbow", emoji: "🌈", rarity: "legendary", color: "#FF6B35", pointCost: 400 },
  ],
  outfit: [
    { id: "o1", name: "Explorer", emoji: "🗺️", rarity: "common", color: "#4FC3F7", pointCost: 0 },
    { id: "o2", name: "Sporty", emoji: "👕", rarity: "common", color: "#FF6B35", pointCost: 0 },
    { id: "o3", name: "Nature", emoji: "🌿", rarity: "uncommon", color: "#22C55E", pointCost: 80 },
    { id: "o4", name: "Space", emoji: "🚀", rarity: "rare", color: "#7C3AED", pointCost: 200 },
    { id: "o5", name: "Ocean", emoji: "🌊", rarity: "rare", color: "#0EA5E9", pointCost: 200 },
    { id: "o6", name: "Dragon", emoji: "🐉", rarity: "legendary", color: "#F59E0B", pointCost: 500 },
  ],
  hat: [
    { id: "hat1", name: "Cap", emoji: "🧢", rarity: "common", color: "#3B82F6", pointCost: 30 },
    { id: "hat2", name: "Party", emoji: "🎉", rarity: "common", color: "#EC4899", pointCost: 30 },
    { id: "hat3", name: "Cowboy", emoji: "🤠", rarity: "uncommon", color: "#8B6914", pointCost: 100 },
    { id: "hat4", name: "Crown", emoji: "👑", rarity: "legendary", color: "#F59E0B", pointCost: 500 },
    { id: "hat5", name: "Wizard", emoji: "🧙", rarity: "rare", color: "#7C3AED", pointCost: 200 },
    { id: "hat6", name: "Halo", emoji: "😇", rarity: "rare", color: "#FFD93D", pointCost: 250 },
  ],
  shoes: [
    { id: "sh1", name: "Sneakers", emoji: "👟", rarity: "common", color: "#3B82F6", pointCost: 30 },
    { id: "sh2", name: "Boots", emoji: "🥾", rarity: "common", color: "#8B6914", pointCost: 50 },
    { id: "sh3", name: "Rocket", emoji: "🚀", rarity: "rare", color: "#FF6B35", pointCost: 200 },
    { id: "sh4", name: "Cloud", emoji: "☁️", rarity: "rare", color: "#E0F2FE", pointCost: 180 },
    { id: "sh5", name: "Rainbow", emoji: "🌈", rarity: "legendary", color: "#FF6B35", pointCost: 400 },
    { id: "sh6", name: "Dragon", emoji: "🐉", rarity: "legendary", color: "#F59E0B", pointCost: 450 },
  ],
  accessory: [
    { id: "acc1", name: "Glasses", emoji: "👓", rarity: "common", color: "#6B7280", pointCost: 40 },
    { id: "acc2", name: "Star", emoji: "⭐", rarity: "common", color: "#FFD93D", pointCost: 40 },
    { id: "acc3", name: "Scarf", emoji: "🧣", rarity: "uncommon", color: "#EC4899", pointCost: 100 },
    { id: "acc4", name: "Wings", emoji: "🪽", rarity: "rare", color: "#E0F2FE", pointCost: 250 },
    { id: "acc5", name: "Cape", emoji: "🦸", rarity: "rare", color: "#7C3AED", pointCost: 200 },
    { id: "acc6", name: "Aura", emoji: "✨", rarity: "legendary", color: "#F59E0B", pointCost: 500 },
  ],
  background: [
    { id: "bg1", name: "Forest", emoji: "🌲", rarity: "common", color: "#22C55E", pointCost: 50 },
    { id: "bg2", name: "Ocean", emoji: "🌊", rarity: "common", color: "#0EA5E9", pointCost: 50 },
    { id: "bg3", name: "Mountain", emoji: "🏔️", rarity: "uncommon", color: "#6B7280", pointCost: 100 },
    { id: "bg4", name: "Space", emoji: "🌌", rarity: "rare", color: "#7C3AED", pointCost: 200 },
    { id: "bg5", name: "Sunset", emoji: "🌅", rarity: "uncommon", color: "#FF6B35", pointCost: 120 },
    { id: "bg6", name: "Rainbow", emoji: "🌈", rarity: "legendary", color: "#FF6B35", pointCost: 400 },
  ],
  badge: [
    { id: "bdg1", name: "Explorer", emoji: "🗺️", rarity: "common", color: "#4FC3F7", pointCost: 0 },
    { id: "bdg2", name: "Champion", emoji: "🏆", rarity: "uncommon", color: "#F59E0B", pointCost: 100 },
    { id: "bdg3", name: "Helper", emoji: "💚", rarity: "common", color: "#22C55E", pointCost: 50 },
    { id: "bdg4", name: "Creator", emoji: "🎨", rarity: "rare", color: "#EC4899", pointCost: 200 },
    { id: "bdg5", name: "Brave", emoji: "🦁", rarity: "rare", color: "#FF6B35", pointCost: 220 },
    { id: "bdg6", name: "Legend", emoji: "⚡", rarity: "legendary", color: "#F59E0B", pointCost: 500 },
  ],
};

function AvatarPreview({ equipped }: { equipped: Record<string, string> }) {
  const skin = ITEMS.skin.find(i => i.id === equipped.skin) ?? ITEMS.skin[0];
  const outfit = ITEMS.outfit.find(i => i.id === equipped.outfit) ?? ITEMS.outfit[0];
  const hat = ITEMS.hat.find(i => i.id === equipped.hat);
  const bg = ITEMS.background.find(i => i.id === equipped.background);

  return (
    <div
      className="w-full h-52 rounded-2xl flex items-center justify-center relative overflow-hidden"
      style={{ background: bg ? `${bg.color}33` : "rgba(255,255,255,0.05)" }}
    >
      {bg && (
        <div className="absolute inset-0 flex items-center justify-center opacity-20 text-8xl">
          {bg.emoji}
        </div>
      )}
      {/* Simple avatar SVG */}
      <div className="relative z-10 flex flex-col items-center">
        {hat && <div className="text-3xl -mb-1">{hat.emoji}</div>}
        <svg width="80" height="110" viewBox="0 0 80 110">
          {/* body */}
          <rect x="20" y="45" width="40" height="45" rx="8" fill={outfit.color} />
          {/* head */}
          <circle cx="40" cy="32" r="22" fill={skin.color} />
          {/* eyes */}
          <circle cx="32" cy="30" r="3" fill="#2C2C2C" />
          <circle cx="48" cy="30" r="3" fill="#2C2C2C" />
          {/* mouth */}
          <path d="M33 38 Q40 44 47 38" stroke="#2C2C2C" strokeWidth="2" fill="none" strokeLinecap="round" />
          {/* legs */}
          <rect x="22" y="88" width="14" height="18" rx="5" fill={skin.color} />
          <rect x="44" y="88" width="14" height="18" rx="5" fill={skin.color} />
        </svg>
        <div className="flex gap-1 mt-1">
          {equipped.badge && <span className="text-sm">{ITEMS.badge.find(i => i.id === equipped.badge)?.emoji}</span>}
          {equipped.accessory && <span className="text-sm">{ITEMS.accessory.find(i => i.id === equipped.accessory)?.emoji}</span>}
        </div>
      </div>
    </div>
  );
}

export function AvatarCustomizePage() {
  const navigate = useNavigate();
  const { activeProfile, updateChildProfile } = useApp();
  const [tab, setTab] = useState<TabId>("BODY");
  const [category, setCategory] = useState<Category>("skin");
  const [equipped, setEquipped] = useState<Record<string, string>>({
    skin: "s1", hair: "h1", outfit: "o1",
  });

  if (!activeProfile) return null;

  const visibleCategories = CATEGORIES.filter(c => c.tab === tab);
  const items = ITEMS[category];

  function equipItem(item: Item) {
    setEquipped(prev => ({ ...prev, [category]: item.id }));
  }

  function handleSave() {
    updateChildProfile({
      ...activeProfile!,
      avatarConfig: {
        ...activeProfile!.avatarConfig,
        skinTone: equipped.skin ?? activeProfile!.avatarConfig.skinTone,
        hairStyle: equipped.hair ?? activeProfile!.avatarConfig.hairStyle,
        outfit: equipped.outfit ?? activeProfile!.avatarConfig.outfit,
        accessory: equipped.accessory ?? activeProfile!.avatarConfig.accessory,
        background: equipped.background ?? activeProfile!.avatarConfig.background,
        equippedItems: Object.values(equipped),
      },
    });
    navigate(-1);
  }

  return (
    <motion.div
      className="min-h-screen bg-pp-navy pb-24"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }}
    >
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-4 mb-4">
        <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-full bg-pp-card flex items-center justify-center">
          <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-2xl font-bold text-white font-fredoka flex-1">Customize Avatar</h1>
        <button
          className="bg-pp-orange px-4 py-2 rounded-xl font-bold text-white text-sm"
          onClick={handleSave}
        >
          Save
        </button>
      </div>

      {/* Avatar Preview */}
      <div className="px-4 mb-4">
        <AvatarPreview equipped={equipped} />
      </div>

      {/* Tabs */}
      <div className="px-4 mb-3">
        <div className="flex bg-pp-card rounded-xl p-1 gap-1">
          {(["BODY", "PERSONALITY"] as TabId[]).map(t => (
            <button
              key={t}
              className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${
                tab === t ? "bg-pp-orange text-white" : "text-pp-border"
              }`}
              onClick={() => { setTab(t); setCategory(CATEGORIES.find(c => c.tab === t)?.id ?? "skin"); }}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Category Sidebar + Item Grid */}
      <div className="flex gap-2 px-4">
        {/* Sidebar */}
        <div className="flex flex-col gap-1 w-16 shrink-0">
          {visibleCategories.map(cat => (
            <button
              key={cat.id}
              className={`flex flex-col items-center py-2 px-1 rounded-xl transition-all ${
                category === cat.id ? "bg-pp-orange" : "bg-pp-card"
              }`}
              onClick={() => setCategory(cat.id)}
            >
              <span className="text-lg">{cat.emoji}</span>
              <span className={`text-[9px] font-bold mt-0.5 ${category === cat.id ? "text-white" : "text-pp-border"}`}>
                {cat.label}
              </span>
            </button>
          ))}
        </div>

        {/* Item Grid */}
        <div className="flex-1">
          <AnimatePresence mode="wait">
            <motion.div
              key={category}
              className="grid grid-cols-3 gap-2"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.15 }}
            >
              {items.map((item) => {
                const isEquipped = equipped[category] === item.id;
                const rarityColor = RARITY_COLORS[item.rarity];
                return (
                  <motion.button
                    key={item.id}
                    className={`relative flex flex-col items-center py-3 px-2 rounded-xl border-2 transition-all ${
                      isEquipped ? "border-pp-orange bg-pp-orange/10" : "border-transparent bg-pp-card"
                    }`}
                    style={!isEquipped ? { borderColor: `${rarityColor}44` } : {}}
                    whileTap={{ scale: 0.93 }}
                    onClick={() => equipItem(item)}
                  >
                    {/* Rarity bar */}
                    <div
                      className="absolute top-0 left-0 right-0 h-0.5 rounded-t-xl"
                      style={{ background: rarityColor }}
                    />
                    <span className="text-2xl mb-1">{item.emoji}</span>
                    <span className="text-white text-xs font-semibold text-center leading-tight">{item.name}</span>
                    <span className="text-[9px] mt-0.5" style={{ color: rarityColor }}>
                      {item.rarity}
                    </span>
                    {isEquipped && (
                      <div className="absolute top-1 right-1 w-4 h-4 bg-pp-orange rounded-full flex items-center justify-center">
                        <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    )}
                  </motion.button>
                );
              })}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}
