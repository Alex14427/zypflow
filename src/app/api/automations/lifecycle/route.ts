import { randomUUID } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { verifyAutomationAuth } from '@/lib/auth-automation';
import { fetchClientHealthBundle } from '@/lib/client-health';
import {
  sendMilestoneEmail,
  sendOnboardingNudge,
  sendTrialEndingEmail,
  sendWeeklyDigest,
} from '@/lib/email';
import { canUseSupabaseAdmin, isLocalSmokeMode } from '@/lib/local-mode';
import { captureException, captureMessage } from '@/lib/monitoring';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  const authError = verifyAutomationAuth(req);
  if (authError) return authError;
  return runLifecycle();
}

async function runLifecycle() {
  const runId = randomUUID();
  const results = {
    trialEmails: 0,
    onboardingNudges: 0,
    milestones: 0,
    digests: 0,
    errors: [] as string[],
  };

  if (isLocalSmokeMode() && !canUseSupabaseAdmin()) {
    return NextResponse.json({
      ...results,
      runId,
      reason: 'Local smoke mode is active and lifecycle automation needs a real database.',
    });
  }

  const { data: businesses, error } = await supabaseAdmin
    .from('businesses')
    .select(
      'id, name, email, plan, trial_ends_at, system_prompt, booking_url, google_review_link, avg_job_value, created_at, settings'
    )
    .eq('active', true);

  if (error) {
    captureException(error, {
      context: 'lifecycle-load-businesses',
      tags: { route: 'lifecycle', runId },
    });
    return NextResponse.json({ error: 'Unable to load lifecycle businesses.' }, { status: 500 });
  }

  if (!businesses) {
    return NextResponse.json({ ...results, runId });
  }

  const now = new Date();
  const todayKey = now.toISOString().slice(0, 10);
  const dayOfWeek = now.getDay();

  for (const business of businesses) {
    try {
      const settings = (business.settings as Record<string, unknown> | null) || {};
      const lifecycleLog = isRecord(settings.lifecycleLog) ? (settings.lifecycleLog as Record<string, string>) : {};
      let lifecycleChanged = false;

      const markLifecycle = (key: string) => {
        if (lifecycleLog[key]) return false;
        lifecycleLog[key] = todayKey;
        lifecycleChanged = true;
        return true;
      };

      if (business.trial_ends_at && business.plan === 'trial') {
        const trialEnd = new Date(business.trial_ends_at);
        const daysLeft = Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        const lifecycleKey = `launch-window:${daysLeft}`;

        if ([4, 2, 1, 0, -3].includes(daysLeft) && markLifecycle(lifecycleKey)) {
          await sendTrialEndingEmail(business.email, business.name, daysLeft);
          results.trialEmails++;
        }
      }

      const daysSinceSignup = Math.floor(
        (now.getTime() - new Date(business.created_at).getTime()) / (1000 * 60 * 60 * 24)
      );

      if ([1, 3, 5].includes(daysSinceSignup)) {
        const completedSteps: string[] = [];
        if (business.system_prompt) completedSteps.push('widget');
        if (business.booking_url) completedSteps.push('booking');
        if (business.google_review_link) completedSteps.push('review');

        if (completedSteps.length < 3) {
          const step = daysSinceSignup === 1 ? 1 : daysSinceSignup === 3 ? 2 : 3;
          if (markLifecycle(`onboarding:${step}`)) {
            await sendOnboardingNudge(business.email, business.name, step, completedSteps);
            results.onboardingNudges++;
          }
        }
      }

      const [
        { count: leadCount, error: leadCountError },
        { count: bookingCount, error: bookingCountError },
        { count: reviewCount, error: reviewCountError },
      ] = await Promise.all([
        supabaseAdmin.from('leads').select('id', { count: 'exact', head: true }).eq('org_id', business.id),
        supabaseAdmin
          .from('appointments')
          .select('id', { count: 'exact', head: true })
          .eq('org_id', business.id),
        supabaseAdmin
          .from('reviews')
          .select('id', { count: 'exact', head: true })
          .eq('org_id', business.id)
          .not('completed_at', 'is', null),
      ]);

      if (leadCountError || bookingCountError || reviewCountError) {
        throw leadCountError || bookingCountError || reviewCountError;
      }

      const stats = {
        leads: leadCount || 0,
        bookings: bookingCount || 0,
        reviews: reviewCount || 0,
      };

      if (stats.leads === 1 && markLifecycle('milestone:first_lead')) {
        await sendMilestoneEmail(business.email, business.name, 'first_lead', stats);
        results.milestones++;
      } else if (stats.leads === 10 && markLifecycle('milestone:ten_leads')) {
        await sendMilestoneEmail(business.email, business.name, 'ten_leads', stats);
        results.milestones++;
      } else if (stats.leads === 50 && markLifecycle('milestone:fifty_leads')) {
        await sendMilestoneEmail(business.email, business.name, 'fifty_leads', stats);
        results.milestones++;
      }

      if (stats.bookings === 1 && markLifecycle('milestone:first_booking')) {
        await sendMilestoneEmail(business.email, business.name, 'first_booking', stats);
        results.milestones++;
      }

      if (stats.reviews === 1 && markLifecycle('milestone:first_review')) {
        await sendMilestoneEmail(business.email, business.name, 'first_review', stats);
        results.milestones++;
      }

      if (dayOfWeek === 1 && markLifecycle(`digest:${todayKey}`)) {
        const weekReport = await fetchClientHealthBundle(
          supabaseAdmin,
          business.id,
          business.avg_job_value
        );

        if (
          weekReport.metrics.newLeads > 0 ||
          weekReport.metrics.bookingsCreated > 0 ||
          weekReport.metrics.hotLeads > 0 ||
          weekReport.metrics.followUpsSent > 0
        ) {
          await sendWeeklyDigest(business.email, business.name, business.name, weekReport);
          results.digests++;
        }
      }

      if (lifecycleChanged) {
        const { error: updateError } = await supabaseAdmin
          .from('businesses')
          .update({
            settings: {
              ...settings,
              lifecycleLog,
            },
          })
          .eq('id', business.id);

        if (updateError) {
          throw updateError;
        }
      }

      captureMessage('Lifecycle run completed for business', {
        context: 'lifecycle-business',
        tags: { route: 'lifecycle', businessId: business.id, runId },
        level: 'info',
      });
    } catch (error) {
      captureException(error, {
        context: 'lifecycle-business',
        tags: { route: 'lifecycle', businessId: business.id, runId },
      });
      results.errors.push(`${business.id}: ${String(error)}`);
    }
  }

  return NextResponse.json({ ...results, runId });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}
