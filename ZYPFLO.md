# ZYPFLOW — AI Build Assistant Guide

> **Purpose of this document:** Feed this entire file to an AI coding assistant (Claude, Cursor, etc.) at the start of any Zypflow development session. It contains everything needed to understand the product, architecture, database, features, and build priorities — with zero references to any other project or business. This is Zypflow and Zypflow only.

---

## CONTEXT FOR THE AI ASSISTANT

You are helping build **Zypflow** (zypflow.co.uk) — an AI-powered workflow automation and client acquisition platform for agencies and small businesses. Think of it as the intersection between Make.com (too technical), GoHighLevel (too expensive at $97–$497/mo), and HubSpot (enterprise-only) — but purpose-built for lead generation, website auditing, and cold outreach.

**Current state:** The product is partially built. Some core features exist, others are planned. When building, always check what exists before creating new components. Never assume a feature is missing — ask or check the codebase first.

**Your role:** Write production-quality code. Follow the tech stack and conventions described below. When making architecture decisions, optimise for multi-tenancy, speed, and simplicity. Every table has `org_id`. Every query must respect RLS.

---

## 1. WHAT ZYPFLOW IS

**Tagline:** "Automate your entire client pipeline with AI."

**One-liner:** Zypflow finds leads, audits their websites with AI, runs personalised outreach, and manages your pipeline — so you can focus on delivery.

**Category:** AI-powered workflow automation + CRM for small agencies and businesses.

### Core Value Propositions
1. **Find leads automatically** — scrape Google Maps by industry + location, enrich with contact data
2. **Audit & qualify instantly** — AI analyses websites, scores leads, generates personalised insights
3. **Outreach on autopilot** — personalised cold email sequences using audit data as the hook
4. **Manage everything in one place** — pipeline, calls, proposals, projects, client portal
5. **Build custom workflows** — drag-and-drop automation builder for any business process

### Target Customers

**Primary — Small Agencies (1–10 people):**
Web design agencies, marketing consultants, SEO freelancers who are great at delivery but inconsistent at finding clients.

**Secondary — Local Business Owners:**
Small businesses who want to manage their own marketing without paying agency fees.

**Tertiary — Marketing Teams at SMBs:**
In-house marketers paying £500+/mo for disconnected tools that don't talk to each other.

### Competitive Positioning

| | Zypflow | HubSpot | GoHighLevel | Make.com |
|--|---------|---------|-------------|---------|
| Price | From £49/mo | From £800/mo | From $97/mo | From £9/mo |
| AI lead scoring | Built-in | Add-on | No | No |
| Website auditing | Built-in | No | No | No |
| Cold email | Built-in | Add-on | Yes | No |
| Workflow builder | Yes | Yes | Yes | Yes (complex) |
| Made for agencies | Yes | No (enterprise) | Yes | No (developers) |
| White-label | Yes (Agency plan) | No | Yes (SaaS mode) | No |

**Key differentiator vs GoHighLevel:** Zypflow has native website auditing + AI-powered lead qualification baked in. GHL doesn't audit websites or score leads by site quality. Zypflow is also significantly cheaper and doesn't have hidden usage fees for SMS/calls.

---

## 2. TECH STACK

| Layer | Technology | Why |
|-------|-----------|-----|
| Frontend | **Next.js 14** (App Router) + **Tailwind CSS** | Fast, SEO-friendly, React ecosystem |
| Backend | **Supabase** (Postgres + Auth + Edge Functions + Realtime) | Full backend in one service |
| Hosting | **Vercel** | Zero-config deploys, edge network, preview deployments |
| Auth | **Supabase Auth** | Email/password, Google OAuth, magic links |
| Payments | **Stripe Billing** | Subscriptions, metered billing, customer portal |
| Email sending | **Resend** | Transactional + marketing emails, domain verification |
| AI | **Anthropic Claude API** | Audit summaries, content gen, chatbot, copy |
| Scraping | **Apify** | Google Maps actor, reliable, scalable |
| Cold email | **Instantly.ai API** | Warmup, rotation, tracking |
| File storage | **Supabase Storage** | Audit PDFs, logos, uploads |
| Analytics | **PostHog** or **Plausible** | Product analytics, funnels |
| Error tracking | **Sentry** | Catch bugs before users report them |

### Environment Variables Required
```
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Stripe
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=

# AI
ANTHROPIC_API_KEY=

# Email
RESEND_API_KEY=

# Scraping
APIFY_API_TOKEN=

# Cold Email
INSTANTLY_API_KEY=
INSTANTLY_CAMPAIGN_ID=

# Google PageSpeed
PAGESPEED_API_KEY=
```

> **IMPORTANT:** Never hardcode any of these values. Always use environment variables. Never commit `.env` files.

---

## 3. DATABASE SCHEMA

### Multi-Tenant Architecture

Every table has an `org_id` column. RLS policies ensure users only see their own organisation's data. This is non-negotiable — never create a table without `org_id` and RLS.

