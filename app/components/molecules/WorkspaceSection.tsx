import type { WorkspaceSummary } from "@/app/types/workspace";
import type { ReactNode } from "react";

type WorkspaceSectionProps = {
  workspace: WorkspaceSummary;
  children: ReactNode;
};

export default function WorkspaceSection({ workspace, children }: WorkspaceSectionProps) {
  const initial = workspace.name.trim().charAt(0).toLocaleUpperCase("vi") || "?";

  return (
    <article
      className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm"
      id={`workspace-${workspace.encryptedId}`}
    >
      <div
        className="relative h-[92px] p-4"
        style={{ backgroundColor: workspace.backgroundColor }}
      >
        <div className="absolute inset-0 opacity-20 [background-image:radial-gradient(circle_at_20%_20%,white_0,transparent_35%),radial-gradient(circle_at_85%_80%,white_0,transparent_34%)]" />
        <div className="relative flex h-full items-start justify-between">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-white/20 text-xl font-bold text-white ring-1 ring-white/30 backdrop-blur-sm">
            {initial}
          </div>
          <span className="rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-semibold text-gray-700 shadow-sm">
            {workspace.role === "OWNER" || workspace.role === "ADMIN"
              ? "Quản trị viên"
              : "Thành viên"}
          </span>
        </div>
      </div>

      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="truncate text-base font-semibold text-gray-900" title={workspace.name}>
              {workspace.name}
            </h3>
            {workspace.description?.trim() && (
              <p className="mt-1 text-sm leading-5 text-gray-500">
                {workspace.description.trim()}
              </p>
            )}
          </div>
          <span className="shrink-0 text-xs text-gray-500">
            {workspace.boardCount} bảng · {workspace.memberCount} thành viên
          </span>
        </div>
        <div className="mt-4 border-t border-gray-100 pt-4">
          {children}
        </div>
      </div>
    </article>
  );
}
