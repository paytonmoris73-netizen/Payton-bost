// Fills a database with a realistic sample business for demos.
// Usage: DB_PATH=./demo.json npm run demo   (add -- --force to overwrite)
import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { hashPin, DEFAULT_SETTINGS } from "./db.js";
import type { DbData, TimeEntry, Shift, User, Payment } from "./db.js";

const target = process.env.DB_PATH;
if (!target) { console.error("Set DB_PATH to a demo file, e.g. DB_PATH=./demo.json npm run demo"); process.exit(1); }
if (fs.existsSync(target) && !process.argv.includes("--force")) { console.error(`${target} already exists. Add -- --force to overwrite.`); process.exit(1); }
if (path.resolve(target) === path.resolve("data.json")) { console.error("Refusing to overwrite your real data.json."); process.exit(1); }

const id = () => randomUUID();
const now = new Date();
const day = (offset: number, h = 0, m = 0) => { const d = new Date(now); d.setDate(d.getDate() + offset); d.setHours(h, m, 0, 0); return d; };
const ymd = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const iso = (d: Date) => d.toISOString();
const pin = hashPin("1234");
const site = { lat: 40.7484, lng: -73.9857 };

const owner: User = { id: id(), name: "Maya Brooks", role: "owner", hourlyRate: 0, createdAt: iso(day(-120)), active: true, title: "Owner", pinHash: pin };
const people: User[] = [
  ["Leo Park", 22, "Cleaner"], ["Ana Ruiz", 26, "Team Lead"], ["Sam Okafor", 21, "Cleaner"],
  ["Priya Shah", 24, "Floor Care Specialist"], ["Jordan Lee", 20, "Cleaner"],
].map(([name, rate, title], i) => ({ id: id(), name: name as string, role: "employee" as const, hourlyRate: rate as number, createdAt: iso(day(-100 + i * 9)), active: true, title: title as string, pinHash: pin }));
const [leo, ana, sam, priya, jordan] = people;

const clients = [
  { name: "Riverside Dental", email: "office@riversidedental.example", phone: "(555) 201-4410", address: "14 River Rd", notes: "Alarm code with Ana" },
  { name: "Northgate Offices", email: "facilities@northgate.example", phone: "(555) 330-8812", address: "200 Northgate Ave, Fl 3", notes: "" },
  { name: "Bloom Yoga Studio", email: "hello@bloomyoga.example", phone: "(555) 774-1209", address: "88 Elm St", notes: "Mats need wiping daily" },
  { name: "Harbor Bistro", email: "manager@harborbistro.example", phone: "(555) 412-9930", address: "5 Pier Way", notes: "Kitchen deep clean monthly" },
].map(c => ({ ...c, id: id(), createdAt: iso(day(-90)) }));
const [riverside, northgate, bloom, harbor] = clients;

const job = (title: string, client: typeof clients[number] | null, payType: "fixed" | "hourly", payAmount: number, assigned: User[], status: "open" | "in_progress" | "completed", priority: "normal" | "high" | "urgent", due: number | null, category: string, description: string) => ({
  id: id(), title, description, category, payType, payAmount, assignedTo: assigned.map(u => u.id), status, priority,
  createdAt: iso(day(-20)), completedAt: status === "completed" ? iso(day(-3, 17)) : null, dueDate: due === null ? null : ymd(day(due)), clientId: client?.id,
});
const jobs = [
  job("Weekly office clean", northgate, "hourly", 22, [leo, sam], "in_progress", "normal", 4, "Commercial", "Vacuum, trash, restrooms, kitchen."),
  job("Dental suite sanitize", riverside, "hourly", 26, [ana, priya], "in_progress", "high", 2, "Medical", "Hospital-grade disinfectant on all surfaces."),
  job("Studio floor refinish", bloom, "fixed", 380, [priya], "completed", "normal", -2, "Floor care", "Strip, seal and buff hardwood."),
  job("Kitchen deep clean", harbor, "fixed", 520, [ana, jordan], "completed", "urgent", -4, "Restaurant", "Hoods, fryers, walk-in cooler."),
  job("Window wash - Northgate", northgate, "fixed", 260, [sam], "open", "normal", 9, "Commercial", "Interior and exterior, floors 1–3."),
  job("Post-construction clean", null, "hourly", 24, [], "open", "high", -1, "Residential", "New build, 3 bed. Dust everything."),
];

