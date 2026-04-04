import { sendEmail } from '@/lib/email';
import { generateRevenueLeakAudit, type AuditReport } from '@/lib/audit-engine';
import { OUTREACH_SEQUENCES } from '@/lib/outreach-templates';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://app.zypflow.com';
const BOOKING_URL = process.env.NEXT_PUBLIC_BOOKING_LINK || 'https://calendly.com/alex-zypflow/30min';

type ProspectRecord = {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  business_name: string | null;
  website: string | null;
  industry: string | null;
  city: string | null;
  status: string | null;
  audit_id?: string | null;
  audit_score?: number | null;
  audit_top_leak?: string | null;
  outreach_stage?: number | null;
  sequence_name?: string | null;
};

export function mapProspectIndustry(industry: string | null): string {
  if (!industry) return 'general';
  const lower = industry.toLowerCase();
  if (lower.includes('dental')) return 'dental';
  if (lower.includes('aestheti') || lower.includes('beauty') || lower.includes('skin')) return 'aesthetics';
  if (lower.includes('physio')) return 'physiotherapy';
  if (lower.includes('legal') || lower.includes('law')) return 'legal';
  if (lower.includes('plumb') || lower.includes('electric') || lower.includes('clean') || lower.includes('landscap')) {
    return 'homeServices';
  }
  return 'general';
}

export function extractFirstName(name: string) {
  if (!name) return '';
  return name.split(/\s+/)[0].replace(/[^a-zA-Z'-]/g, '');
}

function personalise(text: string, variables: Record<string, string>) {
  return Object.entries(variables).reduce((current, [key, value]) => {
    const safeValue = value || '';
    return current.replaceAll(`{{${key}}}`, safeValue);
  }, text);
}

function toHtml(text: string) {
  return text
    .split('\n\n')
    .map((paragraph) => {
      if (paragraph.startsWith('- ')) {
        const items = paragraph
          .split('\n')
          .map((line) => line.replace(/^- /, '').trim())
          .filter(Boolean)
          .map((line) => `<li>${escapeHtml(line)}</li>`)
          .join('');
        return `<ul>${items}</ul>`;
      }

      return `<p>${escapeHtml(paragraph).replace(/\n/g, '<br />')}</p>`;
    })
    .join('');
}

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function computeNextFollowUpAt(sequenceDays: number[], stageIndex: number, now: Date) {
  const currentDay = sequenceDays[stageIndex] ?? 0;
  const nextDay = sequenceDays[stageIndex + 1];
  if (typeof nextDay !== 'number') return null;

  const deltaDays = Math.max(1, nextDay - currentDay);
  const next = new Date(now);
  next.setDate(next.getDate() + deltaDays);
  return next.toISOString();
}

export async function buildProspectAudit(input: {
  website: string;
  businessName: string;
  email?: string | null;
}) {
  const report = await generateRevenueLeakAudit({
    website: input.website,
    businessName: input.businessName,
  });

  return {
    report,
    insertPayload: {
      url: report.finalUrl,
      email: input.email ?? null,
      score_performance: report.scorecards.find((card) => card.key === 'performance')?.score ?? null,
      score_accessibility: report.scorecards.find((card) => card.key === 'accessibility')?.score ?? null,
      score_best_practices: report.scorecards.find((card) => card.key === 'best_practices')?.score ?? null,
      score_seo: report.scorecards.find((card) => card.key === 'seo')?.score ?? null,
      is_mobile_friendly: report.signals.hasViewport,
      has_ssl: report.signals.hasSsl,
      raw_results: report,
      ai_summary: `${report.summary.headline}. ${report.summary.body}`,
    },
  };
}

export function buildOutreachStep(input: {
  prospect: ProspectRecord;
  audit: { id: string; report: AuditReport } | null;
}) {
  const industryKey = mapProspectIndustry(input.prospect.industry);
  const sequence = OUTREACH_SEQUENCES[industryKey as keyof typeof OUTREACH_SEQUENCES] || OUTREACH_SEQUENCES.general;
  const currentStage = Math.max(0, input.prospect.outreach_stage ?? 0);
  const currentStep = sequence.steps[currentStage];

  if (!currentStep) {
    return null;
  }

  const firstName = extractFirstName(input.prospect.name || input.prospect.business_name || '');
  const variables = {
    firstName: firstName || 'there',
    companyName: input.prospect.business_name || 'your clinic',
    city: input.prospect.city || 'London',
    website: input.prospect.website || '',
  };

  const reportLink = input.audit ? `${APP_URL}/audit/${input.audit.id}` : '';
  const topLeak = input.audit?.report.summary.topLeak || input.prospect.audit_top_leak || 'weak conversion paths';
  const score = input.audit?.report.overallScore ?? input.prospect.audit_score ?? null;

  let subject = personalise(currentStep.subject, variables);
  let body = personalise(currentStep.body, variables);

  if (currentStage === 0 && input.audit) {
    subject = `${variables.companyName}: spotted ${topLeak.toLowerCase()}`;
    body = `Hi ${variables.firstName},

I ran a quick Revenue Leak Audit on ${variables.companyName}'s website and one thing stood out immediately: ${topLeak.toLowerCase()}.

Current site score: ${score}/100
Audit report: ${reportLink}

In practice, this usually means warm visitors are getting interested but not moving cleanly into a booked consultation.

Zypflow fixes that by automating the part clinics usually lose time on:
- instant enquiry replies
- booking nudges
- appointment reminders
- reviews and rebooking

If useful, I can walk you through the report and show how we'd automate the first fixes for ${variables.companyName}.

Would a quick chat be useful?

Alex
Zypflow`;
  } else if (currentStage > 0 && input.audit) {
    body = `${body}

P.S. I still have your audit here if you'd like it:
${reportLink}`;
  }

  const html = `${toHtml(body)}
    <p style="margin-top:20px">
      <a href="${BOOKING_URL}" style="display:inline-block;background:#6c3cff;color:#fff;padding:12px 24px;border-radius:999px;text-decoration:none;font-weight:600">Book a quick audit call</a>
    </p>`;

  const preview = body.split('\n').find(Boolean)?.slice(0, 180) || body.slice(0, 180);
  const now = new Date();

  return {
    sequenceName: sequence.name,
    stageIndex: currentStage,
    subject,
    body,
    html,
    preview,
    nextFollowUpAt: computeNextFollowUpAt(sequence.steps.map((step) => step.day), currentStage, now),
    send: async () =>
      sendEmail({
        to: input.prospect.email as string,
        subject,
        html,
      }),
  };
}
