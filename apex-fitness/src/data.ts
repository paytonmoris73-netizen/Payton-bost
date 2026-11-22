import type { Meal, Workout } from "./types";

export const WORKOUTS: Workout[] = [
  {
    id: "upper-strength",
    name: "Upper Body Strength",
    category: "Strength",
    level: "Intermediate",
    minutes: 40,
    focus: "Chest · Back · Shoulders · Arms",
    kcalPerMin: 7,
    exercises: [
      { name: "Bench Press", sets: 4, reps: 8, rest: 90 },
      { name: "Bent-Over Row", sets: 4, reps: 8, rest: 90 },
      { name: "Overhead Press", sets: 3, reps: 10, rest: 75 },
      { name: "Pull-Ups", sets: 3, reps: 8, rest: 75 },
      { name: "Dumbbell Curl", sets: 3, reps: 12, rest: 60 },
      { name: "Triceps Dips", sets: 3, reps: 12, rest: 60 },
    ],
  },
  {
    id: "full-body-blast",
    name: "Full Body Blast",
    category: "Strength",
    level: "Intermediate",
    minutes: 30,
    focus: "Total body conditioning",
    kcalPerMin: 9,
    exercises: [
      { name: "Goblet Squat", sets: 3, reps: 12, rest: 45 },
      { name: "Push-Ups", sets: 3, reps: 15, rest: 45 },
      { name: "Dumbbell Row", sets: 3, reps: 12, rest: 45 },
      { name: "Walking Lunges", sets: 3, reps: 20, rest: 45 },
      { name: "Burpees", sets: 3, reps: 10, rest: 45 },
      { name: "Plank", sets: 3, seconds: 45, rest: 30 },
    ],
  },
  {
    id: "lower-strength",
    name: "Lower Body Strength",
    category: "Strength",
    level: "Intermediate",
    minutes: 30,
    focus: "Quads · Glutes · Hamstrings",
    kcalPerMin: 7,
    exercises: [
      { name: "Back Squat", sets: 4, reps: 8, rest: 90 },
      { name: "Romanian Deadlift", sets: 4, reps: 8, rest: 90 },
      { name: "Bulgarian Split Squat", sets: 3, reps: 10, rest: 60 },
      { name: "Hip Thrust", sets: 3, reps: 12, rest: 60 },
      { name: "Standing Calf Raise", sets: 3, reps: 15, rest: 45 },
    ],
  },
  {
    id: "hiit-cardio",
    name: "HIIT Cardio",
    category: "Cardio",
    level: "Advanced",
    minutes: 20,
    focus: "Max-effort intervals",
    kcalPerMin: 12,
    exercises: [
      { name: "Jump Squats", sets: 4, seconds: 40, rest: 20 },
      { name: "Mountain Climbers", sets: 4, seconds: 40, rest: 20 },
      { name: "High Knees", sets: 4, seconds: 40, rest: 20 },
      { name: "Burpees", sets: 4, seconds: 40, rest: 20 },
      { name: "Skater Hops", sets: 4, seconds: 40, rest: 20 },
    ],
  },
  {
    id: "push-pull-legs",
    name: "Push Pull Legs",
    category: "Strength",
    level: "Advanced",
    minutes: 45,
    focus: "Classic hypertrophy split",
    kcalPerMin: 7,
    exercises: [
      { name: "Incline Dumbbell Press", sets: 4, reps: 10, rest: 75 },
      { name: "Lat Pulldown", sets: 4, reps: 10, rest: 75 },
      { name: "Leg Press", sets: 4, reps: 12, rest: 90 },
      { name: "Lateral Raise", sets: 3, reps: 15, rest: 45 },
      { name: "Cable Row", sets: 3, reps: 12, rest: 60 },
      { name: "Leg Curl", sets: 3, reps: 12, rest: 60 },
    ],
  },
  {
    id: "core-crusher",
    name: "Core Crusher",
    category: "Strength",
    level: "Beginner",
    minutes: 15,
    focus: "Abs · Obliques · Lower back",
    kcalPerMin: 6,
    exercises: [
      { name: "Crunches", sets: 3, reps: 20, rest: 30 },
      { name: "Plank", sets: 3, seconds: 40, rest: 30 },
      { name: "Russian Twists", sets: 3, reps: 24, rest: 30 },
      { name: "Leg Raises", sets: 3, reps: 15, rest: 30 },
      { name: "Bird Dog", sets: 3, reps: 12, rest: 30 },
    ],
  },
  {
    id: "run-intervals",
    name: "Run Intervals",
    category: "Cardio",
    level: "Beginner",
    minutes: 25,
    focus: "Endurance builder",
    kcalPerMin: 10,
    exercises: [
      { name: "Warm-Up Jog", sets: 1, seconds: 300, rest: 0 },
      { name: "Fast Run", sets: 5, seconds: 60, rest: 90 },
      { name: "Cool-Down Walk", sets: 1, seconds: 180, rest: 0 },
    ],
  },
  {
    id: "mobility-flow",
    name: "Mobility Flow",
    category: "Mobility",
    level: "Beginner",
    minutes: 15,
    focus: "Hips · Spine · Shoulders",
    kcalPerMin: 3,
    exercises: [
      { name: "Cat-Cow", sets: 2, reps: 10, rest: 10 },
      { name: "World's Greatest Stretch", sets: 2, reps: 6, rest: 10 },
      { name: "90/90 Hip Switch", sets: 2, reps: 8, rest: 10 },
      { name: "Thread the Needle", sets: 2, reps: 8, rest: 10 },
      { name: "Deep Squat Hold", sets: 2, seconds: 45, rest: 10 },
    ],
  },
];

export const workoutById = (id: string) => WORKOUTS.find((w) => w.id === id);

/** Rotating weekly plan, indexed by Date.getDay() (0 = Sunday). */
export const WEEK_PLAN: string[] = [
  "mobility-flow",
  "upper-strength",
  "hiit-cardio",
  "lower-strength",
  "core-crusher",
  "full-body-blast",
  "run-intervals",
];

export type MealPreset = Omit<Meal, "id" | "date">;

export const MEAL_PRESETS: MealPreset[] = [
  { name: "Chicken Bowl", calories: 520, protein: 42, carbs: 48, fat: 14 },
  { name: "Greek Yogurt & Berries", calories: 210, protein: 20, carbs: 24, fat: 4 },
  { name: "Protein Shake", calories: 180, protein: 30, carbs: 8, fat: 3 },
  { name: "Oatmeal & Banana", calories: 340, protein: 11, carbs: 62, fat: 6 },
  { name: "Salmon & Rice", calories: 610, protein: 40, carbs: 55, fat: 24 },
  { name: "Egg Scramble (3 eggs)", calories: 290, protein: 21, carbs: 3, fat: 22 },
];

export interface Rival {
  name: string;
  weekly: number;
}

export const RIVALS: Rival[] = [
  { name: "AlexFit", weekly: 640 },
  { name: "GymKing", weekly: 590 },
  { name: "Dreamer", weekly: 480 },
  { name: "BeastMode", weekly: 450 },
  { name: "FitLegend", weekly: 410 },
  { name: "IronMia", weekly: 330 },
  { name: "SprintSam", weekly: 260 },
  { name: "LiftLily", weekly: 190 },
];

export const PREMIUM_FEATURES = [
  "Advanced AI training plans",
  "Detailed nutrition plans",
  "Exclusive challenges",
  "Ad-free experience",
  "Priority support",
];
