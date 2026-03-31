# Coding Patterns — Zypflow

These patterns define how code should be structured.

---

## API Routes

- Routes must be thin.
- Only:
  - parse request
  - validate input
  - call service
  - return response

---

## Services

- Business logic lives in services.
- Services must NOT depend on request/response objects.
- Keep services reusable.

---

## Database Access

- Supabase queries go in services or lib files.
- Do NOT put complex queries in API routes.

---

## Integrations

- Each integration must be separate:
  - OpenAI → ai service
  - Stripe → billing service
  - Twilio → sms service
  - Resend → email service

---

## Validation

- Use zod for all inputs.
- Validate before processing.

---

## File Organisation

- src/app/api → routes
- src/lib → utilities
- src/services → business logic
- src/types → shared types

---

## Rule

Never mix:
- Stripe
- OpenAI
- Twilio

in one file unless absolutely necessary.
