# ZYPFLOW COMPLETE STATUS — Cross-Referenced Against Zypflow-FINAL.docx

## SECTION 1 — COSTS
Nothing to build. Reference document only.

## SECTION 2 — DOWNLOADS & INSTALLS
- [x] Node.js, Git, VS Code — Alex's machine (assumed done)
- [ ] **Aala's machine** — Chrome + Grammarly, Apollo.io extension, Loom, Notion, Canva
- [ ] **Both** — Bitwarden (save EVERY password here), Slack desktop + mobile

## SECTION 3 — ALL ACCOUNTS

### Day 1 Accounts
- [x] 3.1 Domains — have zypflow.co.uk + zypflow.uk
- [x] 3.2 Cloudflare DNS — done
- [ ] 3.3 **Google Workspace** — need: alex@zypflow.co.uk, aala@zypflow.co.uk, hello@zypflow.co.uk (shared inbox). Also create alex@zypflow.uk, aala@zypflow.uk, hello@zypflow.uk for cold outreach
- [ ] 3.4 **Slack** — create workspace: Zypflow. Channels: #general #development #marketing #bugs #customers #ideas
- [x] 3.5 GitHub — repo exists (Alex14427/zypflow)
- [ ] 3.6 **Notion** — create workspace. Pages: Product Roadmap, Sprint Board, Customer List, Knowledge Base, Content Calendar

### Week 1 API Accounts
- [x] 3.7 Supabase — project exists (pzsgdqbpaogxcrsjjysf). **BUT regenerate anon key** (old one was exposed)
- [ ] 3.8 **OpenAI** — create account, API key, set £50 hard spending limit
- [ ] 3.9 **Twilio** — create account, buy UK number (~£1/mo), copy Account SID + Auth Token + Phone Number
- [ ] 3.10 **Stripe** — create account with Zypflow Ltd details. Create 3 products: Starter £149/mo, Growth £299/mo, Scale £499/mo. Copy each Price ID. Enable Customer Portal. Enable Stripe Tax. Copy Publishable + Secret keys
- [ ] 3.11 **Resend** — create account with alex@zypflow.co.uk. Add domain zypflow.co.uk → add 3 DNS records in Cloudflare → verify. Create API key
- [x] 3.12 Make.com — account created
- [ ] 3.13 **Cal.com** — create account, connect Google Calendar, create 30-min "Consultation" event type, create API key
- [ ] 3.14 **Upstash** — create account, Create Database, Region: EU-West-1 (Ireland), Name: zypflow-ratelimit. Copy REST URL + REST Token
- [ ] 3.15 **PostHog** — sign up, create project: zypflow, copy Project API Key
- [ ] 3.16 **Sentry** — sign up, create Next.js project

### Week 2-3 Legal & Finance
- [ ] 3.17 **Companies House** — Register Zypflow Ltd (£12)
- [ ] 3.18 **Business Bank** — Tide or Starling (free, instant)
- [ ] 3.19 **Xero** — Starter plan £15/mo, connect bank
- [ ] 3.20 **Legal docs** — Termly.io Privacy Policy + Terms of Service + DPA from gdpr.eu
- [ ] **Professional Indemnity Insurance** — Hiscox or SimplyBusiness (~£200/yr)
- [ ] **Founders Agreement** — solicitor £300-500 (50/50 equity, 4yr vesting, 1yr cliff)

### Additional Accounts (new additions beyond docx)
- [ ] **Apify** — sign up, get API token (for automated lead scraping)
- [ ] **Instantly.ai** — sign up (for cold email outreach)
- [ ] **Anthropic Claude API** — sign up, get API key (backup AI engine)
- [ ] **Vapi.ai** — sign up (AI voice answering — the killer feature)

---

## WHAT'S BUILT vs NOT BUILT

### DONE (Session 1)
- [x] Landing page (index.html) — SEO, analytics, trust badges, calculator with industry presets
- [x] All CTAs → Calendly (calendly.com/alex-zypflow/30min)
- [x] Pricing — £149/£299/£499 tiers
- [x] Lead capture form → Supabase
- [x] Google Analytics G-EHDT9J6054 with event tracking
- [x] Tawk.to live chat widget
- [x] Cookie consent banner (PECR/GDPR)
- [x] JSON-LD structured data (SoftwareApplication + FAQPage)
- [x] sitemap.xml + robots.txt
- [x] .gitignore (protects .env.local, node_modules, etc.)
- [x] Supabase tables: `leads`, `inquiries` (with RLS + anon insert policies)
- [x] keys.txt removed from repo

