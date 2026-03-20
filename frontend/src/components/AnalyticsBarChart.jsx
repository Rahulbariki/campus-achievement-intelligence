function defaultFormatter(value) {
  if (typeof value === 'number') {
    return value.toLocaleString();
  }
  return value;
}

export default function AnalyticsBarChart({
  data,
  ariaLabel,
  formatter = defaultFormatter,
  suffix = '',
}) {
  const maxValue = Math.max(...data.map((item) => item.value), 1);

  return (
    <div className="bar-chart" role="img" aria-label={ariaLabel}>
      {data.map((item, index) => (
        <article key={item.label} className="bar-chart__row">
          <div className="bar-chart__meta">
            <span className="bar-chart__label">{item.label}</span>
            <span className="bar-chart__value">
              {formatter(item.value)}
              {suffix}
            </span>
          </div>
          <div className="bar-chart__track">
            <div
              className={`bar-chart__fill ${index === 0 ? 'is-featured' : ''}`}
              style={{ width: `${Math.max((item.value / maxValue) * 100, 6)}%` }}
            />
          </div>
          {item.note ? <p className="bar-chart__note">{item.note}</p> : null}
        </article>
      ))}
    </div>
  );
}
