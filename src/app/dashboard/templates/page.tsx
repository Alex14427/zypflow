'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { readActivationSnapshot } from '@/lib/activation-state';
import { resolveCurrentBusiness } from '@/lib/current-business';
import { buildLaunchReadiness, getRecommendedLaunchPack, normalizeIndustryKey } from '@/lib/launch-pack';

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

interface WorkspaceBusiness {
  id: string;
  name: string;
  industry: string | null;
  website: string | null;
  booking_url: string | null;
  google_review_link: string | null;
  settings?: Record<string, unknown> | null;
  services?: unknown[] | null;
  knowledge_base?: unknown[] | null;
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
    dental: 'bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-200',
    aesthetics: 'bg-pink-100 text-pink-700 dark:bg-pink-500/15 dark:text-pink-200',
    legal: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-200',
    home_services: 'bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-200',
    physiotherapy: 'bg-teal-100 text-teal-700 dark:bg-teal-500/15 dark:text-teal-200',
    general: 'bg-brand-purple/10 text-brand-purple dark:text-purple-200',
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
    <span className="inline-flex items-center rounded-full bg-[var(--app-muted)] px-2 py-0.5 text-[10px] font-medium text-[var(--app-text-muted)]">
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
    <div className={`relative flex flex-col rounded-[28px] border bg-[var(--app-surface)] p-5 shadow-sm transition-shadow hover:shadow-md ${isDeployed ? 'border-green-300 ring-1 ring-green-200 dark:border-green-500/40 dark:ring-green-500/20' : 'border-[var(--app-border)]'}`}>
      {template.featured && (
        <div className="absolute right-4 top-4 flex items-center gap-1 rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-semibold text-yellow-700 dark:bg-yellow-500/15 dark:text-yellow-200">
          <StarFillIcon className="h-3 w-3 text-yellow-500" />
          Featured
        </div>
      )}

      {isDeployed && (
        <div className="absolute left-4 top-4 flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-semibold text-green-700 dark:bg-green-500/15 dark:text-green-200">
          <CheckIcon className="h-3 w-3" />
          Active
        </div>
      )}

      <div className="mb-4 flex items-center gap-3">
        <div className={`flex h-11 w-11 items-center justify-center rounded-lg ${isDeployed ? 'bg-green-100 text-green-600 dark:bg-green-500/15 dark:text-green-200' : 'bg-brand-purple/10 text-brand-purple dark:text-purple-200'}`}>
          <ZapIcon className="h-6 w-6" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-sm font-semibold text-[var(--app-text)]">
            {template.name}
          </h3>
          <div className="mt-1 flex items-center gap-2">
            <IndustryBadge industry={template.industry} />
            <TriggerBadge trigger={template.trigger_type} />
          </div>
        </div>
      </div>

      <p className="mb-5 flex-1 text-sm leading-relaxed text-[var(--app-text-muted)]">
        {template.description}
      </p>

      <div className="flex items-center justify-between border-t border-[var(--app-border)] pt-4 text-xs text-[var(--app-text-muted)]">
        <div className="flex items-center gap-1">
          <ClockIcon className="h-3.5 w-3.5" />
          <span>Setup: {template.setup_minutes} min</span>
        </div>
        <div className="flex items-center gap-1">
          <TrendUpIcon className="h-3.5 w-3.5 text-green-500" />
          <span className="font-medium text-green-600 dark:text-green-200">
            Saves {template.minutes_saved_per_run} min/run
          </span>
        </div>
      </div>

