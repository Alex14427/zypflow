// Sanity schema definition for case studies.
// Plain objects — add `sanity` package and wrap with defineType/defineField
// when the Sanity project is configured.

export const caseStudy = {
  name: 'caseStudy',
  title: 'Case Study',
  type: 'document',
  fields: [
    {
      name: 'clinicName',
      title: 'Clinic Name',
      type: 'string',
      validation: (Rule: { required: () => unknown }) => Rule.required(),
    },
    {
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: { source: 'clinicName', maxLength: 96 },
      validation: (Rule: { required: () => unknown }) => Rule.required(),
    },
    { name: 'location', title: 'Location', type: 'string' },
    {
      name: 'clinicType',
      title: 'Clinic Type',
      type: 'string',
      options: {
        list: [
          { title: 'Aesthetics', value: 'aesthetics' },
          { title: 'Dermatology', value: 'dermatology' },
          { title: 'Dental', value: 'dental' },
          { title: 'Hair Restoration', value: 'hair-restoration' },
          { title: 'Wellness', value: 'wellness' },
        ],
      },
    },
    { name: 'logo', title: 'Clinic Logo', type: 'image' },
    { name: 'heroImage', title: 'Hero Image', type: 'image', options: { hotspot: true } },
    {
      name: 'headline',
      title: 'Headline',
      type: 'string',
      description: 'e.g. "From 2 bookings/week to 14 — in 30 days"',
    },
    { name: 'excerpt', title: 'Short Summary', type: 'text', rows: 3 },
    {
      name: 'metrics',
      title: 'Before / After Metrics',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            { name: 'label', title: 'Metric Label', type: 'string' },
            { name: 'before', title: 'Before', type: 'string' },
            { name: 'after', title: 'After', type: 'string' },
            { name: 'improvement', title: 'Improvement %', type: 'string' },
          ],
        },
      ],
    },
    {
      name: 'quote',
      title: 'Client Quote',
      type: 'object',
      fields: [
        { name: 'text', title: 'Quote Text', type: 'text', rows: 3 },
        { name: 'author', title: 'Author Name', type: 'string' },
        { name: 'role', title: 'Author Role', type: 'string' },
      ],
    },
    {
      name: 'body',
      title: 'Full Story',
      type: 'array',
      of: [{ type: 'block' }, { type: 'image', options: { hotspot: true } }],
    },
    {
      name: 'servicesUsed',
      title: 'Zypflow Features Used',
      type: 'array',
      of: [{ type: 'string' }],
      options: {
        list: [
          { title: 'Lead Auto-Response', value: 'lead-auto-response' },
          { title: 'Appointment Reminders', value: 'appointment-reminders' },
          { title: 'Review Requests', value: 'review-requests' },
          { title: 'Rebooking Automation', value: 'rebooking' },
          { title: 'AI Chat Widget', value: 'chat-widget' },
          { title: 'Revenue Leak Audit', value: 'audit' },
        ],
      },
    },
    { name: 'publishedAt', title: 'Published At', type: 'datetime' },
    { name: 'featured', title: 'Featured on Homepage', type: 'boolean', initialValue: false },
  ],
  preview: {
    select: { title: 'clinicName', media: 'logo', headline: 'headline' },
    prepare({ title, media, headline }: { title: string; media: unknown; headline: string }) {
      return { title, media, subtitle: headline };
    },
  },
};
