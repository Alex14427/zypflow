# Codex Rules — Zypflow

These rules define how all code in Zypflow should be written.
Codex MUST follow these when generating or modifying code.

---

## 1. General Principles

- Write clean, readable, and maintainable code.
- Prefer clarity over cleverness.
- Use consistent naming across the codebase.
- Keep files and functions small and focused.
- Avoid duplication (DRY principle).

---

## 2. File Structure

- API routes live in: src/app/api/*
- Shared logic lives in: src/lib/*
- Business logic lives in: src/services/*
- Types live in: src/types/*
- Validation schemas live near their feature or in src/lib/validation

---

## 3. API Route Rules (CRITICAL)

- API routes must be THIN.
- Do NOT put heavy logic inside route handlers.
- Route responsibilities:
  - parse request
  - validate input
  - call service function
  - return response

Example structure:

POST → validate → call service → return JSON

---

## 4. Business Logic Rules

- All reusable logic must be extracted into services.
- Services should:
  - be pure when possible
  - not depend on request/response objects
- Separate concerns:
  - OpenAI logic
  - Supabase logic
  - Twilio logic
  - Stripe logic

Do NOT mix all services in one file.

---

## 5. Database (Supabase)

- Never expose service_role key to the frontend.
- Use:
  - browser client for frontend
  - admin client for server routes only
- Keep queries simple and readable.
- Wrap DB calls in try/catch.

---

## 6. Validation

- Use zod for all input validation.
- Never trust incoming data.
- Validate:
  - request body
  - query params
  - webhook payloads

---

## 7. Error Handling

- Always use try/catch in API routes.
- Return consistent error responses.
- Log critical errors (Sentry integration).
- Do not expose sensitive data in errors.

---

## 8. Async Code

- Always use async/await (no .then chains).
- Handle promise failures properly.
- Avoid unhandled rejections.

---

## 9. Security

- Never expose API keys in frontend code.
- Use environment variables for all secrets.
- Do not log sensitive data (tokens, keys, passwords).
- Sanitize user input where needed.

---

## 10. Integrations

Each external service must be isolated:

- OpenAI → separate module/service
- Stripe → separate module/service
- Twilio → separate module/service
- Resend → separate module/service

Do not tightly couple integrations.

---

## 11. Chat System (Core Feature)

- Keep chat logic modular and testable.
- Separate:
  - prompt construction
  - OpenAI call
  - response parsing
  - lead creation
- Store conversation history cleanly.

---

## 12. Performance

- Avoid unnecessary database calls.
- Avoid large payloads where possible.
- Cache or reuse data when appropriate.

---

## 13. Code Size Rules

- Functions should generally be under ~50 lines.
- Files should generally be under ~200–300 lines.
- If a file grows too large → split it.

---

## 14. Naming Conventions

- Use descriptive names:
  - bad: data, temp, value
  - good: leadData, bookingRequest, chatResponse
- Use consistent naming across files.

---

## 15. Reusability

- If logic is used more than once → extract it.
- Prefer shared utilities over duplication.

---

## 16. Testing Mindset

- Write code that is easy to test.
- Avoid tightly coupled logic.
- Keep functions deterministic where possible.

---

## 17. Codex Behaviour Rules

When generating code, Codex MUST:

- Follow this document strictly
- Prefer simple solutions over complex ones
- Ask for clarification if requirements are unclear
- Refactor code when asked to improve quality
- Avoid introducing unnecessary dependencies

---

## 18. Priority Order

When in doubt, prioritise:

1. Correctness
2. Readability
3. Maintainability
4. Performance

---

End of rules.
