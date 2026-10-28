"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";

import { createWorkspace } from "@/app/actions/workspaces";
import type { WorkspaceSummary } from "@/app/types/workspace";
import { WORKSPACE_COLORS } from "@/utils/workspace-colors";

import { Button, Icon } from "../atoms";

type CreatedWorkspace = Pick<
  WorkspaceSummary,
  "encryptedId" | "name" | "backgroundColor"
>;

type CreateWorkspaceDialogProps = {
  onCreated: (workspace: CreatedWorkspace) => void;
};

export default function CreateWorkspaceDialog({
  onCreated,
}: CreateWorkspaceDialogProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState("");
  const [backgroundColor, setBackgroundColor] = useState<string>(
    WORKSPACE_COLORS[0].value,
  );
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

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError("Vui lòng nhập tên workspace.");
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      const workspace = await createWorkspace(trimmedName, backgroundColor);
      if (!workspace) {
        setError("Không thể tạo workspace. Vui lòng kiểm tra thông tin và thử lại.");
        return;
      }

      onCreated(workspace);
      setName("");
      setBackgroundColor(WORKSPACE_COLORS[0].value);
      setIsOpen(false);
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
        <span>Tạo workspace</span>
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
                  Đặt tên và chọn màu nhận diện cho workspace.
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
                  disabled={isSubmitting}
                  id="workspace-name"
                  maxLength={150}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Ví dụ: Dự án cá nhân"
                  required
                  value={name}
                />
              </div>

              <fieldset>
                <legend className="mb-2 text-sm font-medium">Màu workspace</legend>
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
                      disabled={isSubmitting}
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
