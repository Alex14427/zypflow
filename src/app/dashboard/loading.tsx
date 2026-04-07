export default function DashboardLoading() {
  return (
    <div className="animate-pulse space-y-6">
      {/* Stat cards skeleton */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-[var(--app-border)] bg-[var(--app-surface)] p-5">
            <div className="h-3 w-20 rounded bg-[var(--app-surface-hover)]" />
            <div className="mt-3 h-7 w-12 rounded bg-[var(--app-surface-hover)]" />
          </div>
        ))}
      </div>
      {/* Table skeleton */}
      <div className="rounded-xl border border-[var(--app-border)] bg-[var(--app-surface)] p-6">
        <div className="mb-6 h-5 w-32 rounded bg-[var(--app-surface-hover)]" />
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex gap-4">
              <div className="h-4 flex-1 rounded bg-[var(--app-surface-hover)]" />
              <div className="h-4 w-24 rounded bg-[var(--app-surface-hover)]" />
              <div className="h-4 w-16 rounded bg-[var(--app-surface-hover)]" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
