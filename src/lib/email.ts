import crypto from 'crypto';
import { Resend } from 'resend';
import { DEFAULT_BRAND_COLOR } from '@/lib/brand-theme';
import { ClientHealthBundle, formatChurnRisk, formatHealthStatus } from '@/lib/client-health';
import { formatCurrencyGBP } from '@/lib/formatting';
import { canUseResend, isLocalSmokeMode } from '@/lib/local-mode';

let _resend: Resend | null = null;

function getResend(): Resend {
  if (!_resend) {
    _resend = new Resend(process.env.RESEND_API_KEY || 'missing');
  }
  return _resend;
}

const FROM = 'Zypflow <hello@zypflow.com>';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://app.zypflow.com';
const BRAND_COLOR = DEFAULT_BRAND_COLOR;
const FOUNDING_PILOT_MONTHLY = formatCurrencyGBP(995);
const FOUNDING_PILOT_SETUP = formatCurrencyGBP(495);

function unsubscribeUrl(email: string) {
  const secret = process.env.AUTOMATION_SECRET;
  if (!secret) {
    console.error('AUTOMATION_SECRET is not set - unsubscribe links will be insecure');
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

  const html = content
    .replaceAll('#6c3cff', BRAND_COLOR)
    .replaceAll('Ã‚Â£', 'Â£')
    .replaceAll('Ãƒâ€šÃ‚Â£', 'Â£')
    .replaceAll('Â£', '£')
    .replaceAll('â€”', '&mdash;');

  return `<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:600px;margin:0 auto;background:#fff">
    <div style="background:${BRAND_COLOR};padding:20px 30px">
      <h1 style="margin:0;color:#fff;font-size:22px">Zypflow</h1>
    </div>
    <div style="padding:30px">${html}</div>
    <div style="padding:20px 30px;background:#f9fafb;font-size:12px;color:#9ca3af;text-align:center">
      <p>Zypflow &mdash; automated revenue operations for private clinics</p>
      <p><a href="${APP_URL}" style="color:${BRAND_COLOR}">app.zypflow.com</a></p>
      ${unsubFooter}
    </div>
  </div>`;
}

export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}) {
  const unsubLink = unsubscribeUrl(to);

  if (isLocalSmokeMode() || !canUseResend()) {
    console.info(`[local-email] ${subject} -> ${to}`);
    return {
      data: { id: `local-email-${Date.now()}` },
      error: null,
    };
  }

  const { data, error } = await getResend().emails.send({
    from: FROM,
    to,
    subject,
    html: layout(html, to),
    headers: {
      'List-Unsubscribe': `<${unsubLink}>`,
      'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
    },
  });

  if (error) {
    console.error('Email error:', error);
  }

  return { data, error };
}

export async function sendWelcomeEmail(email: string, name: string, plan: string) {
  return sendEmail({
    to: email,
    subject: `Your Zypflow workspace is ready, ${name}`,
    html: `<h2 style="color:#1f2937">Welcome to Zypflow</h2>
      <p>Hi ${name}, your <strong>${plan}</strong> workspace is ready for launch.</p>
      <p>Here is the fastest way to get value from it:</p>
      <ol style="line-height:1.8">
        <li><a href="${APP_URL}/dashboard" style="color:#6c3cff">Log in to your dashboard</a></li>
        <li>Finish clinic details, services, and FAQs</li>
        <li>Install the site widget and verify it</li>
        <li>Connect your booking and review links</li>
      </ol>
      <p>Once the widget is live, Zypflow can start capturing demand, following up automatically, and reporting proof back to the clinic.</p>
      <p style="margin-top:24px">
        <a href="${APP_URL}/dashboard" style="display:inline-block;background:#6c3cff;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:600">Go to Dashboard</a>
      </p>
      <p style="margin-top:24px;color:#6b7280">Need help getting set up? <a href="${process.env.NEXT_PUBLIC_BOOKING_LINK || 'https://zypflow.com/demo'}" style="color:#6c3cff">Book a free onboarding call</a></p>`,
  });
}

export async function sendBookingConfirmation(
  email: string,
  name: string,
  service: string,
  dateTime: Date,
  bizName: string
) {
  const date = dateTime.toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  const time = dateTime.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

  return sendEmail({
    to: email,
    subject: `Booking confirmed - ${service} at ${bizName}`,
    html: `<h2 style="color:#1f2937">Booking Confirmed</h2>
      <p>Hi ${name},</p>
      <p>Your appointment has been confirmed:</p>
      <div style="background:#f9fafb;border-radius:8px;padding:16px;margin:16px 0">
        <p style="margin:4px 0"><strong>Service:</strong> ${service}</p>
        <p style="margin:4px 0"><strong>Date:</strong> ${date}</p>
        <p style="margin:4px 0"><strong>Time:</strong> ${time}</p>
        <p style="margin:4px 0"><strong>Business:</strong> ${bizName}</p>
      </div>
      <p>We look forward to seeing you.</p>`,
  });
}

