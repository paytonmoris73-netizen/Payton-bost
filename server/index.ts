import "dotenv/config";
import express from "express";
import type { Request, Response, NextFunction } from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { db, hoursFor, verifyPin, invoiceTotal, laborLines, distanceMeters, dmChannel, DEFAULT_SETTINGS } from "./db.js";
import type { User, TimeEntry, InvoiceItem, GeoPoint, CompanySettings } from "./db.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT) || 8787;

const app = express();
app.use(express.json({ limit: "1mb" }));

// ── Helpers ───────────────────────────────────────────────
function pick<T extends object, K extends keyof T>(obj: T, keys: K[]): Partial<Pick<T, K>> {
  const out: Partial<Pick<T, K>> = {};
  for (const k of keys) if (obj && k in obj) out[k] = obj[k];
  return out;
}
function publicUser(u: User) { const { pinHash: _p, ...rest } = u; return rest; }
function me(res: Response): User { return res.locals.user as User; }
function isOwner(res: Response): boolean { return me(res).role === "owner"; }
function str(v: unknown, max = 2000): string { return typeof v === "string" ? v.trim().slice(0, max) : ""; }
function validPin(pin: unknown): pin is string { return typeof pin === "string" && /^\d{4,8}$/.test(pin); }
function withHours(e: TimeEntry, names: Map<string, string>) {
  return { ...e, userName: names.get(e.userId) ?? "Unknown", hours: hoursFor(e) };
}
function parseGeo(v: unknown): GeoPoint | undefined {
  if (!v || typeof v !== "object") return undefined;
  const { lat, lng, accuracy } = v as Record<string, unknown>;
  const la = Number(lat), ln = Number(lng), ac = Number(accuracy);
  if (!isFinite(la) || !isFinite(ln) || Math.abs(la) > 90 || Math.abs(ln) > 180) return undefined;
  return { lat: la, lng: ln, accuracy: isFinite(ac) && ac >= 0 ? Math.round(ac) : 0 };
}
function settings(): CompanySettings { return db.getCompany()?.settings ?? DEFAULT_SETTINGS; }
function nameMap() { return new Map(db.getUsers().map(u => [u.id, u.name])); }

// Brute-force protection: 5 bad PINs locks the account for 5 minutes.
const failures = new Map<string, { count: number; until: number }>();
function isLocked(key: string): boolean { const f = failures.get(key); return !!f && f.until > Date.now(); }
function recordFailure(key: string) {
  const f = failures.get(key) ?? { count: 0, until: 0 };
  f.count += 1;
  if (f.count >= 5) { f.until = Date.now() + 5 * 60 * 1000; f.count = 0; }
  failures.set(key, f);
}

// ── Public routes ─────────────────────────────────────────
app.get("/api/status", (_req, res) => { res.json({ setup: db.isSetup() }); });

app.post("/api/setup", (req, res) => {
  const companyName = str(req.body?.companyName, 100), ownerName = str(req.body?.ownerName, 100);
  if (!companyName || !ownerName) { res.status(400).json({ error: "Company name and owner name required." }); return; }
  if (!validPin(req.body?.pin)) { res.status(400).json({ error: "PIN must be 4–8 digits." }); return; }
  if (db.isSetup()) { res.status(409).json({ error: "Already set up." }); return; }
  const { company, user } = db.setup(companyName, ownerName, req.body.pin);
  res.json({ company, user: publicUser(user), token: db.createSession(user.id) });
});

app.get("/api/auth/users", (_req, res) => { res.json(db.getPublicUsers()); });

app.post("/api/auth/login", (req, res) => {
  const name = str(req.body?.name, 100);
  const pin = req.body?.pin;
  const user = name ? db.getUserByName(name) : null;
  if (!user) { res.status(404).json({ error: "User not found." }); return; }
  if (!user.active) { res.status(403).json({ error: "Account inactive." }); return; }
  if (isLocked(user.id)) { res.status(429).json({ error: "Too many attempts. Try again in a few minutes." }); return; }
  if (!validPin(pin)) { res.status(400).json({ error: "Enter your 4–8 digit PIN." }); return; }
  if (!user.pinHash) {
    // First sign-in sets the PIN. Employees must prove they have the invite code;
    // an owner from before PINs existed can't see the code, so they claim directly once.
    const code = str(req.body?.code, 20).toUpperCase();
    if (user.role !== "owner" && code !== db.getCompany()?.joinCode) {
      recordFailure(user.id);
      res.status(401).json({ error: "Enter the invite code from your manager to set up your PIN." }); return;
    }
    db.setPin(user.id, pin);
  } else if (!verifyPin(pin, user.pinHash)) {
    recordFailure(user.id);
    res.status(401).json({ error: "Incorrect PIN." }); return;
  }
  failures.delete(user.id);
  res.json({ user: publicUser(user), token: db.createSession(user.id) });
});

app.post("/api/auth/join", (req, res) => {
  const code = str(req.body?.code, 20), name = str(req.body?.name, 100);
  if (!code || !name) { res.status(400).json({ error: "Code and name required." }); return; }
  if (!validPin(req.body?.pin)) { res.status(400).json({ error: "PIN must be 4–8 digits." }); return; }
  const ip = req.ip ?? "unknown";
  if (isLocked(`join:${ip}`)) { res.status(429).json({ error: "Too many attempts. Try again in a few minutes." }); return; }
  const result = db.joinByCode(code, name, req.body.pin);
  if (result === "taken") { res.status(409).json({ error: "That name is already registered. Sign in instead." }); return; }
  if (!result) { recordFailure(`join:${ip}`); res.status(400).json({ error: "Invalid join code." }); return; }
  res.json({ user: publicUser(result), token: db.createSession(result.id) });
});

// ── Auth gate ─────────────────────────────────────────────
app.use("/api", (req: Request, res: Response, next: NextFunction) => {
  const header = req.headers.authorization ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  const user = token ? db.getSessionUser(token) : null;
  if (!user) { res.status(401).json({ error: "Please sign in again." }); return; }
  res.locals.user = user;
  res.locals.token = token;
  next();
});

function ownerOnly(_req: Request, res: Response, next: NextFunction) {
  if (!isOwner(res)) { res.status(403).json({ error: "Owner access required." }); return; }
  next();
}

app.get("/api/auth/me", (_req, res) => { res.json(db.getUserWithStats(me(res).id)); });

app.post("/api/auth/logout", (_req, res) => { db.deleteSession(res.locals.token as string); res.json({ ok: true }); });

app.post("/api/auth/pin", (req, res) => {
  const { currentPin, newPin } = req.body ?? {};
  const u = me(res);
  if (!validPin(newPin)) { res.status(400).json({ error: "New PIN must be 4–8 digits." }); return; }
  if (u.pinHash && !(typeof currentPin === "string" && verifyPin(currentPin, u.pinHash))) { res.status(401).json({ error: "Current PIN is incorrect." }); return; }
  db.setPin(u.id, newPin);
  res.json({ ok: true });
});

// ── Company ───────────────────────────────────────────────
app.get("/api/company", (_req, res) => {
  const c = db.getCompany();
  if (!c) { res.status(404).json({ error: "Not set up" }); return; }
  res.json(isOwner(res) ? c : { ...c, joinCode: "" });
});

app.patch("/api/company", ownerOnly, (req, res) => {
  const name = str(req.body?.name, 100);
  if (!name) { res.status(400).json({ error: "Name required." }); return; }
  const c = db.updateCompany({ name });
  if (!c) { res.status(404).json({ error: "Not set up." }); return; }
  res.json(c);
});

