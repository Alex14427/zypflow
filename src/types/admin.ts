import { SystemDiagnostics } from '@/lib/system-diagnostics';

export interface FounderRecentBusiness {
  id: string;
  name: string;
  email: string | null;
  plan: string;
  industry: string | null;
  created_at: string;
  active: boolean;
  launchReadinessScore: number;
  launchStatus: 'not_ready' | 'almost_ready' | 'launch_ready';
  activeTemplateCount: number;
  activationStatus: 'collecting_details' | 'awaiting_payment' | 'ready_to_launch' | 'live' | 'attention';
  activationAlertCount: number;
  activationLastSyncedAt: string | null;
  proofScore: number;
  healthStatus: 'healthy' | 'watch' | 'risk';
  churnRisk: 'low' | 'medium' | 'high';
  weeklyNewLeads: number;
  weeklyBookings: number;
  weeklyReviewsCompleted: number;
  weeklyEstimatedRevenue: number;
  staleHotLeads: number;
  strongestWin: string;
}

export interface FounderRecentEnquiry {
  id: string;
  name: string;
  email: string;
  business_name: string | null;
  status: string;
  created_at: string;
}

export interface FounderRecentAudit {
  id: string;
  url: string;
  email: string | null;
  score_performance: number | null;
  score_accessibility: number | null;
  score_best_practices: number | null;
  score_seo: number | null;
  overallScore: number | null;
  topLeak: string | null;
  created_at: string;
}

export interface FounderRecentProspect {
  id: string;
  business_name: string;
  name: string | null;
  email: string | null;
  city: string | null;
  industry: string | null;
  status: string | null;
  audit_score: number | null;
  audit_top_leak: string | null;
  outreach_stage: number | null;
  sequence_name: string | null;
  last_contacted_at: string | null;
  next_follow_up_at: string | null;
  created_at: string;
}

export interface FounderOverviewData {
  liveClinics: number;
  trialClinics: number;
  managedClinics: number;
  launchReadyClinics: number;
  clinicsNeedingSetup: number;
  auditsTotal: number;
  audits7d: number;
  websiteEnquiries: number;
  enquiries7d: number;
  prospectsTotal: number;
  prospectsNew: number;
  prospectsReadyForFollowUp: number;
  prospectsRetryRequired: number;
  prospectsReplied: number;
  prospectsSequenceComplete: number;
  activationLiveClinics: number;
  activationReadyToLaunch: number;
  activationNeedsAttention: number;
  widgetPendingClinics: number;
  automationDeployments: number;
  totalLeads: number;
  totalAppointments: number;
  totalReviews: number;
  healthyClinics: number;
  clinicsOnWatch: number;
  clinicsAtRisk: number;
  weeklyBookings: number;
  weeklyReviewsCompleted: number;
  weeklyEstimatedRevenue: number;
  staleHotLeadCount: number;
  monthlyRunRate: number;
  cashCollectedModel: number;
  clinicsNeededForTwoK: number;
  avgAuditScore: number | null;
  system: SystemDiagnostics;
  recentBusinesses: FounderRecentBusiness[];
  recentEnquiries: FounderRecentEnquiry[];
  recentAudits: FounderRecentAudit[];
  recentProspects: FounderRecentProspect[];
}
