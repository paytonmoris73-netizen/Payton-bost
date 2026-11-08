import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import {
  loadState, saveState, generateId,
  setParent, addProfile, updateProfile, deleteProfile, setActiveProfile,
  addSession, purchaseReward, deductPoints, unlockAchievement, unlockLocation,
  discoverCreature, completeDailyMission, selectCompanion,
  getProfileSessions, getProfileOwnedRewards, getProfileAchievements, getProfileCreatures,
  getLevelFromPoints, getWorldRebloom,
} from "../lib/store";
import type {
  AppState, ParentAccount, ChildProfile, CompletedSession,
  OwnedReward, UnlockedAchievement, OwnedCreature,
} from "../lib/types";
import { checkAchievements } from "../data/achievements";
import { ACTIVITIES } from "../data/activities";
import { CREATURES, getTodaysMissions } from "../data/creatures";

interface AppContextValue {
  state: AppState;
  login: (email: string, password: string) => boolean;
  register: (email: string, password: string, displayName: string) => boolean;
  logout: () => void;
  createProfile: (profile: Omit<ChildProfile, "id" | "parentId" | "createdAt">) => ChildProfile;
  updateChildProfile: (profile: ChildProfile) => void;
  removeProfile: (profileId: string) => void;
  selectProfile: (profileId: string | null) => void;
  activeProfile: ChildProfile | null;
  completeActivity: (activityId: string, durationMin: number) => { pointsEarned: number; newAchievements: string[]; newCreatures: string[] };
  buyReward: (profileId: string, rewardId: string, cost: number) => boolean;
  hasReward: (profileId: string, rewardId: string) => boolean;
  updateParentSettings: (updates: Partial<ParentAccount>) => void;
  profileSessions: (profileId: string) => CompletedSession[];
  profileRewards: (profileId: string) => OwnedReward[];
  profileAchievements: (profileId: string) => UnlockedAchievement[];
  profileCreatures: (profileId: string) => OwnedCreature[];
  setCompanion: (creatureId: string) => void;
  completeMission: (missionId: string) => void;
  isMissionCompleted: (missionId: string) => boolean;
  levelInfo: { level: number; title: string; nextLevelPoints: number };
  worldRebloom: number;
  dailyMissions: ReturnType<typeof getTodaysMissions>;
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
    if (!current.parent) return false;
    return false;
  }, []);

  const register = useCallback((email: string, _password: string, displayName: string): boolean => {
    const current = loadState();
    if (current.parent) return false;
    const parent: ParentAccount = {
      id: generateId(),
      email,
      displayName,
      createdAt: new Date().toISOString(),
      subscription: "free",
      notificationsEnabled: true,
      theme: "system",
    };
    persist(setParent(current, parent));
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
    if (!profileId) return { pointsEarned: 0, newAchievements: [], newCreatures: [] };

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
      profileId, totalActivities, totalPoints, categoriesUsed, categoryCountMap,
      current.unlockedLocations.length, ownedRewards, unlockedAchievements
    );
    for (const achId of newAchievementIds) {
      current = unlockAchievement(current, { profileId, achievementId: achId, unlockedAt: new Date().toISOString() });
    }

    // Unlock locations
    const locationThresholds: [number, string][] = [
      [3, "whispering-forest"], [6, "ocean-discovery"],
      [10, "crystal-mountains"], [15, "cloud-kingdom"], [20, "starlight-space"],
    ];
    for (const [threshold, locId] of locationThresholds) {
      if (totalActivities >= threshold) current = unlockLocation(current, locId);
    }

    // Discover creatures based on activity count
    const ownedCreatureIds = getProfileCreatures(current, profileId).map(c => c.creatureId);
    const newCreatures: string[] = [];
    for (const creature of CREATURES) {
      if (!ownedCreatureIds.includes(creature.id) && totalActivities >= creature.activitiesRequired) {
        current = discoverCreature(current, { profileId, creatureId: creature.id, discoveredAt: new Date().toISOString() });
        newCreatures.push(creature.id);
        if (newCreatures.length >= 1) break; // reveal one at a time
      }
    }

    persist(current);
    return { pointsEarned, newAchievements: newAchievementIds, newCreatures };
  }, [persist]);

  const buyReward = useCallback((profileId: string, rewardId: string, cost: number): boolean => {
    let current = loadState();
    const profile = current.profiles.find(p => p.id === profileId);
    if (!profile || profile.points < cost) return false;
    current = deductPoints(current, profileId, cost);
    const owned: OwnedReward = { profileId, rewardId, purchasedAt: new Date().toISOString() };
    current = purchaseReward(current, owned);
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
    persist(setParent(current, { ...current.parent, ...updates }));
  }, [persist]);

  const setCompanion = useCallback((creatureId: string) => {
    const current = loadState();
    const profileId = current.activeProfileId;
    if (!profileId) return;
    persist(selectCompanion(current, profileId, creatureId));
  }, [persist]);

  const completeMission = useCallback((missionId: string) => {
    const current = loadState();
    const profileId = current.activeProfileId;
    if (!profileId) return;
    const today = new Date().toDateString();
    persist(completeDailyMission(current, { profileId, missionId, completedDate: today }));
  }, [persist]);

  const isMissionCompleted = useCallback((missionId: string): boolean => {
    const profileId = state.activeProfileId;
    if (!profileId) return false;
    const today = new Date().toDateString();
    return state.completedDailyMissions.some(
      m => m.profileId === profileId && m.missionId === missionId && m.completedDate === today
    );
  }, [state]);

  const levelInfo = getLevelFromPoints(activeProfile?.points ?? 0);
  const totalSessionsForProfile = activeProfile
    ? state.sessions.filter(s => s.profileId === activeProfile.id).length
    : 0;
  const worldRebloom = getWorldRebloom(totalSessionsForProfile);
  const dailyMissions = getTodaysMissions();

  const profileSessions = useCallback((profileId: string) => getProfileSessions(state, profileId), [state]);
  const profileRewards = useCallback((profileId: string) => getProfileOwnedRewards(state, profileId), [state]);
  const profileAchievements = useCallback((profileId: string) => getProfileAchievements(state, profileId), [state]);
  const profileCreatures = useCallback((profileId: string) => getProfileCreatures(state, profileId), [state]);

  return (
    <AppContext.Provider value={{
      state, login, register, logout,
      createProfile, updateChildProfile, removeProfile, selectProfile, activeProfile,
      completeActivity, buyReward, hasReward, updateParentSettings,
      profileSessions, profileRewards, profileAchievements, profileCreatures,
      setCompanion, completeMission, isMissionCompleted,
      levelInfo, worldRebloom, dailyMissions,
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
