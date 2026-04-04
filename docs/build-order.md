# Build Order — Zypflow

Codex must follow this order when building the system.

---

## Phase 1 — Core Setup

1. Supabase project setup
2. Environment variables (.env.local)
3. src/lib/supabase.ts

---

## Phase 2 — Core Backend

4. /api/chat (AI chat system)
5. /api/sms/send
6. /api/sms/incoming

---

## Phase 3 — Core Features

7. Chat widget
8. Booking webhook (/api/booking/created)

---

## Phase 4 — Payments

9. /api/stripe/checkout
10. /api/stripe/webhook

---

## Phase 5 — Dashboard

11. Business dashboard
12. Analytics + tracking

---

## Rule

Do NOT skip steps.
Each step must be complete before moving forward.
