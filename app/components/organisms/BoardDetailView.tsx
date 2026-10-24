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
import { useState, type FormEvent } from "react";

import { createBoardList, reorderBoardLists } from "@/app/actions/lists";
import type { BoardDetail, BoardList } from "@/app/types/board";
import { useUser } from "@/app/providers/UserProvider";

import { Button, Icon } from "../atoms";
import { SortableBoardList } from "../molecules";

type BoardDetailViewProps = {
  board: BoardDetail;
};

export default function BoardDetailView({ board }: BoardDetailViewProps) {
  const user = useUser();
  const [lists, setLists] = useState(board.lists);
  const [isAdding, setIsAdding] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSavingOrder, setIsSavingOrder] = useState(false);
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (
      !board.canManageLists ||
      isAdding ||
      !over ||
      active.id === over.id ||
      isSavingOrder
    ) {
      return;
    }

    const previousLists = lists;
    const oldIndex = lists.findIndex((list) => list.id === active.id);
    const newIndex = lists.findIndex((list) => list.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;

    const reorderedLists = arrayMove(lists, oldIndex, newIndex);
    setLists(reorderedLists);
    setIsSavingOrder(true);
    setError(null);

    try {
      const saved = await reorderBoardLists(
        board.encryptedId,
        reorderedLists.map((list) => list.id),
      );
      if (!saved) throw new Error("Board list order was rejected.");
    } catch (cause: unknown) {
      console.error("Failed to save board list order.", cause);
      setLists(previousLists);
      setError("Không thể lưu thứ tự danh sách. Vui lòng thử lại.");
    } finally {
      setIsSavingOrder(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) return;

    setIsSubmitting(true);
    setError(null);
    try {
      const createdList = await createBoardList(board.encryptedId, trimmedName);
      if (!createdList) {
        throw new Error("Board or list name is invalid, or access was denied.");
      }
      setLists((currentLists) => [...currentLists, createdList]);
      setName("");
      setIsAdding(false);
    } catch (cause: unknown) {
      console.error("Failed to create board list.", cause);
      setError("Không thể tạo danh sách. Vui lòng thử lại.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main
      className="flex h-[calc(100vh-68px)] flex-col overflow-hidden text-white"
      style={{ backgroundColor: board.backgroundColor }}
    >
      <header
        className="flex h-14 shrink-0 items-center border-b border-white/15 px-4 sm:px-6"
        style={{
          backgroundColor: `color-mix(in srgb, ${board.backgroundColor} 85%, black)`,
        }}
      >
        <Link
          aria-label="Quay lại danh sách workspace và bảng"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-white/90 transition hover:bg-white/15"
          href={
            user
              ? `/u/${encodeURIComponent(user.username)}/board#workspace-${board.workspaceEncryptedId}`
              : "/"
          }
        >
          <Icon className="h-5 w-5 rotate-180" name="arrow" />
        </Link>
        <span className="mx-3 h-7 w-px shrink-0 bg-white/25" />
        <div className="min-w-0">
          <p className="truncate text-xs text-white/70">{board.workspaceName}</p>
          <h1 className="truncate text-sm font-semibold sm:text-base">{board.name}</h1>
        </div>
      </header>

      <section className="flex min-h-0 flex-1 flex-col p-5 sm:p-7">
        <div className="mb-5 flex shrink-0 items-end justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold tracking-tight sm:text-2xl">
              Danh sách công việc
            </h2>
            <p className="mt-1 text-sm text-white/75">
              Các danh sách (column) trong bảng này.
            </p>
          </div>
          <span className="shrink-0 rounded-md bg-white/15 px-3 py-1.5 text-sm text-white">
            {lists.length} danh sách
          </span>
        </div>

        {error && (
          <p className="mb-4 shrink-0 text-sm text-white" role="alert">
            {error}
          </p>
        )}

        <DndContext
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
          sensors={sensors}
        >
          <div
            aria-label="Các danh sách trong bảng"
            className="flex min-h-0 flex-1 items-start gap-3 overflow-x-auto overflow-y-hidden pb-4"
          >
            <SortableContext
              items={lists.map((list) => list.id)}
              strategy={horizontalListSortingStrategy}
            >
              {lists.map((list: BoardList) => (
                <SortableBoardList
                  disabled={isSavingOrder || isAdding || !board.canManageLists}
                  key={list.id}
                  list={list}
                />
              ))}
            </SortableContext>

            {isAdding ? (
            <form
              className="flex w-72 shrink-0 flex-col gap-3 rounded-xl bg-gray-100 p-3 text-gray-900 shadow-sm"
              onSubmit={handleSubmit}
            >
              <label className="sr-only" htmlFor="new-list-name">
                Tên danh sách
              </label>
              <input
                autoFocus
                className="h-10 rounded-md border border-gray-300 bg-white px-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                id="new-list-name"
                maxLength={150}
                onChange={(event) => setName(event.target.value)}
                placeholder="Nhập tên danh sách..."
                value={name}
              />
              <div className="flex items-center gap-2">
                <Button disabled={isSubmitting || !name.trim()} type="submit">
                  {isSubmitting ? "Đang thêm..." : "Thêm danh sách"}
                </Button>
                <button
                  className="rounded-md px-3 py-2 text-sm text-gray-600 hover:bg-gray-200"
                  disabled={isSubmitting}
                  onClick={() => {
                    setIsAdding(false);
                    setError(null);
                  }}
                  type="button"
                >
                  Hủy
                </button>
              </div>
            </form>
            ) : board.canManageLists ? (
              <button
                className="flex h-12 w-72 shrink-0 items-center gap-2 rounded-xl bg-white/20 px-4 text-left text-sm font-semibold text-white transition hover:bg-white/30 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={isSavingOrder}
                onClick={() => setIsAdding(true)}
                type="button"
              >
                <span aria-hidden="true" className="text-lg leading-none">+</span>
                Thêm danh sách khác
              </button>
            ) : null}
          </div>
        </DndContext>
        {isSavingOrder && (
          <p aria-live="polite" className="shrink-0 text-sm text-white/75">
            Đang lưu thứ tự danh sách...
          </p>
        )}
      </section>
    </main>
  );
}
