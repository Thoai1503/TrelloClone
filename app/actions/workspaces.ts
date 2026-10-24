"use server";

import { encryptBoardId, encryptWorkspaceId } from "@/utils/resource-id";
import { getCurrentUser } from "@/utils/auth-session";
import { prisma } from "@/lib/prisma";
import type { WorkspaceSummary } from "@/app/types/workspace";
import { isWorkspaceColor } from "@/utils/workspace-colors";

export async function getAccessibleWorkspaces(): Promise<WorkspaceSummary[]> {
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
        {
          boards: {
            some: {
              archived_at: null,
              board_members: { some: { user_id: userId } },
            },
          },
        },
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
        select: { members: true },
      },
      boards: {
        where: {
          archived_at: null,
          OR: [
            { created_by: createdById },
            { board_members: { some: { user_id: userId } } },
            { workspace: { created_by: createdById } },
            { workspace: { members: { some: { user_id: userId } } } },
          ],
        },
        select: {
          id: true,
          name: true,
          description: true,
          backgroundColor: true,
          _count: {
            select: {
              lists: { where: { archived_at: null } },
              board_members: true,
            },
          },
        },
        orderBy: [{ created_at: "asc" }, { id: "asc" }],
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
    boardCount: workspace.boards.length,
    canManageBoards:
      workspace.created_by === createdById || workspace.members.length > 0,
    boards: workspace.boards.map((board) => ({
      encryptedId: encryptBoardId(board.id),
      name: board.name,
      description: board.description,
      backgroundColor: board.backgroundColor,
      listCount: board._count.lists,
      memberCount: board._count.board_members,
    })),
    role:
      workspace.created_by === createdById
        ? "ADMIN"
        : (workspace.members[0]?.role ?? "MEMBER"),
  }));
}

export async function createWorkspace(
  name: string,
  backgroundColor: string,
): Promise<Pick<
  WorkspaceSummary,
  "encryptedId" | "name" | "backgroundColor"
> | null> {
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
