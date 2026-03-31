import { DashboardLead } from '@/types/dashboard';
import { DashboardSection, SectionEmptyState } from '@/components/dashboard/dashboard-section';

function scoreColor(score: number): string {
  if (score >= 70) return 'text-orange-600';
  if (score >= 40) return 'text-yellow-600';
  return 'text-gray-500';
}

function statusClass(status: string): string {
  const classes: Record<string, string> = {
    new: 'bg-blue-100 text-blue-700',
    contacted: 'bg-yellow-100 text-yellow-700',
    booked: 'bg-green-100 text-green-700',
    lost: 'bg-red-100 text-red-700',
    cold: 'bg-gray-100 text-gray-700',
  };

  return classes[status] || 'bg-gray-100 text-gray-700';
}

export function LeadsTable({ leads }: { leads: DashboardLead[] }) {
  return (
    <DashboardSection title="Leads" description="Recent leads captured from your channels.">
      {leads.length === 0 ? (
        <SectionEmptyState message="No leads yet. New leads will appear here once your widget is live." />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-xs uppercase text-gray-500">
              <tr>
                <th className="px-4 py-3 font-medium">Contact</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Score</th>
                <th className="px-4 py-3 font-medium">Source</th>
                <th className="px-4 py-3 font-medium">Created</th>
              </tr>
            </thead>
            <tbody>
              {leads.map((lead) => (
                <tr key={lead.id} className="border-t">
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900">{lead.name || 'Anonymous lead'}</p>
                    <p className="text-xs text-gray-500">{lead.email || lead.phone || 'No contact details'}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-1 text-xs font-medium capitalize ${statusClass(lead.status)}`}>
                      {lead.status}
                    </span>
                  </td>
                  <td className={`px-4 py-3 font-semibold ${scoreColor(lead.score)}`}>{lead.score}</td>
                  <td className="px-4 py-3 text-gray-600 capitalize">{lead.source || 'chat'}</td>
                  <td className="px-4 py-3 text-gray-500">{new Date(lead.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </DashboardSection>
  );
}
