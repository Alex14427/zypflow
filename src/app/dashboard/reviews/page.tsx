'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

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

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: biz } = await supabase.from('organisations').select('id').eq('email', user.email).maybeSingle();
      if (!biz) return;

      const { data } = await supabase
        .from('reviews')
        .select('id, platform, rating, review_text, requested_at, completed_at, leads(name, email)')
        .eq('org_id', biz.id)
        .order('requested_at', { ascending: false })
        .limit(100);
      setReviews((data as unknown as Review[]) || []);
      setLoading(false);
    }
    load();
  }, []);

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin w-8 h-8 border-4 border-brand-purple border-t-transparent rounded-full" /></div>;
  }

  const totalRequested = reviews.length;
  const totalCompleted = reviews.filter(r => r.completed_at).length;
  const avgRating = reviews.filter(r => r.rating).reduce((sum, r) => sum + (r.rating || 0), 0) / (reviews.filter(r => r.rating).length || 1);
  const completionRate = totalRequested > 0 ? Math.round((totalCompleted / totalRequested) * 100) : 0;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Reviews</h1>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-xl shadow-sm border p-5">
          <p className="text-sm text-gray-500">Requests Sent</p>
          <p className="text-3xl font-bold mt-1">{totalRequested}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border p-5">
          <p className="text-sm text-gray-500">Completed</p>
          <p className="text-3xl font-bold mt-1 text-green-600">{totalCompleted}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border p-5">
          <p className="text-sm text-gray-500">Completion Rate</p>
          <p className="text-3xl font-bold mt-1 text-blue-600">{completionRate}%</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border p-5">
          <p className="text-sm text-gray-500">Avg Rating</p>
          <p className="text-3xl font-bold mt-1 text-yellow-500">{avgRating > 0 ? avgRating.toFixed(1) : '\u2014'}</p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 text-left">
            <tr>
              <th className="px-4 py-3 font-medium">Customer</th>
              <th className="px-4 py-3 font-medium">Platform</th>
              <th className="px-4 py-3 font-medium">Rating</th>
              <th className="px-4 py-3 font-medium">Review</th>
              <th className="px-4 py-3 font-medium">Requested</th>
              <th className="px-4 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {reviews.map(review => (
              <tr key={review.id} className="border-t hover:bg-gray-50">
                <td className="px-4 py-3">
                  <p className="font-medium">{review.leads?.name || '\u2014'}</p>
                  <p className="text-xs text-gray-400">{review.leads?.email || ''}</p>
                </td>
                <td className="px-4 py-3 capitalize">{review.platform}</td>
                <td className="px-4 py-3">
                  {review.rating ? (
                    <div className="flex items-center gap-1">
                      <span className="text-yellow-500 font-semibold">{review.rating}</span>
                      <span className="text-yellow-400">{'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}</span>
                    </div>
                  ) : '\u2014'}
                </td>
                <td className="px-4 py-3 text-gray-600 max-w-xs truncate">{review.review_text || '\u2014'}</td>
                <td className="px-4 py-3 text-gray-400">{new Date(review.requested_at).toLocaleDateString('en-GB')}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    review.completed_at ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                  }`}>
                    {review.completed_at ? 'Completed' : 'Pending'}
                  </span>
                </td>
              </tr>
            ))}
            {reviews.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-12 text-center text-gray-400">
                No review requests yet. They are sent automatically after appointments.
              </td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
