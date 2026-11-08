// Core domain types for PLAYPULSE

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
  duration?: number; // seconds
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
}
