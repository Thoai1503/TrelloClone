"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import type { BoardList } from "@/app/types/board";

type SortableBoardListProps = {
  list: BoardList;
  disabled: boolean;
};

export default function SortableBoardList({
  list,
  disabled,
}: SortableBoardListProps) {
  const { attributes, isDragging, listeners, setNodeRef, transform, transition } =
    useSortable({ id: list.id, disabled });

  return (
    <article
      ref={setNodeRef}
      className="flex max-h-full min-h-32 w-72 shrink-0 flex-col rounded-xl bg-gray-100 p-3 text-gray-900 shadow-sm"
      style={{
        opacity: isDragging ? 0.45 : 1,
        transform: CSS.Transform.toString(transform),
        transition,
      }}
    >
      <div className="mb-3 flex items-start justify-between gap-2 px-1">
        <h3 className="break-words text-sm font-semibold">{list.name}</h3>
        <button
          aria-label={`Kéo để sắp xếp danh sách ${list.name}`}
          className="shrink-0 cursor-grab rounded p-1 text-gray-500 outline-none hover:bg-gray-200 hover:text-gray-900 focus-visible:ring-2 focus-visible:ring-blue-500 active:cursor-grabbing disabled:cursor-not-allowed"
          disabled={disabled}
          style={{ touchAction: "none" }}
          type="button"
          {...attributes}
          {...listeners}
        >
          <svg aria-hidden="true" className="h-4 w-4" fill="currentColor" viewBox="0 0 16 16">
            <circle cx="5" cy="3" r="1.2" />
            <circle cx="11" cy="3" r="1.2" />
            <circle cx="5" cy="8" r="1.2" />
            <circle cx="11" cy="8" r="1.2" />
            <circle cx="5" cy="13" r="1.2" />
            <circle cx="11" cy="13" r="1.2" />
          </svg>
        </button>
      </div>
      <p className="rounded-lg bg-white/70 p-3 text-xs text-gray-500">
        Chưa có thẻ nào trong danh sách.
      </p>
    </article>
  );
}
