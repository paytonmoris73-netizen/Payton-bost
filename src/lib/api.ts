import type { Company, User, UserWithStats, TimeEntry, Job, Payment, DailyHours, Expense, Announcement, ActivityEvent } from "./types";
import { cacheGet, cacheSet, cacheInvalidate } from "./cache";

async function req<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, { headers: { "Content-Type": "application/json" }, ...options });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Request failed" })) as { error: string };
    throw new Error(err.error ?? "Request failed");
  }
  return res.json() as Promise<T>;
}

// Stale-while-revalidate: returns cached data instantly, updates cache in background.
async function cached<T>(key: string, fetcher: () => Promise<T>): Promise<T> {
  const hit = cacheGet<T>(key);
  if (hit !== undefined) {
    // Return cached immediately, refresh in background
    fetcher().then(d => cacheSet(key, d)).catch(() => {});
    return hit;
  }
  const data = await fetcher();
  cacheSet(key, data);
  return data;
}

export interface AnalyticsData {
  team: UserWithStats[];
  dailyHours: DailyHours[];
  weeklyPayroll: Array<{ label: string; amount: number }>;
  totalPaidOut: number;
}

export const api = {
  getStatus: () => req<{ setup: boolean }>("/api/status"),
  getCompany: () => cached("company", () => req<Company>("/api/company")),
  updateCompany: (name: string) => { cacheInvalidate("company"); return req<Company>("/api/company", { method: "PATCH", body: JSON.stringify({ name }) }); },

  setup: (companyName: string, ownerName: string) =>
    req<{ company: Company; user: User }>("/api/setup", { method: "POST", body: JSON.stringify({ companyName, ownerName }) }),

  login: (name: string) => req<User>("/api/auth/login", { method: "POST", body: JSON.stringify({ name }) }),
  join: (code: string, name: string) => req<User>("/api/auth/join", { method: "POST", body: JSON.stringify({ code, name }) }),

  getTeam: () => cached("team", () => req<UserWithStats[]>("/api/team")),
  refreshTeam: () => { cacheInvalidate("team"); return req<UserWithStats[]>("/api/team").then(d => { cacheSet("team", d); return d; }); },

  addEmployee: (name: string, hourlyRate: number, title: string) => {
    cacheInvalidate("team");
    return req<User>("/api/team", { method: "POST", body: JSON.stringify({ name, hourlyRate, title }) });
  },

  updateEmployee: (id: string, updates: Partial<{ name: string; hourlyRate: number; active: boolean; title: string }>) => {
    cacheInvalidate("team");
    return req<User>(`/api/team/${id}`, { method: "PATCH", body: JSON.stringify(updates) });
  },

  getTimeEntries: (userId?: string) =>
    cached(`time:${userId ?? "all"}`, () => req<TimeEntry[]>(`/api/time${userId ? `?userId=${encodeURIComponent(userId)}` : ""}`)),

  refreshTimeEntries: (userId?: string) => {
    cacheInvalidate(`time:${userId ?? "all"}`);
    return req<TimeEntry[]>(`/api/time${userId ? `?userId=${encodeURIComponent(userId)}` : ""}`).then(d => { cacheSet(`time:${userId ?? "all"}`, d); return d; });
  },

  clockIn: (userId: string, notes?: string) => {
    cacheInvalidate("time:"); cacheInvalidate("team"); cacheInvalidate("me:");
    return req<TimeEntry>("/api/time/clock-in", { method: "POST", body: JSON.stringify({ userId, notes }) });
  },

  clockOut: (userId: string, notes?: string) => {
    cacheInvalidate("time:"); cacheInvalidate("team"); cacheInvalidate("me:");
    return req<TimeEntry>("/api/time/clock-out", { method: "POST", body: JSON.stringify({ userId, notes }) });
  },

  updateTimeEntry: (id: string, updates: { clockIn?: string; clockOut?: string | null; notes?: string }) => {
    cacheInvalidate("time:"); cacheInvalidate("team"); cacheInvalidate("me:");
    return req<TimeEntry>(`/api/time/${id}`, { method: "PATCH", body: JSON.stringify(updates) });
  },

  deleteTimeEntry: (id: string) => {
    cacheInvalidate("time:");
    return req<{ ok: boolean }>(`/api/time/${id}`, { method: "DELETE" });
  },

  getTimeStatus: (userId: string) =>
    req<{ clocked: boolean; entry: TimeEntry | null }>(`/api/time/status?userId=${encodeURIComponent(userId)}`),

  getPayroll: () => cached("payroll", () => req<UserWithStats[]>("/api/payroll")),

  getMe: (userId: string) =>
    cached(`me:${userId}`, () => req<UserWithStats>(`/api/me/${encodeURIComponent(userId)}`)),

  refreshMe: (userId: string) => {
    cacheInvalidate(`me:${userId}`);
    return req<UserWithStats>(`/api/me/${encodeURIComponent(userId)}`).then(d => { cacheSet(`me:${userId}`, d); return d; });
  },

  regenerateJoinCode: () => req<{ joinCode: string }>("/api/company/regenerate-code", { method: "POST" }),

  // ── Jobs ──
  getJobs: (userId?: string) =>
    cached(`jobs:${userId ?? "all"}`, () => req<Job[]>(`/api/jobs${userId ? `?userId=${encodeURIComponent(userId)}` : ""}`)),

  refreshJobs: (userId?: string) => {
    cacheInvalidate("jobs:");
    const url = `/api/jobs${userId ? `?userId=${encodeURIComponent(userId)}` : ""}`;
    return req<Job[]>(url).then(d => { cacheSet(`jobs:${userId ?? "all"}`, d); return d; });
  },

  createJob: (job: { title: string; description: string; category: string; payType: string; payAmount: number; assignedTo: string[]; priority: string; dueDate: string | null }) => {
    cacheInvalidate("jobs:");
    return req<Job>("/api/jobs", { method: "POST", body: JSON.stringify(job) });
  },

  updateJob: (id: string, updates: Partial<Job>) => {
    cacheInvalidate("jobs:");
    return req<Job>(`/api/jobs/${id}`, { method: "PATCH", body: JSON.stringify(updates) });
  },

  deleteJob: (id: string) => {
    cacheInvalidate("jobs:");
    return req<{ ok: boolean }>(`/api/jobs/${id}`, { method: "DELETE" });
  },

  // ── Payments ──
  getPayments: (userId?: string) =>
    cached(`payments:${userId ?? "all"}`, () => req<Payment[]>(`/api/payments${userId ? `?userId=${encodeURIComponent(userId)}` : ""}`)),

  refreshPayments: (userId?: string) => {
    cacheInvalidate("payments:");
    const url = `/api/payments${userId ? `?userId=${encodeURIComponent(userId)}` : ""}`;
    return req<Payment[]>(url).then(d => { cacheSet(`payments:${userId ?? "all"}`, d); return d; });
  },

  addPayment: (p: { userId: string; amount: number; type: string; description: string; jobId?: string; periodStart?: string; periodEnd?: string }) => {
    cacheInvalidate("payments:"); cacheInvalidate("payroll"); cacheInvalidate("team"); cacheInvalidate("me:");
    return req<Payment>("/api/payments", { method: "POST", body: JSON.stringify(p) });
  },

  deletePayment: (id: string) => {
    cacheInvalidate("payments:"); cacheInvalidate("payroll"); cacheInvalidate("team"); cacheInvalidate("me:");
    return req<{ ok: boolean }>(`/api/payments/${id}`, { method: "DELETE" });
  },

  bulkPayroll: (userIds?: string[]) => {
    cacheInvalidate("payments:"); cacheInvalidate("payroll"); cacheInvalidate("team"); cacheInvalidate("me:");
    return req<{ paid: number; payments: Payment[] }>("/api/payroll/bulk", { method: "POST", body: JSON.stringify({ userIds }) });
  },

  // ── Expenses ──
  getExpenses: () => cached("expenses", () => req<Expense[]>("/api/expenses")),
  refreshExpenses: () => { cacheInvalidate("expenses"); return req<Expense[]>("/api/expenses").then(d => { cacheSet("expenses", d); return d; }); },
  createExpense: (e: Omit<Expense,"id"|"createdAt">) => { cacheInvalidate("expenses"); return req<Expense>("/api/expenses", { method: "POST", body: JSON.stringify(e) }); },
  updateExpense: (id: string, updates: Partial<Omit<Expense,"id"|"createdAt">>) => { cacheInvalidate("expenses"); return req<Expense>(`/api/expenses/${id}`, { method: "PATCH", body: JSON.stringify(updates) }); },
  deleteExpense: (id: string) => { cacheInvalidate("expenses"); return req<{ ok: boolean }>(`/api/expenses/${id}`, { method: "DELETE" }); },

  // ── Announcements ──
  getAnnouncements: () => cached("announcements", () => req<Announcement[]>("/api/announcements")),
  refreshAnnouncements: () => { cacheInvalidate("announcements"); return req<Announcement[]>("/api/announcements").then(d => { cacheSet("announcements", d); return d; }); },
  createAnnouncement: (a: { title: string; body: string; authorId: string; pinned?: boolean }) => { cacheInvalidate("announcements"); return req<Announcement>("/api/announcements", { method: "POST", body: JSON.stringify(a) }); },
  updateAnnouncement: (id: string, updates: Partial<Pick<Announcement,"pinned"|"title"|"body">>) => { cacheInvalidate("announcements"); return req<Announcement>(`/api/announcements/${id}`, { method: "PATCH", body: JSON.stringify(updates) }); },
  deleteAnnouncement: (id: string) => { cacheInvalidate("announcements"); return req<{ ok: boolean }>(`/api/announcements/${id}`, { method: "DELETE" }); },

  // ── Activity ──
  getActivity: () => req<ActivityEvent[]>("/api/activity"),

  // ── Analytics ──
  getAnalytics: () =>
    cached("analytics", () => req<AnalyticsData>("/api/analytics")),

  refreshAnalytics: () => {
    cacheInvalidate("analytics");
    return req<AnalyticsData>("/api/analytics").then(d => { cacheSet("analytics", d); return d; });
  },
};
