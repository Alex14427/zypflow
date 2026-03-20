import { Resend } from 'resend';
import crypto from 'crypto';

let _resend: Resend | null = null;
function getResend(): Resend {
  if (!_resend) {
    _resend = new Resend(process.env.RESEND_API_KEY || 'missing');
  }
  return _resend;
}

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

// --- Trial ending sequence (days 4, 2, 1, 0, -1) ---

export async function sendTrialEndingEmail(email: string, name: string, daysLeft: number) {
  // Route to the right email based on days remaining
  if (daysLeft >= 4) return sendTrialDay4(email, name, daysLeft);
  if (daysLeft === 2) return sendTrialDay2(email, name);
  if (daysLeft === 1) return sendTrialDay1(email, name);
  if (daysLeft === 0) return sendTrialExpired(email, name);
  // daysLeft < 0 means post-expiry
  return sendTrialWinback(email, name);
}

async function sendTrialDay4(email: string, name: string, daysLeft: number) {
  return sendEmail({
    to: email,
    subject: `${name}, your Zypflow trial ends in ${daysLeft} days`,
    html: `<h2 style="color:#1f2937">Your Trial is Ending Soon</h2>
      <p>Hi ${name},</p>
      <p>Your 14-day Zypflow trial ends in <strong>${daysLeft} days</strong>.</p>
      <p>To keep your AI assistant running and continue capturing leads, add a payment method now:</p>
      <p style="margin-top:20px">
        <a href="${APP_URL}/dashboard/settings" style="display:inline-block;background:#6c3cff;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:600">Keep My Account Active</a>
      </p>
      <p style="margin-top:20px;color:#6b7280;font-size:14px">Questions? Reply to this email or <a href="${process.env.NEXT_PUBLIC_BOOKING_LINK || 'https://zypflow.com/demo'}" style="color:#6c3cff">book a quick call</a>.</p>`,
  });
}

async function sendTrialDay2(email: string, name: string) {
  return sendEmail({
    to: email,
    subject: `48 hours left — here's what you'll lose, ${name}`,
    html: `<h2 style="color:#1f2937">Just 48 Hours Left</h2>
      <p>Hi ${name},</p>
      <p>Your Zypflow trial expires in <strong>48 hours</strong>. Here's what stops working when it ends:</p>
      <div style="background:#fef2f2;border-left:4px solid #ef4444;padding:16px;margin:16px 0;border-radius:4px">
        <p style="margin:4px 0;color:#991b1b">&#10007; Your AI chat widget goes offline</p>
        <p style="margin:4px 0;color:#991b1b">&#10007; No more automatic lead capture</p>
        <p style="margin:4px 0;color:#991b1b">&#10007; Follow-up sequences stop sending</p>
        <p style="margin:4px 0;color:#991b1b">&#10007; Appointment reminders stop</p>
        <p style="margin:4px 0;color:#991b1b">&#10007; Review requests stop</p>
      </div>
      <p>Don't let your leads go to your competitors. Add a payment method now and everything keeps running seamlessly:</p>
      <p style="margin-top:20px">
        <a href="${APP_URL}/dashboard/settings" style="display:inline-block;background:#6c3cff;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:600">Upgrade Now — Keep Everything Running</a>
      </p>
      <p style="margin-top:16px;color:#6b7280;font-size:14px">Plans start from just £149/month. Cancel anytime.</p>`,
  });
}

async function sendTrialDay1(email: string, name: string) {
  return sendEmail({
    to: email,
    subject: `LAST DAY — Your Zypflow trial expires tomorrow`,
    html: `<h2 style="color:#1f2937">This Is It, ${name}</h2>
      <p>Your trial expires <strong>tomorrow</strong>.</p>
      <p>After that, your AI assistant will stop capturing leads for your business. Every enquiry that comes in overnight, every question a potential customer asks — they'll go unanswered.</p>
      <div style="background:#f0fdf4;border-left:4px solid #22c55e;padding:16px;margin:16px 0;border-radius:4px">
        <p style="margin:0;color:#166534;font-weight:600">Special offer: Use code <span style="background:#dcfce7;padding:2px 8px;border-radius:4px;font-family:monospace">STAYWITH20</span> for 20% off your first month.</p>
      </div>
      <p style="margin-top:20px">
        <a href="${APP_URL}/dashboard/settings" style="display:inline-block;background:#6c3cff;color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:600;font-size:16px">Activate My Plan Now</a>
      </p>
      <p style="margin-top:16px;color:#6b7280;font-size:14px">Need more time? Reply to this email and we'll see what we can do.</p>`,
  });
}

