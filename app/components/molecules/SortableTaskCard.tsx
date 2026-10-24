"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import type { BoardTask } from "@/app/types/board";

type SortableTaskCardProps = {
  card: BoardTask;
  disabled: boolean;
};

export default function SortableTaskCard({
  card,
  disabled,
}: SortableTaskCardProps) {
  const { attributes, isDragging, listeners, setNodeRef, transform, transition } =
    useSortable({ id: `card:${card.id}`, disabled });

  return (
    <article
      ref={setNodeRef}
      className="flex items-start justify-between gap-2 rounded-lg bg-white p-3 text-sm shadow-sm"
      style={{
        opacity: isDragging ? 0.45 : 1,
        transform: CSS.Transform.toString(transform),
        transition,
      }}
    >
      <span className="min-w-0 flex-1 break-words">{card.title}</span>
      <button
        aria-label={`Kéo để sắp xếp thẻ ${card.title}`}
        className="shrink-0 cursor-grab rounded p-1 text-gray-400 outline-none hover:bg-gray-100 hover:text-gray-700 focus-visible:ring-2 focus-visible:ring-blue-500 active:cursor-grabbing disabled:cursor-not-allowed"
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
    </article>
  );
}
