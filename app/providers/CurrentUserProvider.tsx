import type { ReactNode } from "react";
import { connection } from "next/server";

import { getCurrentAuthSession, getCurrentUser } from "@/utils/auth-session";

import AuthProviders from "./AuthProviders";

type CurrentUserProviderProps = {
  children: ReactNode;
};

export default async function CurrentUserProvider({ children }: CurrentUserProviderProps) {
  await connection();
  const session = await getCurrentAuthSession();
  const user = await getCurrentUser(session);

  return <AuthProviders session={session} user={user}>{children}</AuthProviders>;
}
