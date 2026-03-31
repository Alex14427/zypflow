import { supabase } from '@/lib/supabase';
import {
  DashboardAppointment,
  DashboardConversation,
  DashboardData,
  DashboardLead,
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

export async function fetchDashboardData(): Promise<DashboardData> {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user?.email) {
    throw new Error('Unable to authenticate user for dashboard.');
  }

  const { data: organisation, error: organisationError } = await supabase
    .from('organisations')
    .select('id, name')
    .eq('email', user.email)
    .maybeSingle();

  if (organisationError || !organisation) {
    throw new Error('Unable to load organisation for dashboard.');
  }

  const [{ data: leadsData }, { data: conversationsData }, { data: appointmentsData }, { data: reviewsData }] =
    await Promise.all([
      supabase
        .from('leads')
        .select('id, name, email, phone, status, score, source, created_at')
        .eq('org_id', organisation.id)
        .order('created_at', { ascending: false })
        .limit(10),
      supabase
        .from('conversations')
        .select('id, channel, messages, updated_at, leads(name, email, phone)')
        .eq('org_id', organisation.id)
        .order('updated_at', { ascending: false })
        .limit(6),
      supabase
        .from('appointments')
        .select('id, service, datetime, status, leads(name)')
        .eq('org_id', organisation.id)
        .order('datetime', { ascending: true })
        .limit(6),
      supabase
        .from('reviews')
        .select('id, rating, completed_at')
        .eq('org_id', organisation.id)
        .order('requested_at', { ascending: false })
        .limit(200),
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
    const total = reviewsData?.length || 0;
    const completed = (reviewsData || []).filter((review) => review.completed_at).length;
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

  return {
    businessName: organisation.name || 'Your business',
    leads,
    conversations,
    appointments,
    reviews: reviewsSummary,
  };
}
