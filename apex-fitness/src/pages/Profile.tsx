import { useMemo, useRef, useState } from "react";
import Icon from "../components/Icon";
import LineChart from "../components/LineChart";
import Modal from "../components/Modal";
import { exportBackup, parseBackup } from "../backup";
import { PREMIUM_FEATURES, RIVALS } from "../data";
import { daysAgo, dayKey, fmtDay, fmtNum, pointsFor, topPrs, useToday } from "../lib";
import { PLANS, fmtMoney, hasPremium, planById, type PlanId } from "../payments";
import Checkout from "./Checkout";
import { useApp, useNav } from "../store";
import type { ProfileSection } from "../types";

const SECTIONS: { id: ProfileSection; label: string }[] = [
  { id: "progress", label: "Progress" },
  { id: "leaderboard", label: "Leaderboard" },
  { id: "premium", label: "Premium" },
  { id: "settings", label: "Settings" },
];

export default function Profile() {
  const section = useNav((s) => s.section);
  const go = useNav((s) => s.go);
  const name = useApp((s) => s.name);
  const premium = hasPremium(useApp((s) => s.subscription), useToday());

  return (
    <div className="animate-fade-up pt-safe space-y-5 px-5">
      <header className="flex items-center gap-3">
        <div className="gloss-tile flex h-12 w-12 items-center justify-center rounded-full text-lg font-black text-white">
          {name.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1">
          <h1 className="shine-text text-lg font-extrabold">{name}</h1>
          <p className="flex items-center gap-1 text-xs text-white/50">
            {premium && <Icon name="crown" size={12} className="text-moon" />}
            {premium ? "Premium member" : "Free plan"}
          </p>
        </div>
      </header>

      <div className="card flex gap-1 rounded-full p-1">
        {SECTIONS.map((s) => (
          <button
            key={s.id}
            onClick={() => go("profile", s.id)}
            className={`chip flex-1 px-1 ${section === s.id ? "bg-luna text-black" : "text-white/60"}`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {section === "progress" && <Progress />}
      {section === "leaderboard" && <Leaderboard />}
      {section === "premium" && <Premium />}
      {section === "settings" && <Settings />}
    </div>
  );
}

/* ---------------- Progress ---------------- */

const RANGES = [
  { id: "1W", days: 7 },
  { id: "1M", days: 30 },
  { id: "3M", days: 90 },
  { id: "1Y", days: 365 },
  { id: "All", days: 100000 },
] as const;

function Progress() {
  const { measurements, logs, addMeasurement, deleteLog } = useApp();
  const [range, setRange] = useState<(typeof RANGES)[number]["id"]>("3M");
  const [open, setOpen] = useState(false);

  const days = RANGES.find((r) => r.id === range)!.days;
  const inRange = useMemo(() => {
    const cutoff = daysAgo(days);
    const r = measurements.filter((m) => m.date >= cutoff);
    return r.length >= 2 ? r : measurements.slice(-2); // always show a delta if we can
  }, [measurements, days]);

  const first = inRange[0];
  const last = measurements.length ? measurements[measurements.length - 1] : undefined;
  const hasDelta = !!first && !!last && first.date !== last.date;
  const delta = (k: "weight" | "bodyFat" | "muscle") => (hasDelta ? +(last![k] - first![k]).toFixed(1) : 0);
  const sign = (n: number) => (n > 0 ? `+${n}` : `${n}`);

  // Minutes active per day, last 7 days.
  const week = Array.from({ length: 7 }, (_, i) => {
    const d = daysAgo(6 - i);
    return { d, label: new Date(d + "T00:00").toLocaleDateString("en-US", { weekday: "narrow" }), min: logs.filter((l) => l.date === d).reduce((s, l) => s + l.minutes, 0) };
  });
  const maxMin = Math.max(30, ...week.map((w) => w.min));
  const prs = useMemo(() => topPrs(logs, 5), [logs]);
  const history = useMemo(() => [...logs].reverse().slice(0, 10), [logs]);

  return (
    <>
      <div className="flex gap-2">
        {RANGES.map((r) => (
          <button key={r.id} onClick={() => setRange(r.id)} className={`chip flex-1 ${range === r.id ? "bg-luna text-black" : "bg-ink-2 text-white/60"}`}>
            {r.id}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Delta value={hasDelta ? `${sign(delta("muscle"))} lbs` : "—"} label="Muscle" good={delta("muscle") >= 0} />
        <Delta value={hasDelta ? `${sign(delta("bodyFat"))}%` : "—"} label="Body Fat" good={delta("bodyFat") <= 0} />
        <Delta value={hasDelta ? `${sign(delta("weight"))} lbs` : "—"} label="Weight" good />
      </div>

      <div className="card p-4">
        <p className="mb-2 text-xs font-semibold text-white/50">Weight trend</p>
        {measurements.length === 0 ? (
          <div className="flex h-[120px] flex-col items-center justify-center gap-2 text-center text-xs text-white/50">
            Log your weight to start your trend.
            <button onClick={() => setOpen(true)} className="btn-primary px-4 py-2 text-xs">
              <Icon name="plus" size={12} /> Log measurements
            </button>
          </div>
        ) : (
          <LineChart values={inRange.map((m) => m.weight)} />
        )}
      </div>

      <div className="card p-4">
        <p className="mb-3 text-xs font-semibold text-white/50">Active minutes · last 7 days</p>
        <div className="flex h-24 items-end gap-2">
          {week.map((w) => (
            <div key={w.d} className="flex h-full flex-1 flex-col items-center gap-1">
              <div className="flex w-full flex-1 items-end">
                <div
                  className={`w-full rounded-t-md ${w.min ? "glow-fill" : "bg-white/10"}`}
                  style={{ height: `${Math.max(6, (w.min / maxMin) * 100)}%` }}
                  title={`${w.min} min`}
                />
              </div>
              <span className="text-[10px] text-white/40">{w.label}</span>
            </div>
          ))}
        </div>
      </div>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-bold">Body Measurements</h2>
          <button onClick={() => setOpen(true)} className="flex items-center gap-1 text-xs font-semibold text-luna">
            <Icon name="plus" size={14} /> Log
          </button>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <Measure label="Weight" value={last ? `${last.weight} lbs` : "—"} />
          <Measure label="Body Fat" value={last ? `${last.bodyFat}%` : "—"} />
          <Measure label="Muscle Mass" value={last ? `${last.muscle} lbs` : "—"} />
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-base font-bold">Personal Records</h2>
        {prs.length === 0 ? (
          <div className="card p-4 text-sm text-white/50">Enter the weight you lift during a workout and your best lifts show up here.</div>
        ) : (
          <ul className="card divide-y divide-line overflow-hidden">
            {prs.map((p) => (
              <li key={p.exercise} className="flex items-center gap-3 px-4 py-3">
                <Icon name="trophy" size={16} className="text-moon" />
                <span className="flex-1 text-sm font-semibold">{p.exercise}</span>
                <span className="text-sm font-bold">{p.weight} lbs</span>
                <span className="text-xs text-white/40">× {p.reps}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-base font-bold">Workout History</h2>
        {history.length === 0 ? (
          <div className="card p-4 text-sm text-white/50">No workouts logged yet.</div>
        ) : (
          <ul className="space-y-2">
            {history.map((l) => (
              <li key={l.id} className="card flex items-center gap-3 p-3">
                <div className="flex-1">
                  <p className="text-sm font-semibold">{l.name}</p>
                  <p className="text-xs text-white/50">
                    {fmtDay(l.date)} · {l.minutes} min · {fmtNum(l.calories)} kcal
                  </p>
                </div>
                <button
                  onClick={() => window.confirm(`Delete this ${l.name} entry?`) && deleteLog(l.id)}
                  aria-label={`Delete ${l.name} on ${l.date}`}
                  className="p-2 text-white/30 hover:text-white"
                >
                  <Icon name="trash" size={16} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {open && (
        <LogMeasurement
          initial={last}
          onClose={() => setOpen(false)}
          onSave={(m) => {
            addMeasurement(m);
            setOpen(false);
          }}
        />
      )}
    </>
  );
}

function Delta({ value, label, good }: { value: string; label: string; good: boolean }) {
  return (
    <div className="card py-4 text-center">
      <div className={`text-lg font-extrabold ${good ? "text-lime-luna" : "text-luna"}`}>{value}</div>
      <div className="text-[11px] text-white/50">{label}</div>
    </div>
  );
}

function Measure({ label, value }: { label: string; value: string }) {
  return (
    <div className="card p-3">
      <div className="text-[11px] text-white/50">{label}</div>
      <div className="mt-1 text-base font-extrabold">{value}</div>
    </div>
  );
}

function LogMeasurement({ initial, onClose, onSave }: { initial?: { weight: number; bodyFat: number; muscle: number }; onClose: () => void; onSave: (m: { date: string; weight: number; bodyFat: number; muscle: number }) => void }) {
  const [w, setW] = useState(initial ? String(initial.weight) : "");
  const [bf, setBf] = useState(initial ? String(initial.bodyFat) : "");
  const [mu, setMu] = useState(initial ? String(initial.muscle) : "");
  const nums = [Number(w), Number(bf), Number(mu)];
  const filled = [w, bf, mu].every((v) => v.trim() !== "");
  const valid = filled && nums.every((n) => Number.isFinite(n) && n > 0) && nums[0] <= 2000 && nums[1] < 100 && nums[2] <= 2000 && nums[2] < nums[0];

  return (
    <Modal title="Log measurements" onClose={onClose}>
      <form
        className="space-y-3"
        onSubmit={(e) => {
          e.preventDefault();
          if (valid) onSave({ date: dayKey(), weight: nums[0], bodyFat: nums[1], muscle: nums[2] });
        }}
      >
        <Field label="Weight (lbs)" value={w} onChange={setW} />
        <Field label="Body fat (%)" value={bf} onChange={setBf} />
        <Field label="Muscle mass (lbs)" value={mu} onChange={setMu} />
        {filled && !valid && (
          <p className="text-xs text-red-400">Check the numbers: body fat must be under 100%, and muscle mass less than your weight.</p>
        )}
        <button type="submit" disabled={!valid} className="btn-primary w-full disabled:opacity-40">
          Save for today
        </button>
      </form>
    </Modal>
  );
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="block text-xs font-semibold text-white/60">
      {label}
      <input className="input mt-1" type="number" step="0.1" min={0} inputMode="decimal" value={value} onChange={(e) => onChange(e.target.value)} />
    </label>
  );
}

/* ---------------- Leaderboard ---------------- */

const BOARDS = ["Friends", "Global", "Weekly"] as const;

function Leaderboard() {
  const logs = useApp((s) => s.logs);
  const name = useApp((s) => s.name);
  const [board, setBoard] = useState<(typeof BOARDS)[number]>("Weekly");

  const days = board === "Weekly" ? 7 : 30;
  const mine = pointsFor(logs, days);
  const rivals = (board === "Friends" ? RIVALS.slice(0, 5) : RIVALS).map((r) => ({ name: r.name, pts: Math.round(r.weekly * (days / 7) * (board === "Global" ? 2.2 : 1)), me: false }));
  const rows = [...rivals, { name: "You", pts: mine, me: true }].sort((a, b) => b.pts - a.pts);
  const myRank = rows.findIndex((r) => r.me) + 1;
  const podium = rows.slice(0, 3);

  return (
    <>
      <div className="flex gap-2">
        {BOARDS.map((b) => (
          <button key={b} onClick={() => setBoard(b)} className={`chip flex-1 ${board === b ? "bg-luna text-black" : "bg-ink-2 text-white/60"}`}>
            {b}
          </button>
        ))}
      </div>

      <div className="flex items-end justify-center gap-3 pt-2">
        {[podium[1], podium[0], podium[2]].map((p, i) => {
          const place = [2, 1, 3][i];
          return (
            <div key={`${place}-${p.name}`} className={`flex flex-col items-center ${place === 1 ? "-translate-y-2" : ""}`}>
              {place === 1 && <Icon name="crown" size={20} className="mb-1 text-moon" />}
              <div
                className={`gloss-tile flex items-center justify-center rounded-full font-black ${
                  place === 1 ? "h-20 w-20 !border-4 !border-moon text-2xl" : "h-14 w-14 text-lg"
                } ${p.me ? "text-black" : "text-white"}`}
              >
                {p.me ? name.charAt(0).toUpperCase() : p.name.charAt(0)}
              </div>
              <div className={`mt-2 max-w-[6rem] truncate text-sm font-bold ${p.me ? "text-luna" : ""}`}>{p.me ? "You" : p.name}</div>
              <div className="text-xs text-white/50">{fmtNum(p.pts)} pts</div>
              <div className="text-[10px] font-bold text-white/30">#{place}</div>
            </div>
          );
        })}
      </div>

      <ul className="card divide-y divide-line overflow-hidden">
        {rows.map((r, i) => (
          <li key={`${i}-${r.name}`} className={`flex items-center gap-3 px-4 py-3 ${r.me ? "bg-luna/10" : ""}`}>
            <span className="w-5 text-sm font-bold text-white/50">{i + 1}</span>
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/10 text-sm font-bold">{r.me ? name.charAt(0).toUpperCase() : r.name.charAt(0)}</span>
            <span className={`min-w-0 flex-1 truncate text-sm font-semibold ${r.me ? "text-luna" : ""}`}>{r.me ? `${name} (You)` : r.name}</span>
            <span className="text-sm text-white/60">{fmtNum(r.pts)} pts</span>
          </li>
        ))}
      </ul>

      <div className="card flex items-center gap-3 border-luna/30 bg-luna/10 p-4">
        <Icon name="trophy" size={26} className="text-moon" />
        <p className="text-sm">
          {mine === 0 ? (
            <>Finish a workout to get on the board. <span className="text-white/50">100 pts per workout + 5 per minute.</span></>
          ) : (
            <>You're ranked <b>#{myRank}</b>. Keep going to climb!</>
          )}
        </p>
      </div>
      <p className="text-center text-[11px] text-white/30">Other athletes are sample data — there's no server behind this demo.</p>
    </>
  );
}

/* ---------------- Premium ---------------- */

function Premium() {
  const sub = useApp((s) => s.subscription);
  const payments = useApp((s) => s.payments);
  const cancel = useApp((s) => s.cancelSubscription);
  const resume = useApp((s) => s.resumeSubscription);
  const today = useToday();
  const [planId, setPlanId] = useState<PlanId>("yearly");
  const [checkout, setCheckout] = useState(false);
  const active = hasPremium(sub, today);
  const longDate = (iso: string) => new Date(`${iso}T00:00:00`).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });

  return (
    <>
      <div className="card relative overflow-hidden bg-gradient-to-br from-[#2c1a52] via-[#160f2a] to-[#0c0916] p-6">
        <div className="absolute -right-6 -top-6 text-moon/10">
          <Icon name="crown" size={180} strokeWidth={1.2} />
        </div>
        <Icon name="crown" size={34} className="text-moon" />
        <h2 className="mt-3 text-2xl font-black">
          Lunor <span className="shine-text">Premium</span>
        </h2>

        {active && sub ? (
          <>
            <p className="mt-1 text-sm text-white/60">
              {planById(sub.plan).name} plan · {fmtMoney(planById(sub.plan).price)} / {planById(sub.plan).period}
            </p>
            <div className="mt-5 space-y-2 rounded-2xl border border-white/10 bg-black/25 p-4 text-sm">
              <Row2 label="Status" value={sub.status === "active" ? "Active" : "Canceled"} accent={sub.status === "active"} />
              <Row2 label={sub.status === "active" ? "Next payment" : "Access until"} value={longDate(sub.renewsOn)} />
              <Row2 label="Payment method" value={`${sub.brand} •••• ${sub.last4}`} />
              <Row2 label="Member since" value={longDate(sub.startedOn)} />
            </div>
            {sub.status === "active" ? (
              <button
                onClick={() =>
                  window.confirm(`Cancel Premium? You'll keep it until ${longDate(sub.renewsOn)} and won't be charged again.`) && cancel()
                }
                className="btn-ghost mt-5 w-full"
              >
                Cancel subscription
              </button>
            ) : (
              <button onClick={resume} className="btn-primary mt-5 w-full py-3.5">
                Resume subscription
              </button>
            )}
          </>
        ) : (
          <>
            <p className="mt-1 text-sm text-white/60">Get the most out of your fitness journey.</p>
            <ul className="my-5 space-y-3">
              {PREMIUM_FEATURES.map((f) => (
                <li key={f} className="flex items-center gap-3 text-sm">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-moon/20 text-moon">
                    <Icon name="check" size={12} strokeWidth={3} />
                  </span>
                  {f}
                </li>
              ))}
            </ul>
            <div className="grid grid-cols-2 gap-3" role="radiogroup" aria-label="Choose a plan">
              {PLANS.map((p) => {
                const on = planId === p.id;
                return (
                  <button
                    key={p.id}
                    role="radio"
                    aria-checked={on}
                    onClick={() => setPlanId(p.id)}
                    className={`relative rounded-2xl border p-3 text-left transition ${
                      on ? "border-moon bg-moon/15 shadow-[0_0_20px_-4px_rgba(225, 210, 255,0.6),inset_0_1px_0_rgba(240, 234, 255,0.4)]" : "border-white/15 bg-black/25"
                    }`}
                  >
                    {p.note && (
                      <span className="absolute -top-2 right-2 rounded-full bg-moon px-2 py-0.5 text-[10px] font-extrabold text-black">{p.note}</span>
                    )}
                    <span className="block text-xs font-semibold text-white/60">{p.name}</span>
                    <span className="block text-xl font-black">{fmtMoney(p.price)}</span>
                    <span className="block text-[11px] text-white/50">
                      per {p.period}
                      {p.period === "year" ? ` · ${fmtMoney(p.price / 12)}/mo` : ""}
                    </span>
                  </button>
                );
              })}
            </div>
            <button onClick={() => setCheckout(true)} className="btn-primary mt-5 w-full py-3.5 text-base">
              Go Premium · {fmtMoney(planById(planId).price)}
            </button>
            <p className="mt-3 text-center text-[11px] text-white/35">Test mode — payments are simulated and no real money is charged.</p>
          </>
        )}
      </div>

      {payments.length > 0 && (
        <section>
          <h2 className="mb-3 text-base font-bold">Billing history</h2>
          <ul className="card divide-y divide-line overflow-hidden">
            {payments.slice(0, 24).map((p) => (
              <li key={p.id} className="flex items-center gap-3 px-4 py-3">
                <Icon name="card" size={18} className="text-white/50" />
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold">Premium · {planById(p.plan).name}</span>
                  <span className="block text-xs text-white/50">
                    {longDate(p.date)} · {p.brand} •••• {p.last4}
                  </span>
                </span>
                <span className="text-sm font-bold">{fmtMoney(p.amount)}</span>
              </li>
            ))}
          </ul>
          <p className="mt-2 text-center text-[11px] text-white/30">Test-mode receipts.</p>
        </section>
      )}

      {checkout && <Checkout planId={planId} onClose={() => setCheckout(false)} />}
    </>
  );
}

function Row2({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-white/50">{label}</span>
      <span className={`text-right font-semibold ${accent ? "text-lime-luna" : ""}`}>{value}</span>
    </div>
  );
}

/* ---------------- Settings ---------------- */

const FIELDS = [
  { key: "calorieGoal", label: "Daily calories (kcal)", min: 1200, max: 6000 },
  { key: "proteinGoal", label: "Protein (g)", min: 20, max: 400 },
  { key: "carbGoal", label: "Carbs (g)", min: 20, max: 800 },
  { key: "fatGoal", label: "Fat (g)", min: 10, max: 300 },
  { key: "dailyActiveGoal", label: "Active minutes per day", min: 5, max: 300 },
] as const;

function Settings() {
  const app = useApp();
  const [name, setName] = useState(app.name);
  const [vals, setVals] = useState<Record<string, string>>(() => Object.fromEntries(FIELDS.map((f) => [f.key, String(app[f.key])])));
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const save = () => {
    const out: Record<string, number> = {};
    for (const f of FIELDS) {
      const n = Number(vals[f.key]);
      if (!Number.isFinite(n) || n < f.min || n > f.max) return setMsg({ ok: false, text: `${f.label} must be between ${f.min} and ${f.max}.` });
      out[f.key] = Math.round(n);
    }
    app.setGoals(out);
    app.setName(name);
    setMsg({ ok: true, text: "Saved." });
  };

  const download = () => {
    const blob = new Blob([exportBackup(app)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `lunor-backup-${dayKey()}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 10_000);
    setMsg({ ok: true, text: "Backup downloaded." });
  };

  const onFile = async (file: File | undefined) => {
    if (!file) return;
    try {
      const data = parseBackup(await file.text());
      if (!window.confirm(`Replace everything on this device with the backup? (${data.logs.length} workouts, ${data.meals.length} meals)`)) {
        if (fileRef.current) fileRef.current.value = "";
        return;
      }
      app.restore(data);
      setName(data.name);
      setVals(Object.fromEntries(FIELDS.map((f) => [f.key, String(data[f.key])])));
      setMsg({ ok: true, text: "Backup restored." });
    } catch (e) {
      setMsg({ ok: false, text: e instanceof Error ? e.message : "Couldn't read that file." });
    }
    if (fileRef.current) fileRef.current.value = "";
  };

  return (
    <div className="space-y-5">
      <section className="card space-y-3 p-4">
        <h2 className="text-base font-bold">Profile & goals</h2>
        <label className="block text-xs font-semibold text-white/60">
          Name
          <input className="input mt-1" value={name} maxLength={24} onChange={(e) => { setName(e.target.value); setMsg(null); }} />
        </label>
        <div className="grid grid-cols-2 gap-3">
          {FIELDS.map((f) => (
            <label key={f.key} className="block text-xs font-semibold text-white/60">
              {f.label}
              <input
                className="input mt-1"
                type="number"
                inputMode="numeric"
                value={vals[f.key]}
                min={f.min}
                max={f.max}
                onChange={(e) => {
                  const v = e.target.value;
                  setVals((p) => ({ ...p, [f.key]: v }));
                  setMsg(null);
                }}
              />
            </label>
          ))}
        </div>
        <button onClick={save} className="btn-primary w-full">
          Save changes
        </button>
      </section>

      <section className="card space-y-3 p-4">
        <h2 className="text-base font-bold">Your data</h2>
        <p className="text-xs text-white/50">
          Everything is stored only in this browser. Download a backup so you don't lose it if you clear your browser data or switch phones.
        </p>
        <div className="flex gap-2">
          <button onClick={download} className="btn-ghost flex-1">
            Export backup
          </button>
          <button onClick={() => fileRef.current?.click()} className="btn-ghost flex-1">
            Import backup
          </button>
        </div>
        <input ref={fileRef} type="file" accept="application/json,.json" className="hidden" onChange={(e) => void onFile(e.target.files?.[0])} />
        <button
          onClick={() => window.confirm("Erase all your workouts, meals and measurements on this device?") && app.reset()}
          className="mx-auto block pt-1 text-xs text-white/30 underline"
        >
          Reset all data
        </button>
      </section>

      {msg && (
        <p role="status" className={`text-center text-sm font-semibold ${msg.ok ? "text-lime-luna" : "text-red-400"}`}>
          {msg.text}
        </p>
      )}
    </div>
  );
}
