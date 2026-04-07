import type { MetadataRoute } from 'next';

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://zypflow.co.uk';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/dashboard/', '/admin/', '/onboarding/', '/api/', '/widget/'],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
