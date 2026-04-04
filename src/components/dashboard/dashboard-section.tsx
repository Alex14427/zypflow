import { ReactNode } from 'react';

type DashboardSectionProps = {
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
};

export function DashboardSection({ title, description, action, children }: DashboardSectionProps) {
  return (
    <section className="surface-panel overflow-hidden rounded-[28px]">
      <header className="flex items-start justify-between gap-3 border-b border-[var(--app-border)] px-5 py-4">
        <div>
          <h2 className="text-base font-semibold text-[var(--app-text)]">{title}</h2>
          {description && <p className="text-xs text-[var(--app-text-muted)]">{description}</p>}
        </div>
        {action}
      </header>
      <div>{children}</div>
    </section>
  );
}

export function SectionEmptyState({
  title = 'Nothing to show yet.',
  message,
  action,
}: {
  title?: string;
  message: string;
  action?: ReactNode;
}) {
  return (
    <div className="px-5 py-10">
      <div className="rounded-[24px] border border-dashed border-[var(--app-card-border)] bg-[var(--app-muted)] px-5 py-6">
        <p className="text-sm font-semibold text-[var(--app-text)]">{title}</p>
        <p className="mt-2 max-w-xl text-sm leading-6 text-[var(--app-text-muted)]">{message}</p>
        {action ? <div className="mt-4">{action}</div> : null}
      </div>
    </div>
  );
}
