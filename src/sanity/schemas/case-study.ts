import { defineField, defineType } from 'sanity';

export const caseStudy = defineType({
  name: 'caseStudy',
  title: 'Case Study',
  type: 'document',
  fields: [
    defineField({
      name: 'clinicName',
      title: 'Clinic Name',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: { source: 'clinicName', maxLength: 96 },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'location',
      title: 'Location',
      type: 'string',
    }),
    defineField({
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
    }),
    defineField({
      name: 'logo',
      title: 'Clinic Logo',
      type: 'image',
    }),
    defineField({
      name: 'heroImage',
      title: 'Hero Image',
      type: 'image',
      options: { hotspot: true },
    }),
    defineField({
      name: 'headline',
      title: 'Headline',
      type: 'string',
      description: 'e.g. "From 2 bookings/week to 14 — in 30 days"',
    }),
    defineField({
      name: 'excerpt',
      title: 'Short Summary',
      type: 'text',
      rows: 3,
    }),
    defineField({
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
    }),
    defineField({
      name: 'quote',
      title: 'Client Quote',
      type: 'object',
      fields: [
        { name: 'text', title: 'Quote Text', type: 'text', rows: 3 },
        { name: 'author', title: 'Author Name', type: 'string' },
        { name: 'role', title: 'Author Role', type: 'string' },
      ],
    }),
    defineField({
      name: 'body',
      title: 'Full Story',
      type: 'array',
      of: [
        { type: 'block' },
        { type: 'image', options: { hotspot: true } },
      ],
    }),
    defineField({
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
    }),
    defineField({
      name: 'publishedAt',
      title: 'Published At',
      type: 'datetime',
    }),
    defineField({
      name: 'featured',
      title: 'Featured on Homepage',
      type: 'boolean',
      initialValue: false,
    }),
  ],
  preview: {
    select: { title: 'clinicName', media: 'logo', headline: 'headline' },
    prepare({ title, media, headline }) {
      return { title, media, subtitle: headline };
    },
  },
});
