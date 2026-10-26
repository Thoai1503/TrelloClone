"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  useRef,
  useState,
  type FormEvent,
  type PointerEvent,
  type KeyboardEvent,
} from "react";

import type { BoardTask, CardMemberSummary } from "@/app/types/board";
import { Avatar } from "@/app/components/atoms";
import CardDetailsDialog from "./CardDetailsDialog";

type SortableTaskCardProps = {
  card: BoardTask;
  disabled: boolean;
  boardToken: string;
  onSave: (cardId: string, title: string) => Promise<BoardTask>;
  onToggleCompleted: (
    cardId: string,
    isCompleted: boolean,
  ) => Promise<BoardTask>;
  onDetailsUpdated: (card: BoardTask) => void;
  onMemberAdded: (cardId: string, member: CardMemberSummary) => void;
  onMemberRemoved: (cardId: string, memberId: number) => void;
};

function formatCardDate(date: string): string {
  const [year, month, day] = date.slice(0, 10).split("-").map(Number);
  const formattedDate = `${day} thg ${month}`;
  return year === new Date().getFullYear()
    ? formattedDate
    : `${formattedDate}, ${year}`;
}

export default function SortableTaskCard({
  card,
  disabled,
  boardToken,
  onSave,
  onToggleCompleted,
  onDetailsUpdated,
  onMemberAdded,
  onMemberRemoved,
}: SortableTaskCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [title, setTitle] = useState(card.title);
  const [isCompleted, setIsCompleted] = useState(card.is_completed);
  const [isSaving, setIsSaving] = useState(false);
  const [isUpdatingCompletion, setIsUpdatingCompletion] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const startDate = card.start_date?.slice(0, 10) ?? null;
  const dueDate = card.due_date?.slice(0, 10) ?? null;
  const commentCount = card.activityFeed.filter(
    (item) => item.kind === "comment",
  ).length;
  const hasCardFooter = Boolean(
    card.members.length > 0 ||
      card.description?.trim() ||
      dueDate ||
      commentCount > 0,
  );
  const pointerStart = useRef<{ x: number; y: number } | null>(null);
  const suppressNextClick = useRef(false);
  const {
    attributes,
    isDragging,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: `card:${card.id}`, disabled: disabled || isEditing });

  function stopDrag(event: PointerEvent | KeyboardEvent) {
    event.stopPropagation();
  }

  function handlePointerDownCapture(event: PointerEvent<HTMLElement>) {
    pointerStart.current = { x: event.clientX, y: event.clientY };
    suppressNextClick.current = false;
  }

  function handlePointerMoveCapture(event: PointerEvent<HTMLElement>) {
    const start = pointerStart.current;
    if (!start) return;
    const distance = Math.hypot(
      event.clientX - start.x,
      event.clientY - start.y,
    );
    if (distance > 6) suppressNextClick.current = true;
  }

  function handlePointerUpCapture() {
    pointerStart.current = null;
    window.setTimeout(() => {
      suppressNextClick.current = false;
    }, 0);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedTitle = title.trim();
    if (!trimmedTitle || isSaving) return;

    setIsSaving(true);
    setError(null);
    try {
      const updatedCard = await onSave(card.id, trimmedTitle);
      setTitle(updatedCard.title);
      setIsEditing(false);
    } catch (cause: unknown) {
      console.error("Failed to update card title.", cause);
      setError("Không thể cập nhật thẻ. Vui lòng thử lại.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleCompletionChange(nextIsCompleted: boolean) {
    if (isUpdatingCompletion) return;

    const previousIsCompleted = isCompleted;
    setIsCompleted(nextIsCompleted);
    setIsUpdatingCompletion(true);
    setError(null);
    try {
      const updatedCard = await onToggleCompleted(card.id, nextIsCompleted);
      setIsCompleted(updatedCard.is_completed);
    } catch (cause: unknown) {
      console.error("Failed to update card completion status.", cause);
      setIsCompleted(previousIsCompleted);
      setError("Không thể cập nhật trạng thái thẻ. Vui lòng thử lại.");
    } finally {
      setIsUpdatingCompletion(false);
    }
  }

  return (
    <article
      {...attributes}
      ref={setNodeRef}
      className={`group relative flex items-start justify-between gap-2 rounded-lg bg-white p-3 text-sm shadow-sm ${
        hasCardFooter ? "pb-11" : ""
      } ${disabled || isEditing ? "" : "cursor-grab active:cursor-grabbing"}`}
      onClick={(event) => {
        if (suppressNextClick.current) {
          suppressNextClick.current = false;
          return;
        }
        if (
          event.target instanceof Element &&
          event.target.closest("button, input, textarea, form")
        ) {
          return;
        }
        setIsDetailsOpen(true);
      }}
      onPointerDownCapture={handlePointerDownCapture}
      onPointerMoveCapture={handlePointerMoveCapture}
      onPointerUpCapture={handlePointerUpCapture}
      style={{
        opacity: isDragging ? 0.45 : 1,
        transform: CSS.Transform.toString(transform),
        transition,
        touchAction: disabled || isEditing ? undefined : "none",
      }}
      {...(!isEditing ? listeners : {})}
    >
      {isEditing ? (
        <form
          className="min-w-0 flex-1 space-y-2"
          onPointerDown={stopDrag}
          onSubmit={handleSubmit}
        >
          <label className="sr-only" htmlFor={`card-title-${card.id}`}>
            Nội dung thẻ
          </label>
          <textarea
            autoFocus
            className="min-h-16 w-full resize-y rounded border border-blue-400 px-2 py-1.5 text-sm outline-none focus:ring-2 focus:ring-blue-100"
            disabled={isSaving}
            id={`card-title-${card.id}`}
            maxLength={255}
            onChange={(event) => {
              setTitle(event.target.value);
              setError(null);
            }}
            onKeyDown={stopDrag}
            value={title}
          />
          {error && (
            <p className="text-xs text-red-600" role="alert">
              {error}
            </p>
          )}
          <div className="flex items-center gap-2">
            <button
              className="rounded bg-blue-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
              disabled={!title.trim() || isSaving}
              onKeyDown={stopDrag}
              type="submit"
            >
              {isSaving ? "Đang lưu..." : "Lưu"}
            </button>
            <button
              className="rounded px-2 py-1 text-xs text-gray-600 hover:bg-gray-100 disabled:opacity-50"
              disabled={isSaving}
              onClick={() => {
                setTitle(card.title);
                setError(null);
                setIsEditing(false);
              }}
              onKeyDown={stopDrag}
              type="button"
            >
              Hủy
            </button>
          </div>
        </form>
      ) : (
        <>
          {!disabled && (
            <span className="relative mt-0.5 h-4 w-0 shrink-0 overflow-hidden opacity-0 transition-all duration-150 group-hover:w-4 group-hover:opacity-100 group-focus-within:w-4 group-focus-within:opacity-100">
              <input
                aria-label={
                  isCompleted
                    ? `Bỏ đánh dấu hoàn thành: ${card.title}`
                    : `Đánh dấu hoàn thành: ${card.title}`
                }
                checked={isCompleted}
                className="absolute inset-0 z-10 h-4 w-4 cursor-pointer appearance-none rounded-full border-2 border-gray-400 bg-white opacity-0 outline-none transition checked:border-green-600 checked:bg-green-600 focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2 group-hover:opacity-100"
                disabled={isUpdatingCompletion}
                onChange={(event) =>
                  void handleCompletionChange(event.currentTarget.checked)
                }
                onClick={(event) => event.stopPropagation()}
                onKeyDown={stopDrag}
                onPointerDown={stopDrag}
                title={
                  isCompleted
                    ? "Đánh dấu chưa hoàn thành"
                    : "Đánh dấu hoàn thành"
                }
                type="checkbox"
              />
              {isCompleted && (
                <svg
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 h-4 w-4 text-white"
                  fill="none"
                  viewBox="0 0 16 16"
                >
                  <path
                    d="m4 8 2.5 2.5L12 5"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                  />
                </svg>
              )}
            </span>
          )}
          <span
            className={`min-w-0 flex-1 break-words ${
              isCompleted ? "text-gray-400 line-through" : ""
            }`}
          >
            {card.title}
          </span>
          {!disabled && (
            <div className="flex shrink-0 items-center gap-1">
              <button
                aria-label={`Chỉnh sửa thẻ ${card.title}`}
                className="shrink-0 rounded p-1 text-gray-400 opacity-0 outline-none transition hover:bg-gray-100 hover:text-gray-700 focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-blue-500 group-hover:opacity-100"
                onClick={() => {
                  setTitle(card.title);
                  setError(null);
                  setIsEditing(true);
                }}
                onKeyDown={stopDrag}
                onPointerDown={stopDrag}
                title="Chỉnh sửa thẻ"
                type="button"
              >
                <svg
                  aria-hidden="true"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 20 20"
                >
                  <path
                    d="m13.5 4.5 2 2m-9 9-2.5.5.5-2.5L13.6 2.4a1.4 1.4 0 0 1 2 0l2 2a1.4 1.4 0 0 1 0 2L6.5 16ZM4 18h12"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="1.5"
                  />
                </svg>
              </button>
            </div>
          )}
        </>
      )}
      {card.members.length > 0 && (
        <div
          aria-label="Thành viên của thẻ"
          className="absolute bottom-2 right-2 flex -space-x-2"
        >
          {card.members.map((member) => {
            const label =
              member.full_name?.trim() ||
              member.email ||
              `Thành viên ${member.id}`;
            return (
              <span className="rounded-full ring-2 ring-white" key={member.id}>
                <Avatar
                  imageUrl={member.avatar_url}
                  label={label}
                  size="small"
                  title={member.email || label}
                  userId={member.id}
                />
              </span>
            );
          })}
        </div>
      )}
      {(card.description?.trim() || dueDate || commentCount > 0) && (
        <div className="absolute bottom-2 left-3 flex max-w-[calc(100%-5rem)] items-center gap-2 text-gray-500">
          {commentCount > 0 && (
            <span
              aria-label={`${commentCount} bình luận`}
              className="inline-flex shrink-0 items-center gap-1 text-xs"
              title={`${commentCount} bình luận`}
            >
              <svg
                aria-hidden="true"
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 20 20"
              >
                <path
                  d="M4 4.5h12a1.5 1.5 0 0 1 1.5 1.5v7a1.5 1.5 0 0 1-1.5 1.5H9l-4.5 3v-3H4A1.5 1.5 0 0 1 2.5 13V6A1.5 1.5 0 0 1 4 4.5Z"
                  stroke="currentColor"
                  strokeLinejoin="round"
                  strokeWidth="1.4"
                />
              </svg>
              <span>{commentCount}</span>
            </span>
          )}
          {dueDate && (
            <span
              aria-label={
                startDate
                  ? `Thời gian: ${formatCardDate(startDate)} - ${formatCardDate(dueDate)}`
                  : `Hạn: ${formatCardDate(dueDate)}`
              }
              className="inline-flex min-w-0 items-center gap-1 text-xs"
              title={
                startDate
                  ? `${formatCardDate(startDate)} - ${formatCardDate(dueDate)}`
                  : formatCardDate(dueDate)
              }
            >
              <svg
                aria-hidden="true"
                className="h-4 w-4 shrink-0"
                fill="none"
                viewBox="0 0 20 20"
              >
                <circle
                  cx="10"
                  cy="10"
                  r="7.5"
                  stroke="currentColor"
                  strokeWidth="1.5"
                />
                <path
                  d="M10 5.5V10l3 2"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeWidth="1.5"
                />
              </svg>
              <span className="truncate">
                {startDate
                  ? `${formatCardDate(startDate)} - ${formatCardDate(dueDate)}`
                  : formatCardDate(dueDate)}
              </span>
            </span>
          )}
          {card.description?.trim() && (
            <span aria-label="Có mô tả" className="shrink-0" title="Có mô tả">
              <svg
                aria-hidden="true"
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 20 20"
              >
                <path
                  d="M5 3.5h7l3 3v10H5a1.5 1.5 0 0 1-1.5-1.5V5A1.5 1.5 0 0 1 5 3.5Z"
                  stroke="currentColor"
                  strokeLinejoin="round"
                  strokeWidth="1.4"
                />
                <path
                  d="M7 9h6m-6 3h6m-6 3h4"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeWidth="1.4"
                />
              </svg>
            </span>
          )}
        </div>
      )}
      {isDetailsOpen && (
        <CardDetailsDialog
          boardToken={boardToken}
          canEdit={!disabled}
          card={card}
          onCardUpdated={onDetailsUpdated}
          onClose={() => setIsDetailsOpen(false)}
          onMemberAdded={onMemberAdded}
          onMemberRemoved={onMemberRemoved}
        />
      )}
    </article>
  );
}
