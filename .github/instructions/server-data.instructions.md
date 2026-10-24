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
- Treat encrypted/opaque identifiers as defense-in-depth, not authorization. Every workspace read or mutation must independently verify the current server-side user's ownership or membership.
- Never accept a user ID or username from a client as proof of identity. Resolve the current user from the NextAuth session with `getCurrentUser()` in providers and every server action that reads or mutates user-scoped data.
- Verify email/password credentials through the NextAuth Credentials provider against the stored bcrypt hash. Never put passwords or password hashes into session data or client context.
- Keep `NEXTAUTH_SECRET` private, random, and separate from identifier-encryption keys. Rely on NextAuth to configure its HttpOnly session cookie securely.
- Keep encryption keys in environment variables, never in source control. Use authenticated encryption for identifiers placed in URLs, and validate/decrypt them only on the server.
- Validate complete reorder submissions against the current workspace's active board IDs before persisting order changes transactionally.
- When appending ordered records, calculate the next position from the last active record inside the same database transaction that creates the new record; preserve the existing ordering convention.
- When changing provider or server-action behavior, document verified data flow in `docs/architecture/` and relevant decisions in `docs/ai-context/`.
