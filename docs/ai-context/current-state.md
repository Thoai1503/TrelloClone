# Current project state

Last verified: 2026-10-24.

## Implemented

- The app is a Next.js 16 App Router project using React 19, TypeScript, Tailwind CSS 4, Prisma 7, and MySQL.
- `app/layout.tsx` wraps routes in a server-side `CurrentUserProvider` and a client-side `UserProvider`.
- Email/password authentication uses the NextAuth Credentials provider and bcrypt hashes in `user.password_hash`. NextAuth keeps a seven-day encrypted JWT session in an HttpOnly cookie. `CurrentUserProvider` reads the user ID from that session and reloads the profile; unauthenticated requests do not receive a mock user.
- Usernames in workspace-list routes are stable slugs derived from the authenticated user's full name or email plus their ID; they are URL handles, not authentication credentials.
- The root route (`/`) is the product introduction landing page. The user's workspace list is at `/u/{username}/board`, including workspaces they created and workspaces where they have a membership row.
- `/login` contains a Formik email/password form that authenticates against the stored bcrypt password hash. Google sign-in remains UI-only.
- Workspace loading, empty, missing-user, and query-error states are separate.
- The home UI follows Atomic Design under `app/components/atoms`, `molecules`, `organisms`, and `templates`. Route-level workspace data and state are in `app/features/workspaces`.
- The `app/(user)/layout.tsx` route-group layout renders the shared account header for both the workspace list and workspace detail pages; page-specific controls remain within their feature content.
- Workspace cards link to an AES-256-GCM encrypted workspace identifier. The detail screen displays active boards in a horizontally scrollable, sortable `@dnd-kit` list and persists reordered positions.
- Workspace records store a preset hex background in `background_color`; create-workspace UI writes it with an ADMIN membership and navigates using the encrypted workspace ID.
- The workspace detail view provides an "add another list" form. New boards are appended using the last active board's position plus `1000`, inside a transaction.

## Verified constraints

- `user.id` and `workspace_member.user_id` are unsigned integers. Workspace and board identifiers and creator IDs are `BigInt`.
- `WORKSPACE_ID_ENCRYPTION_KEY` must be set to 64 hexadecimal characters and kept consistent across deployments.
- `NEXTAUTH_SECRET` must be a private random secret with at least 32 characters and kept consistent across deployments; never reuse the workspace ID encryption key.
- `workspace.created_by` is not declared as a Prisma relation to `user`.
- Workspace cards currently display information but do not navigate to a board/workspace route.
- The generated Prisma client is written to `generated/prisma`; regenerate it after schema changes.

## Validation commands

- `npm run lint -- app`
- `npx tsc --noEmit`
- `npm run build`
- `npx prisma validate`
- `npm run db:generate`
- The installed board drag-and-drop stack is `@dnd-kit/core`, `@dnd-kit/sortable`, and `@dnd-kit/utilities`; avoid adding a second DnD library without an architecture decision.
