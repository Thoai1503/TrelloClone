import type { ReactNode } from "react";
import { connection } from "next/server";

import { findUserById } from "@/app/actions/user";

import { UserProvider } from "./UserProvider";

type CurrentUserProviderProps = {
  children: ReactNode;
};

export default async function CurrentUserProvider({ children }: CurrentUserProviderProps) {
  await connection();
  const user = await findUserById(1);

  return <UserProvider user={user}>{children}</UserProvider>;
}
