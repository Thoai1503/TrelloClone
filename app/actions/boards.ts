"use server";

import {
  decryptBoardId,
  decryptWorkspaceId,
  encryptBoardId,
  encryptWorkspaceId,
} from "@/utils/resource-id";
import { getCurrentUser } from "@/utils/auth-session";
import { prisma } from "@/lib/prisma";
import type {
  CardActivityFeedItem,
  BoardDetail,
  BoardMemberCandidate,
  BoardMemberRole,
  BoardMemberSummary,
  BoardSummary,
} from "@/app/types/board";
import { isWorkspaceColor } from "@/utils/workspace-colors";
import { Prisma } from "@/generated/prisma/client";

type BoardMemberAccess = {
  id: bigint;
  created_by: bigint;
  workspace: {
    created_by: bigint;
    members: { role: "OWNER" | "ADMIN" | "MEMBER" }[];
  };
  board_members: { role: "ADMIN" | "EDITOR" | "VIEWER" }[];
};

type BoardDatabaseClient = typeof prisma | Prisma.TransactionClient;

function getActivityMetadataString(
  metadata: Prisma.JsonValue,
  key: string,
): string | null {
  if (
    typeof metadata !== "object" ||
    metadata === null ||
    Array.isArray(metadata)
  ) {
    return null;
  }

  const value = metadata[key];
  return typeof value === "string" ? value : null;
}

function canManageBoardMembers(
  board: BoardMemberAccess,
  currentUserId: bigint,
): boolean {
  return (
    board.created_by === currentUserId ||
    board.workspace.created_by === currentUserId ||
    board.workspace.members.some(
      (member) => member.role === "OWNER" || member.role === "ADMIN",
    ) ||
    board.board_members.some((member) => member.role === "ADMIN")
  );
}

function canManageBoardAdmins(
  board: BoardMemberAccess,
  currentUserId: bigint,
): boolean {
  return (
    board.created_by === currentUserId ||
    board.workspace.created_by === currentUserId ||
    board.workspace.members.some(
      (member) => member.role === "OWNER" || member.role === "ADMIN",
    )
  );
}

async function findBoardForMemberManagement(
  database: BoardDatabaseClient,
  boardId: bigint,
  currentUserId: number,
) {
  const board = await database.board.findFirst({
    where: {
      id: boardId,
      archived_at: null,
      workspace: { archived_at: null },
    },
    select: {
      id: true,
      created_by: true,
      workspace: {
        select: {
          created_by: true,
          members: {
            where: { user_id: currentUserId },
            select: { role: true },
            take: 1,
          },
        },
      },
      board_members: {
        where: { user_id: currentUserId },
        select: { role: true },
        take: 1,
      },
    },
  });

  if (!board) return null;
  const access: BoardMemberAccess = {
    id: board.id,
    created_by: board.created_by,
    workspace: board.workspace,
    board_members: board.board_members,
  };

  return canManageBoardMembers(access, BigInt(currentUserId)) ? board : null;
}

