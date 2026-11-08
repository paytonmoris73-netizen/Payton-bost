import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { REWARDS, getRewardsByCategory } from "../../data/rewards";
import { useApp } from "../../contexts/AppContext";
import { Button } from "../../components/ui/Button";
import { Modal } from "../../components/ui/Modal";
import type { RewardItem } from "../../lib/types";

const CATEGORIES = [
  { id: "all", label: "All" },
  { id: "hat", label: "Hats 🎩" },
  { id: "shoes", label: "Shoes 👟" },
  { id: "costume", label: "Costumes 🦸" },
  { id: "mascot", label: "PIP Accessories" },
  { id: "room", label: "Room 🏠" },
  { id: "background", label: "Backgrounds 🌟" },
  { id: "avatar", label: "Avatar ✨" },
];

export function RewardsPage() {
  const navigate = useNavigate();
  const { activeProfile, buyReward, hasReward } = useApp();
  const [activeCategory, setActiveCategory] = useState("all");
  const [confirmItem, setConfirmItem] = useState<RewardItem | null>(null);
  const [justBought, setJustBought] = useState<string | null>(null);

  if (!activeProfile) return null;

  const displayList = activeCategory === "all" ? REWARDS : getRewardsByCategory(activeCategory);

  function handleBuy(item: RewardItem) {
    if (hasReward(activeProfile!.id, item.id)) return;
    if (activeProfile!.points < item.pointCost) return;
    setConfirmItem(item);
  }

  function confirmBuy() {
    if (!confirmItem || !activeProfile) return;
    const ok = buyReward(activeProfile.id, confirmItem.id, confirmItem.pointCost);
    if (ok) {
      setJustBought(confirmItem.id);
      setTimeout(() => setJustBought(null), 2000);
    }
    setConfirmItem(null);
  }

  return (
    <div className="pb-24 lg:pb-8 animate-fade-in">
      {/* Header */}
      <div className="px-5 pt-5 pb-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-black text-2xl text-navy dark:text-white">Reward Shop</h1>
            <p className="text-xs text-gray-400 mt-0.5">Spend your Play Points!</p>
          </div>
          <div className="text-right">
            <div className="font-black text-xl text-yellow">⭐ {activeProfile.points}</div>
            <div className="text-xs text-gray-400">your balance</div>
          </div>
        </div>
      </div>

      {/* Collection shortcut */}
      <div className="px-5 mb-4">
        <button
          onClick={() => navigate("/app/collection")}
          className="w-full flex items-center justify-between bg-soft-gray dark:bg-gray-800 rounded-2xl px-4 py-3"
        >
          <div className="flex items-center gap-2 text-sm font-bold text-navy dark:text-white">
            <span>🗂️</span> View My Collection
          </div>
          <span className="text-gray-400">›</span>
        </button>
      </div>

      {/* Category filter */}
      <div className="flex gap-2 overflow-x-auto px-5 pb-2 scrollbar-hide">
        {CATEGORIES.map(cat => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`flex-shrink-0 px-4 py-2 rounded-full text-xs font-bold transition-all ${
              activeCategory === cat.id
                ? "bg-coral text-white scale-105"
                : "bg-soft-gray dark:bg-gray-800 text-gray-500 dark:text-gray-400"
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Grid */}
      <div className="px-5 mt-4 grid grid-cols-2 gap-3">
        {displayList.map(item => {
          const owned = hasReward(activeProfile.id, item.id);
          const canAfford = activeProfile.points >= item.pointCost;
          const isJustBought = justBought === item.id;

          return (
            <div
              key={item.id}
              className={`bg-white dark:bg-gray-800 rounded-3xl overflow-hidden shadow-card transition-all ${
                isJustBought ? "ring-2 ring-teal animate-pop" : ""
              }`}
            >
              {/* Item preview */}
              <div
                className="h-24 flex items-center justify-center text-5xl"
                style={{ backgroundColor: item.color + "30" }}
              >
                {item.emoji}
              </div>
              {/* Info */}
              <div className="p-3">
                <div className="font-black text-navy dark:text-white text-xs leading-tight">{item.name}</div>
                <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">{item.description}</p>
                <div className="mt-2 flex items-center justify-between">
                  {owned ? (
                    <span className="text-xs font-bold text-teal">✓ Owned</span>
                  ) : (
                    <span className={`text-xs font-bold ${canAfford ? "text-yellow" : "text-gray-400"}`}>
                      ⭐ {item.pointCost}
                    </span>
                  )}
                  <button
                    onClick={() => handleBuy(item)}
                    disabled={owned || !canAfford}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      owned
                        ? "bg-teal/20 text-teal cursor-default"
                        : canAfford
                        ? "bg-coral text-white hover:bg-coral-dark active:scale-95"
                        : "bg-gray-100 dark:bg-gray-700 text-gray-400 cursor-not-allowed"
                    }`}
                  >
                    {owned ? "Owned" : canAfford ? "Get it!" : "Need pts"}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Confirm modal */}
      <Modal
        open={!!confirmItem}
        onClose={() => setConfirmItem(null)}
        title="Confirm Purchase"
        size="sm"
      >
        {confirmItem && (
          <div className="text-center">
            <div className="text-6xl mb-3">{confirmItem.emoji}</div>
            <h3 className="font-black text-navy dark:text-white mb-1">{confirmItem.name}</h3>
            <p className="text-sm text-gray-500 mb-4">{confirmItem.description}</p>
            <div className="bg-yellow/20 rounded-2xl px-4 py-2 mb-4 inline-block">
              <span className="font-black text-navy dark:text-white">⭐ {confirmItem.pointCost} points</span>
            </div>
            <div className="text-xs text-gray-400 mb-4">
              You'll have {activeProfile.points - confirmItem.pointCost} points remaining
            </div>
            <div className="flex gap-3">
              <Button variant="secondary" fullWidth onClick={() => setConfirmItem(null)}>Cancel</Button>
              <Button fullWidth onClick={confirmBuy}>Buy Now!</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
