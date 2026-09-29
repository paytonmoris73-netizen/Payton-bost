import "dotenv/config";
import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { db } from "./db.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT) || 8787;

const app = express();
app.use(express.json());

// ── Status / Company ──────────────────────────────────────
app.get("/api/status", (_req, res) => { res.json({ setup: db.isSetup() }); });

app.get("/api/company", (_req, res) => {
  const c = db.getCompany();
  if (!c) { res.status(404).json({ error: "Not set up" }); return; }
  res.json(c);
});

app.post("/api/setup", (req, res) => {
  const { companyName, ownerName } = req.body as { companyName?: string; ownerName?: string };
  if (!companyName?.trim() || !ownerName?.trim()) { res.status(400).json({ error: "Company name and owner name required." }); return; }
  if (db.isSetup()) { res.status(409).json({ error: "Already set up." }); return; }
  res.json(db.setup(companyName.trim(), ownerName.trim()));
});

app.patch("/api/company", (req, res) => {
  const { name } = req.body as { name?: string };
  if (!name?.trim()) { res.status(400).json({ error: "Name required." }); return; }
  const c = db.updateCompany({ name: name.trim() });
  if (!c) { res.status(404).json({ error: "Not set up." }); return; }
  res.json(c);
});

app.post("/api/company/regenerate-code", (_req, res) => {
  const code = db.regenerateJoinCode();
  if (!code) { res.status(404).json({ error: "Not set up." }); return; }
  res.json({ joinCode: code });
});

// ── Auth ──────────────────────────────────────────────────
app.post("/api/auth/login", (req, res) => {
  const { name } = req.body as { name?: string };
  const user = name?.trim() ? db.getUserByName(name.trim()) : null;
  if (!user) { res.status(404).json({ error: "User not found." }); return; }
  if (!user.active) { res.status(403).json({ error: "Account inactive." }); return; }
  res.json(user);
});

app.post("/api/auth/join", (req, res) => {
  const { code, name } = req.body as { code?: string; name?: string };
  if (!code?.trim() || !name?.trim()) { res.status(400).json({ error: "Code and name required." }); return; }
  const existing = db.getUserByName(name.trim());
  if (existing) { res.json(existing); return; }
  const user = db.joinByCode(code.trim(), name.trim());
  if (!user) { res.status(400).json({ error: "Invalid join code." }); return; }
  res.json(user);
});

// ── Team ──────────────────────────────────────────────────
app.get("/api/team", (_req, res) => { res.json(db.getUsersWithStats()); });

app.get("/api/me/:userId", (req, res) => {
  const u = db.getUserWithStats(req.params.userId);
  if (!u) { res.status(404).json({ error: "User not found." }); return; }
  res.json(u);
});

app.post("/api/team", (req, res) => {
  const { name, hourlyRate, title } = req.body as { name?: string; hourlyRate?: number; title?: string };
  if (!name?.trim()) { res.status(400).json({ error: "Name required." }); return; }
  if (db.getUserByName(name.trim())) { res.status(409).json({ error: "User with this name already exists." }); return; }
  res.json(db.addUser(name.trim(), Number(hourlyRate) || 0, title?.trim() || "Employee"));
});

app.patch("/api/team/:id", (req, res) => {
  const u = db.updateUser(req.params.id, req.body as Partial<{ name: string; hourlyRate: number; active: boolean; title: string }>);
  if (!u) { res.status(404).json({ error: "User not found." }); return; }
  res.json(u);
});

// ── Time ──────────────────────────────────────────────────
app.get("/api/time", (req, res) => {
  const { userId } = req.query as { userId?: string };
  const entries = db.getTimeEntries(userId);
  const userMap = new Map(db.getUsers().map(u => [u.id, u]));
  const enriched = entries.map(e => ({ ...e, userName: userMap.get(e.userId)?.name ?? "Unknown", hours: calcHours(e.clockIn, e.clockOut) }));
  enriched.sort((a, b) => new Date(b.clockIn).getTime() - new Date(a.clockIn).getTime());
  res.json(enriched);
});

app.post("/api/time/clock-in", (req, res) => {
  const { userId, notes, jobId } = req.body as { userId?: string; notes?: string; jobId?: string };
  if (!userId) { res.status(400).json({ error: "userId required." }); return; }
  const entry = db.clockIn(userId, notes ?? "", jobId);
  if (!entry) { res.status(409).json({ error: "Already clocked in." }); return; }
  res.json(entry);
});