export async function getBoardByToken(
  token: string,
): Promise<BoardDetail | null> {
  if (typeof token !== "string") return null;

  const boardId = decryptBoardId(token);
  if (boardId === null) return null;

  const currentUser = await getCurrentUser();
  if (!currentUser) return null;

  const userId = currentUser.id;
  const currentUserId = BigInt(userId);
  const board = await prisma.board.findFirst({
    where: {
      id: boardId,
      archived_at: null,
      workspace: { archived_at: null },
      OR: [
        { created_by: currentUserId },
        { board_members: { some: { user_id: userId } } },
        {
          workspace: {
            OR: [
              { created_by: currentUserId },
              { members: { some: { user_id: userId } } },
            ],
          },
        },
      ],
    },
    select: {
      id: true,
      created_by: true,
      name: true,
      backgroundColor: true,
      workspace: {
        select: {
          id: true,
          name: true,
          created_by: true,
          members: {
            where: { user_id: userId },
            select: { role: true },
            take: 1,
          },
        },
      },
      board_members: {
        select: {
          role: true,
          user: {
            select: {
              id: true,
              email: true,
              full_name: true,
              avatar_url: true,
            },
          },
        },
        orderBy: [{ joined_at: "asc" }, { user_id: "asc" }],
      },
      lists: {
        where: { archived_at: null },
        select: {
          id: true,
          name: true,
          cards: {
            where: { archived_at: null },
            select: {
              id: true,
              title: true,
              is_completed: true,
              description: true,
              start_date: true,
              due_date: true,
              members: {
                select: {
                  user: {
                    select: {
                      id: true,
                      email: true,
                      full_name: true,
                      avatar_url: true,
                    },
                  },
                },
                orderBy: [{ assigned_at: "asc" }, { user_id: "asc" }],
              },
              attachments: {
                select: {
                  id: true,
                  file_name: true,
                  mime_type: true,
                  file_size: true,
                  created_at: true,
                },
                orderBy: [{ created_at: "asc" }, { id: "asc" }],
              },
              activity_logs: {
                select: {
                  id: true,
                  action: true,
                  actor: {
                    select: {
                      id: true,
                      email: true,
                      full_name: true,
                      avatar_url: true,
                    },
                  },
                  metadata: true,
                  created_at: true,
                },
              },
              comments: {
                select: {
                  id: true,
                  content: true,
                  created_at: true,
                  user: {
                    select: {
                      id: true,
                      email: true,
                      full_name: true,
                      avatar_url: true,
                    },
                  },
                },
                orderBy: [{ created_at: "asc" }, { id: "asc" }],
              },
            },
            orderBy: [{ position: "asc" }, { id: "asc" }],
          },
        },
        orderBy: [{ position: "asc" }, { id: "asc" }],
      },
    },
  });

  if (!board) return null;

  const currentUserBoardMembership = board.board_members.filter(
    (member) => member.user.id === userId,
  );
  const canManageLists =
    board.created_by === currentUserId ||
    board.workspace.created_by === currentUserId ||
    board.workspace.members.length > 0 ||
    currentUserBoardMembership.some((member) => member.role !== "VIEWER");
  const canManageMembers = canManageBoardMembers(
    {
      id: board.id,
      created_by: board.created_by,
      workspace: board.workspace,
      board_members: currentUserBoardMembership,
    },
    currentUserId,
  );
  const canManageAdminMembers = canManageBoardAdmins(
    {
      id: board.id,
      created_by: board.created_by,
      workspace: board.workspace,
      board_members: currentUserBoardMembership,
    },
    currentUserId,
  );

  return {
    encryptedId: token,
    name: board.name,
    backgroundColor: board.backgroundColor,
    workspaceEncryptedId: encryptWorkspaceId(board.workspace.id),
    workspaceName: board.workspace.name,
    canManageLists,
    canManageMembers,
    canManageAdminMembers,
    members: board.board_members.map((member) => ({
      ...member.user,
      role: member.role,
      isProtected:
        BigInt(member.user.id) === board.created_by ||
        BigInt(member.user.id) === board.workspace.created_by,
    })),
    lists: board.lists.map((list) => ({
      id: list.id.toString(),
      name: list.name,
      cards: list.cards.map((card) => {
        const activityFeed: CardActivityFeedItem[] = [
          ...card.comments.map((comment) => ({
            kind: "comment" as const,
            id: comment.id.toString(),
            content: comment.content,
            created_at: comment.created_at.toISOString(),
            author: comment.user,
          })),
          ...card.activity_logs.map((activity) => ({
            kind: "activity" as const,
            id: activity.id.toString(),
            action: activity.action,
            created_at: activity.created_at.toISOString(),
            actor: activity.actor,
            cardTitle: getActivityMetadataString(
              activity.metadata,
              "cardTitle",
            ),
            fromListName: getActivityMetadataString(
              activity.metadata,
              "fromListName",
            ),
            toListName: getActivityMetadataString(
              activity.metadata,
              "toListName",
            ),
            fromStartDate: getActivityMetadataString(
              activity.metadata,
              "fromStartDate",
            ),
            toStartDate: getActivityMetadataString(
              activity.metadata,
              "toStartDate",
            ),
            fromEndDate: getActivityMetadataString(
              activity.metadata,
              "fromEndDate",
            ),
            toEndDate: getActivityMetadataString(
              activity.metadata,
              "toEndDate",
            ),
            memberName: getActivityMetadataString(
              activity.metadata,
              "memberName",
            ),
          })),
        ].sort(
          (first, second) =>
            Date.parse(second.created_at) - Date.parse(first.created_at) ||
            second.id.localeCompare(first.id),
        );

        return {
          id: card.id.toString(),
          title: card.title,
          is_completed: card.is_completed,
          description: card.description,
          start_date: card.start_date?.toISOString() ?? null,
          due_date: card.due_date?.toISOString() ?? null,
          members: card.members.map(({ user: member }) => member),
          attachments: card.attachments.map((attachment) => ({
            id: attachment.id.toString(),
            file_name: attachment.file_name,
            mime_type: attachment.mime_type,
            file_size: attachment.file_size?.toString() ?? null,
            created_at: attachment.created_at.toISOString(),
            download_url: `/api/attachments/${attachment.id.toString()}`,
          })),
          activityFeed,
        };
      }),
    })),
  };
}

