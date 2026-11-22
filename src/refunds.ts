/* CRUNCH refund policy. One source of truth: the refund dialog, the store rules and the Terms of Service all read this. */
import type { Purchase, RefundReason } from "./types";

export const REFUND_WINDOW_DAYS = 7;
export const MAX_DENIED_BEFORE_PAUSE = 3;

export interface ReasonRule { id: RefundReason; label: string; covered: boolean; auto?: boolean; needsDetails: boolean; note: string }
export const REFUND_REASONS: ReasonRule[] = [
  { id: "misleading", label: "It doesn't match the title, photo or description", covered: true, needsDetails: true, note: "A moderator compares the recipe with its listing." },
  { id: "incomplete", label: "Missing ingredients, amounts or steps", covered: true, needsDetails: true, note: "Tell us what's missing." },
  { id: "unsafe", label: "It was unsafe, or someone got sick", covered: true, needsDetails: true, note: "Also reported to moderators right away as a safety issue. If you need medical help, get it first." },
  { id: "allergen", label: "It contains an allergen that wasn't listed", covered: true, needsDetails: true, note: "Applies to allergens missing from the listing. Check the allergen list before you cook." },
  { id: "duplicate", label: "I accidentally bought it twice", covered: true, auto: true, needsDetails: false, note: "Refunded automatically when we find the second purchase." },
  { id: "other", label: "Something else", covered: true, needsDetails: true, note: "Reviewed case by case. Explain what happened." },
  { id: "changed-mind", label: "I changed my mind", covered: false, needsDetails: false, note: "" },
  { id: "taste", label: "I didn't like how it tasted", covered: false, needsDetails: false, note: "" },
  { id: "my-mistake", label: "It didn't turn out (I changed it or made a mistake)", covered: false, needsDetails: false, note: "" },
  { id: "found-free", label: "I found a similar recipe for free", covered: false, needsDetails: false, note: "" },
];
export const reasonRule = (id: RefundReason) => REFUND_REASONS.find((r) => r.id === id)!;

export const REFUND_AUTOMATIC = "A recipe you bought is removed by moderators for being unsafe, a scam or stolen: you're refunded automatically, no request needed.";

export const daysAgo = (iso: string, now = Date.now()) => (now - new Date(iso).getTime()) / 86_400_000;
export const withinWindow = (p: Purchase, now = Date.now()) => daysAgo(p.at, now) <= REFUND_WINDOW_DAYS;
export const refundableIds = (p: Purchase) => p.recipeIds.filter((id) => !p.refundedIds?.includes(id) && (p.unitPrices?.[id] ?? 1) > 0);
export const deniedCount = (ps: Purchase[]) => ps.filter((p) => p.refund?.state === "denied").length;

/** Whether this order can currently be refunded (before looking at the reason). */
export function orderRefundBlock(p: Purchase, all: Purchase[], now = Date.now()): string | null {
  if (p.status === "refunded") return "Already refunded.";
  if (p.refund && p.refund.state !== "auto") return p.refund.state === "requested" ? "A refund request is already being reviewed." : "A request for this order was already reviewed.";
  if (!refundableIds(p).length) return "Nothing in this order is refundable (free or already refunded).";
  if (!withinWindow(p, now)) return `Refunds must be requested within ${REFUND_WINDOW_DAYS} days of purchase.`;
  if (deniedCount(all) >= MAX_DENIED_BEFORE_PAUSE) return "Refund requests are paused on this account after several denied requests.";
  return null;
}