async function sendTrialExpired(email: string, name: string) {
  return sendEmail({
    to: email,
    subject: `${name}, your Zypflow trial has ended`,
    html: `<h2 style="color:#1f2937">Your Trial Has Ended</h2>
      <p>Hi ${name},</p>
      <p>Your 14-day free trial has expired. Your AI assistant is now <strong>offline</strong>.</p>
      <p>But here's the good news — all your data, leads, and settings are still saved. Reactivate now and everything picks up right where you left off:</p>
      <p style="margin-top:20px">
        <a href="${APP_URL}/pricing" style="display:inline-block;background:#6c3cff;color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:600;font-size:16px">Reactivate My Account</a>
      </p>
      <div style="background:#f0fdf4;border-left:4px solid #22c55e;padding:16px;margin:16px 0;border-radius:4px">
        <p style="margin:0;color:#166534">Your 20% discount code <strong>STAYWITH20</strong> is still valid for the next 48 hours.</p>
      </div>
      <p style="margin-top:16px;color:#6b7280;font-size:14px">If Zypflow isn't right for you, we'd love to know why. Just reply to this email — your feedback helps us improve.</p>`,
  });
}

async function sendTrialWinback(email: string, name: string) {
  return sendEmail({
    to: email,
    subject: `${name}, we'd love to have you back`,
    html: `<h2 style="color:#1f2937">We Miss You at Zypflow</h2>
      <p>Hi ${name},</p>
      <p>It's been a little while since your trial ended, and we wanted to check in.</p>
      <p>Since you left, we've been busy improving Zypflow:</p>
      <ul style="line-height:1.8;color:#374151">
        <li>Faster AI responses (under 2 seconds)</li>
        <li>Smarter lead scoring</li>
        <li>Better appointment reminder sequences</li>
        <li>New analytics dashboard with ROI tracking</li>
      </ul>
      <p>We'd love to give you another shot — <strong>come back with 30% off your first 3 months</strong>:</p>
      <p style="margin-top:20px">
        <a href="${APP_URL}/pricing" style="display:inline-block;background:#6c3cff;color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:600;font-size:16px">Restart My Account — 30% Off</a>
      </p>
      <p style="margin-top:16px;color:#6b7280;font-size:14px">This offer expires in 7 days. If you'd rather not hear from us, just click unsubscribe below.</p>`,
  });
}

// --- Onboarding drip emails ---

export async function sendOnboardingNudge(email: string, name: string, step: number, completedSteps: string[]) {
  const missingSteps = [];
  if (!completedSteps.includes('widget')) missingSteps.push('Install your chat widget');
  if (!completedSteps.includes('booking')) missingSteps.push('Connect your booking calendar');
  if (!completedSteps.includes('review')) missingSteps.push('Add your Google review link');

  const subjects: Record<number, string> = {
    1: `${name}, your AI assistant is almost ready!`,
    2: `Quick reminder — finish setting up Zypflow`,
    3: `Last nudge — your leads are waiting, ${name}`,
  };

  const intros: Record<number, string> = {
    1: `You're so close to having your own AI assistant capturing leads 24/7. Just a few quick steps left:`,
    2: `Businesses that complete setup within the first week see 3x more leads in their first month. You're nearly there:`,
    3: `This is our last reminder — once setup is complete, your AI starts working immediately. Here's what's left:`,
  };

  const stepsHtml = missingSteps.map(s => `<li style="margin:4px 0">${s}</li>`).join('');

  return sendEmail({
    to: email,
    subject: subjects[step] || subjects[1],
    html: `<h2 style="color:#1f2937">Finish Your Setup</h2>
      <p>Hi ${name},</p>
      <p>${intros[step] || intros[1]}</p>
      <ul style="line-height:1.8;color:#374151;font-weight:500">${stepsHtml}</ul>
      <p style="margin-top:20px">
        <a href="${APP_URL}/onboarding" style="display:inline-block;background:#6c3cff;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:600">Complete Setup (5 minutes)</a>
      </p>
      <p style="margin-top:16px;color:#6b7280;font-size:14px">Need help? <a href="${process.env.NEXT_PUBLIC_BOOKING_LINK || 'https://zypflow.com/demo'}" style="color:#6c3cff">Book a free 15-minute setup call</a> and we'll do it together.</p>`,
  });
}

