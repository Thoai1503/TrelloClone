import "server-only";

import { connection } from "next/server";
import { redirect } from "next/navigation";

import { getCurrentUser } from "@/utils/auth-session";

export async function redirectAuthenticatedUser(): Promise<void> {
  await connection();
  const user = await getCurrentUser();

  if (user) {
    redirect(`/u/${encodeURIComponent(user.username)}/board`);
  }
}
