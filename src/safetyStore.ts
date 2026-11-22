/* Store actions for the safety system. Kept out of store.ts so the rules are easy to read in one place. */
import { ALL_RECIPES } from "./data";
import type { State } from "./store";
import {
  REPORT_HOURLY_LIMIT, REPORT_CATEGORIES, activeStrikes, daysSince, looksLikePileOn, pauseUntil, penaltyFor, penaltyText, publishDecision, reportScore,
  reporterWeight, reportingPaused, scanRecipe, scanText, shouldPause, suspensionEnd, thresholdFor, type Flag, type Penalty,
} from "./safety";
import type { Appeal, Hold, Recipe, Removal, Report, ReportCategory, ReporterStats, Strike } from "./types";

type Set = (fn: (s: State) => Partial<State> | State) => void;
type Get = () => State;
const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);

export type PublishOutcome = { result: "saved" | "published" | "review" | "blocked"; flags: Flag[]; message: string };
export type PostOutcome = { result: "posted" | "review" | "blocked"; flags: Flag[]; message: string };

/** Honest examples shown until real removals exist, clearly labelled as examples. */
export const EXAMPLE_REMOVALS: Removal[] = [
  { id: "ex1", what: "Recipe listing", category: "unsafe", outcome: "Removed · account permanently banned", at: "", example: true },
  { id: "ex2", what: "Paid recipe with no real steps", category: "scam", outcome: "Removed · account suspended 7 days", at: "", example: true },
  { id: "ex3", what: "Listing asking buyers to pay on another app", category: "scam", outcome: "Removed · account warned", at: "", example: true },
  { id: "ex4", what: "Copied recipe and photos", category: "stolen", outcome: "Removed · account warned", at: "", example: true },
];

/** Why this account can't post/publish/sell right now, or null if it can. */
export function blockReason(s: Pick<State, "banned" | "suspensions">, accountId: string | null | undefined, now = Date.now()): string | null {
  if (!accountId) return "Sign in first.";
  if (s.banned.includes(accountId)) return "Your account is permanently banned.";
  const until = s.suspensions[accountId];
  if (until && new Date(until).getTime() > now) return `Your account is suspended until ${new Date(until).toLocaleDateString()}. You can read and cook, but not post, publish, sell, review or message.`;
  return null;
}

