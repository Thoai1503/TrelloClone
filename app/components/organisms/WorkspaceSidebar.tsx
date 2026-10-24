import Link from "next/link";

import { Icon } from "../atoms";

type WorkspaceSidebarProps = {
  workspaceCount: number;
};

export default function WorkspaceSidebar({ workspaceCount }: WorkspaceSidebarProps) {
  return (
    <aside className="hidden w-60 shrink-0 border-r border-gray-200 bg-white px-4 py-7 md:block">
      <p className="mb-3 px-3 text-[11px] font-bold uppercase tracking-[0.12em] text-gray-400">
        Không gian của bạn
      </p>
      <nav aria-label="Điều hướng chính" className="space-y-1">
        <Link
          className="flex items-center gap-3 rounded-md bg-blue-50 px-3 py-2.5 text-sm font-semibold text-blue-700"
          href="/"
        >
          <Icon className="h-[18px] w-[18px]" name="home" />
          Trang chủ
        </Link>
        <Link
          className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-gray-600 transition hover:bg-gray-100 hover:text-gray-900"
          href="#workspace-list"
        >
          <Icon className="h-[18px] w-[18px]" name="workspace" />
          Không gian làm việc
          <span className="ml-auto rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500">
            {workspaceCount}
          </span>
        </Link>
      </nav>
      <div className="mt-8 rounded-lg border border-blue-100 bg-blue-50/70 p-4">
        <p className="text-sm font-semibold text-gray-800">Mọi việc, cùng một nơi</p>
        <p className="mt-1.5 text-xs leading-5 text-gray-600">
          Chọn một workspace để tiếp tục cộng tác cùng nhóm của bạn.
        </p>
      </div>
    </aside>
  );
}
