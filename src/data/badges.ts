import type { CompletedSession } from "../state/AppContext";
import type { IconName } from "../components/Icon";

export interface Badge {
  id: string;
  name: string;
  description: string;
  xp: number;
  icon: IconName;
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
    icon: "play",
    tier: "bronze",
    earned: (s) => s.totalWorkouts >= 1,
  },
  {
    id: "warming-up",
    name: "Warming Up",
    description: "Complete 5 workouts",
    xp: 100,
    icon: "check",
    tier: "bronze",
    earned: (s) => s.totalWorkouts >= 5,
  },
  {
    id: "regular",
    name: "The Regular",
    description: "Complete 15 workouts",
    xp: 200,
    icon: "calendar",
    tier: "silver",
    earned: (s) => s.totalWorkouts >= 15,
  },
  {
    id: "machine",
    name: "The Machine",
    description: "Complete 40 workouts",
    xp: 500,
    icon: "dumbbell",
    tier: "gold",
    earned: (s) => s.totalWorkouts >= 40,
  },
  {
    id: "on-fire",
    name: "On Fire",
    description: "Hit a 3-day streak",
    xp: 150,
    icon: "flame",
    tier: "bronze",
    earned: (s) => s.bestStreak >= 3,
  },
  {
    id: "unstoppable",
    name: "Unstoppable",
    description: "Hit a 7-day streak",
    xp: 350,
    icon: "bolt",
    tier: "gold",
    earned: (s) => s.bestStreak >= 7,
  },
  {
    id: "furnace",
    name: "Human Furnace",
    description: "Burn 1,000 total calories",
    xp: 200,
    icon: "flame",
    tier: "silver",
    earned: (s) => s.totalCalories >= 1000,
  },
  {
    id: "inferno",
    name: "Inferno",
    description: "Burn 5,000 total calories",
    xp: 600,
    icon: "trophy",
    tier: "diamond",
    earned: (s) => s.totalCalories >= 5000,
  },
  {
    id: "hour-power",
    name: "Hour of Power",
    description: "Train for 60 total minutes",
    xp: 100,
    icon: "clock",
    tier: "bronze",
    earned: (s) => s.totalMinutes >= 60,
  },
  {
    id: "marathoner",
    name: "Marathoner",
    description: "Train for 10 total hours",
    xp: 500,
    icon: "heart",
    tier: "gold",
    earned: (s) => s.totalMinutes >= 600,
  },
  {
    id: "level-5",
    name: "Rising Star",
    description: "Reach Level 5",
    xp: 250,
    icon: "star",
    tier: "silver",
    earned: (s) => s.level >= 5,
  },
  {
    id: "level-12",
    name: "Apex Legend",
    description: "Reach Level 12",
    xp: 1000,
    icon: "crown",
    tier: "diamond",
    earned: (s) => s.level >= 12,
  },
];

export const TIER_STYLE: Record<
  Badge["tier"],
  { ring: string; glow: string; text: string; label: string }
> = {
  bronze: {
    ring: "from-orange-300 to-orange-700",
    glow: "shadow-[0_0_18px_-6px_rgba(234,120,40,0.75)]",
    text: "text-orange-300",
    label: "Bronze",
  },
  silver: {
    ring: "from-slate-200 to-slate-500",
    glow: "shadow-[0_0_18px_-6px_rgba(203,213,225,0.7)]",
    text: "text-slate-200",
    label: "Silver",
  },
  gold: {
    ring: "from-gold-200 to-gold-600",
    glow: "shadow-[0_0_20px_-5px_rgba(248,189,60,0.85)]",
    text: "text-gold-300",
    label: "Gold",
  },
  diamond: {
    ring: "from-cyan-200 to-indigo-500",
    glow: "shadow-[0_0_22px_-5px_rgba(103,232,249,0.8)]",
    text: "text-cyan-200",
    label: "Diamond",
  },
};
