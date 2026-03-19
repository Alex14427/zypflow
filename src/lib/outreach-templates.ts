// Outreach email templates for Instantly.ai campaigns
// Used in Section 12.1 of Zypflow-FINAL.docx

export const OUTREACH_SEQUENCES = {
  dental: {
    name: 'Dental Practice Outreach',
    steps: [
      {
        day: 0,
        subject: '{{companyName}} — filling your appointment book with AI',
        body: `Hi {{firstName}},

I noticed {{companyName}} has great reviews online — clearly you're doing excellent work.

I'm reaching out because we've built an AI receptionist specifically for dental practices that:

- Answers patient questions 24/7 (treatments, pricing, availability)
- Books consultations automatically via your existing calendar
- Captures every enquiry — no more missed calls or late-night form fills

Practices using it are seeing 30-40% more bookings from the same website traffic.

Would you be open to a quick 10-minute demo? I can show you exactly how it works with a dental practice like yours.

Best,
Alex
Zypflow`,
      },
      {
        day: 3,
        subject: 'Re: {{companyName}} — filling your appointment book with AI',
        body: `Hi {{firstName}},

Just following up on my previous email. I know dental practices are incredibly busy, so I'll keep this brief.

One of our clients (a 3-chair practice in Manchester) went from 12 online bookings/month to 34 after installing our AI chat widget. It took them 15 minutes to set up.

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

I came across {{companyName}} and was impressed by your clinic's online presence.

We've built an AI assistant specifically for aesthetics clinics that handles the conversations your team doesn't have time for:

- Answers treatment questions instantly (Botox, fillers, skin treatments)
- Provides pricing guidance without you lifting a finger
- Books consultations directly into your calendar
- Captures leads from Instagram, Google, and your website

Clinics using Zypflow are converting 35% more website visitors into booked consultations.

Would a quick 10-minute call be useful? I can walk you through a live demo.

Best,
Alex
Zypflow`,
      },
      {
        day: 3,
        subject: 'Re: {{companyName}} — convert more enquiries into consultations',
        body: `Hi {{firstName}},

Quick follow-up — I wanted to share that one aesthetics clinic we work with was losing 60% of their enquiries because they couldn't respond fast enough (most came in after 6pm).

After adding our AI chat assistant, they captured every single one. Their consultation bookings went up 41% in the first month.

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
Zypflow`,
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

I noticed {{companyName}} and wanted to reach out.

We've built an AI assistant that helps service businesses like yours:

- Answer customer questions instantly, 24/7
- Book appointments automatically
- Capture every lead — even at 2am
- Follow up with leads who don't book straight away

It installs in 5 minutes (one line of code on your website) and businesses are seeing 30%+ more bookings.

Would you be open to a quick chat? I'd love to show you how it works.

Best,
Alex
Zypflow`,
      },
      {
        day: 3,
        subject: 'Re: {{companyName}}',
        body: `Hi {{firstName}},

Just a quick follow-up. I know you're busy running {{companyName}}, so I'll be brief:

Our AI assistant answers the questions your customers ask most (pricing, availability, services) and books them in automatically. No extra staff needed.

Happy to do a quick 10-minute demo if you're curious.

Alex`,
      },
      {
        day: 7,
        subject: 'Last one from me',
        body: `Hi {{firstName}},

Last email, I promise! If you ever want to explore how AI can help {{companyName}} grow, just reply here.

Wishing you all the best,
Alex
Zypflow | zypflow.com`,
      },
    ],
  },
};
