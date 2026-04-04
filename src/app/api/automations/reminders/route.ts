import { randomUUID } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { verifyAutomationAuth } from '@/lib/auth-automation';
import { sendEmail } from '@/lib/email';
import { canUseSupabaseAdmin, isLocalSmokeMode } from '@/lib/local-mode';
import { captureException, captureMessage } from '@/lib/monitoring';
import { supabaseAdmin } from '@/lib/supabase';
import { sendSms } from '@/services/sms.service';

export async function GET(req: NextRequest) {
  const authError = verifyAutomationAuth(req);
  if (authError) return authError;
  return sendReminders();
}

export async function POST(req: NextRequest) {
  const authError = verifyAutomationAuth(req);
  if (authError) return authError;
  return sendReminders();
}

async function sendReminders() {
  const runId = randomUUID();
  const now = new Date();
  const results = { sent48h: 0, sent24h: 0, sent2h: 0, errors: 0 };

  if (isLocalSmokeMode() && !canUseSupabaseAdmin()) {
    return NextResponse.json({
      results,
      runId,
      reason: 'Local smoke mode is active and reminder automation needs a real database.',
    });
  }

  const { data: appointments, error } = await supabaseAdmin
    .from('appointments')
    .select(
      'id, datetime, service, status, reminder_48h_sent, reminder_24h_sent, reminder_2h_sent, org_id, lead_id, leads(name, email, phone), businesses(name)'
    )
    .eq('status', 'confirmed')
    .gte('datetime', now.toISOString());

  if (error) {
    captureException(error, {
      context: 'reminders-load-appointments',
      tags: { route: 'reminders', runId },
    });
    return NextResponse.json({ error: 'Unable to load reminder queue.' }, { status: 500 });
  }

  if (!appointments) {
    return NextResponse.json({ results, runId });
  }

  for (const appointment of appointments as Record<string, unknown>[]) {
    const appointmentId = appointment.id as string;
    const lead = appointment.leads as Record<string, string> | null;
    const business = appointment.businesses as Record<string, string> | null;
    if (!lead || !business) continue;

    const appointmentTime = new Date(appointment.datetime as string);
    const hoursUntil = (appointmentTime.getTime() - now.getTime()) / (1000 * 60 * 60);
    const businessName = business.name || 'our clinic';
    const service = (appointment.service as string) || 'your appointment';

    try {
      if (hoursUntil <= 48 && hoursUntil > 24 && !appointment.reminder_48h_sent) {
        const claimed = await claimReminderSlot(appointmentId, 'reminder_48h_sent');
        if (!claimed) continue;
        try {
          await sendReminder(lead, businessName, service, appointmentTime, '48 hours');
        } catch (sendError) {
          await revertReminderSlot(appointmentId, 'reminder_48h_sent');
          throw sendError;
        }
        results.sent48h++;
        captureMessage('Reminder sent', {
          context: 'reminder-48h',
          tags: { route: 'reminders', appointmentId, runId },
          level: 'info',
        });
      } else if (hoursUntil <= 24 && hoursUntil > 2 && !appointment.reminder_24h_sent) {
        const claimed = await claimReminderSlot(appointmentId, 'reminder_24h_sent');
        if (!claimed) continue;
        try {
          await sendReminder(lead, businessName, service, appointmentTime, 'tomorrow');
        } catch (sendError) {
          await revertReminderSlot(appointmentId, 'reminder_24h_sent');
          throw sendError;
        }
        results.sent24h++;
        captureMessage('Reminder sent', {
          context: 'reminder-24h',
          tags: { route: 'reminders', appointmentId, runId },
          level: 'info',
        });
      } else if (hoursUntil <= 2 && hoursUntil > 0 && !appointment.reminder_2h_sent) {
        const claimed = await claimReminderSlot(appointmentId, 'reminder_2h_sent');
        if (!claimed) continue;
        try {
          await sendReminder(lead, businessName, service, appointmentTime, '2 hours');
        } catch (sendError) {
          await revertReminderSlot(appointmentId, 'reminder_2h_sent');
          throw sendError;
        }
        results.sent2h++;
        captureMessage('Reminder sent', {
          context: 'reminder-2h',
          tags: { route: 'reminders', appointmentId, runId },
          level: 'info',
        });
      }
    } catch (error) {
      results.errors++;
      captureException(error, {
        context: 'reminder-send',
        tags: { route: 'reminders', appointmentId, runId },
        extra: { businessId: appointment.org_id as string, service },
      });
    }
  }

  return NextResponse.json({ results, runId });
}

async function claimReminderSlot(
  appointmentId: string,
  field: 'reminder_48h_sent' | 'reminder_24h_sent' | 'reminder_2h_sent'
) {
  const { data, error } = await supabaseAdmin
    .from('appointments')
    .update({ [field]: true })
    .eq('id', appointmentId)
    .eq(field, false)
    .select('id')
    .maybeSingle();

  if (error) throw error;
  return Boolean(data?.id);
}

async function revertReminderSlot(
  appointmentId: string,
  field: 'reminder_48h_sent' | 'reminder_24h_sent' | 'reminder_2h_sent'
) {
  await supabaseAdmin.from('appointments').update({ [field]: false }).eq('id', appointmentId);
}

async function sendReminder(
  lead: Record<string, string>,
  businessName: string,
  service: string,
  dateTime: Date,
  timeLabel: string
) {
  const formattedDate = dateTime.toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
  const formattedTime = dateTime.toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
  });

  if (lead.phone) {
    await sendSms({
      body: `Hi ${lead.name || 'there'}! Reminder: your ${service} at ${businessName} is in ${timeLabel} (${formattedDate} at ${formattedTime}). Reply STOP to opt out.`,
      to: lead.phone,
    });
  }

  if (lead.email) {
    await sendEmail({
      to: lead.email,
      subject: `Appointment reminder - ${service} at ${businessName}`,
      html: `<h2 style="color:#1f2937">Appointment Reminder</h2>
       <p>Hi ${lead.name || 'there'},</p>
       <p>This is a friendly reminder that your appointment is coming up in <strong>${timeLabel}</strong>.</p>
       <div style="background:#f9fafb;border-radius:8px;padding:16px;margin:16px 0">
         <p style="margin:4px 0"><strong>Service:</strong> ${service}</p>
         <p style="margin:4px 0"><strong>Date:</strong> ${formattedDate}</p>
         <p style="margin:4px 0"><strong>Time:</strong> ${formattedTime}</p>
         <p style="margin:4px 0"><strong>Business:</strong> ${businessName}</p>
       </div>
       <p>We look forward to seeing you.</p>`,
    });
  }
}