app.put("/api/company/settings", ownerOnly, (req, res) => {
  const b = req.body ?? {};
  const g = b.geofence ?? {};
  const threshold = Number(b.overtimeThreshold), mult = Number(b.overtimeMultiplier);
  if (!(threshold >= 1 && threshold <= 168)) { res.status(400).json({ error: "Overtime threshold must be 1–168 hours." }); return; }
  if (!(mult >= 1 && mult <= 5)) { res.status(400).json({ error: "Overtime multiplier must be between 1 and 5." }); return; }
  const lat = Number(g.lat), lng = Number(g.lng), radiusM = Number(g.radiusM);
  const enabled = g.enabled === true;
  if (enabled && (!isFinite(lat) || !isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180 || (lat === 0 && lng === 0))) {
    res.status(400).json({ error: "Set a work location before turning on the job-site fence." }); return;
  }
  if (enabled && !(radiusM >= 25 && radiusM <= 50000)) { res.status(400).json({ error: "Fence radius must be 25 m – 50 km." }); return; }
  const c = db.updateSettings({
    overtimeThreshold: threshold,
    overtimeMultiplier: mult,
    geofence: { enabled, enforce: enabled && g.enforce === true, lat: isFinite(lat) ? lat : 0, lng: isFinite(lng) ? lng : 0, radiusM: isFinite(radiusM) ? radiusM : 200, label: str(g.label, 100) },
  });
  if (!c) { res.status(404).json({ error: "Not set up." }); return; }
  res.json(c);
});

app.get("/api/backup", ownerOnly, (_req, res) => {
  const stamp = new Date().toISOString().slice(0, 10);
  res.setHeader("Content-Disposition", `attachment; filename="workbase-backup-${stamp}.json"`);
  res.json(db.exportAll());
});

app.post("/api/company/regenerate-code", ownerOnly, (_req, res) => {
  const code = db.regenerateJoinCode();
  if (!code) { res.status(404).json({ error: "Not set up." }); return; }
  res.json({ joinCode: code });
});

// ── Team ──────────────────────────────────────────────────
app.get("/api/team", (_req, res) => {
  if (isOwner(res)) { res.json(db.getUsersWithStats()); return; }
  res.json(db.getPublicUsers());
});

app.get("/api/me/:userId", (req, res) => {
  if (!isOwner(res) && req.params.userId !== me(res).id) { res.status(403).json({ error: "Forbidden." }); return; }
  const u = db.getUserWithStats(req.params.userId);
  if (!u) { res.status(404).json({ error: "User not found." }); return; }
  res.json(u);
});

app.post("/api/team", ownerOnly, (req, res) => {
  const name = str(req.body?.name, 100);
  if (!name) { res.status(400).json({ error: "Name required." }); return; }
  if (db.getUserByName(name)) { res.status(409).json({ error: "User with this name already exists." }); return; }
  res.json(publicUser(db.addUser(name, Math.max(0, Number(req.body?.hourlyRate) || 0), str(req.body?.title, 100) || "Employee")));
});

app.post("/api/team/:id/reset-pin", ownerOnly, (req, res) => {
  const target = db.getUserById(req.params.id);
  if (!target) { res.status(404).json({ error: "User not found." }); return; }
  if (target.role === "owner") { res.status(400).json({ error: "Owners change their own PIN from the menu." }); return; }
  db.resetPin(target.id);
  failures.delete(target.id);
  res.json({ ok: true });
});

app.patch("/api/team/:id", ownerOnly, (req, res) => {
  const updates = pick(req.body ?? {}, ["name", "hourlyRate", "active", "title"]) as Partial<{ name: string; hourlyRate: number; active: boolean; title: string }>;
  if (req.params.id === me(res).id && updates.active === false) { res.status(400).json({ error: "You can't deactivate yourself." }); return; }
  const u = db.updateUser(req.params.id, updates);
  if (!u) { res.status(404).json({ error: "User not found." }); return; }
  res.json(publicUser(u));
});

// ── Time ──────────────────────────────────────────────────
app.get("/api/time", (req, res) => {
  const userId = isOwner(res) ? (req.query.userId as string | undefined) : me(res).id;
  const names = nameMap();
  const enriched = db.getTimeEntries(userId).map(e => withHours(e, names));
  enriched.sort((a, b) => new Date(b.clockIn).getTime() - new Date(a.clockIn).getTime());
  res.json(enriched);
});

app.post("/api/time/clock-in", (req, res) => {
  const jobId = typeof req.body?.jobId === "string" && req.body.jobId ? req.body.jobId : undefined;
  const location = parseGeo(req.body?.location);
  const fence = settings().geofence;
  let distanceM: number | undefined;
  if (location && fence.enabled) distanceM = Math.round(distanceMeters(location, fence));
  if (fence.enabled && fence.enforce) {
    if (!location) { res.status(403).json({ error: "Location is required to clock in. Allow location access and try again." }); return; }
    // Give the benefit of GPS error, capped so a vague fix can't clear any fence.
    const slack = Math.min(location.accuracy, 150);
    if ((distanceM ?? Infinity) > fence.radiusM + slack) {
      res.status(403).json({ error: `You're ${formatDistance(distanceM!)} from ${fence.label || "the work site"}. Move closer to clock in.` }); return;
    }
  }
  const entry = db.clockIn(me(res).id, str(req.body?.notes, 500), jobId, location, distanceM);
  if (!entry) { res.status(409).json({ error: "Already clocked in." }); return; }
  res.json(entry);
});

app.post("/api/time/clock-out", (req, res) => {
  const open = db.getOpenEntry(me(res).id);
  if (open?.breaks.some(b => !b.breakEnd)) db.endBreak(open.id);
  const entry = db.clockOut(me(res).id, str(req.body?.notes, 500), parseGeo(req.body?.location));
  if (!entry) { res.status(409).json({ error: "Not clocked in." }); return; }
  res.json(entry);
});

app.patch("/api/time/:id", ownerOnly, (req, res) => {
  const { clockIn, clockOut, notes } = req.body ?? {};
  const updates: Parameters<typeof db.updateTimeEntry>[1] = {};
  if (typeof clockIn === "string" && !isNaN(Date.parse(clockIn))) updates.clockIn = clockIn;
  if (clockOut === null || (typeof clockOut === "string" && !isNaN(Date.parse(clockOut)))) updates.clockOut = clockOut;
  if (typeof notes === "string") updates.notes = notes.slice(0, 500);
  if (updates.clockIn && updates.clockOut && Date.parse(updates.clockOut) < Date.parse(updates.clockIn)) {
    res.status(400).json({ error: "Clock-out must be after clock-in." }); return;
  }
  const e = db.updateTimeEntry(req.params.id, updates, me(res));
  if (!e) { res.status(404).json({ error: "Entry not found." }); return; }
  res.json(withHours(e, nameMap()));
});

app.delete("/api/time/:id", ownerOnly, (req, res) => {
  if (!db.deleteTimeEntry(req.params.id)) { res.status(404).json({ error: "Entry not found." }); return; }
  res.json({ ok: true });
});

app.get("/api/time/status", (req, res) => {
  const userId = isOwner(res) && req.query.userId ? String(req.query.userId) : me(res).id;
  const entry = db.getOpenEntry(userId);
  res.json({ clocked: entry !== null, entry: entry ?? null });
});

function ownsEntry(res: Response, entryId: string): boolean {
  if (isOwner(res)) return true;
  return db.getTimeEntries(me(res).id).some(e => e.id === entryId);
}

