# Current project state

Last verified: 2026-10-25.

## Implemented

- The app is a Next.js 16 App Router project using React 19, TypeScript, Tailwind CSS 4, Prisma 7, and MySQL.
- Board detail data is fetched on the client through the `useBoardById` TanStack Query hook. Successful board/card mutations refetch the board query, and the board view synchronizes its local list/member state with the refreshed data.
- Board sharing controls let board admins change non-admin member roles and remove members; workspace owners/admins and board creators can also manage board admins. Server actions protect board/workspace creators and prevent removing or demoting the last board admin.
- `app/layout.tsx` wraps routes in a server-side `CurrentUserProvider` and a client-side `UserProvider`.
- Email/password authentication uses the NextAuth Credentials provider and bcrypt hashes in `user.password_hash`. NextAuth keeps a seven-day encrypted JWT session in an HttpOnly cookie. `CurrentUserProvider` reads the user ID from that session and reloads the profile; unauthenticated requests do not receive a mock user.
- Usernames in the board-collection route are stable slugs derived from the authenticated user's full name or email plus their ID; they are URL handles, not authentication credentials.
- The root route (`/`) is the product introduction landing page. `/u/{username}/board` displays the user's active boards as horizontal cards grouped under workspace-name headings, not large workspace cards. Empty workspaces remain visible with a board-creation control. Board details are at `/board/{encryptedBoardId}` and show that board's active lists (columns). Board creators, workspace owners/admins, and board admins can share boards with existing users by email; new members are added with the EDITOR role.
- `/login` contains a Formik email/password form that authenticates against the stored bcrypt password hash, and Google OAuth sign-in when `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are configured. Google sign-in requires a verified email and reuses or creates the corresponding local user.
- Board-collection loading, empty, missing-user, and query-error states are separate.
- The board collection and board details use separate loading fallback components.
- New card attachments are uploaded server-side to authenticated Cloudinary assets and downloaded through the board-access-checked attachment API. Existing local storage keys remain readable for files that are still present on the server.
- The home UI follows Atomic Design under `app/components/atoms`, `molecules`, `organisms`, and `templates`. Route-level board-collection data and state are in `app/features/board-collection`.
- Domain action modules and contracts are separated by entity: `app/actions/workspaces.ts`, `boards.ts`, `lists.ts` and `app/types/workspace.ts`, `board.ts`.
- The `app/(user)/layout.tsx` route-group layout renders the shared account header for both the board collection and board detail pages; page-specific controls remain within their feature content.
- Workspace and board identifiers in client-facing routes are AES-256-GCM encrypted. The board collection groups workspace boards in horizontally scrollable cards; board cards do not have drag-and-drop controls. Board detail supports horizontal list ordering and card reordering within a list or moving cards between lists; card list and position changes persist transactionally through an access-checked server action. After each drag-end the client applies the new order immediately and enqueues the persist payload on a serial queue, so later drag events are not blocked while earlier saves are still in flight.
- Prisma Client is cached on `globalThis` per Node.js runtime. The MariaDB adapter pool is limited to two connections per runtime; separate Vercel serverless runtimes each have their own pool, so aggregate connections may still exceed a small MySQL server's limit. Interactive transactions allow 20 seconds to acquire a connection and 30 seconds to complete.
- Workspace records store a preset hex background in `background_color`; create-workspace UI writes it with an ADMIN membership and navigates using the encrypted workspace ID.
- Workspace-level board creation appends a board using the last active board's position plus `1000`, inside a transaction. Board detail displays lists (columns), can append a list in position order, and persists drag-and-drop reordering to list positions.
- Cards can be dragged from anywhere on the card, edited from a hover control, and marked completed with a hover checkbox. `card.is_completed` is persisted and synchronized with `completed_at`.
- Moving cards between lists records a `card_moved` activity log in the same transaction as the reorder, with the actor, card, source list, and destination list.
- Marking a card complete or incomplete records `card_completed` or `card_uncompleted` in the same transaction as the status update; repeated requests that do not change the status do not create duplicate activity entries.
- Updating card dates records `card_dates_updated` only when a date value changes. Adding or removing a card member records `card_member_added` or `card_member_removed` atomically with the membership change.
- Board detail loads each card's comments and activity logs in the authorized `getBoardByToken` query; the card detail dialog renders that preloaded feed and updates it locally when a comment is created.
- Clicking a card opens a detail dialog with editable description, card-member assignment by email, and optional start/end dates. Card start dates are stored in `card.start_date`; end dates use `card.due_date`.

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
