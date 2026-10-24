"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import type { WorkspaceBoard } from "@/app/types/workspace";

type SortableBoardCardProps = {
  board: WorkspaceBoard;
  disabled: boolean;
};

export default function SortableBoardCard({ board, disabled }: SortableBoardCardProps) {
  const { attributes, isDragging, listeners, setNodeRef, transform, transition } =
    useSortable({ id: board.id, disabled });

  return (
    <article
      ref={setNodeRef}
      className="relative flex h-36 w-64 shrink-0 flex-col justify-between overflow-hidden rounded-xl border border-gray-200 bg-white p-4 text-left text-gray-900 shadow-sm transition hover:border-blue-200 hover:shadow-md"
      style={{
        opacity: isDragging ? 0.45 : 1,
        transform: CSS.Transform.toString(transform),
        transition,
      }}
    >
      <div className="relative flex items-start justify-between gap-2">
        <span className="line-clamp-2 text-base font-semibold">{board.name}</span>
        <button
          aria-label={`Kéo để sắp xếp bảng ${board.name}`}
          className="shrink-0 cursor-grab rounded p-1 text-gray-500 outline-none hover:bg-gray-100 hover:text-gray-900 focus-visible:ring-2 focus-visible:ring-blue-500 active:cursor-grabbing disabled:cursor-not-allowed"
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
      <span className="relative line-clamp-2 text-xs leading-5 text-gray-500">
        {board.description || "Kéo để thay đổi thứ tự"}
      </span>
    </article>
  );
}
