import { DashboardSection } from '@/components/dashboard/dashboard-section';
import { DashboardReviewsSummary } from '@/types/dashboard';

function StatTile({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border bg-gray-50 p-3">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="mt-1 text-xl font-semibold text-gray-900">{value}</p>
    </div>
  );
}

export function ReviewsSummary({ reviews }: { reviews: DashboardReviewsSummary }) {
  return (
    <DashboardSection title="Reviews" description="Review request performance overview.">
      <div className="grid gap-3 p-4 sm:grid-cols-2">
        <StatTile label="Requests Sent" value={reviews.requestsSent} />
        <StatTile label="Completed" value={reviews.completed} />
        <StatTile label="Completion Rate" value={`${reviews.completionRate}%`} />
        <StatTile label="Average Rating" value={reviews.averageRating ? reviews.averageRating.toFixed(1) : '—'} />
      </div>
    </DashboardSection>
  );
}
