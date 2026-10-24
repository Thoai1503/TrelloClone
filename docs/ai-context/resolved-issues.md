# Resolved issues

## Prisma schema validation

The schema previously failed validation due to malformed multiline relation attributes, duplicate `created_by` fields, a board relation using `workspaceId` instead of the declared `workspace_id`, missing `WorkspaceRole`, and an incompatible membership user-ID type. The schema was corrected, the role enum and user back-relation were added, and the membership user ID was aligned to the unsigned integer user primary key. Validate future schema edits with `npx prisma validate`.

## Runtime user and workspace loading

The workspace listing originally used a mock user ID directly and queried from the page feature. User lookup now happens in the root server provider and is shared through a local context. Workspace querying remains in a separate server action and is called by the workspace feature.

With Cache Components enabled, request-time database work must sit behind a `Suspense` boundary. The root server provider uses `connection()` below that boundary so the route can keep its static shell and stream its dynamic content.

## Workspace/board URLs and board ordering

Workspace and board links use AES-GCM opaque tokens instead of exposing primary keys. Server reads and writes verify the authenticated session user's workspace or board access independently; invalid tokens and inaccessible resources render as not found. Board cards are not draggable; their displayed order follows the existing board `position` column.

The workspace list now shows boards under each workspace, supports board creation, and routes to `/board/{encryptedBoardId}`. Board detail loads active lists, supports appending a list after the current last position, and supports drag-and-drop ordering with persisted list positions. Domain modules use `workspaces.ts`, `boards.ts`, and `lists.ts` for server actions and separate `workspace.ts`/`board.ts` type contracts. Server actions verify the authenticated user has workspace or board access before reads and writes.
