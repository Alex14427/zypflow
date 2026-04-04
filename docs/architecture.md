# Zypflow Architecture

This document defines the system architecture for Zypflow.
Codex MUST follow this when generating code.

---

## 1. Overview

Zypflow is an AI-powered customer growth platform.

Core responsibilities:
- Capture leads via chat widget
- Qualify leads using AI (OpenAI)
- Store data in Supabase
- Send notifications (email + SMS)
- Automate follow-ups (Make.com)
- Handle bookings (Cal.com)
- Manage subscriptions (Stripe)

---

## 2. Tech Stack

Frontend & Backend:
- Next.js (App Router, TypeScript)

Database:
- Supabase (Postgres + Auth)

AI:
- OpenAI API (GPT-4o)

Messaging:
- Twilio (SMS)

Email:
- Resend

Payments:
- Stripe

Automations:
- Make.com

Scheduling:
- Cal.com

Rate Limiting:
- Upstash Redis

Monitoring:
- Sentry

Analytics:
- PostHog

---

## 3. Core System Flows

### 3.1 Chat Flow (MAIN FEATURE)

1. User sends message via chat widget
2. Request goes to: /api/chat
3. Rate limit check (Upstash)
4. Fetch business data (Supabase)
5. Build prompt + conversation history
6. Send to OpenAI
7. Receive AI response
8. Save conversation (Supabase)
9. If lead detected:
   - create/update lead
   - trigger Make.com webhook
10. Return response to widget

---

### 3.2 SMS Flow

Incoming:
- Twilio → /api/sms/incoming
- Save message in Supabase
- Update conversation

Outgoing:
- /api/sms/send
- Send SMS via Twilio

---

### 3.3 Booking Flow

- AI detects booking intent
- Returns booking_url (Cal.com)
- User books appointment
- Cal.com webhook → /api/booking/created
- Insert appointment into Supabase

---

### 3.4 Follow-Up & Automation Flow

- Lead created → webhook → Make.com
- Make.com handles:
  - lead notifications
  - reminders (48h, 24h, 2h)
  - follow-up sequences
  - review requests

---

### 3.5 Stripe Billing Flow

1. User selects plan
2. /api/stripe/checkout creates session
3. User pays via Stripe
4. Stripe webhook → /api/stripe/webhook
5. Update business in Supabase:
   - plan
   - subscription status
6. Send confirmation email

---

## 4. Folder Structure

src/

- app/api/ → API routes
- lib/ → shared utilities (Supabase, OpenAI, etc.)
- services/ → business logic
- types/ → TypeScript types

docs/

- codex-rules.md
- architecture.md

---

## 5. API Design Rules

- All routes must be REST-style
- Each route should do ONE thing only
- Routes must be thin (no heavy logic)

Examples:
- /api/chat
- /api/sms/send
- /api/sms/incoming
- /api/stripe/checkout
- /api/stripe/webhook
- /api/booking/created

---

## 6. Data Model (Supabase)

Main tables:

- businesses
- leads
- conversations
- appointments
- reviews
- follow_ups

Relationships:
- business → many leads
- lead → many conversations
- lead → appointments
- appointment → review

---

## 7. AI System Design

The AI assistant ("Aria") is the core system.

Responsibilities:
- answer questions
- qualify leads
- detect booking intent
- collect contact info

Must handle:
- conversation history
- business-specific knowledge
- tone/personality

Prompt structure:
- system prompt (personality + rules)
- conversation history
- latest message

---

## 8. Security Rules

- Never expose API keys to frontend
- All secrets in environment variables
- Validate all incoming data
- Protect routes from abuse (rate limiting)

---

## 9. Scaling Strategy

Start simple:
- monolithic Next.js app

Scale later:
- extract services if needed
- optimize DB queries
- increase OpenAI limits
- move heavy automations off Make.com if needed

---

## 10. Codex Instructions

When generating code, Codex MUST:

- follow codex-rules.md
- follow this architecture exactly
- not invent new patterns unless necessary
- keep consistency across all services
- prioritize simplicity and maintainability

---

End of architecture.
