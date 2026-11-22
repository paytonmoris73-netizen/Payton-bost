import Icon from "../components/Icon";
import { LogoMark } from "../components/Logo";
import { WEEK_PLAN, workoutById } from "../data";
import { computeStreak, fmtDay, greeting, useToday } from "../lib";
import { useApp, useNav } from "../store";

export default function Home() {
  const { name, logs, dailyActiveGoal, meals, calorieGoal } = useApp();
  const go = useNav((s) => s.go);
  const startSession = useNav((s) => s.startSession);

  const today = useToday();
  const todayLogs = logs.filter((l) => l.date === today);
  const burned = todayLogs.reduce((s, l) => s + l.calories, 0);
  const active = todayLogs.reduce((s, l) => s + l.minutes, 0);
  const goalPct = dailyActiveGoal > 0 ? Math.min(100, Math.round((active / dailyActiveGoal) * 100)) : 0;
  const eaten = meals.filter((m) => m.date === today).reduce((s, m) => s + m.calories, 0);
  const streak = computeStreak(logs.map((l) => l.date));

  // Weekday of the (midnight-aware) "today" key, so the plan rolls over with it.
  const planned = workoutById(WEEK_PLAN[new Date(`${today}T00:00:00`).getDay()])!;
  const doneToday = todayLogs.some((l) => l.workoutId === planned.id);
  const recent = [...logs].reverse().slice(0, 3);
  const dateLine = new Date(`${today}T00:00:00`).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });

  return (
    <div className="animate-fade-up pt-safe space-y-8 px-6">
      <header>
        <div className="flex items-center justify-between">
          <LogoMark size={22} />
          {streak > 0 && <span className="eyebrow">{streak}-day streak</span>}
        </div>
        <p className="eyebrow mt-8">{dateLine}</p>
        <h1 className="display mt-2 text-[40px]">
          {greeting()},
          <br />
          <span className="italic text-luna-light">{name}</span>
        </h1>
      </header>

      <section className="card p-6">
        <div className="flex items-center justify-between">
          <p className="eyebrow">Today's session</p>
          {doneToday && (
            <span className="flex items-center gap-1 text-[11px] font-medium text-lime-luna">
              <Icon name="check" size={13} /> Completed
            </span>
          )}
        </div>
        <h2 className="display mt-3 text-[32px]">{planned.name}</h2>
        <p className="mt-2 text-sm text-white/50">
          {planned.minutes} minutes · {planned.level} · {planned.exercises.length} exercises
        </p>
        <button onClick={() => startSession(planned.id)} className="btn-primary mt-6 w-full">
          {doneToday ? "Train again" : "Begin session"}
        </button>
      </section>

      <section className="card grid grid-cols-3 divide-x divide-white/[0.07] py-5">
        <Stat value={burned.toLocaleString()} label="kcal burned" />
        <Stat value={String(active)} label="active min" />
        <Stat value={`${goalPct}%`} label={`of ${dailyActiveGoal} min goal`} />
      </section>

      <section>
        <p className="eyebrow mb-3">Explore</p>
        <ul className="card divide-y divide-white/[0.07] overflow-hidden">
          <LinkRow icon="message" title="Coach" note="Training, nutrition and recovery" onClick={() => go("coach")} />
          <LinkRow icon="apple" title="Nutrition" note={`${eaten.toLocaleString()} of ${calorieGoal.toLocaleString()} kcal today`} onClick={() => go("nutrition")} />
          <LinkRow icon="trend" title="Progress" note="Body measurements and records" onClick={() => go("profile", "progress")} />
          <LinkRow icon="trophy" title="Leaderboard" note="This week's standings" onClick={() => go("profile", "leaderboard")} />
        </ul>
      </section>

      <section>
        <p className="eyebrow mb-3">Recent activity</p>
        {recent.length === 0 ? (
          <div className="card p-5 text-sm text-white/45">No sessions yet. Your first one will appear here.</div>
        ) : (
          <ul className="card divide-y divide-white/[0.07] overflow-hidden">
            {recent.map((l) => (
              <li key={l.id} className="flex items-center justify-between px-5 py-4">
                <div>
                  <p className="text-sm font-medium">{l.name}</p>
                  <p className="mt-0.5 text-xs text-white/45">
                    {fmtDay(l.date)} · {l.minutes} min
                  </p>
                </div>
                <span className="text-sm tabular-nums text-white/70">{l.calories} kcal</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="px-2 text-center">
      <div className="display text-[30px] tabular-nums">{value}</div>
      <div className="mt-1 text-[11px] text-white/45">{label}</div>
    </div>
  );
}

function LinkRow({ icon, title, note, onClick }: { icon: string; title: string; note: string; onClick: () => void }) {
  return (
    <li>
      <button onClick={onClick} className="flex w-full items-center gap-4 px-5 py-4 text-left transition-colors hover:bg-white/[0.02]">
        <Icon name={icon} size={19} className="text-luna" />
        <span className="flex-1">
          <span className="block text-sm font-medium">{title}</span>
          <span className="mt-0.5 block text-xs text-white/45">{note}</span>
        </span>
        <Icon name="chevR" size={16} className="text-white/25" />
      </button>
    </li>
  );
}
