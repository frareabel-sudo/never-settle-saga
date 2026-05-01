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
      <section className="relative pt-28 lg:pt-32 pb-12 bg-charcoal-800 border-b border-charcoal-50/20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-amber-500/70 text-xs uppercase tracking-[0.3em] mb-4">
            Never Settle Saga
          </p>
          <h1 className="font-display text-4xl sm:text-5xl font-bold mb-4">
            {title}
          </h1>
          {subtitle && (
            <p className="text-lg text-gray-300 leading-relaxed max-w-2xl mx-auto">
              {subtitle}
            </p>
          )}
          <p className="mt-6 text-sm text-gray-500">
            Last updated: {lastUpdated}
          </p>
        </div>
      </section>
      <section className="py-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <article className="policy-prose space-y-6 text-gray-300 leading-relaxed">
            {children}
          </article>
        </div>
      </section>
    </>
  );
}

export function PolicyH2({ children }: { children: ReactNode }) {
  return (
    <h2 className="font-display text-2xl sm:text-3xl font-bold text-white mt-12 mb-4 pb-2 border-b border-charcoal-50/20">
      {children}
    </h2>
  );
}

export function PolicyH3({ children }: { children: ReactNode }) {
  return (
    <h3 className="font-display text-xl font-semibold text-amber-300 mt-8 mb-3">
      {children}
    </h3>
  );
}

export function PolicyList({ children }: { children: ReactNode }) {
  return (
    <ul className="list-disc pl-6 space-y-2 text-gray-300">{children}</ul>
  );
}
