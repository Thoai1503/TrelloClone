"use server";

import { prisma } from "@/lib/prisma";
import type { CurrentUser } from "@/app/types/user";

export async function findUserById(userId: number): Promise<CurrentUser | null> {
  if (!Number.isSafeInteger(userId) || userId < 1) {
    throw new Error("userId must be a positive safe integer.");
  }

  return prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      full_name: true,
      avatar_url: true,
    },
  });
}