      {isDeployed ? (
        <button
          onClick={onDeactivate}
          disabled={deploying}
          className="mt-4 w-full rounded-lg border border-red-200 bg-white px-4 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-300 focus:ring-offset-2 disabled:opacity-50 dark:border-red-500/30 dark:bg-transparent dark:text-red-200 dark:hover:bg-red-500/10"
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
  const [workspace, setWorkspace] = useState<WorkspaceBusiness | null>(null);
  const [loading, setLoading] = useState(true);
  const [packBusy, setPackBusy] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setErrorMessage(null);

    try {
      const [{ business }, templatesRes, deployedRes] = await Promise.all([
        resolveCurrentBusiness(),
        fetch('/api/templates', { cache: 'no-store' }),
        fetch('/api/templates/deploy', { cache: 'no-store' }),
      ]);

      const templatesData = await templatesRes.json().catch(() => ({}));
      const deployedData = await deployedRes.json().catch(() => ({}));

      setWorkspace({
        id: business.id,
        name: business.name,
        industry: business.industry,
        website: business.website || null,
        booking_url: business.booking_url || null,
        google_review_link: business.google_review_link || null,
        settings: business.settings || null,
        services: business.services || [],
        knowledge_base: business.knowledge_base || [],
      });

      setTemplates(templatesData.templates || []);
      setDeployedIds(
        new Set(
          (deployedData.deployed || [])
            .filter((item: DeployedTemplate) => item.is_active)
            .map((item: DeployedTemplate) => item.template_id)
        )
      );

      const industryKey = normalizeIndustryKey(business.industry);
      if (INDUSTRIES.some((industry) => industry.value === industryKey)) {
        setActiveIndustry((current) => current || industryKey);
      }
    } catch (error) {
      console.error('Failed to load templates workspace:', error);
      setErrorMessage('Unable to load your setup checklist right now. Please refresh and try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const launchPack = useMemo(() => getRecommendedLaunchPack(workspace?.industry), [workspace?.industry]);

  const readiness = useMemo(
    () =>
      buildLaunchReadiness({
        industry: workspace?.industry,
        website: workspace?.website,
        bookingUrl: workspace?.booking_url,
        reviewLink: workspace?.google_review_link,
        widgetInstalled: readActivationSnapshot(workspace?.settings || null).widgetInstalled,
        services: workspace?.services,
        knowledgeBase: workspace?.knowledge_base,
        activeTemplateIds: deployedIds,
      }),
    [deployedIds, workspace]
  );

  const packIsActive = useMemo(
    () => launchPack.templateIds.every((templateId) => deployedIds.has(templateId)),
    [deployedIds, launchPack.templateIds]
  );

  const filtered = useMemo(() => {
    if (!activeIndustry) return templates;
    return templates.filter((template) => template.industry === activeIndustry || template.industry === 'general');
  }, [activeIndustry, templates]);

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      const aDeployed = deployedIds.has(a.id) ? 1 : 0;
      const bDeployed = deployedIds.has(b.id) ? 1 : 0;
      if (bDeployed !== aDeployed) return bDeployed - aDeployed;
      if (b.featured !== a.featured) return (b.featured ? 1 : 0) - (a.featured ? 1 : 0);
      return a.name.localeCompare(b.name);
    });
  }, [filtered, deployedIds]);