// --- Milestone celebration emails ---

export async function sendMilestoneEmail(email: string, name: string, milestone: string, stats: { leads?: number; bookings?: number; reviews?: number }) {
  const milestones: Record<string, { subject: string; heading: string; body: string }> = {
    first_lead: {
      subject: `Your first lead is here, ${name}!`,
      heading: 'Your First Lead!',
      body: `Your AI assistant just captured its first lead. This is exactly how it starts — your chat widget is working, leads are flowing in, and your business is growing while you sleep.`,
    },
    first_booking: {
      subject: `Your AI just booked its first appointment!`,
      heading: 'First Booking — Automatically!',
      body: `A customer just booked an appointment through your AI assistant — completely hands-free. No calls, no back-and-forth, no admin.`,
    },
    ten_leads: {
      subject: `10 leads captured — and counting!`,
      heading: '10 Leads and Growing',
      body: `Your AI assistant has now captured <strong>10 leads</strong>. At this rate, you're building a serious pipeline.`,
    },
    fifty_leads: {
      subject: `50 leads — your AI is on fire!`,
      heading: '50 Leads — Incredible Progress',
      body: `Your AI has captured <strong>50 leads</strong>. That's 50 potential customers who might have gone to your competitors otherwise.`,
    },
    first_review: {
      subject: `You just got a review through Zypflow!`,
      heading: 'Your First Review Request Worked!',
      body: `A customer just left a review after your automated review request. Social proof is the best marketing — and it's now on autopilot.`,
    },
  };

  const m = milestones[milestone];
  if (!m) return;

  const statsHtml = stats.leads || stats.bookings
    ? `<div style="background:#f0fdf4;border-radius:8px;padding:16px;margin:16px 0;display:flex;gap:24px">
        ${stats.leads ? `<div><p style="margin:0;font-size:24px;font-weight:700;color:#166534">${stats.leads}</p><p style="margin:0;font-size:12px;color:#6b7280">Leads</p></div>` : ''}
        ${stats.bookings ? `<div><p style="margin:0;font-size:24px;font-weight:700;color:#166534">${stats.bookings}</p><p style="margin:0;font-size:12px;color:#6b7280">Bookings</p></div>` : ''}
        ${stats.reviews ? `<div><p style="margin:0;font-size:24px;font-weight:700;color:#166534">${stats.reviews}</p><p style="margin:0;font-size:12px;color:#6b7280">Reviews</p></div>` : ''}
      </div>`
    : '';

  return sendEmail({
    to: email,
    subject: m.subject,
    html: `<h2 style="color:#1f2937">${m.heading}</h2>
      <p>Hi ${name},</p>
      <p>${m.body}</p>
      ${statsHtml}
      <p style="margin-top:20px">
        <a href="${APP_URL}/dashboard" style="display:inline-block;background:#6c3cff;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:600">View Your Dashboard</a>
      </p>`,
  });
}

// --- Weekly business digest ---

