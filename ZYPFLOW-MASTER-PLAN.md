# ZYPFLOW — UNIFIED MASTER PLAN

> **Single source of truth.** This document replaces all previous strategy files (ZYPFLO.md, AGENCY-BLUEPRINT.md, HANDOFF-CHECKLIST.md, HANDOFF-PROMPT.md, docs/LAUNCH-PLAYBOOK.md). If it's not in this file, it doesn't exist.

> **Last updated:** 28 March 2026

---

## LEADERSHIP ENTITY — OPERATING POSTURE

This plan is executed by the Zypflow Unified Leadership Entity — a blend of three personas:

| Persona | Focus | Decision Filter |
|---------|-------|-----------------|
| **CEO (Value Architect)** | ROI, market positioning, outcome-based pricing | "Does this generate or protect revenue?" |
| **Solutions Architect (The Bridge)** | API orchestration, data lineage, agentic workflows | "Is this scalable, explainable, and governable?" |
| **SysAdmin (Resilience Guardian)** | Zero-Trust, Cyber Essentials Plus, disaster recovery | "Does this survive failure and pass audit?" |

**Conflict rule:** If a strategic goal threatens data sovereignty or resilience, the Resilient-First alternative wins.

**Compliance baseline:** UK Data (Use and Access) Act 2025, EU AI Act (cross-border), ICO statutory codes for AI, Companies House 2025 standards.

---

## 1. WHAT ZYPFLOW IS

**Domain:** zypflow.co.uk
**Category:** AI-powered customer growth platform for UK service businesses and agencies.

**One-liner:** Zypflow finds leads, audits their websites, runs personalised outreach, manages WhatsApp/SMS/email conversations, and automates client pipelines — so UK businesses can focus on delivery.

### Dual Revenue Model

| Track | What | Revenue |
|-------|------|---------|
| **Service-First** (now) | Productised automation packages sold to UK SMEs | £2,500–£15,000 setup + £495–£1,495/mo retainers |
| **SaaS Platform** (parallel) | Self-serve subscriptions for agencies who want DIY | £49–£349/mo + usage overages |

**Why service-first:** 36% of startups die from "No Market Need." Service revenue validates demand, funds development, and generates case studies. SaaS scales once 20+ paying service clients prove product-market fit.

### Target Customers

| Tier | Who | Why |
|------|-----|-----|
| **Primary** | Small UK agencies (1–10 people) — web design, marketing, SEO | Great at delivery, inconsistent at finding clients |
| **Secondary** | UK service businesses — dental, trades, legal, aesthetics, physio | Want automation without agency fees |
| **Tertiary** | In-house marketing teams at UK SMBs | Paying £500+/mo for disconnected tools |

### Competitive Position

| | Zypflow | GoHighLevel | HubSpot | Make.com |
|--|---------|-------------|---------|---------|
| Price | From £49/mo | From $97/mo | From £800/mo | From £9/mo |
| WhatsApp native | Yes | No | Add-on | No |
| Website auditing | Built-in | No | No | No |
| AI lead scoring | Built-in | No | Add-on | No |
| Cold email | Built-in | Yes | Add-on | No |
| GDPR-first | Yes (UK-built) | No (US) | Partial | No |
| Made for UK SMEs | Yes | No | No | No |

**Wedge:** The free website audit tool. GoHighLevel doesn't audit websites. That's the moat.

---

## 2. TECH STACK

| Layer | Technology | Status |
|-------|-----------|--------|
| Landing page | Static HTML (index.html) | LIVE |
| App | Next.js 14+ (TypeScript strict, Tailwind, App Router) | LIVE — 29 routes |
| Database | Supabase (Postgres + Auth + Realtime) | LIVE — Project ID: `quarijsqejzilervrcub`, Region: eu-north-1 |
| Payments | Stripe (3 tiers + portal + webhooks) | LIVE |
| SMS | Twilio (send + inbound + STOP opt-out) | LIVE |
| Email | Resend (6 branded templates, HMAC unsubscribe) | LIVE |
| WhatsApp | Meta WhatsApp Cloud API | PARTIAL — send + webhook exist |
| AI Chat | GPT-4o primary + Claude fallback | LIVE |
| AI Content | Claude API (claude-sonnet-4-6) | INTEGRATED |
| Booking | Cal.com (webhook → lead + appointment) | LIVE |
| Automations | Make.com | LIVE |
| Scraping | Apify (Google Maps) | LIVE — weekly cron |
| Cold email | Instantly.ai | INTEGRATED |
| Rate limiting | Upstash Redis + in-memory fallback | LIVE |
| Analytics | PostHog + Google Analytics | LIVE |
| Error tracking | Sentry (client + server + edge) | LIVE |
| Hosting | Vercel | LIVE |
| DNS | Cloudflare | CONFIGURED |

### Environment Variables (Vercel)

All keys stored in Vercel env vars. **Never hardcode. Never commit .env files.**

Required: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_STARTER_PRICE_ID`, `STRIPE_GROWTH_PRICE_ID`, `STRIPE_ENTERPRISE_PRICE_ID`, `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER`, `RESEND_API_KEY`, `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `AUTOMATION_SECRET`, `CRON_SECRET`, `CAL_WEBHOOK_SECRET`, `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`, `MAKE_WEBHOOK_URL`, `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_POSTHOG_KEY`, `SENTRY_DSN`, `APIFY_API_TOKEN`, `INSTANTLY_API_KEY`

---

