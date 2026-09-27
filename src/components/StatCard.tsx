interface Props {
  label: string;
  value: string | number;
  sub?: string;
  color?: "green" | "blue" | "orange";
}

export function StatCard({ label, value, sub, color }: Props) {
  return (
    <div className={`stat-card${color ? ` ${color}` : ""}`}>
      <div className="stat-card-label">{label}</div>
      <div className="stat-card-value">{value}</div>
      {sub && <div className="stat-card-sub">{sub}</div>}
    </div>
  );
}
