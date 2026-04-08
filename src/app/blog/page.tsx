import type { Metadata } from 'next';
import Link from 'next/link';
import { SiteFooter } from '@/components/public/site-footer';
import { SiteHeader } from '@/components/public/site-header';
import { sanityClient, BLOG_POSTS_QUERY } from '@/sanity/client';

export const metadata: Metadata = {
  title: 'Blog | Zypflow',
  description:
    'Insights on clinic automation, patient acquisition, and revenue growth for service businesses.',
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

const FALLBACK_ARTICLES: BlogPost[] = [
  {
    _id: 'fallback-1',
    title: 'Why 73% of Clinic Enquiries Go Unanswered (And How to Fix It)',
    slug: { current: 'why-clinic-enquiries-go-unanswered' },
    excerpt:
      'The average aesthetics clinic takes over 4 hours to reply to a new enquiry. By then, the patient has already booked elsewhere. Here is the data on why speed matters and what the top 10% of clinics do differently.',
    category: 'clinic-growth',
    publishedAt: '2026-04-01',
    readTime: 6,
  },
  {
    _id: 'fallback-2',
    title: 'The Real Cost of No-Shows: How Smart Reminders Save Clinics Thousands',
    slug: { current: 'cost-of-no-shows-smart-reminders' },
    excerpt:
      'A single no-show costs the average clinic between £150-£500 in lost revenue. Multiply that across a month and you are looking at thousands in preventable losses. Here is how automated reminder sequences cut no-shows by up to 65%.',
    category: 'automation',
    publishedAt: '2026-03-25',
    readTime: 5,
  },
  {
    _id: 'fallback-3',
    title: 'From One Clinic to Many: When Should You Automate Your Patient Journey?',
    slug: { current: 'when-to-automate-patient-journey' },
    excerpt:
      'There is a tipping point where manual follow-ups, spreadsheet tracking, and WhatsApp messages stop working. Here are the five signals that your clinic has outgrown manual processes and is ready for automation.',
    category: 'industry-insights',
    publishedAt: '2026-03-18',
    readTime: 7,
  },
  {
    _id: 'fallback-4',
    title: '5 Revenue Leaks Every Aesthetics Clinic Should Audit This Month',
    slug: { current: 'five-revenue-leaks-to-audit' },
    excerpt:
      'Most clinic owners know they are losing money somewhere but cannot pinpoint where. We break down the five most common revenue leaks we find during our free audits — and the exact workflows that plug them.',
    category: 'clinic-growth',
    publishedAt: '2026-03-10',
    readTime: 8,
  },
  {
    _id: 'fallback-5',
    title: 'Google Reviews for Clinics: The Automated Approach That Actually Works',
    slug: { current: 'automated-google-reviews-clinics' },
    excerpt:
      'Asking for reviews manually is awkward and inconsistent. Here is how leading clinics use post-appointment automation to collect 3x more Google reviews without any staff involvement.',
    category: 'patient-experience',
    publishedAt: '2026-03-03',
    readTime: 5,
  },
  {
    _id: 'fallback-6',
    title: 'Booking Software vs Revenue OS: Why You Need Both',
    slug: { current: 'booking-software-vs-revenue-os' },
    excerpt:
      'Fresha, Phorest, and Cliniko are great at managing your diary. But none of them solve the gaps before the booking or after the appointment. Here is where a revenue overlay fits into your existing stack.',
    category: 'industry-insights',
    publishedAt: '2026-02-24',
    readTime: 6,
  },
];

async function getPosts(): Promise<BlogPost[]> {
  try {
    if (!sanityClient.config().projectId) return [];
    const posts = await sanityClient.fetch<BlogPost[]>(BLOG_POSTS_QUERY);
    return posts && posts.length > 0 ? posts : [];
  } catch {
    return [];
  }
}

export default async function BlogPage() {
  const cmsPosts = await getPosts();
  const posts = cmsPosts.length > 0 ? cmsPosts : FALLBACK_ARTICLES;

  return (
    <div className="app-shell">
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden="true">
        <div className="absolute -left-[200px] -top-[100px] h-[600px] w-[600px] rounded-full bg-brand-purple/[0.07] blur-[120px]" />
        <div className="absolute -right-[150px] top-[300px] h-[500px] w-[500px] rounded-full bg-[#a855f7]/[0.05] blur-[100px]" />
      </div>

      <div className="relative z-10">
        <div className="mx-auto max-w-7xl px-5 pt-5 sm:px-8">
          <SiteHeader eyebrow="Insights for business owners" />
        </div>

        <main className="mx-auto max-w-7xl px-5 py-20 sm:px-8">
          <div className="max-w-2xl">
            <p className="page-eyebrow">Blog</p>
            <h1 className="mt-4 text-4xl font-semibold tracking-tight text-[var(--app-text)] sm:text-5xl">
              Growth insights,{' '}
              <span className="gradient-text">decoded.</span>
            </h1>
            <p className="mt-5 text-lg leading-8 text-[var(--app-text-muted)]">
              Practical insights on automation, patient acquisition, and building a
              business that runs without you in the room.
            </p>
          </div>

          <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {posts.map((post) => (
              <Link
                key={post._id}
                href={`/blog/${post.slug.current}`}
                className="group flex flex-col rounded-[24px] border border-[var(--app-border)] bg-[var(--app-surface)] p-6 transition-all duration-300 hover:border-brand-purple/30 hover:-translate-y-1 hover:shadow-[0_20px_50px_rgba(0,0,0,0.2)]"
              >
                {post.category && (
                  <span className="inline-block w-fit rounded-full bg-brand-purple/10 px-3 py-1 text-xs font-semibold text-brand-purple">
                    {CATEGORY_LABELS[post.category] || post.category}
                  </span>
                )}
                <h2 className="mt-4 text-xl font-semibold text-[var(--app-text)] transition-colors group-hover:text-brand-purple">
                  {post.title}
                </h2>
                {post.excerpt && (
                  <p className="mt-3 flex-1 line-clamp-3 text-sm leading-6 text-[var(--app-text-muted)]">
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
                      <span aria-hidden="true">&middot;</span>
                      <span>{post.readTime} min read</span>
                    </>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </main>

        <div className="mx-auto max-w-7xl px-5 pb-20 sm:px-8">
          <SiteFooter />
        </div>
      </div>
    </div>
  );
}