export async function sendLeadNotification(
  bizEmail: string,
  bizName: string,
  lead: { name?: string; email?: string; phone?: string; service_interest?: string; score?: number }
) {
  return sendEmail({
    to: bizEmail,
    subject: `New lead captured - ${lead.name || 'Anonymous'}`,
    html: `<h2 style="color:#1f2937">New lead for ${bizName}</h2>
      <div style="background:#f9fafb;border-radius:8px;padding:16px;margin:16px 0">
        <p style="margin:4px 0"><strong>Name:</strong> ${lead.name || 'Not provided'}</p>
        <p style="margin:4px 0"><strong>Email:</strong> ${lead.email || 'Not provided'}</p>
        <p style="margin:4px 0"><strong>Phone:</strong> ${lead.phone || 'Not provided'}</p>
        <p style="margin:4px 0"><strong>Interest:</strong> ${lead.service_interest || 'General enquiry'}</p>
        <p style="margin:4px 0"><strong>Lead score:</strong> ${lead.score || 0}/100</p>
      </div>
      <p style="margin-top:24px">
        <a href="${APP_URL}/dashboard/leads" style="display:inline-block;background:#6c3cff;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:600">View in dashboard</a>
      </p>`,
  });
}

export async function sendPaymentFailedEmail(email: string, name: string) {
  return sendEmail({
    to: email,
    subject: 'Zypflow - payment issue, action required',
    html: `<h2 style="color:#1f2937">Payment issue</h2>
      <p>Hi ${name},</p>
      <p>We were unable to process your latest payment for Zypflow. This may be due to an expired card or insufficient funds.</p>
      <p>Please update your payment method to avoid any interruption to your service:</p>
      <p style="margin-top:20px">
        <a href="${APP_URL}/dashboard/settings" style="display:inline-block;background:#6c3cff;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:600">Update payment method</a>
      </p>
      <p style="margin-top:20px;color:#6b7280;font-size:14px">If you need help, just reply to this email.</p>`,
  });
}

// Launch window sequence (days 4, 2, 1, 0, -1)

export async function sendTrialEndingEmail(email: string, name: string, daysLeft: number) {
  if (daysLeft >= 4) return sendTrialDay4(email, name, daysLeft);
  if (daysLeft === 2) return sendTrialDay2(email, name);
  if (daysLeft === 1) return sendTrialDay1(email, name);
  if (daysLeft === 0) return sendTrialExpired(email, name);
  return sendTrialWinback(email, name);
}

async function sendTrialDay4(email: string, name: string, daysLeft: number) {
  return sendEmail({
    to: email,
    subject: `${name}, your Zypflow launch window closes in ${daysLeft} days`,
    html: `<h2 style="color:#1f2937">Your launch window is closing soon</h2>
      <p>Hi ${name},</p>
      <p>Your current launch window closes in <strong>${daysLeft} days</strong>.</p>
      <p>To keep the clinic workspace live and continue capturing leads, activate the founding pilot now:</p>
      <div style="background:#f9fafb;border-radius:12px;padding:16px;margin:16px 0">
        <p style="margin:0;color:#111827;font-weight:600">Founding pilot</p>
        <p style="margin:8px 0 0;color:#4b5563">${FOUNDING_PILOT_MONTHLY}/month + ${FOUNDING_PILOT_SETUP} setup</p>
      </div>
      <p style="margin-top:20px">
        <a href="${APP_URL}/dashboard/settings" style="display:inline-block;background:#6c3cff;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:600">Keep my workspace active</a>
      </p>
      <p style="margin-top:20px;color:#6b7280;font-size:14px">Questions? Reply to this email or <a href="${process.env.NEXT_PUBLIC_BOOKING_LINK || 'https://zypflow.com/demo'}" style="color:#6c3cff">book a quick call</a>.</p>`,
  });
}

