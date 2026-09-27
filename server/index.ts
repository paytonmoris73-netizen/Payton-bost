import "dotenv/config";
import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { db } from "./db.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT) || 8787;

const app = express();
app.use(express.json());

app.get("/api/status", (_req, res) => {
  res.json({ setup: db.isSetup() });
});

app.get("/api/company", (_req, res) => {
  const company = db.getCompany();
  if (!company) { res.status(404).json({ error: "Not set up" }); return; }
  res.json(company);
});

app.post("/api/setup", (req, res) => {
  const { companyName, ownerName } = req.body as { companyName?: string; ownerName?: string };
  if (!companyName?.trim() || !ownerName?.trim()) {
    res.status(400).json({ error: "Company name and owner name are required." }); return;
  }
  if (db.isSetup()) { res.status(409).json({ error: "Already set up." }); return; }
  const result = db.setup(companyName.trim(), ownerName.trim());
  res.json(result);
});

app.post("/api/auth/login", (req, res) => {
  const { name } = req.body as { name?: string };
  if (!name?.trim()) { res.status(400).json({ error: "Name required." }); return; }
  const user = db.getUserByName(name.trim());
  if (!user) { res.status(404).json({ error: "User not found." }); return; }
  if (!user.active) { res.status(403).json({ error: "Account inactive." }); return; }
  res.json(user);
});

app.post("/api/auth/join", (req, res) => {
  const { code, name } = req.body as { code?: string; name?: string };
  if (!code?.trim() || !name?.trim()) {
    res.status(400).json({ error: "Code and name are required." }); return;
  }
  const existing = db.getUserByName(name.trim());
  if (existing) { res.json(existing); return; }
  const user = db.joinByCode(code.trim(), name.trim());
  if (!user) { res.status(400).json({ error: "Invalid join code." }); return; }
  res.json(user);
});

app.get("/api/team", (_req, res) => {
  res.json(db.getUsersWithStats());
});

app.post("/api/team", (req, res) => {
  const { name, hourlyRate, title } = req.body as { name?: string; hourlyRate?: number; title?: string };
  if (!name?.trim()) { res.status(400).json({ error: "Name is required." }); return; }
  if (db.getUserByName(name.trim())) {
    res.status(409).json({ error: "A user with this name already exists." }); return;
  }
  const user = db.addUser(name.trim(), Number(hourlyRate) || 0, title?.trim() || "Employee");
  res.json(user);
});

app.patch("/api/team/:id", (req, res) => {
  const { id } = req.params;
  const updates = req.body as Partial<{ name: string; hourlyRate: number; active: boolean; title: string }>;
  const user = db.updateUser(id, updates);
  if (!user) { res.status(404).json({ error: "User not found." }); return; }
  res.json(user);
});

app.get("/api/time", (req, res) => {
  const { userId } = req.query as { userId?: string };
  const entries = db.getTimeEntries(userId);
  const users = db.getUsers();
  const userMap = new Map(users.map(u => [u.id, u]));
  const enriched = entries.map(e => ({
    ...e,
    userName: userMap.get(e.userId)?.name ?? "Unknown",
    hours: calcHours(e.clockIn, e.clockOut),
  }));
  enriched.sort((a, b) => new Date(b.clockIn).getTime() - new Date(a.clockIn).getTime());
  res.json(enriched);
});

app.post("/api/time/clock-in", (req, res) => {
  const { userId, notes } = req.body as { userId?: string; notes?: string };
  if (!userId) { res.status(400).json({ error: "userId required." }); return; }
  const entry = db.clockIn(userId, notes ?? "");
  if (!entry) { res.status(409).json({ error: "Already clocked in." }); return; }
  res.json(entry);
});

app.post("/api/time/clock-out", (req, res) => {
  const { userId } = req.body as { userId?: string };
  if (!userId) { res.status(400).json({ error: "userId required." }); return; }
  const entry = db.clockOut(userId);
  if (!entry) { res.status(409).json({ error: "Not clocked in." }); return; }
  res.json(entry);
});

app.get("/api/time/status", (req, res) => {
  const { userId } = req.query as { userId?: string };
  if (!userId) { res.status(400).json({ error: "userId required." }); return; }
  const entry = db.getOpenEntry(userId);
  res.json({ clocked: entry !== null, entry: entry ?? null });
});

app.get("/api/payroll", (_req, res) => {
  res.json(db.getUsersWithStats());
});

app.post("/api/company/regenerate-code", (_req, res) => {
  const code = db.regenerateJoinCode();
  if (!code) { res.status(404).json({ error: "Not set up." }); return; }
  res.json({ joinCode: code });
});

app.get("/api/me/:userId", (req, res) => {
  const user = db.getUserWithStats(req.params.userId);
  if (!user) { res.status(404).json({ error: "User not found." }); return; }
  res.json(user);
});

function calcHours(clockIn: string, clockOut: string | null): number {
  const start = new Date(clockIn).getTime();
  const end = clockOut ? new Date(clockOut).getTime() : Date.now();
  return (end - start) / (1000 * 60 * 60);
}

if (process.env.NODE_ENV === "production") {
  const clientDist = path.join(__dirname, "..", "dist", "client");
  app.use(express.static(clientDist));
  app.get("*", (_req, res) => {
    res.sendFile(path.join(clientDist, "index.html"));
  });
}

app.listen(PORT, () => {
  console.log(`WorkBase server on http://localhost:${PORT}`);
});
