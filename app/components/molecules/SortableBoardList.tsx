"use client";

import { useSortable } from "@dnd-kit/sortable";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Fragment,
  useId,
  useState,
  type FormEvent,
  type KeyboardEvent,
} from "react";

import type {
  BoardList,
  BoardTask,
} from "@/app/types/board";

import SortableTaskCard from "./SortableTaskCard";

type SortableBoardListProps = {
  list: BoardList;
  dropPreview: { index: number; card: BoardTask } | null;
  disabled: boolean;
  canAddCards: boolean;
  onAddCard: (listId: string, title: string) => Promise<BoardTask>;
  onRenameList: (listId: string, name: string) => Promise<string>;
  onUpdateCard: (cardId: string, title: string) => Promise<BoardTask>;
  onToggleCardCompleted: (
    cardId: string,
    isCompleted: boolean,
  ) => Promise<BoardTask>;
  onOpenCardDetails: (cardId: string) => void;
};

export default function SortableBoardList({
  list,
  dropPreview,
  disabled,
  canAddCards,
  onAddCard,
  onRenameList,
  onUpdateCard,
  onToggleCardCompleted,
  onOpenCardDetails,
}: SortableBoardListProps) {
  const { attributes, isDragging, listeners, setNodeRef, transform, transition } =
    useSortable({ id: `list:${list.id}`, disabled });
  const inputId = useId();
  const [isAdding, setIsAdding] = useState(false);
  const [title, setTitle] = useState("");
  const [isEditingName, setIsEditingName] = useState(false);
  const [listName, setListName] = useState(list.name);
  const [isSavingName, setIsSavingName] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function cancelNameEdit() {
    setListName(list.name);
    setNameError(null);
    setIsEditingName(false);
  }

  async function saveListName() {
    const trimmedName = listName.trim();
    if (!trimmedName || isSavingName) return;
    if (trimmedName === list.name) {
      setIsEditingName(false);
      setNameError(null);
      return;
    }

    setIsSavingName(true);
    setNameError(null);
    try {
      const savedName = await onRenameList(list.id, trimmedName);
      setListName(savedName);
      setIsEditingName(false);
    } catch (cause: unknown) {
      console.error("Failed to update board list name.", cause);
      setNameError("Không thể cập nhật tên danh sách. Vui lòng thử lại.");
    } finally {
      setIsSavingName(false);
    }
  }

  function handleNameKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    event.stopPropagation();
    if (event.key === "Escape") {
      event.preventDefault();
      cancelNameEdit();
    } else if (event.key === "Enter") {
      event.preventDefault();
      void saveListName();
    }
  }

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
      onDragStartCapture={(event) => {
        if (isEditingName) event.stopPropagation();
      }}
      className="flex max-h-full min-h-32 w-72 shrink-0 flex-col rounded-xl bg-gray-100 p-3 text-gray-900 shadow-sm"
      style={{
        opacity: isDragging ? 0.45 : 1,
        transform: CSS.Transform.toString(transform),
        transition,
      }}
    >
      <div className="mb-3 flex items-start justify-between gap-2 px-1">
        {isEditingName ? (
          <div className="min-w-0 flex-1">
            <input
              aria-label="Tên danh sách"
              autoFocus
              className="w-full rounded border border-blue-400 bg-white px-2 py-1 text-sm font-semibold outline-none focus:ring-2 focus:ring-blue-100"
              disabled={isSavingName}
              maxLength={150}
              onChange={(event) => {
                setListName(event.target.value);
                setNameError(null);
              }}
              onKeyDown={handleNameKeyDown}
              onPointerDown={(event) => event.stopPropagation()}
              value={listName}
            />
            {nameError && (
              <p className="mt-1 text-xs text-red-600" role="alert">
                {nameError}
              </p>
            )}
            <div className="mt-1 flex gap-2 text-xs">
              <button
                className="font-medium text-blue-700 hover:underline disabled:opacity-50"
                disabled={!listName.trim() || isSavingName}
                onClick={() => void saveListName()}
                type="button"
              >
                {isSavingName ? "Đang lưu..." : "Lưu"}
              </button>
              <button
                className="text-gray-500 hover:underline disabled:opacity-50"
                disabled={isSavingName}
                onClick={cancelNameEdit}
                type="button"
              >
                Hủy
              </button>
            </div>
          </div>
        ) : (
          <button
            className="min-w-0 flex-1 break-words rounded px-1 text-left text-sm font-semibold hover:bg-gray-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:cursor-default disabled:hover:bg-transparent"
            disabled={disabled}
            onClick={() => {
              setListName(list.name);
              setIsEditingName(true);
            }}
            type="button"
          >
            {listName}
          </button>
        )}
        <button
          aria-label={`Kéo để sắp xếp danh sách ${list.name}`}
          className="shrink-0 cursor-grab rounded p-1 text-gray-500 outline-none hover:bg-gray-200 hover:text-gray-900 focus-visible:ring-2 focus-visible:ring-blue-500 active:cursor-grabbing disabled:cursor-not-allowed"
          disabled={disabled || isEditingName}
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
            {list.cards.map((card, index) => (
              <Fragment key={card.id}>
                {dropPreview?.index === index && (
                  <article
                    aria-hidden="true"
                    className="flex min-h-12 items-center rounded-lg border-2 border-dashed border-blue-400 bg-blue-50/70 px-3 py-2 text-sm text-blue-700"
                  >
                    <span className="line-clamp-2 break-words">
                      {dropPreview.card.title}
                    </span>
                  </article>
                )}
                <SortableTaskCard
                  card={card}
                  disabled={disabled || !canAddCards}
                  onOpenCardDetails={onOpenCardDetails}
                  onToggleCompleted={onToggleCardCompleted}
                  onSave={onUpdateCard}
                />
              </Fragment>
            ))}
            {dropPreview?.index === list.cards.length && (
              <article
                aria-hidden="true"
                className="flex min-h-12 items-center rounded-lg border-2 border-dashed border-blue-400 bg-blue-50/70 px-3 py-2 text-sm text-blue-700"
              >
                <span className="line-clamp-2 break-words">
                  {dropPreview.card.title}
                </span>
              </article>
            )}
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
