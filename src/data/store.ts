export interface StoreItem {
  id: string;
  name: string;
  description: string;
  price: string;
  icon: "bolt" | "dumbbell" | "crown" | "calendar" | "heart" | "shield";
}

export const PREMIUM_PERKS = [
  "Unlock every Pro workout and program",
  "Advanced progress analytics and insights",
  "Custom personalized training plans",
  "2× XP on every completed workout",
  "Exclusive badges and profile flair",
  "Ad-free, forever",
];

export const STORE_ITEMS: StoreItem[] = [
  {
    id: "premium-pass",
    name: "Premium Pass",
    description: "All Pro workouts, analytics, and 2× XP",
    price: "$9.99 / month",
    icon: "crown",
  },
  {
    id: "xp-booster",
    name: "XP Booster",
    description: "Double XP for your next 10 workouts",
    price: "$4.99",
    icon: "bolt",
  },
  {
    id: "custom-plans",
    name: "Custom Plans",
    description: "A coach-built plan tuned to your goal",
    price: "$6.99",
    icon: "calendar",
  },
  {
    id: "recovery-pack",
    name: "Recovery Pack",
    description: "Guided stretching and cooldown library",
    price: "$3.99",
    icon: "heart",
  },
];
