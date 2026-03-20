export default function Panel({
  id,
  title,
  eyebrow,
  children,
  actions,
  variant = 'editorial',
  className = '',
}) {
  return (
    <section
      id={id}
      className={`panel panel--${variant} ${className}`.trim()}
    >
      <div className="panel-header">
        <div>
          {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
          <h3>{title}</h3>
        </div>
        {actions ? <div className="panel-actions">{actions}</div> : null}
      </div>
      <div className="panel-body">{children}</div>
    </section>
  );
}