```sql
-- ============================================
-- CORE: ORGANISATIONS & TEAMS
-- ============================================

CREATE TABLE organisations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  owner_id uuid REFERENCES auth.users(id),
  plan text DEFAULT 'free' CHECK (plan IN ('free','starter','growth','agency','enterprise')),
  stripe_customer_id text UNIQUE,
  stripe_subscription_id text,
  settings jsonb DEFAULT '{"brand_color":"#6366f1","logo_url":null}',
  scraping_credits integer DEFAULT 0,
  email_credits integer DEFAULT 0,
  ai_credits integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE org_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid REFERENCES organisations(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  role text DEFAULT 'member' CHECK (role IN ('owner','admin','member','viewer')),
  invited_email text,
  accepted_at timestamptz,
  created_at timestamptz DEFAULT now(),
  UNIQUE(org_id, user_id)
);

-- ============================================
-- PIPELINE: LEADS
-- ============================================

CREATE TABLE leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  business_name text NOT NULL,
  website text,
  email text,
  phone text,
  industry text,
  location text,
  google_rating float,
  review_count integer,
  has_website boolean DEFAULT true,
  status text DEFAULT 'New',
  lead_score integer DEFAULT 0,
  speed_score numeric,
  seo_score numeric,
  mobile_score numeric,
  ssl_secure boolean,
  audit_summary text,
  revenue_loss_estimate text,
  notes text,
  source text DEFAULT 'manual',
  tags text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ============================================
-- PIPELINE: OUTREACH
-- ============================================

CREATE TABLE outreach (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  lead_id uuid REFERENCES leads(id),
  contact_email text,
  subject text,
  sequence_step integer DEFAULT 1,
  status text DEFAULT 'Queued',
  opens integer DEFAULT 0,
  clicked boolean DEFAULT false,
  replied_at timestamptz,
  sent_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- ============================================
-- PIPELINE: NURTURE SEQUENCES
-- ============================================

CREATE TABLE nurture_sequences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  lead_id uuid REFERENCES leads(id),
  email text NOT NULL,
  business_name text,
  sequence_step integer DEFAULT 1,
  total_steps integer DEFAULT 4,
  status text DEFAULT 'active',
  next_send_at timestamptz,
  last_sent_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- ============================================
-- PIPELINE: AUDITS
-- ============================================

CREATE TABLE audits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  lead_id uuid REFERENCES leads(id),
  url text NOT NULL,
  speed_score integer,
  seo_score integer,
  mobile_score integer,
  ssl_secure boolean,
  ai_summary text,
  full_report jsonb,
  created_at timestamptz DEFAULT now()
);

-- ============================================
-- CLIENT MANAGEMENT
-- ============================================

CREATE TABLE clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  lead_id uuid REFERENCES leads(id),
  business_name text,
  contact_name text,
  email text,
  package text,
  one_off_revenue numeric DEFAULT 0,
  monthly_retainer numeric DEFAULT 0,
  start_date date DEFAULT CURRENT_DATE,
  status text DEFAULT 'Active',
  notes text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  client_id uuid REFERENCES clients(id),
  business_name text NOT NULL,
  package text,
  status text DEFAULT 'discovery',
  milestones jsonb DEFAULT '[]',
  domain text,
  dns_status text DEFAULT 'not_started',
  ssl_status text DEFAULT 'pending',
  preview_url text,
  live_url text,
  portal_token text UNIQUE,
  brief_data jsonb,
  created_at timestamptz DEFAULT now()
);

-- ============================================
-- AI CHATBOT (per client)
-- ============================================

CREATE TABLE chatbot_configs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  client_id uuid REFERENCES clients(id),
  business_name text NOT NULL,
  business_description text,
  services jsonb DEFAULT '[]',
  faqs jsonb DEFAULT '[]',
  hours text,
  phone text,
  email text,
  booking_url text,
  custom_instructions text,
  widget_color text DEFAULT '#6366f1',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- ============================================
-- REVIEW AUTOMATION
-- ============================================

CREATE TABLE review_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  client_id uuid REFERENCES clients(id),
  customer_name text,
  customer_email text,
  google_review_url text NOT NULL,
  status text DEFAULT 'pending',
  sent_at timestamptz,
  reviewed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- ============================================
-- AI CONTENT GENERATION
-- ============================================

CREATE TABLE blog_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  client_id uuid REFERENCES clients(id),
  title text NOT NULL,
  slug text,
  content text NOT NULL,
  meta_description text,
  keywords text[],
  status text DEFAULT 'draft',
  word_count integer,
  created_at timestamptz DEFAULT now()
);

-- ============================================
-- WORKFLOW AUTOMATION BUILDER
-- ============================================

CREATE TABLE workflows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  trigger_type text NOT NULL CHECK (trigger_type IN ('schedule','webhook','db_change','manual','email_event')),
  trigger_config jsonb DEFAULT '{}',
  steps jsonb DEFAULT '[]',
  is_active boolean DEFAULT false,
  last_run_at timestamptz,
  run_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE workflow_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  workflow_id uuid REFERENCES workflows(id) ON DELETE CASCADE,
  status text DEFAULT 'running' CHECK (status IN ('running','completed','failed','cancelled')),
  steps_completed integer DEFAULT 0,
  error_message text,
  started_at timestamptz DEFAULT now(),
  completed_at timestamptz
);

-- ============================================
-- SCRAPER CONFIG (per org)
-- ============================================

CREATE TABLE scraper_configs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  industries text[] DEFAULT '{}',
  cities text[] DEFAULT '{}',
  max_results integer DEFAULT 20,
  auto_enabled boolean DEFAULT false,
  schedule_cron text,
  last_run_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- ============================================
-- ACTIVITY LOG (audit trail)
-- ============================================

CREATE TABLE activity_log (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  org_id uuid NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id),
  action text NOT NULL,
  description text,
  target_type text,
  target_id text,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- ============================================
-- INQUIRIES (public form submissions)
-- ============================================

CREATE TABLE inquiries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid,
  email text NOT NULL,
  name text,
  business_url text,
  message text,
  source text DEFAULT 'website',
  created_at timestamptz DEFAULT now()
);

-- ============================================
-- HEALTH CHECKS (system monitoring)
-- ============================================

CREATE TABLE health_checks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid REFERENCES organisations(id) ON DELETE CASCADE,
  check_type text NOT NULL,
  target_url text,
  status text DEFAULT 'ok' CHECK (status IN ('ok','warning','critical')),
  response_time_ms integer,
  error_message text,
  created_at timestamptz DEFAULT now()
);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================
-- Apply this pattern to EVERY table with org_id:

ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "org_isolation" ON leads FOR ALL
  USING (org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid()))
  WITH CHECK (org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid()));

-- Repeat for: outreach, nurture_sequences, audits, clients, projects,
-- chatbot_configs, review_requests, blog_posts, workflows, workflow_runs,
-- scraper_configs, activity_log, health_checks
```

---

## 4. LEAD PIPELINE (Status Flow)

```
New → Audited → In Outreach → Replied → Call Booked → Client Won
```

Leads can also be marked as: `Bounced`, `Not Interested`, `Lost`

### Lead Scoring Algorithm (0–130 points)

Higher score = worse website = better prospect for us.

| Condition | Points |
|-----------|--------|
| No website at all | +30 |
| Speed score < 50 | +20 |
| No SSL certificate | +15 |
| Google rating < 4.0 | +15 |
| Has email address | +10 |
| Has phone number | +5 |
| High-value industry (dentist, solicitor, estate agent, accountant) | +10 |
| Target city (major UK city) | +10 |
| Review count < 20 | +5 |
| SEO score < 50 | +10 |

### Target Industries (26)
dentist, plumber, electrician, restaurant, estate agent, solicitor, accountant, gym, salon, barber, physiotherapy, veterinary, hotel, cafe, car mechanic, locksmith, florist, photographer, architect, cleaning service, tutor, personal trainer, tattoo studio, optician, chiropractor, nursery

### Target Cities (19)
London, Manchester, Birmingham, Leeds, Liverpool, Bristol, Sheffield, Newcastle, Nottingham, Leicester, Brighton, Edinburgh, Glasgow, Cardiff, Oxford, Cambridge, Southampton, Reading, York

---

## 5. PRODUCT FEATURES (by plan)

### Core Platform (All Plans)

**Pipeline Dashboard** — Real-time KPIs: leads, audited, outreach sent, replies, clients won. Visual conversion funnel. Revenue tracking (MRR, one-off, per-client). Activity feed.

**Lead Management** — Lead database with search, filters, bulk actions. Status pipeline. Lead scoring. Import/export CSV. Manual add or auto-scraped.

**Website Audit Tool** — Enter any URL → instant PageSpeed analysis (speed, SEO, mobile, SSL). AI-generated audit summary in plain English. PDF audit report generation. Before/after comparison tracking.

**Contact Management** — Call priority list ranked by conversion likelihood. Click-to-call with status tracking. Email/phone/website for each lead. Notes and activity history.

### Growth Features

