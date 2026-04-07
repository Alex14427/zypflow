import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { SiteFooter } from '@/components/public/site-footer';
import { SiteHeader } from '@/components/public/site-header';
import { sanityClient } from '@/sanity/client';

type BlogPost = {
  _id: string;
  title: string;
  slug: { current: string };
  excerpt: string;
  body: Array<{
    _type: string;
    _key: string;
    children?: Array<{ _type: string; text: string; marks?: string[] }>;
    style?: string;
    listItem?: string;
  }>;
  category: string;
  publishedAt: string;
  readTime: number;
  seo?: { metaTitle?: string; metaDescription?: string };
};

const POST_QUERY = `*[_type == "blogPost" && slug.current == $slug][0] {
  _id, title, slug, excerpt, body, category, publishedAt,
  "readTime": round(length(pt::text(body)) / 5 / 200),
  seo
}`;

async function getPost(slug: string): Promise<BlogPost | null> {
  try {
    if (!sanityClient.config().projectId) return null;
    return await sanityClient.fetch<BlogPost | null>(POST_QUERY, { slug });
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const post = await getPost(params.slug);
  if (!post) return { title: 'Post Not Found' };

  return {
    title: post.seo?.metaTitle || post.title,
    description: post.seo?.metaDescription || post.excerpt,
    openGraph: {
      title: post.title,
      description: post.excerpt,
      type: 'article',
      publishedTime: post.publishedAt,
    },
  };
}

// Simple portable text renderer — no external dependency needed
function renderBody(body: BlogPost['body']) {
  if (!body) return null;

  return body.map((block) => {
    if (block._type !== 'block' || !block.children) return null;

    const text = block.children.map((child, i) => {
      let content: React.ReactNode = child.text;
      if (child.marks?.includes('strong')) content = <strong key={i}>{content}</strong>;
      if (child.marks?.includes('em')) content = <em key={i}>{content}</em>;
      if (child.marks?.includes('code'))
        content = (
          <code key={i} className="rounded bg-[var(--app-surface)] px-1.5 py-0.5 text-sm">
            {content}
          </code>
        );
      return content;
    });

    const style = block.style || 'normal';
    const key = block._key;

    switch (style) {
      case 'h2':
        return (
          <h2 key={key} className="mt-10 text-2xl font-semibold text-[var(--app-text)]">
            {text}
          </h2>
        );
      case 'h3':
        return (
          <h3 key={key} className="mt-8 text-xl font-semibold text-[var(--app-text)]">
            {text}
          </h3>
        );
      case 'blockquote':
        return (
          <blockquote
            key={key}
            className="mt-6 border-l-2 border-brand-purple/40 pl-6 italic text-[var(--app-text-muted)]"
          >
            {text}
          </blockquote>
        );
      default:
        if (block.listItem) {
          return (
            <li key={key} className="text-[var(--app-text-muted)]">
              {text}
            </li>
          );
        }
        return (
          <p key={key} className="mt-5 leading-7 text-[var(--app-text-muted)]">
            {text}
          </p>
        );
    }
  });
}

export default async function BlogPostPage({
  params,
}: {
  params: { slug: string };
}) {
  const post = await getPost(params.slug);
  if (!post) notFound();

  const CATEGORY_LABELS: Record<string, string> = {
    'clinic-growth': 'Clinic Growth',
    automation: 'Automation',
    'patient-experience': 'Patient Experience',
    'industry-insights': 'Industry Insights',
  };

  return (
    <div className="app-shell">
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden="true">
        <div className="absolute -left-[200px] -top-[100px] h-[600px] w-[600px] rounded-full bg-brand-purple/[0.07] blur-[120px]" />
      </div>

      <div className="relative z-10">
        <div className="mx-auto max-w-7xl px-5 pt-5 sm:px-8">
          <SiteHeader eyebrow="Blog" />
        </div>

        <article className="mx-auto max-w-3xl px-5 py-20 sm:px-8">
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 text-sm text-[var(--app-text-soft)] transition-colors hover:text-brand-purple"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Back to blog
          </Link>

          <header className="mt-8">
            {post.category && (
              <span className="inline-block rounded-full bg-brand-purple/10 px-3 py-1 text-xs font-semibold text-brand-purple">
                {CATEGORY_LABELS[post.category] || post.category}
              </span>
            )}
            <h1 className="mt-4 text-3xl font-semibold tracking-tight text-[var(--app-text)] sm:text-4xl">
              {post.title}
            </h1>
            <div className="mt-4 flex items-center gap-3 text-sm text-[var(--app-text-soft)]">
              {post.publishedAt && (
                <time dateTime={post.publishedAt}>
                  {new Date(post.publishedAt).toLocaleDateString('en-GB', {
                    day: 'numeric',
                    month: 'long',
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
          </header>

          <div className="prose-custom mt-10">{renderBody(post.body)}</div>

          <div className="mt-16 border-t border-[var(--app-border)] pt-8">
            <Link
              href="/blog"
              className="inline-flex items-center gap-2 text-sm font-semibold text-brand-purple transition-colors hover:text-brand-purple-light"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
              All posts
            </Link>
          </div>
        </article>

        <div className="mx-auto max-w-7xl px-5 pb-20 sm:px-8">
          <SiteFooter />
        </div>
      </div>
    </div>
  );
}
