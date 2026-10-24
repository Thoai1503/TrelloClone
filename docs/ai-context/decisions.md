# Verified technical decisions

## Project conventions

- Root `AGENTS.md` holds concise project-wide guidance; scoped Copilot rules live in `.github/instructions/`.
- `app/components/` follows Atomic Design with `atoms`, `molecules`, `organisms`, and `templates`, and layer barrel files expose the UI API.
- Route/feature orchestration belongs in `app/features/<feature>/`; templates compose presentation and do not access the database.
- Reuse the shared Prisma client from `@/lib/prisma`.

## Current-user boundary

- NextAuth Credentials authenticates email/password with bcrypt and stores the authenticated identity in its encrypted JWT HttpOnly cookie with a seven-day expiry. The current-user provider resolves the ID against Prisma on each request, provides the session through NextAuth `SessionProvider`, and passes a minimal serializable profile (`id`, `email`, `full_name`, `avatar_url`, derived `username`) into the local React context.
- Client components read user information through `useUser()` rather than querying the user independently.
- The workspace server actions resolve the same verified NextAuth session themselves and never trust a client-supplied user ID or username for authorization.
- Email login compares the submitted password with the bcrypt hash stored in `user.password_hash`; return a generic credential error for unknown users and invalid passwords. `NEXTAUTH_SECRET` must be a random, private secret distinct from other encryption keys.
- `/` is the public product landing page; `/u/{username}/board` hosts the workspace list. The route username is a display slug derived from user data plus ID and is validated against the session user, not used as an identity or authorization mechanism.
- The `/` and `/login` server routes share `redirectAuthenticatedUser()`: authenticated users go to their own workspace list, while unauthenticated visitors see the landing page or login form respectively.

## Server-rendering behavior

- `next.config.ts` enables Cache Components and Partial Prefetching.
- Request-time database access is awaited beneath a `Suspense` boundary; keep database-dependent content streamable.
- Server actions return mapped serializable data to client components.

## Workspace URL identifiers and board ordering

- Workspace IDs in client-facing links are encrypted with AES-256-GCM using a random IV and authentication tag. The key is supplied by `WORKSPACE_ID_ENCRYPTION_KEY` and must be shared across app instances.
- Encryption hides the raw identifier and detects token tampering; it is not an authorization mechanism. Each detail/read/write action checks the authenticated session user's ownership or membership.
- Board cards are not draggable; their visual order is read from the existing board `position` field. New boards append at the last active board position plus `1000` (or position `1000` for an empty workspace), calculated inside the create transaction.
- Board-detail lists use `@dnd-kit/core`, `@dnd-kit/sortable`, and `@dnd-kit/utilities`; the active list order is persisted in each list's existing `position` field.