**Lead Scraping Engine** — Google Maps scraper (by industry + city). Email extraction. Automatic deduplication. Configurable schedule. Credit-based usage.

**Cold Email Automation** — Connect email accounts. Personalised sequences with merge tags from audit data. A/B testing subject lines. Open/reply/bounce tracking. Auto-pause on reply. Domain warmup management.

**Nurture Sequences** — Multi-step email sequences (1–7 steps). Trigger-based: after audit, after reply, after X days. Template library. Performance analytics.

**AI Content Generation** — Blog posts (SEO-optimised, per-client). Email copy. Proposal copy. Social media posts.

### Agency Features

**AI Chatbot Builder** — Create chatbots for client websites. Per-client knowledge base. Embeddable widget. Conversation history and analytics. Powered by Claude API.

**Google Reviews Automation** — Configure review URL per client. Queue review request emails. Branded templates. Conversion tracking.

**Client Portal** — Branded portal for each client. Project milestones and status. Live performance scores. Change request system.

**Website Refresh Monitoring** — Automated monthly re-audits. Score degradation alerts. AI-generated recommendations. Branded reports.

**White-Label** — Custom domain. Custom branding (logo, colours). Branded client portals. Branded email sending. Remove all Zypflow branding.

**Workflow Builder** — Visual drag-and-drop automation builder. Triggers: schedule, webhook, database change, email event. Actions: send email, update record, run audit, call API, AI generate. Conditions and branching logic. Pre-built templates. Connect external APIs.

**API Access** — RESTful API for all platform features. Webhook endpoints. API key management. Rate limiting per plan.

---

## 6. PRICING

| | Free | Starter | Growth | Agency |
|--|------|---------|--------|--------|
| **Price** | £0/mo | £49/mo | £149/mo | £349/mo |
| **Leads** | 25 | 200 | 1,000 | Unlimited |
| **Scraping credits** | 0 | 100/mo | 500/mo | Unlimited |
| **Email accounts** | 0 | 1 | 5 | 25 |
| **Emails/month** | 0 | 500 | 5,000 | 50,000 |
| **Audit tool** | 5/mo | Unlimited | Unlimited | Unlimited |
| **AI generations** | 3/mo | 20/mo | 100/mo | Unlimited |
| **Chatbots** | — | — | 1 | Unlimited |
| **Review automation** | — | — | 1 client | Unlimited |
| **Client portals** | — | — | 3 | Unlimited |
| **Workflow builder** | — | Basic (3) | Full | Full + custom |
| **Team members** | 1 | 1 | 5 | 15 |
| **White-label** | — | — | — | Yes |
| **API access** | — | — | Read-only | Full |
| **Support** | Community | Email | Priority | Dedicated |

**Enterprise:** Custom pricing for 50+ seats, SLA, dedicated instance.

**Revenue model:** Subscriptions + usage overages (£0.05/lead, £0.01/email, £0.02/AI generation over limit) + enterprise + marketplace (future workflow templates) + partner programme (20% recurring for 12 months).

---

## 7. PAGE STRUCTURE & ROUTING

### Marketing Site (zypflow.co.uk — public)
```
/                     → Landing page
/features             → Feature deep-dive with screenshots
/pricing              → Pricing table with feature comparison + FAQ
/blog                 → SEO content (lead gen tips, agency growth, automation)
/blog/[slug]          → Individual blog post
/changelog            → Product updates
/docs                 → API documentation + guides
/login                → Sign in
/signup               → Create account → select plan → onboarding
```

### App (app.zypflow.co.uk — authenticated)
```
/dashboard            → KPI overview, funnel, recent activity
/leads                → Lead table with filters, scoring, bulk actions
/leads/[id]           → Lead detail: audit, outreach history, notes
/audit                → Website audit tool (enter URL → results)
/outreach             → Email campaigns: sequences, templates, analytics
/outreach/sequences   → Nurture sequence builder
/outreach/templates   → Email template library
/clients              → Client management
/clients/[id]         → Client detail, project, portal
/projects             → Active website builds tracker
/projects/[id]        → Project milestones, DNS, SSL, preview
/scraper              → Lead scraper config (industries, cities, schedule)
/chatbot              → Chatbot builder (per client knowledge bases)
/reviews              → Review automation dashboard
/content              → AI content generator (blogs, emails, social)
/workflows            → Workflow automation builder
/workflows/[id]       → Workflow editor (visual builder)
/portal/[token]       → Client-facing portal (no auth needed)
/settings             → Org settings
/settings/team        → Team members, invites, roles
/settings/billing     → Stripe customer portal
/settings/api         → API keys
/settings/whitelabel  → White-label config (Agency plan)
```

---

## 8. AUTOMATION PIPELINE (End-to-End Flow)

This is the fully automated lead-to-client pipeline. Each step triggers the next.

```
SCRAPE (Apify + scheduled trigger)
  │  Industries × Cities → leads table (status: New)
  ↓
SCORE (lead-scoring logic — runs after scrape)
  │  Algorithm: 0–130 points based on website quality + industry + location
  ↓
AUDIT (PageSpeed API + Claude AI summary)
  │  Speed, SEO, mobile, SSL analysis → status: Audited
  ↓
PUSH TO EMAIL PLATFORM (after audit)
  │  Audited leads + personalised merge tags → email campaign
  │  Dedup: skip leads already in outreach table
  ↓
EMAIL SEQUENCE (automated — 5 emails over 14 days)
  │  Day 0 → Day 3 → Day 7 → Day 10 → Day 14
  │  Personalised with audit data as the hook
  ↓
TRACK EVENTS (webhook handler)
  │  Opens → update outreach table
  │  Replies → update lead status, pause nurture sequence
  │  Bounces → mark lead as bounced
  ↓
CALL (Dashboard call list — sorted by score + reply status)
  │  Track: Called, Callback, Interested, Call Booked
  ↓
CLOSE → Create client record + send portal token
ONBOARD → Client brief form → project setup
BUILD → Design → Development → Review
LAUNCH → DNS + SSL → Go live
MONITOR → Automated health checks + re-audits
REPORT → Daily KPI email digest
```

### Email Merge Tags (for outreach personalisation)

| Merge Tag | Source | Example |
|-----------|--------|---------|
| `{{business_name}}` | leads.business_name | "Smith's Plumbing" |
| `{{website}}` | leads.website | "smithplumbing.co.uk" |
| `{{first_name}}` | Extracted from email | "John" |
| `{{industry}}` | leads.industry | "plumber" |
| `{{location}}` | leads.location | "Manchester" |
| `{{speed_score}}` | leads.speed_score | "34" |
| `{{issue_1}}` | Auto-generated from scores | "Site speed score is 34/100" |
| `{{issue_2}}` | Auto-generated from scores | "SEO score is 28/100" |
| `{{issue_3}}` | Auto-generated from scores | "No SSL certificate" |
| `{{number_of_issues}}` | Count of issues | "3" |
| `{{calendly_link}}` | Org settings | Booking URL |

### Email Sequence Templates

