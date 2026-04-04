import Link from 'next/link';
import { DashboardAppointment } from '@/types/dashboard';
import { DashboardSection, SectionEmptyState } from '@/components/dashboard/dashboard-section';

function appointmentStatusClass(status: string): string {
  const styles: Record<string, string> = {
    confirmed: 'bg-emerald-500/12 text-emerald-600 dark:text-emerald-300',
    completed: 'bg-blue-500/12 text-blue-600 dark:text-blue-300',
    cancelled: 'bg-red-500/12 text-red-600 dark:text-red-300',
    no_show: 'bg-orange-500/12 text-orange-600 dark:text-orange-300',
  };

  return styles[status] || 'bg-slate-500/12 text-slate-600 dark:text-slate-300';
}

export function AppointmentsList({ appointments }: { appointments: DashboardAppointment[] }) {
  return (
    <DashboardSection
      title="Appointments"
      description="Upcoming and recent bookings."
      action={
        <Link
          href="/dashboard/bookings"
          className="rounded-full border border-[var(--app-border)] px-3 py-2 text-xs font-semibold text-[var(--app-text-muted)] transition hover:border-brand-purple hover:text-brand-purple"
        >
          Open bookings
        </Link>
      }
    >
      {appointments.length === 0 ? (
        <SectionEmptyState
          title="No bookings are scheduled yet."
          message="As soon as the clinic starts converting leads, the appointment queue and reminder coverage will appear here."
          action={
            <Link
              href="/dashboard/templates"
              className="rounded-full bg-brand-purple px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-purple-dark"
            >
              Turn on reminders
            </Link>
          }
        />
      ) : (
        <ul className="divide-y divide-[var(--app-border)]">
          {appointments.map((appointment) => (
            <li key={appointment.id} className="flex items-center justify-between gap-3 px-5 py-4">
              <div>
                <p className="text-sm font-medium text-[var(--app-text)]">{appointment.leadName}</p>
                <p className="text-xs text-[var(--app-text-muted)]">{appointment.service}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-[var(--app-text)]">{new Date(appointment.datetime).toLocaleDateString()}</p>
                <span
                  className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium capitalize ${appointmentStatusClass(appointment.status)}`}
                >
                  {appointment.status.replace('_', ' ')}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </DashboardSection>
  );
}
