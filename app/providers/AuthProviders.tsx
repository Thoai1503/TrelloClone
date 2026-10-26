"use client";

import { SessionProvider } from "next-auth/react";
import type { ReactNode } from "react";
import type { Session } from "next-auth";

import type { CurrentUser } from "@/app/types/user";

import QueryProvider from "./QueryProvider";
import { UserProvider } from "./UserProvider";

type AuthProvidersProps = {
  children: ReactNode;
  session: Session | null;
  user: CurrentUser | null;
};

export default function AuthProviders({
  children,
  session,
  user,
}: AuthProvidersProps) {
  return (
    <QueryProvider>
      <SessionProvider session={session}>
        <UserProvider user={user}>{children}</UserProvider>
      </SessionProvider>
    </QueryProvider>
  );
}
