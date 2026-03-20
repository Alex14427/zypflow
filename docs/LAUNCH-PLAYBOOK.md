# Zypflow Launch Playbook

## Pre-Launch Checklist (Do These Before First Customer)

### 1. Domain Setup (15 min)
- [ ] In Vercel: Add `app.zypflow.com` as custom domain
- [ ] In Cloudflare DNS: Add CNAME record `app` → `cname.vercel-dns.com` (proxied)
- [ ] SSL auto-provisions via Vercel — verify with `curl -I https://app.zypflow.com`

### 2. Email Domain Verification (30 min) — CRITICAL
Without this, emails go to spam.

**Resend Setup:**
1. Go to https://resend.com/domains → Add `zypflow.com`
2. Resend gives you 3 DNS records. Add them in Cloudflare:
   - SPF: TXT record `v=spf1 include:_spf.resend.com ~all`
   - DKIM: CNAME record (Resend provides the value)
   - DMARC: TXT record `v=DMARC1; p=quarantine; rua=mailto:dmarc@zypflow.com`
3. Wait for verification (usually 5-30 min)
4. Once verified, emails send from `hello@zypflow.com`

### 3. Email Warmup Plan (Week 1-4)
New email domains have zero reputation. Sending 1000 emails day 1 = spam folder.

**Week 1: Foundation**
- Send only transactional emails (signup confirmations, password resets)
- Max 20 emails/day
- Reply to your own test emails from Gmail/Outlook to build engagement signals

**Week 2: Light Volume**
- Start welcome emails for new signups
- Begin appointment confirmations
- Max 50 emails/day
- Monitor bounce rate (should be < 2%)

**Week 3: Medium Volume**
- Enable review request emails
- Enable lead follow-up nurture sequences
- Max 150 emails/day
- Check Resend dashboard for deliverability metrics

**Week 4: Full Volume**
- Enable all automation emails
- Remove volume caps
- Monitor: Open rate > 20%, Bounce rate < 2%, Spam complaint < 0.1%

**Warmup Tools (Optional):**
- Use Instantly.ai or Lemwarm for automated warmup
- Send 10-20 warmup emails/day to seed accounts that auto-reply
- Keep warmup running for 2 weeks minimum

### 4. Twilio UK Number (30 min)
1. Log into Twilio console → Buy a Number
2. Select UK Mobile number (for SMS)
3. Complete UK regulatory bundle (business address, company registration)
4. Once approved, update `TWILIO_PHONE_NUMBER` in Vercel env vars
5. Update webhook URLs in Twilio console:
   - SMS webhook: `https://app.zypflow.com/api/sms/incoming`

### 5. Stripe Live Mode Verification
1. Complete Stripe identity verification
2. Verify webhook endpoint: `https://app.zypflow.com/api/stripe/webhook`
3. Add these Stripe webhook events:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_failed`
   - `customer.subscription.trial_will_end`
4. Copy the webhook signing secret to `STRIPE_WEBHOOK_SECRET` in Vercel

### 6. Environment Variables Audit
Verify all env vars are set in Vercel project settings:
- [ ] NEXT_PUBLIC_SUPABASE_URL
- [ ] NEXT_PUBLIC_SUPABASE_ANON_KEY
- [ ] SUPABASE_SERVICE_ROLE_KEY
- [ ] STRIPE_SECRET_KEY
- [ ] STRIPE_WEBHOOK_SECRET
- [ ] NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
- [ ] STRIPE_STARTER_PRICE_ID
- [ ] STRIPE_GROWTH_PRICE_ID
- [ ] STRIPE_ENTERPRISE_PRICE_ID
- [ ] TWILIO_ACCOUNT_SID
- [ ] TWILIO_AUTH_TOKEN
- [ ] TWILIO_PHONE_NUMBER
- [ ] RESEND_API_KEY
- [ ] OPENAI_API_KEY
- [ ] AUTOMATION_SECRET (generate: `openssl rand -hex 32`)
- [ ] CRON_SECRET (generate: `openssl rand -hex 16`)
- [ ] CAL_WEBHOOK_SECRET
- [ ] UPSTASH_REDIS_REST_URL
- [ ] UPSTASH_REDIS_REST_TOKEN
- [ ] MAKE_WEBHOOK_URL
- [ ] NEXT_PUBLIC_APP_URL=https://app.zypflow.com
- [ ] NEXT_PUBLIC_POSTHOG_KEY
- [ ] SENTRY_DSN

### 7. Run Webhook Events Migration
Execute in Supabase SQL Editor:
```sql
-- From supabase/migration_002_webhook_events.sql
CREATE TABLE IF NOT EXISTS stripe_webhook_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id TEXT NOT NULL UNIQUE,
  event_type TEXT NOT NULL,
  processed_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_stripe_webhook_events_event_id ON stripe_webhook_events(event_id);
