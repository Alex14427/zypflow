import { NextRequest, NextResponse } from 'next/server';
import { verifyDashboardUser } from '@/lib/auth-cookie';
import { isAdminEmail } from '@/lib/admin-users';
import { readActivationSnapshot } from '@/lib/activation-state';
import { fetchClientHealthBundle } from '@/lib/client-health';
import { buildLaunchReadiness } from '@/lib/launch-pack';
import { collectSystemDiagnostics } from '@/lib/system-diagnostics';
import { supabaseAdmin } from '@/lib/supabase';
import { FounderOverviewData } from '@/types/admin';

const FOUNDING_PILOT_PRICE = 995;
const FOUNDING_SETUP_FEE = 495;
const OUTREACH_READY_STATUSES = ['new', 'retry_required', 'outreach_sent', 'follow_up_scheduled', 'opened', 'clicked'];

function averageAuditScore(
  audits: Array<{
    score_performance: number | null;
    score_accessibility: number | null;
    score_best_practices: number | null;
    score_seo: number | null;
  }>
) {
  const scores = audits
    .map((audit) =>
      [audit.score_performance, audit.score_accessibility, audit.score_best_practices, audit.score_seo].filter(
        (score): score is number => typeof score === 'number'
      )
    )
    .filter((scoreSet) => scoreSet.length > 0)
    .map((scoreSet) => scoreSet.reduce((sum, score) => sum + score, 0) / scoreSet.length);

  if (scores.length === 0) return null;
  return Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length);
}

