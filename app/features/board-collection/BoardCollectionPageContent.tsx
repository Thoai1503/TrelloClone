"use client";

import { useEffect, useMemo, useState } from "react";

import { getAccessibleWorkspaces } from "@/app/actions/workspaces";
import { useUser } from "@/app/providers/UserProvider";
import { useWorkspaceSearch } from "@/app/providers/WorkspaceSearchProvider";
import type { WorkspaceSummary } from "@/app/types/workspace";
import { filterWorkspaceBoards } from "@/utils/filter-workspaces";
import {
  WorkspaceErrorState,
  BoardCollectionSkeleton,
  WorkspaceNotFoundState,
} from "@/app/components/organisms";
import { BoardCollectionPage } from "@/app/components/templates";

type BoardCollectionPageContentProps = {
  username: string;
};

export default function BoardCollectionPageContent({ username }: BoardCollectionPageContentProps) {
  const user = useUser();
  const { search, setSearch, setWorkspaces: setSearchWorkspaces } = useWorkspaceSearch();
  const [workspaces, setWorkspaces] = useState<WorkspaceSummary[]>([]);
  const [isLoading, setIsLoading] = useState(user !== null);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const filteredWorkspaces = useMemo(() => {
    return filterWorkspaceBoards(workspaces, search);
  }, [search, workspaces]);

  useEffect(() => {
    if (!user) return;

    let isCurrentRequest = true;

    getAccessibleWorkspaces()
      .then((result) => {
        if (isCurrentRequest) {
          setWorkspaces(result);
          setSearchWorkspaces(result);
        }
      })
      .catch((cause: unknown) => {
        console.error("Failed to load the current user's board collection.", cause);
        if (isCurrentRequest) {
          setError("Không thể tải các bảng. Vui lòng thử lại.");
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
  }, [retryCount, setSearchWorkspaces, user]);

  if (!user || user.username !== username) {
    return <WorkspaceNotFoundState />;
  }

  if (isLoading) {
    return <BoardCollectionSkeleton />;
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
    <BoardCollectionPage
      filteredWorkspaces={filteredWorkspaces}
      onSearchChange={setSearch}
      search={search}
      user={user}
      workspaces={workspaces}
    />
  );
}
