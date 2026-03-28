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

## 5. PHASED EXECUTION ROADMAP

### Strategic Principle

**Revenue before features. Validate before you build. Service clients fund the SaaS.**

The phases below merge both strategies — the SaaS-first build (WhatsApp, templates, GDPR, trials) and the service-first wedge (audit tool, scraper, outreach pipeline). They are not in conflict. The audit tool is the demand generator. The SaaS platform is the delivery engine. The service packages are the cash flow bridge.

---

### PHASE 0 — FOUNDATION MIGRATION (Week 0 — 3 days)

**Goal:** Migrate from `businesses` to `organisations` schema without breaking live features.

| # | Task | Details | Risk |
|---|------|---------|------|
| 0.1 | Create `organisations` + `org_members` tables | New migration. Keep `businesses` table alive during transition | Low — additive |
| 0.2 | Data migration script | Copy each `businesses` row → `organisations` row. Create `org_members` entry (role: owner) for each existing user | Medium — must preserve auth |
| 0.3 | Update all queries + lib files | Replace `business_id` references with `org_id`. Update Supabase client helpers | High — touches every page |
| 0.4 | Update RLS policies | Apply `org_isolation` pattern to all tables | Medium |
| 0.5 | Update onboarding wizard | Creates `organisation` + `org_member` instead of `business` | Low |
| 0.6 | Smoke test all 29 routes | Every page loads, auth works, data displays | Required before proceeding |

**Exit criteria:** All existing features work identically on the new schema. Zero data loss.

---

### PHASE 1 (P0) — REVENUE UNBLOCKERS (Weeks 1–2)

**Goal:** Remove every blocker between "user signs up" and "user pays." This is the highest-ROI work.

| # | Feature | Current State | Work Needed | Free APIs |
|---|---------|--------------|-------------|-----------|
| 1.1 | **Industry Template Library** (5 packs, 14 templates) | DB table `workflow_templates` exists. `/api/templates` GET works. `/dashboard/templates` page exists. Missing: actual template JSON, one-click deploy, execution engine | Seed 14 template definitions. Build deploy + execution logic | None |
| 1.2 | **14-Day Free Trial (no card)** | Stripe `trial_end` handling exists in webhook. Missing: Day 10/13 reminder emails, trial progress bar in sidebar, read-only enforcement on expiry | Build reminder cron, sidebar component, enforce read-only | None — Stripe trials free |
| 1.3 | **WhatsApp Template Sending** | Send + webhook exist. Missing: `/api/whatsapp/send-template`, 24hr service window enforcement | Build template send route + window tracker | Meta WhatsApp Cloud API — 1,000 service convos/mo free |
| 1.4 | **WhatsApp Connect (OAuth)** | Not built | Build `/api/whatsapp/connect` — Meta Embedded Signup OAuth flow | Meta API — free |
| 1.5 | **Missed Call → WhatsApp Hero** | Webhook handler exists at `/api/whatsapp/missed-call` | Wire into template system + auto-lead creation + owner notification | None — uses existing Twilio + WhatsApp |

**[CEO MODE] Why this order:** Templates + trial flow unblock self-serve revenue immediately. A user who signs up today hits an empty template library and no trial urgency. Fix that, and every signup has a path to payment.

**Exit criteria:** A new user can sign up → start 14-day trial → deploy a template → receive Day 10 + Day 13 reminder emails → convert to paid or hit read-only.

---

### PHASE 2 (P0.5) — THE AUDIT WEAPON (Weeks 2–3)

**Goal:** Get the free website audit tool live as the top-of-funnel demand generator.

| # | Feature | Work Needed | Free APIs |
|---|---------|-------------|-----------|
| 2.1 | **Public Audit Page (`/audit`)** | URL input → PageSpeed API → speed/SEO/mobile/SSL scores + basic AI summary. No auth required | Google PageSpeed Insights API — free ($200/mo credit) |
| 2.2 | **Email Gate** | Full AI-written summary requires email capture. Partial scores shown free | None |
| 2.3 | **Branded PDF Report** | Generate downloadable audit PDF. Auto-email to captured address | None |
| 2.4 | **Audit → Lead Pipeline** | Every audit submission creates a lead in Supabase. Slack/email notification to sales | None |
| 2.5 | **Audit Results Storage** | `audits` table with org_id, lead_id, scores, AI summary, full report JSON | None |

