export type Category = "Strength" | "Cardio" | "Mobility";
export type Level = "Beginner" | "Intermediate" | "Advanced";

export interface Exercise {
  name: string;
  sets: number;
  /** Target reps per set (omit for timed exercises). */
  reps?: number;
  /** Target seconds per set (timed exercises). */
  seconds?: number;
  /** Rest after each set, in seconds. */
  rest: number;
}

export interface Workout {
  id: string;
  name: string;
  category: Category;
  level: Level;
  minutes: number;
  focus: string;
  kcalPerMin: number;
  exercises: Exercise[];
}

export interface WorkoutLog {
  id: string;
  workoutId: string;
  name: string;
  date: string; // YYYY-MM-DD (local)
  minutes: number;
  calories: number;
}

export interface Meal {
  id: string;
  name: string;
  date: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface Measurement {
  date: string;
  weight: number; // lbs
  bodyFat: number; // %
  muscle: number; // lbs
}

export type Tab = "home" | "workouts" | "nutrition" | "profile";
export type ProfileSection = "progress" | "leaderboard" | "premium";