export async function sendWeeklyDigest(
  email: string, name: string, bizName: string,
  stats: { newLeads: number; bookings: number; reviewsRequested: number; avgScore: number; hotLeads: number }
) {
  const estimatedRevenue = stats.bookings * 150; // Conservative £150/booking average

  return sendEmail({
    to: email,
    subject: `${bizName} weekly report — ${stats.newLeads} leads, ${stats.bookings} bookings`,
    html: `<h2 style="color:#1f2937">Your Weekly Report</h2>
      <p>Hi ${name}, here's how ${bizName} performed this week with Zypflow:</p>
      <div style="background:#f9fafb;border-radius:12px;padding:24px;margin:16px 0">
        <table style="width:100%;border-collapse:collapse">
          <tr>
            <td style="padding:8px 0;border-bottom:1px solid #e5e7eb"><strong>New Leads</strong></td>
            <td style="padding:8px 0;border-bottom:1px solid #e5e7eb;text-align:right;font-size:18px;font-weight:700;color:#6c3cff">${stats.newLeads}</td>
          </tr>
          <tr>
            <td style="padding:8px 0;border-bottom:1px solid #e5e7eb"><strong>Bookings</strong></td>
            <td style="padding:8px 0;border-bottom:1px solid #e5e7eb;text-align:right;font-size:18px;font-weight:700;color:#22c55e">${stats.bookings}</td>
          </tr>
          <tr>
            <td style="padding:8px 0;border-bottom:1px solid #e5e7eb"><strong>Hot Leads (Score 70+)</strong></td>
            <td style="padding:8px 0;border-bottom:1px solid #e5e7eb;text-align:right;font-size:18px;font-weight:700;color:#f59e0b">${stats.hotLeads}</td>
          </tr>
          <tr>
            <td style="padding:8px 0;border-bottom:1px solid #e5e7eb"><strong>Review Requests Sent</strong></td>
            <td style="padding:8px 0;border-bottom:1px solid #e5e7eb;text-align:right;font-size:18px;font-weight:700">${stats.reviewsRequested}</td>
          </tr>
          <tr>
            <td style="padding:8px 0"><strong>Est. Revenue Generated</strong></td>
            <td style="padding:8px 0;text-align:right;font-size:18px;font-weight:700;color:#22c55e">£${estimatedRevenue.toLocaleString()}</td>
          </tr>
        </table>
      </div>
      ${stats.hotLeads > 0 ? `<p style="color:#f59e0b;font-weight:600">You have ${stats.hotLeads} hot leads waiting — don't let them go cold!</p>` : ''}
      <p style="margin-top:20px">
        <a href="${APP_URL}/dashboard" style="display:inline-block;background:#6c3cff;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:600">Open Dashboard</a>
      </p>`,
  });
}

// --- Payment failure recovery sequence ---

export async function sendPaymentFailedSequence(email: string, name: string, attempt: number) {
  if (attempt <= 1) return sendPaymentFailedEmail(email, name);

  if (attempt === 2) {
    return sendEmail({
      to: email,
      subject: `${name}, your payment still hasn't gone through`,
      html: `<h2 style="color:#1f2937">Payment Issue — Action Required</h2>
        <p>Hi ${name},</p>
        <p>We tried to process your Zypflow payment again, but it didn't go through. This usually happens because of:</p>
        <ul style="line-height:1.8;color:#374151">
          <li>Expired card details</li>
          <li>Insufficient funds</li>
          <li>Bank security block on the transaction</li>
        </ul>
        <p>Your account is still active, but if we can't process payment soon, your AI assistant will be paused and you'll stop receiving leads.</p>
        <p style="margin-top:20px">
          <a href="${APP_URL}/dashboard/settings" style="display:inline-block;background:#ef4444;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:600">Update Payment Method Now</a>
        </p>
        <p style="margin-top:16px;color:#6b7280;font-size:14px">Need help? Reply to this email or call us — we're happy to assist.</p>`,
    });
  }

  // attempt >= 3
  return sendEmail({
    to: email,
    subject: `URGENT: Your Zypflow account will be paused tomorrow`,
    html: `<h2 style="color:#ef4444">Account Suspension Warning</h2>
      <p>Hi ${name},</p>
      <p>We've been unable to process your payment after multiple attempts. <strong>Your account will be paused tomorrow</strong>, which means:</p>
      <div style="background:#fef2f2;border-left:4px solid #ef4444;padding:16px;margin:16px 0;border-radius:4px">
        <p style="margin:4px 0;color:#991b1b">&#10007; Your AI chat widget goes offline</p>
        <p style="margin:4px 0;color:#991b1b">&#10007; Lead capture stops</p>
        <p style="margin:4px 0;color:#991b1b">&#10007; All automations pause</p>
      </div>
      <p>Please update your payment method immediately to avoid any disruption:</p>
      <p style="margin-top:20px">
        <a href="${APP_URL}/dashboard/settings" style="display:inline-block;background:#ef4444;color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:600;font-size:16px">Fix Payment Now</a>
      </p>`,
  });
}
