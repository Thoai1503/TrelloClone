import "server-only";

import { getServerSession, type Session } from "next-auth";

import type { CurrentUser } from "@/app/types/user";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth-options";
import { createUsername } from "@/utils/user-username";

export async function getCurrentAuthSession(): Promise<Session | null> {
  return getServerSession(authOptions);
}

export async function getCurrentUser(
  session?: Session | null,
): Promise<CurrentUser | null> {
  const currentSession = session === undefined ? await getCurrentAuthSession() : session;
  const userId = Number(currentSession?.user?.id);

  if (!Number.isSafeInteger(userId) || userId < 1) {
    return null;
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