export async function GET(req: NextRequest) {
  const authResult = await verifyDashboardUser(req);
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  if (!isAdminEmail(authResult.user.email)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const now = new Date();
  const sevenDaysAgo = new Date(now);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const sevenDaysAgoIso = sevenDaysAgo.toISOString();

  try {
    const [
      { count: liveClinics },
      { count: trialClinics },
      { count: managedClinics },
      { count: auditsTotal },
      { count: audits7d },
      { count: websiteEnquiries },
      { count: enquiries7d },
      { count: prospectsTotal },
      { count: prospectsNew },
      { count: prospectsReadyForFollowUp },
      { count: prospectsRetryRequired },
      { count: prospectsReplied },
      { count: prospectsSequenceComplete },
      { count: automationDeployments },
      { count: totalLeads },
      { count: totalAppointments },
      { count: totalReviews },
      { data: readinessBusinesses },
      { data: readinessDeployments },
      { data: recentBusinesses },
      { data: recentEnquiries },
      { data: recentAudits },
      { data: recentProspects },
    ] = await Promise.all([
      supabaseAdmin.from('businesses').select('*', { count: 'exact', head: true }).eq('active', true),
      supabaseAdmin
        .from('businesses')
        .select('*', { count: 'exact', head: true })
        .eq('active', true)
        .eq('plan', 'trial'),
      supabaseAdmin
        .from('businesses')
        .select('*', { count: 'exact', head: true })
        .eq('active', true)
        .neq('plan', 'trial')
        .neq('plan', 'cancelled'),
      supabaseAdmin.from('audits').select('*', { count: 'exact', head: true }),
      supabaseAdmin.from('audits').select('*', { count: 'exact', head: true }).gte('created_at', sevenDaysAgoIso),
      supabaseAdmin.from('website_enquiries').select('*', { count: 'exact', head: true }),
      supabaseAdmin
        .from('website_enquiries')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', sevenDaysAgoIso),
      supabaseAdmin.from('prospects').select('*', { count: 'exact', head: true }),
      supabaseAdmin.from('prospects').select('*', { count: 'exact', head: true }).eq('status', 'new'),
      supabaseAdmin
        .from('prospects')
        .select('*', { count: 'exact', head: true })
        .not('email', 'is', null)
        .in('status', OUTREACH_READY_STATUSES)
        .or(`next_follow_up_at.is.null,next_follow_up_at.lte.${now.toISOString()}`),
      supabaseAdmin.from('prospects').select('*', { count: 'exact', head: true }).eq('status', 'retry_required'),
      supabaseAdmin.from('prospects').select('*', { count: 'exact', head: true }).eq('status', 'replied'),
      supabaseAdmin.from('prospects').select('*', { count: 'exact', head: true }).eq('status', 'sequence_complete'),
      supabaseAdmin
        .from('deployed_templates')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true),
      supabaseAdmin.from('leads').select('*', { count: 'exact', head: true }),
      supabaseAdmin.from('appointments').select('*', { count: 'exact', head: true }),
      supabaseAdmin.from('reviews').select('*', { count: 'exact', head: true }),
      supabaseAdmin
        .from('businesses')
        .select('id, name, industry, website, booking_url, google_review_link, services, knowledge_base, settings, avg_job_value')
        .eq('active', true),
      supabaseAdmin
        .from('deployed_templates')
        .select('org_id, template_id')
        .eq('is_active', true),
      supabaseAdmin
        .from('businesses')
        .select('id, name, email, plan, industry, created_at, active, website, booking_url, google_review_link, services, knowledge_base, settings')
        .order('created_at', { ascending: false })
        .limit(8),
      supabaseAdmin
        .from('website_enquiries')
        .select('id, name, email, business_name, status, created_at')
        .order('created_at', { ascending: false })
        .limit(8),
      supabaseAdmin
        .from('audits')
        .select(
          'id, url, email, score_performance, score_accessibility, score_best_practices, score_seo, created_at, raw_results'
        )
        .order('created_at', { ascending: false })
        .limit(8),
      supabaseAdmin
        .from('prospects')
        .select(
          'id, business_name, name, email, city, industry, status, audit_score, audit_top_leak, outreach_stage, sequence_name, last_contacted_at, next_follow_up_at, created_at'
        )
        .order('last_contacted_at', { ascending: false, nullsFirst: false })
        .order('created_at', { ascending: false })
        .limit(10),
    ]);

    const activeManagedClinics = managedClinics ?? 0;
    const deploymentMap = new Map<string, string[]>();

    (readinessDeployments || []).forEach((deployment) => {
      const current = deploymentMap.get(deployment.org_id) || [];
      current.push(deployment.template_id);
      deploymentMap.set(deployment.org_id, current);
    });

    const readinessByBusiness = new Map<string, ReturnType<typeof buildLaunchReadiness>>();
    (readinessBusinesses || []).forEach((business) => {
      readinessByBusiness.set(
        business.id,
        buildLaunchReadiness({
          industry: business.industry,
          website: business.website,
          bookingUrl: business.booking_url,
          reviewLink: business.google_review_link,
          widgetInstalled: readActivationSnapshot(business.settings as Record<string, unknown> | null).widgetInstalled,
          services: business.services,
          knowledgeBase: business.knowledge_base,
          activeTemplateIds: deploymentMap.get(business.id) || [],
        })
      );
    });

    const launchReadyClinics = Array.from(readinessByBusiness.values()).filter(
      (item) => item.status === 'launch_ready'
    ).length;
    const activationSnapshots = (readinessBusinesses || []).map((business) =>
      readActivationSnapshot(business.settings as Record<string, unknown> | null)
    );
    const healthEntries = await Promise.all(
      (readinessBusinesses || []).map(async (business) => {
        const bundle = await fetchClientHealthBundle(supabaseAdmin, business.id, business.avg_job_value);
        return [business.id, bundle] as const;
      })
    );
    const healthByBusiness = new Map(healthEntries);
    const healthSnapshots = healthEntries.map(([, bundle]) => bundle.health);
    const metricSnapshots = healthEntries.map(([, bundle]) => bundle.metrics);
    const activationLiveClinics = activationSnapshots.filter((item) => item.status === 'live').length;
    const activationReadyToLaunch = activationSnapshots.filter((item) => item.status === 'ready_to_launch').length;
    const activationNeedsAttention = activationSnapshots.filter((item) => item.status === 'attention').length;
    const widgetPendingClinics = activationSnapshots.filter(
      (item) => item.packDeployed && !item.widgetInstalled
    ).length;
    const healthyClinics = healthSnapshots.filter((item) => item.healthStatus === 'healthy').length;
    const clinicsOnWatch = healthSnapshots.filter((item) => item.healthStatus === 'watch').length;
    const clinicsAtRisk = healthSnapshots.filter((item) => item.healthStatus === 'risk').length;
    const weeklyBookings = metricSnapshots.reduce((sum, metrics) => sum + metrics.bookingsCreated, 0);
    const weeklyReviewsCompleted = metricSnapshots.reduce((sum, metrics) => sum + metrics.reviewsCompleted, 0);
    const weeklyEstimatedRevenue = healthSnapshots.reduce((sum, health) => sum + health.estimatedRevenue, 0);
    const staleHotLeadCount = metricSnapshots.reduce((sum, metrics) => sum + metrics.staleHotLeads, 0);

    const payload: FounderOverviewData = {
      liveClinics: liveClinics ?? 0,
      trialClinics: trialClinics ?? 0,
      managedClinics: activeManagedClinics,
      launchReadyClinics,
      clinicsNeedingSetup: Math.max(0, (liveClinics ?? 0) - launchReadyClinics),
      auditsTotal: auditsTotal ?? 0,
      audits7d: audits7d ?? 0,
      websiteEnquiries: websiteEnquiries ?? 0,
      enquiries7d: enquiries7d ?? 0,
      prospectsTotal: prospectsTotal ?? 0,
      prospectsNew: prospectsNew ?? 0,
      prospectsReadyForFollowUp: prospectsReadyForFollowUp ?? 0,
      prospectsRetryRequired: prospectsRetryRequired ?? 0,
      prospectsReplied: prospectsReplied ?? 0,
      prospectsSequenceComplete: prospectsSequenceComplete ?? 0,
      activationLiveClinics,
      activationReadyToLaunch,
      activationNeedsAttention,
      widgetPendingClinics,
      automationDeployments: automationDeployments ?? 0,
      totalLeads: totalLeads ?? 0,
      totalAppointments: totalAppointments ?? 0,
      totalReviews: totalReviews ?? 0,
      healthyClinics,
      clinicsOnWatch,
      clinicsAtRisk,
      weeklyBookings,
      weeklyReviewsCompleted,
      weeklyEstimatedRevenue,
      staleHotLeadCount,
      monthlyRunRate: activeManagedClinics * FOUNDING_PILOT_PRICE,
      cashCollectedModel: activeManagedClinics * (FOUNDING_PILOT_PRICE + FOUNDING_SETUP_FEE),
      clinicsNeededForTwoK: Math.max(0, 2 - activeManagedClinics),
      avgAuditScore: averageAuditScore(recentAudits || []),
      system: await collectSystemDiagnostics(),
      recentBusinesses: (recentBusinesses || []).map((business) => {
        const readiness = readinessByBusiness.get(business.id);
        const activation = readActivationSnapshot(business.settings as Record<string, unknown> | null);
        const healthBundle = healthByBusiness.get(business.id);

        return {
          ...business,
          launchReadinessScore: readiness?.score ?? 0,
          launchStatus: readiness?.status ?? 'not_ready',
          activeTemplateCount: deploymentMap.get(business.id)?.length ?? 0,
          activationStatus: activation.status,
          activationAlertCount: activation.alerts.length,
          activationLastSyncedAt: activation.lastSyncedAt,
          proofScore: healthBundle?.health.score ?? 0,
          healthStatus: healthBundle?.health.healthStatus ?? 'risk',
          churnRisk: healthBundle?.health.churnRisk ?? 'high',
          weeklyNewLeads: healthBundle?.metrics.newLeads ?? 0,
          weeklyBookings: healthBundle?.metrics.bookingsCreated ?? 0,
          weeklyReviewsCompleted: healthBundle?.metrics.reviewsCompleted ?? 0,
          weeklyEstimatedRevenue: healthBundle?.health.estimatedRevenue ?? 0,
          staleHotLeads: healthBundle?.metrics.staleHotLeads ?? 0,
          strongestWin: healthBundle?.health.strongestWin ?? 'No proof captured yet.',
        };
      }),
      recentEnquiries: recentEnquiries || [],
      recentAudits: (recentAudits || []).map((audit) => {
        const rawResults = audit.raw_results as
          | {
              overallScore?: number;
              summary?: { topLeak?: string | null };
              leaks?: Array<{ headline?: string }>;
            }
          | null;

        const derivedScore =
          typeof rawResults?.overallScore === 'number'
            ? Math.round(rawResults.overallScore)
            : averageAuditScore([audit]);

        return {
          id: audit.id,
          url: audit.url,
          email: audit.email,
          score_performance: audit.score_performance,
          score_accessibility: audit.score_accessibility,
          score_best_practices: audit.score_best_practices,
          score_seo: audit.score_seo,
          overallScore: derivedScore,
          topLeak:
            rawResults?.summary?.topLeak ??
            rawResults?.leaks?.[0]?.headline ??
            null,
          created_at: audit.created_at,
        };
      }),
      recentProspects: (recentProspects || []).map((prospect) => ({
        id: prospect.id,
        business_name: prospect.business_name || prospect.name || 'Unnamed clinic',
        name: prospect.name,
        email: prospect.email,
        city: prospect.city,
        industry: prospect.industry,
        status: prospect.status,
        audit_score: prospect.audit_score,
        audit_top_leak: prospect.audit_top_leak,
        outreach_stage: prospect.outreach_stage,
        sequence_name: prospect.sequence_name,
        last_contacted_at: prospect.last_contacted_at,
        next_follow_up_at: prospect.next_follow_up_at,
        created_at: prospect.created_at,
      })),
    };

    return NextResponse.json(payload);
  } catch (error) {
    console.error('Failed to build founder overview:', error);
    return NextResponse.json({ error: 'Unable to load founder overview.' }, { status: 500 });
  }
}
