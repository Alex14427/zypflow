'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { formatActivationStatus } from '@/lib/activation-state';
import { buildAntiFailureChecks } from '@/lib/anti-failure';
import { formatChurnRisk, formatHealthStatus } from '@/lib/client-health';
import { formatCurrencyGBP } from '@/lib/formatting';
import { ThemeToggle } from '@/components/theme-toggle';
import { FounderOverviewData } from '@/types/admin';

const AUTOMATION_CADENCE = [
  { name: 'Prospect scrape', cadence: 'Daily', detail: 'Pulls fresh London clinic prospects into the founder queue.' },
  { name: 'Outreach send', cadence: 'Daily', detail: 'Advances audit-led outbound sequences for ready prospects.' },
  { name: 'Lifecycle emails', cadence: 'Daily', detail: 'Sends onboarding nudges, milestones, and weekly proof digests.' },
  { name: 'Appointment reminders', cadence: 'Daily', detail: 'Covers 48h, 24h, and 2h reminder windows for confirmed bookings.' },
  { name: 'Review requests', cadence: 'Daily', detail: 'Scans completed visits and sends review asks without manual handoff.' },
];

export default function AdminDashboardPage() {
  const [metrics, setMetrics] = useState<FounderOverviewData | null>(null);
  const [activeTab, setActiveTab] = useState<'control' | 'pipeline' | 'proof'>('control');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    const response = await fetch('/api/admin/overview', { cache: 'no-store' });
    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(payload.error || 'Unable to load founder overview.');
    }

    setMetrics(payload as FounderOverviewData);
    setErrorMessage(null);
  }, []);

  useEffect(() => {
    load().catch((error) => {
      console.error(error);
      setErrorMessage(error instanceof Error ? error.message : 'Unable to load founder overview.');
    });

    const interval = setInterval(() => {
      load().catch((error) => {
        console.error(error);
        setErrorMessage(error instanceof Error ? error.message : 'Unable to refresh founder overview.');
      });
    }, 180_000);

    return () => clearInterval(interval);
  }, [load]);

  if (errorMessage) {
    return (
      <div className="app-shell">
        <div className="mx-auto max-w-5xl px-5 py-10 sm:px-8">
          <div className="rounded-[28px] border border-red-500/30 bg-red-500/8 p-6 text-sm text-red-600 dark:text-red-300">
            {errorMessage}
          </div>
        </div>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="app-shell">
        <div className="flex h-[60vh] items-center justify-center">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-purple border-t-transparent" />
        </div>
      </div>
    );
  }

  const replyRate = metrics.prospectsTotal > 0 ? ((metrics.prospectsReplied / metrics.prospectsTotal) * 100).toFixed(1) : '0.0';
  const targetProgress = Math.min(100, (metrics.managedClinics / 2) * 100);
  const antiFailureChecks = buildAntiFailureChecks(metrics);
  const activeOutreachCount = metrics.prospectsReadyForFollowUp + metrics.prospectsRetryRequired;
  const weeklyProofPerClinic = metrics.managedClinics > 0 ? metrics.weeklyEstimatedRevenue / metrics.managedClinics : 0;
  const launchFocus =
    metrics.prospectsReadyForFollowUp > 0
      ? {
          title: 'Close the warm queue now',
          detail: `${metrics.prospectsReadyForFollowUp} prospects are ready for the next touch, which is the fastest route to more collected cash this month.`,
        }
      : metrics.audits7d > 0
        ? {
            title: 'Turn fresh audits into reply volume',
            detail: `${metrics.audits7d} audits landed this week. The next leverage point is better follow-up and reply conversion.`,
          }
        : {
            title: 'Top of funnel needs pressure',
            detail: 'Without fresh audits and replies, the founder portal becomes reporting instead of a growth engine.',
          };
  const tabSummaries = {
    control: {
      label: 'Control',
      count: `${antiFailureChecks.filter((check) => check.status !== 'healthy').length} checks`,
      detail: 'System health, anti-failure radar, and operating discipline.',
    },
    pipeline: {
      label: 'Pipeline',
      count: `${activeOutreachCount} active`,
      detail: 'Audit flow, outreach queue, and close-ready prospects.',
    },
    proof: {
      label: 'Proof',
      count: `${metrics.weeklyBookings} bookings`,
      detail: 'Live clinics, proof quality, and retention pressure.',
    },
  } as const;

  return (
    <div className="app-shell">
      <div className="mx-auto max-w-7xl px-5 pb-16 pt-5 sm:px-8">
        <header className="glass-panel mb-8 flex items-center justify-between rounded-full px-5 py-3">
          <Link href="/dashboard" className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-purple text-sm font-bold text-white">
              Z
            </span>
            <div>
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Founder portal</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Control acquisition, launch, and proof</p>
            </div>
          </Link>
          <div className="flex items-center gap-3">
            <ThemeToggle compact />
            <Link
              href="/dashboard"
              className="rounded-full border border-slate-300/70 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-brand-purple hover:text-brand-purple dark:border-slate-700 dark:text-slate-200"
            >
              Client portal
            </Link>
          </div>
        </header>

        <main className="space-y-8">
          <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="space-y-5">
              <span className="page-eyebrow">Launch control</span>
              <h1 className="max-w-4xl text-5xl font-semibold leading-[0.95] text-slate-950 dark:text-white sm:text-6xl">
                Build the machine, close the clinics, then let the system do the repetitive work.
              </h1>
              <p className="max-w-3xl text-lg leading-8 text-slate-600 dark:text-slate-300">
                This workspace tracks the numbers that matter for launch: audits, replies, launch readiness, live
                workflow packs, and progress toward the first <strong>profitable launch month</strong>.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link
                  href="/"
                  className="rounded-full border border-[var(--app-border)] bg-[var(--app-surface)] px-4 py-2 text-sm font-semibold text-[var(--app-text)] transition hover:border-brand-purple hover:text-brand-purple"
                >
                  View public site
                </Link>
                <Link
                  href="/pricing"
                  className="rounded-full border border-[var(--app-border)] bg-[var(--app-surface)] px-4 py-2 text-sm font-semibold text-[var(--app-text)] transition hover:border-brand-purple hover:text-brand-purple"
                >
                  Review offer
                </Link>
                <Link
                  href="/dashboard"
                  className="rounded-full border border-[var(--app-border)] bg-[var(--app-surface)] px-4 py-2 text-sm font-semibold text-[var(--app-text)] transition hover:border-brand-purple hover:text-brand-purple"
                >
                  Client view
                </Link>
              </div>
            </div>

            <div className="grid gap-4">
              <div className="surface-panel rounded-[32px] p-6">
                <p className="page-eyebrow">Launch target</p>
                <div className="mt-4 flex items-end gap-3">
                  <h2 className="text-5xl font-semibold text-[var(--app-text)]">{metrics.managedClinics}/2</h2>
                  <p className="pb-2 text-sm font-semibold uppercase tracking-[0.18em] text-[var(--app-text-muted)]">
                    clinics closed
                  </p>
                </div>
                <p className="mt-3 text-sm leading-7 text-[var(--app-text-muted)]">
                  Two clinics on the founding offer model clears the launch-month cash target and proves the motion.
                </p>
                <div className="mt-5 h-3 rounded-full bg-[var(--app-muted)]">
                  <div className="h-3 rounded-full bg-brand-purple transition-all" style={{ width: `${targetProgress}%` }} />
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <MetaStat label="Pilot run-rate" value={formatCurrencyGBP(metrics.monthlyRunRate)} />
                  <MetaStat label="Cash collected model" value={formatCurrencyGBP(metrics.cashCollectedModel)} />
                </div>
              </div>

              <div className="surface-panel rounded-[32px] p-6">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="page-eyebrow">Operator pulse</p>
                    <h2 className="mt-3 text-3xl font-semibold text-[var(--app-text)]">{launchFocus.title}</h2>
                  </div>
                  <span className="rounded-full bg-brand-purple px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-white">
                    {replyRate}% reply
                  </span>
                </div>
                <p className="mt-3 text-sm leading-7 text-[var(--app-text-muted)]">{launchFocus.detail}</p>
                <div className="mt-5 grid gap-3 sm:grid-cols-3">
                  <MetaStat label="Warm queue" value={String(activeOutreachCount)} />
                  <MetaStat label="Clinics at risk" value={String(metrics.clinicsAtRisk)} />
                  <MetaStat
                    label="Proof per clinic"
                    value={metrics.managedClinics > 0 ? formatCurrencyGBP(weeklyProofPerClinic) : 'No data'}
                  />
                </div>
              </div>
            </div>
          </section>

          <section className="grid gap-4 lg:grid-cols-3">
            <PriorityCard
              title="Close revenue first"
              badge={metrics.prospectsReadyForFollowUp > 0 ? `${metrics.prospectsReadyForFollowUp} ready` : 'Warm up'}
              body={
                metrics.prospectsReadyForFollowUp > 0
                  ? `There are ${metrics.prospectsReadyForFollowUp} prospects ready for the next touch. That is the fastest path to more cash this month.`
                  : 'The outreach engine needs more replies before the close queue becomes valuable.'
              }
            />
            <PriorityCard
              title="Get clinics launch-ready"
              badge={metrics.clinicsNeedingSetup > 0 ? `${metrics.clinicsNeedingSetup} blocked` : 'Healthy'}
              body={
                metrics.clinicsNeedingSetup > 0
                  ? `${metrics.clinicsNeedingSetup} clinic workspace still needs setup. Those blockers slow the point where automation can fully take over.`
                  : 'Current clinic workspaces are configured well enough for a cleaner automated launch.'
              }
            />
            <PriorityCard
              title="Protect retention"
              badge={metrics.clinicsAtRisk > 0 ? `${metrics.clinicsAtRisk} at risk` : 'Stable'}
              body={
                metrics.clinicsAtRisk > 0
                  ? `${metrics.clinicsAtRisk} clinic is showing retention risk. Proof and follow-up are the first places to check.`
                  : 'No clinic is currently flashing high retention risk from the latest proof signals.'
              }
            />
          </section>

          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <FounderTile label="Managed clinics" value={metrics.managedClinics} detail="Clinics you can count as active managed customers." accent />
            <FounderTile label="Launch-ready clinics" value={metrics.launchReadyClinics} detail={`${metrics.clinicsNeedingSetup} still need setup before the pack can run cleanly.`} />
            <FounderTile label="Audit demand" value={metrics.auditsTotal} detail={`${metrics.audits7d} captured in the last 7 days.`} />
            <FounderTile label="Weekly proof" value={formatCurrencyGBP(metrics.weeklyEstimatedRevenue)} detail={`${metrics.weeklyBookings} bookings and ${metrics.weeklyReviewsCompleted} review wins this week.`} />
          </section>

          <section className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
            <div className="surface-panel rounded-[32px] p-6">
              <p className="page-eyebrow">Runbook</p>
              <h2 className="mt-3 text-3xl font-semibold text-[var(--app-text)]">What the next founder actions should be</h2>
              <div className="mt-5 space-y-3">
                <ChecklistRow
                  done={metrics.auditsTotal > 0}
                  title="Audit wedge active"
                  detail="The free audit must keep pulling clinics into the top of the funnel."
                />
                <ChecklistRow
                  done={metrics.prospectsTotal > 0}
                  title="Outbound list populated"
                  detail="Prospects should be scraped and ready for outreach sequences."
                />
                <ChecklistRow
                  done={activeOutreachCount > 0}
                  title="Outreach is moving"
                  detail="Once clinics reply, your job is to close and onboard quickly."
                />
                <ChecklistRow
                  done={metrics.prospectsReplied > 0}
                  title="Replies are happening"
                  detail={
                    metrics.prospectsReplied > 0
                      ? `${metrics.prospectsReplied} prospect${metrics.prospectsReplied === 1 ? '' : 's'} have replied and should be in the close queue.`
                      : 'The founder portal should start showing warm replies once the sequences have had time to work.'
                  }
                />
                <ChecklistRow
                  done={metrics.launchReadyClinics > 0}
                  title="Launch-ready workspaces exist"
                  detail={
                    metrics.clinicsNeedingSetup > 0
                      ? `${metrics.clinicsNeedingSetup} clinic${metrics.clinicsNeedingSetup === 1 ? '' : 's'} still need setup before the automation pack can be trusted.`
                      : 'Your current clinic workspaces are configured cleanly enough for automated launch.'
                  }
                />
                <ChecklistRow
                  done={metrics.managedClinics >= 2}
                  title="Two-clinic launch target"
                  detail={
                    metrics.clinicsNeededForTwoK > 0
                      ? `${metrics.clinicsNeededForTwoK} more clinic${metrics.clinicsNeededForTwoK === 1 ? '' : 's'} needed to clear the launch-month profit model.`
                      : 'Target hit. The system can now focus on compounding profit instead of proving viability.'
                  }
                />
              </div>
            </div>

            <div className="surface-panel rounded-[32px] p-6">
              <p className="page-eyebrow">System health</p>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <MetaStat label="Live clinics" value={String(metrics.liveClinics)} />
                <MetaStat label="Founding setup clinics" value={String(metrics.trialClinics)} />
                <MetaStat label="Launch-ready clinics" value={String(metrics.launchReadyClinics)} />
                <MetaStat label="Need setup" value={String(metrics.clinicsNeedingSetup)} />
                <MetaStat label="Prospects scraped" value={String(metrics.prospectsTotal)} />
                <MetaStat label="Ready for follow-up" value={String(metrics.prospectsReadyForFollowUp)} />
                <MetaStat label="Retry required" value={String(metrics.prospectsRetryRequired)} />
                <MetaStat label="Reply rate" value={`${replyRate}%`} />
                <MetaStat label="Sequences complete" value={String(metrics.prospectsSequenceComplete)} />
                <MetaStat label="Activation live" value={String(metrics.activationLiveClinics)} />
                <MetaStat label="Ready to launch" value={String(metrics.activationReadyToLaunch)} />
                <MetaStat label="Needs attention" value={String(metrics.activationNeedsAttention)} />
                <MetaStat label="Widget pending" value={String(metrics.widgetPendingClinics)} />
                <MetaStat label="Leads managed" value={String(metrics.totalLeads)} />
                <MetaStat label="Bookings managed" value={String(metrics.totalAppointments)} />
                <MetaStat label="Reviews tracked" value={String(metrics.totalReviews)} />
                <MetaStat label="Active deployments" value={String(metrics.automationDeployments)} />
                <MetaStat label="Healthy clinics" value={String(metrics.healthyClinics)} />
                <MetaStat label="Clinics on watch" value={String(metrics.clinicsOnWatch)} />
                <MetaStat label="Clinics at risk" value={String(metrics.clinicsAtRisk)} />
                <MetaStat label="Stale hot leads" value={String(metrics.staleHotLeadCount)} />
                <MetaStat label="Weekly bookings" value={String(metrics.weeklyBookings)} />
                <MetaStat label="Weekly reviews" value={String(metrics.weeklyReviewsCompleted)} />
                <MetaStat label="Weekly proof value" value={formatCurrencyGBP(metrics.weeklyEstimatedRevenue)} />
                <MetaStat label="Average audit score" value={metrics.avgAuditScore ? `${metrics.avgAuditScore}/100` : 'No data'} />
              </div>
            </div>
          </section>

          <section>
            <div className="grid gap-3 md:grid-cols-3">
              {(['control', 'pipeline', 'proof'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`rounded-[24px] border px-4 py-4 text-left transition ${
                    activeTab === tab
                      ? 'border-brand-purple bg-brand-purple/10 text-[var(--app-text)] shadow-[var(--app-shadow)]'
                      : 'border-[var(--app-border)] bg-[var(--app-surface)] text-[var(--app-text-muted)] hover:text-[var(--app-text)]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold">{tabSummaries[tab].label}</p>
                      <p className="mt-2 text-xs leading-6 text-[var(--app-text-muted)]">{tabSummaries[tab].detail}</p>
                    </div>
                    <span
                      className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] ${
                        activeTab === tab ? 'bg-brand-purple text-white' : 'bg-[var(--app-muted)] text-[var(--app-text-muted)]'
                      }`}
                    >
                      {tabSummaries[tab].count}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </section>

          {activeTab === 'control' && (
            <div className="space-y-6">
              <section className="surface-panel rounded-[32px] p-6">
                <p className="page-eyebrow">Anti-Failure Radar</p>
                <h2 className="mt-3 text-3xl font-semibold text-[var(--app-text)]">Use startup failure data as a weekly operating checklist</h2>
                <div className="mt-5 grid gap-4 xl:grid-cols-2">
                  {antiFailureChecks.map((check) => (
                    <AntiFailureCard key={check.id} check={check} />
                  ))}
                </div>
              </section>

              <section className="grid gap-6 xl:grid-cols-3">
                <div className="surface-panel rounded-[32px] p-6">
                  <p className="page-eyebrow">Operating notes</p>
                  <div className="mt-5 space-y-4">
                    <FounderNote
                      title="Price discipline"
                      body="Keep the founding pilot tight: £995/month, £495 setup, one location, one workflow pack, no custom work."
                    />
                    <FounderNote
                      title="Automation discipline"
                      body="Anything that adds recurring manual work gets automated, charged extra, or cut."
                    />
                    <FounderNote
                      title="Launch discipline"
                      body="Do not rely on automation until the workspace is launch-ready: booking link, reviews, services, FAQs, and the pack all need to be in place."
                    />
                  </div>
                </div>

                <div className="surface-panel rounded-[32px] p-6">
                  <p className="page-eyebrow">Operational diagnostics</p>
                  <h3 className="mt-3 text-2xl font-semibold text-[var(--app-text)]">
                    {formatSystemStatus(metrics.system.status)}
                  </h3>
                  <p className="mt-3 text-sm leading-7 text-[var(--app-text-muted)]">{metrics.system.summary}</p>
                  <div className="mt-5 grid gap-3 sm:grid-cols-2">
                    {metrics.system.checks.map((check) => (
                      <div key={check.key} className="rounded-[22px] border border-[var(--app-border)] bg-[var(--app-muted)] px-4 py-4">
                        <div className="flex items-start justify-between gap-3">
                          <p className="text-sm font-semibold text-[var(--app-text)]">{check.label}</p>
                          <span className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] ${systemCheckTone(check.status)}`}>
                            {formatSystemCheckStatus(check.status)}
                          </span>
                        </div>
                        <p className="mt-2 text-sm leading-6 text-[var(--app-text-muted)]">{check.detail}</p>
                      </div>
                    ))}
                  </div>
                  {metrics.system.warnings.length > 0 && (
                    <div className="mt-5 space-y-3">
                      {metrics.system.warnings.slice(0, 4).map((warning) => (
                        <div
                          key={warning}
                          className="rounded-[22px] border border-amber-500/25 bg-amber-500/8 px-4 py-3 text-sm text-amber-700 dark:text-amber-200"
                        >
                          {warning}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="surface-panel rounded-[32px] p-6">
                  <p className="page-eyebrow">Automation cadence</p>
                  <div className="mt-5 space-y-3">
                    {AUTOMATION_CADENCE.map((item) => (
                      <div key={item.name} className="rounded-[22px] border border-[var(--app-border)] bg-[var(--app-muted)] px-4 py-4">
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-sm font-semibold text-[var(--app-text)]">{item.name}</p>
                          <span className="rounded-full bg-brand-purple/12 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-purple dark:text-purple-200">
                            {item.cadence}
                          </span>
                        </div>
                        <p className="mt-2 text-sm leading-6 text-[var(--app-text-muted)]">{item.detail}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            </div>
          )}

          {activeTab === 'pipeline' && (
            <section className="space-y-6">
              <div className="grid gap-4 xl:grid-cols-3">
                <FounderTile
                  label="Reply rate"
                  value={`${replyRate}%`}
                  detail={`${metrics.prospectsReplied} replied prospects from ${metrics.prospectsTotal} total prospects.`}
                  accent
                />
                <FounderTile
                  label="Ready for follow-up"
                  value={metrics.prospectsReadyForFollowUp}
                  detail="The queue that can become calls and collected cash fastest."
                />
                <FounderTile
                  label="Retry pressure"
                  value={metrics.prospectsRetryRequired}
                  detail="Prospects that still need a cleaner next touch or recovery."
                />
              </div>

              <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
                <div className="surface-panel rounded-[32px] p-6">
                  <p className="page-eyebrow">Pipeline health</p>
                  <div className="mt-5 space-y-4">
                    <PipelineRow label="Prospects scraped" value={metrics.prospectsTotal} max={Math.max(metrics.prospectsTotal, 1)} />
                  <PipelineRow label="Ready now" value={metrics.prospectsReadyForFollowUp} max={Math.max(metrics.prospectsTotal, 1)} />
                  <PipelineRow label="Retry queue" value={metrics.prospectsRetryRequired} max={Math.max(metrics.prospectsTotal, 1)} />
                  <PipelineRow label="Replies" value={metrics.prospectsReplied} max={Math.max(metrics.prospectsTotal, 1)} />
                  <PipelineRow label="Sequences complete" value={metrics.prospectsSequenceComplete} max={Math.max(metrics.prospectsTotal, 1)} />
                  <PipelineRow label="Website enquiries" value={metrics.websiteEnquiries} max={Math.max(metrics.prospectsTotal, metrics.websiteEnquiries, 1)} />
                  <PipelineRow label="Audits" value={metrics.auditsTotal} max={Math.max(metrics.prospectsTotal, metrics.auditsTotal, 1)} />
                  <PipelineRow label="Managed clinics" value={metrics.managedClinics} max={Math.max(2, metrics.managedClinics)} strong />
                </div>
                </div>

                <div className="surface-panel rounded-[32px] p-6">
                  <p className="page-eyebrow">Recent outreach queue</p>
                  <div className="mt-5 space-y-3">
                    {metrics.recentProspects.length > 0 ? (
                      metrics.recentProspects.map((prospect) => (
                        <div key={prospect.id} className="rounded-[24px] border border-[var(--app-border)] px-4 py-4">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="text-sm font-semibold text-[var(--app-text)]">{prospect.business_name}</p>
                              <p className="text-xs text-[var(--app-text-muted)]">{prospect.email || 'No email on record'}</p>
                            </div>
                            <span className="rounded-full bg-[var(--app-muted)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--app-text-muted)]">
                              {formatPipelineStatus(prospect.status)}
                            </span>
                          </div>
                          <p className="mt-2 text-sm text-[var(--app-text-muted)]">
                            {(prospect.industry || 'general').replace(/_/g, ' ')}
                            {prospect.city ? ` in ${prospect.city}` : ''}
                          </p>
                          <div className="mt-3 flex flex-wrap items-center gap-2">
                            {typeof prospect.audit_score === 'number' && (
                              <span className="rounded-full bg-brand-purple/12 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-purple dark:text-purple-200">
                                {prospect.audit_score}/100 audit
                              </span>
                            )}
                            {typeof prospect.outreach_stage === 'number' && (
                              <span className="rounded-full bg-[var(--app-muted)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--app-text-muted)]">
                                Stage {prospect.outreach_stage + 1}
                              </span>
                            )}
                            {prospect.sequence_name && (
                              <span className="rounded-full bg-[var(--app-muted)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--app-text-muted)]">
                                {prospect.sequence_name}
                              </span>
                            )}
                          </div>
                          <p className="mt-3 text-sm text-[var(--app-text-muted)]">
                            {prospect.audit_top_leak || 'Audit link attached and ready for the next nudge.'}
                          </p>
                          <p className="mt-2 text-xs text-[var(--app-text-muted)]">
                            {prospect.last_contacted_at
                              ? `Last touch ${formatDateTime(prospect.last_contacted_at)}`
                              : `Added ${formatDateTime(prospect.created_at)}`}
                            {prospect.next_follow_up_at ? ` - Next follow-up ${formatDateTime(prospect.next_follow_up_at)}` : ''}
                          </p>
                        </div>
                      ))
                    ) : (
                      <div className="rounded-[24px] border border-dashed border-[var(--app-border)] px-4 py-10 text-sm text-[var(--app-text-muted)]">
                        No outreach prospects yet.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </section>
          )}

          {activeTab === 'proof' && (
            <section className="space-y-6">
              <div className="grid gap-4 xl:grid-cols-3">
                <FounderTile
                  label="Weekly proof value"
                  value={formatCurrencyGBP(metrics.weeklyEstimatedRevenue)}
                  detail="Visible value generated across current managed clinics this week."
                  accent
                />
                <FounderTile
                  label="Clinics at risk"
                  value={metrics.clinicsAtRisk}
                  detail="Accounts where proof quality or retention signals need intervention."
                />
                <FounderTile
                  label="Stale hot leads"
                  value={metrics.staleHotLeadCount}
                  detail="High-intent leads that still need a manual human touch."
                />
              </div>

              <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
                <div className="surface-panel rounded-[32px] p-6">
                  <p className="page-eyebrow">Recent clinic workspaces</p>
                  <div className="mt-5 space-y-3">
                    {metrics.recentBusinesses.map((business) => (
                      <div key={business.id} className="rounded-[24px] border border-[var(--app-border)] px-4 py-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold text-[var(--app-text)]">{business.name}</p>
                            <p className="text-xs text-[var(--app-text-muted)]">{business.email || 'No email on record'}</p>
                          </div>
                          <span className="rounded-full bg-[var(--app-muted)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--app-text-muted)]">
                            {business.plan}
                          </span>
                        </div>
                        <p className="mt-2 text-sm text-[var(--app-text-muted)]">
                          {(business.industry || 'general').replace(/_/g, ' ')} - {business.active ? 'Active' : 'Inactive'}
                        </p>
                        <div className="mt-3 flex flex-wrap items-center gap-2">
                          <span className="rounded-full bg-[var(--app-muted)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--app-text-muted)]">
                            {business.launchReadinessScore}% ready
                          </span>
                          <span
                            className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] ${
                              business.launchStatus === 'launch_ready'
                                ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-200'
                                : business.launchStatus === 'almost_ready'
                                  ? 'bg-amber-500/15 text-amber-600 dark:text-amber-200'
                                  : 'bg-slate-500/12 text-[var(--app-text-muted)]'
                            }`}
                          >
                            {business.launchStatus.replace(/_/g, ' ')}
                          </span>
                          <span className="rounded-full bg-brand-purple/12 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-purple dark:text-purple-200">
                            {business.activeTemplateCount} live
                          </span>
                          <span
                            className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] ${
                              business.activationStatus === 'live'
                                ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-200'
                                : business.activationStatus === 'ready_to_launch'
                                  ? 'bg-blue-500/15 text-blue-600 dark:text-blue-200'
                                  : business.activationStatus === 'attention'
                                    ? 'bg-red-500/15 text-red-600 dark:text-red-200'
                                    : 'bg-slate-500/12 text-[var(--app-text-muted)]'
                            }`}
                          >
                            {formatActivationStatus(business.activationStatus)}
                          </span>
                          <span
                            className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] ${
                              business.healthStatus === 'healthy'
                                ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-200'
                                : business.healthStatus === 'watch'
                                  ? 'bg-amber-500/15 text-amber-600 dark:text-amber-200'
                                  : 'bg-red-500/15 text-red-600 dark:text-red-200'
                            }`}
                          >
                            {formatHealthStatus(business.healthStatus)}
                          </span>
                          <span className="rounded-full bg-[var(--app-muted)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--app-text-muted)]">
                            {formatChurnRisk(business.churnRisk)}
                          </span>
                          {business.activationAlertCount > 0 && (
                            <span className="rounded-full bg-amber-500/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-amber-600 dark:text-amber-200">
                              {business.activationAlertCount} alert{business.activationAlertCount === 1 ? '' : 's'}
                            </span>
                          )}
                        </div>
                        <div className="mt-3 grid gap-3 sm:grid-cols-3">
                          <MetaStat label="Proof score" value={`${business.proofScore}/100`} />
                          <MetaStat label="Weekly bookings" value={String(business.weeklyBookings)} />
                          <MetaStat label="Weekly proof value" value={formatCurrencyGBP(business.weeklyEstimatedRevenue)} />
                        </div>
                        <p className="mt-3 text-sm leading-7 text-[var(--app-text-muted)]">{business.strongestWin}</p>
                        {business.staleHotLeads > 0 && (
                          <p className="mt-2 text-sm text-amber-700 dark:text-amber-200">
                            {business.staleHotLeads} hot lead{business.staleHotLeads === 1 ? '' : 's'} still need manual follow-up.
                          </p>
                        )}
                        <p className="mt-2 text-xs text-[var(--app-text-muted)]">
                          {formatDateTime(business.created_at)}
                          {business.activationLastSyncedAt ? ` - Activation synced ${formatDateTime(business.activationLastSyncedAt)}` : ''}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="surface-panel rounded-[32px] p-6">
                  <p className="page-eyebrow">Recent audits</p>
                  <div className="mt-5 space-y-3">
                    {metrics.recentAudits.length > 0 ? (
                      metrics.recentAudits.map((audit) => (
                        <div key={audit.id} className="rounded-[24px] border border-[var(--app-border)] px-4 py-4">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="text-sm font-semibold text-[var(--app-text)]">{audit.url}</p>
                              <p className="text-xs text-[var(--app-text-muted)]">{audit.email || 'Email withheld'}</p>
                            </div>
                            <span className="rounded-full bg-brand-purple/12 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-purple dark:text-purple-200">
                              {(audit.overallScore ?? formatAuditScore(audit))}/100
                            </span>
                          </div>
                          <p className="mt-2 text-sm text-[var(--app-text-muted)]">
                            {audit.topLeak || 'Audit captured and ready for follow-up.'}
                          </p>
                          <p className="mt-2 text-xs text-[var(--app-text-muted)]">{formatDateTime(audit.created_at)}</p>
                          <Link
                            href={`/audit/${audit.id}`}
                            className="mt-3 inline-flex text-xs font-semibold uppercase tracking-[0.18em] text-brand-purple hover:text-brand-purple-dark"
                          >
                            Open report
                          </Link>
                        </div>
                      ))
                    ) : (
                      <div className="rounded-[24px] border border-dashed border-[var(--app-border)] px-4 py-10 text-sm text-[var(--app-text-muted)]">
                        No audits recorded yet.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </section>
          )}
        </main>
      </div>
    </div>
  );
}

function FounderTile({
  label,
  value,
  detail,
  accent = false,
}: {
  label: string;
  value: string | number;
  detail: string;
  accent?: boolean;
}) {
  return (
    <div className={`${accent ? 'bg-brand-purple text-white' : 'kpi-tile'}`}>
      <p className={`text-[11px] uppercase tracking-[0.18em] ${accent ? 'text-purple-200' : 'text-[var(--app-text-muted)]'}`}>
        {label}
      </p>
      <h2 className={`mt-3 text-4xl font-semibold ${accent ? 'text-white' : 'text-[var(--app-text)]'}`}>{value}</h2>
      <p className={`mt-3 text-sm leading-6 ${accent ? 'text-purple-100' : 'text-[var(--app-text-muted)]'}`}>{detail}</p>
    </div>
  );
}

function PriorityCard({ title, badge, body }: { title: string; badge: string; body: string }) {
  return (
    <div className="surface-panel rounded-[28px] p-5">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-[var(--app-text)]">{title}</p>
        <span className="rounded-full bg-brand-purple/12 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-purple dark:text-orange-100">
          {badge}
        </span>
      </div>
      <p className="mt-3 text-sm leading-7 text-[var(--app-text-muted)]">{body}</p>
    </div>
  );
}

function MetaStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[22px] border border-[var(--app-border)] bg-[var(--app-muted)] px-4 py-4">
      <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--app-text-muted)]">{label}</p>
      <p className="mt-2 text-sm font-semibold text-[var(--app-text)]">{value}</p>
    </div>
  );
}

