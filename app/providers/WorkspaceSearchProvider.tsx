"use client";

import {
  createContext,
  useContext,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from "react";

import type { WorkspaceSummary } from "@/app/types/workspace";

type WorkspaceSearchContextValue = {
  search: string;
  setSearch: (value: string) => void;
  workspaces: WorkspaceSummary[];
  setWorkspaces: Dispatch<SetStateAction<WorkspaceSummary[]>>;
};

const WorkspaceSearchContext = createContext<WorkspaceSearchContextValue | null>(null);

export function WorkspaceSearchProvider({ children }: { children: ReactNode }) {
  const [search, setSearch] = useState("");
  const [workspaces, setWorkspaces] = useState<WorkspaceSummary[]>([]);

  return (
    <WorkspaceSearchContext.Provider
      value={{ search, setSearch, workspaces, setWorkspaces }}
    >
      {children}
    </WorkspaceSearchContext.Provider>
  );
}

export function useWorkspaceSearch() {
  const context = useContext(WorkspaceSearchContext);

  if (!context) {
    throw new Error("useWorkspaceSearch must be used within a WorkspaceSearchProvider.");
  }

  return context;
}
