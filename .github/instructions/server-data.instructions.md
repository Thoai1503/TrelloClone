---
description: "Use when editing server actions, Prisma queries, database access, providers that load server data, or the Prisma schema."
applyTo:
  - "app/actions/**/*.ts"
  - "app/providers/**/*.tsx"
  - "lib/**/*.ts"
  - "prisma/**/*.prisma"
---

# Server data and Prisma conventions

- Keep all Prisma usage in server-only code. Use the shared instance from `@/lib/prisma`; do not instantiate another client per request.
- Implement database operations in focused async server actions in `app/actions/`. Validate external identifiers and input before querying.
- Select only the fields required by the caller. Convert `BigInt`, `Date`, and other non-serializable values before returning data to a Client Component.
- Model relationships in Prisma with explicit, type-compatible foreign keys and relation fields. Confirm corresponding back-relations and mapped database names.
- After schema changes, run `npx prisma validate` and `npm run db:generate`; add migrations only when the task requires changing the database.
- Do not hand-edit `generated/prisma/`.
- Make missing records and operational failures distinguishable. Do not silently substitute empty data for a failed query.
- When changing provider or server-action behavior, document verified data flow in `docs/architecture/` and relevant decisions in `docs/ai-context/`.
