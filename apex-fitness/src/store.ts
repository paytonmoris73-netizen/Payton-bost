import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { ChatMessage, Measurement, Meal, ProfileSection, Tab, WorkoutLog } from "./types";
import { daysAgo, uid } from "./lib";

/* ---------- persisted app data ---------- */

interface DataState {
  name: string;
  onboarded: boolean;
  premium: boolean;
  calorieGoal: number;
  proteinGoal: number;
  carbGoal: number;
  fatGoal: number;
  dailyActiveGoal: number; // minutes
  logs: WorkoutLog[];
  meals: Meal[];
  measurements: Measurement[];
  coachChat: ChatMessage[];

  finishOnboarding: (name: string) => void;
  logWorkout: (l: Omit<WorkoutLog, "id">) => void;
  addMeal: (m: Omit<Meal, "id">) => void;
  removeMeal: (id: string) => void;
  addMeasurement: (m: Measurement) => void;
  addCoachMsg: (m: Omit<ChatMessage, "id">) => void;
  clearCoach: () => void;
  setPremium: (v: boolean) => void;
  setCalorieGoal: (n: number) => void;
  reset: () => void;
}

/** Sample history so the Progress chart isn't empty on first launch. */
const seedMeasurements = (): Measurement[] =>
  [
    { d: 84, weight: 172, bodyFat: 16, muscle: 55 },
    { d: 70, weight: 171, bodyFat: 15.5, muscle: 56 },
    { d: 56, weight: 169.5, bodyFat: 14.8, muscle: 57 },
    { d: 42, weight: 168.5, bodyFat: 14, muscle: 58 },
    { d: 28, weight: 167.5, bodyFat: 13.3, muscle: 58.5 },
    { d: 14, weight: 166.5, bodyFat: 12.6, muscle: 59.2 },
    { d: 0, weight: 165, bodyFat: 12, muscle: 60 },
  ].map(({ d, ...m }) => ({ date: daysAgo(d), ...m }));

const initialData = () => ({
  name: "",
  onboarded: false,
  premium: false,
  calorieGoal: 2500,
  proteinGoal: 150,
  carbGoal: 280,
  fatGoal: 70,
  dailyActiveGoal: 45,
  logs: [] as WorkoutLog[],
  meals: [] as Meal[],
  measurements: seedMeasurements(),
  coachChat: [] as ChatMessage[],
});

export const useApp = create<DataState>()(
  persist(
    (set) => ({
      ...initialData(),
      finishOnboarding: (name) => set({ name: name.trim() || "Athlete", onboarded: true }),
      logWorkout: (l) => set((s) => ({ logs: [...s.logs, { ...l, id: uid() }] })),
      addMeal: (m) => set((s) => ({ meals: [...s.meals, { ...m, id: uid() }] })),
      removeMeal: (id) => set((s) => ({ meals: s.meals.filter((m) => m.id !== id) })),
      addMeasurement: (m) =>
        set((s) => ({
          measurements: [...s.measurements.filter((x) => x.date !== m.date), m].sort((a, b) =>
            a.date.localeCompare(b.date),
          ),
        })),
      addCoachMsg: (m) => set((s) => ({ coachChat: [...s.coachChat, { ...m, id: uid() }].slice(-40) })),
      clearCoach: () => set({ coachChat: [] }),
      setPremium: (v) => set({ premium: v }),
      setCalorieGoal: (n) => set({ calorieGoal: n }),
      reset: () => set(initialData()),
    }),
    { name: "apex-fitness-v1" },
  ),
);

/* ---------- ephemeral navigation ---------- */

interface NavState {
  tab: Tab;
  section: ProfileSection;
  sessionId: string | null;
  detailId: string | null;
  go: (tab: Tab, section?: ProfileSection) => void;
  openDetail: (id: string | null) => void;
  startSession: (id: string) => void;
  endSession: () => void;
}

export const useNav = create<NavState>((set) => ({
  tab: "home",
  section: "progress",
  sessionId: null,
  detailId: null,
  go: (tab, section) => set((s) => ({ tab, section: section ?? s.section, detailId: null })),
  openDetail: (id) => set({ detailId: id }),
  startSession: (id) => set({ sessionId: id, detailId: null }),
  endSession: () => set({ sessionId: null }),
}));
