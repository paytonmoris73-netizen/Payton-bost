import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { Goal, Level } from "../data/workouts";

export interface Profile {
  name: string;
  goal: Goal;
  level: Level;
  ageGroup: "kids" | "teens" | "adults" | "seniors";
}

export interface CompletedSession {
  workoutId: string;
  workoutName: string;
  /** ISO date (yyyy-mm-dd) of completion, local time */
  date: string;
  minutes: number;
  calories: number;
  xp: number;
}

export interface AppState {
  profile: Profile | null;
  xp: number;
  sessions: CompletedSession[];
  streak: number;
  bestStreak: number;
  lastWorkoutDate: string | null;
  premium: boolean;
  likedPosts: string[];
  joinedChallenges: string[];
  ownedItems: string[];
  weeklyGoalMinutes: number;
}

const DEFAULT_STATE: AppState = {
  profile: null,
  xp: 0,
  sessions: [],
  streak: 0,
  bestStreak: 0,
  lastWorkoutDate: null,
  premium: false,
  likedPosts: [],
  joinedChallenges: [],
  ownedItems: [],
  weeklyGoalMinutes: 90,
};

export const XP_PER_LEVEL = 500;

export const levelFromXp = (xp: number) => Math.floor(xp / XP_PER_LEVEL) + 1;
export const xpIntoLevel = (xp: number) => xp % XP_PER_LEVEL;

export const localDateISO = (d = new Date()): string => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

const daysBetween = (aISO: string, bISO: string): number => {
  const a = new Date(`${aISO}T00:00:00`);
  const b = new Date(`${bISO}T00:00:00`);
  return Math.round((b.getTime() - a.getTime()) / 86_400_000);
};

/** Streak shown to the user: resets to 0 if the last workout was before yesterday. */
export const currentStreak = (state: Pick<AppState, "streak" | "lastWorkoutDate">): number => {
  if (!state.lastWorkoutDate) return 0;
  const gap = daysBetween(state.lastWorkoutDate, localDateISO());
  return gap <= 1 ? state.streak : 0;
};

export interface Toast {
  id: number;
  title: string;
  body?: string;
}

interface AppContextValue {
  state: AppState;
  createProfile: (profile: Profile) => void;
  updateProfile: (patch: Partial<Profile>) => void;
  completeWorkout: (s: Omit<CompletedSession, "date" | "xp">) => CompletedSession;
  toggleLike: (postId: string) => void;
  toggleChallenge: (challengeId: string) => void;
  purchase: (itemId: string) => void;
  setPremium: (on: boolean) => void;
  setWeeklyGoal: (minutes: number) => void;
  resetAll: () => void;
  toasts: Toast[];
  pushToast: (title: string, body?: string) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

const STORAGE_KEY = "apex-fitness-v1";

function loadState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_STATE;
    const parsed = JSON.parse(raw) as Partial<AppState>;
    return { ...DEFAULT_STATE, ...parsed };
  } catch {
    return DEFAULT_STATE;
  }
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(loadState);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const toastId = useRef(0);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Storage unavailable (private mode) — app still works, just not persisted.
    }
  }, [state]);

  const pushToast = useCallback((title: string, body?: string) => {
    const id = ++toastId.current;
    setToasts((t) => [...t, { id, title, body }]);
    window.setTimeout(() => {
      setToasts((t) => t.filter((x) => x.id !== id));
    }, 3600);
  }, []);

  const createProfile = useCallback((profile: Profile) => {
    setState((s) => ({ ...s, profile }));
  }, []);

  const updateProfile = useCallback((patch: Partial<Profile>) => {
    setState((s) => (s.profile ? { ...s, profile: { ...s.profile, ...patch } } : s));
  }, []);

  const completeWorkout = useCallback(
    (session: Omit<CompletedSession, "date" | "xp">): CompletedSession => {
      const date = localDateISO();
      let created: CompletedSession = { ...session, date, xp: 0 };
      setState((s) => {
        const multiplier = s.premium ? 2 : 1;
        const xpEarned = Math.max(20, Math.round(session.minutes * 10)) * multiplier;
        created = { ...session, date, xp: xpEarned };

        let streak: number;
        if (!s.lastWorkoutDate) {
          streak = 1;
        } else {
          const gap = daysBetween(s.lastWorkoutDate, date);
          if (gap === 0) streak = Math.max(1, s.streak);
          else if (gap === 1) streak = s.streak + 1;
          else streak = 1;
        }

        return {
          ...s,
          xp: s.xp + xpEarned,
          sessions: [...s.sessions, created],
          streak,
          bestStreak: Math.max(s.bestStreak, streak),
          lastWorkoutDate: date,
        };
      });
      return created;
    },
    [],
  );

  const toggleLike = useCallback((postId: string) => {
    setState((s) => ({
      ...s,
      likedPosts: s.likedPosts.includes(postId)
        ? s.likedPosts.filter((p) => p !== postId)
        : [...s.likedPosts, postId],
    }));
  }, []);

  const toggleChallenge = useCallback((challengeId: string) => {
    setState((s) => ({
      ...s,
      joinedChallenges: s.joinedChallenges.includes(challengeId)
        ? s.joinedChallenges.filter((c) => c !== challengeId)
        : [...s.joinedChallenges, challengeId],
    }));
  }, []);

  const purchase = useCallback((itemId: string) => {
    setState((s) =>
      s.ownedItems.includes(itemId) ? s : { ...s, ownedItems: [...s.ownedItems, itemId] },
    );
  }, []);

  const setPremium = useCallback((on: boolean) => {
    setState((s) => ({ ...s, premium: on }));
  }, []);

  const setWeeklyGoal = useCallback((minutes: number) => {
    setState((s) => ({ ...s, weeklyGoalMinutes: minutes }));
  }, []);

  const resetAll = useCallback(() => {
    setState(DEFAULT_STATE);
  }, []);

  const value = useMemo<AppContextValue>(
    () => ({
      state,
      createProfile,
      updateProfile,
      completeWorkout,
      toggleLike,
      toggleChallenge,
      purchase,
      setPremium,
      setWeeklyGoal,
      resetAll,
      toasts,
      pushToast,
    }),
    [
      state,
      createProfile,
      updateProfile,
      completeWorkout,
      toggleLike,
      toggleChallenge,
      purchase,
      setPremium,
      setWeeklyGoal,
      resetAll,
      toasts,
      pushToast,
    ],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used inside <AppProvider>");
  return ctx;
}
