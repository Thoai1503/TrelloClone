"use client";

import {
  createContext,
  useContext,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from "react";

import type { WorkspaceItem } from "@/app/types/workspace";

type WorkspaceSearchContextValue = {
  search: string;
  setSearch: (value: string) => void;
  workspaces: WorkspaceItem[];
  setWorkspaces: Dispatch<SetStateAction<WorkspaceItem[]>>;
};

const WorkspaceSearchContext = createContext<WorkspaceSearchContextValue | null>(null);

export function WorkspaceSearchProvider({ children }: { children: ReactNode }) {
  const [search, setSearch] = useState("");
  const [workspaces, setWorkspaces] = useState<WorkspaceItem[]>([]);

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
