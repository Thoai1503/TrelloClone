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