export function createSafety(set: Set, get: Get) {
  const me = () => get().accounts.find((a) => a.id === get().session) ?? null;
  const ownerOf = (kind: Report["kind"], id: string): string | undefined => {
    const s = get();
    if (kind === "creator") return id;
    if (kind === "post") return s.posts.find((p) => p.id === id)?.userId;
    return [...ALL_RECIPES, ...s.customRecipes].find((r) => r.id === id)?.creatorId;
  };
  const setRecipeStatus = (id: string, status: Recipe["status"]) => {
    if (get().customRecipes.some((r) => r.id === id)) set((s) => ({ customRecipes: s.customRecipes.map((r) => (r.id === id ? { ...r, status } : r)) }));
    else set((s) => ({ recipeStatusOverride: { ...s.recipeStatusOverride, [id]: status } }));
  };
  const recipeStatus = (id: string) => get().customRecipes.find((r) => r.id === id)?.status ?? get().recipeStatusOverride[id] ?? ALL_RECIPES.find((r) => r.id === id)?.status;
  const dropHold = (id: string) => set((s) => { const h = { ...s.holds }; delete h[id]; return { holds: h }; });
  const addRemoval = (what: string, category: Removal["category"], outcome: string) =>
    set((s) => ({ removals: [{ id: uid(), what, category, outcome, at: new Date().toISOString() }, ...s.removals].slice(0, 200) }));

  /** Records a strike and applies the ladder: warning -> 7-day suspension -> permanent ban. Admins are never struck. */
  const addStrike = (accountId: string, reason: string, targetId?: string): Penalty | null => {
    const acct = get().accounts.find((a) => a.id === accountId);
    if (!acct || acct.role === "admin") return null;
    const strike: Strike = { id: uid(), accountId, reason, at: new Date().toISOString(), targetId };
    set((s) => ({ strikes: [strike, ...s.strikes] }));
    const penalty = penaltyFor(activeStrikes(get().strikes, accountId).length);
    if (penalty === "suspension") set((s) => ({ suspensions: { ...s.suspensions, [accountId]: suspensionEnd() } }));
    if (penalty === "ban") set((s) => ({ banned: s.banned.includes(accountId) ? s.banned : [...s.banned, accountId] }));
    return penalty;
  };

  const creditReporters = (rs: Report[], upheld: boolean) => {
    set((s) => {
      const stats = { ...s.reporterStats };
      for (const r of rs) {
        if (!r.reporterId) continue;
        const cur: ReporterStats = { ...(stats[r.reporterId] ?? { upheld: 0, dismissed: 0 }) };
        if (upheld) cur.upheld += 1; else { cur.dismissed += 1; if (shouldPause(cur)) cur.pausedUntil = pauseUntil(); }
        stats[r.reporterId] = cur;
      }
      return { reporterStats: stats };
    });
  };

  const upsertRecipe = (r: Recipe): PublishOutcome => {
    const s = get(); const a = me();
    const existing = s.customRecipes.find((x) => x.id === r.id);
    const store = (rec: Recipe) => set((st) => ({ customRecipes: st.customRecipes.some((x) => x.id === rec.id) ? st.customRecipes.map((x) => (x.id === rec.id ? rec : x)) : [rec, ...st.customRecipes] }));
    if (existing?.status === "removed") return { result: "blocked", flags: [], message: "This recipe was removed by moderators. You can appeal from your Studio." };
    if (r.status !== "published") {
      // Saving as draft/unpublished is always allowed, but you can't use "draft" to escape a pending review.
      store({ ...r, status: existing?.status === "review" ? "review" : r.status });
      return { result: "saved", flags: [], message: "Saved." };
    }
    const why = blockReason(s, a?.id);
    if (why) { store({ ...r, status: "draft" }); return { result: "blocked", flags: [], message: why }; }
    const flags = scanRecipe(r);
    const decision = publishDecision(flags, {
      strikes: activeStrikes(s.strikes, a!.id).length, accountAgeDays: daysSince(a!.createdAt), isAdmin: a!.role === "admin",
      approvedBefore: s.customRecipes.filter((x) => x.creatorId === a!.id && x.id !== r.id && x.status === "published").length,
    });
    if (decision.result === "blocked") {
      store({ ...r, status: "draft" });
      const attempts = (s.blockedAttempts[a!.id] ?? 0) + 1;
      set((st) => ({ blockedAttempts: { ...st.blockedAttempts, [a!.id]: attempts % 3 } }));
      let extra = "";
      if (attempts % 3 === 0) { const p = addStrike(a!.id, "Repeatedly tried to publish dangerous food content"); if (p) extra = ` Three blocked attempts earned you a strike (${penaltyText(p)}).`; }
      return { result: "blocked", flags: decision.flags, message: "Not published: " + decision.flags.map((f) => f.message).join("; ") + "." + extra };
    }
    if (decision.result === "review") {
      store({ ...r, status: "review" });
      const hold: Hold = { targetId: r.id, kind: "recipe", reason: decision.why, flags: decision.flags.map((f) => f.message), at: new Date().toISOString() };
      set((st) => ({ holds: { ...st.holds, [r.id]: hold } }));
      return { result: "review", flags: decision.flags, message: decision.why === "scan" ? "Sent for a quick safety review before it goes live." : "Sent for a quick review. New accounts' first recipes are checked by a person." };
    }
    store({ ...r, status: "published" });
    dropHold(r.id);
    get().award("publish:" + r.id, 50);
    return { result: "published", flags: [], message: "Published!" };
  };

  const addPost = (p: Parameters<State["addPost"]>[0]): PostOutcome => {
    const s = get(); const a = me();
    const why = blockReason(s, a?.id); if (why) return { result: "blocked", flags: [], message: why };
    const flags = scanText(p.text + " " + p.ingredients.join(" "));
    const hard = flags.filter((f) => f.level === "block");
    if (hard.length && a!.role !== "admin") return { result: "blocked", flags: hard, message: "Not posted: " + hard.map((f) => f.message).join("; ") + "." };
    const soft = flags.filter((f) => f.level === "review");
    const id = uid();
    const hold = soft.length > 0 && a!.role !== "admin";
    set((st) => ({
      posts: [{ ...p, id, userId: a!.id, userName: a!.name, userEmoji: a!.emoji, likes: 0, comments: [], saves: 0, reposts: 0, createdAt: "now", hidden: hold || undefined }, ...st.posts],
      holds: hold ? { ...st.holds, [id]: { targetId: id, kind: "post", reason: "scan", flags: soft.map((f) => f.message), at: new Date().toISOString() } } : st.holds,
    }));
    if (hold) return { result: "review", flags: soft, message: "Your post is waiting for a quick safety check." };
    get().award("post:" + id, 5);
    return { result: "posted", flags: [], message: "Posted to the community" };
  };

  /** Files a report. Returns an error string, or null on success. */
  const report = (kind: Report["kind"], targetId: string, reason: string, category: ReportCategory = "other"): string | null => {
    const s = get(); const a = me(); if (!a) return "Sign in to report.";
    if (reason.trim().length < 5) return "Please add a short reason.";
    const owner = ownerOf(kind, targetId);
    if (owner && owner === a.id) return "You can't report your own content.";
    const stats = s.reporterStats[a.id];
    if (reportingPaused(stats)) return `Reporting is paused on your account until ${new Date(stats!.pausedUntil!).toLocaleDateString()} because most of your recent reports were rejected.`;
    if (s.reports.some((r) => r.reporterId === a.id && r.targetId === targetId && r.kind === kind && r.status === "open")) return "You've already reported this. Moderators will review it.";
    const hourAgo = Date.now() - 3_600_000;
    if (s.reports.filter((r) => r.reporterId === a.id && new Date(r.at).getTime() > hourAgo).length >= REPORT_HOURLY_LIMIT) return "You're reporting very quickly. Please wait a bit and try again.";

    const weight = reporterWeight(stats, daysSince(a.createdAt));
    const rep: Report = { id: uid(), kind, targetId, reason: reason.trim().slice(0, 500), at: new Date().toISOString(), status: "open", reporterId: a.id, category, weight };
    const open = [...s.reports.filter((r) => r.kind === kind && r.targetId === targetId && r.status === "open"), rep];
    const suspicious = looksLikePileOn(open);
    const score = reportScore(open);
    const severe = open.some((r) => REPORT_CATEGORIES.find((c) => c.id === r.category)?.severe);
    const trip = !suspicious && score >= thresholdFor(severe ? "unsafe" : category);
    set((st) => ({ reports: [{ ...rep, suspicious }, ...st.reports.map((r) => (suspicious && open.some((o) => o.id === r.id) ? { ...r, suspicious: true } : r))] }));

    // Enough credible reports: hide it until a person looks (hide, never delete).
    if (trip && !get().holds[targetId]) {
      if ((kind === "listing" || kind === "copyright") && recipeStatus(targetId) === "published") {
        setRecipeStatus(targetId, "review");
        set((st) => ({ holds: { ...st.holds, [targetId]: { targetId, kind: "recipe", reason: "reports", flags: ["Hidden after reports from several people"], at: new Date().toISOString() } } }));
      } else if (kind === "post") {
        set((st) => ({ posts: st.posts.map((p) => (p.id === targetId ? { ...p, hidden: true } : p)), holds: { ...st.holds, [targetId]: { targetId, kind: "post", reason: "reports", flags: ["Hidden after reports from several people"], at: new Date().toISOString() } } }));
      }
    }
    return null;
  };

  const sameTarget = (r: Report) => (x: Report) => x.kind === r.kind && x.targetId === r.targetId && x.status === "open";
  const restoreIfReportHold = (kind: Report["kind"], targetId: string) => {
    const h = get().holds[targetId];
    if (!h || h.reason !== "reports") return;
    if (get().reports.some((x) => x.targetId === targetId && x.kind === kind && x.status === "open")) return;
    if (h.kind === "recipe") setRecipeStatus(targetId, "published"); else set((st) => ({ posts: st.posts.map((p) => (p.id === targetId ? { ...p, hidden: false } : p)) }));
    dropHold(targetId);
  };

  /** Admin: report is valid. Removes the content, strikes the owner, credits every reporter, logs it on the public wall. */
  const actionReport = (id: string) => {
    const r = get().reports.find((x) => x.id === id); if (!r || r.status !== "open") return;
    const group = get().reports.filter(sameTarget(r));
    const owner = ownerOf(r.kind, r.targetId);
    const label = REPORT_CATEGORIES.find((c) => c.id === r.category)?.label ?? "Policy violation";
    if (r.kind === "listing" || r.kind === "copyright") setRecipeStatus(r.targetId, "removed");
    if (r.kind === "post") set((st) => ({ posts: st.posts.map((p) => (p.id === r.targetId ? { ...p, hidden: true } : p)) }));
    dropHold(r.targetId);
    const penalty = owner ? addStrike(owner, label, r.targetId) : null;
    creditReporters(group, true);
    set((st) => ({ reports: st.reports.map((x) => (group.some((g) => g.id === x.id) ? { ...x, status: "actioned" } : x)) }));
    addRemoval(r.kind === "post" ? "Community post" : r.kind === "creator" ? "Creator account" : "Recipe listing", r.category ?? "other", "Removed" + (penalty ? " · " + penaltyText(penalty) : ""));
  };
  /** Admin: report was wrong. Only that report is dismissed; the reporter's track record takes the hit. */
  const dismissReport = (id: string) => {
    const r = get().reports.find((x) => x.id === id); if (!r || r.status !== "open") return;
    set((st) => ({ reports: st.reports.map((x) => (x.id === id ? { ...x, status: "dismissed" } : x)) }));
    if (r.kind !== "copyright") creditReporters([r], false);   // copyright complaints are made in good faith; never penalised
    restoreIfReportHold(r.kind, r.targetId);
  };

  /* ---------- held items ---------- */
  const approveHold = (id: string) => {
    const h = get().holds[id]; if (!h) return;
    if (h.kind === "recipe") { setRecipeStatus(id, "published"); get().award("publish:" + id, 50); } else set((st) => ({ posts: st.posts.map((p) => (p.id === id ? { ...p, hidden: false } : p)) }));
    // reports on it were not upheld
    const open = get().reports.filter((x) => x.targetId === id && x.status === "open");
    open.forEach((x) => dismissReport(x.id));
    dropHold(id);
  };
  const rejectHold = (id: string, withStrike: boolean) => {
    const h = get().holds[id]; if (!h) return;
    const owner = h.kind === "recipe" ? ownerOf("listing", id) : ownerOf("post", id);
    if (h.kind === "recipe") setRecipeStatus(id, "removed"); else set((st) => ({ posts: st.posts.map((p) => (p.id === id ? { ...p, hidden: true } : p)) }));
    const penalty = withStrike && owner ? addStrike(owner, "Failed safety review: " + (h.flags[0] ?? "policy violation"), id) : null;
    const group = get().reports.filter((x) => x.targetId === id && x.status === "open");
    creditReporters(group, true);
    set((st) => ({ reports: st.reports.map((x) => (group.some((g) => g.id === x.id) ? { ...x, status: "actioned" } : x)) }));
    dropHold(id);
    addRemoval(h.kind === "post" ? "Community post" : "Recipe listing", "scan", "Removed" + (penalty ? " · " + penaltyText(penalty) : ""));
  };

  /* ---------- appeals ---------- */
  const appeal = (targetId: string, text: string): string | null => {
    const a = me(); if (!a) return "Sign in first.";
    if (text.trim().length < 20) return "Explain what happened in at least 20 characters.";
    if (get().appeals.some((x) => x.targetId === targetId && x.accountId === a.id && x.status === "open")) return "You already have an open appeal for this.";
    const ap: Appeal = { id: uid(), accountId: a.id, targetId, text: text.trim().slice(0, 800), at: new Date().toISOString(), status: "open" };
    set((s) => ({ appeals: [ap, ...s.appeals] })); return null;
  };
  const decideAppeal = (id: string, approve: boolean) => {
    const ap = get().appeals.find((x) => x.id === id); if (!ap || ap.status !== "open") return;
    set((s) => ({ appeals: s.appeals.map((x) => (x.id === id ? { ...x, status: approve ? "approved" : "denied" } : x)) }));
    if (!approve) return;
    if (get().customRecipes.some((r) => r.id === ap.targetId) || ALL_RECIPES.some((r) => r.id === ap.targetId)) setRecipeStatus(ap.targetId, "published");
    set((s) => ({ posts: s.posts.map((p) => (p.id === ap.targetId ? { ...p, hidden: false } : p)) }));
    dropHold(ap.targetId);
    // Give back the strike that was earned by this content and any penalty that came from it.
    set((s) => ({ strikes: s.strikes.map((k) => (k.accountId === ap.accountId && k.targetId === ap.targetId ? { ...k, revoked: true } : k)) }));
    const left = activeStrikes(get().strikes, ap.accountId).length;
    if (left < 2) set((s) => { const sp = { ...s.suspensions }; delete sp[ap.accountId]; return { suspensions: sp }; });
    if (left < 3) set((s) => ({ banned: s.banned.filter((x) => x !== ap.accountId) }));
  };

  return { upsertRecipe, addPost, report, actionReport, dismissReport, approveHold, rejectHold, appeal, decideAppeal, addStrike };
}
