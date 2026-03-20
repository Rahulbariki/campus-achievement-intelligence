export default function ActivityDistributionChart({ items, ariaLabel }) {
  const total = items.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="distribution-chart">
      <div className="distribution-chart__stack" role="img" aria-label={ariaLabel}>
        {items.map((item) => (
          <div
            key={item.label}
            className={`distribution-chart__segment distribution-chart__segment--${item.tone}`}
            style={{
              width: `${total > 0 ? Math.max((item.value / total) * 100, item.value ? 6 : 0)}%`,
            }}
          />
        ))}
      </div>

      <div className="distribution-chart__legend">
        {items.map((item) => (
          <article key={item.label} className="distribution-chart__legend-item">
            <div className="distribution-chart__legend-topline">
              <span
                className={`distribution-chart__swatch distribution-chart__swatch--${item.tone}`}
              />
              <span>{item.label}</span>
            </div>
            <strong>{item.value}</strong>
            <p>{item.note}</p>
          </article>
        ))}
      </div>
    </div>
  );
}
