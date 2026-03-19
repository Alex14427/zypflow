# ZYPFLOW STATUS — Updated After Session 3

## WHAT CLAUDE BUILT (ALL DONE)

### Landing Page (Session 1)
- [x] index.html — SEO, analytics, trust badges, calculator, industry presets
- [x] Pricing cards link to `/signup?plan=starter|growth|scale`
- [x] Footer links to `/privacy` and `/terms`
- [x] Google Analytics G-EHDT9J6054 with event tracking
- [x] Tawk.to live chat widget
- [x] Cookie consent banner (PECR/GDPR)
- [x] JSON-LD structured data
- [x] sitemap.xml + robots.txt (moved to public/)

### Next.js App (Session 2-3)
- [x] Full project scaffold — Next.js 14, TypeScript strict, Tailwind, App Router
- [x] All dependencies installed and building clean (21 routes)
- [x] Vercel deployment fixes — env var fallbacks, framework detection, static files

### Lib Files (Section 4)
- [x] `src/lib/supabase.ts` — browser + admin clients (build-safe fallbacks)
- [x] `src/lib/ratelimit.ts` — Upstash rate limiter (20 req/hr per IP)
- [x] `src/lib/validators.ts` — Zod schemas (chat, sms, checkout)
- [x] `src/lib/email.ts` — Resend utility + welcome email template
- [x] `src/lib/scoring.ts` — Lead scorer (0-100)
- [x] `src/lib/prompts.ts` — Industry-specific AI prompts (dental, aesthetics, physio, legal, home services)

### AI Chat Engine (Section 5)
- [x] `src/app/api/chat/route.ts` — GPT-4o primary + Claude fallback, lead extraction, conversation logging, Make.com webhook, CORS, rate limiting, industry-specific prompts

### SMS Routes (Section 6)
- [x] `src/app/api/sms/send/route.ts` — send via Twilio (with Zod validation + error handling)
- [x] `src/app/api/sms/incoming/route.ts` — receive + STOP opt-out handling (with maybeSingle)

### Chat Widget (Section 7)
- [x] `public/v1.js` — embeddable bubble + iframe script
- [x] `src/app/widget/[businessId]/page.tsx` — chat UI with typing indicator

### Booking & Stripe (Section 8)
- [x] `src/app/api/booking/created/route.ts` — Cal.com webhook handler (with maybeSingle)
- [x] `src/app/api/stripe/checkout/route.ts` — 3 plans (Starter/Growth/Scale)
- [x] `src/app/api/stripe/webhook/route.ts` — checkout.session.completed, subscription.updated, subscription.deleted + welcome email

### Auth & Analytics (Section 9)
- [x] `src/middleware.ts` — protects /dashboard and /onboarding (Supabase v2 cookie auth)
- [x] `src/app/providers.tsx` — PostHog analytics provider
- [x] `src/app/login/page.tsx` — login with Supabase Auth
- [x] `src/app/signup/page.tsx` — signup + business creation + redirect to onboarding

### Onboarding Wizard (Section 12.3)
- [x] `src/app/onboarding/page.tsx` — 7 screens with proper error handling

### Dashboard
- [x] `src/app/dashboard/page.tsx` — leads table, conversations, appointments, stats cards (with error handling)

### Automation Routes (Section 10) — NEW in Session 3
- [x] `src/app/api/automations/reminders/route.ts` — 48h/24h/2h appointment reminders via SMS + email, hourly Vercel cron
- [x] `src/app/api/automations/review-request/route.ts` — Google review request after appointment
- [x] `src/app/api/automations/follow-up/route.ts` — 3-step lead nurture sequence (Day 1/3/7)

### Scraping Pipeline
- [x] `src/app/api/scrape/route.ts` — Apify Google Maps scraper, deduplication, Supabase insert
- [x] `src/app/api/scrape/cron/route.ts` — Vercel weekly cron (rotates industry/city combos)

### Error Tracking
- [x] Sentry — `instrumentation.ts` (server/edge), `instrumentation-client.ts` (browser), `global-error.tsx` (error boundary)
- [x] `next.config.mjs` — Sentry integration with source map hiding

### Database — MIGRATED in Session 3
- [x] `supabase/migration_001_full_schema.sql` — 7 tables + indexes + RLS
- [x] **Migration applied** to Supabase project `pzsgdqbpaogxcrsjjysf` via MCP
- [x] Tables created: businesses, leads, conversations, appointments, reviews, follow_ups, prospects
- [x] RLS policies active on all tables