```

---

## Post-Launch: First 5 Beta Customers

### Manual QA Test Flow (Do This Yourself First)
1. **Signup** → Create account → Verify email arrives
2. **Onboarding** → Complete all 7 steps → Verify data saved
3. **Dashboard** → Check all 7 pages load with data
4. **Chat Widget** → Embed on a test site → Send messages → Verify AI responds
5. **Booking** → Book via Cal.com → Verify appointment appears in dashboard
6. **Reminders** → Wait for reminder email/SMS → Verify delivery
7. **Review Request** → Mark appointment complete → Verify review request sent
8. **Stripe** → Subscribe to a plan → Verify webhook updates business
9. **Cancellation** → Cancel via billing portal → Verify plan reverts

### Beta Customer Recruitment
1. Pick 5 UK service businesses (dental, aesthetics, physio — your strongest verticals)
2. Offer free 30-day trial (no credit card)
3. Do the widget installation for them (5 min each)
4. Set up their Cal.com event types
5. Check in daily for week 1

---

## Outreach Strategy

### Cold Email (Week 3+ after warmup)
**Target:** UK dental practices, aesthetic clinics, physiotherapy clinics
**Volume:** Start at 30/day, scale to 100/day by week 6
**Tool:** Instantly.ai or Lemlist

**Subject lines to test:**
- "Your website visitors are leaving without booking"
- "Quick question about [Practice Name]"
- "[First Name], 73% of patients check reviews before booking"

**Email template (keep under 100 words):**
```
Hi [First Name],

I noticed [Practice Name] gets solid Google reviews but your website
doesn't have a way to chat with visitors in real time.

We built an AI assistant specifically for [industry] practices that
answers patient questions 24/7 and books appointments automatically.

It takes 2 minutes to install and there's a free trial.

Would it make sense to show you a quick demo?

[Your name]
Zypflow
```

### Lead Sources (Scraping Pipeline)
The Apify scraper is already configured. It rotates through:
- Dental practices in major UK cities
- Aesthetic clinics
- Physiotherapy practices
- Home services (plumbing, electrical, etc.)

Data flows: Apify → Supabase `prospects` table → Cold outreach

### Content Marketing
- Write 3 blog posts per month targeting:
  - "How to get more Google reviews for your dental practice"
  - "AI chatbots for healthcare practices UK"
  - "Best patient communication tools 2026"
- Post on LinkedIn 3x/week
- Create short-form demos for TikTok/Instagram

---

## Key Metrics to Track Weekly

| Metric | Target |
|--------|--------|
| New signups | 10+/week by month 2 |
| Trial → Paid conversion | > 25% |
| Monthly churn | < 5% |
| MRR | £5k by month 3 |
| Email open rate | > 25% |
| Email bounce rate | < 2% |
| Spam complaint rate | < 0.1% |
| AI chat accuracy | > 90% helpful |
| Widget engagement | > 3% of site visitors |

---

## Credential Rotation Schedule
**IMPORTANT:** All API keys in the `.env` file were committed to git history.
Even though they're now removed from tracking, anyone with repo access could find them.

**Rotate immediately:**
- [ ] Stripe keys (Dashboard → Developers → API keys → Roll keys)
- [ ] OpenAI API key (platform.openai.com → API keys)
- [ ] Anthropic API key (console.anthropic.com)
- [ ] Twilio Auth Token (Twilio console → Account → Auth token)
- [ ] Resend API key
- [ ] Supabase service role key (Project settings → API)
- [ ] Upstash Redis token
- [ ] Apify API token
- [ ] Hunter.io API key
- [ ] Make.com API token
- [ ] Cloudflare token
- [ ] Instantly API key

After rotating, update all values in Vercel Environment Variables.
