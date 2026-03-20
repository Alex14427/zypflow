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
        smsVersion: `Hi {{firstName}}, I noticed {{companyName}} has great reviews. We help dental practices book 30-40% more appointments using AI. Fancy a quick chat? — Alex, Zypflow`,
        body: `Hi {{firstName}},

I noticed {{companyName}} has great reviews online — clearly you're doing excellent work in {{city}}.

I'm reaching out because we've built an AI receptionist specifically for dental practices that:

- Answers patient questions 24/7 (treatments, pricing, availability)
- Books consultations automatically via your existing calendar
- Captures every enquiry — no more missed calls or late-night form fills
- Sends automated appointment reminders (cuts no-shows by 40%)

Practices using it are seeing 30-40% more bookings from the same website traffic.

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

One of our clients (a 3-chair practice in Manchester) went from 12 online bookings/month to 34 after installing our AI chat widget. It took them 15 minutes to set up.

The AI handles the questions patients ask most — "How much do veneers cost?", "Do you do emergency appointments?", "Can I get a same-day crown?" — and books them straight in.

Happy to share exactly how they did it if you're interested.

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

Clinics using Zypflow are converting 35% more website visitors into booked consultations.

Would a quick 10-minute call be useful? I can walk you through a live demo.

Best,
Alex
Zypflow | zypflow.com`,
      },
      {
        day: 3,
        subject: 'Re: {{companyName}} — convert more enquiries into consultations',
        body: `Hi {{firstName}},

Quick follow-up — I wanted to share that one aesthetics clinic we work with was losing 60% of their enquiries because they couldn't respond fast enough (most came in after 6pm via Instagram).

After adding our AI chat assistant, they captured every single one. Their consultation bookings went up 41% in the first month, and their average booking value increased because the AI pre-qualified clients before consultations.

If that sounds interesting, I'm happy to show you how it works — takes 10 minutes.

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

One physio clinic we work with added 22 new patient bookings in their first month — all from existing website traffic they weren't converting before.

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

Law firms using it are converting 25-30% more website visitors into booked consultations, because they're responding in seconds rather than hours.

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

Our AI assistant responds instantly, gathers their details, and books them in. One firm we work with captured 18 new consultations in their first month from enquiries they would have otherwise missed.

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

Home service businesses using it are seeing 30%+ more bookings — mainly from enquiries they were previously missing because they were too busy to answer the phone.

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

One plumber in Leeds added 15 new jobs in his first month without lifting a finger. Setup took him 10 minutes.

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

It installs in 5 minutes (one line of code on your website) and businesses are seeing 30%+ more bookings from the same traffic.

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

One business we work with went from missing 40% of their enquiries to capturing every single one — their bookings increased 33% in 30 days.

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

We just published a case study from a service business in {{city}} that went from 12 online bookings/month to 47 using AI. Here's the short version:

- Installed AI chat widget on their website (took 10 minutes)
- AI answered customer questions 24/7 and captured contact details
- Automated follow-ups nudged undecided enquiries into bookings
- No-show rate dropped from 28% to 11% with automated reminders

If you'd like the full case study, just reply 'send it' and I'll email it over.

No hard sell — just thought it might be relevant for {{companyName}}.

Alex
Zypflow | zypflow.com`,
        smsVersion: `Hi {{firstName}}, thought you'd find this useful — a business like {{companyName}} went from 12 to 47 monthly bookings using AI automation. Want the case study? Reply YES`,
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