### Infrastructure (Done by Claude via APIs)
- [x] Stripe products created: Starter £149/mo, Growth £299/mo, Scale £499/mo
- [x] Stripe prices: `price_1TCWZwPLa1vjAWTny0TYHp7B`, `price_1TCWa4PLa1vjAWTnEJwQXXoQ`, `price_1TCWaBPLa1vjAWTn6f7Lo8Ub`
- [x] Stripe webhook endpoint: `https://app.zypflow.com/api/stripe/webhook`
- [x] Stripe Customer Portal enabled (plan switching between all 3 tiers)
- [x] Twilio number purchased: +18146322302 (temp US — see note below)
- [x] Twilio SMS webhook set to `https://app.zypflow.com/api/sms/incoming`
- [x] All env vars populated in `.env.local` (except SUPABASE_SERVICE_ROLE_KEY)
- [x] Build passes clean — 21 routes, 0 errors

### Bug Fixes (Session 3)
- [x] All `process.env.X!` assertions → `|| ''` for build safety
- [x] `.single()` → `.maybeSingle()` in SMS incoming, booking, dashboard, onboarding
- [x] Added Zod validation + try/catch to SMS send route
- [x] Added try/catch error handling to dashboard and onboarding data fetching
- [x] Moved index.html → landing/index.html (prevents Vercel framework confusion)
- [x] Moved sitemap.xml + robots.txt → public/
- [x] Fixed Supabase project ref: `pzsgdqbpaogxcrsjjysf`
- [x] Added explicit framework/buildCommand to vercel.json

---

## WHAT ALEX MUST DO

### 1. Add Supabase Service Role Key
The migration is done but the app needs the service_role key for server-side operations.

1. Go to https://supabase.com/dashboard → project `pzsgdqbpaogxcrsjjysf`
2. Go to **Settings → API** → copy the `service_role` key (starts with `eyJ...`)
3. Paste it into `.env.local` as `SUPABASE_SERVICE_ROLE_KEY=eyJ...`
4. Also add this key as a Vercel environment variable

### 2. Connect Zypflow Repo to Vercel
The Vercel account (`alex8827`) has projects for `alphaai-pro-frontend` and `alphaai-front` but NOT for Zypflow. You need to:

1. Go to https://vercel.com/new
2. Import the GitHub repo `Alex14427/zypflow`
3. Framework: Next.js (auto-detected)
4. Add ALL environment variables from `.env.local`
5. Deploy
6. Add custom domain: `app.zypflow.com` → CNAME → `cname.vercel-dns.com` in Cloudflare

### 3. Set Up Make.com Webhooks
The API routes are built. Now create Make.com scenarios that call them:

1. **New Lead Notification** — Create scenario: Watch webhook → HTTP POST to your Slack/email
   - The app already fires the `MAKE_NEW_LEAD_WEBHOOK` when a lead is captured
   - Just create a webhook in Make.com and paste the URL into `.env.local` as `MAKE_NEW_LEAD_WEBHOOK`

2. **Appointment Reminders** — Already running as Vercel hourly cron at `/api/automations/reminders`
   - Alternatively, create a Make.com scenario with a schedule trigger that calls `POST /api/automations/reminders`

3. **Review Request** — Create scenario: Watch webhook → HTTP POST `/api/automations/review-request` with `{ "appointmentId": "..." }`
   - Trigger after appointment is marked completed

4. **Follow-up Sequence** — Create scenario: Schedule (daily) → HTTP POST `/api/automations/follow-up`
   - Can optionally pass `{ "businessId": "..." }` to target a specific business

5. Paste webhook URLs into `.env.local`:
   - `MAKE_NEW_LEAD_WEBHOOK=https://hook.eu1.make.com/...`
   - `MAKE_APPOINTMENT_COMPLETED_WEBHOOK=https://hook.eu1.make.com/...`

### 4. Get UK Twilio Number (10 minutes)
The current number (+18146322302) is US. To send SMS to UK customers:

1. Go to https://twilio.com/console → **Phone Numbers → Regulatory → Bundles**
2. Create a new bundle → Country: UK → Type: Local
3. Upload ID + address proof → wait for approval (usually 1-2 hours)
4. Once approved: **Buy a Number → UK → Local** → buy one
5. Update `.env.local`: `TWILIO_PHONE_NUMBER=+44...`
6. In Twilio console: set the new number's SMS webhook to `https://app.zypflow.com/api/sms/incoming`

### 5. Outreach Setup
- Set up Instantly.ai with 3 mailboxes on zypflow.uk + enable warmup
- Run first Apify scrape: `POST /api/scrape` with body `{ "industry": "dental", "city": "London", "maxItems": 50 }`
- Create Instantly.ai campaigns with email templates from Section 12.1 of Zypflow-FINAL.docx

---

## SUMMARY
- **Code**: 100% complete — 21 routes, all building clean
- **Database**: Migrated and live on Supabase
- **Stripe**: Fully configured (products, prices, webhook, portal)
- **Twilio**: Working with US number (UK number needs regulatory approval)
- **Remaining**: Vercel deployment, Make.com webhooks, Supabase service_role key, outreach
