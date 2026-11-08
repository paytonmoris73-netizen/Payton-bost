import type {
  AppState, ParentAccount, ChildProfile, CompletedSession,
  OwnedReward, UnlockedAchievement, OwnedCreature, CompletedDailyMission,
} from "./types";

const KEY = "playpulse_state";

function defaultState(): AppState {
  return {
    parent: null,
    profiles: [],
    activeProfileId: null,
    sessions: [],
    ownedRewards: [],
    unlockedAchievements: [],
    unlockedLocations: ["sunny-meadow"],
    ownedCreatures: [],
    completedDailyMissions: [],
  };
}

export function loadState(): AppState {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return defaultState();
    const parsed = JSON.parse(raw) as AppState;
    return { ...defaultState(), ...parsed };
  } catch {
    return defaultState();
  }
}

export function saveState(state: AppState): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    // quota exceeded
  }
}

export function setParent(state: AppState, parent: ParentAccount | null): AppState {
  return { ...state, parent };
}

export function addProfile(state: AppState, profile: ChildProfile): AppState {
  return { ...state, profiles: [...state.profiles, profile] };
}

export function updateProfile(state: AppState, updated: ChildProfile): AppState {
  return { ...state, profiles: state.profiles.map(p => p.id === updated.id ? updated : p) };
}

export function deleteProfile(state: AppState, profileId: string): AppState {
  const activeProfileId = state.activeProfileId === profileId ? null : state.activeProfileId;
  return {
    ...state,
    activeProfileId,
    profiles: state.profiles.filter(p => p.id !== profileId),
    sessions: state.sessions.filter(s => s.profileId !== profileId),
    ownedRewards: state.ownedRewards.filter(r => r.profileId !== profileId),
    unlockedAchievements: state.unlockedAchievements.filter(a => a.profileId !== profileId),
    ownedCreatures: state.ownedCreatures.filter(c => c.profileId !== profileId),
    completedDailyMissions: state.completedDailyMissions.filter(m => m.profileId !== profileId),
  };
}

export function setActiveProfile(state: AppState, profileId: string | null): AppState {
  return { ...state, activeProfileId: profileId };
}

export function addSession(state: AppState, session: CompletedSession): AppState {
  const profiles = state.profiles.map(p => {
    if (p.id !== session.profileId) return p;
    return { ...p, points: p.points + session.pointsEarned };
  });
  return { ...state, sessions: [...state.sessions, session], profiles };
}

export function purchaseReward(state: AppState, owned: OwnedReward): AppState {
  return { ...state, ownedRewards: [...state.ownedRewards, owned] };
}

export function deductPoints(state: AppState, profileId: string, amount: number): AppState {
  const profiles = state.profiles.map(p => {
    if (p.id !== profileId) return p;
    return { ...p, points: Math.max(0, p.points - amount) };
  });
  return { ...state, profiles };
}

export function unlockAchievement(state: AppState, ua: UnlockedAchievement): AppState {
  const already = state.unlockedAchievements.some(
    a => a.profileId === ua.profileId && a.achievementId === ua.achievementId
  );
  if (already) return state;
  return { ...state, unlockedAchievements: [...state.unlockedAchievements, ua] };
}

export function unlockLocation(state: AppState, locationId: string): AppState {
  if (state.unlockedLocations.includes(locationId)) return state;
  return { ...state, unlockedLocations: [...state.unlockedLocations, locationId] };
}

export function discoverCreature(state: AppState, owned: OwnedCreature): AppState {
  const already = state.ownedCreatures.some(
    c => c.profileId === owned.profileId && c.creatureId === owned.creatureId
  );
  if (already) return state;
  return { ...state, ownedCreatures: [...state.ownedCreatures, owned] };
}

export function completeDailyMission(state: AppState, cm: CompletedDailyMission): AppState {
  const already = state.completedDailyMissions.some(
    m => m.profileId === cm.profileId && m.missionId === cm.missionId && m.completedDate === cm.completedDate
  );
  if (already) return state;
  return { ...state, completedDailyMissions: [...state.completedDailyMissions, cm] };
}

export function selectCompanion(state: AppState, profileId: string, creatureId: string): AppState {
  const profiles = state.profiles.map(p => {
    if (p.id !== profileId) return p;
    return { ...p, selectedCompanionId: creatureId };
  });
  return { ...state, profiles };
}

export function getProfileSessions(state: AppState, profileId: string): CompletedSession[] {
  return state.sessions.filter(s => s.profileId === profileId);
}

export function getProfileOwnedRewards(state: AppState, profileId: string): OwnedReward[] {
  return state.ownedRewards.filter(r => r.profileId === profileId);
}

export function getProfileAchievements(state: AppState, profileId: string): UnlockedAchievement[] {
  return state.unlockedAchievements.filter(a => a.profileId === profileId);
}

export function getProfileCreatures(state: AppState, profileId: string): OwnedCreature[] {
  return state.ownedCreatures.filter(c => c.profileId === profileId);
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function getLevelFromPoints(points: number): { level: number; title: string; nextLevelPoints: number } {
  const levels = [
    { min: 0, title: "New Explorer" },
    { min: 50, title: "Meadow Friend" },
    { min: 150, title: "Forest Discoverer" },
    { min: 300, title: "Ocean Adventurer" },
    { min: 500, title: "Mountain Explorer" },
    { min: 750, title: "Cloud Traveler" },
    { min: 1000, title: "Wonderworld Champion" },
  ];
  let level = 1;
  for (let i = levels.length - 1; i >= 0; i--) {
    if (points >= levels[i].min) { level = i + 1; break; }
  }
  const nextLevelPoints = level < levels.length ? levels[level].min : levels[levels.length - 1].min;
  return { level, title: levels[level - 1].title, nextLevelPoints };
}

export function getWorldRebloom(totalActivities: number): number {
  return Math.min(100, Math.round((totalActivities / 25) * 100));
}
