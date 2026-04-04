import { readActivationSnapshot } from '@/lib/activation-state';
import { fetchClientHealthBundle } from '@/lib/client-health';
import { supabase } from '@/lib/supabase';
import { resolveCurrentBusiness } from '@/lib/current-business';
import { buildLaunchReadiness } from '@/lib/launch-pack';
import {
  DashboardActivityItem,
  DashboardActivationState,
  DashboardAppointment,
  DashboardAutomationState,
  DashboardChecklistItem,
  DashboardConversation,
  DashboardData,
  DashboardLaunchReadiness,
  DashboardLead,
  DashboardNextAction,
  DashboardOverviewMetrics,
  DashboardReviewsSummary,
} from '@/types/dashboard';

type ConversationMessage = {
  content?: string;
};

function getLastMessage(messages: unknown): string {
  if (!Array.isArray(messages) || messages.length === 0) {
    return 'No messages yet';
  }

  const latest = messages[messages.length - 1] as ConversationMessage | undefined;
  return latest?.content?.trim() || 'No messages yet';
}

function safeLeadName(name: string | null | undefined): string {
  return name?.trim() || 'Unknown contact';
}

function safeLeadContact(email: string | null | undefined, phone: string | null | undefined): string {
  return email?.trim() || phone?.trim() || 'No contact details';
}

function buildAutomationState(templateIds: Set<string>): DashboardAutomationState {
  return {
    activeTemplates: templateIds.size,
    hasLeadReply: templateIds.has('new-lead-follow-up') || templateIds.has('aesthetics-consultation'),
    hasReminders: templateIds.has('appointment-reminders'),
    hasReviewRequests: templateIds.has('review-request'),
    hasRebooking: templateIds.has('aesthetics-rebooking') || templateIds.has('win-back-campaign'),
    hasWeeklyReporting: templateIds.has('weekly-report'),
  };
}

function buildChecklist(input: {
  readinessChecklist: DashboardChecklistItem[];
  totalLeads: number;
}): DashboardChecklistItem[] {
  return [
    ...input.readinessChecklist,
    {
      id: 'proof',
      label: 'First clinic demand coming through',
      description: 'Once leads are flowing, the proof loop starts compounding.',
      complete: input.totalLeads > 0,
    },
  ];
}

