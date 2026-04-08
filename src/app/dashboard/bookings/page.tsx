'use client';

import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { resolveCurrentBusiness } from '@/lib/current-business';
import {
  PortalEmptyState,
  PortalMetricCard,
  PortalMetricGrid,
  PortalPageHeader,
  PortalPanel,
  PortalSegmentedControl,
  PortalStatusPill,
} from '@/components/dashboard/portal-primitives';

interface Appointment {
  id: string;
  service: string;
  datetime: string;
  duration_minutes: number;
  status: string;
  leads: { name: string; email: string; phone: string } | null;
}

type BookingTab = 'upcoming' | 'past';

export default function BookingsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<BookingTab>('upcoming');

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const { business } = await resolveCurrentBusiness();
        const orgFilter = `org_id.eq.${business.id},business_id.eq.${business.id}`;

        const { data, error: appointmentsError } = await supabase
          .from('appointments')
          .select('id, service, datetime, duration_minutes, status, leads(name, email, phone)')
          .or(orgFilter)
          .order('datetime', { ascending: false })
          .limit(100);

        if (appointmentsError) throw appointmentsError;
        setAppointments((data as unknown as Appointment[]) || []);
        setError(null);
      } catch (loadError) {
        console.error('Failed to load appointments:', loadError);
        setError(loadError instanceof Error ? loadError.message : 'Unable to load bookings.');
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  const now = useMemo(() => new Date(), []);
  const upcoming = useMemo(
    () => appointments.filter((appointment) => new Date(appointment.datetime) >= now),
    [appointments, now]
  );
  const past = useMemo(
    () => appointments.filter((appointment) => new Date(appointment.datetime) < now),
    [appointments, now]
  );
  const shown = tab === 'upcoming' ? upcoming : past;
  const completed = useMemo(
    () => appointments.filter((appointment) => appointment.status === 'completed').length,
    [appointments]
  );
  const noShows = useMemo(
    () => appointments.filter((appointment) => appointment.status === 'no_show').length,
    [appointments]
  );

  async function updateStatus(appointmentId: string, newStatus: string) {
    const prev = appointments.find((a) => a.id === appointmentId);
    setAppointments((current) =>
      current.map((appointment) =>
        appointment.id === appointmentId ? { ...appointment, status: newStatus } : appointment
      )
    );
    const { error } = await supabase.from('appointments').update({ status: newStatus }).eq('id', appointmentId);
    if (error) {
      // Revert on failure
      if (prev) {
        setAppointments((current) =>
          current.map((appointment) =>
            appointment.id === appointmentId ? { ...appointment, status: prev.status } : appointment
          )
        );
      }
    }
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-purple border-t-transparent" />
      </div>
    );
  }

  return (
    <div>
      <PortalPageHeader
        eyebrow="Bookings"
        title="Protected appointments, clean schedules, fewer drop-offs."
        description="A clinic owner should be able to glance at this page and feel in control: what is upcoming, what completed, and where reminder or confirmation friction still exists."
        meta={
          <>
            <PortalStatusPill tone={noShows > 0 ? 'warning' : 'success'}>
              {noShows > 0 ? `${noShows} no-shows logged` : 'No no-shows in this dataset'}
            </PortalStatusPill>
            <PortalStatusPill>{upcoming.length} upcoming appointments</PortalStatusPill>
          </>
        }
      />

      {error ? (
        <PortalPanel title="Bookings unavailable" description="The appointment feed could not be loaded.">
          <PortalEmptyState title="We couldn't load the booking schedule." description={error} />
        </PortalPanel>
      ) : (
        <>
          <PortalMetricGrid>
            <PortalMetricCard
              label="Upcoming"
              value={upcoming.length}
              description="Appointments still to protect with reminders and confirmations."
              icon={<CalendarIcon className="h-5 w-5" />}
            />
            <PortalMetricCard
              label="Completed"
              value={completed}
              description="Appointments that made it through the pipeline successfully."
              tone="success"
              icon={<CheckIcon className="h-5 w-5" />}
            />
            <PortalMetricCard
              label="No-shows"
              value={noShows}
              description="Useful pressure signal for reminder quality and booking hygiene."
              tone={noShows > 0 ? 'warning' : 'default'}
              icon={<AlertIcon className="h-5 w-5" />}
            />
            <PortalMetricCard
              label="Visible view"
              value={shown.length}
              description={tab === 'upcoming' ? 'Appointments still ahead of the clinic.' : 'Historical appointments for follow-up and review requests.'}
              icon={<StackIcon className="h-5 w-5" />}
            />
          </PortalMetricGrid>

          <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <PortalSegmentedControl
              value={tab}
              onChange={setTab}
              options={[
                { value: 'upcoming', label: 'Upcoming', count: upcoming.length },
                { value: 'past', label: 'Past', count: past.length },
              ]}
            />
            <div className="text-sm text-[var(--app-text-muted)]">
              Keep this view clean: appointment protection is one of the fastest ways to prove client ROI.
            </div>
          </div>

          <PortalPanel
            title={tab === 'upcoming' ? 'Upcoming appointments' : 'Past appointments'}
            description={
              tab === 'upcoming'
                ? 'These are the bookings worth protecting with reminders, confirmations, and reschedules.'
                : 'Use the historical view to track show rate, review requests, and rebooking potential.'
            }
          >
            {shown.length === 0 ? (
              <PortalEmptyState
                title={tab === 'upcoming' ? 'No upcoming appointments yet.' : 'No past appointments logged yet.'}
                description={
                  tab === 'upcoming'
                    ? 'As soon as leads start converting, booked appointments will appear here so the clinic can see what is protected and what is at risk.'
                    : 'Once appointments have happened, this view becomes useful for follow-up, reviews, and rebooking analysis.'
                }
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-[var(--app-muted)] text-left text-[var(--app-text-soft)]">
                    <tr>
                      <th className="px-5 py-4 font-semibold">Customer</th>
                      <th className="px-5 py-4 font-semibold">Contact</th>
                      <th className="px-5 py-4 font-semibold">Service</th>
                      <th className="px-5 py-4 font-semibold">Date &amp; time</th>
                      <th className="px-5 py-4 font-semibold">Duration</th>
                      <th className="px-5 py-4 font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {shown.map((appointment) => (
                      <tr key={appointment.id} className="border-t border-[var(--app-border)] transition hover:bg-[var(--app-muted)]/70">
                        <td className="px-5 py-4">
                          <p className="font-semibold text-[var(--app-text)]">{appointment.leads?.name || 'Anonymous booking'}</p>
                        </td>
                        <td className="px-5 py-4 text-[var(--app-text-muted)]">
                          <div>{appointment.leads?.email || 'No email captured'}</div>
                          <div className="mt-1 text-xs text-[var(--app-text-soft)]">{appointment.leads?.phone || 'No phone captured'}</div>
                        </td>
                        <td className="px-5 py-4 text-[var(--app-text)]">{appointment.service || 'Consultation'}</td>
                        <td className="px-5 py-4 text-[var(--app-text-muted)]">
                          <div>
                            {new Date(appointment.datetime).toLocaleDateString('en-GB', {
                              weekday: 'short',
                              day: 'numeric',
                              month: 'short',
                            })}
                          </div>
                          <div className="mt-1 text-xs text-[var(--app-text-soft)]">
                            {new Date(appointment.datetime).toLocaleTimeString('en-GB', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </div>
                        </td>
                        <td className="px-5 py-4 text-[var(--app-text-muted)]">
                          {appointment.duration_minutes ? `${appointment.duration_minutes} min` : 'Not set'}
                        </td>
                        <td className="px-5 py-4">
                          <select
                            value={appointment.status}
                            onChange={(event) => updateStatus(appointment.id, event.target.value)}
                            aria-label={`Update status for ${appointment.leads?.name || 'appointment'}`}
                            className={`rounded-full border-0 px-3 py-2 text-xs font-semibold outline-none ${statusClass(appointment.status)}`}
                          >
                            {['confirmed', 'completed', 'cancelled', 'no_show'].map((status) => (
                              <option key={status} value={status}>
                                {status.replace('_', ' ')}
                              </option>
                            ))}
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </PortalPanel>
        </>
      )}
    </div>
  );
}

function statusClass(status: string) {
  if (status === 'confirmed') return 'bg-emerald-500/12 text-emerald-700 dark:text-emerald-300';
  if (status === 'completed') return 'bg-sky-500/12 text-sky-700 dark:text-sky-300';
  if (status === 'cancelled') return 'bg-rose-500/12 text-rose-700 dark:text-rose-300';
  if (status === 'no_show') return 'bg-amber-500/12 text-amber-700 dark:text-amber-300';
  return 'bg-[var(--app-muted)] text-[var(--app-text-muted)]';
}

function CalendarIcon({ className }: { className?: string }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>;
}

function CheckIcon({ className }: { className?: string }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M5 13l4 4L19 7" /></svg>;
}

function AlertIcon({ className }: { className?: string }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 9v4m0 4h.01M10.29 3.86l-7.84 13.6A1 1 0 003.31 19h17.38a1 1 0 00.86-1.54l-7.84-13.6a1 1 0 00-1.72 0z" /></svg>;
}

function StackIcon({ className }: { className?: string }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 4l8 4-8 4-8-4 8-4zm8 8-8 4-8-4m16 4-8 4-8-4" /></svg>;
}