app.post("/api/time/:id/break/start", (req, res) => {
  if (!ownsEntry(res, req.params.id)) { res.status(403).json({ error: "Forbidden." }); return; }
  const entry = db.startBreak(req.params.id);
  if (!entry) { res.status(409).json({ error: "Entry not found or already on break." }); return; }
  res.json(entry);
});

app.post("/api/time/:id/break/end", (req, res) => {
  if (!ownsEntry(res, req.params.id)) { res.status(403).json({ error: "Forbidden." }); return; }
  const entry = db.endBreak(req.params.id);
  if (!entry) { res.status(409).json({ error: "Entry not found or not on break." }); return; }
  res.json(entry);
});

// ── Jobs ──────────────────────────────────────────────────
app.get("/api/jobs", (req, res) => {
  const userId = isOwner(res) ? (req.query.userId as string | undefined) : me(res).id;
  const jobs = db.getJobs();
  const filtered = userId ? jobs.filter(j => j.assignedTo.includes(userId) || j.assignedTo.length === 0) : [...jobs];
  filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  res.json(filtered);
});

const PRIORITIES = ["normal", "high", "urgent"] as const;
const JOB_STATUSES = ["open", "in_progress", "completed"] as const;

app.post("/api/jobs", ownerOnly, (req, res) => {
  const b = req.body ?? {};
  const title = str(b.title, 200);
  if (!title) { res.status(400).json({ error: "Title required." }); return; }
  res.json(db.createJob({
    title,
    description: str(b.description, 5000),
    category: str(b.category, 50) || "General",
    payType: b.payType === "hourly" ? "hourly" : "fixed",
    payAmount: Math.max(0, Number(b.payAmount) || 0),
    assignedTo: Array.isArray(b.assignedTo) ? b.assignedTo.filter((x: unknown) => typeof x === "string") : [],
    status: "open",
    priority: PRIORITIES.includes(b.priority) ? b.priority : "normal",
    dueDate: typeof b.dueDate === "string" && b.dueDate ? b.dueDate : null,
    clientId: typeof b.clientId === "string" && b.clientId ? b.clientId : undefined,
  }));
});

app.patch("/api/jobs/:id", (req, res) => {
  const job = db.getJob(req.params.id);
  if (!job) { res.status(404).json({ error: "Job not found." }); return; }
  const b = req.body ?? {};
  if (b.status !== undefined && !JOB_STATUSES.includes(b.status)) { res.status(400).json({ error: "Invalid status." }); return; }
  if (b.priority !== undefined && !PRIORITIES.includes(b.priority)) { res.status(400).json({ error: "Invalid priority." }); return; }
  let updates;
  if (isOwner(res)) {
    updates = pick(b, ["title", "description", "category", "payType", "payAmount", "assignedTo", "status", "priority", "dueDate", "clientId"]);
  } else {
    const assigned = job.assignedTo.length === 0 || job.assignedTo.includes(me(res).id);
    if (!assigned) { res.status(403).json({ error: "Not assigned to this job." }); return; }
    updates = pick(b, ["status"]);
  }
  res.json(db.updateJob(req.params.id, updates as Parameters<typeof db.updateJob>[1]));
});

app.delete("/api/jobs/:id", ownerOnly, (req, res) => {
  if (!db.deleteJob(req.params.id)) { res.status(404).json({ error: "Job not found." }); return; }
  res.json({ ok: true });
});

// ── Payments ──────────────────────────────────────────────
app.get("/api/payments", (req, res) => {
  const userId = isOwner(res) ? (req.query.userId as string | undefined) : me(res).id;
  const names = nameMap();
  res.json(db.getPayments(userId).map(p => ({ ...p, userName: names.get(p.userId) ?? "Unknown" })));
});

app.delete("/api/payments/:id", ownerOnly, (req, res) => {
  if (!db.deletePayment(req.params.id)) { res.status(404).json({ error: "Payment not found." }); return; }
  res.json({ ok: true });
});

app.post("/api/payments", ownerOnly, (req, res) => {
  const b = req.body ?? {};
  const amount = Number(b.amount);
  if (typeof b.userId !== "string" || !(amount > 0)) { res.status(400).json({ error: "userId and positive amount required." }); return; }
  const user = db.getUserById(b.userId);
  if (!user) { res.status(404).json({ error: "User not found." }); return; }
  const payment = db.addPayment({
    userId: b.userId,
    amount: Math.round(amount * 100) / 100,
    type: ["payroll", "bonus", "job"].includes(b.type) ? b.type : "payroll",
    description: str(b.description, 500),
    jobId: typeof b.jobId === "string" ? b.jobId : undefined,
    periodStart: typeof b.periodStart === "string" ? b.periodStart : undefined,
    periodEnd: typeof b.periodEnd === "string" ? b.periodEnd : undefined,
  });
  db.addNotification({ userId: user.id, message: `You received a payment of $${payment.amount.toFixed(2)}`, type: "success" });
  res.json({ ...payment, userName: user.name });
});

app.post("/api/payroll/bulk", ownerOnly, (req, res) => {
  const userIds: unknown = req.body?.userIds;
  const team = db.getUsersWithStats().filter(u => u.role !== "owner" && u.active);
  const targets = Array.isArray(userIds) && userIds.length ? team.filter(u => userIds.includes(u.id)) : team;
  const results = [];
  for (const u of targets) {
    if (u.totalOwed > 0) {
      const p = db.addPayment({ userId: u.id, amount: u.totalOwed, type: "payroll", description: "Bulk payroll" });
      db.addNotification({ userId: u.id, message: `Payroll paid: $${p.amount.toFixed(2)}`, type: "success" });
      results.push({ ...p, userName: u.name });
    }
  }
  res.json({ paid: results.length, payments: results });
});

app.get("/api/payroll", ownerOnly, (_req, res) => { res.json(db.getUsersWithStats()); });

// ── Expenses ──────────────────────────────────────────────
app.get("/api/expenses", ownerOnly, (_req, res) => { res.json(db.getExpenses()); });

app.post("/api/expenses", ownerOnly, (req, res) => {
  const b = req.body ?? {};
  const title = str(b.title, 200), amount = Number(b.amount);
  if (!title || !(amount > 0)) { res.status(400).json({ error: "Title and positive amount required." }); return; }
  res.json(db.createExpense({ title, amount, category: str(b.category, 50) || "General", vendor: str(b.vendor, 200), notes: str(b.notes, 1000), date: str(b.date, 10) || new Date().toISOString().split("T")[0], recurring: b.recurring === true }));
});

app.patch("/api/expenses/:id", ownerOnly, (req, res) => {
  const e = db.updateExpense(req.params.id, pick(req.body ?? {}, ["title", "amount", "category", "vendor", "notes", "date", "recurring"]) as Parameters<typeof db.updateExpense>[1]);
  if (!e) { res.status(404).json({ error: "Expense not found." }); return; }
  res.json(e);
});

app.delete("/api/expenses/:id", ownerOnly, (req, res) => {
  if (!db.deleteExpense(req.params.id)) { res.status(404).json({ error: "Expense not found." }); return; }
  res.json({ ok: true });
});

// ── Announcements ─────────────────────────────────────────
app.get("/api/announcements", (_req, res) => { res.json(db.getAnnouncements()); });

