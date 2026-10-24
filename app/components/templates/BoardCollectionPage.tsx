import type { CurrentUser } from "@/app/types/user";
import type { WorkspaceSummary } from "@/app/types/workspace";

import { BoardCounter } from "../molecules";
import { BoardCollection, BoardCollectionSidebar } from "../organisms";

type BoardCollectionPageProps = {
  user: CurrentUser;
  workspaces: WorkspaceSummary[];
  filteredWorkspaces: WorkspaceSummary[];
  search: string;
  onSearchChange: (value: string) => void;
};

export default function BoardCollectionPage({
  user,
  workspaces,
  filteredWorkspaces,
  search,
  onSearchChange,
}: BoardCollectionPageProps) {
  const boardCount = workspaces.reduce(
    (total, workspace) => total + workspace.boardCount,
    0,
  );

  return (
    <div className="min-h-[calc(100vh-68px)] bg-[#f7f8fa] text-gray-900">
      <div className="mx-auto flex min-h-[calc(100vh-68px)] max-w-[1440px]">
        <BoardCollectionSidebar
          boardCount={boardCount}
          boardCollectionHref={`/u/${encodeURIComponent(user.username)}/board`}
        />

        <main className="w-full min-w-0 px-5 py-8 sm:px-9 sm:py-10 lg:px-12">
          <div className="mx-auto max-w-6xl">
            <section className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
              <div>
                <p className="text-sm font-medium text-blue-700">Chào mừng bạn trở lại</p>
                <h1 className="mt-1.5 text-3xl font-bold tracking-tight text-gray-900">
                  Trang chủ
                </h1>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-500">
                  Mở một bảng trong workspace để tiếp tục công việc của bạn.
                </p>
              </div>
              <BoardCounter count={boardCount} />
            </section>

            <BoardCollection
              filteredWorkspaces={filteredWorkspaces}
              onSearchChange={onSearchChange}
              search={search}
              workspaces={workspaces}
            />
          </div>
        </main>
      </div>
    </div>
  );
}
