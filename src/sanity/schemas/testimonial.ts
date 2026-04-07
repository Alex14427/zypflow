// Sanity schema definition for testimonials.
// Plain objects — add `sanity` package and wrap with defineType/defineField
// when the Sanity project is configured.

export const testimonial = {
  name: 'testimonial',
  title: 'Testimonial',
  type: 'document',
  fields: [
    {
      name: 'name',
      title: 'Person Name',
      type: 'string',
      validation: (Rule: { required: () => unknown }) => Rule.required(),
    },
    { name: 'role', title: 'Role', type: 'string' },
    { name: 'clinicName', title: 'Clinic Name', type: 'string' },
    { name: 'location', title: 'Location', type: 'string' },
    { name: 'photo', title: 'Photo', type: 'image', options: { hotspot: true } },
    {
      name: 'quote',
      title: 'Quote',
      type: 'text',
      rows: 4,
      validation: (Rule: { required: () => unknown }) => Rule.required(),
    },
    {
      name: 'rating',
      title: 'Rating (1-5)',
      type: 'number',
      validation: (Rule: { min: (n: number) => { max: (n: number) => unknown } }) =>
        Rule.min(1).max(5),
      initialValue: 5,
    },
    {
      name: 'colorTheme',
      title: 'Card Color Theme',
      type: 'string',
      options: {
        list: [
          { title: 'Sage', value: 'sage' },
          { title: 'Sky', value: 'sky' },
          { title: 'Lavender', value: 'lavender' },
          { title: 'Blush', value: 'blush' },
          { title: 'Cream', value: 'cream' },
        ],
      },
      initialValue: 'sage',
    },
    { name: 'featured', title: 'Show on Homepage', type: 'boolean', initialValue: false },
  ],
  preview: {
    select: { title: 'name', subtitle: 'clinicName', media: 'photo' },
  },
};
