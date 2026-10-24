# Verified technical decisions

## Project conventions

- Root `AGENTS.md` holds concise project-wide guidance; scoped Copilot rules live in `.github/instructions/`.
- `app/components/` follows Atomic Design with `atoms`, `molecules`, `organisms`, and `templates`, and layer barrel files expose the UI API.
- Route/feature orchestration belongs in `app/features/<feature>/`; templates compose presentation and do not access the database.
- Reuse the shared Prisma client from `@/lib/prisma`.

## Current-user boundary

- Until authentication exists, user ID `1` is the explicit mock identity used by the server-side current-user provider.
- The root provider passes a minimal serializable projection (`id`, `email`, `full_name`, `avatar_url`) into a local React context.
- Client components read user information through `useUser()` rather than querying the user independently.
- Replace the mock ID with a verified authenticated identity when implementing authentication; do not treat the hard-coded ID as an authorization mechanism.

## Server-rendering behavior

- `next.config.ts` enables Cache Components and Partial Prefetching.
- Request-time database access is awaited beneath a `Suspense` boundary; keep database-dependent content streamable.
- Server actions return mapped serializable data to client components.

## Workspace URL identifiers and board ordering

- Workspace IDs in client-facing links are encrypted with AES-256-GCM using a random IV and authentication tag. The key is supplied by `WORKSPACE_ID_ENCRYPTION_KEY` and must be shared across app instances.
- Encryption hides the raw identifier and detects token tampering; it is not an authorization mechanism. Each detail/read/write action checks the server-side mock user's ownership or membership.
- Until authentication exists, workspace server actions use mock user ID `1` internally; they do not trust a user ID supplied by the browser.
- Board ordering uses `@dnd-kit/core`, `@dnd-kit/sortable`, and `@dnd-kit/utilities`; persisted order is represented by the board's existing `position` field, so this UI change requires no schema migration.
- New boards append at the last active board position plus `1000` (or position `1000` for an empty workspace), calculated inside the create transaction so a new board appears immediately after the current last board.