| Step | Day | Subject |
|------|-----|---------|
| 1 | Day 0 | "I found {{number_of_issues}} issues with {{website}}" |
| 2 | Day 3 | "Quick thought about {{business_name}}'s website" |
| 3 | Day 7 | "How a {{industry}} in {{location}} got 280% more enquiries" |
| 4 | Day 10 | "Re: {{business_name}} website" |
| 5 | Day 14 | "Should I close your file?" |

### Webhook Event Handling

| Email Event | → Outreach Status | → Lead Status | → Nurture Action |
|-------------|-------------------|---------------|------------------|
| `email_opened` | Opened (opens +1) | — | — |
| `email_replied` | Replied | Replied | Pause sequence |
| `email_bounced` | Bounced | Bounced | — |

---

## 9. SCHEDULED AUTOMATIONS (Background Jobs)

These should be implemented as either Supabase Edge Functions with pg_cron, or as external scheduled jobs via Make.com/Zypflow's own workflow engine.

| Job | Frequency | What It Does |
|-----|-----------|--------------|
| Health Monitor | Every 30 min | Check site uptime, Supabase, API health. Log to health_checks. Alert on failure. |
| Daily KPI Report | Daily 8am | Calculate pipeline KPIs, revenue totals, top leads. Email digest to org owner. |
| Audit & Score Pipeline | Every 15 min | Run PageSpeed audit on new leads, then run scoring algorithm. |
| Push to Email Platform | Every 1 hour | Push audited leads with merge tags to email campaign. Dedup against outreach table. |
| Email Event Webhook | On event | Receive open/reply/bounce webhooks. Update outreach + leads tables. |
| Nurture Processor | Every 6 hours | Enqueue new audited leads into nurture sequences. Process due emails. |
| DNS/SSL Monitor | Every 4 hours | Check client project domains for DNS propagation and SSL activation. |
| Website Re-Audit | Monthly | Re-audit all active client websites. Alert on score degradation. |
| Usage Metering | Daily midnight | Calculate scraping/email/AI credit usage per org. Enforce plan limits. |

### KPIs to Calculate (Daily Report)
- Total leads, new leads (24h), audited count, leads with email/phone
- Outreach: sent, opened, replied, interested, calls booked
- Revenue: one-off total, MRR total, per-package breakdown
- Top 5 leads to call (highest lead_score, status = Audited)
- System health: uptime %, average response time

---

## 10. EDGE FUNCTIONS

| Function | Purpose | Auth |
|----------|---------|------|
| `apify-proxy` | Browser→Apify proxy to bypass CORS | None (CORS enabled) |
| `auto-scraper` | Triggered by pg_cron for scheduled scraping | JWT |
| `scrape-callback` | Processes Apify results webhook | None (webhook) |
| `run-audit` | PageSpeed API call + Claude AI summary generation | JWT |
| `chatbot` | Per-client AI chatbot responses (Claude API) | Widget token |
| `generate-content` | AI content generation (blogs, emails, social) | JWT |
| `send-email` | Resend API wrapper for transactional/marketing emails | JWT |
| `stripe-webhook` | Handle Stripe subscription events | Stripe signature |
| `lead-score` | Calculate and update lead scores on insert/update | DB trigger |

---

## 11. BUILD ORDER (Phased — SUPERSEDED by Section 17 "90-Day Launch Plan")

> **NOTE:** The phased build below is the original SaaS-first roadmap. It has been superseded by the 90-Day Launch Plan in Section 17, which prioritises revenue before features. Use Section 17 for execution. Keep this section as reference for what the full SaaS platform eventually looks like.

### Phase 1: Foundation (Week 1–2)
- [ ] Init Next.js 14 project + Tailwind + Supabase
- [ ] Set up Supabase Auth (email/password, Google OAuth)
- [ ] Create organisations + org_members tables with RLS
- [ ] Build auth flow: signup → create org → onboarding wizard
- [ ] Build marketing landing page (hero, features, pricing, CTA)
- [ ] Build dashboard shell (sidebar nav, KPI cards, empty states)
- [ ] Build lead management (table with search/filters, add, edit, delete, bulk actions)
- [ ] Build audit tool (URL input → PageSpeed API → Claude AI summary → save)
- [ ] Deploy to Vercel

### Phase 2: Pipeline (Week 3–4)
- [ ] Build lead scoring (edge function, runs on insert/update trigger)
- [ ] Build scraper integration (Apify actor config, per-org settings, credit tracking)
- [ ] Build outreach system (connect email account, sequence builder, sending via Resend/Instantly)
- [ ] Build nurture sequences (multi-step, trigger-based, auto-pause on reply)
- [ ] Integrate Stripe Billing (checkout flow, subscription management, customer portal)
- [ ] Add usage metering (scraping credits, email credits, AI credits — enforce plan limits)

### Phase 3: Client Tools (Week 5–6)
- [ ] Build client management (CRUD, link to leads, revenue tracking)
- [ ] Build project tracker (milestones, DNS/SSL status, preview URL)
- [ ] Build client portal (token auth, scores, milestones, support requests)
- [ ] Build chatbot builder (per-client config, knowledge base, widget embed code)
- [ ] Build review automation (queue, send email, track conversions)
- [ ] Build AI content generator (blog posts, email copy, social posts)
- [ ] Deploy chatbot edge function

### Phase 4: Workflows + Scale (Week 7–8)
- [ ] Build visual workflow builder (drag-and-drop, triggers, actions, conditions)
- [ ] Build workflow execution engine (edge functions, run queue)
- [ ] Build team management (invite by email, roles/permissions, seat limits)
- [ ] Build white-label system (custom domain, branding, emails — Agency plan only)
- [ ] Build REST API (API keys, rate limiting, per-plan access)
- [ ] Build admin panel (super-admin view of all orgs — internal use)
- [ ] Stripe webhooks (subscription lifecycle, failed payments, usage alerts, plan changes)

### Phase 5: Polish + Launch (Week 9–10)
- [ ] Onboarding wizard (guided setup: connect email, set industries/cities, first audit)
- [ ] Email notifications (weekly digest, high-score lead alerts, system alerts)
- [ ] Documentation site (API docs, user guides, video walkthroughs)
- [ ] Product Hunt launch prep (screenshots, copy, maker profile)
- [ ] Beta user programme (invite 20 agencies, collect feedback)

---

## 12. BRANDING & DESIGN

