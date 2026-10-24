"use server";

import {
  decryptBoardId,
  decryptWorkspaceId,
  encryptBoardId,
  encryptWorkspaceId,
} from "@/utils/resource-id";
import { getCurrentUser } from "@/utils/auth-session";
import { prisma } from "@/lib/prisma";
import type { BoardDetail, BoardSummary } from "@/app/types/board";
import { isWorkspaceColor } from "@/utils/workspace-colors";

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
        where: { user_id: userId },
        select: { role: true },
        take: 1,
      },
      lists: {
        where: { archived_at: null },
        select: {
          id: true,
          name: true,
          cards: {
            where: { archived_at: null },
            select: { id: true, title: true },
            orderBy: [{ position: "asc" }, { id: "asc" }],
          },
        },
        orderBy: [{ position: "asc" }, { id: "asc" }],
      },
    },
  });

  if (!board) return null;

  const canManageLists =
    board.created_by === currentUserId ||
    board.workspace.created_by === currentUserId ||
    board.workspace.members.length > 0 ||
    board.board_members.some((member) => member.role !== "VIEWER");

  return {
    encryptedId: token,
    name: board.name,
    backgroundColor: board.backgroundColor,
    workspaceEncryptedId: encryptWorkspaceId(board.workspace.id),
    workspaceName: board.workspace.name,
    canManageLists,
    lists: board.lists.map((list) => ({
      id: list.id.toString(),
      name: list.name,
      cards: list.cards.map((card) => ({
        id: card.id.toString(),
        title: card.title,
      })),
    })),
  };
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
