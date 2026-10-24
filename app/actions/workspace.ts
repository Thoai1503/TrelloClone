"use server";

import { decryptWorkspaceId, encryptWorkspaceId } from "@/utils/workspace-id";
import { prisma } from "@/lib/prisma";
import type { WorkspaceItem } from "@/app/types/workspace";

const MOCK_USER_ID = 1;

export async function findWorkspacesByUserId(): Promise<WorkspaceItem[]> {
  const createdById = BigInt(MOCK_USER_ID);
  const workspaces = await prisma.workspace.findMany({
    where: {
      archived_at: null,
      OR: [
        { created_by: createdById },
        { members: { some: { user_id: MOCK_USER_ID } } },
      ],
    },
    select: {
      id: true,
      name: true,
      description: true,
      created_by: true,
      members: {
        where: { user_id: MOCK_USER_ID },
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

export async function findWorkspaceByEncryptedId(token: string) {
  if (typeof token !== "string") {
    return null;
  }

  const workspaceId = decryptWorkspaceId(token);
  if (workspaceId === null) {
    return null;
  }

  const mockUserId = BigInt(MOCK_USER_ID);
  const workspace = await prisma.workspace.findFirst({
    where: {
      id: workspaceId,
      archived_at: null,
      OR: [
        { created_by: mockUserId },
        { members: { some: { user_id: MOCK_USER_ID } } },
      ],
    },
    select: {
      id: true,
      name: true,
      description: true,
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

  const mockUserId = BigInt(MOCK_USER_ID);
  const workspace = await prisma.workspace.findFirst({
    where: {
      id: workspaceId,
      archived_at: null,
      OR: [
        { created_by: mockUserId },
        { members: { some: { user_id: MOCK_USER_ID } } },
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
