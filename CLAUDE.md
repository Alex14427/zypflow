# Zypflow — Claude Code Instructions

## Project
Zypflow is an AI customer growth platform for UK service businesses.
Full build spec: `Zypflow-FINAL.docx`
Status: `HANDOFF-CHECKLIST.md`

## Branch
Always develop on: `claude/integrate-solisdigital-zypflow-n6BrI`

## Supabase
- Project ID: quarijsqejzilervrcub
- Region: eu-north-1
- Schema migration: `supabase/migration_001_full_schema.sql` (run in SQL Editor)

## Tech Stack
- Landing page: Static HTML (index.html)
- App: Next.js 14+ (TypeScript, Tailwind, App Router)
- Database: Supabase (Postgres + Auth + Realtime)
- Payments: Stripe
- SMS: Twilio
- Email: Resend
- Automations: Make.com
- Booking: Cal.com
- Rate limiting: Upstash Redis
- Analytics: PostHog + Google Analytics
- Error tracking: Sentry
- Hosting: Vercel
- DNS: Cloudflare

## Permissions
- You may read, write, and edit any file in this repo
- You may run npm/npx commands freely
- You may push to the branch above
- You may create Supabase tables and run migrations
- You may deploy to Vercel

## Style
- Use TypeScript strict mode
- Use Zod for validation
- Keep code simple — no over-engineering
- Follow the Zypflow-FINAL.docx structure exactly