function ChecklistRow({ done, title, detail }: { done: boolean; title: string; detail: string }) {
  return (
    <div className="flex gap-4 rounded-[24px] border border-[var(--app-border)] px-4 py-4">
      <span
        className={`mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
          done ? 'bg-emerald-500 text-white' : 'bg-[var(--app-muted)] text-[var(--app-text-muted)]'
        }`}
      >
        {done ? '✓' : '—'}
      </span>
      <div>
        <p className="text-sm font-semibold text-[var(--app-text)]">{title}</p>
        <p className="mt-1 text-sm leading-6 text-[var(--app-text-muted)]">{detail}</p>
      </div>
    </div>
  );
}

function FounderNote({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-[24px] border border-[var(--app-border)] px-4 py-4">
      <p className="text-sm font-semibold text-[var(--app-text)]">{title}</p>
      <p className="mt-2 text-sm leading-7 text-[var(--app-text-muted)]">{body}</p>
    </div>
  );
}

function formatSystemStatus(status: FounderOverviewData['system']['status']) {
  if (status === 'healthy') return 'Production-ready checks';
  if (status === 'local_smoke') return 'Safe local simulation mode';
  return 'Needs operational attention';
}

function formatSystemCheckStatus(status: FounderOverviewData['system']['checks'][number]['status']) {
  return status.replace(/_/g, ' ');
}

