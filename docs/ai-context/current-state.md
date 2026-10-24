# Current project state

Last verified: 2026-10-24.

## Implemented

- The app is a Next.js 16 App Router project using React 19, TypeScript, Tailwind CSS 4, Prisma 7, and MySQL.
- `app/layout.tsx` wraps routes in a server-side `CurrentUserProvider` and a client-side `UserProvider`.
- Email/password authentication uses the NextAuth Credentials provider and bcrypt hashes in `user.password_hash`. NextAuth keeps a seven-day encrypted JWT session in an HttpOnly cookie. `CurrentUserProvider` reads the user ID from that session and reloads the profile; unauthenticated requests do not receive a mock user.
- Usernames in the board-collection route are stable slugs derived from the authenticated user's full name or email plus their ID; they are URL handles, not authentication credentials.
- The root route (`/`) is the product introduction landing page. `/u/{username}/board` displays the user's active boards as horizontal cards grouped under workspace-name headings, not large workspace cards. Empty workspaces remain visible with a board-creation control. Board details are at `/board/{encryptedBoardId}` and show that board's active lists (columns).
- `/login` contains a Formik email/password form that authenticates against the stored bcrypt password hash. Google sign-in remains UI-only.
- Board-collection loading, empty, missing-user, and query-error states are separate.
- The board collection and board details use separate loading fallback components.
- The home UI follows Atomic Design under `app/components/atoms`, `molecules`, `organisms`, and `templates`. Route-level board-collection data and state are in `app/features/board-collection`.
- Domain action modules and contracts are separated by entity: `app/actions/workspaces.ts`, `boards.ts`, `lists.ts` and `app/types/workspace.ts`, `board.ts`.
- The `app/(user)/layout.tsx` route-group layout renders the shared account header for both the board collection and board detail pages; page-specific controls remain within their feature content.
- Workspace and board identifiers in client-facing routes are AES-256-GCM encrypted. The board collection groups workspace boards in horizontally scrollable cards; board cards do not have drag-and-drop controls. Board detail supports horizontal list ordering and card reordering within a list or moving cards between lists; card list and position changes persist transactionally through an access-checked server action.
- Workspace records store a preset hex background in `background_color`; create-workspace UI writes it with an ADMIN membership and navigates using the encrypted workspace ID.
- Workspace-level board creation appends a board using the last active board's position plus `1000`, inside a transaction. Board detail displays lists (columns), can append a list in position order, and persists drag-and-drop reordering to list positions.

## Verified constraints

- `user.id` and `workspace_member.user_id` are unsigned integers. Workspace and board identifiers and creator IDs are `BigInt`.
- `WORKSPACE_ID_ENCRYPTION_KEY` must be set to 64 hexadecimal characters and kept consistent across deployments.
- `NEXTAUTH_SECRET` must be a private random secret with at least 32 characters and kept consistent across deployments; never reuse the workspace ID encryption key.
- `workspace.created_by` is not declared as a Prisma relation to `user`.
- The board collection groups accessible boards by workspace; selecting a board opens `/board/{encryptedBoardId}`.
- The generated Prisma client is written to `generated/prisma`; regenerate it after schema changes.

## Validation commands

- `npm run lint -- app`
- `npx tsc --noEmit`
- `npm run build`
- `npx prisma validate`
- `npm run db:generate`
- The installed board drag-and-drop stack is `@dnd-kit/core`, `@dnd-kit/sortable`, and `@dnd-kit/utilities`; avoid adding a second DnD library without an architecture decision.
