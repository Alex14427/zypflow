type SupabaseLike = {
  from: (table: string) => any;
};

export interface ProofWindowMetrics {
  newLeads: number;
  hotLeads: number;
  staleHotLeads: number;
  dormantLeads: number;
  bookingsCreated: number;
  upcomingAppointments: number;
  reviewRequestsSent: number;
  reviewsCompleted: number;
  followUpsSent: number;
  activeConversations: number;
  averageLeadScore: number | null;
  avgJobValue: number;
}

export interface ClientHealthSnapshot {
  score: number;
  healthStatus: 'healthy' | 'watch' | 'risk';
  churnRisk: 'low' | 'medium' | 'high';
  estimatedRevenue: number;
  strongestWin: string;
  summary: string;
  highlights: string[];
  risks: string[];
  actions: string[];
}

export interface ClientHealthBundle {
  metrics: ProofWindowMetrics;
  health: ClientHealthSnapshot;
}

const DEFAULT_AVG_JOB_VALUE = 150;

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function pluralize(value: number, singular: string, plural = `${singular}s`) {
  return `${value} ${value === 1 ? singular : plural}`;
}

export function buildClientHealthSnapshot(metrics: ProofWindowMetrics): ClientHealthSnapshot {
  const estimatedRevenue = metrics.bookingsCreated * metrics.avgJobValue;

  let score = 45;
  if (metrics.newLeads > 0) score += 8;
  if (metrics.hotLeads > 0) score += 6;
  if (metrics.bookingsCreated > 0) score += 18;
  if (metrics.upcomingAppointments > 0) score += 6;
  if (metrics.reviewRequestsSent > 0) score += 10;
  if (metrics.reviewsCompleted > 0) score += 8;
  if (metrics.followUpsSent > 0) score += 10;
  if (metrics.activeConversations > 0) score += 5;

  score -= Math.min(18, metrics.staleHotLeads * 4);
  score -= Math.min(16, metrics.dormantLeads * 2);

  if (
    metrics.newLeads === 0 &&
    metrics.bookingsCreated === 0 &&
    metrics.reviewRequestsSent === 0 &&
    metrics.followUpsSent === 0
  ) {
    score -= 14;
  }

  if (metrics.hotLeads > 0 && metrics.staleHotLeads >= metrics.hotLeads) {
    score -= 8;
  }

  const normalizedScore = clamp(score, 0, 100);
  const healthStatus =
    normalizedScore >= 75 ? 'healthy' : normalizedScore >= 50 ? 'watch' : 'risk';
  const churnRisk =
    healthStatus === 'healthy' && metrics.staleHotLeads <= 1
      ? 'low'
      : healthStatus === 'risk' || metrics.staleHotLeads >= 3 || metrics.dormantLeads >= 4
        ? 'high'
        : 'medium';

  const highlights: string[] = [];
  if (metrics.bookingsCreated > 0) {
    highlights.push(`${pluralize(metrics.bookingsCreated, 'booking')} created this week.`);
  }
  if (metrics.reviewRequestsSent > 0) {
    highlights.push(`${pluralize(metrics.reviewRequestsSent, 'review request')} sent automatically.`);
  }
  if (metrics.reviewsCompleted > 0) {
    highlights.push(`${pluralize(metrics.reviewsCompleted, 'review')} completed and added to social proof.`);
  }
  if (metrics.followUpsSent > 0) {
    highlights.push(`${pluralize(metrics.followUpsSent, 'follow-up message')} sent without manual chasing.`);
  }
  if (metrics.hotLeads > 0) {
    highlights.push(`${pluralize(metrics.hotLeads, 'hot lead')} currently in play.`);
  }

  const risks: string[] = [];
  if (metrics.staleHotLeads > 0) {
    risks.push(`${pluralize(metrics.staleHotLeads, 'hot lead')} still need a human close.`);
  }
  if (metrics.dormantLeads > 0) {
    risks.push(`${pluralize(metrics.dormantLeads, 'lead')} are drifting without recent contact.`);
  }
  if (metrics.reviewRequestsSent === 0 && metrics.upcomingAppointments > 0) {
    risks.push('The clinic has appointments on the books but no fresh review proof being generated this week.');
  }
  if (metrics.newLeads === 0 && metrics.followUpsSent === 0) {
    risks.push('Demand is quiet right now, so outreach or the audit funnel needs more traffic.');
  }

  const actions: string[] = [];
  if (metrics.staleHotLeads > 0) {
    actions.push('Call the warmest leads today before they cool off.');
  }
  if (metrics.reviewRequestsSent === 0) {
    actions.push('Keep review automation switched on so completed visits turn into visible proof.');
  }
  if (metrics.followUpsSent === 0) {
    actions.push('Make sure the follow-up sequence stays deployed for all new enquiries.');
  }
  if (metrics.newLeads === 0) {
    actions.push('Drive more traffic into the audit funnel and website capture points.');
  }
  if (actions.length === 0) {
    actions.push('Keep traffic flowing and let the automation pack keep compounding proof.');
  }

  let strongestWin = 'The system is set up, but it needs more live activity to create proof this week.';
  if (metrics.bookingsCreated > 0) {
    strongestWin = `${pluralize(metrics.bookingsCreated, 'booking')} landed from the current workflow pack.`;
  } else if (metrics.reviewsCompleted > 0) {
    strongestWin = `${pluralize(metrics.reviewsCompleted, 'review')} completed through the automated follow-up flow.`;
  } else if (metrics.reviewRequestsSent > 0) {
    strongestWin = `${pluralize(metrics.reviewRequestsSent, 'review request')} went out automatically after appointments.`;
  } else if (metrics.followUpsSent > 0) {
    strongestWin = `${pluralize(metrics.followUpsSent, 'follow-up message')} fired automatically to protect demand.`;
  } else if (metrics.hotLeads > 0) {
    strongestWin = `${pluralize(metrics.hotLeads, 'hot lead')} is waiting in the pipeline for a closer touch.`;
  }

  const summary =
    healthStatus === 'healthy'
      ? `Automation is producing visible proof and the clinic is in a good position to keep compounding revenue.`
      : healthStatus === 'watch'
        ? `The core system is working, but a few proof or follow-up gaps need attention before retention feels safe.`
        : `This clinic is at risk of feeling under-served unless proof, follow-up, or lead handling improves quickly.`;

  return {
    score: normalizedScore,
    healthStatus,
    churnRisk,
    estimatedRevenue,
    strongestWin,
    summary,
    highlights: highlights.slice(0, 4),
    risks: risks.slice(0, 3),
    actions: actions.slice(0, 3),
  };
}

