import type { AppState, CompletedSession } from "../state/AppContext";
import { localDateISO } from "../state/AppContext";
import type { Workout } from "../data/workouts";
import { WORKOUTS } from "../data/workouts";

export const greeting = (): string => {
  const h = new Date().getHours();
  if (h < 5) return "Burning the midnight oil";
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
};

export const totals = (sessions: CompletedSession[]) => ({
  workouts: sessions.length,
  calories: sessions.reduce((s, x) => s + x.calories, 0),
  minutes: sessions.reduce((s, x) => s + x.minutes, 0),
});

/** The last 7 days (oldest first) with minutes trained each day. */
export const lastSevenDays = (sessions: CompletedSession[]) => {
  const days: { iso: string; label: string; minutes: number; calories: number }[] = [];
  const names = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const iso = localDateISO(d);
    const todays = sessions.filter((s) => s.date === iso);
    days.push({
      iso,
      label: names[d.getDay()],
      minutes: todays.reduce((s, x) => s + x.minutes, 0),
      calories: todays.reduce((s, x) => s + x.calories, 0),
    });
  }
  return days;
};

export const thisWeek = (sessions: CompletedSession[]) => {
  const week = lastSevenDays(sessions);
  return {
    workouts: week.reduce(
      (n, d) => n + sessions.filter((s) => s.date === d.iso).length,
      0,
    ),
    minutes: week.reduce((s, d) => s + d.minutes, 0),
    calories: week.reduce((s, d) => s + d.calories, 0),
  };
};

/** Pick today's recommended workout from the user's goal and level, rotating daily. */
export const todaysWorkout = (state: AppState): Workout => {
  const { profile } = state;
  const pool = WORKOUTS.filter((w) => {
    if (w.pro && !state.premium) return false;
    if (!profile) return true;
    const levelOk =
      w.level === "all" ||
      w.level === profile.level ||
      (profile.level === "advanced" && w.level === "intermediate");
    return levelOk;
  });
  const sorted = [...pool].sort((a, b) => {
    const aGoal = profile && a.focus === profile.goal ? 0 : 1;
    const bGoal = profile && b.focus === profile.goal ? 0 : 1;
    return aGoal - bGoal || a.id.localeCompare(b.id);
  });
  const dayIndex = Math.floor(Date.now() / 86_400_000);
  const top = sorted.slice(0, Math.max(3, Math.min(5, sorted.length)));
  return top[dayIndex % top.length] ?? WORKOUTS[0];
};

export const recommended = (state: AppState, count = 4): Workout[] => {
  const today = todaysWorkout(state);
  const { profile } = state;
  return WORKOUTS.filter((w) => w.id !== today.id)
    .sort((a, b) => {
      const score = (w: Workout) => {
        let s = 0;
        if (profile && w.focus === profile.goal) s -= 2;
        if (profile && (w.level === profile.level || w.level === "all")) s -= 1;
        if (w.pro && !state.premium) s += 2;
        return s;
      };
      return score(a) - score(b) || a.id.localeCompare(b.id);
    })
    .slice(0, count);
};
