# Architecture overview

## Stack

- Next.js 16 App Router with React 19 and TypeScript.
- Tailwind CSS 4 for styling.
- MySQL accessed through Prisma 7 and `@prisma/adapter-mariadb`.
- Prisma schema: `prisma/schema.prisma`; generated client: `generated/prisma/`.

## Module boundaries

```text
app/
├── page.tsx                    Product landing page
├── login/                      Email/password login route
├── api/auth/[...nextauth]/     NextAuth Credentials API endpoint
├── layout.tsx                  Root document and provider boundary
├── actions/                    Server actions for data access
│   ├── workspaces.ts           Workspace listing and creation
│   ├── boards.ts               Board reads and creation
│   └── lists.ts                Board-column/list creation and ordering
├── providers/                  Shared server/client React context
├── (user)/                     Authenticated workspace route group and shared user header
├── features/                   Route-level feature state and orchestration
│   ├── board-collection/        Board collection route orchestration
│   └── boards/                  Board-detail route orchestration
├── types/                      Domain data contracts split by model
├── (user)/u/[username]/board/   Current user's boards grouped by workspace
├── (user)/board/[boardId]/      Board detail route with opaque board ID
└── components/
    ├── atoms/                  UI primitives
    ├── molecules/              Small compositions of atoms
    ├── organisms/              Feature-level UI sections
    └── templates/              Page layouts composed from organisms
lib/
└── prisma.ts                   Shared Prisma Client and MariaDB adapter
utils/
├── resource-id.ts              AES-256-GCM opaque workspace and board identifiers
└── filter-workspaces.ts        Workspace and board search filtering
prisma/
└── schema.prisma               MySQL data model
```

The component dependency direction is one-way: atoms may not depend on higher layers; molecules compose atoms; organisms compose atoms and molecules; templates compose lower layers. Feature orchestration lives outside the visual component hierarchy.

The `(user)` route-group layout renders one shared account header for the board collection and board detail routes. The `/u/{username}/board` page presents horizontal board cards grouped under simple workspace-name headings; workspace cards are not the primary content. Board search results are grouped by workspace and board, while ordering controls are disabled for partial board matches. Empty workspaces retain their board-creation control.

The login route uses a Formik client form and NextAuth's Credentials provider to verify bcrypt password hashes, plus Google OAuth when both Google client environment variables are configured. Google accounts must have a verified email; sign-in reuses the local user with that email or creates a user when no match exists. NextAuth stores a seven-day encrypted JWT session in its HttpOnly cookie. The server-side current-user provider passes the session into `SessionProvider`, reloads the user profile from Prisma, and supplies that profile to the local `UserProvider`. Workspace server actions derive authorization from this session rather than accepting a user ID from the browser.

Board sharing is available to the board creator, workspace owner/admin, or a board ADMIN. The board header displays circular avatars for current `board_member` users, with email tooltips. The share dialog searches for an exact email match, adds selected users as board EDITOR members, and lists current `board_member` records. Search and mutation actions independently verify board-management permission on the server. Cards can be dragged from any part of the card, their hover edit control updates the title, and their hover checkbox updates `is_completed` and `completed_at` through access-checked server actions.

The shared user-header board-creation dialog lets the user choose a manageable workspace. `createBoard` appends the board in that workspace and creates a `board_member` record for the current user with the `ADMIN` role in the same transaction.

Set `NEXTAUTH_SECRET` to a private random value of at least 32 characters in every runtime environment. Do not reuse the workspace ID encryption key.

## Current request and workspace flow