### SECTION 4 — PROJECT SETUP & DATABASE (Claude builds next session)
- [ ] 4.1 Next.js project (`npx create-next-app@latest` + all deps)
- [ ] 4.2 .env.local with ALL variables from docx
- [ ] 4.3 Full Supabase schema — `businesses`, `leads` (full version with business_id), `conversations`, `appointments`, `reviews`, `follow_ups` + all indexes + all RLS policies
- [ ] 4.4 Supabase client (browser + admin)
- [ ] 4.5 Rate limiter (Upstash)
- [ ] 4.6 Input validators (Zod)
- [ ] 4.7 Email utility (Resend) + welcome email template
- [ ] 4.8 Lead scorer

### SECTION 5 — AI CONVERSATION ENGINE (Claude builds)
- [ ] 5.1 Chat API route (`/api/chat`) — GPT-4o + Claude fallback, lead extraction, conversation logging, Make.com webhook fire, CORS headers

### SECTION 6 — SMS ROUTES (Claude builds)
- [ ] 6.1 Send SMS (`/api/sms/send`)
- [ ] 6.2 Receive SMS (`/api/sms/incoming`) — with STOP opt-out handling
- [ ] **Post-deploy**: Set Twilio incoming webhook to `https://app.zypflow.com/api/sms/incoming`

### SECTION 7 — CHAT WIDGET (Claude builds)
- [ ] 7.1 Embed script (`public/v1.js`) — bubble + iframe widget
- [ ] Widget page (`/widget/[businessId]`) — the actual chat UI inside the iframe

### SECTION 8 — BOOKING & STRIPE (Claude builds)
- [ ] 8.1 Cal.com booking webhook (`/api/booking/created`)
- [ ] 8.2 Stripe checkout (`/api/stripe/checkout`) — 3 plans
- [ ] 8.3 Stripe webhook (`/api/stripe/webhook`) — checkout.session.completed, subscription.updated, subscription.deleted + welcome email
- [ ] **Post-deploy**: Add Stripe webhook endpoint in dashboard
- [ ] **Post-deploy**: Set Cal.com webhook URL

### SECTION 9 — AUTH & ANALYTICS (Claude builds)
- [ ] 9.1 Auth middleware (`src/middleware.ts`) — protect /dashboard routes
- [ ] 9.2 PostHog provider (`src/app/providers.tsx`)
- [ ] Login + signup pages with Supabase Auth

### SECTION 10 — MAKE.COM AUTOMATIONS (Alex + Aala build in Make.com UI)
- [ ] 10.1 **New Lead Notification** — webhook → Supabase lookup → Resend email to business owner
- [ ] 10.2 **Appointment Reminders** — scheduled hourly → 48h/24h/2h SMS via Twilio → mark sent in Supabase
- [ ] 10.3 **Review Request** — webhook on appointment complete → 2hr delay → SMS with Google review link (only if satisfaction ≥ 4)
- [ ] 10.4 **Follow-Up Sequence** — scheduled hourly → Day 0 SMS, Day 2 email, Day 5 final SMS for unconverted leads
- [ ] **New Onboarding Complete** — watch businesses table → Slack notification to #customers

### SECTION 11 — TESTING & DEPLOYMENT
- [ ] 11.1 Local dev (`npm run dev`)
- [ ] 11.2 Test Twilio locally (ngrok)
- [ ] 11.3 Test Stripe locally (`stripe listen --forward-to`)
- [ ] 11.5 **Production deploy** — Vercel import → env vars → custom domain (`app.zypflow.com` CNAME → `cname.vercel-dns.com`)
- [ ] 11.6 **Pre-launch checklist** (ALL must pass):
  - [ ] Widget chat → lead appears in Supabase
  - [ ] Make.com lead notification email arrives
  - [ ] Twilio SMS arrives on phone
  - [ ] SMS reply appears in conversations
  - [ ] Stripe test card → subscription → plan updates in DB
  - [ ] Cal.com booking → row in appointments table
  - [ ] Review flow → SMS 2 hours after completion
  - [ ] Sentry test error → appears in dashboard
  - [ ] PostHog page view → appears in dashboard

### SECTION 12 — BETA & OUTREACH

#### 12.1 Cold Email (Alex/Aala — manual setup + Apify automation)
- [ ] **Buy outreach domain** or use zypflow.uk (NEVER cold email from zypflow.co.uk)
- [ ] **Create 3 mailboxes on zypflow.uk**: alex@, aala@, hello@
- [ ] **Sign up Instantly.ai** → connect 3 mailboxes → enable warmup (14-21 days)
- [ ] **Add DNS records for zypflow.uk** — SPF, DKIM, DMARC (Instantly.ai walks you through)
- [ ] **Apify setup** — sign up, get API token
- [ ] **Apify Google Maps scraper** — run for each industry + city
- [ ] **Apify Apollo scraper** — enrich with owner email + name
- [ ] **Build prospect list** — 200-300 contacts per industry
- [ ] **Create Instantly.ai campaigns** — 1 per industry with 3-email sequence from docx
- [ ] **Sending rules**: 25/day per mailbox, Mon-Thu only, stop after 3 no-replies

