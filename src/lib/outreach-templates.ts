// Outreach sequences for Zypflow's native audit-led acquisition engine.
// These are written for a managed founding-pilot offer, not self-serve trials.

export interface OutreachStep {
  day: number;
  subject: string;
  subjectB?: string;
  body: string;
  smsVersion?: string;
}

export interface OutreachSequence {
  name: string;
  steps: OutreachStep[];
}

export const OUTREACH_SEQUENCES: Record<string, OutreachSequence> = {
  dental: {
    name: 'Private Dental Outreach',
    steps: [
      {
        day: 0,
        subject: '{{companyName}} - reducing missed private treatment enquiries',
        subjectB: 'Quick question for {{companyName}}',
        smsVersion:
          'Hi {{firstName}}, I run Zypflow. We help private clinics fix slow response, missed enquiries, and no-shows. I can send over a quick revenue leak audit for {{companyName}} if useful. - Alex',
        body: `Hi {{firstName}},

I was looking at {{companyName}} because we are building Zypflow specifically for private clinics in {{city}}.

The short version: we help clinics stop losing high-intent enquiries because of slow replies, booking friction, and weak follow-up.

The managed system covers:
- instant enquiry replies
- booking nudges
- reminder flows
- review requests
- rebooking prompts

If it helps, I can send over a quick Revenue Leak Audit for {{companyName}} and show you where the website and follow-up flow are likely costing bookings.

Alex`,
      },
      {
        day: 3,
        subject: 'Re: {{companyName}} - reducing missed private treatment enquiries',
        body: `Hi {{firstName}},

Following up in case the first note got buried.

For most private clinics, the leak is not demand. It is what happens between someone showing interest and actually booking.

That is the gap Zypflow is built to fix with a standardized managed setup, rather than more front-desk admin.

If it would be useful, I can show you the audit and the exact automation pack we deploy first.

Alex`,
      },
      {
        day: 7,
        subject: 'Last one from me, {{firstName}}',
        body: `Hi {{firstName}},

Closing the loop from my side.

If reducing missed enquiries and no-shows becomes a priority for {{companyName}}, just reply and I will send the audit over.

Alex`,
      },
    ],
  },

  aesthetics: {
    name: 'Aesthetics Clinic Outreach',
    steps: [
      {
        day: 0,
        subject: '{{companyName}} - convert more enquiries into consultations',
        body: `Hi {{firstName}},

I came across {{companyName}} while researching aesthetics clinics in {{city}}.

We are building Zypflow specifically for clinics that are already getting demand but leaking bookings between first enquiry and consult.

The core system handles:
- instant follow-up to new enquiries
- booking nudges for warm leads
- reminder flows to reduce no-shows
- review requests and top-up reminders after treatment

It is a managed setup, not another dashboard for your team to babysit.

If helpful, I can send over a quick Revenue Leak Audit for {{companyName}} and show where the biggest conversion gaps probably are.

Alex`,
      },
      {
        day: 3,
        subject: 'Re: {{companyName}} - convert more enquiries into consultations',
        body: `Hi {{firstName}},

Quick follow-up.

Most clinics do not need more leads first. They need tighter follow-up, faster replies, and a cleaner path from website visit to booked consult.

That is the first pack we deploy with Zypflow.

If you want the audit, just reply with the best website link and I will send it over.

Alex`,
      },
      {
        day: 7,
        subject: 'Last note, {{firstName}}',
        body: `Hi {{firstName}},

Last note from me.

If increasing consult bookings and reducing no-shows becomes a priority for {{companyName}}, just reply and I will send the audit link across.

Alex`,
      },
    ],
  },

  physiotherapy: {
    name: 'Physiotherapy Practice Outreach',
    steps: [
      {
        day: 0,
        subject: '{{companyName}} - reduce missed enquiries and follow-up gaps',
        body: `Hi {{firstName}},

I noticed {{companyName}} in {{city}} and wanted to reach out because we are building Zypflow for clinics that lose bookings in the gap between enquiry and appointment.

The first automation pack covers instant replies, booking nudges, reminders, reviews, and rebooking prompts.

If useful, I can send a quick Revenue Leak Audit and highlight the main conversion gaps I spotted.

Alex`,
      },
      {
        day: 3,
        subject: 'Re: {{companyName}} - reduce missed enquiries and follow-up gaps',
        body: `Hi {{firstName}},

Following up in case this is relevant.

Most clinics do not need more admin. They need a cleaner system for turning warm interest into booked appointments.

If you want the audit, reply here and I will send it across.

Alex`,
      },
      {
        day: 7,
        subject: 'Last one from me',
        body: `Hi {{firstName}},

Closing the loop from my side.

If fixing missed enquiries becomes a priority for {{companyName}}, reply and I will send over the audit.

Alex`,
      },
    ],
  },

  legal: {
    name: 'Legal Practice Outreach',
    steps: [
      {
        day: 0,
        subject: '{{companyName}} - capture more client enquiries cleanly',
        body: `Hi {{firstName}},

I came across {{companyName}} in {{city}} and wanted to reach out because we are building Zypflow for firms that lose too many warm enquiries to slow response and weak follow-up.

The first automation pack handles instant replies, booking nudges, reminders, and follow-up without adding more admin load.

If useful, I can send over a quick Revenue Leak Audit and show the main gaps I spotted.

Alex`,
      },
      {
        day: 3,
        subject: 'Re: {{companyName}} - capture more client enquiries cleanly',
        body: `Hi {{firstName}},

Following up in case the first note got buried.

The main pattern we see is simple: firms lose work because response speed and follow-up are weaker than they think.

If you want the audit, reply here and I will send it across.

Alex`,
      },
      {
        day: 7,
        subject: 'Last note from me, {{firstName}}',
        body: `Hi {{firstName}},

Last note from me.

If improving enquiry conversion becomes a priority for {{companyName}}, reply and I will send over the audit.

Alex`,
      },
    ],
  },

  homeServices: {
    name: 'Home Services Outreach',
    steps: [
      {
        day: 0,
        subject: '{{companyName}} - stop missing job enquiries',
        body: `Hi {{firstName}},

I noticed {{companyName}} in {{city}} and wanted to reach out because we are building Zypflow for service businesses that lose jobs when no one is free to reply quickly.

The system handles instant replies, quote nudges, reminders, and follow-up automatically.

If useful, I can send over a quick Revenue Leak Audit and show where the main gaps are.

Alex`,
      },
      {
        day: 3,
        subject: 'Re: {{companyName}} - stop missing job enquiries',
        body: `Hi {{firstName}},

Quick follow-up.

The biggest leak for most service businesses is not traffic. It is missed response windows and weak follow-up while the owner is busy doing the work.

If you want the audit, just reply and I will send it across.

Alex`,
      },
      {
        day: 7,
        subject: 'Last one from me',
        body: `Hi {{firstName}},

Closing the loop from my side.

If fixing missed enquiries becomes a priority for {{companyName}}, reply and I will send over the audit.

Alex`,
      },
    ],
  },

  general: {
    name: 'General Service Business Outreach',
    steps: [
      {
        day: 0,
        subject: '{{companyName}} - reduce missed enquiries and booking drop-off',
        body: `Hi {{firstName}},

I noticed {{companyName}} in {{city}} and wanted to reach out because we are building Zypflow for service businesses that already have demand but lose too much of it in follow-up.

The system handles:
- instant replies
- booking nudges
- reminders
- review requests
- repeat-booking prompts

It is designed to automate the repetitive part of lead conversion without turning into more admin for the owner.

If useful, I can send over a quick Revenue Leak Audit and show the first automations we would put live.

Alex`,
      },
      {
        day: 3,
        subject: 'Re: {{companyName}}',
        body: `Hi {{firstName}},

Just a quick follow-up.

The main thing we usually find is not a traffic problem, it is a response-speed and follow-up problem.

That is exactly what Zypflow is meant to automate.

If you want the audit, just reply here and I will send it across.

Alex`,
      },
      {
        day: 7,
        subject: 'Last one from me',
        subjectB: '{{firstName}}, one last thing',
        body: `Hi {{firstName}},

Closing the loop from my side.

If fixing missed enquiries becomes a priority for {{companyName}}, just reply and I will send over the audit.

Alex`,
      },
      {
        day: 14,
        subject: '{{companyName}} - quick case study',
        subjectB: 'Thought of {{companyName}} when I saw this',
        body: `Hi {{firstName}},

One more practical note.

What Zypflow does in practice for businesses like {{companyName}}:

- captures more enquiries
- follows up instantly
- nudges bookings
- reduces no-shows
- brings previous customers back automatically

If you want the audit and the first workflow pack breakdown, just reply and I will send it.

Alex`,
        smsVersion:
          'Hi {{firstName}}, we help businesses like {{companyName}} fix missed enquiries, follow-up gaps, and no-shows. If you want a quick audit, reply YES. - Alex, Zypflow',
      },
      {
        day: 21,
        subject: 'Open invitation, {{firstName}}',
        subjectB: '{{companyName}} - standing offer',
        body: `Hi {{firstName}},

This is genuinely the last time I will reach out.

If things change down the line and you want to explore how Zypflow could help {{companyName}} capture more enquiries and grow, just reply any time.

We are a small UK team building specifically around the revenue gaps most service businesses live with every week. No pressure, just a standing offer to help.

Alex`,
      },
    ],
  },
};
