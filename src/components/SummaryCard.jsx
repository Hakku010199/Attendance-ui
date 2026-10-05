export default function SummaryCard({ label, value, variant = "neutral" }) {
  return (
    <div className={`summary-card summary-card--${variant}`}>
      <span className="summary-label">{label}</span>
      <strong className="summary-value">{value}</strong>
    </div>
  );
}
