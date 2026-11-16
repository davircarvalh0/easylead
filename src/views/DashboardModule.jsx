import React from 'react';
export function DashboardModule({title,eyebrow,href,action,note,primary=false,children}) {
 return <section className={`fr-module ${primary?'fr-primary':''}`} aria-label={title}>
  <header className="fr-header"><div><span className="eyebrow">{eyebrow}</span><h2>{title}</h2></div>{href&&<a href={href}>{action} →</a>}</header>
  <div className="fr-body">{children}</div>
  <div className="fr-footer">{note}</div>
 </section>;
}
