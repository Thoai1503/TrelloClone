"use server";

import { prisma } from "@/lib/prisma";
import type { WorkspaceItem } from "@/app/types/workspace";

export async function findWorkspacesByUserId(userId: number): Promise<WorkspaceItem[]> {
  if (!Number.isSafeInteger(userId) || userId < 1) {
    throw new Error("userId must be a positive safe integer.");
  }

  const createdById = BigInt(userId);
  const workspaces = await prisma.workspace.findMany({
    where: {
      archived_at: null,
      OR: [{ created_by: createdById }, { members: { some: { user_id: userId } } }],
    },
    select: {
      id: true,
      name: true,
      description: true,
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
    id: workspace.id.toString(),
    name: workspace.name,
    description: workspace.description,
    memberCount:
      workspace._count.members +
      (workspace.created_by === createdById && workspace.members.length === 0 ? 1 : 0),
    boardCount: workspace._count.boards,
    role:
      workspace.created_by === createdById
        ? "ADMIN"
        : (workspace.members[0]?.role ?? "MEMBER"),
  }));
}
