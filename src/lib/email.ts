import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM = 'Zypflow <hello@zypflow.com>';

function layout(content: string) {
  return `<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:600px;margin:0 auto;background:#fff">
    <div style="background:#6c3cff;padding:20px 30px">
      <h1 style="margin:0;color:#fff;font-size:22px">Zypflow</h1>
    </div>
    <div style="padding:30px">${content}</div>
    <div style="padding:20px 30px;background:#f9fafb;font-size:12px;color:#9ca3af;text-align:center">
      <p>Zypflow &mdash; AI-powered customer growth for UK service businesses</p>
      <p><a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://app.zypflow.com'}" style="color:#6c3cff">app.zypflow.com</a></p>
    </div>
  </div>`;
}

export async function sendEmail({ to, subject, html }: {
  to: string; subject: string; html: string;
}) {
  const { data, error } = await resend.emails.send({
    from: FROM, to, subject, html: layout(html),
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
        <li><a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://app.zypflow.com'}/dashboard" style="color:#6c3cff">Log in to your dashboard</a></li>
        <li>Add your business details, services, and FAQs</li>
        <li>Install the chat widget (one line of code)</li>
        <li>Set your Google review link</li>
      </ol>
      <p>Your AI assistant will start capturing leads the moment the widget is live on your website.</p>
      <p style="margin-top:24px">
        <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://app.zypflow.com'}/dashboard" style="display:inline-block;background:#6c3cff;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:600">Go to Dashboard</a>
      </p>
      <p style="margin-top:24px;color:#6b7280">Need help getting set up? <a href="${process.env.BOOKING_LINK || 'https://calendly.com/alex-zypflow/30min'}" style="color:#6c3cff">Book a free onboarding call</a></p>`,
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
        <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://app.zypflow.com'}/dashboard/leads" style="display:inline-block;background:#6c3cff;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:600">View in Dashboard</a>
      </p>`,
  });
}