app.post("/api/announcements", ownerOnly, (req, res) => {
  const title = str(req.body?.title, 200);
  if (!title) { res.status(400).json({ error: "Title required." }); return; }
  const author = me(res);
  const ann = db.createAnnouncement({ title, body: str(req.body?.body, 10000), authorId: author.id, authorName: author.name, pinned: req.body?.pinned === true });
  db.getUsers().filter(u => u.role !== "owner" && u.active).forEach(u => {
    db.addNotification({ userId: u.id, message: `New announcement: ${title}`, type: "info" });
  });
  res.json(ann);
});

app.patch("/api/announcements/:id", ownerOnly, (req, res) => {
  const a = db.updateAnnouncement(req.params.id, pick(req.body ?? {}, ["pinned", "title", "body"]) as Parameters<typeof db.updateAnnouncement>[1]);
  if (!a) { res.status(404).json({ error: "Announcement not found." }); return; }
  res.json(a);
});

app.delete("/api/announcements/:id", ownerOnly, (req, res) => {
  if (!db.deleteAnnouncement(req.params.id)) { res.status(404).json({ error: "Announcement not found." }); return; }
  res.json({ ok: true });
});

// ── Shifts ────────────────────────────────────────────────
const TIME_RE = /^\d{2}:\d{2}$/, DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function shiftOut(s: ReturnType<typeof db.getShifts>[number], names: Map<string, string>) {
  return { ...s, userName: s.userId ? names.get(s.userId) ?? "Unknown" : "Open shift" };
}
function localDateOf(d: Date | string): string {
  const x = typeof d === "string" ? new Date(d) : d;
  return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, "0")}-${String(x.getDate()).padStart(2, "0")}`;
}
function todayStr(): string { return localDateOf(new Date()); }
function activeEmployees() { return db.getUsers().filter(u => u.role !== "owner" && u.active); }
function notifyOwners(message: string, type: "info" | "success" | "warning" = "info") {
  db.getUsers().filter(u => u.role === "owner").forEach(o => db.addNotification({ userId: o.id, message, type }));
}

app.get("/api/shifts", (req, res) => {
  const names = nameMap();
  if (isOwner(res)) {
    res.json(db.getShifts(req.query.userId as string | undefined).map(s => shiftOut(s, names)));
    return;
  }
  const mine = me(res).id, today = todayStr();
  res.json(db.getShifts().filter(s => s.userId === mine || (s.userId === "" && s.date >= today)).map(s => shiftOut(s, names)));
});

app.post("/api/shifts", ownerOnly, (req, res) => {
  const { userId, date, startTime, endTime } = req.body ?? {};
  if (typeof userId !== "string" || !DATE_RE.test(date) || !TIME_RE.test(startTime) || !TIME_RE.test(endTime)) {
    res.status(400).json({ error: "Date, start and end time required." }); return;
  }
  if (startTime === endTime) { res.status(400).json({ error: "Start and end time can't be the same." }); return; }
  const user = userId ? db.getUserById(userId) : null;
  if (userId && !user) { res.status(404).json({ error: "User not found." }); return; }
  const shift = db.createShift({ userId, date, startTime, endTime, title: str(req.body.title, 100), note: str(req.body.note, 500) });
  if (user) db.addNotification({ userId, message: `New shift: ${date} ${startTime}–${endTime}`, type: "info" });
  else activeEmployees().forEach(u => db.addNotification({ userId: u.id, message: `Open shift available: ${date} ${startTime}–${endTime}. First to claim gets it.`, type: "info" }));
  res.json(shiftOut(shift, nameMap()));
});

app.post("/api/shifts/:id/claim", (req, res) => {
  const shift = db.getShift(req.params.id);
  if (!shift) { res.status(404).json({ error: "Shift not found." }); return; }
  if (shift.userId) { res.status(409).json({ error: "Someone already claimed this shift." }); return; }
  if (shift.date < todayStr()) { res.status(400).json({ error: "This shift has already passed." }); return; }
  const u = me(res);
  const clash = db.getShifts(u.id).some(s => s.date === shift.date && s.startTime < shift.endTime && shift.startTime < s.endTime);
  if (clash) { res.status(409).json({ error: "You already have a shift at that time." }); return; }
  const updated = db.updateShift(shift.id, { userId: u.id, dropRequested: false });
  notifyOwners(`${u.name} claimed the open shift on ${shift.date} ${shift.startTime}–${shift.endTime}`, "success");
  res.json(shiftOut(updated!, nameMap()));
});

app.post("/api/shifts/:id/drop", (req, res) => {
  const shift = db.getShift(req.params.id);
  if (!shift || shift.userId !== me(res).id) { res.status(404).json({ error: "Shift not found." }); return; }
  if (shift.date < todayStr()) { res.status(400).json({ error: "This shift has already passed." }); return; }
  const updated = db.updateShift(shift.id, { dropRequested: true });
  notifyOwners(`${me(res).name} asked to drop their shift on ${shift.date} ${shift.startTime}–${shift.endTime}`, "warning");
  res.json(shiftOut(updated!, nameMap()));
});

app.post("/api/shifts/:id/drop/:decision", ownerOnly, (req, res) => {
  const shift = db.getShift(req.params.id);
  if (!shift || !shift.dropRequested) { res.status(404).json({ error: "No pending drop request." }); return; }
  const approve = req.params.decision === "approve";
  if (!approve && req.params.decision !== "deny") { res.status(400).json({ error: "Decision must be approve or deny." }); return; }
  const prevUser = shift.userId;
  const updated = db.updateShift(shift.id, approve ? { userId: "", dropRequested: false } : { dropRequested: false });
  db.addNotification({ userId: prevUser, message: `Your request to drop the ${shift.date} shift was ${approve ? "approved" : "denied"}`, type: approve ? "success" : "warning" });
  if (approve) activeEmployees().filter(u => u.id !== prevUser).forEach(u => db.addNotification({ userId: u.id, message: `Open shift available: ${shift.date} ${shift.startTime}–${shift.endTime}`, type: "info" }));
  res.json(shiftOut(updated!, nameMap()));
});

app.patch("/api/shifts/:id", ownerOnly, (req, res) => {
  const shift = db.updateShift(req.params.id, pick(req.body ?? {}, ["userId", "date", "startTime", "endTime", "title", "note"]) as Parameters<typeof db.updateShift>[1]);
  if (!shift) { res.status(404).json({ error: "Shift not found." }); return; }
  res.json(shiftOut(shift, nameMap()));
});

app.delete("/api/shifts/:id", ownerOnly, (req, res) => {
  if (!db.deleteShift(req.params.id)) { res.status(404).json({ error: "Shift not found." }); return; }
  res.json({ ok: true });
});

// ── Leave Requests ────────────────────────────────────────
app.get("/api/leave", (req, res) => {
  const userId = isOwner(res) ? (req.query.userId as string | undefined) : me(res).id;
  const names = nameMap();
  res.json(db.getLeaveRequests(userId).map(r => ({ ...r, userName: names.get(r.userId) ?? "Unknown" })));
});

app.post("/api/leave", (req, res) => {
  const { startDate, endDate, type } = req.body ?? {};
  if (!DATE_RE.test(startDate) || !DATE_RE.test(endDate)) { res.status(400).json({ error: "Start and end dates required." }); return; }
  if (endDate < startDate) { res.status(400).json({ error: "End date must be on or after start date." }); return; }
  const u = me(res);
  const leaveType = ["vacation", "sick", "personal", "other"].includes(type) ? type : "other";
  const request = db.createLeaveRequest({ userId: u.id, startDate, endDate, type: leaveType, reason: str(req.body.reason, 1000) });
  db.getUsers().filter(x => x.role === "owner").forEach(owner => {
    db.addNotification({ userId: owner.id, message: `${u.name} requested ${leaveType} leave (${startDate} – ${endDate})`, type: "info" });
  });
  res.json({ ...request, userName: u.name });
});

app.patch("/api/leave/:id", ownerOnly, (req, res) => {
  const { status } = req.body ?? {};
  if (status !== "approved" && status !== "denied") { res.status(400).json({ error: "status must be approved or denied." }); return; }
  const request = db.updateLeaveRequest(req.params.id, status);
  if (!request) { res.status(404).json({ error: "Request not found." }); return; }
  db.addNotification({ userId: request.userId, message: `Your ${request.type} leave request (${request.startDate} – ${request.endDate}) was ${status}`, type: status === "approved" ? "success" : "warning" });
  res.json(request);
});

app.delete("/api/leave/:id", (req, res) => {
  const reqs = db.getLeaveRequests(isOwner(res) ? undefined : me(res).id);
  const target = reqs.find(r => r.id === req.params.id);
  if (!target) { res.status(404).json({ error: "Request not found." }); return; }
  if (!isOwner(res) && target.status !== "pending") { res.status(400).json({ error: "Only pending requests can be cancelled." }); return; }
  db.deleteLeaveRequest(req.params.id);
  res.json({ ok: true });
});

// ── Tasks ─────────────────────────────────────────────────
app.get("/api/tasks", (req, res) => {
  const userId = isOwner(res) ? (req.query.userId as string | undefined) : me(res).id;
  const names = nameMap();
  res.json(db.getTasks(userId).map(t => ({ ...t, assigneeName: names.get(t.assignedTo) ?? "Unknown" })));
});

app.post("/api/tasks", ownerOnly, (req, res) => {
  const title = str(req.body?.title, 200);
  const assignedTo = req.body?.assignedTo;
  if (!title || typeof assignedTo !== "string" || !db.getUserById(assignedTo)) { res.status(400).json({ error: "Title and assignee required." }); return; }
  const dueDate = DATE_RE.test(req.body?.dueDate) ? req.body.dueDate : null;
  const task = db.createTask({ title, description: str(req.body?.description, 2000), assignedTo, dueDate, createdBy: me(res).id });
  if (assignedTo !== me(res).id) db.addNotification({ userId: assignedTo, message: `New task: ${title}${dueDate ? ` (due ${dueDate})` : ""}`, type: "info" });
  res.json(task);
});

app.patch("/api/tasks/:id", (req, res) => {
  const task = db.getTask(req.params.id);
  if (!task) { res.status(404).json({ error: "Task not found." }); return; }
  const b = req.body ?? {};
  let updates;
  if (isOwner(res)) {
    updates = pick(b, ["title", "description", "assignedTo", "dueDate", "done"]);
  } else {
    if (task.assignedTo !== me(res).id) { res.status(403).json({ error: "Forbidden." }); return; }
    updates = pick(b, ["done"]);
  }
  if (updates.done !== undefined) updates.done = updates.done === true;
  const updated = db.updateTask(req.params.id, updates as Parameters<typeof db.updateTask>[1]);
  if (updated?.done && !task.done && !isOwner(res)) {
    db.getUsers().filter(u => u.role === "owner").forEach(o => db.addNotification({ userId: o.id, message: `${me(res).name} completed: ${task.title}`, type: "success" }));
  }
  res.json(updated);
});

app.delete("/api/tasks/:id", ownerOnly, (req, res) => {
  if (!db.deleteTask(req.params.id)) { res.status(404).json({ error: "Task not found." }); return; }
  res.json({ ok: true });
});

// ── Clients ───────────────────────────────────────────────
const CLIENT_FIELDS = ["name", "email", "phone", "address", "notes"] as const;
function cleanClient(b: Record<string, unknown>) {
  const out: Record<string, string> = {};
  for (const k of CLIENT_FIELDS) if (k in b) out[k] = str(b[k], k === "notes" || k === "address" ? 1000 : 200);
  return out;
}

app.get("/api/clients", ownerOnly, (_req, res) => { res.json(db.getClients()); });

app.post("/api/clients", ownerOnly, (req, res) => {
  const c = cleanClient(req.body ?? {});
  if (!c.name) { res.status(400).json({ error: "Client name required." }); return; }
  res.json(db.createClient({ name: c.name, email: c.email ?? "", phone: c.phone ?? "", address: c.address ?? "", notes: c.notes ?? "" }));
});

app.patch("/api/clients/:id", ownerOnly, (req, res) => {
  const c = db.updateClient(req.params.id, cleanClient(req.body ?? {}));
  if (!c) { res.status(404).json({ error: "Client not found." }); return; }
  res.json(c);
});

app.delete("/api/clients/:id", ownerOnly, (req, res) => {
  if (db.getInvoices().some(i => i.clientId === req.params.id)) { res.status(409).json({ error: "This client has invoices. Delete those first." }); return; }
  if (!db.deleteClient(req.params.id)) { res.status(404).json({ error: "Client not found." }); return; }
  res.json({ ok: true });
});

// ── Invoices ──────────────────────────────────────────────
function cleanItems(raw: unknown): InvoiceItem[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map(i => ({ description: str(i?.description, 300), quantity: Number(i?.quantity) || 0, unitPrice: Number(i?.unitPrice) || 0 }))
    .filter(i => i.description && i.quantity > 0 && i.unitPrice >= 0);
}

function enrichInvoice(inv: ReturnType<typeof db.getInvoices>[number]) {
  const client = db.getClients().find(c => c.id === inv.clientId);
  const overdue = inv.status !== "paid" && inv.dueDate < new Date().toISOString().slice(0, 10);
  return { ...inv, clientName: client?.name ?? "Unknown client", clientEmail: client?.email ?? "", clientAddress: client?.address ?? "", total: invoiceTotal(inv), overdue };
}

app.get("/api/invoices", ownerOnly, (_req, res) => {
  res.json(db.getInvoices().map(enrichInvoice).sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
});

app.post("/api/invoices", ownerOnly, (req, res) => {
  const b = req.body ?? {};
  const items = cleanItems(b.items);
  if (typeof b.clientId !== "string" || !db.getClients().some(c => c.id === b.clientId)) { res.status(400).json({ error: "Choose a client." }); return; }
  if (items.length === 0) { res.status(400).json({ error: "Add at least one line item." }); return; }
  const today = new Date().toISOString().slice(0, 10);
  const inv = db.createInvoice({
    clientId: b.clientId,
    jobId: typeof b.jobId === "string" && b.jobId ? b.jobId : undefined,
    items,
    taxRate: Math.min(100, Math.max(0, Number(b.taxRate) || 0)),
    status: ["draft", "sent", "paid"].includes(b.status) ? b.status : "draft",
    issueDate: DATE_RE.test(b.issueDate) ? b.issueDate : today,
    dueDate: DATE_RE.test(b.dueDate) ? b.dueDate : today,
    notes: str(b.notes, 2000),
  });
  res.json(enrichInvoice(inv));
});

app.patch("/api/invoices/:id", ownerOnly, (req, res) => {
  const b = req.body ?? {};
  const updates: Record<string, unknown> = {};
  if (b.items !== undefined) { const items = cleanItems(b.items); if (!items.length) { res.status(400).json({ error: "Add at least one line item." }); return; } updates.items = items; }
  if (b.status !== undefined) { if (!["draft", "sent", "paid"].includes(b.status)) { res.status(400).json({ error: "Invalid status." }); return; } updates.status = b.status; }
  if (b.taxRate !== undefined) updates.taxRate = Math.min(100, Math.max(0, Number(b.taxRate) || 0));
  if (DATE_RE.test(b.issueDate)) updates.issueDate = b.issueDate;
  if (DATE_RE.test(b.dueDate)) updates.dueDate = b.dueDate;
  if (typeof b.notes === "string") updates.notes = b.notes.slice(0, 2000);
  if (typeof b.clientId === "string" && db.getClients().some(c => c.id === b.clientId)) updates.clientId = b.clientId;
  const inv = db.updateInvoice(req.params.id, updates);
  if (!inv) { res.status(404).json({ error: "Invoice not found." }); return; }
  res.json(enrichInvoice(inv));
});

app.delete("/api/invoices/:id", ownerOnly, (req, res) => {
  if (!db.deleteInvoice(req.params.id)) { res.status(404).json({ error: "Invoice not found." }); return; }
  res.json({ ok: true });
});

// ── Time correction requests ──────────────────────────────
app.get("/api/time-requests", (_req, res) => {
  const names = nameMap();
  res.json(db.getTimeRequests(isOwner(res) ? undefined : me(res).id).map(r => ({ ...r, userName: names.get(r.userId) ?? "Unknown" })));
});

app.post("/api/time-requests", (req, res) => {
  const { clockIn, clockOut } = req.body ?? {};
  const ci = Date.parse(clockIn), co = Date.parse(clockOut);
  if (!isFinite(ci) || !isFinite(co)) { res.status(400).json({ error: "Start and end time required." }); return; }
  if (co <= ci) { res.status(400).json({ error: "End time must be after start time." }); return; }
  if (co - ci > 24 * 3600e3) { res.status(400).json({ error: "A single entry can't be longer than 24 hours." }); return; }
  if (co > Date.now() + 5 * 60e3) { res.status(400).json({ error: "You can't add time in the future." }); return; }
  const reason = str(req.body?.reason, 500);
  if (!reason) { res.status(400).json({ error: "Tell your manager what happened." }); return; }
  const u = me(res);
  const r = db.createTimeRequest({ userId: u.id, clockIn: new Date(ci).toISOString(), clockOut: new Date(co).toISOString(), reason });
  notifyOwners(`${u.name} asked to add missed time (${((co - ci) / 3600e3).toFixed(1)}h on ${localDateOf(new Date(ci))})`, "info");
  res.json({ ...r, userName: u.name });
});

app.patch("/api/time-requests/:id", ownerOnly, (req, res) => {
  const status = req.body?.status;
  if (status !== "approved" && status !== "denied") { res.status(400).json({ error: "status must be approved or denied." }); return; }
  const r = db.reviewTimeRequest(req.params.id, status, me(res));
  if (!r) { res.status(404).json({ error: "Request not found or already reviewed." }); return; }
  db.addNotification({ userId: r.userId, message: `Your time correction for ${localDateOf(r.clockIn)} was ${status}`, type: status === "approved" ? "success" : "warning" });
  res.json(r);
});

// ── Team chat ─────────────────────────────────────────────
function canUseChannel(u: User, channel: string): boolean {
  if (channel === "team") return true;
  const m = /^dm:([\w-]+):([\w-]+)$/.exec(channel);
  if (!m || (m[1] !== u.id && m[2] !== u.id)) return false;
  const other = m[1] === u.id ? m[2] : m[1];
  return !!db.getUserById(other);
}

app.get("/api/chat/channels", (_req, res) => {
  const u = me(res);
  const people = db.getUsers().filter(x => x.id !== u.id && x.active);
  const channels = ["team", ...people.map(p => dmChannel(u.id, p.id))];
  const summary = db.chatSummary(u.id, channels);
  res.json(summary.map((s, i) => ({
    ...s,
    name: i === 0 ? "Whole team" : people[i - 1].name,
    title: i === 0 ? `${people.length + 1} members` : people[i - 1].title,
    userId: i === 0 ? null : people[i - 1].id,
  })));
});

app.get("/api/chat/:channel", (req, res) => {
  if (!canUseChannel(me(res), req.params.channel)) { res.status(403).json({ error: "Forbidden." }); return; }
  const names = nameMap();
  res.json(db.getMessages(req.params.channel).map(m => ({ ...m, senderName: names.get(m.senderId) ?? "Former member" })));
});

app.post("/api/chat/:channel", (req, res) => {
  const u = me(res);
  if (!canUseChannel(u, req.params.channel)) { res.status(403).json({ error: "Forbidden." }); return; }
  const text = str(req.body?.text, 2000);
  if (!text) { res.status(400).json({ error: "Message can't be empty." }); return; }
  const msg = db.addMessage(req.params.channel, u.id, text);
  res.json({ ...msg, senderName: u.name });
});

app.post("/api/chat/:channel/read", (req, res) => {
  if (!canUseChannel(me(res), req.params.channel)) { res.status(403).json({ error: "Forbidden." }); return; }
  db.markChannelRead(me(res).id, req.params.channel);
  res.json({ ok: true });
});

// ── Reports ───────────────────────────────────────────────
app.get("/api/reports", ownerOnly, (req, res) => {
  const from = DATE_RE.test(String(req.query.from)) ? String(req.query.from) : "0000-01-01";
  const to = DATE_RE.test(String(req.query.to)) ? String(req.query.to) : "9999-12-31";
  const data = db.getAllData();
  const rate = new Map(data.users.map(u => [u.id, u.hourlyRate]));
  const names = new Map(data.users.map(u => [u.id, u.name]));
  const localDate = localDateOf;
  const inRange = (d: string) => d >= from && d <= to;
  const lines = laborLines(data.timeEntries, id => rate.get(id) ?? 0, data.company?.settings ?? DEFAULT_SETTINGS).filter(l => inRange(localDate(l.entry.clockIn)));

  const byEmployee = new Map<string, { userId: string; name: string; hours: number; regularHours: number; overtimeHours: number; laborCost: number; shifts: number }>();
  const byJob = new Map<string, { jobId: string; title: string; clientName: string; hours: number; laborCost: number; revenue: number }>();
  const jobs = new Map(data.jobs.map(j => [j.id, j]));
  const clients = new Map(data.clients.map(c => [c.id, c]));
  for (const l of lines) {
    const e = byEmployee.get(l.entry.userId) ?? { userId: l.entry.userId, name: names.get(l.entry.userId) ?? "Former employee", hours: 0, regularHours: 0, overtimeHours: 0, laborCost: 0, shifts: 0 };
    e.hours += l.hours; e.regularHours += l.regularHours; e.overtimeHours += l.overtimeHours; e.laborCost += l.pay; e.shifts += 1;
    byEmployee.set(l.entry.userId, e);
    if (l.entry.jobId) {
      const job = jobs.get(l.entry.jobId);
      const j = byJob.get(l.entry.jobId) ?? { jobId: l.entry.jobId, title: job?.title ?? "Deleted job", clientName: job?.clientId ? clients.get(job.clientId)?.name ?? "" : "", hours: 0, laborCost: 0, revenue: 0 };
      j.hours += l.hours; j.laborCost += l.pay;
      byJob.set(l.entry.jobId, j);
    }
  }

  const invoicesIssued = data.invoices.filter(i => inRange(i.issueDate));
  const invoicesPaid = data.invoices.filter(i => i.status === "paid" && i.paidAt && inRange(localDate(i.paidAt)));
  for (const inv of invoicesPaid) {
    if (!inv.jobId) continue;
    const job = jobs.get(inv.jobId);
    const j = byJob.get(inv.jobId) ?? { jobId: inv.jobId, title: job?.title ?? "Deleted job", clientName: clients.get(inv.clientId)?.name ?? "", hours: 0, laborCost: 0, revenue: 0 };
    j.revenue += invoiceTotal(inv);
    byJob.set(inv.jobId, j);
  }

  const byClient = data.clients.map(c => ({
    clientId: c.id,
    name: c.name,
    invoiced: invoicesIssued.filter(i => i.clientId === c.id).reduce((s, i) => s + invoiceTotal(i), 0),
    collected: invoicesPaid.filter(i => i.clientId === c.id).reduce((s, i) => s + invoiceTotal(i), 0),
    laborCost: lines.filter(l => l.entry.jobId && jobs.get(l.entry.jobId)?.clientId === c.id).reduce((s, l) => s + l.pay, 0),
  })).filter(c => c.invoiced || c.collected || c.laborCost);

  const expenses = data.expenses.filter(e => inRange(e.date));
  const expensesByCategory = new Map<string, number>();
  for (const e of expenses) expensesByCategory.set(e.category, (expensesByCategory.get(e.category) ?? 0) + e.amount);

  const revenue = invoicesPaid.reduce((s, i) => s + invoiceTotal(i), 0);
  const laborCost = lines.reduce((s, l) => s + l.pay, 0);
  const expenseTotal = expenses.reduce((s, e) => s + e.amount, 0);
  const r2 = (n: number) => Math.round(n * 100) / 100;

  res.json({
    from, to,
    totals: {
      revenue: r2(revenue),
      invoiced: r2(invoicesIssued.reduce((s, i) => s + invoiceTotal(i), 0)),
      laborCost: r2(laborCost),
      expenses: r2(expenseTotal),
      profit: r2(revenue - laborCost - expenseTotal),
      hours: lines.reduce((s, l) => s + l.hours, 0),
      overtimeHours: lines.reduce((s, l) => s + l.overtimeHours, 0),
      wagesPaid: r2(data.payments.filter(p => inRange(localDate(p.paidAt))).reduce((s, p) => s + p.amount, 0)),
    },
    byEmployee: [...byEmployee.values()].map(e => ({ ...e, laborCost: r2(e.laborCost) })).sort((a, b) => b.hours - a.hours),
    byJob: [...byJob.values()].map(j => ({ ...j, laborCost: r2(j.laborCost), revenue: r2(j.revenue), profit: r2(j.revenue - j.laborCost) })).sort((a, b) => b.laborCost - a.laborCost),
    byClient: byClient.map(c => ({ ...c, invoiced: r2(c.invoiced), collected: r2(c.collected), laborCost: r2(c.laborCost) })).sort((a, b) => b.collected - a.collected),
    expensesByCategory: [...expensesByCategory.entries()].map(([category, amount]) => ({ category, amount: r2(amount) })).sort((a, b) => b.amount - a.amount),
  });
});

// ── Notifications ─────────────────────────────────────────
app.get("/api/notifications", (_req, res) => { res.json(db.getNotifications(me(res).id)); });

app.post("/api/notifications/read-all", (_req, res) => {
  db.markAllNotificationsRead(me(res).id);
  res.json({ ok: true });
});

app.patch("/api/notifications/:id/read", (req, res) => {
  if (!db.getNotifications(me(res).id).some(n => n.id === req.params.id)) { res.status(404).json({ error: "Not found." }); return; }
  db.markNotificationRead(req.params.id);
  res.json({ ok: true });
});

// ── Employee Notes ────────────────────────────────────────
app.get("/api/team/:id/notes", ownerOnly, (req, res) => { res.json(db.getEmployeeNotes(req.params.id)); });

app.post("/api/team/:id/notes", ownerOnly, (req, res) => {
  const text = str(req.body?.text, 2000);
  if (!text) { res.status(400).json({ error: "Note text required." }); return; }
  const author = me(res);
  res.json(db.addEmployeeNote({ userId: req.params.id, text, authorId: author.id, authorName: author.name }));
});

app.delete("/api/team/notes/:noteId", ownerOnly, (req, res) => {
  if (!db.deleteEmployeeNote(req.params.noteId)) { res.status(404).json({ error: "Note not found." }); return; }
  res.json({ ok: true });
});

// ── Analytics ─────────────────────────────────────────────
app.get("/api/analytics", ownerOnly, (_req, res) => {
  const team = db.getUsersWithStats().filter(u => u.role !== "owner" && u.active);
  const totalPaidOut = db.getPayments().reduce((s, p) => s + p.amount, 0);
  res.json({ team, dailyHours: db.getDailyHours(undefined, 7), weeklyPayroll: db.getWeeklyPayroll(6), totalPaidOut });
});

// ── Smart insights ────────────────────────────────────────
interface Insight { id: string; level: "critical" | "warning" | "info" | "success"; title: string; detail: string; page?: string; }

app.get("/api/insights", ownerOnly, (_req, res) => {
  const insights: Insight[] = [];
  const team = db.getUsersWithStats().filter(u => u.role !== "owner" && u.active);
  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

  const forgot = db.getTimeEntries().filter(e => !e.clockOut && hoursFor(e) > 12);
  for (const e of forgot) {
    const u = team.find(t => t.id === e.userId);
    if (u) insights.push({ id: `forgot-${e.id}`, level: "critical", title: `${u.name} may have forgotten to clock out`, detail: `Clocked in for ${hoursFor(e).toFixed(1)} hours straight.`, page: "owner-time" });
  }

  const ot = settings().overtimeThreshold;
  for (const u of team.filter(t => t.weekHours > ot)) {
    insights.push({ id: `ot-${u.id}`, level: "warning", title: `${u.name} is in overtime`, detail: `${u.weekHours.toFixed(1)}h this week (${(u.weekHours - ot).toFixed(1)}h over ${ot}).`, page: "owner-time" });
  }
  for (const u of team.filter(t => t.weekHours > ot * 0.85 && t.weekHours <= ot)) {
    insights.push({ id: `near-ot-${u.id}`, level: "info", title: `${u.name} is close to overtime`, detail: `${u.weekHours.toFixed(1)}h logged; ${(ot - u.weekHours).toFixed(1)}h left before ${ot}.`, page: "owner-schedule" });
  }

  const nowMin = now.getHours() * 60 + now.getMinutes();
  const approvedLeave = db.getLeaveRequests().filter(r => r.status === "approved" && r.startDate <= today && r.endDate >= today);
  for (const s of db.getShifts().filter(s => s.date === today)) {
    const [h, m] = s.startTime.split(":").map(Number);
    if (nowMin < h * 60 + m + 15) continue;
    if (approvedLeave.some(r => r.userId === s.userId)) continue;
    const u = team.find(t => t.id === s.userId);
    const showedUp = db.getTimeEntries(s.userId).some(e => localDateOf(e.clockIn) === today || !e.clockOut);
    if (u && !showedUp) insights.push({ id: `noshow-${s.id}`, level: "critical", title: `${u.name} hasn't clocked in`, detail: `Shift started at ${s.startTime}.`, page: "owner-schedule" });
  }

  const weekAhead = localDateOf(new Date(now.getTime() + 7 * 864e5));
  const openSoon = db.getShifts().filter(s => !s.userId && s.date >= today && s.date <= weekAhead).length;
  if (openSoon) insights.push({ id: "open-shifts", level: "warning", title: `${openSoon} open shift${openSoon > 1 ? "s" : ""} not yet claimed`, detail: "Unfilled shifts in the next 7 days.", page: "owner-schedule" });
  const drops = db.getShifts().filter(s => s.dropRequested && s.date >= today).length;
  if (drops) insights.push({ id: "drops", level: "warning", title: `${drops} shift drop request${drops > 1 ? "s" : ""}`, detail: "Approve or deny so coverage is clear.", page: "owner-schedule" });
  const fence = settings().geofence;
  if (fence.enabled && !fence.enforce) {
    const weekAgo = localDateOf(new Date(now.getTime() - 7 * 864e5));
    const offsite = db.getTimeEntries().filter(e => localDateOf(e.clockIn) >= weekAgo && (e.distanceM ?? 0) > fence.radiusM);
    if (offsite.length) insights.push({ id: "offsite", level: "warning", title: `${offsite.length} clock-in${offsite.length > 1 ? "s" : ""} outside the work site`, detail: "In the last 7 days. Check Time Tracking for locations.", page: "owner-time" });
  }

  const pendingFixes = db.getTimeRequests().filter(r => r.status === "pending").length;
  if (pendingFixes) insights.push({ id: "time-fixes", level: "warning", title: `${pendingFixes} time correction${pendingFixes > 1 ? "s" : ""} to review`, detail: "Employees reported missed clock-ins.", page: "owner-time" });

  const pendingLeave = db.getLeaveRequests().filter(r => r.status === "pending").length;
  if (pendingLeave) insights.push({ id: "leave", level: "warning", title: `${pendingLeave} leave request${pendingLeave > 1 ? "s" : ""} awaiting review`, detail: "Employees are waiting on an answer.", page: "owner-leave" });

  const invoices = db.getInvoices().map(enrichInvoice);
  const overdue = invoices.filter(i => i.overdue);
  if (overdue.length) {
    const amt = overdue.reduce((s, i) => s + i.total, 0);
    insights.push({ id: "inv-overdue", level: "critical", title: `${overdue.length} overdue invoice${overdue.length > 1 ? "s" : ""}`, detail: `$${amt.toFixed(2)} past due. Follow up with clients.`, page: "owner-invoices" });
  }
  const drafts = invoices.filter(i => i.status === "draft").length;
  if (drafts) insights.push({ id: "inv-draft", level: "info", title: `${drafts} draft invoice${drafts > 1 ? "s" : ""} not sent`, detail: "Send them to get paid sooner.", page: "owner-invoices" });

  const doneJobs = db.getJobs().filter(j => j.status === "completed" && j.clientId);
  const unbilled = doneJobs.filter(j => !db.getInvoices().some(i => i.jobId === j.id));
  if (unbilled.length) insights.push({ id: "unbilled", level: "warning", title: `${unbilled.length} completed job${unbilled.length > 1 ? "s" : ""} not invoiced`, detail: unbilled.slice(0, 3).map(j => j.title).join(", "), page: "owner-invoices" });

  const lateJobs = db.getJobs().filter(j => j.status !== "completed" && j.dueDate && j.dueDate < today);
  if (lateJobs.length) insights.push({ id: "late-jobs", level: "warning", title: `${lateJobs.length} job${lateJobs.length > 1 ? "s" : ""} past due date`, detail: lateJobs.slice(0, 3).map(j => j.title).join(", "), page: "owner-jobs" });

  const lateTasks = db.getTasks().filter(t => !t.done && t.dueDate && t.dueDate < today);
  if (lateTasks.length) insights.push({ id: "late-tasks", level: "warning", title: `${lateTasks.length} overdue task${lateTasks.length > 1 ? "s" : ""}`, detail: "Check in with your team.", page: "owner-tasks" });

  const owed = team.filter(u => u.totalOwed > 0);
  if (owed.length) {
    const amt = owed.reduce((s, u) => s + u.totalOwed, 0);
    insights.push({ id: "owed", level: "info", title: `$${amt.toFixed(2)} in unpaid wages`, detail: `${owed.length} employee${owed.length > 1 ? "s" : ""} with a balance.`, page: "owner-payroll" });
  }

  const unscheduled = team.filter(u => !db.getShifts(u.id).some(s => s.date >= today));
  if (team.length && unscheduled.length === team.length) insights.push({ id: "no-schedule", level: "info", title: "No upcoming shifts scheduled", detail: "Build next week's schedule so everyone knows when to work.", page: "owner-schedule" });

  if (insights.length === 0) insights.push({ id: "allgood", level: "success", title: "Everything is on track", detail: "No issues need your attention right now." });

  const order = { critical: 0, warning: 1, info: 2, success: 3 };
  insights.sort((a, b) => order[a.level] - order[b.level]);
  res.json(insights);
});

