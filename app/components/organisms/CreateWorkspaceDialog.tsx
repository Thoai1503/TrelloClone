"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { createWorkspace } from "@/app/actions/workspace";
import { useWorkspaceSearch } from "@/app/providers/WorkspaceSearchProvider";
import { WORKSPACE_COLORS } from "@/utils/workspace-colors";

import { Button, Icon } from "../atoms";

export default function CreateWorkspaceDialog() {
  const router = useRouter();
  const { setWorkspaces } = useWorkspaceSearch();
  const containerRef = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState("");
  const [backgroundColor, setBackgroundColor] = useState<string>(WORKSPACE_COLORS[0].value);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    setIsSubmitting(true);

    try {
      const workspace = await createWorkspace(name, backgroundColor);
      if (!workspace) {
        setError("Không thể tạo workspace. Hãy kiểm tra tên workspace và đăng nhập lại.");
        return;
      }

      setWorkspaces((current) => [
        {
          ...workspace,
          description: null,
          memberCount: 1,
          boardCount: 0,
          role: "ADMIN",
        },
        ...current,
      ]);
      router.push(`/workspaces/${workspace.encryptedId}`);
    } catch (cause: unknown) {
      console.error("Failed to create workspace.", cause);
      setError("Đã xảy ra lỗi khi tạo workspace. Vui lòng thử lại.");
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
          setIsOpen(true);
        }}
      >
        <span aria-hidden="true" className="text-lg leading-none">+</span>
        <span className="hidden sm:inline">Tạo mới</span>
      </Button>

      {isOpen && (
        <div className="absolute right-0 top-full z-50 mt-2 w-[min(22rem,calc(100vw-2rem))]">
          <section
            aria-labelledby="create-workspace-title"
            className="w-full rounded-xl border border-gray-200 bg-white p-5 text-gray-900 shadow-xl"
            role="dialog"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold" id="create-workspace-title">
                  Tạo workspace mới
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  Đặt tên và chọn màu nền cho không gian làm việc.
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
                <label className="mb-1.5 block text-sm font-medium" htmlFor="workspace-name">
                  Tên workspace
                </label>
                <input
                  autoFocus
                  className="h-10 w-full rounded-md border border-gray-300 px-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  id="workspace-name"
                  maxLength={150}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Ví dụ: Marketing"
                  required
                  value={name}
                />
              </div>

              <fieldset>
                <legend className="mb-2 text-sm font-medium">Màu nền workspace</legend>
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
                <Button disabled={isSubmitting || !name.trim()} type="submit">
                  {isSubmitting ? "Đang tạo..." : "Tạo workspace"}
                </Button>
              </div>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}
