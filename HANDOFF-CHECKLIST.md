# ZYPFLOW BUILD STATUS — Honest Checklist

## DONE (This Session)
- [x] **Landing page rebuilt** — SEO, trust badges, simplified copy, industry calculator presets
- [x] **All CTAs → Calendly** (calendly.com/alex-zypflow/30min)
- [x] **Pricing updated** — £149/£299/£499 research-backed tiers
- [x] **Supabase `leads` + `inquiries` tables** — created with RLS, anonymous inserts enabled
- [x] **Lead capture form** — wired to Supabase on the landing page
- [x] **Google Analytics** — G-EHDT9J6054 with event tracking on all CTAs + calculator
- [x] **Tawk.to live chat** — widget embedded
- [x] **Cookie consent banner** — PECR/GDPR compliant
- [x] **SEO** — Open Graph, Twitter cards, JSON-LD structured data (SoftwareApplication + FAQPage)
- [x] **sitemap.xml + robots.txt** — created
- [x] **Git pushed** to `claude/integrate-solisdigital-zypflow-n6BrI`

---

## NOT DONE — Requires Manual Action (You + Aala)

### Deploy (5 minutes)
- [ ] **Vercel deploy** — Go to vercel.com/new → Import `Alex14427/zypflow` → Deploy
- [ ] **Custom domain** — In Vercel project settings → Domains → Add `zypflow.co.uk`

### Email Warmup (Section 12 — CRITICAL before cold outreach)
- [ ] **Create outreach@zypflow.com** in Google Workspace
- [ ] **Sign up for Instantly.ai** (free tier, 50 emails/day)
- [ ] **Connect outreach email** to Instantly.ai (NOT your main @zypflow.com)
- [ ] **Start warmup** — Instantly.ai has built-in warmup. Enable it. Run for 14 days minimum before sending any cold emails
- [ ] **Do NOT send cold emails from alex@ or hello@** — this will kill your domain reputation

### Accounts Still Needed (Section 3)
- [ ] **Twilio** — sign up, buy UK number (~£1/mo), get Account SID + Auth Token
- [ ] **Stripe** — create account, create 3 price IDs (Starter/Growth/Scale), enable Stripe Tax
- [ ] **Resend** — sign up, add zypflow.com domain, add 3 DNS records in Cloudflare, verify
- [ ] **Make.com** — sign up, will be used for all automations
- [ ] **Cal.com** — sign up, connect Google Calendar, create booking types
- [ ] **Upstash** — sign up, create Redis database (rate limiting)
- [ ] **PostHog** — sign up, create project, get API key
- [ ] **Sentry** — sign up, create Next.js project
- [ ] **Apollo.io** — Chrome extension for finding business emails
- [ ] **Instantly.ai** — cold email outreach tool

### Full Next.js App (Section 4-9 — Needs Next Session)
- [ ] **Next.js project setup** — `npx create-next-app@latest app` with all dependencies
- [ ] **Full Supabase schema** — businesses, leads, appointments, conversations, follow_ups tables
- [ ] **AI conversation engine** (Section 5) — OpenAI GPT-4o powered chat
- [ ] **Chat widget** (Section 7) — embeddable `v1.js` script
- [ ] **SMS routes** (Section 6) — Twilio integration for incoming/outgoing SMS
- [ ] **Stripe checkout + webhooks** (Section 8) — payment flow
- [ ] **Auth middleware** (Section 9) — Supabase auth + business dashboard
- [ ] **Customer onboarding wizard** (Section 12.3) — 7-screen self-serve flow
- [ ] **Industry AI system prompts** (Section 14) — dental, aesthetics, legal, trades, physio

### Make.com Automations (Section 10)
- [ ] **New lead notification** — webhook → Supabase lookup → Resend email to business owner
- [ ] **Appointment reminders** — 24h, 2h, 30min SMS reminders
- [ ] **Review requests** — post-appointment Google review SMS
- [ ] **Follow-up sequences** — Day 2 email, Day 5 final SMS

### Legal (Section 3.20 — Aala)
- [ ] **Privacy Policy** — generate via Termly.io, publish at /privacy
- [ ] **Terms of Service** — generate via Termly.io, publish at /terms
- [ ] **Data Processing Agreement** — download from gdpr.eu, customise

### Pre-Launch Testing (Section 11.6)
- [ ] AI chat captures lead → row appears in Supabase
- [ ] Make.com lead notification email arrives
- [ ] Twilio SMS arrives on phone
- [ ] Stripe test card → subscription → plan updates in DB
- [ ] Cal.com booking → row in appointments table
- [ ] Sentry test error → appears in dashboard
- [ ] PostHog page view → appears in dashboard

---

## PRIORITY ORDER FOR NEXT SESSION

1. **Deploy landing page to Vercel** (5 min)
2. **Email warmup via Instantly.ai** (10 min setup, 14 day warmup)
3. **Create all accounts** (Twilio, Stripe, Resend, Make.com, Cal.com, etc.)
4. **Build Next.js app** with full Supabase schema
5. **AI chat engine + widget**
6. **Stripe payments**
7. **Make.com automations**
8. **Onboarding wizard**
9. **Testing + beta launch**