**[CEO MODE] Why now:** The audit tool is the wedge. GoHighLevel doesn't have it. It captures emails while you sleep. Every email is a warm lead who already knows their website has problems.

**Exit criteria:** Anyone can visit zypflow.co.uk/audit → enter a URL → see scores → enter email for full report → report emailed as PDF → lead created in Supabase.

---

### PHASE 3 (P1) — GDPR + RETENTION (Weeks 3–4)

**Goal:** Complete GDPR compliance layer and build anti-churn features.

| # | Feature | Work Needed | Free APIs |
|---|---------|-------------|-----------|
| 3.1 | **GDPR Consent Gate** | Consent gate node in workflow engine — blocks actions until consent confirmed | None |
| 3.2 | **Data Subject Deletion Handler** | SAR/deletion endpoint — purges all PII for a given email across all tables + logs to `gdpr_audit_log` | None |
| 3.3 | **DPA Auto-Generation** | Template-driven Data Processing Agreement PDF, auto-filled with org details | None |
| 3.4 | **ROI / Time-Saved Dashboard** | 4 metric cards + sparkline chart on dashboard home. Track `minutes_saved_per_run`, `avg_job_value` per workspace | None |
| 3.5 | **Plain-English Execution Log** | Claude API summarises each workflow run → `plain_summary` column → activity feed UI | Claude API — pay per token |

**[SUDO MODE] Why GDPR here:** UK Data (Use and Access) Act 2025 compliance is non-optional. Every WhatsApp message, every email, every scraped lead must have a consent trail. Building this after launch means retrofitting every feature. Building it now means it's baked in.

**Exit criteria:** Consent gates block unconsented outreach. Any data subject can request deletion and it completes within 72 hours. DPA generates automatically. Dashboard shows ROI metrics.

---

### PHASE 4 (P1.5) — OUTREACH PIPELINE (Weeks 4–5)

**Goal:** Build the full automated lead-to-client pipeline that service packages are delivered through.

| # | Feature | Work Needed | Free APIs |
|---|---------|-------------|-----------|
| 4.1 | **Lead Scraper UI** | `/scraper` page — configure industries, cities, max results per org. Trigger Apify runs. Credit tracking | Apify — free tier (49 runs/mo) |
| 4.2 | **Scrape → Audit → Score Pipeline** | Automated: new scraped lead → PageSpeed audit → lead scoring → status update | Google PageSpeed — free |
| 4.3 | **Cold Email Sequences** | Connect email via Instantly.ai. 5-step sequence with audit-data merge tags. Auto-pause on reply | Instantly.ai — already integrated |
| 4.4 | **Email Event Webhooks** | Handle opens/replies/bounces from Instantly → update outreach + leads tables | None |
| 4.5 | **Call Priority Dashboard** | Leads ranked by score + reply status. Click-to-call. Status tracking | None |
| 4.6 | **Nurture Sequence Engine** | Multi-step email sequences triggered after audit, after reply, after X days | None |

**[ARCHITECT MODE] Pipeline flow:**
```
SCRAPE (Apify, scheduled) → SCORE (algorithm, 0-130 pts) → AUDIT (PageSpeed + Claude)
→ PUSH TO EMAIL (Instantly, with merge tags) → TRACK EVENTS (open/reply/bounce)
→ CALL LIST (ranked by score) → CLOSE → CLIENT RECORD → ONBOARD
```

**Exit criteria:** A configured org can scrape leads, auto-audit them, auto-send personalised email sequences, and surface hot leads in a call priority list — all without human intervention.

---

### PHASE 5 (P2) — ACTIVATION + MONETISATION (Weeks 5–6)

**Goal:** Maximise trial-to-paid conversion and expand existing accounts.

| # | Feature | Work Needed |
|---|---------|-------------|
| 5.1 | **Onboarding Wizard Upgrade** | Add WhatsApp connect step + first template deploy + live test to existing 7-step wizard (→ 9 steps) |
| 5.2 | **In-App Upgrade Prompts** | Context-aware modals at every feature gate. One-click Stripe upgrade |
| 5.3 | **Agency White-Label + Sub-Accounts** | `workspace_type` and `agency_id` columns exist in migration_003. Build `/agency` dashboard, snapshot system, custom branding |
| 5.4 | **Zapier Migration Tool** | `/migrate` page. Fetch Zaps via Zapier API, map to Zypflow equivalents, cost comparison |
| 5.5 | **Usage Credit Metering** | Server-side enforcement of scraping/email/AI credits per org per plan. Overage billing via Stripe |

