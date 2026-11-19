import React, { useId } from 'react';

export function DashboardModule({ title, eyebrow, href, action, note, className = '', primary = false, hideTitle = false, headerControls, description, children }) {
  const headingId = useId();
  return <section className={`fr-module ${primary ? 'fr-primary' : ''} ${className}`} aria-labelledby={hideTitle ? undefined : headingId} aria-label={hideTitle ? title : undefined}>
    {(!hideTitle || href || headerControls) && <header className="fr-header">
      {!hideTitle && <div>{eyebrow && <span className="eyebrow">{eyebrow}</span>}<h2 id={headingId}>{title}</h2>{description && <p className="dashboard-card-description">{description}</p>}</div>}
      {href && <a href={href}>{action} →</a>}
      {headerControls}
    </header>}
    <div className="fr-body">{children}</div>
    {note && <div className="fr-footer">{note}</div>}
  </section>;
}