function systemCheckTone(status: FounderOverviewData['system']['checks'][number]['status']) {
  if (status === 'healthy' || status === 'configured') {
    return 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-200';
  }
  if (status === 'simulated') {
    return 'bg-blue-500/15 text-blue-600 dark:text-blue-200';
  }
  return 'bg-amber-500/15 text-amber-600 dark:text-amber-200';
}

function AntiFailureCard({
  check,
}: {
  check: ReturnType<typeof buildAntiFailureChecks>[number];
}) {
  const toneClasses =
    check.status === 'healthy'
      ? 'border-emerald-500/30 bg-emerald-500/8'
      : check.status === 'watch'
        ? 'border-amber-500/30 bg-amber-500/8'
        : 'border-red-500/30 bg-red-500/8';

  const badgeClasses =
    check.status === 'healthy'
      ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-200'
      : check.status === 'watch'
        ? 'bg-amber-500/15 text-amber-600 dark:text-amber-200'
        : 'bg-red-500/15 text-red-600 dark:text-red-200';

  const badgeLabel =
    check.status === 'healthy' ? 'healthy' : check.status === 'watch' ? 'watch' : 'risk';

  return (
    <div className={`rounded-[24px] border p-5 ${toneClasses}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-[var(--app-text)]">{check.title}</p>
          <p className="mt-2 text-sm leading-6 text-[var(--app-text-muted)]">{check.risk}</p>
        </div>
        <span className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] ${badgeClasses}`}>
          {badgeLabel}
        </span>
      </div>
      <p className="mt-4 text-sm font-medium text-[var(--app-text)]">{check.summary}</p>
      <p className="mt-2 text-sm leading-6 text-[var(--app-text-muted)]">{check.action}</p>
    </div>
  );
}

