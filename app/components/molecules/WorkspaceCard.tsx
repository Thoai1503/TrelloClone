import type { WorkspaceItem } from "@/app/types/workspace";
import Link from "next/link";

import { Icon } from "../atoms";

type WorkspaceCardProps = {
  workspace: WorkspaceItem;
};

export default function WorkspaceCard({ workspace }: WorkspaceCardProps) {
  const initial = workspace.name.trim().charAt(0).toLocaleUpperCase("vi") || "?";

  return (
    <Link
      className="group block overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
      href={`/workspaces/${workspace.encryptedId}`}
    >
      <article>
        <div className="relative h-[92px] p-4" style={{ backgroundColor: workspace.backgroundColor }}>
          <div className="absolute inset-0 opacity-20 [background-image:radial-gradient(circle_at_20%_20%,white_0,transparent_35%),radial-gradient(circle_at_85%_80%,white_0,transparent_34%)]" />
          <div className="relative flex h-full items-start justify-between">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-white/20 text-xl font-bold text-white ring-1 ring-white/30 backdrop-blur-sm">
              {initial}
            </div>
            <span className="rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-semibold text-gray-700 shadow-sm">
              {workspace.role === "ADMIN" ? "Quản trị viên" : "Thành viên"}
            </span>
          </div>
        </div>

        <div className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="truncate text-base font-semibold text-gray-900" title={workspace.name}>
                {workspace.name}
              </h3>
              <p className="mt-1.5 min-h-10 text-sm leading-5 text-gray-500">
                {workspace.description?.trim() || "Chưa có mô tả cho không gian này."}
              </p>
            </div>
            <span className="mt-0.5 shrink-0 text-gray-400 transition group-hover:translate-x-0.5 group-hover:text-blue-600">
              <Icon className="h-4 w-4" name="arrow" />
            </span>
          </div>

          <div className="mt-4 flex items-center gap-4 border-t border-gray-100 pt-3 text-xs text-gray-500">
            <span className="inline-flex items-center gap-1.5">
              <Icon className="h-4 w-4" name="workspace" />
              {workspace.boardCount} bảng
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Icon className="h-4 w-4" name="members" />
              {workspace.memberCount} thành viên
            </span>
          </div>
        </div>
      </article>
    </Link>
  );
}
