import { useState } from "react";

export interface ChartDay {
  iso: string;
  label: string;
  minutes: number;
  calories: number;
}

const PLOT = "h-40";

/**
 * Weekly activity chart. Gridlines, axis labels and the goal line are all
 * positioned from the same scale, so they stay locked together.
 */
export function ActivityChart({ days, dailyGoal }: { days: ChartDay[]; dailyGoal: number }) {
  const [active, setActive] = useState<number | null>(null);

  const peak = Math.max(dailyGoal, ...days.map((d) => d.minutes));
  // Round the axis up to a clean step so gridlines land on tidy numbers.
  const step = peak <= 30 ? 10 : peak <= 60 ? 20 : peak <= 120 ? 30 : 60;
  const top = Math.max(step, Math.ceil(peak / step) * step);
  const ticks = Array.from({ length: top / step + 1 }, (_, i) => i * step);
  const pos = (v: number) => `${(v / top) * 100}%`;

  const todayIndex = days.length - 1;

  return (
    <div className="flex gap-3">
      {/* Y axis — each label centred on its gridline */}
      <div className={`relative ${PLOT} w-7 shrink-0`}>
        {ticks.map((t) => (
          <span
            key={t}
            className="absolute right-0 text-[10px] font-semibold leading-none tabular-nums text-cream-faint"
            style={{ bottom: pos(t), transform: "translateY(50%)" }}
          >
            {t}
          </span>
        ))}
      </div>

      <div className="min-w-0 flex-1">
        <div className={`relative ${PLOT}`}>
          {/* Gridlines */}
          {ticks.map((t) => (
            <div
              key={t}
              className="absolute inset-x-0 h-px bg-line/70"
              style={{ bottom: pos(t) }}
            />
          ))}

          {/* Goal line */}
          {dailyGoal > 0 && dailyGoal <= top && (
            <div className="absolute inset-x-0 flex items-center" style={{ bottom: pos(dailyGoal) }}>
              <div className="h-px w-full border-t border-dashed border-gold-500/55" />
              <span className="ml-1 shrink-0 text-[9px] font-bold uppercase tracking-wide text-gold-500/80">
                goal
              </span>
            </div>
          )}

          {/* Bars */}
          <div className="relative flex h-full items-end gap-1.5 sm:gap-2.5">
            {days.map((d, i) => {
              const isToday = i === todayIndex;
              const isActive = active === i;
              return (
                <button
                  key={d.iso}
                  type="button"
                  className="group relative flex h-full flex-1 items-end"
                  onMouseEnter={() => setActive(i)}
                  onMouseLeave={() => setActive(null)}
                  onFocus={() => setActive(i)}
                  onBlur={() => setActive(null)}
                  aria-label={`${d.label}: ${d.minutes} minutes, ${d.calories} calories`}
                >
                  {isActive && d.minutes > 0 && (
                    <div
                      className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 -translate-x-1/2 whitespace-nowrap rounded-lg border border-line-bright bg-ink-800 px-2.5 py-1.5 text-center shadow-card"
                      style={{ animation: "fadeUp 0.15s ease both" }}
                    >
                      <div className="font-display text-sm font-bold leading-none">
                        {d.minutes} min
                      </div>
                      <div className="mt-0.5 text-[10px] text-cream-faint">{d.calories} cal</div>
                    </div>
                  )}

                  <div
                    className={`w-full rounded-t-md transition-all duration-500 ${
                      d.minutes > 0
                        ? isToday
                          ? "gold-fill shadow-glow-sm"
                          : "bg-gradient-to-t from-gold-700/70 to-gold-500/90"
                        : "bg-ink-700"
                    } ${isActive ? "brightness-125" : ""}`}
                    style={{ height: d.minutes > 0 ? `max(${pos(d.minutes)}, 4px)` : "4px" }}
                  />
                </button>
              );
            })}
          </div>
        </div>

        {/* X axis */}
        <div className="mt-2 flex gap-1.5 sm:gap-2.5">
          {days.map((d, i) => (
            <div
              key={d.iso}
              className={`flex-1 text-center text-[10px] font-bold ${
                i === todayIndex ? "text-gold-400" : "text-cream-faint"
              }`}
            >
              {d.label}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
