import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { randomUUID } from "node:crypto";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.join(__dirname, "..", "data.json");

export interface Company {
  id: string;
  name: string;
  joinCode: string;
  createdAt: string;
}

export interface User {
  id: string;
  name: string;
  role: "owner" | "employee";
  hourlyRate: number;
  createdAt: string;
  active: boolean;
  title: string;
}

export interface TimeEntry {
  id: string;
  userId: string;
  clockIn: string;
  clockOut: string | null;
  notes: string;
}

export interface Job {
  id: string;
  title: string;
  description: string;
  category: string;
  payType: "fixed" | "hourly";
  payAmount: number;
  assignedTo: string[];
  status: "open" | "in_progress" | "completed";
  priority: "normal" | "high" | "urgent";
  createdAt: string;
  completedAt: string | null;
  dueDate: string | null;
}

export interface Payment {
  id: string;
  userId: string;
  amount: number;
  type: "payroll" | "bonus" | "job";
  description: string;
  jobId?: string;
  paidAt: string;
  periodStart?: string;
  periodEnd?: string;
}

interface DbData {
  company: Company | null;
  users: User[];
  timeEntries: TimeEntry[];
  jobs: Job[];
  payments: Payment[];
}

export interface UserWithStats extends User {
  clockedIn: boolean;
  todayHours: number;
  weekHours: number;
  monthHours: number;
  weekPay: number;
  monthPay: number;
  totalPaid: number;
  totalOwed: number;
}

function read(): DbData {
  try {
    if (!fs.existsSync(DB_PATH)) return { company: null, users: [], timeEntries: [], jobs: [], payments: [] };
    const raw = JSON.parse(fs.readFileSync(DB_PATH, "utf-8")) as Partial<DbData>;
    return {
      company: raw.company ?? null,
      users: raw.users ?? [],
      timeEntries: raw.timeEntries ?? [],
      jobs: raw.jobs ?? [],
      payments: raw.payments ?? [],
    };
  } catch {
    return { company: null, users: [], timeEntries: [], jobs: [], payments: [] };
  }
}

function write(data: DbData): void {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
}

function hoursFor(entry: TimeEntry): number {
  const start = new Date(entry.clockIn).getTime();
  const end = entry.clockOut ? new Date(entry.clockOut).getTime() : Date.now();
  return (end - start) / (1000 * 60 * 60);
}

function weekStart(): number {
  const d = new Date(); d.setHours(0,0,0,0); d.setDate(d.getDate() - d.getDay()); return d.getTime();
}
function monthStart(): number {
  const d = new Date(); d.setHours(0,0,0,0); d.setDate(1); return d.getTime();
}
function dayStart(): number {
  const d = new Date(); d.setHours(0,0,0,0); return d.getTime();
}

function enrichUser(user: User, entries: TimeEntry[], payments: Payment[]): UserWithStats {
  const ws = weekStart(), ms = monthStart(), ds = dayStart();
  let todayHours = 0, weekHours = 0, monthHours = 0, clockedIn = false;
  for (const e of entries.filter(e => e.userId === user.id)) {
    const start = new Date(e.clockIn).getTime();
    if (e.clockOut === null) clockedIn = true;
    const h = hoursFor(e);
    if (start >= ds) todayHours += h;
    if (start >= ws) weekHours += h;
    if (start >= ms) monthHours += h;
  }
  const totalPaid = payments.filter(p => p.userId === user.id).reduce((s, p) => s + p.amount, 0);
  const weekPay = weekHours * user.hourlyRate;
  const monthPay = monthHours * user.hourlyRate;
  return { ...user, clockedIn, todayHours, weekHours, monthHours, weekPay, monthPay, totalPaid, totalOwed: monthPay - totalPaid };
}

export interface DailyHours {
  date: string;
  label: string;
  hours: number;
}