```mermaid
flowchart TD
    Request["Request for an App Router page"] --> Root["app/layout.tsx"]
    Root --> CurrentUser["CurrentUserProvider (server)"]
    CurrentUser --> Session["Read NextAuth JWT session"]
    Session --> FindUser["Load profile by session user ID"]
    FindUser --> Prisma["Shared Prisma Client"]
    Prisma --> MySQL[("MySQL")]
    CurrentUser --> Context["UserProvider (client context)"]
    Context --> Landing["app/page.tsx (product landing)"]
    Landing --> Login["/login"]
    Login --> Authenticate["NextAuth Credentials: verify bcrypt hash"]
    Authenticate --> Cookie["Set encrypted NextAuth JWT cookie"]
    Cookie --> WorkspaceRoute["/u/{username}/board"]
    WorkspaceRoute --> Feature["BoardCollectionPageContent"]
    Feature --> UserHook["useUser()"]
    Feature --> WorkspaceAction["getAccessibleWorkspaces() resolves session"]
    WorkspaceAction --> Prisma
    Feature --> Template["BoardCollectionPage template"]
    Template --> Organisms["Sidebar, board collection"]
    Organisms --> Boards["Workspace headings with horizontal board cards"]
    Boards --> BoardAction["Create boards in workspace"]
    Boards --> BoardRoute["/board/{opaque-board-token}"]
    BoardRoute --> BoardDetail["BoardDetailPageContent"]
    BoardDetail --> Lists["Read/create lists (columns)"]
    Template --> Atoms["Avatar, button, icon"]
```

The current-user provider awaits `connection()` before resolving the NextAuth session and loading the user profile. It is rendered beneath a root-layout `Suspense` boundary, provides the session through NextAuth `SessionProvider`, and serializes only a small user projection into the local client context. Workspace records are requested by the client-side feature orchestrator through a server action; the action independently derives identity from the session and returns mapped, serializable data.

### Board detail and workspace ordering

```mermaid
flowchart TD
    Collection["Board collection grouped by workspace"] --> Boards["Sortable boards within workspace"]
    Boards --> Encrypt["encryptBoardId (AES-256-GCM)"]
    Encrypt --> Url["/board/{opaque-board-token}"]
    Url --> Detail["BoardDetailPageContent"]
    Detail --> Decrypt["decryptBoardId on server"]
    Decrypt --> Access["Verify board creator, board member, or workspace member"]
    Access --> ReadLists["Read active lists ordered by position"]
    ReadLists --> CreateList["createBoardList server action"]
    ReadLists --> ReadCards["Read active cards by list ordered by position"]
    ReadCards --> CreateCard["createListCard validates board access and list membership"]
    CreateCard --> PersistCard["Append card at last position + 1000"]
    Detail --> DragLists["Drag/drop lists with @dnd-kit"]
    DragLists --> ReorderLists["reorderBoardLists validates access and active list IDs"]
    ReorderLists --> Persist["Persist list.position transactionally"]
    ReadCards --> DragCards["Drag/drop cards within and between lists"]
    DragCards --> ReorderCards["reorderBoardCards validates access and affected card IDs"]
    ReorderCards --> PersistCards["Persist card.list_id and card.position transactionally"]
```

The shared AES-256-GCM ID utility encrypts both workspace and board identifiers. The workspace encryption key is `WORKSPACE_ID_ENCRYPTION_KEY` (64 hexadecimal characters); session encryption uses NextAuth's separate `NEXTAUTH_SECRET` (at least 32 characters). Both secrets must be configured consistently across instances. AES-GCM tokens are randomized, authenticated opaque identifiers; authorization is always checked against the authenticated session user.

## Error and loading states

- The root layout provides a neutral suspense fallback while the request-time user lookup runs.
- The board-collection feature displays a skeleton while workspaces and boards load.
- An unauthenticated or missing user has a not-found state; a failed workspace query has a distinct error state with retry.
- A successful query with no boards displays an empty state; accessible empty workspaces remain visible with a board-creation control.

## Infrastructure

`lib/prisma.ts` creates one shared Prisma Client using the MariaDB adapter and `DATABASE_URL`. Keep database credentials and client imports server-side. See [data-model.md](./data-model.md) for the verified schema relationships.
