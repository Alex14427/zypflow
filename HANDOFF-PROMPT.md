# HANDOFF PROMPT — Paste This Into Your Next Claude Code Session

Copy everything below and paste it as your first message in a new session:

---

I'm building Zypflow — an AI customer growth platform for UK service businesses. Read `Zypflow-FINAL.docx` for the full build guide and `HANDOFF-CHECKLIST.md` for what's done vs not done.

**What's already done:** Landing page (index.html) with SEO, analytics, lead capture form wired to Supabase, Tawk.to chat, cookie consent, sitemap, robots.txt. Supabase has `leads` + `inquiries` tables with RLS.

**What I need you to build now (in order):**

1. **Deploy to Vercel** — connect the GitHub repo Alex14427/zypflow and deploy
2. **Full Supabase schema** — create all remaining tables from Section 4.3 of the docx: businesses, appointments, conversations, messages, follow_ups, reviews. All with proper RLS policies.
3. **Next.js app** — scaffold `npx create-next-app@latest app --typescript --tailwind --app` inside /app directory. Install all deps from Section 4.2. Set up the project structure from the docx.
4. **AI conversation engine** (Section 5) — OpenAI GPT-4o chat API with lead extraction, knowledge base per industry, conversation logging to Supabase
5. **Embeddable chat widget** (Section 7) — build v1.js that businesses embed on their sites
6. **SMS routes** (Section 6) — Twilio send/receive with Supabase logging
7. **Stripe checkout + webhooks** (Section 8) — 3 plans, subscription management
8. **Cal.com webhook** (Section 8.1) — appointment created → Supabase + lead update
9. **Auth + dashboard** (Section 9) — Supabase auth, business dashboard showing leads/conversations/appointments
10. **Onboarding wizard** (Section 12.3) — 7-screen self-serve flow
11. **Email utility** (Section 4.7) — Resend integration for welcome emails, notifications
12. **Rate limiting** — Upstash Redis middleware

**Supabase project ID:** pzsgdqbpaogxcrsjjysf
**Branch:** claude/integrate-solisdigital-zypflow-n6BrI

Build everything. Don't ask questions — use the docx as your source of truth. Commit and push when done.

---
