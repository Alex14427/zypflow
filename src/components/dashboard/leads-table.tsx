import Link from 'next/link';
import { DashboardLead } from '@/types/dashboard';
import { DashboardSection, SectionEmptyState } from '@/components/dashboard/dashboard-section';

function scoreColor(score: number): string {
  if (score >= 70) return 'text-orange-500';
  if (score >= 40) return 'text-amber-500';
  return 'text-[var(--app-text-muted)]';
}

function statusClass(status: string): string {
  const classes: Record<string, string> = {
    new: 'bg-blue-500/12 text-blue-600 dark:text-blue-300',
    contacted: 'bg-amber-500/12 text-amber-600 dark:text-amber-300',
    booked: 'bg-emerald-500/12 text-emerald-600 dark:text-emerald-300',
    lost: 'bg-red-500/12 text-red-600 dark:text-red-300',
    cold: 'bg-slate-500/12 text-slate-600 dark:text-slate-300',
  };

  return classes[status] || 'bg-slate-500/12 text-slate-600 dark:text-slate-300';
}

export function LeadsTable({ leads }: { leads: DashboardLead[] }) {
  return (
    <DashboardSection
      title="Leads"
      description="Recent leads captured from your channels."
      action={
        <Link
          href="/dashboard/leads"
          className="rounded-full border border-[var(--app-border)] px-3 py-2 text-xs font-semibold text-[var(--app-text-muted)] transition hover:border-brand-purple hover:text-brand-purple"
        >
          Open full pipeline
        </Link>
      }
    >
      {leads.length === 0 ? (
        <SectionEmptyState
          title="The pipeline is waiting for its first enquiry."
          message="Once the widget and setup checklist are complete, every new lead will appear here with source, score, and booking status."
          action={
            <Link
              href="/dashboard/templates"
              className="rounded-full bg-brand-purple px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-purple-dark"
            >
              Finish setup checklist
            </Link>
          }
        />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-[var(--app-muted)] text-xs uppercase text-[var(--app-text-muted)]">
              <tr>
                <th className="px-5 py-3 font-medium">Contact</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium">Score</th>
                <th className="px-5 py-3 font-medium">Source</th>
                <th className="px-5 py-3 font-medium">Created</th>
              </tr>
            </thead>
            <tbody>
              {leads.map((lead) => (
                <tr key={lead.id} className="border-t border-[var(--app-border)]">
                  <td className="px-5 py-4">
                    <p className="font-medium text-[var(--app-text)]">{lead.name || 'Anonymous lead'}</p>
                    <p className="text-xs text-[var(--app-text-muted)]">{lead.email || lead.phone || 'No contact details'}</p>
                  </td>
                  <td className="px-5 py-4">
                    <span className={`rounded-full px-2 py-1 text-xs font-medium capitalize ${statusClass(lead.status)}`}>
                      {lead.status}
                    </span>
                  </td>
                  <td className={`px-5 py-4 font-semibold ${scoreColor(lead.score)}`}>{lead.score}</td>
                  <td className="px-5 py-4 capitalize text-[var(--app-text-muted)]">{lead.source || 'chat'}</td>
                  <td className="px-5 py-4 text-[var(--app-text-muted)]">{new Date(lead.createdAt).toLocaleDateString('en-GB')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </DashboardSection>
  );
}
