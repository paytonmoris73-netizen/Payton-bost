/** Local-time YYYY-MM-DD for a Date. */
export const dayKey = (d: Date = new Date()): string => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

export const daysAgo = (n: number): string => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return dayKey(d);
};

export const fmtTime = (totalSeconds: number): string => {
  const s = Math.max(0, Math.round(totalSeconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
};

export const fmtNum = (n: number): string => n.toLocaleString("en-US");

export const uid = (): string => Math.random().toString(36).slice(2, 10) + Date.now().toString(36);

export const greeting = (): string => {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
};

/** Consecutive days (ending today, or yesterday) with at least one workout. */
export const computeStreak = (dates: string[]): number => {
  const set = new Set(dates);
  let streak = 0;
  let i = set.has(daysAgo(0)) ? 0 : 1;
  while (set.has(daysAgo(i))) {
    streak++;
    i++;
  }
  return streak;
};

/** Points: 100 per workout + 5 per active minute, for logs in the last `days` days. */
export const pointsFor = (logs: { date: string; minutes: number }[], days: number): number => {
  const cutoff = daysAgo(days - 1);
  return logs.filter((l) => l.date >= cutoff).reduce((sum, l) => sum + 100 + l.minutes * 5, 0);
};

type LogWithLifts = { date: string; lifts?: { exercise: string; weight: number; reps: number }[] };

/** Heaviest weight lifted per exercise, with the date it was set. */
export const topPrs = (logs: LogWithLifts[], limit = 5): { exercise: string; weight: number; reps: number; date: string }[] => {
  const best = new Map<string, { exercise: string; weight: number; reps: number; date: string }>();
  for (const l of logs) {
    for (const x of l.lifts ?? []) {
      const cur = best.get(x.exercise);
      if (!cur || x.weight > cur.weight) best.set(x.exercise, { ...x, date: l.date });
    }
  }
  return [...best.values()].sort((a, b) => b.weight - a.weight).slice(0, limit);
};

/** Most recent logged weight for an exercise, or 0. */
export const lastWeight = (logs: LogWithLifts[], exercise: string): number => {
  for (let i = logs.length - 1; i >= 0; i--) {
    const hit = [...(logs[i].lifts ?? [])].reverse().find((x) => x.exercise === exercise);
    if (hit) return hit.weight;
  }
  return 0;
};
