import { ReactNode } from "react";

interface PolicyLayoutProps {
  title: string;
  subtitle?: string;
  lastUpdated: string;
  children: ReactNode;
}

export function PolicyLayout({ title, subtitle, lastUpdated, children }: PolicyLayoutProps) {
  return (
    <>
      <section className="relative pt-28 lg:pt-32 pb-12 bg-surface-alt border-b border-surface-line/20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-brand-600 text-xs uppercase tracking-[0.3em] mb-4">
            Never Settle Saga
          </p>
          <h1 className="font-display text-4xl sm:text-5xl font-bold mb-4">
            {title}
          </h1>
          {subtitle && (
            <p className="text-lg text-ink-muted leading-relaxed max-w-2xl mx-auto">
              {subtitle}
            </p>
          )}
          <p className="mt-6 text-sm text-ink-soft">
            Last updated: {lastUpdated}
          </p>
        </div>
      </section>
      <section className="py-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <article className="policy-prose space-y-6 text-ink-muted leading-relaxed">
            {children}
          </article>
        </div>
      </section>
    </>
  );
}

export function PolicyH2({ children }: { children: ReactNode }) {
  return (
    <h2 className="font-display text-2xl sm:text-3xl font-bold text-ink mt-12 mb-4 pb-2 border-b border-surface-line/20">
      {children}
    </h2>
  );
}

export function PolicyH3({ children }: { children: ReactNode }) {
  return (
    <h3 className="font-display text-xl font-semibold text-brand-600 mt-8 mb-3">
      {children}
    </h3>
  );
}

export function PolicyList({ children }: { children: ReactNode }) {
  return (
    <ul className="list-disc pl-6 space-y-2 text-ink-muted">{children}</ul>
  );
}
