import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { randomUUID, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = process.env.DB_PATH || path.join(__dirname, "..", "data.json");

export interface Geofence {
  enabled: boolean;
  enforce: boolean;
  lat: number;
  lng: number;
  radiusM: number;
  label: string;
}

export interface CompanySettings {
  overtimeThreshold: number;
  overtimeMultiplier: number;
  geofence: Geofence;
}

export const DEFAULT_SETTINGS: CompanySettings = {
  overtimeThreshold: 40,
  overtimeMultiplier: 1.5,
  geofence: { enabled: false, enforce: false, lat: 0, lng: 0, radiusM: 200, label: "" },
};

export interface Company {
  id: string;
  name: string;
  joinCode: string;
  createdAt: string;
  settings: CompanySettings;
}

export interface GeoPoint { lat: number; lng: number; accuracy: number; }

export interface TimeEdit { at: string; by: string; byName: string; field: string; from: string | null; to: string | null; }

export interface Message {
  id: string;
  channel: string;
  senderId: string;
  text: string;
  createdAt: string;
}

export interface TimeRequest {
  id: string;
  userId: string;
  clockIn: string;
  clockOut: string;
  reason: string;
  status: "pending" | "approved" | "denied";
  createdAt: string;
  reviewedAt: string | null;
  entryId?: string;
}

export interface ChatRead { userId: string; channel: string; readAt: string; }

export interface User {
  id: string;
  name: string;
  role: "owner" | "employee";
  hourlyRate: number;
  createdAt: string;
  active: boolean;
  title: string;
  pinHash?: string;
}

export interface Session {
  token: string;
  userId: string;
  createdAt: string;
}

export interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  notes: string;
  createdAt: string;
}

export interface InvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
}

export interface Invoice {
  id: string;
  number: string;
  clientId: string;
  jobId?: string;
  items: InvoiceItem[];
  taxRate: number;
  status: "draft" | "sent" | "paid";
  issueDate: string;
  dueDate: string;
  notes: string;
  paidAt: string | null;
  createdAt: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  assignedTo: string;
  dueDate: string | null;
  done: boolean;
  doneAt: string | null;
  createdBy: string;
  createdAt: string;
}

export interface BreakEntry {
  breakStart: string;
  breakEnd: string | null;
}

export interface TimeEntry {
  id: string;
  userId: string;
  clockIn: string;
  clockOut: string | null;
  notes: string;
  jobId?: string;
  breaks: BreakEntry[];
  location?: GeoPoint;
  distanceM?: number;
  clockOutLocation?: GeoPoint;
  edits?: TimeEdit[];
}

export interface Shift {
  id: string;
  /** Empty string means an open shift anyone can claim. */
  userId: string;
  date: string;
  startTime: string;
  endTime: string;
  title: string;
  note: string;
  createdAt: string;
  dropRequested?: boolean;
}

export interface LeaveRequest {
  id: string;
  userId: string;
  startDate: string;
  endDate: string;
  type: "vacation" | "sick" | "personal" | "other";
  reason: string;
  status: "pending" | "approved" | "denied";
  createdAt: string;
  reviewedAt: string | null;
}

export interface AppNotification {
  id: string;
  userId: string;
  message: string;
  type: "info" | "success" | "warning";
  read: boolean;
  createdAt: string;
}