app.post("/api/time/clock-out", (req, res) => {
  const { userId, notes } = req.body as { userId?: string; notes?: string };
  if (!userId) { res.status(400).json({ error: "userId required." }); return; }
  const entry = db.clockOut(userId, notes);
  if (!entry) { res.status(409).json({ error: "Not clocked in." }); return; }
  res.json(entry);
});

app.patch("/api/time/:id", (req, res) => {
  const { clockIn, clockOut, notes } = req.body as { clockIn?: string; clockOut?: string | null; notes?: string };
  const updates: Parameters<typeof db.updateTimeEntry>[1] = {};
  if (clockIn) updates.clockIn = clockIn;
  if (clockOut !== undefined) updates.clockOut = clockOut;
  if (notes !== undefined) updates.notes = notes;
  const e = db.updateTimeEntry(req.params.id, updates);
  if (!e) { res.status(404).json({ error: "Entry not found." }); return; }
  const userMap = new Map(db.getUsers().map(u => [u.id, u]));
  res.json({ ...e, userName: userMap.get(e.userId)?.name ?? "Unknown", hours: calcHours(e.clockIn, e.clockOut) });
});

app.delete("/api/time/:id", (req, res) => {
  const ok = db.deleteTimeEntry(req.params.id);
  if (!ok) { res.status(404).json({ error: "Entry not found." }); return; }
  res.json({ ok: true });
});

app.get("/api/time/status", (req, res) => {
  const { userId } = req.query as { userId?: string };
  if (!userId) { res.status(400).json({ error: "userId required." }); return; }
  const entry = db.getOpenEntry(userId);
  res.json({ clocked: entry !== null, entry: entry ?? null });
});

// ── Breaks ────────────────────────────────────────────────
app.post("/api/time/:id/break/start", (req, res) => {
  const entry = db.startBreak(req.params.id);
  if (!entry) { res.status(409).json({ error: "Entry not found or already on break." }); return; }
  res.json(entry);
});

app.post("/api/time/:id/break/end", (req, res) => {
  const entry = db.endBreak(req.params.id);
  if (!entry) { res.status(409).json({ error: "Entry not found or not on break." }); return; }
  res.json(entry);
});

// ── Jobs ──────────────────────────────────────────────────
app.get("/api/jobs", (req, res) => {
  const { userId } = req.query as { userId?: string };
  const jobs = db.getJobs();
  const filtered = userId ? jobs.filter(j => j.assignedTo.includes(userId) || j.assignedTo.length === 0) : jobs;
  filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  res.json(filtered);
});

app.post("/api/jobs", (req, res) => {
  const body = req.body as {
    title?: string; description?: string; category?: string;
    payType?: string; payAmount?: number; assignedTo?: string[];
    priority?: string; dueDate?: string | null;
  };
  if (!body.title?.trim()) { res.status(400).json({ error: "Title required." }); return; }
  const job = db.createJob({
    title: body.title.trim(),
    description: body.description?.trim() ?? "",
    category: body.category?.trim() || "General",
    payType: (body.payType === "hourly" ? "hourly" : "fixed"),
    payAmount: Number(body.payAmount) || 0,
    assignedTo: Array.isArray(body.assignedTo) ? body.assignedTo : [],
    status: "open",
    priority: (["high","urgent"].includes(body.priority ?? "") ? body.priority as "high"|"urgent" : "normal"),
    dueDate: body.dueDate ?? null,
  });
  res.json(job);
});

app.patch("/api/jobs/:id", (req, res) => {
  const job = db.updateJob(req.params.id, req.body as Parameters<typeof db.updateJob>[1]);
  if (!job) { res.status(404).json({ error: "Job not found." }); return; }
  res.json(job);
});

app.delete("/api/jobs/:id", (req, res) => {
  const ok = db.deleteJob(req.params.id);
  if (!ok) { res.status(404).json({ error: "Job not found." }); return; }
  res.json({ ok: true });
});

// ── Payments ──────────────────────────────────────────────
app.get("/api/payments", (req, res) => {
  const { userId } = req.query as { userId?: string };
  const pays = db.getPayments(userId);
  const userMap = new Map(db.getUsers().map(u => [u.id, u]));
  res.json(pays.map(p => ({ ...p, userName: userMap.get(p.userId)?.name ?? "Unknown" })));
});

app.delete("/api/payments/:id", (req, res) => {
  const ok = db.deletePayment(req.params.id);
  if (!ok) { res.status(404).json({ error: "Payment not found." }); return; }
  res.json({ ok: true });
});

