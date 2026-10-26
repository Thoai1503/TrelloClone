"use client";

import { useSortable } from "@dnd-kit/sortable";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useId, useState, type FormEvent } from "react";

import type {
  BoardList,
  BoardTask,
  CardMemberSummary,
} from "@/app/types/board";

import SortableTaskCard from "./SortableTaskCard";

type SortableBoardListProps = {
  list: BoardList;
  disabled: boolean;
  canAddCards: boolean;
  boardToken: string;
  onAddCard: (listId: string, title: string) => Promise<BoardTask>;
  onUpdateCard: (cardId: string, title: string) => Promise<BoardTask>;
  onToggleCardCompleted: (
    cardId: string,
    isCompleted: boolean,
  ) => Promise<BoardTask>;
  onCardDetailsUpdated: (card: BoardTask) => void;
  onCardMemberAdded: (cardId: string, member: CardMemberSummary) => void;
  onCardMemberRemoved: (cardId: string, memberId: number) => void;
};

export default function SortableBoardList({
  list,
  disabled,
  canAddCards,
  boardToken,
  onAddCard,
  onUpdateCard,
  onToggleCardCompleted,
  onCardDetailsUpdated,
  onCardMemberAdded,
  onCardMemberRemoved,
}: SortableBoardListProps) {
  const { attributes, isDragging, listeners, setNodeRef, transform, transition } =
    useSortable({ id: `list:${list.id}`, disabled });
  const inputId = useId();
  const [isAdding, setIsAdding] = useState(false);
  const [title, setTitle] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedTitle = title.trim();
    if (!trimmedTitle || isSubmitting) return;

    setIsSubmitting(true);
    setError(null);
    try {
      await onAddCard(list.id, trimmedTitle);
      setTitle("");
      setIsAdding(false);
    } catch (cause: unknown) {
      console.error("Failed to create list card.", cause);
      setError("Không thể tạo thẻ. Vui lòng thử lại.");
    } finally {
      setIsSubmitting(false);
    }
  }

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
      <div className="min-h-0 space-y-2 overflow-y-auto">
        <SortableContext
          items={list.cards.map((card) => `card:${card.id}`)}
          strategy={verticalListSortingStrategy}
        >
          <div className="min-h-4 space-y-2">
            {list.cards.map((card) => (
              <SortableTaskCard
                card={card}
                disabled={disabled || !canAddCards}
                boardToken={boardToken}
                key={card.id}
                onDetailsUpdated={onCardDetailsUpdated}
                onMemberAdded={onCardMemberAdded}
                onMemberRemoved={onCardMemberRemoved}
                onToggleCompleted={onToggleCardCompleted}
                onSave={onUpdateCard}
              />
            ))}
          </div>
        </SortableContext>
        {list.cards.length === 0 && !canAddCards && (
          <p className="rounded-lg bg-white/70 p-3 text-xs text-gray-500">
            Chưa có thẻ nào trong danh sách.
          </p>
        )}
      </div>
      {canAddCards && (
        <div className="mt-2 shrink-0">
          {isAdding ? (
            <form className="space-y-2" onSubmit={handleSubmit}>
              <label className="sr-only" htmlFor={inputId}>
                Tên thẻ
              </label>
              <input
                autoFocus
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                disabled={isSubmitting}
                id={inputId}
                maxLength={255}
                onChange={(event) => {
                  setTitle(event.target.value);
                  setError(null);
                }}
                placeholder="Nhập tên thẻ..."
                value={title}
              />
              {error && (
                <p className="text-xs text-red-600" role="alert">
                  {error}
                </p>
              )}
              <div className="flex items-center gap-2">
                <button
                  className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={!title.trim() || isSubmitting}
                  type="submit"
                >
                  {isSubmitting ? "Đang thêm..." : "Thêm thẻ"}
                </button>
                <button
                  className="rounded-md px-2 py-1.5 text-sm text-gray-600 hover:bg-gray-200 disabled:opacity-50"
                  disabled={isSubmitting}
                  onClick={() => {
                    setIsAdding(false);
                    setTitle("");
                    setError(null);
                  }}
                  type="button"
                >
                  Hủy
                </button>
              </div>
            </form>
          ) : (
            <button
              className="w-full rounded-md px-2 py-2 text-left text-sm text-gray-600 transition hover:bg-gray-200 hover:text-gray-900 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={disabled}
              onClick={() => setIsAdding(true)}
              type="button"
            >
              + Thêm thẻ
            </button>
          )}
        </div>
      )}
    </article>
  );
}
