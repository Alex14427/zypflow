# ZYPFLOW STATUS — Updated After Session 2

## WHAT CLAUDE BUILT (ALL DONE)

### Landing Page (Session 1)
- [x] index.html — SEO, analytics, trust badges, calculator, industry presets
- [x] Pricing cards link to `/signup?plan=starter|growth|scale`
- [x] Footer links to `/privacy` and `/terms`
- [x] Google Analytics G-EHDT9J6054 with event tracking
- [x] Tawk.to live chat widget
- [x] Cookie consent banner (PECR/GDPR)
- [x] JSON-LD structured data
- [x] sitemap.xml + robots.txt

### Next.js App (Session 2)
- [x] Full project scaffold — Next.js 14, TypeScript strict, Tailwind, App Router
- [x] All dependencies installed and building clean (18 routes)

### Lib Files (Section 4)
- [x] `src/lib/supabase.ts` — browser + admin clients
- [x] `src/lib/ratelimit.ts` — Upstash rate limiter (20 req/hr per IP)
- [x] `src/lib/validators.ts` — Zod schemas (chat, sms, checkout)
- [x] `src/lib/email.ts` — Resend utility + welcome email template
- [x] `src/lib/scoring.ts` — Lead scorer (0-100)
- [x] `src/lib/prompts.ts` — Industry-specific AI prompts (dental, aesthetics, physio, legal, home services)

### AI Chat Engine (Section 5)
- [x] `src/app/api/chat/route.ts` — GPT-4o primary + Claude fallback, lead extraction, conversation logging, Make.com webhook, CORS, rate limiting, industry-specific prompts

### SMS Routes (Section 6)
- [x] `src/app/api/sms/send/route.ts` — send via Twilio
- [x] `src/app/api/sms/incoming/route.ts` — receive + STOP opt-out handling

### Chat Widget (Section 7)
- [x] `public/v1.js` — embeddable bubble + iframe script
- [x] `src/app/widget/[businessId]/page.tsx` — chat UI with typing indicator

### Booking & Stripe (Section 8)
- [x] `src/app/api/booking/created/route.ts` — Cal.com webhook handler
- [x] `src/app/api/stripe/checkout/route.ts` — 3 plans (Starter/Growth/Scale)
- [x] `src/app/api/stripe/webhook/route.ts` — checkout.session.completed, subscription.updated, subscription.deleted + welcome email

### Auth & Analytics (Section 9)
- [x] `src/middleware.ts` — protects /dashboard and /onboarding (Supabase v2 cookie auth)
- [x] `src/app/providers.tsx` — PostHog analytics provider
- [x] `src/app/login/page.tsx` — login with Supabase Auth
- [x] `src/app/signup/page.tsx` — signup + business creation + redirect to onboarding

### Onboarding Wizard (Section 12.3)
- [x] `src/app/onboarding/page.tsx` — 7 screens:
  1. Business basics (name, website, phone, industry)
  2. Services (repeatable: name, price, duration)
  3. FAQs/Knowledge base (repeatable: question, answer)
  4. Booking link + Google review link
  5. AI personality dropdown + extra notes
  6. Widget embed code + copy button + platform instructions
  7. Success + "Go to Dashboard" + "Book setup call"

### Dashboard
- [x] `src/app/dashboard/page.tsx` — leads table (with scores + status), conversations list, appointments table, stats cards

### Scraping Pipeline
- [x] `src/app/api/scrape/route.ts` — Apify Google Maps scraper, deduplication, Supabase insert
- [x] `src/app/api/scrape/cron/route.ts` — Vercel weekly cron (rotates industry/city combos)

### Error Tracking
- [x] Sentry — `instrumentation.ts` (server/edge), `instrumentation-client.ts` (browser), `global-error.tsx` (error boundary)
- [x] `next.config.mjs` — Sentry integration with source map hiding

