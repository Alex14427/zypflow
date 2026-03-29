import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { verifyAutomationAuth } from '@/lib/auth-automation';
import {
  sendTrialEndingEmail,
  sendOnboardingNudge,
  sendMilestoneEmail,
  sendWeeklyDigest,
} from '@/lib/email';

// Master lifecycle cron — runs daily, handles all email sequences
// Called by Vercel cron at 8 AM or Make.com
export async function GET(req: NextRequest) {
  const authError = verifyAutomationAuth(req);
  if (authError) return authError;
  return runLifecycle();
}

async function runLifecycle() {
  const results = {
    trialEmails: 0,
    onboardingNudges: 0,
    milestones: 0,
    digests: 0,
    errors: [] as string[],
  };

  // Get all active businesses with trial info
  const { data: organisations } = await supabaseAdmin
    .from('organisations')
    .select('id, name, email, plan, trial_ends_at, system_prompt, booking_url, google_review_link, created_at')
    .eq('active', true);

  if (!organisations) return NextResponse.json(results);

  const now = new Date();
  const dayOfWeek = now.getDay(); // 0 = Sunday, 1 = Monday

  for (const biz of organisations) {
    try {
      // --- TRIAL ENDING SEQUENCE ---
      if (biz.trial_ends_at && biz.plan === 'trial') {
        const trialEnd = new Date(biz.trial_ends_at);
        const daysLeft = Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

        // Send emails at: 4 days, 2 days, 1 day, 0 days (expired), -3 days (winback)
        if ([4, 2, 1, 0, -3].includes(daysLeft)) {
          await sendTrialEndingEmail(biz.email, biz.name, daysLeft);
          results.trialEmails++;
        }
      }

      // --- ONBOARDING NUDGES (days 1, 3, 5 after signup) ---
      const daysSinceSignup = Math.floor(
        (now.getTime() - new Date(biz.created_at).getTime()) / (1000 * 60 * 60 * 24)
      );

      if ([1, 3, 5].includes(daysSinceSignup)) {
        // Check what setup steps are completed
        const completedSteps: string[] = [];
        if (biz.system_prompt) completedSteps.push('widget');
        if (biz.booking_url) completedSteps.push('booking');
        if (biz.google_review_link) completedSteps.push('review');

        // Only nudge if setup is incomplete
        if (completedSteps.length < 3) {
          const step = daysSinceSignup === 1 ? 1 : daysSinceSignup === 3 ? 2 : 3;
          await sendOnboardingNudge(biz.email, biz.name, step, completedSteps);
          results.onboardingNudges++;
        }
      }

      // --- MILESTONE EMAILS ---
      const { count: leadCount } = await supabaseAdmin
        .from('leads')
        .select('id', { count: 'exact', head: true })
        .eq('org_id', biz.id);

      const { count: bookingCount } = await supabaseAdmin
        .from('appointments')
        .select('id', { count: 'exact', head: true })
        .eq('org_id', biz.id);

      const { count: reviewCount } = await supabaseAdmin
        .from('reviews')
        .select('id', { count: 'exact', head: true })
        .eq('org_id', biz.id)
        .not('completed_at', 'is', null);

      const stats = { leads: leadCount || 0, bookings: bookingCount || 0, reviews: reviewCount || 0 };

      // Check milestones (only fire once — check exact count)
      if (stats.leads === 1) {
        await sendMilestoneEmail(biz.email, biz.name, 'first_lead', stats);
        results.milestones++;
      } else if (stats.leads === 10) {
        await sendMilestoneEmail(biz.email, biz.name, 'ten_leads', stats);
        results.milestones++;
      } else if (stats.leads === 50) {
        await sendMilestoneEmail(biz.email, biz.name, 'fifty_leads', stats);
        results.milestones++;
      }

      if (stats.bookings === 1) {
        await sendMilestoneEmail(biz.email, biz.name, 'first_booking', stats);
        results.milestones++;
      }

      if (stats.reviews === 1) {
        await sendMilestoneEmail(biz.email, biz.name, 'first_review', stats);
        results.milestones++;
      }

      // --- WEEKLY DIGEST (every Monday) ---
      if (dayOfWeek === 1) {
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

        const [weekLeads, weekBookings, weekReviews, hotLeads] = await Promise.all([
          supabaseAdmin
            .from('leads')
            .select('id', { count: 'exact', head: true })
            .eq('org_id', biz.id)
            .gte('created_at', sevenDaysAgo.toISOString()),
          supabaseAdmin
            .from('appointments')
            .select('id', { count: 'exact', head: true })
            .eq('org_id', biz.id)
            .gte('created_at', sevenDaysAgo.toISOString()),
          supabaseAdmin
            .from('reviews')
            .select('id', { count: 'exact', head: true })
            .eq('org_id', biz.id)
            .gte('requested_at', sevenDaysAgo.toISOString()),
          supabaseAdmin
            .from('leads')
            .select('id', { count: 'exact', head: true })
            .eq('org_id', biz.id)
            .gte('score', 70)
            .in('status', ['new', 'contacted']),
        ]);

        const weekStats = {
          newLeads: weekLeads.count || 0,
          bookings: weekBookings.count || 0,
          reviewsRequested: weekReviews.count || 0,
          avgScore: 0,
          hotLeads: hotLeads.count || 0,
        };

        // Only send digest if there's any activity (don't spam inactive users)
        if (weekStats.newLeads > 0 || weekStats.bookings > 0 || weekStats.hotLeads > 0) {
          await sendWeeklyDigest(biz.email, biz.name, biz.name, weekStats);
          results.digests++;
        }
      }
    } catch (err) {
      results.errors.push(`${biz.id}: ${String(err)}`);
    }
  }

  return NextResponse.json(results);
}
