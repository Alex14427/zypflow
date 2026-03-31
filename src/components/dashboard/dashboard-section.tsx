import { ReactNode } from 'react';

type DashboardSectionProps = {
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
};

export function DashboardSection({ title, description, action, children }: DashboardSectionProps) {
  return (
    <section className="rounded-xl border bg-white shadow-sm">
      <header className="flex items-center justify-between border-b px-4 py-3">
        <div>
          <h2 className="text-base font-semibold text-gray-900">{title}</h2>
          {description && <p className="text-xs text-gray-500">{description}</p>}
        </div>
        {action}
      </header>
      <div>{children}</div>
    </section>
  );
}

export function SectionEmptyState({ message }: { message: string }) {
  return <p className="px-4 py-8 text-sm text-gray-500">{message}</p>;
}
