import type { ReactNode } from 'react';

type PortalPageHeaderProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  meta?: ReactNode;
  actions?: ReactNode;
};

type PortalMetricCardProps = {
  label: string;
  value: ReactNode;
  description?: string;
  tone?: 'default' | 'brand' | 'success' | 'warning' | 'danger';
  icon?: ReactNode;
};

type PortalPanelProps = {
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  contentClassName?: string;
};

type PortalEmptyStateProps = {
  title: string;
  description: string;
  action?: ReactNode;
};

type SegmentedOption<T extends string> = {
  value: T;
  label: string;
  count?: number;
};

type PortalSegmentedControlProps<T extends string> = {
  value: T;
  options: SegmentedOption<T>[];
  onChange: (value: T) => void;
};

const TONE_STYLES: Record<NonNullable<PortalMetricCardProps['tone']>, string> = {
  default: 'bg-[var(--app-surface-strong)] text-[var(--app-text)]',
  brand: 'bg-brand-purple text-white',
  success: 'bg-emerald-600 text-white',
  warning: 'bg-amber-500 text-slate-950',
  danger: 'bg-rose-600 text-white',
};

export function PortalPageHeader({ eyebrow, title, description, meta, actions }: PortalPageHeaderProps) {
  return (
    <div className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
      <div className="max-w-3xl">
        {eyebrow ? <p className="page-eyebrow">{eyebrow}</p> : null}
        <h1 className="mt-2 text-3xl font-semibold tracking-[-0.03em] text-[var(--app-text)] sm:text-4xl">{title}</h1>
        {description ? <p className="page-subtle mt-3 max-w-2xl text-sm sm:text-base">{description}</p> : null}
        {meta ? <div className="mt-4 flex flex-wrap gap-2">{meta}</div> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-3">{actions}</div> : null}
    </div>
  );
}

export function PortalMetricGrid({ children }: { children: ReactNode }) {
  return <div className="metric-strip mb-8">{children}</div>;
}

export function PortalMetricCard({
  label,
  value,
  description,
  tone = 'default',
  icon,
}: PortalMetricCardProps) {
  const toneClass = TONE_STYLES[tone];
  const inverse = tone !== 'default';

  return (
    <article className={`kpi-tile ${toneClass}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className={`text-xs font-semibold uppercase tracking-[0.18em] ${inverse ? 'text-white/70' : 'text-[var(--app-text-soft)]'}`}>
            {label}
          </p>
          <div className="mt-3 text-3xl font-semibold tracking-[-0.03em]">{value}</div>
          {description ? (
            <p className={`mt-2 text-sm ${inverse ? 'text-white/80' : 'text-[var(--app-text-muted)]'}`}>{description}</p>
          ) : null}
        </div>
        {icon ? (
          <div className={`rounded-2xl border p-3 ${inverse ? 'border-white/15 bg-white/10 text-white' : 'border-[var(--app-card-border)] bg-[var(--app-muted)] text-brand-purple'}`}>
            {icon}
          </div>
        ) : null}
      </div>
    </article>
  );
}

export function PortalPanel({ title, description, action, children, className = '', contentClassName = '' }: PortalPanelProps) {
  return (
    <section className={`surface-panel overflow-hidden rounded-[28px] ${className}`.trim()}>
      <header className="flex flex-col gap-3 border-b border-[var(--app-border)] px-5 py-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-base font-semibold text-[var(--app-text)]">{title}</h2>
          {description ? <p className="mt-1 text-sm text-[var(--app-text-muted)]">{description}</p> : null}
        </div>
        {action ? <div className="flex flex-wrap items-center gap-2">{action}</div> : null}
      </header>
      <div className={contentClassName}>{children}</div>
    </section>
  );
}

export function PortalEmptyState({ title, description, action }: PortalEmptyStateProps) {
  return (
    <div className="flex flex-col items-start gap-4 px-5 py-10 text-sm text-[var(--app-text-muted)]">
      <div className="rounded-2xl border border-dashed border-[var(--app-card-border)] bg-[var(--app-muted)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--app-text-soft)]">
        Waiting on live activity
      </div>
      <div>
        <p className="text-base font-semibold text-[var(--app-text)]">{title}</p>
        <p className="mt-2 max-w-xl leading-6">{description}</p>
      </div>
      {action}
    </div>
  );
}

export function PortalSegmentedControl<T extends string>({
  value,
  options,
  onChange,
}: PortalSegmentedControlProps<T>) {
  return (
    <div className="inline-flex flex-wrap gap-1 rounded-full border border-[var(--app-border)] bg-[var(--app-muted)] p-1">
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            onClick={() => onChange(option.value)}
            className={`rounded-full px-4 py-2 text-sm font-medium transition ${
              active
                ? 'bg-[var(--app-surface-strong)] text-[var(--app-text)] shadow-[0_12px_28px_rgba(15,23,42,0.08)]'
                : 'text-[var(--app-text-muted)] hover:text-[var(--app-text)]'
            }`}
          >
            {option.label}
            {typeof option.count === 'number' ? <span className="ml-2 text-[var(--app-text-soft)]">({option.count})</span> : null}
          </button>
        );
      })}
    </div>
  );
}

export function PortalStatusPill({
  children,
  tone = 'default',
}: {
  children: ReactNode;
  tone?: 'default' | 'brand' | 'success' | 'warning' | 'danger';
}) {
  const tones: Record<NonNullable<typeof tone>, string> = {
    default: 'bg-[var(--app-muted)] text-[var(--app-text-muted)]',
    brand: 'bg-brand-purple/12 text-brand-purple',
    success: 'bg-emerald-500/12 text-emerald-600 dark:text-emerald-300',
    warning: 'bg-amber-500/12 text-amber-700 dark:text-amber-300',
    danger: 'bg-rose-500/12 text-rose-600 dark:text-rose-300',
  };

  return (
    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${tones[tone]}`}>
      {children}
    </span>
  );
}