### Database
- [x] `supabase/migration_001_full_schema.sql` — 7 tables + indexes + RLS:
  - businesses, leads, conversations, appointments, reviews, follow_ups, prospects

### Infrastructure (Done by Claude via APIs)
- [x] Stripe products created: Starter £149/mo, Growth £299/mo, Scale £499/mo
- [x] Stripe prices: `price_1TCWZwPLa1vjAWTny0TYHp7B`, `price_1TCWa4PLa1vjAWTnEJwQXXoQ`, `price_1TCWaBPLa1vjAWTn6f7Lo8Ub`
- [x] Stripe webhook endpoint: `https://app.zypflow.com/api/stripe/webhook`
- [x] Stripe Customer Portal enabled (plan switching between all 3 tiers)
- [x] Twilio number purchased: +18146322302 (temp US — see note below)
- [x] Twilio SMS webhook set to `https://app.zypflow.com/api/sms/incoming`
- [x] All env vars populated in `.env.local` (except SUPABASE_SERVICE_ROLE_KEY)

---

## WHAT ALEX MUST DO (only 3 things)

### 1. Run the Supabase Migration (5 minutes)
The database tables DO NOT EXIST YET. This is blocking everything.

1. Go to https://supabase.com/dashboard → project `quarijsqejzilervrcub`
2. Click **SQL Editor** → **New Query**
3. Open `supabase/migration_001_full_schema.sql` in VS Code → copy ALL contents
4. Paste into SQL Editor → click **Run**
5. Go to **Table Editor** → verify you see 7 tables: businesses, leads, conversations, appointments, reviews, follow_ups, prospects
6. Go to **Settings → API** → copy the `service_role` key (starts with `eyJ...`)
7. Paste it into `.env.local` as `SUPABASE_SERVICE_ROLE_KEY=eyJ...`

### 2. Get UK Twilio Number (10 minutes)
The current number (+18146322302) is US. To send SMS to UK customers:

1. Go to https://twilio.com/console → **Phone Numbers → Regulatory → Bundles**
2. Create a new bundle → Country: UK → Type: Local
3. Upload ID + address proof → wait for approval (usually 1-2 hours)
4. Once approved: **Buy a Number → UK → Local** → buy one
5. Update `.env.local`: `TWILIO_PHONE_NUMBER=+44...`
6. In Twilio console: set the new number's SMS webhook to `https://app.zypflow.com/api/sms/incoming`

### 3. Merge the PR on GitHub
Go to github.com/Alex14427/zypflow → merge the open PR

---

## WHAT BUILDS NEXT SESSION (Make.com + Deploy)

These are the only things left:

### Make.com Automations (Section 10 — build in Make.com UI)
- [ ] 10.1 New Lead Notification — webhook → Supabase lookup → Resend email
- [ ] 10.2 Appointment Reminders — hourly → 48h/24h/2h SMS
- [ ] 10.3 Review Request — webhook → 2hr delay → SMS (only if satisfaction ≥ 4)
- [ ] 10.4 Follow-Up Sequence — hourly → Day 0/2/5 messages
- [ ] New Onboarding Complete — watch businesses → Slack #customers

### Deploy to Vercel
- [ ] Import GitHub repo → set all env vars from `.env.local`
- [ ] Add custom domain: `app.zypflow.com` → CNAME → `cname.vercel-dns.com` in Cloudflare
- [ ] Verify all 11.6 pre-launch checks pass

### Outreach Setup
- [ ] Set up Instantly.ai with 3 mailboxes on zypflow.uk + enable warmup
- [ ] Run first Apify scrape for prospect list
- [ ] Create Instantly.ai campaigns with email templates from Section 12.1

---

## STARTING NEXT SESSION

Paste this:

> Read CLAUDE.md and HANDOFF-CHECKLIST.md. The Supabase migration has been run, service_role key is in .env.local. Deploy the app to Vercel, build the Make.com automations, and set up the outreach pipeline. Don't ask questions — use Zypflow-FINAL.docx as source of truth.
