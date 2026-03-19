import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { sendEmail } from '@/lib/email';
import twilio from 'twilio';

const smsClient = twilio(
  process.env.TWILIO_ACCOUNT_SID || '',
  process.env.TWILIO_AUTH_TOKEN || ''
);

// Called by Make.com or Vercel cron to send appointment reminders
// Checks for appointments needing 48h, 24h, or 2h reminders
export async function GET() {
  return sendReminders();
}

export async function POST() {
  return sendReminders();
}

async function sendReminders() {
  const now = new Date();
  const results = { sent48h: 0, sent24h: 0, sent2h: 0, errors: 0 };

  // Get upcoming appointments that haven't had reminders sent
  const { data: appointments } = await supabaseAdmin
    .from('appointments')
    .select('id, datetime, service, status, reminder_48h_sent, reminder_24h_sent, reminder_2h_sent, business_id, lead_id, leads(name, email, phone), businesses(name)')
    .eq('status', 'confirmed')
    .gte('datetime', now.toISOString());

  if (!appointments) return NextResponse.json({ results });

  for (const appt of appointments as Record<string, unknown>[]) {
    const apptTime = new Date(appt.datetime as string);
    const hoursUntil = (apptTime.getTime() - now.getTime()) / (1000 * 60 * 60);
    const lead = appt.leads as Record<string, string> | null;
    const biz = appt.businesses as Record<string, string> | null;

    if (!lead || !biz) continue;

    const bizName = biz.name || 'our office';
    const service = (appt.service as string) || 'your appointment';

    try {
      // 48h reminder
      if (hoursUntil <= 48 && hoursUntil > 24 && !appt.reminder_48h_sent) {
        await sendReminder(lead, bizName, service, apptTime, '48 hours');
        await supabaseAdmin.from('appointments').update({ reminder_48h_sent: true }).eq('id', appt.id);
        results.sent48h++;
      }
      // 24h reminder
      else if (hoursUntil <= 24 && hoursUntil > 2 && !appt.reminder_24h_sent) {
        await sendReminder(lead, bizName, service, apptTime, 'tomorrow');
        await supabaseAdmin.from('appointments').update({ reminder_24h_sent: true }).eq('id', appt.id);
        results.sent24h++;
      }
      // 2h reminder
      else if (hoursUntil <= 2 && hoursUntil > 0 && !appt.reminder_2h_sent) {
        await sendReminder(lead, bizName, service, apptTime, '2 hours');
        await supabaseAdmin.from('appointments').update({ reminder_2h_sent: true }).eq('id', appt.id);
        results.sent2h++;
      }
    } catch (err) {
      console.error('Reminder send error:', err);
      results.errors++;
    }
  }

  return NextResponse.json({ results });
}

async function sendReminder(
  lead: Record<string, string>,
  bizName: string,
  service: string,
  dateTime: Date,
  timeLabel: string
) {
  const formattedDate = dateTime.toLocaleDateString('en-GB', {
    weekday: 'long', day: 'numeric', month: 'long',
  });
  const formattedTime = dateTime.toLocaleTimeString('en-GB', {
    hour: '2-digit', minute: '2-digit',
  });

  // Send SMS if phone available
  if (lead.phone) {
    await smsClient.messages.create({
      body: `Hi ${lead.name || 'there'}! Reminder: your ${service} at ${bizName} is in ${timeLabel} (${formattedDate} at ${formattedTime}). Reply STOP to opt out.`,
      from: process.env.TWILIO_PHONE_NUMBER || '',
      to: lead.phone,
    });
  }

  // Send email if available
  if (lead.email) {
    await sendEmail({
      to: lead.email,
      subject: `Appointment reminder — ${service} at ${bizName}`,
      html: `<p>Hi ${lead.name || 'there'},</p>
       <p>This is a friendly reminder that your <strong>${service}</strong> at <strong>${bizName}</strong> is in <strong>${timeLabel}</strong>.</p>
       <p><strong>Date:</strong> ${formattedDate}<br><strong>Time:</strong> ${formattedTime}</p>
       <p>We look forward to seeing you!</p>`,
    });
  }
}