export async function findBoardMemberCandidate(
  boardToken: string,
  emailInput: string,
): Promise<BoardMemberCandidate | null> {
  if (
    typeof boardToken !== "string" ||
    typeof emailInput !== "string" ||
    emailInput.length > 255
  ) {
    return null;
  }

  const email = emailInput.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return null;

  const boardId = decryptBoardId(boardToken);
  if (boardId === null) return null;

  const currentUser = await getCurrentUser();
  if (!currentUser) return null;

  const board = await findBoardForMemberManagement(
    prisma,
    boardId,
    currentUser.id,
  );
  if (!board) return null;

  const candidate = await prisma.user.findFirst({
    where: {
      email,
      board_members: { none: { board_id: board.id } },
    },
    select: {
      id: true,
      email: true,
      full_name: true,
      avatar_url: true,
    },
  });

  return candidate;
}

export async function addBoardMember(
  boardToken: string,
  memberId: number,
): Promise<BoardMemberSummary | null> {
  if (
    typeof boardToken !== "string" ||
    !Number.isSafeInteger(memberId) ||
    memberId < 1
  ) {
    return null;
  }

  const boardId = decryptBoardId(boardToken);
  if (boardId === null) return null;

  const currentUser = await getCurrentUser();
  if (!currentUser) return null;

  return prisma.$transaction(async (transaction) => {
    const board = await findBoardForMemberManagement(
      transaction,
      boardId,
      currentUser.id,
    );
    if (!board) return null;

    const user = await transaction.user.findUnique({
      where: { id: memberId },
      select: {
        id: true,
        email: true,
        full_name: true,
        avatar_url: true,
      },
    });
    if (!user) return null;

    const membership = await transaction.board_member.upsert({
      where: {
        board_id_user_id: { board_id: board.id, user_id: memberId },
      },
      create: {
        board_id: board.id,
        user_id: memberId,
        role: "EDITOR",
      },
      update: {},
      select: { role: true },
    });

    return { ...user, role: membership.role };
  });
}

export async function updateBoardMemberRole(
  boardToken: string,
  memberId: number,
  role: BoardMemberRole,
): Promise<BoardMemberSummary | null> {
  if (
    typeof boardToken !== "string" ||
    !Number.isSafeInteger(memberId) ||
    memberId < 1 ||
    !["ADMIN", "EDITOR", "VIEWER"].includes(role)
  ) {
    return null;
  }

  const boardId = decryptBoardId(boardToken);
  if (boardId === null) return null;

  const currentUser = await getCurrentUser();
  if (!currentUser) return null;

  return prisma.$transaction(async (transaction) => {
    const board = await findBoardForMemberManagement(
      transaction,
      boardId,
      currentUser.id,
    );
    if (!board) return null;

    const target = await transaction.board_member.findUnique({
      where: {
        board_id_user_id: { board_id: board.id, user_id: memberId },
      },
      select: {
        role: true,
        user: {
          select: {
            id: true,
            email: true,
            full_name: true,
            avatar_url: true,
          },
        },
      },
    });
    if (!target) return null;

    const access: BoardMemberAccess = {
      id: board.id,
      created_by: board.created_by,
      workspace: board.workspace,
      board_members: board.board_members,
    };
    const canManageAdmins = canManageBoardAdmins(
      access,
      BigInt(currentUser.id),
    );
    const targetIsProtected =
      BigInt(memberId) === board.created_by ||
      BigInt(memberId) === board.workspace.created_by;
    if (
      targetIsProtected ||
      (target.role === "ADMIN" && !canManageAdmins) ||
      (target.role === "ADMIN" &&
        role !== "ADMIN" &&
        (await transaction.board_member.count({
          where: {
            board_id: board.id,
            role: "ADMIN",
            user_id: { not: memberId },
          },
        })) === 0)
    ) {
      return null;
    }

    const updated = await transaction.board_member.update({
      where: {
        board_id_user_id: { board_id: board.id, user_id: memberId },
      },
      data: { role },
      select: { role: true },
    });

    return { ...target.user, role: updated.role };
  });
}

