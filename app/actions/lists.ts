"use server";

import { decryptBoardId } from "@/utils/resource-id";
import { getCurrentUser } from "@/utils/auth-session";
import { prisma } from "@/lib/prisma";
import type {
  BoardList,
  BoardTask,
  CardMemberSummary,
} from "@/app/types/board";
import type { Prisma } from "@/generated/prisma/client";

async function findEditableCardBoard(
  transaction: Prisma.TransactionClient,
  boardId: bigint,
  userId: number,
) {
  const currentUserId = BigInt(userId);
  const board = await transaction.board.findFirst({
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

  return canManageCards ? board : null;
}

function parseOptionalDate(value: string | null): Date | null | undefined {
  if (value === null) return null;
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return undefined;
  }

  const date = new Date(`${value}T00:00:00.000Z`);
  return date.toISOString().slice(0, 10) === value ? date : undefined;
}

function serializeCard(
  card: {
    id: bigint;
    title: string;
    is_completed: boolean;
    description: string | null;
    start_date: Date | null;
    due_date: Date | null;
    members: {
      user: {
        id: number;
        email: string | null;
        full_name: string | null;
        avatar_url: string | null;
      };
    }[];
  },
): BoardTask {
  return {
    id: card.id.toString(),
    title: card.title,
    is_completed: card.is_completed,
    description: card.description,
    start_date: card.start_date?.toISOString() ?? null,
    due_date: card.due_date?.toISOString() ?? null,
    members: card.members.map(({ user }) => user),
  };
}

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
      select: {
        id: true,
        title: true,
        is_completed: true,
        description: true,
        start_date: true,
        due_date: true,
      },
    });

    return {
      id: card.id.toString(),
      title: card.title,
      is_completed: card.is_completed,
      description: card.description,
      start_date: card.start_date?.toISOString() ?? null,
      due_date: card.due_date?.toISOString() ?? null,
      members: [],
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
      },
    });
    if (!updatedCard) return null;

    return {
      id: updatedCard.id.toString(),
      title: updatedCard.title,
      is_completed: updatedCard.is_completed,
      description: updatedCard.description,
      start_date: updatedCard.start_date?.toISOString() ?? null,
      due_date: updatedCard.due_date?.toISOString() ?? null,
      members: updatedCard.members.map(({ user }) => user),
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
      },
    });
    if (!updatedCard) return null;

    return {
      id: updatedCard.id.toString(),
      title: updatedCard.title,
      is_completed: updatedCard.is_completed,
      description: updatedCard.description,
      start_date: updatedCard.start_date?.toISOString() ?? null,
      due_date: updatedCard.due_date?.toISOString() ?? null,
      members: updatedCard.members.map(({ user }) => user),
    };
  });
}

export async function updateCardDetails(
  boardToken: string,
  cardId: string,
  description: string,
  startDate: string | null,
  endDate: string | null,
): Promise<BoardTask | null> {
  if (
    typeof boardToken !== "string" ||
    typeof cardId !== "string" ||
    cardId.length > 19 ||
    !/^\d+$/.test(cardId) ||
    typeof description !== "string" ||
    description.length > 20000 ||
    (startDate !== null && typeof startDate !== "string") ||
    (endDate !== null && typeof endDate !== "string")
  ) {
    return null;
  }

  const parsedStartDate = parseOptionalDate(startDate);
  const parsedEndDate = parseOptionalDate(endDate);
  if (parsedStartDate === undefined || parsedEndDate === undefined) return null;
  if (
    parsedStartDate &&
    parsedEndDate &&
    parsedStartDate.getTime() > parsedEndDate.getTime()
  ) {
    return null;
  }

  const boardId = decryptBoardId(boardToken);
  if (boardId === null) return null;

  const currentUser = await getCurrentUser();
  if (!currentUser) return null;

  const parsedCardId = BigInt(cardId);
  return prisma.$transaction(async (transaction) => {
    const board = await findEditableCardBoard(
      transaction,
      boardId,
      currentUser.id,
    );
    if (!board) return null;

    const updatedCount = await transaction.card.updateMany({
      where: {
        id: parsedCardId,
        archived_at: null,
        list: { board_id: board.id, archived_at: null },
      },
      data: {
        description: description.trim() || null,
        start_date: parsedStartDate,
        due_date: parsedEndDate,
      },
    });
    if (updatedCount.count !== 1) return null;

    const card = await transaction.card.findUnique({
      where: { id: parsedCardId },
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
      },
    });

    return card ? serializeCard(card) : null;
  });
}

export async function findCardMemberCandidate(
  boardToken: string,
  cardId: string,
  emailInput: string,
): Promise<CardMemberSummary | null> {
  if (
    typeof boardToken !== "string" ||
    typeof cardId !== "string" ||
    cardId.length > 19 ||
    !/^\d+$/.test(cardId) ||
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

  return prisma.$transaction(async (transaction) => {
    const board = await findEditableCardBoard(
      transaction,
      boardId,
      currentUser.id,
    );
    if (!board) return null;

    const candidate = await transaction.user.findFirst({
      where: {
        email,
        card_members: {
          none: { card_id: BigInt(cardId) },
        },
      },
      select: {
        id: true,
        email: true,
        full_name: true,
        avatar_url: true,
      },
    });
    if (!candidate) return null;

    const card = await transaction.card.findFirst({
      where: {
        id: BigInt(cardId),
        list: { board_id: board.id, archived_at: null },
        archived_at: null,
      },
      select: { id: true },
    });
    return card ? candidate : null;
  });
}

export async function addCardMember(
  boardToken: string,
  cardId: string,
  memberId: number,
): Promise<CardMemberSummary | null> {
  if (
    typeof boardToken !== "string" ||
    typeof cardId !== "string" ||
    cardId.length > 19 ||
    !/^\d+$/.test(cardId) ||
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
    const board = await findEditableCardBoard(
      transaction,
      boardId,
      currentUser.id,
    );
    if (!board) return null;

    const card = await transaction.card.findFirst({
      where: {
        id: BigInt(cardId),
        list: { board_id: board.id, archived_at: null },
        archived_at: null,
      },
      select: { id: true },
    });
    if (!card) return null;

    const member = await transaction.user.findUnique({
      where: { id: memberId },
      select: {
        id: true,
        email: true,
        full_name: true,
        avatar_url: true,
      },
    });
    if (!member) return null;

    await transaction.card_member.upsert({
      where: {
        card_id_user_id: { card_id: card.id, user_id: memberId },
      },
      create: { card_id: card.id, user_id: memberId },
      update: {},
    });
    return member;
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
