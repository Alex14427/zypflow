# HANDOFF PROMPT — Paste This Into Your Next Claude Code Session

Copy everything below and paste it as your first message in a new session:

---

I'm building Zypflow — an AI customer growth platform for UK service businesses. Read `CLAUDE.md` for project context, `Zypflow-FINAL.docx` for the full build guide, and `HANDOFF-CHECKLIST.md` for what's done vs not done.

**What's already done:** Landing page (index.html) with SEO, analytics, lead capture form wired to Supabase, Tawk.to chat, cookie consent, sitemap, robots.txt. Supabase has `leads` + `inquiries` tables with RLS.

**What I need you to build now (in order):**

1. **Deploy to Vercel** — connect GitHub repo Alex14427/zypflow and deploy
2. **Full Supabase schema** — create all remaining tables from Section 4.3: businesses, appointments, conversations, messages, follow_ups, reviews, AND a new `prospects` table for outreach leads. All with proper RLS policies.
3. **Next.js app** — scaffold inside /app directory. TypeScript, Tailwind, App Router. Install all deps from Section 4.2 + apify-client.
4. **AI conversation engine** (Section 5) — OpenAI GPT-4o primary + Anthropic Claude fallback. Lead extraction, knowledge base per industry, conversation logging to Supabase.
5. **Embeddable chat widget** (Section 7) — build v1.js for business websites
6. **SMS routes** (Section 6) — Twilio send/receive with Supabase logging
7. **Stripe checkout + webhooks** (Section 8) — 3 plans (£149/£299/£499), subscription management
8. **Cal.com webhook** (Section 8.1) — appointment created → Supabase + lead update
9. **Auth + dashboard** (Section 9) — Supabase auth, business dashboard
10. **Onboarding wizard** (Section 12.3) — 7-screen self-serve flow
11. **Email utility** (Section 4.7) — Resend for welcome emails, notifications
12. **Rate limiting** — Upstash Redis middleware
13. **Apify lead scraping pipeline** — Build API routes that:
    - Run `apify/google-maps-scraper` for each industry + city combo
    - Run `curious_coder/apollo-io-scraper` to enrich with email/name
    - Store all prospects in Supabase `prospects` table (deduplicated by email)
    - Push new prospects to Instantly.ai campaigns via their API
    - Schedule weekly scrapes via cron or Vercel cron
14. **Make.com automations** — Set up webhooks for:
    - Instantly.ai reply → create lead in Supabase → Slack + SMS notification
    - New lead → email notification to business owner
    - Appointment reminders (24h, 2h, 30min SMS)
    - Review requests (post-appointment)
    - Follow-up sequences (Day 2 email, Day 5 SMS)

**API keys are in `.env.local`**
**Supabase project ID:** pzsgdqbpaogxcrsjjysf
**Branch:** claude/integrate-solisdigital-zypflow-n6BrI

Build everything. Don't ask questions — use the docx as your source of truth. Commit and push when done.

---
