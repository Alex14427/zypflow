'use client';

import { useState, useEffect } from 'react';

interface Template {
  id: string;
  name: string;
  industry: string;
  description: string;
  trigger_type: string;
  featured: boolean;
  setup_minutes: number;
  icon: string;
  minutes_saved_per_run: number;
}

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
function SpinnerIcon({ className }: { className?: string }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>;
}
function EmptyIcon({ className }: { className?: string }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>;
}

function IndustryBadge({ industry }: { industry: string }) {
  const label = INDUSTRIES.find((i) => i.value === industry)?.label ?? industry;
  return (
    <span className="inline-flex items-center rounded-full bg-brand-purple/10 px-2.5 py-0.5 text-xs font-medium text-brand-purple">
      {label}
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
          <IndustryBadge industry={template.industry} />
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
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeIndustry, setActiveIndustry] = useState('');

  useEffect(() => {
    setLoading(true);
    const url = activeIndustry
      ? `/api/templates?industry=${encodeURIComponent(activeIndustry)}`
      : '/api/templates';

    fetch(url)
      .then((res) => res.json())
      .then((data: { templates: Template[] }) => {
        setTemplates(data.templates ?? []);
      })
      .catch(() => {
        setTemplates([]);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [activeIndustry]);

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Workflow Templates</h1>
        <p className="mt-1 text-sm text-gray-500">
          Get started quickly with pre-built automation workflows for your industry.
        </p>
      </div>

      {/* Industry filter tabs */}
      <div className="mb-8 flex flex-wrap gap-2">
        {INDUSTRIES.map((industry) => {
          const isActive = activeIndustry === industry.value;
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
            </button>
          );
        })}
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 text-gray-400">
          <SpinnerIcon className="h-8 w-8 animate-spin text-brand-purple" />
          <p className="mt-3 text-sm">Loading templates...</p>
        </div>
      ) : templates.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-gray-400">
          <EmptyIcon className="h-12 w-12 text-gray-300" />
          <p className="mt-4 text-base font-medium text-gray-500">No templates found</p>
          <p className="mt-1 text-sm text-gray-400">
            Try selecting a different industry filter.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {templates.map((template) => (
            <TemplateCard key={template.id} template={template} />
          ))}
        </div>
      )}
    </div>
  );
}