export const db = {
  isSetup: (): boolean => read().company !== null,

  setup(companyName: string, ownerName: string): { company: Company; user: User } {
    const data = read();
    const company: Company = { id: randomUUID(), name: companyName, joinCode: Math.random().toString(36).substring(2,8).toUpperCase(), createdAt: new Date().toISOString() };
    const user: User = { id: randomUUID(), name: ownerName, role: "owner", hourlyRate: 0, createdAt: new Date().toISOString(), active: true, title: "Owner" };
    data.company = company; data.users = [user];
    write(data); return { company, user };
  },

  getCompany: (): Company | null => read().company,
  getUsers: (): User[] => read().users,
  getUserById: (id: string): User | null => read().users.find(u => u.id === id) ?? null,
  getUserByName: (name: string): User | null => read().users.find(u => u.name.toLowerCase() === name.toLowerCase()) ?? null,

  addUser(name: string, hourlyRate: number, title: string): User {
    const data = read();
    const user: User = { id: randomUUID(), name, role: "employee", hourlyRate, createdAt: new Date().toISOString(), active: true, title };
    data.users.push(user); write(data); return user;
  },

  updateUser(id: string, updates: Partial<Pick<User,"name"|"hourlyRate"|"active"|"title">>): User | null {
    const data = read();
    const i = data.users.findIndex(u => u.id === id);
    if (i === -1) return null;
    data.users[i] = { ...data.users[i], ...updates }; write(data); return data.users[i];
  },

  joinByCode(code: string, name: string): User | null {
    const data = read();
    if (!data.company || data.company.joinCode !== code.toUpperCase()) return null;
    const existing = data.users.find(u => u.name.toLowerCase() === name.toLowerCase());
    if (existing) return existing;
    const user: User = { id: randomUUID(), name, role: "employee", hourlyRate: 0, createdAt: new Date().toISOString(), active: true, title: "Employee" };
    data.users.push(user); write(data); return user;
  },

  clockIn(userId: string, notes: string): TimeEntry | null {
    const data = read();
    if (data.timeEntries.find(e => e.userId === userId && e.clockOut === null)) return null;
    const entry: TimeEntry = { id: randomUUID(), userId, clockIn: new Date().toISOString(), clockOut: null, notes };
    data.timeEntries.push(entry); write(data); return entry;
  },

  clockOut(userId: string): TimeEntry | null {
    const data = read();
    const i = data.timeEntries.findIndex(e => e.userId === userId && e.clockOut === null);
    if (i === -1) return null;
    data.timeEntries[i].clockOut = new Date().toISOString(); write(data); return data.timeEntries[i];
  },

  getTimeEntries: (userId?: string): TimeEntry[] => {
    const data = read();
    return userId ? data.timeEntries.filter(e => e.userId === userId) : data.timeEntries;
  },

  getOpenEntry: (userId: string): TimeEntry | null =>
    read().timeEntries.find(e => e.userId === userId && e.clockOut === null) ?? null,

  getUsersWithStats(): UserWithStats[] {
    const data = read();
    return data.users.map(u => enrichUser(u, data.timeEntries, data.payments));
  },

  getUserWithStats(userId: string): UserWithStats | null {
    const data = read();
    const user = data.users.find(u => u.id === userId);
    return user ? enrichUser(user, data.timeEntries, data.payments) : null;
  },

  regenerateJoinCode(): string | null {
    const data = read();
    if (!data.company) return null;
    data.company.joinCode = Math.random().toString(36).substring(2,8).toUpperCase();
    write(data); return data.company.joinCode;
  },

  // ── Jobs ──

  getJobs(): Job[] { return read().jobs; },

  getJob(id: string): Job | null { return read().jobs.find(j => j.id === id) ?? null; },

  createJob(job: Omit<Job,"id"|"createdAt"|"completedAt">): Job {
    const data = read();
    const newJob: Job = { ...job, id: randomUUID(), createdAt: new Date().toISOString(), completedAt: null };
    data.jobs.push(newJob); write(data); return newJob;
  },

  updateJob(id: string, updates: Partial<Omit<Job,"id"|"createdAt">>): Job | null {
    const data = read();
    const i = data.jobs.findIndex(j => j.id === id);
    if (i === -1) return null;
    if (updates.status === "completed" && !data.jobs[i].completedAt) {
      updates.completedAt = new Date().toISOString();
    }
    data.jobs[i] = { ...data.jobs[i], ...updates }; write(data); return data.jobs[i];
  },

  deleteJob(id: string): boolean {
    const data = read();
    const i = data.jobs.findIndex(j => j.id === id);
    if (i === -1) return false;
    data.jobs.splice(i, 1); write(data); return true;
  },

  // ── Payments ──

  getPayments(userId?: string): Payment[] {
    const data = read();
    const pays = userId ? data.payments.filter(p => p.userId === userId) : data.payments;
    return [...pays].sort((a, b) => new Date(b.paidAt).getTime() - new Date(a.paidAt).getTime());
  },

  addPayment(payment: Omit<Payment,"id"|"paidAt">): Payment {
    const data = read();
    const p: Payment = { ...payment, id: randomUUID(), paidAt: new Date().toISOString() };
    data.payments.push(p); write(data); return p;
  },

  // ── Analytics ──

  getDailyHours(userId?: string, days = 7): DailyHours[] {
    const data = read();
    const entries = userId ? data.timeEntries.filter(e => e.userId === userId) : data.timeEntries;
    const result: DailyHours[] = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i); d.setHours(0,0,0,0);
      const next = new Date(d); next.setDate(next.getDate() + 1);
      const hours = entries
        .filter(e => new Date(e.clockIn) >= d && new Date(e.clockIn) < next)
        .reduce((s, e) => s + hoursFor(e), 0);
      result.push({
        date: d.toISOString().split("T")[0],
        label: d.toLocaleDateString(undefined, { weekday: "short" }),
        hours,
      });
    }
    return result;
  },

  getWeeklyPayroll(weeks = 6): Array<{ label: string; amount: number }> {
    const data = read();
    const result = [];
    for (let i = weeks - 1; i >= 0; i--) {
      const end = new Date(); end.setHours(23,59,59,999); end.setDate(end.getDate() - end.getDay() - i * 7 + 6);
      const start = new Date(end); start.setDate(start.getDate() - 6); start.setHours(0,0,0,0);
      const amount = data.payments
        .filter(p => { const d = new Date(p.paidAt); return d >= start && d <= end; })
        .reduce((s, p) => s + p.amount, 0);
      result.push({ label: `W${weeks - i}`, amount });
    }
    return result;
  },
};
