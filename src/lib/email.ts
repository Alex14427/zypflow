import { Resend } from 'resend';
import crypto from 'crypto';

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM = 'Zypflow <hello@zypflow.com>';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://app.zypflow.com';

function unsubscribeUrl(email: string) {
  const secret = process.env.AUTOMATION_SECRET;
  if (!secret) {
    console.error('AUTOMATION_SECRET is not set — unsubscribe links will be insecure');
    return `${APP_URL}/api/email/unsubscribe?email=${encodeURIComponent(email)}&token=disabled`;
  }
  const token = crypto.createHmac('sha256', secret).update(email).digest('hex').slice(0, 32);
  return `${APP_URL}/api/email/unsubscribe?email=${encodeURIComponent(email)}&token=${token}`;
}

function layout(content: string, recipientEmail?: string) {
  const unsubLink = recipientEmail ? unsubscribeUrl(recipientEmail) : '';
  const unsubFooter = unsubLink
    ? `<p style="margin-top:12px"><a href="${unsubLink}" style="color:#9ca3af;text-decoration:underline">Unsubscribe</a></p>`
    : '';

  return `<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:600px;margin:0 auto;background:#fff">
    <div style="background:#6c3cff;padding:20px 30px">
      <h1 style="margin:0;color:#fff;font-size:22px">Zypflow</h1>
    </div>
    <div style="padding:30px">${content}</div>
    <div style="padding:20px 30px;background:#f9fafb;font-size:12px;color:#9ca3af;text-align:center">
      <p>Zypflow &mdash; AI-powered customer growth for UK service businesses</p>
      <p><a href="${APP_URL}" style="color:#6c3cff">app.zypflow.com</a></p>
      ${unsubFooter}
    </div>
  </div>`;
}

export async function sendEmail({ to, subject, html }: {
  to: string; subject: string; html: string;
}) {
  const unsubLink = unsubscribeUrl(to);
  const { data, error } = await resend.emails.send({
    from: FROM,
    to,
    subject,
    html: layout(html, to),
    headers: {
      'List-Unsubscribe': `<${unsubLink}>`,
      'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
    },
  });
  if (error) console.error('Email error:', error);
  return { data, error };
}

export async function sendWelcomeEmail(email: string, name: string, plan: string) {
  return sendEmail({
    to: email,
    subject: `Welcome to Zypflow, ${name}!`,
    html: `<h2 style="color:#1f2937">Welcome to Zypflow!</h2>
      <p>Hi ${name}, your <strong>${plan}</strong> plan is now active with a 14-day free trial.</p>
      <p>Here&apos;s how to get started:</p>
      <ol style="line-height:1.8">
        <li><a href="${APP_URL}/dashboard" style="color:#6c3cff">Log in to your dashboard</a></li>
        <li>Add your business details, services, and FAQs</li>
        <li>Install the chat widget (one line of code)</li>
        <li>Set your Google review link</li>
      </ol>
      <p>Your AI assistant will start capturing leads the moment the widget is live on your website.</p>
      <p style="margin-top:24px">
        <a href="${APP_URL}/dashboard" style="display:inline-block;background:#6c3cff;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:600">Go to Dashboard</a>
      </p>
      <p style="margin-top:24px;color:#6b7280">Need help getting set up? <a href="${process.env.NEXT_PUBLIC_BOOKING_LINK || 'https://zypflow.com/demo'}" style="color:#6c3cff">Book a free onboarding call</a></p>`,
  });
}

export async function sendBookingConfirmation(
  email: string, name: string, service: string, dateTime: Date, bizName: string
) {
  const date = dateTime.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const time = dateTime.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

  return sendEmail({
    to: email,
    subject: `Booking confirmed — ${service} at ${bizName}`,
    html: `<h2 style="color:#1f2937">Booking Confirmed</h2>
      <p>Hi ${name},</p>
      <p>Your appointment has been confirmed:</p>
      <div style="background:#f9fafb;border-radius:8px;padding:16px;margin:16px 0">
        <p style="margin:4px 0"><strong>Service:</strong> ${service}</p>
        <p style="margin:4px 0"><strong>Date:</strong> ${date}</p>
        <p style="margin:4px 0"><strong>Time:</strong> ${time}</p>
        <p style="margin:4px 0"><strong>Business:</strong> ${bizName}</p>
      </div>
      <p>We look forward to seeing you!</p>`,
  });
}

export async function sendLeadNotification(
  bizEmail: string, bizName: string,
  lead: { name?: string; email?: string; phone?: string; service_interest?: string; score?: number }
) {
  return sendEmail({
    to: bizEmail,
    subject: `New lead captured — ${lead.name || 'Anonymous'}`,
    html: `<h2 style="color:#1f2937">New Lead for ${bizName}</h2>
      <div style="background:#f9fafb;border-radius:8px;padding:16px;margin:16px 0">
        <p style="margin:4px 0"><strong>Name:</strong> ${lead.name || 'Not provided'}</p>
        <p style="margin:4px 0"><strong>Email:</strong> ${lead.email || 'Not provided'}</p>
        <p style="margin:4px 0"><strong>Phone:</strong> ${lead.phone || 'Not provided'}</p>
        <p style="margin:4px 0"><strong>Interest:</strong> ${lead.service_interest || 'General enquiry'}</p>
        <p style="margin:4px 0"><strong>Lead Score:</strong> ${lead.score || 0}/100</p>
      </div>
      <p style="margin-top:24px">
        <a href="${APP_URL}/dashboard/leads" style="display:inline-block;background:#6c3cff;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:600">View in Dashboard</a>
      </p>`,
  });
}

export async function sendPaymentFailedEmail(email: string, name: string) {
  return sendEmail({
    to: email,
    subject: 'Zypflow — Payment failed, action required',
    html: `<h2 style="color:#1f2937">Payment Failed</h2>
      <p>Hi ${name},</p>
      <p>We were unable to process your latest payment for Zypflow. This may be due to an expired card or insufficient funds.</p>
      <p>Please update your payment method to avoid any interruption to your service:</p>
      <p style="margin-top:20px">
        <a href="${APP_URL}/dashboard/settings" style="display:inline-block;background:#6c3cff;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:600">Update Payment Method</a>
      </p>
      <p style="margin-top:20px;color:#6b7280;font-size:14px">If you need help, just reply to this email.</p>`,
  });
}

export async function sendTrialEndingEmail(email: string, name: string, daysLeft: number) {
  return sendEmail({
    to: email,
    subject: `Zypflow — Your trial ends in ${daysLeft} days`,
    html: `<h2 style="color:#1f2937">Your Trial is Ending Soon</h2>
      <p>Hi ${name},</p>
      <p>Your 14-day Zypflow trial ends in <strong>${daysLeft} days</strong>.</p>
      <p>To keep your AI assistant running and continue capturing leads, make sure you have a payment method on file:</p>
      <p style="margin-top:20px">
        <a href="${APP_URL}/dashboard/settings" style="display:inline-block;background:#6c3cff;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:600">Manage Billing</a>
      </p>
      <p style="margin-top:20px;color:#6b7280;font-size:14px">Questions? Reply to this email or <a href="${process.env.NEXT_PUBLIC_BOOKING_LINK || 'https://zypflow.com/demo'}" style="color:#6c3cff">book a quick call</a>.</p>`,
  });
}
