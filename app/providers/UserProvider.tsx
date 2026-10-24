"use client";

import { createContext, useContext, type ReactNode } from "react";

import type { CurrentUser } from "@/app/types/user";

type UserProviderProps = {
  children: ReactNode;
  user: CurrentUser | null;
};

const UserContext = createContext<CurrentUser | null | undefined>(undefined);

export function UserProvider({ children, user }: UserProviderProps) {
  return <UserContext.Provider value={user}>{children}</UserContext.Provider>;
}

export function useUser(): CurrentUser | null {
  const user = useContext(UserContext);

  if (user === undefined) {
    throw new Error("useUser must be used within a UserProvider.");
  }

  return user;
}