| Element | Value |
|---------|-------|
| Domain | zypflow.co.uk / zypflow.com |
| Colour | Blue/purple gradient (#6366f1 → #8b5cf6) + dark background |
| Font | Inter or Geist (system-level, clean, modern SaaS feel) |
| Logo | "Zypflow" wordmark + lightning/flow icon |
| Tone | "We built this tool for agencies like ours" — relatable, direct, no corporate fluff |
| UI style | Modern, clean, SaaS feel. Dark sidebar, light content area. Minimal, functional. |

---

## 13. LANDING PAGE CONTENT

### Hero
**Headline:** "Automate Your Entire Client Pipeline With AI"
**Subline:** "Find leads. Audit their websites. Send personalised outreach. Close deals. All on autopilot."
**CTA primary:** "Audit Any Website Free — See Their Score in 30 Seconds"
**CTA secondary:** "See Our Packages"
**Trust bar:** "AI-Powered" | "Built for UK Agencies" | "GDPR Compliant" | "Results in 14 Days"

### How It Works (4 steps)
1. **Connect** — Set your target industries and locations. Connect your email. Takes 5 minutes.
2. **Discover** — Zypflow finds businesses with poor websites, scores them, and builds a prioritised pipeline.
3. **Engage** — AI writes personalised emails using each lead's actual website issues. Sequences run automatically.
4. **Close** — Replies, call bookings, and proposals managed in one dashboard. Track everything from first touch to signed contract.

### Feature Sections
- **Smart Lead Scraping** — "Stop manually searching Google Maps. Zypflow finds hundreds of qualified leads in minutes."
- **AI Website Auditor** — "Instant speed, SEO, and mobile analysis with AI-written summaries. Use as a sales weapon."
- **Automated Outreach** — "Personalised cold emails that reference each lead's actual website problems. 3x higher reply rates than generic templates."
- **Workflow Builder** — "Build custom automations without code. If-this-then-that logic for your entire business."
- **Client Management** — "From lead to paying client to ongoing project — everything in one place."

### Social Proof
- "Agencies using Zypflow generate 47 qualified leads per week on average"
- "Our users report 3x faster client acquisition vs manual prospecting"

---

## 14. BUSINESS MODEL — THE ZYPFLOW FLYWHEEL

> **CRITICAL STRATEGIC DECISION:** Zypflow does NOT launch as a pure SaaS product. It launches as a **productised automation service** that is powered by proprietary software. The service generates immediate cash flow, validates market demand, and builds the case study library. The SaaS platform is the scale play — built in parallel, launched once the service model proves product-market fit with 20+ paying clients.

### Why Service-First, Not SaaS-First

Analysis of 1,600+ failed startups (via Loot Drop) reveals that 36% died from "No Market Need" and 53% from "Lost Focus." Building a full SaaS platform before having paying customers is the intersection of both failure modes. The service model eliminates this risk: you sell the outcome (leads, clients, revenue) and use software to deliver it efficiently.

The SaaS industry is also shifting. IDC predicts that by 2028, pure seat-based pricing will be obsolete, with 70% of vendors moving to outcome-based and consumption-based models. Zypflow should be built for this reality from day one.

### The Flywheel

```
FREE AUDIT TOOL (zypflow.co.uk/audit)
  │  Public. No signup. Enter URL → get speed/SEO/mobile/SSL scores
  │  Full AI summary requires email → captured as Zypflow lead
  ↓
PRODUCTISED SERVICE PACKAGES (sold to UK agencies)
  │  3 tiers: Operations Detox / Growth Engine / Digital Infrastructure
  │  Setup fee + monthly retainer + optional performance bonus
  │  Delivered using Zypflow's own automation stack
  ↓
CASE STUDIES + PROOF POINTS
  │  Every service client generates measurable ROI data
  │  "47 leads/week" • "3x reply rate" • "£12K MRR within 90 days"
  ↓
SELF-SERVE SAAS PLATFORM (app.zypflow.co.uk)
  │  Launched once 20+ service clients validate the core features
  │  £49–£349/mo subscriptions for agencies who want DIY
  ↓
AGENCY REFERRAL PROGRAMME
  │  Service clients become SaaS advocates
  │  20% recurring commission for 12 months
  │  Network effects + organic growth
```

---

## 15. SERVICE PACKAGES (Revenue Engine)

These three packages are the core revenue model. Each is designed around a principle: **sell the outcome, automate the delivery, measure the proof.**

### Package 1: "Operations Detox" — £2,500 setup + £495/mo

**Target client:** SMEs drowning in manual admin — trades, professional services, hospitality. They're copying data between spreadsheets, chasing invoices manually, missing follow-ups.

**What they get:**
- Week 1: Paid discovery — audit top 10 time-wasting processes (standardised Typeform → Notion)
- Week 2–3: Build 3–5 core automations in Make.com (lead capture → CRM, invoice reminders, appointment confirmations, review requests, internal alerts)
- Week 4: Handover with recorded Loom walkthrough + documentation
- Ongoing: Monthly retainer covers monitoring, break/fix, one new automation per month

**Delivery automation:**
- Discovery form auto-creates Notion project board + Slack channel + CRM record via Make scenario
- 80% of builds use pre-built "automation blueprints" (templatised Make scenarios)
- Monthly report auto-generated: Make pulls execution data → branded PDF → emailed to client
- Break/fix alerts via Make error webhooks → Slack notification → triage

**Margin target:** 70%+ after 10 clients (template reuse)

---

### Package 2: "Growth Engine" — £4,995 setup + £995/mo

**Target client:** Agencies, consultancies, B2B service businesses with a good service but inconsistent pipeline. They need leads on autopilot.

**What they get:**
- Everything in Operations Detox, plus:
- Automated lead pipeline (Apify scraper → PageSpeed audit → AI summary → lead scoring → cold email sequences with personalised merge tags from audit data)
- CRM + pipeline setup with lead scoring based on engagement signals
- Call list dashboard ranked by score, with click-to-call
- Monthly KPI dashboard: leads generated, emails sent, replies, calls booked, deals closed

**Delivery automation:**
- This IS the Zypflow pipeline running as a done-for-you service
- Lead scraping runs on cron schedule — zero human touch
- Email personalisation uses audit data merge tags — no per-lead copywriting
- KPI dashboard auto-updates via Make → data source → branded report
- Webhook handler auto-pauses sequences on reply, updates lead status

**Margin target:** 60% initially → 75% as industry-specific templates mature

**Critical insight:** Every Growth Engine client is a beta tester for the eventual SaaS platform. Their usage data validates which features matter and which don't.

---

### Package 3: "Digital Infrastructure" — £7,500–£15,000 project + £1,495/mo

**Target client:** Established SMEs (£1M–£10M turnover) who've outgrown their cobbled-together stack. 8–15 disconnected tools, data in silos, paying three people to do work one system should handle.

**What they get:**
- Full systems audit — map every tool, data flow, manual handoff (sales, ops, finance, delivery)
- Architecture blueprint — documented "digital operating system"
- Build-out: 10–20 integrated automations connecting CRM, accounting, project management, email, payments
- Team training: recorded SOPs, live walkthroughs, knowledge base
- Ongoing: monitoring, iteration, new automations, quarterly strategic review

**Delivery automation:**
- Systems audit uses standardised questionnaire + AI analysis → architecture blueprint (semi-automated)
- Every automation documented in a runbook (auto-generated template)
- Quarterly reviews driven by automated reporting flagging underperforming workflows
- Client portal shows system health, automation run counts, error rates

**Margin target:** 55% on project, 80% on retainer

---

### Revenue Projections (Conservative)

| Timeline | Pkg 1 Clients | Pkg 2 Clients | Pkg 3 Clients | Monthly Retainer | + Avg Project Fees | Total Monthly |
|----------|---------------|---------------|---------------|------------------|--------------------|---------------|
| Month 3 | 4 | 1 | 0 | £2,975 | ~£2,500 | ~£5,475 |
| Month 6 | 8 | 4 | 2 | £10,950 | ~£4,000 | ~£14,950 |
| Month 12 | 12 | 8 | 4 | £19,900 | ~£5,000 | ~£24,900 |
| Month 18 | 15 | 12 | 6 | £28,345 | ~£3,000 | ~£31,345 |

**Year 1 total (conservative): ~£180K–£240K**
**Year 2 with SaaS layer: £350K–£500K** (service clients + self-serve subscribers)

---

## 16. FAILURE-PROOFING FRAMEWORK (From Loot Drop Analysis)

Analysis of 1,600+ failed startups and $500B+ in burned capital reveals 7 antipatterns. Here's how Zypflow is designed to survive each one.

### Antipattern 1: No Market Need (36% of failures)

**Risk:** Building features nobody asked for. Assuming other agencies need what you needed.

**Prevention:**
- Do NOT build features speculatively. Build only what service clients request and pay for.
- Conduct 15–20 discovery calls with UK agencies before adding any feature to the SaaS roadmap.
- The free audit tool is the demand validator — if agencies use it, the need is real. If they don't, pivot the positioning before building more.
- Every feature must pass the "would 3+ paying clients use this?" test.

### Antipattern 2: Competition (83% of failures)

**Risk:** GoHighLevel ($97–$497/mo, 20,000+ agencies), Make.com (1,800+ integrations), HubSpot (enterprise brand trust), Clay/Apollo/Instantly (specific pipeline tools).

**Prevention:**
- DO NOT compete on features. You will never out-feature GoHighLevel.
- Compete on specificity: "AI-powered client acquisition for UK web design agencies" — not "workflow automation platform."
- The website audit tool is the wedge. GoHighLevel doesn't audit websites. Make.com doesn't audit websites. That's the moat.
- Position against GoHighLevel on price AND simplicity: "Everything GoHighLevel does for client acquisition, at 1/3 the price, without the 6-week learning curve."

### Antipattern 3: Unit Economics (63% of failures)

**Risk:** API costs (Apify, Claude, PageSpeed, Resend, Instantly) eating margins at scale.

**Prevention:**
- Model cost per user per plan BEFORE launch:
  - Starter (200 leads): ~£8–12/mo in API costs → £49 price = viable
  - Growth (1,000 leads): ~£25–40/mo in API costs → £149 price = viable
  - Agency (unlimited): cap at ~£80/mo via rate limiting → £349 price = viable
- Kill the Free plan. Offer 14-day free trial instead. Free plans attract users who never convert.
- Credit metering enforced server-side. Never trust client-side checks.
- Cache PageSpeed results for 7 days. Don't re-audit the same URL twice in a week.

### Antipattern 4: Lost Focus (53% of failures)

**Risk:** The current feature list has 15+ major features across 5 build phases. That's 10 weeks to build what GoHighLevel took 6 years to build.

**Prevention — THE BRUTAL CUT:**
- V1 SaaS launches with exactly THREE features: (1) Website audit tool, (2) Lead scraper + scoring, (3) Automated outreach with audit-based personalisation.
- Everything else (chatbot builder, workflow builder, review automation, white-label, content generator) is POST-LAUNCH and built ONLY when paying users request it.
- The service packages cover the feature gap — you deliver the full suite manually/semi-automated for service clients while the SaaS catches up.
- Set a rule: no new feature development until the previous feature has 10+ active users.

### Antipattern 5: Marketing / Distribution (51% of failures)

**Risk:** Building for months then launching into silence.

**Prevention:**
- Build audience alongside product. Weekly posts on Twitter/X and LinkedIn showing what you're building.
- The free audit tool goes live within 2 weeks — even if nothing else exists. Every audit captures an email.
- Dogfood aggressively: use Zypflow's own pipeline to sell Zypflow. Scrape UK web agencies, audit their websites, send personalised outreach about their website problems, pitch the service.
- Content strategy starts on day 1, not day 90.

### Antipattern 6: Ran Out of Cash (45% of failures)

**Risk:** Bootstrapped = personal savings as runway. No VC safety net.

**Prevention:**
- Service revenue funds SaaS development. The agency packages generate cash flow from month 1.
- Keep fixed costs near zero: Supabase free tier, Vercel hobby, Claude pay-as-you-go.
- Set a hard kill switch: if no paying clients within 90 days, stop building and spend 100% on sales.
- Track runway weekly. Know exactly how many months of operating costs you have left at all times.

### Antipattern 7: Team / Founder Issues (32% of failures)

**Risk:** Solo founder doing everything = burnout within 6 months.

**Prevention:**
- Identify the one skill you're weakest at (likely sales/outreach) and cover it — even a part-time contractor.
- Automate YOUR OWN operations first. If you're manually onboarding clients, manually generating reports, manually chasing invoices — you'll never scale.
- Use the 80/20 rule: spend 80% of time on the two activities that generate revenue (selling + delivering), 20% on building.

---

## 17. THE 90-DAY LAUNCH PLAN

This replaces the old 10-week phased build. It's designed around the principle: **revenue before features.**

### Days 1–14: THE AUDIT WEAPON

**Goal:** Get the free audit tool live on zypflow.co.uk and start capturing emails.

- [ ] Build landing page (hero, "How it works", pricing preview, email capture)
- [ ] Build public audit tool at /audit (URL input → PageSpeed API → scores + basic AI summary)
- [ ] Gate full AI summary behind email capture ("Enter your email for the full report")
- [ ] Deploy to Vercel. Share on LinkedIn, Twitter/X, Reddit.
- [ ] Start posting "building in public" content 3x/week

**Automation to build:**
- Audit submission → Supabase insert → Make scenario → sends branded PDF report to email → adds to lead table
- New lead alert → Slack notification

**Success metric:** 50+ audit submissions, 30+ emails captured

### Days 15–30: THE FIRST SERVICE CLIENTS

**Goal:** Sign 2–3 paying clients for the Operations Detox package.

- [ ] Build the service sales page on zypflow.co.uk/services
- [ ] Create the standardised discovery Typeform
- [ ] Build 10 "automation blueprint" templates in Make.com (the most common SME workflows)
- [ ] Reach out to 50 UK SMEs via cold email (using your own audit data as the hook)
- [ ] Reach out to your existing network — LinkedIn DMs, personal contacts
- [ ] Offer first 3 clients 20% discount in exchange for testimonial + case study rights

**Automation to build:**
- Discovery Typeform submission → Make scenario → creates Notion project → Slack notification → sends welcome email via Resend
- Client onboarding sequence: automated emails at day 0, 3, 7 with next steps
- Billing: Stripe subscription link auto-generated per client

**Success metric:** 2–3 signed clients, £5K+ in committed project fees

### Days 31–60: THE GROWTH ENGINE PROOF

**Goal:** Deliver results for first clients. Start selling the Growth Engine package.

- [ ] Build and run the full lead pipeline for one client (scrape → audit → score → outreach)
- [ ] Measure everything: leads found, emails sent, opens, replies, calls booked
- [ ] Package the results into a case study
- [ ] Start selling Growth Engine to UK agencies using the case study as proof
- [ ] Begin building the SaaS dashboard (lead table, audit tool, basic pipeline view)

**Automation to build:**
- Full scraper → audit → scoring → outreach pipeline running on scheduled Make scenarios
- Automated weekly KPI report per client (Make → Google Sheets → email)
- Client-facing dashboard showing their pipeline metrics (basic — can be a Notion/Google Data Studio embed initially)

**Success metric:** 5+ total clients, £8K+/mo in committed retainers, 1 publishable case study

### Days 61–90: COMPOUND AND SCALE

**Goal:** Hit £10K MRR. Begin SaaS beta invites.

- [ ] Sell 2+ Digital Infrastructure packages via referrals and case study marketing
- [ ] Refine the SaaS dashboard based on what service clients actually use
- [ ] Invite 5 service clients to beta-test the self-serve SaaS platform
- [ ] Launch content engine: 2 blog posts/month, 1 YouTube video, daily LinkedIn
- [ ] Hire part-time VA or junior to handle client onboarding admin

**Automation to build:**
- Self-serve SaaS: users can sign up, connect email, configure scraper, run audits, launch sequences
- Usage metering and Stripe billing integration
- Onboarding wizard for new SaaS users (guided setup)

**Success metric:** £10K+ MRR, 8+ clients, 5+ SaaS beta users, product-market fit signals (retention, feature requests, willingness to pay)

---

## 18. 24/7 AUTOMATED OPERATIONS (The "Lights Off" Architecture)

The goal is that Zypflow runs 24/7 with minimal human intervention. Here's what runs automatically and what still needs a human.

### Fully Automated (No Human Touch)

| System | How It Works | Trigger |
|--------|-------------|---------|
| Lead scraping | Apify Google Maps actor runs per-org config | pg_cron schedule (daily/weekly) |
| Lead scoring | Edge function calculates 0–130 score | DB trigger on lead insert/update |
| Website auditing | PageSpeed API + Claude AI summary | Scheduled batch (every 15 min for new leads) |
| Email personalisation | Merge tags auto-populated from audit data | On push to email platform |
| Email sending | Instantly.ai handles warmup, rotation, delivery | Campaign schedule |
| Open/reply tracking | Webhook handler updates outreach + leads tables | On email event |
| Sequence pausing | Auto-pause nurture on reply | Webhook trigger |
| Health monitoring | Check uptime for site, API, database every 30 min | Cron schedule |
| Daily KPI report | Calculate metrics, format, email to org owner | Daily 8am cron |
| DNS/SSL monitoring | Check client domains for propagation | Every 4 hours |
| Usage metering | Calculate credit consumption per org | Daily midnight |
| Error alerting | Make scenario errors → Slack/email alert | On error webhook |
| Client report generation | Make pulls data → branded PDF → email | Monthly schedule |

### Semi-Automated (Human Reviews Output)

| System | What's Automated | What Needs a Human |
|--------|-----------------|-------------------|
| New inquiry handling | Auto-audit, auto-score, auto-notify sales team | Human reviews and decides whether to call |
| Proposal generation | AI drafts proposal from audit data + templates | Human reviews and sends |
| Client onboarding | Forms, project board, welcome emails auto-created | Human does kickoff call |
| Content generation | AI drafts blog posts, email copy, social posts | Human edits and approves |

### Manual (Human Required)

| Activity | Why It Can't Be Automated |
|----------|--------------------------|
| Sales calls | Relationship building, trust, nuance |
| Strategy sessions | Creative problem-solving |
| Complex automation builds | Custom logic per client |
| Quarterly business reviews | Strategic advisory |

### The 24/7 Promise

The system works while you sleep because:
1. Lead scraping runs on cron — no human starts it
2. Auditing runs in batches — no human reviews each URL
3. Emails send on schedule — no human writes or sends them
4. Replies pause sequences automatically — no human monitors inbox
5. Hot lead alerts fire in real-time — you wake up to "3 leads replied, call them"
6. Health checks catch failures before clients notice
7. Reports generate and send without any human action

The only thing that requires your daily attention is: **checking Slack for hot lead alerts and making calls.** Everything else is running.

---

## 19. WHAT TO BUILD vs WHAT TO BUY vs WHAT TO SKIP

| Capability | Build / Buy / Skip | Why |
|------------|-------------------|-----|
| Website audit tool | **BUILD** (core differentiator) | This is the moat. Nobody else does AI audit + outreach natively. Own it completely. |
| Lead scraper | **BUY** (Apify actor) | Don't build your own scraper. Apify is battle-tested. Wrap it in an edge function. |
| Lead scoring | **BUILD** (simple algorithm) | 50 lines of code. Run as a DB trigger. No reason to outsource this. |
| Cold email sending | **BUY** (Instantly.ai) | Don't build email infrastructure. Warmup, rotation, deliverability is a full company. Use Instantly. |
| Email personalisation | **BUILD** (merge tag engine) | Simple template system that pulls from audit data. Build once, reuse forever. |
| CRM / Pipeline | **BUILD** (basic version) | A leads table with status columns and filters. Don't over-engineer this. |
| Workflow builder | **SKIP** (for now) | This is a 6-month project. Use Make.com for service clients. Build your own only after 50+ SaaS users request it. |
| Chatbot builder | **SKIP** (for now) | Nice-to-have, not need-to-have. Add when agencies specifically ask for it. |
| Review automation | **SKIP** (for now) | Commoditised feature. Not a differentiator. Add later. |
| White-label | **SKIP** (for now) | Only matters at Agency tier with 10+ clients on that plan. Premature. |
| Content generator | **SKIP** (for now) | Every agency already has ChatGPT. This isn't a buying reason. |
| Client portal | **BUILD** (basic version) | Simple token-auth page showing project status and scores. One page, not a full portal system. |
| Stripe billing | **BUY** (Stripe Billing) | Never build your own billing. Stripe handles subscriptions, invoicing, tax, portal. |
| Analytics | **BUY** (PostHog free tier) | Product analytics. Don't build your own event tracking. |

---

## 20. METRICS THAT MATTER (The Anti-Vanity Dashboard)

Track these. Ignore everything else until they're healthy.

### North Star Metric
**Pipeline-to-Close Conversion Rate** — percentage of leads that become paying clients. If this is zero, nothing else matters.

### Leading Indicators (Weekly)
| Metric | Target | Why It Matters |
|--------|--------|---------------|
| Audit tool submissions | 50+/week | Top-of-funnel demand signal |
| Emails captured from audits | 30+/week | Conversion of traffic to leads |
| Outreach emails sent | 500+/week | Pipeline velocity |
| Reply rate | 3–5% | Message-market fit |
| Sales calls booked | 3+/week | Bottom-of-funnel |

### Lagging Indicators (Monthly)
| Metric | Target | Why It Matters |
|--------|--------|---------------|
| New clients signed | 2+/month | Revenue growth |
| Monthly Recurring Revenue | Growing 20%+ MoM | Business health |
| Client churn rate | <5%/month | Service quality |
| Net Revenue Retention | >110% | Clients buying more over time |
| Gross margin | >65% | Unit economics viability |
| Automation success rate | >98% | System reliability |

### Kill Switch Triggers
If ANY of these are true after 90 days, stop building and pivot:
- Zero paying clients despite active outreach
- Reply rate below 1% after 2,000+ emails
- Every discovery call ends with "we already use GoHighLevel/HubSpot" (wrong market)
- Audit tool gets <10 submissions/week (no demand for the core wedge)
- Cost-per-acquired-client exceeds £2,000 (CAC too high for the price point)

---

## 21. THE 12 SURVIVAL RULES

Distilled from 1,600+ startup autopsies and the competitive analysis of GoHighLevel, Make.com, HubSpot, and the UK SME market.

1. **Validate before you build.** Talk to 20 agencies. Confirm they'd pay. Stop coding until you have this data.
2. **Cut features ruthlessly.** Launch SaaS with audit tool + lead scraper + automated outreach. Nothing else.
3. **Own the audit wedge.** The free website audit is your moat. Make it the best free audit tool in the UK.
4. **Go vertical, not horizontal.** "For UK web design agencies" — not "for businesses."
5. **Model unit economics now.** Know your cost per user per plan before you set prices.
6. **Kill the free plan.** 14-day trial instead. Qualify buyers, not browsers.
7. **Build audience alongside product.** Build in public. Weekly posts. Ship the audit tool first.
8. **Sell services to fund the product.** The three packages generate cash flow while the SaaS matures.
9. **Price on outcomes, not seats.** Charge per lead, per audit, per reply — not per user. Future-proof.
10. **Dogfood aggressively.** Use Zypflow to sell Zypflow. If it can't generate leads for itself, why would anyone pay?
11. **Set a kill switch.** No paying users within 90 days → pivot the model. Don't keep building hoping.
12. **Track one metric.** Pipeline-to-close conversion rate. If it's zero, nothing else matters.

---

## 22. GO-TO-MARKET STRATEGY

### Launch Sequence
1. **Week 1–2:** Landing page + free audit tool live at zypflow.co.uk
2. **Week 3–4:** Cold outreach to 100 UK web agencies using Zypflow's own audit data (dogfooding)
3. **Month 2:** First case study published. Start LinkedIn/Twitter content engine.
4. **Month 3:** Product Hunt launch for the SaaS platform. Reddit (r/webdev, r/entrepreneur, r/SaaS, r/marketing).
5. **Month 4:** YouTube walkthrough videos. SEO blog content targeting "how to get web design clients."
6. **Month 5:** Affiliate/referral programme launch (20% recurring for 12 months).
7. **Month 6:** Invite service clients to self-serve SaaS. Begin scaling paid acquisition if unit economics are healthy.

### Content Strategy (Automated)
- Blog: AI-assisted drafts → human edit → publish via CMS → auto-share to social via Make scenario
- LinkedIn: Daily posts scheduled via Buffer/Typefully, built from a monthly content calendar
- YouTube: Monthly video. Repurpose into 10+ short clips for social via Opus Clip or similar
- Email newsletter: Weekly to audit tool email list. Auto-generated KPI highlights + tips

### Partnerships
- Framer/Webflow community (target agencies using these tools — they're your ideal customer)
- Make.com partner directory (list Zypflow as a Make implementation agency)
- WordPress agency networks (largest UK market segment)
- Freelancer communities (DesignJoy model — show how productised services + automation = scale)

---

## 23. CODING CONVENTIONS

When building features for Zypflow, follow these patterns:

### File Structure (Next.js App Router)
```
src/
  app/
    (marketing)/          → Public pages (landing, pricing, blog)
    (auth)/               → Login, signup, forgot password
    (dashboard)/          → Authenticated app pages
      dashboard/
      leads/
      audit/
      outreach/
      clients/
      ...
  components/
    ui/                   → Reusable UI components (Button, Card, Modal, etc.)
    dashboard/            → Dashboard-specific components
    leads/                → Lead-specific components
    ...
  lib/
    supabase/
      client.ts           → Browser Supabase client
      server.ts           → Server Supabase client
      admin.ts            → Service role client (edge functions only)
    stripe.ts             → Stripe helpers
    utils.ts              → General utilities
  hooks/                  → Custom React hooks
  types/                  → TypeScript type definitions
```

### Supabase Query Pattern
```typescript
// Always filter by org_id (RLS handles this, but be explicit in queries)
const { data, error } = await supabase
  .from('leads')
  .select('*')
  .eq('org_id', orgId)
  .order('lead_score', { ascending: false });
```

### Error Handling Pattern
```typescript
// Always handle errors gracefully — never let Supabase errors reach the UI raw
try {
  const { data, error } = await supabase.from('leads').select('*');
  if (error) throw error;
  return data;
} catch (err) {
  console.error('Failed to fetch leads:', err);
  // Show user-friendly toast, not raw error
  toast.error('Something went wrong. Please try again.');
  return [];
}
```

### Component Pattern
```typescript
// Use server components by default, client components only when needed
// Server component (default — no 'use client' directive)
export default async function LeadsPage() {
  const supabase = createServerClient();
  const { data: leads } = await supabase.from('leads').select('*');
  return <LeadsTable leads={leads} />;
}

// Client component (only for interactivity)
'use client';
export function LeadsTable({ leads }: { leads: Lead[] }) {
  const [search, setSearch] = useState('');
  // ...
}
```

---

## 24. CRITICAL RULES

1. **Never hardcode API keys or secrets.** Use environment variables for everything.
2. **Every table must have `org_id` and RLS.** No exceptions. Multi-tenancy is the foundation.
3. **Never trust client-side data.** Validate and sanitise on the server/edge function.
4. **Always handle errors.** No unhandled promise rejections. No raw error messages shown to users.
5. **Mobile-first responsive design.** Test every page at 375px width.
6. **Accessibility matters.** Semantic HTML, ARIA labels, keyboard navigation.
7. **No Solis references anywhere.** Zypflow is its own product. Separate Supabase project, separate Stripe account, separate domain, separate brand.
8. **Credit metering is enforced server-side.** Never rely on the client to check usage limits.
9. **Log everything to activity_log.** Every significant action (audit run, email sent, lead created, settings changed) gets logged.
10. **Ship incremental.** Don't build Phase 4 features before Phase 1 is solid. Each phase should be usable on its own.

---

*Last updated: March 2026. This document is the single source of truth for all Zypflow development, strategy, and operations. Sections 14–22 contain the business strategy and failure-proofing framework derived from Loot Drop's analysis of 1,600+ failed startups.*
