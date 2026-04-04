export interface DashboardLead {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  status: string;
  score: number;
  source: string | null;
  createdAt: string;
}

export interface DashboardConversation {
  id: string;
  leadName: string;
  leadContact: string;
  channel: string;
  lastMessage: string;
  updatedAt: string;
}

export interface DashboardAppointment {
  id: string;
  service: string;
  datetime: string;
  status: string;
  leadName: string;
}

export interface DashboardReviewsSummary {
  requestsSent: number;
  completed: number;
  averageRating: number | null;
  completionRate: number;
}

export interface DashboardOverviewMetrics {
  totalLeads: number;
  hotLeads: number;
  activeConversations: number;
  upcomingAppointments: number;
  reviewRequests: number;
  completedReviews: number;
}

export interface DashboardAutomationState {
  activeTemplates: number;
  hasLeadReply: boolean;
  hasReminders: boolean;
  hasReviewRequests: boolean;
  hasRebooking: boolean;
  hasWeeklyReporting: boolean;
}

export interface DashboardActivationState {
  status: 'collecting_details' | 'awaiting_payment' | 'ready_to_launch' | 'live' | 'attention';
  billingReady: boolean;
  widgetInstalled: boolean;
  widgetStatus: 'unchecked' | 'confirmed' | 'verified' | 'missing' | 'unreachable';
  packDeployed: boolean;
  autoDeployed: boolean;
  score: number;
  alerts: string[];
  lastSyncedAt: string | null;
}

export interface DashboardLaunchReadiness {
  packName: string;
  score: number;
  status: 'not_ready' | 'almost_ready' | 'launch_ready';
  completedCount: number;
  totalCount: number;
  missingItems: string[];
}

export interface DashboardChecklistItem {
  id: string;
  label: string;
  description: string;
  complete: boolean;
}

export interface DashboardNextAction {
  title: string;
  description: string;
  tone: 'urgent' | 'focus' | 'good';
  href: string;
  ctaLabel: string;
  helper: string;
}

export interface DashboardActivityItem {
  id: string;
  type: 'lead' | 'conversation' | 'appointment' | 'review';
  title: string;
  detail: string;
  timestamp: string;
  href: string;
}

export interface DashboardProofWindow {
  periodLabel: string;
  newLeads: number;
  hotLeads: number;
  bookingsCreated: number;
  upcomingAppointments: number;
  reviewRequestsSent: number;
  reviewsCompleted: number;
  followUpsSent: number;
  estimatedRevenue: number;
  averageLeadScore: number | null;
  strongestWin: string;
}

export interface DashboardRetentionState {
  score: number;
  healthStatus: 'healthy' | 'watch' | 'risk';
  churnRisk: 'low' | 'medium' | 'high';
  summary: string;
  risks: string[];
  actions: string[];
}

export interface DashboardData {
  businessId: string;
  businessName: string;
  businessPlan: string;
  businessIndustry: string | null;
  businessRole: string | null;
  overview: DashboardOverviewMetrics;
  activation: DashboardActivationState;
  automation: DashboardAutomationState;
  launchReadiness: DashboardLaunchReadiness;
  leads: DashboardLead[];
  conversations: DashboardConversation[];
  appointments: DashboardAppointment[];
  reviews: DashboardReviewsSummary;
  proof: DashboardProofWindow;
  retention: DashboardRetentionState;
  checklist: DashboardChecklistItem[];
  nextActions: DashboardNextAction[];
  activityFeed: DashboardActivityItem[];
}