## 3. WHAT'S ALREADY BUILT (DO NOT REBUILD)

### Landing Page
- Full marketing page (hero, features, pricing, calculator, FAQ, testimonials)
- SEO, Google Analytics, Tawk.to live chat, cookie consent
- JSON-LD structured data, sitemap.xml, robots.txt

### Next.js App (29 routes)
- Full project scaffold — Next.js 14, TypeScript strict, Tailwind, App Router
- Vercel deployment with all env vars configured

### Dashboard (8 modules)
- **Overview** — stat cards, recent leads, upcoming appointments
- **Leads** — filterable table, status management, scoring
- **Bookings** — upcoming/past tabs, status updates
- **Conversations** — split-pane message viewer, chat/SMS channels
- **Reviews** — tracking with stats
- **Analytics** — 30-day chart, source/status breakdown
- **Settings** — business info, billing, widget embed, integrations
- **Admin** — auth-gated /admin layout

### Authentication & Onboarding
- Login, signup, middleware-protected routes
- Supabase Auth (email/password)
- Business creation on signup
- 7-step onboarding wizard (AI website extraction, personality picker, widget install)

### Payments (Stripe)
- 3 products/prices configured
- Checkout with 14-day free trial
- Webhook handler (checkout.completed, subscription.updated, subscription.deleted)
- Customer portal (/api/stripe/portal)
- Welcome email on activation

### Messaging
- **SMS:** Send (/api/sms/send) + inbound webhook + STOP opt-out (Twilio)
- **Email:** 6 branded templates via Resend (welcome, booking confirmation, lead notification, reminders, review requests, follow-up)
- **WhatsApp:** Send + webhook + GDPR opt-out (partial — missing template sending + OAuth connect)
- **Chat Widget:** Embeddable /v1.js with typing indicator

### AI Engine
- GPT-4o + Claude fallback
- Industry-specific prompts (5 industries)
- Lead extraction from conversations
- Lead scoring (0–100, multi-factor)
- Rate limiting (20 req/hr per IP)
- CORS for cross-origin widget embedding

### Automations
- Appointment reminders (48h/24h/2h) via SMS + email
- Review request after appointment completion
- 3-step lead follow-up nurture (Day 1/3/7)
- Make.com scenarios active for all three
- Cal.com webhook → auto-creates lead + appointment + sends confirmation

### Scraping Pipeline
- Apify Google Maps scraper
- Deduplication + Supabase storage
- Weekly cron rotating industry/city combos

### Database (Supabase)
- 7 tables: businesses, leads, conversations, appointments, reviews, follow_ups, prospects
- RLS policies active on all tables
- Indexes on all key columns
- GDPR tables: gdpr_consents, gdpr_audit_log (immutable)

### Monitoring
- Sentry: server, client, edge + session replay + global error boundary
- PostHog: client-side provider with pageview tracking

---

## 4. DATABASE ARCHITECTURE DECISION

### Current State: `businesses` table (single-tenant, one business per user)
### Target State: `organisations` + `org_members` (multi-tenant, teams, roles, RLS)

**Decision [ARCHITECT MODE]: Option A — Migrate to organisations schema.**

The multi-tenant schema is non-negotiable for the Agency tier, white-label, team members, and usage credit metering. Every table must have `org_id` + RLS. Doing it later means rewriting every query. Do it once, do it right.

### Target Schema (key tables — extend as needed)

```sql
-- CORE
organisations (id, name, slug, owner_id, plan, stripe_customer_id, stripe_subscription_id, settings, scraping_credits, email_credits, ai_credits, created_at)
org_members (id, org_id, user_id, role [owner/admin/member/viewer], invited_email, accepted_at, created_at)

-- PIPELINE
leads (id, org_id, business_name, website, email, phone, industry, location, google_rating, review_count, status, lead_score, speed_score, seo_score, mobile_score, ssl_secure, audit_summary, source, tags, created_at)
outreach (id, org_id, lead_id, contact_email, subject, sequence_step, status, opens, clicked, replied_at, sent_at, created_at)
nurture_sequences (id, org_id, lead_id, email, sequence_step, total_steps, status, next_send_at, created_at)
audits (id, org_id, lead_id, url, speed_score, seo_score, mobile_score, ssl_secure, ai_summary, full_report, created_at)

-- CLIENT MANAGEMENT
clients (id, org_id, lead_id, business_name, contact_name, email, package, one_off_revenue, monthly_retainer, status, created_at)
projects (id, org_id, client_id, business_name, status, milestones, domain, portal_token, created_at)

-- EXISTING (keep + add org_id where missing)
conversations, appointments, reviews, follow_ups, prospects
gdpr_consents, gdpr_audit_log

-- OPERATIONS
scraper_configs (id, org_id, industries, cities, max_results, auto_enabled, schedule_cron, created_at)
activity_log (id, org_id, user_id, action, description, target_type, target_id, metadata, created_at)
health_checks (id, org_id, check_type, target_url, status, response_time_ms, created_at)
workflow_templates (id, industry, name, description, template_json, created_at)
```

**RLS pattern (apply to every table with org_id):**
```sql
ALTER TABLE [table] ENABLE ROW LEVEL SECURITY;
CREATE POLICY "org_isolation" ON [table] FOR ALL
  USING (org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid()))
  WITH CHECK (org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid()));
```

---

*Continue with `continue` for Part 2: Phased Execution Roadmap (the actual build phases with week-by-week breakdown).*
