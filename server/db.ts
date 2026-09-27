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

interface DbData {
  company: Company | null;
  users: User[];
  timeEntries: TimeEntry[];
}

export interface UserWithStats extends User {
  clockedIn: boolean;
  todayHours: number;
  weekHours: number;
  monthHours: number;
  weekPay: number;
  monthPay: number;
}

function read(): DbData {
  try {
    if (!fs.existsSync(DB_PATH)) return { company: null, users: [], timeEntries: [] };
    return JSON.parse(fs.readFileSync(DB_PATH, "utf-8")) as DbData;
  } catch {
    return { company: null, users: [], timeEntries: [] };
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
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - d.getDay());
  return d.getTime();
}

function monthStart(): number {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(1);
  return d.getTime();
}

function dayStart(): number {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

function enrichUser(user: User, entries: TimeEntry[]): UserWithStats {
  const userEntries = entries.filter(e => e.userId === user.id);
  const ws = weekStart();
  const ms = monthStart();
  const ds = dayStart();
  let todayHours = 0;
  let weekHours = 0;
  let monthHours = 0;
  let clockedIn = false;

  for (const entry of userEntries) {
    const start = new Date(entry.clockIn).getTime();
    if (entry.clockOut === null) clockedIn = true;
    const hours = hoursFor(entry);
    if (start >= ds) todayHours += hours;
    if (start >= ws) weekHours += hours;
    if (start >= ms) monthHours += hours;
  }

  return {
    ...user,
    clockedIn,
    todayHours,
    weekHours,
    monthHours,
    weekPay: weekHours * user.hourlyRate,
    monthPay: monthHours * user.hourlyRate,
  };
}

export const db = {
  isSetup(): boolean {
    return read().company !== null;
  },

  setup(companyName: string, ownerName: string): { company: Company; user: User } {
    const data = read();
    const company: Company = {
      id: randomUUID(),
      name: companyName,
      joinCode: Math.random().toString(36).substring(2, 8).toUpperCase(),
      createdAt: new Date().toISOString(),
    };
    const user: User = {
      id: randomUUID(),
      name: ownerName,
      role: "owner",
      hourlyRate: 0,
      createdAt: new Date().toISOString(),
      active: true,
      title: "Owner",
    };
    data.company = company;
    data.users = [user];
    write(data);
    return { company, user };
  },

  getCompany(): Company | null {
    return read().company;
  },

  getUsers(): User[] {
    return read().users;
  },

  getUserById(id: string): User | null {
    return read().users.find(u => u.id === id) ?? null;
  },

  getUserByName(name: string): User | null {
    return read().users.find(u => u.name.toLowerCase() === name.toLowerCase()) ?? null;
  },

  addUser(name: string, hourlyRate: number, title: string): User {
    const data = read();
    const user: User = {
      id: randomUUID(),
      name,
      role: "employee",
      hourlyRate,
      createdAt: new Date().toISOString(),
      active: true,
      title,
    };
    data.users.push(user);
    write(data);
    return user;
  },

  updateUser(id: string, updates: Partial<Pick<User, "name" | "hourlyRate" | "active" | "title">>): User | null {
    const data = read();
    const idx = data.users.findIndex(u => u.id === id);
    if (idx === -1) return null;
    data.users[idx] = { ...data.users[idx], ...updates };
    write(data);
    return data.users[idx];
  },

  joinByCode(code: string, name: string): User | null {
    const data = read();
    if (!data.company || data.company.joinCode !== code.toUpperCase()) return null;
    const existing = data.users.find(u => u.name.toLowerCase() === name.toLowerCase());
    if (existing) return existing;
    const user: User = {
      id: randomUUID(),
      name,
      role: "employee",
      hourlyRate: 0,
      createdAt: new Date().toISOString(),
      active: true,
      title: "Employee",
    };
    data.users.push(user);
    write(data);
    return user;
  },

  clockIn(userId: string, notes: string): TimeEntry | null {
    const data = read();
    const open = data.timeEntries.find(e => e.userId === userId && e.clockOut === null);
    if (open) return null;
    const entry: TimeEntry = {
      id: randomUUID(),
      userId,
      clockIn: new Date().toISOString(),
      clockOut: null,
      notes,
    };
    data.timeEntries.push(entry);
    write(data);
    return entry;
  },

  clockOut(userId: string): TimeEntry | null {
    const data = read();
    const idx = data.timeEntries.findIndex(e => e.userId === userId && e.clockOut === null);
    if (idx === -1) return null;
    data.timeEntries[idx].clockOut = new Date().toISOString();
    write(data);
    return data.timeEntries[idx];
  },

  getTimeEntries(userId?: string): TimeEntry[] {
    const data = read();
    if (userId) return data.timeEntries.filter(e => e.userId === userId);
    return data.timeEntries;
  },

  getOpenEntry(userId: string): TimeEntry | null {
    const data = read();
    return data.timeEntries.find(e => e.userId === userId && e.clockOut === null) ?? null;
  },

  getUsersWithStats(): UserWithStats[] {
    const data = read();
    return data.users.map(u => enrichUser(u, data.timeEntries));
  },

  getUserWithStats(userId: string): UserWithStats | null {
    const data = read();
    const user = data.users.find(u => u.id === userId);
    if (!user) return null;
    return enrichUser(user, data.timeEntries);
  },

  regenerateJoinCode(): string | null {
    const data = read();
    if (!data.company) return null;
    data.company.joinCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    write(data);
    return data.company.joinCode;
  },
};