app.post("/api/payments", (req, res) => {
  const body = req.body as { userId?: string; amount?: number; type?: string; description?: string; jobId?: string; periodStart?: string; periodEnd?: string };
  if (!body.userId || !body.amount || body.amount <= 0) { res.status(400).json({ error: "userId and positive amount required." }); return; }
  const user = db.getUserById(body.userId);
  if (!user) { res.status(404).json({ error: "User not found." }); return; }
  const payment = db.addPayment({
    userId: body.userId,
    amount: Number(body.amount),
    type: (["payroll","bonus","job"].includes(body.type ?? "") ? body.type as "payroll"|"bonus"|"job" : "payroll"),
    description: body.description?.trim() ?? "",
    jobId: body.jobId,
    periodStart: body.periodStart,
    periodEnd: body.periodEnd,
  });
  res.json({ ...payment, userName: user.name });
});

// ── Payroll bulk ──────────────────────────────────────────
app.post("/api/payroll/bulk", (req, res) => {
  const { userIds } = req.body as { userIds?: string[] };
  const team = db.getUsersWithStats().filter(u => u.role !== "owner" && u.active);
  const targets = userIds?.length ? team.filter(u => userIds.includes(u.id)) : team;
  const results = [];
  for (const u of targets) {
    if (u.totalOwed > 0) {
      const p = db.addPayment({ userId: u.id, amount: u.totalOwed, type: "payroll", description: "Bulk payroll" });
      results.push({ ...p, userName: u.name });
    }
  }
  res.json({ paid: results.length, payments: results });
});

// ── Expenses ──────────────────────────────────────────────
app.get("/api/expenses", (_req, res) => { res.json(db.getExpenses()); });

app.post("/api/expenses", (req, res) => {
  const { title, amount, category, vendor, notes, date, recurring } = req.body as { title?: string; amount?: number; category?: string; vendor?: string; notes?: string; date?: string; recurring?: boolean };
  if (!title?.trim() || !amount || amount <= 0) { res.status(400).json({ error: "Title and positive amount required." }); return; }
  res.json(db.createExpense({ title: title.trim(), amount: Number(amount), category: category?.trim() || "General", vendor: vendor?.trim() || "", notes: notes?.trim() || "", date: date || new Date().toISOString().split("T")[0], recurring: recurring ?? false }));
});

app.patch("/api/expenses/:id", (req, res) => {
  const e = db.updateExpense(req.params.id, req.body as Parameters<typeof db.updateExpense>[1]);
  if (!e) { res.status(404).json({ error: "Expense not found." }); return; }
  res.json(e);
});

app.delete("/api/expenses/:id", (req, res) => {
  const ok = db.deleteExpense(req.params.id);
  if (!ok) { res.status(404).json({ error: "Expense not found." }); return; }
  res.json({ ok: true });
});

// ── Announcements ─────────────────────────────────────────
app.get("/api/announcements", (_req, res) => { res.json(db.getAnnouncements()); });

app.post("/api/announcements", (req, res) => {
  const { title, body, authorId, pinned } = req.body as { title?: string; body?: string; authorId?: string; pinned?: boolean };
  if (!title?.trim() || !authorId) { res.status(400).json({ error: "Title and authorId required." }); return; }
  const author = db.getUserById(authorId);
  if (!author) { res.status(404).json({ error: "Author not found." }); return; }
  const ann = db.createAnnouncement({ title: title.trim(), body: body?.trim() || "", authorId, authorName: author.name, pinned: pinned ?? false });
  // notify all active employees
  db.getUsers().filter(u => u.role !== "owner" && u.active).forEach(u => {
    db.addNotification({ userId: u.id, message: `New announcement: ${title.trim()}`, type: "info" });
  });
  res.json(ann);
});

app.patch("/api/announcements/:id", (req, res) => {
  const a = db.updateAnnouncement(req.params.id, req.body as Parameters<typeof db.updateAnnouncement>[1]);
  if (!a) { res.status(404).json({ error: "Announcement not found." }); return; }
  res.json(a);
});

app.delete("/api/announcements/:id", (req, res) => {
  const ok = db.deleteAnnouncement(req.params.id);
  if (!ok) { res.status(404).json({ error: "Announcement not found." }); return; }
  res.json({ ok: true });
});

