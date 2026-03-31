# Zypflow Codex Instructions

Always follow these files:
- docs/codex-rules.md
- docs/architecture.md
- docs/patterns.md
- docs/build-order.md

Core rules:
- Keep API routes thin.
- Put business logic in service files.
- Do not duplicate logic.
- Do not patch messy files — replace them cleanly.
- Do not leave old implementation code behind.
- Use environment variables for all secrets.
- Keep code minimal, modular, and production-ready.
- Ensure code passes lint, typecheck, and build.

Patterns:
- Routes: parse → validate → call service → return response
- Services: contain all business logic
- No provider SDK logic in routes unless necessary
