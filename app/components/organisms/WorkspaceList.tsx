import type { WorkspaceItem } from "@/app/types/workspace";

import { WorkspaceCard, WorkspaceEmptyState, WorkspaceSearch } from "../molecules";

type WorkspaceListProps = {
  workspaces: WorkspaceItem[];
  filteredWorkspaces: WorkspaceItem[];
  search: string;
  onSearchChange: (value: string) => void;
};

export default function WorkspaceList({
  workspaces,
  filteredWorkspaces,
  search,
  onSearchChange,
}: WorkspaceListProps) {
  return (
    <section className="mt-10" id="workspace-list">
      <div className="flex flex-col justify-between gap-3 border-b border-gray-200 pb-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Không gian làm việc</h2>
          <p className="mt-1 text-sm text-gray-500">
            Workspace bạn sở hữu hoặc được mời tham gia.
          </p>
        </div>
        <WorkspaceSearch
          className="w-full sm:w-auto sm:min-w-[280px] md:hidden"
          onChange={onSearchChange}
          value={search}
        />
      </div>

      {filteredWorkspaces.length > 0 ? (
        <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filteredWorkspaces.map((workspace) => (
            <WorkspaceCard
              key={workspace.encryptedId}
              workspace={workspace}
            />
          ))}
        </div>
      ) : (
        <WorkspaceEmptyState
          hasWorkspaces={workspaces.length > 0}
          onClearSearch={() => onSearchChange("")}
          search={search}
        />
      )}
    </section>
  );
}
