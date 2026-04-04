'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { formatActivationStatus } from '@/lib/activation-state';
import { formatChurnRisk, formatHealthStatus } from '@/lib/client-health';
import { formatCurrencyGBP } from '@/lib/formatting';
import { DashboardLoading } from '@/components/dashboard/dashboard-loading';
import ROIDashboard from '@/components/roi-dashboard';
import { AppointmentsList } from '@/components/dashboard/appointments-list';
import { ConversationsPreview } from '@/components/dashboard/conversations-preview';
import { LeadsTable } from '@/components/dashboard/leads-table';
import { PortalEmptyState } from '@/components/dashboard/portal-primitives';
import { ReviewsSummary } from '@/components/dashboard/reviews-summary';
import { fetchDashboardData } from '@/services/dashboard.service';
import { DashboardData, DashboardNextAction } from '@/types/dashboard';

const QUICK_LINKS = [
  { href: '/dashboard/leads', label: 'Review leads' },
  { href: '/dashboard/conversations', label: 'Open inbox' },
  { href: '/dashboard/bookings', label: 'Check bookings' },
  { href: '/dashboard/templates', label: 'Setup checklist' },
];

export default function DashboardPage() {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function loadDashboard() {
      try {
        const data = await fetchDashboardData();
        if (!mounted) return;

        setDashboardData(data);
        setErrorMessage(null);
      } catch (error) {
        if (!mounted) return;

        console.error('Failed to load dashboard data:', error);
        setErrorMessage('Unable to load dashboard right now. Please refresh the page.');
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadDashboard();

    return () => {
      mounted = false;
    };
  }, []);

  if (loading) {
    return <DashboardLoading />;
  }

  if (errorMessage || !dashboardData) {
    return (
      <div className="rounded-[24px] border border-red-500/30 bg-red-500/8 p-5 text-sm text-red-600 dark:text-red-300">
        {errorMessage || 'Dashboard is unavailable.'}
      </div>
    );
  }

  const reviewsPending = Math.max(0, dashboardData.reviews.requestsSent - dashboardData.reviews.completed);
  const actionQueueCount =
    dashboardData.overview.hotLeads +
    dashboardData.launchReadiness.missingItems.length +
    dashboardData.activation.alerts.length;
  const liveAutomationCount = [
    dashboardData.automation.hasLeadReply,
    dashboardData.automation.hasReminders,
    dashboardData.automation.hasReviewRequests,
    dashboardData.automation.hasRebooking,
    dashboardData.automation.hasWeeklyReporting,
  ].filter(Boolean).length;
  const automationCoveragePercent = Math.round((liveAutomationCount / 5) * 100);
  const primaryAction = dashboardData.nextActions[0] || null;
  const topRisk =
    dashboardData.activation.alerts[0] ||
    dashboardData.retention.risks[0] ||
    (dashboardData.launchReadiness.missingItems[0]
      ? `Finish ${dashboardData.launchReadiness.missingItems[0]} to remove a launch blocker.`
      : 'No urgent blockers are visible right now.');

  return (
    <div className="space-y-6">
      <header className="grid gap-5 lg:grid-cols-[1.15fr_0.85fr] lg:items-end">
        <div className="space-y-4">
          <div>
            <span className="page-eyebrow">Client portal</span>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight text-[var(--app-text)] sm:text-5xl">
              {dashboardData.businessName}
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-[var(--app-text-muted)]">
              This is the operator view of the clinic: what converted this week, what needs human attention, and what
              Zypflow is already handling automatically.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            {QUICK_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-full border border-[var(--app-border)] bg-[var(--app-surface)] px-4 py-2 text-sm font-semibold text-[var(--app-text)] transition hover:border-brand-purple hover:text-brand-purple"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>

        <div className="surface-panel rounded-[28px] p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="page-eyebrow">Owner digest</p>
              <h2 className="mt-3 text-3xl font-semibold text-[var(--app-text)]">What to pay attention to now</h2>
            </div>
            <span className="rounded-full bg-brand-purple px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-white">
              {automationCoveragePercent}% covered
            </span>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <MiniMeta label="Plan" value={formatPlan(dashboardData.businessPlan)} />
            <MiniMeta label="Industry" value={formatIndustry(dashboardData.businessIndustry)} />
            <MiniMeta label="Role" value={formatRole(dashboardData.businessRole)} />
          </div>
          <div className="mt-4 rounded-[22px] border border-[var(--app-border)] bg-[var(--app-muted)] px-4 py-4">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-semibold text-[var(--app-text)]">Workspace readiness</p>
              <span className="rounded-full bg-brand-purple px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-white">
                {formatActivationStatus(dashboardData.activation.status)}
              </span>
            </div>
            <p className="mt-2 text-sm leading-6 text-[var(--app-text-muted)]">
              {dashboardData.activation.packDeployed
                ? 'The core workflow is installed. This page shows what it is producing and where a human nudge still helps.'
                : 'The workspace is still being prepared. Finish the missing setup so the workflow can run cleanly.'}
            </p>
          </div>
          <div className="mt-4 space-y-3">
            <DigestCard
              label="Best signal this week"
              title={dashboardData.proof.strongestWin}
              detail={`${dashboardData.proof.bookingsCreated} bookings created, ${dashboardData.reviews.completed} reviews completed, and ${formatCurrencyGBP(dashboardData.proof.estimatedRevenue)} in visible proof.`}
            />
            <DigestCard
              label="Watch now"
              title={topRisk}
              detail={
                dashboardData.retention.churnRisk === 'low'
                  ? 'Retention risk is low, so this is mainly about protecting momentum.'
                  : `Retention risk is ${formatChurnRisk(dashboardData.retention.churnRisk).toLowerCase()}, so visible follow-up matters this week.`
              }
            />
          </div>
        </div>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <OverviewTile
          label="Estimated weekly proof"
          value={formatCurrencyGBP(dashboardData.proof.estimatedRevenue)}
          detail={dashboardData.proof.strongestWin}
          accent
        />
        <OverviewTile
          label="Hot leads"
          value={dashboardData.overview.hotLeads}
          detail="High-intent enquiries that deserve personal attention before they cool off."
        />
        <OverviewTile
          label="Appointments protected"
          value={dashboardData.proof.upcomingAppointments}
          detail="Upcoming bookings currently sitting inside reminder and confirmation coverage."
        />
        <OverviewTile
          label="Action queue"
          value={actionQueueCount}
          detail="Hot leads, launch blockers, and activation alerts combined into one number."
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <div className="surface-panel rounded-[32px] p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="page-eyebrow">Owner summary</p>
              <h2 className="mt-3 text-3xl font-semibold text-[var(--app-text)]">The shortest path to keeping this clinic retained</h2>
            </div>
            {primaryAction ? (
              <span className="rounded-full bg-[var(--app-muted)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--app-text-muted)]">
                {primaryAction.tone}
              </span>
            ) : null}
          </div>
          <div className="mt-5 space-y-3">
            <DigestCard
              label="Best signal"
              title={dashboardData.proof.strongestWin}
              detail="This is the proof line worth repeating when the owner asks whether the system is working."
            />
            <DigestCard
              label="Next move"
              title={primaryAction?.title || 'No urgent action in the queue.'}
              detail={
                primaryAction?.description ||
                'The current setup is stable enough that the owner only needs to monitor proof and retention.'
              }
            />
            <DigestCard
              label="Risk to remove"
              title={topRisk}
              detail="Anything shown here is slowing launch confidence, visible proof, or the chance of renewal."
            />
          </div>
        </div>

        <div className="surface-panel rounded-[32px] p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="page-eyebrow">Automation coverage</p>
              <h2 className="mt-3 text-3xl font-semibold text-[var(--app-text)]">How much of the revenue loop is already handled</h2>
            </div>
            <span className="rounded-full bg-brand-purple px-3 py-1 text-xs font-semibold text-white">
              {liveAutomationCount}/5 live
            </span>
          </div>
          <p className="mt-4 text-sm leading-7 text-[var(--app-text-muted)]">
            The closer this gets to full coverage, the less the clinic depends on manual follow-up and the easier it is to retain them.
          </p>
          <div className="mt-5 h-3 rounded-full bg-[var(--app-muted)]">
            <div
              className="h-3 rounded-full bg-brand-purple transition-all"
              style={{ width: `${automationCoveragePercent}%` }}
            />
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <AutomationPill label="Lead reply" active={dashboardData.automation.hasLeadReply} />
            <AutomationPill label="Reminders" active={dashboardData.automation.hasReminders} />
            <AutomationPill label="Review requests" active={dashboardData.automation.hasReviewRequests} />
            <AutomationPill label="Rebooking" active={dashboardData.automation.hasRebooking} />
            <AutomationPill label="Weekly reporting" active={dashboardData.automation.hasWeeklyReporting} />
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <div className="surface-panel rounded-[32px] p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="page-eyebrow">This week</p>
              <h2 className="mt-3 text-3xl font-semibold text-[var(--app-text)]">What the system produced</h2>
            </div>
            <span className="rounded-full bg-brand-purple px-3 py-1 text-xs font-semibold text-white">
              {dashboardData.proof.periodLabel}
            </span>
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <ProofStat label="New leads" value={dashboardData.proof.newLeads} />
            <ProofStat label="Bookings created" value={dashboardData.proof.bookingsCreated} accent />
            <ProofStat label="Follow-ups sent" value={dashboardData.proof.followUpsSent} />
            <ProofStat label="Review requests" value={dashboardData.proof.reviewRequestsSent} />
            <ProofStat label="Reviews completed" value={dashboardData.proof.reviewsCompleted} />
            <ProofStat label="Average lead score" value={dashboardData.proof.averageLeadScore !== null ? `${dashboardData.proof.averageLeadScore}/100` : 'No data'} />
          </div>
          <div className="mt-5 rounded-[24px] border border-[var(--app-border)] bg-[var(--app-muted)] px-4 py-4">
            <p className="text-sm font-semibold text-[var(--app-text)]">Strongest win</p>
            <p className="mt-2 text-sm leading-7 text-[var(--app-text-muted)]">{dashboardData.proof.strongestWin}</p>
          </div>
        </div>

        <div className="surface-panel rounded-[32px] p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="page-eyebrow">Focus today</p>
              <h2 className="mt-3 text-3xl font-semibold text-[var(--app-text)]">The shortest path to keeping momentum</h2>
            </div>
            <span className="rounded-full bg-[var(--app-muted)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--app-text-muted)]">
              {dashboardData.nextActions.length} actions
            </span>
          </div>
          <div className="mt-5 space-y-3">
            {dashboardData.nextActions.length > 0 ? (
              dashboardData.nextActions.map((action) => (
                <ActionRow key={action.title} action={action} />
              ))
            ) : (
              <PortalEmptyState
                title="No immediate follow-up is needed."
                description="The system is handling the current queue cleanly. New owner actions will appear here when a lead, booking, or launch task needs attention."
              />
            )}
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <MetaChip label="Reviews pending" value={String(reviewsPending)} />
            <MetaChip label="Health" value={formatHealthStatus(dashboardData.retention.healthStatus)} />
            <MetaChip label="Churn risk" value={formatChurnRisk(dashboardData.retention.churnRisk)} />
            <MetaChip label="Live automations" value={String(dashboardData.automation.activeTemplates)} />
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <div className="surface-panel rounded-[32px] p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="page-eyebrow">Retention radar</p>
              <h2 className="mt-3 text-3xl font-semibold text-[var(--app-text)]">
                {formatHealthStatus(dashboardData.retention.healthStatus)}
              </h2>
            </div>
            <span className="rounded-full bg-brand-purple px-3 py-1 text-xs font-semibold text-white">
              {dashboardData.retention.score}/100
            </span>
          </div>
          <p className="mt-4 text-sm leading-7 text-[var(--app-text-muted)]">{dashboardData.retention.summary}</p>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <MetaChip label="Churn risk" value={formatChurnRisk(dashboardData.retention.churnRisk)} />
            <MetaChip label="Health state" value={formatHealthStatus(dashboardData.retention.healthStatus)} />
          </div>
          {dashboardData.retention.risks.length > 0 ? (
            <div className="mt-5 space-y-3">
              {dashboardData.retention.risks.map((risk) => (
                <div
                  key={risk}
                  className="rounded-[22px] border border-amber-500/25 bg-amber-500/8 px-4 py-3 text-sm text-amber-700 dark:text-amber-200"
                >
                  {risk}
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-5 rounded-[22px] border border-emerald-500/25 bg-emerald-500/8 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-200">
              No retention risks are showing right now. The current proof signals look stable.
            </div>
          )}
          <div className="mt-5 space-y-3">
            {dashboardData.retention.actions.length > 0 ? (
              dashboardData.retention.actions.map((action) => (
                <div key={action} className="rounded-[22px] border border-[var(--app-border)] bg-[var(--app-muted)] px-4 py-3 text-sm text-[var(--app-text-muted)]">
                  {action}
                </div>
              ))
            ) : (
              <PortalEmptyState
                title="No extra retention actions are queued."
                description="When review volume softens, rebooking slows, or churn risk rises, the next best moves will show up here."
              />
            )}
          </div>
        </div>

        <div className="surface-panel rounded-[32px] p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="page-eyebrow">What is running for you</p>
              <h2 className="mt-3 text-3xl font-semibold text-[var(--app-text)]">Which parts of the clinic workflow are already covered</h2>
            </div>
            <span className="rounded-full bg-brand-purple px-3 py-1 text-xs font-semibold text-white">
              {dashboardData.automation.activeTemplates} live
            </span>
          </div>
          <div className="mt-5 rounded-[24px] border border-[var(--app-border)] bg-[var(--app-muted)] px-4 py-4">
              <p className="text-sm font-semibold text-[var(--app-text)]">Owner view</p>
              <p className="mt-2 text-sm leading-7 text-[var(--app-text-muted)]">
              You should be able to glance at this page, see what happened, and know exactly when a human follow-up still matters.
              </p>
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <div className="surface-panel rounded-[32px] p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="page-eyebrow">Operating timeline</p>
              <h2 className="mt-3 text-3xl font-semibold text-[var(--app-text)]">What changed most recently</h2>
            </div>
            <Link
              href="/dashboard/analytics"
              className="rounded-full border border-[var(--app-border)] px-4 py-2 text-sm font-semibold text-[var(--app-text)] transition hover:border-brand-purple hover:text-brand-purple"
            >
              Open proof view
            </Link>
          </div>
          <div className="mt-5 space-y-3">
            {dashboardData.activityFeed.length > 0 ? (
              dashboardData.activityFeed.map((item) => (
                <Link
                  key={item.id}
                  href={item.href}
                  className="block rounded-[24px] border border-[var(--app-border)] bg-[var(--app-muted)] px-4 py-4 transition hover:border-brand-purple/30 hover:bg-brand-purple/5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-[var(--app-text)]">{item.title}</p>
                      <p className="mt-2 text-sm leading-6 text-[var(--app-text-muted)]">{item.detail}</p>
                    </div>
                    <span className="rounded-full bg-[var(--app-surface)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--app-text-muted)]">
                      {formatActivityType(item.type)}
                    </span>
                  </div>
                  <p className="mt-3 text-xs text-[var(--app-text-soft)]">{formatTimelineStamp(item.timestamp)}</p>
                </Link>
              ))
            ) : (
              <div className="rounded-[24px] border border-dashed border-[var(--app-border)] px-4 py-8 text-sm text-[var(--app-text-muted)]">
                Once live activity starts flowing, this timeline becomes the quickest read on what changed, what converted, and what needs attention next.
              </div>
            )}
          </div>
        </div>

        <div className="surface-panel rounded-[32px] p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="page-eyebrow">Revenue loop</p>
              <h2 className="mt-3 text-3xl font-semibold text-[var(--app-text)]">The chain that keeps clinics paying</h2>
            </div>
            <span className="rounded-full bg-brand-purple px-3 py-1 text-xs font-semibold text-white">
              Owner-light by design
            </span>
          </div>
          <div className="mt-5 space-y-3">
            <LoopStep
              title="Capture demand fast"
              detail={`${dashboardData.overview.totalLeads} leads tracked so far. The faster this number grows, the easier it is to prove value.`}
            />
            <LoopStep
              title="Protect every appointment"
              detail={`${dashboardData.proof.upcomingAppointments} appointments are currently sitting inside reminder coverage and launch visibility.`}
            />
            <LoopStep
              title="Create visible proof"
              detail={`${dashboardData.reviews.completed} reviews completed so far, with ${dashboardData.reviews.requestsSent} requests sent through the workflow.`}
            />
            <LoopStep
              title="Bring patients back"
              detail={dashboardData.retention.summary}
            />
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <div className="surface-panel rounded-[32px] p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="page-eyebrow">Go-live checklist</p>
              <h2 className="mt-3 text-3xl font-semibold text-[var(--app-text)]">
                {dashboardData.launchReadiness.packName}
              </h2>
            </div>
            <span className="rounded-full bg-brand-purple px-3 py-1 text-xs font-semibold text-white">
              {dashboardData.launchReadiness.score}% ready
            </span>
          </div>
          <p className="mt-4 text-sm leading-7 text-[var(--app-text-muted)]">
            {dashboardData.launchReadiness.completedCount} of {dashboardData.launchReadiness.totalCount} launch steps are
            complete.
          </p>
          <div className="mt-5 h-3 rounded-full bg-[var(--app-muted)]">
            <div
              className="h-3 rounded-full bg-brand-purple transition-all"
              style={{ width: `${dashboardData.launchReadiness.score}%` }}
            />
          </div>
          {dashboardData.launchReadiness.missingItems.length > 0 ? (
            <div className="mt-5 rounded-[24px] border border-[var(--app-border)] bg-[var(--app-muted)] px-4 py-4">
              <p className="text-sm font-semibold text-[var(--app-text)]">Still missing</p>
              <p className="mt-2 text-sm leading-6 text-[var(--app-text-muted)]">
                {dashboardData.launchReadiness.missingItems.join(', ')}
              </p>
            </div>
          ) : (
            <div className="mt-5 rounded-[24px] border border-emerald-500/25 bg-emerald-500/8 px-4 py-4 text-sm text-emerald-700 dark:text-emerald-200">
              The launch checklist is complete. This workspace is ready for a clean automated rollout.
            </div>
          )}
          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              href="/dashboard/templates"
              className="rounded-full bg-brand-purple px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-purple/90"
            >
              Open setup checklist
            </Link>
            <Link
              href="/onboarding"
              className="rounded-full border border-[var(--app-border)] px-4 py-2 text-sm font-semibold text-[var(--app-text)] transition hover:border-brand-purple hover:text-brand-purple"
            >
              Finish clinic setup
            </Link>
          </div>
        </div>

        <div className="surface-panel rounded-[32px] p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="page-eyebrow">Setup progress</p>
              <h2 className="mt-3 text-3xl font-semibold text-[var(--app-text)] capitalize">
                {formatActivationStatus(dashboardData.activation.status)}
              </h2>
            </div>
            <span className="rounded-full bg-brand-purple px-3 py-1 text-xs font-semibold text-white">
              {dashboardData.activation.score}% synced
            </span>
          </div>
          <p className="mt-4 text-sm leading-7 text-[var(--app-text-muted)]">
              {dashboardData.activation.packDeployed
                ? 'Your core workflow is deployed. The remaining blockers are listed below.'
                : 'The workspace still needs a few setup steps before the workflow can be trusted live.'}
          </p>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <AutomationPill label="Billing" active={dashboardData.activation.billingReady} />
            <AutomationPill label="Widget" active={dashboardData.activation.widgetInstalled} />
            <AutomationPill label="Pack deployed" active={dashboardData.activation.packDeployed} />
            <AutomationPill label="Auto-deployed" active={dashboardData.activation.autoDeployed} />
          </div>
          {dashboardData.activation.alerts.length > 0 ? (
            <div className="mt-5 space-y-3">
              {dashboardData.activation.alerts.map((alert) => (
                <div key={alert} className="rounded-[22px] border border-amber-500/25 bg-amber-500/8 px-4 py-3 text-sm text-amber-700 dark:text-amber-200">
                  {alert}
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-5 rounded-[22px] border border-emerald-500/25 bg-emerald-500/8 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-200">
              No activation alerts are open. Billing, widget, and deployment signals are syncing cleanly.
            </div>
          )}
          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              href="/dashboard/settings"
              className="rounded-full bg-brand-purple px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-purple/90"
            >
              Open activation settings
            </Link>
            <Link
              href="/dashboard/templates"
              className="rounded-full border border-[var(--app-border)] px-4 py-2 text-sm font-semibold text-[var(--app-text)] transition hover:border-brand-purple hover:text-brand-purple"
            >
              Review setup checklist
            </Link>
          </div>
        </div>
      </section>

      <section className="surface-panel rounded-[32px] p-6">
        <p className="page-eyebrow">Launch checklist</p>
        <h2 className="mt-3 text-3xl font-semibold text-[var(--app-text)]">The pieces that turn automation into proof</h2>
        <div className="mt-5 space-y-3">
          {dashboardData.checklist.map((item) => (
            <div
              key={item.id}
              className="flex gap-4 rounded-[24px] border border-[var(--app-border)] px-4 py-4"
            >
              <span
                className={`mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                  item.complete
                    ? 'bg-emerald-500 text-white'
                    : 'bg-[var(--app-muted)] text-[var(--app-text-muted)]'
                }`}
              >
                {item.complete ? 'OK' : 'TO'}
              </span>
              <div>
                <p className="text-sm font-semibold text-[var(--app-text)]">{item.label}</p>
                <p className="mt-1 text-sm leading-6 text-[var(--app-text-muted)]">{item.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <LeadsTable leads={dashboardData.leads} />

      <div className="grid gap-6 lg:grid-cols-2">
        <ConversationsPreview conversations={dashboardData.conversations} />
        <AppointmentsList appointments={dashboardData.appointments} />
      </div>

      <ReviewsSummary reviews={dashboardData.reviews} />

      {dashboardData.businessId && (
        <ROIDashboard orgId={dashboardData.businessId} />
      )}
    </div>
  );
}

function formatPlan(plan: string) {
  return plan === 'trial' ? 'Founding setup' : plan.replace(/_/g, ' ');
}

function formatIndustry(industry: string | null) {
  if (!industry) return 'General clinic';
  return industry.replace(/_/g, ' ');
}

function formatRole(role: string | null) {
  if (!role) return 'Owner';
  return role.charAt(0).toUpperCase() + role.slice(1);
}

function MiniMeta({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[20px] border border-[var(--app-border)] bg-[var(--app-muted)] px-4 py-3">
      <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--app-text-muted)]">{label}</p>
      <p className="mt-2 text-sm font-semibold capitalize text-[var(--app-text)]">{value}</p>
    </div>
  );
}

function DigestCard({
  label,
  title,
  detail,
}: {
  label: string;
  title: string;
  detail: string;
}) {
  return (
    <div className="rounded-[22px] border border-[var(--app-border)] bg-[var(--app-muted)] px-4 py-4">
      <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--app-text-muted)]">{label}</p>
      <p className="mt-2 text-sm font-semibold leading-6 text-[var(--app-text)]">{title}</p>
      <p className="mt-2 text-sm leading-6 text-[var(--app-text-muted)]">{detail}</p>
    </div>
  );
}

function OverviewTile({
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
    <div className={accent ? 'rounded-3xl bg-brand-purple p-5 text-white shadow-[var(--app-shadow)]' : 'kpi-tile'}>
      <p className={`text-[11px] uppercase tracking-[0.18em] ${accent ? 'text-orange-100' : 'text-[var(--app-text-muted)]'}`}>
        {label}
      </p>
      <h2 className={`mt-3 text-4xl font-semibold ${accent ? 'text-white' : 'text-[var(--app-text)]'}`}>{value}</h2>
      <p className={`mt-3 text-sm leading-6 ${accent ? 'text-orange-50' : 'text-[var(--app-text-muted)]'}`}>{detail}</p>
    </div>
  );
}

function AutomationPill({ label, active }: { label: string; active: boolean }) {
  return (
    <div className="rounded-[22px] border border-[var(--app-border)] bg-[var(--app-muted)] px-4 py-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-[var(--app-text)]">{label}</p>
        <span
          className={`rounded-full px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] ${
            active
              ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-300'
              : 'bg-slate-500/12 text-[var(--app-text-muted)]'
          }`}
        >
          {active ? 'Live' : 'Pending'}
        </span>
      </div>
    </div>
  );
}

function ProofStat({ label, value, accent = false }: { label: string; value: string | number; accent?: boolean }) {
  return (
    <div className={`rounded-[22px] border px-4 py-4 ${accent ? 'border-brand-purple/25 bg-brand-purple/8' : 'border-[var(--app-border)] bg-[var(--app-muted)]'}`}>
      <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--app-text-muted)]">{label}</p>
      <p className={`mt-2 text-2xl font-semibold ${accent ? 'text-brand-purple dark:text-orange-100' : 'text-[var(--app-text)]'}`}>{value}</p>
    </div>
  );
}

function MetaChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[22px] border border-[var(--app-border)] bg-[var(--app-muted)] px-4 py-4">
      <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--app-text-muted)]">{label}</p>
      <p className="mt-2 text-sm font-semibold text-[var(--app-text)]">{value}</p>
    </div>
  );
}

function ActionRow({ action }: { action: DashboardNextAction }) {
  const toneClass =
    action.tone === 'urgent'
      ? 'border-red-500/30 bg-red-500/8'
      : action.tone === 'focus'
        ? 'border-amber-500/30 bg-amber-500/8'
        : 'border-emerald-500/30 bg-emerald-500/8';

  const eyebrow =
    action.tone === 'urgent' ? 'Do this first' : action.tone === 'focus' ? 'Focus next' : 'Momentum';

  return (
    <div className={`rounded-[28px] border p-5 ${toneClass}`}>
      <p className="page-eyebrow">{eyebrow}</p>
      <div className="mt-3 flex items-start justify-between gap-4">
        <div>
          <h3 className="text-xl font-semibold text-[var(--app-text)]">{action.title}</h3>
          <p className="mt-2 text-sm leading-7 text-[var(--app-text-muted)]">{action.description}</p>
          <p className="mt-2 text-xs text-[var(--app-text-soft)]">{action.helper}</p>
        </div>
        <span className="rounded-full bg-[var(--app-surface)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--app-text-muted)]">
          Next
        </span>
      </div>
      <div className="mt-4">
        <Link
          href={action.href}
          className="inline-flex rounded-full bg-[var(--app-surface)] px-4 py-2 text-sm font-semibold text-[var(--app-text)] transition hover:border-brand-purple hover:text-brand-purple"
        >
          {action.ctaLabel}
        </Link>
      </div>
    </div>
  );
}

function LoopStep({ title, detail }: { title: string; detail: string }) {
  return (
    <div className="rounded-[24px] border border-[var(--app-border)] bg-[var(--app-muted)] px-4 py-4">
      <p className="text-sm font-semibold text-[var(--app-text)]">{title}</p>
      <p className="mt-2 text-sm leading-6 text-[var(--app-text-muted)]">{detail}</p>
    </div>
  );
}

function formatActivityType(type: DashboardData['activityFeed'][number]['type']) {
  if (type === 'lead') return 'Lead';
  if (type === 'conversation') return 'Inbox';
  if (type === 'appointment') return 'Booking';
  return 'Review';
}

function formatTimelineStamp(timestamp: string) {
  return new Date(timestamp).toLocaleString('en-GB', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}
