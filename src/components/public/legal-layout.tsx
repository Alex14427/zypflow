import Link from 'next/link';

export function LegalLayout({
  title,
  eyebrow,
  lastUpdated,
  summary,
  children,
}: {
  title: string;
  eyebrow: string;
  lastUpdated: string;
  summary: string;
  children: React.ReactNode;
}) {
  return (
    <div className="app-shell">
      <div className="mx-auto max-w-5xl px-5 py-10 sm:px-8">
        <header className="glass-panel mb-8 flex flex-wrap items-center justify-between gap-4 rounded-full px-5 py-3">
          <Link href="/" className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-purple text-sm font-bold text-white">
              Z
            </span>
            <div>
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Zypflow</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Clinic revenue operating system</p>
            </div>
          </Link>

          <nav className="flex flex-wrap items-center gap-3 text-sm">
            <Link
              href="/pricing"
              className="rounded-full border border-[var(--app-border)] bg-[var(--app-surface)] px-4 py-2 font-semibold text-[var(--app-text)] transition hover:border-brand-purple hover:text-brand-purple"
            >
              Founding offer
            </Link>
            <Link
              href="/privacy"
              className="rounded-full border border-[var(--app-border)] bg-[var(--app-surface)] px-4 py-2 font-semibold text-[var(--app-text)] transition hover:border-brand-purple hover:text-brand-purple"
            >
              Privacy
            </Link>
            <Link
              href="/terms"
              className="rounded-full border border-[var(--app-border)] bg-[var(--app-surface)] px-4 py-2 font-semibold text-[var(--app-text)] transition hover:border-brand-purple hover:text-brand-purple"
            >
              Terms
            </Link>
            <Link
              href="/login"
              className="rounded-full bg-brand-purple px-4 py-2 font-semibold text-white transition hover:bg-brand-purple-dark"
            >
              Approved clinics log in
            </Link>
          </nav>
        </header>

        <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="public-frame reveal-up">
            <p className="page-eyebrow">{eyebrow}</p>
            <h1 className="mt-4 text-4xl font-semibold tracking-[-0.04em] text-[var(--app-text)] sm:text-5xl">{title}</h1>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-[var(--app-text-muted)]">{summary}</p>
            <p className="mt-4 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--app-text-soft)]">
              Last updated {lastUpdated}
            </p>
          </div>

          <aside className="surface-panel reveal-up reveal-delay-1 rounded-[32px] p-6">
            <p className="page-eyebrow">Why this matters</p>
            <div className="mt-4 rounded-[24px] bg-[var(--app-muted)] p-4">
              <p className="text-sm font-semibold text-[var(--app-text)]">Trust is part of the product</p>
              <p className="mt-2 text-sm leading-7 text-[var(--app-text-muted)]">
                Strong clinics do not buy vague automation. They buy clarity around data handling, billing, messaging, and who is responsible when the system runs live.
              </p>
            </div>
            <div className="mt-4 rounded-[24px] border border-[var(--app-border)] bg-[var(--app-surface)] p-4">
              <p className="text-sm font-semibold text-[var(--app-text)]">Need a human answer?</p>
              <p className="mt-2 text-sm leading-7 text-[var(--app-text-muted)]">
                Email <a className="font-semibold text-brand-purple hover:text-brand-purple-dark" href="mailto:hello@zypflow.com">hello@zypflow.com</a> and we will point you to the right person or explain the relevant workflow.
              </p>
            </div>
          </aside>
        </section>

        <section className="surface-panel mt-6 rounded-[36px] p-6 sm:p-8">
          <div className="prose prose-slate max-w-none dark:prose-invert [&_a]:text-brand-purple [&_a]:font-semibold [&_h2]:text-[var(--app-text)] [&_li]:text-[var(--app-text-muted)] [&_p]:text-[var(--app-text-muted)]">
            {children}
          </div>
        </section>
      </div>
    </div>
  );
}
