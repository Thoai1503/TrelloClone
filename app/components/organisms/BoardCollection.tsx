import type { WorkspaceSummary } from "@/app/types/workspace";

import { BoardEmptyState, BoardSearch } from "../molecules";
import WorkspaceBoards from "./WorkspaceBoards";

type BoardCollectionProps = {
  workspaces: WorkspaceSummary[];
  filteredWorkspaces: WorkspaceSummary[];
  search: string;
  onSearchChange: (value: string) => void;
};

export default function BoardCollection({
  workspaces,
  filteredWorkspaces,
  search,
  onSearchChange,
}: BoardCollectionProps) {
  return (
    <section className="mt-10" id="workspace-list">
      <div className="flex flex-col justify-between gap-3 border-b border-gray-200 pb-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Các bảng của bạn</h2>
          <p className="mt-1 text-sm text-gray-500">
            Chọn một bảng để mở và tiếp tục công việc.
          </p>
        </div>
        <BoardSearch
          className="w-full sm:w-auto sm:min-w-[280px] md:hidden"
          onChange={onSearchChange}
          value={search}
        />
      </div>

      {filteredWorkspaces.some(
        (workspace) => workspace.boards.length > 0 || !search.trim(),
      ) ? (
        <div className="mt-5 space-y-5">
          {filteredWorkspaces.map((workspace) => {
            const isFiltered = search.trim().length > 0;
            const workspaceMatches = `${workspace.name} ${workspace.description ?? ""}`
              .toLocaleLowerCase("vi")
              .includes(search.trim().toLocaleLowerCase("vi"));

            return (
              <section
                className="border-b border-gray-200 pb-5 last:border-0"
                id={`workspace-${workspace.encryptedId}`}
                key={workspace.encryptedId}
              >
                <h3 className="mb-3 text-sm font-semibold text-gray-700">
                  {workspace.name}
                </h3>
                <WorkspaceBoards
                  canManageBoards={
                    workspace.canManageBoards && (!isFiltered || workspaceMatches)
                  }
                  key={`${workspace.encryptedId}-${search.trim()}`}
                  workspace={workspace}
                />
              </section>
            );
          })}
        </div>
      ) : (
        <BoardEmptyState
          hasBoards={workspaces.some((workspace) => workspace.boards.length > 0)}
          onClearSearch={() => onSearchChange("")}
          search={search}
        />
      )}
    </section>
  );
}
