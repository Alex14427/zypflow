'use client';

import { useState, useMemo } from 'react';

interface Template {
  id: string;
  name: string;
  industry: string;
  description: string;
  trigger_type: string;
  featured: boolean;
  setup_minutes: number;
  minutes_saved_per_run: number;
}

const TEMPLATES: Template[] = [
  // General
  {
    id: 'new-lead-follow-up',
    name: 'New Lead Auto Follow-Up',
    industry: 'general',
    description: 'Automatically send a personalised follow-up email when a new lead comes in via the chat widget. Includes a booking link and service summary.',
    trigger_type: 'new_lead',
    featured: true,
    setup_minutes: 5,
    minutes_saved_per_run: 15,
  },
  {
    id: 'appointment-reminders',
    name: 'Appointment Reminder Sequence',
    industry: 'general',
    description: 'Send SMS and email reminders at 48h, 24h, and 2h before appointments. Reduces no-shows by up to 40%.',
    trigger_type: 'appointment_created',
    featured: true,
    setup_minutes: 5,
    minutes_saved_per_run: 10,
  },
  {
    id: 'review-request',
    name: 'Post-Appointment Review Request',
    industry: 'general',
    description: 'Automatically ask happy customers for a Google review 2 hours after their appointment. Includes direct link to your Google review page.',
    trigger_type: 'appointment_completed',
    featured: true,
    setup_minutes: 3,
    minutes_saved_per_run: 8,
  },
  {
    id: 'lead-scoring-alert',
    name: 'Hot Lead Alert',
    industry: 'general',
    description: 'Get an instant SMS or email notification when a lead scores 70+ so you can follow up personally while they\'re still interested.',
    trigger_type: 'lead_score_update',
    featured: false,
    setup_minutes: 3,
    minutes_saved_per_run: 5,
  },
  {
    id: 'win-back-campaign',
    name: 'Win-Back Campaign',
    industry: 'general',
    description: 'Re-engage leads who haven\'t responded in 14 days with a personalised offer or check-in message.',
    trigger_type: 'lead_inactive',
    featured: false,
    setup_minutes: 10,
    minutes_saved_per_run: 20,
  },
  {
    id: 'weekly-report',
    name: 'Weekly Performance Report',
    industry: 'general',
    description: 'Receive a weekly email summary of new leads, bookings, conversations, and revenue — delivered every Monday morning.',
    trigger_type: 'scheduled',
    featured: false,
    setup_minutes: 5,
    minutes_saved_per_run: 15,
  },
  // Dental
  {
    id: 'dental-new-patient',
    name: 'New Patient Welcome',
    industry: 'dental',
    description: 'Welcome new dental patients with registration forms, practice info, and pre-appointment instructions. Includes parking and what to bring.',
    trigger_type: 'new_lead',
    featured: true,
    setup_minutes: 10,
    minutes_saved_per_run: 20,
  },
  {
    id: 'dental-recall',
    name: '6-Month Check-Up Recall',
    industry: 'dental',
    description: 'Automatically remind patients when their 6-month check-up is due. Sends SMS with a direct booking link.',
    trigger_type: 'scheduled',
    featured: false,
    setup_minutes: 5,
    minutes_saved_per_run: 10,
  },
  {
    id: 'dental-treatment-follow-up',
    name: 'Post-Treatment Care',
    industry: 'dental',
    description: 'Send aftercare instructions via SMS after procedures like extractions, fillings, or whitening. Reduces post-op call volume.',
    trigger_type: 'appointment_completed',
    featured: false,
    setup_minutes: 8,
    minutes_saved_per_run: 12,
  },
  // Aesthetics
  {
    id: 'aesthetics-consultation',
    name: 'Consultation Booking Flow',
    industry: 'aesthetics',
    description: 'When a lead enquires about treatments, send a personalised consultation booking link with treatment info and pricing.',
    trigger_type: 'new_lead',
    featured: true,
    setup_minutes: 8,
    minutes_saved_per_run: 15,
  },
  {
    id: 'aesthetics-aftercare',
    name: 'Treatment Aftercare Sequence',
    industry: 'aesthetics',
    description: 'Send tailored aftercare instructions for Botox, fillers, skin treatments etc. Includes do\'s, don\'ts, and when to expect results.',
    trigger_type: 'appointment_completed',
    featured: false,
    setup_minutes: 10,
    minutes_saved_per_run: 12,
  },
  {
    id: 'aesthetics-rebooking',
    name: 'Treatment Top-Up Reminder',
    industry: 'aesthetics',
    description: 'Remind clients when their treatment results will start to fade (e.g. Botox at 3 months, filler at 9 months) with a rebooking link.',
    trigger_type: 'scheduled',
    featured: false,
    setup_minutes: 8,
    minutes_saved_per_run: 10,
  },
  // Legal
  {
    id: 'legal-intake',
    name: 'Client Intake Automation',
    industry: 'legal',
    description: 'Collect case details, send engagement letters, and schedule initial consultations automatically when new enquiries come in.',
    trigger_type: 'new_lead',
    featured: true,
    setup_minutes: 15,
    minutes_saved_per_run: 30,
  },
  {
    id: 'legal-case-update',
    name: 'Case Progress Update',
    industry: 'legal',
    description: 'Send automated case status updates to clients at key milestones. Reduces "where\'s my case?" phone calls.',
    trigger_type: 'manual',
    featured: false,
    setup_minutes: 10,
    minutes_saved_per_run: 15,
  },
  // Home Services
  {
    id: 'home-quote-follow-up',
    name: 'Quote Follow-Up',
    industry: 'home_services',
    description: 'Automatically follow up with customers 24h and 72h after sending a quote. Includes a direct booking link to lock in the job.',
    trigger_type: 'manual',
    featured: true,
    setup_minutes: 5,
    minutes_saved_per_run: 15,
  },
  {
    id: 'home-seasonal-reminder',
    name: 'Seasonal Service Reminder',
    industry: 'home_services',
    description: 'Remind past customers about seasonal services — boiler checks in autumn, gutter cleaning in spring, garden maintenance in summer.',
    trigger_type: 'scheduled',
    featured: false,
    setup_minutes: 10,
    minutes_saved_per_run: 20,
  },
  // Physiotherapy
  {
    id: 'physio-exercise-plan',
    name: 'Exercise Plan Delivery',
    industry: 'physiotherapy',
    description: 'Send personalised exercise plans and recovery instructions after each physio session. Includes video links and progress tracking.',
    trigger_type: 'appointment_completed',
    featured: true,
    setup_minutes: 10,
    minutes_saved_per_run: 15,
  },
  {
    id: 'physio-progress-check',
    name: 'Recovery Check-In',
    industry: 'physiotherapy',
    description: 'Send a follow-up message 3 days after treatment to check pain levels and recovery progress. Flags patients who need attention.',
    trigger_type: 'appointment_completed',
    featured: false,
    setup_minutes: 5,
    minutes_saved_per_run: 10,
  },
];

