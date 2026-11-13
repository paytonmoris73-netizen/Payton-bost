import {
  useApp,
  levelFromXp,
  xpIntoLevel,
  XP_PER_LEVEL,
  currentStreak,
} from "../state/AppContext";
import { BADGES, TIER_STYLE, type Badge, type BadgeStats } from "../data/badges";
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
  const earnedXp = earned.reduce((n, b) => n + b.xp, 0);

  return (
    <div className="mx-auto max-w-4xl">
      <header>
        <h1 className="font-display text-2xl font-bold tracking-tight sm:text-[32px] sm:leading-tight">
          Rewards
        </h1>
        <p className="mt-1 text-sm text-cream-dim">Proof of the work you've put in.</p>
      </header>

      {/* Level */}
      <div className="card relative mt-6 overflow-hidden p-6 sm:p-8">
        <div className="absolute inset-0 bg-gradient-to-br from-gold-500/10 via-transparent to-transparent" />
        <div className="relative flex items-center gap-5">
          <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl gold-fill shadow-glow">
            <Icon name="trophy" className="h-8 w-8 text-ink-950" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="font-display text-3xl font-bold tracking-tight">
              Level <span className="gold-text">{level}</span>
            </div>
            <div className="mt-0.5 text-sm text-cream-dim">
              {state.xp.toLocaleString()} XP earned
              {state.premium && <span className="ml-1.5 text-gold-400">· 2× active</span>}
            </div>
          </div>
        </div>

        <div className="relative mt-5">
          <div className="h-3 overflow-hidden rounded-full bg-ink-700">
            <div
              className="h-full gold-fill transition-[width] duration-700"
              style={{ width: `${(into / XP_PER_LEVEL) * 100}%` }}
            />
          </div>
          <div className="mt-1.5 flex justify-between text-[11px] font-semibold text-cream-faint">
            <span>{into} XP this level</span>
            <span>{XP_PER_LEVEL - into} XP to Level {level + 1}</span>
          </div>
        </div>
      </div>

      {/* Earned */}
      <section className="mt-8">
        <SectionHeader
          title="Badges"
          hint={`${earned.length} of ${BADGES.length} earned · ${earnedXp.toLocaleString()} bonus XP`}
        />
        {earned.length === 0 ? (
          <div className="card px-6 py-10 text-center text-sm text-cream-dim">
            Finish your first workout to unlock your first badge.
          </div>
        ) : (
          <div className="stagger grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {earned.map((b) => (
              <BadgeTile key={b.id} badge={b} />
            ))}
          </div>
        )}
      </section>

      {/* Locked */}
      {locked.length > 0 && (
        <section className="mt-8">
          <SectionHeader title="Still to earn" />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {locked.map((b) => (
              <BadgeTile key={b.id} badge={b} locked progress={progressFor(b, stats)} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function BadgeTile({
  badge,
  locked = false,
  progress,
}: {
  badge: Badge;
  locked?: boolean;
  progress?: { current: number; target: number };
}) {
  const tier = TIER_STYLE[badge.tier];
  return (
    <div
      className={`card flex flex-col items-center gap-2 px-3 py-5 text-center ${
        locked ? "" : "card-hover"
      }`}
    >
      {locked ? (
        <span className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-dashed border-line-bright text-cream-faint">
          <Icon name={badge.icon} className="h-5 w-5" />
        </span>
      ) : (
        <span
          className={`flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br p-[2px] ${tier.ring} ${tier.glow}`}
        >
          <span className="flex h-full w-full items-center justify-center rounded-full bg-ink-900">
            <Icon name={badge.icon} className={`h-5 w-5 ${tier.text}`} />
          </span>
        </span>
      )}

      <div className={`text-sm font-bold leading-tight ${locked ? "text-cream-dim" : ""}`}>
        {badge.name}
      </div>
      <div className="text-[11px] leading-snug text-cream-faint">{badge.description}</div>

      {locked && progress && progress.target > 0 && (
        <div className="mt-1 w-full">
          <div className="h-1 overflow-hidden rounded-full bg-ink-700">
            <div
              className="h-full rounded-full bg-gold-600/80"
              style={{ width: `${Math.min(100, (progress.current / progress.target) * 100)}%` }}
            />
          </div>
          <div className="mt-1 text-[10px] font-semibold tabular-nums text-cream-faint">
            {Math.min(progress.current, progress.target).toLocaleString()} /{" "}
            {progress.target.toLocaleString()}
          </div>
        </div>
      )}

      <span
        className={`mt-auto pt-1 text-[11px] font-bold ${locked ? "text-cream-faint" : tier.text}`}
      >
        +{badge.xp} XP
      </span>
    </div>
  );
}

/** How close the athlete is to each locked badge. */
function progressFor(b: Badge, s: BadgeStats): { current: number; target: number } | undefined {
  const map: Record<string, [number, number]> = {
    "first-step": [s.totalWorkouts, 1],
    "warming-up": [s.totalWorkouts, 5],
    regular: [s.totalWorkouts, 15],
    machine: [s.totalWorkouts, 40],
    "on-fire": [s.bestStreak, 3],
    unstoppable: [s.bestStreak, 7],
    furnace: [s.totalCalories, 1000],
    inferno: [s.totalCalories, 5000],
    "hour-power": [s.totalMinutes, 60],
    marathoner: [s.totalMinutes, 600],
    "level-5": [s.level, 5],
    "level-12": [s.level, 12],
  };
  const hit = map[b.id];
  return hit ? { current: hit[0], target: hit[1] } : undefined;
}