async function sendTrialDay2(email: string, name: string) {
  return sendEmail({
    to: email,
    subject: `48 hours left - here is what pauses next, ${name}`,
    html: `<h2 style="color:#1f2937">Just 48 hours left</h2>
      <p>Hi ${name},</p>
      <p>Your current Zypflow setup reaches its billing checkpoint in <strong>48 hours</strong>. Here is what pauses if billing is not active:</p>
      <div style="background:#fef2f2;border-left:4px solid #ef4444;padding:16px;margin:16px 0;border-radius:4px">
        <p style="margin:4px 0;color:#991b1b">&#10007; Your AI chat widget goes offline</p>
        <p style="margin:4px 0;color:#991b1b">&#10007; No more automatic lead capture</p>
        <p style="margin:4px 0;color:#991b1b">&#10007; Follow-up sequences stop sending</p>
        <p style="margin:4px 0;color:#991b1b">&#10007; Appointment reminders stop</p>
        <p style="margin:4px 0;color:#991b1b">&#10007; Review requests stop</p>
      </div>
      <p>Do not let warm demand leak out. Activate the founding pilot and keep everything running seamlessly:</p>
      <p style="margin-top:20px">
        <a href="${APP_URL}/dashboard/settings" style="display:inline-block;background:#6c3cff;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:600">Activate the founding pilot</a>
      </p>
      <p style="margin-top:16px;color:#6b7280;font-size:14px">Current pricing: ${FOUNDING_PILOT_MONTHLY}/month plus ${FOUNDING_PILOT_SETUP} setup.</p>`,
  });
}

async function sendTrialDay1(email: string, name: string) {
  return sendEmail({
    to: email,
    subject: 'Last day - your Zypflow workspace pauses tomorrow',
    html: `<h2 style="color:#1f2937">This is it, ${name}</h2>
      <p>Your workspace reaches its billing deadline <strong>tomorrow</strong>.</p>
      <p>After that, your AI assistant will stop capturing leads for your business. Every enquiry that comes in overnight and every question a potential patient asks will wait for a manual response.</p>
      <div style="background:#f9fafb;border-left:4px solid #6c3cff;padding:16px;margin:16px 0;border-radius:4px">
        <p style="margin:0;color:#111827;font-weight:600">Commercial checkpoint</p>
        <p style="margin:8px 0 0;color:#4b5563">${FOUNDING_PILOT_MONTHLY}/month plus ${FOUNDING_PILOT_SETUP} setup keeps the workspace, automation pack, and reporting layer live.</p>
      </div>
      <p style="margin-top:20px">
        <a href="${APP_URL}/dashboard/settings" style="display:inline-block;background:#6c3cff;color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:600;font-size:16px">Activate my workspace now</a>
      </p>
      <p style="margin-top:16px;color:#6b7280;font-size:14px">Need more time? Reply to this email and we will see what we can do.</p>`,
  });
}

async function sendTrialExpired(email: string, name: string) {
  return sendEmail({
    to: email,
    subject: `${name}, your Zypflow launch window has closed`,
    html: `<h2 style="color:#1f2937">Your launch window has closed</h2>
      <p>Hi ${name},</p>
      <p>Your current launch window has ended, so your AI assistant is now <strong>offline</strong>.</p>
      <p>The good news is that all your data, leads, and settings are still saved. Reactivate now and everything picks up right where you left off:</p>
      <p style="margin-top:20px">
        <a href="${APP_URL}/pricing" style="display:inline-block;background:#6c3cff;color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:600;font-size:16px">Review the founding pilot</a>
      </p>
      <div style="background:#f9fafb;border-left:4px solid #6c3cff;padding:16px;margin:16px 0;border-radius:4px">
        <p style="margin:0;color:#111827">Reactivate on the founding pilot: ${FOUNDING_PILOT_MONTHLY}/month + ${FOUNDING_PILOT_SETUP} setup.</p>
      </div>
      <p style="margin-top:16px;color:#6b7280;font-size:14px">If Zypflow is not right for you, we would love to know why. Just reply to this email and your feedback helps us improve.</p>`,
  });
}

