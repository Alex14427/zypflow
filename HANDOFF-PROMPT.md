# HANDOFF PROMPT — Paste This Into Your Next Claude Code Session

---

I'm building Zypflow — an AI customer growth platform for UK service businesses. Read `CLAUDE.md` for project context, `Zypflow-FINAL.docx` for the full build guide (every code file, every SQL table, every API route is specified there), and `HANDOFF-CHECKLIST.md` for what's done vs not done.

**What's already done:**
- Landing page (index.html) with SEO, analytics, lead capture form wired to Supabase, Tawk.to chat, cookie consent, sitemap, robots.txt
- Supabase has basic `leads` + `inquiries` tables with RLS

**API keys are in `.env.local` — read that file for all credentials.**

**Build EVERYTHING below. The docx has the exact code for each file. Follow it precisely.**

### Phase 1 — Foundation (Sections 4-9)

1. **Next.js project** — `npx create-next-app@latest app --typescript --tailwind --app --src-dir` in /app directory. Install ALL deps from Section 4.2:
   - `@supabase/supabase-js openai stripe twilio resend`
   - `zod date-fns @upstash/ratelimit @upstash/redis`
   - `posthog-js posthog-node @sentry/nextjs`
   - `apify-client @anthropic-ai/sdk`

2. **Full Supabase schema** (Section 4.3) — Run the ENTIRE SQL block: `businesses`, `leads`, `conversations`, `appointments`, `reviews`, `follow_ups` tables + all indexes + all RLS policies. ALSO create a `prospects` table for outreach leads (id, name, email, phone, business_name, website, industry, city, source, instantly_campaign_id, status, created_at).

3. **Lib files** (Sections 4.4-4.8):
   - `src/lib/supabase.ts` — browser + admin clients
   - `src/lib/ratelimit.ts` — Upstash rate limiter
   - `src/lib/validators.ts` — Zod schemas (chat, sms, checkout)
   - `src/lib/email.ts` — Resend utility + welcome email template
   - `src/lib/scoring.ts` — Lead scorer

4. **AI Conversation Engine** (Section 5) — `src/app/api/chat/route.ts`. GPT-4o primary with Claude as fallback. CORS headers. Rate limiting. Lead extraction via `<!--LEAD:-->` tags. Conversation save to Supabase. Make.com webhook fire on new lead.

5. **SMS Routes** (Section 6):
   - `src/app/api/sms/send/route.ts` — send via Twilio
   - `src/app/api/sms/incoming/route.ts` — receive + STOP handling

6. **Chat Widget** (Section 7):
   - `public/v1.js` — embeddable script (bubble + iframe)
   - `src/app/widget/[businessId]/page.tsx` — chat UI

7. **Booking & Stripe** (Section 8):
   - `src/app/api/booking/created/route.ts` — Cal.com webhook
   - `src/app/api/stripe/checkout/route.ts` — 3 plans
   - `src/app/api/stripe/webhook/route.ts` — checkout, subscription update, subscription delete + welcome email

8. **Auth & Analytics** (Section 9):
   - `src/middleware.ts` — protect /dashboard
   - `src/app/providers.tsx` — PostHog provider
   - Login + signup pages with Supabase Auth

### Phase 2 — Onboarding & Dashboard

9. **Onboarding Wizard** (Section 12.3) — `src/app/onboarding/page.tsx`. 7 screens exactly as specified in docx: business basics → services → FAQs → booking/reviews → AI personality → widget code → done. Each screen saves to Supabase `businesses` row.

10. **Business Dashboard** — `src/app/dashboard/page.tsx`. Show: leads (with scores), conversations, appointments, reviews. Filter by date. Basic stats cards.

### Phase 3 — AI Prompts & Outreach Pipeline

11. **Industry AI System Prompts** (Section 14) — Dental, Aesthetics, Legal, Home Services, Physio. Store as defaults, applied based on `businesses.industry`.

12. **Apify Lead Scraping Pipeline**:
    - `src/app/api/scrape/route.ts` — triggers Apify Google Maps scraper + Apollo enrichment
    - `src/app/api/scrape/cron/route.ts` — Vercel cron (weekly per industry per city)
    - Stores in `prospects` table, deduplicated by email
    - Pushes new prospects to Instantly.ai via their API

13. **Privacy + Terms pages** — `/privacy` and `/terms` (placeholder pages that Aala fills via Termly.io)

### Deploy

14. **Deploy to Vercel** — connect repo, set all env vars, custom domain `app.zypflow.com`
15. **vercel.json** — configure cron jobs for scraping

**Supabase project ID:** quarijsqejzilervrcub
**Branch:** claude/integrate-solisdigital-zypflow-n6BrI

Build everything. Don't ask questions — use the docx as source of truth for every code file. Commit and push when done.

---
