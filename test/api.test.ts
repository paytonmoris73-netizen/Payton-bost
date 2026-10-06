import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { spawn, type ChildProcess } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const PORT = 18000 + Math.floor(Math.random() * 1000);
const BASE = `http://localhost:${PORT}`;
const dir = fs.mkdtempSync(path.join(os.tmpdir(), "workbase-test-"));
let server: ChildProcess;

async function call(method: string, url: string, body?: unknown, token?: string) {
  const res = await fetch(BASE + url, {
    method,
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const data = await res.json().catch(() => null);
  return { status: res.status, data };
}

let owner = "", employee = "", employeeId = "", code = "";

before(async () => {
  server = spawn(process.execPath, ["--import", "tsx", "server/index.ts"], {
    env: { ...process.env, PORT: String(PORT), DB_PATH: path.join(dir, "data.json"), NODE_ENV: "test" },
    stdio: "ignore",
  });
  for (let i = 0; i < 50; i++) {
    try { await fetch(`${BASE}/api/status`); break; } catch { await new Promise(r => setTimeout(r, 100)); }
  }
  const s = await call("POST", "/api/setup", { companyName: "Test Co", ownerName: "Olive", pin: "1234" });
  owner = s.data.token;
  code = (await call("GET", "/api/company", undefined, owner)).data.joinCode;
  const j = await call("POST", "/api/auth/join", { code, name: "Eli", pin: "5678" });
  employee = j.data.token;
  employeeId = j.data.user.id;
  await call("PATCH", `/api/team/${employeeId}`, { hourlyRate: 20 }, owner);
});

after(() => { server.kill(); fs.rmSync(dir, { recursive: true, force: true }); });

test("setup cannot run twice", async () => {
  const r = await call("POST", "/api/setup", { companyName: "X", ownerName: "Y", pin: "1111" });
  assert.equal(r.status, 409);
});

test("API requires a session", async () => {
  assert.equal((await call("GET", "/api/team")).status, 401);
  assert.equal((await call("GET", "/api/team", undefined, "not-a-token")).status, 401);
});

test("login needs the right PIN and never leaks hashes", async () => {
  assert.equal((await call("POST", "/api/auth/login", { name: "Olive", pin: "0000" })).status, 401);
  const ok = await call("POST", "/api/auth/login", { name: "olive", pin: "1234" });
  assert.equal(ok.status, 200);
  assert.ok(!JSON.stringify(ok.data).includes("pinHash"));
  const users = await call("GET", "/api/auth/users");
  assert.ok(!JSON.stringify(users.data).includes("pinHash"));
  assert.ok(!JSON.stringify(users.data).includes("hourlyRate"));
});

test("joining with an existing name is refused", async () => {
  assert.equal((await call("POST", "/api/auth/join", { code, name: "OLIVE", pin: "9999" })).status, 409);
});

test("employees are blocked from owner-only data", async () => {
  for (const url of ["/api/payroll", "/api/expenses", "/api/invoices", "/api/clients", "/api/analytics", "/api/insights", "/api/reports", "/api/backup", "/api/activity"]) {
    assert.equal((await call("GET", url, undefined, employee)).status, 403, url);
  }
  assert.equal((await call("POST", "/api/payments", { userId: employeeId, amount: 500 }, employee)).status, 403);
  assert.equal((await call("PUT", "/api/company/settings", { overtimeThreshold: 1, overtimeMultiplier: 5 }, employee)).status, 403);
  const company = await call("GET", "/api/company", undefined, employee);
  assert.equal(company.data.joinCode, "");
});

test("owner cannot escalate an employee's role through the API", async () => {
  const r = await call("PATCH", `/api/team/${employeeId}`, { role: "owner" }, owner);
  assert.equal(r.data.role, "employee");
});

test("clock in, break, clock out", async () => {
  const ci = await call("POST", "/api/time/clock-in", { notes: "start" }, employee);
  assert.equal(ci.status, 200);
  assert.equal((await call("POST", "/api/time/clock-in", {}, employee)).status, 409);
  assert.equal((await call("POST", `/api/time/${ci.data.id}/break/start`, {}, employee)).status, 200);
  const co = await call("POST", "/api/time/clock-out", {}, employee);
  assert.equal(co.status, 200);
  assert.ok(co.data.breaks.every((b: { breakEnd: string | null }) => b.breakEnd), "open break closed on clock-out");
});

test("employees only see their own time entries", async () => {
  const r = await call("GET", "/api/time?userId=someone-else", undefined, employee);
  assert.ok(r.data.every((e: { userId: string }) => e.userId === employeeId));
});

test("owner time edits are audit-logged", async () => {
  const list = await call("GET", "/api/time", undefined, owner);
  const id = list.data[0].id;
  const r = await call("PATCH", `/api/time/${id}`, { notes: "corrected" }, owner);
  assert.equal(r.data.edits.at(-1).field, "notes");
  assert.equal(r.data.edits.at(-1).byName, "Olive");
});

test("geofence blocks far-away clock-ins when enforced", async () => {
  const set = await call("PUT", "/api/company/settings", {
    overtimeThreshold: 40, overtimeMultiplier: 1.5,
    geofence: { enabled: true, enforce: true, lat: 40.7484, lng: -73.9857, radiusM: 200, label: "HQ" },
  }, owner);
  assert.equal(set.status, 200);
  assert.equal((await call("POST", "/api/time/clock-in", {}, employee)).status, 403, "no location");
  const far = await call("POST", "/api/time/clock-in", { location: { lat: 40.7527, lng: -73.9772, accuracy: 10 } }, employee);
  assert.equal(far.status, 403);
  assert.match(far.data.error, /HQ/);
  const near = await call("POST", "/api/time/clock-in", { location: { lat: 40.7485, lng: -73.9858, accuracy: 10 } }, employee);
  assert.equal(near.status, 200);
  assert.ok(near.data.distanceM < 50);
  await call("POST", "/api/time/clock-out", {}, employee);
  await call("PUT", "/api/company/settings", { overtimeThreshold: 40, overtimeMultiplier: 1.5, geofence: { enabled: false } }, owner);
});

test("open shifts can be claimed once; drops need approval", async () => {
  const d = new Date(Date.now() + 2 * 864e5);
  const date = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  const open = await call("POST", "/api/shifts", { userId: "", date, startTime: "09:00", endTime: "17:00" }, owner);
  assert.equal(open.data.userName, "Open shift");
  const visible = await call("GET", "/api/shifts", undefined, employee);
  assert.ok(visible.data.some((s: { id: string }) => s.id === open.data.id));
  const claim = await call("POST", `/api/shifts/${open.data.id}/claim`, {}, employee);
  assert.equal(claim.data.userId, employeeId);
  assert.equal((await call("POST", `/api/shifts/${open.data.id}/claim`, {}, employee)).status, 409);
  const drop = await call("POST", `/api/shifts/${open.data.id}/drop`, {}, employee);
  assert.equal(drop.data.dropRequested, true);
  const approve = await call("POST", `/api/shifts/${open.data.id}/drop/approve`, {}, owner);
  assert.equal(approve.data.userId, "");
});

test("chat: team channel works, others' DMs are private", async () => {
  const sent = await call("POST", "/api/chat/team", { text: "hello team" }, employee);
  assert.equal(sent.status, 200);
  const chans = await call("GET", "/api/chat/channels", undefined, owner);
  assert.equal(chans.data.find((c: { channel: string }) => c.channel === "team").unread, 1);
  assert.equal((await call("GET", "/api/chat/dm:aaa:bbb", undefined, employee)).status, 403);
  assert.equal((await call("POST", "/api/chat/team", { text: "   " }, employee)).status, 400);
});

test("invoices: totals, overdue flag, client deletion guard", async () => {
  const c = await call("POST", "/api/clients", { name: "Acme" }, owner);
  const inv = await call("POST", "/api/invoices", { clientId: c.data.id, items: [{ description: "Work", quantity: 2, unitPrice: 100 }], taxRate: 10, dueDate: "2020-01-01" }, owner);
  assert.equal(inv.data.total, 220);
  assert.equal(inv.data.overdue, true);
  assert.equal((await call("DELETE", `/api/clients/${c.data.id}`, undefined, owner)).status, 409);
  const paid = await call("PATCH", `/api/invoices/${inv.data.id}`, { status: "paid" }, owner);
  assert.equal(paid.data.overdue, false);
  assert.ok(paid.data.paidAt);
});

test("reports add up and backup excludes secrets", async () => {
  const r = await call("GET", "/api/reports", undefined, owner);
  assert.equal(r.status, 200);
  assert.equal(r.data.totals.revenue, 220);
  assert.equal(r.data.totals.profit, Math.round((r.data.totals.revenue - r.data.totals.laborCost - r.data.totals.expenses) * 100) / 100);
  const b = await call("GET", "/api/backup", undefined, owner);
  const text = JSON.stringify(b.data);
  assert.ok(!text.includes("pinHash"));
  assert.ok(!("sessions" in b.data) || b.data.sessions === undefined);
});

test("time corrections: validated, approved into real hours, not reviewable twice", async () => {
  const future = new Date(Date.now() + 3 * 3600e3);
  assert.equal((await call("POST", "/api/time-requests", { clockIn: new Date().toISOString(), clockOut: future.toISOString(), reason: "x" }, employee)).status, 400, "future");
  assert.equal((await call("POST", "/api/time-requests", { clockIn: "2026-01-02T17:00:00Z", clockOut: "2026-01-02T09:00:00Z", reason: "x" }, employee)).status, 400, "backwards");
  assert.equal((await call("POST", "/api/time-requests", { clockIn: "2026-01-02T09:00:00Z", clockOut: "2026-01-02T17:00:00Z", reason: "" }, employee)).status, 400, "no reason");
  const r = await call("POST", "/api/time-requests", { clockIn: "2026-01-02T09:00:00Z", clockOut: "2026-01-02T17:00:00Z", reason: "Phone died" }, employee);
  assert.equal(r.status, 200);
  assert.equal((await call("PATCH", `/api/time-requests/${r.data.id}`, { status: "approved" }, employee)).status, 403);
  const before = (await call("GET", "/api/time", undefined, employee)).data.length;
  assert.equal((await call("PATCH", `/api/time-requests/${r.data.id}`, { status: "approved" }, owner)).status, 200);
  const after = (await call("GET", "/api/time", undefined, employee)).data;
  assert.equal(after.length, before + 1);
  assert.ok(after.some((e: { hours: number }) => Math.abs(e.hours - 8) < 1e-9));
  assert.equal((await call("PATCH", `/api/time-requests/${r.data.id}`, { status: "denied" }, owner)).status, 404, "already reviewed");
});

test("owner can reset an employee PIN; old sessions stop working", async () => {
  const s = await call("POST", "/api/auth/login", { name: "Eli", pin: "5678" });
  const tok = s.data.token;
  assert.equal((await call("POST", `/api/team/${employeeId}/reset-pin`, {}, employee)).status, 403);
  assert.equal((await call("POST", `/api/team/${employeeId}/reset-pin`, {}, owner)).status, 200);
  assert.equal((await call("GET", "/api/auth/me", undefined, tok)).status, 401);
  assert.equal((await call("POST", "/api/auth/login", { name: "Eli", pin: "2468" })).status, 401, "needs invite code");
  const claimed = await call("POST", "/api/auth/login", { name: "Eli", pin: "2468", code });
  assert.equal(claimed.status, 200);
  employee = claimed.data.token;
});

test("PIN lockout after repeated failures", async () => {
  for (let i = 0; i < 5; i++) await call("POST", "/api/auth/login", { name: "Eli", pin: "0000" });
  assert.equal((await call("POST", "/api/auth/login", { name: "Eli", pin: "2468" })).status, 429);
});
