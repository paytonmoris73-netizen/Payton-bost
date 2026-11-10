// Core domain types for PLAYPULSE 2.0

export interface ParentAccount {
  id: string;
  email: string;
  displayName: string;
  createdAt: string;
  subscription: "free" | "plus";
  notificationsEnabled: boolean;
  theme: "light" | "dark" | "system";
}

export interface ChildProfile {
  id: string;
  parentId: string;
  nickname: string;
  ageRange: "6-8" | "9-10" | "11-12";
  avatarConfig: AvatarConfig;
  favoriteCategories: string[];
  accessibilityPrefs: AccessibilityPrefs;
  points: number;
  createdAt: string;
  selectedCompanionId?: string;
}

export interface AvatarConfig {
  skinTone: string;
  hairStyle: string;
  hairColor: string;
  outfit: string;
  accessory: string;
  background: string;
  equippedItems: string[];
}

export interface AccessibilityPrefs {
  reducedMotion: boolean;
  largeText: boolean;
  highContrast: boolean;
}

export type ActivityCategory =
  | "quick-moves"
  | "dance"
  | "sports"
  | "stretching"
  | "balance"
  | "indoor"
  | "outdoor"
  | "team"
  | "creative"
  | "relaxing";

export interface ActivityStep {
  id: string;
  instruction: string;
  duration?: number;
  illustration?: string;
}

export interface Activity {
  id: string;
  name: string;
  category: ActivityCategory;
  description: string;
  durationMin: number;
  equipment: string[];
  space: "indoor" | "outdoor" | "both";
  steps: ActivityStep[];
  color: string;
  emoji: string;
  tags: string[];
  modifications?: string;
  safetyNote?: string;
}

export interface CompletedSession {
  id: string;
  profileId: string;
  activityId: string;
  activityName: string;
  completedAt: string;
  durationMin: number;
  pointsEarned: number;
}

export interface RewardItem {
  id: string;
  name: string;
  description: string;
  category: "hat" | "shoes" | "costume" | "mascot" | "room" | "avatar" | "background" | "badge";
  pointCost: number;
  emoji: string;
  color: string;
  isPremium?: boolean;
}

export interface OwnedReward {
  profileId: string;
  rewardId: string;
  purchasedAt: string;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  emoji: string;
  condition: string;
  pointsRequired?: number;
  activitiesRequired?: number;
  categoriesRequired?: number;
}

export interface UnlockedAchievement {
  profileId: string;
  achievementId: string;
  unlockedAt: string;
}

export interface AdventureLocation {
  id: string;
  name: string;
  theme: string;
  description: string;
  emoji: string;
  color: string;
  bgColor: string;
  activityIds: string[];
  activitiesRequired: number;
  rewardId?: string;
}

export interface Creature {
  id: string;
  name: string;
  description: string;
  personality: string;
  region: string;
  rarity: "common" | "uncommon" | "rare" | "legendary";
  emoji: string;
  color: string;
  unlockCondition: string;
  idleMessage: string;
  activitiesRequired: number;
}

export interface OwnedCreature {
  profileId: string;
  creatureId: string;
  discoveredAt: string;
}

export interface DailyMission {
  id: string;
  description: string;
  icon: string;
  type: "activity" | "explore" | "creature" | "homebase" | "game";
  sparkReward: number;
}

export interface CompletedDailyMission {
  profileId: string;
  missionId: string;
  completedDate: string;
}

// ── Workout Plans ─────────────────────────────────────────────────────────────

export interface WorkoutExercise {
  id: string;
  name: string;
  durationSeconds: number;
  reps?: number;
  instruction: string;
  demonstrationKey: string;
  modification?: string;
}

export interface WorkoutDay {
  dayNumber: number;
  title: string;
  focus: string;
  exercises: WorkoutExercise[];
  energyReward: number;
  sparkPoints: number;
}

export interface WorkoutWeek {
  weekNumber: number;
  title: string;
  description: string;
  days: WorkoutDay[];
  illustration: string;
}

export interface WorkoutPlan {
  id: string;
  name: string;
  description: string;
  category: string;
  difficulty: "beginner" | "intermediate";
  weeks: WorkoutWeek[];
  thumbnailColor: string;
  emoji: string;
}

// ── Restoration & Missions ─────────────────────────────────────────────────────

export interface RestorationProject {
  id: string;
  locationId: string;
  name: string;
  emoji: string;
  stages: { description: string; requiredActivities: number }[];
}

export interface Mission {
  id: string;
  title: string;
  description: string;
  icon: string;
  type: "daily" | "adventure" | "special";
  requirement: { type: "activity" | "explore" | "creature" | "plan"; count: number; category?: string };
  reward: { sparkPoints: number; adventureEnergy: number; creatureId?: string };
}

// ── Extended Avatar ────────────────────────────────────────────────────────────

export interface AvatarCustomization {
  bodyShape: "round" | "tall" | "small";
  skinTone: string;
  hairStyle: string;
  headItem: string;
  eyeStyle: string;
  outfit: string;
  shoes: string;
  accessory: string;
  background: string;
}

// Legacy type for BunnyX BuildLog component
export interface Revision {
  id: number;
  prompt: string;
  status: "streaming" | "done" | "error";
  note?: string;
  error?: string;
}

export interface Config {
  model: string;
  hasApiKey: boolean;
}

export interface AppState {
  parent: ParentAccount | null;
  profiles: ChildProfile[];
  activeProfileId: string | null;
  sessions: CompletedSession[];
  ownedRewards: OwnedReward[];
  unlockedAchievements: UnlockedAchievement[];
  unlockedLocations: string[];
  ownedCreatures: OwnedCreature[];
  completedDailyMissions: CompletedDailyMission[];
  // Plan progress: planId -> { completedDays: ["w1d1","w1d2"], startedAt }
  planProgress: Record<string, { completedDays: string[]; startedAt: string }>;
  activePlanId: string | null;
  // Restoration: locationId -> projectId -> stage number
  restorationProgress: Record<string, Record<string, number>>;
  // Mission progress: missionId -> { current, completed, claimedAt }
  missionProgress: Record<string, { current: number; completed: boolean; claimedAt?: string }>;
}
