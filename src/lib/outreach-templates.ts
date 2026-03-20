// Outreach email templates for Instantly.ai campaigns
// Covers all target industries with 5-email sequences (days 0, 3, 7, 14, 21)
// Each step includes A/B subject line variants for split testing
// Unsubscribe link appended by Instantly.ai automatically

export interface OutreachStep {
  day: number;
  subject: string;
  subjectB?: string; // A/B variant
  body: string;
  smsVersion?: string; // SMS version for multi-channel
}

export interface OutreachSequence {
  name: string;
  steps: OutreachStep[];
}

export const OUTREACH_SEQUENCES: Record<string, OutreachSequence> = {
  dental: {
    name: 'Dental Practice Outreach',
    steps: [
      {
        day: 0,
        subject: '{{companyName}} — filling your appointment book with AI',
        subjectB: 'Quick question for {{companyName}}',
        smsVersion: `Hi {{firstName}}, we built an AI assistant for dental practices that answers patient questions and books appointments 24/7. 14-day free trial, no card needed. Fancy a quick chat? — Alex, Zypflow`,
        body: `Hi {{firstName}},

I noticed {{companyName}} has great reviews online — clearly you're doing excellent work in {{city}}.

I'm reaching out because we've built an AI receptionist specifically for dental practices that:

- Answers patient questions 24/7 (treatments, pricing, availability)
- Books consultations automatically via your existing calendar
- Captures every enquiry — no more missed calls or late-night form fills
- Sends automated appointment reminders (cuts no-shows by 40%)

It means every enquiry gets answered instantly — even at 2am on a Sunday.

Would you be open to a quick 10-minute demo? I can show you exactly how it works with a dental practice like yours.

Best,
Alex
Zypflow | zypflow.com`,
      },
      {
        day: 3,
        subject: 'Re: {{companyName}} — filling your appointment book with AI',
        body: `Hi {{firstName}},

Just following up on my previous email. I know dental practices are incredibly busy, so I'll keep this brief.

The AI handles the questions patients ask most — "How much do veneers cost?", "Do you do emergency appointments?", "Can I get a same-day crown?" — and books them straight in.

It takes 15 minutes to set up and there's a 14-day free trial, so there's no risk in trying it.

Best,
Alex`,
      },
      {
        day: 7,
        subject: 'Last one from me, {{firstName}}',
        body: `Hi {{firstName}},

I don't want to be a pest, so this will be my last email.

If you ever want to explore how AI can help {{companyName}} capture more patient enquiries and fill your books, just reply to this email.

No cost for a demo, no commitment — just a quick look at what's possible.

Wishing you and the team all the best.

Alex
Zypflow | zypflow.com`,
      },
    ],
  },

  aesthetics: {
    name: 'Aesthetics Clinic Outreach',
    steps: [
      {
        day: 0,
        subject: '{{companyName}} — convert more enquiries into consultations',
        body: `Hi {{firstName}},

I came across {{companyName}} and was impressed by your clinic's online presence in {{city}}.

We've built an AI assistant specifically for aesthetics clinics that handles the conversations your team doesn't have time for:

- Answers treatment questions instantly (Botox, fillers, skin treatments, body contouring)
- Provides pricing guidance without you lifting a finger
- Books consultations directly into your calendar
- Captures leads from Instagram, Google, and your website — even at midnight

It means no enquiry goes unanswered — even the ones that come in at midnight via Instagram.

Would a quick 10-minute call be useful? I can walk you through a live demo.

Best,
Alex
Zypflow | zypflow.com`,
      },
      {
        day: 3,
        subject: 'Re: {{companyName}} — convert more enquiries into consultations',
        body: `Hi {{firstName}},

Quick follow-up. Most aesthetics enquiries come in after 6pm — when your team has gone home. That's exactly when our AI steps in.

It handles treatment questions, gives pricing guidance, and books consultations directly into your calendar. All while you're off the clock.

14-day free trial, no card required. Happy to show you how it works — takes 10 minutes.

Alex`,
      },
      {
        day: 7,
        subject: 'Last note, {{firstName}}',
        body: `Hi {{firstName}},

Final email from me! If the timing isn't right, no worries at all.

Whenever you're ready to explore how AI can help {{companyName}} capture more leads and fill your consultation diary, just reply here.

All the best,
Alex
Zypflow | zypflow.com`,
      },
    ],
  },

  physiotherapy: {
    name: 'Physiotherapy Practice Outreach',
    steps: [
      {
        day: 0,
        subject: '{{companyName}} — more bookings without more admin',
        body: `Hi {{firstName}},

I noticed {{companyName}} in {{city}} and wanted to reach out.

We've built an AI assistant for physiotherapy practices that handles the initial patient conversations your front desk doesn't have time for:

- Answers common questions 24/7 ("Do you treat sports injuries?", "How much is an initial assessment?", "Do you do evening appointments?")
- Books new patient assessments directly into your calendar
- Captures every website and Google enquiry — even out of hours
- Sends appointment reminders automatically (reduces no-shows by 35-40%)

Most physio practices lose enquiries simply because no one's free to answer. Our AI makes sure that never happens.

Fancy a quick 10-minute demo? Happy to show you how it works.

Best,
Alex
Zypflow | zypflow.com`,
      },
      {
        day: 3,
        subject: 'Re: {{companyName}} — more bookings without more admin',
        body: `Hi {{firstName}},

Quick follow-up. I know physio practices are often short-staffed at reception, which means missed calls and slow follow-ups.

Our AI assistant sits on your website and handles those conversations instantly — like a virtual receptionist that never takes a break. It knows your services, prices, and availability, and books patients straight in.

Setup takes about 15 minutes (one line of code on your website). Would be happy to walk you through it.

Alex`,
      },
      {
        day: 7,
        subject: 'Last one from me',
        body: `Hi {{firstName}},

Last email, I promise! If you ever want to explore how AI can help {{companyName}} capture more patient enquiries without adding to your admin, just reply here.

Wishing you all the best,
Alex
Zypflow | zypflow.com`,
      },
    ],
  },

  legal: {
    name: 'Legal Practice Outreach',
    steps: [
      {
        day: 0,
        subject: '{{companyName}} — capture more client enquiries with AI',
        body: `Hi {{firstName}},

I came across {{companyName}} in {{city}} and wanted to reach out.

We've built an AI assistant for law firms and legal practices that handles initial client enquiries professionally:

- Answers common questions 24/7 ("Do you handle employment disputes?", "What are your fees?", "Can I book a free consultation?")
- Books initial consultations directly into your diary
- Captures every website enquiry — even the ones that come in at 11pm
- Pre-qualifies leads so you only speak to serious prospects

Speed matters — potential clients who get a response in seconds are far more likely to book than those waiting hours for a callback.

Would you be open to a quick 10-minute demo? I can show you exactly how it works for legal practices.

Best,
Alex
Zypflow | zypflow.com`,
      },
      {
        day: 3,
        subject: 'Re: {{companyName}} — capture more client enquiries with AI',
        body: `Hi {{firstName}},

Just following up. One thing I hear from law firms is that potential clients often enquire outside business hours — evenings, weekends — and by Monday morning they've already gone elsewhere.

Our AI assistant responds instantly, gathers their details, and books them in. Most firms we speak to tell us they're losing enquiries to competitors who simply respond faster. Our AI responds in under 2 seconds, 24/7.

Happy to show you how it works in 10 minutes if you're curious.

Alex`,
      },
      {
        day: 7,
        subject: 'Last note from me, {{firstName}}',
        body: `Hi {{firstName}},

Final email from me. If the timing isn't right, no pressure at all.

Whenever you're ready to explore how AI can help {{companyName}} capture more client enquiries, just reply here. Happy to chat anytime.

All the best,
Alex
Zypflow | zypflow.com`,
      },
    ],
  },

  homeServices: {
    name: 'Home Services Outreach',
    steps: [
      {
        day: 0,
        subject: '{{companyName}} — never miss a job enquiry again',
        body: `Hi {{firstName}},

I noticed {{companyName}} in {{city}} and wanted to reach out.

We've built an AI assistant for home service businesses (plumbing, electrical, cleaning, landscaping, handyman, etc.) that captures every enquiry — even when you're on a job:

- Answers customer questions 24/7 ("How much for a boiler service?", "Do you cover my area?", "Are you available this week?")
- Books appointments automatically into your calendar
- Follows up with leads who don't book straight away
- Sends appointment reminders so customers don't forget

It means you never miss an enquiry while you're on a job — your AI handles it and books them straight in.

Would you be open to a quick 10-minute chat? Happy to show you how it works.

Best,
Alex
Zypflow | zypflow.com`,
      },
      {
        day: 3,
        subject: 'Re: {{companyName}}',
        body: `Hi {{firstName}},

Just a quick follow-up. I know you're busy running {{companyName}} and probably don't have time to sit at a computer answering enquiries all day.

That's exactly the problem we solve. Our AI handles those conversations automatically — on your website, 24/7 — and books jobs straight into your diary. No extra staff, no missed calls.

Setup takes 10 minutes and there's a 14-day free trial — no card needed, no risk.

Happy to do a quick demo if you're curious.

Alex`,
      },
      {
        day: 7,
        subject: 'Last one from me',
        body: `Hi {{firstName}},

Last email, I promise! If you ever want to explore how AI can help {{companyName}} grow without the admin headache, just reply here.

Wishing you all the best,
Alex
Zypflow | zypflow.com`,
      },
    ],
  },

  general: {
    name: 'General Service Business Outreach',
    steps: [
      {
        day: 0,
        subject: '{{companyName}} — never miss a customer enquiry again',
        body: `Hi {{firstName}},

I noticed {{companyName}} in {{city}} and wanted to reach out.

We've built an AI assistant that helps service businesses like yours:

- Answer customer questions instantly, 24/7
- Book appointments automatically
- Capture every lead — even at 2am
- Follow up with leads who don't book straight away
- Send appointment reminders (cuts no-shows by 35%)

It installs in 5 minutes (one line of code on your website) and starts capturing leads immediately.

Would you be open to a quick chat? I'd love to show you how it works.

Best,
Alex
Zypflow | zypflow.com`,
      },
      {
        day: 3,
        subject: 'Re: {{companyName}}',
        body: `Hi {{firstName}},

Just a quick follow-up. I know you're busy running {{companyName}}, so I'll be brief:

Our AI assistant answers the questions your customers ask most (pricing, availability, services) and books them in automatically. No extra staff needed.

The whole point is simple: every enquiry gets answered in under 2 seconds, 24/7. No more missed opportunities.

Happy to do a quick 10-minute demo if you're curious.

Alex`,
      },
      {
        day: 7,
        subject: 'Last one from me',
        subjectB: '{{firstName}}, one last thing',
        body: `Hi {{firstName}},

Last email, I promise! If you ever want to explore how AI can help {{companyName}} grow, just reply here.

Wishing you all the best,
Alex
Zypflow | zypflow.com`,
      },
      {
        day: 14,
        subject: '{{companyName}} — quick case study',
        subjectB: 'Thought of {{companyName}} when I saw this',
        body: `Hi {{firstName}},

Apologies for the extra email — I wanted to share something genuinely useful.

I wanted to share what Zypflow actually does in practice for businesses like {{companyName}}:

- AI chat widget answers customer questions 24/7 (takes 10 minutes to install)
- Captures every lead — even the ones that come in at 2am
- Automated follow-ups nudge undecided enquiries into bookings
- Appointment reminders cut no-shows via SMS and email

We're offering a 14-day free trial with no card required. If you'd like to try it, just reply and I'll send you a link.

No hard sell — just thought it might be useful for {{companyName}}.

Alex
Zypflow | zypflow.com`,
        smsVersion: `Hi {{firstName}}, we help businesses like {{companyName}} capture every enquiry 24/7 using AI. 14-day free trial, no card needed. Want to try it? Reply YES — Alex, Zypflow`,
      },
      {
        day: 21,
        subject: 'Open invitation, {{firstName}}',
        subjectB: '{{companyName}} — standing offer',
        body: `Hi {{firstName}},

This is genuinely the last time I'll reach out.

If things change down the line and you want to explore how AI can help {{companyName}} capture more enquiries and grow — I'm always here. Just reply to this email anytime, even months from now.

We're a small UK team building tools specifically for businesses like yours. No pressure, no tricks, just a standing offer to help.

Wishing you and the team all the best.

Alex
Zypflow | zypflow.com`,
      },
    ],
  },
};
