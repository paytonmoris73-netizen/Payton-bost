import { useMemo, useState } from "react";
import Icon from "../components/Icon";
import LineChart from "../components/LineChart";
import Modal from "../components/Modal";
import { PREMIUM_FEATURES, RIVALS } from "../data";
import { daysAgo, dayKey, fmtNum, pointsFor } from "../lib";
import { useApp, useNav } from "../store";
import type { ProfileSection } from "../types";

const SECTIONS: { id: ProfileSection; label: string }[] = [
  { id: "progress", label: "Progress" },
  { id: "leaderboard", label: "Leaderboard" },
  { id: "premium", label: "Premium" },
];

export default function Profile() {
  const section = useNav((s) => s.section);
  const go = useNav((s) => s.go);
  const name = useApp((s) => s.name);
  const premium = useApp((s) => s.premium);
  const reset = useApp((s) => s.reset);

  return (
    <div className="animate-fade-up space-y-5 px-5 pt-6">
      <header className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-apex-light to-apex-dark text-lg font-black text-black">
          {name.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1">
          <h1 className="text-lg font-extrabold">{name}</h1>
          <p className="flex items-center gap-1 text-xs text-white/50">
            {premium && <Icon name="crown" size={12} className="text-gold" />}
            {premium ? "Premium member" : "Free plan"}
          </p>
        </div>
      </header>

      <div className="flex gap-2 rounded-full bg-ink-1 p-1">
        {SECTIONS.map((s) => (
          <button
            key={s.id}
            onClick={() => go("profile", s.id)}
            className={`chip flex-1 ${section === s.id ? "bg-apex text-black" : "text-white/60"}`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {section === "progress" && <Progress />}
      {section === "leaderboard" && <Leaderboard />}
      {section === "premium" && <Premium />}

      <button
        onClick={() => window.confirm("Erase all your workouts, meals and measurements on this device?") && reset()}
        className="mx-auto block pt-4 text-xs text-white/30 underline"
      >
        Reset all data
      </button>
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
  const { measurements, logs, addMeasurement } = useApp();
  const [range, setRange] = useState<(typeof RANGES)[number]["id"]>("3M");
  const [open, setOpen] = useState(false);

  const days = RANGES.find((r) => r.id === range)!.days;
  const inRange = useMemo(() => {
    const cutoff = daysAgo(days);
    const r = measurements.filter((m) => m.date >= cutoff);
    return r.length >= 2 ? r : measurements.slice(-2); // always show a delta if we can
  }, [measurements, days]);

  const first = inRange[0];
  const last = measurements[measurements.length - 1];
  const delta = (k: "weight" | "bodyFat" | "muscle") => (first && last ? +(last[k] - first[k]).toFixed(1) : 0);
  const sign = (n: number) => (n > 0 ? `+${n}` : `${n}`);

  // Minutes active per day, last 7 days.
  const week = Array.from({ length: 7 }, (_, i) => {
    const d = daysAgo(6 - i);
    return { d, label: new Date(d + "T00:00").toLocaleDateString("en-US", { weekday: "narrow" }), min: logs.filter((l) => l.date === d).reduce((s, l) => s + l.minutes, 0) };
  });
  const maxMin = Math.max(30, ...week.map((w) => w.min));

  return (
    <>
      <div className="flex gap-2">
        {RANGES.map((r) => (
          <button key={r.id} onClick={() => setRange(r.id)} className={`chip flex-1 ${range === r.id ? "bg-apex text-black" : "bg-ink-2 text-white/60"}`}>
            {r.id}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Delta value={`${sign(delta("muscle"))} lbs`} label="Muscle" good={delta("muscle") >= 0} />
        <Delta value={`${sign(delta("bodyFat"))}%`} label="Body Fat" good={delta("bodyFat") <= 0} />
        <Delta value={`${sign(delta("weight"))} lbs`} label="Weight" good />
      </div>

      <div className="card p-4">
        <p className="mb-2 text-xs font-semibold text-white/50">Weight trend</p>
        <LineChart values={inRange.map((m) => m.weight)} />
      </div>

      <div className="card p-4">
        <p className="mb-3 text-xs font-semibold text-white/50">Active minutes · last 7 days</p>
        <div className="flex h-24 items-end gap-2">
          {week.map((w) => (
            <div key={w.d} className="flex h-full flex-1 flex-col items-center gap-1">
              <div className="flex w-full flex-1 items-end">
                <div
                  className={`w-full rounded-t-md ${w.min ? "bg-apex" : "bg-ink-3"}`}
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
          <button onClick={() => setOpen(true)} className="flex items-center gap-1 text-xs font-semibold text-apex">
            <Icon name="plus" size={14} /> Log
          </button>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <Measure label="Weight" value={`${last.weight} lbs`} />
          <Measure label="Body Fat" value={`${last.bodyFat}%`} />
          <Measure label="Muscle Mass" value={`${last.muscle} lbs`} />
        </div>
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
      <div className={`text-lg font-extrabold ${good ? "text-lime-apex" : "text-apex"}`}>{value}</div>
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

function LogMeasurement({ initial, onClose, onSave }: { initial: { weight: number; bodyFat: number; muscle: number }; onClose: () => void; onSave: (m: { date: string; weight: number; bodyFat: number; muscle: number }) => void }) {
  const [w, setW] = useState(String(initial.weight));
  const [bf, setBf] = useState(String(initial.bodyFat));
  const [mu, setMu] = useState(String(initial.muscle));
  const nums = [Number(w), Number(bf), Number(mu)];
  const valid = nums.every((n) => Number.isFinite(n) && n > 0) && nums[1] < 100;

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
      <input className="input mt-1" type="number" step="0.1" inputMode="decimal" value={value} onChange={(e) => onChange(e.target.value)} />
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
  void name;

  return (
    <>
      <div className="flex gap-2">
        {BOARDS.map((b) => (
          <button key={b} onClick={() => setBoard(b)} className={`chip flex-1 ${board === b ? "bg-apex text-black" : "bg-ink-2 text-white/60"}`}>
            {b}
          </button>
        ))}
      </div>

      <div className="flex items-end justify-center gap-3 pt-2">
        {[podium[1], podium[0], podium[2]].map((p, i) => {
          const place = [2, 1, 3][i];
          return (
            <div key={p.name} className={`flex flex-col items-center ${place === 1 ? "-translate-y-2" : ""}`}>
              {place === 1 && <Icon name="crown" size={20} className="mb-1 text-gold" />}
              <div
                className={`flex items-center justify-center rounded-full font-black ${
                  place === 1 ? "h-20 w-20 border-4 border-gold bg-ink-3 text-2xl" : "h-14 w-14 border-2 border-white/20 bg-ink-2 text-lg"
                } ${p.me ? "text-apex" : ""}`}
              >
                {p.name.charAt(0)}
              </div>
              <div className={`mt-2 text-sm font-bold ${p.me ? "text-apex" : ""}`}>{p.name}</div>
              <div className="text-xs text-white/50">{fmtNum(p.pts)} pts</div>
              <div className="text-[10px] font-bold text-white/30">#{place}</div>
            </div>
          );
        })}
      </div>

      <ul className="card divide-y divide-line overflow-hidden">
        {rows.map((r, i) => (
          <li key={r.name} className={`flex items-center gap-3 px-4 py-3 ${r.me ? "bg-apex/10" : ""}`}>
            <span className="w-5 text-sm font-bold text-white/50">{i + 1}</span>
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-ink-3 text-sm font-bold">{r.name.charAt(0)}</span>
            <span className={`flex-1 text-sm font-semibold ${r.me ? "text-apex" : ""}`}>{r.me ? `${name} (You)` : r.name}</span>
            <span className="text-sm text-white/60">{fmtNum(r.pts)} pts</span>
          </li>
        ))}
      </ul>

      <div className="card flex items-center gap-3 border-apex/30 bg-apex/10 p-4">
        <Icon name="trophy" size={26} className="text-gold" />
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
  const premium = useApp((s) => s.premium);
  const setPremium = useApp((s) => s.setPremium);
  return (
    <div className="card relative overflow-hidden bg-gradient-to-br from-[#3a2606] via-[#1b1206] to-ink-1 p-6">
      <div className="absolute -right-6 -top-6 text-gold/10">
        <Icon name="crown" size={180} strokeWidth={1.2} />
      </div>
      <Icon name="crown" size={34} className="text-gold" />
      <h2 className="mt-3 text-2xl font-black">Apex Fitness Premium</h2>
      <p className="mt-1 text-sm text-white/60">Get the most out of your fitness journey.</p>
      <ul className="my-5 space-y-3">
        {PREMIUM_FEATURES.map((f) => (
          <li key={f} className="flex items-center gap-3 text-sm">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-gold/20 text-gold">
              <Icon name="check" size={12} strokeWidth={3} />
            </span>
            {f}
          </li>
        ))}
      </ul>
      <button
        onClick={() => setPremium(!premium)}
        className={`w-full rounded-full py-3.5 text-base font-extrabold transition active:scale-[0.97] ${premium ? "border border-gold/40 text-gold" : "bg-gradient-to-b from-gold to-gold-dark text-black"}`}
      >
        {premium ? "Premium active · tap to cancel" : "Go Premium"}
      </button>
      <p className="mt-3 text-center text-[11px] text-white/30">Demo only — no payment is taken and these features aren't built yet.</p>
    </div>
  );
}
