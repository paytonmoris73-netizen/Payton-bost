import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import {
  loadState, saveState, generateId,
  setParent, addProfile, updateProfile, deleteProfile, setActiveProfile,
  addSession, purchaseReward, deductPoints, unlockAchievement, unlockLocation,
  getProfileSessions, getProfileOwnedRewards, getProfileAchievements,
} from "../lib/store";
import type { AppState, ParentAccount, ChildProfile, CompletedSession, OwnedReward, UnlockedAchievement } from "../lib/types";
import { checkAchievements } from "../data/achievements";
import { ACTIVITIES } from "../data/activities";

interface AppContextValue {
  state: AppState;
  // Auth
  login: (email: string, password: string) => boolean;
  register: (email: string, password: string, displayName: string) => boolean;
  logout: () => void;
  // Profiles
  createProfile: (profile: Omit<ChildProfile, "id" | "parentId" | "createdAt">) => ChildProfile;
  updateChildProfile: (profile: ChildProfile) => void;
  removeProfile: (profileId: string) => void;
  selectProfile: (profileId: string | null) => void;
  activeProfile: ChildProfile | null;
  // Activities
  completeActivity: (activityId: string, durationMin: number) => { pointsEarned: number; newAchievements: string[] };
  // Rewards
  buyReward: (profileId: string, rewardId: string, cost: number) => boolean;
  hasReward: (profileId: string, rewardId: string) => boolean;
  // Settings
  updateParentSettings: (updates: Partial<ParentAccount>) => void;
  // Data queries
  profileSessions: (profileId: string) => CompletedSession[];
  profileRewards: (profileId: string) => OwnedReward[];
  profileAchievements: (profileId: string) => UnlockedAchievement[];
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(loadState);

  const persist = useCallback((next: AppState) => {
    setState(next);
    saveState(next);
  }, []);

  const login = useCallback((email: string, _password: string): boolean => {
    const current = loadState();
    if (current.parent && current.parent.email.toLowerCase() === email.toLowerCase()) {
      setState(current);
      return true;
    }
    // Demo: allow any login if no account exists
    if (!current.parent) return false;
    return false;
  }, []);

  const register = useCallback((email: string, _password: string, displayName: string): boolean => {
    const current = loadState();
    if (current.parent) return false; // already registered
    const parent: ParentAccount = {
      id: generateId(),
      email,
      displayName,
      createdAt: new Date().toISOString(),
      subscription: "free",
      notificationsEnabled: true,
      theme: "system",
    };
    const next = setParent(current, parent);
    persist(next);
    return true;
  }, [persist]);

  const logout = useCallback(() => {
    persist({ ...loadState(), activeProfileId: null });
  }, [persist]);

  const createProfile = useCallback((profile: Omit<ChildProfile, "id" | "parentId" | "createdAt">): ChildProfile => {
    const current = loadState();
    const full: ChildProfile = {
      ...profile,
      id: generateId(),
      parentId: current.parent?.id ?? "",
      createdAt: new Date().toISOString(),
    };
    persist(addProfile(current, full));
    return full;
  }, [persist]);

  const updateChildProfile = useCallback((profile: ChildProfile) => {
    persist(updateProfile(loadState(), profile));
  }, [persist]);

  const removeProfile = useCallback((profileId: string) => {
    persist(deleteProfile(loadState(), profileId));
  }, [persist]);

  const selectProfile = useCallback((profileId: string | null) => {
    persist(setActiveProfile(loadState(), profileId));
  }, [persist]);

  const activeProfile = state.profiles.find(p => p.id === state.activeProfileId) ?? null;

