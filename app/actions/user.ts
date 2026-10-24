"use server";

import { prisma } from "@/lib/prisma";
import type { CurrentUser } from "@/app/types/user";
import { createUsername } from "@/utils/user-username";

export async function findUserById(userId: number): Promise<CurrentUser | null> {
  if (!Number.isSafeInteger(userId) || userId < 1) {
    throw new Error("userId must be a positive safe integer.");
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      full_name: true,
      avatar_url: true,
    },
  });

  if (!user) {
    return null;
  }

  return {
    ...user,
    username: createUsername(user.full_name, user.email, user.id),
  };
}
