'use client';

import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { resolveCurrentBusiness } from '@/lib/current-business';
import {
  PortalEmptyState,
  PortalMetricCard,
  PortalMetricGrid,
  PortalPageHeader,
  PortalPanel,
  PortalStatusPill,
} from '@/components/dashboard/portal-primitives';

interface Review {
  id: string;
  platform: string;
  rating: number | null;
  review_text: string | null;
  requested_at: string;
  completed_at: string | null;
  leads: { name: string; email: string } | null;
}

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const { business } = await resolveCurrentBusiness();
        const orgFilter = `org_id.eq.${business.id},business_id.eq.${business.id}`;

        const { data, error: reviewsError } = await supabase
          .from('reviews')
          .select('id, platform, rating, review_text, requested_at, completed_at, leads(name, email)')
          .or(orgFilter)
          .order('requested_at', { ascending: false })
          .limit(100);

        if (reviewsError) throw reviewsError;
        setReviews((data as unknown as Review[]) || []);
        setError(null);
      } catch (loadError) {
        console.error('Failed to load reviews:', loadError);
        setError(loadError instanceof Error ? loadError.message : 'Unable to load reviews.');
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  const totalRequested = reviews.length;
  const totalCompleted = useMemo(() => reviews.filter((review) => review.completed_at).length, [reviews]);
  const ratedReviews = useMemo(() => reviews.filter((review) => review.rating), [reviews]);
  const avgRating = useMemo(
    () =>
      ratedReviews.reduce((sum, review) => sum + (review.rating || 0), 0) /
      (ratedReviews.length || 1),
    [ratedReviews]
  );
  const completionRate = totalRequested > 0 ? Math.round((totalCompleted / totalRequested) * 100) : 0;

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-purple border-t-transparent" />
      </div>
    );
  }

  return (
    <div>
      <PortalPageHeader
        eyebrow="Reviews"
        title="Reputation growth that feels measured, not spammy."
        description="Clients should see this page and immediately understand two things: requests are going out consistently, and the workflow is helping them build stronger public proof."
        meta={
          <>
            <PortalStatusPill tone={completionRate >= 25 ? 'success' : 'warning'}>
              {completionRate}% request completion
            </PortalStatusPill>
            <PortalStatusPill>{ratedReviews.length} public reviews with ratings</PortalStatusPill>
          </>
        }
      />

      {error ? (
        <PortalPanel title="Reviews unavailable" description="The review feed could not be loaded.">
          <PortalEmptyState title="We couldn't load the reviews view." description={error} />
        </PortalPanel>
      ) : (
        <>
          <PortalMetricGrid>
            <PortalMetricCard
              label="Requests sent"
              value={totalRequested}
              description="All review requests created by the post-appointment workflow."
              icon={<PaperPlaneIcon className="h-5 w-5" />}
            />
            <PortalMetricCard
              label="Completed"
              value={totalCompleted}
              description="Requests that turned into completed reviews."
              tone="success"
              icon={<CheckIcon className="h-5 w-5" />}
            />
            <PortalMetricCard
              label="Completion rate"
              value={`${completionRate}%`}
              description="A useful signal for message timing, channel choice, and overall patient sentiment."
              tone={completionRate >= 25 ? 'success' : 'default'}
              icon={<ChartIcon className="h-5 w-5" />}
            />
            <PortalMetricCard
              label="Average rating"
              value={avgRating > 0 ? avgRating.toFixed(1) : '—'}
              description="The average across completed reviews that include a rating."
              tone="brand"
              icon={<StarIcon className="h-5 w-5" />}
            />
          </PortalMetricGrid>

          <PortalPanel
            title="Review request log"
            description="Track which requests completed, which platform they landed on, and what feedback came back."
          >
            {reviews.length === 0 ? (
              <PortalEmptyState
                title="No review requests have been recorded yet."
                description="Once completed appointments and review automation are live, every request will be logged here with platform, rating, and response status."
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-[var(--app-muted)] text-left text-[var(--app-text-soft)]">
                    <tr>
                      <th className="px-5 py-4 font-semibold">Customer</th>
                      <th className="px-5 py-4 font-semibold">Platform</th>
                      <th className="px-5 py-4 font-semibold">Rating</th>
                      <th className="px-5 py-4 font-semibold">Review</th>
                      <th className="px-5 py-4 font-semibold">Requested</th>
                      <th className="px-5 py-4 font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reviews.map((review) => (
                      <tr key={review.id} className="border-t border-[var(--app-border)] transition hover:bg-[var(--app-muted)]/70">
                        <td className="px-5 py-4">
                          <p className="font-semibold text-[var(--app-text)]">{review.leads?.name || 'Anonymous patient'}</p>
                          <p className="mt-1 text-xs text-[var(--app-text-soft)]">{review.leads?.email || 'No email captured'}</p>
                        </td>
                        <td className="px-5 py-4 capitalize text-[var(--app-text-muted)]">{review.platform}</td>
                        <td className="px-5 py-4">
                          {review.rating ? (
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-amber-500">{review.rating}</span>
                              <span className="text-amber-500">{'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}</span>
                            </div>
                          ) : (
                            <span className="text-[var(--app-text-soft)]">—</span>
                          )}
                        </td>
                        <td className="max-w-sm px-5 py-4 text-[var(--app-text-muted)]">
                          <p className="line-clamp-2">{review.review_text || 'No written review captured.'}</p>
                        </td>
                        <td className="px-5 py-4 text-[var(--app-text-muted)]">
                          {new Date(review.requested_at).toLocaleDateString('en-GB')}
                        </td>
                        <td className="px-5 py-4">
                          <PortalStatusPill tone={review.completed_at ? 'success' : 'warning'}>
                            {review.completed_at ? 'Completed' : 'Pending'}
                          </PortalStatusPill>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </PortalPanel>
        </>
      )}
    </div>
  );
}

function PaperPlaneIcon({ className }: { className?: string }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M22 2L11 13" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M22 2L15 22l-4-9-9-4 20-7z" /></svg>;
}

function CheckIcon({ className }: { className?: string }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M5 13l4 4L19 7" /></svg>;
}

function ChartIcon({ className }: { className?: string }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 17V7m8 10V11M4 21h16" /></svg>;
}

function StarIcon({ className }: { className?: string }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118L2.98 10.1c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>;
}
