import { useNavigate } from "react-router-dom";
import { useApp } from "../../contexts/AppContext";

const PLUS_FEATURES = [
  "🌍 Additional adventure worlds",
  "🎨 100+ extra avatar customizations",
  "🎯 Premium activity collections",
  "👨‍👩‍👧 Up to 6 child profiles",
  "📊 Detailed activity insights for parents",
  "🎁 Exclusive seasonal content",
];

export function SubscriptionPage() {
  const navigate = useNavigate();
  const { state } = useApp();
  const isPlus = state.parent?.subscription === "plus";

  return (
    <div className="min-h-screen bg-soft-gray dark:bg-gray-950 pb-10">
      <div className="bg-white dark:bg-gray-900 px-6 py-5 border-b border-soft-gray dark:border-gray-700 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="text-gray-400 hover:text-navy text-xl">‹</button>
        <div className="font-black text-navy dark:text-white">Subscription</div>
      </div>

      <div className="max-w-lg mx-auto px-6 py-6 space-y-4">
        {isPlus ? (
          <div className="bg-gradient-to-br from-yellow to-yellow-dark rounded-3xl p-6 text-center shadow-card">
            <div className="text-5xl mb-2">⭐</div>
            <div className="font-black text-2xl text-navy mb-1">PLAYPULSE PLUS</div>
            <div className="text-sm text-navy/70">Active Subscriber</div>
          </div>
        ) : (
          <>
            <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 shadow-card">
              <div className="text-center mb-4">
                <div className="font-black text-sm text-gray-400 uppercase tracking-wide mb-1">Current Plan</div>
                <div className="font-black text-2xl text-navy dark:text-white">Free</div>
                <div className="text-sm text-gray-400 mt-1">Full access to all core features</div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-coral to-coral-dark rounded-3xl p-6 shadow-card">
              <div className="text-center mb-4">
                <div className="inline-block bg-white/20 rounded-full px-3 py-1 text-white text-xs font-bold mb-2">UPGRADE</div>
                <div className="font-black text-3xl text-white">PLAYPULSE PLUS</div>
                <div className="text-white/80 text-sm mt-1">$4.99/month · Family plan</div>
              </div>
              <div className="space-y-2 mb-5">
                {PLUS_FEATURES.map(f => (
                  <div key={f} className="flex items-center gap-2 text-white text-sm">
                    <span>✓</span> {f}
                  </div>
                ))}
              </div>
              <div className="bg-white/20 rounded-2xl p-3 text-center text-white/80 text-xs">
                Payment processing coming soon. Subscriptions will only be managed through the parent dashboard and will never prompt children directly.
              </div>
            </div>

            <div className="bg-teal/10 rounded-2xl p-4 text-sm text-gray-600 dark:text-gray-400">
              <strong>Free includes:</strong> All 25+ activities, full adventure map, rewards shop, and 2 child profiles. No expiry.
            </div>
          </>
        )}
      </div>
    </div>
  );
}
