"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { createBoard } from "@/app/actions/boards";
import { useWorkspaceSearch } from "@/app/providers/WorkspaceSearchProvider";
import { WORKSPACE_COLORS } from "@/utils/workspace-colors";

import { Button, Icon } from "../atoms";

export default function CreateBoardDialog() {
  const router = useRouter();
  const { workspaces } = useWorkspaceSearch();
  const containerRef = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState("");
  const [workspaceId, setWorkspaceId] = useState("");
  const [backgroundColor, setBackgroundColor] = useState<string>(WORKSPACE_COLORS[0].value);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const manageableWorkspaces = workspaces.filter(
    (workspace) => workspace.canManageBoards,
  );

  useEffect(() => {
    if (!isOpen) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !isSubmitting) {
        setIsOpen(false);
      }
    }

    function handlePointerDown(event: PointerEvent) {
      if (
        event.target instanceof Node &&
        !containerRef.current?.contains(event.target) &&
        !isSubmitting
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("pointerdown", handlePointerDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("pointerdown", handlePointerDown);
    };
  }, [isOpen, isSubmitting]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    if (!workspaceId) {
      setError("Vui lòng chọn workspace.");
      return;
    }
    setIsSubmitting(true);

    try {
      const board = await createBoard(workspaceId, name, backgroundColor);
      if (!board) {
        setError("Không thể tạo bảng. Hãy kiểm tra quyền truy cập và tên bảng.");
        return;
      }
      router.push(`/board/${board.encryptedId}`);
    } catch (cause: unknown) {
      console.error("Failed to create board.", cause);
      setError("Đã xảy ra lỗi khi tạo bảng. Vui lòng thử lại.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="relative" ref={containerRef}>
      <Button
        className="inline-flex h-10 shrink-0 items-center gap-2 whitespace-nowrap"
        onClick={() => {
          setError(null);
          setWorkspaceId(manageableWorkspaces[0]?.encryptedId ?? "");
          setIsOpen(true);
        }}
      >
        <span aria-hidden="true" className="text-lg leading-none">+</span>
        <span className="hidden sm:inline">Tạo bảng</span>
      </Button>

      {isOpen && (
        <div className="absolute right-0 top-full z-50 mt-2 w-[min(22rem,calc(100vw-2rem))]">
          <section
            aria-labelledby="create-board-title"
            className="w-full rounded-xl border border-gray-200 bg-white p-5 text-gray-900 shadow-xl"
            role="dialog"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold" id="create-board-title">
                  Tạo bảng mới
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  Chọn workspace và đặt tên cho bảng của bạn.
                </p>
              </div>
              <button
                aria-label="Đóng"
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-gray-500 hover:bg-gray-100 hover:text-gray-900"
                disabled={isSubmitting}
                onClick={() => setIsOpen(false)}
                type="button"
              >
                <span aria-hidden="true">×</span>
              </button>
            </div>

            <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
              <div>
                <label className="mb-1.5 block text-sm font-medium" htmlFor="board-workspace">
                  Workspace
                </label>
                <select
                  autoFocus
                  className="h-10 w-full rounded-md border border-gray-300 bg-white px-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  id="board-workspace"
                  onChange={(event) => setWorkspaceId(event.target.value)}
                  required
                  value={workspaceId}
                >
                  <option disabled value="">Chọn workspace...</option>
                  {manageableWorkspaces.map((workspace) => (
                    <option key={workspace.encryptedId} value={workspace.encryptedId}>
                      {workspace.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium" htmlFor="board-name">
                  Tên bảng
                </label>
                <input
                  className="h-10 w-full rounded-md border border-gray-300 px-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  id="board-name"
                  maxLength={150}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Ví dụ: Kế hoạch marketing"
                  required
                  value={name}
                />
              </div>

              <fieldset>
                <legend className="mb-2 text-sm font-medium">Màu nền bảng</legend>
                <div className="flex flex-wrap gap-3">
                  {WORKSPACE_COLORS.map((color) => (
                    <button
                      aria-label={color.name}
                      aria-pressed={backgroundColor === color.value}
                      className={`flex h-9 w-9 items-center justify-center rounded-full ring-offset-2 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 ${
                        backgroundColor === color.value
                          ? "ring-2 ring-blue-600"
                          : "hover:scale-110"
                      }`}
                      key={color.value}
                      onClick={() => setBackgroundColor(color.value)}
                      style={{ backgroundColor: color.value }}
                      title={color.name}
                      type="button"
                    >
                      {backgroundColor === color.value && (
                        <Icon className="h-5 w-5 text-white" name="check" />
                      )}
                    </button>
                  ))}
                </div>
              </fieldset>

              {manageableWorkspaces.length === 0 && (
                <p className="text-sm text-gray-500">
                  Bạn chưa có workspace nào được phép tạo bảng.
                </p>
              )}

              {error && (
                <p className="text-sm text-red-600" role="alert">
                  {error}
                </p>
              )}

              <div className="flex justify-end gap-2">
                <button
                  className="rounded-md px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100 disabled:opacity-50"
                  disabled={isSubmitting}
                  onClick={() => setIsOpen(false)}
                  type="button"
                >
                  Hủy
                </button>
                <Button
                  disabled={isSubmitting || !name.trim() || !workspaceId || manageableWorkspaces.length === 0}
                  type="submit"
                >
                  {isSubmitting ? "Đang tạo..." : "Tạo bảng"}
                </Button>
              </div>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}
