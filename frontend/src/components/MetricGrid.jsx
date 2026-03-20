export default function MetricGrid({ items }) {
  return (
    <div className="metric-grid">
      {items.map((item) => (
        <article key={item.label} className="metric-card">
          <p className="eyebrow">{item.label}</p>
          <strong>{item.value}</strong>
          <span>{item.caption}</span>
        </article>
      ))}
    </div>
  );
}