**Exit criteria:** Onboarding guides users to first value within 5 minutes. Feature gates drive upgrades. Agency plan is functional with white-label.

---

### PHASE 6 (P2.5) — SCALE + MOAT (Weeks 7–10)

**Goal:** Build defensible advantages and expand market.

| # | Feature | Free APIs |
|---|---------|-----------|
| 6.1 | **Making Tax Digital Pack** | HMRC MTD API (free), Xero API (free partner), FreeAgent API (free) |
| 6.2 | **AI Plain-English Workflow Builder** | Claude API (already integrated) |
| 6.3 | **Affiliate & Referral Programme** | Stripe Connect (free to set up) |
| 6.4 | **Workflow Version History + Rollback** | None — pure DB |
| 6.5 | **Two-Way SMS Conversations** | Already integrated (Twilio) |
| 6.6 | **SEO Landing Pages** (5 industry-targeted) | None — static pages |
| 6.7 | **G2 / Capterra / ProductHunt Listings** | All free |
| 6.8 | **Internal Metrics Dashboard** (`/admin/metrics`) | None |
| 6.9 | **Client Portal** (token-auth, project status, scores) | None |
| 6.10 | **Website Re-Audit Monitoring** (monthly automated re-audits + degradation alerts) | Google PageSpeed — free |

**Exit criteria:** MTD integration live. Affiliate programme generating referrals. 5 SEO pages indexed. ProductHunt launched.

---

### PHASE 7 — THE 90-DAY LAUNCH (Parallel Track — Sales)

This runs IN PARALLEL with the build phases above. The service packages generate revenue while the SaaS matures.

| Days | Goal | Actions |
|------|------|---------|
| **1–14** | Audit weapon live | Deploy `/audit` page. Share on LinkedIn, Twitter/X, Reddit. Start "building in public" content 3x/week. Target: 50+ audit submissions, 30+ emails |
| **15–30** | First service clients | Build `/services` sales page. Cold email 50 UK SMEs using own audit data as hook. Offer first 3 clients 20% discount for testimonial rights. Target: 2–3 signed clients, £5K+ committed |
| **31–60** | Growth engine proof | Run full pipeline for clients. Measure everything. Package results into case study. Start selling Growth Engine package. Target: 5+ total clients, £8K+/mo retainers |
| **61–90** | Compound and scale | Hit £10K MRR. Invite 5 service clients to beta-test SaaS. Launch content engine. Hire part-time VA for onboarding admin. Target: 8+ clients, 5+ SaaS beta users |

---

### RECOMMENDED ATTACK ORDER (Summary)

| Week | What | Why |
|------|------|-----|
| Week 0 | Phase 0: Schema migration | Everything depends on multi-tenant foundation |
| Week 1–2 | Phase 1: Templates + Trial + WhatsApp | Unblocks self-serve revenue |
| Week 2–3 | Phase 2: Audit tool | Top-of-funnel demand generator |
| Week 3–4 | Phase 3: GDPR + ROI dashboard | Compliance + retention |
| Week 4–5 | Phase 4: Outreach pipeline | Powers service delivery |
| Week 5–6 | Phase 5: Activation + agency features | Conversion + expansion |
| Week 7–10 | Phase 6: Scale features | Moat + market expansion |
| Ongoing | Phase 7: Sales (parallel) | Revenue funds everything |

---

## 6. OVERHEAD COSTS — THE REAL NUMBERS

**[CEO MODE] Every penny accounted for.** These are actual costs at launch scale, not enterprise pricing.

### Fixed Monthly Overheads (regardless of users)

| Service | Plan | Monthly Cost | Notes |
|---------|------|-------------|-------|
| Vercel | Pro | £16/mo | Required for cron jobs + commercial use |
| Supabase | Pro | £20/mo | 8GB DB, 250K auth requests, 500MB storage |
| Resend | Pro | £16/mo | 50K emails/mo — more than enough for Year 1 |
| Upstash Redis | Pay-as-you-go | £3/mo | Rate limiting — minimal at launch |
| Sentry | Team | £0/mo | Free tier (5K errors/mo) — sufficient |
| PostHog | Free | £0/mo | 1M events/mo free |
| Google Analytics | Free | £0/mo | — |
| Cloudflare | Free | £0/mo | DNS + CDN |
| Domain (zypflow.co.uk) | Annual | £1/mo | ~£12/yr |
| Stripe | Per transaction | 1.4% + 20p | UK cards. Deducted from revenue |
| **FIXED TOTAL** | | **~£56/mo** | |