// Two weeks of realistic punches with lunch breaks, GPS near the site.
const entries: TimeEntry[] = [];
const schedule: Array<[User, number, number, number]> = [];
for (let d = -13; d <= 0; d++) {
  const dow = day(d).getDay();
  if (dow === 0) continue;
  for (const [u, start, len, jobIdx] of [[leo, 8, 8.5, 0], [ana, 7, 9.5, 1], [sam, 9, 7, 0], [priya, 8, 8, 1], [jordan, 12, 6, 3]] as Array<[User, number, number, number]>) {
    if (u === jordan && dow === 6) continue;
    if (u === sam && (dow === 3)) continue;
    schedule.push([u, d, start, len]);
    const jitter = ((u.name.length * 7 + d * 13) % 11) - 5;
    const isToday = d === 0;
    const ci = isToday ? new Date(now.getTime() - (1.5 + (u.name.length % 5) * 0.4) * 3600e3) : day(d, start, 0);
    if (!isToday) ci.setMinutes(ci.getMinutes() + jitter);
    if (isToday && u === jordan) continue; // starts later today
    const co = new Date(ci.getTime() + len * 3600e3);
    const open = isToday && (u === leo || u === ana || u === priya);
    const bStart = new Date(ci.getTime() + 4 * 3600e3);
    const loc = { lat: site.lat + ((jitter % 3) * 0.0002), lng: site.lng + ((jitter % 2) * 0.0002), accuracy: 8 + Math.abs(jitter) };
    entries.push({
      id: id(), userId: u.id, clockIn: iso(ci), clockOut: open || (isToday && co > now) ? null : iso(co), notes: "",
      jobId: jobs[jobIdx].id, breaks: open && now.getTime() - ci.getTime() < 4 * 3600e3 ? [] : [{ breakStart: iso(bStart), breakEnd: iso(new Date(bStart.getTime() + 30 * 60e3)) }],
      location: loc, distanceM: Math.round(Math.hypot(loc.lat - site.lat, loc.lng - site.lng) * 111000),
    });
  }
}
// One owner-corrected entry, so the "edited" audit badge has something to show.
entries.forEach(e => { if (e.userId === ana.id && e.clockOut && new Date(e.clockIn).getTime() > day(-6).getTime() && new Date(e.clockIn).getTime() < day(-5).getTime()) e.edits = [{ at: iso(day(-5, 9)), by: owner.id, byName: owner.name, field: "clockOut", from: null, to: e.clockOut }]; });

const pad = (n: number) => String(n).padStart(2, "0");
const shifts: Shift[] = [];
for (let d = 1; d <= 9; d++) {
  const dow = day(d).getDay();
  if (dow === 0) continue;
  for (const [u, start, len] of [[leo, 8, 8], [ana, 7, 9], [sam, 9, 7], [priya, 8, 8], [jordan, 12, 6]] as Array<[User, number, number]>) {
    if (u === jordan && dow === 6) continue;
    shifts.push({ id: id(), userId: u.id, date: ymd(day(d)), startTime: `${pad(start)}:00`, endTime: `${pad(start + len)}:00`, title: u === ana ? "Lead – Riverside" : u === priya ? "Floor care" : "Northgate", note: "", createdAt: iso(day(-1)) });
  }
}
for (let d = -6; d <= 0; d++) for (const [u, , s, len] of schedule.filter(x => x[1] === d)) shifts.push({ id: id(), userId: u.id, date: ymd(day(d)), startTime: `${pad(s)}:00`, endTime: `${pad(Math.min(23, Math.round(s + len)))}:00`, title: "", note: "", createdAt: iso(day(-8)) });
shifts.push({ id: id(), userId: "", date: ymd(day(2)), startTime: "17:00", endTime: "21:00", title: "Evening – Bloom Yoga", note: "Wipe mats and mirrors", createdAt: iso(day(-1)) });
shifts.push({ id: id(), userId: "", date: ymd(day(5)), startTime: "06:00", endTime: "10:00", title: "Early – Harbor Bistro", note: "", createdAt: iso(day(-1)) });
const dropShift = shifts.find(s => s.userId === sam.id && s.date === ymd(day(3)));
if (dropShift) dropShift.dropRequested = true;

const inv = (num: number, client: typeof clients[number], jobId: string | undefined, items: Array<[string, number, number]>, status: "draft" | "sent" | "paid", issue: number, due: number) => ({
  id: id(), number: `INV-${num}`, clientId: client.id, jobId, items: items.map(([description, quantity, unitPrice]) => ({ description, quantity, unitPrice })),
  taxRate: 8.875, status, issueDate: ymd(day(issue)), dueDate: ymd(day(due)), notes: "Thank you for your business! Payment by check or bank transfer.",
  paidAt: status === "paid" ? iso(day(issue + 6, 11)) : null, createdAt: iso(day(issue)),
});
const invoices = [
  inv(1001, bloom, jobs[2].id, [["Hardwood strip, seal & buff (1,200 sq ft)", 1, 640]], "paid", -20, -6),
  inv(1002, harbor, jobs[3].id, [["Commercial kitchen deep clean", 1, 890], ["Hood degreasing", 2, 95]], "paid", -12, 2),
  inv(1003, northgate, undefined, [["Weekly office cleaning", 4, 450]], "sent", -25, -5),
  inv(1004, riverside, undefined, [["Dental suite sanitization", 8, 120], ["Supplies", 1, 64]], "sent", -4, 10),
  inv(1005, northgate, undefined, [["Carpet spot treatment", 3, 75]], "draft", -1, 13),
];

