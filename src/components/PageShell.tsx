import type { ReactNode } from 'react';

type MetaItem = {
  label: string;
  value: string;
};

type PageShellProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  highlights?: string[];
  meta?: MetaItem[];
  headerIconSrc?: string;
  headerIconAlt?: string;
  headerAlign?: 'left' | 'center';
  children: ReactNode;
  tone?: 'default' | 'success' | 'danger';
  variant?: 'default' | 'auth';
  contentClassName?: string;
};

export default function PageShell({
  eyebrow,
  title,
  description,
  highlights,
  meta,
  headerIconSrc,
  headerIconAlt = 'Service icon',
  headerAlign = 'left',
  children,
  tone = 'default',
  variant = 'default',
  contentClassName
}: PageShellProps) {
  return (
    <div className={`page-shell page-shell--${tone} page-shell--${variant}`}>
      <div className="page-shell__frame">
        <main className={`page-shell__content page-shell__content--${variant}${contentClassName ? ` ${contentClassName}` : ''}`}>
          {variant === 'auth' && (
            <div className="page-shell__topline">
              <span className="page-shell__topline-label"><span className="page-shell__topline-dot" />不安全认证入口</span>
              <span className="page-shell__topline-id">FISH ID</span>
            </div>
          )}
          <header className={`page-shell__header page-shell__header--${headerAlign}`}>
            {headerIconSrc && (
              <span className="page-shell__icon-wrap" aria-hidden="true">
                <img className="page-shell__icon" src={headerIconSrc} alt={headerIconAlt} />
              </span>
            )}
            {eyebrow && <span className="page-shell__eyebrow">{eyebrow}</span>}
            <h1 className="page-shell__title">{title}</h1>
            {description && <p className="page-shell__description">{description}</p>}
            {highlights && highlights.length > 0 && (
              <div className="page-shell__highlights">
                {highlights.map((item) => (
                  <span key={item}>{item}</span>
                ))}
              </div>
            )}
            {meta && meta.length > 0 && (
              <div className="page-shell__meta">
                {meta.map((item) => (
                  <div className="page-shell__meta-item" key={item.label}>
                    <span className="page-shell__meta-label">{item.label}</span>
                    <span className="page-shell__meta-value">{item.value}</span>
                  </div>
                ))}
              </div>
            )}
          </header>
          <section className={`surface-card surface-card--${variant}`}>{children}</section>
          {variant === 'auth' && (
            <footer className="page-shell__footer"><span>© {new Date().getFullYear()} Fish SSO</span><span>身份认证服务</span></footer>
          )}
        </main>
      </div>
    </div>
  );
}
