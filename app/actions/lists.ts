"use server";

import { decryptBoardId } from "@/utils/resource-id";
import { getCurrentUser } from "@/utils/auth-session";
import { prisma } from "@/lib/prisma";
import type { BoardList, BoardTask } from "@/app/types/board";

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

    return { id: list.id.toString(), name: list.name, cards: [] };
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

export async function createListCard(
  boardToken: string,
  listId: string,
  title: string,
): Promise<BoardTask | null> {
  if (
    typeof boardToken !== "string" ||
    typeof listId !== "string" ||
    listId.length > 19 ||
    !/^\d+$/.test(listId) ||
    typeof title !== "string"
  ) {
    return null;
  }

  const trimmedTitle = title.trim();
  if (!trimmedTitle || trimmedTitle.length > 255) return null;

  const boardId = decryptBoardId(boardToken);
  if (boardId === null) return null;

  const currentUser = await getCurrentUser();
  if (!currentUser) return null;

  const userId = currentUser.id;
  const currentUserId = BigInt(userId);
  const parsedListId = BigInt(listId);

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

    const canManageCards =
      board.created_by === currentUserId ||
      board.workspace.created_by === currentUserId ||
      board.workspace.members.length > 0 ||
      board.board_members.some((member) => member.role !== "VIEWER");
    if (!canManageCards) return null;

    const list = await transaction.list.findFirst({
      where: {
        id: parsedListId,
        board_id: board.id,
        archived_at: null,
      },
      select: { id: true },
    });
    if (!list) return null;

    const lastCard = await transaction.card.findFirst({
      where: { list_id: list.id, archived_at: null },
      select: { position: true },
      orderBy: [{ position: "desc" }, { id: "desc" }],
    });
    const position = lastCard ? lastCard.position.plus(1000) : 1000;

    const card = await transaction.card.create({
      data: {
        list_id: list.id,
        created_by: userId,
        title: trimmedTitle,
        position,
      },
      select: { id: true, title: true, is_completed: true },
    });

    return {
      id: card.id.toString(),
      title: card.title,
      is_completed: card.is_completed,
    };
  });
}

export async function updateListCardTitle(
  boardToken: string,
  cardId: string,
  title: string,
): Promise<BoardTask | null> {
  if (
    typeof boardToken !== "string" ||
    typeof cardId !== "string" ||
    cardId.length > 19 ||
    !/^\d+$/.test(cardId) ||
    typeof title !== "string"
  ) {
    return null;
  }

  const trimmedTitle = title.trim();
  if (!trimmedTitle || trimmedTitle.length > 255) return null;

  const boardId = decryptBoardId(boardToken);
  if (boardId === null) return null;

  const currentUser = await getCurrentUser();
  if (!currentUser) return null;

  const userId = currentUser.id;
  const currentUserId = BigInt(userId);
  const parsedCardId = BigInt(cardId);

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

    const canManageCards =
      board.created_by === currentUserId ||
      board.workspace.created_by === currentUserId ||
      board.workspace.members.length > 0 ||
      board.board_members.some((member) => member.role !== "VIEWER");
    if (!canManageCards) return null;

    const card = await transaction.card.updateMany({
      where: {
        id: parsedCardId,
        archived_at: null,
        list: { board_id: board.id, archived_at: null },
      },
      data: { title: trimmedTitle },
    });
    if (card.count !== 1) return null;

    const updatedCard = await transaction.card.findUnique({
      where: { id: parsedCardId },
      select: { id: true, title: true, is_completed: true },
    });
    if (!updatedCard) return null;

    return {
      id: updatedCard.id.toString(),
      title: updatedCard.title,
      is_completed: updatedCard.is_completed,
    };
  });
}

