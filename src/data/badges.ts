import type { CompletedSession } from "../state/AppContext";

export interface Badge {
  id: string;
  name: string;
  description: string;
  xp: number;
  tier: "bronze" | "silver" | "gold" | "diamond";
  earned: (stats: BadgeStats) => boolean;
}

export interface BadgeStats {
  sessions: CompletedSession[];
  totalWorkouts: number;
  totalCalories: number;
  totalMinutes: number;
  bestStreak: number;
  level: number;
}

export const BADGES: Badge[] = [
  {
    id: "first-step",
    name: "First Step",
    description: "Complete your first workout",
    xp: 50,
    tier: "bronze",
    earned: (s) => s.totalWorkouts >= 1,
  },
  {
    id: "warming-up",
    name: "Warming Up",
    description: "Complete 5 workouts",
    xp: 100,
    tier: "bronze",
    earned: (s) => s.totalWorkouts >= 5,
  },
  {
    id: "regular",
    name: "The Regular",
    description: "Complete 15 workouts",
    xp: 200,
    tier: "silver",
    earned: (s) => s.totalWorkouts >= 15,
  },
  {
    id: "machine",
    name: "The Machine",
    description: "Complete 40 workouts",
    xp: 500,
    tier: "gold",
    earned: (s) => s.totalWorkouts >= 40,
  },
  {
    id: "on-fire",
    name: "On Fire",
    description: "Hit a 3-day streak",
    xp: 150,
    tier: "bronze",
    earned: (s) => s.bestStreak >= 3,
  },
  {
    id: "unstoppable",
    name: "Unstoppable",
    description: "Hit a 7-day streak",
    xp: 350,
    tier: "gold",
    earned: (s) => s.bestStreak >= 7,
  },
  {
    id: "furnace",
    name: "Human Furnace",
    description: "Burn 1,000 total calories",
    xp: 200,
    tier: "silver",
    earned: (s) => s.totalCalories >= 1000,
  },
  {
    id: "inferno",
    name: "Inferno",
    description: "Burn 5,000 total calories",
    xp: 600,
    tier: "diamond",
    earned: (s) => s.totalCalories >= 5000,
  },
  {
    id: "hour-power",
    name: "Hour of Power",
    description: "Train for 60 total minutes",
    xp: 100,
    tier: "bronze",
    earned: (s) => s.totalMinutes >= 60,
  },
  {
    id: "marathoner",
    name: "Marathoner",
    description: "Train for 10 total hours",
    xp: 500,
    tier: "gold",
    earned: (s) => s.totalMinutes >= 600,
  },
  {
    id: "level-5",
    name: "Rising Star",
    description: "Reach Level 5",
    xp: 250,
    tier: "silver",
    earned: (s) => s.level >= 5,
  },
  {
    id: "level-12",
    name: "Apex Legend",
    description: "Reach Level 12",
    xp: 1000,
    tier: "diamond",
    earned: (s) => s.level >= 12,
  },
];

export const TIER_STYLE: Record<Badge["tier"], { ring: string; label: string }> = {
  bronze: { ring: "from-orange-300 to-orange-700", label: "Bronze" },
  silver: { ring: "from-slate-200 to-slate-500", label: "Silver" },
  gold: { ring: "from-gold-200 to-gold-600", label: "Gold" },
  diamond: { ring: "from-cyan-200 to-indigo-500", label: "Diamond" },
};
