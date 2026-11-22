import { MEAL_PRESETS, WEEK_PLAN, workoutById } from "./data";
import { computeStreak, dayKey, topPrs } from "./lib";
import { allWorkouts, useApp } from "./store";
import type { ChatMessage, Measurement } from "./types";

export interface Macros {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface CoachContext {
  name: string;
  streak: number;
  goals: Macros;
  eaten: Macros;
  plannedToday: string;
  doneToday: boolean;
  recent: { date: string; name: string; minutes: number }[];
  body: { first: Measurement | null; last: Measurement | null };
  catalog: string[];
  prs: { exercise: string; weight: number; reps: number }[];
}

/** Snapshot of the user's data, sent along with each question. */
export function buildContext(): CoachContext {
  const s = useApp.getState();
  const today = dayKey();
  const meals = s.meals.filter((m) => m.date === today);
  const sum = (k: keyof Macros) => meals.reduce((n, m) => n + m[k], 0);
  const planned = workoutById(WEEK_PLAN[new Date().getDay()])!;
  const week = new Date();
  week.setDate(week.getDate() - 14);
  const since = dayKey(week);
  return {
    name: s.name,
    streak: computeStreak(s.logs.map((l) => l.date)),
    goals: { calories: s.calorieGoal, protein: s.proteinGoal, carbs: s.carbGoal, fat: s.fatGoal },
    eaten: { calories: sum("calories"), protein: sum("protein"), carbs: sum("carbs"), fat: sum("fat") },
    plannedToday: planned.name,
    doneToday: s.logs.some((l) => l.date === today && l.workoutId === planned.id),
    recent: s.logs
      .filter((l) => l.date >= since)
      .slice(-10)
      .map((l) => ({ date: l.date, name: l.name, minutes: l.minutes })),
    body: { first: s.measurements[0] ?? null, last: s.measurements[s.measurements.length - 1] ?? null },
    catalog: allWorkouts().map((w) => w.name),
    prs: topPrs(s.logs, 5).map(({ exercise, weight, reps }) => ({ exercise, weight, reps })),
  };
}

export interface CoachReply {
  text: string;
  source: "ai" | "local" | "error";
}

/** Ask the server-side AI coach; fall back to the offline coach if it isn't available. */
export async function askCoach(history: ChatMessage[], ctx: CoachContext): Promise<CoachReply> {
  // Fit the server's limits (16 messages, 1,500 chars each, 9,000 total): keep the newest
  // turns, trimming long replies, so one long answer can't break the rest of the chat.
  const messages: { role: ChatMessage["role"]; content: string }[] = [];
  let total = 0;
  for (const m of [...history].reverse()) {
    if (m.source === "error" || !m.content.trim()) continue;
    const content = m.content.slice(0, 1400);
    if (messages.length >= 12 || total + content.length > 8500) break;
    total += content.length;
    messages.unshift({ role: m.role, content });
  }
  while (messages.length && messages[0].role !== "user") messages.shift();

  try {
    const res = await fetch("/api/coach", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ messages, context: ctx }),
      signal: AbortSignal.timeout(30_000),
    });
    if (res.ok) {
      const data = (await res.json()) as { text?: string };
      if (data.text) return { text: data.text, source: "ai" };
    } else if (res.status === 429) {
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      return { text: data.error ?? "Too many requests. Try again in a minute.", source: "error" };
    }
  } catch {
    /* network error / not deployed: use the offline coach */
  }
  const last = [...history].reverse().find((m) => m.role === "user")?.content ?? "";
  return { text: localCoach(last, ctx), source: "local" };
}

/* ---------------- offline coach (rule-based, uses the same data) ---------------- */

const has = (q: string, re: RegExp) => re.test(q.toLowerCase());

export function localCoach(q: string, c: CoachContext): string {
  const first = c.name || "there";

  if (has(q, /\bsore|\bpain|hurt|injur|dizz|chest pain|chest tight|faint|can't breathe/)) {
    return "If something hurts sharply, feels wrong, or you feel dizzy, stop and rest. Pain that lingers or any chest symptoms deserve a doctor or physio, not another set. For normal muscle soreness, easy walking, Mobility Flow and good sleep help.";
  }

  if (has(q, /protein|eat|food|nutrition|calorie|meal|hungry|diet|macro/)) {
    const left = c.goals.calories - c.eaten.calories;
    const pLeft = Math.max(0, c.goals.protein - c.eaten.protein);
    const fits = MEAL_PRESETS.filter((m) => m.calories <= Math.max(left, 0)).sort((a, b) => b.protein / b.calories - a.protein / a.calories)[0];
    const lines = [
      `Today you're at ${c.eaten.calories} of ${c.goals.calories} kcal, with ${c.eaten.protein}g of ${c.goals.protein}g protein.`,
    ];
    if (left <= 0) lines.push("You've hit your calorie goal, so keep the rest of the day light and protein-forward.");
    else if (pLeft > 0 && fits) lines.push(`You still need about ${pLeft}g protein. ${fits.name} (${fits.calories} kcal, ${fits.protein}g protein) would fit.`);
    else lines.push(`You have ${left} kcal left to play with.`);
    return lines.join(" ");
  }

  if (has(q, /progress|weight|fat|muscle|result|body/)) {
    const { first: a, last: b } = c.body;
    if (!a || !b || a.date === b.date) return "Log a couple of body measurements on the Profile tab and I can tell you how you're trending.";
    const d = (k: "weight" | "bodyFat" | "muscle") => +(b[k] - a[k]).toFixed(1);
    return `Since ${a.date}: weight ${d("weight")} lbs, body fat ${d("bodyFat")}%, muscle ${d("muscle")} lbs. Consistent training plus enough protein is what keeps that moving the right way.`;
  }

  if (has(q, /motiv|tired|lazy|skip|can't|cant|excuse|bored|stuck/)) {
    const s = c.streak > 0 ? `You're on a ${c.streak}-day streak, don't break it. ` : "";
    return `${s}Do the 10-minute version: pick Core Crusher or Mobility Flow and just start. Starting is the hard part, and you can stop after one set if you really want to.`;
  }

  if (has(q, /\blift|\bpr\b|record|heavy|strength|bench|squat|deadlift/)) {
    if (!c.prs.length) return "Log the weight you use during a workout (there's a weight field on each set) and I'll track your personal records and tell you when to go heavier.";
    const list = c.prs.map((p) => `${p.exercise} ${p.weight} lbs`).join(", ");
    return `Your top lifts so far: ${list}. If the last set felt easy, add 5 lbs next time; if you hit every rep, that's the signal to progress.`;
  }

  if (has(q, /recover|rest|sleep|stretch|mobility/)) {
    return "Recovery is where gains happen. Aim for 7 to 9 hours of sleep, keep protein steady, and use a lighter day (Mobility Flow or an easy walk) after two hard sessions in a row.";
  }

  if (has(q, /workout|train|exercise|today|lift|cardio|plan|what should/)) {
    if (c.doneToday) return `Nice, ${first}, you've already done ${c.plannedToday} today. Take it easy now, or do Mobility Flow if you want something light.`;
    const recentNames = c.recent.slice(-3).map((r) => r.name);
    const tip = recentNames.length ? ` Your last sessions: ${recentNames.join(", ")}.` : "";
    return `Today's plan is ${c.plannedToday}.${tip} Warm up for 5 minutes, then go set by set and rest as the timer says.`;
  }

  return `Hi ${first}! I'm running in offline mode, so I can help with today's workout, nutrition targets, progress, recovery and motivation. Try one of those.`;
}