// ── Shifts ────────────────────────────────────────────────
app.get("/api/shifts", (req, res) => {
  const { userId } = req.query as { userId?: string };
  const shifts = db.getShifts(userId);
  const userMap = new Map(db.getUsers().map(u => [u.id, u]));
  res.json(shifts.map(s => ({ ...s, userName: userMap.get(s.userId)?.name ?? "Unknown" })));
});

app.post("/api/shifts", (req, res) => {
  const { userId, date, startTime, endTime, title, note } = req.body as { userId?: string; date?: string; startTime?: string; endTime?: string; title?: string; note?: string };
  if (!userId || !date || !startTime || !endTime) { res.status(400).json({ error: "userId, date, startTime, endTime required." }); return; }
  const shift = db.createShift({ userId, date, startTime, endTime, title: title?.trim() ?? "", note: note?.trim() ?? "" });
  const user = db.getUserById(userId);
  res.json({ ...shift, userName: user?.name ?? "Unknown" });
});

app.patch("/api/shifts/:id", (req, res) => {
  const shift = db.updateShift(req.params.id, req.body as Parameters<typeof db.updateShift>[1]);
  if (!shift) { res.status(404).json({ error: "Shift not found." }); return; }
  res.json(shift);
});

app.delete("/api/shifts/:id", (req, res) => {
  const ok = db.deleteShift(req.params.id);
  if (!ok) { res.status(404).json({ error: "Shift not found." }); return; }
  res.json({ ok: true });
});

// ── Leave Requests ────────────────────────────────────────
app.get("/api/leave", (req, res) => {
  const { userId } = req.query as { userId?: string };
  const requests = db.getLeaveRequests(userId);
  const userMap = new Map(db.getUsers().map(u => [u.id, u]));
  res.json(requests.map(r => ({ ...r, userName: userMap.get(r.userId)?.name ?? "Unknown" })));
});

app.post("/api/leave", (req, res) => {
  const { userId, startDate, endDate, type, reason } = req.body as { userId?: string; startDate?: string; endDate?: string; type?: string; reason?: string };
  if (!userId || !startDate || !endDate) { res.status(400).json({ error: "userId, startDate, endDate required." }); return; }
  const leaveType = (["vacation","sick","personal","other"].includes(type ?? "") ? type as "vacation"|"sick"|"personal"|"other" : "other");
  const request = db.createLeaveRequest({ userId, startDate, endDate, type: leaveType, reason: reason?.trim() ?? "" });
  const user = db.getUserById(userId);
  // notify owner(s)
  db.getUsers().filter(u => u.role === "owner").forEach(owner => {
    db.addNotification({ userId: owner.id, message: `${user?.name ?? "Employee"} requested ${leaveType} leave (${startDate} – ${endDate})`, type: "info" });
  });
  res.json({ ...request, userName: user?.name ?? "Unknown" });
});

app.patch("/api/leave/:id", (req, res) => {
  const { status } = req.body as { status?: string };
  if (status !== "approved" && status !== "denied") { res.status(400).json({ error: "status must be approved or denied." }); return; }
  const request = db.updateLeaveRequest(req.params.id, status);
  if (!request) { res.status(404).json({ error: "Request not found." }); return; }
  // notify employee
  const label = status === "approved" ? "approved" : "denied";
  db.addNotification({ userId: request.userId, message: `Your ${request.type} leave request (${request.startDate} – ${request.endDate}) was ${label}`, type: status === "approved" ? "success" : "warning" });
  res.json(request);
});

app.delete("/api/leave/:id", (req, res) => {
  const ok = db.deleteLeaveRequest(req.params.id);
  if (!ok) { res.status(404).json({ error: "Request not found." }); return; }
  res.json({ ok: true });
});

// ── Notifications ─────────────────────────────────────────
app.get("/api/notifications", (req, res) => {
  const { userId } = req.query as { userId?: string };
  if (!userId) { res.status(400).json({ error: "userId required." }); return; }
  res.json(db.getNotifications(userId));
});

app.post("/api/notifications/read-all", (req, res) => {
  const { userId } = req.body as { userId?: string };
  if (!userId) { res.status(400).json({ error: "userId required." }); return; }
  db.markAllNotificationsRead(userId);
  res.json({ ok: true });
});

app.patch("/api/notifications/:id/read", (_req, res) => {
  db.markNotificationRead(_req.params.id);
  res.json({ ok: true });
});

// ── Employee Notes ────────────────────────────────────────
app.get("/api/team/:id/notes", (req, res) => {
  res.json(db.getEmployeeNotes(req.params.id));
});