function buildNextActions(input: {
  activation: DashboardActivationState;
  overview: DashboardOverviewMetrics;
  automation: DashboardAutomationState;
  launchReadiness: DashboardLaunchReadiness;
  checklist: DashboardChecklistItem[];
  retention: DashboardData['retention'];
}): DashboardNextAction[] {
  const actions: DashboardNextAction[] = [];

  if (!input.activation.billingReady) {
    actions.push({
      title: 'Activate billing before launch',
      description: 'The automation pack will not switch fully live until this workspace is on an active paid plan.',
      tone: 'urgent',
      href: '/dashboard/settings',
      ctaLabel: 'Open billing controls',
      helper: 'Billing is the only blocker that keeps the clinic workspace from going fully live.',
    });
  }

  if (input.launchReadiness.score < 100) {
    actions.push({
      title: `Finish the ${input.launchReadiness.packName}`,
      description: input.launchReadiness.missingItems.length > 0
        ? `Complete these next: ${input.launchReadiness.missingItems.slice(0, 2).join(' and ')}.`
        : 'Complete the missing launch steps before relying on the automation pack.',
      tone: 'urgent',
      href: '/dashboard/templates',
      ctaLabel: 'Open setup checklist',
      helper: `${input.launchReadiness.completedCount}/${input.launchReadiness.totalCount} launch steps are currently complete.`,
    });
  }

  if (input.activation.packDeployed && !input.activation.widgetInstalled) {
    actions.push({
      title: 'Install and verify the widget',
      description: 'The automation pack is ready, but the site still needs the widget live before lead capture can run continuously.',
      tone: 'urgent',
      href: '/onboarding',
      ctaLabel: 'Verify widget install',
      helper: 'Without the widget, the clinic cannot capture live web enquiries or start the proof loop.',
    });
  }

  if (!input.automation.hasLeadReply) {
    actions.push({
      title: 'Deploy the consultation reply flow',
      description: 'This is the fastest way to stop fresh enquiries leaking out before a human replies.',
      tone: 'urgent',
      href: '/dashboard/templates',
      ctaLabel: 'Deploy follow-up flow',
      helper: 'Lead reply automation is the shortest path to better reply speed and more booked consults.',
    });
  }

  if (!input.automation.hasReminders) {
    actions.push({
      title: 'Turn on reminder automation',
      description: 'Reminders are the quickest win for reducing no-shows without adding admin time.',
      tone: 'focus',
      href: '/dashboard/templates',
      ctaLabel: 'Review reminder pack',
      helper: 'Appointment protection usually improves before any deeper funnel changes are even needed.',
    });
  }

  if (input.overview.hotLeads > 0) {
    actions.push({
      title: `Follow up ${input.overview.hotLeads} hot lead${input.overview.hotLeads === 1 ? '' : 's'} today`,
      description: 'The system has identified high-intent enquiries that deserve a personal close.',
      tone: 'urgent',
      href: '/dashboard/leads',
      ctaLabel: 'Open hot leads',
      helper: 'These are the people most likely to book if a human steps in quickly.',
    });
  }

  if (input.retention.churnRisk === 'high') {
    actions.push({
      title: 'Protect the proof loop before clients feel drift',
      description:
        input.retention.risks[0] || 'The clinic is missing proof or human follow-up in places that can hurt retention.',
      tone: 'urgent',
      href: '/dashboard/analytics',
      ctaLabel: 'Open proof analytics',
      helper: 'If the proof layer looks weak, clients start to question the value even when automation is technically live.',
    });
  }

  if (!input.checklist.find((item) => item.id === 'reviews')?.complete) {
    actions.push({
      title: 'Connect your Google review link',
      description: 'Without it, Zypflow cannot turn completed appointments into public proof.',
      tone: 'focus',
      href: '/dashboard/settings',
      ctaLabel: 'Add review link',
      helper: 'Reviews are one of the simplest ways to compound trust and lower future acquisition friction.',
    });
  }

  if (input.overview.totalLeads === 0) {
    actions.push({
      title: 'Drive the first audit and enquiry traffic',
      description: 'Once the first leads arrive, the weekly report and automation loop becomes much more useful.',
      tone: 'focus',
      href: '/dashboard/settings',
      ctaLabel: 'Review setup progress',
      helper: 'The dashboard gets dramatically more useful once there is real inbound activity to analyze.',
    });
  }

  if (actions.length === 0) {
    actions.push({
      title: 'Keep the system live and keep proof compounding',
      description: 'Your core automation pack is on. Focus on traffic, closes, and collecting wins you can reuse in sales.',
      tone: 'good',
      href: '/dashboard/analytics',
      ctaLabel: 'Open weekly proof',
      helper: 'Once the basics are live, the next job is proving value repeatedly and cleanly.',
    });
  }

  return actions.slice(0, 3);
}

function buildActivityFeed(input: {
  leads: DashboardLead[];
  conversations: DashboardConversation[];
  appointments: DashboardAppointment[];
  reviews: Array<{ id: string; rating: number | null; completed_at: string | null; requested_at?: string | null }>;
}): DashboardActivityItem[] {
  const items: DashboardActivityItem[] = [];

  input.leads.slice(0, 4).forEach((lead) => {
    items.push({
      id: `lead-${lead.id}`,
      type: 'lead',
      title: `${safeLeadName(lead.name)} entered the pipeline`,
      detail: `${lead.source || 'widget'} - score ${lead.score} - ${lead.status}`,
      timestamp: lead.createdAt,
      href: '/dashboard/leads',
    });
  });

  input.conversations.slice(0, 3).forEach((conversation) => {
    items.push({
      id: `conversation-${conversation.id}`,
      type: 'conversation',
      title: `${conversation.leadName} replied on ${conversation.channel}`,
      detail: conversation.lastMessage,
      timestamp: conversation.updatedAt,
      href: '/dashboard/conversations',
    });
  });

  input.appointments.slice(0, 3).forEach((appointment) => {
    items.push({
      id: `appointment-${appointment.id}`,
      type: 'appointment',
      title: `${appointment.leadName} has a ${appointment.service}`,
      detail: `${appointment.status.replace('_', ' ')} - ${new Date(appointment.datetime).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}`,
      timestamp: appointment.datetime,
      href: '/dashboard/bookings',
    });
  });

  input.reviews
    .filter((review) => review.completed_at || review.requested_at)
    .slice(0, 3)
    .forEach((review) => {
      const timestamp = review.completed_at || review.requested_at || new Date().toISOString();
      items.push({
        id: `review-${review.id}`,
        type: 'review',
        title: review.completed_at
          ? `A review request completed${review.rating ? ` with ${review.rating}/5` : ''}`
          : 'A review request was sent',
        detail: review.completed_at
          ? 'Reputation proof is compounding through the post-visit workflow.'
          : 'The review automation is nudging recent appointments for public proof.',
        timestamp,
        href: '/dashboard/reviews',
      });
    });

  return items
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 8);
}

