'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';

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

interface DeployedTemplate {
  template_id: string;
  is_active: boolean;
  deployed_at: string;
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
function CheckIcon({ className }: { className?: string }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>;
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

function TemplateCard({
  template,
  isDeployed,
  deploying,
  onDeploy,
  onDeactivate,
}: {
  template: Template;
  isDeployed: boolean;
  deploying: boolean;
  onDeploy: () => void;
  onDeactivate: () => void;
}) {
  return (
    <div className={`relative flex flex-col rounded-xl border bg-white p-5 shadow-sm transition-shadow hover:shadow-md ${isDeployed ? 'border-green-300 ring-1 ring-green-200' : 'border-gray-200'}`}>
      {template.featured && (
        <div className="absolute right-4 top-4 flex items-center gap-1 rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-semibold text-yellow-700">
          <StarFillIcon className="h-3 w-3 text-yellow-500" />
          Featured
        </div>
      )}

      {isDeployed && (
        <div className="absolute left-4 top-4 flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-semibold text-green-700">
          <CheckIcon className="h-3 w-3" />
          Active
        </div>
      )}

      <div className="mb-4 flex items-center gap-3">
        <div className={`flex h-11 w-11 items-center justify-center rounded-lg ${isDeployed ? 'bg-green-100 text-green-600' : 'bg-brand-purple/10 text-brand-purple'}`}>
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

      {isDeployed ? (
        <button
          onClick={onDeactivate}
          disabled={deploying}
          className="mt-4 w-full rounded-lg border border-red-200 bg-white px-4 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-300 focus:ring-offset-2 disabled:opacity-50"
        >
          {deploying ? 'Deactivating...' : 'Deactivate'}
        </button>
      ) : (
        <button
          onClick={onDeploy}
          disabled={deploying}
          className="mt-4 w-full rounded-lg bg-brand-purple px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-purple/90 focus:outline-none focus:ring-2 focus:ring-brand-purple focus:ring-offset-2 disabled:opacity-50"
        >
          {deploying ? 'Activating...' : 'Use Template'}
        </button>
      )}
    </div>
  );
}

export default function TemplatesPage() {
  const [activeIndustry, setActiveIndustry] = useState('');
  const [templates, setTemplates] = useState<Template[]>([]);
  const [deployedIds, setDeployedIds] = useState<Set<string>>(new Set());
  const [deployingId, setDeployingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch templates + deployed state on mount
  useEffect(() => {
    async function load() {
      const [templatesRes, deployedRes] = await Promise.all([
        fetch('/api/templates'),
        fetch('/api/templates/deploy'),
      ]);
      const templatesData = await templatesRes.json();
      const deployedData = await deployedRes.json();

      setTemplates(templatesData.templates || []);
      setDeployedIds(
        new Set(
          (deployedData.deployed || [])
            .filter((d: DeployedTemplate) => d.is_active)
            .map((d: DeployedTemplate) => d.template_id)
        )
      );
      setLoading(false);
    }
    load();
  }, []);

  const deployTemplate = useCallback(async (templateId: string) => {
    setDeployingId(templateId);
    try {
      const res = await fetch('/api/templates/deploy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ templateId }),
      });
      if (res.ok) {
        setDeployedIds(prev => new Set(prev).add(templateId));
      }
    } finally {
      setDeployingId(null);
    }
  }, []);

  const deactivateTemplate = useCallback(async (templateId: string) => {
    setDeployingId(templateId);
    try {
      const res = await fetch(`/api/templates/deploy?templateId=${templateId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setDeployedIds(prev => {
          const next = new Set(prev);
          next.delete(templateId);
          return next;
        });
      }
    } finally {
      setDeployingId(null);
    }
  }, []);

  const filtered = useMemo(() => {
    if (!activeIndustry) return templates;
    return templates.filter(t => t.industry === activeIndustry || t.industry === 'general');
  }, [activeIndustry, templates]);

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      // Deployed first, then featured, then by name
      const aDeployed = deployedIds.has(a.id) ? 1 : 0;
      const bDeployed = deployedIds.has(b.id) ? 1 : 0;
      if (bDeployed !== aDeployed) return bDeployed - aDeployed;
      if (b.featured !== a.featured) return (b.featured ? 1 : 0) - (a.featured ? 1 : 0);
      return 0;
    });
  }, [filtered, deployedIds]);

  const activeCount = deployedIds.size;

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Workflow Templates</h1>
        <p className="mt-1 text-sm text-gray-500">
          Pre-built automation workflows for your industry. Click &quot;Use Template&quot; to activate.
          {activeCount > 0 && (
            <span className="ml-2 inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700">
              {activeCount} active
            </span>
          )}
        </p>
      </div>

      {/* Industry filter tabs */}
      <div className="mb-8 flex flex-wrap gap-2">
        {INDUSTRIES.map((industry) => {
          const isActive = activeIndustry === industry.value;
          const count = industry.value
            ? templates.filter(t => t.industry === industry.value).length
            : templates.length;
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

      {loading ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-64 animate-pulse rounded-xl bg-gray-100" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {sorted.map((template) => (
            <TemplateCard
              key={template.id}
              template={template}
              isDeployed={deployedIds.has(template.id)}
              deploying={deployingId === template.id}
              onDeploy={() => deployTemplate(template.id)}
              onDeactivate={() => deactivateTemplate(template.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
