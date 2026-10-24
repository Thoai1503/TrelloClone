# Resolved issues

## Prisma schema validation

The schema previously failed validation due to malformed multiline relation attributes, duplicate `created_by` fields, a board relation using `workspaceId` instead of the declared `workspace_id`, missing `WorkspaceRole`, and an incompatible membership user-ID type. The schema was corrected, the role enum and user back-relation were added, and the membership user ID was aligned to the unsigned integer user primary key. Validate future schema edits with `npx prisma validate`.

## Runtime user and workspace loading

The workspace listing originally used a mock user ID directly and queried from the page feature. User lookup now happens in the root server provider and is shared through a local context. Workspace querying remains in a separate server action and is called by the workspace feature.

With Cache Components enabled, request-time database work must sit behind a `Suspense` boundary. The root server provider uses `connection()` below that boundary so the route can keep its static shell and stream its dynamic content.

## Workspace detail URLs and board ordering

Workspace links now carry AES-GCM opaque tokens instead of exposing a workspace primary key. Server reads and reorder writes verify the mock user's workspace access independently; invalid tokens and inaccessible workspaces render as not found. Board order updates validate the complete active-board ID set and persist positions transactionally. The board row's existing `position` column is reused; no migration is needed.

The workspace detail view also supports appending boards. Creation re-checks workspace access in a database transaction, calculates a position after the last active board, and returns only serializable board fields to the UI.
