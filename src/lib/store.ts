import type {
  AppState, ParentAccount, ChildProfile, CompletedSession,
  OwnedReward, UnlockedAchievement,
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
    // quota exceeded — ignore
  }
}

// Mutation helpers (return new state, caller must call saveState)
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
  const reward = owned;
  const profiles = state.profiles.map(p => {
    if (p.id !== owned.profileId) return p;
    return p; // points already deducted by caller
  });
  return { ...state, ownedRewards: [...state.ownedRewards, reward], profiles };
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

export function getProfileSessions(state: AppState, profileId: string): CompletedSession[] {
  return state.sessions.filter(s => s.profileId === profileId);
}

export function getProfileOwnedRewards(state: AppState, profileId: string): OwnedReward[] {
  return state.ownedRewards.filter(r => r.profileId === profileId);
}

export function getProfileAchievements(state: AppState, profileId: string): UnlockedAchievement[] {
  return state.unlockedAchievements.filter(a => a.profileId === profileId);
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}
