import type { Metadata } from 'next';
import Link from 'next/link';
import { SiteFooter } from '@/components/public/site-footer';
import { SiteHeader } from '@/components/public/site-header';
import { sanityClient, BLOG_POSTS_QUERY } from '@/sanity/client';

export const metadata: Metadata = {
  title: 'Blog | Zypflow',
  description:
    'Insights on clinic automation, patient acquisition, and revenue growth for UK aesthetics businesses.',
};

type BlogPost = {
  _id: string;
  title: string;
  slug: { current: string };
  excerpt: string;
  category: string;
  publishedAt: string;
  readTime: number;
};

const CATEGORY_LABELS: Record<string, string> = {
  'clinic-growth': 'Clinic Growth',
  automation: 'Automation',
  'patient-experience': 'Patient Experience',
  'industry-insights': 'Industry Insights',
};

async function getPosts(): Promise<BlogPost[]> {
  try {
    if (!sanityClient.config().projectId) return [];
    const posts = await sanityClient.fetch<BlogPost[]>(BLOG_POSTS_QUERY);
    return posts || [];
  } catch {
    return [];
  }
}

export default async function BlogPage() {
  const posts = await getPosts();

  return (
    <div className="app-shell">
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden="true">
        <div className="absolute -left-[200px] -top-[100px] h-[600px] w-[600px] rounded-full bg-brand-purple/[0.07] blur-[120px]" />
        <div className="absolute -right-[150px] top-[300px] h-[500px] w-[500px] rounded-full bg-[#a855f7]/[0.05] blur-[100px]" />
      </div>

      <div className="relative z-10">
        <div className="mx-auto max-w-7xl px-5 pt-5 sm:px-8">
          <SiteHeader eyebrow="Insights for clinic owners" />
        </div>

        <main className="mx-auto max-w-7xl px-5 py-20 sm:px-8">
          <div className="max-w-2xl">
            <p className="page-eyebrow">Blog</p>
            <h1 className="mt-4 text-4xl font-semibold tracking-tight text-[var(--app-text)] sm:text-5xl">
              Clinic growth,{' '}
              <span className="gradient-text">decoded.</span>
            </h1>
            <p className="mt-5 text-lg leading-8 text-[var(--app-text-muted)]">
              Practical insights on automation, patient acquisition, and building a
              clinic that runs without you in the room.
            </p>
          </div>

          {posts.length > 0 ? (
            <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {posts.map((post) => (
                <Link
                  key={post._id}
                  href={`/blog/${post.slug.current}`}
                  className="group rounded-[24px] border border-[var(--app-border)] bg-[var(--app-surface)] p-6 transition-all duration-300 hover:border-brand-purple/30 hover:shadow-[0_20px_50px_rgba(0,0,0,0.2)]"
                >
                  {post.category && (
                    <span className="inline-block rounded-full bg-brand-purple/10 px-3 py-1 text-xs font-semibold text-brand-purple">
                      {CATEGORY_LABELS[post.category] || post.category}
                    </span>
                  )}
                  <h2 className="mt-4 text-xl font-semibold text-[var(--app-text)] transition-colors group-hover:text-brand-purple">
                    {post.title}
                  </h2>
                  {post.excerpt && (
                    <p className="mt-3 line-clamp-3 text-sm leading-6 text-[var(--app-text-muted)]">
                      {post.excerpt}
                    </p>
                  )}
                  <div className="mt-4 flex items-center gap-3 text-xs text-[var(--app-text-soft)]">
                    {post.publishedAt && (
                      <time dateTime={post.publishedAt}>
                        {new Date(post.publishedAt).toLocaleDateString('en-GB', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </time>
                    )}
                    {post.readTime > 0 && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span>{post.readTime} min read</span>
                      </>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="mt-16 rounded-[24px] border border-[var(--app-border)] bg-[var(--app-surface)] p-12 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-brand-purple/10">
                <svg className="h-7 w-7 text-brand-purple" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 7.5h1.5m-1.5 3h1.5m-7.5 3h7.5m-7.5 3h7.5m3-9h3.375c.621 0 1.125.504 1.125 1.125V18a2.25 2.25 0 01-2.25 2.25M16.5 7.5V18a2.25 2.25 0 002.25 2.25M16.5 7.5V4.875c0-.621-.504-1.125-1.125-1.125H4.125C3.504 3.75 3 4.254 3 4.875V18a2.25 2.25 0 002.25 2.25h13.5M6 7.5h3v3H6v-3z" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-[var(--app-text)]">Coming soon</h2>
              <p className="mt-2 text-sm text-[var(--app-text-muted)]">
                We&apos;re writing our first posts on clinic automation and growth strategies.
                Check back soon.
              </p>
            </div>
          )}
        </main>

        <div className="mx-auto max-w-7xl px-5 pb-20 sm:px-8">
          <SiteFooter />
        </div>
      </div>
    </div>
  );
}
