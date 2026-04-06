import { normalizeUrlInput } from '@/lib/validators';

export type AuditScorecard = {
  key: 'performance' | 'accessibility' | 'best_practices' | 'seo';
  label: string;
  score: number;
  summary: string;
};

export type AuditLeak = {
  id: string;
  severity: 'high' | 'medium' | 'low';
  headline: string;
  impact: string;
  action: string;
  revenueImpact: number;
  zypflowSolution: string;
};

export type AuditReport = {
  overallScore: number;
  finalUrl: string;
  scanStatus: 'complete' | 'limited';
  generatedAt: string;
  scorecards: AuditScorecard[];
  leaks: AuditLeak[];
  totalRevenueLeakEstimate: number;
  wins: string[];
  summary: {
    headline: string;
    body: string;
    topLeak: string | null;
  };
  signals: {
    statusCode: number | null;
    fetchDurationMs: number | null;
    hasSsl: boolean;
    hasViewport: boolean;
    hasTitle: boolean;
    hasMetaDescription: boolean;
    hasH1: boolean;
    hasBookingLink: boolean;
    hasContactForm: boolean;
    hasPhone: boolean;
    hasEmail: boolean;
    hasReviewProof: boolean;
    hasFaq: boolean;
    hasOpenGraph: boolean;
    ctaCount: number;
    scriptCount: number;
    imageCount: number;
    htmlWeightKb: number;
    wordCount: number;
  };
  fetchError?: string | null;
};

const REQUEST_HEADERS = {
  'user-agent':
    'Mozilla/5.0 (compatible; ZypflowAuditBot/1.0; +https://zypflow.com)',
  accept: 'text/html,application/xhtml+xml',
};

function clampScore(value: number) {
  return Math.max(15, Math.min(96, Math.round(value)));
}

function average(values: number[]) {
  if (values.length === 0) return 0;
  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
}

function textIncludes(text: string, patterns: RegExp[]) {
  return patterns.some((pattern) => pattern.test(text));
}

function countMatches(text: string, pattern: RegExp) {
  return [...text.matchAll(pattern)].length;
}

function scoreSummary(score: number, strong: string, weak: string) {
  if (score >= 80) return strong;
  if (score >= 60) return `Decent baseline, but ${weak.toLowerCase()}`;
  return weak;
}

