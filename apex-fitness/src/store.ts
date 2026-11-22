import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { ChatMessage, Measurement, Meal, ProfileSection, Tab, Workout, WorkoutLog } from "./types";
import type { BackupData } from "./backup";
import { WORKOUTS } from "./data";
import { uid } from "./lib";

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
  customWorkouts: Workout[];
  water: Record<string, number>; // glasses per day

  finishOnboarding: (name: string) => void;
  logWorkout: (l: Omit<WorkoutLog, "id">) => void;
  addMeal: (m: Omit<Meal, "id">) => void;
  removeMeal: (id: string) => void;
  addMeasurement: (m: Measurement) => void;
  setName: (n: string) => void;
  setGoals: (g: Partial<Pick<DataState, "calorieGoal" | "proteinGoal" | "carbGoal" | "fatGoal" | "dailyActiveGoal">>) => void;
  deleteLog: (id: string) => void;
  addCustomWorkout: (w: Workout) => void;
  deleteCustomWorkout: (id: string) => void;
  addWater: (date: string, delta: number) => void;
  restore: (d: BackupData) => void;
  addCoachMsg: (m: Omit<ChatMessage, "id">) => void;
  clearCoach: () => void;
  setPremium: (v: boolean) => void;
  setCalorieGoal: (n: number) => void;
  reset: () => void;
}

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
  measurements: [] as Measurement[],
  coachChat: [] as ChatMessage[],
  customWorkouts: [] as Workout[],
  water: {} as Record<string, number>,
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
      setName: (n) => set({ name: n.trim().slice(0, 24) || "Athlete" }),
      setGoals: (g) => set(g),
      deleteLog: (id) => set((s) => ({ logs: s.logs.filter((l) => l.id !== id) })),
      addCustomWorkout: (w) => set((s) => ({ customWorkouts: [{ ...w, custom: true }, ...s.customWorkouts] })),
      deleteCustomWorkout: (id) => set((s) => ({ customWorkouts: s.customWorkouts.filter((w) => w.id !== id) })),
      addWater: (date, delta) =>
        set((s) => ({ water: { ...s.water, [date]: Math.max(0, Math.min(30, (s.water[date] ?? 0) + delta)) } })),
      restore: (d) => set({ ...d, onboarded: true }),
      addCoachMsg: (m) => set((s) => ({ coachChat: [...s.coachChat, { ...m, id: uid() }].slice(-40) })),
      clearCoach: () => set({ coachChat: [] }),
      setPremium: (v) => set({ premium: v }),
      setCalorieGoal: (n) => set({ calorieGoal: n }),
      reset: () => {
        set(initialData());
        useNav.setState({ tab: "home", section: "progress", sessionId: null, detailId: null });
      },
    }),
    {
      name: "apex-fitness-v1",
      version: 1,
      // v0 shipped made-up sample measurements; drop exactly those so only real entries remain.
      migrate: (persisted, version) => {
        const s = (persisted ?? {}) as Partial<DataState>;
        if (version < 1 && Array.isArray(s.measurements)) {
          const sample = new Set(["172|16|55", "171|15.5|56", "169.5|14.8|57", "168.5|14|58", "167.5|13.3|58.5", "166.5|12.6|59.2", "165|12|60"]);
          s.measurements = s.measurements.filter((m) => !sample.has(`${m.weight}|${m.bodyFat}|${m.muscle}`));
        }
        return s as DataState;
      },
    },
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

/** Custom workouts first, then the built-in library. */
export const allWorkouts = (): Workout[] => [...useApp.getState().customWorkouts, ...WORKOUTS];
export const findWorkout = (id: string): Workout | undefined => allWorkouts().find((w) => w.id === id);