export async function removeBoardMember(
  boardToken: string,
  memberId: number,
): Promise<boolean> {
  if (
    typeof boardToken !== "string" ||
    !Number.isSafeInteger(memberId) ||
    memberId < 1
  ) {
    return false;
  }

  const boardId = decryptBoardId(boardToken);
  if (boardId === null) return false;

  const currentUser = await getCurrentUser();
  if (!currentUser) return false;

  return prisma.$transaction(async (transaction) => {
    const board = await findBoardForMemberManagement(
      transaction,
      boardId,
      currentUser.id,
    );
    if (!board) return false;

    const target = await transaction.board_member.findUnique({
      where: {
        board_id_user_id: { board_id: board.id, user_id: memberId },
      },
      select: { role: true },
    });
    if (!target) return false;

    const access: BoardMemberAccess = {
      id: board.id,
      created_by: board.created_by,
      workspace: board.workspace,
      board_members: board.board_members,
    };
    const canManageAdmins = canManageBoardAdmins(
      access,
      BigInt(currentUser.id),
    );
    const targetIsProtected =
      BigInt(memberId) === board.created_by ||
      BigInt(memberId) === board.workspace.created_by;
    if (
      targetIsProtected ||
      (target.role === "ADMIN" && !canManageAdmins) ||
      (target.role === "ADMIN" &&
        (await transaction.board_member.count({
          where: {
            board_id: board.id,
            role: "ADMIN",
            user_id: { not: memberId },
          },
        })) === 0)
    ) {
      return false;
    }

    await transaction.board_member.delete({
      where: {
        board_id_user_id: { board_id: board.id, user_id: memberId },
      },
    });
    return true;
  });
}

export async function createBoard(
  workspaceToken: string,
  name: string,
  backgroundColor: string,
): Promise<BoardSummary | null> {
  if (
    typeof workspaceToken !== "string" ||
    typeof name !== "string" ||
    !isWorkspaceColor(backgroundColor)
  ) {
    return null;
  }

  const trimmedName = name.trim();
  if (!trimmedName || trimmedName.length > 150) return null;

  const workspaceId = decryptWorkspaceId(workspaceToken);
  if (workspaceId === null) return null;

  const currentUser = await getCurrentUser();
  if (!currentUser) return null;

  const userId = currentUser.id;
  const currentUserId = BigInt(userId);

  return prisma.$transaction(async (transaction) => {
    const workspace = await transaction.workspace.findFirst({
      where: {
        id: workspaceId,
        archived_at: null,
        OR: [
          { created_by: currentUserId },
          { members: { some: { user_id: userId } } },
        ],
      },
      select: { id: true, backgroundColor: true },
    });

    if (!workspace) return null;

    const board = await transaction.board.create({
      data: {
        workspace_id: workspace.id,
        created_by: currentUserId,
        backgroundColor,
        name: trimmedName,

        board_members: {
          create: {
            user_id: userId,
            role: "ADMIN",
          },
        },
      },
      select: {
        id: true,
        name: true,
        description: true,
        backgroundColor: true,
        _count: {
          select: {
            board_members: true,
            lists: { where: { archived_at: null } },
          },
        },
      },
    });

    return {
      encryptedId: encryptBoardId(board.id),
      name: board.name,
      description: board.description,
      backgroundColor: board.backgroundColor,
      listCount: board._count.lists,
      memberCount: board._count.board_members,
    };
  });
}
