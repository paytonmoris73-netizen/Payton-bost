import type { Company, User, UserWithStats, TimeEntry } from "./types";

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Request failed" })) as { error: string };
    throw new Error(err.error ?? "Request failed");
  }
  return res.json() as Promise<T>;
}

export const api = {
  getStatus: () => request<{ setup: boolean }>("/api/status"),
  getCompany: () => request<Company>("/api/company"),

  setup: (companyName: string, ownerName: string) =>
    request<{ company: Company; user: User }>("/api/setup", {
      method: "POST",
      body: JSON.stringify({ companyName, ownerName }),
    }),

  login: (name: string) =>
    request<User>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ name }),
    }),

  join: (code: string, name: string) =>
    request<User>("/api/auth/join", {
      method: "POST",
      body: JSON.stringify({ code, name }),
    }),

  getTeam: () => request<UserWithStats[]>("/api/team"),

  addEmployee: (name: string, hourlyRate: number, title: string) =>
    request<User>("/api/team", {
      method: "POST",
      body: JSON.stringify({ name, hourlyRate, title }),
    }),

  updateEmployee: (id: string, updates: Partial<{ name: string; hourlyRate: number; active: boolean; title: string }>) =>
    request<User>(`/api/team/${id}`, {
      method: "PATCH",
      body: JSON.stringify(updates),
    }),

  getTimeEntries: (userId?: string) =>
    request<TimeEntry[]>(`/api/time${userId ? `?userId=${encodeURIComponent(userId)}` : ""}`),

  clockIn: (userId: string, notes?: string) =>
    request<TimeEntry>("/api/time/clock-in", {
      method: "POST",
      body: JSON.stringify({ userId, notes }),
    }),

  clockOut: (userId: string) =>
    request<TimeEntry>("/api/time/clock-out", {
      method: "POST",
      body: JSON.stringify({ userId }),
    }),

  getTimeStatus: (userId: string) =>
    request<{ clocked: boolean; entry: TimeEntry | null }>(`/api/time/status?userId=${encodeURIComponent(userId)}`),

  getPayroll: () => request<UserWithStats[]>("/api/payroll"),

  getMe: (userId: string) => request<UserWithStats>(`/api/me/${encodeURIComponent(userId)}`),

  regenerateJoinCode: () =>
    request<{ joinCode: string }>("/api/company/regenerate-code", { method: "POST" }),
};