export async function generateRevenueLeakAudit(input: {
  website: string;
  businessName: string;
}): Promise<AuditReport> {
  const requestedUrl = normalizeUrlInput(input.website);
  const generatedAt = new Date().toISOString();
  const startedAt = Date.now();

  let html = '';
  let finalUrl = requestedUrl;
  let statusCode: number | null = null;
  let fetchError: string | null = null;
  let scanStatus: 'complete' | 'limited' = 'complete';

  try {
    const response = await fetch(requestedUrl, {
      headers: REQUEST_HEADERS,
      redirect: 'follow',
      cache: 'no-store',
    });

    statusCode = response.status;
    finalUrl = response.url || requestedUrl;
    html = await response.text();
  } catch (error) {
    scanStatus = 'limited';
    fetchError = error instanceof Error ? error.message : 'Website fetch failed.';
  }

  const fetchDurationMs = Date.now() - startedAt;
  const normalizedHtml = html.toLowerCase();
  const plainText = normalizedHtml
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const hasSsl = finalUrl.startsWith('https://');
  const hasViewport = /<meta[^>]+name=["']viewport["']/i.test(html);
  const hasTitle = /<title>[^<]{8,}<\/title>/i.test(html);
  const hasMetaDescription = /<meta[^>]+name=["']description["'][^>]+content=["'][^"']{40,}/i.test(html);
  const hasH1 = /<h1[\s>]/i.test(html);
  const hasContactForm = /<form[\s>]/i.test(html);
  const hasPhone = textIncludes(html, [/\+44[\d\s().-]{7,}/i, /0\d[\d\s().-]{8,}/i, /tel:/i]);
  const hasEmail = /mailto:/i.test(html);
  const hasOpenGraph = /property=["']og:(title|description|image)["']/i.test(html);
  const hasFaq = textIncludes(plainText, [/\bfaq\b/i, /\bfrequently asked/i, /\bquestions\b/i]);
  const hasReviewProof = textIncludes(plainText, [
    /\bgoogle review/i,
    /\b5 star/i,
    /\btestimonials?\b/i,
    /\breviews?\b/i,
    /\bbefore and after\b/i,
  ]);
  const hasBookingLink = textIncludes(html, [
    /calendly/i,
    /fresha/i,
    /phorest/i,
    /vagaro/i,
    /booksy/i,
    /treatwell/i,
    /\bbook now\b/i,
    /\bbook online\b/i,
    /\bbook consultation\b/i,
    /\bbook an appointment\b/i,
    /\bstart your consultation\b/i,
  ]);

  const ctaCount = countMatches(
    plainText,
    /\b(book now|book online|book consultation|book an appointment|get started|request callback|speak to us|contact us)\b/gi
  );
  const scriptCount = countMatches(html, /<script[\s>]/gi);
  const imageCount = countMatches(html, /<img[\s>]/gi);
  const htmlWeightKb = Math.round(Buffer.byteLength(html || '', 'utf8') / 1024);
  const wordCount = plainText ? plainText.split(/\s+/).filter(Boolean).length : 0;

  const performanceScore = clampScore(
    38 +
      (hasSsl ? 12 : 0) +
      (fetchDurationMs < 1500 ? 12 : fetchDurationMs < 3000 ? 6 : 0) +
      (htmlWeightKb > 0 && htmlWeightKb < 250 ? 14 : htmlWeightKb < 450 ? 8 : 0) +
      (scriptCount <= 12 ? 10 : scriptCount <= 20 ? 4 : 0) +
      (imageCount <= 24 ? 10 : imageCount <= 40 ? 5 : 0)
  );

  const accessibilityScore = clampScore(
    34 +
      (hasViewport ? 22 : 0) +
      (hasH1 ? 12 : 0) +
      (hasTitle ? 8 : 0) +
      (hasContactForm ? 8 : 0) +
      (hasPhone || hasEmail ? 8 : 0) +
      (wordCount > 180 ? 8 : 0)
  );

  const bestPracticesScore = clampScore(
    28 +
      (hasBookingLink ? 26 : 0) +
      (ctaCount >= 2 ? 16 : ctaCount === 1 ? 8 : 0) +
      (hasContactForm ? 10 : 0) +
      (hasPhone ? 8 : 0) +
      (hasFaq ? 6 : 0) +
      (hasReviewProof ? 10 : 0)
  );

  const seoScore = clampScore(
    30 +
      (hasTitle ? 18 : 0) +
      (hasMetaDescription ? 16 : 0) +
      (hasOpenGraph ? 10 : 0) +
      (hasReviewProof ? 12 : 0) +
      (wordCount > 180 ? 8 : 0)
  );

  const leaks: AuditLeak[] = [];

  if (!hasBookingLink) {
    leaks.push({
      id: 'booking-journey',
      severity: 'high',
      headline: 'No obvious booking path',
      impact: 'Visitors have to work too hard to turn interest into a consult, which leaks warm intent.',
      action: 'Add a visible book-consult CTA in the hero and repeat it throughout the page.',
      revenueImpact: 2400,
      zypflowSolution: 'Zypflow deploys a smart booking widget with an always-visible CTA that adapts to each page. Enquiries route straight into the automated follow-up pipeline so no lead goes cold.',
    });
  }

  if (ctaCount < 2) {
    leaks.push({
      id: 'weak-cta-density',
      severity: 'high',
      headline: 'Weak call-to-action density',
      impact: 'Your page is not giving enough prompts to act, so visitors drop before they inquire.',
      action: 'Repeat one clear CTA above the fold, mid-page, and near testimonials or FAQs.',
      revenueImpact: 1800,
      zypflowSolution: 'Zypflow injects contextual booking CTAs across your site that adapt to visitor behaviour. Combined with instant AI chat, every page becomes a conversion point.',
    });
  }

  if (!hasViewport) {
    leaks.push({
      id: 'mobile-friction',
      severity: 'high',
      headline: 'Mobile visitors may hit layout friction',
      impact: 'A clinic site that does not signal mobile readiness usually bleeds conversions from paid and social traffic.',
      action: 'Add a responsive viewport tag and tighten the mobile layout around booking and contact actions.',
      revenueImpact: 1800,
      zypflowSolution: 'Zypflow\'s booking widget is mobile-first by default. Even if your site layout needs work, the widget ensures mobile visitors can always book or enquire instantly.',
    });
  }

  if (!hasReviewProof) {
    leaks.push({
      id: 'trust-gap',
      severity: 'high',
      headline: 'Trust proof is too thin',
      impact: 'Without reviews, testimonials, or before-and-after proof, high-intent visitors hesitate instead of booking.',
      action: 'Bring review proof and patient outcomes closer to the first CTA.',
      revenueImpact: 1200,
      zypflowSolution: 'Zypflow automatically requests Google reviews after every completed appointment. Within weeks, you\'ll have a steady stream of fresh 5-star proof to display.',
    });
  }

  if (!hasContactForm && !hasPhone) {
    leaks.push({
      id: 'contact-friction',
      severity: 'medium',
      headline: 'Contact options are not obvious enough',
      impact: 'When contact routes are hidden, leads bounce instead of starting a conversation.',
      action: 'Expose a form or prominent phone number on every main conversion page.',
      revenueImpact: 900,
      zypflowSolution: 'Zypflow adds an AI-powered chat widget that captures enquiries 24/7 — even when your clinic is closed. Every conversation becomes a qualified lead automatically.',
    });
  }

  if (!hasMetaDescription || !hasTitle) {
    leaks.push({
      id: 'discoverability',
      severity: 'medium',
      headline: 'Search and social snippets are under-optimized',
      impact: 'Weak metadata lowers click-through from search and makes your page look less trustworthy when shared.',
      action: 'Write a tighter title and meta description around the main treatment outcome and location.',
      revenueImpact: 600,
      zypflowSolution: 'Zypflow\'s onboarding audit identifies your highest-value search terms and we help optimise your metadata for local clinic SEO.',
    });
  }

  if (fetchDurationMs >= 3000 || htmlWeightKb >= 450 || scriptCount > 20) {
    leaks.push({
      id: 'heavy-page',
      severity: 'medium',
      headline: 'The page looks heavier than it needs to be',
      impact: 'Slow or script-heavy pages leak visitors before they ever reach the enquiry step.',
      action: 'Trim scripts, compress media, and simplify the first screen so the booking CTA appears faster.',
      revenueImpact: 1500,
      zypflowSolution: 'Zypflow\'s lightweight widget loads asynchronously and never slows your page. We also flag performance issues in your weekly report so you can track improvements.',
    });
  }

  if (!hasFaq) {
    leaks.push({
      id: 'faq-gap',
      severity: 'low',
      headline: 'Questions are not being answered early enough',
      impact: 'Visitors with hesitations about treatment, downtime, or pricing may leave instead of enquiring.',
      action: 'Add a short FAQ that handles timing, aftercare, and first-visit expectations.',
      revenueImpact: 600,
      zypflowSolution: 'Zypflow\'s AI chat answers common patient questions instantly — treatment details, pricing, aftercare — so visitors get answers without waiting for a callback.',
    });
  }

  const orderedLeaks = leaks.sort((left, right) => {
    const severityRank = { high: 3, medium: 2, low: 1 };
    return severityRank[right.severity] - severityRank[left.severity];
  });

  const totalRevenueLeakEstimate = orderedLeaks.reduce(
    (sum, leak) => sum + (leak.revenueImpact || 0),
    0
  );

  const wins = [
    hasBookingLink ? 'A booking path already exists, so we can focus on converting more of the traffic you already have.' : null,
    hasReviewProof ? 'Trust signals are already on the page, which gives us proof to amplify in follow-up automation.' : null,
    hasContactForm ? 'There is already a form on the site, which makes enquiry capture easier to automate.' : null,
    hasFaq ? 'You already answer some visitor objections on-page, which helps warmer leads self-qualify.' : null,
    hasOpenGraph ? 'Social sharing metadata is present, which helps external links look more polished.' : null,
  ].filter((value): value is string => Boolean(value));

  const scorecards: AuditScorecard[] = [
    {
      key: 'performance',
      label: 'Speed & structure',
      score: performanceScore,
      summary: scoreSummary(
        performanceScore,
        'The page foundation looks lean enough for paid traffic and organic visits.',
        'The page likely feels heavier or slower than it should for a conversion-first clinic funnel.'
      ),
    },
    {
      key: 'accessibility',
      label: 'Mobile & clarity',
      score: accessibilityScore,
      summary: scoreSummary(
        accessibilityScore,
        'The page signals a reasonably clear mobile experience with basic structure in place.',
        'Mobile and content clarity need work before more traffic is pushed into the page.'
      ),
    },
    {
      key: 'best_practices',
      label: 'Booking conversion',
      score: bestPracticesScore,
      summary: scoreSummary(
        bestPracticesScore,
        'The booking journey has a usable foundation we can automate around quickly.',
        'The booking path is not strong enough yet, which means warm leads are leaking before they convert.'
      ),
    },
    {
      key: 'seo',
      label: 'Search & trust',
      score: seoScore,
      summary: scoreSummary(
        seoScore,
        'There is enough metadata and proof to support stronger search and trust performance.',
        'Search visibility and trust proof are underpowered, so the page looks weaker than it should.'
      ),
    },
  ];

  const overallScore = average(scorecards.map((card) => card.score));
  const topLeak = orderedLeaks[0]?.headline ?? null;
  const summary =
    overallScore >= 78
      ? `Strong base, but ${topLeak ? topLeak.toLowerCase() : 'there are still conversion gaps'} is likely suppressing bookings.`
      : overallScore >= 58
        ? `Your site has demand potential, but ${topLeak ? topLeak.toLowerCase() : 'several conversion leaks'} are likely costing consults.`
        : `Your site is leaking demand in multiple places, starting with ${topLeak ? topLeak.toLowerCase() : 'the booking path and trust layer'}.`;

  return {
    overallScore,
    finalUrl,
    scanStatus,
    generatedAt,
    scorecards,
    leaks: orderedLeaks.slice(0, 5),
    totalRevenueLeakEstimate,
    wins: wins.slice(0, 4),
    summary: {
      headline:
        overallScore >= 78
          ? `${input.businessName}: strong base with clear revenue gains available`
          : overallScore >= 58
            ? `${input.businessName}: fix the conversion leaks before buying more traffic`
            : `${input.businessName}: your site needs a tighter booking and trust system`,
      body: summary,
      topLeak,
    },
    signals: {
      statusCode,
      fetchDurationMs: fetchError ? null : fetchDurationMs,
      hasSsl,
      hasViewport,
      hasTitle,
      hasMetaDescription,
      hasH1,
      hasBookingLink,
      hasContactForm,
      hasPhone,
      hasEmail,
      hasReviewProof,
      hasFaq,
      hasOpenGraph,
      ctaCount,
      scriptCount,
      imageCount,
      htmlWeightKb,
      wordCount,
    },
    fetchError,
  };
}