export async function fetchDashboardData(): Promise<DashboardData> {
  const { business } = await resolveCurrentBusiness();
  const orgFilter = `org_id.eq.${business.id},business_id.eq.${business.id}`;
  const nowIso = new Date().toISOString();

  const [
    { count: totalLeads },
    { count: hotLeads },
    { count: activeConversations },
    { count: upcomingAppointments },
    { count: totalReviewRequests },
    { count: completedReviews },
    { data: leadsData },
    { data: conversationsData },
    { data: appointmentsData },
    { data: reviewsData },
    { data: deployedTemplatesData },
  ] = await Promise.all([
    supabase.from('leads').select('*', { count: 'exact', head: true }).or(orgFilter),
    supabase.from('leads').select('*', { count: 'exact', head: true }).or(orgFilter).gte('score', 70),
    supabase.from('conversations').select('*', { count: 'exact', head: true }).or(orgFilter).eq('status', 'active'),
    supabase
      .from('appointments')
      .select('*', { count: 'exact', head: true })
      .or(orgFilter)
      .gte('datetime', nowIso)
      .neq('status', 'cancelled')
      .neq('status', 'no_show'),
    supabase.from('reviews').select('*', { count: 'exact', head: true }).or(orgFilter),
    supabase.from('reviews').select('*', { count: 'exact', head: true }).or(orgFilter).not('completed_at', 'is', null),
    supabase
      .from('leads')
      .select('id, name, email, phone, status, score, source, created_at')
      .or(orgFilter)
      .order('created_at', { ascending: false })
      .limit(10),
    supabase
      .from('conversations')
      .select('id, channel, messages, updated_at, leads(name, email, phone)')
      .or(orgFilter)
      .order('updated_at', { ascending: false })
      .limit(6),
    supabase
      .from('appointments')
      .select('id, service, datetime, status, leads(name)')
      .or(orgFilter)
      .order('datetime', { ascending: true })
      .limit(6),
    supabase
      .from('reviews')
      .select('id, rating, completed_at, requested_at')
      .or(orgFilter)
      .order('requested_at', { ascending: false })
      .limit(200),
    supabase
      .from('deployed_templates')
      .select('template_id, is_active')
      .eq('org_id', business.id)
      .eq('is_active', true),
  ]);

  const leads: DashboardLead[] = (leadsData || []).map((lead) => ({
    id: lead.id,
    name: lead.name,
    email: lead.email,
    phone: lead.phone,
    status: lead.status || 'new',
    score: lead.score || 0,
    source: lead.source,
    createdAt: lead.created_at,
  }));

  const conversations: DashboardConversation[] = (conversationsData || []).map((conversation) => {
    const lead = Array.isArray(conversation.leads) ? conversation.leads[0] : conversation.leads;

    return {
      id: conversation.id,
      leadName: safeLeadName(lead?.name),
      leadContact: safeLeadContact(lead?.email, lead?.phone),
      channel: conversation.channel || 'chat',
      lastMessage: getLastMessage(conversation.messages),
      updatedAt: conversation.updated_at,
    };
  });

  const appointments: DashboardAppointment[] = (appointmentsData || []).map((appointment) => {
    const lead = Array.isArray(appointment.leads) ? appointment.leads[0] : appointment.leads;

    return {
      id: appointment.id,
      service: appointment.service || 'General booking',
      datetime: appointment.datetime,
      status: appointment.status || 'pending',
      leadName: safeLeadName(lead?.name),
    };
  });

  const reviewsSummary: DashboardReviewsSummary = (() => {
    const total = totalReviewRequests ?? reviewsData?.length ?? 0;
    const completed = completedReviews ?? (reviewsData || []).filter((review) => review.completed_at).length;
    const ratings = (reviewsData || [])
      .map((review) => review.rating)
      .filter((rating): rating is number => typeof rating === 'number');
    const averageRating = ratings.length > 0 ? ratings.reduce((sum, current) => sum + current, 0) / ratings.length : null;

    return {
      requestsSent: total,
      completed,
      averageRating,
      completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
    };
  })();

  const activeTemplateIds = new Set(
    (deployedTemplatesData || [])
      .filter((template) => template.is_active)
      .map((template) => template.template_id)
  );

  const activation = readActivationSnapshot(business.settings);
  const automation = buildAutomationState(activeTemplateIds);
  const proofBundle = await fetchClientHealthBundle(supabase, business.id, business.avg_job_value);
  const readiness = buildLaunchReadiness({
    industry: business.industry,
    website: business.website,
    bookingUrl: business.booking_url,
    reviewLink: business.google_review_link,
    widgetInstalled: activation.widgetInstalled,
    services: business.services,
    knowledgeBase: business.knowledge_base,
    activeTemplateIds,
  });

  const overview: DashboardOverviewMetrics = {
    totalLeads: totalLeads ?? leads.length,
    hotLeads: hotLeads ?? leads.filter((lead) => lead.score >= 70).length,
    activeConversations: activeConversations ?? conversations.length,
    upcomingAppointments: upcomingAppointments ?? appointments.length,
    reviewRequests: reviewsSummary.requestsSent,
    completedReviews: reviewsSummary.completed,
  };

  const checklist = buildChecklist({
    readinessChecklist: readiness.checklist,
    totalLeads: overview.totalLeads,
  });

  const launchReadiness: DashboardLaunchReadiness = {
    packName: readiness.pack.name,
    score: readiness.score,
    status: readiness.status,
    completedCount: readiness.completedCount,
    totalCount: readiness.totalCount,
    missingItems: readiness.missingItems,
  };

  const proof = {
    periodLabel: 'Last 7 days',
    newLeads: proofBundle.metrics.newLeads,
    hotLeads: proofBundle.metrics.hotLeads,
    bookingsCreated: proofBundle.metrics.bookingsCreated,
    upcomingAppointments: proofBundle.metrics.upcomingAppointments,
    reviewRequestsSent: proofBundle.metrics.reviewRequestsSent,
    reviewsCompleted: proofBundle.metrics.reviewsCompleted,
    followUpsSent: proofBundle.metrics.followUpsSent,
    estimatedRevenue: proofBundle.health.estimatedRevenue,
    averageLeadScore: proofBundle.metrics.averageLeadScore,
    strongestWin: proofBundle.health.strongestWin,
  };

  const retention = {
    score: proofBundle.health.score,
    healthStatus: proofBundle.health.healthStatus,
    churnRisk: proofBundle.health.churnRisk,
    summary: proofBundle.health.summary,
    risks: proofBundle.health.risks,
    actions: proofBundle.health.actions,
  };

  const nextActions = buildNextActions({ activation, overview, automation, launchReadiness, checklist, retention });
  const activityFeed = buildActivityFeed({
    leads,
    conversations,
    appointments,
    reviews: (reviewsData || []).map((review) => ({
      id: review.id,
      rating: review.rating,
      completed_at: review.completed_at,
      requested_at: review.requested_at,
    })),
  });

  return {
    businessId: business.id,
    businessName: business.name || 'Your clinic',
    businessPlan: business.plan || 'trial',
    businessIndustry: business.industry,
    businessRole: business.role || null,
    overview,
    activation,
    automation,
    launchReadiness,
    leads,
    conversations,
    appointments,
    reviews: reviewsSummary,
    proof,
    retention,
    checklist,
    nextActions,
    activityFeed,
  };
}
