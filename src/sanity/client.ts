import { createClient } from '@sanity/client';
import imageUrlBuilder from '@sanity/image-url';

export const sanityConfig = {
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || '',
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  apiVersion: '2024-01-01',
  useCdn: process.env.NODE_ENV === 'production',
};

export const sanityClient = createClient(sanityConfig);

const builder = imageUrlBuilder(sanityClient);

export function urlFor(source: Parameters<typeof builder.image>[0]) {
  return builder.image(source);
}

// GROQ queries
export const BLOG_POSTS_QUERY = `*[_type == "blogPost"] | order(publishedAt desc) {
  _id, title, slug, excerpt, coverImage, category, publishedAt,
  "readTime": round(length(pt::text(body)) / 5 / 200)
}`;

export const CASE_STUDIES_QUERY = `*[_type == "caseStudy" && featured == true] | order(publishedAt desc) [0..3] {
  _id, clinicName, slug, location, clinicType, headline, excerpt, metrics, quote, logo, heroImage, servicesUsed
}`;

export const TESTIMONIALS_QUERY = `*[_type == "testimonial" && featured == true] | order(_createdAt desc) [0..5] {
  _id, name, role, clinicName, location, photo, quote, rating, colorTheme
}`;
