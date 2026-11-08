import type { Achievement } from "../lib/types";

export const ACHIEVEMENTS: Achievement[] = [
  {
    id: "first-adventure",
    name: "First Adventure!",
    description: "Completed your very first activity. The journey begins!",
    emoji: "🌟",
    condition: "Complete 1 activity",
    activitiesRequired: 1,
  },
  {
    id: "five-adventures",
    name: "Adventure Enthusiast",
    description: "Completed 5 activities. You're on a roll!",
    emoji: "🔥",
    condition: "Complete 5 activities",
    activitiesRequired: 5,
  },
  {
    id: "ten-adventures",
    name: "Adventure Expert",
    description: "10 activities completed! You're becoming a movement master.",
    emoji: "⚡",
    condition: "Complete 10 activities",
    activitiesRequired: 10,
  },
  {
    id: "curious-explorer",
    name: "Curious Explorer",
    description: "Tried 5 different activity categories. So adventurous!",
    emoji: "🔭",
    condition: "Try 5 different categories",
    categoriesRequired: 5,
  },
  {
    id: "dance-star",
    name: "Dance Star",
    description: "Completed 3 dance activities. The dance floor is yours!",
    emoji: "💃",
    condition: "Complete 3 dance activities",
    activitiesRequired: 3,
  },
  {
    id: "sports-fan",
    name: "Sports Fan",
    description: "Completed 3 sports activities. MVP energy!",
    emoji: "🏆",
    condition: "Complete 3 sports activities",
    activitiesRequired: 3,
  },
  {
    id: "zen-master",
    name: "Zen Master",
    description: "Completed 3 relaxing or stretching activities. Peace and calm.",
    emoji: "🧘",
    condition: "Complete 3 calming activities",
    activitiesRequired: 3,
  },
  {
    id: "outdoor-explorer",
    name: "Outdoor Explorer",
    description: "Completed 3 outdoor activities. Fresh air lover!",
    emoji: "🌿",
    condition: "Complete 3 outdoor activities",
    activitiesRequired: 3,
  },
  {
    id: "points-100",
    name: "100 Point Club",
    description: "Earned 100 Play Points! Saving up for something amazing?",
    emoji: "💰",
    condition: "Earn 100 points",
    pointsRequired: 100,
  },
  {
    id: "points-500",
    name: "500 Point Star",
    description: "500 Play Points earned. You're a Play Point legend!",
    emoji: "⭐",
    condition: "Earn 500 points",
    pointsRequired: 500,
  },
  {
    id: "creative-mover",
    name: "Creative Mover",
    description: "Tried a creative movement activity. You move in unique ways!",
    emoji: "🎨",
    condition: "Complete 1 creative activity",
    activitiesRequired: 1,
  },
  {
    id: "world-explorer",
    name: "World Explorer",
    description: "Visited 3 adventure locations. The map is calling!",
    emoji: "🗺️",
    condition: "Visit 3 adventure locations",
    activitiesRequired: 3,
  },
  {
    id: "balance-champ",
    name: "Balance Champion",
    description: "Completed 2 balance activities. Rock steady!",
    emoji: "🦩",
    condition: "Complete 2 balance activities",
    activitiesRequired: 2,
  },
  {
    id: "collector",
    name: "Collector",
    description: "Bought your first reward from the shop. Great taste!",
    emoji: "🛍️",
    condition: "Purchase 1 reward",
    activitiesRequired: 0,
  },
];

export function getAchievementById(id: string): Achievement | undefined {
  return ACHIEVEMENTS.find(a => a.id === id);
}

export function checkAchievements(
  _profileId: string,
  totalActivities: number,
  totalPoints: number,
  categoriesUsed: Set<string>,
  categoryCountMap: Map<string, number>,
  unlockedLocations: number,
  ownedRewards: number,
  unlockedIds: string[]
): string[] {
  const newlyUnlocked: string[] = [];

  for (const ach of ACHIEVEMENTS) {
    if (unlockedIds.includes(ach.id)) continue;

    let unlock = false;
    switch (ach.id) {
      case "first-adventure": unlock = totalActivities >= 1; break;
      case "five-adventures": unlock = totalActivities >= 5; break;
      case "ten-adventures": unlock = totalActivities >= 10; break;
      case "curious-explorer": unlock = categoriesUsed.size >= 5; break;
      case "dance-star": unlock = (categoryCountMap.get("dance") ?? 0) >= 3; break;
      case "sports-fan": unlock = (categoryCountMap.get("sports") ?? 0) >= 3; break;
      case "zen-master": unlock = ((categoryCountMap.get("relaxing") ?? 0) + (categoryCountMap.get("stretching") ?? 0)) >= 3; break;
      case "outdoor-explorer": unlock = (categoryCountMap.get("outdoor") ?? 0) >= 3; break;
      case "points-100": unlock = totalPoints >= 100; break;
      case "points-500": unlock = totalPoints >= 500; break;
      case "creative-mover": unlock = (categoryCountMap.get("creative") ?? 0) >= 1; break;
      case "world-explorer": unlock = unlockedLocations >= 3; break;
      case "balance-champ": unlock = (categoryCountMap.get("balance") ?? 0) >= 2; break;
      case "collector": unlock = ownedRewards >= 1; break;
    }
    if (unlock) newlyUnlocked.push(ach.id);
  }
  return newlyUnlocked;
}
