# Zypflow — Claude Code Instructions

## Project
Zypflow is an AI customer growth platform for UK service businesses.
**Master plan (single source of truth):** `ZYPFLOW-MASTER-PLAN.md`
**Original build spec (reference only):** `Zypflow-FINAL.docx`

## Branch
Always develop on the branch specified in the session instructions.

## Supabase
- Project ID: quarijsqejzilervrcub
- Region: eu-north-1
- Schema migrations: `supabase/` directory

## Tech Stack
- Landing page: Static HTML (index.html)
- App: Next.js 14+ (TypeScript, Tailwind, App Router)
- Database: Supabase (Postgres + Auth + Realtime)
- Payments: Stripe
- SMS: Twilio
- WhatsApp: Meta WhatsApp Cloud API
- Email: Resend
- AI: Claude API + OpenAI (GPT-4o)
- Automations: Make.com
- Booking: Cal.com
- Scraping: Apify
- Cold email: Instantly.ai
- Rate limiting: Upstash Redis
- Analytics: PostHog + Google Analytics
- Error tracking: Sentry
- Hosting: Vercel
- DNS: Cloudflare

## Permissions
- You may read, write, and edit any file in this repo
- You may run npm/npx commands freely
- You may push to the designated branch
- You may create Supabase tables and run migrations
- You may deploy to Vercel

## Style
- Use TypeScript strict mode
- Use Zod for validation
- Every table must have `org_id` + RLS
- Keep code simple — no over-engineering
- Server components by default, `'use client'` only for interactivity
- See `ZYPFLOW-MASTER-PLAN.md` Section 11 for full coding conventions