app.post("/api/team/:id/notes", (req, res) => {
  const { text, authorId } = req.body as { text?: string; authorId?: string };
  if (!text?.trim() || !authorId) { res.status(400).json({ error: "text and authorId required." }); return; }
  const author = db.getUserById(authorId);
  if (!author) { res.status(404).json({ error: "Author not found." }); return; }
  res.json(db.addEmployeeNote({ userId: req.params.id, text: text.trim(), authorId, authorName: author.name }));
});

app.delete("/api/team/notes/:noteId", (req, res) => {
  const ok = db.deleteEmployeeNote(req.params.noteId);
  if (!ok) { res.status(404).json({ error: "Note not found." }); return; }
  res.json({ ok: true });
});

// ── Analytics ─────────────────────────────────────────────
app.get("/api/analytics", (_req, res) => {
  const team = db.getUsersWithStats().filter(u => u.role !== "owner" && u.active);
  const dailyHours = db.getDailyHours(undefined, 7);
  const weeklyPayroll = db.getWeeklyPayroll(6);
  const payments = db.getPayments();
  const totalPaidOut = payments.reduce((s, p) => s + p.amount, 0);
  res.json({ team, dailyHours, weeklyPayroll, totalPaidOut });
});

// ── Activity feed ─────────────────────────────────────────
app.get("/api/activity", (_req, res) => {
  const userMap = new Map(db.getUsers().map(u => [u.id, u]));
  const events: Array<{ id: string; type: string; ts: string; actor: string; title: string; sub: string; meta?: Record<string, string | number> }> = [];

  // Clock-ins / clock-outs
  const entries = db.getTimeEntries();
  for (const e of entries) {
    const name = userMap.get(e.userId)?.name ?? "Unknown";
    events.push({ id: `ci-${e.id}`, type: "clock_in", ts: e.clockIn, actor: name, title: `${name} clocked in`, sub: e.notes ? `Note: ${e.notes}` : "Started shift" });
    if (e.clockOut) {
      const hrs = calcHours(e.clockIn, e.clockOut);
      events.push({ id: `co-${e.id}`, type: "clock_out", ts: e.clockOut, actor: name, title: `${name} clocked out`, sub: `${hrs.toFixed(1)}h shift`, meta: { hours: hrs } });
    }
  }

  // Payments
  const pays = db.getPayments();
  for (const p of pays) {
    const name = userMap.get(p.userId)?.name ?? "Unknown";
    const label = p.type === "payroll" ? "Payroll" : p.type === "bonus" ? "Bonus" : "Job payment";
    events.push({ id: `pay-${p.id}`, type: "payment", ts: p.paidAt, actor: name, title: `${label} — ${name}`, sub: `$${p.amount.toFixed(2)}${p.description ? ` · ${p.description}` : ""}`, meta: { amount: p.amount } });
  }

  // Jobs
  const jobs = db.getJobs();
  for (const j of jobs) {
    events.push({ id: `jc-${j.id}`, type: "job_created", ts: j.createdAt, actor: "Owner", title: `Job created: ${j.title}`, sub: `${j.category} · ${j.priority} priority` });
    if (j.completedAt) {
      events.push({ id: `jd-${j.id}`, type: "job_done", ts: j.completedAt, actor: "Owner", title: `Job completed: ${j.title}`, sub: j.category });
    }
  }

  // Announcements
  const anns = db.getAnnouncements();
  for (const a of anns) {
    events.push({ id: `ann-${a.id}`, type: "announcement", ts: a.createdAt, actor: a.authorName, title: a.title, sub: a.body.length > 80 ? a.body.slice(0, 80) + "…" : a.body });
  }

  events.sort((a, b) => new Date(b.ts).getTime() - new Date(a.ts).getTime());
  res.json(events.slice(0, 200));
});

// ── Payroll helpers ───────────────────────────────────────
app.get("/api/payroll", (_req, res) => { res.json(db.getUsersWithStats()); });

// ── Utilities ─────────────────────────────────────────────
function calcHours(clockIn: string, clockOut: string | null): number {
  const start = new Date(clockIn).getTime();
  const end = clockOut ? new Date(clockOut).getTime() : Date.now();
  return (end - start) / (1000 * 60 * 60);
}

if (process.env.NODE_ENV === "production") {
  const clientDist = path.join(__dirname, "..", "dist", "client");
  app.use(express.static(clientDist));
  app.get("*", (_req, res) => { res.sendFile(path.join(clientDist, "index.html")); });
}

app.listen(PORT, () => { console.log(`WorkBase server on http://localhost:${PORT}`); });