// ── Activity feed ─────────────────────────────────────────
app.get("/api/activity", ownerOnly, (_req, res) => {
  const names = nameMap();
  const events: Array<{ id: string; type: string; ts: string; actor: string; title: string; sub: string; meta?: Record<string, string | number> }> = [];

  for (const e of db.getTimeEntries()) {
    const name = names.get(e.userId) ?? "Unknown";
    events.push({ id: `ci-${e.id}`, type: "clock_in", ts: e.clockIn, actor: name, title: `${name} clocked in`, sub: e.notes ? `Note: ${e.notes}` : "Started shift" });
    if (e.clockOut) {
      const hrs = hoursFor(e);
      events.push({ id: `co-${e.id}`, type: "clock_out", ts: e.clockOut, actor: name, title: `${name} clocked out`, sub: `${hrs.toFixed(1)}h shift`, meta: { hours: hrs } });
    }
  }
  for (const p of db.getPayments()) {
    const name = names.get(p.userId) ?? "Unknown";
    const label = p.type === "payroll" ? "Payroll" : p.type === "bonus" ? "Bonus" : "Job payment";
    events.push({ id: `pay-${p.id}`, type: "payment", ts: p.paidAt, actor: name, title: `${label} — ${name}`, sub: `$${p.amount.toFixed(2)}${p.description ? ` · ${p.description}` : ""}`, meta: { amount: p.amount } });
  }
  for (const j of db.getJobs()) {
    events.push({ id: `jc-${j.id}`, type: "job_created", ts: j.createdAt, actor: "Owner", title: `Job created: ${j.title}`, sub: `${j.category} · ${j.priority} priority` });
    if (j.completedAt) events.push({ id: `jd-${j.id}`, type: "job_done", ts: j.completedAt, actor: "Owner", title: `Job completed: ${j.title}`, sub: j.category });
  }
  for (const a of db.getAnnouncements()) {
    events.push({ id: `ann-${a.id}`, type: "announcement", ts: a.createdAt, actor: a.authorName, title: a.title, sub: a.body.length > 80 ? a.body.slice(0, 80) + "…" : a.body });
  }
  events.sort((a, b) => new Date(b.ts).getTime() - new Date(a.ts).getTime());
  res.json(events.slice(0, 200));
});

app.use("/api", (_req, res) => { res.status(404).json({ error: "Not found." }); });

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err);
  res.status(500).json({ error: "Something went wrong. Please try again." });
});

function formatDistance(m: number): string {
  return m >= 1000 ? `${(m / 1000).toFixed(1)} km` : `${Math.round(m)} m`;
}

if (process.env.NODE_ENV === "production") {
  const clientDist = path.join(__dirname, "..", "dist", "client");
  app.use(express.static(clientDist));
  app.get("*", (_req, res) => { res.sendFile(path.join(clientDist, "index.html")); });
}

app.listen(PORT, () => { console.log(`WorkBase server on http://localhost:${PORT}`); });
