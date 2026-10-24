"use client";

import { useEffect, useMemo, useState } from "react";

import { findWorkspacesByUserId } from "@/app/actions/workspace";
import { useUser } from "@/app/providers/UserProvider";
import type { WorkspaceItem } from "@/app/types/workspace";
import {
  WorkspaceErrorState,
  WorkspaceHomeSkeleton,
  WorkspaceNotFoundState,
} from "@/app/components/organisms";
import { WorkspaceHome } from "@/app/components/templates";

export default function WorkspacePageContent() {
  const user = useUser();
  const [workspaces, setWorkspaces] = useState<WorkspaceItem[]>([]);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(user !== null);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const filteredWorkspaces = useMemo(() => {
    const query = search.trim().toLocaleLowerCase("vi");
    if (!query) return workspaces;

    return workspaces.filter((workspace) =>
      `${workspace.name} ${workspace.description ?? ""}`.toLocaleLowerCase("vi").includes(query)
    );
  }, [search, workspaces]);

  useEffect(() => {
    if (!user) return;

    let isCurrentRequest = true;

    findWorkspacesByUserId()
      .then((result) => {
        if (isCurrentRequest) {
          setWorkspaces(result);
        }
      })
      .catch((cause: unknown) => {
        console.error("Failed to load workspaces for the current user.", cause);
        if (isCurrentRequest) {
          setError("Không thể tải workspace. Vui lòng thử lại.");
        }
      })
      .finally(() => {
        if (isCurrentRequest) {
          setIsLoading(false);
        }
      });

    return () => {
      isCurrentRequest = false;
    };
  }, [retryCount, user]);

  if (!user) {
    return <WorkspaceNotFoundState />;
  }

  if (isLoading) {
    return <WorkspaceHomeSkeleton />;
  }

  if (error) {
    return (
      <WorkspaceErrorState
        message={error}
        onRetry={() => {
          setError(null);
          setIsLoading(true);
          setRetryCount((count) => count + 1);
        }}
      />
    );
  }

  return (
    <WorkspaceHome
      filteredWorkspaces={filteredWorkspaces}
      onSearchChange={setSearch}
      search={search}
      user={user}
      workspaces={workspaces}
    />
  );
}
