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

*Continue with `continue` for Part 3: Service Packages, Pricing, Go-To-Market, Metrics, Kill Switches, and Coding Conventions.*