### Variable Costs Per Service Client

| Service | Usage | Cost Per Client/Mo | Notes |
|---------|-------|-------------------|-------|
| Apify (scraping) | ~500 leads/mo per client | £8–15/mo | Free tier covers first client (49 runs) |
| Instantly.ai | Email sending + warmup | £25/mo | Starter plan per sending account |
| Meta WhatsApp Cloud API | ~200 service convos/mo | £0–6/mo | First 1,000/mo free across all clients |
| Twilio SMS | ~100 SMS/mo per client | £4/mo | UK SMS ~£0.04/msg |
| Claude API (AI summaries) | ~500 calls/mo per client | £8–12/mo | claude-sonnet-4-6 at ~$3/M input tokens |
| OpenAI (chat engine) | ~1,000 chats/mo per client | £10–15/mo | GPT-4o at ~$2.50/M input tokens |
| Google PageSpeed API | ~500 audits/mo per client | £0/mo | $200/mo free credit covers ~25K calls |
| **VARIABLE TOTAL** | | **~£55–73/mo per client** | |

### Variable Costs Per SaaS Subscriber

| Plan | Typical API Usage | Cost Per Subscriber/Mo |
|------|-------------------|----------------------|
| Starter (£49/mo) | Light — 200 leads, 500 emails, 20 AI gens | £8–12/mo |
| Growth (£149/mo) | Medium — 1,000 leads, 5K emails, 100 AI gens | £25–40/mo |
| Agency (£349/mo) | Heavy — unlimited leads, 50K emails, unlimited AI | £60–80/mo |

---

## 7. PRICING STRATEGY — ENGINEERED FOR £10K NET PROFIT IN MONTH 1

### The £10K Month 1 Model

**[CEO MODE] Hard constraint:** £10K net profit after ALL overheads. Here's exactly how we get there.

#### Revenue Target Breakdown

| Revenue Source | Units | Price | Gross Revenue |
|---------------|-------|-------|--------------|
| Operations Detox (Pkg 1) | 2 clients | £2,500 setup + £495/mo | £5,990 |
| Growth Engine (Pkg 2) | 1 client | £4,995 setup + £995/mo | £5,990 |
| Starter SaaS | 10 subscribers | £49/mo | £490 |
| Growth SaaS | 3 subscribers | £149/mo | £447 |
| **TOTAL GROSS** | | | **£12,917** |

#### Cost Breakdown for That Revenue

| Cost | Amount |
|------|--------|
| Fixed overheads | £56 |
| 3 service clients × £65/mo variable | £195 |
| 13 SaaS subscribers × £15/mo avg variable | £195 |
| Instantly.ai (3 sending accounts for service) | £75 |
| Stripe fees (1.4% + 20p on £12,917) | ~£210 |
| **TOTAL COSTS** | **£731** |

#### Month 1 P&L

| | Amount |
|---|--------|
| Gross Revenue | £12,917 |
| Total Costs | £731 |
| **Net Profit** | **£12,186** |
| **Net Margin** | **94.3%** |

**That's £10K+ net with conservative numbers.** The service package setup fees are the accelerator — they front-load cash in Month 1.

#### Month 2+ (Recurring Only — No New Setup Fees)

| Revenue Source | Monthly Recurring |
|---------------|------------------|
| 3 service retainers (£495 + £495 + £995) | £1,985 |
| 15 SaaS subscribers (growing) | £1,200 |
| **Monthly Recurring Revenue** | **£3,185** |
| Monthly Costs | ~£800 |
| **Net Monthly Profit (recurring)** | **£2,385** |

To sustain £10K+/mo net from Month 2 onward, you need either:
- **4 new service clients/mo** (setup fees + retainers), OR
- **~70 SaaS subscribers** at blended £149/mo avg, OR
- **Mix:** 2 new service clients + 30 SaaS subscribers

**[CEO MODE] Recommendation:** Sell 2 service packages per month minimum. The setup fees are your cash engine. SaaS subscriptions compound underneath. By Month 6, recurring revenue alone exceeds £10K/mo.

