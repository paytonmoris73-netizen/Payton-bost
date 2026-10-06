import { test } from "node:test";
import assert from "node:assert/strict";
import { hoursFor, laborLines, invoiceTotal, hashPin, verifyPin, distanceMeters, dmChannel, DEFAULT_SETTINGS } from "../server/db.ts";
import type { TimeEntry } from "../server/db.ts";

function entry(userId: string, start: string, hours: number, breaks: Array<[number, number]> = []): TimeEntry {
  const s = new Date(start).getTime();
  return {
    id: Math.random().toString(36).slice(2), userId, notes: "",
    clockIn: new Date(s).toISOString(),
    clockOut: new Date(s + hours * 3600e3).toISOString(),
    breaks: breaks.map(([a, b]) => ({ breakStart: new Date(s + a * 60e3).toISOString(), breakEnd: new Date(s + b * 60e3).toISOString() })),
  };
}

test("hoursFor subtracts breaks", () => {
  assert.equal(hoursFor(entry("u", "2026-03-02T09:00:00", 8, [[240, 270]])), 7.5);
});

test("hoursFor never goes negative", () => {
  assert.equal(hoursFor(entry("u", "2026-03-02T09:00:00", 1, [[0, 120]])), 0);
});

test("overtime kicks in after 40 hours in a week, at 1.5x", () => {
  // Mon–Fri, 9h each = 45h in one week (week starts Sunday).
  const days = ["2026-03-02", "2026-03-03", "2026-03-04", "2026-03-05", "2026-03-06"];
  const lines = laborLines(days.map(d => entry("u", `${d}T08:00:00`, 9)), () => 20, DEFAULT_SETTINGS);
  const reg = lines.reduce((s, l) => s + l.regularHours, 0);
  const ot = lines.reduce((s, l) => s + l.overtimeHours, 0);
  const pay = lines.reduce((s, l) => s + l.pay, 0);
  assert.equal(reg, 40);
  assert.equal(ot, 5);
  assert.equal(pay, 40 * 20 + 5 * 30);
  assert.equal(lines[4].overtimeHours, 5, "overtime lands on the last shift of the week");
});

test("overtime resets each week and is tracked per employee", () => {
  const lines = laborLines([
    entry("a", "2026-03-06T08:00:00", 39),
    entry("a", "2026-03-08T08:00:00", 5), // next Sunday = new week
    entry("b", "2026-03-06T08:00:00", 5),
  ], () => 10, DEFAULT_SETTINGS);
  assert.equal(lines.reduce((s, l) => s + l.overtimeHours, 0), 0);
});

test("custom overtime settings are respected", () => {
  const lines = laborLines([entry("u", "2026-03-02T08:00:00", 10)], () => 10, { ...DEFAULT_SETTINGS, overtimeThreshold: 8, overtimeMultiplier: 2 });
  assert.equal(lines[0].pay, 8 * 10 + 2 * 20);
});

test("invoiceTotal applies tax and rounds to cents", () => {
  assert.equal(invoiceTotal({ items: [{ description: "x", quantity: 3, unitPrice: 33.333 }], taxRate: 8.25 }), 108.25);
  assert.equal(invoiceTotal({ items: [], taxRate: 10 }), 0);
});

test("PIN hashes verify and reject", () => {
  const h = hashPin("4821");
  assert.ok(verifyPin("4821", h));
  assert.ok(!verifyPin("4822", h));
  assert.ok(!verifyPin("4821", "garbage"));
  assert.notEqual(hashPin("4821"), h, "salted");
});

test("distanceMeters is roughly right", () => {
  const d = distanceMeters({ lat: 40.7484, lng: -73.9857 }, { lat: 40.7527, lng: -73.9772 });
  assert.ok(d > 800 && d < 950, `got ${d}`);
});

test("dm channel id is order-independent", () => {
  assert.equal(dmChannel("b", "a"), dmChannel("a", "b"));
});
