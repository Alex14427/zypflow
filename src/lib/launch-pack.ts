export interface LaunchPackDefinition {
  id: string;
  name: string;
  description: string;
  industry: string;
  templateIds: string[];
  promise: string;
}

export interface LaunchReadinessItem {
  id: string;
  label: string;
  description: string;
  complete: boolean;
}

export interface LaunchReadinessResult {
  pack: LaunchPackDefinition;
  score: number;
  status: 'not_ready' | 'almost_ready' | 'launch_ready';
  completedCount: number;
  totalCount: number;
  checklist: LaunchReadinessItem[];
  missingItems: string[];
}

export interface LaunchReadinessInput {
  industry?: string | null;
  website?: string | null;
  bookingUrl?: string | null;
  reviewLink?: string | null;
  widgetInstalled?: boolean | null;
  services?: unknown[] | null;
  knowledgeBase?: unknown[] | null;
  activeTemplateIds?: Iterable<string>;
}

export const CORE_CLINIC_LAUNCH_PACK: LaunchPackDefinition = {
  id: 'core-clinic-launch-pack',
    name: 'Core Clinic Workflow',
  description: 'Lead follow-up, reminders, reviews, reactivation, and weekly reporting for clinics that need the revenue basics first.',
  industry: 'general',
  templateIds: ['new-lead-follow-up', 'appointment-reminders', 'review-request', 'win-back-campaign', 'weekly-report'],
  promise: 'Capture more enquiries, reduce no-shows, and keep patients coming back.',
};

export const AESTHETICS_LAUNCH_PACK: LaunchPackDefinition = {
  id: 'aesthetics-launch-pack',
    name: 'Aesthetics Workflow',
  description: 'Consultation booking, appointment protection, review capture, top-up reminders, and weekly revenue reporting for aesthetics clinics.',
  industry: 'aesthetics',
  templateIds: ['aesthetics-consultation', 'appointment-reminders', 'review-request', 'aesthetics-rebooking', 'weekly-report'],
  promise: 'Convert every treatment enquiry into a booked consult, then keep top-up demand on autopilot.',
};

const LAUNCH_PACKS = [CORE_CLINIC_LAUNCH_PACK, AESTHETICS_LAUNCH_PACK] as const;

export function normalizeIndustryKey(industry?: string | null) {
  return industry?.trim().toLowerCase().replace(/\s+/g, '_') ?? 'general';
}

export function getLaunchPackById(packId: string) {
  return LAUNCH_PACKS.find((pack) => pack.id === packId) ?? null;
}

export function getRecommendedLaunchPack(industry?: string | null) {
  return normalizeIndustryKey(industry) === 'aesthetics' ? AESTHETICS_LAUNCH_PACK : CORE_CLINIC_LAUNCH_PACK;
}

function normalizeList(value: unknown) {
  return Array.isArray(value) ? value.filter(Boolean) : [];
}

function hasPackFullyDeployed(activeTemplateIds: Set<string>, pack: LaunchPackDefinition) {
  return pack.templateIds.every((templateId) => activeTemplateIds.has(templateId));
}

export function buildLaunchReadiness(input: LaunchReadinessInput): LaunchReadinessResult {
  const pack = getRecommendedLaunchPack(input.industry);
  const activeTemplateIds = new Set(input.activeTemplateIds ?? []);
  const services = normalizeList(input.services);
  const knowledgeBase = normalizeList(input.knowledgeBase);

  const checklist: LaunchReadinessItem[] = [
    {
      id: 'website',
      label: 'Clinic website connected',
      description: 'Needed for the audit funnel, branded widget, and higher-converting replies.',
      complete: Boolean(input.website),
    },
    {
      id: 'booking',
      label: 'Booking flow connected',
      description: 'Every automation should be able to push patients straight into a consultation slot.',
      complete: Boolean(input.bookingUrl),
    },
    {
      id: 'reviews',
      label: 'Review destination connected',
      description: 'Required before post-appointment proof requests can go live safely.',
      complete: Boolean(input.reviewLink),
    },
    {
      id: 'widget',
      label: 'Widget installed',
      description: 'The branded chat widget needs to be live on the clinic site before lead capture can run continuously.',
      complete: Boolean(input.widgetInstalled),
    },
    {
      id: 'services',
      label: 'Treatments loaded',
      description: 'The AI needs your real service list to qualify and route enquiries accurately.',
      complete: services.length > 0,
    },
    {
      id: 'knowledge',
      label: 'FAQs and clinic notes loaded',
      description: 'Common questions, policies, and treatment guidance make the assistant trustworthy.',
      complete: knowledgeBase.length > 0,
    },
    {
      id: 'pack',
      label: `${pack.name} deployed`,
      description: pack.promise,
      complete: hasPackFullyDeployed(activeTemplateIds, pack),
    },
  ];

  const completedCount = checklist.filter((item) => item.complete).length;
  const totalCount = checklist.length;
  const score = Math.round((completedCount / totalCount) * 100);
  const status = score === 100 ? 'launch_ready' : score >= 50 ? 'almost_ready' : 'not_ready';

  return {
    pack,
    score,
    status,
    completedCount,
    totalCount,
    checklist,
    missingItems: checklist.filter((item) => !item.complete).map((item) => item.label),
  };
}