---

### Service Packages (Revenue Engine)

#### Package 1: "Operations Detox" — £2,500 setup + £495/mo

**Target:** SMEs drowning in manual admin — trades, professional services, hospitality.

**What they get:**
- Week 1: Paid discovery — audit top 10 time-wasting processes
- Week 2–3: Build 3–5 core automations (lead capture → CRM, invoice reminders, appointment confirmations, review requests, internal alerts)
- Week 4: Handover with recorded Loom walkthrough + documentation
- Ongoing: Monthly retainer covers monitoring, break/fix, one new automation per month

**Delivery cost:** ~£65/mo in API costs. **Margin: 87% on retainer.**
**Delivery time:** ~8 hours of actual work (rest is automated via template blueprints).

#### Package 2: "Growth Engine" — £4,995 setup + £995/mo

**Target:** Agencies, B2B services with inconsistent pipeline.

**What they get:**
- Everything in Operations Detox, plus:
- Automated lead pipeline (scrape → audit → score → cold email with personalised merge tags)
- CRM + pipeline with lead scoring
- Call list dashboard ranked by score
- Monthly KPI dashboard: leads generated, emails sent, replies, calls booked, deals closed

**Delivery cost:** ~£73/mo in API costs. **Margin: 93% on retainer.**
**Delivery time:** ~15 hours setup (pipeline is automated via Zypflow's own engine).

#### Package 3: "Digital Infrastructure" — £7,500–£15,000 project + £1,495/mo

**Target:** Established SMEs (£1M–£10M turnover) with 8–15 disconnected tools.

**What they get:**
- Full systems audit — map every tool, data flow, manual handoff
- Architecture blueprint — documented "digital operating system"
- Build-out: 10–20 integrated automations
- Team training: recorded SOPs, live walkthroughs
- Ongoing: monitoring, iteration, new automations, quarterly strategic review

**Delivery cost:** ~£80/mo in API costs. **Margin: 95% on retainer.**
**Delivery time:** ~30–40 hours over 4 weeks.

---

### SaaS Pricing (Self-Serve)

| | Starter | Growth | Agency |
|--|---------|--------|--------|
| **Price** | £49/mo | £149/mo | £349/mo |
| **Trial** | 14 days free (no card) | 14 days free (no card) | 14 days free (no card) |
| Leads | 200 | 1,000 | Unlimited |
| Scraping credits | 100/mo | 500/mo | Unlimited |
| Email accounts | 1 | 5 | 25 |
| Emails/month | 500 | 5,000 | 50,000 |
| Audit tool | Unlimited | Unlimited | Unlimited |
| AI generations | 20/mo | 100/mo | Unlimited |
| WhatsApp conversations | 100/mo | 500/mo | Unlimited |
| Templates | 5 | All 14 | All + custom |
| Team members | 1 | 5 | 15 |
| White-label | No | No | Yes |
| API access | No | Read-only | Full |
| Support | Email | Priority | Dedicated |
| **Cost to serve** | ~£10/mo | ~£32/mo | ~£70/mo |
| **Gross margin** | **80%** | **79%** | **80%** |

**Overages:** £0.05/lead, £0.01/email, £0.02/AI generation over limit.

**No free plan.** 14-day trial qualifies buyers, not browsers.

---

## 8. GO-TO-MARKET — MONTH 1 SALES PLAYBOOK

**[CEO MODE] You need 2 service clients + 13 SaaS subscribers in 30 days. Here's how.**

### Week 1: Audit Tool Launch (Days 1–7)
- Deploy `/audit` — public, no signup required
- Share on LinkedIn (personal + company page), Twitter/X, Reddit (r/webdev, r/smallbusiness, r/UKBusiness)
- Post 3x "building in public" updates
- Run 50 audits manually on target businesses → save results → use as outreach ammunition
- **Target:** 100+ audit submissions, 50+ emails captured

### Week 2: Cold Outreach Blitz (Days 8–14)
- Cold email 100 UK SMEs using their own audit data as the hook
- Subject: "I found {{number_of_issues}} issues with {{website}}"
- LinkedIn DMs to 50 connections in target industries
- Offer first 3 clients 20% discount for testimonial + case study rights
- **Target:** 10+ replies, 5+ discovery calls booked

### Week 3: Close + Activate (Days 15–21)
- Close 2+ service clients from discovery calls
- Collect setup fees (£2,500–£4,995 each) via Stripe
- Begin delivery using Zypflow's own automation stack
- Push SaaS signups via audit tool email list → trial invites
- **Target:** 2 service clients signed, 8+ SaaS trials started

### Week 4: Compound (Days 22–30)
- Deliver first results to service clients (scrape, audit, outreach running)
- Convert trial users → paid (Day 10 + Day 13 reminder emails trigger)
- Request testimonials from early adopters
- **Target:** £10K+ net in the bank, 13+ SaaS subscribers

### Outreach Templates

**Cold email (service):**
> Hi {{first_name}},
>
> I ran a quick audit on {{website}} — your speed score is {{speed_score}}/100 and there are {{number_of_issues}} issues that are likely costing you enquiries.
>
> We help UK {{industry}} businesses automate their client pipeline. Our last client went from 3 enquiries/week to 12 within 60 days.
>
> Would a 15-minute walkthrough of the findings be useful?
>
> {{your_name}}, Zypflow

**Trial conversion email (Day 10):**
> Hi {{first_name}},
>
> You've got 4 days left on your Zypflow trial. So far you've {{action_summary}}.
>
> Upgrade now to keep your templates, leads, and automations running. Plans start at £49/mo.
>
> [Upgrade Now →]

---

## 9. METRICS THAT MATTER

### North Star Metric
**Pipeline-to-Close Conversion Rate** — if this is zero, nothing else matters.

### Leading Indicators (Weekly)

| Metric | Target | Why |
|--------|--------|-----|
| Audit submissions | 50+/week | Top-of-funnel demand |
| Emails captured from audits | 30+/week | Conversion to leads |
| Outreach emails sent | 500+/week | Pipeline velocity |
| Reply rate | 3–5% | Message-market fit |
| Discovery calls booked | 3+/week | Bottom-of-funnel |
| SaaS trial signups | 10+/week | Self-serve traction |

### Lagging Indicators (Monthly)

| Metric | Target | Why |
|--------|--------|-----|
| New service clients | 2+/month | Revenue growth |
| MRR | Growing 20%+ MoM | Business health |
| Client churn | <5%/month | Service quality |
| Trial → Paid conversion | >25% | Activation quality |
| Net margin | >80% | Unit economics |
| Automation success rate | >98% | System reliability |

### Kill Switches — Stop Building, Start Selling If:

| Trigger | After | Action |
|---------|-------|--------|
| Zero paying clients | 90 days of active outreach | Pivot positioning or market |
| Reply rate <1% | 2,000+ emails sent | Rewrite copy, change ICP |
| Every call: "we use GoHighLevel" | 10+ calls | Wrong market — go more niche |
| Audit tool <10 submissions/week | 4 weeks live | No demand for wedge — pivot |
| CAC exceeds £2,000 | 5+ clients acquired | Pricing or channel problem |

---

## 10. FREE APIs & SERVICES REQUIRED

| Service | What For | Cost | Status |
|---------|----------|------|--------|
| Meta WhatsApp Cloud API | WhatsApp messaging | 1,000 service convos/mo free | Partially integrated |
| Google PageSpeed Insights API | Website audits | Free ($200/mo credit) | Not integrated |
| HMRC MTD API | Making Tax Digital | Free (sandbox + production) | Phase 6 |
| Xero API | Accounting sync for MTD | Free partner programme | Phase 6 |
| FreeAgent API | Accounting sync for MTD | Free for integrations | Phase 6 |
| Zapier REST API | Migration tool reads user's Zaps | Free (user provides key) | Phase 5 |
| Google Places API | Review request links | Free ($200/mo credit) | Phase 6 |
| Cal.com API | Booking integration | Free tier | LIVE |
| Stripe Connect | Affiliate payouts | Free to set up | Phase 6 |
| Apify | Lead scraping | Free tier (49 runs/mo) | LIVE |
| Instantly.ai | Cold email | From £25/mo per account | INTEGRATED |

---

## 11. CODING CONVENTIONS

### TypeScript Strict Mode — Always
```typescript
// tsconfig.json — strict: true is non-negotiable
// Use Zod for ALL external data validation
// Use server components by default, 'use client' only for interactivity
```

### File Structure (Next.js App Router)
```
src/
  app/
    (marketing)/          → Public pages (landing, pricing, audit, blog)
    (auth)/               → Login, signup, forgot password
    (dashboard)/          → Authenticated app pages
  components/
    ui/                   → Reusable (Button, Card, Modal)
    dashboard/            → Dashboard-specific
  lib/
    supabase/
      client.ts           → Browser client
      server.ts           → Server client
      admin.ts            → Service role (edge functions only)
    stripe.ts
    utils.ts
  hooks/                  → Custom React hooks
  types/                  → TypeScript definitions
```

### Supabase Query Pattern
```typescript
// ALWAYS filter by org_id. RLS is the safety net, not the strategy.
const { data, error } = await supabase
  .from('leads')
  .select('*')
  .eq('org_id', orgId)
  .order('lead_score', { ascending: false });

if (error) throw error;
```

### Critical Rules
1. **Every table has `org_id` + RLS.** No exceptions.
2. **Never hardcode secrets.** Environment variables only.
3. **Never trust client-side data.** Validate server-side with Zod.
4. **Credit metering enforced server-side.** Never rely on client checks.
5. **Log to `activity_log`.** Every significant action gets recorded.
6. **Mobile-first.** Test every page at 375px.
7. **No Solis references.** Zypflow is its own brand entirely.
8. **Cache PageSpeed results 7 days.** Don't re-audit the same URL twice in a week.
9. **Ship incremental.** Phase N must be solid before starting Phase N+1.
10. **Build only what's validated.** If 3+ paying clients haven't asked for it, don't build it.

---

## 12. PRE-LAUNCH CHECKLIST (Manual Steps)

### Domain Setup
- [ ] Add `app.zypflow.com` in Vercel project settings
- [ ] Cloudflare DNS: CNAME `app` → `cname.vercel-dns.com`
- [ ] SSL auto-provisions via Vercel

### Email Domain Verification (CRITICAL — without this, emails go to spam)
- [ ] Add `zypflow.com` to Resend dashboard
- [ ] Add SPF, DKIM, DMARC records in Cloudflare
- [ ] Verify — then emails send from `hello@zypflow.com`

### Email Warmup Plan
- Week 1: Max 20 emails/day (transactional only)
- Week 2: Max 50/day (add welcome emails)
- Week 3: Max 150/day (add review requests, nurture)
- Week 4: Full volume. Monitor: Open >20%, Bounce <2%, Spam <0.1%

### Twilio UK Number
- [ ] Buy UK mobile number in Twilio console
- [ ] Complete UK regulatory bundle
- [ ] Update `TWILIO_PHONE_NUMBER` env var
- [ ] Set SMS webhook: `https://app.zypflow.com/api/sms/incoming`

### Stripe Live Mode
- [ ] Complete identity verification
- [ ] Verify webhook endpoint
- [ ] Add webhook events: checkout.session.completed, subscription.updated, subscription.deleted, invoice.payment_failed, trial_will_end
- [ ] Copy signing secret to `STRIPE_WEBHOOK_SECRET`

### Credential Rotation (CRITICAL — keys were in git history)
- [ ] Rotate ALL API keys: Stripe, OpenAI, Anthropic, Twilio, Resend, Supabase service role, Upstash, Apify, Make.com, Cloudflare, Instantly
- [ ] Update all values in Vercel env vars

---

## 13. THE 12 SURVIVAL RULES

1. **Validate before you build.** Talk to 20 agencies. Confirm they'd pay.
2. **Cut features ruthlessly.** Launch with audit + scraper + outreach. Nothing else.
3. **Own the audit wedge.** Make it the best free audit tool in the UK.
4. **Go vertical, not horizontal.** "For UK service businesses" — not "for everyone."
5. **Model unit economics now.** Know cost per user per plan before setting prices.
6. **Kill the free plan.** 14-day trial qualifies buyers, not browsers.
7. **Build audience alongside product.** Build in public. Weekly posts. Ship audit tool first.
8. **Sell services to fund the product.** Packages generate cash while SaaS matures.
9. **Price on outcomes, not seats.** Charge per lead, per audit, per automation.
10. **Dogfood aggressively.** Use Zypflow to sell Zypflow.
11. **Set a kill switch.** No paying users within 90 days → pivot.
12. **Track one metric.** Pipeline-to-close conversion rate.

---

**END OF UNIFIED MASTER PLAN**

This document is the single source of truth for all Zypflow development, strategy, pricing, and operations. All previous strategy files are superseded and deleted.