async function sendTrialWinback(email: string, name: string) {
  return sendEmail({
    to: email,
    subject: `${name}, we'd love to have you back`,
    html: `<h2 style="color:#1f2937">We miss you at Zypflow</h2>
      <p>Hi ${name},</p>
      <p>It has been a little while since your launch window closed, and we wanted to check in.</p>
      <p>Since you left, we have been improving Zypflow:</p>
      <ul style="line-height:1.8;color:#374151">
        <li>Faster AI responses</li>
        <li>Smarter lead scoring</li>
        <li>Better appointment reminder sequences</li>
        <li>Stronger analytics and ROI tracking</li>
      </ul>
      <p>If the timing is better now, we would love to restart the workspace and walk you back through the launch path:</p>
      <p style="margin-top:20px">
        <a href="${APP_URL}/pricing" style="display:inline-block;background:#6c3cff;color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:600;font-size:16px">Review the founding pilot</a>
      </p>
      <p style="margin-top:16px;color:#6b7280;font-size:14px">Current commercial model: ${FOUNDING_PILOT_MONTHLY}/month plus ${FOUNDING_PILOT_SETUP} setup. If you'd rather not hear from us, click unsubscribe below.</p>`,
  });
}

// Onboarding drip emails

export async function sendOnboardingNudge(email: string, name: string, step: number, completedSteps: string[]) {
  const missingSteps = [];
  if (!completedSteps.includes('widget')) missingSteps.push('Install your chat widget');
  if (!completedSteps.includes('booking')) missingSteps.push('Connect your booking calendar');
  if (!completedSteps.includes('review')) missingSteps.push('Add your Google review link');

  const subjects: Record<number, string> = {
    1: `${name}, your AI assistant is almost ready`,
    2: 'Quick reminder - finish setting up Zypflow',
    3: `Last nudge - your leads are waiting, ${name}`,
  };

  const intros: Record<number, string> = {
    1: "You're close to having your own AI assistant capturing leads 24/7. Just a few quick steps left:",
    2: "Businesses that complete setup within the first week usually see value faster. You're nearly there:",
    3: "This is our last reminder - once setup is complete, your AI starts working immediately. Here's what's left:",
  };

  const stepsHtml = missingSteps.map((item) => `<li style="margin:4px 0">${item}</li>`).join('');

  return sendEmail({
    to: email,
    subject: subjects[step] || subjects[1],
    html: `<h2 style="color:#1f2937">Finish your setup</h2>
      <p>Hi ${name},</p>
      <p>${intros[step] || intros[1]}</p>
      <ul style="line-height:1.8;color:#374151;font-weight:500">${stepsHtml}</ul>
      <p style="margin-top:20px">
        <a href="${APP_URL}/onboarding" style="display:inline-block;background:#6c3cff;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:600">Complete setup (5 minutes)</a>
      </p>
      <p style="margin-top:16px;color:#6b7280;font-size:14px">Need help? <a href="${process.env.NEXT_PUBLIC_BOOKING_LINK || 'https://zypflow.com/demo'}" style="color:#6c3cff">Book a free 15-minute setup call</a> and we will do it together.</p>`,
  });
}

// Milestone celebration emails

export async function sendMilestoneEmail(
  email: string,
  name: string,
  milestone: string,
  stats: { leads?: number; bookings?: number; reviews?: number }
) {
  const milestones: Record<string, { subject: string; heading: string; body: string }> = {
    first_lead: {
      subject: `Your first lead is here, ${name}`,
      heading: 'Your first lead',
      body: 'Your AI assistant just captured its first lead. This is exactly how the system starts compounding: the widget is live, demand is flowing in, and the clinic is no longer relying on slow manual follow-up.',
    },
    first_booking: {
      subject: 'Your AI just booked its first appointment',
      heading: 'First booking - automatically',
      body: 'A customer just booked an appointment through your AI assistant without any back-and-forth admin.',
    },
    ten_leads: {
      subject: '10 leads captured - and counting',
      heading: '10 leads and growing',
      body: 'Your AI assistant has now captured <strong>10 leads</strong>. At this rate, you are building a real pipeline.',
    },
    fifty_leads: {
      subject: '50 leads - the system is compounding',
      heading: '50 leads - serious momentum',
      body: 'Your AI has captured <strong>50 leads</strong>. That is 50 opportunities that could have leaked away without a consistent response system.',
    },
    first_review: {
      subject: 'You just got a review through Zypflow',
      heading: 'Your first review request worked',
      body: 'A customer just left a review after your automated request. Social proof is one of the strongest growth assets a clinic can compound.',
    },
  };

  const milestoneConfig = milestones[milestone];
  if (!milestoneConfig) return;

  const statsHtml =
    stats.leads || stats.bookings || stats.reviews
      ? `<div style="background:#f0fdf4;border-radius:8px;padding:16px;margin:16px 0;display:flex;gap:24px">
          ${stats.leads ? `<div><p style="margin:0;font-size:24px;font-weight:700;color:#166534">${stats.leads}</p><p style="margin:0;font-size:12px;color:#6b7280">Leads</p></div>` : ''}
          ${stats.bookings ? `<div><p style="margin:0;font-size:24px;font-weight:700;color:#166534">${stats.bookings}</p><p style="margin:0;font-size:12px;color:#6b7280">Bookings</p></div>` : ''}
          ${stats.reviews ? `<div><p style="margin:0;font-size:24px;font-weight:700;color:#166534">${stats.reviews}</p><p style="margin:0;font-size:12px;color:#6b7280">Reviews</p></div>` : ''}
        </div>`
      : '';

  return sendEmail({
    to: email,
    subject: milestoneConfig.subject,
    html: `<h2 style="color:#1f2937">${milestoneConfig.heading}</h2>
      <p>Hi ${name},</p>
      <p>${milestoneConfig.body}</p>
      ${statsHtml}
      <p style="margin-top:20px">
        <a href="${APP_URL}/dashboard" style="display:inline-block;background:#6c3cff;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:600">View your dashboard</a>
      </p>`,
  });
}

