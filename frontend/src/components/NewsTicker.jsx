export default function NewsTicker({ items }) {
  if (!items?.length) {
    return null;
  }

  const tickerItems = [...items, ...items];

  return (
    <section className="news-ticker" aria-label="Platform bulletin ticker">
      <div className="news-ticker__track">
        {tickerItems.map((item, index) => (
          <span
            key={`${item}-${index}`}
            className="news-ticker__item"
            aria-hidden={index >= items.length}
          >
            <span className="news-ticker__bullet">+</span>
            {item}
          </span>
        ))}
      </div>
    </section>
  );
}
