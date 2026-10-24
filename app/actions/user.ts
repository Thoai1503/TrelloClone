"use server";

import { getCurrentUser } from "@/utils/auth-session";

export async function getAuthenticatedUsername(): Promise<string | null> {
  const user = await getCurrentUser();
  return user?.username ?? null;
}
