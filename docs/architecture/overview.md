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
├── providers/                  Shared server/client React context
├── (user)/                     Authenticated workspace route group and shared user header
├── features/                   Route-level feature state and orchestration
├── types/                      Shared serializable application data contracts
├── (user)/u/[username]/board/   Current user's workspace list
├── (user)/workspaces/[workspaceId]/ Workspace detail route with opaque ID param
└── components/
    ├── atoms/                  UI primitives
    ├── molecules/              Small compositions of atoms
    ├── organisms/              Feature-level UI sections
    └── templates/              Page layouts composed from organisms
lib/
└── prisma.ts                   Shared Prisma Client and MariaDB adapter
utils/
├── workspace-id.ts             AES-256-GCM opaque workspace identifiers
└── workspace-background.ts     Board background presentation helper
prisma/
└── schema.prisma               MySQL data model
```

The component dependency direction is one-way: atoms may not depend on higher layers; molecules compose atoms; organisms compose atoms and molecules; templates compose lower layers. Feature orchestration lives outside the visual component hierarchy.

The `(user)` route-group layout renders one shared account header for the workspace list and workspace detail routes. Page-specific search and workspace navigation remain in their respective page content.

The login route uses a Formik client form and NextAuth's Credentials provider to verify bcrypt password hashes. NextAuth stores a seven-day encrypted JWT session in its HttpOnly cookie. The server-side current-user provider passes the session into `SessionProvider`, reloads the user profile from Prisma, and supplies that profile to the local `UserProvider`. Workspace server actions derive authorization from this session rather than accepting a user ID from the browser. Google sign-in remains presentation-only.

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
    WorkspaceRoute --> Feature["WorkspacePageContent"]
    Feature --> UserHook["useUser()"]
    Feature --> WorkspaceAction["findWorkspacesByUserId() resolves session"]
    WorkspaceAction --> Prisma
    Feature --> Template["WorkspaceHome template"]
    Template --> Organisms["Header, sidebar, workspace list"]
    Organisms --> Molecules["Workspace card, search, empty state, counter"]
    Molecules --> Atoms["Avatar, button, icon"]
```

The current-user provider awaits `connection()` before resolving the NextAuth session and loading the user profile. It is rendered beneath a root-layout `Suspense` boundary, provides the session through NextAuth `SessionProvider`, and serializes only a small user projection into the local client context. Workspace records are requested by the client-side feature orchestrator through a server action; the action independently derives identity from the session and returns mapped, serializable data.

### Workspace detail and board ordering

```mermaid
flowchart TD
    Card["WorkspaceCard link"] --> Encrypt["encryptWorkspaceId (AES-256-GCM)"]
    Encrypt --> Url["/workspaces/{opaque-token}"]
    Url --> Detail["WorkspaceDetailPageContent"]
    Detail --> Decrypt["decrypt token on server"]
    Decrypt --> Access["Verify session user owns or belongs to workspace"]
    Access --> Boards["Read active boards ordered by position"]
    Boards --> Dnd["WorkspaceBoardView using @dnd-kit"]
    Dnd --> Save["saveWorkspaceBoardOrder server action"]
    Save --> Verify["Re-verify token, membership and exact active board ID set"]
    Verify --> Transaction["Persist positions in a database transaction"]
```

The workspace encryption key is `WORKSPACE_ID_ENCRYPTION_KEY` (64 hexadecimal characters); session encryption uses NextAuth's separate `NEXTAUTH_SECRET` (at least 32 characters). Both secrets must be configured consistently across instances. AES-GCM tokens are randomized, authenticated opaque identifiers; authorization is always checked against the authenticated session user.

## Error and loading states

- The root layout provides a neutral suspense fallback while the request-time user lookup runs.
- The workspace feature displays a skeleton while workspaces load.
- An unauthenticated or missing user has a not-found state; a failed workspace query has a distinct error state with retry.
- A successful query returning no workspaces displays the empty state.

## Infrastructure

`lib/prisma.ts` creates one shared Prisma Client using the MariaDB adapter and `DATABASE_URL`. Keep database credentials and client imports server-side. See [data-model.md](./data-model.md) for the verified schema relationships.
