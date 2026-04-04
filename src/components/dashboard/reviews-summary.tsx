import Link from 'next/link';
import { DashboardSection } from '@/components/dashboard/dashboard-section';
import { DashboardReviewsSummary } from '@/types/dashboard';

function StatTile({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-[24px] border border-[var(--app-border)] bg-[var(--app-muted)] p-4">
      <p className="text-xs uppercase tracking-[0.18em] text-[var(--app-text-muted)]">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-[var(--app-text)]">{value}</p>
    </div>
  );
}

export function ReviewsSummary({ reviews }: { reviews: DashboardReviewsSummary }) {
  return (
    <DashboardSection
      title="Reviews"
      description="Review request performance overview."
      action={
        <Link
          href="/dashboard/reviews"
          className="rounded-full border border-[var(--app-border)] px-3 py-2 text-xs font-semibold text-[var(--app-text-muted)] transition hover:border-brand-purple hover:text-brand-purple"
        >
          Open reviews
        </Link>
      }
    >
      <div className="grid gap-3 p-5 sm:grid-cols-2">
        <StatTile label="Requests Sent" value={reviews.requestsSent} />
        <StatTile label="Completed" value={reviews.completed} />
        <StatTile label="Completion Rate" value={`${reviews.completionRate}%`} />
        <StatTile label="Average Rating" value={reviews.averageRating ? reviews.averageRating.toFixed(1) : '-'} />
      </div>
    </DashboardSection>
  );
}
