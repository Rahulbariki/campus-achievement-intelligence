export default function MetricGrid({ items }) {
  return (
    <section id="overview" className="metric-grid">
      {items.map((item) => (
        <article
          key={item.label}
          className={`metric-card ${item.tone ? `metric-card--${item.tone}` : ''}`}
        >
          <div className="metric-card__header">
            <p className="eyebrow">{item.label}</p>
            {item.badge ? <span className="metric-card__badge">{item.badge}</span> : null}
          </div>
          <strong>{item.value}</strong>
          <p>{item.caption}</p>
        </article>
      ))}
    </section>
  );
}
