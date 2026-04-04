export function DashboardLoading() {
  return (
    <div className="space-y-6">
      <div className="h-16 animate-pulse rounded-[28px] bg-[var(--app-muted)]" />
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="h-72 animate-pulse rounded-[28px] bg-[var(--app-muted)]" />
        <div className="h-72 animate-pulse rounded-[28px] bg-[var(--app-muted)]" />
        <div className="h-64 animate-pulse rounded-[28px] bg-[var(--app-muted)]" />
        <div className="h-64 animate-pulse rounded-[28px] bg-[var(--app-muted)]" />
      </div>
    </div>
  );
}
