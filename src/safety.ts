/* CRUNCH safety system — pure logic (no React, no store) so it can be unit-tested and later moved to a server.
   Layers: 1) content scan at publish  2) new-account limits  3) weighted, abuse-resistant reports
           4) strikes -> suspension -> permanent ban  5) appeals  6) public "Wall of Removed Scams". */
import type { Recipe, ReportCategory, ReporterStats, Strike } from "./types";

const DAY = 86_400_000;

/* ---------- 1. content scan ---------- */
export interface Flag { code: string; level: "block" | "review"; message: string }

/** Things that must never be in a food recipe. A match is refused outright. */
const DANGEROUS: [RegExp, string][] = [
  [/\b(bleach|ammonia|antifreeze|rubbing alcohol|isopropyl|drain cleaner|windex|turpentine|pesticide|insecticide|lye|detergent|dish soap|laundry pods?|tide pods?)\b/i, "mentions a non-food or toxic substance"],
  [/\b(eat|serve|enjoy|taste)\b[^.\n]{0,25}\braw (chicken|pork|poultry|turkey)\b/i, "tells people to eat raw poultry or pork"],
  [/\bundercooked (chicken|pork|turkey|poultry)\b[^.\n]{0,30}\b(is|are)? ?(fine|safe|best|good)\b/i, "says undercooked poultry or pork is safe"],
  [/\bhoney\b[^.\n]{0,60}\b(baby|babies|infant|newborn|under (1|one|12 months))\b/i, "gives honey to infants"],
  [/\bwater[- ]bath\b[^.\n]{0,40}\b(meat|beans|low[- ]acid|corn|stock)\b/i, "unsafe home-canning method"],
  [/\b(challenge|dare)\b[^.\n]{0,60}\b(vomit|puke|poison|choke|swallow whole)\b/i, "promotes a dangerous food challenge"],
  [/\bcinnamon challenge\b|\bone chip challenge\b/i, "promotes a dangerous food challenge"],
  [/\b(never|don'?t|no need to)\b[^.\n]{0,15}\b(wash|refrigerate|cook)\b[^.\n]{0,25}\b(chicken|pork|eggs|meat)\b/i, "gives unsafe food-handling advice"],
];

/** Typical scam / bait-and-switch signals. A match holds the recipe for a human to review. */
const SCAMMY: [RegExp, string][] = [
  [/https?:\/\/|www\.|\b[a-z0-9-]+\.(com|net|org|io|co|ru|xyz|shop|biz)\b/i, "contains an outside link"],
  [/\b(dm|message|text|whatsapp|telegram|snapchat|signal|email) me\b|\bwhats ?app\b|\btelegram\b/i, "tries to move buyers off-platform"],
  [/\b(cash ?app|venmo|zelle|paypal\.me|bitcoin|btc|crypto|gift ?cards?|western union|wire transfer)\b/i, "asks for off-platform payment"],
  [/\bguarantee[sd]?\b|\b100% (free|safe|works|guaranteed)\b|\bmoney[- ]back\b/i, "makes guarantees a recipe can't keep"],
  [/\b(lose|drop|burn) \d+ ?(lbs?|pounds|kg|kilos|inches) (in|within|overnight)\b|\bmiracle\b|\bdetox\b|\bcures?\b|\bfat[- ]burning (secret|trick)\b/i, "makes unproven health claims"],
  [/\b(secret|forbidden|banned) (recipe|method|trick)\b|\bthey don'?t want you to\b|\bdoctors hate\b/i, "uses clickbait pressure language"],
  [/\b(act now|limited time|hurry|last chance|only \d+ left)\b/i, "uses fake-urgency pressure"],
];

const wordCount = (s: string) => s.trim().split(/\s+/).filter(Boolean).length;

export function scanText(text: string): Flag[] {
  const out: Flag[] = [];
  DANGEROUS.forEach(([re, msg], i) => { if (re.test(text)) out.push({ code: "danger" + i, level: "block", message: msg }); });
  SCAMMY.forEach(([re, msg], i) => { if (re.test(text)) out.push({ code: "scam" + i, level: "review", message: msg }); });
  const letters = text.replace(/[^a-z]/gi, "");
  if (letters.length > 12 && letters.replace(/[^A-Z]/g, "").length / letters.length > 0.6) out.push({ code: "caps", level: "review", message: "is mostly ALL CAPS" });
  if (/(.)\1{7,}/.test(text) || /([!?$])\1{3,}/.test(text)) out.push({ code: "spamchars", level: "review", message: "has spammy repeated characters" });
  return out;
}

export function scanRecipe(r: Pick<Recipe, "title" | "description" | "ingredients" | "steps" | "price">): Flag[] {
  const body = [r.title, r.description, ...r.ingredients.map((i) => `${i.amount} ${i.name}`), ...r.steps.map((s) => s.text)].join("\n");
  const out = scanText(body);
  const stepWords = r.steps.reduce((n, s) => n + wordCount(s.text), 0);
  // "Didn't get what they wanted": a paid recipe with almost no actual instructions.
  if (r.price > 0 && stepWords < 25) out.push({ code: "thin-paid", level: "review", message: "is a paid recipe with very thin instructions" });
  if (r.ingredients.length && r.ingredients.every((i) => !/\d/.test(i.amount))) out.push({ code: "no-amounts", level: "review", message: "lists no real ingredient amounts" });
  const seen = new Set<string>(); const flags: Flag[] = [];
  for (const f of out) if (!seen.has(f.code)) { seen.add(f.code); flags.push(f); }
  return flags;
}

/* ---------- 2. who gets auto-published ---------- */
export interface Standing {
  strikes: number;             // active (non-revoked) strikes
  accountAgeDays: number;
  approvedBefore: number;      // recipes of theirs that were published and not removed
  isAdmin: boolean;
}
export type Decision = { result: "publish" } | { result: "review"; why: "scan" | "new-account"; flags: Flag[] } | { result: "blocked"; flags: Flag[] };

export function publishDecision(flags: Flag[], who: Standing): Decision {
  const blocks = flags.filter((f) => f.level === "block");
  if (blocks.length) return { result: "blocked", flags: blocks };          // even admins can't publish dangerous food advice
  if (who.isAdmin) return { result: "publish" };
  const soft = flags.filter((f) => f.level === "review");
  if (soft.length) return { result: "review", why: "scan", flags: soft };
  if (who.strikes > 0) return { result: "review", why: "new-account", flags: [] };  // anyone with a strike is pre-checked
  if (who.accountAgeDays < NEW_ACCOUNT_DAYS && who.approvedBefore < NEW_ACCOUNT_APPROVALS) return { result: "review", why: "new-account", flags: [] };
  return { result: "publish" };
}
export const NEW_ACCOUNT_DAYS = 3;
export const NEW_ACCOUNT_APPROVALS = 2;

/* ---------- 3. reports that can't be weaponised ---------- */
export const REPORT_CATEGORIES: { id: ReportCategory; label: string; hint: string; severe?: boolean }[] = [
  { id: "illness", label: "I (or someone) got sick", hint: "Food poisoning or a reaction after cooking this", severe: true },
  { id: "unsafe", label: "Unsafe or harmful", hint: "Could make someone sick or hurt", severe: true },
  { id: "scam", label: "Scam or bait-and-switch", hint: "Doesn't deliver what it promises, or asks for money/contact outside CRUNCH", severe: true },
  { id: "misleading", label: "Fake or misleading", hint: "Photo, description or reviews don't match the recipe" },
  { id: "stolen", label: "Stolen content", hint: "Copied from someone else" },
  { id: "spam", label: "Spam", hint: "Ads, links or repeated posts" },
  { id: "harassment", label: "Harassment", hint: "Targets or threatens a person" },
  { id: "other", label: "Something else", hint: "Tell us below" },
];
export const REPORT_THRESHOLD = 3;          // weighted report points that auto-hide something pending review
export const REPORT_THRESHOLD_SEVERE = 2;   // lower for unsafe / scam
export const REPORT_HOURLY_LIMIT = 5;
export const REPORT_PAUSE_DAYS = 7;

/** How much one report counts. New accounts and people whose past reports were dismissed count for less. */
export function reporterWeight(stats: ReporterStats | undefined, accountAgeDays: number): number {
  const u = stats?.upheld ?? 0, d = stats?.dismissed ?? 0;
  const record = Math.min(1.5, Math.max(0.1, ((u + 1) / (u + d + 2)) * 2));   // fresh reporter = 1.0
  const age = accountAgeDays < 1 ? 0.25 : accountAgeDays < 7 ? 0.6 : 1;
  return Math.round(record * age * 100) / 100;
}
/** Repeatedly wrong reporters lose the ability to report for a week. */
export function reportingPaused(stats: ReporterStats | undefined, now = Date.now()): boolean {
  return !!stats?.pausedUntil && new Date(stats.pausedUntil).getTime() > now;
}
export function shouldPause(stats: ReporterStats): boolean {
  const total = stats.upheld + stats.dismissed;
  return stats.dismissed >= 5 && stats.dismissed / total >= 0.7;
}
export function pauseUntil(now = Date.now()) { return new Date(now + REPORT_PAUSE_DAYS * DAY).toISOString(); }

/** Total weight from *distinct* reporters (one person reporting twice counts once). */
export function reportScore(reports: { reporterId?: string; weight?: number }[]): number {
  const best = new Map<string, number>();
  reports.forEach((r, i) => { const k = r.reporterId ?? "anon" + i; best.set(k, Math.max(best.get(k) ?? 0, r.weight ?? 0.5)); });
  return [...best.values()].reduce((a, b) => a + b, 0);
}
/** Several brand-new accounts piling on the same target is a classic false-report attack. */
export function looksLikePileOn(reports: { weight?: number }[]): boolean {
  return reports.length >= 3 && reports.filter((r) => (r.weight ?? 1) <= 0.3).length / reports.length >= 0.6;
}
export function thresholdFor(category: ReportCategory | undefined) { return REPORT_CATEGORIES.find((c) => c.id === category)?.severe ? REPORT_THRESHOLD_SEVERE : REPORT_THRESHOLD; }

/* ---------- 4. strikes & bans ---------- */
export type Penalty = "warning" | "suspension" | "ban";
export const SUSPENSION_DAYS = 7;
/** Policy knobs. Scamming is one strike. Reporting someone you know is innocent is banned on the 2nd offence. */
export const SCAM_BANS_INSTANTLY = true;
export const FALSE_REPORT_BAN_AT = 2;
export const LADDER: { strike: string; penalty: Penalty; text: string }[] = [
  { strike: "Strike 1", penalty: "warning", text: "Content removed and a formal warning. Your future recipes are checked by a person before they go live." },
  { strike: "Strike 2", penalty: "suspension", text: `${SUSPENSION_DAYS}-day suspension: you can't post, publish, sell, review or message.` },
  { strike: "Strike 3", penalty: "ban", text: "Permanent ban. You can no longer log in." },
];
export const activeStrikes = (strikes: Strike[], accountId: string, kind: "content" | "scam" | "false-report" = "content") =>
  strikes.filter((s) => s.accountId === accountId && !s.revoked && (s.kind ?? "content") === kind);
export function penaltyFor(activeCount: number): Penalty { return activeCount <= 1 ? "warning" : activeCount === 2 ? "suspension" : "ban"; }
export const penaltyText = (p: Penalty) => (p === "warning" ? "account warned" : p === "suspension" ? `account suspended ${SUSPENSION_DAYS} days` : "account permanently banned");
export function suspensionEnd(now = Date.now()) { return new Date(now + SUSPENSION_DAYS * DAY).toISOString(); }
/** 1st false report: warning + reporting paused. 2nd: permanent ban. */
export const falseReportPenalty = (offences: number): Penalty => (offences >= FALSE_REPORT_BAN_AT ? "ban" : "warning");

/* ---------- 6. rules shown to everyone ---------- */
export const RULES: { icon: string; title: string; text: string }[] = [
  { icon: "🧪", title: "Safe food only", text: "No recipes that could poison or injure someone: toxic substances, raw-meat advice, unsafe canning, dangerous challenges." },
  { icon: "🎯", title: "Deliver what you promise", text: "The photo, title and description must match the recipe. Paid recipes need real amounts and real steps." },
  { icon: "🚫", title: "No scams. Ever.", text: "Fake recipes, bait-and-switch, fake reviews, off-platform payment, outside links, fake urgency. A confirmed scam is an instant, permanent ban. No warning, no second chance." },
  { icon: "✍️", title: "Original work only", text: "Don't copy other cooks' recipes, photos or text." },
  { icon: "🤝", title: "Be decent, report honestly", text: "No harassment. Reporting someone you know is innocent is abuse: the first time you lose reporting and get a warning, the second time you're permanently banned." },
];
export const SCAM_WARNING = "Scamming is not allowed on CRUNCH, period. Every recipe and post is scanned, logged and tied to your account. If a moderator confirms a scam, a fake recipe or a bait-and-switch, you are PERMANENTLY BANNED the first time. No warnings. Other rule-breaking earns strikes, and false-reporting other people gets you banned on the second offence.";

export const daysSince = (iso: string, now = Date.now()) => Math.max(0, (now - new Date(iso).getTime()) / DAY);
