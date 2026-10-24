"use server";

import { decryptWorkspaceId, encryptWorkspaceId } from "@/utils/workspace-id";
import { getCurrentUser } from "@/utils/auth-session";
import { prisma } from "@/lib/prisma";
import type { WorkspaceBoard, WorkspaceItem } from "@/app/types/workspace";
import { isWorkspaceColor } from "@/utils/workspace-colors";

export async function findWorkspacesByUserId(): Promise<WorkspaceItem[]> {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    throw new Error("Authentication is required to load workspaces.");
  }

  const userId = currentUser.id;
  const createdById = BigInt(userId);
  const workspaces = await prisma.workspace.findMany({
    where: {
      archived_at: null,
      OR: [
        { created_by: createdById },
        { members: { some: { user_id: userId } } },
      ],
    },
    select: {
      id: true,
      name: true,
      description: true,
      backgroundColor: true,
      created_by: true,
      members: {
        where: { user_id: userId },
        select: { role: true },
        take: 1,
      },
      _count: {
        select: { members: true, boards: true },
      },
    },
    orderBy: { updated_at: "desc" },
  });

  return workspaces.map((workspace) => ({
    encryptedId: encryptWorkspaceId(workspace.id),
    name: workspace.name,
    description: workspace.description,
    backgroundColor: workspace.backgroundColor,
    memberCount:
      workspace._count.members +
      (workspace.created_by === createdById && workspace.members.length === 0
        ? 1
        : 0),
    boardCount: workspace._count.boards,
    role:
      workspace.created_by === createdById
        ? "ADMIN"
        : (workspace.members[0]?.role ?? "MEMBER"),
  }));
}

export async function createWorkspace(
  name: string,
  backgroundColor: string,
): Promise<Pick<WorkspaceItem, "encryptedId" | "name" | "backgroundColor"> | null> {
  if (
    typeof name !== "string" ||
    typeof backgroundColor !== "string" ||
    !isWorkspaceColor(backgroundColor)
  ) {
    return null;
  }

  const trimmedName = name.trim();
  if (!trimmedName || trimmedName.length > 150) {
    return null;
  }

  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return null;
  }

  const workspace = await prisma.$transaction(async (transaction) => {
    const createdWorkspace = await transaction.workspace.create({
      data: {
        name: trimmedName,
        backgroundColor,
        created_by: BigInt(currentUser.id),
      },
      select: { id: true, name: true, backgroundColor: true },
    });

    await transaction.workspace_member.create({
      data: {
        workspace_id: createdWorkspace.id,
        user_id: currentUser.id,
        role: "ADMIN",
      },
    });

    return createdWorkspace;
  });

  return {
    encryptedId: encryptWorkspaceId(workspace.id),
    name: workspace.name,
    backgroundColor: workspace.backgroundColor,
  };
}

export async function findWorkspaceByEncryptedId(token: string) {
  if (typeof token !== "string") {
    return null;
  }

  const workspaceId = decryptWorkspaceId(token);
  if (workspaceId === null) {
    return null;
  }

  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return null;
  }

  const userId = currentUser.id;
  const currentUserId = BigInt(userId);
  const workspace = await prisma.workspace.findFirst({
    where: {
      id: workspaceId,
      archived_at: null,
      OR: [
        { created_by: currentUserId },
        { members: { some: { user_id: userId } } },
      ],
    },
    select: {
      id: true,
      name: true,
      description: true,
      backgroundColor: true,
      boards: {
        where: { archived_at: null },
        select: {
          id: true,
          name: true,
          description: true,
          background: true,
        },
        orderBy: [{ position: "asc" }, { id: "asc" }],
      },
    },
  });

  if (!workspace) {
    return null;
  }

  return {
    id: token,
    name: workspace.name,
    description: workspace.description,
    backgroundColor: workspace.backgroundColor,
    boards: workspace.boards.map((board) => ({
      id: board.id.toString(),
      name: board.name,
      description: board.description,
      background: board.background,
    })),
  };
}

export async function saveWorkspaceBoardOrder(
  token: string,
  orderedBoardIds: string[],
): Promise<boolean> {
  if (
    typeof token !== "string" ||
    !Array.isArray(orderedBoardIds) ||
    !orderedBoardIds.every((id) => typeof id === "string")
  ) {
    return false;
  }

  const workspaceId = decryptWorkspaceId(token);
  if (workspaceId === null) {
    return false;
  }

  if (
    orderedBoardIds.some((id) => !/^[1-9]\d*$/.test(id)) ||
    new Set(orderedBoardIds).size !== orderedBoardIds.length
  ) {
    return false;
  }

  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return false;
  }

  const userId = currentUser.id;
  const currentUserId = BigInt(userId);
  const workspace = await prisma.workspace.findFirst({
    where: {
      id: workspaceId,
      archived_at: null,
      OR: [
        { created_by: currentUserId },
        { members: { some: { user_id: userId } } },
      ],
    },
    select: {
      id: true,
      boards: {
        where: { archived_at: null },
        select: { id: true },
      },
    },
  });

  if (!workspace || workspace.boards.length !== orderedBoardIds.length) {
    return false;
  }

  const currentBoardIds = new Set(
    workspace.boards.map((board) => board.id.toString()),
  );
  if (!orderedBoardIds.every((id) => currentBoardIds.has(id))) {
    return false;
  }

  await prisma.$transaction(
    orderedBoardIds.map((boardId, index) => {
      console.log(`Updating board ${boardId} to position ${index * 1000}`);
      return prisma.board.updateMany({
        where: {
          id: BigInt(boardId),
          workspace_id: workspace.id,
          archived_at: null,
        },
        data: { position: index * 1000 },
      });
    }),
  );

  return true;
}

export async function createWorkspaceBoard(
  token: string,
  name: string,
): Promise<WorkspaceBoard | null> {
  if (typeof token !== "string" || typeof name !== "string") {
    return null;
  }

  const trimmedName = name.trim();
  if (!trimmedName || trimmedName.length > 150) {
    return null;
  }

  const workspaceId = decryptWorkspaceId(token);
  if (workspaceId === null) {
    return null;
  }

  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return null;
  }

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
      select: { id: true },
    });

    if (!workspace) {
      return null;
    }

    const lastBoard = await transaction.board.findFirst({
      where: { workspace_id: workspace.id, archived_at: null },
      select: { position: true },
      orderBy: [{ position: "desc" }, { id: "desc" }],
    });
    const position = lastBoard ? lastBoard.position.plus(1000) : 1000;

    const board = await transaction.board.create({
      data: {
        workspace_id: workspace.id,
        created_by: currentUserId,
        name: trimmedName,
        position,
      },
      select: {
        id: true,
        name: true,
        description: true,
        background: true,
      },
    });

    return {
      id: board.id.toString(),
      name: board.name,
      description: board.description,
      background: board.background,
    };
  });
}
