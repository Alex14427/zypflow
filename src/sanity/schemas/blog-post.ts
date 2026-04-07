// Sanity schema definition for blog posts.
// These are plain objects — add `sanity` package and use defineType/defineField
// when the Sanity project is configured.

export const blogPost = {
  name: 'blogPost',
  title: 'Blog Post',
  type: 'document',
  fields: [
    {
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: (Rule: { required: () => unknown }) => Rule.required(),
    },
    {
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: { source: 'title', maxLength: 96 },
      validation: (Rule: { required: () => unknown }) => Rule.required(),
    },
    { name: 'excerpt', title: 'Excerpt', type: 'text', rows: 3 },
    {
      name: 'coverImage',
      title: 'Cover Image',
      type: 'image',
      options: { hotspot: true },
    },
    {
      name: 'body',
      title: 'Body',
      type: 'array',
      of: [{ type: 'block' }, { type: 'image', options: { hotspot: true } }],
    },
    {
      name: 'category',
      title: 'Category',
      type: 'string',
      options: {
        list: [
          { title: 'Clinic Growth', value: 'clinic-growth' },
          { title: 'Automation', value: 'automation' },
          { title: 'Patient Experience', value: 'patient-experience' },
          { title: 'Industry Insights', value: 'industry-insights' },
        ],
      },
    },
    { name: 'publishedAt', title: 'Published At', type: 'datetime' },
    {
      name: 'seo',
      title: 'SEO',
      type: 'object',
      fields: [
        { name: 'metaTitle', title: 'Meta Title', type: 'string' },
        { name: 'metaDescription', title: 'Meta Description', type: 'text', rows: 2 },
      ],
    },
  ],
  orderings: [
    {
      title: 'Published Date (Newest)',
      name: 'publishedAtDesc',
      by: [{ field: 'publishedAt', direction: 'desc' }],
    },
  ],
  preview: {
    select: { title: 'title', media: 'coverImage', date: 'publishedAt' },
    prepare({ title, media, date }: { title: string; media: unknown; date: string }) {
      return {
        title,
        media,
        subtitle: date ? new Date(date).toLocaleDateString('en-GB') : 'Draft',
      };
    },
  },
};