export interface EmployeeNote {
  id: string;
  userId: string;
  text: string;
  authorId: string;
  authorName: string;
  createdAt: string;
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
  clientId?: string;
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

export interface Expense {
  id: string;
  title: string;
  amount: number;
  category: string;
  vendor: string;
  notes: string;
  date: string;
  createdAt: string;
  recurring: boolean;
}

export interface Announcement {
  id: string;
  title: string;
  body: string;
  authorId: string;
  authorName: string;
  pinned: boolean;
  createdAt: string;
}

interface DbData {
  company: Company | null;
  users: User[];
  timeEntries: TimeEntry[];
  jobs: Job[];
  payments: Payment[];
  expenses: Expense[];
  announcements: Announcement[];
  shifts: Shift[];
  leaveRequests: LeaveRequest[];
  notifications: AppNotification[];
  employeeNotes: EmployeeNote[];
  sessions: Session[];
  clients: Client[];
  invoices: Invoice[];
  tasks: Task[];
  messages: Message[];
  chatReads: ChatRead[];
  timeRequests: TimeRequest[];
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
  weekOvertimeHours: number;
  ytdHours: number;
  ytdPay: number;
  totalEarned: number;
}

function emptyDb(): DbData {
  return { company: null, users: [], timeEntries: [], jobs: [], payments: [], expenses: [], announcements: [], shifts: [], leaveRequests: [], notifications: [], employeeNotes: [], sessions: [], clients: [], invoices: [], tasks: [], messages: [], chatReads: [], timeRequests: [] };
}

function read(): DbData {
  try {
    if (!fs.existsSync(DB_PATH)) return emptyDb();
    const raw = JSON.parse(fs.readFileSync(DB_PATH, "utf-8")) as Partial<DbData>;
    return {
      company: raw.company ? { ...raw.company, settings: { ...DEFAULT_SETTINGS, ...(raw.company.settings ?? {}), geofence: { ...DEFAULT_SETTINGS.geofence, ...(raw.company.settings?.geofence ?? {}) } } } : null,
      users: raw.users ?? [],
      timeEntries: (raw.timeEntries ?? []).map(e => ({ ...e, breaks: e.breaks ?? [] })),
      jobs: raw.jobs ?? [],
      payments: raw.payments ?? [],
      expenses: (raw.expenses ?? []).map(e => ({ ...e, recurring: e.recurring ?? false })),
      announcements: raw.announcements ?? [],
      shifts: raw.shifts ?? [],
      leaveRequests: raw.leaveRequests ?? [],
      notifications: raw.notifications ?? [],
      employeeNotes: raw.employeeNotes ?? [],
      sessions: raw.sessions ?? [],
      clients: raw.clients ?? [],
      invoices: raw.invoices ?? [],
      tasks: raw.tasks ?? [],
      messages: raw.messages ?? [],
      chatReads: raw.chatReads ?? [],
      timeRequests: raw.timeRequests ?? [],
    };
  } catch {
    return emptyDb();
  }
}

function write(data: DbData): void {
  const tmp = `${DB_PATH}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2));
  fs.renameSync(tmp, DB_PATH);
}

export function hashPin(pin: string): string {
  const salt = randomBytes(16).toString("hex");
  return `${salt}:${scryptSync(pin, salt, 32).toString("hex")}`;
}

export function verifyPin(pin: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const a = Buffer.from(hash, "hex");
  const b = scryptSync(pin, salt, 32);
  return a.length === b.length && timingSafeEqual(a, b);
}

function newJoinCode(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from(randomBytes(6), b => alphabet[b % alphabet.length]).join("");
}

export function invoiceTotal(inv: Pick<Invoice, "items" | "taxRate">): number {
  const sub = inv.items.reduce((s, i) => s + i.quantity * i.unitPrice, 0);
  return Math.round(sub * (1 + inv.taxRate / 100) * 100) / 100;
}

export function hoursFor(entry: TimeEntry): number {
  const start = new Date(entry.clockIn).getTime();
  const end = entry.clockOut ? new Date(entry.clockOut).getTime() : Date.now();
  let breakMs = 0;
  for (const b of (entry.breaks ?? [])) {
    const bs = new Date(b.breakStart).getTime();
    const be = b.breakEnd ? new Date(b.breakEnd).getTime() : Date.now();
    breakMs += be - bs;
  }
  return Math.max(0, (end - start - breakMs) / (1000 * 60 * 60));
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

function weekKey(iso: string): number {
  const d = new Date(iso); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() - d.getDay()); return d.getTime();
}

export interface LaborLine { entry: TimeEntry; hours: number; regularHours: number; overtimeHours: number; pay: number; }

/**
 * Splits each entry into regular and overtime hours. Overtime is any time past the
 * weekly threshold (weeks start Sunday), allocated in clock-in order.
 */
export function laborLines(entries: TimeEntry[], rateFor: (userId: string) => number, settings: CompanySettings = DEFAULT_SETTINGS): LaborLine[] {
  const sorted = [...entries].sort((a, b) => a.clockIn.localeCompare(b.clockIn));
  const used = new Map<string, number>();
  return sorted.map(entry => {
    const hours = hoursFor(entry);
    const key = `${entry.userId}:${weekKey(entry.clockIn)}`;
    const before = used.get(key) ?? 0;
    const regularHours = Math.max(0, Math.min(hours, settings.overtimeThreshold - before));
    const overtimeHours = hours - regularHours;
    used.set(key, before + hours);
    const rate = rateFor(entry.userId);
    const pay = regularHours * rate + overtimeHours * rate * settings.overtimeMultiplier;
    return { entry, hours, regularHours, overtimeHours, pay };
  });
}

const round2 = (n: number) => Math.round(n * 100) / 100;

function enrichUser(user: User, entries: TimeEntry[], payments: Payment[], settings: CompanySettings): UserWithStats {
  const ws = weekStart(), ms = monthStart(), ds = dayStart();
  const ys = new Date(new Date().getFullYear(), 0, 1).getTime();
  let todayHours = 0, weekHours = 0, monthHours = 0, ytdHours = 0, weekOvertimeHours = 0;
  let weekPay = 0, monthPay = 0, ytdPay = 0, totalEarned = 0, clockedIn = false;
  for (const l of laborLines(entries.filter(e => e.userId === user.id), () => user.hourlyRate, settings)) {
    const start = new Date(l.entry.clockIn).getTime();
    if (l.entry.clockOut === null) clockedIn = true;
    if (start >= ds) todayHours += l.hours;
    if (start >= ws) { weekHours += l.hours; weekPay += l.pay; weekOvertimeHours += l.overtimeHours; }
    if (start >= ms) { monthHours += l.hours; monthPay += l.pay; }
    if (start >= ys) { ytdHours += l.hours; ytdPay += l.pay; }
    totalEarned += l.pay;
  }
  const totalPaid = payments.filter(p => p.userId === user.id).reduce((s, p) => s + p.amount, 0);
  const { pinHash: _pin, ...safe } = user;
  return {
    ...safe, clockedIn, todayHours, weekHours, monthHours, weekPay: round2(weekPay), monthPay: round2(monthPay), totalPaid,
    totalOwed: Math.max(0, round2(totalEarned - totalPaid)), weekOvertimeHours, ytdHours, ytdPay: round2(ytdPay), totalEarned: round2(totalEarned),
  };
}

export function distanceMeters(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const R = 6371000, toRad = (d: number) => d * Math.PI / 180;
  const dLat = toRad(b.lat - a.lat), dLng = toRad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export function dmChannel(a: string, b: string): string { return `dm:${[a, b].sort().join(":")}`; }

export interface DailyHours {
  date: string;
  label: string;
  hours: number;
}

export const db = {
  isSetup: (): boolean => read().company !== null,

  setup(companyName: string, ownerName: string, pin: string): { company: Company; user: User } {
    const data = read();
    const company: Company = { id: randomUUID(), name: companyName, joinCode: newJoinCode(), createdAt: new Date().toISOString(), settings: structuredClone(DEFAULT_SETTINGS) };
    const user: User = { id: randomUUID(), name: ownerName, role: "owner", hourlyRate: 0, createdAt: new Date().toISOString(), active: true, title: "Owner", pinHash: hashPin(pin) };
    data.company = company; data.users = [user];
    write(data); return { company, user };
  },

  getCompany: (): Company | null => read().company,

  updateSettings(settings: CompanySettings): Company | null {
    const data = read();
    if (!data.company) return null;
    data.company.settings = settings;
    write(data); return data.company;
  },

  updateCompany(updates: Partial<Pick<Company,"name">>): Company | null {
    const data = read();
    if (!data.company) return null;
    data.company = { ...data.company, ...updates };
    write(data); return data.company;
  },
  getUsers: (): User[] => read().users,
  getPublicUsers: () => read().users.filter(u => u.active).map(u => ({ id: u.id, name: u.name, title: u.title, role: u.role, hasPin: !!u.pinHash })),
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

  joinByCode(code: string, name: string, pin: string): User | "taken" | null {
    const data = read();
    if (!data.company || data.company.joinCode !== code.toUpperCase()) return null;
    const existing = data.users.find(u => u.name.toLowerCase() === name.toLowerCase());
    if (existing) {
      // Owner-added employees have no PIN yet; the invite code lets them claim the account once.
      if (existing.pinHash || existing.role === "owner") return "taken";
      existing.pinHash = hashPin(pin);
      write(data); return existing;
    }
    const user: User = { id: randomUUID(), name, role: "employee", hourlyRate: 0, createdAt: new Date().toISOString(), active: true, title: "Employee", pinHash: hashPin(pin) };
    data.users.push(user); write(data); return user;
  },

  setPin(userId: string, pin: string): void {
    const data = read();
    const u = data.users.find(x => x.id === userId);
    if (!u) return;
    u.pinHash = hashPin(pin); write(data);
  },

  createSession(userId: string): string {
    const data = read();
    const token = randomBytes(32).toString("hex");
    data.sessions.push({ token, userId, createdAt: new Date().toISOString() });
    const cutoff = Date.now() - 30 * 24 * 3600 * 1000;
    data.sessions = data.sessions.filter(s => new Date(s.createdAt).getTime() > cutoff);
    write(data); return token;
  },

  getSessionUser(token: string): User | null {
    const data = read();
    const s = data.sessions.find(x => x.token === token);
    if (!s || Date.now() - new Date(s.createdAt).getTime() > 30 * 24 * 3600 * 1000) return null;
    const u = data.users.find(x => x.id === s.userId);
    return u && u.active ? u : null;
  },

  /** Clears a PIN and signs the user out everywhere; they set a new PIN on next sign-in. */
  resetPin(userId: string): boolean {
    const data = read();
    const u = data.users.find(x => x.id === userId);
    if (!u) return false;
    delete u.pinHash;
    data.sessions = data.sessions.filter(s => s.userId !== userId);
    write(data); return true;
  },

  deleteSession(token: string): void {
    const data = read();
    data.sessions = data.sessions.filter(s => s.token !== token); write(data);
  },

  clockIn(userId: string, notes: string, jobId?: string, location?: GeoPoint, distanceM?: number): TimeEntry | null {
    const data = read();
    if (data.timeEntries.find(e => e.userId === userId && e.clockOut === null)) return null;
    const entry: TimeEntry = { id: randomUUID(), userId, clockIn: new Date().toISOString(), clockOut: null, notes, jobId, breaks: [], location, distanceM };
    data.timeEntries.push(entry); write(data); return entry;
  },

  clockOut(userId: string, notes?: string, location?: GeoPoint): TimeEntry | null {
    const data = read();
    const i = data.timeEntries.findIndex(e => e.userId === userId && e.clockOut === null);
    if (i === -1) return null;
    data.timeEntries[i].clockOut = new Date().toISOString();
    if (location) data.timeEntries[i].clockOutLocation = location;
    if (notes?.trim()) data.timeEntries[i].notes = notes.trim();
    write(data); return data.timeEntries[i];
  },

  updateTimeEntry(id: string, updates: Partial<Pick<TimeEntry,"clockIn"|"clockOut"|"notes">>, editor?: User): TimeEntry | null {
    const data = read();
    const i = data.timeEntries.findIndex(e => e.id === id);
    if (i === -1) return null;
    const prev = data.timeEntries[i];
    const edits = [...(prev.edits ?? [])];
    if (editor) {
      for (const field of ["clockIn", "clockOut", "notes"] as const) {
        if (field in updates && updates[field] !== prev[field]) {
          edits.push({ at: new Date().toISOString(), by: editor.id, byName: editor.name, field, from: prev[field] ?? null, to: updates[field] ?? null });
        }
      }
    }
    data.timeEntries[i] = { ...prev, ...updates, edits };
    write(data); return data.timeEntries[i];
  },

  deleteTimeEntry(id: string): boolean {
    const data = read();
    const i = data.timeEntries.findIndex(e => e.id === id);
    if (i === -1) return false;
    data.timeEntries.splice(i, 1); write(data); return true;
  },

  getTimeEntries: (userId?: string): TimeEntry[] => {
    const data = read();
    return userId ? data.timeEntries.filter(e => e.userId === userId) : data.timeEntries;
  },

  getOpenEntry: (userId: string): TimeEntry | null =>
    read().timeEntries.find(e => e.userId === userId && e.clockOut === null) ?? null,

  getUsersWithStats(): UserWithStats[] {
    const data = read();
    const settings = data.company?.settings ?? DEFAULT_SETTINGS;
    return data.users.map(u => enrichUser(u, data.timeEntries, data.payments, settings));
  },

  getUserWithStats(userId: string): UserWithStats | null {
    const data = read();
    const user = data.users.find(u => u.id === userId);
    return user ? enrichUser(user, data.timeEntries, data.payments, data.company?.settings ?? DEFAULT_SETTINGS) : null;
  },

  regenerateJoinCode(): string | null {
    const data = read();
    if (!data.company) return null;
    data.company.joinCode = newJoinCode();
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

  deletePayment(id: string): boolean {
    const data = read();
    const i = data.payments.findIndex(p => p.id === id);
    if (i === -1) return false;
    data.payments.splice(i, 1); write(data); return true;
  },

  // ── Expenses ──

  getExpenses(): Expense[] {
    return [...read().expenses].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  },

  createExpense(e: Omit<Expense,"id"|"createdAt">): Expense {
    const data = read();
    const expense: Expense = { ...e, id: randomUUID(), createdAt: new Date().toISOString() };
    data.expenses.push(expense); write(data); return expense;
  },

  updateExpense(id: string, updates: Partial<Omit<Expense,"id"|"createdAt">>): Expense | null {
    const data = read();
    const i = data.expenses.findIndex(e => e.id === id);
    if (i === -1) return null;
    data.expenses[i] = { ...data.expenses[i], ...updates }; write(data); return data.expenses[i];
  },

  deleteExpense(id: string): boolean {
    const data = read();
    const i = data.expenses.findIndex(e => e.id === id);
    if (i === -1) return false;
    data.expenses.splice(i, 1); write(data); return true;
  },

  // ── Announcements ──

  getAnnouncements(): Announcement[] {
    return [...read().announcements].sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  },

  createAnnouncement(a: Omit<Announcement,"id"|"createdAt">): Announcement {
    const data = read();
    const ann: Announcement = { ...a, id: randomUUID(), createdAt: new Date().toISOString() };
    data.announcements.push(ann); write(data); return ann;
  },

  updateAnnouncement(id: string, updates: Partial<Pick<Announcement,"pinned"|"title"|"body">>): Announcement | null {
    const data = read();
    const i = data.announcements.findIndex(a => a.id === id);
    if (i === -1) return null;
    data.announcements[i] = { ...data.announcements[i], ...updates }; write(data); return data.announcements[i];
  },

  deleteAnnouncement(id: string): boolean {
    const data = read();
    const i = data.announcements.findIndex(a => a.id === id);
    if (i === -1) return false;
    data.announcements.splice(i, 1); write(data); return true;
  },

  // ── Breaks ──

  startBreak(entryId: string): TimeEntry | null {
    const data = read();
    const i = data.timeEntries.findIndex(e => e.id === entryId && e.clockOut === null);
    if (i === -1) return null;
    const entry = data.timeEntries[i];
    if ((entry.breaks ?? []).some(b => !b.breakEnd)) return null; // already on break
    entry.breaks = [...(entry.breaks ?? []), { breakStart: new Date().toISOString(), breakEnd: null }];
    write(data); return entry;
  },

  endBreak(entryId: string): TimeEntry | null {
    const data = read();
    const i = data.timeEntries.findIndex(e => e.id === entryId && e.clockOut === null);
    if (i === -1) return null;
    const entry = data.timeEntries[i];
    const bi = (entry.breaks ?? []).findIndex(b => !b.breakEnd);
    if (bi === -1) return null;
    entry.breaks[bi].breakEnd = new Date().toISOString();
    write(data); return entry;
  },

  // ── Shifts ──

  getShifts(userId?: string): Shift[] {
    const data = read();
    const all = [...data.shifts].sort((a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime));
    return userId ? all.filter(s => s.userId === userId) : all;
  },

  createShift(s: Omit<Shift,"id"|"createdAt">): Shift {
    const data = read();
    const shift: Shift = { ...s, id: randomUUID(), createdAt: new Date().toISOString() };
    data.shifts.push(shift); write(data); return shift;
  },

  updateShift(id: string, updates: Partial<Omit<Shift,"id"|"createdAt">>): Shift | null {
    const data = read();
    const i = data.shifts.findIndex(s => s.id === id);
    if (i === -1) return null;
    data.shifts[i] = { ...data.shifts[i], ...updates }; write(data); return data.shifts[i];
  },

  deleteShift(id: string): boolean {
    const data = read();
    const i = data.shifts.findIndex(s => s.id === id);
    if (i === -1) return false;
    data.shifts.splice(i, 1); write(data); return true;
  },

  // ── Leave Requests ──

  getLeaveRequests(userId?: string): LeaveRequest[] {
    const data = read();
    const all = [...data.leaveRequests].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return userId ? all.filter(r => r.userId === userId) : all;
  },

  createLeaveRequest(r: Omit<LeaveRequest,"id"|"createdAt"|"reviewedAt"|"status">): LeaveRequest {
    const data = read();
    const req: LeaveRequest = { ...r, id: randomUUID(), status: "pending", createdAt: new Date().toISOString(), reviewedAt: null };
    data.leaveRequests.push(req); write(data); return req;
  },

  updateLeaveRequest(id: string, status: "approved" | "denied"): LeaveRequest | null {
    const data = read();
    const i = data.leaveRequests.findIndex(r => r.id === id);
    if (i === -1) return null;
    data.leaveRequests[i] = { ...data.leaveRequests[i], status, reviewedAt: new Date().toISOString() };
    write(data); return data.leaveRequests[i];
  },

  deleteLeaveRequest(id: string): boolean {
    const data = read();
    const i = data.leaveRequests.findIndex(r => r.id === id);
    if (i === -1) return false;
    data.leaveRequests.splice(i, 1); write(data); return true;
  },

  // ── Notifications ──

  getNotifications(userId: string): AppNotification[] {
    return [...read().notifications.filter(n => n.userId === userId)].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  addNotification(n: Omit<AppNotification,"id"|"createdAt"|"read">): AppNotification {
    const data = read();
    const notif: AppNotification = { ...n, id: randomUUID(), read: false, createdAt: new Date().toISOString() };
    data.notifications.push(notif); write(data); return notif;
  },

  markNotificationRead(id: string): boolean {
    const data = read();
    const i = data.notifications.findIndex(n => n.id === id);
    if (i === -1) return false;
    data.notifications[i].read = true; write(data); return true;
  },

  markAllNotificationsRead(userId: string): void {
    const data = read();
    data.notifications.filter(n => n.userId === userId).forEach(n => { n.read = true; });
    write(data);
  },

  // ── Employee Notes ──

  getEmployeeNotes(userId: string): EmployeeNote[] {
    return [...read().employeeNotes.filter(n => n.userId === userId)].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  addEmployeeNote(n: Omit<EmployeeNote,"id"|"createdAt">): EmployeeNote {
    const data = read();
    const note: EmployeeNote = { ...n, id: randomUUID(), createdAt: new Date().toISOString() };
    data.employeeNotes.push(note); write(data); return note;
  },

  deleteEmployeeNote(id: string): boolean {
    const data = read();
    const i = data.employeeNotes.findIndex(n => n.id === id);
    if (i === -1) return false;
    data.employeeNotes.splice(i, 1); write(data); return true;
  },

  // ── Shift marketplace ──

  getShift: (id: string): Shift | null => read().shifts.find(s => s.id === id) ?? null,

  // ── Chat ──

  getMessages(channel: string, limit = 200): Message[] {
    return read().messages.filter(m => m.channel === channel).slice(-limit);
  },

  addMessage(channel: string, senderId: string, text: string): Message {
    const data = read();
    const msg: Message = { id: randomUUID(), channel, senderId, text, createdAt: new Date().toISOString() };
    data.messages.push(msg);
    const r = data.chatReads.find(x => x.userId === senderId && x.channel === channel);
    if (r) r.readAt = msg.createdAt; else data.chatReads.push({ userId: senderId, channel, readAt: msg.createdAt });
    write(data); return msg;
  },

  markChannelRead(userId: string, channel: string): void {
    const data = read();
    const now = new Date().toISOString();
    const r = data.chatReads.find(x => x.userId === userId && x.channel === channel);
    if (r) r.readAt = now; else data.chatReads.push({ userId, channel, readAt: now });
    write(data);
  },

  chatSummary(userId: string, channels: string[]): Array<{ channel: string; last: Message | null; unread: number }> {
    const data = read();
    return channels.map(channel => {
      const msgs = data.messages.filter(m => m.channel === channel);
      const readAt = data.chatReads.find(r => r.userId === userId && r.channel === channel)?.readAt ?? "";
      return { channel, last: msgs[msgs.length - 1] ?? null, unread: msgs.filter(m => m.senderId !== userId && m.createdAt > readAt).length };
    });
  },

  // ── Time correction requests ──

  getTimeRequests: (userId?: string): TimeRequest[] => {
    const all = read().timeRequests;
    return (userId ? all.filter(r => r.userId === userId) : all).slice().sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },

  createTimeRequest(r: Pick<TimeRequest, "userId" | "clockIn" | "clockOut" | "reason">): TimeRequest {
    const data = read();
    const req: TimeRequest = { ...r, id: randomUUID(), status: "pending", createdAt: new Date().toISOString(), reviewedAt: null };
    data.timeRequests.push(req); write(data); return req;
  },

  /** Approving creates the missing time entry and logs who added it. */
  reviewTimeRequest(id: string, status: "approved" | "denied", reviewer: User): TimeRequest | null {
    const data = read();
    const r = data.timeRequests.find(x => x.id === id);
    if (!r || r.status !== "pending") return null;
    r.status = status;
    r.reviewedAt = new Date().toISOString();
    if (status === "approved") {
      const entry: TimeEntry = {
        id: randomUUID(), userId: r.userId, clockIn: r.clockIn, clockOut: r.clockOut, notes: r.reason, breaks: [],
        edits: [{ at: r.reviewedAt, by: reviewer.id, byName: reviewer.name, field: "created from correction request", from: null, to: null }],
      };
      data.timeEntries.push(entry);
      r.entryId = entry.id;
    }
    write(data); return r;
  },

  // ── Backup ──

  exportAll() {
    const data = read();
    return {
      exportedAt: new Date().toISOString(),
      ...data,
      users: data.users.map(({ pinHash: _p, ...u }) => u),
      sessions: undefined,
      chatReads: undefined,
    };
  },

  getAllData: (): DbData => read(),

  // ── Clients ──

  getClients: (): Client[] => read().clients,

  createClient(c: Omit<Client,"id"|"createdAt">): Client {
    const data = read();
    const client: Client = { ...c, id: randomUUID(), createdAt: new Date().toISOString() };
    data.clients.push(client); write(data); return client;
  },

  updateClient(id: string, updates: Partial<Omit<Client,"id"|"createdAt">>): Client | null {
    const data = read();
    const i = data.clients.findIndex(c => c.id === id);
    if (i === -1) return null;
    data.clients[i] = { ...data.clients[i], ...updates }; write(data); return data.clients[i];
  },

  deleteClient(id: string): boolean {
    const data = read();
    const i = data.clients.findIndex(c => c.id === id);
    if (i === -1) return false;
    data.clients.splice(i, 1); write(data); return true;
  },

  // ── Invoices ──

  getInvoices: (): Invoice[] => read().invoices,

  createInvoice(inv: Omit<Invoice,"id"|"number"|"createdAt"|"paidAt">): Invoice {
    const data = read();
    const max = data.invoices.reduce((m, x) => Math.max(m, parseInt(x.number.replace(/\D/g, ""), 10) || 0), 1000);
    const invoice: Invoice = { ...inv, id: randomUUID(), number: `INV-${max + 1}`, paidAt: inv.status === "paid" ? new Date().toISOString() : null, createdAt: new Date().toISOString() };
    data.invoices.push(invoice); write(data); return invoice;
  },

  updateInvoice(id: string, updates: Partial<Omit<Invoice,"id"|"number"|"createdAt">>): Invoice | null {
    const data = read();
    const i = data.invoices.findIndex(x => x.id === id);
    if (i === -1) return null;
    const prev = data.invoices[i];
    const next = { ...prev, ...updates };
    if (updates.status === "paid" && prev.status !== "paid") next.paidAt = new Date().toISOString();
    if (updates.status && updates.status !== "paid") next.paidAt = null;
    data.invoices[i] = next; write(data); return next;
  },

  deleteInvoice(id: string): boolean {
    const data = read();
    const i = data.invoices.findIndex(x => x.id === id);
    if (i === -1) return false;
    data.invoices.splice(i, 1); write(data); return true;
  },

  // ── Tasks ──

  getTasks: (userId?: string): Task[] => {
    const t = read().tasks;
    return userId ? t.filter(x => x.assignedTo === userId) : t;
  },

  getTask: (id: string): Task | null => read().tasks.find(t => t.id === id) ?? null,

  createTask(t: Omit<Task,"id"|"createdAt"|"done"|"doneAt">): Task {
    const data = read();
    const task: Task = { ...t, id: randomUUID(), done: false, doneAt: null, createdAt: new Date().toISOString() };
    data.tasks.push(task); write(data); return task;
  },

  updateTask(id: string, updates: Partial<Pick<Task,"title"|"description"|"assignedTo"|"dueDate"|"done">>): Task | null {
    const data = read();
    const i = data.tasks.findIndex(t => t.id === id);
    if (i === -1) return null;
    const next = { ...data.tasks[i], ...updates };
    if (updates.done !== undefined) next.doneAt = updates.done ? new Date().toISOString() : null;
    data.tasks[i] = next; write(data); return next;
  },

  deleteTask(id: string): boolean {
    const data = read();
    const i = data.tasks.findIndex(t => t.id === id);
    if (i === -1) return false;
    data.tasks.splice(i, 1); write(data); return true;
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
