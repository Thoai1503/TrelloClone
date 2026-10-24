# Current project state

Last verified: 2026-10-24.

## Implemented

- The app is a Next.js 16 App Router project using React 19, TypeScript, Tailwind CSS 4, Prisma 7, and MySQL.
- `app/layout.tsx` wraps routes in a server-side `CurrentUserProvider` and a client-side `UserProvider`.
- Authentication is not implemented. `CurrentUserProvider` temporarily loads database user ID `1`.
- The home route shows the user's active workspaces, including workspaces they created and workspaces where they have a membership row.
- Workspace loading, empty, missing-user, and query-error states are separate.
- The home UI follows Atomic Design under `app/components/atoms`, `molecules`, `organisms`, and `templates`. Route-level workspace data and state are in `app/features/workspaces`.
- Workspace cards link to an AES-256-GCM encrypted workspace identifier. The detail screen displays active boards in a horizontally scrollable, sortable `@dnd-kit` list and persists reordered positions.
- The workspace detail view provides an "add another list" form. New boards are appended using the last active board's position plus `1000`, inside a transaction.

## Verified constraints

- `user.id` and `workspace_member.user_id` are unsigned integers. Workspace and board identifiers and creator IDs are `BigInt`.
- `WORKSPACE_ID_ENCRYPTION_KEY` must be set to 64 hexadecimal characters and kept consistent across deployments.
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