  const deployTemplate = useCallback(async (templateId: string) => {
    setDeployingId(templateId);
    setFeedback(null);
    setErrorMessage(null);

    try {
      const response = await fetch('/api/templates/deploy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ templateId }),
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload.error || 'Unable to deploy template.');
      }

      setDeployedIds((previous) => new Set(previous).add(templateId));
      setFeedback('Template deployed.');
      await load();
    } catch (error) {
      console.error(error);
      setErrorMessage(error instanceof Error ? error.message : 'Unable to deploy template.');
    } finally {
      setDeployingId(null);
    }
  }, [load]);

  const deactivateTemplate = useCallback(async (templateId: string) => {
    setDeployingId(templateId);
    setFeedback(null);
    setErrorMessage(null);

    try {
      const response = await fetch(`/api/templates/deploy?templateId=${templateId}`, {
        method: 'DELETE',
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload.error || 'Unable to deactivate template.');
      }

      setDeployedIds((previous) => {
        const next = new Set(previous);
        next.delete(templateId);
        return next;
      });
      setFeedback('Template deactivated.');
      await load();
    } catch (error) {
      console.error(error);
      setErrorMessage(error instanceof Error ? error.message : 'Unable to deactivate template.');
    } finally {
      setDeployingId(null);
    }
  }, [load]);

  const deployPack = useCallback(async () => {
    setPackBusy(true);
    setFeedback(null);
    setErrorMessage(null);

    try {
      const response = await fetch('/api/templates/deploy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ packId: launchPack.id }),
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload.error || 'Unable to deploy the setup checklist.');
      }

      const deployedTemplateIds =
        (payload.deployed as DeployedTemplate[] | undefined)?.map((item) => item.template_id) ?? launchPack.templateIds;

      setDeployedIds((previous) => {
        const next = new Set(previous);
        deployedTemplateIds.forEach((templateId) => next.add(templateId));
        return next;
      });
      setFeedback(`${launchPack.name} deployed successfully.`);
      await load();
    } catch (error) {
      console.error(error);
      setErrorMessage(error instanceof Error ? error.message : 'Unable to deploy the setup checklist.');
    } finally {
      setPackBusy(false);
    }
  }, [launchPack, load]);

  const deactivatePack = useCallback(async () => {
    setPackBusy(true);
    setFeedback(null);
    setErrorMessage(null);

    try {
      const response = await fetch(`/api/templates/deploy?packId=${launchPack.id}`, {
        method: 'DELETE',
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload.error || 'Unable to deactivate the setup checklist.');
      }

      setDeployedIds((previous) => {
        const next = new Set(previous);
        launchPack.templateIds.forEach((templateId) => next.delete(templateId));
        return next;
      });
      setFeedback(`${launchPack.name} deactivated.`);
      await load();
    } catch (error) {
      console.error(error);
      setErrorMessage(error instanceof Error ? error.message : 'Unable to deactivate the setup checklist.');
    } finally {
      setPackBusy(false);
    }
  }, [launchPack, load]);

  const activeCount = deployedIds.size;

  return (
    <div className="space-y-8">
      <div>
        <span className="page-eyebrow">Setup checklist</span>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight text-[var(--app-text)] sm:text-5xl">
          Deploy the automation system that makes the clinic feel owner-light
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-[var(--app-text-muted)]">
          This page recommends the right workflow for the current clinic, scores setup readiness, and lets you switch
          the core automation spine on in one move.
        </p>
      </div>

      {errorMessage && (
        <div className="rounded-[24px] border border-red-500/30 bg-red-500/8 p-4 text-sm text-red-600 dark:text-red-300">
          {errorMessage}
        </div>
      )}

      {feedback && (
        <div className="rounded-[24px] border border-emerald-500/30 bg-emerald-500/8 p-4 text-sm text-emerald-700 dark:text-emerald-200">
          {feedback}
        </div>
      )}

      <section className="surface-panel rounded-[32px] p-6">
        <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <IndustryBadge industry={launchPack.industry} />
              <span className="rounded-full bg-brand-purple px-3 py-1 text-xs font-semibold text-white">
                {readiness.score}% ready
              </span>
              {packIsActive && (
                <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-semibold text-emerald-600 dark:text-emerald-200">
                  Pack live
                </span>
              )}
            </div>
            <h2 className="mt-4 text-3xl font-semibold text-[var(--app-text)]">{launchPack.name}</h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-[var(--app-text-muted)]">{launchPack.description}</p>
            <p className="mt-3 text-sm font-semibold text-[var(--app-text)]">{launchPack.promise}</p>

            <div className="mt-6 h-3 rounded-full bg-[var(--app-muted)]">
              <div className="h-3 rounded-full bg-brand-purple transition-all" style={{ width: `${readiness.score}%` }} />
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              {packIsActive ? (
                <button
                  onClick={deactivatePack}
                  disabled={packBusy}
                  className="rounded-full border border-red-300 px-4 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-50 dark:border-red-500/30 dark:text-red-200 dark:hover:bg-red-500/10"
                >
                  {packBusy ? 'Stopping workflow...' : 'Deactivate setup checklist'}
                </button>
              ) : (
                <button
                  onClick={deployPack}
                  disabled={packBusy}
                  className="rounded-full bg-brand-purple px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-purple/90 disabled:opacity-50"
                >
                  {packBusy ? 'Deploying pack...' : `Deploy ${launchPack.name}`}
                </button>
              )}
              <Link
                href="/onboarding"
                className="rounded-full border border-[var(--app-border)] px-4 py-2 text-sm font-semibold text-[var(--app-text)] transition hover:border-brand-purple hover:text-brand-purple"
              >
                Finish clinic setup
              </Link>
              <Link
                href="/dashboard/settings"
                className="rounded-full border border-[var(--app-border)] px-4 py-2 text-sm font-semibold text-[var(--app-text)] transition hover:border-brand-purple hover:text-brand-purple"
              >
                Open settings
              </Link>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <StatCard label="Launch steps complete" value={`${readiness.completedCount}/${readiness.totalCount}`} />
            <StatCard label="Templates in pack" value={String(launchPack.templateIds.length)} />
            <StatCard label="Active automations" value={String(activeCount)} />
            <StatCard label="Missing setup items" value={String(readiness.missingItems.length)} />
          </div>
        </div>

        <div className="mt-6 grid gap-3 lg:grid-cols-2">
          {readiness.checklist.map((item) => (
            <div key={item.id} className="rounded-[24px] border border-[var(--app-border)] bg-[var(--app-muted)] px-4 py-4">
              <div className="flex items-start gap-3">
                <span
                  className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                    item.complete
                      ? 'bg-emerald-500 text-white'
                      : 'bg-slate-500/12 text-[var(--app-text-muted)]'
                  }`}
                >
                  {item.complete ? 'OK' : 'TO'}
                </span>
                <div>
                  <p className="text-sm font-semibold text-[var(--app-text)]">{item.label}</p>
                  <p className="mt-1 text-sm leading-6 text-[var(--app-text-muted)]">{item.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="flex flex-wrap gap-2">
        {INDUSTRIES.map((industry) => {
          const isActive = activeIndustry === industry.value;
          const count = industry.value
            ? templates.filter((template) => template.industry === industry.value || template.industry === 'general').length
            : templates.length;
          return (
            <button
              key={industry.value}
              onClick={() => setActiveIndustry(industry.value)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-brand-purple text-white shadow-sm'
                  : 'bg-[var(--app-surface)] text-[var(--app-text-muted)] ring-1 ring-[var(--app-border)] hover:bg-brand-purple/5 hover:text-brand-purple'
              }`}
            >
              {industry.label}
              <span className={`ml-1.5 text-xs ${isActive ? 'text-purple-200' : 'text-[var(--app-text-muted)]'}`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="h-64 animate-pulse rounded-[28px] bg-[var(--app-muted)]" />
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

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[24px] border border-[var(--app-border)] bg-[var(--app-muted)] px-4 py-4">
      <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--app-text-muted)]">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-[var(--app-text)]">{value}</p>
    </div>
  );
}
