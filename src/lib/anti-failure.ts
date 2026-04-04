import { FounderOverviewData } from '@/types/admin';
import { formatCurrencyGBP } from '@/lib/formatting';

export interface AntiFailureCheck {
  id: string;
  title: string;
  risk: string;
  status: 'healthy' | 'watch' | 'risk';
  summary: string;
  action: string;
}

export function buildAntiFailureChecks(metrics: FounderOverviewData): AntiFailureCheck[] {
  const replyRate = metrics.prospectsTotal > 0 ? metrics.prospectsReplied / metrics.prospectsTotal : 0;
  const activeOutreachQueue = metrics.prospectsReadyForFollowUp + metrics.prospectsRetryRequired;

  return [
    {
      id: 'market-need',
      title: 'No Market Need',
      risk: 'The wedge dies if clinics do not engage with the audit or offer.',
      status:
        metrics.managedClinics > 0 || (metrics.auditsTotal >= 3 && metrics.websiteEnquiries >= 1)
          ? 'healthy'
          : metrics.auditsTotal > 0 || metrics.websiteEnquiries > 0
            ? 'watch'
            : 'risk',
      summary:
        metrics.managedClinics > 0
          ? 'Clinics are already paying or showing clear pull.'
          : `${metrics.auditsTotal} audits and ${metrics.websiteEnquiries} website enquiries recorded so far.`,
      action: 'Keep the audit wedge live and keep testing the promise until replies and closes are consistent.',
    },
    {
      id: 'distribution',
      title: 'Acquisition Engine',
      risk: 'A weak pipeline makes the product irrelevant no matter how polished it is.',
      status:
        metrics.prospectsReplied > 0
          ? 'healthy'
          : activeOutreachQueue > 0 || metrics.prospectsTotal > 0 || metrics.websiteEnquiries > 0
            ? 'watch'
            : 'risk',
      summary:
        metrics.prospectsTotal > 0
          ? `${metrics.prospectsTotal} prospects scraped, ${activeOutreachQueue} in the active queue, ${metrics.prospectsReplied} replies so far.`
          : 'The outbound engine is not feeding the funnel yet.',
      action: 'Keep scraping, sending, and following up automatically until booked calls become routine.',
    },
    {
      id: 'cash',
      title: 'Ran Out Of Cash',
      risk: 'The launch fails if we delay revenue or underprice the first clinics.',
      status:
        metrics.clinicsNeededForTwoK === 0
          ? 'healthy'
          : metrics.managedClinics > 0
            ? 'watch'
            : 'risk',
      summary:
        metrics.clinicsNeededForTwoK === 0
          ? `Launch-month cash target covered at ${formatCurrencyGBP(metrics.cashCollectedModel)}.`
          : `${metrics.clinicsNeededForTwoK} more clinic${metrics.clinicsNeededForTwoK === 1 ? '' : 's'} needed to cover the £2k model.`,
      action: 'Keep the founding offer tight, collect setup fees upfront, and protect time from custom work.',
    },
    {
      id: 'trust',
      title: 'Product / Trust Failure',
      risk: 'Broken or half-configured workspaces will kill retention and referrals.',
      status:
        metrics.launchReadyClinics > 0
          ? 'healthy'
          : metrics.liveClinics > 0 || metrics.automationDeployments > 0
            ? 'watch'
            : 'risk',
      summary:
        metrics.launchReadyClinics > 0
          ? `${metrics.launchReadyClinics} clinic workspace${metrics.launchReadyClinics === 1 ? '' : 's'} are launch-ready.`
          : 'The automation pack still needs more setup discipline before it can be trusted.',
      action: 'Only switch clinics live once booking, reviews, services, FAQs, and the core workflow are all in place.',
    },
    {
      id: 'unit-economics',
      title: 'Unit Economics Drift',
      risk: 'Cheap pricing, low automation coverage, or too much manual work will crush margin.',
      status:
        metrics.managedClinics > 0 && metrics.automationDeployments >= metrics.managedClinics
          ? 'healthy'
          : metrics.automationDeployments > 0 || metrics.managedClinics > 0
            ? 'watch'
            : 'risk',
      summary:
        metrics.automationDeployments > 0
          ? `${metrics.automationDeployments} active template deployment${metrics.automationDeployments === 1 ? '' : 's'} supporting ${metrics.managedClinics} managed clinic${metrics.managedClinics === 1 ? '' : 's'}.`
          : 'Automation coverage is still too thin to trust the margin story.',
      action: 'Push every clinic onto the same pack, cap usage, and treat manual work as a problem to remove.',
    },
    {
      id: 'founder-overload',
      title: 'Founder Overload',
      risk: 'The business breaks if the operator becomes the bottleneck.',
      status:
        metrics.managedClinics > 0 && metrics.clinicsNeedingSetup === 0
          ? 'healthy'
          : metrics.prospectsReplied > 0 || metrics.managedClinics > 0
            ? 'watch'
            : 'risk',
      summary:
        metrics.clinicsNeedingSetup === 0
          ? 'Current live workspaces are standardized enough to stay owner-light.'
          : `${metrics.clinicsNeedingSetup} clinic workspace${metrics.clinicsNeedingSetup === 1 ? '' : 's'} still depend on setup work.`,
      action: 'Keep sales manual for now, but automate onboarding, deployment, reporting, and exception handling.',
    },
    {
      id: 'compliance',
      title: 'Compliance / Policy Risk',
      risk: 'Messaging, reviews, and billing trust must stay ahead of growth.',
      status: metrics.prospectsRetryRequired === 0 ? 'healthy' : 'watch',
      summary:
        metrics.prospectsRetryRequired === 0
          ? 'Core auth, consent, unsubscribe, and webhook safeguards are now in place for launch.'
          : `${metrics.prospectsRetryRequired} prospect${metrics.prospectsRetryRequired === 1 ? '' : 's'} are in retry_required and should be reviewed before scale.`,
      action: 'Keep unsubscribes, consent rules, and delivery failures visible in the founder portal as outreach volume grows.',
    },
    {
      id: 'positioning',
      title: 'Competition / Bland Positioning',
      risk: 'Generic "AI clinic software" will disappear into the noise.',
      status: metrics.auditsTotal > 0 || replyRate > 0 ? 'watch' : 'risk',
      summary:
        'The best defense is a sharp wedge: revenue leaks, consult conversion, no-show reduction, and repeat bookings.',
      action: 'Keep the public story narrow and outcome-led. The Revenue Leak Audit should stay the front door.',
    },
  ];
}