  const completeActivity = useCallback((activityId: string, durationMin: number) => {
    let current = loadState();
    const profileId = current.activeProfileId;
    if (!profileId) return { pointsEarned: 0, newAchievements: [] };

    const pointsEarned = Math.max(10, durationMin * 5);
    const session: CompletedSession = {
      id: generateId(),
      profileId,
      activityId,
      activityName: ACTIVITIES.find(a => a.id === activityId)?.name ?? activityId,
      completedAt: new Date().toISOString(),
      durationMin,
      pointsEarned,
    };

    current = addSession(current, session);

    // Check achievements
    const profileSess = getProfileSessions(current, profileId);
    const totalActivities = profileSess.length;
    const totalPoints = current.profiles.find(p => p.id === profileId)?.points ?? 0;
    const categoriesUsed = new Set(profileSess.map(s => ACTIVITIES.find(a => a.id === s.activityId)?.category ?? "").filter(Boolean));
    const categoryCountMap = new Map<string, number>();
    profileSess.forEach(s => {
      const cat = ACTIVITIES.find(a => a.id === s.activityId)?.category ?? "";
      categoryCountMap.set(cat, (categoryCountMap.get(cat) ?? 0) + 1);
    });
    const ownedRewards = getProfileOwnedRewards(current, profileId).length;
    const unlockedAchievements = getProfileAchievements(current, profileId).map(a => a.achievementId);

    const newAchievementIds = checkAchievements(
      profileId, totalActivities, totalPoints,
      categoriesUsed, categoryCountMap,
      current.unlockedLocations.length, ownedRewards,
      unlockedAchievements
    );

    for (const achId of newAchievementIds) {
      current = unlockAchievement(current, { profileId, achievementId: achId, unlockedAt: new Date().toISOString() });
    }

    // Unlock adventure locations based on completed activities
    const locationThresholds: [number, string][] = [
      [3, "rainbow-forest"],
      [5, "ocean-discovery"],
      [8, "mountain-playground"],
      [12, "cloud-kingdom"],
      [18, "space-explorer"],
    ];
    for (const [threshold, locId] of locationThresholds) {
      if (totalActivities >= threshold) {
        current = unlockLocation(current, locId);
      }
    }

    persist(current);
    return { pointsEarned, newAchievements: newAchievementIds };
  }, [persist]);

  const buyReward = useCallback((profileId: string, rewardId: string, cost: number): boolean => {
    let current = loadState();
    const profile = current.profiles.find(p => p.id === profileId);
    if (!profile || profile.points < cost) return false;

    current = deductPoints(current, profileId, cost);
    const owned: OwnedReward = { profileId, rewardId, purchasedAt: new Date().toISOString() };
    current = purchaseReward(current, owned);

    // Check collector achievement
    const ownedCount = getProfileOwnedRewards(current, profileId).length;
    const unlockedIds = getProfileAchievements(current, profileId).map(a => a.achievementId);
    if (ownedCount >= 1 && !unlockedIds.includes("collector")) {
      current = unlockAchievement(current, { profileId, achievementId: "collector", unlockedAt: new Date().toISOString() });
    }

    persist(current);
    return true;
  }, [persist]);

  const hasReward = useCallback((profileId: string, rewardId: string): boolean => {
    return state.ownedRewards.some(r => r.profileId === profileId && r.rewardId === rewardId);
  }, [state.ownedRewards]);

  const updateParentSettings = useCallback((updates: Partial<ParentAccount>) => {
    const current = loadState();
    if (!current.parent) return;
    const next = setParent(current, { ...current.parent, ...updates });
    persist(next);
  }, [persist]);

  const profileSessions = useCallback((profileId: string) => getProfileSessions(state, profileId), [state]);
  const profileRewards = useCallback((profileId: string) => getProfileOwnedRewards(state, profileId), [state]);
  const profileAchievements = useCallback((profileId: string) => getProfileAchievements(state, profileId), [state]);

  return (
    <AppContext.Provider value={{
      state, login, register, logout,
      createProfile, updateChildProfile, removeProfile, selectProfile, activeProfile,
      completeActivity, buyReward, hasReward,
      updateParentSettings,
      profileSessions, profileRewards, profileAchievements,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