// Weekly business digest

export async function sendWeeklyDigest(email: string, name: string, bizName: string, report: ClientHealthBundle) {
  const { metrics, health } = report;
  const highlights =
    health.highlights.length > 0 ? health.highlights : ['The automation pack is live and ready for more demand.'];
  const risks =
    health.risks.length > 0 ? health.risks : ['No major delivery risks were detected this week.'];
  const actions =
    health.actions.length > 0
      ? health.actions
      : ['Keep traffic flowing and let the automation pack keep compounding.'];

  return sendEmail({
    to: email,
    subject: `${bizName} weekly proof report - ${metrics.newLeads} leads, ${metrics.bookingsCreated} bookings`,
    html: `<h2 style="color:#1f2937">Your weekly report</h2>
      <p>Hi ${name}, here is how ${bizName} performed this week with Zypflow:</p>
      <div style="background:#f9fafb;border-radius:12px;padding:24px;margin:16px 0">
        <table style="width:100%;border-collapse:collapse">
          <tr>
            <td style="padding:8px 0;border-bottom:1px solid #e5e7eb"><strong>New leads</strong></td>
            <td style="padding:8px 0;border-bottom:1px solid #e5e7eb;text-align:right;font-size:18px;font-weight:700;color:#6c3cff">${metrics.newLeads}</td>
          </tr>
          <tr>
            <td style="padding:8px 0;border-bottom:1px solid #e5e7eb"><strong>Bookings</strong></td>
            <td style="padding:8px 0;border-bottom:1px solid #e5e7eb;text-align:right;font-size:18px;font-weight:700;color:#22c55e">${metrics.bookingsCreated}</td>
          </tr>
          <tr>
            <td style="padding:8px 0;border-bottom:1px solid #e5e7eb"><strong>Hot leads (score 70+)</strong></td>
            <td style="padding:8px 0;border-bottom:1px solid #e5e7eb;text-align:right;font-size:18px;font-weight:700;color:#f59e0b">${metrics.hotLeads}</td>
          </tr>
          <tr>
            <td style="padding:8px 0;border-bottom:1px solid #e5e7eb"><strong>Follow-ups sent</strong></td>
            <td style="padding:8px 0;border-bottom:1px solid #e5e7eb;text-align:right;font-size:18px;font-weight:700">${metrics.followUpsSent}</td>
          </tr>
          <tr>
            <td style="padding:8px 0;border-bottom:1px solid #e5e7eb"><strong>Review requests sent</strong></td>
            <td style="padding:8px 0;border-bottom:1px solid #e5e7eb;text-align:right;font-size:18px;font-weight:700">${metrics.reviewRequestsSent}</td>
          </tr>
          <tr>
            <td style="padding:8px 0"><strong>Estimated revenue</strong></td>
            <td style="padding:8px 0;text-align:right;font-size:18px;font-weight:700;color:#22c55e">${formatCurrencyGBP(health.estimatedRevenue)}</td>
          </tr>
        </table>
      </div>
      <div style="background:#f3f0ff;border-radius:12px;padding:18px;margin:16px 0">
        <p style="margin:0;color:#4c1d95;font-size:12px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase">Proof snapshot</p>
        <p style="margin:10px 0 0;color:#1f2937;font-size:18px;font-weight:700">${health.strongestWin}</p>
        <p style="margin:10px 0 0;color:#4b5563;font-size:14px;line-height:1.7">${health.summary}</p>
      </div>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:12px;margin:16px 0">
        <div style="background:#f9fafb;border-radius:12px;padding:16px">
          <p style="margin:0;color:#6b7280;font-size:12px;text-transform:uppercase;letter-spacing:0.12em">Health</p>
          <p style="margin:10px 0 0;color:#111827;font-size:18px;font-weight:700">${formatHealthStatus(health.healthStatus)} (${health.score}/100)</p>
        </div>
        <div style="background:#f9fafb;border-radius:12px;padding:16px">
          <p style="margin:0;color:#6b7280;font-size:12px;text-transform:uppercase;letter-spacing:0.12em">Churn risk</p>
          <p style="margin:10px 0 0;color:#111827;font-size:18px;font-weight:700">${formatChurnRisk(health.churnRisk)}</p>
        </div>
        <div style="background:#f9fafb;border-radius:12px;padding:16px">
          <p style="margin:0;color:#6b7280;font-size:12px;text-transform:uppercase;letter-spacing:0.12em">Average lead score</p>
          <p style="margin:10px 0 0;color:#111827;font-size:18px;font-weight:700">${metrics.averageLeadScore !== null ? `${metrics.averageLeadScore}/100` : 'No scored leads yet'}</p>
        </div>
      </div>
      <div style="margin:16px 0">
        <p style="margin:0 0 10px;color:#111827;font-size:14px;font-weight:700">Highlights</p>
        <ul style="margin:0;padding-left:18px;color:#4b5563;line-height:1.8">${highlights.map((item) => `<li>${item}</li>`).join('')}</ul>
      </div>
      <div style="margin:16px 0">
        <p style="margin:0 0 10px;color:#111827;font-size:14px;font-weight:700">What needs attention</p>
        <ul style="margin:0;padding-left:18px;color:#4b5563;line-height:1.8">${risks.map((item) => `<li>${item}</li>`).join('')}</ul>
      </div>
      <div style="margin:16px 0">
        <p style="margin:0 0 10px;color:#111827;font-size:14px;font-weight:700">Next best actions</p>
        <ul style="margin:0;padding-left:18px;color:#4b5563;line-height:1.8">${actions.map((item) => `<li>${item}</li>`).join('')}</ul>
      </div>
      <p style="margin-top:20px">
        <a href="${APP_URL}/dashboard" style="display:inline-block;background:#6c3cff;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:600">Open dashboard</a>
      </p>`,
  });
}

