import { useNavigate } from "react-router-dom";
import { useApp } from "../../contexts/AppContext";
import { REWARDS } from "../../data/rewards";
import { Button } from "../../components/ui/Button";
import { Pip } from "../../components/mascot/Pip";

export function RewardCollectionPage() {
  const navigate = useNavigate();
  const { activeProfile, profileRewards } = useApp();

  if (!activeProfile) return null;
  const owned = profileRewards(activeProfile.id);
  const ownedItems = owned.map(o => REWARDS.find(r => r.id === o.rewardId)).filter(Boolean);

  return (
    <div className="pb-24 lg:pb-8 animate-fade-in">
      <div className="flex items-center px-5 py-5">
        <button onClick={() => navigate(-1)} className="text-gray-400 hover:text-navy dark:hover:text-white mr-3 text-xl">‹</button>
        <div>
          <h1 className="font-black text-xl text-navy dark:text-white">My Collection</h1>
          <div className="text-xs text-gray-400">{ownedItems.length} items owned</div>
        </div>
      </div>

      {ownedItems.length === 0 ? (
        <div className="text-center px-6 py-16">
          <Pip expression="curious" size={80} />
          <h3 className="font-black text-navy dark:text-white mt-4 mb-2">Nothing yet!</h3>
          <p className="text-sm text-gray-500 mb-4">Complete activities to earn Play Points and buy rewards.</p>
          <Button onClick={() => navigate("/app/rewards")}>Visit Shop</Button>
        </div>
      ) : (
        <div className="px-5 grid grid-cols-3 gap-3">
          {ownedItems.map(item => item && (
            <div
              key={item.id}
              className="bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow-card"
            >
              <div
                className="h-20 flex items-center justify-center text-4xl"
                style={{ backgroundColor: item.color + "30" }}
              >
                {item.emoji}
              </div>
              <div className="p-2 text-center">
                <div className="font-bold text-xs text-navy dark:text-white leading-tight">{item.name}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {ownedItems.length > 0 && (
        <div className="px-5 mt-4">
          <Button variant="secondary" fullWidth onClick={() => navigate("/app/rewards")}>
            Get More Rewards
          </Button>
        </div>
      )}
    </div>
  );
}
