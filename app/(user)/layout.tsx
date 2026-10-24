import type { ReactNode } from "react";

import { UserHeader } from "@/app/components/organisms";
import { WorkspaceSearchProvider } from "@/app/providers/WorkspaceSearchProvider";

type UserLayoutProps = {
  children: ReactNode;
};

export default function UserLayout({ children }: UserLayoutProps) {
  return (
    <WorkspaceSearchProvider>
      <UserHeader />
      {children}
    </WorkspaceSearchProvider>
  );
}
