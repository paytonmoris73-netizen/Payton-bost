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

  return (
    <div className="animate-fade-up pt-safe space-y-6 px-5">
      <header className="flex items-start justify-between">
        <div>
          <LogoMark size={26} />
          <p className="mt-2 text-sm text-white/60">{greeting()},</p>
          <h1 className="text-2xl font-extrabold"><span className="shine-text">{name}</span> 👋</h1>
        </div>
        <div className="card flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-bold" title="Day streak" aria-label={`${streak} day streak`}>
          <Icon name="flame" size={16} className="text-apex" />
          {streak} day{streak === 1 ? "" : "s"}
        </div>
      </header>

      <section className="card relative overflow-hidden bg-gradient-to-br from-[#3d2008] via-[#1d1208] to-[#100c08] p-5">
        <div className="absolute -right-6 -top-6 text-apex/10">
          <Icon name="dumbbell" size={150} strokeWidth={1.2} />
        </div>
        <p className="text-xs font-semibold uppercase tracking-wider text-apex">Today's workout</p>
        <h2 className="mt-1 text-xl font-extrabold">{planned.name}</h2>
        <p className="mt-1 text-sm text-white/60">
          {planned.minutes} min · {planned.level} · {planned.exercises.length} exercises
        </p>
        <button onClick={() => startSession(planned.id)} className="btn-primary relative mt-4">
          {doneToday ? "Do it again" : "Start Workout"}
          <Icon name="play" size={14} />
        </button>
        {doneToday && (
          <span className="absolute right-4 bottom-4 flex items-center gap-1 text-xs font-semibold text-lime-apex">
            <Icon name="check" size={14} /> Done today
          </span>
        )}
      </section>

      <button
        onClick={() => go("coach")}
        className="card flex w-full items-center gap-3 p-4 text-left transition active:scale-[0.98]"
      >
        <span className="gloss-tile flex h-10 w-10 items-center justify-center rounded-full text-white">
          <Icon name="sparkle" size={20} />
        </span>
        <span className="flex-1">
          <span className="block text-sm font-bold">Ask your AI Coach</span>
          <span className="block text-xs text-white/50">Workout, nutrition and recovery advice</span>
        </span>
        <Icon name="chevR" size={18} className="text-white/40" />
      </button>

      <section>
        <h2 className="mb-3 text-base font-bold">Your Stats</h2>
        <div className="grid grid-cols-3 gap-3">
          <Stat icon="flame" value={burned.toLocaleString()} label="Calories burned" />
          <Stat icon="clock" value={`${active} min`} label="Active" />
          <Stat icon="target" value={`${goalPct}%`} label={`Goal (${dailyActiveGoal}m)`} />
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-base font-bold">Quick Actions</h2>
        <div className="grid grid-cols-3 gap-3">
          <Action icon="apple" label="Track Nutrition" onClick={() => go("nutrition")} />
          <Action icon="trend" label="View Progress" onClick={() => go("profile", "progress")} />
          <Action icon="users" label="Leaderboards" onClick={() => go("profile", "leaderboard")} />
        </div>
        <p className="mt-3 text-center text-xs text-white/40">
          {eaten.toLocaleString()} / {calorieGoal.toLocaleString()} kcal eaten today
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-base font-bold">Recent Activity</h2>
        {recent.length === 0 ? (
          <div className="card p-4 text-sm text-white/50">No workouts yet — start one above!</div>
        ) : (
          <ul className="space-y-2">
            {recent.map((l) => (
              <li key={l.id} className="card flex items-center justify-between p-3">
                <div>
                  <p className="text-sm font-semibold">{l.name}</p>
                  <p className="text-xs text-white/50">
                    {fmtDay(l.date)} · {l.minutes} min
                  </p>
                </div>
                <span className="text-sm font-bold text-apex">{l.calories} kcal</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function Stat({ icon, value, label }: { icon: string; value: string; label: string }) {
  return (
    <div className="card flex flex-col items-center gap-1 py-4">
      <Icon name={icon} size={20} className="text-apex" />
      <span className="text-lg font-extrabold">{value}</span>
      <span className="text-[11px] text-white/50">{label}</span>
    </div>
  );
}

function Action({ icon, label, onClick }: { icon: string; label: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="card flex flex-col items-center gap-2 py-4 text-xs font-semibold transition active:scale-95">
      <span className="gloss-tile flex h-10 w-10 items-center justify-center rounded-xl text-white">
        <Icon name={icon} size={20} />
      </span>
      {label}
    </button>
  );
}
