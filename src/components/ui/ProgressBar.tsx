interface ProgressBarProps {
  value: number; // 0-100
  color?: string;
  height?: number;
  animated?: boolean;
  label?: string;
}

export function ProgressBar({ value, color = "#FF786B", height = 8, animated = false, label }: ProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, value));
  return (
    <div className="w-full">
      {label && <div className="text-xs text-gray-500 mb-1">{label}</div>}
      <div className="w-full bg-soft-gray dark:bg-gray-700 rounded-full overflow-hidden" style={{ height }}>
        <div
          className={`h-full rounded-full transition-all duration-500 ${animated ? "animate-pulse" : ""}`}
          style={{ width: `${clamped}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}
