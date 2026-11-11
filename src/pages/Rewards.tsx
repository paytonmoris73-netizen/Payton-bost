import { useApp, levelFromXp, xpIntoLevel, XP_PER_LEVEL, currentStreak } from "../state/AppContext";
import { BADGES, TIER_STYLE, type BadgeStats } from "../data/badges";
import { totals } from "../lib/stats";
import { Icon } from "../components/Icon";
import { SectionHeader } from "../components/ui";

export function RewardsPage() {
  const { state } = useApp();
  const level = levelFromXp(state.xp);
  const into = xpIntoLevel(state.xp);
  const all = totals(state.sessions);

  const stats: BadgeStats = {
    sessions: state.sessions,
    totalWorkouts: all.workouts,
    totalCalories: all.calories,
    totalMinutes: all.minutes,
    bestStreak: Math.max(state.bestStreak, currentStreak(state)),
    level,
  };

  const earned = BADGES.filter((b) => b.earned(stats));
  const locked = BADGES.filter((b) => !b.earned(stats));

  return (
    <div className="mx-auto max-w-4xl">
      <header>
        <h1 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">Rewards</h1>
        <p className="mt-1 text-sm text-cream-dim">Earn rewards for your hard work.</p>
      </header>

      {/* Level card */}
      <div className="card relative mt-6 overflow-hidden p-6 sm:p-8">
        <Icon name="crown" className="absolute -right-6 -top-8 h-40 w-40 text-gold-500/10" filled={false} />
        <div className="relative flex items-center gap-5">
          <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl gold-fill shadow-glow">
            <Icon name="trophy" className="h-8 w-8 text-ink-950" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="font-display text-3xl font-bold">
              Level <span className="gold-text">{level}</span>
            </div>
            <div className="mt-0.5 text-sm text-cream-dim">
              {state.xp.toLocaleString()} XP total · {XP_PER_LEVEL - into} XP to Level {level + 1}
            </div>
          </div>
        </div>
        <div className="relative mt-5">
          <div className="h-3 overflow-hidden rounded-full bg-ink-700">
            <div
              className="h-full gold-fill transition-[width] duration-700"
              style={{ width: `${Math.round((into / XP_PER_LEVEL) * 100)}%` }}
            />
          </div>
          <div className="mt-1.5 flex justify-between text-[11px] font-semibold text-cream-faint">
            <span>{into} XP</span>
            <span>{XP_PER_LEVEL} XP</span>
          </div>
        </div>
      </div>

      {/* Earned badges */}
      <section className="mt-8">
        <SectionHeader
          title={`Earned (${earned.length}/${BADGES.length})`}
        />
        {earned.length === 0 ? (
          <div className="card px-6 py-10 text-center text-sm text-cream-dim">
            Complete your first workout to earn your first badge.
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {earned.map((b) => (
              <div key={b.id} className="card card-hover flex flex-col items-center gap-2 px-3 py-5 text-center">
                <span
                  className={`flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br ${TIER_STYLE[b.tier].ring} shadow-glow-sm`}
                >
                  <span className="flex h-11 w-11 items-center justify-center rounded-full bg-ink-900">
                    <Icon name="star" className="h-5 w-5 text-gold-300" />
                  </span>
                </span>
                <div className="text-sm font-bold leading-tight">{b.name}</div>
                <div className="text-[11px] leading-snug text-cream-dim">{b.description}</div>
                <span className="mt-auto text-[11px] font-bold text-gold-400">+{b.xp} XP</span>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Locked badges */}
      {locked.length > 0 && (
        <section className="mt-8">
          <SectionHeader title="Still to earn" />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {locked.map((b) => (
              <div
                key={b.id}
                className="card flex flex-col items-center gap-2 px-3 py-5 text-center opacity-60 transition-opacity hover:opacity-90"
              >
                <span className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-dashed border-line-bright">
                  <Icon name="star" className="h-5 w-5 text-cream-faint" filled={false} />
                </span>
                <div className="text-sm font-bold leading-tight">{b.name}</div>
                <div className="text-[11px] leading-snug text-cream-dim">{b.description}</div>
                <span className="mt-auto text-[11px] font-bold text-cream-faint">+{b.xp} XP</span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
