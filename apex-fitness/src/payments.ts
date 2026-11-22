/*
 * Simulated payments (TEST MODE).
 *
 * Nothing here talks to a payment provider and no money moves. The checkout validates a
 * card the way a real one would, waits like a real charge, then succeeds or declines
 * based on the test card used. Only the card brand and last 4 digits are ever stored;
 * the full number, expiry and CVC never leave the checkout form.
 */
import { dayKey } from "./lib";

export type PlanId = "monthly" | "yearly";

export interface Plan {
  id: PlanId;
  name: string;
  price: number; // USD
  period: "month" | "year";
  note?: string;
}

export const PLANS: Plan[] = [
  { id: "monthly", name: "Monthly", price: 9.99, period: "month" },
  { id: "yearly", name: "Yearly", price: 79.99, period: "year", note: "Save 33%" },
];

export const planById = (id: PlanId): Plan => PLANS.find((p) => p.id === id) ?? PLANS[0];

export type CardBrand = "Visa" | "Mastercard" | "Amex" | "Discover" | "Card";

export interface Subscription {
  plan: PlanId;
  status: "active" | "canceled";
  startedOn: string; // YYYY-MM-DD
  /** Next charge date, or the day access ends once canceled. */
  renewsOn: string;
  brand: CardBrand;
  last4: string;
}

export interface Payment {
  id: string;
  date: string; // YYYY-MM-DD
  amount: number;
  plan: PlanId;
  brand: CardBrand;
  last4: string;
}

/** Test cards: these decline. Any other valid card number succeeds. */
export const TEST_CARDS = {
  success: "4242 4242 4242 4242",
  declined: "4000 0000 0000 0002",
  insufficient: "4000 0000 0000 9995",
};

export const fmtMoney = (n: number): string => `$${n.toFixed(2)}`;

export const digits = (v: string): string => v.replace(/\D/g, "");

export function cardBrand(num: string): CardBrand {
  const d = digits(num);
  if (/^4/.test(d)) return "Visa";
  if (/^(5[1-5]|2[2-7])/.test(d)) return "Mastercard";
  if (/^3[47]/.test(d)) return "Amex";
  if (/^6(011|5)/.test(d)) return "Discover";
  return "Card";
}

/** "4242424242424242" → "4242 4242 4242 4242" (Amex: 4-6-5). */
export function formatCardNumber(v: string): string {
  const d = digits(v).slice(0, cardBrand(v) === "Amex" ? 15 : 16);
  if (cardBrand(d) === "Amex") return [d.slice(0, 4), d.slice(4, 10), d.slice(10)].filter(Boolean).join(" ");
  return d.replace(/(.{4})/g, "$1 ").trim();
}

/** "1228" → "12 / 28". */
export function formatExpiry(v: string): string {
  const d = digits(v).slice(0, 4);
  return d.length > 2 ? `${d.slice(0, 2)} / ${d.slice(2)}` : d;
}

/** Luhn checksum, as real card numbers have. */
export function luhnOk(num: string): boolean {
  const d = digits(num);
  if (d.length < 13 || d.length > 19) return false;
  let sum = 0;
  for (let i = 0; i < d.length; i++) {
    let n = Number(d[d.length - 1 - i]);
    if (i % 2 === 1) {
      n *= 2;
      if (n > 9) n -= 9;
    }
    sum += n;
  }
  return sum % 10 === 0;
}

export interface CardInput {
  name: string;
  number: string;
  expiry: string;
  cvc: string;
  zip: string;
}

export type CardErrors = Partial<Record<keyof CardInput, string>>;

export function validateCard(c: CardInput, now = new Date()): CardErrors {
  const e: CardErrors = {};
  if (!c.name.trim()) e.name = "Enter the name on the card.";
  const brand = cardBrand(c.number);
  const len = digits(c.number).length;
  if (!len) e.number = "Enter a card number.";
  else if (len !== (brand === "Amex" ? 15 : 16) || !luhnOk(c.number)) e.number = "That card number isn't valid.";
  const ex = digits(c.expiry);
  const mm = Number(ex.slice(0, 2));
  const yy = Number(ex.slice(2, 4));
  if (ex.length !== 4 || mm < 1 || mm > 12) e.expiry = "Use MM / YY.";
  else {
    // Valid through the last day of the expiry month.
    const end = new Date(2000 + yy, mm, 1);
    if (end <= now) e.expiry = "This card has expired.";
  }
  if (digits(c.cvc).length !== (brand === "Amex" ? 4 : 3)) e.cvc = brand === "Amex" ? "4 digits." : "3 digits.";
  if (!/^[A-Za-z0-9 -]{3,10}$/.test(c.zip.trim())) e.zip = "Enter your ZIP / postal code.";
  return e;
}

/** Same day next month / next year (clamped to month end: Jan 31 → Feb 28). */
export function addPeriod(iso: string, period: Plan["period"]): string {
  const [y, m, d] = iso.split("-").map(Number);
  const months = period === "year" ? 12 : 1;
  const target = new Date(y, m - 1 + months, 1);
  const lastDay = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate();
  target.setDate(Math.min(d, lastDay));
  return dayKey(target);
}

export type ChargeResult = { ok: true } | { ok: false; error: string };

/** Pretend to charge the card: waits like a real network call, then decides by test card. */
export async function fakeCharge(card: CardInput): Promise<ChargeResult> {
  await new Promise((r) => setTimeout(r, 1600));
  const d = digits(card.number);
  if (d === digits(TEST_CARDS.declined)) return { ok: false, error: "Your card was declined. Try a different card." };
  if (d === digits(TEST_CARDS.insufficient)) return { ok: false, error: "Your card has insufficient funds." };
  return { ok: true };
}

/** Premium is on while the subscription is active, or canceled but still inside the paid period. */
export function hasPremium(sub: Subscription | null, today: string): boolean {
  if (!sub) return false;
  return sub.status === "active" || today < sub.renewsOn;
}