export async function fetchClientHealthBundle(
  client: SupabaseLike,
  orgId: string,
  avgJobValue?: number | null
): Promise<ClientHealthBundle> {
  const orgFilter = `org_id.eq.${orgId},business_id.eq.${orgId}`;
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const staleHotLeadThreshold = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);
  const dormantLeadThreshold = new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000);

  const [
    weekLeadsRes,
    weekLeadScoresRes,
    hotLeadsRes,
    staleHotNewRes,
    staleHotContactedRes,
    dormantNewRes,
    dormantContactedRes,
    bookingsRes,
    upcomingAppointmentsRes,
    reviewRequestsRes,
    reviewsCompletedRes,
    followUpsRes,
    activeConversationsRes,
  ] = await Promise.all([
    client.from('leads').select('id', { count: 'exact', head: true }).or(orgFilter).gte('created_at', sevenDaysAgo.toISOString()),
    client.from('leads').select('score').or(orgFilter).gte('created_at', sevenDaysAgo.toISOString()),
    client.from('leads').select('id', { count: 'exact', head: true }).or(orgFilter).gte('score', 70).gte('created_at', sevenDaysAgo.toISOString()),
    client
      .from('leads')
      .select('id', { count: 'exact', head: true })
      .or(orgFilter)
      .gte('score', 70)
      .eq('status', 'new')
      .lte('last_contact_at', staleHotLeadThreshold.toISOString()),
    client
      .from('leads')
      .select('id', { count: 'exact', head: true })
      .or(orgFilter)
      .gte('score', 70)
      .eq('status', 'contacted')
      .lte('last_contact_at', staleHotLeadThreshold.toISOString()),
    client
      .from('leads')
      .select('id', { count: 'exact', head: true })
      .or(orgFilter)
      .eq('status', 'new')
      .lte('last_contact_at', dormantLeadThreshold.toISOString()),
    client
      .from('leads')
      .select('id', { count: 'exact', head: true })
      .or(orgFilter)
      .eq('status', 'contacted')
      .lte('last_contact_at', dormantLeadThreshold.toISOString()),
    client
      .from('appointments')
      .select('id', { count: 'exact', head: true })
      .or(orgFilter)
      .gte('created_at', sevenDaysAgo.toISOString())
      .neq('status', 'cancelled')
      .neq('status', 'no_show'),
    client
      .from('appointments')
      .select('id', { count: 'exact', head: true })
      .or(orgFilter)
      .gte('datetime', now.toISOString())
      .neq('status', 'cancelled')
      .neq('status', 'no_show'),
    client
      .from('reviews')
      .select('id', { count: 'exact', head: true })
      .or(orgFilter)
      .gte('requested_at', sevenDaysAgo.toISOString()),
    client
      .from('reviews')
      .select('id', { count: 'exact', head: true })
      .or(orgFilter)
      .not('completed_at', 'is', null)
      .gte('completed_at', sevenDaysAgo.toISOString()),
    client
      .from('follow_ups')
      .select('id', { count: 'exact', head: true })
      .or(orgFilter)
      .gte('sent_at', sevenDaysAgo.toISOString()),
    client
      .from('conversations')
      .select('id', { count: 'exact', head: true })
      .or(orgFilter)
      .eq('status', 'active'),
  ]);

  const scoreRows = Array.isArray(weekLeadScoresRes.data)
    ? (weekLeadScoresRes.data as Array<{ score?: number | null }>)
    : [];
  const validScores = scoreRows
    .map((row: { score?: number | null }) => row.score)
    .filter((score): score is number => typeof score === 'number');
  const averageLeadScore =
    validScores.length > 0
      ? Math.round(validScores.reduce((sum, score) => sum + score, 0) / validScores.length)
      : null;

  const metrics: ProofWindowMetrics = {
    newLeads: weekLeadsRes.count ?? 0,
    hotLeads: hotLeadsRes.count ?? 0,
    staleHotLeads: (staleHotNewRes.count ?? 0) + (staleHotContactedRes.count ?? 0),
    dormantLeads: (dormantNewRes.count ?? 0) + (dormantContactedRes.count ?? 0),
    bookingsCreated: bookingsRes.count ?? 0,
    upcomingAppointments: upcomingAppointmentsRes.count ?? 0,
    reviewRequestsSent: reviewRequestsRes.count ?? 0,
    reviewsCompleted: reviewsCompletedRes.count ?? 0,
    followUpsSent: followUpsRes.count ?? 0,
    activeConversations: activeConversationsRes.count ?? 0,
    averageLeadScore,
    avgJobValue: avgJobValue && avgJobValue > 0 ? avgJobValue : DEFAULT_AVG_JOB_VALUE,
  };

  return {
    metrics,
    health: buildClientHealthSnapshot(metrics),
  };
}

export function formatHealthStatus(value: ClientHealthSnapshot['healthStatus']) {
  return value === 'healthy' ? 'Healthy' : value === 'watch' ? 'Watch' : 'At risk';
}

export function formatChurnRisk(value: ClientHealthSnapshot['churnRisk']) {
  return value === 'low' ? 'Low churn risk' : value === 'medium' ? 'Medium churn risk' : 'High churn risk';
}
