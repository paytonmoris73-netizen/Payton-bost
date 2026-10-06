import type { Company, User, UserWithStats, TimeEntry, Job, Payment, DailyHours, Expense, Announcement, ActivityEvent, Shift, LeaveRequest, AppNotification, EmployeeNote, PublicUser, Client, Invoice, InvoiceItem, Task, Insight, CompanySettings, GeoPoint, ChatChannel, ChatMessage, ReportData, TimeRequest } from "./types";
import { cacheGet, cacheSet, cacheInvalidate } from "./cache";

const TOKEN_KEY = "workbase_token";
let onUnauthorized: (() => void) | null = null;

export const auth = {
  getToken: (): string | null => { try { return localStorage.getItem(TOKEN_KEY); } catch { return null; } },
  setToken: (t: string) => { try { localStorage.setItem(TOKEN_KEY, t); } catch { /* storage unavailable */ } },
  clear: () => { try { localStorage.removeItem(TOKEN_KEY); } catch { /* storage unavailable */ } cacheInvalidate(""); },
  onUnauthorized: (fn: () => void) => { onUnauthorized = fn; },
};

async function req<T>(url: string, options?: RequestInit): Promise<T> {
  const token = auth.getToken();
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(url, { ...options, headers });
  if (res.status === 401 && token && !url.startsWith("/api/auth/login")) {
    auth.clear();
    onUnauthorized?.();
  }
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

  setup: (companyName: string, ownerName: string, pin: string) =>
    req<{ company: Company; user: User; token: string }>("/api/setup", { method: "POST", body: JSON.stringify({ companyName, ownerName, pin }) }),

  getLoginUsers: () => req<PublicUser[]>("/api/auth/users"),
  login: (name: string, pin: string, code?: string) => req<{ user: User; token: string }>("/api/auth/login", { method: "POST", body: JSON.stringify({ name, pin, code }) }),
  join: (code: string, name: string, pin: string) => req<{ user: User; token: string }>("/api/auth/join", { method: "POST", body: JSON.stringify({ code, name, pin }) }),
  authMe: () => req<UserWithStats>("/api/auth/me"),
  logout: () => req<{ ok: boolean }>("/api/auth/logout", { method: "POST" }),
  changePin: (currentPin: string, newPin: string) => req<{ ok: boolean }>("/api/auth/pin", { method: "POST", body: JSON.stringify({ currentPin, newPin }) }),

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

  clockIn: (userId: string, notes?: string, jobId?: string, location?: GeoPoint) => {
    cacheInvalidate("time:"); cacheInvalidate("team"); cacheInvalidate("me:");
    return req<TimeEntry>("/api/time/clock-in", { method: "POST", body: JSON.stringify({ userId, notes, jobId, location }) });
  },

  startBreak: (entryId: string) => {
    cacheInvalidate("time:"); cacheInvalidate("me:");
    return req<TimeEntry>(`/api/time/${entryId}/break/start`, { method: "POST" });
  },

  endBreak: (entryId: string) => {
    cacheInvalidate("time:"); cacheInvalidate("me:");
    return req<TimeEntry>(`/api/time/${entryId}/break/end`, { method: "POST" });
  },

  clockOut: (userId: string, notes?: string, location?: GeoPoint) => {
    cacheInvalidate("time:"); cacheInvalidate("team"); cacheInvalidate("me:");
    return req<TimeEntry>("/api/time/clock-out", { method: "POST", body: JSON.stringify({ userId, notes, location }) });
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

  createJob: (job: { title: string; description: string; category: string; payType: string; payAmount: number; assignedTo: string[]; priority: string; dueDate: string | null; clientId?: string }) => {
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

  // ── Shifts ──
  getShifts: (userId?: string) =>
    cached(`shifts:${userId ?? "all"}`, () => req<Shift[]>(`/api/shifts${userId ? `?userId=${encodeURIComponent(userId)}` : ""}`)),
  refreshShifts: (userId?: string) => {
    cacheInvalidate("shifts:");
    const url = `/api/shifts${userId ? `?userId=${encodeURIComponent(userId)}` : ""}`;
    return req<Shift[]>(url).then(d => { cacheSet(`shifts:${userId ?? "all"}`, d); return d; });
  },
  createShift: (s: { userId: string; date: string; startTime: string; endTime: string; title: string; note: string }) => {
    cacheInvalidate("shifts:"); return req<Shift>("/api/shifts", { method: "POST", body: JSON.stringify(s) });
  },
  updateShift: (id: string, updates: Partial<Omit<Shift,"id"|"createdAt">>) => {
    cacheInvalidate("shifts:"); return req<Shift>(`/api/shifts/${id}`, { method: "PATCH", body: JSON.stringify(updates) });
  },
  deleteShift: (id: string) => {
    cacheInvalidate("shifts:"); return req<{ ok: boolean }>(`/api/shifts/${id}`, { method: "DELETE" });
  },

  // ── Leave ──
  getLeaveRequests: (userId?: string) =>
    req<LeaveRequest[]>(`/api/leave${userId ? `?userId=${encodeURIComponent(userId)}` : ""}`),
  createLeaveRequest: (r: { userId: string; startDate: string; endDate: string; type: string; reason: string }) =>
    req<LeaveRequest>("/api/leave", { method: "POST", body: JSON.stringify(r) }),
  updateLeaveRequest: (id: string, status: "approved" | "denied") =>
    req<LeaveRequest>(`/api/leave/${id}`, { method: "PATCH", body: JSON.stringify({ status }) }),
  deleteLeaveRequest: (id: string) =>
    req<{ ok: boolean }>(`/api/leave/${id}`, { method: "DELETE" }),

  // ── Notifications ──
  getNotifications: (userId: string) =>
    req<AppNotification[]>(`/api/notifications?userId=${encodeURIComponent(userId)}`),
  markNotificationRead: (id: string) =>
    req<{ ok: boolean }>(`/api/notifications/${id}/read`, { method: "PATCH" }),
  markAllNotificationsRead: (userId: string) =>
    req<{ ok: boolean }>("/api/notifications/read-all", { method: "POST", body: JSON.stringify({ userId }) }),

  // ── Employee Notes ──
  resetEmployeePin: (userId: string) => req<{ ok: boolean }>(`/api/team/${encodeURIComponent(userId)}/reset-pin`, { method: "POST" }),

  getEmployeeNotes: (userId: string) =>
    req<EmployeeNote[]>(`/api/team/${encodeURIComponent(userId)}/notes`),
  addEmployeeNote: (userId: string, text: string, authorId: string) =>
    req<EmployeeNote>(`/api/team/${encodeURIComponent(userId)}/notes`, { method: "POST", body: JSON.stringify({ text, authorId }) }),
  deleteEmployeeNote: (noteId: string) =>
    req<{ ok: boolean }>(`/api/team/notes/${noteId}`, { method: "DELETE" }),

  // ── Tasks ──
  getTasks: (userId?: string) => req<Task[]>(`/api/tasks${userId ? `?userId=${encodeURIComponent(userId)}` : ""}`),
  createTask: (t: { title: string; description: string; assignedTo: string; dueDate: string | null }) =>
    req<Task>("/api/tasks", { method: "POST", body: JSON.stringify(t) }),
  updateTask: (id: string, updates: Partial<Pick<Task, "title" | "description" | "assignedTo" | "dueDate" | "done">>) =>
    req<Task>(`/api/tasks/${id}`, { method: "PATCH", body: JSON.stringify(updates) }),
  deleteTask: (id: string) => req<{ ok: boolean }>(`/api/tasks/${id}`, { method: "DELETE" }),

  // ── Clients ──
  getClients: () => req<Client[]>("/api/clients"),
  createClient: (c: Omit<Client, "id" | "createdAt">) => req<Client>("/api/clients", { method: "POST", body: JSON.stringify(c) }),
  updateClient: (id: string, c: Partial<Omit<Client, "id" | "createdAt">>) => req<Client>(`/api/clients/${id}`, { method: "PATCH", body: JSON.stringify(c) }),
  deleteClient: (id: string) => req<{ ok: boolean }>(`/api/clients/${id}`, { method: "DELETE" }),

  // ── Invoices ──
  getInvoices: () => req<Invoice[]>("/api/invoices"),
  createInvoice: (i: { clientId: string; jobId?: string; items: InvoiceItem[]; taxRate: number; status: Invoice["status"]; issueDate: string; dueDate: string; notes: string }) =>
    req<Invoice>("/api/invoices", { method: "POST", body: JSON.stringify(i) }),
  updateInvoice: (id: string, updates: Partial<{ clientId: string; items: InvoiceItem[]; taxRate: number; status: Invoice["status"]; issueDate: string; dueDate: string; notes: string }>) =>
    req<Invoice>(`/api/invoices/${id}`, { method: "PATCH", body: JSON.stringify(updates) }),
  deleteInvoice: (id: string) => req<{ ok: boolean }>(`/api/invoices/${id}`, { method: "DELETE" }),

  // ── Settings / backup ──
  updateSettings: (settings: CompanySettings) => { cacheInvalidate("company"); return req<Company>("/api/company/settings", { method: "PUT", body: JSON.stringify(settings) }); },
  downloadBackup: () => req<unknown>("/api/backup"),

  // ── Shift marketplace ──
  claimShift: (id: string) => { cacheInvalidate("shifts:"); return req<Shift>(`/api/shifts/${id}/claim`, { method: "POST" }); },
  dropShift: (id: string) => { cacheInvalidate("shifts:"); return req<Shift>(`/api/shifts/${id}/drop`, { method: "POST" }); },
  decideDrop: (id: string, decision: "approve" | "deny") => { cacheInvalidate("shifts:"); return req<Shift>(`/api/shifts/${id}/drop/${decision}`, { method: "POST" }); },

  // ── Time corrections ──
  getTimeRequests: () => req<TimeRequest[]>("/api/time-requests"),
  createTimeRequest: (r: { clockIn: string; clockOut: string; reason: string }) => req<TimeRequest>("/api/time-requests", { method: "POST", body: JSON.stringify(r) }),
  reviewTimeRequest: (id: string, status: "approved" | "denied") => {
    cacheInvalidate("time:"); cacheInvalidate("team"); cacheInvalidate("me:"); cacheInvalidate("payroll");
    return req<TimeRequest>(`/api/time-requests/${id}`, { method: "PATCH", body: JSON.stringify({ status }) });
  },

  // ── Chat ──
  getChannels: () => req<ChatChannel[]>("/api/chat/channels"),
  getMessages: (channel: string) => req<ChatMessage[]>(`/api/chat/${encodeURIComponent(channel)}`),
  sendMessage: (channel: string, text: string) => req<ChatMessage>(`/api/chat/${encodeURIComponent(channel)}`, { method: "POST", body: JSON.stringify({ text }) }),
  markChannelRead: (channel: string) => req<{ ok: boolean }>(`/api/chat/${encodeURIComponent(channel)}/read`, { method: "POST" }),

  // ── Reports ──
  getReport: (from: string, to: string) => req<ReportData>(`/api/reports?from=${from}&to=${to}`),

  // ── Insights ──
  getInsights: () => req<Insight[]>("/api/insights"),

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