const exp = (title: string, amount: number, category: string, vendor: string, d: number, recurring = false) => ({ id: id(), title, amount, category, vendor, notes: "", date: ymd(day(d)), createdAt: iso(day(d)), recurring });
const expenses = [
  exp("Cleaning supplies restock", 312.4, "Office", "CleanCo Supply", -18), exp("Van fuel", 96.2, "Travel", "Shell", -10),
  exp("Van insurance", 185, "Utilities", "State Farm", -15, true), exp("Floor buffer rental", 140, "Hardware", "Home Depot", -8),
  exp("Scheduling ads", 75, "Marketing", "Facebook", -5), exp("Microfiber cloths (200)", 89.99, "Office", "Amazon", -2),
  exp("Phone plan", 60, "Utilities", "Verizon", -14, true),
];

const payments: Payment[] = people.map(u => ({ id: id(), userId: u.id, amount: Math.round(u.hourlyRate * 40 * 100) / 100, type: "payroll", description: "Payroll — previous week", paidAt: iso(day(-8, 16)) }));
payments.push({ id: id(), userId: ana.id, amount: 150, type: "bonus", description: "5-star review from Harbor Bistro", paidAt: iso(day(-3, 12)) });

const task = (title: string, u: User, due: number | null, done = false, description = "") => ({ id: id(), title, description, assignedTo: u.id, dueDate: due === null ? null : ymd(day(due)), done, doneAt: done ? iso(day(-1, 15)) : null, createdBy: owner.id, createdAt: iso(day(-4)) });
const tasks = [
  task("Restock van supply bins", leo, 0, false, "Trash bags, gloves, glass cleaner"), task("Complete OSHA chemical safety module", sam, 3),
  task("Photograph Northgate lobby before/after", leo, -1), task("Train Jordan on floor buffer", priya, 4),
  task("Return rental buffer", ana, -2, true), task("Order new mop heads", ana, 1), task("Submit mileage log", jordan, 2),
];

const msgs: Array<[User, string, number]> = [
  [owner, "Morning team! Big week: Riverside inspection is Thursday.", -2], [ana, "Got it. I'll do a walkthrough Wednesday afternoon.", -2],
  [leo, "Northgate lobby looks great after the deep clean 👌", -1], [owner, "Thanks Leo! Open evening shift at Bloom on the schedule if anyone wants hours.", -1],
  [priya, "Floor buffer is back at the shop, all charged.", 0],
];
const messages = msgs.map(([u, text, d], i) => ({ id: id(), channel: "team", senderId: u.id, text, createdAt: iso(day(d, 8 + i)) }));

const data: DbData = {
  company: { id: id(), name: "Brightside Cleaning Co.", joinCode: "BRIGHT", createdAt: iso(day(-120)), settings: { ...DEFAULT_SETTINGS, geofence: { enabled: true, enforce: false, ...site, radiusM: 300, label: "Main shop" } } },
  users: [owner, ...people],
  timeEntries: entries,
  jobs, payments, expenses,
  announcements: [
    { id: id(), title: "Holiday schedule posted", body: "Check My Schedule for Thanksgiving week. Request leave by Friday if you need time off.", authorId: owner.id, authorName: owner.name, pinned: true, createdAt: iso(day(-3)) },
    { id: id(), title: "New safety gloves", body: "Nitrile gloves are now in every van. Please use them for all chemical work.", authorId: owner.id, authorName: owner.name, pinned: false, createdAt: iso(day(-9)) },
  ],
  shifts,
  leaveRequests: [
    { id: id(), userId: sam.id, startDate: ymd(day(11)), endDate: ymd(day(13)), type: "vacation", reason: "Family trip", status: "pending", createdAt: iso(day(-1)), reviewedAt: null },
    { id: id(), userId: leo.id, startDate: ymd(day(-9)), endDate: ymd(day(-9)), type: "sick", reason: "", status: "approved", createdAt: iso(day(-10)), reviewedAt: iso(day(-10)) },
  ],
  notifications: [
    { id: id(), userId: owner.id, message: "Sam Okafor requested vacation leave", type: "info", read: false, createdAt: iso(day(-1)) },
    { id: id(), userId: owner.id, message: "Ana Ruiz completed: Return rental buffer", type: "success", read: false, createdAt: iso(day(-1, 15)) },
  ],
  employeeNotes: [{ id: id(), userId: ana.id, text: "Excellent with clients. Ready for a supervisor role.", authorId: owner.id, authorName: owner.name, createdAt: iso(day(-30)) }],
  sessions: [], clients, invoices, tasks, messages, chatReads: [],
  timeRequests: [{ id: id(), userId: jordan.id, clockIn: iso(day(-3, 12)), clockOut: iso(day(-3, 18)), reason: "Phone died, forgot to clock in at Harbor", status: "pending", createdAt: iso(day(-2)), reviewedAt: null }],
};

fs.writeFileSync(target, JSON.stringify(data, null, 2));
console.log(`Demo business written to ${target}. Sign in as Maya Brooks (owner) or any employee, PIN 1234.`);
