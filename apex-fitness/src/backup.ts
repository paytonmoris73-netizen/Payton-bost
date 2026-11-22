import { PLANS, type CardBrand, type Payment, type PlanId, type Subscription } from "./payments";
import type { Category, Level, Lift, Meal, Measurement, Workout, WorkoutLog } from "./types";

export interface BackupData {
  name: string;
  subscription: Subscription | null;
  payments: Payment[];
  calorieGoal: number;
  proteinGoal: number;
  carbGoal: number;
  fatGoal: number;
  dailyActiveGoal: number;
  logs: WorkoutLog[];
  meals: Meal[];
  measurements: Measurement[];
  water: Record<string, number>;
  customWorkouts: Workout[];
}

export function exportBackup(s: BackupData): string {
  const data: BackupData = {
    name: s.name,
    subscription: s.subscription,
    payments: s.payments,
    calorieGoal: s.calorieGoal,
    proteinGoal: s.proteinGoal,
    carbGoal: s.carbGoal,
    fatGoal: s.fatGoal,
    dailyActiveGoal: s.dailyActiveGoal,
    logs: s.logs,
    meals: s.meals,
    measurements: s.measurements,
    water: s.water,
    customWorkouts: s.customWorkouts,
  };
  return JSON.stringify({ app: "apex-fitness", version: 1, exportedAt: new Date().toISOString(), data }, null, 2);
}

/* ---------- validation: a backup file is untrusted input ---------- */

const bad = (what: string): never => {
  throw new Error(`This doesn't look like a valid Lunor backup (${what}).`);
};
const isObj = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v);
const str = (v: unknown, what: string, max = 80): string => (typeof v === "string" && v.length <= max ? v : bad(what));
const num = (v: unknown, what: string, lo = -1e6, hi = 1e6): number =>
  typeof v === "number" && Number.isFinite(v) && v >= lo && v <= hi ? v : bad(what);
const date = (v: unknown, what: string): string => (typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : bad(what));
const list = (v: unknown, what: string, max: number): unknown[] => (Array.isArray(v) && v.length <= max ? v : bad(what));

const CATEGORIES: Category[] = ["Strength", "Cardio", "Mobility"];
const LEVELS: Level[] = ["Beginner", "Intermediate", "Advanced"];

function lift(v: unknown): Lift {
  if (!isObj(v)) return bad("lift");
  return { exercise: str(v.exercise, "lift name", 200), weight: num(v.weight, "lift weight", 0, 5000), reps: num(v.reps, "lift reps", 0, 1000) };
}

function log(v: unknown): WorkoutLog {
  if (!isObj(v)) return bad("workout log");
  return {
    id: str(v.id, "log id"),
    workoutId: str(v.workoutId, "log workout"),
    name: str(v.name, "log name", 200),
    date: date(v.date, "log date"),
    minutes: num(v.minutes, "log minutes", 0, 100000),
    calories: num(v.calories, "log calories", 0, 1000000),
    ...(v.lifts === undefined ? {} : { lifts: list(v.lifts, "lifts", 500).map(lift) }),
  };
}

function meal(v: unknown): Meal {
  if (!isObj(v)) return bad("meal");
  return {
    id: str(v.id, "meal id"),
    name: str(v.name, "meal name"),
    date: date(v.date, "meal date"),
    calories: num(v.calories, "meal calories", 0, 20000),
    protein: num(v.protein, "meal protein", 0, 2000),
    carbs: num(v.carbs, "meal carbs", 0, 2000),
    fat: num(v.fat, "meal fat", 0, 2000),
  };
}

function measurement(v: unknown): Measurement {
  if (!isObj(v)) return bad("measurement");
  return {
    date: date(v.date, "measurement date"),
    weight: num(v.weight, "weight", 0, 2000),
    bodyFat: num(v.bodyFat, "body fat", 0, 100),
    muscle: num(v.muscle, "muscle", 0, 2000),
  };
}

