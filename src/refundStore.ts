import { ALL_RECIPES } from "./data";
import type { State } from "./store";
import { orderRefundBlock, reasonRule, refundableIds, REFUND_WINDOW_DAYS } from "./refunds";
import type { Purchase, RefundReason } from "./types";

type Set = (fn: (s: State) => Partial<State> | State) => void;
type Get = () => State;

const priceOf = (s: State, p: Purchase, id: string) => p.unitPrices?.[id] ?? [...ALL_RECIPES, ...s.customRecipes].find((r) => r.id === id)?.price ?? 0;
const money2 = (n: number) => Math.round(n * 100) / 100;

/** Marks recipes in an order refunded and fixes the order status. Pure: returns the updated purchase. */
function applyRefund(s: State, p: Purchase, ids: string[], state: "approved" | "auto", note: string, reason?: string): Purchase {
  const refundedIds = [...new Set([...(p.refundedIds ?? []), ...ids])];
  const amount = money2((p.refund?.state === "approved" ? p.refund.amount ?? 0 : 0) + ids.reduce((t, id) => t + priceOf(s, p, id), 0));
  const rec = p.refund ?? { reason: (reason ?? "removed") as never, details: "", ids, at: new Date().toISOString(), state };
  const allGone = p.recipeIds.every((id) => refundedIds.includes(id) || priceOf(s, p, id) === 0);
  return { ...p, refundedIds, status: allGone ? "refunded" : "paid", refund: { ...rec, ids: [...new Set([...(rec.ids ?? []), ...ids])], state, decidedAt: new Date().toISOString(), note, amount } };
}

/** Called when moderators remove a recipe for being unsafe / a scam / stolen: buyers get their money back automatically. */
export function autoRefundRecipe(set: Set, get: Get, recipeId: string, note = "The recipe was removed by moderators.") {
  const hit = get().purchases.filter((p) => p.recipeIds.includes(recipeId) && !p.refundedIds?.includes(recipeId) && p.status !== "refunded");
  if (!hit.length) return;
  set((s) => ({ purchases: s.purchases.map((p) => (hit.some((h) => h.id === p.id) ? applyRefund(s, p, [recipeId], "auto", note) : p)) }));
}

export function createRefunds(set: Set, get: Get) {
  const requestRefund = (orderId: string, reason: RefundReason, ids: string[], details: string): string | null => {
    const s = get(); const p = s.purchases.find((x) => x.id === orderId); if (!p) return "Order not found.";
    const rule = reasonRule(reason);
    if (!rule.covered) return "That reason isn't covered by our refund policy. See the Terms of Service for what is.";
    const block = orderRefundBlock(p, s.purchases); if (block) return block;
    const ok = refundableIds(p); const pick = ids.filter((id) => ok.includes(id));
    if (!pick.length) return "Choose at least one recipe from this order.";
    if (rule.needsDetails && details.trim().length < 20) return "Please explain what happened (at least 20 characters).";

    if (reason === "duplicate") {
      const dupes = pick.filter((id) => s.purchases.some((o) => o.id !== p.id && o.status !== "refunded" && o.recipeIds.includes(id) && !o.refundedIds?.includes(id)));
      if (!dupes.length) return "We couldn't find a second purchase of that recipe, so this can't be refunded automatically.";
      set((st) => ({ purchases: st.purchases.map((x) => (x.id === p.id ? applyRefund(st, { ...x, refund: { reason, details: "", ids: dupes, at: new Date().toISOString(), state: "auto" } }, dupes, "auto", "Duplicate purchase refunded automatically.", reason) : x)) }));
      return null;
    }
    set((st) => ({ purchases: st.purchases.map((x) => (x.id === p.id ? { ...x, status: "refund_requested", refund: { reason, details: details.trim().slice(0, 800), ids: pick, at: new Date().toISOString(), state: "requested" } } : x)) }));
    // Safety problems also go straight to moderators as a report, so the listing can be pulled fast.
    if (reason === "unsafe") pick.forEach((id) => get().report("listing", id, "[From refund request] " + details.trim(), "illness"));
    return null;
  };

  const decideRefund = (orderId: string, approve: boolean, note: string) => {
    const p = get().purchases.find((x) => x.id === orderId); if (!p || p.status !== "refund_requested" || !p.refund) return;
    if (approve) set((s) => ({ purchases: s.purchases.map((x) => (x.id === orderId ? applyRefund(s, x, x.refund!.ids, "approved", note || "Approved") : x)) }));
    else set((s) => ({ purchases: s.purchases.map((x) => (x.id === orderId ? { ...x, status: "paid", refund: { ...x.refund!, state: "denied", decidedAt: new Date().toISOString(), note: note || "Not covered by the refund policy." } } : x)) }));
  };
  return { requestRefund, decideRefund, REFUND_WINDOW_DAYS };
}
