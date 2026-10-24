import type { CurrentUser } from "@/app/types/user";
import type { WorkspaceItem } from "@/app/types/workspace";

import { WorkspaceCounter } from "../molecules";
import { WorkspaceHeader, WorkspaceList, WorkspaceSidebar } from "../organisms";

type WorkspaceHomeProps = {
  user: CurrentUser;
  workspaces: WorkspaceItem[];
  filteredWorkspaces: WorkspaceItem[];
  search: string;
  onSearchChange: (value: string) => void;
};

export default function WorkspaceHome({
  user,
  workspaces,
  filteredWorkspaces,
  search,
  onSearchChange,
}: WorkspaceHomeProps) {
  return (
    <div className="min-h-screen bg-[#f7f8fa] text-gray-900">
      <WorkspaceHeader onSearchChange={onSearchChange} search={search} user={user} />

      <div className="mx-auto flex min-h-[calc(100vh-68px)] max-w-[1440px]">
        <WorkspaceSidebar
          workspaceCount={workspaces.length}
          workspaceHref={`/u/${encodeURIComponent(user.username)}/board`}
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
                  Tiếp tục công việc của bạn bằng cách mở một không gian làm việc.
                </p>
              </div>
              <WorkspaceCounter count={workspaces.length} />
            </section>

            <WorkspaceList
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