function workout(v: unknown): Workout {
  if (!isObj(v)) return bad("workout");
  const category = CATEGORIES.find((c) => c === v.category) ?? bad("workout category");
  const level = LEVELS.find((l) => l === v.level) ?? bad("workout level");
  return {
    id: str(v.id, "workout id"),
    name: str(v.name, "workout name", 40),
    category,
    level,
    minutes: num(v.minutes, "workout minutes", 1, 100000),
    focus: str(v.focus, "workout focus", 80),
    kcalPerMin: num(v.kcalPerMin, "workout kcal", 0, 50),
    custom: true,
    exercises: list(v.exercises, "exercises", 30).map((e) => {
      if (!isObj(e)) return bad("exercise");
      return {
        name: str(e.name, "exercise name", 40),
        sets: num(e.sets, "sets", 1, 20),
        rest: num(e.rest, "rest", 0, 600),
        ...(e.reps === undefined ? {} : { reps: num(e.reps, "reps", 1, 1000) }),
        ...(e.seconds === undefined ? {} : { seconds: num(e.seconds, "seconds", 1, 7200) }),
      };
    }),
  };
}

const BRANDS: CardBrand[] = ["Visa", "Mastercard", "Amex", "Discover", "Card"];
const plan = (v: unknown): PlanId => PLANS.find((p) => p.id === v)?.id ?? bad("plan");
const brand = (v: unknown): CardBrand => BRANDS.find((b) => b === v) ?? bad("card brand");
const last4 = (v: unknown): string => (typeof v === "string" && /^\d{4}$/.test(v) ? v : bad("card"));

function subscription(v: unknown): Subscription | null {
  if (v === undefined || v === null) return null;
  if (!isObj(v)) return bad("subscription");
  const status = v.status === "active" || v.status === "canceled" ? v.status : bad("subscription status");
  return { plan: plan(v.plan), status, startedOn: date(v.startedOn, "subscription start"), renewsOn: date(v.renewsOn, "renewal date"), brand: brand(v.brand), last4: last4(v.last4) };
}

function payment(v: unknown): Payment {
  if (!isObj(v)) return bad("payment");
  return { id: str(v.id, "payment id"), date: date(v.date, "payment date"), amount: num(v.amount, "payment amount", 0, 10000), plan: plan(v.plan), brand: brand(v.brand), last4: last4(v.last4) };
}

export function parseBackup(text: string): BackupData {
  if (text.length > 50_000_000) bad("file too large");
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return bad("not JSON");
  }
  if (!isObj(raw) || raw.app !== "apex-fitness" || !isObj(raw.data)) return bad("wrong file");
  const d = raw.data;
  const water = isObj(d.water) ? d.water : bad("water");
  const waterOut: Record<string, number> = {};
  for (const [k, v] of Object.entries(water)) waterOut[date(k, "water date")] = num(v, "water", 0, 100);

  return {
    name: str(d.name, "name", 24).trim() || "Athlete",
    // Older backups (before payments) have neither field.
    subscription: subscription(d.subscription),
    payments: d.payments === undefined ? [] : list(d.payments, "payments", 5000).map(payment),
    calorieGoal: num(d.calorieGoal, "calorie goal", 500, 10000),
    proteinGoal: num(d.proteinGoal, "protein goal", 0, 1000),
    carbGoal: num(d.carbGoal, "carb goal", 0, 2000),
    fatGoal: num(d.fatGoal, "fat goal", 0, 1000),
    dailyActiveGoal: num(d.dailyActiveGoal, "active goal", 1, 1000),
    logs: list(d.logs, "logs", 200000).map(log),
    meals: list(d.meals, "meals", 500000).map(meal),
    measurements: list(d.measurements, "measurements", 5000).map(measurement),
    water: waterOut,
    customWorkouts: list(d.customWorkouts, "custom workouts", 5000).map(workout),
  };
}
