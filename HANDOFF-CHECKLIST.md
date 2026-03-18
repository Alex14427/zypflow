# ZYPFLOW BUILD STATUS — Honest Checklist

## DONE (Session 1)
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
- [x] **keys.txt removed** — API keys no longer exposed in repo
- [x] **Git pushed** to `claude/integrate-solisdigital-zypflow-n6BrI`

---

## ALEX MUST DO BEFORE NEXT SESSION (manual — Claude can't do these)

### 1. Domain Setup (10 min)
- [ ] **Buy outreach domain** — `tryzypflow.com` or `getzypflow.co.uk` on Namecheap (~£8). NEVER cold email from zypflow.uk
- [ ] **Add outreach domain to Cloudflare** — same as you did for zypflow.uk
- [ ] **Merge the PR on GitHub** — go to github.com/Alex14427/zypflow → merge the open PR

### 2. Email Warmup (15 min setup, then 14 days hands-off)
- [ ] **Create 3 outreach mailboxes** on the NEW domain via Google Workspace: `alex@tryzypflow.com`, `aala@tryzypflow.com`, `hello@tryzypflow.com`
- [ ] **Sign up for Instantly.ai** (free tier)
- [ ] **Connect all 3 mailboxes** to Instantly.ai
- [ ] **Add DNS records** — Instantly.ai tells you exactly what SPF/DKIM/DMARC to add in Cloudflare
- [ ] **Enable warmup** on all 3 mailboxes — toggle ON in Instantly.ai dashboard
- [ ] **Wait 14-21 days** — warmup runs automatically. Do not send real emails until warmup score hits 90%+

### 3. Apify Lead Scraping (20 min setup, then automated)
- [ ] **Sign up at apify.com** (free tier = 5 USD credits/mo)
- [ ] **Get your Apify API token** — Settings → Integrations → API token → copy it
- [ ] **Use these Apify actors** (pre-built scrapers):
  - `apify/google-maps-scraper` — scrape dental practices, legal firms, trades, aesthetics by city
  - `curious_coder/apollo-io-scraper` — scrape Apollo.io contact data (emails, names, titles)
- [ ] **Run a test scrape** — Google Maps → search "dental practices London" → export CSV
- [ ] **Save your Apify API token** to give me in next session

### 4. Accounts + API Keys (gather these)
- [ ] **Twilio** — Account SID, Auth Token, buy UK number
- [ ] **Stripe** — Secret key, Publishable key, create 3 monthly prices (£149/£299/£499), copy price IDs
- [ ] **Resend** — API key, verify zypflow.uk domain (add DNS records in Cloudflare)
- [ ] **Make.com** — already done ✓
- [ ] **Cal.com** — sign up, connect Google Calendar
- [ ] **Upstash** — sign up, create Redis database, copy REST URL + Token
- [ ] **PostHog** — sign up, create project, copy API key
- [ ] **Sentry** — sign up, create project
- [ ] **OpenAI** — API key, set £50 hard spending limit
- [ ] **Anthropic Claude API** — API key (backup AI for conversations)
- [ ] **Apify** — API token (for automated lead scraping)
- [ ] **Vapi.ai or Bland.ai** — sign up for AI voice (answers actual phone calls)

### 5. Rotate Compromised Keys
- [ ] **Supabase** — regenerate anon key (old one was in public keys.txt)
- [ ] **Any other key** that was in keys.txt — regenerate it

---

## NOT DONE — Claude Builds In Next Session

### Full Next.js App (Sections 4-9)
- [ ] Next.js project setup with all dependencies
- [ ] Full Supabase schema — businesses, appointments, conversations, messages, follow_ups, reviews
- [ ] AI conversation engine (GPT-4o + Claude fallback)
- [ ] Embeddable chat widget (v1.js)
- [ ] SMS routes (Twilio send/receive)
- [ ] Stripe checkout + webhooks (3 plans)
- [ ] Cal.com webhook (appointment → Supabase)
- [ ] Auth + business dashboard
- [ ] Customer onboarding wizard (7 screens)
- [ ] Email utility (Resend)
- [ ] Rate limiting (Upstash Redis)
- [ ] Industry AI system prompts (dental, legal, trades, aesthetics, physio)

### Automated Client Acquisition Pipeline
- [ ] **Apify → Supabase pipeline** — scrape leads from Google Maps + Apollo → store in `prospects` table
- [ ] **Apify scheduled scrapes** — auto-run weekly per city per industry
- [ ] **Instantly.ai API integration** — push prospects from Supabase → Instantly.ai campaigns automatically
- [ ] **Make.com automation** — when prospect replies "interested" → create lead in Supabase → notify Alex via Slack + SMS
- [ ] **Cold email templates** — 3-email sequence per industry (dental, legal, trades, aesthetics, physio)

### Make.com Automations (Section 10)
- [ ] New lead notification — webhook → Resend email to business owner
- [ ] Appointment reminders — 24h, 2h, 30min SMS
- [ ] Review requests — post-appointment Google review SMS
- [ ] Follow-up sequences — Day 2 email, Day 5 final SMS

### Legal (Aala)
- [ ] Privacy Policy via Termly.io → /privacy
- [ ] Terms of Service via Termly.io → /terms
- [ ] Data Processing Agreement

### Deploy + Testing
- [ ] Vercel deploy + custom domain
- [ ] Full end-to-end testing (Section 11.6)

---

## AUTOMATED CLIENT ACQUISITION PIPELINE — How It Works

```
SCRAPING (weekly, automated)
  Apify Google Maps scraper
    → "dental practices Manchester" / "solicitors Birmingham" / etc.
    → Extracts: business name, phone, website, address, rating, reviews

  Apify Apollo scraper
    → Takes business names → finds owner/manager email + name
    → Extracts: first name, last name, email, job title

STORAGE
  → All prospects saved to Supabase `prospects` table
  → Deduplicated by email
  → Tagged by industry + city

OUTREACH (automated via Instantly.ai)
  → New prospects pushed to Instantly.ai via API
  → Auto-assigned to correct industry campaign
  → 3-email sequence sends over 7 days
  → 25 emails/day per mailbox × 3 mailboxes = 75/day

REPLIES (automated via Make.com)
  → Instantly.ai webhook fires on reply
  → Make.com catches it → creates lead in Supabase
  → Sends Slack notification to Alex
  → Sends SMS to Alex via Twilio
  → Auto-replies: "Thanks! Here's a link to book a quick 10-min demo: [Cal.com link]"

CONVERSION
  → Prospect books demo on Cal.com
  → Cal.com webhook → Supabase appointment
  → Alex does 10-min demo → sends Stripe checkout link
  → Customer pays → onboarding wizard → AI goes live

EXPECTED NUMBERS (monthly)
  ~1,500 emails sent → ~35 replies → ~10 demos → ~5 customers
  = £750-2,500/mo new recurring revenue
```
