import { DashboardAppointment } from '@/types/dashboard';
import { DashboardSection, SectionEmptyState } from '@/components/dashboard/dashboard-section';

function appointmentStatusClass(status: string): string {
  const styles: Record<string, string> = {
    confirmed: 'bg-green-100 text-green-700',
    completed: 'bg-blue-100 text-blue-700',
    cancelled: 'bg-red-100 text-red-700',
    no_show: 'bg-orange-100 text-orange-700',
  };

  return styles[status] || 'bg-gray-100 text-gray-700';
}

export function AppointmentsList({ appointments }: { appointments: DashboardAppointment[] }) {
  return (
    <DashboardSection title="Appointments" description="Upcoming and recent bookings.">
      {appointments.length === 0 ? (
        <SectionEmptyState message="No appointments yet. Bookings will appear here once customers schedule." />
      ) : (
        <ul className="divide-y">
          {appointments.map((appointment) => (
            <li key={appointment.id} className="flex items-center justify-between gap-3 px-4 py-3">
              <div>
                <p className="text-sm font-medium text-gray-900">{appointment.leadName}</p>
                <p className="text-xs text-gray-500">{appointment.service}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-900">{new Date(appointment.datetime).toLocaleDateString()}</p>
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