function PipelineRow({
  label,
  value,
  max,
  strong = false,
}: {
  label: string;
  value: number;
  max: number;
  strong?: boolean;
}) {
  const width = max > 0 ? Math.max(8, (value / max) * 100) : 8;
  return (
    <div className="flex items-center gap-3">
      <div className="w-40 shrink-0 text-right text-sm text-[var(--app-text-muted)]">{label}</div>
      <div className="relative h-8 flex-1 overflow-hidden rounded-full bg-[var(--app-muted)]">
        <div
          className={`h-full rounded-full ${strong ? 'bg-brand-purple' : 'bg-slate-400 dark:bg-slate-600'}`}
          style={{ width: `${width}%` }}
        />
        <span className="absolute inset-0 flex items-center justify-center text-xs font-semibold text-[var(--app-text)]">
          {value}
        </span>
      </div>
    </div>
  );
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatPipelineStatus(value: string | null) {
  if (!value) return 'new';
  return value.replace(/_/g, ' ');
}

function formatAuditScore(audit: FounderOverviewData['recentAudits'][number]) {
  const values = [audit.score_performance, audit.score_accessibility, audit.score_best_practices, audit.score_seo].filter(
    (score): score is number => typeof score === 'number'
  );

  if (values.length === 0) return 'No';
  return Math.round(values.reduce((sum, score) => sum + score, 0) / values.length);
}
