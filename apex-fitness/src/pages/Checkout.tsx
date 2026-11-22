import { useEffect, useRef, useState } from "react";
import Icon from "../components/Icon";
import Modal from "../components/Modal";
import { useToday } from "../lib";
import {
  TEST_CARDS,
  addPeriod,
  cardBrand,
  digits,
  fakeCharge,
  fmtMoney,
  formatCardNumber,
  formatExpiry,
  planById,
  validateCard,
  type CardInput,
  type PlanId,
} from "../payments";
import { useApp } from "../store";

const fmtLong = (iso: string) => new Date(`${iso}T00:00:00`).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });

/** Test-mode checkout sheet: card form → processing → success (or a decline to retry). */
export default function Checkout({ planId, onClose }: { planId: PlanId; onClose: () => void }) {
  const subscribe = useApp((s) => s.subscribe);
  const today = useToday();
  const plan = planById(planId);

  const [card, setCard] = useState<CardInput>({ name: useApp.getState().name, number: "", expiry: "", cvc: "", zip: "" });
  const [touched, setTouched] = useState<Partial<Record<keyof CardInput, boolean>>>({});
  const [submitted, setSubmitted] = useState(false);
  const [status, setStatus] = useState<"form" | "processing" | "done">("form");
  const [declined, setDeclined] = useState<string | null>(null);
  const alive = useRef(true);
  useEffect(() => {
    alive.current = true; // re-arm on (re)mount; StrictMode mounts twice in development
    return () => {
      alive.current = false;
    };
  }, []);

  const errors = validateCard(card);
  const valid = Object.keys(errors).length === 0;
  const show = (k: keyof CardInput) => (submitted || touched[k]) && errors[k];
  const brand = cardBrand(card.number);

  const set = (k: keyof CardInput, v: string) => {
    setDeclined(null);
    setCard((c) => ({ ...c, [k]: v }));
  };

  const pay = async () => {
    setSubmitted(true);
    if (!valid || status !== "form") return;
    setStatus("processing");
    const res = await fakeCharge(card);
    if (!alive.current) return;
    if (!res.ok) {
      setDeclined(res.error);
      setStatus("form");
      return;
    }
    subscribe(planId, { brand, last4: digits(card.number).slice(-4) }, today);
    setStatus("done");
  };

  // While "charging", the sheet can't be dismissed (like a real payment in flight).
  const close = () => status !== "processing" && onClose();

  if (status === "done") {
    return (
      <Modal title="Membership confirmed" onClose={onClose}>
        <div className="flex flex-col items-center py-2 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full border border-white/15 text-moon">
            <Icon name="check" size={26} />
          </div>
          <p className="display mt-5 text-[30px]">
            Welcome to <span className="italic text-moon">Premium</span>
          </p>
          <p className="mt-1 text-sm text-white/60">
            Paid {fmtMoney(plan.price)} with {brand} •••• {digits(card.number).slice(-4)}. Renews {fmtLong(addPeriod(today, plan.period))}.
          </p>
          <button onClick={onClose} className="btn-primary mt-6 w-full py-3.5">
            Continue
          </button>
          <p className="mt-3 text-[11px] text-white/35">Test mode: no real money was charged.</p>
        </div>
      </Modal>
    );
  }

  const processing = status === "processing";

  return (
    <Modal title="Checkout" onClose={close}>
      <div className="mb-4 flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.02] px-4 py-3">
        <div>
          <p className="text-sm font-medium">Lunor Premium · {plan.name}</p>
          <p className="text-xs text-white/50">Renews every {plan.period} · cancel anytime</p>
        </div>
        <p className="display text-[28px]">{fmtMoney(plan.price)}</p>
      </div>

      <div className="mb-4 rounded-xl border border-white/10 px-3 py-2.5 text-[11px] leading-relaxed text-white/55">
        <span className="font-medium text-white/80">Test mode</span> — no real card is charged. Use <span className="font-mono">{TEST_CARDS.success}</span> with any future
        date and CVC. <span className="font-mono">{TEST_CARDS.declined}</span> simulates a decline.
      </div>

      <form
        noValidate
        className="space-y-3"
        onSubmit={(e) => {
          e.preventDefault();
          void pay();
        }}
      >
        <fieldset disabled={processing} className="space-y-3">
          <Field label="Name on card" error={show("name")}>
            <input
              className="input"
              autoComplete="cc-name"
              value={card.name}
              maxLength={40}
              onChange={(e) => set("name", e.target.value)}
              onBlur={() => setTouched((t) => ({ ...t, name: true }))}
            />
          </Field>
          <Field label="Card number" error={show("number")}>
            <div className="relative">
              <input
                className="input pr-24 font-mono tracking-wider"
                inputMode="numeric"
                autoComplete="cc-number"
                placeholder="1234 1234 1234 1234"
                value={card.number}
                onChange={(e) => set("number", formatCardNumber(e.target.value))}
                onBlur={() => setTouched((t) => ({ ...t, number: true }))}
              />
              {digits(card.number).length > 0 && (
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-white/50">{brand}</span>
              )}
            </div>
          </Field>
          <div className="grid grid-cols-3 gap-3">
            <Field label="Expiry" error={show("expiry")}>
              <input
                className="input font-mono"
                inputMode="numeric"
                autoComplete="cc-exp"
                placeholder="MM / YY"
                value={card.expiry}
                onChange={(e) => set("expiry", formatExpiry(e.target.value))}
                onBlur={() => setTouched((t) => ({ ...t, expiry: true }))}
              />
            </Field>
            <Field label="CVC" error={show("cvc")}>
              <input
                className="input font-mono"
                inputMode="numeric"
                autoComplete="cc-csc"
                placeholder={brand === "Amex" ? "1234" : "123"}
                value={card.cvc}
                onChange={(e) => set("cvc", digits(e.target.value).slice(0, 4))}
                onBlur={() => setTouched((t) => ({ ...t, cvc: true }))}
              />
            </Field>
            <Field label="ZIP" error={show("zip")}>
              <input
                className="input"
                autoComplete="postal-code"
                placeholder="12345"
                value={card.zip}
                maxLength={10}
                onChange={(e) => set("zip", e.target.value)}
                onBlur={() => setTouched((t) => ({ ...t, zip: true }))}
              />
            </Field>
          </div>
        </fieldset>

        {declined && (
          <p role="alert" className="rounded-xl border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-200">
            {declined}
          </p>
        )}

        <button type="submit" disabled={processing} className="btn-primary w-full py-3.5 text-base disabled:opacity-80">
          {processing ? (
            <>
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-black/30 border-t-black" aria-hidden="true" /> Processing…
            </>
          ) : (
            <>
              <Icon name="lock" size={16} /> Pay {fmtMoney(plan.price)}
            </>
          )}
        </button>
        <p className="text-center text-[11px] text-white/35">
          By subscribing you agree to be billed {fmtMoney(plan.price)} every {plan.period} until you cancel.
        </p>
      </form>
    </Modal>
  );
}

function Field({ label, error, children }: { label: string; error?: string | false; children: React.ReactNode }) {
  return (
    <label className="block text-xs font-semibold text-white/60">
      <span className="mb-1 block">{label}</span>
      {children}
      {error && <span className="mt-1 block text-[11px] font-medium text-red-400">{error}</span>}
    </label>
  );
}