const INDUSTRIES = [
  { label: 'All', value: '' },
  { label: 'Dental', value: 'dental' },
  { label: 'Aesthetics', value: 'aesthetics' },
  { label: 'Legal', value: 'legal' },
  { label: 'Home Services', value: 'home_services' },
  { label: 'Physiotherapy', value: 'physiotherapy' },
  { label: 'General', value: 'general' },
];

function ZapIcon({ className }: { className?: string }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>;
}
function StarFillIcon({ className }: { className?: string }) {
  return <svg className={className} fill="currentColor" viewBox="0 0 24 24"><path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>;
}
function ClockIcon({ className }: { className?: string }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
}
function TrendUpIcon({ className }: { className?: string }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>;
}

function IndustryBadge({ industry }: { industry: string }) {
  const label = INDUSTRIES.find((i) => i.value === industry)?.label ?? industry;
  const colors: Record<string, string> = {
    dental: 'bg-blue-100 text-blue-700',
    aesthetics: 'bg-pink-100 text-pink-700',
    legal: 'bg-amber-100 text-amber-700',
    home_services: 'bg-green-100 text-green-700',
    physiotherapy: 'bg-teal-100 text-teal-700',
    general: 'bg-brand-purple/10 text-brand-purple',
  };
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${colors[industry] || colors.general}`}>
      {label}
    </span>
  );
}

function TriggerBadge({ trigger }: { trigger: string }) {
  const labels: Record<string, string> = {
    new_lead: 'On New Lead',
    appointment_created: 'On Booking',
    appointment_completed: 'After Appointment',
    lead_score_update: 'On Score Change',
    lead_inactive: 'On Inactivity',
    scheduled: 'Scheduled',
    manual: 'Manual Trigger',
  };
  return (
    <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-500">
      {labels[trigger] || trigger}
    </span>
  );
}

function TemplateCard({ template }: { template: Template }) {
  return (
    <div className="relative flex flex-col rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
      {template.featured && (
        <div className="absolute right-4 top-4 flex items-center gap-1 rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-semibold text-yellow-700">
          <StarFillIcon className="h-3 w-3 text-yellow-500" />
          Featured
        </div>
      )}

      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-brand-purple/10 text-brand-purple">
          <ZapIcon className="h-6 w-6" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-sm font-semibold text-gray-900">
            {template.name}
          </h3>
          <div className="flex items-center gap-2 mt-1">
            <IndustryBadge industry={template.industry} />
            <TriggerBadge trigger={template.trigger_type} />
          </div>
        </div>
      </div>

      <p className="mb-5 flex-1 text-sm leading-relaxed text-gray-500">
        {template.description}
      </p>

      <div className="flex items-center justify-between border-t border-gray-100 pt-4 text-xs text-gray-500">
        <div className="flex items-center gap-1">
          <ClockIcon className="h-3.5 w-3.5 text-gray-400" />
          <span>Setup: {template.setup_minutes} min</span>
        </div>
        <div className="flex items-center gap-1">
          <TrendUpIcon className="h-3.5 w-3.5 text-green-500" />
          <span className="font-medium text-green-600">
            Saves {template.minutes_saved_per_run} min/run
          </span>
        </div>
      </div>

      <button className="mt-4 w-full rounded-lg bg-brand-purple px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-purple/90 focus:outline-none focus:ring-2 focus:ring-brand-purple focus:ring-offset-2">
        Use Template
      </button>
    </div>
  );
}

export default function TemplatesPage() {
  const [activeIndustry, setActiveIndustry] = useState('');

  const filtered = useMemo(() => {
    if (!activeIndustry) return TEMPLATES;
    return TEMPLATES.filter(t => t.industry === activeIndustry || t.industry === 'general');
  }, [activeIndustry]);

  // Sort: featured first
  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));
  }, [filtered]);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Workflow Templates</h1>
        <p className="mt-1 text-sm text-gray-500">
          Pre-built automation workflows for your industry. Click &quot;Use Template&quot; to activate.
        </p>
      </div>

      {/* Industry filter tabs */}
      <div className="mb-8 flex flex-wrap gap-2">
        {INDUSTRIES.map((industry) => {
          const isActive = activeIndustry === industry.value;
          const count = industry.value
            ? TEMPLATES.filter(t => t.industry === industry.value).length
            : TEMPLATES.length;
          return (
            <button
              key={industry.value}
              onClick={() => setActiveIndustry(industry.value)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-brand-purple text-white shadow-sm'
                  : 'bg-white text-gray-600 ring-1 ring-gray-200 hover:bg-brand-purple/5 hover:text-brand-purple'
              }`}
            >
              {industry.label}
              <span className={`ml-1.5 text-xs ${isActive ? 'text-purple-200' : 'text-gray-400'}`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {sorted.map((template) => (
          <TemplateCard key={template.id} template={template} />
        ))}
      </div>
    </div>
  );
}