// Payment failure recovery sequence

export async function sendPaymentFailedSequence(email: string, name: string, attempt: number) {
  if (attempt <= 1) return sendPaymentFailedEmail(email, name);

  if (attempt === 2) {
    return sendEmail({
      to: email,
      subject: `${name}, your payment still has not gone through`,
      html: `<h2 style="color:#1f2937">Payment issue - action required</h2>
        <p>Hi ${name},</p>
        <p>We tried to process your Zypflow payment again, but it did not go through. This usually happens because of:</p>
        <ul style="line-height:1.8;color:#374151">
          <li>Expired card details</li>
          <li>Insufficient funds</li>
          <li>Bank security block on the transaction</li>
        </ul>
        <p>Your account is still active, but if we cannot process payment soon, your AI assistant will be paused and you will stop receiving leads.</p>
        <p style="margin-top:20px">
          <a href="${APP_URL}/dashboard/settings" style="display:inline-block;background:#ef4444;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:600">Update payment method now</a>
        </p>
        <p style="margin-top:16px;color:#6b7280;font-size:14px">Need help? Reply to this email and we will help.</p>`,
    });
  }

  return sendEmail({
    to: email,
    subject: 'Urgent: your Zypflow account will be paused tomorrow',
    html: `<h2 style="color:#ef4444">Account suspension warning</h2>
      <p>Hi ${name},</p>
      <p>We have been unable to process your payment after multiple attempts. <strong>Your account will be paused tomorrow</strong>, which means:</p>
      <div style="background:#fef2f2;border-left:4px solid #ef4444;padding:16px;margin:16px 0;border-radius:4px">
        <p style="margin:4px 0;color:#991b1b">&#10007; Your AI chat widget goes offline</p>
        <p style="margin:4px 0;color:#991b1b">&#10007; Lead capture stops</p>
        <p style="margin:4px 0;color:#991b1b">&#10007; All automations pause</p>
      </div>
      <p>Please update your payment method immediately to avoid any disruption:</p>
      <p style="margin-top:20px">
        <a href="${APP_URL}/dashboard/settings" style="display:inline-block;background:#ef4444;color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:600;font-size:16px">Fix payment now</a>
      </p>`,
  });
}
