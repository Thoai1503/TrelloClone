"use server";

import { decryptBoardId } from "@/utils/resource-id";
import { getCurrentUser } from "@/utils/auth-session";
import { prisma } from "@/lib/prisma";
import type { BoardList } from "@/app/types/board";

export async function createBoardList(
  boardToken: string,
  name: string,
): Promise<BoardList | null> {
  if (typeof boardToken !== "string" || typeof name !== "string") return null;

  const trimmedName = name.trim();
  if (!trimmedName || trimmedName.length > 150) return null;

  const boardId = decryptBoardId(boardToken);
  if (boardId === null) return null;

  const currentUser = await getCurrentUser();
  if (!currentUser) return null;

  const userId = currentUser.id;
  const currentUserId = BigInt(userId);

  return prisma.$transaction(async (transaction) => {
    const board = await transaction.board.findFirst({
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
        workspace: {
          select: {
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
      },
    });

    if (!board) return null;
    const canManageBoardLists =
      board.created_by === currentUserId ||
      board.workspace.created_by === currentUserId ||
      board.workspace.members.length > 0 ||
      board.board_members.some((member) => member.role !== "VIEWER");

    if (!canManageBoardLists) return null;

    const lastList = await transaction.list.findFirst({
      where: { board_id: board.id, archived_at: null },
      select: { position: true },
      orderBy: [{ position: "desc" }, { id: "desc" }],
    });
    const position = lastList ? lastList.position.plus(1000) : 1000;
    const list = await transaction.list.create({
      data: { board_id: board.id, name: trimmedName, position },
      select: { id: true, name: true },
    });

    return { id: list.id.toString(), name: list.name };
  });
}

export async function reorderBoardLists(
  boardToken: string,
  orderedListIds: string[],
): Promise<boolean> {
  if (
    typeof boardToken !== "string" ||
    !Array.isArray(orderedListIds) ||
    !orderedListIds.every(
      (id) => typeof id === "string" && id.length <= 19 && /^\d+$/.test(id),
    )
  ) {
    return false;
  }

  const boardId = decryptBoardId(boardToken);
  if (boardId === null) return false;

  const listIds = orderedListIds.map((id) => BigInt(id));
  if (new Set(listIds.map(String)).size !== listIds.length) return false;

  const currentUser = await getCurrentUser();
  if (!currentUser) return false;

  const userId = currentUser.id;
  const currentUserId = BigInt(userId);
  return prisma.$transaction(async (transaction) => {
    const board = await transaction.board.findFirst({
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
        workspace: {
          select: {
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
          select: { id: true },
        },
      },
    });

    if (!board) return false;

    const canManageBoardLists =
      board.created_by === currentUserId ||
      board.workspace.created_by === currentUserId ||
      board.workspace.members.length > 0 ||
      board.board_members.some((member) => member.role !== "VIEWER");
    if (!canManageBoardLists || board.lists.length !== listIds.length) return false;

    const activeListIds = new Set(board.lists.map((list) => list.id.toString()));
    if (!listIds.every((id) => activeListIds.has(id.toString()))) return false;

    for (const [index, listId] of listIds.entries()) {
      await transaction.list.updateMany({
        where: { id: listId, board_id: board.id, archived_at: null },
        data: { position: index * 1000 },
      });
    }

    return true;
  });
}