export async function setListCardCompleted(
  boardToken: string,
  cardId: string,
  isCompleted: boolean,
): Promise<BoardTask | null> {
  if (
    typeof boardToken !== "string" ||
    typeof cardId !== "string" ||
    cardId.length > 19 ||
    !/^\d+$/.test(cardId) ||
    typeof isCompleted !== "boolean"
  ) {
    return null;
  }

  const boardId = decryptBoardId(boardToken);
  if (boardId === null) return null;

  const currentUser = await getCurrentUser();
  if (!currentUser) return null;

  const userId = currentUser.id;
  const currentUserId = BigInt(userId);
  const parsedCardId = BigInt(cardId);

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

    const canManageCards =
      board.created_by === currentUserId ||
      board.workspace.created_by === currentUserId ||
      board.workspace.members.length > 0 ||
      board.board_members.some((member) => member.role !== "VIEWER");
    if (!canManageCards) return null;

    const card = await transaction.card.updateMany({
      where: {
        id: parsedCardId,
        archived_at: null,
        list: { board_id: board.id, archived_at: null },
      },
      data: {
        is_completed: isCompleted,
        completed_at: isCompleted ? new Date() : null,
      },
    });
    if (card.count !== 1) return null;

    const updatedCard = await transaction.card.findUnique({
      where: { id: parsedCardId },
      select: { id: true, title: true, is_completed: true },
    });
    if (!updatedCard) return null;

    return {
      id: updatedCard.id.toString(),
      title: updatedCard.title,
      is_completed: updatedCard.is_completed,
    };
  });
}

export async function reorderBoardCards(
  boardToken: string,
  orderedLists: { listId: string; cardIds: string[] }[],
): Promise<boolean> {
  if (
    typeof boardToken !== "string" ||
    !Array.isArray(orderedLists) ||
    orderedLists.length < 1 ||
    orderedLists.length > 2 ||
    !orderedLists.every(
      (list) =>
        typeof list === "object" &&
        list !== null &&
        !Array.isArray(list) &&
        typeof list.listId === "string" &&
        list.listId.length <= 19 &&
        /^\d+$/.test(list.listId) &&
        Array.isArray(list.cardIds) &&
        list.cardIds.every(
          (id) => typeof id === "string" && id.length <= 19 && /^\d+$/.test(id),
        ),
    )
  ) {
    return false;
  }

  const boardId = decryptBoardId(boardToken);
  if (boardId === null) return false;

  const parsedLists = orderedLists.map(({ listId, cardIds }) => ({
    id: BigInt(listId),
    cardIds: cardIds.map((id) => BigInt(id)),
  }));
  const allListIds = parsedLists.map((list) => list.id.toString());
  const allCardIds = parsedLists.flatMap((list) =>
    list.cardIds.map((id) => id.toString()),
  );
  if (
    new Set(allListIds).size !== parsedLists.length ||
    new Set(allCardIds).size !== allCardIds.length
  ) {
    return false;
  }

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
      },
    });
    if (!board) return false;

    const canManageCards =
      board.created_by === currentUserId ||
      board.workspace.created_by === currentUserId ||
      board.workspace.members.length > 0 ||
      board.board_members.some((member) => member.role !== "VIEWER");
    if (!canManageCards) return false;

    const lists = await transaction.list.findMany({
      where: {
        id: { in: parsedLists.map((list) => list.id) },
        board_id: board.id,
        archived_at: null,
      },
      select: {
        id: true,
        cards: {
          where: { archived_at: null },
          select: { id: true },
        },
      },
    });
    if (lists.length !== parsedLists.length) return false;

    const activeCardIds = new Set(
      lists.flatMap((list) => list.cards.map((card) => card.id.toString())),
    );
    if (
      activeCardIds.size !== allCardIds.length ||
      !allCardIds.every((id) => activeCardIds.has(id))
    ) {
      return false;
    }

    for (const orderedList of parsedLists) {
      for (const [index, cardId] of orderedList.cardIds.entries()) {
        await transaction.card.updateMany({
          where: {
            id: cardId,
            list_id: { in: parsedLists.map((list) => list.id) },
            archived_at: null,
          },
          data: {
            list_id: orderedList.id,
            position: index * 1000,
          },
        });
      }
    }

    return true;
  });
}