#### 12.2 LinkedIn Outreach (Aala — manual)
- [ ] 20-30 connection requests/day with personalised note
- [ ] Follow up 1-2 days after accept with message from docx
- [ ] If interested → send Loom demo + signup link

#### 12.3 Customer Onboarding Wizard (Claude builds)
- [ ] 7-screen form at `/onboarding`:
  - Screen 1: Business basics (name, website, phone, industry)
  - Screen 2: Services (repeatable: name, price, duration)
  - Screen 3: FAQs/Knowledge base (repeatable: question, answer)
  - Screen 4: Booking link + Google review link
  - Screen 5: AI personality dropdown + extra notes
  - Screen 6: Widget embed code + copy button + Loom video
  - Screen 7: Success + "Go to Dashboard" + "Book setup call"

### SECTION 13 — PUBLIC LAUNCH (Days 61-90)
- [ ] Switch Stripe to Live mode
- [ ] Send launch email via Resend to network + waitlist
- [ ] LinkedIn posts (both profiles)
- [ ] Start cold email via Instantly.ai (25/day)
- [ ] LinkedIn outreach (20-30/day)
- [ ] Google Ads campaign targeting: 'AI receptionist for dentist', etc.
- [ ] Product Hunt submission (schedule for Tuesday)
- [ ] Content: 2 blog posts/week, weekly newsletter, monthly YouTube

### SECTION 14 — AI SYSTEM PROMPTS (Claude builds + Aala tests)
- [ ] Dental practice prompt
- [ ] Aesthetic clinic prompt
- [ ] Legal firm prompt
- [ ] Home services prompt
- [ ] Physiotherapy prompt (to be written)

### SECTION 15 — DAILY RHYTHM
Reference only — no build needed.

---

## AUTOMATED CLIENT ACQUISITION PIPELINE (new — beyond docx)

```
WEEKLY SCRAPING (automated)
  Apify Google Maps → "dental practices Manchester" etc.
  Apify Apollo → enriches with owner name + email
        ↓
  Stored in Supabase `prospects` table (deduplicated)
        ↓
  Auto-pushed to Instantly.ai campaigns via API
        ↓
OUTREACH (automated via Instantly.ai)
  3-email sequence over 7 days
  75 emails/day (25 per mailbox × 3 mailboxes)
  Mon-Thu only
        ↓
REPLY HANDLING (automated via Make.com)
  Instantly.ai webhook → Make.com → Supabase lead
  → Slack + SMS notification to Alex
  → Auto-reply with Cal.com booking link
        ↓
CONVERSION (semi-manual)
  Prospect books demo on Cal.com
  Alex does 10-min demo
  Sends Stripe checkout link
  Customer pays → onboarding wizard → AI goes live
```

---

## WHAT ALEX MUST DO BEFORE NEXT SESSION

### Priority 1 — Keys (do this first, 30 min)
1. **Regenerate Supabase anon key** — Settings → API → regenerate (old one was public)
2. **Create OpenAI account** → API key → set £50 hard limit
3. **Create Twilio account** → buy UK number → copy SID, Auth Token, Phone Number
4. **Create Stripe account** → 3 products (Starter £149, Growth £299, Scale £499) → copy Price IDs + API keys
5. **Create Resend account** → add zypflow.co.uk domain → verify → copy API key
6. **Create Cal.com account** → connect Google Calendar → copy API key
7. **Create Upstash account** → create Redis DB (EU-West-1) → copy REST URL + Token
8. **Create PostHog account** → create project → copy API key
9. **Create Sentry account** → create Next.js project
10. **Create Apify account** → copy API token
11. **Create Anthropic account** → copy API key (for Claude as backup AI)

### Priority 2 — Email Warmup (do this NOW, 15 min)
1. **Create 3 mailboxes on zypflow.uk**: alex@zypflow.uk, aala@zypflow.uk, hello@zypflow.uk
2. **Sign up Instantly.ai**
3. **Connect all 3 mailboxes** to Instantly.ai
4. **Add SPF/DKIM/DMARC DNS records** for zypflow.uk (Instantly.ai tells you exactly what)
5. **Enable warmup** on all 3 — takes 14-21 days, must start NOW

### Priority 3 — Merge PR on GitHub
1. Go to github.com/Alex14427/zypflow → merge the open PR

### Priority 4 — Apify Test Run (10 min)
1. Go to apify.com → find `apify/google-maps-scraper`
2. Run a test: search "dental practices London", max results 50
3. Export as CSV — this is your first prospect list

---

## STARTING NEXT SESSION

Paste this in the chat:

> Read CLAUDE.md, HANDOFF-PROMPT.md, and Zypflow-FINAL.docx. Build everything that's not checked off in HANDOFF-CHECKLIST.md. My API keys are: [paste all keys]. Don't ask questions — the docx has every detail. Commit and push when done.
