import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useApp } from "../../contexts/AppContext";
import { REWARDS } from "../../data/rewards";
import { ACHIEVEMENTS } from "../../data/achievements";

type Tab = "shop" | "collection" | "achievements";

const RARITY_COLORS: Record<string, string> = {
  common:    "#8B8FA8",
  uncommon:  "#3B82F6",
  rare:      "#7C3AED",
  legendary: "#FFD93D",
};

export function RewardsPage() {
  const { activeProfile, buyReward, hasReward, profileRewards, profileAchievements } = useApp();
  const [tab, setTab] = useState<Tab>("shop");
  const [confirmItem, setConfirmItem] = useState<typeof REWARDS[0] | null>(null);
  const [justBought, setJustBought] = useState<string | null>(null);

  if (!activeProfile) return null;

  const ownedRewards = profileRewards(activeProfile.id);
  const achievements = profileAchievements(activeProfile.id);

  function handleBuy(item: typeof REWARDS[0]) {
    if (buyReward(activeProfile!.id, item.id, item.pointCost)) {
      setJustBought(item.id);
      setConfirmItem(null);
      setTimeout(() => setJustBought(null), 2000);
    }
  }

  return (
    <motion.div
      className="pb-24 lg:pb-8 min-h-screen bg-pp-navy"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }}
    >
      {/* Header */}
      <div className="px-5 pt-6 pb-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-pp-cream text-2xl">Rewards</h1>
            <p className="text-pp-muted text-sm">Collect, unlock, customize</p>
          </div>
          <div className="flex items-center gap-2 bg-pp-card border border-pp-border rounded-2xl px-4 py-2">
            <span className="text-pp-orange">🔥</span>
            <span className="text-pp-gold font-black">{activeProfile.points}</span>
            <span className="text-pp-muted text-xs">SP</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-5 mb-5">
        <div className="flex gap-1 bg-pp-card border border-pp-border rounded-2xl p-1">
          {(["shop", "collection", "achievements"] as Tab[]).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-2 rounded-xl text-sm font-black capitalize transition-all ${
                tab === t ? "bg-pp-orange text-white shadow-glow-orange" : "text-pp-muted hover:text-pp-cream"
              }`}
            >
              {t === "shop" ? "🛍️ Shop" : t === "collection" ? "🎒 Mine" : "🏆 Badges"}
            </button>
          ))}
        </div>
      </div>

      {/* SHOP TAB */}
      {tab === "shop" && (
        <div className="px-5">
          {/* Featured item */}
          <motion.div
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="rounded-3xl overflow-hidden mb-5 relative"
            style={{ background: "linear-gradient(135deg, #4C1D95, #7C3AED)" }}
          >
            <div className="p-5">
              <div className="text-purple-200 text-xs font-bold uppercase tracking-wider mb-1">✨ Featured Item</div>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-display text-white text-xl">{REWARDS[0].name}</h3>
                  <p className="text-purple-200 text-sm mt-0.5">{REWARDS[0].description}</p>
                  <div className="mt-3 flex items-center gap-3">
                    <span className="text-pp-gold font-black">{REWARDS[0].pointCost} SP</span>
                    {!hasReward(activeProfile.id, REWARDS[0].id) ? (
                      <button
                        onClick={() => setConfirmItem(REWARDS[0])}
                        disabled={activeProfile.points < REWARDS[0].pointCost}
                        className="bg-pp-gold text-pp-navy font-black text-sm px-5 py-2 rounded-full disabled:opacity-50 hover:brightness-110 transition-all"
                      >
                        Get Now
                      </button>
                    ) : (
                      <span className="text-pp-green font-bold text-sm">✓ Owned</span>
                    )}
                  </div>
                </div>
                <div className="text-6xl">{REWARDS[0].emoji}</div>
              </div>
            </div>
          </motion.div>

          {/* Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
            {REWARDS.slice(1).map((item, i) => {
              const owned = hasReward(activeProfile.id, item.id);
              const rarity = i < 5 ? "common" : i < 12 ? "uncommon" : i < 20 ? "rare" : "legendary";
              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.03 }}
                  className={`bg-pp-card border-2 rounded-2xl p-4 flex flex-col items-center gap-2 cursor-pointer hover:scale-[1.03] transition-all rarity-${rarity} ${justBought === item.id ? "animate-pop" : ""}`}
                  style={{ borderColor: RARITY_COLORS[rarity] + "60" }}
                  onClick={() => !owned && setConfirmItem(item)}
                >
                  <div
                    className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl"
                    style={{ background: `linear-gradient(135deg, ${item.color}33, ${item.color}66)` }}
                  >
                    {item.emoji}
                  </div>
                  <div className="text-center">
                    <div className="text-pp-cream font-bold text-xs leading-tight">{item.name}</div>
                    <div className="text-pp-muted text-xs mt-0.5 capitalize">{rarity}</div>
                  </div>
                  {owned ? (
                    <span className="text-pp-green text-xs font-bold bg-pp-green/15 px-2 py-0.5 rounded-full">✓ Owned</span>
                  ) : (
                    <span className="text-pp-gold text-xs font-black">{item.pointCost} SP</span>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {/* COLLECTION TAB */}
      {tab === "collection" && (
        <div className="px-5">
          {ownedRewards.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-5xl mb-3">🎒</div>
              <p className="text-pp-muted">Your collection is empty.</p>
              <p className="text-pp-muted text-sm mt-1">Complete activities to earn Spark Points, then visit the shop!</p>
              <button onClick={() => setTab("shop")} className="mt-4 bg-pp-orange text-white font-bold px-6 py-2.5 rounded-full">Browse Shop</button>
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
              {ownedRewards.map(o => {
                const item = REWARDS.find(r => r.id === o.rewardId);
                if (!item) return null;
                return (
                  <div key={o.rewardId} className="bg-pp-card border border-pp-green/30 rounded-2xl p-4 flex flex-col items-center gap-2">
                    <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl"
                      style={{ background: `linear-gradient(135deg, ${item.color}33, ${item.color}66)` }}>
                      {item.emoji}
                    </div>
                    <div className="text-pp-cream font-bold text-xs text-center">{item.name}</div>
                    <span className="text-pp-green text-xs font-bold">✓ Owned</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ACHIEVEMENTS TAB */}
      {tab === "achievements" && (
        <div className="px-5">
          <div className="grid grid-cols-1 gap-3">
            {ACHIEVEMENTS.map((ach, i) => {
              const unlocked = achievements.some(a => a.achievementId === ach.id);
              return (
                <motion.div
                  key={ach.id}
                  initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
                  className={`flex items-center gap-4 p-4 rounded-2xl border ${unlocked ? "bg-pp-card border-pp-gold/30" : "bg-pp-surface border-pp-border opacity-50"}`}
                >
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-3xl ${unlocked ? "bg-pp-gold/20" : "bg-pp-border"} ${!unlocked ? "grayscale" : ""}`}>
                    {ach.emoji}
                  </div>
                  <div className="flex-1">
                    <div className={`font-black text-sm ${unlocked ? "text-pp-cream" : "text-pp-muted"}`}>{ach.name}</div>
                    <div className="text-pp-muted text-xs mt-0.5">{ach.description}</div>
                  </div>
                  {unlocked && <span className="text-pp-gold text-xl">★</span>}
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {/* Purchase confirmation modal */}
      <AnimatePresence>
        {confirmItem && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 z-50"
              onClick={() => setConfirmItem(null)}
            />
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.8, opacity: 0 }}
              transition={{ type: "spring", damping: 20 }}
              className="fixed inset-x-5 top-1/2 -translate-y-1/2 z-50 bg-pp-card border border-pp-border rounded-3xl p-6 max-w-sm mx-auto"
            >
              <div className="text-center">
                <div className="text-6xl mb-3">{confirmItem.emoji}</div>
                <h3 className="font-display text-pp-cream text-xl">{confirmItem.name}</h3>
                <p className="text-pp-muted text-sm mt-1 mb-4">{confirmItem.description}</p>
                <div className="flex items-center justify-center gap-2 mb-5">
                  <span className="text-pp-gold font-black text-xl">{confirmItem.pointCost} SP</span>
                  <span className="text-pp-muted text-sm">→ {activeProfile.points - confirmItem.pointCost} remaining</span>
                </div>
                {activeProfile.points < confirmItem.pointCost ? (
                  <div>
                    <p className="text-pp-coral font-bold text-sm mb-3">Not enough Spark Points!</p>
                    <button onClick={() => setConfirmItem(null)} className="w-full py-3 rounded-2xl bg-pp-border text-pp-muted font-bold">Close</button>
                  </div>
                ) : (
                  <div className="flex gap-3">
                    <button onClick={() => setConfirmItem(null)} className="flex-1 py-3 rounded-2xl bg-pp-border text-pp-muted font-bold hover:bg-pp-card">Cancel</button>
                    <button onClick={() => handleBuy(confirmItem)} className="flex-1 py-3 rounded-2xl bg-pp-gold text-pp-navy font-black hover:brightness-110 transition-all">Buy Now!</button>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
