"use client";

import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  horizontalListSortingStrategy,
  sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";
import Link from "next/link";
import { useState } from "react";

import {
  createWorkspaceBoard,
  saveWorkspaceBoardOrder,
} from "@/app/actions/workspace";
import type { WorkspaceBoard, WorkspaceDetail } from "@/app/types/workspace";
import { useUser } from "@/app/providers/UserProvider";
import { getWorkspaceBoardBackground } from "@/utils/workspace-background";

import { Avatar, Button, Icon } from "../atoms";
import { AddBoardCard, SignOutButton, SortableBoardCard } from "../molecules";

type WorkspaceBoardViewProps = {
  workspace: WorkspaceDetail;
};

export default function WorkspaceBoardView({
  workspace,
}: WorkspaceBoardViewProps) {
  const user = useUser();
  const displayName =
    user?.full_name?.trim() || user?.email || "Tài khoản demo";
  const [boards, setBoards] = useState(workspace.boards);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id || isSaving) return;

    const previousBoards = boards;
    const oldIndex = boards.findIndex((board) => board.id === active.id);
    const newIndex = boards.findIndex((board) => board.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;

    const reorderedBoards = arrayMove(boards, oldIndex, newIndex);
    setBoards(reorderedBoards);
    setError(null);
    setIsSaving(true);
    try {
      const saved = await saveWorkspaceBoardOrder(
        workspace.id,
        reorderedBoards.map((board) => board.id),
      );

      if (!saved) {
        throw new Error("The board order could not be saved.");
      }
    } catch (cause: unknown) {
      console.error("Failed to save workspace board order.", cause);
      setBoards(previousBoards);
      setError("Không thể lưu thứ tự bảng. Vui lòng thử kéo lại.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleAddBoard(name: string) {
    const board = await createWorkspaceBoard(workspace.id, name);
    if (!board) {
      throw new Error("Workspace or board name is invalid, or access was denied.");
    }

    setBoards((currentBoards) => [...currentBoards, board]);
  }

  return (
    <main className="flex h-screen flex-col overflow-hidden bg-[#0c66e4] text-white">
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-white/15 bg-[#0757c7]/90 px-4 backdrop-blur-sm sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <Link
            aria-label="Quay lại danh sách workspace"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-white/90 transition hover:bg-white/15"
            href={user ? `/u/${encodeURIComponent(user.username)}/board` : "/"}
          >
            <Icon className="h-5 w-5 rotate-180" name="arrow" />
          </Link>
          <span className="h-7 w-px shrink-0 bg-white/25" />
          <div className="min-w-0">
            <h1 className="truncate text-sm font-semibold sm:text-base">
              {workspace.name}
            </h1>
            <p className="text-xs text-white/70">Không gian làm việc</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden max-w-48 truncate text-sm text-white/80 sm:inline">
            {displayName}
          </span>
          <Avatar label={displayName} userId={user?.id} />
          <SignOutButton className="rounded-md px-3 py-2 text-sm font-semibold text-white/90 transition hover:bg-white/15" />
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-y-hidden">
        <div className="flex h-full min-w-0 flex-col p-5 sm:p-7">
          <div className="mb-5 flex shrink-0 items-end justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold tracking-tight sm:text-2xl">
                Các bảng trong workspace
              </h2>
              <p className="mt-1 text-sm text-white/75">
                {workspace.description ||
                  "Kéo thả các bảng để thay đổi thứ tự."}
              </p>
            </div>
            <span className="shrink-0 rounded-md bg-white/15 px-3 py-1.5 text-sm text-white">
              {boards.length} bảng
            </span>
          </div>

          {error && (
            <div
              className="mb-4 flex shrink-0 items-center gap-3 self-start rounded-md bg-red-950/35 px-3 py-2 text-sm text-white"
              role="alert"
            >
              <span>{error}</span>
              <Button
                className="bg-white/15 px-2 py-1 text-xs hover:bg-white/25"
                onClick={() => setError(null)}
              >
                Đóng
              </Button>
            </div>
          )}

          <DndContext
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
            sensors={sensors}
          >
            <SortableContext
              items={boards.map((board) => board.id)}
              strategy={horizontalListSortingStrategy}
            >
              <div
                aria-label="Danh sách bảng; kéo để sắp xếp"
                className="flex min-h-0 flex-1 items-start gap-4 overflow-x-auto overflow-y-hidden pb-5"
              >
                {boards.map((board: WorkspaceBoard) => (
                  <SortableBoardCard
                    board={{
                      ...board,
                      background: getWorkspaceBoardBackground(
                        board.background,
                      ),
                    }}
                    disabled={isSaving}
                    key={board.id}
                  />
                ))}
                <AddBoardCard
                  disabled={isSaving}
                  onAdd={handleAddBoard}
                />
              </div>
            </SortableContext>
          </DndContext>

          {isSaving && (
            <p
              aria-live="polite"
              className="shrink-0 pt-2 text-xs text-white/75"
            >
              Đang lưu thứ tự bảng...
            </p>
          )}
        </div>
      </div>
    </main>
  );
}
