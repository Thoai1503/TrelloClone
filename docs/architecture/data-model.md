# Database model

The Prisma schema uses MySQL. This diagram reflects the relations currently declared in `prisma/schema.prisma`.

```mermaid
erDiagram
    user ||--o{ workspace_member : joins
    workspace ||--o{ workspace_member : has
    workspace ||--o{ board : contains
    user ||--o{ board_member : joins
    board ||--o{ board_member : has
    board ||--o{ list : contains
    list ||--o{ card : contains
    user ||--o{ card : creates
    user ||--o{ card_member : assigned
    card ||--o{ card_member : has

    user {
        int id PK
        string email
        string full_name
        text avatar_url
    }
    workspace {
        bigint id PK
        string name
        string description
        string background_color
        bigint created_by
        datetime archived_at
    }
    workspace_member {
        bigint workspace_id PK, FK
        int user_id PK, FK
        enum role
        datetime joined_at
    }
    board {
        bigint id PK
        bigint workspace_id FK
        bigint created_by
        string background_color
        decimal position
        string name
        datetime archived_at
    }
    board_member {
        bigint board_id PK, FK
        int user_id PK, FK
        enum role
    }
    list {
        bigint id PK
        bigint board_id FK
        string name
        decimal position
        datetime archived_at
    }
    card {
        bigint id PK
        bigint list_id FK
        int created_by FK
        string title
        enum priority
        boolean is_completed
        decimal position
        datetime archived_at
    }
    card_member {
        bigint card_id PK, FK
        int user_id PK, FK
        datetime assigned_at
    }
```

## Verified relations and constraints

- `workspace_member` has a composite primary key of `(workspace_id, user_id)`.
- `workspace_member.workspace_id` references `workspace.id`; deleting a workspace cascades to membership rows.
- `workspace_member.user_id` is an unsigned integer matching `user.id`; deleting a user cascades to membership rows.
- `board.workspace_id` references `workspace.id`; deleting a workspace cascades to its boards.
- `board_member.board_id` references `board.id`; `board_member.user_id` references `user.id`.
- `list.board_id` references `board.id`; deleting a board cascades to its lists and board memberships.
- `card.list_id` references `list.id`; `card.created_by` references `user.id`.
- `card_member.card_id` references `card.id`; `card_member.user_id` references `user.id`.
- `CardPriority` supports `LOW`, `MEDIUM`, `HIGH`, and `URGENT`, defaulting to `MEDIUM`.
- `workspace.created_by` and `board.created_by` are indexed/stored scalar fields, not Prisma relations to `user` in the current schema. `card.created_by` is an unsigned integer relation to `user.id`.
- Workspace and board archive timestamps are nullable. Workspace listing filters out archived workspaces and counts only active boards accessible to the current user.

## Workspace listing

`getAccessibleWorkspaces` returns active workspaces created by the current user, linked through `workspace_member`, or containing boards the user can access through `board_member`. It returns only the active boards the user can access, uses encrypted IDs in client-facing links, and includes the user's workspace role and board/member counts. A creator is treated as an admin even if no separate membership row exists.

The workspace list returns each active workspace and its accessible active boards. Client-facing board links expose only randomized encrypted board tokens, not database board IDs. Board detail reads and list/card creation or reorder actions decrypt the token on the server and independently verify that the authenticated user created the board, is a board member, or belongs to its workspace. Boards are ordered by `created_at`, then `id`; lists and cards are ordered by `position`, then `id`. List and card creation append after the last active record using `position + 1000`. Card reorder validates the complete set of active card IDs for the target list and writes their positions transactionally.

Creating a board verifies workspace access inside a Prisma transaction, assigns the board to the workspace, and records it as created by the authenticated user. Board display order is based on its creation time.

New workspaces store a validated preset hex color in `workspace.background_color`. New boards store a validated selected color. Workspace creation runs in a transaction, writes an ADMIN membership for the authenticated user, and returns only an encrypted workspace identifier. Lists and cards are created at the next active position (`last position + 1000`, or `1000` for the first item).
